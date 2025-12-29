# TraderGame02 - Project Information

## 📁 Project File Structure

```
tradergame03/
├── 📄 Configuration Files
│   ├── components.json              # ShadCN UI configuration
│   ├── package.json                 # Dependencies, pnpm scripts
│   ├── pnpm-lock.yaml              # pnpm dependency lock file
│   ├── tailwind.config.js          # Tailwind CSS configuration
│   ├── tsconfig.json               # TypeScript configuration
│   ├── vite.config.ts              # Vite build configuration
│   └── vercel.json                 # Vercel deployment config
│
├── 📄 Documentation
│   ├── readme.md                   # Main project documentation
│   ├── PROJECT_INFO.md             # This file
│   └── docs/                       # Documentation directory
│       ├── AIDescriptions_coregame.md      # Framework architecture
│       ├── AIpromt_codecleaning.md        # Code cleaning prompts
│       ├── AIpromt_docs.md               # Documentation prompts
│       ├── AIpromt_newpromt.md           # Framework overview
│       ├── versionlog.md                 # Version history
│       └── versionlog_legacy.md          # Legacy version history
│
├── 📄 Database & Migrations
│   └── migrations/
│       └── tradergame02_initial_schema.sql  # Minimal framework schema
│
├── 📄 Static Assets
│   └── public/
│       └── assets/
│           └── pic/
│               └── loginbg.webp    # Login background
│
├── 📄 Source Code (src/) - ~11,000 total lines
│   ├── main.tsx                    # Application entry point
│   ├── App.tsx                     # Main application component
│   ├── index.css                   # Global styles
│   │
│   ├── components/                 # React components
│   │   ├── finance/                # Financial components
│   │   │   ├── CashFlowView.tsx    # Cash flow visualization
│   │   │   ├── FinanceView.tsx     # Main finance view
│   │   │   ├── IncomeBalanceView.tsx # Income/balance statements
│   │   │   └── index.ts            # Barrel exports
│   │   │
│   │   ├── layout/                 # Layout components
│   │   │   ├── Header.tsx          # Application header
│   │   │   └── NotificationCenter.tsx # Notification system
│   │   │
│   │   ├── pages/                  # Page components
│   │   │   ├── Achievements.tsx    # Achievements (placeholder)
│   │   │   ├── AdminDashboard.tsx  # Admin tools
│   │   │   ├── CompanyOverview.tsx # Company overview
│   │   │   ├── Finance.tsx         # Finance page
│   │   │   ├── Highscores.tsx      # Leaderboard
│   │   │   ├── Login.tsx           # Authentication
│   │   │   ├── Profile.tsx         # User profile
│   │   │   └── Settings.tsx        # User settings
│   │   │
│   │   └── ui/                     # UI components
│   │       ├── modals/
│   │       │   └── UImodals/
│   │       │       └── StartingConditionsModal.tsx
│   │       ├── shadCN/             # ShadCN UI components (23 files)
│   │       └── index.ts            # Barrel exports
│   │
│   ├── hooks/                      # Custom React hooks
│   │   ├── index.ts                # Hook exports
│   │   ├── use-mobile.tsx          # Mobile detection hook
│   │   ├── useGameState.ts         # Game state management
│   │   ├── useGameUpdates.ts       # Game updates hook
│   │   ├── useLoadingState.ts      # Loading state management
│   │   └── useTableSort.ts         # Table sorting functionality
│   │
│   └── lib/                        # Core library code
│       ├── constants/              # Game constants
│       │   ├── constants.ts        # Core game constants
│       │   ├── financeConstants.ts # Financial constants
│       │   ├── startingConditions.ts # Starting conditions
│       │   ├── timeConstants.ts    # Time constants
│       │   └── index.ts            # Barrel exports
│       │
│       ├── database/               # Database layer
│       │   ├── core/               # Core database operations
│       │   │   ├── companiesDB.ts  # Companies database
│       │   │   ├── gamestateDB.ts  # Game state database
│       │   │   ├── highscoresDB.ts # Highscores database
│       │   │   ├── notificationsDB.ts # Notifications database
│       │   │   ├── supabase.ts     # Supabase configuration
│       │   │   ├── transactionsDB.ts # Transactions database
│       │   │   ├── usersDB.ts      # Users database
│       │   │   └── userSettingsDB.ts # User settings database
│       │   ├── dbMapperUtils.ts    # Database mapper utilities
│       │   └── index.ts            # Barrel exports
│       │
│       ├── services/               # Business logic services
│       │   ├── admin/              # Admin services
│       │   │   └── adminService.ts # Admin operations
│       │   ├── core/               # Core services
│       │   │   ├── gameState.ts    # Game state management
│       │   │   ├── gameTick.ts     # Game tick system
│       │   │   ├── notificationService.ts # Notification service
│       │   │   └── startingConditionsService.ts # Starting conditions
│       │   ├── finance/            # Finance services
│       │   │   └── financeService.ts # Finance operations
│       │   ├── user/               # User services
│       │   │   ├── authService.ts  # Authentication service
│       │   │   ├── companyService.ts # Company management
│       │   │   ├── highscoreService.ts # Highscore service
│       │   │   └── userSettingsService.ts # User settings
│       │   └── index.ts            # Barrel exports
│       │
│       ├── types/                  # TypeScript type definitions
│       │   ├── types.ts            # Core game types
│       │   ├── UItypes.ts          # UI component types
│       │   └── index.ts            # Barrel exports
│       │
│       └── utils/                  # Utility functions
│           ├── colorMapping.ts     # Color mapping utilities
│           ├── icons.tsx           # Icon utilities
│           ├── toast.ts            # Toast notification utilities
│           ├── utils.ts            # General utilities
│           └── index.ts            # Barrel exports
│
├── tests/                          # Test suites
│   ├── finance/
│   ├── user/
│   └── README.md
│
└── server/                         # Dev-only test API helper
    └── test-api.ts
```

## 📊 Code Statistics

### Line Count Summary
- **Total Files**: ~80 TypeScript/TSX files
- **Total Lines of Code**: ~11,000 lines

### Breakdown by Category
- **Components**: ~6,000 lines (pages, layout, finance, ui)
- **Services**: ~3,000 lines (admin, core, finance, user)
- **Database**: ~1,500 lines (core database operations)
- **Hooks**: ~500 lines (state management, utilities)
- **Types & Utils**: ~1,000 lines (types, constants, utilities)

## 🎯 Framework Overview

This is a **minimal framework** extracted from Winemaker04, providing only essential infrastructure:
- User/Company management (1:1 relationship)
- Game state management (time, money)
- Database integration (Supabase)
- Basic finance system (transactions)
- Notification system
- Highscore system
- Admin tools
- UI framework (React + TypeScript + ShadCN)


---

**Last Updated**: 2025-01-27
