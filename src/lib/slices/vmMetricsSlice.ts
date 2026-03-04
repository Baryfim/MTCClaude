import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { VMMetrics, VMMetricsHistory } from '../../types';
import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Асинхронные thunks для метрик
export const fetchVMMetricsAsync = createAsyncThunk(
  'vmMetrics/fetchVMMetrics',
  async (vmId: string) => {
    const response = await axios.get<VMMetrics>(`${apiUrl}/v1/resources/${vmId}/metrics/`);
    return { vmId, metrics: response.data };
  }
);

export const fetchAllVMMetricsAsync = createAsyncThunk(
  'vmMetrics/fetchAllVMMetrics',
  async (vmIds: string[]) => {
    const promises = vmIds.map(async (vmId) => {
      try {
        const response = await axios.get<VMMetrics>(`${apiUrl}/v1/resources/${vmId}/metrics/`);
        return { vmId, metrics: response.data };
      } catch (error) {
        console.error(`Failed to fetch metrics for VM ${vmId}:`, error);
        return null;
      }
    });
    const results = await Promise.all(promises);
    return results.filter((result): result is { vmId: string; metrics: VMMetrics } => result !== null);
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
    updateVMMetrics: (state, action: PayloadAction<{ vmId: string; metrics: VMMetrics }>) => {
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

    removeVMMetrics: (state, action: PayloadAction<string>) => {
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
export const selectVMMetricsById = (vmId: string) => (state: { vmMetrics: VMMetricsState }) => 
  state.vmMetrics.metrics[vmId];
export const selectVMMetricsHistoryById = (vmId: string) => (state: { vmMetrics: VMMetricsState }) => 
  state.vmMetrics.history.filter(h => h.vmId === vmId);

export default vmMetricsSlice.reducer;
