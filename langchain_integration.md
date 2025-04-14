# LangChain Integration Documentation

## Overview

The MCP System has been enhanced with LangChain integration to provide more powerful context-aware reasoning capabilities for the Builder and Judge agents. This integration leverages LangChain's advanced features for prompt management, memory handling, and conversation chains.

## Components

### 1. LangChain Models Configuration

The system uses LangChain's model wrappers for OpenAI (ChatGPT) and Anthropic (Claude) to provide a consistent interface for both LLM providers:

```javascript
// src/services/langchain/config.js
const { ChatOpenAI } = require('@langchain/openai');
const { ChatAnthropic } = require('@langchain/anthropic');

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
```

### 2. Agent Implementation

The Builder and Judge agents are implemented using LangChain's `ConversationChain` with specialized prompt templates and memory management:

```javascript
// src/services/langchain/agents.js
const { PromptTemplate } = require('langchain/prompts');
const { BufferMemory } = require('langchain/memory');
const { ConversationChain } = require('langchain/chains');

// Builder agent with specialized prompt template
const createBuilderAgent = (apiKeys, model, projectContext) => {
  // ...implementation details
  return chain;
};

// Judge agent with specialized prompt template
const createJudgeAgent = (apiKeys, model, projectContext) => {
  // ...implementation details
  return chain;
};
```

### 3. Advanced Memory Management

The system implements advanced memory management using LangChain's capabilities:

```javascript
// src/services/langchain/memory.js
const { PromptTemplate } = require('langchain/prompts');
const { StringOutputParser } = require('langchain/schema/output_parser');
const { RunnableSequence } = require('langchain/schema/runnable');

// Token optimization through conversation summarization
const optimizeContext = async (apiKeys, model, messages, tokenThreshold = 2000) => {
  // ...implementation details
  return optimizedMessages;
};

// Role-specific memory for Builder and Judge
const createRoleMemory = (role, messages) => {
  // ...implementation details
  return roleMemory;
};
```

### 4. Controller Integration

The LLM controllers have been updated to use the LangChain-powered agents:

```javascript
// src/controllers/llm.js
const { sendToBuilderAgent, sendToJudgeAgent } = require('../services/langchain/agents');
const { optimizeContext, createRoleMemory } = require('../services/langchain/memory');

exports.sendToBuilder = async (req, res) => {
  // ...implementation details
};

exports.sendToJudge = async (req, res) => {
  // ...implementation details
};
```

## Key Features

### 1. Context-Aware Reasoning

The LangChain integration enables more sophisticated context-aware reasoning:

- **Project Context**: Agents have access to project details, technology stack, and status
- **Conversation History**: Previous messages are maintained and optimized for token usage
- **Role-Specific Memory**: Builder remembers code snippets and decisions, Judge remembers feedback and suggestions

### 2. Token Optimization

Long conversations are automatically summarized to optimize token usage:

- **Conversation Summarization**: LangChain's `RunnableSequence` is used to create summaries of older messages
- **Recent Message Preservation**: Most recent messages are kept intact for immediate context
- **Threshold-Based Optimization**: Summarization only occurs when token count exceeds a configurable threshold

### 3. Role-Based Memory

Each agent maintains specialized memory based on its role:

- **Builder Memory**: Focuses on code snippets and implementation decisions
- **Judge Memory**: Focuses on feedback and improvement suggestions
- **Memory Persistence**: Role-specific memory is preserved across conversation turns

## Usage

The LangChain integration is transparent to end users. The existing API endpoints remain the same:

- `POST /api/llm/builder`: Send prompt to Builder agent
- `POST /api/llm/judge`: Send prompt to Judge agent
- `POST /api/llm/switch-roles`: Switch Builder and Judge roles

## Dependencies

The following npm packages have been added:

```
langchain
@langchain/openai
@langchain/anthropic
```

## Future Enhancements

Potential future enhancements using LangChain capabilities:

1. **Tool Integration**: Add LangChain tools for web browsing, code execution, etc.
2. **Structured Output**: Use LangChain's output parsers for more structured responses
3. **Agent Orchestration**: Implement more complex agent workflows using LangGraph
4. **Vector Storage**: Add document retrieval capabilities using vector stores
5. **Fine-Tuning**: Support for fine-tuned models through LangChain's adapters
