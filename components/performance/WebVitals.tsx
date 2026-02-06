'use client';

import { useEffect } from 'react';

export function WebVitals() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      import('web-vitals').then((webVitals) => {
        webVitals.onCLS(console.log);
        webVitals.onINP(console.log);
        webVitals.onFCP(console.log);
        webVitals.onLCP(console.log);
        webVitals.onTTFB(console.log);
      });
    }
  }, []);

  return null;
}
