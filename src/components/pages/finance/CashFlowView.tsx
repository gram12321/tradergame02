import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { formatNumber } from '@/lib/utils';
import { getTransactionsByCompanyId, Transaction } from '@/lib/database';

type FlowType = 'income' | 'expense' | 'capital';

const FLOW_TYPE_META: Record<FlowType, { label: string; textClass: string; badgeClass: string }> = {
  income: {
    label: 'Income',
    textClass: 'text-green-600',
    badgeClass: 'bg-green-100 text-green-800'
  },
  expense: {
    label: 'Expense',
    textClass: 'text-red-600',
    badgeClass: 'bg-red-100 text-red-800'
  },
  capital: {
    label: 'Capital',
    textClass: 'text-blue-600',
    badgeClass: 'bg-blue-100 text-blue-800'
  }
};

function getFlowType(category: string, amount: number): FlowType {
  const capitalCategories = ['starting_capital'];
  if (capitalCategories.includes(category)) {
    return 'capital';
  }
  return amount >= 0 ? 'income' : 'expense';
}

export function CashFlowView({ companyId }: { companyId: string | null }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!companyId) {
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    const fetchTransactions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getTransactionsByCompanyId(companyId);
        setTransactions(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch transactions'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [companyId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Statement</CardTitle>
          <CardDescription>Loading transaction history...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 text-gray-500">
            <p>Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Statement</CardTitle>
          <CardDescription>Error loading transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 text-red-500">
            <p>{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash Flow Statement</CardTitle>
        <CardDescription>Detailed transaction history and cash flow tracking</CardDescription>
      </CardHeader>
      <CardContent>
        {transactions.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block border border-gray-300 rounded-md overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="text-gray-800">Date</TableHead>
                    <TableHead className="text-gray-800">Type</TableHead>
                    <TableHead className="text-gray-800">Description</TableHead>
                    <TableHead className="text-right text-gray-800">Amount (€)</TableHead>
                    <TableHead className="text-right text-gray-800">Balance (€)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => {
                    const flowType = getFlowType(transaction.category, transaction.amount);
                    const flowMeta = FLOW_TYPE_META[flowType];
                    return (
                      <TableRow key={transaction.id} className="hover:bg-gray-50">
                        <TableCell className="text-sm">
                          {transaction.gameDate.year}/{transaction.gameDate.month}/{transaction.gameDate.day}
                        </TableCell>
                        <TableCell>
                          <span className={`text-sm font-medium ${flowMeta.textClass}`}>
                            {flowMeta.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">{transaction.description}</TableCell>
                        <TableCell className={`text-sm text-right ${flowMeta.textClass}`}>
                          {transaction.amount >= 0 ? '+' : '-'}{formatNumber(Math.abs(transaction.amount), { currency: true })}
                        </TableCell>
                        <TableCell className="text-sm text-right font-medium">
                          {formatNumber(transaction.balanceAfter, { currency: true })}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-3">
              {transactions.map((transaction) => {
                const flowType = getFlowType(transaction.category, transaction.amount);
                const flowMeta = FLOW_TYPE_META[flowType];
                const gradientClass =
                  flowType === 'income'
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50'
                    : flowType === 'expense'
                      ? 'bg-gradient-to-r from-red-50 to-orange-50'
                      : 'bg-gradient-to-r from-blue-50 to-indigo-50';

                return (
                  <div key={transaction.id} className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                    <div className={`p-4 ${gradientClass}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">
                            {transaction.gameDate.year}/{transaction.gameDate.month}/{transaction.gameDate.day}
                          </div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${flowMeta.badgeClass}`}>
                            {flowMeta.label}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${flowMeta.textClass}`}>
                            {transaction.amount >= 0 ? '+' : '-'}{formatNumber(Math.abs(transaction.amount), { currency: true })}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-700 mt-2">{transaction.description}</div>
                    </div>
                    <div className="px-4 py-3 bg-gray-50 border-t flex justify-between items-center">
                      <span className="text-xs text-gray-600">Balance After:</span>
                      <span className="text-sm font-medium text-gray-900">{formatNumber(transaction.balanceAfter, { currency: true })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-10 text-gray-500 border border-gray-300 rounded-md">
            <p className="text-lg mb-2">📊 No Transaction History</p>
            <p className="text-sm">Your financial transactions will appear here as you play.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

