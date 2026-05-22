/**
 * Action Economy Types
 * SRD 5.2 ref: "Combat" > "Your Turn" > Actions, Bonus Actions, Reactions
 */

/** 15 action types V6 hỗ trợ */
export type ActionType =
  | 'move'
  | 'attack'
  | 'cast_spell'
  | 'dash'
  | 'disengage'
  | 'dodge'
  | 'help'
  | 'hide'
  | 'search'
  | 'ready'
  | 'use_item'
  | 'skill_check'
  | 'saving_throw'
  | 'talk'
  | 'examine'
  | 'free_interaction';

/** Loại "nguồn" action economy */
export type EconomySlot = 'action' | 'bonus_action' | 'reaction' | 'movement' | 'free';

/** Map action type → economy slot cần dùng */
export const ACTION_ECONOMY_COST: Record<ActionType, EconomySlot> = {
  move:             'movement',
  attack:           'action',
  cast_spell:       'action',      // bonus action spells override ở runtime
  dash:             'action',
  disengage:        'action',
  dodge:            'action',
  help:             'action',
  hide:             'action',
  search:           'action',
  ready:            'action',
  use_item:         'action',
  skill_check:      'free',        // thường là phần của action khác
  saving_throw:     'free',        // reactive, không tốn action
  talk:             'free',
  examine:          'free',
  free_interaction: 'free',
};

/** Trạng thái action economy của 1 entity trong 1 turn */
export interface TurnState {
  entityId: string;
  roundNumber: number;
  /** Đã dùng Action chưa */
  actionUsed: boolean;
  /** Đã dùng Bonus Action chưa */
  bonusActionUsed: boolean;
  /** Đã dùng Reaction chưa */
  reactionUsed: boolean;
  /** Movement đã dùng (feet) */
  movementUsed: number;
  /** Tốc độ tối đa của entity (feet/turn) */
  speed: number;
  /** Số free interactions đã dùng (max 1 miễn phí) */
  freeInteractionsUsed: number;
  /** Có đang Dodge không (gives disadvantage to attackers) */
  isDodging: boolean;
  /** Có đang Disengage không (no opportunity attacks) */
  isDisengaged: boolean;
  /** Đã dùng Dash chưa (extra movement = speed) */
  hasDashed: boolean;
  /** Log action đã thực hiện trong turn này */
  actionsLog: ActionType[];
}

/** Kết quả validate action */
export interface ActionValidation {
  canDo: boolean;
  reason?: string;
  /** Alternatives nếu không làm được */
  alternatives?: string[];
}
