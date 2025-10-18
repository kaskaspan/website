"use client";

import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { SimpleAnalytics } from "@/components/analytics/SimpleAnalytics";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LogoutButton } from "@/components/auth/LogoutButton";

export default function AnalyticsPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Logout Button */}
        <div className="absolute top-4 right-4 z-20">
          <LogoutButton />
        </div>

        <SimpleAnalytics page="/analytics" />
        <AnalyticsDashboard />
      </div>
    </ProtectedRoute>
  );
}
