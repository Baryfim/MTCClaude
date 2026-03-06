import React from 'react';
import { Info } from 'lucide-react';
import styles from './DemoBanner.module.scss';

export const DemoBanner: React.FC = () => {
  return (
    <div className={styles.banner}>
      <Info />
      <span>Сайт для демонстрации функционала и дизайна проекта без подключения к серверу</span>
    </div>
  );
};
