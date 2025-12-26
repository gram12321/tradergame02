// Winepedia Page - Placeholder for tradergame
import { PageProps } from '@/lib/types/UItypes';

interface WinepediaProps extends PageProps {
  view?: string;
}

export default function Winepedia({}: WinepediaProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Winepedia</h2>
          <p className="text-muted-foreground mt-1">
            Game information - Coming soon for tradergame
          </p>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <p className="text-muted-foreground">
          This page will be rebuilt for the trader game with new functionality.
        </p>
      </div>
    </div>
  );
}
