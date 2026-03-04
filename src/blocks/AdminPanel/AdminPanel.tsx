import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  LogOut,
  Users,
  Activity,
  Server,
  Clock,
  BarChart3,
  Globe,
  Edit,
  Play,
  Square,
  Trash2
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { useAppDispatch, useAppSelector } from '../../lib/hooks';
import { 
  fetchAllUsersVMsAsync, 
  updateVMResourcesAsync, 
  selectAdminVMs, 
  selectAdminLoading,
  selectAdminError
} from '../../lib/slices/adminSlice';
import { AdminVM, VMResourceUpdate } from '../../types';
import styles from './AdminPanel.module.scss';

interface UserSession {
  id: string;
  username: string;
  email: string;
  ipAddress: string;
  loginTime: Date;
  isActive: boolean;
  platform: string;
  vmCount: number;
}

interface EditModalState {
  isOpen: boolean;
  vm: AdminVM | null;
  cpuCores: number;
  ramMb: number;
  storage: number;
}

interface AdminPanelProps {
  onLogout: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const dispatch = useAppDispatch();
  const adminVMs = useAppSelector(selectAdminVMs);
  const loading = useAppSelector(selectAdminLoading);
  const error = useAppSelector(selectAdminError);
  
  const [editModal, setEditModal] = useState<EditModalState>({
    isOpen: false,
    vm: null,
    cpuCores: 0,
    ramMb: 0,
    storage: 0
  });

  // Загрузить все VM при монтировании
  useEffect(() => {
    dispatch(fetchAllUsersVMsAsync());
  }, [dispatch]);

  // Открыть модальное окно редактирования
  const handleEdit = (vm: AdminVM) => {
    setEditModal({
      isOpen: true,
      vm,
      cpuCores: vm.cpu_cores,
      ramMb: vm.ram_mb,
      storage: vm.storage_gb || 0
    });
  };

  // Сохранить изменения
  const handleSave = async () => {
    if (!editModal.vm) return;
    
    const update: VMResourceUpdate = {
      id: editModal.vm.id.toString(),
      cpu_cores: editModal.cpuCores,
      ram_mb: editModal.ramMb,
      storage: editModal.storage
    };
    
    await dispatch(updateVMResourcesAsync(update));
    setEditModal({ isOpen: false, vm: null, cpuCores: 0, ramMb: 0, storage: 0 });
    
    // Обновить список VM
    dispatch(fetchAllUsersVMsAsync());
  };

  // Закрыть модальное окно
  const handleCloseModal = () => {
    setEditModal({ isOpen: false, vm: null, cpuCores: 0, ramMb: 0, storage: 0 });
  };
  
  // Fake data for demonstration
  const sessions: UserSession[] = [];
  const stats = {
    totalSessions: 0,
    activeSessions: 0,
    inactiveSessions: 0,
    totalVMs: adminVMs.length,
    avgSessionTime: '0.0'
  };

  const activityData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    sessions: Math.floor(Math.random() * 10)
  }));

  const platformData = [
    { name: 'AWS', value: 30 },
    { name: 'Azure', value: 25 },
    { name: 'GCP', value: 20 },
    { name: 'Other', value: 25 }
  ];

  const COLORS = ['#000000', '#4a4a4a', '#666666', '#888888'];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerInner}>
            <div className={styles.logoSection}>
              <div className={styles.logoBox}>
                <ShieldCheck />
              </div>
              <div className={styles.title}>
                <h1>Админ-панель</h1>
                <p>Управление платформой</p>
              </div>
            </div>
            <button onClick={onLogout} className={styles.logoutButton}>
              <LogOut />
              <span>Выйти</span>
            </button>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.statsGrid}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.statCard}
          >
            <div className={styles.statInner}>
              <div className={styles.statInfo}>
                <p>Всего сессий</p>
                <div className={styles.statValue}>{stats.totalSessions}</div>
              </div>
              <div className={`${styles.statIcon} ${styles.purple}`}>
                <Users />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={styles.statCard}
          >
            <div className={styles.statInner}>
              <div className={styles.statInfo}>
                <p>Активных</p>
                <div className={styles.statValue}>{stats.activeSessions}</div>
              </div>
              <div className={`${styles.statIcon} ${styles.green}`}>
                <Activity />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={styles.statCard}
          >
            <div className={styles.statInner}>
              <div className={styles.statInfo}>
                <p>Всего VM</p>
                <div className={styles.statValue}>{stats.totalVMs}</div>
              </div>
              <div className={`${styles.statIcon} ${styles.blue}`}>
                <Server />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={styles.statCard}
          >
            <div className={styles.statInner}>
              <div className={styles.statInfo}>
                <p>Средняя сессия</p>
                <div className={styles.statValue}>{stats.avgSessionTime}ч</div>
              </div>
              <div className={`${styles.statIcon} ${styles.orange}`}>
                <Clock />
              </div>
            </div>
          </motion.div>
        </div>

        <div className={styles.chartsGrid}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={styles.chartCard}
          >
            <h3>
              <BarChart3 />
              Активность по часам
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#666666" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#666666" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis dataKey="hour" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Area type="monotone" dataKey="sessions" stroke="#666666" fillOpacity={1} fill="url(#colorSessions)" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={styles.chartCard}
          >
            <h3>
              <Globe />
              Распределение по платформам
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#666666"
                  dataKey="value"
                >
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className={styles.sessionsPanel}
        >
          <div className={styles.panelHeader}>
            <h2>
              <Server />
              Виртуальные машины пользователей
            </h2>
            <span className={styles.vmCount}>Всего: {adminVMs.length}</span>
          </div>

          {loading ? (
            <div className={styles.loadingState}>
              <Activity className={styles.spinner} />
              <p>Загрузка...</p>
            </div>
          ) : error ? (
            <div className={styles.errorState}>
              <p>Ошибка: {error}</p>
            </div>
          ) : adminVMs.length === 0 ? (
            <div className={styles.emptyState}>
              <Server />
              <p>Нет виртуальных машин</p>
            </div>
          ) : (
            <div className={styles.vmTable}>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Имя VM</th>
                    <th>Пользователь</th>
                    <th>Статус</th>
                    <th>CPU</th>
                    <th>RAM (MB)</th>
                    <th>Storage (GB)</th>
                    <th>Создана</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {adminVMs.map((vm) => (
                    <tr key={vm.id}>
                      <td>{vm.id}</td>
                      <td>{vm.name}</td>
                      <td>{vm.tenant_name}</td>
                      <td>
                        <span className={`${styles.status} ${styles[vm.status.toLowerCase()]}`}>
                          {vm.status === 'RUNNING' && <Play size={14} />}
                          {vm.status === 'STOPPED' && <Square size={14} />}
                          {vm.status}
                        </span>
                      </td>
                      <td>{vm.cpu_cores}</td>
                      <td>{vm.ram_mb}</td>
                      <td>{vm.storage_gb || 'N/A'}</td>
                      <td>{new Date(vm.created_at).toLocaleDateString('ru-RU')}</td>
                      <td>
                        <button
                          className={styles.editButton}
                          onClick={() => handleEdit(vm)}
                          title="Редактировать ресурсы"
                        >
                          <Edit size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      {/* Модальное окно редактирования */}
      {editModal.isOpen && editModal.vm && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3>Редактировать ресурсы VM</h3>
              <button className={styles.closeButton} onClick={handleCloseModal}>×</button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.vmInfo}>
                <p><strong>VM:</strong> {editModal.vm.name}</p>
                <p><strong>Пользователь:</strong> {editModal.vm.tenant_name}</p>
                <p><strong>ID:</strong> {editModal.vm.id}</p>
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="cpuCores">
                  Ядра CPU
                </label>
                <input
                  id="cpuCores"
                  type="number"
                  min="1"
                  max="64"
                  value={editModal.cpuCores}
                  onChange={(e) => setEditModal({ ...editModal, cpuCores: parseInt(e.target.value) || 1 })}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="ramMb">
                  Оперативная память (MB)
                </label>
                <input
                  id="ramMb"
                  type="number"
                  min="512"
                  max="131072"
                  step="512"
                  value={editModal.ramMb}
                  onChange={(e) => setEditModal({ ...editModal, ramMb: parseInt(e.target.value) || 512 })}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="storage">
                  Хранилище (GB)
                </label>
                <input
                  id="storage"
                  type="number"
                  min="10"
                  max="2048"
                  step="10"
                  value={editModal.storage}
                  onChange={(e) => setEditModal({ ...editModal, storage: parseInt(e.target.value) || 10 })}
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.cancelButton} onClick={handleCloseModal}>
                Отмена
              </button>
              <button className={styles.saveButton} onClick={handleSave}>
                Сохранить
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
