# Framework Overview for AI Agents

## 🎯 Project Status

This is **TraderGame02** - a minimal framework extracted from Winemaker04. It provides only essential infrastructure for building a trading game.

**Framework**: React + Vite + TypeScript + ShadCN UI, connected to Supabase  
**MCP Tools**: Git and Supabase MCP tools enabled (see @readme.md)

## ✅ **Framework Systems (Minimal Implementation)**

### **Core Architecture**
- **Game State Management**: `src/lib/services/core/gameState.ts` - Time (day/month/year), money, company data
- **Time Progression**: Day/month/year system with manual advancement via `processGameTick()`
- **Database Integration**: `src/lib/database/` - Supabase with company-scoped data (1:1 user-company)
- **Update System**: `src/hooks/useGameUpdates.ts` - Global updates with debouncing
- **Notification System**: `src/lib/services/core/notificationService.ts` - Basic notification management

### **User & Company System**
- **Authentication**: `src/lib/services/user/authService.ts` - Supabase auth
- **Company Management**: `src/lib/services/user/companyService.ts` - CRUD operations (1:1 user-company)
- **Login**: `src/components/pages/Login.tsx` - Company name-based login/creation

### **Finance System**
- **Transactions**: `src/lib/services/finance/financeService.ts` - Basic transaction tracking
- **Financial UI**: `src/components/finance/FinanceView.tsx`

### **Highscore System**
- **Highscores**: `src/lib/services/user/highscoreService.ts` - Global leaderboards

### **Admin Tools**
- **Admin Dashboard**: `src/components/pages/AdminDashboard.tsx` - Database management tools
- **Admin Service**: `src/lib/services/admin/adminService.ts` - Admin operations

## 🔧 **Key File Locations**

### **Service Layer** (`src/lib/services/`)
- **admin/**: Admin operations (database reset, game date, money management)
- **core/**: Game state, notifications, game tick, starting conditions
- **finance/**: Transaction management
- **user/**: Authentication, company management, highscores, user settings

### **Database Layer** (`src/lib/database/`)
- **core/**: Supabase client, companies, users, game_state, transactions, notifications, highscores, user_settings

### **Types** (`src/lib/types/`)
- **UItypes.ts**: `PageProps`, `NavigationProps`, `CompanyProps`
- **types.ts**: Game state, company, user interfaces

### **Documentation**
- **@docs/AIDescriptions_coregame.md**: Framework architecture documentation
- **@docs/versionlog.md**: Version history
- **@readme.md**: Project setup and overview

## 📝 **Note**

This framework contains **NO game-specific mechanics**. All winery-specific systems (vineyards, wine production, sales, staff, etc.) were removed. This is infrastructure only.
