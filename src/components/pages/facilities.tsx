import type { Facility } from '@/lib/types/types';

interface FacilitiesProps {
  facilities: Facility[];
  onFacilitiesUpdate?: (facilities: Facility[]) => void;
}

export function Facilities(_props: FacilitiesProps) {
  return (
    <main className="container mx-auto px-4 py-8">
      {/* Facilities page - to be implemented */}
    </main>
  );
}

