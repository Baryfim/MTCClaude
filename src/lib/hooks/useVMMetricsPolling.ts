import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { fetchAllVMMetricsAsync } from '../slices/vmMetricsSlice';
import { selectActiveVMs } from '../slices/userVMsSlice';

/**
 * Хук для периодического получения метрик VM
 * Запрашивает метрики для всех активных VM каждые 10 секунд
 * 
 * @param enabled - включить/выключить опрос (по умолчанию true)
 * @param interval - интервал опроса в миллисекундах (по умолчанию 10000 = 10 секунд)
 */
export const useVMMetricsPolling = (enabled: boolean = true, interval: number = 5000) => {
  const dispatch = useAppDispatch();
  const activeVMs = useAppSelector(selectActiveVMs);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) {
      console.log('⏸️ [Метрики] Опрос метрик отключен');
      // Очистить интервал если опрос отключен
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    
    console.log('▶️ [Метрики] Опрос метрик включен (интервал:', interval, 'мс)');

    // Функция для получения метрик всех активных VM
    const fetchMetrics = () => {
      // Получить ID всех активных VM
      const runningVMIds = activeVMs
        .map(vm => vm.id);

      console.log('📊 [Метрики] Запрос метрик для VM:', runningVMIds);
      
      if (runningVMIds.length > 0) {
        dispatch(fetchAllVMMetricsAsync(runningVMIds));
      } else {
        console.log('⚠️ [Метрики] Нет активных VM для запроса метрик');
      }
    };

    // Запустить первый запрос сразу
    console.log('🔄 [Метрики] Первый запрос метрик...');
    fetchMetrics();

    // Установить интервал для периодических запросов
    console.log('⏰ [Метрики] Установлен интервал опроса:', interval, 'мс');
    intervalRef.current = setInterval(fetchMetrics, interval);

    // Cleanup функция
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, interval, activeVMs, dispatch]);

  // Функция для ручного запроса метрик
  const fetchMetricsManually = () => {
    const runningVMIds = activeVMs
      .map(vm => vm.id);

    if (runningVMIds.length > 0) {
      dispatch(fetchAllVMMetricsAsync(runningVMIds));
    }
  };

  return { fetchMetricsManually };
};
