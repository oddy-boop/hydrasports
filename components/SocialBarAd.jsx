'use client';

import Script from 'next/script';
import { adsConfig } from '@/lib/adsConfig';

export default function SocialBarAd() {
  if (!adsConfig.enabled || !adsConfig.socialBar?.enabled || !adsConfig.socialBar?.scriptSrc) {
    return null;
  }

  return (
    <Script
      id="adsterra-social-bar"
      strategy="afterInteractive"
      src={adsConfig.socialBar.scriptSrc}
      data-cfasync="false"
    />
  );
}
