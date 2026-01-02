-- Transactions Table
-- Stores all financial transactions for companies
-- Tracks money flow in and out, categories, and running balance

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Company reference
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Transaction details
  amount NUMERIC(12, 2) NOT NULL, -- Positive for income, negative for expenses
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- e.g., 'sales', 'purchase', 'wages', 'facility_cost'
  recurring BOOLEAN DEFAULT FALSE, -- For recurring transactions (future use)
  
  -- Balance tracking
  balance_after NUMERIC(12, 2) NOT NULL, -- Running balance after this transaction
  
  -- Game time (when transaction occurred)
  game_day INTEGER NOT NULL,
  game_month INTEGER NOT NULL,
  game_year INTEGER NOT NULL,
  game_tick INTEGER NOT NULL DEFAULT 0,
  
  -- System timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_company_id ON transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_transactions_game_date ON transactions(game_year DESC, game_month DESC, game_day DESC, game_tick DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_company_date ON transactions(company_id, game_year DESC, game_month DESC, game_day DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Companies can view their own transactions
CREATE POLICY "Companies can view their own transactions"
  ON transactions
  FOR SELECT
  USING (company_id IN (SELECT id FROM companies));

-- Policy: Companies can insert their own transactions
CREATE POLICY "Companies can create transactions"
  ON transactions
  FOR INSERT
  WITH CHECK (company_id IN (SELECT id FROM companies));

-- Policy: No one can update or delete transactions (immutable ledger)
-- Transactions should be permanent once created for audit trail

COMMENT ON TABLE transactions IS 'Financial transactions ledger for all companies';
COMMENT ON COLUMN transactions.company_id IS 'The company this transaction belongs to';
COMMENT ON COLUMN transactions.amount IS 'Transaction amount (positive = income, negative = expense)';
COMMENT ON COLUMN transactions.description IS 'Human-readable description of the transaction';
COMMENT ON COLUMN transactions.category IS 'Transaction category for reporting (sales, purchase, wages, etc)';
COMMENT ON COLUMN transactions.balance_after IS 'Company balance after this transaction was applied';
COMMENT ON COLUMN transactions.game_day IS 'Game day when transaction occurred';
COMMENT ON COLUMN transactions.game_month IS 'Game month when transaction occurred';
COMMENT ON COLUMN transactions.game_year IS 'Game year when transaction occurred';
COMMENT ON COLUMN transactions.game_tick IS 'Game tick when transaction occurred';

