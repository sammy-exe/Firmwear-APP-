import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Mascot from '../components/Mascot';
import { getSavedIP } from '../utils/security';
import { pingRobot } from '../utils/wifi';

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const boot = async () => {
      await new Promise(r => setTimeout(r, 2800));
      try {
        const ip = await getSavedIP();
        if (ip) {
          const alive = await pingRobot(ip).catch(() => false);
          if (alive) {
            navigate('/home', { replace: true });
            return;
          }
        }
      } catch {}
      navigate('/scanning', { replace: true });
    };
    boot();
  }, [navigate]);

  return (
    <div className="screen-wrap" style={{ alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <div className="notebook-bg" />
      <div className="notebook-margin" />

      {/* Glow */}
      <div style={{
        position: 'absolute', width: 220, height: 220, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,191,168,0.09) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      {/* Rings */}
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          position: 'absolute', borderRadius: '50%',
          border: '1px solid rgba(0,191,168,0.08)',
          animation: `sr 4s ease-out infinite ${i * 1.3}s`,
          top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        }} />
      ))}

      {/* Mascot */}
      <div style={{ zIndex: 2, marginBottom: 20 }}>
        <Mascot size="md" />
      </div>

      {/* Wordmark */}
      <div className="wm" style={{ fontSize: 30, zIndex: 2, marginBottom: 4 }}>
        <span className="wm-a">Max</span><span className="wm-b">Bot</span>
      </div>

      {/* Tagline */}
      <div style={{ fontSize: 8, color: 'var(--ink3)', letterSpacing: 2, textTransform: 'uppercase', zIndex: 2, marginBottom: 28 }}>
        Robotics · STEAM · AI
      </div>

      {/* Dots */}
      <div style={{ display: 'flex', gap: 5, zIndex: 2 }}>
        <div className="nd on" />
        <div className="nd" />
        <div className="nd" />
        <div className="nd" />
      </div>

      {/* Loader */}
      <div style={{ position: 'absolute', bottom: 28, zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 100, height: 2, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, var(--teal), var(--teal-d))',
            borderRadius: 2,
            animation: 'lf 2.6s ease-out forwards',
            boxShadow: '0 0 6px var(--teal)',
          }} />
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: 'var(--bg3)', letterSpacing: 0.5 }}>
          initializing...
        </div>
      </div>
    </div>
  );
}
