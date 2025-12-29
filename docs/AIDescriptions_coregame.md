# TraderGame Framework - Core Architecture

## 🎯 Overview



## 🏗️ Core Systems

### Game State Management
- **File**: `src/lib/services/core/gameState.ts`
- **Function**: Manages time (day/month/year), money, company data
- **Time System**: Manual advancement via `processGameTick()`
- **Update System**: `src/hooks/useGameUpdates.ts` - Global updates with debouncing

### Company System
- **Files**: `src/lib/services/user/authService.ts`, `src/lib/services/user/companyService.ts`

- **Login**: `src/components/pages/Login.tsx` - Company name-based login/creation
- **Storage**: Previously used companies tracked in localStorage

### Database Schema
**Tables**:

- `companies` - Company data 
- `game_state` - Company-scoped state snapshot
- `transactions` - Financial transaction history
- `notifications` - Company-scoped notifications
- `notification_filters` - User-defined filters
- `highscores` - Global leaderboards
- `company_settings` - Company settings



### Notification System
- **File**: `src/lib/services/core/notificationService.ts`
- **Function**: Centralized notifications with database persistence and filtering

### Highscore System
- **File**: `src/lib/services/user/highscoreService.ts`
- **Function**: Global leaderboards with flexible score types

### Admin Tools
- **File**: `src/components/pages/AdminDashboard.tsx`, `src/lib/services/admin/adminService.ts`
- **Functions**: Clear accounts, reset database, set game date, manage money

## 🔧 Technical Architecture

### Service Layer
- **Location**: `src/lib/services/` - Organized by domain (admin/, core/, finance/, user/)
- **Pattern**: Business logic in services → Database → `triggerGameUpdate()` → Component re-render

### Hooks
- `useGameState()` - Reactive game state access
- `useGameStateWithData()` - Game state with async data loading
- `useGameUpdates()` - Subscribe to global updates
- `useLoadingState()` - Loading state management
- `useIsMobile()` - Mobile detection

### UI Components
- **Pages**: Login, Profile, Settings, AdminDashboard, CompanyOverview, Highscores, Achievements
- **Layout**: Header with navigation and player menu
- **Framework**: React + TypeScript + ShadCN UI

### Types
- **Shared Interfaces**: `src/lib/types/UItypes.ts` 
- **Database Types**: `src/lib/database/` - TypeScript interfaces

