import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  ChevronRight, 
  Server, 
  Globe, 
  X,
  Zap,
  Mail,
  Lock,
  User,
  LogOut,
  Play,
  Square,
  RotateCw,
  Trash2,
  Network,
  Cpu,
  HardDrive,
  Activity,
  Clock,
  ChevronLeft
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { cn } from './lib/utils';
import { PLATFORMS, INSTANCE_TYPES, CloudPlatform, VMInstance, DeployedVM, Activity as ActivityType } from './types';

export default function App() {
  const [selectedInstance, setSelectedInstance] = useState<string>(INSTANCE_TYPES[0].id);
  const [isDeploying, setIsDeploying] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [currentView, setCurrentView] = useState<'main' | 'dashboard'>('main');
  const [deployedVMs, setDeployedVMs] = useState<DeployedVM[]>([]);
  const [activities, setActivities] = useState<ActivityType[]>([]);

  // Фейковые данные для графиков (последние 24 часа)
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

  const currentInstance = useMemo(() => 
    INSTANCE_TYPES.find(i => i.id === selectedInstance)!,
  [selectedInstance]);

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

  const handleDeploy = () => {
    setIsDeploying(true);
    setTimeout(() => {
      setIsDeploying(false);
      
      // Create new VM
      const newVM: DeployedVM = {
        id: `vm-${Date.now()}`,
        name: `Server-${deployedVMs.length + 1}`,
        hostname: `vm${deployedVMs.length + 1}.cloudscale.local`,
        status: 'running',
        config: currentInstance,
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
    }, 2000);
  };

  const handleAuth = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    
    // Симуляция входа/регистрации
    setUserName(name || email.split('@')[0]);
    setIsLoggedIn(true);
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserName('');
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
          
          return { ...vm, status: newStatus as any };
        }
        return vm;
      }));
    }
  };

  return (
    <div className="min-h-screen selection:bg-black selection:text-white">
      {/* Top Auth Bar */}
      <div className="fixed top-8 right-8 z-50">
        {isLoggedIn ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-lg">
              <User className="w-4 h-4" />
              <span className="font-medium text-sm">{userName}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="px-6 py-3 bg-white hover:bg-black hover:text-white rounded-full shadow-lg font-medium text-sm transition-all duration-300"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <button 
              onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
              className="px-6 py-3 bg-white hover:bg-black hover:text-white rounded-full shadow-lg font-medium text-sm transition-all duration-300"
            >
              Войти
            </button>
            <button 
              onClick={() => { setAuthMode('register'); setShowAuthModal(true); }}
              className="px-6 py-3 bg-black text-white hover:bg-white hover:text-black rounded-full shadow-lg font-medium text-sm transition-all duration-300"
            >
              Регистрация
            </button>
          </div>
        )}
      </div>

      {currentView === 'main' ? (
        <main className="max-w-3xl mx-auto px-8 pt-48 pb-32">
        {/* Instances */}
        <section className="mb-32">
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-black/20 mb-12 text-center">
            Конфигурация
          </div>
          <div className="space-y-4">
            {INSTANCE_TYPES.map(instance => (
              <div
                key={instance.id}
                onClick={() => setSelectedInstance(instance.id)}
                className={cn(
                  "selection-card group cursor-pointer flex items-center justify-between",
                  selectedInstance === instance.id ? "selection-card-active" : "hover:bg-black/[0.02]"
                )}
              >
                <div className="flex items-center gap-6">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                    selectedInstance === instance.id ? "bg-black text-white" : "bg-black/5"
                  )}>
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{instance.name}</h4>
                    <p className="text-xs font-medium text-black/30 uppercase tracking-widest mt-1">
                      {instance.cpu} Core • {instance.ram} GB RAM
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold tracking-tight">${instance.pricePerHour.toFixed(3)}</div>
                  <div className="text-[10px] font-bold text-black/20 uppercase tracking-widest mt-1">в час</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Action */}
        <section className="text-center">
          <div className="mb-12">
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-black/20 mb-4">
              Итого
            </div>
            <div className="text-4xl font-bold tracking-tight">
              ${(currentInstance.pricePerHour * 730).toFixed(2)} <span className="text-lg text-black/20 font-medium">/ месяц</span>
            </div>
          </div>
          
          <button 
            onClick={handleDeploy}
            disabled={isDeploying}
            className="minimal-btn inline-flex items-center gap-3"
          >
            {isDeploying ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>Развернуть <ChevronRight className="w-5 h-5" /></>
            )}
          </button>
          
          <div className="mt-12 flex justify-center gap-8 opacity-20">
            <ShieldCheck className="w-5 h-5" />
            <Globe className="w-5 h-5" />
            <Zap className="w-5 h-5" />
          </div>
        </section>
      </main>
      ) : (
        <main className="max-w-7xl mx-auto px-8 pt-32 pb-32">
          {/* Back Button */}
          <button 
            onClick={() => setCurrentView('main')}
            className="flex items-center gap-2 mb-8 text-black/40 hover:text-black transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">Назад к выбору</span>
          </button>

          {/* Account Info Header */}
          <div className="mb-16">
            <h1 className="text-5xl font-bold tracking-tight mb-4">
              Панель управления
            </h1>
            <div className="flex items-center gap-6 text-black/40">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{userName || 'Пользователь'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4" />
                <span>План: Стандарт</span>
              </div>
            </div>
          </div>

          {/* Resource Usage Summary */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-8">Использование ресурсов</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-3xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <Cpu className="w-6 h-6 text-black/40" />
                  <span className="font-bold text-black/40 text-sm uppercase tracking-widest">CPU</span>
                </div>
                <div className="text-3xl font-bold mb-2">{usedResources.cpu} / {accountLimits.cpu}</div>
                <div className="w-full bg-black/5 rounded-full h-2">
                  <div 
                    className="bg-black h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(usedResources.cpu / accountLimits.cpu) * 100}%` }}
                  />
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <Activity className="w-6 h-6 text-black/40" />
                  <span className="font-bold text-black/40 text-sm uppercase tracking-widest">RAM</span>
                </div>
                <div className="text-3xl font-bold mb-2">{usedResources.ram} / {accountLimits.ram} GB</div>
                <div className="w-full bg-black/5 rounded-full h-2">
                  <div 
                    className="bg-black h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(usedResources.ram / accountLimits.ram) * 100}%` }}
                  />
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <HardDrive className="w-6 h-6 text-black/40" />
                  <span className="font-bold text-black/40 text-sm uppercase tracking-widest">Диск</span>
                </div>
                <div className="text-3xl font-bold mb-2">{usedResources.storage} / {accountLimits.storage} GB</div>
                <div className="w-full bg-black/5 rounded-full h-2">
                  <div 
                    className="bg-black h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(usedResources.storage / accountLimits.storage) * 100}%` }}
                  />
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <Server className="w-6 h-6 text-black/40" />
                  <span className="font-bold text-black/40 text-sm uppercase tracking-widest">ВМ</span>
                </div>
                <div className="text-3xl font-bold mb-2">{usedResources.vms} / {accountLimits.maxVMs}</div>
                <div className="w-full bg-black/5 rounded-full h-2">
                  <div 
                    className="bg-black h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(usedResources.vms / accountLimits.maxVMs) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Resource Usage Charts */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-8">Мониторинг ресурсов за 24 часа</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* CPU & RAM Chart */}
              <div className="bg-white rounded-3xl p-8 shadow-lg">
                <h3 className="font-bold text-lg mb-6 flex items-center gap-3">
                  <Cpu className="w-5 h-5 text-black/40" />
                  CPU и RAM использование
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={resourceUsageData}>
                    <defs>
                      <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#000000" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#000000" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#666666" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#666666" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="time" 
                      stroke="#999" 
                      style={{ fontSize: '12px', fontWeight: '500' }}
                    />
                    <YAxis 
                      stroke="#999"
                      style={{ fontSize: '12px', fontWeight: '500' }}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        fontWeight: 'bold'
                      }}
                      formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
                    />
                    <Legend 
                      wrapperStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="cpu" 
                      stroke="#000000" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorCpu)"
                      name="CPU"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="ram" 
                      stroke="#666666" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorRam)"
                      name="RAM"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Disk & Network Chart */}
              <div className="bg-white rounded-3xl p-8 shadow-lg">
                <h3 className="font-bold text-lg mb-6 flex items-center gap-3">
                  <Activity className="w-5 h-5 text-black/40" />
                  Диск и сеть
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={resourceUsageData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="time" 
                      stroke="#999" 
                      style={{ fontSize: '12px', fontWeight: '500' }}
                    />
                    <YAxis 
                      stroke="#999"
                      style={{ fontSize: '12px', fontWeight: '500' }}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        fontWeight: 'bold'
                      }}
                      formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
                    />
                    <Legend 
                      wrapperStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="disk" 
                      stroke="#000000" 
                      strokeWidth={3}
                      dot={{ fill: '#000000', r: 4 }}
                      name="Диск"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="network" 
                      stroke="#666666" 
                      strokeWidth={3}
                      dot={{ fill: '#666666', r: 4 }}
                      name="Сеть"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* Virtual Machines List */}
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Виртуальные машины</h2>
              <button 
                onClick={() => setCurrentView('main')}
                className="px-6 py-3 bg-black text-white rounded-full font-medium text-sm hover:scale-105 transition-transform"
              >
                + Создать ВМ
              </button>
            </div>

            {deployedVMs.length === 0 ? (
              <div className="text-center py-20 text-black/40">
                <Server className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg">Нет развернутых виртуальных машин</p>
              </div>
            ) : (
              <div className="space-y-4">
                {deployedVMs.map(vm => (
                  <div key={vm.id} className="bg-white rounded-3xl p-8 shadow-lg">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h3 className="text-2xl font-bold mb-2">{vm.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-black/40">
                          <span>{vm.hostname}</span>
                          <span>•</span>
                          <span>{vm.ipAddress}</span>
                          <span>•</span>
                          <span className={cn(
                            "px-3 py-1 rounded-full font-bold text-xs uppercase",
                            vm.status === 'running' ? "bg-green-500/10 text-green-700" : 
                            vm.status === 'stopped' ? "bg-red-500/10 text-red-700" : 
                            "bg-yellow-500/10 text-yellow-700"
                          )}>
                            {vm.status === 'running' ? 'Работает' : 
                             vm.status === 'stopped' ? 'Остановлена' : 'Создается'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleVMAction(vm.id, 'start')}
                          disabled={vm.status === 'running'}
                          className="p-3 bg-black/5 hover:bg-black hover:text-white rounded-xl transition-all disabled:opacity-30"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleVMAction(vm.id, 'stop')}
                          disabled={vm.status === 'stopped'}
                          className="p-3 bg-black/5 hover:bg-black hover:text-white rounded-xl transition-all disabled:opacity-30"
                        >
                          <Square className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleVMAction(vm.id, 'restart')}
                          className="p-3 bg-black/5 hover:bg-black hover:text-white rounded-xl transition-all"
                        >
                          <RotateCw className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleVMAction(vm.id, 'delete')}
                          className="p-3 bg-red-500/10 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                      <div>
                        <div className="text-xs font-bold text-black/40 uppercase tracking-widest mb-2">Конфигурация</div>
                        <div className="font-bold">{vm.config.cpu} Core • {vm.config.ram} GB RAM • {vm.config.storage} GB</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-black/40 uppercase tracking-widest mb-2">CPU Usage</div>
                        <div className="font-bold">{vm.cpuUsage}%</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-black/40 uppercase tracking-widest mb-2">RAM Usage</div>
                        <div className="font-bold">{vm.ramUsage}%</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-black/40 uppercase tracking-widest mb-2">Disk Usage</div>
                        <div className="font-bold">{vm.diskUsage}%</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-black/40">
                      <div className="flex items-center gap-2">
                        <Network className="w-4 h-4" />
                        <span>Сеть: {vm.network}</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>Uptime: {vm.uptime}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Network Section */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-8">Сеть и изоляция</h2>
            <div className="bg-white rounded-3xl p-8 shadow-lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center">
                  <Network className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">default-network</h3>
                  <p className="text-sm text-black/40">Виртуальная частная сеть</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-xs font-bold text-black/40 uppercase tracking-widest mb-2">Диапазон адресов</div>
                  <div className="font-bold">10.0.1.0/24</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-black/40 uppercase tracking-widest mb-2">Подключено ВМ</div>
                  <div className="font-bold">{deployedVMs.length}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-black/40 uppercase tracking-widest mb-2">Изоляция</div>
                  <div className="font-bold text-green-600">Активна</div>
                </div>
              </div>
              <p className="mt-6 text-sm text-black/40">
                🔒 Все виртуальные машины изолированы от других клиентов. Доступ имеете только вы.
              </p>
            </div>
          </section>

          {/* Activity Log */}
          <section>
            <h2 className="text-2xl font-bold mb-8">История операций</h2>
            <div className="bg-white rounded-3xl p-8 shadow-lg">
              {activities.length === 0 ? (
                <div className="text-center py-12 text-black/40">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>Нет записей об операциях</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.slice(0, 10).map(activity => (
                    <div key={activity.id} className="flex items-center justify-between py-3 border-b border-black/5 last:border-0">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          activity.status === 'success' ? "bg-green-500" :
                          activity.status === 'error' ? "bg-red-500" : "bg-yellow-500"
                        )} />
                        <div>
                          <div className="font-bold">{activity.action}</div>
                          <div className="text-sm text-black/40">{activity.vmName}</div>
                        </div>
                      </div>
                      <div className="text-sm text-black/40">{activity.timestamp}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>
      )}

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAuthModal(false)}
              className="absolute inset-0 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-md w-full"
            >
              <button
                onClick={() => setShowAuthModal(false)}
                className="absolute -top-4 -right-4 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="bg-white rounded-3xl shadow-2xl p-10">
                <h2 className="text-3xl font-bold mb-2 tracking-tight">
                  {authMode === 'login' ? 'Вход' : 'Регистрация'}
                </h2>
                <p className="text-black/40 mb-8">
                  {authMode === 'login' 
                    ? 'Войдите в свой аккаунт' 
                    : 'Создайте новый аккаунт'}
                </p>

                <form onSubmit={handleAuth} className="space-y-6">
                  {authMode === 'register' && (
                    <div>
                      <label className="block text-sm font-bold text-black/40 uppercase tracking-widest mb-3">
                        Имя
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/20" />
                        <input
                          type="text"
                          name="name"
                          required
                          className="w-full pl-12 pr-4 py-4 bg-black/5 rounded-2xl font-medium focus:bg-black/10 transition-all duration-300 outline-none"
                          placeholder="Ваше имя"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-bold text-black/40 uppercase tracking-widest mb-3">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/20" />
                      <input
                        type="email"
                        name="email"
                        required
                        className="w-full pl-12 pr-4 py-4 bg-black/5 rounded-2xl font-medium focus:bg-black/10 transition-all duration-300 outline-none"
                        placeholder="example@mail.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-black/40 uppercase tracking-widest mb-3">
                      Пароль
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/20" />
                      <input
                        type="password"
                        name="password"
                        required
                        className="w-full pl-12 pr-4 py-4 bg-black/5 rounded-2xl font-medium focus:bg-black/10 transition-all duration-300 outline-none"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="minimal-btn w-full"
                  >
                    {authMode === 'login' ? 'Войти' : 'Зарегистрироваться'}
                  </button>
                </form>

                <div className="mt-8 text-center">
                  <button
                    onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                    className="text-sm text-black/40 hover:text-black transition-colors"
                  >
                    {authMode === 'login' 
                      ? 'Нет аккаунта? Зарегистрируйтесь' 
                      : 'Уже есть аккаунт? Войдите'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
