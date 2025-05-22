import { Currency } from '../types';

// Mock exchange rates (in real app, these would come from an API)
const exchangeRates: Record<Currency, Record<Currency, number>> = {
  [Currency.USD]: {
    [Currency.USD]: 1,
    [Currency.ILS]: 3.68,
    [Currency.EUR]: 0.92,
    [Currency.GBP]: 0.79
  },
  [Currency.ILS]: {
    [Currency.USD]: 0.272,
    [Currency.ILS]: 1,
    [Currency.EUR]: 0.25,
    [Currency.GBP]: 0.215
  },
  [Currency.EUR]: {
    [Currency.USD]: 1.09,
    [Currency.ILS]: 4.00,
    [Currency.EUR]: 1,
    [Currency.GBP]: 0.86
  },
  [Currency.GBP]: {
    [Currency.USD]: 1.27,
    [Currency.ILS]: 4.65,
    [Currency.EUR]: 1.16,
    [Currency.GBP]: 1
  }
};

/**
 * Convert amount from one currency to another
 */
export const convertCurrency = (
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): number => {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const rate = exchangeRates[fromCurrency][toCurrency];
  return amount * rate;
};

/**
 * Format currency for display
 */
export const formatCurrency = (
  amount: number,
  currency: Currency
): string => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return formatter.format(amount);
};

/**
 * Get currency symbol for display
 */
export const getCurrencySymbol = (currency: Currency): string => {
  switch (currency) {
    case Currency.USD:
      return '$';
    case Currency.ILS:
      return '₪';
    case Currency.EUR:
      return '€';
    case Currency.GBP:
      return '£';
    default:
      return '$';
  }
};