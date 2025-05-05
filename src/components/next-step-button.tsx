'use client';

import { updateStep } from '@/app/actions';
import { AppStep } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

interface NextStepButtonProps {
  href: string;
  label?: string;
  disabled?: boolean;
  forceUserConfirmation?: boolean;
}

export function NextStepButton({
  href,
  label = 'Weiter',
  disabled = false,
  forceUserConfirmation = false,
}: NextStepButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const router = useRouter();

  // Extract the step from href
  const nextStep = href.substring(1) as AppStep;

  const handleClick = () => {
    if (forceUserConfirmation) {
      setShowConfirmDialog(true);
    } else {
      proceedToNextStep();
    }
  };

  const proceedToNextStep = () => {
    startTransition(async () => {
      try {
        await updateStep(nextStep);
        router.push(href);
      } catch (error) {
        console.error('Failed to update step:', error);
      }
    });
  };

  const content = (
    <div className="flex items-center gap-2">
      {label}
      <ArrowRight className="w-4 h-4" />
    </div>
  );

  return (
    <>
      <Button onClick={handleClick} disabled={disabled || isPending}>
        {content}
      </Button>

      {forceUserConfirmation && (
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sind Sie sicher?</DialogTitle>
              <DialogDescription>
                Wenn Sie fortfahren, können Sie nicht mehr zu diesem Schritt
                zurückkehren.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
              >
                Abbrechen
              </Button>
              <Button
                onClick={() => {
                  setShowConfirmDialog(false);
                  proceedToNextStep();
                }}
              >
                Fortfahren
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
