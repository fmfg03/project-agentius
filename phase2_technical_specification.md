# Technical Specification: MCP System Phase 2
# LangChain Tooling & LangGraph Integration

## 1. Overview

This technical specification outlines the implementation plan for Phase 2 of the MCP System development, focusing on integrating advanced LangChain tools and implementing a LangGraph-based agent workflow structure. This phase will transform the system from a conversational model to a structured workflow orchestration system with specialized tools and decision paths.

## 2. Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        MCP System Phase 2                        │
└─────────────────────────────────────────────────────────────────┘
                                  │
                ┌─────────────────┼─────────────────┐
                │                 │                 │
    ┌───────────▼───────────┐    │    ┌────────────▼────────────┐
    │   LangChain Tools     │    │    │    LangGraph Engine     │
    └───────────┬───────────┘    │    └────────────┬────────────┘
                │                │                 │
    ┌───────────▼───────────┐    │    ┌────────────▼────────────┐
    │  Code Interpreter     │    │    │     Agent Workflow      │
    └───────────────────────┘    │    └────────────┬────────────┘
                                 │                 │
    ┌───────────▼───────────┐    │    ┌────────────▼────────────┐
    │     GitHub Tool       │    │    │     Operation Nodes     │
    └───────────────────────┘    │    └────────────┬────────────┘
                                 │                 │
    ┌───────────▼───────────┐    │    ┌────────────▼────────────┐
    │  Search/Doc Retriever │    │    │    Conditional Logic    │
    └───────────────────────┘    │    └─────────────────────────┘
                                 │
                ┌───────────────▼───────────────┐
                │      Existing MCP System      │
                │  (with LangChain Integration) │
                └───────────────────────────────┘
```

### 2.2 Component Integration

The Phase 2 implementation will build upon the existing MCP System with LangChain integration, adding new components while preserving the current functionality:

1. **LangChain Tools Layer**: Integration of specialized tools that extend agent capabilities
2. **LangGraph Engine**: Implementation of a structured graph-based workflow for agent interactions
3. **Agent Workflow**: Definition of the Builder ↔ Judge ↔ Finalizer graph structure
4. **Operation Nodes**: Implementation of specialized nodes for workflow operations
5. **Conditional Logic**: Addition of intelligent decision-making based on context and outcomes

## 3. LangChain Tools Integration

### 3.1 Code Interpreter Tool

#### 3.1.1 Description
A sandboxed Python execution environment that allows agents to write, test, and debug code directly within the conversation.

#### 3.1.2 Implementation Details
```javascript
const { PythonInterpreter } = require('langchain/tools/python');

// Configure the code interpreter tool
const codeInterpreterTool = new PythonInterpreter({
  sandboxed: true,
  timeout: 30000, // 30 seconds max execution time
  memoryLimit: '512MB',
  allowedModules: [
    'numpy', 'pandas', 'matplotlib', 'seaborn', 
    'scikit-learn', 'requests', 'beautifulsoup4',
    'flask', 'django', 'fastapi', 'react'
  ],
  workingDirectory: '/tmp/mcp-sandbox'
});

// Register the tool with the agent
const registerCodeInterpreter = (agent) => {
  agent.addTool('code_interpreter', codeInterpreterTool);
};
```

#### 3.1.3 Security Considerations
- Sandbox isolation to prevent system access
- Resource limits to prevent DoS attacks
- Allowlist of permitted modules
- Timeout constraints for long-running code

#### 3.1.4 Usage Patterns
```
// Example usage in agent prompt
When you need to test code, use the code_interpreter tool:
<tool>code_interpreter
import numpy as np
import matplotlib.pyplot as plt

# Generate data
x = np.linspace(0, 10, 100)
y = np.sin(x)

# Create plot
plt.figure(figsize=(8, 4))
plt.plot(x, y)
plt.title('Sine Wave')
plt.savefig('sine_wave.png')
</tool>
```

### 3.2 GitHub Tool

#### 3.2.1 Description
A tool for interacting with GitHub repositories, allowing agents to read, write, and manage files directly in version control.

#### 3.2.2 Implementation Details
```javascript
const { GitHubTool } = require('langchain/tools/github');

// Configure the GitHub tool
const githubTool = new GitHubTool({
  accessToken: process.env.GITHUB_TOKEN,
  repoOwner: '${owner}', // Dynamically set based on project
  repoName: '${repo}',   // Dynamically set based on project
  branch: 'main',
  commitMessage: 'Update from MCP System',
  committer: {
    name: 'MCP System',
    email: 'mcp-system@example.com'
  }
});

// Register the tool with the agent
const registerGitHubTool = (agent, project) => {
  const configuredTool = githubTool.configure({
    repoOwner: project.gitOwner,
    repoName: project.gitRepo
  });
  agent.addTool('github_tool', configuredTool);
};
```

#### 3.2.3 Security Considerations
- Scoped GitHub tokens with minimal permissions
- Rate limiting to prevent API abuse
- Validation of file paths and content
- Audit logging of all GitHub operations

#### 3.2.4 Usage Patterns
```
// Example usage in agent prompt
When you need to read a file from GitHub:
<tool>github_tool.readFile
path: src/components/Header.jsx
</tool>

When you need to write a file to GitHub:
<tool>github_tool.writeFile
path: src/components/Footer.jsx
content: import React from 'react';\n\nconst Footer = () => {\n  return (\n    <footer>Copyright 2025</footer>\n  );\n};\n\nexport default Footer;
</tool>
```

### 3.3 Search/Doc Retriever Tool

#### 3.3.1 Description
A tool for retrieving information from documentation or performing web searches to provide agents with additional context.

#### 3.3.2 Implementation Details
```javascript
const { WebSearchTool } = require('langchain/tools/web-search');
const { DocumentRetrieverTool } = require('langchain/tools/retriever');
const { VectorStore } = require('langchain/vectorstores');

// Configure the web search tool
const webSearchTool = new WebSearchTool({
  apiKey: process.env.SEARCH_API_KEY,
  topK: 5
});

// Configure the document retriever tool
const setupDocRetrieverTool = async (project) => {
  // Load project-specific documentation
  const vectorStore = await VectorStore.fromDocuments(
    project.documentation,
    embeddings
  );
  
  const retriever = vectorStore.asRetriever({
    k: 5,
    searchType: 'similarity'
  });
  
  return new DocumentRetrieverTool({
    name: 'doc_retriever',
    description: 'Searches project documentation for relevant information',
    retriever
  });
};

// Register the tools with the agent
const registerSearchTools = async (agent, project) => {
  agent.addTool('web_search', webSearchTool);
  
  const docRetrieverTool = await setupDocRetrieverTool(project);
  agent.addTool('doc_retriever', docRetrieverTool);
};
```

#### 3.3.3 Security Considerations
- API key management for search services
- Rate limiting for external API calls
- Content filtering for search results
- Caching to reduce duplicate requests

#### 3.3.4 Usage Patterns
```
// Example usage in agent prompt
When you need to search for information:
<tool>web_search
How to implement authentication in Next.js
</tool>

When you need to retrieve project documentation:
<tool>doc_retriever
API endpoints for user management
</tool>
```

## 4. LangGraph Implementation

### 4.1 Graph Structure

#### 4.1.1 Agent Workflow Definition
```javascript
const { StateGraph } = require('langchain/graphs');
const { RunnableLambda } = require('langchain/runnables');

// Define the agent workflow graph
const createAgentGraph = (project) => {
  const graph = new StateGraph({
    channels: {
      code: { value: "" },
      feedback: { value: "" },
      status: { value: "planning" }
    }
  });
  
  // Add nodes for each agent role
  graph.addNode("builder", {
    execute: async (state) => {
      // Builder agent implementation
      return { ...state };
    }
  });
  
  graph.addNode("judge", {
    execute: async (state) => {
      // Judge agent implementation
      return { ...state };
    }
  });
  
  graph.addNode("finalizer", {
    execute: async (state) => {
      // Finalizer agent implementation
      return { ...state };
    }
  });
  
  // Add operation nodes
  graph.addNode("retry", createRetryNode());
  graph.addNode("refactor", createRefactorNode());
  graph.addNode("approve", createApproveNode());
  graph.addNode("escalate", createEscalateNode());
  
  // Define edges between nodes
  graph.addEdge("builder", "judge");
  graph.addEdge("judge", "builder", {
    condition: (state) => state.status === "needs_revision"
  });
  graph.addEdge("judge", "finalizer", {
    condition: (state) => state.status === "approved"
  });
  graph.addEdge("judge", "refactor", {
    condition: (state) => state.status === "needs_refactor"
  });
  graph.addEdge("refactor", "builder");
  graph.addEdge("builder", "retry", {
    condition: (state) => state.status === "error"
  });
  graph.addEdge("retry", "builder");
  graph.addEdge("judge", "escalate", {
    condition: (state) => state.status === "needs_human"
  });
  
  return graph.compile();
};
```

#### 4.1.2 Graph Visualization
```
┌─────────┐     ┌─────────┐     ┌───────────┐
│         │     │         │     │           │
│ Builder ├────►│  Judge  ├────►│ Finalizer │
│         │     │         │     │           │
└────┬────┘     └────┬────┘     └───────────┘
     │               │
     │               │
     │          ┌────▼────┐
     │          │         │
     │◄─────────┤ Refactor│
     │          │         │
     │          └─────────┘
     │
┌────▼────┐     ┌─────────┐
│         │     │         │
│  Retry  │◄────┤ Escalate│
│         │     │         │
└─────────┘     └─────────┘
```

### 4.2 Operation Nodes

#### 4.2.1 Retry Node
```javascript
const createRetryNode = () => {
  return {
    execute: async (state) => {
      // Log the error
      console.log(`Retrying due to error: ${state.error}`);
      
      // Increment retry count
      const retryCount = (state.retryCount || 0) + 1;
      
      // Check if max retries reached
      if (retryCount > 3) {
        return {
          ...state,
          status: "needs_human",
          retryCount
        };
      }
      
      // Prepare for retry
      return {
        ...state,
        status: "planning",
        retryCount,
        feedback: `Previous attempt failed: ${state.error}. This is retry attempt ${retryCount}.`
      };
    }
  };
};
```

#### 4.2.2 Refactor Node
```javascript
const createRefactorNode = () => {
  return {
    execute: async (state) => {
      // Check if file size is too large
      const isLargeFile = state.code.length > 5000;
      
      return {
        ...state,
        status: "planning",
        feedback: isLargeFile 
          ? "The file is too large. Consider breaking it into smaller modules."
          : "Code needs refactoring for better quality and maintainability."
      };
    }
  };
};
```

#### 4.2.3 Approve Node
```javascript
const createApproveNode = () => {
  return {
    execute: async (state) => {
      // Save the approved code to GitHub
      if (state.code) {
        try {
          await githubTool.writeFile({
            path: state.filePath,
            content: state.code
          });
        } catch (error) {
          return {
            ...state,
            status: "error",
            error: `Failed to save to GitHub: ${error.message}`
          };
        }
      }
      
      return {
        ...state,
        status: "complete",
        feedback: "Code has been approved and saved to the repository."
      };
    }
  };
};
```

#### 4.2.4 Escalate Node
```javascript
const createEscalateNode = () => {
  return {
    execute: async (state) => {
      // Send notification to user
      try {
        await notificationService.sendAlert({
          projectId: state.projectId,
          message: `Human intervention needed: ${state.feedback}`,
          code: state.code,
          filePath: state.filePath
        });
      } catch (error) {
        console.error("Failed to send notification:", error);
      }
      
      return {
        ...state,
        status: "waiting_for_human",
        feedback: "This task has been escalated for human review."
      };
    }
  };
};
```

### 4.3 Conditional Logic

#### 4.3.1 File Size-Based Refactoring
```javascript
const shouldRefactorBasedOnSize = (code) => {
  // Check if file is too large
  if (code.length > 5000) {
    return true;
  }
  
  // Check for too many functions in one file
  const functionCount = (code.match(/function\s+\w+\s*\(/g) || []).length;
  if (functionCount > 10) {
    return true;
  }
  
  // Check for too many imports
  const importCount = (code.match(/import\s+/g) || []).length;
  if (importCount > 15) {
    return true;
  }
  
  return false;
};
```

#### 4.3.2 Error-Based Retry Logic
```javascript
const shouldRetryBasedOnError = (error) => {
  // Network errors should be retried
  if (error.includes("network") || error.includes("timeout")) {
    return true;
  }
  
  // API rate limiting errors should be retried with backoff
  if (error.includes("rate limit") || error.includes("429")) {
    return {
      retry: true,
      backoff: true
    };
  }
  
  // Syntax errors should not be retried automatically
  if (error.includes("syntax error") || error.includes("unexpected token")) {
    return false;
  }
  
  // Default to retry for unknown errors
  return true;
};
```

## 5. Integration with Existing System

### 5.1 Backend Integration

```javascript
// src/services/langchain/graph.js
const { createAgentGraph } = require('./graph');
const { registerCodeInterpreter } = require('./tools/codeInterpreter');
const { registerGitHubTool } = require('./tools/github');
const { registerSearchTools } = require('./tools/search');

// Integrate LangGraph with existing LLM controller
exports.enhanceLLMController = async (req, res, next) => {
  try {
    const { conversationId } = req.body;
    
    // Get conversation and project
    const conversation = await Conversation.findById(conversationId);
    const project = await Project.findById(conversation.project);
    const user = await User.findById(conversation.user);
    
    // Create agent instances
    const builderAgent = createBuilderAgent(user.apiKeys, conversation.builderModel, project);
    const judgeAgent = createJudgeAgent(user.apiKeys, conversation.judgeModel, project);
    const finalizerAgent = createFinalizerAgent(user.apiKeys, conversation.builderModel, project);
    
    // Register tools with agents
    registerCodeInterpreter(builderAgent);
    registerGitHubTool(builderAgent, project);
    registerGitHubTool(judgeAgent, project);
    await registerSearchTools(builderAgent, project);
    await registerSearchTools(judgeAgent, project);
    
    // Create and attach the agent graph
    const agentGraph = createAgentGraph(project);
    
    // Attach to request for use in controller
    req.agentGraph = agentGraph;
    req.agents = {
      builder: builderAgent,
      judge: judgeAgent,
      finalizer: finalizerAgent
    };
    
    next();
  } catch (error) {
    console.error('Error in LangGraph middleware:', error);
    next(error);
  }
};
```

### 5.2 Frontend Integration

```typescript
// src/components/ConversationView.tsx
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Typography, Tabs, Tab, Button } from '@mui/material';
import CodeEditor from './CodeEditor';
import PreviewPanel from './PreviewPanel';
import MessageThread from './MessageThread';
import { sendMessage, switchRoles } from '../slices/conversationSlice';

const ConversationView: React.FC = () => {
  const [activeTab, setActiveTab] = useSt
(Content truncated due to size limit. Use line ranges to read in chunks)