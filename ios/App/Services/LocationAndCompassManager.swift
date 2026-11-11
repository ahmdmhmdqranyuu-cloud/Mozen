import Foundation
import CoreLocation
import Combine

public class LocationAndCompassManager: NSObject, ObservableObject, CLLocationManagerDelegate {
    public static let shared = LocationAndCompassManager()

    private let locationManager = CLLocationManager()

    @Published public var heading: Double = 0.0
    @Published public var qiblaBearing: Double = 0.0
    @Published public var userLatitude: Double = 21.4225
    @Published public var userLongitude: Double = 39.8262

    private override init() {
        super.init()
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        calculateQiblaBearing()
    }

    public func startUpdating() {
        locationManager.requestWhenInUseAuthorization()
        locationManager.startUpdatingLocation()
        if CLLocationManager.headingAvailable() {
            locationManager.startUpdatingHeading()
        }
    }

    public func stopUpdating() {
        locationManager.stopUpdatingLocation()
        locationManager.stopUpdatingHeading()
    }

    public func locationManager(_ manager: CLLocationManager, didUpdateHeading newHeading: CLHeading) {
        if newHeading.headingAccuracy >= 0 {
            heading = newHeading.trueHeading > 0 ? newHeading.trueHeading : newHeading.magneticHeading
        }
    }

    public func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        userLatitude = location.coordinate.latitude
        userLongitude = location.coordinate.longitude
        calculateQiblaBearing()
    }

    public func calculateQiblaBearing() {
        let kaabaLat = 21.4225 * .pi / 180.0
        let kaabaLng = 39.8262 * .pi / 180.0
        let userLat = userLatitude * .pi / 180.0
        let deltaLng = kaabaLng - (userLongitude * .pi / 180.0)

        let y = sin(deltaLng) * cos(kaabaLat)
        let x = cos(userLat) * sin(kaabaLat) - sin(userLat) * cos(kaabaLat) * cos(deltaLng)
        var bearing = atan2(y, x) * 180.0 / .pi
        bearing = (bearing + 360.0).truncatingRemainder(dividingBy: 360.0)
        qiblaBearing = bearing
    }
}
