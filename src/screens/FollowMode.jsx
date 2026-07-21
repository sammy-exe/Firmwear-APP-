import MjpegStream from '../components/MjpegStream';
import ThemeToggle from '../components/ThemeToggle';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSavedIP, getToken } from '../utils/security';

function useLandscape() {
  useEffect(() => {
    const lock = async () => {
      try {
        const { ScreenOrientation } = await import('@capacitor/screen-orientation');
        await ScreenOrientation.lock({ orientation: 'landscape' });
      } catch {}
    };
    lock();
    return () => {
      import('@capacitor/screen-orientation')
        .then(({ ScreenOrientation }) => ScreenOrientation.unlock())
        .catch(() => {});
    };
  }, []);
}

export default function FollowMode() {
  useLandscape();
  const navigate = useNavigate();
  const ipRef = useRef(null);
  const [ip, setIp] = useState(null);
  const [active, setActive] = useState(false);
  const [camOk, setCamOk] = useState(false);
  const [status, setStatus] = useState('Standby');
  const pollRef = useRef(null);

  useEffect(() => {
    getSavedIP().then(savedIp => {
      ipRef.current = savedIp;
      setIp(savedIp);
    });
  }, []);

  // Toggle follow mode on ESP
  async function toggleFollow() {
    const ip = await getSavedIP();
    const token = await getToken();
    const next = !active;
    setActive(next);
    setStatus(next ? 'Following...' : 'Standby');

    try {
      await fetch(`http://${ip}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Max-Token': token || '' },
        body: JSON.stringify({ enabled: next }),
        signal: AbortSignal.timeout(2000),
      });
    } catch {}

    if (next) {
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`http://${ip}/follow/status`, { signal: AbortSignal.timeout(800) });
          const data = await res.json();
          setStatus(data.status || 'Following...');
        } catch {}
      }, 1000);
    } else {
      clearInterval(pollRef.current);
    }
  }

  useEffect(() => () => clearInterval(pollRef.current), []);

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: '#0a0a0a',
      position: 'relative', overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>

      {/* Camera feed */}
      {ipRef.current && (
        <img
          src={`http://${ipRef.current}:81/stream`}
          onLoad={() => setCamActive(true)}
          onError={() => setCamActive(false)}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            opacity: 0.72,
          }}
          alt="cam"
        />
      )}

      {/* ESP32 cam stream */}
      {ip && (
        <MjpegStream
          ip={ip}
          onLoad={() => setCamOk(true)}
          onError={() => setCamOk(false)}
          style={{ opacity: camOk ? 1 : 0, transition: 'opacity 0.5s' }}
        />
      )}

      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />

      {!camOk && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 28, opacity: 0.2 }}>📷</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontFamily: "'DM Mono', monospace", letterSpacing: 1 }}>CAM FEED</div>
        </div>
      )}

      {/* Top bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div onClick={() => { setActive(false); clearInterval(pollRef.current); navigate('/maxbot'); }} style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, cursor: 'pointer', color: '#fff' }}>←</div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: 0.5 }}>🧍 Follow Me</div>
        </div>

        {/* Status pill */}
        <div style={{
          padding: '5px 12px', borderRadius: 20,
          background: active ? 'rgba(0,191,168,0.2)' : 'rgba(255,255,255,0.08)',
          border: active ? '1.5px solid rgba(0,191,168,0.6)' : '1.5px solid rgba(255,255,255,0.15)',
          color: active ? '#00bfa8' : 'rgba(255,255,255,0.4)',
          fontFamily: "'DM Mono', monospace", fontSize: 9,
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          {active && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00bfa8', boxShadow: '0 0 6px #00bfa8', animation: 'ab 1s infinite' }} />}
          {status}
        </div>
      </div>

      {/* Person detection box (visual only) */}
      {active && (
        <div style={{
          position: 'absolute', top: '25%', left: '35%',
          width: '30%', height: '55%',
          border: '2px solid rgba(0,191,168,0.6)',
          borderRadius: 8, zIndex: 8, pointerEvents: 'none',
          boxShadow: '0 0 20px rgba(0,191,168,0.15)',
          animation: 'ld 2s ease-in-out infinite',
        }}>
          <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,191,168,0.8)', color: '#000', fontSize: 7, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", padding: '2px 7px', borderRadius: 10 }}>PERSON</div>
        </div>
      )}

      {/* Corner scan lines */}
      {active && ['topLeft', 'topRight', 'botLeft', 'botRight'].map(c => (
        <div key={c} style={{
          position: 'absolute', zIndex: 6, pointerEvents: 'none',
          ...(c === 'topLeft' ? { top: 50, left: 16 } : {}),
          ...(c === 'topRight' ? { top: 50, right: 16 } : {}),
          ...(c === 'botLeft' ? { bottom: 16, left: 16 } : {}),
          ...(c === 'botRight' ? { bottom: 16, right: 16 } : {}),
          width: 20, height: 20,
          borderTop: c.startsWith('top') ? '2px solid rgba(0,191,168,0.5)' : 'none',
          borderBottom: c.startsWith('bot') ? '2px solid rgba(0,191,168,0.5)' : 'none',
          borderLeft: c.endsWith('Left') ? '2px solid rgba(0,191,168,0.5)' : 'none',
          borderRight: c.endsWith('Right') ? '2px solid rgba(0,191,168,0.5)' : 'none',
        }} />
      ))}

      {/* Big toggle button */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div
          onClick={toggleFollow}
          style={{
            width: 80, height: 80, borderRadius: '50%',
            background: active
              ? 'radial-gradient(circle, rgba(0,191,168,0.3), rgba(0,191,168,0.1))'
              : 'rgba(255,255,255,0.06)',
            border: active ? '2.5px solid rgba(0,191,168,0.8)' : '2px solid rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, cursor: 'pointer',
            boxShadow: active ? '0 0 30px rgba(0,191,168,0.3)' : 'none',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.25s',
          }}
        >
          {active ? '⏹' : '▶'}
        </div>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, fontWeight: 700, color: active ? '#00bfa8' : 'rgba(255,255,255,0.4)', letterSpacing: 0.5 }}>
          {active ? 'TAP TO STOP' : 'TAP TO START'}
        </div>
      </div>

    </div>
  );
}
