import React, { useState } from 'react';
import { Server, Play, Square, RotateCw, Trash2, Network, Clock, Terminal, Monitor, Cpu, HardDrive, Activity, Zap, Camera, Edit2, Check, X, RotateCcw } from 'lucide-react';
import { formatNumber } from '../../lib/utils';
import styles from './UserVMs.module.scss';

export interface VMSnapshot {
  id: string;
  name: string;
  createdAt: string;
  size: string;
}

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
  snapshots?: VMSnapshot[];
}

interface UserVMsProps {
  vms: DeployedVM[];
  onVMAction: (vmId: number, action: 'start' | 'stop' | 'restart' | 'delete') => void;
  onOpenConsole: (vmId: number) => void;
  onOpenDesktop: (vmId: number) => void;
  onCreateVM: () => void;
  onCreateSnapshot?: (vmId: number) => void;
  onRestoreSnapshot?: (vmId: number, snapshotId: number) => void;
  onRenameSnapshot?: (vmId: number, snapshotId: number, newName: string) => void;
  onDeleteSnapshot?: (vmId: number, snapshotId: number) => void;
  isDemoMode?: boolean;
}

const SnapshotManager: React.FC<{
  vmId: number;
  snapshots: VMSnapshot[];
  onCreateSnapshot: () => void;
  onRestoreSnapshot: (snapshotId: number) => void;
  onRenameSnapshot: (snapshotId: number, newName: string) => void;
  onDeleteSnapshot: (snapshotId: number) => void;
}> = ({ vmId, snapshots, onCreateSnapshot, onRestoreSnapshot, onRenameSnapshot, onDeleteSnapshot }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const handleStartEdit = (snapshot: VMSnapshot) => {
    setEditingId(snapshot.id);
    setEditName(snapshot.name);
  };

  const handleSaveEdit = (snapshotId: number) => {
    if (editName.trim()) {
      onRenameSnapshot(snapshotId, editName.trim());
    }
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  return (
    <div className={styles.snapshotSection}>
      <div className={styles.snapshotHeader}>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className={styles.snapshotToggle}
        >
          <Camera />
          <span>Снапшоты ({snapshots.length})</span>
          <span className={`${styles.toggleArrow} ${isExpanded ? styles.expanded : ''}`}>▼</span>
        </button>
        <button 
          onClick={onCreateSnapshot}
          className={styles.createSnapshotButton}
        >
          <Camera />
          Создать снапшот
        </button>
      </div>

      {isExpanded && (
        <div className={styles.snapshotList}>
          {snapshots.length === 0 ? (
            <div className={styles.emptySnapshots}>
              <Camera />
              <p>Нет созданных снапшотов</p>
            </div>
          ) : (
            snapshots.map(snapshot => (
              <div key={snapshot.id} className={styles.snapshotItem}>
                <div className={styles.snapshotInfo}>
                  {editingId === snapshot.id ? (
                    <div className={styles.snapshotEditInput}>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit(snapshot.id)}
                        autoFocus
                      />
                      <button 
                        onClick={() => handleSaveEdit(snapshot.id)}
                        className={styles.iconButton}
                        title="Сохранить"
                      >
                        <Check />
                      </button>
                      <button 
                        onClick={handleCancelEdit}
                        className={styles.iconButton}
                        title="Отмена"
                      >
                        <X />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className={styles.snapshotDetails}>
                        <span className={styles.snapshotName}>{snapshot.name}</span>
                        <div className={styles.snapshotMeta}>
                          <span>{snapshot.createdAt}</span>
                          <span>•</span>
                          <span>{snapshot.size}</span>
                        </div>
                      </div>
                      <div className={styles.snapshotActions}>
                        <button
                          onClick={() => handleStartEdit(snapshot)}
                          className={styles.iconButton}
                          title="Переименовать"
                        >
                          <Edit2 />
                        </button>
                        <button
                          onClick={() => onRestoreSnapshot(snapshot.id)}
                          className={`${styles.iconButton} ${styles.restore}`}
                          title="Восстановить"
                        >
                          <RotateCcw />
                        </button>
                        <button
                          onClick={() => onDeleteSnapshot(snapshot.id)}
                          className={`${styles.iconButton} ${styles.deleteIcon}`}
                          title="Удалить"
                        >
                          <Trash2 />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const getUsageColor = (value: number): string => {
  if (value <= 60) return '#22c55e'; // Зеленый - все хорошо
  if (value <= 80) return '#eab308'; // Желтый - не очень
  return '#ef4444'; // Красный - плохо
};

const getUsageGradient = (value: number): string => {
  const color = getUsageColor(value);
  if (value <= 60) return `linear-gradient(90deg, ${color}, #4ade80)`;
  if (value <= 80) return `linear-gradient(90deg, ${color}, #facc15)`;
  return `linear-gradient(90deg, ${color}, #f87171)`;
};

export const UserVMs: React.FC<UserVMsProps> = ({ 
  vms, 
  onVMAction,
  onOpenConsole,
  onOpenDesktop,
  onCreateVM,
  onCreateSnapshot,
  onRestoreSnapshot,
  onRenameSnapshot,
  onDeleteSnapshot,
  isDemoMode = false
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
                    <span>PORT: {vm.port || 5900}</span>
                    <span className={`${styles.statusBadge} ${styles[vm.status]}`}>
                      {vm.status === 'stopped' ? 'Остановлена' : 
                       vm.status === 'creating' ? 'Запускается...' : 
                       vm.status === 'restarting' ? 'Перезагрузка...' :
                       'Работает'}
                    </span>
                  </div>
                </div>
                <div className={styles.actionButtons}>
                  <button 
                    onClick={() => onVMAction(vm.id, 'start')}
                    disabled={vm.status === 'running' || vm.status === 'creating' || vm.status === 'restarting'}
                    className={styles.actionButton}
                    title="Start"
                  >
                    <Play />
                  </button>
                  <button 
                    onClick={() => onVMAction(vm.id, 'stop')}
                    disabled={vm.status === 'stopped' || vm.status === 'creating' || vm.status === 'restarting'}
                    className={styles.actionButton}
                    title="Stop"
                  >
                    <Square />
                  </button>
                  <button 
                    onClick={() => onVMAction(vm.id, 'restart')}
                    disabled={vm.status === 'creating' || vm.status === 'restarting'}
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

              {/* Colorful Metrics Dashboard */}
              <div className={styles.metricsSection}>
                <div className={styles.metricsHeader}>
                  <Activity />
                  <span>Мониторинг производительности</span>
                </div>

                {/* Linear Progress Bars */}
                <div className={styles.linearMetrics}>
                  <div className={styles.metricBar}>
                    <div className={styles.metricBarHeader}>
                      <span className={styles.metricBarLabel}>
                        <Cpu className={styles.metricIcon} style={{ color: getUsageColor(vm.cpuUsage) }} />
                        Использование процессора
                      </span>
                      <span className={styles.metricBarValue}>{vm.cpuUsage.toFixed(2)}%</span>
                    </div>
                    <div className={styles.progressBarTrack}>
                      <div 
                        className={styles.progressBarFill}
                        style={{ 
                          width: `${vm.cpuUsage}%`,
                          background: getUsageGradient(vm.cpuUsage)
                        }}
                      />
                    </div>
                  </div>

                  <div className={styles.metricBar}>
                    <div className={styles.metricBarHeader}>
                      <span className={styles.metricBarLabel}>
                        <Zap className={styles.metricIcon} style={{ color: getUsageColor(vm.ramUsage) }} />
                        Использование памяти
                      </span>
                      <span className={styles.metricBarValue}>{vm.ramUsage.toFixed(2)}% ({formatNumber(Math.round(vm.config.ram * vm.ramUsage / 100))} / {formatNumber(vm.config.ram)} МБ)</span>
                    </div>
                    <div className={styles.progressBarTrack}>
                      <div 
                        className={styles.progressBarFill}
                        style={{ 
                          width: `${vm.ramUsage}%`,
                          background: getUsageGradient(vm.ramUsage)
                        }}
                      />
                    </div>
                  </div>

                  <div className={styles.metricBar}>
                    <div className={styles.metricBarHeader}>
                      <span className={styles.metricBarLabel}>
                        <HardDrive className={styles.metricIcon} style={{ color: getUsageColor(vm.diskUsage) }} />
                        Использование диска
                      </span>
                      <span className={styles.metricBarValue}>{vm.diskUsage.toFixed(2)}% ({formatNumber(Math.round(vm.config.storage * vm.diskUsage / 100))} / {formatNumber(vm.config.storage)} GB)</span>
                    </div>
                    <div className={styles.progressBarTrack}>
                      <div 
                        className={styles.progressBarFill}
                        style={{ 
                          width: `${vm.diskUsage}%`,
                          background: getUsageGradient(vm.diskUsage)
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Snapshot Manager */}
              {onCreateSnapshot && onRestoreSnapshot && onRenameSnapshot && onDeleteSnapshot && (
                <SnapshotManager
                  vmId={vm.id}
                  snapshots={vm.snapshots || []}
                  onCreateSnapshot={() => onCreateSnapshot(vm.id)}
                  onRestoreSnapshot={(snapshotId) => onRestoreSnapshot(vm.id, snapshotId)}
                  onRenameSnapshot={(snapshotId, newName) => onRenameSnapshot(vm.id, snapshotId, newName)}
                  onDeleteSnapshot={(snapshotId) => onDeleteSnapshot(vm.id, snapshotId)}
                />
              )}

              <div className={styles.vmDetails}>
                <div className={styles.detail}>
                  <Network />
                  <span>Сеть: {vm.network}</span>
                </div>
                <div className={styles.detail}>
                  <Clock />
                  <span>{vm.uptime}</span>
                </div>
              </div>

              <div className={styles.vmActions}>
                <button
                  onClick={() => onOpenConsole(vm.id)}
                  disabled={vm.status !== 'running' || isDemoMode}
                  className={styles.primaryButton}
                  title={isDemoMode ? "Недоступно в демо-режиме" : ""}
                >
                  <Terminal />
                  Открыть консоль
                </button>
                <button
                  onClick={() => onOpenDesktop(vm.id)}
                  disabled={vm.status !== 'running' || isDemoMode}
                  className={styles.secondaryButton}
                  title={isDemoMode ? "Недоступно в демо-режиме" : ""}
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
