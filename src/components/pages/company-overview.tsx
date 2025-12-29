interface CompanyOverviewProps {
  onNavigate?: (page: string) => void;
}

export function CompanyOverview({ onNavigate }: CompanyOverviewProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Company Overview</h1>
      <p className="text-muted-foreground">Company overview page - to be implemented</p>
    </div>
  );
}

