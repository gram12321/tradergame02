import { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import { Login } from '@/components/pages/login';
import { CompanyOverview } from '@/components/pages/company-overview';
import Finance from '@/components/pages/finance';
import { Profile } from '@/components/pages/profile';
import { Settings } from '@/components/pages/settings';
import { AdminDashboard } from '@/components/pages/adminDashboard';
import { Achievements } from '@/components/pages/achievements';
import { Highscores } from '@/components/pages/highscores';
import { Facilities } from '@/components/pages/facilities';
import { FacilityDetail } from '@/components/pages/facility-detail';
import { Marketplace } from '@/components/pages/marketplace';
import { setCurrentCompanyForNotifications, notificationService, initializeGameState, cleanupGameState } from '@/lib/services/core';
import { useCompany } from '@/hooks';
import type { Facility } from '@/lib/types/types';

function App() {
  // Initialize game state from database on mount
  useEffect(() => {
    initializeGameState().catch((error) => {
      console.error('Failed to initialize game state:', error);
    });

    // Cleanup on unmount
    return () => {
      cleanupGameState();
    };
  }, []);
  const [currentPage, setCurrentPage] = useState('login');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
  const isAdmin = true; // TODO: Get from auth context

  // Use the useCompany hook for real-time company updates
  const { company: currentCompany } = useCompany(selectedCompanyId);

  const handleCompanySelected = (company: any) => {
    setSelectedCompanyId(company.id);
    setCurrentPage('company-overview');
    
    // Initialize notification system for this company
    if (company?.name) {
      setCurrentCompanyForNotifications(company.name);
      notificationService.setCompanyName(company.name);
      notificationService.ensureInitialized(company.name);
    }
  };

  const handleBackToLogin = () => {
    setSelectedCompanyId(null);
    setCurrentPage('login');
    
    // Clear notification system when logging out
    setCurrentCompanyForNotifications('');
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const handleTimeAdvance = () => {
    // Called after time advance
  };

  const renderCurrentPage = () => {
    if (!currentCompany && currentPage !== 'login' && currentPage !== 'highscores') {
      return <Login onCompanySelected={handleCompanySelected} />;
    }

    switch (currentPage) {
      case 'login':
        return <Login onCompanySelected={handleCompanySelected} />;
      case 'company-overview':
      case 'dashboard':
        return currentCompany ? (
          <CompanyOverview onNavigate={handleNavigate} />
        ) : (
          <Login onCompanySelected={handleCompanySelected} />
        );
      case 'finance':
        return <Finance currentCompany={currentCompany} />;
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
      case 'facilities':
        return (
          <Facilities
            currentCompany={currentCompany}
            onFacilitySelect={(facilityId) => {
              setSelectedFacilityId(facilityId);
              setCurrentPage('facility-detail');
            }}
            onBack={() => setCurrentPage('company-overview')}
          />
        );
      case 'facility-detail':
        return selectedFacilityId ? (
          <FacilityDetail
            facilityId={selectedFacilityId}
            currentCompany={currentCompany}
            onBack={() => {
              setSelectedFacilityId(null);
              setCurrentPage('facilities');
            }}
          />
        ) : (
          <Facilities
            currentCompany={currentCompany}
            onFacilitySelect={(facilityId) => {
              setSelectedFacilityId(facilityId);
              setCurrentPage('facility-detail');
            }}
            onBack={() => setCurrentPage('company-overview')}
          />
        );
      case 'marketplace':
        return (
          <Marketplace
            currentCompany={currentCompany}
            onBack={() => setCurrentPage('company-overview')}
          />
        );
      default:
        return currentCompany ? <CompanyOverview onNavigate={handleNavigate} /> : <Login onCompanySelected={handleCompanySelected} />;
    }
  };

  // Show login page if no company is selected
  if (!currentCompany && currentPage === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
        <Login onCompanySelected={handleCompanySelected} />
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
        currentCompany={currentCompany}
        facilities={facilities}
        onFacilitiesUpdate={setFacilities}
        isAdmin={isAdmin}
      />

      <main className="flex-1 px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6 mx-auto w-full max-w-7xl">
        {renderCurrentPage()}
      </main>
    </div>
  );
}

export default App;
