const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../src/index');
const User = require('../src/models/user');
const Project = require('../src/models/project');
const Conversation = require('../src/models/conversation');
const Message = require('../src/models/message');

// Mock data
const mockUser = {
  email: 'test@example.com',
  name: 'Test User',
  oauthProvider: 'github',
  oauthId: '12345',
  apiKeys: {
    claude: 'test-claude-key',
    chatgpt: 'test-chatgpt-key'
  }
};

const mockProject = {
  name: 'Test Project',
  description: 'A test project',
  status: 'active'
};

const mockConversation = {
  title: 'Test Conversation',
  builderModel: 'claude',
  judgeModel: 'chatgpt'
};

let authToken;
let userId;
let projectId;
let conversationId;

// Setup before tests
beforeAll(async () => {
  // Connect to test database
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mcp-system-test');
  
  // Clear database
  await User.deleteMany({});
  await Project.deleteMany({});
  await Conversation.deleteMany({});
  await Message.deleteMany({});
  
  // Create test user
  const user = new User(mockUser);
  await user.save();
  userId = user._id;
  
  // Generate auth token
  // Note: In a real test, we would use the actual authentication flow
  // For simplicity, we're mocking the token generation
  const jwt = require('jsonwebtoken');
  authToken = jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '1h' }
  );
});

// Cleanup after tests
afterAll(async () => {
  await mongoose.connection.close();
});

describe('API Tests', () => {
  // Auth routes
  describe('Auth API', () => {
    test('GET /api/auth/user - Should get current user', async () => {
      const res = await request(app)
        .get('/api/auth/user')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe(mockUser.email);
    });
    
    test('PUT /api/auth/api-keys - Should update API keys', async () => {
      const res = await request(app)
        .put('/api/auth/api-keys')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          claude: 'new-claude-key',
          chatgpt: 'new-chatgpt-key'
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      
      // Verify keys were updated
      const updatedUser = await User.findById(userId);
      expect(updatedUser.apiKeys.claude).toBe('new-claude-key');
      expect(updatedUser.apiKeys.chatgpt).toBe('new-chatgpt-key');
    });
  });
  
  // Project routes
  describe('Projects API', () => {
    test('POST /api/projects - Should create a new project', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(mockProject);
      
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.project.name).toBe(mockProject.name);
      
      projectId = res.body.project._id;
    });
    
    test('GET /api/projects - Should get all projects', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.projects)).toBe(true);
      expect(res.body.projects.length).toBeGreaterThan(0);
    });
    
    test('GET /api/projects/:id - Should get a single project', async () => {
      const res = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.project._id).toBe(projectId);
    });
    
    test('PUT /api/projects/:id - Should update a project', async () => {
      const res = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Project Name',
          status: 'completed'
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.project.name).toBe('Updated Project Name');
      expect(res.body.project.status).toBe('completed');
    });
  });
  
  // Conversation routes
  describe('Conversations API', () => {
    test('POST /api/conversations - Should create a new conversation', async () => {
      const res = await request(app)
        .post('/api/conversations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...mockConversation,
          projectId
        });
      
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.conversation.title).toBe(mockConversation.title);
      
      conversationId = res.body.conversation._id;
    });
    
    test('GET /api/conversations/project/:projectId - Should get all conversations for a project', async () => {
      const res = await request(app)
        .get(`/api/conversations/project/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.conversations)).toBe(true);
      expect(res.body.conversations.length).toBeGreaterThan(0);
    });
    
    test('GET /api/conversations/:id - Should get a single conversation with messages', async () => {
      const res = await request(app)
        .get(`/api/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.conversation._id).toBe(conversationId);
      expect(Array.isArray(res.body.messages)).toBe(true);
    });
    
    test('POST /api/conversations/:id/messages - Should add a message to a conversation', async () => {
      const res = await request(app)
        .post(`/api/conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          role: 'builder',
          content: 'Test message content'
        });
      
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message.content).toBe('Test message content');
    });
  });
  
  // LLM routes (mocked responses)
  describe('LLM API', () => {
    // Note: These tests would normally mock the external API calls
    test('POST /api/llm/switch-roles - Should switch builder and judge roles', async () => {
      // First get the current roles
      const getRes = await request(app)
        .get(`/api/conversations/${conversationId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      const originalBuilder = getRes.body.conversation.builderModel;
      const originalJudge = getRes.body.conversation.judgeModel;
      
      // Switch roles
      const res = await request(app)
        .post('/api/llm/switch-roles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          conversationId
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.conversation.builderModel).toBe(originalJudge);
      expect(res.body.conversation.judgeModel).toBe(originalBuilder);
    });
  });
  
  // Cleanup test
  describe('Cleanup', () => {
    test('DELETE /api/projects/:id - Should delete a project', async () => {
      const res = await request(app)
        .delete(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      
      // Verify project was deleted
      const project = await Project.findById(projectId);
      expect(project).toBeNull();
    });
  });
});
