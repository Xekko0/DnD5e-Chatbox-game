/**
 * Dice Module — Public API
 * SRD 5.2 ref: "Using Ability Scores" > d20 Tests, Damage Rolls
 */
export type { D20Result, DamageRoll, DiceNotation, DiceSides, AdvantageState } from './types';
export {
  rollDie,
  rollDice,
  rollD20,
  rollDamage,
  parseDiceNotation,
  resolveAdvantageState,
  roll4d6DropLowest,
  rollAbilityScores,
  formatD20Result,
  formatDamageRoll,
  setRng,
  resetRng,
  STANDARD_ARRAY,
} from './dice';
