import { Currency } from '../../types';
import { convertCurrency, formatCurrency, getCurrencySymbol, fetchExchangeRates } from '../../utils/currencyUtils';

// Mock fetch for testing
global.fetch = jest.fn();

describe('Currency Utilities', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  describe('fetchExchangeRates', () => {
    it('should fetch and cache exchange rates', async () => {
      const mockRates = {
        rates: {
          USD: 1,
          ILS: 3.65,
          EUR: 0.85
        }
      };

      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockRates)
        })
      );

      const rates = await fetchExchangeRates();
      expect(rates).toEqual(mockRates.rates);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const cachedRates = await fetchExchangeRates();
      expect(cachedRates).toEqual(mockRates.rates);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should return default rates if API fails', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.reject(new Error('API Error'))
      );

      const rates = await fetchExchangeRates();
      expect(rates).toBeDefined();
      expect(rates.USD).toBe(1);
      expect(rates.ILS).toBeDefined();
      expect(rates.EUR).toBeDefined();
    });
  });

  describe('convertCurrency', () => {
    it('should return same amount if currencies are the same', async () => {
      const amount = 100;
      const result = await convertCurrency(amount, Currency.USD, Currency.USD);
      expect(result).toBe(amount);
    });

    it('should convert USD to ILS correctly', async () => {
      const mockRates = {
        rates: {
          USD: 1,
          ILS: 3.65
        }
      };

      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockRates)
        })
      );

      const amount = 100;
      const result = await convertCurrency(amount, Currency.USD, Currency.ILS);
      expect(result).toBe(365); // 100 * 3.65
    });

    it('should handle conversion errors gracefully', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.reject(new Error('API Error'))
      );

      const amount = 100;
      const result = await convertCurrency(amount, Currency.USD, Currency.EUR);
      expect(result).toBe(amount);
    });
  });

  describe('formatCurrency', () => {
    it('should format USD correctly', () => {
      const amount = 1234.56;
      const result = formatCurrency(amount, Currency.USD);
      expect(result).toBe('$1,234.56');
    });

    it('should format ILS correctly', () => {
      const amount = 1234.56;
      const result = formatCurrency(amount, Currency.ILS);
      expect(result).toBe('₪1,234.56');
    });

    it('should handle negative amounts', () => {
      const amount = -1234.56;
      const result = formatCurrency(amount, Currency.USD);
      expect(result).toBe('-$1,234.56');
    });

    it('should handle zero', () => {
      const amount = 0;
      const result = formatCurrency(amount, Currency.USD);
      expect(result).toBe('$0.00');
    });
  });

  describe('getCurrencySymbol', () => {
    it('should return correct symbols for all currencies', () => {
      expect(getCurrencySymbol(Currency.USD)).toBe('$');
      expect(getCurrencySymbol(Currency.ILS)).toBe('₪');
      expect(getCurrencySymbol(Currency.EUR)).toBe('€');
      expect(getCurrencySymbol(Currency.GBP)).toBe('£');
      expect(getCurrencySymbol(Currency.JPY)).toBe('¥');
    });

    it('should return $ for unknown currency', () => {
      expect(getCurrencySymbol('UNKNOWN' as Currency)).toBe('$');
    });
  });
}); 