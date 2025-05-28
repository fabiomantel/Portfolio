import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Asset, Purchase, RSU, ESPP, Currency, SyncMode, Exchange, VestingEntry, VestingEntryWithoutId, RsuFormData, EsppFormData, AssetFormData, PurchaseFormData } from '../types';
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
  addAsset: (asset: AssetFormData) => Promise<void>;
  updateAsset: (id: string, asset: Partial<AssetFormData>) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;
  addPurchase: (assetId: string, purchase: PurchaseFormData) => Promise<void>;
  addRSU: (rsu: RsuFormData) => Promise<void>;
  updateRSU: (id: string, updatedFields: Partial<Omit<RSU, 'id' | 'vestingSchedule'>> & { vestingSchedule?: VestingEntryWithoutId[] }) => Promise<void>;
  deleteRSU: (id: string) => Promise<void>;
  addESPP: (espp: EsppFormData) => Promise<void>;
  updateESPP: (id: string, espp: Partial<EsppFormData>) => Promise<void>;
  deleteESPP: (id: string) => Promise<void>;
  setCurrency: (currency: Currency) => void;
  setSyncMode: (mode: SyncMode) => void;
  refreshPrices: () => Promise<Asset[]>;
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
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);

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
      const transformedAssets = assetsData?.map(asset => {
        // Ensure we have a valid date for lastUpdated
        let lastUpdated;
        if (asset.last_updated) {
          lastUpdated = new Date(asset.last_updated);
          // If the date is invalid or too old, use current time
          if (isNaN(lastUpdated.getTime()) || lastUpdated.getFullYear() < 2020) {
            lastUpdated = new Date();
          }
        } else {
          lastUpdated = new Date();
        }

        return {
          id: asset.id,
          name: asset.name,
          ticker: asset.ticker,
          exchange: asset.exchange,
          tradingCurrency: asset.trading_currency,
          broker: asset.broker,
          currentPrice: asset.current_price || 0,
          previousPrice: asset.previous_price || 0,
          lastUpdated,
          currentPriceOverwritten: asset.current_price_overwritten || false,
          purchases: asset.purchases.map((purchase: any) => ({
            id: purchase.id,
            price: purchase.price,
            quantity: purchase.quantity,
            date: new Date(purchase.date),
            currency: purchase.currency
          }))
        };
      }) || [];

      // If we have assets, immediately fetch latest prices
      if (transformedAssets.length > 0) {
        const now = new Date();
        const updatedAssets = await fetchLatestPrices(transformedAssets);
        
        // Update prices in Supabase and set correct timestamp
        await Promise.all(updatedAssets.map(asset => 
          supabase
            .from('assets')
            .update({
              current_price: asset.currentPrice,
              previous_price: asset.previousPrice,
              last_updated: now.toISOString()
            })
            .eq('id', asset.id)
        ));

        // Set the correct timestamp for all assets
        const assetsWithCorrectTime = updatedAssets.map(asset => ({
          ...asset,
          lastUpdated: now
        }));
        
        setAssets(assetsWithCorrectTime);
      } else {
        setAssets(transformedAssets);
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
        lastUpdated: new Date(espp.last_updated || new Date()),
        exchange: espp.exchange || Exchange.NASDAQ // Default to NASDAQ if not specified
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

  const refreshPrices = useCallback(async () => {
    if (!isAuthenticated) {
      console.log('Price refresh skipped - user not authenticated');
      throw new Error('Please sign in to refresh prices');
    }

    console.log('Starting price refresh...');
    setIsLoading(true);
    try {
      // Get current assets from state
      const currentAssets = assets;
      console.log('Fetching latest prices for assets:', currentAssets.map(a => a.ticker).join(', '));
      const updatedAssets = await fetchLatestPrices(currentAssets);
      
      // Create a single timestamp for all updates to ensure consistency
      const now = new Date();
      const timestamp = now.toISOString();
      
      console.log('Updating prices in Supabase...');
      // Update prices in Supabase
      const updatedAssetsWithTime = await Promise.all(updatedAssets.map(async (asset) => {
        // Convert TASE prices from agorot to shekels
        let currentPrice = asset.currentPrice;
        let previousPrice = asset.previousPrice;
        
        if (asset.exchange === Exchange.TASE) {
          console.log(`Converting TASE price for ${asset.ticker} from agorot to shekels`);
          currentPrice = currentPrice / 100;
          previousPrice = previousPrice / 100;
        }
        
        await supabase
          .from('assets')
          .update({
            current_price: currentPrice,
            previous_price: previousPrice,
            last_updated: timestamp
          })
          .eq('id', asset.id);
          
        return {
          ...asset,
          currentPrice,
          previousPrice,
          lastUpdated: now
        };
      }));
      
      console.log('Price refresh completed successfully');
      setAssets(updatedAssetsWithTime);
      return updatedAssetsWithTime; // Return the updated assets
    } catch (error) {
      console.error("Failed to refresh prices:", error);
      throw error; // Re-throw the error to be handled by the caller
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, assets]); // Add assets back as a dependency

  // Handle auto-refresh separately from manual refresh
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    let isRefreshing = false;

    const autoRefresh = async () => {
      if (!isAuthenticated || isRefreshing) return;
      
      isRefreshing = true;
      try {
        await refreshPrices();
      } catch (error) {
        console.error('Auto-refresh failed:', error);
      } finally {
        isRefreshing = false;
      }
    };

    // Set up auto-refresh
    if (isAuthenticated) {
      timeoutId = setInterval(autoRefresh, 60000);
      // Initial refresh
      autoRefresh();
    }
    
    return () => {
      if (timeoutId) {
        clearInterval(timeoutId);
        timeoutId = null;
      }
    };
  }, [isAuthenticated]);

  // CRUD operations for assets
  const addAsset = async (newAsset: AssetFormData) => {
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
          current_price: newAsset.currentPrice || 0,
          previous_price: 0,
          last_updated: new Date().toISOString(),
          current_price_overwritten: newAsset.currentPriceOverwritten || false
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
        currentPriceOverwritten: assetData.current_price_overwritten,
        purchases: purchases.map(p => ({
          id: p.id,
          price: p.price,
          quantity: p.quantity,
          date: new Date(p.date),
          currency: p.currency
        }))
      };

      // Add the new asset to state first
      setAssets(prev => [...prev, completeAsset]);
      
      // Then fetch latest prices for all assets including the new one
      const updatedAssets = await fetchLatestPrices([...assets, completeAsset]);
      
      // Update prices in Supabase for all assets
      await Promise.all(updatedAssets.map(asset => 
        supabase
          .from('assets')
          .update({
            current_price: asset.currentPrice,
            previous_price: asset.previousPrice,
            last_updated: new Date().toISOString()
          })
          .eq('id', asset.id)
      ));
      
      // Finally update state with all fresh prices
      setAssets(updatedAssets);
    } catch (error) {
      console.error("Failed to add asset:", error);
      throw error;
    }
  };

  const updateAsset = async (id: string, updatedFields: Partial<AssetFormData>) => {
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
          broker: updatedFields.broker,
          current_price: updatedFields.currentPrice,
          current_price_overwritten: updatedFields.currentPriceOverwritten
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
        setAssets(prev => prev.map(asset => {
          if (asset.id !== id) return asset;

          // Keep existing asset data
          const updatedAsset = { ...asset };

          // Update basic fields if provided
          if (updatedFields.name) updatedAsset.name = updatedFields.name;
          if (updatedFields.ticker) updatedAsset.ticker = updatedFields.ticker;
          if (updatedFields.exchange) updatedAsset.exchange = updatedFields.exchange;
          if (updatedFields.tradingCurrency) updatedAsset.tradingCurrency = updatedFields.tradingCurrency;
          if (updatedFields.broker) updatedAsset.broker = updatedFields.broker;
          if (updatedFields.currentPrice !== undefined) {
            updatedAsset.currentPrice = updatedFields.currentPrice;
            updatedAsset.currentPriceOverwritten = updatedFields.currentPriceOverwritten || false;
          }
          
          // Update purchases if provided, ensuring they have IDs
          if (purchases && Array.isArray(purchases)) {
            updatedAsset.purchases = purchases.map(p => ({
              id: p.id,
              price: p.price,
              quantity: p.quantity,
              date: new Date(p.date),
              currency: p.currency
            })) as Purchase[];
          }

          return updatedAsset;
        }));
      } else {
        // If no purchases to update, just update the basic information
        setAssets(prev => prev.map(asset => {
          if (asset.id !== id) return asset;

          // Keep existing asset data
          const updatedAsset = { ...asset };

          // Update basic fields if provided
          if (updatedFields.name) updatedAsset.name = updatedFields.name;
          if (updatedFields.ticker) updatedAsset.ticker = updatedFields.ticker;
          if (updatedFields.exchange) updatedAsset.exchange = updatedFields.exchange;
          if (updatedFields.tradingCurrency) updatedAsset.tradingCurrency = updatedFields.tradingCurrency;
          if (updatedFields.broker) updatedAsset.broker = updatedFields.broker;
          if (updatedFields.currentPrice !== undefined) {
            updatedAsset.currentPrice = updatedFields.currentPrice;
            updatedAsset.currentPriceOverwritten = updatedFields.currentPriceOverwritten || false;
          }

          return updatedAsset;
        }));
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
  const addPurchase = async (assetId: string, purchase: PurchaseFormData) => {
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
        lastUpdated: new Date(esppResult.last_updated || new Date()),
        exchange: esppResult.exchange || Exchange.NASDAQ // Default to NASDAQ if not specified
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