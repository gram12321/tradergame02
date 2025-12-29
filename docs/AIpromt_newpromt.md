# Framework Overview for AI Agents

## 🎯 Project Status

This is **TraderGame02**

**Framework**: React + Vite + TypeScript + ShadCN UI, connected to Supabase  
**MCP Tools**: Git and Supabase MCP tools enabled (see @readme.md)

## ✅ **Framework Systems (Minimal Implementation)**

### **Core Architecture**

### **Company System**


### **Finance System**


### **Highscore System**


### **Admin Tools**
- **Admin Dashboard**: `src/components/pages/AdminDashboard.tsx` - Database management tools
- **Admin Service**: `src/lib/services/admin/adminService.ts` - Admin operations

## 🔧 **Key File Locations**

### **Service Layer** (`src/lib/services/`)
- **admin/**: Admin operations (database reset, game date, money management)
- **core/**: Game state, notifications, game tick, starting conditions
- **company/**: Authentication, company management, highscores, company  settings

### **Database Layer** (`src/lib/database/`)
- **core/**: Supabase client, companies, game_state, transactions, notifications, highscores, company_settings

### **Types** (`src/lib/types/`)
- **UItypes.ts**: `PageProps`, `NavigationProps`, `CompanyProps`
- **types.ts**: Game state, company, user interfaces

### **Documentation**
- **@docs/AIDescriptions_coregame.md**: Framework architecture documentation
- **@docs/versionlog.md**: Version history
- **@readme.md**: Project setup and overview


