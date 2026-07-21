// ── Storage abstraction (browser + Capacitor safe) ──
async function storageSet(key, value) {
  try {
    const { Preferences } = await import('@capacitor/preferences');
    await Preferences.set({ key, value });
  } catch {
    localStorage.setItem(key, value);
  }
}

async function storageGet(key) {
  try {
    const { Preferences } = await import('@capacitor/preferences');
    const { value } = await Preferences.get({ key });
    return value;
  } catch {
    return localStorage.getItem(key);
  }
}

async function storageRemove(key) {
  try {
    const { Preferences } = await import('@capacitor/preferences');
    await Preferences.remove({ key });
  } catch {
    localStorage.removeItem(key);
  }
}

const TOKEN_KEY    = 'max_session_token';
const TOKEN_TS_KEY = 'max_token_ts';
const TOKEN_TTL    = 30 * 60 * 1000;

export function generateToken() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function saveToken(token) {
  await storageSet(TOKEN_KEY, token);
  await storageSet(TOKEN_TS_KEY, Date.now().toString());
}

export async function getToken() {
  const token = await storageGet(TOKEN_KEY);
  const ts    = await storageGet(TOKEN_TS_KEY);
  if (!token || !ts) return null;
  if (Date.now() - parseInt(ts) > TOKEN_TTL) { await clearToken(); return null; }
  return token;
}

export async function clearToken() {
  await storageRemove(TOKEN_KEY);
  await storageRemove(TOKEN_TS_KEY);
}

// ── Device (ESP32) IP ──
const IP_KEY = 'max_device_ip';

export async function saveIP(ip) {
  if (!validateIP(ip)) throw new Error('Invalid IP');
  await storageSet(IP_KEY, ip);
}

export async function getSavedIP() {
  return await storageGet(IP_KEY) || null;
}

export async function clearIP() {
  await storageRemove(IP_KEY);
}

// ── Server IP ──
const SERVER_IP_KEY = 'max_server_ip';

export async function saveServerIP(ip) {
  if (!validateIP(ip)) throw new Error('Invalid server IP');
  await storageSet(SERVER_IP_KEY, ip);
}

export async function getServerIP() {
  return await storageGet(SERVER_IP_KEY) || null;
}

export async function clearServerIP() {
  await storageRemove(SERVER_IP_KEY);
}

// ── Validation ──
const IP_REGEX = /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/;

export function validateIP(ip) {
  if (!ip || typeof ip !== 'string') return false;
  return IP_REGEX.test(ip.trim());
}

export function validatePassword(pw) {
  if (!pw || typeof pw !== 'string') return { valid: false, error: 'Password is required' };
  if (pw.length < 8)  return { valid: false, error: 'Must be at least 8 characters' };
  if (pw.length > 63) return { valid: false, error: 'Too long (max 63 characters)' };
  return { valid: true, error: null };
}

export function sanitizeInput(str) {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[<>"'&]/g, '').trim().slice(0, 256);
}

const FETCH_TIMEOUT = 8000;

export async function secureFetch(url, options = {}, token = null) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'X-Max-Token': token } : {}),
    'X-Max-TS': Date.now().toString(),
    ...options.headers,
  };
  try {
    const res = await fetch(url, { ...options, headers, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') throw new Error('Request timed out');
    throw err;
  }
}

const attempts = {};

export function checkRateLimit(key, max = 5, windowMs = 60000) {
  const now = Date.now();
  if (!attempts[key]) attempts[key] = [];
  attempts[key] = attempts[key].filter(t => now - t < windowMs);
  if (attempts[key].length >= max) {
    const waitMs = windowMs - (now - attempts[key][0]);
    throw new Error(`Too many attempts. Wait ${Math.ceil(waitMs / 1000)}s`);
  }
  attempts[key].push(now);
}

export async function pingRobot(ip) {
  if (!validateIP(ip)) return false;
  try {
    const token = await getToken();
    const res = await secureFetch(`http://${ip}/ping`, { method: 'GET' }, token);
    return res.ok;
  } catch {
    return false;
  }
}
