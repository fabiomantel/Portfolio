import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Asset, Purchase, RSU, ESPP, Currency, SyncMode } from '../types';
import { mockAssets } from '../data/mockAssets';
import { mockRSUs, mockESPPs } from '../data/mockEquity';
import { convertCurrency } from '../utils/currencyUtils';
import { fetchLatestPrices } from '../utils/dataFetching';

interface PortfolioContextType {
  assets: Asset[];
  rsus: RSU[];
  espps: ESPP[];
  selectedCurrency: Currency;
  syncMode: SyncMode;
  isLoading: boolean;
  totalValue: number;
  addAsset: (asset: Omit<Asset, 'id' | 'currentPrice' | 'previousPrice' | 'lastUpdated'>) => void;
  updateAsset: (id: string, asset: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;
  addPurchase: (assetId: string, purchase: Omit<Purchase, 'id'>) => void;
  addRSU: (rsu: Omit<RSU, 'id'>) => void;
  addESPP: (espp: Omit<ESPP, 'id'>) => void;
  setCurrency: (currency: Currency) => void;
  setSyncMode: (mode: SyncMode) => void;
  refreshPrices: () => Promise<void>;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [assets, setAssets] = useState<Asset[]>(mockAssets);
  const [rsus, setRSUs] = useState<RSU[]>(mockRSUs);
  const [espps, setESPPs] = useState<ESPP[]>(mockESPPs);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(Currency.USD);
  const [syncMode, setSyncMode] = useState<SyncMode>(SyncMode.LOCAL);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [totalValue, setTotalValue] = useState<number>(0);

  // Calculate total portfolio value
  useEffect(() => {
    const total = assets.reduce((sum, asset) => {
      const assetValue = asset.currentPrice * asset.purchases.reduce((qty, p) => qty + p.quantity, 0);
      const convertedValue = convertCurrency(assetValue, asset.tradingCurrency, selectedCurrency);
      return sum + convertedValue;
    }, 0);
    
    setTotalValue(total);
  }, [assets, selectedCurrency]);

  // Auto-refresh prices every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshPrices();
    }, 60000);
    
    return () => clearInterval(interval);
  }, [assets]);

  const refreshPrices = useCallback(async () => {
    setIsLoading(true);
    try {
      const updatedAssets = await fetchLatestPrices(assets);
      setAssets(updatedAssets);
    } catch (error) {
      console.error("Failed to refresh prices:", error);
    } finally {
      setIsLoading(false);
    }
  }, [assets]);

  const addAsset = useCallback((newAsset: Omit<Asset, 'id' | 'currentPrice' | 'previousPrice' | 'lastUpdated'>) => {
    const asset: Asset = {
      ...newAsset,
      id: crypto.randomUUID(),
      currentPrice: 0,
      previousPrice: 0,
      lastUpdated: new Date()
    };
    
    setAssets(prev => [...prev, asset]);
    refreshPrices();
  }, []);

  const updateAsset = useCallback((id: string, updatedFields: Partial<Asset>) => {
    setAssets(prev => 
      prev.map(asset => 
        asset.id === id ? { ...asset, ...updatedFields } : asset
      )
    );
  }, []);

  const deleteAsset = useCallback((id: string) => {
    setAssets(prev => prev.filter(asset => asset.id !== id));
  }, []);

  const addPurchase = useCallback((assetId: string, purchase: Omit<Purchase, 'id'>) => {
    const newPurchase: Purchase = {
      ...purchase,
      id: crypto.randomUUID()
    };
    
    setAssets(prev => 
      prev.map(asset => 
        asset.id === assetId 
          ? { ...asset, purchases: [...asset.purchases, newPurchase] } 
          : asset
      )
    );
  }, []);

  const addRSU = useCallback((rsu: Omit<RSU, 'id'>) => {
    const newRSU: RSU = {
      ...rsu,
      id: crypto.randomUUID()
    };
    
    setRSUs(prev => [...prev, newRSU]);
  }, []);

  const addESPP = useCallback((espp: Omit<ESPP, 'id'>) => {
    const newESPP: ESPP = {
      ...espp,
      id: crypto.randomUUID()
    };
    
    setESPPs(prev => [...prev, newESPP]);
  }, []);

  const setCurrency = useCallback((currency: Currency) => {
    setSelectedCurrency(currency);
  }, []);

  const value = {
    assets,
    rsus,
    espps,
    selectedCurrency,
    syncMode,
    isLoading,
    totalValue,
    addAsset,
    updateAsset,
    deleteAsset,
    addPurchase,
    addRSU,
    addESPP,
    setCurrency,
    setSyncMode,
    refreshPrices
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = (): PortfolioContextType => {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
};