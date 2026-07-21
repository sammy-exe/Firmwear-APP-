import ThemeToggle from '../components/ThemeToggle';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateIP, saveIP, saveServerIP, checkRateLimit } from '../utils/security';
import { pingRobot } from '../utils/wifi';

export default function IpEntry() {
  const navigate = useNavigate();

  const [ip,           setIp]           = useState('');
  const [serverIp,     setServerIp]     = useState('');
  const [ipStatus,     setIpStatus]     = useState(null);
  const [serverStatus, setServerStatus] = useState(null);
  const [connecting,   setConnecting]   = useState(false);
  const [error,        setError]        = useState('');

  function handleIpChange(val) {
    setIp(val);
    setError('');
    if (!val) { setIpStatus(null); return; }
    setIpStatus(validateIP(val) ? 'valid' : 'invalid');
  }

  function handleServerChange(val) {
    setServerIp(val);
    setError('');
    if (!val) { setServerStatus(null); return; }
    setServerStatus(validateIP(val) ? 'valid' : 'invalid');
  }

  const canConnect = ipStatus === 'valid' && serverStatus === 'valid' && !connecting;

  async function handleConnect() {
    if (!canConnect) return;
    try { checkRateLimit('ip_connect', 5, 60000); }
    catch (e) { setError(e.message); return; }

    setConnecting(true);
    setError('');
    try {
      await saveIP(ip.trim());
      await saveServerIP(serverIp.trim());
      await pingRobot(ip.trim()).catch(() => false);
      navigate('/home', { replace: true });
    } catch (e) {
      setError('Could not connect. Check the IPs and try again.');
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

      {/* Instruction card */}
      <div style={{
        margin: '14px 13px 0', background: 'var(--ink)', borderRadius: 'var(--r)',
        padding: '18px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 10, boxShadow: '0 4px 18px rgba(0,0,0,.16)',
        position: 'relative', zIndex: 2, flexShrink: 0, overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(transparent, transparent 4px, rgba(0,191,168,0.03) 4px, rgba(0,191,168,0.03) 5px)' }} />

        {/* Bot screen illustration */}
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
            Enter the IP shown on your bot, then your server IP.
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: 20, color: 'var(--teal)', marginTop: 8, position: 'relative', zIndex: 2, flexShrink: 0 }}>↓</div>

      {/* Bot IP input */}
      <div style={{ margin: '0 13px 4px', flexShrink: 0, position: 'relative', zIndex: 2 }}>
        <div style={{ fontSize: 8, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: "'Space Grotesk', sans-serif", marginBottom: 5 }}>
          Bot IP (from screen)
        </div>
        <div style={{
          background: 'var(--white)', borderRadius: 'var(--r-sm)',
          border: `1.5px solid ${ipStatus === 'invalid' ? 'var(--danger)' : ipStatus === 'valid' ? 'var(--teal)' : 'var(--line)'}`,
          display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', transition: 'border-color 0.2s',
        }}>
          <span style={{ fontSize: 13, flexShrink: 0 }}>🤖</span>
          <input
            type="text"
            placeholder="e.g. 192.168.1.47"
            value={ip}
            onChange={e => handleIpChange(e.target.value)}
            style={{ flex: 1, border: 'none', outline: 'none', fontFamily: "'DM Mono', monospace", fontSize: 13, color: 'var(--ink)', padding: '13px 0', background: 'transparent', letterSpacing: 0.5 }}
          />
          {ipStatus === 'valid' && <span style={{ fontSize: 14, flexShrink: 0 }}>✅</span>}
        </div>
        {ipStatus === 'invalid' && (
          <div style={{ marginTop: 4, padding: '6px 10px', borderRadius: 'var(--r-sm)', fontSize: 9, fontFamily: "'DM Mono', monospace", background: 'rgba(231,76,60,.08)', color: 'var(--danger)', border: '1px solid rgba(231,76,60,.2)' }}>
            Doesn't look right. Check the bot screen again!
          </div>
        )}
      </div>

      {/* Server IP input */}
      <div style={{ margin: '8px 13px 0', flexShrink: 0, position: 'relative', zIndex: 2 }}>
        <div style={{ fontSize: 8, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: "'Space Grotesk', sans-serif", marginBottom: 5 }}>
          Server IP (your PC on this WiFi)
        </div>
        <div style={{
          background: 'var(--white)', borderRadius: 'var(--r-sm)',
          border: `1.5px solid ${serverStatus === 'invalid' ? 'var(--danger)' : serverStatus === 'valid' ? 'var(--teal)' : 'var(--line)'}`,
          display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', transition: 'border-color 0.2s',
        }}>
          <span style={{ fontSize: 13, flexShrink: 0 }}>🖥️</span>
          <input
            type="text"
            placeholder="e.g. 192.168.1.12"
            value={serverIp}
            onChange={e => handleServerChange(e.target.value)}
            style={{ flex: 1, border: 'none', outline: 'none', fontFamily: "'DM Mono', monospace", fontSize: 13, color: 'var(--ink)', padding: '13px 0', background: 'transparent', letterSpacing: 0.5 }}
          />
          {serverStatus === 'valid' && <span style={{ fontSize: 14, flexShrink: 0 }}>✅</span>}
        </div>
        {serverStatus === 'invalid' && (
          <div style={{ marginTop: 4, padding: '6px 10px', borderRadius: 'var(--r-sm)', fontSize: 9, fontFamily: "'DM Mono', monospace", background: 'rgba(231,76,60,.08)', color: 'var(--danger)', border: '1px solid rgba(231,76,60,.2)' }}>
            Doesn't look right. Check your PC's IP address.
          </div>
        )}
        <div style={{ marginTop: 5, fontSize: 8, color: 'var(--ink3)', fontFamily: "'DM Mono', monospace" }}>
          Run <span style={{ color: 'var(--teal)' }}>ipconfig</span> on your PC to find this
        </div>
      </div>

      {error && (
        <div style={{ margin: '6px 13px 0', padding: '7px 10px', borderRadius: 'var(--r-sm)', fontSize: 9, fontFamily: "'DM Mono', monospace", background: 'rgba(231,76,60,.08)', color: 'var(--danger)', border: '1px solid rgba(231,76,60,.2)', flexShrink: 0, position: 'relative', zIndex: 2 }}>
          {error}
        </div>
      )}

      <button className="btn-primary" style={{ margin: '12px 13px 0' }} disabled={!canConnect} onClick={handleConnect}>
        {connecting ? 'Connecting...' : 'Connect →'}
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
