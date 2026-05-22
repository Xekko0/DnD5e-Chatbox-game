/**
 * Ollama HTTP Client + Narrator Engine
 * SRD V6 ref: §6 STEP 4 — NARRATOR
 * AI chỉ đọc Result Object và kể chuyện tiếng Việt. KHÔNG tính số. KHÔNG quyết định outcome.
 */

import type { ResultObject } from './modules/combat/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OllamaChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OllamaChatOptions {
  baseUrl?: string;
  model: string;
  messages: OllamaChatMessage[];
  stream?: boolean;
  onToken?: (token: string) => void;
}

/** 3 narrative styles M1 */
export type NarrativeStyle = 'high_fantasy' | 'kiem_hiep' | 'light';

/** 2 GM personas M1 */
export type GmPersona = 'classic_dm' | 'lao_tien_boi';

export interface NarratorContext {
  playerName: string;
  characterClass: string;
  currentLocation: string;
  activeQuestSummary?: string;
  recentMemories?: string;
  currentHp: number;
  maxHp: number;
  conditions: string[];
  /** Last 5 messages từ chat history */
  recentChat?: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const DEFAULT_BASE_URL = 'http://localhost:11434';
const DEFAULT_MODEL = 'qwen2.5:7b';

// ─── Style prompts ────────────────────────────────────────────────────────────

const STYLE_PROMPTS: Record<NarrativeStyle, string> = {
  high_fantasy: `
Phong cách: High Fantasy sử thi. Ngôn ngữ trang trọng, hùng tráng.
Dùng hình ảnh ánh sáng, bóng tối, lửa, thép. Câu văn dài, có nhịp điệu.
Nhân vật xưng hô kiểu cổ điển: "ngươi", "ta". Tên riêng giữ nguyên tiếng Anh.`,

  kiem_hiep: `
Phong cách: Kiếm hiệp châu Á. Câu ngắn, lực, như thơ.
Dùng hình ảnh gió, sương, kiếm khí, nội lực. Không khí huyền bí, cổ phong.
Xưng hô: "ngươi", "lão phu", "tiền bối". Mô tả đòn thế như kiếm thuật.`,

  light: `
Phong cách: Light-hearted, vui tươi. Câu ngắn gọn, dễ đọc.
Hài hước nhẹ nhàng khi phù hợp. Xưng hô: "bạn", "mình".
Mô tả action sống động nhưng không quá dramatic.`,
};

const PERSONA_PROMPTS: Record<GmPersona, string> = {
  classic_dm: `
Persona: Dungeon Master cổ điển. Giọng kể truyện trung lập, khách quan.
Không thiên vị, không drama quá mức. Tả cảnh cẩn thận, chi tiết.`,

  lao_tien_boi: `
Persona: Lão Tiền Bối đầy kinh nghiệm. Giọng già dặn, thâm trầm.
Thỉnh thoảng triết lý ngắn. Dùng ẩn dụ từ thiên nhiên.
Ví dụ: "Kiếm không phân biệt thiện ác — người dùng kiếm mới quyết định điều đó."`,
};

// ─── System Prompt Builder ────────────────────────────────────────────────────

/**
 * Build Narrator system prompt theo V6 §6.2
 */
export function buildNarratorSystemPrompt(
  style: NarrativeStyle = 'high_fantasy',
  persona: GmPersona = 'classic_dm',
  context?: NarratorContext
): string {
  const conditionStr =
    context?.conditions?.length
      ? `Đang chịu: ${context.conditions.join(', ')}`
      : 'Không có condition';

  return `[BẠN LÀ NARRATOR CHO XEKKODND]

Vai trò DUY NHẤT của bạn: biến kết quả mechanic thành câu chuyện sống động bằng tiếng Việt.
Code đã quyết định outcome. Bạn KHÔNG quyết định gì cả.

[QUY TẮC TUYỆT ĐỐI]
- KHÔNG tự tạo ra damage numbers, HP values, dice rolls
- KHÔNG quyết định ai sống/chết ngoài những gì Result Object nói
- KHÔNG tự tạo items, quests, NPCs mới trừ khi được yêu cầu
- Giữ thuật ngữ D&D: HP, AC, DC, roll, saving throw
- Tiếng Việt tự nhiên, không dịch máy

[PHONG CÁCH KỂ]
${STYLE_PROMPTS[style]}

[GM PERSONA]
${PERSONA_PROMPTS[persona]}

[CÁCH ĐỌC RESULT OBJECT]
1. action_type → biết chuyện gì xảy ra
2. outcome → kết quả thế nào (hit/miss/kill/fail)
3. dramatic_context → cảm xúc, không khí
4. must_mention → bắt buộc đề cập (nhưng không lặp số)
5. must_not_say → tuyệt đối không nói

Kể 2-5 câu tiếng Việt sống động. Dùng <cmd:...> tags để inline UI elements.

[COMMAND TAGS — chỉ render, KHÔNG execute]
<cmd:rolled action='X' result='Y' vs='Z' />  → hiển thị dice roll
<cmd:hp_change target='X' delta='-7' />       → hiển thị damage number
<cmd:entity_died target='X' />                → hiển thị death indicator
<cmd:item_appeared name='X' />                → spawn item card
<cmd:quest_event type='completed' quest='X' />→ toast notification
<cmd:suggest>- Gợi ý 1\n- Gợi ý 2\n- Gợi ý 3</cmd:suggest> → quick buttons

[VÍ DỤ OUTPUT]
Khi attack hit + kill:
"Lưỡi kiếm của ngươi loang loáng, cắm sâu vào sườn tên goblin <cmd:rolled action='attack' result='17' vs='13'/>. Hắn gầm lên đau đớn, máu thấm đẫm lớp áo rách <cmd:hp_change target='goblin_1' delta='-7'/>. Tên goblin quỵ xuống, không còn cựa quậy nữa. <cmd:entity_died target='goblin_1'/>"

Khi attack miss:
"Ngươi vung kiếm nhưng tên goblin nhanh nhẹn nhảy lùi, lưỡi thép chỉ cắt không khí <cmd:rolled action='attack' result='8' vs='13'/>. Hắn nhe răng cười nhạo."

[KHI KHÔNG CÓ RESULT OBJECT — pure narrative]
- Tả cảnh, không khí, NPC behavior
- Đề xuất hành động qua dialogue hoặc môi trường
- KHÔNG tự tạo combat, item drop, quest event
- Để player drive forward
- Kết thúc bằng <cmd:suggest> với 2-3 gợi ý hành động phù hợp

[CONTEXT NHÂN VẬT]
Tên: ${context?.playerName ?? 'Không rõ'}
Class: ${context?.characterClass ?? 'Không rõ'}
HP: ${context?.currentHp ?? '?'}/${context?.maxHp ?? '?'}
Vị trí: ${context?.currentLocation ?? 'Không rõ'}
${conditionStr}
Quest hiện tại: ${context?.activeQuestSummary ?? 'Không có'}
${context?.recentMemories ? `Ký ức gần đây: ${context.recentMemories}` : ''}

[CHAT GẦN ĐÂY]
${context?.recentChat ?? '(Chưa có)'}`;
}

// ─── Old simple prompt (backward compat) ─────────────────────────────────────

export function buildDmSystemPrompt(): string {
  return buildNarratorSystemPrompt('high_fantasy', 'classic_dm');
}

// ─── Ollama HTTP Client ───────────────────────────────────────────────────────

/**
 * Non-streaming call
 */
export async function ollamaChat(options: OllamaChatOptions): Promise<string> {
  const baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: options.model,
      messages: options.messages,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed (${response.status}): ${await response.text()}`);
  }

  const payload = (await response.json()) as { message?: { content?: string } };
  return payload.message?.content?.trim() ?? '';
}

/**
 * Streaming call — gọi onToken mỗi khi có token mới
 * V6 ref: §6 NA5 — Streaming output to UI
 */
export async function ollamaChatStream(options: OllamaChatOptions): Promise<string> {
  const baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: options.model,
      messages: options.messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama stream failed (${response.status}): ${await response.text()}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let fullContent = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n').filter(Boolean);

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line) as {
          message?: { content?: string };
          done?: boolean;
        };
        const token = parsed.message?.content ?? '';
        if (token) {
          fullContent += token;
          options.onToken?.(token);
        }
        if (parsed.done) break;
      } catch {
        // partial JSON chunk, skip
      }
    }
  }

  return fullContent;
}

// ─── Narrator ─────────────────────────────────────────────────────────────────

export interface NarratorCallOptions {
  baseUrl?: string;
  model?: string;
  style?: NarrativeStyle;
  persona?: GmPersona;
  context: NarratorContext;
  /** Result Object từ Rule Engine (undefined = pure narrative) */
  resultObject?: ResultObject;
  playerInput: string;
  chatHistory?: OllamaChatMessage[];
  stream?: boolean;
  onToken?: (token: string) => void;
}

/**
 * Main Narrator call — V6 Step 4
 * Đọc Result Object → gọi Ollama → trả về narrative text với <cmd:...> tags
 */
export async function callNarrator(opts: NarratorCallOptions): Promise<string> {
  const {
    baseUrl,
    model = DEFAULT_MODEL,
    style = 'high_fantasy',
    persona = 'classic_dm',
    context,
    resultObject,
    playerInput,
    chatHistory = [],
    stream = false,
    onToken,
  } = opts;

  const systemPrompt = buildNarratorSystemPrompt(style, persona, context);

  // Build user message: player input + result object (nếu có)
  let userContent = `Player nói: "${playerInput}"`;
  if (resultObject) {
    userContent += `\n\n[RESULT OBJECT]\n${JSON.stringify(resultObject, null, 2)}`;
    userContent += `\n\n[NHIỆM VỤ] Kể chuyện dựa trên result object trên. Tuân thủ must_mention và must_not_say.`;
  } else {
    userContent += `\n\n[NHIỆM VỤ] Pure narrative — tả cảnh, không tạo mechanic mới. Kết thúc bằng <cmd:suggest> gợi ý 2-3 hành động.`;
  }

  const messages: OllamaChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...chatHistory.slice(-10), // giữ 10 messages gần nhất
    { role: 'user', content: userContent },
  ];

  const callOptions: OllamaChatOptions = {
    baseUrl,
    model,
    messages,
    stream,
    onToken,
  };

  if (stream && onToken) {
    return ollamaChatStream(callOptions);
  }
  return ollamaChat(callOptions);
}

// ─── Connection test ──────────────────────────────────────────────────────────

export async function testOllamaConnection(baseUrl?: string): Promise<boolean> {
  try {
    const url = (baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
    const response = await fetch(`${url}/api/tags`, { method: 'GET' });
    return response.ok;
  } catch {
    return false;
  }
}

export async function listOllamaModels(baseUrl?: string): Promise<string[]> {
  try {
    const url = (baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
    const res = await fetch(`${url}/api/tags`);
    if (!res.ok) return [];
    const data = (await res.json()) as { models?: Array<{ name: string }> };
    return (data.models ?? []).map((m) => m.name);
  } catch {
    return [];
  }
}
