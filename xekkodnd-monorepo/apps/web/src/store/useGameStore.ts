/**
 * Game Store (0.6) - Zustand + Undo/Redo + UI State
 * Central state management connected to LayeredMemory with auto-save every 30s
 */

import { create } from 'zustand';
import type {
  GameStoreState,
  GameStoreActions,
  CharacterState,
  WorldLore,
  SessionHistory,
  ChatMessage,
  DiceRoll,
  StoryCard,
  MemoryNote,
} from '@/types';

function createDefaultWorldLore(): WorldLore {
  return {
    campaignName: 'Current Adventure',
    setting: 'Fantasy',
    currentDate: 'Day 1',
    currentTime: 'Morning',
    locations: [],
    npcs: [],
    factions: [],
    questLog: [],
    loreNotes: '',
  };
}

function createDefaultSessionHistory(): SessionHistory {
  const now = new Date().toISOString();
  return {
    sessionId: `session-${Date.now()}`,
    campaignId: 'default',
    startedAt: now,
    messages: [
      {
        id: `msg-welcome-${Date.now()}`,
        role: 'assistant',
        content:
          'Chào chiến binh! Ta là Dungeon Master. Hãy mô tả hành động của ngươi — ta sẽ kể tiếp câu chuyện bằng tiếng Việt.',
        timestamp: now,
      },
    ],
    diceRolls: [],
    characterActions: [],
  };
}

interface GameStoreInternal extends GameStoreState, GameStoreActions {
  // Undo/Redo history
  history: Array<{
    character: CharacterState | null;
    worldLore: WorldLore | null;
    sessionHistory: SessionHistory | null;
  }>;
  historyIndex: number;
  
  // UI State
  isInCombat: boolean;
  
  // Internal actions
  pushHistory(): void;
  saveToLocalStorage(): void;
  loadFromLocalStorage(): void;
  setIsInCombat(inCombat: boolean): void;
  addMessage(text: string): void;
}

export const useGameStore = create<GameStoreInternal>((set, get) => {
  // Start autosave on store creation
  const startAutosave = () => {
    setInterval(() => {
      get().saveToLocalStorage();
    }, 30000); // 30 seconds
  };

  startAutosave();

  return {
    // State
    character: null,
    worldLore: null,
    sessionHistory: null,
    storyCards: [],
    memories: [],
    campaignTitle: 'Cuộc phiêu lưu mới',
    isLoading: false,
    error: null,
    lastSavedAt: null,
    history: [],
    historyIndex: -1,
    isInCombat: false,

    // Internal: Save to localStorage
    saveToLocalStorage: () => {
      try {
        const { character, worldLore, sessionHistory, storyCards, memories, campaignTitle } = get();
        const state = { character, worldLore, sessionHistory, storyCards, memories, campaignTitle };
        localStorage.setItem('xekkodnd-game-state', JSON.stringify(state));
        set({ lastSavedAt: new Date().toISOString() });
        console.log('[GameStore] Saved to localStorage');
      } catch (error) {
        console.error('[GameStore] Failed to save to localStorage:', error);
      }
    },

    // Internal: Load from localStorage
    loadFromLocalStorage: () => {
      try {
        const stored = localStorage.getItem('xekkodnd-game-state');
        if (stored) {
          const state = JSON.parse(stored);
          set({ ...state, lastSavedAt: new Date().toISOString() });
          console.log('[GameStore] Loaded from localStorage');
        }
      } catch (error) {
        console.error('[GameStore] Failed to load from localStorage:', error);
      }
    },

    // Internal: Push current state to history
    pushHistory: () => {
      const { character, worldLore, sessionHistory, history, historyIndex } = get();
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push({ character, worldLore, sessionHistory });
      set({ history: newHistory, historyIndex: newHistory.length - 1 });
    },

    // Set combat state
    setIsInCombat: (inCombat: boolean) => {
      set({ isInCombat: inCombat });
    },

    // Load game from campaign
    loadGame: async (campaignId: string) => {
      set({ isLoading: true, error: null });
      try {
        // Simulate API call to load game
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        // Example: Create default character
        const defaultCharacter: CharacterState = {
          id: campaignId,
          name: 'Aragorn',
          race: 'Human',
          class: 'Fighter',
          background: 'Adventurer',
          alignment: 'Neutral Good',
          level: 3,
          experience: 0,
          hitPoints: 35,
          maxHitPoints: 35,
          temporaryHitPoints: 0,
          armorClass: 19,
          speed: 30,
          proficiencyBonus: 2,
          inspiration: 0,
          abilityScores: {
            STR: 18,
            DEX: 14,
            CON: 15,
            INT: 10,
            WIS: 12,
            CHA: 11,
          },
          savingThrows: {},
          skillProficiencies: {},
          skillExpertise: {},
          inventory: [],
          equipment: {
            body: 'Plate Armor',
            mainHand: 'Longsword',
            feet: 'Boots',
          },
          conditions: [],
          deathSaveSuccesses: 0,
          deathSaveFailures: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set({
          character: defaultCharacter,
          isLoading: false,
          lastSavedAt: new Date().toISOString(),
        });

        get().pushHistory();
      } catch (error) {
        set({ error: String(error), isLoading: false });
      }
    },

    // Save game to LayeredMemory / backend
    saveGame: async () => {
      set({ isLoading: true, error: null });
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 300));
        
        get().saveToLocalStorage();
        set({ isLoading: false, lastSavedAt: new Date().toISOString() });
        console.log('[GameStore] Game saved successfully');
      } catch (error) {
        set({ error: String(error), isLoading: false });
      }
    },

    // Create character from wizard
    createCharacter: (character: CharacterState) => {
      const normalizedCharacter: CharacterState = {
        ...character,
        updatedAt: new Date().toISOString(),
      };

      set({
        character: normalizedCharacter,
        worldLore: createDefaultWorldLore(),
        sessionHistory: createDefaultSessionHistory(),
        storyCards: [],
        memories: [],
        campaignTitle: `${normalizedCharacter.name} — ${createDefaultWorldLore().campaignName}`,
        lastSavedAt: new Date().toISOString(),
        error: null,
      });

      get().pushHistory();
      get().saveToLocalStorage();
    },

    // Update character state
    updateCharacter: (updates: Partial<CharacterState>) => {
      set((state) => ({
        character: state.character ? { ...state.character, ...updates, updatedAt: new Date().toISOString() } : null,
      }));
      get().pushHistory();
      get().saveToLocalStorage();
    },

    updateWorldLore: (updates: Partial<WorldLore>) => {
      set((state) => ({
        worldLore: state.worldLore ? { ...state.worldLore, ...updates } : null,
      }));
      get().pushHistory();
      get().saveToLocalStorage();
    },

    addStoryCard: (card: StoryCard) => {
      set((state) => ({ storyCards: [...state.storyCards, card] }));
      get().saveToLocalStorage();
    },

    removeStoryCard: (id: string) => {
      set((state) => ({ storyCards: state.storyCards.filter((card) => card.id !== id) }));
      get().saveToLocalStorage();
    },

    addMemoryNote: (note: MemoryNote) => {
      set((state) => ({ memories: [...state.memories, note] }));
      get().saveToLocalStorage();
    },

    setCampaignTitle: (title: string) => {
      set({ campaignTitle: title });
      get().saveToLocalStorage();
    },

    resetAdventure: () => {
      set({
        character: null,
        worldLore: null,
        sessionHistory: null,
        storyCards: [],
        memories: [],
        campaignTitle: 'Cuộc phiêu lưu mới',
        error: null,
      });
      localStorage.removeItem('xekkodnd-game-state');
    },

    // Add chat message
    addChatMessage: (message: ChatMessage) => {
      set((state) => ({
        sessionHistory: state.sessionHistory
          ? {
              ...state.sessionHistory,
              messages: [...state.sessionHistory.messages, message],
            }
          : null,
      }));
      get().pushHistory();
    },

    // Add dice roll
    addDiceRoll: (roll: DiceRoll) => {
      set((state) => ({
        sessionHistory: state.sessionHistory
          ? {
              ...state.sessionHistory,
              diceRolls: [...state.sessionHistory.diceRolls, roll],
            }
          : null,
      }));
      get().pushHistory();
    },

    // Alias for addChatMessage
    addMessage: (text: string) => {
      const message: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: new Date().toISOString(),
      };
      get().addChatMessage(message);
    },

    // Undo
    undo: () => {
      const { history, historyIndex } = get();
      if (historyIndex > 0) {
        const prevState = history[historyIndex - 1];
        set({
          ...prevState,
          historyIndex: historyIndex - 1,
        });
      }
    },

    // Redo
    redo: () => {
      const { history, historyIndex } = get();
      if (historyIndex < history.length - 1) {
        const nextState = history[historyIndex + 1];
        set({
          ...nextState,
          historyIndex: historyIndex + 1,
        });
      }
    },

    // Set error
    setError: (error: string | null) => {
      set({ error });
    },
  };
});

// Export helper to stop autosave (for cleanup)
export function cleanupGameStore() {
  const storeWithDestroy = useGameStore as typeof useGameStore & { destroy?: () => void };
  storeWithDestroy.destroy?.();
}

// Export hooks for convenience
export const useCharacter = () => useGameStore((state) => state.character);
export const useWorldLore = () => useGameStore((state) => state.worldLore);
export const useSessionHistory = () => useGameStore((state) => state.sessionHistory);
export const useGameStoreActions = () =>
  useGameStore((state) => ({
    loadGame: state.loadGame,
    saveGame: state.saveGame,
    createCharacter: state.createCharacter,
    updateCharacter: state.updateCharacter,
    updateWorldLore: state.updateWorldLore,
    addStoryCard: state.addStoryCard,
    removeStoryCard: state.removeStoryCard,
    addMemoryNote: state.addMemoryNote,
    setCampaignTitle: state.setCampaignTitle,
    resetAdventure: state.resetAdventure,
    loadFromLocalStorage: state.loadFromLocalStorage,
    addChatMessage: state.addChatMessage,
    addDiceRoll: state.addDiceRoll,
    addMessage: state.addMessage,
    undo: state.undo,
    redo: state.redo,
    setError: state.setError,
  }));
