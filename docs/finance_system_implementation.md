# Finance System Implementation

## Overview

A simple finance system that tracks company money and transactions. Each company starts with 1000 in capital and all financial activity is recorded in a transaction ledger.

## Key Features

✅ **Starting Capital**: New companies start with 1000 (configurable in `GAME_INITIALIZATION.STARTING_CAPITAL`)  
✅ **Transaction Ledger**: All money movement is recorded with timestamp, description, and category  
✅ **Balance Tracking**: Each transaction records the running balance  
✅ **Category System**: Transactions are categorized (sales, purchase, starting_capital, etc.)  
✅ **Capital Flow Separation**: Capital flow transactions (loans, investments) separate from operational income/expenses  
✅ **Immutable Records**: Transactions cannot be edited or deleted once created (audit trail)  

## Database Schema

### Table: `transactions`

**File**: `docs/sql_scripts/create_transactions_table.sql`

**Columns**:
- `id` (UUID): Unique transaction identifier
- `company_id` (UUID): Foreign key to companies table
- `amount` (NUMERIC): Transaction amount (positive = income, negative = expense)
- `description` (TEXT): Human-readable description
- `category` (TEXT): Transaction category for reporting
- `recurring` (BOOLEAN): Flag for recurring transactions
- `balance_after` (NUMERIC): Company balance after this transaction
- `game_day`, `game_month`, `game_year`, `game_tick` (INTEGER): When transaction occurred
- `created_at` (TIMESTAMP): System timestamp

**Indexes**:
- `idx_transactions_company_id`: Fast company lookups
- `idx_transactions_game_date`: Fast date-based queries
- `idx_transactions_category`: Category filtering
- `idx_transactions_company_date`: Combined company + date queries

**RLS Policies**:
- Companies can view their own transactions
- Companies can create transactions
- No one can update/delete (immutable ledger)

## Architecture

### Database Layer: `src/lib/database/finance/transactionsDB.ts`

Handles all direct database operations.

**Key Functions**:
- `getTransactionsByCompanyId(companyId)`: Get all transactions for a company
- `getLatestTransaction(companyId)`: Get most recent transaction (for balance)
- `createTransaction(transaction)`: Create new transaction
- `getTransactionsByCategory(companyId, category)`: Filter by category
- `getTransactionsByDateRange(companyId, start, end)`: Date range queries
- `getTransactionCount(companyId)`: Count transactions

### Service Layer: `src/lib/services/finance/transactionService.ts`

Handles business logic and transaction processing.

**Key Functions**:
- `addTransaction(company, amount, description, category, recurring)`: Main transaction function
- `createStartingCapitalTransaction(companyName, amount)`: Initial capital
- `getCompanyTransactions(companyName)`: Get all transactions
- `getCurrentBalance(companyName)`: Get current balance
- `getFinancialSummary(companyName)`: Income/expense summary
- `canAfford(companyName, amount)`: Check if affordable
- `processPurchase(companyName, amount, description)`: Handle purchase
- `processSale(companyName, amount, description)`: Handle sale

### Transaction Categories

**Income Categories**:
- `sales`: Product/service sales
- `market_sale`: Marketplace sales

**Expense Categories**:
- `purchase`: Resource purchases
- `market_purchase`: Marketplace purchases
- `facility_cost`: Facility-related costs
- `wages`: Employee wages
- `maintenance`: Maintenance costs

**Capital Flow** (not in P&L):
- `starting_capital`: Initial capital
- `loan_received`: Loan proceeds
- `loan_payment`: Loan repayments
- `investment`: Investments

**Other**:
- `other_income`: Miscellaneous income
- `other_expense`: Miscellaneous expenses

## Integration

### Company Creation

Companies now automatically:
1. Get created with `STARTING_CAPITAL` (1000) in `companiesDB.ts`
2. Get a starting capital transaction recorded in `companyService.ts`

### Usage Examples

```typescript
import { 
  addTransaction, 
  processPurchase, 
  processSale,
  canAfford,
  getFinancialSummary 
} from '@/lib/services';

// Add a transaction
await addTransaction(
  'CompanyName',
  100,  // amount (positive = income, negative = expense)
  'Sold 10 wheat',
  'sales'
);

// Process a purchase (checks if affordable)
const transaction = await processPurchase(
  'CompanyName',
  50,  // amount to spend
  'Bought 5 flour',
  'purchase'
);

if (!transaction) {
  console.log('Cannot afford this purchase');
}

// Process a sale
await processSale(
  'CompanyName',
  100,
  'Sold 10 bread',
  'sales'
);

// Check if can afford
const affordable = await canAfford('CompanyName', 500);

// Get financial summary
const summary = await getFinancialSummary('CompanyName');
console.log(`Income: ${summary.income}`);
console.log(`Expenses: ${summary.expenses}`);
console.log(`Net: ${summary.netIncome}`);
console.log(`Balance: ${summary.balance}`);
```

## Installation

### 1. Create Database Table

Run the SQL script in Supabase SQL Editor:

```bash
# File: docs/sql_scripts/create_transactions_table.sql
```

Or via Supabase Dashboard:
1. Go to SQL Editor
2. Copy contents of `docs/sql_scripts/create_transactions_table.sql`
3. Run the script

### 2. Verify Setup

The system is ready when:
- ✅ `transactions` table exists in database
- ✅ New companies get 1000 starting capital
- ✅ Starting capital transaction is created
- ✅ Barrel exports updated

## File Structure

**Database Layer**:
- `src/lib/database/finance/transactionsDB.ts` - Database operations
- `src/lib/database/index.ts` - Barrel export

**Service Layer**:
- `src/lib/services/finance/transactionService.ts` - Business logic
- `src/lib/services/finance/index.ts` - Barrel export
- `src/lib/services/index.ts` - Main barrel export

**Constants**:
- `src/lib/constants/constants.ts` - STARTING_CAPITAL constant

**SQL Scripts**:
- `docs/sql_scripts/create_transactions_table.sql` - Table creation

**Documentation**:
- `docs/finance_system_implementation.md` - This file

## Future Enhancements

### Planned Features
- **Transaction History UI**: View transaction ledger with filtering
- **Financial Reports**: Income statement, cash flow statement
- **Charts & Analytics**: Visual financial performance tracking
- **Budget System**: Set budgets by category, track vs actual
- **Forecasting**: Predict future cash flow based on trends
- **Multi-Currency**: Support for different currencies
- **Tax System**: Track tax liability and payments
- **Loan System**: Borrow and repay with interest
- **Investment System**: Invest excess cash for returns

### Marketplace Integration

When implementing marketplace purchases:

```typescript
// In marketplace purchase handler
const transaction = await processPurchase(
  buyerCompanyName,
  totalPrice,
  `Purchased ${quantity} ${resourceName} from marketplace`,
  TRANSACTION_CATEGORIES.MARKET_PURCHASE
);

if (!transaction) {
  // Show "insufficient funds" error
  return;
}

// Process the sale for seller
await processSale(
  sellerCompanyName,
  totalPrice,
  `Sold ${quantity} ${resourceName} on marketplace`,
  TRANSACTION_CATEGORIES.MARKET_SALE
);

// Transfer resources, update listings, etc.
```

## Testing Checklist

- [ ] Run SQL script to create transactions table
- [ ] Create a new company - should have 1000 money
- [ ] Check transactions table - should have starting_capital transaction
- [ ] Test `processPurchase` with sufficient funds
- [ ] Test `processPurchase` with insufficient funds (should return null)
- [ ] Test `processSale`
- [ ] Check company balance updates correctly
- [ ] Verify transactions are sorted by date (newest first)
- [ ] Test `getFinancialSummary` - income/expenses calculated correctly
- [ ] Verify capital flow transactions excluded from P&L

## Troubleshooting

**Issue**: Company created but no starting transaction
- Check logs for transaction creation errors
- Verify transactions table exists
- Check RLS policies allow insertion

**Issue**: Balance mismatch between company.money and latest transaction
- These should always match after a transaction
- If mismatch, investigate transaction creation flow
- Check for race conditions in concurrent operations

**Issue**: Cannot create transactions
- Verify RLS policies are correct
- Check company_id is valid UUID
- Ensure transaction fields are valid (amount not NaN, etc.)

## API Reference

See inline documentation in:
- `src/lib/database/finance/transactionsDB.ts`
- `src/lib/services/finance/transactionService.ts`

All functions are fully typed with TypeScript and include JSDoc comments.

---

**Status**: ✅ **COMPLETE - READY FOR DATABASE TABLE CREATION**

Run the SQL script, then the finance system will be fully operational!

