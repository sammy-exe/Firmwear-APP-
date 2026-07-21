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

const KNOB_AREA = 130;
const KNOB_SIZE = 46;
const MAX_DIST = (KNOB_AREA - KNOB_SIZE) / 2;

export default function CarMode() {
  useLandscape();
  const navigate = useNavigate();

  // FIX: ip is now state so the stream <img> actually mounts when IP loads
  const [ip, setIp] = useState(null);
  const tokenRef = useRef(null);
  const [drift, setDrift] = useState(false);
  // FIX: camOk starts false — only flips true on actual stream onLoad
  const [camOk, setCamOk] = useState(false);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const joystickRef = useRef(null);
  const activePointer = useRef(null);
  const sendInterval = useRef(null);
  const knobRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    getSavedIP().then(savedIp => {
      if (savedIp) setIp(savedIp); // triggers re-render → mounts <img>
    });
    getToken().then(t => { tokenRef.current = t; });
  }, []);

  async function sendCmd(cmd, x = 0, y = 0) {
    if (!ip) return;
    try {
      await fetch(`http://${ip}/drive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Max-Token': tokenRef.current || '' },
        body: JSON.stringify({ cmd, x: Math.round(x * 100), y: Math.round(y * 100), drift }),
        signal: AbortSignal.timeout(600),
      });
    } catch {}
  }

  function getCenter() {
    const el = joystickRef.current;
    if (!el) return { cx: 0, cy: 0 };
    const r = el.getBoundingClientRect();
    return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
  }

  function onPointerDown(e) {
    if (activePointer.current !== null) return;
    activePointer.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    moveKnob(e);
    sendInterval.current = setInterval(() => {
      sendCmd('move', knobRef.current.x / MAX_DIST, knobRef.current.y / MAX_DIST);
    }, 100);
  }

  function onPointerMove(e) {
    if (e.pointerId !== activePointer.current) return;
    moveKnob(e);
  }

  function onPointerUp(e) {
    if (e.pointerId !== activePointer.current) return;
    activePointer.current = null;
    clearInterval(sendInterval.current);
    setKnob({ x: 0, y: 0 });
    knobRef.current = { x: 0, y: 0 };
    sendCmd('stop');
  }

  function moveKnob(e) {
    const { cx, cy } = getCenter();
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > MAX_DIST) {
      dx = (dx / dist) * MAX_DIST;
      dy = (dy / dist) * MAX_DIST;
    }
    setKnob({ x: dx, y: dy });
    knobRef.current = { x: dx, y: dy };
  }

  function hardStop() {
    clearInterval(sendInterval.current);
    activePointer.current = null;
    setKnob({ x: 0, y: 0 });
    knobRef.current = { x: 0, y: 0 };
    sendCmd('stop');
  }

  useEffect(() => () => clearInterval(sendInterval.current), []);

  const nx = knob.x / MAX_DIST;
  const ny = knob.y / MAX_DIST;
  const moving = Math.abs(nx) > 0.08 || Math.abs(ny) > 0.08;

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: '#0e0b09',
      position: 'relative', overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 32px',
    }}>

      {/* FIX: ip is state so this mounts correctly; camOk only true after onLoad */}
      {ip && (
        <iframe
          src={`http://${ip}:81/stream`}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            border: 'none',
            opacity: 0.7,
          }}
          scrolling="no"
        />
      )}

      {/* Vignette */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(14,11,9,0.88) 0%, rgba(14,11,9,0.1) 38%, rgba(14,11,9,0.1) 62%, rgba(14,11,9,0.88) 100%)', pointerEvents: 'none', zIndex: 2 }} />

      {/* No cam placeholder */}
      {!camOk && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, zIndex: 1 }}>
          <div style={{ fontSize: 20, opacity: 0.12 }}>📷</div>
          <div style={{ fontSize: 7, color: 'rgba(246,243,238,0.12)', fontFamily: "'DM Mono', monospace", letterSpacing: 2 }}>WAITING FOR CAM</div>
        </div>
      )}

      {/* Top bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div onClick={() => { hardStop(); navigate('/maxbot'); }} style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(28,24,20,0.75)', backdropFilter: 'blur(10px)', border: '1px solid rgba(246,243,238,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, cursor: 'pointer', color: 'rgba(246,243,238,0.7)' }}>←</div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 700, color: 'rgba(246,243,238,0.9)', letterSpacing: 0.5 }}>🚗 Car Mode</div>
        </div>
        <div
          onClick={() => setDrift(d => !d)}
          style={{
            padding: '5px 12px', borderRadius: 20,
            background: drift ? 'rgba(240,92,42,0.2)' : 'rgba(28,24,20,0.75)',
            border: drift ? '1.5px solid rgba(240,92,42,0.7)' : '1.5px solid rgba(246,243,238,0.1)',
            color: drift ? '#f05c2a' : 'rgba(246,243,238,0.3)',
            fontFamily: "'Space Grotesk', sans-serif", fontSize: 8, fontWeight: 700,
            cursor: 'pointer', backdropFilter: 'blur(10px)',
            boxShadow: drift ? '0 0 12px rgba(240,92,42,0.25)' : 'none',
            transition: 'all 0.2s', letterSpacing: 0.5,
          }}
        >🔥 DRIFT {drift ? 'ON' : 'OFF'}</div>
      </div>

      {/* LEFT — joystick */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div
          ref={joystickRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{
            width: KNOB_AREA, height: KNOB_AREA,
            borderRadius: '50%',
            background: 'rgba(28,24,20,0.65)',
            border: `2px solid ${moving ? 'rgba(0,191,168,0.45)' : 'rgba(246,243,238,0.1)'}`,
            backdropFilter: 'blur(14px)',
            position: 'relative',
            boxShadow: moving
              ? '0 0 28px rgba(0,191,168,0.18), inset 0 0 20px rgba(0,0,0,0.4)'
              : 'inset 0 0 20px rgba(0,0,0,0.4)',
            cursor: 'pointer',
            touchAction: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
        >
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: KNOB_AREA * 0.55, height: KNOB_AREA * 0.55, borderRadius: '50%', border: '1px solid rgba(246,243,238,0.05)' }} />
          <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            width: KNOB_SIZE, height: KNOB_SIZE,
            borderRadius: '50%',
            transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))`,
            background: moving
              ? 'radial-gradient(circle at 35% 35%, rgba(0,191,168,0.55), rgba(0,191,168,0.2))'
              : 'radial-gradient(circle at 35% 35%, rgba(246,243,238,0.18), rgba(246,243,238,0.06))',
            border: moving ? '2px solid rgba(0,191,168,0.7)' : '2px solid rgba(246,243,238,0.18)',
            boxShadow: moving ? '0 0 16px rgba(0,191,168,0.4)' : '0 2px 8px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            transition: activePointer.current ? 'none' : 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
          }} />
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, color: 'rgba(246,243,238,0.2)', letterSpacing: 1.5 }}>
          {moving ? (Math.abs(ny) > Math.abs(nx) ? (ny < 0 ? 'FWD' : 'BWD') : (nx > 0 ? 'RIGHT' : 'LEFT')) : 'JOYSTICK'}
        </div>
      </div>

      {/* Crosshair */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 5, pointerEvents: 'none' }}>
        <div style={{ width: 24, height: 24, border: '1px solid rgba(0,191,168,0.2)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 3, height: 3, background: 'rgba(0,191,168,0.35)', borderRadius: '50%' }} />
      </div>

      {/* RIGHT — stop button */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div
          onPointerDown={hardStop}
          style={{
            width: 68, height: 68, borderRadius: '50%',
            background: 'rgba(231,76,60,0.15)',
            border: '2.5px solid rgba(231,76,60,0.5)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
            backdropFilter: 'blur(10px)',
            cursor: 'pointer',
            boxShadow: '0 0 20px rgba(231,76,60,0.15)',
            userSelect: 'none', touchAction: 'none',
          }}
        >
          <div style={{ width: 18, height: 18, borderRadius: 4, background: 'rgba(231,76,60,0.8)' }} />
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7, color: 'rgba(231,76,60,0.5)', letterSpacing: 1.5 }}>STOP</div>
      </div>

    </div>
  );
}
