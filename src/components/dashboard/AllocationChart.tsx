import React, { useState, useEffect } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { calculateTotalShares } from '../../utils/dataFetching';
import { convertCurrency, formatCurrency } from '../../utils/currencyUtils';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, Sector } from 'recharts';
import { Currency } from '../../types';

type AllocationBy = 'asset' | 'broker' | 'exchange';

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', 
  '#82CA9D', '#FCCF31', '#F44336', '#3F51B5', '#4CAF50'
];

interface ChartData {
  name: string;
  value: number;
  percentage: number;
  displayValue: string;
}

const AllocationChart: React.FC = () => {
  const { assets, selectedCurrency } = usePortfolio();
  const [allocationBy, setAllocationBy] = useState<AllocationBy>('asset');
  const [data, setData] = useState<ChartData[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  useEffect(() => {
    generateData();
  }, [assets, selectedCurrency, allocationBy]);

  // Generate allocation data
  const generateData = async () => {
    if (assets.length === 0) return;

    let aggregatedData = new Map<string, number>();
    let totalValue = 0;

    // Calculate values for each asset in selected currency
    for (const asset of assets) {
      const totalShares = calculateTotalShares(asset);
      const value = await convertCurrency(
        asset.currentPrice * totalShares,
        asset.tradingCurrency,
        selectedCurrency
      );

      if (allocationBy === 'asset') {
        aggregatedData.set(asset.ticker, value);
      } else if (allocationBy === 'broker') {
        const currentValue = aggregatedData.get(asset.broker) || 0;
        aggregatedData.set(asset.broker, currentValue + value);
      } else {
        const currentValue = aggregatedData.get(asset.exchange) || 0;
        aggregatedData.set(asset.exchange, currentValue + value);
      }

      totalValue += value;
    }

    // Convert to array and calculate percentages
    const chartData: ChartData[] = Array.from(aggregatedData.entries())
      .map(([name, value]) => ({
        name,
        value,
        percentage: (value / totalValue) * 100,
        displayValue: formatCurrency(value, selectedCurrency)
      }))
      .sort((a, b) => b.value - a.value);

    setData(chartData);
  };

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 6}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
      </g>
    );
  };

  if (assets.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-slate-700/20 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">No assets to display</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Portfolio Allocation</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setAllocationBy('asset')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
              allocationBy === 'asset'
                ? 'bg-teal-100 dark:bg-teal-900/20 text-teal-800 dark:text-teal-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
            }`}
          >
            By Asset
          </button>
          <button
            onClick={() => setAllocationBy('broker')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
              allocationBy === 'broker'
                ? 'bg-teal-100 dark:bg-teal-900/20 text-teal-800 dark:text-teal-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
            }`}
          >
            By Broker
          </button>
          <button
            onClick={() => setAllocationBy('exchange')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
              allocationBy === 'exchange'
                ? 'bg-teal-100 dark:bg-teal-900/20 text-teal-800 dark:text-teal-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
            }`}
          >
            By Exchange
          </button>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              data={data}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              onMouseEnter={onPieEnter}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string, props: any) => [
                `${props.payload.displayValue} (${props.payload.percentage.toFixed(2)}%)`,
                name
              ]}
            />
            <Legend
              formatter={(value: string, entry: any) => (
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {value} ({entry.payload.percentage.toFixed(1)}%)
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Add a table view of the allocation data */}
      <div className="mt-4">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {allocationBy === 'asset' ? 'Asset' : allocationBy === 'broker' ? 'Broker' : 'Exchange'}
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Allocation
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data.map((item, index) => (
                <tr key={item.name} className="text-sm">
                  <td className="px-3 py-2 text-gray-900 dark:text-white">
                    <div className="flex items-center">
                      <span className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                      {item.name}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right text-gray-900 dark:text-white font-medium">
                    {item.displayValue}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-500 dark:text-gray-400">
                    {item.percentage.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AllocationChart;