'use client';

/**
 * AdventureMode — Chat UI chính
 * V6 §7: Input modes, inline tags, streaming, suggested actions, auto-scroll
 */

import Image from 'next/image';
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Dices,
  SendHorizontal,
  Swords,
  MessageCircle,
  BookOpen,
  Terminal,
  RotateCcw,
  ChevronDown,
} from 'lucide-react';
import { renderMessageContent } from './ChatMessage';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SceneEnvironment = 'cave' | 'forest' | 'ruins' | 'swamp';

export type NarrativeMessage = {
  id: string;
  role: 'assistant' | 'user' | 'system';
  content: string;
  timestamp: string;
  /** Đang streaming (chưa xong) */
  isStreaming?: boolean;
};

/** 4 input modes theo V6 §7.2 */
type InputMode = 'do' | 'say' | 'story' | 'cmd';

const INPUT_MODES: { id: InputMode; label: string; icon: React.ReactNode; placeholder: string; color: string }[] = [
  {
    id: 'do',
    label: 'Làm',
    icon: <Swords className="h-3.5 w-3.5" />,
    placeholder: 'Bạn định thực hiện hành động gì?...',
    color: 'text-amber-400 border-amber-500/50',
  },
  {
    id: 'say',
    label: 'Nói',
    icon: <MessageCircle className="h-3.5 w-3.5" />,
    placeholder: 'Bạn muốn nói gì?...',
    color: 'text-blue-400 border-blue-500/50',
  },
  {
    id: 'story',
    label: 'Kể',
    icon: <BookOpen className="h-3.5 w-3.5" />,
    placeholder: 'Mô tả cảnh quan, suy nghĩ, hành động nội tâm...',
    color: 'text-purple-400 border-purple-500/50',
  },
  {
    id: 'cmd',
    label: '/cmd',
    icon: <Terminal className="h-3.5 w-3.5" />,
    placeholder: '/attack goblin, /roll d20, /rest short...',
    color: 'text-green-400 border-green-500/50',
  },
];

const ENV_LABELS: Record<SceneEnvironment, string> = {
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
  onSend: (text: string, mode: InputMode) => Promise<void>;
  onRollDice: () => Promise<void>;
};

// ─── Component ────────────────────────────────────────────────────────────────

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
  const [mode, setMode] = useState<InputMode>('do');
  const [lastAction, setLastAction] = useState<{ text: string; mode: InputMode } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentMode = INPUT_MODES.find((m) => m.id === mode)!;

  // Auto-scroll khi có message mới
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Tab cycle modes (khi đang focus textarea)
      if (e.key === 'Tab' && document.activeElement === textareaRef.current) {
        e.preventDefault();
        const idx = INPUT_MODES.findIndex((m) => m.id === mode);
        setMode(INPUT_MODES[(idx + 1) % INPUT_MODES.length].id);
        return;
      }
      // R = repeat last action
      if (e.key === 'r' && !e.ctrlKey && !e.metaKey && document.activeElement !== textareaRef.current) {
        if (lastAction) {
          setDraft(lastAction.text);
          setMode(lastAction.mode);
          textareaRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [mode, lastAction]);

  // Nếu /cmd mode: auto-prefix "/"
  useEffect(() => {
    if (mode === 'cmd' && draft && !draft.startsWith('/')) {
      setDraft('/' + draft);
    }
  }, [mode]);

  const sendMessage = useCallback(async () => {
    const text = draft.trim();
    if (!text || isProcessing) return;
    setLastAction({ text, mode });
    setDraft('');
    await onSend(text, mode);
  }, [draft, mode, isProcessing, onSend]);

  const handleSuggest = useCallback(
    (suggestion: string) => {
      setDraft(suggestion);
      setMode('do');
      textareaRef.current?.focus();
    },
    []
  );

  return (
    <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-[#121418]">
      {/* Error banner */}
      {error && (
        <div className="border-b border-red-900/50 bg-red-950/40 px-6 py-2 text-sm text-red-300">
          ⚠ {error}
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 md:px-10 custom-scrollbar">
        <div className="mx-auto max-w-3xl space-y-8">
          {messages.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-sm text-zinc-500">Cuộc phiêu lưu chưa bắt đầu...</p>
              <p className="mt-2 text-xs text-zinc-600">Nhập hành động đầu tiên bên dưới</p>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              chapter={campaignChapter}
              environment={environment}
              onSuggest={handleSuggest}
            />
          ))}

          {/* Processing indicator */}
          {isProcessing && (
            <div className="flex items-center gap-3 pl-14">
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-500 [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-500 [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-500 [animation-delay:300ms]" />
              </div>
              <span className="text-xs text-amber-500/70">DM đang suy nghĩ...</span>
            </div>
          )}
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-zinc-800/50 bg-[#0f1014] p-3 md:p-4">
        <div className="mx-auto max-w-3xl">
          {/* Mode selector */}
          <div className="mb-2 flex gap-1">
            {INPUT_MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold transition-all ${
                  mode === m.id
                    ? `${m.color} bg-zinc-800`
                    : 'border-transparent text-zinc-600 hover:text-zinc-400'
                }`}
              >
                {m.icon}
                {m.label}
              </button>
            ))}
            <span className="ml-auto text-[10px] text-zinc-600 self-center pr-1">
              Tab để đổi · R để lặp
            </span>
          </div>

          {/* Input box */}
          <div
            className={`overflow-hidden rounded-xl border bg-[#1c1f26] shadow-lg transition-colors focus-within:border-opacity-60 ${
              mode === 'do' ? 'border-amber-800/50 focus-within:border-amber-600/50' :
              mode === 'say' ? 'border-blue-800/50 focus-within:border-blue-600/50' :
              mode === 'story' ? 'border-purple-800/50 focus-within:border-purple-600/50' :
              'border-green-800/50 focus-within:border-green-600/50'
            }`}
          >
            <textarea
              ref={textareaRef}
              placeholder={currentMode.placeholder}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
              disabled={isProcessing}
              rows={3}
              className="w-full resize-none bg-transparent px-4 py-3 text-base text-zinc-200 outline-none placeholder:text-zinc-600 disabled:opacity-50"
            />

            {/* Bottom toolbar */}
            <div className="flex items-center justify-between border-t border-zinc-800/30 bg-zinc-900/40 px-3 py-2">
              <div className="flex gap-1">
                <button
                  type="button"
                  title="Đổ xúc xắc d20"
                  disabled={isProcessing}
                  onClick={() => void onRollDice()}
                  className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-red-400 disabled:opacity-40 transition-colors"
                >
                  <Dices className="h-4 w-4" />
                </button>
                {lastAction && (
                  <button
                    type="button"
                    title={`Lặp lại: "${lastAction.text}"`}
                    onClick={() => { setDraft(lastAction.text); setMode(lastAction.mode); }}
                    className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-amber-400 transition-colors"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-600">Ctrl+Enter</span>
                <button
                  type="button"
                  onClick={() => void sendMessage()}
                  disabled={isProcessing || !draft.trim()}
                  className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-black transition-all disabled:opacity-40 ${
                    mode === 'do' ? 'bg-amber-600 text-zinc-950 hover:bg-amber-500' :
                    mode === 'say' ? 'bg-blue-600 text-white hover:bg-blue-500' :
                    mode === 'story' ? 'bg-purple-600 text-white hover:bg-purple-500' :
                    'bg-green-700 text-white hover:bg-green-600'
                  }`}
                >
                  {isProcessing ? '...' : currentMode.label.toUpperCase()}
                  <SendHorizontal className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({
  message,
  chapter,
  environment,
  onSuggest,
}: {
  message: NarrativeMessage;
  chapter: string;
  environment: SceneEnvironment;
  onSuggest: (s: string) => void;
}) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%]">
          <div className="mb-1 text-right text-[10px] font-bold uppercase tracking-wider text-blue-400">
            Ngươi
          </div>
          <div className="rounded-2xl rounded-tr-sm border border-zinc-700 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-200 leading-relaxed">
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      {/* DM avatar */}
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-amber-600/30 bg-amber-900/20">
        <Image
          src="https://api.dicebear.com/7.x/avataaars/svg?seed=DM_Avatar"
          alt="DM"
          fill
          sizes="40px"
          className="object-cover"
          unoptimized
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">
            Dungeon Master
          </span>
          <span className="text-[10px] text-zinc-600">
            {chapter} · {ENV_LABELS[environment]}
          </span>
          {message.isStreaming && (
            <span className="text-[10px] text-amber-500/50 animate-pulse">● đang viết...</span>
          )}
        </div>
        <div className="rounded-2xl rounded-tl-sm border border-zinc-800 bg-[#161a22] px-4 py-3">
          <div className="font-serif text-base leading-relaxed text-zinc-300">
            {renderMessageContent(message.content, onSuggest)}
          </div>
        </div>
      </div>
    </div>
  );
}
