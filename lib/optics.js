/* 第三册 · 光与波（上）：光的反射、折射、透镜 （依赖 lab.js、mechanics.js 提供的 PD.lab 辅助）
   平面镜 · 光线 · 像与物 · 潜望镜 · 介质界面(斯涅耳) · 玻璃体光线追迹(玻璃块/半圆/棱镜/光纤) · 鱼的视域 · 透镜成像 · 眼睛 · 鱼
   光线盒 · 激光笔 · 光屏 · 直尺 */
(function () {
  'use strict';
  const f = PD.f, S = PD.strokeAttr, T = PD.tex, L = PD.lab, pt = L.pt, clamp = L.clamp;
  const D2R = Math.PI / 180, R2D = 180 / Math.PI;
  const C1 = 'DSE-物理/光与波/光的反射与折射', C2 = 'DSE-物理/光与波/透镜', CE = '通用/实验器材';
  const sd = (p) => S(p, { dash: 'solid' });
  const nrm = (v) => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };
  const GLASS = (PD.GLASS = '#dbeaf5'), WATER = (PD.WATER = '#dcecf8');
  const SPEC = (PD.SPECTRUM = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#3949ab', '#8e24aa']);
  const dirOf = (deg) => [Math.cos(deg * D2R), -Math.sin(deg * D2R)];

  /* ================= 共享辅助 ================= */
  // 光线折线：每段中点一个箭头；o.dashSeg[i] 为真则该段虚线（虚光线，默认不画箭头）
  L.ray = (p, P, o = {}) => {
    const col = o.color || p.rc || p.stroke || '#000', sw = o.sw || +p.rw || +p.sw || 1.5, ah = o.ah || 5 + 2.2 * sw;
    let s = '';
    for (let i = 0; i < P.length - 1; i++) {
      const a = P[i], b = P[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy); if (l < 0.5) continue;
      const ds = o.dashSeg && o.dashSeg[i];
      s += `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" ${S(p, { color: col, sw: ds ? Math.max(0.8, sw * 0.75) : sw, dash: ds ? 'dash' : o.dash || 'solid' })}/>`;
      if (o.arrows !== false && l > ah * 2.4 && !ds) {
        const ang = Math.atan2(dy, dx), k = o.at ?? 0.5;
        s += PD.arrowHead(a[0] + dx * k + (Math.cos(ang) * ah) / 2, a[1] + dy * k + (Math.sin(ang) * ah) / 2, ang, ah, 'tri', col, sw);
      }
    }
    return s;
  };
  // 角度弧：中心 c，两个方向 a1、a2（SVG 角，弧度），画较小夹角
  L.angArc = (p, ctx, c, a1, a2, r, label, lsize) => {
    let d = a2 - a1; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
    const x1 = c[0] + r * Math.cos(a1), y1 = c[1] + r * Math.sin(a1), x2 = c[0] + r * Math.cos(a1 + d), y2 = c[1] + r * Math.sin(a1 + d);
    let s = `<path d="M${pt(x1, y1)}A${f(r)},${f(r)} 0 0 ${d > 0 ? 1 : 0} ${pt(x2, y2)}" fill="none" ${L.thin(p, 0.65)}/>`;
    if (label) { const am = a1 + d / 2; s += T(ctx, label, c[0] + (r + 11) * Math.cos(am), c[1] + (r + 11) * Math.sin(am), { size: lsize || 15, color: p.stroke }); }
    return s;
  };
  // 双箭头尺寸线
  L.dim = (p, ctx, x1, y1, x2, y2, label, o = {}) => {
    const l = Math.hypot(x2 - x1, y2 - y1); if (l < 2) return '';
    const ux = (x2 - x1) / l, uy = (y2 - y1) / l, ah = o.ah || 7, col = o.color || p.stroke, sw = o.sw || 0.9;
    let s = `<line x1="${f(x1 + ux * ah * 0.7)}" y1="${f(y1 + uy * ah * 0.7)}" x2="${f(x2 - ux * ah * 0.7)}" y2="${f(y2 - uy * ah * 0.7)}" ${S(p, { color: col, sw, dash: 'solid' })}/>`;
    s += PD.arrowHead(x1, y1, Math.atan2(-uy, -ux), ah, 'full', col, sw) + PD.arrowHead(x2, y2, Math.atan2(uy, ux), ah, 'full', col, sw);
    if (label) { const off = o.off ?? 12, nx = uy, ny = -ux; s += T(ctx, label, (x1 + x2) / 2 + nx * off, (y1 + y2) / 2 + ny * off, { size: o.size || 14, color: col, halo: true, anchor: o.anchor }); }
    return s;
  };
  // 眼睛（侧视，朝右；flip 朝左）
  L.eyeSvg = (p, x, y, s, flip) => {
    const w = s / 2, h = s * 0.3, g = `translate(${pt(x, y)})${flip ? ' scale(-1,1)' : ''}`;
    return `<g transform="${g}"><path d="M${pt(-w, 0)}Q${pt(0, -h * 1.7)} ${pt(w, 0)}Q${pt(0, h * 1.7)} ${pt(-w, 0)}Z" fill="#ffffff" ${S(p, { dash: 'solid', sw: Math.max(1, (+p.sw || 1.5) * 0.8) })}/>` +
      `<ellipse cx="${f(w * 0.62)}" cy="0" rx="${f(s * 0.07)}" ry="${f(s * 0.2)}" fill="${p.iris || '#4f6d8f'}"/><path d="M${pt(-w * 0.8, -h * 0.75)}Q${pt(0, -h * 2.3)} ${pt(w * 0.85, -h * 0.35)}" fill="none" stroke="${p.stroke || '#000'}" stroke-width="1"/></g>`;
  };
  // 光线追迹：单个多边形介质（内部折射率 n，外部 n0）。返回折线与每次界面事件
  const segHit = (q, d, a, b) => {
    const ex = b[0] - a[0], ey = b[1] - a[1], den = d[0] * ey - d[1] * ex; if (Math.abs(den) < 1e-12) return null;
    const qx = a[0] - q[0], qy = a[1] - q[1], t = (qx * ey - qy * ex) / den, s = (qx * d[1] - qy * d[0]) / den;
    return t > 1e-6 && s >= -1e-9 && s <= 1 + 1e-9 ? t : null;
  };
  const inPoly = (q, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i][1] > q[1]) !== (P[j][1] > q[1]) && q[0] < ((P[j][0] - P[i][0]) * (q[1] - P[i][1])) / (P[j][1] - P[i][1]) + P[i][0]) c = !c; return c; };
  L.trace = (poly, n, n0, start, dir, maxN, ext) => {
    let pos = start.slice(), d = nrm(dir), inside = inPoly(pos, poly);
    const pts = [pos.slice()], ev = [];
    for (let k = 0; k < (maxN || 12); k++) {
      let best = Infinity, bi = -1;
      for (let i = 0; i < poly.length; i++) { const t = segHit(pos, d, poly[i], poly[(i + 1) % poly.length]); if (t != null && t < best) { best = t; bi = i; } }
      if (bi < 0) { pts.push([pos[0] + d[0] * ext, pos[1] + d[1] * ext]); break; }
      const P = [pos[0] + d[0] * best, pos[1] + d[1] * best], a = poly[bi], b = poly[(bi + 1) % poly.length];
      let N = nrm([-(b[1] - a[1]), b[0] - a[0]]); if (N[0] * d[0] + N[1] * d[1] > 0) N = [-N[0], -N[1]];
      const n1 = inside ? n : n0, n2 = inside ? n0 : n, ci = -(N[0] * d[0] + N[1] * d[1]), eta = n1 / n2, kk = 1 - eta * eta * (1 - ci * ci);
      const e = { P, N, din: d.slice(), ci, n1, n2 };
      pts.push(P);
      if (kk < 0) { d = [d[0] + 2 * ci * N[0], d[1] + 2 * ci * N[1]]; e.tir = true; }
      else { const ct = Math.sqrt(kk); e.refl = nrm([d[0] + 2 * ci * N[0], d[1] + 2 * ci * N[1]]); d = [eta * d[0] + (eta * ci - ct) * N[0], eta * d[1] + (eta * ci - ct) * N[1]]; inside = !inside; }
      d = nrm(d); e.dout = d.slice(); ev.push(e); pos = P;
    }
    return { pts, ev };
  };
  const rayFields = [{ k: 'rc', t: 'color', l: '光线颜色' }, { k: 'rw', t: 'num', l: '光线线宽', step: 0.2 }];

  /* ================= 平面镜 ================= */
  PD.register({
    type: 'mirror', name: '平面镜',
    defaults: { L: 160, back: true, side: 'below', thick: 0, label: '', lsize: 15 },
    handles: [['L', 'zero', 0.5]],
    fields: [{ k: 'L', t: 'num', l: '长度' }, { k: 'back', t: 'bool', l: '背面阴影线(非反射面)' }, { k: 'side', t: 'sel', l: '阴影线在', o: [['below', '下方'], ['above', '上方']] },
      { k: 'thick', t: 'num', l: '玻璃厚度(0=无)' }, { k: 'label', t: 'text', l: '标签' }, { k: 'lsize', t: 'num', l: '标签字号' }],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const h = +p.L / 2, sg = p.side === 'above' ? -1 : 1, t = +p.thick || 0, q = Object.assign({}, p, { sw: (+p.sw || 1.5) * 1.6 });
      let o = t > 0 ? `<rect x="${f(-h)}" y="${f(sg > 0 ? -t : 0)}" width="${f(2 * h)}" height="${f(t)}" fill="${GLASS}" ${L.thin(p, 0.6)}/>` : '';
      o += p.back ? L.hatchLine(q, -h, 0, h, 0, sg, 7, 7) : `<line x1="${f(-h)}" y1="0" x2="${f(h)}" y2="0" ${sd(q)}/>`;
      if (p.label) o += T(ctx, p.label, h + 8, 0, { size: p.lsize, anchor: 'start', color: p.stroke });
      return o;
    },
  });

  /* ================= 光线（折线） ================= */
  PD.register({
    type: 'raypath', name: '光线(折线, 每段箭头)',
    defaults: { pts: '0,0 120,70 240,0', arrows: true, at: 0.5, dashSeg: '', rc: '#000000', rw: 1.6 },
    getHandles: (p) => PD.parsePts(p.pts),
    setHandle(p, i, x, y) { const P = PD.parsePts(p.pts); if (P[i]) { P[i] = [x, y]; p.pts = PD.ptsStr(P); } },
    fields: [{ k: 'pts', t: 'area', l: '转折点(拖蓝点；可在此加点)' }, { k: 'arrows', t: 'bool', l: '每段箭头' }, { k: 'at', t: 'range', l: '箭头位置', min: 0.2, max: 0.85, step: 0.05 },
      { k: 'dashSeg', t: 'text', l: '虚线段序号(虚光线, 如 3 或 2,3)' }, ...rayFields],
    style: ['opacity'],
    render(p) {
      const P = PD.parsePts(p.pts), ds = String(p.dashSeg || '').split(/[,\s]+/).map(Number).filter((x) => x > 0);
      return L.ray(p, P, { arrows: p.arrows, at: +p.at, dashSeg: P.map((_, i) => ds.includes(i + 1)) });
    },
  });

  /* ================= 平面镜成像（像与物、移动） ================= */
  PD.register({
    type: 'mirrorimg', name: '平面镜成像(像与物)',
    defaults: { u: 110, h: 60, Hm: 140, ex: 150, ey: 30, rays: 2, floor: true, eye: true, dims: false, ul: 'u', vl: 'v', ol: '物', il: '像', move: false, mv: 'v', rc: '#000000', rw: 1.4, lsize: 15 },
    getHandles: (p) => [[-(+p.u), -(+p.h)], [-(+p.ex), -(+p.ey)]],
    setHandle(p, i, x, y) { if (i === 0) { p.u = f(Math.max(5, -x)); p.h = f(Math.max(5, -y)); } else { p.ex = f(Math.max(10, -x)); p.ey = f(-y); } },
    fields: [{ k: 'u', t: 'num', l: '物距(拖物体顶端)' }, { k: 'h', t: 'num', l: '物高' }, { k: 'Hm', t: 'num', l: '镜高' }, { k: 'ex', t: 'num', l: '眼睛距镜(拖第2个蓝点)' }, { k: 'ey', t: 'num', l: '眼睛高度' },
      { k: 'rays', t: 'num', l: '光线数', min: 0 }, { k: 'eye', t: 'bool', l: '画眼睛' }, { k: 'floor', t: 'bool', l: '地面虚线' },
      { k: 'dims', t: 'bool', l: '标物距/像距' }, { k: 'ul', t: 'text', l: '物距标签', when: (p) => p.dims }, { k: 'vl', t: 'text', l: '像距标签', when: (p) => p.dims },
      { k: 'move', t: 'bool', l: '移动箭头(物靠近镜→像靠近镜)' }, { k: 'mv', t: 'text', l: '速度标签', when: (p) => p.move },
      { k: 'ol', t: 'text', l: '物标签' }, { k: 'il', t: 'text', l: '像标签' }, ...rayFields, { k: 'lsize', t: 'num', l: '标签字号' }],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const u = +p.u, h = +p.h, ex = +p.ex, ey = +p.ey, n = Math.round(+p.rays || 0), Tp = [-u, -h], I = [u, -h];
      let o = '';
      if (p.floor) o += `<line x1="${f(-Math.max(u, ex) - 30)}" y1="0" x2="${f(u + 30)}" y2="0" ${S(p, { dash: 'dash', sw: 0.8 })}/>`;
      o += L.hatchLine(Object.assign({}, p, { sw: (+p.sw || 1.5) * 1.6 }), 0, -(+p.Hm), 0, 10, -1, 7, 7);
      o += L.arrow(p, -u, 0, -u, -h, { sw: 2 }) + L.arrow(p, u, 0, u, -h, { sw: 1.6, dash: 'dash' });
      if (p.ol) o += T(ctx, p.ol, -u, -h - 14, { size: p.lsize, italic: false, color: p.stroke, halo: true });
      if (p.il) o += T(ctx, p.il, u, -h - 14, { size: p.lsize, italic: false, color: p.stroke, halo: true });
      for (let k = 0; k < n; k++) {
        const E = [-ex, -ey + (k - (n - 1) / 2) * 9], P = [I[0] + (E[0] - I[0]) * (u / (u + ex)), I[1] + (E[1] - I[1]) * (u / (u + ex))];
        o += L.ray(p, [Tp, P, E]) + L.ray(p, [P, I], { dashSeg: [true] });
      }
      if (p.eye) o += L.eyeSvg(p, -ex - 12, -ey, 30, false);
      if (p.dims) { o += L.dim(p, ctx, -u, 16, 0, 16, p.ul, { off: -12 }) + L.dim(p, ctx, 0, 16, u, 16, p.vl, { off: -12 }); }
      if (p.move) { const y = -h - 36; o += L.arrow(p, -u - 18, y, -u + 18, y, { sw: 1.4 }) + L.arrow(p, u + 18, y, u - 18, y, { sw: 1.4 }); if (p.mv) o += T(ctx, p.mv, -u, y - 12, { size: p.lsize, color: p.stroke }) + T(ctx, p.mv, u, y - 12, { size: p.lsize, color: p.stroke }); }
      return o;
    },
  });

  /* ================= 潜望镜 ================= */
  PD.register({
    type: 'periscope', name: '潜望镜(平面镜/棱镜)',
    defaults: { w: 50, H: 220, kind: 'mirror', ray: true, ext: 80, eye: true, obj: true, rc: '#000000', rw: 1.5, fill: '#eeeeee' },
    fields: [{ k: 'w', t: 'num', l: '管宽' }, { k: 'H', t: 'num', l: '管高' }, { k: 'kind', t: 'sel', l: '反射元件', o: [['mirror', '平面镜'], ['prism', '直角棱镜(全反射)']] },
      { k: 'ray', t: 'bool', l: '光线' }, { k: 'ext', t: 'num', l: '光线伸出长度' }, { k: 'obj', t: 'bool', l: '物体(箭头)' }, { k: 'eye', t: 'bool', l: '眼睛' }, { k: 'fill', t: 'color', l: '管内颜色' }, ...rayFields],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const w = +p.w, H = +p.H, a = w / 2, ext = +p.ext, wall = (+p.sw || 1.5) * 1.6;
      let o = `<rect x="${f(-a)}" y="${f(-H)}" width="${f(w)}" height="${f(H)}" fill="${p.fill}"/>`;
      o += `<path d="M${pt(-a, -H)}H${f(a)}V${f(-w)}M${pt(a, 0)}H${f(-a)}V${f(-H + w)}" fill="none" ${S(p, { dash: 'solid', sw: wall })}/>`;
      if (p.kind === 'prism') {
        o += `<path d="M${pt(-a, -H)}L${pt(-a, -H + w)}L${pt(a, -H + w)}Z" fill="${GLASS}" ${sd(p)}/><path d="M${pt(-a, -w)}L${pt(a, -w)}L${pt(a, 0)}Z" fill="${GLASS}" ${sd(p)}/>`;
      } else {
        const q = Object.assign({}, p, { sw: (+p.sw || 1.5) * 1.5 });
        o += L.hatchLine(q, -a, -H, a, -H + w, -1, 6, 6) + L.hatchLine(q, -a, -w, a, 0, 1, 6, 6);
      }
      if (p.ray) o += L.ray(p, [[-a - ext, -H + a], [0, -H + a], [0, -a], [a + ext, -a]]);
      if (p.obj) o += L.arrow(p, -a - ext - 14, -H + a + 22, -a - ext - 14, -H + a - 22, { sw: 2 });
      if (p.eye) o += L.eyeSvg(p, a + ext + 20, -a, 30, true);
      return o;
    },
  });

  /* ================= 介质界面（斯涅耳定律、全反射） ================= */
  PD.register({
    type: 'boundary', name: '介质界面(折射/全反射)',
    defaults: { W: 300, H: 120, n1: 1.0, n2: 1.5, m1: '空气', m2: '玻璃', c1: '#ffffff', c2: GLASS, from: 'top', i: 40, partial: true, normal: true, il: 'i', rl: 'r', ref: '', R: 0, rc: '#000000', rw: 1.6, lsize: 15 },
    getHandles: (p) => { const R = +p.R || Math.min(+p.W / 2, +p.H) * 0.92, a = clamp(+p.i, 0, 89.9) * D2R, sg = p.from === 'bottom' ? 1 : -1; return [[-Math.sin(a) * R, sg * Math.cos(a) * R]]; },
    setHandle(p, k, x, y) { p.i = f(clamp(Math.atan2(Math.abs(x), Math.abs(y)) * R2D, 0, 89.9)); },
    fields: [{ k: 'W', t: 'num', l: '宽' }, { k: 'H', t: 'num', l: '每层高' },
      { k: 'n1', t: 'num', l: '上层折射率', step: 0.01 }, { k: 'm1', t: 'text', l: '上层名称' }, { k: 'c1', t: 'color', l: '上层颜色' },
      { k: 'n2', t: 'num', l: '下层折射率', step: 0.01 }, { k: 'm2', t: 'text', l: '下层名称' }, { k: 'c2', t: 'color', l: '下层颜色' },
      { k: 'from', t: 'sel', l: '光从哪层射入', o: [['top', '上层'], ['bottom', '下层']] }, { k: 'i', t: 'num', l: '入射角°(拖蓝点)', step: 1 },
      { k: 'partial', t: 'bool', l: '部分反射光线' }, { k: 'normal', t: 'bool', l: '法线' }, { k: 'il', t: 'text', l: '入射角标签' }, { k: 'rl', t: 'text', l: '折射角标签' }, { k: 'ref', t: 'text', l: '反射角标签' },
      { k: 'R', t: 'num', l: '光线长度(0=自动)' }, ...rayFields, { k: 'lsize', t: 'num', l: '标签字号' }],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const W = +p.W, H = +p.H, R = +p.R || Math.min(W / 2, H) * 0.92, a = clamp(+p.i, 0, 89.9) * D2R, top = p.from !== 'bottom', sg = top ? -1 : 1;
      const nIn = top ? +p.n1 : +p.n2, nOut = top ? +p.n2 : +p.n1, sr = (nIn / nOut) * Math.sin(a), tir = sr > 1;
      let o = `<rect x="${f(-W / 2)}" y="${f(-H)}" width="${f(W)}" height="${f(H)}" fill="${p.c1}"/><rect x="${f(-W / 2)}" y="0" width="${f(W)}" height="${f(H)}" fill="${p.c2}"/>`;
      o += `<line x1="${f(-W / 2)}" y1="0" x2="${f(W / 2)}" y2="0" ${sd(p)}/>`;
      if (p.normal) o += `<line x1="0" y1="${f(-H)}" x2="0" y2="${f(H)}" ${S(p, { dash: 'dash', sw: 0.8 })}/>`;
      const Sx = [-Math.sin(a) * R, sg * Math.cos(a) * R], Rf = [Math.sin(a) * R, sg * Math.cos(a) * R];
      o += L.ray(p, [Sx, [0, 0]]);
      if (!tir) { const r = Math.asin(sr), Ex = [Math.sin(r) * R, -sg * Math.cos(r) * R]; o += L.ray(p, [[0, 0], Ex]); if (p.rl) o += L.angArc(p, ctx, [0, 0], -sg * Math.PI / 2, Math.atan2(Ex[1], Ex[0]), 30, p.rl, p.lsize); }
      if (tir || p.partial) o += L.ray(p, [[0, 0], Rf], { sw: tir ? +p.rw || 1.6 : Math.max(0.8, (+p.rw || 1.6) * 0.55) });
      if (p.il) o += L.angArc(p, ctx, [0, 0], sg * Math.PI / 2, Math.atan2(Sx[1], Sx[0]), 26, p.il, p.lsize);
      if (p.ref && (tir || p.partial)) o += L.angArc(p, ctx, [0, 0], sg * Math.PI / 2, Math.atan2(Rf[1], Rf[0]), 34, p.ref, p.lsize);
      if (p.m1) o += T(ctx, p.m1, -W / 2 + 8, -H + 14, { size: p.lsize, anchor: 'start', italic: false, color: p.stroke });
      if (p.m2) o += T(ctx, p.m2, -W / 2 + 8, H - 14, { size: p.lsize, anchor: 'start', italic: false, color: p.stroke });
      return o;
    },
  });

  /* ================= 玻璃体光线追迹 ================= */
  const POLY = {
    block: (p) => { const a = +p.w / 2, b = +p.h / 2; return [[-a, -b], [a, -b], [a, b], [-a, b]]; },
    semi: (p) => { const r = +p.r, P = []; for (let i = 0; i <= 240; i++) { const t = Math.PI - (Math.PI * i) / 240; P.push([r * Math.cos(t), r * Math.sin(t)]); } return P; },
    prism: (p) => { const b = +p.side, A = clamp(+p.apex, 10, 170) * D2R, h = b / 2 / Math.tan(A / 2); return [[0, (-2 * h) / 3], [b / 2, h / 3], [-b / 2, h / 3]]; },
    rprism: (p) => { const s = +p.side / 2; return [[-s, -s], [s, s], [-s, s]]; },
  };
  PD.register({
    type: 'glass', name: '玻璃体光线追迹(块/半圆/棱镜/光纤)',
    defaults: { shape: 'block', w: 160, h: 100, r: 70, side: 140, apex: 60, n: 1.5, n0: 1.0, sx: -140, sy: -100, ang: -35, ext: 110, maxN: 14,
      white: false, disp: 0.06, normals: true, nN: 2, nl: 36, partial: false, pl: 60, aev: 1, il: '', rl: '', rc: '#000000', rw: 1.6, lsize: 15, fillMode: 'solid', fill: GLASS },
    getHandles: (p) => [[+p.sx, +p.sy], [+p.sx + 45 * Math.cos(p.ang * D2R), +p.sy - 45 * Math.sin(p.ang * D2R)]],
    setHandle(p, i, x, y) { if (i === 0) { p.sx = x; p.sy = y; } else p.ang = Math.round(Math.atan2(-(y - p.sy), x - p.sx) * R2D * 10) / 10; },
    fields: [
      { k: 'shape', t: 'sel', l: '形状', o: [['block', '长方形玻璃块/光纤'], ['semi', '半圆形玻璃块'], ['prism', '三棱镜'], ['rprism', '直角棱镜']], rebuild: true },
      { k: 'w', t: 'num', l: '宽', when: (p) => p.shape === 'block' }, { k: 'h', t: 'num', l: '高', when: (p) => p.shape === 'block' },
      { k: 'r', t: 'num', l: '半径', when: (p) => p.shape === 'semi' }, { k: 'side', t: 'num', l: '边长', when: (p) => p.shape === 'prism' || p.shape === 'rprism' },
      { k: 'apex', t: 'num', l: '顶角°', when: (p) => p.shape === 'prism' },
      { k: 'n', t: 'num', l: '折射率', step: 0.01 }, { k: 'n0', t: 'num', l: '外部折射率', step: 0.01 },
      { k: 'sx', t: 'num', l: '光线起点 x(拖第1个蓝点)' }, { k: 'sy', t: 'num', l: '光线起点 y' }, { k: 'ang', t: 'num', l: '光线方向°(拖第2个蓝点)', step: 1 },
      { k: 'ext', t: 'num', l: '射出后长度' }, { k: 'maxN', t: 'num', l: '最多界面次数' },
      { k: 'white', t: 'bool', l: '白光色散(七色)', rebuild: true }, { k: 'disp', t: 'num', l: '色散强度(夸张)', step: 0.01, when: (p) => p.white },
      { k: 'normals', t: 'bool', l: '法线' }, { k: 'nN', t: 'num', l: '画几处法线', when: (p) => p.normals }, { k: 'nl', t: 'num', l: '法线长度', when: (p) => p.normals },
      { k: 'partial', t: 'bool', l: '入射处部分反射' }, { k: 'aev', t: 'num', l: '标角度于第几个界面', min: 1 }, { k: 'il', t: 'text', l: '入射角标签' }, { k: 'rl', t: 'text', l: '折射/反射角标签' },
      ...rayFields, { k: 'lsize', t: 'num', l: '标签字号' },
    ],
    render(p, ctx) {
      const poly = (POLY[p.shape] || POLY.block)(p), n = +p.n || 1.5, n0 = +p.n0 || 1, st = [+p.sx, +p.sy], dir = dirOf(+p.ang), ext = +p.ext || 100, mx = clamp(+p.maxN || 14, 1, 60);
      let o = `<path d="M${poly.map((q) => pt(q[0], q[1])).join('L')}Z" ${PD.fillAttr(p, ctx)} ${sd(p)}/>`;
      const tr = L.trace(poly, n, n0, st, dir, mx, ext), nl = +p.nl || 36;
      if (p.normals) tr.ev.slice(0, Math.max(0, Math.round(+p.nN || 0))).forEach((e) => (o += `<line x1="${f(e.P[0] - e.N[0] * nl)}" y1="${f(e.P[1] - e.N[1] * nl)}" x2="${f(e.P[0] + e.N[0] * nl)}" y2="${f(e.P[1] + e.N[1] * nl)}" ${S(p, { dash: 'dash', sw: 0.8 })}/>`));
      if (p.partial && tr.ev[0] && tr.ev[0].refl) { const e = tr.ev[0]; o += L.ray(p, [e.P, [e.P[0] + e.refl[0] * +p.pl, e.P[1] + e.refl[1] * +p.pl]], { sw: Math.max(0.8, (+p.rw || 1.6) * 0.55) }); }
      if (p.white) {
        o += L.ray(p, tr.pts.slice(0, 2));
        SPEC.forEach((c, k) => { const t2 = L.trace(poly, n + (+p.disp || 0.06) * (k / 6 - 0.5), n0, st, dir, mx, ext); o += L.ray(p, t2.pts.slice(1), { color: c, sw: Math.max(1, (+p.rw || 1.6) * 0.8), arrows: false }); });
      } else o += L.ray(p, tr.pts);
      const e = tr.ev[Math.max(0, Math.round(+p.aev || 1) - 1)];
      if (e) {
        if (p.il) o += L.angArc(p, ctx, e.P, Math.atan2(e.N[1], e.N[0]), Math.atan2(-e.din[1], -e.din[0]), 22, p.il, p.lsize);
        if (p.rl) o += e.tir ? L.angArc(p, ctx, e.P, Math.atan2(e.N[1], e.N[0]), Math.atan2(e.dout[1], e.dout[0]), 30, p.rl, p.lsize)
          : L.angArc(p, ctx, e.P, Math.atan2(-e.N[1], -e.N[0]), Math.atan2(e.dout[1], e.dout[0]), 26, p.rl, p.lsize);
      }
      return o;
    },
  });

  /* ================= 鱼 / 鱼的视域 ================= */
  const fishSvg = (p, x, y, s, col) => `<g transform="translate(${pt(x, y)})"><path d="M${pt(-s * 0.42, 0)}L${pt(-s * 0.72, -s * 0.22)}L${pt(-s * 0.72, s * 0.22)}Z" fill="${col}" ${L.thin(p, 0.7)}/>` +
    `<path d="M${pt(-s / 2, 0)}Q${pt(0, -s * 0.36)} ${pt(s / 2, 0)}Q${pt(0, s * 0.36)} ${pt(-s / 2, 0)}Z" fill="${col}" ${L.thin(p, 0.8)}/><circle cx="${f(s * 0.28)}" cy="${f(-s * 0.05)}" r="${f(s * 0.045)}" fill="#111"/>` +
    `<path d="M${pt(-s * 0.05, -s * 0.12)}Q${pt(s * 0.08, 0)} ${pt(-s * 0.05, s * 0.12)}" fill="none" ${L.thin(p, 0.5)}/></g>`;
  PD.register({
    type: 'fish', name: '鱼', defaults: { s: 60, fill: '#f0a35e' },
    fields: [{ k: 's', t: 'num', l: '大小' }, { k: 'fill', t: 'color', l: '颜色' }], style: ['stroke', 'sw', 'opacity'],
    render(p) { return fishSvg(p, 0, 0, +p.s, p.fill); },
  });
  PD.register({
    type: 'fishview', name: '鱼的视域(斯涅耳窗)',
    defaults: { W: 380, D: 170, fd: 120, n: 1.33, rays: true, cone: true, tir: false, normals: true, alabel: '2c', air: '空气', water: '水', fs: 50, tint: true, rc: '#000000', rw: 1.4, lsize: 15 },
    fields: [{ k: 'W', t: 'num', l: '宽' }, { k: 'D', t: 'num', l: '水深' }, { k: 'fd', t: 'num', l: '鱼的深度' }, { k: 'n', t: 'num', l: '水的折射率', step: 0.01 },
      { k: 'rays', t: 'bool', l: '水面上方射入的光线' }, { k: 'cone', t: 'bool', l: '视域圆锥(临界角)' }, { k: 'alabel', t: 'text', l: '视域角标签' }, { k: 'tir', t: 'bool', l: '水下物体的全反射光线' },
      { k: 'normals', t: 'bool', l: '法线' }, { k: 'fs', t: 'num', l: '鱼大小' }, { k: 'tint', t: 'bool', l: '水的颜色' }, { k: 'air', t: 'text', l: '上层名称' }, { k: 'water', t: 'text', l: '下层名称' }, ...rayFields, { k: 'lsize', t: 'num', l: '标签字号' }],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const W = +p.W, Dd = +p.D, fd = Math.min(+p.fd, Dd - 10), n = Math.max(1.01, +p.n), c = Math.asin(1 / n), F = [0, fd], xc = fd * Math.tan(c), Lr = 80;
      let o = `<rect x="${f(-W / 2)}" y="0" width="${f(W)}" height="${f(Dd)}" fill="${p.tint ? WATER : '#ffffff'}"/><line x1="${f(-W / 2)}" y1="0" x2="${f(W / 2)}" y2="0" ${sd(p)}/>`;
      if (p.rays) {
        [-1, 1].forEach((s) => [89.5, 50].forEach((ideg) => {
          const i = ideg * D2R, r = Math.asin(Math.sin(i) / n), xh = s * fd * Math.tan(r), st = [xh - s * Lr * Math.sin(i), -Lr * Math.cos(i) - (ideg > 89 ? 1.5 : 0)];
          o += L.ray(p, [st, [xh, 0], F]);
          if (p.normals && ideg < 89) o += `<line x1="${f(xh)}" y1="-30" x2="${f(xh)}" y2="30" ${S(p, { dash: 'dash', sw: 0.7 })}/>`;
        }));
        o += L.ray(p, [[0, -Lr], [0, 0], F]);
      } else if (p.cone) o += L.ray(p, [[-xc, 0], F], { arrows: false }) + L.ray(p, [[xc, 0], F], { arrows: false });
      if (p.cone) {
        o += `<path d="M${pt(-xc, 0)}L${pt(F[0], F[1])}L${pt(xc, 0)}" fill="#ffffff" fill-opacity="0.35" stroke="none"/>`;
        if (p.alabel) o += L.angArc(p, ctx, F, Math.atan2(-fd, -xc), Math.atan2(-fd, xc), 26, p.alabel, p.lsize);
      }
      if (p.tir) {
        const Q = [fd * Math.tan(c + 0.28), 0], Sx = [Q[0] + (Q[0] - F[0]) * 0.75, F[1] * 0.75];
        o += L.ray(p, [Sx, Q, F]) + `<ellipse cx="${f(Sx[0])}" cy="${f(Sx[1] + 6)}" rx="9" ry="6" fill="#9a8f7f" ${L.thin(p, 0.6)}/>`;
      }
      o += fishSvg(p, -(+p.fs) * 0.28, fd + (+p.fs) * 0.05, +p.fs, '#f0a35e');
      if (p.air) o += T(ctx, p.air, -W / 2 + 8, -16, { size: p.lsize, anchor: 'start', italic: false, color: p.stroke });
      if (p.water) o += T(ctx, p.water, -W / 2 + 8, Dd - 14, { size: p.lsize, anchor: 'start', italic: false, color: p.stroke });
      return o;
    },
  });

  /* ================= 透镜成像（自动光路） ================= */
  PD.register({
    type: 'lens', name: '透镜成像(自动画光路和像)',
    defaults: { kind: 'convex', f: 90, u: 170, ho: 50, L: 520, Hl: 150, look: 'shape', r1: true, r2: true, r3: true, img: true, fl: 'F', twoF: true, ol: 'O', il: 'I', dims: false, rc: '#000000', rw: 1.4, lsize: 15, fillMode: 'solid', fill: GLASS },
    getHandles: (p) => [[-(+p.u), -(+p.ho)], [Math.abs(+p.f), 0]],
    setHandle(p, i, x, y) { if (i === 0) { p.u = f(Math.max(5, -x)); p.ho = f(-y); } else p.f = f(Math.max(8, Math.abs(x))); },
    fields: [
      { k: 'kind', t: 'sel', l: '透镜', o: [['convex', '凸透镜(会聚)'], ['concave', '凹透镜(发散)']] }, { k: 'look', t: 'sel', l: '画法', o: [['shape', '透镜外形'], ['symbol', '符号(箭头线)']] },
      { k: 'f', t: 'num', l: '焦距(拖右侧焦点)' }, { k: 'u', t: 'num', l: '物距(拖物体顶端)' }, { k: 'ho', t: 'num', l: '物高' },
      { k: 'L', t: 'num', l: '主轴长度' }, { k: 'Hl', t: 'num', l: '透镜高度' },
      { k: 'r1', t: 'bool', l: '光线1：平行主轴→过焦点' }, { k: 'r2', t: 'bool', l: '光线2：过光心' }, { k: 'r3', t: 'bool', l: '光线3：过焦点→平行主轴' },
      { k: 'img', t: 'bool', l: '画像(虚像为虚线)' }, { k: 'twoF', t: 'bool', l: '标 2F' }, { k: 'fl', t: 'text', l: '焦点标签' }, { k: 'ol', t: 'text', l: '物标签' }, { k: 'il', t: 'text', l: '像标签' },
      { k: 'dims', t: 'bool', l: '标物距 u、像距 v' }, ...rayFields, { k: 'lsize', t: 'num', l: '标签字号' },
    ],
    render(p, ctx) {
      const conc = p.kind === 'concave', F = (conc ? -1 : 1) * Math.max(1, Math.abs(+p.f)), af = Math.abs(F), u = Math.max(1, +p.u), ho = +p.ho;
      const Hl = +p.Hl / 2, Lx = Math.max(+p.L / 2, u + 30, p.twoF ? 2 * af + 30 : 0), inf = Math.abs(u - F) < 0.5;
      const v = inf ? Infinity : (u * F) / (u - F), real = isFinite(v) && v > 0, I = isFinite(v) ? [v, (ho * v) / u] : null;
      const Xend = real ? Math.max(Lx, v + 40) : Lx, Ymax = Math.max(Hl * 1.6, Math.abs(ho) * 2.5, I && Math.abs(I[1]) < 2000 ? Math.abs(I[1]) + 30 : 0);
      const go = (A, d) => { let t = (Xend - A[0]) / d[0]; if (Math.abs(d[1]) > 1e-9) { const ty = ((d[1] > 0 ? Ymax : -Ymax) - A[1]) / d[1]; if (ty > 0) t = Math.min(t, ty); } return [A[0] + d[0] * t, A[1] + d[1] * t]; };
      let o = `<line x1="${f(-Lx)}" y1="0" x2="${f(Xend)}" y2="0" ${S(p, { dash: 'solid', sw: 0.9 })}/>`;
      if (p.look === 'symbol') {
        const ah = 10; o += `<line x1="0" y1="${f(-Hl)}" x2="0" y2="${f(Hl)}" ${S(p, { dash: 'solid', sw: (+p.sw || 1.5) * 1.3 })}/>`;
        o += conc ? PD.arrowHead(0, -Hl, Math.PI / 2, ah, 'open', p.stroke, p.sw) + PD.arrowHead(0, Hl, -Math.PI / 2, ah, 'open', p.stroke, p.sw)
          : PD.arrowHead(0, -Hl, -Math.PI / 2, ah, 'open', p.stroke, p.sw) + PD.arrowHead(0, Hl, Math.PI / 2, ah, 'open', p.stroke, p.sw);
      } else if (conc) { const e = Hl * 0.14, c = Hl * 0.03; o += `<path d="M${pt(-e, -Hl)}L${pt(e, -Hl)}Q${pt(2 * c - e, 0)} ${pt(e, Hl)}L${pt(-e, Hl)}Q${pt(e - 2 * c, 0)} ${pt(-e, -Hl)}Z" ${PD.fillAttr(p, ctx)} ${sd(p)}/>`; }
      else { const tw = Hl * 0.36; o += `<path d="M0,${f(-Hl)}Q${pt(tw, 0)} 0,${f(Hl)}Q${pt(-tw, 0)} 0,${f(-Hl)}Z" ${PD.fillAttr(p, ctx)} ${sd(p)}/>`; }
      const fm = (x, lab) => `<line x1="${f(x)}" y1="-4" x2="${f(x)}" y2="4" ${S(p, { dash: 'solid', sw: 1.3 })}/>` + (lab ? T(ctx, lab, x, 16, { size: p.lsize, color: p.stroke }) : '');
      o += fm(-af, p.fl) + fm(af, p.fl) + (p.twoF ? fm(-2 * af, '2' + p.fl) + fm(2 * af, '2' + p.fl) : '');
      const T0 = [-u, -ho], rays = [], dsh = [];
      if (p.r1) { const A = [0, -ho], d = nrm(conc ? [-F, -ho] : [F, ho]); rays.push([T0, A, go(A, d)]); if (!real && (conc || I)) dsh.push([A, conc ? [F, 0] : I]); }
      if (p.r2) { const A = [0, 0], d = nrm([u, ho]); rays.push([T0, A, go(A, d)]); if (!real && I) dsh.push([A, I]); }
      if (p.r3 && !inf) { const y3 = (ho * F) / (u - F); if (Math.abs(y3) < Ymax) { const A = [0, y3]; rays.push([T0, A, go(A, [1, 0])]); if (!real && I) dsh.push([A, I]); } }
      rays.forEach((r) => (o += L.ray(p, r)));
      dsh.forEach((s) => (o += L.ray(p, s, { dashSeg: [true] })));
      o += L.arrow(p, -u, 0, -u, -ho, { sw: 2 });
      if (p.ol) o += T(ctx, p.ol, -u - 8, -ho / 2, { size: p.lsize, anchor: 'end', color: p.stroke, halo: true });
      if (p.img && I && Math.abs(I[1]) < 2000) {
        o += L.arrow(p, I[0], 0, I[0], I[1], { sw: real ? 2 : 1.6, dash: real ? 'solid' : 'dash' });
        if (p.il) o += T(ctx, p.il, I[0] + 8, I[1] / 2, { size: p.lsize, anchor: 'start', color: p.stroke, halo: true });
      }
      if (p.dims) { const y = Math.max(Hl, Math.abs(ho)) + 22; o += L.dim(p, ctx, -u, y, 0, y, 'u', { off: -12 }); if (I) o += L.dim(p, ctx, 0, y + (real ? 0 : 22), I[0], y + (real ? 0 : 22), 'v', { off: -12 }); }
      return o;
    },
  });

  /* ================= 眼睛 ================= */
  PD.register({ type: 'eye', name: '眼睛(侧视)', defaults: { s: 40, iris: '#4f6d8f' }, fields: [{ k: 's', t: 'num', l: '大小' }, { k: 'iris', t: 'color', l: '虹膜颜色' }], style: ['stroke', 'sw', 'opacity'], render(p) { return L.eyeSvg(p, 0, 0, +p.s, false); } });

  /* ================= 光线盒 / 激光笔 / 光屏 / 直尺 ================= */
  PD.register({
    type: 'raybox', name: '光线盒(射线箱)',
    defaults: { w: 70, h: 40, ray: true, rl: 160, n: 1, gap: 14, rc: '#000000', rw: 1.6, fill: '#4d4d4d' },
    fields: [{ k: 'w', t: 'num', l: '宽' }, { k: 'h', t: 'num', l: '高' }, { k: 'ray', t: 'bool', l: '射出光线' }, { k: 'rl', t: 'num', l: '光线长度' }, { k: 'n', t: 'num', l: '光线数(平行)', min: 1 }, { k: 'gap', t: 'num', l: '光线间距' }, { k: 'fill', t: 'color', l: '盒子颜色' }, ...rayFields],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p) {
      const w = +p.w, h = +p.h, n = Math.max(1, Math.round(+p.n)), g = +p.gap;
      let o = `<rect x="${f(-w)}" y="${f(-h / 2)}" width="${f(w)}" height="${f(h)}" rx="3" fill="${p.fill}" ${sd(p)}/><circle cx="${f(-w * 0.55)}" cy="0" r="${f(h * 0.22)}" fill="#ffe680" ${L.thin(p, 0.6)}/>`;
      o += `<rect x="-3" y="${f(-((n - 1) * g) / 2 - 5)}" width="4" height="${f((n - 1) * g + 10)}" fill="#bbbbbb" ${L.thin(p, 0.6)}/>`;
      if (p.ray) for (let k = 0; k < n; k++) { const y = (k - (n - 1) / 2) * g; o += L.ray(p, [[1, y], [+p.rl, y]]); }
      return o;
    },
  });
  PD.register({
    type: 'laser', name: '激光笔',
    defaults: { L: 110, d: 16, beam: true, bl: 180, bc: '#d62828', bw: 1.6, fill: '#3a3a3a' },
    fields: [{ k: 'L', t: 'num', l: '长度' }, { k: 'd', t: 'num', l: '粗细' }, { k: 'beam', t: 'bool', l: '激光束' }, { k: 'bl', t: 'num', l: '光束长度' }, { k: 'bc', t: 'color', l: '光束颜色' }, { k: 'bw', t: 'num', l: '光束线宽', step: 0.2 }, { k: 'fill', t: 'color', l: '笔身颜色' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const Lp = +p.L, d = +p.d;
      let o = p.beam ? L.ray(p, [[2, 0], [+p.bl, 0]], { color: p.bc, sw: +p.bw }) : '';
      o += `<path d="M${pt(-Lp, -d / 2)}H${f(-d * 0.8)}L0,${f(-d * 0.28)}V${f(d * 0.28)}L${pt(-d * 0.8, d / 2)}H${f(-Lp)}Q${pt(-Lp - d * 0.4, 0)} ${pt(-Lp, -d / 2)}Z" fill="${L.metal(ctx, p.fill, -d / 2, d / 2, true)}" ${sd(p)}/>`;
      o += `<rect x="${f(-Lp * 0.55)}" y="${f(-d / 2 - 3)}" width="${f(d * 0.8)}" height="4" rx="1.5" fill="#999" ${L.thin(p, 0.6)}/><circle cx="1" cy="0" r="${f(d * 0.16)}" fill="${p.bc}"/>`;
      return o;
    },
  });
  PD.register({
    type: 'screen', name: '光屏',
    defaults: { H: 200, t: 8, stand: true, fill: '#c8ccd1', label: '', lsize: 14 },
    handles: [['zero', 'H', 1, 0.5]],
    fields: [{ k: 'H', t: 'num', l: '高' }, { k: 't', t: 'num', l: '厚度' }, { k: 'stand', t: 'bool', l: '底座' }, { k: 'fill', t: 'color', l: '颜色' }, { k: 'label', t: 'text', l: '标签' }, { k: 'lsize', t: 'num', l: '标签字号' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const H = +p.H, t = +p.t;
      let o = `<rect x="${f(-t / 2)}" y="${f(-H / 2)}" width="${f(t)}" height="${f(H)}" fill="${p.fill}" ${sd(p)}/>`;
      if (p.stand) o += `<rect x="-22" y="${f(H / 2)}" width="44" height="8" rx="2" fill="#8a8a8a" ${sd(p)}/>`;
      if (p.label) o += T(ctx, p.label, 0, H / 2 + (p.stand ? 24 : 14), { size: p.lsize, italic: false, color: p.stroke });
      return o;
    },
  });
  PD.register({
    type: 'ruler', name: '直尺(厘米刻度)',
    defaults: { L: 300, h: 26, cm: 30, nums: true, mm: true, fill: '#f3e3b5' },
    handles: [['L', 'zero']],
    fields: [{ k: 'L', t: 'num', l: '长度' }, { k: 'h', t: 'num', l: '宽' }, { k: 'cm', t: 'num', l: '1 cm = px' }, { k: 'mm', t: 'bool', l: '毫米刻度' }, { k: 'nums', t: 'bool', l: '数字' }, { k: 'fill', t: 'color', l: '颜色' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const Lr = +p.L, h = +p.h, cm = Math.max(4, +p.cm), st = p.mm ? cm / 10 : cm / 2, x0 = 8;
      let o = `<rect x="0" y="0" width="${f(Lr)}" height="${f(h)}" rx="2" fill="${p.fill}" ${sd(p)}/>`, d = '';
      for (let i = 0, x = x0; x <= Lr - 4; i++, x = x0 + i * st) {
        const isCm = Math.abs((x - x0) / cm - Math.round((x - x0) / cm)) < 1e-6, half = !isCm && Math.abs((x - x0) / (cm / 2) - Math.round((x - x0) / (cm / 2))) < 1e-6;
        d += `M${pt(x, 0)}v${f(h * (isCm ? 0.42 : half ? 0.3 : 0.18))}`;
        if (isCm && p.nums) o += T(ctx, String(Math.round((x - x0) / cm)), x, h * 0.72, { size: Math.min(10, h * 0.36), italic: false, color: p.stroke });
      }
      return o + `<path d="${d}" fill="none" ${L.thin(p, 0.45)}/>`;
    },
  });

  /* ================= 预设 ================= */
  PD.preset(C1, '平面镜', 'mirror', {});
  PD.preset(C1, '平面镜(竖直)', 'mirror', { rot: -90, L: 180 });
  PD.preset(C1, '光线(可加转折点)', 'raypath', {});
  PD.preset(C1, '反射定律', 'raypath', { pts: '-110,-110 0,0 110,-110' });
  PD.preset(C1, '平面镜成像(像与物)', 'mirrorimg', {});
  PD.preset(C1, '像与物的移动', 'mirrorimg', { rays: 0, eye: false, move: true, dims: true });
  PD.preset(C1, '潜望镜(平面镜)', 'periscope', {});
  PD.preset(C1, '潜望镜(棱镜)', 'periscope', { kind: 'prism' });
  PD.preset(C1, '折射(空气→玻璃)', 'boundary', { il: 'i', rl: 'r' });
  PD.preset(C1, '折射(空气→水)', 'boundary', { n2: 1.33, m2: '水', c2: WATER, i: 45 });
  PD.preset(C1, '全反射(玻璃→空气)', 'boundary', { from: 'bottom', i: 50, il: 'i', rl: '', ref: '' });
  PD.preset(C1, '临界角', 'boundary', { from: 'bottom', i: 41.8, il: 'c', rl: '', partial: true });
  PD.preset(C1, '长方形玻璃块(侧移)', 'glass', { nN: 2, il: 'i', rl: 'r' });
  PD.preset(C1, '半圆形玻璃块(全反射实验)', 'glass', { shape: 'semi', r: 70, sx: -60, sy: 104, ang: 60, aev: 2, nN: 0, normals: false, partial: false, il: 'i', rl: 'r' });
  PD.preset(C1, '半圆形玻璃块(大于临界角)', 'glass', { shape: 'semi', r: 70, sx: -90, sy: 80, ang: 40, aev: 2, normals: false, il: 'i', rl: 'r' });
  PD.preset(C1, '三棱镜(色散)', 'glass', { shape: 'prism', side: 150, sx: -170, sy: 20, ang: 12, white: true, normals: false, ext: 140 });
  PD.preset(C1, '三棱镜(单色光)', 'glass', { shape: 'prism', side: 150, sx: -170, sy: 20, ang: 12, normals: true, nN: 2 });
  PD.preset(C1, '直角棱镜(偏转90°)', 'glass', { shape: 'rprism', side: 120, sx: -140, sy: 15, ang: 0, normals: false });
  PD.preset(C1, '直角棱镜(偏转180°)', 'glass', { shape: 'rprism', side: 120, sx: 90, sy: -50, ang: -135, normals: false, ext: 110 });
  PD.preset(C1, '光纤(全反射)', 'glass', { w: 380, h: 26, sx: -230, sy: -18, ang: -12, normals: false, maxN: 40, ext: 50 });
  PD.preset(C1, '鱼的视域', 'fishview', {});
  PD.preset(C1, '鱼', 'fish', {});
  PD.preset(C1, '眼睛', 'eye', {});
  PD.preset(C2, '凸透镜(实像)', 'lens', {});
  PD.preset(C2, '凸透镜(放大虚像)', 'lens', { u: 55, ho: 40 });
  PD.preset(C2, '凸透镜(物在 2F 外)', 'lens', { u: 230, ho: 45, f: 80 });
  PD.preset(C2, '凹透镜', 'lens', { kind: 'concave', u: 160, ho: 55 });
  PD.preset(C2, '透镜符号光路', 'lens', { look: 'symbol' });
  PD.preset(CE, '光线盒', 'raybox', {});
  PD.preset(CE, '光线盒(三条平行光)', 'raybox', { n: 3, gap: 22, h: 70 });
  PD.preset(CE, '激光笔', 'laser', {});
  PD.preset(CE, '光屏', 'screen', {});
  PD.preset(CE, '直尺', 'ruler', {});
})();
