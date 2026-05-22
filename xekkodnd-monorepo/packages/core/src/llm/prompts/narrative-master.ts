/**
 * Narrative Master Prompt — PLAN_V5 §4.7, §9.6
 * System prompt master cho GM (viết tay, không AI generate hết)
 * Hỗ trợ 6 narrative style preset:
 *   high-fantasy-traditional | grimdark | kiem-hiep | light-hearted | pulp-adventure | horror
 * Hỗ trợ GM persona:
 *   wise-narrator | dramatic-bard | cynical-judge | friendly-guide | custom
 * Token budget: ~1500 token (system + style + persona)
 * TODO: Viết tay từng style preset
 */
export const NARRATIVE_STYLES = {
  'high-fantasy-traditional': '',
  'grimdark': '',
  'kiem-hiep': '',
  'light-hearted': '',
  'pulp-adventure': '',
  'horror': '',
} as const;

export const GM_PERSONAS = {
  'wise-narrator': '',
  'dramatic-bard': '',
  'cynical-judge': '',
  'friendly-guide': '',
} as const;

export type NarrativeStyle = keyof typeof NARRATIVE_STYLES;
export type GmPersona = keyof typeof GM_PERSONAS;
