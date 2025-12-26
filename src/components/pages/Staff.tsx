// Staff Management Page - Placeholder for tradergame
import React from 'react';

interface StaffPageProps {
  title: string;
}

/**
 * Staff Management Page - Placeholder
 * Will be rebuilt for tradergame with new functionality
 */
export const StaffPage: React.FC<StaffPageProps> = ({ title }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">{title}</h2>
          <p className="text-muted-foreground mt-1">
            Staff management - Coming soon for tradergame
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
