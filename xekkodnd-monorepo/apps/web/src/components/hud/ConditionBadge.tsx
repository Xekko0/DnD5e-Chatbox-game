'use client';

import type { Condition } from '@/types';

const DEBUFF_CONDITIONS: Condition[] = [
  'blinded', 'charmed', 'deafened', 'exhaustion', 'frightened',
  'incapacitated', 'paralyzed', 'petrified', 'poisoned',
  'restrained', 'stunned', 'unconscious',
];
const NEUTRAL_CONDITIONS: Condition[] = ['grappled', 'invisible', 'prone'];

const CONDITION_LABELS: Record<Condition, string> = {
  blinded: 'Mù',
  charmed: 'Mê hoặc',
  deafened: 'Điếc',
  exhaustion: 'Kiệt sức',
  frightened: 'Sợ hãi',
  grappled: 'Bị kẹp',
  incapacitated: 'Mất khả năng',
  invisible: 'Vô hình',
  paralyzed: 'Tê liệt',
  petrified: 'Hóa đá',
  poisoned: 'Trúng độc',
  prone: 'Ngã',
  restrained: 'Bị trói',
  stunned: 'Choáng',
  unconscious: 'Bất tỉnh',
};

function getVariant(condition: Condition): 'debuff' | 'neutral' {
  if (DEBUFF_CONDITIONS.includes(condition)) return 'debuff';
  if (NEUTRAL_CONDITIONS.includes(condition)) return 'neutral';
  return 'debuff';
}

const VARIANT_CLASS = {
  debuff: 'bg-red-950/60 text-red-400 border-red-800/50',
  neutral: 'bg-yellow-950/60 text-yellow-400 border-yellow-800/50',
};

type Props = {
  condition: Condition;
  onRemove?: (condition: Condition) => void;
};

export default function ConditionBadge({ condition, onRemove }: Props) {
  const variant = getVariant(condition);
  const label = CONDITION_LABELS[condition] ?? condition;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${VARIANT_CLASS[variant]}`}
    >
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(condition)}
          className="ml-0.5 leading-none opacity-60 hover:opacity-100"
          aria-label={`Xóa ${label}`}
        >
          ×
        </button>
      )}
    </span>
  );
}
