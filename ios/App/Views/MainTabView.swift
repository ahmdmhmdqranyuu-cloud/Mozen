import SwiftUI

public struct MainTabView: View {
    @State private var selectedTab: Int = 0

    public init() {}

    public var body: some View {
        ZStack(alignment: .bottom) {
            TabView(selection: $selectedTab) {
                HomeView()
                    .tabItem {
                        Image(systemName: "house.fill")
                        Text("الرئيسية")
                    }
                    .tag(0)

                PrayerTimesView()
                    .tabItem {
                        Image(systemName: "clock.fill")
                        Text("المواقيت")
                    }
                    .tag(1)

                QuranView()
                    .tabItem {
                        Image(systemName: "book.fill")
                        Text("المصحف")
                    }
                    .tag(2)

                AzkarView()
                    .tabItem {
                        Image(systemName: "heart.text.square.fill")
                        Text("الأذكار")
                    }
                    .tag(3)

                SettingsView()
                    .tabItem {
                        Image(systemName: "gearshape.fill")
                        Text("الإعدادات")
                    }
                    .tag(4)
            }
            .accentColor(Color(red: 245/255, green: 158/255, blue: 11/255))

            // Floating Mini Audio Player
            FloatingAudioBarView()
                .padding(.bottom, 50)
        }
    }
}
