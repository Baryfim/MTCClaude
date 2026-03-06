import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { AdminVM, VMResourceUpdate, VMMetrics } from '../../types';
import { apiRequestWithAuth, enableBackend } from '../api';
import { generateMockAdminVMs, isMobile } from '../mockData';

// Асинхронные thunks для админа
export const fetchAllUsersVMsAsync = createAsyncThunk(
  'admin/fetchAllUsersVMs',
  async () => {
    if (enableBackend) {
      return await apiRequestWithAuth<AdminVM[]>('GET', '/v1/resources/');
    }
    // Фейковые данные для демо-режима на мобильных
    if (isMobile()) {
      return generateMockAdminVMs(5);
    }
    return [];
  }
);

export const updateVMResourcesAsync = createAsyncThunk(
  'admin/updateVMResources',
  async (data: VMResourceUpdate) => {
    if (enableBackend) {
      const { id, ...updateData } = data;
      return await apiRequestWithAuth<AdminVM>('PATCH', `/v1/resources/${id}/`, updateData);
    }
    return data as unknown as AdminVM;
  }
);

export const fetchActiveVMMetricsAsync = createAsyncThunk(
  'admin/fetchActiveVMMetrics',
  async (vmIds: number[]) => {
    if (enableBackend && vmIds.length > 0) {
      const promises = vmIds.map(async (vmId) => {
        try {
          const metrics = await apiRequestWithAuth<VMMetrics>('GET', `/v1/resources/${vmId}/metrics/`);
          return { vmId, metrics };
        } catch (error) {
          return null;
        }
      });
      const results = await Promise.all(promises);
      return results.filter((r): r is { vmId: number; metrics: VMMetrics } => r !== null);
    }
    // Фейковые метрики для демо-режима на мобильных
    if (isMobile() && vmIds.length > 0) {
      return vmIds.map(vmId => ({
        vmId,
        metrics: {
          cpu_percent: Math.random() * 100,
          memory_used_mb: Math.random() * 4096,
          memory_limit_mb: 4096,
          disk_used_mb: Math.random() * 40,
          disk_limit_bytes: 40 * 1024 * 1024 * 1024,
          network_rx_bytes: Math.random() * 1000000,
          network_tx_bytes: Math.random() * 1000000
        } as VMMetrics
      }));
    }
    return [];
  }
);

interface AdminState {
  vms: AdminVM[];
  vmMetrics: Record<number, VMMetrics>;
  loading: boolean;
  error: string | null;
}

const initialState: AdminState = {
  vms: [],
  vmMetrics: {},
  loading: false,
  error: null,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearAdminData: (state) => {
      state.vms = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all users VMs
      .addCase(fetchAllUsersVMsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllUsersVMsAsync.fulfilled, (state, action) => {
        state.vms = action.payload;
        state.loading = false;
      })
      .addCase(fetchAllUsersVMsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Ошибка загрузки VM';
      })
      // Update VM resources
      .addCase(updateVMResourcesAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateVMResourcesAsync.fulfilled, (state, action) => {
        const vmIndex = state.vms.findIndex(vm => vm.id === action.payload.id);
        if (vmIndex !== -1) {
          state.vms[vmIndex] = { ...state.vms[vmIndex], ...action.payload };
        }
        state.loading = false;
      })
      .addCase(updateVMResourcesAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Ошибка обновления ресурсов VM';
      })
      // Fetch active VM metrics
      .addCase(fetchActiveVMMetricsAsync.fulfilled, (state, action) => {
        action.payload.forEach(({ vmId, metrics }) => {
          state.vmMetrics[vmId] = metrics;
        });
      });
  },
});

export const { clearError, clearAdminData } = adminSlice.actions;

// Селекторы
export const selectAdminVMs = (state: { admin: AdminState }) => state.admin.vms;
export const selectAdminVMMetrics = (state: { admin: AdminState }) => state.admin.vmMetrics;
export const selectAdminLoading = (state: { admin: AdminState }) => state.admin.loading;
export const selectAdminError = (state: { admin: AdminState }) => state.admin.error;

export default adminSlice.reducer;
