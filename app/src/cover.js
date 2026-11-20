// Sunset Sleeve drawing engine: diagonal slices, duotone gradient-map grades,
// a vertical title spine, neon rule and heat-star badge. All original artwork.

export const GRADES = {
  neon:  { shadow: [7, 10, 38],    mid: [146, 32, 120],  high: [25, 227, 210], accent: '#ff2e88', accent2: '#19e3d2' },
  amber: { shadow: [32, 10, 6],    mid: [196, 82, 22],   high: [255, 214, 130], accent: '#ffb03a', accent2: '#ff5a3c' },
  ultra: { shadow: [10, 4, 34],    mid: [96, 44, 200],   high: [196, 160, 255], accent: '#a678ff', accent2: '#5ee7ff' },
  mint:  { shadow: [4, 22, 20],    mid: [18, 110, 92],   high: [210, 255, 230], accent: '#2effb2', accent2: '#ffe95e' },
};

export const LAYOUTS = {
  trio:  { count: 3, slant: 0.16 },
  strip: { count: 4, slant: 0.10 },
  duo:   { count: 2, slant: 0.22 },
};

const cache = new WeakMap();
function graded(img, grade) {
  let per = cache.get(img);
  if (!per) { per = {}; cache.set(img, per); }
  if (per[grade]) return per[grade];
  const w = Math.min(img.naturalWidth, 900);
  const h = Math.round(w * img.naturalHeight / img.naturalWidth);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(img, 0, 0, w, h);
  const d = x.getImageData(0, 0, w, h); const px = d.data; const g = GRADES[grade];
  for (let i = 0; i < px.length; i += 4) {
    const lum = (0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]) / 255;
    let r, gg, b;
    if (lum < 0.5) { const t = lum * 2; r = g.shadow[0] + (g.mid[0] - g.shadow[0]) * t; gg = g.shadow[1] + (g.mid[1] - g.shadow[1]) * t; b = g.shadow[2] + (g.mid[2] - g.shadow[2]) * t; }
    else { const t = (lum - 0.5) * 2; r = g.mid[0] + (g.high[0] - g.mid[0]) * t; gg = g.mid[1] + (g.high[1] - g.mid[1]) * t; b = g.mid[2] + (g.high[2] - g.mid[2]) * t; }
    px[i] = r; px[i + 1] = gg; px[i + 2] = b;
  }
  x.putImageData(d, 0, 0);
  per[grade] = c;
  return c;
}

function slicePath(ctx, x0, x1, slantPx, h, inset) {
  ctx.beginPath();
  ctx.moveTo(x0 + inset, -20);
  ctx.lineTo(x1 - inset, -20);
  ctx.lineTo(x1 - slantPx - inset, h + 20);
  ctx.lineTo(x0 - slantPx + inset, h + 20);
  ctx.closePath();
}

function drawPanel(ctx, panel, poly, gradeName) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(poly[0][0], poly[0][1]); for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0], poly[i][1]);
  ctx.closePath(); ctx.clip();
  const xs = poly.map(p => p[0]), ys = poly.map(p => p[1]);
  const bx = Math.min(...xs), by = Math.min(...ys), bw = Math.max(...xs) - bx, bh = Math.max(...ys) - by;
  if (panel && panel.img) {
    const src = graded(panel.img, gradeName);
    const base = Math.max(bw / src.width, bh / src.height);
    const s = base * (panel.zoom || 1);
    const dw = src.width * s, dh = src.height * s;
    const cx = bx + bw / 2 + (panel.ox || 0), cy = by + bh / 2 + (panel.oy || 0);
    ctx.drawImage(src, cx - dw / 2, cy - dh / 2, dw, dh);
  } else {
    const g = ctx.createLinearGradient(bx, by, bx + bw, by + bh);
    g.addColorStop(0, '#171733'); g.addColorStop(1, '#3d1150');
    ctx.fillStyle = g; ctx.fillRect(bx, by, bw, bh);
  }
  ctx.restore();
}

function star(ctx, cx, cy, r, color) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + i * Math.PI / 5; const rad = i % 2 ? r * 0.45 : r;
    const x = cx + Math.cos(ang) * rad, y = cy + Math.sin(ang) * rad;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath(); ctx.fillStyle = color; ctx.fill();
}

export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const grade = GRADES[state.grade] || GRADES.neon;
  const layout = LAYOUTS[state.layout] || LAYOUTS.trio;
  const n = layout.count;
  ctx.fillStyle = '#07071a'; ctx.fillRect(0, 0, w, h);

  const spineW = w * 0.135;
  const areaX = spineW, areaW = w - spineW;
  const slantPx = h * layout.slant;
  const gutter = Math.max(8, w * 0.012);
  const segW = areaW / n;

  for (let i = 0; i < n; i++) {
    const x0 = areaX + i * segW, x1 = x0 + segW;
    const inset = i === 0 ? 0 : gutter / 2;
    const insetR = i === n - 1 ? 0 : gutter / 2;
    const topShift = (i / Math.max(1, n - 1) - 0.5) * slantPx * 0.35;
    const poly = [
      [x0 + inset, -30 + topShift], [x1 - insetR, -30 - topShift],
      [x1 - slantPx - insetR, h + 30 - topShift], [x0 - slantPx + inset, h + 30 + topShift],
    ];
    drawPanel(ctx, state.panels[i], poly, state.grade);
    // neon edge on each slice
    ctx.beginPath(); ctx.moveTo(poly[1][0], poly[1][1]); ctx.lineTo(poly[2][0], poly[2][1]);
    ctx.strokeStyle = i % 2 ? grade.accent : grade.accent2; ctx.lineWidth = Math.max(2, w * 0.003); ctx.stroke();
  }

  // bottom scrim for legibility
  const scrim = ctx.createLinearGradient(0, h * 0.58, 0, h);
  scrim.addColorStop(0, 'rgba(4,4,16,0)'); scrim.addColorStop(1, 'rgba(4,4,16,0.88)');
  ctx.fillStyle = scrim; ctx.fillRect(0, h * 0.58, w, h * 0.42);

  // vertical title spine
  ctx.fillStyle = '#0a0a1e'; ctx.fillRect(0, 0, spineW, h);
  ctx.fillStyle = grade.accent; ctx.fillRect(spineW - Math.max(3, w * 0.004), 0, Math.max(3, w * 0.004), h);
  ctx.save();
  ctx.translate(spineW * 0.58, h * 0.94); ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  let spineSize = spineW * 0.52;
  ctx.font = `${spineSize}px AntonLocal, 'Arial Black', sans-serif`;
  const spineText = (state.caption || 'VICE HEAT').toUpperCase();
  while (ctx.measureText(spineText).width > h * 0.86 && spineSize > 14) { spineSize -= 3; ctx.font = `${spineSize}px AntonLocal, 'Arial Black', sans-serif`; }
  ctx.lineWidth = spineSize * 0.16; ctx.strokeStyle = '#05050f'; ctx.strokeText(spineText, 0, 0);
  const tg = ctx.createLinearGradient(0, -spineSize / 2, 0, spineSize / 2);
  tg.addColorStop(0, '#ffffff'); tg.addColorStop(0.55, grade.accent2); tg.addColorStop(1, grade.accent);
  ctx.fillStyle = tg; ctx.fillText(spineText, 0, 0);
  ctx.restore();

  // script subtitle on spine top
  ctx.save();
  ctx.translate(spineW * 0.58, h * 0.06); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'right';
  ctx.font = `${spineW * 0.30}px PacificoLocal, cursive`; ctx.fillStyle = grade.accent2;
  ctx.fillText('sunset sleeve', 0, 0);
  ctx.restore();

  // main caption block, lower right
  const title = (state.caption || '').trim().toUpperCase();
  if (title) {
    let size = w * 0.105;
    ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
    ctx.font = `${size}px AntonLocal, 'Arial Black', sans-serif`;
    while (ctx.measureText(title).width > w * 0.80 && size > 16) { size -= 3; ctx.font = `${size}px AntonLocal, 'Arial Black', sans-serif`; }
    const tx = w - w * 0.045, ty = h - h * 0.115;
    ctx.lineWidth = size * 0.18; ctx.lineJoin = 'round'; ctx.strokeStyle = '#05050f';
    ctx.strokeText(title, tx, ty);
    const g2 = ctx.createLinearGradient(tx, ty - size, tx, ty);
    g2.addColorStop(0, '#ffffff'); g2.addColorStop(0.6, grade.accent2); g2.addColorStop(1, grade.accent);
    ctx.fillStyle = g2; ctx.fillText(title, tx, ty);
    // neon rule
    const ruleW = Math.min(ctx.measureText(title).width, w * 0.8);
    ctx.fillStyle = grade.accent; ctx.fillRect(tx - ruleW, ty + size * 0.16, ruleW, Math.max(3, h * 0.006));
    ctx.fillStyle = grade.accent2; ctx.fillRect(tx - ruleW, ty + size * 0.16 + Math.max(3, h * 0.006) + 3, ruleW * 0.62, Math.max(2, h * 0.004));
    // subtitle
    const sub = (state.subtitle || '').trim().toUpperCase();
    if (sub) {
      ctx.font = `700 ${Math.max(13, w * 0.020)}px system-ui, sans-serif`;
      ctx.fillStyle = '#ffffff'; ctx.fillText(sub, tx, ty + size * 0.16 + Math.max(26, h * 0.045));
    }
  }

  // heat stars badge, top right (kept fully inside the frame with a margin)
  const br = w * 0.026;
  const badgeW = br * 6.4, badgeH = br * 2.6;
  const badgeX = w - badgeW - w * 0.022, badgeY = h * 0.028;
  ctx.fillStyle = 'rgba(5,5,18,0.78)';
  ctx.beginPath(); ctx.roundRect(badgeX, badgeY, badgeW, badgeH, br * 0.55); ctx.fill();
  ctx.strokeStyle = grade.accent; ctx.lineWidth = Math.max(1.5, w * 0.002); ctx.stroke();
  const starY = badgeY + badgeH * 0.36, starX0 = badgeX + badgeW / 2 - br * 2.1;
  for (let i = 0; i < 5; i++) star(ctx, starX0 + i * br * 1.05, starY, br * 0.46, i < 4 ? grade.accent : 'rgba(255,255,255,0.35)');
  ctx.font = `800 ${Math.max(11, br * 0.62)}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
  ctx.fillText('H E A T', badgeX + badgeW / 2, badgeY + badgeH * 0.82);

  // selected panel outline
  if (state.selected != null && state.showSelection) {
    const i = state.selected;
    if (i < n) {
      const x0 = areaX + i * segW, x1 = x0 + segW;
      ctx.beginPath();
      ctx.moveTo(x0, 0); ctx.lineTo(x1, 0); ctx.lineTo(x1 - slantPx, h); ctx.lineTo(x0 - slantPx, h); ctx.closePath();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.setLineDash([14, 10]); ctx.stroke(); ctx.setLineDash([]);
    }
  }
}

export function panelAt(state, canvas, px, py) {
  const w = canvas.width, h = canvas.height;
  const layout = LAYOUTS[state.layout] || LAYOUTS.trio; const n = layout.count;
  const spineW = w * 0.135, areaW = w - spineW, segW = areaW / n, slantPx = h * layout.slant;
  const t = py / h; const shiftedX = px + slantPx * t;
  const idx = Math.floor((shiftedX - spineW) / segW);
  return Math.max(0, Math.min(n - 1, idx));
}
