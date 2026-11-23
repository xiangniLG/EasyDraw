/* 第五册 · 辐射与核能（依赖 PD.lab 辅助）
   放射源 · 铅块 · α β γ 在电场/磁场中偏转 · 穿透能力 · 盖革-米勒计数器 · 火花计数器 · 云室径迹 · X 射线管 · 粒子 · 辐射标志 · 长柄钳 · 电磁波谱
   原子结构 · α 粒子散射(数值积分) · 衰变系(A-Z / N-Z) · 衰变曲线 · 核裂变 · 链式反应 · 核聚变 · 核反应堆 */
(function () {
  'use strict';
  const f = PD.f, S = PD.strokeAttr, T = PD.tex, L = PD.lab, pt = L.pt, clamp = L.clamp;
  const D2R = Math.PI / 180, TAU = Math.PI * 2;
  const C1 = 'DSE-物理/辐射与核能/辐射与放射现象', C2 = 'DSE-物理/辐射与核能/原子结构与衰变', C3 = 'DSE-物理/辐射与核能/核能';
  const sd = (p) => S(p, { dash: 'solid' });
  const nrm = (v) => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };
  const COL = { a: '#c62828', b: '#1565c0', g: '#2e7d32' }, GREEK = { a: '\\alpha', b: '\\beta', g: '\\gamma' };
  const PROT = '#e8755f', NEUT = '#aeb9c2', ELEC = '#4f8fdc', FUEL = '#e0876a';
  const ELEM = ('H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu').split(' ');
  PD.ELEM = ELEM;

  /* ================= 共享辅助 ================= */
  // 同色球体共用一个径向渐变（大量核子时 SVG 更小）
  const gid = (ctx, col) => {
    ctx._g = ctx._g || {};
    if (!ctx._g[col]) { const id = ctx.id + '-ng' + Object.keys(ctx._g).length; ctx.defs.push(`<radialGradient id="${id}" cx="0.36" cy="0.32" r="0.75"><stop offset="0" stop-color="#ffffff"/><stop offset="0.38" stop-color="${col}"/><stop offset="1" stop-color="${PD.shade(col, -0.45)}"/></radialGradient>`); ctx._g[col] = `url(#${id})`; }
    return ctx._g[col];
  };
  const signSvg = (x, y, r, s, col) => `<path d="M${pt(x - r, y)}H${f(x + r)}${s > 0 ? `M${pt(x, y - r)}V${f(y + r)}` : ''}" stroke="${col || '#ffffff'}" stroke-width="${f(Math.max(0.9, r * 0.42))}" stroke-linecap="round"/>`;
  const ball = (p, ctx, x, y, r, col, sign) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${gid(ctx, col)}" stroke="${PD.shade(col, -0.45)}" stroke-width="0.6"/>` + (sign ? signSvg(x, y, r * 0.5, sign) : '');
  L.ball = ball;
  // 原子核（向日葵排布；外圈先画、中心在上，看起来像一团）
  const nucR = (L.nucR = (A, rn) => rn * 1.12 * Math.sqrt(Math.max(0, A - 1)) + rn);
  L.nucleus = (p, ctx, cx, cy, Z, N, rn, o = {}) => {
    Z = Math.max(0, Math.round(Z)); N = Math.max(0, Math.round(N));
    const A = Math.max(1, Z + N), style = o.style || 'cluster';
    if (style === 'sphere') return `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(nucR(A, rn))}" fill="${gid(ctx, o.color || FUEL)}" ${L.thin(p, 0.8)}/>`;
    const R = PD.rng(o.seed || 7), kind = []; for (let i = 0; i < A; i++) kind.push(i < Z ? 1 : 0);
    for (let i = A - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); const t = kind[i]; kind[i] = kind[j]; kind[j] = t; }
    let s = '';
    for (let i = A - 1; i >= 0; i--) {
      const r = rn * 1.12 * Math.sqrt(i), a = i * 2.39996, x = cx + r * Math.cos(a), y = cy + r * Math.sin(a), pr = kind[i];
      if (style === 'flat') s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rn)}" fill="${pr ? '#d6d6d6' : '#ffffff'}" ${L.thin(p, 0.6)}/>` + (pr && rn >= 4 ? signSvg(x, y, rn * 0.5, 1, p.stroke) : '');
      else s += ball(p, ctx, x, y, rn, pr ? PROT : NEUT, pr && o.plus && rn >= 5 ? 1 : 0);
    }
    return s;
  };
  // 棒状放射源（尖端在 x,y，指向 +x）
  L.source = (p, ctx, x, y, s) => {
    const th = L.thin(p, 0.8), r = (x0, x1, h, base) => `<rect x="${f(x + x0 * s)}" y="${f(y - (h * s) / 2)}" width="${f((x1 - x0) * s)}" height="${f(h * s)}" fill="${L.metal(ctx, base, y - (h * s) / 2, y + (h * s) / 2, true)}" ${th}/>`;
    return r(-1.7, -0.95, 0.16, '#b9bec4') + r(-0.95, -0.6, 0.34, '#b9bec4') + r(-0.6, -0.42, 0.62, '#a9aeb4') + r(-0.42, 0, 0.42, '#c4c8cc');
  };
  // 铅块（中间留准直缝）
  L.lead = (p, ctx, x0, w, H, slit) => {
    const dx = w * 0.28, dy = -w * 0.22, sdp = sd(p), g = L.metal(ctx, '#9ea3a8', x0, x0 + w);
    const blk = (y0, y1) => `<polygon points="${pt(x0, y0)} ${pt(x0 + dx, y0 + dy)} ${pt(x0 + w + dx, y0 + dy)} ${pt(x0 + w, y0)}" fill="#cdd1d5" ${sdp}/><polygon points="${pt(x0 + w, y0)} ${pt(x0 + w + dx, y0 + dy)} ${pt(x0 + w + dx, y1 + dy)} ${pt(x0 + w, y1)}" fill="#7f858b" ${sdp}/><rect x="${f(x0)}" y="${f(y0)}" width="${f(w)}" height="${f(y1 - y0)}" fill="${g}" ${sdp}/>`;
    return blk(-H / 2, -slit / 2) + blk(slit / 2, H / 2);
  };
  // 波浪线（γ / X 射线），尾端留一段直线放箭头
  L.wavy = (x0, y0, x1, y1, amp, wl, tail) => {
    const l = Math.hypot(x1 - x0, y1 - y0) || 1, ux = (x1 - x0) / l, uy = (y1 - y0) / l, nx = -uy, ny = ux, ts = Math.max(0, Math.floor((l - (tail ?? 10)) / (wl / 2)) * (wl / 2));
    let d = `M${pt(x0, y0)}`; const n = Math.max(8, Math.ceil(l / 2));
    for (let i = 1; i <= n; i++) { const s = (l * i) / n, a = s < ts ? amp * Math.sin((TAU * s) / wl) : 0; d += `L${pt(x0 + ux * s + nx * a, y0 + uy * s + ny * a)}`; }
    return d;
  };
  const wavyArrow = (p, x0, y0, x1, y1, col, sw, amp, wl) => {
    const ah = 6 + 2.2 * sw, ang = Math.atan2(y1 - y0, x1 - x0);
    return `<path d="${L.wavy(x0, y0, x1 - Math.cos(ang) * ah * 0.6, y1 - Math.sin(ang) * ah * 0.6, amp ?? 4, wl ?? 12, ah)}" fill="none" stroke="${col}" stroke-width="${f(sw)}" stroke-linejoin="round"/>` + PD.arrowHead(x1, y1, ang, ah, 'tri', col, sw);
  };
  const polyArrow = (p, P, col, sw, o = {}) => {
    if (P.length < 2) return '';
    const e = P[P.length - 1], b = P[P.length - 2], ang = Math.atan2(e[1] - b[1], e[0] - b[0]), ah = 6 + 2.3 * sw;
    const Q = P.slice(0, -1).concat([[e[0] - Math.cos(ang) * ah * 0.6, e[1] - Math.sin(ang) * ah * 0.6]]);
    return `<polyline points="${PD.ptsStr(Q)}" fill="none" stroke="${col}" stroke-width="${f(sw)}" stroke-linejoin="round" stroke-linecap="round"${o.dash ? ` stroke-dasharray="${PD.dashArr(o.dash, sw)}"` : ''}/>` + (o.noHead ? '' : PD.arrowHead(e[0], e[1], ang, ah, 'tri', col, sw));
  };
  const trefoilSvg = (x, y, r, col) => {
    const u = r / 5; let d = '';
    [30, 150, 270].forEach((c) => { const a0 = (c - 30) * D2R, a1 = (c + 30) * D2R, P = (rr, a) => pt(x + rr * Math.cos(a), y - rr * Math.sin(a)); d += `M${P(1.5 * u, a0)}L${P(5 * u, a0)}A${f(5 * u)},${f(5 * u)} 0 0 0 ${P(5 * u, a1)}L${P(1.5 * u, a1)}A${f(1.5 * u)},${f(1.5 * u)} 0 0 1 ${P(1.5 * u, a0)}Z`; });
    return `<path d="${d}" fill="${col}"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(u)}" fill="${col}"/>`;
  };
  const star = (x, y, r, n) => { let d = ''; n = n || 9; for (let i = 0; i < 2 * n; i++) { const a = (Math.PI * i) / n - Math.PI / 2, rr = i % 2 ? r * 0.45 : r; d += (i ? 'L' : 'M') + pt(x + rr * Math.cos(a), y + rr * Math.sin(a)); } return `<path d="${d}Z" fill="#ffd54f" stroke="#f9a825" stroke-width="1"/>`; };
  const lbl = (ctx, p, t, x, y, a) => (t ? T(ctx, t, x, y, { size: p.lsize || 14, anchor: a, italic: false, color: p.stroke, halo: true }) : '');
  const leader = (p, x1, y1, x2, y2) => `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" ${S(p, { dash: 'solid', sw: 0.6 })}/>`;

  /* ================= 放射源 / 铅块 / 辐射标志 / 长柄钳 ================= */
  PD.register({
    type: 'radsource', name: '放射源(棒状)', defaults: { s: 50, beam: false, bl: 70, label: '', sign: false, lsize: 14 },
    fields: [{ k: 's', t: 'num', l: '大小' }, { k: 'beam', t: 'bool', l: '射出辐射(粉色射束)' }, { k: 'bl', t: 'num', l: '射束长', when: (p) => p.beam }, { k: 'sign', t: 'bool', l: '辐射标志' }, { k: 'label', t: 'text', l: '标签' }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const s = +p.s; let o = '';
      if (p.beam) o += `<polygon points="${pt(0, -s * 0.13)} ${pt(+p.bl, -s * 0.3)} ${pt(+p.bl, s * 0.3)} ${pt(0, s * 0.13)}" fill="#f4a9a8" fill-opacity="0.55"/>`;
      o += L.source(p, ctx, 0, 0, s);
      if (p.sign) o += `<circle cx="${f(-s * 0.78)}" cy="${f(-s * 0.48)}" r="${f(s * 0.2)}" fill="#f7d116" ${L.thin(p, 0.6)}/>` + trefoilSvg(-s * 0.78, -s * 0.48, s * 0.16, '#000');
      if (p.label) o += lbl(ctx, p, p.label, -s * 0.9, -s * 0.45 - (p.sign ? 22 : 10));
      return o;
    },
  });
  PD.register({
    type: 'leadblock', name: '铅块(准直缝)', defaults: { w: 40, H: 110, slit: 8, label: '铅块', lsize: 14 },
    fields: [{ k: 'w', t: 'num', l: '厚' }, { k: 'H', t: 'num', l: '高' }, { k: 'slit', t: 'num', l: '缝宽' }, { k: 'label', t: 'text', l: '标签' }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) { const w = +p.w; return L.lead(p, ctx, -w, w, +p.H, +p.slit) + lbl(ctx, p, p.label, -w / 2, -(+p.H) / 2 - 20); },
  });
  PD.register({
    type: 'trefoil', name: '辐射危险标志', defaults: { r: 40, style: 'circle', fill: '#f7d116', text: '' },
    fields: [{ k: 'r', t: 'num', l: '大小' }, { k: 'style', t: 'sel', l: '样式', o: [['circle', '圆形'], ['triangle', '三角警告'], ['plain', '只有三叶符号']] }, { k: 'fill', t: 'color', l: '底色' }, { k: 'text', t: 'text', l: '下方文字' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const r = +p.r; let o = '';
      if (p.style === 'circle') o += `<circle r="${f(r * 1.12)}" fill="${p.fill}" ${sd(p)}/>` + trefoilSvg(0, 0, r, '#000');
      else if (p.style === 'triangle') { const h = r * 2.3; o += `<path d="M0,${f(-h * 0.62)}L${pt(h * 0.62, h * 0.45)}L${pt(-h * 0.62, h * 0.45)}Z" fill="${p.fill}" stroke="#000" stroke-width="${f(r * 0.12)}" stroke-linejoin="round"/>` + trefoilSvg(0, h * 0.06, r * 0.55, '#000'); }
      else o += trefoilSvg(0, 0, r, p.stroke);
      if (p.text) o += T(ctx, p.text, 0, r * 1.45 + 10, { size: r * 0.32, italic: false, color: p.stroke });
      return o;
    },
  });
  PD.register({
    type: 'tongs', name: '长柄钳', defaults: { L: 170, fill: '#9aa0a6' }, fields: [{ k: 'L', t: 'num', l: '长度' }, { k: 'fill', t: 'color', l: '颜色' }], style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p) {
      const Lt = +p.L, pv = Lt * 0.3, arm = (s) => `<path d="M${pt(-6, s * 12)}L${pt(pv, s * 2)}L${pt(Lt, s * 1.2)}" fill="none" stroke="${p.stroke}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M${pt(-6, s * 12)}L${pt(pv, s * 2)}L${pt(Lt, s * 1.2)}" fill="none" stroke="${p.fill}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
      return arm(-1) + arm(1) + `<circle cx="-14" cy="-14" r="8" fill="none" ${S(p, { dash: 'solid', sw: 2.4 })}/><circle cx="-14" cy="14" r="8" fill="none" ${S(p, { dash: 'solid', sw: 2.4 })}/><circle cx="${f(pv)}" cy="0" r="3" fill="#555"/>`;
    },
  });

  /* ================= α β γ 在电场 / 磁场中偏转 ================= */
  PD.register({
    type: 'deflect', name: 'α β γ 在电场/磁场中偏转',
    defaults: { mode: 'E', dir: 'up', L: 300, gap: 150, xf: 40, ra: true, rb: true, rg: true, da: 0.35, kb: 5, Ra: 3.2, Rb: 0.5, src: true, lead: true, beam: true, labels: true, colored: false, flab: '', lsize: 15, sw: 1.6 },
    fields: [
      { k: 'mode', t: 'sel', l: '场', o: [['E', '电场(平行板)'], ['B', '磁场']], rebuild: true },
      { k: 'dir', t: 'sel', l: '方向', o: [['up', '电场向上(下板 +)'], ['down', '电场向下(上板 +)']], when: (p) => p.mode !== 'B' },
      { k: 'dir', t: 'sel', l: '方向', o: [['in', '× 指入页面'], ['out', '• 指出页面']], when: (p) => p.mode === 'B' },
      { k: 'L', t: 'num', l: '场区长' }, { k: 'gap', t: 'num', l: '场区高(板距)' }, { k: 'xf', t: 'num', l: '场区离铅块距离' },
      { k: 'ra', t: 'bool', l: 'α' }, { k: 'rb', t: 'bool', l: 'β' }, { k: 'rg', t: 'bool', l: 'γ' },
      { k: 'da', t: 'range', l: 'α 偏转(相对半板距)', min: 0.05, max: 1, step: 0.05, when: (p) => p.mode !== 'B' }, { k: 'kb', t: 'num', l: 'β 偏转倍数(相对 α)', step: 0.5, when: (p) => p.mode !== 'B' },
      { k: 'Ra', t: 'num', l: 'α 轨迹半径(× 场区长)', step: 0.1, when: (p) => p.mode === 'B' }, { k: 'Rb', t: 'num', l: 'β 轨迹半径(× 场区长)', step: 0.05, when: (p) => p.mode === 'B' },
      { k: 'src', t: 'bool', l: '放射源' }, { k: 'lead', t: 'bool', l: '铅块' }, { k: 'beam', t: 'bool', l: '粉色射束' }, { k: 'labels', t: 'bool', l: '文字标注' }, { k: 'flab', t: 'text', l: '场的文字(空=自动)' },
      { k: 'colored', t: 'bool', l: '彩色轨迹' }, { k: 'lsize', t: 'num', l: '字号' },
    ],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const Lf = +p.L, g2 = +p.gap / 2, xf = +p.xf, x1 = xf + Lf, E = p.mode === 'B' ? false : true, ls = p.lsize, sw = +p.sw || 1.6;
      const up = E ? p.dir !== 'down' : p.dir !== 'out', sa = up ? -1 : 1, fc = p.colored ? '#7cb342' : p.stroke;
      let o = '';
      if (E) {
        o += `<path d="M${pt(xf - 10, -g2)}H${f(x1 + 10)}M${pt(xf - 10, g2)}H${f(x1 + 10)}" fill="none" ${S(p, { dash: 'solid', sw: 2 })}/>`;
        const n = Math.max(2, Math.floor(Lf / 55));
        for (let i = 0; i < n; i++) { const x = xf + (Lf * (i + 0.5)) / n; o += up ? L.arrow(p, x, g2, x, -g2 + 1, { sw: 1, color: fc, ah: 8 }) : L.arrow(p, x, -g2, x, g2 - 1, { sw: 1, color: fc, ah: 8 }); }
        o += T(ctx, up ? '−' : '+', x1 + 26, -g2, { size: ls + 5, italic: false, color: p.stroke }) + T(ctx, up ? '+' : '−', x1 + 26, g2, { size: ls + 5, italic: false, color: p.stroke });
      } else {
        const gp = 42, nx = Math.max(1, Math.round(Lf / gp)), ny = Math.max(1, Math.round((2 * g2) / gp)), m = 8, col = p.colored ? '#ef6c00' : p.stroke; let d = '', dots = '';
        for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { const x = xf + (i + 0.5) * (Lf / nx), y = -g2 + (j + 0.5) * ((2 * g2) / ny); if (p.dir !== 'out') d += `M${pt(x - m / 2, y - m / 2)}l${m},${m}M${pt(x - m / 2, y + m / 2)}l${m},${-m}`; else dots += `<circle cx="${f(x)}" cy="${f(y)}" r="2.6" fill="${col}"/>`; }
        o += d ? `<path d="${d}" stroke="${col}" stroke-width="1.3" stroke-linecap="round"/>` : dots;
      }
      if (p.beam) o += `<polygon points="${pt(-86, -6)} ${pt(-44, -13)} ${pt(-44, 13)} ${pt(-86, 6)}" fill="#f4a9a8" fill-opacity="0.55"/>`;
      if (p.lead) o += L.lead(p, ctx, -44, 40, 110, 8);
      if (p.src) o += L.source(p, ctx, -86, 0, 50);
      const track = (key) => {
        const col = p.colored ? COL[key] : p.stroke, P = [[-82, 0], [xf, 0]];
        if (key === 'g') P.push([x1 + 50, 0]);
        else if (E) {
          const D = (key === 'a' ? +p.da : +p.da * +p.kb) * g2, sg = key === 'a' ? sa : -sa; let hit = false;
          for (let u = 3; u <= Lf; u += 3) { const y = sg * D * (u / Lf) ** 2; if (Math.abs(y) >= g2 - 2) { const uu = Lf * Math.sqrt((g2 - 2) / D); P.push([xf + uu, sg * (g2 - 2)]); hit = true; break; } P.push([xf + u, y]); }
          if (!hit) { const dv = nrm([1, (2 * sg * D) / Lf]), e = [x1, sg * D]; P.push(e, [e[0] + dv[0] * 40, e[1] + dv[1] * 40]); }
        } else {
          const R = Math.max(5, (key === 'a' ? +p.Ra : +p.Rb) * Lf), sg = key === 'a' ? sa : -sa; let ph = 0, dv = [1, 0];
          for (let k = 0; k < 5000; k++) { ph += 2 / R; const x = xf + R * Math.sin(ph), y = sg * R * (1 - Math.cos(ph)); P.push([x, y]); if (x > x1 || Math.abs(y) > g2 || ph > Math.PI * 0.9) { dv = [Math.cos(ph), sg * Math.sin(ph)]; break; } }
          const e = P[P.length - 1]; P.push([e[0] + dv[0] * 40, e[1] + dv[1] * 40]);
        }
        let s = polyArrow(p, P, col, sw);
        if (p.labels) { const e = P[P.length - 1], b = P[P.length - 2], a = Math.atan2(e[1] - b[1], e[0] - b[0]); s += T(ctx, GREEK[key], e[0] + Math.cos(a) * 14, e[1] + Math.sin(a) * 14 + (key === 'g' ? 0 : 0), { size: ls + 3, italic: false, color: p.stroke, halo: true }); }
        return s;
      };
      if (p.rg) o += track('g'); if (p.ra) o += track('a'); if (p.rb) o += track('b');
      if (p.labels) {
        const fl = p.flab || (E ? '电场' : p.dir === 'out' ? '磁场(指出页面)' : '磁场(指入页面)');
        o += E ? lbl(ctx, p, fl, x1 - 40, g2 - 22) : lbl(ctx, p, fl, xf + Lf / 2, -g2 - 16);
        if (p.src) o += lbl(ctx, p, '放射源', -128, -26); if (p.lead) o += lbl(ctx, p, '铅块', -24, -78);
      }
      return o;
    },
  });

  /* ================= 穿透能力 ================= */
  PD.register({
    type: 'penetrate', name: '穿透能力(纸/铝/铅)',
    defaults: { gap: 44, x1: 120, x2: 210, x3: 300, xe: 420, H: 170, thin: 3, al: 10, pb: 42, src: true, labels: true, colored: false, t1: '纸', t2: '铝(数毫米)', t3: '铅(数厘米)', lsize: 14, sw: 1.8 },
    fields: [{ k: 'gap', t: 'num', l: '射线间距' }, { k: 'x1', t: 'num', l: '纸的位置' }, { k: 'x2', t: 'num', l: '铝片位置' }, { k: 'x3', t: 'num', l: '铅板位置' }, { k: 'xe', t: 'num', l: 'γ 射线终点' }, { k: 'H', t: 'num', l: '板高' },
      { k: 'al', t: 'num', l: '铝片厚' }, { k: 'pb', t: 'num', l: '铅板厚' }, { k: 'src', t: 'bool', l: '放射源' }, { k: 'labels', t: 'bool', l: '文字标注' },
      { k: 't1', t: 'text', l: '纸文字', when: (p) => p.labels }, { k: 't2', t: 'text', l: '铝文字', when: (p) => p.labels }, { k: 't3', t: 'text', l: '铅文字', when: (p) => p.labels }, { k: 'colored', t: 'bool', l: '彩色射线' }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const g = +p.gap, H = +p.H, x1 = +p.x1, x2 = +p.x2, x3 = +p.x3, xe = +p.xe, sw = +p.sw || 1.8, c = (k) => (p.colored ? COL[k] : p.stroke);
      let o = `<rect x="${f(x1)}" y="${f(-H / 2)}" width="${f(+p.thin)}" height="${f(H)}" fill="#fffdf2" ${sd(p)}/><rect x="${f(x2)}" y="${f(-H / 2)}" width="${f(+p.al)}" height="${f(H)}" fill="${L.metal(ctx, '#d5dbe0', x2, x2 + +p.al)}" ${sd(p)}/>`;
      o += `<rect x="${f(x3)}" y="${f(-H / 2)}" width="${f(+p.pb)}" height="${f(H)}" fill="#6f757a" ${sd(p)}/><rect x="${f(x3)}" y="${f(-H / 2)}" width="${f(+p.pb)}" height="${f(H)}" ${PD.fillAttr({ fillMode: 'hatch', fill: '#3a3f44' }, ctx)} stroke="none"/>`;
      if (p.src) o += L.source(p, ctx, 0, 0, 44);
      o += polyArrow(p, [[4, 0], [36, -g], [x1 - 1, -g]], c('a'), sw * 1.25) + polyArrow(p, [[4, 0], [36, 0], [x2 - 1, 0]], c('b'), sw);
      o += `<path d="M4,0L36,${f(g)}" fill="none" stroke="${c('g')}" stroke-width="${f(sw)}"/><path d="${L.wavy(36, g, x3, g, 4, 13, 0)}" fill="none" stroke="${c('g')}" stroke-width="${f(sw)}"/>`;
      o += `<g opacity="0.55">${wavyArrow(p, x3 + +p.pb, g, xe, g, c('g'), Math.max(1, sw * 0.7), 2.5, 13)}</g>`;
      if (p.labels) {
        [['a', -g], ['b', 0], ['g', g]].forEach(([k, y]) => (o += T(ctx, GREEK[k], 66, y - 13, { size: p.lsize + 3, italic: false, color: p.stroke, halo: true })));
        o += lbl(ctx, p, p.t1, x1, H / 2 + 16) + lbl(ctx, p, p.t2, x2 + +p.al / 2, H / 2 + 16) + lbl(ctx, p, p.t3, x3 + +p.pb / 2, H / 2 + 16);
      }
      return o;
    },
  });

  /* ================= 盖革-米勒计数器 ================= */
  PD.register({
    type: 'gm', name: '盖革-米勒管 + 计数器',
    defaults: { L: 130, d: 28, cut: false, counter: true, kind: 'scaler', reading: '0256', unit: '', labels: true, lsize: 13, seed: 4 },
    fields: [{ k: 'L', t: 'num', l: '管长' }, { k: 'd', t: 'num', l: '管径' }, { k: 'cut', t: 'bool', l: '剖面(阳极线、低压气体)' }, { k: 'counter', t: 'bool', l: '计数器' },
      { k: 'kind', t: 'sel', l: '计数器类型', o: [['scaler', '计数器(读数)'], ['rate', '计数率计(每分钟)']], when: (p) => p.counter }, { k: 'reading', t: 'text', l: '读数', when: (p) => p.counter },
      { k: 'labels', t: 'bool', l: '文字标注' }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const Lt = +p.L, d = +p.d, r = d / 2; let o = '';
      if (p.cut) {
        o += `<rect x="5" y="${f(-r)}" width="${f(Lt - 5)}" height="${f(d)}" fill="#eef4f8" ${S(p, { dash: 'solid', sw: (+p.sw || 1.5) * 1.6 })}/><line x1="12" y1="0" x2="${f(Lt + 8)}" y2="0" stroke="#c77b30" stroke-width="1.5"/>`;
        const R = PD.rng(p.seed); for (let i = 0; i < 16; i++) o += `<circle cx="${f(14 + R() * (Lt - 22))}" cy="${f((R() - 0.5) * (d - 8))}" r="1.3" fill="#7a8a99"/>`;
      } else o += `<rect x="5" y="${f(-r)}" width="${f(Lt - 5)}" height="${f(d)}" fill="${L.metal(ctx, '#b9bec4', -r, r, true)}" ${sd(p)}/>`;
      o += `<rect x="0" y="${f(-r * 0.82)}" width="6" height="${f(d * 0.82)}" fill="#e8d9a8" ${sd(p)}/><rect x="${f(Lt)}" y="${f(-r * 0.55)}" width="16" height="${f(d * 0.55)}" fill="#444" ${sd(p)}/>`;
      if (p.counter) {
        const bx = Lt + 70, by = 6, bw = 140, bh = 74;
        o += `<path d="M${pt(Lt + 16, 0)}C${pt(Lt + 50, 0)} ${pt(Lt + 40, by + bh / 2)} ${pt(bx, by + bh / 2)}" fill="none" stroke="#333" stroke-width="2"/>`;
        o += `<rect x="${f(bx)}" y="${f(by)}" width="${bw}" height="${bh}" rx="5" fill="#e4e6e9" ${sd(p)}/><rect x="${f(bx + 12)}" y="${f(by + 12)}" width="${f(bw * 0.62)}" height="30" rx="2" fill="#dfe9d4" ${L.thin(p, 0.7)}/>`;
        o += T(ctx, p.reading, bx + 12 + bw * 0.31, by + 27, { size: 18, italic: false, color: '#111' }) + `<circle cx="${f(bx + bw - 24)}" cy="${f(by + 27)}" r="9" fill="#666" ${sd(p)}/>`;
        o += `<rect x="${f(bx + 14)}" y="${f(by + bh - 22)}" width="26" height="12" rx="2" fill="#2e7d32"/><rect x="${f(bx + 48)}" y="${f(by + bh - 22)}" width="26" height="12" rx="2" fill="#c62828"/>`;
        if (p.labels) o += lbl(ctx, p, p.kind === 'rate' ? '计数率计 (每分钟计数)' : '计数器', bx + bw / 2, by + bh + 16);
      }
      if (p.labels) {
        o += lbl(ctx, p, '盖革-米勒管', Lt / 2, -r - 14) + lbl(ctx, p, '云母窗', 2, r + 16);
        if (p.cut) o += lbl(ctx, p, '阳极(金属线)', Lt * 0.6, r + 16) + lbl(ctx, p, '低压气体', Lt * 0.3, -r - 32);
      }
      return o;
    },
  });

  /* ================= 火花计数器 ================= */
  PD.register({
    type: 'spark', name: '火花计数器', defaults: { W: 150, sparks: 3, src: true, eht: true, volt: '4500 V', labels: true, lsize: 13, seed: 2 },
    fields: [{ k: 'W', t: 'num', l: '宽' }, { k: 'sparks', t: 'num', l: '火花数', min: 0 }, { k: 'src', t: 'bool', l: '放射源(在上方)' }, { k: 'eht', t: 'bool', l: '高压电源' }, { k: 'volt', t: 'text', l: '电压', when: (p) => p.eht }, { k: 'labels', t: 'bool', l: '文字标注' }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const W = +p.W, a = W / 2, gy = -14; let o = '';
      o += `<rect x="${f(-a - 24)}" y="44" width="${f(W + 48)}" height="14" rx="2" fill="#a1887f" ${sd(p)}/>`;
      o += `<path d="M${pt(-a, 0)}V44M${pt(a, 0)}V44M${pt(-a - 12, gy)}V44M${pt(a + 12, gy)}V44" fill="none" ${S(p, { dash: 'solid', sw: 2 })}/>`;
      o += `<rect x="${f(-a - 12)}" y="${f(gy - 6)}" width="${f(W + 24)}" height="6" ${PD.fillAttr({ fillMode: 'cross', fill: '#555' }, ctx)} ${L.thin(p, 0.8)}/><line x1="${f(-a)}" y1="0" x2="${f(a)}" y2="0" ${S(p, { dash: 'solid', sw: 1.2 })}/>`;
      const n = Math.max(0, Math.round(+p.sparks)), R = PD.rng(p.seed);
      for (let k = 0; k < n; k++) { const x = -a + (W * (k + 0.5 + (R() - 0.5) * 0.4)) / n; o += `<circle cx="${f(x)}" cy="-6" r="6" fill="#fff59d" fill-opacity="0.7"/><path d="M${pt(x, gy + 1)}l3,3l-4,2l4,3l-3,2" fill="none" stroke="#f57f17" stroke-width="1.8" stroke-linejoin="round"/>`; }
      if (p.src) o += `<g transform="translate(0,${f(gy - 14)}) rotate(90)">${L.source(p, ctx, 0, 0, 40)}</g>`;
      if (p.eht) {
        const bx = a + 60, by = -36;
        o += `<rect x="${f(bx)}" y="${f(by)}" width="104" height="64" rx="4" fill="#e4e6e9" ${sd(p)}/><rect x="${f(bx + 10)}" y="${f(by + 10)}" width="64" height="22" rx="2" fill="#dfe9d4" ${L.thin(p, 0.6)}/>` + T(ctx, p.volt, bx + 42, by + 21, { size: 12, italic: false, color: '#111' });
        o += `<path d="M${pt(a + 12, gy - 3)}H${f(bx + 20)}V${f(by + 44)}M${pt(a, 0)}C${pt(a + 30, 0)} ${pt(bx + 30, 30)} ${pt(bx + 56, by + 50)}" fill="none" stroke="#c62828" stroke-width="1.6"/>`;
        o += `<circle cx="${f(bx + 20)}" cy="${f(by + 50)}" r="5" fill="#c62828" ${sd(p)}/><circle cx="${f(bx + 56)}" cy="${f(by + 50)}" r="5" fill="#222" ${sd(p)}/>`;
        if (p.labels) o += lbl(ctx, p, '高压电源', bx + 52, by + 78);
      }
      if (p.labels) { o += lbl(ctx, p, '铁丝网', -a - 20, gy - 4, 'end') + lbl(ctx, p, '金属线', -a - 8, 10, 'end'); if (p.src) o += lbl(ctx, p, '放射源', 28, gy - 56, 'start'); }
      return o;
    },
  });

  /* ================= 云室径迹 ================= */
  PD.register({
    type: 'cloud', name: '云室径迹(α/β/γ)', defaults: { W: 280, H: 180, mode: 'alpha', n: 10, dark: false, src: true, seed: 3 },
    fields: [{ k: 'mode', t: 'sel', l: '辐射', o: [['alpha', 'α：粗、直、长度相近'], ['beta', 'β：细、弯曲、长短不一'], ['gamma', 'γ：稀疏零散的短径迹']] }, { k: 'W', t: 'num', l: '宽' }, { k: 'H', t: 'num', l: '高' }, { k: 'n', t: 'num', l: '径迹数' }, { k: 'dark', t: 'bool', l: '深色背景(照片效果)' }, { k: 'src', t: 'bool', l: '放射源' }, { k: 'seed', t: 'num', l: '随机排布' }],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const W = +p.W, H = +p.H, R = PD.rng(p.seed), tc = p.dark ? '#ffffff' : p.stroke, n = Math.max(1, Math.round(+p.n)), sx = -W / 2 + 16, cid = ctx.id + '-cl';
      ctx.defs.push(`<clipPath id="${cid}"><rect x="${f(-W / 2)}" y="${f(-H / 2)}" width="${f(W)}" height="${f(H)}" rx="6"/></clipPath>`);
      let t = '';
      for (let k = 0; k < n; k++) {
        if (p.mode === 'alpha') { const a = (R() - 0.5) * 1.3, l = W * 0.55 * (0.95 + 0.1 * R()); t += `<line x1="${f(sx)}" y1="0" x2="${f(sx + l * Math.cos(a))}" y2="${f(l * Math.sin(a))}" stroke="${tc}" stroke-width="2.6" stroke-linecap="round" stroke-opacity="0.85"/>`; }
        else if (p.mode === 'beta') { let x = sx, y = 0, a = (R() - 0.5) * 2; const P = [[x, y]], len = W * (0.4 + 0.6 * R()); for (let s = 0; s < len; s += 4) { a += (R() - 0.5) * 0.4; x += 4 * Math.cos(a); y += 4 * Math.sin(a); P.push([x, y]); } t += `<polyline points="${PD.ptsStr(P)}" fill="none" stroke="${tc}" stroke-width="0.9" stroke-opacity="0.9"/>`; }
        else { let x = -W / 2 + W * R(), y = -H / 2 + H * R(), a = R() * TAU; const P = [[x, y]]; for (let s = 0; s < 20 + 30 * R(); s += 3) { a += (R() - 0.5) * 0.9; x += 3 * Math.cos(a); y += 3 * Math.sin(a); P.push([x, y]); } t += `<polyline points="${PD.ptsStr(P)}" fill="none" stroke="${tc}" stroke-width="0.8"/>`; }
      }
      let o = `<rect x="${f(-W / 2)}" y="${f(-H / 2)}" width="${f(W)}" height="${f(H)}" rx="6" fill="${p.dark ? '#1f2a36' : '#f4f6f8'}" ${sd(p)}/><g clip-path="url(#${cid})">${t}</g>`;
      if (p.src && p.mode !== 'gamma') o += `<rect x="${f(-W / 2 - 4)}" y="-3" width="${f(20)}" height="6" fill="#9aa0a6" ${L.thin(p, 0.7)}/>`;
      return o;
    },
  });

  /* ================= X 射线管 ================= */
  PD.register({
    type: 'xray', name: 'X 射线管', defaults: { W: 320, H: 150, electrons: true, rays: true, labels: true, lsize: 13 },
    fields: [{ k: 'W', t: 'num', l: '宽' }, { k: 'H', t: 'num', l: '高' }, { k: 'electrons', t: 'bool', l: '电子束' }, { k: 'rays', t: 'bool', l: 'X 射线' }, { k: 'labels', t: 'bool', l: '文字标注' }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const a = +p.W / 2, b = +p.H / 2, tx = a - 92; let o = '';
      o += `<rect x="${f(-a)}" y="${f(-b)}" width="${f(2 * a)}" height="${f(2 * b)}" rx="${f(b)}" fill="#e6f2fa" fill-opacity="0.75" ${sd(p)}/>`;
      const cx = -a + 46;
      o += `<path d="M${pt(cx - 6, -16)}A20,20 0 0 0 ${pt(cx - 6, 16)}" fill="none" stroke="#777" stroke-width="3"/><path d="M${pt(cx, -12)}l5,4l-5,4l5,4l-5,4l5,4" fill="none" stroke="#e65100" stroke-width="1.6"/>`;
      o += `<path d="M${pt(cx, -12)}H${f(-a - 34)}M${pt(cx, 12)}H${f(-a - 34)}" fill="none" ${sd(p)}/>`;
      o += `<rect x="${f(tx + 22)}" y="-15" width="${f(a + 30 - tx - 22)}" height="30" fill="${L.metal(ctx, '#c77b30', -15, 15, true)}" ${sd(p)}/><polygon points="${pt(tx + 22, -15)} ${pt(tx - 8, 15)} ${pt(tx + 22, 15)}" fill="#5f6368" ${sd(p)}/>`;
      if (p.electrons) [-6, 0, 6].forEach((y) => (o += L.arrow(p, cx + 12, y, tx + 4 + y * 0.5, y * 0.25, { sw: 1.1, dash: 'dash', color: '#1e5fbf' })));
      if (p.rays) [-0.35, 0, 0.35].forEach((da) => { const ang = Math.PI * 0.62 + da, x0 = tx + 6, y0 = 4, l = b + 60; o += wavyArrow(p, x0, y0, x0 + l * Math.cos(ang), y0 + l * Math.sin(ang), '#6a1b9a', 1.4, 3, 10); });
      o += `<circle cx="${f(-a - 36)}" cy="-12" r="3.5" fill="#fff" ${sd(p)}/><circle cx="${f(-a - 36)}" cy="12" r="3.5" fill="#fff" ${sd(p)}/><circle cx="${f(a + 34)}" cy="0" r="4" fill="#fff" ${sd(p)}/>`;
      if (p.labels) {
        o += lbl(ctx, p, '阴极(灯丝)', cx, -b - 14) + lbl(ctx, p, '阳极', a - 30, -b - 14) + lbl(ctx, p, '钨靶', tx - 2, -30) + lbl(ctx, p, '电子', (cx + tx) / 2, -22) + lbl(ctx, p, '真空', -a * 0.25, b - 18);
        o += lbl(ctx, p, 'X 射线', tx - b * 0.5, b + 64) + lbl(ctx, p, '−', -a - 50, 0) + lbl(ctx, p, '+  高压', a + 44, 0, 'start') + lbl(ctx, p, '低压(加热灯丝)', -a - 42, 30, 'end');
      }
      return o;
    },
  });

  /* ================= 粒子 ================= */
  PD.register({
    type: 'particle', name: '粒子(α β γ p n e)', defaults: { kind: 'alpha', s: 12, lab: 'greek', v: 0, lsize: 15 },
    fields: [{ k: 'kind', t: 'sel', l: '粒子', o: [['alpha', 'α 粒子(氦核)'], ['beta', 'β 粒子(电子)'], ['gamma', 'γ 射线'], ['proton', '质子'], ['neutron', '中子'], ['electron', '电子'], ['positron', '正电子']] },
      { k: 's', t: 'num', l: '大小' }, { k: 'lab', t: 'sel', l: '标注', o: [['greek', '符号(α、β…)'], ['nuc', '核素符号(⁴₂He…)'], ['none', '不标']] }, { k: 'v', t: 'num', l: '速度箭头长(0=无)' }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const s = +p.s, k = p.kind; let o = '', lab = '', ext = s;
      const LAB = { alpha: ['\\alpha', '\\nuc{4}{2}{He}'], beta: ['\\beta', '\\nuc{0}{-1}{e}'], gamma: ['\\gamma', '\\gamma'], proton: ['p', '\\nuc{1}{1}{p}'], neutron: ['n', '\\nuc{1}{0}{n}'], electron: ['e^{-}', '\\nuc{0}{-1}{e}'], positron: ['e^{+}', '\\nuc{0}{1}{e}'] };
      if (k === 'alpha') { const r = s * 0.5, d = r * 0.95; [[-d, -d, 1], [d, -d, 0], [-d, d, 0], [d, d, 1]].forEach(([x, y, pr]) => (o += ball(p, ctx, x, y, r, pr ? PROT : NEUT, pr && r >= 5 ? 1 : 0))); ext = s; }
      else if (k === 'gamma') { o += wavyArrow(p, -s * 3, 0, s * 3, 0, p.stroke, +p.sw || 1.5, s * 0.35, s * 1.1); ext = s * 0.4; }
      else { const col = { beta: ELEC, electron: ELEC, positron: '#f4a742', proton: PROT, neutron: NEUT }[k], r = k === 'proton' || k === 'neutron' ? s * 0.6 : s * 0.42, sg = { beta: -1, electron: -1, positron: 1, proton: 1, neutron: 0 }[k]; o += ball(p, ctx, 0, 0, r, col, sg); ext = r; }
      if (+p.v > 0 && k !== 'gamma') o += L.arrow(p, ext + 3, 0, ext + 3 + +p.v, 0, { sw: 1.5 });
      if (p.lab !== 'none') { lab = (LAB[k] || ['', ''])[p.lab === 'nuc' ? 1 : 0]; o += T(ctx, lab, 0, ext + 14, { size: p.lsize, italic: false, color: p.stroke }); }
      return o;
    },
  });

  /* ================= 电磁波谱 ================= */
  PD.register({
    type: 'emspec', name: '电磁波谱', defaults: { W: 560, h: 36, colored: true, wl: true, arrows: true, lsize: 12 },
    fields: [{ k: 'W', t: 'num', l: '长' }, { k: 'h', t: 'num', l: '高' }, { k: 'colored', t: 'bool', l: '彩色' }, { k: 'wl', t: 'bool', l: '标波长' }, { k: 'arrows', t: 'bool', l: '波长/频率增加箭头' }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const W = +p.W, h = +p.h, ls = p.lsize, names = ['无线电波', '微波', '红外线', '可见光', '紫外线', 'X 射线', '\\rm{\\gamma} 射线'], fr = [0.19, 0.14, 0.15, 0.08, 0.14, 0.14, 0.16], cols = ['#c5cae9', '#b3e5fc', '#ffccbc', null, '#e1bee7', '#cfd8dc', '#d7ccc8'];
      const wls = ['10^{-1}', '10^{-3}', '7 \\times 10^{-7}', '4 \\times 10^{-7}', '10^{-8}', '10^{-11}'];
      let x = 0, o = '';
      names.forEach((n, i) => {
        const w = fr[i] * W; let fill = p.colored ? cols[i] : '#ffffff';
        if (i === 3) { const id = ctx.id + '-vis'; ctx.defs.push(`<linearGradient id="${id}">${PD.SPECTRUM.map((c, k) => `<stop offset="${f(k / 6)}" stop-color="${c}"/>`).join('')}</linearGradient>`); fill = p.colored ? `url(#${id})` : '#ffffff'; }
        o += `<rect x="${f(x)}" y="0" width="${f(w)}" height="${f(h)}" fill="${fill}" ${S(p, { dash: 'solid', sw: 1 })}/>` + T(ctx, n, x + w / 2, h / 2, { size: i === 3 ? ls - 1 : ls, italic: false, color: '#111', halo: i === 3 });
        if (p.wl && i < 6) o += `<line x1="${f(x + w)}" y1="${f(h)}" x2="${f(x + w)}" y2="${f(h + 6)}" ${S(p, { dash: 'solid', sw: 1 })}/>` + T(ctx, wls[i] + '\\rm{\\ m}', x + w, h + 16 + (i === 3 ? 13 : 0), { size: ls - 1, italic: false, color: p.stroke });
        x += w;
      });
      if (p.arrows) o += L.arrow(p, W * 0.6, -14, W * 0.98, -14, { sw: 1.2 }) + T(ctx, '频率增加', W * 0.79, -26, { size: ls, italic: false, color: p.stroke }) + L.arrow(p, W * 0.4, -14, W * 0.02, -14, { sw: 1.2 }) + T(ctx, '波长增加', W * 0.21, -26, { size: ls, italic: false, color: p.stroke });
      return o;
    },
  });

  /* ================= 原子结构 ================= */
  const autoShells = (Z) => { const cap = [2, 8, 8, 18, 18, 32], r = []; let n = Z; for (const c of cap) { if (n <= 0) break; r.push(Math.min(c, n)); n -= c; } return r; };
  PD.register({
    type: 'atom', name: '原子结构(原子核 + 电子)',
    defaults: { Z: 6, N: 6, rn: 5, style: 'cluster', shells: 'auto', orbits: true, electrons: true, sp: 26, eR: 4, symbol: true, legend: true, dash: 'solid', lsize: 13, seed: 2 },
    fields: [
      { k: 'Z', t: 'num', l: '质子数 Z', min: 1 }, { k: 'N', t: 'num', l: '中子数 N', min: 0 }, { k: 'rn', t: 'num', l: '核子大小', step: 0.5 },
      { k: 'style', t: 'sel', l: '原子核画法', o: [['cluster', '彩色立体'], ['flat', '黑白(质子带 +)'], ['sphere', '一个球']] },
      { k: 'electrons', t: 'bool', l: '电子' }, { k: 'orbits', t: 'bool', l: '电子轨道' }, { k: 'shells', t: 'text', l: '每层电子数(auto 或 2,8,1)' }, { k: 'sp', t: 'num', l: '轨道间距' }, { k: 'eR', t: 'num', l: '电子大小', step: 0.5 },
      { k: 'symbol', t: 'bool', l: '下方核素符号' }, { k: 'legend', t: 'bool', l: '图例(质子/中子/电子)' }, { k: 'lsize', t: 'num', l: '字号' }, { k: 'seed', t: 'num', l: '随机排布' },
    ],
    style: ['stroke', 'sw', 'dash', 'opacity'],
    render(p, ctx) {
      const Z = Math.max(1, Math.round(+p.Z)), N = Math.max(0, Math.round(+p.N)), rn = +p.rn, Rn = nucR(Z + N, rn), ls = p.lsize, sp = +p.sp;
      const sh = !p.shells || String(p.shells).trim() === 'auto' ? autoShells(Z) : String(p.shells).split(/[,\s]+/).map(Number).filter((x) => x >= 0);
      const show = p.orbits || p.electrons, Rmax = show && sh.length ? Rn + sp * sh.length : Rn;
      let o = '';
      if (show) sh.forEach((n, k) => {
        const R = Rn + sp * (k + 1);
        if (p.orbits) o += `<circle r="${f(R)}" fill="none" ${S(p, { sw: Math.max(0.7, (+p.sw || 1.5) * 0.6) })}/>`;
        if (p.electrons) for (let i = 0; i < n; i++) { const a = (TAU * i) / n - Math.PI / 2 + k * 0.45; o += ball(p, ctx, R * Math.cos(a), R * Math.sin(a), +p.eR, ELEC, +p.eR >= 5 ? -1 : 0); }
      });
      o += L.nucleus(p, ctx, 0, 0, Z, N, rn, { style: p.style, seed: p.seed, plus: true });
      if (p.symbol) o += T(ctx, `\\nuc{${Z + N}}{${Z}}{${ELEM[Z - 1] || 'X'}}`, 0, Rmax + 24, { size: ls + 5, italic: false, color: p.stroke });
      if (p.legend) {
        const x = Rmax + 26, rows = [['质子', 'p'], ['中子', 'n']].concat(p.electrons ? [['电子', 'e']] : []);
        rows.forEach(([t, k], i) => { const y = -Rmax * 0.4 + i * 26; o += (k === 'e' ? ball(p, ctx, x, y, +p.eR, ELEC) : p.style === 'flat' ? `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rn)}" fill="${k === 'p' ? '#d6d6d6' : '#fff'}" ${L.thin(p, 0.6)}/>` : ball(p, ctx, x, y, Math.max(rn, 4), k === 'p' ? PROT : NEUT)) + T(ctx, t, x + 14, y, { size: ls, anchor: 'start', italic: false, color: p.stroke }); });
      }
      return o;
    },
  });

  /* ================= α 粒子散射（卢瑟福） ================= */
  PD.register({
    type: 'rutherford', name: 'α 粒子散射(卢瑟福)',
    defaults: { W: 380, H: 250, d0: 14, bs: '-110,-80,-52,-28,-12,-4,0,4,12,28,52,80,110', nuc: 7, labels: true, colored: false, lsize: 13, sw: 1.2 },
    fields: [{ k: 'W', t: 'num', l: '宽' }, { k: 'H', t: 'num', l: '高' }, { k: 'd0', t: 'num', l: '正面碰撞最近距离' }, { k: 'bs', t: 'text', l: '各粒子的瞄准距离(逗号分隔)' }, { k: 'nuc', t: 'num', l: '原子核大小' }, { k: 'labels', t: 'bool', l: '文字标注' }, { k: 'colored', t: 'bool', l: '彩色' }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const W = +p.W, H = +p.H, K = +p.d0 / 2, x0 = -W / 2 + 6, col = p.colored ? COL.a : p.stroke, sw = +p.sw || 1.2;
      const bs = String(p.bs).split(/[,\s]+/).map(Number).filter((v) => isFinite(v));
      let o = '';
      bs.forEach((b0) => {
        let x = x0, y = Math.abs(b0) < 0.4 ? 0.8 : b0, vx = 1, vy = 0; const P = [[x, y]];
        for (let k = 0; k < 30000; k++) {
          const r = Math.hypot(x, y), dt = clamp(r * 0.02, 0.04, 1.5), a1 = K / (r * r * r);
          vx += (a1 * x * dt) / 2; vy += (a1 * y * dt) / 2; x += vx * dt; y += vy * dt;
          const r2 = Math.hypot(x, y), a2 = K / (r2 * r2 * r2); vx += (a2 * x * dt) / 2; vy += (a2 * y * dt) / 2;
          if (k % 3 === 0) P.push([x, y]);
          if (x < x0 - 1 || x > W / 2 || Math.abs(y) > H / 2) { P.push([x, y]); break; }
        }
        o += polyArrow(p, P, col, sw);
      });
      o += ball(p, ctx, 0, 0, +p.nuc, PROT, +p.nuc >= 5 ? 1 : 0);
      if (p.labels) o += lbl(ctx, p, '金原子核', 0, +p.nuc + 16) + lbl(ctx, p, 'α 粒子', x0 + 30, -H / 2 + 12);
      return o;
    },
  });

  /* ================= 衰变系（A-Z / N-Z 图） ================= */
  const U238 = '92,238,U\n90,234,Th\n91,234,Pa\n92,234,U\n90,230,Th\n88,226,Ra\n86,222,Rn\n84,218,Po\n82,214,Pb\n83,214,Bi\n84,214,Po\n82,210,Pb\n83,210,Bi\n84,210,Po\n82,206,Pb';
  PD.register({
    type: 'decaychain', name: '衰变系(A-Z / N-Z 图)',
    defaults: { mode: 'AZ', chain: U238, W: 440, H: 360, auto: true, zmin: 81, zmax: 93, ymin: 202, ymax: 242, yst: 0, grid: true, labels: true, legend: true, ca: '#d32f2f', cb: '#2e7d32', xt: '原子序数', ytA: '质量数', ytN: '中子数目', lsize: 12 },
    fields: [
      { k: 'mode', t: 'sel', l: '纵轴', o: [['AZ', '质量数 A'], ['NZ', '中子数 N']], rebuild: true },
      { k: 'chain', t: 'area', l: '核素(按衰变顺序，每行 Z, A, 符号, 标签位置)', ph: '例: 92,238,U\n例: 90,234,Th\n标签位置(可省): l 左上 / r 右 / t 上 / b 下' },
      { k: 'W', t: 'num', l: '图宽' }, { k: 'H', t: 'num', l: '图高' }, { k: 'auto', t: 'bool', l: '自动坐标范围', rebuild: true },
      { k: 'zmin', t: 'num', l: 'Z 最小', when: (p) => !p.auto }, { k: 'zmax', t: 'num', l: 'Z 最大', when: (p) => !p.auto }, { k: 'ymin', t: 'num', l: '纵轴最小', when: (p) => !p.auto }, { k: 'ymax', t: 'num', l: '纵轴最大', when: (p) => !p.auto },
      { k: 'yst', t: 'num', l: '纵轴刻度间隔(0=自动)' }, { k: 'grid', t: 'bool', l: '网格' }, { k: 'labels', t: 'bool', l: '核素标签' }, { k: 'legend', t: 'bool', l: '图例' },
      { k: 'ca', t: 'color', l: 'α 衰变颜色' }, { k: 'cb', t: 'color', l: 'β 衰变颜色' }, { k: 'xt', t: 'text', l: '横轴标题' }, { k: 'ytA', t: 'text', l: '纵轴标题(A)', when: (p) => p.mode !== 'NZ' }, { k: 'ytN', t: 'text', l: '纵轴标题(N)', when: (p) => p.mode === 'NZ' }, { k: 'lsize', t: 'num', l: '字号' },
    ],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const rows = PD.lines(p.chain).map((l) => l.split(',').map((s) => s.trim())).filter((a) => a.length >= 2 && isFinite(+a[0]) && isFinite(+a[1])).map((a) => ({ Z: +a[0], A: +a[1], s: a[2] || '', pos: (a[3] || '').toLowerCase() }));
      if (!rows.length) return '';
      const NZ = p.mode === 'NZ', yv = (q) => (NZ ? q.A - q.Z : q.A), yst = +p.yst > 0 ? +p.yst : NZ ? 2 : 4, ls = p.lsize;
      let zmin = +p.zmin, zmax = +p.zmax, ymin = +p.ymin, ymax = +p.ymax;
      if (p.auto) { const zs = rows.map((q) => q.Z), ys = rows.map(yv); zmin = Math.min(...zs) - 1; zmax = Math.max(...zs) + 1; ymin = Math.floor((Math.min(...ys) - yst) / yst) * yst; ymax = Math.ceil((Math.max(...ys) + yst) / yst) * yst; }
      const W = +p.W, H = +p.H, X = (z) => ((z - zmin) / (zmax - zmin || 1)) * W, Y = (v) => H - ((v - ymin) / (ymax - ymin || 1)) * H;
      let o = '', g = '', tk = '';
      for (let z = Math.ceil(zmin); z <= zmax; z++) { const x = X(z); if (p.grid && z > zmin && z < zmax) g += `M${pt(x, 0)}V${f(H)}`; tk += `M${pt(x, H)}v5`; o += T(ctx, String(z), x, H + 15, { size: ls, italic: false, color: p.stroke }); }
      for (let v = Math.ceil(ymin / yst) * yst; v <= ymax + 1e-9; v += yst) { const y = Y(v); if (p.grid && v > ymin && v < ymax) g += `M${pt(0, y)}H${f(W)}`; tk += `M${pt(0, y)}h-5`; o += T(ctx, String(v), -8, y, { size: ls, anchor: 'end', italic: false, color: p.stroke }); }
      o = `<rect width="${f(W)}" height="${f(H)}" fill="#ffffff"/>` + (g ? `<path d="${g}" fill="none" stroke="#c9d3dc" stroke-width="0.7"/>` : '') + `<rect width="${f(W)}" height="${f(H)}" fill="none" ${S(p, { dash: 'solid', sw: 1 })}/><path d="${tk}" fill="none" ${S(p, { dash: 'solid', sw: 1 })}/>` + o;
      o += T(ctx, p.xt, W / 2, H + 36, { size: ls + 1, italic: false, color: p.stroke }) + T(ctx, NZ ? p.ytN : p.ytA, -8, -16, { size: ls + 1, anchor: 'start', italic: false, color: p.stroke });
      const typ = (a, b) => (b.A - a.A === -4 && b.Z - a.Z === -2 ? 'a' : b.A === a.A && b.Z - a.Z === 1 ? 'b' : b.A === a.A && b.Z - a.Z === -1 ? 'b+' : 'x');
      const seg = (x0, y0, x1, y1, t) => { const col = t === 'a' ? p.ca : t === 'x' ? '#9e9e9e' : p.cb, ang = Math.atan2(y1 - y0, x1 - x0), mx = (x0 + x1) / 2, my = (y0 + y1) / 2; return `<line x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y1)}" stroke="${col}" stroke-width="1.5"${t === 'x' ? ' stroke-dasharray="4 3"' : ''}/>` + PD.arrowHead(mx + Math.cos(ang) * 5, my + Math.sin(ang) * 5, ang, 10, 'full', col, 1); };
      const via = rows.map(() => '');
      for (let i = 0; i < rows.length - 1; i++) { const a = rows[i], b = rows[i + 1], t = typ(a, b); via[i + 1] = t; o += seg(X(a.Z), Y(yv(a)), X(b.Z), Y(yv(b)), t); }
      rows.forEach((q, i) => {
        const x = X(q.Z), y = Y(yv(q)); o += `<circle cx="${f(x)}" cy="${f(y)}" r="3" fill="${p.stroke}"/>`;
        if (!p.labels || !q.s) return;
        let pos = q.pos; if (!pos) { const nxt = i < rows.length - 1 ? typ(q, rows[i + 1]) : ''; pos = i === 0 ? 'r' : via[i] === 'b' ? (nxt === 'b' && !NZ ? 't' : 'r') : 'l'; }
        const txt = `{}^{${q.A}}\\rm{${q.s}}`, o2 = { size: ls + 2, italic: false, color: p.stroke, halo: true };
        o += pos === 'r' ? T(ctx, txt, x + 6, y - 4, Object.assign({ anchor: 'start' }, o2)) : pos === 't' ? T(ctx, txt, x, y - 14, o2) : pos === 'b' ? T(ctx, txt, x, y + 15, o2) : T(ctx, txt, x - 5, y - 11, Object.assign({ anchor: 'end' }, o2));
      });
      if (p.legend) {
        const lx = W - 120, ly = H - 70, dirOf = (dz, dv) => nrm([X(zmin + dz) - X(zmin), Y(ymin + dv) - Y(ymin)]);
        [['a', dirOf(-2, NZ ? -2 : -4), 'α 衰变'], ['b', dirOf(1, NZ ? -1 : 0), 'β 衰变']].forEach(([t, u, s], k) => { const cx = lx + 20, cy = ly + k * 38; o += seg(cx - u[0] * 20, cy - u[1] * 20, cx + u[0] * 20, cy + u[1] * 20, t) + T(ctx, s, cx + 30, cy, { size: ls + 1, anchor: 'start', italic: false, color: p.stroke, halo: true }); });
      }
      return o;
    },
  });

  /* ================= 衰变曲线 ================= */
  PD.register({
    type: 'decaycurve', name: '衰变曲线(半衰期)',
    defaults: { W: 340, H: 220, T: 70, n: 3, y0l: 'N_0', yl: 'N', xl: 't', steps: true, bg: 0, bgl: '本底计数率', lsize: 14, cc: '#000000', sw: 1.8 },
    fields: [{ k: 'W', t: 'num', l: '横轴长' }, { k: 'H', t: 'num', l: '纵轴长' }, { k: 'T', t: 'num', l: '半衰期(横向像素)' }, { k: 'n', t: 'num', l: '标几个半衰期', min: 0 }, { k: 'steps', t: 'bool', l: '虚线投影 + 标注' },
      { k: 'y0l', t: 'text', l: '初始值标签' }, { k: 'yl', t: 'text', l: '纵轴标签' }, { k: 'xl', t: 'text', l: '横轴标签' }, { k: 'bg', t: 'range', l: '本底(占初始值比例)', min: 0, max: 0.5, step: 0.02 }, { k: 'bgl', t: 'text', l: '本底文字', when: (p) => +p.bg > 0 },
      { k: 'cc', t: 'color', l: '曲线颜色' }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const W = +p.W, H = +p.H, Tw = Math.max(5, +p.T), n = Math.max(0, Math.round(+p.n)), bg = clamp(+p.bg || 0, 0, 0.8), ls = p.lsize, H0 = H * 0.86;
      const Y = (t) => H - H0 * ((1 - bg) * Math.pow(2, -t / Tw) + bg);
      let o = L.arrow(p, 0, H, W + 16, H, { sw: 1.3 }) + L.arrow(p, 0, H, 0, -16, { sw: 1.3 }) + T(ctx, p.xl, W + 22, H, { size: ls + 1, anchor: 'start', color: p.stroke }) + T(ctx, p.yl, 0, -28, { size: ls + 1, color: p.stroke }) + T(ctx, '0', -8, H + 12, { size: ls, italic: false, color: p.stroke });
      let d = ''; for (let x = 0; x <= W; x += 2) d += (x ? 'L' : 'M') + pt(x, Y(x));
      o += `<path d="${d}" fill="none" ${S(p, { color: p.cc, sw: +p.sw, dash: 'solid' })}/>` + `<line x1="-4" y1="${f(Y(0))}" x2="0" y2="${f(Y(0))}" ${S(p, { dash: 'solid', sw: 1 })}/>` + T(ctx, p.y0l, -8, Y(0), { size: ls, anchor: 'end', color: p.stroke });
      if (p.steps) for (let k = 1; k <= n; k++) {
        const t = k * Tw; if (t > W) break; const y = Y(t);
        o += `<path d="M${pt(t, H)}V${f(y)}H0" fill="none" ${S(p, { dash: 'dash', sw: 0.9 })}/>` + T(ctx, k === 1 ? 't_{1/2}' : `${k}t_{1/2}`, t, H + 16, { size: ls, color: p.stroke });
        if (!bg) o += T(ctx, `\\frac{${p.y0l}}{${2 ** k}}`, -8, y, { size: ls - 1, anchor: 'end', color: p.stroke });
      }
      if (bg) { const y = H - H0 * bg; o += `<line x1="0" y1="${f(y)}" x2="${f(W)}" y2="${f(y)}" ${S(p, { dash: 'dashdot', sw: 0.9 })}/>` + T(ctx, p.bgl, W, y - 12, { size: ls - 1, anchor: 'end', italic: false, color: p.stroke }); }
      return o;
    },
  });

  /* ================= 核裂变 ================= */
  const neutronSvg = (p, ctx, x, y, rn) => ball(p, ctx, x, y, rn * 1.5, NEUT);
  PD.register({
    type: 'fission', name: '核裂变(铀-235)',
    defaults: { style: 'cluster', u236: true, nOut: 3, energy: true, labels: true, rn: 2.4, lsize: 14, seed: 5, f1: '141,56,Ba', f2: '92,36,Kr' },
    fields: [{ k: 'style', t: 'sel', l: '原子核画法', o: [['cluster', '彩色立体(核子)'], ['flat', '黑白'], ['sphere', '球体']] }, { k: 'u236', t: 'bool', l: '中间态 U-236' }, { k: 'nOut', t: 'num', l: '放出中子数', min: 0 },
      { k: 'f1', t: 'text', l: '碎片 1(A, Z, 符号)' }, { k: 'f2', t: 'text', l: '碎片 2(A, Z, 符号)' }, { k: 'energy', t: 'bool', l: '能量' }, { k: 'labels', t: 'bool', l: '核素符号' }, { k: 'rn', t: 'num', l: '核子大小', step: 0.2 }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const rn = +p.rn, st = p.style, ls = p.lsize, R1 = nucR(235, rn), fr = (s) => { const a = String(s).split(',').map((x) => x.trim()); return { A: +a[0] || 1, Z: +a[1] || 0, s: a[2] || '' }; };
      const F1 = fr(p.f1), F2 = fr(p.f2), r1 = nucR(F1.A, rn), r2 = nucR(F2.A, rn), lab = (t, x, y) => (p.labels ? T(ctx, t, x, y, { size: ls, italic: false, color: p.stroke, halo: true }) : '');
      let o = neutronSvg(p, ctx, 0, 0, rn) + lab('\\nuc{1}{0}{n}', 0, rn * 1.5 + 16);
      const xu = 60 + R1; o += L.arrow(p, rn * 2 + 4, 0, xu - R1 - 6, 0, { sw: 1.6 });
      o += L.nucleus(p, ctx, xu, 0, 92, 143, rn, { style: st, seed: p.seed }) + lab('\\nuc{235}{92}{U}', xu, R1 + 18);
      let x = xu + R1 + 14;
      if (p.u236) { o += L.arrow(p, x, 0, x + 44, 0, { sw: 2.2 }); const xv = x + 56 + R1 * 1.2; o += `<g transform="translate(${f(xv)},0) scale(1.2,0.84)">${L.nucleus(p, ctx, 0, 0, 92, 144, rn, { style: st, seed: +p.seed + 1 })}</g>` + lab('\\nuc{236}{92}{U}', xv, R1 * 0.84 + 18); x = xv + R1 * 1.2 + 14; }
      o += L.arrow(p, x, 0, x + 44, 0, { sw: 2.2 });
      const xf = x + 64 + Math.max(r1, r2), y1 = -r1 - 10, y2 = r2 + 10;
      o += L.nucleus(p, ctx, xf, y1, F1.Z, F1.A - F1.Z, rn, { style: st, seed: +p.seed + 2 }) + L.nucleus(p, ctx, xf + 8, y2, F2.Z, F2.A - F2.Z, rn, { style: st, seed: +p.seed + 3 });
      o += lab(`\\nuc{${F1.A}}{${F1.Z}}{${F1.s}}`, xf - r1 - 26, y1) + lab(`\\nuc{${F2.A}}{${F2.Z}}{${F2.s}}`, xf - r2 - 20, y2 + r2 * 0.6);
      const n = Math.max(0, Math.round(+p.nOut));
      for (let k = 0; k < n; k++) { const a = n > 1 ? (-0.55 + (1.1 * k) / (n - 1)) : 0, x0 = xf + Math.max(r1, r2) + 14, y0 = 0; const ex = x0 + 70 * Math.cos(a), ey = y0 + 70 * Math.sin(a) * 1.4; o += L.arrow(p, x0, y0, ex, ey, { sw: 1.3 }) + neutronSvg(p, ctx, ex + 10 * Math.cos(a), ey + 10 * Math.sin(a), rn); }
      if (n) o += lab(`${n > 1 ? n : ''}\\nuc{1}{0}{n}`, xf + Math.max(r1, r2) + 110, -56);
      if (p.energy) o += star(xf + Math.max(r1, r2) + 6, -Math.max(r1, r2) - 34, 16) + lab('能量', xf + Math.max(r1, r2) + 6, -Math.max(r1, r2) - 60);
      return o;
    },
  });

  /* ================= 链式反应 ================= */
  PD.register({
    type: 'chainrx', name: '链式反应(可受控)', defaults: { gens: 3, k: 3, controlled: false, R: 13, dx: 118, labels: true, lsize: 13 },
    fields: [{ k: 'gens', t: 'num', l: '代数', min: 1 }, { k: 'k', t: 'num', l: '每次裂变放出中子数', min: 2 }, { k: 'controlled', t: 'bool', l: '受控(每次只有一个中子引发下一次裂变)' }, { k: 'R', t: 'num', l: '原子核大小' }, { k: 'dx', t: 'num', l: '每代间距' }, { k: 'labels', t: 'bool', l: '文字标注' }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const G = Math.max(1, Math.round(+p.gens)), k = Math.max(2, Math.round(+p.k)), R = +p.R, dx = +p.dx, ctrl = p.controlled, rn = R * 0.3, leaf = 3.8 * R;
      let o = '', firstAbs = true;
      const nuc = (x, y) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(R)}" fill="${gid(ctx, FUEL)}" ${L.thin(p, 0.7)}/>`;
      const frags = (x, y) => ball(p, ctx, x + R * 0.95, y - R * 0.75, R * 0.5, '#9575cd') + ball(p, ctx, x + R * 0.95, y + R * 0.75, R * 0.45, '#4db6ac');
      const node = (g, x, y, span) => {
        o += nuc(x, y) + frags(x, y);
        for (let j = 0; j < k; j++) {
          const off = j - (k - 1) / 2;
          if (g === G - 1 || (ctrl && j !== Math.floor((k - 1) / 2))) {
            const ey = y + off * R * (ctrl ? 1.9 : 1.3), ex = x + dx * 0.45;
            o += L.arrow(p, x + R * 1.4, y + off * R * 0.6, ex, ey, { sw: 1.1 }) + neutronSvg(p, ctx, ex + rn * 2, ey, rn);
            if (ctrl && g < G - 1) { o += `<path d="M${pt(ex + rn * 2 - 6, ey - 6)}l12,12M${pt(ex + rn * 2 - 6, ey + 6)}l12,-12" stroke="#c62828" stroke-width="1.6"/>`; if (firstAbs && p.labels) { o += T(ctx, '被控制棒吸收', ex + 16, ey + (off < 0 ? -12 : 12), { size: p.lsize, anchor: 'start', italic: false, color: '#c62828', halo: true }); firstAbs = false; } }
            continue;
          }
          const cy = ctrl ? y : y + (off * span) / k, cx = x + dx;
          o += L.arrow(p, x + R * 1.4, y + off * R * 0.5, cx - R - 3, cy, { sw: 1.1 }) + neutronSvg(p, ctx, (x + cx) / 2, (y + cy) / 2 + (ctrl ? 0 : 0), rn);
          node(g + 1, cx, cy, ctrl ? 0 : span / k);
        }
      };
      o += neutronSvg(p, ctx, -dx * 0.55, 0, rn) + L.arrow(p, -dx * 0.55 + rn * 2, 0, -R - 3, 0, { sw: 1.1 });
      node(0, 0, 0, ctrl ? 0 : Math.pow(k, G - 1) * leaf);
      if (p.labels) { const yb = (ctrl ? R * 3 : (Math.pow(k, G - 1) * leaf) / 2) + 24; o += T(ctx, '{}^{235}\\rm{U}', 0, R + 14, { size: p.lsize, italic: false, color: p.stroke, halo: true }) + neutronSvg(p, ctx, -dx * 0.55, yb, rn) + T(ctx, '中子', -dx * 0.55 + 10, yb, { size: p.lsize, anchor: 'start', italic: false, color: p.stroke }); }
      return o;
    },
  });

  /* ================= 核聚变 ================= */
  PD.register({
    type: 'fusion', name: '核聚变(氘 + 氚)', defaults: { rn: 7, labels: true, energy: true, style: 'cluster', lsize: 15 },
    fields: [{ k: 'rn', t: 'num', l: '核子大小' }, { k: 'style', t: 'sel', l: '画法', o: [['cluster', '彩色立体'], ['flat', '黑白']] }, { k: 'energy', t: 'bool', l: '能量' }, { k: 'labels', t: 'bool', l: '核素符号' }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const rn = +p.rn, ls = p.lsize, st = p.style, sym = (t, x) => T(ctx, t, x, 0, { size: ls + 8, italic: false, color: p.stroke }), lab = (t, x) => (p.labels ? T(ctx, t, x, rn * 3.4 + 12, { size: ls, italic: false, color: p.stroke }) : '');
      let o = L.nucleus(p, ctx, 0, 0, 1, 1, rn, { style: st, seed: 1, plus: true }) + lab('\\nuc{2}{1}{H}', 0) + sym('+', rn * 4.6);
      o += L.nucleus(p, ctx, rn * 9.2, 0, 1, 2, rn, { style: st, seed: 2, plus: true }) + lab('\\nuc{3}{1}{H}', rn * 9.2) + L.arrow(p, rn * 13, 0, rn * 18, 0, { sw: 2.2 });
      o += L.nucleus(p, ctx, rn * 22, 0, 2, 2, rn, { style: st, seed: 3, plus: true }) + lab('\\nuc{4}{2}{He}', rn * 22) + sym('+', rn * 26.2);
      o += ball(p, ctx, rn * 29.4, 0, rn, NEUT) + lab('\\nuc{1}{0}{n}', rn * 29.4);
      if (p.energy) o += sym('+', rn * 32.6) + star(rn * 36.4, 0, rn * 2.4) + (p.labels ? T(ctx, '能量', rn * 36.4, rn * 3.4 + 12, { size: ls, italic: false, color: p.stroke }) : '');
      return o;
    },
  });

  /* ================= 核反应堆 ================= */
  PD.register({
    type: 'reactor', name: '核反应堆(压水式发电站示意)', defaults: { ins: 0.45, labels: true, plant: true, lsize: 12 },
    fields: [{ k: 'ins', t: 'range', l: '控制棒插入深度', min: 0, max: 1, step: 0.05 }, { k: 'plant', t: 'bool', l: '蒸汽发生器 + 涡轮机 + 发电机' }, { k: 'labels', t: 'bool', l: '文字标注' }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const ins = clamp(+p.ins, 0, 1), HOT = '#ef5350', COLD = '#42a5f5', ST = '#cfd8dc'; let o = '';
      const pipe = (d, col, w) => L.tube(d, w || 12, p.stroke, col, 1.2);
      o += `<rect x="-135" y="-150" width="270" height="300" fill="#e0e0e0" ${sd(p)}/><rect x="-135" y="-150" width="270" height="300" ${PD.fillAttr({ fillMode: 'dots', fill: '#9e9e9e' }, ctx)} stroke="none"/>`;
      o += `<rect x="-100" y="-118" width="200" height="236" rx="26" fill="#d6ebf8" ${S(p, { dash: 'solid', sw: 3 })}/>`;
      [-70, -35, 0, 35, 70].forEach((x) => (o += `<rect x="${f(x - 6)}" y="-70" width="12" height="160" rx="2" fill="${L.metal(ctx, '#f0a35e', x - 6, x + 6)}" ${sd(p)}/>`));
      const yb = -70 + ins * 150;
      [-52, -17, 17, 52].forEach((x) => (o += `<rect x="${f(x - 4.5)}" y="-176" width="9" height="${f(yb + 176)}" fill="#37474f" ${sd(p)}/>`));
      o += `<rect x="-64" y="-186" width="128" height="10" rx="2" fill="#263238" ${sd(p)}/>`;
      if (p.plant) {
        o += pipe('M100,-80H190', HOT) + pipe('M190,70H160M140,70H100', COLD) + `<circle cx="150" cy="70" r="13" fill="#90a4ae" ${sd(p)}/><path d="M144,64l12,6l-12,6Z" fill="#37474f"/>`;
        o += `<rect x="180" y="-118" width="78" height="210" rx="34" fill="#e3f2fd" ${S(p, { dash: 'solid', sw: 2 })}/><path d="M190,-80H202l20,12l-20,12l20,12l-20,12l20,12l-20,12l20,12l-20,12l20,12l-20,12H190" fill="none" stroke="${HOT}" stroke-width="3"/>`;
        o += pipe('M219,-118V-150H330', ST, 12) + `<polygon points="330,-176 384,-196 384,-104 330,-124" fill="#b0bec5" ${sd(p)}/><line x1="384" y1="-150" x2="420" y2="-150" ${S(p, { dash: 'solid', sw: 4 })}/><circle cx="446" cy="-150" r="26" fill="#eceff1" ${sd(p)}/>` + T(ctx, 'G', 446, -150, { size: 18, italic: false, color: p.stroke });
        o += pipe('M357,-110V-70', ST, 10) + `<rect x="320" y="-70" width="76" height="56" rx="4" fill="#e1f5fe" ${sd(p)}/><path d="M396,-54H430M396,-30H430" fill="none" stroke="#1e88e5" stroke-width="2"/>` + PD.arrowHead(396, -54, Math.PI, 7, 'tri', '#1e88e5', 1) + PD.arrowHead(430, -30, 0, 7, 'tri', '#1e88e5', 1);
        o += pipe('M340,-14V60H310M290,60H258', '#90caf9', 10) + `<circle cx="300" cy="60" r="11" fill="#90a4ae" ${sd(p)}/>`;
        [[145, -80, 0], [125, 70, Math.PI], [270, -150, 0], [340, 26, Math.PI / 2]].forEach(([x, y, a]) => (o += PD.arrowHead(x, y, a, 9, 'full', '#37474f', 1)));
      }
      if (p.labels) {
        const t = (s, x, y, a) => T(ctx, s, x, y, { size: p.lsize, anchor: a, italic: false, color: p.stroke, halo: true });
        o += t('控制棒', -76, -192, 'end') + leader(p, -74, -188, -52, -150) + t('燃料棒', -150, -20, 'end') + leader(p, -148, -20, -76, -20) + t('慢化剂 / 冷却剂(水)', 0, 108) + t('混凝土防护层', 0, 166);
        if (p.plant) o += t('蒸汽发生器', 219, 108) + t('蒸汽', 280, -164) + t('涡轮机', 357, -208) + t('发电机', 446, -112) + t('冷凝器', 358, 4) + t('冷却水', 438, -42, 'start') + t('泵', 150, 96) + t('泵', 300, 84);
      }
      return o;
    },
  });

  /* ================= 预设 ================= */
  PD.preset(C1, '放射源', 'radsource', { label: '放射源' });
  PD.preset(C1, '放射源(射出辐射)', 'radsource', { beam: true, label: '放射源' });
  PD.preset(C1, '铅块(准直缝)', 'leadblock', {});
  PD.preset(C1, 'α β γ 在电场中偏转', 'deflect', {});
  PD.preset(C1, 'α β γ 在磁场中偏转(入纸面)', 'deflect', { mode: 'B', dir: 'in' });
  PD.preset(C1, 'α β γ 在磁场中偏转(出纸面)', 'deflect', { mode: 'B', dir: 'out' });
  PD.preset(C1, '穿透能力(纸/铝/铅)', 'penetrate', {});
  PD.preset(C1, '盖革-米勒计数器', 'gm', {});
  PD.preset(C1, '盖革-米勒管(剖面)', 'gm', { cut: true, counter: false });
  PD.preset(C1, '火花计数器', 'spark', {});
  PD.preset(C1, '云室径迹(α)', 'cloud', {});
  PD.preset(C1, '云室径迹(β)', 'cloud', { mode: 'beta', n: 8 });
  PD.preset(C1, 'X 射线管', 'xray', {});
  PD.preset(C1, 'α 粒子', 'particle', {}); PD.preset(C1, 'β 粒子', 'particle', { kind: 'beta' }); PD.preset(C1, 'γ 射线', 'particle', { kind: 'gamma' });
  PD.preset(C1, '质子', 'particle', { kind: 'proton', lab: 'nuc' }); PD.preset(C1, '中子', 'particle', { kind: 'neutron', lab: 'nuc' }); PD.preset(C1, '电子', 'particle', { kind: 'electron' }); PD.preset(C1, '正电子', 'particle', { kind: 'positron' });
  PD.preset(C1, '辐射危险标志', 'trefoil', {}); PD.preset(C1, '辐射警告(三角)', 'trefoil', { style: 'triangle' });
  PD.preset(C1, '长柄钳', 'tongs', {});
  PD.preset(C1, '电磁波谱', 'emspec', {});
  PD.preset(C1, '计数率与距离', 'graph', { W: 300, H: 190, xmin: 0, xmax: 10, ymin: 0, ymax: 10, ticks: false, tlabels: false, xl: '距离', yl: '计数率', funcs: '9/(1+0.25x^2)+0.6 ; 0 ; 10' });
  PD.preset(C2, '原子结构(碳-12)', 'atom', {});
  PD.preset(C2, '原子结构(氦-4)', 'atom', { Z: 2, N: 2, rn: 8, sp: 32 });
  PD.preset(C2, '原子结构(锂-7, 黑白)', 'atom', { Z: 3, N: 4, rn: 7, style: 'flat', sp: 28 });
  PD.preset(C2, '原子核', 'atom', { Z: 8, N: 8, orbits: false, electrons: false, legend: true, rn: 6 });
  PD.preset(C2, 'α 粒子散射', 'rutherford', {});
  PD.preset(C2, '衰变系(A-Z 图, 铀-238)', 'decaychain', {});
  PD.preset(C2, '衰变系(N-Z 图, 铀-238)', 'decaychain', { mode: 'NZ', W: 300, H: 440 });
  PD.preset(C2, '衰变曲线(半衰期)', 'decaycurve', {});
  PD.preset(C2, '衰变曲线(计数率 + 本底)', 'decaycurve', { yl: '计数率', y0l: 'R_0', bg: 0.16, n: 3 });
  PD.preset(C2, 'α 衰变方程', 'text', { text: '\\nuc{226}{88}{Ra} \\to \\nuc{222}{86}{Rn} + \\nuc{4}{2}{He}', size: 20 });
  PD.preset(C2, 'β 衰变方程', 'text', { text: '\\nuc{14}{6}{C} \\to \\nuc{14}{7}{N} + \\nuc{0}{-1}{e}', size: 20 });
  PD.preset(C2, 'γ 衰变方程', 'text', { text: '\\nuc{60}{28}{Ni}^{*} \\to \\nuc{60}{28}{Ni} + \\gamma', size: 20 });
  PD.preset(C2, '放射性衰变公式', 'text', { text: 'N = N_0 (\\frac{1}{2})^{\\frac{t}{t_{1/2}}}', size: 20 });
  PD.preset(C3, '核裂变', 'fission', {});
  PD.preset(C3, '核裂变(简化)', 'fission', { style: 'sphere', u236: false });
  PD.preset(C3, '链式反应', 'chainrx', {});
  PD.preset(C3, '受控链式反应', 'chainrx', { controlled: true, gens: 4 });
  PD.preset(C3, '核聚变', 'fusion', {});
  PD.preset(C3, '核反应堆', 'reactor', {});
  PD.preset(C3, '每核子结合能曲线', 'graph', { W: 380, H: 230, xmin: 0, xmax: 250, ymin: 0, ymax: 10, xstep: 50, ystep: 2, ticks: true, tlabels: true, xl: '核子数', yl: '每核子结合能 / \\rm{MeV}', ol: '0',
    poly: '2,1.11 3,2.57 4,7.07 6,5.33 7,5.61 9,6.46 12,7.68 14,7.48 16,7.98 20,8.03 28,8.45 40,8.55 56,8.79 62,8.79 90,8.71 120,8.5 138,8.39 160,8.13 180,8.0 208,7.87 238,7.57', cw: 1.8 });
  PD.preset(C3, '质能方程', 'text', { text: '\\Delta E = \\Delta m c^2', size: 22 });
  PD.preset(C3, '核聚变方程', 'text', { text: '\\nuc{2}{1}{H} + \\nuc{3}{1}{H} \\to \\nuc{4}{2}{He} + \\nuc{1}{0}{n}', size: 20 });
})();
