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
}

export interface VestingEntry {
  id: string;
  date: Date;
  quantity: number;
  isVested: boolean;
}

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
  purchaseCycle: {
    startDate: Date;
    endDate: Date;
  };
}

// Enums
export enum Exchange {
  NYSE = "NYSE",
  NASDAQ = "NASDAQ",
  TASE = "TASE",
  LSE = "LSE",
  EURONEXT = "EURONEXT"
}

export enum Currency {
  USD = "USD",
  ILS = "ILS",
  EUR = "EUR",
  GBP = "GBP"
}

export enum SyncMode {
  LOCAL = "LOCAL",
  CLOUD = "CLOUD"
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