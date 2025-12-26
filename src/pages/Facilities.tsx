import { FacilitiesList } from '@/components/facilities';
import type { Facility } from '@/lib/types/types';

interface FacilitiesProps {
  facilities: Facility[];
}

export function Facilities({ facilities }: FacilitiesProps) {
  // Filter to show only production facilities
  const productionFacilities = facilities.filter(
    (f) => f.type === 'production'
  );

  return (
    <div className="container mx-auto p-8">
      <FacilitiesList facilities={productionFacilities} />
    </div>
  );
}

