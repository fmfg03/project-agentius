require('dotenv').config();

// Conditional import for LangChain components
// This allows Phase 1 to run without LangChain dependencies
const useLangChain = true; // Force enable LangChain for Phase 2
console.log('Environment USE_LANGCHAIN value:', process.env.USE_LANGCHAIN);

// Log warning if API keys are not set in environment variables
if (!process.env.ANTHROPIC_API_KEY) {
  console.log('WARNING: ANTHROPIC_API_KEY not set in environment variables');
}

if (!process.env.OPENAI_API_KEY) {
  console.log('WARNING: OPENAI_API_KEY not set in environment variables');
}

if (!process.env.OPENAI_ORG_ID) {
  console.log('WARNING: OPENAI_ORG_ID not set in environment variables');
}

if (!process.env.LANGCHAIN_API_KEY) {
  console.log('WARNING: LANGCHAIN_API_KEY not set in environment variables');
}

const llmController = require('./controllers/llm');

// Basic express server setup
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db');

// Initialize app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Connect to database
connectDB();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic routes
app.get('/', (req, res) => {
  res.json({ 
    message: useLangChain ? 'MCP System API - Phase 2 with LangChain' : 'MCP System API - Phase 1' 
  });
});

// Simple user authentication route
app.post('/api/auth/login', (req, res) => {
  // In Phase 1, we'll use a simple authentication
  const { email, password } = req.body;
  
  // For demo purposes, accept any login
  res.json({
    success: true,
    user: {
      id: '1',
      email: email || 'user@example.com',
      name: 'Demo User'
    },
    token: 'demo-token-123'
  });
});

// Simple project routes
app.get('/api/projects', (req, res) => {
  res.json({
    success: true,
    projects: [
      {
        id: '1',
        name: 'Demo Project',
        description: 'A demo project for MCP System',
        createdAt: new Date().toISOString()
      }
    ]
  });
});

app.post('/api/projects', (req, res) => {
  const { name, description } = req.body;
  
  // Store in in-memory DB if using it
  if (global.inMemoryDB) {
    const newProject = {
      id: Date.now().toString(),
      name,
      description,
      createdAt: new Date().toISOString()
    };
    global.inMemoryDB.projects.push(newProject);
    
    res.json({
      success: true,
      project: newProject
    });
  } else {
    res.json({
      success: true,
      project: {
        id: Date.now().toString(),
        name,
        description,
        createdAt: new Date().toISOString()
      }
    });
  }
});

// Simple conversation routes
app.get('/api/conversations/:projectId', (req, res) => {
  const { projectId } = req.params;
  
  res.json({
    success: true,
    conversations: [
      {
        id: '1',
        projectId,
        messages: [
          {
            role: 'user',
            content: 'Hello, I need a website for my business.'
          },
          {
            role: 'builder',
            content: 'I can help with that. What kind of business do you have?'
          }
        ],
        createdAt: new Date().toISOString()
      }
    ]
  });
});

app.post('/api/conversations/:projectId/messages', (req, res) => {
  const { projectId } = req.params;
  const { content } = req.body;
  
  // Create message object
  const message = {
    role: 'user',
    content,
    timestamp: new Date().toISOString()
  };
  
  // Process message with LangChain if enabled
  if (useLangChain) {
    llmController.processMessage(projectId, message, io);
  } else {
    // In Phase 1, we'll just echo back a simple response
    setTimeout(() => {
      io.to(projectId).emit('message', {
        role: 'builder',
        content: `I received your message: "${content}". In Phase 1, I'm just echoing back. Phase 2 will include actual LLM integration.`,
        timestamp: new Date().toISOString()
      });
    }, 1000);
  }
  
  res.json({
    success: true,
    message
  });
});

// Socket.io setup
io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('join_project', (projectId) => {
    socket.join(projectId);
    console.log(`Client joined project: ${projectId}`);
  });
  
  socket.on('leave_project', (projectId) => {
    socket.leave(projectId);
    console.log(`Client left project: ${projectId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Phase ${useLangChain ? '2' : '1'} deployment - LangChain integration: ${useLangChain ? 'Enabled' : 'Disabled'}`);
});
