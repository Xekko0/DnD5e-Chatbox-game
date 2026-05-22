# Memory Architecture — XekkoDND

> Chi tiết về hệ thống memory 3 lớp theo PLAN_V5 §4.4 (Trụ 4)

---

## Vấn đề cần giải quyết

AI quên vì 3 lý do:
1. **Context window hữu hạn** — Qwen 7B max 128k token, nhưng dùng ~6k/turn để nhanh
2. **Lưu text blob** — Chat history dài → AI không tổng hợp được thông tin cũ
3. **Không có ground truth** — AI có thể "tự bịa" HP, inventory sai với thực tế

---

## Giải pháp: 3-Layer Architecture

```
LAYER 1: NARRATIVE LLM
   Input: Working Context (~6k token)
   Output: Text narrative + dice markers + entity tags
   ↓
LAYER 2: EXTRACTOR LLMs (parallel, conditional)
   ├── State Extractor   → JSON: {hp_delta, conditions, equip}
   ├── Item Detector     → JSON: {detected_items[]}
   ├── Movement Detector → JSON: {entity_id, to_tile}
   └── Branch Detector   → JSON: {branch_id, confidence}
   ↓
LAYER 3: DATABASE (ground truth)
   SQLite / Dexie IndexedDB
   28 bảng — entities, inventory, quests, memories, maps...
```

---

## Working Context Builder (~4-6k token/turn)

```
[STATE BLOCK ~800 token]
  - Character stats (HP, AC, conditions, equipped)
  - Active quest + current objectives
  - World state (location, time, weather)

[MAP BLOCK ~500 token]
  - Current map tier + position
  - Nearby tile items + adjacent entities
  - Recent movement

[MEMORIES BLOCK ~600 token]
  - Top 3 memories (keyword match → BM25 M2 → semantic M3)
  - Retrieval: overlap keywords với player input

[STORY CARDS ~400 token]
  - Active story cards (user-defined memory pins)

[CHAT HISTORY ~1500 token]
  - Last 10 messages (gần đây nhất)

[PLAYER INPUT ~200 token]
```

---

## Auto-Summary (Memory Summarizer)

Chạy async sau mỗi 5 turn (không block UI):

```
1. Gom 5 turn chat vừa qua (~2000 token)
2. LLM call: "Tóm tắt ~100 từ. Tags: location, NPCs, importance 1-5"
3. Lưu vào `memories` table:
   { id, adventure_id, summary, tags[], importance, turn_number, created_at }
4. Retrieval: keyword match player input → inject vào Working Context
```

---

## Validation Layers (chống AI sai)

| Layer | Mô tả | Action |
|-------|--------|--------|
| Schema (Zod) | Validate JSON output của extractors | Retry 1 lần nếu fail |
| Sanity rules | HP delta < 100, level không giảm | Skip update, log warning |
| User confirm | Thay đổi lớn (level up, mất item quý) | Modal confirm trước khi apply |
| Notebook editor | User sửa tay mọi thứ | Override DB trực tiếp |
| State injection | DB inject vào prompt đầu mỗi turn | AI không thể "quên" |

---

## Memory Tables (trong DB)

```sql
memories     — auto-summary, có importance score
events       — raw event log mỗi turn
messages     — full chat history
story_cards  — user-created memory pins (manual)
```

---

## Retrieval Strategy

| Phase | Phương pháp | Mô tả |
|-------|-------------|--------|
| M1 | Keyword match | Overlap từ giữa player input và memory summary |
| M2 | BM25 ranking | TF-IDF weighted, tốt hơn keyword naive |
| M3 | Semantic search | Local embeddings (nomic-embed-text qua Ollama) |

Top 3 memories liên quan nhất được inject vào Working Context.

---

## Story Cards

User-defined memory pins. Khác memories (auto):
- Tạo tay hoặc AI suggest
- Luôn active (không bị score out)
- Dùng cho lore quan trọng: NPC đặc biệt, secret, prophecy
- Limit: ~5-10 active cards để không tràn context

---

## Token Budget Summary

```
Turn với Qwen 2.5 7B (128k context, dùng ~6k):
  Narrative call:    ~6300 input + 800 output
  State Extractor:   ~3100 input + 300 output
  Item Detector:     ~2500 input + 200 output (conditional)
  Movement Detector: ~2000 input + 150 output (conditional)
  Branch Detector:   ~2500 input + 200 output (conditional)
  Memory Summarizer: ~2200 input + 200 output (async, mỗi 5 turn)

Tổng active per turn: ~6300 + 3100 = 9400 token bắt buộc
                       + ~2500-4500 optional extractors
Latency target: <30s với Qwen 7B GPU 8GB (RTX 3060/4060)
```
