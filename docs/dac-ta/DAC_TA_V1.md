# Đặc tả dự án XekkoDND — v1.0

**Phiên bản:** 1.0  
**Ngày:** 21/05/2026  
**Người thực hiện:** Xekko (solo)  
**Thời gian mục tiêu:** 3 tháng (~12 tuần)  
**Nỗ lực:** 2–3 giờ/ngày (~180–225 giờ tổng)  
**Nguồn sự thật:** File này — đặc tả triển khai chính thức.

---

## 1. Tóm tắt

**XekkoDND** là ứng dụng **solo**, **local-first**, dùng **LLM miễn phí qua Ollama** để đóng vai Game Master cho **campaign D&D có cấu trúc** (có sẵn hoặc homebrew). Người chơi giao tiếp bằng **tiếng Việt**, tùy chỉnh phong cách kể chuyện và persona GM.

**Vấn đề cần giải:** AI hay quên chi tiết campaign dài.  
**Giải pháp cốt lõi:** Trạng thái game (HP, NPC, quest, vị trí, inventory) lưu trong **database có cấu trúc**; LLM chỉ kể chuyện; một bước trích xuất state sau mỗi lượt cập nhật DB (pattern học từ Friends & Fables, đơn giản hóa cho solo dev).

**Không phải mục tiêu:** Cạnh tranh thị trường, multiplayer, D&D 5e simulator đầy đủ, map/image/voice trong 3 tháng.

---

## 2. Ràng buộc & giả định

| Hạng mục | Giá trị |
|----------|---------|
| Thời gian | 12 tuần × 5–6 ngày × 2–3h ≈ **180–225 giờ** |
| Kỹ năng | Vibe coding + AI pair (Cursor); ưu tiên TypeScript monorepo hiện có |
| Máy người chơi | Ollama cài riêng; khuyến nghị 16GB RAM, GPU 6GB+ (7B Q4) |
| Ngôn ngữ game | Tiếng Việt mặc định; preset phong cách **không** bắt buộc Hán-Việt |
| Triển khai 3 tháng | **Web local** (Next.js + Ollama localhost); Tauri desktop **tùy chọn** tuần 11–12 nếu còn giờ |

---

## 3. Phạm vi đã điều chỉnh (tăng khả năng hoàn thành)

### 3.1 Giữ nguyên — chức năng cốt lõi (bắt buộc trong 3 tháng)

| # | Chức năng | Mô tả ngắn |
|---|-----------|------------|
| C1 | **Ollama local** | Kết nối `localhost:11434`, chọn model, test connection |
| C2 | **Campaign có cấu trúc** | Load folder: `campaign.yaml` + scene Markdown/YAML |
| C3 | **Scene runner** | Biết scene hiện tại, objective, chuyển scene khi hoàn thành |
| C4 | **Chat GM tiếng Việt** | System prompt VN, không tự quyết hành động người chơi |
| C5 | **Tùy chỉnh kể chuyện** | ≥3 preset phong cách + ≥2 persona GM + custom text |
| C6 | **Character sheet cứng** | HP, AC, 6 stats, level, gold — nguồn sự thật từ DB |
| C7 | **Pipeline chống quên** | Context Builder (TS) → Narrative LLM → State Extractor → cập nhật DB |
| C8 | **NPC / Location / Quest** | Bảng DB + tab Notebook xem/sửa tay |
| C9 | **Story Cards** | Keyword trigger, inject vào context |
| C10 | **Dice + rule cốt lõi** | Roll tự động khi AI yêu cầu; 5 rule: skill check, save, attack, damage, HP |
| C11 | **Memory tóm tắt** | Mỗi **8–10 lượt** tóm tắt vào bảng memories (không semantic search phức tạp) |
| C12 | **Save / Load** | Auto-save mỗi lượt + export/import JSON backup |
| C13 | **Campaign mẫu** | 1 homebrew tiếng Việt, 5 scene, đủ chơi thử 30–45 phút |

### 3.2 Đẩy sau 3 tháng (v1.1+)

- Tauri desktop (nếu không kịp tuần 11–12)
- Do / Say / Story mode riêng (MVP: một ô chat + prefix tùy chọn)
- Combat tracker initiative đầy đủ, grid chiến thuật
- Memory retrieval semantic (vector)
- NPC relationship score tự động
- SRD đầy đủ (300+ spell, 500+ monster)
- Image gen, TTS, ambient audio
- Map editor, world builder GUI
- Spell slot / concentration / encumbrance đầy đủ
- Multi-backend (LM Studio, KoboldCpp)

### 3.3 Cắt hẳn (không làm)

- Sidecar Tauri tự spawn Ollama / ComfyUI
- Cloud API bắt buộc (Gemini/Groq chỉ optional fallback tương lai)
- Multiplayer, đăng nhập, cloud sync
- Marketing / public release bắt buộc

---

## 4. Kiến trúc kỹ thuật

### 4.1 Stack (chốt cho 3 tháng)

```
┌─────────────────────────────────────────┐
│  Next.js 15 (apps/web)                  │
│  UI: Chat, Sheet, Notebook, Settings    │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  @xekko/core (packages/core)            │
│  - CampaignLoader / SceneRunner         │
│  - ContextBuilder                       │
│  - GamePipeline (Narrative + Extract)   │
│  - RuleEngine (5 rule MVP)              │
│  - DiceEngine                           │
└─────────────────┬───────────────────────┘
                  │
     ┌────────────┼────────────┐
     ▼            ▼            ▼
 IndexedDB    Ollama       Campaign
 (Dexie)    :11434       files (.md/.yaml)
```

- **Codebase chính:** `xekkodnd-monorepo/` (TypeScript).  
- **Python Streamlit** (`app.py`): chỉ tham khảo, không phát triển thêm.  
- **Lưu trữ M1–M3:** Dexie.js (IndexedDB) — đủ local, không cần Tauri để kịp deadline. Migrate SQLite khi wrap Tauri sau.

### 4.2 Luồng một lượt chơi

```
1. Người chơi nhập hành động (tiếng Việt)
2. ContextBuilder (không LLM):
   - character, scene, NPC liên quan (keyword), quest active,
     story cards match, 2 memory gần nhất, 8 tin nhắn gần nhất
3. Narrative LLM (Ollama):
   - Kể 3–6 câu; có thể output marker: {"need_roll":"1d20+3","dc":15}
4. Nếu need_roll → DiceEngine (TS) → gửi kết quả lại LLM (1 lần ngắn)
5. State Extractor LLM (cùng model, prompt khác):
   - Output JSON: hp_delta, location, npc_updates, items, quest_updates
6. StateApplier (TS + Zod): validate → ghi IndexedDB
7. Mỗi 8–10 lượt: Memory Summary LLM → bảng memories
8. UI refresh sheet + notebook
```

**Tối ưu cho 2–3h/ngày:** Không bắt buộc 3 LLM call mỗi lượt nếu không có thay đổi state — Extractor có thể skip khi narrative không có delta (heuristic đơn giản).

---

## 5. Yêu cầu chức năng chi tiết

### 5.1 Module: Cài đặt & Ollama (FR-SET)

| ID | Yêu cầu | Tiêu chí chấp nhận |
|----|---------|-------------------|
| FR-SET-01 | Kiểm tra kết nối Ollama | Nút "Test" → OK/Fail + hướng dẫn cài |
| FR-SET-02 | Chọn model | Dropdown model từ `/api/tags` |
| FR-SET-03 | Temperature, top-p | Slider, lưu persist |
| FR-SET-04 | Ngôn ngữ GM | Mặc định `vi-VN` |
| FR-SET-05 | Rule strictness | `balanced` mặc định; strict/loose |

### 5.2 Module: Campaign (FR-CAM)

| ID | Yêu cầu | Tiêu chí chấp nhận |
|----|---------|-------------------|
| FR-CAM-01 | Chọn thư mục campaign | Load `campaign.yaml` hợp lệ |
| FR-CAM-02 | Parse scene MD | YAML frontmatter + 3 section: GM / Read-aloud / Hint |
| FR-CAM-03 | Scene hiện tại | Hiển thị title + objectives |
| FR-CAM-04 | Advance scene | Khi objective done (manual confirm hoặc AI flag) |
| FR-CAM-05 | Read-aloud | GM dùng đúng block khi vào scene |
| FR-CAM-06 | Reload campaign | Nút reload sau khi sửa file ngoài app |

### 5.3 Module: Chat & AI GM (FR-CHAT)

| ID | Yêu cầu | Tiêu chí chấp nhận |
|----|---------|-------------------|
| FR-CHAT-01 | Lịch sử chat | Scroll, markdown cơ bản |
| FR-CHAT-02 | Streaming | Token stream (ưu tiên tuần 7+) |
| FR-CHAT-03 | Retry 1 lượt | Gọi lại narrative lượt trước |
| FR-CHAT-04 | System prompt slots | style, persona, scene, character, memories |
| FR-CHAT-05 | Không spoil / không auto-action | Prompt + test 5 case |

### 5.4 Module: State & Memory (FR-MEM) — cốt lõi nhất

| ID | Yêu cầu | Tiêu chí chấp nhận |
|----|---------|-------------------|
| FR-MEM-01 | Character trong DB | Mọi thay đổi HP/stats qua extractor hoặc UI |
| FR-MEM-02 | NPC codex | Tạo/cập nhật từ extractor; sửa tay được |
| FR-MEM-03 | Location tracker | `current_location` + danh sách đã đến |
| FR-MEM-04 | Quest journal | id, title, objectives[], status |
| FR-MEM-05 | Story Cards | name, keywords[], body; inject khi match |
| FR-MEM-06 | Auto-summary | Mỗi 8–10 lượt, ≤150 từ, tag location/npc |
| FR-MEM-07 | Fact editor | Tab Notebook sửa NPC/quest/location/inventory |
| FR-MEM-08 | Event log | 20 event gần nhất (HP change, NPC met, quest…) |

### 5.5 Module: Rules & Dice (FR-RULE)

| ID | Yêu cầu | Tiêu chí chấp nhận |
|----|---------|-------------------|
| FR-RULE-01 | Parser lệnh `/roll` | `1d20+5`, `2d6`, adv/dis |
| FR-RULE-02 | AI marker roll | Parse JSON → roll → hiển thị inline |
| FR-RULE-03 | Skill check | DC + modifier → success/fail |
| FR-RULE-04 | Saving throw | 6 ability saves |
| FR-RULE-05 | Attack + damage | vs AC, trừ HP (NPC có HP trong DB) |
| FR-RULE-06 | HP bounds | 0 ≤ hp ≤ max_hp; unconscious/dead flag |

### 5.6 Module: UI (FR-UI)

| ID | Yêu cầu | Tiêu chí chấp nhận |
|----|---------|-------------------|
| FR-UI-01 | Layout 3 vùng | Sheet trái \| Chat giữa \| Notebook phải |
| FR-UI-02 | Character sheet | Xem + chỉnh inline các field chính |
| FR-UI-03 | Notebook tabs | NPC, Location, Quest, Story Cards, Memory |
| FR-UI-04 | Dark theme | Mặc định (đã có trong monorepo) |
| FR-UI-05 | Adventure picker | Màn chọn campaign / tiếp tục |

### 5.7 Module: Lưu trữ (FR-SAVE)

| ID | Yêu cầu | Tiêu chí chấp nhận |
|----|---------|-------------------|
| FR-SAVE-01 | Auto-save mỗi lượt | IndexedDB |
| FR-SAVE-02 | Export JSON | Toàn bộ adventure |
| FR-SAVE-03 | Import JSON | Khôi phục adventure |

---

## 6. Mô hình dữ liệu (IndexedDB / Dexie)

### 6.1 Bảng cốt lõi

| Store | Trường chính |
|-------|----------------|
| `adventures` | id, campaignId, name, currentSceneId, settings, createdAt |
| `characters` | adventureId, name, race, class, level, hp, maxHp, ac, stats, gold, xp, conditions |
| `inventory` | characterId, itemName, qty, equipped, weight |
| `npcs` | adventureId, name, description, location, status, hp, attitude, facts |
| `locations` | adventureId, name, description, visited, parentId |
| `quests` | adventureId, title, objectives[], status |
| `memories` | adventureId, summary, tags[], turnNumber |
| `events` | adventureId, type, payload, turnNumber, timestamp |
| `story_cards` | adventureId, name, keywords[], body |
| `chat_messages` | adventureId, role, content, turnNumber |
| `settings` | ollamaUrl, model, temperature, stylePreset, persona, strictness |

### 6.2 Quy tắc ground truth

- Chat log **không** là nguồn sự thật cho HP, vàng, quest status.
- Mọi delta từ AI phải qua **StateApplier** + Zod schema.
- Người chơi sửa tay trong Notebook **ghi đè** DB ngay lập tức.

---

## 7. Định dạng campaign (homebrew)

```
my-campaigns/
└── ten-campaign/
    ├── campaign.yaml
    └── scenes/
        ├── 01-intro.md
        └── 02-...
```

**campaign.yaml tối thiểu:**

```yaml
title: "Tiêu đề"
language: vi-VN
starting_scene: "01-intro"
narrative_style:
  default: high-fantasy-traditional
gm_persona:
  default: wise-narrator
```

**Scene file:** YAML frontmatter (`id`, `title`, `objectives`, `triggers_next`) + 3 section Markdown như mô tả trong `Đặc tả cơ bản.txt` (phần campaign v3).

---

## 8. Preset phong cách & persona (MVP)

### 8.1 Narrative presets (3 + custom)

| ID | Tên | Ghi chú |
|----|-----|---------|
| `high-fantasy-traditional` | Fantasy trang trọng | Mặc định |
| `light-hearted` | Nhẹ nhàng, hài hước | |
| `kiem-hiep` | Kiếm hiệp | Tùy chọn, không bắt buộc |
| `custom` | User nhập prompt | |

### 8.2 GM persona (2 + custom)

| ID | Tên |
|----|-----|
| `wise-narrator` | Lão kể chuyện |
| `dramatic-bard` | Kịch tính |
| `custom` | User nhập |

---

## 9. Lộ trình 12 tuần (2–3 giờ/ngày)

**Tổng:** ~12 milestone nhỏ, mỗi tuần 1 deliverable chơi được hoặc test được.

### Tháng 1 — Nền + chat chạy thật (Tuần 1–4)

| Tuần | Giờ ước tính | Mục tiêu | Deliverable |
|------|--------------|----------|-------------|
| **1** | 12–15h | Ollama + types + Dexie schema | Test Ollama VN; DB tạo/load object |
| **2** | 12–15h | `OllamaService` + Settings UI + prompt master VN | Gửi 1 câu → nhận narrative tiếng Việt |
| **3** | 12–15h | CampaignLoader + SceneRunner + inject scene | Load campaign mẫu; hiển thị scene 01 |
| **4** | 12–15h | Nối Chat UI ↔ Ollama (bỏ mock) + layout 3 vùng | **Gate 1:** Chat 15 phút trong scene 01 |

### Tháng 2 — Chống quên + sheet + dice (Tuần 5–8)

| Tuần | Giờ ước tính | Mục tiêu | Deliverable |
|------|--------------|----------|-------------|
| **5** | 12–15h | ContextBuilder + Character vào DB | Context < 6k token; sheet đọc từ DB |
| **6** | 12–15h | State Extractor + StateApplier + Zod | HP/NPC đổi sau lượt → DB đúng |
| **7** | 12–15h | Notebook (NPC, Location, Quest) + Fact editor | Sửa tay NPC → AI lượt sau thấy |
| **8** | 12–15h | Dice auto + 5 rule + `/roll` | AI gọi roll → app xử lý đúng |

### Tháng 3 — Hoàn thiện + campaign mẫu (Tuần 9–12)

| Tuần | Giờ ước tính | Mục tiêu | Deliverable |
|------|--------------|----------|-------------|
| **9** | 12–15h | Story Cards + Memory summary (8–10 lượt) | Keyword "Lão Văn" → AI nhớ |
| **10** | 12–15h | Preset style/persona + Scene advance + Event log | Đổi kiếm hiệp → tone khác |
| **11** | 12–15h | Campaign mẫu 5 scene VN + Export/Import + Retry | Chơi thử 30–45 phút |
| **12** | 12–15h | Bugfix + playtest + buffer (+ Tauri nếu còn giờ) | **Gate 2:** Hoàn thành campaign mẫu |

### Cổng kiểm tra (Go/No-Go)

| Gate | Tuần | Điều kiện pass |
|------|------|----------------|
| **Gate 1** | 4 | Chat Ollama tiếng Việt trong 1 scene, không crash |
| **Gate 2** | 12 | 5 scene xong; reload app; HP/NPC/quest khớp DB |

---

## 10. Tiêu chí hoàn thành dự án (3 tháng)

Coi dự án **hoàn thành v1.0** khi tất cả điều kiện sau đúng:

1. Chạy local: Next.js + Ollama, không bắt buộc internet (sau khi pull model).
2. Chơi xong **campaign mẫu 5 scene** bằng tiếng Việt.
3. Sau **≥20 lượt**, HP và ≥1 NPC trong DB **khớp** với diễn biến đã chơi (sai ≤1 field do user chấp nhận sửa tay).
4. Đóng trình duyệt → mở lại → tiếp tục đúng scene và state.
5. Đổi preset phong cách → narrative thay đổi rõ rệt.
6. Export JSON → Import → state khôi phục.

---

## 11. Rủi ro & giảm thiểu

| Rủi ro | Mức | Giảm thiểu |
|--------|-----|------------|
| Model VN kém | Cao | Tuần 1 test Qwen 7B vs Llama 8B; đổi trong Settings |
| Extractor JSON sai | Cao | Zod + retry 1 lần; UI sửa fact |
| 2 codebase song song | Trung | Chỉ code `xekkodnd-monorepo` |
| Scope creep | Cao | Mọi ý tưởng mới → `docs/IDEAS_V2.md` |
| Burn out | Trung | Thứ 6 playtest 30 phút; không refactor sớm |
| Tauri trễ | Thấp | Web local đủ v1.0 |

**Xác suất hoàn thành v1.0 với phạm vi này:** ~**70–75%** (với 2–3h/ngày đều đặn).

---

## 12. Tham chiếu code hiện có

| Đã có | Cần làm |
|--------|---------|
| `@xekko/core` RuleEngine, CampaignPresenter, LayeredMemory | CampaignLoader, GamePipeline, OllamaService |
| `apps/web` GameLayout, CharacterSheet, Chat (mock) | Nối pipeline, Dexie, Settings |
| `app.py` Streamlit + Ollama mẫu | Archive, không mở rộng |
| `docs/roadmap.md` | Tóm tắt; chi tiết theo file này |

---

## 13. Tài liệu trong thư mục `docs/dac-ta/`

| File | Vai trò |
|------|---------|
| **`DAC_TA_V1.md`** | **Đặc tả triển khai chính thức (file này)** |
| **`Đặc tả cơ bản.txt`** | Research, hội thoại, phân tích khả thi v1–v4 — tham khảo |
| `README.md` | Mục lục thư mục đặc tả |

| File ngoài thư mục | Vai trò |
|--------------------|---------|
| `docs/roadmap.md` | Roadmap tóm tắt 12 tuần |
| `docs/backlog.md` | Epic backlog |
| `docs/IDEAS_V2.md` | Ý tưởng ngoài scope v1 |

---

## 14. Checklist bắt đầu tuần 1

- [ ] Cài Ollama, pull `qwen2.5:7b-instruct-q4_K_M` (hoặc model đã test VN tốt)
- [ ] `pnpm install` trong `xekkodnd-monorepo`
- [ ] Tạo `packages/core/src/campaign/types.ts`
- [ ] Tạo `apps/web/src/lib/db.ts` (Dexie schema theo mục 6)
- [ ] Test curl Ollama narrative tiếng Việt 1 đoạn

---

*XekkoDND v1.0 — personal local campaign player. Đặc tả này ưu tiên **xong trong 3 tháng** hơn **đầy đủ tính năng**.*
