const normalizeNumber = (value: number | null | undefined): number => {
  if (typeof value !== 'number') return 0;
  if (!Number.isFinite(value)) return 0;
  return value;
};

const hasDecimalPlaces = (value: number): boolean => !Number.isInteger(value);

const createNumberFormatter = (value: number, currency = false): Intl.NumberFormat =>
  new Intl.NumberFormat('pt-BR', {
    ...(currency ? { style: 'currency', currency: 'BRL' } : {}),
    minimumFractionDigits: hasDecimalPlaces(value) ? 2 : 0,
    maximumFractionDigits: 2,
  });

export const formatCurrency = (value: number | null | undefined): string => {
  const normalizedValue = normalizeNumber(value);
  return createNumberFormatter(normalizedValue, true).format(normalizedValue);
};

export const formatDecimal = (value: number | null | undefined): string => {
  const normalizedValue = normalizeNumber(value);
  return createNumberFormatter(normalizedValue).format(normalizedValue);
};

export const formatPercent = (value: number | null | undefined): string => {
  const normalizedValue = normalizeNumber(value);
  const percentValue = normalizedValue <= 1 && normalizedValue >= -1 ? normalizedValue * 100 : normalizedValue;

  return `${createNumberFormatter(percentValue).format(percentValue)}%`;
};
