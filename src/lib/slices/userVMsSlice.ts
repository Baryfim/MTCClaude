import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { DeployedVM, Activity } from '../../types';
import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const addActivity = (state: UserVMsState, action: string, vmName: string) => {
  state.activities.unshift({
    id: `act-${Date.now()}`,
    action,
    vmName,
    timestamp: new Date().toLocaleString('ru-RU'),
    status: 'success'
  });
};

// Асинхронные thunks для управления VM пользователя
export const startVMAsync = createAsyncThunk(
  'userVMs/startVM',
  async (vmId: string) => {
    await axios.post(`${apiUrl}/v1/resources/${vmId}/start/`);
    return vmId;
  }
);

export const stopVMAsync = createAsyncThunk(
  'userVMs/stopVM',
  async (vmId: string) => {
    await axios.post(`${apiUrl}/v1/resources/${vmId}/stop/`);
    return vmId;
  }
);

export const deleteVMAsync = createAsyncThunk(
  'userVMs/deleteVM',
  async (vmId: string) => {
    await axios.delete(`${apiUrl}/v1/resources/${vmId}`);
    return vmId;
  }
);

interface UserVMsState {
  activeVMs: DeployedVM[];
  inactiveVMs: DeployedVM[];
  activities: Activity[];
  loading: boolean;
  error: string | null;
}

const initialState: UserVMsState = {
  activeVMs: [],
  inactiveVMs: [],
  activities: [],
  loading: false,
  error: null,
};

const userVMsSlice = createSlice({
  name: 'userVMs',
  initialState,
  reducers: {
    createVM: (state, action: PayloadAction<DeployedVM>) => {
      state.activeVMs.push(action.payload);
      addActivity(state, 'Создана ВМ', action.payload.name);
    },

    restartVM: (state, action: PayloadAction<string>) => {
      const vm = state.activeVMs.find(vm => vm.id === action.payload);
      if (vm) addActivity(state, 'Перезапущена ВМ', vm.name);
    },

    updateVM: (state, action: PayloadAction<DeployedVM>) => {
      const vmIndex = state.activeVMs.findIndex(vm => vm.id === action.payload.id);
      if (vmIndex !== -1) {
        state.activeVMs[vmIndex] = action.payload;
      } else {
        const inactiveIndex = state.inactiveVMs.findIndex(vm => vm.id === action.payload.id);
        if (inactiveIndex !== -1) state.inactiveVMs[inactiveIndex] = action.payload;
      }
    },

    setAllVMs: (state, action: PayloadAction<{ active: DeployedVM[], inactive: DeployedVM[] }>) => {
      state.activeVMs = action.payload.active;
      state.inactiveVMs = action.payload.inactive;
    },

    clearActivities: (state) => {
      state.activities = [];
    },
    
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    
    clearVMs: (state) => {
      state.activeVMs = [];
      state.inactiveVMs = [];
      state.activities = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(startVMAsync.fulfilled, (state, action) => {
        const vmIndex = state.inactiveVMs.findIndex(vm => vm.id === action.payload);
        if (vmIndex !== -1) {
          const vm = state.inactiveVMs[vmIndex];
          vm.status = 'running';
          state.activeVMs.push(vm);
          state.inactiveVMs.splice(vmIndex, 1);
          addActivity(state, 'Запущена ВМ', vm.name);
        }
      })
      .addCase(stopVMAsync.fulfilled, (state, action) => {
        const vmIndex = state.activeVMs.findIndex(vm => vm.id === action.payload);
        if (vmIndex !== -1) {
          const vm = state.activeVMs[vmIndex];
          vm.status = 'stopped';
          state.inactiveVMs.push(vm);
          state.activeVMs.splice(vmIndex, 1);
          addActivity(state, 'Остановлена ВМ', vm.name);
        }
      })
      .addCase(deleteVMAsync.fulfilled, (state, action) => {
        const deletedVM = state.activeVMs.find(vm => vm.id === action.payload) || 
                          state.inactiveVMs.find(vm => vm.id === action.payload);
        
        if (deletedVM) {
          state.activeVMs = state.activeVMs.filter(vm => vm.id !== action.payload);
          state.inactiveVMs = state.inactiveVMs.filter(vm => vm.id !== action.payload);
          addActivity(state, 'Удалена ВМ', deletedVM.name);
        }
      });
  },
});

export const {
  createVM,
  restartVM,
  updateVM,
  setAllVMs,
  clearActivities,
  setLoading,
  setError,
  clearVMs,
} = userVMsSlice.actions;

// Селекторы
export const selectActiveVMs = (state: { userVMs: UserVMsState }) => state.userVMs.activeVMs;
export const selectInactiveVMs = (state: { userVMs: UserVMsState }) => state.userVMs.inactiveVMs;
export const selectAllVMs = (state: { userVMs: UserVMsState }) => [...state.userVMs.activeVMs, ...state.userVMs.inactiveVMs];
export const selectActivities = (state: { userVMs: UserVMsState }) => state.userVMs.activities;
export const selectVMsLoading = (state: { userVMs: UserVMsState }) => state.userVMs.loading;
export const selectVMsError = (state: { userVMs: UserVMsState }) => state.userVMs.error;

export default userVMsSlice.reducer;
