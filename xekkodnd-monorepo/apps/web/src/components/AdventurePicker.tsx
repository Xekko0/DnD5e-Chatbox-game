'use client';

import { BookOpen, Dices, FolderOpen, Sparkles } from 'lucide-react';

type AdventurePickerProps = {
  hasSave: boolean;
  lastSavedAt: string | null;
  onNewAdventure: () => void;
  onContinue: () => void;
};

/** Chọn campaign — DAC_TA_V1 FR-UI-05 */
export default function AdventurePicker({ hasSave, lastSavedAt, onNewAdventure, onContinue }: AdventurePickerProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#09090b] px-6">
      <div className="mb-10 flex flex-col items-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 shadow-lg shadow-amber-500/20">
          <Dices className="h-8 w-8 text-zinc-950" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white">XekkoDND</h1>
        <p className="mt-2 max-w-md text-sm text-zinc-500">
          Solo D&D 5e · Local Ollama · Campaign có cấu trúc · Tiếng Việt
        </p>
      </div>

      <div className="grid w-full max-w-lg gap-4">
        <button
          type="button"
          onClick={onNewAdventure}
          className="group flex items-start gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-left transition-all hover:border-amber-500/50 hover:bg-amber-500/15"
        >
          <Sparkles className="mt-0.5 h-6 w-6 shrink-0 text-amber-400" />
          <div>
            <p className="font-bold text-white">Phiêu lưu mới</p>
            <p className="mt-1 text-sm text-zinc-400">Tạo nhân vật và bắt đầu campaign homebrew</p>
          </div>
        </button>

        <button
          type="button"
          onClick={onContinue}
          disabled={!hasSave}
          className="group flex items-start gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 text-left transition-all hover:border-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <FolderOpen className="mt-0.5 h-6 w-6 shrink-0 text-zinc-400 group-enabled:text-emerald-400" />
          <div>
            <p className="font-bold text-white">Tiếp tục</p>
            <p className="mt-1 text-sm text-zinc-500">
              {hasSave
                ? `Lần lưu gần nhất: ${lastSavedAt ? new Date(lastSavedAt).toLocaleString('vi-VN') : '—'}`
                : 'Chưa có bản lưu trên máy này'}
            </p>
          </div>
        </button>

        <div className="rounded-2xl border border-dashed border-zinc-800 p-5">
          <div className="flex items-center gap-3 text-zinc-500">
            <BookOpen className="h-5 w-5" />
            <p className="text-xs">
              Campaign file (.yaml + .md) — sẽ mở từ thư mục trong tuần 3 theo đặc tả
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
