# Finance System Implementation

## Purpose

Tracks company cash and records all money movement in an immutable transaction ledger. New companies start with `STARTING_CAPITAL` (default 1000).

## What Matters

- Every balance change creates a `transactions` row with a running `balance_after`.
- Transactions are append-only; no updates/deletes (audit trail).
- Categories separate operational activity from capital flow (e.g., `starting_capital`).

## Data Model

**Table**: `transactions`  
**Source**: `docs/sql_scripts/create_transactions_table.sql`

**Required fields**: `company_id`, `amount`, `description`, `category`, `balance_after`, `game_day`, `game_month`, `game_year`, `game_tick`, `created_at`

**Indexes**: company, game date, category, company+date

**RLS**: company can read/create its own rows; no updates/deletes.

## Code Entry Points

**DB layer**: `src/lib/database/finance/transactionsDB.ts`  
Create/read helpers, including `getLatestTransaction` and `createTransaction`.

**Service layer**: `src/lib/services/finance/transactionService.ts`  
Business logic: `addTransaction`, `processPurchase`, `processSale`, `canAfford`, summaries.

**Starting capital**:
- `STARTING_CAPITAL` in `src/lib/constants/constants.ts`
- Applied during company creation; a starting-capital transaction is recorded.

## Transaction Categories (current set)

- Income: `sales`, `market_sale`
- Expense: `purchase`, `market_purchase`
- Capital flow (not P&L): `starting_capital`
- Other: `other_income`, `other_expense`
