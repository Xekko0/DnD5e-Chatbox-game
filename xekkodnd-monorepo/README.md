# XekkoDND - Monorepo MVP

**Status**: ✅ Completed all 7 core tasks (0.1 → 0.7)

**Date**: April 25, 2026  
**Time Investment**: ~3.5 hours  
**Tech Stack**: pnpm Workspace, Next.js 15, TypeScript, Tailwind, shadcn/ui (optional), Zustand, Tauri (planned)

---

## 📋 Project Structure

```
xekkodnd-monorepo/
├── apps/
│   └── web/                      # Next.js 15 frontend (React + Tailwind)
│       ├── src/
│       │   ├── types/            # TypeScript interfaces (0.2)
│       │   │   └── index.ts      # Complete D&D 5e types
│       │   └── hooks/            # React hooks
│       │       └── useGameStore.ts # Zustand store (0.6)
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   └── core/                     # Shared TypeScript library (@xekko/core)
│       ├── src/
│       │   ├── index.ts          # Main export
│       │   ├── LayeredMemory.ts  # Memory manager (0.3)
│       │   ├── RuleEngine.ts     # 22+ D&D 5e rules (0.5)
│       │   ├── CampaignPresenter.ts # MVP orchestrator (0.7)
│       │   ├── data/
│       │   │   └── srd/
│       │   │       ├── 5e-core.json      # D&D 5e reference data (0.4)
│       │   │       └── loader.ts         # SRD data loader
│       └── package.json
│
├── pnpm-workspace.yaml           # Workspace config
└── package.json                  # Root package
```

---

## 🎯 Completed Tasks

### 0.1 ✅ Monorepo Scaffold (4 hours)
- **Status**: Complete
- **Tools**: pnpm, Node.js 22.14.0
- **Deliverables**:
  - Root workspace with pnpm-workspace.yaml
  - Next.js 15 app (apps/web) with TypeScript, Tailwind, ESLint
  - Core package (packages/@xekko/core)
  - Installed dependencies: zustand, zod, typescript, vitest, tsup
  
**Build**: 
```bash
cd xekkodnd-monorepo
pnpm install
pnpm -F web dev        # Start Next.js dev server
```

---

### 0.2 ✅ TypeScript Interfaces (6 hours)
- **Status**: Complete
- **File**: `apps/web/src/types/index.ts`
- **Exports**:
  - `CharacterState` - Full D&D 5e character with abilities, skills, spells, equipment
  - `WorldLore` - Campaign world state: locations, NPCs, factions, quests
  - `SessionHistory` - Chat messages, dice rolls, character actions
  - `GameSnapshot` - Point-in-time state capture
  - `LayeredMemory` - 4-layer memory structure
  - `RuleCheckResult` - Standardized rule check output
  - `IntentParseResult` - Player intent parsing
  - `MultiOutputPayload` - Unified presenter output
  - `GameStoreState/Actions` - Zustand store interface

**Usage**:
```typescript
import type { CharacterState, WorldLore } from '@/types';
```

---

### 0.3 ✅ Layered Memory Manager (1 day)
- **Status**: Complete
- **File**: `packages/core/src/LayeredMemory.ts`
- **Class**: `LayeredMemoryManager`
- **Features**:
  - 4 distinct layers: `worldLoreLayer`, `characterStateLayer`, `sessionHistoryLayer`, `gameSnapshotLayer`
  - JSON persistence (save/load)
  - SQLite-ready (hooks for future implementation)
  - Auto-save background task (30s interval)
  - Snapshot system for rollback
  - Layer export/import
  - Undo/Redo support (via history stack)

**Methods**:
```typescript
const memory = new LayeredMemoryManager(initialState, './saves');
await memory.initialize();
memory.startAutosave();
await memory.updateLayer('characterState', { hitPoints: 20 });
memory.createSnapshot('Before boss fight');
await memory.saveToJSON('campaign-1');
```

---

### 0.4 ✅ D&D 5e SRD Reference Data (6 hours)
- **Status**: Complete
- **Files**: `packages/core/src/data/srd/`
  - `5e-core.json` - Reference data for races, classes, spells, monsters, items
  - `loader.ts` - Lazy-load and cache SRD
- **Data Categories**:
  - **Races**: Human, Elf, Dwarf (expandable)
  - **Classes**: Fighter, Wizard, Rogue (expandable)
  - **Spells**: Magic Missile, Fireball (expandable)
  - **Monsters**: Goblin, Orc (expandable)
  - **Items**: Longsword, Plate Armor (expandable)

**Usage**:
```typescript
import { loadSRDData, getRace, getClass, getSpell } from '@xekko/core';

const srd = await loadSRDData();
const elves = srd.races['elf'];
const fighter = await getClass('fighter');
```

---

### 0.5 ✅ Rule Engine - 22+ Core Rules (2 days)
- **Status**: Complete
- **File**: `packages/core/src/RuleEngine.ts`
- **Class**: `RuleEngine`
- **Implemented Rules**:

1. **spellSlotCheck** - Verify spell slot availability
2. **acCalculation** - Compute Armor Class (base + DEX + shield + effects)
3. **abilityCheck** - d20 + ability modifier vs DC (with advantage/disadvantage)
4. **attackRoll** - Weapon attack vs target AC
5. **savingThrow** - Save against effect with optional proficiency
6. **deathSavingThrow** - Unconscious character survival checks
7. **carryingCapacity** - Weight limit based on STR
8. **skillCheck** - Skill d20 with proficiency/expertise
9. **damageReduction** - Resistance/immunity/vulnerability
10. **hitPointValidation** - HP bounds checking
11. **levelValidation** - Level 1-20 range
12. **inspirationValidation** - Inspiration bounds
13. **applyCondition** - Add status condition (poisoned, prone, etc.)
14. **concentrationCheck** - Maintain spell concentration
15. **checkAdvantageEligibility** - Inspiration-based advantage
16. **rangeCheck** - Ranged attack distance vs normal/max range
17. **actionEconomyCheck** - Actions/bonus actions/reaction per turn
18. **experienceForLevel** - XP table lookup (1-20)
19. **levelUpCheck** - Eligibility to advance level
20. **getProficiencyBonus** - Bonus by level (2-6)
21. **encumbranceState** - Normal/encumbered/heavily encumbered
22. **toggleProne** - Knock prone/stand up

**Usage**:
```typescript
import { RuleEngine } from '@xekko/core';

const engine = new RuleEngine();
const acResult = engine.acCalculation(character, 10, true);
const attackResult = engine.attackRoll(character, 14, 'STR', 0);
const spellCheck = engine.spellSlotCheck(character, 2);
```

---

### 0.6 ✅ Zustand Game Store (1 day)
- **Status**: Complete
- **File**: `apps/web/src/hooks/useGameStore.ts`
- **Hook**: `useGameStore`
- **Features**:
  - Central state: `character`, `worldLore`, `sessionHistory`
  - Auto-save to localStorage every 30s
  - Full undo/redo history stack
  - Load/save game async actions
  - Chat message and dice roll appending
  - Error handling

**Methods**:
```typescript
const { loadGame, saveGame, updateCharacter, undo, redo } = useGameStoreActions();
const character = useCharacter();
const { addChatMessage, addDiceRoll } = useGameStoreActions();
```

**Auto-save**: Triggered every 30s in background (stops on cleanup)

---

### 0.7 ✅ MVP Campaign Presenter (1 day)
- **Status**: Complete
- **File**: `packages/core/src/CampaignPresenter.ts`
- **Classes**:
  - `IntentParser` - Extracts intent from player input
  - `CampaignPresenter` - Orchestrates parser → rules → output

**IntentParser.parse()** returns:
- `intent`: "chat" | "roll" | "spell-cast" | "attack" | "skill-check" | "movement" | "meta" | "unknown"
- `confidence`: 0-1
- `parsed`: Type-specific data (e.g., spell name, dice expression)

**CampaignPresenter.processInput()** returns `PresenterOutput`:
```typescript
{
  intent: IntentParseResult,
  ruleChecks: RuleCheckResult[],
  multiOutput: {
    narrativeResponse: string,
    stateUpdates?: Partial<CharacterState>,
    diceRolls?: DiceRoll[],
    messages?: ChatMessage[],
    warnings?: string[],
    metadata: { processingTimeMs, ruleChecksApplied }
  }
}
```

**Flow**:
1. Parse intent from user input
2. Validate character state
3. Apply intent-specific rules
4. Generate narrative response
5. Return unified output

**Usage**:
```typescript
import { createCampaignPresenter } from '@xekko/core';

const presenter = createCampaignPresenter(character, worldLore);
const output = await presenter.processInput("I cast fireball!");
console.log(output.multiOutput.narrativeResponse);
```

---

## 🚀 Getting Started

### Install & Build
```bash
cd d:\BT\GAME CHATBOX\xekkodnd-monorepo

# Install all dependencies
pnpm install

# Build core package
pnpm -F @xekko/core build

# Start web dev server
pnpm -F web dev

# Run tests (when tests are added)
pnpm test
```

### Local Development
```bash
# Terminal 1: Watch core package
pnpm -F @xekko/core dev

# Terminal 2: Next.js dev server
pnpm -F web dev
```

---

## 📦 Dependency Map

```
apps/web (Next.js Frontend)
  ├── depends on: @xekko/core
  ├── depends on: zustand, zod, react, next
  └── exports: React components, pages, hooks

packages/core (@xekko/core)
  ├── depends on: zod, typescript (dev only)
  ├── exports: LayeredMemoryManager, RuleEngine, CampaignPresenter
  └── includes: D&D 5e SRD data
```

---

## 🔮 Next Steps (Phase 2+)

After MVP stabilization:

1. **Tauri Desktop App** - Wrap web in desktop app
2. **SQLite Integration** - Replace file-based persistence
3. **LLM Integration** - Connect narrative generation to Ollama/API
4. **Combat Tracker** - Turn-based encounter system
5. **Map Editor** - Grid-based battlefield
6. **Inventory UI** - Drag-and-drop equipment management
7. **Quest Journal** - Story tracking
8. **World Builder** - Campaign content creation tools
9. **Audio/Voice** - Voice input/output
10. **Image Generation** - Scene visualization

---

## 📚 File Manifest

| Path | Type | Status | LOC | Purpose |
|------|------|--------|-----|---------|
| apps/web/src/types/index.ts | TypeScript | ✅ | 400+ | Type definitions |
| apps/web/src/hooks/useGameStore.ts | TypeScript | ✅ | 200+ | Zustand store |
| packages/core/src/LayeredMemory.ts | TypeScript | ✅ | 300+ | Memory manager |
| packages/core/src/RuleEngine.ts | TypeScript | ✅ | 600+ | Game rules |
| packages/core/src/CampaignPresenter.ts | TypeScript | ✅ | 400+ | MVP orchestrator |
| packages/core/src/data/srd/5e-core.json | JSON | ✅ | 200+ | SRD reference |
| packages/core/src/data/srd/loader.ts | TypeScript | ✅ | 150+ | Data loader |
| packages/core/src/index.ts | TypeScript | ✅ | 50 | Package export |

**Total TypeScript**: ~2000+ LOC  
**Total JSON**: ~200 lines

---

## ⚙️ Configuration Files

- `pnpm-workspace.yaml` - Workspace definition
- `packages/core/package.json` - Core package metadata
- `apps/web/package.json` - Web app metadata
- `apps/web/tsconfig.json` - TypeScript config (Next.js)
- `apps/web/next.config.js` - Next.js configuration
- `apps/web/tailwind.config.ts` - Tailwind CSS config

---

## 🧪 Testing Strategy (Future)

- Unit tests for RuleEngine (22+ rules)
- Integration tests for LayeredMemory (save/load)
- Presenter flow tests (intent → output)
- Component tests for React UI (React Testing Library)

**Command**: `pnpm test`

---

## 📝 Summary

✅ **All 7 core tasks completed**:
- Monorepo infrastructure
- Type system for full D&D 5e game
- Memory layer abstraction
- SRD reference data
- 22+ game rule implementations
- Zustand state management + 30s auto-save
- MVP presenter orchestrating parser + rules + output

**Ready for**: 
- Frontend UI development (apps/web)
- LLM narrative integration
- Tauri desktop wrapping
- Phase 2 features (combat, map, etc.)

---

**Created**: 2026-04-25  
**By**: Copilot Agent  
**Version**: 0.7.0-MVP
