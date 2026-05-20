# XekkoDND - Dự án Game Chatbox AI DnD 5e Solo

**Người tạo:** Xekko (solo dev)
**Mục tiêu:** Xây dựng game chatbox AI D&D 5e chạy hoàn toàn local (Tauri desktop app), 1 người chơi, không cần internet sau khi cài đặt.

## 1. Scope MVP (đã thu hẹp - tập trung cao nhất)

**Giữ lại (cốt lõi):**
- AI DM thông minh (Groq chính + Gemini dự phòng)
- Layered Memory (nhớ nhân vật, vị trí, lịch sử, nhiệm vụ)
- Rule Engine 5e (combat, exploration, validation)
- Character Sheet đầy đủ (tạo nhân vật + sync realtime)
- Map chunk-based (ảnh ComfyUI 128x128 + buffer layer)
- Image Gen local (ComfyUI + models tải từ Civitai)
- Tauri Sidecar tự động chạy Ollama + ComfyUI khi mở app

**Bỏ khỏi v0.1:** Âm thanh/TTS, map editor phức tạp, multiplayer, world builder chi tiết

**Mục tiêu v0.1:** Tạo nhân vật → Chat với AI DM → 1 cuộc phiêu lưu hoàn chỉnh (khám phá + combat) → lưu/tải

## 2. Map System (Chunk-based 128x128)
- Mỗi chunk là ảnh lớn 128x128 grid cells (có thể config 64/128/256)
- Overlay grid D&D 5e (5 feet/ô)
- Khi nhân vật di chuyển trong chunk hiện tại → không tạo mới
- Khi gần rìa (buffer 10-20 cells) → tự động generate chunk mới theo hướng di chuyển
- Sử dụng React-Konva để chồng layers: background image + grid + token
- Cache chunk để load nhanh

## 3. Tech Stack
- **Frontend:** React + TypeScript + Tauri + Konva + Zustand + shadcn/ui
- **Backend Core:** Python (RuleEngine, LayeredMemory)
- **AI:** Groq (llama-3.3-70b) chính, Gemini 2.0 Flash dự phòng
- **Image Gen:** ComfyUI local + models Civitai (DreamShaper XL, v.v.)
- **Database:** SQLite (nhẹ, local)
- **Sidecar:** Rust Tauri tự spawn Ollama + ComfyUI

## 4. Cấu trúc File (Feature-Based - đã restructure)
[đã có trong repo]

## 5. Timeline thực tế (Solo dev - 14-16 tuần)
- **Phase 0 (Tuần 1-2):** Core (LayeredMemory + RuleEngine + Map Chunk Manager)
- **Phase 1 (Tuần 3-5):** AI DM + Chat + Prompt system
- **Phase 2 (Tuần 6-9):** Character Sheet + Combat Engine
- **Phase 3 (Tuần 10-14):** Image Gen ComfyUI + Map UI + Tauri Sidecar + Packaging
- **Tuần 15-16:** Polish, test, installer

## 6. Bước tiếp theo ngay hôm nay
Bắt đầu Phase 0: Viết LayeredMemory + RuleEngine trong core/xekkodnd/ai/

**Cập nhật lần cuối:** 20/05/2026 bởi Grok
