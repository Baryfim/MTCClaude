/**
 * Форматирует числа с сокращениями (K, M, B, T)
 * @param num - число для форматирования
 * @param decimals - количество знаков после запятой (по умолчанию 1)
 * @returns отформатированная строка
 */
export function formatNumber(num: number, decimals: number = 1): string {
  if (num < 1000) {
    return num.toString();
  }

  const k = 1000;
  const sizes = ['', 'K', 'M', 'B', 'T'];
  const i = Math.floor(Math.log(num) / Math.log(k));
  
  if (i === 0) return num.toString();
  
  const value = num / Math.pow(k, i);
  
  // Убираем .0 если число целое после округления
  return value % 1 === 0 
    ? `${Math.round(value)}${sizes[i]}`
    : `${value.toFixed(decimals)}${sizes[i]}`;
}
