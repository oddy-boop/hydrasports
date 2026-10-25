'use client';

import Script from 'next/script';
import { adsConfig } from '@/lib/adsConfig';

export default function MonetagAd() {
  if (!adsConfig.enabled || !adsConfig.monetag?.enabled || !adsConfig.monetag?.scriptSrc) {
    return null;
  }

  return (
    <Script
      id="monetag-multitag"
      strategy="afterInteractive"
      src={adsConfig.monetag.scriptSrc}
      data-zone={adsConfig.monetag.zone}
      data-cfasync="false"
    />
  );
}
