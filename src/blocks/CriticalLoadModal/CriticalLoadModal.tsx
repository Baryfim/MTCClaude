import React from 'react';
import { AlertTriangle } from 'lucide-react';
import styles from './CriticalLoadModal.module.scss';

interface CriticalLoadModalProps {
  vmName: string;
  cpuUsage?: number;
  ramUsage?: number;
  diskUsage?: number;
  onClose: () => void;
}

export const CriticalLoadModal: React.FC<CriticalLoadModalProps> = ({
  vmName,
  cpuUsage,
  ramUsage,
  diskUsage,
  onClose
}) => {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <AlertTriangle className={styles.warningIcon} />
          <h2>Критическая нагрузка на VM</h2>
        </div>
        
        <div className={styles.content}>
          <p className={styles.vmName}>Виртуальная машина: <strong>{vmName}</strong></p>
          
          <div className={styles.metrics}>
            {cpuUsage !== undefined && cpuUsage > 90 && (
              <div className={styles.metric}>
                <span>CPU:</span>
                <span className={styles.critical}>{cpuUsage.toFixed(2)}%</span>
              </div>
            )}
            {ramUsage !== undefined && ramUsage > 90 && (
              <div className={styles.metric}>
                <span>RAM:</span>
                <span className={styles.critical}>{ramUsage.toFixed(2)}%</span>
              </div>
            )}
            {diskUsage !== undefined && diskUsage > 90 && (
              <div className={styles.metric}>
                <span>Диск:</span>
                <span className={styles.critical}>{diskUsage.toFixed(2)}%</span>
              </div>
            )}
          </div>
          
          <p className={styles.message}>
            Система автоматически создаст снапшот и перезагрузит виртуальную машину 
            для восстановления нормальной работы.
          </p>
        </div>
        
        <div className={styles.footer}>
          <button onClick={onClose} className={styles.okButton}>
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
};
