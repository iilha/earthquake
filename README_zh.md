[English](README.md) | 繁體中文

# 台灣地震地圖

即時台灣及周邊地區地震活動視覺化。

## 功能特色

- **USGS 資料整合**：來自 earthquake.usgs.gov 的即時地震資料
- **互動式地圖**：使用 Leaflet 地圖，以震級比例的圓形標記，依強度以顏色區分
- **可排序列表**：點擊欄位標題以時間、震級或地點排序，並顯示未讀事件的 NEW 標記
- **震級篩選**：滑桿可篩選 M2.0 至 M7.0+ 的地震
- **時間範圍**：快速篩選 1 天、7 天、30 天或 90 天
- **推播通知**：超過閾值的新地震會發送瀏覽器推播通知
- **電子郵件訂閱**：透過電子郵件訂閱地震警報
- **社群分享**：每個地震事件可分享至 Facebook
- **雙語支援**：完整英文與繁體中文支援

## 技術架構

- **Frontend**: HTML5, CSS3, JavaScript（全部 inline，無需建置步驟）
- **Map**: Leaflet 1.9.4 搭配 OpenStreetMap tiles
- **PWA**: Progressive Web App 使用 service worker 快取
- **Push Notifications**: Web Push API 搭配 service worker
- **Data Source**: USGS Earthquake API (earthquake.usgs.gov/fdsnws/event/1/query)

## 快速開始

```bash
# 本地伺服器
python3 -m http.server 8006

# 開啟瀏覽器
open http://localhost:8006
```

## 檔案結構

```
earthquake/
├── index.html              # 主要應用程式（inline CSS/JS）
├── manifest.webapp         # PWA manifest
├── sw.js                   # Service worker
├── favicon.ico
├── img/                    # 應用程式圖示（32-512px）
├── js/
│   └── push-service.js     # 推播通知客戶端
├── android/                # Android WebView 封裝
│   ├── app/
│   ├── build.gradle
│   ├── gradlew
│   └── sync-web.sh         # 同步 web 資產至 Android
├── ios/                    # iOS WKWebView 封裝
│   ├── Earthquake/
│   └── sync-web.sh         # 同步 web 資產至 iOS
├── tests/                  # Playwright 測試
├── package.json            # 測試腳本
└── playwright.config.js    # 測試設定
```

## 原生應用程式建置

### Android
- **Package**: tw.pwa.earthquake
- **Build**: `cd android && ./gradlew assembleRelease`
- **Sync**: `./android/sync-web.sh`（複製 web 資產至應用程式）

### iOS
- **Bundle ID**: tw.pwa.earthquake
- **Build**: 在 Xcode 中開啟 `ios/Earthquake/Earthquake.xcodeproj`
- **Sync**: `./ios/sync-web.sh`（複製 web 資產至應用程式）

## 測試

```bash
# 安裝相依套件
npm install

# 執行測試（headless）
npm test

# 執行測試（headed）
npm run test:headed
```

## API

**USGS Earthquake API**
- Endpoint: `https://earthquake.usgs.gov/fdsnws/event/1/query`
- Format: GeoJSON
- Parameters: `format=geojson&starttime=YYYY-MM-DD&endtime=YYYY-MM-DD&minmagnitude=2`
- Rate Limit: 無需 API key，合理使用政策
- Documentation: https://earthquake.usgs.gov/fdsnws/event/1/

## PWA 功能

- 可安裝於行動裝置與桌面
- 離線支援先前檢視的資料
- 新地震推播通知
- Theme color: #D32F2F（紅色）
- Standalone 顯示模式

## 瀏覽器支援

- Chrome/Edge 90+
- Safari 14+
- Firefox 88+
- 完整功能需要地理位置與通知權限
