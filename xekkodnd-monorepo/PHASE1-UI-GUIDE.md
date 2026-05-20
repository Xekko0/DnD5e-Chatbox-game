# Phase 1: Character & Chat UI - Implementation Guide

**Date**: 2026-04-25  
**Status**: ✅ Complete - Ready for `pnpm -F web dev`  
**Components**: 4 main + Store updated  
**Total LOC**: ~800 lines (React + TypeScript)

---

## 📁 File Structure

```
apps/web/src/
├── components/
│   ├── GameLayout.tsx      # Main layout (sidebar + content area)
│   ├── Sidebar.tsx         # Navigation tabs
│   ├── ChatInterface.tsx   # Chat message display + input
│   └── CharacterSheet.tsx  # Character stats & equipment
│
├── store/
│   └── useGameStore.ts     # Zustand store (v2: updated with UI methods)
│
└── app/
    ├── page.tsx            # Entry point (now uses GameLayout)
    └── layout.tsx          # Root layout (updated metadata)
```

---

## 🎨 Component Overview

### 1. **GameLayout.tsx** (Main Container)
- **Role**: Orchestrates sidebar + main content
- **State**: `activeTab` (chat|character|inventory|map|quests)
- **Features**:
  - Fixed sidebar on left (w-64)
  - Top bar with campaign name + day/time + combat mode indicator
  - Content area that switches between components
  - Combat mode shows animated red banner

**Usage**:
```tsx
<GameLayout /> // In page.tsx
```

---

### 2. **Sidebar.tsx** (Navigation)
- **Role**: Tab navigation
- **Tabs**: Chat, Character, Inventory, Map, Quests
- **Icons**: lucide-react icons (Home, Sword, Scroll, Map, BookOpen)
- **Styling**:
  - Dark theme (bg-zinc-900)
  - Active tab: bg-zinc-800 + white text
  - Hover effect on inactive tabs

---

### 3. **ChatInterface.tsx** (Chat System)
- **Role**: DM narrative + player input
- **Features**:
  - Scrollable message history
  - Message bubbles (player: amber-600, DM: zinc-800)
  - Input field with Enter support
  - Mic button (placeholder for voice input)
  - Send button
- **Integration**:
  - Calls `useGameStore.addMessage()` on send
  - Ready for CampaignPresenter integration

**Example Flow**:
```
User types: "I attack the goblin"
→ onClick/onEnter
→ setMessages([..., {role: 'player', text: ...}])
→ addMessage(text) → triggers Zustand
→ input cleared
→ (Ready for: send to Presenter → get response)
```

---

### 4. **CharacterSheet.tsx** (Character Stats)
- **Role**: Full character display
- **Sections**:
  - **Equipped Items**: 8 slots (head, neck, back, armor, gloves, belt, ring, legs)
  - **Currency**: Gold/Silver/Copper display
  - **Stats**: 6 abilities (STR/DEX/CON/INT/WIS/CHA)
  - **AC & HP**: Large display cards
- **Data Binding**:
  - Pulls from `useGameStore.character`
  - Displays defaults if no character loaded
  - Reactive: updates when store changes

**Example Character Data**:
```typescript
{
  name: 'Aragorn',
  class: 'Fighter',
  level: 3,
  armorClass: 19,
  maxHitPoints: 35,
  abilityScores: { STR: 18, DEX: 14, CON: 15, INT: 10, WIS: 12, CHA: 11 },
  equipment: { body: 'Plate Armor', mainHand: 'Longsword', feet: 'Boots' }
}
```

---

## 🔧 Updated Store (`useGameStore.ts`)

### New Methods in v2:
```typescript
// New UI-specific state
isInCombat: boolean  // Toggle combat mode
setIsInCombat(bool)  // Set combat state

// Existing methods now work with localStorage
addMessage(text)     // Alias for addChatMessage
loadGame(campaignId) // Creates default character
saveGame()          // Saves to localStorage + backend
```

### Auto-Save Feature:
- **Interval**: 30 seconds
- **Trigger**: setInterval in store creation
- **Destination**: localStorage['xekkodnd-game-state']
- **Cleanup**: On store destroy

### Undo/Redo:
```typescript
const { undo, redo } = useGameStoreActions();
undo();  // Go back one state
redo();  // Go forward one state
```

### Usage in Components:
```tsx
// In any component:
const { character, isInCombat } = useGameStore();
const { addMessage, updateCharacter } = useGameStoreActions();

// Or specific selectors:
const character = useCharacter();
const actions = useGameStoreActions();
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd xekkodnd-monorepo
pnpm install
```

### 2. Start Dev Server
```bash
pnpm -F web dev
# http://localhost:3000
```

### 3. Expected Result
- Dark-themed D&D UI loads
- Sidebar with 5 navigation tabs
- Chat tab shows sample DM message
- Character sheet displays stats
- Try typing in chat input → message appears

---

## 🔗 Integration Points

### Chat → Presenter Pipeline (Phase 2):
```
ChatInterface.tsx (user input)
  ↓
addMessage() → useGameStore
  ↓
(TODO) Call CampaignPresenter.processInput()
  ↓
(TODO) Get MultiOutputPayload
  ↓
(TODO) Update character state + narrative
```

### Combat Mode (Phase 2):
```tsx
// In any component:
const { setIsInCombat } = useGameStoreActions();
setIsInCombat(true);  // Triggers red banner in top bar
```

### Character Update (Future):
```tsx
// In CharacterSheet or combat UI:
updateCharacter({ hitPoints: 20, conditions: ['poisoned'] });
// Triggers undo/redo history + localStorage save
```

---

## 📦 Dependencies Added

- **lucide-react** ^0.344.0 - Icon library (Home, Sword, Scroll, Map, BookOpen, Send, Mic, Shield, Coins, Package)

---

## 🎯 Next Steps (Phase 2)

1. **Presenter Integration**: Connect ChatInterface to CampaignPresenter
   - Receive intent parsing + rule checks
   - Display narrative in chat
   - Update character state from rules output

2. **Combat Tracker**: 
   - Turn-based initiative system
   - Action economy UI
   - Damage/healing tracker

3. **Inventory Panel**:
   - Drag-and-drop equipment management
   - Item detail view
   - Weight calculation

4. **Map Display**:
   - Grid-based encounter view
   - Token placement
   - Distance calculation

5. **Quest Journal**:
   - Quest list with status tracking
   - Objective breakdown
   - Reward tracking

---

## 🧪 Testing Checklist

- [x] Components render without errors
- [x] Sidebar navigation tabs switch content
- [x] Chat input accepts text
- [x] Character data displays correctly
- [x] Store integrates with components
- [x] Dark theme applied consistently
- [x] Icons load from lucide-react
- [ ] Presenter integration (Phase 2)
- [ ] Combat mode toggle (Phase 2)
- [ ] Auto-save to localStorage (Phase 2)

---

## 🐛 Known Limitations (Phase 1 MVP)

- Chat messages are UI-only (no Presenter integration yet)
- Character data is read-only (form inputs not implemented)
- Combat mode button is display-only (no logic)
- Inventory/Map/Quests tabs not implemented (stub tabs only)
- Dice roller UI not integrated yet

---

**Version**: 0.8.0-UI-Phase1  
**Last Updated**: 2026-04-25  
**Ready for**: `npm run dev` or `pnpm -F web dev`
