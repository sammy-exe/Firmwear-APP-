import { generateToken, saveToken, getToken, validateIP, secureFetch } from './security';

const ESP_HOST = 'http://192.168.4.1';

// ── Scan all nearby WiFi networks ──
export async function scanNearbyNetworks() {
  try {
    const { WifiConnect } = await import('@falconeta/capacitor-wifi-connect');
    const result = await WifiConnect.getAvailableSSIDs();
    const ssids = Array.isArray(result.value) ? result.value : [];
    return ssids
      .filter(ssid => ssid && ssid.trim() !== '')
      .map(ssid => ({
        ssid: ssid.trim(),
        rssi: 0,
        isMaxbot: ssid.startsWith('MAXBOT') || ssid.startsWith('MaxBot'),
      }));
  } catch (e) {
    console.warn('WiFi scan error:', e.message);
    return [];
  }
}

// ── Connect phone to a specific hotspot ──
export async function connectToSSID(ssid) {
  try {
    const { WifiConnect } = await import('@falconeta/capacitor-wifi-connect');
    const result = await WifiConnect.connect({ ssid });
    return result.value === 'SUCCESS';
  } catch (e) {
    console.warn('WiFi connect error:', e.message);
    return false;
  }
}

export async function connectToMaxbotHotspot() {
  return connectToSSID('MAXBOT_SETUP');
}

export async function disconnectFromHotspot() {
  try {
    const { WifiConnect } = await import('@falconeta/capacitor-wifi-connect');
    await WifiConnect.disconnect();
  } catch {}
}

// ── Get networks from ESP ──
export async function getNetworksFromESP() {
  try {
    const res = await fetch(`${ESP_HOST}/networks`, {
      method: 'GET',
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) throw new Error('ESP scan failed');
    const data = await res.json();
    return Array.isArray(data.networks) ? data.networks : [];
  } catch {
    return [];
  }
}

// ── Send WiFi credentials to ESP ──
export async function sendWifiCredentials(ssid, password) {
  const token = generateToken();
  await saveToken(token);
  try {
    const res = await fetch(`${ESP_HOST}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Max-Token': token },
      body: JSON.stringify({ ssid, password }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error('ESP rejected credentials');
    const data = await res.json();
    // Auto-save IP if ESP returns it
    if (data.ip) {
      const { saveIP } = await import('./security');
      await saveIP(data.ip);
    }
  } catch {}
  return token;
}

// ── Ping robot at saved IP ──
export async function pingRobot(ip) {
  if (!validateIP(ip)) return false;
  try {
    const res = await fetch(`http://${ip}/ping`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
