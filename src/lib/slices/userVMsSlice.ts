import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { DeployedVM, Activity } from '../../types';
import axios from 'axios';

const apiUrl = import.meta.env.DB_HOST || 'http://localhost:8000';

// Асинхронные thunks
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
    await axios.post(`${apiUrl}/v1/resources/${vmId}/delete`);
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
    // Создание новой VM
    createVM: (state, action: PayloadAction<DeployedVM>) => {
      state.activeVMs.push(action.payload);
      const newActivity: Activity = {
        id: `act-${Date.now()}`,
        action: 'Создана ВМ',
        vmName: action.payload.name,
        timestamp: new Date().toLocaleString('ru-RU'),
        status: 'success'
      };
      state.activities.unshift(newActivity);
    },
    
    // Удаление VM
    deleteVM: (state, action: PayloadAction<string>) => {
      const vmId = action.payload;
      let deletedVM = state.activeVMs.find(vm => vm.id === vmId);
      if (deletedVM) {
        state.activeVMs = state.activeVMs.filter(vm => vm.id !== vmId);
      } else {
        deletedVM = state.inactiveVMs.find(vm => vm.id === vmId);
        if (deletedVM) {
          state.inactiveVMs = state.inactiveVMs.filter(vm => vm.id !== vmId);
        }
      }
      
      if (deletedVM) {
        const newActivity: Activity = {
          id: `act-${Date.now()}`,
          action: 'Удалена ВМ',
          vmName: deletedVM.name,
          timestamp: new Date().toLocaleString('ru-RU'),
          status: 'success'
        };
        state.activities.unshift(newActivity);
      }
    },
    
    // Запуск VM (перемещение из неактивных в активные)
    startVM: (state, action: PayloadAction<string>) => {
      const vmId = action.payload;
      const vmIndex = state.inactiveVMs.findIndex(vm => vm.id === vmId);
      
      if (vmIndex !== -1) {
        const vm = state.inactiveVMs[vmIndex];
        vm.status = 'running';
        state.activeVMs.push(vm);
        state.inactiveVMs.splice(vmIndex, 1);
        
        const newActivity: Activity = {
          id: `act-${Date.now()}`,
          action: 'Запущена ВМ',
          vmName: vm.name,
          timestamp: new Date().toLocaleString('ru-RU'),
          status: 'success'
        };
        state.activities.unshift(newActivity);
      }
    },
    
    // Остановка VM (перемещение из активных в неактивные)
    stopVM: (state, action: PayloadAction<string>) => {
      const vmId = action.payload;
      const vmIndex = state.activeVMs.findIndex(vm => vm.id === vmId);
      
      if (vmIndex !== -1) {
        const vm = state.activeVMs[vmIndex];
        vm.status = 'stopped';
        state.inactiveVMs.push(vm);
        state.activeVMs.splice(vmIndex, 1);
        
        const newActivity: Activity = {
          id: `act-${Date.now()}`,
          action: 'Остановлена ВМ',
          vmName: vm.name,
          timestamp: new Date().toLocaleString('ru-RU'),
          status: 'success'
        };
        state.activities.unshift(newActivity);
      }
    },
    
    // Перезапуск VM
    restartVM: (state, action: PayloadAction<string>) => {
      const vmId = action.payload;
      const vm = state.activeVMs.find(vm => vm.id === vmId);
      
      if (vm) {
        const newActivity: Activity = {
          id: `act-${Date.now()}`,
          action: 'Перезапущена ВМ',
          vmName: vm.name,
          timestamp: new Date().toLocaleString('ru-RU'),
          status: 'success'
        };
        state.activities.unshift(newActivity);
      }
    },
    
    // Обновление данных VM
    updateVM: (state, action: PayloadAction<DeployedVM>) => {
      const updatedVM = action.payload;
      let vmIndex = state.activeVMs.findIndex(vm => vm.id === updatedVM.id);
      
      if (vmIndex !== -1) {
        state.activeVMs[vmIndex] = updatedVM;
      } else {
        vmIndex = state.inactiveVMs.findIndex(vm => vm.id === updatedVM.id);
        if (vmIndex !== -1) {
          state.inactiveVMs[vmIndex] = updatedVM;
        }
      }
    },
    
    // Установка всех VM
    setAllVMs: (state, action: PayloadAction<{ active: DeployedVM[], inactive: DeployedVM[] }>) => {
      state.activeVMs = action.payload.active;
      state.inactiveVMs = action.payload.inactive;
    },
    
    // Добавление активности
    addActivity: (state, action: PayloadAction<Activity>) => {
      state.activities.unshift(action.payload);
    },
    
    // Очистка активностей
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
        const vmId = action.payload;
        const vmIndex = state.inactiveVMs.findIndex(vm => vm.id === vmId);
        
        if (vmIndex !== -1) {
          const vm = state.inactiveVMs[vmIndex];
          vm.status = 'running';
          state.activeVMs.push(vm);
          state.inactiveVMs.splice(vmIndex, 1);
          
          state.activities.unshift({
            id: `act-${Date.now()}`,
            action: 'Запущена ВМ',
            vmName: vm.name,
            timestamp: new Date().toLocaleString('ru-RU'),
            status: 'success'
          });
        }
      })
      .addCase(stopVMAsync.fulfilled, (state, action) => {
        const vmId = action.payload;
        const vmIndex = state.activeVMs.findIndex(vm => vm.id === vmId);
        
        if (vmIndex !== -1) {
          const vm = state.activeVMs[vmIndex];
          vm.status = 'stopped';
          state.inactiveVMs.push(vm);
          state.activeVMs.splice(vmIndex, 1);
          
          state.activities.unshift({
            id: `act-${Date.now()}`,
            action: 'Остановлена ВМ',
            vmName: vm.name,
            timestamp: new Date().toLocaleString('ru-RU'),
            status: 'success'
          });
        }
      })
      .addCase(deleteVMAsync.fulfilled, (state, action) => {
        const vmId = action.payload;
        let deletedVM = state.activeVMs.find(vm => vm.id === vmId);
        
        if (deletedVM) {
          state.activeVMs = state.activeVMs.filter(vm => vm.id !== vmId);
        } else {
          deletedVM = state.inactiveVMs.find(vm => vm.id === vmId);
          if (deletedVM) {
            state.inactiveVMs = state.inactiveVMs.filter(vm => vm.id !== vmId);
          }
        }
        
        if (deletedVM) {
          state.activities.unshift({
            id: `act-${Date.now()}`,
            action: 'Удалена ВМ',
            vmName: deletedVM.name,
            timestamp: new Date().toLocaleString('ru-RU'),
            status: 'success'
          });
        }
      });
  },
});

export const {
  createVM,
  deleteVM,
  startVM,
  stopVM,
  restartVM,
  updateVM,
  setAllVMs,
  addActivity,
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
