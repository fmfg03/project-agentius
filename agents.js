const { ChatOpenAI } = require('@langchain/openai');
const { ChatAnthropic } = require('@langchain/anthropic');

// Initialize LLM models
const initializeModels = () => {
  try {
    const openaiModel = new ChatOpenAI({
      modelName: 'gpt-4o',
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY,
      organization: process.env.OPENAI_ORG_ID
    });

    const anthropicModel = new ChatAnthropic({
      modelName: 'claude-3-opus-20240229',
      temperature: 0.7,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY
    });

    return {
      openaiModel,
      anthropicModel
    };
  } catch (error) {
    console.error('Error initializing LLM models:', error);
    return {
      openaiModel: null,
      anthropicModel: null
    };
  }
};

// Simple memory management
const createMemoryManager = () => {
  const memories = {};

  const getMemory = (projectId) => {
    if (!memories[projectId]) {
      memories[projectId] = {
        messages: []
      };
    }
    return memories[projectId];
  };

  const addMessage = (projectId, message) => {
    const memory = getMemory(projectId);
    memory.messages.push(message);
    return memory;
  };

  const getConversationHistory = (projectId) => {
    const memory = getMemory(projectId);
    return memory.messages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n\n');
  };

  return {
    addMessage,
    getConversationHistory
  };
};

// Simplified agent chains without using PromptTemplate
const createAgentChains = (models) => {
  // If models are null, return dummy functions
  if (!models.openaiModel || !models.anthropicModel) {
    return {
      builderChain: async (input) => "Builder agent is not available due to configuration issues.",
      judgeChain: async (input) => "Judge agent is not available due to configuration issues."
    };
  }

  const builderChain = async (input) => {
    try {
      const prompt = `
You are the Builder agent in the MCP System. Your role is to create websites based on user requirements.

Current Project: ${input.projectName}
Project Description: ${input.projectDescription}

Previous conversation:
${input.conversationHistory}

User's latest message: ${input.userMessage}

Respond with a detailed plan or implementation based on the user's request.
`;

      const response = await models.anthropicModel.invoke(prompt);
      return response.content;
    } catch (error) {
      console.error('Error in builder chain:', error);
      return "I encountered an error while processing your request. Please try again.";
    }
  };

  const judgeChain = async (input) => {
    try {
      const prompt = `
You are the Judge agent in the MCP System. Your role is to evaluate and provide feedback on the Builder's work.

Current Project: ${input.projectName}
Project Description: ${input.projectDescription}

Previous conversation:
${input.conversationHistory}

Builder's latest message: ${input.builderMessage}

Evaluate the Builder's work and provide constructive feedback.
`;

      const response = await models.openaiModel.invoke(prompt);
      return response.content;
    } catch (error) {
      console.error('Error in judge chain:', error);
      return "I encountered an error while evaluating the builder's work. Please try again.";
    }
  };

  return {
    builderChain,
    judgeChain
  };
};

module.exports = {
  initializeModels,
  createAgentChains,
  createMemoryManager
};
