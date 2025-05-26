import { Asset, Currency } from '../types';
import { convertCurrency } from './currencyUtils';
import axios from 'axios';

const ALPHA_VANTAGE_API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;

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
  high?: number;
  low?: number;
  open?: number;
  volume?: number;
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
 * Format ticker symbol for Yahoo Finance API
 */
const formatYahooSymbol = (symbol: string, exchange?: string): string => {
  if (!exchange) return symbol;
  
  // Remove any existing exchange prefixes if present
  const cleanSymbol = symbol.replace(/^(LSE:|TASE:|LON:|M|TLV:|NASDAQ:)/, '')
                           // Replace dots with dashes for TASE symbols
                           .replace(/\./g, '-');
  
  switch (exchange) {
    case 'LSE':
      return `${cleanSymbol}.L`;
    case 'TASE':
      // For TASE securities, use the format: SYMBOL-XXXXX.TA
      return `${cleanSymbol}.TA`;
    case 'NASDAQ':
      // For NASDAQ stocks, no special formatting needed
      return cleanSymbol;
    default:
      return cleanSymbol;
  }
};

/**
 * Format ticker symbol with exchange prefix if needed
 */
const formatTickerSymbol = (symbol: string, exchange?: string): string => {
  if (!exchange) return symbol;
  
  switch (exchange) {
    case 'LSE':
      return `LON:${symbol}`; // LSE stocks use LON: prefix
    default:
      return symbol;
  }
};

/**
 * Fetch stock quote from Yahoo Finance API
 */
export const fetchYahooStockQuote = async (symbol: string, exchange?: string): Promise<StockQuote | null> => {
  try {
    const formattedSymbol = formatYahooSymbol(symbol, exchange);
    console.log(`Fetching Yahoo Finance quote for ${formattedSymbol}...`);
    
    // Use cors-proxy.io as a CORS proxy
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${formattedSymbol}?interval=1d&range=1d`;
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(yahooUrl)}`;
    
    console.log(`Making Yahoo Finance API request through proxy: ${proxyUrl}`);
    
    const response = await axios.get(proxyUrl);
    console.log('Yahoo Finance API response:', JSON.stringify(response.data, null, 2));
    
    if (response.data?.chart?.result?.[0]) {
      const result = response.data.chart.result[0];
      const meta = result.meta;
      const timestamp = meta.regularMarketTime * 1000;
      
      // Convert TASE prices from agorot to shekels
      let price = meta.regularMarketPrice;
      let previousClose = meta.chartPreviousClose;
      
      if (exchange === 'TASE') {
        console.log(`Converting TASE price for ${symbol} from agorot to shekels`);
        console.log(`Original price: ${price} agorot`);
        price = price / 100;
        previousClose = previousClose / 100;
        console.log(`Converted price: ${price} shekels`);
      }
      
      const stockQuote = {
        symbol,
        price,
        previousClose,
        timestamp,
        high: meta.regularMarketDayHigh && exchange === 'TASE' ? meta.regularMarketDayHigh / 100 : meta.regularMarketDayHigh,
        low: meta.regularMarketDayLow && exchange === 'TASE' ? meta.regularMarketDayLow / 100 : meta.regularMarketDayLow,
        open: meta.regularMarketOpen && exchange === 'TASE' ? meta.regularMarketOpen / 100 : (meta.regularMarketOpen || price),
        volume: meta.regularMarketVolume
      };
      
      console.log('Parsed stock quote:', stockQuote);
      return stockQuote;
    }
    
    console.log('No data returned from Yahoo Finance');
    return null;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Yahoo Finance API error:', {
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url
      });
    } else {
      console.error('Yahoo Finance API error:', error);
    }
    throw new Error('Failed to fetch stock quote');
  }
};

/**
 * Fetch real-time stock quote
 */
export const fetchStockQuote = async (symbol: string, exchange?: string): Promise<StockQuote | null> => {
  try {
    // Use Yahoo Finance for LSE, TASE, and NASDAQ stocks
    if (exchange === 'LSE' || exchange === 'TASE' || exchange === 'NASDAQ' || exchange === 'NYSE' || !exchange) {
      return await fetchYahooStockQuote(symbol, exchange);
    }
    
    // Fall back to mock data for unsupported exchanges
    console.log('Exchange not supported, using mock data');
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
  } catch (error) {
    console.error('Stock quote fetch error:', error);
    throw new Error('Failed to fetch stock quote');
  }
};

/**
 * Fetch historical stock data from Yahoo Finance
 */
export const fetchHistoricalData = async (
  symbol: string,
  exchange?: string,
  from?: string,
  to?: string
): Promise<any> => {
  try {
    const formattedSymbol = formatYahooSymbol(symbol, exchange);
    console.log(`Fetching Yahoo Finance historical data for ${formattedSymbol}...`);
    
    const range = from ? `range=${from}` : 'range=6mo';
    const interval = '1d';
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${formattedSymbol}?interval=${interval}&${range}`;
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(yahooUrl)}`;
    
    const response = await axios.get(proxyUrl);
    console.log('Yahoo Finance historical data response:', JSON.stringify(response.data, null, 2));
    
    if (response.data?.chart?.result?.[0]) {
      const result = response.data.chart.result[0];
      const timestamps = result.timestamp;
      const quote = result.indicators.quote[0];
      const adjClose = result.indicators.adjclose?.[0]?.adjclose || quote.close;
      
      return timestamps.map((timestamp: number, index: number) => ({
        date: new Date(timestamp * 1000),
        open: quote.open?.[index] || null,
        high: quote.high?.[index] || null,
        low: quote.low?.[index] || null,
        close: quote.close?.[index] || null,
        adjustedClose: adjClose?.[index] || null,
        volume: quote.volume?.[index] || 0
      })).filter((item: any) => item.close !== null);
    }
    
    console.log('No historical data returned from Yahoo Finance');
    return null;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Yahoo Finance API error:', {
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url
      });
    } else {
      console.error('Yahoo Finance API error:', error);
    }
    throw new Error('Failed to fetch historical data');
  }
};

/**
 * Fetch the latest prices for all assets
 */
export const fetchLatestPrices = async (assets: Asset[]): Promise<Asset[]> => {
  try {
    const updatedAssets = await Promise.all(
      assets.map(async (asset) => {
        const quote = await fetchStockQuote(asset.ticker, asset.exchange);
        
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