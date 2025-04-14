const { PromptTemplate } = require('langchain/prompts');
const { StringOutputParser } = require('langchain/schema/output_parser');
const { RunnableSequence } = require('langchain/schema/runnable');
const { createLangChainModels } = require('./config');

/**
 * Creates a memory chain for token optimization
 * @param {Object} apiKeys - User API keys
 * @param {String} model - Model to use (claude or chatgpt)
 * @param {Array} messages - Previous conversation messages
 * @returns {Object} - Memory chain
 */
const createMemoryChain = async (apiKeys, model, messages) => {
  const models = createLangChainModels(apiKeys);
  const llm = models[model];
  
  if (!llm) {
    throw new Error(`Model ${model} not available. Please check API keys.`);
  }
  
  // Create a prompt template for summarizing conversation history
  const summarizeTemplate = `
  You are an AI assistant tasked with summarizing a conversation to optimize token usage.
  Summarize the following conversation in a concise way that preserves all important information,
  especially code snippets, design decisions, and key requirements.
  
  CONVERSATION:
  {conversation}
  
  SUMMARY:
  `;
  
  const summarizePrompt = PromptTemplate.fromTemplate(summarizeTemplate);
  
  // Convert messages to a conversation string
  const conversation = messages.map(msg => 
    `${msg.role.toUpperCase()}: ${msg.content}`
  ).join('\n\n');
  
  // Create a chain to summarize the conversation
  const summarizeChain = RunnableSequence.from([
    summarizePrompt,
    llm,
    new StringOutputParser()
  ]);
  
  // Run the chain to get the summary
  const summary = await summarizeChain.invoke({
    conversation
  });
  
  return summary;
};

/**
 * Optimizes context by summarizing long conversations
 * @param {Object} apiKeys - User API keys
 * @param {String} model - Model to use (claude or chatgpt)
 * @param {Array} messages - Previous conversation messages
 * @param {Number} tokenThreshold - Threshold for summarization (default: 2000)
 * @returns {Array} - Optimized messages
 */
const optimizeContext = async (apiKeys, model, messages, tokenThreshold = 2000) => {
  // Simple token estimation (rough approximation)
  const estimateTokens = (text) => Math.ceil(text.length / 4);
  
  // Calculate total tokens in messages
  const totalTokens = messages.reduce((sum, msg) => 
    sum + estimateTokens(msg.content), 0);
  
  // If under threshold, return original messages
  if (totalTokens < tokenThreshold) {
    return messages;
  }
  
  // Find a cutoff point - keep recent messages intact
  const recentMessageCount = 5;
  const recentMessages = messages.slice(-recentMessageCount);
  const olderMessages = messages.slice(0, -recentMessageCount);
  
  // Summarize older messages
  const summary = await createMemoryChain(apiKeys, model, olderMessages);
  
  // Create a system message with the summary
  const summaryMessage = {
    role: 'system',
    content: `Previous conversation summary: ${summary}`,
    metadata: { isSummary: true }
  };
  
  // Return the summary message followed by recent messages
  return [summaryMessage, ...recentMessages];
};

/**
 * Creates a structured memory object for role-specific recall
 * @param {String} role - Role (builder or judge)
 * @param {Array} messages - Previous conversation messages
 * @returns {Object} - Role-specific memory
 */
const createRoleMemory = (role, messages) => {
  // Filter messages by role
  const roleMessages = messages.filter(msg => msg.role === role);
  
  // Extract key information based on role
  if (role === 'builder') {
    // For builder, extract code snippets and implementation decisions
    const codeSnippets = [];
    const decisions = [];
    
    roleMessages.forEach(msg => {
      // Extract code blocks using regex
      const codeBlockRegex = /```([\s\S]*?)```/g;
      let match;
      while ((match = codeBlockRegex.exec(msg.content)) !== null) {
        codeSnippets.push(match[1]);
      }
      
      // Extract decisions (simplified approach)
      if (msg.content.includes('I decided') || msg.content.includes('I chose')) {
        decisions.push(msg.content);
      }
    });
    
    return {
      role: 'builder',
      codeSnippets,
      decisions,
      lastMessage: roleMessages.length > 0 ? roleMessages[roleMessages.length - 1].content : ''
    };
  } else if (role === 'judge') {
    // For judge, extract feedback and critiques
    const feedback = [];
    const suggestions = [];
    
    roleMessages.forEach(msg => {
      // Extract feedback (simplified approach)
      if (msg.content.includes('issue') || msg.content.includes('problem')) {
        feedback.push(msg.content);
      }
      
      // Extract suggestions (simplified approach)
      if (msg.content.includes('suggest') || msg.content.includes('recommend')) {
        suggestions.push(msg.content);
      }
    });
    
    return {
      role: 'judge',
      feedback,
      suggestions,
      lastMessage: roleMessages.length > 0 ? roleMessages[roleMessages.length - 1].content : ''
    };
  }
  
  return { role, messages: roleMessages };
};

module.exports = {
  optimizeContext,
  createRoleMemory
};
