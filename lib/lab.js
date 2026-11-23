/* 实验器材（跨章节复用）+ 共享绘图辅助 PD.lab
   容器 · 漏斗 · 铁架台 · 三脚架 · 灯具 · 胶管 · 电子秤 · 秒表 · 指针压强计 · 针筒 */
(function () {
  'use strict';
  const f = PD.f, S = PD.strokeAttr, T = PD.tex;
  const CAT = '通用/实验器材';
  const L = (PD.lab = {});
  const pt = (L.pt = (x, y) => f(x) + ',' + f(y));
  const clamp = (L.clamp = (v, a, b) => Math.max(a, Math.min(b, v)));

  /* ================= 共享辅助 ================= */
  PD.rng = (seed) => {
    let s = Math.imul((+seed || 1) | 0, 2654435761) >>> 0 || 1;
    return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  };
  L.steps = (a, b, st) => {
    const r = []; st = +st; if (!(st > 0)) return r;
    const i0 = Math.ceil(a / st - 1e-9), i1 = Math.floor(b / st + 1e-9);
    if (i1 - i0 > 2000) return r;
    for (let i = i0; i <= i1; i++) r.push(+(i * st).toFixed(10));
    return r;
  };
  L.thin = (p, k = 0.7) => S(p, { sw: Math.max(0.6, (+p.sw || 1.5) * k), dash: 'solid' });

  // 双线管（玻璃管/胶管）：外层描边色 + 内层颜色；平头端点 = 开口
  L.tube = (d, tw, col, inner, sw) => {
    let s = `<path d="${d}" fill="none" stroke="${col}" stroke-width="${f(tw)}" stroke-linejoin="round"/>`;
    if (tw - 2 * sw > 0.5) s += `<path d="${d}" fill="none" stroke="${inner}" stroke-width="${f(tw - 2 * sw)}" stroke-linejoin="round"/>`;
    return s;
  };
  // 金属质感渐变（vertical=true 时沿 y 方向）
  L.metal = (ctx, base, a, b, vertical) => {
    const id = ctx.id + '-m' + (ctx.n = (ctx.n || 0) + 1);
    const c = vertical ? `x1="0" y1="${f(a)}" x2="0" y2="${f(b)}"` : `x1="${f(a)}" y1="0" x2="${f(b)}" y2="0"`;
    ctx.defs.push(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" ${c}><stop offset="0" stop-color="${PD.shade(base, -0.35)}"/><stop offset="0.3" stop-color="${PD.shade(base, 0.6)}"/><stop offset="0.65" stop-color="${base}"/><stop offset="1" stop-color="${PD.shade(base, -0.45)}"/></linearGradient>`);
    return `url(#${id})`;
  };
  L.paint = (p, ctx, base, a, b, vertical) => (p.shading ? L.metal(ctx, base, a, b, vertical) : base);

  // 火焰：kind = normal | blue(本生灯蓝焰) | lum(黄色发光焰)
  L.flame = (p, ctx, cx, yb, fw, fh, kind) => {
    const d = (w, h) => `M${pt(cx, yb)}C${pt(cx + w * 0.62, yb)} ${pt(cx + w * 0.5, yb - h * 0.5)} ${pt(cx, yb - h)}C${pt(cx - w * 0.5, yb - h * 0.5)} ${pt(cx - w * 0.62, yb)} ${pt(cx, yb)}Z`;
    if (p.fcolor === false) { const th = L.thin(p, 0.6); return `<path d="${d(fw, fh)}" fill="#ffffff" ${th}/><path d="${d(fw * 0.45, fh * 0.45)}" fill="none" ${th}/>`; }
    const id = ctx.id + '-fl' + (ctx.n = (ctx.n || 0) + 1);
    let outer, core, edge;
    if (kind === 'blue') { outer = ['#dbe9ff', '#86b4f2']; core = '#2f62d8'; edge = '#4a78c9'; }
    else if (kind === 'lum') { outer = ['#fff7b8', '#f6a21b']; core = null; edge = '#d9771b'; }
    else { outer = ['#fff8c8', '#f7a531']; core = '#7aa7e8'; edge = '#d9771b'; }
    ctx.defs.push(`<radialGradient id="${id}" cx="0.5" cy="0.72" r="0.65"><stop offset="0" stop-color="${outer[0]}"/><stop offset="1" stop-color="${outer[1]}"/></radialGradient>`);
    let s = `<path d="${d(fw, fh)}" fill="url(#${id})" stroke="${edge}" stroke-width="0.8"/>`;
    if (core) s += `<path d="${d(fw * 0.42, fh * (kind === 'blue' ? 0.5 : 0.36))}" fill="${core}" fill-opacity="0.75"/>`;
    return s;
  };

  // 冰块 / 碎冰 / 蒸汽 / 粒子
  L.cube = (p, x, y, sz, rot) =>
    `<g transform="translate(${pt(x, y)}) rotate(${f(rot)})"><rect x="${f(-sz / 2)}" y="${f(-sz / 2)}" width="${f(sz)}" height="${f(sz)}" rx="${f(sz * 0.18)}" fill="#e3f1fa" fill-opacity="0.92" ${L.thin(p, 0.6)}/><path d="M${pt(-sz * 0.26, sz * 0.12)}V${f(-sz * 0.26)}H${f(sz * 0.12)}" fill="none" stroke="#9cc3dd" stroke-width="1.1" stroke-linecap="round"/></g>`;
  L.crushed = (p, R, x0, x1, ytop, ybot, sz) => {
    let s = ''; const g = Math.max(4, sz * 0.62);
    for (let y = ybot - g * 0.4; y > ytop - g * 0.2; y -= g * 0.78)
      for (let x = x0 + g * 0.3 * R(); x < x1; x += g * (0.8 + 0.2 * R())) {
        const r = g * (0.42 + 0.18 * R()), k = 5 + Math.floor(R() * 2), a0 = R() * 6.28, q = [];
        for (let i = 0; i < k; i++) { const a = a0 + (6.283 * i) / k, rr = r * (0.75 + 0.35 * R()); q.push(pt(x + rr * Math.cos(a), y + rr * Math.sin(a))); }
        s += `<polygon points="${q.join(' ')}" fill="#e3f1fa" ${L.thin(p, 0.5)}/>`;
      }
    return s;
  };
  // 蒸汽：wisp=波浪缕 / cloud=水雾团；H、n 为 0 时按宽度自动
  L.steam = (p, xl, xr, yt, H, n, style, col) => {
    const W = Math.max(10, xr - xl);
    H = +H > 0 ? +H : clamp(W * 0.55, 35, 160);
    style = style || p.steamStyle || 'wisp'; col = col || p.steamC || '#5f6b78';
    const sw = Math.max(1.3, (+p.sw || 1.5) * 0.95) * clamp(W / 90, 1, 1.8);
    if (style === 'cloud') {
      const R = PD.rng((p.seed || 3) + 17), cs = [], m = clamp(Math.round(W / 22), 3, 9), rr = clamp(W / 7, 7, 26);
      for (let i = 0; i < m; i++) {
        const t = m > 1 ? i / (m - 1) : 0.5, x = xl + W * (0.12 + 0.76 * t) + (R() - 0.5) * rr * 0.6;
        cs.push([x, yt - rr * 0.9 - H * 0.25 * Math.sin(Math.PI * t) - R() * rr * 0.5, rr * (0.75 + 0.45 * R())]);
        if (R() < 0.6) cs.push([x + (R() - 0.5) * rr, yt - rr * 0.9 - H * (0.45 + 0.4 * R()) * Math.sin(Math.PI * t), rr * (0.55 + 0.35 * R())]);
      }
      let o = cs.map(([x, y, r]) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="none" stroke="${col}" stroke-width="${f(sw * 1.6)}"/>`).join('');
      o += cs.map(([x, y, r]) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#f4f6f8"/>`).join('');
      return `<g opacity="0.95">${o}</g>`;
    }
    n = +n > 0 ? Math.round(n) : clamp(Math.round(W / 30), 2, 6);
    let d = '';
    for (let i = 0; i < n; i++) {
      const x = xl + (W * (i + 0.5)) / n, h = H * (0.8 + 0.2 * (i % 2)), y = yt - 4 - (i % 2) * H * 0.1, k = h / 4, a = clamp(W / n, 10, 40) * 0.28;
      d += `M${pt(x, y)}c${pt(a, -k * 0.5)} ${pt(-a, -k * 1.5)} ${pt(0, -k * 2)}s${pt(a, -k * 1.5)} ${pt(0, -k * 2)}`;
    }
    return `<path d="${d}" fill="none" stroke="${col}" stroke-width="${f(sw)}" stroke-linecap="round"/>`;
  };
  L.particles = (p, R, n, r, bb, inside, col, arrows, alen) => {
    const pts = []; let tries = 0;
    while (pts.length < n && tries < n * 80) {
      tries++;
      const x = bb[0] + r + (bb[2] - bb[0] - 2 * r) * R(), y = bb[1] + r + (bb[3] - bb[1] - 2 * r) * R();
      if (!inside(x, y)) continue;
      if (pts.some((q) => (q[0] - x) ** 2 + (q[1] - y) ** 2 < (2.6 * r) ** 2)) continue;
      pts.push([x, y]);
    }
    let s = '';
    pts.forEach(([x, y]) => {
      s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${col}" ${L.thin(p, 0.45)}/>`;
      if (arrows) {
        const a = R() * 6.283, l = alen * (0.55 + 0.7 * R()), c = Math.cos(a), si = Math.sin(a), ah = Math.max(4, r * 1.5);
        const x1 = x + c * (r + 1.5), y1 = y + si * (r + 1.5), x2 = x1 + c * l, y2 = y1 + si * l;
        s += `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2 - c * ah * 0.6)}" y2="${f(y2 - si * ah * 0.6)}" ${L.thin(p, 0.6)}/>` + PD.arrowHead(x2, y2, a, ah, 'tri', p.stroke, 1);
      }
    });
    return s;
  };

  // 容器内容物：液体、横线纹、气泡、液面、碎冰、冰块、蒸汽
  // g = { clip(闭合内腔路径), x0, x1, ybot, ytop, open:[xl,xr,yt] }
  L.contents = (p, ctx, g) => {
    const cid = ctx.id + '-in' + (ctx.n = (ctx.n || 0) + 1);
    ctx.defs.push(`<clipPath id="${cid}"><path d="${g.clip}"/></clipPath>`);
    const R = PD.rng(p.seed || 3), lv = clamp(+p.level || 0, 0, 1), W = g.x1 - g.x0, ys = g.ybot + (g.ytop - g.ybot) * lv;
    let s = '';
    if (p.shading) s += `<path d="${g.clip}" fill="#edf3f9"/>`;
    if (lv > 0) {
      s += `<rect x="${f(g.x0 - 5)}" y="${f(ys)}" width="${f(W + 10)}" height="${f(g.ybot - ys + 8)}" fill="${p.liq || '#8fc3ea'}" fill-opacity="${p.lop ?? 0.55}"/>`;
      if (p.liqLines) {
        let d = ''; const gp = 7;
        for (let y = ys + gp, r = 0; y < g.ybot - 1; y += gp, r++) for (let x = g.x0 + (r % 2) * 7; x < g.x1; x += 14) d += `M${pt(x, y)}h7`;
        s += `<path d="${d}" fill="none" ${L.thin(p, 0.45)}/>`;
      }
      if (p.boil) {
        const n = clamp(Math.round((W * (g.ybot - ys)) / 260), 4, 70);
        for (let i = 0; i < n; i++) {
          const t = R(), r = 1.2 + 3.6 * (1 - t) * (0.5 + 0.5 * R());
          const x = g.x0 + 4 + (W - 8) * R(), y = ys + r + 1 + Math.max(0, g.ybot - ys - 2 * r - 2) * t;
          s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#ffffff" fill-opacity="0.75" ${L.thin(p, 0.45)}/>`;
        }
      }
      s += `<line x1="${f(g.x0 - 5)}" y1="${f(ys)}" x2="${f(g.x1 + 5)}" y2="${f(ys)}" ${L.thin(p, 0.7)}/>`;
    }
    if (+p.crush > 0) s += L.crushed(p, R, g.x0, g.x1, g.ybot + (g.ytop - g.ybot) * clamp(+p.crush, 0, 1), g.ybot, +p.iceSize || 16);
    const n = Math.round(+p.ice || 0);
    if (n > 0) {
      const sz = +p.iceSize || 16, per = Math.max(1, Math.floor((W - 4) / (sz * 1.08)));
      for (let i = 0; i < n; i++) {
        const row = Math.floor(i / per), col = i % per, inRow = Math.min(per, n - row * per);
        const x = g.x0 + (W - inRow * sz * 1.08) / 2 + (col + 0.5) * sz * 1.08 + (R() - 0.5) * sz * 0.15;
        const y = lv > 0 ? ys + sz * 0.32 + row * sz * 0.95 : g.ybot - sz * 0.55 - row * sz * 0.95;
        s += L.cube(p, x, y, sz, (R() - 0.5) * 36);
      }
    }
    let top = '';
    if (p.steam && g.open && (!p.stopper || p.stopper === 'none') && !p.lid) top = L.steam(p, g.open[0], g.open[1], g.open[2], +p.steamH, 0);
    return { inner: `<g clip-path="url(#${cid})">${s}</g>`, top, ys };
  };

  // 刻度
  L.grad = (p, ctx, x, ybot, ytop) => {
    const n = Math.max(1, Math.round(+p.gradN || 5)), H = (ybot - ytop) * 0.85; let d = '', s = '';
    for (let k = 1; k <= n * 2; k++) {
      const y = ybot - (H * k) / (2 * n), maj = k % 2 === 0;
      d += `M${pt(x, y)}h${f(maj ? 10 : 5)}`;
      if (maj && +p.gradMax > 0) s += T(ctx, PD.fmt((p.gradMax * k) / (2 * n)), x + 13, y, { size: 9, anchor: 'start', italic: false, color: p.stroke });
    }
    return `<path d="${d}" fill="none" ${L.thin(p, 0.5)}/>` + s;
  };

  // 塞子（木塞/橡胶塞）+ 导管
  L.stopper = (p, ctx, ow, yt) => {
    if (!p.stopper || p.stopper === 'none') return '';
    const sh = clamp(ow * 0.75, 10, 28), wb = ow * 0.94, wt = ow * 1.14, y0 = yt - sh * 0.38, y1 = yt + sh * 0.62;
    const cork = p.stopper === 'cork';
    let s = `<path d="M${pt(-wt / 2, y0)}L${pt(wt / 2, y0)}L${pt(wb / 2, y1)}L${pt(-wb / 2, y1)}Z" fill="${cork ? '#caa66e' : '#5d5d5d'}" ${S(p, { dash: 'solid' })}/>`;
    if (cork) {
      const R = PD.rng(11);
      for (let i = 0; i < Math.round(ow * 0.7); i++) {
        const t = R(), yy = y0 + 2 + (y1 - y0 - 4) * t, hw = (wt + (wb - wt) * t) / 2 - 2;
        s += `<circle cx="${f((R() * 2 - 1) * hw)}" cy="${f(yy)}" r="0.8" fill="#8a6a3a"/>`;
      }
    }
    const n = clamp(Math.round(+p.tubes || 0), 0, 2), tw = clamp(ow * 0.2, 4, 8), xs = n === 1 ? [0] : [-ow * 0.24, ow * 0.24];
    for (let i = 0; i < n; i++) {
      const x = xs[i], yb = y1 + (+p.tubeIn || 0), yu = y0 - (+p.tubeUp || 0), out = i === n - 1 ? +p.tubeOut || 0 : 0, sg = Math.sign(out);
      const d = out ? `M${pt(x, yb)}L${pt(x, yu + 8)}Q${pt(x, yu)} ${pt(x + 8 * sg, yu)}L${pt(x + out, yu)}` : `M${pt(x, yb)}L${pt(x, yu)}`;
      s += L.tube(d, tw, p.stroke, '#ffffff', Math.max(1, p.sw * 0.8));
    }
    return s;
  };

  /* ================= 容器 ================= */
  const SHAPES = [['beaker', '烧杯'], ['conical', '锥形瓶'], ['round', '圆底烧瓶'], ['flat', '平底烧瓶'], ['testtube', '试管/沸腾管'], ['cylinder', '量筒'],
    ['foamcup', '发泡胶杯'], ['tumbler', '玻璃杯'], ['mug', '马克杯'], ['pot', '锅'], ['trough', '水槽']];
  const NECK = { conical: 1, round: 1, flat: 1 }, STOP = { beaker: 1, conical: 1, round: 1, flat: 1, testtube: 1, cylinder: 1 };
  const side = (w, r) => `L${pt(-w / 2, -r)}Q${pt(-w / 2, 0)} ${pt(-w / 2 + r, 0)}L${pt(w / 2 - r, 0)}Q${pt(w / 2, 0)} ${pt(w / 2, -r)}`;

  function geo(p, ctx) {
    const w = +p.w, h = +p.h, nw = Math.min(+p.neck || 30, w * 0.9);
    const base = { x0: -w / 2, x1: w / 2, ybot: 0, ytop: -h, ow: w };
    const open = (b) => Object.assign({}, base, b);
    switch (p.shape) {
      case 'conical': {
        const r = Math.min(8, w * 0.08), nh = h * 0.28;
        const body = `L${pt(-nw / 2, -h + nh)}L${pt(-w / 2 + r * 0.5, -r)}Q${pt(-w / 2, 0)} ${pt(-w / 2 + r, 0)}L${pt(w / 2 - r, 0)}Q${pt(w / 2, 0)} ${pt(w / 2 - r * 0.5, -r)}L${pt(nw / 2, -h + nh)}`;
        return open({ out: `M${pt(-nw / 2 - 3, -h)}L${pt(-nw / 2, -h + 3)}${body}L${pt(nw / 2, -h + 3)}L${pt(nw / 2 + 3, -h)}`, clip: `M${pt(-nw / 2, -h)}${body}L${pt(nw / 2, -h)}Z`, ow: nw, gx: -w * 0.18 });
      }
      case 'round': case 'flat': {
        const R = w / 2, dx = nw / 2;
        let cy, body;
        if (p.shape === 'round') { cy = -R; }
        else { cy = -(R - R * 0.12); }
        const yj = cy - Math.sqrt(Math.max(0, R * R - dx * dx)), top = Math.min(-h, yj - 6);
        if (p.shape === 'round') body = `L${pt(-dx, yj)}A${f(R)},${f(R)} 0 1 0 ${pt(dx, yj)}`;
        else { const bx = Math.sqrt(R * R - cy * cy); body = `L${pt(-dx, yj)}A${f(R)},${f(R)} 0 0 0 ${pt(-bx, 0)}L${pt(bx, 0)}A${f(R)},${f(R)} 0 0 0 ${pt(dx, yj)}`; }
        return open({ out: `M${pt(-dx - 3, top)}L${pt(-dx, top + 3)}${body}L${pt(dx, top + 3)}L${pt(dx + 3, top)}`, clip: `M${pt(-dx, top)}${body}L${pt(dx, top)}Z`, ytop: top, ow: nw, gx: -R * 0.3 });
      }
      case 'testtube': {
        const a = w / 2, body = `L${pt(-a, -a)}A${f(a)},${f(a)} 0 0 0 ${pt(a, -a)}`;
        return open({ out: `M${pt(-a - 2.5, -h)}Q${pt(-a, -h)} ${pt(-a, -h + 3)}${body}L${pt(a, -h + 3)}Q${pt(a, -h)} ${pt(a + 2.5, -h)}`, clip: `M${pt(-a, -h)}${body}L${pt(a, -h)}Z`, gx: -a + 2 });
      }
      case 'cylinder': {
        const fh = 8, fw = w * 1.9, a = w / 2;
        return open({ out: `M${pt(-a - 4, -h - 2)}Q${pt(-a, -h)} ${pt(-a, -h + 4)}L${pt(-a, -fh)}L${pt(a, -fh)}L${pt(a, -h)}`, clip: `M${pt(-a, -h)}L${pt(-a, -fh)}L${pt(a, -fh)}L${pt(a, -h)}Z`, ybot: -fh, gx: -a + 2,
          deco: `<path d="M${pt(-fw / 2, 0)}L${pt(fw / 2, 0)}L${pt(fw / 2 - 5, -fh)}L${pt(-fw / 2 + 5, -fh)}Z" fill="#ffffff" ${S(p, { dash: 'solid' })}/>` });
      }
      case 'foamcup': {
        const t = 6, wb = w * 0.72, k = (((w - wb) / 2) * t) / h;
        const wall = `M${pt(-w / 2, -h)}L${pt(-wb / 2, 0)}L${pt(wb / 2, 0)}L${pt(w / 2, -h)}L${pt(w / 2 - t, -h)}L${pt(wb / 2 - t + k, -t)}L${pt(-wb / 2 + t - k, -t)}L${pt(-w / 2 + t, -h)}Z`;
        return open({ out: '', clip: `M${pt(-w / 2 + t, -h)}L${pt(-wb / 2 + t - k, -t)}L${pt(wb / 2 - t + k, -t)}L${pt(w / 2 - t, -h)}Z`, x0: -w / 2 + t, x1: w / 2 - t, ybot: -t, ow: w - 2 * t,
          deco: `<path d="${wall}" fill="#ffffff"/><path d="${wall}" ${PD.fillAttr({ fillMode: 'dots', fill: '#9a9a9a' }, ctx)} ${S(p, { dash: 'solid' })}/>`, lid: 'flat' });
      }
      case 'tumbler': {
        const wb = w * 0.8, t = 7, k = (((w - wb) / 2) * t) / h;
        return open({ out: `M${pt(-w / 2, -h)}L${pt(-wb / 2, 0)}L${pt(wb / 2, 0)}L${pt(w / 2, -h)}`, clip: `M${pt(-w / 2, -h)}L${pt(-wb / 2 - k, -t)}L${pt(wb / 2 + k, -t)}L${pt(w / 2, -h)}Z`, ybot: -t,
          deco: `<line x1="${f(-wb / 2 - k)}" y1="${f(-t)}" x2="${f(wb / 2 + k)}" y2="${f(-t)}" ${L.thin(p, 0.7)}/>` });
      }
      case 'mug': {
        const body = side(w, Math.min(10, w * 0.12));
        const hd = `M${pt(w / 2, -h * 0.8)}C${pt(w / 2 + h * 0.45, -h * 0.82)} ${pt(w / 2 + h * 0.45, -h * 0.2)} ${pt(w / 2, -h * 0.24)}`;
        return open({ out: `M${pt(-w / 2, -h)}${body}L${pt(w / 2, -h)}`, clip: `M${pt(-w / 2, -h)}${body}L${pt(w / 2, -h)}Z`, deco: L.tube(hd, 9, p.stroke, '#ffffff', Math.max(1, p.sw)) });
      }
      case 'pot': {
        const body = side(w, 6), thick = S(p, { dash: 'solid', sw: p.sw * 1.6 });
        let deco = p.handle === 'long'
          ? L.tube(`M${pt(w / 2, -h * 0.82)}L${pt(w / 2 + w * 0.75, -h * 1.02)}`, 10, p.stroke, '#666666', Math.max(1, p.sw))
          : `<path d="M${pt(-w / 2, -h * 0.85)}h-16v12h16M${pt(w / 2, -h * 0.85)}h16v12h-16" fill="none" ${thick}/>`;
        deco += `<path d="M${pt(-w / 2 - 3, -h)}H${f(w / 2 + 3)}" ${thick}/>`;
        return open({ out: `M${pt(-w / 2, -h)}${body}L${pt(w / 2, -h)}`, clip: `M${pt(-w / 2, -h)}${body}L${pt(w / 2, -h)}Z`, deco, lid: 'dome' });
      }
      case 'trough': {
        const body = side(w, 4);
        return open({ out: `M${pt(-w / 2, -h)}${body}L${pt(w / 2, -h)}`, clip: `M${pt(-w / 2, -h)}${body}L${pt(w / 2, -h)}Z` });
      }
      default: {
        const body = side(w, Math.min(8, w * 0.08));
        return open({ out: `M${pt(-w / 2 - 6, -h - 3)}Q${pt(-w / 2, -h - 2)} ${pt(-w / 2, -h + 5)}${body}L${pt(w / 2, -h)}`, clip: `M${pt(-w / 2, -h)}${body}L${pt(w / 2, -h)}Z`, gx: -w * 0.35 });
      }
    }
  }
  function lid(p, g, kind) {
    const w = +p.w, h = +p.h;
    if (kind === 'flat') return `<rect x="${f(-w / 2 - 3)}" y="${f(-h - 6)}" width="${f(w + 6)}" height="6" rx="2" fill="#ffffff" ${S(p, { dash: 'solid' })}/><line x1="${f(-w / 2 - 1)}" y1="${f(-h - 3)}" x2="${f(w / 2 + 1)}" y2="${f(-h - 3)}" stroke="#9a9a9a" stroke-width="2" stroke-dasharray="0.01 3" stroke-linecap="round"/>`;
    const ap = -h - h * 0.16;
    return `<path d="M${pt(-w / 2 - 4, -h)}Q${pt(0, -h - h * 0.32)} ${pt(w / 2 + 4, -h)}Z" fill="#ffffff" ${S(p, { dash: 'solid' })}/><rect x="-8" y="${f(ap - 8)}" width="16" height="9" rx="3" fill="#777777" ${S(p, { dash: 'solid' })}/>`;
  }

  PD.register({
    type: 'vessel', name: '容器(烧杯/烧瓶/试管/杯/锅…)',
    defaults: { shape: 'beaker', w: 100, h: 120, neck: 30, level: 0.6, liq: '#8fc3ea', lop: 0.55, liqLines: false, boil: false, steam: false, steamH: 0, steamStyle: 'wisp', steamC: '#5f6b78',
      ice: 0, crush: 0, iceSize: 18, grad: false, gradN: 5, gradMax: 0, stopper: 'none', tubes: 0, tubeUp: 40, tubeIn: 30, tubeOut: 0, lid: false, handle: 'two', shading: false, seed: 3 },
    handles: [['w', 'h', 0.5, -1]],
    fields: [
      { k: 'shape', t: 'sel', l: '形状', o: SHAPES, rebuild: true },
      { k: 'w', t: 'num', l: '宽' }, { k: 'h', t: 'num', l: '高' }, { k: 'neck', t: 'num', l: '瓶颈宽', when: (p) => NECK[p.shape] },
      { k: 'level', t: 'range', l: '液面高度', min: 0, max: 1, step: 0.02 },
      { k: 'liq', t: 'color', l: '液体颜色' }, { k: 'lop', t: 'range', l: '液体浓淡', min: 0, max: 1, step: 0.05 },
      { k: 'liqLines', t: 'bool', l: '液体横线纹(黑白印刷)' }, { k: 'boil', t: 'bool', l: '沸腾(气泡)' },
      { k: 'steam', t: 'bool', l: '蒸汽' }, { k: 'steamStyle', t: 'sel', l: '蒸汽样式', o: [['wisp', '波浪缕'], ['cloud', '水雾团']], when: (p) => p.steam },
      { k: 'steamH', t: 'num', l: '蒸汽高度(0=自动)', when: (p) => p.steam }, { k: 'steamC', t: 'color', l: '蒸汽颜色', when: (p) => p.steam },
      { k: 'ice', t: 'num', l: '冰块数量', min: 0 }, { k: 'crush', t: 'range', l: '碎冰高度', min: 0, max: 1, step: 0.05 }, { k: 'iceSize', t: 'num', l: '冰块大小' },
      { k: 'grad', t: 'bool', l: '刻度' }, { k: 'gradN', t: 'num', l: '主刻度数', when: (p) => p.grad }, { k: 'gradMax', t: 'num', l: '最大读数(0=不标)', when: (p) => p.grad },
      { k: 'stopper', t: 'sel', l: '塞子', o: [['none', '无'], ['cork', '木塞'], ['rubber', '橡胶塞']], when: (p) => STOP[p.shape] },
      { k: 'tubes', t: 'num', l: '导管数(0-2)', min: 0, when: (p) => STOP[p.shape] && p.stopper !== 'none' },
      { k: 'tubeUp', t: 'num', l: '导管伸出(上)', when: (p) => STOP[p.shape] && p.stopper !== 'none' && p.tubes > 0 },
      { k: 'tubeIn', t: 'num', l: '导管伸入(下)', when: (p) => STOP[p.shape] && p.stopper !== 'none' && p.tubes > 0 },
      { k: 'tubeOut', t: 'num', l: '导管弯出(负=向左)', when: (p) => STOP[p.shape] && p.stopper !== 'none' && p.tubes > 0 },
      { k: 'lid', t: 'bool', l: '盖子', when: (p) => p.shape === 'foamcup' || p.shape === 'pot' },
      { k: 'handle', t: 'sel', l: '把手', o: [['two', '双耳'], ['long', '长柄']], when: (p) => p.shape === 'pot' },
      { k: 'shading', t: 'bool', l: '玻璃质感' }, { k: 'seed', t: 'num', l: '随机排布(换个数字)' },
    ],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p0, ctx) {
      const g = geo(p0, ctx);
      const p = Object.assign({}, p0, { stopper: STOP[p0.shape] ? p0.stopper : 'none', lid: g.lid ? p0.lid : false });
      g.open = [-g.ow / 2, g.ow / 2, g.ytop];
      const c = L.contents(p, ctx, g);
      let s = c.inner;
      if (g.out) s += `<path d="${g.out}" fill="none" ${S(p)}/>`;
      if (g.deco) s += g.deco;
      if (p.shading && g.out) { const W = g.x1 - g.x0, hx = g.x0 + W * 0.14; s += `<path d="M${pt(hx, g.ybot + (g.ytop - g.ybot) * 0.18)}V${f(g.ybot + (g.ytop - g.ybot) * 0.62)}" stroke="#ffffff" stroke-width="3.5" stroke-opacity="0.9" stroke-linecap="round"/>`; }
      if (p.grad && g.out) s += L.grad(p, ctx, g.gx ?? g.x0 + 3, g.ybot, g.ytop);
      if (STOP[p.shape]) s += L.stopper(p, ctx, g.ow, g.ytop);
      if (g.lid && p.lid) s += lid(p, g, g.lid);
      return s + c.top;
    },
  });

  /* ================= 漏斗 ================= */
  PD.register({
    type: 'funnel', name: '漏斗',
    defaults: { w: 110, ch: 75, sl: 60, stem: 9, level: 0, crush: 0.85, iceSize: 16, drips: 2, liq: '#8fc3ea', lop: 0.55, seed: 5 },
    fields: [
      { k: 'w', t: 'num', l: '口径' }, { k: 'ch', t: 'num', l: '锥高' }, { k: 'sl', t: 'num', l: '颈长' }, { k: 'stem', t: 'num', l: '颈宽' },
      { k: 'crush', t: 'range', l: '碎冰高度', min: 0, max: 1, step: 0.05 }, { k: 'iceSize', t: 'num', l: '碎冰大小' },
      { k: 'level', t: 'range', l: '液面高度', min: 0, max: 1, step: 0.02 }, { k: 'drips', t: 'num', l: '下方水滴数', min: 0 },
      { k: 'liq', t: 'color', l: '液体/水滴颜色' }, { k: 'seed', t: 'num', l: '随机排布' },
    ],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const w = +p.w, ch = +p.ch, sl = +p.sl, s = +p.stem;
      const clip = `M${pt(-w / 2, 0)}L${pt(-s / 2, ch)}L${pt(-s / 2, ch + sl)}L${pt(s / 2, ch + sl + 5)}L${pt(s / 2, ch)}L${pt(w / 2, 0)}Z`;
      const c = L.contents(Object.assign({}, p, { steam: false, ice: 0 }), ctx, { clip, x0: -w / 2, x1: w / 2, ybot: ch, ytop: 0 });
      let o = c.inner + `<path d="M${pt(-w / 2 - 3, -2)}L${pt(-w / 2, 0)}L${pt(-s / 2, ch)}L${pt(-s / 2, ch + sl)}M${pt(w / 2 + 3, -2)}L${pt(w / 2, 0)}L${pt(s / 2, ch)}L${pt(s / 2, ch + sl + 5)}" fill="none" ${S(p)}/>`;
      for (let i = 0; i < Math.round(+p.drips || 0); i++) {
        const y = ch + sl + 16 + i * 18;
        o += `<path d="M${pt(0, y - 5)}C${pt(3, y - 1)} ${pt(4, y + 3)} ${pt(0, y + 4)}C${pt(-4, y + 3)} ${pt(-3, y - 1)} ${pt(0, y - 5)}Z" fill="${p.liq}" ${L.thin(p, 0.5)}/>`;
      }
      return o;
    },
  });

  /* ================= 铁架台 ================= */
  PD.register({
    type: 'stand', name: '铁架台(夹子/铁圈)',
    defaults: { w: 150, H: 280, rodX: -45, rw: 7, clamps: '200,100,24,clamp', fill: '#6b6b6b', shading: false },
    handles: [['zero', 'H', 1, -1]],
    fields: [
      { k: 'w', t: 'num', l: '底座宽' }, { k: 'H', t: 'num', l: '铁杆高' }, { k: 'rodX', t: 'num', l: '铁杆位置' }, { k: 'rw', t: 'num', l: '铁杆粗' },
      { k: 'clamps', t: 'area', l: '夹具(每行一个)', ph: '高度, 臂长, 开口, 类型\n类型: clamp(夹子) / ring(铁圈)\n例: 200,100,24,clamp\n例: 150,100,80,ring' },
      { k: 'fill', t: 'color', l: '底座颜色' }, { k: 'shading', t: 'bool', l: '金属质感' },
    ],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const w = +p.w, H = +p.H, rx = +p.rodX, rw = +p.rw, bh = 12, sd = S(p, { dash: 'solid' }), th = L.thin(p, 0.7);
      let o = `<rect x="${f(rx - rw / 2)}" y="${f(-H)}" width="${f(rw)}" height="${f(H - bh)}" rx="2" fill="${L.paint(p, ctx, '#d0d0d0', rx - rw / 2, rx + rw / 2)}" ${sd}/>`;
      o += `<rect x="${f(-w / 2)}" y="${f(-bh)}" width="${f(w)}" height="${f(bh)}" rx="2" fill="${L.paint(p, ctx, p.fill, -bh, 0, true)}" ${sd}/>`;
      PD.lines(p.clamps).forEach((line) => {
        const a = line.split(',').map((x) => x.trim()), ch = parseFloat(a[0]);
        if (!isFinite(ch)) return;
        const len = +a[1] || 100, jw = +a[2] || 24, ring = (a[3] || '').toLowerCase().startsWith('r'), y = -ch, xe = rx + len;
        const armEnd = ring ? xe - jw / 2 : xe - jw / 2 - 5;
        o += `<rect x="${f(rx)}" y="${f(y - 2.5)}" width="${f(Math.max(0, armEnd - rx))}" height="5" fill="#bdbdbd" ${th}/>`;
        o += `<line x1="${f(rx - 9)}" y1="${f(y)}" x2="${f(rx - 15)}" y2="${f(y)}" ${S(p, { dash: 'solid', sw: 2 })}/><circle cx="${f(rx - 17)}" cy="${f(y)}" r="3" fill="#4d4d4d" ${th}/>`;
        o += `<rect x="${f(rx - 9)}" y="${f(y - 8)}" width="18" height="16" rx="2" fill="#4d4d4d" ${sd}/>`;
        if (ring) o += `<ellipse cx="${f(xe)}" cy="${f(y)}" rx="${f(jw / 2)}" ry="${f(Math.max(3, jw * 0.13))}" fill="none" stroke="${p.stroke}" stroke-width="${f(p.sw * 2.2)}"/>`;
        else {
          const jl = xe - jw / 2, jr = xe + jw / 2, jaw = S(p, { dash: 'solid', sw: 3.2 });
          o += `<path d="M${pt(jl - 3, y - 12)}Q${pt(jl - 10, y)} ${pt(jl - 3, y + 12)}M${pt(jr + 3, y - 12)}Q${pt(jr + 10, y)} ${pt(jr + 3, y + 12)}" fill="none" ${jaw}/>`;
          o += `<path d="M${pt(jl - 6, y - 12)}H${f(jr + 6)}" fill="none" ${S(p, { dash: 'solid', sw: 1.6 })}/>`;
          o += `<line x1="${f(jr + 6)}" y1="${f(y)}" x2="${f(jr + 13)}" y2="${f(y)}" ${S(p, { dash: 'solid', sw: 2 })}/><circle cx="${f(jr + 15)}" cy="${f(y)}" r="2.8" fill="#4d4d4d" ${th}/>`;
        }
      });
      return o;
    },
  });

  /* ================= 三脚架 ================= */
  PD.register({
    type: 'tripod', name: '三脚架(铁丝网)',
    defaults: { w: 120, H: 115, gauze: true },
    fields: [{ k: 'w', t: 'num', l: '宽' }, { k: 'H', t: 'num', l: '高' }, { k: 'gauze', t: 'bool', l: '铁丝网' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const w = +p.w, H = +p.H, y0 = p.gauze ? 4 : 0, sd = S(p, { dash: 'solid' });
      let o = `<path d="M${pt(w * 0.12, y0 + 5)}L${pt(w * 0.12, y0 + H * 0.92)}" stroke="#8a8a8a" stroke-width="${f(p.sw * 1.6)}" stroke-linecap="round"/>`;
      o += `<path d="M${pt(-w / 2 + 6, y0 + 5)}L${pt(-w / 2 - 8, y0 + H)}M${pt(w / 2 - 6, y0 + 5)}L${pt(w / 2 + 8, y0 + H)}" fill="none" ${S(p, { dash: 'solid', sw: p.sw * 2.2 })}/>`;
      o += `<rect x="${f(-w / 2 - 3)}" y="${f(y0)}" width="${f(w + 6)}" height="5" fill="#555555" ${sd}/>`;
      if (p.gauze) o += `<rect x="${f(-w / 2 - 10)}" y="0" width="${f(w + 20)}" height="4" ${PD.fillAttr({ fillMode: 'cross', fill: '#555555' }, ctx)} ${L.thin(p, 0.6)}/><rect x="${f(-w * 0.22)}" y="-0.5" width="${f(w * 0.44)}" height="5" rx="1" fill="#bdbdbd" ${L.thin(p, 0.5)}/>`;
      return o;
    },
  });

  /* ================= 灯具：蜡烛 / 酒精灯 / 本生灯 ================= */
  PD.register({
    type: 'burner', name: '灯具(蜡烛/酒精灯/本生灯)',
    defaults: { style: 'bunsen', w: 70, h: 75, flame: true, fs: 40, air: true, fcolor: true, level: 0.55, liq: '#d7ecf7', lop: 0.7 },
    fields: [
      { k: 'style', t: 'sel', l: '类型', o: [['candle', '蜡烛'], ['spirit', '酒精灯'], ['bunsen', '本生灯']], rebuild: true },
      { k: 'w', t: 'num', l: '宽' }, { k: 'h', t: 'num', l: '高' },
      { k: 'flame', t: 'bool', l: '点燃' }, { k: 'fs', t: 'num', l: '火焰大小' }, { k: 'fcolor', t: 'bool', l: '彩色火焰(关=黑白线稿)' },
      { k: 'air', t: 'bool', l: '空气孔打开(蓝焰)', when: (p) => p.style === 'bunsen' },
      { k: 'level', t: 'range', l: '酒精量', min: 0, max: 1, step: 0.05, when: (p) => p.style === 'spirit' },
    ],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const w = +p.w, h = +p.h, fs = +p.fs, sd = S(p, { dash: 'solid' });
      let o = '';
      if (p.style === 'candle') {
        o += `<rect x="${f(-w / 2)}" y="${f(-h)}" width="${f(w)}" height="${f(h)}" rx="2" fill="#f6f1e1" ${sd}/>`;
        o += `<path d="M${pt(0, -h)}q2,-5 0,-9" fill="none" stroke="#333333" stroke-width="1.6"/>`;
        if (p.flame) o += L.flame(p, ctx, 0, -h - 5, fs * 0.42, fs, 'normal');
      } else if (p.style === 'spirit') {
        const body = `M${pt(-w * 0.18, -h)}L${pt(-w * 0.18, -h * 0.88)}C${pt(-w / 2, -h * 0.8)} ${pt(-w / 2, -h * 0.35)} ${pt(-w * 0.45, -h * 0.1)}Q${pt(-w * 0.44, 0)} ${pt(-w * 0.36, 0)}L${pt(w * 0.36, 0)}Q${pt(w * 0.44, 0)} ${pt(w * 0.45, -h * 0.1)}C${pt(w / 2, -h * 0.35)} ${pt(w / 2, -h * 0.8)} ${pt(w * 0.18, -h * 0.88)}L${pt(w * 0.18, -h)}Z`;
        const c = L.contents(Object.assign({}, p, { steam: false }), ctx, { clip: body, x0: -w / 2, x1: w / 2, ybot: 0, ytop: -h * 0.88 });
        o += `<path d="${body}" fill="#ffffff"/>` + c.inner + `<path d="${body}" fill="none" ${sd}/>`;
        o += `<rect x="${f(-w * 0.14)}" y="${f(-h - 8)}" width="${f(w * 0.28)}" height="9" rx="1.5" fill="#a9a9a9" ${sd}/>`;
        o += `<rect x="-2.5" y="${f(-h - 15)}" width="5" height="8" fill="#eeeeee" ${L.thin(p, 0.6)}/>`;
        if (p.flame) o += L.flame(p, ctx, 0, -h - 13, fs * 0.45, fs, 'normal');
      } else {
        const bw = 14, H = h;
        o += `<rect x="${f(-w * 0.45)}" y="-22" width="${f(w * 0.45 - bw / 2)}" height="7" fill="#c9c9c9" ${L.thin(p, 0.8)}/>`;
        o += `<rect x="${f(-bw / 2)}" y="${f(-10 - H)}" width="${f(bw)}" height="${f(H)}" fill="${L.paint(p, ctx, '#cfcfcf', -bw / 2, bw / 2)}" ${sd}/>`;
        o += `<rect x="-9" y="-40" width="18" height="16" rx="1.5" fill="#9a9a9a" ${sd}/>`;
        o += `<rect x="-4" y="-36" width="8" height="8" fill="${p.air ? '#ffffff' : '#555555'}" ${L.thin(p, 0.6)}/>`;
        o += `<path d="M${pt(-w / 2, 0)}L${pt(w / 2, 0)}L${pt(w * 0.35, -10)}L${pt(-w * 0.35, -10)}Z" fill="#7a7a7a" ${sd}/>`;
        if (p.flame) o += p.air ? L.flame(p, ctx, 0, -10 - H, 16, fs, 'blue') : L.flame(p, ctx, 0, -10 - H, 24, fs * 1.4, 'lum');
      }
      return o;
    },
  });

  /* ================= 胶管 / 玻璃导管 ================= */
  PD.register({
    type: 'hose', name: '胶管/玻璃导管',
    defaults: { c1x: 40, c1y: 70, c2x: 120, c2y: 70, x2: 160, y2: 0, tw: 10, kind: 'rubber', hc: '#8c8c8c' },
    handles: [['c1x', 'c1y'], ['c2x', 'c2y'], ['x2', 'y2']], originHandle: true, handleLines: [['o', 0], [1, 2]],
    fields: [
      { k: 'kind', t: 'sel', l: '类型', o: [['rubber', '胶管'], ['glass', '玻璃管']] }, { k: 'tw', t: 'num', l: '管径' }, { k: 'hc', t: 'color', l: '胶管颜色' },
      { k: 'c1x', t: 'num', l: '控制点1 x' }, { k: 'c1y', t: 'num', l: '控制点1 y' }, { k: 'c2x', t: 'num', l: '控制点2 x' }, { k: 'c2y', t: 'num', l: '控制点2 y' },
      { k: 'x2', t: 'num', l: '终点 x' }, { k: 'y2', t: 'num', l: '终点 y' },
    ],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p) {
      const d = `M0,0C${pt(p.c1x, p.c1y)} ${pt(p.c2x, p.c2y)} ${pt(p.x2, p.y2)}`;
      return L.tube(d, +p.tw, p.stroke, p.kind === 'glass' ? '#ffffff' : p.hc, Math.max(1, +p.sw || 1.5));
    },
  });

  /* ================= 电子秤 ================= */
  PD.register({
    type: 'balance', name: '电子秤',
    defaults: { w: 150, bh: 42, reading: '250.0 g', fill: '#e4e6e9', shading: false },
    fields: [{ k: 'w', t: 'num', l: '宽' }, { k: 'bh', t: 'num', l: '机身高' }, { k: 'reading', t: 'text', l: '读数' }, { k: 'fill', t: 'color', l: '机身颜色' }, { k: 'shading', t: 'bool', l: '质感' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const w = +p.w, bh = +p.bh, pw = w * 0.78, sd = S(p, { dash: 'solid' }), y = 12;
      let o = `<rect x="-8" y="5" width="16" height="7" fill="#777777" ${L.thin(p, 0.7)}/>`;
      o += `<rect x="${f(-pw / 2)}" y="0" width="${f(pw)}" height="5" rx="1.5" fill="${L.paint(p, ctx, '#c9ced4', 0, 5, true)}" ${sd}/>`;
      o += `<path d="M${pt(-w * 0.46, y)}L${pt(w * 0.46, y)}L${pt(w / 2, y + bh)}L${pt(-w / 2, y + bh)}Z" fill="${L.paint(p, ctx, p.fill, y, y + bh, true)}" ${sd}/>`;
      o += `<rect x="${f(-w * 0.3)}" y="${f(y + bh * 0.25)}" width="${f(w * 0.42)}" height="${f(bh * 0.5)}" rx="2" fill="#dfe9d4" ${L.thin(p, 0.7)}/>`;
      o += T(ctx, p.reading, w * 0.12 - 5, y + bh * 0.5, { size: bh * 0.3, anchor: 'end', italic: false, color: '#111111' });
      o += `<circle cx="${f(w * 0.24)}" cy="${f(y + bh * 0.5)}" r="${f(bh * 0.1)}" fill="#888888" ${L.thin(p, 0.5)}/><circle cx="${f(w * 0.36)}" cy="${f(y + bh * 0.5)}" r="${f(bh * 0.1)}" fill="#888888" ${L.thin(p, 0.5)}/>`;
      return o;
    },
  });

  /* ================= 秒表 ================= */
  PD.register({
    type: 'stopwatch', name: '秒表',
    defaults: { r: 30, sec: 20, nums: false },
    fields: [{ k: 'r', t: 'num', l: '半径' }, { k: 'sec', t: 'num', l: '指针(秒)' }, { k: 'nums', t: 'bool', l: '显示数字' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const r = +p.r, sd = S(p, { dash: 'solid' });
      let o = `<rect x="-4" y="${f(-r - 9)}" width="8" height="8" fill="#777777" ${L.thin(p, 0.7)}/><circle cx="0" cy="${f(-r - 13)}" r="4" fill="none" ${L.thin(p, 0.9)}/>`;
      o += `<circle r="${f(r)}" fill="#ffffff" ${S(p, { dash: 'solid', sw: p.sw * 1.4 })}/>`;
      let d = '';
      for (let i = 0; i < 60; i++) {
        const a = (i * Math.PI) / 30, l = i % 5 ? 3 : 6, c = Math.sin(a), s = -Math.cos(a);
        d += `M${pt(c * (r - 3), s * (r - 3))}L${pt(c * (r - 3 - l), s * (r - 3 - l))}`;
        if (p.nums && i % 5 === 0) o += T(ctx, String(i || 60), c * (r - 15), s * (r - 15), { size: r * 0.22, italic: false, color: p.stroke });
      }
      o += `<path d="${d}" fill="none" ${L.thin(p, 0.5)}/>`;
      const a = (((+p.sec || 0) % 60) * Math.PI) / 30;
      o += `<line x1="0" y1="0" x2="${f(Math.sin(a) * r * 0.78)}" y2="${f(-Math.cos(a) * r * 0.78)}" ${sd}/><circle r="2.5" fill="${p.stroke}"/>`;
      return o;
    },
  });

  /* ================= 指针式压强计（布登压强计） ================= */
  PD.register({
    type: 'gauge', name: '布登压强计/指针表',
    defaults: { r: 45, vmin: 0, vmax: 300, step: 50, minor: 5, value: 101, unit: 'kPa', label: '', nums: true, stem: 26, fill: '#b9bec4', shading: true, nc: '#000000' },
    handles: [['r', 'zero']],
    fields: [
      { k: 'r', t: 'num', l: '半径' }, { k: 'vmin', t: 'num', l: '最小值' }, { k: 'vmax', t: 'num', l: '最大值' }, { k: 'step', t: 'num', l: '主刻度间隔' }, { k: 'minor', t: 'num', l: '每格细分' },
      { k: 'value', t: 'num', l: '指针读数' }, { k: 'unit', t: 'text', l: '单位' }, { k: 'label', t: 'text', l: '表盘名称' }, { k: 'nums', t: 'bool', l: '刻度数字' },
      { k: 'stem', t: 'num', l: '接口长度' }, { k: 'fill', t: 'color', l: '外框颜色' }, { k: 'nc', t: 'color', l: '指针颜色' }, { k: 'shading', t: 'bool', l: '金属质感' },
    ],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const r = +p.r, vmin = +p.vmin, vmax = +p.vmax, sd = S(p, { dash: 'solid' }), R = Math.PI / 180;
      const ang = (v) => (225 - (270 * (v - vmin)) / (vmax - vmin || 1)) * R, P = (a, rr) => [rr * Math.cos(a), -rr * Math.sin(a)];
      let o = '';
      if (+p.stem > 0) o += `<rect x="-6" y="${f(r)}" width="12" height="${f(p.stem)}" fill="${L.paint(p, ctx, '#b0b0b0', -6, 6)}" ${sd}/><rect x="-10" y="${f(r + 4)}" width="20" height="9" fill="#8a8a8a" ${sd}/>`;
      o += `<circle r="${f(r + 5)}" fill="${p.shading ? PD.fillAttr({ fillMode: 'radial', fill: p.fill, fill2: '#ffffff' }, ctx).slice(6, -1) : p.fill}" ${sd}/><circle r="${f(r)}" fill="#ffffff" ${L.thin(p, 0.7)}/>`;
      const st = +p.step, mn = Math.max(1, Math.round(+p.minor || 1)); let d = '';
      L.steps(vmin, vmax, st / mn).forEach((v) => {
        const a = ang(v), maj = Math.abs(v / st - Math.round(v / st)) < 1e-6, [x1, y1] = P(a, r - 3), [x2, y2] = P(a, r - 3 - (maj ? 8 : 4));
        d += `M${pt(x1, y1)}L${pt(x2, y2)}`;
        if (maj && p.nums) { const [x, y] = P(a, r - 19); o += T(ctx, PD.fmt(v), x, y, { size: r * 0.19, italic: false, color: p.stroke }); }
      });
      o += `<path d="${d}" fill="none" ${L.thin(p, 0.55)}/>`;
      if (p.unit) o += T(ctx, p.unit, 0, r * 0.45, { size: r * 0.22, italic: false, color: p.stroke });
      if (p.label) o += T(ctx, p.label, 0, -r * 0.32, { size: r * 0.2, italic: false, color: p.stroke });
      const a = ang(clamp(+p.value, vmin - (vmax - vmin) * 0.02, vmax + (vmax - vmin) * 0.02));
      const tip = P(a, r * 0.8), b1 = P(a + Math.PI / 2, 2.6), b2 = P(a - Math.PI / 2, 2.6), tl = P(a + Math.PI, r * 0.15);
      o += `<polygon points="${pt(...tip)} ${pt(...b1)} ${pt(...tl)} ${pt(...b2)}" fill="${p.nc}"/><circle r="4" fill="#444444"/>`;
      return o;
    },
  });

  /* ================= 针筒 ================= */
  PD.register({
    type: 'syringe', name: '针筒(可移动活塞)',
    defaults: { L: 170, d: 36, px: 110, tip: 'sealed', nl: 18, gas: 16, pr: 2.6, seed: 2, arrows: false, pc: '#3b3b3b', tint: true, tc: '#dbe9f6', grad: true, gradN: 5, gradMax: 0 },
    handles: [['px', 'zero']],
    fields: [
      { k: 'L', t: 'num', l: '筒长' }, { k: 'd', t: 'num', l: '筒径' }, { k: 'px', t: 'num', l: '活塞位置' },
      { k: 'tip', t: 'sel', l: '针嘴', o: [['sealed', '封住'], ['open', '开口(接胶管)']] }, { k: 'nl', t: 'num', l: '针嘴长度' },
      { k: 'gas', t: 'num', l: '气体分子数', min: 0 }, { k: 'pr', t: 'num', l: '分子半径', step: 0.2 }, { k: 'arrows', t: 'bool', l: '分子速度箭头' },
      { k: 'tint', t: 'bool', l: '气体底色' }, { k: 'tc', t: 'color', l: '气体底色' }, { k: 'pc', t: 'color', l: '分子颜色' },
      { k: 'grad', t: 'bool', l: '刻度' }, { k: 'gradN', t: 'num', l: '主刻度数' }, { k: 'gradMax', t: 'num', l: '最大读数(0=不标)' }, { k: 'seed', t: 'num', l: '随机排布' },
    ],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const Lb = +p.L, d = +p.d, px = clamp(+p.px, 6, Lb - 4), nl = +p.nl, nw = Math.max(4, d * 0.22), sd = S(p, { dash: 'solid' }), R = PD.rng(p.seed);
      let o = '';
      if (p.tint) o += `<rect x="0" y="${f(-d / 2)}" width="${f(px)}" height="${f(d)}" fill="${p.tc}" fill-opacity="0.7"/>`;
      if (+p.gas > 0) o += L.particles(p, R, +p.gas, +p.pr, [1, -d / 2 + 1, px - 1, d / 2 - 1], () => true, p.pc, p.arrows, d * 0.3);
      const xr = px + Lb * 0.95, rh = d * 0.24;
      o += `<rect x="${f(px + 9)}" y="${f(-rh / 2)}" width="${f(xr - px - 9)}" height="${f(rh)}" fill="#e2e2e2" ${L.thin(p, 0.8)}/>`;
      o += `<rect x="${f(xr)}" y="${f(-d * 0.45)}" width="5" height="${f(d * 0.9)}" rx="1.5" fill="#d6d6d6" ${sd}/>`;
      o += `<rect x="${f(px)}" y="${f(-d / 2 + 0.8)}" width="9" height="${f(d - 1.6)}" fill="#555555" ${L.thin(p, 0.6)}/>`;
      o += `<path d="M${pt(Lb, -d / 2)}H0V${f(-nw / 2)}H${f(-nl)}M${pt(-nl, nw / 2)}H0V${f(d / 2)}H${f(Lb)}" fill="none" ${sd}/>`;
      o += `<rect x="${f(Lb)}" y="${f(-d / 2 - 12)}" width="5" height="${f(d + 24)}" rx="1.5" fill="#e4e4e4" ${sd}/>`;
      if (p.tip === 'sealed') o += `<rect x="${f(-nl - 7)}" y="${f(-nw / 2 - 3)}" width="8" height="${f(nw + 6)}" rx="2.5" fill="#555555" ${L.thin(p, 0.6)}/>`;
      if (p.grad) {
        const n = Math.max(1, Math.round(+p.gradN || 5)), W = Lb * 0.9; let t = '';
        for (let k = 0; k <= n * 2; k++) {
          const x = (W * k) / (2 * n), maj = k % 2 === 0; t += `M${pt(x, -d / 2)}v${f(maj ? 8 : 4)}`;
          if (maj && +p.gradMax > 0) o += T(ctx, PD.fmt((p.gradMax * k) / (2 * n)), x, -d / 2 - 8, { size: 9, italic: false, color: p.stroke });
        }
        o += `<path d="${t}" fill="none" ${L.thin(p, 0.5)}/>`;
      }
      return o;
    },
  });

  /* ================= 预设 ================= */
  PD.preset(CAT, '烧杯(水)', 'vessel', {});
  PD.preset(CAT, '烧杯(沸水)', 'vessel', { level: 0.65, boil: true, steam: true });
  PD.preset(CAT, '烧杯(冰水)', 'vessel', { level: 0.6, ice: 4 });
  PD.preset(CAT, '烧杯(刻度)', 'vessel', { level: 0, grad: true, gradMax: 250 });
  PD.preset(CAT, '锥形瓶', 'vessel', { shape: 'conical', w: 100, h: 130, neck: 30, level: 0.35 });
  PD.preset(CAT, '圆底烧瓶+导管', 'vessel', { shape: 'round', w: 100, h: 150, neck: 26, level: 0.3, stopper: 'rubber', tubes: 1, tubeUp: 30, tubeIn: 20, tubeOut: 60 });
  PD.preset(CAT, '平底烧瓶(木塞)', 'vessel', { shape: 'flat', w: 100, h: 150, neck: 26, level: 0.4, stopper: 'cork' });
  PD.preset(CAT, '试管(木塞)', 'vessel', { shape: 'testtube', w: 24, h: 140, level: 0.4, stopper: 'cork', iceSize: 12 });
  PD.preset(CAT, '沸腾管', 'vessel', { shape: 'testtube', w: 34, h: 170, level: 0.5, iceSize: 14 });
  PD.preset(CAT, '量筒', 'vessel', { shape: 'cylinder', w: 40, h: 180, level: 0.5, grad: true, gradMax: 100 });
  PD.preset(CAT, '水槽', 'vessel', { shape: 'trough', w: 240, h: 80, level: 0.75 });
  PD.preset(CAT, '漏斗(碎冰滴水)', 'funnel', {});
  PD.preset(CAT, '漏斗(空)', 'funnel', { crush: 0, drips: 0 });
  PD.preset(CAT, '铁架台+夹子', 'stand', {});
  PD.preset(CAT, '铁架台+铁圈', 'stand', { clamps: '190,100,80,ring' });
  PD.preset(CAT, '三脚架+铁丝网', 'tripod', {});
  PD.preset(CAT, '本生灯', 'burner', {});
  PD.preset(CAT, '本生灯(黄焰)', 'burner', { air: false });
  PD.preset(CAT, '酒精灯', 'burner', { style: 'spirit', w: 80, h: 46, fs: 34 });
  PD.preset(CAT, '蜡烛', 'burner', { style: 'candle', w: 20, h: 70, fs: 32 });
  PD.preset(CAT, '胶管', 'hose', {});
  PD.preset(CAT, '玻璃导管', 'hose', { kind: 'glass', tw: 7, c1x: 0, c1y: -80, c2x: 10, c2y: -100, x2: 120, y2: -100 });
  PD.preset(CAT, '电子秤', 'balance', {});
  PD.preset(CAT, '秒表', 'stopwatch', {});
  PD.preset(CAT, '布登压强计', 'gauge', {});
  PD.preset(CAT, '针筒(封口+气体)', 'syringe', {});
  PD.preset(CAT, '针筒(刻度)', 'syringe', { tip: 'open', gas: 0, tint: false, gradMax: 50 });
})();
