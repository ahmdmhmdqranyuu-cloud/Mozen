import Foundation
import AVFoundation
import MediaPlayer

public class AudioPlayerManager: NSObject, ObservableObject {
    public static let shared = AudioPlayerManager()

    @Published public var isPlaying: Bool = false
    @Published public var currentTitle: String = ""
    @Published public var currentSubtitle: String = ""
    @Published public var progress: Double = 0.0
    @Published public var currentTime: Double = 0.0
    @Published public var duration: Double = 0.0

    private var player: AVPlayer?
    private var timeObserverToken: Any?

    private override init() {
        super.init()
        setupAudioSession()
    }

    private func setupAudioSession() {
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [.duckOthers])
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            print("Failed to configure audio session: \(error)")
        }
    }

    public func playAudio(url: URL, title: String, subtitle: String) {
        stop()

        currentTitle = title
        currentSubtitle = subtitle

        let playerItem = AVPlayerItem(url: url)
        player = AVPlayer(playerItem: playerItem)

        addPeriodicTimeObserver()

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(playerDidFinishPlaying),
            name: .AVPlayerItemDidPlayToEndTime,
            object: playerItem
        )

        player?.play()
        isPlaying = true
    }

    public func togglePlayPause() {
        guard let player = player else { return }
        if isPlaying {
            player.pause()
            isPlaying = false
        } else {
            player.play()
            isPlaying = true
        }
    }

    public func seek(to progress: Double) {
        guard let player = player, let currentItem = player.currentItem else { return }
        let durationSeconds = CMTimeGetSeconds(currentItem.duration)
        if durationSeconds.isFinite && durationSeconds > 0 {
            let targetTime = CMTime(seconds: progress * durationSeconds, preferredTimescale: 600)
            player.seek(to: targetTime)
        }
    }

    public func stop() {
        if let token = timeObserverToken {
            player?.removeTimeObserver(token)
            timeObserverToken = nil
        }
        player?.pause()
        player = nil
        isPlaying = false
        currentTitle = ""
        currentSubtitle = ""
        progress = 0.0
        currentTime = 0.0
        duration = 0.0
    }

    @objc private func playerDidFinishPlaying() {
        DispatchQueue.main.async {
            self.isPlaying = false
            self.progress = 1.0
        }
    }

    private func addPeriodicTimeObserver() {
        let interval = CMTime(seconds: 0.5, preferredTimescale: 600)
        timeObserverToken = player?.addPeriodicTimeObserver(forInterval: interval, queue: .main) { [weak self] time in
            guard let self = self, let currentItem = self.player?.currentItem else { return }
            let currentSeconds = CMTimeGetSeconds(time)
            let durationSeconds = CMTimeGetSeconds(currentItem.duration)

            if durationSeconds.isFinite && durationSeconds > 0 {
                self.currentTime = currentSeconds
                self.duration = durationSeconds
                self.progress = currentSeconds / durationSeconds
            }
        }
    }
}
