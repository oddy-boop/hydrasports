'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function WatchBackButton() {
  const router = useRouter();

  const goBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
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
