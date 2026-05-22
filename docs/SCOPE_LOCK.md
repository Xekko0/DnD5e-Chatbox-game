# SCOPE LOCK — XekkoDND M1

> **Quy tắc:** File này là danh sách feature được phép làm trong M1.
> Nếu thấy mình muốn thêm thứ gì KHÔNG có trong list này → ghi vào `IDEAS_V2.md`, **KHÔNG code**.

---

## ✅ M1 Được phép làm

### Trụ 1 — Campaign System
- [ ] Campaign loader (parse YAML + Markdown)
- [ ] Scene runner (advance khi objective hoàn thành)
- [ ] Encounter trigger (combat/social/skill)
- [ ] Read-aloud / GM hint blocks
- [ ] 1 campaign tiếng Việt: `lost-mines-vi` (5-10 scene)

### Trụ 2 — Character Sheet
- [ ] HUD top bar (HP, AC, spell slots, gold, conditions)
- [ ] Player Sheet popup 5 tab: Stats / Combat / Inventory / Spells / Notes
- [ ] NPC Sheet popup 3 tab: Stats / Personality / Relationship
- [ ] Monster Sheet popup 2 tab: Stat Block / Loot
- [ ] Stat Calculator pure function

### Trụ 3 — Interactive Items
- [ ] Item Detector LLM + Item Card UI trong chat
- [ ] Click Pickup / Bỏ qua
- [ ] Drag-drop cơ bản (Item Card → Inventory, Inventory → Equipment)
- [ ] Equipment slots validation (1 slot 1 item, 2H exclusive)
- [ ] Tile inventory cơ bản

### Trụ 4 — Memory & State
- [ ] Multi-LLM pipeline: Narrative + State Extractor
- [ ] Auto-summary mỗi 5 turn (async)
- [ ] Notebook 4 tab: NPCs / Locations / Quests / Story Cards
- [ ] Validation Zod + retry 1 lần
- [ ] DB (Dexie IndexedDB M1, migrate SQLite khi Tauri M1+)

### Trụ 5 — Map System
- [ ] World Map: static image + text overlay
- [ ] Regional Map: grid + MP + fog of war + A* pathfinding
- [ ] Local Map: tile inventory + POI
- [ ] 5 bundled generic maps + campaign maps

### Trụ 6 — Quest Journal
- [ ] Quest CRUD + auto-create từ campaign
- [ ] Objectives: kill / fetch / talk / reach (auto-detect qua event bus)
- [ ] Quest Journal UI: sidebar quick + full popup
- [ ] Notification khi objective hoàn thành

### Trụ 7 — AI Engine
- [ ] Ollama integration (localhost:11434)
- [ ] Narrative LLM + State Extractor LLM (parallel)
- [ ] Item Detector LLM (conditional)
- [ ] 3 narrative style preset + 2 GM persona
- [ ] Settings UI: model, style, persona, rule strictness

### Infrastructure
- [ ] Save/load + Export JSON
- [ ] Auto-save mỗi turn
- [ ] Auto-backup 24h
- [ ] Tauri 2.0 setup + app installer Windows/Mac/Linux
- [ ] First-run wizard (Ollama check + model pull)

---

## 🚫 KHÔNG làm trong M1 (M2+)

- Quest branching (outcome/choice/hidden)
- Branch Detector LLM
- NPC knowledge privacy levels
- Pet/companion system
- Semantic memory search (BM25/embeddings)
- Combat mode tactical
- Spell system đầy đủ
- Map hex toggle
- Hidden items, multi-floor dungeon
- World map interactive regions
- Custom prompt editor
- Campaign template generator
- Mobile responsive

---

## Gate M1 — Definition of Done

- [ ] Cài app installer Tauri trên Windows/Mac/Linux
- [ ] Kết nối Ollama, pull qwen2.5:7b thành công
- [ ] Tạo nhân vật với 5 race + 5 class options
- [ ] Load campaign `lost-mines-vi`, bắt đầu scene 1
- [ ] Chơi 2 tiếng liên tục, AI:
  - [ ] Nhớ tên NPC chính (≥3) ở turn 50+
  - [ ] Không bịa HP/inventory sai
  - [ ] Hiểu "tôi mặc áo giáp" → update sheet
  - [ ] Hiển thị item card khi detect loot
  - [ ] Track quest progress đúng
- [ ] Save/load adventure
- [ ] Export JSON → import lại OK
- [ ] Không crash trong 2 tiếng chơi

---

*Cập nhật file này khi có quyết định scope mới. Ghi ngày + lý do.*
