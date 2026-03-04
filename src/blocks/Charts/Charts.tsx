import React from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Cpu, Activity } from 'lucide-react';
import styles from './Charts.module.scss';

interface ChartsProps {
  data: Array<{
    time: string;
    cpu: number;
    ram: number;
    disk: number;
    network: number;
  }>;
}

export const Charts: React.FC<ChartsProps> = ({ data }) => {
  return (
    <section className={styles.container}>
      <h2>Мониторинг ресурсов за 24 часа</h2>
      
      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3>
            <Cpu />
            CPU и RAM использование
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
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
            <LineChart data={data}>
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
