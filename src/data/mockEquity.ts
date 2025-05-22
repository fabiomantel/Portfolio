import { RSU, ESPP } from '../types';

export const mockRSUs: RSU[] = [
  {
    id: '1',
    ticker: 'MSFT',
    companyName: 'Microsoft Corporation',
    grantDate: new Date('2022-03-15'),
    totalGranted: 100,
    vestingSchedule: [
      {
        id: '1-1',
        date: new Date('2023-03-15'),
        quantity: 25,
        isVested: true
      },
      {
        id: '1-2',
        date: new Date('2024-03-15'),
        quantity: 25,
        isVested: false
      },
      {
        id: '1-3',
        date: new Date('2025-03-15'),
        quantity: 25,
        isVested: false
      },
      {
        id: '1-4',
        date: new Date('2026-03-15'),
        quantity: 25,
        isVested: false
      }
    ]
  },
  {
    id: '2',
    ticker: 'AMZN',
    companyName: 'Amazon.com, Inc.',
    grantDate: new Date('2022-06-01'),
    totalGranted: 50,
    vestingSchedule: [
      {
        id: '2-1',
        date: new Date('2023-06-01'),
        quantity: 12,
        isVested: true
      },
      {
        id: '2-2',
        date: new Date('2023-12-01'),
        quantity: 13,
        isVested: false
      },
      {
        id: '2-3',
        date: new Date('2024-06-01'),
        quantity: 12,
        isVested: false
      },
      {
        id: '2-4',
        date: new Date('2024-12-01'),
        quantity: 13,
        isVested: false
      }
    ]
  }
];

export const mockESPPs: ESPP[] = [
  {
    id: '1',
    ticker: 'AAPL',
    companyName: 'Apple Inc.',
    grantDate: new Date('2022-01-01'),
    purchasePrice: 142.56,
    marketPrice: 168.30,
    quantity: 15,
    discount: 15,
    broker: 'E*TRADE',
    purchaseCycle: {
      startDate: new Date('2022-01-01'),
      endDate: new Date('2022-06-30')
    }
  },
  {
    id: '2',
    ticker: 'GOOGL',
    companyName: 'Alphabet Inc.',
    grantDate: new Date('2022-07-01'),
    purchasePrice: 105.44,
    marketPrice: 124.05,
    quantity: 8,
    discount: 15,
    broker: 'Fidelity',
    purchaseCycle: {
      startDate: new Date('2022-07-01'),
      endDate: new Date('2022-12-31')
    }
  }
];