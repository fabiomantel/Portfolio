import React, { useState } from 'react';
import AssetCard from './AssetCard';
import { usePortfolio } from '../../context/PortfolioContext';
import { PlusCircleIcon, RefreshCwIcon } from 'lucide-react';
import { Asset } from '../../types';
import AssetForm from '../forms/AssetForm';

interface AssetListProps {
  onAddAsset: () => void;
}

const AssetList: React.FC<AssetListProps> = ({ onAddAsset }) => {
  const { assets, isLoading, refreshPrices } = usePortfolio();
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
  };

  const handleRefresh = async () => {
    try {
      await refreshPrices();
    } catch (error) {
      console.error('Failed to refresh prices:', error);
    }
  };

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Assets</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className={`inline-flex items-center p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Refresh Prices"
          >
            <RefreshCwIcon size={20} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={onAddAsset}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors duration-200"
          >
            <PlusCircleIcon size={16} className="mr-1" />
            Add Asset
          </button>
        </div>
      </div>
      
      {isLoading && assets.length > 0 && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Updating prices...</p>
        </div>
      )}
      
      {assets.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-slate-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-700">
          <p className="text-gray-600 dark:text-gray-400 mb-4">You haven't added any assets yet</p>
          <button
            onClick={onAddAsset}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-teal-700 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/20 hover:bg-teal-200 dark:hover:bg-teal-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors duration-200"
          >
            <PlusCircleIcon size={16} className="mr-2" />
            Add Your First Asset
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.map(asset => (
            <AssetCard key={asset.id} asset={asset} onEdit={handleEdit} />
          ))}
        </div>
      )}

      {editingAsset && (
        <AssetForm 
          onClose={() => setEditingAsset(null)} 
          asset={editingAsset} 
          mode="edit" 
        />
      )}
    </div>
  );
};

export default AssetList;