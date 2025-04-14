# MCP System Technical Documentation

## System Architecture

The MCP System is built using a modern web application architecture with the following components:

### Backend Architecture

- **Framework**: Node.js with Express
- **Database**: MongoDB for document storage
- **Caching**: Redis for session management and caching
- **Real-time Communication**: Socket.io for live updates
- **Authentication**: OAuth with JWT for session management
- **File Storage**: Local filesystem with AWS S3 integration option

### Frontend Architecture

- **Framework**: React with TypeScript
- **State Management**: Redux with Redux Toolkit
- **UI Components**: Material UI
- **Routing**: React Router
- **Code Editor**: Monaco Editor (VS Code-based)
- **HTTP Client**: Axios

### API Structure

The backend exposes RESTful APIs organized into the following groups:

1. **Auth API**: User authentication and profile management
2. **Projects API**: Project CRUD operations
3. **Conversations API**: Conversation and message management
4. **LLM API**: Integration with Claude and ChatGPT
5. **Assets API**: File upload and management

## Database Schema

### User Model

```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  oauthProvider: String,
  oauthId: String,
  apiKeys: {
    claude: String,
    chatgpt: String
  },
  preferences: {
    modelPreferences: {
      builder: String,
      judge: String
    },
    storageSettings: {
      path: String
    },
    defaultStack: String,
    notificationWebhook: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Project Model

```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  status: String,
  user: { type: ObjectId, ref: 'User' },
  stack: String,
  gitRepo: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Conversation Model

```javascript
{
  _id: ObjectId,
  title: String,
  project: { type: ObjectId, ref: 'Project' },
  user: { type: ObjectId, ref: 'User' },
  builderModel: String,
  judgeModel: String,
  status: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Message Model

```javascript
{
  _id: ObjectId,
  conversation: { type: ObjectId, ref: 'Conversation' },
  role: String,
  content: String,
  metadata: Object,
  createdAt: Date
}
```

### Asset Model

```javascript
{
  _id: ObjectId,
  project: { type: ObjectId, ref: 'Project' },
  name: String,
  type: String,
  path: String,
  size: Number,
  metadata: Object,
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Auth API

- `POST /api/auth/login`: Initiate OAuth login
- `GET /api/auth/callback`: OAuth callback handler
- `GET /api/auth/user`: Get current user
- `PUT /api/auth/api-keys`: Update API keys
- `PUT /api/auth/preferences`: Update user preferences

### Projects API

- `GET /api/projects`: Get all projects for current user
- `POST /api/projects`: Create a new project
- `GET /api/projects/:id`: Get a single project
- `PUT /api/projects/:id`: Update a project
- `DELETE /api/projects/:id`: Delete a project

### Conversations API

- `GET /api/conversations/project/:projectId`: Get all conversations for a project
- `POST /api/conversations`: Create a new conversation
- `GET /api/conversations/:id`: Get a single conversation with messages
- `PUT /api/conversations/:id`: Update a conversation
- `DELETE /api/conversations/:id`: Delete a conversation
- `POST /api/conversations/:id/messages`: Add a message to a conversation

### LLM API

- `POST /api/llm/builder`: Send prompt to Builder agent
- `POST /api/llm/judge`: Send prompt to Judge agent
- `POST /api/llm/switch-roles`: Switch Builder and Judge roles

### Assets API

- `GET /api/assets/project/:projectId`: Get all assets for a project
- `POST /api/assets/upload`: Upload a new asset
- `GET /api/assets/:id`: Get a single asset
- `DELETE /api/assets/:id`: Delete an asset

## Frontend Components

### Pages

- `Login.tsx`: OAuth authentication page
- `Dashboard.tsx`: Project listing and management
- `ProjectDetails.tsx`: Single project view with conversations
- `Conversation.tsx`: Chat interface with code editor
- `Profile.tsx`: User profile and settings
- `NotFound.tsx`: 404 page

### Components

- `Layout.tsx`: Main application layout with navigation
- `PrivateRoute.tsx`: Route protection for authenticated users
- `ProjectCard.tsx`: Project display component
- `ConversationList.tsx`: List of conversations
- `MessageThread.tsx`: Threaded message display
- `CodeEditor.tsx`: Monaco-based code editor
- `PreviewPanel.tsx`: Live code preview

## LLM Integration

The system now uses LangChain for LLM integration, providing enhanced capabilities for context-aware reasoning.

### LangChain Integration

The system integrates with both Claude and ChatGPT through LangChain:

```javascript
const { ChatOpenAI } = require('@langchain/openai');
const { ChatAnthropic } = require('@langchain/anthropic');
const { PromptTemplate } = require('langchain/prompts');
const { ConversationChain } = require('langchain/chains');
const { BufferMemory } = require('langchain/memory');

// Create LangChain models
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

// Create Builder agent
const createBuilderAgent = (apiKeys, model, projectContext) => {
  const models = createLangChainModels(apiKeys);
  const llm = models[model];
  
  const builderPrompt = PromptTemplate.fromTemplate(builderSystemPrompt);
  
  const memory = new BufferMemory({
    returnMessages: true,
    memoryKey: "chatHistory",
  });
  
  const chain = new ConversationChain({
    llm,
    prompt: builderPrompt,
    memory,
    verbose: process.env.NODE_ENV === 'development',
  });
  
  return chain;
};
```

### Advanced Memory Management

The system implements advanced memory management using LangChain:

```javascript
// Token optimization through conversation summarization
const optimizeContext = async (apiKeys, model, messages, tokenThreshold = 2000) => {
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
```

For more details on the LangChain integration, see the [LangChain Integration Documentation](/docs/langchain_integration.md).

## Memory Management

The system implements persistent memory across sessions:

1. **Project-level Memory**: Stored in MongoDB and associated with each project
2. **Conversation Context**: Full history of messages maintained per conversation
3. **Role-based Context**: Different memory contexts for Builder and Judge roles
4. **Token Optimization**: Long conversations are summarized to manage token limits

## Security Considerations

1. **Authentication**: OAuth with JWT for secure authentication
2. **API Keys**: Encrypted storage of LLM API keys
3. **Input Validation**: All user inputs are validated and sanitized
4. **CORS**: Configured to allow only specified origins
5. **Rate Limiting**: Implemented to prevent abuse
6. **Error Handling**: Secure error responses that don't leak sensitive information

## Performance Optimization

1. **Redis Caching**: Frequently accessed data is cached
2. **Pagination**: Large datasets are paginated
3. **Lazy Loading**: Components and assets are loaded on demand
4. **Code Splitting**: Frontend bundle is split for faster loading
5. **Database Indexing**: Optimized queries with proper indexing

## Testing Strategy

1. **Unit Tests**: Individual components and functions
2. **Integration Tests**: API endpoints and service interactions
3. **Frontend Tests**: Component rendering and user interactions
4. **End-to-End Tests**: Complete user flows

## Deployment Options

1. **AWS Deployment**: Using Elastic Beanstalk and Amplify
2. **Docker Deployment**: Using Docker Compose for local or cloud deployment
3. **Manual Deployment**: Step-by-step instructions for custom setups

## Maintenance and Monitoring

1. **Logging**: Comprehensive logging for debugging
2. **Error Tracking**: Webhook notifications for critical errors
3. **Performance Monitoring**: Server and application metrics
4. **Backup Strategy**: Regular database backups
5. **Update Process**: Guidelines for safe updates and migrations
