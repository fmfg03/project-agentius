import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices-fixed/authSlice';
import projectReducer from './slices-fixed/projectSlice';
import conversationReducer from './slices-fixed/conversationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    projects: projectReducer,
    conversations: conversationReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
