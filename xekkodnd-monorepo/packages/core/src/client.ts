/**
 * Browser-safe exports (no Node fs/path)
 */
export * from './types';
export { RuleEngine, ruleEngine } from './RuleEngine';
export { CampaignPresenter, IntentParser, createCampaignPresenter } from './CampaignPresenter';
export { buildDmSystemPrompt, ollamaChat, testOllamaConnection } from './ollama';
