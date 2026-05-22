/**
 * Campaign Presenter (0.7) - MVP Orchestrator
 * Ties together: IntentParser → RuleEngine → MultiOutputPipeline
 * Produces unified output with narrative, state updates, and rule checks
 */

import type {
  CharacterState,
  WorldLore,
  SessionHistory,
  IntentParseResult,
  MultiOutputPayload,
  PresenterOutput,
  CampaignPresenterConfig,
  ChatMessage,
  DiceRoll,
} from './types';
import { RuleEngine } from './RuleEngine';
import { buildDmSystemPrompt, ollamaChat, type OllamaChatMessage } from './ollama';

/**
 * Intent Parser - Analyzes player input and extracts intent
 */
export class IntentParser {
  /**
   * Parse raw player input text
   */
  parse(rawText: string): IntentParseResult {
    const text = rawText.toLowerCase().trim();

    // Dice roll intent
    if (/\bd\d+/.test(text) || /roll/.test(text)) {
      const diceMatch = text.match(/(\d*)d(\d+)([+\-]\d+)?/i);
      if (diceMatch) {
        return {
          intent: 'roll',
          confidence: 0.95,
          rawText,
          parsed: {
            numDice: parseInt(diceMatch[1]) || 1,
            dieSize: parseInt(diceMatch[2]),
            modifier: diceMatch[3] ? parseInt(diceMatch[3]) : 0,
          },
        };
      }
    }

    // Spell cast intent
    if (/cast|spell|magic/.test(text)) {
      const spellMatch = text.match(/cast\s+(.*?)\s+spell/i) || text.match(/spell\s+(\w+)/i);
      if (spellMatch) {
        return {
          intent: 'spell-cast',
          confidence: 0.85,
          rawText,
          parsed: { spellName: spellMatch[1] },
        };
      }
    }

    // Attack intent
    if (/attack|hit|strike|slash|shoot/.test(text)) {
      return {
        intent: 'attack',
        confidence: 0.8,
        rawText,
        parsed: { action: 'attack' },
      };
    }

    // Skill check intent
    if (/check|perception|stealth|persuade|intimidate|deception|arcana|religion|nature|investigation|history|medicine|animal/.test(text)) {
      const skillMatch = text.match(
        /(perception|stealth|persuade|persuasion|intimidate|deception|arcana|religion|nature|investigation|history|medicine|animal|acrobatics|athletics|insight|sleight)/i
      );
      if (skillMatch) {
        return {
          intent: 'skill-check',
          confidence: 0.85,
          rawText,
          parsed: { skill: skillMatch[1].toLowerCase() },
        };
      }
    }

    // Movement intent
    if (/move|go|walk|run|approach|flee/.test(text)) {
      return {
        intent: 'movement',
        confidence: 0.7,
        rawText,
        parsed: { action: 'movement' },
      };
    }

    // Meta intent (commands)
    if (text.startsWith('/')) {
      return {
        intent: 'meta',
        confidence: 0.95,
        rawText,
        parsed: { command: text.slice(1) },
      };
    }

    // Default to chat
    return {
      intent: 'chat',
      confidence: 0.5,
      rawText,
    };
  }
}

/**
 * Campaign Presenter - Main orchestrator
 */
export class CampaignPresenter {
  private character: CharacterState;
  private worldLore: WorldLore;
  private sessionHistory: SessionHistory;
  private ruleEngine: RuleEngine;
  private intentParser: IntentParser;
  private modelName: string;
  private ollamaBaseUrl: string;
  private narrativeCache: Map<string, string> = new Map();

  constructor(config: CampaignPresenterConfig) {
    this.character = config.characterState;
    this.worldLore = config.worldLore;
    this.sessionHistory =
      config.sessionHistory ?? {
        sessionId: `session-${Date.now()}`,
        campaignId: 'default',
        startedAt: new Date().toISOString(),
        messages: [],
        diceRolls: [],
        characterActions: [],
      };
    this.ruleEngine = new RuleEngine();
    this.intentParser = new IntentParser();
    this.modelName = config.modelName || 'llama3.1:8b';
    this.ollamaBaseUrl = config.ollamaBaseUrl || 'http://localhost:11434';
  }

  /**
   * Sync chat history from UI store before each turn
   */
  syncSession(sessionHistory: SessionHistory): void {
    this.sessionHistory = sessionHistory;
    this.character = { ...this.character };
  }

  syncCharacter(character: CharacterState): void {
    this.character = character;
  }

  /**
   * Main entry point: process player input and return unified output
   */
  async processInput(userInput: string): Promise<PresenterOutput> {
    const startTime = Date.now();
    const ruleChecksApplied: string[] = [];

    // Step 1: Parse intent
    const intent = this.intentParser.parse(userInput);

    // Step 2: Validate character state
    const stateValidation = [
      this.ruleEngine.hitPointValidation(this.character),
      this.ruleEngine.levelValidation(this.character),
      this.ruleEngine.inspirationValidation(this.character),
    ];

    const ruleChecks = stateValidation;
    ruleChecksApplied.push('character-validation');

    // Step 3: Apply intent-specific rules
    let narrativeResponse = '';
    const stateUpdates: Partial<CharacterState> = {};
    const diceRolls: DiceRoll[] = [];
    const messages: ChatMessage[] = [];
    const warnings: string[] = [];

    switch (intent.intent) {
      case 'roll': {
        ruleChecksApplied.push('dice-roll');
        const rollParsed = intent.parsed as
          | { numDice?: number; dieSize?: number; modifier?: number }
          | undefined;
        const diceResult = this.handleDiceRoll(
          rollParsed?.numDice ?? 1,
          rollParsed?.dieSize ?? 20,
          rollParsed?.modifier ?? 0
        );
        diceRolls.push(diceResult.roll);
        narrativeResponse = diceResult.narrative;
        messages.push({
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: `🎲 ${diceResult.narrative}`,
          timestamp: new Date().toISOString(),
          intent: 'roll',
        });
        break;
      }

      case 'attack': {
        ruleChecksApplied.push('attack-roll');
        const targetAC = 12; // Default target
        const attackResult = this.ruleEngine.attackRoll(this.character, targetAC, 'STR', 0);
        ruleChecks.push(attackResult);
        narrativeResponse = attackResult.message;
        messages.push({
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: `⚔️ ${narrativeResponse}`,
          timestamp: new Date().toISOString(),
          intent: 'attack',
        });
        break;
      }

      case 'spell-cast': {
        ruleChecksApplied.push('spell-slot-check');
        const spellSlotCheck = this.ruleEngine.spellSlotCheck(this.character, 1);
        ruleChecks.push(spellSlotCheck);
        if (spellSlotCheck.passed) {
          narrativeResponse = `✨ Spell cast successfully! ${intent.parsed?.spellName || 'unknown spell'}`;
          if (this.character.spellSlots?.[1]) {
            this.character.spellSlots[1].used++;
          }
          stateUpdates.spellSlots = this.character.spellSlots;
        } else {
          narrativeResponse = `✨ Not enough spell slots! ${spellSlotCheck.message}`;
          warnings.push('Insufficient spell slots');
        }
        messages.push({
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: narrativeResponse,
          timestamp: new Date().toISOString(),
          intent: 'spell-cast',
        });
        break;
      }

      case 'skill-check': {
        ruleChecksApplied.push('skill-check');
        const skillCheckResult = this.ruleEngine.skillCheck(this.character, 'DEX', 12, true);
        ruleChecks.push(skillCheckResult);
        narrativeResponse = skillCheckResult.message;
        messages.push({
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: `🎯 ${narrativeResponse}`,
          timestamp: new Date().toISOString(),
          intent: 'skill-check',
        });
        break;
      }

      case 'chat':
      default: {
        ruleChecksApplied.push('narrative-generation');
        narrativeResponse = await this.generateNarrative(userInput, intent);
        messages.push({
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: narrativeResponse,
          timestamp: new Date().toISOString(),
          intent: 'chat',
        });
        break;
      }
    }

    // Step 4: Build multi-output payload
    const output: MultiOutputPayload = {
      narrativeResponse,
      stateUpdates: Object.keys(stateUpdates).length > 0 ? stateUpdates : undefined,
      diceRolls: diceRolls.length > 0 ? diceRolls : undefined,
      messages: messages.length > 0 ? messages : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      metadata: {
        processingTimeMs: Date.now() - startTime,
        ruleChecksApplied,
      },
    };

    // Update session history
    this.sessionHistory.messages.push(...messages);

    return {
      intent,
      ruleChecks,
      multiOutput: output,
    };
  }

  /**
   * Handle dice roll (helper)
   */
  private handleDiceRoll(
    numDice: number,
    dieSize: number,
    modifier: number
  ): {
    roll: DiceRoll;
    narrative: string;
  } {
    const rolls: number[] = [];
    for (let i = 0; i < numDice; i++) {
      rolls.push(Math.floor(Math.random() * dieSize) + 1);
    }

    const total = rolls.reduce((a, b) => a + b, 0) + modifier;
    const rollId = `roll-${Date.now()}`;

    const roll: DiceRoll = {
      id: rollId,
      timestamp: new Date().toISOString(),
      expression: `${numDice}d${dieSize}${modifier ? `+${modifier}` : ''}`,
      result: total,
      rolls,
    };

    const narrative = `${numDice}d${dieSize}${modifier ? `+${modifier}` : ''} = [${rolls.join(', ')}]${modifier ? ` + ${modifier}` : ''} = **${total}**`;

    return { roll, narrative };
  }

  /**
   * Generate narrative via Ollama (fallback stub if offline)
   */
  private async generateNarrative(userInput: string, _intent: IntentParseResult): Promise<string> {
    const ollamaMessages: OllamaChatMessage[] = [
      { role: 'system', content: buildDmSystemPrompt() },
      ...this.sessionHistory.messages.map((message) => ({
        role: (message.role === 'assistant' ? 'assistant' : message.role === 'system' ? 'system' : 'user') as OllamaChatMessage['role'],
        content: message.content,
      })),
    ];

    const hasUserTurn = ollamaMessages.some((message) => message.role === 'user' && message.content === userInput);
    if (!hasUserTurn) {
      ollamaMessages.push({ role: 'user', content: userInput });
    }

    try {
      const response = await ollamaChat({
        baseUrl: this.ollamaBaseUrl,
        model: this.modelName,
        messages: ollamaMessages,
      });
      if (response) {
        return response;
      }
    } catch {
      // fall through to offline message
    }

    return (
      'Không kết nối được Ollama tại localhost:11434. ' +
      'Hãy cài Ollama, chạy model (vd. llama3.1:8b), rồi thử lại. ' +
      `Hành động của bạn: "${userInput}".`
    );
  }

  /**
   * Update character state from external source
   */
  updateCharacter(updates: Partial<CharacterState>): void {
    Object.assign(this.character, updates);
  }

  /**
   * Get current state
   */
  getState() {
    return {
      character: this.character,
      worldLore: this.worldLore,
      sessionHistory: this.sessionHistory,
    };
  }

  /**
   * Export session
   */
  exportSession(): string {
    return JSON.stringify(
      {
        character: this.character,
        worldLore: this.worldLore,
        sessionHistory: this.sessionHistory,
      },
      null,
      2
    );
  }
}

/**
 * Factory function
 */
export function createCampaignPresenter(
  character: CharacterState,
  worldLore: WorldLore,
  sessionHistory?: SessionHistory,
  options?: { modelName?: string; ollamaBaseUrl?: string }
): CampaignPresenter {
  return new CampaignPresenter({
    characterState: character,
    worldLore,
    sessionHistory,
    modelName: options?.modelName ?? 'llama3.1:8b',
    ollamaBaseUrl: options?.ollamaBaseUrl,
  });
}
