import { formatNumber, getColorClass } from '@/lib/utils';
import { calculateFinancialData, calculateCompanyValue } from '@/lib/services';
import { SimpleCard } from '../ui';
import { useGameStateWithData } from '@/hooks';
import { DEFAULT_FINANCIAL_DATA, FINANCE_PERIOD_LABELS } from '@/lib/constants/financeConstants';

interface IncomeBalanceViewProps {
  period: 'monthly' | 'yearly' | 'all';
  filters: {
    month?: number;
    year?: number;
  };
}

const FinancialSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="border border-gray-300 rounded-md p-4 mb-4">
    <h3 className="font-semibold text-gray-800 mb-2 uppercase text-sm tracking-wider">{title}</h3>
    <div className="space-y-1">
      {children}
    </div>
  </div>
);

const DataRow: React.FC<{ label: string; value: string | number; valueClass?: string }> = ({ label, value, valueClass = '' }) => (
  <div className="flex justify-between text-sm">
    <span>{label}</span>
    <span className={`font-medium ${valueClass}`}>{typeof value === 'number' ? formatNumber(value, { currency: true }) : value}</span>
  </div>
);

export function IncomeBalanceView({ period, filters }: IncomeBalanceViewProps) {
  const financialData = useGameStateWithData(
    () => calculateFinancialData(period, filters),
    DEFAULT_FINANCIAL_DATA
  );

  const periodLabels = period === 'monthly' 
    ? { income: 'MONTHLY INCOME', expenses: 'MONTHLY EXPENSES' }
    : period === 'yearly'
    ? { income: 'YEARLY INCOME', expenses: 'YEARLY EXPENSES' }
    : FINANCE_PERIOD_LABELS.all;
  const periodLabel = period === 'all' ? 'All Time' : `${period.charAt(0).toUpperCase() + period.slice(1)}`;

  // Calculate company value using centralized function
  const companyValue = useGameStateWithData(
    () => calculateCompanyValue(),
    0
  );

  return (
    <div className="space-y-6">
      {/* Top Row: Income Statement and Balance Sheet Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SimpleCard
          title="Income Statement"
          description="Your revenue and expense breakdown"
        >
          <FinancialSection title={periodLabels.income}>
            {financialData.incomeDetails.length > 0 ? (
              financialData.incomeDetails.map((item, index) => (
                <DataRow key={index} label={item.description} value={item.amount} valueClass="text-emerald-600" />
              ))
            ) : (
              <DataRow label={`Total ${periodLabel} Income`} value={financialData.income} valueClass="text-emerald-600" />
            )}
          </FinancialSection>

          <FinancialSection title={periodLabels.expenses}>
            {financialData.expenseDetails.length > 0 ? (
              financialData.expenseDetails.map((item, index) => (
                <DataRow key={index} label={item.description} value={item.amount} valueClass={getColorClass(0.2)} />
              ))
            ) : (
              <DataRow label={`Total ${periodLabel} Expenses`} value={financialData.expenses} valueClass={getColorClass(0.2)} />
            )}
          </FinancialSection>

          <FinancialSection title="NET INCOME">
            <DataRow label={`${periodLabel} Income`} value={financialData.income} valueClass={getColorClass(0.8)} />
            <DataRow label={`${periodLabel} Expenses`} value={financialData.expenses} valueClass={getColorClass(0.2)} />
            <hr className="my-1 border-gray-300" />
            <DataRow label="Net Income" value={financialData.netIncome} valueClass={getColorClass(financialData.netIncome >= 0 ? 0.8 : 0.2)} />
          </FinancialSection>
        </SimpleCard>

        <SimpleCard
          title="Balance Sheet Summary"
          description="Assets overview"
        >
          <FinancialSection title="BALANCE SHEET SUMMARY">
            <div className="space-y-3">
              {/* Assets Section */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-base">Total Assets</span>
                  <span className="font-bold text-lg">{formatNumber(financialData.totalAssets, { currency: true })}</span>
                </div>
              </div>
              
              <hr className="my-2 border-gray-400" />
              
              {/* Company Value */}
              <div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-base">Company Value</span>
                  <span className="font-bold text-lg">{formatNumber(companyValue, { currency: true })}</span>
                </div>
              </div>
            </div>
          </FinancialSection>
        </SimpleCard>
      </div>

      {/* Bottom Row: Assets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SimpleCard
          title="Assets"
          description="What your company owns"
        >
          <FinancialSection title="TOTAL ASSETS">
            <DataRow label="Cash" value={financialData.cashMoney} />
            <DataRow label="Fixed Assets" value={financialData.fixedAssets} />
            <DataRow label="Current Assets" value={financialData.currentAssets} />
            <hr className="my-1 border-gray-300" />
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total Assets</span>
              <span className="font-bold text-base">{formatNumber(financialData.totalAssets, { currency: true })}</span>
            </div>
          </FinancialSection>

          <FinancialSection title="CASH">
            <DataRow label="Available Cash" value={financialData.cashMoney} />
          </FinancialSection>
          
          <FinancialSection title="FIXED ASSETS">
            <DataRow label="Buildings" value={financialData.buildingsValue} />
            <hr className="my-1 border-gray-300" />
            <DataRow label="Total Fixed Assets" value={financialData.fixedAssets} />
          </FinancialSection>

          <FinancialSection title="CURRENT ASSETS">
            <DataRow label="Inventory" value={financialData.currentAssets} />
            <hr className="my-1 border-gray-300" />
            <DataRow label="Total Current Assets" value={financialData.currentAssets} />
          </FinancialSection>
        </SimpleCard>
      </div>
    </div>
  );
}
