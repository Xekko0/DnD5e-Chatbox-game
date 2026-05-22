'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Compass, Map as MapIcon, Plus, Trash2, User } from 'lucide-react';
import type { MemoryNote, NPCEntry, QuestEntry, StoryCard } from '@/types';
import { useGameStore } from '@/store/useGameStore';
import NotebookTabs, { type NotebookTabId } from '@/components/Sidebar';

/** Notebook phải — DAC_TA_V1 FR-UI-03 */
export default function NotebookPanel() {
  const [activeTab, setActiveTab] = useState<NotebookTabId>('npc');
  const worldLore = useGameStore((s) => s.worldLore);
  const storyCards = useGameStore((s) => s.storyCards);
  const memories = useGameStore((s) => s.memories);
  const updateWorldLore = useGameStore((s) => s.updateWorldLore);
  const addStoryCard = useGameStore((s) => s.addStoryCard);
  const removeStoryCard = useGameStore((s) => s.removeStoryCard);
  const addMemoryNote = useGameStore((s) => s.addMemoryNote);

  const [cardDraft, setCardDraft] = useState({ name: '', keywords: '', body: '' });

  const addNpc = () => {
    if (!worldLore) return;
    const entry: NPCEntry = {
      id: `npc-${Date.now()}`,
      name: 'NPC mới',
      role: 'Unknown',
      description: '',
      attitude: 'neutral',
    };
    updateWorldLore({ npcs: [...worldLore.npcs, entry] });
  };

  const addQuest = () => {
    if (!worldLore) return;
    const entry: QuestEntry = {
      id: `quest-${Date.now()}`,
      title: 'Nhiệm vụ mới',
      description: '',
      status: 'active',
    };
    updateWorldLore({ questLog: [...worldLore.questLog, entry] });
  };

  const saveStoryCard = () => {
    if (!cardDraft.name.trim()) return;
    const card: StoryCard = {
      id: `card-${Date.now()}`,
      name: cardDraft.name.trim(),
      keywords: cardDraft.keywords.split(',').map((k) => k.trim()).filter(Boolean),
      body: cardDraft.body,
    };
    addStoryCard(card);
    setCardDraft({ name: '', keywords: '', body: '' });
  };

  return (
    <div className="flex h-full w-[340px] shrink-0 flex-col border-l border-zinc-800/50 bg-[#0d0f12]">
      <div className="border-b border-zinc-800/50 px-4 py-3">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-500/80">Sổ tay</p>
        <p className="text-xs text-zinc-500">NPC · Địa điểm · Quest · Cards · Memory</p>
      </div>

      <NotebookTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {activeTab === 'npc' && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={addNpc}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 py-2 text-xs font-bold text-zinc-400 hover:border-amber-500/40 hover:text-amber-400"
            >
              <Plus className="h-4 w-4" /> Thêm NPC
            </button>
            {(worldLore?.npcs ?? []).map((npc) => (
              <div key={npc.id} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
                <input
                  value={npc.name}
                  onChange={(e) =>
                    updateWorldLore({
                      npcs: worldLore!.npcs.map((n) => (n.id === npc.id ? { ...n, name: e.target.value } : n)),
                    })
                  }
                  className="w-full bg-transparent font-semibold text-zinc-100 outline-none"
                />
                <input
                  value={npc.role}
                  onChange={(e) =>
                    updateWorldLore({
                      npcs: worldLore!.npcs.map((n) => (n.id === npc.id ? { ...n, role: e.target.value } : n)),
                    })
                  }
                  className="mt-1 w-full bg-transparent text-xs text-zinc-500 outline-none"
                />
                <textarea
                  value={npc.description}
                  onChange={(e) =>
                    updateWorldLore({
                      npcs: worldLore!.npcs.map((n) => (n.id === npc.id ? { ...n, description: e.target.value } : n)),
                    })
                  }
                  rows={2}
                  className="mt-2 w-full resize-none rounded-lg border border-zinc-800 bg-zinc-950/50 p-2 text-xs text-zinc-400 outline-none"
                  placeholder="Mô tả..."
                />
              </div>
            ))}
            {!worldLore?.npcs.length && <p className="text-center text-xs text-zinc-600 py-8">Chưa có NPC</p>}
          </div>
        )}

        {activeTab === 'location' && (
          <div className="space-y-4">
            <div className="relative h-36 overflow-hidden rounded-xl border border-zinc-800">
              <Image
                src="https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?auto=format&fit=crop&q=80&w=400"
                alt="Location"
                fill
                sizes="340px"
                className="object-cover opacity-40"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <Compass className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-bold text-white">{worldLore?.setting ?? '—'}</span>
              </div>
            </div>
            <p className="text-xs text-zinc-500">
              {worldLore?.currentDate} · {worldLore?.currentTime}
            </p>
            {(worldLore?.locations ?? []).map((loc) => (
              <div key={loc.id} className="rounded-xl border border-zinc-800 p-3 text-sm text-zinc-300">
                <MapIcon className="mb-1 h-4 w-4 text-amber-500" />
                {loc.name}
              </div>
            ))}
            {!worldLore?.locations.length && (
              <p className="text-xs text-zinc-600">Vị trí sẽ cập nhật khi campaign chạy.</p>
            )}
          </div>
        )}

        {activeTab === 'quest' && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={addQuest}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 py-2 text-xs font-bold text-zinc-400 hover:border-amber-500/40"
            >
              <Plus className="h-4 w-4" /> Thêm nhiệm vụ
            </button>
            {(worldLore?.questLog ?? []).map((quest) => (
              <div key={quest.id} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
                <input
                  value={quest.title}
                  onChange={(e) =>
                    updateWorldLore({
                      questLog: worldLore!.questLog.map((q) =>
                        q.id === quest.id ? { ...q, title: e.target.value } : q
                      ),
                    })
                  }
                  className="w-full bg-transparent font-semibold text-zinc-100 outline-none"
                />
                <select
                  value={quest.status}
                  onChange={(e) =>
                    updateWorldLore({
                      questLog: worldLore!.questLog.map((q) =>
                        q.id === quest.id ? { ...q, status: e.target.value as QuestEntry['status'] } : q
                      ),
                    })
                  }
                  className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs text-zinc-400"
                >
                  <option value="active">Đang làm</option>
                  <option value="complete">Hoàn thành</option>
                  <option value="failed">Thất bại</option>
                  <option value="abandoned">Bỏ</option>
                </select>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'story' && (
          <div className="space-y-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 space-y-2">
              <input
                placeholder="Tên card"
                value={cardDraft.name}
                onChange={(e) => setCardDraft((d) => ({ ...d, name: e.target.value }))}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-sm outline-none"
              />
              <input
                placeholder="Từ khóa (cách nhau bởi dấu phẩy)"
                value={cardDraft.keywords}
                onChange={(e) => setCardDraft((d) => ({ ...d, keywords: e.target.value }))}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-xs outline-none"
              />
              <textarea
                placeholder="Nội dung cho AI..."
                value={cardDraft.body}
                onChange={(e) => setCardDraft((d) => ({ ...d, body: e.target.value }))}
                rows={3}
                className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-950 p-2 text-xs outline-none"
              />
              <button
                type="button"
                onClick={saveStoryCard}
                className="w-full rounded-lg bg-amber-600 py-2 text-xs font-bold text-zinc-950"
              >
                Lưu Story Card
              </button>
            </div>
            {storyCards.map((card) => (
              <div key={card.id} className="rounded-xl border border-amber-900/30 bg-amber-950/20 p-3">
                <div className="flex justify-between">
                  <span className="font-semibold text-amber-200">{card.name}</span>
                  <button type="button" onClick={() => removeStoryCard(card.id)} className="text-zinc-600 hover:text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-1 text-[10px] text-zinc-500">{card.keywords.join(' · ')}</p>
                <p className="mt-2 text-xs text-zinc-400">{card.body}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'memory' && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => {
                const note: MemoryNote = {
                  id: `mem-${Date.now()}`,
                  summary: 'Ghi chú thủ công — chỉnh sau',
                  tags: ['manual'],
                };
                addMemoryNote(note);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 py-2 text-xs font-bold text-zinc-400"
            >
              <Plus className="h-4 w-4" /> Thêm ký ức
            </button>
            {memories.map((mem) => (
              <div key={mem.id} className="rounded-xl border border-zinc-800 p-3">
                <textarea
                  value={mem.summary}
                  onChange={(e) =>
                    useGameStore.setState({
                      memories: memories.map((m) =>
                        m.id === mem.id ? { ...m, summary: e.target.value } : m
                      ),
                    })
                  }
                  rows={3}
                  className="w-full resize-none bg-transparent text-xs text-zinc-300 outline-none"
                />
                <p className="mt-1 text-[10px] text-zinc-600">{mem.tags.join(', ')}</p>
              </div>
            ))}
            {!memories.length && <p className="text-xs text-center text-zinc-600 py-6">Tóm tắt tự động mỗi 8–10 lượt (sắp có)</p>}
          </div>
        )}
      </div>
    </div>
  );
}
