export interface CloudPlatform {
  id: string;
  name: string;
  logo: string;
  color: string;
  description: string;
}

export interface VMInstance {
  id: string;
  name: string;
  cpu: number;
  ram: number;
  storage: number;
  pricePerHour: number;
  tier: 'Общего назначения' | 'Оптимизировано для вычислений' | 'Оптимизировано для памяти';
}

export const PLATFORMS: CloudPlatform[] = [
  {
    id: 'aws',
    name: 'Amazon Web Services',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg',
    color: '#FF9900',
    description: 'Самая полная и широко используемая облачная платформа в мире.'
  },
  {
    id: 'azure',
    name: 'Microsoft Azure',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Microsoft_Azure.svg',
    color: '#0089D6',
    description: 'Создавайте, запускайте и управляйте приложениями в нескольких облаках.'
  },
  {
    id: 'gcp',
    name: 'Google Cloud',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/5/51/Google_Cloud_logo.svg',
    color: '#4285F4',
    description: 'Ускорьте цифровую трансформацию с помощью интеллектуальных решений.'
  }
];

export const INSTANCE_TYPES: VMInstance[] = [
  { id: 't3-micro', name: 'Стандартный Нано', cpu: 1, ram: 1, storage: 20, pricePerHour: 0.012, tier: 'Общего назначения' },
  { id: 't3-small', name: 'Стандартный Малый', cpu: 2, ram: 2, storage: 40, pricePerHour: 0.024, tier: 'Общего назначения' },
  { id: 'm5-large', name: 'Стандартный Средний', cpu: 2, ram: 8, storage: 80, pricePerHour: 0.096, tier: 'Общего назначения' },
  { id: 'c5-xlarge', name: 'Вычислительный Про', cpu: 4, ram: 8, storage: 160, pricePerHour: 0.17, tier: 'Оптимизировано для вычислений' },
  { id: 'r5-2xlarge', name: 'Память Ультра', cpu: 8, ram: 64, storage: 320, pricePerHour: 0.50, tier: 'Оптимизировано для памяти' },
];

export interface DeployedVM {
  id: string;
  name: string;
  hostname: string;
  status: 'running' | 'stopped' | 'creating' | 'error';
  config: VMInstance;
  ipAddress: string;
  cpuUsage: number;
  ramUsage: number;
  diskUsage: number;
  uptime: string;
  network: string;
}

export interface Activity {
  id: string;
  action: string;
  vmName: string;
  timestamp: string;
  status: 'success' | 'error' | 'pending';
}
