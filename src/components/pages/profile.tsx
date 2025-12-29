interface ProfileProps {
  currentCompany?: any;
  onCompanySelected?: (company: any) => void;
  onBackToLogin?: () => void;
}

export function Profile({ currentCompany, onCompanySelected, onBackToLogin }: ProfileProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Profile</h1>
      <p className="text-muted-foreground">Profile page - to be implemented</p>
    </div>
  );
}

