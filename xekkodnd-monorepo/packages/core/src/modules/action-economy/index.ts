/**
 * Action Economy Module — Public API
 * SRD 5.2 ref: "Combat" > "Your Turn"
 */
export type {
  ActionType,
  EconomySlot,
  TurnState,
  ActionValidation,
} from './types';
export { ACTION_ECONOMY_COST } from './types';
export type { SequenceStep, SequenceValidation } from './turn-tracker';
export {
  createTurnState,
  canTakeAction,
  consumeAction,
  validateSequence,
  summarizeTurnState,
  remainingMovement,
} from './turn-tracker';
