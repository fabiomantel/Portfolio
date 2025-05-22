import React, { useState } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { formatCurrency } from '../../utils/currencyUtils';
import { PlusCircleIcon, XIcon } from 'lucide-react';
import { RSU, VestingEntry } from '../../types';

interface RsuTrackerProps {
  onAddRsu: () => void;
}

const RsuTracker: React.FC<RsuTrackerProps> = ({ onAddRsu }) => {
  const { rsus } = usePortfolio();
  const [expandedRsu, setExpandedRsu] = useState<string | null>(null);
  
  const toggleExpand = (id: string) => {
    setExpandedRsu(expandedRsu === id ? null : id);
  };
  
  // Calculate vested percentage
  const getVestedPercentage = (rsu: RSU) => {
    const vestedShares = rsu.vestingSchedule
      .filter(entry => entry.isVested)
      .reduce((sum, entry) => sum + entry.quantity, 0);
    
    return (vestedShares / rsu.totalGranted) * 100;
  };
  
  // Calculate next vesting
  const getNextVesting = (rsu: RSU) => {
    const now = new Date();
    const upcomingVestings = rsu.vestingSchedule
      .filter(entry => !entry.isVested && new Date(entry.date) > now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return upcomingVestings[0];
  };

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">RSU Tracker</h2>
        <button
          onClick={onAddRsu}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors duration-200"
        >
          <PlusCircleIcon size={16} className="mr-1" />
          Add RSU
        </button>
      </div>
      
      {rsus.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-slate-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-700">
          <p className="text-gray-600 dark:text-gray-400 mb-4">You haven't added any RSUs yet</p>
          <button
            onClick={onAddRsu}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-teal-700 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/20 hover:bg-teal-200 dark:hover:bg-teal-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors duration-200"
          >
            <PlusCircleIcon size={16} className="mr-2" />
            Add Your First RSU
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {rsus.map(rsu => {
            const vestedPercentage = getVestedPercentage(rsu);
            const nextVesting = getNextVesting(rsu);
            const isExpanded = expandedRsu === rsu.id;
            
            return (
              <div 
                key={rsu.id} 
                className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden border border-gray-100 dark:border-slate-700"
              >
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{rsu.companyName}</h3>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {rsu.ticker} • Grant Date: {new Date(rsu.grantDate).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleExpand(rsu.id)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      {isExpanded ? (
                        <XIcon size={18} />
                      ) : (
                        <span className="text-sm font-medium text-teal-600 dark:text-teal-400">Details</span>
                      )}
                    </button>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Vesting Progress</span>
                      <span className="font-medium">{vestedPercentage.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5">
                      <div 
                        className="bg-teal-600 h-2.5 rounded-full" 
                        style={{ width: `${vestedPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Granted</p>
                      <p className="font-medium text-gray-900 dark:text-white">{rsu.totalGranted} shares</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Next Vesting</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {nextVesting 
                          ? `${nextVesting.quantity} shares on ${new Date(nextVesting.date).toLocaleDateString()}`
                          : 'All vested'
                        }
                      </p>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Vesting Schedule</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {rsu.vestingSchedule.map(entry => (
                          <div 
                            key={entry.id} 
                            className={`flex justify-between items-center p-2 rounded ${
                              entry.isVested 
                                ? 'bg-green-50 dark:bg-green-900/10 text-green-800 dark:text-green-400' 
                                : 'bg-gray-50 dark:bg-slate-700/30 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <div>
                              <div className="font-medium">{new Date(entry.date).toLocaleDateString()}</div>
                              <div className="text-xs">
                                {entry.isVested ? 'Vested' : 'Pending'}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{entry.quantity} shares</div>
                              <div className="text-xs">
                                {entry.isVested ? 'Available' : 'Upcoming'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RsuTracker;