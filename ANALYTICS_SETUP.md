# Website Analytics Setup Guide

This guide will help you set up analytics tracking for your website to monitor visitors.

## 🎯 What You'll Get

- **Visitor Tracking**: See who visits your website
- **Page Views**: Track which pages are most popular
- **Real-time Analytics**: Monitor visitors as they browse
- **Privacy-Compliant**: Respects user privacy preferences

## 🚀 Quick Setup

### 1. Google Analytics Setup (Recommended)

1. **Create a Google Analytics Account**:

   - Go to [Google Analytics](https://analytics.google.com/)
   - Sign in with your Google account
   - Create a new property for your website
   - Get your Measurement ID (starts with "G-")

2. **Configure Your Website**:

   - Create a `.env.local` file in your project root
   - Add your Google Analytics Measurement ID:

   ```bash
   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

   Replace `G-XXXXXXXXXX` with your actual Measurement ID.

3. **Deploy and Test**:
   - Your analytics will automatically start tracking visitors
   - Check your Google Analytics dashboard for data

### 2. Simple Analytics (Built-in)

The website includes a simple analytics system that works without external services:

- **Automatic Tracking**: Tracks all page views and visitors
- **Local Storage**: Data is stored in the visitor's browser
- **Privacy-Friendly**: No external data collection
- **Dashboard**: Visit `/analytics` to see your visitor data

## 📊 Viewing Your Analytics

### Google Analytics Dashboard

- Visit [Google Analytics](https://analytics.google.com/)
- Select your property
- View real-time and historical data

### Built-in Analytics Dashboard

- Visit `https://yourwebsite.com/analytics`
- See visitor statistics
- View most visited pages
- Check recent visitors

## 🔧 Configuration Options

### Environment Variables

Create a `.env.local` file with these options:

```bash
# Google Analytics (optional)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Analytics settings
NEXT_PUBLIC_ANALYTICS_ENABLED=true
```

### Customization

You can modify the analytics behavior in `/lib/config.ts`:

```typescript
export const config = {
  googleAnalytics: {
    measurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-XXXXXXXXXX",
    enabled: process.env.NODE_ENV === "production",
  },
  analytics: {
    enableSimpleAnalytics: true,
    enableGoogleAnalytics: true,
    enablePrivacyMode: true,
  },
};
```

## 📈 What Data is Tracked

### Google Analytics Tracks:

- Page views and sessions
- User demographics and interests
- Traffic sources and referrals
- Device and browser information
- Geographic location

### Simple Analytics Tracks:

- Page visits and timestamps
- User agent information
- Referrer information
- Unique visitor identification

## 🔒 Privacy Considerations

- **GDPR Compliant**: Both tracking systems respect user privacy
- **No Personal Data**: No personally identifiable information is collected
- **User Control**: Users can disable tracking in their browser
- **Transparent**: All tracking is clearly documented

## 🛠️ Troubleshooting

### Google Analytics Not Working

1. Check your Measurement ID is correct
2. Ensure the `.env.local` file is in the project root
3. Verify the environment variable is loaded: `NEXT_PUBLIC_GA_MEASUREMENT_ID`
4. Check browser console for errors

### Simple Analytics Not Working

1. Check browser console for JavaScript errors
2. Ensure localStorage is enabled
3. Try clearing browser cache and cookies

### No Data Appearing

1. Wait 24-48 hours for Google Analytics data
2. Check if you're in the correct Google Analytics property
3. Verify your website is receiving traffic
4. Check the built-in analytics dashboard at `/analytics`

## 📞 Support

If you need help setting up analytics:

1. Check this guide first
2. Review the configuration files
3. Test with the built-in analytics dashboard
4. Check browser developer tools for errors

## 🎉 You're All Set!

Once configured, you'll be able to:

- See who visits your website
- Track popular pages
- Monitor visitor behavior
- Make data-driven decisions about your website

Visit `/analytics` on your website to see your visitor data in action!
