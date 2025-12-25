# Trader Game V 0.2

**Local path**: C:\Users\krist\Documents\GitHub\tradergame02


# General AI Rules
A multiplayer web-based trading game built with React, TypeScript, and Supabase, Vercel for production env.

## Project Overview

Trader Game is an economic simulation where players manage production facilities, trade resources, and build supply chains. The game features automatic production cycles, a marketplace for trading, and contracts between facilities.

Players do not have personal inventories - all resources are stored in facility inventories.


**AI Agent Context**: Turn-based tading simulation with formula-based economics, 

## 🔧 Core Architecture
- **Framework**: React + TypeScript + Supabase
- **Styling**: Tailwind CSS + ShadCN UI (no custom CSS)
- **Data Flow**: Services → Database → Global Updates → Reactive UI

### 📱 Dual UI System (Mobile/Desktop)
The application implements a **Dual UI System** that provides optimized experiences for both mobile and desktop devices:

**Mobile Detection:**
- `useIsMobile()` hook detects screen width < 768px
- Automatic UI switching based on breakpoint
- Responsive design patterns throughout the application

**Mobile-First Components:**
- **Sidebar**: Desktop fixed sidebar → Mobile offcanvas Sheet component
- **Activity Panel**: Desktop fixed panel → Mobile sliding panel with floating trigger button
- **Data Tables**: Desktop tables → Mobile card-based layouts (Sales, Highscores, WineLog)
- **Navigation**: Touch-friendly mobile navigation with proper gesture support

**Implementation Pattern:**
```typescript
// Example dual UI pattern
const isMobile = useIsMobile();

return (
  <>
    {/* Desktop version */}
    <div className="hidden lg:block">
      <DesktopComponent />
    </div>
    
    {/* Mobile version */}
    <div className="lg:hidden">
      <MobileComponent />
    </div>
  </>
);
```

**Key Mobile Components:** (NOT YET IMPLEMENTET)
- `src/hooks/use-mobile.tsx` - Mobile detection hook
- `src/components/ui/shadCN/sidebar.tsx` - Responsive sidebar with Sheet integration
- `src/components/layout/ActivityPanel.tsx` - Dual activity panel system

### 🧠 Development Patterns

**CRITICAL RULES FOR AI AGENTS:**
- **NEVER make any effort for backwards compability, database save, data migration or anything like that. We are in dev phase. Database will simply be deleted if any compability issue arrice**:
- **ALWAYS use barrel exports**: `@/components/ui`, `@/hooks`, `@/lib/services`, `@/lib/utils`, `@/lib/constants`
- **ALWAYS use custom hooks**: `useLoadingState()`, `useGameStateWithData()`, `useGameState()`, `useGameUpdates()`, `usePrestigeUpdates()`, , `useFormattedBalance()`, `useTableSortWithAccessors()`
- **ALWAYS use shared interfaces**: `PageProps`, `NavigationProps`, `CompanyProps`, `DialogProps`, `FormProps`, `TableProps`, `LoadingProps`, `CardProps`, `BaseComponentProps` from `@/components/UItypes`
- **ALWAYS use service exports**: Game state (`getGameState`, `updateGameState`, `getCurrentCompany`, `getCurrentPrestige`), Finance (`addTransaction`, `loadTransactions`, `calculateFinancialData`), 
- **ALWAYS use utility exports**: Formatting (`formatNumber`, `formatCurrency`, `formatDate`, `formatGameDate`, `formatPercent`), Calculations (`calculateSkewedMultiplier`, `calculateAsymmetricalMultiplier`, `calculateBaseWinePrice`), Company utils (`getCurrentCompanyId`, `getCompanyQuery`), Wine utilities (`getGrapeQualityCategory`, `getColorClass`, `getBadgeColorClasses`)
- **Business logic in services**: Never put calculations in components
- **Reactive updates**: Services trigger global updates, components auto-refresh

### 🪜 Starting Conditions & Financial Options




### Facility System

- **Base Facility Interface**: Common properties for all facilities
- **Warehouse Facilities**: For storing resources
- **Production Facilities**: Transform resources using recipes (Farm, Mill)
- **Shop Facilities**: Represent consumer demand for resources

**Constants Directory (`@/lib/constants`):** Centralized configuration and data via barrel exports:
- Import from `@/lib/constants` (barrel). It re-exports:
  - `constants.ts` - Game initialization, sales constants, grape quality, customer regional data

### Tick System

- Global tick counter managed by GameContext
- Automated processing for all facilities on each tick
- Type-specific processors for different facility types
- Batch updates for efficiency

### Auto-Production

- Facilities auto-start with first recipe
- Auto-restart when production completes
- Continues until inputs are depleted
- Manual recipe changes supported anytime


**MCP Integration:**
- Supabase MCP configured in `.cursor/mcp.json`
- Both anon and service role keys available
- PAT required for database management

### 🗄️ **Dual Database Setup** (AUTH OUTDATED)

**Development Database (Local):**
- Supabase project: `uuribntaigecwtkdxeyw`
- Environment: `.env.local` (gitignored)
- Management: MCP tools (`mcp_supabase-dev_*`) for agentic operations
- Usage: `localhost:3000` with frequent resets

**Vercel Database (Staging):**
- Supabase project: `uuzoeoukixvunbnkrowi`
- Environment: Vercel Dashboard → Environment Variables
- Management: Manual SQL migrations via `migrations/` (data-preserving or full reset)
- Usage: `winemaker-omega.vercel.app` (stable for testing)

**Migration Process:**
1. Update dev database via MCP tools
2. Choose migration type:
   - **Data-preserving**: `migrations/vercel_migration_preserve_data.sql` (recommended for regular updates)
   - **Full reset**: `migrations/sync_vercel_schema.sql` (major breaking changes only)
3. Run chosen migration in Vercel Supabase SQL Editor
4. Verify Vercel deployment works


**Legacy Reference Documentation:**
- `@docs/old_iterations/


### 🏗️ Database Schema
**Core Tables:**
- `companies` - Company data, financial state, prestige, game progression
- `users` - User accounts and authentication
- `prestige_events` - Comprehensive prestige tracking with decay
- `transactions` - Financial history with categorization
- `notifications` - System notifications and alerts
- `highscores` - Leaderboard and achievement tracking
- `achievements` - Achievement system
- `user_settings` - User preferences and configuration

**Data Flow**: Services → Database → Global Updates → Reactive UI

## Core Game Systems & Features

### 1. Wine Production System ✅ **IMPLEMENTED**

**Implemented (Advanced System):**


### 3. Staff System ✅ **NOT IMPLEMENTED**
- **Staff Management**: Hire and fire staff with nationality, skill levels, and specializations
- **Skill System**: 5 core skills (Field, Winery, Administration, Sales, Maintenance)
- **Work Calculation**: Dynamic work progression based on assigned staff skills
- **Staff Assignment**: Assign staff to activities via ActivityCard modal
- **Wage System**: Automatic wage calculation based on skills and specializations
- **Database Integration**: Full CRUD operations with Supabase
- **Starting Staff**: New companies begin with 2 random staff members
**Future Advanced Features (NOT YET IMPLEMENTED):**
- Team management and team assignment
- Staff search and recruitment system
- Advanced hiring mechanics
- Staff specialization bonuses
 - Staff training/development


### 5. Finance System **NOT YET IMPLEMENTED**
- **Transaction Management**: Complete financial system with Supabase integration
- **Financial Reporting**: Income statements, balance sheets, cash flow statements
- **Asset Valuation**: Automatic calculation of vineyard, wine inventory, grape values
- **Loan System**: Economy phases, diversified lender pool (guaranteed type distribution), credit rating, loan applications with activity integration
- **Integration**: All money flows through transaction system

#### 5.1. Public Company & Share System  **NOT IMPLEMENTED**
- **Share Management**: Issue shares, buy back stock, manage ownership percentages
- **Share Price System**: Incremental adjustment system that updates weekly based on performance metrics
  - Initial price: Book Value per Share (Total Assets - Total Liabilities) / Total Shares
  - Weekly adjustments based on 8 metrics (EPS, revenue/share, dividend/share, revenue growth, profit margin, credit rating, fixed asset ratio, prestige)
  - Anchor constraint: Book value acts as anchor, constraining price movements naturally
  - Market cap modifier: Larger companies (higher market cap) face additional expected improvement requirements
- **Dividend System**: Fixed per-share dividend payments with prestige impact for changes
- **Share Structure Adjustments**: Immediate price impact for share issuance (dilution) and buyback (concentration)
- **Historical Tracking**: Weekly snapshots of all metrics for 48-week rolling comparisons
- **Terminology**:
  - **Company Value** = Total Assets - Total Liabilities (used for prestige, highscores, achievements)
  - **Market Cap** = Share Price × Total Shares (used in share price contexts only)
  - **Book Value Per Share** = (Total Assets - Total Liabilities) / Total Shares (anchor for share price)

### 6. Player Interface  **NOT IMPLEMENTED**
- **Login System**: Company selection, creation, user profile management
- **Company Management**: Multi-company support with switching and portfolio stats
- **Player Menu**: Dropdown navigation, notification center, admin dashboard
- **Tradepedia System**: Interactive wine knowledge base with grape varieties, balance system visualization
- **Achievement System**: Progress tracking with filtering and categorization
- **Highscores**: Global leaderboard system with company value rankings

---

## 📋 **Implementation Status**

❌ **NOT IMPLEMENTED:**
- Database
- React + TypeScript + Tailwind + ShadCN with barrel exports
- Authentication with company management and highscores
- Centralized game state with reactive updates and game tick system
- Finance system with transaction tracking, loan system, and economy phases
- **Public company & share system** with incremental share price adjustments, share issuance/buyback, dividend management, and market cap-based expectations
- Complete player interface with Winepedia, achievements, and admin tools
- Staff management system with skill-based work calculation
- **Dual database architecture** with development and staging environments
- **MCP integration** for agentic database management
- **Company/Player separation** with independent player balance system for multi-company portfolio management
- **Starting conditions system** with financial options (player cash, family contribution, outside investment, loans)
- Contract system for stable income
- Storage vessel tracking (fermentation tanks, aging tanks)
- Seasonal effects on vineyards/wine
- Advanced farming methods (organic/biodynamic)
