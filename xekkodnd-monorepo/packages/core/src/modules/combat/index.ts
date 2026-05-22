/**
 * Combat Module — Public API
 * SRD 5.2 ref: "Combat"
 */
export type {
  Weapon,
  DamageType,
  WeaponProperty,
  CombatantStats,
  CombatState,
  CombatPhase,
  InitiativeEntry,
  AttackResult,
  AttackOutcome,
  ResultObject,
  ResultStep,
  NarrativeHints,
  DramaticMomentum,
  StepActionType,
} from './types';
export {
  rollInitiative,
  advanceTurn,
  computeEffectiveAC,
  makeAttack,
  buildAttackResultObject,
  checkCombatEnd,
} from './combat';
