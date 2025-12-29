import { useState, useEffect } from 'react';
import { useLoadingState } from '@/hooks';
import { Button, Input, Label, Card, CardContent, CardDescription, CardHeader, CardTitle, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, ScrollArea, StartingConditionsModal } from '../ui';
import { Building2, Trophy } from 'lucide-react';
import { companyService, highscoreService, createNewCompany } from '@/lib/services';
import { type Company, type HighscoreEntry, getCompanyByName } from '@/lib/database';
import { formatNumber } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import readmeContent from '../../../readme.md?raw';
import versionLogContent from '../../../docs/versionlog.md?raw';
import { CompanyProps } from '../../lib/types/UItypes';

interface LoginProps extends CompanyProps {
  onCompanySelected: (company: Company) => void;
}

// localStorage keys
const PREVIOUSLY_USED_COMPANIES_KEY = 'previouslyUsedCompanies';
const LAST_COMPANY_NAME_KEY = 'lastCompanyName';

// Interface for previously used company info
interface PreviouslyUsedCompany {
  name: string;
  lastUsed: number; // timestamp
}

export function Login({ onCompanySelected }: LoginProps) {
  // State
  const { isLoading, withLoading } = useLoadingState();
  const [error, setError] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [previouslyUsedCompanies, setPreviouslyUsedCompanies] = useState<PreviouslyUsedCompany[]>([]);
  const [highscores, setHighscores] = useState<{
    company_value: HighscoreEntry[];
  }>({
    company_value: []
  });
  const [deletingCompany, setDeletingCompany] = useState<string | null>(null);
  const [isReadmeOpen, setIsReadmeOpen] = useState(false);
  const [isVersionLogOpen, setIsVersionLogOpen] = useState(false);
  const [showStartingConditions, setShowStartingConditions] = useState(false);
  const [pendingCompany, setPendingCompany] = useState<Company | null>(null);

  // Load previously used companies from localStorage
  const loadPreviouslyUsedCompanies = (): PreviouslyUsedCompany[] => {
    try {
      const stored = localStorage.getItem(PREVIOUSLY_USED_COMPANIES_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading previously used companies:', error);
    }
    return [];
  };

  // Save company to previously used list
  const addToPreviouslyUsed = (company: Company) => {
    try {
      const existing = loadPreviouslyUsedCompanies();
      // Remove if already exists
      const filtered = existing.filter(c => c.name !== company.name);
      // Add to front with current timestamp
      const updated = [
        { name: company.name, lastUsed: Date.now() },
        ...filtered
      ].slice(0, 10); // Keep only last 10
      
      localStorage.setItem(PREVIOUSLY_USED_COMPANIES_KEY, JSON.stringify(updated));
      setPreviouslyUsedCompanies(updated);
    } catch (error) {
      console.error('Error saving previously used company:', error);
    }
  };

  useEffect(() => {
    // Load previously used companies
    setPreviouslyUsedCompanies(loadPreviouslyUsedCompanies());
    
    loadHighscores();
  }, []);

  const loadHighscores = () => withLoading(async () => {
    const companyValue = await highscoreService.getHighscores('company_value', 5);

    setHighscores({
      company_value: companyValue
    });
  });

  const handleCreateCompany = (e: React.FormEvent) => withLoading(async () => {
    e.preventDefault();
    setError('');

    const companyName = newCompanyName.trim();
    if (!companyName) {
      setError('Please enter a company name');
      return;
    }

    // Check if company name already exists - treat as login if it does
    const existingCompany = await getCompanyByName(companyName);
    if (existingCompany) {
      // Company exists - treat as login
      addToPreviouslyUsed(existingCompany);
      localStorage.setItem(LAST_COMPANY_NAME_KEY, existingCompany.name);
      setNewCompanyName('');
      // Auto-select the company
      onCompanySelected(existingCompany);
      return;
    }

    // Company doesn't exist - create new company
    const company = await createNewCompany(companyName);
    
    setNewCompanyName('');
    
    if (company) {
      // Add to previously used list
      addToPreviouslyUsed(company);
      localStorage.setItem(LAST_COMPANY_NAME_KEY, company.name);
      
      // Store pending company and show starting conditions modal
      setPendingCompany(company);
      setShowStartingConditions(true);
    } else {
      setError('Failed to create company');
    }
  });

  const handleStartingConditionsComplete = async (startingMoney?: number) => {
    setShowStartingConditions(false);
    
    if (pendingCompany) {
      const companyToSelect = startingMoney !== undefined
        ? { ...pendingCompany, money: startingMoney }
        : pendingCompany;
 
 
       // Select the company and navigate to game
       onCompanySelected(companyToSelect);
       setPendingCompany(null);
     }
  };

  const handleSelectCompany = (company: Company) => {
    addToPreviouslyUsed(company);
    localStorage.setItem(LAST_COMPANY_NAME_KEY, company.name);
    onCompanySelected(company);
  };

      const handleSelectPreviouslyUsedCompany = (companyName: string) => withLoading(async () => {
    setError('');
    const company = await companyService.getCompany(companyName);
    if (company) {
      handleSelectCompany(company);
    } else {
      setError('Company not found');
      // Remove from previously used list if it doesn't exist
      const updated = previouslyUsedCompanies.filter(c => c.name !== companyName);
      setPreviouslyUsedCompanies(updated);
      try {
        localStorage.setItem(PREVIOUSLY_USED_COMPANIES_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Error updating previously used companies:', error);
      }
    }
  });

  const handleDeleteCompany = (companyName: string, event: React.MouseEvent) => withLoading(async () => {
    event.stopPropagation(); // Prevent card click from triggering
    
    if (deletingCompany === companyName) {
      // Confirm delete - second click
      setError('');

      const result = await companyService.deleteCompany(companyName);
      
      if (result.success) {
        setDeletingCompany(null);
        
        // Remove from previously used companies list
        const updated = previouslyUsedCompanies.filter(c => c.name !== companyName);
        setPreviouslyUsedCompanies(updated);
        try {
          localStorage.setItem(PREVIOUSLY_USED_COMPANIES_KEY, JSON.stringify(updated));
        } catch (error) {
          console.error('Error updating previously used companies:', error);
        }
        
        // Clear lastCompanyName if this was the last company
        try {
          const lastCompanyName = localStorage.getItem(LAST_COMPANY_NAME_KEY);
          if (lastCompanyName === companyName) {
            localStorage.removeItem(LAST_COMPANY_NAME_KEY);
          }
        } catch (error) {
          console.error('Error clearing lastCompanyName:', error);
        }
        
        // Refresh the page to ensure clean state
        window.location.reload();
      } else {
        setError(result.error || 'Failed to delete company');
        setDeletingCompany(null);
      }
    } else {
      // First click - show confirmation state
      setDeletingCompany(companyName);
      
      // Auto-reset confirmation state after 5 seconds
      setTimeout(() => {
        setDeletingCompany(null);
      }, 5000);
    }
  });

  const renderHighscoreTable = (scores: HighscoreEntry[], title: string) => (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
      <CardContent className="p-3">
        <div className="font-semibold text-sm mb-2 flex items-center gap-1 text-wine">
          <Trophy className="h-4 w-4" />
          {title}
        </div>
        {isLoading ? (
          <div className="text-xs text-muted-foreground">Loading...</div>
        ) : scores.length === 0 ? (
          <div className="text-xs text-muted-foreground">No data</div>
        ) : (
          <div className="space-y-1">
            {scores.map((score, idx) => (
              <div key={score.id} className="flex justify-between text-xs">
                <span className="truncate max-w-[100px]">
                  {idx + 1}. {score.companyName}
                </span>
                <span className="font-medium">
                  {formatNumber(score.scoreValue, { currency: true, decimals: 0 })}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div 
      className="min-h-screen flex flex-col justify-center items-center p-3 text-sm"
      style={{
        backgroundImage: 'url("/assets/pic/loginbg.webp")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Main Container */}
      <div className="w-full max-w-2xl bg-white/10 backdrop-blur-sm rounded-xl p-4 shadow-xl border border-white/20">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-xl font-bold mb-1 text-wine drop-shadow-lg">Welcome to TraderGame</h1>
          <p className="text-muted-foreground text-xs drop-shadow-md">
            Enter your company name to login or create a new company
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Main Login Interface */}
          <div className="lg:col-span-2">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl text-sm">
              <CardHeader className="py-3 px-4">
                <CardTitle className="flex items-center gap-2 text-wine text-base">
                  <Building2 className="h-4 w-4" />
                  Login / Create Company
                </CardTitle>
                <CardDescription className="text-xs">
                  Enter your company name to login or create a new company
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 py-3">
                {/* Previously Used Companies - Prominently displayed */}
                {previouslyUsedCompanies.length > 0 && (
                  <div className="mb-4 pb-4 border-b">
                    <Label className="text-xs font-semibold text-wine mb-2 block">Previously Used Companies</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {previouslyUsedCompanies.map((prevCompany) => (
                        <Card
                          key={prevCompany.name}
                          className="hover:bg-accent/50 transition-colors border-wine/20"
                        >
                          <CardContent className="p-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <div 
                                className="flex-1 cursor-pointer"
                                onClick={() => handleSelectPreviouslyUsedCompany(prevCompany.name)}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium truncate">{prevCompany.name}</span>
                                  <span className="text-xs text-muted-foreground ml-2">
                                    {new Date(prevCompany.lastUsed).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={(e) => handleDeleteCompany(prevCompany.name, e)}
                                className={`p-1 rounded hover:bg-destructive/10 transition-colors text-xs flex-shrink-0 ${
                                  deletingCompany === prevCompany.name ? 'text-destructive animate-pulse bg-destructive/10' : 'text-muted-foreground'
                                }`}
                                title={deletingCompany === prevCompany.name ? 'Click again to confirm deletion' : 'Delete company'}
                              >
                                🗑️
                              </button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Login/Create Form - Always visible */}
                <form onSubmit={handleCreateCompany} className="space-y-3">
                  <div>
                    <Label htmlFor="newCompanyName">Company Name</Label>
                    <Input
                      id="newCompanyName"
                      value={newCompanyName}
                      onChange={(e) => setNewCompanyName(e.target.value)}
                      placeholder="Enter company name (login if exists)"
                      required
                      autoFocus
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      If the company exists, you'll be logged in. Otherwise, a new company will be created.
                    </p>
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-wine hover:bg-wine-dark text-white text-sm"
                  >
                    {isLoading ? 'Processing...' : 'Login / Create Company'}
                  </Button>
                </form>

                {error && (
                  <div className="mt-3 text-xs text-destructive bg-destructive/10 p-2.5 rounded-md">
                    {error}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Highscores and Info */}
          <div className="space-y-3">
            {/* Highscores */}
            <div className="grid grid-cols-1 gap-2.5">
              {renderHighscoreTable(highscores.company_value, 'Top Companies')}
            </div>

            {/* Info */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl text-sm">
              <CardContent className="p-3">
                <h3 className="font-medium mb-1.5 text-wine">Getting Started</h3>
                <div className="text-xs text-muted-foreground space-y-1.5">
                  <p>• Enter a company name to login or create</p>
                  <p>• Compete on the global leaderboards</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Links Container */}
        <div className="mt-4 flex items-center justify-center gap-3 text-xs">
          <a 
            href="https://trello.com/b/sipiTJrV/winemaker" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/80 hover:text-white transition-colors flex items-center gap-1"
            title="View Development Roadmap"
          >
            <span className="text-base">📋</span>
            <span>Trello Board</span>
          </a>
          
          <button 
            onClick={() => setIsReadmeOpen(true)}
            className="text-white/80 hover:text-white transition-colors flex items-center gap-1"
            title="View technical README"
          >
            <span className="text-base">📖</span>
            <span>README</span>
          </button>

          <button 
            onClick={() => setIsVersionLogOpen(true)}
            className="text-white/80 hover:text-white transition-colors flex items-center gap-1"
            title="View Version Log"
          >
            <span className="text-base">📝</span>
            <span>Version Log</span>
          </button>
        </div>
      </div>

      {/* README Modal */}
      <Dialog open={isReadmeOpen} onOpenChange={setIsReadmeOpen}>
        <DialogContent className="max-w-2xl h-[70vh] flex flex-col text-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Winemaker - Project README</DialogTitle>
            <DialogDescription className="text-xs">
              Comprehensive overview of the Winemaker game project
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 pr-3">
            <div className="prose dark:prose-invert max-w-none text-sm">
              <ReactMarkdown>{readmeContent}</ReactMarkdown>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Version Log Modal */}
      <Dialog open={isVersionLogOpen} onOpenChange={setIsVersionLogOpen}>
        <DialogContent className="max-w-2xl h-[70vh] flex flex-col text-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Winemaker - Version Log</DialogTitle>
            <DialogDescription className="text-xs">
              Project development history and roadmap
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 pr-3">
            <div className="prose dark:prose-invert max-w-none text-sm">
              <ReactMarkdown>{versionLogContent}</ReactMarkdown>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Starting Conditions Modal */}
      {pendingCompany && (
        <StartingConditionsModal
          isOpen={showStartingConditions}
          onClose={() => {
            setShowStartingConditions(false);
            setPendingCompany(null);
          }}
          companyName={pendingCompany.name}
          onComplete={handleStartingConditionsComplete}
        />
      )}
    </div>
  );
}
