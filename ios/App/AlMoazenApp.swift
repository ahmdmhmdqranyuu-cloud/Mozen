import SwiftUI

@main
struct AlMoazenApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

    var body: some Scene {
        WindowGroup {
            MainTabView()
                .environment(\.layoutDirection, .rightToLeft)
        }
    }
}
