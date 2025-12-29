import { useState } from 'react';
import { useLoadingState } from '@/hooks';
import { SimpleCard, Button, Label, Input, Tabs, TabsContent, TabsList, TabsTrigger, Card, CardContent, CardDescription, CardHeader, CardTitle, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui';
import { Settings, AlertTriangle, Trash2 } from 'lucide-react';
import { PageProps, NavigationProps } from '../../lib/types/UItypes';
import {
  adminSetGoldToCompany, adminClearAllHighscores, adminClearCompanyValueHighscores, adminClearAllCompanies, adminFullDatabaseReset, adminSetGameDate
} from '@/lib/services';
import { GAME_INITIALIZATION } from '@/lib/constants';
import { DAYS_PER_MONTH, MONTHS_PER_YEAR } from '@/lib/constants/constants';

interface AdminDashboardProps extends PageProps, NavigationProps {
}

export function AdminDashboard({ onBack, onNavigateToLogin }: AdminDashboardProps) {
  const { isLoading, withLoading } = useLoadingState();
  const [goldAmount, setGoldAmount] = useState('10000');
  const [gameDay, setGameDay] = useState(String(GAME_INITIALIZATION.STARTING_DAY));
  const [gameMonth, setGameMonth] = useState(String(GAME_INITIALIZATION.STARTING_MONTH));
  const [gameYear, setGameYear] = useState(String(GAME_INITIALIZATION.STARTING_YEAR));

  const dayOptions = Array.from({ length: DAYS_PER_MONTH }, (_, index) => index + 1);
  const monthOptions = Array.from({ length: MONTHS_PER_YEAR }, (_, index) => index + 1);

  // Cheat functions (for development/testing)
  const handleSetGold = () => withLoading(async () => {
    const amount = parseFloat(goldAmount) || 10000;
    await adminSetGoldToCompany(amount);
  });


  const handleSetGameDate = () => withLoading(async () => {
    const parsedDay = Number.parseInt(gameDay, 10);
    const safeDay = Number.isNaN(parsedDay)
      ? GAME_INITIALIZATION.STARTING_DAY
      : Math.min(Math.max(parsedDay, 1), DAYS_PER_MONTH);

    const parsedMonth = Number.parseInt(gameMonth, 10);
    const safeMonth = Number.isNaN(parsedMonth)
      ? GAME_INITIALIZATION.STARTING_MONTH
      : Math.min(Math.max(parsedMonth, 1), MONTHS_PER_YEAR);

    const parsedYear = Number.parseInt(gameYear, 10);
    const minimumYear = GAME_INITIALIZATION.STARTING_YEAR;
    const safeYear = Number.isNaN(parsedYear)
      ? minimumYear
      : Math.max(parsedYear, minimumYear);

    await adminSetGameDate({
      day: safeDay,
      month: safeMonth,
      year: safeYear
    });

    setGameDay(String(safeDay));
    setGameMonth(String(safeMonth));
    setGameYear(String(safeYear));
  });

  const handleClearAllHighscores = () => withLoading(async () => {
    await adminClearAllHighscores();
  });

  const handleClearCompanyValueHighscores = () => withLoading(async () => {
    await adminClearCompanyValueHighscores();
  });

  // Database cleanup functions
  const handleClearAllAccounts = () => withLoading(async () => {
    await adminClearAllCompanies();
    
    // Clear localStorage for previously used companies (they no longer exist)
    try {
      localStorage.removeItem('previouslyUsedCompanies');
      localStorage.removeItem('lastCompanyName');
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
    
    // Navigate to login and refresh browser
    if (onNavigateToLogin) {
      onNavigateToLogin();
    }
    // Force a full page reload to ensure clean state
    setTimeout(() => {
      window.location.reload();
    }, 500);
  });

  const handleFullDatabaseReset = () => withLoading(async () => {
    await adminFullDatabaseReset();
    
    // Clear localStorage for previously used companies (they no longer exist)
    try {
      localStorage.removeItem('previouslyUsedCompanies');
      localStorage.removeItem('lastCompanyName');
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
    
    // Navigate to login and refresh browser
    if (onNavigateToLogin) {
      onNavigateToLogin();
    }
    // Force a full page reload to ensure clean state
    setTimeout(() => {
      window.location.reload();
    }, 500);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Settings className="h-8 w-8" />
            Admin Dashboard
          </h2>
          <p className="text-muted-foreground mt-1">
            Advanced game management and administrative tools
          </p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
        )}
      </div>


      <Tabs defaultValue="database" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="cheats">Cheats</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
        </TabsList>

        {/* Database Management */}
        <TabsContent value="database">
          <div className="space-y-6">

            {/* Game Data Cleanup */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SimpleCard
                title="Account Management"
                description="Clear all companies"
              >
                <Button
                  variant="destructive"
                  onClick={handleClearAllAccounts}
                  disabled={isLoading}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Accounts
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Removes all companies from the database.
                </p>
              </SimpleCard>

              <SimpleCard
                title="Highscores Management"
                description="Manage global leaderboards and highscore data"
              >
                <Button
                  variant="destructive"
                  onClick={handleClearAllHighscores}
                  disabled={isLoading}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Highscores
                </Button>

                <Button
                  variant="outline"
                  onClick={handleClearCompanyValueHighscores}
                  disabled={isLoading}
                  className="w-full"
                >
                  Clear Company Value Highscores
                </Button>
              </SimpleCard>
            </div>


            {/* Full Database Reset */}
            <Card className="border-destructive bg-destructive/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  NUCLEAR OPTION
                </CardTitle>
                <CardDescription className="text-destructive/80">
                  Complete database wipe - removes ALL data from ALL tables
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={handleFullDatabaseReset}
                  disabled={isLoading}
                  className="w-full"
                >
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  FULL DATABASE RESET
                </Button>
                <p className="text-xs text-destructive/70 mt-2 text-center">
                  This will delete EVERYTHING and cannot be undone!
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>


        {/* Cheat Tools */}
        <TabsContent value="cheats">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SimpleCard
              title="Financial Cheats"
              description="Set money and resources for the active company"
            >
              <div className="space-y-2">
                <Label htmlFor="goldAmount">Company Gold Amount to Set</Label>
                <Input
                  id="goldAmount"
                  type="number"
                  value={goldAmount}
                  onChange={(e) => setGoldAmount(e.target.value)}
                  placeholder="10000"
                />
                <Button
                  onClick={handleSetGold}
                  disabled={isLoading}
                  className="w-full"
                >
                  Set Gold for Active Company
                </Button>
              </div>

            </SimpleCard>

            <SimpleCard
              title="Game Date Control"
              description="Adjust the current in-game timeline"
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="game-day-select">Day</Label>
                  <Select
                    value={gameDay}
                    onValueChange={(value) => setGameDay(value)}
                  >
                    <SelectTrigger id="game-day-select">
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {dayOptions.map(day => (
                        <SelectItem key={day} value={String(day)}>
                          Day {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="game-month-select">Month</Label>
                  <Select
                    value={gameMonth}
                    onValueChange={(value) => setGameMonth(value)}
                  >
                    <SelectTrigger id="game-month-select">
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {monthOptions.map(month => (
                        <SelectItem key={month} value={String(month)}>
                          Month {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="game-year-input">Year</Label>
                  <Input
                    id="game-year-input"
                    type="number"
                    value={gameYear}
                    onChange={(e) => setGameYear(e.target.value)}
                    min={GAME_INITIALIZATION.STARTING_YEAR}
                  />
                </div>

                <Button
                  onClick={handleSetGameDate}
                  disabled={isLoading}
                  className="w-full"
                >
                  Set Game Date
                </Button>
              </div>
            </SimpleCard>

          </div>
        </TabsContent>

        {/* Development Tools */}
        <TabsContent value="tools">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SimpleCard
              title="Tools"
              description="Development and testing tools"
            >
              <p className="text-xs text-gray-500">
                Tools will be added here as needed
              </p>
            </SimpleCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}