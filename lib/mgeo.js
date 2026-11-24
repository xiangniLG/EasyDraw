/* 数学素材库（一）：平面几何 · 立体几何 · 三角学 · 数线
   geom  平面几何作图语言（点的定义 + 作图指令，可拖动顶点）
   solid3 立体几何（长方体/正方体/棱锥/四面体/三棱柱/楔形/棱台 + 截面、线面角）
   bearing 方位角 · elev 仰角/俯角 · numline 数线(不等式的解) */
(function () {
  'use strict';
  const f = PD.f, S = PD.strokeAttr, T = PD.tex;
  const M = (PD.mlab = PD.mlab || {});
  const D2R = Math.PI / 180, R2D = 180 / Math.PI;
  const pt = (M.pt = (x, y) => f(x) + ',' + f(y));
  const sd = (M.sd = (p) => S(p, { dash: 'solid' }));
  const thin = (M.thin = (p, k = 0.7) => S(p, { sw: Math.max(0.6, (+p.sw || 1.5) * k), dash: 'solid' }));
  const clamp = (M.clamp = (v, a, b) => Math.max(a, Math.min(b, v)));
  const C1 = '数学/平面几何', C2 = '数学/立体几何', C3 = '数学/三角学', C4 = '数学/数与代数';

  /* ================= 共享辅助 ================= */
  M.arrow = (p, x0, y0, x1, y1, o = {}) => {
    const l = Math.hypot(x1 - x0, y1 - y0); if (l < 1) return '';
    const ux = (x1 - x0) / l, uy = (y1 - y0) / l, sw = o.sw || +p.sw || 1.5, ah = o.ah || 5 + 2.4 * sw, col = o.color || p.stroke;
    return `<line x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1 - ux * ah * 0.7)}" y2="${f(y1 - uy * ah * 0.7)}" ${S(p, { color: col, sw, dash: o.dash || 'solid' })}/>` + PD.arrowHead(x1, y1, Math.atan2(uy, ux), ah, o.head || 'tri', col, sw);
  };
  // 双箭头尺寸线，标签在行进方向左侧 off 像素处
  M.dim = (p, ctx, x1, y1, x2, y2, label, o = {}) => {
    const l = Math.hypot(x2 - x1, y2 - y1); if (l < 2) return '';
    const ux = (x2 - x1) / l, uy = (y2 - y1) / l, ah = o.ah || 7, col = o.color || p.stroke, sw = o.sw || 0.9;
    let s = `<line x1="${f(x1 + ux * ah * 0.7)}" y1="${f(y1 + uy * ah * 0.7)}" x2="${f(x2 - ux * ah * 0.7)}" y2="${f(y2 - uy * ah * 0.7)}" ${S(p, { color: col, sw, dash: 'solid' })}/>`;
    s += PD.arrowHead(x1, y1, Math.atan2(-uy, -ux), ah, 'full', col, sw) + PD.arrowHead(x2, y2, Math.atan2(uy, ux), ah, 'full', col, sw);
    if (label) { const off = o.off ?? 12; s += T(ctx, label, (x1 + x2) / 2 + uy * off, (y1 + y2) / 2 - ux * off, { size: o.size || 14, color: col, halo: true }); }
    return s;
  };
  // 以 c 为圆心、从方向 a1 到 a2 的较小圆弧路径（SVG 角度，弧度）
  M.arcD = (c, r, a1, a2) => {
    let d = a2 - a1; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
    return { d: `M${pt(c[0] + r * Math.cos(a1), c[1] + r * Math.sin(a1))}A${f(r)},${f(r)} 0 0 ${d > 0 ? 1 : 0} ${pt(c[0] + r * Math.cos(a1 + d), c[1] + r * Math.sin(a1 + d))}`, mid: a1 + d / 2 };
  };
  // 名称 → 排版：A' → A′，A1 → A_1
  M.nameTex = (n) => String(n).replace(/'/g, '′').replace(/^([A-Za-z]+)(\d+)(′*)$/, '$1_{$2}$3');
  M.regionFill = (st, ctx, col) => {
    st = st || 'gray';
    if (st === 'gray') return 'fill="#000000" fill-opacity="0.12"';
    if (st === 'fill') return 'fill="#dfe7f1"';
    if (st[0] === '#') return `fill="${st}" fill-opacity="0.35"`;
    return PD.fillAttr({ fillMode: { hatch: 'hatch', cross: 'cross', dots: 'dots' }[st] || 'hatch', fill: col || '#000000' }, ctx);
  };
  const STYLE_TOK = { dash: 1, dot: 1, dashdot: 1, solid: 1, bold: 1, thin: 1 }, FILL_TOK = { fill: 1, gray: 1, hatch: 1, cross: 1, dots: 1 };
  // 文本记号：双引号包住的是一个整体；逗号、空格都当分隔符
  M.tok = (s) => { const r = []; String(s).replace(/"([^"]*)"|[^\s,，]+/g, (m, q) => { r.push(q !== undefined ? { q } : m); return m; }); return r; };
  const tv = (t) => (typeof t === 'string' ? t : t ? t.q : '');
  const isName = (t) => typeof t === 'string' && /^[A-Za-z][A-Za-z0-9_′']*$/.test(t) && !STYLE_TOK[t] && !FILL_TOK[t];
  const errBox = (ctx, err) => (err.length && ctx.mode === 'edit' ? err.slice(0, 6).map((t, i) => `<text x="0" y="${-30 - (err.length - 1 - i) * 15}" font-size="12" fill="#d32f2f" font-family="sans-serif">${PD.esc(t)}</text>`).join('') : '');
  const dirVec = (d) => { const m = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0], ne: [0.75, -0.66], nw: [-0.75, -0.66], se: [0.75, 0.66], sw: [-0.75, 0.66] }[String(d).toLowerCase()]; if (m) return m; const a = +d; return isFinite(a) ? [Math.cos(a * D2R), -Math.sin(a * D2R)] : null; };
  M.labelAt = (ctx, p, txt, P, u, size, off) => { off = off || 13; return T(ctx, txt, P[0] + u[0] * off, P[1] + u[1] * off + 1, { size, color: p.stroke, halo: true }); };
  // 等长记号 / 平行记号（屏幕坐标）
  M.ticks = (p, A, B, n, kind) => {
    n = Math.max(1, Math.round(+n || 1)); const dx = B[0] - A[0], dy = B[1] - A[1], l = Math.hypot(dx, dy) || 1, u = [dx / l, dy / l], v = [-u[1], u[0]], m = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
    let d = '';
    if (kind === 'par') { for (let k = 0; k < n; k++) { const c = [m[0] + u[0] * (k - (n - 1) / 2) * 6, m[1] + u[1] * (k - (n - 1) / 2) * 6], h = 6; d += `M${pt(c[0] - u[0] * h + v[0] * h * 0.75, c[1] - u[1] * h + v[1] * h * 0.75)}L${pt(c[0], c[1])}L${pt(c[0] - u[0] * h - v[0] * h * 0.75, c[1] - u[1] * h - v[1] * h * 0.75)}`; } }
    else for (let k = 0; k < n; k++) { const c = [m[0] + u[0] * (k - (n - 1) / 2) * 4, m[1] + u[1] * (k - (n - 1) / 2) * 4]; d += `M${pt(c[0] - v[0] * 5.5, c[1] - v[1] * 5.5)}L${pt(c[0] + v[0] * 5.5, c[1] + v[1] * 5.5)}`; }
    return `<path d="${d}" fill="none" ${S(p, { dash: 'solid', sw: Math.max(1, (+p.sw || 1.5) * 0.85) })}/>`;
  };
  // 角弧（屏幕坐标）：在 B 处 BA 与 BC 之间
  M.angle = (p, ctx, A, B, C, label, n, r, size) => {
    const a1 = Math.atan2(A[1] - B[1], A[0] - B[0]), a2 = Math.atan2(C[1] - B[1], C[0] - B[0]); let s = '', mid = 0;
    n = Math.max(1, Math.round(+n || 1));
    for (let k = 0; k < n; k++) { const q = M.arcD(B, r + k * 4, a1, a2); s += `<path d="${q.d}" fill="none" ${thin(p, 0.75)}/>`; mid = q.mid; }
    if (label) s += T(ctx, label, B[0] + (r + 4 * (n - 1) + 11) * Math.cos(mid), B[1] + (r + 4 * (n - 1) + 11) * Math.sin(mid) + 1, { size, color: p.stroke, halo: true });
    return s;
  };
  M.right = (p, A, B, C, s) => {
    const u = [A[0] - B[0], A[1] - B[1]], v = [C[0] - B[0], C[1] - B[1]], lu = Math.hypot(u[0], u[1]) || 1, lv = Math.hypot(v[0], v[1]) || 1; s = s || 10;
    const P1 = [B[0] + (u[0] / lu) * s, B[1] + (u[1] / lu) * s], P3 = [B[0] + (v[0] / lv) * s, B[1] + (v[1] / lv) * s], P2 = [P1[0] + P3[0] - B[0], P1[1] + P3[1] - B[1]];
    return `<path d="M${pt(...P1)}L${pt(...P2)}L${pt(...P3)}" fill="none" ${thin(p, 0.75)}/>`;
  };

  /* ================= 几何计算（数学坐标，y 向上） ================= */
  const G = (M.geo = {});
  G.foot = (P, A, B) => { const dx = B[0] - A[0], dy = B[1] - A[1], l2 = dx * dx + dy * dy || 1, t = ((P[0] - A[0]) * dx + (P[1] - A[1]) * dy) / l2; return [A[0] + dx * t, A[1] + dy * t]; };
  G.inter = (A, B, C, D) => { const d = (B[0] - A[0]) * (D[1] - C[1]) - (B[1] - A[1]) * (D[0] - C[0]); if (Math.abs(d) < 1e-9) return null; const t = ((C[0] - A[0]) * (D[1] - C[1]) - (C[1] - A[1]) * (D[0] - C[0])) / d; return [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t]; };
  G.dist = (A, B) => Math.hypot(A[0] - B[0], A[1] - B[1]);
  G.circum = (A, B, C) => { const d = 2 * (A[0] * (B[1] - C[1]) + B[0] * (C[1] - A[1]) + C[0] * (A[1] - B[1])); if (Math.abs(d) < 1e-9) throw new Error('三点共线'); const a2 = A[0] ** 2 + A[1] ** 2, b2 = B[0] ** 2 + B[1] ** 2, c2 = C[0] ** 2 + C[1] ** 2; return [(a2 * (B[1] - C[1]) + b2 * (C[1] - A[1]) + c2 * (A[1] - B[1])) / d, (a2 * (C[0] - B[0]) + b2 * (A[0] - C[0]) + c2 * (B[0] - A[0])) / d]; };
  G.incenter = (A, B, C) => { const a = G.dist(B, C), b = G.dist(C, A), c = G.dist(A, B), s = a + b + c || 1; return [(a * A[0] + b * B[0] + c * C[0]) / s, (a * A[1] + b * B[1] + c * C[1]) / s]; };
  G.inradius = (A, B, C) => { const a = G.dist(B, C), b = G.dist(C, A), c = G.dist(A, B), ar = Math.abs((B[0] - A[0]) * (C[1] - A[1]) - (C[0] - A[0]) * (B[1] - A[1])) / 2; return (2 * ar) / (a + b + c || 1); };

  /* ================= 平面几何作图语言 ================= */
  const GEOM_HELP = `【定义点】(数学坐标，y 向上，单位 px)
A = 0, 0            指定坐标(可拖动)
A = @ 30            在圆上，角度 30°(可拖动)
A = @ 30, 80        以 O 为圆心、半径 80
M = mid A B         中点
P = on A B 0.3      AB 上的点(比例)
F = foot C A B      C 到 AB 的垂足
X = int A B C D     直线 AB 与 CD 的交点
P = polar A 40 150  从 A 沿 40° 方向 150 px
P = rot A B 60      A 绕 B 转 60°
P = refl A B C      A 关于直线 BC 的对称点
I = incenter A B C  内心(circumcenter / centroid / orthocenter)
T, U = tan P        从 P 到圆的两个切点
【作图】
poly A B C [fill|gray|hatch]   多边形
seg A B C [dash|dot|bold]      折线段
line A B / ray A B             直线 / 射线
circle   circ O A   circ O 50   incircle A B C   circumcircle A B C
angle A B C [标签] [弧数]      ∠ABC
right A B C                    直角记号
tick A B [n]   par A B [n]     等长 / 平行记号
len A B 标签                   边长标注
dot A B   hide A   lab A ne ["文字"]`;

  function geomBuild(p) {
    const R = +p.R || 0, P = { O: [0, 0] }, err = [], H = [], used = new Set(), explicit = new Set(), draws = [];
    const g = (t) => { const n = tv(t); if (!(n in P)) throw new Error('未定义的点「' + n + '」'); used.add(n); return P[n]; };
    String(p.script || '').split('\n').forEach((raw, li) => {
      const line = raw.replace(/\/\/.*$/, '').trim(); if (!line || line[0] === '#') return;
      try {
        const m = /^([A-Za-z][A-Za-z0-9_′']*(?:\s*,\s*[A-Za-z][A-Za-z0-9_′']*)?)\s*=\s*(.+)$/.exec(line);
        if (!m) { draws.push({ t: M.tok(line), li }); return; }
        const names = m[1].split(',').map((s) => s.trim()), t = M.tok(m[2]);
        if (typeof t[0] === 'string' && /^@./.test(t[0])) t.splice(0, 1, '@', t[0].slice(1));
        const k = String(tv(t[0])).toLowerCase(), n = (i) => { const v = +tv(t[i]); if (!isFinite(v) || tv(t[i]) === '') throw new Error('这里需要数字'); return v; };
        let val;
        if (k === '@') { const c = P.O, r = t.length > 2 ? n(2) : R, a = n(1) * D2R; val = [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]; H.push({ li, name: names[0], kind: 'at', r: t.length > 2 ? tv(t[2]) : null }); }
        else if (isFinite(+k) && k !== '' && t.length >= 2) { val = [n(0), n(1)]; H.push({ li, name: names[0], kind: 'abs' }); }
        else if (k === 'mid') { const a = g(t[1]), b = g(t[2]); val = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; }
        else if (k === 'on') { const a = g(t[1]), b = g(t[2]), s = n(3); val = [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s]; }
        else if (k === 'foot') val = G.foot(g(t[1]), g(t[2]), g(t[3]));
        else if (k === 'int') { val = G.inter(g(t[1]), g(t[2]), g(t[3]), g(t[4])); if (!val) throw new Error('两直线平行，没有交点'); }
        else if (k === 'incenter') val = G.incenter(g(t[1]), g(t[2]), g(t[3]));
        else if (k === 'circumcenter') val = G.circum(g(t[1]), g(t[2]), g(t[3]));
        else if (k === 'centroid') { const a = g(t[1]), b = g(t[2]), c = g(t[3]); val = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3]; }
        else if (k === 'orthocenter') { const a = g(t[1]), b = g(t[2]), c = g(t[3]), o = G.circum(a, b, c); val = [a[0] + b[0] + c[0] - 2 * o[0], a[1] + b[1] + c[1] - 2 * o[1]]; }
        else if (k === 'polar') { const a = g(t[1]), ang = n(2) * D2R, d = n(3); val = [a[0] + d * Math.cos(ang), a[1] + d * Math.sin(ang)]; }
        else if (k === 'rot') { const a = g(t[1]), c = g(t[2]), ang = n(3) * D2R, dx = a[0] - c[0], dy = a[1] - c[1]; val = [c[0] + dx * Math.cos(ang) - dy * Math.sin(ang), c[1] + dx * Math.sin(ang) + dy * Math.cos(ang)]; }
        else if (k === 'refl') { const a = g(t[1]), F = G.foot(a, g(t[2]), g(t[3])); val = [2 * F[0] - a[0], 2 * F[1] - a[1]]; }
        else if (k === 'tan') {
          const q = g(t[1]), c = P.O, d = G.dist(q, c); if (d <= R + 1e-9) throw new Error('点在圆上或圆内，不能作切线');
          const th = Math.atan2(q[1] - c[1], q[0] - c[0]), ph = Math.acos(R / d);
          P[names[0]] = [c[0] + R * Math.cos(th + ph), c[1] + R * Math.sin(th + ph)]; explicit.add(names[0]);
          if (names[1]) { P[names[1]] = [c[0] + R * Math.cos(th - ph), c[1] + R * Math.sin(th - ph)]; explicit.add(names[1]); }
          return;
        } else throw new Error('看不懂「' + m[2] + '」');
        P[names[0]] = val; explicit.add(names[0]);
      } catch (e) { err.push(`第 ${li + 1} 行：${e.message}`); }
    });
    return { P, H, draws, err, used, explicit, g };
  }
  PD.register({
    type: 'geom', name: '平面几何(作图语言)',
    defaults: { script: 'A = 0, 110\nB = -90, -40\nC = 120, -40\npoly A B C', R: 100, circle: false, center: true, cl: 'O', ext: 40, ar: 18, lsize: 17, alldots: false, dr: 2.6 },
    getHandles(p) { const b = geomBuild(p); return b.H.filter((h) => b.P[h.name]).map((h) => [b.P[h.name][0], -b.P[h.name][1]]); },
    setHandle(p, i, x, y) {
      const b = geomBuild(p), h = b.H.filter((q) => b.P[q.name])[i]; if (!h) return;
      const L = String(p.script).split('\n');
      if (h.kind === 'abs') L[h.li] = `${h.name} = ${f(x)}, ${f(-y)}`;
      else { const c = b.P.O, a = Math.round(Math.atan2(-y - c[1], x - c[0]) * R2D * 10) / 10; L[h.li] = `${h.name} = @ ${a}` + (h.r != null ? `, ${h.r}` : ''); }
      p.script = L.join('\n');
    },
    fields: [
      { k: 'script', t: 'area', l: '作图(每行一条；拖蓝点移动顶点)', ph: GEOM_HELP },
      { k: 'circle', t: 'bool', l: '画圆(圆心 O)' }, { k: 'R', t: 'num', l: '圆的半径' }, { k: 'center', t: 'bool', l: '圆心点', when: (p) => p.circle }, { k: 'cl', t: 'text', l: '圆心标签', when: (p) => p.circle && p.center },
      { k: 'alldots', t: 'bool', l: '所有点画实心点' }, { k: 'dr', t: 'num', l: '点大小', step: 0.2 }, { k: 'ar', t: 'num', l: '角弧半径' }, { k: 'ext', t: 'num', l: '直线伸出长度' }, { k: 'lsize', t: 'num', l: '标签字号' },
    ],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const b = geomBuild(p), V = (q) => [q[0], -q[1]], R = +p.R || 0, ls = +p.lsize || 17, err = b.err.slice();
      const opt = (toks) => { const o = { dash: 'solid', sw: +p.sw || 1.5, color: p.stroke, fill: '' }; toks.forEach((t) => { const s = tv(t); if (STYLE_TOK[s]) { if (s === 'bold') o.sw *= 1.8; else if (s === 'thin') o.sw *= 0.6; else o.dash = s; } else if (FILL_TOK[s]) o.fill = s; else if (/^#[0-9a-f]{3,6}$/i.test(s)) o.color = s; }); return o; };
      let fills = '', lines = '', marks = '', dots = '', labs = '';
      const hidden = new Set(), dotSet = new Set(), labOver = {};
      const cir = (c, r, o) => `<circle cx="${f(c[0])}" cy="${f(c[1])}" r="${f(r)}" fill="none" ${S(p, { color: o.color, sw: o.sw, dash: o.dash })}/>`;
      const extLine = (A, B, e0, e1) => { const l = G.dist(A, B) || 1, u = [(B[0] - A[0]) / l, (B[1] - A[1]) / l]; return [[A[0] - u[0] * e0, A[1] - u[1] * e0], [B[0] + u[0] * e1, B[1] + u[1] * e1]]; };
      if (p.circle && R > 0) lines += cir(V(b.P.O), R, opt([]));
      b.draws.forEach(({ t, li }) => {
        try {
          const cmd = String(tv(t[0])).toLowerCase(), rest = t.slice(1), names = rest.filter(isName), pts = () => names.map((n) => V(b.g(n))), o = opt(rest), st = S(p, { color: o.color, sw: o.sw, dash: o.dash });
          if (cmd === 'seg' || cmd === 'poly') {
            const P = pts(); if (P.length < 2) throw new Error('至少要两个点');
            const d = 'M' + P.map((q) => pt(q[0], q[1])).join('L') + (cmd === 'poly' ? 'Z' : '');
            if (o.fill) fills += `<path d="${d}" ${M.regionFill(o.fill, ctx, o.color)} stroke="none"/>`;
            lines += `<path d="${d}" fill="none" ${st}/>`;
          } else if (cmd === 'line' || cmd === 'ray') {
            const P = pts(); if (P.length < 2) throw new Error('需要两个点');
            const e = +p.ext || 40, [a, c] = extLine(P[0], P[1], cmd === 'line' ? e : 0, e);
            lines += `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(c[0])}" y2="${f(c[1])}" ${st}/>`;
          } else if (cmd === 'circle') lines += cir(V(b.P.O), R, o);
          else if (cmd === 'circ') { const c = V(b.g(rest[0])), r2 = isName(rest[1]) ? G.dist(c, V(b.g(rest[1]))) : +tv(rest[1]); if (!(r2 > 0)) throw new Error('半径需要是点或数字'); lines += cir(c, r2, o); }
          else if (cmd === 'incircle' || cmd === 'circumcircle') {
            const [A, B, C] = names.slice(0, 3).map((n) => b.g(n)); if (!C) throw new Error('需要三个点');
            if (cmd === 'incircle') lines += cir(V(G.incenter(A, B, C)), G.inradius(A, B, C), o); else { const c = G.circum(A, B, C); lines += cir(V(c), G.dist(c, A), o); }
          } else if (cmd === 'angle') {
            const P = names.slice(0, 3); if (P.length < 3) throw new Error('需要三个点，例如 angle A B C');
            let extra = rest.slice(rest.indexOf(P[2]) + 1).map(tv), nArc = 1;
            if (extra.length && /^[1-4]$/.test(extra[extra.length - 1]) && (extra.length > 1 || typeof rest[rest.length - 1] === 'string')) nArc = +extra.pop();
            marks += M.angle(p, ctx, V(b.g(P[0])), V(b.g(P[1])), V(b.g(P[2])), extra.join(' '), nArc, +p.ar || 18, ls - 2);
          } else if (cmd === 'right') { const P = pts(); if (P.length < 3) throw new Error('需要三个点'); marks += M.right(p, P[0], P[1], P[2], 10); }
          else if (cmd === 'tick' || cmd === 'par') { const P = pts(); if (P.length < 2) throw new Error('需要两个点'); const nn = rest.map(tv).find((s) => /^\d+$/.test(s)); marks += M.ticks(p, P[0], P[1], nn || 1, cmd); }
          else if (cmd === 'len') {
            const P = names.slice(0, 2).map((n) => V(b.g(n))); if (P.length < 2) throw new Error('需要两个点');
            const txt = rest.slice(rest.indexOf(names[1]) + 1).map(tv).join(' '), mid = [(P[0][0] + P[1][0]) / 2, (P[0][1] + P[1][1]) / 2];
            const allP = Object.keys(b.P).filter((n) => b.used.has(n) || b.explicit.has(n)).map((n) => V(b.P[n])), cen = allP.reduce((s, q) => [s[0] + q[0] / allP.length, s[1] + q[1] / allP.length], [0, 0]);
            const dx = P[1][0] - P[0][0], dy = P[1][1] - P[0][1], l = Math.hypot(dx, dy) || 1; let nrm = [dy / l, -dx / l];
            if ((mid[0] - cen[0]) * nrm[0] + (mid[1] - cen[1]) * nrm[1] < 0) nrm = [-nrm[0], -nrm[1]];
            labs += T(ctx, txt, mid[0] + nrm[0] * 13, mid[1] + nrm[1] * 13 + 1, { size: ls - 2, color: p.stroke, halo: true });
          } else if (cmd === 'dot') names.forEach((n) => { b.g(n); dotSet.add(n); });
          else if (cmd === 'hide') names.forEach((n) => hidden.add(n));
          else if (cmd === 'lab') { const n = tv(rest[0]); b.g(n); labOver[n] = { dir: dirVec(tv(rest[1])), text: rest.length > 2 ? rest.slice(2).map(tv).join(' ') : null }; }
          else throw new Error('不认识的指令「' + cmd + '」');
        } catch (e) { err.push(`第 ${li + 1} 行：${e.message}`); }
      });
      // 点标签
      const show = Object.keys(b.P).filter((n) => !hidden.has(n) && n[0] !== '_' && (n === 'O' ? b.used.has('O') || b.explicit.has('O') || (p.circle && p.center) : b.used.has(n) || b.explicit.has(n)));
      const ref = p.circle && R > 0 ? V(b.P.O) : (() => { const Q = show.map((n) => V(b.P[n])); return Q.reduce((s, q) => [s[0] + q[0] / Q.length, s[1] + q[1] / Q.length], [0, 0]); })();
      show.forEach((n) => {
        const P = V(b.P[n]), ov = labOver[n] || {}; let u = ov.dir;
        if (!u) { const dx = P[0] - ref[0], dy = P[1] - ref[1], l = Math.hypot(dx, dy); u = l < 2 ? [-0.7, 0.7] : [dx / l, dy / l]; }
        let txt = ov.text != null ? ov.text : M.nameTex(n); if (n === 'O' && p.cl && ov.text == null) txt = p.cl;
        labs += M.labelAt(ctx, p, txt, P, u, ls, 13);
        if (p.alldots || dotSet.has(n) || (n === 'O' && p.circle && p.center)) dots += `<circle cx="${f(P[0])}" cy="${f(P[1])}" r="${f(+p.dr || 2.6)}" fill="${p.stroke}"/>`;
      });
      dotSet.forEach((n) => { if (!show.includes(n)) { const P = V(b.P[n]); dots += `<circle cx="${f(P[0])}" cy="${f(P[1])}" r="${f(+p.dr || 2.6)}" fill="${p.stroke}"/>`; } });
      return fills + lines + marks + dots + labs + errBox(ctx, err);
    },
  });

  /* ================= 立体几何 ================= */
  const SOLIDS = [['cuboid', '长方体 ABCD-EFGH'], ['cube', '正方体'], ['pyramid', '四棱锥 V-ABCD'], ['tetra', '三棱锥 V-ABC'], ['tprism', '三棱柱 ABC-DEF'], ['wedge', '楔形(斜面) ABCD-EF'], ['frustum', '四棱台 ABCD-EFGH']];
  const DEFNAMES = { cuboid: 'A B C D E F G H', cube: 'A B C D E F G H', pyramid: 'V A B C D', tetra: 'V A B C', tprism: 'A B C D E F', wedge: 'A B C D E F', frustum: 'A B C D E F G H' };
  function solidGeo(p) {
    const w = +p.w / 2, d = +p.d / 2, h = +p.h, sh = p.shape, k = clamp(+p.top || 0.5, 0.05, 0.95);
    let V, F;
    const base = [[-w, 0, d], [w, 0, d], [w, 0, -d], [-w, 0, -d]];
    if (sh === 'cuboid' || sh === 'cube') { const s = sh === 'cube' ? [w, w * 2, w] : [w, h, d]; const bb = [[-s[0], 0, s[2]], [s[0], 0, s[2]], [s[0], 0, -s[2]], [-s[0], 0, -s[2]]]; V = bb.concat(bb.map((q) => [q[0], s[1], q[2]])); F = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]]; }
    else if (sh === 'pyramid') { V = [[+p.ax || 0, h, +p.az || 0]].concat(base); F = [[1, 2, 3, 4], [0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 1]]; }
    else if (sh === 'tetra') { const tb = [[-w, 0, d], [w, 0, d], [+p.cx || 0, 0, -d]], cen = [(tb[0][0] + tb[1][0] + tb[2][0]) / 3, 0, (tb[0][2] + tb[1][2] + tb[2][2]) / 3]; V = [[cen[0] + (+p.ax || 0), h, cen[2] + (+p.az || 0)]].concat(tb); F = [[1, 2, 3], [0, 1, 2], [0, 2, 3], [0, 3, 1]]; }
    else if (sh === 'tprism') { const tb = [[-w, 0, d], [w, 0, d], [+p.cx || 0, 0, -d]]; V = tb.concat(tb.map((q) => [q[0], h, q[2]])); F = [[0, 1, 2], [3, 4, 5], [0, 1, 4, 3], [1, 2, 5, 4], [2, 0, 3, 5]]; }
    else if (sh === 'wedge') { V = base.concat([[w, h, -d], [-w, h, -d]]); F = [[0, 1, 2, 3], [2, 3, 5, 4], [0, 1, 4, 5], [1, 2, 4], [0, 3, 5]]; }
    else { V = base.concat(base.map((q) => [q[0] * k, h, q[2] * k])); F = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]]; }
    const nm = String(p.names || '').trim() ? String(p.names).trim().split(/[\s,]+/) : DEFNAMES[sh].split(' ');
    return { V, F, nm };
  }
  const v3 = { sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k], dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], len: (a) => Math.hypot(a[0], a[1], a[2]) };
  v3.nrm = (a) => v3.mul(a, 1 / (v3.len(a) || 1));
  const SOLID_HELP = `【定义点】
M = mid A B        中点
O = center A B C D 多个点的中心
P = on A B 0.25    AB 上的点(比例)
N = foot V A B C   V 到平面 ABC 的垂足
Q = foot2 P A B    P 到直线 AB 的垂足
X = 0, 50, 0       空间坐标(x 右, y 上, z 向前)
【作图】
seg A G [dash]     线段(被遮住的请写 dash)
poly P Q R [fill|gray|hatch]  截面
angle E C A θ [弧数]   ∠ECA
right E A C        直角记号
tick A B [n]   len A B 标签
dot P   hide H   lab A ne ["文字"]`;
  PD.register({
    type: 'solid3', name: '立体几何(标顶点、截面、线面角)',
    defaults: Object.assign({}, PD.projDef, { shape: 'cuboid', w: 160, d: 100, h: 90, top: 0.5, ax: 0, az: 0, cx: 0, names: '', script: '', hidden: 'dash', shading: false, fill: '#dfe7f1', ar: 16, lsize: 16 }),
    fields: [
      { k: 'shape', t: 'sel', l: '立体', o: SOLIDS, rebuild: true },
      { k: 'w', t: 'num', l: '长 / 底边' }, { k: 'd', t: 'num', l: '阔(纵深)', when: (p) => p.shape !== 'cube' }, { k: 'h', t: 'num', l: '高', when: (p) => p.shape !== 'cube' },
      { k: 'top', t: 'range', l: '顶面比例', min: 0.05, max: 0.95, step: 0.05, when: (p) => p.shape === 'frustum' },
      { k: 'ax', t: 'num', l: '顶点左右偏移(斜棱锥)', when: (p) => p.shape === 'pyramid' || p.shape === 'tetra' }, { k: 'az', t: 'num', l: '顶点前后偏移', when: (p) => p.shape === 'pyramid' || p.shape === 'tetra' },
      { k: 'cx', t: 'num', l: '底面第三顶点左右位置', when: (p) => p.shape === 'tetra' || p.shape === 'tprism' },
      { k: 'names', t: 'text', l: '顶点名称(空=默认，空格分隔)' },
      { k: 'script', t: 'area', l: '附加作图(截面、对角线、角)', ph: SOLID_HELP },
      ...PD.projFields, { k: 'hidden', t: 'sel', l: '被遮挡的棱', o: PD.HIDDEN }, { k: 'shading', t: 'bool', l: '光影着色(用填充色)' }, { k: 'ar', t: 'num', l: '角弧半径' }, { k: 'lsize', t: 'num', l: '标签字号' },
    ],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const { V, F, nm } = solidGeo(p), body = PD.polyhedron(p, ctx, V, F), Pj = body.P, ls = +p.lsize || 16, err = [];
      const W = {}; nm.forEach((n, i) => { if (V[i]) W[n] = V[i]; });
      const pr = (q) => { const r = Pj(q[0], q[1], q[2]); return [r.x, r.y]; };
      const cen3 = V.reduce((s, q) => v3.add(s, v3.mul(q, 1 / V.length)), [0, 0, 0]), cen = pr(cen3);
      const g = (t) => { const n = tv(t); if (!(n in W)) throw new Error('未定义的点「' + n + '」'); return W[n]; };
      let fills = '', lines = '', marks = '', dots = '', labs = '';
      const hidden = new Set(), dotSet = new Set(), labOver = {}, extra = new Set();
      String(p.script || '').split('\n').forEach((raw, li) => {
        const line = raw.replace(/\/\/.*$/, '').trim(); if (!line || line[0] === '#') return;
        try {
          const m = /^([A-Za-z][A-Za-z0-9_′']*)\s*=\s*(.+)$/.exec(line);
          if (m) {
            const t = M.tok(m[2]), k = String(tv(t[0])).toLowerCase(), n = (i) => { const v = +tv(t[i]); if (!isFinite(v)) throw new Error('这里需要数字'); return v; };
            let val;
            if (k === 'mid') val = v3.mul(v3.add(g(t[1]), g(t[2])), 0.5);
            else if (k === 'center') { const Q = t.slice(1).map(g); val = Q.reduce((s, q) => v3.add(s, v3.mul(q, 1 / Q.length)), [0, 0, 0]); }
            else if (k === 'on') { const a = g(t[1]), b = g(t[2]); val = v3.add(a, v3.mul(v3.sub(b, a), n(3))); }
            else if (k === 'foot') { const P0 = g(t[1]), A = g(t[2]), B = g(t[3]), C = g(t[4]), N = v3.nrm(v3.cross(v3.sub(B, A), v3.sub(C, A))); val = v3.sub(P0, v3.mul(N, v3.dot(v3.sub(P0, A), N))); }
            else if (k === 'foot2') { const P0 = g(t[1]), A = g(t[2]), B = g(t[3]), u = v3.sub(B, A), tt = v3.dot(v3.sub(P0, A), u) / (v3.dot(u, u) || 1); val = v3.add(A, v3.mul(u, tt)); }
            else if (isFinite(+k) && t.length >= 3) val = [n(0), n(1), n(2)];
            else throw new Error('看不懂「' + m[2] + '」');
            W[m[1]] = val; extra.add(m[1]); return;
          }
          const t = M.tok(line), cmd = String(tv(t[0])).toLowerCase(), rest = t.slice(1), names = rest.filter(isName);
          const o = { dash: 'solid', sw: +p.sw || 1.5, color: p.stroke, fill: '' };
          rest.forEach((x) => { const s = tv(x); if (STYLE_TOK[s]) { if (s === 'bold') o.sw *= 1.8; else if (s === 'thin') o.sw *= 0.6; else o.dash = s; } else if (FILL_TOK[s]) o.fill = s; else if (/^#[0-9a-f]{3,6}$/i.test(s)) o.color = s; });
          const st = S(p, { color: o.color, sw: o.dash === 'dash' ? o.sw * 0.85 : o.sw, dash: o.dash });
          if (cmd === 'seg' || cmd === 'poly') {
            const Q = names.map((nn) => pr(g(nn))); if (Q.length < 2) throw new Error('至少要两个点');
            const d = 'M' + Q.map((q) => pt(q[0], q[1])).join('L') + (cmd === 'poly' ? 'Z' : '');
            if (cmd === 'poly' && o.fill) fills += `<path d="${d}" ${M.regionFill(o.fill === 'fill' ? 'gray' : o.fill, ctx, o.color)} stroke="none"/>`;
            lines += `<path d="${d}" fill="none" ${st}/>`;
          } else if (cmd === 'angle') {
            const P3 = names.slice(0, 3); if (P3.length < 3) throw new Error('需要三个点');
            const ex = rest.slice(rest.indexOf(P3[2]) + 1).map(tv); let nArc = 1; if (ex.length && /^[1-4]$/.test(ex[ex.length - 1])) nArc = +ex.pop();
            const A = g(P3[0]), B = g(P3[1]), C = g(P3[2]), u = v3.nrm(v3.sub(A, B)), vv = v3.sub(C, B), wv = v3.nrm(v3.sub(vv, v3.mul(u, v3.dot(vv, u)))), th = Math.acos(clamp(v3.dot(u, v3.nrm(vv)), -1, 1));
            const r0 = (+p.ar || 16) * 1.25; let midP = null;
            for (let kk = 0; kk < nArc; kk++) { const rr = r0 + kk * 5, Q = []; for (let i = 0; i <= 24; i++) { const a = (th * i) / 24; Q.push(pr(v3.add(B, v3.add(v3.mul(u, rr * Math.cos(a)), v3.mul(wv, rr * Math.sin(a)))))); } marks += `<polyline points="${PD.ptsStr(Q)}" fill="none" ${thin(p, 0.75)}/>`; }
            const lab = ex.join(' ');
            if (lab) { midP = pr(v3.add(B, v3.add(v3.mul(u, (r0 + 14 + (nArc - 1) * 5) * Math.cos(th / 2)), v3.mul(wv, (r0 + 14 + (nArc - 1) * 5) * Math.sin(th / 2))))); marks += T(ctx, lab, midP[0], midP[1] + 1, { size: ls - 2, color: p.stroke, halo: true }); }
          } else if (cmd === 'right') {
            const [A, B, C] = names.slice(0, 3).map(g); if (!C) throw new Error('需要三个点');
            const s = 9, u = v3.nrm(v3.sub(A, B)), vv = v3.nrm(v3.sub(C, B)), Q = [v3.add(B, v3.mul(u, s)), v3.add(B, v3.add(v3.mul(u, s), v3.mul(vv, s))), v3.add(B, v3.mul(vv, s))].map(pr);
            marks += `<polyline points="${PD.ptsStr(Q)}" fill="none" ${thin(p, 0.75)}/>`;
          } else if (cmd === 'tick') { const Q = names.slice(0, 2).map((nn) => pr(g(nn))); const c = rest.map(tv).find((s) => /^\d+$/.test(s)); marks += M.ticks(p, Q[0], Q[1], c || 1); }
          else if (cmd === 'len') {
            const Q = names.slice(0, 2).map((nn) => pr(g(nn))), txt = rest.slice(rest.indexOf(names[1]) + 1).map(tv).join(' '), mid = [(Q[0][0] + Q[1][0]) / 2, (Q[0][1] + Q[1][1]) / 2];
            const dx = Q[1][0] - Q[0][0], dy = Q[1][1] - Q[0][1], l = Math.hypot(dx, dy) || 1; let nr = [dy / l, -dx / l]; if ((mid[0] - cen[0]) * nr[0] + (mid[1] - cen[1]) * nr[1] < 0) nr = [-nr[0], -nr[1]];
            labs += T(ctx, txt, mid[0] + nr[0] * 13, mid[1] + nr[1] * 13 + 1, { size: ls - 2, color: p.stroke, halo: true });
          } else if (cmd === 'dot') names.forEach((nn) => { g(nn); dotSet.add(nn); });
          else if (cmd === 'hide') names.forEach((nn) => hidden.add(nn));
          else if (cmd === 'lab') { const nn = tv(rest[0]); g(nn); labOver[nn] = { dir: dirVec(tv(rest[1])), text: rest.length > 2 ? rest.slice(2).map(tv).join(' ') : null }; }
          else throw new Error('不认识的指令「' + cmd + '」');
        } catch (e) { err.push(`第 ${li + 1} 行：${e.message}`); }
      });
      Object.keys(W).forEach((nn) => {
        if (hidden.has(nn) || nn[0] === '_') return;
        const P = pr(W[nn]), ov = labOver[nn] || {}; let u = ov.dir;
        if (!u) { const dx = P[0] - cen[0], dy = P[1] - cen[1], l = Math.hypot(dx, dy); u = l < 2 ? [0.7, 0.7] : [dx / l, dy / l]; }
        labs += M.labelAt(ctx, p, ov.text != null ? ov.text : M.nameTex(nn), P, u, ls, 12);
        if (dotSet.has(nn) || extra.has(nn)) dots += `<circle cx="${f(P[0])}" cy="${f(P[1])}" r="2.4" fill="${p.stroke}"/>`;
      });
      return body.out + fills + lines + marks + dots + labs + errBox(ctx, err);
    },
  });

  /* ================= 方位角 ================= */
  const bearTxt = (b, style) => {
    b = ((b % 360) + 360) % 360;
    if (style !== 'compass') return String(Math.round(b * 10) / 10).padStart(3, '0') + '°';
    if (b === 0) return 'N'; if (b === 90) return 'E'; if (b === 180) return 'S'; if (b === 270) return 'W';
    const r = (v) => Math.round(v * 10) / 10;
    return b < 90 ? `N${r(b)}°E` : b < 180 ? `S${r(180 - b)}°E` : b < 270 ? `S${r(b - 180)}°W` : `N${r(360 - b)}°W`;
  };
  PD.register({
    type: 'bearing', name: '方位角(真方位 / 罗盘方位)',
    defaults: { style: 'true', origin: 'A', pts: 'B, 40, 160', nlen: 70, nAll: false, arcs: true, labs: true, segs: '', ar: 26, lsize: 16 },
    fields: [
      { k: 'style', t: 'sel', l: '表示法', o: [['true', '真方位(如 040°)'], ['compass', '罗盘方位(如 N40°E)']] }, { k: 'origin', t: 'text', l: '出发点名称' },
      { k: 'pts', t: 'area', l: '目标点(每行: 名称, 方位角°, 距离 px)', ph: '方位角由正北顺时针量度\n例: B, 40, 160\n例: C, 300, 120' },
      { k: 'segs', t: 'area', l: '连线(每行两点，如 B C)' }, { k: 'nAll', t: 'bool', l: '每个目标点也画指北线' },
      { k: 'nlen', t: 'num', l: '指北线长度' }, { k: 'arcs', t: 'bool', l: '画角弧' }, { k: 'labs', t: 'bool', l: '标方位' }, { k: 'ar', t: 'num', l: '角弧半径' }, { k: 'lsize', t: 'num', l: '字号' },
    ],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const ls = +p.lsize || 16, nl = +p.nlen || 70, O = [0, 0], P = { [p.origin || 'A']: O };
      const rows = PD.lines(p.pts).map((l) => l.split(',').map((s) => s.trim())).filter((a) => a.length >= 3 && isFinite(+a[1]) && isFinite(+a[2]));
      rows.forEach((a) => { const b = +a[1] * D2R; P[a[0]] = [Math.sin(b) * +a[2], -Math.cos(b) * +a[2]]; });
      const north = (q) => M.arrow(p, q[0], q[1] + nl * 0.25, q[0], q[1] - nl, { sw: Math.max(1, (+p.sw || 1.5) * 0.8), head: 'open' }) + T(ctx, 'N', q[0], q[1] - nl - 12, { size: ls - 1, italic: false, color: p.stroke });
      let o = north(O);
      rows.forEach((a) => {
        const Q = P[a[0]], b = ((+a[1] % 360) + 360) % 360;
        o += `<line x1="0" y1="0" x2="${f(Q[0])}" y2="${f(Q[1])}" ${sd(p)}/>`;
        if (p.nAll) o += north(Q);
        if (p.arcs) {
          const r = +p.ar || 26;
          if (p.style === 'compass') {
            const fromS = b > 90 && b < 270, ref = fromS ? Math.PI / 2 : -Math.PI / 2, q = M.arcD(O, r, ref, Math.atan2(Q[1], Q[0]));
            if (fromS) o += `<line x1="0" y1="0" x2="0" y2="${f(nl * 0.5)}" ${S(p, { dash: 'dash', sw: 0.8 })}/>`;
            o += `<path d="${q.d}" fill="none" ${thin(p, 0.75)}/>`;
            if (p.labs) o += T(ctx, `${Math.round((fromS ? Math.abs(180 - b) : b > 180 ? 360 - b : b) * 10) / 10}°`, (r + 14) * Math.cos(q.mid), (r + 14) * Math.sin(q.mid), { size: ls - 3, italic: false, color: p.stroke, halo: true });
          } else {
            const a0 = -Math.PI / 2, a1 = a0 + b * D2R, large = b > 180 ? 1 : 0;
            o += `<path d="M${pt(0, -r)}A${f(r)},${f(r)} 0 ${large} 1 ${pt(r * Math.cos(a1), r * Math.sin(a1))}" fill="none" ${thin(p, 0.75)}/>` + PD.arrowHead(r * Math.cos(a1), r * Math.sin(a1), a1 + Math.PI / 2, 6, 'full', p.stroke, 1);
            if (p.labs) { const am = a0 + (b * D2R) / 2; o += T(ctx, `${Math.round(b * 10) / 10}°`, (r + 15) * Math.cos(am), (r + 15) * Math.sin(am), { size: ls - 3, italic: false, color: p.stroke, halo: true }); }
          }
        }
        const l = Math.hypot(Q[0], Q[1]) || 1;
        o += `<circle cx="${f(Q[0])}" cy="${f(Q[1])}" r="2.6" fill="${p.stroke}"/>` + T(ctx, M.nameTex(a[0]), Q[0] + (Q[0] / l) * 13, Q[1] + (Q[1] / l) * 13, { size: ls, color: p.stroke, halo: true });
        if (p.labs && !p.arcs) o += T(ctx, bearTxt(b, p.style), Q[0] / 2 + (Q[1] / l) * 12, Q[1] / 2 - (Q[0] / l) * 12, { size: ls - 3, italic: false, color: p.stroke, halo: true });
      });
      PD.lines(p.segs).forEach((l) => { const [a, c] = l.split(/[\s,\-]+/); if (P[a] && P[c]) o += `<line x1="${f(P[a][0])}" y1="${f(P[a][1])}" x2="${f(P[c][0])}" y2="${f(P[c][1])}" ${sd(p)}/>`; });
      o += `<circle r="2.6" fill="${p.stroke}"/>` + T(ctx, M.nameTex(p.origin || 'A'), -12, 12, { size: ls, color: p.stroke, halo: true });
      return o;
    },
  });

  /* ================= 仰角 / 俯角 ================= */
  const person = (p, x, yFoot, h) => { const s = h / 6, sw = Math.max(1.3, (+p.sw || 1.5) * 0.9), c = p.stroke; return `<circle cx="${f(x)}" cy="${f(yFoot - 5.3 * s)}" r="${f(0.7 * s)}" fill="#ffffff" stroke="${c}" stroke-width="${f(sw)}"/><path d="M${pt(x, yFoot - 4.6 * s)}V${f(yFoot - 2.2 * s)}M${pt(x - 1.4 * s, yFoot - 3.3 * s)}L${pt(x, yFoot - 3.9 * s)}L${pt(x + 1.4 * s, yFoot - 3.3 * s)}M${pt(x - 1 * s, yFoot)}L${pt(x, yFoot - 2.2 * s)}L${pt(x + 1 * s, yFoot)}" fill="none" stroke="${c}" stroke-width="${f(sw)}" stroke-linecap="round" stroke-linejoin="round"/>`; };
  PD.register({
    type: 'elev', name: '仰角 / 俯角',
    defaults: { kind: 'elev', obj: 'building', d: 240, h: 150, e: 0, man: false, al: '\\theta', hl: 'h', dl: 'd', alt: false, dims: true, lsize: 16 },
    fields: [
      { k: 'kind', t: 'sel', l: '类型', o: [['elev', '仰角(从地面看上去)'], ['dep', '俯角(从高处看下去)']], rebuild: true },
      { k: 'obj', t: 'sel', l: '物体', o: [['building', '大厦'], ['tower', '旗杆 / 塔'], ['tree', '树'], ['cliff', '悬崖 + 船'], ['point', '只画点']] },
      { k: 'd', t: 'num', l: '水平距离 px' }, { k: 'h', t: 'num', l: '高度 px' }, { k: 'e', t: 'num', l: '观察者眼高 px(0 = 地面)' }, { k: 'man', t: 'bool', l: '画观察者(人)' },
      { k: 'al', t: 'text', l: '角的标签' }, { k: 'alt', t: 'bool', l: '另一端标出相等的错角', when: (p) => p.kind === 'dep' },
      { k: 'dims', t: 'bool', l: '标高度、距离' }, { k: 'hl', t: 'text', l: '高度标签', when: (p) => p.dims }, { k: 'dl', t: 'text', l: '距离标签', when: (p) => p.dims }, { k: 'lsize', t: 'num', l: '字号' },
    ],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const d = +p.d, h = +p.h, e = +p.e || 0, ls = +p.lsize || 16, el = p.kind !== 'dep';
      let o = '';
      const ground = (x0, x1) => { let s = `<line x1="${f(x0)}" y1="0" x2="${f(x1)}" y2="0" ${sd(p)}/>`, dd = ''; for (let x = x0 + 4; x < x1; x += 9) dd += `M${pt(x, 0)}l-5,7`; return s + `<path d="${dd}" fill="none" ${thin(p, 0.5)}/>`; };
      const objAt = (x, top) => {
        if (p.obj === 'building') { const w = Math.max(40, h * 0.35); return `<rect x="${f(x)}" y="${f(-top)}" width="${f(w)}" height="${f(top)}" fill="#f1f1f1" ${sd(p)}/>` + Array.from({ length: Math.max(1, Math.floor(top / 26)) }, (_, i) => `<rect x="${f(x + w * 0.2)}" y="${f(-top + 10 + i * 26)}" width="${f(w * 0.22)}" height="12" fill="none" ${thin(p, 0.5)}/><rect x="${f(x + w * 0.58)}" y="${f(-top + 10 + i * 26)}" width="${f(w * 0.22)}" height="12" fill="none" ${thin(p, 0.5)}/>`).join(''); }
        if (p.obj === 'tower') return `<line x1="${f(x)}" y1="0" x2="${f(x)}" y2="${f(-top)}" ${S(p, { dash: 'solid', sw: (+p.sw || 1.5) * 1.6 })}/><path d="M${pt(x, -top)}l26,7l-26,7Z" fill="#ffffff" ${thin(p, 0.8)}/>`;
        if (p.obj === 'tree') { const r = Math.max(18, top * 0.25); return `<line x1="${f(x)}" y1="0" x2="${f(x)}" y2="${f(-top + r)}" ${S(p, { dash: 'solid', sw: 4 })}/><circle cx="${f(x)}" cy="${f(-top + r)}" r="${f(r)}" fill="#ffffff" ${sd(p)}/>`; }
        return '';
      };
      if (el) {
        const Ex = [0, -e], top = [d, -h], bx = p.obj === 'building' ? d : d;
        o += ground(-30, d + Math.max(60, h * 0.4));
        o += objAt(bx, h);
        if (p.man) o += person(p, -12, 0, Math.max(30, e || 36));
        o += `<line x1="${f(Ex[0])}" y1="${f(Ex[1])}" x2="${f(d)}" y2="${f(Ex[1])}" ${S(p, { dash: 'dash', sw: 0.9 })}/><line x1="${f(Ex[0])}" y1="${f(Ex[1])}" x2="${f(top[0])}" y2="${f(top[1])}" ${sd(p)}/>`;
        o += M.angle(p, ctx, [d, Ex[1]], Ex, top, p.al, 1, 34, ls - 1);
        o += `<circle cx="${f(top[0])}" cy="${f(top[1])}" r="2.4" fill="${p.stroke}"/>`;
        if (p.dims) { const xh = d - 16; o += M.dim(p, ctx, xh, 0, xh, -h, p.hl, { off: 10, size: ls - 1 }) + M.dim(p, ctx, 0, 18, d, 18, p.dl, { off: -12, size: ls - 1 }); }
      } else {
        const cw = Math.max(70, h * 0.45), Ex = [0, -h - e], B = [d, 0];
        o += `<path d="M${pt(-cw, 0)}V${f(-h)}H0V0Z" fill="#eeeeee" ${sd(p)}/><path d="M${pt(-cw, -h)}H0V0" fill="none" ${sd(p)}/>`;
        let wv = `M0,0`; for (let x = 0; x <= d + 80; x += 12) wv += `q3,-3 6,0t6,0`; o += `<path d="${wv}" fill="none" ${thin(p, 0.7)}/>`;
        if (p.obj === 'cliff' || p.obj === 'building' || p.obj === 'tower' || p.obj === 'tree') o += `<path d="M${pt(d - 22, -2)}L${pt(d + 22, -2)}L${pt(d + 14, 8)}L${pt(d - 14, 8)}Z" fill="#ffffff" ${sd(p)}/><line x1="${f(d)}" y1="-2" x2="${f(d)}" y2="-24" ${thin(p, 0.9)}/><path d="M${pt(d, -24)}L${pt(d + 14, -8)}L${pt(d, -8)}Z" fill="#ffffff" ${thin(p, 0.8)}/>`;
        if (p.man) o += person(p, -10, -h, Math.max(30, e || 36));
        o += `<line x1="${f(Ex[0])}" y1="${f(Ex[1])}" x2="${f(d + 30)}" y2="${f(Ex[1])}" ${S(p, { dash: 'dash', sw: 0.9 })}/><line x1="${f(Ex[0])}" y1="${f(Ex[1])}" x2="${f(B[0])}" y2="${f(B[1] - 4)}" ${sd(p)}/>`;
        o += M.angle(p, ctx, [d, Ex[1]], Ex, [B[0], B[1] - 4], p.al, 1, 38, ls - 1);
        if (p.alt) o += M.angle(p, ctx, Ex, [B[0], B[1] - 4], [B[0] - 60, B[1] - 4], p.al, 1, 30, ls - 1);
        if (p.dims) o += M.dim(p, ctx, -cw - 14, 0, -cw - 14, -h, p.hl, { off: 10, size: ls - 1 }) + M.dim(p, ctx, 0, 22, d, 22, p.dl, { off: -12, size: ls - 1 });
      }
      return o;
    },
  });

  /* ================= 数线（不等式的解） ================= */
  function parseIneq(s) {
    const pieces = String(s).split(/\s+(?:or|或)\s+/i), out = [];
    for (const piece of pieces) {
      const q = piece.replace(/≤/g, '<=').replace(/≥/g, '>=').replace(/\s+/g, '');
      let m = /^(-?[\d.]+)(<=|<|>=|>)([a-z])(<=|<|>=|>)(-?[\d.]+)$/i.exec(q);
      if (m) { const lo = m[2][0] === '<' ? [+m[1], m[2].length === 1] : [+m[5], m[4].length === 1], hi = m[2][0] === '<' ? [+m[5], m[4].length === 1] : [+m[1], m[2].length === 1]; out.push({ v: m[3], lo, hi }); continue; }
      m = /^([a-z])(<=|<|>=|>)(-?[\d.]+)$/i.exec(q);
      if (m) { const c = [+m[3], m[2].length === 1]; out.push(m[2][0] === '>' ? { v: m[1], lo: c, hi: null } : { v: m[1], lo: null, hi: c }); continue; }
      m = /^(-?[\d.]+)(<=|<|>=|>)([a-z])$/i.exec(q);
      if (m) { const c = [+m[1], m[2].length === 1]; out.push(m[2][0] === '<' ? { v: m[3], lo: c, hi: null } : { v: m[3], lo: null, hi: c }); continue; }
      m = /^([a-z])=(-?[\d.]+)$/i.exec(q); if (m) { out.push({ v: m[1], lo: [+m[2], false], hi: [+m[2], false] }); continue; }
      return null;
    }
    return out;
  }
  PD.register({
    type: 'numline', name: '数线(不等式的解)',
    defaults: { xmin: -4, xmax: 6, step: 1, lab: 1, u: 40, rows: 'x > 2', gap: 22, onAxis: false, vert: true, showIneq: true, lsize: 15, cc: '#000000' },
    fields: [
      { k: 'xmin', t: 'num', l: '最小' }, { k: 'xmax', t: 'num', l: '最大' }, { k: 'step', t: 'num', l: '刻度间隔', step: 0.5 }, { k: 'lab', t: 'num', l: '每几个刻度标数字', min: 1 }, { k: 'u', t: 'num', l: '每单位 px' },
      { k: 'rows', t: 'area', l: '不等式(每行一条，画在数线上方)', ph: '例: x > 2\n例: -1 < x <= 3\n例: x <= -1 or x > 2\n例: x = 3' },
      { k: 'onAxis', t: 'bool', l: '只有一条时直接画在数线上' }, { k: 'gap', t: 'num', l: '行距' }, { k: 'vert', t: 'bool', l: '端点画竖线连到数线' }, { k: 'showIneq', t: 'bool', l: '在右边写出不等式' },
      { k: 'cc', t: 'color', l: '解集颜色' }, { k: 'lsize', t: 'num', l: '字号' },
    ],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const a = +p.xmin, b = +p.xmax, u = +p.u || 40, st = +p.step || 1, ls = +p.lsize || 15, X = (v) => (v - a) * u, W = (b - a) * u, err = [];
      let o = `<line x1="-20" y1="0" x2="${f(W + 16)}" y2="0" ${sd(p)}/>` + PD.arrowHead(W + 24, 0, 0, 9, 'full', p.stroke, 1) + PD.arrowHead(-28, 0, Math.PI, 9, 'full', p.stroke, 1);
      let tk = '';
      for (let i = 0, v = a; v <= b + 1e-9; i++, v = a + i * st) { const x = X(v); tk += `M${pt(x, -5)}V5`; if (i % Math.max(1, Math.round(+p.lab || 1)) === 0) o += T(ctx, PD.fmt(Math.round(v * 1e6) / 1e6), x, 18, { size: ls - 2, italic: false, color: p.stroke }); }
      o += `<path d="${tk}" fill="none" ${sd(p)}/>`;
      const rows = PD.lines(p.rows), one = rows.length === 1 && p.onAxis, cc = p.cc || p.stroke, sw = (+p.sw || 1.5) * 2;
      rows.forEach((r, k) => {
        const segs = parseIneq(r); if (!segs) { err.push('看不懂「' + r + '」'); return; }
        const y = one ? 0 : -(k + 1) * (+p.gap || 22);
        segs.forEach((g) => {
          const x0 = g.lo ? X(g.lo[0]) : -24, x1 = g.hi ? X(g.hi[0]) : W + 24;
          if (x1 > x0 + 0.5) { o += `<line x1="${f(x0)}" y1="${f(y)}" x2="${f(g.hi ? x1 : x1 - 8)}" y2="${f(y)}" stroke="${cc}" stroke-width="${f(sw)}"/>`; if (!g.hi) o += PD.arrowHead(x1, y, 0, 12, 'full', cc, sw); if (!g.lo) o += PD.arrowHead(x0 - 2, y, Math.PI, 12, 'full', cc, sw); }
          [[g.lo, x0], [g.hi, x1]].forEach(([e, x]) => { if (!e) return; if (p.vert && !one) o += `<line x1="${f(x)}" y1="${f(y)}" x2="${f(x)}" y2="0" ${S(p, { dash: 'dash', sw: 0.8 })}/>`; o += `<circle cx="${f(x)}" cy="${f(y)}" r="4.6" fill="${e[1] ? '#ffffff' : cc}" stroke="${cc}" stroke-width="1.6"/>`; });
        });
        if (p.showIneq) o += T(ctx, r.replace(/<=/g, '\\le ').replace(/>=/g, '\\ge ').replace(/\bor\b/g, '或'), W + 34, y || -14, { size: ls - 1, anchor: 'start', color: p.stroke });
      });
      return o + errBox(ctx, err);
    },
  });

  /* ================= 预设 ================= */
  const geo = (cat, name, script, extra) => PD.preset(cat, name, 'geom', Object.assign({ script }, extra || {}));
  geo(C1, '三角形', 'A = 0, 110\nB = -90, -40\nC = 120, -40\npoly A B C');
  geo(C1, '三角形(边 a b c、角 A B C)', 'A = -20, 110\nB = -100, -50\nC = 130, -50\npoly A B C\nlen B C a\nlen C A b\nlen A B c\nangle C A B\nangle A B C\nangle B C A');
  geo(C1, '等腰三角形(等长、等角记号)', 'A = 0, 120\nB = -80, -40\nC = 80, -40\npoly A B C\ntick A B\ntick A C\nangle C B A\nangle A C B');
  geo(C1, '直角三角形', 'A = -80, 90\nB = -80, -40\nC = 120, -40\npoly A B C\nright A B C\nangle B C A \\theta\nlen A B 5\nlen B C 12');
  geo(C1, '等边三角形', 'A = -80, -40\nB = 80, -40\nC = rot B A 60\npoly A B C\ntick A B\ntick B C\ntick C A\nangle C A B 60°\nangle A B C 60°\nangle B C A 60°');
  geo(C1, '三角形的中线与重心', 'A = -10, 120\nB = -110, -50\nC = 120, -50\nD = mid B C\nE = mid C A\nF = mid A B\nG = centroid A B C\npoly A B C\nseg A D\nseg B E\nseg C F\ntick B D\ntick D C\ntick C E 2\ntick E A 2\ntick A F 3\ntick F B 3\ndot G');
  geo(C1, '三角形的高线与垂心', 'A = 20, 120\nB = -110, -50\nC = 130, -50\nD = foot A B C\nE = foot B C A\nF = foot C A B\nH = orthocenter A B C\npoly A B C\nseg A D dash\nseg B E dash\nseg C F dash\nright A D C\nright B E C\nright C F B\ndot H');
  geo(C1, '内切圆与内心', 'A = 10, 120\nB = -110, -50\nC = 130, -50\nI = incenter A B C\nP = foot I B C\npoly A B C\nincircle A B C\nseg I P dash\nright I P C\ndot I\nangle C B I "" 1\nangle I B A "" 1\nhide P');
  geo(C1, '外接圆与外心', 'A = -20, 110\nB = -110, -40\nC = 120, -40\nO = circumcenter A B C\npoly A B C\ncircumcircle A B C\nseg O A dash\nseg O B dash\nseg O C dash\ndot O');
  geo(C1, '中点定理', 'A = 0, 120\nB = -110, -50\nC = 120, -50\nM = mid A B\nN = mid A C\npoly A B C\nseg M N\ntick A M\ntick M B\ntick A N 2\ntick N C 2\npar M N\npar B C');
  geo(C1, '平行线与截线(同位角、错角)', 'A = -150, 50\nB = 150, 50\nC = -150, -40\nD = 150, -40\nE = -60, 120\nF = 60, -110\nP = int A B E F\nQ = int C D E F\nseg A B\nseg C D\nline E F\npar A B\npar C D\nangle B P F a\nangle C Q E b\nhide E F');
  geo(C1, '相似三角形', 'A = -170, 80\nB = -210, -40\nC = -100, -40\nP = 40, 130\nQ = -20, -40\nR = 145, -40\npoly A B C\npoly P Q R\nangle C B A\nangle R Q P\nangle B C A "" 2\nangle Q R P "" 2');
  geo(C1, '全等三角形', 'A = -160, 90\nB = -210, -40\nC = -90, -40\nP = 80, 90\nQ = 30, -40\nR = 150, -40\npoly A B C\npoly P Q R\ntick A B\ntick P Q\ntick B C 2\ntick Q R 2\ntick C A 3\ntick R P 3');
  geo(C1, '平行四边形(对角线)', 'A = -100, -50\nB = 80, -50\nD = -40, 70\nC = 140, 70\nX = int A C B D\npoly A B C D\nseg A C dash\nseg B D dash\npar A B\npar D C\npar A D 2\npar B C 2\ntick A X\ntick X C\ntick B X 2\ntick X D 2');
  geo(C1, '正六边形', 'A = @ 0\nB = @ 60\nC = @ 120\nD = @ 180\nE = @ 240\nF = @ 300\npoly A B C D E F\nseg O A dash\nseg O B dash\nangle A O B 60°', { R: 90 });
  geo(C1, '圆心角与圆周角', 'A = @ 200\nB = @ 340\nC = @ 95\nseg A O B\nseg A C B\nangle A O B 2x\nangle A C B x', { circle: true });
  geo(C1, '同弓形内的圆周角', 'A = @ 200\nB = @ 340\nC = @ 60\nD = @ 120\nseg A C B\nseg A D B\nseg A B\nangle A C B x\nangle A D B x', { circle: true });
  geo(C1, '半圆上的圆周角(直角)', 'A = @ 180\nB = @ 0\nC = @ 60\nseg A B\nseg A C B\nright A C B', { circle: true });
  geo(C1, '圆内接四边形', 'A = @ 160\nB = @ 230\nC = @ 330\nD = @ 60\npoly A B C D\nangle D A B x\nangle B C D 180°-x', { circle: true, center: false });
  geo(C1, '圆外一点的切线', 'P = 230, 0\nT, U = tan P\nseg P T\nseg P U\nseg O T dash\nseg O U dash\nseg O P dash\nright O T P\nright O U P\ntick P T\ntick P U', { circle: true, R: 90 });
  geo(C1, '切线垂直于半径', 'T = @ 60\nP = polar T -30 120\nQ = polar T 150 120\nseg P Q\nseg O T\nright O T P\nhide P Q', { circle: true });
  geo(C1, '交错弓形的圆周角(弦切角)', 'T = @ 270\nP = polar T 0 150\nQ = polar T 180 150\nA = @ 20\nB = @ 130\nseg P Q\nseg T A\nseg T B\nseg B A\nangle P T A x\nangle T B A x', { circle: true, center: false });
  geo(C1, '弦的垂直平分线', 'A = @ 210\nB = @ 330\nM = mid A B\nseg A B\nseg O M\nseg O A dash\nright O M B\ntick A M\ntick M B', { circle: true });
  geo(C1, '相交弦', 'A = @ 150\nB = @ 340\nC = @ 220\nD = @ 60\nX = int A B C D\nseg A B\nseg C D\ndot X', { circle: true, center: false });
  geo(C1, '空白画板(自己作图)', '# 在这里写作图指令，# 开头的行是注释\nA = -60, 0\nB = 60, 0\nseg A B');
  geo(C3, '正弦定理 / 余弦定理三角形', 'A = -20, 110\nB = -110, -50\nC = 130, -50\npoly A B C\nlen B C a\nlen C A b\nlen A B c\nangle C A B A\nangle A B C B\nangle B C A C\nhide A B C');
  geo(C3, '三角形面积 ½ab sin C', 'A = 10, 110\nB = -110, -50\nC = 130, -50\nD = foot A B C\npoly A B C\nseg A D dash\nright A D C\nlen C A b\nlen B C a\nangle A C B C');

  const sol = (name, props) => PD.preset(C2, name, 'solid3', props);
  sol('长方体(标顶点)', {});
  sol('长方体(对角线与底面的夹角)', { script: 'seg A G\nseg A C dash\nseg C G dash\nangle G A C \\theta\nright A C G' });
  sol('正方体', { shape: 'cube', w: 120, script: '' });
  sol('正方体(截面)', { shape: 'cube', w: 120, script: 'P = mid E F\nQ = mid F G\npoly P Q C A gray\nseg P Q\nseg Q C\nseg C A dash\nseg A P' });
  sol('正四棱锥(高、斜高)', { shape: 'pyramid', w: 150, d: 150, h: 150, script: 'O = center A B C D\nM = mid B C\nseg V O dash\nseg O M dash\nseg V M\nright V O M\nangle V M O \\theta' });
  sol('三棱锥(四面体)', { shape: 'tetra', w: 150, d: 70, h: 140, cx: 20 });
  sol('三棱柱', { shape: 'tprism', w: 150, d: 70, h: 120, cx: -20 });
  sol('楔形(斜面上的直线与水平面的夹角)', { shape: 'wedge', w: 180, d: 110, h: 90, script: 'seg A E\nseg A C dash\nangle E A C \\theta\nright A C E' });
  sol('四棱台(平截头体)', { shape: 'frustum', w: 160, d: 160, h: 100, top: 0.55 });
  sol('两平面的夹角', { shape: 'pyramid', w: 150, d: 150, h: 140, script: 'M = mid C D\nN = mid A B\nseg V M dash\nseg V N\nseg M N dash\nangle M N V \\theta' });

  PD.preset(C3, '仰角', 'elev', {});
  PD.preset(C3, '仰角(人在地面)', 'elev', { e: 36, man: true, obj: 'tower', h: 170 });
  PD.preset(C3, '俯角(悬崖与船)', 'elev', { kind: 'dep', obj: 'cliff', d: 260, h: 140, man: true, e: 30, alt: true });
  PD.preset(C3, '方位角(真方位)', 'bearing', { pts: 'B, 40, 160\nC, 130, 130', segs: 'B C' });
  PD.preset(C3, '方位角(罗盘方位)', 'bearing', { style: 'compass', pts: 'B, 40, 160\nC, 220, 130' });
  PD.preset(C3, '方位角(两地互望)', 'bearing', { pts: 'B, 65, 200', nAll: true });

  PD.preset(C4, '数线(x > 2)', 'numline', { onAxis: true });
  PD.preset(C4, '数线(复合不等式)', 'numline', { rows: 'x >= -1\nx < 3\n-1 <= x < 3' });
  PD.preset(C4, '数线(或)', 'numline', { rows: 'x <= -1 or x > 2' });
})();
