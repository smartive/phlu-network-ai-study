'use client';

import { AppStep } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function NavigationGuard() {
  const pathname = usePathname();

  const isAppStepPath = Object.values(AppStep).some((step) =>
    pathname.startsWith(`/${step}`)
  );

  if (!isAppStepPath) {
    return null;
  }

  return <PreventBackNavigation />;
}

export function PreventBackNavigation() {
  const pathname = usePathname();

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault();
      window.history.pushState(null, '', pathname);
      alert('Zurücknavigation ist in dieser Anwendung nicht erlaubt.');
    };

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
      return '';
    };

    // Always prevent back navigation
    window.history.pushState(null, '', pathname);
    window.addEventListener('popstate', handlePopState);

    // Only add beforeunload listener if not on the thank-you page
    const isOnThankYouPage = pathname.startsWith(`/${AppStep.THANK_YOU}`);
    if (!isOnThankYouPage) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
      // Only remove beforeunload listener if it was added
      if (!isOnThankYouPage) {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      }
    };
  }, [pathname]);

  return null;
}
