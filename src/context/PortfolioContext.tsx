import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Asset, Purchase, RSU, ESPP, Currency, SyncMode, VestingEntry, VestingEntryWithoutId, RsuFormData, EsppFormData } from '../types';
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
  isAuthenticated: boolean;
  addAsset: (asset: Omit<Asset, 'id' | 'currentPrice' | 'previousPrice' | 'lastUpdated'>) => Promise<void>;
  updateAsset: (id: string, asset: Partial<Asset>) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;
  addPurchase: (assetId: string, purchase: Omit<Purchase, 'id'>) => Promise<void>;
  addRSU: (rsu: RsuFormData) => Promise<void>;
  updateRSU: (id: string, updatedFields: Partial<Omit<RSU, 'id' | 'vestingSchedule'>> & { vestingSchedule?: VestingEntryWithoutId[] }) => Promise<void>;
  deleteRSU: (id: string) => Promise<void>;
  addESPP: (espp: EsppFormData) => Promise<void>;
  updateESPP: (id: string, espp: Partial<EsppFormData>) => Promise<void>;
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
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(Currency.ILS);
  const [syncMode, setSyncMode] = useState<SyncMode>(SyncMode.MANUAL);
  const [isLoading, setIsLoading] = useState(true);
  const [totalValue, setTotalValue] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status before fetching data
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      if (session) {
        fetchData();
      }
    };
    
    checkAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
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
        return;
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
        currentPrice: asset.current_price || 0,
        previousPrice: asset.previous_price || 0,
        lastUpdated: new Date(asset.last_updated || new Date()),
        purchases: asset.purchases.map((purchase: any) => ({
          id: purchase.id,
          price: purchase.price,
          quantity: purchase.quantity,
          date: new Date(purchase.date),
          currency: purchase.currency
        }))
      })) || [];

      setAssets(transformedAssets);

      // Fetch latest prices immediately after loading assets
      if (transformedAssets.length > 0) {
        const updatedAssets = await fetchLatestPrices(transformedAssets);
        
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
      }

      // Query RSUs with their related vesting entries
      const { data: rsusData, error: rsusError } = await supabase
        .from('rsus')
        .select(`
          *,
          vesting_entries(*)
        `);

      if (rsusError) throw rsusError;
      
      // Transform RSU data
      const transformedRSUs = rsusData?.map(rsu => ({
        id: rsu.id,
        ticker: rsu.ticker,
        companyName: rsu.company_name,
        grantDate: new Date(rsu.grant_date),
        totalGranted: rsu.total_granted,
        vestingSchedule: rsu.vesting_entries.map((entry: any) => ({
          id: entry.id,
          date: new Date(entry.date),
          quantity: entry.quantity,
          isVested: entry.is_vested
        }))
      })) || [];

      setRSUs(transformedRSUs);

      // Query ESPPs
      const { data: esppsData, error: esppsError } = await supabase
        .from('espps')
        .select('*');

      if (esppsError) throw esppsError;

      // Transform ESPP data
      const transformedESPPs = esppsData?.map(espp => ({
        id: espp.id,
        ticker: espp.ticker,
        companyName: espp.company_name,
        grantDate: new Date(espp.grant_date),
        purchasePrice: espp.purchase_price,
        marketPrice: espp.market_price,
        quantity: espp.quantity,
        discount: espp.discount,
        broker: espp.broker,
        cycleStartDate: new Date(espp.cycle_start_date),
        cycleEndDate: new Date(espp.cycle_end_date),
        currentPrice: espp.current_price || 0,
        previousPrice: espp.previous_price || 0,
        lastUpdated: new Date(espp.last_updated || new Date())
      })) || [];

      setESPPs(transformedESPPs);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate total value across all assets
  const calculateTotal = async () => {
    try {
      const assetValues = await Promise.all(assets.map(async asset => {
        const assetValue = asset.currentPrice * asset.purchases.reduce((qty, p) => qty + p.quantity, 0);
        return await convertCurrency(assetValue, asset.tradingCurrency, selectedCurrency);
      }));
      
      const total = assetValues.reduce((sum, value) => sum + value, 0);
      setTotalValue(total);
    } catch (error) {
      console.error('Error calculating total value:', error);
    }
  };

  // Calculate total portfolio value
  useEffect(() => {
    calculateTotal();
  }, [assets, selectedCurrency]);

  // Auto-refresh prices and exchange rates every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (isAuthenticated) {
        refreshPrices();
        calculateTotal();
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [assets, isAuthenticated, selectedCurrency]);

  const refreshPrices = useCallback(async () => {
    if (!isAuthenticated) {
      console.log('Price refresh skipped - user not authenticated');
      throw new Error('Please sign in to refresh prices');
    }

    console.log('Starting price refresh...');
    setIsLoading(true);
    try {
      console.log('Fetching latest prices for assets:', assets.map(a => a.ticker).join(', '));
      const updatedAssets = await fetchLatestPrices(assets);
      
      console.log('Updating prices in Supabase...');
      // Update prices in Supabase
      for (const asset of updatedAssets) {
        console.log(`Updating ${asset.ticker}: ${asset.currentPrice} (prev: ${asset.previousPrice})`);
        await supabase
          .from('assets')
          .update({
            current_price: asset.currentPrice,
            previous_price: asset.previousPrice,
            last_updated: new Date().toISOString()
          })
          .eq('id', asset.id);
      }
      
      console.log('Price refresh completed successfully');
      setAssets(updatedAssets);
    } catch (error) {
      console.error("Failed to refresh prices:", error);
    } finally {
      setIsLoading(false);
    }
  }, [assets, isAuthenticated]);

  // CRUD operations for assets
  const addAsset = async (newAsset: Omit<Asset, 'id' | 'currentPrice' | 'previousPrice' | 'lastUpdated'>) => {
    if (!isAuthenticated) {
      throw new Error('Please sign in to add assets');
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication session expired');
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
    if (!isAuthenticated) {
      throw new Error('Please sign in to update assets');
    }

    try {
      // First, update the asset's basic information
      const { error: assetError } = await supabase
        .from('assets')
        .update({
          name: updatedFields.name,
          ticker: updatedFields.ticker,
          exchange: updatedFields.exchange,
          trading_currency: updatedFields.tradingCurrency,
          broker: updatedFields.broker
        })
        .eq('id', id);

      if (assetError) throw assetError;

      // If there are purchases to update
      if (updatedFields.purchases) {
        // Delete all existing purchases for this asset
        const { error: deleteError } = await supabase
          .from('purchases')
          .delete()
          .eq('asset_id', id);

        if (deleteError) throw deleteError;

        // Insert the new purchases
        const purchasePromises = updatedFields.purchases.map(purchase => 
          supabase
            .from('purchases')
            .insert([{
              asset_id: id,
              price: purchase.price,
              quantity: purchase.quantity,
              date: purchase.date instanceof Date 
                ? purchase.date.toISOString().split('T')[0]
                : new Date(purchase.date).toISOString().split('T')[0],
              currency: purchase.currency
            }])
            .select()
        );

        const purchaseResults = await Promise.all(purchasePromises);
        const purchases = purchaseResults.flatMap(result => 
          result.data?.map(p => ({
            id: p.id,
            price: p.price,
            quantity: p.quantity,
            date: new Date(p.date),
            currency: p.currency
          })) || []
        );

        // Update the local state
        setAssets(prev => prev.map(asset => 
          asset.id === id 
            ? {
                ...asset,
                ...updatedFields,
                purchases
              }
            : asset
        ));
      } else {
        // If no purchases to update, just update the basic information
        setAssets(prev => prev.map(asset => 
          asset.id === id 
            ? { ...asset, ...updatedFields }
            : asset
        ));
      }
    } catch (error) {
      console.error("Failed to update asset:", error);
      throw error;
    }
  };

  const deleteAsset = async (id: string) => {
    if (!isAuthenticated) {
      throw new Error('Please sign in to delete assets');
    }

    try {
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
    if (!isAuthenticated) {
      throw new Error('Please sign in to add purchases');
    }

    try {
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
  const addRSU = async (rsu: RsuFormData) => {
    if (!isAuthenticated) {
      throw new Error('Please sign in to add RSUs');
    }

    try {
      // Transform frontend model to database schema
      const rsuData = {
        ticker: rsu.ticker,
        company_name: rsu.companyName,
        grant_date: rsu.grantDate.toISOString().split('T')[0],
        total_granted: rsu.totalGranted,
        user_id: (await supabase.auth.getUser()).data.user?.id
      };

      // Insert RSU
      const { data: rsuResult, error: rsuError } = await supabase
        .from('rsus')
        .insert([rsuData])
        .select()
        .single();

      if (rsuError) throw rsuError;

      // Insert vesting entries
      const vestingData = rsu.vestingSchedule.map(entry => ({
        rsu_id: rsuResult.id,
        date: entry.date.toISOString().split('T')[0],
        quantity: entry.quantity,
        is_vested: entry.isVested
      }));

      const { data: vestingResult, error: vestingError } = await supabase
        .from('vesting_entries')
        .insert(vestingData)
        .select();

      if (vestingError) throw vestingError;

      // Transform database result back to frontend model
      const newRSU: RSU = {
        id: rsuResult.id,
        ticker: rsuResult.ticker,
        companyName: rsuResult.company_name,
        grantDate: new Date(rsuResult.grant_date),
        totalGranted: rsuResult.total_granted,
        vestingSchedule: vestingResult.map(entry => ({
          id: entry.id,
          date: new Date(entry.date),
          quantity: entry.quantity,
          isVested: entry.is_vested
        }))
      };

      setRSUs(prev => [...prev, newRSU]);
    } catch (error) {
      console.error("Failed to add RSU:", error);
      throw error;
    }
  };

  const updateRSU = async (id: string, updatedFields: Partial<Omit<RSU, 'id' | 'vestingSchedule'>> & { vestingSchedule?: VestingEntryWithoutId[] }) => {
    if (!isAuthenticated) {
      throw new Error('Please sign in to update RSUs');
    }

    try {
      // Transform frontend model to database schema
      const rsuData: any = {};
      if (updatedFields.ticker) rsuData.ticker = updatedFields.ticker;
      if (updatedFields.companyName) rsuData.company_name = updatedFields.companyName;
      if (updatedFields.grantDate) rsuData.grant_date = updatedFields.grantDate.toISOString().split('T')[0];
      if (updatedFields.totalGranted) rsuData.total_granted = updatedFields.totalGranted;

      // Update RSU
      const { error: rsuError } = await supabase
        .from('rsus')
        .update(rsuData)
        .eq('id', id);

      if (rsuError) throw rsuError;

      // Update vesting entries if provided
      if (updatedFields.vestingSchedule) {
        // First, delete existing vesting entries
        const { error: deleteError } = await supabase
          .from('vesting_entries')
          .delete()
          .eq('rsu_id', id);

        if (deleteError) throw deleteError;

        // Then insert new vesting entries
        const vestingData = updatedFields.vestingSchedule.map(entry => ({
          rsu_id: id,
          date: entry.date.toISOString().split('T')[0],
          quantity: entry.quantity,
          is_vested: entry.isVested
        }));

        const { data: vestingResult, error: vestingError } = await supabase
          .from('vesting_entries')
          .insert(vestingData)
          .select();

        if (vestingError) throw vestingError;

        // Update state with transformed data
        setRSUs(prev => prev.map(rsu => {
          if (rsu.id === id) {
            const updatedRSU: RSU = {
              ...rsu,
              ...updatedFields,
              vestingSchedule: vestingResult.map(entry => ({
                id: entry.id,
                date: new Date(entry.date),
                quantity: entry.quantity,
                isVested: entry.is_vested
              }))
            };
            return updatedRSU;
          }
          return rsu;
        }));
      } else {
        // Just update the RSU fields without touching vesting entries
        setRSUs((prev: RSU[]) => prev.map((rsu: RSU) => {
          if (rsu.id === id) {
            const updatedRSU: RSU = {
              ...rsu,
              ...updatedFields,
              vestingSchedule: rsu.vestingSchedule // Keep the existing vesting schedule
            };
            return updatedRSU;
          }
          return rsu;
        }));
      }
    } catch (error) {
      console.error("Failed to update RSU:", error);
      throw error;
    }
  };

  const deleteRSU = async (id: string) => {
    if (!isAuthenticated) {
      throw new Error('Please sign in to delete RSUs');
    }

    try {
      const { error } = await supabase
        .from('rsus')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setRSUs((prev: RSU[]) => prev.filter((rsu: RSU) => rsu.id !== id));
    } catch (error) {
      console.error("Failed to delete RSU:", error);
      throw error;
    }
  };

  // CRUD operations for ESPPs
  const addESPP = async (espp: EsppFormData) => {
    if (!isAuthenticated) {
      throw new Error('Please sign in to add ESPPs');
    }

    try {
      const { data: esppResult, error: esppError } = await supabase
        .from('espps')
        .insert([{
          ...espp,
          user_id: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      if (esppError) throw esppError;

      // Transform database schema to frontend model
      const newEspp: ESPP = {
        id: esppResult.id,
        ticker: esppResult.ticker,
        companyName: esppResult.company_name,
        grantDate: new Date(esppResult.grant_date),
        purchasePrice: esppResult.purchase_price,
        marketPrice: esppResult.market_price,
        quantity: esppResult.quantity,
        discount: esppResult.discount,
        broker: esppResult.broker,
        cycleStartDate: new Date(esppResult.cycle_start_date),
        cycleEndDate: new Date(esppResult.cycle_end_date),
        currentPrice: esppResult.current_price || 0,
        previousPrice: esppResult.previous_price || 0,
        lastUpdated: new Date(esppResult.last_updated || new Date())
      };

      setESPPs(prev => [...prev, newEspp]);
    } catch (error) {
      console.error("Failed to add ESPP:", error);
      throw error;
    }
  };

  const updateESPP = async (id: string, updatedFields: Partial<EsppFormData>) => {
    if (!isAuthenticated) {
      throw new Error('Please sign in to update ESPPs');
    }

    try {
      const { error: esppError } = await supabase
        .from('espps')
        .update(updatedFields)
        .eq('id', id);

      if (esppError) throw esppError;

      // Transform database schema to frontend model
      setESPPs(prev => prev.map(espp => {
        if (espp.id === id) {
          return {
            ...espp,
            ticker: updatedFields.ticker || espp.ticker,
            companyName: updatedFields.company_name || espp.companyName,
            grantDate: updatedFields.grant_date ? new Date(updatedFields.grant_date) : espp.grantDate,
            purchasePrice: updatedFields.purchase_price || espp.purchasePrice,
            marketPrice: updatedFields.market_price || espp.marketPrice,
            quantity: updatedFields.quantity || espp.quantity,
            discount: updatedFields.discount || espp.discount,
            broker: updatedFields.broker || espp.broker,
            cycleStartDate: updatedFields.cycle_start_date ? new Date(updatedFields.cycle_start_date) : espp.cycleStartDate,
            cycleEndDate: updatedFields.cycle_end_date ? new Date(updatedFields.cycle_end_date) : espp.cycleEndDate
          };
        }
        return espp;
      }));
    } catch (error) {
      console.error("Failed to update ESPP:", error);
      throw error;
    }
  };

  const deleteESPP = async (id: string) => {
    if (!isAuthenticated) {
      throw new Error('Please sign in to delete ESPPs');
    }

    try {
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
    isAuthenticated,
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