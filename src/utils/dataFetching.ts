import { Asset, Currency } from '../types';
import { convertCurrency } from './currencyUtils';

// In a real app, this would make API calls to services like Yahoo Finance, Alpha Vantage, etc.
// This is a mock implementation that simulates price changes

/**
 * Fetch the latest prices for all assets
 */
export const fetchLatestPrices = async (assets: Asset[]): Promise<Asset[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return assets.map(asset => {
    const previousPrice = asset.currentPrice;
    
    // Generate a random price change between -2% and +2%
    const changePercent = (Math.random() * 4) - 2; // -2 to 2
    const newPrice = previousPrice * (1 + changePercent / 100);
    
    return {
      ...asset,
      previousPrice,
      currentPrice: Number(newPrice.toFixed(2)),
      lastUpdated: new Date()
    };
  });
};

/**
 * Calculate average purchase price for an asset
 */
export const calculateAverageCost = (asset: Asset, targetCurrency: Currency): number => {
  if (asset.purchases.length === 0) return 0;
  
  let totalCost = 0;
  let totalShares = 0;
  
  asset.purchases.forEach(purchase => {
    const convertedPrice = convertCurrency(purchase.price, purchase.currency, targetCurrency);
    totalCost += convertedPrice * purchase.quantity;
    totalShares += purchase.quantity;
  });
  
  return totalShares > 0 ? totalCost / totalShares : 0;
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
export const calculateProfitLoss = (
  asset: Asset, 
  targetCurrency: Currency
): { absolute: number; percentage: number } => {
  const totalShares = calculateTotalShares(asset);
  if (totalShares === 0) return { absolute: 0, percentage: 0 };
  
  const avgCost = calculateAverageCost(asset, targetCurrency);
  const currentValue = convertCurrency(asset.currentPrice, asset.tradingCurrency, targetCurrency);
  
  const absolute = (currentValue - avgCost) * totalShares;
  const percentage = avgCost > 0 ? ((currentValue - avgCost) / avgCost) * 100 : 0;
  
  return {
    absolute,
    percentage
  };
};