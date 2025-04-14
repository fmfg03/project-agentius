const { ChatOpenAI } = require('@langchain/openai');
const { ChatAnthropic } = require('@langchain/anthropic');

/**
 * Creates and configures LangChain model instances based on user API keys
 * @param {Object} apiKeys - Object containing user API keys
 * @returns {Object} - Object containing configured LangChain model instances
 */
const createLangChainModels = (apiKeys) => {
  const models = {};

  if (apiKeys.chatgpt) {
    models.chatgpt = new ChatOpenAI({
      openAIApiKey: apiKeys.chatgpt,
      modelName: 'gpt-4',
      temperature: 0.7,
      maxTokens: 4000,
    });
  }

  if (apiKeys.claude) {
    models.claude = new ChatAnthropic({
      anthropicApiKey: apiKeys.claude,
      modelName: 'claude-3-opus-20240229',
      temperature: 0.7,
      maxTokens: 4000,
    });
  }

  return models;
};

module.exports = {
  createLangChainModels
};
