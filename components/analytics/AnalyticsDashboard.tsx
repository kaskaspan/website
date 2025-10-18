"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getAnalyticsData,
  getUniqueVisitorsCount,
  getMostVisitedPages,
  clearAnalyticsData,
  type AnalyticsData,
} from "@/lib/analytics";

export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [uniqueVisitors, setUniqueVisitors] = useState(0);
  const [mostVisitedPages, setMostVisitedPages] = useState<
    { page: string; count: number }[]
  >([]);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = () => {
    const data = getAnalyticsData();
    const unique = getUniqueVisitorsCount();
    const pages = getMostVisitedPages();

    setAnalytics(data);
    setUniqueVisitors(unique);
    setMostVisitedPages(pages);
  };

  const handleClearData = () => {
    if (confirm("Are you sure you want to clear all analytics data?")) {
      clearAnalyticsData();
      loadAnalyticsData();
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getRecentVisitors = () => {
    if (!analytics) return [];
    return analytics.visitors
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);
  };

  if (!analytics) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Website Analytics</h1>
        <Button
          onClick={handleClearData}
          variant="outline"
          className="text-red-600 hover:text-red-700"
        >
          Clear Data
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {analytics.totalVisitors}
            </div>
            <div className="text-sm text-gray-600">Total Visits</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {uniqueVisitors}
            </div>
            <div className="text-sm text-gray-600">Unique Visitors</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {analytics.pageViews}
            </div>
            <div className="text-sm text-gray-600">Page Views</div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Visited Pages */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Most Visited Pages</h3>
          <div className="space-y-2">
            {mostVisitedPages.length > 0 ? (
              mostVisitedPages.map((page, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center py-2 border-b border-gray-100"
                >
                  <span className="text-sm font-medium">{page.page}</span>
                  <span className="text-sm text-gray-600">
                    {page.count} visits
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No page data available</p>
            )}
          </div>
        </Card>

        {/* Recent Visitors */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Visitors</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {getRecentVisitors().length > 0 ? (
              getRecentVisitors().map((visitor, index) => (
                <div key={index} className="py-2 border-b border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-medium">{visitor.page}</div>
                      <div className="text-xs text-gray-500">
                        {formatDate(visitor.timestamp)}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {visitor.userAgent.split(" ")[0]}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No visitor data available</p>
            )}
          </div>
        </Card>
      </div>

      {/* All Visitors Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">All Visitors</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2">Time</th>
                <th className="text-left py-2">Page</th>
                <th className="text-left py-2">User Agent</th>
                <th className="text-left py-2">Referrer</th>
              </tr>
            </thead>
            <tbody>
              {analytics.visitors
                .sort((a, b) => b.timestamp - a.timestamp)
                .map((visitor, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-2 text-gray-600">
                      {formatDate(visitor.timestamp)}
                    </td>
                    <td className="py-2 font-medium">{visitor.page}</td>
                    <td className="py-2 text-gray-500 truncate max-w-xs">
                      {visitor.userAgent}
                    </td>
                    <td className="py-2 text-gray-500 truncate max-w-xs">
                      {visitor.referrer || "Direct"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
