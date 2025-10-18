// Configuration for analytics and other features

export const config = {
  // Google Analytics Configuration
  // Replace with your actual Google Analytics Measurement ID
  googleAnalytics: {
    measurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-XXXXXXXXXX",
    enabled:
      process.env.NODE_ENV === "production" ||
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID !== "G-XXXXXXXXXX",
  },

  // Analytics settings
  analytics: {
    enableSimpleAnalytics: true,
    enableGoogleAnalytics: true,
    enablePrivacyMode: true, // Respect user privacy preferences
  },
};
