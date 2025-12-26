import type { Facility } from '@/lib/types/types';
import { FacilityCard } from './FacilityCard';

interface FacilitiesListProps {
  facilities: Facility[];
  title?: string;
}

export function FacilitiesList({
  facilities,
  title = 'Production Facilities',
}: FacilitiesListProps) {
  if (facilities.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">No facilities found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground">
          {facilities.length} facility{facilities.length !== 1 ? 'ies' : ''}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {facilities.map((facility) => (
          <FacilityCard key={facility.id} facility={facility} />
        ))}
      </div>
    </div>
  );
}

