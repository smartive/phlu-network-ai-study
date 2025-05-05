'use client';

import { DataPrivacyModal } from '@/app/1-onboarding/data-privacy-modal';
import { PageHeader } from '@/components/page-header';
import { Checkbox } from '@/components/ui/checkbox';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { initSession } from '../actions';
import { SubmitButton } from '../submit-button';

export default function OnboardingPage() {
  const [consent, setConsent] = useState(false);
  return (
    <>
      <PageHeader
        title="1. Video: Einführung und Einwilligung"
        timeEstimateInMinutes={3}
        action={
          <Suspense>
            <InitSessionForm consent={consent} />
          </Suspense>
        }
      />
      <main className="flex flex-col items-center justify-center text-center gap-6 mt-8">
        <video
          controls
          preload="metadata"
          poster="/videos/network.Einfuhrungsvideo.jpg"
          className="border-4 border-yellow-500 rounded-lg"
        >
          <source src="/videos/network.Einfuhrungsvideo.mp4" type="video/mp4" />
        </video>
        <div className="flex items-center gap-2">
          <Checkbox
            id="consent"
            checked={consent}
            onCheckedChange={(checked) => setConsent(!!checked)}
          />
          <label htmlFor="consent" className="text-sm">
            Ich stimme der{' '}
            <DataPrivacyModal
              trigger={
                <button className="text-blue-600 hover:underline">
                  Verwendung meiner Daten
                </button>
              }
            />{' '}
            im Rahmen der Studie zu.
          </label>
        </div>
      </main>
    </>
  );
}

const InitSessionForm = ({ consent }: { consent: boolean }) => {
  const searchParams = useSearchParams();
  const key = searchParams.get('key');

  return (
    <form action={initSession}>
      <input type="hidden" name="key" value={key || ''} />
      <SubmitButton disabled={!consent} />
    </form>
  );
};
