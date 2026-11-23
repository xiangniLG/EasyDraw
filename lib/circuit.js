/* 第四册 · 电与磁（一）：电路符号 + 自动走线导线 + 香港家居电路（依赖 lab / mechanics / optics 的 PD.lab 辅助）
   元件(带端口) · 导线(端点吸附到端口，元件移动时跟随) · 接点 · 端子 · 双向开关 · 滑动变阻器
   插座 · 三脚插头 · 千瓦时计 · 断路器 · 市电电源 · 电源供应器 */
(function () {
  'use strict';
  const f = PD.f, S = PD.strokeAttr, T = PD.tex, L = PD.lab, pt = L.pt, clamp = L.clamp;
  const C1 = 'DSE-物理/电与磁/电路', C2 = 'DSE-物理/电与磁/香港的家居电路';
  const sd = (p) => S(p, { dash: 'solid' });
  const BROWN = '#8d5524', BLUE = '#1e6fd9', GY = '#3f9b3f';

  /* ================= 两端元件（电路符号） ================= */
  // body(p, ctx) → { s: svg, hw: 主体半宽（引线画到 ±hw）, top: 主体上沿(标签用), bot: 主体下沿 }
  const B = {};
  const ring = (p, r, txt, ctx, extra) => ({ s: `<circle r="${r}" fill="#ffffff" ${sd(p)}/>` + (txt ? T(ctx, txt, 0, 0, { size: r * 1.15, italic: false, color: p.stroke }) : '') + (extra || ''), hw: r, top: -r, bot: r });
  B.cell = (p, ctx) => {
    const n = Math.max(1, Math.round(+p.n || 1)), g = 9, w = (n - 1) * g * 2 + g, x0 = -w / 2; let s = '';
    for (let i = 0; i < n; i++) { const x = x0 + i * 2 * g; s += `<line x1="${f(x)}" y1="-13" x2="${f(x)}" y2="13" ${S(p, { dash: 'solid', sw: 1.4 })}/><line x1="${f(x + g)}" y1="-6.5" x2="${f(x + g)}" y2="6.5" ${S(p, { dash: 'solid', sw: 4 })}/>`; if (i) s += `<line x1="${f(x - g)}" y1="0" x2="${f(x)}" y2="0" ${sd(p)}/>`; }
    if (p.pm) s += T(ctx, '+', x0 - 7, -15, { size: 13, italic: false, color: p.stroke }) + T(ctx, '−', x0 + w + 7, -15, { size: 13, italic: false, color: p.stroke });
    return { s, hw: w / 2, top: -13, bot: 13 };
  };
  B.resistor = (p) => ({ s: `<rect x="-17" y="-6" width="34" height="12" fill="#ffffff" ${sd(p)}/>`, hw: 17, top: -6, bot: 6 });
  B.varres = (p) => { const r = B.resistor(p); r.s += `<line x1="-14" y1="11" x2="12" y2="-11" ${sd(p)}/>` + PD.arrowHead(16, -14, Math.atan2(-11 - 11, 12 + 14), 7, 'full', p.stroke, 1); r.top = -14; r.bot = 11; return r; };
  B.rheostat = (p) => { const r = B.resistor(p), x = (clamp(+p.slider, 0, 1) - 0.5) * 30; r.s += `<line x1="${f(x)}" y1="-22" x2="${f(x)}" y2="-12" ${sd(p)}/>` + PD.arrowHead(x, -6.5, Math.PI / 2, 7, 'full', p.stroke, 1); r.top = -22; return r; };
  B.ldr = (p) => { const r = B.resistor(p); r.s = `<circle r="22" fill="none" ${sd(p)}/>` + r.s; [-1, 1].forEach((k) => (r.s += `<line x1="${f(-20 + k * 5)}" y1="-26" x2="${f(-8 + k * 5)}" y2="-14" ${S(p, { dash: 'solid', sw: 1 })}/>` + PD.arrowHead(-8 + k * 5, -14, Math.PI / 4, 6, 'full', p.stroke, 1))); r.hw = 17; r.top = -26; r.bot = 22; return r; };
  B.bulb = (p) => ({ s: `<circle r="12" fill="#ffffff" ${sd(p)}/><path d="M-12,0H-6.5A6.5,6.5 0 0 1 6.5,0H12" fill="none" ${sd(p)}/>` + (p.lit ? `<circle r="12" fill="#ffe680" fill-opacity="0.45"/>` + [0, 45, 90, 135, 180].map((a) => { const t = (-a * Math.PI) / 180; return `<line x1="${f(16 * Math.cos(t))}" y1="${f(16 * Math.sin(t))}" x2="${f(22 * Math.cos(t))}" y2="${f(22 * Math.sin(t))}" stroke="#e8a317" stroke-width="1.4" stroke-linecap="round"/>`; }).join('') : ''), hw: 12, top: p.lit ? -22 : -12, bot: 12 });
  B.lampx = (p) => ({ s: `<circle r="12" fill="#ffffff" ${sd(p)}/><path d="M-8.5,-8.5L8.5,8.5M-8.5,8.5L8.5,-8.5" ${sd(p)}/>`, hw: 12, top: -12, bot: 12 });
  B.switch = (p) => { const r = 3, a = p.closed ? 0 : (-28 * Math.PI) / 180, l = 34; return { s: `<circle cx="-15" r="${r}" fill="#ffffff" ${sd(p)}/><circle cx="15" r="${r}" fill="#ffffff" ${sd(p)}/><line x1="${f(-15 + r * Math.cos(a))}" y1="${f(r * Math.sin(a))}" x2="${f(-15 + l * Math.cos(a))}" y2="${f(l * Math.sin(a))}" ${sd(p)}/>`, hw: 18, top: -16, bot: 4 }; };
  B.push = (p) => ({ s: `<circle cx="-15" r="3" fill="#ffffff" ${sd(p)}/><circle cx="15" r="3" fill="#ffffff" ${sd(p)}/><line x1="-17" y1="${p.closed ? -4 : -10}" x2="17" y2="${p.closed ? -4 : -10}" ${sd(p)}/><line x1="0" y1="${p.closed ? -4 : -10}" x2="0" y2="-20" ${sd(p)}/><line x1="-5" y1="-20" x2="5" y2="-20" ${sd(p)}/>`, hw: 18, top: -20, bot: 4 });
  B.fuse = (p) => ({ s: `<rect x="-16" y="-6" width="32" height="12" fill="#ffffff" ${sd(p)}/><line x1="-16" y1="0" x2="16" y2="0" ${sd(p)}/>`, hw: 16, top: -6, bot: 6 });
  B.ammeter = (p, ctx) => ring(p, 13, 'A', ctx);
  B.voltmeter = (p, ctx) => ring(p, 13, 'V', ctx);
  B.galv = (p, ctx) => ring(p, 13, 'G', ctx);
  B.ohm = (p, ctx) => ring(p, 13, '\\Omega', ctx);
  B.motor = (p, ctx) => ring(p, 14, 'M', ctx);
  B.gen = (p, ctx) => ring(p, 14, 'G', ctx);
  B.ac = (p) => ({ s: `<circle r="13" fill="#ffffff" ${sd(p)}/><path d="M-7,0C-4.5,-7 -2.5,-7 0,0S4.5,7 7,0" fill="none" ${sd(p)}/>`, hw: 13, top: -13, bot: 13 });
  B.acterm = (p) => ({ s: `<circle cx="-12" r="3" fill="#ffffff" ${sd(p)}/><circle cx="12" r="3" fill="#ffffff" ${sd(p)}/><path d="M-7,-11C-4.5,-17 -2.5,-17 0,-11S4.5,-5 7,-11" fill="none" ${sd(p)}/>`, hw: 15, top: -17, bot: 3, gap: true });
  B.dcterm = (p, ctx) => ({ s: `<circle cx="-12" r="3" fill="#ffffff" ${sd(p)}/><circle cx="12" r="3" fill="#ffffff" ${sd(p)}/>` + T(ctx, '+', -12, -11, { size: 13, italic: false, color: p.stroke }) + T(ctx, '−', 12, -11, { size: 13, italic: false, color: p.stroke }), hw: 15, top: -17, bot: 3, gap: true });
  B.diode = (p) => ({ s: `<path d="M-9,-9L-9,9L8,0Z" fill="${p.fillMode === 'none' ? '#ffffff' : p.stroke}" ${sd(p)}/><line x1="8" y1="-9" x2="8" y2="9" ${sd(p)}/>`, hw: 9, top: -9, bot: 9, thru: true });
  B.led = (p) => { const d = B.diode(p); [-2, 4].forEach((x) => (d.s += `<line x1="${f(x)}" y1="-11" x2="${f(x + 8)}" y2="-19" ${S(p, { dash: 'solid', sw: 1 })}/>` + PD.arrowHead(x + 9, -20, -Math.PI / 4, 6, 'full', p.stroke, 1))); d.top = -21; return d; };
  B.cap = (p) => ({ s: `<line x1="-4" y1="-12" x2="-4" y2="12" ${S(p, { dash: 'solid', sw: 1.8 })}/><line x1="4" y1="-12" x2="4" y2="12" ${S(p, { dash: 'solid', sw: 1.8 })}/>`, hw: 4, top: -12, bot: 12 });
  B.coil = (p) => { const n = Math.max(2, Math.round(+p.n || 4)), r = 5, w = n * 2 * r; let d = `M${f(-w / 2)},0`; for (let i = 0; i < n; i++) d += `a${r},${r} 0 0 1 ${2 * r},0`; return { s: `<path d="${d}" fill="none" ${sd(p)}/>` + (p.core ? `<path d="M${f(-w / 2)},-9H${f(w / 2)}M${f(-w / 2)},-12H${f(w / 2)}" ${S(p, { dash: 'solid', sw: 1.2 })}/>` : ''), hw: w / 2, top: p.core ? -12 : -r, bot: 0 }; };
  B.heater = (p) => { const r = B.resistor(p); r.s += `<path d="M-12,0h4l3,-4l4,8l4,-8l3,4h6" fill="none" ${S(p, { dash: 'solid', sw: 1 })}/>`; return r; };
  B.buzzer = (p) => ({ s: `<path d="M-12,4H12V-2A12,12 0 0 0 -12,-2Z" fill="#ffffff" ${sd(p)}/>`, hw: 12, top: -14, bot: 4 });
  B.wire = () => ({ s: '', hw: 0, top: -2, bot: 2 });
  const KINDS = [['cell', '电池(单个/电池组)'], ['resistor', '电阻器'], ['varres', '可变电阻'], ['rheostat', '滑动变阻器(三端)'], ['bulb', '灯泡'], ['lampx', '灯(⊗ 符号)'], ['switch', '开关'], ['push', '按钮开关'],
    ['fuse', '保险丝'], ['ammeter', '安培计'], ['voltmeter', '伏特计'], ['galv', '电流计'], ['ohm', '欧姆计'], ['ac', '交流电源'], ['acterm', '交流电源(端子)'], ['dcterm', '直流电源(端子)'],
    ['motor', '电动机'], ['gen', '发电机'], ['diode', '二极管'], ['led', '发光二极管'], ['cap', '电容器'], ['coil', '线圈/电感'], ['heater', '发热元件'], ['ldr', '光敏电阻'], ['buzzer', '蜂鸣器'], ['wire', '一段导线']];
  PD.register({
    type: 'comp', name: '电路元件',
    defaults: { kind: 'resistor', L: 80, n: 1, pm: true, closed: false, lit: false, slider: 0.5, core: false, label: '', value: '', lsize: 15, fillMode: 'none' },
    handles: [['L', 'zero', 0.5]],
    ports: (p) => { const h = +p.L / 2, P = [[-h, 0, -1, 0], [h, 0, 1, 0]]; if (p.kind === 'rheostat') P.push([(clamp(+p.slider, 0, 1) - 0.5) * 30, -22, 0, -1]); return P; },
    fields: [
      { k: 'kind', t: 'sel', l: '元件', o: KINDS, rebuild: true }, { k: 'L', t: 'num', l: '两端距离' },
      { k: 'n', t: 'num', l: '电池数 / 线圈圈数', min: 1, when: (p) => p.kind === 'cell' || p.kind === 'coil' }, { k: 'pm', t: 'bool', l: '标 + −', when: (p) => p.kind === 'cell' },
      { k: 'closed', t: 'bool', l: '开关闭合', when: (p) => p.kind === 'switch' || p.kind === 'push' }, { k: 'lit', t: 'bool', l: '灯亮', when: (p) => p.kind === 'bulb' },
      { k: 'slider', t: 'range', l: '滑片位置', min: 0, max: 1, step: 0.05, when: (p) => p.kind === 'rheostat' }, { k: 'core', t: 'bool', l: '铁心', when: (p) => p.kind === 'coil' },
      { k: 'label', t: 'text', l: '标签(如 R_1)' }, { k: 'value', t: 'text', l: '数值(如 6 \\Omega)' }, { k: 'lsize', t: 'num', l: '标签字号' },
    ],
    style: ['stroke', 'sw', 'fillMode', 'opacity'],
    render(p, ctx) {
      const h = +p.L / 2, q = Object.assign({}, p, { _font: ctx.font }), b = (B[p.kind] || B.resistor)(q, ctx);
      let o = '';
      if (!b.gap) o += `<path d="M${f(-h)},0H${f(-b.hw)}M${f(b.hw)},0H${f(h)}" fill="none" ${sd(p)}/>`;
      else o += `<path d="M${f(-h)},0H-15M15,0H${f(h)}" fill="none" ${sd(p)}/>`;
      if (b.thru) o += `<line x1="-9" y1="0" x2="8" y2="0" ${sd(p)}/>`;
      o += b.s;
      if (p.kind === 'rheostat') o += `<circle cx="${f((clamp(+p.slider, 0, 1) - 0.5) * 30)}" cy="-22" r="0.01"/>`;
      if (p.label) o += T(ctx, p.label, 0, b.top - 11, { size: p.lsize, color: p.stroke, halo: true });
      if (p.value) o += T(ctx, p.value, 0, b.bot + 12, { size: p.lsize - 1, italic: false, color: p.stroke, halo: true });
      return o;
    },
  });

  /* ================= 接点 / 端子 / 接地 ================= */
  PD.register({
    type: 'node', name: '接点/端子', defaults: { kind: 'dot', r: 3, label: '', ldx: 8, ldy: -10, lsize: 15 },
    ports: () => [[0, 0, 0, 0]],
    fields: [{ k: 'kind', t: 'sel', l: '样式', o: [['dot', '实心接点'], ['open', '空心端子'], ['earth', '接地符号']] }, { k: 'r', t: 'num', l: '大小', step: 0.5 }, { k: 'label', t: 'text', l: '标签' }, { k: 'ldx', t: 'num', l: '标签 dx' }, { k: 'ldy', t: 'num', l: '标签 dy' }, { k: 'lsize', t: 'num', l: '标签字号' }],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      let o;
      if (p.kind === 'earth') o = `<path d="M0,0V12M-12,12H12M-8,17H8M-4,22H4" fill="none" ${sd(p)}/>`;
      else o = `<circle r="${f(+p.r * (p.kind === 'open' ? 1.15 : 1))}" fill="${p.kind === 'open' ? '#ffffff' : p.stroke}" ${S(p, { dash: 'solid', sw: p.kind === 'open' ? +p.sw || 1.5 : 0.5 })}/>`;
      if (p.label) o += T(ctx, p.label, +p.ldx, +p.ldy, { size: p.lsize, color: p.stroke, halo: true });
      return o;
    },
  });

  /* ================= 双向开关 ================= */
  PD.register({
    type: 'sw2', name: '双向开关(多相开关)', defaults: { L: 60, h: 26, pos: 'X', lx: 'X', ly: 'Y', label: 'S', lsize: 15 },
    ports: (p) => [[0, 0, -1, 0], [+p.L, -(+p.h), 1, 0], [+p.L, +p.h, 1, 0]],
    fields: [{ k: 'L', t: 'num', l: '长度' }, { k: 'h', t: 'num', l: '两触点间距(半)' }, { k: 'pos', t: 'sel', l: '接到', o: [['X', '上触点'], ['Y', '下触点'], ['off', '断开(中间)']] }, { k: 'lx', t: 'text', l: '上触点标签' }, { k: 'ly', t: 'text', l: '下触点标签' }, { k: 'label', t: 'text', l: '开关标签' }, { k: 'lsize', t: 'num', l: '标签字号' }],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const Lw = +p.L, h = +p.h, r = 3, xp = Lw * 0.45, ty = p.pos === 'X' ? -h : p.pos === 'Y' ? h : -h * 0.35, tx = p.pos === 'off' ? Lw * 0.85 : Lw - r - 1;
      let o = `<line x1="0" y1="0" x2="${f(xp - r)}" y2="0" ${sd(p)}/><circle cx="${f(xp)}" cy="0" r="${r}" fill="#ffffff" ${sd(p)}/>`;
      [-h, h].forEach((y) => (o += `<circle cx="${f(Lw - r)}" cy="${f(y)}" r="${r}" fill="#ffffff" ${sd(p)}/>`));
      const a = Math.atan2(ty, tx - xp); o += `<line x1="${f(xp + r * Math.cos(a))}" y1="${f(r * Math.sin(a))}" x2="${f(tx)}" y2="${f(ty)}" ${sd(p)}/>`;
      o += `<line x1="${f(Lw)}" y1="${f(-h)}" x2="${f(Lw)}" y2="${f(-h)}" ${sd(p)}/>`;
      if (p.lx) o += T(ctx, p.lx, Lw - r, -h - 13, { size: p.lsize, color: p.stroke, halo: true });
      if (p.ly) o += T(ctx, p.ly, Lw - r, h + 14, { size: p.lsize, color: p.stroke, halo: true });
      if (p.label) o += T(ctx, p.label, xp, -14, { size: p.lsize, color: p.stroke, halo: true });
      return o;
    },
  });

  /* ================= 导线（端点吸附端口，自动正交走线） ================= */
  function endPts(p, find) {
    const one = (id, port, lx, ly) => {
      const t = id !== '' && id != null ? find(String(id)) : null;
      if (t && t !== p) { const P = PD.portDoc(t, port); if (P) { const a = PD.docToLocal(p, P.x, P.y), b = PD.docToLocal(p, P.x + P.nx, P.y + P.ny); return { x: a[0], y: a[1], nx: b[0] - a[0], ny: b[1] - a[1], on: true }; } }
      return { x: +lx, y: +ly, nx: 0, ny: 0, on: false };
    };
    return [one(p.a0, p.ap, p.ax, p.ay), one(p.b0, p.bp, p.bx, p.by)];
  }
  const horiz = (E, O) => (Math.hypot(E.nx, E.ny) > 0.01 ? Math.abs(E.nx) >= Math.abs(E.ny) : Math.hypot(O.nx, O.ny) > 0.01 ? Math.abs(O.nx) >= Math.abs(O.ny) : Math.abs(O.x - E.x) >= Math.abs(O.y - E.y));
  function route(p, A, Bq) {
    const m = p.route, mid = +p.mid;
    if (m === 'straight' || m === 'curve') return [[A.x, A.y], [Bq.x, Bq.y]];
    if (m === 'hv') return [[A.x, A.y], [Bq.x, A.y], [Bq.x, Bq.y]];
    if (m === 'vh') return [[A.x, A.y], [A.x, Bq.y], [Bq.x, Bq.y]];
    const ha = horiz(A, Bq), hb = horiz(Bq, A);
    if (ha && hb) { const xm = A.x + (Bq.x - A.x) * mid; return [[A.x, A.y], [xm, A.y], [xm, Bq.y], [Bq.x, Bq.y]]; }
    if (!ha && !hb) { const ym = A.y + (Bq.y - A.y) * mid; return [[A.x, A.y], [A.x, ym], [Bq.x, ym], [Bq.x, Bq.y]]; }
    return ha ? [[A.x, A.y], [Bq.x, A.y], [Bq.x, Bq.y]] : [[A.x, A.y], [A.x, Bq.y], [Bq.x, Bq.y]];
  }
  const dedup = (P) => P.filter((q, i) => !i || Math.hypot(q[0] - P[i - 1][0], q[1] - P[i - 1][1]) > 0.3);
  PD.register({
    type: 'wire', name: '导线(拖端点到元件端口)',
    defaults: { ax: 0, ay: 0, bx: 120, by: 0, a0: '', ap: 0, b0: '', bp: 0, route: 'auto', mid: 0.5, bend: 0.45, dotA: false, dotB: false, cur: 'none', cpos: 0.5, clab: '', lsize: 15, sw: 1.5 },
    portSnap: { 0: ['a0', 'ap', 'ax', 'ay'], 1: ['b0', 'bp', 'bx', 'by'] },
    sync(o, m) { const [A, Bq] = endPts(o, (id) => m.get(id)); if (A.on) { o.ax = f(A.x); o.ay = f(A.y); } if (Bq.on) { o.bx = f(Bq.x); o.by = f(Bq.y); } },
    getHandles(p) {
      const A = [+p.ax, +p.ay], Bq = [+p.bx, +p.by], H = [A, Bq];
      if (p.route === 'auto' || !p.route) { const P = dedup(route(p, { x: A[0], y: A[1], nx: 0, ny: 0 }, { x: Bq[0], y: Bq[1], nx: 0, ny: 0 })); if (P.length === 4) H.push([(P[1][0] + P[2][0]) / 2, (P[1][1] + P[2][1]) / 2]); }
      return H;
    },
    setHandle(p, i, x, y) {
      if (i === 0) { p.ax = x; p.ay = y; } else if (i === 1) { p.bx = x; p.by = y; }
      else { const dx = +p.bx - +p.ax, dy = +p.by - +p.ay, P = dedup(route(p, { x: +p.ax, y: +p.ay, nx: 0, ny: 0 }, { x: +p.bx, y: +p.by, nx: 0, ny: 0 })); const vert = P.length === 4 && Math.abs(P[1][0] - P[2][0]) < 0.5; p.mid = Math.round(clamp(vert ? (Math.abs(dx) > 0.5 ? (x - +p.ax) / dx : 0.5) : (Math.abs(dy) > 0.5 ? (y - +p.ay) / dy : 0.5), -1.5, 2.5) * 100) / 100; }
    },
    fields: [
      { k: 'route', t: 'sel', l: '走线', o: [['auto', '自动(直角)'], ['hv', '先横后竖'], ['vh', '先竖后横'], ['straight', '直线'], ['curve', '曲线(实物接线)']], rebuild: true },
      { k: 'mid', t: 'num', l: '转折位置(拖中间蓝点)', step: 0.05, when: (p) => p.route === 'auto' }, { k: 'bend', t: 'num', l: '弯曲程度', step: 0.05, when: (p) => p.route === 'curve' },
      { k: 'a0', t: 'obj', l: '起点接到', of: (x) => x.type !== 'wire' && PD.portList(x).length > 0 }, { k: 'ap', t: 'num', l: '起点端口号', min: 0 },
      { k: 'b0', t: 'obj', l: '终点接到', of: (x) => x.type !== 'wire' && PD.portList(x).length > 0 }, { k: 'bp', t: 'num', l: '终点端口号', min: 0 },
      { k: 'dotA', t: 'bool', l: '起点画接点' }, { k: 'dotB', t: 'bool', l: '终点画接点' },
      { k: 'cur', t: 'sel', l: '电流箭头', o: [['none', '无'], ['fwd', '起点→终点'], ['back', '终点→起点']] }, { k: 'cpos', t: 'range', l: '箭头位置', min: 0.05, max: 0.95, step: 0.05, when: (p) => p.cur !== 'none' },
      { k: 'clab', t: 'text', l: '电流标签(如 I)', when: (p) => p.cur !== 'none' }, { k: 'lsize', t: 'num', l: '标签字号' },
    ],
    style: ['stroke', 'sw', 'dash', 'opacity'],
    render(p, ctx) {
      const doc = ctx.doc, [A, Bq] = endPts(p, (id) => PD.findObj(doc, id));
      let P, d;
      if (p.route === 'curve') {
        const l = Math.hypot(Bq.x - A.x, Bq.y - A.y) * (+p.bend || 0.45), na = Math.hypot(A.nx, A.ny) > 0.01 ? [A.nx / Math.hypot(A.nx, A.ny), A.ny / Math.hypot(A.nx, A.ny)] : [0, 1], nb = Math.hypot(Bq.nx, Bq.ny) > 0.01 ? [Bq.nx / Math.hypot(Bq.nx, Bq.ny), Bq.ny / Math.hypot(Bq.nx, Bq.ny)] : [0, 1];
        const c1 = [A.x + na[0] * l, A.y + na[1] * l], c2 = [Bq.x + nb[0] * l, Bq.y + nb[1] * l];
        d = `M${pt(A.x, A.y)}C${pt(c1[0], c1[1])} ${pt(c2[0], c2[1])} ${pt(Bq.x, Bq.y)}`;
        const Bz = (t, a, b, c, e) => (1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t * t * c + t ** 3 * e;
        P = []; for (let i = 0; i <= 24; i++) { const t = i / 24; P.push([Bz(t, A.x, c1[0], c2[0], Bq.x), Bz(t, A.y, c1[1], c2[1], Bq.y)]); }
      } else { P = dedup(route(p, A, Bq)); d = 'M' + P.map((q) => pt(q[0], q[1])).join('L'); }
      let o = `<path d="${d}" fill="none" ${S(p)}/>`;
      if (p.dotA) o += `<circle cx="${f(A.x)}" cy="${f(A.y)}" r="${f(Math.max(2.6, (+p.sw || 1.5) * 1.8))}" fill="${p.stroke}"/>`;
      if (p.dotB) o += `<circle cx="${f(Bq.x)}" cy="${f(Bq.y)}" r="${f(Math.max(2.6, (+p.sw || 1.5) * 1.8))}" fill="${p.stroke}"/>`;
      if (p.cur !== 'none' && P.length > 1) {
        const seg = []; let tot = 0; for (let i = 0; i < P.length - 1; i++) { const l = Math.hypot(P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1]); seg.push(l); tot += l; }
        let tgt = tot * clamp(+p.cpos, 0, 1), i = 0; while (i < seg.length - 1 && tgt > seg[i]) { tgt -= seg[i]; i++; }
        const a = P[i], b = P[i + 1], k = seg[i] ? tgt / seg[i] : 0, x = a[0] + (b[0] - a[0]) * k, y = a[1] + (b[1] - a[1]) * k, sg = p.cur === 'back' ? -1 : 1, ang = Math.atan2((b[1] - a[1]) * sg, (b[0] - a[0]) * sg), ah = 5 + 2.4 * (+p.sw || 1.5);
        o += PD.arrowHead(x + (Math.cos(ang) * ah) / 2, y + (Math.sin(ang) * ah) / 2, ang, ah, 'tri', p.stroke, p.sw);
        if (p.clab) o += T(ctx, p.clab, x - Math.sin(ang) * 13, y + Math.cos(ang) * -13, { size: p.lsize, color: p.stroke, halo: true });
      }
      return o;
    },
  });

  // 导线在文档坐标中的折线（编辑器用来判断「把元件拖到导线上」）
  PD.wirePts = (o, doc) => { const [A, Bq] = endPts(o, (id) => PD.findObj(doc, id)); const P = o.route === 'curve' ? [[A.x, A.y], [Bq.x, Bq.y]] : dedup(route(o, A, Bq)); return P.map((q) => PD.xform(o, q[0], q[1])); };

  /* ================= 插座（13 A 三脚） ================= */
  PD.register({
    type: 'socket', name: '插座(13 A 三脚)', defaults: { s: 90, sw2: false, on: true, labels: true, fill: '#d9d9d9', lsize: 14 },
    ports: (p) => { const s = +p.s; return [[s * 0.18, s * 0.26, 0, 0], [-s * 0.18, s * 0.26, 0, 0], [0, -s * 0.22, 0, 0]]; },
    fields: [{ k: 's', t: 'num', l: '大小' }, { k: 'sw2', t: 'bool', l: '带开关' }, { k: 'on', t: 'bool', l: '开关打开', when: (p) => p.sw2 }, { k: 'labels', t: 'bool', l: '标 L N E' }, { k: 'fill', t: 'color', l: '面板颜色' }, { k: 'lsize', t: 'num', l: '标签字号' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const s = +p.s, w = s * (p.sw2 ? 1.5 : 1), x0 = -s / 2, sl = (x, y, ww, hh) => `<rect x="${f(x - ww / 2)}" y="${f(y - hh / 2)}" width="${f(ww)}" height="${f(hh)}" fill="#1d1d1d" ${L.thin(p, 0.5)}/>`;
      let o = `<rect x="${f(x0)}" y="${f(-s / 2)}" width="${f(w)}" height="${f(s)}" rx="4" fill="${p.fill}" ${sd(p)}/>`;
      o += sl(0, -s * 0.22, s * 0.09, s * 0.17) + sl(-s * 0.18, s * 0.26, s * 0.17, s * 0.09) + sl(s * 0.18, s * 0.26, s * 0.17, s * 0.09);
      if (p.sw2) o += `<rect x="${f(s * 0.62)}" y="${f(-s * 0.2)}" width="${f(s * 0.22)}" height="${f(s * 0.4)}" rx="2" fill="#ffffff" ${sd(p)}/><rect x="${f(s * 0.64)}" y="${f(p.on ? s * 0.02 : -s * 0.18)}" width="${f(s * 0.18)}" height="${f(s * 0.16)}" rx="1.5" fill="${p.on ? '#d62828' : '#cccccc'}"/>`;
      if (p.labels) o += T(ctx, 'E', -s * 0.1, -s * 0.22, { size: p.lsize, anchor: 'end', italic: false, color: p.stroke }) + T(ctx, 'N', -s * 0.18, s * 0.26 + s * 0.13, { size: p.lsize, italic: false, color: p.stroke }) + T(ctx, 'L', s * 0.18, s * 0.26 + s * 0.13, { size: p.lsize, italic: false, color: p.stroke });
      return o;
    },
  });

  /* ================= 三脚插头（内部接线） ================= */
  PD.register({
    type: 'plug', name: '三脚插头(内部接线)', defaults: { s: 150, fuse: '13 A', labels: true, lsize: 13 },
    fields: [{ k: 's', t: 'num', l: '大小' }, { k: 'fuse', t: 'text', l: '保险丝标签' }, { k: 'labels', t: 'bool', l: '标注' }, { k: 'lsize', t: 'num', l: '标签字号' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const s = +p.s, u = s / 100, P = (x, y) => pt(x * u, y * u), wire = (d, c, ww) => `<path d="${d}" fill="none" stroke="${p.stroke}" stroke-width="${f(ww * u + 2)}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${f(ww * u)}" stroke-linecap="round" stroke-linejoin="round"/>`;
      let o = `<path d="M${P(-46, -40)}L${P(46, -40)}Q${P(50, -40)} ${P(50, -36)}L${P(50, 30)}Q${P(50, 44)} ${P(36, 46)}L${P(10, 50)}L${P(10, 72)}L${P(-10, 72)}L${P(-10, 50)}L${P(-36, 46)}Q${P(-50, 44)} ${P(-50, 30)}L${P(-50, -36)}Q${P(-50, -40)} ${P(-46, -40)}Z" fill="#f3f3f3" ${sd(p)}/>`;
      o += `<rect x="${f(-8 * u)}" y="${f(56 * u)}" width="${f(16 * u)}" height="${f(30 * u)}" fill="#555" ${L.thin(p, 0.6)}/><rect x="${f(-16 * u)}" y="${f(44 * u)}" width="${f(32 * u)}" height="${f(9 * u)}" fill="#888" ${L.thin(p, 0.6)}/>`;
      const pin = (x, y, ww, hh) => `<rect x="${f((x - ww / 2) * u)}" y="${f((y - hh / 2) * u)}" width="${f(ww * u)}" height="${f(hh * u)}" fill="#c9a227" ${L.thin(p, 0.7)}/>`;
      o += pin(0, -24, 9, 18) + pin(-24, 10, 18, 9) + pin(28, 10, 14, 9);
      o += `<rect x="${f(10 * u)}" y="${f(-6 * u)}" width="${f(26 * u)}" height="${f(8 * u)}" rx="${f(4 * u)}" fill="#e8e8e8" ${sd(p)}/><rect x="${f(14 * u)}" y="${f(-5 * u)}" width="${f(18 * u)}" height="${f(6 * u)}" fill="#ffffff" ${L.thin(p, 0.5)}/>`;
      o += wire(`M${P(-2, 60)}Q${P(-2, 40)} ${P(-12, 24)}L${P(-24, 12)}`, BLUE, 4) + wire(`M${P(2, 60)}Q${P(4, 30)} ${P(10, -2)}`, BROWN, 4);
      o += wire(`M${P(0, 60)}Q${P(0, 20)} ${P(0, -16)}`, GY, 4) + `<path d="M${P(0, 58)}Q${P(0, 20)} ${P(0, -14)}" fill="none" stroke="#f2d43b" stroke-width="${f(2 * u)}" stroke-dasharray="${f(3 * u)} ${f(3 * u)}"/>`;
      o += wire(`M${P(36, -2)}L${P(30, 8)}`, '#c9a227', 2);
      if (p.labels) {
        const lab = (t, x, y, tx, ty) => `<line x1="${f(x * u)}" y1="${f(y * u)}" x2="${f(tx * u)}" y2="${f(ty * u)}" ${S(p, { dash: 'solid', sw: 0.6 })}/>` + T(ctx, t, tx * u + (tx > 0 ? 4 : -4), ty * u, { size: p.lsize, anchor: tx > 0 ? 'start' : 'end', italic: false, color: p.stroke });
        o += lab('地线 (E)', 0, -30, -62, -50) + lab('中线 (N)', -28, 10, -66, 16) + lab('火线 (L)', 32, 12, 64, 22) + lab('保险丝 ' + (p.fuse || ''), 24, -6, 64, -22) + lab('电线夹', 0, 66, 40, 80);
      }
      return o;
    },
  });

  /* ================= 千瓦时计 / 断路器 / 市电 / 电源供应器 ================= */
  PD.register({
    type: 'kwh', name: '千瓦时计(电表)', defaults: { w: 110, h: 130, reading: '03572', unit: 'kWh', lsize: 13 },
    ports: (p) => { const w = +p.w, h = +p.h; return [[-w * 0.3, h / 2 + 14, 0, 1], [-w * 0.1, h / 2 + 14, 0, 1], [w * 0.1, h / 2 + 14, 0, 1], [w * 0.3, h / 2 + 14, 0, 1]]; },
    fields: [{ k: 'w', t: 'num', l: '宽' }, { k: 'h', t: 'num', l: '高' }, { k: 'reading', t: 'text', l: '读数' }, { k: 'unit', t: 'text', l: '单位' }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const w = +p.w, h = +p.h, digs = String(p.reading || ''), dw = (w * 0.7) / Math.max(1, digs.length);
      let o = `<rect x="${f(-w / 2)}" y="${f(-h / 2)}" width="${f(w)}" height="${f(h)}" rx="6" fill="#ececec" ${sd(p)}/><rect x="${f(-w * 0.4)}" y="${f(-h * 0.36)}" width="${f(w * 0.8)}" height="${f(h * 0.5)}" rx="3" fill="#ffffff" ${L.thin(p, 0.8)}/>`;
      [...digs].forEach((c, i) => { const x = -w * 0.35 + i * dw; o += `<rect x="${f(x)}" y="${f(-h * 0.28)}" width="${f(dw - 2)}" height="${f(h * 0.17)}" fill="${i === digs.length - 1 ? '#c62828' : '#222'}"/>` + T(ctx, c, x + dw / 2 - 1, -h * 0.195, { size: h * 0.12, italic: false, color: '#ffffff' }); });
      o += T(ctx, p.unit, 0, -h * 0.02, { size: p.lsize, italic: false, color: p.stroke }) + `<rect x="${f(-w * 0.3)}" y="${f(h * 0.05)}" width="${f(w * 0.6)}" height="4" rx="2" fill="#555"/>`;
      o += `<rect x="${f(-w * 0.42)}" y="${f(h / 2 - 2)}" width="${f(w * 0.84)}" height="16" fill="#bdbdbd" ${sd(p)}/>`;
      [-0.3, -0.1, 0.1, 0.3].forEach((k) => (o += `<circle cx="${f(w * k)}" cy="${f(h / 2 + 6)}" r="3" fill="#777"/>`));
      return o;
    },
  });
  PD.register({
    type: 'mcb', name: '断路器(MCB)', defaults: { kind: 'box', on: true, label: '', lsize: 14, L: 80 },
    ports: (p) => (p.kind === 'symbol' ? [[-(+p.L) / 2, 0, -1, 0], [+p.L / 2, 0, 1, 0]] : [[0, -42, 0, -1], [0, 42, 0, 1]]),
    fields: [{ k: 'kind', t: 'sel', l: '画法', o: [['box', '实物'], ['symbol', '电路符号']] }, { k: 'L', t: 'num', l: '符号长度', when: (p) => p.kind === 'symbol' }, { k: 'on', t: 'bool', l: '闭合(未跳掣)' }, { k: 'label', t: 'text', l: '标签(如 15 A)' }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      if (p.kind === 'symbol') {
        const h = +p.L / 2, a = p.on ? 0 : -0.5; let o = `<path d="M${f(-h)},0H-15M15,0H${f(h)}" fill="none" ${sd(p)}/><circle cx="-15" r="2.5" fill="${p.stroke}"/><circle cx="15" r="2.5" fill="${p.stroke}"/><line x1="-15" y1="0" x2="${f(-15 + 32 * Math.cos(a))}" y2="${f(32 * Math.sin(a))}" ${sd(p)}/><path d="M-6,-10h8v6" fill="none" ${S(p, { dash: 'solid', sw: 1 })}/>`;
        if (p.label) o += T(ctx, p.label, 0, -20, { size: p.lsize, color: p.stroke, halo: true }); return o;
      }
      let o = `<rect x="-18" y="-36" width="36" height="72" rx="3" fill="#f0f0f0" ${sd(p)}/><rect x="-7" y="-14" width="14" height="28" rx="2" fill="#666"/><rect x="-6" y="${p.on ? -13 : 1}" width="12" height="12" rx="1.5" fill="${p.on ? '#2e7d32' : '#c62828'}"/>`;
      o += `<line x1="0" y1="-36" x2="0" y2="-42" ${sd(p)}/><line x1="0" y1="36" x2="0" y2="42" ${sd(p)}/><text x="-14" y="-24" font-size="7" fill="#444" font-family="Arial">${p.on ? 'ON' : 'OFF'}</text>`;
      if (p.label) o += T(ctx, p.label, 26, 0, { size: p.lsize, anchor: 'start', italic: false, color: p.stroke });
      return o;
    },
  });
  PD.register({
    type: 'mains', name: '市电电源(L/N/E 端子)', defaults: { n: 2, gap: 40, text: '接市电电源', labels: true, lsize: 14 },
    ports: (p) => { const r = []; for (let i = 0; i < Math.max(1, Math.round(+p.n)); i++) r.push([0, i * +p.gap, 1, 0]); return r; },
    fields: [{ k: 'n', t: 'num', l: '端子数(2=L N，3=L N E)', min: 1 }, { k: 'gap', t: 'num', l: '间距' }, { k: 'labels', t: 'bool', l: '标 L N E' }, { k: 'text', t: 'text', l: '说明文字' }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const n = Math.max(1, Math.round(+p.n)), g = +p.gap, nm = ['L', 'N', 'E'];
      let o = '';
      for (let i = 0; i < n; i++) { o += `<circle cx="0" cy="${f(i * g)}" r="3.5" fill="#ffffff" ${sd(p)}/>`; if (p.labels && nm[i]) o += T(ctx, nm[i], -10, i * g, { size: p.lsize, anchor: 'end', italic: false, color: p.stroke }); }
      if (p.text) o += T(ctx, p.text, -(p.labels ? 26 : 12), ((n - 1) * g) / 2, { size: p.lsize, anchor: 'end', italic: false, color: p.stroke });
      return o;
    },
  });
  PD.register({
    type: 'psu', name: '电源供应器(实物)', defaults: { w: 140, h: 86, disp: '6.0 V', title: '电源', ac: false, lsize: 14, fill: '#e4e6e9' },
    ports: (p) => { const w = +p.w, h = +p.h; return [[w * 0.18, h * 0.22, 0, 1], [w * 0.36, h * 0.22, 0, 1]]; },
    fields: [{ k: 'w', t: 'num', l: '宽' }, { k: 'h', t: 'num', l: '高' }, { k: 'disp', t: 'text', l: '显示' }, { k: 'ac', t: 'bool', l: '交流输出(~)' }, { k: 'title', t: 'text', l: '标签' }, { k: 'fill', t: 'color', l: '颜色' }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const w = +p.w, h = +p.h, d = 14;
      let o = `<polygon points="${pt(-w / 2, -h / 2)} ${pt(-w / 2 + d, -h / 2 - d)} ${pt(w / 2 + d, -h / 2 - d)} ${pt(w / 2, -h / 2)}" fill="${PD.shade(p.fill, 0.3)}" ${sd(p)}/><polygon points="${pt(w / 2, -h / 2)} ${pt(w / 2 + d, -h / 2 - d)} ${pt(w / 2 + d, h / 2 - d)} ${pt(w / 2, h / 2)}" fill="${PD.shade(p.fill, -0.15)}" ${sd(p)}/>`;
      o += `<rect x="${f(-w / 2)}" y="${f(-h / 2)}" width="${f(w)}" height="${f(h)}" fill="${p.fill}" ${sd(p)}/><rect x="${f(-w * 0.42)}" y="${f(-h * 0.36)}" width="${f(w * 0.46)}" height="${f(h * 0.36)}" rx="2" fill="#dfe9d4" ${L.thin(p, 0.7)}/>`;
      o += T(ctx, p.disp, -w * 0.19, -h * 0.18, { size: h * 0.17, italic: false, color: '#111' }) + `<circle cx="${f(w * 0.27)}" cy="${f(-h * 0.18)}" r="${f(h * 0.13)}" fill="#666" ${sd(p)}/>`;
      o += `<circle cx="${f(w * 0.18)}" cy="${f(h * 0.22)}" r="6" fill="#d62828" ${sd(p)}/><circle cx="${f(w * 0.36)}" cy="${f(h * 0.22)}" r="6" fill="#222" ${sd(p)}/>`;
      o += T(ctx, p.ac ? '~' : '+', w * 0.18, h * 0.38, { size: 11, italic: false, color: p.stroke }) + T(ctx, p.ac ? '~' : '−', w * 0.36, h * 0.38, { size: 11, italic: false, color: p.stroke });
      if (p.title) o += T(ctx, p.title, 0, h / 2 + 16, { size: p.lsize, italic: false, color: p.stroke });
      return o;
    },
  });
  // 保险丝(实物，筒形)
  PD.register({
    type: 'fusecart', name: '保险丝(筒形实物)', defaults: { L: 90, d: 18, label: '13 A', blown: false, lsize: 13 },
    ports: (p) => [[-(+p.L) / 2, 0, -1, 0], [+p.L / 2, 0, 1, 0]],
    fields: [{ k: 'L', t: 'num', l: '长度' }, { k: 'd', t: 'num', l: '直径' }, { k: 'blown', t: 'bool', l: '已熔断' }, { k: 'label', t: 'text', l: '额定值' }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const h = +p.L / 2, r = +p.d / 2, cap = r * 1.1;
      let o = `<rect x="${f(-h + cap)}" y="${f(-r)}" width="${f(2 * (h - cap))}" height="${f(2 * r)}" fill="#f3efe4" fill-opacity="0.85" ${sd(p)}/>`;
      o += p.blown ? `<path d="M${f(-h + cap)},0H-6M6,0H${f(h - cap)}" stroke="#777" stroke-width="1.2"/>` : `<line x1="${f(-h + cap)}" y1="0" x2="${f(h - cap)}" y2="0" stroke="#777" stroke-width="1.2"/>`;
      [-1, 1].forEach((k) => (o += `<rect x="${f(k > 0 ? h - cap : -h)}" y="${f(-r * 1.05)}" width="${f(cap)}" height="${f(2.1 * r)}" rx="2" fill="${L.metal(ctx, '#c0c0c0', -r, r, true)}" ${sd(p)}/>`));
      if (p.label) o += T(ctx, p.label, 0, -r - 10, { size: p.lsize, italic: false, color: p.stroke });
      return o;
    },
  });

  /* ================= 预设 ================= */
  const C = (name, kind, props) => PD.preset(C1, name, 'comp', Object.assign({ kind }, props || {}));
  PD.preset(C1, '导线(拖端点接元件)', 'wire', {});
  PD.preset(C1, '导线(电流箭头 I)', 'wire', { cur: 'fwd', clab: 'I' });
  PD.preset(C1, '实物接线(曲线, 红)', 'wire', { route: 'curve', stroke: '#d62828', sw: 2 });
  PD.preset(C1, '实物接线(曲线, 黑)', 'wire', { route: 'curve', stroke: '#222222', sw: 2 });
  C('电池', 'cell'); C('电池组', 'cell', { n: 3, L: 100 }); C('电阻器', 'resistor', { label: 'R' }); C('可变电阻', 'varres'); C('滑动变阻器', 'rheostat'); C('灯泡', 'bulb'); C('灯泡(亮)', 'bulb', { lit: true });
  C('开关', 'switch'); C('开关(闭合)', 'switch', { closed: true }); C('按钮开关', 'push'); C('保险丝', 'fuse'); C('安培计', 'ammeter'); C('伏特计', 'voltmeter'); C('电流计', 'galv');
  C('交流电源', 'ac'); C('交流电源(端子)', 'acterm'); C('直流电源(端子)', 'dcterm'); C('电动机', 'motor'); C('发电机', 'gen'); C('二极管', 'diode', { fillMode: 'solid' }); C('发光二极管', 'led', { fillMode: 'solid' });
  C('电容器', 'cap'); C('线圈', 'coil', { n: 5 }); C('发热元件', 'heater'); C('光敏电阻', 'ldr'); C('欧姆计', 'ohm');
  PD.preset(C1, '接点(实心)', 'node', {}); PD.preset(C1, '端子(空心)', 'node', { kind: 'open', r: 3.5 }); PD.preset(C1, '接地', 'node', { kind: 'earth' });
  PD.preset(C1, '双向开关', 'sw2', {});
  PD.preset(C1, '电源供应器(实物)', 'psu', {});
  PD.preset(C1, 'V-I 图(欧姆导体/灯泡)', 'graph', { W: 300, H: 200, xmax: 5, ymax: 5, ticks: false, tlabels: false, xl: 'I', yl: 'V', funcs: '0.9*x ; 0 ; 5\n0.25*x+0.18*x^2 ; 0 ; 4.6 ; dash', cw: 1.8 });
  // 组合预设：简单串联电路（电池 + 开关 + 灯泡 + 安培计，已接线）
  const kid = (id, type, x, y, props) => Object.assign({ id: 'c-' + id, type, x, y, rot: 0, scale: 1, flip: false, snap: 'auto' }, PD.STYLE_DEF, PD.clone(PD.shapes[type].defaults), props || {});
  const W = (id, a, ap, b, bp, extra) => kid(id, 'wire', 0, 0, Object.assign({ a0: 'c-' + a, ap, b0: 'c-' + b, bp }, extra || {}));
  PD.preset(C1, '串联电路(已接线)', 'group', { loose: true, bw: 300, bh: 160, children: [
    kid('b', 'comp', 150, 20, { kind: 'cell', n: 2, L: 90 }), kid('s', 'comp', 40, 90, { kind: 'switch', rot: 90 }), kid('l', 'comp', 150, 160, { kind: 'bulb' }), kid('a', 'comp', 260, 90, { kind: 'ammeter', rot: 90 }),
    W('w1', 'b', 0, 's', 0), W('w2', 's', 1, 'l', 0), W('w3', 'l', 1, 'a', 1), W('w4', 'a', 0, 'b', 1),
  ] });
  PD.preset(C1, '并联电路(已接线)', 'group', { loose: true, bw: 300, bh: 200, children: [
    kid('b', 'comp', 150, 0, { kind: 'cell', L: 80 }), kid('n1', 'node', 40, 100), kid('n2', 'node', 260, 100),
    kid('r1', 'comp', 150, 70, { kind: 'resistor', label: 'R_1', L: 220 }), kid('r2', 'comp', 150, 140, { kind: 'resistor', label: 'R_2', L: 220 }),
    W('w1', 'b', 0, 'n1', 0, { route: 'hv' }), W('w2', 'b', 1, 'n2', 0, { route: 'hv' }), W('w3', 'n1', 0, 'r1', 0, { route: 'vh' }), W('w4', 'n1', 0, 'r2', 0, { route: 'vh' }), W('w5', 'r1', 1, 'n2', 0, { route: 'hv' }), W('w6', 'r2', 1, 'n2', 0, { route: 'hv' }),
  ] });

  PD.preset(C2, '插座', 'socket', {}); PD.preset(C2, '插座(带开关)', 'socket', { sw2: true });
  PD.preset(C2, '三脚插头(内部)', 'plug', {});
  PD.preset(C2, '千瓦时计', 'kwh', {});
  PD.preset(C2, '断路器(实物)', 'mcb', { label: '15 A' }); PD.preset(C2, '断路器(符号)', 'mcb', { kind: 'symbol', label: 'MCB' }); PD.preset(C2, '断路器(跳掣)', 'mcb', { on: false });
  PD.preset(C2, '保险丝(实物)', 'fusecart', {}); PD.preset(C2, '保险丝(熔断)', 'fusecart', { blown: true });
  PD.preset(C2, '市电电源(L N)', 'mains', {}); PD.preset(C2, '市电电源(L N E)', 'mains', { n: 3 });
  PD.preset(C2, '多相开关电路(发热元件)', 'group', { loose: true, bw: 380, bh: 170, children: [
    kid('m', 'mains', 40, 40, { text: '接市电电源', n: 2, gap: 100 }), kid('k', 'comp', 120, 40, { kind: 'switch', L: 70, closed: false }), kid('s', 'sw2', 175, 40, { L: 70, h: 30, pos: 'X' }),
    kid('r1', 'comp', 320, 10, { kind: 'resistor', label: 'R_1', L: 90 }), kid('r2', 'comp', 320, 70, { kind: 'resistor', label: 'R_2', L: 90 }), kid('j', 'node', 380, 70),
    W('w1', 'm', 0, 'k', 0), W('w2', 'k', 1, 's', 0), W('w3', 's', 1, 'r1', 0), W('w4', 's', 2, 'r2', 0), W('w5', 'r1', 1, 'j', 0, { route: 'hv' }), W('w6', 'r2', 1, 'j', 0), W('w7', 'm', 1, 'j', 0, { route: 'hv' }),
  ] });
  PD.preset(C2, '插座接线(L N E)', 'group', { loose: true, bw: 240, bh: 220, children: [
    kid('s', 'socket', 180, 140, { s: 90 }), kid('nl', 'node', 20, 90), kid('nn', 'node', 60, 150), kid('e', 'node', 180, 230, { kind: 'earth' }),
    kid('tl', 'text', 20, 20, { text: 'L', size: 15, italic: false, stroke: BROWN }), kid('tn', 'text', 60, 20, { text: 'N', size: 15, italic: false, stroke: BLUE }),
    kid('ll', 'line', 20, 30, { x2: 0, y2: 160, stroke: BROWN, sw: 2.2 }), kid('ln', 'line', 60, 30, { x2: 0, y2: 160, stroke: BLUE, sw: 2.2 }),
    W('w1', 'nl', 0, 's', 0, { route: 'hv', stroke: BROWN, sw: 2, dotA: true }), W('w2', 'nn', 0, 's', 1, { stroke: BLUE, sw: 2, dotA: true }), W('w3', 's', 2, 'e', 0, { route: 'straight', stroke: GY, sw: 2, dash: 'dash' }),
  ] });
  PD.preset(C2, '交流电 I-t 图(峰值/方均根值)', 'graph', { W: 340, H: 200, xmin: 0, xmax: 12.6, ymin: -1.3, ymax: 1.3, ticks: false, tlabels: false, xl: 't', yl: 'I', ol: 'O', funcs: 'sin(x) ; 0 ; 12.57\n0.707 ; 0 ; 12.57 ; dash\n-0.707 ; 0 ; 12.57 ; dash', marks: '1.571,1,,I_0,\n0,0.707,,I_{rms},' });
  PD.preset(C2, '交流电 V-t 图(周期)', 'graph', { W: 340, H: 200, xmin: 0, xmax: 12.6, ymin: -1.3, ymax: 1.3, ticks: false, tlabels: false, xl: 't', yl: 'V', ol: 'O', funcs: 'sin(x) ; 0 ; 12.57', marks: '6.283,0,T,,\n1.571,1,,V_0,' });
})();
