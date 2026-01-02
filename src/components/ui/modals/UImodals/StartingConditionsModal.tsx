// Starting Conditions Modal
// Simplified: Sets initial company balance using starting conditions service

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../shadCN/dialog';
import { Button } from '../../shadCN/button';
import { applyStartingConditions } from '@/lib/services/core/startingConditionsService';
import { GAME_INITIALIZATION } from '@/lib/constants/constants';
import { formatNumber } from '@/lib/utils';

interface StartingConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyName: string;
  onComplete: (startingMoney?: number) => void;
}

export const StartingConditionsModal: React.FC<StartingConditionsModalProps> = ({
  isOpen,
  onClose,
  companyName,
  onComplete
}) => {
  const [isApplying, setIsApplying] = useState(false);

  const modalTitle = companyName
    ? `Initialize ${companyName}`
    : 'Initialize Company';

  const modalDescription = 'Set up your company with starting capital.';

  const handleClose = () => {
    onClose();
  };

  const handleConfirm = async () => {
    setIsApplying(true);
    try {
      const result = await applyStartingConditions(companyName);
      
      if (result.success) {
        onComplete(result.startingMoney);
      } else {
        alert(result.error || 'Failed to apply starting conditions. Please try again.');
      }
    } catch (error) {
      console.error('Error applying starting conditions:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{modalTitle}</DialogTitle>
          <DialogDescription>{modalDescription}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Starting Capital</h3>
            <p className="text-sm text-gray-700">
              Your company will start with <strong>{formatNumber(GAME_INITIALIZATION.STARTING_MONEY, { currency: true })}</strong> in initial capital.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isApplying}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isApplying}
            className="bg-wine hover:bg-wine-dark text-white"
          >
            {isApplying ? 'Initializing...' : 'Start Company'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
