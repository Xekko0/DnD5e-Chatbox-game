/**
 * State Extractor — PLAN_V5 §4.7, §5
 * LLM call #2 (sau Narrative), luôn chạy
 * Input: narrative text vừa sinh + previous state
 * Output JSON: { hp_delta, conditions_add, conditions_remove, equipment_changes, ... }
 * Validate bằng Zod, retry 1 lần nếu fail schema
 * TODO: Implement (prompt, Zod schema, apply handler)
 */
export {};
