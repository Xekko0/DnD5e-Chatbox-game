# XekkoDND MVP Backlog

## Epic 1 - Foundation
- Define the core game state schema.
- Define the character sheet schema.
- Define session message storage.
- Define persistence format for local saves.

## Epic 2 - State Manager
- Bootstrap default state on app start.
- Load state from saved file.
- Save state to a local JSON file.
- Update character values from the UI.
- Track chat history and dice history.

## Epic 3 - Rule Engine
- Parse player intents from free text.
- Detect dice roll commands.
- Resolve dice expressions.
- Validate simple character edits.
- Reject invalid values with a clear message.

## Epic 4 - Chat Interface
- Show full conversation history.
- Accept player input.
- Call the rule engine before the DM response.
- Show system feedback for dice and validation.

## Epic 5 - Character Sheet
- Display core ability scores.
- Display HP, AC, level, and speed.
- Allow direct editing of player-visible values.
- Keep sheet state synchronized with the manager.

## Epic 6 - MVP Hardening
- Add syntax validation.
- Add smoke test checklist.
- Document how to run the app locally.
- Record MVP constraints and non-goals.

## Out of Scope for MVP
- Combat tracker
- Map editor
- Audio and voice
- Image generation
- Quest journal
- Inventory grid drag and drop
- Level-up wizard
- Multiplayer features

## Priority Order
1. State manager
2. Rule engine
3. Character sheet
4. Chat interface
5. Persistence and validation