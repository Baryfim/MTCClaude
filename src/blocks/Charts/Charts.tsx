import React, { useMemo } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Cpu, Activity } from 'lucide-react';
import { useAppSelector } from '../../lib/hooks';
import { selectMetricsHistory } from '../../lib/slices/vmMetricsSlice';
import { selectActiveVMs } from '../../lib/slices/userVMsSlice';
import { VMMetricsTimeSeries } from '../../types';
import styles from './Charts.module.scss';

interface ChartsProps {
  vmId?: string; // Опционально: показывать метрики конкретной VM
}

export const Charts: React.FC<ChartsProps> = ({ vmId }) => {
  const metricsHistory = useAppSelector(selectMetricsHistory);
  const activeVMs = useAppSelector(selectActiveVMs);

  // Преобразовать историю метрик в формат для графиков
  const chartData = useMemo<VMMetricsTimeSeries[]>(() => {
    // Фильтровать по конкретной VM если указано
    const relevantHistory = vmId 
      ? metricsHistory.filter(h => h.vmId === vmId)
      : metricsHistory;

    if (relevantHistory.length === 0) {
      // Если нет данных, вернуть mock данные
      const mockData: VMMetricsTimeSeries[] = [];
      for (let i = 23; i >= 0; i--) {
        const hour = new Date();
        hour.setHours(hour.getHours() - i);
        mockData.push({
          time: `${hour.getHours()}:00`,
          cpu: Math.floor(Math.random() * 40) + 30 + Math.sin(i / 3) * 15,
          ram: Math.floor(Math.random() * 35) + 40 + Math.cos(i / 4) * 20,
          disk: Math.floor(Math.random() * 20) + 25,
          network: Math.floor(Math.random() * 50) + 20
        });
      }
      return mockData;
    }

    // Группировать метрики по времени (округлять до минут)
    const timeGrouped = new Map<string, VMMetricsTimeSeries>();
    
    relevantHistory.forEach(({ timestamp, metrics }) => {
      const date = new Date(timestamp);
      const timeKey = `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
      
      if (!timeGrouped.has(timeKey)) {
        timeGrouped.set(timeKey, {
          time: timeKey,
          cpu: metrics.cpu_cores || 0,
          ram: metrics.ram_mb ? (metrics.ram_mb / 1024) : 0, // Конвертировать в GB для отображения
          disk: metrics.storage || 0,
          network: Math.random() * 50 + 20 // TODO: добавить реальные данные сети когда API будет готов
        });
      }
    });

    // Взять последние 24 точки данных
    const sortedData = Array.from(timeGrouped.values())
      .slice(-24);

    return sortedData.length > 0 ? sortedData : [];
  }, [metricsHistory, vmId]);

  // Показать информацию о том, что отображается
  const displayTitle = useMemo(() => {
    if (vmId) {
      const vm = activeVMs.find(v => v.id === vmId);
      return vm ? `Мониторинг ресурсов - ${vm.name}` : 'Мониторинг ресурсов';
    }
    return 'Мониторинг ресурсов за последние 24 часа';
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

        <div className={styles.chartCard}>
          <h3>
            <Activity />
            Диск и сеть
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
  );
};
