import { useState, useEffect } from 'react';
import { Building2, Trophy } from 'lucide-react';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/shadCN/input';
import { Label } from '@/components/ui/shadCN/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shadCN/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/shadCN/dialog';
import { ScrollArea } from '@/components/ui/shadCN/scroll-area';
import { getOrCreateCompany } from '@/lib/services/user/companyService';
import { getCompanyByName, type Company } from '@/lib/database/core/companiesDB';
import { useLoadingState } from '@/hooks/useLoadingState';
import ReactMarkdown from 'react-markdown';
import readmeContent from '../../../readme.md?raw';
import versionLogContent from '../../../docs/versionlog.md?raw';

interface LoginProps {
  onCompanySelected?: (company: Company) => void;
}

// localStorage keys
const PREVIOUSLY_USED_COMPANIES_KEY = 'previouslyUsedCompanies';

// Interface for previously used company info
interface PreviouslyUsedCompany {
  name: string;
  lastUsed: number; // timestamp
}

export function Login({ onCompanySelected }: LoginProps) {
  const [companyName, setCompanyName] = useState('');
  const { isLoading, withLoading } = useLoadingState();
  const [error, setError] = useState<string | null>(null);
  const [previouslyUsedCompanies, setPreviouslyUsedCompanies] = useState<PreviouslyUsedCompany[]>([]);
  const [deletingCompany, setDeletingCompany] = useState<string | null>(null);
  const [isReadmeOpen, setIsReadmeOpen] = useState(false);
  const [isVersionLogOpen, setIsVersionLogOpen] = useState(false);

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
    // Load previously used companies on mount
    setPreviouslyUsedCompanies(loadPreviouslyUsedCompanies());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = companyName.trim();
    if (!trimmedName) {
      setError('Please enter a company name');
      return;
    }

    const company = await withLoading(async () => {
      // Get or create company
      const result = await getOrCreateCompany(trimmedName);
      
      // Add to previously used list
      addToPreviouslyUsed(result);
      
      // Clear form
      setCompanyName('');

      // Navigate to company overview
      if (onCompanySelected) {
        onCompanySelected(result);
      }
      
      return result;
    });

    if (!company) {
      setError('Failed to login. Please try again.');
    }
  };

  const handleSelectPreviouslyUsedCompany = async (name: string) => {
    setError(null);

    const company = await withLoading(async () => {
      const result = await getCompanyByName(name);
      
      if (result) {
        addToPreviouslyUsed(result);
        if (onCompanySelected) {
          onCompanySelected(result);
        }
        return result;
      } else {
        setError('Company not found');
        // Remove from previously used list if it doesn't exist
        const updated = previouslyUsedCompanies.filter(c => c.name !== name);
        setPreviouslyUsedCompanies(updated);
        localStorage.setItem(PREVIOUSLY_USED_COMPANIES_KEY, JSON.stringify(updated));
        return null;
      }
    });

    if (!company) {
      setError('Failed to load company');
    }
  };

  const handleDeleteCompany = async (name: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (deletingCompany === name) {
      // Confirm delete - second click
      setError(null);

      await withLoading(async () => {
        // Delete from database (we'll implement this)
        // For now, just remove from localStorage
        const updated = previouslyUsedCompanies.filter(c => c.name !== name);
        setPreviouslyUsedCompanies(updated);
        localStorage.setItem(PREVIOUSLY_USED_COMPANIES_KEY, JSON.stringify(updated));
        
        setDeletingCompany(null);
      });
    } else {
      // First click - show confirmation state
      setDeletingCompany(name);
      
      // Auto-reset confirmation state after 5 seconds
      setTimeout(() => {
        setDeletingCompany(null);
      }, 5000);
    }
  };

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
                                disabled={isLoading}
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
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Enter company name (login if exists)"
                      required
                      autoFocus
                      disabled={isLoading}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      If the company exists, you'll be logged in. Otherwise, a new company will be created.
                    </p>
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isLoading || !companyName.trim()}
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
            {/* Top Companies - Placeholder */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-3">
                <div className="font-semibold text-sm mb-2 flex items-center gap-1 text-wine">
                  <Trophy className="h-4 w-4" />
                  Top Companies
                </div>
                <div className="text-xs text-muted-foreground">
                  No data
                </div>
              </CardContent>
            </Card>

            {/* Getting Started - Placeholder */}
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
    </div>
  );
}

