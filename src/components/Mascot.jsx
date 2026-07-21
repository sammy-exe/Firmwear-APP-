import React from 'react';

export default function Mascot({ size = 'md' }) {
  const scales = { xs: 0.36, sm: 0.52, md: 1, lg: 1.3 };
  const s = scales[size] || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `scale(${s})`, transformOrigin: 'center top' }}>
      {/* Head */}
      <div style={{
        width: 68, height: 56,
        background: 'var(--ink)',
        borderRadius: '16px 16px 11px 11px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
        boxShadow: '0 3px 14px rgba(0,0,0,0.22), 0 0 0 1.5px var(--bg3)',
      }}>
        {/* Antenna */}
        <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', width: 2.5, height: 11, background: 'var(--bg3)', borderRadius: 2 }}>
          <div style={{
            position: 'absolute', top: -6, left: -4,
            width: 10, height: 10, background: 'var(--teal)', borderRadius: '50%',
            boxShadow: '0 0 10px var(--teal), 0 0 3px var(--teal)',
            animation: 'ab 3s ease-in-out infinite',
          }} />
        </div>
        {/* Ears */}
        <div style={{ position: 'absolute', left: -8, top: 14, width: 8, height: 16, background: 'var(--ink)', borderRadius: '3px 0 0 3px', boxShadow: '0 0 0 1.5px var(--bg3)' }} />
        <div style={{ position: 'absolute', right: -8, top: 14, width: 8, height: 16, background: 'var(--ink)', borderRadius: '0 3px 3px 0', boxShadow: '0 0 0 1.5px var(--bg3)' }} />
        {/* Cheeks */}
        <div style={{ position: 'absolute', bottom: 8, left: 7, width: 9, height: 4, background: 'var(--pop)', borderRadius: 2, opacity: 0.65, animation: 'ck 4s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: 8, right: 7, width: 9, height: 4, background: 'var(--pop)', borderRadius: 2, opacity: 0.65, animation: 'ck 4s ease-in-out infinite' }} />
        {/* Visor */}
        <div style={{
          width: 50, height: 22,
          background: '#081310',
          borderRadius: 5,
          border: '1.5px solid rgba(0,191,168,0.28)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          overflow: 'hidden', position: 'relative',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,transparent,rgba(0,191,168,0.05),transparent)' }} />
          <div style={{ width: 11, height: 11, background: 'var(--teal)', borderRadius: 2, boxShadow: '0 0 8px var(--teal-g), 0 0 3px var(--teal)', animation: 'blink 5s ease-in-out infinite' }} />
          <div style={{ width: 11, height: 11, background: 'var(--teal)', borderRadius: 2, boxShadow: '0 0 8px var(--teal-g), 0 0 3px var(--teal)', animation: 'blink 5s ease-in-out infinite 0.18s' }} />
        </div>
      </div>

      {/* Neck */}
      <div style={{ width: 20, height: 7, background: 'var(--ink)', borderLeft: '1.5px solid var(--bg3)', borderRight: '1.5px solid var(--bg3)' }} />

      {/* Arms + Body */}
      <div style={{ position: 'relative', width: 88, display: 'flex', justifyContent: 'space-between', marginTop: 0, zIndex: -1 }}>
        <div style={{ width: 8, height: 28, background: 'var(--ink)', borderRadius: 4, marginTop: 9, boxShadow: '0 0 0 1.5px var(--bg3)' }} />
        <div style={{ width: 8, height: 28, background: 'var(--ink)', borderRadius: 4, marginTop: 9, boxShadow: '0 0 0 1.5px var(--bg3)' }} />
      </div>

      {/* Body */}
      <div style={{
        width: 72, height: 46,
        background: 'var(--ink)',
        borderRadius: '9px 9px 14px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', marginTop: -28,
        boxShadow: '0 5px 18px rgba(0,0,0,0.18), 0 0 0 1.5px var(--bg3)',
      }}>
        {/* Chest panel */}
        <div style={{
          width: 30, height: 14,
          background: 'rgba(0,191,168,0.08)',
          border: '1px solid rgba(0,191,168,0.2)',
          borderRadius: 4,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        }}>
          <div style={{ width: 4.5, height: 4.5, borderRadius: '50%', background: 'var(--teal)', boxShadow: '0 0 5px var(--teal)' }} />
          <div style={{ width: 4.5, height: 4.5, borderRadius: '50%', background: 'var(--pop)', boxShadow: '0 0 5px var(--pop)', animation: 'cd2 2.2s infinite' }} />
          <div style={{ width: 4.5, height: 4.5, borderRadius: '50%', background: 'var(--bg3)' }} />
        </div>
      </div>

      {/* Legs */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 11, marginTop: 4 }}>
        <div style={{ width: 15, height: 14, background: 'var(--ink)', borderRadius: '3px 3px 6px 6px', boxShadow: '0 0 0 1.5px var(--bg3)' }} />
        <div style={{ width: 15, height: 14, background: 'var(--ink)', borderRadius: '3px 3px 6px 6px', boxShadow: '0 0 0 1.5px var(--bg3)' }} />
      </div>
    </div>
  );
}

// Tiny mascot head only (for nav icons)
export function MascotHead({ size = 38 }) {
  return (
    <div style={{
      width: size, height: size,
      background: 'var(--ink)',
      borderRadius: 11,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative',
      boxShadow: '0 3px 10px rgba(0,0,0,0.18)',
    }}>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%) scale(0.36)' }}>
        <div style={{
          width: 68, height: 56,
          background: 'var(--ink)',
          borderRadius: '16px 16px 11px 11px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', width: 2.5, height: 11, background: 'var(--bg3)', borderRadius: 2 }}>
            <div style={{ position: 'absolute', top: -6, left: -4, width: 10, height: 10, background: 'var(--teal)', borderRadius: '50%', boxShadow: '0 0 10px var(--teal)', animation: 'ab 3s ease-in-out infinite' }} />
          </div>
          <div style={{ position: 'absolute', left: -8, top: 14, width: 8, height: 16, background: 'var(--ink)', borderRadius: '3px 0 0 3px', boxShadow: '0 0 0 1.5px var(--bg3)' }} />
          <div style={{ position: 'absolute', right: -8, top: 14, width: 8, height: 16, background: 'var(--ink)', borderRadius: '0 3px 3px 0', boxShadow: '0 0 0 1.5px var(--bg3)' }} />
          <div style={{
            width: 50, height: 22, background: '#081310', borderRadius: 5,
            border: '1.5px solid rgba(0,191,168,0.28)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          }}>
            <div style={{ width: 11, height: 11, background: 'var(--teal)', borderRadius: 2, boxShadow: '0 0 8px var(--teal-g)', animation: 'blink 5s ease-in-out infinite' }} />
            <div style={{ width: 11, height: 11, background: 'var(--teal)', borderRadius: 2, boxShadow: '0 0 8px var(--teal-g)', animation: 'blink 5s ease-in-out infinite 0.18s' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
