# Taiwan Earthquake Map

Real-time seismic activity visualization for Taiwan and surrounding regions.

## Features

- **USGS Data Integration**: Live earthquake feed from earthquake.usgs.gov
- **Interactive Map**: Leaflet map with magnitude-scaled circle markers, color-coded by intensity
- **Sortable List**: Click column headers to sort by time, magnitude, or location with NEW badges for unread events
- **Magnitude Filter**: Slider to filter earthquakes from M2.0 to M7.0+
- **Time Range**: Quick filters for 1 day, 7 days, 30 days, or 90 days
- **Push Notifications**: Browser push notifications for new earthquakes above threshold
- **Email Subscription**: Subscribe to earthquake alerts via email
- **Social Sharing**: Facebook share per earthquake event
- **Bilingual**: Full English and Chinese (Traditional) support

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (all inline, no build step)
- **Map**: Leaflet 1.9.4 with OpenStreetMap tiles
- **PWA**: Progressive Web App with service worker caching
- **Push Notifications**: Web Push API with service worker
- **Data Source**: USGS Earthquake API (earthquake.usgs.gov/fdsnws/event/1/query)

## Quick Start

```bash
# Serve locally
python3 -m http.server 8006

# Open browser
open http://localhost:8006
```

## File Structure

```
earthquake/
├── index.html              # Main app (inline CSS/JS)
├── manifest.webapp         # PWA manifest
├── sw.js                   # Service worker
├── favicon.ico
├── img/                    # App icons (32-512px)
├── js/
│   └── push-service.js     # Push notification client
├── android/                # Android WebView wrapper
│   ├── app/
│   ├── build.gradle
│   ├── gradlew
│   └── sync-web.sh         # Sync web assets to Android
├── ios/                    # iOS WKWebView wrapper
│   ├── Earthquake/
│   └── sync-web.sh         # Sync web assets to iOS
├── tests/                  # Playwright tests
├── package.json            # Test scripts
└── playwright.config.js    # Test configuration
```

## Native Builds

### Android
- **Package**: tw.pwa.earthquake
- **Build**: `cd android && ./gradlew assembleRelease`
- **Sync**: `./android/sync-web.sh` (copies web assets to app)

### iOS
- **Bundle ID**: tw.pwa.earthquake
- **Build**: Open `ios/Earthquake/Earthquake.xcodeproj` in Xcode
- **Sync**: `./ios/sync-web.sh` (copies web assets to app)

## Testing

```bash
# Install dependencies
npm install

# Run tests (headless)
npm test

# Run tests (headed)
npm run test:headed
```

## API

**USGS Earthquake API**
- Endpoint: `https://earthquake.usgs.gov/fdsnws/event/1/query`
- Format: GeoJSON
- Parameters: `format=geojson&starttime=YYYY-MM-DD&endtime=YYYY-MM-DD&minmagnitude=2`
- Rate Limit: No API key required, reasonable use policy
- Documentation: https://earthquake.usgs.gov/fdsnws/event/1/

## PWA Features

- Installable on mobile and desktop
- Offline support for previously viewed data
- Push notifications for new earthquakes
- Theme color: #D32F2F (red)
- Standalone display mode

## Browser Support

- Chrome/Edge 90+
- Safari 14+
- Firefox 88+
- Requires geolocation and notification permissions for full features
