import ThemeToggle from '../components/ThemeToggle';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSavedIP, getToken, getServerIP } from '../utils/security';
import { getKnowledgeContext } from '../utils/storage';

const SERVER_PORT  = '8000';
const MIC_DURATION_S = 6;

const STATUS = {
  IDLE:     'idle',
  CONTEXT:  'context',
  ACTIVATE: 'activate',
  LISTEN:   'listen',
  DONE:     'done',
  ERROR:    'error',
};

const STATUS_LABEL = {
  [STATUS.IDLE]:     'Tap to activate bot mic',
  [STATUS.CONTEXT]:  'Sending knowledge to server...',
  [STATUS.ACTIVATE]: 'Waking up bot mic...',
  [STATUS.LISTEN]:   'Bot is listening',
  [STATUS.DONE]:     'Done — answer on bot screen',
  [STATUS.ERROR]:    '',
};

export default function AIAssistant() {
  const navigate  = useNavigate();
  const [status,    setStatus]    = useState(STATUS.IDLE);
  const [error,     setError]     = useState('');
  const [countdown, setCountdown] = useState(MIC_DURATION_S);

  useEffect(() => {
    if (status !== STATUS.LISTEN) return;
    setCountdown(MIC_DURATION_S);
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(interval);
          setStatus(STATUS.DONE);
          setTimeout(() => setStatus(STATUS.IDLE), 2500);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  async function handleActivate() {
    if (status !== STATUS.IDLE) return;
    setError('');

    try {
      const ip       = await getSavedIP();
      const token    = await getToken();
      const serverIP = await getServerIP();
      if (!ip)       throw new Error('No device connected');
      if (!serverIP) throw new Error('No server IP saved. Enter it in settings.');

      // 1 — push knowledge context to server
      setStatus(STATUS.CONTEXT);
      const context = await getKnowledgeContext();
      const ctxRes = await fetch(`http://${serverIP}:${SERVER_PORT}/maxdesk/context`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ context }),
        signal:  AbortSignal.timeout(8000),
      });
      if (!ctxRes.ok) throw new Error('Server did not accept context');

      // 2 — tell ESP32 to activate mic
      setStatus(STATUS.ACTIVATE);
      const micRes = await fetch(`http://${ip}/mic/start`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Max-Token':  token || '',
        },
        body: JSON.stringify({
          server:   `${serverIP}:${SERVER_PORT}`,
          duration: MIC_DURATION_S,
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (!micRes.ok) throw new Error('Bot did not respond to mic start');

      // 3 — countdown while ESP32 records
      setStatus(STATUS.LISTEN);

    } catch (e) {
      setStatus(STATUS.ERROR);
      setError(e.message);
      setTimeout(() => { setStatus(STATUS.IDLE); setError(''); }, 3500);
    }
  }

  const isActive = status === STATUS.LISTEN;
  const isBusy   = status !== STATUS.IDLE && status !== STATUS.ERROR;

  const ringColor = {
    [STATUS.IDLE]:     'var(--teal)',
    [STATUS.CONTEXT]:  '#f0a500',
    [STATUS.ACTIVATE]: '#f0a500',
    [STATUS.LISTEN]:   '#e74c3c',
    [STATUS.DONE]:     '#2ecc71',
    [STATUS.ERROR]:    '#e74c3c',
  }[status];

  return (
    <div className="screen-wrap">
      <div className="notebook-bg" />
      <div className="notebook-margin" />

      <div className="top-nav">
        <div className="nav-left">
          <div className="nav-back" onClick={() => navigate('/maxdesk')}>←</div>
          <div className="nav-title">AI Assistant</div>
        </div>
        <ThemeToggle />
      </div>

      <div style={{ margin: '12px 13px 0', background: 'var(--white)', borderRadius: 'var(--r)', padding: '12px 14px', border: '1px solid var(--line)', position: 'relative', zIndex: 2, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, background: 'var(--teal-l)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🎙️</div>
          <div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 700, color: 'var(--ink)' }}>Bot Mic Mode</div>
            <div style={{ fontSize: 9, color: 'var(--ink3)' }}>Bot listens · AI answers · captions shown on screen</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 13px', position: 'relative', zIndex: 2, gap: 20 }}>

        <div
          onClick={handleActivate}
          style={{
            width: 110, height: 110, borderRadius: '50%',
            background: isActive ? 'rgba(231,76,60,0.12)' : isBusy ? 'rgba(240,165,0,0.10)' : 'var(--teal-l)',
            border: `3px solid ${ringColor}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 44,
            cursor: isBusy ? 'default' : 'pointer',
            boxShadow: isActive ? '0 0 28px rgba(231,76,60,0.3)' : isBusy ? '0 0 20px rgba(240,165,0,0.2)' : '0 0 16px rgba(0,191,168,0.15)',
            transition: 'all 0.3s ease',
            userSelect: 'none',
          }}
        >
          {status === STATUS.DONE ? '✓' : '🎙️'}
        </div>

        {isActive && (
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            border: '2.5px solid rgba(231,76,60,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'DM Mono', monospace",
            fontSize: 20, fontWeight: 700, color: '#e74c3c',
          }}>
            {countdown}
          </div>
        )}

        <div style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 12, fontWeight: 700,
          color: isActive ? '#e74c3c' : status === STATUS.DONE ? '#2ecc71' : 'var(--ink3)',
          letterSpacing: 0.5,
          textAlign: 'center',
        }}>
          {STATUS_LABEL[status]}
        </div>

        {(status === STATUS.CONTEXT || status === STATUS.ACTIVATE) && (
          <div style={{ width: 14, height: 14, border: '2px solid var(--line)', borderTopColor: '#f0a500', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        )}

        {error && (
          <div style={{ padding: '8px 14px', borderRadius: 10, background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.2)', color: 'var(--danger)', fontSize: 10, fontFamily: "'DM Mono', monospace", textAlign: 'center' }}>
            {error}
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', padding: '0 13px 16px', position: 'relative', zIndex: 2, flexShrink: 0 }}>
        <div style={{ fontSize: 8, color: 'var(--ink3)', lineHeight: 1.8 }}>
          Bot mic · {MIC_DURATION_S}s recording · answer shown on CrowPanel display
        </div>
      </div>
    </div>
  );
}
