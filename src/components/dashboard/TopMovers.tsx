import React from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCurrency } from '../../utils/currencyUtils';
import { TrendingUpIcon, TrendingDownIcon } from 'lucide-react';

const TopMovers: React.FC = () => {
  const { assets, selectedCurrency } = usePortfolio();
  
  if (assets.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-slate-700/20 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">No assets to display</p>
      </div>
    );
  }
  
  // Calculate percent change for each asset
  const assetsWithChange = assets.map(asset => {
    const percentChange = asset.previousPrice > 0
      ? ((asset.currentPrice - asset.previousPrice) / asset.previousPrice) * 100
      : 0;
    
    return {
      ...asset,
      percentChange,
      absoluteChange: asset.currentPrice - asset.previousPrice
    };
  });
  
  // Sort by percent change (absolute value, to get biggest movers regardless of direction)
  const sortedAssets = [...assetsWithChange].sort((a, b) => 
    Math.abs(b.percentChange) - Math.abs(a.percentChange)
  );
  
  // Take top 5 movers
  const topMovers = sortedAssets.slice(0, 5);

  return (
    <div>
      <div className="space-y-4">
        {topMovers.map(asset => {
          const isPositive = asset.percentChange >= 0;
          
          return (
            <div key={asset.id} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`flex items-center justify-center h-8 w-8 rounded-full ${
                  isPositive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                } mr-3`}>
                  {isPositive 
                    ? <TrendingUpIcon size={16} className="text-green-600 dark:text-green-400" /> 
                    : <TrendingDownIcon size={16} className="text-red-600 dark:text-red-400" />
                  }
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{asset.ticker}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{asset.name}</p>
                </div>
              </div>
              
              <div className="text-right">
                <p className={`font-medium ${
                  isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {isPositive ? '+' : ''}{asset.percentChange.toFixed(2)}%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatCurrency(asset.absoluteChange, asset.tradingCurrency)}
                </p>
              </div>
            </div>
          );
        })}
        
        {topMovers.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">No price changes yet</p>
        )}
      </div>
    </div>
  );
};

export default TopMovers;