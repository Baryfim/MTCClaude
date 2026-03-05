import React from 'react';
import { Cpu, Activity, HardDrive, Server } from 'lucide-react';
import styles from './ResourceUsage.module.scss';

interface ResourceUsageProps {
  usedResources: {
    cpu: number;
    ram: number;
    storage: number;
    vms: number;
  };
  accountLimits: {
    cpu: number;
    ram: number;
    storage: number;
    maxVMs: number;
  };
}

export const ResourceUsage: React.FC<ResourceUsageProps> = ({ usedResources, accountLimits }) => {
  return (
    <section className={styles.container}>
      <h2>Использование ресурсов</h2>
      <div className={styles.resourceGrid}>
        <div className={styles.resourceCard}>
          <div className={styles.resourceHeader}>
            <Cpu />
            <span>CPU</span>
          </div>
          <div className={styles.resourceValue}>{usedResources.cpu} / {accountLimits.cpu}</div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ width: `${(usedResources.cpu / accountLimits.cpu) * 100}%` }}
            />
          </div>
        </div>

        <div className={styles.resourceCard}>
          <div className={styles.resourceHeader}>
            <Activity />
            <span>RAM</span>
          </div>
          <div className={styles.resourceValue}>{usedResources.ram} / {accountLimits.ram} МБ</div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ width: `${(usedResources.ram / accountLimits.ram) * 100}%` }}
            />
          </div>
        </div>

        <div className={styles.resourceCard}>
          <div className={styles.resourceHeader}>
            <HardDrive />
            <span>Диск</span>
          </div>
          <div className={styles.resourceValue}>{usedResources.storage} / {accountLimits.storage} GB</div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ width: `${(usedResources.storage / accountLimits.storage) * 100}%` }}
            />
          </div>
        </div>

        <div className={styles.resourceCard}>
          <div className={styles.resourceHeader}>
            <Server />
            <span>ВМ</span>
          </div>
          <div className={styles.resourceValue}>{usedResources.vms} / {accountLimits.maxVMs}</div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ width: `${(usedResources.vms / accountLimits.maxVMs) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
