import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { CashFlowView } from './finance/CashFlowView';
import { BalanceView } from './finance/BalanceView';

interface FinanceProps {
  currentCompany?: { id: string; name: string; money: number } | null;
}

export default function Finance({ currentCompany }: FinanceProps) {
  const [activeTab, setActiveTab] = useState('balance');

  return (
    <div className="space-y-6">
      {/* Header */}
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
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="balance">Balance</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
        </TabsList>

        <TabsContent value="balance" className="space-y-6 mt-6">
          <BalanceView money={currentCompany?.money ?? 0} />
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-6 mt-6">
          <CashFlowView companyId={currentCompany?.id ?? null} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
