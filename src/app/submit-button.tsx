'use client';

import { Button } from '@/components/ui/button';
import { useFormStatus } from 'react-dom';

export function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending || disabled}>
      {pending ? 'Wird gestartet...' : 'Mit der Studie beginnen'}
    </Button>
  );
}
