/**
 * Action Economy — Turn Tracker
 * SRD 5.2 ref: "Combat" > "Your Turn"
 * Pure functions, immutable state updates
 */

import type {
  TurnState,
  ActionType,
  ActionValidation,
  EconomySlot,
} from './types';
import { ACTION_ECONOMY_COST } from './types';

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Tạo TurnState mới đầu turn cho một entity
 */
export function createTurnState(entityId: string, speed: number, roundNumber: number): TurnState {
  return {
    entityId,
    roundNumber,
    actionUsed: false,
    bonusActionUsed: false,
    reactionUsed: false,
    movementUsed: 0,
    speed,
    freeInteractionsUsed: 0,
    isDodging: false,
    isDisengaged: false,
    hasDashed: false,
    actionsLog: [],
  };
}

// ─── Validate ─────────────────────────────────────────────────────────────────

/**
 * Kiểm tra xem entity có thể thực hiện action không
 * SRD: "On your turn, you can move and take one action."
 */
export function canTakeAction(state: TurnState, action: ActionType): ActionValidation {
  const slot = ACTION_ECONOMY_COST[action];

  // Movement
  if (slot === 'movement') {
    const maxMove = state.speed * (state.hasDashed ? 2 : 1);
    if (state.movementUsed >= maxMove) {
      return {
        canDo: false,
        reason: `Không còn movement (${state.movementUsed}/${maxMove} ft đã dùng).`,
        alternatives: ['Dùng Dash action để có thêm movement'],
      };
    }
    return { canDo: true };
  }

  // Action
  if (slot === 'action') {
    if (state.actionUsed) {
      return {
        canDo: false,
        reason: `Action đã được dùng trong turn này.`,
        alternatives: ['Chờ turn tiếp theo', 'Dùng Bonus Action (nếu có)'],
      };
    }
    return { canDo: true };
  }

  // Bonus Action
  if (slot === 'bonus_action') {
    if (state.bonusActionUsed) {
      return {
        canDo: false,
        reason: `Bonus Action đã được dùng trong turn này.`,
        alternatives: [],
      };
    }
    return { canDo: true };
  }

  // Reaction
  if (slot === 'reaction') {
    if (state.reactionUsed) {
      return {
        canDo: false,
        reason: `Reaction đã được dùng (reset đầu turn tiếp).`,
        alternatives: [],
      };
    }
    return { canDo: true };
  }

  // Free
  if (slot === 'free') {
    if (action === 'free_interaction' && state.freeInteractionsUsed >= 1) {
      return {
        canDo: false,
        reason: `Free interaction đã dùng (max 1/turn). Dùng Utilize action.`,
        alternatives: ['Utilize (1 Action)'],
      };
    }
    return { canDo: true };
  }

  return { canDo: true };
}

// ─── Consume ──────────────────────────────────────────────────────────────────

/**
 * Tiêu thụ economy slot, trả về TurnState mới (immutable)
 * Caller phải đã gọi canTakeAction() trước
 */
export function consumeAction(
  state: TurnState,
  action: ActionType,
  movementFeet?: number,
  asBonusAction?: boolean
): TurnState {
  const slot: EconomySlot = asBonusAction ? 'bonus_action' : ACTION_ECONOMY_COST[action];

  const next = { ...state, actionsLog: [...state.actionsLog, action] };

  switch (slot) {
    case 'action':
      next.actionUsed = true;
      // Special: Dash → double movement
      if (action === 'dash') next.hasDashed = true;
      // Special: Dodge → mark state
      if (action === 'dodge') next.isDodging = true;
      // Special: Disengage → mark state
      if (action === 'disengage') next.isDisengaged = true;
      break;

    case 'bonus_action':
      next.bonusActionUsed = true;
      break;

    case 'reaction':
      next.reactionUsed = true;
      break;

    case 'movement':
      next.movementUsed = (next.movementUsed) + (movementFeet ?? 5);
      break;

    case 'free':
      if (action === 'free_interaction') {
        next.freeInteractionsUsed += 1;
      }
      break;
  }

  return next;
}

// ─── Validate Sequence ────────────────────────────────────────────────────────

export interface SequenceStep {
  action: ActionType;
  movementFeet?: number;
  asBonusAction?: boolean;
}

export interface SequenceValidation {
  valid: boolean;
  /** Index của step đầu tiên vi phạm (-1 nếu valid) */
  failAtStep: number;
  failReason?: string;
  alternatives?: string[];
  /** TurnState sau khi execute toàn bộ sequence (chỉ có ý nghĩa nếu valid) */
  finalState?: TurnState;
}

/**
 * Validate một chuỗi actions trước khi execute
 * Dùng trong V6 pipeline sau Intent Parser
 */
export function validateSequence(
  initialState: TurnState,
  steps: SequenceStep[]
): SequenceValidation {
  let state = initialState;

  for (let i = 0; i < steps.length; i++) {
    const { action, movementFeet, asBonusAction } = steps[i];
    const check = canTakeAction(state, asBonusAction ? 'attack' : action);

    if (!check.canDo) {
      return {
        valid: false,
        failAtStep: i,
        failReason: check.reason,
        alternatives: check.alternatives,
      };
    }

    state = consumeAction(state, action, movementFeet, asBonusAction);
  }

  return { valid: true, failAtStep: -1, finalState: state };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Tóm tắt economy state cho UI / debug
 */
export function summarizeTurnState(state: TurnState): string {
  const parts: string[] = [];
  if (state.actionUsed) parts.push('Action ✓');
  else parts.push('Action ○');
  if (state.bonusActionUsed) parts.push('Bonus ✓');
  else parts.push('Bonus ○');
  if (state.reactionUsed) parts.push('React ✓');
  else parts.push('React ○');
  const maxMove = state.speed * (state.hasDashed ? 2 : 1);
  parts.push(`Move ${state.movementUsed}/${maxMove}ft`);
  return parts.join(' | ');
}

/**
 * Remaining movement (tính cả Dash)
 */
export function remainingMovement(state: TurnState): number {
  const maxMove = state.speed * (state.hasDashed ? 2 : 1);
  return Math.max(0, maxMove - state.movementUsed);
}
