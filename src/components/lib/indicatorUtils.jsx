export const formatCurrency = (value) => {
  if (!value && value !== 0) return 'N/D';
  
  const absValue = Math.abs(value);
  if (absValue >= 1e12) {
    return `R$ ${(value / 1e12).toFixed(2)} T`;
  }
  if (absValue >= 1e9) {
    return `R$ ${(value / 1e9).toFixed(2)} Bi`;
  }
  if (absValue >= 1e6) {
    return `R$ ${(value / 1e6).toFixed(2)} M`;
  }
  if (absValue >= 1e3) {
    return `R$ ${(value / 1e3).toFixed(2)} K`;
  }
  return `R$ ${value.toFixed(2)}`;
};

export const formatPercentage = (value) => {
  if (!value && value !== 0) return 'N/D';
  return `${value.toFixed(2)}%`;
};

export const formatMultiple = (value) => {
  if (!value && value !== 0) return 'N/D';
  return value.toFixed(2);
};

export const formatValue = (value, isPercentage, isCurrency) => {
  if (isCurrency) return formatCurrency(value);
  if (isPercentage) return formatPercentage(value);
  return formatMultiple(value);
};

export const calculateAverage = (values) => {
  const numericValues = values.filter(v => typeof v === 'number' && !isNaN(v));
  if (numericValues.length === 0) return null;
  return numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
};