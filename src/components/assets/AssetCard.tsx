import React, { useState, useEffect } from 'react';
import { TrendingUpIcon, TrendingDownIcon, RefreshCwIcon, TrashIcon, EditIcon } from 'lucide-react';
import { Asset, Currency } from '../../types';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCurrency } from '../../utils/currencyUtils';
import { format, subMonths } from 'date-fns';
import { calculateAverageCost, calculateProfitLoss, calculateTotalShares } from '../../utils/dataFetching';
import DeleteConfirmation from '../common/DeleteConfirmation';
import HistoricalChart from '../charts/HistoricalChart';

interface AssetCardProps {
  asset: Asset;
  onEdit: (asset: Asset) => void;
}

const AssetCard: React.FC<AssetCardProps> = ({ asset, onEdit }) => {
  const { selectedCurrency, deleteAsset } = usePortfolio();
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [avgCost, setAvgCost] = useState(0);
  const [profitLoss, setProfitLoss] = useState({ absolute: 0, percentage: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const totalShares = calculateTotalShares(asset);
  const isPositive = profitLoss.absolute >= 0;
  const priceChange = asset.currentPrice - asset.previousPrice;
  const priceChangePercent = asset.previousPrice > 0 
    ? (priceChange / asset.previousPrice) * 100 
    : 0;

  // Calculate total quantity and market value
  const totalQuantity = asset.purchases.reduce((sum, p) => sum + p.quantity, 0);
  const marketValue = totalQuantity * asset.currentPrice;

  // Calculate total cost basis
  const costBasis = asset.purchases.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  
  // Calculate gain/loss
  const gainLoss = marketValue - costBasis;
  const gainLossPercentage = (gainLoss / costBasis) * 100;

  // Format date with time
  const formatDateTime = (date: Date) => {
    return format(date, 'HH:mm:ss dd/MM/yyyy');
  };

  // Format date without time
  const formatDate = (date: Date) => {
    return format(date, 'dd/MM/yyyy');
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const avgCost = await calculateAverageCost(asset, selectedCurrency);
        const pl = await calculateProfitLoss(asset, selectedCurrency);
        setAvgCost(avgCost);
        setProfitLoss(pl);
      } catch (error) {
        console.error('Failed to calculate metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [asset, selectedCurrency]);

  return (
    <>
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
            <div className="flex space-x-2">
              <button
                onClick={() => onEdit(asset)}
                className="p-1.5 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <EditIcon size={16} />
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1.5 rounded-full text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
              >
                <TrashIcon size={16} />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Market Value</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatCurrency(marketValue, asset.tradingCurrency)}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Price</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatCurrency(asset.currentPrice, asset.tradingCurrency)}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Quantity</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {totalQuantity.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Gain/Loss</div>
              <div className={`text-lg font-semibold ${gainLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(gainLoss, asset.tradingCurrency)}
                <span className="text-sm ml-1">
                  ({gainLossPercentage >= 0 ? '+' : ''}{gainLossPercentage.toFixed(2)}%)
                </span>
              </div>
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

              {/* Historical Chart */}
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Price History (6 Months)</h4>
                <HistoricalChart
                  symbol={asset.ticker}
                  exchange={asset.exchange}
                  from={format(subMonths(new Date(), 6), 'yyyy-MM-dd')}
                  to={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
              
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Purchase History</h4>
                <div className="max-h-40 overflow-y-auto">
                  {asset.purchases.map(purchase => (
                    <div 
                      key={purchase.id} 
                      className="flex justify-between py-2 border-t border-gray-100 dark:border-slate-700 text-sm"
                    >
                      <div className="text-gray-500 dark:text-gray-400">
                        {formatDate(purchase.date)}
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
            <span>Updated {formatDateTime(asset.lastUpdated)}</span>
          </div>
          <button 
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
      </div>

      <DeleteConfirmation
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => deleteAsset(asset.id)}
        title="Delete Asset"
        message={`Are you sure you want to delete ${asset.name} (${asset.ticker})? This action cannot be undone.`}
      />
    </>
  );
};

export default AssetCard;