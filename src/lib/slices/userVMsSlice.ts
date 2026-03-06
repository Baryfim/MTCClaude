import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { DeployedVM, Activity, UserVM, VMInstance, INSTANCE_TYPES } from '../../types';
import { apiRequestWithAuth, enableBackend } from '../api';
import { generateMockVMs, generateMockActivities, isMobile } from '../mockData';

const addActivity = (state: UserVMsState, action: string, vmName: string) => {
  state.activities.unshift({
    id: Date.now(),
    action,
    vmName,
    timestamp: new Date().toLocaleString('ru-RU'),
    status: 'success'
  });
};

const mapUserVMToDeployedVM = (vm: UserVM): DeployedVM => {
  const existingInstance = INSTANCE_TYPES.find(
    inst => inst.cpu === vm.cpu_cores && inst.ram === vm.ram_mb
  );
  
  const config: VMInstance = existingInstance || {
    id: `custom-${vm.id}`,
    name: 'Пользовательская',
    cpu: vm.cpu_cores,
    ram: vm.ram_mb,
    storage: vm.storage || 20,
    pricePerHour: vm.price_per_hour || 0,
    tier: 'Общего назначения'
  };

  const statusMap: Record<string, 'running' | 'stopped' | 'creating' | 'error'> = {
    'RUNNING': 'running',
    'STOPPED': 'stopped',
    'CREATING': 'creating',
    'ERROR': 'error',
    'DELETING': 'stopped'
  };

  return {
    id: vm.id,
    name: vm.name,
    hostname: vm.tenant_name,
    status: statusMap[vm.status] || 'stopped',
    config,
    ipAddress: '0.0.0.0',
    port: 5900,
    cpuUsage: 0,
    ramUsage: 0,
    diskUsage: 0,
    uptime: '0ч',
    network: 'default',
    snapshots: []
  };
};

// Асинхронные thunks для управления VM пользователя
export const fetchUserVMs = createAsyncThunk(
  'userVMs/fetchUserVMs',
  async () => {
    if (!enableBackend) {
      // Фейковые данные для демо-режима на мобильных
      if (isMobile()) {
        return generateMockVMs(3);
      }
      return [];
    }
    const vms = await apiRequestWithAuth<UserVM[]>('GET', '/v1/resources/');
    return vms.map(mapUserVMToDeployedVM);
  }
);

export const startVMAsync = createAsyncThunk(
  'userVMs/startVM',
  async (vmId: number, { dispatch }) => {
    if (enableBackend) {
      await apiRequestWithAuth('POST', `/v1/resources/${vmId}/start/`);
    }
    
    // Через 4 секунды меняем статус на running
    setTimeout(() => {
      dispatch(completeVMStart(vmId));
    }, 4000);
    
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
      await apiRequestWithAuth('DELETE', `/v1/resources/${vmId}/`);
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
      // VM со статусом stopped добавляется в inactiveVMs
      if (action.payload.status === 'stopped') {
        state.inactiveVMs.push(action.payload);
      } else {
        state.activeVMs.push(action.payload);
      }
      addActivity(state, 'Создана ВМ', action.payload.name);
    },

    restartVM: (state, action: PayloadAction<number>) => {
      const vm = state.activeVMs.find(vm => vm.id === action.payload);
      if (vm) addActivity(state, 'Перезапущена ВМ', vm.name);
    },

    updateVM: (state, action: PayloadAction<DeployedVM>) => {
      console.log('updateVM вызван с данными:', action.payload);
      const vmIndex = state.activeVMs.findIndex(vm => vm.id === action.payload.id);
      if (vmIndex !== -1) {
        console.log('Обновление VM в activeVMs, индекс:', vmIndex);
        state.activeVMs[vmIndex] = action.payload;
      } else {
        const inactiveIndex = state.inactiveVMs.findIndex(vm => vm.id === action.payload.id);
        if (inactiveIndex !== -1) {
          console.log('Обновление VM в inactiveVMs, индекс:', inactiveIndex);
          state.inactiveVMs[inactiveIndex] = action.payload;
        } else {
          console.error('VM не найдена ни в activeVMs, ни в inactiveVMs, id:', action.payload.id);
        }
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
    
    completeVMStart: (state, action: PayloadAction<number>) => {
      const vmId = action.payload;
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
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserVMs.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserVMs.fulfilled, (state, action) => {
        state.loading = false;
        const vms = action.payload;
        state.activeVMs = vms.filter(vm => vm.status === 'running' || vm.status === 'creating');
        state.inactiveVMs = vms.filter(vm => vm.status === 'stopped' || vm.status === 'error');
        
        // Добавляем фейковые активности в демо-режиме
        if (!enableBackend && isMobile() && state.activities.length === 0) {
          const mockActivities = generateMockActivities(8);
          state.activities = mockActivities.map((activity, index) => ({
            id: Date.now() + index,
            action: activity.action,
            vmName: vms[index % vms.length]?.name || 'Server-1',
            timestamp: activity.timestamp,
            status: 'success' as const
          }));
        }
      })
      .addCase(fetchUserVMs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Ошибка загрузки VM';
      })
      .addCase(startVMAsync.pending, (state, action) => {
        const vmId = action.meta.arg;
        const vm = state.inactiveVMs.find(v => v.id === vmId) || state.activeVMs.find(v => v.id === vmId);
        if (vm) {
          vm.status = 'creating';
          addActivity(state, 'Запуск ВМ', vm.name);
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
  completeVMStart,
} = userVMsSlice.actions;

// Селекторы
export const selectActiveVMs = (state: { userVMs: UserVMsState }) => state.userVMs.activeVMs;
export const selectInactiveVMs = (state: { userVMs: UserVMsState }) => state.userVMs.inactiveVMs;
export const selectAllVMs = (state: { userVMs: UserVMsState }) => [...state.userVMs.activeVMs, ...state.userVMs.inactiveVMs];
export const selectActivities = (state: { userVMs: UserVMsState }) => state.userVMs.activities;
export const selectVMsLoading = (state: { userVMs: UserVMsState }) => state.userVMs.loading;
export const selectVMsError = (state: { userVMs: UserVMsState }) => state.userVMs.error;

export default userVMsSlice.reducer;
