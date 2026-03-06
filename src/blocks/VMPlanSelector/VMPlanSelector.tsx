import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, MemoryStick, HardDrive, Zap, Check, ChevronRight } from 'lucide-react';
import { INSTANCE_TYPES, VMInstance, UserVM } from '../../types';
import { formatNumber } from '../../lib/utils';
import styles from './VMPlanSelector.module.scss';
import { apiRequestWithAuth, enableBackend } from '../../lib/api';

interface VMPlanSelectorProps {
  onSelect: (instance: VMInstance, vmFromServer?: UserVM) => void;
}

interface OSOption {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const OS_OPTIONS: OSOption[] = [
  { id: 'ubuntu', name: 'Ubuntu 22.04 LTS', description: 'Популярная Linux-система для серверов', icon: '🐧' },
  { id: 'debian', name: 'Debian 12', description: 'Стабильная серверная ОС', icon: '🌀' },
  { id: 'centos', name: 'CentOS Stream 9', description: 'Корпоративная Linux-система', icon: '🔷' },
  { id: 'windows', name: 'Windows Server 2022', description: 'Microsoft серверная система', icon: '🪟' },
];

export const VMPlanSelector: React.FC<VMPlanSelectorProps> = ({ onSelect }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedTier, setSelectedTier] = useState<string>('Общего назначения');
  const [selectedPlan, setSelectedPlan] = useState<VMInstance | null>(null);
  const [selectedOS, setSelectedOS] = useState<string | null>(null);
  
  // Custom plan configuration
  const [customCPU, setCustomCPU] = useState<number>(2);
  const [customRAM, setCustomRAM] = useState<number>(2048);
  const [customStorage, setCustomStorage] = useState<number>(40);

  const tiers = Array.from(new Set(INSTANCE_TYPES.map(i => i.tier)));
  const filteredInstances = INSTANCE_TYPES.filter(i => i.tier === selectedTier);

  // Calculate price based on custom configuration
  const calculateCustomPrice = (cpu: number, ram: number, storage: number): number => {
    // Pricing formula: CPU * $0.02 + RAM (GB) * $0.01 + Storage (GB) * $0.001
    const ramGB = ram / 1024;
    return Number((cpu * 0.02 + ramGB * 0.01 + storage * 0.001).toFixed(3));
  };

  const createCustomPlan = (): VMInstance => {
    return {
      id: 'custom',
      name: 'Кастомная конфигурация',
      cpu: customCPU,
      ram: customRAM,
      storage: customStorage,
      pricePerHour: calculateCustomPrice(customCPU, customRAM, customStorage),
      tier: 'Общего назначения'
    };
  };

  const handleSelectPlan = (instance: VMInstance) => {
    setSelectedPlan(instance);
    setStep(2);
  };

  const handleSelectCustomPlan = () => {
    const customPlan = createCustomPlan();
    setSelectedPlan(customPlan);
    setStep(2);
  };

  const handleSelectOS = async (osId: string) => {
    setSelectedOS(osId);
  };

  const handleCreateVM = async () => {
    if (!selectedPlan || !selectedOS) return;

    const selectedOSOption = OS_OPTIONS.find(os => os.id === selectedOS);
    let createdVM: UserVM | undefined;

    if (enableBackend) {
      try {
        createdVM = await apiRequestWithAuth<UserVM>(
          'POST',
          '/v1/resources/',
          {
            resource_name: "dorowu123",
            image: "dorowu:lxde",
            cpu_cores: selectedPlan.cpu,
            ram_mb: selectedPlan.ram,
            storage: selectedPlan.storage,
            price_per_hour: selectedPlan.pricePerHour
          }
        );
      } catch (error) {
        console.error('Ошибка при создании VM:', error);
        return;
      }
    }

    onSelect(selectedPlan, createdVM);
  };

  const handleBackToPlans = () => {
    setStep(1);
    setSelectedOS(null);
  };

  return (
    <div className={styles.container}>
      {/* Logo */}
      <div className={styles.logoSection}>
        <div className={styles.logo}>
          <div className={styles.logoCircle}>МТС</div>
          <span className={styles.logoText}>Облачко</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className={styles.progressBar}>
        <div className={styles.progressSteps}>
          <div className={`${styles.progressStep} ${step >= 1 ? styles.active : ''} ${step > 1 ? styles.completed : ''}`}>
            <div className={styles.stepNumber}>1</div>
            <div className={styles.stepLabel}>Выбор тарифа</div>
          </div>
          <div className={styles.progressLine}>
            <div className={`${styles.progressLineFill} ${step >= 2 ? styles.filled : ''}`} />
          </div>
          <div className={`${styles.progressStep} ${step === 2 ? styles.active : ''}`}>
            <div className={styles.stepNumber}>2</div>
            <div className={styles.stepLabel}>Выбор ОС</div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className={styles.header}>
              <h1>Выберите конфигурацию ВМ</h1>
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

            <div className={styles.plansList}>
              {filteredInstances.map((instance) => (
                <motion.div
                  key={instance.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`${styles.planItem} ${selectedPlan?.id === instance.id ? styles.selected : ''}`}
                  onClick={() => handleSelectPlan(instance)}
                >
                  <div className={styles.planInfo}>
                    <div className={styles.planMainInfo}>
                      <h3>{instance.name}</h3>
                      <div className={styles.specs}>
                        <div className={styles.spec}>
                          <Cpu />
                          <span>{formatNumber(instance.cpu)} vCPU</span>
                        </div>
                        <div className={styles.spec}>
                          <MemoryStick />
                          <span>{formatNumber(instance.ram)} МБ RAM</span>
                        </div>
                        <div className={styles.spec}>
                          <HardDrive />
                          <span>{formatNumber(instance.storage)} ГБ</span>
                        </div>
                      </div>
                    </div>
                    <div className={styles.planPricing}>
                      <div className={styles.price}>
                        <span className={styles.amount}>${instance.pricePerHour}</span>
                        <span className={styles.period}>/час</span>
                      </div>
                      <div className={styles.monthlyCost}>
                        ~${(instance.pricePerHour * 730).toFixed(2)}/месяц
                      </div>
                    </div>
                    <div className={styles.selectArrow}>
                      <ChevronRight />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Custom Plan Section - Always visible at the bottom */}            <div className={styles.customSectionDivider}>
              <span>или создайте свою конфигурацию</span>
            </div>
            <div className={styles.customPlanContainer}>
                <div className={styles.customPlanCard}>
                  <h2>Настройте свою конфигурацию</h2>
                  <p className={styles.customPlanDescription}>
                    Используйте ползунки для выбора необходимых ресурсов
                  </p>

                  <div className={styles.sliderGroup}>
                    <div className={styles.sliderLabel}>
                      <div className={styles.sliderLabelHeader}>
                        <Cpu className={styles.sliderIcon} />
                        <span className={styles.sliderTitle}>vCPU</span>
                      </div>
                      <span className={styles.sliderValue}>{customCPU} ядер</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="16"
                      step="1"
                      value={customCPU}
                      onChange={(e) => setCustomCPU(Number(e.target.value))}
                      className={styles.slider}
                    />
                    <div className={styles.sliderTicks}>
                      <span>1</span>
                      <span>4</span>
                      <span>8</span>
                      <span>12</span>
                      <span>16</span>
                    </div>
                  </div>

                  <div className={styles.sliderGroup}>
                    <div className={styles.sliderLabel}>
                      <div className={styles.sliderLabelHeader}>
                        <MemoryStick className={styles.sliderIcon} />
                        <span className={styles.sliderTitle}>RAM</span>
                      </div>
                      <span className={styles.sliderValue}>{customRAM >= 1024 ? `${(customRAM / 1024).toFixed(1)} ГБ` : `${customRAM} МБ`}</span>
                    </div>
                    <input
                      type="range"
                      min="512"
                      max="65536"
                      step="512"
                      value={customRAM}
                      onChange={(e) => setCustomRAM(Number(e.target.value))}
                      className={styles.slider}
                    />
                    <div className={styles.sliderTicks}>
                      <span>512 МБ</span>
                      <span>8 ГБ</span>
                      <span>16 ГБ</span>
                      <span>32 ГБ</span>
                      <span>64 ГБ</span>
                    </div>
                  </div>

                  <div className={styles.sliderGroup}>
                    <div className={styles.sliderLabel}>
                      <div className={styles.sliderLabelHeader}>
                        <HardDrive className={styles.sliderIcon} />
                        <span className={styles.sliderTitle}>Storage</span>
                      </div>
                      <span className={styles.sliderValue}>{customStorage} ГБ</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="1000"
                      step="10"
                      value={customStorage}
                      onChange={(e) => setCustomStorage(Number(e.target.value))}
                      className={styles.slider}
                    />
                    <div className={styles.sliderTicks}>
                      <span>20</span>
                      <span>250</span>
                      <span>500</span>
                      <span>750</span>
                      <span>1000</span>
                    </div>
                  </div>

                  <div className={styles.customPricingCard}>
                    <div className={styles.pricingBreakdown}>
                      <div className={styles.pricingItem}>
                        <span>CPU ({customCPU} ядер)</span>
                        <span>${(customCPU * 0.02).toFixed(3)}/час</span>
                      </div>
                      <div className={styles.pricingItem}>
                        <span>RAM ({(customRAM / 1024).toFixed(1)} ГБ)</span>
                        <span>${((customRAM / 1024) * 0.01).toFixed(3)}/час</span>
                      </div>
                      <div className={styles.pricingItem}>
                        <span>Storage ({customStorage} ГБ)</span>
                        <span>${(customStorage * 0.001).toFixed(3)}/час</span>
                      </div>
                      <div className={styles.pricingDivider}></div>
                      <div className={styles.pricingTotal}>
                        <span>Итого</span>
                        <div className={styles.totalPriceGroup}>
                          <span className={styles.totalPrice}>${calculateCustomPrice(customCPU, customRAM, customStorage)}/час</span>
                          <span className={styles.totalPriceMonthly}>~${(calculateCustomPrice(customCPU, customRAM, customStorage) * 730).toFixed(2)}/месяц</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSelectCustomPlan}
                    className={styles.selectCustomButton}
                  >
                    <span>Продолжить с этой конфигурацией</span>
                    <ChevronRight />
                  </button>
                </div>
              </div>
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <div className={styles.header}>
              <h1>Выберите операционную систему</h1>
            </div>

            <div className={styles.osList}>
              {OS_OPTIONS.map((os) => (
                <motion.div
                  key={os.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`${styles.osItem} ${selectedOS === os.id ? styles.selected : ''}`}
                  onClick={() => handleSelectOS(os.id)}
                >
                  <div className={styles.osIcon}>{os.icon}</div>
                  <div className={styles.osInfo}>
                    <h3>{os.name}</h3>
                    <p>{os.description}</p>
                  </div>
                  {selectedOS === os.id && (
                    <div className={styles.checkIcon}>
                      <Check />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            <div className={styles.actionButtons}>
              <button onClick={handleBackToPlans} className={styles.backButton}>
                Назад к тарифам
              </button>
              <button
                onClick={handleCreateVM}
                disabled={!selectedOS}
                className={styles.createButton}
              >
                Создать ВМ
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
