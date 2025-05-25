import React from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCurrency } from '../../utils/currencyUtils';
import { ArrowUpIcon, ArrowDownIcon, TrendingUpIcon, TrendingDownIcon } from 'lucide-react';
import AllocationChart from './AllocationChart';
import TopMovers from './TopMovers';
import { format } from 'date-fns';

const Dashboard: React.FC = () => {
  const { assets, selectedCurrency, totalValue, isLoading } = usePortfolio();
  
  // Calculate daily change
  const dailyChange = assets.reduce((sum, asset) => {
    const totalShares = asset.purchases.reduce((qty, p) => qty + p.quantity, 0);
    const priceChange = asset.currentPrice - asset.previousPrice;
    return sum + (priceChange * totalShares);
  }, 0);
  
  const dailyChangePercent = totalValue > 0 
    ? (dailyChange / totalValue) * 100 
    : 0;
  
  const isPositive = dailyChange >= 0;

  // Get the most recent update time
  const getLastUpdateTime = () => {
    if (assets.length === 0) return 'No data';
    const lastUpdate = new Date(Math.max(...assets.map(a => new Date(a.lastUpdated).getTime())));
    return format(lastUpdate, 'HH:mm');
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Portfolio Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Total Value */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 border border-gray-100 dark:border-slate-700">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Portfolio Value</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {formatCurrency(totalValue, selectedCurrency)}
          </p>
          <div className={`flex items-center mt-2 text-sm ${
            isPositive 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'
          }`}>
            {isPositive 
              ? <ArrowUpIcon size={16} className="mr-1" /> 
              : <ArrowDownIcon size={16} className="mr-1" />
            }
            <span>
              {formatCurrency(Math.abs(dailyChange), selectedCurrency)} ({Math.abs(dailyChangePercent).toFixed(2)}%)
            </span>
            <span className="text-gray-500 dark:text-gray-400 ml-1">today</span>
          </div>
        </div>
        
        {/* Assets Breakdown */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 border border-gray-100 dark:border-slate-700">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Assets Breakdown</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {assets.length} <span className="text-base font-normal text-gray-500 dark:text-gray-400">assets</span>
          </p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Exchanges</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {new Set(assets.map(a => a.exchange)).size}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Brokers</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {new Set(assets.map(a => a.broker)).size}
              </p>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Latest Prices</p>
            <div className="max-h-20 overflow-y-auto">
              {assets.map(asset => (
                <div key={asset.id} className="flex justify-between items-center text-sm py-1">
                  <span className="text-gray-700 dark:text-gray-300">{asset.ticker}</span>
                  <div className="flex items-center">
                    <span className="text-gray-900 dark:text-white font-medium mr-2">
                      {formatCurrency(asset.currentPrice, asset.tradingCurrency)}
                    </span>
                    <span className={`text-xs ${
                      asset.currentPrice >= asset.previousPrice 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {((asset.currentPrice - asset.previousPrice) / asset.previousPrice * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Last Updated */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 border border-gray-100 dark:border-slate-700">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {isLoading ? (
              <span className="flex items-center">
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-teal-500 mr-2"></span>
                Updating...
              </span>
            ) : getLastUpdateTime()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Auto-refreshes every 60 seconds
          </p>
        </div>
      </div>
      
      {/* Current Prices Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 border border-gray-100 dark:border-slate-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Current Prices</h3>
          <div className="overflow-y-auto max-h-[300px]">
            <table className="min-w-full">
              <thead className="bg-gray-50 dark:bg-slate-700/50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Asset</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Change</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {assets.map(asset => {
                  const totalShares = asset.purchases.reduce((sum, p) => sum + p.quantity, 0);
                  const totalValue = asset.currentPrice * totalShares;
                  const priceChange = asset.currentPrice - asset.previousPrice;
                  const priceChangePercent = asset.previousPrice > 0 
                    ? (priceChange / asset.previousPrice) * 100 
                    : 0;
                  const isAssetPositive = priceChange >= 0;

                  return (
                    <tr key={asset.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{asset.ticker}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{asset.name}</div>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(asset.currentPrice, asset.tradingCurrency, { isCurrentPrice: true })}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        <div className={`flex items-center justify-end ${
                          isAssetPositive 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {isAssetPositive 
                            ? <TrendingUpIcon size={16} className="mr-1" /> 
                            : <TrendingDownIcon size={16} className="mr-1" />
                          }
                          <span>{priceChangePercent.toFixed(2)}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(totalValue, asset.tradingCurrency)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {totalShares} shares
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Allocation Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 border border-gray-100 dark:border-slate-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Asset Allocation</h3>
          <AllocationChart />
        </div>
      </div>
      
      {/* Top Movers */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 border border-gray-100 dark:border-slate-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Top Movers</h3>
        <TopMovers />
      </div>
    </div>
  );
};

export default Dashboard;