# Đặc tả Dự án XekkoDND v5.0

## Bản tổng hợp hoàn chỉnh — Solo D&D AI Game

---

## MỤC LỤC

```
1. THÔNG TIN DỰ ÁN
2. TRIẾT LÝ THIẾT KẾ
3. KIẾN TRÚC TỔNG
4. 7 TRỤ HỆ THỐNG
   4.1 Campaign System
   4.2 Character Sheet 2-Tier
   4.3 Interactive Items
   4.4 Memory & State
   4.5 Map System (3-tier)
   4.6 Quest Journal & Branching
   4.7 AI Engine
5. PIPELINE MỖI TURN
6. DATABASE SCHEMA TỔNG
7. TECH STACK
8. ROADMAP THEO PHASE
9. PHỤ LỤC
```

---

## 1. THÔNG TIN DỰ ÁN

### 1.1 Định danh
- **Tên:** XekkoDND
- **Phiên bản đặc tả:** v5.0
- **Loại:** Solo D&D AI Chatbox — chơi 1 người với AI làm Game Master
- **Quy mô:** Personal project, vibe coding, không deadline cứng
- **Phương thức làm:** 1 developer (solo dev) + AI pair programming (Claude/Cursor)

### 1.2 Mục tiêu sản phẩm
Một desktop app chạy local cho phép người dùng:
- Chơi D&D campaign có sẵn (homebrew hoặc pre-built) bằng tiếng Việt
- AI làm Game Master với memory chống quên qua database structured
- Tùy chỉnh sâu phong cách kể chuyện, persona GM
- Toàn bộ chạy offline với LLM tải về máy (Ollama)
- Trải nghiệm gần với Friends & Fables + AI Dungeon nhưng riêng tiếng Việt

### 1.3 Đối tượng người dùng
- **Primary:** Chính bạn (solo dev) — chơi cá nhân
- **Secondary:** 1-2 người bạn được share (M2+)
- **Tertiary:** Cộng đồng D&D VN (M3, optional)

### 1.4 Không phải là gì
- Không phải Roll20/Foundry VTT replacement
- Không phải multiplayer game
- Không phải D&D 5e simulator đầy đủ (không cần 300 spell, không cần full SRD)
- Không cạnh tranh thương mại với F&F/AI Dungeon

---

## 2. TRIẾT LÝ THIẾT KẾ

### 2.1 Nguyên tắc cốt lõi

**P1 — Database là sự thật tuyệt đối**
Bất cứ thứ gì có thể sai sau 100 turn (HP, vị trí, inventory, quest status) phải nằm trong DB structured, không nằm trong chat history.

**P2 — Memory chống quên là feature #1**
Không phải feature đẹp, mà feature đúng. AI quên là vấn đề lớn nhất của AI RPG hiện tại.

**P3 — Hai chiều cập nhật**
- Chiều A: User edit UI → DB → AI thấy
- Chiều B: Player text → AI extract → DB → UI update
Cả hai luôn đồng bộ.

**P4 — Local-first, offline-first**
LLM, database, assets đều local. Không yêu cầu internet.

**P5 — Customization cao**
Phong cách kể chuyện, persona GM, prompt templates đều configurable.

**P6 — Tiếng Việt first-class**
Không phải afterthought, không phải máy dịch.

**P7 — Vibe coding friendly**
Có thứ chơi được mỗi tuần. Không gate behind 16 tuần dev mới chơi được.

### 2.2 Anti-patterns cần tránh
- Refactor đẹp khi chưa có MVP
- Multi-language UI (chỉ tiếng Việt là đủ)
- Tự train model
- Auto-update LLM trong app
- Multiplayer/online sync
- Mobile-first
- Microservices/distributed architecture

---

## 3. KIẾN TRÚC TỔNG

### 3.1 High-level

```
┌──────────────────────────────────────────────────────────┐
│  Tauri 2.0 Desktop App                                   │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Next.js 15 Frontend (React 19 + TypeScript)       │  │
│  │  - HUD Top Bar                                     │  │
│  │  - Chat Area + Map View (toggleable)               │  │
│  │  - Notebook Sidebar                                │  │
│  │  - Popup Sheets (Character/NPC/Monster)            │  │
│  └────────────────────────────────────────────────────┘  │
│              │                          │                │
│              ▼                          ▼                │
│  ┌──────────────────────┐  ┌─────────────────────────┐  │
│  │  @xekko/core (TS)    │  │  Tauri Backend (Rust)   │  │
│  │  - RuleEngine        │  │  - SQLite plugin        │  │
│  │  - Stat Calculator   │  │  - FS access            │  │
│  │  - Context Builder   │  │  - HTTP client          │  │
│  │  - Event Bus         │  │                         │  │
│  │  - Quest Engine      │  └─────────────────────────┘  │
│  │  - Memory Manager    │                               │
│  │  - LLM Pipeline      │                               │
│  └──────────────────────┘                               │
└──────────────────────────────────────────────────────────┘
            │                              │
            ▼                              ▼
   ┌─────────────────┐            ┌──────────────────┐
   │  SQLite DB      │            │  Ollama (local)  │
   │  ~28 tables     │            │  localhost:11434 │
   │  ~/Documents/   │            │  (user installs) │
   │   XekkoDND/     │            └──────────────────┘
   └─────────────────┘                    │
            │                              ▼
            ▼                     ┌──────────────────┐
   ┌─────────────────┐            │  LLM models      │
   │ Campaigns folder│            │  Qwen 2.5 7B     │
   │ Markdown + YAML │            │  Llama 3.1 8B    │
   │ + map PNGs      │            │  Mistral Nemo 12B│
   └─────────────────┘            └──────────────────┘
```

### 3.2 Component layers

```
LAYER 1 — UI (React components)
LAYER 2 — State Management (Zustand stores)
LAYER 3 — Core Logic (@xekko/core, pure TypeScript)
LAYER 4 — Data Access (Dexie.js / Tauri SQL plugin)
LAYER 5 — External (Ollama HTTP, file system)
```

### 3.3 7 Trụ hệ thống

```
┌─ TRỤ 1: Campaign System ───────────────────────────┐
│  Load campaign từ Markdown + YAML                  │
│  Scene runner, pre-built + homebrew                │
└─────────────────────────────────────────────────────┘

┌─ TRỤ 2: Character Sheet 2-Tier ────────────────────┐
│  HUD top bar (always visible) + Full popup         │
│  Player / NPC / Monster / Pet — sheet khác nhau    │
│  Stat calculator pure function                     │
└─────────────────────────────────────────────────────┘

┌─ TRỤ 3: Interactive Items ─────────────────────────┐
│  Item Detector LLM, item card trong chat           │
│  Drag-drop pickup / equip                          │
│  Floating items + tile inventory                   │
└─────────────────────────────────────────────────────┘

┌─ TRỤ 4: Memory & State ────────────────────────────┐
│  Multi-LLM pipeline, DB = ground truth             │
│  Auto-summary mỗi 5 turn                           │
│  Notebook: NPC/Location/Quest/Story Cards          │
└─────────────────────────────────────────────────────┘

┌─ TRỤ 5: Map System 3-Tier ─────────────────────────┐
│  Tier 0: World Map (region overview)               │
│  Tier 1: Regional Map (HoMM-style grid)            │
│  Tier 2: Local Map (battlemap scale)               │
│  Fog of war, pathfinding, tile inventory           │
└─────────────────────────────────────────────────────┘

┌─ TRỤ 6: Quest Journal & Branching ─────────────────┐
│  Quest schema có cấu trúc (objectives, branches)   │
│  Auto-detect completion via event bus              │
│  Multiple branches, hidden branches                │
│  Quest chains, arc view                            │
└─────────────────────────────────────────────────────┘

┌─ TRỤ 7: AI Engine ─────────────────────────────────┐
│  Ollama integration, local LLM                     │
│  Multi-LLM pipeline: Narrative + Extractors        │
│  6 narrative style presets                         │
│  Customizable prompts                              │
└─────────────────────────────────────────────────────┘
```

---

## 4. CHI TIẾT 7 TRỤ

### 4.1 TRỤ 1 — Campaign System

#### Mục đích
Cho phép chơi theo campaign có cấu trúc (linear hoặc branching), không phải sandbox vô hạn.

#### Format campaign
```
my-campaigns/
├── campaign-name/
│   ├── campaign.yaml          # metadata
│   ├── scenes/
│   │   ├── 01-opening.md
│   │   └── 02-...md
│   ├── npcs/
│   │   └── npc-name.md
│   ├── locations/
│   │   └── location.md
│   ├── maps/
│   │   ├── world/
│   │   ├── regional/
│   │   └── local/
│   └── handouts/
```

#### campaign.yaml
```yaml
title: "Tên campaign"
language: vi-VN
level_range: [1, 5]
recommended_party_size: 1
narrative_style:
  default: "high-fantasy-traditional"
  available: ["high-fantasy-traditional", "kiem-hiep", ...]
gm_persona:
  default: "wise-narrator"
starting_scene: "01-opening"
world_map: "maps/world/main.png"
```

#### Scene file (Markdown + YAML frontmatter)
```markdown
---
id: 01-opening
title: "Tên scene"
location: location-id
objectives: ["mục tiêu 1", "mục tiêu 2"]
triggers_next: ["02-next"]
encounters: [...]
---

## Bối cảnh cho GM
[Mô tả ngữ cảnh, AI dùng để hiểu scene]

## Read-aloud
> [Đoạn AI nên đọc nguyên văn cho player]

## Hint cho AI GM
[Gợi ý cách AI điều phối scene]
```

#### Chức năng
| # | Chức năng | Phase |
|---|---|---|
| C1 | Campaign loader (parse YAML + Markdown) | M1 |
| C2 | Scene runner (advance khi objective hoàn thành) | M1 |
| C3 | Encounter trigger (combat/social/skill) | M1 |
| C4 | Read-aloud / GM hint blocks | M1 |
| C5 | Pre-built campaign 1 (tiếng Việt, 5-10 scene) | M1 |
| C6 | Multi-chapter support | M2 |
| C7 | Campaign template generator | M2 |
| C8 | Campaign branching (multi-ending scene) | M2 |
| C9 | Campaign progress dashboard | M2 |
| C10 | Campaign import/export ZIP | M3 |

---

### 4.2 TRỤ 2 — Character Sheet 2-Tier

#### Nguyên tắc
- Single Source of Truth: DB đúng, AI sai → app sửa AI
- Cùng schema cho mọi entity (player, NPC, monster, pet)
- 2 chiều cập nhật: UI edit + AI extract đều cập nhật DB
- Inventory ↔ Equipment ↔ Stats là hệ liên kết qua Stat Calculator

#### Tier 1 — HUD (top bar luôn hiện)
```
┌─ HUD Aerin ─────────────────────────────────────────┐
│ 🧙 Aerin (Druid 3) │ ❤18/24 │ 🛡15 │ ✨8/12 │ 💰28  │
│ Conditions: [Bless][Poisoned]                        │
│ Equipped: ⚔Kiếm 🛡Khiên 👕Giáp                      │
└──────────────────────────────────────────────────────┘
```

Click HUD → mở Tier 2 popup.

#### Tier 2 — Full Sheet Popup

**Player (5 tab M1, mở rộng 8 tab M2):**
1. **Stats** — ability scores, skills, saves, AC, proficiencies
2. **Combat** — HP, conditions, attacks, death saves
3. **Inventory** — equipped + carrying, gold
4. **Spells & Abilities** — spell slots, prepared, racial/class features
5. **Notes** — backstory + appearance + player notes (M1)
6. **Background** (M2)
7. **Appearance** (M2)
8. **Relationships** (M2)

**NPC (3 tab M1, 6 tab M2):**
1. **Stats** — combat relevant
2. **Personality** — traits, goals, voice, mannerisms
3. **Relationship** — với player + history
4. **Knowledge** (M2) — privacy levels (public/private/secret)
5. **History** (M2)
6. **Inventory** (M2)

**Monster (2 tab M1):**
1. **Stat Block** — D&D Monster Manual format
2. **Loot** — drop table

**Pet/Companion (4 tab M2):**
1. **Stats**, 2. **Combat**, 3. **Commands**, 4. **Bond**

#### Stat Calculator
Pure function `computeStats(entity)`:
1. Bắt đầu từ base stats
2. Apply equipped items effects
3. Apply active conditions effects
4. Apply passive class/racial features
5. Return ComputedStats (auto-cached vào DB)

Chạy mỗi khi inventory/condition change → AC, speed, advantage tự cập nhật.

#### Entity types
```
player, major_npc, minor_npc, monster, boss,
pet, hireling, familiar, mount, object
```

Conditional rendering field theo type.

#### Privacy modes
- Player view (M2): chỉ thấy info đã biết
- GM view (M2): toàn bộ stats, secrets
- AI view (M2 debug): xem AI thấy gì

#### Entity chip detection
Trong narrative, tên entity → render thành clickable chip:
- AI mark trong output: `<e type="npc" id="klarg">Klarg</e>`
- Regex fallback post-process
- Click chip → mở sheet entity tương ứng

#### Chức năng (rút gọn — chi tiết ở phụ lục)

| Group | M1 | M2 | M3 |
|---|---|---|---|
| HUD | 6 features | 8 features | 0 |
| Player sheet | 5 tabs | 3 tabs thêm + relationships | Portrait gen |
| NPC sheet | 3 tabs | Knowledge/History + AI auto-gen | - |
| Monster sheet | 2 tabs | Tactics + Loot table | - |
| Pet sheet | basic | 4 tabs đầy đủ | Train commands |

---

### 4.3 TRỤ 3 — Interactive Items

#### Item lifecycle
```
DM kể → Item Detector phát hiện → Floating Item card trong chat
    ↓
Player: Click Pickup / Drag / Bỏ qua / Equip ngay
    ↓
Vào Inventory → Equip → Use → Drop → Tile Inventory
```

#### Item Detector LLM
- Call thứ 3 sau Narrative + State Extractor
- Pre-filter regex tiếng Việt: "nhặt", "thấy", "tìm", "rương"
- Output JSON: detected_items với type, quantity, properties, confidence
- Few-shot examples tiếng Việt trong prompt

#### Item Card UI trong chat
```
┌─────────────────────────────────┐
│  🌿  Cành Cây                   │
│      misc · 1.2 lb              │
│      "Cành sồi thẳng..."        │
│  [Nhặt] [Xem] [Bỏ qua]          │
└─────────────────────────────────┘
```

Rarity color border, contextual buttons theo type.

#### Drag & Drop interactions
1. Card chat → Inventory list
2. Card chat → Equipment slot (pickup + equip)
3. Inventory → Equipment slot
4. Inventory → Chat (give to NPC, drop)
5. Item + Item → Combine (M2 craft)

Thư viện: `@dnd-kit/core`

#### Equipment slots (cứng)
```
main_hand, off_hand, ranged, ammo
armor, head, cloak, boots, gloves, belt
amulet, ring1, ring2
clothing (cosmetic only)
```

Validation: 1 slot 1 item, 2H weapon exclusive, attunement max 3.

#### Tile Inventory
- Mỗi tile trên map có items
- Persistent: drop item → vẫn còn khi rời ô
- Hidden items với Perception DC
- Visible chỉ khi player ở adjacent tile + đã thấy

#### Chức năng

| Group | M1 | M2 | M3 |
|---|---|---|---|
| Item spawn | Detector + Card + Multi-item | Container, NPC offering | AI image gen icon |
| Interaction | Click/Drag basic | Drag → NPC, Combine | Custom icons |
| Visual | Emoji + preset icons | Pickup animation | AI image gen, 3D preview |
| Lifecycle | Persist, Undo, Stack | History view, Auto-expire | Container nesting |

---

### 4.4 TRỤ 4 — Memory & State

#### Vấn đề muốn giải quyết
AI quên vì 3 lý do:
1. Context window hữu hạn
2. Lưu dưới dạng text blob
3. Không có ground truth

#### Giải pháp: 3-layer architecture

```
LAYER 1: NARRATIVE LLM (kể chuyện)
   ↓ output text
LAYER 2: EXTRACTOR LLMs (parse state changes)
   - State Extractor (HP/equip/conditions)
   - Item Detector (new items)
   - Movement Detector (positions)
   - Branch Detector (quest branches)
   ↓ output JSON
LAYER 3: DATABASE (ground truth)
   - 28 bảng SQLite
```

#### Memory tables
- `memories` — auto-summary mỗi 5 turn
- `events` — raw event log
- `messages` — chat history
- `story_cards` — manual user-created memory

#### Auto-summary
Mỗi 5 turn:
1. Gom 5 turn vừa qua
2. LLM call (async, không block UI) tóm tắt 100 từ
3. Lưu vào `memories` với tags: location, NPCs, importance
4. Inject vào context khi keyword match

#### Memory retrieval
- M1: Keyword match
- M2: BM25 ranking
- M3: Semantic search (local embeddings)

Top 3 memories liên quan + recent 10 messages = working context.

#### Validation layers (chống AI sai)
1. Schema validation (Zod)
2. Sanity check rules (HP delta < 100, etc)
3. User confirm cho thay đổi lớn
4. Notebook editor tay
5. State injection format cứng

#### Notebook UI
Sidebar tabs:
- NPCs (auto-detected + manual)
- Locations
- Quests
- Story Cards
- Memory blocks
- Timeline events

#### Chức năng

| # | Group | M1 | M2 | M3 |
|---|---|---|---|---|
| Memory auto-update | ✓ | Semantic retrieval | Embeddings |
| Notebook tabs | 4 tabs | 6 tabs | Custom tabs |
| Story Cards | Manual | AI-suggested | Auto-categorize |
| Event log | Raw timeline | Filtered view | Replay events |

---

### 4.5 TRỤ 5 — Map System 3-Tier

#### 3 Tier scale

**Tier 0 — World Map (overview)**
- Hình ảnh continent
- Regions với boundary polygon
- POI nodes (cities, mountains)
- Click region → drill down
- Không grid movement, chỉ navigation
- Mục đích: "Tôi đang ở vùng nào"

**Tier 1 — Regional Map (HoMM-style)**
- Square grid 50×50 đến 100×100
- 1 ô = 1-6 dặm
- Movement Points per turn
- Terrain cost (road 0.5, forest 1.5, mountain 3.0)
- Fog of war (unexplored/explored/visible)
- A* pathfinding
- POI: cities, dungeons, landmarks
- Click POI → enter local map

**Tier 2 — Local Map (battlemap)**
- Grid 20×20 đến 40×40
- 1 ô = 5-30 ft (D&D scale)
- Tile inventory
- Entity positions
- Tactical combat overlay

#### Movement system
- World map: simple navigation (click region/POI)
- Regional: MP per day, A* path, terrain cost
- Local: free movement ngoài combat, MP-limited trong combat
- Diagonal: 1.5 cost (D&D variant)
- Square grid M1, hex toggle M3

#### Path memory
- **Player**: full `tile_visits` log → autopath chỉ qua explored tiles
- **NPC**: `current_position` + `home` + `known_locations` (không full path)
- **Party/Pet đi cùng player**: full tracking như player

#### Map source
- M1: Pre-bundled 5 generic maps + campaign provided + user upload PNG
- M2: User import wizard, drag PNG + set grid
- M3: Civitai LoRA integration (DnD Battlemaps Generator, LargeFantasyCityMap)

#### Civitai integration (M3)
- Không bundle SD (10GB quá lớn)
- User cài Automatic1111 hoặc ComfyUI riêng
- App gọi HTTP API local
- Recommended LoRAs bundled config

#### View modes
1. Chat-only (mặc định)
2. Map-only (full screen)
3. Split view (50/50 hoặc 60/40)

Toggle phím `M`.

#### Tile interactions
- Click tile → info popup
- Double-click → move to
- Right-click → context menu
- Click entity icon → open sheet
- Click POI → enter

#### Chức năng

| Group | M1 | M2 | M3 |
|---|---|---|---|
| Tier 0 World Map | Static image + text overlay | Interactive regions | Animated travel, factions |
| Tier 1 Regional | Grid + MP + Fog + Path | Travel time, encounters | Patrol routes, schedules |
| Tier 2 Local | Tile inventory + POI | Hidden items, multi-floor | AoE templates |
| Map source | 5 bundled + user PNG | Import wizard | Civitai SD integration |

---

### 4.6 TRỤ 6 — Quest Journal & Branching

#### Quest structure
```
QUEST
├─ OBJECTIVES (linear steps)
│   ├─ Auto-detected via event bus
│   └─ Types: kill, fetch, talk, reach, survive, protect, discover
├─ BRANCHES (multiple paths)
│   ├─ Outcome branching (sau decision objective)
│   ├─ Choice branching (NPC hỏi rõ)
│   └─ Hidden branching (player không biết)
├─ REWARD (gold, XP, items, reputation)
├─ DEADLINE (optional in-game days)
├─ FAILURE CONDITIONS
├─ PREREQUISITES (quests must precede)
└─ UNLOCKS (quests after completion)
```

#### Quest types
- `main` — critical story
- `side` — optional
- `personal` — character-specific
- `faction` — group reputation
- `hidden` — chưa discovered

#### Discovery sources
- NPC offer dialogue
- Letter/note found
- Overheard rumor
- Bulletin board
- AI procedural
- Campaign script
- Consequence of action

#### Auto-detect completion
Event bus pattern:
```
event: entity_died(klarg) → check kill objectives → mark done
event: item_acquired(map) → check fetch objectives
event: location_entered(cave) → check reach objectives
event: dialogue_completed(npc) → check talk objectives
```

#### Branch Detector LLM
Call thứ 4, conditional:
- Chạy khi quest có branches available
- Pre-filter keyword: "chọn", "giết", "tha", "trốn"
- Output: branch_detected + confidence
- Low confidence → modal hỏi user

#### Quest Journal UI
- Sidebar quick view: 3 quest active gần nhất
- Click → full popup với 5 tabs: Overview / Objectives / People / Locations / History
- Tabs filter: Active / Completed / Failed / Available
- Arc view: gom quests thuộc chain

#### Branch decision UI
Modal khi major decision:
```
┌─ ⚖ Quyết định quan trọng ─────────┐
│  [⚔ Tiêu diệt Klarg]              │
│   Reward: 500gp                    │
│  [💬 Đàm phán]                     │
│   Reward: 200gp + info             │
│  [🏃 Trốn thoát]                   │
│   Reward: 100gp                    │
│  [Hoặc gõ tự do]                   │
└────────────────────────────────────┘
```

Default behavior: free-form text, AI detect. Optional show choices button.

#### Chức năng

| Group | M1 | M2 | M3 |
|---|---|---|---|
| Quest CRUD | Schema + auto-create + abandon | - | - |
| Objectives | 4 types + auto-detect | Conditional, optional bonus | Sub-tasks |
| Branches | - | Outcome + Choice + Hidden + Detector | Multi-step trees |
| UI | Journal + popup | Arc view + history | Bulletin board |
| Failure | Deadline + abandon | Multiple conditions | - |
| AI gen | - | Procedural generation | Rumor system |

---

### 4.7 TRỤ 7 — AI Engine

#### LLM stack
- **Backend**: Ollama (localhost:11434), user tự cài
- **Models recommended**:
  - Máy yếu: Qwen 2.5 7B Q4 (8GB RAM)
  - Máy trung: Llama 3.1 8B / Qwen 2.5 14B Q4 (16GB)
  - Máy mạnh: Mistral Nemo 12B / Qwen 2.5 32B Q4 (32GB+)
- **Default**: Qwen 2.5 7B Instruct

#### Multi-LLM pipeline mỗi turn
```
1. Context Builder (TS pure, ~4-6k token)
2. Narrative LLM (mandatory) — kể chuyện
3. Parallel extractors (conditional):
   - State Extractor (HP/equip/cond)
   - Item Detector (new items)
   - Movement Detector (positions)
   - Branch Detector (quest branches)
4. Apply Handlers → DB updates
5. Event Bus → quest engine auto-update
6. UI render
7. Memory Summarizer (async, mỗi 5 turn)
```

Average 2-4 LLM call per turn. ~20-30s với Qwen 7B GPU 8GB.

#### Narrative styles (6 preset M1)
```
high-fantasy-traditional — Tolkien-esque
grimdark — tối tăm
kiem-hiep — Hán-Việt Kim Dung
light-hearted — hài hước
pulp-adventure — nhịp nhanh action
horror — chậm, ám ảnh
```

Mỗi preset là JSON với prompt fragment + example phrases.

#### GM Personas
- wise-narrator
- dramatic-bard
- cynical-judge
- friendly-guide
- Custom (user define)

#### Customization layers
1. Narrative style preset
2. GM persona
3. Rule strictness (strict/balanced/loose)
4. Advanced: full prompt template editor

#### Settings UI
```
Model:
  Backend: Ollama (localhost:11434) [test]
  Model: qwen2.5:7b ▼
  Temperature, Top-p, Context length sliders

Narrative:
  Style preset: Kiếm Hiệp ▼
  GM persona: Lão Tiền Bối ▼
  Language: Tiếng Việt ▼
  Tone strictness: Balanced

Rules:
  Auto-roll: ON
  Show dice math: ON
  Rule strictness: Strict
  Allow GM bend rules: OFF

Advanced:
  [Open prompt editor]
```

#### Tiếng Việt prompt engineering
- System prompt master 100% tiếng Việt
- 8-10 few-shot examples tiếng Việt mỗi extractor
- Xưng hô: "ngươi"/"bạn" tùy fantasy
- Giữ thuật ngữ D&D: HP, AC, DC, roll
- Tone presets điều khiển style (fantasy vs modern)

#### Validation
- Schema validation (Zod) cho mọi LLM JSON output
- Retry 1 lần nếu fail schema
- Skip update nếu retry fail (giữ state cũ)

#### Chức năng

| Group | M1 | M2 | M3 |
|---|---|---|---|
| Pipeline | 2 mandatory + 3 conditional LLM call | Async memory summary | Adaptive model selection |
| Styles | 6 preset | Custom style editor | Style marketplace |
| Personas | 4 preset | Custom persona editor | AI-generated personas |
| Prompts | Master prompts fixed | User editable templates | Visual prompt builder |

---

## 5. PIPELINE MỖI TURN (DETAIL)

### 5.1 Flow chi tiết

```
USER INPUT
   │
   ▼
[1] CONTEXT BUILDER (TS pure)
   - Load character state from DB
   - Load map context (Tier 0/1/2)
   - Load tile items current + adjacent
   - Load active quests + objectives
   - Load nearby entities + positions
   - Retrieve top-3 memories
   - Get last 10 chat messages
   - Build STATE block + MEMORIES block + SCENE block
   → Working context ~4-6k token
   │
   ▼
[2] NARRATIVE LLM CALL
   - System: master prompt + style + persona
   - User: working context + player input
   - Output: text narrative + dice markers + entity tags
   - Streaming to UI
   │
   ▼
[3] DICE PROCESSOR
   - Parse {roll: "1d20+5"} markers
   - Auto-roll
   - Append results, re-feed for final narrative
   │
   ▼
[4] PARALLEL EXTRACTORS (conditional)
   ┌─ State Extractor (always) ─┐
   │  HP/MP/conditions/equip    │
   └─────────────────────────────┘
   ┌─ Item Detector (if keywords)─┐
   │  New items spawn            │
   └─────────────────────────────┘
   ┌─ Movement Det. (if move kw)─┐
   │  Position changes           │
   └─────────────────────────────┘
   ┌─ Branch Det. (if branches) ─┐
   │  Quest branch chosen        │
   └─────────────────────────────┘
   │
   ▼
[5] APPLY HANDLERS (TS pure)
   - Validate JSON outputs (Zod)
   - Sanity check rules
   - User confirm for big changes
   - Apply to DB
   │
   ▼
[6] EVENT BUS
   - entity_died → quest engine
   - item_acquired → quest engine
   - location_entered → quest engine
   - condition_added → effect engine
   - level_up → notification
   │
   ▼
[7] UI RENDER
   - Update HUD
   - Render narrative + entity chips
   - Spawn item cards
   - Quest notifications
   - Map updates
   │
   ▼
[8] ASYNC TASKS
   - Memory summarizer (mỗi 5 turn)
   - Auto-save
   - Backup (mỗi 24h)
```

### 5.2 Token budget per turn

```
NARRATIVE CALL (Qwen 2.5 7B, 128k context, dùng ~6k):
- System prompt (master + style + persona): 1500 token
- Map context: 500
- State context (character + active quest): 800
- Memories (top 3): 600
- Story cards active: 400
- Recent chat (10 msg): 1500
- Player input: 200
- Reserved output: 800
Total: ~6300 token input, 800 output

STATE EXTRACTOR (lighter, 2-3k context):
- System + schema + few-shot: 1500
- Previous state summary: 500
- Narrative just generated: 800
- Output JSON: 300
Total: ~3100

ITEM DETECTOR: similar ~2500 token
MOVEMENT DETECTOR: similar ~2000 token
BRANCH DETECTOR: ~2500 token (chỉ khi có branches)

MEMORY SUMMARIZER (mỗi 5 turn, async):
- 5 turn raw chat: 2000
- Output summary: 200
Total: ~2200
```

### 5.3 Performance targets

```
With Qwen 2.5 7B Q4 trên GPU 8GB (RTX 3060/4060):
- Narrative: 10-15s (streaming, perceived faster)
- Each extractor: 3-5s parallel
- Total per turn: 15-25s
- Memory summary (async, không block): +5s background

Accepted: <30s per turn cho text RPG
```

---

## 6. DATABASE SCHEMA TỔNG

### 6.1 Liệt kê 28+ bảng

```
ADVENTURES & CAMPAIGNS (2)
- adventures
- campaigns

ENTITIES & CHARACTERS (8)
- entities (gốc cho mọi character)
- inventory_items
- equipment_slots
- skills_proficiencies
- save_proficiencies
- abilities (spells + class features)
- conditions_active
- entity_knowledge

POSITION & MAP (10)
- entity_positions
- world_maps
- world_regions
- world_pois
- maps (regional + local)
- map_tiles (terrain per tile)
- map_pois
- tile_visibility
- tile_visits
- tile_items
- entity_known_locations

ITEMS (1 thêm)
- floating_items

QUESTS (4)
- quests
- quest_objectives
- quest_branches
- quest_events

MEMORY (4)
- messages
- memories
- events
- story_cards

WORLD STATE (1)
- world_state (singleton per adventure)
```

### 6.2 Indexes quan trọng

```sql
CREATE INDEX idx_memories_adventure ON memories(adventure_id, importance DESC);
CREATE INDEX idx_npcs_name ON entities(adventure_id, name);
CREATE INDEX idx_events_turn ON events(adventure_id, turn);
CREATE INDEX idx_tile_visibility ON tile_visibility(entity_id, map_id);
CREATE INDEX idx_tile_items ON tile_items(map_id, tile_x, tile_y);
CREATE INDEX idx_floating_state ON floating_items(adventure_id, state);
CREATE INDEX idx_quest_objectives ON quest_objectives(quest_id, status);
CREATE INDEX idx_inventory_owner ON inventory_items(entity_id, equipped);
```

### 6.3 Backup strategy
- Auto-save mọi turn vào SQLite
- Auto-backup mỗi 24h ra `~/Documents/XekkoDND/backups/`
- Manual export adventure ra JSON (cho share/migrate)

---

## 7. TECH STACK

### 7.1 Stack chốt

| Layer | Technology | Lý do |
|---|---|---|
| Desktop wrapper | Tauri 2.0 | Lightweight, không bundle Chromium |
| Frontend | Next.js 15 + React 19 | Đã có code, vibe coding nhanh |
| Language | TypeScript | Type safety |
| Styling | Tailwind CSS + shadcn/ui | Đã có, đẹp out-of-box |
| State | Zustand + Zod | Đơn giản, type-safe |
| Storage | SQLite (Tauri SQL plugin) | File-based, không cần server |
| Drag-drop | @dnd-kit/core | Modern, accessible |
| LLM runtime | Ollama (user installs) | Cross-platform, REST API |
| Default model | Qwen 2.5 7B Instruct Q4 | Tiếng Việt tốt + nhẹ |
| Campaign format | Markdown + YAML frontmatter | User dùng được Obsidian/VS Code |
| Map source | PNG + JSON metadata | Đơn giản, share dễ |

### 7.2 Bỏ khỏi stack (so với v1)
- ❌ Python backend
- ❌ ComfyUI auto-spawn (user tự cài nếu muốn M3)
- ❌ Cloud sync
- ❌ Multi-user auth
- ❌ Streamlit (legacy MVP)

### 7.3 Folder structure project

```
xekkodnd/
├── apps/
│   └── web/                       # Next.js app
├── packages/
│   └── core/                      # @xekko/core
│       ├── src/
│       │   ├── db/
│       │   │   ├── schema.sql
│       │   │   └── client.ts
│       │   ├── types/
│       │   │   ├── entity.ts
│       │   │   ├── item.ts
│       │   │   ├── quest.ts
│       │   │   ├── map.ts
│       │   │   └── memory.ts
│       │   ├── stats/
│       │   │   └── calculator.ts
│       │   ├── llm/
│       │   │   ├── ollama-client.ts
│       │   │   ├── pipeline.ts
│       │   │   ├── extractors/
│       │   │   └── prompts/
│       │   ├── quest/
│       │   │   └── engine.ts
│       │   ├── memory/
│       │   │   └── manager.ts
│       │   ├── map/
│       │   │   ├── pathfinding.ts
│       │   │   └── fog-of-war.ts
│       │   └── event-bus.ts
├── src-tauri/                     # Tauri backend Rust
├── campaigns/                     # User campaigns folder
│   └── lost-mines-vi/
├── docs/
│   ├── PLAN_V5.md                 # File này
│   ├── MEMORY_ARCHITECTURE.md
│   ├── SCOPE_LOCK.md
│   └── DECISIONS.md
└── README.md
```

---

## 8. ROADMAP THEO PHASE

### 8.1 Phase M1 — "Playable MVP" (~12-16 tuần vibe coding)

**Mục tiêu:** Chơi được 1 campaign tiếng Việt 5-10 scene từ A-Z.

**Deliverables:**
- Tauri 2.0 setup + Ollama integration
- Settings UI (chọn model, narrative style, persona)
- Character sheet 2-tier (HUD + 5 tab popup)
- Inventory system + equipment slots
- 3 sheet types: Player (5 tab) / NPC (3 tab) / Monster (2 tab)
- Multi-LLM pipeline (Narrative + State Extractor)
- Item Detector + Card UI cơ bản
- Drag-drop item interactions
- Tile inventory cơ bản
- Map system 3-tier (đơn giản M1)
  - World map: static image + text overlay
  - Regional: grid + MP + fog + pathfinding
  - Local: tile inventory + POI
- Quest journal cơ bản (linear quest)
- Auto-detect objective completion
- Memory & State với auto-summary
- Notebook 4 tabs: NPCs / Locations / Quests / Story Cards
- Campaign loader (Markdown + YAML)
- 1 campaign tiếng Việt 5-10 scene
- Save/load + Export JSON
- 3 narrative style preset, 2 GM persona

**Gate M1 cuối:** chơi 2 tiếng, AI nhớ đúng tên NPC ở turn 50, deploy được app installer.

### 8.2 Phase M2 — "Rich Experience" (~8-12 tuần thêm)

**Mục tiêu:** Hoàn thiện experience, có thể share cho 1-2 người bạn thử.

**Deliverables:**
- Character sheet mở rộng (8 tab Player, 6 tab NPC, full Pet sheet)
- Pet/companion system
- NPC Knowledge với privacy levels
- AI auto-generate NPC details (lazy → background)
- Quest branching (3 types: outcome, choice, hidden)
- Branch Detector LLM
- Quest chains + arc view
- Combat mode (text-only, initiative tracker)
- Spell system đầy đủ
- Condition tracker với effects
- Memory semantic retrieval (BM25)
- Map: hex toggle, hidden items, multi-floor, NPC schedules
- Tile inventory advanced (container, decay)
- World map interactive (regions clickable, travel)
- 2 narrative preset thêm (grimdark, horror)
- Custom prompt editor
- Working Context Viewer (debug)
- Campaign template generator
- Mobile responsive (web view)

### 8.3 Phase M3 — "Polish & Power" (no deadline)

**Mục tiêu:** Tính năng cao cấp, polish.

**Deliverables:**
- Civitai SD integration (map generation)
- AI image gen cho item icons + portraits
- Tactical battlemap mode
- Audio: TTS giọng Việt + ambient
- D&D 5e SRD đầy đủ (300+ spell, 500+ monster)
- Procedural quest generation
- Bulletin board UI
- Rumor system
- Multi-floor dungeon
- Multiplayer LAN (host-guest)
- Custom rule modules (game system khác D&D)
- Campaign marketplace/sharing
- Steam Workshop-style
- Mobile native (Tauri Mobile)

### 8.4 Vibe coding guardrails

**Quy tắc mỗi tuần:**
1. Friday playtest 30 phút (không code, chỉ chơi)
2. Mỗi commit phải có thứ chạy được
3. Bug > 1h → đẩy `TODO.md`, làm việc khác
4. Không refactor đẹp trước M1 gate
5. Không học stack mới giữa phase
6. Stuck > 30 phút → describe cho AI pair, paste code

**Anti-scope-creep alarms (nếu thấy mình đang làm những điều này — DỪNG):**
- "Thêm spell concentration nữa thì hay…"
- "Hay làm multiplayer cho M1?"
- "ComfyUI thử cài lại xem sao…"
- "Đổi sang Rust backend cho nhanh…"
- "Train fine-tune model…"

→ Ghi vào `IDEAS_V2.md`, không code.

---

## 9. PHỤ LỤC

### 9.1 Quyết định đã chốt (từ các session trước)

**Character Sheet:**
- HUD vị trí: top bar fixed
- Popup behavior: modal M1 → side panel M2 → window M3
- Tabs M1: 5 Player, 3 NPC, 2 Monster
- Entity detection: AI mark + regex fallback
- NPC auto-gen: lazy M1, background M2

**Items:**
- Card UI: hybrid (1 item lớn, nhiều items compact)
- Floating lifetime: expire khi đổi location
- Detector: pre-filter regex + condition
- AI image: M3 only
- Detector model: separate small model (Qwen 3B) ở M1

**Map:**
- Map source M1: A (campaign) + B (5 bundled generic)
- Grid: square M1, hex M3
- Movement: free ngoài combat, MP-limited trong combat
- Tile inventory: visible khi adjacent, full list khi click
- Civitai: M3 only
- NPC path: B (current + home + known locations)
- Scale: per-map (world 6mi, town 30ft, dungeon 5ft)

**Quest:**
- UI: C (sidebar quick + full popup)
- Branch decision: B+C (inline options + free-form)
- Procedural gen: M2 (user request only)
- Visibility: C (user toggle)
- Failure severity: C configurable
- Notifications: B+C (bell badge + inline)

### 9.2 So sánh với competitors

| Feature | AI Dungeon | F&F | XekkoDND v5 |
|---|---|---|---|
| Local LLM | ❌ | ❌ | ✓ |
| Tiếng Việt first-class | ❌ | ❌ | ✓ |
| Multi-LLM pipeline | ❌ | ✓ | ✓ |
| Database = source of truth | ❌ | ✓ | ✓ |
| Memory auto-summary | ✓ | ✓ | ✓ |
| Story Cards | ✓ | ❌ | ✓ |
| Character sheet 2-tier | ❌ | ✓ | ✓ |
| Interactive items drag-drop | ❌ | ❌ | ✓ |
| World map | Limited | ✓ | ✓ |
| Tactical map grid | ❌ | ✓ | ✓ |
| Quest branching | Limited | ✓ | ✓ |
| Campaign system | Scenarios | ✓ | ✓ |
| Customization | Medium | Low | High |
| Open source | ❌ | ❌ | (optional) |

### 9.3 Lợi thế cạnh tranh
1. **Tiếng Việt** — chỉ XekkoDND làm đúng
2. **Local + offline** — không phụ thuộc cloud
3. **Customization** — power user mở khóa toàn bộ
4. **Personal scope** — không bị áp lực commercial

### 9.4 Rủi ro chính

| Rủi ro | Mức độ | Mitigation |
|---|---|---|
| Qwen 7B tiếng Việt không đủ tốt | High | Test sớm tuần 1, fallback Llama/Mistral |
| Pipeline 3-4 LLM call quá chậm | Medium | Parallel execution, pre-filter, smaller extractor model |
| Scope creep | High | SCOPE_LOCK.md, gate review |
| Burnout solo dev | High | Vibe coding rules, Friday playtest, no deadline |
| Tauri SQL plugin bug | Low | Fallback Dexie.js (IndexedDB) |
| User không cài được Ollama | Medium | First-run wizard, clear docs |

### 9.5 Quy tắc tiếng Việt cho AI

**Xưng hô:**
- Fantasy: "ngươi" (player), "ta/lão phu/tại hạ" (NPC tùy persona)
- Modern: "bạn" / "tôi"

**Thuật ngữ giữ nguyên:**
- HP, AC, DC, roll, save, modifier, advantage/disadvantage
- Tên class English: Druid, Fighter, Wizard (hoặc Việt: Pháp sư, Chiến binh — chọn theo style)

**Tên riêng:**
- Fantasy phương Tây: Tolkien-esque (Aerin, Thorne, Galadwen)
- Fantasy phương Đông: Hán-Việt (Trần Lão, Bạch Vân)
- Hiện đại: tên tiếng Việt thật (Nguyễn Văn A)

**Tone presets:**
- Trang trọng: "Ngươi bước vào hang động..."
- Casual: "Bạn vừa đi vào hang..."
- Kiếm hiệp: "Hắn vận khí nội công, kiếm khí bùng lên..."

### 9.6 File quan trọng cần viết tay (không để AI generate hết)

**Linh hồn của project — viết bằng tay nhiều:**
1. `prompts/narrative-master.txt` — system prompt master cho GM
2. `prompts/state-extractor.txt` — extractor với few-shot
3. `prompts/item-detector.txt` — item detection
4. `narrative-styles/*.json` — 6 style preset
5. `gm-personas/*.json` — 4-5 persona
6. `campaigns/lost-mines-vi/` — 1 campaign tay viết

### 9.7 Definition of Done cho M1

- [ ] Cài app installer Tauri trên Windows/Mac/Linux
- [ ] Run app, kết nối Ollama, pull qwen2.5:7b
- [ ] Create character với 5 race + 5 class options
- [ ] Load campaign "Lost Mines (vi)" và bắt đầu scene 1
- [ ] Chơi 2 tiếng liên tục, AI:
  - [ ] Nhớ tên NPC chính (ít nhất 3) ở turn 50+
  - [ ] Không bịa HP/inventory sai
  - [ ] Hiểu lệnh tiếng Việt "tôi mặc áo giáp" → update sheet
  - [ ] Hiển thị item card khi detect loot
  - [ ] Track quest progress đúng
- [ ] Save/load adventure
- [ ] Export ra JSON, import lại OK
- [ ] Không crash trong 2 tiếng chơi

### 9.8 Đường dẫn lưu trữ (default)

```
Windows: C:\Users\<user>\Documents\XekkoDND\
macOS: ~/Documents/XekkoDND/
Linux: ~/Documents/XekkoDND/

XekkoDND/
├── adventures.db              # SQLite chính
├── settings.json
├── campaigns/                 # User campaigns
│   ├── lost-mines-vi/        # Bundled
│   └── <user-homebrew>/
├── maps/                      # User uploaded maps
├── portraits/                 # Character portraits
├── exports/                   # Export JSON
└── backups/                   # Auto-backups 24h
    └── 2026-05-21-adventures.db
```

---

## 10. KẾT LUẬN

### 10.1 Tóm tắt 1 câu
**XekkoDND là một desktop app D&D AI offline tiếng Việt, dùng multi-LLM pipeline với database structured để chống AI quên, hỗ trợ campaign + branching quest + 3-tier map + interactive items, làm bởi solo dev theo vibe coding, scope cá nhân không thương mại.**

### 10.2 Path forward

Sau bản đặc tả này, các việc cần làm:

**Trong tuần 1:**
1. Tạo file `docs/PLAN_V5.md` với nội dung này
2. Tạo `docs/SCOPE_LOCK.md` — copy section M1, lock until gate review
3. Tạo `docs/DECISIONS.md` — log các quyết định trong tương lai
4. Audit `xekkodnd-monorepo` hiện tại — giữ gì, xóa gì
5. Setup Ollama + test Qwen 7B với prompt tiếng Việt mẫu
6. Define types TS cho `Entity`, `Item`, `Quest`, `Map` (xương sống)

**Trong tháng 1:**
1. Schema SQL đầy đủ 28 bảng
2. Tauri + Next.js setup hoàn chỉnh
3. Multi-LLM pipeline cơ bản
4. Character sheet HUD + popup tab Stats
5. Chat loop end-to-end với 1 LLM call

**Trong quarter 1 (3 tháng đầu):**
- Hoàn thành M1 Phase

### 10.3 Câu hỏi mở cần quyết định sau

- Format chính xác của 6 narrative style preset (cần viết tay)
- Tên Vietnamese cho UI labels (Combat hay "Chiến đấu"?)
- Tên persona GM mặc định ("Thầy Kể Chuyện" hay "GM"?)
- 1st campaign nội dung gì (adapt Lost Mines hay homebrew?)
- Open source hay private repo?

---

## CHANGELOG

- **v1.0** — Initial plan, scope quá rộng, 16 tuần
- **v2.0** — Cloud-based, Gemini API, bỏ local LLM
- **v3.0** — Quay lại local, campaign-based, tùy chỉnh cao
- **v4.0** — Memory architecture với multi-LLM pipeline
- **v5.0** — Tổng hợp full + thêm World Map + Quest branching ✓ (current)

---

**Hết bản đặc tả XekkoDND v5.0**

Tổng độ dài: ~28 trang. File này sẽ là tham chiếu chính trong suốt quá trình dev. Cập nhật khi có quyết định mới qua `docs/DECISIONS.md`.
