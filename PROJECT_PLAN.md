**XekkoDND – Solo D&D 5e AI Chatbox (Local-first, 1 người chơi)**

**Người thực hiện:** Chỉ 1 người – Xekko
**Cập nhật:** 20/05/2026 (Phiên bản điều chỉnh thực tế sau khi review với Claude)

---

## 1. MỤC TIÊU DỰ ÁN (Đã điều chỉnh)

**Mục tiêu chính:** Xây dựng một trò chơi D&D 5e **chatbox AI solo** chạy **hoàn toàn local**, tập trung vào **AI DM thông minh** + **Rule Engine nghiêm ngặt** + **Layered Memory**.

**v0.1 (MVP Playable – Mục tiêu 14-16 tuần):**
- Tạo nhân vật cơ bản (Race, Class, Stats)
- Chat với AI DM (Groq + Rule Engine)
- Combat đơn giản (1 encounter hoàn chỉnh)
- Exploration + vị trí khu vực
- Image gen local khi vào khu vực mới (ComfyUI + model Civitai)
- Map đơn giản (ảnh AI + token overlay)
- Save/Load game state
- Tauri app tự khởi động Ollama + ComfyUI (sidecar)

**Loại bỏ khỏi v0.1:** Âm thanh/TTS, map editor phức tạp, multiplayer, world builder chi tiết, voice.

**Lợi thế so với Friends & Fables:** Hoàn toàn offline, không phí, chất lượng ảnh cao (model Civitai local), có thể mod dễ dàng.

---

## 2. KIẾN TRÚC & TECH STACK (Thực tế cho solo)

### Core
- **Rule Engine** (Python/TS): Xử lý combat, check, advantage, HP, spell slot... (không để LLM quyết định)
- **Layered Memory**: 
  1. World Lore (SQLite read-only)
  2. Character State (JSON)
  3. Session History + Summary
  4. Current Location & Travel Path
- **AI DM**: Groq (llama-3.3-70b) chính + Gemini 2.0 Flash dự phòng (miễn phí)

### Image & Map
- **ComfyUI** (local) + models từ Civitai (DreamShaper, Juggernaut...)
- Map = Ảnh AI 1024x1024 + overlay grid + token (React-Konva hoặc tương đương)
- Tự động gen ảnh khi AI DM mô tả khu vực mới

### App
- **Tauri** (Rust + React/TS) – Desktop app
- **Sidecar**: Tự động spawn Ollama + ComfyUI khi mở app
- Database: SQLite (thay ChromaDB để nhẹ)

### Free API (đề xuất)
- Groq (chính)
- Gemini Flash (dự phòng)
- Pollinations.ai (dự phòng image nhanh)

---

## 3. PHÂN GIAI ĐOẠN (14-16 tuần – Realistic cho 1 người)

**Phase 0: Foundation (Tuần 1-2)**
- Layered Memory + State Manager
- Rule Engine cơ bản (combat + validation)
- Character model + save/load

**Phase 1: AI DM Core (Tuần 3-5)**
- Chat loop + Intent Parser
- Kết nối Groq/Gemini + prompt engineering tốt
- Rule Engine validate trước khi gọi LLM

**Phase 2: Combat & Exploration (Tuần 6-9)**
- Combat đầy đủ (initiative, attack, damage, conditions)
- Simple location system + travel
- Character sheet UI

**Phase 3: Image & Map (Tuần 10-12)**
- Tích hợp ComfyUI local
- Tự động gen map ảnh khi vào khu vực mới
- Overlay token trên ảnh map

**Phase 4: Polish & Packaging (Tuần 13-16)**
- Tauri sidecar (Ollama + ComfyUI tự khởi động)
- UI polish + splash screen
- Installer + first-run model download
- Testing 1-2 encounter đầy đủ

---

## 4. HÌNH ẢNH & MAP (Chiến lược thực tế)

- Dùng **ComfyUI local** + model fantasy từ Civitai (tải về 1 lần)
- Mỗi khu vực mới → AI DM tạo prompt → ComfyUI gen ảnh 1024x1024
- Map đơn giản: Ảnh nền + grid overlay + token nhân vật di chuyển
- Không cần vẽ thủ công, không cần editor phức tạp
- Cache ảnh để không gen lại nhiều lần

---

## 5. RỦI RO & GIẢI PHÁP

- **Phạm vi lớn**: Giữ chặt v0.1, ghi "v0.2" cho những thứ bỏ qua
- **Thời gian gen ảnh**: Có loading + cache + fallback Pollinations
- **Sidecar phức tạp**: Bắt đầu với prototype Streamlit trước, chuyển Tauri sau khi core ổn
- **Model nặng**: Hướng dẫn user tải model lần đầu (tương tự game Steam)

---

## 6. BƯỚC TIẾP THEO NGAY (Hôm nay)

1. Viết LayeredMemory + RuleEngine core
2. Setup Groq API key + test prompt
3. Chuẩn bị ComfyUI + 1-2 model test
4. Bắt đầu prototype chat + combat

---

**XekkoDND sẽ là trò chơi D&D local chất lượng cao, tập trung vào AI DM xuất sắc – hoàn toàn do 1 người làm được với sự hỗ trợ AI mạnh.**

Sẵn sàng bắt đầu code Phase 0 ngay Xekko!