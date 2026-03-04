import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Activity as ActivityIcon, PlayCircle, StopCircle, RotateCcw, Trash2, CheckCircle, XCircle, Loader } from 'lucide-react';
import { Activity } from '../../types';
import styles from './UsageHistory.module.scss';

interface UsageHistoryProps {
  activities: Activity[];
}

const getActivityIcon = (action: string) => {
  if (action.includes('Запущена')) return <PlayCircle />;
  if (action.includes('Остановлена')) return <StopCircle />;
  if (action.includes('Перезапущена')) return <RotateCcw />;
  if (action.includes('Удалена')) return <Trash2 />;
  if (action.includes('Создана')) return <CheckCircle />;
  return <ActivityIcon />;
};

const getStatusColor = (status: Activity['status']) => {
  switch (status) {
    case 'success': return styles.success;
    case 'error': return styles.error;
    case 'pending': return styles.pending;
    default: return '';
  }
};

export const UsageHistory: React.FC<UsageHistoryProps> = ({ activities }) => {
  return (
    <section className={styles.container}>
      <h2>История активности</h2>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <Clock />
            <h3>Активность ВМ</h3>
          </div>
          <span className={styles.count}>{activities.length} записей</span>
        </div>

        <div className={styles.timeline}>
        {activities.length === 0 ? (
          <div className={styles.emptyState}>
            <ActivityIcon />
            <p>Пока нет активности</p>
            <span>История действий с виртуальными машинами появится здесь</span>
          </div>
        ) : (
          activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`${styles.activityItem} ${getStatusColor(activity.status)}`}
            >
              <div className={styles.iconContainer}>
                {getActivityIcon(activity.action)}
              </div>

              <div className={styles.content}>
                <div className={styles.main}>
                  <span className={styles.action}>{activity.action}</span>
                  <span className={styles.vmName}>{activity.vmName}</span>
                </div>
                <div className={styles.meta}>
                  <Clock />
                  <span>{activity.timestamp}</span>
                </div>
              </div>

              <div className={styles.statusBadge}>
                {activity.status === 'success' && <CheckCircle />}
                {activity.status === 'error' && <XCircle />}
                {activity.status === 'pending' && <Loader />}
              </div>
            </motion.div>
          ))
        )}
        </div>
      </div>
    </section>
  );
};
