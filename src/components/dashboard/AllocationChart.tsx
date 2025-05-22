import React, { useState } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { calculateTotalShares } from '../../utils/dataFetching';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

type AllocationBy = 'asset' | 'broker' | 'exchange';

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', 
  '#82CA9D', '#FCCF31', '#F44336', '#3F51B5', '#4CAF50'
];

const AllocationChart: React.FC = () => {
  const { assets } = usePortfolio();
  const [allocationBy, setAllocationBy] = useState<AllocationBy>('asset');
  
  if (assets.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-slate-700/20 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">No assets to display</p>
      </div>
    );
  }
  
  // Generate allocation data
  const generateData = () => {
    let data: { name: string; value: number }[] = [];
    
    if (allocationBy === 'asset') {
      data = assets.map(asset => {
        const totalShares = calculateTotalShares(asset);
        return {
          name: asset.ticker,
          value: asset.currentPrice * totalShares
        };
      });
    } else if (allocationBy === 'broker') {
      const brokerMap = new Map<string, number>();
      
      assets.forEach(asset => {
        const totalShares = calculateTotalShares(asset);
        const value = asset.currentPrice * totalShares;
        const currentValue = brokerMap.get(asset.broker) || 0;
        brokerMap.set(asset.broker, currentValue + value);
      });
      
      data = Array.from(brokerMap.entries()).map(([name, value]) => ({
        name,
        value
      }));
    } else if (allocationBy === 'exchange') {
      const exchangeMap = new Map<string, number>();
      
      assets.forEach(asset => {
        const totalShares = calculateTotalShares(asset);
        const value = asset.currentPrice * totalShares;
        const currentValue = exchangeMap.get(asset.exchange) || 0;
        exchangeMap.set(asset.exchange, currentValue + value);
      });
      
      data = Array.from(exchangeMap.entries()).map(([name, value]) => ({
        name,
        value
      }));
    }
    
    // Sort by value (highest first)
    return data.sort((a, b) => b.value - a.value);
  };
  
  const data = generateData();
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const value = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(payload[0].value);
      
      return (
        <div className="bg-white dark:bg-slate-800 p-2 shadow-md rounded border border-gray-200 dark:border-slate-700">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-gray-700 dark:text-gray-300">{value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <div className="flex justify-center mb-4">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            onClick={() => setAllocationBy('asset')}
            className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
              allocationBy === 'asset' 
                ? 'bg-teal-600 text-white' 
                : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-600'
            } border border-gray-200 dark:border-slate-600`}
          >
            By Asset
          </button>
          <button
            type="button"
            onClick={() => setAllocationBy('broker')}
            className={`px-4 py-2 text-sm font-medium ${
              allocationBy === 'broker' 
                ? 'bg-teal-600 text-white' 
                : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-600'
            } border-t border-b border-gray-200 dark:border-slate-600`}
          >
            By Broker
          </button>
          <button
            type="button"
            onClick={() => setAllocationBy('exchange')}
            className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
              allocationBy === 'exchange' 
                ? 'bg-teal-600 text-white' 
                : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-600'
            } border border-gray-200 dark:border-slate-600`}
          >
            By Exchange
          </button>
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              innerRadius={40}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AllocationChart;