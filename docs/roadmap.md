# XekkoDND Roadmap

## Product Goal
Build a local-first solo D&D 5e AI chatbox that enforces rules before narrative generation, supports editable character state, and scales toward multi-output gameplay.

## Planning Method
This project follows a Waterfall delivery model for each release slice:

1. Requirements baseline
2. MVP design
3. Implementation
4. Verification
5. Release and feedback

The first release target is an MVP with only four locked pillars:

- State Manager
- Rule Engine
- Chat Interface
- Character Sheet

Everything else remains outside MVP scope until the MVP slice is stable.

## MVP Definition
The MVP must support the following end-to-end loop:

1. Start app
2. Load or initialize a character state
3. Edit character sheet values locally
4. Send chat messages to the DM layer
5. Parse simple intents and dice requests
6. Apply rule validation before narrative generation
7. Persist session state in memory and to file

## Waterfall Phases

### Phase 1 - Requirements Baseline
Deliverables:

- Locked MVP scope
- Character and game state schema
- Rule coverage list for MVP
- UI surface map for chat and sheet

Exit criteria:

- The MVP scope is documented and approved.
- The state model is stable enough to scaffold.

### Phase 2 - Design
Deliverables:

- State manager design
- Rule engine design
- Chat interaction design
- Character sheet layout design

Exit criteria:

- Each MVP module has a clear responsibility.
- Data flow from UI to state to engine is defined.

### Phase 3 - Implementation
Deliverables:

- Core Python package scaffold
- Streamlit app wiring
- Character sheet editing flow
- Basic dice and intent handling

Exit criteria:

- App runs locally.
- State updates survive reruns.
- Chat and sheet are visible in the UI.

### Phase 4 - Verification
Deliverables:

- Syntax checks
- Manual UI smoke test
- Rule engine sanity checks
- State persistence checks

Exit criteria:

- No syntax errors in touched files.
- Basic chat and sheet flows work end to end.

### Phase 5 - Release Preparation
Deliverables:

- README usage notes
- MVP limitations documented
- Next-phase backlog prepared

Exit criteria:

- MVP is ready for the first playable release.

## Post-MVP Roadmap
These capabilities are planned after MVP stabilization:

- Combat engine
- Map editor
- Inventory and equipment grid
- Quest journal
- Voice input and output
- Audio layer
- Image generation
- Campaign save/load browser
- World builder
- Tutorial campaign

## Risks

- Scope creep can delay the first playable loop.
- Rule enforcement must stay deterministic.
- Local LLM integration may need fallback behavior.

## Success Metrics

- Player can create or edit a character and continue chatting without losing state.
- Rule checks occur before narrative response generation.
- The app remains usable on reruns and restart cycles.