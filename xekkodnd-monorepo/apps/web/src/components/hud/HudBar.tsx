'use client';

import { Shield, Swords, Coins, ChevronDown } from 'lucide-react';
import type { Condition } from '@/types';
import { useGameStore } from '@/store/useGameStore';
import ConditionBadge from './ConditionBadge';

const SPELLCASTER_CLASSES = ['Wizard', 'Sorcerer', 'Druid', 'Cleric', 'Bard', 'Warlock', 'Paladin', 'Ranger'];

function hpColor(current: number, max: number): string {
  const pct = max > 0 ? current / max : 0;
  if (pct > 0.6) return 'bg-emerald-500';
  if (pct > 0.3) return 'bg-yellow-500';
  return 'bg-red-500';
}

function mod(score: number): string {
  const m = Math.floor((score - 10) / 2);
  return m >= 0 ? `+${m}` : `${m}`;
}

type Props = {
  onOpenSheet: () => void;
};

export default function HudBar({ onOpenSheet }: Props) {
  const character = useGameStore((s) => s.character);
  const updateCharacter = useGameStore((s) => s.updateCharacter);

  if (!character) return null;

  const hpPct = Math.min(100, Math.max(0, (character.hitPoints / character.maxHitPoints) * 100));
  const isSpellcaster = SPELLCASTER_CLASSES.includes(character.class);

  const totalSpellSlots = isSpellcaster && character.spellSlots
    ? Object.values(character.spellSlots).reduce((acc, s) => acc + (s.max - s.used), 0)
    : null;
  const maxSpellSlots = isSpellcaster && character.spellSlots
    ? Object.values(character.spellSlots).reduce((acc, s) => acc + s.max, 0)
    : null;

  const gold = character.inventory?.find((i) => i.name.toLowerCase().includes('gold') || i.name.toLowerCase().includes('vàng'))?.quantity ?? 0;

  const removeCondition = (condition: Condition) => {
    updateCharacter({ conditions: character.conditions.filter((c) => c !== condition) });
  };

  return (
    <div className="shrink-0 border-b border-zinc-800/50 bg-[#0a0c0f]">
      <button
        type="button"
        onClick={onOpenSheet}
        className="w-full px-4 py-2 text-left hover:bg-zinc-800/20 transition-colors group"
        title="Mở Character Sheet"
      >
        <div className="flex items-center gap-4 flex-wrap">

          {/* Tên + class + level */}
          <div className="flex items-center gap-2 min-w-0 shrink-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500/20 text-amber-400 text-xs font-black">
              {character.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white leading-none">{character.name}</span>
                <ChevronDown className="h-3 w-3 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
              </div>
              <p className="text-[10px] text-zinc-500 leading-none mt-0.5">
                {character.class} Cấp {character.level} · {character.race}
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-zinc-800 shrink-0 hidden sm:block" />

          {/* HP bar */}
          <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">HP</span>
            <div className="relative h-2 w-24 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${hpColor(character.hitPoints, character.maxHitPoints)}`}
                style={{ width: `${hpPct}%` }}
              />
            </div>
            <div className="flex items-baseline gap-0.5">
              <input
                type="number"
                min={0}
                max={character.maxHitPoints + (character.temporaryHitPoints ?? 0)}
                value={character.hitPoints}
                onChange={(e) => updateCharacter({ hitPoints: Number(e.target.value) })}
                onClick={(e) => e.stopPropagation()}
                className="w-8 bg-transparent text-center font-mono text-sm font-bold text-red-400 outline-none focus:bg-zinc-800 rounded"
              />
              <span className="text-[10px] text-zinc-600">/</span>
              <span className="font-mono text-xs text-zinc-500">{character.maxHitPoints}</span>
              {(character.temporaryHitPoints ?? 0) > 0 && (
                <span className="font-mono text-xs text-sky-400">+{character.temporaryHitPoints}</span>
              )}
            </div>
          </div>

          <div className="h-6 w-px bg-zinc-800 shrink-0 hidden sm:block" />

          {/* AC */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Shield className="h-3.5 w-3.5 text-zinc-500" />
            <span className="font-mono text-sm font-bold text-emerald-400">{character.armorClass}</span>
            <span className="text-[10px] text-zinc-600 hidden md:inline">AC</span>
          </div>

          {/* Spell slots */}
          {isSpellcaster && totalSpellSlots !== null && maxSpellSlots !== null && (
            <>
              <div className="h-6 w-px bg-zinc-800 shrink-0 hidden sm:block" />
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-base leading-none">✨</span>
                <span className="font-mono text-sm font-bold text-violet-400">
                  {totalSpellSlots}
                  <span className="text-zinc-600 text-xs">/{maxSpellSlots}</span>
                </span>
                <span className="text-[10px] text-zinc-600 hidden md:inline">Spell</span>
              </div>
            </>
          )}

          {/* Initiative (DEX mod) */}
          <div className="hidden lg:flex items-center gap-1.5 shrink-0">
            <Swords className="h-3.5 w-3.5 text-zinc-500" />
            <span className="font-mono text-sm font-bold text-amber-300">{mod(character.abilityScores.DEX)}</span>
            <span className="text-[10px] text-zinc-600">Init</span>
          </div>

          {/* Gold */}
          {gold > 0 && (
            <>
              <div className="h-6 w-px bg-zinc-800 shrink-0 hidden lg:block" />
              <div className="hidden lg:flex items-center gap-1.5 shrink-0">
                <Coins className="h-3.5 w-3.5 text-yellow-600" />
                <span className="font-mono text-sm font-bold text-yellow-400">{gold}</span>
                <span className="text-[10px] text-zinc-600">gp</span>
              </div>
            </>
          )}

          {/* Equipped shortlist */}
          {(character.equipment?.mainHand || character.equipment?.body) && (
            <>
              <div className="h-6 w-px bg-zinc-800 shrink-0 hidden xl:block" />
              <div className="hidden xl:flex items-center gap-2 text-[11px] text-zinc-500">
                {character.equipment.mainHand && (
                  <span>⚔ {character.equipment.mainHand}</span>
                )}
                {character.equipment.body && (
                  <span>🛡 {character.equipment.body}</span>
                )}
              </div>
            </>
          )}

          {/* Conditions */}
          {character.conditions.length > 0 && (
            <>
              <div className="h-6 w-px bg-zinc-800 shrink-0 hidden sm:block" />
              <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
                {character.conditions.map((c) => (
                  <ConditionBadge key={c} condition={c} onRemove={removeCondition} />
                ))}
              </div>
            </>
          )}
        </div>
      </button>
    </div>
  );
}
