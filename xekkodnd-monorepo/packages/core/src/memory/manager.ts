/**
 * Memory Manager — PLAN_V5 §4.4 (Trụ 4: Memory & State)
 * Auto-summary mỗi 5 turn (async, không block UI):
 *   1. Gom 5 turn vừa qua
 *   2. LLM call tóm tắt ~100 từ
 *   3. Lưu vào memories với tags: location, NPCs, importance
 *   4. Inject vào context khi keyword match
 * Retrieval M1: keyword match
 * Retrieval M2: BM25 ranking
 * Top 3 memories liên quan + recent 10 messages = working context
 * TODO: Implement (auto-summary, retrieval, injection)
 */
export {};
