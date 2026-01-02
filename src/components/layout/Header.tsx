import { useState } from 'react';
import { Button, Badge, Avatar, AvatarFallback, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui';
import { formatGameDateFromObject } from '@/lib/utils';
import { NAVIGATION_EMOJIS } from '@/lib/utils/icons';
import { useGameTick } from '@/hooks/useGameTick';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLoadingState } from '@/hooks/useLoadingState';
import { CalendarDays, MessageSquareText, LogOut, MenuIcon, X } from 'lucide-react';
import { NotificationCenter, useNotifications } from '@/components';
import type { Facility } from '@/lib/types/types';
import type { NavigationProps, CompanyProps } from '@/lib/types/UItypes';

interface HeaderProps extends NavigationProps, CompanyProps {
  currentPage: string;
  onTimeAdvance?: () => void;
  onBackToLogin?: () => void;
  facilities: Facility[];
  onFacilitiesUpdate?: (facilities: Facility[]) => void;
  isAdmin?: boolean;
}

export function Header({
  currentPage,
  onNavigate,
  onTimeAdvance,
  onBackToLogin,
  currentCompany,
  facilities,
  onFacilitiesUpdate,
  isAdmin = false,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const { isLoading: isAdvancing, withLoading } = useLoadingState();
  const { gameState, isProcessing, handleAdvanceTick } = useGameTick({
    facilities,
    onFacilitiesUpdate,
    autoAdvanceEnabled: true,
  });
  
  // Notification system
  const { unreadCount, isHistoryOpen, openHistory, closeHistory } = useNotifications(currentCompany?.name || '');

  const handleIncrementWeek = async () => {
    await withLoading(async () => {
      handleAdvanceTick();
      onTimeAdvance?.();
    });
  };

  const isButtonLoading = isAdvancing || isProcessing || gameState.isProcessing;

  const handleNavigation = (page: string) => {
    onNavigate?.(page);
    setMobileMenuOpen(false);
  };

  const navItems = [
    { id: 'dashboard', label: 'Company', icon: NAVIGATION_EMOJIS.dashboard },
    { id: 'finance', label: 'Finance', icon: NAVIGATION_EMOJIS.finance },
    { id: 'facilities', label: 'Facilities', icon: NAVIGATION_EMOJIS.facilities },
    { id: 'marketplace', label: 'Marketplace', icon: NAVIGATION_EMOJIS.marketplace },
  ];

  return (
    <>
      <header className="w-full bg-red-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center py-0.5 px-3 sm:px-4 md:px-6 lg:px-8 text-sm">
          <div className="flex items-center space-x-4">
            <button onClick={() => handleNavigation('dashboard')} className="text-sm font-semibold">
              🏢 Trader Game
            </button>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex space-x-1">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  variant={currentPage === item.id ? "secondary" : "ghost"}
                  size="sm"
                  className="bg-transparent hover:bg-red-700 text-white border-0"
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Button>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Time display - responsive */}
            <div className="flex items-center space-x-2 mr-2">
              <CalendarDays className="h-3.5 w-3.5" />
              <span className="text-[10px] font-medium whitespace-nowrap hidden sm:block">
                {formatGameDateFromObject(gameState.time)}
              </span>
              <span className="text-[10px] font-medium whitespace-nowrap sm:hidden">
                D{gameState.time.day}
              </span>
            </div>
            
            {/* Increment Week button - responsive */}
            {isAdmin && (
              <>
                <Button 
                  onClick={handleIncrementWeek}
                  variant="secondary" 
                  size="sm"
                  disabled={isButtonLoading}
                  className="bg-red-600 hover:bg-red-700 text-white border-red-500 text-xs hidden sm:flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isButtonLoading ? 'Processing...' : 'Advance Time'}
                </Button>
                
                <Button 
                  onClick={handleIncrementWeek}
                  variant="ghost" 
                  size="icon"
                  disabled={isButtonLoading}
                  className="sm:hidden text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CalendarDays className="h-4 w-4" />
                </Button>
              </>
            )}
            
            {/* Money display - responsive */}
            <Badge 
              variant="outline" 
              className="bg-red-700 text-white border-red-500 px-2 py-0.5 flex items-center cursor-pointer hover:bg-red-600 transition-colors hidden sm:flex"
              onClick={() => handleNavigation('finance')}
              title="View Finance"
            >
              <span className="font-medium">€0</span>
            </Badge>
            
            <Badge 
              variant="outline" 
              className="bg-red-700 text-white border-red-500 px-1.5 py-0.5 flex items-center cursor-pointer hover:bg-red-600 transition-colors sm:hidden"
              onClick={() => handleNavigation('finance')}
              title="View Finance"
            >
              <span className="font-medium text-xs">€0</span>
            </Badge>

            {/* Console button - responsive */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={openHistory}
              className="rounded-full h-8 w-8 flex items-center justify-center text-white hover:bg-red-700 relative hidden sm:flex"
            >
              <MessageSquareText className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-4 min-w-4 flex items-center justify-center p-0 text-[10px]"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Button>

            {/* Console button - mobile */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={openHistory}
              className="rounded-full h-8 w-8 flex items-center justify-center text-white hover:bg-red-700 relative sm:hidden"
            >
              <MessageSquareText className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-4 min-w-4 flex items-center justify-center p-0 text-[10px]"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Button>
            
            {/* Mobile menu button */}
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-red-700"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <MenuIcon className="h-6 w-6" />
              </Button>
            )}
            
            {/* Desktop menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 p-1 rounded-full h-8 w-8 text-white hover:bg-red-700 hidden lg:flex">
                  <Avatar>
                    <AvatarFallback className="bg-red-600 text-white">
                      {currentCompany?.name ? currentCompany.name.substring(0, 2).toUpperCase() : 'CO'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>
                  {currentCompany?.name || 'My Company'}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleNavigation('profile')}>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigation('settings')}>
                  Settings
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => handleNavigation('admin')}>
                    Admin Dashboard
                  </DropdownMenuItem>
                )}
                {onBackToLogin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onBackToLogin} className="text-red-600">
                      <LogOut className="h-4 w-4 mr-2" />
                      Switch Company
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem onClick={() => handleNavigation('achievements')}>
                  Achievements
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigation('highscores')}>
                  Global Leaderboards
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => {
                    onBackToLogin?.();
                  }}
                  className="text-red-600 focus:text-red-500"
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      
      {/* Mobile Navigation Menu */}
      {isMobile && mobileMenuOpen && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <nav className="fixed top-0 left-0 bottom-0 w-3/4 max-w-sm bg-white dark:bg-slate-800 p-6 shadow-xl flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-semibold text-primary">Navigation</h2>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                <X className="h-6 w-6" />
              </Button>
            </div>
            
            <div className="space-y-1">
              <div className="flex flex-col space-y-2 mb-6 p-3 bg-blue-50 rounded-md">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{formatGameDateFromObject(gameState.time)}</span>
                  {isAdmin && (
                    <Button 
                      onClick={async () => {
                        await handleIncrementWeek();
                        setMobileMenuOpen(false);
                      }}
                      variant="outline" 
                      size="sm"
                      disabled={isButtonLoading}
                      className="flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CalendarDays className="h-4 w-4" />
                      <span>{isButtonLoading ? 'Processing...' : 'Advance Time'}</span>
                    </Button>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant="secondary" 
                    className="flex-1 py-1 flex items-center justify-center gap-1.5 bg-amber-50 text-amber-700"
                  >
                    <span>💰</span>
                    <span className="font-medium">€0</span>
                  </Badge>
                </div>
              </div>
              
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  onClick={() => handleNavigation(item.id)}
                  className={`w-full justify-start text-left mb-1 py-3 text-foreground ${
                    currentPage === item.id ? "bg-muted" : ""
                  }`}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.label}
                </Button>
              ))}
            </div>
            
            <div className="mt-auto pt-6 border-t">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Account</h3>
              {[
                { id: 'profile', label: 'Profile' },
                { id: 'settings', label: 'Settings' },
                ...(isAdmin ? [{ id: 'admin', label: 'Admin Dashboard' }] : []),
                { id: 'highscores', label: 'Highscores' },
                { id: 'achievements', label: 'Achievements' }
              ].map(({ id, label }) => (
                <Button
                  key={id}
                  variant="ghost"
                  onClick={() => handleNavigation(id)}
                  className="w-full justify-start text-left py-2 text-foreground"
                >
                  {label}
                </Button>
              ))}
              
              {onBackToLogin && (
                <Button
                  variant="ghost"
                  onClick={onBackToLogin}
                  className="w-full justify-start text-left py-2 text-destructive hover:text-destructive mt-2"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  Switch Company
                </Button>
              )}
              
              <Button
                variant="ghost"
                onClick={() => {
                  onBackToLogin?.();
                }}
                className="w-full justify-start text-left py-2 text-destructive hover:text-destructive mt-2"
              >
                <LogOut className="mr-3 h-4 w-4" />
                Logout
              </Button>
            </div>
          </nav>
        </div>
      )}
      
      {/* Notification Center */}
      {currentCompany && (
        <NotificationCenter 
          companyName={currentCompany.name}
          isOpen={isHistoryOpen}
          onClose={closeHistory}
        />
      )}
    </>
  );
}
