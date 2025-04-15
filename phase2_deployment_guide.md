# MCP System Phase 2 Deployment Guide

This guide outlines the steps to deploy the updated MCP System with Phase 2 features including LangChain tools and LangGraph integration.

## Prerequisites

- Node.js 16+ and npm
- MongoDB database
- Redis server (for caching)
- API keys for:
  - OpenAI (GPT-4o)
  - Anthropic (Claude)
  - GitHub (for repository integration)
  - Search API (optional)

## Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/your-org/mcp-system.git
cd mcp-system
```

2. Set up environment variables:

Create a `.env` file in the backend directory with the following variables:
```
# API Keys
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
GITHUB_TOKEN=your-github-token
LANGCHAIN_API_KEY=your-langchain-api-key

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/mcp-system
REDIS_URL=redis://localhost:6379

# Server Configuration
PORT=5000
NODE_ENV=production
JWT_SECRET=your-jwt-secret-key
```

Create a `.env` file in the frontend directory:
```
REACT_APP_API_URL=http://localhost:5000/api
```

## Backend Deployment

1. Install backend dependencies:
```bash
cd backend
npm install
```

2. Build the backend:
```bash
npm run build
```

3. Start the backend server:
```bash
npm start
```

For production deployment, consider using PM2:
```bash
npm install -g pm2
pm2 start dist/index.js --name mcp-backend
```

## Frontend Deployment

1. Install frontend dependencies:
```bash
cd frontend
npm install
```

2. Build the frontend:
```bash
npm run build
```

3. Serve the frontend:
For development:
```bash
npm start
```

For production, serve the built files using a static file server:
```bash
npm install -g serve
serve -s build
```

## Docker Deployment (Optional)

1. Build and run using Docker Compose:
```bash
docker-compose up -d
```

## AWS Deployment

1. Set up an EC2 instance with Node.js installed
2. Configure security groups to allow traffic on ports 80, 443, and 5000
3. Clone the repository and follow the steps above
4. Set up Nginx as a reverse proxy:

```
server {
    listen 80;
    server_name your-domain.com;

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        root /path/to/mcp-system/frontend/build;
        try_files $uri /index.html;
    }
}
```

5. Set up SSL with Let's Encrypt

## Verifying the Deployment

1. Access the frontend at `http://localhost:3000` (or your domain)
2. Log in with your credentials
3. Create a new project
4. Start a conversation and verify that the LangChain tools and LangGraph functionality work correctly

## Troubleshooting

- If the backend fails to start, check the MongoDB and Redis connections
- If LangChain tools don't work, verify the API keys are correctly set
- For GitHub integration issues, ensure the GitHub token has the necessary permissions
- Check the logs for detailed error messages:
  ```bash
  pm2 logs mcp-backend
  ```

## Phase 2 Features

The deployed system now includes:

1. **LangChain Tools**:
   - Code Interpreter: Execute Python code in a sandboxed environment
   - GitHub Tool: Read and write files to GitHub repositories
   - Search Tool: Search the web for information
   - Document Retriever: Search project documentation

2. **LangGraph Integration**:
   - Builder ↔ Judge ↔ Finalizer graph structure
   - Operation nodes (retry, refactor, approve, escalate)
   - Conditional logic for intelligent workflow
   - State management for conversation context

3. **Frontend Updates**:
   - LangChain Tools Panel for direct tool interaction
   - Graph Visualizer for workflow monitoring
   - Code Editor for writing and testing code
   - Integration with conversation interface
