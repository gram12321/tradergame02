import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Button,
  Separator,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Label
} from "@/components/ui";
import { IncomeBalanceView } from './IncomeBalanceView';
import { CashFlowView } from './CashFlowView';
import { ResearchPanel } from './ResearchPanel';
import { StaffWageSummary } from './StaffWageSummary';
import LoansView from './LoansView';
import { FINANCE_TAB_STYLES, FINANCE_BUTTON_STYLES } from '@/lib/constants/financeConstants';
import { MONTHS_PER_YEAR } from '@/lib/constants/timeConstants';
import { useGameState, useGameStateWithData } from '@/hooks';
import { loadTransactions } from '@/lib/services';

export default function FinanceView() {
  const [activeTab, setActiveTab] = useState('income');
  const [activePeriod, setActivePeriod] = useState<'monthly' | 'yearly' | 'all'>('monthly');
  const gameState = useGameState();
  const transactions = useGameStateWithData(loadTransactions, []);

  const currentYear = gameState.currentYear ?? new Date().getFullYear();
  const currentMonth = gameState.month ?? 1;

  const [selectedYear, setSelectedYear] = useState(() => currentYear);
  const [selectedMonth, setSelectedMonth] = useState(() => currentMonth);

  const previousCurrentRef = useRef({
    year: currentYear,
    month: currentMonth
  });

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    transactions.forEach(transaction => {
      if (transaction.date.year <= currentYear) {
        years.add(transaction.date.year);
      }
    });

    years.add(currentYear);

    return Array.from(years).sort((a, b) => b - a);
  }, [transactions, currentYear]);

  const availableMonths = useMemo(() => {
    const limit = selectedYear === currentYear
      ? currentMonth
      : MONTHS_PER_YEAR;

    const clampedLimit = Math.min(Math.max(limit, 1), MONTHS_PER_YEAR);

    return Array.from({ length: clampedLimit }, (_, index) => index + 1);
  }, [selectedYear, currentYear, currentMonth]);

  const periodFilters = useMemo(() => ({
    year: selectedYear,
    month: activePeriod === 'monthly' ? selectedMonth : undefined
  }), [selectedYear, selectedMonth, activePeriod]);

  useEffect(() => {
    if (!availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0] ?? currentYear);
    }
  }, [availableYears, selectedYear, currentYear]);

  useEffect(() => {
    if (selectedYear === currentYear) {
      if (selectedMonth > currentMonth) {
        setSelectedMonth(currentMonth);
      }
    } else if (selectedMonth > MONTHS_PER_YEAR) {
      setSelectedMonth(MONTHS_PER_YEAR);
    }
  }, [selectedYear, currentYear, currentMonth, selectedMonth]);

  useEffect(() => {
    const previous = previousCurrentRef.current;
    const isFollowingCurrentSelection =
      selectedYear === previous.year &&
      selectedMonth === previous.month;

    if (isFollowingCurrentSelection) {
      setSelectedYear(currentYear);
      setSelectedMonth(currentMonth);
    }

    previousCurrentRef.current = {
      year: currentYear,
      month: currentMonth
    };
  }, [currentYear, currentMonth, selectedYear, selectedMonth]);

  const renderPeriodSelectors = () => {
    if (activePeriod === 'all') {
      return null;
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="flex flex-col space-y-2">
          <Label htmlFor="finance-year-select" className="text-xs uppercase tracking-wide text-gray-600">
            Year
          </Label>
          <Select
            value={String(selectedYear)}
            onValueChange={(value) => setSelectedYear(Number(value))}
          >
            <SelectTrigger id="finance-year-select" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map(year => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {activePeriod === 'monthly' && (
          <div className="flex flex-col space-y-2">
            <Label htmlFor="finance-month-select" className="text-xs uppercase tracking-wide text-gray-600">
              Month
            </Label>
            <Select
              value={String(selectedMonth)}
              onValueChange={(value) => setSelectedMonth(Number(value))}
            >
              <SelectTrigger id="finance-month-select" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.map(month => (
                  <SelectItem key={month} value={String(month)}>
                    Month {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div
        className="h-48 bg-cover bg-center rounded-lg relative"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&h=400&fit=crop')"
        }}
      >
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-900 to-transparent p-4">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-white text-2xl font-semibold flex items-center gap-3">
                <span className="text-2xl">💰</span>
                Finance Management
              </h2>
              <p className="text-white/90 text-sm mt-1">Track your financial performance and growth</p>
            </div>
            <div className="text-white/80 text-sm">
              {activeTab === 'income' ? 'Income & Balance' : activeTab === 'cashflow' ? 'Cash Flow' : activeTab === 'loans' ? 'Loans' : 'Research & Upgrades'}
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="income" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-transparent p-0 mb-4 space-x-2">
          <TabsTrigger
            value="income"
            className={`${FINANCE_TAB_STYLES.trigger} ${activeTab === 'income' ? FINANCE_TAB_STYLES.active : FINANCE_TAB_STYLES.inactive}`}>
            Income/Balance
          </TabsTrigger>
          <TabsTrigger
            value="cashflow"
            className={`${FINANCE_TAB_STYLES.trigger} ${activeTab === 'cashflow' ? FINANCE_TAB_STYLES.active : FINANCE_TAB_STYLES.inactive}`}>
            Cash Flow
          </TabsTrigger>
          <TabsTrigger
            value="loans"
            className={`${FINANCE_TAB_STYLES.trigger} ${activeTab === 'loans' ? FINANCE_TAB_STYLES.active : FINANCE_TAB_STYLES.inactive}`}>
            Loans
          </TabsTrigger>
          <TabsTrigger
            value="upgrades"
            className={`${FINANCE_TAB_STYLES.trigger} ${activeTab === 'upgrades' ? FINANCE_TAB_STYLES.active : FINANCE_TAB_STYLES.inactive}`}>
            Research and Upgrades
          </TabsTrigger>
        </TabsList>

        {activeTab === 'income' && (
          <>
            <div className="mb-4 flex flex-wrap gap-2">
              <Button
                onClick={() => setActivePeriod('monthly')}
                className={`${FINANCE_BUTTON_STYLES.period} ${activePeriod === 'monthly' ? FINANCE_BUTTON_STYLES.periodActive : FINANCE_BUTTON_STYLES.periodInactive}`}>
                Monthly
              </Button>
              <Button
                onClick={() => setActivePeriod('yearly')}
                className={`${FINANCE_BUTTON_STYLES.period} ${activePeriod === 'yearly' ? FINANCE_BUTTON_STYLES.periodActive : FINANCE_BUTTON_STYLES.periodInactive}`}>
                Yearly
              </Button>
              <Button
                onClick={() => setActivePeriod('all')}
                className={`${FINANCE_BUTTON_STYLES.period} ${activePeriod === 'all' ? FINANCE_BUTTON_STYLES.periodActive : FINANCE_BUTTON_STYLES.periodInactive}`}>
                All Time
              </Button>
            </div>
            {renderPeriodSelectors()}
          </>
        )}

        <Separator className="mb-6 bg-gray-300" />

        <TabsContent value="income">
          <div className="space-y-6">
            <IncomeBalanceView period={activePeriod} filters={periodFilters} />
            <StaffWageSummary />
          </div>
        </TabsContent>
        <TabsContent value="cashflow">
          <CashFlowView />
        </TabsContent>
        <TabsContent value="loans">
          <LoansView />
        </TabsContent>
        <TabsContent value="upgrades">
          <ResearchPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
