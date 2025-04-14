# Technical Specification: MCP System Phase 4
# Vector Storage + Multi-Agent Runtime

## 1. Overview

This technical specification outlines the implementation plan for Phase 4 of the MCP System development, focusing on vector storage integration and multi-agent runtime capabilities. This phase will enhance the system with advanced memory management, cross-project context awareness, and expanded agent collaboration through a team-based approach.

## 2. Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        MCP System Phase 4                        │
└─────────────────────────────────────────────────────────────────┘
                                  │
                ┌─────────────────┼─────────────────┐
                │                 │                 │
    ┌───────────▼───────────┐    │    ┌────────────▼────────────┐
    │    Vector Storage     │    │    │   Multi-Agent Runtime   │
    └───────────┬───────────┘    │    └────────────┬────────────┘
                │                │                 │
    ┌───────────▼───────────┐    │    ┌────────────▼────────────┐
    │  Embedding Generation │    │    │    Agent Orchestration  │
    └───────────┬───────────┘    │    └────────────┬────────────┘
                │                │                 │
    ┌───────────▼───────────┐    │    ┌────────────▼────────────┐
    │   Semantic Search     │    │    │     Specialized Agents  │
    └───────────┬───────────┘    │    └────────────┬────────────┘
                │                │                 │
    ┌───────────▼───────────┐    │    ┌────────────▼────────────┐
    │  Cross-Project Memory │    │    │     Agent Collaboration │
    └───────────────────────┘    │    └─────────────────────────┘
                                 │
                ┌───────────────▼───────────────┐
                │      Existing MCP System      │
                │ (with LangChain & LangGraph)  │
                └───────────────────────────────┘
```

### 2.2 Component Integration

The Phase 4 implementation will build upon the existing MCP System with LangChain integration, LangGraph workflow, and real-time UI/CI/CD capabilities, adding new components while preserving the current functionality:

1. **Vector Storage**: Integration of vector databases for semantic storage and retrieval
2. **Embedding Generation**: Creation of embeddings for various content types
3. **Semantic Search**: Advanced search capabilities across projects and conversations
4. **Cross-Project Memory**: Persistent memory that spans multiple projects
5. **Multi-Agent Runtime**: Framework for managing multiple specialized agents
6. **Agent Orchestration**: Coordination of agent activities and communication
7. **Specialized Agents**: Additional agent roles beyond Builder and Judge
8. **Agent Collaboration**: Mechanisms for agents to work together on tasks

## 3. Vector Storage Implementation

### 3.1 Vector Database Selection

After evaluating various vector database options, we recommend implementing support for multiple providers with Chroma as the default:

| Database | Pros | Cons | Use Case |
|----------|------|------|----------|
| Chroma | Easy to set up, Python-native, open-source | Less scalable for very large datasets | Default for most deployments |
| Weaviate | Production-ready, cloud or self-hosted | More complex setup, requires more resources | Enterprise deployments |
| FAISS | High performance, memory-efficient | Limited metadata filtering | Local development, smaller deployments |

#### 3.1.1 Vector Database Implementation

```javascript
// src/services/vectordb/index.js
const ChromaClient = require('./providers/chroma');
const WeaviateClient = require('./providers/weaviate');
const FaissClient = require('./providers/faiss');

class VectorDBService {
  constructor(config) {
    this.config = config;
    this.provider = config.provider || 'chroma';
    this.client = null;
    
    // Initialize the selected provider
    this.initialize();
  }
  
  initialize() {
    switch (this.provider) {
      case 'chroma':
        this.client = new ChromaClient(this.config.chroma);
        break;
      case 'weaviate':
        this.client = new WeaviateClient(this.config.weaviate);
        break;
      case 'faiss':
        this.client = new FaissClient(this.config.faiss);
        break;
      default:
        throw new Error(`Unsupported vector database provider: ${this.provider}`);
    }
  }
  
  async addDocument(document, metadata = {}, collectionName = 'default') {
    return this.client.addDocument(document, metadata, collectionName);
  }
  
  async addDocuments(documents, metadataList = [], collectionName = 'default') {
    return this.client.addDocuments(documents, metadataList, collectionName);
  }
  
  async search(query, collectionName = 'default', limit = 5, filters = {}) {
    return this.client.search(query, collectionName, limit, filters);
  }
  
  async deleteDocument(documentId, collectionName = 'default') {
    return this.client.deleteDocument(documentId, collectionName);
  }
  
  async getCollection(collectionName = 'default') {
    return this.client.getCollection(collectionName);
  }
  
  async listCollections() {
    return this.client.listCollections();
  }
  
  async createCollection(collectionName, options = {}) {
    return this.client.createCollection(collectionName, options);
  }
}

module.exports = VectorDBService;
```

#### 3.1.2 Chroma Implementation

```javascript
// src/services/vectordb/providers/chroma.js
const { ChromaClient, OpenAIEmbeddingFunction } = require('chromadb');

class ChromaDBClient {
  constructor(config) {
    this.config = config;
    this.client = new ChromaClient({
      path: config.url || 'http://localhost:8000',
    });
    
    // Initialize embedding function
    this.embeddingFunction = new OpenAIEmbeddingFunction({
      openai_api_key: process.env.OPENAI_API_KEY,
      model_name: config.embeddingModel || 'text-embedding-ada-002',
    });
    
    this.collections = {};
  }
  
  async getCollection(collectionName) {
    if (!this.collections[collectionName]) {
      try {
        this.collections[collectionName] = await this.client.getCollection({
          name: collectionName,
          embeddingFunction: this.embeddingFunction,
        });
      } catch (error) {
        // Collection doesn't exist, create it
        this.collections[collectionName] = await this.client.createCollection({
          name: collectionName,
          embeddingFunction: this.embeddingFunction,
        });
      }
    }
    
    return this.collections[collectionName];
  }
  
  async createCollection(collectionName, options = {}) {
    this.collections[collectionName] = await this.client.createCollection({
      name: collectionName,
      embeddingFunction: this.embeddingFunction,
      ...options,
    });
    
    return this.collections[collectionName];
  }
  
  async listCollections() {
    return this.client.listCollections();
  }
  
  async addDocument(document, metadata = {}, collectionName = 'default') {
    const collection = await this.getCollection(collectionName);
    
    const id = metadata.id || `doc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    await collection.add({
      ids: [id],
      documents: [document],
      metadatas: [metadata],
    });
    
    return { id, document, metadata };
  }
  
  async addDocuments(documents, metadataList = [], collectionName = 'default') {
    const collection = await this.getCollection(collectionName);
    
    const ids = documents.map((_, index) => {
      return metadataList[index]?.id || `doc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${index}`;
    });
    
    await collection.add({
      ids,
      documents,
      metadatas: metadataList.length === documents.length ? metadataList : documents.map(() => ({})),
    });
    
    return ids.map((id, index) => ({
      id,
      document: documents[index],
      metadata: metadataList[index] || {},
    }));
  }
  
  async search(query, collectionName = 'default', limit = 5, filters = {}) {
    const collection = await this.getCollection(collectionName);
    
    const results = await collection.query({
      queryTexts: [query],
      nResults: limit,
      where: filters,
    });
    
    return results.documents[0].map((document, index) => ({
      document,
      metadata: results.metadatas[0][index],
      id: results.ids[0][index],
      score: results.distances ? results.distances[0][index] : null,
    }));
  }
  
  async deleteDocument(documentId, collectionName = 'default') {
    const collection = await this.getCollection(collectionName);
    
    await collection.delete({
      ids: [documentId],
    });
    
    return { success: true, id: documentId };
  }
}

module.exports = ChromaDBClient;
```

### 3.2 Embedding Generation

#### 3.2.1 Embedding Service

```javascript
// src/services/embedding.js
const { OpenAIEmbeddings, CohereEmbeddings } = require('langchain/embeddings');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');

class EmbeddingService {
  constructor(config = {}) {
    this.provider = config.provider || 'openai';
    this.model = config.model || 'text-embedding-ada-002';
    this.dimensions = config.dimensions || 1536;
    
    // Initialize the embedding model
    this.initialize();
  }
  
  initialize() {
    switch (this.provider) {
      case 'openai':
        this.embeddings = new OpenAIEmbeddings({
          openAIApiKey: process.env.OPENAI_API_KEY,
          modelName: this.model,
          dimensions: this.dimensions,
        });
        break;
      case 'cohere':
        this.embeddings = new CohereEmbeddings({
          apiKey: process.env.COHERE_API_KEY,
          model: this.model,
        });
        break;
      default:
        throw new Error(`Unsupported embedding provider: ${this.provider}`);
    }
    
    // Initialize text splitter
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
  }
  
  async embedText(text) {
    return this.embeddings.embedQuery(text);
  }
  
  async embedDocuments(documents) {
    return this.embeddings.embedDocuments(documents);
  }
  
  async splitAndEmbedText(text) {
    const chunks = await this.textSplitter.splitText(text);
    const embeddings = await this.embedDocuments(chunks);
    
    return chunks.map((chunk, index) => ({
      text: chunk,
      embedding: embeddings[index],
    }));
  }
  
  async processContentForVectorStorage(content, type, metadata = {}) {
    let textToEmbed;
    
    switch (type) {
      case 'code':
        // For code, we might want to keep chunks aligned with function boundaries
        textToEmbed = content;
        break;
      case 'conversation':
        // For conversations, format as a string with clear role indicators
        textToEmbed = content.messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
        break;
      case 'projectBrief':
        // For project briefs, use the full text
        textToEmbed = content.description;
        break;
      default:
        textToEmbed = content;
    }
    
    const chunks = await this.textSplitter.splitText(textToEmbed);
    
    return chunks.map((chunk, index) => ({
      text: chunk,
      metadata: {
        ...metadata,
        chunk_index: index,
        total_chunks: chunks.length,
        content_type: type,
      },
    }));
  }
}

module.exports = EmbeddingService;
```

### 3.3 Semantic Search

#### 3.3.1 Search Service

```javascript
// src/services/search.js
const VectorDBService = require('./vectordb');
const EmbeddingService = require('./embedding');

class SemanticSearchService {
  constructor(config = {}) {
    this.vectorDB = new VectorDBService(config.vectorDB || {});
    this.embedding = new EmbeddingService(config.embedding || {});
  }
  
  async searchAcrossProjects(query, options = {}) {
    const { limit = 10, projectIds = [], contentTypes = [], minScore = 0.7 } = options;
    
    // Build filters
    const filters = {};
    
    if (projectIds.length > 0) {
      filters.project_id = { $in: projectIds };
    }
    
    if (contentTypes.length > 0) {
      filters.content_type = { $in: contentTypes };
    }
    
    // Search in the global collection
    const results = await this.vectorDB.search(
      query,
      'global',
      limit,
      filters
    );
    
    // Filter by score if needed
    return results.filter(result => result.score >= minScore);
  }
  
  async searchWithinProject(query, projectId, options = {}) {
    const { limit = 10, contentTypes = [], minScore = 0.7 } = options;
    
    // Build filters
    const filters = {
      project_id: projectId,
    };
    
    if (contentTypes.length > 0) {
      filters.content_type = { $in: contentTypes };
    }
    
    // Search in the project-specific collection
    const results = await this.vectorDB.search(
      query,
      `project-${projectId}`,
      limit,
      filters
    );
    
    // Filter by score if needed
    return results.filter(result => result.score >= minScore);
  }
  
  async searchCodeSnippets(query, projectId, options = {}) {
    return this.searchWithinProject(query, projectId, {
      ...options,
      contentTypes: ['code'],
    });
  }
  
  async searchConversations(query, projectId, options = {}) {
    return this.searchWithinProject(query, projectId, {
      ...options,
      contentTypes: ['conversation'],
    });
  }
  
  async searchProjectBriefs(query, options = {}) {
    return this.searchAcrossProjects(query, {
      ...options,
      contentTypes: ['projectBrief'],
    });
  }
  
  async indexContent(content, type, metadata = {}) {
    // Process content into chunks with metadata
    const chunks = await this.embedding.processContentForVectorStorage(content, type, metadata);
    
    // Store in global collection
    await this.vectorDB.addDocuments(
      chunks.map(chunk => chunk.text),
      chunks.map(chunk => chunk.metadata),
      'global'
    );
    
    // If project-specific, also store in project collection
    if (metadata.project_id) {
      await this.vectorDB.addDocuments(
        chunks.map(chunk => chunk.text),
        chunks.map(chunk => chunk.metadata),
        `project-${metadata.project_id}`
      );
    }
    
    return {
      success: true,
      chunks: chunks.length,
    };
  }
}

module.exports = SemanticSearchService;
```

### 3.4 Cross-Project Memory

#### 3.4.1 Memory Service

```javascript
// src/services/memory.js
const SemanticSearchService = require('./search');
const VectorDBService = require('./vectordb');
const EmbeddingService = require('./embedding');

class MemoryService {
  constructor(config = {}) {
    this.search = new SemanticSearchService(config);
    this.vectorDB = new VectorDBService(config.vectorDB || {});
    this.embedding = new EmbeddingService(config.embedding || {});
    
    // Memory collections
    this.collections = {
      projectBriefs: 'project-briefs',
      codeSnippets: 'code-snippets',
      conversations: 'conversations',
      agentObservations: 'agent-observations',
    };
  }
  
  async storeProjectBrief(project) {
    const { _id, name, description, requirements, user } = project;
    
    const content = {
      description: `Project Name: ${name}\n\nDescription: ${description}\n\nRequirements: ${requirements}`,
    };
    
    const metadata = {
      project_id: _id.toString(),
      user_id: user.toString(),
      content_type: 'projectBrief',
      name,
    };
    
    return this.search.indexContent(content, 'projectBrief', metadata);
  }
  
  async storeCodeSnippet(code, metadata) {
    const { projectId, filePath, language, commitId } = metadata;
    
    const enhancedMetadata = {
      project_id: projectId,
      file_path: filePath,
      language,
      commit_id: commitId,
      content_type: 'code',
      timestamp: new Date().toISOString(),
    };
    
    return this.search.indexContent(code, 'code', enhancedMetadata);
  }
  
  async storeConversation(conversation) {
    const { _id, project, messages, user } = conversation;
    
    const metadata = {
      project_id: project.toString(),
      user_id: user.toString(),
      conversation_id: _id.toString(),
      content_type: 'conversation',
      timestamp: new Date().toISOString(),
      message_count: messages.length,
    };
    
    return this.search.indexContent({ messages }, 'conversation', metadata);
  }
  
  async storeAgentObservation(observation) {
    const { agent, projectId, content, context } = observation;
    
    const metadata = {
      project_id: projectId,
      agent,
      content_type: 'agentObservation',
      timestamp: new Date().toISOString(),
      context: JSON.stringify(context),
    };
    
    return this.search.indexContent(content, 'agentObservation', metadata);
  }
  
  async retrieveRelevantMemories(query, options = {}) {
    const { projectId, limit = 10, includeGlobal = true } = options;
    
    let memories = [];
    
    // Search within project
    if (projectId) {
      const projectMemories = await this.search.searchWithinProject(query, projectId, {
        limit,
      });
      
      memories = memories.concat(projectMemories);
    }
    
    // Search across projects if needed
    if (includeGlobal && (!projectId || memories.length < limit)) {
      const globalLimit = projectId ? limit - memories.length : limit;
      
      if (globalLimit > 0) {
        const globalMemories = await this.search.searchAcrossProjects(query, {
          limit: globalLimit,
          projectIds: projectId ? [projectId] : [],
        });
        
        memories = memories.concat(globalMemories);
      }
    }
    
    // Sort by relevance
    memories.sort((a, b) => a.score - b.score);
    
    return memories.slice(0, limit);
  }
  
  async retrieveProjectContext(projectId) {
    // Get project brief
    const projectBrief = await this.search.searchWithinProject('project brief', projectId, {
      limit: 1,
      contentTypes: ['projectBrief'],
    });
    
    // Get recent code snippets
    const codeSnippets = await this.search.searchWithinProject('recent code', projectId, {
      limit: 5,
      contentTypes: ['code'],
    });
    
    // Get recent conversations
    const conversations = await this.search.searchWithinProject('recent conversation', projectId, {
      limit: 3,
      contentTypes: ['conversation'],
    });
    
    return {
      projectBrief: projectBrief[0]?.document || '',
      codeSnippets: codeSnippets.map(snippet => snippet.document),
      conversations: conversations.map(convo => convo.document),
    };
  }
  
  async retrieveSimilarCode(code, projectId, limit = 5) {
    return this.search.searchWithinProject(code, projectId, {
      limit,
      contentTypes: ['code'],
    });
  }
}

module.exports = MemoryService;
```

## 4. Multi-Agent Runtime Implementation

### 4.1 Agent Orchestration

#### 4.1.1 Agent Manager

```javascript
// src/services/agents/manager.js
const { StateGraph } = require('langchain/graphs');
const { RunnableLambda } = require('langchain/runnables');
const BuilderAgent = require('./builder');
const JudgeAgent = require('./judge');
const DebuggerAgent = require('./debugger');
const RefactorAgent = require('./refactor');
const MemoryService = require('../memory');

class AgentManager {
  constructor(config = {}) {
    this.config = config;
    this.memory = new MemoryService(config.memory || {});
    
    // Initialize agent instances
    this.agents = {
      builder: new BuilderAgent(config.builder || {}),
      judge: new JudgeAgent(config.judge || {}),
      debugger: new DebuggerAgent(config.debugger || {}),
      refactor: new RefactorAgent(config.refactor || {}),
    };
    
    // Active agent workflows
    this.workflows = {};
  }
  
  async createWorkflow(projectId, options = {}) {
    const { initialAgent = 'builder', initialTask = '' } = options;
    
    // Create a new workflow graph
    const graph = new StateGraph({
      channels: {
        code: { value: "" },
        feedback: { value: "" },
        status: { value: "planning" },
        error: { value: "" },
        task: { value: initialTask },
      }
    });
    
    // Add nodes for each agent
    Object.entries(this.agents).forEach(([name, agent]) => {
      graph.addNode(name, {
        execute: async (state) => {
          try {
            // Retrieve relevant memories
            const memories = await this.memory.retrieveRelevantMemories(
              state.task,
              { projectId, limit: 5 }
            );
            
            // Execute agent with state and memories
            const result = await agent.execute({
              ...state,
              projectId,
              memories,
            });
            
            // Store agent observation
            await this.memory.storeAgentObservation({
              agent: name,
              projectId,
              content: result.observation || '',
              context: {
                task: state.task,
                status: result.status,
              },
            });
            
            return { ...state, ...result };
          } catch (error) {
            console.error(`Error in ${name} agent:`, error);
            return {
              ...state,
              status: "error",
              error: error.message,
            };
          }
        }
      });
    });
    
    // Define edges between nodes
    graph.addEdge('builder', 'judge');
    
    graph.addEdge('judge', 'builder', {
      condition: (state) => state.status === "needs_revision"
    });
    
    graph.addEdge('judge', 'refactor', {
      condition: (state) => state.status === "needs_refactor"
    });
    
    graph.addEdge('refactor', 'judge');
    
    graph.addEdge('builder', 'debugger', {
      condition: (state) => state.status === "error"
    });
    
    graph.addEdge('debugger', 'builder');
    
    graph.addEdge('judge', 'complete', {
      condition: (state) => state.status === "approved"
    });
    
    // Add complete node
    graph.addNode('complete', {
      execute: async (state) => {
        return { ...state, status: "complete" };
      }
    });
    
    // Compile the graph
    const workflow = graph.compile();
    
    // Store the workflow
    const workflowId = `${projectId}-${Date.now()}`;
    this.workflows[workflowId] = {
      graph: workflow,
      projectId,
      status: 'created',
      createdAt: new Date(),
    };
    
    return {
      workflowId,
      initialState: {
        code: "",
        feedback: "",
        status: "planning",
        error: "",
        task: initialTask,
      },
    };
  }
  
  async executeWorkflow(workflowId, input = {}) {
    const workflow = this.workflows[workflowId];
    
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }
    
    // Update workflow status
    workflow.status = 'running';
    workflow.lastRun = new Date();
    
    try {
      // Execute the workflow
      const result = await workflow.graph.invoke(input);
      
      // Update workflow status
      workflow.status = 'completed';
      workflow.lastCompleted = new Date();
      
      return result;
    } catch (error) {
      // Update workflow status
      workflow.status = 'failed';
      workflow.error = error.message;
      
      throw error;
    }
  }
  
  async forkWorkflow(workflowId, options = {}) {
    const { task, agent } = options;
    const parentWorkflow = this.workflows[workflowId];
    
    if (!parentWorkflow) {
      throw new Error(`Parent workflow not found: ${workflowId}`);
    }
    
    // Create a new workflow
    const { workflowId: newWorkflowId } = await this.createWorkflow(
      parentWorkflow.projectId,
      {
        initialAgent: agent,
        initialTask: task,
      }
    );
    
    // Link the workflows
    this.workflows[newWorkflowId].parentId = workflowId;
    
    return {
      workflowId: newWorkflowId,
    };
  }
  
  async joinWorkflows(workflowIds, options = {}) {
    const { targetWorkflowId, mergeStrategy = 'sequential' } = options;
    
    // Validate workflows
    const workflows = workflowIds.map(id => {
      const workflow = this.workflows[id];
      if (!workflow) {
        throw new Error(`Workflow not found: ${id}`);
      }
      return workflow;
    });
    
    // Check if all workflows are from the same project
    const projectId = workflows[0].projectId;
    if (!workflows.every(w => w.projectId === projectId)) {
      throw new Error('Cannot join workflows from different projects');
    }
    
    // Get target workflow
    const targetWorkflow = this.workflows[targetWorkflowId];
    if (!targetWorkflow) {
      throw new Error(`Target workflow not found: ${targetWorkflowId}`);
    }
    
    // Execute workflows based on merge strategy
    if (mergeStrategy === 'sequential') {
      // Execute workflows one after another
      let finalResult = null;
      
      for (const workflowId of workflowIds) {
        const result = await this.executeWorkflow(workflowId);
        finalResult = result;
      }
      
      // Execute target workflow with combined results
      return this.executeWorkflow(targetWorkflowId, finalResult);
    } else if (mergeStrategy === 'parallel') {
      // Execute workflows in parallel
      const results = await Promise.all(
        workflowIds.map(id => this.executeWorkflow(id))
      );
      
      // Combine results
      const combinedResult = results.reduce((combined, result) => {
        return {
          ...combined,
          code: combined.code + '\n\n' + result.code,
          feedback: combined.feedback + '\n\n' + result.feedback,
        };
      }, { code: '', feedback: '' });
      
      // Execute target workflow with combined results
      return this.executeWorkflow(targetWorkflowId, combinedResult);
    }
    
    throw new Error(`Unsupported merge strategy: ${mergeStrategy}`);
  }
  
  getWorkflow(workflowId) {
    return this.workflows[workflowId];
  }
  
  listWorkflows(projectId) {
    return Object.entries(this.workflows)
      .filter(([_, workflow]) => workflow.projectId === projectId)
      .map(([id, workflow]) => ({
        id,
        status: workflow.status,
        createdAt: workflow.createdAt,
        lastRun: workflow.lastRun,
        lastCompleted: workflow.lastCompleted,
        parentId: workflow.parentId,
      }));
  }
}

module.exports = AgentManager;
```

### 4.2 Specialized Agents

#### 4.2.1 Base Agent

```javascript
// src/services/agents/base.js
const { ChatOpenAI } = require('langchain/chat_models/openai');
const { ChatAnthropic } = require('langchain/chat_models/anthropic');
const { SystemMessage, HumanMessage, AIMessage } = require('langchain/schema');

class BaseAgent {
  constructor(config = {}) {
    this.config = config;
    this.provider = config.provider || 'openai';
    this.model = config.model || 'gpt-4';
    this.temperature = config.temperature || 0.7;
    this.maxTokens = config.maxTokens || 4000;
    
    // Initialize the LLM
    this.initialize();
  }
  
  initialize() {
    switch (this.provider) {
      case 'openai':
        this.llm = new ChatOpenAI({
          modelName: this.model,
          temperature: this.temperature,
          maxTokens: this.maxTokens,
          openAIApiKey: process.env.OPENAI_API_KEY,
        });
        break;
      case 'anthropic':
        this.llm = new ChatAnthropic({
          modelName: this.model,
          temperature: this.temperature,
          maxTokens: this.maxTokens,
          anthropicApiKey: process.env.ANTHROPIC_API_KEY,
        });
        break;
      default:
        throw new Error(`Unsupported provider: ${this.provider}`);
    }
  }
  
  async execute(input) {
    throw new Error('Method not implemented');
  }
  
  async formatMemoriesForPrompt(memories) {
    if (!memories || memories.length === 0) {
      return '';
    }
    
    return `
Relevant information from memory:
${memories.map((memory, index) => `[Memory ${index + 1}] ${memory.document}`).join('\n\n')}
`;
  }
  
  async createMessages(input, systemPrompt) {
    const { task, code, feedback, memories } = input;
    
    const messages = [
      new SystemMessage(systemPrompt),
    ];
    
    // Add memories if available
    if (memories && memories.length > 0) {
      const memoriesText = await this.formatMemoriesForPrompt(memories);
      messages.push(new SystemMessage(memoriesText));
    }
    
    // Add task
    messages.push(new HumanMessage(`Task: ${task}`));
    
    // Add code if available
    if (code) {
      messages.push(new AIMessage(`Current code:\n\`\`\`\n${code}\n\`\`\``));
    }
    
    // Add feedback if available
    if (feedback) {
      messages.push(new HumanMessage(`Feedback: ${feedback}`));
    }
    
    return messages;
  }
}

module.exports = BaseAgent;
```

#### 4.2.2 Debugger Agent

```javascript
// src/services/agents/debugger.js
const BaseAgent = require('./base');
const { AIMessage } = require('langchain/schema');

class DebuggerAgent extends BaseAgent {
  constructor(config = {}) {
    super({
      ...config,
      model: config.model || 'gpt-4',
      temperature: config.temperature || 0.5,
    });
    
    this.systemPrompt = `
You are a specialized Debugger agent in the MCP System. Your role is to identify and fix errors in code.

Your responsibilities:
1. Analyze error messages and code to identify the root cause of issues
2. Provide clear explanations of what went wrong
3. Fix the code to resolve the error
4. Suggest improvements to prevent similar errors in the future

When you respond, use the following format:
- Error Analysis: [Your analysis of the error]
- Root Cause: [The root cause of the error]
- Fixed Code: [The corrected code]
- Prevention Tips: [Suggestions to prevent similar errors]

Your output will be used by the Builder agent to continue development.
`;
  }
  
  async execute(input) {
    const { error, code, task, projectId, memories } = input;
    
    // Create messages
    const messages = await this.createMessages(
      { task, code, error, memories },
      this.systemPrompt
    );
    
    // Add error message
    if (error) {
      messages.push(new AIMessage(`Error encountered:\n${error}`));
    }
    
    // Call the LLM
    const response = await this.llm.call(messages);
    
    // Parse the response
    const responseText = response.content;
    
    // Extract fixed code
    const fixedCodeMatch = responseText.match(/Fixed Code:[\s\n]*(```[\s\S]*?```|[\s\S]*?)(?=Prevention Tips:|$)/i);
    const fixedCode = fixedCodeMatch ? fixedCodeMatch[1].replace(/```[\w]*\n|```/g, '') : '';
    
    // Extract analysis
    const analysisMatch = responseText.match(/Error Analysis:[\s\n]*([\s\S]*?)(?=Root Cause:|$)/i);
    const analysis = analysisMatch ? analysisMatch[1].trim() : '';
    
    return {
      code: fixedCode,
      feedback: responseText,
      status: 'fixed',
      observation: analysis,
    };
  }
}

module.exports = DebuggerAgent;
```

#### 4.2.3 Refactor Agent

```javascript
// src/services/agents/refactor.js
const BaseAgent = require('./base');

class RefactorAgent extends BaseAgent {
  constructor(config = {}) {
    super({
      ...config,
      model: config.model || 'gpt-4',
      temperature: config.temperature || 0.3,
    });
    
    this.systemPrompt = `
You are a specialized Refactor agent in the MCP System. Your role is to improve code quality without changing functionality.

Your responsibilities:
1. Analyze code for potential improvements in structure, readability, and performance
2. Refactor code to follow best practices and design patterns
3. Ensure the refactored code maintains the same functionality
4. Provide clear explanations of the changes made and their benefits

When you respond, use the following format:
- Refactoring Analysis: [Your analysis of the code]
- Refactored Code: [The improved code]
- Changes Made: [Summary of changes and their benefits]

Your output will be reviewed by the Judge agent before being accepted.
`;
  }
  
  async execute(input) {
    const { code, task, feedback, projectId, memories } = input;
    
    // Create messages
    const messages = await this.createMessages(
      { task, code, feedback, memories },
      this.systemPrompt
    );
    
    // Call the LLM
    const response = await this.llm.call(messages);
    
    // Parse the response
    const responseText = response.content;
    
    // Extract refactored code
    const refactoredCodeMatch = responseText.match(/Refactored Code:[\s\n]*(```[\s\S]*?```|[\s\S]*?)(?=Changes Made:|$)/i);
    const refactoredCode = refactoredCodeMatch ? refactoredCodeMatch[1].replace(/```[\w]*\n|```/g, '') : '';
    
    // Extract analysis
    const analysisMatch = responseText.match(/Refactoring Analysis:[\s\n]*([\s\S]*?)(?=Refactored Code:|$)/i);
    const analysis = analysisMatch ? analysisMatch[1].trim() : '';
    
    return {
      code: refactoredCode,
      feedback: responseText,
      status: 'refactored',
      observation: analysis,
    };
  }
}

module.exports = RefactorAgent;
```

### 4.3 Agent Collaboration

#### 4.3.1 Collaboration Controller

```javascript
// src/controllers/collaboration.js
const AgentManager = require('../services/agents/manager');
const Project = require('../models/project');
const Workflow = require('../models/workflow');

// Initialize agent manager
const agentManager = new AgentManager();

exports.createWorkflow = async (req, res) => {
  try {
    const { projectId, initialAgent, initialTask } = req.body;
    
    // Validate project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }
    
    // Create workflow
    const result = await agentManager.createWorkflow(projectId, {
      initialAgent,
      initialTask,
    });
    
    // Save workflow to database
    const workflow = new Workflow({
      project: projectId,
      workflowId: result.workflowId,
      initialAgent,
      initialTask,
      status: 'created',
    });
    
    await workflow.save();
    
    return res.status(200).json({
      success: true,
      workflow: {
        id: result.workflowId,
        initialState: result.initialState,
      },
    });
  } catch (error) {
    console.error('Error creating workflow:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create workflow',
      error: error.message,
    });
  }
};

exports.executeWorkflow = async (req, res) => {
  try {
    const { workflowId } = req.params;
    const { input } = req.body;
    
    // Get workflow from database
    const workflow = await Workflow.findOne({ workflowId });
    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found',
      });
    }
    
    // Update workflow status
    workflow.status = 'running';
    workflow.lastRun = new Date();
    await workflow.save();
    
    // Execute workflow
    const result = await agentManager.executeWorkflow(workflowId, input);
    
    // Update workflow status
    workflow.status = 'completed';
    workflow.lastCompleted = new Date();
    await workflow.save();
    
    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(workflow.project.toString()).emit('workflow_completed', {
        workflowId,
        result,
      });
    }
    
    return res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Error executing workflow:', error);
    
    // Update workflow status in database
    const workflow = await Workflow.findOne({ workflowId: req.params.workflowId });
    if (workflow) {
      workflow.status = 'failed';
      workflow.error = error.message;
      await workflow.save();
    }
    
    return res.status(500).json({
      success: false,
      message: 'Failed to execute workflow',
      error: error.message,
    });
  }
};

exports.forkWorkflow = async (req, res) => {
  try {
    const { workflowId } = req.params;
    const { task, agent } = req.body;
    
    // Get workflow from database
    const parentWorkflow = await Workflow.findOne({ workflowId });
    if (!parentWorkflow) {
      return res.status(404).json({
        success: false,
        message: 'Parent workflow not found',
      });
    }
    
    // Fork workflow
    const result = await agentManager.forkWorkflow(workflowId, {
      task,
      agent,
    });
    
    // Save new workflow to database
    const workflow = new Workflow({
      project: parentWorkflow.project,
      workflowId: result.workflowId,
      initialAgent: agent,
      initialTask: task,
      status: 'created',
      parentWorkflow: parentWorkflow._id,
    });
    
    await workflow.save();
    
    return res.status(200).json({
      success: true,
      workflow: {
        id: result.workflowId,
      },
    });
  } catch (error) {
    console.error('Error forking workflow:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fork workflow',
      error: error.message,
    });
  }
};

exports.joinWorkflows = async (req, res) => {
  try {
    const { workflowIds, targetWorkflowId, mergeStrategy } = req.body;
    
    // Validate workflows
    const workflows = await Workflow.find({
      workflowId: { $in: workflowIds },
    });
    
    if (workflows.length !== workflowIds.length) {
      return res.status(404).json({
        success: false,
        message: 'One or more workflows not found',
      });
    }
    
    // Get target workflow
    const targetWorkflow = await Workflow.findOne({
      workflowId: targetWorkflowId,
    });
    
    if (!targetWorkflow) {
      return res.status(404).json({
        success: false,
        message: 'Target workflow not found',
      });
    }
    
    // Join workflows
    const result = await agentManager.joinWorkflows(workflowIds, {
      targetWorkflowId,
      mergeStrategy,
    });
    
    // Update target workflow status
    targetWorkflow.status = 'completed';
    targetWorkflow.lastCompleted = new Date();
    targetWorkflow.mergedWorkflows = workflows.map(w => w._id);
    await targetWorkflow.save();
    
    return res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Error joining workflows:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to join workflows',
      error: error.message,
    });
  }
};

exports.getWorkflow = async (req, res) => {
  try {
    const { workflowId } = req.params;
    
    // Get workflow from database
    const workflow = await Workflow.findOne({ workflowId })
      .populate('project', 'name')
      .populate('parentWorkflow', 'workflowId');
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found',
      });
    }
    
    // Get runtime workflow
    const runtimeWorkflow = agentManager.getWorkflow(workflowId);
    
    return res.status(200).json({
      success: true,
      workflow: {
        ...workflow.toObject(),
        runtime: runtimeWorkflow,
      },
    });
  } catch (error) {
    console.error('Error getting workflow:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get workflow',
      error: error.message,
    });
  }
};

exports.listWorkflows = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Get workflows from database
    const workflows = await Workflow.find({ project: projectId })
      .sort('-createdAt')
      .populate('parentWorkflow', 'workflowId');
    
    return res.status(200).json({
      success: true,
      workflows,
    });
  } catch (error) {
    console.error('Error listing workflows:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to list workflows',
      error: error.message,
    });
  }
};
```

#### 4.3.2 Workflow Model

```javascript
// src/models/workflow.js
const mongoose = require('mongoose');

const workflowSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  workflowId: {
    type: String,
    required: true,
    unique: true,
  },
  initialAgent: {
    type: String,
    required: true,
    enum: ['builder', 'judge', 'debugger', 'refactor'],
  },
  initialTask: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['created', 'running', 'completed', 'failed'],
    default: 'created',
  },
  error: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastRun: {
    type: Date,
  },
  lastCompleted: {
    type: Date,
  },
  parentWorkflow: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workflow',
  },
  mergedWorkflows: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workflow',
  }],
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
});

module.exports = mongoose.model('Workflow', workflowSchema);
```

## 5. Frontend Integration

### 5.1 Memory Explorer Component

```javascript
// src/components/MemoryExplorer.jsx
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Search as SearchIcon,
  Code as CodeIcon,
  Chat as ChatIcon,
  Description as DescriptionIcon,
  Lightbulb as LightbulbIcon,
} from '@mui/icons-material';
import { searchMemories } from '../slices/memorySlice';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs';

const MemoryExplorer = ({ projectId }) => {
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isSearching, setIsSearching] = useState(false);
  
  const memories = useSelector((state) => state.memory.items);
  const loading = useSelector((state) => state.memory.loading);
  
  const handleSearch = () => {
    if (searchQuery.trim()) {
      setIsSearching(true);
      dispatch(searchMemories({
        query: searchQuery,
        projectId,
        contentTypes: activeTab === 'all' ? [] : [activeTab],
      }));
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    
    if (isSearching) {
      dispatch(searchMemories({
        query: searchQuery,
        projectId,
        contentTypes: newValue === 'all' ? [] : [newValue],
      }));
    }
  };
  
  const renderMemoryContent = (memory) => {
    const { document, metadata } = memory;
    
    switch (metadata.content_type) {
      case 'code':
        return (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {metadata.file_path} ({metadata.language})
            </Typography>
            <SyntaxHighlighter
              language={metadata.language || 'javascript'}
              style={vs2015}
              customStyle={{ maxHeight: '200px', overflow: 'auto' }}
            >
              {document}
            </SyntaxHighlighter>
          </Box>
        );
      case 'conversation':
        return (
          <Box sx={{ mt: 1, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="body2">{document}</Typography>
          </Box>
        );
      case 'projectBrief':
        return (
          <Box sx={{ mt: 1, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="body2">{document}</Typography>
          </Box>
        );
      case 'agentObservation':
        return (
          <Box sx={{ mt: 1, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="body2">{document}</Typography>
          </Box>
        );
      default:
        return (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2">{document}</Typography>
          </Box>
        );
    }
  };
  
  const getMemoryIcon = (type) => {
    switch (type) {
      case 'code':
        return <CodeIcon />;
      case 'conversation':
        return <ChatIcon />;
      case 'projectBrief':
        return <DescriptionIcon />;
      case 'agentObservation':
        return <LightbulbIcon />;
      default:
        return <SearchIcon />;
    }
  };
  
  return (
    <Paper
      elevation={2}
      sx={{
        height: '100%',
        maxHeight: 'calc(100vh - 200px)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" gutterBottom>
          Memory Explorer
        </Typography>
        
        <Box sx={{ display: 'flex', mb: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Search project memory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <Button
            variant="contained"
            color="primary"
            sx={{ ml: 1 }}
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : <SearchIcon />}
          </Button>
        </Box>
        
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All" value="all" />
          <Tab label="Code" value="code" />
          <Tab label="Conversations" value="conversation" />
          <Tab label="Project Brief" value="projectBrief" />
          <Tab label="Observations" value="agentObservation" />
        </Tabs>
      </Box>
      
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : memories.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              {isSearching
                ? 'No results found. Try a different search query.'
                : 'Search project memory to find relevant information.'}
            </Typography>
          </Box>
        ) : (
          <List>
            {memories.map((memory, index) => (
              <React.Fragment key={memory.id || index}>
                {index > 0 && <Divider component="li" />}
                <ListItem alignItems="flex-start">
                  <Box sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      {getMemoryIcon(memory.metadata.content_type)}
                      <Box sx={{ ml: 1 }}>
                        <Chip
                          label={memory.metadata.content_type}
                          size="small"
                          color={
                            memory.metadata.content_type === 'code'
                              ? 'primary'
                              : memory.metadata.content_type === 'conversation'
                                ? 'secondary'
                                : memory.metadata.content_type === 'projectBrief'
                                  ? 'success'
                                  : 'default'
                          }
                        />
                      </Box>
                      <Box sx={{ ml: 'auto' }}>
                        <Typography variant="caption" color="text.secondary">
                          Score: {Math.round(memory.score * 100)}%
                        </Typography>
                      </Box>
                    </Box>
                    
                    {renderMemoryContent(memory)}
                  </Box>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>
    </Paper>
  );
};

export default MemoryExplorer;
```

### 5.2 Agent Collaboration UI

```javascript
// src/components/AgentCollaboration.jsx
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  Button,
  Divider,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Code as CodeIcon,
  Gavel as JudgeIcon,
  BugReport as DebuggerIcon,
  Architecture as RefactorIcon,
  PlayArrow as PlayIcon,
  Merge as MergeIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import {
  createWorkflow,
  executeWorkflow,
  forkWorkflow,
  joinWorkflows,
  listWorkflows,
} from '../slices/workflowSlice';

const AgentCollaboration = ({ projectId }) => {
  const dispatch = useDispatch();
  const workflows = useSelector((state) => state.workflow.items);
  const loading = useSelector((state) => state.workflow.loading);
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [forkDialogOpen, setForkDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [selectedWorkflows, setSelectedWorkflows] = useState([]);
  const [newWorkflowData, setNewWorkflowData] = useState({
    initialAgent: 'builder',
    initialTask: '',
  });
  
  useEffect(() => {
    if (projectId) {
      dispatch(listWorkflows(projectId));
    }
  }, [dispatch, projectId]);
  
  const handleCreateWorkflow = () => {
    dispatch(createWorkflow({
      projectId,
      ...newWorkflowData,
    }));
    setCreateDialogOpen(false);
    setNewWorkflowData({
      initialAgent: 'builder',
      initialTask: '',
    });
  };
  
  const handleExecuteWorkflow = (workflowId) => {
    dispatch(executeWorkflow({
      workflowId,
      input: {},
    }));
  };
  
  const handleForkWorkflow = () => {
    if (selectedWorkflow) {
      dispatch(forkWorkflow({
        workflowId: selectedWorkflow,
        task: newWorkflowData.initialTask,
        agent: newWorkflowData.initialAgent,
      }));
      setForkDialogOpen(false);
      setSelectedWorkflow(null);
      setNewWorkflowData({
        initialAgent: 'builder',
        initialTask: '',
      });
    }
  };
  
  const handleJoinWorkflows = () => {
    if (selectedWorkflows.length > 1 && selectedWorkflow) {
      dispatch(joinWorkflows({
        workflowIds: selectedWorkflows,
        targetWorkflowId: selectedWorkflow,
        mergeStrategy: 'sequential',
      }));
      setJoinDialogOpen(false);
      setSelectedWorkflows([]);
      setSelectedWorkflow(null);
    }
  };
  
  const getAgentIcon = (agent) => {
    switch (agent) {
      case 'builder':
        return <CodeIcon />;
      case 'judge':
        return <JudgeIcon />;
      case 'debugger':
        return <DebuggerIcon />;
      case 'refactor':
        return <RefactorIcon />;
      default:
        return <CodeIcon />;
    }
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'created':
        return 'default';
      case 'running':
        return 'primary';
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };
  
  return (
    <Paper
      elevation={2}
      sx={{
        height: '100%',
        maxHeight: 'calc(100vh - 200px)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Agent Collaboration</Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<MergeIcon />}
              onClick={() => setJoinDialogOpen(true)}
              sx={{ mr: 1 }}
              disabled={workflows.length < 2}
            >
              Join
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              New Workflow
            </Button>
          </Box>
        </Box>
      </Box>
      
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : workflows.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No workflows created yet. Create a new workflow to start agent collaboration.
            </Typography>
          </Box>
        ) : (
          <List>
            {workflows.map((workflow) => (
              <ListItem
                key={workflow.workflowId}
                sx={{
                  mb: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                }}
              >
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ListItemIcon>
                          {getAgentIcon(workflow.initialAgent)}
                        </ListItemIcon>
                        <ListItemText
                          primary={`Workflow ${workflow.workflowId.split('-')[1]}`}
                          secondary={workflow.initialTask}
                        />
                      </Box>
                      <Box>
                        <Chip
                          label={workflow.status}
                          size="small"
                          color={getStatusColor(workflow.status)}
                          sx={{ mr: 1 }}
                        />
                        <IconButton
                          color="primary"
                          onClick={() => handleExecuteWorkflow(workflow.workflowId)}
                          disabled={workflow.status === 'running'}
                        >
                          <PlayIcon />
                        </IconButton>
                        <IconButton
                          color="secondary"
                          onClick={() => {
                            setSelectedWorkflow(workflow.workflowId);
                            setForkDialogOpen(true);
                          }}
                        >
                          <AddIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  </Grid>
                  
                  {workflow.parentWorkflow && (
                    <Grid item xs={12}>
                      <Box sx={{ pl: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Forked from: Workflow {workflow.parentWorkflow.workflowId.split('-')[1]}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                  
                  {workflow.error && (
                    <Grid item xs={12}>
                      <Box sx={{ pl: 2, color: 'error.main' }}>
                        <Typography variant="caption">
                          Error: {workflow.error}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
      
      {/* Create Workflow Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
        <DialogTitle>Create New Workflow</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Initial Agent</InputLabel>
              <Select
                value={newWorkflowData.initialAgent}
                label="Initial Agent"
                onChange={(e) => setNewWorkflowData({
                  ...newWorkflowData,
                  initialAgent: e.target.value,
                })}
              >
                <MenuItem value="builder">Builder</MenuItem>
                <MenuItem value="judge">Judge</MenuItem>
                <MenuItem value="debugger">Debugger</MenuItem>
                <MenuItem value="refactor">Refactor</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Task Description"
              multiline
              rows={4}
              value={newWorkflowData.initialTask}
              onChange={(e) => setNewWorkflowData({
                ...newWorkflowData,
                initialTask: e.target.value,
              })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateWorkflow}
            variant="contained"
            disabled={!newWorkflowData.initialTask}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Fork Workflow Dialog */}
      <Dialog open={forkDialogOpen} onClose={() => setForkDialogOpen(false)}>
        <DialogTitle>Fork Workflow</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Typography variant="body2" gutterBottom>
              Forking from: Workflow {selectedWorkflow?.split('-')[1]}
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Agent</InputLabel>
              <Select
                value={newWorkflowData.initialAgent}
                label="Agent"
                onChange={(e) => setNewWorkflowData({
                  ...newWorkflowData,
                  initialAgent: e.target.value,
                })}
              >
                <MenuItem value="builder">Builder</MenuItem>
                <MenuItem value="judge">Judge</MenuItem>
                <MenuItem value="debugger">Debugger</MenuItem>
                <MenuItem value="refactor">Refactor</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Task Description"
              multiline
              rows={4}
              value={newWorkflowData.initialTask}
              onChange={(e) => setNewWorkflowData({
                ...newWorkflowData,
                initialTask: e.target.value,
              })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setForkDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleForkWorkflow}
            variant="contained"
            disabled={!newWorkflowData.initialTask}
          >
            Fork
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Join Workflows Dialog */}
      <Dialog open={joinDialogOpen} onClose={() => setJoinDialogOpen(false)}>
        <DialogTitle>Join Workflows</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Typography variant="body2" gutterBottom>
              Select workflows to join:
            </Typography>
            
            <List>
              {workflows.map((workflow) => (
                <ListItem key={workflow.workflowId}>
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={selectedWorkflows.includes(workflow.workflowId)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedWorkflows([...selectedWorkflows, workflow.workflowId]);
                        } else {
                          setSelectedWorkflows(selectedWorkflows.filter(id => id !== workflow.workflowId));
                        }
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={`Workflow ${workflow.workflowId.split('-')[1]}`}
                    secondary={workflow.initialTask}
                  />
                </ListItem>
              ))}
            </List>
            
            <Divider sx={{ my: 2 }} />
            
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Target Workflow</InputLabel>
              <Select
                value={selectedWorkflow || ''}
                label="Target Workflow"
                onChange={(e) => setSelectedWorkflow(e.target.value)}
              >
                {workflows.map((workflow) => (
                  <MenuItem
                    key={workflow.workflowId}
                    value={workflow.workflowId}
                    disabled={selectedWorkflows.includes(workflow.workflowId)}
                  >
                    Workflow {workflow.workflowId.split('-')[1]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setJoinDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleJoinWorkflows}
            variant="contained"
            disabled={selectedWorkflows.length < 2 || !selectedWorkflow}
          >
            Join
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default AgentCollaboration;
```

### 5.3 Project Console Updates

```javascript
// src/pages/ProjectConsole.jsx
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Grid, Box, Typography, Paper, Tabs, Tab } from '@mui/material';
import { joinProjectRoom, leaveProjectRoom } from '../services/socket';
import { fetchProject } from '../slices/projectsSlice';
import { fetchMessages } from '../slices/consoleSlice';
import { fetchPendingCommits } from '../slices/commitsSlice';

import TranscriptViewer from '../components/TranscriptViewer';
import LivePreview from '../components/LivePreview';
import CommitApproval from '../components/CommitApproval';
import ActionControls from '../components/ActionControls';
import AgentStatus from '../components/AgentStatus';
import MemoryExplorer from '../components/MemoryExplorer';
import AgentCollaboration from '../components/AgentCollaboration';

const ProjectConsole = () => {
  const { projectId } = useParams();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = React.useState('console');
  
  const project = useSelector((state) => 
    state.projects.items.find((p) => p.id === projectId)
  );
  
  useEffect(() => {
    // Join the project room for real-time updates
    joinProjectRoom(projectId);
    
    // Fetch project data
    dispatch(fetchProject(projectId));
    dispatch(fetchMessages(projectId));
    dispatch(fetchPendingCommits(projectId));
    
    // Cleanup on unmount
    return () => {
      leaveProjectRoom(projectId);
    };
  }, [dispatch, projectId]);
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  if (!project) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading project...</Typography>
      </Box>
    );
  }
  
  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h5">{project.name}</Typography>
        <Typography variant="body2" color="text.secondary">
          {project.description}
        </Typography>
        
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{ mt: 2 }}
        >
          <Tab label="Console" value="console" />
          <Tab label="Memory" value="memory" />
          <Tab label="Collaboration" value="collaboration" />
        </Tabs>
      </Paper>
      
      {activeTab === 'console' && (
        <>
          <ActionControls projectId={projectId} />
          
          <AgentStatus projectId={projectId} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TranscriptViewer />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Grid container spacing={3} direction="column">
                <Grid item>
                  <LivePreview />
                </Grid>
                
                <Grid item>
                  <CommitApproval />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </>
      )}
      
      {activeTab === 'memory' && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <MemoryExplorer projectId={projectId} />
          </Grid>
        </Grid>
      )}
      
      {activeTab === 'collaboration' && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <AgentCollaboration projectId={projectId} />
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default ProjectConsole;
```

## 6. Testing Strategy

### 6.1 Unit Tests

```javascript
// tests/unit/services/vectordb/chroma.test.js
const ChromaDBClient = require('../../../../src/services/vectordb/providers/chroma');
const { ChromaClient } = require('chromadb');

// Mock chromadb
jest.mock('chromadb');

describe('ChromaDBClient', () => {
  let chromaClient;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Mock implementation
    ChromaClient.mockImplementation(() => ({
      getCollection: jest.fn().mockImplementation((params) => {
        if (params.name === 'existing-collection') {
          return Promise.resolve({
            add: jest.fn().mockResolvedValue({}),
            query: jest.fn().mockResolvedValue({
              ids: [['doc1', 'doc2']],
              documents: [['content1', 'content2']],
              metadatas: [[{ key: 'value1' }, { key: 'value2' }]],
              distances: [[0.1, 0.2]],
            }),
            delete: jest.fn().mockResolvedValue({}),
          });
        }
        throw new Error('Collection not found');
      }),
      createCollection: jest.fn().mockImplementation((params) => {
        return Promise.resolve({
          add: jest.fn().mockResolvedValue({}),
          query: jest.fn().mockResolvedValue({
            ids: [['doc1', 'doc2']],
            documents: [['content1', 'content2']],
            metadatas: [[{ key: 'value1' }, { key: 'value2' }]],
            distances: [[0.1, 0.2]],
          }),
          delete: jest.fn().mockResolvedValue({}),
        });
      }),
      listCollections: jest.fn().mockResolvedValue([
        { name: 'collection1' },
        { name: 'collection2' },
      ]),
    }));
    
    // Create client instance
    chromaClient = new ChromaDBClient({
      url: 'http://localhost:8000',
    });
  });
  
  it('should get an existing collection', async () => {
    const collection = await chromaClient.getCollection('existing-collection');
    
    expect(collection).toBeDefined();
    expect(ChromaClient.mock.instances[0].getCollection).toHaveBeenCalledWith({
      name: 'existing-collection',
      embeddingFunction: expect.anything(),
    });
  });
  
  it('should create a new collection if it does not exist', async () => {
    const collection = await chromaClient.getCollection('new-collection');
    
    expect(collection).toBeDefined();
    expect(ChromaClient.mock.instances[0].createCollection).toHaveBeenCalledWith({
      name: 'new-collection',
      embeddingFunction: expect.anything(),
    });
  });
  
  it('should add a document to a collection', async () => {
    const result = await chromaClient.addDocument(
      'Test document',
      { key: 'value' },
      'test-collection'
    );
    
    expect(result).toBeDefined();
    expect(result.document).toBe('Test document');
    expect(result.metadata).toEqual({ key: 'value' });
    expect(result.id).toBeDefined();
  });
  
  it('should search documents in a collection', async () => {
    const results = await chromaClient.search(
      'Test query',
      'existing-collection',
      2
    );
    
    expect(results).toHaveLength(2);
    expect(results[0].document).toBe('content1');
    expect(results[0].metadata).toEqual({ key: 'value1' });
    expect(results[0].id).toBe('doc1');
    expect(results[0].score).toBe(0.1);
  });
  
  it('should delete a document from a collection', async () => {
    const result = await chromaClient.deleteDocument(
      'doc1',
      'existing-collection'
    );
    
    expect(result).toEqual({ success: true, id: 'doc1' });
  });
  
  it('should list all collections', async () => {
    const collections = await chromaClient.listCollections();
    
    expect(collections).toHaveLength(2);
    expect(collections[0].name).toBe('collection1');
    expect(collections[1].name).toBe('collection2');
  });
});
```

### 6.2 Integration Tests

```javascript
// tests/integration/services/memory.test.js
const MemoryService = require('../../../src/services/memory');
const VectorDBService = require('../../../src/services/vectordb');
const EmbeddingService = require('../../../src/services/embedding');
const mongoose = require('mongoose');
const Project = require('../../../src/models/project');
const Conversation = require('../../../src/models/conversation');

// Mock vector database and embedding services
jest.mock('../../../src/services/vectordb');
jest.mock('../../../src/services/embedding');

describe('Memory Service', () => {
  let memoryService;
  let mockProject;
  let mockConversation;
  
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI_TEST);
    
    // Create test data
    mockProject = new Project({
      name: 'Test Project',
      description: 'Test project description',
      requirements: 'Test requirements',
      user: new mongoose.Types.ObjectId(),
    });
    
    await mockProject.save();
    
    mockConversation = new Conversation({
      project: mockProject._id,
      user: mockProject.user,
      messages: [
        {
          role: 'user',
          content: 'Test message',
        },
        {
          role: 'builder',
          content: 'Test response',
        },
      ],
    });
    
    await mockConversation.save();
  });
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Mock implementations
    VectorDBService.mockImplementation(() => ({
      addDocument: jest.fn().mockResolvedValue({
        id: 'test-doc-id',
        document: 'Test document',
        metadata: { key: 'value' },
      }),
      addDocuments: jest.fn().mockResolvedValue([
        {
          id: 'test-doc-id-1',
          document: 'Test document 1',
          metadata: { key: 'value1' },
        },
        {
          id: 'test-doc-id-2',
          document: 'Test document 2',
          metadata: { key: 'value2' },
        },
      ]),
      search: jest.fn().mockResolvedValue([
        {
          document: 'Test document 1',
          metadata: { key: 'value1' },
          id: 'test-doc-id-1',
          score: 0.9,
        },
        {
          document: 'Test document 2',
          metadata: { key: 'value2' },
          id: 'test-doc-id-2',
          score: 0.8,
        },
      ]),
    }));
    
    EmbeddingService.mockImplementation(() => ({
      embedText: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
      embedDocuments: jest.fn().mockResolvedValue([
        [0.1, 0.2, 0.3],
        [0.4, 0.5, 0.6],
      ]),
      splitAndEmbedText: jest.fn().mockResolvedValue([
        {
          text: 'Test chunk 1',
          embedding: [0.1, 0.2, 0.3],
        },
        {
          text: 'Test chunk 2',
          embedding: [0.4, 0.5, 0.6],
        },
      ]),
      processContentForVectorStorage: jest.fn().mockResolvedValue([
        {
          text: 'Test chunk 1',
          metadata: {
            chunk_index: 0,
            total_chunks: 2,
            content_type: 'test',
            key: 'value',
          },
        },
        {
          text: 'Test chunk 2',
          metadata: {
            chunk_index: 1,
            total_chunks: 2,
            content_type: 'test',
            key: 'value',
          },
        },
      ]),
    }));
    
    // Create memory service instance
    memoryService = new MemoryService();
  });
  
  afterAll(async () => {
    // Clean up test data
    await Project.deleteMany({});
    await Conversation.deleteMany({});
    
    // Disconnect from test database
    await mongoose.connection.close();
  });
  
  it('should store a project brief', async () => {
    const result = await memoryService.storeProjectBrief(mockProject);
    
    expect(result).toEqual({
      success: true,
      chunks: 2,
    });
    
    expect(memoryService.search.indexContent).toHaveBeenCalledWith(
      expect.objectContaining({
        description: expect.stringContaining('Test Project'),
      }),
      'projectBrief',
      expect.objectContaining({
        project_id: mockProject._id.toString(),
        user_id: mockProject.user.toString(),
        content_type: 'projectBrief',
        name: 'Test Project',
      })
    );
  });
  
  it('should store a code snippet', async () => {
    const code = 'function test() { return "hello"; }';
    const metadata = {
      projectId: mockProject._id.toString(),
      filePath: 'test.js',
      language: 'javascript',
      commitId: 'test-commit-id',
    };
    
    const result = await memoryService.storeCodeSnippet(code, metadata);
    
    expect(result).toEqual({
      success: true,
      chunks: 2,
    });
    
    expect(memoryService.search.indexContent).toHaveBeenCalledWith(
      code,
      'code',
      expect.objectContaining({
        project_id: mockProject._id.toString(),
        file_path: 'test.js',
        language: 'javascript',
        commit_id: 'test-commit-id',
        content_type: 'code',
      })
    );
  });
  
  it('should store a conversation', async () => {
    const result = await memoryService.storeConversation(mockConversation);
    
    expect(result).toEqual({
      success: true,
      chunks: 2,
    });
    
    expect(memoryService.search.indexContent).toHaveBeenCalledWith(
      { messages: mockConversation.messages },
      'conversation',
      expect.objectContaining({
        project_id: mockProject._id.toString(),
        user_id: mockProject.user.toString(),
        conversation_id: mockConversation._id.toString(),
        content_type: 'conversation',
        message_count: 2,
      })
    );
  });
  
  it('should retrieve relevant memories', async () => {
    const memories = await memoryService.retrieveRelevantMemories(
      'Test query',
      {
        projectId: mockProject._id.toString(),
        limit: 5,
      }
    );
    
    expect(memories).toHaveLength(2);
    expect(memories[0].document).toBe('Test document 1');
    expect(memories[0].score).toBe(0.9);
    expect(memories[1].document).toBe('Test document 2');
    expect(memories[1].score).toBe(0.8);
    
    expect(memoryService.search.searchWithinProject).toHaveBeenCalledWith(
      'Test query',
      mockProject._id.toString(),
      expect.objectContaining({
        limit: 5,
      })
    );
  });
  
  it('should retrieve project context', async () => {
    const context = await memoryService.retrieveProjectContext(
      mockProject._id.toString()
    );
    
    expect(context).toEqual({
      projectBrief: 'Test document 1',
      codeSnippets: ['Test document 1', 'Test document 2'],
      conversations: ['Test document 1', 'Test document 2'],
    });
    
    expect(memoryService.search.searchWithinProject).toHaveBeenCalledTimes(3);
  });
});
```

### 6.3 End-to-End Tests

```javascript
// tests/e2e/agentCollaboration.test.js
const puppeteer = require('puppeteer');

describe('Agent Collaboration', () => {
  let browser;
  let page;
  
  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    page = await browser.newPage();
    
    // Login
    await page.goto('http://localhost:3000/login');
    await page.type('input[name="email"]', 'test@example.com');
    await page.type('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForSelector('.project-card');
    
    // Navigate to first project
    await page.click('.project-card');
    
    // Wait for project details to load
    await page.waitForSelector('.project-details');
    
    // Navigate to project console
    await page.click('button.console-button');
    
    // Wait for console to load
    await page.waitForSelector('.transcript-viewer');
    
    // Switch to collaboration tab
    await page.click('button[value="collaboration"]');
    
    // Wait for collaboration tab to load
    await page.waitForSelector('.agent-collaboration');
  });
  
  afterAll(async () => {
    await browser.close();
  });
  
  it('should create a new workflow', async () => {
    // Click new workflow button
    await page.click('button:has-text("New Workflow")');
    
    // Wait for dialog to open
    await page.waitForSelector('div[role="dialog"]');
    
    // Select agent
    await page.click('div[role="button"]');
    await page.click('li[data-value="builder"]');
    
    // Enter task description
    await page.type('textarea', 'Create a responsive navigation bar');
    
    // Click create button
    await page.click('button:has-text("Create")');
    
    // Wait for workflow to be created
    await page.waitForSelector('.workflow-item');
    
    // Check if workflow is displayed
    const workflowText = await page.$eval('.workflow-item', el => el.textContent);
    expect(workflowText).toContain('Create a responsive navigation bar');
  });
  
  it('should execute a workflow', async () => {
    // Click play button on first workflow
    await page.click('.workflow-item button[title="Execute"]');
    
    // Wait for status to change
    await page.waitForFunction(
      () => document.querySelector('.workflow-item .MuiChip-root').textContent === 'running'
    );
    
    // Wait for execution to complete (this might take some time)
    await page.waitForFunction(
      () => document.querySelector('.workflow-item .MuiChip-root').textContent === 'completed',
      { timeout: 30000 }
    );
    
    // Check if status is completed
    const statusText = await page.$eval('.workflow-item .MuiChip-root', el => el.textContent);
    expect(statusText).toBe('completed');
  });
  
  it('should fork a workflow', async () => {
    // Click fork button on first workflow
    await page.click('.workflow-item button[title="Fork"]');
    
    // Wait for dialog to open
    await page.waitForSelector('div[role="dialog"]');
    
    // Select agent
    await page.click('div[role="button"]');
    await page.click('li[data-value="debugger"]');
    
    // Enter task description
    await page.type('textarea', 'Fix responsive issues in navigation bar');
    
    // Click fork button
    await page.click('button:has-text("Fork")');
    
    // Wait for forked workflow to be created
    await page.waitForFunction(
      () => document.querySelectorAll('.workflow-item').length > 1
    );
    
    // Check if forked workflow is displayed
    const workflowItems = await page.$$('.workflow-item');
    expect(workflowItems.length).toBeGreaterThan(1);
    
    const forkedWorkflowText = await workflowItems[1].evaluate(el => el.textContent);
    expect(forkedWorkflowText).toContain('Fix responsive issues');
    expect(forkedWorkflowText).toContain('Forked from');
  });
  
  it('should join workflows', async () => {
    // Click join button
    await page.click('button:has-text("Join")');
    
    // Wait for dialog to open
    await page.waitForSelector('div[role="dialog"]');
    
    // Select workflows to join
    const checkboxes = await page.$$('input[type="checkbox"]');
    await checkboxes[0].click();
    await checkboxes[1].click();
    
    // Select target workflow
    await page.click('div[role="button"]');
    await page.click('li[data-value]:not([aria-disabled="true"])');
    
    // Click join button
    await page.click('button:has-text("Join")');
    
    // Wait for join operation to complete
    await page.waitForFunction(
      () => !document.querySelector('div[role="dialog"]')
    );
    
    // Check if workflows are still displayed
    const workflowItems = await page.$$('.workflow-item');
    expect(workflowItems.length).toBeGreaterThan(0);
  });
});
```

## 7. Deployment Plan

### 7.1 Prerequisites

- Node.js 16+
- MongoDB
- Redis
- Python 3.8+ (for embedding models)
- Docker (for Chroma DB)

### 7.2 Environment Variables

```
# Server Configuration
PORT=5000
NODE_ENV=production
API_URL=https://api.mcp-system.com
FRONTEND_URL=https://mcp-system.com

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/mcp-system

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Vector Database Configuration
VECTOR_DB_PROVIDER=chroma
CHROMA_URL=http://localhost:8000

# Embedding Configuration
EMBEDDING_PROVIDER=openai
EMBEDDING_MODEL=text-embedding-ada-002

# LLM API Keys
ANTHROPIC_API_KEY=your-anthropic-api-key
OPENAI_API_KEY=your-openai-api-key
OPENAI_ORG_ID=your-openai-org-id

# GitHub Configuration
GITHUB_TOKEN=your-github-token
```

### 7.3 Deployment Steps

1. **Set Up Vector Database**
   ```bash
   # Pull and run Chroma DB Docker image
   docker pull chromadb/chroma
   docker run -d -p 8000:8000 chromadb/chroma
   ```

2. **Update Dependencies**
   ```bash
   # Backend
   cd mcp-system/backend
   npm install chromadb langchain @langchain/openai @langchain/anthropic
   
   # Frontend
   cd mcp-system/frontend
   npm install react-syntax-highlighter date-fns
   ```

3. **Update Backend Code**
   - Copy new service files to appropriate directories
   - Update controllers and routes
   - Update models with new schemas
   - Update socket.io integration

4. **Update Frontend Code**
   - Add memory explorer component
   - Add agent collaboration component
   - Update project console page

5. **Deploy Updates**
   ```bash
   # Backend
   cd mcp-system/backend
   npm run build
   pm2 restart mcp-backend
   
   # Frontend
   cd mcp-system/frontend
   npm run build
   aws s3 sync build/ s3://mcp-frontend-bucket
   ```

## 8. Future Considerations

### 8.1 Scaling Vector Storage

As the system grows, consider:
- Implementing sharding for vector databases
- Adding caching layers for frequently accessed vectors
- Implementing batch processing for large embedding operations
- Setting up regular maintenance tasks for vector database optimization

### 8.2 Advanced Agent Capabilities

Future enhancements could include:
- Adding more specialized agents (UI Designer, DevOps, QA Tester)
- Implementing agent personality profiles for different coding styles
- Adding learning capabilities to improve agent performance over time
- Implementing agent specialization based on programming languages or frameworks

### 8.3 Performance Optimization

For large-scale deployments:
- Implement distributed processing for embedding generation
- Add caching for common queries and search results
- Optimize memory usage for large projects
- Implement background processing for non-critical operations

## 9. Conclusion

This technical specification outlines the implementation plan for Phase 4 of the MCP System, focusing on vector storage integration and multi-agent runtime capabilities. This phase will enhance the system with advanced memory management, cross-project context awareness, and expanded agent collaboration through a team-based approach.

The key deliverables for this phase include:
1. Vector storage integration with support for multiple providers (Chroma, Weaviate, FAISS)
2. Embedding generation and semantic search capabilities
3. Cross-project memory management
4. Multi-agent runtime with specialized agents (Builder, Judge, Debugger, Refactor)
5. Agent collaboration framework with workflow forking and joining
6. Frontend components for memory exploration and agent collaboration

This phase builds upon the existing MCP System with LangChain integration, LangGraph workflow, and real-time UI/CI/CD capabilities, providing a comprehensive environment for autonomous product development with recall, memory, and team-style agents.
