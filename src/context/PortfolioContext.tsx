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

  // Check authentication status before fetching data
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        fetchData();
      }
    };
    
    checkAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchData();
      } else {
        // Clear data when user logs out
        setAssets([]);
        setRSUs([]);
        setESPPs([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No authenticated session');
      }

      // Query assets with their related purchases
      const { data: assetsData, error: assetsError } = await supabase
        .from('assets')
        .select(`
          *,
          purchases(*)
        `);

      if (assetsError) throw assetsError;
      
      // Transform the data to match our Asset type
      const transformedAssets = assetsData?.map(asset => ({
        id: asset.id,
        name: asset.name,
        ticker: asset.ticker,
        exchange: asset.exchange,
        tradingCurrency: asset.trading_currency,
        broker: asset.broker,
        currentPrice: asset.current_price,
        previousPrice: asset.previous_price,
        lastUpdated: new Date(asset.last_updated),
        purchases: asset.purchases.map((purchase: any) => ({
          id: purchase.id,
          price: purchase.price,
          quantity: purchase.quantity,
          date: new Date(purchase.date),
          currency: purchase.currency
        }))
      })) || [];

      setAssets(transformedAssets);

      // Query RSUs with their related vesting entries
      const { data: rsusData, error: rsusError } = await supabase
        .from('rsus')
        .select(`
          *,
          vesting_entries(*)
        `);

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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No authenticated session');
      }

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
    try {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please sign in to add assets');
      }

      // Insert the asset with the user's ID
      const { data: assetData, error: assetError } = await supabase
        .from('assets')
        .insert([{
          user_id: session.user.id,
          name: newAsset.name,
          ticker: newAsset.ticker,
          exchange: newAsset.exchange,
          trading_currency: newAsset.tradingCurrency,
          broker: newAsset.broker,
          current_price: 0,
          previous_price: 0,
          last_updated: new Date().toISOString()
        }])
        .select()
        .single();

      if (assetError) throw assetError;

      // Then, insert all purchases for this asset
      const purchasePromises = newAsset.purchases.map(purchase => 
        supabase
          .from('purchases')
          .insert([{
            asset_id: assetData.id,
            price: purchase.price,
            quantity: purchase.quantity,
            date: purchase.date.toISOString().split('T')[0],
            currency: purchase.currency
          }])
          .select()
      );

      const purchaseResults = await Promise.all(purchasePromises);
      const purchases = purchaseResults.map(result => result.data?.[0]).filter(Boolean);

      // Create the complete asset object with purchases
      const completeAsset: Asset = {
        id: assetData.id,
        name: assetData.name,
        ticker: assetData.ticker,
        exchange: assetData.exchange,
        tradingCurrency: assetData.trading_currency,
        broker: assetData.broker,
        currentPrice: assetData.current_price,
        previousPrice: assetData.previous_price,
        lastUpdated: new Date(assetData.last_updated),
        purchases: purchases.map(p => ({
          id: p.id,
          price: p.price,
          quantity: p.quantity,
          date: new Date(p.date),
          currency: p.currency
        }))
      };

      setAssets(prev => [...prev, completeAsset]);
      await refreshPrices();
    } catch (error) {
      console.error("Failed to add asset:", error);
      throw error;
    }
  };

  const updateAsset = async (id: string, updatedFields: Partial<Asset>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please sign in to update assets');
      }

      const { error } = await supabase
        .from('assets')
        .update(updatedFields)
        .eq('id', id);

      if (error) throw error;
      setAssets(prev => prev.map(asset => asset.id === id ? { ...asset, ...updatedFields } : asset));
    } catch (error) {
      console.error("Failed to update asset:", error);
      throw error;
    }
  };

  const deleteAsset = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please sign in to delete assets');
      }

      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setAssets(prev => prev.filter(asset => asset.id !== id));
    } catch (error) {
      console.error("Failed to delete asset:", error);
      throw error;
    }
  };

  // Add purchase operation
  const addPurchase = async (assetId: string, purchase: Omit<Purchase, 'id'>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please sign in to add purchases');
      }

      const { data, error } = await supabase
        .from('purchases')
        .insert([{
          asset_id: assetId,
          price: purchase.price,
          quantity: purchase.quantity,
          date: purchase.date.toISOString().split('T')[0],
          currency: purchase.currency
        }])
        .select()
        .single();

      if (error) throw error;

      const newPurchase: Purchase = {
        id: data.id,
        price: data.price,
        quantity: data.quantity,
        date: new Date(data.date),
        currency: data.currency
      };

      setAssets(prev => prev.map(asset => {
        if (asset.id === assetId) {
          return {
            ...asset,
            purchases: [...asset.purchases, newPurchase]
          };
        }
        return asset;
      }));
    } catch (error) {
      console.error("Failed to add purchase:", error);
      throw error;
    }
  };

  // CRUD operations for RSUs
  const addRSU = async (rsu: Omit<RSU, 'id'>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please sign in to add RSUs');
      }

      const { data, error } = await supabase
        .from('rsus')
        .insert([rsu])
        .select()
        .single();

      if (error) throw error;
      setRSUs(prev => [...prev, { ...data, vesting_entries: [] }]);
    } catch (error) {
      console.error("Failed to add RSU:", error);
      throw error;
    }
  };

  const updateRSU = async (id: string, updatedFields: Partial<RSU>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please sign in to update RSUs');
      }

      const { error } = await supabase
        .from('rsus')
        .update(updatedFields)
        .eq('id', id);

      if (error) throw error;
      setRSUs(prev => prev.map(rsu => rsu.id === id ? { ...rsu, ...updatedFields } : rsu));
    } catch (error) {
      console.error("Failed to update RSU:", error);
      throw error;
    }
  };

  const deleteRSU = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please sign in to delete RSUs');
      }

      const { error } = await supabase
        .from('rsus')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setRSUs(prev => prev.filter(rsu => rsu.id !== id));
    } catch (error) {
      console.error("Failed to delete RSU:", error);
      throw error;
    }
  };

  // CRUD operations for ESPPs
  const addESPP = async (espp: Omit<ESPP, 'id'>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please sign in to add ESPPs');
      }

      const { data, error } = await supabase
        .from('espps')
        .insert([espp])
        .select()
        .single();

      if (error) throw error;
      setESPPs(prev => [...prev, data]);
    } catch (error) {
      console.error("Failed to add ESPP:", error);
      throw error;
    }
  };

  const updateESPP = async (id: string, updatedFields: Partial<ESPP>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please sign in to update ESPPs');
      }

      const { error } = await supabase
        .from('espps')
        .update(updatedFields)
        .eq('id', id);

      if (error) throw error;
      setESPPs(prev => prev.map(espp => espp.id === id ? { ...espp, ...updatedFields } : espp));
    } catch (error) {
      console.error("Failed to update ESPP:", error);
      throw error;
    }
  };

  const deleteESPP = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please sign in to delete ESPPs');
      }

      const { error } = await supabase
        .from('espps')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setESPPs(prev => prev.filter(espp => espp.id !== id));
    } catch (error) {
      console.error("Failed to delete ESPP:", error);
      throw error;
    }
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