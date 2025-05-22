import { Asset, Currency, Exchange } from '../types';

export const mockAssets: Asset[] = [
  {
    id: '1',
    name: 'Apple Inc.',
    ticker: 'AAPL',
    exchange: Exchange.NASDAQ,
    tradingCurrency: Currency.USD,
    broker: 'Interactive Brokers',
    purchases: [
      {
        id: '1-1',
        price: 145.86,
        quantity: 10,
        date: new Date('2021-06-15'),
        currency: Currency.USD
      },
      {
        id: '1-2',
        price: 167.23,
        quantity: 5,
        date: new Date('2022-01-10'),
        currency: Currency.USD
      }
    ],
    currentPrice: 187.32,
    previousPrice: 185.92,
    lastUpdated: new Date()
  },
  {
    id: '2',
    name: 'Microsoft Corporation',
    ticker: 'MSFT',
    exchange: Exchange.NASDAQ,
    tradingCurrency: Currency.USD,
    broker: 'Charles Schwab',
    purchases: [
      {
        id: '2-1',
        price: 239.58,
        quantity: 8,
        date: new Date('2021-03-22'),
        currency: Currency.USD
      }
    ],
    currentPrice: 327.89,
    previousPrice: 325.12,
    lastUpdated: new Date()
  },
  {
    id: '3',
    name: 'Tel Aviv Stock Exchange',
    ticker: 'TASE',
    exchange: Exchange.TASE,
    tradingCurrency: Currency.ILS,
    broker: 'Bank Leumi',
    purchases: [
      {
        id: '3-1',
        price: 1690.50,
        quantity: 15,
        date: new Date('2022-05-18'),
        currency: Currency.ILS
      }
    ],
    currentPrice: 1875.20,
    previousPrice: 1860.75,
    lastUpdated: new Date()
  },
  {
    id: '4',
    name: 'Barclays PLC',
    ticker: 'BARC',
    exchange: Exchange.LSE,
    tradingCurrency: Currency.GBP,
    broker: 'Hargreaves Lansdown',
    purchases: [
      {
        id: '4-1',
        price: 157.32,
        quantity: 100,
        date: new Date('2021-11-30'),
        currency: Currency.GBP
      }
    ],
    currentPrice: 168.84,
    previousPrice: 165.92,
    lastUpdated: new Date()
  }
];