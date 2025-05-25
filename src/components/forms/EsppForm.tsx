import React, { useState } from 'react';
import { XIcon } from 'lucide-react';
import { ESPP, EsppFormData } from '../../types';
import { usePortfolio } from '../../context/PortfolioContext';

interface EsppFormProps {
  onClose: () => void;
  espp?: ESPP;
  mode?: 'create' | 'edit';
}

const EsppForm: React.FC<EsppFormProps> = ({ onClose, espp, mode = 'create' }) => {
  const { addESPP, updateESPP, isAuthenticated } = usePortfolio();
  const [error, setError] = useState<string | null>(null);
  
  const [ticker, setTicker] = useState(espp?.ticker || '');
  const [companyName, setCompanyName] = useState(espp?.companyName || '');
  const [grantDate, setGrantDate] = useState(espp?.grantDate || new Date());
  const [purchasePrice, setPurchasePrice] = useState(espp?.purchasePrice || 0);
  const [marketPrice, setMarketPrice] = useState(espp?.marketPrice || 0);
  const [quantity, setQuantity] = useState(espp?.quantity || 0);
  const [discount, setDiscount] = useState(espp?.discount || 0);
  const [broker, setBroker] = useState(espp?.broker || '');
  const [purchaseCycle, setPurchaseCycle] = useState({
    startDate: espp?.cycleStartDate || new Date(),
    endDate: espp?.cycleEndDate || new Date()
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!isAuthenticated) {
      setError('Please sign in to manage ESPPs');
      return;
    }
    
    // Validate cycle dates
    if (new Date(purchaseCycle.endDate) <= new Date(purchaseCycle.startDate)) {
      setError('End date must be after start date');
      return;
    }
    
    try {
      const esppData: EsppFormData = {
        ticker,
        company_name: companyName,
        grant_date: new Date(grantDate),
        purchase_price: Number(purchasePrice),
        market_price: Number(marketPrice),
        quantity: Number(quantity),
        discount: Number(discount),
        broker,
        cycle_start_date: new Date(purchaseCycle.startDate),
        cycle_end_date: new Date(purchaseCycle.endDate)
      };

      if (mode === 'edit' && espp) {
        await updateESPP(espp.id, esppData);
      } else {
        await addESPP(esppData);
      }
      
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save ESPP');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {mode === 'edit' ? 'Edit ESPP Purchase' : 'Add New ESPP Purchase'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <XIcon size={20} />
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/30">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Company Name
              </label>
              <input
                type="text"
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-700 dark:text-white"
                placeholder="e.g. Apple Inc."
                required
              />
            </div>
            
            <div>
              <label htmlFor="grantDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Grant Date
              </label>
              <input
                type="date"
                id="grantDate"
                value={grantDate instanceof Date ? grantDate.toISOString().split('T')[0] : new Date(grantDate).toISOString().split('T')[0]}
                onChange={(e) => setGrantDate(new Date(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-700 dark:text-white"
                required
              />
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
                placeholder="e.g. E*TRADE"
                required
              />
            </div>
            
            <div>
              <label htmlFor="purchasePrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Purchase Price
              </label>
              <input
                type="number"
                id="purchasePrice"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-700 dark:text-white"
                min="0.01"
                step="0.01"
                required
              />
            </div>
            
            <div>
              <label htmlFor="marketPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Market Price
              </label>
              <input
                type="number"
                id="marketPrice"
                value={marketPrice}
                onChange={(e) => setMarketPrice(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-700 dark:text-white"
                min="0.01"
                step="0.01"
                required
              />
            </div>
            
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Quantity
              </label>
              <input
                type="number"
                id="quantity"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-700 dark:text-white"
                min="1"
                step="1"
                required
              />
            </div>
            
            <div>
              <label htmlFor="discount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Discount (%)
              </label>
              <input
                type="number"
                id="discount"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-700 dark:text-white"
                min="0"
                max="100"
                step="1"
                required
              />
            </div>
          </div>
          
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Purchase Cycle</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cycleStart" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  id="cycleStart"
                  value={purchaseCycle.startDate instanceof Date ? purchaseCycle.startDate.toISOString().split('T')[0] : new Date(purchaseCycle.startDate).toISOString().split('T')[0]}
                  onChange={(e) => setPurchaseCycle({ ...purchaseCycle, startDate: new Date(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-700 dark:text-white"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="cycleEnd" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  id="cycleEnd"
                  value={purchaseCycle.endDate instanceof Date ? purchaseCycle.endDate.toISOString().split('T')[0] : new Date(purchaseCycle.endDate).toISOString().split('T')[0]}
                  onChange={(e) => setPurchaseCycle({ ...purchaseCycle, endDate: new Date(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-700 dark:text-white"
                  min={purchaseCycle.startDate instanceof Date ? purchaseCycle.startDate.toISOString().split('T')[0] : new Date(purchaseCycle.startDate).toISOString().split('T')[0]}
                  required
                />
              </div>
            </div>
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
              {mode === 'edit' ? 'Save Changes' : 'Add ESPP Purchase'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EsppForm; 