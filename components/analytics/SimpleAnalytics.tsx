"use client";

import { useEffect } from "react";
import { trackPageView } from "@/lib/analytics";

interface SimpleAnalyticsProps {
  page: string;
}

export function SimpleAnalytics({ page }: SimpleAnalyticsProps) {
  useEffect(() => {
    // Track page view
    const userAgent = navigator.userAgent;
    const referrer = document.referrer;

    trackPageView(page, userAgent, referrer);
  }, [page]);

  return null; // This component doesn't render anything
}
