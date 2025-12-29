import { useLoadingState } from '@/hooks';
import { SimpleCard, Button, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { Settings, Trash2, Clock } from 'lucide-react';
import { PageProps, NavigationProps } from '@/lib/types/UItypes';
import { adminClearAllCompanies, adminResetGameTime } from '@/lib/services';

interface AdminDashboardProps extends PageProps, NavigationProps {}

export function AdminDashboard({ onBack, onNavigateToLogin }: AdminDashboardProps) {
  const { isLoading, withLoading } = useLoadingState();

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

  const handleResetGameTime = () => withLoading(async () => {
    await adminResetGameTime();
    // Reload to sync the new time
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
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="database">Database</TabsTrigger>
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
                  Removes all companies and resets game time to 1.1.2024.
                </p>
              </SimpleCard>

              <SimpleCard
                title="Game Time"
                description="Reset game time to initial"
              >
                <Button
                  variant="destructive"
                  onClick={handleResetGameTime}
                  disabled={isLoading}
                  className="w-full"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Reset Game Time
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Resets game time to Day 1, Month 1, Year 2024. Does not affect other data.
                </p>
              </SimpleCard>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

