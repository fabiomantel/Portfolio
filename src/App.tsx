import {useState} from 'react';
import {ThemeProvider} from './context/ThemeContext';
import {PortfolioProvider} from './context/PortfolioContext';
import {AuthProvider} from './context/AuthContext';
import Navbar from './components/navigation/Navbar';
import Dashboard from './components/dashboard/Dashboard';
import AssetList from './components/assets/AssetList';
import AssetForm from './components/forms/AssetForm';
import RsuTracker from './components/equity/RsuTracker';
import EsppTracker from './components/equity/EsppTracker';
import RsuForm from './components/forms/RsuForm';
import EsppForm from './components/forms/EsppForm';
import { RSU, ESPP } from './types';

function App() {
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [showRsuForm, setShowRsuForm] = useState(false);
  const [showEsppForm, setShowEsppForm] = useState(false);
  const [editingRsu, setEditingRsu] = useState<RSU | undefined>(undefined);
  const [editingEspp, setEditingEspp] = useState<ESPP | undefined>(undefined);

  const handleEditRsu = (rsu: RSU) => {
    setEditingRsu(rsu);
    setShowRsuForm(true);
  };

  const handleEditEspp = (espp: ESPP) => {
    setEditingEspp(espp);
    setShowEsppForm(true);
  };

  const handleCloseRsuForm = () => {
    setShowRsuForm(false);
    setEditingRsu(undefined);
  };

  const handleCloseEsppForm = () => {
    setShowEsppForm(false);
    setEditingEspp(undefined);
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        <PortfolioProvider>
          <div className="min-h-screen bg-gray-100 dark:bg-slate-900 transition-colors duration-200">
            <Navbar />
            
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <Dashboard />
              <AssetList onAddAsset={() => setShowAssetForm(true)} />
              <RsuTracker 
                onAddRsu={() => setShowRsuForm(true)}
                onEditRsu={handleEditRsu}
              />
              <EsppTracker 
                onAddEspp={() => setShowEsppForm(true)}
                onEditEspp={handleEditEspp}
              />
              
              {showAssetForm && (
                <AssetForm onClose={() => setShowAssetForm(false)} />
              )}
              
              {showRsuForm && (
                <RsuForm 
                  onClose={handleCloseRsuForm}
                  rsu={editingRsu}
                  mode={editingRsu ? 'edit' : 'create'}
                />
              )}
              
              {showEsppForm && (
                <EsppForm 
                  onClose={handleCloseEsppForm}
                  espp={editingEspp}
                  mode={editingEspp ? 'edit' : 'create'}
                />
              )}
            </main>
          </div>
        </PortfolioProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;