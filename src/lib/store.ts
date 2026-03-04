import { configureStore } from '@reduxjs/toolkit';
import userVMsReducer from './slices/userVMsSlice';

export const store = configureStore({
  reducer: {
    userVMs: userVMsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
