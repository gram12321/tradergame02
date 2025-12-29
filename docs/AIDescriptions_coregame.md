# TraderGame Framework - Core Architecture

## 🎯 Overview

Minimal framework extracted from Winemaker04, providing core infrastructure for building a trading game. Contains NO game-specific mechanics - only essential infrastructure.

## 🏗️ Core Systems

### Game State Management
- **File**: `src/lib/services/core/gameState.ts`
- **Function**: Manages time (day/month/year), money, company data
- **Time System**: Manual advancement via `processGameTick()`
- **Update System**: `src/hooks/useGameUpdates.ts` - Global updates with debouncing

### User & Company System (1:1 Relationship)
- **Files**: `src/lib/services/user/authService.ts`, `src/lib/services/user/companyService.ts`
- **Relationship**: Each user has exactly one company (company name = username)
- **Login**: `src/components/pages/Login.tsx` - Company name-based login/creation
- **Storage**: Previously used companies tracked in localStorage

### Database Schema
**Tables**:
- `users` - User accounts (name, email, avatar)
- `companies` - Company data (1:1 with users, includes time/money)
- `game_state` - Company-scoped state snapshot
- `transactions` - Financial transaction history
- `notifications` - Company-scoped notifications
- `notification_filters` - User-defined filters
- `highscores` - Global leaderboards
- `user_settings` - Company settings

**Pattern**: All tables use `company_id` for data isolation with RLS policies

### Finance System
- **File**: `src/lib/services/finance/financeService.ts`
- **Function**: Transaction tracking (amount, description, category)
- **UI**: `src/components/finance/FinanceView.tsx`

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
- **Pages**: Login, Profile, Settings, AdminDashboard, Finance, CompanyOverview, Highscores, Achievements (placeholder)
- **Layout**: Header with navigation and player menu
- **Framework**: React + TypeScript + ShadCN UI

### Types
- **Shared Interfaces**: `src/lib/types/UItypes.ts` - `PageProps`, `NavigationProps`, `CompanyProps`
- **Database Types**: `src/lib/database/` - TypeScript interfaces

## ✅ What Exists
- User/Company system (1:1 relationship)
- Basic game state (time, money)
- Database integration with RLS
- Transaction tracking
- Notification system
- Highscore system
- Admin tools
- UI framework and navigation

## ❌ What Was Removed
- All game-specific systems (vineyards, wine, sales, staff, etc.)
- Game mechanics and rules
- Achievement system (placeholder only)

## 📝 Next Steps
To build a trading game, add:
- Trading mechanics (buy/sell systems)
- Market data and pricing
- Inventory management
- Trading-specific UI pages
- Game rules and win conditions
