'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createCampaignPresenter, type CampaignPresenter } from '@xekko/core/client';
import type { ChatMessage } from '@/types';
import AdventureMode, { type NarrativeMessage, type SceneEnvironment } from '@/components/AdventureMode';
import AdventurePicker from '@/components/AdventurePicker';
import AppHeader from '@/components/AppHeader';
import CharacterCreationWizard from '@/components/CharacterCreationWizard';
import CharacterSheet from '@/components/CharacterSheet';
import NotebookPanel from '@/components/NotebookPanel';
import SettingsPanel from '@/components/SettingsPanel';
import { useGameStore } from '@/store/useGameStore';

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

  const handlePlayerTurn = useCallback(
    async (text: string) => {
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

  const chatMessages = sessionHistory ? toNarrativeMessages(sessionHistory.messages) : [];
  const chapter = 'Chương 1 · Khởi đầu';

  if (phase === 'picker') {
    return (
      <AdventurePicker
        hasSave={hasSave}
        lastSavedAt={lastSavedAt}
        onNewAdventure={() => setPhase('create')}
        onContinue={() => {
          loadFromLocalStorage();
          const loaded = useGameStore.getState().character;
          if (loaded) setPhase('play');
        }}
      />
    );
  }

  if (phase === 'create') {
    return (
      <div className="flex h-screen flex-col bg-[#09090b]">
        <div className="border-b border-zinc-800/50 px-6 py-3">
          <button type="button" onClick={() => setPhase('picker')} className="text-xs text-zinc-500 hover:text-zinc-300">
            ← Quay lại
          </button>
        </div>
        <CharacterCreationWizard
          onComplete={(created) => {
            createCharacter(created);
            setPhase('play');
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#09090b] text-zinc-100">
      <AppHeader
        campaignTitle={campaignTitle}
        chapter={chapter}
        environment={environment}
        onEnvironmentChange={setEnvironment}
        onOpenSettings={() => setShowSettings(true)}
        characterName={character?.name}
      />

      <div className="flex min-h-0 flex-1">
        <CharacterSheet compact />
        <AdventureMode
          campaignChapter={chapter}
          environment={environment}
          messages={chatMessages}
          isProcessing={isProcessing}
          error={error}
          onSend={handlePlayerTurn}
          onRollDice={() => handlePlayerTurn('roll d20')}
        />
        <NotebookPanel />
      </div>

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
