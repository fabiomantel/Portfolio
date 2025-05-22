import React, { useState } from 'react';
import { TrendingUpIcon, TrendingDownIcon, RefreshCwIcon } from 'lucide-react';
import { Asset, Currency } from '../../types';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCurrency } from '../../utils/currencyUtils';
import { calculateAverageCost, calculateProfitLoss, calculateTotalShares } from '../../utils/dataFetching';

interface AssetCardProps {
  asset: Asset;
}

const AssetCard: React.FC<AssetCardProps> = ({ asset }) => {
  const { selectedCurrency } = usePortfolio();
  const [showDetails, setShowDetails] = useState(false);

  const totalShares = calculateTotalShares(asset);
  const avgCost = calculateAverageCost(asset, selectedCurrency);
  const { absolute: profitLoss, percentage: profitLossPercentage } = calculateProfitLoss(asset, selectedCurrency);
  
  const isPositive = profitLoss >= 0;
  const lastUpdatedTime = new Date(asset.lastUpdated).toLocaleTimeString();
  
  // Format the time portion of lastUpdated to display only hours and minutes
  const formattedTime = asset.lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden transition-all duration-200 hover:shadow-lg border border-gray-100 dark:border-slate-700">
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{asset.name}</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <span>{asset.ticker}</span>
              <span>•</span>
              <span>{asset.exchange}</span>
            </div>
          </div>
          <div className={`px-2 py-1 rounded-md text-sm font-medium ${
            isPositive 
              ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' 
              : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
          }`}>
            <div className="flex items-center">
              {isPositive ? <TrendingUpIcon size={14} className="mr-1" /> : <TrendingDownIcon size={14} className="mr-1" />}
              {profitLossPercentage.toFixed(2)}%
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Current Price</p>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">
              {formatCurrency(asset.currentPrice, asset.tradingCurrency)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total P&L</p>
            <p className={`text-xl font-semibold ${
              isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {formatCurrency(profitLoss, selectedCurrency)}
            </p>
          </div>
        </div>
        
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Cost</p>
                <p className="text-base font-medium text-gray-900 dark:text-white">
                  {formatCurrency(avgCost, selectedCurrency)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Shares</p>
                <p className="text-base font-medium text-gray-900 dark:text-white">{totalShares}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Broker</p>
                <p className="text-base font-medium text-gray-900 dark:text-white">{asset.broker}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Value</p>
                <p className="text-base font-medium text-gray-900 dark:text-white">
                  {formatCurrency(totalShares * asset.currentPrice, asset.tradingCurrency)}
                </p>
              </div>
            </div>
            
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Purchase History</h4>
              <div className="max-h-40 overflow-y-auto">
                {asset.purchases.map(purchase => (
                  <div 
                    key={purchase.id} 
                    className="flex justify-between py-2 border-t border-gray-100 dark:border-slate-700 text-sm"
                  >
                    <div className="text-gray-500 dark:text-gray-400">
                      {new Date(purchase.date).toLocaleDateString()}
                    </div>
                    <div className="text-gray-700 dark:text-gray-300">
                      {purchase.quantity} shares @ {formatCurrency(purchase.price, purchase.currency)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="px-4 py-3 bg-gray-50 dark:bg-slate-700/50 flex justify-between items-center">
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
          <RefreshCwIcon size={12} className="mr-1" />
          <span>Updated {formattedTime}</span>
        </div>
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>
    </div>
  );
};

export default AssetCard;