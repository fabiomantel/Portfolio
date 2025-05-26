import React, { useEffect } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCurrency } from '../../utils/currencyUtils';
import { PlusCircleIcon, PencilIcon, TrashIcon, RefreshCwIcon } from 'lucide-react';
import { Currency, ESPP } from '../../types';
import { fetchStockQuote } from '../../utils/dataFetching';
import { format } from 'date-fns';

interface EsppTrackerProps {
  onAddEspp: () => void;
  onEditEspp: (espp: ESPP) => void;
}

const EsppTracker: React.FC<EsppTrackerProps> = ({ onAddEspp, onEditEspp }) => {
  const { espps, deleteESPP, isAuthenticated } = usePortfolio();
  
  // Calculate profit for ESPP
  const calculateProfit = (purchasePrice: number, currentPrice: number, quantity: number) => {
    return (currentPrice - purchasePrice) * quantity;
  };

  const handleDelete = async (espp: ESPP) => {
    if (window.confirm('Are you sure you want to delete this ESPP purchase?')) {
      try {
        await deleteESPP(espp.id);
      } catch (error) {
        console.error('Failed to delete ESPP:', error);
      }
    }
  };

  // Format date safely
  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return format(date, 'HH:mm:ss dd/MM/yyyy');
  };

  // Format cycle date (without time)
  const formatCycleDate = (date: Date) => {
    return format(date, 'dd/MM/yyyy');
  };

  // Fetch current stock prices
  const refreshPrices = async () => {
    if (!isAuthenticated) return;

    const updatedEspps = await Promise.all(
      espps.map(async (espp) => {
        const quote = await fetchStockQuote(espp.ticker, espp.exchange);
        if (quote) {
          return {
            ...espp,
            currentPrice: quote.price,
            previousPrice: quote.previousClose,
            lastUpdated: new Date(quote.timestamp)
          };
        }
        return espp;
      })
    );
  };

  // Refresh prices every minute
  useEffect(() => {
    refreshPrices();
    const interval = setInterval(refreshPrices, 60000);
    return () => clearInterval(interval);
  }, [espps, isAuthenticated]);
  
  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">ESPP Tracker</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={refreshPrices}
            className="inline-flex items-center px-2 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Refresh Prices"
          >
            <RefreshCwIcon size={16} />
          </button>
          <button
            onClick={onAddEspp}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors duration-200"
          >
            <PlusCircleIcon size={16} className="mr-1" />
            Add ESPP
          </button>
        </div>
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
            const currentPrice = espp.currentPrice || espp.marketPrice;
            const profit = calculateProfit(espp.purchasePrice, currentPrice, espp.quantity);
            const profitPercentage = (profit / (espp.purchasePrice * espp.quantity)) * 100;
            const priceChange = espp.previousPrice ? currentPrice - espp.previousPrice : 0;
            const priceChangePercent = espp.previousPrice ? (priceChange / espp.previousPrice) * 100 : 0;
            
            return (
              <div
                key={espp.id}
                className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden border border-gray-100 dark:border-slate-700"
              >
                <div className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{espp.companyName}</h3>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {espp.ticker} • Purchase Date: {formatDate(espp.grantDate)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Last updated: {formatDate(espp.lastUpdated)}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onEditEspp(espp)}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        <PencilIcon size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(espp)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <TrashIcon size={16} />
                      </button>
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
                        <p className="text-xs text-gray-500 dark:text-gray-400">Current Price</p>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {formatCurrency(currentPrice, Currency.USD, { isCurrentPrice: true })}
                          </p>
                          {espp.previousPrice && (
                            <p className={`text-xs ${priceChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {priceChange >= 0 ? '+' : ''}{formatCurrency(priceChange, Currency.USD, { isCurrentPrice: true })} ({priceChangePercent.toFixed(2)}%)
                            </p>
                          )}
                        </div>
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
                      <p className={`text-lg font-semibold ${profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
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
                          {formatCycleDate(espp.cycleStartDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-500 dark:text-gray-400">End Date</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {formatCycleDate(espp.cycleEndDate)}
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