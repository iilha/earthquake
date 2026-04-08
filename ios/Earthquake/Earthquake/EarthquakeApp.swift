import SwiftUI

@main
struct EarthquakeApp: App {
    var body: some Scene {
        WindowGroup {
            WebViewScreen()
                .ignoresSafeArea()
        }
    }
}
