# XekkoDND — Bản cập nhật AI Engine & Chat Pipeline

> **Phiên bản:** v6 patch
> **Áp dụng cho:** TRỤ 7 (AI Engine) trong PLAN_V5.md
> **Mục đích:** Thay thế hoàn toàn section AI Engine cũ. Các trụ khác giữ nguyên.

---

## 1. THAY ĐỔI TRIẾT LÝ CỐT LÕI

### Trước (v5)
AI có nhiều quyền:
- Kể chuyện
- Extract state changes (HP, equip, conditions)
- Detect items mới
- Detect movement
- Detect quest branch
- Auto-generate NPC details
- Procedural quest generation

→ 3-4 LLM call mỗi turn, 20-30s, AI có thể bịa state.

### Sau (v6)
AI chỉ có 2 vai trò narrow:
1. **Intent Parser** — phân tích lời player thành chuỗi actions có sẵn
2. **Narrator** — đọc kết quả từ code, kể thành câu chuyện tiếng Việt

Mọi mechanical quyết định do **CODE** làm:
- Roll dice
- Tính damage/healing
- Validate action economy
- Apply rule D&D 5e
- Update state DB
- Auto-detect quest completion

→ 1-2 LLM call mỗi turn, 5-10s, AI không thể bịa số.

### Câu thần chú
> **AI là Narrator giỏi, không phải Game Master.**
> **Code là Game Master. AI chỉ đọc và diễn đạt.**

---

## 2. KIẾN TRÚC 4-STEP PIPELINE

```
┌─────────────────────────────────────────────────────────┐
│ STEP 1: PLAYER INPUT                                    │
│  - Natural text, slash command, hoặc UI button click   │
└─────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 2: INTENT PARSER (1 small LLM call)               │
│  - Phân tích text → chuỗi actions                       │
│  - Match với available_actions của hệ thống             │
│  - Flag ambiguities (weapon? target? skill?)            │
│  - SKIP nếu slash command / UI button                   │
└─────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 3a: SKILL PICKER UI (no LLM)                       │
│  - Hiện popup nếu có ambiguity                          │
│  - Player chọn weapon/spell/skill/target                │
│  - Confirm sequence cho complex multi-action            │
└─────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 3b: RULE ENGINE (pure TypeScript, no LLM)          │
│  - Validate action economy (D&D 5e)                     │
│  - Roll dice (Dice Module)                              │
│  - Calculate damage/healing/cost                        │
│  - Apply state changes vào DB                           │
│  - Emit events → quest engine auto-update               │
│  - Build Result Object                                  │
└─────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│ STEP 4: NARRATOR (1 main LLM call)                      │
│  - Đọc Result Object                                    │
│  - Tả bằng tiếng Việt sống động                         │
│  - Include atmosphere, dialogue, drama                  │
│  - Output render-only tags (dice icons, HP bars)        │
│  - KHÔNG tính số, KHÔNG quyết định outcome              │
└─────────────────────────────────────────────────────────┘
                       │
                       ▼
                  UI render
```

**Maximum 2 LLM calls per turn.**

---

## 3. STEP 2 — INTENT PARSER

### 3.1 Nhiệm vụ
Đọc player text → identify mechanical actions → flag ambiguities. Không chọn skill cho player. Không roll dice.

### 3.2 Khi nào chạy

| Input type | Run Parser? |
|---|---|
| Slash command (`/attack klarg`) | Skip |
| UI button click | Skip |
| Repeat last action (R key) | Skip |
| Empty/very short input | Skip |
| Natural text | Run |

### 3.3 Model

- **M1:** Reuse main Narrator model (Qwen 2.5 7B) — 1 model load
- **M2:** Tách model nhỏ riêng (Qwen 2.5 3B) — nhanh hơn ~3x

### 3.4 Output schema

```json
{
  "intents": [
    {
      "order": 1,
      "action": "<action_type>",
      "params": {...},
      "ambiguous": true|false,
      "ambiguities": ["weapon_choice", "target_choice", "skill_choice"],
      "confidence": "high|medium|low"
    }
  ],
  "overall_intent_description": "<1 sentence>",
  "narrative_only": true|false
}
```

### 3.5 Action types hỗ trợ

```
move              — di chuyển tới vị trí
attack            — tấn công (cần weapon clarification)
cast_spell        — niệm phép (cần spell clarification)
skill_check       — kiểm tra kỹ năng
saving_throw      — saving throw
use_item          — dùng vật phẩm
equip / unequip   — trang bị / cởi
talk              — nói chuyện (no mechanic)
examine           — kiểm tra vật/cảnh
search            — tìm kiếm
hide              — ẩn nấp
intimidate        — đe dọa (Charisma)
persuade          — thuyết phục (Charisma)
rest              — nghỉ ngơi (short/long)
narrative_only    — chỉ kể chuyện, không cần mechanic
```

### 3.6 Few-shot examples (tiếng Việt)

Prompt cần ít nhất 8-10 examples tiếng Việt:

**Ví dụ 1 — Multi-action với ambiguity:**
```
Input: "Tôi chạy tới bên trái con goblin và đánh nó"
Output: {
  "intents": [
    {
      "order": 1,
      "action": "move",
      "params": { "target_position": "left_of_goblin_nearest" },
      "ambiguous": false,
      "confidence": "high"
    },
    {
      "order": 2,
      "action": "attack",
      "params": { "target": "goblin_nearest" },
      "ambiguous": true,
      "ambiguities": ["weapon_choice"],
      "confidence": "high"
    }
  ],
  "narrative_only": false
}
```

**Ví dụ 2 — Clear spell cast:**
```
Input: "Tôi niệm Fireball lên đám goblin"
Output: {
  "intents": [{
    "order": 1,
    "action": "cast_spell",
    "params": { "spell": "fireball", "target_area": "goblin_cluster" },
    "ambiguous": false,
    "confidence": "high"
  }]
}
```

**Ví dụ 3 — Pure narrative:**
```
Input: "Tôi ngắm bếp lửa, suy nghĩ về quê hương"
Output: {
  "intents": [],
  "narrative_only": true,
  "overall_intent_description": "introspective moment, no mechanic"
}
```

**Ví dụ 4 — Stealth approach:**
```
Input: "Tôi lén ra sau lưng tên gác"
Output: {
  "intents": [
    {
      "order": 1,
      "action": "move",
      "params": { "stealth": true, "target": "behind_guard" }
    },
    {
      "order": 2,
      "action": "skill_check",
      "params": { "skill": "stealth", "vs_passive_perception": "guard" }
    }
  ]
}
```

**Ví dụ 5 — Vague skill check:**
```
Input: "Tôi kiểm tra phòng xem có gì"
Output: {
  "intents": [{
    "order": 1,
    "action": "skill_check",
    "params": { "purpose": "search_room" },
    "ambiguous": true,
    "ambiguities": ["skill_choice"]
  }]
}
```

### 3.7 Confidence handling

```
high   → execute immediately
medium → ask player to confirm via UI
low    → treat as narrative_only, skip mechanic
```

---

## 4. STEP 3a — SKILL PICKER UI

### 4.1 Khi nào hiện popup

Chỉ hiện khi Intent Parser flag `ambiguous: true`. Tránh popup mọi turn (annoying).

| Player text | Ambiguous? | Action |
|---|---|---|
| "tôi đánh goblin bằng kiếm dài" | No | Execute |
| "tôi đánh nó" | Yes (weapon?) | Popup weapon picker |
| "/attack klarg" | No | Execute |
| "tôi cast spell" | Yes (which spell?) | Popup spell picker |
| "tôi kiểm tra phòng" | Yes (skill?) | Popup skill picker |
| "tôi nói với Sildar" | No (no roll) | Execute |

### 4.2 4 loại Picker

**Picker A — Weapon Picker**
Hiện khi `action: attack` và không rõ weapon.

```
┌────────────────────────────────────────────┐
│ Chọn vũ khí tấn công Goblin:                │
│                                             │
│ [⚔ Kiếm dài]    +5 attack / 1d8+2 slashing│
│                  Main hand                  │
│                                             │
│ [🗡 Dao găm]    +4 attack / 1d4+2 piercing │
│                  Off hand                   │
│                                             │
│ [🏹 Cung]       +4 attack / 1d6+2 piercing │
│                  Ranged                     │
│                                             │
│ [✊ Tay không]   +3 attack / 1+2 bludgeoning│
│                                             │
│ Tùy chọn:                                   │
│ ☐ Tấn công 2 tay (bonus action)            │
│ ☐ Power Attack (-5 hit, +10 damage)        │
│ ☐ Advantage  ☐ Disadvantage                │
│                                             │
│ [Cancel]  [Execute]                         │
└────────────────────────────────────────────┘
```

Hiển thị:
- Equipped weapons (main_hand, off_hand, ranged)
- Unarmed (default)
- Modifiers transparent (player thấy +5, 1d8+2)

**Picker B — Spell Picker**
Hiện khi `action: cast_spell` và không rõ spell.

```
┌──────────────────────────────────────────┐
│ Chọn phép thuật:                          │
│                                           │
│ CANTRIPS (không tốn slot):                │
│ [✨ Druidcraft]    Utility                │
│ [🔥 Produce Flame] 30ft / 1d8 fire        │
│ [💚 Guidance]      Touch / +1d4           │
│                                           │
│ LEVEL 1 (3/4 slot còn):                  │
│ [💚 Cure Wounds]  Touch / 1d8+3 heal     │
│ [🌿 Entangle]     90ft / 20ft AoE        │
│ [🔥 Faerie Fire]  60ft / 20ft AoE        │
│                                           │
│ LEVEL 2 (2/2 slot còn):                  │
│ [🌪 Gust of Wind] 60ft line              │
│                                           │
│ [Cancel]                                  │
└──────────────────────────────────────────┘
```

Filter: prepared + has slot.

**Picker C — Skill Check Picker**
Hiện khi `action: skill_check` và skill mơ hồ.

```
┌─────────────────────────────────────────┐
│ Player: "tôi kiểm tra phòng"             │
│                                          │
│ Loại kiểm tra phù hợp:                   │
│                                          │
│ [👁 Perception (+5)]                     │
│   Phát hiện chi tiết, âm thanh, bẫy     │
│                                          │
│ [🔍 Investigation (+1)]                  │
│   Tìm clue, suy luận                    │
│                                          │
│ [🦊 Insight (+5)]                        │
│   Đọc ý nghĩ, phát hiện nói dối         │
│                                          │
│ [📚 History (+1)]                        │
│   Nhớ lại lịch sử/lore                  │
│                                          │
│ [Cancel]                                 │
└─────────────────────────────────────────┘
```

**Picker D — Target Picker**
Hiện khi multiple targets cùng tên (3 goblins).

```
┌──────────────────────────────────────┐
│ Có nhiều mục tiêu. Chọn 1:            │
│                                       │
│ 🟢 Goblin 1   HP 7/7    5ft          │
│    [Chọn]                             │
│                                       │
│ 🟡 Goblin 2   HP 3/7 (wounded)  10ft  │
│    [Chọn]                             │
│                                       │
│ 🔴 Goblin Boss  HP 14/14   15ft       │
│    Ranged only                        │
│    [Chọn]                             │
│                                       │
│ [Cancel]                              │
└──────────────────────────────────────┘
```

**Picker E — Sequence Confirmation**
Hiện cho complex multi-action.

```
┌─────────────────────────────────────────┐
│ Xác nhận chuỗi hành động:                │
│                                          │
│ Bước 1: Di chuyển (3,8) → (4,8)         │
│         MP cost: 1.5                     │
│                                          │
│ Bước 2: Tấn công Goblin với Kiếm dài    │
│         Uses: 1 Action                   │
│                                          │
│ Bước 3: Di chuyển (4,8) → (6,8)         │
│         MP cost: 3.0 (total 4.5 MP)     │
│                                          │
│ ⚠ Total MP: 4.5 / 6 còn lại            │
│                                          │
│ [Cancel]  [Adjust]  [Execute all]        │
└─────────────────────────────────────────┘
```

### 4.3 Quick-select shortcuts

Power user có thể skip picker:

```
Settings → "Skill Picker Behavior":
○ Always show
● Show when ambiguous (default)
○ Skip when clear (power user)
○ Auto-pick best (AI suggests)
```

Hotkeys trong picker:
- `1-9` — chọn option theo số
- `Enter` — confirm default highlighted option
- `Esc` — cancel
- `R` — repeat last action's choices

---

## 5. STEP 3b — RULE ENGINE (Pure Code, no LLM)

### 5.1 Modules tham gia

```
Dice Module          → roll d20+mod, advantage/disadvantage
Combat Module        → attack roll, damage, save, AC check
Spell Module         → slot management, prepare, casting
Movement Module      → pathfinding, MP cost, line of sight
Action Economy Mod.  → track Action/Bonus/Reaction/Move per turn
Effect Module        → apply conditions, buffs, durations
Stat Module          → recompute stats after changes
Inventory Module     → equip validation, attunement
Quest Module         → event bus listener, auto-complete
Validation Module    → schema check, sanity bounds
```

### 5.2 Action Economy enforcement (D&D 5e)

Mỗi turn 1 character được:
- 1 Action
- 1 Bonus Action (nếu có)
- 1 Reaction
- Movement up to speed
- Free interactions (talk, draw weapon)

Code track và enforce:
```
Player intent: ["move", "attack", "move_again"]

Validation:
- move: ok (uses movement)
- attack: ok (uses Action)
- move_again: check
   - Total movement <= speed? Yes → ok
   - Or needs Dash (Action already used)? Reject
```

Nếu exceed → reject sequence, suggest alternative.

### 5.3 Result Object schema (output từ Rule Engine)

```yaml
ResultObject:
  type: "sequence"
  sequence_id: "seq_001"
  
  steps:
    - step_number: 1
      action_type: move
      result:
        from: [3, 8]
        to: [4, 8]
        mp_used: 1.5
        success: true
        tiles_revealed: [...]
      events: [entity_moved]
      
    - step_number: 2
      action_type: attack
      result:
        weapon: longsword
        target: goblin_1
        rolls:
          - { type: attack, total: 17, vs_ac: 13, hit: true, crit: false }
          - { type: damage, total: 7, type: slashing }
        outcome: kill
        state_changes:
          - { entity: goblin_1, field: hp_current, from: 7, to: 0 }
          - { entity: goblin_1, field: status, from: alive, to: dead }
      events: [entity_damaged, entity_died]
  
  cumulative_dramatic_context:
    momentum: "aggressive_offensive"
    scene_change: "1 less enemy"
    actor_resources:
      hp_unchanged: true
      mp_used: 1.5
      action_used: true
    is_kill: true
    is_finishing_blow: false
    is_first_hit_of_combat: true
    target_state_before: healthy
    target_state_after: dead
  
  narrative_hints:
    tone: "tense_combat"
    length: "medium"
    must_mention: ["sword strike connected", "goblin died"]
    must_not_say: ["all enemies dead", "won the fight"]
```

### 5.4 Validation layers chống cheat

Code chặn:
- Player tự khai roll result → ignore, roll lại
- Player attack outside range → reject
- Player use spell without slot → reject
- Player equip impossible (5 rings, 2 main hands) → reject
- Player move qua wall → reject

Đảm bảo deterministic, reproducible.

---

## 6. STEP 4 — NARRATOR

### 6.1 Nhiệm vụ
Đọc Result Object → kể thành câu chuyện tiếng Việt sống động. **Không** tính số. **Không** quyết định outcome. **Không** bịa state.

### 6.2 Narrator System Prompt (mẫu — file linh hồn)

```
[BẠN LÀ NARRATOR CHO XEKKODND]

Vai trò DUY NHẤT: biến kết quả mechanic thành câu chuyện sống động.
Code đã quyết định outcome. Bạn KHÔNG quyết định gì.

[QUY TẮC NGÔN NGỮ]
- Tiếng Việt tự nhiên, không dịch máy
- Xưng hô: {style_pronouns}
- Tone: {style_tone}
- Giữ thuật ngữ D&D: HP, AC, DC, roll

[PHONG CÁCH KỂ]
{narrative_style_prompt}

[PERSONA]
{gm_persona_prompt}

[CÁCH ĐỌC RESULT OBJECT]

1. Đọc action_type → biết chuyện gì xảy ra
2. Đọc success/outcome → kết quả thế nào
3. Đọc dramatic_context → cảm xúc, không khí
4. Đọc must_mention → bắt buộc đề cập
5. Đọc must_not_say → không được nói

Sau đó kể chuyện 2-5 câu tiếng Việt sống động.

[VÍ DỤ]

Result Object:
  action: attack
  actor: Aerin
  target: Klarg
  weapon: longsword
  rolls: [attack 17 vs AC 14 hit, damage 7]
  outcome: hurt_not_killed
  dramatic_context:
    is_first_hit: true
    target_state_after: wounded

Output:
"Lưỡi kiếm của ngươi loang loáng dưới ánh đuốc, cắm sâu 
vào sườn Klarg <cmd:rolled attack='17' damage='7'/>. Tên 
Bugbear gầm lên đau đớn, máu thấm đẫm lớp giáp da. Hắn 
loạng choạng lùi một bước nhưng vẫn đứng vững, mắt long 
lên giận dữ."

[QUAN TRỌNG]
- KHÔNG viết "ngươi gây 7 sát thương" (đã có trong tag)
- KHÔNG viết "HP Klarg còn 20" (đã có trong UI)
- VIẾT cảm giác, không khí, phản ứng
- DÙNG <cmd:rolled .../> để inline dice icons

[KHI KHÔNG CÓ RESULT OBJECT — pure narrative]
- Tả cảnh, không khí, NPC behavior
- Đề xuất hành động ngầm qua dialogue/môi trường
- KHÔNG tự nghĩ ra combat, item, quest event
- Để player drive forward

[CONTEXT HIỆN TẠI]
{character_state}
{map_context}
{active_quests}
{recent_memories}
{recent_chat}

[INPUT]
Player said: "{player_input}"
{result_object_if_any}

[OUTPUT]
(Kể chuyện. Không tính. Không quyết định outcome.)
```

### 6.3 Render-only command tags

Narrator output có thể chứa tags để UI render đẹp hơn. Tags **không** execute state changes (state đã apply ở Step 3b).

```
<cmd:rolled action='X' result='Y' dc='Z' />
  → UI render dice icon với roll result

<cmd:hp_change target='X' delta='-7' />
  → UI render damage number floating animation

<cmd:entity_died target='goblin_1' />
  → UI show death indicator

<cmd:item_appeared template='healing_potion' />
  → UI spawn item card below message

<cmd:quest_event type='completed' quest='X' />
  → UI show notification toast

<cmd:scene_change to='cragmaw_hideout' />
  → UI trigger map transition

<cmd:suggest>
  - Tấn công goblin còn lại
  - Lùi lại tìm chỗ ẩn
  - Đàm phán
</cmd:suggest>
  → UI render 3 quick action buttons
```

Tất cả tags **render-only**. Không có tag nào thay đổi DB.

### 6.4 Sequence narration

Khi Result Object là sequence (nhiều steps), Narrator kể như một đoạn phim liền mạch:

```
"Ngươi lao về bên trái con goblin, đôi chân lướt nhanh qua đám lá khô.
<cmd:rolled action='move' tiles='1'/>
Lưỡi kiếm dài đã sẵn trong tay, ngươi vung lên rồi chém xuống chéo, 
nhắm thẳng vào cổ tên goblin <cmd:rolled attack='17' vs_ac='13'/>.
Tên goblin ngỡ ngàng không kịp né tránh. Lưỡi thép cắm sâu qua xương đòn, 
máu phun thành dòng <cmd:hp_change target='goblin_1' delta='-7'/>.
Tên goblin gục xuống không một tiếng kêu. <cmd:entity_died target='goblin_1'/>
Một còn lại, đang lùi dần về phía sau."
```

---

## 7. CHAT UI MỚI

### 7.1 Cấu trúc message rendering

```
┌────────────────────────────────────────────────────────────┐
│ GM (turn 47):                                              │
│                                                            │
│ Ngươi lao về bên trái con goblin, đôi chân lướt nhanh      │
│ qua đám lá khô.                                            │
│ 🏃 Move: 1 tile (4.5 MP còn lại)                          │
│                                                            │
│ Lưỡi kiếm dài đã sẵn trong tay phải, ngươi vung lên rồi   │
│ chém xuống chéo, nhắm thẳng vào cổ tên goblin.            │
│ 🎲 Attack: 17 vs AC 13 ✓ HIT                              │
│                                                            │
│ Tên goblin ngỡ ngàng không kịp né tránh. Lưỡi thép cắm   │
│ sâu qua xương đòn, máu phun thành dòng.                   │
│ 💔 Goblin: -7 HP                                           │
│                                                            │
│ Tên goblin gục xuống không một tiếng kêu, mắt vẫn mở      │
│ trừng trừng đầy kinh ngạc.                                │
│ ☠ Goblin đã chết                                          │
│                                                            │
│ Một còn lại, đang lùi dần về phía sau.                    │
│                                                            │
│ ╭─────────────────────────────────────────────╮           │
│ │ 💡 Gợi ý hành động:                          │           │
│ │ [⚔ Tấn công goblin còn lại]                  │           │
│ │ [👁 Quan sát xung quanh]                      │           │
│ │ [🏃 Lùi lại tìm chỗ ẩn]                       │           │
│ ╰─────────────────────────────────────────────╯           │
└────────────────────────────────────────────────────────────┘
```

Mỗi `<cmd:*/>` tag render thành inline icon đẹp:
- `<cmd:rolled attack='17' vs_ac='13'/>` → 🎲 Attack: 17 vs AC 13 ✓ HIT
- `<cmd:hp_change target='X' delta='-7'/>` → 💔 X: -7 HP
- `<cmd:entity_died target='X'/>` → ☠ X đã chết
- `<cmd:suggest>...</cmd:suggest>` → quick action buttons

### 7.2 Input modes

```
┌─────────────────────────────────────────────────┐
│ [Do] [Say] [Story] [/cmd]                       │
│                                                  │
│ ▎Tôi tấn công con goblin còn lại                │
│                                                  │
│ Hint: Ctrl+Enter để send, / để slash command    │
└─────────────────────────────────────────────────┘

Mode behavior:
- Do:    Hành động vật lý (default cho mechanic)
- Say:   Dialogue (no roll trừ khi Persuasion/Deception/Intimidation)
- Story: Pure narrative (skip Intent Parser)
- /cmd:  Slash command (skip Intent Parser)
```

### 7.3 Picker popup style

```
Popup chính giữa screen, overlay backdrop:
- 500px wide max
- Auto-focus first option
- Keyboard nav: 1-9, Enter, Esc
- Animation: scale 95% → 100% (200ms)
- Click outside → close
- Dim chat behind (50% opacity)
```

### 7.4 Quick Action Bar (M2)

Below input, persistent shortcuts:
```
┌─────────────────────────────────────────────────────┐
│ [⚔ Attack last] [✨ Cast spell] [👁 Look] [📜 Quest] │
│ [💬 Talk] [🎒 Inventory] [🗺 Map] [⚙ Settings]      │
└─────────────────────────────────────────────────────┘
```

User customize order/visibility.

### 7.5 Repeat last action (R key)

Press R → execute exactly same action sequence as last turn, with same picker choices.

Useful for:
- Combat: attack same enemy with same weapon
- Exploration: search same way

---

## 8. PERFORMANCE COMPARISON

```
v5 (multi-LLM extraction):
- 3-4 LLM calls per turn
- 20-30s per turn
- ~15k tokens per turn
- AI có thể bịa state

v6 (4-step pipeline):
- 1-2 LLM calls per turn
- 5-12s per turn
- ~4-7k tokens per turn
- AI KHÔNG THỂ bịa state (code chặn)
```

### Per-turn breakdown

| Scenario | Intent Parser | Picker wait | Rule Engine | Narrator | Total |
|---|---|---|---|---|---|
| Slash command | skip | skip | <1s | 5s | ~6s |
| Natural + clear | 2s | skip | <1s | 5s | ~8s |
| Natural + picker | 2s | user wait | <1s | 5s | varies |
| Pure narrative | 2s | skip | skip | 5s | ~7s |

---

## 9. LIỆT KÊ CHỨC NĂNG M1

### Intent Parser

| # | Chức năng |
|---|---|
| IP1 | LLM call với prompt tiếng Việt |
| IP2 | Output JSON schema + Zod validation |
| IP3 | 10+ few-shot examples tiếng Việt |
| IP4 | Action types: 15 actions hỗ trợ |
| IP5 | Ambiguity detection |
| IP6 | Confidence scoring |
| IP7 | Skip logic (slash/button/short input) |
| IP8 | Multi-action sequence parsing |
| IP9 | Reuse main model M1 |
| IP10 | Retry on schema fail (1 lần) |

### Skill Picker UI

| # | Chức năng |
|---|---|
| SP1 | Weapon Picker — equipped + unarmed |
| SP2 | Spell Picker — prepared + slots |
| SP3 | Skill Check Picker — 18 D&D skills |
| SP4 | Target Picker — multiple visible entities |
| SP5 | Sequence Confirmation modal |
| SP6 | Modifier display transparent (+5, 1d8+2) |
| SP7 | Keyboard shortcuts (1-9, Enter, Esc) |
| SP8 | Advantage/Disadvantage checkbox |
| SP9 | Cancel/Adjust workflow |
| SP10 | Settings: picker behavior 4 modes |

### Rule Engine

| # | Chức năng |
|---|---|
| RE1 | Dice Module (d20+mod, adv/dis, crit) |
| RE2 | Combat Module (attack/damage/save) |
| RE3 | Spell Module (slots, prepare, AoE) |
| RE4 | Movement Module (pathfind, MP, LoS) |
| RE5 | Action Economy enforcement |
| RE6 | Effect Module (conditions, durations) |
| RE7 | Validation: range, ability, cost |
| RE8 | Result Object builder |
| RE9 | Event bus emit |
| RE10 | Reject invalid sequences with alternatives |

### Narrator

| # | Chức năng |
|---|---|
| NA1 | Single LLM call with Result Object |
| NA2 | System prompt master tiếng Việt |
| NA3 | 3 narrative styles M1 (high-fantasy, kiem-hiep, light) |
| NA4 | 2 GM personas M1 |
| NA5 | Streaming output to UI |
| NA6 | Render-only command tags |
| NA7 | Sequence narration (multi-step liền mạch) |
| NA8 | Pure narrative mode (no Result Object) |
| NA9 | Tag stripping for clean text view |
| NA10 | Retry/Edit/Regenerate buttons |

### Chat UI

| # | Chức năng |
|---|---|
| CH1 | Message rendering với inline tag icons |
| CH2 | Input modes: Do / Say / Story / /cmd |
| CH3 | Streaming text effect |
| CH4 | Picker popup overlay |
| CH5 | Auto-scroll to bottom |
| CH6 | Suggested actions quick buttons |
| CH7 | Repeat last action (R hotkey) |
| CH8 | Edit/regenerate AI message |
| CH9 | Slash command autocomplete |
| CH10 | Entity chip detection (clickable names) |

---

## 10. LIỆT KÊ CHỨC NĂNG M2

### Intent Parser polish

| # | Chức năng |
|---|---|
| IP11 | Separate small model (Qwen 3B) cho speed |
| IP12 | Conditional sequences ("nếu A thì B") |
| IP13 | Better Vietnamese slang understanding |
| IP14 | Context-aware parsing (knows recent actions) |

### Picker enhancements

| # | Chức năng |
|---|---|
| SP11 | Auto-pick best (AI suggests default) |
| SP12 | Action presets (save common combos) |
| SP13 | Quick action bar customization |
| SP14 | Predictive picker (auto-fill from context) |

### Rule Engine advanced

| # | Chức năng |
|---|---|
| RE11 | Reaction triggers (opportunity attacks) |
| RE12 | Concentration tracking |
| RE13 | Combo system (chain abilities) |
| RE14 | Group actions (party/pet commands) |
| RE15 | Stance modes (defensive, aggressive) |

### Narrator features

| # | Chức năng |
|---|---|
| NA11 | 3 narrative styles thêm (grimdark, horror, pulp) |
| NA12 | 3 personas thêm |
| NA13 | Custom style editor |
| NA14 | Custom persona editor |
| NA15 | Working Context Viewer (debug) |
| NA16 | Token usage tracker |
| NA17 | Narrative quality feedback (👍/👎) |
| NA18 | Player edit narrative inline |

### Chat UI advanced

| # | Chức năng |
|---|---|
| CH11 | Mobile responsive layout |
| CH12 | Markdown rich formatting |
| CH13 | Search chat history |
| CH14 | Export conversation |
| CH15 | Bookmark important moments |

---

## 11. SETTINGS UI MỚI

```
Settings > Gameplay > Actions & Chat
─────────────────────────────────────

Intent Parser:
  ☑ Auto-parse natural language
  ☑ Show ambiguity warnings
  ☐ Verbose parser logging (debug)
  
Skill Picker:
  ○ Always show
  ● Show when ambiguous (recommended)
  ○ Skip when clear (power user)
  ○ Auto-pick best (AI guesses)

Sequence Validation:
  ☑ Enforce D&D action economy
  ☑ Confirm complex sequences (3+ actions)
  ☐ Auto-cancel invalid (without prompt)

Narrator:
  Narrative style: [Kiếm Hiệp ▼]
  GM persona: [Lão Tiền Bối ▼]
  Response length: ○ Short  ● Medium  ○ Long
  
  ☑ Stream output as it generates
  ☑ Show inline dice/HP icons
  ☑ Show suggested action buttons
  
Hotkeys:
  R       Repeat last action
  Ctrl+Z  Undo last sequence
  Esc     Cancel current picker
  1-9     Quick select picker options
  /       Open slash command palette
  Tab     Cycle input mode (Do/Say/Story)
```

---

## 12. EDGE CASES

### 12.1 Action không khả thi

Player: "tôi bay lên cao 100 feet"

Rule Engine: reject (no Fly ability)

Response options:
- A) Narrative reject: "Ngươi không có khả năng bay..."
- B) Suggest alternatives: [Leo cây] [Bắn từ vị trí] [Cast Fly nếu có]

Default: **B** với suggestions từ context.

### 12.2 Action quá vague

Player: "tôi làm gì đó để chiến thắng"

Intent Parser: confidence low, intents empty.

Response: prompt clarify với examples.

### 12.3 Player từ chối picker

Esc/Cancel → confirm with options:
- Hủy tất cả sequence
- Hủy chỉ ambiguous step
- Quay lại chọn

### 12.4 Player ép AI bịa kết quả

Player: "tôi roll crit 20 và giết goblin"

Rule Engine: ignore claim, roll thật. AI narrate kết quả thật, không phải claim của player.

App giữ control của dice rolls. Player không cheat được.

### 12.5 Network/LLM fail

Intent Parser fail → fallback: treat as narrative_only.

Narrator fail → retry 1 lần, sau đó show error với option:
- Retry
- Edit input
- Skip turn (advance time only)

---

## 13. MIGRATION TỪ V5

### Bỏ
- ✗ State Extractor LLM
- ✗ Item Detector LLM
- ✗ Movement Detector LLM
- ✗ Branch Detector LLM
- ✗ AI auto-generate state changes
- ✗ Command tags `<cmd:apply_damage/>` từ AI

### Thêm
- ✓ Intent Parser LLM (small, fast)
- ✓ Skill Picker UI (4 types)
- ✓ Rule Engine pure code
- ✓ Result Object schema
- ✓ Render-only tags (UI inline icons)
- ✓ Sequence execution với action economy

### Giữ
- ✓ Ollama integration
- ✓ Narrative styles + Personas
- ✓ Database schema 28 bảng
- ✓ Tiếng Việt prompt engineering
- ✓ Settings architecture
- ✓ Memory async summarizer

---

## 14. ROADMAP M1 UPDATE

### 12 tuần M1 (vibe coding)

**Week 1-2 — Foundation:**
- Ollama integration
- Tauri + Next.js setup
- SQLite schema cơ bản

**Week 3-4 — Rule Engine modules:**
- Dice Module
- Combat Module
- Stat Calculator
- Validation Module
- Movement Module

**Week 5-6 — More modules:**
- Spell Module
- Action Economy Module
- Effect Module
- Inventory Module
- Item Module + templates

**Week 7 — Intent Parser:**
- LLM prompt với few-shot tiếng Việt
- JSON schema validation
- Slash command parser
- UI button mapping
- Confidence handling

**Week 8 — Skill Picker UI:**
- Weapon Picker
- Spell Picker
- Skill Check Picker
- Target Picker
- Sequence Confirmation

**Week 9 — Result Object + Narrator:**
- Result Object builder
- Narrator system prompt
- 3 styles + 2 personas
- Streaming output

**Week 10 — Chat UI:**
- Message rendering với inline tags
- Input modes (Do/Say/Story/cmd)
- Picker popup overlay
- Suggested actions

**Week 11 — Quest + Memory:**
- Quest Module + event bus
- Memory async summarizer
- Notebook UI

**Week 12 — Campaign + Polish:**
- Campaign loader
- 1 campaign tiếng Việt
- Save/load
- Settings UI
- M1 integration test

**Gate M1:** Chơi 2 tiếng, AI nhớ NPC đúng turn 50+, không bịa số, picker không annoying.

---

## 15. SUMMARY

### Câu thần chú (lặp lại)
> **AI là Narrator giỏi, không phải Game Master.**
> **Code là Game Master. AI chỉ đọc kết quả và diễn đạt.**

### 5 layers phân quyền cuối cùng

| Layer | Role | LLM? |
|---|---|---|
| Player | Quyết định strategy | - |
| Intent Parser | Phân tích text → intents | 1 small call |
| UI Picker | Show choices, confirm | No |
| Rule Engine | Apply D&D rules, roll, calculate | No |
| Narrator | Tả thành câu chuyện | 1 main call |

**2 LLM calls maximum per turn. Mọi mechanic deterministic.**

### Lợi ích
1. Game cân bằng (code apply rule)
2. Reproducible (same input → same numbers)
3. Debuggable (bug = code bug)
4. Fast (5-12s thay vì 20-30s)
5. Cheap (~60% giảm token)
6. Robust (AI fail không phá state)
7. Vibe coding friendly (modules độc lập)
8. Test coverage (unit test modules)
9. Local LLM friendly (không cần JSON gymnastics)
10. Player có tactical agency (chọn skill)

---

**Hết bản cập nhật AI Engine & Chat Pipeline v6**

File này thay thế hoàn toàn TRỤ 7 trong PLAN_V5.md. Các trụ 1-6 giữ nguyên.
