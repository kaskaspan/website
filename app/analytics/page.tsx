"use client";

import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { SimpleAnalytics } from "@/components/analytics/SimpleAnalytics";

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SimpleAnalytics page="/analytics" />
      <AnalyticsDashboard />
    </div>
  );
}
