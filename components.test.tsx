import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../src/slices/authSlice';
import projectReducer from '../src/slices/projectSlice';
import conversationReducer from '../src/slices/conversationSlice';
import Login from '../src/pages/Login';
import Dashboard from '../src/pages/Dashboard';
import Profile from '../src/pages/Profile';

// Mock store
const createTestStore = (preloadedState = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer,
      projects: projectReducer,
      conversations: conversationReducer
    },
    preloadedState
  });
};

// Mock axios
jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({ data: {} })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} })),
  create: jest.fn().mockReturnValue({
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() }
    }
  })
}));

describe('Frontend Component Tests', () => {
  // Login page tests
  describe('Login Component', () => {
    test('renders login page correctly', () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <BrowserRouter>
            <Login />
          </BrowserRouter>
        </Provider>
      );
      
      expect(screen.getByText(/MCP System/i)).toBeInTheDocument();
      expect(screen.getByText(/Multi-Client Protocol for LLM Collaboration/i)).toBeInTheDocument();
      expect(screen.getByText(/Sign in with OAuth/i)).toBeInTheDocument();
    });
    
    test('handles OAuth callback', async () => {
      // Mock window.location
      const originalLocation = window.location;
      delete window.location;
      window.location = { href: '', search: '?token=test-token' };
      
      const store = createTestStore();
      const mockDispatch = jest.fn().mockResolvedValue({});
      store.dispatch = mockDispatch;
      
      render(
        <Provider store={store}>
          <BrowserRouter>
            <Login />
          </BrowserRouter>
        </Provider>
      );
      
      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalled();
      });
      
      // Restore window.location
      window.location = originalLocation;
    });
  });
  
  // Dashboard tests
  describe('Dashboard Component', () => {
    test('renders dashboard with projects', () => {
      const store = createTestStore({
        auth: {
          isAuthenticated: true,
          user: { name: 'Test User' },
          loading: false
        },
        projects: {
          projects: [
            { _id: '1', name: 'Project 1', description: 'Test project 1', status: 'active', createdAt: new Date().toISOString() },
            { _id: '2', name: 'Project 2', description: 'Test project 2', status: 'completed', createdAt: new Date().toISOString() }
          ],
          loading: false
        }
      });
      
      render(
        <Provider store={store}>
          <BrowserRouter>
            <Dashboard />
          </BrowserRouter>
        </Provider>
      );
      
      expect(screen.getByText(/Projects/i)).toBeInTheDocument();
      expect(screen.getByText(/Project 1/i)).toBeInTheDocument();
      expect(screen.getByText(/Project 2/i)).toBeInTheDocument();
      expect(screen.getByText(/New Project/i)).toBeInTheDocument();
    });
    
    test('opens new project dialog', () => {
      const store = createTestStore({
        auth: {
          isAuthenticated: true,
          user: { name: 'Test User' },
          loading: false
        },
        projects: {
          projects: [],
          loading: false
        }
      });
      
      render(
        <Provider store={store}>
          <BrowserRouter>
            <Dashboard />
          </BrowserRouter>
        </Provider>
      );
      
      fireEvent.click(screen.getByText(/New Project/i));
      
      expect(screen.getByText(/Create New Project/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Project Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    });
  });
  
  // Profile tests
  describe('Profile Component', () => {
    test('renders profile page with API key settings', () => {
      const store = createTestStore({
        auth: {
          isAuthenticated: true,
          user: { 
            name: 'Test User',
            apiKeys: {
              claude: 'test-claude-key',
              chatgpt: 'test-chatgpt-key'
            }
          },
          loading: false
        }
      });
      
      render(
        <Provider store={store}>
          <BrowserRouter>
            <Profile />
          </BrowserRouter>
        </Provider>
      );
      
      expect(screen.getByText(/Profile Settings/i)).toBeInTheDocument();
      expect(screen.getByText(/API Keys/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Claude API Key/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/ChatGPT API Key/i)).toBeInTheDocument();
    });
    
    test('switches between tabs', () => {
      const store = createTestStore({
        auth: {
          isAuthenticated: true,
          user: { 
            name: 'Test User',
            apiKeys: {
              claude: 'test-claude-key',
              chatgpt: 'test-chatgpt-key'
            }
          },
          loading: false
        }
      });
      
      render(
        <Provider store={store}>
          <BrowserRouter>
            <Profile />
          </BrowserRouter>
        </Provider>
      );
      
      // Initially on API Keys tab
      expect(screen.getByText(/LLM API Keys/i)).toBeInTheDocument();
      
      // Click on Preferences tab
      fireEvent.click(screen.getByText(/Preferences/i));
      
      // Should show model preferences
      expect(screen.getByText(/Model Preferences/i)).toBeInTheDocument();
      expect(screen.getByText(/Default Technology Stack/i)).toBeInTheDocument();
      
      // Click on Advanced tab
      fireEvent.click(screen.getByText(/Advanced/i));
      
      // Should show storage settings
      expect(screen.getByText(/Storage Settings/i)).toBeInTheDocument();
      expect(screen.getByText(/Notifications/i)).toBeInTheDocument();
    });
  });
});
