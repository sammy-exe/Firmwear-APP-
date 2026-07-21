import ThemeToggle from '../components/ThemeToggle';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MascotHead } from '../components/Mascot';
import { scanNearbyNetworks, connectToSSID } from '../utils/wifi';
import { requestAllPermissions } from '../utils/permissions';

export default function Scanning() {
  const navigate = useNavigate();
  const [detected, setDetected] = useState(null);   // null | { ssid, via }
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [dots, setDots] = useState(0);
  const scanRef = useRef(true);

  // Animate dots
  useEffect(() => {
    const t = setInterval(() => setDots(d => (d + 1) % 4), 500);
    return () => clearInterval(t);
  }, []);

  // Detection — ping and scan run independently
  useEffect(() => {
    scanRef.current = true;

    // Ping loop — every 500ms, instant if already on hotspot
    async function pingLoop() {
      await requestAllPermissions();
      while (scanRef.current) {
        try {
          const res = await fetch('http://192.168.4.1/ping', {
            signal: AbortSignal.timeout(800),
          });
          if (res.ok && scanRef.current) {
            navigate('/wifi-setup', { replace: true });
            return;
          }
        } catch {}
        await new Promise(r => setTimeout(r, 500));
      }
    }

    // Scan loop — every 3s, catches SSID before connecting
    async function scanLoop() {
      while (scanRef.current) {
        try {
          const nets = await scanNearbyNetworks();
          const maxbot = nets.find(n => n.isMaxbot);
          if (maxbot && scanRef.current) {
            setDetected({ ssid: maxbot.ssid });
            return;
          }
        } catch {}
        await new Promise(r => setTimeout(r, 3000));
      }
    }

    pingLoop();
    scanLoop();
    return () => { scanRef.current = false; };
  }, []);

  async function handleConnect() {
    if (!detected) return;
    setConnecting(true);
    setError('');
    try {
      await connectToSSID(detected.ssid);
      await new Promise(r => setTimeout(r, 1000));
      navigate('/wifi-setup');
    } catch {
      setError('Connection failed. Go to WiFi settings and connect to MAXBOT_SETUP manually, then come back.');
      setConnecting(false);
    }
  }

  return (
    <div className="screen-wrap" style={{ overflow: 'hidden' }}>
      <div className="notebook-bg" />
      <div className="notebook-margin" />

      {/* Nav */}
      <div className="top-nav">
        <div className="nav-left">
          <MascotHead size={28} />
          <div className="wm" style={{ fontSize: 13 }}>
            <span className="wm-a">Max</span><span className="wm-b">Bot</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ThemeToggle />
          <div
            onClick={() => { scanRef.current = false; navigate('/home'); }}
            style={{ cursor: 'pointer', padding: '6px 10px', fontSize: 11, color: 'var(--ink3)', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}
          >Skip ›</div>
        </div>
      </div>

      {/* Main — radar + status */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 2, gap: 0 }}>

        {/* Radar rings */}
        <div style={{ width: 200, height: 200, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              position: 'absolute', borderRadius: '50%',
              border: '1.5px solid rgba(0,191,168,0.15)',
              animation: `rr 2.8s ease-out infinite ${i * 0.9}s`,
              top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            }} />
          ))}
          <div style={{
            width: 72, height: 72, background: 'var(--ink)', borderRadius: '50%',
            border: '2px solid var(--teal)', zIndex: 2,
            boxShadow: '0 0 0 8px var(--teal-l), 0 0 32px rgba(0,191,168,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <MascotHead size={44} />
          </div>
        </div>

        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
          Looking for MaxBot
        </div>

        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--ink3)', letterSpacing: 1 }}>
          {'scanning' + '.'.repeat(dots)}
        </div>

        <div style={{ fontSize: 9, color: 'var(--ink3)', marginTop: 24, textAlign: 'center', lineHeight: 1.9 }}>
          Power on your MaxBot · make sure it's in setup mode
        </div>
      </div>

      {/* AirPods-style bottom sheet — slides up when detected */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 30,
        transform: detected ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.45s cubic-bezier(0.34,1.1,0.64,1)',
      }}>
        {/* Scrim */}
        {detected && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,24,20,0.4)', backdropFilter: 'blur(4px)', zIndex: -1 }} />
        )}

        <div style={{
          background: 'var(--bg)', borderRadius: '24px 24px 0 0',
          padding: '10px 20px 40px',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
          border: '1px solid var(--line)',
          borderBottom: 'none',
        }}>
          {/* Handle */}
          <div style={{ width: 36, height: 4, background: 'var(--line)', borderRadius: 2, margin: '0 auto 20px' }} />

          {/* Device row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div style={{
              width: 56, height: 56, background: 'var(--teal-l)', borderRadius: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
              border: '1.5px solid rgba(0,191,168,0.3)',
              flexShrink: 0,
            }}>🤖</div>
            <div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>
                MaxBot Detected
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'var(--teal-d)', marginTop: 2 }}>
                {detected?.ssid}
              </div>
              <div style={{ fontSize: 9, color: 'var(--ink3)', marginTop: 2 }}>
                Tap below to connect
              </div>
            </div>
            <div style={{
              marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 8, fontWeight: 700, color: 'var(--teal)',
              fontFamily: "'Space Grotesk', sans-serif",
            }}>
              <div style={{ width: 6, height: 6, background: 'var(--teal)', borderRadius: '50%', boxShadow: '0 0 6px var(--teal)', animation: 'ld 1.5s ease-in-out infinite' }} />
              LIVE
            </div>
          </div>

          {error && (
            <div style={{ marginBottom: 12, padding: '9px 12px', background: 'rgba(231,76,60,.08)', color: 'var(--danger)', border: '1px solid rgba(231,76,60,.2)', borderRadius: 10, fontSize: 9, fontFamily: "'DM Mono', monospace", lineHeight: 1.6 }}>
              {error}
            </div>
          )}

          <button
            onClick={handleConnect}
            disabled={connecting}
            style={{
              width: '100%', padding: '15px', borderRadius: 14,
              background: connecting ? 'var(--bg3)' : 'var(--ink)',
              color: connecting ? 'var(--ink3)' : 'var(--teal)',
              fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 700,
              border: 'none', cursor: connecting ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.2s',
            }}
          >
            {connecting ? (
              <>
                <div style={{ width: 12, height: 12, border: '2px solid var(--teal)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                Connecting...
              </>
            ) : 'Connect to MaxBot →'}
          </button>
        </div>
      </div>

      {connecting && (
        <div className="conn-overlay">
          <div className="conn-spin" />
          <div className="conn-txt">Connecting to {detected?.ssid}...</div>
        </div>
      )}
    </div>
  );
}
