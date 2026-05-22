'use client';

import { BookOpen, Brain, MapPin, Scroll, Users } from 'lucide-react';

export type NotebookTabId = 'npc' | 'location' | 'quest' | 'story' | 'memory';

export interface NotebookTabItem {
  id: NotebookTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const NOTEBOOK_TABS: NotebookTabItem[] = [
  { id: 'npc', label: 'NPC', icon: Users },
  { id: 'location', label: 'Địa điểm', icon: MapPin },
  { id: 'quest', label: 'Nhiệm vụ', icon: Scroll },
  { id: 'story', label: 'Story Cards', icon: BookOpen },
  { id: 'memory', label: 'Ký ức', icon: Brain },
];

interface NotebookTabsProps {
  activeTab: NotebookTabId;
  onTabChange: (tab: NotebookTabId) => void;
}

/** Tab bar Notebook — DAC_TA_V1 FR-UI-03 (sửa từ Sidebar cũ) */
export default function NotebookTabs({ activeTab, onTabChange }: NotebookTabsProps) {
  return (
    <div className="flex border-b border-zinc-800/50 bg-[#0d0f12]">
      {NOTEBOOK_TABS.map((tab) => {
        const Icon = tab.icon;
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            title={tab.label}
            className={`flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-bold uppercase tracking-wider transition-colors ${
              active ? 'border-b-2 border-amber-500 text-amber-400 bg-amber-500/5' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden xl:inline">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
