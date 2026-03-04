import React from 'react';
import { Server, Play, Square, RotateCw, Trash2, Network, Clock, Terminal, Monitor } from 'lucide-react';
import styles from './UserVMs.module.scss';

export interface DeployedVM {
  id: string;
  name: string;
  hostname: string;
  status: 'running' | 'stopped' | 'creating';
  config: {
    id: string;
    name: string;
    cpu: number;
    ram: number;
    storage: number;
    pricePerHour: number;
  };
  ipAddress: string;
  cpuUsage: number;
  ramUsage: number;
  diskUsage: number;
  uptime: string;
  network: string;
}

interface UserVMsProps {
  vms: DeployedVM[];
  onVMAction: (vmId: string, action: 'start' | 'stop' | 'restart' | 'delete') => void;
  onOpenConsole: (vmId: string) => void;
  onOpenDesktop: (vmId: string) => void;
  onCreateVM: () => void;
}

export const UserVMs: React.FC<UserVMsProps> = ({ 
  vms, 
  onVMAction,
  onOpenConsole,
  onOpenDesktop,
  onCreateVM 
}) => {
  return (
    <section className={styles.container}>
      <div className={styles.header}>
        <h2>Виртуальные машины</h2>
        <button onClick={onCreateVM} className={styles.createButton}>
          + Создать ВМ
        </button>
      </div>

      {vms.length === 0 ? (
        <div className={styles.emptyState}>
          <Server />
          <p>Нет развернутых виртуальных машин</p>
        </div>
      ) : (
        <div className={styles.vmList}>
          {vms.map(vm => (
            <div key={vm.id} className={styles.vmCard}>
              <div className={styles.vmHeader}>
                <div className={styles.vmInfo}>
                  <h3>{vm.name}</h3>
                  <div className={styles.vmMeta}>
                    <span>{vm.hostname}</span>
                    <span>{vm.ipAddress}</span>
                    <span className={`${styles.statusBadge} ${styles[vm.status]}`}>
                      {vm.status === 'running' ? 'Работает' : 
                       vm.status === 'stopped' ? 'Остановлена' : 'Создается'}
                    </span>
                  </div>
                </div>
                <div className={styles.actionButtons}>
                  <button 
                    onClick={() => onVMAction(vm.id, 'start')}
                    disabled={vm.status === 'running'}
                    className={styles.actionButton}
                    title="Start"
                  >
                    <Play />
                  </button>
                  <button 
                    onClick={() => onVMAction(vm.id, 'stop')}
                    disabled={vm.status === 'stopped'}
                    className={styles.actionButton}
                    title="Stop"
                  >
                    <Square />
                  </button>
                  <button 
                    onClick={() => onVMAction(vm.id, 'restart')}
                    className={styles.actionButton}
                    title="Restart"
                  >
                    <RotateCw />
                  </button>
                  <button 
                    onClick={() => onVMAction(vm.id, 'delete')}
                    className={`${styles.actionButton} ${styles.delete}`}
                    title="Delete"
                  >
                    <Trash2 />
                  </button>
                </div>
              </div>

              <div className={styles.vmStats}>
                <div className={styles.vmStat}>
                  <div className={styles.label}>Конфигурация</div>
                  <div className={styles.value}>{vm.config.cpu} Core • {vm.config.ram} GB RAM • {vm.config.storage} GB</div>
                </div>
                <div className={styles.vmStat}>
                  <div className={styles.label}>CPU Usage</div>
                  <div className={styles.value}>{vm.cpuUsage}%</div>
                </div>
                <div className={styles.vmStat}>
                  <div className={styles.label}>RAM Usage</div>
                  <div className={styles.value}>{vm.ramUsage}%</div>
                </div>
                <div className={styles.vmStat}>
                  <div className={styles.label}>Disk Usage</div>
                  <div className={styles.value}>{vm.diskUsage}%</div>
                </div>
              </div>

              <div className={styles.vmDetails}>
                <div className={styles.detail}>
                  <Network />
                  <span>Сеть: {vm.network}</span>
                </div>
                <div className={styles.detail}>
                  <Clock />
                  <span>Uptime: {vm.uptime}</span>
                </div>
              </div>

              <div className={styles.vmActions}>
                <button
                  onClick={() => onOpenConsole(vm.id)}
                  disabled={vm.status !== 'running'}
                  className={styles.primaryButton}
                >
                  <Terminal />
                  Открыть консоль
                </button>
                <button
                  onClick={() => onOpenDesktop(vm.id)}
                  disabled={vm.status !== 'running'}
                  className={styles.secondaryButton}
                >
                  <Monitor />
                  Открыть рабочий стол
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
