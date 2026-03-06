// Mock data generator для демо-режима без БД
import { DeployedVM, VMSnapshot } from '../blocks/UserVMs/UserVMs';
import { AdminVM } from '../types';

export const isMobile = () => window.innerWidth <= 768;

// Генерация случайного числа в диапазоне
const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Генерация случайного числа с плавающей точкой
const randomFloat = (min: number, max: number, decimals: number = 1) => 
  parseFloat((Math.random() * (max - min) + min).toFixed(decimals));

// Генерация случайного элемента из массива
const randomItem = <T,>(arr: T[]): T => arr[random(0, arr.length - 1)];

// Конфигурации VM
const vmConfigs = [
  { id: 'small', name: 'Small', cpu: 2, ram: 2048, storage: 20, pricePerHour: 0.05 },
  { id: 'medium', name: 'Medium', cpu: 4, ram: 4096, storage: 40, pricePerHour: 0.15 },
  { id: 'large', name: 'Large', cpu: 8, ram: 8192, storage: 80, pricePerHour: 0.30 },
];

// Генерация снапшотов
export const generateMockSnapshots = (count: number = 2): VMSnapshot[] => {
  const snapshots: VMSnapshot[] = [];
  for (let i = 0; i < count; i++) {
    const date = new Date(Date.now() - i * 86400000 * random(1, 7));
    snapshots.push({
      id: `snap-${Date.now()}-${i}`,
      name: `Снапшот ${i + 1}`,
      createdAt: date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      size: `${random(5, 20)} ГБ`
    });
  }
  return snapshots;
};

// Генерация VM
export const generateMockVM = (id: number, index: number): DeployedVM => {
  const config = randomItem(vmConfigs);
  const isRunning = Math.random() > 0.3;
  
  return {
    id: `mock-vm-${id}`,
    name: `Server-${index + 1}`,
    hostname: `vm${index + 1}.demo.local`,
    status: isRunning ? 'running' : 'stopped',
    config,
    ipAddress: `10.0.1.${10 + index}`,
    cpuUsage: isRunning ? randomFloat(10, 85, 1) : 0,
    ramUsage: isRunning ? randomFloat(20, 80, 1) : 0,
    diskUsage: randomFloat(15, 75, 1),
    uptime: isRunning ? `${random(1, 72)}ч ${random(0, 59)}м` : '0ч',
    network: 'default-network',
    snapshots: generateMockSnapshots(random(1, 3))
  };
};

// Генерация нескольких VM
export const generateMockVMs = (count: number = 3): DeployedVM[] => {
  return Array.from({ length: count }, (_, i) => generateMockVM(Date.now() + i, i));
};

// Генерация AdminVM
export const generateMockAdminVM = (id: number, index: number): AdminVM => {
  const config = randomItem(vmConfigs);
  const isRunning = Math.random() > 0.4;
  const users = ['user1', 'user2', 'user3', 'demo', 'testuser'];
  const tenantName = randomItem(users);
  
  return {
    id,
    tenant_name: tenantName,
    name: `VM-${index + 1}`,
    agent_resource_id: `agent-${id}`,
    image: randomItem(['dorowu:lxde', 'ubuntu:22.04', 'debian:12']),
    cpu_cores: config.cpu,
    ram_mb: config.ram,
    storage: config.storage,
    status: isRunning ? 'RUNNING' : 'STOPPED',
    price_per_hour: config.pricePerHour,
    disk_bytes: `${config.storage * 1073741824}`,
    created_at: new Date(Date.now() - random(1, 30) * 86400000).toISOString(),
    user_email: `${tenantName}@demo.local`
  };
};

// Генерация нескольких AdminVM
export const generateMockAdminVMs = (count: number = 5): AdminVM[] => {
  return Array.from({ length: count }, (_, i) => generateMockAdminVM(i + 1, i));
};

// Генерация данных активности
export interface Activity {
  id: string;
  timestamp: string;
  action: string;
  details: string;
}

export const generateMockActivities = (count: number = 10): Activity[] => {
  const actions = [
    { action: 'Создание VM', details: 'Создана виртуальная машина' },
    { action: 'Запуск VM', details: 'Виртуальная машина запущена' },
    { action: 'Остановка VM', details: 'Виртуальная машина остановлена' },
    { action: 'Создание снапшота', details: 'Создан снапшот виртуальной машины' },
    { action: 'Обновление конфигурации', details: 'Конфигурация VM изменена' },
  ];
  
  const activities: Activity[] = [];
  for (let i = 0; i < count; i++) {
    const date = new Date(Date.now() - i * random(60000, 3600000));
    const { action, details } = randomItem(actions);
    activities.push({
      id: `activity-${Date.now()}-${i}`,
      timestamp: date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
      action,
      details: `${details} Server-${random(1, 3)}`
    });
  }
  return activities;
};

// Генерация метрик для графиков
export interface MetricPoint {
  timestamp: string;
  value: number;
}

export const generateMockChartData = (points: number = 20): MetricPoint[] => {
  const data: MetricPoint[] = [];
  const now = Date.now();
  for (let i = points - 1; i >= 0; i--) {
    const timestamp = new Date(now - i * 3000);
    data.push({
      timestamp: timestamp.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      }),
      value: randomFloat(0, 100, 1)
    });
  }
  return data;
};

// Обновление метрик (для живого обновления)
export const updateMockMetrics = (existingData: MetricPoint[]): MetricPoint[] => {
  const newData = [...existingData.slice(1)];
  const now = new Date();
  newData.push({
    timestamp: now.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    }),
    value: randomFloat(0, 100, 1)
  });
  return newData;
};

// Генерация данных для круговой диаграммы (для админ панели)
export interface PieChartData {
  name: string;
  value: number;
  color: string;
}

export const generateMockPieChartData = (): PieChartData[] => {
  return [
    { name: 'CPU', value: randomFloat(20, 80, 1), color: '#ef4444' },
    { name: 'RAM', value: randomFloat(20, 80, 1), color: '#f97316' },
    { name: 'Disk', value: randomFloat(20, 80, 1), color: '#eab308' },
    { name: 'Network', value: randomFloat(10, 50, 1), color: '#22c55e' },
  ];
};
