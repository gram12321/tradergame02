/**
 * Get time until next tick as formatted string
 */
export function getTimeUntilNextTick(nextTickTime: string): string {
  const now = new Date();
  const nextTick = new Date(nextTickTime);
  const diffMs = nextTick.getTime() - now.getTime();
  
  if (diffMs <= 0) {
    return 'Ready';
  }
  
  const minutes = Math.floor(diffMs / 60000);
  const seconds = Math.floor((diffMs % 60000) / 1000);
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

