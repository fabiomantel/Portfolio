import { Asset, Currency } from '../types';
import { convertCurrency } from './currencyUtils';

const ALPHA_VANTAGE_API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;
const FINNHUB_API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;

if (!FINNHUB_API_KEY) {
  console.warn('Finnhub API key is not set. Stock price updates will use mock data.');
}

if (!ALPHA_VANTAGE_API_KEY) {
  console.warn('Alpha Vantage API key is not set. Stock search will use mock data.');
}

// Mock data for development when API keys are not available
const MOCK_STOCK_DATA = {
  'AAPL': { price: 175.25, previousClose: 174.50 },
  'GOOGL': { price: 2850.12, previousClose: 2845.30 },
  'MSFT': { price: 335.45, previousClose: 334.80 },
  'AMZN': { price: 3320.75, previousClose: 3315.20 },
  'TSLA': { price: 875.90, previousClose: 870.25 }
};

interface StockQuote {
  symbol: string;
  price: number;
  previousClose: number;
  timestamp: number;
}

interface StockSearchResult {
  symbol: string;
  name: string;
  type: string;
  region: string;
  currency: string;
  exchange: string;
}

/**
 * Search for stocks by keyword
 */
export const searchStocks = async (query: string): Promise<StockSearchResult[]> => {
  if (!query || query.length < 2) return [];

  try {
    // If no API key, return mock data
    if (!ALPHA_VANTAGE_API_KEY) {
      const mockResults = Object.keys(MOCK_STOCK_DATA)
        .filter(symbol => symbol.toLowerCase().includes(query.toLowerCase()))
        .map(symbol => ({
          symbol,
          name: `${symbol} Company`,
          type: 'Common Stock',
          region: 'United States',
          currency: 'USD',
          exchange: 'NASDAQ'
        }));
      return mockResults;
    }

    const response = await fetch(
      `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${query}&apikey=${ALPHA_VANTAGE_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch stock search results');
    }

    const data = await response.json();
    if (!data.bestMatches) return [];

    return data.bestMatches.map((match: any) => ({
      symbol: match['1. symbol'],
      name: match['2. name'],
      type: match['3. type'],
      region: match['4. region'],
      currency: match['8. currency'],
      exchange: match['9. matchScore']
    }));
  } catch (error) {
    console.error('Stock search failed:', error);
    return [];
  }
};

/**
 * Fetch real-time stock quote
 */
export const fetchStockQuote = async (symbol: string): Promise<StockQuote | null> => {
  try {
    console.log(`Fetching quote for ${symbol}...`);
    
    // If no API key, return mock data
    if (!FINNHUB_API_KEY) {
      console.log('No Finnhub API key found, using mock data');
      const mockData = MOCK_STOCK_DATA[symbol as keyof typeof MOCK_STOCK_DATA];
      if (mockData) {
        return {
          symbol,
          price: mockData.price,
          previousClose: mockData.previousClose,
          timestamp: Date.now()
        };
      }
      return null;
    }

    console.log(`Making API request to Finnhub for ${symbol}`);
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
    );

    if (!response.ok) {
      console.error(`Finnhub API error: ${response.status} ${response.statusText}`);
      throw new Error('Failed to fetch stock quote');
    }

    const data = await response.json();
    console.log(`Received data for ${symbol}:`, data);
    
    if (data.c === null || data.c === undefined) {
      console.error(`Invalid price data received for ${symbol}`);
      return null;
    }
    
    return {
      symbol,
      price: data.c,
      previousClose: data.pc,
      timestamp: data.t
    };
  } catch (error) {
    console.error(`Failed to fetch quote for ${symbol}:`, error);
    return null;
  }
};

/**
 * Fetch the latest prices for all assets
 */
export const fetchLatestPrices = async (assets: Asset[]): Promise<Asset[]> => {
  try {
    const updatedAssets = await Promise.all(
      assets.map(async (asset) => {
        const quote = await fetchStockQuote(asset.ticker);
        
        if (quote) {
          return {
            ...asset,
            currentPrice: quote.price,
            previousPrice: quote.previousClose,
            lastUpdated: new Date(quote.timestamp)
          };
        }
        
        // If quote fetch fails, simulate a price change
        const previousPrice = asset.currentPrice;
        const changePercent = (Math.random() * 4) - 2; // -2 to 2
        const newPrice = previousPrice * (1 + changePercent / 100);
        
        return {
          ...asset,
          previousPrice,
          currentPrice: Number(newPrice.toFixed(2)),
          lastUpdated: new Date()
        };
      })
    );

    return updatedAssets;
  } catch (error) {
    console.error('Failed to fetch latest prices:', error);
    return assets;
  }
};

/**
 * Calculate average purchase price for an asset
 */
export const calculateAverageCost = async (
  asset: Asset,
  targetCurrency: Currency
): Promise<number> => {
  if (asset.purchases.length === 0) return 0;
  
  try {
    let totalCost = 0;
    let totalShares = 0;
    
    for (const purchase of asset.purchases) {
      const convertedPrice = await convertCurrency(
        purchase.price,
        purchase.currency,
        targetCurrency
      );
      totalCost += convertedPrice * purchase.quantity;
      totalShares += purchase.quantity;
    }
    
    return totalShares > 0 ? Number((totalCost / totalShares).toFixed(2)) : 0;
  } catch (error) {
    console.error('Failed to calculate average cost:', error);
    return 0;
  }
};

/**
 * Calculate total shares for an asset
 */
export const calculateTotalShares = (asset: Asset): number => {
  return asset.purchases.reduce((total, purchase) => total + purchase.quantity, 0);
};

/**
 * Calculate profit/loss for an asset
 */
export const calculateProfitLoss = async (
  asset: Asset, 
  targetCurrency: Currency
): Promise<{ absolute: number; percentage: number }> => {
  try {
    const totalShares = calculateTotalShares(asset);
    if (totalShares === 0) return { absolute: 0, percentage: 0 };
    
    const avgCost = await calculateAverageCost(asset, targetCurrency);
    const currentValue = await convertCurrency(
      asset.currentPrice,
      asset.tradingCurrency,
      targetCurrency
    );
    
    const absolute = Number(((currentValue - avgCost) * totalShares).toFixed(2));
    const percentage = avgCost > 0 
      ? Number(((currentValue - avgCost) / avgCost * 100).toFixed(2))
      : 0;
    
    return { absolute, percentage };
  } catch (error) {
    console.error('Failed to calculate profit/loss:', error);
    return { absolute: 0, percentage: 0 };
  }
};