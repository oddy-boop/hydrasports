'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function WatchBackButton() {
  const router = useRouter();

  const goBack = () => {
    // Check if the browser's previous page was from our own site.
    // If the referrer is from the same origin, router.back() is safe.
    // If not (e.g. ad page hijacked history), go to the homepage.
    try {
      const referrer = document.referrer;
      const isSameOrigin =
        referrer &&
        new URL(referrer).origin === window.location.origin;

      if (isSameOrigin && window.history.length > 1) {
        router.back();
      } else {
        router.push('/');
      }
    } catch {
      // Fallback: if URL parsing fails, always go home
      router.push('/');
    }
  };

  return (
    <button type="button" onClick={goBack} className="watch-back inline-flex items-center gap-2" aria-label="Go back">
      <ArrowLeft className="h-4 w-4" />
      <span>Back</span>
    </button>
  );
}
