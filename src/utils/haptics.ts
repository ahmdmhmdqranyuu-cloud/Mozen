/**
 * Triggers a light tactile haptic pulse using supported browser or native bridge APIs
 * without blocking or throwing on unsupported environments.
 */
export function triggerLightHaptic(durationMs = 14): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(durationMs);
    }
    const winBridge =
      typeof window !== 'undefined'
        ? (window as unknown as {
            AndroidPrayerBridge?: { performLightHaptic?: () => void };
          }).AndroidPrayerBridge
        : undefined;
    if (winBridge && typeof winBridge.performLightHaptic === 'function') {
      winBridge.performLightHaptic();
    }
  } catch {
    // Gracefully ignore when haptics are unavailable or blocked
  }
}
