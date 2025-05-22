import React, { useState } from 'react';
import { XIcon, PlusIcon } from 'lucide-react';
import { Asset, Exchange, Currency, Purchase } from '../../types';
import { usePortfolio } from '../../context/PortfolioContext';

interface AssetFormProps {
  onClose: () => void;
}

const AssetForm: React.FC<AssetFormProps> = ({ onClose }) => {
  const { addAsset } = usePortfolio();
  
  const [name, setName] = useState('');
  const [ticker, setTicker] = useState('');
  const [exchange, setExchange] = useState<Exchange>(Exchange.NYSE);
  const [tradingCurrency, setTradingCurrency] = useState<Currency>(Currency.USD);
  const [broker, setBroker] = useState('');
  const [purchases, setPurchases] = useState<Omit<Purchase, 'id'>[]>([
    {
      price: 0,
      quantity: 0,
      date: new Date(),
      currency: Currency.USD
    }
  ]);

  const handleAddPurchase = () => {
    setPurchases([
      ...purchases,
      {
        price: 0,
        quantity: 0,
        date: new Date(),
        currency: Currency.USD
      }
    ]);
  };

  const handleRemovePurchase = (index: number) => {
    setPurchases(purchases.filter((_, i) => i !== index));
  };

  const updatePurchase = (index: number, field: keyof Omit<Purchase, 'id'>, value: any) => {
    const updatedPurchases = [...purchases];
    updatedPurchases[index] = {
      ...updatedPurchases[index],
      [field]: value
    };
    setPurchases(updatedPurchases);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create purchases with proper date objects
    const formattedPurchases = purchases.map(purchase => ({
      ...purchase,
      price: Number(purchase.price),
      quantity: Number(purchase.quantity),
      date: new Date(purchase.date)
    }));
    
    // Add the new asset
    addAsset({
      name,
      ticker,
      exchange,
      tradingCurrency,
      broker,
      purchases: formattedPurchases as Purchase[]
    });
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add New Asset</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <XIcon size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
              <label htmlFor="ticker" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ticker Symbol
              </label>
              <input
                type="text"
                id="ticker"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-700 dark:text-white"
                placeholder="e.g. AAPL"
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
                onClick={handleAddPurchase}
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
                      onClick={() => handleRemovePurchase(index)}
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
                      onChange={(e) => updatePurchase(index, 'date', new Date(e.target.value))}
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
                      onChange={(e) => updatePurchase(index, 'price', e.target.value)}
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
                      onChange={(e) => updatePurchase(index, 'quantity', e.target.value)}
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
                      onChange={(e) => updatePurchase(index, 'currency', e.target.value)}
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
              Add Asset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssetForm;