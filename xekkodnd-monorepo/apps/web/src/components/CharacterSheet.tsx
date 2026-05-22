'use client';

import type { AbilityScore, CharacterState } from '@/types';
import { useGameStore } from '@/store/useGameStore';

const ABILITIES: AbilityScore[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

type CharacterSheetProps = {
  /** Cột trái trong layout 3 vùng (DAC_TA_V1 FR-UI-01) */
  compact?: boolean;
};

function modifier(score: number): string {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export default function CharacterSheet({ compact = false }: CharacterSheetProps) {
  const character = useGameStore((state) => state.character);
  const updateCharacter = useGameStore((state) => state.updateCharacter);

  if (!character) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sm text-zinc-500">
        Chưa có nhân vật
      </div>
    );
  }

  const patch = (updates: Partial<CharacterState>) => updateCharacter(updates);

  const patchAbility = (ability: AbilityScore, value: number) => {
    patch({
      abilityScores: {
        ...character.abilityScores,
        [ability]: value,
      },
    });
  };

  if (compact) {
    return (
      <div className="flex h-full flex-col overflow-hidden bg-[#0d0f12] border-r border-zinc-800/50">
        <div className="border-b border-zinc-800/50 px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-500/80">Nhân vật</p>
          <input
            value={character.name}
            onChange={(e) => patch({ name: e.target.value })}
            className="mt-1 w-full bg-transparent text-lg font-bold text-white outline-none focus:text-amber-100"
          />
          <p className="text-xs text-zinc-500">
            Cấp {character.level} · {character.race} · {character.class}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <label className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
              <span className="text-[10px] uppercase text-zinc-500">HP</span>
              <input
                type="number"
                min={0}
                max={character.maxHitPoints}
                value={character.hitPoints}
                onChange={(e) => patch({ hitPoints: Number(e.target.value) })}
                className="mt-1 w-full bg-transparent font-mono text-xl font-bold text-red-400 outline-none"
              />
            </label>
            <label className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
              <span className="text-[10px] uppercase text-zinc-500">AC</span>
              <input
                type="number"
                min={0}
                value={character.armorClass}
                onChange={(e) => patch({ armorClass: Number(e.target.value) })}
                className="mt-1 w-full bg-transparent font-mono text-xl font-bold text-emerald-400 outline-none"
              />
            </label>
          </div>

          <label className="block rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
            <span className="text-[10px] uppercase text-zinc-500">Max HP</span>
            <input
              type="number"
              min={1}
              value={character.maxHitPoints}
              onChange={(e) => patch({ maxHitPoints: Number(e.target.value) })}
              className="mt-1 w-full bg-transparent font-mono text-lg text-zinc-300 outline-none"
            />
          </label>

          <div>
            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">Chỉ số</p>
            <div className="space-y-2">
              {ABILITIES.map((ability) => (
                <div key={ability} className="flex items-center justify-between rounded-lg border border-zinc-800/80 bg-zinc-950/50 px-3 py-2">
                  <span className="text-xs font-bold text-zinc-400">{ability}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={character.abilityScores[ability]}
                      onChange={(e) => patchAbility(ability, Number(e.target.value))}
                      className="w-10 bg-transparent text-right font-mono text-sm text-amber-300 outline-none"
                    />
                    <span className="text-[10px] text-zinc-600">{modifier(character.abilityScores[ability])}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {character.equipment?.body && (
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-3 text-xs text-zinc-400">
              <span className="text-[10px] uppercase text-zinc-600">Trang bị</span>
              <p className="mt-1 text-zinc-300">{character.equipment.body}</p>
              {character.equipment.mainHand && <p>{character.equipment.mainHand}</p>}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-[320px] shrink-0">
      <CharacterSheet compact />
    </div>
  );
}
