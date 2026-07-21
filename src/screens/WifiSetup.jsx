import ThemeToggle from '../components/ThemeToggle';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MascotHead } from '../components/Mascot';
import { validatePassword, checkRateLimit } from '../utils/security';
import { getNetworksFromESP, sendWifiCredentials } from '../utils/wifi';

export default function WifiSetup() {
  const navigate = useNavigate();
  const [networks, setNetworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [pwOpen, setPwOpen] = useState(false);
  const [pwNetwork, setPwNetwork] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadNetworks(); }, []);

  async function loadNetworks() {
    setLoading(true);
    try {
      const nets = await getNetworksFromESP();
      setNetworks(nets);
      if (nets.length > 0) setSelected(nets[0].ssid);
    } catch {
      setNetworks([]);
    } finally {
      setLoading(false);
    }
  }

  function openPW(ssid) {
    setPwNetwork(ssid);
    setSelected(ssid);
    setPassword('');
    setError('');
    setPwOpen(true);
  }

  async function handleConnect() {
    const { valid, error: pwErr } = validatePassword(password);
    if (!valid) { setError(pwErr); return; }

    try {
      checkRateLimit('wifi_connect', 5, 60000);
    } catch (e) {
      setError(e.message);
      return;
    }

    setPwOpen(false);
    setConnecting(true);

    try {
      await sendWifiCredentials(pwNetwork, password);
    } catch {
      // Prototype — continue without real ESP
    }

    await new Promise(r => setTimeout(r, 2200));
    setConnecting(false);
    navigate('/ip-entry');
  }

  return (
    <div className="screen-wrap">
      <div className="notebook-bg" />
      <div className="notebook-margin" />

      <div className="top-nav">
        <div className="nav-left">
          <div className="nav-back" onClick={() => navigate('/scanning')}>←</div>
          <div className="nav-title">Select Network</div>
        </div>
        <ThemeToggle />
        <div className="nav-skip" onClick={() => navigate('/home')}>Skip ›</div>
      </div>

      {/* Device card */}
      <div style={{ margin: '10px 13px 0', background: 'var(--ink)', borderRadius: 'var(--r)', padding: '11px 13px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 18px rgba(0,0,0,0.16)', position: 'relative', zIndex: 2, flexShrink: 0 }}>
        <MascotHead size={38} />
        <div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 12, fontWeight: 700, color: '#fff' }}>MAXBOT_SETUP</div>
          <div style={{ fontSize: 9, color: '#5a5248', marginTop: 2, fontFamily: "'DM Mono', monospace" }}>192.168.4.1 · Hotspot active</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 8, fontWeight: 700, color: 'var(--teal)', fontFamily: "'Space Grotesk', sans-serif" }}>
          <div style={{ width: 5, height: 5, background: 'var(--teal)', borderRadius: '50%', boxShadow: '0 0 5px var(--teal)', animation: 'ld 1.8s ease-in-out infinite' }} />
          LIVE
        </div>
      </div>

      <div className="sec-lbl">Your Networks</div>

      {/* Network list */}
      <div style={{ margin: '0 13px', background: 'var(--white)', borderRadius: 'var(--r-sm)', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.06), 0 0 0 1px var(--line)', position: 'relative', zIndex: 2, flexShrink: 0 }}>
        {loading ? (
          <div style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, color: 'var(--ink3)' }}>
            <div style={{ width: 10, height: 10, border: '1.5px solid var(--bg3)', borderTopColor: 'var(--teal)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            Loading networks from device...
          </div>
        ) : networks.length === 0 ? (
          <div style={{ padding: 14, fontSize: 10, color: 'var(--ink3)', textAlign: 'center' }}>No networks found. Tap Scan Again.</div>
        ) : (
          networks.map((net, i) => (
            <div key={net.ssid}
              onClick={() => openPW(net.ssid)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 11px',
                borderBottom: i < networks.length - 1 ? '1px solid var(--bg2)' : 'none',
                cursor: 'pointer',
                borderLeft: selected === net.ssid ? '2.5px solid var(--teal)' : '2.5px solid transparent',
                background: selected === net.ssid ? 'rgba(0,191,168,0.03)' : 'transparent',
                transition: 'all 0.15s',
              }}>
              <div style={{ width: 26, height: 26, borderRadius: 6, background: selected === net.ssid ? 'var(--teal-l)' : 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0 }}>📶</div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: selected === net.ssid ? 'var(--teal-d)' : 'var(--ink)' }}>{net.ssid}</div>
                <div style={{ fontSize: 8, color: 'var(--ink3)', marginTop: 1 }}>{net.strength} · {net.security}</div>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: 10, color: selected === net.ssid ? 'var(--teal)' : 'var(--ink3)' }}>
                {selected === net.ssid ? '✓' : '›'}
              </div>
            </div>
          ))
        )}
      </div>

      <div onClick={loadNetworks} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: 10, margin: '6px 13px 0', border: '1px dashed var(--line)', borderRadius: 'var(--r-sm)', fontSize: 9, fontWeight: 600, color: 'var(--teal)', cursor: 'pointer', flexShrink: 0, position: 'relative', zIndex: 2 }}>
        ↻ Scan Again
      </div>

      <div className="nav-dots" style={{ marginTop: 'auto' }}>
        <div className="nd" /><div className="nd on" /><div className="nd" /><div className="nd" />
      </div>

      {/* Password sheet */}
      {pwOpen && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(28,24,20,0.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'flex-end', zIndex: 20 }}
          onClick={e => e.target === e.currentTarget && setPwOpen(false)}>
          <div style={{ width: '100%', background: 'var(--bg)', borderRadius: '22px 22px 0 0', padding: '14px 18px 32px' }}>
            <div style={{ width: 32, height: 3, background: 'var(--line)', borderRadius: 2, margin: '0 auto 16px' }} />
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 3 }}>{pwNetwork}</div>
            <div style={{ fontSize: 10, color: 'var(--ink3)', marginBottom: 14 }}>Enter the password for this network</div>
            <div style={{ background: 'var(--white)', borderRadius: 'var(--r-sm)', border: `1.5px solid ${error ? 'var(--danger)' : 'var(--line)'}`, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--ink3)', flexShrink: 0 }}>🔒</span>
              <input
                autoFocus
                type={showPw ? 'text' : 'password'}
                placeholder="WiFi Password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                style={{ flex: 1, border: 'none', outline: 'none', fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--ink)', padding: '11px 0', background: 'transparent' }}
              />
              <span style={{ fontSize: 10, color: 'var(--ink3)', cursor: 'pointer' }} onClick={() => setShowPw(p => !p)}>👁</span>
            </div>
            {error && <div style={{ fontSize: 9, color: 'var(--danger)', marginBottom: 8, fontFamily: "'DM Mono', monospace" }}>{error}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <button onClick={() => setPwOpen(false)} style={{ flex: 1, padding: 11, background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 'var(--r-sm)', fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, fontWeight: 700, color: 'var(--ink2)', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleConnect} style={{ flex: 2, padding: 11, background: 'var(--ink)', border: 'none', borderRadius: 'var(--r-sm)', fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, fontWeight: 700, color: 'var(--teal)', cursor: 'pointer', boxShadow: '0 3px 12px rgba(0,0,0,.2)' }}>Save & Connect →</button>
            </div>
          </div>
        </div>
      )}

      {connecting && (
        <div className="conn-overlay">
          <div className="conn-spin" />
          <div className="conn-txt">Connecting to WiFi...</div>
        </div>
      )}
    </div>
  );
}
