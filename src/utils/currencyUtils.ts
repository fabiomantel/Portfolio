import { Currency } from '../types';

// Extend NumberFormatOptions to include our custom option
interface ExtendedFormatOptions extends Intl.NumberFormatOptions {
  isCurrentPrice?: boolean;
}

// Cache exchange rates for 1 hour
const CACHE_DURATION = 60 * 60 * 1000;
let exchangeRatesCache: {
  rates: Record<string, number>;
  timestamp: number;
} | null = null;

// Default rates as fallback
const DEFAULT_RATES: Record<string, number> = {
  USD: 1,
  ILS: 3.65,
  EUR: 0.85,
  GBP: 0.73,
  JPY: 110,
  CHF: 0.92,
  CAD: 1.25,
  AUD: 1.35,
  CNY: 6.45,
  HKD: 7.78,
  SGD: 1.35
};

// Fetch latest exchange rates from the API
export const fetchExchangeRates = async (): Promise<Record<string, number>> => {
  try {
    // Check cache first
    if (exchangeRatesCache && Date.now() - exchangeRatesCache.timestamp < CACHE_DURATION) {
      return exchangeRatesCache.rates;
    }

    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rates: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Validate the response data
    if (!data.rates || typeof data.rates !== 'object') {
      throw new Error('Invalid exchange rates data format');
    }
    
    // Update cache
    exchangeRatesCache = {
      rates: data.rates,
      timestamp: Date.now()
    };
    
    return data.rates;
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);
    // Return default rates if API fails
    return DEFAULT_RATES;
  }
};

/**
 * Convert amount from one currency to another
 */
export const convertCurrency = async (
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): Promise<number> => {
  try {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const rates = await fetchExchangeRates();
    
    // Validate rates exist for both currencies
    if (!rates[fromCurrency] || !rates[toCurrency]) {
      throw new Error(`Missing exchange rate for ${fromCurrency} or ${toCurrency}`);
    }
    
    // Convert to USD first (base currency)
    const amountInUSD = fromCurrency === Currency.USD 
      ? amount 
      : amount / rates[fromCurrency];
    
    // Then convert to target currency
    const convertedAmount = toCurrency === Currency.USD 
      ? amountInUSD 
      : amountInUSD * rates[toCurrency];
    
    // Round to 2 decimal places
    return Number(convertedAmount.toFixed(2));
  } catch (error) {
    console.error('Currency conversion failed:', error);
    // Return original amount if conversion fails
    return amount;
  }
};

/**
 * Format currency for display
 */
export const formatCurrency = (
  amount: number,
  currency: Currency,
  options: ExtendedFormatOptions = {}
): string => {
  try {
    // Always show 2 decimal places for current prices
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...options
    });

    return formatter.format(amount);
  } catch (error) {
    console.error('Currency formatting failed:', error);
    // Fallback formatting
    return `${getCurrencySymbol(currency)}${amount.toFixed(2)}`;
  }
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
    case Currency.JPY:
      return '¥';
    case Currency.CHF:
      return 'CHF';
    case Currency.CAD:
      return 'C$';
    case Currency.AUD:
      return 'A$';
    case Currency.CNY:
      return '¥';
    case Currency.HKD:
      return 'HK$';
    case Currency.SGD:
      return 'S$';
    default:
      return '$';
  }
};