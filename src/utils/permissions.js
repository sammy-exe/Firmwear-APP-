import { Geolocation } from '@capacitor/geolocation';

export async function requestAllPermissions() {
  const results = { location: false, nearbyWifi: false };

  // Location — required for WiFi scanning on Android 6–12, still needed on 13+
  try {
    const perm = await Geolocation.requestPermissions();
    results.location = perm.location === 'granted' || perm.coarseLocation === 'granted';
  } catch {
    results.location = false;
  }

  // NEARBY_WIFI_DEVICES — required at runtime on Android 13+
  try {
    const { WifiConnect } = await import('@falconeta/capacitor-wifi-connect');
    if (typeof WifiConnect.requestPermissions === 'function') {
      const perm = await WifiConnect.requestPermissions();
      results.nearbyWifi = perm?.granted !== false;
    } else {
      results.nearbyWifi = true; // plugin version handles it internally
    }
  } catch {
    results.nearbyWifi = false;
  }

  return results;
}

export function isAndroid() {
  return typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
}

export function isBrowser() { return !isAndroid(); }
export async function requestMicPermission() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(t => t.stop());
    return true;
  } catch {
    return false;
  }
}
