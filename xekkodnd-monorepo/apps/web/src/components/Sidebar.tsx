'use client';

import { Home, Sword, Scroll, Map, BookOpen } from 'lucide-react';

type TabId = 'chat' | 'character' | 'inventory' | 'map' | 'quests';

interface TabItem {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const tabs: TabItem[] = [
    { id: 'chat', label: 'Chat', icon: Home },
    { id: 'character', label: 'Character', icon: Sword },
    { id: 'inventory', label: 'Inventory', icon: Scroll },
    { id: 'map', label: 'Map', icon: Map },
    { id: 'quests', label: 'Quests', icon: BookOpen },
  ];

  return (
    <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
      <div className="p-4 border-b border-zinc-800">
        <h2 className="text-lg font-semibold text-amber-300">XekkoDND</h2>
      </div>
      
      <nav className="flex-1 p-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-1 text-left transition-colors ${
                activeTab === tab.id 
                  ? 'bg-zinc-800 text-white' 
                  : 'hover:bg-zinc-800 text-zinc-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-zinc-800 text-xs text-zinc-500">
        Campaign: The Whispering Caverns
      </div>
    </div>
  );
}
