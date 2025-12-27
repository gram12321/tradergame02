import { useState, useEffect } from 'react';
import { useLoadingState } from '@/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Button } from '../ui';
import { Trophy, RefreshCw } from 'lucide-react';
import { highscoreService } from '@/lib/services';
import { type HighscoreEntry, type ScoreType } from '@/lib/database';
import { formatNumber, formatGameDate } from '@/lib/utils';
import { PageProps, CompanyProps } from '../../lib/types/UItypes';

interface HighscoresProps extends PageProps, CompanyProps {
  // Inherits currentCompanyId and onBack from shared interfaces
}

export function Highscores({ currentCompanyId, onBack }: HighscoresProps) {
  const { isLoading, withLoading } = useLoadingState();
  const [highscores, setHighscores] = useState<HighscoreEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const scoreType: ScoreType = 'company_value';

  useEffect(() => {
    loadHighscores();
  }, []);

  const loadHighscores = () => withLoading(async () => {
    setError(null);
    try {
      const scores = await highscoreService.getHighscores(scoreType, 50);
      setHighscores(scores);
    } catch (err) {
      setError('Failed to load highscores');
      console.error('Error loading highscores:', err);
    }
  });

  const formatGameDateString = (entry: HighscoreEntry): string => {
    if (!entry.gameDay || !entry.gameMonth || !entry.gameYear) {
      return 'N/A';
    }
    return formatGameDate(entry.gameDay, entry.gameMonth, entry.gameYear);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Trophy className="h-8 w-8 text-yellow-500" />
              Global Leaderboards
            </h1>
            <p className="text-muted-foreground mt-1">
              Top performing companies
            </p>
          </div>
          <div className="flex gap-2">
            {onBack && (
              <Button variant="outline" onClick={onBack}>
                Back
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={loadHighscores}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              {highscoreService.getScoreTypeName(scoreType)}
            </CardTitle>
            <CardDescription>
              Rankings based on overall company value
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">Loading leaderboard...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <p className="text-destructive mb-4">{error}</p>
                  <Button onClick={loadHighscores} variant="outline">
                    Try Again
                  </Button>
                </div>
              </div>
            ) : highscores.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No scores submitted yet.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Be the first to establish your company!
                  </p>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Rank</TableHead>
                    <TableHead>Company Name</TableHead>
                    <TableHead className="text-right">Company Value</TableHead>
                    <TableHead className="text-right">Game Date</TableHead>
                    <TableHead className="text-right">Achieved</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {highscores.map((score, index) => (
                    <TableRow 
                      key={`${score.companyId}-${index}`}
                      className={currentCompanyId === score.companyId ? 'bg-primary/5 border-primary/20' : ''}
                    >
                      <TableCell className="font-medium">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        {score.companyName}
                        {currentCompanyId === score.companyId && (
                          <span className="ml-2 text-xs text-muted-foreground">(Your Company)</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {formatNumber(score.scoreValue, { currency: true, decimals: 0 })}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {formatGameDateString(score)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {score.achievedAt.toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
