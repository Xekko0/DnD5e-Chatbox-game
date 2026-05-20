/**
 * Loader for D&D 5e SRD data
 * Dynamically imports JSON reference files
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export interface SRDData {
  races: Record<string, any>;
  classes: Record<string, any>;
  spells: Record<string, any>;
  monsters: Record<string, any>;
  items: Record<string, any>;
}

let cachedSRD: SRDData | null = null;

/**
 * Load SRD data from JSON file
 */
export async function loadSRDData(): Promise<SRDData> {
  if (cachedSRD) {
    return cachedSRD;
  }

  const dataPath = path.join(__dirname, 'srd', '5e-core.json');
  try {
    const content = await fs.readFile(dataPath, 'utf-8');
    const parsed = JSON.parse(content);

    // Convert arrays to maps for O(1) lookup
    cachedSRD = {
      races: Object.fromEntries(parsed.races.map((r: any) => [r.id, r])),
      classes: Object.fromEntries(parsed.classes.map((c: any) => [c.id, c])),
      spells: Object.fromEntries(parsed.spells.map((s: any) => [s.id, s])),
      monsters: Object.fromEntries(parsed.monsters.map((m: any) => [m.id, m])),
      items: Object.fromEntries(parsed.items.map((i: any) => [i.id, i])),
    };

    console.log('[SRD] Loaded D&D 5e reference data');
    return cachedSRD;
  } catch (error) {
    console.error('[SRD] Failed to load SRD data:', error);
    throw error;
  }
}

/**
 * Get a specific race by ID
 */
export async function getRace(raceId: string): Promise<any> {
  const srd = await loadSRDData();
  return srd.races[raceId.toLowerCase()];
}

/**
 * Get a specific class by ID
 */
export async function getClass(classId: string): Promise<any> {
  const srd = await loadSRDData();
  return srd.classes[classId.toLowerCase()];
}

/**
 * Get a specific spell by ID
 */
export async function getSpell(spellId: string): Promise<any> {
  const srd = await loadSRDData();
  return srd.spells[spellId.toLowerCase()];
}

/**
 * Get a specific monster by ID
 */
export async function getMonster(monsterId: string): Promise<any> {
  const srd = await loadSRDData();
  return srd.monsters[monsterId.toLowerCase()];
}

/**
 * Get a specific item by ID
 */
export async function getItem(itemId: string): Promise<any> {
  const srd = await loadSRDData();
  return srd.items[itemId.toLowerCase()];
}

/**
 * List all races
 */
export async function listRaces(): Promise<string[]> {
  const srd = await loadSRDData();
  return Object.keys(srd.races);
}

/**
 * List all classes
 */
export async function listClasses(): Promise<string[]> {
  const srd = await loadSRDData();
  return Object.keys(srd.classes);
}

/**
 * List all spells
 */
export async function listSpells(): Promise<string[]> {
  const srd = await loadSRDData();
  return Object.keys(srd.spells);
}
