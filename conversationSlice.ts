import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getConversations, sendMessage } from '../services/api';
import io from 'socket.io-client';

interface Message {
  role: string;
  content: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  projectId: string;
  messages: Message[];
  createdAt: string;
}

interface ConversationState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  error: string | null;
  socket: any | null;
}

const initialState: ConversationState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  loading: false,
  error: null,
  socket: null
};

export const fetchConversations = createAsyncThunk(
  'conversations/fetchConversations',
  async (projectId: string, { rejectWithValue }) => {
    try {
      const response = await getConversations(projectId);
      return response.data.conversations;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch conversations');
    }
  }
);

export const sendUserMessage = createAsyncThunk(
  'conversations/sendUserMessage',
  async ({ projectId, content }: { projectId: string; content: string }, { rejectWithValue }) => {
    try {
      const response = await sendMessage(projectId, content);
      return response.data.message;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send message');
    }
  }
);

export const initializeSocket = createAsyncThunk(
  'conversations/initializeSocket',
  async (_, { rejectWithValue }) => {
    try {
      const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
      const socket = io(socketUrl);
      return socket;
    } catch (error: any) {
      return rejectWithValue('Failed to initialize socket connection');
    }
  }
);

const conversationSlice = createSlice({
  name: 'conversations',
  initialState,
  reducers: {
    setCurrentConversation: (state, action: PayloadAction<Conversation>) => {
      state.currentConversation = action.payload;
      state.messages = action.payload.messages;
    },
    clearCurrentConversation: (state) => {
      state.currentConversation = null;
      state.messages = [];
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
    },
    clearError: (state) => {
      state.error = null;
    },
    joinProject: (state, action: PayloadAction<string>) => {
      if (state.socket) {
        state.socket.emit('join_project', action.payload);
      }
    },
    leaveProject: (state, action: PayloadAction<string>) => {
      if (state.socket) {
        state.socket.emit('leave_project', action.payload);
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Conversations
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action: PayloadAction<Conversation[]>) => {
        state.loading = false;
        state.conversations = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch conversations';
      })
      // Send Message
      .addCase(sendUserMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendUserMessage.fulfilled, (state, action: PayloadAction<Message>) => {
        state.loading = false;
        state.messages.push(action.payload);
      })
      .addCase(sendUserMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to send message';
      })
      // initializeSocket
      .addCase(initializeSocket.fulfilled, (state, action) => {
        state.socket = action.payload;
      });
  }
});

export const { 
  setCurrentConversation, 
  clearCurrentConversation, 
  addMessage, 
  clearError,
  joinProject,
  leaveProject
} = conversationSlice.actions;
export default conversationSlice.reducer;
