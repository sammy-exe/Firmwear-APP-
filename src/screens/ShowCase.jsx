import ThemeToggle from '../components/ThemeToggle';
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSavedIP, getToken, getServerIP } from '../utils/security';
import { addKnowledgeEntry, getSavedPdfs, savePdf, deleteSavedPdf, deleteKnowledgeBySource } from '../utils/storage';
import { resizeForDisplay } from '../utils/resizeImage';

const SERVER_PORT = '8000';

export default function ShowCase() {
  const navigate = useNavigate();
  const [items,          setItems]          = useState([]);
  const [pdfs,           setPdfs]           = useState([]);
  const [playing,        setPlaying]        = useState(false);
  const [uploading,      setUploading]      = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error,          setError]          = useState('');
  const fileRef = useRef(null);
  const pdfRef  = useRef(null);

  useEffect(() => { loadItems(); loadPdfs(); }, []);

  async function loadPdfs() {
    const saved = await getSavedPdfs();
    setPdfs(saved.map(p => ({
      name: p.name,
      size: p.size,
      base64: p.base64,
      file: base64ToFile(p.base64, p.name),
    })));
  }

  function base64ToFile(base64, name) {
    const arr = base64.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], name, { type: mime });
  }

  async function loadItems() {
    const ip = await getSavedIP();
    if (!ip) return;
    try {
      const res = await fetch(`http://${ip}/showcase/list`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        setItems(data.files || []);
        setPlaying(data.playing || false);
      }
    } catch {}
  }


  async function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp'];
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
        setError(`${file.name} — unsupported format. Only JPG, PNG, BMP allowed.`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError(`${file.name} exceeds 5MB limit.`);
        return;
      }
    }

    setError('');
    setUploading(true);
    setUploadProgress(0);

    const ip    = await getSavedIP();
    const token = await getToken();

    for (let i = 0; i < files.length; i++) {
      const file     = files[i];
      const formData = new FormData();
      formData.append('file', file);

      try {
        await fetch(`http://${ip}/showcase/upload`, {
          method:  'POST',
          headers: { 'X-Max-Token': token || '' },
          body:    formData,
          signal:  AbortSignal.timeout(30000),
        });
      } catch {}

      const newItem = {
        name: file.name,
        type: 'image',
        size: file.size,
        url:  URL.createObjectURL(file),
      };
      setItems(prev => [...prev, newItem]);
      setUploadProgress(Math.round(((i + 1) / files.length) * 100));

      // Analyze after upload — non-blocking
    }

    setUploading(false);
    e.target.value = '';
  }

  async function handlePdfSelect(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    for (const file of files) {
      if (file.type !== 'application/pdf') { setError(`${file.name} is not a PDF.`); return; }
      if (file.size > 20 * 1024 * 1024)   { setError(`${file.name} exceeds 20MB.`); return; }
    }
    setError('');
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = async ev => {
        const base64 = ev.target.result;
        await savePdf(file.name, file.size, base64);
        setPdfs(prev => [...prev, { name: file.name, size: file.size, base64, file }]);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  }

  async function removePdf(idx) {
    const pdf = pdfs[idx];
    await deleteSavedPdf(pdf.name);
    await deleteKnowledgeBySource(pdf.name);
    setPdfs(prev => prev.filter((_, i) => i !== idx));
  }

  // ── PDF: send to server → AI generates Q&A → save to DataStore
  async function openPdfInAI(pdf) {
    const serverIP = await getServerIP();
    if (!serverIP) { setError('No server IP saved. Enter it in settings.'); return; }

    const formData = new FormData();
    formData.append('file', pdf.file, pdf.name);

    try {
      const res = await fetch(`http://${serverIP}:${SERVER_PORT}/pdf-analyze`, {
        method: 'POST',
        body:   formData,
        signal: AbortSignal.timeout(90000),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const pairs = data.entries || data.pairs || [];
      for (const pair of pairs) {
        await addKnowledgeEntry({
          tag:       'PDF',
          question:  pair.question,
          answer:    pair.answer,
          pdfSource: pdf.name,
          verified:  false,
        });
      }
      navigate('/maxdesk/ai');
    } catch (e) {
      setError(`PDF analyze failed: ${e.message}`);
    }
  }

  async function removeItem(idx) {
    const item  = items[idx];
    const ip    = await getSavedIP();
    const token = await getToken();
    try {
      await fetch(`http://${ip}/showcase/delete`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'X-Max-Token': token || '' },
        body:    JSON.stringify({ name: item.name }),
        signal:  AbortSignal.timeout(3000),
      });
    } catch {}
    setItems(prev => prev.filter((_, i) => i !== idx));
  }

  async function togglePlay() {
    const ip    = await getSavedIP();
    const token = await getToken();
    const next  = !playing;
    setPlaying(next);
    try {
      await fetch(`http://${ip}/showcase/${next ? 'start' : 'stop'}`, {
        method:  'POST',
        headers: { 'X-Max-Token': token || '' },
        signal:  AbortSignal.timeout(3000),
      });
    } catch {}
  }

  function formatSize(bytes) {
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  return (
    <div className="screen-wrap">
      <div className="notebook-bg" />
      <div className="notebook-margin" />

      <div className="top-nav">
        <div className="nav-left">
          <div className="nav-back" onClick={() => navigate('/maxdesk')}>←</div>
          <div className="nav-title">ShowCase</div>
          <ThemeToggle />
        </div>
        <div
          onClick={items.length > 0 ? togglePlay : undefined}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, background: playing ? 'rgba(231,76,60,0.1)' : 'var(--teal-l)', border: playing ? '1.5px solid rgba(231,76,60,0.4)' : '1.5px solid rgba(0,191,168,0.35)', color: playing ? 'var(--danger)' : 'var(--teal-d)', fontFamily: "'Space Grotesk', sans-serif", fontSize: 9, fontWeight: 700, cursor: items.length > 0 ? 'pointer' : 'not-allowed', opacity: items.length > 0 ? 1 : 0.4, transition: 'all 0.2s' }}
        >
          {playing ? '⏹ Stop Loop' : '▶ Start Loop'}
        </div>
      </div>

      {playing && (
        <div style={{ margin: '8px 13px 0', padding: '8px 12px', background: 'var(--teal-l)', border: '1px solid rgba(0,191,168,0.3)', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', gap: 6, position: 'relative', zIndex: 2, flexShrink: 0 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--teal)', animation: 'ab 1.5s infinite' }} />
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--teal-d)' }}>Looping {items.length} image{items.length !== 1 ? 's' : ''} on bot screen</div>
        </div>
      )}

      <div className="scroll-body" style={{ padding: '0 13px 16px', gap: 0 }}>

        {/* ── IMAGES ── */}
        <div className="sec-lbl" style={{ marginTop: 10 }}>Images · Bot Display Loop</div>

        <input ref={fileRef} type="file" multiple accept="image/jpeg,image/jpg,image/png,image/bmp" onChange={handleFileSelect} style={{ display: 'none' }} />
        <div onClick={() => fileRef.current?.click()} style={{ border: '1.5px dashed var(--line)', borderRadius: 'var(--r)', padding: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', background: 'rgba(0,191,168,0.02)', marginBottom: 8 }}>
          {uploading ? (
            <>
              <div style={{ width: '100%', height: 3, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'var(--teal)', borderRadius: 2, transition: 'width 0.3s' }} />
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--teal-d)' }}>Uploading... {uploadProgress}%</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 22 }}>📁</div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 700, color: 'var(--ink)' }}>Add Images</div>
              <div style={{ fontSize: 9, color: 'var(--ink3)' }}>JPG, PNG, BMP · Max 5MB · Auto-analyzed for AI context</div>
            </>
          )}
        </div>

        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '10px 0 16px', color: 'var(--ink3)', fontSize: 10 }}>No images yet</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
            {items.map((item, idx) => (
              <div key={idx} style={{ background: 'var(--white)', borderRadius: 'var(--r-sm)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px' }}>
                <div style={{ width: 42, height: 42, borderRadius: 8, flexShrink: 0, background: 'var(--teal-l)', border: '1px solid rgba(0,191,168,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🖼</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                  <div style={{ fontSize: 8, color: 'var(--ink3)', marginTop: 2, display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ background: 'var(--teal-l)', color: 'var(--teal-d)', padding: '1px 5px', borderRadius: 8, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 7 }}>🖼 IMG</span>
                    {item.size && <span>{formatSize(item.size)}</span>}
                  </div>
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: 'var(--ink3)', flexShrink: 0 }}>#{idx + 1}</div>
                <div onClick={() => removeItem(idx)} style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid rgba(231,76,60,.2)', background: 'rgba(231,76,60,.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, cursor: 'pointer', flexShrink: 0 }}>🗑</div>
              </div>
            ))}
          </div>
        )}

        {/* ── PDFs ── */}
        <div className="sec-lbl" style={{ marginTop: 10 }}>PDFs · Send to AI Mode</div>

        <input ref={pdfRef} type="file" multiple accept="application/pdf" onChange={handlePdfSelect} style={{ display: 'none' }} />
        <div onClick={() => pdfRef.current?.click()} style={{ border: '1.5px dashed rgba(240,92,42,0.35)', borderRadius: 'var(--r)', padding: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', background: 'rgba(240,92,42,0.02)', marginBottom: 8 }}>
          <div style={{ fontSize: 22 }}>📄</div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 700, color: 'var(--ink)' }}>Add PDFs</div>
          <div style={{ fontSize: 9, color: 'var(--ink3)' }}>PDF only · Max 20MB · Tap "Ask AI" to analyze and save</div>
        </div>

        {pdfs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '10px 0 16px', color: 'var(--ink3)', fontSize: 10 }}>No PDFs added yet</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
            {pdfs.map((pdf, idx) => (
              <div key={idx} style={{ background: 'var(--white)', borderRadius: 'var(--r-sm)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px' }}>
                <div style={{ width: 42, height: 42, borderRadius: 8, flexShrink: 0, background: 'rgba(240,92,42,0.08)', border: '1px solid rgba(240,92,42,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📄</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pdf.name}</div>
                  <div style={{ fontSize: 8, color: 'var(--ink3)', marginTop: 2, display: 'flex', gap: 6 }}>
                    <span style={{ background: 'rgba(240,92,42,0.1)', color: '#f05c2a', padding: '1px 5px', borderRadius: 8, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 7 }}>PDF</span>
                    <span>{formatSize(pdf.size)}</span>
                  </div>
                </div>
                <div onClick={() => openPdfInAI(pdf)} style={{ padding: '5px 10px', borderRadius: 8, background: 'var(--ink)', color: 'var(--teal)', fontFamily: "'Space Grotesk', sans-serif", fontSize: 9, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>Ask AI →</div>
                <div onClick={() => removePdf(idx)} style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid rgba(231,76,60,.2)', background: 'rgba(231,76,60,.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, cursor: 'pointer', flexShrink: 0 }}>🗑</div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div style={{ padding: '7px 10px', borderRadius: 'var(--r-sm)', fontSize: 9, fontFamily: "'DM Mono', monospace", background: 'rgba(231,76,60,.08)', color: 'var(--danger)', border: '1px solid rgba(231,76,60,.2)' }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
