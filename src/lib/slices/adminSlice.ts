import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { AdminVM, VMResourceUpdate } from '../../types';
import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const enableBackend = import.meta.env.VITE_ENABLE_BACKEND === '1';

// Асинхронные thunks для админа
export const fetchAllUsersVMsAsync = createAsyncThunk(
  'admin/fetchAllUsersVMs',
  async () => {
    if (enableBackend) {
      const response = await axios.get<AdminVM[]>(`${apiUrl}/v1/admin/vms/`);
      return response.data;
    }
    return [];
  }
);

export const updateVMResourcesAsync = createAsyncThunk(
  'admin/updateVMResources',
  async (data: VMResourceUpdate) => {
    if (enableBackend) {
      const response = await axios.put(`${apiUrl}/v1/admin/vms/${data.id}/resources/`, {
        cpu_cores: data.cpu_cores,
        ram_mb: data.ram_mb,
        storage: data.storage
      });
      return response.data;
    }
    return data as AdminVM;
  }
);

interface AdminState {
  vms: AdminVM[];
  loading: boolean;
  error: string | null;
}

const initialState: AdminState = {
  vms: [],
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
      });
  },
});

export const { clearError, clearAdminData } = adminSlice.actions;

// Селекторы
export const selectAdminVMs = (state: { admin: AdminState }) => state.admin.vms;
export const selectAdminLoading = (state: { admin: AdminState }) => state.admin.loading;
export const selectAdminError = (state: { admin: AdminState }) => state.admin.error;

export default adminSlice.reducer;
