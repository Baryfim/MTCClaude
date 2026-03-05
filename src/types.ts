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
  { id: 't3-micro', name: 'Стандартный Нано', cpu: 1, ram: 512, storage: 20, pricePerHour: 0.012, tier: 'Общего назначения' },
  { id: 't3-small', name: 'Стандартный Малый', cpu: 2, ram: 1024, storage: 40, pricePerHour: 0.024, tier: 'Общего назначения' },
  { id: 'm5-large', name: 'Стандартный Средний', cpu: 2, ram: 2048, storage: 80, pricePerHour: 0.096, tier: 'Общего назначения' },
  { id: 'c5-xlarge', name: 'Вычислительный Про', cpu: 4, ram: 4096, storage: 160, pricePerHour: 0.17, tier: 'Оптимизировано для вычислений' },
  { id: 'r5-2xlarge', name: 'Память Ультра', cpu: 8, ram: 65536, storage: 320, pricePerHour: 0.50, tier: 'Оптимизировано для памяти' },
];

export interface VMSnapshot {
  id: number;
  name: string;
  createdAt: string;
  size: string;
}

export interface DeployedVM {
  id: number;
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
  snapshots?: VMSnapshot[];
}

export interface Activity {
  id: number;
  action: string;
  vmName: string;
  timestamp: string;
  status: 'success' | 'error' | 'pending';
}

export type VMStatus = 'CREATING' | 'RUNNING' | 'STOPPED' | 'ERROR' | 'DELETING';

export interface UserVM {
  id: number;
  tenant_name: string;
  name: string;
  agent_resource_id: string;
  image: string;
  cpu_cores: number;
  ram_mb: number;
  storage?: number;
  disk_bytes?: string;
  price_per_hour?: number;
  status: VMStatus;
  created_at: string;
}

export interface VMMetrics {
  cpu_cores: number;
  ram_mb: number;
  status: VMStatus;
  storage: number;
}

export interface VMMetricsHistory {
  vmId: number;
  timestamp: string;
  metrics: VMMetrics;
}

export interface VMMetricsTimeSeries {
  time: string;
  cpu: number;
  ram: number;
  disk: number;
  network: number;
}

export interface VMResourceUpdate {
  id: number;
  name?: string;
  image?: string;
  cpu_cores?: number;
  ram_mb?: number;
  storage?: number;
  disk_bytes?: string;
  price_per_hour?: number;
}

export interface AdminVM extends UserVM {
  user_email?: string;
}
