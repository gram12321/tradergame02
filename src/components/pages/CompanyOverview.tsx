import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLoadingState } from '@/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from '../ui';
import { Building2, TrendingUp, Trophy, Calendar, BarChart3 } from 'lucide-react';
import { formatGameDate, formatNumber } from '@/lib/utils/utils';
import { useGameState } from '@/hooks';
import { getCurrentCompany, highscoreService } from '@/lib/services';
import { NavigationProps } from '../../lib/types/UItypes';
import { DAYS_PER_MONTH, MONTHS_PER_YEAR } from '@/lib/constants/timeConstants';

interface CompanyOverviewProps extends NavigationProps {
  // Inherits onNavigate from NavigationProps
}

const CompanyOverview: React.FC<CompanyOverviewProps> = ({ onNavigate }) => {
  const { isLoading, withLoading } = useLoadingState();
  const gameState = useGameState();
  const company = getCurrentCompany();
  
  const [ranking, setRanking] = useState<{ position: number; total: number }>({ position: 0, total: 0 });

  const formatCompanyGameDate = useCallback(() => {
    if (!company) {
      return formatGameDate(gameState.day || 1, gameState.month || 1, gameState.year || 2024);
    }
    return formatGameDate(company.currentDay || 1, company.currentMonth || 1, company.currentYear || 2024);
  }, [company, gameState]);

  useEffect(() => {
    if (company) {
      loadCompanyRanking();
    }
  }, [company?.id]);

  const loadCompanyRanking = () => withLoading(async () => {
    if (!company) return;
    
    try {
      // Get all company_value highscores to find ranking
      const highscores = await highscoreService.getHighscores('company_value', 1000);
      const companyScore = highscores.findIndex(score => score.companyId === company.id);
      
      if (companyScore !== -1) {
        setRanking({
          position: companyScore + 1,
          total: highscores.length
        });
      } else {
        setRanking({ position: 0, total: highscores.length });
      }
    } catch (error) {
      console.error('Error loading company ranking:', error);
      setRanking({ position: 0, total: 0 });
    }
  });

  const formatRanking = useCallback((ranking: { position: number; total: number }): string => {
    if (ranking.position === 0) return "Not ranked";
    return `${ranking.position} / ${ranking.total}`;
  }, []);

  const getRankingColorClass = useCallback((ranking: { position: number; total: number }): string => {
    if (ranking.position === 0 || ranking.total === 0) return 'text-muted-foreground';
    
    // Normalize position to 0-1 (1st place = 1.0, last place = 0.0)
    const normalizedPosition = ranking.total > 1 ? 1 - ((ranking.position - 1) / (ranking.total - 1)) : 1;
    
    // Use color class based on percentile
    if (normalizedPosition >= 0.9) return 'text-green-600'; // Top 10%
    if (normalizedPosition >= 0.7) return 'text-blue-600'; // Top 30%
    if (normalizedPosition >= 0.5) return 'text-amber-600';  // Top 50%
    return 'text-gray-600'; // Bottom 50%
  }, []);

  // Calculate company age in days
  const companyAgeDays = useMemo(() => {
    if (!company) return 0;
    
    // Use company's current game date as the start point (when company was created)
    const startYear = company.currentYear || 2024;
    const startMonth = company.currentMonth || 1;
    const startDay = company.currentDay || 1;
    
    // Current game state date
    const currentYear = gameState.year || 2024;
    const currentMonth = gameState.month || 1;
    const currentDay = gameState.day || 1;
    
    // Calculate absolute days from game start (2024)
    const STARTING_YEAR = 2024;
    const startAbsoluteDays = (startYear - STARTING_YEAR) * (DAYS_PER_MONTH * MONTHS_PER_YEAR) +
                              (startMonth - 1) * DAYS_PER_MONTH +
                              (startDay - 1);
    const currentAbsoluteDays = (currentYear - STARTING_YEAR) * (DAYS_PER_MONTH * MONTHS_PER_YEAR) +
                                (currentMonth - 1) * DAYS_PER_MONTH +
                                (currentDay - 1);
    
    return Math.max(1, currentAbsoluteDays - startAbsoluteDays + 1);
  }, [company, gameState]);

  // Calculate average money per day
  const avgMoneyPerDay = useMemo(() => {
    return companyAgeDays > 0 ? (gameState.money || 0) / companyAgeDays : gameState.money || 0;
  }, [gameState.money, companyAgeDays]);

  return (
    <div className="space-y-3">
      {/* Company Banner */}
      <div 
        className="h-28 bg-cover bg-center rounded-lg relative"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1200&h=400&fit=crop')"
        }}
      >
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-amber-900 to-transparent p-2">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-white text-base font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {company?.name || gameState.companyName || 'My Company'}
              </h2>
              <p className="text-white/90 text-[10px] mt-0.5">{formatCompanyGameDate()}</p>
            </div>
            {onNavigate && (
              <div className="flex gap-1.5">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 px-2 py-1"
                  onClick={() => onNavigate('profile')}
                >
                  Profile
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 px-2 py-1"
                  onClick={() => onNavigate('highscores')}
                >
                  Leaderboards
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Stats Grid - Desktop/Tablet (hidden on mobile) */}
      <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        <Card>
          <CardContent className="p-2.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground">Current Money</p>
                <p className="text-lg font-bold">{formatNumber(gameState.money || 0, { currency: true, decimals: 0, compact: (gameState.money || 0) >= 1000 })}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                💰
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-2.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground">Avg/Day</p>
                <p className="text-lg font-bold">{formatNumber(avgMoneyPerDay, { currency: true, decimals: 0, compact: avgMoneyPerDay >= 1000 })}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-2.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground">Company Age</p>
                <p className="text-sm font-bold">{companyAgeDays} days</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                <Calendar className="h-3.5 w-3.5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Stats Grid - Mobile (2x2 grid) */}
      <div className="lg:hidden grid grid-cols-2 gap-3">
        <div className="bg-white p-3 rounded-lg shadow">
          <div className="text-base font-bold text-gray-900">{formatNumber(gameState.money || 0, { currency: true, decimals: 0, compact: (gameState.money || 0) >= 1000 })}</div>
          <div className="text-xs text-gray-500">Current Money</div>
        </div>
        <div className="bg-white p-3 rounded-lg shadow">
          <div className="text-base font-bold text-blue-600">{formatNumber(avgMoneyPerDay, { currency: true, decimals: 0, compact: avgMoneyPerDay >= 1000 })}</div>
          <div className="text-xs text-gray-500">Avg/Day</div>
        </div>
        <div className="bg-white p-3 rounded-lg shadow">
          <div className="text-sm font-bold text-amber-600">{companyAgeDays} days</div>
          <div className="text-xs text-gray-500">Company Age</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Financial Overview */}
        <Card>
          <CardHeader className="py-2 px-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-3.5 w-3.5" />
              Financial Overview
            </CardTitle>
            <CardDescription className="text-xs">
              Your company's financial performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-3 pb-3">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Current Balance:</span>
                <span className="text-sm font-semibold">{formatNumber(gameState.money || 0, { currency: true, decimals: 2, compact: (gameState.money || 0) >= 1000 })}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Game Time:</span>
                <span>{formatCompanyGameDate()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Days in Business:</span>
                <span>{companyAgeDays} days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Average per Day:</span>
                <span>{formatNumber(avgMoneyPerDay, { currency: true, decimals: 0, compact: avgMoneyPerDay >= 1000 })}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rankings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-2 px-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Trophy className="h-3.5 w-3.5" />
                Rankings
              </CardTitle>
              <CardDescription className="text-xs">Your position on the leaderboards</CardDescription>
            </div>
            {onNavigate && (
              <Button
                variant="outline"
                size="sm"
                className="px-2 py-1"
                onClick={() => onNavigate('highscores')}
              >
                View All
              </Button>
            )}
          </CardHeader>
          <CardContent className="px-3 pb-3">
            {isLoading ? (
              <p className="text-xs text-muted-foreground">Loading ranking...</p>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-md bg-muted/60">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏢</span>
                    <span className="text-sm font-medium">Company Value</span>
                  </div>
                  <span className={`text-sm font-semibold ${getRankingColorClass(ranking)}`}>
                    {formatRanking(ranking)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompanyOverview;
