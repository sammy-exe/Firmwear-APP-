import ThemeToggle from '../components/ThemeToggle';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateIP, saveIP, checkRateLimit } from '../utils/security';
import { pingRobot } from '../utils/wifi';

export default function IpEntry() {
  const navigate = useNavigate();
  const [ip,         setIp]         = useState('');
  const [status,     setStatus]     = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error,      setError]      = useState('');

  function handleChange(val) {
    setIp(val);
    setError('');
    if (!val) { setStatus(null); return; }
    setStatus(validateIP(val) ? 'valid' : 'invalid');
  }

  async function handleConnect() {
    if (!validateIP(ip)) return;
    try { checkRateLimit('ip_connect', 5, 60000); }
    catch (e) { setError(e.message); return; }

    setConnecting(true);
    setError('');
    try {
      await saveIP(ip.trim());
      await pingRobot(ip.trim()).catch(() => false);
      navigate('/home', { replace: true });
    } catch (e) {
      setError('Could not connect. Check the IP and try again.');
    } finally {
      setConnecting(false);
    }
  }

  return (
    <div className="screen-wrap">
      <div className="notebook-bg" />
      <div className="notebook-margin" />

      <div className="top-nav">
        <div className="nav-left">
          <div className="nav-back" onClick={() => navigate('/scanning')}>←</div>
          <div className="nav-title">Connect to Bot</div>
        </div>
        <div className="nav-skip" onClick={() => navigate('/home')}>Skip ›</div>
      </div>

      <div style={{
        margin: '14px 13px 0', background: 'var(--ink)', borderRadius: 'var(--r)',
        padding: '18px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 10, boxShadow: '0 4px 18px rgba(0,0,0,.16)',
        position: 'relative', zIndex: 2, flexShrink: 0, overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(transparent, transparent 4px, rgba(0,191,168,0.03) 4px, rgba(0,191,168,0.03) 5px)' }} />

        <div style={{
          width: 90, height: 56, background: '#081310', borderRadius: 8,
          border: '2px solid rgba(0,191,168,0.4)', position: 'relative', zIndex: 1,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
          boxShadow: '0 0 18px rgba(0,191,168,0.15)',
        }}>
          <div style={{ fontSize: 7, color: 'rgba(0,191,168,0.5)', letterSpacing: 1, fontFamily: "'DM Mono', monospace" }}>BOT SCREEN</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--teal)', textShadow: '0 0 8px var(--teal)', letterSpacing: 0.5 }}>
            192.168.1.47
            <span style={{ display: 'inline-block', width: 2, height: 10, background: 'var(--teal)', verticalAlign: 'middle', marginLeft: 2, animation: 'cur 1s step-end infinite' }} />
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
            👀 Look at your bot's screen!
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
            Your bot is showing a number on its screen.<br />Type that number below.
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: 20, color: 'var(--teal)', marginTop: 8, position: 'relative', zIndex: 2, flexShrink: 0 }}>↓</div>

      <div style={{
        margin: '0 13px', background: 'var(--white)', borderRadius: 'var(--r-sm)',
        border: `1.5px solid ${status === 'invalid' ? 'var(--danger)' : status === 'valid' ? 'var(--teal)' : 'var(--line)'}`,
        display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px',
        flexShrink: 0, position: 'relative', zIndex: 2, transition: 'border-color 0.2s',
      }}>
        <span style={{ fontSize: 13, flexShrink: 0 }}>🔢</span>
        <input
          type="text"
          placeholder="Type the number here..."
          value={ip}
          onChange={e => handleChange(e.target.value)}
          style={{
            flex: 1, border: 'none', outline: 'none',
            fontFamily: "'DM Mono', monospace", fontSize: 13, color: 'var(--ink)',
            padding: '13px 0', background: 'transparent', letterSpacing: 0.5,
          }}
        />
        {status === 'valid' && <span style={{ fontSize: 14, flexShrink: 0 }}>✅</span>}
      </div>

      {status === 'invalid' && (
        <div style={{ margin: '5px 13px 0', padding: '7px 10px', borderRadius: 'var(--r-sm)', fontSize: 9, fontFamily: "'DM Mono', monospace", background: 'rgba(231,76,60,.08)', color: 'var(--danger)', border: '1px solid rgba(231,76,60,.2)', flexShrink: 0, position: 'relative', zIndex: 2 }}>
          Hmm, that doesn't look right. Check the bot screen again!
        </div>
      )}
      {error && (
        <div style={{ margin: '5px 13px 0', padding: '7px 10px', borderRadius: 'var(--r-sm)', fontSize: 9, fontFamily: "'DM Mono', monospace", background: 'rgba(231,76,60,.08)', color: 'var(--danger)', border: '1px solid rgba(231,76,60,.2)', flexShrink: 0, position: 'relative', zIndex: 2 }}>
          {error}
        </div>
      )}

      <button className="btn-primary" style={{ margin: '10px 13px 0' }} disabled={status !== 'valid' || connecting} onClick={handleConnect}>
        {connecting ? 'Connecting...' : 'Connect to My Bot! →'}
      </button>
      <button className="btn-secondary" style={{ margin: '6px 13px 0' }} onClick={() => navigate('/scanning')}>
        ← Go Back
      </button>

      <div className="nav-dots" style={{ marginTop: 'auto' }}>
        <div className="nd" /><div className="nd" /><div className="nd on" /><div className="nd" />
      </div>

      {connecting && (
        <div className="conn-overlay">
          <div className="conn-spin" />
          <div className="conn-txt">Connecting to your bot...</div>
        </div>
      )}
    </div>
  );
}
