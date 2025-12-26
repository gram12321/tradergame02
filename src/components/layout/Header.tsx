import { Button } from '@/components/ui';
import { formatGameDate, getTimeUntilNextTick } from '@/lib/services/core';
import { useGameTick } from '@/hooks/useGameTick';
import type { Facility } from '@/lib/types/types';

interface HeaderProps {
  facilities: Facility[];
  onFacilitiesUpdate?: (facilities: Facility[]) => void;
  isAdmin?: boolean; // Admin flag to show advance button
}

export function Header({
  facilities,
  onFacilitiesUpdate,
  isAdmin = false,
}: HeaderProps) {
  const { gameState, isProcessing, handleAdvanceTick } = useGameTick({
    facilities,
    onFacilitiesUpdate,
    autoAdvanceEnabled: true,
  });

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        {/* Left: Game Info */}
        <div className="flex items-center gap-6">
          <div>
            <div className="text-sm font-medium">Game Date</div>
            <div className="text-lg font-bold">
              {formatGameDate(gameState.time.date)}
            </div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <div className="text-sm font-medium">Game Tick</div>
            <div className="text-sm text-muted-foreground">
              #{gameState.time.tick}
            </div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <div className="text-sm text-muted-foreground">Auto Advance</div>
            <div className="text-sm font-medium">
              {getTimeUntilNextTick(gameState.time.nextTickTime)}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          {isAdmin && (
            <Button
              onClick={handleAdvanceTick}
              disabled={isProcessing || gameState.isProcessing}
              variant="default"
            >
              {isProcessing || gameState.isProcessing
                ? 'Processing...'
                : 'Advance Tick'}
            </Button>
          )}
          {gameState.isProcessing && (
            <div className="text-sm text-muted-foreground">
              Processing game tick...
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

