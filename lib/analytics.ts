// Analytics utilities for tracking website visitors
export interface VisitorData {
  id: string;
  timestamp: number;
  userAgent: string;
  referrer: string;
  page: string;
  ip?: string;
  country?: string;
  city?: string;
}

export interface AnalyticsData {
  totalVisitors: number;
  uniqueVisitors: number;
  pageViews: number;
  visitors: VisitorData[];
}

// Simple analytics storage (in production, use a database)
let analyticsData: AnalyticsData = {
  totalVisitors: 0,
  uniqueVisitors: 0,
  pageViews: 0,
  visitors: [],
};

// Generate unique visitor ID
export function generateVisitorId(): string {
  return (
    "visitor_" + Math.random().toString(36).substr(2, 9) + "_" + Date.now()
  );
}

// Track page view
export function trackPageView(
  page: string,
  userAgent: string,
  referrer: string = ""
) {
  const visitorId = getOrCreateVisitorId();
  const visitorData: VisitorData = {
    id: visitorId,
    timestamp: Date.now(),
    userAgent,
    referrer,
    page,
  };

  analyticsData.visitors.push(visitorData);
  analyticsData.totalVisitors++;
  analyticsData.pageViews++;

  // Store in localStorage for persistence
  if (typeof window !== "undefined") {
    localStorage.setItem("analytics_data", JSON.stringify(analyticsData));
  }

  return visitorData;
}

// Get or create visitor ID
export function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return generateVisitorId();

  let visitorId = localStorage.getItem("visitor_id");
  if (!visitorId) {
    visitorId = generateVisitorId();
    localStorage.setItem("visitor_id", visitorId);
  }
  return visitorId;
}

// Get analytics data
export function getAnalyticsData(): AnalyticsData {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("analytics_data");
    if (stored) {
      analyticsData = JSON.parse(stored);
    }
  }
  return analyticsData;
}

// Clear analytics data
export function clearAnalyticsData() {
  analyticsData = {
    totalVisitors: 0,
    uniqueVisitors: 0,
    pageViews: 0,
    visitors: [],
  };

  if (typeof window !== "undefined") {
    localStorage.removeItem("analytics_data");
    localStorage.removeItem("visitor_id");
  }
}

// Get unique visitors count
export function getUniqueVisitorsCount(): number {
  const data = getAnalyticsData();
  const uniqueIds = new Set(data.visitors.map((v) => v.id));
  return uniqueIds.size;
}

// Get visitors by date range
export function getVisitorsByDateRange(
  startDate: number,
  endDate: number
): VisitorData[] {
  const data = getAnalyticsData();
  return data.visitors.filter(
    (visitor) => visitor.timestamp >= startDate && visitor.timestamp <= endDate
  );
}

// Get most visited pages
export function getMostVisitedPages(): { page: string; count: number }[] {
  const data = getAnalyticsData();
  const pageCounts: { [key: string]: number } = {};

  data.visitors.forEach((visitor) => {
    pageCounts[visitor.page] = (pageCounts[visitor.page] || 0) + 1;
  });

  return Object.entries(pageCounts)
    .map(([page, count]) => ({ page, count }))
    .sort((a, b) => b.count - a.count);
}
