/**
 * Ollama HTTP client (browser + Node)
 */

export interface OllamaChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OllamaChatOptions {
  baseUrl?: string;
  model: string;
  messages: OllamaChatMessage[];
}

const DEFAULT_BASE_URL = 'http://localhost:11434';

export function buildDmSystemPrompt(): string {
  return [
    'Bạn là Dungeon Master chuyên nghiệp cho Dungeons & Dragons 5th Edition, chỉ chơi 1 người chơi.',
    '- Luôn giữ luật DnD 5e (ability check, attack roll, saving throw khi cần).',
    '- Mô tả cảnh sống động, kịch tính, giàu chi tiết giác quan.',
    '- Không spoil plot, không quyết định hành động thay người chơi.',
    '- Người chơi có thể roll dice bằng cách nói "roll d20" hoặc /roll.',
    '- Trả lời bằng tiếng Việt tự nhiên; giữ thuật ngữ HP, AC, DC, roll.',
    '- Mỗi lần trả lời 3–8 câu, kết thúc gợi ý người chơi chọn hành động tiếp.',
  ].join('\n');
}

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
    throw new Error(`Ollama request failed (${response.status})`);
  }

  const payload = (await response.json()) as { message?: { content?: string } };
  return payload.message?.content?.trim() ?? '';
}

export async function testOllamaConnection(baseUrl?: string): Promise<boolean> {
  try {
    const url = (baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '');
    const response = await fetch(`${url}/api/tags`, { method: 'GET' });
    return response.ok;
  } catch {
    return false;
  }
}
