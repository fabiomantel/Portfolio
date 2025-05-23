import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Asset, Purchase, RSU, ESPP, Currency, SyncMode } from '../types';
import { supabase } from '../lib/supabase';
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
  addAsset: (asset: Omit<Asset, 'id' | 'currentPrice' | 'previousPrice' | 'lastUpdated'>) => Promise<void>;
  updateAsset: (id: string, asset: Partial<Asset>) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;
  addPurchase: (assetId: string, purchase: Omit<Purchase, 'id'>) => Promise<void>;
  addRSU: (rsu: Omit<RSU, 'id'>) => Promise<void>;
  updateRSU: (id: string, rsu: Partial<RSU>) => Promise<void>;
  deleteRSU: (id: string) => Promise<void>;
  addESPP: (espp: Omit<ESPP, 'id'>) => Promise<void>;
  updateESPP: (id: string, espp: Partial<ESPP>) => Promise<void>;
  deleteESPP: (id: string) => Promise<void>;
  setCurrency: (currency: Currency) => void;
  setSyncMode: (mode: SyncMode) => void;
  refreshPrices: () => Promise<void>;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const PortfolioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [rsus, setRSUs] = useState<RSU[]>([]);
  const [espps, setESPPs] = useState<ESPP[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(Currency.USD);
  const [syncMode, setSyncMode] = useState<SyncMode>(SyncMode.CLOUD);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [totalValue, setTotalValue] = useState<number>(0);

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Modified query to properly handle the relationship
      const { data: assetsData, error: assetsError } = await supabase
        .from('assets')
        .select('id, name, ticker, exchange, trading_currency, broker, current_price, previous_price, last_updated, purchases(id, price, quantity, date, currency)');

      if (assetsError) throw assetsError;
      setAssets(assetsData || []);

      const { data: rsusData, error: rsusError } = await supabase
        .from('rsus')
        .select('*, vesting_entries(*)');

      if (rsusError) throw rsusError;
      setRSUs(rsusData || []);

      const { data: esppsData, error: esppsError } = await supabase
        .from('espps')
        .select('*');

      if (esppsError) throw esppsError;
      setESPPs(esppsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
      
      // Update prices in Supabase
      for (const asset of updatedAssets) {
        await supabase
          .from('assets')
          .update({
            current_price: asset.currentPrice,
            previous_price: asset.previousPrice,
            last_updated: new Date().toISOString()
          })
          .eq('id', asset.id);
      }
      
      setAssets(updatedAssets);
    } catch (error) {
      console.error("Failed to refresh prices:", error);
    } finally {
      setIsLoading(false);
    }
  }, [assets]);

  // CRUD operations for assets
  const addAsset = async (newAsset: Omit<Asset, 'id' | 'currentPrice' | 'previousPrice' | 'lastUpdated'>) => {
    const { data, error } = await supabase
      .from('assets')
      .insert([{
        ...newAsset,
        current_price: 0,
        previous_price: 0,
        last_updated: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    setAssets(prev => [...prev, data]);
    await refreshPrices();
  };

  const updateAsset = async (id: string, updatedFields: Partial<Asset>) => {
    const { error } = await supabase
      .from('assets')
      .update(updatedFields)
      .eq('id', id);

    if (error) throw error;
    setAssets(prev => prev.map(asset => asset.id === id ? { ...asset, ...updatedFields } : asset));
  };

  const deleteAsset = async (id: string) => {
    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('id', id);

    if (error) throw error;
    setAssets(prev => prev.filter(asset => asset.id !== id));
  };

  // Add purchase operation
  const addPurchase = async (assetId: string, purchase: Omit<Purchase, 'id'>) => {
    const { data, error } = await supabase
      .from('purchases')
      .insert([{ ...purchase, asset_id: assetId }])
      .select()
      .single();

    if (error) throw error;

    // Update the local assets state to include the new purchase
    setAssets(prev => prev.map(asset => {
      if (asset.id === assetId) {
        return {
          ...asset,
          purchases: [...asset.purchases, data]
        };
      }
      return asset;
    }));
  };

  // CRUD operations for RSUs
  const addRSU = async (rsu: Omit<RSU, 'id'>) => {
    const { data, error } = await supabase
      .from('rsus')
      .insert([rsu])
      .select()
      .single();

    if (error) throw error;
    setRSUs(prev => [...prev, data]);
  };

  const updateRSU = async (id: string, updatedFields: Partial<RSU>) => {
    const { error } = await supabase
      .from('rsus')
      .update(updatedFields)
      .eq('id', id);

    if (error) throw error;
    setRSUs(prev => prev.map(rsu => rsu.id === id ? { ...rsu, ...updatedFields } : rsu));
  };

  const deleteRSU = async (id: string) => {
    const { error } = await supabase
      .from('rsus')
      .delete()
      .eq('id', id);

    if (error) throw error;
    setRSUs(prev => prev.filter(rsu => rsu.id !== id));
  };

  // CRUD operations for ESPPs
  const addESPP = async (espp: Omit<ESPP, 'id'>) => {
    const { data, error } = await supabase
      .from('espps')
      .insert([espp])
      .select()
      .single();

    if (error) throw error;
    setESPPs(prev => [...prev, data]);
  };

  const updateESPP = async (id: string, updatedFields: Partial<ESPP>) => {
    const { error } = await supabase
      .from('espps')
      .update(updatedFields)
      .eq('id', id);

    if (error) throw error;
    setESPPs(prev => prev.map(espp => espp.id === id ? { ...espp, ...updatedFields } : espp));
  };

  const deleteESPP = async (id: string) => {
    const { error } = await supabase
      .from('espps')
      .delete()
      .eq('id', id);

    if (error) throw error;
    setESPPs(prev => prev.filter(espp => espp.id !== id));
  };

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
    updateRSU,
    deleteRSU,
    addESPP,
    updateESPP,
    deleteESPP,
    setCurrency: setSelectedCurrency,
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