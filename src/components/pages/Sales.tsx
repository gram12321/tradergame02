import React from 'react';
import { NavigationProps } from '../../lib/types/UItypes';

interface SalesProps extends NavigationProps {
  // Inherits onNavigateToWinepedia from NavigationProps
}

const Sales: React.FC<SalesProps> = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Sales</h2>
          <p className="text-muted-foreground mt-1">
            Sales management - Coming soon for tradergame
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
};

export default Sales;