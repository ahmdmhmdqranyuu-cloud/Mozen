import SwiftUI

public struct FloatingAudioBarView: View {
    @ObservedObject var player = AudioPlayerManager.shared
    @State private var showFullSheet = false

    public init() {}

    public var body: some View {
        if !player.currentTitle.isEmpty {
            VStack(spacing: 0) {
                HStack(spacing: 12) {
                    Circle()
                        .fill(Color(red: 217/255, green: 119/255, blue: 6/255))
                        .frame(width: 38, height: 38)
                        .overlay(
                            Image(systemName: "music.note")
                                .foregroundColor(.white)
                                .font(.system(size: 16, weight: .bold))
                        )

                    VStack(alignment: .trailing, spacing: 2) {
                        Text(player.currentTitle)
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))
                            .lineLimit(1)
                        Text(player.currentSubtitle)
                            .font(.system(size: 11))
                            .foregroundColor(Color(red: 156/255, green: 163/255, blue: 175/255))
                            .lineLimit(1)
                    }

                    Spacer()

                    Button(action: {
                        player.togglePlayPause()
                    }) {
                        Image(systemName: player.isPlaying ? "pause.fill" : "play.fill")
                            .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                            .font(.system(size: 20))
                    }

                    Button(action: {
                        player.stop()
                    }) {
                        Image(systemName: "xmark")
                            .foregroundColor(Color(red: 156/255, green: 163/255, blue: 175/255))
                            .font(.system(size: 14))
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(Color(red: 29/255, green: 77/255, blue: 62/255))
                .cornerRadius(16)
                .onTapGesture {
                    showFullSheet = true
                }

                // Progress Bar
                ProgressView(value: player.progress)
                    .accentColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                    .padding(.horizontal, 8)
            }
            .padding(.horizontal, 12)
            .padding(.bottom, 4)
            .sheet(isPresented: $showFullSheet) {
                FullPlayerSheet(player: player)
            }
        }
    }
}

struct FullPlayerSheet: View {
    @ObservedObject var player: AudioPlayerManager
    @Environment(\.presentationMode) var presentationMode

    var body: some View {
        ZStack {
            Color(red: 9/255, green: 36/255, blue: 28/255).edgesIgnoringSafeArea(.all)

            VStack(spacing: 24) {
                HStack {
                    Spacer()
                    Button(action: { presentationMode.wrappedValue.dismiss() }) {
                        Image(systemName: "chevron.down")
                            .foregroundColor(.white)
                            .font(.system(size: 20))
                    }
                }
                .padding()

                Spacer()

                Circle()
                    .fill(Color(red: 19/255, green: 56/255, blue: 45/255))
                    .frame(width: 140, height: 140)
                    .overlay(
                        Image(systemName: "book.fill")
                            .foregroundColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                            .font(.system(size: 60))
                    )

                Text(player.currentTitle)
                    .font(.system(size: 22, weight: .bold))
                    .foregroundColor(Color(red: 236/255, green: 253/255, blue: 245/255))

                Text(player.currentSubtitle)
                    .font(.system(size: 15))
                    .foregroundColor(Color(red: 156/255, green: 163/255, blue: 175/255))

                Slider(value: Binding(
                    get: { player.progress },
                    set: { player.seek(to: $0) }
                ))
                .accentColor(Color(red: 245/255, green: 158/255, blue: 11/255))
                .padding(.horizontal, 24)

                HStack(spacing: 36) {
                    Button(action: { player.togglePlayPause() }) {
                        Circle()
                            .fill(Color(red: 245/255, green: 158/255, blue: 11/255))
                            .frame(width: 64, height: 64)
                            .overlay(
                                Image(systemName: player.isPlaying ? "pause.fill" : "play.fill")
                                    .foregroundColor(Color(red: 9/255, green: 36/255, blue: 28/255))
                                    .font(.system(size: 28))
                            )
                    }
                }

                Spacer()
            }
        }
    }
}
