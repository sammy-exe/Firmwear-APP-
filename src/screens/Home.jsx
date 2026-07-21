import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MascotHead } from '../components/Mascot';
import ThemeToggle from '../components/ThemeToggle';
import { getSavedIP, clearIP } from '../utils/security';
import { pingRobot } from '../utils/wifi';

export default function Home() {
  const navigate = useNavigate();
  const [ip, setIp] = useState('—');
  const [connected, setConnected] = useState(false);
  const [current, setCurrent] = useState(0);
  const trackRef = useRef(null);
  const startX = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      const saved = await getSavedIP();
      if (!saved) { setConnected(false); return; }
      setIp(saved);

      // Retry ping every 3s for up to 30s
      for (let i = 0; i < 10; i++) {
        if (cancelled) return;
        const alive = await pingRobot(saved);
        if (alive) { setConnected(true); return; }
        await new Promise(r => setTimeout(r, 3000));
      }
      setConnected(false);
    };
    init();
    return () => { cancelled = true; };
  }, []);

  async function handleDisconnect() {
    await clearIP();
    navigate('/scanning', { replace: true });
  }

  async function handleResetESP() {
    if (!window.confirm('This will erase the bot\'s saved WiFi and restart it into setup mode. Continue?')) return;
    try {
      const saved = await getSavedIP();
      await fetch(`http://${saved}/reset`, { method: 'POST', signal: AbortSignal.timeout(3000) });
    } catch {}
    await clearIP();
    navigate('/scanning', { replace: true });
  }

  function swipe(dir) {
    setCurrent(c => Math.max(0, Math.min(1, c + dir)));
  }

  function onPointerDown(e) {
    startX.current = e.clientX;
    if (trackRef.current) trackRef.current.style.transition = 'none';
  }

  function onPointerMove(e) {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    if (trackRef.current) trackRef.current.style.transform = `translateX(calc(${-current} * (100% + 10px) + ${dx}px))`;
  }

  function onPointerUp(e) {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    if (trackRef.current) trackRef.current.style.transition = 'transform 0.35s cubic-bezier(0.34,1.2,0.64,1)';
    if (dx < -40) swipe(1);
    else if (dx > 40) swipe(-1);
    else updateTransform(current);
    startX.current = null;
  }

  function updateTransform(idx) {
    if (trackRef.current) trackRef.current.style.transform = `translateX(calc(${-idx} * (100% + 10px)))`;
  }

  useEffect(() => {
    if (trackRef.current) {
      trackRef.current.style.transition = 'transform 0.35s cubic-bezier(0.34,1.2,0.64,1)';
      updateTransform(current);
    }
  }, [current]);

  const modes = [
    {
      key: 'maxbot', emoji: '🤖', label: 'MaxBot', color: '#00bfa8',
      desc: 'Drive, follow and control your robot',
      tags: ['Car Mode', 'Follow Me'],
      btnColor: '#00bfa8',
    },
    {
      key: 'maxdesk', emoji: '🖥️', label: 'MaxDesk', color: '#f05c2a',
      desc: 'AI kiosk, company display & smart face',
      tags: ['ShowCase', 'AI Assistant'],
      btnColor: '#f05c2a',
    },
  ];

  return (
    <div className="screen-wrap">
      <div className="notebook-bg" />
      <div className="notebook-margin" />

      {/* Header */}
      <div style={{ padding: '14px 14px 12px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 2, background: 'var(--bg)', flexShrink: 0 }}>
        <MascotHead size={38} />
        <div>
          <div className="wm" style={{ fontSize: 18 }}>
            <span className="wm-a">Max</span><span className="wm-b">Bot</span>
          </div>
          <div style={{ fontSize: 8, color: 'var(--ink3)', marginTop: 2, letterSpacing: 0.4 }}>Robotics · STEAM · AI</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: connected ? 'var(--teal-l)' : 'var(--bg2)', color: connected ? 'var(--teal-d)' : 'var(--ink3)', fontSize: 8, fontWeight: 700, padding: '3px 8px', borderRadius: 99, fontFamily: "'Space Grotesk', sans-serif" }}>
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: connected ? 'var(--teal)' : 'var(--ink3)' }} />
          {connected ? 'Online' : 'Offline'}
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* IP Card */}
      <div style={{ margin: '10px 13px 0', background: connected ? 'var(--teal-l)' : 'var(--bg2)', borderRadius: 'var(--r)', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, border: connected ? '1px solid rgba(0,191,168,0.3)' : '1px solid var(--line)', position: 'relative', zIndex: 2, flexShrink: 0 }}>
        <div style={{ width: 32, height: 32, background: connected ? 'rgba(0,191,168,0.2)' : 'var(--bg3)', borderRadius: 9, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>📡</div>
        <div>
          <div style={{ fontSize: 8, fontWeight: 700, color: connected ? 'var(--teal-d)' : 'var(--ink3)', letterSpacing: 0.8, textTransform: 'uppercase' }}>Device IP</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: connected ? 'var(--teal-d)' : 'var(--ink)', marginTop: 1, fontFamily: "'DM Mono', monospace" }}>{ip}</div>
          <div style={{ fontSize: 8, marginTop: 2, fontWeight: 700, color: connected ? '#2ecc71' : 'var(--danger)', fontFamily: "'Space Grotesk', sans-serif" }}>
            {connected ? '● Connected' : '○ Not reachable'}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          <div onClick={() => navigate('/ip-entry')} style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid var(--line)', background: 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, cursor: 'pointer' }}>✏️</div>
          <div onClick={handleResetESP} style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid rgba(240,92,42,.25)', background: 'rgba(240,92,42,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, cursor: 'pointer' }} title="Reset bot WiFi">📶</div>
          <div onClick={handleDisconnect} style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid rgba(231,76,60,.2)', background: 'rgba(231,76,60,.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, cursor: 'pointer' }}>🗑</div>
        </div>
      </div>

      {/* Mode label */}
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 9, fontWeight: 700, color: 'var(--ink3)', padding: '12px 14px 8px', letterSpacing: 1, textTransform: 'uppercase', position: 'relative', zIndex: 2, flexShrink: 0 }}>
        Select Mode
      </div>

      {/* Swipe cards */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 13px', overflow: 'hidden', position: 'relative', zIndex: 2, justifyContent: 'center' }}>
        <div
          ref={trackRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{ display: 'flex', gap: 10, touchAction: 'none', cursor: 'grab', transform: 'translateX(0)', transition: 'transform 0.35s cubic-bezier(0.34,1.2,0.64,1)' }}
        >
          {modes.map(mode => (
            <div key={mode.key} style={{ minWidth: '100%', background: 'var(--white)', borderRadius: 20, padding: '22px 16px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, border: '1px solid var(--line)', boxSizing: 'border-box' }}>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: `${mode.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, border: `1.5px solid ${mode.color}25` }}>{mode.emoji}</div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{mode.label}</div>
              <div style={{ fontSize: 10, color: 'var(--ink3)', textAlign: 'center', lineHeight: 1.6 }}>{mode.desc}</div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'center' }}>
                {mode.tags.map(t => (
                  <span key={t} style={{ fontSize: 8, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: `${mode.color}12`, color: mode.color, border: `1px solid ${mode.color}30`, fontFamily: "'Space Grotesk', sans-serif" }}>{t}</span>
                ))}
              </div>
              <div style={{ width: '100%', paddingTop: 12, borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'center', marginTop: 2 }}>
                <div
                  onClick={() => connected ? navigate(`/${mode.key}`) : null}
                  style={{ background: connected ? 'var(--ink)' : 'var(--bg3)', color: connected ? mode.btnColor : 'var(--ink3)', fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, fontWeight: 700, padding: '10px 28px', borderRadius: 10, letterSpacing: 0.3, cursor: connected ? 'pointer' : 'not-allowed', opacity: connected ? 1 : 0.6 }}
                >
                  {connected ? `Open ${mode.label} →` : 'No Device Connected'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Swipe dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 10 }}>
          {modes.map((m, i) => (
            <div key={i} onClick={() => setCurrent(i)} style={{ height: 3, borderRadius: 2, background: current === i ? 'var(--teal)' : 'var(--bg3)', width: current === i ? 20 : 12, boxShadow: current === i ? '0 0 5px var(--teal)' : 'none', transition: 'all 0.3s', cursor: 'pointer' }} />
          ))}
        </div>
      </div>

      <div style={{ textAlign: 'center', padding: '8px 0 10px', position: 'relative', zIndex: 2, flexShrink: 0 }}>
        <button style={{ fontSize: 9, color: 'var(--ink3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>ⓘ App Info</button>
      </div>
    </div>
  );
}
