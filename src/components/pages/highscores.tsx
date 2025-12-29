interface HighscoresProps {
  currentCompanyName?: string;
  onBack?: () => void;
}

export function Highscores({ currentCompanyName, onBack }: HighscoresProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Global Leaderboards</h1>
      <p className="text-muted-foreground">Highscores page - to be implemented</p>
    </div>
  );
}

