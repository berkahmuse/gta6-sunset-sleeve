// Sunset Sleeve editor wiring: local photo library, panel assignment,
// drag / zoom per panel, live preview, PNG export. Nothing leaves the device.
import { drawCover, panelAt, LAYOUTS } from './cover.js';
import { parseShot, SIZES } from './shots.js';

const canvas = document.getElementById('cover');
const els = {
  files: document.getElementById('files'), thumbs: document.getElementById('thumbs'),
  panelSel: document.getElementById('panelSel'), zoom: document.getElementById('zoom'),
  caption: document.getElementById('caption'), subtitle: document.getElementById('subtitle'),
  layout: document.getElementById('layout'), grade: document.getElementById('grade'),
  size: document.getElementById('size'), status: document.getElementById('status'),
};

export function loadImage(url) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
}

const SAMPLES = ['samples/boulevard.jpg', 'samples/neon-night.jpg', 'samples/pier.jpg', 'samples/highway-sunset.jpg'];
const library = []; // {img, url, name}
const state = {
  caption: els.caption.value, subtitle: els.subtitle.value,
  layout: 'trio', grade: 'neon', selected: 0, showSelection: true,
  panels: [null, null, null, null].map(() => ({ img: null, ox: 0, oy: 0, zoom: 1 })),
};
let pickedThumb = 0;

function redraw() { drawCover(canvas, state); }
function syncPanelSel() {
  const n = LAYOUTS[state.layout].count;
  els.panelSel.innerHTML = '';
  for (let i = 0; i < n; i++) { const o = document.createElement('option'); o.value = i; o.textContent = 'Slice ' + (i + 1); els.panelSel.appendChild(o); }
  els.panelSel.value = state.selected;
  const p = state.panels[state.selected]; if (p) els.zoom.value = p.zoom;
}
function renderThumbs() {
  els.thumbs.innerHTML = '';
  library.forEach((item, idx) => {
    const b = document.createElement('button'); if (idx === pickedThumb) b.className = 'sel';
    const im = document.createElement('img'); im.src = item.url; im.alt = item.name; b.appendChild(im);
    b.title = 'Pick, then choose a slice number below';
    b.addEventListener('click', () => { pickedThumb = idx; renderThumbs(); });
    els.thumbs.appendChild(b);
    // assign buttons row handled via panel select + assign on double click
    b.addEventListener('dblclick', () => assign(idx, state.selected));
  });
}
function assign(libIdx, panelIdx) {
  state.panels[panelIdx] = { img: library[libIdx].img, ox: 0, oy: 0, zoom: 1 };
  state.selected = panelIdx; syncPanelSel(); redraw();
}
// quick assign: number keys 1-4 assign picked thumb
window.addEventListener('keydown', (e) => {
  const n = parseInt(e.key, 10);
  if (n >= 1 && n <= LAYOUTS[state.layout].count && library[pickedThumb]) assign(pickedThumb, n - 1);
});
// clicking a panel selects it; clicking with a picked thumb + Alt assigns
canvas.addEventListener('pointerdown', (e) => {
  const r = canvas.getBoundingClientRect();
  const px = (e.clientX - r.left) * canvas.width / r.width, py = (e.clientY - r.top) * canvas.height / r.height;
  const idx = panelAt(state, canvas, px, py);
  if (e.altKey && library[pickedThumb]) { assign(pickedThumb, idx); return; }
  state.selected = idx; syncPanelSel(); redraw();
  const panel = state.panels[idx]; if (!panel || !panel.img) return;
  let lx = e.clientX, ly = e.clientY; const sx = canvas.width / r.width, sy = canvas.height / r.height;
  const move = (ev) => { panel.ox += (ev.clientX - lx) * sx; panel.oy += (ev.clientY - ly) * sy; lx = ev.clientX; ly = ev.clientY; redraw(); };
  const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
});
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const p = state.panels[state.selected]; if (!p) return;
  p.zoom = Math.max(1, Math.min(3, p.zoom * (e.deltaY < 0 ? 1.07 : 0.93)));
  els.zoom.value = p.zoom; redraw();
}, { passive: false });

els.files.addEventListener('change', async () => {
  for (const f of els.files.files) {
    if (library.length >= 6) break;
    const url = URL.createObjectURL(f);
    try { const img = await loadImage(url); library.push({ img, url, name: f.name }); } catch {}
  }
  renderThumbs(); els.status.textContent = library.length + ' photo(s) on this device only.';
});
els.panelSel.addEventListener('change', () => {
  state.selected = Number(els.panelSel.value);
  if (library[pickedThumb]) assign(pickedThumb, state.selected); else { syncPanelSel(); redraw(); }
});
els.zoom.addEventListener('input', () => { const p = state.panels[state.selected]; if (p) { p.zoom = Number(els.zoom.value); redraw(); } });
els.caption.addEventListener('input', () => { state.caption = els.caption.value; redraw(); });
els.subtitle.addEventListener('input', () => { state.subtitle = els.subtitle.value; redraw(); });
els.layout.addEventListener('change', () => { state.layout = els.layout.value; state.selected = 0; syncPanelSel(); redraw(); });
els.grade.addEventListener('change', () => { state.grade = els.grade.value; redraw(); });
document.getElementById('shuffle').addEventListener('click', () => {
  const order = [...library].sort(() => Math.random() - 0.5);
  order.forEach((it, i) => { if (i < 4) state.panels[i] = { img: it.img, ox: 0, oy: 0, zoom: 1 }; });
  redraw();
});
document.getElementById('export').addEventListener('click', () => {
  const [w, h] = els.size.value.split('x').map(Number);
  const off = document.createElement('canvas'); off.width = w; off.height = h;
  drawCover(off, { ...state, showSelection: false });
  off.toBlob((blob) => {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `sunset-sleeve-${w}x${h}.png`; a.click();
    els.status.textContent = `Saved sunset-sleeve-${w}x${h}.png`;
  }, 'image/png');
});

async function loadSamples() {
  for (const url of SAMPLES) {
    try { const img = await loadImage(url); library.push({ img, url, name: url }); } catch {}
  }
  library.forEach((it, i) => { if (i < 4) state.panels[i] = { img: it.img, ox: 0, oy: 0, zoom: 1 }; });
  renderThumbs();
}

async function init() {
  const q = new URLSearchParams(location.search);
  const shot = parseShot(q);
  if (shot.shot === 'cover') {
    document.body.classList.add('shot-cover');
    state.showSelection = false;
    state.caption = shot.caption; state.subtitle = shot.subtitle;
    state.layout = shot.layout; state.grade = shot.grade;
    const [w, h] = SIZES[shot.size] || SIZES.square;
    canvas.width = w; canvas.height = h;
    await loadSamples();
    // vary grade per size for screenshot variety is handled by query grade
    redraw();
  } else if (shot.shot === 'editor') {
    if (q.get('caption')) { state.caption = q.get('caption'); els.caption.value = state.caption; }
    if (q.get('grade')) { state.grade = q.get('grade'); els.grade.value = state.grade; }
    if (q.get('layout')) { state.layout = q.get('layout'); els.layout.value = state.layout; }
    await loadSamples(); syncPanelSel(); redraw();
  } else {
    await loadSamples(); syncPanelSel(); redraw();
  }
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
init();
