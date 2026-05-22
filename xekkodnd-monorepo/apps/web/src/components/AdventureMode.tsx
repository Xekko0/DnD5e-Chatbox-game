'use client';

import Image from 'next/image';
import { useState } from 'react';
import {
  ChevronDown,
  Dices,
  Lightbulb,
  Mic,
  MoreHorizontal,
  Plus,
  SendHorizontal,
  Zap,
} from 'lucide-react';

export type SceneEnvironment = 'cave' | 'forest' | 'ruins' | 'swamp';

export type NarrativeMessage = {
  id: string;
  role: 'assistant' | 'user' | 'system';
  content: string;
  timestamp: string;
  tag?: string;
};

const ENVIRONMENT_LABELS: Record<SceneEnvironment, string> = {
  cave: 'Hang động',
  forest: 'Rừng cổ',
  ruins: 'Tàn tích',
  swamp: 'Đầm lầy',
};

type AdventureModeProps = {
  campaignChapter: string;
  environment: SceneEnvironment;
  messages: NarrativeMessage[];
  isProcessing: boolean;
  error?: string | null;
  onSend: (text: string) => Promise<void>;
  onRollDice: () => Promise<void>;
};

/** Chat trung tâm — DAC_TA_V1 FR-UI-01 */
export default function AdventureMode({
  campaignChapter,
  environment,
  messages,
  isProcessing,
  error,
  onSend,
  onRollDice,
}: AdventureModeProps) {
  const [draft, setDraft] = useState('');

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text || isProcessing) return;
    await onSend(text);
    setDraft('');
  };

  return (
    <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-[#121418]">
      {error && (
        <div className="border-b border-red-900/50 bg-red-950/40 px-6 py-2 text-sm text-red-300">{error}</div>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-8 md:px-12 custom-scrollbar">
        <div className="mx-auto max-w-3xl space-y-10">
          {messages.length === 0 && (
            <p className="text-center text-sm text-zinc-500 py-12">Bắt đầu cuộc phiêu lưu bằng một hành động...</p>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role !== 'user' && (
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-amber-600/30 bg-amber-900/20">
                  <Image
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=DM_Avatar"
                    alt="DM"
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
              )}
              <div className={`max-w-[85%] space-y-2 ${message.role === 'user' ? 'text-right' : ''}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${
                      message.role === 'user' ? 'text-blue-400' : 'text-amber-500'
                    }`}
                  >
                    {message.role === 'user' ? 'Ngươi' : 'Dungeon Master'}
                  </span>
                  {message.role !== 'user' && (
                    <span className="text-[10px] text-zinc-600">
                      {campaignChapter} · {ENVIRONMENT_LABELS[environment]}
                    </span>
                  )}
                </div>
                <div
                  className={`rounded-2xl border px-4 py-3 ${
                    message.role === 'user'
                      ? 'border-zinc-700 bg-zinc-900/80 text-zinc-100'
                      : 'border-zinc-800 bg-[#161a22] text-zinc-300'
                  }`}
                >
                  <p className={`leading-relaxed ${message.role === 'user' ? 'text-base' : 'font-serif text-lg'}`}>
                    {message.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {isProcessing && (
            <p className="text-center text-xs text-amber-500/80 animate-pulse">DM đang suy nghĩ...</p>
          )}
        </div>
      </div>

      <div className="border-t border-zinc-800/50 bg-[#121418] p-4 md:p-6">
        <div className="mx-auto max-w-3xl">
          <div className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-[#1c1f26] shadow-lg focus-within:border-amber-500/30">
            <div className="flex items-center justify-between border-b border-zinc-800/50 bg-zinc-900/20 px-4 py-2 text-[10px] text-zinc-500">
              <span>Shift + Enter để gửi</span>
              <MoreHorizontal className="h-4 w-4" />
            </div>
            <textarea
              placeholder="Bạn định thực hiện hành động gì?..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.shiftKey || e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
              disabled={isProcessing}
              className="h-24 w-full resize-none bg-transparent px-4 py-3 font-serif text-lg text-zinc-200 outline-none placeholder:text-zinc-600 disabled:opacity-50"
            />
            <div className="flex items-center justify-between border-t border-zinc-800/30 bg-zinc-900/40 px-4 py-3">
              <div className="flex gap-1">
                <button type="button" title="Gợi ý" className="rounded-xl p-2 text-zinc-500 hover:bg-zinc-800 hover:text-amber-500">
                  <Lightbulb className="h-5 w-5" />
                </button>
                <button type="button" title="Kỹ năng" className="rounded-xl p-2 text-zinc-500 hover:bg-zinc-800">
                  <Zap className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  title="Đổ xúc xắc"
                  disabled={isProcessing}
                  onClick={() => void onRollDice()}
                  className="rounded-xl p-2 text-zinc-500 hover:bg-zinc-800 hover:text-red-400 disabled:opacity-40"
                >
                  <Dices className="h-5 w-5" />
                </button>
                <button type="button" className="rounded-xl p-2 text-zinc-500 hover:bg-zinc-800">
                  <Plus className="h-5 w-5" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-bold text-zinc-400"
                >
                  Kể chuyện <ChevronDown className="h-3 w-3 opacity-50" />
                </button>
                <button
                  type="button"
                  onClick={() => void sendMessage()}
                  disabled={isProcessing}
                  className="flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-black text-zinc-950 disabled:opacity-50"
                >
                  {isProcessing ? '...' : 'GỬI'}
                  <SendHorizontal className="h-4 w-4" />
                </button>
                <button type="button" className="rounded-full bg-zinc-800 p-2.5 text-zinc-400">
                  <Mic className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
