import React from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCurrency } from '../../utils/currencyUtils';
import { PlusCircleIcon } from 'lucide-react';
import { Currency } from '../../types';

interface EsppTrackerProps {
  onAddEspp: () => void;
}

const EsppTracker: React.FC<EsppTrackerProps> = ({ onAddEspp }) => {
  const { espps } = usePortfolio();
  
  // Calculate profit for ESPP
  const calculateProfit = (purchasePrice: number, marketPrice: number, quantity: number) => {
    return (marketPrice - purchasePrice) * quantity;
  };
  
  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">ESPP Tracker</h2>
        <button
          onClick={onAddEspp}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors duration-200"
        >
          <PlusCircleIcon size={16} className="mr-1" />
          Add ESPP
        </button>
      </div>
      
      {espps.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-slate-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-700">
          <p className="text-gray-600 dark:text-gray-400 mb-4">You haven't added any ESPPs yet</p>
          <button
            onClick={onAddEspp}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-teal-700 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/20 hover:bg-teal-200 dark:hover:bg-teal-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors duration-200"
          >
            <PlusCircleIcon size={16} className="mr-2" />
            Add Your First ESPP
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {espps.map(espp => {
            const profit = calculateProfit(espp.purchasePrice, espp.marketPrice, espp.quantity);
            const profitPercentage = (profit / (espp.purchasePrice * espp.quantity)) * 100;
            
            return (
              <div
                key={espp.id}
                className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden border border-gray-100 dark:border-slate-700"
              >
                <div className="p-4">
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{espp.companyName}</h3>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {espp.ticker} • Purchase Date: {new Date(espp.grantDate).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-slate-700/30 rounded-md">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Purchase Price</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(espp.purchasePrice, Currency.USD)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Market Price</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(espp.marketPrice, Currency.USD)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Discount</p>
                        <p className="font-medium text-gray-900 dark:text-white">{espp.discount}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Quantity</p>
                        <p className="font-medium text-gray-900 dark:text-white">{espp.quantity} shares</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Current Profit</p>
                      <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(profit, Currency.USD)} ({profitPercentage.toFixed(2)}%)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Broker</p>
                      <p className="font-medium text-gray-900 dark:text-white">{espp.broker}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Purchase Cycle</h4>
                    <div className="flex justify-between text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Start Date</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {new Date(espp.purchaseCycle.startDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-500 dark:text-gray-400">End Date</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {new Date(espp.purchaseCycle.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EsppTracker;