import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { PortfolioProvider } from './context/PortfolioContext';
import Navbar from './components/navigation/Navbar';
import Dashboard from './components/dashboard/Dashboard';
import AssetList from './components/assets/AssetList';
import AssetForm from './components/forms/AssetForm';
import RsuTracker from './components/equity/RsuTracker';
import EsppTracker from './components/equity/EsppTracker';

function App() {
  const [showAssetForm, setShowAssetForm] = useState(false);

  return (
    <ThemeProvider>
      <PortfolioProvider>
        <div className="min-h-screen bg-gray-100 dark:bg-slate-900 transition-colors duration-200">
          <Navbar />
          
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Dashboard />
            <AssetList onAddAsset={() => setShowAssetForm(true)} />
            <RsuTracker onAddRsu={() => alert('RSU form would open here')} />
            <EsppTracker onAddEspp={() => alert('ESPP form would open here')} />
            
            {showAssetForm && (
              <AssetForm onClose={() => setShowAssetForm(false)} />
            )}
          </main>
        </div>
      </PortfolioProvider>
    </ThemeProvider>
  );
}

export default App;