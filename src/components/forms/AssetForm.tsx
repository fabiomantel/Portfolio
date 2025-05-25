import React, { useState, useEffect } from 'react';
import { XIcon, PlusIcon, SearchIcon } from 'lucide-react';
import { Asset, Exchange, Currency, Purchase } from '../../types';
import { usePortfolio } from '../../context/PortfolioContext';
import AuthForm from '../auth/AuthForm';
import { searchStocks, fetchStockQuote } from '../../utils/dataFetching';
import { formatCurrency } from '../../utils/currencyUtils';

interface AssetFormProps {
  onClose: () => void;
  asset?: Asset;
  mode?: 'create' | 'edit';
}

const AssetForm: React.FC<AssetFormProps> = ({ onClose, asset, mode = 'create' }) => {
  const { addAsset, updateAsset, isAuthenticated } = usePortfolio();
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  
  const [name, setName] = useState(asset?.name || '');
  const [ticker, setTicker] = useState(asset?.ticker || '');
  const [exchange, setExchange] = useState<Exchange>(asset?.exchange || Exchange.NYSE);
  const [tradingCurrency, setTradingCurrency] = useState<Currency>(asset?.tradingCurrency || Currency.USD);
  const [broker, setBroker] = useState(asset?.broker || '');
  const [purchases, setPurchases] = useState<Omit<Purchase, 'id'>[]>(
    asset?.purchases.map(p => ({
      price: p.price,
      quantity: p.quantity,
      date: p.date,
      currency: p.currency
    })) || [
      {
        price: 0,
        quantity: 0,
        date: new Date(),
        currency: Currency.USD
      }
    ]
  );

  // Debounced ticker search
  useEffect(() => {
    if (!ticker || ticker.length < 2 || mode === 'edit') return;
    
    const searchTimer = setTimeout(async () => {
      setIsSearching(true);
      setError(null);
      
      try {
        // Search for stock details
        const results = await searchStocks(ticker);
        if (results.length > 0) {
          const stockInfo = results[0];
          setName(stockInfo.name);
          setExchange(mapExchangeToEnum(stockInfo.exchange));
          setTradingCurrency(stockInfo.currency as Currency);
          
          // Fetch current price
          const quote = await fetchStockQuote(stockInfo.symbol);
          if (quote) {
            setCurrentPrice(quote.price);
          }
        }
      } catch (err) {
        console.error('Failed to fetch stock details:', err);
        setError('Failed to fetch stock details. Please enter manually.');
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(searchTimer);
  }, [ticker, mode]);

  // Map exchange string to Exchange enum
  const mapExchangeToEnum = (exchangeStr: string): Exchange => {
    const exchangeMap: { [key: string]: Exchange } = {
      'NASDAQ': Exchange.NASDAQ,
      'NYSE': Exchange.NYSE,
      'LSE': Exchange.LSE,
      'TSE': Exchange.TSE,
      'TASE': Exchange.TASE
    };
    return exchangeMap[exchangeStr] || Exchange.NYSE;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!isAuthenticated) {
      setError('Please sign in to manage assets');
      return;
    }
    
    try {
      // Create purchases with proper date objects
      const formattedPurchases = purchases.map(purchase => ({
        ...purchase,
        price: Number(purchase.price),
        quantity: Number(purchase.quantity),
        date: new Date(purchase.date)
      }));
      
      const assetData = {
        name,
        ticker,
        exchange,
        tradingCurrency,
        broker,
        purchases: formattedPurchases as Purchase[]
      };

      if (mode === 'edit' && asset) {
        await updateAsset(asset.id, assetData);
      } else {
        await addAsset(assetData);
      }
      
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save asset');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {mode === 'edit' ? 'Edit Asset' : 'Add New Asset'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <XIcon size={20} />
          </button>
        </div>

        {!isAuthenticated ? (
          <div className="p-4">
            <AuthForm />
          </div>
        ) : (
          <>
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/30">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="relative">
                  <label htmlFor="ticker" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ticker Symbol
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="ticker"
                      value={ticker}
                      onChange={(e) => setTicker(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-700 dark:text-white"
                      placeholder="e.g. AAPL"
                      required
                      disabled={mode === 'edit'}
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-teal-500 border-t-transparent"></div>
                      </div>
                    )}
                  </div>
                  {currentPrice && (
                    <div className="absolute right-0 top-0 mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Current Price: {formatCurrency(currentPrice, tradingCurrency)}
                    </div>
                  )}
                </div>
                
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Asset Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-700 dark:text-white"
                    placeholder="e.g. Apple Inc."
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="exchange" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Exchange
                  </label>
                  <select
                    id="exchange"
                    value={exchange}
                    onChange={(e) => setExchange(e.target.value as Exchange)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-700 dark:text-white"
                    required
                  >
                    {Object.values(Exchange).map((ex) => (
                      <option key={ex} value={ex}>{ex}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="tradingCurrency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Trading Currency
                  </label>
                  <select
                    id="tradingCurrency"
                    value={tradingCurrency}
                    onChange={(e) => setTradingCurrency(e.target.value as Currency)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-700 dark:text-white"
                    required
                  >
                    {Object.values(Currency).map((curr) => (
                      <option key={curr} value={curr}>{curr}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="broker" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Broker
                  </label>
                  <input
                    type="text"
                    id="broker"
                    value={broker}
                    onChange={(e) => setBroker(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-700 dark:text-white"
                    placeholder="e.g. Interactive Brokers"
                    required
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Purchase History</h3>
                  <button
                    type="button"
                    onClick={() => setPurchases([...purchases, {
                      price: currentPrice || 0,
                      quantity: 0,
                      date: new Date(),
                      currency: tradingCurrency
                    }])}
                    className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-teal-700 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/20 hover:bg-teal-200 dark:hover:bg-teal-900/30 focus:outline-none"
                  >
                    <PlusIcon size={14} className="mr-1" />
                    Add Purchase
                  </button>
                </div>
                
                {purchases.map((purchase, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-slate-700/30 p-3 rounded-md mb-3">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Purchase #{index + 1}</h4>
                      {purchases.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setPurchases(purchases.filter((_, i) => i !== index))}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                        >
                          <XIcon size={16} />
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Purchase Date
                        </label>
                        <input
                          type="date"
                          value={purchase.date instanceof Date 
                            ? purchase.date.toISOString().split('T')[0] 
                            : new Date(purchase.date).toISOString().split('T')[0]}
                          onChange={(e) => {
                            const updatedPurchases = [...purchases];
                            updatedPurchases[index] = {
                              ...purchase,
                              date: new Date(e.target.value)
                            };
                            setPurchases(updatedPurchases);
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-700 dark:text-white"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Price Per Share
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={purchase.price}
                          onChange={(e) => {
                            const updatedPurchases = [...purchases];
                            updatedPurchases[index] = {
                              ...purchase,
                              price: Number(e.target.value)
                            };
                            setPurchases(updatedPurchases);
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-700 dark:text-white"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Quantity
                        </label>
                        <input
                          type="number"
                          step="1"
                          min="1"
                          value={purchase.quantity}
                          onChange={(e) => {
                            const updatedPurchases = [...purchases];
                            updatedPurchases[index] = {
                              ...purchase,
                              quantity: Number(e.target.value)
                            };
                            setPurchases(updatedPurchases);
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-700 dark:text-white"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Currency
                        </label>
                        <select
                          value={purchase.currency}
                          onChange={(e) => {
                            const updatedPurchases = [...purchases];
                            updatedPurchases[index] = {
                              ...purchase,
                              currency: e.target.value as Currency
                            };
                            setPurchases(updatedPurchases);
                          }}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-700 dark:text-white"
                          required
                        >
                          {Object.values(Currency).map((curr) => (
                            <option key={curr} value={curr}>{curr}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors duration-200"
                >
                  {mode === 'edit' ? 'Save Changes' : 'Add Asset'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default AssetForm;