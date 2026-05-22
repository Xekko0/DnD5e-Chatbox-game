'use client';

import { Dices, Settings } from 'lucide-react';
import type { SceneEnvironment } from '@/components/AdventureMode';

const ENVIRONMENT_OPTIONS: Array<{ id: SceneEnvironment; label: string }> = [
  { id: 'cave', label: 'Hang' },
  { id: 'forest', label: 'Rừng' },
  { id: 'ruins', label: 'Tàn tích' },
  { id: 'swamp', label: 'Đầm' },
];

type AppHeaderProps = {
  campaignTitle: string;
  chapter: string;
  environment: SceneEnvironment;
  onEnvironmentChange: (env: SceneEnvironment) => void;
  onOpenSettings: () => void;
};

export default function AppHeader({
  campaignTitle,
  chapter,
  environment,
  onEnvironmentChange,
  onOpenSettings,
}: AppHeaderProps) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-800/40 bg-[#0d0f12] px-4">
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500">
            <Dices className="h-3.5 w-3.5 text-zinc-950" />
          </div>
          <span className="hidden text-xs font-black uppercase tracking-widest text-zinc-400 sm:inline">XekkoDND</span>
        </div>
        <div className="min-w-0 border-l border-zinc-800 pl-4">
          <p className="truncate text-sm font-bold text-white leading-none">{campaignTitle}</p>
          <p className="truncate text-[10px] text-zinc-500 mt-0.5">{chapter}</p>
        </div>
      </div>

      <div className="hidden items-center gap-1 md:flex">
        {ENVIRONMENT_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onEnvironmentChange(opt.id)}
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors ${
              environment === opt.id
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'text-zinc-600 hover:text-zinc-400'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onOpenSettings}
        className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-800 hover:text-white transition-colors"
        title="Cài đặt"
      >
        <Settings className="h-5 w-5" />
      </button>
    </header>
  );
}
