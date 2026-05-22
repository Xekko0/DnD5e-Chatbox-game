# XekkoDND — Rule Engine Modules dựa trên SRD 5.2

> **Phiên bản:** v6 patch — Rule Engine Spec
> **Bộ luật nguồn:** D&D 5e SRD 5.2 (CC-BY-4.0, Wizards of the Coast, 2025)
> **Phạm vi:** Liệt kê đầy đủ chức năng Rule Engine cần implement cho Code Layer
> **Lưu ý:** Đây là code thuần TypeScript, không LLM. AI chỉ narrate kết quả.

---

## MỤC LỤC

```
1. NGUYÊN TẮC CHUYỂN HÓA SRD → CODE
2. MODULE 1: ABILITIES & MODIFIERS
3. MODULE 2: D20 TESTS (Checks/Saves/Attacks)
4. MODULE 3: ACTION ECONOMY
5. MODULE 4: COMBAT
6. MODULE 5: DAMAGE & HEALING
7. MODULE 6: MOVEMENT & POSITION
8. MODULE 7: CONDITIONS
9. MODULE 8: SPELLS
10. MODULE 9: EQUIPMENT
11. MODULE 10: REST & RECOVERY
12. MODULE 11: CHARACTER CREATION
13. MODULE 12: LEVELING & XP
14. MODULE 13: EXPLORATION
15. MODULE 14: SOCIAL INTERACTION
16. SCOPE CẮT GỌN CHO M1
17. ROADMAP TRIỂN KHAI
```

---

## 1. NGUYÊN TẮC CHUYỂN HÓA SRD → CODE

### 1.1 Triết lý áp dụng luật

**SRD nói gì → Code làm đúng vậy.** Không bend rule, không tự sáng tạo công thức.

```
SRD rule:     "Attack roll: 1d20 + ability modifier + proficiency bonus (if proficient)"
Code:         attackRoll(attacker, weapon) = d20() + abilityMod + (isProficient ? profBonus : 0)
```

### 1.2 4 cấp ưu tiên khi xử lý luật

```
1. Specific rule overrides general rule
   Ví dụ: Fighter Action Surge → +1 Action (vượt quy tắc 1 Action/turn)
   
2. Player choice overrides AI suggestion
   Ví dụ: AI suggest weapon, player có thể chọn khác
   
3. Code validation overrides player input
   Ví dụ: player muốn attack với spell slot 5 → reject nếu chỉ có slot 3
   
4. Settings override defaults
   Ví dụ: "loose rules" mode → skip một số validation
```

### 1.3 Round Down rule (SRD)

> "Whenever you divide or multiply a number in the rules, round down even if the result is half or more."

Code: dùng `Math.floor()` cho mọi phép chia.

### 1.4 Variant rules vs core rules

SRD có nhiều "variant rules" optional. M1 chỉ implement core. Variant sẽ là toggle settings ở M2+.

---

## 2. MODULE 1: ABILITIES & MODIFIERS

### 2.1 6 Ability Scores (SRD: The Six Abilities)

```
Strength (STR)      — Physical might
Dexterity (DEX)     — Agility, reflexes, balance
Constitution (CON)  — Health, stamina
Intelligence (INT)  — Reasoning, memory
Wisdom (WIS)        — Perceptiveness, mental fortitude
Charisma (CHA)      — Confidence, poise, charm
```

### 2.2 Ability Score range

```
1-3:   Lowest possible (creature dies/incapacitated if drops to 0)
4-7:   Weak capability
8-11:  Human average
12-15: Strong capability
16-20: Maximum for adventurers
21-30: Extraordinary (artifacts, deities)
```

### 2.3 Ability Modifier formula

```
modifier = floor((score - 10) / 2)

Score 1  → mod -5
Score 8  → mod -1
Score 10 → mod  0
Score 14 → mod +2
Score 20 → mod +5
Score 30 → mod +10
```

### 2.4 Chức năng cần implement

| # | Chức năng | Module |
|---|---|---|
| AB1 | Compute modifier từ score | Ability |
| AB2 | Validate score range (1-30) | Validation |
| AB3 | Track temporary score changes (buffs) | Effect |
| AB4 | Recompute dependent stats khi score change | Stat |
| AB5 | Handle score 0 case (incapacitation) | Condition |

---

## 3. MODULE 2: D20 TESTS

### 3.1 3 loại D20 Test (SRD)

```
1. Ability Check    — overcome a challenge
2. Saving Throw     — resist effect
3. Attack Roll      — try to hit target
```

Tất cả đều theo công thức: `d20 + modifiers`

### 3.2 Ability Check

```
result = d20 + ability_modifier + (proficient ? proficiency_bonus : 0) + situational_modifiers
success = result >= DC
```

**Difficulty Classes (SRD):**
```
Very Easy:    5
Easy:        10
Medium:      15
Hard:        20
Very Hard:   25
Nearly Impossible: 30
```

**Skills (SRD list — 18 skills):**
```
Strength:     Athletics
Dexterity:    Acrobatics, Sleight of Hand, Stealth
Intelligence: Arcana, History, Investigation, Nature, Religion
Wisdom:       Animal Handling, Insight, Medicine, Perception, Survival
Charisma:     Deception, Intimidation, Performance, Persuasion
```

### 3.3 Saving Throw

```
result = d20 + ability_modifier + (proficient ? proficiency_bonus : 0)
success = result >= DC
```

Mỗi class proficient ở 2 saves cụ thể (SRD class section).

### 3.4 Attack Roll

```
result = d20 + ability_modifier + proficiency_bonus (always proficient with own weapons) + magical_bonus + situational
hit = result >= target_AC

Natural 20 (dice = 20) → Critical Hit (auto hit, extra damage dice)
Natural 1 (dice = 1)   → Critical Miss (auto miss)
```

### 3.5 Advantage / Disadvantage (SRD)

```
Advantage:    Roll 2d20, take higher
Disadvantage: Roll 2d20, take lower

Multiple sources don't stack:
- 2 sources Advantage = still 1 Advantage
- 1 Advantage + 1 Disadvantage = neutral (cancel out)
- 2 Advantage + 1 Disadvantage = neutral
```

### 3.6 Proficiency Bonus by level (SRD table)

```
Level  1-4:  +2
Level  5-8:  +3
Level  9-12: +4
Level 13-16: +5
Level 17-20: +6
```

### 3.7 Expertise (SRD)

Một số class features (Rogue, Bard) cho Expertise:
```
Expertise: Double the proficiency bonus for specific skill
Modifier with expertise = ability_mod + (2 × proficiency_bonus)
```

### 3.8 Passive Checks (SRD)

```
Passive Score = 10 + all modifiers that would apply to active check

Used for:
- Passive Perception (detect hidden enemies)
- Passive Investigation (notice clues)
- Passive Insight (sense lies)
```

### 3.9 Group Checks (SRD)

```
Group of creatures all make same check:
- If at least half succeed → group succeeds
- Otherwise → group fails

Used cho: stealth as party, navigation
```

### 3.10 Chức năng cần implement

| # | Chức năng |
|---|---|
| D20_1 | rollD20() basic |
| D20_2 | rollAdvantage() / rollDisadvantage() |
| D20_3 | Advantage/Disadvantage stacking rule |
| D20_4 | abilityCheck(entity, ability, skill?, dc) |
| D20_5 | savingThrow(entity, ability, dc) |
| D20_6 | attackRoll(attacker, target, weapon) |
| D20_7 | Critical hit detection (nat 20) |
| D20_8 | Critical miss handling (nat 1) |
| D20_9 | Passive score calculation |
| D20_10 | Group check resolution |
| D20_11 | Expertise modifier doubling |
| D20_12 | Proficiency bonus by level lookup |
| D20_13 | Situational modifier injection (cover, conditions) |
| D20_14 | Inspiration (re-roll mechanic) |

---

## 4. MODULE 3: ACTION ECONOMY

### 4.1 Mỗi turn 1 character có (SRD)

```
1 Action
1 Bonus Action (if available)
1 Reaction (offensive/defensive, before next turn)
Movement up to Speed
Free interactions (1 object/feature)
```

### 4.2 Actions list (SRD core actions)

```
Attack       — make weapon attack(s)
Cast a Spell — cast spell with casting time = 1 action
Dash         — extra movement = Speed
Disengage    — move away without provoking opportunity attacks
Dodge        — disadvantage on attack rolls against you, advantage on Dex saves
Help         — give ally advantage on next ability check or attack
Hide         — Stealth check
Influence    — try to change creature's attitude (Persuasion/Deception/Intimidation)
Magic        — use magic item
Ready        — prepare action for trigger
Search       — make Perception/Investigation check
Study        — recall info (Arcana/History/Nature/Religion)
Utilize      — interact with 2nd object
```

### 4.3 Bonus Actions (SRD)

Chỉ available nếu class feature/spell cho phép. Ví dụ:
```
Two-Weapon Fighting:       off-hand attack
Cunning Action (Rogue):    Dash, Disengage, Hide as bonus action
Bardic Inspiration:        grant inspiration die
Healing Word (spell):      heal as bonus action
```

### 4.4 Reactions (SRD)

```
Opportunity Attack:  when enemy moves out of reach
Counterspell:        interrupt spell casting
Shield (spell):      +5 AC reactively
Uncanny Dodge:       halve damage from attack
```

Mỗi reaction triggered → uses Reaction slot till next turn.

### 4.5 Free Object Interaction (SRD)

```
1 free interaction per turn:
- Draw weapon
- Open unlocked door
- Pull lever
- Pick up item from ground
- Hand item to ally

2nd interaction = Utilize action
```

### 4.6 Chức năng cần implement

| # | Chức năng |
|---|---|
| AE1 | TurnTracker: track Action/Bonus/Reaction/Movement per entity |
| AE2 | Reset action economy at start of turn |
| AE3 | validateAction(entity, action_type): can_do? |
| AE4 | Free interaction counter (max 1) |
| AE5 | Reaction trigger system |
| AE6 | Dash extra movement |
| AE7 | Dodge effect (disadvantage on attackers) |
| AE8 | Help effect (advantage on ally) |
| AE9 | Ready action with trigger |
| AE10 | Hide → grants Invisible condition (SRD) |
| AE11 | Disengage (no opportunity attacks) |
| AE12 | Class feature actions (Action Surge, Cunning Action, etc) |

---

## 5. MODULE 4: COMBAT

### 5.1 Initiative (SRD)

```
At combat start:
  For each entity: initiative = d20 + Dex_modifier
  Sort descending → turn order
  
Ties:
  Monsters: GM decides (code: random)
  Players: players decide (code: prompt UI)
  Mixed: GM decides
  
Group of identical monsters:
  Single roll → all members share initiative
```

### 5.2 Surprise (SRD)

```
If combatant surprised:
  → Disadvantage on initiative roll
  
Surprise điều kiện:
- Hidden from foe
- Foe unaware
```

### 5.3 Making an Attack (SRD)

```
Steps:
1. Choose target (within range, has line of sight)
2. Roll attack: d20 + ability_mod + prof_bonus + modifiers
3. Compare with target AC
4. If hit: roll damage
5. Apply damage
```

### 5.4 Melee vs Ranged attacks (SRD)

```
Melee:
  - Default: Strength modifier
  - Finesse weapon: choose STR or DEX
  - Range: Reach (default 5ft, Reach property = 10ft)
  
Ranged:
  - Default: Dexterity modifier
  - Range: normal/long (e.g. 80/320 ft)
  - Long range: Disadvantage on attack
  - Adjacent enemy: Disadvantage (within 5ft)
```

### 5.5 Cover (SRD)

```
Half cover:        +2 AC, +2 Dex saves
Three-quarters:    +5 AC, +5 Dex saves
Total cover:       Cannot be targeted directly
```

### 5.6 Unseen Attackers/Targets (SRD)

```
Attacker unseen by target → Advantage on attack
Target unseen by attacker → Disadvantage on attack
Both: cancel out (neutral)
```

### 5.7 Special Combat Actions (SRD)

```
Grappling:
  - Athletics check vs target's Athletics or Acrobatics
  - Success: target Grappled condition
  
Shoving:
  - Athletics check vs target's Athletics or Acrobatics
  - Success: push 5 ft OR knock Prone
  
Two-Weapon Fighting:
  - Main attack action, then bonus action attack with off-hand
  - Off-hand: no ability mod on damage (unless feature)
  - Both weapons must have Light property
```

### 5.8 Mounted Combat (SRD M2+)

```
Mount controlled or independent
Movement uses mount's speed
Forced dismount: Save or fall
```

### 5.9 Underwater Combat (SRD M3)

```
Most weapons: Disadvantage on attack
Fire damage: half
Ranged weapons: only crossbows/nets normal, others fail
```

### 5.10 Chức năng cần implement

| # | Chức năng |
|---|---|
| CB1 | Initiative roll & order |
| CB2 | Surprise detection & disadvantage |
| CB3 | Combat state machine (in_combat, round_number, current_turn) |
| CB4 | rollInitiative(all_entities) |
| CB5 | makeAttack(attacker, target, weapon) |
| CB6 | Range validation (melee reach, ranged near/far) |
| CB7 | Line of sight calculation |
| CB8 | Cover detection (half/three-quarter/total) |
| CB9 | Unseen attacker/target advantage logic |
| CB10 | Damage roll execution |
| CB11 | Critical hit damage (double dice, not modifier) |
| CB12 | Grapple action |
| CB13 | Shove action |
| CB14 | Two-weapon fighting bonus attack |
| CB15 | Combat end detection (all enemies dead/fled) |
| CB16 | Opportunity attack trigger |

---

## 6. MODULE 5: DAMAGE & HEALING

### 6.1 Hit Points (SRD)

```
HP = result of taking damage over time
At 0 HP: Unconscious + Dying (for player) or Dead (for typical monster)
Max HP: from class hit die + Con mod per level
```

### 6.2 Damage Roll (SRD)

```
damage = weapon_dice + ability_modifier + magical_bonus
type   = weapon damage type (slashing/piercing/bludgeoning/elemental)

Critical Hit:
  damage = (2 × weapon_dice) + ability_modifier + magical_bonus
  (double dice only, NOT modifier)
```

### 6.3 Damage Types (SRD list)

```
Physical:
  - Slashing, Piercing, Bludgeoning
  
Elemental:
  - Acid, Cold, Fire, Lightning, Thunder
  
Energy:
  - Force, Necrotic, Psychic, Radiant
  
Other:
  - Poison
```

### 6.4 Resistance / Vulnerability / Immunity (SRD)

```
Resistance:   damage halved (rounded down)
Vulnerability: damage doubled
Immunity:     damage = 0

Stacking:
- Multiple resistances to same type: still half
- Resistance + Vulnerability: cancel out (full damage)
- Immunity beats both
```

### 6.5 Saving Throws and Damage (SRD)

```
Many spells: target makes save
- Save success: half damage (default)
- Save fail: full damage

Some effects:
- Save success: no damage
- Save fail: full damage + condition
```

### 6.6 Temporary Hit Points (SRD)

```
Temp HP not added to current HP — separate pool
Damage reduces Temp HP first, then current HP
Multiple sources: don't stack — take higher
Temp HP doesn't recover from rest
Duration: usually until next long rest
```

### 6.7 Healing (SRD)

```
Healing magic: heal specified amount (e.g. Cure Wounds 1d8 + spellcasting mod)
Cannot heal beyond max HP
Healing while at 0 HP: regain consciousness
Healing while Dead: cannot (need Resurrection magic)
```

### 6.8 Dropping to 0 HP (SRD)

```
Player Character at 0 HP:
  - Unconscious condition
  - Start making Death Saves
  
Death Saves:
  - At start of turn: roll d20
  - >= 10: success (3 to stabilize)
  - < 10: failure (3 to die)
  - Nat 20: regain 1 HP, conscious
  - Nat 1: counts as 2 failures
  - Reset on healing
  
Damage while at 0 HP:
  - Each instance = 1 death save failure
  - Critical hit damage = 2 failures
  - Damage >= max HP = instant death
  
Monsters at 0 HP:
  - Usually die immediately (some special cases)
  - Boss monsters may have additional rules
```

### 6.9 Massive Damage Instant Death (SRD)

```
If damage taken in single hit >= max HP:
  → Instant death (not unconscious)
```

### 6.10 Chức năng cần implement

| # | Chức năng |
|---|---|
| DH1 | applyDamage(entity, amount, type) |
| DH2 | Damage type validation |
| DH3 | Resistance/Vulnerability/Immunity computation |
| DH4 | Temp HP separate pool |
| DH5 | Critical hit damage formula |
| DH6 | Saving throw damage halving |
| DH7 | applyHealing(entity, amount) |
| DH8 | HP clamp (0 to max) |
| DH9 | Drop to 0 HP detection |
| DH10 | Death save state machine (player) |
| DH11 | Monster death (no death saves) |
| DH12 | Massive damage instant death |
| DH13 | Stabilize action (Medicine check) |
| DH14 | Revivify/Raise Dead handling |
| DH15 | Unconscious from 0 HP recovery |

---

## 7. MODULE 6: MOVEMENT & POSITION

### 7.1 Speed (SRD)

```
Default Speed: depends on species (most: 30 ft)
Modes:
- Walking (default)
- Climbing
- Swimming
- Flying
- Burrowing
```

### 7.2 Movement Rules (SRD)

```
Each turn: move up to Speed feet
Movement can be broken up around actions
Difficult Terrain: 1 ft costs 2 ft of movement
Climbing/Swimming: 1 ft costs 2 ft (no climb/swim speed)
```

### 7.3 Grid Movement (SRD optional)

```
1 square = 5 feet
Diagonal: 1 square (D&D default)
  - Variant: 1st diagonal = 5ft, 2nd = 10ft (more realistic)
```

### 7.4 Creature Size and Space (SRD)

```
Size           Space (feet)
─────────────────────────────
Tiny           2.5 × 2.5
Small          5 × 5
Medium         5 × 5
Large          10 × 10
Huge           15 × 15
Gargantuan     20 × 20 or larger
```

### 7.5 Forced Movement (SRD)

```
Pushed, pulled, knocked back by effects
Does NOT count against your Speed
Provokes opportunity attacks unless effect specifies otherwise
```

### 7.6 Standing Up from Prone

```
Cost: half your Speed
Prone condition removed
```

### 7.7 Dropping Prone

```
Free (no action, no movement cost)
Apply Prone condition
```

### 7.8 Squeezing (SRD)

```
Squeezing into smaller space:
  - Costs 1 extra foot per foot moved
  - Disadvantage on attacks and Dex saves
  - Attacks against you have Advantage
```

### 7.9 Chức năng cần implement

| # | Chức năng |
|---|---|
| MV1 | computeSpeed(entity, environment) |
| MV2 | movementCost(from, to, terrain) |
| MV3 | A* pathfinding với terrain costs |
| MV4 | Break up movement around actions |
| MV5 | Difficult Terrain cost x2 |
| MV6 | Diagonal movement rules (standard + variant) |
| MV7 | Creature size validation |
| MV8 | Drop Prone (free) |
| MV9 | Stand from Prone (half speed) |
| MV10 | Forced movement (push/pull) |
| MV11 | Climbing/Swimming as part of move |
| MV12 | Flying with Fall rule |
| MV13 | Squeezing into tight space |
| MV14 | Opportunity Attack trigger |

---

## 8. MODULE 7: CONDITIONS

### 8.1 Conditions list (SRD)

15 conditions chính:

```
Blinded         — can't see, fail Sight checks, Dis on attacks, Adv against you
Charmed         — can't attack charmer, charmer has Adv on social
Deafened        — can't hear, fail Hearing checks
Frightened      — Dis on ability checks and attacks while source visible, can't move closer
Grappled        — Speed = 0, ends if grappler incapacitated
Incapacitated   — can't take actions, reactions, or move
Invisible       — heavily obscured, attacks against you have Dis, your attacks have Adv
Paralyzed       — Incapacitated + can't speak + auto fail STR/DEX saves + crit at melee 5ft
Petrified       — turned to stone, Incapacitated + various
Poisoned        — Dis on attacks and ability checks
Prone           — can only crawl, Dis on attacks, melee attackers have Adv, ranged have Dis
Restrained      — Speed 0, Dis on attacks, Dex saves, attackers Adv
Stunned         — Incapacitated + can't move + auto fail STR/DEX saves + attackers Adv
Unconscious     — Incapacitated + drop everything + fall Prone + auto fail STR/DEX + crit at 5ft
Exhaustion (6 levels):
  Lv 1: Dis on ability checks
  Lv 2: Speed halved
  Lv 3: Dis on attacks and saves
  Lv 4: HP max halved
  Lv 5: Speed 0
  Lv 6: Death
```

### 8.2 Condition application

```
Apply: insert into conditions_active table
Duration:
  - Until next short rest
  - Until next long rest
  - Specific turn count
  - Until save success (each turn at end)
  - Permanent (cure required)
  
Remove:
  - Duration expires
  - Successful save (some conditions allow)
  - Cure magic (Lesser/Greater Restoration)
  - Source ends (Charmed: charmer leaves)
```

### 8.3 Multiple conditions stacking

```
Multiple instances same condition: usually doesn't stack (except Exhaustion)
Exhaustion: levels stack (cumulative)
```

### 8.4 Chức năng cần implement

| # | Chức năng |
|---|---|
| CN1 | applyCondition(entity, condition, duration, source) |
| CN2 | removeCondition(entity, condition) |
| CN3 | hasCondition(entity, condition) |
| CN4 | Condition effects auto-apply (Dis on attacks for Poisoned, etc) |
| CN5 | Condition duration tracking (turns, until rest) |
| CN6 | Save-to-end mechanic (end of turn save) |
| CN7 | Exhaustion 6-level system |
| CN8 | Conditions affect computeStats() output |
| CN9 | Auto-fail STR/DEX saves for Paralyzed/Stunned/Unconscious |
| CN10 | Crit at melee 5ft for Paralyzed/Unconscious |
| CN11 | Grappled ends if grappler Incapacitated |
| CN12 | Unconscious → drop items, fall Prone |
| CN13 | Exhaustion Lv 6 → death |
| CN14 | Restoration spells (Lesser/Greater) cure |

---

## 9. MODULE 8: SPELLS

### 9.1 Spell Slots (SRD)

```
Spell slots by class level:
- Each class has own slot table
- Cantrips: no slot needed
- Levels 1-9 spell slots
- Slot levels reset on long rest
- Some classes (Warlock): short rest reset
```

### 9.2 Spell Casting Components (SRD)

```
V (Verbal):    must be able to speak (silenced/incapacitated → fail)
S (Somatic):   must have free hand
M (Material):  must have specified component or focus
  - Some materials consumed (gold pieces, diamond)
  - Most reusable via spellcasting focus
```

### 9.3 Casting Time (SRD)

```
1 Action       — most spells
1 Bonus Action — some
1 Reaction     — Counterspell, Shield, etc
1 Minute       — rituals (10 minutes if no Ritual feature)
10 Minutes+    — out-of-combat utility
```

### 9.4 Spell Range (SRD)

```
Self              — only caster
Touch             — adjacent
Specific feet     — e.g. 30/60/120/300 feet
Sight             — anywhere caster can see
Unlimited         — same plane
```

### 9.5 Concentration (SRD)

```
Some spells require concentration to maintain
While concentrating:
  - Take damage → CON save DC = max(10, damage_taken / 2)
  - Fail → concentration broken, spell ends
  - Cast another concentration spell → previous ends
  - Incapacitated → ends
  - Die → ends
```

### 9.6 Spell Attack & DC (SRD)

```
Spell Save DC = 8 + proficiency_bonus + spellcasting_ability_modifier
Spell Attack  = proficiency_bonus + spellcasting_ability_modifier + d20
```

### 9.7 Area of Effect (SRD)

```
Cone:    triangle from point of origin
Cube:    square area
Cylinder: circle with height
Line:    rectangular path
Sphere:  ball expanding from point
```

### 9.8 Spell Lists (SRD)

Mỗi class có spell list riêng. SRD bao gồm spell lists cho:
- Bard, Cleric, Druid, Paladin, Ranger, Sorcerer, Warlock, Wizard

### 9.9 Spell Casting Steps

```
1. Player chooses spell
2. Validate:
   - Have spell prepared/known?
   - Have spell slot of right level?
   - Have required components?
   - Target in range?
   - Action economy available?
3. Consume spell slot (or cantrip = no consume)
4. If attack roll: makeSpellAttack()
5. If save: target.savingThrow()
6. Apply effects (damage/healing/condition)
7. Start concentration if needed
8. Apply spell duration tracking
```

### 9.10 Chức năng cần implement

| # | Chức năng |
|---|---|
| SP1 | Spell template database (SRD spells) |
| SP2 | castSpell(caster, spell, slot_level, target) |
| SP3 | Spell slot tracking per character |
| SP4 | Spell preparation system |
| SP5 | Cantrip (unlimited use) |
| SP6 | Components validation (V/S/M) |
| SP7 | Spell DC computation |
| SP8 | Spell attack roll |
| SP9 | AoE calculation (cone/cube/cylinder/line/sphere) |
| SP10 | Concentration tracking (1 per caster) |
| SP11 | Concentration save (damage trigger) |
| SP12 | Spell duration counter |
| SP13 | Ritual casting (10 min, no slot) |
| SP14 | Counterspell reaction |
| SP15 | Spell scroll usage |
| SP16 | Upcasting (higher slot = more dice) |

---

## 10. MODULE 9: EQUIPMENT

### 10.1 Weapons (SRD)

```
Simple weapons:
  Melee:  Club, Dagger, Greatclub, Handaxe, Javelin, Light Hammer,
          Mace, Quarterstaff, Sickle, Spear
  Ranged: Crossbow (light), Dart, Shortbow, Sling
  
Martial weapons:
  Melee:  Battleaxe, Flail, Glaive, Greataxe, Greatsword, Halberd,
          Lance, Longsword, Maul, Morningstar, Pike, Rapier, Scimitar,
          Shortsword, Trident, War Pick, Warhammer, Whip
  Ranged: Blowgun, Crossbow (hand/heavy), Longbow, Net
```

### 10.2 Weapon Properties (SRD)

```
Ammunition:    requires ammo (arrows, bolts)
Finesse:       use STR or DEX modifier
Heavy:         disadvantage if Small creature
Light:         can use for off-hand
Loading:       only 1 attack per action regardless of bonus attacks
Range:         e.g. 80/320 (normal/long)
Reach:         5 extra feet
Special:       special rule in description
Thrown:        can throw with same modifier
Two-Handed:    requires 2 hands
Versatile:     1-handed (1d8) or 2-handed (1d10)
```

### 10.3 Weapon Damage (SRD)

Mỗi weapon có damage dice + type. Ví dụ:
```
Longsword:  1d8 slashing (versatile 1d10)
Shortbow:   1d6 piercing (range 80/320)
Dagger:     1d4 piercing (finesse, light, thrown 20/60)
```

### 10.4 Armor (SRD)

```
Light Armor:
  Padded:    AC 11 + Dex
  Leather:   AC 11 + Dex
  Studded:   AC 12 + Dex
  
Medium Armor:
  Hide:      AC 12 + Dex (max 2)
  Chain Shirt: AC 13 + Dex (max 2)
  Scale Mail:  AC 14 + Dex (max 2)
  Breastplate: AC 14 + Dex (max 2)
  Half Plate:  AC 15 + Dex (max 2)
  
Heavy Armor:
  Ring Mail:    AC 14 (no Dex)
  Chain Mail:   AC 16 (no Dex, STR 13)
  Splint:       AC 17 (no Dex, STR 15)
  Plate:        AC 18 (no Dex, STR 15)
  
Shield: +2 AC (not stack with two-handed)
```

### 10.5 Armor Properties (SRD)

```
Stealth Disadvantage: Medium/Heavy except mentioned
STR Requirement: Heavy armor needs min STR or Speed -10
Donning/Doffing: takes time (Light 1 min, Medium 5 min, Heavy 10 min)
```

### 10.6 Adventuring Gear (SRD)

```
Backpacks, ropes, torches, rations, bedroll, holy symbol, 
arcane focus, spellbook, healing potion, etc.
~100+ items in SRD
```

### 10.7 Currency (SRD)

```
Copper Piece (cp)
Silver Piece (sp)    = 10 cp
Electrum (ep)        = 5 sp = 50 cp
Gold Piece (gp)      = 2 ep = 10 sp = 100 cp
Platinum (pp)        = 10 gp = 1000 cp
```

### 10.8 Encumbrance (SRD optional)

```
Carrying Capacity = STR × 15 (lb)
Push/Drag/Lift     = STR × 30
Variant Encumbrance:
  - STR × 5: Encumbered (Speed -10)
  - STR × 10: Heavily Encumbered (Speed -20, Disadvantage)
```

### 10.9 Chức năng cần implement

| # | Chức năng |
|---|---|
| EQ1 | Weapon database (SRD list ~30 weapons) |
| EQ2 | Weapon property handling |
| EQ3 | Armor database (SRD list ~13 armors) |
| EQ4 | AC computation (base + dex + shield + magical) |
| EQ5 | Armor STR requirement |
| EQ6 | Stealth disadvantage from armor |
| EQ7 | Don/Doff time |
| EQ8 | Adventuring gear catalog |
| EQ9 | Currency conversion |
| EQ10 | Carrying capacity |
| EQ11 | Encumbrance (M2 variant rule) |
| EQ12 | Magical weapon bonuses (+1/+2/+3) |
| EQ13 | Magical armor bonuses |
| EQ14 | Attunement tracking (max 3) |
| EQ15 | Ammunition tracking |

---

## 11. MODULE 10: REST & RECOVERY

### 11.1 Short Rest (SRD)

```
Duration: 1 hour
Activity: light (binding wounds, eating, drinking)
Benefits:
  - Spend Hit Dice to heal (1d# + Con mod per die)
  - Recover class features (some)
  - Warlock spell slots recover
```

### 11.2 Long Rest (SRD)

```
Duration: 8 hours (at least 6 hours sleep + 2 hours light activity)
Benefits:
  - HP fully restored
  - Half of max Hit Dice recovered (round down, min 1)
  - All spell slots recovered
  - Some class features reset
  - Exhaustion level -1
  
Limitations:
  - Only 1 Long Rest per 24 hours
  - Must have at least 1 HP before resting
```

### 11.3 Interrupted Rest (SRD)

```
Long Rest interrupted by:
  - 1 hour walking
  - 1 hour combat
  - Spell casting
  - Significant exertion
→ Must restart
```

### 11.4 Hit Dice (SRD)

```
Per class:
  Barbarian: d12
  Fighter/Paladin/Ranger: d10
  Bard/Cleric/Druid/Monk/Rogue/Warlock: d8
  Sorcerer/Wizard: d6

You have 1 Hit Die per level.
Spend during short rest to heal: roll die + Con mod (no negative)
Recover half on long rest.
```

### 11.5 Chức năng cần implement

| # | Chức năng |
|---|---|
| RR1 | shortRest(character) |
| RR2 | longRest(character) |
| RR3 | Spend Hit Dice mechanism |
| RR4 | Class feature reset (short/long) |
| RR5 | Spell slot recovery |
| RR6 | Exhaustion -1 on long rest |
| RR7 | Hit Dice recovery (half on long rest) |
| RR8 | Long Rest 24h cooldown |
| RR9 | Rest interruption detection |
| RR10 | Time advancement during rest |

---

## 12. MODULE 11: CHARACTER CREATION

### 12.1 6-Step process (SRD)

```
1. Choose Class
2. Determine Origin (Background + Species)
3. Determine Ability Scores
4. Choose Equipment
5. Describe Character
6. Get into Game
```

### 12.2 Ability Score Generation (SRD methods)

**Method 1: Standard Array**
```
[15, 14, 13, 12, 10, 8] — assign to 6 abilities
```

**Method 2: Point Buy**
```
27 points to spend
Score 8 = 0 pts
Score 9 = 1 pt
Score 10 = 2 pts
Score 11 = 3 pts
Score 12 = 4 pts
Score 13 = 5 pts
Score 14 = 7 pts
Score 15 = 9 pts (max start)
```

**Method 3: Random Roll**
```
4d6 drop lowest, 6 times
Assign to abilities
```

### 12.3 Background bonuses (SRD)

Background provides:
- 2 skill proficiencies
- 1 language or tool
- Starting equipment
- Ability score bonuses (Origin Feat)

### 12.4 Species (SRD core)

Core SRD includes:
- Dragonborn, Dwarf, Elf, Gnome, Goliath, Halfling, Human, Orc, Tiefling

Each species:
- Size, Speed
- Vision (darkvision?)
- Racial features
- No ability score bonus in 2024 rules (moved to background)

### 12.5 Classes (SRD 12 classes)

```
Barbarian, Bard, Cleric, Druid, Fighter, Monk,
Paladin, Ranger, Rogue, Sorcerer, Warlock, Wizard
```

Each at Level 1:
- Hit Dice
- Starting HP = Hit Die max + Con mod
- Proficiencies (armor, weapons, saves, skills)
- Starting equipment
- Class features

### 12.6 Multiclassing (SRD)

```
Requirements:
  - Min 13 in primary ability of original class
  - Min 13 in primary ability of new class

Benefits gained:
  - Hit dice from new class
  - Proficiencies (limited)
  - Class features

Spell slots:
  - Combined caster level for slots
  - Spells known/prepared separate per class
```

### 12.7 Chức năng cần implement

| # | Chức năng |
|---|---|
| CC1 | Character creation wizard UI |
| CC2 | Ability score generation (3 methods) |
| CC3 | Standard Array assignment |
| CC4 | Point Buy validator |
| CC5 | Random roll (4d6 drop lowest) |
| CC6 | Species database (9 SRD species) |
| CC7 | Background database (SRD list) |
| CC8 | Class database (12 SRD classes) |
| CC9 | Class feature lookup at level 1 |
| CC10 | Skill proficiency from class+background |
| CC11 | Starting equipment package |
| CC12 | Starting HP calculation |
| CC13 | Multiclassing validation |
| CC14 | Character validation (legal build?) |
| CC15 | Pre-made character templates (5+) |

---

## 13. MODULE 12: LEVELING & XP

### 13.1 XP Table (SRD)

```
Level  XP Required  Proficiency Bonus
1      0            +2
2      300          +2
3      900          +2
4      2,700        +2
5      6,500        +3
6      14,000       +3
7      23,000       +3
8      34,000       +3
9      48,000       +4
10     64,000       +4
...
20     355,000      +6
```

### 13.2 Level Up Process (SRD)

```
1. Increase max HP
   - Roll Hit Die OR take fixed value (average + 1, round down)
   - Add Con modifier
   
2. Gain class features at this level
   - Check class table for new features
   
3. Ability Score Improvement (at levels 4, 8, 12, 16, 19)
   - +2 to one or +1 to two
   - OR take a Feat
   
4. Multiclassing eligibility (if relevant)
   
5. Update spell slots/known spells if caster
```

### 13.3 XP Awards (SRD)

```
Per encounter:
- Combat: XP per monster (CR-based)
- Non-combat: GM discretion

Milestone leveling (alternative):
- Level up at story milestones
- No XP tracking needed
```

### 13.4 CR → XP Table (SRD)

```
CR    XP
0     10
1/8   25
1/4   50
1/2   100
1     200
2     450
3     700
4     1,100
5     1,800
...
30    155,000
```

### 13.5 Chức năng cần implement

| # | Chức năng |
|---|---|
| LV1 | XP table lookup |
| LV2 | Add XP function |
| LV3 | Level up detection |
| LV4 | Level up UI flow |
| LV5 | HP increase (roll or fixed) |
| LV6 | New class features applied |
| LV7 | ASI / Feat choice (lv 4, 8, 12, 16, 19) |
| LV8 | Proficiency bonus update |
| LV9 | Spell slot update |
| LV10 | Hit Dice gained |
| LV11 | Milestone leveling option |
| LV12 | XP award from monster CR |
| LV13 | XP split among party (if multi-character) |

---

## 14. MODULE 13: EXPLORATION

### 14.1 Vision and Light (SRD)

```
Light levels:
- Bright Light: see normally
- Dim Light: 1 lightly obscured (Disadvantage on Perception)
- Darkness: heavily obscured (effectively Blinded)

Darkvision: see in Dim Light as Bright Light, Darkness as Dim Light

Light sources:
- Torch: 20 ft bright + 20 ft dim, 1 hour
- Lantern: 30 ft bright + 30 ft dim, 6 hours per oil flask
- Candle: 5 ft bright + 5 ft dim
- Daylight spell: 60 ft bright + 60 ft dim
```

### 14.2 Hiding (SRD)

```
To hide:
- Take Hide action
- Must be obscured or behind cover
- Roll Stealth check vs passive Perception of observers
- Success: Invisible condition
- Move stealthily: must succeed Stealth check
- Attack: ends Hide (you reveal)
```

### 14.3 Interacting with Objects (SRD)

```
Free interaction: 1 per turn
Utilize action: for complex interactions

Object HP:
- Tiny, Fragile: 1 HP
- Small, Resilient: 5 HP
- Medium: 18 HP
- Large: 27 HP
- AC depends on material
```

### 14.4 Hazards (SRD)

```
Falling: 1d6 per 10 ft (max 20d6 at 200 ft)
Suffocation: HP=0 + die in rounds = Con mod (min 1)
Drowning: hold breath = Con mod minutes
Starvation: 1 Exhaustion per day without food
Dehydration: 1 Exhaustion per day without water
Extreme cold: Con save DC 10 per hour
Extreme heat: Con save DC 5 + 1 per hour
```

### 14.5 Travel (SRD)

```
Travel pace:
- Slow:    2 mph / 18 mi per day  (allows stealth)
- Normal:  3 mph / 24 mi per day
- Fast:    4 mph / 30 mi per day  (-5 passive Perception)

Forced march: more than 8 hours
- Each hour past: Con save DC 10 + 1 per hour
- Fail: 1 Exhaustion
```

### 14.6 Chức năng cần implement

| # | Chức năng |
|---|---|
| EX1 | Light level tracking per tile |
| EX2 | Vision range based on light |
| EX3 | Darkvision computation |
| EX4 | Light source duration tracking |
| EX5 | Hide action mechanic |
| EX6 | Passive Perception detection |
| EX7 | Object HP and AC for breaking |
| EX8 | Fall damage formula |
| EX9 | Suffocation/Drowning tracking |
| EX10 | Starvation/Dehydration daily check |
| EX11 | Extreme temperature saves |
| EX12 | Travel pace selection |
| EX13 | Travel time computation |
| EX14 | Forced march exhaustion |

---

## 15. MODULE 14: SOCIAL INTERACTION

### 15.1 Influence Action (SRD)

```
Action: Influence a creature's attitude
Roll: Persuasion / Deception / Intimidation / Performance / Insight
DC: based on NPC's attitude
  - Friendly: DC 10
  - Indifferent: DC 15
  - Hostile: DC 20
```

### 15.2 NPC Attitudes (SRD)

```
Friendly:     willing to help
Indifferent:  neutral, transactional
Hostile:      will harm if able
```

### 15.3 Charmed Condition

```
Cannot attack charmer
Charmer has Advantage on social rolls
Various spells/abilities can cause/break
```

### 15.4 Chức năng cần implement

| # | Chức năng |
|---|---|
| SI1 | Influence action |
| SI2 | NPC attitude tracking (per NPC) |
| SI3 | DC calculation by attitude |
| SI4 | Persuasion/Deception/Intimidation rolls |
| SI5 | Insight check (detect lies) |
| SI6 | Performance check |
| SI7 | Charmed condition effects |
| SI8 | Attitude shift events |

---

## 16. SCOPE CẮT GỌN CHO M1

### 16.1 Triết lý cắt scope

SRD 5.2 có ~500 quy tắc. **M1 chỉ implement ~30% essential cho gameplay loop cơ bản.** M2-M3 thêm sau.

### 16.2 M1 — Implement minimum

**Module Abilities & Modifiers — FULL**
- 6 abilities, modifier formula, validation
- Lý do: cốt lõi, không phức tạp

**Module D20 Tests — 80%**
- Ability check, save, attack roll
- Advantage/Disadvantage stacking
- Proficiency bonus by level
- 18 skills
- BỎ M1: Expertise, Inspiration, Passive checks advanced

**Module Action Economy — 70%**
- 1 Action + Movement per turn
- 7 basic actions: Attack, Dash, Disengage, Dodge, Help, Hide, Search
- Free interaction (1/turn)
- BỎ M1: Bonus Actions (chỉ Off-hand attack), Reactions (chỉ Opp Attack), Ready, Utilize

**Module Combat — 60%**
- Initiative
- Make attack (melee, ranged)
- Range check
- Cover (chỉ binary: in cover / not)
- BỎ M1: Surprise advanced, Unseen attackers, Grapple, Shove, Two-Weapon Fighting, Mounted, Underwater

**Module Damage & Healing — 80%**
- Damage roll
- Crit (double dice)
- All damage types
- Resistance/Vulnerability/Immunity
- Drop to 0 + death saves
- Healing
- BỎ M1: Temp HP nâng cao, Massive damage instant death

**Module Movement — 70%**
- Speed
- Diff terrain x2
- Square grid
- Diagonal D&D standard (1=1)
- Prone (drop/stand)
- BỎ M1: Variant diagonal, climb/swim speed, fly, squeeze, forced movement

**Module Conditions — 60%**
- 10/15 conditions: Blinded, Charmed, Frightened, Grappled, Incapacitated, Invisible, Poisoned, Prone, Restrained, Unconscious
- Duration tracking
- Apply/remove
- Auto-fail saves cho Paralyzed/Stunned/Unconscious
- BỎ M1: Petrified, Deafened, Paralyzed, Stunned, Exhaustion (chỉ track count)

**Module Spells — 40%**
- 20-30 spells phổ biến nhất (cantrips + lv 1-3)
- Slot management
- V/S components (skip M only)
- Spell DC + attack
- Single target spells
- BỎ M1: Concentration nâng cao, AoE templates phức tạp, Rituals, Counterspell, Upcasting nâng cao

**Module Equipment — 70%**
- 15 weapons (simple + popular martial)
- 8 armors (1 mỗi tier)
- AC computation
- 20 adventuring gear
- Currency
- BỎ M1: All 30 weapons, all properties, encumbrance, attunement, magical bonuses

**Module Rest — 80%**
- Short rest (hit dice)
- Long rest (full HP, slot reset)
- Hit dice spend
- BỎ M1: Interrupted rest, 24h cooldown enforce

**Module Character Creation — 60%**
- Standard Array only
- 3 species (Human, Elf, Dwarf)
- 3 classes (Fighter, Wizard, Rogue)
- 3 backgrounds
- BỎ M1: Point Buy, Random Roll, all 9 species, all 12 classes, multiclassing

**Module Leveling — 50%**
- XP table
- Level up HP, prof bonus
- New class features (manual reference)
- BỎ M1: ASI/Feat choice (chỉ tăng score đơn giản), milestone leveling

**Module Exploration — 40%**
- Light/dark basic
- Darkvision binary
- Fall damage
- Hide action
- BỎ M1: Suffocation, starvation, weather, forced march, travel pace nâng cao

**Module Social — 30%**
- Persuasion/Deception/Intimidation checks
- NPC attitude basic (friendly/neutral/hostile)
- BỎ M1: Influence action chính thức, Charmed mechanics

### 16.3 Tổng kết M1

```
Total SRD chức năng:     ~500
M1 implement:            ~150 (30%)
M2 add:                  ~200 (40% more)
M3 add:                  ~150 (30% remaining)
```

---

## 17. ROADMAP TRIỂN KHAI MODULES

### 17.1 Thứ tự code modules (12 tuần M1)

**Week 1-2 — Foundation**
- Module: Abilities & Modifiers (full)
- Module: Dice (rollD20, rollDice, advantage)
- Schema DB cho entities, stats

**Week 3-4 — D20 Tests + Action Economy**
- Module: D20 Tests (check/save/attack)
- Module: Action Economy (turn tracker)
- 7 basic actions

**Week 5-6 — Combat + Damage**
- Module: Combat (initiative, attack flow)
- Module: Damage & Healing
- Death saves
- Conditions (10 core)

**Week 7 — Movement**
- Module: Movement (grid, terrain, pathfinding)
- Prone mechanics

**Week 8 — Equipment**
- Module: Equipment (15 weapons, 8 armors, AC)
- Currency
- 20 gear items

**Week 9 — Spells**
- Module: Spells (basic casting)
- Spell slots
- 20-30 common spells SRD

**Week 10 — Rest + Leveling**
- Module: Rest (short/long)
- Module: Leveling (XP table, level up)

**Week 11 — Character Creation**
- Module: CC wizard
- 3 species, 3 classes, 3 backgrounds
- Standard Array

**Week 12 — Exploration + Social + Polish**
- Module: Exploration (light, fall, hide)
- Module: Social (basic checks, attitude)
- Integration test
- M1 release gate

### 17.2 Mỗi module structure file

```
packages/core/src/modules/<module-name>/
├── index.ts              # Public API exports
├── types.ts              # TypeScript interfaces
├── rules.ts              # SRD rule implementations
├── data.ts               # Static data (spells, weapons, etc)
├── validators.ts         # Input validation
├── computations.ts       # Pure calculation functions
└── __tests__/
    └── <module>.test.ts  # Unit tests
```

### 17.3 Module dependency graph

```
                  ┌──────────────┐
                  │ Abilities    │
                  └──────┬───────┘
                         │
              ┌──────────┴──────────┐
              │                     │
        ┌─────▼─────┐         ┌────▼────┐
        │ D20 Tests │         │ Stat    │
        └─────┬─────┘         └────┬────┘
              │                     │
       ┌──────┴──────┐              │
       │             │              │
  ┌────▼────┐  ┌─────▼─────┐       │
  │ Action  │  │ Damage    │       │
  │ Economy │  │ & Healing │◄──────┤
  └────┬────┘  └─────┬─────┘       │
       │             │              │
       └──────┬──────┘              │
              │                     │
        ┌─────▼─────┐               │
        │ Combat    │◄──────────────┤
        └─────┬─────┘               │
              │                     │
       ┌──────┴──────┐              │
       │             │              │
  ┌────▼────┐  ┌─────▼─────┐       │
  │ Spells  │  │ Conditions│◄──────┤
  └────┬────┘  └───────────┘       │
       │                            │
  ┌────▼────┐                       │
  │Equipment│◄──────────────────────┘
  └─────────┘
```

---

## 18. INTEGRATION VỚI AI ENGINE v6

### 18.1 Mỗi turn AI Engine call modules

```
Player input → Intent Parser LLM
   ↓
Output: { action: "attack", target: "goblin", weapon: "longsword" }
   ↓
Rule Engine orchestrator:
   ↓
   1. ActionEconomyModule.canTakeAction(player, "attack")? 
      → uses 1 Action slot
   2. CombatModule.makeAttack(player, goblin, longsword)
      → MovementModule.inRange(player, goblin, "melee")?
      → D20Module.attackRoll(player, longsword)
      → DiceModule.rollD20() + modifiers
      → Compare with CombatModule.computeAC(goblin)
      → if hit: DamageModule.rollDamage(longsword, isCrit)
      → DamageModule.applyDamage(goblin, amount, type)
      → if hp <= 0: EntityModule.kill(goblin)
   3. Build Result Object
   ↓
Result Object → AI Narrator LLM
   ↓
Narrative text + render tags
```

**AI không touch các module này.** AI chỉ nhận Result Object cuối.

### 18.2 Result Object cho mỗi action type

Mỗi module emit standardized Result Object. Narrator có template tả cho mỗi type.

### 18.3 Validation cascade

```
Player intent
   ↓
Intent Parser: phân tích (LLM)
   ↓
Module Validation: legal action? (TS pure)
   ├─ Yes → execute, build Result
   └─ No → reject with alternatives
   ↓
Result Object
   ↓
Narrator: tả kết quả (LLM)
```

---

## 19. CHỨC NĂNG TỔNG CỘNG

### M1 — ~150 functions

| Module | Functions | LoC estimate |
|---|---|---|
| Abilities | 5 | 200 |
| D20 Tests | 14 | 600 |
| Action Economy | 12 | 500 |
| Combat | 16 | 1200 |
| Damage & Healing | 15 | 800 |
| Movement | 14 | 1000 |
| Conditions | 14 | 700 |
| Spells | 16 | 1500 |
| Equipment | 15 | 600 (+ data files) |
| Rest | 10 | 400 |
| Character Creation | 15 | 800 |
| Leveling | 13 | 500 |
| Exploration | 14 | 600 |
| Social | 8 | 300 |
| **TỔNG M1** | **~180 functions** | **~9500 LoC** |

### M2 — thêm ~200 functions
- Full conditions (15)
- Full equipment (30+ weapons)
- Concentration spells
- Multiclassing
- Variant rules
- All actions (Bonus, Reactions, Ready, Utilize)
- Encumbrance
- Travel system

### M3 — thêm ~150 functions
- Full 300+ spells SRD
- All 12 classes
- All 9 species
- Magic items
- Mounted/Underwater combat
- Advanced exploration (weather, terrain effects)
- Crafting

---

## 20. KẾT LUẬN

### 20.1 Lợi ích áp dụng SRD chuẩn

1. **Game balanced** — luật do Wizards balance kỹ
2. **Predictable** — player familiar với D&D biết quy tắc
3. **Community-friendly** — campaigns/homebrew dễ chia sẻ
4. **Reduce design decisions** — không phải tự bịa formula
5. **Legal** — SRD 5.2 dùng CC-BY-4.0, free to use
6. **Future-proof** — Wizards update SRD, ta theo

### 20.2 Phân quyền cuối cùng

```
SRD 5.2 (source of truth for rules)
   ↓ implement
Rule Engine (TS pure code, deterministic)
   ↓ produce
Result Object (structured data)
   ↓ feed
AI Narrator (kể chuyện tiếng Việt)
   ↓ output
Player sees: narrative + dice + state changes
```

### 20.3 Câu thần chú cuối cùng

> **SRD viết luật, code áp dụng luật, AI kể chuyện.**
> **Mỗi layer làm 1 việc thật giỏi.**

---

## 21. PHỤ LỤC

### 21.1 Files cần tạo trong code

```
packages/core/src/modules/
├── abilities/
├── d20/
├── action-economy/
├── combat/
├── damage/
├── movement/
├── conditions/
├── spells/
├── equipment/
├── rest/
├── character-creation/
├── leveling/
├── exploration/
└── social/

packages/core/src/data/
├── srd/
│   ├── spells.json         # 30 M1, 300+ M3
│   ├── weapons.json        # 15 M1, 30 M2
│   ├── armors.json         # 8 M1, 13 M2
│   ├── species.json        # 3 M1, 9 M2
│   ├── classes.json        # 3 M1, 12 M2/M3
│   ├── backgrounds.json    # 3 M1, all M2
│   ├── conditions.json     # 10 M1, 15 M2
│   ├── monsters.json       # 20 M1, 500+ M3
│   └── magic-items.json    # 0 M1, 100+ M2
```

### 21.2 Attribution required (CC-BY-4.0)

App credits screen phải include:

```
This work includes material from the System Reference Document 5.2 
("SRD 5.2") by Wizards of the Coast LLC, available at 
https://www.dndbeyond.com/srd. The SRD 5.2 is licensed under the 
Creative Commons Attribution 4.0 International License, available 
at https://creativecommons.org/licenses/by/4.0/legalcode.
```

### 21.3 Tham chiếu SRD trong code comments

```typescript
/**
 * Compute ability modifier
 * SRD 5.2 reference: "The Six Abilities" > "Ability Modifiers"
 * Formula: floor((score - 10) / 2)
 */
function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}
```

Mỗi function reference section SRD nguồn để debug/verify dễ.

---

**Hết bản đặc tả Rule Engine Modules theo SRD 5.2**

File này bổ sung cho `PLAN_V5.md` (TRỤ 7 — AI Engine, sub-section: Rule Engine).
Code modules ở đây là backbone deterministic của game. AI chỉ narrate output.
