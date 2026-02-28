import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { apiSlice } from '@api/apiSlice';
import authReducer from '@features/auth/authSlice';
import uiReducer from './slices/uiSlice';
import notificationReducer from '@features/notifications/notificationSlice';

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: authReducer,
    ui: uiReducer,
    notifications: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(apiSlice.middleware),
  devTools: import.meta.env.DEV,
});

// Enable RTK Query cache invalidation on focus/reconnect
setupListeners(store.dispatch);

export default store;