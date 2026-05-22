/**
 * Layered Memory Manager (0.3)
 * Manages 4 distinct memory layers: WorldLore, CharacterState, SessionHistory, GameSnapshot
 * Supports JSON and SQLite persistence
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { z } from 'zod';

// Re-export types from apps/web for convenience
export type {
  WorldLore,
  CharacterState,
  SessionHistory,
  GameSnapshot,
  LayeredMemory,
} from './types';

import type {
  WorldLore,
  CharacterState,
  SessionHistory,
  GameSnapshot,
  LayeredMemory,
} from './types';

/**
 * Validation schemas for each layer
 */
const WorldLoreSchema = z.object({
  campaignName: z.string(),
  setting: z.string(),
  currentDate: z.string(),
  currentTime: z.string(),
  locations: z.array(z.any()),
  npcs: z.array(z.any()),
  factions: z.array(z.any()),
  questLog: z.array(z.any()),
  loreNotes: z.string(),
});

const SessionHistorySchema = z.object({
  sessionId: z.string(),
  campaignId: z.string(),
  startedAt: z.string(),
  endedAt: z.string().optional(),
  messages: z.array(z.any()),
  diceRolls: z.array(z.any()),
  characterActions: z.array(z.any()),
});

/**
 * LayeredMemoryManager
 * Central store for all 4 memory layers with save/load capabilities
 */
export class LayeredMemoryManager {
  private memory: LayeredMemory;
  private persistencePath: string;
  private autosaveIntervalMs: number = 30000; // 30 seconds
  private autosaveTimer?: NodeJS.Timer;

  constructor(
    memory: LayeredMemory,
    persistencePath: string = './xekkodnd-saves',
    autosaveIntervalMs: number = 30000
  ) {
    this.memory = memory;
    this.persistencePath = persistencePath;
    this.autosaveIntervalMs = autosaveIntervalMs;
  }

  /**
   * Initialize persistence directory
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.persistencePath, { recursive: true });
      console.log(`[LayeredMemory] Initialized persistence at ${this.persistencePath}`);
    } catch (error) {
      console.error(`[LayeredMemory] Failed to initialize persistence:`, error);
    }
  }

  /**
   * Start autosave background task
   */
  startAutosave(): void {
    if (this.autosaveTimer) {
      clearInterval(this.autosaveTimer);
    }
    this.autosaveTimer = setInterval(async () => {
      try {
        await this.saveToJSON('autosave');
      } catch (error) {
        console.error(`[LayeredMemory] Autosave failed:`, error);
      }
    }, this.autosaveIntervalMs);
    console.log(`[LayeredMemory] Autosave started (interval: ${this.autosaveIntervalMs}ms)`);
  }

  /**
   * Stop autosave
   */
  stopAutosave(): void {
    if (this.autosaveTimer) {
      clearInterval(this.autosaveTimer);
      this.autosaveTimer = undefined;
      console.log(`[LayeredMemory] Autosave stopped`);
    }
  }

  /**
   * Get a specific layer
   */
  getLayer(layerName: 'worldLore' | 'characterState' | 'sessionHistory' | 'gameSnapshot'): any {
    const layers = {
      worldLore: this.memory.worldLoreLayer,
      characterState: this.memory.characterStateLayer,
      sessionHistory: this.memory.sessionHistoryLayer,
      gameSnapshot: this.memory.gameSnapshotLayer,
    };
    return layers[layerName];
  }

  /**
   * Update a specific layer (with validation)
   */
  async updateLayer(
    layerName: 'worldLore' | 'characterState' | 'sessionHistory',
    updates: Partial<any>
  ): Promise<void> {
    try {
      if (layerName === 'worldLore') {
        const validated = WorldLoreSchema.partial().parse(updates);
        this.memory.worldLoreLayer = { ...this.memory.worldLoreLayer, ...validated };
      } else if (layerName === 'characterState') {
        this.memory.characterStateLayer = { ...this.memory.characterStateLayer, ...updates };
      } else if (layerName === 'sessionHistory') {
        const validated = SessionHistorySchema.partial().parse(updates);
        this.memory.sessionHistoryLayer = { ...this.memory.sessionHistoryLayer, ...validated };
      }
    } catch (error) {
      console.error(`[LayeredMemory] Validation failed for layer ${layerName}:`, error);
      throw error;
    }
  }

  /**
   * Create a snapshot and add to gameSnapshotLayer
   */
  createSnapshot(notes?: string): void {
    const snapshot: GameSnapshot = {
      snapshotId: `snapshot-${Date.now()}`,
      campaignId: this.memory.characterStateLayer.id,
      timestamp: new Date().toISOString(),
      character: JSON.parse(JSON.stringify(this.memory.characterStateLayer)),
      worldLore: JSON.parse(JSON.stringify(this.memory.worldLoreLayer)),
      sessionHistory: JSON.parse(JSON.stringify(this.memory.sessionHistoryLayer)),
      notes,
    };
    this.memory.gameSnapshotLayer.push(snapshot);
    console.log(`[LayeredMemory] Snapshot created: ${snapshot.snapshotId}`);
  }

  /**
   * Save all layers to JSON file
   */
  async saveToJSON(filename: string = 'game-state'): Promise<string> {
    const filepath = path.join(this.persistencePath, `${filename}.json`);
    try {
      await fs.writeFile(filepath, JSON.stringify(this.memory, null, 2), 'utf-8');
      console.log(`[LayeredMemory] Saved to JSON: ${filepath}`);
      return filepath;
    } catch (error) {
      console.error(`[LayeredMemory] Failed to save JSON:`, error);
      throw error;
    }
  }

  /**
   * Load all layers from JSON file
   */
  async loadFromJSON(filepath: string): Promise<LayeredMemory> {
    try {
      const content = await fs.readFile(filepath, 'utf-8');
      const loaded = JSON.parse(content) as LayeredMemory;
      this.memory = loaded;
      console.log(`[LayeredMemory] Loaded from JSON: ${filepath}`);
      return this.memory;
    } catch (error) {
      console.error(`[LayeredMemory] Failed to load JSON:`, error);
      throw error;
    }
  }

  /**
   * Export a single layer as JSON
   */
  async exportLayer(
    layerName: 'worldLore' | 'characterState' | 'sessionHistory' | 'gameSnapshot',
    filename: string
  ): Promise<string> {
    const layer = this.getLayer(layerName);
    const filepath = path.join(this.persistencePath, `${filename}.json`);
    try {
      await fs.writeFile(filepath, JSON.stringify(layer, null, 2), 'utf-8');
      console.log(`[LayeredMemory] Exported layer ${layerName} to: ${filepath}`);
      return filepath;
    } catch (error) {
      console.error(`[LayeredMemory] Failed to export layer:`, error);
      throw error;
    }
  }

  /**
   * List all saved files in persistence directory
   */
  async listSaves(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.persistencePath);
      return files.filter((f) => f.endsWith('.json'));
    } catch (error) {
      console.error(`[LayeredMemory] Failed to list saves:`, error);
      return [];
    }
  }

  /**
   * Delete a save file
   */
  async deleteSave(filename: string): Promise<void> {
    const filepath = path.join(this.persistencePath, `${filename}.json`);
    try {
      await fs.unlink(filepath);
      console.log(`[LayeredMemory] Deleted save: ${filename}`);
    } catch (error) {
      console.error(`[LayeredMemory] Failed to delete save:`, error);
      throw error;
    }
  }

  /**
   * Restore from snapshot (roll back to a specific point)
   */
  restoreFromSnapshot(snapshotId: string): void {
    const snapshot = this.memory.gameSnapshotLayer.find((s) => s.snapshotId === snapshotId);
    if (!snapshot) {
      throw new Error(`Snapshot not found: ${snapshotId}`);
    }
    this.memory.characterStateLayer = JSON.parse(JSON.stringify(snapshot.character));
    this.memory.worldLoreLayer = JSON.parse(JSON.stringify(snapshot.worldLore));
    this.memory.sessionHistoryLayer = JSON.parse(JSON.stringify(snapshot.sessionHistory));
    console.log(`[LayeredMemory] Restored from snapshot: ${snapshotId}`);
  }

  /**
   * Get full memory object
   */
  getFullMemory(): LayeredMemory {
    return this.memory;
  }

  /**
   * Destroy and cleanup
   */
  destroy(): void {
    this.stopAutosave();
    console.log(`[LayeredMemory] Manager destroyed`);
  }
}

/**
 * Factory function to create default LayeredMemory
 */
export function createDefaultLayeredMemory(characterName: string = 'Adventurer'): LayeredMemory {
  return {
    worldLoreLayer: {
      campaignName: 'New Campaign',
      setting: 'Forgotten Realms',
      currentDate: new Date().toISOString().split('T')[0],
      currentTime: '09:00',
      locations: [],
      npcs: [],
      factions: [],
      questLog: [],
      loreNotes: '',
    },
    characterStateLayer: {
      id: `char-${Date.now()}`,
      name: characterName,
      race: 'Human',
      class: 'Fighter',
      background: 'Adventurer',
      alignment: 'Neutral Good',
      level: 1,
      experience: 0,
      hitPoints: 10,
      maxHitPoints: 10,
      temporaryHitPoints: 0,
      armorClass: 10,
      speed: 30,
      proficiencyBonus: 2,
      inspiration: 0,
      abilityScores: {
        STR: 10,
        DEX: 10,
        CON: 10,
        INT: 10,
        WIS: 10,
        CHA: 10,
      },
      savingThrows: {},
      skillProficiencies: {},
      skillExpertise: {},
      inventory: [],
      equipment: {},
      conditions: [],
      deathSaveSuccesses: 0,
      deathSaveFailures: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    sessionHistoryLayer: {
      sessionId: `session-${Date.now()}`,
      campaignId: `campaign-${Date.now()}`,
      startedAt: new Date().toISOString(),
      messages: [],
      diceRolls: [],
      characterActions: [],
    },
    gameSnapshotLayer: [],
  };
}
