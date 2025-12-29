import { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import CompanyOverview from './components/pages/CompanyOverview';
import Finance from './components/pages/Finance';
import { Profile } from './components/pages/Profile';
import { Settings } from './components/pages/Settings';
import { AdminDashboard } from './components/pages/AdminDashboard';
import { Achievements } from './components/pages/Achievements';
import { Login } from './components/pages/Login';
import { Highscores } from './components/pages/Highscores';
import { Toaster } from './components/ui/shadCN/toaster';
import { Company } from '@/lib/database';
import { setActiveCompany, resetGameState, getCurrentCompany } from './lib/services/core/gameState';
import { Analytics } from '@vercel/analytics/react';

function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [isGameInitialized, setIsGameInitialized] = useState(false);
  
  useEffect(() => {
    const existingCompany = getCurrentCompany();
    if (existingCompany) {
      setCurrentCompany(existingCompany);
      setCurrentPage('company-overview');
      setIsGameInitialized(true);
      return;
    }

    setCurrentPage('login');
  }, []);

  const handleCompanySelected = async (company: Company) => {
    try {
      await setActiveCompany(company);
      setCurrentCompany(company);
      setCurrentPage('company-overview');
      setIsGameInitialized(true);
    } catch (error) {
      console.error('Error setting active company:', error);
    }
  };


  const handleBackToLogin = () => {
    resetGameState();
    setCurrentCompany(null);
    setCurrentPage('login');
    setIsGameInitialized(false);
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const handleTimeAdvance = () => {
  };


  const renderCurrentPage = () => {
    if (!currentCompany && currentPage !== 'login' && currentPage !== 'highscores') {
      return <Login onCompanySelected={handleCompanySelected} />;
    }

    switch (currentPage) {
      case 'login':
        return <Login onCompanySelected={handleCompanySelected} />;
      case 'company-overview':
        return currentCompany ? (
          <CompanyOverview 
            onNavigate={handleNavigate}
          />
        ) : (
          <Login onCompanySelected={handleCompanySelected} />
        );
      case 'dashboard':
        return <CompanyOverview onNavigate={setCurrentPage} />;
      case 'finance':
        return <Finance />;
      case 'profile':
        return (
          <Profile 
            currentCompany={currentCompany}
            onCompanySelected={handleCompanySelected}
            onBackToLogin={handleBackToLogin}
          />
        );
      case 'settings':
        return (
          <Settings 
            currentCompany={currentCompany}
            onBack={() => setCurrentPage('company-overview')}
            onSignOut={handleBackToLogin}
          />
        );
      case 'admin':
        return (
          <AdminDashboard 
            onBack={() => setCurrentPage('company-overview')}
            onNavigateToLogin={handleBackToLogin}
          />
        );
      case 'achievements':
        return (
          <Achievements
            currentCompany={currentCompany}
            onBack={() => setCurrentPage('company-overview')}
          />
        );
      case 'highscores':
        return (
          <Highscores 
            currentCompanyName={currentCompany?.name}
            onBack={() => setCurrentPage(currentCompany ? 'company-overview' : 'login')}
          />
        );
      default:
        return currentCompany ? <CompanyOverview onNavigate={handleNavigate} /> : <Login onCompanySelected={handleCompanySelected} />;
    }
  };

  // Show login page if no company is selected
  if (!isGameInitialized && currentPage === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
        <Login onCompanySelected={handleCompanySelected} />
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      <Header
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onTimeAdvance={handleTimeAdvance}
        onBackToLogin={handleBackToLogin}
      />

      <main className="flex-1 px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6 mx-auto w-full max-w-7xl">
        {renderCurrentPage()}
      </main>

      <Toaster />

      {/* Vercel Analytics */}
      <Analytics />
    </div>
  );
}

export default App;
