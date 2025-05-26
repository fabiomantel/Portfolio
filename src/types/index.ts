// Asset Types
export interface Asset {
  id: string;
  name: string;
  ticker: string;
  exchange: Exchange;
  tradingCurrency: Currency;
  broker: string;
  purchases: Purchase[];
  currentPrice: number;
  previousPrice: number;
  lastUpdated: Date;
}

export interface Purchase {
  id: string;
  price: number;
  quantity: number;
  date: Date;
  currency: Currency;
}

// RSU Types
export interface RSU {
  id: string;
  ticker: string;
  companyName: string;
  grantDate: Date;
  totalGranted: number;
  vestingSchedule: VestingEntry[];
  currentPrice?: number;
  previousPrice?: number;
  lastUpdated?: Date;
}

export interface VestingEntry {
  id: string;
  date: Date;
  quantity: number;
  isVested: boolean;
}

export type VestingEntryWithoutId = Omit<VestingEntry, 'id'>;
export type RsuFormData = Omit<RSU, 'id' | 'vestingSchedule'> & {
  vestingSchedule: VestingEntryWithoutId[];
};

// ESPP Types
export interface ESPP {
  id: string;
  ticker: string;
  companyName: string;
  grantDate: Date;
  purchasePrice: number;
  marketPrice: number;
  quantity: number;
  discount: number;
  broker: string;
  cycleStartDate: Date;
  cycleEndDate: Date;
  currentPrice: number;
  previousPrice: number;
  lastUpdated: Date;
  exchange: Exchange;
}

export interface EsppFormData {
  ticker: string;
  company_name: string;
  grant_date: Date;
  purchase_price: number;
  market_price: number;
  quantity: number;
  discount: number;
  broker: string;
  cycle_start_date: Date;
  cycle_end_date: Date;
  exchange: Exchange;
}

// Enums
export enum Exchange {
  NYSE = "NYSE",
  NASDAQ = "NASDAQ",
  TASE = "TASE",
  LSE = "LSE",
}

export enum Currency {
  USD = 'USD',
  ILS = 'ILS',
  EUR = 'EUR',
  GBP = 'GBP',
  JPY = 'JPY',
  CHF = 'CHF',
  CAD = 'CAD',
  AUD = 'AUD',
  CNY = 'CNY',
  HKD = 'HKD',
  SGD = 'SGD'
}

export enum SyncMode {
  MANUAL = 'manual',
  CLOUD = 'cloud'
}

export enum ThemeMode {
  LIGHT = "LIGHT",
  DARK = "DARK"
}

// Dashboard Types
export interface AllocationData {
  label: string;
  value: number;
  color: string;
}

export interface TopMover {
  id: string;
  name: string;
  ticker: string;
  percentChange: number;
  absoluteChange: number;
}

export interface PortfolioSummary {
  totalValue: number;
  totalGain: number;
  totalGainPercent: number;
  dailyChange: number;
  dailyChangePercent: number;
}