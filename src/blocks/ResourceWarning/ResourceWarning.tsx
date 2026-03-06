import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, TrendingUp, Cpu, Activity, HardDrive, X, ArrowRight } from 'lucide-react';
import { VMInstance, INSTANCE_TYPES } from '../../types';
import styles from './ResourceWarning.module.scss';

interface ResourceWarningProps {
  isOpen: boolean;
  onClose: () => void;
  vmName: string;
  currentPlan: VMInstance;
  resourceType: 'cpu' | 'ram' | 'disk';
  currentUsage: number;
  onUpgrade: (newPlan: VMInstance) => void;
}

export const ResourceWarning: React.FC<ResourceWarningProps> = ({
  isOpen,
  onClose,
  vmName,
  currentPlan,
  resourceType,
  currentUsage,
  onUpgrade
}) => {
  const resourceLabels = {
    cpu: 'CPU',
    ram: 'RAM',
    disk: 'Диск'
  };

  const resourceIcons = {
    cpu: Cpu,
    ram: Activity,
    disk: HardDrive
  };

  const Icon = resourceIcons[resourceType];

  // Найти план получше
  const suggestedPlans = INSTANCE_TYPES.filter(plan => {
    if (resourceType === 'cpu') return plan.cpu > currentPlan.cpu;
    if (resourceType === 'ram') return plan.ram > currentPlan.ram;
    if (resourceType === 'disk') return plan.storage > currentPlan.storage;
    return false;
  })
  .sort((a, b) => a.pricePerHour - b.pricePerHour)
  .slice(0, 3);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.overlay}
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className={styles.modal}
          >
            <button onClick={onClose} className={styles.closeButton}>
              <X />
            </button>

            <div className={styles.header}>
              <div className={styles.warningIcon}>
                <AlertTriangle />
              </div>
              <h2>Высокое потребление ресурсов</h2>
              <p className={styles.subtitle}>
                {vmName} использует {currentUsage.toFixed(1)}% доступного ресурса {resourceLabels[resourceType]}
              </p>
            </div>

            <div className={styles.currentUsage}>
              <div className={styles.usageCard}>
                <Icon className={styles.resourceIcon} />
                <div className={styles.usageDetails}>
                  <span className={styles.resourceName}>{resourceLabels[resourceType]}</span>
                  <div className={styles.usageBar}>
                    <div 
                      className={styles.usageBarFill}
                      style={{ 
                        width: `${currentUsage}%`,
                        background: currentUsage > 90 
                          ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                          : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
                      }}
                    />
                  </div>
                  <span className={styles.usagePercent}>{currentUsage.toFixed(1)}%</span>
                </div>
              </div>

              <div className={styles.warningMessage}>
                <AlertTriangle className={styles.warningMessageIcon} />
                <div>
                  <h4>Производительность может снизиться</h4>
                  <p>
                    При столь высоком использовании ресурсов ваши приложения могут работать медленнее. 
                    Рекомендуем обновить план для стабильной работы.
                  </p>
                </div>
              </div>
            </div>

            {suggestedPlans.length > 0 && (
              <div className={styles.suggestions}>
                <div className={styles.suggestionsHeader}>
                  <TrendingUp />
                  <h3>Рекомендуемые планы</h3>
                </div>

                <div className={styles.plansList}>
                  {suggestedPlans.map(plan => {
                    const improvement = resourceType === 'cpu' 
                      ? ((plan.cpu - currentPlan.cpu) / currentPlan.cpu) * 100
                      : resourceType === 'ram'
                      ? ((plan.ram - currentPlan.ram) / currentPlan.ram) * 100
                      : ((plan.storage - currentPlan.storage) / currentPlan.storage) * 100;

                    return (
                      <div key={plan.id} className={styles.planCard}>
                        <div className={styles.planInfo}>
                          <h4>{plan.name}</h4>
                          <div className={styles.planSpecs}>
                            <span><Cpu className="w-4 h-4" /> {plan.cpu} vCPU</span>
                            <span><Activity className="w-4 h-4" /> {plan.ram} MB</span>
                            <span><HardDrive className="w-4 h-4" /> {plan.storage} GB</span>
                          </div>
                          <div className={styles.improvement}>
                            +{improvement.toFixed(0)}% {resourceLabels[resourceType]}
                          </div>
                        </div>
                        <div className={styles.planPrice}>
                          <span className={styles.price}>${plan.pricePerHour.toFixed(3)}/час</span>
                          <button 
                            onClick={() => onUpgrade(plan)}
                            className={styles.upgradeButton}
                          >
                            Обновить
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className={styles.footer}>
              <button onClick={onClose} className={styles.dismissButton}>
                Напомнить позже
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
