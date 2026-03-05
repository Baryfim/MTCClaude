import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { DeployedVM, Activity } from '../../types';
import { apiRequestWithAuth, enableBackend } from '../api';
import { fetchAllVMMetricsAsync } from './vmMetricsSlice';

const addActivity = (state: UserVMsState, action: string, vmName: string) => {
  state.activities.unshift({
    id: Date.now(),
    action,
    vmName,
    timestamp: new Date().toLocaleString('ru-RU'),
    status: 'success'
  });
};

// Асинхронные thunks для управления VM пользователя
export const checkVMStatusAsync = createAsyncThunk(
  'userVMs/checkVMStatus',
  async (vmId: number) => {
    if (enableBackend) {
      const response = await apiRequestWithAuth<{ status: string }>('GET', `/v1/resources/${vmId}/`);
      return { vmId, status: response.status };
    }
    return { vmId, status: 'active' };
  }
);

export const startVMAsync = createAsyncThunk(
  'userVMs/startVM',
  async (vmId: number, { dispatch }) => {
    if (enableBackend) {
      await apiRequestWithAuth('POST', `/v1/resources/${vmId}/start/`);
      setTimeout(() => {
        dispatch(checkVMStatusAsync(vmId));
      }, 4500);
    }
    return vmId;
  }
);

export const stopVMAsync = createAsyncThunk(
  'userVMs/stopVM',
  async (vmId: number) => {
    if (enableBackend) {
      await apiRequestWithAuth('POST', `/v1/resources/${vmId}/stop/`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    return vmId;
  }
);

export const deleteVMAsync = createAsyncThunk(
  'userVMs/deleteVM',
  async (vmId: number) => {
    if (enableBackend) {
      await apiRequestWithAuth('DELETE', `/v1/resources/${vmId}`);
    }
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

    restartVM: (state, action: PayloadAction<number>) => {
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
      .addCase(startVMAsync.pending, (state, action) => {
        const vmId = action.meta.arg;
        const vm = state.inactiveVMs.find(v => v.id === vmId) || state.activeVMs.find(v => v.id === vmId);
        if (vm) vm.status = 'creating';
      })
      .addCase(startVMAsync.fulfilled, (state, action) => {
        const vmIndex = state.inactiveVMs.findIndex(vm => vm.id === action.payload);
        if (vmIndex !== -1) {
          const vm = state.inactiveVMs[vmIndex];
          vm.status = 'creating';
          addActivity(state, 'Запуск ВМ', vm.name);
        }
      })
      .addCase(checkVMStatusAsync.fulfilled, (state, action) => {
        const { vmId, status } = action.payload;
        if (status === 'active') {
          const vmIndex = state.inactiveVMs.findIndex(vm => vm.id === vmId);
          if (vmIndex !== -1) {
            const vm = state.inactiveVMs[vmIndex];
            vm.status = 'running';
            state.activeVMs.push(vm);
            state.inactiveVMs.splice(vmIndex, 1);
            addActivity(state, 'Запущена ВМ', vm.name);
          } else {
            const activeVM = state.activeVMs.find(vm => vm.id === vmId);
            if (activeVM) activeVM.status = 'running';
          }
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
      })
      .addCase(fetchAllVMMetricsAsync.fulfilled, (state, action) => {
        console.log('📊 [userVMsSlice] Обновление VM метриками:', action.payload);
        
        // Обновить метрики для каждой VM
        action.payload.forEach(({ vmId, metrics }) => {
          // Поиск VM в активных
          const activeVMIndex = state.activeVMs.findIndex(vm => vm.id === vmId);
          if (activeVMIndex !== -1) {
            const vm = state.activeVMs[activeVMIndex];
            console.log(`🔄 [userVMsSlice] Обновление метрик для активной VM ${vmId}:`, metrics);
            
            // ВАЖНО: VMMetrics от сервера содержит cpu_cores, ram_mb, storage, status
            // Нужно добавить реальные метрики использования в процентах от сервера
            // Пока логгируем что приходит
            console.warn(`⚠️ [userVMsSlice] VMMetrics не содержит данных об использовании ресурсов в процентах`);
            console.log(`ℹ️ [userVMsSlice] Получено:`, {
              cpu_cores: metrics.cpu_cores,
              ram_mb: metrics.ram_mb,
              storage: metrics.storage,
              status: metrics.status
            });
          }
          
          // Поиск VM в неактивных
          const inactiveVMIndex = state.inactiveVMs.findIndex(vm => vm.id === vmId);
          if (inactiveVMIndex !== -1) {
            console.log(`ℹ️ [userVMsSlice] VM ${vmId} найдена в неактивных`);
          }
        });
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
