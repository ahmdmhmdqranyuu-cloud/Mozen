import Foundation
import UIKit
import Photos

public class MediaStorageManager: NSObject, URLSessionDownloadDelegate {
    public static let shared = MediaStorageManager()

    private var activeDownloads = Set<String>()
    private var downloadContinuations = [String: (Result<URL, Error>) -> Void]()
    private var resumeDataMap = [String: Data]()

    private lazy var urlSession: URLSession = {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 20.0
        config.timeoutIntervalForResource = 300.0
        return URLSession(configuration: config, delegate: self, delegateQueue: OperationQueue.main)
    }()

    private override init() {
        super.init()
    }

    /// Permanent document storage: Survives OS reboots and cache purges. Backed up by iOS unless excluded.
    public var permanentMediaDirectory: URL {
        let paths = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)
        let dir = paths[0].appendingPathComponent("AlMuadhinMedia", isDirectory: true)
        if !FileManager.default.fileExists(atPath: dir.path) {
            try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true, attributes: nil)
        }
        return dir
    }

    /// Temporary cache storage: For transient files and in-progress downloads.
    public var cacheDirectory: URL {
        let paths = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)
        let dir = paths[0].appendingPathComponent("AlMuadhinTemp", isDirectory: true)
        if !FileManager.default.fileExists(atPath: dir.path) {
            try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true, attributes: nil)
        }
        return dir
    }

    /// Downloads a media file with HTTP resume support and validation.
    public func downloadMediaWithResume(url: URL, fileName: String, completion: @escaping (Result<URL, Error>) -> Void) {
        let targetUrl = permanentMediaDirectory.appendingPathComponent(fileName)

        // 1. If file already exists and is intact (> 4KB), return immediately
        if FileManager.default.fileExists(atPath: targetUrl.path),
           let attrs = try? FileManager.default.attributesOfItem(atPath: targetUrl.path),
           let size = attrs[.size] as? Int64, size > 4096 {
            completion(.success(targetUrl))
            return
        }

        activeDownloads.insert(fileName)
        downloadContinuations[fileName] = completion

        // If resume data exists from a previously paused download, resume it
        if let resumeData = resumeDataMap[fileName] {
            let task = urlSession.downloadTask(withResumeData: resumeData)
            task.taskDescription = fileName
            task.resume()
            resumeDataMap.removeValue(forKey: fileName)
        } else {
            let task = urlSession.downloadTask(with: url)
            task.taskDescription = fileName
            task.resume()
        }
    }

    // MARK: - URLSessionDownloadDelegate
    public func urlSession(_ session: URLSession, downloadTask: URLSessionDownloadTask, didFinishDownloadingTo location: URL) {
        guard let fileName = downloadTask.taskDescription else { return }
        let targetUrl = permanentMediaDirectory.appendingPathComponent(fileName)

        do {
            // Verify file size and basic integrity
            let attrs = try FileManager.default.attributesOfItem(atPath: location.path)
            guard let size = attrs[.size] as? Int64, size > 2048 else {
                throw NSError(domain: "MediaStorageManager", code: 422, userInfo: [NSLocalizedDescriptionKey: "الملف المُحمّل غير مكتمل أو تالف"])
            }

            if FileManager.default.fileExists(atPath: targetUrl.path) {
                try FileManager.default.removeItem(at: targetUrl)
            }

            try FileManager.default.moveItem(at: location, to: targetUrl)

            activeDownloads.remove(fileName)
            if let callback = downloadContinuations.removeValue(forKey: fileName) {
                callback(.success(targetUrl))
            }
        } catch {
            activeDownloads.remove(fileName)
            if let callback = downloadContinuations.removeValue(forKey: fileName) {
                callback(.failure(error))
            }
        }
    }

    public func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        guard let error = error, let fileName = task.taskDescription else { return }

        // Store resume data if available for future continuation
        if let resumeData = (error as NSError).userInfo[NSURLSessionDownloadTaskResumeData] as? Data {
            resumeDataMap[fileName] = resumeData
        }

        activeDownloads.remove(fileName)
        if let callback = downloadContinuations.removeValue(forKey: fileName) {
            callback(.failure(error))
        }
    }

    /// Saves image directly to the iOS Camera Roll via PHPhotoLibrary
    public func saveImageToPhotoLibrary(image: UIImage, completion: @escaping (Bool, Error?) -> Void) {
        PHPhotoLibrary.requestAuthorization { status in
            guard status == .authorized || status == .limited else {
                completion(false, NSError(domain: "MediaStorageManager", code: 403, userInfo: [NSLocalizedDescriptionKey: "يرجى منح إذن الوصول إلى الصور لحفظ البطاقة"]))
                return
            }

            PHPhotoLibrary.shared().performChanges({
                PHAssetChangeRequest.creationRequestForAsset(from: image)
            }) { success, error in
                DispatchQueue.main.async {
                    completion(success, error)
                }
            }
        }
    }

    /// Cleans only temporary cache files, safeguarding active downloads and permanent user files
    public func cleanTemporaryCacheOnly() -> Int64 {
        var freedBytes: Int64 = 0
        let fileManager = FileManager.default
        let cacheUrl = cacheDirectory

        if let enumerator = fileManager.enumerator(at: cacheUrl, includingPropertiesForKeys: [.fileSizeKey]) {
            for case let fileUrl as URL in enumerator {
                let name = fileUrl.lastPathComponent
                if !activeDownloads.contains(name) {
                    if let size = try? fileUrl.resourceValues(forKeys: [.fileSizeKey]).fileSize {
                        freedBytes += Int64(size)
                    }
                    try? fileManager.removeItem(at: fileUrl)
                }
            }
        }
        return freedBytes
    }
}
