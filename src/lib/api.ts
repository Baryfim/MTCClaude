import axios, { AxiosRequestConfig } from 'axios';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const enableBackend = import.meta.env.VITE_ENABLE_BACKEND === '1';

/**
 * Получить cookie по имени
 */
export const getCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
};

/**
 * Утилита для красивого логирования API запросов
 */
const logAPIRequest = (method: string, endpoint: string, data?: any, hasAuth?: boolean) => {
  const methodColors: Record<string, string> = {
    GET: '#61AFFE',
    POST: '#49CC90',
    PUT: '#FCA130',
    PATCH: '#50E3C2',
    DELETE: '#F93E3E',
  };
  
  const color = methodColors[method] || '#999';
  const authBadge = hasAuth ? '🔐' : '🔓';
  
  console.groupCollapsed(
    `%c${authBadge} ${method}%c ${endpoint}`,
    `background: ${color}; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold;`,
    'color: #666; font-weight: normal;'
  );
  
  console.log('📤 URL:', `${apiUrl}${endpoint}`);
  console.log('⏰ Время:', new Date().toLocaleTimeString('ru-RU'));
  
  if (data) {
    console.log('📦 Данные:', data);
  }
  
  console.groupEnd();
};

/**
 * Утилита для логирования ответа от сервера
 */
const logAPIResponse = (method: string, endpoint: string, response: any, duration: number) => {
  console.groupCollapsed(
    `%c✓ ${method}%c ${endpoint} %c${duration}ms`,
    'background: #49CC90; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
    'color: #666;',
    'color: #49CC90; font-weight: bold;'
  );
  
  console.log('✅ Статус: Успешно');
  console.log('📥 Ответ:', response);
  
  console.groupEnd();
};

/**
 * Утилита для логирования ошибок API
 */
const logAPIError = (method: string, endpoint: string, error: any, duration: number) => {
  console.groupCollapsed(
    `%c✗ ${method}%c ${endpoint} %c${duration}ms`,
    'background: #F93E3E; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
    'color: #666;',
    'color: #F93E3E; font-weight: bold;'
  );
  
  console.log('❌ Статус:', error.response?.status || 'Network Error');
  console.log('💬 Сообщение:', error.response?.data?.message || error.message);
  
  if (error.response?.data) {
    console.log('📥 Данные ошибки:', error.response.data);
  }
  
  console.groupEnd();
};

/**
 * Централизованная функция для отправки API запросов
 * @param method - HTTP метод (GET, POST, PUT, PATCH, DELETE)
 * @param endpoint - endpoint API (например, '/v1/resources/')
 * @param data - тело запроса (для POST, PUT, PATCH)
 * @param additionalHeaders - дополнительные заголовки (например, Authorization)
 * @returns Promise с данными ответа
 */
export async function apiRequest<T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  data?: any,
  additionalHeaders?: Record<string, string>
): Promise<T> {
  const startTime = performance.now();
  const hasAuth = !!additionalHeaders?.Authorization;
  
  // Логирование запроса
  logAPIRequest(method, endpoint, data, hasAuth);
  
  const config: AxiosRequestConfig = {
    method,
    url: `${apiUrl}${endpoint}`,
    headers: {
      'Content-Type': 'application/json', // ОБЯЗАТЕЛЬНО
      ...additionalHeaders,
    },
  };

  // Добавляем данные только для методов, которые поддерживают body
  if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
    config.data = data;
  }

  try {
    const response = await axios(config);
    const duration = Math.round(performance.now() - startTime);
    
    // Логирование успешного ответа
    logAPIResponse(method, endpoint, response.data, duration);
    
    return response.data;
  } catch (error: any) {
    const duration = Math.round(performance.now() - startTime);
    
    // Логирование ошибки
    logAPIError(method, endpoint, error, duration);
    
    throw error;
  }
}

/**
 * API запрос с автоматической авторизацией (Bearer token из cookie)
 * @param method - HTTP метод
 * @param endpoint - endpoint API
 * @param data - тело запроса
 * @param additionalHeaders - дополнительные заголовки
 * @returns Promise с данными ответа
 */
export async function apiRequestWithAuth<T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  data?: any,
  additionalHeaders?: Record<string, string>
): Promise<T> {
  const token = getCookie('access_token');
  const headers: Record<string, string> = {
    ...additionalHeaders,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return apiRequest<T>(method, endpoint, data, headers);
}
