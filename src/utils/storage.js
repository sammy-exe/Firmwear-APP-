import { Preferences } from '@capacitor/preferences';

const KEYS = {
  KNOWLEDGE: 'mb_knowledge',
  HISTORY:   'mb_history',
};

export async function getKnowledge() {
  try {
    const { value } = await Preferences.get({ key: KEYS.KNOWLEDGE });
    return value ? JSON.parse(value) : [];
  } catch { return []; }
}

export async function saveKnowledge(entries) {
  try {
    await Preferences.set({ key: KEYS.KNOWLEDGE, value: JSON.stringify(entries) });
  } catch {}
}

export async function addKnowledgeEntry(entry) {
  const entries = await getKnowledge();
  const newEntry = {
    id:               Date.now().toString(),
    tag:              entry.tag              || 'Custom',
    question:         entry.question         || '',
    answer:           entry.answer           || '',
    aiInterpretation: entry.aiInterpretation || null,
    showcaseFile:     entry.showcaseFile     || null, // filename on ESP32 SPIFFS — no base64
    verified:         entry.verified         ?? true,
    createdAt:        new Date().toISOString(),
  };
  entries.push(newEntry);
  await saveKnowledge(entries);
  return newEntry;
}

export async function updateKnowledgeEntry(id, updates) {
  const entries = await getKnowledge();
  const idx = entries.findIndex(e => e.id === id);
  if (idx === -1) return;
  entries[idx] = { ...entries[idx], ...updates };
  await saveKnowledge(entries);
}

export async function deleteKnowledgeEntry(id) {
  const entries = await getKnowledge();
  await saveKnowledge(entries.filter(e => e.id !== id));
}

export async function getHistory() {
  try {
    const { value } = await Preferences.get({ key: KEYS.HISTORY });
    return value ? JSON.parse(value) : [];
  } catch { return []; }
}

export async function addHistorySession(session) {
  const history = await getHistory();
  history.unshift({
    id:       Date.now().toString(),
    date:     new Date().toISOString(),
    messages: session.messages || [],
  });
  await Preferences.set({ key: KEYS.HISTORY, value: JSON.stringify(history.slice(0, 50)) });
}

export async function clearHistory() {
  await Preferences.remove({ key: KEYS.HISTORY });
}

// ── Saved PDFs (persists across sessions) ──
const PDF_KEY = 'mb_pdfs';

export async function getSavedPdfs() {
  try {
    const { value } = await Preferences.get({ key: PDF_KEY });
    return value ? JSON.parse(value) : [];
  } catch { return []; }
}

export async function savePdf(name, size, base64) {
  const pdfs = await getSavedPdfs();
  if (pdfs.find(p => p.name === name)) return; // no duplicates
  pdfs.push({ name, size, base64, savedAt: new Date().toISOString() });
  await Preferences.set({ key: PDF_KEY, value: JSON.stringify(pdfs) });
}

export async function deleteKnowledgeBySource(filename) {
  const entries = await getKnowledge();
  await saveKnowledge(entries.filter(e => e.pdfSource !== filename));
}

export async function deleteSavedPdf(name) {
  const pdfs = await getSavedPdfs();
  await Preferences.set({ key: PDF_KEY, value: JSON.stringify(pdfs.filter(p => p.name !== name)) });
}

export async function getKnowledgeContext() {
  const entries = await getKnowledge();
  if (!entries.length) return '';
  return entries.map(e => {
    let ctx = '';
    if (e.question) ctx += `Q: ${e.question}\nA: ${e.answer}`;
    if (e.aiInterpretation) ctx += `${ctx ? '\n' : ''}Image context (${e.showcaseFile || 'image'}): ${e.aiInterpretation}`;
    return ctx;
  }).filter(Boolean).join('\n\n');
}
