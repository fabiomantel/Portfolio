import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { fetchHistoricalData } from '../../utils/dataFetching';
import { format } from 'date-fns';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface HistoricalChartProps {
  symbol: string;
  exchange?: string;
  from?: string;
  to?: string;
}

interface HistoricalDataPoint {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  adjustedClose: number;
  volume: number;
}

const HistoricalChart: React.FC<HistoricalChartProps> = ({ symbol, exchange, from, to }) => {
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHistoricalData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchHistoricalData(symbol, exchange, from, to);
        if (data) {
          setHistoricalData(data);
        } else {
          setError('No historical data available');
        }
      } catch (err) {
        setError('Failed to fetch historical data');
        console.error('Error fetching historical data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistoricalData();
  }, [symbol, exchange, from, to]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading historical data...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-64 text-red-500">{error}</div>;
  }

  if (historicalData.length === 0) {
    return <div className="flex justify-center items-center h-64">No historical data available</div>;
  }

  const chartData = {
    labels: historicalData.map(d => format(d.date, 'MMM d, yyyy')),
    datasets: [
      {
        label: 'Adjusted Close',
        data: historicalData.map(d => d.adjustedClose),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.1
      },
      {
        label: 'Volume',
        data: historicalData.map(d => d.volume),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        yAxisID: 'volume',
        hidden: true
      }
    ]
  };

  const options = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Price'
        }
      },
      volume: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'Volume'
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `${symbol} Historical Data`
      }
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default HistoricalChart; 