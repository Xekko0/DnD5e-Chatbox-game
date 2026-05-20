'use client';

import Image from 'next/image';
import { useState } from 'react';
import {
  Play,
  User,
  Users,
  BookOpen,
  Globe,
  History,
  Settings,
  Plus,
  Search,
  Bell,
  ChevronDown,
  Zap,
  Dices,
  Lightbulb,
  Mic,
  SendHorizontal,
  Maximize2,
  MoreHorizontal,
  Compass,
  Map as MapIcon,
  Layers,
} from 'lucide-react';
import CharacterCreationWizard from '@/components/CharacterCreationWizard';
import { useGameStore } from '@/store/useGameStore';

type ActiveTab = 'play' | 'character' | 'party' | 'quests' | 'world' | 'memories' | 'settings';
type SceneEnvironment = 'cave' | 'forest' | 'ruins' | 'swamp';

type NarrativeMessage = {
  id: string;
  role: 'assistant' | 'user' | 'system';
  content: string;
  timestamp: string;
  tag?: string;
};

const ENVIRONMENT_LABELS: Record<SceneEnvironment, string> = {
  cave: 'Cavern Depths',
  forest: 'Ancient Forest',
  ruins: 'Forgotten Ruins',
  swamp: 'Black Marsh',
};

function buildNarration(environment: SceneEnvironment, userInput?: string): string {
  const inputPart = userInput?.trim() ? ` Your action: ${userInput.trim()}.` : '';
  return `AI narration for ${ENVIRONMENT_LABELS[environment]}.${inputPart} The scene reacts to the current environment and expands from here.`;
}

function AdventureMode({ campaignChapter, environment }: { campaignChapter: string; environment: SceneEnvironment }) {
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<NarrativeMessage[]>([]);

  const environmentMessage: NarrativeMessage = {
    id: `scene-${environment}`,
    role: 'system',
    content: buildNarration(environment),
    timestamp: new Date().toISOString(),
    tag: environment,
  };

  const sendMessage = () => {
    const text = draft.trim();
    if (!text) return;

    const userMessage: NarrativeMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    const assistantMessage: NarrativeMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: buildNarration(environment, text),
      timestamp: new Date().toISOString(),
      tag: environment,
    };

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setDraft('');
  };

  const displayedMessages = [environmentMessage, ...messages];

  return (
    <div className="flex-1 flex flex-col bg-[#121418] relative overflow-hidden">
      <div className="flex-1 overflow-y-auto px-8 md:px-16 py-10 space-y-10 custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-12">
          {displayedMessages.map((message) => (
            <div key={message.id} className={`flex gap-6 group animate-in fade-in slide-in-from-top-4 duration-700 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.role !== 'user' && (
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 rounded-xl bg-amber-900/20 border border-amber-600/30 flex items-center justify-center overflow-hidden shadow-2xl">
                    <div className="relative h-full w-full">
                      <Image src="https://api.dicebear.com/7.x/avataaars/svg?seed=DM_Avatar" alt="DM Avatar" fill sizes="56px" className="object-cover" />
                    </div>
                  </div>
                </div>
              )}

              <div className={`flex-1 space-y-4 ${message.role === 'user' ? 'max-w-2xl' : ''}`}>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`font-bold tracking-wider text-sm uppercase ${message.role === 'user' ? 'text-blue-400' : 'text-amber-500'}`}>
                    {message.role === 'user' ? 'Player' : 'Dungeon Master'}
                  </span>
                  <div className="h-1 w-1 rounded-full bg-zinc-700" />
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">{campaignChapter}</span>
                  {message.role !== 'user' && <span className="text-[10px] text-amber-400/80 uppercase font-bold tracking-widest">{ENVIRONMENT_LABELS[environment]}</span>}
                </div>

                <div className={`rounded-2xl border px-5 py-4 ${message.role === 'user' ? 'bg-zinc-900/60 border-zinc-800 text-zinc-100' : 'bg-[#161a22] border-zinc-800 text-zinc-300'}`}>
                  <p className={`leading-[1.8] ${message.role === 'user' ? 'font-sans text-base' : 'font-serif text-[20px]'}`}>{message.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-8 pt-0 bg-gradient-to-t from-[#121418] via-[#121418] to-transparent">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#1c1f26] border border-zinc-800/80 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden transition-all focus-within:border-amber-500/30">
            <div className="px-5 py-2.5 border-b border-zinc-800/50 flex justify-between items-center text-zinc-500 bg-zinc-900/20">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-5 h-5 rounded-full border-2 border-[#1c1f26] bg-zinc-700" />
                  ))}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Party is ready</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-medium opacity-50">Shift + Enter to send</span>
                <MoreHorizontal className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
              </div>
            </div>

            <div className="p-5">
              <textarea
                placeholder="Bạn định thực hiện hành động gì?..."
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && (event.shiftKey || event.metaKey || event.ctrlKey)) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                className="w-full bg-transparent border-none focus:ring-0 text-zinc-200 placeholder-zinc-700 resize-none h-24 font-serif text-lg leading-relaxed"
              />
            </div>

            <div className="px-5 py-4 bg-zinc-900/40 flex items-center justify-between border-t border-zinc-800/30">
              <div className="flex items-center gap-2">
                <button title="Gợi ý hành động" className="p-2.5 hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-amber-500 transition-all active:scale-95">
                  <Lightbulb className="w-5 h-5" />
                </button>
                <button title="Kỹ năng nhân vật" className="p-2.5 hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-blue-400 transition-all active:scale-95">
                  <Zap className="w-5 h-5" />
                </button>
                <button title="Đổ xúc xắc" className="p-2.5 hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-red-400 transition-all active:scale-95">
                  <Dices className="w-5 h-5" />
                </button>
                <div className="w-px h-6 bg-zinc-800 mx-1" />
                <button className="p-2.5 hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-white transition-all active:scale-95">
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-4">
                <button className="flex items-center gap-3 bg-zinc-800 hover:bg-zinc-700 px-5 py-2.5 rounded-xl text-xs font-bold text-zinc-300 transition-all border border-zinc-700/50 active:scale-95">
                  <span>Narrative Mode</span>
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </button>
                <button
                  onClick={sendMessage}
                  className="bg-amber-600 hover:bg-amber-500 text-zinc-950 px-6 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 shadow-lg shadow-amber-600/20 transition-all active:scale-95"
                >
                  <span>SEND</span>
                  <SendHorizontal className="w-4 h-4" />
                </button>
                <button className="p-2.5 bg-zinc-800 text-zinc-400 rounded-full hover:bg-zinc-700 hover:text-white transition-all">
                  <Mic className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MapPanel() {
  const [mapType, setMapType] = useState<'mini' | 'world'>('mini');

  return (
    <div className="w-[420px] bg-[#0d0f12] border-l border-zinc-800/50 flex flex-col shadow-2xl z-20">
      <div className="p-5 border-b border-zinc-800/30">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-500" />
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-200">Cartography</h2>
          </div>
          <button className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-colors">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-zinc-800/50">
          <button
            onClick={() => setMapType('mini')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${mapType === 'mini' ? 'bg-zinc-800 text-amber-500 shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            MINI MAP
          </button>
          <button
            onClick={() => setMapType('world')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${mapType === 'world' ? 'bg-zinc-800 text-amber-500 shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <Layers className="w-3.5 h-3.5" />
            WORLD MAP
          </button>
        </div>
      </div>

      <div className="flex-1 p-5 overflow-hidden flex flex-col space-y-4">
        <div className="flex-1 bg-zinc-950 rounded-2xl border border-zinc-800 relative overflow-hidden flex flex-col group">
          <div className="absolute inset-0 overflow-hidden">
            <Image
              src={mapType === 'mini' ? 'https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?auto=format&fit=crop&q=80&w=600' : 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800'}
              alt="Map Terrain"
              fill
              sizes="420px"
              className={`w-full h-full object-cover transition-all duration-1000 ${mapType === 'world' ? 'scale-110 opacity-30 blur-[1px]' : 'scale-100 opacity-50'}`}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/20 via-transparent to-zinc-950/80" />
          </div>

          <div className={`absolute inset-0 grid ${mapType === 'mini' ? 'grid-cols-6 grid-rows-8' : 'grid-cols-12 grid-rows-16'} pointer-events-none`}>
            {Array.from({ length: mapType === 'mini' ? 48 : 192 }).map((_, i) => (
              <div key={i} className="border-[0.5px] border-white/5 flex items-start justify-start p-0.5">
                {(mapType === 'mini' || i % 10 === 0) && <span className="text-[6px] text-white/10 font-mono">{i}</span>}
              </div>
            ))}
          </div>

          <div className="absolute top-[45%] left-[40%] transition-all duration-500">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500 rounded-full blur-md opacity-50 animate-ping" />
              <div className="relative w-7 h-7 bg-amber-500 rounded-lg border-2 border-zinc-950 shadow-2xl flex items-center justify-center transform rotate-45 group-hover:rotate-0 transition-transform">
                <User className="w-4 h-4 text-zinc-950 -rotate-45 group-hover:rotate-0 transition-transform" />
              </div>
            </div>
          </div>

          <div className="absolute bottom-5 left-5 right-5">
            <div className="bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-2xl">
              <h3 className="text-white font-bold text-sm mb-1 flex items-center gap-2">
                {mapType === 'mini' ? 'Current Location' : 'Global Territory'}
                <span className="text-[10px] bg-amber-500/20 text-amber-500 px-1.5 rounded uppercase">Discovery</span>
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Party Status</span>
            <Users className="w-4 h-4 text-zinc-600" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-xs text-zinc-300 font-medium">Player 1</span>
              </div>
              <span className="text-[10px] font-bold text-zinc-500">Lv. 5 Class</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GameLayout() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('play');
  const [environment, setEnvironment] = useState<SceneEnvironment>('cave');
  const character = useGameStore((state) => state.character);
  const createCharacter = useGameStore((state) => state.createCharacter);

  const config = {
    appName: 'RPG DASHBOARD',
    campaignName: 'Current Adventure',
    chapter: 'Chapter 1: The Beginning',
  };

  const navItems: Array<{ id: ActiveTab; label: string; icon: typeof Play }> = [
    { id: 'play', label: 'Play', icon: Play },
    { id: 'character', label: 'Character Sheet', icon: User },
    { id: 'party', label: 'Party', icon: Users },
    { id: 'quests', label: 'Quest Book', icon: BookOpen },
    { id: 'world', label: 'World Map', icon: Globe },
    { id: 'memories', label: 'Memories', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const environmentOptions: Array<{ id: SceneEnvironment; label: string }> = [
    { id: 'cave', label: 'Cave' },
    { id: 'forest', label: 'Forest' },
    { id: 'ruins', label: 'Ruins' },
    { id: 'swamp', label: 'Swamp' },
  ];

  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-100 overflow-hidden font-sans selection:bg-amber-500/30">
      <aside className="w-[260px] flex flex-col bg-[#0d0f12] border-r border-zinc-800/40 z-30">
        <div className="h-20 flex items-center px-8">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
              <Dices className="w-5 h-5 text-zinc-950" />
            </div>
            <div className="text-sm font-black tracking-[0.2em] text-zinc-200 uppercase">{config.appName}</div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group relative ${
                  active ? 'bg-amber-500/10 text-white border border-amber-500/10' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30'
                }`}
              >
                {active && <div className="absolute left-0 w-1 h-5 bg-amber-500 rounded-r-full" />}
                <Icon className={`w-4 h-4 ${active ? 'text-amber-500' : 'opacity-60 group-hover:opacity-100'}`} />
                <span className={`text-[14px] font-semibold ${active ? 'tracking-wide' : ''}`}>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-6 mt-auto space-y-6">
          <button className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-amber-500/5 border border-amber-500/20 rounded-xl text-amber-500 hover:bg-amber-500 hover:text-zinc-950 transition-all text-xs font-black uppercase tracking-widest shadow-lg shadow-amber-500/5">
            <Plus className="w-4 h-4" />
            Invite Players
          </button>

          <div className="space-y-3 px-2 border-t border-zinc-800/50 pt-6">
            {['Feedback', 'Help Center', 'Updates', 'Discord'].map((link) => (
              <a key={link} href="#" className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest hover:text-zinc-400 transition-colors">
                {link}
              </a>
            ))}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-[#121418]/80 backdrop-blur-xl border-b border-zinc-800/30 px-8 flex items-center justify-between relative z-20">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-amber-500/80 uppercase tracking-[0.3em] mb-0.5">Active Session</span>
              <h1 className="text-lg font-bold text-white tracking-tight">{config.campaignName}</h1>
            </div>

            <div className="hidden md:flex items-center gap-2">
              {environmentOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setEnvironment(option.id)}
                  className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest transition-all ${
                    environment === option.id
                      ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                      : 'border-zinc-800/60 bg-zinc-900/40 text-zinc-500 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-tighter">Session Time • 00:00</span>
            </div>

            <div className="flex items-center gap-2 p-2 bg-zinc-900/50 rounded-xl border border-zinc-800/50 text-zinc-500 hover:text-white cursor-pointer transition-all">
              <Search className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2 p-2 bg-zinc-900/50 rounded-xl border border-zinc-800/50 text-zinc-500 hover:text-white cursor-pointer relative transition-all">
              <Bell className="w-5 h-5" />
              <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#121418]" />
            </div>
            <div className="flex items-center gap-3 pl-4 border-l border-zinc-800/50">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-lg shadow-amber-500/10">
                <div className="w-full h-full rounded-[10px] bg-zinc-950 flex items-center justify-center overflow-hidden">
                    <div className="relative h-full w-full">
                      <Image src="https://api.dicebear.com/7.x/pixel-art/svg?seed=Player" alt="Player" fill sizes="40px" className="object-cover" />
                    </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {character ? (
            <>
              <AdventureMode campaignChapter={config.chapter} environment={environment} />
              <MapPanel />
            </>
          ) : (
            <CharacterCreationWizard
              onComplete={(createdCharacter) => {
                createCharacter(createdCharacter);
                setActiveTab('character');
              }}
            />
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
      ` }} />
    </div>
  );
}
