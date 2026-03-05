import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { VMMetrics, VMMetricsHistory } from '../../types';
import { apiRequestWithAuth, enableBackend } from '../api';

// Асинхронные thunks для метрик
export const fetchVMMetricsAsync = createAsyncThunk(
  'vmMetrics/fetchVMMetrics',
  async (vmId: number) => {
    if (enableBackend) {
      const metrics = await apiRequestWithAuth<VMMetrics>('GET', `/v1/resources/${vmId}/metrics/`);
      return { vmId, metrics };
    }
    return { vmId, metrics: {} as VMMetrics };
  }
);

export const fetchAllVMMetricsAsync = createAsyncThunk(
  'vmMetrics/fetchAllVMMetrics',
  async (vmIds: number[]) => {
    console.log('🔍 [vmMetricsSlice] Запрос метрик для VM IDs:', vmIds);
    console.log('🔧 [vmMetricsSlice] Backend enabled:', enableBackend);
    
    const promises = vmIds.map(async (vmId) => {
      try {
        if (enableBackend) {
          console.log(`📡 [vmMetricsSlice] Отправка запроса метрик для VM ${vmId}`);
          const metrics = await apiRequestWithAuth<VMMetrics>('GET', `/v1/resources/${vmId}/metrics/`);
          console.log(`✅ [vmMetricsSlice] Получены метрики для VM ${vmId}:`, metrics);
          return { vmId, metrics };
        }
        console.log(`⚠️ [vmMetricsSlice] Backend отключен, возвращаем пустые метрики для VM ${vmId}`);
        return { vmId, metrics: {} as VMMetrics };
      } catch (error) {
        console.error(`❌ [vmMetricsSlice] Ошибка получения метрик для VM ${vmId}:`, error);
        return null;
      }
    });
    const results = await Promise.all(promises);
    const filtered = results.filter((result): result is { vmId: number; metrics: VMMetrics } => result !== null);
    console.log('📦 [vmMetricsSlice] Итоговые метрики:', filtered);
    return filtered;
  }
);

interface VMMetricsState {
  metrics: Record<string, VMMetrics>;
  history: VMMetricsHistory[];
  loading: boolean;
  error: string | null;
}

const initialState: VMMetricsState = {
  metrics: {},
  history: [],
  loading: false,
  error: null,
};

const vmMetricsSlice = createSlice({
  name: 'vmMetrics',
  initialState,
  reducers: {
    updateVMMetrics: (state, action: PayloadAction<{ vmId: number; metrics: VMMetrics }>) => {
      state.metrics[action.payload.vmId] = action.payload.metrics;
      
      // Добавить в историю метрик
      state.history.push({
        vmId: action.payload.vmId,
        timestamp: new Date().toISOString(),
        metrics: action.payload.metrics,
      });

      // Ограничить историю последними 100 записями на VM
      const historyLimit = 100;
      const vmHistoryCount = state.history.filter(h => h.vmId === action.payload.vmId).length;
      if (vmHistoryCount > historyLimit) {
        const vmHistoryIndex = state.history.findIndex(h => h.vmId === action.payload.vmId);
        if (vmHistoryIndex !== -1) {
          state.history.splice(vmHistoryIndex, 1);
        }
      }
    },

    clearMetricsHistory: (state) => {
      state.history = [];
    },

    removeVMMetrics: (state, action: PayloadAction<number>) => {
      delete state.metrics[action.payload];
      state.history = state.history.filter(h => h.vmId !== action.payload);
    },

    clearAllMetrics: (state) => {
      state.metrics = {};
      state.history = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVMMetricsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVMMetricsAsync.fulfilled, (state, action) => {
        state.metrics[action.payload.vmId] = action.payload.metrics;
        
        state.history.push({
          vmId: action.payload.vmId,
          timestamp: new Date().toISOString(),
          metrics: action.payload.metrics,
        });
        state.loading = false;
      })
      .addCase(fetchVMMetricsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Ошибка загрузки метрик';
      })
      .addCase(fetchAllVMMetricsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllVMMetricsAsync.fulfilled, (state, action) => {
        action.payload.forEach(({ vmId, metrics }) => {
          state.metrics[vmId] = metrics;
          
          state.history.push({
            vmId,
            timestamp: new Date().toISOString(),
            metrics,
          });
        });
        state.loading = false;
      })
      .addCase(fetchAllVMMetricsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Ошибка загрузки метрик';
      });
  },
});

export const {
  updateVMMetrics,
  clearMetricsHistory,
  removeVMMetrics,
  clearAllMetrics,
} = vmMetricsSlice.actions;

// Селекторы
export const selectVMMetrics = (state: { vmMetrics: VMMetricsState }) => state.vmMetrics.metrics;
export const selectMetricsHistory = (state: { vmMetrics: VMMetricsState }) => state.vmMetrics.history;
export const selectMetricsLoading = (state: { vmMetrics: VMMetricsState }) => state.vmMetrics.loading;
export const selectMetricsError = (state: { vmMetrics: VMMetricsState }) => state.vmMetrics.error;
export const selectVMMetricsById = (vmId: number) => (state: { vmMetrics: VMMetricsState }) => 
  state.vmMetrics.metrics[vmId];
export const selectVMMetricsHistoryById = (vmId: number) => (state: { vmMetrics: VMMetricsState }) => 
  state.vmMetrics.history.filter(h => h.vmId === vmId);

export default vmMetricsSlice.reducer;
