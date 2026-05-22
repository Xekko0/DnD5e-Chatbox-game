'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createCampaignPresenter, type CampaignPresenter } from '@xekko/core/client';
import type { ChatMessage } from '@/types';
import AdventureMode, { type NarrativeMessage, type SceneEnvironment } from '@/components/AdventureMode';
type InputMode = 'do' | 'say' | 'story' | 'cmd';
import AdventurePicker from '@/components/AdventurePicker';
import AppHeader from '@/components/AppHeader';
import CharacterCreationWizard from '@/components/CharacterCreationWizard';
import HudBar from '@/components/hud/HudBar';
import NotebookPanel from '@/components/NotebookPanel';
import PlayerSheet from '@/components/sheets/PlayerSheet';
import SettingsPanel from '@/components/SettingsPanel';
import Minimap from '@/components/map/Minimap';
import LocalMap from '@/components/map/LocalMap';
import { useGameStore } from '@/store/useGameStore';
import { useMapStore } from '@/store/useMapStore';
import { GOBLIN_CAVE_ENTRY } from '@/components/map/sampleMaps';

type AppPhase = 'picker' | 'create' | 'play';

function toNarrativeMessages(messages: ChatMessage[]): NarrativeMessage[] {
  return messages.map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
    timestamp: message.timestamp,
  }));
}

/** Shell chính — layout 3 vùng theo DAC_TA_V1 FR-UI-01 */
export default function GameLayout() {
  const [phase, setPhase] = useState<AppPhase>('picker');
  const [environment, setEnvironment] = useState<SceneEnvironment>('cave');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPlayerSheet, setShowPlayerSheet] = useState(false);
  const [hasSave, setHasSave] = useState(false);

  const character = useGameStore((s) => s.character);
  const worldLore = useGameStore((s) => s.worldLore);
  const sessionHistory = useGameStore((s) => s.sessionHistory);
  const campaignTitle = useGameStore((s) => s.campaignTitle);
  const error = useGameStore((s) => s.error);
  const lastSavedAt = useGameStore((s) => s.lastSavedAt);

  const createCharacter = useGameStore((s) => s.createCharacter);
  const addChatMessage = useGameStore((s) => s.addChatMessage);
  const addDiceRoll = useGameStore((s) => s.addDiceRoll);
  const updateCharacter = useGameStore((s) => s.updateCharacter);
  const setError = useGameStore((s) => s.setError);
  const loadFromLocalStorage = useGameStore((s) => s.loadFromLocalStorage);

  // Map store
  const viewMode = useMapStore((s) => s.viewMode);
  const toggleViewMode = useMapStore((s) => s.toggleViewMode);
  const loadMap = useMapStore((s) => s.loadMap);

  const presenterRef = useRef<CampaignPresenter | null>(null);

  useEffect(() => {
    setHasSave(typeof window !== 'undefined' && !!localStorage.getItem('xekkodnd-game-state'));
  }, [lastSavedAt]);

  useEffect(() => {
    if (character && worldLore) {
      presenterRef.current = createCampaignPresenter(character, worldLore, sessionHistory ?? undefined);
    }
  }, [character, worldLore, sessionHistory]);

  useEffect(() => {
    if (phase === 'play' && !character) {
      setPhase('picker');
    }
  }, [phase, character]);

  // Phím M — toggle view mode khi đang ở phase play
  useEffect(() => {
    if (phase !== 'play') return;

    function handleKeyDown(e: KeyboardEvent) {
      // Ignore when typing in input/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return;
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleViewMode();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, toggleViewMode]);

  const handlePlayerTurn = useCallback(
    async (text: string, _mode?: InputMode) => {
      const liveCharacter = useGameStore.getState().character;
      const livePresenter = presenterRef.current;

      if (!livePresenter || !liveCharacter) return;

      setIsProcessing(true);
      setError(null);

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: new Date().toISOString(),
      };

      addChatMessage(userMessage);

      const afterUser = useGameStore.getState().sessionHistory;
      if (!afterUser) {
        setIsProcessing(false);
        return;
      }

      livePresenter.syncSession(afterUser);
      livePresenter.syncCharacter(liveCharacter);

      try {
        const output = await livePresenter.processInput(text);
        if (output.multiOutput.stateUpdates) {
          updateCharacter(output.multiOutput.stateUpdates);
        }
        output.multiOutput.messages?.forEach((message) => addChatMessage(message));
        output.multiOutput.diceRolls?.forEach((roll) => addDiceRoll(roll));
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsProcessing(false);
      }
    },
    [addChatMessage, addDiceRoll, updateCharacter, setError]
  );

  const handleCharacterCreated = useCallback(
    (created: Parameters<typeof createCharacter>[0]) => {
      createCharacter(created);
      // Load the default map for the campaign
      loadMap(GOBLIN_CAVE_ENTRY, created.name ?? 'player', 9, 3);
      setPhase('play');
    },
    [createCharacter, loadMap]
  );

  const chatMessages = sessionHistory ? toNarrativeMessages(sessionHistory.messages) : [];
  const chapter = 'Chương 1 · Khởi đầu';

  // ── Picker phase ────────────────────────────────────────────────────────
  if (phase === 'picker') {
    return (
      <AdventurePicker
        hasSave={hasSave}
        lastSavedAt={lastSavedAt}
        onNewAdventure={() => setPhase('create')}
        onContinue={() => {
          loadFromLocalStorage();
          const loaded = useGameStore.getState().character;
          if (loaded) {
            loadMap(GOBLIN_CAVE_ENTRY, loaded.name ?? 'player', 9, 3);
            setPhase('play');
          }
        }}
      />
    );
  }

  // ── Create phase ─────────────────────────────────────────────────────────
  if (phase === 'create') {
    return (
      <div className="flex h-screen flex-col bg-[#09090b]">
        <div className="border-b border-zinc-800/50 px-6 py-3">
          <button type="button" onClick={() => setPhase('picker')} className="text-xs text-zinc-500 hover:text-zinc-300">
            ← Quay lại
          </button>
        </div>
        <CharacterCreationWizard onComplete={handleCharacterCreated} />
      </div>
    );
  }

  // ── Play phase ───────────────────────────────────────────────────────────

  const chatPanel = (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <AdventureMode
        campaignChapter={chapter}
        environment={environment}
        messages={chatMessages}
        isProcessing={isProcessing}
        error={error}
        onSend={handlePlayerTurn}
        onRollDice={() => handlePlayerTurn('roll d20')}
      />
      {/* Minimap overlay — bottom-left corner, only in 'chat' view mode */}
      {viewMode === 'chat' && (
        <div className="absolute bottom-20 left-3 z-10">
          <Minimap />
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#09090b] text-zinc-100">
      <AppHeader
        campaignTitle={campaignTitle}
        chapter={chapter}
        environment={environment}
        onEnvironmentChange={setEnvironment}
        onOpenSettings={() => setShowSettings(true)}
      />

      <HudBar onOpenSheet={() => setShowPlayerSheet(true)} />

      {/* Main content area — layout changes with viewMode */}
      {viewMode === 'chat' && (
        <div className="flex min-h-0 flex-1">
          {chatPanel}
          <NotebookPanel />
        </div>
      )}

      {viewMode === 'map' && (
        <div className="flex min-h-0 flex-1">
          <LocalMap />
        </div>
      )}

      {viewMode === 'split' && (
        <div className="flex min-h-0 flex-1">
          {/* Map — 55% width */}
          <div className="flex min-h-0 flex-col" style={{ flex: '0 0 55%' }}>
            <LocalMap compact />
          </div>
          {/* Chat — remaining 45% */}
          <div className="flex min-h-0 flex-1 flex-col border-l border-zinc-800">
            {chatPanel}
          </div>
        </div>
      )}

      <PlayerSheet open={showPlayerSheet} onClose={() => setShowPlayerSheet(false)} />
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
      `,
        }}
      />
    </div>
  );
}
