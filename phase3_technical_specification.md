# Technical Specification: MCP System Phase 3
# Real-time Development UI + CI/CD Integration

## 1. Overview

This technical specification outlines the implementation plan for Phase 3 of the MCP System development, focusing on building a real-time development UI and implementing CI/CD capabilities. This phase will enhance the system with a web-based console for non-technical users and automate the development workflow through continuous integration and deployment.

## 2. Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        MCP System Phase 3                        │
└─────────────────────────────────────────────────────────────────┘
                                  │
                ┌─────────────────┼─────────────────┐
                │                 │                 │
    ┌───────────▼───────────┐    │    ┌────────────▼────────────┐
    │   Web-based Console   │    │    │      CI/CD Pipeline     │
    └───────────┬───────────┘    │    └────────────┬────────────┘
                │                │                 │
    ┌───────────▼───────────┐    │    ┌────────────▼────────────┐
    │  Real-time Monitoring │    │    │    GitHub Integration   │
    └───────────┬───────────┘    │    └────────────┬────────────┘
                │                │                 │
    ┌───────────▼───────────┐    │    ┌────────────▼────────────┐
    │    Live File Preview  │    │    │ Deployment Automation   │
    └───────────┬───────────┘    │    └────────────┬────────────┘
                │                │                 │
    ┌───────────▼───────────┐    │    ┌────────────▼────────────┐
    │   Action Controls     │    │    │   Deployment Providers  │
    └───────────────────────┘    │    └─────────────────────────┘
                                 │
                ┌───────────────▼───────────────┐
                │      Existing MCP System      │
                │ (with LangChain & LangGraph)  │
                └───────────────────────────────┘
```

### 2.2 Component Integration

The Phase 3 implementation will build upon the existing MCP System with LangChain integration and LangGraph workflow, adding new components while preserving the current functionality:

1. **Web-based Console**: A comprehensive UI for monitoring and controlling agent activities
2. **Real-time Monitoring**: Live updates of agent actions and conversation transcripts
3. **Live File Preview**: Immediate visualization of web project files
4. **Action Controls**: Interface for approving/rejecting commits and triggering actions
5. **CI/CD Pipeline**: Automated workflow for code integration and deployment
6. **Deployment Providers**: Integration with Netlify, Vercel, and Docker for automated deployment

## 3. Web-based Console Implementation

### 3.1 Frontend Architecture

```javascript
// Frontend architecture using React and Material UI
import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box, Grid } from '@mui/material';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Custom components
import AppHeader from './components/AppHeader';
import AppSidebar from './components/AppSidebar';
import Dashboard from './pages/Dashboard';
import ProjectConsole from './pages/ProjectConsole';
import Settings from './pages/Settings';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#ff9800',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
});

// Main App component
const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Box sx={{ display: 'flex', height: '100vh' }}>
          <AppHeader />
          <AppSidebar />
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 3,
              mt: 8,
              overflow: 'auto',
            }}
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/projects/:projectId/console" element={<ProjectConsole />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Box>
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
```

### 3.2 Real-time Monitoring

#### 3.2.1 Socket.io Integration

```javascript
// src/services/socket.js
import { io } from 'socket.io-client';
import { addMessage, updateAgentStatus } from '../slices/consoleSlice';

let socket;

export const initializeSocket = (store) => {
  const { getState, dispatch } = store;
  
  // Close existing connection if any
  if (socket) socket.close();
  
  // Create new connection
  socket = io(process.env.REACT_APP_API_URL, {
    withCredentials: true,
    transports: ['websocket'],
  });
  
  // Connection events
  socket.on('connect', () => {
    console.log('Socket connected');
  });
  
  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });
  
  // Message events
  socket.on('new_message', (data) => {
    dispatch(addMessage(data.message));
  });
  
  // Agent status events
  socket.on('agent_status', (data) => {
    dispatch(updateAgentStatus(data));
  });
  
  // Tool execution events
  socket.on('tool_execution', (data) => {
    dispatch(addMessage({
      role: data.agent,
      content: `Executing tool: ${data.tool}`,
      metadata: {
        toolName: data.tool,
        toolInput: data.input,
        isToolExecution: true
      }
    }));
  });
  
  // Tool result events
  socket.on('tool_result', (data) => {
    dispatch(addMessage({
      role: data.agent,
      content: `Tool result: ${data.result}`,
      metadata: {
        toolName: data.tool,
        toolOutput: data.result,
        isToolResult: true
      }
    }));
  });
  
  return socket;
};

export const joinProjectRoom = (projectId) => {
  if (socket) {
    socket.emit('join_project', { projectId });
  }
};

export const leaveProjectRoom = (projectId) => {
  if (socket) {
    socket.emit('leave_project', { projectId });
  }
};

export default {
  initializeSocket,
  joinProjectRoom,
  leaveProjectRoom,
};
```

#### 3.2.2 Real-time Transcript Component

```javascript
// src/components/TranscriptViewer.jsx
import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Box, Typography, Paper, Divider, Chip } from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs';

const TranscriptViewer = () => {
  const messages = useSelector((state) => state.console.messages);
  const endOfMessagesRef = useRef(null);
  
  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Render code blocks with syntax highlighting
  const renderCodeBlock = ({ node, inline, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '');
    return !inline && match ? (
      <SyntaxHighlighter
        style={vs2015}
        language={match[1]}
        PreTag="div"
        {...props}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    ) : (
      <code className={className} {...props}>
        {children}
      </code>
    );
  };
  
  // Render tool execution and results
  const renderToolOutput = (message) => {
    if (!message.metadata?.isToolExecution && !message.metadata?.isToolResult) {
      return null;
    }
    
    return (
      <Box sx={{ mt: 1, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
        {message.metadata.isToolExecution && (
          <>
            <Typography variant="caption" color="text.secondary">
              Tool: {message.metadata.toolName}
            </Typography>
            <SyntaxHighlighter style={vs2015} language="json">
              {JSON.stringify(message.metadata.toolInput, null, 2)}
            </SyntaxHighlighter>
          </>
        )}
        
        {message.metadata.isToolResult && (
          <>
            <Typography variant="caption" color="text.secondary">
              Result:
            </Typography>
            <SyntaxHighlighter style={vs2015} language="json">
              {message.metadata.toolOutput}
            </SyntaxHighlighter>
          </>
        )}
      </Box>
    );
  };
  
  return (
    <Paper
      elevation={2}
      sx={{
        height: '100%',
        maxHeight: 'calc(100vh - 200px)',
        overflow: 'auto',
        p: 2,
      }}
    >
      {messages.map((message, index) => (
        <Box
          key={message.id || index}
          sx={{
            mb: 2,
            p: 2,
            borderRadius: 2,
            bgcolor: message.role === 'user' ? 'primary.50' : 'background.paper',
            borderLeft: message.role === 'user' 
              ? '4px solid #2196f3' 
              : message.role === 'builder'
                ? '4px solid #4caf50'
                : message.role === 'judge'
                  ? '4px solid #ff9800'
                  : message.role === 'system'
                    ? '4px solid #9e9e9e'
                    : '4px solid #f44336',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Chip
              label={message.role.toUpperCase()}
              size="small"
              color={
                message.role === 'user'
                  ? 'primary'
                  : message.role === 'builder'
                    ? 'success'
                    : message.role === 'judge'
                      ? 'warning'
                      : message.role === 'system'
                        ? 'default'
                        : 'error'
              }
            />
            <Typography variant="caption" color="text.secondary">
              {message.createdAt
                ? formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })
                : ''}
            </Typography>
          </Box>
          
          <ReactMarkdown
            components={{
              code: renderCodeBlock,
            }}
          >
            {message.content}
          </ReactMarkdown>
          
          {renderToolOutput(message)}
        </Box>
      ))}
      <div ref={endOfMessagesRef} />
    </Paper>
  );
};

export default TranscriptViewer;
```

### 3.3 Live File Preview

#### 3.3.1 File Preview Component

```javascript
// src/components/LivePreview.jsx
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Box, Paper, Typography, Tabs, Tab, CircularProgress } from '@mui/material';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const LivePreview = () => {
  const { projectId } = useParams();
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewType, setPreviewType] = useState('iframe');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const deployments = useSelector((state) => state.deployments.items);
  
  useEffect(() => {
    const fetchPreviewUrl = async () => {
      try {
        setLoading(true);
        
        // Find the latest deployment for this project
        const projectDeployment = deployments.find(d => d.projectId === projectId);
        
        if (projectDeployment) {
          setPreviewUrl(projectDeployment.previewUrl);
          setPreviewType(projectDeployment.type || 'iframe');
          setLoading(false);
          return;
        }
        
        // If no deployment found, try to generate a preview
        const response = await axios.post(`/api/projects/${projectId}/preview`);
        
        if (response.data.success) {
          setPreviewUrl(response.data.previewUrl);
          setPreviewType(response.data.type || 'iframe');
        } else {
          setError('Failed to generate preview');
        }
      } catch (err) {
        setError(err.message || 'Failed to load preview');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPreviewUrl();
  }, [projectId, deployments]);
  
  const handleRefresh = () => {
    setLoading(true);
    axios.post(`/api/projects/${projectId}/preview/refresh`)
      .then(response => {
        if (response.data.success) {
          setPreviewUrl(response.data.previewUrl);
        } else {
          setError('Failed to refresh preview');
        }
      })
      .catch(err => {
        setError(err.message || 'Failed to refresh preview');
      })
      .finally(() => {
        setLoading(false);
      });
  };
  
  const renderPreview = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (error) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error">{error}</Typography>
        </Box>
      );
    }
    
    if (!previewUrl) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography>No preview available yet</Typography>
        </Box>
      );
    }
    
    return (
      <Box sx={{ height: '100%', width: '100%' }}>
        <iframe
          src={previewUrl}
          title="Live Preview"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: '4px',
          }}
          sandbox="allow-scripts allow-same-origin"
        />
      </Box>
    );
  };
  
  return (
    <Paper
      elevation={2}
      sx={{
        height: 'calc(100vh - 200px)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ borderBottom: 1, borderColor: 'divider', p: 1 }}>
        <Typography variant="h6">Live Preview</Typography>
      </Box>
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {renderPreview()}
      </Box>
    </Paper>
  );
};

export default LivePreview;
```

#### 3.3.2 Preview Service

```javascript
// src/services/preview.js
import axios from 'axios';

export const generatePreview = async (projectId) => {
  try {
    const response = await axios.post(`/api/projects/${projectId}/preview`);
    return response.data;
  } catch (error) {
    console.error('Error generating preview:', error);
    throw error;
  }
};

export const refreshPreview = async (projectId) => {
  try {
    const response = await axios.post(`/api/projects/${projectId}/preview/refresh`);
    return response.data;
  } catch (error) {
    console.error('Error refreshing preview:', error);
    throw error;
  }
};

export const getPreviewStatus = async (projectId) => {
  try {
    const response = await axios.get(`/api/projects/${projectId}/preview/status`);
    return response.data;
  } catch (error) {
    console.error('Error getting preview status:', error);
    throw error;
  }
};

export default {
  generatePreview,
  refreshPreview,
  getPreviewStatus,
};
```

### 3.4 Action Controls

#### 3.4.1 Commit Approval Component

```javascript
// src/components/CommitApproval.jsx
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Code as CodeIcon,
  BugReport as BugIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { approveCommit, rejectCommit } from '../slices/commitsSlice';
import { triggerAction } from '../slices/actionsSlice';

const CommitApproval = () => {
  const dispatch = useDispatch();
  const pendingCommits = useSelector((state) => state.commits.pending);
  const [selectedCommit, setSelectedCommit] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  
  const handleApprove = (commit) => {
    dispatch(approveCommit(commit.id));
  };
  
  const handleRejectClick = (commit) => {
    setSelectedCommit(commit);
    setRejectDialogOpen(true);
  };
  
  const handleRejectConfirm = () => {
    if (selectedCommit) {
      dispatch(rejectCommit({
        commitId: selectedCommit.id,
        reason: rejectReason,
      }));
    }
    setRejectDialogOpen(false);
    setRejectReason('');
    setSelectedCommit(null);
  };
  
  const handleRejectCancel = () => {
    setRejectDialogOpen(false);
    setRejectReason('');
    setSelectedCommit(null);
  };
  
  const handleTriggerAction = (action, commitId) => {
    dispatch(triggerAction({
      action,
      commitId,
    }));
  };
  
  return (
    <Paper
      elevation={2}
      sx={{
        height: '100%',
        maxHeight: 'calc(100vh - 200px)',
        overflow: 'auto',
        p: 2,
      }}
    >
      <Typography variant="h6" gutterBottom>
        Pending Commits
      </Typography>
      
      {pendingCommits.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No pending commits to approve
        </Typography>
      ) : (
        <List>
          {pendingCommits.map((commit) => (
            <ListItem
              key={commit.id}
              sx={{
                mb: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <ListItemIcon>
                    <CodeIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={commit.message}
                    secondary={`${commit.files.length} files modified`}
                  />
                  <Chip
                    label={commit.agent}
                    size="small"
                    color={commit.agent === 'builder' ? 'success' : 'warning'}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {commit.files.map((file) => (
                    <Chip
                      key={file.path}
                      label={file.path}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Box>
                    <Button
                      startIcon={<BugIcon />}
                      size="small"
                      onClick={() => handleTriggerAction('debug', commit.id)}
                    >
                      Debug
                    </Button>
                    <Button
                      startIcon={<RefreshIcon />}
                      size="small"
                      onClick={() => handleTriggerAction('refactor', commit.id)}
                    >
                      Refactor
                    </Button>
                  </Box>
                  
                  <Box>
                    <Button
                      startIcon={<CloseIcon />}
                      color="error"
                      size="small"
                      onClick={() => handleRejectClick(commit)}
                      sx={{ mr: 1 }}
                    >
                      Reject
                    </Button>
                    <Button
                      startIcon={<CheckIcon />}
                      color="success"
                      variant="contained"
                      size="small"
                      onClick={() => handleApprove(commit)}
                    >
                      Approve
                    </Button>
                  </Box>
                </Box>
              </Box>
            </ListItem>
          ))}
        </List>
      )}
      
      <Dialog open={rejectDialogOpen} onClose={handleRejectCancel}>
        <DialogTitle>Reject Commit</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="reason"
            label="Reason for rejection"
            type="text"
            fullWidth
            multiline
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRejectCancel}>Cancel</Button>
          <Button onClick={handleRejectConfirm} color="error">
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default CommitApproval;
```

#### 3.4.2 Action Controls Component

```javascript
// src/components/ActionControls.jsx
import React from 'react';
import { useDispatch } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  Button,
  Divider,
  Grid,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  BugReport as DebugIcon,
  Refresh as RefreshIcon,
  Code as CodeIcon,
  Build as BuildIcon,
  CloudUpload as DeployIcon,
} from '@mui/icons-material';
import { triggerAction } from '../slices/actionsSlice';

const ActionControls = ({ projectId }) => {
  const dispatch = useDispatch();
  
  const handleAction = (action) => {
    dispatch(triggerAction({
      action,
      projectId,
    }));
  };
  
  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        mb: 2,
      }}
    >
      <Typography variant="h6" gutterBottom>
        Agent Controls
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Workflow Controls
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                color="success"
                startIcon={<PlayIcon />}
                onClick={() => handleAction('continue')}
              >
                Continue
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<StopIcon />}
                onClick={() => handleAction('pause')}
              >
                Pause
              </Button>
            </Box>
          </Box>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Development Actions
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<DebugIcon />}
                onClick={() => handleAction('debug')}
              >
                Debug
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => handleAction('refactor')}
              >
                Refactor
              </Button>
              <Button
                variant="outlined"
                startIcon={<CodeIcon />}
                onClick={() => handleAction('optimize')}
              >
                Optimize
              </Button>
            </Box>
          </Box>
        </Grid>
        
        <Grid item xs={12}>
          <Divider sx={{ my: 1 }} />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Build & Deploy
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<BuildIcon />}
                onClick={() => handleAction('build')}
              >
                Build
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<DeployIcon />}
                onClick={() => handleAction('deploy')}
              >
                Deploy
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ActionControls;
```

### 3.5 Project Console Page

```javascript
// src/pages/ProjectConsole.jsx
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Grid, Box, Typography, Paper } from '@mui/material';
import { joinProjectRoom, leaveProjectRoom } from '../services/socket';
import { fetchProject } from '../slices/projectsSlice';
import { fetchMessages } from '../slices/consoleSlice';
import { fetchPendingCommits } from '../slices/commitsSlice';

import TranscriptViewer from '../components/TranscriptViewer';
import LivePreview from '../components/LivePreview';
import CommitApproval from '../components/CommitApproval';
import ActionControls from '../components/ActionControls';
import AgentStatus from '../components/AgentStatus';

const ProjectConsole = () => {
  const { projectId } = useParams();
  const dispatch = useDispatch();
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
      </Paper>
      
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
    </Box>
  );
};

export default ProjectConsole;
```

## 4. CI/CD Pipeline Implementation

### 4.1 GitHub Integration

#### 4.1.1 GitHub Service

```javascript
// src/services/github.js
const { Octokit } = require('@octokit/rest');
const { createAppAuth } = require('@octokit/auth-app');
const fs = require('fs');
const path = require('path');

class GitHubService {
  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });
  }
  
  async createRepository(name, description, isPrivate = true) {
    try {
      const response = await this.octokit.repos.createForAuthenticatedUser({
        name,
        description,
        private: isPrivate,
        auto_init: true,
      });
      
      return {
        success: true,
        repo: response.data,
      };
    } catch (error) {
      console.error('Error creating repository:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
  
  async commitFiles(repoOwner, repoName, branch, files, message) {
    try {
      // Get the latest commit SHA
      const { data: refData } = await this.octokit.git.getRef({
        owner: repoOwner,
        repo: repoName,
        ref: `heads/${branch}`,
      });
      
      const latestCommitSha = refData.object.sha;
      
      // Get the tree SHA
      const { data: commitData } = await this.octokit.git.getCommit({
        owner: repoOwner,
        repo: repoName,
        commit_sha: latestCommitSha,
      });
      
      const treeSha = commitData.tree.sha;
      
      // Create blobs for each file
      const fileBlobs = await Promise.all(
        files.map(async (file) => {
          const { data: blobData } = await this.octokit.git.createBlob({
            owner: repoOwner,
            repo: repoName,
            content: Buffer.from(file.content).toString('base64'),
            encoding: 'base64',
          });
          
          return {
            path: file.path,
            mode: '100644',
            type: 'blob',
            sha: blobData.sha,
          };
        })
      );
      
      // Create a new tree
      const { data: newTree } = await this.octokit.git.createTree({
        owner: repoOwner,
        repo: repoName,
        base_tree: treeSha,
        tree: fileBlobs,
      });
      
      // Create a new commit
      const { data: newCommit } = await this.octokit.git.createCommit({
        owner: repoOwner,
        repo: repoName,
        message,
        tree: newTree.sha,
        parents: [latestCommitSha],
      });
      
      // Update the reference
      await this.octokit.git.updateRef({
        owner: repoOwner,
        repo: repoName,
        ref: `heads/${branch}`,
        sha: newCommit.sha,
      });
      
      return {
        success: true,
        commit: newCommit,
      };
    } catch (error) {
      console.error('Error committing files:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
  
  async createWebhook(repoOwner, repoName, webhookUrl) {
    try {
      const { data: webhook } = await this.octokit.repos.createWebhook({
        owner: repoOwner,
        repo: repoName,
        config: {
          url: webhookUrl,
          content_type: 'json',
          secret: process.env.WEBHOOK_SECRET,
        },
        events: ['push', 'pull_request'],
        active: true,
      });
      
      return {
        success: true,
        webhook,
      };
    } catch (error) {
      console.error('Error creating webhook:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = new GitHubService();
```

#### 4.1.2 GitHub Controller

```javascript
// src/controllers/github.js
const GitHubService = require('../services/github');
const Project = require('../models/project');
const Commit = require('../models/commit');
const User = require('../models/user');

exports.createRepository = async (req, res) => {
  try {
    const { projectId, isPrivate } = req.body;
    
    // Get project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }
    
    // Create repository
    const result = await GitHubService.createRepository(
      project.name,
      project.description,
      isPrivate
    );
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create repository',
        error: result.error,
      });
    }
    
    // Update project with repository details
    project.gitRepo = result.repo.name;
    project.gitOwner = result.repo.owner.login;
    project.gitUrl = result.repo.html_url;
    
    await project.save();
    
    // Create webhook for the repository
    const webhookUrl = `${process.env.API_URL}/api/webhooks/github`;
    await GitHubService.createWebhook(
      project.gitOwner,
      project.gitRepo,
      webhookUrl
    );
    
    return res.status(200).json({
      success: true,
      repository: result.repo,
    });
  } catch (error) {
    console.error('Error in createRepository:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

exports.commitFiles = async (req, res) => {
  try {
    const { projectId, files, message } = req.body;
    
    // Get project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }
    
    // Check if project has a repository
    if (!project.gitRepo || !project.gitOwner) {
      return res.status(400).json({
        success: false,
        message: 'Project does not have a GitHub repository',
      });
    }
    
    // Commit files
    const result = await GitHubService.commitFiles(
      project.gitOwner,
      project.gitRepo,
      'main',
      files,
      message
    );
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to commit files',
        error: result.error,
      });
    }
    
    // Create commit record
    const commit = new Commit({
      project: projectId,
      message,
      files: files.map(file => ({
        path: file.path,
        action: 'modified',
      })),
      sha: result.commit.sha,
      url: `${project.gitUrl}/commit/${result.commit.sha}`,
      status: 'committed',
    });
    
    await commit.save();
    
    return res.status(200).json({
      success: true,
      commit,
    });
  } catch (error) {
    console.error('Error in commitFiles:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

exports.handleWebhook = async (req, res) => {
  try {
    const event = req.headers['x-github-event'];
    const payload = req.body;
    
    // Handle push event
    if (event === 'push') {
      const repoName = payload.repository.name;
      const repoOwner = payload.repository.owner.login;
      
      // Find project by repository details
      const project = await Project.findOne({
        gitRepo: repoName,
        gitOwner: repoOwner,
      });
      
      if (!project) {
        return res.status(200).json({
          success: true,
          message: 'No matching project found',
        });
      }
      
      // Process commits
      for (const commit of payload.commits) {
        // Check if commit already exists
        const existingCommit = await Commit.findOne({
          sha: commit.id,
        });
        
        if (!existingCommit) {
          // Create new commit record
          const newCommit = new Commit({
            project: project._id,
            message: commit.message,
            files: commit.added.map(path => ({
              path,
              action: 'added',
            })).concat(
              commit.modified.map(path => ({
                path,
                action: 'modified',
              }))
            ).concat(
              commit.removed.map(path => ({
                path,
                action: 'removed',
              }))
            ),
            sha: commit.id,
            url: commit.url,
            status: 'committed',
          });
          
          await newCommit.save();
        }
      }
      
      // Emit socket event
      const io = req.app.get('io');
      if (io) {
        io.to(project._id.toString()).emit('github_push', {
          project: project._id,
          commits: payload.commits,
        });
      }
    }
    
    return res.status(200).json({
      success: true,
      message: 'Webhook processed',
    });
  } catch (error) {
    console.error('Error in handleWebhook:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};
```

### 4.2 Deployment Automation

#### 4.2.1 Deployment Service

```javascript
// src/services/deployment.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class DeploymentService {
  constructor() {
    this.providers = {
      netlify: this.deployToNetlify.bind(this),
      vercel: this.deployToVercel.bind(this),
      docker: this.deployToDocker.bind(this),
    };
  }
  
  async deploy(project, provider, options = {}) {
    if (!this.providers[provider]) {
      throw new Error(`Unsupported provider: ${provider}`);
    }
    
    return this.providers[provider](project, options);
  }
  
  async deployToNetlify(project, options) {
    try {
      // Clone repository if needed
      const repoPath = await this.ensureRepoCloned(project);
      
      // Build project if needed
      if (options.build) {
        await this.buildProject(project, repoPath);
      }
      
      // Determine build directory
      const buildDir = path.join(repoPath, options.buildDir || 'build');
      
      // Deploy to Netlify using their CLI
      const { stdout, stderr } = await execPromise(
        `netlify deploy --dir=${buildDir} --prod --site=${options.siteId} --auth=${process.env.NETLIFY_AUTH_TOKEN}`,
        { cwd: repoPath }
      );
      
      // Extract deployment URL from stdout
      const urlMatch = stdout.match(/Website URL:\s+(https:\/\/[^\s]+)/);
      const deployUrl = urlMatch ? urlMatch[1] : null;
      
      return {
        success: true,
        provider: 'netlify',
        url: deployUrl,
        logs: stdout,
      };
    } catch (error) {
      console.error('Error deploying to Netlify:', error);
      return {
        success: false,
        provider: 'netlify',
        error: error.message,
      };
    }
  }
  
  async deployToVercel(project, options) {
    try {
      // Clone repository if needed
      const repoPath = await this.ensureRepoCloned(project);
      
      // Create vercel.json if it doesn't exist
      const vercelConfigPath = path.join(repoPath, 'vercel.json');
      if (!fs.existsSync(vercelConfigPath)) {
        const vercelConfig = {
          name: project.name.toLowerCase().replace(/\s+/g, '-'),
          builds: [
            {
              src: options.buildDir || 'build',
              use: '@vercel/static',
            },
          ],
          routes: [
            { handle: 'filesystem' },
            { src: '/(.*)', dest: '/index.html' },
          ],
        };
        
        fs.writeFileSync(
          vercelConfigPath,
          JSON.stringify(vercelConfig, null, 2)
        );
      }
      
      // Build project if needed
      if (options.build) {
        await this.buildProject(project, repoPath);
      }
      
      // Deploy to Vercel using their CLI
      const { stdout, stderr } = await execPromise(
        `vercel --token ${process.env.VERCEL_TOKEN} --prod --confirm`,
        { cwd: repoPath }
      );
      
      // Extract deployment URL from stdout
      const urlMatch = stdout.match(/(https:\/\/[^\s]+\.vercel\.app)/);
      const deployUrl = urlMatch ? urlMatch[1] : null;
      
      return {
        success: true,
        provider: 'vercel',
        url: deployUrl,
        logs: stdout,
      };
    } catch (error) {
      console.error('Error deploying to Vercel:', error);
      return {
        success: false,
        provider: 'vercel',
        error: error.message,
      };
    }
  }
  
  async deployToDocker(project, options) {
    try {
      // Clone repository if needed
      const repoPath = await this.ensureRepoCloned(project);
      
      // Check if Dockerfile exists
      const dockerfilePath = path.join(repoPath, 'Dockerfile');
      if (!fs.existsSync(dockerfilePath)) {
        throw new Error('Dockerfile not found in repository');
      }
      
      // Build Docker image
      const imageName = `mcp-${project.name.toLowerCase().replace(/\s+/g, '-')}:latest`;
      await execPromise(
        `docker build -t ${imageName} .`,
        { cwd: repoPath }
      );
      
      // Run Docker container
      const containerName = `mcp-${project.name.toLowerCase().replace(/\s+/g, '-')}`;
      const port = options.port || 3000;
      
      // Stop and remove existing container if it exists
      try {
        await execPromise(`docker stop ${containerName}`);
        await execPromise(`docker rm ${containerName}`);
      } catch (error) {
        // Ignore errors if container doesn't exist
      }
      
      // Start new container
      await execPromise(
        `docker run -d --name ${containerName} -p ${port}:${options.containerPort || 3000} ${imageName}`,
        { cwd: repoPath }
      );
      
      // Get container IP
      const { stdout: ipStdout } = await execPromise(
        `docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' ${containerName}`
      );
      
      const containerIp = ipStdout.trim();
      
      return {
        success: true,
        provider: 'docker',
        url: `http://localhost:${port}`,
        containerIp,
        containerName,
        logs: 'Docker container deployed successfully',
      };
    } catch (error) {
      console.error('Error deploying to Docker:', error);
      return {
        success: false,
        provider: 'docker',
        error: error.message,
      };
    }
  }
  
  async ensureRepoCloned(project) {
    const reposDir = path.join(process.cwd(), 'repos');
    
    // Create repos directory if it doesn't exist
    if (!fs.existsSync(reposDir)) {
      fs.mkdirSync(reposDir, { recursive: true });
    }
    
    const repoPath = path.join(reposDir, project.gitRepo);
    
    // Check if repository already exists
    if (fs.existsSync(repoPath)) {
      // Pull latest changes
      await execPromise('git pull', { cwd: repoPath });
    } else {
      // Clone repository
      await execPromise(
        `git clone https://github.com/${project.gitOwner}/${project.gitRepo}.git`,
        { cwd: reposDir }
      );
    }
    
    return repoPath;
  }
  
  async buildProject(project, repoPath) {
    // Determine build command based on project type
    let buildCommand;
    
    if (fs.existsSync(path.join(repoPath, 'package.json'))) {
      const packageJson = require(path.join(repoPath, 'package.json'));
      
      // Install dependencies
      await execPromise('npm install', { cwd: repoPath });
      
      // Use build script from package.json or default to 'build'
      buildCommand = packageJson.scripts && packageJson.scripts.build
        ? 'npm run build'
        : 'npm run build';
    } else if (fs.existsSync(path.join(repoPath, 'requirements.txt'))) {
      // Python project
      await execPromise('pip install -r requirements.txt', { cwd: repoPath });
      buildCommand = 'python setup.py build';
    } else {
      throw new Error('Unsupported project type for automatic building');
    }
    
    // Execute build command
    await execPromise(buildCommand, { cwd: repoPath });
    
    return true;
  }
}

module.exports = new DeploymentService();
```

#### 4.2.2 Deployment Controller

```javascript
// src/controllers/deployments.js
const DeploymentService = require('../services/deployment');
const Project = require('../models/project');
const Deployment = require('../models/deployment');
const User = require('../models/user');

exports.createDeployment = async (req, res) => {
  try {
    const { projectId, provider, options } = req.body;
    
    // Get project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }
    
    // Check if project has a repository
    if (!project.gitRepo || !project.gitOwner) {
      return res.status(400).json({
        success: false,
        message: 'Project does not have a GitHub repository',
      });
    }
    
    // Deploy project
    const result = await DeploymentService.deploy(project, provider, options);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Deployment failed',
        error: result.error,
      });
    }
    
    // Create deployment record
    const deployment = new Deployment({
      project: projectId,
      provider,
      url: result.url,
      status: 'success',
      logs: result.logs,
      metadata: {
        ...result,
        options,
      },
    });
    
    await deployment.save();
    
    // Update project with latest deployment
    project.latestDeployment = deployment._id;
    project.deploymentUrl = result.url;
    
    await project.save();
    
    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(project._id.toString()).emit('deployment_complete', {
        project: project._id,
        deployment,
      });
    }
    
    return res.status(200).json({
      success: true,
      deployment,
    });
  } catch (error) {
    console.error('Error in createDeployment:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

exports.getDeployments = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Get deployments for project
    const deployments = await Deployment.find({ project: projectId })
      .sort('-createdAt');
    
    return res.status(200).json({
      success: true,
      deployments,
    });
  } catch (error) {
    console.error('Error in getDeployments:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

exports.getDeployment = async (req, res) => {
  try {
    const { deploymentId } = req.params;
    
    // Get deployment
    const deployment = await Deployment.findById(deploymentId);
    
    if (!deployment) {
      return res.status(404).json({
        success: false,
        message: 'Deployment not found',
      });
    }
    
    return res.status(200).json({
      success: true,
      deployment,
    });
  } catch (error) {
    console.error('Error in getDeployment:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};
```

### 4.3 CI/CD Pipeline Integration

#### 4.3.1 CI/CD Service

```javascript
// src/services/cicd.js
const GitHubService = require('./github');
const DeploymentService = require('./deployment');
const Project = require('../models/project');
const Commit = require('../models/commit');
const Deployment = require('../models/deployment');

class CICDService {
  constructor() {
    this.pipelines = {};
  }
  
  async setupPipeline(project) {
    try {
      // Check if project has a repository
      if (!project.gitRepo || !project.gitOwner) {
        throw new Error('Project does not have a GitHub repository');
      }
      
      // Create webhook for the repository if it doesn't exist
      const webhookUrl = `${process.env.API_URL}/api/webhooks/github`;
      await GitHubService.createWebhook(
        project.gitOwner,
        project.gitRepo,
        webhookUrl
      );
      
      // Store pipeline configuration
      this.pipelines[project._id.toString()] = {
        autoDeploy: project.autoDeploy || false,
        deployProvider: project.deployProvider || 'netlify',
        deployOptions: project.deployOptions || {},
      };
      
      return {
        success: true,
        message: 'CI/CD pipeline setup successfully',
      };
    } catch (error) {
      console.error('Error setting up CI/CD pipeline:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
  
  async processPush(projectId, commits) {
    try {
      // Get project
      const project = await Project.findById(projectId);
      
      if (!project) {
        throw new Error('Project not found');
      }
      
      // Get pipeline configuration
      const pipeline = this.pipelines[projectId] || {
        autoDeploy: project.autoDeploy || false,
        deployProvider: project.deployProvider || 'netlify',
        deployOptions: project.deployOptions || {},
      };
      
      // Process commits
      for (const commit of commits) {
        // Check if commit already exists
        const existingCommit = await Commit.findOne({
          sha: commit.id,
        });
        
        if (!existingCommit) {
          // Create new commit record
          const newCommit = new Commit({
            project: projectId,
            message: commit.message,
            files: commit.added.map(path => ({
              path,
              action: 'added',
            })).concat(
              commit.modified.map(path => ({
                path,
                action: 'modified',
              }))
            ).concat(
              commit.removed.map(path => ({
                path,
                action: 'removed',
              }))
            ),
            sha: commit.id,
            url: commit.url,
            status: 'committed',
          });
          
          await newCommit.save();
        }
      }
      
      // Auto-deploy if enabled
      if (pipeline.autoDeploy) {
        await this.deployProject(project, pipeline.deployProvider, pipeline.deployOptions);
      }
      
      return {
        success: true,
        message: 'Push processed successfully',
      };
    } catch (error) {
      console.error('Error processing push:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
  
  async deployProject(project, provider, options) {
    try {
      // Deploy project
      const result = await DeploymentService.deploy(project, provider, options);
      
      if (!result.success) {
        throw new Error(`Deployment failed: ${result.error}`);
      }
      
      // Create deployment record
      const deployment = new Deployment({
        project: project._id,
        provider,
        url: result.url,
        status: 'success',
        logs: result.logs,
        metadata: {
          ...result,
          options,
        },
      });
      
      await deployment.save();
      
      // Update project with latest deployment
      project.latestDeployment = deployment._id;
      project.deploymentUrl = result.url;
      
      await project.save();
      
      return {
        success: true,
        deployment,
      };
    } catch (error) {
      console.error('Error deploying project:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
  
  async updatePipelineConfig(projectId, config) {
    try {
      // Get project
      const project = await Project.findById(projectId);
      
      if (!project) {
        throw new Error('Project not found');
      }
      
      // Update project with pipeline configuration
      project.autoDeploy = config.autoDeploy;
      project.deployProvider = config.deployProvider;
      project.deployOptions = config.deployOptions;
      
      await project.save();
      
      // Update pipeline configuration
      this.pipelines[projectId] = {
        autoDeploy: config.autoDeploy,
        deployProvider: config.deployProvider,
        deployOptions: config.deployOptions,
      };
      
      return {
        success: true,
        message: 'Pipeline configuration updated successfully',
      };
    } catch (error) {
      console.error('Error updating pipeline configuration:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = new CICDService();
```

#### 4.3.2 CI/CD Controller

```javascript
// src/controllers/cicd.js
const CICDService = require('../services/cicd');
const Project = require('../models/project');

exports.setupPipeline = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Get project
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }
    
    // Setup pipeline
    const result = await CICDService.setupPipeline(project);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to setup CI/CD pipeline',
        error: result.error,
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'CI/CD pipeline setup successfully',
    });
  } catch (error) {
    console.error('Error in setupPipeline:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

exports.updatePipelineConfig = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { autoDeploy, deployProvider, deployOptions } = req.body;
    
    // Update pipeline configuration
    const result = await CICDService.updatePipelineConfig(projectId, {
      autoDeploy,
      deployProvider,
      deployOptions,
    });
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update pipeline configuration',
        error: result.error,
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Pipeline configuration updated successfully',
    });
  } catch (error) {
    console.error('Error in updatePipelineConfig:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

exports.triggerDeployment = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { provider, options } = req.body;
    
    // Get project
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }
    
    // Deploy project
    const result = await CICDService.deployProject(
      project,
      provider || project.deployProvider || 'netlify',
      options || project.deployOptions || {}
    );
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Deployment failed',
        error: result.error,
      });
    }
    
    return res.status(200).json({
      success: true,
      deployment: result.deployment,
    });
  } catch (error) {
    console.error('Error in triggerDeployment:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};
```

## 5. Integration with Existing System

### 5.1 Backend Integration

```javascript
// src/index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const conversationRoutes = require('./routes/conversations');
const llmRoutes = require('./routes/llm');
const assetsRoutes = require('./routes/assets');
const githubRoutes = require('./routes/github');
const deploymentRoutes = require('./routes/deployments');
const cicdRoutes = require('./routes/cicd');
const webhookRoutes = require('./routes/webhooks');

// Import socket service
const socketService = require('./services/socket');

// Create Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Set up socket.io
app.set('io', io);
socketService.initialize(io);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/llm', llmRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/deployments', deploymentRoutes);
app.use('/api/cicd', cicdRoutes);
app.use('/api/webhooks', webhookRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Start server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });
```

### 5.2 Frontend Integration

```javascript
// src/App.js
import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Import store
import store from './store';

// Import services
import { initializeSocket } from './services/socket';

// Import components
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';

// Import pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProjectDetails from './pages/ProjectDetails';
import ProjectConsole from './pages/ProjectConsole';
import Conversation from './pages/Conversation';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#ff9800',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
});

const App = () => {
  useEffect(() => {
    // Initialize socket connection
    initializeSocket(store);
    
    // Cleanup on unmount
    return () => {
      // Socket cleanup handled in the service
    };
  }, []);
  
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="projects/:projectId" element={<ProjectDetails />} />
              <Route path="projects/:projectId/console" element={<ProjectConsole />} />
              <Route path="projects/:projectId/conversations/:conversationId" element={<Conversation />} />
              <Route path="profile" element={<Profile />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
};

export default App;
```

## 6. Testing Strategy

### 6.1 Unit Tests

```javascript
// tests/unit/services/github.test.js
const GitHubService = require('../../../src/services/github');
const { Octokit } = require('@octokit/rest');

// Mock Octokit
jest.mock('@octokit/rest');

describe('GitHub Service', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
  });
  
  it('should create a repository successfully', async () => {
    // Mock implementation
    Octokit.mockImplementation(() => ({
      repos: {
        createForAuthenticatedUser: jest.fn().mockResolvedValue({
          data: {
            name: 'test-repo',
            owner: {
              login: 'test-owner',
            },
            html_url: 'https://github.com/test-owner/test-repo',
          },
        }),
      },
    }));
    
    const result = await GitHubService.createRepository(
      'test-repo',
      'Test repository',
      true
    );
    
    expect(result.success).toBe(true);
    expect(result.repo.name).toBe('test-repo');
    expect(result.repo.owner.login).toBe('test-owner');
  });
  
  it('should handle errors when creating a repository', async () => {
    // Mock implementation with error
    Octokit.mockImplementation(() => ({
      repos: {
        createForAuthenticatedUser: jest.fn().mockRejectedValue(
          new Error('Repository creation failed')
        ),
      },
    }));
    
    const result = await GitHubService.createRepository(
      'test-repo',
      'Test repository',
      true
    );
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Repository creation failed');
  });
  
  // Add more tests for other methods
});
```

### 6.2 Integration Tests

```javascript
// tests/integration/controllers/cicd.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../../src/app');
const Project = require('../../../src/models/project');
const User = require('../../../src/models/user');
const CICDService = require('../../../src/services/cicd');

// Mock CICDService
jest.mock('../../../src/services/cicd');

describe('CI/CD Controller', () => {
  let token;
  let projectId;
  
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI_TEST);
    
    // Create test user
    const user = new User({
      name: 'Test User',
      email: 'test@example.com',
      oauthProvider: 'test',
      oauthId: '123456',
    });
    
    await user.save();
    
    // Create test project
    const project = new Project({
      name: 'Test Project',
      description: 'Test project description',
      user: user._id,
      gitRepo: 'test-repo',
      gitOwner: 'test-owner',
    });
    
    await project.save();
    projectId = project._id.toString();
    
    // Get auth token
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password',
      });
    
    token = response.body.token;
  });
  
  afterAll(async () => {
    // Disconnect from test database
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });
  
  it('should setup CI/CD pipeline', async () => {
    // Mock CICDService.setupPipeline
    CICDService.setupPipeline.mockResolvedValue({
      success: true,
      message: 'CI/CD pipeline setup successfully',
    });
    
    const response = await request(app)
      .post(`/api/cicd/${projectId}/setup`)
      .set('Authorization', `Bearer ${token}`)
      .send();
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('CI/CD pipeline setup successfully');
    expect(CICDService.setupPipeline).toHaveBeenCalled();
  });
  
  it('should update pipeline configuration', async () => {
    // Mock CICDService.updatePipelineConfig
    CICDService.updatePipelineConfig.mockResolvedValue({
      success: true,
      message: 'Pipeline configuration updated successfully',
    });
    
    const response = await request(app)
      .put(`/api/cicd/${projectId}/config`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        autoDeploy: true,
        deployProvider: 'netlify',
        deployOptions: {
          buildDir: 'build',
        },
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Pipeline configuration updated successfully');
    expect(CICDService.updatePipelineConfig).toHaveBeenCalledWith(
      projectId,
      {
        autoDeploy: true,
        deployProvider: 'netlify',
        deployOptions: {
          buildDir: 'build',
        },
      }
    );
  });
  
  it('should trigger deployment', async () => {
    // Mock CICDService.deployProject
    CICDService.deployProject.mockResolvedValue({
      success: true,
      deployment: {
        id: 'test-deployment-id',
        provider: 'netlify',
        url: 'https://test-project.netlify.app',
      },
    });
    
    const response = await request(app)
      .post(`/api/cicd/${projectId}/deploy`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        provider: 'netlify',
        options: {
          buildDir: 'build',
        },
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.deployment.provider).toBe('netlify');
    expect(response.body.deployment.url).toBe('https://test-project.netlify.app');
  });
});
```

### 6.3 End-to-End Tests

```javascript
// tests/e2e/projectConsole.test.js
const puppeteer = require('puppeteer');

describe('Project Console', () => {
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
  });
  
  afterAll(async () => {
    await browser.close();
  });
  
  it('should navigate to project console', async () => {
    // Click on first project
    await page.click('.project-card');
    
    // Wait for project details to load
    await page.waitForSelector('.project-details');
    
    // Click on console button
    await page.click('button.console-button');
    
    // Wait for console to load
    await page.waitForSelector('.transcript-viewer');
    
    // Check if console components are visible
    const transcriptViewer = await page.$('.transcript-viewer');
    const livePreview = await page.$('.live-preview');
    const commitApproval = await page.$('.commit-approval');
    const actionControls = await page.$('.action-controls');
    
    expect(transcriptViewer).not.toBeNull();
    expect(livePreview).not.toBeNull();
    expect(commitApproval).not.toBeNull();
    expect(actionControls).not.toBeNull();
  });
  
  it('should display real-time updates', async () => {
    // Wait for console to load
    await page.waitForSelector('.transcript-viewer');
    
    // Get initial message count
    const initialMessageCount = await page.$$eval(
      '.message-item',
      (items) => items.length
    );
    
    // Simulate new message (this would normally come from socket.io)
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('socket:new_message', {
          detail: {
            message: {
              id: 'test-message-id',
              role: 'builder',
              content: 'Test message from builder',
              createdAt: new Date().toISOString(),
            },
          },
        })
      );
    });
    
    // Wait for new message to appear
    await page.waitForFunction(
      (count) => document.querySelectorAll('.message-item').length > count,
      {},
      initialMessageCount
    );
    
    // Check if new message is displayed
    const newMessageCount = await page.$$eval(
      '.message-item',
      (items) => items.length
    );
    
    expect(newMessageCount).toBe(initialMessageCount + 1);
  });
  
  it('should approve a commit', async () => {
    // Wait for console to load
    await page.waitForSelector('.commit-approval');
    
    // Check if there are pending commits
    const hasPendingCommits = await page.$('.commit-item');
    
    if (hasPendingCommits) {
      // Click approve button
      await page.click('.commit-item .approve-button');
      
      // Wait for approval to complete
      await page.waitForFunction(
        () => !document.querySelector('.commit-item .approve-button')
      );
      
      // Check if commit was approved
      const approvedCommit = await page.$('.commit-item.approved');
      expect(approvedCommit).not.toBeNull();
    }
  });
});
```

## 7. Deployment Plan

### 7.1 Prerequisites

- Node.js 16+
- MongoDB
- Redis
- GitHub API access
- Netlify, Vercel, or Docker for deployment providers
- Netlify CLI, Vercel CLI, or Docker installed

### 7.2 Environment Variables

```
# Server Configuration
PORT=5000
NODE_ENV=production
API_URL=https://api.mcp-system.com
FRONTEND_URL=https://mcp-system.com

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/mcp-system

# JWT Configuration
JWT_SECRET=your-secure-jwt-secret-key

# GitHub Configuration
GITHUB_TOKEN=your-github-token
WEBHOOK_SECRET=your-webhook-secret

# Deployment Providers
NETLIFY_AUTH_TOKEN=your-netlify-auth-token
VERCEL_TOKEN=your-vercel-token

# LLM API Keys
ANTHROPIC_API_KEY=your-anthropic-api-key
OPENAI_API_KEY=your-openai-api-key
OPENAI_ORG_ID=your-openai-org-id
```

### 7.3 Deployment Steps

1. **Update Dependencies**
   ```bash
   # Backend
   cd mcp-system/backend
   npm install socket.io @octokit/rest netlify-cli vercel
   
   # Frontend
   cd mcp-system/frontend
   npm install socket.io-client react-syntax-highlighter date-fns
   ```

2. **Update Backend Code**
   - Copy new service files to appropriate directories
   - Update controllers and routes
   - Update models with new schemas
   - Update socket.io integration

3. **Update Frontend Code**
   - Add new components for real-time monitoring
   - Add live preview component
   - Add commit approval component
   - Add action controls component
   - Update project console page

4. **Set Up CI/CD Pipeline**
   - Configure GitHub webhooks
   - Set up deployment providers
   - Configure automatic deployment

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

## 8. User Interface Mockups

### 8.1 Project Console Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│ MCP System                                                   User ▼     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐                                                        │
│  │ Dashboard   │  Project Name: Hotel28 Website                         │
│  │ Projects    │  Description: Responsive hotel booking website         │
│  │ Settings    │                                                        │
│  │             │  ┌─────────────────────────────────────────────────┐  │
│  │             │  │ Agent Controls                                  │  │
│  │             │  │                                                 │  │
│  │             │  │ Workflow:  [▶ Continue] [■ Pause]              │  │
│  │             │  │ Actions:   [🐞 Debug] [↻ Refactor] [⚙ Optimize] │  │
│  │             │  │ Deploy:    [🔨 Build] [☁ Deploy]               │  │
│  │             │  └─────────────────────────────────────────────────┘  │
│  │             │                                                        │
│  │             │  ┌─────────────────────────┐ ┌─────────────────────┐  │
│  │             │  │ Transcript              │ │ Live Preview        │  │
│  │             │  │                         │ │                     │  │
│  │             │  │ [User] Create a landing │ │                     │  │
│  │             │  │ page for Hotel28       │ │                     │  │
│  │             │  │                         │ │                     │  │
│  │             │  │ [Builder] I'll create a │ │                     │  │
│  │             │  │ responsive landing page │ │                     │  │
│  │             │  │ with booking features.  │ │                     │  │
│  │             │  │                         │ │                     │  │
│  │             │  │ [Tool] Executing code   │ │                     │  │
│  │             │  │ interpreter...          │ │                     │  │
│  │             │  │                         │ │                     │  │
│  │             │  └─────────────────────────┘ └─────────────────────┘  │
│  │             │                                                        │
│  │             │  ┌─────────────────────────────────────────────────┐  │
│  │             │  │ Pending Commits                                 │  │
│  │             │  │                                                 │  │
│  │             │  │ [index.html, styles.css] - Add landing page     │  │
│  │             │  │ Files: 2 modified                               │  │
│  │             │  │ [🐞 Debug] [↻ Refactor]   [✗ Reject] [✓ Approve] │  │
│  │             │  │                                                 │  │
│  │             │  └─────────────────────────────────────────────────┘  │
│  └─────────────┘                                                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Transcript Viewer

```
┌─────────────────────────────────────────────────────────────────┐
│ Transcript                                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [User] 10:15 AM                                                │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Create a landing page for Hotel28 with a booking form   │    │
│  │ and image gallery.                                      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  [Builder] 10:16 AM                                             │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ I'll create a responsive landing page with a booking    │    │
│  │ form and image gallery for Hotel28. Let me start with   │    │
│  │ the HTML structure.                                     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  [Tool] Code Interpreter                                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ```html                                                 │    │
│  │ <!DOCTYPE html>                                         │    │
│  │ <html lang="en">                                        │    │
│  │ <head>                                                  │    │
│  │   <meta charset="UTF-8">                                │    │
│  │   <meta name="viewport" content="width=device-width,    │    │
│  │   initial-scale=1.0">                                   │    │
│  │   <title>Hotel28 - Luxury Stay</title>                  │    │
│  │   <link rel="stylesheet" href="styles.css">             │    │
│  │ </head>                                                 │    │
│  │ <body>                                                  │    │
│  │   <!-- More HTML code... -->                            │    │
│  │ </body>                                                 │    │
│  │ </html>                                                 │    │
│  │ ```                                                     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  [Judge] 10:18 AM                                               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ The HTML structure looks good, but we should add meta    │    │
│  │ tags for SEO and consider adding a favicon. Also, let's  │    │
│  │ make sure the booking form has proper validation.        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.3 Commit Approval

```
┌─────────────────────────────────────────────────────────────────┐
│ Pending Commits                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ [Builder] Add landing page with booking form             │    │
│  │                                                         │    │
│  │ Files:                                                  │    │
│  │ ├── index.html                                          │    │
│  │ ├── styles.css                                          │    │
│  │ └── scripts.js                                          │    │
│  │                                                         │    │
│  │ [🐞 Debug] [↻ Refactor]         [✗ Reject] [✓ Approve]   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ [Builder] Add image gallery component                    │    │
│  │                                                         │    │
│  │ Files:                                                  │    │
│  │ ├── components/gallery.js                               │    │
│  │ ├── styles/gallery.css                                  │    │
│  │ └── assets/images/hotel1.jpg                            │    │
│  │                                                         │    │
│  │ [🐞 Debug] [↻ Refactor]         [✗ Reject] [✓ Approve]   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.4 Live Preview

```
┌─────────────────────────────────────────────────────────────────┐
│ Live Preview                                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │   ┌─────────────────────────────────────────────────┐   │    │
│  │   │                  HOTEL28                        │   │    │
│  │   │                                                 │   │    │
│  │   │  [Home] [Rooms] [Amenities] [Contact]          │   │    │
│  │   │                                                 │   │    │
│  │   │  ┌─────────────────────────────────────────┐   │   │    │
│  │   │  │                                         │   │   │    │
│  │   │  │       Luxury Accommodations             │   │   │    │
│  │   │  │       in the Heart of the City          │   │   │    │
│  │   │  │                                         │   │   │    │
│  │   │  │       [Book Now]                        │   │   │    │
│  │   │  │                                         │   │   │    │
│  │   │  └─────────────────────────────────────────┘   │   │    │
│  │   │                                                 │   │    │
│  │   │  ┌─────────────────────────────────────────┐   │   │    │
│  │   │  │ Check-in    Check-out    Guests         │   │   │    │
│  │   │  │ [        ]  [        ]   [      ]       │   │   │    │
│  │   │  │                                         │   │   │    │
│  │   │  │             [Search Availability]       │   │   │    │
│  │   │  └─────────────────────────────────────────┘   │   │    │
│  │   │                                                 │   │    │
│  │   └─────────────────────────────────────────────────┘   │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  [↻ Refresh Preview]                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 9. Conclusion

This technical specification outlines the implementation plan for Phase 3 of the MCP System, focusing on building a real-time development UI and implementing CI/CD capabilities. The implementation will enhance the system with a web-based console for non-technical users and automate the development workflow through continuous integration and deployment.

The key deliverables for this phase include:
1. Web-based console with real-time monitoring, live file preview, and action controls
2. GitHub integration for automatic code commits and repository management
3. Deployment automation with support for Netlify, Vercel, and Docker
4. CI/CD pipeline for automated testing and deployment

This phase builds upon the existing MCP System with LangChain integration and LangGraph workflow, providing a comprehensive environment for non-technical users to manage and control the agent-driven development process.
