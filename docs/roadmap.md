# XekkoDND Roadmap (tóm tắt)

> **Đặc tả triển khai đầy đủ:** [dac-ta/DAC_TA_V1.md](./dac-ta/DAC_TA_V1.md)  
> Mục tiêu: **3 tháng**, **2–3 giờ/ngày**, local Ollama, campaign có cấu trúc, memory cứng.

## Mục tiêu sản phẩm

Solo D&D AI chatbox local: GM tiếng Việt, campaign file (YAML/Markdown), state trong DB (không phụ thuộc trí nhớ LLM).

## Bốn trụ cốt lõi (giữ nguyên)

1. **State / Memory** — Character, NPC, quest, location trong IndexedDB  
2. **Rule Engine** — 5 rule + dice (MVP)  
3. **Chat** — Ollama narrative + State Extractor  
4. **Character Sheet** — Đồng bộ DB, chỉnh tay được  

## Timeline 12 tuần

| Tháng | Trọng tâm |
|-------|-----------|
| 1 | Ollama, campaign load, chat thật (Gate 1 tuần 4) |
| 2 | Pipeline chống quên, notebook, dice/rules |
| 3 | Story cards, preset, campaign mẫu 5 scene (Gate 2 tuần 12) |

## Ngoài phạm vi 3 tháng

Map editor, image/voice, combat grid, SRD full, Tauri (tùy chọn cuối tuần 12).

## Thành công

Chơi xong campaign mẫu; reload không mất state; HP/NPC khớp DB sau session dài.
