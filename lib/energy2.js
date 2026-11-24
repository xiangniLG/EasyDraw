/* 选修 · 能量和能源的使用（续）：照明 · 建筑与运输业的能源效益 · 能源与能源消耗
   依赖 lab / mechanics / optics / nuclear / atomic 的 PD.lab 辅助（L.partLabel、L.wavyArrow、L.angArc…）
   外观 look：抽象(线稿) / 黑白 / 上色；部件名称 blank：显示 / 留空横线 / 字母 / 不标注 */
(function () {
  'use strict';
  const f = PD.f, S = PD.strokeAttr, T = PD.tex, L = PD.lab, pt = L.pt, clamp = L.clamp;
  const D2R = Math.PI / 180, TAU = Math.PI * 2;
  const ROOT = 'DSE-物理/选修·能量和能源的使用/';
  const C2 = ROOT + '照明', C3 = ROOT + '建筑与运输业的能源效益', C4 = ROOT + '能源与能源消耗';
  const sd = (p) => S(p, { dash: 'solid' });
  const thin = (p, k) => L.thin(p, k ?? 0.7);
  const leader = (p, x1, y1, x2, y2) => `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" ${S(p, { dash: 'solid', sw: 0.7 })}/>`;
  const LOOKS = [['abstract', '抽象(线稿)'], ['bw', '黑白'], ['color', '上色']];
  const lookF = { k: 'look', t: 'sel', l: '外观', o: LOOKS };
  const blankF = { k: 'blank', t: 'sel', l: '部件名称', o: [['text', '显示名称'], ['empty', '全部留空(横线)'], ['letter', '改为字母 A B C…'], ['none', '不标注']] };
  const K = (p) => ({ col: p.look === 'color', bw: p.look === 'bw', ab: p.look !== 'color' && p.look !== 'bw' });
  const gray = (c) => { const [r, g, b] = PD.hex2rgb(c), v = Math.round(0.299 * r + 0.587 * g + 0.114 * b); return PD.rgb2hex(v, v, v); };
  const fc = (k, c, abFill) => (k.col ? c : k.bw ? PD.shade(gray(c), 0.15) : abFill || '#ffffff');
  const P = (ctx, p, t, i, x, y, a, lx, ly, lx2, ly2) => (p.blank === 'none' ? '' : (lx != null ? leader(p, lx, ly, lx2, ly2) : '') + L.partLabel(ctx, p, t, i, x, y, a));
  const say = (ctx, p, s, x, y, o) => (s ? T(ctx, s, x, y, Object.assign({ size: +p.lsize || 14, color: p.stroke, italic: false, halo: true }, o || {})) : '');
  const wav = (x0, y0, x1, y1, col, sw) => L.wavyArrow(x0, y0, x1, y1, col, sw || 1.2, 3, 10);
  const arrowPL = (pts, col, sw, dash) => { const n = pts.length, a = pts[n - 2], b = pts[n - 1], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), ah = 9; const q = pts.slice(); q[n - 1] = [b[0] - Math.cos(ang) * ah * 0.7, b[1] - Math.sin(ang) * ah * 0.7]; return `<polyline points="${q.map((v) => pt(v[0], v[1])).join(' ')}" fill="none" stroke="${col}" stroke-width="${f(sw || 2)}" stroke-linejoin="round"${dash ? ` stroke-dasharray="${dash}"` : ''}/>` + PD.arrowHead(b[0], b[1], ang, ah, 'tri', col, sw || 2); };
  // 尺寸线（带延长线）；side = 偏移方向 [nx, ny]（单位向量），off = 距离
  const dimL = (p, ctx, A, B, nv, off, label, ls) => {
    const A2 = [A[0] + nv[0] * off, A[1] + nv[1] * off], B2 = [B[0] + nv[0] * off, B[1] + nv[1] * off], l = Math.hypot(B2[0] - A2[0], B2[1] - A2[1]); if (l < 4) return '';
    const ux = (B2[0] - A2[0]) / l, uy = (B2[1] - A2[1]) / l, ah = l < 22 ? 0 : 7;
    let s = `<path d="M${pt(A[0] + nv[0] * 3, A[1] + nv[1] * 3)}L${pt(A2[0] + nv[0] * 4, A2[1] + nv[1] * 4)}M${pt(B[0] + nv[0] * 3, B[1] + nv[1] * 3)}L${pt(B2[0] + nv[0] * 4, B2[1] + nv[1] * 4)}" fill="none" ${S(p, { dash: 'solid', sw: 0.6 })}/>`;
    s += `<line x1="${f(A2[0] + ux * ah * 0.7)}" y1="${f(A2[1] + uy * ah * 0.7)}" x2="${f(B2[0] - ux * ah * 0.7)}" y2="${f(B2[1] - uy * ah * 0.7)}" ${S(p, { dash: 'solid', sw: 0.9 })}/>` + (ah ? PD.arrowHead(A2[0], A2[1], Math.atan2(-uy, -ux), ah, 'full', p.stroke, 0.9) + PD.arrowHead(B2[0], B2[1], Math.atan2(uy, ux), ah, 'full', p.stroke, 0.9) : `<path d="M${pt(A2[0] - nv[0] * 4, A2[1] - nv[1] * 4)}l${pt(nv[0] * 8, nv[1] * 8)}M${pt(B2[0] - nv[0] * 4, B2[1] - nv[1] * 4)}l${pt(nv[0] * 8, nv[1] * 8)}" fill="none" ${S(p, { dash: 'solid', sw: 0.9 })}/>`);
    if (label) s += T(ctx, label, (A2[0] + B2[0]) / 2 + nv[0] * 13, (A2[1] + B2[1]) / 2 + nv[1] * 13, { size: ls || 14, color: p.stroke, halo: true, italic: false, anchor: Math.abs(nv[0]) > 0.7 ? (nv[0] > 0 ? 'start' : 'end') : 'middle' });
    return s;
  };
  const sunG = (p, k, x, y, r) => { let s = ''; for (let i = 0; i < 8; i++) { const a = (i * 45) * D2R; s += `<line x1="${f(x + (r + 4) * Math.cos(a))}" y1="${f(y + (r + 4) * Math.sin(a))}" x2="${f(x + (r + 12) * Math.cos(a))}" y2="${f(y + (r + 12) * Math.sin(a))}" stroke="${k.col ? '#f9a825' : p.stroke}" stroke-width="1.6" stroke-linecap="round"/>`; } return s + `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${k.col ? '#ffd54f' : '#ffffff'}" ${sd(p)}/>`; };
  // 管道：上色 / 黑白 = 粗管(描边 + 内色)；线稿 = 空心管
  const pipe = (p, k, d, col, w) => L.tube(d, w || 10, p.stroke, k.ab ? '#ffffff' : k.bw ? PD.shade(gray(col), 0.2) : col, 1.2);

  /* ======================================================================
     照明
     ====================================================================== */
  // 粗管（荧光灯管）
  const glassTube = (d, k, w, inner) => `<path d="${d}" fill="none" stroke="#000000" stroke-width="${f(w + 2.4)}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${inner}" stroke-width="${f(w)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  PD.register({
    type: 'fluor', name: '荧光灯(直管 / 紧凑型)',
    defaults: { look: 'abstract', kind: 'tube', L: 360, proc: true, hg: true, turns: 4, seed: 5, blank: 'text', tEl: '电极(灯丝)', tCoat: '荧光粉涂层', tHg: '汞蒸气', tGlass: '玻璃管', tPin: '接脚', tUV: '紫外光', tVis: '可见光', tBal: '电子镇流器', tCap: '灯头', lsize: 14 },
    fields: [lookF, { k: 'kind', t: 'sel', l: '种类', o: [['tube', '直管型(剖面)'], ['u', '紧凑型 · U 形管'], ['spiral', '紧凑型 · 螺旋管']], rebuild: true },
      { k: 'L', t: 'num', l: '灯管长度', when: (p) => p.kind === 'tube' }, { k: 'proc', t: 'bool', l: '画出发光过程(电子→汞原子→紫外光→可见光)', when: (p) => p.kind === 'tube' },
      { k: 'hg', t: 'bool', l: '汞原子', when: (p) => p.kind === 'tube' }, { k: 'seed', t: 'num', l: '汞原子排布', when: (p) => p.kind === 'tube' && p.hg }, { k: 'turns', t: 'num', l: '螺旋圈数', min: 2, max: 7, when: (p) => p.kind === 'spiral' }, blankF,
      { k: 'tEl', t: 'text', l: '电极', when: (p) => p.kind === 'tube' }, { k: 'tCoat', t: 'text', l: '荧光粉' }, { k: 'tHg', t: 'text', l: '汞蒸气', when: (p) => p.kind === 'tube' }, { k: 'tGlass', t: 'text', l: '玻璃管', when: (p) => p.kind === 'tube' },
      { k: 'tPin', t: 'text', l: '接脚', when: (p) => p.kind === 'tube' }, { k: 'tUV', t: 'text', l: '紫外光', when: (p) => p.kind === 'tube' && p.proc }, { k: 'tVis', t: 'text', l: '可见光', when: (p) => p.kind === 'tube' && p.proc },
      { k: 'tBal', t: 'text', l: '镇流器', when: (p) => p.kind !== 'tube' }, { k: 'tCap', t: 'text', l: '灯头', when: (p) => p.kind !== 'tube' }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const k = K(p), uv = k.col ? '#7b1fa2' : p.stroke, vis = k.col ? '#f9a825' : p.stroke;
      if (p.kind !== 'tube') {
        const inner = k.col ? '#fbfbf4' : k.bw ? '#f0f0f0' : '#ffffff', back = k.col ? '#e6e6dc' : k.bw ? '#d6d6d6' : '#ffffff';
        let o = '';
        if (p.kind === 'u') {
          o += glassTube('M-18,0V-140A18,18 0 0 1 18,-140V0', k, 12, back).replace(/#000000/g, p.stroke);
          o += glassTube('M-36,0V-150A9,9 0 0 1 -18,-150V0', k, 12, inner).replace(/#000000/g, p.stroke) + glassTube('M18,0V-150A9,9 0 0 1 36,-150V0', k, 12, inner).replace(/#000000/g, p.stroke);
        } else {
          const N = clamp(Math.round(+p.turns), 2, 7), R = 34, pitch = 150 / N, M = 64 * N, runs = [];
          let cur = null;
          for (let i = 0; i <= M; i++) { const t = (N * TAU * i) / M, q = [R * Math.sin(t), -12 - (pitch * t) / TAU + R * 0.28 * Math.cos(t)], fr = Math.cos(t) > 0; if (!cur || cur.fr !== fr) { if (cur) cur.pts.push(q); cur = { fr, pts: [q] }; runs.push(cur); } else cur.pts.push(q); }
          const d = (r) => 'M' + r.pts.map((q) => pt(q[0], q[1])).join('L');
          runs.filter((r) => !r.fr).forEach((r) => (o += glassTube(d(r), k, 11, back).replace(/#000000/g, p.stroke)));
          runs.filter((r) => r.fr).forEach((r) => (o += glassTube(d(r), k, 11, inner).replace(/#000000/g, p.stroke)));
        }
        o += `<path d="M-44,0H44L30,46H-30Z" fill="${fc(k, '#eceff1')}" ${sd(p)}/><rect x="-18" y="46" width="36" height="34" fill="${k.col ? L.metal(ctx, '#bdbdbd', -18, 18) : fc(k, '#d0d0d0')}" ${sd(p)}/><path d="M-18,54L18,50M-18,63L18,59M-18,72L18,68" fill="none" ${thin(p)}/><path d="M-10,80L-5,90H5L10,80" fill="${fc(k, '#424242', '#ffffff')}" ${sd(p)}/>`;
        o += P(ctx, p, p.tCoat, 0, 90, -100, 'start', p.kind === 'u' ? 42 : 36, -100, 86, -100) + P(ctx, p, p.tBal, 1, 90, 24, 'start', 38, 24, 86, 24) + P(ctx, p, p.tCap, 2, 90, 66, 'start', 18, 66, 86, 66);
        return o;
      }
      const Lh = Math.max(160, +p.L) / 2, r = 22, g0 = Lh - 22;
      let o = `<rect x="${f(-g0)}" y="${-r}" width="${f(2 * g0)}" height="${2 * r}" fill="${k.col ? '#f4f9ff' : k.bw ? '#f7f7f7' : '#ffffff'}" ${sd(p)}/>`;
      o += k.col ? `<rect x="${f(-g0 + 1.5)}" y="${-r + 2.5}" width="${f(2 * g0 - 3)}" height="${2 * r - 5}" fill="none" stroke="#efe3a6" stroke-width="3.5"/>` : `<rect x="${f(-g0 + 3)}" y="${-r + 3}" width="${f(2 * g0 - 6)}" height="${2 * r - 6}" fill="none" stroke="${p.stroke}" stroke-width="1.6" stroke-dasharray="0.5 3" stroke-linecap="round"/>`;
      [-1, 1].forEach((s) => {
        const xa = s * g0, xb = s * Lh;
        o += `<rect x="${f(Math.min(xa, xb))}" y="${-r - 2}" width="22" height="${2 * r + 4}" rx="3" fill="${k.col ? L.metal(ctx, '#b0bec5', -r, r, true) : fc(k, '#cfcfcf')}" ${sd(p)}/>`;
        o += `<path d="M${f(xb)},-9h${f(s * 12)}M${f(xb)},9h${f(s * 12)}" stroke="${p.stroke}" stroke-width="3" stroke-linecap="round"/>`;
        const xc = xa - s * 14; let d = `M${f(xa)},-9H${f(xc)}`; for (let i = 1; i <= 6; i++) d += `L${f(xc + (i % 2 ? 4 : -4))},${f(-9 + 3 * i - 1.5)}`; d += `L${f(xc)},9H${f(xa)}`;
        o += `<path d="${d}" fill="none" stroke="${k.col ? '#e65100' : p.stroke}" stroke-width="1.3" stroke-linejoin="round"/>`;
      });
      const hgDot = (x, y, rr) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rr)}" fill="${k.col ? '#90a4ae' : k.bw ? '#9e9e9e' : '#ffffff'}" ${thin(p, 0.6)}/>`;
      if (p.hg) { const rng = PD.rng(p.seed); let n = 0, tries = 0; while (n < Math.round(g0 / 14) && tries++ < 400) { const x = (rng() * 2 - 1) * (g0 - 30), y = (rng() * 2 - 1) * (r - 9); if ((p.proc && Math.abs(x) < 80) || Math.hypot(x + 100, y + 8) < 12) continue; o += hgDot(x, y, 2.6); n++; } o += hgDot(-100, -8, 2.6); }
      if (p.proc) {
        o += `<circle cx="-62" cy="7" r="3.2" fill="${k.col ? '#1e88e5' : p.stroke}"/>` + L.arrow(p, -56, 7, -12, 7, { sw: 1, ah: 6 }) + T(ctx, 'e^-', -68, 7, { size: 11, anchor: 'end', color: p.stroke });
        o += `<circle cx="-4" cy="7" r="6" fill="${k.col ? '#90a4ae' : k.bw ? '#9e9e9e' : '#ffffff'}" ${thin(p, 0.8)}/>`;
        o += wav(4, 2, 38, -r + 4, uv, 1.1);
        o += wav(42, -r - 2, 58, -r - 40, vis, 1.3) + wav(32, -r - 2, 22, -r - 40, vis, 1.3);
      }
      o += P(ctx, p, p.tEl, 0, -g0 + 14, r + 46, 'middle', -g0 + 14, 9, -g0 + 14, r + 32) + P(ctx, p, p.tCoat, 1, g0 - 30, -r - 44, 'middle', g0 - 30, -r + 3, g0 - 30, -r - 30);
      if (p.hg) o += P(ctx, p, p.tHg, 2, -100, -r - 44, 'middle', -100, -11, -100, -r - 30);
      o += P(ctx, p, p.tGlass, 3, g0 - 60, r + 46, 'middle', g0 - 60, r, g0 - 60, r + 32) + P(ctx, p, p.tPin, 4, -Lh - 14, -r - 30, 'middle', -Lh - 8, -10, -Lh - 12, -r - 16);
      if (p.proc) o += P(ctx, p, p.tUV, 5, 20, r + 46, 'middle', 20, -6, 20, r + 32) + P(ctx, p, p.tVis, 6, 40, -r - 56, 'middle');
      return o;
    },
  });

  PD.register({
    type: 'ledlamp', name: 'LED(单颗 / LED 灯泡)',
    defaults: { look: 'abstract', kind: 'chip', lc: '#e53935', rays: true, blank: 'text', tLens: '环氧树脂外壳(透镜)', tDie: '半导体芯片(PN 结)', tCup: '反射杯', tWire: '金线', tAn: '阳极 +(长脚)', tCa: '阴极 −(短脚)', tDome: '灯罩(使光散开)', tChips: 'LED 芯片', tSink: '散热器', tDrv: '驱动电路', tCap: '灯头', lsize: 14 },
    fields: [lookF, { k: 'kind', t: 'sel', l: '种类', o: [['chip', '单颗 LED(剖面)'], ['bulb', 'LED 灯泡']], rebuild: true }, { k: 'lc', t: 'color', l: '发光颜色(上色时)' }, { k: 'rays', t: 'bool', l: '发光' }, blankF,
      { k: 'tLens', t: 'text', l: '外壳', when: (p) => p.kind === 'chip' }, { k: 'tDie', t: 'text', l: '芯片', when: (p) => p.kind === 'chip' }, { k: 'tCup', t: 'text', l: '反射杯', when: (p) => p.kind === 'chip' }, { k: 'tWire', t: 'text', l: '金线', when: (p) => p.kind === 'chip' },
      { k: 'tAn', t: 'text', l: '阳极', when: (p) => p.kind === 'chip' }, { k: 'tCa', t: 'text', l: '阴极', when: (p) => p.kind === 'chip' },
      { k: 'tDome', t: 'text', l: '灯罩', when: (p) => p.kind === 'bulb' }, { k: 'tChips', t: 'text', l: 'LED 芯片', when: (p) => p.kind === 'bulb' }, { k: 'tSink', t: 'text', l: '散热器', when: (p) => p.kind === 'bulb' }, { k: 'tDrv', t: 'text', l: '驱动电路', when: (p) => p.kind === 'bulb' }, { k: 'tCap', t: 'text', l: '灯头', when: (p) => p.kind === 'bulb' }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const k = K(p), lc = k.col ? p.lc : p.stroke;
      let o = '';
      if (p.kind === 'bulb') {
        if (p.rays) for (let i = 0; i < 7; i++) { const a = (-90 + (i - 3) * 30) * D2R; o += `<line x1="${f(66 * Math.cos(a))}" y1="${f(-40 + 66 * Math.sin(a))}" x2="${f(84 * Math.cos(a))}" y2="${f(-40 + 84 * Math.sin(a))}" stroke="${k.col ? '#f9a825' : p.stroke}" stroke-width="1.4" stroke-linecap="round"/>`; }
        o += `<path d="M-50,0A50,54 0 1 1 50,0Z" fill="${k.col ? '#fffdf0' : k.bw ? '#f4f4f4' : '#ffffff'}" ${sd(p)}/>`;
        o += `<rect x="-40" y="-8" width="80" height="8" fill="${fc(k, '#43a047')}" ${thin(p)}/>`;
        for (let i = 0; i < 5; i++) o += `<rect x="${-34 + i * 15}" y="-15" width="8" height="7" fill="${k.col ? '#fff59d' : '#ffffff'}" ${thin(p, 0.7)}/>`;
        o += `<path d="M-50,0H50L36,52H-36Z" fill="${fc(k, '#cfd8dc')}" ${sd(p)}/>`;
        for (let i = -3; i <= 3; i++) o += `<line x1="${f(i * 12)}" y1="4" x2="${f(i * 9.6)}" y2="48" ${thin(p, 0.6)}/>`;
        if (!k.ab || true) o += `<rect x="-16" y="10" width="32" height="20" rx="2" fill="${fc(k, '#5c6bc0')}" stroke="${p.stroke}" stroke-width="0.8" stroke-dasharray="3 2"/>`;
        o += `<rect x="-20" y="52" width="40" height="32" fill="${k.col ? L.metal(ctx, '#bdbdbd', -20, 20) : fc(k, '#d0d0d0')}" ${sd(p)}/><path d="M-20,60L20,56M-20,69L20,65M-20,78L20,74" fill="none" ${thin(p)}/><path d="M-11,84L-5,94H5L11,84" fill="${fc(k, '#424242')}" ${sd(p)}/>`;
        o += P(ctx, p, p.tDome, 0, 104, -70, 'start', 38, -70, 100, -70) + P(ctx, p, p.tChips, 1, -104, -30, 'end', -30, -14, -100, -30) + P(ctx, p, p.tSink, 2, 104, 36, 'start', 42, 30, 100, 36) + P(ctx, p, p.tDrv, 3, -104, 20, 'end', -16, 20, -100, 20) + P(ctx, p, p.tCap, 4, 104, 70, 'start', 20, 70, 100, 70);
        return o;
      }
      if (p.rays) for (let i = 0; i < 5; i++) { const a = (-90 + (i - 2) * 22) * D2R; o += `<line x1="${f(30 * Math.cos(a))}" y1="${f(-62 + 30 * Math.sin(a))}" x2="${f(52 * Math.cos(a))}" y2="${f(-62 + 52 * Math.sin(a))}" stroke="${lc}" stroke-width="1.4" stroke-linecap="round"/>`; }
      o += `<path d="M-22,40V-38A22,22 0 0 1 22,-38V40Z" fill="${k.col ? p.lc : '#ffffff'}" fill-opacity="${k.col ? 0.28 : 1}" ${sd(p)}/><rect x="-26" y="40" width="52" height="8" fill="${k.col ? p.lc : k.bw ? '#e0e0e0' : '#ffffff'}" fill-opacity="${k.col ? 0.4 : 1}" ${sd(p)}/><line x1="-22" y1="40" x2="-22" y2="48" stroke="#ffffff" stroke-width="2"/>`;
      const metal = k.col ? '#9e9e9e' : k.bw ? '#bdbdbd' : '#ffffff';
      o += `<path d="M-17,-4H-1V40H-7V48H-11V40H-17Z" fill="${metal}" ${thin(p, 0.8)}/><path d="M-19,-12L-15,-4H-3L1,-12Z" fill="${metal}" ${thin(p, 0.8)}/>`;
      o += `<path d="M6,-8H16V40H6Z" fill="${metal}" ${thin(p, 0.8)}/>`;
      o += `<rect x="-12" y="-11" width="7" height="5" fill="${k.col ? '#212121' : '#ffffff'}" ${thin(p, 0.8)}/>`;
      o += `<path d="M-8,-11C-6,-26 8,-26 10,-8" fill="none" stroke="${k.col ? '#c9a227' : p.stroke}" stroke-width="0.9"/>`;
      o += `<path d="M-9,48V150M11,48V172" fill="none" stroke="${p.stroke}" stroke-width="3"/>`;
      o += P(ctx, p, p.tLens, 0, 64, -50, 'start', 16, -44, 60, -50) + P(ctx, p, p.tDie, 1, -64, -40, 'end', -10, -12, -60, -40) + P(ctx, p, p.tCup, 2, -64, -6, 'end', -17, -8, -60, -6);
      o += P(ctx, p, p.tWire, 3, 64, -16, 'start', 6, -22, 60, -16) + P(ctx, p, p.tAn, 4, 30, 166, 'start', 12, 160, 26, 166) + P(ctx, p, p.tCa, 5, -30, 146, 'end', -10, 140, -26, 146);
      return o;
    },
  });

  PD.register({
    type: 'pnjunc', name: 'PN 结(发光二极管原理, 含电路)',
    defaults: { look: 'color', bias: 'fwd', circuit: true, res: true, carriers: true, photon: true, curr: true, lc: '#e53935', blank: 'text', tP: 'p 型半导体', tN: 'n 型半导体', tH: '空穴', tE: '电子', tD: '耗尽层', tPh: '光子', tR: '电阻器', lsize: 14 },
    fields: [lookF, { k: 'bias', t: 'sel', l: '偏压', o: [['fwd', '正向偏压(发光)'], ['rev', '反向偏压'], ['none', '没有接电源']] }, { k: 'circuit', t: 'bool', l: '画电路(电池)', when: (p) => p.bias !== 'none' }, { k: 'res', t: 'bool', l: '串联电阻器', when: (p) => p.bias !== 'none' && p.circuit },
      { k: 'carriers', t: 'bool', l: '空穴 ○ 与电子 ●' }, { k: 'photon', t: 'bool', l: '复合时放出光子', when: (p) => p.bias === 'fwd' }, { k: 'curr', t: 'bool', l: '电流方向 I', when: (p) => p.bias === 'fwd' && p.circuit }, { k: 'lc', t: 'color', l: '光子颜色' }, blankF,
      { k: 'tP', t: 'text', l: 'p 型' }, { k: 'tN', t: 'text', l: 'n 型' }, { k: 'tH', t: 'text', l: '空穴' }, { k: 'tE', t: 'text', l: '电子' }, { k: 'tD', t: 'text', l: '耗尽层' }, { k: 'tPh', t: 'text', l: '光子' }, { k: 'tR', t: 'text', l: '电阻器' }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const k = K(p), w = { fwd: 16, rev: 76, none: 40 }[p.bias] ?? 40, ls = +p.lsize || 14;
      let o = `<rect x="-150" y="-50" width="150" height="100" fill="${fc(k, '#fde0dc')}" ${sd(p)}/><rect x="0" y="-50" width="150" height="100" fill="${fc(k, '#dce8fb')}" ${sd(p)}/>`;
      o += `<rect x="${-w / 2}" y="-50" width="${w}" height="100" fill="${k.col ? '#f5f5f5' : '#ffffff'}" stroke="none"/><path d="M${-w / 2},-50V50M${w / 2},-50V50" fill="none" ${S(p, { dash: 'dash', sw: 0.9 })}/><rect x="-150" y="-50" width="300" height="100" fill="none" ${sd(p)}/>`;
      let hole = null, elec = null;
      if (p.carriers) {
        const hc = k.col ? '#c62828' : p.stroke, ec = k.col ? '#1565c0' : p.stroke;
        for (let r = 0; r < 3; r++) for (let x = -134 + (r % 2) * 11; x < -w / 2 - 8; x += 24) { const y = -28 + r * 28; o += `<circle cx="${f(x)}" cy="${y}" r="5" fill="#ffffff" stroke="${hc}" stroke-width="1.4"/>`; if (!hole || Math.hypot(x + 104, y - 28) < Math.hypot(hole[0] + 104, hole[1] - 28)) hole = [x, y]; }
        for (let r = 0; r < 3; r++) for (let x = 134 - (r % 2) * 11; x > w / 2 + 8; x -= 24) { const y = -28 + r * 28; o += `<circle cx="${f(x)}" cy="${y}" r="4.2" fill="${ec}"/>`; if (!elec || Math.hypot(x - 104, y - 28) < Math.hypot(elec[0] - 104, elec[1] - 28)) elec = [x, y]; }
        if (p.bias === 'fwd') { o += L.arrow(p, -w / 2 - 36, -40, -w / 2 - 6, -40, { sw: 1.1, ah: 6, color: hc }) + L.arrow(p, w / 2 + 36, 40, w / 2 + 6, 40, { sw: 1.1, ah: 6, color: ec }); }
      }
      if (p.bias === 'fwd' && p.photon) { o += `<path d="M-5,-5L5,5M5,-5L-5,5M0,-7V7M-7,0H7" stroke="${k.col ? '#f9a825' : p.stroke}" stroke-width="1.3"/>` + wav(4, -10, 34, -92, k.col ? p.lc : p.stroke, 1.4) + P(ctx, p, p.tPh, 5, 40, -100, 'start'); }
      if (p.bias !== 'none' && p.circuit) {
        const fwd = p.bias === 'fwd', yb = 120;
        o += `<path d="M-150,0H-190V${yb}H-8M8,${yb}H190V0H150" fill="none" ${sd(p)}/>`;
        const xl = fwd ? -6 : 6, xs = fwd ? 6 : -6;
        o += `<rect x="-7" y="${yb - 3}" width="14" height="6" fill="#ffffff"/><line x1="${xl}" y1="${yb - 16}" x2="${xl}" y2="${yb + 16}" ${S(p, { dash: 'solid', sw: 1.5 })}/><line x1="${xs}" y1="${yb - 8}" x2="${xs}" y2="${yb + 8}" ${S(p, { dash: 'solid', sw: 4 })}/>`;
        o += T(ctx, '+', xl + (fwd ? -10 : 10), yb - 20, { size: 13, italic: false, color: p.stroke }) + T(ctx, '−', xs + (fwd ? 10 : -10), yb - 20, { size: 13, italic: false, color: p.stroke });
        if (p.res) o += `<rect x="183" y="42" width="14" height="40" fill="#ffffff" ${sd(p)}/>` + P(ctx, p, p.tR, 6, 206, 62, 'start');
        if (fwd && p.curr) o += PD.arrowHead(-190, 52, -Math.PI / 2, 10, 'tri', p.stroke, 1) + T(ctx, 'I', -202, 56, { size: ls + 1, anchor: 'end', color: p.stroke });
      }
      o += P(ctx, p, p.tP, 0, -75, -66, 'middle') + P(ctx, p, p.tN, 1, 75, -66, 'middle');
      if (p.carriers && hole) o += P(ctx, p, p.tH, 2, -110, 82, 'middle', hole[0], hole[1] + 5, -110, 70);
      if (p.carriers && elec) o += P(ctx, p, p.tE, 3, 110, 82, 'middle', elec[0], elec[1] + 5, 110, 70);
      o += P(ctx, p, p.tD, 4, 0, 82, 'middle', 0, 50, 0, 70);
      return o;
    },
  });

  /* ---------- 点光源照射平面 ---------- */
  const illumGeo = (p) => {
    const a = (+p.tilt || 0) * D2R, d = [Math.cos(a), -Math.sin(a)], half = Math.max(40, +p.Lp) / 2, u = clamp(+p.u, -half, half), S0 = [+p.sx, +p.sy];
    let n = [Math.sin(a), Math.cos(a)]; if (S0[0] * n[0] + S0[1] * n[1] < 0) n = [-n[0], -n[1]];
    const P0 = [d[0] * u, d[1] * u], t = S0[0] * d[0] + S0[1] * d[1], N0 = [d[0] * t, d[1] * t];
    return { d, n, half, u, S0, P0, N0 };
  };
  PD.register({
    type: 'illum', name: '点光源照射平面(可拖光源与 P 点)',
    defaults: { mode: 'line', tilt: 0, sx: -60, sy: -150, u: 90, Lp: 320, depth: 130, pk: 35, foot: true, normal: true, rline: true, rays: 0, src: 'bulb', lc: '#f9a825', fillc: '#dfe9f3', tS: 'S', tP: 'P', tN: 'N', tr: 'r', th: 'h', tth: '\\theta', tPlane: '', lsize: 15 },
    getHandles: (p) => { const g = illumGeo(p); return [g.S0, g.P0]; },
    setHandle(p, i, x, y) { if (i === 0) { p.sx = Math.round(x); p.sy = Math.round(y); } else { const g = illumGeo(p); p.u = Math.round(clamp(x * g.d[0] + y * g.d[1], -g.half, g.half)); } },
    fields: [
      { k: 'mode', t: 'sel', l: '平面画法', o: [['line', '直线(侧视)'], ['plane', '2.5D 平面(斜投影)']], rebuild: true },
      { k: 'tilt', t: 'range', l: '平面倾斜°', min: -80, max: 80, step: 1 }, { k: 'sx', t: 'num', l: '光源 x(可拖)' }, { k: 'sy', t: 'num', l: '光源 y(可拖)' }, { k: 'u', t: 'num', l: 'P 点位置(可拖)' },
      { k: 'Lp', t: 'num', l: '平面长度' }, { k: 'depth', t: 'num', l: '平面纵深', when: (p) => p.mode === 'plane' }, { k: 'pk', t: 'range', l: '纵深方向°', min: 10, max: 80, step: 1, when: (p) => p.mode === 'plane' },
      { k: 'fillc', t: 'color', l: '平面颜色', when: (p) => p.mode === 'plane' },
      { k: 'rline', t: 'bool', l: '连线 SP(距离 r)' }, { k: 'normal', t: 'bool', l: 'P 点法线与角度 θ' }, { k: 'foot', t: 'bool', l: '垂足 N 与垂直距离 h' }, { k: 'rays', t: 'num', l: '其他光线条数(0 = 不画)', min: 0, max: 12 },
      { k: 'src', t: 'sel', l: '光源', o: [['bulb', '灯泡'], ['star', '发光点'], ['dot', '点']] }, { k: 'lc', t: 'color', l: '光线颜色' },
      { k: 'tS', t: 'text', l: '光源标签' }, { k: 'tP', t: 'text', l: 'P 点标签' }, { k: 'tN', t: 'text', l: '垂足标签', when: (p) => p.foot }, { k: 'tr', t: 'text', l: 'r 标签', when: (p) => p.rline }, { k: 'th', t: 'text', l: 'h 标签', when: (p) => p.foot }, { k: 'tth', t: 'text', l: '角度标签', when: (p) => p.normal }, { k: 'tPlane', t: 'text', l: '平面名称' }, { k: 'lsize', t: 'num', l: '字号' },
    ],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const g = illumGeo(p), { d, n, half, S0, P0, N0 } = g, ls = +p.lsize || 15, E1 = [-d[0] * half, -d[1] * half], E2 = [d[0] * half, d[1] * half];
      let o = '';
      if (p.mode === 'plane') {
        const kk = 0.5, a = (+p.pk || 35) * D2R, D = +p.depth || 120, e = [kk * D * Math.cos(a) / 2, -kk * D * Math.sin(a) / 2];
        const C = [[E1[0] - e[0], E1[1] - e[1]], [E2[0] - e[0], E2[1] - e[1]], [E2[0] + e[0], E2[1] + e[1]], [E1[0] + e[0], E1[1] + e[1]]];
        o += `<polygon points="${C.map((q) => pt(q[0], q[1])).join(' ')}" fill="${p.fillc}" fill-opacity="0.85" ${sd(p)}/>`;
      } else o += `<line x1="${f(E1[0])}" y1="${f(E1[1])}" x2="${f(E2[0])}" y2="${f(E2[1])}" ${S(p, { dash: 'solid', sw: (+p.sw || 1.5) * 1.6 })}/>`;
      const lc = p.lc, nr = Math.round(+p.rays || 0);
      for (let i = 0; i < nr; i++) { const u = -half * 0.9 + (1.8 * half * (i + 0.5)) / nr, Q = [d[0] * u, d[1] * u]; o += L.arrow(p, S0[0], S0[1], Q[0], Q[1], { sw: 0.9, color: lc, ah: 6 }); }
      if (p.foot) {
        o += `<line x1="${f(S0[0])}" y1="${f(S0[1])}" x2="${f(N0[0])}" y2="${f(N0[1])}" ${S(p, { dash: 'dash', sw: 0.9 })}/>`;
        const q = 8, a1 = [N0[0] - d[0] * q, N0[1] - d[1] * q], b1 = [a1[0] + n[0] * q, a1[1] + n[1] * q], c1 = [N0[0] + n[0] * q, N0[1] + n[1] * q];
        o += `<path d="M${pt(...a1)}L${pt(...b1)}L${pt(...c1)}" fill="none" ${S(p, { dash: 'solid', sw: 0.8 })}/>`;
        o += say(ctx, p, p.tN, N0[0] - n[0] * 16, N0[1] - n[1] * 16, { italic: true, size: ls }) + say(ctx, p, p.th, (S0[0] + N0[0]) / 2 - d[0] * 12, (S0[1] + N0[1]) / 2 - d[1] * 12, { italic: true, size: ls, anchor: d[0] > 0 ? 'end' : 'start' });
      }
      if (p.rline) {
        o += L.arrow(p, S0[0], S0[1], P0[0], P0[1], { sw: 1.4, color: k_col(p) ? lc : p.stroke, ah: 9 });
        const m = [(S0[0] + P0[0]) / 2, (S0[1] + P0[1]) / 2], v = [P0[0] - S0[0], P0[1] - S0[1]], l = Math.hypot(v[0], v[1]) || 1, nv = [v[1] / l, -v[0] / l], side = nv[0] * d[0] + nv[1] * d[1] > 0 ? 1 : -1;
        o += say(ctx, p, p.tr, m[0] + nv[0] * side * 14, m[1] + nv[1] * side * 14, { italic: true, size: ls });
      }
      if (p.normal) {
        const nl = 90, Ntip = [P0[0] + n[0] * nl, P0[1] + n[1] * nl];
        o += `<line x1="${f(P0[0])}" y1="${f(P0[1])}" x2="${f(Ntip[0])}" y2="${f(Ntip[1])}" ${S(p, { dash: 'dash', sw: 0.9 })}/>`;
        const aN = Math.atan2(n[1], n[0]), aS = Math.atan2(S0[1] - P0[1], S0[0] - P0[0]);
        if (Math.abs(((aS - aN + 3 * Math.PI) % TAU) - Math.PI) > 0.03) o += L.angArc(p, ctx, P0, aN, aS, 30, p.tth, ls);
      }
      o += `<circle cx="${f(P0[0])}" cy="${f(P0[1])}" r="2.8" fill="${p.stroke}"/>` + say(ctx, p, p.tP, P0[0] - n[0] * 16 + d[0] * 6, P0[1] - n[1] * 16 + d[1] * 6, { italic: true, size: ls });
      if (p.src === 'bulb') o += `<g transform="translate(${pt(...S0)})"><circle r="10" fill="${k_col(p) ? '#fff59d' : '#ffffff'}" ${sd(p)}/><rect x="-5" y="-19" width="10" height="9" fill="${k_col(p) ? '#bdbdbd' : '#ffffff'}" ${thin(p)}/><path d="M-4,3L-2,-3L0,3L2,-3L4,3" fill="none" stroke="${p.stroke}" stroke-width="0.8"/></g>`;
      else if (p.src === 'star') o += sunG(p, { col: k_col(p) }, S0[0], S0[1], 5);
      else o += `<circle cx="${f(S0[0])}" cy="${f(S0[1])}" r="4" fill="${p.stroke}"/>`;
      o += say(ctx, p, p.tS, S0[0] - 18, S0[1] - 16, { italic: true, size: ls });
      if (p.tPlane) o += say(ctx, p, p.tPlane, E2[0] - n[0] * 18, E2[1] - n[1] * 18, { size: ls - 1 });
      return o;
    },
  });
  function k_col(p) { return String(p.lc || '').toLowerCase() !== '#000000'; }

  /* ======================================================================
     建筑与运输业的能源效益
     ====================================================================== */
  const MAT = {
    brick: { n: '砖', k: 0.6, c: '#c8643c' }, glass: { n: '玻璃', k: 1.0, c: '#bfe3f5' }, concrete: { n: '混凝土', k: 1.4, c: '#bcbcb4' }, wood: { n: '木', k: 0.15, c: '#c99a5e' },
    foam: { n: '隔热泡沫', k: 0.03, c: '#f6e27a' }, wool: { n: '玻璃纤维棉', k: 0.04, c: '#f4c2c2' }, air: { n: '空气', k: 0.025, c: '#f7fbff' }, plaster: { n: '灰泥', k: 0.5, c: '#eeeae0' },
    stone: { n: '石', k: 2.0, c: '#a3a39a' }, metal: { n: '金属', k: 50, c: '#b0bec5' },
  };
  const MATZH = { 砖: 'brick', 玻璃: 'glass', 混凝土: 'concrete', 木: 'wood', 木材: 'wood', 泡沫: 'foam', 隔热: 'foam', 隔热泡沫: 'foam', 棉: 'wool', 玻璃纤维: 'wool', 玻璃纤维棉: 'wool', 空气: 'air', 灰泥: 'plaster', 石: 'stone', 石材: 'stone', 金属: 'metal', 钢: 'metal', 铝: 'metal' };
  const parseLayers = (s) => PD.lines(s).map((l) => {
    const a = l.split(/[,，]/).map((x) => x.trim()); let key = a[0].toLowerCase(); key = MAT[key] ? key : MATZH[a[0]] || 'brick';
    const d = +a[1] > 0 ? +a[1] : 10; let kv = MAT[key].k, name = '';
    if (a[2] !== undefined && a[2] !== '') { if (isFinite(+a[2])) kv = +a[2]; else name = a[2]; }
    if (a[3]) name = a[3];
    return { key, m: MAT[key], d, k: kv, name: name || MAT[key].n };
  });
  const projFields2 = PD.projFields.map((q) => (q.k === 'oa' ? Object.assign({}, q, { max: 180 }) : q));
  const visArea = (Q) => { let A = 0; for (let i = 0; i < Q.length; i++) { const a = Q[i], b = Q[(i + 1) % Q.length]; A += a.x * b.y - b.x * a.y; } return A / 2; };
  const poly = (Q) => Q.map((q) => pt(q.x, q.y)).join(' ');

  PD.register({
    type: 'wall3d', name: '墙壁 / 窗户剖面(2.5D, 多层材料)',
    defaults: Object.assign({}, PD.projDef, { look: 'color', layers: 'brick, 22', ds: 6, minpx: 4, H: 160, Wd: 200, hot: 'left', tHot: '室内 T_1', tCold: '室外 T_2', arrow: true, tQ: '\\frac{Q}{t}', dimLab: 'value', tD: '', names: true, kLab: false, tA: 'A', lsize: 14 }),
    fields: [
      lookF,
      { k: 'layers', t: 'area', l: '材料层(由左到右, 每行: 材料, 厚度cm [, k] [, 名称])', ph: '材料: 砖 玻璃 混凝土 木 泡沫 棉 空气 灰泥 石 金属\n(或 brick glass concrete wood foam wool air plaster stone metal)\n例: 砖, 11\n例: 空气, 5\n例: 玻璃, 0.6, 1.0, 玻璃(k=1.0)' },
      { k: 'ds', t: 'num', l: '每 cm 画多少 px', step: 1 }, { k: 'minpx', t: 'num', l: '每层最少 px(薄玻璃也看得见)' }, { k: 'H', t: 'num', l: '高' }, { k: 'Wd', t: 'num', l: '纵深(宽)' },
      ...projFields2,
      { k: 'hot', t: 'sel', l: '较热的一边', o: [['left', '左边'], ['right', '右边']] }, { k: 'tHot', t: 'text', l: '较热一边文字' }, { k: 'tCold', t: 'text', l: '较冷一边文字' },
      { k: 'arrow', t: 'bool', l: '热流箭头' }, { k: 'tQ', t: 'text', l: '热流标签', when: (p) => p.arrow },
      { k: 'dimLab', t: 'sel', l: '厚度标注', o: [['value', '数值(cm)'], ['sym', '符号 d, d_1, d_2…'], ['none', '不标']] }, { k: 'tD', t: 'text', l: '总厚度标签(空 = 自动)' },
      { k: 'names', t: 'bool', l: '标出材料名称' }, { k: 'kLab', t: 'bool', l: '标出导热率 k' }, { k: 'tA', t: 'text', l: '面积标签(空 = 不标)' }, { k: 'lsize', t: 'num', l: '字号' },
    ],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const k = K(p), Ls = parseLayers(p.layers); if (!Ls.length) return '';
      const ds = +p.ds || 6, mp = +p.minpx || 4, px = Ls.map((l) => Math.max(mp, l.d * ds)), Xt = px.reduce((a, b) => a + b, 0), H = +p.H || 160, Z = +p.Wd || 200, ls = +p.lsize || 14;
      const Pj = PD.projector(p), pr = (x, y, z) => Pj(x - Xt / 2, y - H / 2, z - Z / 2), P2 = (x, y, z) => { const q = pr(x, y, z); return [q.x, q.y]; };
      const xs = [0]; px.forEach((w, i) => xs.push(xs[i] + w));
      let o = '';
      const lineSeg = (segs) => segs.map(([a, b]) => { const A = pr(...a), B = pr(...b); return `M${pt(A.x, A.y)}L${pt(B.x, B.y)}`; }).join('');
      const pat = (l, type, x0, x1, fx) => {
        const key = l.key, w = x1 - x0, segs = [], dots = [], rng = PD.rng(7 + Math.round(x0));
        // type: xy (z = fx), xz (y = fx), yz (x = fx)
        const P3 = (u, v) => (type === 'xy' ? [x0 + u, v, fx] : type === 'xz' ? [x0 + u, fx, v] : [fx, u, v]);
        const U = type === 'yz' ? H : w, V = type === 'xy' ? H : Z;
        if (key === 'brick') {
          const bh = 10, bl = 30;
          if (type === 'yz') { for (let y = bh; y < H; y += bh) segs.push([[fx, y, 0], [fx, y, Z]]); for (let j = 0; j * bh < H; j++) for (let z = (j % 2 ? bl / 2 : bl); z < Z; z += bl) segs.push([[fx, j * bh, z], [fx, Math.min(H, (j + 1) * bh), z]]); }
          else if (type === 'xy') for (let y = bh; y < H; y += bh) segs.push([P3(0, y), P3(w, y)]);
          else for (let z = bl / 2; z < Z; z += bl / 2) segs.push([P3(0, z), P3(w, z)]);
        } else if (key === 'concrete' || key === 'stone' || key === 'plaster' || key === 'air') {
          const dens = { concrete: 160, stone: 420, plaster: 70, air: 900 }[key], n = Math.round((U * V) / dens);
          for (let i = 0; i < n; i++) dots.push([P3(rng() * U, rng() * V), key === 'stone' ? 2.4 : key === 'plaster' ? 0.5 : 0.9]);
        } else if (key === 'glass') {
          if (type === 'yz') { segs.push([[fx, H * 0.78, Z * 0.12], [fx, H * 0.5, Z * 0.4]]); segs.push([[fx, H * 0.7, Z * 0.12], [fx, H * 0.56, Z * 0.26]]); }
        } else if (key === 'wood') {
          if (type === 'yz') for (let y = 6; y < H; y += 9) { let prev = [fx, y, 0]; for (let z = 8; z <= Z; z += 8) { const q = [fx, clamp(y + 2.2 * Math.sin(z / 14 + y), 0, H), Math.min(z, Z)]; segs.push([prev, q]); prev = q; } }
          else for (let u = w / 4; u < w; u += w / 4) segs.push([P3(u, 0), P3(u, V)]);
        } else if (key === 'foam' || key === 'wool') {
          if (type === 'xy' || type === 'xz') { const st = Math.max(4, w * 0.55); let prev = P3(1, 0), s = 1; for (let v = st / 2; v <= V; v += st / 2) { s = -s; const q = P3(s > 0 ? 1 : w - 1, Math.min(v, V)); segs.push([prev, q]); prev = q; } }
          else { const n = Math.round((U * V) / 220); for (let i = 0; i < n; i++) dots.push([P3(rng() * U, rng() * V), 1.6, true]); }
        } else if (key === 'metal') {
          if (type !== 'yz') for (let c = -V; c < U; c += 6) { const v0 = Math.max(0, -c), v1 = Math.min(V, U - c); if (v0 < v1) segs.push([P3(v0 + c, v0), P3(v1 + c, v1)]); }
        }
        const pc = k.col ? PD.shade(l.m.c, -0.38) : k.bw ? '#555555' : p.stroke;
        let s = segs.length ? `<path d="${lineSeg(segs)}" fill="none" stroke="${pc}" stroke-width="0.7"/>` : '';
        dots.forEach(([q, r, ring]) => { const A = pr(...q); s += ring ? `<circle cx="${f(A.x)}" cy="${f(A.y)}" r="${f(r)}" fill="none" stroke="${pc}" stroke-width="0.6"/>` : `<circle cx="${f(A.x)}" cy="${f(A.y)}" r="${f(r)}" fill="${pc}"/>`; });
        return s;
      };
      Ls.forEach((l, i) => {
        const x0 = xs[i], x1 = xs[i + 1], base = k.col ? l.m.c : k.bw ? PD.shade(gray(l.m.c), 0.35) : '#ffffff', op = l.key === 'glass' && k.col ? ' fill-opacity="0.85"' : '';
        const F = [
          ['xy', Z, [[x0, 0, Z], [x1, 0, Z], [x1, H, Z], [x0, H, Z]], 0],
          ['xy', 0, [[x1, 0, 0], [x0, 0, 0], [x0, H, 0], [x1, H, 0]], -0.05],
          ['xz', H, [[x0, H, Z], [x1, H, Z], [x1, H, 0], [x0, H, 0]], 0.16],
          ['xz', 0, [[x0, 0, 0], [x1, 0, 0], [x1, 0, Z], [x0, 0, Z]], -0.15],
        ];
        if (i === 0) F.push(['yz', x0, [[x0, 0, 0], [x0, 0, Z], [x0, H, Z], [x0, H, 0]], -0.1]);
        if (i === Ls.length - 1) F.push(['yz', x1, [[x1, 0, Z], [x1, 0, 0], [x1, H, 0], [x1, H, Z]], -0.1]);
        F.forEach(([type, fx, V, sh]) => {
          const Q = V.map((v) => pr(...v)); if (visArea(Q) >= -0.5) return;
          o += `<polygon points="${poly(Q)}" fill="${k.ab ? '#ffffff' : PD.shade(base, sh)}"${op} ${S(p, { dash: 'solid', sw: (+p.sw || 1.5) * 0.8 })}/>` + pat(l, type, x0, x1, fx);
        });
      });
      // 标注
      const C2 = P2(Xt / 2, H / 2, Z / 2), down = [0, 1];
      const nb = (A, B) => { const v = [B[0] - A[0], B[1] - A[1]], l = Math.hypot(v[0], v[1]) || 1; let nv = [-v[1] / l, v[0] / l]; const m = [(A[0] + B[0]) / 2 - C2[0], (A[1] + B[1]) / 2 - C2[1]]; if (nv[0] * m[0] + nv[1] * m[1] < 0) nv = [-nv[0], -nv[1]]; return nv; };
      let yOff = 16; const oDim0 = o.length;
      if (p.dimLab !== 'none') {
        const A = P2(0, 0, Z), Bq = P2(Xt, 0, Z), nv = nb(A, Bq);
        if (Ls.length > 1) {
          Ls.forEach((l, i) => { const a = P2(xs[i], 0, Z), b = P2(xs[i + 1], 0, Z), lab = p.dimLab === 'sym' ? `d_${i + 1}` : PD.fmt(l.d) + ' \\rm{cm}'; o += dimL(p, ctx, a, b, nv, 16, Math.hypot(b[0] - a[0], b[1] - a[1]) > 26 ? lab : '', ls - 2); });
          yOff = 52; o += dimL(p, ctx, A, Bq, nv, 50, p.tD || (p.dimLab === 'sym' ? 'd' : PD.fmt(Ls.reduce((s, l) => s + l.d, 0)) + ' \\rm{cm}'), ls - 1);
        } else { o += dimL(p, ctx, A, Bq, nv, 16, p.tD || (p.dimLab === 'sym' ? 'd' : PD.fmt(Ls[0].d) + ' \\rm{cm}'), ls - 1); yOff = 34; }
      }
      if (p.names || p.kLab) {
        const z = ls - 2, items = Ls.map((l, i) => { const a = P2((xs[i] + xs[i + 1]) / 2, 0, Z), t = [p.names ? l.name : '', p.kLab ? `k = ${PD.fmt(l.k)}` : ''].filter(Boolean).join('  '); return { a, t, w: PD.measure ? PD.measure(t, z, false, false, ctx.font) : t.length * z * 0.8 }; });
        const crowd = items.some((q, i) => i && q.a[0] - q.w / 2 < items[i - 1].a[0] + items[i - 1].w / 2 + 6), y0 = Math.max(...items.map((q) => q.a[1])) + yOff + 30;
        if (!crowd) items.forEach((q) => (o += say(ctx, p, q.t, q.a[0], y0, { size: z })));
        else {
          const xL = Math.min(P2(0, 0, Z)[0], P2(0, 0, 0)[0]) - 8;
          let lead = ''; items.forEach((q, i) => { const y = y0 + i * (z + 9); lead += `<path d="M${pt(q.a[0], q.a[1] + yOff + 8)}V${f(y)}H${f(xL)}" fill="none" ${S(p, { dash: 'solid', sw: 0.6 })}/>`; o += say(ctx, p, q.t, xL - 4, y, { size: z, anchor: 'end' }); });
          o = o.slice(0, oDim0) + lead + o.slice(oDim0);
        }
      }
      void down;
      const hotL = p.hot !== 'right', l1 = P2(0, H / 2, Z), l2 = P2(0, H / 2, 0), r1 = P2(Xt, H / 2, Z), r2 = P2(Xt, H / 2, 0), La = l1[0] < l2[0] ? l1 : l2, Ra = r1[0] > r2[0] ? r1 : r2;
      o += say(ctx, p, hotL ? p.tHot : p.tCold, La[0] - 12, La[1] - 30, { anchor: 'end' }) + say(ctx, p, hotL ? p.tCold : p.tHot, Ra[0] + 12, Ra[1] - 30, { anchor: 'start' });
      if (p.arrow) {
        const a = P2(-46, H * 0.5, Z), b = P2(Xt + 46, H * 0.5, Z), [s0, s1] = hotL ? [a, b] : [b, a], dx = s1[0] - s0[0], dy = s1[1] - s0[1], l = Math.hypot(dx, dy) || 1, u = [dx / l, dy / l], v = [-u[1], u[0]], h = 9, hh = 18, hl = 24;
        const Q = [[s0[0] + v[0] * h, s0[1] + v[1] * h], [s1[0] - u[0] * hl + v[0] * h, s1[1] - u[1] * hl + v[1] * h], [s1[0] - u[0] * hl + v[0] * hh, s1[1] - u[1] * hl + v[1] * hh], s1, [s1[0] - u[0] * hl - v[0] * hh, s1[1] - u[1] * hl - v[1] * hh], [s1[0] - u[0] * hl - v[0] * h, s1[1] - u[1] * hl - v[1] * h], [s0[0] - v[0] * h, s0[1] - v[1] * h]];
        o += `<polygon points="${Q.map((q) => pt(q[0], q[1])).join(' ')}" fill="${k.col ? '#e53935' : '#ffffff'}" fill-opacity="${k.col ? 0.78 : 0.9}" ${S(p, { dash: 'solid', sw: 1.1 })}/>`;
        o += say(ctx, p, p.tQ, s0[0] + u[0] * 22, s0[1] + 32, { italic: true });
      }
      if (p.tA) {
        const side = [[0, 0, 0], [0, 0, Z], [0, H, Z], [0, H, 0]].map((v) => pr(...v)), vis = visArea(side) < 0, cx = vis ? 0 : Xt, c = P2(cx, H * 0.62, Z / 2);
        o += say(ctx, p, p.tA, c[0], c[1], { italic: true, size: ls + 2 });
      }
      return o;
    },
  });

  /* ---------- 房屋(2.5D, 门窗可设) ---------- */
  PD.register({
    type: 'house3d', name: '房屋(2.5D, 门窗与尺寸可设)',
    defaults: Object.assign({}, PD.projDef, { oa: 135, ok: 0.55, look: 'color', Lm: 10, Dm: 8, Hm: 3, s: 26, roof: 'flat', rh: 1.6, wc: '#5b86c5', rc: '#7da3d8',
      open: 'front, window, 1.2, 1.1, 1.6, 1.1\nfront, door, 4.2, 0, 1.5, 2.2\nfront, window, 7.2, 1.1, 1.6, 1.1', dims: true, tL: '10 m', tD: '8 m', tH: '3 m', lsize: 14 }),
    fields: [lookF, { k: 'Lm', t: 'num', l: '长 L(m)', step: 0.5 }, { k: 'Dm', t: 'num', l: '深 D(m)', step: 0.5 }, { k: 'Hm', t: 'num', l: '墙高 H(m)', step: 0.5 }, { k: 's', t: 'num', l: '每 m 画多少 px' },
      { k: 'roof', t: 'sel', l: '屋顶', o: [['flat', '平顶'], ['gable', '人字形'], ['mono', '单斜面']] }, { k: 'rh', t: 'num', l: '屋顶高(m)', step: 0.1, when: (p) => p.roof !== 'flat' },
      { k: 'open', t: 'area', l: '门窗(每行: 面, 类型, 距左边, 距地面, 宽, 高; 单位 m)', ph: '面: front 前 / left 左 / right 右 / back 后\n类型: window 窗 / door 门\n例: front, window, 1.2, 1.1, 1.6, 1.1\n例: left, door, 3, 0, 1, 2' },
      { k: 'wc', t: 'color', l: '墙颜色(上色时)' }, { k: 'rc', t: 'color', l: '屋顶颜色(上色时)' }, ...projFields2,
      { k: 'dims', t: 'bool', l: '尺寸线' }, { k: 'tL', t: 'text', l: '长度标签', when: (p) => p.dims }, { k: 'tD', t: 'text', l: '深度标签', when: (p) => p.dims }, { k: 'tH', t: 'text', l: '高度标签', when: (p) => p.dims }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const k = K(p), s = +p.s || 26, Lx = (+p.Lm || 10) * s, D = (+p.Dm || 8) * s, H = (+p.Hm || 3) * s, rh = p.roof === 'flat' ? 0 : (+p.rh || 1.5) * s, ls = +p.lsize || 14;
      const Pj = PD.projector(p), pr = (x, y, z) => Pj(x - Lx / 2, y - H / 2, z + D / 2), P2 = (x, y, z) => { const q = pr(x, y, z); return [q.x, q.y]; };
      const wall = k.col ? p.wc : k.bw ? '#d9d9d9' : '#ffffff', roofC = k.col ? p.rc : k.bw ? '#bdbdbd' : '#ffffff';
      const F = [];
      F.push({ n: 'front', c: wall, sh: 0, V: [[0, 0, 0], [Lx, 0, 0], [Lx, H, 0], [0, H, 0]] });
      F.push({ n: 'back', c: wall, sh: -0.1, V: [[Lx, 0, -D], [0, 0, -D], [0, H, -D], [Lx, H, -D]] });
      F.push({ n: 'bottom', c: wall, sh: -0.2, V: [[0, 0, -D], [Lx, 0, -D], [Lx, 0, 0], [0, 0, 0]] });
      const side = (x, sign) => { let V; if (p.roof === 'gable') V = [[x, 0, -D], [x, 0, 0], [x, H, 0], [x, H + rh, -D / 2], [x, H, -D]]; else if (p.roof === 'mono') V = [[x, 0, -D], [x, 0, 0], [x, H, 0], [x, H + rh, -D]]; else V = [[x, 0, -D], [x, 0, 0], [x, H, 0], [x, H, -D]]; return sign > 0 ? V.reverse() : V; };
      F.push({ n: 'left', c: wall, sh: -0.18, V: side(0, -1) });
      F.push({ n: 'right', c: wall, sh: -0.18, V: side(Lx, 1) });
      if (p.roof === 'gable') { F.push({ n: 'roof', c: roofC, sh: 0.05, V: [[0, H, 0], [Lx, H, 0], [Lx, H + rh, -D / 2], [0, H + rh, -D / 2]] }); F.push({ n: 'roof2', c: roofC, sh: 0.12, V: [[Lx, H, -D], [0, H, -D], [0, H + rh, -D / 2], [Lx, H + rh, -D / 2]] }); }
      else if (p.roof === 'mono') F.push({ n: 'roof', c: roofC, sh: 0.08, V: [[0, H, 0], [Lx, H, 0], [Lx, H + rh, -D], [0, H + rh, -D]] });
      else F.push({ n: 'roof', c: roofC, sh: 0.1, V: [[0, H, 0], [Lx, H, 0], [Lx, H, -D], [0, H, -D]] });
      let o = ''; const vis = {};
      F.forEach((fa) => { const Q = fa.V.map((v) => pr(...v)); if (visArea(Q) >= -0.5) return; vis[fa.n] = true; o += `<polygon points="${poly(Q)}" fill="${k.ab ? '#ffffff' : PD.shade(fa.c, fa.sh)}" ${sd(p)}/>`; });
      // 门窗
      const map = { front: (u, v) => [u, v, 0], back: (u, v) => [Lx - u, v, -D], left: (u, v) => [0, v, -D + u], right: (u, v) => [Lx, v, -u] };
      PD.lines(p.open).forEach((line) => {
        const a = line.split(/[,，]/).map((x) => x.trim()), face = { 前: 'front', 后: 'back', 左: 'left', 右: 'right' }[a[0]] || a[0].toLowerCase(); if (!map[face] || !vis[face]) return;
        const door = /door|门/.test(a[1] || ''), u = (+a[2] || 0) * s, v = (+a[3] || 0) * s, w = (+a[4] || 1) * s, h = (+a[5] || 1) * s, M = map[face];
        const Q = [[u, v], [u + w, v], [u + w, v + h], [u, v + h]].map(([x, y]) => pr(...M(x, y)));
        const gl = k.col ? (door ? '#e3eef8' : '#d8ecf8') : k.bw ? '#f2f2f2' : '#ffffff';
        o += `<polygon points="${poly(Q)}" fill="${gl}" ${S(p, { dash: 'solid', sw: (+p.sw || 1.5) * 0.8 })}/>`;
        if (!k.ab || true) { const g1 = pr(...M(u + w * 0.2, v + h * 0.35)), g2 = pr(...M(u + w * 0.55, v + h * 0.8)), g3 = pr(...M(u + w * 0.42, v + h * 0.25)), g4 = pr(...M(u + w * 0.72, v + h * 0.62)); o += `<path d="M${pt(g1.x, g1.y)}L${pt(g2.x, g2.y)}M${pt(g3.x, g3.y)}L${pt(g4.x, g4.y)}" stroke="${k.col ? '#ffffff' : p.stroke}" stroke-width="${k.col ? 1.6 : 0.6}" stroke-opacity="${k.col ? 0.9 : 0.6}"/>`; }
      });
      if (p.dims) {
        const C = P2(Lx / 2, H / 2, -D / 2), nb = (A, B) => { const v = [B[0] - A[0], B[1] - A[1]], l = Math.hypot(v[0], v[1]) || 1; let nv = [-v[1] / l, v[0] / l]; const m = [(A[0] + B[0]) / 2 - C[0], (A[1] + B[1]) / 2 - C[1]]; if (nv[0] * m[0] + nv[1] * m[1] < 0) nv = [-nv[0], -nv[1]]; return nv; };
        const sx = vis.left ? 0 : Lx, A1 = P2(0, 0, 0), B1 = P2(Lx, 0, 0);
        o += dimL(p, ctx, A1, B1, nb(A1, B1), 16, p.tL, ls);
        const A2 = P2(sx, 0, 0), B2 = P2(sx, 0, -D); o += dimL(p, ctx, A2, B2, nb(A2, B2), 16, p.tD, ls);
        const A3 = P2(sx, 0, -D), B3 = P2(sx, H, -D), v3 = vis.left ? [-1, 0] : [1, 0]; o += dimL(p, ctx, A3, B3, v3, 18, p.tH, ls);
      }
      return o;
    },
  });

  /* ---------- 汽车能量流程(俯视) ---------- */
  const CAR = {
    ev: { boxes: [['M', -70, -100, 140, 40, 'tMot', '#ffe082'], ['C', -55, -12, 110, 36, 'tCtl', '#d1c4e9'], ['B', -85, 70, 170, 62, 'tBat', '#c5e1a5']],
      drive: [[[-30, 70], [-30, 24]], [[-30, -12], [-30, -60]], [[-30, -100], [-30, -146]]], back: [[[30, -146], [30, -100]], [[30, -60], [30, -12]], [[30, 24], [30, 70]]], charge: [], reg: [38, -124] },
    hybrid: { boxes: [['E', -112, -112, 96, 48, 'tEng', '#ffccbc'], ['M', 14, -112, 98, 48, 'tMot', '#ffe082'], ['F', -104, 96, 76, 44, 'tFuel', '#cfd8dc'], ['B', 18, 82, 92, 58, 'tBat', '#c5e1a5']],
      drive: [[[-70, 96], [-70, -64]], [[-64, -112], [-64, -146]], [[44, 82], [44, -64]], [[44, -112], [44, -146]]], back: [[[86, -146], [86, -112]], [[86, -64], [86, 82]]], charge: [[[-16, -82], [14, -82]]], reg: [92, -10] },
    ice: { boxes: [['E', -70, -112, 140, 50, 'tEng', '#ffccbc'], ['G', -44, -28, 88, 32, 'tGear', '#cfd8dc'], ['F', -110, 96, 76, 44, 'tFuel', '#cfd8dc']],
      drive: [[[-72, 96], [-72, -62]], [[0, -62], [0, -28]], [[14, 4], [14, 146]]], back: [], charge: [], reg: null },
  };
  PD.register({
    type: 'carflow', name: '汽车能量流程(电动 / 混合动力 / 汽油, 俯视)',
    defaults: { look: 'color', mode: 'ev', regen: true, loss: true, legend: true, blank: 'text', tBat: '电池组', tMot: '电动机 / 发电机', tCtl: '控制器', tEng: '内燃机', tFuel: '油缸', tGear: '变速箱', tReg: '再生制动', tDrive: '驱动', tBack: '再生制动(回收能量)', tCharge: '发动机带动发电机充电', tLoss: '热(损失)', lsize: 14 },
    fields: [lookF, { k: 'mode', t: 'sel', l: '汽车', o: [['ev', '电动车'], ['hybrid', '混合动力车'], ['ice', '汽油车']], rebuild: true },
      { k: 'regen', t: 'bool', l: '再生制动(回收)箭头', when: (p) => p.mode !== 'ice' }, { k: 'loss', t: 'bool', l: '能量损失(热)' }, { k: 'legend', t: 'bool', l: '图例' }, blankF,
      { k: 'tBat', t: 'text', l: '电池组', when: (p) => p.mode !== 'ice' }, { k: 'tMot', t: 'text', l: '电动机', when: (p) => p.mode !== 'ice' }, { k: 'tCtl', t: 'text', l: '控制器', when: (p) => p.mode === 'ev' },
      { k: 'tEng', t: 'text', l: '内燃机', when: (p) => p.mode !== 'ev' }, { k: 'tFuel', t: 'text', l: '油缸', when: (p) => p.mode !== 'ev' }, { k: 'tGear', t: 'text', l: '变速箱', when: (p) => p.mode === 'ice' }, { k: 'tReg', t: 'text', l: '再生制动标签', when: (p) => p.mode !== 'ice' },
      { k: 'tDrive', t: 'text', l: '图例: 驱动', when: (p) => p.legend }, { k: 'tBack', t: 'text', l: '图例: 回收', when: (p) => p.legend && p.mode !== 'ice' }, { k: 'tCharge', t: 'text', l: '图例: 充电', when: (p) => p.legend && p.mode === 'hybrid' }, { k: 'tLoss', t: 'text', l: '图例: 损失', when: (p) => p.legend && p.loss }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const k = K(p), cfg = CAR[p.mode] || CAR.ev, ls = +p.lsize || 14;
      const RED = k.col ? '#d32f2f' : p.stroke, BLUE = k.col ? '#1e88e5' : p.stroke, GRN = k.col ? '#43a047' : p.stroke, GRY = k.col ? '#9e9e9e' : p.stroke;
      const dB = k.col ? '' : '7 4', dG = k.col ? '' : '2 3';
      let o = '';
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => (o += `<rect x="${sx < 0 ? -160 : 124}" y="${sy * 150 - 40}" width="36" height="80" rx="12" fill="${k.col ? '#263238' : k.bw ? '#555555' : '#ffffff'}" ${sd(p)}/>`));
      o += `<path d="M-95,-230Q0,-244 95,-230Q122,-224 122,-190L124,190Q124,228 92,232L-92,232Q-124,228 -124,190L-122,-190Q-122,-224 -95,-230Z" fill="${k.col ? '#f5f5f5' : '#ffffff'}" ${sd(p)}/>`;
      [-150, 150].forEach((y) => (o += `<line x1="-128" y1="${y}" x2="128" y2="${y}" stroke="${p.stroke}" stroke-width="7"/><line x1="-128" y1="${y}" x2="128" y2="${y}" stroke="${k.col ? '#cfd8dc' : '#ffffff'}" stroke-width="4"/>`));
      if (p.mode === 'ice') o += `<line x1="0" y1="4" x2="0" y2="150" stroke="${p.stroke}" stroke-width="7"/><line x1="0" y1="4" x2="0" y2="150" stroke="${k.col ? '#cfd8dc' : '#ffffff'}" stroke-width="4"/>`;
      if (p.loss) {
        const hc = GRY;
        if (p.mode !== 'ev') { const hy = p.mode === 'hybrid', ex = hy ? -1 : 1; o += hy ? wav(-112, -88, -150, -60, hc, 1.2) : wav(-70, -88, -112, -60, hc, 1.2) + wav(70, -88, 112, -60, hc, 1.2); o += `<path d="M${ex * (hy ? 100 : 60)},-62C${ex * 112},-40 ${ex * 114},120 ${ex * 112},236" fill="none" stroke="${p.stroke}" stroke-width="3"/>` + wav(ex * 112, 238, ex * 118, 284, hc, 1.2); }
        else o += wav(-55, 6, -100, 30, hc, 1.2);
        if (p.mode === 'ice' || !p.regen) [[-1, -1], [1, -1]].forEach(([sx]) => (o += wav(sx * 160, -150, sx * 200, -182, hc, 1.2)));
      }
      const bx = {};
      cfg.boxes.forEach(([id, x, y, w, h, key, c], i) => { bx[id] = 1; o += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9" fill="${k.col ? c : k.bw ? PD.shade(gray(c), 0.25) : '#ffffff'}" ${sd(p)}/>` + (p.blank === 'none' ? '' : L.partLabel(ctx, p, p[key], i, x + w / 2, y + h / 2, 'middle')); });
      cfg.drive.forEach((q) => (o += arrowPL(q, RED, 2.2)));
      if (p.mode !== 'ice' && p.regen) { cfg.back.forEach((q) => (o += arrowPL(q, BLUE, 2.2, dB))); if (cfg.reg && p.blank !== 'none') o += L.partLabel(ctx, p, p.tReg, cfg.boxes.length, cfg.reg[0], cfg.reg[1], 'start'); }
      cfg.charge.forEach((q) => (o += arrowPL(q, GRN, 2.2, dG)));
      if (p.legend) {
        const items = [[RED, '', p.tDrive]]; if (p.mode !== 'ice' && p.regen) items.push([BLUE, dB, p.tBack]); if (p.mode === 'hybrid') items.push([GRN, dG, p.tCharge]);
        let y = -60; items.forEach(([c, da, t]) => { o += arrowPL([[190, y], [236, y]], c, 2.2, da) + say(ctx, p, t, 244, y, { anchor: 'start', size: ls - 1 }); y += 30; });
        if (p.loss) o += wav(190, y, 236, y, GRY, 1.2) + say(ctx, p, p.tLoss, 244, y, { anchor: 'start', size: ls - 1 });
      }
      return o;
    },
  });

  /* ======================================================================
     能源与能源消耗
     ====================================================================== */
  const ZOF = { H: 1, He: 2, Li: 3, Be: 4, B: 5, C: 6, N: 7, O: 8, F: 9, Ne: 10, Na: 11, Mg: 12, Al: 13, Si: 14, S: 16, Ar: 18, Ca: 20, Ti: 22, Fe: 26, Co: 27, Ni: 28, Cu: 29, Zn: 30, Kr: 36, Sr: 38, Zr: 40, Mo: 42, Ag: 47, Sn: 50, Xe: 54, Ba: 56, Au: 79, Pb: 82, Th: 90, U: 92, Pu: 94 };
  const BEXP = { '1H': 0, '2H': 1.112, '3H': 2.827, '3He': 2.573, '4He': 7.074, '6Li': 5.332, '7Li': 5.606, '9Be': 6.463, '10B': 6.475, '11B': 6.928, '12C': 7.680, '14N': 7.476, '16O': 7.976, '19F': 7.779, '20Ne': 8.032, '23Na': 8.112, '24Mg': 8.261, '27Al': 8.332, '28Si': 8.448, '32S': 8.493, '40Ca': 8.551, '48Ti': 8.723, '56Fe': 8.790, '59Co': 8.768, '62Ni': 8.795, '63Cu': 8.752, '84Kr': 8.717, '88Sr': 8.733, '90Zr': 8.710, '92Kr': 8.513, '98Mo': 8.635, '107Ag': 8.554, '120Sn': 8.504, '138Ba': 8.393, '141Ba': 8.326, '197Au': 7.916, '208Pb': 7.867, '232Th': 7.615, '235U': 7.591, '238U': 7.570, '239Pu': 7.560 };
  const BCURVE = [[2, 1.112], [3, 2.6], [6, 5.332], [7, 5.606], [9, 6.463], [11, 6.928], [14, 7.476], [19, 7.779], [23, 8.112], [28, 8.448], [32, 8.493], [40, 8.551], [48, 8.723], [56, 8.790], [62, 8.795], [70, 8.73], [84, 8.717], [100, 8.605], [120, 8.504], [138, 8.393], [160, 8.183], [180, 8.035], [197, 7.916], [208, 7.867], [232, 7.615], [238, 7.570], [250, 7.45]];
  const monoSpline = (P) => {
    const n = P.length, x = P.map((q) => q[0]), y = P.map((q) => q[1]), d = [], m = [];
    for (let i = 0; i < n - 1; i++) d.push((y[i + 1] - y[i]) / (x[i + 1] - x[i]));
    m[0] = d[0]; m[n - 1] = d[n - 2]; for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
    for (let i = 0; i < n - 1; i++) { if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; } const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b; if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; } }
    return (X) => { if (X <= x[0]) return y[0]; if (X >= x[n - 1]) return y[n - 1]; let i = 0; while (X > x[i + 1]) i++; const h = x[i + 1] - x[i], t = (X - x[i]) / h, t2 = t * t, t3 = t2 * t; return (2 * t3 - 3 * t2 + 1) * y[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * y[i + 1] + (t3 - t2) * h * m[i + 1]; };
  };
  const BE = monoSpline(BCURVE);
  PD.register({
    type: 'bindcurve', name: '每核子结合能曲线',
    defaults: { W: 440, H: 260, Amax: 250, Ymax: 9, marks: '2 H\n4 He\n12 C\n16 O\n56 Fe\n235 U', nucStyle: 'nuc', regions: true, peak: true, ticks: true, cc: '#000000', cw: 2, xl: '核子数 A', yl: '每核子的结合能 / \\rm{MeV}', tFus: '聚变', tFis: '裂变', tPeak: '', lsize: 13 },
    fields: [
      { k: 'marks', t: 'area', l: '标出的核素(每行: 质量数 元素符号)', ph: '例: 56 Fe\n例: 4 He\n例: 235 U\n(数值来自实验数据表；表中没有的核素按曲线取值)' },
      { k: 'nucStyle', t: 'sel', l: '核素写法', o: [['nuc', '左上 A 左下 Z'], ['mass', '左上 A'], ['dash', 'Fe-56'], ['none', '只画点']] },
      { k: 'regions', t: 'bool', l: '聚变 / 裂变箭头' }, { k: 'tFus', t: 'text', l: '聚变文字', when: (p) => p.regions }, { k: 'tFis', t: 'text', l: '裂变文字', when: (p) => p.regions },
      { k: 'peak', t: 'bool', l: '铁-56 处画虚线' }, { k: 'tPeak', t: 'text', l: '峰值注释(如 最稳定)', when: (p) => p.peak }, { k: 'ticks', t: 'bool', l: '刻度与数值' },
      { k: 'W', t: 'num', l: '宽' }, { k: 'H', t: 'num', l: '高' }, { k: 'Amax', t: 'num', l: 'A 最大值' }, { k: 'Ymax', t: 'num', l: '纵轴最大值' }, { k: 'xl', t: 'text', l: '横轴标签' }, { k: 'yl', t: 'text', l: '纵轴标签' },
      { k: 'cc', t: 'color', l: '曲线颜色' }, { k: 'cw', t: 'num', l: '曲线粗细', step: 0.5 }, { k: 'lsize', t: 'num', l: '字号' },
    ],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const W = +p.W, H = +p.H, Am = Math.max(20, +p.Amax), Ym = Math.max(1, +p.Ymax), ls = +p.lsize || 13, X = (a) => (a / Am) * W, Y = (b) => H - (b / Ym) * H;
      let o = `<path d="M0,${f(H)}H${f(W + 14)}M0,${f(H)}V-14" fill="none" ${sd(p)}/>` + PD.arrowHead(W + 20, H, 0, 9, 'full', p.stroke, 1) + PD.arrowHead(0, -20, -Math.PI / 2, 9, 'full', p.stroke, 1);
      o += T(ctx, 'O', -8, H + 10, { size: ls, color: p.stroke, italic: true }) + T(ctx, p.xl, W + 24, H + 2, { size: ls, anchor: 'start', italic: false, color: p.stroke }) + T(ctx, p.yl, 6, -28, { size: ls, anchor: 'start', italic: false, color: p.stroke });
      if (p.ticks) { let d = ''; for (let a = 50; a <= Am; a += 50) { d += `M${f(X(a))},${f(H)}v5`; o += T(ctx, String(a), X(a), H + 16, { size: ls - 1, italic: false, color: p.stroke }); } for (let b = 1; b <= Ym; b++) { d += `M0,${f(Y(b))}h-5`; o += T(ctx, String(b), -9, Y(b), { size: ls - 1, anchor: 'end', italic: false, color: p.stroke }); } o += `<path d="${d}" fill="none" ${sd(p)}/>`; }
      let c = ''; for (let a = 2; a <= Am; a += a < 30 ? 0.5 : 2) c += (c ? 'L' : 'M') + pt(X(a), Y(BE(a)));
      o += `<path d="${c}" fill="none" stroke="${p.cc}" stroke-width="${f(+p.cw || 2)}" stroke-linejoin="round"/>`;
      if (p.peak) { o += `<path d="M${f(X(56))},${f(Y(8.79))}V${f(H)}" fill="none" ${S(p, { dash: 'dash', sw: 0.8 })}/>`; if (p.tPeak) o += T(ctx, p.tPeak, X(56) + 8, Y(8.79) + 24, { anchor: 'start', size: ls - 1, italic: false, color: p.stroke, halo: true }); }
      if (p.regions) { o += L.arrow(p, X(12), Y(3), X(48), Y(3), { sw: 1.6, ah: 9 }) + T(ctx, p.tFus, X(30), Y(3) - 14, { size: ls, italic: false, color: p.stroke, halo: true }); o += L.arrow(p, X(Math.min(Am - 10, 232)), Y(6.3), X(120), Y(6.3), { sw: 1.6, ah: 9 }) + T(ctx, p.tFis, X(176), Y(6.3) - 14, { size: ls, italic: false, color: p.stroke, halo: true }); }
      PD.lines(p.marks).forEach((line) => {
        const m = /^(\d+)\s*[-\s]?\s*([A-Za-z]{1,2})$/.exec(line.replace(/\s+/g, ' ').trim()) || /^([A-Za-z]{1,2})\s*-?\s*(\d+)$/.exec(line.trim()); if (!m) return;
        const A = +(isFinite(+m[1]) ? m[1] : m[2]), sym = isFinite(+m[1]) ? m[2] : m[1], key = A + sym, b = BEXP[key] ?? BE(A); if (A > Am) return;
        const x = X(A), y = Y(b), right = x < W * 0.75;
        o += `<circle cx="${f(x)}" cy="${f(y)}" r="3.4" fill="${p.stroke}"/>`;
        const Z = ZOF[sym], lab = p.nucStyle === 'nuc' && Z ? `\\nuc{${A}}{${Z}}{${sym}}` : p.nucStyle === 'mass' ? `{}^{${A}}\\rm{${sym}}` : p.nucStyle === 'dash' ? `\\rm{${sym}}-${A}` : p.nucStyle === 'nuc' ? `{}^{${A}}\\rm{${sym}}` : '';
        if (lab) o += T(ctx, lab, x + (right ? 8 : -8), y + (A < 10 ? 6 : -14), { size: ls, anchor: right ? 'start' : 'end', italic: false, color: p.stroke, halo: true });
      });
      return o;
    },
  });

  /* ---------- 压水式核电站(示意) ---------- */
  PD.register({
    type: 'pwr', name: '压水式核电站(示意, 部件可留空)',
    defaults: { look: 'abstract', ins: 0.4, pres: true, cool: 'tower', flow: true, blank: 'text', tCont: '安全壳(混凝土)', tCore: '反应堆压力容器', tFuel: '燃料棒', tRod: '控制棒', tPri: '第一回路(高压水作冷却剂及减速剂)', tSG: '蒸汽发生器', tPump: '水泵', tSec: '第二回路', tTurb: '涡轮机', tGen: '发电机', tCond: '冷凝器', tCool: '冷却塔', tSteam: '蒸汽', tPres: '稳压器', tOut: '电能输出', lsize: 13 },
    fields: [lookF, { k: 'ins', t: 'range', l: '控制棒插入深度', min: 0, max: 1, step: 0.05 }, { k: 'pres', t: 'bool', l: '稳压器' }, { k: 'cool', t: 'sel', l: '冷却', o: [['tower', '冷却塔'], ['sea', '海水 / 河水'], ['none', '不画']] }, { k: 'flow', t: 'bool', l: '流向箭头' }, blankF,
      { k: 'tCont', t: 'text', l: '安全壳' }, { k: 'tCore', t: 'text', l: '反应堆' }, { k: 'tFuel', t: 'text', l: '燃料棒' }, { k: 'tRod', t: 'text', l: '控制棒' }, { k: 'tPri', t: 'text', l: '第一回路' }, { k: 'tSG', t: 'text', l: '蒸汽发生器' }, { k: 'tPump', t: 'text', l: '水泵' },
      { k: 'tSec', t: 'text', l: '第二回路' }, { k: 'tTurb', t: 'text', l: '涡轮机' }, { k: 'tGen', t: 'text', l: '发电机' }, { k: 'tCond', t: 'text', l: '冷凝器' }, { k: 'tCool', t: 'text', l: '冷却塔 / 海水', when: (p) => p.cool !== 'none' }, { k: 'tSteam', t: 'text', l: '蒸汽' }, { k: 'tPres', t: 'text', l: '稳压器', when: (p) => p.pres }, { k: 'tOut', t: 'text', l: '电能输出' }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const k = K(p), HOT = '#e53935', CLD = '#7e57c2', STM = '#cfd8dc', FW = '#64b5f6', CW = '#4fc3f7', WW = '#ffab91';
      const fa = (x, y, ang, c) => (p.flow ? PD.arrowHead(x, y, ang, 10, 'tri', k.col ? PD.shade(c, -0.35) : p.stroke, 1) : '');
      const R0 = 0, LF = Math.PI, UP = -Math.PI / 2, DN = Math.PI / 2;
      const dome = 'M0,370V120Q0,30 170,30Q340,30 340,120V370Z', domeIn = 'M10,360V122Q10,42 170,42Q330,42 330,122V360Z';
      let o = `<path d="${dome}" ${k.ab ? PD.fillAttr({ fillMode: 'dots', fill: p.stroke }, ctx) : `fill="${k.col ? '#b0b0b0' : '#cfcfcf'}"`} ${sd(p)}/><path d="${domeIn}" fill="${k.col ? '#eef3f7' : '#ffffff'}" ${sd(p)}/>`;
      // 第一回路
      o += pipe(p, k, 'M130,170H205', HOT) + pipe(p, k, 'M240,330V350H85V330', CLD);
      if (p.pres) o += pipe(p, k, 'M163,170V118', HOT, 7) + `<rect x="150" y="70" width="26" height="52" rx="13" fill="${fc(k, '#ffcdd2')}" ${sd(p)}/>`;
      o += `<rect x="40" y="150" width="90" height="182" rx="26" fill="${k.col ? '#d6ebf8' : '#ffffff'}" ${S(p, { dash: 'solid', sw: 2.4 })}/>`;
      [58, 76, 94, 112].forEach((x) => (o += `<rect x="${x - 4}" y="210" width="8" height="104" rx="2" fill="${k.col ? '#f0a35e' : k.bw ? '#9e9e9e' : '#ffffff'}" ${thin(p, 0.8)}/>`));
      const yb = 175 + clamp(+p.ins, 0, 1) * 130;
      [67, 85, 103].forEach((x) => (o += `<rect x="${x - 3}" y="118" width="6" height="${f(yb - 118)}" fill="${k.col ? '#37474f' : k.bw ? '#424242' : '#ffffff'}" ${thin(p, 0.8)}/>`));
      o += `<rect x="54" y="110" width="62" height="9" rx="2" fill="${fc(k, '#455a64')}" ${sd(p)}/>`;
      // 蒸汽发生器
      o += `<rect x="205" y="95" width="70" height="240" rx="35" fill="${k.col ? '#e3f2fd' : '#ffffff'}" ${S(p, { dash: 'solid', sw: 2.2 })}/>`;
      let coil = 'M205,170H262'; for (let i = 1; i <= 5; i++) coil += `V${170 + 28 * i}H${i % 2 ? 218 : 262}`; coil += 'V315H240V330';
      o += `<path d="${coil}" fill="none" stroke="${p.stroke}" stroke-width="6" stroke-linejoin="round"/><path d="${coil}" fill="none" stroke="${k.col ? '#ef9a9a' : k.bw ? '#bdbdbd' : '#ffffff'}" stroke-width="3.4" stroke-linejoin="round"/>`;
      // 第二回路
      o += pipe(p, k, 'M240,95V80H400', STM) + pipe(p, k, 'M450,118V200', STM) + pipe(p, k, 'M420,290V350H300V300H275', FW);
      o += `<path d="M400,60L480,30V130L400,100Z" fill="${fc(k, '#b0bec5')}" ${sd(p)}/>`;
      for (let i = 1; i < 4; i++) o += `<line x1="${400 + i * 20}" y1="${f(60 - i * 7.5)}" x2="${400 + i * 20}" y2="${f(100 + i * 7.5)}" ${thin(p, 0.6)}/>`;
      o += `<rect x="480" y="76" width="40" height="8" fill="${fc(k, '#90a4ae')}" ${thin(p)}/><circle cx="548" cy="80" r="28" fill="${fc(k, '#ffe082')}" ${sd(p)}/>` + T(ctx, 'G', 548, 80, { size: 20, color: p.stroke });
      o += L.arrow(p, 576, 80, 640, 80, { sw: 2, ah: 10, color: k.col ? '#f9a825' : p.stroke }) + say(ctx, p, p.tOut, 646, 80, { anchor: 'start', size: (+p.lsize || 13) });
      o += `<rect x="390" y="200" width="120" height="90" rx="6" fill="${k.col ? '#e1f5fe' : '#ffffff'}" ${sd(p)}/>`;
      const cc = 'M510,275H400V255H500V235H400V215H510';
      o += `<path d="${cc}" fill="none" stroke="${p.stroke}" stroke-width="5.5" stroke-linejoin="round"/><path d="${cc}" fill="none" stroke="${k.col ? '#80deea' : k.bw ? '#bdbdbd' : '#ffffff'}" stroke-width="3" stroke-linejoin="round"/>`;
      o += `<circle cx="175" cy="350" r="11" fill="${fc(k, '#90a4ae')}" ${sd(p)}/><path d="M169,343L183,350L169,357" fill="none" stroke="${p.stroke}" stroke-width="1.2" transform="rotate(180 175 350)"/>`;
      o += `<circle cx="360" cy="350" r="11" fill="${fc(k, '#90a4ae')}" ${sd(p)}/><path d="M354,343L368,350L354,357" fill="none" stroke="${p.stroke}" stroke-width="1.2" transform="rotate(180 360 350)"/>`;
      // 冷却
      if (p.cool === 'tower') {
        o += pipe(p, k, 'M510,215H548V250H588', WW) + pipe(p, k, 'M580,322H530V275H510', CW);
        o += `<path d="M566,334Q592,236 582,140H642Q632,236 658,334Z" fill="${fc(k, '#e0e0e0')}" ${sd(p)}/>`;
        if (k.ab) [0, 1, 2].forEach((i) => (o += `<path d="M${596 + i * 10},132q-8,-12 0,-24t0,-24" fill="none" ${S(p, { dash: 'solid', sw: 0.9 })}/>`));
        else [[600, 126, 14], [618, 116, 16], [606, 100, 13], [624, 92, 12]].forEach(([x, y, r]) => (o += `<circle cx="${x}" cy="${y}" r="${r}" fill="#ffffff" ${thin(p, 0.6)}/>`));
        o += fa(590, 250, R0, WW) + fa(528, 300, UP, CW);
      } else if (p.cool === 'sea') {
        o += pipe(p, k, 'M510,215H660V300', WW) + pipe(p, k, 'M600,300V275H510', CW);
        o += `<rect x="540" y="300" width="150" height="66" fill="${k.col ? '#81d4fa' : '#ffffff'}" ${sd(p)}/>`;
        for (let y = 316; y < 366; y += 14) o += `<path d="M548,${y}q8,-5 16,0t16,0t16,0t16,0t16,0t16,0t16,0t16,0" fill="none" ${S(p, { dash: 'solid', sw: 0.7 })}/>`;
        o += fa(660, 270, DN, WW) + fa(560, 275, LF, CW);
      }
      o += fa(176, 170, R0, HOT) + fa(130, 350, LF, CLD) + fa(330, 80, R0, STM) + fa(450, 168, DN, STM) + fa(330, 350, LF, FW) + fa(300, 322, UP, FW);
      // 标注
      const B = (t, i, x, y, a, lx, ly, lx2, ly2) => P(ctx, p, t, i, x, y, a, lx, ly, lx2, ly2);
      o += B(p.tCont, 0, -34, 40, 'end', 34, 80, -28, 40) + B(p.tCore, 1, -34, 250, 'end', 40, 250, -28, 250) + B(p.tFuel, 2, -34, 300, 'end', 54, 300, -28, 300) + B(p.tRod, 3, -34, 150, 'end', 64, 140, -28, 150);
      o += B(p.tPri, 4, 70, 414, 'middle', 110, 352, 90, 400) + B(p.tSG, 5, 240, -12, 'middle', 240, 98, 240, 2);
      if (p.blank !== 'none') o += leader(p, 175, 361, 292, 402) + leader(p, 360, 361, 308, 402) + L.partLabel(ctx, p, p.tPump, 6, 300, 414, 'middle');
      o += B(p.tSec, 7, 365, 60, 'middle') + B(p.tTurb, 8, 440, -10, 'middle', 440, 45, 440, 4) + B(p.tGen, 9, 548, 124, 'middle') + B(p.tCond, 10, 470, 312, 'middle', 470, 290, 470, 300);
      if (p.cool === 'tower') o += B(p.tCool, 11, 684, 210, 'start', 648, 210, 680, 210); else if (p.cool === 'sea') o += B(p.tCool, 11, 615, 390, 'middle', 615, 366, 615, 378);
      o += B(p.tSteam, 12, 300, 64, 'middle');
      if (p.pres) o += B(p.tPres, 13, 163, -12, 'middle', 163, 70, 163, 2);
      return o;
    },
  });

  /* ---------- 风力涡轮机 ---------- */
  PD.register({
    type: 'windt', name: '风力涡轮机',
    defaults: { look: 'abstract', view: 'front', ang: 0, R: 120, Ht: 280, swept: false, wind: true, cut: true, blank: 'text', tBlade: '叶片', tHub: '轮毂', tNac: '机舱', tTower: '塔架', tGear: '齿轮箱', tGen: '发电机', tWind: '风', tR: 'r', lsize: 14 },
    fields: [lookF, { k: 'view', t: 'sel', l: '视图', o: [['front', '正面'], ['side', '侧面(剖开机舱)']], rebuild: true }, { k: 'ang', t: 'range', l: '叶片转角°', min: 0, max: 120, step: 1, when: (p) => p.view === 'front' },
      { k: 'R', t: 'num', l: '叶片长度' }, { k: 'Ht', t: 'num', l: '塔高' }, { k: 'swept', t: 'bool', l: '扫掠面积(虚线圆与半径 r)', when: (p) => p.view === 'front' },
      { k: 'cut', t: 'bool', l: '剖开机舱(齿轮箱、发电机)', when: (p) => p.view === 'side' }, { k: 'wind', t: 'bool', l: '风的箭头', when: (p) => p.view === 'side' }, blankF,
      { k: 'tBlade', t: 'text', l: '叶片' }, { k: 'tHub', t: 'text', l: '轮毂', when: (p) => p.view === 'front' }, { k: 'tNac', t: 'text', l: '机舱', when: (p) => p.view === 'side' }, { k: 'tTower', t: 'text', l: '塔架' },
      { k: 'tGear', t: 'text', l: '齿轮箱', when: (p) => p.view === 'side' && p.cut }, { k: 'tGen', t: 'text', l: '发电机', when: (p) => p.view === 'side' && p.cut }, { k: 'tWind', t: 'text', l: '风', when: (p) => p.view === 'side' && p.wind }, { k: 'tR', t: 'text', l: '半径标签', when: (p) => p.swept }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const k = K(p), R = +p.R || 120, Ht = +p.Ht || 280, body = fc(k, '#eceff1');
      let o = `<path d="M-7,14L-15,${f(Ht)}H15L7,14Z" fill="${body}" ${sd(p)}/><line x1="-60" y1="${f(Ht)}" x2="60" y2="${f(Ht)}" ${S(p, { dash: 'solid', sw: (+p.sw || 1.5) * 1.4 })}/>`;
      if (p.view === 'front') {
        if (p.swept) o += `<circle r="${f(R)}" fill="none" ${S(p, { dash: 'dash', sw: 0.9 })}/>` + L.arrow(p, 0, 0, R * Math.cos(-30 * D2R), R * Math.sin(-30 * D2R), { sw: 1, ah: 7 }) + say(ctx, p, p.tR, R * 0.5 * Math.cos(-30 * D2R) + 6, R * 0.5 * Math.sin(-30 * D2R) - 10, { italic: true });
        const blade = `M-4,-12C-15,-34 -12,${f(-R * 0.55)} -2,${f(-R)}L2,${f(-R)}C9,${f(-R * 0.5)} 11,-34 6,-12Z`;
        for (let i = 0; i < 3; i++) o += `<path d="${blade}" transform="rotate(${f(+p.ang + i * 120)})" fill="${body}" ${sd(p)}/>`;
        o += `<circle r="13" fill="${fc(k, '#cfd8dc')}" ${sd(p)}/>`;
        const ba = (+p.ang + 120) * D2R, bp = [R * 0.6 * Math.sin(ba), -R * 0.6 * Math.cos(ba)];
        o += P(ctx, p, p.tBlade, 0, R + 30, -R * 0.75, 'start', bp[0], bp[1], R + 26, -R * 0.75) + P(ctx, p, p.tHub, 1, -R - 30, -R * 0.3, 'end', -10, -8, -R - 26, -R * 0.3) + P(ctx, p, p.tTower, 2, 50, Ht * 0.6, 'start', 12, Ht * 0.6, 46, Ht * 0.6);
        return o;
      }
      o += `<path d="M-30,-24H64Q80,-24 80,-8V8Q80,24 64,24H-30Z" fill="${p.cut ? (k.col ? '#fafafa' : '#ffffff') : body}" ${sd(p)}/><path d="M-30,-20Q-62,-12 -62,0Q-62,12 -30,20Z" fill="${fc(k, '#cfd8dc')}" ${sd(p)}/>`;
      o += `<path d="M-46,-12C-52,${f(-R * 0.5)} -44,${f(-R)} -38,${f(-R)}C-34,${f(-R * 0.6)} -36,-30 -40,-12Z" fill="${body}" ${sd(p)}/><path d="M-46,12C-52,${f(R * 0.5)} -44,${f(R)} -38,${f(R)}C-34,${f(R * 0.6)} -36,30 -40,12Z" fill="${body}" ${sd(p)}/>`;
      if (p.cut) { o += `<line x1="-30" y1="0" x2="-6" y2="0" stroke="${p.stroke}" stroke-width="3"/><rect x="-6" y="-13" width="26" height="26" rx="3" fill="${fc(k, '#b0bec5')}" ${sd(p)}/><circle cx="7" cy="0" r="6" fill="none" ${thin(p)}/><line x1="20" y1="0" x2="30" y2="0" stroke="${p.stroke}" stroke-width="2"/><rect x="30" y="-15" width="36" height="30" rx="4" fill="${fc(k, '#ffe082')}" ${sd(p)}/>` + T(ctx, 'G', 48, 0, { size: 14, color: p.stroke }); }
      if (p.wind) [-60, 0, 60].forEach((y) => (o += L.arrow(p, -190, y, -100, y, { sw: 1.6, ah: 10, color: k.col ? '#1e88e5' : p.stroke })));
      o += P(ctx, p, p.tBlade, 0, -70, -R - 14, 'middle', -40, -R * 0.8, -60, -R - 2) + P(ctx, p, p.tNac, 1, 110, -40, 'start', 70, -20, 106, -40) + P(ctx, p, p.tTower, 2, 50, Ht * 0.6, 'start', 12, Ht * 0.6, 46, Ht * 0.6);
      if (p.cut) o += P(ctx, p, p.tGear, 3, -10, 60, 'middle', 7, 13, -4, 46) + P(ctx, p, p.tGen, 4, 110, 36, 'start', 66, 10, 106, 36);
      if (p.wind) o += P(ctx, p, p.tWind, 5, -150, -78, 'middle');
      return o;
    },
  });

  /* ---------- 水力发电 ---------- */
  PD.register({
    type: 'hydro', name: '水力发电(水坝剖面)',
    defaults: { look: 'color', hdim: true, flow: true, blank: 'text', tRes: '水库', tDam: '水坝', tIn: '进水口', tPen: '压力水管', tTurb: '涡轮机', tGen: '发电机', tOut: '河流', tLine: '输电线', th: 'h', lsize: 14 },
    fields: [lookF, { k: 'hdim', t: 'bool', l: '标出落差 h' }, { k: 'th', t: 'text', l: '落差标签', when: (p) => p.hdim }, { k: 'flow', t: 'bool', l: '水流箭头' }, blankF,
      { k: 'tRes', t: 'text', l: '水库' }, { k: 'tDam', t: 'text', l: '水坝' }, { k: 'tIn', t: 'text', l: '进水口' }, { k: 'tPen', t: 'text', l: '压力水管' }, { k: 'tTurb', t: 'text', l: '涡轮机' }, { k: 'tGen', t: 'text', l: '发电机' }, { k: 'tOut', t: 'text', l: '河流' }, { k: 'tLine', t: 'text', l: '输电线' }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const k = K(p), water = k.col ? '#90caf9' : k.bw ? '#e0e0e0' : '#ffffff', ls = +p.lsize || 14;
      let o = `<rect x="-330" y="0" width="680" height="26" ${k.ab ? PD.fillAttr({ fillMode: 'hatch', fill: p.stroke }, ctx) : `fill="${k.col ? '#a1887f' : '#bdbdbd'}"`} stroke="none"/><line x1="-330" y1="0" x2="350" y2="0" ${sd(p)}/>`;
      o += `<rect x="-320" y="-200" width="282" height="200" fill="${water}" stroke="none"/><line x1="-320" y1="-200" x2="-38" y2="-200" ${sd(p)}/>`;
      if (k.ab) for (let y = -184; y < 0; y += 22) o += `<path d="M-300,${y}q10,-5 20,0t20,0" fill="none" ${thin(p, 0.5)}/>`;
      o += `<rect x="210" y="-40" width="140" height="40" fill="${water}" stroke="none"/><line x1="210" y1="-40" x2="350" y2="-40" ${sd(p)}/>`;
      o += `<path d="M-40,0V-230H-8L100,0Z" fill="${k.col ? '#cfd8dc' : k.bw ? '#d6d6d6' : '#ffffff'}" ${sd(p)}/>`;
      if (k.ab) o += `<path d="M-40,0V-230H-8L100,0Z" ${PD.fillAttr({ fillMode: 'dots', fill: p.stroke }, ctx)} stroke="none"/>`;
      const pen = 'M-40,-110L-24,-110L82,-24H130';
      o += `<path d="${pen}" fill="none" stroke="${p.stroke}" stroke-width="16" stroke-linejoin="round"/><path d="${pen}" fill="none" stroke="${water === '#ffffff' ? '#ffffff' : water}" stroke-width="12.5" stroke-linejoin="round"/>`;
      o += `<path d="M-44,-122V-98" stroke="${p.stroke}" stroke-width="1.2" stroke-dasharray="2 2"/>`;
      o += `<path d="M100,0V-110L150,-140L200,-110V0Z" fill="${fc(k, '#efebe9')}" ${sd(p)}/>`;
      o += `<path d="M150,-24H210V-14" fill="none" stroke="${p.stroke}" stroke-width="14"/><path d="M150,-24H210V-14" fill="none" stroke="${water}" stroke-width="10.5"/>`;
      o += `<circle cx="150" cy="-24" r="19" fill="${fc(k, '#b0bec5')}" ${sd(p)}/>`;
      for (let i = 0; i < 6; i++) { const a = i * 60 * D2R; o += `<line x1="150" y1="-24" x2="${f(150 + 15 * Math.cos(a))}" y2="${f(-24 + 15 * Math.sin(a))}" ${thin(p, 0.8)}/>`; }
      o += `<line x1="150" y1="-43" x2="150" y2="-62" stroke="${p.stroke}" stroke-width="3"/><rect x="128" y="-92" width="44" height="30" rx="4" fill="${fc(k, '#ffe082')}" ${sd(p)}/>` + T(ctx, 'G', 150, -77, { size: 15, color: p.stroke });
      o += `<path d="M160,-92V-128L260,-190M140,-92V-128" fill="none" ${thin(p, 0.8)}/><path d="M250,-240L270,-240L280,-100H240Z" fill="none" ${thin(p, 0.9)}/><path d="M244,-200H276M248,-160H272M240,-100L270,-240M280,-100L250,-240" fill="none" ${thin(p, 0.6)}/>`;
      if (p.flow) { const c = k.col ? '#1565c0' : p.stroke; o += L.arrow(p, -150, -100, -70, -110, { sw: 1.4, ah: 8, color: c }) + L.arrow(p, 20, -70, 60, -38, { sw: 1.4, ah: 8, color: c }) + L.arrow(p, 240, -20, 300, -20, { sw: 1.4, ah: 8, color: c }); }
      if (p.hdim) o += `<line x1="-310" y1="-24" x2="140" y2="-24" ${S(p, { dash: 'dash', sw: 0.6 })}/>` + dimL(p, ctx, [-300, -200], [-300, -24], [-1, 0], 0.01, p.th, ls).replace('font-style="italic"', 'font-style="italic"');
      o += P(ctx, p, p.tRes, 0, -180, -230, 'middle') + P(ctx, p, p.tDam, 1, -24, -252, 'middle', -24, -230, -24, -242) + P(ctx, p, p.tIn, 2, -110, -150, 'middle', -42, -116, -100, -140);
      o += P(ctx, p, p.tPen, 3, 10, -150, 'start', 30, -76, 18, -140) + P(ctx, p, p.tTurb, 4, 150, 50, 'middle', 150, -6, 150, 38) + P(ctx, p, p.tGen, 5, 60, -100, 'end', 128, -80, 64, -100);
      o += P(ctx, p, p.tOut, 6, 300, -58, 'middle') + P(ctx, p, p.tLine, 7, 300, -250, 'middle', 272, -238, 292, -246);
      return o;
    },
  });

  /* ---------- 太阳能板 ---------- */
  const solarGeo = (p) => {
    const b = clamp(+p.beta, 0, 90) * D2R, a = clamp(+p.alpha, 5, 175) * D2R, Lp = +p.L || 160, A = [0, -24], Bq = [A[0] + Lp * Math.cos(b), A[1] - Lp * Math.sin(b)];
    const iso = p.view === 'iso', e = iso ? [0.5 * Lp * 0.8 * Math.cos(40 * D2R), -0.5 * Lp * 0.8 * Math.sin(40 * D2R)] : [0, 0], m = [e[0] / 2, e[1] / 2];
    const A2 = [A[0] + m[0], A[1] + m[1]], B2 = [Bq[0] + m[0], Bq[1] + m[1]], C = [(A2[0] + B2[0]) / 2, (A2[1] + B2[1]) / 2], s = [-Math.cos(a), -Math.sin(a)], n = [-Math.sin(b), -Math.cos(b)], sun = [C[0] + s[0] * Lp * 1.25, C[1] + s[1] * Lp * 1.25];
    return { b, a, Lp, A, Bq, e, A2, B2, C, s, n, sun };
  };
  PD.register({
    type: 'solarp', name: '太阳能板(可调倾角与太阳方向)',
    defaults: { look: 'color', view: 'side', beta: 30, alpha: 50, L: 170, rays: 4, normal: true, tB: '\\beta', tT: '\\theta', tA: '', stand: true, ground: true, lsize: 15 },
    getHandles: (p) => { const g = solarGeo(p); return [g.B2, g.sun]; },
    setHandle(p, i, x, y) { const g = solarGeo(p); if (i === 0) p.beta = Math.round(clamp(Math.atan2(-(y - g.A2[1]), x - g.A2[0]) / D2R, 0, 90)); else p.alpha = Math.round(clamp(Math.atan2(-(y - g.C[1]), -(x - g.C[0])) / D2R, 5, 175)); },
    fields: [lookF, { k: 'view', t: 'sel', l: '视图', o: [['side', '侧视'], ['iso', '2.5D']], rebuild: true },
      { k: 'beta', t: 'range', l: '板的倾角 β°(可拖板的上端)', min: 0, max: 90, step: 1 }, { k: 'alpha', t: 'range', l: '太阳仰角°(可拖太阳; >90 太阳在右)', min: 5, max: 175, step: 1 },
      { k: 'L', t: 'num', l: '板长' }, { k: 'rays', t: 'num', l: '光线条数', min: 0, max: 10 }, { k: 'normal', t: 'bool', l: '法线' },
      { k: 'tB', t: 'text', l: '倾角标签(空 = 不标)' }, { k: 'tT', t: 'text', l: '入射角标签(空 = 不标)' }, { k: 'tA', t: 'text', l: '太阳仰角标签(空 = 不标)' }, { k: 'stand', t: 'bool', l: '支架' }, { k: 'ground', t: 'bool', l: '地面' }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const k = K(p), g = solarGeo(p), { A, Bq, e, A2, B2, C, s, n, sun, Lp } = g, ls = +p.lsize || 15, iso = p.view === 'iso';
      const panel = k.col ? '#1f3b73' : k.bw ? '#6d6d6d' : '#ffffff', grid = k.col ? '#8fb3e8' : k.bw ? '#e0e0e0' : p.stroke;
      let o = '';
      if (p.ground) o += iso ? `<polygon points="${pt(-Lp * 0.5, 0)} ${pt(Lp * 1.4, 0)} ${pt(Lp * 1.4 + e[0] * 1.3, e[1] * 1.3)} ${pt(-Lp * 0.5 + e[0] * 1.3, e[1] * 1.3)}" fill="${k.col ? '#e8f5e9' : '#ffffff'}" ${thin(p, 0.8)}/>` : `<line x1="${f(-Lp * 0.5)}" y1="0" x2="${f(Lp * 1.4)}" y2="0" ${S(p, { dash: 'solid', sw: (+p.sw || 1.5) * 1.3 })}/>` + `<path d="${Array.from({ length: Math.ceil(Lp * 1.9 / 14) }, (_, i) => `M${f(-Lp * 0.5 + i * 14)},0l-8,9`).join('')}" fill="none" ${thin(p, 0.6)}/>`;
      if (p.stand) { const legs = (o2) => { const m = [A[0] + (Bq[0] - A[0]) * 0.72 + o2[0], A[1] + (Bq[1] - A[1]) * 0.72 + o2[1]]; return `<path d="M${pt(A[0] + o2[0], A[1] + o2[1])}V${f(o2[1])}M${pt(m[0], m[1])}V${f(o2[1])}" fill="none" stroke="${p.stroke}" stroke-width="2.4"/>`; }; o += legs([0, 0]); if (iso) o += legs(e); }
      // 光线（画在板的后面）
      const nr = Math.round(+p.rays || 0), lit = s[0] * n[0] + s[1] * n[1] > 0, rc = k.col ? '#f9a825' : p.stroke;
      for (let i = 0; i < nr; i++) { const t = 0.15 + (0.7 * (i + 0.5)) / nr, H = [A2[0] + (B2[0] - A2[0]) * t, A2[1] + (B2[1] - A2[1]) * t], S0 = [H[0] + s[0] * Lp * 0.9, H[1] + s[1] * Lp * 0.9]; o += L.arrow(p, S0[0], S0[1], H[0], H[1], { sw: 1.3, color: rc, ah: 8, dash: lit ? 'solid' : 'dash' }); }
      if (iso) {
        const Q = [A, Bq, [Bq[0] + e[0], Bq[1] + e[1]], [A[0] + e[0], A[1] + e[1]]];
        o += `<polygon points="${Q.map((q) => pt(q[0], q[1])).join(' ')}" fill="${panel}" ${sd(p)}/>`;
        let d = ''; for (let i = 1; i < 4; i++) { const t = i / 4; d += `M${pt(A[0] + (Bq[0] - A[0]) * t, A[1] + (Bq[1] - A[1]) * t)}l${pt(e[0], e[1])}`; } for (let j = 1; j < 6; j++) { const t = j / 6; d += `M${pt(A[0] + e[0] * t, A[1] + e[1] * t)}L${pt(Bq[0] + e[0] * t, Bq[1] + e[1] * t)}`; }
        o += `<path d="${d}" fill="none" stroke="${grid}" stroke-width="0.8"/><polygon points="${Q.map((q) => pt(q[0], q[1])).join(' ')}" fill="none" ${S(p, { dash: 'solid', sw: (+p.sw || 1.5) * 1.3 })}/>`;
      } else {
        const t = [-n[0] * 6, -n[1] * 6], Q = [A, Bq, [Bq[0] + t[0], Bq[1] + t[1]], [A[0] + t[0], A[1] + t[1]]];
        o += `<polygon points="${Q.map((q) => pt(q[0], q[1])).join(' ')}" fill="${panel}" ${sd(p)}/>`;
        let d = ''; for (let i = 1; i < 6; i++) { const u = i / 6, X0 = A[0] + (Bq[0] - A[0]) * u, Y0 = A[1] + (Bq[1] - A[1]) * u; d += `M${pt(X0, Y0)}l${pt(t[0], t[1])}`; } o += `<path d="${d}" fill="none" stroke="${grid}" stroke-width="0.8"/>`;
      }
      if (p.normal) o += `<line x1="${f(C[0])}" y1="${f(C[1])}" x2="${f(C[0] + n[0] * 80)}" y2="${f(C[1] + n[1] * 80)}" ${S(p, { dash: 'dash', sw: 0.9 })}/>`;
      if (p.tT && p.normal && lit) o += L.angArc(p, ctx, C, Math.atan2(n[1], n[0]), Math.atan2(s[1], s[0]), 34, p.tT, ls);
      if (p.tB) o += `<line x1="${f(A2[0])}" y1="${f(A2[1])}" x2="${f(A2[0] + 64)}" y2="${f(A2[1])}" ${S(p, { dash: 'dash', sw: 0.8 })}/>` + (g.b > 0.02 ? L.angArc(p, ctx, A2, 0, -g.b, 36, p.tB, ls) : '');
      if (p.tA && nr) { const H = [A2[0] + (B2[0] - A2[0]) * 0.85, A2[1] + (B2[1] - A2[1]) * 0.85], Pp = [H[0] + s[0] * Lp * 0.55, H[1] + s[1] * Lp * 0.55], ref = s[0] < 0 ? Math.PI : 0; o += `<line x1="${f(Pp[0])}" y1="${f(Pp[1])}" x2="${f(Pp[0] + (s[0] < 0 ? -50 : 50))}" y2="${f(Pp[1])}" ${S(p, { dash: 'dash', sw: 0.8 })}/>` + L.angArc(p, ctx, Pp, ref, Math.atan2(s[1], s[0]), 30, p.tA, ls); }
      o += sunG(p, k, sun[0], sun[1], 16);
      return o;
    },
  });

  /* ======================================================================
     预设
     ====================================================================== */
  const ps = (c, n, t, pr) => PD.preset(c, n, t, pr || {});
  const fx = (c, n, t) => PD.preset(c, n, 'text', { text: t, size: 20 });
  ps(C2, '荧光灯管(发光过程)', 'fluor', {});
  ps(C2, '荧光灯管(只有结构)', 'fluor', { proc: false });
  ps(C2, '荧光灯管(部件留空, 考题)', 'fluor', { blank: 'empty' });
  ps(C2, '紧凑型荧光灯(U 形管)', 'fluor', { kind: 'u' });
  ps(C2, '紧凑型荧光灯(螺旋管)', 'fluor', { kind: 'spiral' });
  ps(C2, 'LED(单颗剖面)', 'ledlamp', {});
  ps(C2, 'LED 灯泡', 'ledlamp', { kind: 'bulb' });
  ps(C2, 'PN 结 · 正向偏压发光', 'pnjunc', {});
  ps(C2, 'PN 结 · 反向偏压', 'pnjunc', { bias: 'rev' });
  ps(C2, 'PN 结(没有接电源)', 'pnjunc', { bias: 'none', look: 'abstract' });
  const kid = (id, type, x, y, props) => Object.assign({ id: 'led-' + id, type, x, y, rot: 0, scale: 1, flip: false, snap: 'auto' }, PD.STYLE_DEF, PD.clone(PD.shapes[type].defaults), props || {});
  const W = (id, a, ap, b, bp) => kid(id, 'wire', 0, 0, { a0: 'led-' + a, ap, b0: 'led-' + b, bp });
  ps(C2, 'LED 电路(电池 + 电阻 + LED)', 'group', { loose: true, bw: 300, bh: 150, children: [
    kid('R', 'comp', 80, 20, { kind: 'resistor', L: 80 }), kid('D', 'comp', 220, 20, { kind: 'led', L: 70 }), kid('B', 'comp', 147.5, 130, { kind: 'cell', L: 215 }),
    W('w1', 'R', 1, 'D', 0), W('w2', 'D', 1, 'B', 1), W('w3', 'B', 0, 'R', 0),
  ] });
  ps(C2, '点光源照射平面(侧视)', 'illum', {});
  ps(C2, '点光源照射平面(2.5D)', 'illum', { mode: 'plane', sx: -40, sy: -170, u: 100, tN: 'N' });
  ps(C2, '点光源照射斜面', 'illum', { tilt: 20, foot: false, sx: -80, sy: -160, u: 60 });
  ps(C2, '点光源与平面(多条光线)', 'illum', { mode: 'plane', rays: 6, normal: false, foot: false, rline: false, sx: 0, sy: -170, tP: '' });
  fx(C2, '照度', 'E = \\frac{\\Phi}{A}');
  fx(C2, '照度(点光源, 垂直照射)', 'E = \\frac{I}{r^2}');
  fx(C2, '照度(点光源, 斜射)', 'E = \\frac{I \\cos\\theta}{r^2}');
  fx(C2, '发光效能', '发光效能 = \\frac{\\Phi}{P}');
  ps(C3, '砖墙(2.5D)', 'wall3d', {});
  ps(C3, '空心砖墙(砖 + 空气 + 砖)', 'wall3d', { layers: '砖, 11\n空气, 5\n砖, 11', kLab: true });
  ps(C3, '隔热墙(砖 + 泡沫 + 灰泥)', 'wall3d', { layers: '砖, 11\n泡沫, 5\n灰泥, 2', kLab: true });
  ps(C3, '单层玻璃窗', 'wall3d', { layers: '玻璃, 0.6', ds: 12, minpx: 10, Wd: 160, H: 150 });
  ps(C3, '双层玻璃窗', 'wall3d', { layers: '玻璃, 0.4\n空气, 1.2\n玻璃, 0.4', ds: 14, minpx: 8, Wd: 160, H: 150, dimLab: 'sym', kLab: true });
  ps(C3, '墙(线稿, 符号标注)', 'wall3d', { look: 'abstract', layers: '混凝土, 20', dimLab: 'sym', names: false, tHot: 'T_1', tCold: 'T_2' });
  ps(C3, '房屋(门窗, 尺寸)', 'house3d', {});
  ps(C3, '房屋(人字形屋顶)', 'house3d', { roof: 'gable', oa: 40, open: 'front, window, 1.2, 1.1, 2, 1.2\nfront, door, 4.2, 0, 1.4, 2.2\nfront, window, 6.8, 1.1, 2, 1.2\nright, window, 3, 1.1, 2, 1.2' });
  ps(C3, '房屋(线稿)', 'house3d', { look: 'abstract' });
  ps(C3, '电动车能量流程', 'carflow', {});
  ps(C3, '混合动力车能量流程', 'carflow', { mode: 'hybrid' });
  ps(C3, '汽油车能量流程', 'carflow', { mode: 'ice' });
  ps(C3, '电动车(黑白, 部件留空)', 'carflow', { look: 'bw', blank: 'empty' });
  fx(C3, '热传导率(导热率 k)', '\\frac{Q}{t} = \\frac{kA(T_1 - T_2)}{d}');
  fx(C3, 'U 值', 'U = \\frac{k}{d}');
  fx(C3, '热传导率(U 值)', '\\frac{Q}{t} = UA\\Delta T');
  fx(C3, '多层材料的 U 值', '\\frac{1}{U} = \\frac{1}{U_1} + \\frac{1}{U_2} + \\cdots');
  fx(C3, 'OTTV', '\\rm{OTTV} = \\frac{Q_w + Q_g + Q_s}{A}');
  fx(C3, '效率', '\\eta = \\frac{有用的输出能量}{输入能量} \\times 100\\%');
  ps(C4, '每核子结合能曲线', 'bindcurve', {});
  ps(C4, '每核子结合能曲线(线稿, 只标铁)', 'bindcurve', { marks: '56 Fe', regions: true, tPeak: '最稳定', ticks: false });
  ps(C4, '压水式核电站', 'pwr', {});
  ps(C4, '压水式核电站(上色, 海水冷却)', 'pwr', { look: 'color', cool: 'sea', tCool: '海水' });
  ps(C4, '压水式核电站(部件留空, 考题)', 'pwr', { blank: 'empty' });
  ps(C4, '压水式核电站(字母标示)', 'pwr', { blank: 'letter' });
  ps(C4, '风力涡轮机(正面)', 'windt', {});
  ps(C4, '风力涡轮机(扫掠面积)', 'windt', { swept: true, blank: 'none' });
  ps(C4, '风力涡轮机(侧面剖开)', 'windt', { view: 'side' });
  ps(C4, '水力发电', 'hydro', {});
  ps(C4, '水力发电(线稿, 部件留空)', 'hydro', { look: 'abstract', blank: 'empty' });
  ps(C4, '太阳能板(侧视)', 'solarp', {});
  ps(C4, '太阳能板(2.5D)', 'solarp', { view: 'iso', beta: 25, alpha: 55 });
  ps(C4, '太阳能板(线稿, 标太阳仰角)', 'solarp', { look: 'abstract', tA: '\\alpha' });
  fx(C4, '质能关系', 'E = mc^2');
  fx(C4, '风力发电功率', 'P = \\frac{1}{2}\\rho A v^3');
  fx(C4, '水力发电功率', 'P = \\eta \\frac{mgh}{t}');
  fx(C4, '太阳能板输出功率', 'P = \\eta I A \\cos\\theta');
})();
