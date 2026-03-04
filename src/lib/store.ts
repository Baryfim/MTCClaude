import { configureStore } from '@reduxjs/toolkit';
import userVMsReducer from './slices/userVMsSlice';
import adminReducer from './slices/adminSlice';
import vmMetricsReducer from './slices/vmMetricsSlice';

export const store = configureStore({
  reducer: {
    userVMs: userVMsReducer,
    admin: adminReducer,
    vmMetrics: vmMetricsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
