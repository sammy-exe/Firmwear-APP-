import React, { useState } from 'react';
import ThemeToggle from '../components/ThemeToggle';
import { useNavigate } from 'react-router-dom';

function ModeCard({ emoji, label, desc, color, tag, onPress, pressed }) {
  return (
    <div
      onClick={onPress}
      style={{
        flex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 8, padding: '20px 10px 16px',
        justifyContent: 'center',
        background: 'var(--white)',
        borderRadius: 20,
        boxShadow: pressed
          ? `0 2px 8px ${color}33, 0 0 0 2px ${color}`
          : '0 4px 16px rgba(0,0,0,0.08), 0 0 0 1px var(--line)',
        cursor: 'pointer',
        transform: pressed ? 'scale(0.93)' : 'scale(1)',
        transition: 'all 0.13s ease',
        position: 'relative',
      }}
    >
      {tag && (
        <div style={{
          position: 'absolute', top: 10, right: 10,
          fontSize: 7, fontWeight: 700, padding: '2px 6px', borderRadius: 20,
          background: `${color}18`, color, border: `1px solid ${color}30`,
          fontFamily: "'Space Grotesk', sans-serif",
        }}>{tag}</div>
      )}
      <div style={{
        width: 64, height: 64, borderRadius: 18,
        background: `${color}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 30,
        border: `1.5px solid ${color}25`,
      }}>{emoji}</div>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color: 'var(--ink)', textAlign: 'center' }}>{label}</div>
      <div style={{ fontSize: 9, color: 'var(--ink3)', textAlign: 'center', lineHeight: 1.6 }}>{desc}</div>
    </div>
  );
}

export default function MaxBot() {
  const navigate = useNavigate();
  const [pressed, setPressed] = useState(null);

  function handlePress(mode) {
    setPressed(mode);
    setTimeout(() => { setPressed(null); navigate(`/maxbot/${mode}`); }, 150);
  }

  return (
    <div className="screen-wrap">
      <div className="notebook-bg" />
      <div className="notebook-margin" />

      {/* Header */}
      <div className="top-nav">
        <div className="nav-left">
          <div className="nav-back" onClick={() => navigate('/home')}>←</div>
          <div className="nav-title">MaxBot</div>
        </div>
        <ThemeToggle />
      </div>

      {/* Section label */}
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 9, fontWeight: 700, color: 'var(--ink3)', padding: '16px 14px 10px', letterSpacing: 1, textTransform: 'uppercase', position: 'relative', zIndex: 2, flexShrink: 0 }}>
        Choose a Mode
      </div>

      {/* Mode grid */}
      <div style={{ display: 'flex', gap: 10, padding: '0 13px', position: 'relative', zIndex: 2, flex: 1, alignItems: 'center' }}>
        <ModeCard
          emoji="🚗" label="Car Mode" desc="Drive your bot with controls"
          color="#00bfa8" tag="+ Drift"
          pressed={pressed === 'car'}
          onPress={() => handlePress('car')}
        />
        <ModeCard
          emoji="🧍" label="Follow Me" desc="Bot follows you around"
          color="#f05c2a"
          pressed={pressed === 'follow'}
          onPress={() => handlePress('follow')}
        />
      </div>
    </div>
  );
}
