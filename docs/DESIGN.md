# Taiwan Earthquake Map Design Document

## Architecture Overview

Taiwan Earthquake Map is a Progressive Web App (PWA) that displays real-time seismic activity data for the Taiwan region. Built with vanilla JavaScript, HTML5, and Leaflet maps, the app fetches earthquake data from the USGS FDSNWS API and visualizes events on an interactive map with filtering, sorting, and notification capabilities.

The app provides dual views (Map/List), magnitude/time filtering, social sharing, and optional push notification subscription for earthquake alerts. It can be served via HTTP (GitHub Pages), loaded in native WebView wrappers, or installed as a PWA with offline access to cached data.

## Data Flow

### Data Sources
- **USGS FDSNWS API**: `https://earthquake.usgs.gov/fdsnws/event/1/query`
  - Query parameters: `format=geojson`, `minlatitude=21`, `maxlatitude=26`, `minlongitude=119`, `maxlongitude=123` (Taiwan bounding box)
  - Additional filters: `minmagnitude`, `starttime`, `endtime`
  - Returns GeoJSON FeatureCollection with earthquake events
  - No authentication required, CORS-enabled

### Fetch-Render Cycle
1. Page load: Fetch earthquakes from USGS API with default filters (magnitude ≥2.0, last 30 days)
2. Parse GeoJSON, extract relevant fields (magnitude, time, location, depth, coordinates)
3. Render on map: magnitude-scaled circle markers with color coding
4. Render in list: sortable by time/magnitude, with "NEW" badges for unread events
5. Auto-refresh: Fetch new data every 10 minutes via `setInterval()`
6. User-initiated refresh: Pull-to-refresh gesture on mobile

### Notification Logic
- User subscribes via modal: enters email, selects magnitude threshold (≥3.0, ≥4.0, ≥5.0)
- Cloudflare Worker (`earthquake-notify.js`) polls USGS API every 5 minutes
- On new earthquake matching threshold: send email via SendGrid API + browser push notification
- Push subscription stored in IndexedDB with service worker registration

## UI Components

### Navigation Header
- Language toggle button (EN/中文)
- Active state highlighting

### Filter Controls (Sidebar)
- **Magnitude Slider**: Range input 2.0 - 7.0 with live value display
- **Time Range Buttons**: 1 day / 7 days / 30 days / 90 days
- **Unread Toggle**: Checkbox to show only new earthquakes (since last visit)
- **Refresh Button**: Manual refresh with loading spinner animation

### Map View
- Leaflet 1.9.4 map centered on Taiwan (24.0°N, 121.0°E)
- Circle markers sized by magnitude: radius = magnitude × 3 pixels
- Color coding: Red (≥5.0), Orange (4.0-4.9), Yellow (3.0-3.9), Green (<3.0)
- Popup shows: magnitude, time (relative: "2 hours ago"), location, depth, Facebook share link
- Earthquake density heatmap overlay (optional toggle)

### List View (Sidebar)
- Scrollable event list sorted by time (newest first)
- Each row shows: magnitude badge, location, time (relative), "NEW" badge (if unread)
- Click to center map and open popup
- Sort toggle: Time (desc/asc) or Magnitude (desc/asc)
- Facebook share button per event

### Notification Modal
- Triggered by bell icon in header
- Email input field (validated)
- Magnitude threshold selector (≥3.0, ≥4.0, ≥5.0)
- Browser push permission request
- Subscribe/Unsubscribe toggle

### Mobile Layout (≤768px)
- Bottom sheet with drag handle
- Snap points: collapsed (56px), half (50vh), full (90vh)
- Summary line: "🌋 {count} earthquakes (M≥{threshold})"

## Caching Strategy

### Service Worker (`sw.js`)
| Resource Type | Strategy | TTL |
|---------------|----------|-----|
| Static assets (HTML, CSS, JS) | Cache-first | 24 hours |
| Map tiles (OSM) | Cache-first | 7 days |
| USGS API earthquake data | Stale-while-revalidate | 10 minutes |

### Stale-While-Revalidate Logic
1. Check cache first, return cached response immediately if available
2. Fetch fresh data in background, update cache for next request
3. If cache miss, wait for network response
4. On network failure, serve stale cache (up to 1 hour old)
5. Show "Offline" indicator when serving stale data

### Unread Detection
- `localStorage.setItem('earthquake-last-seen', Date.now())` on page load
- Compare earthquake timestamp to last-seen timestamp
- Mark events newer than last-seen with "NEW" badge
- Badge count shown in header: "(3 new)"

## Localization

### Language Toggle
- Default: `navigator.language` (zh-TW/zh-CN → Chinese, else English)
- Persistence: `localStorage.setItem('earthquake-lang', lang)`
- Text elements: `data-en` and `data-zh` attributes
- Location names: USGS provides English, manually translated for common Taiwan regions

### Time Localization
- Relative time: "2 hours ago" (English) / "2 小時前" (Chinese)
- Absolute time: ISO 8601 format, localized via `toLocaleString()`

## Native Wrappers

### Android WebView
- Loads `file:///android_asset/index.html` from APK assets
- WebView settings: JavaScript enabled, geolocation permission, DOM storage
- Background service polls USGS API for notifications (WorkManager)
- JavaScript bridge: `Android.shareEarthquake(eventId)` for native share sheet

### iOS WKWebView
- Loads local HTML via `WKWebView.loadFileURL()` from app bundle
- Configuration: `allowsInlineMediaPlayback`, push notification entitlements
- Swift bridge: `window.webkit.messageHandlers.shareEarthquake.postMessage(eventId)`
- Background fetch for earthquake alerts (BGTaskScheduler)

### Asset Sync
- CI/CD: GitHub Actions copies web build to native repos on merge
- Git submodule: `ios/Earthquake/Resources/` and `android/app/src/main/assets/`
- Build script validates GeoJSON parsing logic

## State Management

### localStorage Keys
| Key | Purpose | Values |
|-----|---------|--------|
| `earthquake-lang` | Language preference | `'en'` \| `'zh'` |
| `earthquake-last-seen` | Last viewed timestamp | Unix timestamp (ms) |
| `earthquake-magnitude` | Magnitude filter | Number (2.0-7.0) |
| `earthquake-time-range` | Time range filter | `'1d'` \| `'7d'` \| `'30d'` \| `'90d'` |
| `earthquake-notify-settings` | Notification prefs | JSON: `{email, threshold, enabled}` |

### In-Memory State
- `earthquakes`: Array of earthquake objects from USGS API
- `filteredEarthquakes`: Subset after magnitude/time filters applied
- `markers`: Leaflet marker objects keyed by event ID
- `refreshTimer`: `setInterval()` ID for 10-minute auto-refresh
- `sortOrder`: Current sort direction (time desc/asc, magnitude desc/asc)

### IndexedDB (Service Worker)
- `push-subscriptions`: Browser push subscription objects
- `notification-queue`: Pending notifications (offline queue)

### State Persistence
- Magnitude, time range, notification settings: persisted to localStorage
- Last-seen timestamp: updated on page load and visibility change
- Earthquake data: cached by service worker (10-minute TTL)
- Push subscription: persisted in IndexedDB, synced with server

## Future Plan

### Short-term
- Add intensity map overlay (PGA/MMI contours)
- Implement custom alert zones (notify only for nearby quakes)
- Add historical earthquake statistics dashboard
- Improve notification delivery reliability

### Medium-term
- Tsunami warning integration
- Shelter/evacuation route finder
- Seismicity trend analysis (monthly/yearly)
- Integration with CWA (Taiwan Central Weather Administration) data

### Long-term
- Early warning system integration (P-wave detection)
- Community reporting (felt reports)
- Building safety assessment links
- Emergency supply checklist

## TODO

- [ ] Add CWA earthquake data source (Taiwan-specific)
- [ ] Implement custom geofence alerts
- [ ] Add earthquake intensity scale explanation
- [ ] Show fault line overlay on map
- [ ] Add emergency contact numbers
- [ ] Implement historical statistics charts
- [ ] Add dark mode
