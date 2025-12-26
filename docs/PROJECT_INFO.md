# tradergame 0.2 - Project Information
## 📁 Project File Structure

```
tradegame02/
├── 📄 Configuration Files

│
├── 📄 Documentation
│   ├── readme.md                   # Main project documentation
│   ├── PROJECT_INFO.md             # This file
│   └── docs/                       # Documentation directory
│       ├── versionlog.md                 # Active version history (477 lines)
│       └── old_iterations/               # Legacy versions

│
├── 📄 Database & Migrations
│   └── migrations/

│
├── 📄 Static Assets
│   
│   │
│   └── index.html                  # Root HTML template
│
├── 📄 Source Code (src/) - ,000 total lines
│   ├── main.tsx (14 lines)                    # Application entry point
│   ├── App.tsx (196 lines)                    # Main application component
│   ├── index.css (106 lines)                  # Global styles

│   │
│   ├── components/ (≈33,000 lines total)      # React components
│   │   ├── finance/ (1,600+ lines total)     # Financial components

│   │   │
│   │   ├── layout/ (1,498 lines total)        # Layout components
│   │   │   ├── Header.tsx (456 lines)         # Application header
│   │   │   └── NotificationCenter.tsx (695 lines) # Notification system
│   │   │
│   │   ├── pages/ (6,704 lines total)         # Page components
│   │   │   ├── Achievements.tsx (371 lines)   # Achievement system
│   │   │   ├── AdminDashboard.tsx (455 lines) # Admin tools
│   │   │   ├── CompanyOverview.tsx (311 lines) # Company overview page
│   │   │   ├── Finance.tsx (5 lines)          # Finance page
│   │   │   ├── Highscores.tsx (450 lines)     # Leaderboard
│   │   │   ├── Login.tsx (396 lines)          # Authentication
│   │   │   ├── Profile.tsx (528 lines)        # User profile
│   │   │   ├── Settings.tsx (327 lines)       # User settings
│   │   │   ├── tradepedia.tsx (55 lines)       # Wine knowledge base
│   │   │   └── tradepedia/ (1,648 lines total) # Winepedia sub-components
│   │   │
│   │   └── ui/ (13,959 lines total)           # UI components
│   │       ├── components/ (2,500+ lines total) # Generic components
│   │       │   
│   │       ├── modals/ (6,602 lines total)    # Modal dialogs
│   │       │   ├── UImodals/ (1,500+ lines total) # UI modals
│   │       │   │  
│   │       ├── shadCN/ (2,442 lines total)    # ShadCN UI components
│   │       │  
│   │       └── index.ts (42 lines)            # Barrel exports
│   │
│   ├── hooks/ (900+ lines total)              # Custom React hooks
│   │   ├── index.ts (10 lines)                # Hook exports
│   │  
│   │
│   └── lib/ (28,000+ lines total)             # Core library code
│      
│       │
│       ├── constants/ (2,000+ lines total)     # Game constants and configuration
│      
│       │   ├── constants.ts (135 lines)       # Core game constants
│       │   ├── constants.dev.ts (23 lines)    # Development constants
│       │   ├── economyConstants.ts (159 lines) # Economy phase and credit rating constants
│       │   ├── financeConstants.ts (80 lines) # Financial constants
│      
│       │   └── index.ts (9 lines)             # Constants barrel exports
│       │
│       ├── database/ (1,540 lines total)      # Database layer
│       │  
│       │   ├── core/ (1,600+ lines total)      # Core database operations
│       │   │   ├── achievementsDB.ts (228 lines) # Achievements database
│       │   │   ├── companiesDB.ts (186 lines) # Companies database
│       │   │   ├── gamestateDB.ts (53 lines)  # Game state database
│       │   │   ├── highscoresDB.ts (174 lines) # Highscores database
│       │   │   ├── notificationsDB.ts (151 lines) # Notifications database
│       │   │   ├── supabase.ts (7 lines)      # Supabase configuration
│       │   │   ├── transactionsDB.ts (71 lines) # Transactions database
│       │   │   ├── usersDB.ts (98 lines)      # Users database
│       │   │   ├── userSettingsDB.ts (95 lines) # User settings database
│       │   └── index.ts (15 lines)            # Database barrel exports
│       │
│       ├── services/ (8,500+ lines total)     # Business logic services
│       │   │   └── index.ts (29 lines)        # Activity services exports
│       │   ├── core/ (1,200+ lines total)    # Core services
│       │   │   ├── gameState.ts (277 lines)   # Game state management
│       │   │   ├── gameTick.ts (269 lines)    # Game tick system
│       │   │   ├── notificationService.ts (242 lines) # Centralized notification service
│       │   │   └── index.ts (116 lines)       # Core services exports
│       │   ├── finance/ (2,400+ lines total) # Finance services
│       │   │   ├── economyService.ts (90 lines) # Economy phase transitions
│       │   │   ├── financeService.ts (350 lines) # Finance operations
│       │   │   ├── loanService.ts (900+ lines) # Loan management
│       │   │   ├── wageService.ts (260 lines) # Wage calculations & staff XP

│       │   ├── user/ (3,372 lines total)      # User services
│       │   │   ├── achievementService.ts (772 lines) # Achievement system
│       │   │   ├── authService.ts (182 lines) # Authentication service
│       │   │   ├── companyService.ts (137 lines) # Company management
│       │   │   ├── financeService.ts (282 lines) # Finance service
│       │   │   ├── highscoreService.ts (302 lines) # Highscore service
│       │   │   ├── userSettingsService.ts (195 lines) # User settings
│       │   │   └── index.ts (116 lines)       # User services exports
│       │   
│       │   └── index.ts (116 lines)           # Services barrel exports
│       │
│       ├── types/ (865 lines total)           # TypeScript type definitions
│       │   ├── types.ts (588 lines)           # Core game types
│       │   ├── UItypes.ts (64 lines)          # UI component types
│       │
│       └── utils/ (1,471 lines total)         # Utility functions
│           ├── colorMapping.ts (184 lines)    # Color mapping utilities
│           ├── companyUtils.ts (30 lines)     # Company utility functions
│           ├── icons.tsx (107 lines)          # Icon utilities
│           ├── index.ts (13 lines)            # Utils barrel exports
│           ├── toast.ts (171 lines)           # Toast notification utilities
│           └── utils.ts (519 lines)           # General utilities
│
├── tests/                          # Vitest suites (activity/finance/user/vineyard/wine)

└── node_modules/                   # Dependencies (not tracked in git)
```
## 📊 Code Statistics

### Line Count Summary (src/ directory only)

### Breakdown by File Type
---

**Last Updated**: 

