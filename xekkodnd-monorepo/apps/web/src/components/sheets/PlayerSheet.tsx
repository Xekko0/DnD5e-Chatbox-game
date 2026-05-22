'use client';

import { useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import type { AbilityScore, Condition, Skill } from '@/types';
import { useGameStore } from '@/store/useGameStore';
import ConditionBadge from '@/components/hud/ConditionBadge';

/* ─── Constants ──────────────────────────────────────────────────── */

const ABILITIES: { key: AbilityScore; label: string }[] = [
  { key: 'STR', label: 'Sức mạnh' },
  { key: 'DEX', label: 'Nhanh nhẹn' },
  { key: 'CON', label: 'Thể chất' },
  { key: 'INT', label: 'Trí tuệ' },
  { key: 'WIS', label: 'Khôn ngoan' },
  { key: 'CHA', label: 'Sức hút' },
];

const SKILL_MAP: { skill: Skill; label: string; ability: AbilityScore }[] = [
  { skill: 'acrobatics', label: 'Nhào lộn', ability: 'DEX' },
  { skill: 'animal-handling', label: 'Thuần thú', ability: 'WIS' },
  { skill: 'arcana', label: 'Phép thuật', ability: 'INT' },
  { skill: 'athletics', label: 'Thể lực', ability: 'STR' },
  { skill: 'deception', label: 'Lừa dối', ability: 'CHA' },
  { skill: 'history', label: 'Lịch sử', ability: 'INT' },
  { skill: 'insight', label: 'Nhạy cảm', ability: 'WIS' },
  { skill: 'intimidation', label: 'Đe dọa', ability: 'CHA' },
  { skill: 'investigation', label: 'Điều tra', ability: 'INT' },
  { skill: 'medicine', label: 'Y thuật', ability: 'WIS' },
  { skill: 'nature', label: 'Thiên nhiên', ability: 'INT' },
  { skill: 'perception', label: 'Tri giác', ability: 'WIS' },
  { skill: 'performance', label: 'Biểu diễn', ability: 'CHA' },
  { skill: 'persuasion', label: 'Thuyết phục', ability: 'CHA' },
  { skill: 'religion', label: 'Tôn giáo', ability: 'INT' },
  { skill: 'sleight-of-hand', label: 'Bàn tay khéo', ability: 'DEX' },
  { skill: 'stealth', label: 'Ẩn nấp', ability: 'DEX' },
  { skill: 'survival', label: 'Sinh tồn', ability: 'WIS' },
];

const ALL_CONDITIONS: Condition[] = [
  'blinded', 'charmed', 'deafened', 'exhaustion', 'frightened',
  'grappled', 'incapacitated', 'invisible', 'paralyzed', 'petrified',
  'poisoned', 'prone', 'restrained', 'stunned', 'unconscious',
];

const CONDITION_LABELS: Record<Condition, string> = {
  blinded: 'Mù', charmed: 'Mê hoặc', deafened: 'Điếc', exhaustion: 'Kiệt sức',
  frightened: 'Sợ hãi', grappled: 'Bị kẹp', incapacitated: 'Mất khả năng',
  invisible: 'Vô hình', paralyzed: 'Tê liệt', petrified: 'Hóa đá',
  poisoned: 'Trúng độc', prone: 'Ngã', restrained: 'Bị trói', stunned: 'Choáng',
  unconscious: 'Bất tỉnh',
};

type TabId = 'stats' | 'combat' | 'inventory' | 'spells' | 'notes';
const TABS: { id: TabId; label: string }[] = [
  { id: 'stats', label: 'Chỉ số' },
  { id: 'combat', label: 'Chiến đấu' },
  { id: 'inventory', label: 'Túi đồ' },
  { id: 'spells', label: 'Phép thuật' },
  { id: 'notes', label: 'Ghi chú' },
];

/* ─── Helpers ─────────────────────────────────────────────────────── */

function mod(score: number): string {
  const m = Math.floor((score - 10) / 2);
  return m >= 0 ? `+${m}` : `${m}`;
}

function skillBonus(score: number, prof: boolean, expert: boolean, profBonus: number): string {
  const base = Math.floor((score - 10) / 2);
  const bonus = expert ? base + profBonus * 2 : prof ? base + profBonus : base;
  return bonus >= 0 ? `+${bonus}` : `${bonus}`;
}

/* ─── Section helpers ─────────────────────────────────────────────── */

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">{children}</p>;
}

function NumInput({
  label, value, onChange, min = 0, max,
}: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number;
}) {
  return (
    <label className="flex flex-col gap-1 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
      <span className="text-[10px] uppercase text-zinc-500">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-transparent font-mono text-xl font-bold text-white outline-none"
      />
    </label>
  );
}

/* ─── Tab content components ──────────────────────────────────────── */

function TabStats() {
  const character = useGameStore((s) => s.character)!;
  const update = useGameStore((s) => s.updateCharacter);

  const patchAbility = (ability: AbilityScore, value: number) =>
    update({ abilityScores: { ...character.abilityScores, [ability]: value } });

  const toggleSave = (ability: AbilityScore) => {
    const current = character.savingThrows[ability];
    update({ savingThrows: { ...character.savingThrows, [ability]: current ? 0 : 1 } });
  };

  const toggleSkillProf = (skill: Skill) => {
    const isProf = !!character.skillProficiencies[skill];
    const isExpert = !!character.skillExpertise[skill];
    if (isExpert) {
      update({ skillExpertise: { ...character.skillExpertise, [skill]: false } });
    } else if (isProf) {
      update({
        skillProficiencies: { ...character.skillProficiencies, [skill]: false },
        skillExpertise: { ...character.skillExpertise, [skill]: true },
      });
    } else {
      update({ skillProficiencies: { ...character.skillProficiencies, [skill]: true } });
    }
  };

  return (
    <div className="space-y-5">
      {/* Proficiency bonus */}
      <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/30 p-3">
        <div>
          <p className="text-[10px] uppercase text-zinc-500">Điểm thành thạo</p>
          <p className="font-mono text-2xl font-black text-amber-400">+{character.proficiencyBonus}</p>
        </div>
        <div className="ml-auto">
          <p className="text-[10px] uppercase text-zinc-500">Cấp độ</p>
          <p className="font-mono text-2xl font-black text-zinc-200">{character.level}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-zinc-500">Cảm hứng</p>
          <button
            type="button"
            onClick={() => update({ inspiration: character.inspiration > 0 ? 0 : 1 })}
            className={`mt-1 h-7 w-7 rounded-full border-2 text-xs font-black transition-colors ${
              character.inspiration > 0
                ? 'border-amber-400 bg-amber-400/20 text-amber-400'
                : 'border-zinc-700 text-zinc-600 hover:border-zinc-500'
            }`}
          >
            ★
          </button>
        </div>
      </div>

      {/* Ability scores */}
      <div>
        <Label>Chỉ số cơ bản</Label>
        <div className="grid grid-cols-3 gap-2">
          {ABILITIES.map(({ key, label }) => (
            <div key={key} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-center">
              <p className="text-[10px] uppercase text-zinc-500">{label}</p>
              <input
                type="number"
                min={1}
                max={30}
                value={character.abilityScores[key]}
                onChange={(e) => patchAbility(key, Number(e.target.value))}
                className="mt-1 w-full bg-transparent text-center font-mono text-2xl font-black text-amber-300 outline-none"
              />
              <p className="mt-0.5 font-mono text-sm text-zinc-400">{mod(character.abilityScores[key])}</p>
              <p className="text-[9px] uppercase text-zinc-600">{key}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Saving throws */}
      <div>
        <Label>Saving Throws</Label>
        <div className="grid grid-cols-2 gap-1.5">
          {ABILITIES.map(({ key, label }) => {
            const hasProf = !!character.savingThrows[key];
            const bonus = hasProf
              ? Math.floor((character.abilityScores[key] - 10) / 2) + character.proficiencyBonus
              : Math.floor((character.abilityScores[key] - 10) / 2);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleSave(key)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-left text-xs transition-colors ${
                  hasProf
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                    : 'border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${hasProf ? 'bg-amber-400' : 'bg-zinc-700'}`} />
                <span className="flex-1">{label}</span>
                <span className="font-mono">{bonus >= 0 ? `+${bonus}` : bonus}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Skills */}
      <div>
        <Label>Kỹ năng (click: trống → thành thạo → chuyên gia)</Label>
        <div className="space-y-1">
          {SKILL_MAP.map(({ skill, label, ability }) => {
            const isProf = !!character.skillProficiencies[skill];
            const isExpert = !!character.skillExpertise[skill];
            const bonus = skillBonus(
              character.abilityScores[ability],
              isProf,
              isExpert,
              character.proficiencyBonus
            );
            return (
              <button
                key={skill}
                type="button"
                onClick={() => toggleSkillProf(skill)}
                className={`flex w-full items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                  isExpert
                    ? 'border-violet-500/30 bg-violet-500/10 text-violet-300'
                    : isProf
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                      : 'border-zinc-800/50 text-zinc-500 hover:border-zinc-700 hover:text-zinc-400'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${isExpert ? 'bg-violet-400' : isProf ? 'bg-amber-400' : 'bg-zinc-700'}`} />
                <span className="flex-1 text-left">{label}</span>
                <span className="text-[10px] text-zinc-600">{ability}</span>
                <span className="w-8 text-right font-mono">{bonus}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TabCombat() {
  const character = useGameStore((s) => s.character)!;
  const update = useGameStore((s) => s.updateCharacter);
  const [addingCondition, setAddingCondition] = useState(false);

  const removeCondition = (c: Condition) =>
    update({ conditions: character.conditions.filter((x) => x !== c) });
  const addCondition = (c: Condition) => {
    if (!character.conditions.includes(c)) {
      update({ conditions: [...character.conditions, c] });
    }
    setAddingCondition(false);
  };

  const toggleDeathSave = (type: 'success' | 'failure', idx: number) => {
    if (type === 'success') {
      const current = character.deathSaveSuccesses;
      update({ deathSaveSuccesses: current > idx ? idx : idx + 1 });
    } else {
      const current = character.deathSaveFailures;
      update({ deathSaveFailures: current > idx ? idx : idx + 1 });
    }
  };

  const isDead = character.deathSaveFailures >= 3;
  const isStable = character.deathSaveSuccesses >= 3;

  return (
    <div className="space-y-5">
      {/* Vitals row */}
      <div className="grid grid-cols-2 gap-2">
        <NumInput label="HP hiện tại" value={character.hitPoints} max={character.maxHitPoints + (character.temporaryHitPoints ?? 0)} onChange={(v) => update({ hitPoints: v })} />
        <NumInput label="HP tối đa" value={character.maxHitPoints} min={1} onChange={(v) => update({ maxHitPoints: v })} />
        <NumInput label="HP tạm thời" value={character.temporaryHitPoints ?? 0} onChange={(v) => update({ temporaryHitPoints: v })} />
        <NumInput label="Armor Class (AC)" value={character.armorClass} onChange={(v) => update({ armorClass: v })} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <NumInput label="Tốc độ (ft)" value={character.speed} onChange={(v) => update({ speed: v })} />
        <NumInput label="Kinh nghiệm (XP)" value={character.experience} onChange={(v) => update({ experience: v })} />
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
          <p className="text-[10px] uppercase text-zinc-500">Chủ động</p>
          <p className="mt-1 font-mono text-xl font-bold text-amber-300">
            {(() => { const m = Math.floor((character.abilityScores.DEX - 10) / 2); return m >= 0 ? `+${m}` : `${m}`; })()}
          </p>
        </div>
      </div>

      {/* HP bar visual */}
      <div className="space-y-1">
        <Label>Thanh HP</Label>
        <div className="relative h-3 w-full rounded-full bg-zinc-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-400 transition-all"
            style={{ width: `${Math.min(100, (character.hitPoints / character.maxHitPoints) * 100)}%` }}
          />
        </div>
        <p className="text-right text-[10px] text-zinc-600">
          {character.hitPoints} / {character.maxHitPoints} HP
          {(character.temporaryHitPoints ?? 0) > 0 && ` (+${character.temporaryHitPoints} tạm)`}
        </p>
      </div>

      {/* Death saves */}
      {character.hitPoints <= 0 && (
        <div>
          <Label>Death Saving Throws</Label>
          <div className={`rounded-xl border p-4 space-y-3 ${isDead ? 'border-red-800 bg-red-950/30' : isStable ? 'border-emerald-800 bg-emerald-950/30' : 'border-zinc-800 bg-zinc-900/30'}`}>
            {isDead && <p className="text-center text-sm font-bold text-red-400">☠ Nhân vật đã chết</p>}
            {isStable && <p className="text-center text-sm font-bold text-emerald-400">✓ Ổn định</p>}
            <div className="flex items-center gap-3">
              <span className="text-xs text-emerald-400 w-16">Thành công</span>
              <div className="flex gap-2">
                {[0, 1, 2].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDeathSave('success', i)}
                    className={`h-6 w-6 rounded-full border-2 transition-colors ${
                      i < character.deathSaveSuccesses
                        ? 'border-emerald-500 bg-emerald-500'
                        : 'border-zinc-600 hover:border-emerald-600'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-red-400 w-16">Thất bại</span>
              <div className="flex gap-2">
                {[0, 1, 2].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDeathSave('failure', i)}
                    className={`h-6 w-6 rounded-full border-2 transition-colors ${
                      i < character.deathSaveFailures
                        ? 'border-red-500 bg-red-500'
                        : 'border-zinc-600 hover:border-red-600'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conditions */}
      <div>
        <Label>Trạng thái</Label>
        <div className="flex flex-wrap gap-2">
          {character.conditions.map((c) => (
            <ConditionBadge key={c} condition={c} onRemove={removeCondition} />
          ))}
          {addingCondition ? (
            <div className="flex flex-wrap gap-1">
              {ALL_CONDITIONS.filter((c) => !character.conditions.includes(c)).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => addCondition(c)}
                  className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                >
                  {CONDITION_LABELS[c]}
                </button>
              ))}
              <button type="button" onClick={() => setAddingCondition(false)} className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-500 hover:text-zinc-300">Hủy</button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddingCondition(true)}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
            >
              <Plus className="h-3 w-3" /> Thêm
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function TabInventory() {
  const character = useGameStore((s) => s.character)!;
  const update = useGameStore((s) => s.updateCharacter);

  const totalWeight = character.inventory.reduce((acc, i) => acc + (i.weight ?? 0) * i.quantity, 0);
  const capacity = 15 * character.abilityScores.STR;

  const updateQty = (id: string, delta: number) => {
    update({
      inventory: character.inventory.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
      ).filter((item) => item.quantity > 0),
    });
  };

  const removeItem = (id: string) => {
    update({ inventory: character.inventory.filter((i) => i.id !== id) });
  };

  return (
    <div className="space-y-5">
      {/* Weight bar */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-3">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-zinc-500">Sức nặng</span>
          <span className={`font-mono font-bold ${totalWeight > capacity ? 'text-red-400' : 'text-zinc-300'}`}>
            {totalWeight.toFixed(1)} / {capacity} lb
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${totalWeight > capacity ? 'bg-red-500' : totalWeight > capacity * 0.5 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
            style={{ width: `${Math.min(100, (totalWeight / capacity) * 100)}%` }}
          />
        </div>
      </div>

      {/* Equipment slots */}
      <div>
        <Label>Trang bị đang mặc</Label>
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          {Object.entries(character.equipment).map(([slot, item]) =>
            item ? (
              <div key={slot} className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/30 px-2.5 py-1.5">
                <span className="text-zinc-600 capitalize">{slot.replace(/([A-Z])/g, ' $1').trim()}</span>
                <span className="flex-1 truncate text-right text-zinc-300">{item}</span>
              </div>
            ) : null
          )}
        </div>
      </div>

      {/* Inventory list */}
      <div>
        <Label>Vật phẩm ({character.inventory.length})</Label>
        {character.inventory.length === 0 ? (
          <p className="text-center text-xs text-zinc-600 py-4">Túi đồ trống</p>
        ) : (
          <div className="space-y-1.5">
            {character.inventory.map((item) => (
              <div key={item.id} className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/30 px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200 truncate">{item.name}</p>
                  {item.description && <p className="text-[10px] text-zinc-500 truncate">{item.description}</p>}
                </div>
                {item.weight && <span className="text-[10px] text-zinc-600 shrink-0">{item.weight}lb</span>}
                {item.rarity && <span className="text-[10px] text-amber-600 shrink-0">{item.rarity}</span>}
                <div className="flex items-center gap-1 shrink-0">
                  <button type="button" onClick={() => updateQty(item.id, -1)} className="rounded p-0.5 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300">
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-6 text-center font-mono text-xs text-zinc-300">{item.quantity}</span>
                  <button type="button" onClick={() => updateQty(item.id, 1)} className="rounded p-0.5 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300">
                    <Plus className="h-3 w-3" />
                  </button>
                  <button type="button" onClick={() => removeItem(item.id)} className="ml-1 rounded p-0.5 text-zinc-700 hover:bg-red-950 hover:text-red-400">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TabSpells() {
  const character = useGameStore((s) => s.character)!;
  const update = useGameStore((s) => s.updateCharacter);

  const hasSlots = !!character.spellSlots && Object.keys(character.spellSlots).length > 0;

  const useSlot = (level: number) => {
    if (!character.spellSlots) return;
    const slot = character.spellSlots[level];
    if (!slot || slot.used >= slot.max) return;
    update({ spellSlots: { ...character.spellSlots, [level]: { ...slot, used: slot.used + 1 } } });
  };

  const restoreSlot = (level: number) => {
    if (!character.spellSlots) return;
    const slot = character.spellSlots[level];
    if (!slot || slot.used <= 0) return;
    update({ spellSlots: { ...character.spellSlots, [level]: { ...slot, used: slot.used - 1 } } });
  };

  const restoreAll = () => {
    if (!character.spellSlots) return;
    const reset = Object.fromEntries(
      Object.entries(character.spellSlots).map(([lvl, s]) => [lvl, { ...s, used: 0 }])
    );
    update({ spellSlots: reset });
  };

  if (!hasSlots) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-4xl mb-3">✨</p>
        <p className="text-sm font-medium text-zinc-400">{character.class} không có spell slots</p>
        <p className="text-xs text-zinc-600 mt-1">Chỉ có Wizard, Druid, Cleric, Sorcerer... mới có phép thuật</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Label>Spell Slots</Label>
        <button
          type="button"
          onClick={restoreAll}
          className="text-[10px] text-zinc-500 hover:text-amber-400 transition-colors"
        >
          Nghỉ dài → phục hồi tất cả
        </button>
      </div>

      <div className="space-y-2">
        {Object.entries(character.spellSlots!).map(([lvlStr, slot]) => {
          const lvl = Number(lvlStr);
          const remaining = slot.max - slot.used;
          return (
            <div key={lvl} className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-zinc-400">Cấp {lvl}</span>
                <span className={`font-mono text-sm font-bold ${remaining > 0 ? 'text-violet-400' : 'text-zinc-600'}`}>
                  {remaining}/{slot.max}
                </span>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {Array.from({ length: slot.max }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => i < slot.max - remaining ? restoreSlot(lvl) : useSlot(lvl)}
                    className={`h-6 w-6 rounded-full border-2 transition-colors ${
                      i < remaining
                        ? 'border-violet-500 bg-violet-500/30 hover:bg-violet-500/50'
                        : 'border-zinc-700 bg-zinc-800 opacity-40 hover:opacity-70'
                    }`}
                    title={i < remaining ? 'Dùng slot' : 'Phục hồi slot'}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Class resources */}
      {(character.ki !== undefined || character.sorceryPoints !== undefined || character.channelDivinity !== undefined) && (
        <div>
          <Label>Nguồn lực đặc biệt</Label>
          <div className="grid grid-cols-2 gap-2">
            {character.ki !== undefined && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-center">
                <p className="text-[10px] uppercase text-zinc-500">Ki Points</p>
                <p className="font-mono text-2xl font-black text-cyan-400">{character.ki}</p>
              </div>
            )}
            {character.sorceryPoints !== undefined && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-center">
                <p className="text-[10px] uppercase text-zinc-500">Sorcery Points</p>
                <p className="font-mono text-2xl font-black text-rose-400">{character.sorceryPoints}</p>
              </div>
            )}
            {character.channelDivinity !== undefined && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-center">
                <p className="text-[10px] uppercase text-zinc-500">Channel Divinity</p>
                <p className="font-mono text-2xl font-black text-yellow-400">{character.channelDivinity}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TabNotes() {
  const character = useGameStore((s) => s.character)!;
  const update = useGameStore((s) => s.updateCharacter);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase text-zinc-500">Chủng tộc</span>
          <input
            value={character.race}
            onChange={(e) => update({ race: e.target.value })}
            className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-amber-500/50"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase text-zinc-500">Lớp nhân vật</span>
          <input
            value={character.class}
            onChange={(e) => update({ class: e.target.value })}
            className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-amber-500/50"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase text-zinc-500">Xuất thân</span>
          <input
            value={character.background}
            onChange={(e) => update({ background: e.target.value })}
            className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-amber-500/50"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase text-zinc-500">Xu hướng</span>
          <input
            value={character.alignment}
            onChange={(e) => update({ alignment: e.target.value })}
            className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-amber-500/50"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-[10px] uppercase text-zinc-500">Tên nhân vật</span>
        <input
          value={character.name}
          onChange={(e) => update({ name: e.target.value })}
          className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm font-bold text-zinc-100 outline-none focus:border-amber-500/50"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-[10px] uppercase text-zinc-500">Tiểu sử / Ghi chú</span>
        <textarea
          value={character.background}
          onChange={(e) => update({ background: e.target.value })}
          rows={8}
          placeholder="Viết tiểu sử nhân vật, ghi chú cá nhân..."
          className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-300 outline-none focus:border-amber-500/50 resize-none custom-scrollbar"
        />
      </label>

      <div className="rounded-xl border border-zinc-800/50 bg-zinc-950/30 p-3 text-xs text-zinc-600">
        <p>Tạo lúc: {new Date(character.createdAt).toLocaleString('vi-VN')}</p>
        <p>Cập nhật: {new Date(character.updatedAt).toLocaleString('vi-VN')}</p>
        <p>ID: {character.id}</p>
      </div>
    </div>
  );
}

/* ─── Main PlayerSheet Modal ──────────────────────────────────────── */

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function PlayerSheet({ open, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('stats');
  const character = useGameStore((s) => s.character);

  if (!open || !character) return null;

  const TAB_CONTENT: Record<TabId, React.ReactNode> = {
    stats: <TabStats />,
    combat: <TabCombat />,
    inventory: <TabInventory />,
    spells: <TabSpells />,
    notes: <TabNotes />,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Đóng"
      />

      {/* Modal */}
      <div className="relative z-10 flex h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-zinc-800 bg-[#0d0f12] shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center gap-3 border-b border-zinc-800 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 font-black text-sm">
            {character.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-black text-white leading-none">{character.name}</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {character.race} · {character.class} Cấp {character.level}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex shrink-0 border-b border-zinc-800 px-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-xs font-bold uppercase tracking-wide transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-amber-500 text-amber-400'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
          {TAB_CONTENT[activeTab]}
        </div>
      </div>
    </div>
  );
}
