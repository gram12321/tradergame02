import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from '../ui';
import { Trophy } from 'lucide-react';
import { PageProps, CompanyProps } from '../../lib/types/UItypes';

interface AchievementsProps extends PageProps, CompanyProps {
  // Inherits currentCompany and onBack from shared interfaces
}

export function Achievements({ onBack }: AchievementsProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Achievements
          </h2>
          <p className="text-muted-foreground mt-1">
            Achievement system coming soon
          </p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
        )}
      </div>

      {/* Placeholder Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Achievements
          </CardTitle>
          <CardDescription>
            The achievement system will be implemented here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This page is a placeholder for the future achievements system.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}