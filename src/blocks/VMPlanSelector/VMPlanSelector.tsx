import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, MemoryStick, HardDrive, Zap, Check } from 'lucide-react';
import { INSTANCE_TYPES, VMInstance } from '../../types';
import styles from './VMPlanSelector.module.scss';
import axios from 'axios';

interface VMPlanSelectorProps {
  onSelect: (instance: VMInstance) => void;
}

export const VMPlanSelector: React.FC<VMPlanSelectorProps> = ({ onSelect }) => {
  const [selectedTier, setSelectedTier] = useState<string>('Общего назначения');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const apiUrl = import.meta.env.DB_HOST
  const tiers = Array.from(new Set(INSTANCE_TYPES.map(i => i.tier)));
  const filteredInstances = INSTANCE_TYPES.filter(i => i.tier === selectedTier);

  const handleSelectPlan = async (instance: VMInstance) => {

    const requestData = {
      "name": instance.name,
      "image": "standart unix OS",
      "cpu_cores": instance.cpu,
      "ram_mb": instance.ram,
      "storage": instance.storage,
      "price_per_hour": instance.pricePerHour
    };

    const response = await axios.post(`${apiUrl}/api/auth`, requestData)

    // Успешный ответ
    if (response.data.token) {
      setSelectedPlan(instance.id);
      onSelect(instance);
    } 

  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Выберите конфигурацию ВМ</h1>
        <p>Начните работу с выбора подходящего плана для вашей виртуальной машины</p>
      </div>

      <div className={styles.tierTabs}>
        {tiers.map((tier) => (
          <button
            key={tier}
            onClick={() => setSelectedTier(tier)}
            className={`${styles.tierTab} ${selectedTier === tier ? styles.active : ''}`}
          >
            {tier}
          </button>
        ))}
      </div>

      <div className={styles.plansGrid}>
        {filteredInstances.map((instance) => (
          <motion.div
            key={instance.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`${styles.planCard} ${selectedPlan === instance.id ? styles.selected : ''}`}
            onClick={() => handleSelectPlan(instance)}
          >
            {selectedPlan === instance.id && (
              <div className={styles.selectedBadge}>
                <Check />
                <span>Выбрано</span>
              </div>
            )}

            <div className={styles.planHeader}>
              <h3>{instance.name}</h3>
              <div className={styles.price}>
                <span className={styles.amount}>${instance.pricePerHour}</span>
                <span className={styles.period}>/час</span>
              </div>
            </div>

            <div className={styles.specs}>
              <div className={styles.spec}>
                <Cpu />
                <div>
                  <span className={styles.value}>{instance.cpu}</span>
                  <span className={styles.label}>vCPU</span>
                </div>
              </div>

              <div className={styles.spec}>
                <MemoryStick />
                <div>
                  <span className={styles.value}>{instance.ram} ГБ</span>
                  <span className={styles.label}>RAM</span>
                </div>
              </div>

              <div className={styles.spec}>
                <HardDrive />
                <div>
                  <span className={styles.value}>{instance.storage} ГБ</span>
                  <span className={styles.label}>Хранилище</span>
                </div>
              </div>
            </div>

            <div className={styles.estimatedCost}>
              <Zap />
              <div>
                <span className={styles.costLabel}>Приблизительно</span>
                <span className={styles.costValue}>~${(instance.pricePerHour * 730).toFixed(2)}/месяц</span>
              </div>
            </div>

            <button className={styles.selectButton}>
              {selectedPlan === instance.id ? 'Создать ВМ' : 'Выбрать план'}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
