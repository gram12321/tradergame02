# Core Game Mechanics - Trade  Game

## 📚 Design Documentation

**For detailed design documentation of core mechanics, see:**
- **[Core Mechanics Design](./core_mechanics_design.md)** - Comprehensive design documentation covering:
  - Game loop and time progression
  - City system with wealth and population
  - Facility system (production, warehouse, retail)
  - Recipe system and production mechanics
  - Inventory system (facility-based, no player inventory)
  - Office system (Phase 2 feature)
  - Multiplayer architecture

**Type Definitions:**
- **[Type Definitions](../../src/lib/types/types.ts)** - Complete TypeScript interfaces for all game systems

## 🎯 Current Implementation Status


## 🏗️ Core Game Architecture

### Game State Management  ** NOT IMPLEMENTED**
- **Central State**: `src/lib/services/core/gameState.ts` - manages time, money, prestige, company data
- **Time System**: Week-based progression (manual advancement only)
- **Data Persistence**: `src/lib/database/database.ts` - Supabase integration with company-scoped data
- **Real-time Updates**: `src/hooks/useGameUpdates.ts` - Supabase subscriptions
- **Company System**: Multi-company support with company switching and data isolation

## 🌱 Core Game Systems

### 1. Time Progression System  **NOT IMPLEMENTED**
**What's Implemented**:
- **Game Time**: `{ day, month, year }` interface with automatic month (every 24 day) and year changes, every 7 month. in `src/lib/types/types.ts`
- **Function**: `processGameTick()` in `src/lib/services/core/gameTick.ts` - handles week/month/year progression
- **Game Tick System**: 

**What's NOT Implemented**:


### 2. Production System  **NOT IMPLEMENTED**


**What's NOT Implemented**:

### 4. Retail System  **NOT IMPLEMENTED**
**What's Implemented**:


**What's NOT Implemented**:


### 5. Finance System ✅ **NOT IMPLEMENTED**
**What's Implemented**:
- **Finance Service**: `src/lib/services/user/financeService.ts` - Complete transaction management
- **Financial UI**: `src/components/finance/` - Income statements, balance sheets, cash flow
- **Transaction System**: All money flows tracked with audit trail
- **Asset Valuation**:  calculation of facilities , inventory (
- **Financial Components**:
  - `IncomeBalanceView.tsx` - Income statements and balance sheets
  - `CashFlowView.tsx` - Cash flow analysis
  - `UpgradesPlaceholder.tsx` - Future upgrades system
- **Transaction Categories**: Income, expenses, sales, purchases, prestige events

**What's NOT Implemented**:
loan

### 6. Player Interface  ** NOT IMPLEMENTED**
**What's NOT Implemented**:
- **Navigation**: `src/components/layout/Header.tsx` - Time display, advance button, player menu, prestige display
- **Player Menu**: Dropdown with Profile, Settings, Admin Dashboard, Achievements, Winepedia, Logout
- **Notification System**: `src/lib/services/core/notificationService.ts` - Centralized notification system with database persistence
- **Admin Dashboard**: `src/components/pages/AdminDashboard.tsx` - Data management tools, prestige management
- **Settings**: `src/components/pages/Settings.tsx` - Company-specific settings and notification preferences
- **Tradepedia**: `src/components/pages/Winepedia.tsx` - Grape variety information with interactive tabs
- **Profile**: `src/components/pages/Profile.tsx` - Company management and portfolio stats
- **Achievements**: `src/components/pages/Achievements.tsx` - Dynamic tier-based achievement system
- **Highscores**: `src/components/pages/Highscores.tsx` - Global leaderboard system
- **Company Overview**: `src/components/pages/CompanyOverview.tsx` - Company stats and navigation
- **Login System**: `src/components/pages/Login.tsx` - Company creation, selection, and highscores
- **Staff System**: `src/components/pages/Staff.tsx` - Staff management with teams, search, and recruitment

## 🎯 **Implementation Status Summary**


## 🔧 **Technical Architecture**

### Database Schema  **NOT IMPLEMENTED**


### Component Structure  **Many Not IMPLEMENTED needs update**
- **Services**: `src/lib/services/` - Organized by domain (user/, sales/, wine/, core/, activity/, vineyard/)
- **UI Components**: `src/components/` - React components with ShadCN, organized by function
- **Hooks**: `src/hooks/` - State management, data loading, and game-specific hooks
- **Utils**: `src/lib/utils/` - Helper functions, calculations, and formatting
- **Types**: `src/lib/types/` - Centralized type definitions with comprehensive interfaces
- **Constants**: `src/lib/constants/` - Game constants, grape data, vineyard data, wine features
- **Database**: `src/lib/database/` - Supabase integration with service layer architecture
