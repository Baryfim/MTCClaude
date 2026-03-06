import React, { useMemo, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Cpu, Activity } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../lib/hooks';
import { selectMetricsHistory, fetchVMMetricsAsync } from '../../lib/slices/vmMetricsSlice';
import { selectActiveVMs } from '../../lib/slices/userVMsSlice';
import { VMMetricsTimeSeries } from '../../types';
import styles from './Charts.module.scss';

interface ChartsProps {
  vmId?: number; // Опционально: показывать метрики конкретной VM
}

export const Charts: React.FC<ChartsProps> = ({ vmId }) => {
  const dispatch = useAppDispatch();
  const metricsHistory = useAppSelector(selectMetricsHistory);
  const activeVMs = useAppSelector(selectActiveVMs);

  // Автоматически обновлять метрики первой VM каждые 10 секунд
  useEffect(() => {
    const firstVM = activeVMs[0];
    if (!firstVM) return;

    console.log('📊 [Charts] Настройка автообновления для VM:', firstVM.id, firstVM.name);

    // Немедленно загрузить метрики
    dispatch(fetchVMMetricsAsync(firstVM.id));

    // Установить интервал обновления каждые 10 секунд
    const interval = setInterval(() => {
      console.log('🔄 [Charts] Обновление метрик для VM:', firstVM.id);
      dispatch(fetchVMMetricsAsync(firstVM.id));
    }, 10000);

    // Очистить интервал при размонтировании или изменении списка VM
    return () => {
      console.log('🛑 [Charts] Очистка интервала обновления');
      clearInterval(interval);
    };
  }, [activeVMs, dispatch]);

  // Преобразовать историю метрик в формат для графиков
  const chartData = useMemo<VMMetricsTimeSeries[]>(() => {
    console.log('📊 [График] Пересчет данных, vmId:', vmId);
    console.log('📊 [График] История метрик:', metricsHistory);
    
    // Фильтровать по конкретной VM если указано
    const relevantHistory = vmId 
      ? metricsHistory.filter(h => h.vmId === vmId)
      : metricsHistory;

    console.log('📊 [График] Фильтрованная история:', relevantHistory.length, 'записей');

    if (relevantHistory.length === 0) {
      console.warn('⚠️ [График] Нет данных для отображения');
      return [];
    }

    // Преобразовать каждую запись в данные для графика
    const chartPoints = relevantHistory.map(({ timestamp, metrics }) => {
      const date = new Date(timestamp);
      const timeKey = `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
      
      // Вычислить проценты использования
      const cpuPercent = metrics.cpu_percent ?? 0;
      const ramPercent = (metrics.memory_limit_mb && metrics.memory_limit_mb > 0)
        ? ((metrics.memory_used_mb ?? 0) / metrics.memory_limit_mb) * 100 
        : 0;
      
      const diskPercent = (metrics.disk_limit_bytes && metrics.disk_limit_bytes > 0)
        ? (((metrics.disk_used_mb ?? 0) * 1024 * 1024) / metrics.disk_limit_bytes) * 100 
        : 0;
      
      console.log(`🕒 [График] Метрика в ${timeKey}:`, {
        cpu: cpuPercent,
        ram: ramPercent,
        disk: diskPercent,
        online: metrics.online
      });
      
      return {
        time: timeKey,
        cpu: cpuPercent,
        ram: ramPercent,
        disk: diskPercent,
        network: 0,
      };
    });

    // Взять последние 60 точек данных (10 минут с интервалом 10 секунд)
    const sortedData = chartPoints.slice(-60);

    console.log('📊 [График] Итоговые данные:', sortedData);
    return sortedData;
  }, [metricsHistory, vmId]);

  // Показать информацию о том, что отображается
  const displayTitle = useMemo(() => {
    if (vmId) {
      const vm = activeVMs.find(v => v.id === vmId);
      return vm ? `Мониторинг ресурсов - ${vm.name}` : 'Мониторинг ресурсов';
    }
    return 'Мониторинг ресурсов в реальном времени (обновление каждые 10 сек)';
  }, [vmId, activeVMs]);

  return (
    <section className={styles.container}>
      <h2>{displayTitle}</h2>
      
      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3>
            <Cpu />
            CPU и RAM использование
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
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
                stroke="#3b82f6" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorCpu)"
                name="CPU"
              />
              <Area 
                type="monotone" 
                dataKey="ram" 
                stroke="#10b981" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorRam)"
                name="RAM"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <h3>
            <Activity />
            Использование диска
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
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
                stroke="#f97316" 
                strokeWidth={3}
                dot={{ fill: '#f97316', r: 4 }}
                name="Диск"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
};
