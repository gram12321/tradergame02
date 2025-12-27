import { useState, useEffect } from 'react';
import { useLoadingState } from '@/hooks';
import { Button, Input, Label, Card, CardContent, CardDescription, CardHeader, CardTitle, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, ScrollArea, StartingConditionsModal } from '../ui';
import { Building2, Trophy, User, UserPlus } from 'lucide-react';
import { companyService, highscoreService, createNewCompany, authService } from '@/lib/services';
import { type Company, type HighscoreEntry, type AuthUser, insertUser } from '@/lib/database';
import { formatNumber } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import readmeContent from '../../../readme.md?raw';
import versionLogContent from '../../../docs/versionlog.md?raw';
import { CompanyProps } from '../../lib/types/UItypes';

interface LoginProps extends CompanyProps {
  onCompanySelected: (company: Company) => void;
}

export function Login({ onCompanySelected }: LoginProps) {
  // State
  const { isLoading, withLoading } = useLoadingState();
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
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

  useEffect(() => {
    // Set up auth state listener
    const unsubscribe = authService.onAuthStateChange((user) => {
      setCurrentUser(user);
    });
    
    loadHighscores();
    
    return unsubscribe;
  }, []);

  // Load company when user state changes (1:1 relationship)
  useEffect(() => {
    if (currentUser) {
      loadUserCompany();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const loadUserCompany = async () => {
    if (!currentUser) return;
    
    // 1:1 relationship - each user has exactly one company
    const company = await companyService.getUserCompany(currentUser.id);
    
    if (company) {
      setCurrentCompany(company);
      
      // Attempt auto-login to last active company if it belongs to this user
      try {
        const lastCompanyId = localStorage.getItem('lastCompanyId');
        if (lastCompanyId === company.id) {
          onCompanySelected(company);
        }
      } catch {}
    } else {
      // No company exists for this user yet
      setCurrentCompany(null);
    }
  };

  const loadHighscores = () => withLoading(async () => {
    const companyValue = await highscoreService.getHighscores('company_value', 5);

    setHighscores({
      company_value: companyValue
    });
  });

  const handleCreateUser = (e: React.FormEvent) => withLoading(async () => {
    e.preventDefault();
    setError('');

    if (!newUserName.trim()) {
      setError('Please enter a username');
      return;
    }

    const result = await insertUser({
      name: newUserName.trim(),
      created_at: new Date().toISOString()
    });

    if (result.success && result.data) {
      const newUser: AuthUser = {
        id: result.data.id,
        email: result.data.email,
        name: result.data.name,
        avatar: result.data.avatar,
        avatarColor: result.data.avatar_color,
        createdAt: new Date(result.data.created_at),
        updatedAt: new Date(result.data.updated_at)
      };
      
      // Auto-create company for user (1:1 relationship - user name = company name)
      const company = await createNewCompany(newUser.id, newUser.name);
      
      setNewUserName('');
      setShowCreateUser(false);
      setCurrentUser(newUser);
      
      if (company) {
        // Store pending company and show starting conditions modal
        setPendingCompany(company);
        setShowStartingConditions(true);
      }
    } else {
      setError(result.error || 'Failed to create user');
    }
  });

  const handleCreateCompany = async () => {
    if (!currentUser) {
      setError('Please create a user first (User=Company relationship requires a user)');
      return;
    }

    // User=Company: company name = user name (1:1 relationship)
    const company = await createNewCompany(currentUser.id, currentUser.name);

    if (company) {
      setCurrentCompany(company);
      
      // Store pending company and show starting conditions modal
      setPendingCompany(company);
      setShowStartingConditions(true);
    } else {
      setError('Failed to create company');
    }
  };
  
  const handleStartingConditionsComplete = async (startingMoney?: number) => {
    setShowStartingConditions(false);
    
    if (pendingCompany) {
      const companyToSelect = startingMoney !== undefined
        ? { ...pendingCompany, money: startingMoney }
        : pendingCompany;
 
       // Reload user company (1:1 relationship)
       if (currentUser) {
         await loadUserCompany();
       }
 
       // Select the company and navigate to game
       onCompanySelected(companyToSelect);
       setPendingCompany(null);
     }
  };

  const handleSelectCompany = (company: Company) => {
    onCompanySelected(company);
  };

  const handleDeleteCompany = (companyId: string, event: React.MouseEvent) => withLoading(async () => {
    event.stopPropagation(); // Prevent card click from triggering
    
    if (deletingCompany === companyId) {
      // Confirm delete - second click
      setError('');

      const result = await companyService.deleteCompany(companyId);
      
      if (result.success) {
        setDeletingCompany(null);
        setCurrentCompany(null);
        // Refresh the page to ensure clean state
        window.location.reload();
      } else {
        setError(result.error || 'Failed to delete company');
        setDeletingCompany(null);
      }
    } else {
      // First click - show confirmation state
      setDeletingCompany(companyId);
      
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
          <h1 className="text-xl font-bold mb-1 text-wine drop-shadow-lg">Welcome to Winemaker</h1>
          <p className="text-muted-foreground text-xs drop-shadow-md">
            Manage your wine empire and compete with other vintners
          </p>
          {currentUser && (
            <div className="mt-2 flex items-center justify-center gap-2 text-xs">
              <User className="h-3 w-3 text-wine" />
              <span className="text-wine font-medium">{currentUser.name}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl text-sm">
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-wine text-base">
                      <Building2 className="h-4 w-4" />
                      {currentUser ? 'My Company' : 'Get Started'}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {currentUser 
                        ? currentCompany 
                          ? 'Select your company to continue'
                          : 'Create your company to start playing'
                        : 'Create a user to get started'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 py-3">
                {/* Current User's Company */}
                {currentUser && currentCompany && (
                  <div className="mb-4">
                    <Card 
                      className="hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => handleSelectCompany(currentCompany)}
                    >
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium">{currentCompany.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              Day {currentCompany.currentDay}, Month {currentCompany.currentMonth}, {currentCompany.currentYear}
                            </p>
                            <p className="text-xs">
                              {formatNumber(currentCompany.money, { currency: true, decimals: 0 })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => handleDeleteCompany(currentCompany.id, e)}
                              className={`p-1 rounded hover:bg-destructive/10 transition-colors text-xs ${
                                deletingCompany === currentCompany.id ? 'text-destructive animate-pulse bg-destructive/10' : 'text-muted-foreground'
                              }`}
                              title={deletingCompany === currentCompany.id ? 'Click again to confirm deletion' : 'Delete company'}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Create User */}
                {!currentUser && (
                  <div className="pt-3 border-t">
                    {!showCreateUser ? (
                      <Button 
                        onClick={() => setShowCreateUser(true)}
                        className="w-full border-wine text-wine hover:bg-wine hover:text-white text-sm"
                        variant="outline"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Create New User & Company
                      </Button>
                    ) : (
                      <form onSubmit={handleCreateUser} className="space-y-3">
                        <div>
                          <Label htmlFor="newUserName">User Name (will also be your Company Name)</Label>
                          <Input
                            id="newUserName"
                            value={newUserName}
                            onChange={(e) => setNewUserName(e.target.value)}
                            placeholder="Enter your username"
                            required
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            type="submit" 
                            disabled={isLoading}
                            className="bg-wine hover:bg-wine-dark text-white text-sm"
                          >
                            {isLoading ? 'Creating...' : 'Create User & Company'}
                          </Button>
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={() => {
                              setShowCreateUser(false);
                              setNewUserName('');
                            }}
                            className="border-wine text-wine hover:bg-wine hover:text-white text-sm"
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {/* Create Company (if user exists but no company) */}
                {currentUser && !currentCompany && (
                  <div className="pt-3 border-t">
                    <Button 
                      onClick={handleCreateCompany}
                      disabled={isLoading}
                      className="w-full bg-wine hover:bg-wine-dark text-white text-sm"
                    >
                      {isLoading ? 'Creating...' : 'Create Company'}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Your company will be named: <strong>{currentUser.name}</strong>
                    </p>
                  </div>
                )}

                {error && (
                  <div className="mt-3 text-xs text-destructive bg-destructive/10 p-2.5 rounded-md">
                    {error}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
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
                  <p>• Create a user to start</p>
                  <p>• Each user has one company</p>
                  <p>• Your username is your company name</p>
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
          companyId={pendingCompany.id}
          companyName={pendingCompany.name}
          onComplete={handleStartingConditionsComplete}
        />
      )}
    </div>
  );
}
