import Foundation
import UIKit
import Photos

public class MediaStorageManager {
    public static let shared = MediaStorageManager()

    private init() {}

    public var permanentMediaDirectory: URL {
        let paths = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)
        let dir = paths[0].appendingPathComponent("AlMuadhinMedia", isDirectory: true)
        if !FileManager.default.fileExists(atPath: dir.path) {
            try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true, attributes: nil)
        }
        return dir
    }

    public var cacheDirectory: URL {
        let paths = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)
        let dir = paths[0].appendingPathComponent("AlMuadhinTemp", isDirectory: true)
        if !FileManager.default.fileExists(atPath: dir.path) {
            try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true, attributes: nil)
        }
        return dir
    }

    public func saveImageToPhotoLibrary(image: UIImage, completion: @escaping (Bool, Error?) -> Void) {
        PHPhotoLibrary.requestAuthorization { status in
            guard status == .authorized || status == .limited else {
                completion(false, NSError(domain: "MediaStorageManager", code: 403, userInfo: [NSLocalizedDescriptionKey: "Photo library access denied"]))
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

    public func cleanTemporaryCacheOnly() -> Int64 {
        var freedBytes: Int64 = 0
        let fileManager = FileManager.default
        let cacheUrl = cacheDirectory

        if let enumerator = fileManager.enumerator(at: cacheUrl, includingPropertiesForKeys: [.fileSizeKey]) {
            for case let fileUrl as URL in enumerator {
                if let size = try? fileUrl.resourceValues(forKeys: [.fileSizeKey]).fileSize {
                    freedBytes += Int64(size)
                }
                try? fileManager.removeItem(at: fileUrl)
            }
        }
        return freedBytes
    }
}
