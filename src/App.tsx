import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  User,
  LogOut,
  Server,
  ChevronLeft
} from 'lucide-react';
import { DeployedVM, Activity as ActivityType, INSTANCE_TYPES, VMInstance } from './types';
import { AdminConsole } from './blocks/AdminConsole/AdminConsole';
import { AdminDesktop } from './blocks/AdminDesktop/AdminDesktop';
import { Charts } from './blocks/Charts/Charts';
import { ResourceUsage } from './blocks/ResourceUsage/ResourceUsage';
import { UserVMs } from './blocks/UserVMs/UserVMs';
import { UserLogin } from './blocks/UserLogin/UserLogin';
import { VMPlanSelector } from './blocks/VMPlanSelector/VMPlanSelector';
import { UsageHistory } from './blocks/UsageHistory/UsageHistory';
import styles from './App.module.scss';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('Guest');
  const [currentView, setCurrentView] = useState<'main' | 'dashboard'>('main');
  const [deployedVMs, setDeployedVMs] = useState<DeployedVM[]>([]);
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [showConsole, setShowConsole] = useState<{ vmId: string; vmName: string } | null>(null);
  const [showDesktop, setShowDesktop] = useState<{ vmId: string; vmName: string } | null>(null);
  const [isConsoleFullscreen, setIsConsoleFullscreen] = useState(false);
  const [isDesktopFullscreen, setIsDesktopFullscreen] = useState(false);
  const [vmViewMode, setVmViewMode] = useState<'console' | 'desktop' | null>(null);
  const [currentVmId, setCurrentVmId] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginMode, setLoginMode] = useState<'login' | 'register'>('login');

  const resourceUsageData = useMemo(() => {
    const data = [];
    for (let i = 23; i >= 0; i--) {
      const hour = new Date();
      hour.setHours(hour.getHours() - i);
      data.push({
        time: `${hour.getHours()}:00`,
        cpu: Math.floor(Math.random() * 40) + 30 + Math.sin(i / 3) * 15,
        ram: Math.floor(Math.random() * 35) + 40 + Math.cos(i / 4) * 20,
        disk: Math.floor(Math.random() * 20) + 25,
        network: Math.floor(Math.random() * 50) + 20
      });
    }
    return data;
  }, []);

  const accountLimits = {
    cpu: 8,
    ram: 16,
    storage: 200,
    maxVMs: 3
  };

  const usedResources = useMemo(() => ({
    cpu: deployedVMs.reduce((sum, vm) => sum + vm.config.cpu, 0),
    ram: deployedVMs.reduce((sum, vm) => sum + vm.config.ram, 0),
    storage: deployedVMs.reduce((sum, vm) => sum + vm.config.storage, 0),
    vms: deployedVMs.length
  }), [deployedVMs]);

  const handleLogin = (username: string, password: string) => {
    setUserName(username);
    setIsLoggedIn(true);
    setShowLoginModal(false);
  };

  const handleShowLogin = () => {
    setLoginMode('login');
    setShowLoginModal(true);
  };

  const handleShowRegister = () => {
    setLoginMode('register');
    setShowLoginModal(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserName('Guest');
  };

  const handleVMAction = (vmId: string, action: 'start' | 'stop' | 'restart' | 'delete') => {
    if (action === 'delete') {
      const vm = deployedVMs.find(v => v.id === vmId);
      setDeployedVMs(deployedVMs.filter(v => v.id !== vmId));
      if (vm) {
        const newActivity: ActivityType = {
          id: `act-${Date.now()}`,
          action: 'Удалена ВМ',
          vmName: vm.name,
          timestamp: new Date().toLocaleString('ru-RU'),
          status: 'success'
        };
        setActivities([newActivity, ...activities]);
      }
    } else {
      setDeployedVMs(deployedVMs.map(vm => {
        if (vm.id === vmId) {
          const newStatus = action === 'start' ? 'running' : action === 'stop' ? 'stopped' : vm.status;
          const actionText = action === 'start' ? 'Запущена ВМ' : action === 'stop' ? 'Остановлена ВМ' : 'Перезапущена ВМ';
          
          const newActivity: ActivityType = {
            id: `act-${Date.now()}`,
            action: actionText,
            vmName: vm.name,
            timestamp: new Date().toLocaleString('ru-RU'),
            status: 'success'
          };
          setActivities([newActivity, ...activities]);
          
          return { ...vm, status: newStatus as 'running' | 'stopped' };
        }
        return vm;
      }));
    }
  };

  const handleOpenConsole = (vmId: string) => {
    const vm = deployedVMs.find(v => v.id === vmId);
    if (vm && vm.status === 'running') {
      setCurrentVmId(vmId);
      setShowConsole({ vmId: vm.id, vmName: vm.name });
      setShowDesktop(null);
      setVmViewMode('console');
      setIsConsoleFullscreen(false);
    }
  };

  const handleOpenDesktop = (vmId: string) => {
    const vm = deployedVMs.find(v => v.id === vmId);
    if (vm && vm.status === 'running') {
      setCurrentVmId(vmId);
      setShowDesktop({ vmId: vm.id, vmName: vm.name });
      setShowConsole(null);
      setVmViewMode('desktop');
      setIsDesktopFullscreen(false);
    }
  };

  const switchViewMode = (mode: 'console' | 'desktop') => {
    if (!currentVmId) return;
    const vm = deployedVMs.find(v => v.id === currentVmId);
    if (!vm) return;

    setVmViewMode(mode);
    if (mode === 'console') {
      setShowConsole({ vmId: vm.id, vmName: vm.name });
      setShowDesktop(null);
    } else {
      setShowDesktop({ vmId: vm.id, vmName: vm.name });
      setShowConsole(null);
    }
  };

  const handleCreateVM = (selectedInstance: VMInstance) => {
    const newVM: DeployedVM = {
      id: `vm-${Date.now()}`,
      name: `Server-${deployedVMs.length + 1}`,
      hostname: `vm${deployedVMs.length + 1}.cloudscale.local`,
      status: 'running',
      config: selectedInstance,
      ipAddress: `10.0.1.${10 + deployedVMs.length}`,
      cpuUsage: Math.floor(Math.random() * 60) + 20,
      ramUsage: Math.floor(Math.random() * 60) + 20,
      diskUsage: Math.floor(Math.random() * 40) + 10,
      uptime: '0h 0m',
      network: 'default-network'
    };
    
    setDeployedVMs([...deployedVMs, newVM]);
    
    const newActivity: ActivityType = {
      id: `act-${Date.now()}`,
      action: 'Создана ВМ',
      vmName: newVM.name,
      timestamp: new Date().toLocaleString('ru-RU'),
      status: 'success'
    };
    
    setActivities([newActivity, ...activities]);
    setCurrentView('dashboard');
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
              <div className={styles.userBadge}>
                <User />
                <span>{userName}</span>
              </div>
              <button onClick={handleLogout} className={styles.logoutButton}>
                <LogOut />
                <span>Выйти</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={handleShowLogin} className={`${styles.authButton} ${styles.login}`}>
                Войти
              </button>
              <button onClick={handleShowRegister} className={`${styles.authButton} ${styles.register}`}>
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
                <span>{userName || 'Пользователь'}</span>
              </div>
              <div className={styles.metaItem}>
                <Server />
                <span>План: Стандарт</span>
              </div>
            </div>
          </div>

          <ResourceUsage usedResources={usedResources} accountLimits={accountLimits} />
          <Charts data={resourceUsageData} />
          <UserVMs 
            vms={deployedVMs}
            onVMAction={handleVMAction}
            onOpenConsole={handleOpenConsole}
            onOpenDesktop={handleOpenDesktop}
            onCreateVM={() => setCurrentView('main')}
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
