import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  User,
  LogOut,
  Server,
  ChevronLeft
} from 'lucide-react';
import { VMInstance, UserVM, DeployedVM } from './types';
import { AdminConsole } from './blocks/AdminConsole/AdminConsole';
import { AdminDesktop } from './blocks/AdminDesktop/AdminDesktop';
import { Charts } from './blocks/Charts/Charts';
import { ResourceUsage } from './blocks/ResourceUsage/ResourceUsage';
import { UserVMs } from './blocks/UserVMs/UserVMs';
import { UserLogin } from './blocks/UserLogin/UserLogin';
import { VMPlanSelector } from './blocks/VMPlanSelector/VMPlanSelector';
import { UsageHistory } from './blocks/UsageHistory/UsageHistory';
import { ResourceWarning } from './blocks/ResourceWarning/ResourceWarning';
import { DemoBanner } from './blocks/DemoBanner/DemoBanner';
import styles from './App.module.scss';
import { useAppDispatch, useAppSelector } from './lib/hooks';
import { 
  createVM, 
  updateVM,
  deleteVMAsync,
  startVMAsync,
  stopVMAsync,
  restartVM,
  selectAllVMs,
  selectActivities,
  fetchUserVMs
} from './lib/slices/userVMsSlice';
import { selectVMMetrics } from './lib/slices/vmMetricsSlice';
import { apiRequestWithAuth, enableBackend } from './lib/api';
import { isMobile } from './lib/mockData';

export default function App() {
  const dispatch = useAppDispatch();
  const vmsFromRedux = useAppSelector(selectAllVMs);
  const vmMetrics = useAppSelector(selectVMMetrics);
  const activities = useAppSelector(selectActivities);
  
  // Обогащаем VM данными метрик из VMMetrics
  const deployedVMs = useMemo(() => {
    return vmsFromRedux.map(vm => {
      const metrics = vmMetrics[vm.id];
      
      // Если метрики есть, обновляем cpuUsage, ramUsage, diskUsage
      if (metrics) {
        return {
          ...vm,
          cpuUsage: metrics.cpu_percent ?? vm.cpuUsage,
          ramUsage: metrics.memory_limit_mb && metrics.memory_limit_mb > 0
            ? ((metrics.memory_used_mb ?? 0) / metrics.memory_limit_mb) * 100 
            : vm.ramUsage,
          diskUsage: metrics.disk_limit_bytes && metrics.disk_limit_bytes > 0
            ? (((metrics.disk_used_mb ?? 0) * 1024 * 1024) / metrics.disk_limit_bytes) * 100 
            : vm.diskUsage
        };
      }
      
      return vm;
    });
  }, [vmsFromRedux, vmMetrics]);
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('Guest');
  const [currentView, setCurrentView] = useState<'main' | 'dashboard'>('main');
  const [showConsole, setShowConsole] = useState<{ vmId: number; vmName: string } | null>(null);
  const [showDesktop, setShowDesktop] = useState<{ vmId: number; vmName: string } | null>(null);
  const [isConsoleFullscreen, setIsConsoleFullscreen] = useState(false);
  const [isDesktopFullscreen, setIsDesktopFullscreen] = useState(false);
  const [isConsoleMinimized, setIsConsoleMinimized] = useState(false);
  const [isDesktopMinimized, setIsDesktopMinimized] = useState(false);
  const [vmViewMode, setVmViewMode] = useState<'console' | 'desktop' | null>(null);
  const [currentVmId, setCurrentVmId] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginMode, setLoginMode] = useState<'login' | 'register'>('login');
  
  // Определяем демо-режим (без подключения к БД и на мобильных)
  const isDemoMode = !enableBackend && isMobile();
  
  // Resource warning state
  const [showResourceWarning, setShowResourceWarning] = useState(false);
  const [warningDetails, setWarningDetails] = useState<{
    vm: DeployedVM;
    resourceType: 'cpu' | 'ram' | 'disk';
    usage: number;
  } | null>(null);
  const [dismissedWarnings, setDismissedWarnings] = useState<Set<string>>(new Set());

  const accountLimits = {
    cpu: 8,
    ram: 16384, // МБ
    storage: 200,
    maxVMs: 3
  };

  const usedResources = useMemo(() => ({
    cpu: deployedVMs.reduce((sum, vm) => sum + vm.config.cpu, 0),
    ram: deployedVMs.reduce((sum, vm) => sum + vm.config.ram, 0),
    storage: deployedVMs.reduce((sum, vm) => sum + vm.config.storage, 0),
    vms: deployedVMs.length
  }), [deployedVMs]);

  // Отслеживание высокого потребления ресурсов
  useEffect(() => {
    const THRESHOLD = 80; // Порог предупреждения 80%
    
    for (const vm of deployedVMs) {
      // Проверяем CPU
      if (vm.cpuUsage > THRESHOLD) {
        const warningKey = `${vm.id}-cpu-${Math.floor(vm.cpuUsage / 10)}`;
        if (!dismissedWarnings.has(warningKey)) {
          setWarningDetails({
            vm,
            resourceType: 'cpu',
            usage: vm.cpuUsage
          });
          setShowResourceWarning(true);
          return;
        }
      }
      
      // Проверяем RAM
      if (vm.ramUsage > THRESHOLD) {
        const warningKey = `${vm.id}-ram-${Math.floor(vm.ramUsage / 10)}`;
        if (!dismissedWarnings.has(warningKey)) {
          setWarningDetails({
            vm,
            resourceType: 'ram',
            usage: vm.ramUsage
          });
          setShowResourceWarning(true);
          return;
        }
      }
      
      // Проверяем Disk
      if (vm.diskUsage > THRESHOLD) {
        const warningKey = `${vm.id}-disk-${Math.floor(vm.diskUsage / 10)}`;
        if (!dismissedWarnings.has(warningKey)) {
          setWarningDetails({
            vm,
            resourceType: 'disk',
            usage: vm.diskUsage
          });
          setShowResourceWarning(true);
          return;
        }
      }
    }
  }, [deployedVMs, dismissedWarnings]);

  useEffect(() => {
    if (isLoggedIn && vmsFromRedux.length === 0) {
      dispatch(fetchUserVMs());
    }
  }, [isLoggedIn, vmsFromRedux.length, dispatch]);

  const handleLogin = (username: string) => {
    setUserName(username);
    setIsLoggedIn(true);
    setCurrentView('main');
    setShowLoginModal(false);
  };

  const handleShowModal = (mode: 'login' | 'register') => {
    setLoginMode(mode);
    setShowLoginModal(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserName('Guest');
  };

  const handleVMAction = (vmId: number, action: 'start' | 'stop' | 'restart' | 'delete') => {
    switch (action) {
      case 'delete':
        dispatch(deleteVMAsync(vmId));
        break;
      case 'start':
        dispatch(startVMAsync(vmId));
        break;
      case 'stop':
        dispatch(stopVMAsync(vmId));
        break;
      case 'restart':
        dispatch(restartVM(vmId));
        break;
    }
  };

  const handleOpenConsole = (vmId: number) => {
    const vm = deployedVMs.find(v => v.id === vmId);
    if (vm) {
      setCurrentVmId(vmId);
      setShowConsole({ vmId, vmName: vm.name });
      setShowDesktop(null);
      setVmViewMode('console');
      setIsConsoleFullscreen(false);
      setIsConsoleMinimized(false);
    }
  };

  const handleOpenDesktop = (vmId: number) => {
    const vm = deployedVMs.find(v => v.id === vmId);
    if (vm) {
      setCurrentVmId(vmId);
      setShowDesktop({ vmId, vmName: vm.name });
      setShowConsole(null);
      setVmViewMode('desktop');
      setIsDesktopFullscreen(false);
      setIsDesktopMinimized(false);
    }
  };

  const switchViewMode = (mode: 'console' | 'desktop') => {
    const vm = deployedVMs.find(v => v.id === currentVmId);
    if (!vm) return;

    setVmViewMode(mode);
    setShowConsole(mode === 'console' ? { vmId: vm.id, vmName: vm.name } : null);
    setShowDesktop(mode === 'desktop' ? { vmId: vm.id, vmName: vm.name } : null);
  };

  const handleCreateVM = (selectedInstance: VMInstance, vmFromServer?: UserVM) => {
    const newVM: DeployedVM = {
      id: vmFromServer?.id || Date.now(),
      name: vmFromServer?.name || `Server-${deployedVMs.length + 1}`,
      hostname: `vm${deployedVMs.length + 1}.cloudscale.local`,
      status: 'stopped',
      config: selectedInstance,
      ipAddress: `10.0.1.${10 + deployedVMs.length}`,
      port: 5900 + deployedVMs.length,
      cpuUsage: 0,
      ramUsage: 0,
      diskUsage: 0,
      uptime: '0ч',
      network: 'default-network',
      snapshots: []
    };
    
    dispatch(createVM(newVM));
    setCurrentView('dashboard');
  };
  const handleCloseResourceWarning = () => {
    if (warningDetails) {
      const warningKey = `${warningDetails.vm.id}-${warningDetails.resourceType}-${Math.floor(warningDetails.usage / 10)}`;
      setDismissedWarnings(prev => new Set([...prev, warningKey]));
    }
    setShowResourceWarning(false);
    setWarningDetails(null);
  };

  const handleUpgradeVM = (newPlan: VMInstance) => {
    if (!warningDetails) return;
    
    const updatedVM: DeployedVM = {
      ...warningDetails.vm,
      config: newPlan,
      cpuUsage: (warningDetails.vm.cpuUsage / warningDetails.vm.config.cpu) * newPlan.cpu,
      ramUsage: (warningDetails.vm.ramUsage / warningDetails.vm.config.ram) * newPlan.ram,
      diskUsage: (warningDetails.vm.diskUsage / warningDetails.vm.config.storage) * newPlan.storage
    };
    
    dispatch(updateVM(updatedVM));
    handleCloseResourceWarning();
  };
  const handleCreateSnapshot = async (vmId: number) => {
    const vm = deployedVMs.find(v => v.id === vmId);
    if (!vm) return;

    try {
      await apiRequestWithAuth('POST', '/v1/snapshots/', { resource_id: vmId });
      
      const snapshotCount = (vm.snapshots?.length || 0) + 1;
      const now = new Date();
      const dateStr = now.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const newSnapshot = {
        id: Date.now(),
        name: `Снапшот ${snapshotCount}`,
        createdAt: dateStr,
        size: `${Math.floor(Math.random() * 15) + 5} ГБ`
      };

      const updatedVM = {
        ...vm,
        snapshots: [...(vm.snapshots || []), newSnapshot]
      };

      dispatch(updateVM(updatedVM));
    } catch (error) {
      console.error('Ошибка создания снапшота:', error);
    }
  };

  const handleRestoreSnapshot = (vmId: number, snapshotId: number) => {
    const vm = deployedVMs.find(v => v.id === vmId);
    const snapshot = vm?.snapshots?.find(s => s.id === snapshotId);
    
    if (vm && snapshot) {
      alert(`Восстановление ВМ "${vm.name}" из снапшота "${snapshot.name}"...\nВМ будет перезапущена.`);
      // Here you would typically dispatch an action to restore from snapshot
      dispatch(restartVM(vmId));
    }
  };

  const handleRenameSnapshot = (vmId: number, snapshotId: number, newName: string) => {
    const vm = deployedVMs.find(v => v.id === vmId);
    if (!vm) return;

    const updatedSnapshots = vm.snapshots?.map(snapshot =>
      snapshot.id === snapshotId ? { ...snapshot, name: newName } : snapshot
    );

    const updatedVM = {
      ...vm,
      snapshots: updatedSnapshots
    };

    dispatch(updateVM(updatedVM));
  };

  const handleDeleteSnapshot = async (vmId: number, snapshotId: number) => {
    const vm = deployedVMs.find(v => v.id === vmId);
    if (!vm) {
      console.error('VM не найдена:', vmId);
      return;
    }

    console.log('Удаление снапшота:', { vmId, snapshotId, currentSnapshots: vm.snapshots });

    try {
      await apiRequestWithAuth('DELETE', `/v1/snapshots/${snapshotId}/`);
      console.log('Снапшот удален на сервере:', snapshotId);
      
      const updatedSnapshots = vm.snapshots?.filter(snapshot => snapshot.id !== snapshotId) || [];
      console.log('Обновленный список снапшотов:', updatedSnapshots);

      const updatedVM = {
        ...vm,
        snapshots: updatedSnapshots
      };

      console.log('Обновление VM в store:', updatedVM);
      dispatch(updateVM(updatedVM));
      console.log('VM обновлена в store');
      
    } catch (error) {
      console.error('Ошибка удаления снапшота:', error);
      alert('Ошибка при удалении снапшота: ' + (error as any).message);
    }
  };

  return (
    <div className={`${styles.app} ${isDemoMode ? styles.withDemoBanner : ''}`}>
      {/* Demo Banner */}
      {isDemoMode && <DemoBanner />}
      
      {/* Top Auth Bar */}
      <div className={styles.topBar}>
        <div className={styles.authButtons}>
          <a href="/admin" className={styles.adminLink} title="Админ-панель">
            <ShieldCheck />
            <span>Админ</span>
          </a>
          
          {isLoggedIn ? (
            <div className={styles.userInfo}>
              <button 
                className={styles.userBadge}
                onClick={() => setCurrentView('dashboard')}
                title="Перейти в личный кабинет"
              >
                <User />
                <span>{userName}</span>
              </button>
              <button onClick={handleLogout} className={styles.logoutButton}>
                <LogOut />
                <span>Выйти</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => handleShowModal('login')} className={`${styles.authButton} ${styles.login}`}>
                Войти
              </button>
              <button onClick={() => handleShowModal('register')} className={`${styles.authButton} ${styles.register}`}>
                Регистрация
              </button>
            </div>
          )}
        </div>
      </div>

      {currentView === 'dashboard' ? (
        <main className={styles.dashboard}>
          <button onClick={() => setCurrentView('main')} className={styles.backButton}>
            <ChevronLeft />
            <span>Назад к выбору</span>
          </button>

          <div className={styles.dashboardHeader}>
            <h1>Панель управления</h1>
            <div className={styles.meta}>
              <div className={styles.metaItem}>
                <User />
                <span>{userName}</span>
              </div>
              <div className={styles.metaItem}>
                <Server />
                <span>План: Стандарт</span>
              </div>
            </div>
          </div>

          <ResourceUsage usedResources={usedResources} accountLimits={accountLimits} />
          <Charts vmId={deployedVMs.find(vm => vm.status === 'running')?.id} />
          <UserVMs 
            vms={deployedVMs}
            onVMAction={handleVMAction}
            onOpenConsole={handleOpenConsole}
            onOpenDesktop={handleOpenDesktop}
            onCreateVM={() => setCurrentView('main')}
            onCreateSnapshot={handleCreateSnapshot}
            onRestoreSnapshot={handleRestoreSnapshot}
            onRenameSnapshot={handleRenameSnapshot}
            onDeleteSnapshot={handleDeleteSnapshot}
            isDemoMode={isDemoMode}
          />
          <UsageHistory activities={activities} />
        </main>
      ) : (
        <main>
          <VMPlanSelector onSelect={handleCreateVM} />
        </main>
      )}

      {/* Console Modal */}
      <AnimatePresence>
        {showConsole && !isConsoleMinimized && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.vmModalOverlay}
          >
            <motion.div
              key="console"
              initial={{ x: vmViewMode === 'desktop' ? -100 : 0, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`${styles.vmModalContent} ${isConsoleFullscreen ? styles.fullscreen : ''}`}
            >
              <AdminConsole 
                vmId={showConsole.vmId} 
                vmName={showConsole.vmName}
                onToggleFullscreen={setIsConsoleFullscreen}
                onSwitchToDesktop={() => switchViewMode('desktop')}
                canSwitchToDesktop={!!currentVmId}
                isMinimized={isConsoleMinimized}
                onToggleMinimize={() => setIsConsoleMinimized(!isConsoleMinimized)}
                onClose={() => {
                  setShowConsole(null);
                  setShowDesktop(null);
                  setCurrentVmId(null);
                  setVmViewMode(null);
                  setIsConsoleFullscreen(false);
                  setIsConsoleMinimized(false);
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Console Minimized Tab */}
      <AnimatePresence>
        {showConsole && isConsoleMinimized && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            <AdminConsole 
              vmId={showConsole.vmId} 
              vmName={showConsole.vmName}
              onToggleFullscreen={setIsConsoleFullscreen}
              onSwitchToDesktop={() => switchViewMode('desktop')}
              canSwitchToDesktop={!!currentVmId}
              isMinimized={isConsoleMinimized}
              onToggleMinimize={() => setIsConsoleMinimized(!isConsoleMinimized)}
              onClose={() => {
                setShowConsole(null);
                setShowDesktop(null);
                setCurrentVmId(null);
                setVmViewMode(null);
                setIsConsoleFullscreen(false);
                setIsConsoleMinimized(false);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Modal */}
      <AnimatePresence>
        {showDesktop && !isDesktopMinimized && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.vmModalOverlay}
          >
            <motion.div
              key="desktop"
              initial={{ x: vmViewMode === 'console' ? 100 : 0, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`${styles.vmModalContent} ${isDesktopFullscreen ? styles.fullscreen : ''}`}
            >
              <AdminDesktop 
                vmId={showDesktop.vmId} 
                vmName={showDesktop.vmName}
                onToggleFullscreen={setIsDesktopFullscreen}
                onSwitchToConsole={() => switchViewMode('console')}
                canSwitchToConsole={!!currentVmId}
                isMinimized={isDesktopMinimized}
                onToggleMinimize={() => setIsDesktopMinimized(!isDesktopMinimized)}
                onClose={() => {
                  setShowDesktop(null);
                  setShowConsole(null);
                  setCurrentVmId(null);
                  setVmViewMode(null);
                  setIsDesktopFullscreen(false);
                  setIsDesktopMinimized(false);
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Minimized Tab */}
      <AnimatePresence>
        {showDesktop && isDesktopMinimized && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            <AdminDesktop 
              vmId={showDesktop.vmId} 
              vmName={showDesktop.vmName}
              onToggleFullscreen={setIsDesktopFullscreen}
              onSwitchToConsole={() => switchViewMode('console')}
              canSwitchToConsole={!!currentVmId}
              isMinimized={isDesktopMinimized}
              onToggleMinimize={() => setIsDesktopMinimized(!isDesktopMinimized)}
              onClose={() => {
                setShowDesktop(null);
                setShowConsole(null);
                setCurrentVmId(null);
                setVmViewMode(null);
                setIsDesktopFullscreen(false);
                setIsDesktopMinimized(false);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <UserLogin
            onLogin={handleLogin}
            onClose={() => setShowLoginModal(false)}
            mode={loginMode}
          />
        )}
      </AnimatePresence>

      {/* Resource Warning Modal */}
      <ResourceWarning
        isOpen={showResourceWarning}
        vmName={warningDetails?.vm.name || ''}
        currentPlan={warningDetails?.vm.config}
        resourceType={warningDetails?.resourceType as 'cpu' | 'ram' | 'disk'}
        currentUsage={warningDetails?.usage || 0}
        onUpgrade={handleUpgradeVM}
        onClose={handleCloseResourceWarning}
      />
    </div>
  );
}
