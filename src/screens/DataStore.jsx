import ThemeToggle from '../components/ThemeToggle';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getKnowledge, addKnowledgeEntry, updateKnowledgeEntry, deleteKnowledgeEntry,
  getHistory, clearHistory
} from '../utils/storage';

const TAGS = ['FAQ', 'Info', 'PDF', 'Image', 'Custom'];

export default function DataStore() {
  const navigate = useNavigate();
  const [tab,       setTab]       = useState('knowledge');
  const [entries,   setEntries]   = useState([]);
  const [history,   setHistory]   = useState([]);
  const [editEntry, setEditEntry] = useState(null);

  useEffect(() => { load(); }, [tab]);

  async function load() {
    if (tab === 'knowledge') setEntries(await getKnowledge());
    else setHistory(await getHistory());
  }

  async function handleDelete(id) {
    await deleteKnowledgeEntry(id);
    setEntries(e => e.filter(x => x.id !== id));
  }

  async function handleSave(data) {
    if (data.id) {
      await updateKnowledgeEntry(data.id, { ...data, verified: true });
    } else {
      await addKnowledgeEntry({ ...data, verified: true });
    }
    setEditEntry(null);
    setEntries(await getKnowledge());
  }

  async function handleClearHistory() {
    await clearHistory();
    setHistory([]);
  }

  function formatDate(iso) {
    const d = new Date(iso);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    return isToday
      ? `Today ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`
      : `${d.toLocaleDateString()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
  }

  if (editEntry !== null) {
    return <EditEntry entry={editEntry === 'new' ? null : editEntry} onSave={handleSave} onBack={() => setEditEntry(null)} />;
  }

  return (
    <div className="screen-wrap">
      <div className="notebook-bg" />
      <div className="notebook-margin" />

      <div className="top-nav">
        <div className="nav-left">
          <div className="nav-back" onClick={() => navigate(-1)}>←</div>
          <div className="nav-title">Data Store</div>
        </div>
        <ThemeToggle />
      </div>

      <div style={{ display: 'flex', margin: '8px 13px 0', background: 'var(--bg2)', borderRadius: 10, padding: 3, flexShrink: 0, position: 'relative', zIndex: 2 }}>
        {['knowledge', 'history'].map(t => (
          <div key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '6px 0', borderRadius: 7, fontSize: 9, fontWeight: 700, textAlign: 'center', fontFamily: "'Space Grotesk', sans-serif", cursor: 'pointer', background: tab === t ? 'var(--ink)' : 'transparent', color: tab === t ? 'var(--teal)' : 'var(--ink3)', transition: 'all 0.2s' }}>
            {t === 'knowledge' ? 'Knowledge' : 'Chat History'}
          </div>
        ))}
      </div>

      <div style={{ padding: '6px 14px 0', fontSize: 7, color: 'var(--ink3)', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: 0.8, textTransform: 'uppercase', flexShrink: 0, position: 'relative', zIndex: 2 }}>
        {tab === 'knowledge' ? `${entries.length} entries · sent as AI context` : `${history.length} sessions`}
      </div>

      <div className="scroll-body" style={{ padding: '8px 13px 10px' }}>
        {tab === 'knowledge' && (
          <>
            <div onClick={() => setEditEntry('new')} style={{ padding: '9px 0', background: 'var(--ink)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, cursor: 'pointer', marginBottom: 10 }}>
              <span style={{ fontSize: 12 }}>+</span>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 9, fontWeight: 700, color: 'var(--teal)' }}>Add Manual Entry</span>
            </div>

            <div style={{ padding: '7px 10px', borderRadius: 8, marginBottom: 10, background: 'rgba(0,191,168,0.06)', border: '1px solid rgba(0,191,168,0.2)', fontSize: 9, color: 'var(--teal-d)', fontFamily: "'Space Grotesk', sans-serif" }}>
              💡 Images and PDFs are added automatically from ShowCase → tap entries below to review and correct
            </div>

            {entries.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--ink3)', fontSize: 11 }}>No entries yet — add via ShowCase or manually.</div>
            )}

            {entries.map(entry => (
              <div key={entry.id} style={{ background: 'var(--white)', border: `1px solid ${entry.verified ? 'var(--line)' : 'rgba(240,92,42,0.3)'}`, borderRadius: 10, padding: '8px 10px', marginBottom: 7 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                  <span style={{ display: 'inline-block', fontSize: 6, fontWeight: 700, padding: '1px 6px', borderRadius: 8, fontFamily: "'Space Grotesk', sans-serif", background: entry.tag === 'PDF' ? 'rgba(240,92,42,0.08)' : entry.tag === 'Image' ? 'var(--teal-l)' : 'var(--bg2)', color: entry.tag === 'PDF' ? '#c94a1e' : entry.tag === 'Image' ? 'var(--teal-d)' : 'var(--ink3)' }}>
                    {entry.tag}
                  </span>
                  {!entry.verified && (
                    <span style={{ fontSize: 6, color: '#f05c2a', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>● needs review</span>
                  )}
                  {entry.showcaseFile && (
                    <span style={{ fontSize: 6, color: 'var(--ink3)', fontFamily: "'DM Mono', monospace" }}>{entry.showcaseFile}</span>
                  )}
                </div>

                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--ink)', marginBottom: 3, fontFamily: "'Space Grotesk', sans-serif" }}>{entry.question}</div>
                <div style={{ fontSize: 8, color: 'var(--ink2)', lineHeight: 1.5 }}>{entry.answer || entry.aiInterpretation || '—'}</div>

                <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', marginTop: 6 }}>
                  <div onClick={() => setEditEntry(entry)} style={{ fontSize: 7, padding: '2px 7px', borderRadius: 6, border: '1px solid var(--line)', background: 'var(--bg2)', color: 'var(--ink2)', cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>
                    {entry.verified ? '✏️ Edit' : '✏️ Correct this'}
                  </div>
                  <div onClick={() => handleDelete(entry.id)} style={{ fontSize: 7, padding: '2px 7px', borderRadius: 6, border: '1px solid rgba(231,76,60,0.2)', background: 'rgba(231,76,60,0.05)', color: '#e74c3c', cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>🗑</div>
                </div>
              </div>
            ))}

            <div onClick={() => setEditEntry('new')} style={{ border: '1.5px dashed var(--line)', borderRadius: 10, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginTop: 4 }}>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 9, fontWeight: 700, color: 'var(--ink3)' }}>+ New Manual Entry</span>
            </div>
          </>
        )}

        {tab === 'history' && (
          <>
            {history.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--ink3)', fontSize: 11 }}>No history yet.</div>
            )}
            {history.map(session => (
              <div key={session.id} style={{ background: 'var(--white)', borderRadius: 10, border: '1px solid var(--line)', marginBottom: 7, overflow: 'hidden' }}>
                <div style={{ padding: '7px 10px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 8, fontWeight: 700, color: 'var(--ink)', fontFamily: "'Space Grotesk', sans-serif" }}>{formatDate(session.date)}</div>
                  <div style={{ fontSize: 7, color: 'var(--ink3)' }}>{session.messages.length} msgs</div>
                </div>
                <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {session.messages.slice(0, 3).map((msg, i) => (
                    <div key={i} style={{ display: 'flex', gap: 5 }}>
                      <div style={{ fontSize: 7, fontWeight: 700, color: msg.role === 'user' ? 'var(--teal-d)' : 'var(--pop)', width: 26, flexShrink: 0 }}>{msg.role === 'user' ? 'You' : 'Bot'}</div>
                      <div style={{ fontSize: 8, color: 'var(--ink2)', lineHeight: 1.4 }}>{msg.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {history.length > 0 && (
              <div onClick={handleClearHistory} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '10px', background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.2)', borderRadius: 10, cursor: 'pointer', marginTop: 4 }}>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 9, fontWeight: 700, color: '#e74c3c' }}>🗑 Clear All History</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EditEntry({ entry, onSave, onBack }) {
  const [question, setQuestion] = useState(entry?.question || '');
  const [answer,   setAnswer]   = useState(entry?.answer || entry?.aiInterpretation || '');
  const [tag,      setTag]      = useState(entry?.tag || 'FAQ');
  const [saving,   setSaving]   = useState(false);

  async function save() {
    if (!question.trim()) return;
    setSaving(true);
    await onSave({ id: entry?.id, question, answer, tag, aiInterpretation: answer, showcaseFile: entry?.showcaseFile || null });
    setSaving(false);
  }

  return (
    <div className="screen-wrap">
      <div className="notebook-bg" />
      <div className="notebook-margin" />

      <div className="top-nav">
        <div className="nav-left">
          <div className="nav-back" onClick={onBack}>←</div>
          <div className="nav-title">{entry ? 'Edit Entry' : 'New Entry'}</div>
        </div>
        <ThemeToggle />
      </div>

      <div className="scroll-body" style={{ padding: '12px 13px' }}>

        {entry?.showcaseFile && (
          <div style={{ padding: '8px 12px', borderRadius: 10, background: 'var(--teal-l)', border: '1px solid rgba(0,191,168,0.2)', marginBottom: 12, fontSize: 9, color: 'var(--teal-d)', fontFamily: "'DM Mono', monospace" }}>
            🖼 Linked to ShowCase file: {entry.showcaseFile}
          </div>
        )}

        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 8, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5, fontFamily: "'Space Grotesk', sans-serif" }}>Question / Topic</div>
          <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="e.g. What is MaxBot?" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--white)', color: 'var(--ink)', fontSize: 11, fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box' }} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 8, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5, fontFamily: "'Space Grotesk', sans-serif" }}>Answer / Description</div>
          <textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder="The answer, description, or context..." rows={5} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--white)', color: 'var(--ink)', fontSize: 11, fontFamily: "'DM Sans', sans-serif", resize: 'none', outline: 'none', boxSizing: 'border-box', lineHeight: 1.6 }} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 8, fontWeight: 700, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, fontFamily: "'Space Grotesk', sans-serif" }}>Tag</div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {TAGS.map(t => (
              <div key={t} onClick={() => setTag(t)} style={{ padding: '4px 10px', borderRadius: 20, fontSize: 8, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", cursor: 'pointer', background: tag === t ? 'var(--ink)' : 'var(--bg2)', color: tag === t ? 'var(--teal)' : 'var(--ink3)', border: tag === t ? 'none' : '1px solid var(--line)', transition: 'all 0.15s' }}>{t}</div>
            ))}
          </div>
        </div>

        <div onClick={!saving ? save : undefined} style={{ padding: '13px', background: question.trim() ? 'var(--ink)' : 'var(--bg3)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: question.trim() ? 'pointer' : 'not-allowed', opacity: saving ? 0.6 : 1 }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 700, color: question.trim() ? 'var(--teal)' : 'var(--ink3)' }}>{saving ? 'Saving...' : 'Save Entry →'}</span>
        </div>
      </div>
    </div>
  );
}
