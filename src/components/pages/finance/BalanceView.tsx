import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { formatNumber } from '@/lib/utils';

interface BalanceViewProps {
  money: number;
}

export function BalanceView({ money }: BalanceViewProps) {

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Current Balance */}
      <Card>
        <CardHeader>
          <CardTitle>Current Balance</CardTitle>
          <CardDescription>Your available cash</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
              <span className="text-lg font-semibold text-gray-700">Available Cash</span>
              <span className="text-2xl font-bold text-green-600">
                {formatNumber(money ?? 0, { currency: true })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Overview</CardTitle>
          <CardDescription>Key financial metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Current Balance</span>
              <span className="text-sm font-semibold text-gray-900">
                {formatNumber(money ?? 0, { currency: true })}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Financial Status</span>
              <span className={`text-sm font-semibold ${(money ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(money ?? 0) >= 0 ? 'Positive' : 'Negative'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

