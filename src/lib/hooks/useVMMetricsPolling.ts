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
export const useVMMetricsPolling = (enabled: boolean = true, interval: number = 10000) => {
  const dispatch = useAppDispatch();
  const activeVMs = useAppSelector(selectActiveVMs);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) {
      // Очистить интервал если опрос отключен
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Функция для получения метрик всех активных VM
    const fetchMetrics = () => {
      // Получить ID всех активных VM (со статусом RUNNING)
      const runningVMIds = activeVMs
        .filter(vm => vm.status === 'running')
        .map(vm => vm.id);

      if (runningVMIds.length > 0) {
        dispatch(fetchAllVMMetricsAsync(runningVMIds));
      }
    };

    // Запустить первый запрос сразу
    fetchMetrics();

    // Установить интервал для периодических запросов
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
      .filter(vm => vm.status === 'running')
      .map(vm => vm.id);

    if (runningVMIds.length > 0) {
      dispatch(fetchAllVMMetricsAsync(runningVMIds));
    }
  };

  return { fetchMetricsManually };
};
