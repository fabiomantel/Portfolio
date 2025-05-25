import React, { useState } from 'react';
import { XIcon, PlusIcon } from 'lucide-react';
import { RSU, VestingEntry, VestingEntryWithoutId, RsuFormData } from '../../types';
import { usePortfolio } from '../../context/PortfolioContext';

interface RsuFormProps {
  onClose: () => void;
  rsu?: RSU;
  mode?: 'create' | 'edit';
}

const RsuForm: React.FC<RsuFormProps> = ({ onClose, rsu, mode = 'create' }) => {
  const { addRSU, updateRSU, isAuthenticated } = usePortfolio();
  const [error, setError] = useState<string | null>(null);
  
  const [ticker, setTicker] = useState(rsu?.ticker || '');
  const [companyName, setCompanyName] = useState(rsu?.companyName || '');
  const [grantDate, setGrantDate] = useState(rsu?.grantDate || new Date());
  const [totalGranted, setTotalGranted] = useState(rsu?.totalGranted || 0);
  const [vestingSchedule, setVestingSchedule] = useState<VestingEntryWithoutId[]>(
    rsu?.vestingSchedule?.map(entry => ({
      date: entry.date,
      quantity: entry.quantity,
      isVested: entry.isVested
    })) || [
      {
        date: new Date(),
        quantity: 0,
        isVested: false
      }
    ]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!isAuthenticated) {
      setError('Please sign in to manage RSUs');
      return;
    }
    
    try {
      const rsuData: RsuFormData = {
        ticker,
        companyName,
        grantDate: new Date(grantDate),
        totalGranted: Number(totalGranted),
        vestingSchedule: vestingSchedule.map(entry => ({
          date: new Date(entry.date),
          quantity: Number(entry.quantity),
          isVested: entry.isVested
        }))
      };

      if (mode === 'edit' && rsu) {
        await updateRSU(rsu.id, rsuData);
      } else {
        await addRSU(rsuData);
      }
      
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save RSU');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {mode === 'edit' ? 'Edit RSU Grant' : 'Add New RSU Grant'}
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
              <label htmlFor="totalGranted" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Total Shares Granted
              </label>
              <input
                type="number"
                id="totalGranted"
                value={totalGranted}
                onChange={(e) => setTotalGranted(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-700 dark:text-white"
                min="1"
                step="1"
                required
              />
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Vesting Schedule</h3>
              <button
                type="button"
                onClick={() => setVestingSchedule([...vestingSchedule, {
                  date: new Date(),
                  quantity: 0,
                  isVested: false
                }])}
                className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-teal-700 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/20 hover:bg-teal-200 dark:hover:bg-teal-900/30 focus:outline-none"
              >
                <PlusIcon size={14} className="mr-1" />
                Add Vesting Entry
              </button>
            </div>
            
            {vestingSchedule.map((entry, index) => (
              <div key={index} className="bg-gray-50 dark:bg-slate-700/30 p-3 rounded-md mb-3">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Vesting Entry #{index + 1}</h4>
                  {vestingSchedule.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setVestingSchedule(vestingSchedule.filter((_, i) => i !== index))}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                    >
                      <XIcon size={16} />
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Vesting Date
                    </label>
                    <input
                      type="date"
                      value={entry.date instanceof Date ? entry.date.toISOString().split('T')[0] : new Date(entry.date).toISOString().split('T')[0]}
                      onChange={(e) => {
                        const updatedSchedule = [...vestingSchedule];
                        updatedSchedule[index] = {
                          ...entry,
                          date: new Date(e.target.value)
                        };
                        setVestingSchedule(updatedSchedule);
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-700 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Shares Vesting
                    </label>
                    <input
                      type="number"
                      value={entry.quantity}
                      onChange={(e) => {
                        const updatedSchedule = [...vestingSchedule];
                        updatedSchedule[index] = {
                          ...entry,
                          quantity: Number(e.target.value)
                        };
                        setVestingSchedule(updatedSchedule);
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-700 dark:text-white"
                      min="1"
                      step="1"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Status
                    </label>
                    <select
                      value={entry.isVested ? 'vested' : 'pending'}
                      onChange={(e) => {
                        const updatedSchedule = [...vestingSchedule];
                        updatedSchedule[index] = {
                          ...entry,
                          isVested: e.target.value === 'vested'
                        };
                        setVestingSchedule(updatedSchedule);
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 dark:bg-slate-700 dark:text-white"
                      required
                    >
                      <option value="pending">Pending</option>
                      <option value="vested">Vested</option>
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
              {mode === 'edit' ? 'Save Changes' : 'Add RSU Grant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RsuForm; 