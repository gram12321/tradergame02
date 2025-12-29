interface AchievementsProps {
  currentCompany?: any;
  onBack?: () => void;
}

export function Achievements({ currentCompany, onBack }: AchievementsProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Achievements</h1>
      <p className="text-muted-foreground">Achievements page - to be implemented</p>
    </div>
  );
}

