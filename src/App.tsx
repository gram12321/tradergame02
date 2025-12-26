import { Header } from '@/components/layout';
import { Facilities } from '@/pages/Facilities';
import { useState } from 'react';
import type { Facility } from '@/lib/types/types';

// Mock facilities data
const mockFacilities: Facility[] = [
  {
    id: '1',
    companyId: 'company-1',
    name: 'Main Farm',
    type: 'production',
    facilitySubtype: 'farm',
    cityId: 'city-1',
    effectivity: 75,
    baseEffectivity: 80,
    inventory: {
      items: [{ resourceId: 'grain', quantity: 150 }],
      capacity: 500,
      currentUsage: 150,
    },
    availableRecipeIds: ['produce_grain'],
    productionState: {
      currentRecipeId: 'produce_grain',
      isProducing: true,
      productionProgress: 0,
      ticksRemaining: 1,
    },
    workerCount: 5,
    wageExpense: 50,
  },
  {
    id: '2',
    companyId: 'company-1',
    name: 'Grain Mill',
    type: 'production',
    facilitySubtype: 'mill',
    cityId: 'city-1',
    effectivity: 65,
    baseEffectivity: 70,
    inventory: {
      items: [
        { resourceId: 'grain', quantity: 80 },
        { resourceId: 'flour', quantity: 120 },
      ],
      capacity: 300,
      currentUsage: 200,
    },
    availableRecipeIds: ['mill_grain'],
    productionState: {
      currentRecipeId: 'mill_grain',
      isProducing: true,
      productionProgress: 0,
      ticksRemaining: 1,
    },
    workerCount: 3,
    wageExpense: 30,
  },
  {
    id: '3',
    companyId: 'company-1',
    name: 'Bakery Shop',
    type: 'production',
    facilitySubtype: 'bakery',
    cityId: 'city-1',
    effectivity: 85,
    baseEffectivity: 90,
    inventory: {
      items: [
        { resourceId: 'flour', quantity: 50 },
        { resourceId: 'bread', quantity: 200 },
      ],
      capacity: 400,
      currentUsage: 250,
    },
    availableRecipeIds: ['bake_bread'],
    productionState: {
      currentRecipeId: 'bake_bread',
      isProducing: true,
      productionProgress: 0,
      ticksRemaining: 1,
    },
    workerCount: 4,
    wageExpense: 40,
  },
];

function App() {
  const [facilities, setFacilities] = useState<Facility[]>(mockFacilities);
  const isAdmin = true; // TODO: Get from auth context

  return (
    <div className="min-h-screen bg-background">
      <Header
        facilities={facilities}
        onFacilitiesUpdate={setFacilities}
        isAdmin={isAdmin}
      />
      <Facilities facilities={facilities} />
    </div>
  );
}

export default App;
