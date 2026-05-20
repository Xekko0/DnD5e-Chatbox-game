'use client';

import { useState } from 'react';
import type { AbilityScore, CharacterState, Equipment } from '@/types';
import { ArrowLeft, ArrowRight, CheckCircle2, Dice6, Flame, Shield, Sword, UserCircle2, Wand2 } from 'lucide-react';

type WizardStep = 0 | 1 | 2 | 3;

type WizardProps = {
  onComplete: (character: CharacterState) => void;
};

const ABILITY_ORDER: AbilityScore[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
const RACES = ['Human', 'Elf', 'Dwarf', 'Halfling', 'Tiefling'] as const;
const CLASSES = ['Fighter', 'Wizard', 'Rogue', 'Cleric', 'Ranger', 'Barbarian', 'Paladin'] as const;
const BACKGROUNDS = ['Adventurer', 'Sage', 'Soldier', 'Acolyte', 'Criminal', 'Noble'] as const;
const ALIGNMENTS = ['Lawful Good', 'Neutral Good', 'Chaotic Good', 'Lawful Neutral', 'True Neutral', 'Chaotic Neutral'] as const;
const ARMOR_OPTIONS = ['Leather Armor', 'Chain Shirt', 'Scale Mail', 'Plate Armor'] as const;
const MAIN_HAND_OPTIONS = ['Longsword', 'Shortsword', 'Quarterstaff', 'Bow', 'Dagger', 'Warhammer'] as const;
const FEET_OPTIONS = ['Boots', 'Traveler Boots', 'Mage Slippers', 'Heavy Greaves'] as const;

const STAT_INFO: Record<AbilityScore, { label: string; description: string }> = {
  STR: { label: 'Strength', description: 'Power, athletics, melee' },
  DEX: { label: 'Dexterity', description: 'Agility, stealth, reflex' },
  CON: { label: 'Constitution', description: 'Endurance, HP, resilience' },
  INT: { label: 'Intelligence', description: 'Knowledge, logic, arcana' },
  WIS: { label: 'Wisdom', description: 'Perception, insight, survival' },
  CHA: { label: 'Charisma', description: 'Presence, persuasion, force' },
};

const BASE_STATS: Record<AbilityScore, number> = {
  STR: 8,
  DEX: 8,
  CON: 8,
  INT: 8,
  WIS: 8,
  CHA: 8,
};

function scoreCost(score: number): number {
  if (score <= 8) return 0;
  if (score === 9) return 1;
  if (score === 10) return 2;
  if (score === 11) return 3;
  if (score === 12) return 4;
  if (score === 13) return 5;
  if (score === 14) return 7;
  return 9;
}

function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

function getClassHitPoints(characterClass: string): number {
  switch (characterClass) {
    case 'Barbarian':
      return 14;
    case 'Fighter':
    case 'Paladin':
      return 12;
    case 'Cleric':
    case 'Ranger':
    case 'Rogue':
      return 10;
    case 'Wizard':
    default:
      return 8;
  }
}

function getClassStartingEquipment(characterClass: string): Equipment {
  switch (characterClass) {
    case 'Wizard':
      return { body: 'Traveler Robe', mainHand: 'Quarterstaff', feet: 'Mage Slippers' };
    case 'Rogue':
      return { body: 'Leather Armor', mainHand: 'Shortsword', feet: 'Traveler Boots' };
    case 'Cleric':
      return { body: 'Scale Mail', mainHand: 'Mace', feet: 'Traveler Boots' };
    case 'Ranger':
      return { body: 'Leather Armor', mainHand: 'Bow', feet: 'Traveler Boots' };
    case 'Barbarian':
      return { body: 'Hide Armor', mainHand: 'Greataxe', feet: 'Heavy Greaves' };
    case 'Paladin':
      return { body: 'Chain Shirt', mainHand: 'Longsword', feet: 'Heavy Greaves' };
    case 'Fighter':
    default:
      return { body: 'Plate Armor', mainHand: 'Longsword', feet: 'Boots' };
  }
}

function getArmorClass(equipment: Equipment, dexterity: number): number {
  if (equipment.body === 'Plate Armor') return 18;
  if (equipment.body === 'Scale Mail') return 16;
  if (equipment.body === 'Chain Shirt') return 15;
  if (equipment.body === 'Leather Armor') return 11 + abilityModifier(dexterity);
  if (equipment.body === 'Traveler Robe') return 10 + abilityModifier(dexterity);
  return 10 + Math.max(0, abilityModifier(dexterity));
}

export default function CharacterCreationWizard({ onComplete }: WizardProps) {
  const [step, setStep] = useState<WizardStep>(0);
  const [name, setName] = useState('Alyra');
  const [race, setRace] = useState<(typeof RACES)[number]>('Human');
  const [characterClass, setCharacterClass] = useState<(typeof CLASSES)[number]>('Fighter');
  const [background, setBackground] = useState<(typeof BACKGROUNDS)[number]>('Adventurer');
  const [alignment, setAlignment] = useState<(typeof ALIGNMENTS)[number]>('Neutral Good');
  const [stats, setStats] = useState<Record<AbilityScore, number>>({ ...BASE_STATS, STR: 15, DEX: 14, CON: 13, INT: 10, WIS: 10, CHA: 8 });
  const [body, setBody] = useState<(typeof ARMOR_OPTIONS)[number]>('Leather Armor');
  const [mainHand, setMainHand] = useState<(typeof MAIN_HAND_OPTIONS)[number]>('Longsword');
  const [feet, setFeet] = useState<(typeof FEET_OPTIONS)[number]>('Boots');

  const applyClassPreset = (nextClass: (typeof CLASSES)[number]) => {
    setCharacterClass(nextClass);

    const preset = getClassStartingEquipment(nextClass);
    if (preset.body && ARMOR_OPTIONS.includes(preset.body as (typeof ARMOR_OPTIONS)[number])) {
      setBody(preset.body as (typeof ARMOR_OPTIONS)[number]);
    }
    if (preset.mainHand && MAIN_HAND_OPTIONS.includes(preset.mainHand as (typeof MAIN_HAND_OPTIONS)[number])) {
      setMainHand(preset.mainHand as (typeof MAIN_HAND_OPTIONS)[number]);
    }
    if (preset.feet && FEET_OPTIONS.includes(preset.feet as (typeof FEET_OPTIONS)[number])) {
      setFeet(preset.feet as (typeof FEET_OPTIONS)[number]);
    }
  };

  const totalSpent = ABILITY_ORDER.reduce((sum, ability) => sum + scoreCost(stats[ability]), 0);
  const remainingPoints = 27 - totalSpent;
  const equipment: Equipment = { body, mainHand, feet };
  const maxHitPoints = getClassHitPoints(characterClass) + abilityModifier(stats.CON);
  const armorClass = getArmorClass(equipment, stats.DEX);

  const incrementStat = (ability: AbilityScore) => {
    setStats((current) => {
      const nextScore = Math.min(current[ability] + 1, 15);
      const nextSpent = totalSpent - scoreCost(current[ability]) + scoreCost(nextScore);
      if (nextSpent > 27) return current;
      return { ...current, [ability]: nextScore };
    });
  };

  const decrementStat = (ability: AbilityScore) => {
    setStats((current) => ({ ...current, [ability]: Math.max(current[ability] - 1, 8) }));
  };

  const completeWizard = () => {
    const now = new Date().toISOString();
    const createdCharacter: CharacterState = {
      id: `char-${Date.now()}`,
      name: name.trim() || 'Unnamed Hero',
      race,
      class: characterClass,
      background,
      alignment,
      level: 1,
      experience: 0,
      hitPoints: maxHitPoints,
      maxHitPoints,
      temporaryHitPoints: 0,
      armorClass,
      speed: 30,
      proficiencyBonus: 2,
      inspiration: 0,
      abilityScores: stats,
      savingThrows: {},
      skillProficiencies: {},
      skillExpertise: {},
      inventory: [
        { id: 'item-1', name: 'Adventuring Pack', quantity: 1 },
        { id: 'item-2', name: 'Rations', quantity: 5 },
      ],
      equipment,
      conditions: [],
      deathSaveSuccesses: 0,
      deathSaveFailures: 0,
      createdAt: now,
      updatedAt: now,
    };

    onComplete(createdCharacter);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#121418] px-6 py-8 md:px-10 custom-scrollbar">
      <div className="mx-auto max-w-6xl rounded-[28px] border border-zinc-800/70 bg-[#151922] shadow-[0_30px_80px_rgba(0,0,0,0.45)] overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="p-8 md:p-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3 text-amber-400">
                <UserCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400/80">Phase 1.1</p>
                <h2 className="text-2xl font-bold text-white">Character Creation Wizard</h2>
              </div>
            </div>

            <div className="mb-8 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
              {['Identity', 'Class', 'Stats', 'Equipment'].map((label, index) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setStep(index as WizardStep)}
                  className={`rounded-full border px-3 py-1 transition-all ${step === index ? 'border-amber-500/40 bg-amber-500/10 text-amber-400' : 'border-zinc-800 bg-zinc-950/50 hover:text-zinc-300'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {step === 0 && (
              <div className="grid gap-6 md:grid-cols-2">
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-zinc-300">Character Name</span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-zinc-100 outline-none focus:border-amber-500/50"
                    placeholder="Enter hero name"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-zinc-300">Race</span>
                  <div className="grid grid-cols-2 gap-2">
                    {RACES.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setRace(option)}
                        className={`rounded-2xl border px-4 py-3 text-left transition-all ${race === option ? 'border-amber-500/40 bg-amber-500/10 text-amber-300' : 'border-zinc-800 bg-zinc-950/50 text-zinc-400 hover:text-zinc-200'}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-zinc-300">Alignment</span>
                  <select
                    value={alignment}
                    onChange={(event) => setAlignment(event.target.value as (typeof ALIGNMENTS)[number])}
                    className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-zinc-100 outline-none focus:border-amber-500/50"
                  >
                    {ALIGNMENTS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-6 md:grid-cols-2">
                {CLASSES.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => applyClassPreset(option)}
                    className={`rounded-3xl border p-5 text-left transition-all ${characterClass === option ? 'border-amber-500/40 bg-amber-500/10' : 'border-zinc-800 bg-zinc-950/50 hover:border-zinc-700'}`}
                  >
                    <div className="mb-2 flex items-center gap-2 text-amber-400">
                      {option === 'Wizard' && <Wand2 className="h-4 w-4" />}
                      {option === 'Fighter' && <Sword className="h-4 w-4" />}
                      {option === 'Cleric' && <Shield className="h-4 w-4" />}
                      {option === 'Barbarian' && <Flame className="h-4 w-4" />}
                      {option === 'Rogue' && <Dice6 className="h-4 w-4" />}
                      {option === 'Ranger' && <ArrowRight className="h-4 w-4" />}
                      {option === 'Paladin' && <Shield className="h-4 w-4" />}
                    </div>
                    <h3 className="text-lg font-bold text-white">{option}</h3>
                    <p className="mt-1 text-sm text-zinc-500">Starting class profile and equipment preset.</p>
                  </button>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-300">
                  <span>Point Buy Remaining</span>
                  <span className={`font-bold ${remainingPoints < 0 ? 'text-red-400' : 'text-emerald-400'}`}>{remainingPoints}</span>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {ABILITY_ORDER.map((ability) => (
                    <div key={ability} className="rounded-3xl border border-zinc-800 bg-zinc-950/50 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">{ability}</p>
                          <h3 className="text-lg font-bold text-white">{STAT_INFO[ability].label}</h3>
                          <p className="text-xs text-zinc-500">{STAT_INFO[ability].description}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-4xl font-black text-amber-300">{stats[ability]}</div>
                          <div className="text-xs text-zinc-500">Mod {abilityModifier(stats[ability]) >= 0 ? '+' : ''}{abilityModifier(stats[ability])}</div>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-2">
                        <button type="button" onClick={() => decrementStat(ability)} className="rounded-xl border border-zinc-800 px-3 py-2 text-zinc-300 hover:border-zinc-600">
                          -
                        </button>
                        <button type="button" onClick={() => incrementStat(ability)} className="rounded-xl border border-zinc-800 px-3 py-2 text-zinc-300 hover:border-zinc-600">
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4 rounded-3xl border border-zinc-800 bg-zinc-950/50 p-5">
                  <h3 className="text-lg font-bold text-white">Equipment</h3>
                  <label className="block space-y-2">
                    <span className="text-sm text-zinc-300">Body Armor</span>
                    <select value={body} onChange={(event) => setBody(event.target.value as (typeof ARMOR_OPTIONS)[number])} className="w-full rounded-2xl border border-zinc-800 bg-[#10131a] px-4 py-3 text-zinc-100 outline-none">
                      {ARMOR_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block space-y-2">
                    <span className="text-sm text-zinc-300">Main Hand</span>
                    <select value={mainHand} onChange={(event) => setMainHand(event.target.value as (typeof MAIN_HAND_OPTIONS)[number])} className="w-full rounded-2xl border border-zinc-800 bg-[#10131a] px-4 py-3 text-zinc-100 outline-none">
                      {MAIN_HAND_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block space-y-2">
                    <span className="text-sm text-zinc-300">Feet</span>
                    <select value={feet} onChange={(event) => setFeet(event.target.value as (typeof FEET_OPTIONS)[number])} className="w-full rounded-2xl border border-zinc-800 bg-[#10131a] px-4 py-3 text-zinc-100 outline-none">
                      {FEET_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="space-y-4 rounded-3xl border border-zinc-800 bg-zinc-950/50 p-5">
                  <h3 className="text-lg font-bold text-white">Preview</h3>
                  <div className="space-y-3 text-sm text-zinc-300">
                    <div className="flex justify-between"><span>Name</span><span className="font-semibold text-white">{name || 'Unnamed Hero'}</span></div>
                    <div className="flex justify-between"><span>Race</span><span className="font-semibold text-white">{race}</span></div>
                    <div className="flex justify-between"><span>Class</span><span className="font-semibold text-white">{characterClass}</span></div>
                    <div className="flex justify-between"><span>HP</span><span className="font-semibold text-white">{maxHitPoints}</span></div>
                    <div className="flex justify-between"><span>AC</span><span className="font-semibold text-white">{armorClass}</span></div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between">
              <button type="button" onClick={() => setStep((current) => Math.max(0, current - 1) as WizardStep)} className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 px-4 py-3 text-zinc-300 hover:border-zinc-700">
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              {step < 3 ? (
                <button type="button" onClick={() => setStep((current) => Math.min(3, current + 1) as WizardStep)} className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 font-black text-zinc-950 hover:bg-amber-400">
                  Next
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button type="button" onClick={completeWizard} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 font-black text-zinc-950 hover:bg-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Create Character
                </button>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-zinc-300">Background</span>
                <div className="grid grid-cols-2 gap-2">
                  {BACKGROUNDS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setBackground(option)}
                      className={`rounded-2xl border px-4 py-3 text-left transition-all ${background === option ? 'border-amber-500/40 bg-amber-500/10 text-amber-300' : 'border-zinc-800 bg-zinc-950/50 text-zinc-400 hover:text-zinc-200'}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </label>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-300">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">Chosen Background</p>
                <p className="mt-2 text-lg font-bold text-white">{background}</p>
                <p className="mt-1 text-zinc-500">Background will later feed skill proficiencies and narrative prompts.</p>
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-800/70 bg-[#10141c] p-8 lg:border-t-0 lg:border-l">
            <div className="mb-6 flex items-center gap-3 text-amber-400">
              <Shield className="h-5 w-5" />
              <h3 className="text-sm font-black uppercase tracking-[0.25em]">Live Summary</h3>
            </div>

            <div className="space-y-4 rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <UserCircle2 className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">Adventurer</p>
                  <h4 className="text-xl font-bold text-white">{name || 'Unnamed Hero'}</h4>
                  <p className="text-sm text-zinc-500">{race} {characterClass}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm text-zinc-300">
                <div className="rounded-2xl border border-zinc-800 bg-[#0f1319] p-3">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">AC</p>
                  <p className="text-2xl font-black text-emerald-400">{armorClass}</p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-[#0f1319] p-3">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">HP</p>
                  <p className="text-2xl font-black text-red-400">{maxHitPoints}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">Equipment Preview</p>
                <div className="rounded-2xl border border-zinc-800 bg-[#0f1319] p-4 text-sm text-zinc-300">
                  <div className="flex items-center justify-between"><span>Body</span><span className="text-white">{body}</span></div>
                  <div className="flex items-center justify-between"><span>Main Hand</span><span className="text-white">{mainHand}</span></div>
                  <div className="flex items-center justify-between"><span>Feet</span><span className="text-white">{feet}</span></div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500">Ability Scores</p>
                <div className="grid grid-cols-3 gap-2">
                  {ABILITY_ORDER.map((ability) => (
                    <div key={ability} className="rounded-2xl border border-zinc-800 bg-[#0f1319] p-3 text-center">
                      <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500">{ability}</p>
                      <p className="text-xl font-black text-amber-300">{stats[ability]}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200">
                <Dice6 className="h-4 w-4" />
                Phase 1.1 now has a real creation flow. Next step is to connect this to campaign save/load.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
