import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  User,
  LogOut,
  Server,
  ChevronLeft
} from 'lucide-react';
import { VMInstance, UserVM } from './types';
import { AdminConsole } from './blocks/AdminConsole/AdminConsole';
import { AdminDesktop } from './blocks/AdminDesktop/AdminDesktop';
import { Charts } from './blocks/Charts/Charts';
import { ResourceUsage } from './blocks/ResourceUsage/ResourceUsage';
import { UserVMs } from './blocks/UserVMs/UserVMs';
import { UserLogin } from './blocks/UserLogin/UserLogin';
import { VMPlanSelector } from './blocks/VMPlanSelector/VMPlanSelector';
import { UsageHistory } from './blocks/UsageHistory/UsageHistory';
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
  selectActivities
} from './lib/slices/userVMsSlice';
import { useVMMetricsPolling } from './lib/hooks/useVMMetricsPolling';

export default function App() {
  const dispatch = useAppDispatch();
  const deployedVMs = useAppSelector(selectAllVMs);
  const activities = useAppSelector(selectActivities);
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('Guest');
  const [currentView, setCurrentView] = useState<'main' | 'dashboard'>('main');
  const [showConsole, setShowConsole] = useState<{ vmId: number; vmName: string } | null>(null);
  const [showDesktop, setShowDesktop] = useState<{ vmId: number; vmName: string } | null>(null);
  const [isConsoleFullscreen, setIsConsoleFullscreen] = useState(false);
  const [isDesktopFullscreen, setIsDesktopFullscreen] = useState(false);
  const [vmViewMode, setVmViewMode] = useState<'console' | 'desktop' | null>(null);
  const [currentVmId, setCurrentVmId] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginMode, setLoginMode] = useState<'login' | 'register'>('login');

  // Включить опрос метрик когда пользователь залогинен и на странице дашборда
  useVMMetricsPolling(isLoggedIn && currentView === 'dashboard', 10000);

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
    const vmId = vmFromServer?.id || 0;
    
    const newVM = {
      id: vmId,
      name: vmFromServer?.name || `Server-${deployedVMs.length + 1}`,
      hostname: `vm${deployedVMs.length + 1}.cloudscale.local`,
      status: (vmFromServer?.status?.toLowerCase() as 'running' | 'stopped' | 'creating' | 'error') || 'creating',
      config: selectedInstance,
      ipAddress: `10.0.1.${10 + deployedVMs.length}`,
      cpuUsage: 0,
      ramUsage: 0,
      diskUsage: 0,
      uptime: '0h 0m',
      network: 'default-network',
      snapshots: []
    };
    
    dispatch(createVM(newVM));
    
    // Через 5 секунд меняем статус на 'running'
    setTimeout(() => {
      dispatch(updateVM({ ...newVM, status: 'running' }));
    }, 5000);
    
    setCurrentView('dashboard');
  };

  const handleCreateSnapshot = (vmId: number) => {
    const vm = deployedVMs.find(v => v.id === vmId);
    if (!vm) return;

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

    // Update VM with new snapshot
    const updatedVM = {
      ...vm,
      snapshots: [...(vm.snapshots || []), newSnapshot]
    };

    dispatch(updateVM(updatedVM));
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

  const handleDeleteSnapshot = (vmId: number, snapshotId: number) => {
    const vm = deployedVMs.find(v => v.id === vmId);
    if (!vm) return;

    const updatedSnapshots = vm.snapshots?.filter(snapshot => snapshot.id !== snapshotId);

    const updatedVM = {
      ...vm,
      snapshots: updatedSnapshots
    };

    dispatch(updateVM(updatedVM));
  };

  return (
    <div className={styles.app}>
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
        {showConsole && (
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
                onClose={() => {
                  setShowConsole(null);
                  setShowDesktop(null);
                  setCurrentVmId(null);
                  setVmViewMode(null);
                  setIsConsoleFullscreen(false);
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Modal */}
      <AnimatePresence>
        {showDesktop && (
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
                onClose={() => {
                  setShowDesktop(null);
                  setShowConsole(null);
                  setCurrentVmId(null);
                  setVmViewMode(null);
                  setIsDesktopFullscreen(false);
                }}
              />
            </motion.div>
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
    </div>
  );
}
