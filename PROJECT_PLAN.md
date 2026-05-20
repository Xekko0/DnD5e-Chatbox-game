# XekkoDND - Dự án Game Chatbox AI DnD 5e Solo

## Cấu trúc File Mới (đã restructure)

**Kiến trúc: Tauri Monorepo + Feature-Based + Python Core**

```
DnD5e-Chatbox-game/
├── src/                          # React + TypeScript Frontend (Tauri)
│   ├── components/               # UI reusable
│   ├── features/                 # Feature slices (chat, combat, map, character, memory)
│   ├── hooks/
│   ├── lib/                      # types, utils, constants
│   ├── stores/                   # Zustand global state
│   └── main.tsx
├── src-tauri/                    # Rust Tauri Backend + Sidecar
│   ├── src/
│   │   ├── commands.rs           # Invoke Python, sidecar management
│   │   ├── main.rs
│   │   └── sidecar.rs            # Spawn Ollama + ComfyUI
│   ├── Cargo.toml
│   └── tauri.conf.json
├── core/                         # Python Core Logic (RuleEngine, LayeredMemory, GameState)
│   ├── xekkodnd/
│   │   ├── __init__.py
│   │   ├── core/
│   │   │   ├── models.py
│   │   │   ├── rule_engine.py
│   │   │   ├── layered_memory.py
│   │   │   ├── state_manager.py
│   │   │   └── map_manager.py    # Chunk-based map
│   │   ├── services/
│   │   │   ├── image_gen.py      # ComfyUI client
│   │   │   ├── groq_client.py
│   │   │   └── llm.py
│   │   └── utils/
│   ├── pyproject.toml
│   └── requirements.txt
├── docs/                         # Tài liệu
│   └── PROJECT_PLAN.md
├── public/                       # Static assets
├── scripts/                      # Build & setup scripts
├── .gitignore
├── Cargo.toml                    # Tauri root
├── package.json
├── tauri.conf.json
├── README.md
└── ... (các file khác)
```

**Lý do restructure:**
- Thay MVC cũ bằng Feature-Based (dễ thêm feature mới như map chunk).
- Python core tách biệt cho logic AI + Rule 5e.
- Tauri ready cho desktop local app.
- Dễ migrate từ Streamlit app.py hiện tại.

Mục tiêu v0.1 vẫn giữ nguyên.