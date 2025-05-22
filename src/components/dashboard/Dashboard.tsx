import React from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCurrency } from '../../utils/currencyUtils';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';
import AllocationChart from './AllocationChart';
import TopMovers from './TopMovers';

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
        </div>
        
        {/* Performance */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 border border-gray-100 dark:border-slate-700">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {isLoading ? (
              <span className="flex items-center">
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-teal-500 mr-2"></span>
                Updating...
              </span>
            ) : (
              assets.length > 0 
                ? new Date(Math.max(...assets.map(a => new Date(a.lastUpdated).getTime()))).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'No data'
            )}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Auto-refreshes every 60 seconds
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Allocation Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 border border-gray-100 dark:border-slate-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Asset Allocation</h3>
          <AllocationChart />
        </div>
        
        {/* Top Movers */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4 border border-gray-100 dark:border-slate-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Top Movers</h3>
          <TopMovers />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;