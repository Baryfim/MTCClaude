import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  LogOut,
  Users,
  Activity,
  Server,
  Clock,
  BarChart3,
  Globe
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
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

interface AdminPanelProps {
  onLogout: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  // Fake data for demonstration
  const sessions: UserSession[] = [];
  const stats = {
    totalSessions: 0,
    activeSessions: 0,
    inactiveSessions: 0,
    totalVMs: 0,
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
              Выйти
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
              <Users />
              Активные сессии пользователей
            </h2>
          </div>

          <div className={styles.emptyState}>
            <Users />
            <p>Нет активных сессий</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
