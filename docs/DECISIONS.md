# DECISIONS — XekkoDND

> Log các quyết định kỹ thuật và thiết kế theo thời gian.
> Format: `[YYYY-MM-DD] DECISION: <tiêu đề>` + lý do + alternatives đã xem xét.

---

## [2026-05-22] Chốt PLAN_V5 làm spec chính

**Quyết định:** Dùng `docs/PLAN_V5.md` làm spec duy nhất. `DAC_TA_V1.md` là phiên bản cũ hơn, giữ lại để tham khảo nhưng không phát triển thêm.

**Lý do:** V5 bổ sung 3 trụ quan trọng (Interactive Items, Map System, Quest Branching) và cụ thể hóa pipeline multi-LLM + database schema 28 bảng.

---

## [2026-05-22] Database: Dexie M1, SQLite M1+

**Quyết định:** M1 dùng Dexie.js (IndexedDB, browser). Khi Tauri setup xong trong M1 → migrate sang SQLite via `tauri-plugin-sql`.

**Lý do:** Dexie cho phép chạy web trước khi Tauri ready, giảm dependency. SQLite là target cuối vì file-based, dễ backup/export.

**Alternatives:** Chỉ dùng localStorage (không đủ cho 28 bảng) | Chỉ SQLite ngay (cần Tauri setup trước).

---

## [2026-05-22] Monorepo structure: giữ xekkodnd-monorepo/

**Quyết định:** Giữ `xekkodnd-monorepo/` làm thư mục monorepo chính. Không rename sang `xekkodnd/` như spec V5 gợi ý vì đã có code và git history.

**Lý do:** Breaking change không cần thiết.

---

## [2026-05-22] Character Sheet: 2-tier HUD + popup

**Quyết định:** HUD top bar luôn hiện (Tier 1). Click → popup modal M1, side panel M2.

---

## [2026-05-22] Items: Hybrid card UI

**Quyết định:** 1 item detected → big card. 2+ items → compact list dọc.

---

## [2026-05-22] Map source M1

**Quyết định:** A + B: campaign-provided maps + 5 bundled generic maps. User upload PNG M2.

---

## [2026-05-22] Branch decision UI

**Quyết định:** B + C: inline options buttons + free-form text luôn có. Options chỉ show khi có branches rõ ràng.

---

## [2026-05-22] NPC path memory

**Quyết định:** B: `current_position` + `home` + `known_locations`. Không full `tile_visits` log như player.

---

*Thêm entry mới ở trên cùng.*
