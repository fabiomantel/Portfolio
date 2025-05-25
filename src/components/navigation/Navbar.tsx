import React from 'react';
import { SunIcon, MoonIcon, DollarSignIcon, CircleIcon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { usePortfolio } from '../../context/PortfolioContext';
import { Currency, ThemeMode } from '../../types';

const Navbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { selectedCurrency, setCurrency, refreshPrices, isLoading } = usePortfolio();

  return (
    <nav className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and app name */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="h-8 w-8 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-md flex items-center justify-center">
                <CircleIcon size={20} className="text-white" />
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">Portfolio Tracker</span>
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-4">
            {/* Refresh button */}
            <button
              onClick={() => refreshPrices()}
              className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 focus:outline-none transition-colors duration-200"
              aria-label="Refresh prices"
              disabled={isLoading}
            >
              <svg 
                className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`}
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
              </svg>
            </button>

            {/* Currency toggle */}
            <div className="relative inline-flex items-center">
              <button
                onClick={() => setCurrency(selectedCurrency === Currency.USD ? Currency.ILS : Currency.USD)}
                className="flex items-center px-3 py-2 rounded-md bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors duration-200"
              >
                {selectedCurrency === Currency.USD ? (
                  <DollarSignIcon size={16} className="mr-1" />
                ) : (
                  <span className="mr-1">₪</span>
                )}
                <span>{selectedCurrency}</span>
              </button>
            </div>

            {/* Theme toggle */}
            <div className="relative inline-flex items-center">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 focus:outline-none transition-colors duration-200"
                aria-label={theme === ThemeMode.DARK ? "Switch to light theme" : "Switch to dark theme"}
              >
                {theme === ThemeMode.DARK ? (
                  <MoonIcon size={20} />
                ) : (
                  <SunIcon size={20} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;