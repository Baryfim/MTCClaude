import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  LogOut,
  Users,
  Activity,
  Server,
  Clock,
  HardDrive,
  Edit,
  Play,
  Square,
  Trash2,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { useAppDispatch, useAppSelector } from '../../lib/hooks';
import { 
  fetchAllUsersVMsAsync, 
  updateVMResourcesAsync,
  fetchActiveVMMetricsAsync,
  selectAdminVMs, 
  selectAdminVMMetrics,
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
  name: string;
  image: string;
  cpuCores: number;
  ramMb: number;
  storage: number;
  diskBytes: string;
  pricePerHour: number;
}

interface AdminPanelProps {
  onLogout: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const dispatch = useAppDispatch();
  const adminVMs = useAppSelector(selectAdminVMs);
  const vmMetrics = useAppSelector(selectAdminVMMetrics);
  const loading = useAppSelector(selectAdminLoading);
  const error = useAppSelector(selectAdminError);
  
  const [editModal, setEditModal] = useState<EditModalState>({
    isOpen: false,
    vm: null,
    name: '',
    image: '',
    cpuCores: 0,
    ramMb: 0,
    storage: 0,
    diskBytes: '',
    pricePerHour: 0
  });

  // Фильтр и сортировка
  type FilterType = 'all' | 'active' | 'inactive';
  type SortType = 'none' | 'cpu' | 'ram' | 'storage';
  
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('none');

  // Фильтрация и сортировка VM
  const filteredAndSortedVMs = useMemo(() => {
    let result = [...adminVMs];

    // Фильтрация
    if (filterType === 'active') {
      result = result.filter(vm => vm.status === 'RUNNING');
    } else if (filterType === 'inactive') {
      result = result.filter(vm => vm.status !== 'RUNNING');
    }

    // Сортировка
    if (sortType === 'cpu') {
      result.sort((a, b) => b.cpu_cores - a.cpu_cores);
    } else if (sortType === 'ram') {
      result.sort((a, b) => b.ram_mb - a.ram_mb);
    } else if (sortType === 'storage') {
      result.sort((a, b) => (b.storage || 0) - (a.storage || 0));
    }

    return result;
  }, [adminVMs, filterType, sortType]);

  // Загрузить все VM при монтировании
  useEffect(() => {
    dispatch(fetchAllUsersVMsAsync());
  }, [dispatch]);

  // Загрузить метрики для активных VM
  useEffect(() => {
    const activeVMIds = adminVMs
      .filter(vm => vm.status === 'RUNNING')
      .map(vm => vm.id);
    
    if (activeVMIds.length > 0) {
      dispatch(fetchActiveVMMetricsAsync(activeVMIds));
      
      // Обновлять метрики каждые 5 секунд
      const interval = setInterval(() => {
        dispatch(fetchActiveVMMetricsAsync(activeVMIds));
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [dispatch, adminVMs]);

  // Открыть модальное окно редактирования
  const handleEdit = (vm: AdminVM) => {
    setEditModal({
      isOpen: true,
      vm,
      name: vm.name,
      image: vm.image,
      cpuCores: vm.cpu_cores,
      ramMb: vm.ram_mb,
      storage: vm.storage || 0,
      diskBytes: vm.disk_bytes || '',
      pricePerHour: vm.price_per_hour || 0
    });
  };

  // Сохранить изменения
  const handleSave = async () => {
    if (!editModal.vm) return;
    
    const update: VMResourceUpdate = { id: editModal.vm.id };
    
    if (editModal.name !== editModal.vm.name) update.name = editModal.name;
    if (editModal.image !== editModal.vm.image) update.image = editModal.image;
    if (editModal.cpuCores !== editModal.vm.cpu_cores) update.cpu_cores = editModal.cpuCores;
    if (editModal.ramMb !== editModal.vm.ram_mb) update.ram_mb = editModal.ramMb;
    if (editModal.storage !== (editModal.vm.storage || 0)) update.storage = editModal.storage;
    if (editModal.diskBytes !== (editModal.vm.disk_bytes || '')) update.disk_bytes = editModal.diskBytes;
    if (editModal.pricePerHour !== (editModal.vm.price_per_hour || 0)) update.price_per_hour = editModal.pricePerHour;
    
    await dispatch(updateVMResourcesAsync(update));
    setEditModal({ isOpen: false, vm: null, name: '', image: '', cpuCores: 0, ramMb: 0, storage: 0, diskBytes: '', pricePerHour: 0 });
    dispatch(fetchAllUsersVMsAsync());
  };

  // Закрыть модальное окно
  const handleCloseModal = () => {
    setEditModal({ isOpen: false, vm: null, name: '', image: '', cpuCores: 0, ramMb: 0, storage: 0, diskBytes: '', pricePerHour: 0 });
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

  // Данные потребления CPU активных VM
  const cpuData = useMemo(() => {
    return adminVMs
      .filter(vm => vm.status === 'RUNNING')
      .map(vm => {
        const metrics = vmMetrics[vm.id];
        const cpuPercent = metrics?.cpu_percent ?? 0;
        return {
          name: vm.name.length > 15 ? vm.name.substring(0, 15) + '...' : vm.name,
          fullName: vm.name,
          cpu: Number(cpuPercent.toFixed(1)),
          tenant: vm.tenant_name
        };
      })
      .sort((a, b) => b.cpu - a.cpu);
  }, [adminVMs, vmMetrics]);

  // Данные использования хранилища
  const TOTAL_STORAGE_GB = 200;
  const storageData = useMemo(() => {
    // Группируем VM с одинаковыми tenant_name
    const vmsByUser = adminVMs.reduce((acc, vm) => {
      const storage = vm.storage || 0;
      if (!acc[vm.tenant_name]) {
        acc[vm.tenant_name] = 0;
      }
      acc[vm.tenant_name] += storage;
      return acc;
    }, {} as Record<string, number>);

    // Создаем массив данных для диаграммы
    const data = Object.entries(vmsByUser)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);

    // Вычисляем использованное место
    const usedStorage = data.reduce((sum, item) => sum + item.value, 0);
    const freeStorage = Math.max(0, TOTAL_STORAGE_GB - usedStorage);

    // Добавляем свободное место
    if (freeStorage > 0) {
      data.push({ name: 'Свободно', value: freeStorage });
    }

    return data;
  }, [adminVMs]);

  // Цвета для диаграммы - яркие и различимые
  const STORAGE_COLORS = [
    '#ef4444', // red-500
    '#f97316', // orange-500
    '#f59e0b', // amber-500
    '#eab308', // yellow-500
    '#84cc16', // lime-500
    '#22c55e', // green-500
    '#10b981', // emerald-500
    '#14b8a6', // teal-500
    '#06b6d4', // cyan-500
    '#0ea5e9', // sky-500
    '#3b82f6', // blue-500
    '#6366f1', // indigo-500
    '#8b5cf6', // violet-500
    '#a855f7', // purple-500
    '#d946ef', // fuchsia-500
    '#ec4899', // pink-500
    '#334155', // gray-700 для свободного места
  ];

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
              <Activity />
              Потребление CPU активных VM
            </h3>
            {cpuData.length === 0 ? (
              <div className={styles.emptyChart}>
                <p>Нет активных VM</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cpuData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#94a3b8" 
                    style={{ fontSize: '11px' }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    style={{ fontSize: '12px' }}
                    label={{ value: 'CPU %', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div style={{
                            backgroundColor: 'rgba(15, 23, 42, 0.95)',
                            border: '1px solid rgba(239, 68, 68, 0.5)',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            color: '#fff'
                          }}>
                            <p style={{ margin: '0 0 4px 0', fontWeight: 600 }}>{data.fullName}</p>
                            <p style={{ margin: '0', fontSize: '12px', color: '#94a3b8' }}>Пользователь: {data.tenant}</p>
                            <p style={{ margin: '4px 0 0 0', color: '#ef4444', fontWeight: 600 }}>CPU: {data.cpu}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="cpu" fill="#ef4444" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={styles.chartCard}
          >
            <h3>
              <HardDrive />
              Использование хранилища ({TOTAL_STORAGE_GB} GB)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={storageData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, value, percent }) => {
                    if (percent < 0.03) return ''; // Не показываем лейбл для очень маленьких сегментов
                    return `${name}: ${value}GB (${(percent * 100).toFixed(1)}%)`;
                  }}
                  outerRadius={90}
                  fill="#666666"
                  dataKey="value"
                >
                  {storageData.map((entry, index) => {
                    const colorIndex = entry.name === 'Свободно' 
                      ? STORAGE_COLORS.length - 1 
                      : index % (STORAGE_COLORS.length - 1);
                    return (
                      <Cell key={`cell-${index}`} fill={STORAGE_COLORS[colorIndex]} />
                    );
                  })}
                </Pie>
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value, entry: any) => {
                    const data = entry.payload;
                    return `${data.name}: ${data.value}GB`;
                  }}
                  wrapperStyle={{
                    fontSize: '12px',
                    color: '#94a3b8'
                  }}
                />
                <Tooltip
                  formatter={(value: any) => [`${value} GB`, 'Хранилище']}
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

          <div className={styles.controls}>
            <div className={styles.filterGroup}>
              <Filter size={18} />
              <span>Фильтр:</span>
              <button
                className={`${styles.filterButton} ${filterType === 'all' ? styles.active : ''}`}
                onClick={() => setFilterType('all')}
              >
                Все
              </button>
              <button
                className={`${styles.filterButton} ${filterType === 'active' ? styles.active : ''}`}
                onClick={() => setFilterType('active')}
              >
                Активные
              </button>
              <button
                className={`${styles.filterButton} ${filterType === 'inactive' ? styles.active : ''}`}
                onClick={() => setFilterType('inactive')}
              >
                Неактивные
              </button>
            </div>

            <div className={styles.sortGroup}>
              <ArrowUpDown size={18} />
              <span>Сортировка:</span>
              <select
                className={styles.sortSelect}
                value={sortType}
                onChange={(e) => setSortType(e.target.value as SortType)}
              >
                <option value="none">По умолчанию</option>
                <option value="cpu">По CPU</option>
                <option value="ram">По RAM</option>
                <option value="storage">По Storage</option>
              </select>
            </div>
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
          ) : filteredAndSortedVMs.length === 0 ? (
            <div className={styles.emptyState}>
              <Server />
              <p>{adminVMs.length === 0 ? 'Нет виртуальных машин' : 'Нет VM, соответствующих фильтру'}</p>
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
                  {filteredAndSortedVMs.map((vm) => (
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
                      <td>{vm.storage || 'N/A'}</td>
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
                <p><strong>Пользователь:</strong> {editModal.vm.tenant_name}</p>
                <p><strong>ID:</strong> {editModal.vm.id}</p>
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="name">Имя VM</label>
                <input id="name" type="text" value={editModal.name} onChange={(e) => setEditModal({ ...editModal, name: e.target.value })} />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="image">Образ</label>
                <input id="image" type="text" value={editModal.image} onChange={(e) => setEditModal({ ...editModal, image: e.target.value })} />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="cpuCores">Ядра CPU</label>
                <input id="cpuCores" type="number" min="1" max="64" value={editModal.cpuCores} onChange={(e) => setEditModal({ ...editModal, cpuCores: parseInt(e.target.value) || 1 })} />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="ramMb">RAM (MB)</label>
                <input id="ramMb" type="number" min="512" max="131072" step="512" value={editModal.ramMb} onChange={(e) => setEditModal({ ...editModal, ramMb: parseInt(e.target.value) || 512 })} />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="storage">Storage (GB)</label>
                <input id="storage" type="number" min="10" max="2048" step="10" value={editModal.storage} onChange={(e) => setEditModal({ ...editModal, storage: parseInt(e.target.value) || 10 })} />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="diskBytes">Disk Bytes</label>
                <input id="diskBytes" type="text" value={editModal.diskBytes} onChange={(e) => setEditModal({ ...editModal, diskBytes: e.target.value })} />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="pricePerHour">Цена/час</label>
                <input id="pricePerHour" type="number" min="0" step="0.01" value={editModal.pricePerHour} onChange={(e) => setEditModal({ ...editModal, pricePerHour: parseFloat(e.target.value) || 0 })} />
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
