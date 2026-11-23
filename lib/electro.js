/* 第四册 · 电与磁（二）：静电学、磁场、磁场中受到的力（依赖 PD.lab 辅助、circuit.js 的电源）
   场线追踪 L.fieldLines（RK4）· 点电荷场 · 匀强场(E/×/•/箭头) · 平行板 · 金属球(感应电荷) · 带电棒 · 手 · 范德格拉夫
   磁铁组(场线) · 马蹄形磁铁 · 磁极块 · 指南针(可绑定场源自动指向) · 长直导线磁场(端视/侧视, 可叠加匀强场=弓形磁场)
   螺线管 · 洛伦兹力轨迹 · 速度选择器 · 电流天平 */
(function () {
  'use strict';
  const f = PD.f, S = PD.strokeAttr, T = PD.tex, L = PD.lab, pt = L.pt, clamp = L.clamp;
  const D2R = Math.PI / 180, R2D = 180 / Math.PI, TAU = Math.PI * 2;
  const C1 = 'DSE-物理/电与磁/静电学', C2 = 'DSE-物理/电与磁/磁场', C3 = 'DSE-物理/电与磁/磁场中受到的力';
  const sd = (p) => S(p, { dash: 'solid' });
  const RED = '#d9453b', BLUEp = '#4a67c9', POS = '#d62828', NEG = '#1e5fbf';

  /* ================= 场线追踪 ================= */
  // F(x,y) → [Bx,By]；从 seed 出发沿 sgn·F/|F| 走；stop(x,y) 为真即停；closed：回到起点附近即闭合
  L.fieldLines = (F, seeds, o) => {
    const h = o.h || 2.5, max = o.max || 2500, bb = o.bb, out = [];
    const dir = (x, y, s) => { const v = F(x, y), l = Math.hypot(v[0], v[1]); return l < 1e-12 ? null : [(s * v[0]) / l, (s * v[1]) / l]; };
    seeds.forEach(([x0, y0, s]) => {
      let x = x0, y = y0; const P = [[x, y]]; let len = 0;
      for (let k = 0; k < max; k++) {
        const k1 = dir(x, y, s); if (!k1) break;
        const k2 = dir(x + (k1[0] * h) / 2, y + (k1[1] * h) / 2, s); if (!k2) break;
        const k3 = dir(x + (k2[0] * h) / 2, y + (k2[1] * h) / 2, s); if (!k3) break;
        const k4 = dir(x + k3[0] * h, y + k3[1] * h, s); if (!k4) break;
        x += (h * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0])) / 6; y += (h * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])) / 6; len += h;
        if (bb && (x < bb[0] - 2 || x > bb[2] + 2 || y < bb[1] - 2 || y > bb[3] + 2)) { P.push([clamp(x, bb[0], bb[2]), clamp(y, bb[1], bb[3])]); break; }
        if (k % 3 === 0 || k < 3) P.push([x, y]);
        if (o.stop && o.stop(x, y)) { P.push([x, y]); break; }
        if (o.closed && len > h * 30 && Math.hypot(x - x0, y - y0) < h * 1.5) { P.push([x0, y0]); P.closed = true; break; }
      }
      if (P.length > 2) { P.s = s; out.push(P); }
    });
    return out;
  };
  // 画场线（带箭头）；flow=+1 箭头沿追踪方向
  L.drawLines = (p, lines, o = {}) => {
    const col = o.color || p.fc || p.stroke, sw = o.sw || +p.fw || 1.1, n = o.arrows ?? 1, ah = o.ah || 6 + sw * 1.5;
    let s = '';
    lines.forEach((P) => {
      s += `<polyline points="${PD.ptsStr(P)}" fill="none" stroke="${col}" stroke-width="${f(sw)}" stroke-linejoin="round"${o.dash ? ` stroke-dasharray="${PD.dashArr(o.dash, sw)}"` : ''}/>`;
      if (!n) return;
      const cum = [0]; for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
      const tot = cum[cum.length - 1]; if (tot < ah * 3) return;
      for (let k = 0; k < n; k++) {
        const tg = tot * ((k + 0.5) / n) * (o.at ? o.at * 2 : 1); let i = 1; while (i < P.length - 1 && cum[i] < tg) i++;
        const a = P[i - 1], b = P[i], sg = (P.s ?? 1) * (o.flow ?? 1) > 0 ? 1 : -1, ang = Math.atan2((b[1] - a[1]) * sg, (b[0] - a[0]) * sg);
        s += PD.arrowHead(b[0] + (Math.cos(ang) * ah) / 2, b[1] + (Math.sin(ang) * ah) / 2, ang, ah, 'tri', col, sw);
      }
    });
    return s;
  };
  const rotV = (o, v) => { const a = ((+o.rot || 0) * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a), x = o.flip ? -v[0] : v[0]; return [x * c - v[1] * s, x * s + v[1] * c]; };
  // 场源统一接口：def.fieldAt(o, X, Y)（文档坐标）→ 文档坐标中的场矢量
  const fieldAtLocal = (fn) => (o, X, Y) => { const l = PD.docToLocal(o, X, Y); return rotV(o, fn(o, l[0], l[1])); };
  const sgnTxt = (s) => (s > 0 ? '+' : '−');
  const signMark = (x, y, s, r, sw) => `<path d="M${pt(x - r, y)}H${f(x + r)}${s > 0 ? `M${pt(x, y - r)}V${f(y + r)}` : ''}" stroke="${s > 0 ? POS : NEG}" stroke-width="${f(sw || 1.6)}" stroke-linecap="round"/>`;
  const parseRows = (s, n) => PD.lines(s).map((l) => l.split(',').map((x) => x.trim())).filter((a) => a.length >= n && a.slice(0, n).every((x) => x !== '' && isFinite(+x)));

  /* ================= 点电荷与电场线 ================= */
  const chargeF = (Q) => (x, y) => { let ex = 0, ey = 0; Q.forEach(([cx, cy, q]) => { const dx = x - cx, dy = y - cy, r2 = dx * dx + dy * dy + 1e-6, r3 = r2 * Math.sqrt(r2); ex += (q * dx) / r3; ey += (q * dy) / r3; }); return [ex, ey]; };
  PD.register({
    type: 'efield', name: '点电荷电场(可多个电荷)',
    defaults: { charges: '0,0,1', W: 300, H: 240, per: 12, r: 13, rot0: 0, arrows: 1, frame: false, labels: '', fc: '#000000', fw: 1.1, lsize: 15 },
    fields: [
      { k: 'charges', t: 'area', l: '电荷(每行 x, y, 电量)', ph: '例: -70,0,1\n例: 70,0,-1\n(电量正负决定符号，大小决定场线数)' },
      { k: 'W', t: 'num', l: '区域宽' }, { k: 'H', t: 'num', l: '区域高' }, { k: 'per', t: 'num', l: '每单位电荷场线数' }, { k: 'r', t: 'num', l: '电荷半径' }, { k: 'rot0', t: 'num', l: '场线起始角°', step: 5 },
      { k: 'arrows', t: 'num', l: '每条线箭头数', min: 0 }, { k: 'frame', t: 'bool', l: '边框' }, { k: 'labels', t: 'text', l: '电荷标签(逗号分隔, 如 A,B)' },
      { k: 'fc', t: 'color', l: '场线颜色' }, { k: 'fw', t: 'num', l: '场线线宽', step: 0.1 }, { k: 'lsize', t: 'num', l: '标签字号' },
    ],
    fieldAt: fieldAtLocal((o, x, y) => chargeF(parseRows(o.charges, 3).map((a) => a.map(Number)))(x, y)),
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const Q = parseRows(p.charges, 3).map((a) => a.map(Number)), W = +p.W, H = +p.H, bb = [-W / 2, -H / 2, W / 2, H / 2], r = +p.r, F = chargeF(Q);
      const near = (x, y, sg) => Q.findIndex(([cx, cy, q]) => q * sg < 0 && Math.hypot(x - cx, y - cy) < r * 0.8);
      const seeds = [], arrive = Q.map(() => 0);
      Q.forEach(([cx, cy, q], i) => { if (q <= 0) return; const n = Math.max(1, Math.round(q * +p.per)); for (let k = 0; k < n; k++) { const a = (+p.rot0 * D2R) + (TAU * k) / n; seeds.push([cx + r * Math.cos(a), cy + r * Math.sin(a), 1]); } });
      let lines = L.fieldLines(F, seeds, { bb, stop: (x, y) => near(x, y, 1) >= 0 });
      lines.forEach((P) => { const e = P[P.length - 1], k = near(e[0], e[1], 1); if (k >= 0) arrive[k]++; });
      const back = [];
      Q.forEach(([cx, cy, q], i) => { if (q >= 0) return; const need = Math.round(-q * +p.per) - arrive[i]; if (need <= 0) return; const n = Math.round(-q * +p.per); for (let k = 0; k < n; k++) { if (Q.some(([, , qq]) => qq > 0) && k % Math.max(1, Math.round(n / need)) !== 0) continue; const a = (+p.rot0 * D2R) + (TAU * k) / n; back.push([cx + r * Math.cos(a), cy + r * Math.sin(a), -1]); } });
      lines = lines.concat(L.fieldLines(F, back, { bb, stop: (x, y) => near(x, y, -1) >= 0 }));
      const cid = ctx.id + '-ef'; ctx.defs.push(`<clipPath id="${cid}"><rect x="${f(-W / 2)}" y="${f(-H / 2)}" width="${f(W)}" height="${f(H)}"/></clipPath>`);
      let o = `<g clip-path="url(#${cid})">${L.drawLines(p, lines, { arrows: +p.arrows })}</g>`;
      const labs = String(p.labels || '').split(',').map((x) => x.trim());
      Q.forEach(([cx, cy, q], i) => {
        const fill = q > 0 ? '#fde2e0' : q < 0 ? '#dfe7fb' : '#eeeeee';
        o += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${fill}" ${sd(p)}/>` + (q ? signMark(cx, cy, q, r * 0.5, 2) : '');
        if (labs[i]) o += T(ctx, labs[i], cx, cy + r + 13, { size: p.lsize, color: p.stroke, halo: true });
      });
      if (p.frame) o += `<rect x="${f(-W / 2)}" y="${f(-H / 2)}" width="${f(W)}" height="${f(H)}" fill="none" ${S(p, { dash: 'solid', sw: 0.8 })}/>`;
      return o;
    },
  });

  /* ================= 匀强场 ================= */
  PD.register({
    type: 'ufield', name: '匀强场(E 箭头 / B × / B •)',
    defaults: { kind: 'in', W: 220, H: 150, gap: 30, dir: 0, frame: 'dash', label: 'B', lpos: 'tr', mark: 7, fc: '#000000', fw: 1.2, lsize: 17, tint: false, tc: '#eef3fb' },
    handles: [['W', 'H', 0.5, 0.5]],
    fields: [
      { k: 'kind', t: 'sel', l: '类型', o: [['in', '×  入纸面'], ['out', '•  出纸面'], ['lines', '箭头场线(E 或 B)']], rebuild: true },
      { k: 'W', t: 'num', l: '宽' }, { k: 'H', t: 'num', l: '高' }, { k: 'gap', t: 'num', l: '间距' }, { k: 'dir', t: 'num', l: '方向°(0右 90上)', step: 15, when: (p) => p.kind === 'lines' },
      { k: 'mark', t: 'num', l: '× / • 大小', when: (p) => p.kind !== 'lines' },
      { k: 'frame', t: 'sel', l: '边框', o: [['dash', '虚线'], ['solid', '实线'], ['none', '无']] }, { k: 'tint', t: 'bool', l: '底色' }, { k: 'tc', t: 'color', l: '底色颜色', when: (p) => p.tint },
      { k: 'label', t: 'text', l: '标签' }, { k: 'lpos', t: 'sel', l: '标签位置', o: [['tr', '右上'], ['tl', '左上'], ['br', '右下'], ['out', '框外右侧']] },
      { k: 'fc', t: 'color', l: '符号颜色' }, { k: 'fw', t: 'num', l: '线宽', step: 0.1 }, { k: 'lsize', t: 'num', l: '标签字号' },
    ],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const W = +p.W, H = +p.H, g = Math.max(6, +p.gap), m = +p.mark, col = p.fc, sw = +p.fw;
      let o = p.tint ? `<rect x="${f(-W / 2)}" y="${f(-H / 2)}" width="${f(W)}" height="${f(H)}" fill="${p.tc}"/>` : '';
      if (p.kind === 'lines') {
        const u = [Math.cos(+p.dir * D2R), -Math.sin(+p.dir * D2R)], v = [-u[1], u[0]], D = Math.hypot(W, H) / 2, cid = ctx.id + '-uf', ln = [];
        ctx.defs.push(`<clipPath id="${cid}"><rect x="${f(-W / 2)}" y="${f(-H / 2)}" width="${f(W)}" height="${f(H)}"/></clipPath>`);
        for (let k = -Math.floor(D / g); k <= Math.floor(D / g); k++) { const c = [v[0] * (k + 0.5 * ((Math.floor(D / g) * 2 + 1) % 2 ? 0 : 1)) * g, v[1] * k * g]; const cc = [v[0] * k * g, v[1] * k * g], P = [[cc[0] - u[0] * D, cc[1] - u[1] * D], [cc[0] + u[0] * D, cc[1] + u[1] * D]];
          // 截到矩形内
          const ts = []; [[-W / 2, 0], [W / 2, 0], [-H / 2, 1], [H / 2, 1]].forEach(([b, ax]) => { const du = ax ? u[1] : u[0], c0 = ax ? cc[1] : cc[0]; if (Math.abs(du) > 1e-9) ts.push((b - c0) / du); });
          const inside = (t) => { const x = cc[0] + u[0] * t, y = cc[1] + u[1] * t; return x >= -W / 2 - 0.1 && x <= W / 2 + 0.1 && y >= -H / 2 - 0.1 && y <= H / 2 + 0.1; };
          const tt = ts.filter(inside).sort((a, b) => a - b); if (tt.length >= 2 && tt[tt.length - 1] - tt[0] > g * 0.8) { const a = tt[0], b = tt[tt.length - 1], Pp = [[cc[0] + u[0] * a, cc[1] + u[1] * a], [cc[0] + u[0] * b, cc[1] + u[1] * b]]; Pp.s = 1; ln.push(Pp); } void c; void P; }
        o += L.drawLines(p, ln, { color: col, sw, arrows: 1 });
      } else {
        const nx = Math.max(1, Math.floor(W / g)), ny = Math.max(1, Math.floor(H / g)), x0 = -((nx - 1) * g) / 2, y0 = -((ny - 1) * g) / 2; let d = '', dots = '';
        for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
          const x = x0 + i * g, y = y0 + j * g;
          if (p.kind === 'in') d += `M${pt(x - m / 2, y - m / 2)}l${f(m)},${f(m)}M${pt(x - m / 2, y + m / 2)}l${f(m)},${f(-m)}`;
          else dots += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(m * 0.32)}" fill="${col}"/>`;
        }
        o += d ? `<path d="${d}" fill="none" stroke="${col}" stroke-width="${f(sw)}" stroke-linecap="round"/>` : dots;
      }
      if (p.frame !== 'none') o += `<rect x="${f(-W / 2)}" y="${f(-H / 2)}" width="${f(W)}" height="${f(H)}" fill="none" ${S(p, { dash: p.frame, sw: 1 })}/>`;
      if (p.label) { const pos = { tr: [W / 2, -H / 2 - 11, 'end'], tl: [-W / 2 + 6, -H / 2 + 12, 'start'], br: [W / 2 - 6, H / 2 - 10, 'end'], out: [W / 2 + 8, 0, 'start'] }[p.lpos] || [W / 2 - 6, -H / 2 + 12, 'end']; o += T(ctx, p.label, pos[0], pos[1], { size: p.lsize, anchor: pos[2], color: p.stroke, halo: true }); }
      return o;
    },
  });

  /* ================= 平行金属板 ================= */
  PD.register({
    type: 'plates', name: '平行金属板(抽象图)',
    defaults: { d: 110, H: 170, t: 12, field: false, nf: 6, charges: false, terms: true, volt: '2000 V', dim: '2 cm', la: 'A', lb: 'B', sa: '+', sb: '−', pts: '0,-40,X\n10,20,Y', fill: '#a9aeb5', fc: '#000000', fw: 1.1, lsize: 15 },
    handles: [['d', 'zero', 0.5]],
    ports: (p) => { const d = +p.d / 2, t = +p.t; return [[-d - t - 22, 0, 0, 1], [d + t + 22, 0, 0, 1]]; },
    fields: [
      { k: 'd', t: 'num', l: '板距' }, { k: 'H', t: 'num', l: '板高' }, { k: 't', t: 'num', l: '板厚' },
      { k: 'field', t: 'bool', l: '电场线' }, { k: 'nf', t: 'num', l: '电场线数', when: (p) => p.field }, { k: 'charges', t: 'bool', l: '板面电荷 + −' },
      { k: 'terms', t: 'bool', l: '端子 + 电压连线' }, { k: 'volt', t: 'text', l: '电压标签', when: (p) => p.terms }, { k: 'sa', t: 'text', l: '左板符号' }, { k: 'sb', t: 'text', l: '右板符号' },
      { k: 'dim', t: 'text', l: '板距标签' }, { k: 'la', t: 'text', l: '左板标签' }, { k: 'lb', t: 'text', l: '右板标签' },
      { k: 'pts', t: 'area', l: '标记点(x, y, 标签)' }, { k: 'fill', t: 'color', l: '板颜色' }, { k: 'fc', t: 'color', l: '电场线颜色' }, { k: 'lsize', t: 'num', l: '标签字号' },
    ],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const d = +p.d / 2, H = +p.H, t = +p.t, ls = p.lsize;
      let o = '';
      if (p.field) { const n = Math.max(1, Math.round(+p.nf)), ln = []; for (let k = 0; k < n; k++) { const y = -H * 0.42 + (H * 0.84 * k) / Math.max(1, n - 1); const P = [[-d, y], [d, y]]; P.s = p.sa === '−' || p.sa === '-' ? -1 : 1; ln.push(P); } o += L.drawLines(p, ln, { arrows: 1 }); }
      [[-d - t, p.sa], [d, p.sb]].forEach(([x]) => (o += `<rect x="${f(x)}" y="${f(-H / 2)}" width="${f(t)}" height="${f(H)}" fill="${L.metal(ctx, p.fill, x, x + t)}" ${sd(p)}/>`));
      if (p.charges) for (let k = 0; k < 7; k++) { const y = -H * 0.42 + (H * 0.84 * k) / 6; o += signMark(-d - 6, y, p.sa === '−' || p.sa === '-' ? -1 : 1, 3.5, 1.4) + signMark(d + 6, y, p.sb === '+' ? 1 : -1, 3.5, 1.4); }
      if (p.terms) {
        const xl = -d - t - 22, xr = d + t + 22, yb = H / 2 + 34;
        o += `<path d="M${pt(-d - t, 0)}H${f(xl + 3.5)}M${pt(d + t, 0)}H${f(xr - 3.5)}" fill="none" ${sd(p)}/><circle cx="${f(xl)}" cy="0" r="3.5" fill="#fff" ${sd(p)}/><circle cx="${f(xr)}" cy="0" r="3.5" fill="#fff" ${sd(p)}/>`;
        o += T(ctx, p.sa, xl, -13, { size: ls + 2, italic: false, color: p.sa === '+' ? POS : NEG }) + T(ctx, p.sb, xr, -13, { size: ls + 2, italic: false, color: p.sb === '+' ? POS : NEG });
        if (p.volt) { o += L.arrow(p, xl, yb, xl, 6, { sw: 1 }) + L.arrow(p, xr, yb, xr, 6, { sw: 1 }); const tw = PD.layoutTex(p.volt, ls, ctx, { italic: false }).w / 2 + 6; o += `<path d="M${pt(xl, yb)}H${f(-tw)}M${pt(tw, yb)}H${f(xr)}" fill="none" ${S(p, { dash: 'solid', sw: 1 })}/>` + T(ctx, p.volt, 0, yb, { size: ls, italic: false, color: p.stroke }); }
      }
      if (p.dim) o += L.dim(p, ctx, -d, H / 2 - 14, d, H / 2 - 14, '', { ah: 6 }) + T(ctx, p.dim, 0, H / 2 - 14, { size: ls, italic: false, color: p.stroke, halo: true });
      if (p.la) o += T(ctx, p.la, -d - t - 10, H / 2 - 12, { size: ls, anchor: 'end', color: p.stroke });
      if (p.lb) o += T(ctx, p.lb, d + t + 10, H / 2 - 12, { size: ls, anchor: 'start', color: p.stroke });
      parseRows(p.pts, 2).forEach((a) => (o += `<circle cx="${f(+a[0])}" cy="${f(+a[1])}" r="3.5" fill="${p.stroke}"/>` + (a[2] ? T(ctx, a[2], +a[0], +a[1] - 14, { size: ls, color: p.stroke, halo: true }) : '')));
      return o;
    },
  });
  PD.register({
    type: 'platesreal', name: '平行金属板(实物)',
    defaults: { d: 90, H: 170, psu: true, labels: true, lsize: 13 },
    fields: [{ k: 'd', t: 'num', l: '板距' }, { k: 'H', t: 'num', l: '板高' }, { k: 'psu', t: 'bool', l: '电源 + 接线' }, { k: 'labels', t: 'bool', l: '文字标注' }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const d = +p.d, H = +p.H, k = [20, -12];
      const base = (x) => { const w = 56, y = 0; return `<polygon points="${pt(x - w / 2, y)} ${pt(x + w / 2, y)} ${pt(x + w / 2 + k[0] * 1.6, y + k[1] * 1.6)} ${pt(x - w / 2 + k[0] * 1.6, y + k[1] * 1.6)}" fill="#f0f0f0" ${sd(p)}/><polygon points="${pt(x - w / 2, y)} ${pt(x + w / 2, y)} ${pt(x + w / 2, y + 6)} ${pt(x - w / 2, y + 6)}" fill="#d0d0d0" ${sd(p)}/><rect x="${f(x - 8)}" y="${f(y - 10 + k[1] * 0.8)}" width="${f(16 + k[0] * 0.8 - 10)}" height="10" fill="#7e57c2" ${L.thin(p, 0.6)}/>`; };
      const plate = (x) => `<polygon points="${pt(x, -H)} ${pt(x + 4, -H)} ${pt(x + 4, k[1] * 0.8)} ${pt(x, k[1] * 0.8)}" fill="#8c939b" ${sd(p)}/><polygon points="${pt(x + 4, -H)} ${pt(x + 4 + k[0], -H + k[1])} ${pt(x + 4 + k[0], k[1] * 1.8)} ${pt(x + 4, k[1] * 0.8)}" fill="#bfc5cc" ${sd(p)}/>`;
      let o = base(0) + base(d) + plate(-2) + plate(d - 2);
      if (p.psu) {
        o += `<g transform="translate(-200,-80)">${PD.shapes.psu.render(Object.assign({}, PD.shapes.psu.defaults, { stroke: p.stroke, sw: p.sw, title: p.labels ? '电源' : '' }), ctx)}</g>`;
        o += `<path d="M-175,-61C-120,10 -60,30 0,-6" fill="none" stroke="#d62828" stroke-width="2"/><path d="M-150,-61C-120,40 ${d - 60},40 ${d},-6" fill="none" stroke="#222" stroke-width="2"/>`;
      }
      if (p.labels) { o += T(ctx, '平行金属板', d + 40, -H + 10, { size: p.lsize, anchor: 'start', italic: false, color: p.stroke }) + `<path d="M${pt(d + 38, -H + 14)}L${pt(d + 10, -H + 40)}M${pt(d + 38, -H + 14)}L${pt(14, -H + 40)}" fill="none" ${S(p, { dash: 'solid', sw: 0.6 })}/>` + T(ctx, '绝缘底座', d + 46, -30, { size: p.lsize, anchor: 'start', italic: false, color: p.stroke }) + `<line x1="${f(d + 44)}" y1="-30" x2="${f(d + 20)}" y2="-12" ${S(p, { dash: 'solid', sw: 0.6 })}/>`; }
      return o;
    },
  });

  /* ================= 金属球（感应电荷） ================= */
  PD.register({
    type: 'msphere', name: '金属球(绝缘支架, 感应电荷)',
    defaults: { r: 48, stand: true, sh: 46, mode: 'polar', near: 'left', ns: -1, n: 4, custom: '180,-1\n0,1', label: 'A', side: true, sideL: '', sideR: '', shading: true, fill: '#c9ced4', lsize: 16 },
    fields: [
      { k: 'r', t: 'num', l: '半径' }, { k: 'stand', t: 'bool', l: '绝缘支架' }, { k: 'sh', t: 'num', l: '支架高', when: (p) => p.stand },
      { k: 'mode', t: 'sel', l: '电荷分布', o: [['none', '中性(不画)'], ['polar', '感应(一边正一边负)'], ['near', '只有近端电荷'], ['uni', '均匀分布'], ['custom', '自定义(角度, 正负)']], rebuild: true },
      { k: 'near', t: 'sel', l: '近端在', o: [['left', '左边'], ['right', '右边'], ['top', '上边'], ['bottom', '下边']], when: (p) => p.mode === 'polar' || p.mode === 'near' },
      { k: 'ns', t: 'sel', l: '近端电荷 / 均匀电荷', o: [['-1', '负 −'], ['1', '正 +']], when: (p) => p.mode !== 'none' && p.mode !== 'custom' },
      { k: 'n', t: 'num', l: '每边符号数', min: 1, when: (p) => p.mode !== 'none' && p.mode !== 'custom' },
      { k: 'custom', t: 'area', l: '自定义(每行: 角度°, ±1)', when: (p) => p.mode === 'custom' },
      { k: 'label', t: 'text', l: '球内标签' }, { k: 'sideL', t: 'text', l: '左侧标签' }, { k: 'sideR', t: 'text', l: '右侧标签' },
      { k: 'shading', t: 'bool', l: '光影' }, { k: 'fill', t: 'color', l: '颜色' }, { k: 'lsize', t: 'num', l: '标签字号' },
    ],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const r = +p.r, sh = +p.sh; let o = '';
      if (p.stand) o += `<path d="M-4,${f(r - 2)}L-3,${f(r + sh * 0.35)}Q-9,${f(r + sh * 0.55)} -5,${f(r + sh * 0.8)}L-5,${f(r + sh - 6)}L5,${f(r + sh - 6)}L5,${f(r + sh * 0.8)}Q9,${f(r + sh * 0.55)} 3,${f(r + sh * 0.35)}L4,${f(r - 2)}Z" fill="#e7b48b" ${sd(p)}/><rect x="${f(-r * 0.6)}" y="${f(r + sh - 7)}" width="${f(r * 1.2)}" height="7" rx="3" fill="#e7b48b" ${sd(p)}/>`;
      o += `<circle r="${f(r)}" ${p.shading ? PD.fillAttr({ fillMode: 'radial', fill: p.fill, fill2: '#ffffff' }, ctx) : `fill="${p.fill}"`} ${sd(p)}/>`;
      const marks = [], n = Math.max(1, Math.round(+p.n)), ns = +p.ns >= 0 ? 1 : -1, base = { left: 180, right: 0, top: 90, bottom: 270 }[p.near] ?? 180;
      if (p.mode === 'polar' || p.mode === 'near') for (let k = 0; k < n; k++) { const a = base + (k - (n - 1) / 2) * (100 / Math.max(1, n)); marks.push([a, ns]); if (p.mode === 'polar') marks.push([a + 180, -ns]); }
      else if (p.mode === 'uni') { const m = n * 2; for (let k = 0; k < m; k++) marks.push([90 + (360 * k) / m, ns]); }
      else if (p.mode === 'custom') parseRows(p.custom, 2).forEach((a) => marks.push([+a[0], +a[1] >= 0 ? 1 : -1]));
      marks.forEach(([a, s]) => { const t = a * D2R; o += signMark((r - 9) * Math.cos(t), -(r - 9) * Math.sin(t), s, 4, 1.7); });
      if (p.label) o += T(ctx, p.label, 0, 0, { size: p.lsize, color: p.stroke });
      if (p.sideL) o += T(ctx, p.sideL, -r - 8, 0, { size: p.lsize, anchor: 'end', color: p.stroke });
      if (p.sideR) o += T(ctx, p.sideR, r + 8, 0, { size: p.lsize, anchor: 'start', color: p.stroke });
      return o;
    },
  });
  PD.register({
    type: 'crod', name: '带电棒', defaults: { L: 120, w: 16, sign: 1, n: 4, fill: '#cfe86a', end: true },
    fields: [{ k: 'L', t: 'num', l: '长度' }, { k: 'w', t: 'num', l: '粗细' }, { k: 'sign', t: 'sel', l: '电荷', o: [['1', '正 +'], ['-1', '负 −'], ['0', '不带电']] }, { k: 'n', t: 'num', l: '符号数' }, { k: 'end', t: 'bool', l: '端面(立体感)' }, { k: 'fill', t: 'color', l: '颜色' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const Lr = +p.L, w = +p.w / 2, sg = +p.sign;
      let o = `<rect x="0" y="${f(-w)}" width="${f(Lr)}" height="${f(2 * w)}" fill="${L.metal(ctx, p.fill, -w, w, true)}" ${sd(p)}/>`;
      if (p.end) o += `<ellipse cx="0" cy="0" rx="${f(w * 0.4)}" ry="${f(w)}" fill="${PD.shade(p.fill, 0.3)}" ${sd(p)}/>`;
      if (sg) for (let k = 0; k < Math.round(+p.n); k++) o += signMark(w * 1.4 + k * w * 1.5, (k % 2 ? 0.35 : -0.35) * w, sg, w * 0.38, 1.5);
      return o;
    },
  });
  PD.register({
    type: 'hand', name: '手(手指触碰/接地)', defaults: { s: 70, fill: '#f2c9a5' },
    fields: [{ k: 's', t: 'num', l: '大小' }, { k: 'fill', t: 'color', l: '肤色' }], style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p) {
      const k = +p.s / 70, P = (x, y) => pt(x * k, y * k);
      return `<path d="M${P(0, 0)}C${P(4, -4)} ${P(20, -6)} ${P(34, -6)}L${P(38, -10)}C${P(44, -16)} ${P(56, -14)} ${P(62, -8)}L${P(80, 4)}L${P(80, 30)}L${P(54, 30)}C${P(46, 30)} ${P(40, 26)} ${P(36, 20)}C${P(30, 20)} ${P(28, 14)} ${P(32, 10)}C${P(26, 10)} ${P(24, 4)} ${P(30, 2)}L${P(4, 4)}C${P(0, 4)} ${P(-2, 2)} ${P(0, 0)}Z" fill="${p.fill}" ${sd(p)}/>` +
        `<path d="M${P(30, 2)}C${P(36, 2)} ${P(40, 4)} ${P(42, 8)}M${P(32, 10)}C${P(38, 10)} ${P(42, 12)} ${P(42, 16)}M${P(36, 20)}C${P(40, 20)} ${P(42, 22)} ${P(42, 24)}" fill="none" ${L.thin(p, 0.6)}/>`;
    },
  });
  PD.register({
    type: 'vdg', name: '范德格拉夫起电机', defaults: { r: 50, H: 130, sign: 1, n: 10, label: '', lsize: 14 },
    fields: [{ k: 'r', t: 'num', l: '金属罩半径' }, { k: 'H', t: 'num', l: '柱高' }, { k: 'sign', t: 'sel', l: '电荷', o: [['1', '正 +'], ['-1', '负 −'], ['0', '不画']] }, { k: 'n', t: 'num', l: '符号数' }, { k: 'label', t: 'text', l: '标签' }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const r = +p.r, H = +p.H, sg = +p.sign;
      let o = `<rect x="-36" y="-22" width="72" height="22" rx="3" fill="#6d6d6d" ${sd(p)}/><rect x="-12" y="${f(-22 - H)}" width="24" height="${f(H)}" fill="#dde6ee" fill-opacity="0.9" ${sd(p)}/><path d="M-5,-22V${f(-22 - H)}M5,-22V${f(-22 - H)}" stroke="#7a5230" stroke-width="2"/>`;
      o += `<circle cx="0" cy="${f(-22 - H - r * 0.8)}" r="${f(r)}" ${PD.fillAttr({ fillMode: 'radial', fill: '#bfc5cc', fill2: '#ffffff' }, ctx)} ${sd(p)}/>`;
      if (sg) for (let k = 0; k < Math.round(+p.n); k++) { const a = Math.PI * (0.05 + (0.9 * k) / Math.max(1, Math.round(+p.n) - 1)) + Math.PI; o += signMark((r - 8) * Math.cos(a) * -1, -22 - H - r * 0.8 + (r - 8) * Math.sin(a), sg, 4, 1.6); }
      if (p.label) o += T(ctx, p.label, r + 10, -22 - H - r * 0.8, { size: p.lsize, anchor: 'start', italic: false, color: p.stroke });
      return o;
    },
  });

  /* ================= 磁铁组 + 磁场线（磁极模型） ================= */
  const magPoles = (p) => parseRows(p.mags, 2).map((a) => { const x = +a[0], y = +a[1], ang = (+a[2] || 0) * D2R, Lm = +a[3] || +p.len, u = [Math.cos(ang), -Math.sin(ang)], k = (Lm / 2) * 0.82, m = (+a[4] || 1) * (a[5] === '-' ? -1 : 1);
    return { x, y, ang, L: Lm, u, N: [x + u[0] * k, y + u[1] * k], S: [x - u[0] * k, y - u[1] * k], m }; });
  const magF = (M) => (x, y) => { let bx = 0, by = 0; M.forEach((g) => [[g.N, g.m], [g.S, -g.m]].forEach(([c, q]) => { const dx = x - c[0], dy = y - c[1], r2 = dx * dx + dy * dy + 4, r3 = r2 * Math.sqrt(r2); bx += (q * dx) / r3; by += (q * dy) / r3; })); return [bx, by]; };
  const drawBar = (p, ctx, g, w, labels) => {
    const a = -g.ang * R2D, Lm = g.L;
    return `<g transform="translate(${pt(g.x, g.y)}) rotate(${f(a)})"><rect x="${f(-Lm / 2)}" y="${f(-w / 2)}" width="${f(Lm / 2)}" height="${f(w)}" fill="${g.m > 0 ? BLUEp : RED}" ${sd(p)}/><rect x="0" y="${f(-w / 2)}" width="${f(Lm / 2)}" height="${f(w)}" fill="${g.m > 0 ? RED : BLUEp}" ${sd(p)}/></g>` +
      (labels ? T(ctx, g.m > 0 ? 'S' : 'N', g.x - g.u[0] * Lm * 0.3, g.y - g.u[1] * Lm * 0.3, { size: w * 0.62, italic: false, color: '#ffffff' }) + T(ctx, g.m > 0 ? 'N' : 'S', g.x + g.u[0] * Lm * 0.3, g.y + g.u[1] * Lm * 0.3, { size: w * 0.62, italic: false, color: '#ffffff' }) : '');
  };
  PD.register({
    type: 'magsys', name: '条形磁铁(可多个) + 磁场线',
    defaults: { mags: '0,0,0', len: 120, w: 30, W: 380, H: 260, lines: true, per: 14, arrows: 1, labels: true, frame: false, fc: '#000000', fw: 1.1, bw: false },
    fields: [
      { k: 'mags', t: 'area', l: '磁铁(每行 x, y, 方向°, 长度, 强度, - 反向)', ph: '方向: N 极所指方向\n例: -90,0,0\n例: 90,0,180  (两个 N 相对)\n例: 90,0,0  (N 对 S)' },
      { k: 'len', t: 'num', l: '默认长度' }, { k: 'w', t: 'num', l: '磁铁宽' }, { k: 'W', t: 'num', l: '区域宽' }, { k: 'H', t: 'num', l: '区域高' },
      { k: 'lines', t: 'bool', l: '磁场线' }, { k: 'per', t: 'num', l: '每极场线数', when: (p) => p.lines }, { k: 'arrows', t: 'num', l: '每条线箭头数', when: (p) => p.lines },
      { k: 'labels', t: 'bool', l: '标 N S' }, { k: 'bw', t: 'bool', l: '黑白(白底黑字)' }, { k: 'frame', t: 'bool', l: '边框' }, { k: 'fc', t: 'color', l: '场线颜色' }, { k: 'fw', t: 'num', l: '场线线宽', step: 0.1 },
    ],
    fieldAt: fieldAtLocal((o, x, y) => magF(magPoles(o))(x, y)),
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const M = magPoles(p), W = +p.W, H = +p.H, bb = [-W / 2, -H / 2, W / 2, H / 2], w = +p.w;
      let o = '';
      if (p.lines && M.length) {
        const F = magF(M), seeds = [], rs = w * 0.55, n = Math.max(2, Math.round(+p.per));
        M.forEach((g) => { const N = g.m > 0 ? g.N : g.S, dirA = Math.atan2(g.u[1], g.u[0]) + (g.m > 0 ? 0 : Math.PI); for (let k = 0; k < n; k++) { const a = dirA + (k - (n - 1) / 2) * (TAU * 0.78 / n); seeds.push([N[0] + rs * Math.cos(a), N[1] + rs * Math.sin(a), 1]); } });
        const stop = (x, y) => M.some((g) => { const Sx = g.m > 0 ? g.S : g.N; return Math.hypot(x - Sx[0], y - Sx[1]) < rs * 0.8; });
        let lines = L.fieldLines(F, seeds, { bb, stop, h: 2 });
        const back = []; M.forEach((g) => { const Sx = g.m > 0 ? g.S : g.N, dirA = Math.atan2(g.u[1], g.u[0]) + (g.m > 0 ? Math.PI : 0), m = Math.max(1, Math.round(n * 0.45)); for (let k = 0; k < m; k++) { const a = dirA + (k - (m - 1) / 2) * (TAU * 0.3 / Math.max(1, m)); back.push([Sx[0] + rs * Math.cos(a), Sx[1] + rs * Math.sin(a), -1]); } });
        const stopN = (x, y) => M.some((g) => { const Nx = g.m > 0 ? g.N : g.S; return Math.hypot(x - Nx[0], y - Nx[1]) < rs * 0.8; });
        lines = lines.concat(L.fieldLines(F, back, { bb, stop: stopN, h: 2 }).filter((P) => !stopN(P[P.length - 1][0], P[P.length - 1][1])));
        const cid = ctx.id + '-mg'; ctx.defs.push(`<clipPath id="${cid}"><rect x="${f(-W / 2)}" y="${f(-H / 2)}" width="${f(W)}" height="${f(H)}"/></clipPath>`);
        o += `<g clip-path="url(#${cid})">${L.drawLines(p, lines, { arrows: +p.arrows })}</g>`;
      }
      M.forEach((g) => { let b = drawBar(p, ctx, g, w, p.labels); if (p.bw) b = b.replace(new RegExp(RED, 'g'), '#ffffff').replace(new RegExp(BLUEp, 'g'), '#d9d9d9').replace(/fill="#ffffff">/g, 'fill="#000000">').replace(/color: '#ffffff'/g, ''); o += b; });
      if (p.bw && p.labels) M.forEach((g) => (o += T(ctx, g.m > 0 ? 'S' : 'N', g.x - g.u[0] * g.L * 0.3, g.y - g.u[1] * g.L * 0.3, { size: w * 0.62, italic: false, color: '#000' }) + T(ctx, g.m > 0 ? 'N' : 'S', g.x + g.u[0] * g.L * 0.3, g.y + g.u[1] * g.L * 0.3, { size: w * 0.62, italic: false, color: '#000' })));
      if (p.frame) o += `<rect x="${f(-W / 2)}" y="${f(-H / 2)}" width="${f(W)}" height="${f(H)}" fill="none" ${S(p, { dash: 'solid', sw: 0.8 })}/>`;
      return o;
    },
  });
  /* 马蹄形磁铁 */
  PD.register({
    type: 'horseshoe', name: '马蹄形磁铁(U 形)',
    defaults: { gap: 70, arm: 110, w: 28, lines: true, nl: 6, labels: true, fc: '#000000', fw: 1.1 },
    fields: [{ k: 'gap', t: 'num', l: '两极间距' }, { k: 'arm', t: 'num', l: '臂长' }, { k: 'w', t: 'num', l: '粗细' }, { k: 'lines', t: 'bool', l: '磁场线' }, { k: 'nl', t: 'num', l: '场线数' }, { k: 'labels', t: 'bool', l: '标 N S' }, { k: 'fc', t: 'color', l: '场线颜色' }],
    fieldAt: fieldAtLocal((o, x, y) => { const g = +o.gap / 2 + +o.w / 2, a = +o.arm; return magF([{ N: [-g, -a], S: [g, -a], m: 1 }])(x, y); }),
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const g = +p.gap / 2, w = +p.w, a = +p.arm, R = g + w;
      const U = `M${pt(-R, -a)}V0A${f(R)},${f(R)} 0 0 0 ${pt(R, 0)}V${f(-a)}H${f(g)}V0A${f(g)},${f(g)} 0 0 1 ${pt(-g, 0)}V${f(-a)}Z`;
      let o = `<path d="${U}" fill="#c9ced4" ${sd(p)}/><rect x="${f(-R)}" y="${f(-a)}" width="${f(w)}" height="${f(w * 1.2)}" fill="${RED}" ${sd(p)}/><rect x="${f(g)}" y="${f(-a)}" width="${f(w)}" height="${f(w * 1.2)}" fill="${BLUEp}" ${sd(p)}/>`;
      if (p.lines) {
        const n = Math.max(1, Math.round(+p.nl)), ln = [];
        for (let k = 0; k < n; k++) { const y = -a + w * 0.15 + (k * w * 0.9) / Math.max(1, n - 1), P = [[-g, y], [g, y]]; P.s = 1; ln.push(P); }
        [1, 2].forEach((j) => { const P = []; for (let i = 0; i <= 24; i++) { const t = i / 24, x = -g - w * 0.3 * j + (2 * g + w * 0.6 * j) * t; P.push([x, -a - 2 - j * 14 * Math.sin(Math.PI * t)]); } P.s = 1; ln.push(P); });
        o += L.drawLines(p, ln, { arrows: 1 });
      }
      if (p.labels) o += T(ctx, 'N', -g - w / 2, -a + w * 0.6, { size: w * 0.6, italic: false, color: '#ffffff' }) + T(ctx, 'S', g + w / 2, -a + w * 0.6, { size: w * 0.6, italic: false, color: '#ffffff' });
      return o;
    },
  });
  /* 磁极块（电动机/发电机两侧） */
  PD.register({
    type: 'magpair', name: '一对磁极(N 与 S 相对)',
    defaults: { gap: 200, H: 170, w: 34, face: 'flat', lines: true, nl: 6, labels: true, fc: '#000000', fw: 1.1, bw: false },
    fields: [{ k: 'gap', t: 'num', l: '两极间距' }, { k: 'H', t: 'num', l: '高' }, { k: 'w', t: 'num', l: '厚' }, { k: 'face', t: 'sel', l: '极面', o: [['flat', '平面(匀强场)'], ['curved', '弧面(径向场)']] },
      { k: 'lines', t: 'bool', l: '磁场线' }, { k: 'nl', t: 'num', l: '场线数' }, { k: 'labels', t: 'bool', l: '标 N S' }, { k: 'bw', t: 'bool', l: '黑白' }, { k: 'fc', t: 'color', l: '场线颜色' }],
    fieldAt: fieldAtLocal(() => [1, 0]),
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const g = +p.gap / 2, H = +p.H, w = +p.w, cf = p.face === 'curved', R = g, cN = p.bw ? '#ffffff' : RED, cS = p.bw ? '#d9d9d9' : BLUEp;
      let o = '';
      if (p.lines) { const n = Math.max(1, Math.round(+p.nl)), ln = []; for (let k = 0; k < n; k++) { const y = -H * 0.4 + (H * 0.8 * k) / Math.max(1, n - 1); let xl = -g, xr = g; if (cf) { const dx = Math.sqrt(Math.max(0, R * R - y * y)); xl = -dx; xr = dx; } const P = cf ? [[xl, y], [-R * 0.3, y * 0.3], [R * 0.3, y * 0.3], [xr, y]] : [[xl, y], [xr, y]]; P.s = 1; ln.push(P); } o += L.drawLines(p, ln, { arrows: 1 }); }
      if (cf) { const yy = H / 2, dx = Math.sqrt(Math.max(0, R * R - yy * yy)); o += `<path d="M${pt(-g - w, -yy)}H${f(-dx)}A${f(R)},${f(R)} 0 0 0 ${pt(-dx, yy)}H${f(-g - w)}Z" fill="${cN}" ${sd(p)}/><path d="M${pt(g + w, -yy)}H${f(dx)}A${f(R)},${f(R)} 0 0 1 ${pt(dx, yy)}H${f(g + w)}Z" fill="${cS}" ${sd(p)}/>`; }
      else o += `<rect x="${f(-g - w)}" y="${f(-H / 2)}" width="${f(w)}" height="${f(H)}" fill="${cN}" ${sd(p)}/><rect x="${f(g)}" y="${f(-H / 2)}" width="${f(w)}" height="${f(H)}" fill="${cS}" ${sd(p)}/>`;
      if (p.labels) o += T(ctx, 'N', -g - w / 2, 0, { size: w * 0.55, italic: false, color: p.bw ? '#000' : '#fff' }) + T(ctx, 'S', g + w / 2, 0, { size: w * 0.55, italic: false, color: p.bw ? '#000' : '#fff' });
      return o;
    },
  });

  /* ================= 指南针（可绑定场源） ================= */
  PD.register({
    type: 'compass', name: '指南针(绑定场源自动指向)',
    defaults: { r: 14, ang: 0, src: '', ring: true, fill: '#ffffff' },
    sync(o, m) {
      if (o.src === '' || o.src == null) return; const t = m.get(String(o.src)); if (!t || t === o) return; const d = PD.shapes[t.type]; if (!d || !d.fieldAt) return;
      const B = d.fieldAt(t, o.x, o.y); if (Math.hypot(B[0], B[1]) < 1e-15) return;
      o.ang = Math.round((-Math.atan2(B[1], B[0]) * R2D - (+o.rot || 0)) * 10) / 10;
    },
    fields: [{ k: 'src', t: 'obj', l: '场源(磁铁/导线/螺线管…)', of: (x) => !!(PD.shapes[x.type] || {}).fieldAt }, { k: 'ang', t: 'num', l: '指向°(N 极方向, 0右 90上)', step: 15 }, { k: 'r', t: 'num', l: '半径' }, { k: 'ring', t: 'bool', l: '外壳' }, { k: 'fill', t: 'color', l: '底色' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p) {
      const r = +p.r, a = -(+p.ang || 0) * D2R, c = Math.cos(a), s = Math.sin(a), w = r * 0.28, l = r * 0.86;
      let o = p.ring ? `<circle r="${f(r)}" fill="${p.fill}" ${S(p, { dash: 'solid', sw: Math.max(0.8, (+p.sw || 1.5) * 0.8) })}/>` : '';
      o += `<polygon points="${pt(l * c, l * s)} ${pt(-w * s, w * c)} ${pt(w * s, -w * c)}" fill="${RED}" ${S(p, { dash: 'solid', sw: 0.6 })}/><polygon points="${pt(-l * c, -l * s)} ${pt(-w * s, w * c)} ${pt(w * s, -w * c)}" fill="#ffffff" ${S(p, { dash: 'solid', sw: 0.6 })}/><circle r="1.5" fill="${p.stroke}"/>`;
      return o;
    },
  });

  /* ================= 长直导线磁场（端视，可叠加匀强场） ================= */
  const wireList = (p) => parseRows(p.wires, 2).map((a) => ({ x: +a[0], y: +a[1], s: (a[2] || 'out').toLowerCase().startsWith('i') || a[2] === 'x' || a[2] === '×' ? -1 : 1, I: +a[3] || 1 }));
  const wireF = (Wl, bg, k) => (x, y) => { let bx = bg[0], by = bg[1]; Wl.forEach((w) => { const dx = x - w.x, dy = y - w.y, r2 = dx * dx + dy * dy + 1; bx += (k * w.s * w.I * dy) / r2; by += (-k * w.s * w.I * dx) / r2; }); return [bx, by]; };
  const wireSym = (p, x, y, s, r) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#ffffff" ${sd(p)}/>` + (s > 0 ? `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 0.25)}" fill="${p.stroke}"/>` : `<path d="M${pt(x - r * 0.6, y - r * 0.6)}l${f(r * 1.2)},${f(r * 1.2)}M${pt(x - r * 0.6, y + r * 0.6)}l${f(r * 1.2)},${f(-r * 1.2)}" ${S(p, { dash: 'solid', sw: 1.4 })}/>`);
  PD.register({
    type: 'wirefield', name: '电流磁场(端视 ⊙ ⊗, 可叠加匀强场)',
    defaults: { wires: '0,0,out', W: 280, H: 240, n: 4, sp: 26, bgB: 0, bgDir: 0, nb: 7, force: false, fl: 'F', wr: 9, arrows: 2, frame: false, fc: '#000000', fw: 1.1, lsize: 16, I: 'I', lab: '' },
    fields: [
      { k: 'wires', t: 'area', l: '导线(每行 x, y, out/in, 电流)', ph: '例: 0,0,out\n例: -50,0,out\n例: 50,0,in' },
      { k: 'W', t: 'num', l: '区域宽' }, { k: 'H', t: 'num', l: '区域高' }, { k: 'n', t: 'num', l: '每根导线的场线圈数' }, { k: 'sp', t: 'num', l: '圈间距' },
      { k: 'bgB', t: 'num', l: '叠加匀强场强度(0=无; 弓形磁场用 1)', step: 0.1, rebuild: true }, { k: 'bgDir', t: 'num', l: '匀强场方向°', step: 15, when: (p) => +p.bgB }, { k: 'nb', t: 'num', l: '匀强场线数', when: (p) => +p.bgB },
      { k: 'force', t: 'bool', l: '画导线受力 F' }, { k: 'fl', t: 'text', l: '力的标签', when: (p) => p.force },
      { k: 'wr', t: 'num', l: '导线圈大小' }, { k: 'arrows', t: 'num', l: '每条线箭头数' }, { k: 'frame', t: 'bool', l: '边框' }, { k: 'lab', t: 'text', l: '导线标签' },
      { k: 'fc', t: 'color', l: '场线颜色' }, { k: 'fw', t: 'num', l: '场线线宽', step: 0.1 }, { k: 'lsize', t: 'num', l: '标签字号' },
    ],
    fieldAt: fieldAtLocal((o, x, y) => { const b = +o.bgB || 0, a = (+o.bgDir || 0) * D2R; return wireF(wireList(o), [b * Math.cos(a) * 0.02, -b * Math.sin(a) * 0.02], 1)(x, y); }),
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const Wl = wireList(p), W = +p.W, H = +p.H, bb = [-W / 2, -H / 2, W / 2, H / 2], b = +p.bgB || 0, ba = (+p.bgDir || 0) * D2R, sp = +p.sp, n = Math.max(1, Math.round(+p.n));
      const bg = [b * Math.cos(ba) * 0.02, -b * Math.sin(ba) * 0.02], F = wireF(Wl, bg, 1);
      let lines = [];
      if (!b && Wl.length === 1) { const w = Wl[0]; for (let k = 1; k <= n; k++) { const r = k * sp, P = []; for (let i = 0; i <= 72; i++) { const t = (TAU * i) / 72 * -w.s; P.push([w.x + r * Math.cos(t), w.y + r * Math.sin(t)]); } P.s = 1; lines.push(P); } }
      else {
        const seeds = [];
        if (b) { const u = [Math.cos(ba), -Math.sin(ba)], v = [-u[1], u[0]], D = Math.hypot(W, H) / 2, nb = Math.max(2, Math.round(+p.nb)); for (let k = 0; k < nb; k++) { const t = -0.5 + (k + 0.5) / nb, c = [v[0] * t * Math.min(W, H) * 1.1, v[1] * t * Math.min(W, H) * 1.1]; seeds.push([c[0] - u[0] * D, c[1] - u[1] * D, 1]); } }
        const seedR = b ? Math.max(1, Math.round(n / 2)) : n;
        const cx0 = Wl.reduce((t, w) => t + w.x, 0) / (Wl.length || 1);
        Wl.forEach((w) => { const dO = Wl.length > 1 && Math.abs(w.x - cx0) > 1 ? Math.sign(w.x - cx0) : 1; for (let k = 1; k <= seedR; k++) seeds.push([w.x + dO * k * sp * (b ? 0.6 : 1), w.y, 1]); });
        lines = L.fieldLines(F, seeds.map((q) => { const x = clamp(q[0], bb[0] + 1, bb[2] - 1), y = clamp(q[1], bb[1] + 1, bb[3] - 1); return [x, y, 1]; }), { bb, closed: true, h: 2 });
      }
      const cid = ctx.id + '-wf'; ctx.defs.push(`<clipPath id="${cid}"><rect x="${f(-W / 2)}" y="${f(-H / 2)}" width="${f(W)}" height="${f(H)}"/></clipPath>`);
      let o = `<g clip-path="url(#${cid})">${L.drawLines(p, lines, { arrows: +p.arrows })}</g>`;
      Wl.forEach((w) => (o += wireSym(p, w.x, w.y, w.s, +p.wr)));
      if (p.force && b) Wl.forEach((w) => { const Fv = [w.s * bg[1], -w.s * bg[0]], l = Math.hypot(Fv[0], Fv[1]) || 1, len = 46; o += L.arrow(p, w.x, w.y - (Fv[1] < 0 ? +p.wr : -+p.wr), w.x + (Fv[0] / l) * len, w.y + (Fv[1] / l) * len - (Fv[1] < 0 ? +p.wr : -+p.wr), { sw: 2.2 }) + (p.fl ? T(ctx, p.fl, w.x + (Fv[0] / l) * (len + 14) + 10, w.y + (Fv[1] / l) * (len + 14), { size: p.lsize, color: p.stroke, halo: true }) : ''); });
      if (p.lab && Wl[0]) o += T(ctx, p.lab, Wl[0].x + +p.wr + 8, Wl[0].y + +p.wr + 8, { size: p.lsize, anchor: 'start', color: p.stroke, halo: true });
      if (p.frame) o += `<rect x="${f(-W / 2)}" y="${f(-H / 2)}" width="${f(W)}" height="${f(H)}" fill="none" ${S(p, { dash: 'solid', sw: 0.8 })}/>`;
      return o;
    },
  });
  /* 长直导线（侧视，穿过卡纸） */
  PD.register({
    type: 'wireside', name: '长直导线穿过卡纸(侧视)',
    defaults: { H: 220, cw: 220, n: 3, sp: 26, cur: 'up', card: true, compass: 0, I: 'I', lsize: 16, tilt: 0.32 },
    ports: (p) => [[0, -(+p.H) / 2, 0, -1], [0, +p.H / 2, 0, 1]],
    fields: [{ k: 'H', t: 'num', l: '导线长' }, { k: 'cw', t: 'num', l: '卡纸宽' }, { k: 'n', t: 'num', l: '场线圈数' }, { k: 'sp', t: 'num', l: '圈间距' }, { k: 'tilt', t: 'range', l: '俯视程度', min: 0.15, max: 0.6, step: 0.01 },
      { k: 'cur', t: 'sel', l: '电流方向', o: [['up', '向上'], ['down', '向下']] }, { k: 'card', t: 'bool', l: '卡纸' }, { k: 'compass', t: 'num', l: '卡纸上指南针数', min: 0 }, { k: 'I', t: 'text', l: '电流标签' }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const H = +p.H, k = +p.tilt, cw = +p.cw / 2, up = p.cur !== 'down', n = Math.max(1, Math.round(+p.n));
      let o = '';
      if (p.card) o += `<polygon points="${pt(-cw, 0)} ${pt(-cw * 0.7, -cw * k)} ${pt(cw, -cw * k)} ${pt(cw * 0.7, 0)}" fill="#f4f1e8" ${sd(p)}/>`;
      o += `<line x1="0" y1="${f(-cw * k * 0.5)}" x2="0" y2="${f(-H / 2)}" ${S(p, { dash: 'solid', sw: 3 })}/>`;
      for (let j = 1; j <= n; j++) {
        const rx = j * +p.sp, ry = rx * k, cy = -cw * k * 0.5;
        o += `<ellipse cx="0" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="none" ${S(p, { dash: 'solid', sw: 1 })}/>`;
        const sg = up ? 1 : -1; o += PD.arrowHead(sg * 4, cy + ry, sg > 0 ? 0 : Math.PI, 7, 'tri', p.stroke, 1) + PD.arrowHead(-sg * 4, cy - ry, sg > 0 ? Math.PI : 0, 7, 'tri', p.stroke, 1);
      }
      for (let c = 0; c < Math.round(+p.compass || 0); c++) { const t = (TAU * c) / Math.round(+p.compass), rr = (n + 0.5) * +p.sp, x = rr * Math.cos(t), y = -cw * k * 0.5 + rr * k * Math.sin(t), dir = Math.atan2(k * Math.cos(t) * (up ? 1 : -1), -Math.sin(t) * (up ? 1 : -1)) * R2D * -1; o += `<g transform="translate(${pt(x, y)}) scale(1,${f(Math.max(0.45, k * 1.6))})">${PD.shapes.compass.render({ r: 9, ang: dir, ring: true, fill: '#fff', stroke: p.stroke, sw: 1 })}</g>`; }
      o += `<line x1="0" y1="${f(H / 2)}" x2="0" y2="${f(-cw * k * 0.5)}" ${S(p, { dash: 'solid', sw: 3 })}/>`;
      o += PD.arrowHead(0, up ? -H * 0.3 : H * 0.3, up ? -Math.PI / 2 : Math.PI / 2, 10, 'tri', p.stroke, 2);
      if (p.I) o += T(ctx, p.I, 10, up ? -H * 0.32 : H * 0.32, { size: p.lsize, anchor: 'start', color: p.stroke });
      return o;
    },
  });

  /* ================= 螺线管 ================= */
  // 均匀磁化模型：两个端面上各分布 7 个磁极点
  const solPoles = (o) => { const h = +o.L / 2, r = +o.d / 2, s = o.pole === 'S' ? -1 : 1, P = []; for (let k = 0; k < 7; k++) { const y = -r * 0.85 + (r * 1.7 * k) / 6; P.push({ N: [s * h, y], S: [-s * h, y], m: 1 / 7 }); } return P; };
  PD.register({
    type: 'solenoid', name: '螺线管/线圈(电流 → N S, 磁场线)',
    defaults: { L: 200, d: 64, n: 10, pole: 'N', core: false, field: 'inside', nl: 4, nOut: 4, Wf: 520, Hf: 400, cur: true, poles: true, lead: 30, fc: '#000000', fw: 1.1, lsize: 18, coil: '#000000' },
    handles: [['L', 'zero', 0.5]],
    ports: (p) => { const h = +p.L / 2, d = +p.d / 2, l = +p.lead; return [[-h, d + l, 0, 1], [h, d + l, 0, 1]]; },
    fields: [
      { k: 'L', t: 'num', l: '长度' }, { k: 'd', t: 'num', l: '直径' }, { k: 'n', t: 'num', l: '匝数' }, { k: 'pole', t: 'sel', l: '右端磁极(决定电流方向)', o: [['N', 'N'], ['S', 'S']] },
      { k: 'core', t: 'bool', l: '软铁心(电磁铁)' }, { k: 'field', t: 'sel', l: '磁场线', o: [['none', '不画'], ['inside', '管内(匀强)'], ['full', '管内 + 管外']], rebuild: true },
      { k: 'nl', t: 'num', l: '管内场线数', when: (p) => p.field !== 'none' }, { k: 'nOut', t: 'num', l: '管外每端场线数', when: (p) => p.field === 'full' },
      { k: 'Wf', t: 'num', l: '场线区域宽', when: (p) => p.field === 'full' }, { k: 'Hf', t: 'num', l: '场线区域高', when: (p) => p.field === 'full' },
      { k: 'cur', t: 'bool', l: '电流方向箭头' }, { k: 'poles', t: 'bool', l: '两端标 N S' }, { k: 'lead', t: 'num', l: '引线长(端口在末端)' },
      { k: 'coil', t: 'color', l: '线圈颜色' }, { k: 'fc', t: 'color', l: '场线颜色' }, { k: 'fw', t: 'num', l: '场线线宽', step: 0.1 }, { k: 'lsize', t: 'num', l: '字号' },
    ],
    fieldAt: fieldAtLocal((o, x, y) => (Math.abs(x) < +o.L / 2 && Math.abs(y) < +o.d / 2 ? [(o.pole === 'S' ? -1 : 1) * 1e-3, 0] : magF(solPoles(o))(x, y))),
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const h = +p.L / 2, r = +p.d / 2, n = Math.max(2, Math.round(+p.n)), pitch = (2 * h) / n, sR = p.pole === 'S' ? -1 : 1, ex = r * 0.28, col = p.coil;
      let o = '';
      if (p.field === 'full') {
        // 课本画法：从 N 端面出发、绕到 S 端面的闭合环 + 两端沿轴线伸出的直线
        const m = Math.max(1, Math.round(+p.nOut)), ln = [], ext = Math.min(+p.Wf / 2 - h, h * 0.9);
        for (let k = 0; k < m; k++) {
          const y0 = r * (0.85 - (0.6 * k) / Math.max(1, m - 1)), Hb = r * 0.6 + (k + 1) * Math.min(+p.Hf / 2 - r, r * 2.6) / m, c = h * (0.75 + 0.55 * (k + 1) / m);
          [1, -1].forEach((sv) => { const P = []; for (let i = 0; i <= 40; i++) { const t = i / 40, B3 = (a0, a1, a2, a3) => (1 - t) ** 3 * a0 + 3 * (1 - t) ** 2 * t * a1 + 3 * (1 - t) * t * t * a2 + t ** 3 * a3; P.push([sR * B3(h, h + c, -h - c, -h), sv * B3(y0, y0 + Hb * 1.33, y0 + Hb * 1.33, y0)]); } P.s = 1; ln.push(P); });
        }
        const ax1 = [[sR * h, 0], [sR * (h + ext), 0]], ax2 = [[-sR * (h + ext), 0], [-sR * h, 0]]; ax1.s = 1; ax2.s = 1; ln.push(ax1, ax2);
        o += L.drawLines(p, ln, { arrows: 1 });
      }
      // 后半圈
      let back = '';
      for (let i = 0; i < n; i++) { const x = -h + (i + 0.5) * pitch; back += `M${pt(x + pitch * 0.5, -r)}C${pt(x + pitch * 0.5 + ex, -r)} ${pt(x + ex, r)} ${pt(x, r)}`; }
      o += `<path d="${back}" fill="none" stroke="${col}" stroke-width="${f(Math.max(0.8, (+p.sw || 1.5) * 0.7))}" stroke-opacity="0.45"/>`;
      if (p.core) o += `<rect x="${f(-h - 16)}" y="${f(-r * 0.55)}" width="${f(2 * h + 32)}" height="${f(r * 1.1)}" rx="3" fill="#a3a8ae" ${sd(p)}/>`;
      if (p.field !== 'none') { const m = Math.max(1, Math.round(+p.nl)), ln = []; for (let k = 0; k < m; k++) { const y = -r * 0.7 + (r * 1.4 * k) / Math.max(1, m - 1), P = [[-h - (p.field === 'full' ? 4 : 18), y], [h + (p.field === 'full' ? 4 : 18), y]]; P.s = sR; ln.push(P); } o += L.drawLines(p, ln, { arrows: 1 }); }
      // 前半圈 + 电流箭头（N 在右 → 前侧电流向下）
      let front = '';
      for (let i = 0; i < n; i++) { const x = -h + (i + 0.5) * pitch; front += `M${pt(x, r)}C${pt(x - ex, r)} ${pt(x + pitch * 0.5 - ex, -r)} ${pt(x + pitch * 0.5, -r)}`; }
      o += `<path d="${front}" fill="none" stroke="${col}" stroke-width="${f((+p.sw || 1.5) * 1.1)}"/>`;
      const x0 = -h + 0.5 * pitch, x1 = -h + (n - 0.5) * pitch + pitch * 0.5;
      o += `<path d="M${pt(x0, r)}V${f(r + +p.lead)}M${pt(x1, -r)}C${pt(x1 + ex * 2, -r)} ${pt(h + 4, 0)} ${pt(h, r + 6)}V${f(r + +p.lead)}" fill="none" stroke="${col}" stroke-width="${f((+p.sw || 1.5) * 1.1)}"/>`;
      if (p.cur) for (let i = 1; i < n; i += Math.max(2, Math.floor(n / 3))) { const x = -h + (i + 0.5) * pitch + pitch * 0.25 - ex * 0.5; o += PD.arrowHead(x + (sR > 0 ? 0 : 0), sR > 0 ? 5 : -5, sR > 0 ? Math.PI / 2 + 0.25 : -Math.PI / 2 + 0.25, 8, 'tri', '#d62828', 1.2); }
      if (p.poles) o += T(ctx, sR > 0 ? 'N' : 'S', h + 24, -r - 10, { size: p.lsize, italic: false, color: p.stroke, halo: true }) + T(ctx, sR > 0 ? 'S' : 'N', -h - 24, -r - 10, { size: p.lsize, italic: false, color: p.stroke, halo: true });
      return o;
    },
  });

  /* ================= 洛伦兹力：带电粒子在磁场中的轨迹 ================= */
  PD.register({
    type: 'lorentz', name: '带电粒子在磁场中(轨迹)',
    defaults: { W: 220, H: 200, B: 'in', q: '+', R: 90, y0: 150, ang: 0, ext: 80, gap: 26, vArrow: true, fArrow: true, pl: '', lsize: 16, tc: '#d62828', tw: 1.6 },
    fields: [
      { k: 'W', t: 'num', l: '磁场区宽' }, { k: 'H', t: 'num', l: '磁场区高' }, { k: 'B', t: 'sel', l: '磁场', o: [['in', '× 入纸面'], ['out', '• 出纸面']] }, { k: 'q', t: 'sel', l: '粒子电荷', o: [['+', '正'], ['-', '负']] },
      { k: 'R', t: 'num', l: '轨迹半径 r = mv/(qB)' }, { k: 'y0', t: 'num', l: '入射点高度(从顶边)' }, { k: 'ang', t: 'num', l: '入射方向°', step: 5 }, { k: 'ext', t: 'num', l: '射出后长度' },
      { k: 'gap', t: 'num', l: '× / • 间距' }, { k: 'vArrow', t: 'bool', l: '速度 v' }, { k: 'fArrow', t: 'bool', l: '磁力 F(指向圆心)' }, { k: 'pl', t: 'text', l: '粒子标签' },
      { k: 'tc', t: 'color', l: '轨迹颜色' }, { k: 'tw', t: 'num', l: '轨迹线宽', step: 0.2 }, { k: 'lsize', t: 'num', l: '字号' },
    ],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const W = +p.W, H = +p.H, R = Math.max(5, +p.R), qs = p.q === '-' ? -1 : 1, Bz = p.B === 'out' ? 1 : -1, a = (+p.ang || 0) * D2R;
      let o = PD.shapes.ufield.render(Object.assign({}, PD.shapes.ufield.defaults, { kind: p.B, W, H, gap: +p.gap, label: 'B', stroke: p.stroke, sw: p.sw }), ctx).replace(/translate\(0,0\)/g, '');
      o = `<g transform="translate(${f(W / 2)},${f(H / 2)})">${o}</g>`;
      // 数学坐标(y 向上)中计算，再翻转
      const P0 = [0, H - +p.y0], v = [Math.cos(a), Math.sin(a)], Fd = [qs * v[1] * Bz, -qs * v[0] * Bz], c = [P0[0] + Fd[0] * R, P0[1] + Fd[1] * R];
      const turn = qs * Bz > 0 ? -1 : 1; // 顺/逆时针
      let th = Math.atan2(P0[1] - c[1], P0[0] - c[0]); const pts = [[P0[0], -P0[1]]]; let last = P0, dir = v;
      for (let i = 0; i < 720; i++) {
        th += turn * (0.5 * D2R); const q = [c[0] + R * Math.cos(th), c[1] + R * Math.sin(th)];
        if (q[0] < -0.01 || q[0] > W + 0.01 || q[1] < -0.01 || q[1] > H + 0.01) { dir = [-turn * Math.sin(th), turn * Math.cos(th)]; break; }
        pts.push([q[0], -q[1]]); last = q; dir = [-turn * Math.sin(th), turn * Math.cos(th)];
      }
      const toSvg = (q) => [q[0], H - q[1]];
      let d = 'M' + pts.map((q) => pt(q[0], q[1] + H)).join('L');
      const E = [last[0] + dir[0] * +p.ext, last[1] + dir[1] * +p.ext], Es = toSvg(E), Ls = toSvg(last);
      d += `L${pt(Es[0], Es[1])}`;
      const s0 = toSvg(P0);
      o += `<line x1="${f(s0[0] - v[0] * 60)}" y1="${f(s0[1] + v[1] * 60)}" x2="${f(s0[0])}" y2="${f(s0[1])}" stroke="${p.tc}" stroke-width="${f(+p.tw)}"/><path d="${d}" fill="none" stroke="${p.tc}" stroke-width="${f(+p.tw)}"/>`;
      o += PD.arrowHead(Es[0], Es[1], Math.atan2(-dir[1], dir[0]), 9, 'tri', p.tc, 1.4);
      o += `<circle cx="${f(s0[0] - v[0] * 60)}" cy="${f(s0[1] + v[1] * 60)}" r="6" fill="${qs > 0 ? '#fde2e0' : '#dfe7fb'}" ${sd(p)}/>` + signMark(s0[0] - v[0] * 60, s0[1] + v[1] * 60, qs, 3.2, 1.5);
      if (p.vArrow) o += L.arrow(p, s0[0] - v[0] * 46, s0[1] + v[1] * 46 - 14, s0[0] - v[0] * 46 + v[0] * 34, s0[1] + v[1] * 46 - 14 - v[1] * 34, { sw: 1.4 }) + T(ctx, 'v', s0[0] - v[0] * 30, s0[1] + v[1] * 30 - 28, { size: p.lsize, color: p.stroke });
      if (p.fArrow) { const cs = toSvg(c), mid = pts[Math.floor(pts.length / 3)] || pts[0], m = [mid[0], mid[1] + H], u = [cs[0] - m[0], cs[1] - m[1]], l = Math.hypot(u[0], u[1]) || 1; o += L.arrow(p, m[0], m[1], m[0] + (u[0] / l) * 36, m[1] + (u[1] / l) * 36, { sw: 1.6 }) + T(ctx, 'F', m[0] + (u[0] / l) * 48, m[1] + (u[1] / l) * 48, { size: p.lsize, color: p.stroke, halo: true }); }
      if (p.pl) o += T(ctx, p.pl, s0[0] - v[0] * 60, s0[1] + v[1] * 60 + 16, { size: p.lsize, color: p.stroke });
      void Ls;
      return o;
    },
  });
  /* 速度选择器 */
  PD.register({
    type: 'vselect', name: '速度选择器(E 与 B 复合)',
    defaults: { L: 260, gap: 120, B: 'in', paths: 'all', labels: true, lsize: 15, tc: '#d62828' },
    fields: [{ k: 'L', t: 'num', l: '板长' }, { k: 'gap', t: 'num', l: '板距' }, { k: 'B', t: 'sel', l: '磁场', o: [['in', '× 入纸面'], ['out', '• 出纸面']] },
      { k: 'paths', t: 'sel', l: '轨迹', o: [['all', 'v = E/B, v > E/B, v < E/B'], ['eq', '只有 v = E/B']] }, { k: 'labels', t: 'bool', l: '标注' }, { k: 'tc', t: 'color', l: '轨迹颜色' }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const Lp = +p.L, g = +p.gap / 2;
      let o = `<g transform="translate(${f(Lp / 2)},0)">${PD.shapes.ufield.render(Object.assign({}, PD.shapes.ufield.defaults, { kind: p.B, W: Lp, H: 2 * g - 16, gap: 30, frame: 'none', label: '', stroke: p.stroke, sw: p.sw }), ctx)}</g>`;
      o += `<rect x="0" y="${f(-g - 8)}" width="${f(Lp)}" height="8" fill="#a9aeb5" ${sd(p)}/><rect x="0" y="${f(g)}" width="${f(Lp)}" height="8" fill="#a9aeb5" ${sd(p)}/>`;
      for (let k = 0; k < 6; k++) o += signMark(18 + (k * (Lp - 36)) / 5, -g - 14, 1, 3.5, 1.4) + signMark(18 + (k * (Lp - 36)) / 5, g + 14, -1, 3.5, 1.4);
      const tr = (bend, lab) => { const P = []; for (let i = 0; i <= 40; i++) { const x = -60 + ((Lp + 120) * i) / 40, t = clamp(x / Lp, 0, 1), y = x < 0 ? 0 : bend * t * t * g * 0.85 + (x > Lp ? 2 * bend * g * 0.85 * ((x - Lp) / Lp) : 0); P.push([x, y]); } const e = P[P.length - 1], b = P[P.length - 2]; return `<polyline points="${PD.ptsStr(P)}" fill="none" stroke="${p.tc}" stroke-width="1.6"/>` + PD.arrowHead(e[0], e[1], Math.atan2(e[1] - b[1], e[0] - b[0]), 9, 'tri', p.tc, 1.4) + (p.labels && lab ? T(ctx, lab, e[0] + 8, e[1], { size: p.lsize, anchor: 'start', color: p.stroke }) : ''); };
      o += tr(0, 'v = \\frac{E}{B}');
      if (p.paths === 'all') { const sB = p.B === 'in' ? 1 : -1; o += tr(-sB * 0.9, 'v > \\frac{E}{B}') + tr(sB * 0.9, 'v < \\frac{E}{B}'); }
      o += `<circle cx="-60" cy="0" r="6" fill="#fde2e0" ${sd(p)}/>` + signMark(-60, 0, 1, 3.2, 1.5);
      if (p.labels) o += T(ctx, 'E', Lp + 18, -g, { size: p.lsize, color: p.stroke }) + L.arrow(p, Lp + 30, -g + 6, Lp + 30, g - 6, { sw: 1.2 }) + T(ctx, 'B', Lp / 2, -g - 26, { size: p.lsize, color: p.stroke });
      return o;
    },
  });
  /* 电流天平（截图 7 的示意） */
  PD.register({
    type: 'curbalance', name: '电流天平(电子秤)', defaults: { labels: true, reading: '0.00 g', lsize: 13 },
    fields: [{ k: 'reading', t: 'text', l: '电子秤读数' }, { k: 'labels', t: 'bool', l: '文字标注' }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const ls = p.lsize, ylw = '#e8b400', pur = '#8e5cc9', th = L.thin(p, 0.8), A = (x, y) => pt(x, y);
      const W = [90, 140], X = [270, 262], Y = [600, 160], Z = [380, 62];
      let o = '';
      // 电子秤
      o += `<polygon points="${A(380, 150)} ${A(560, 82)} ${A(640, 128)} ${A(470, 205)}" fill="#e6e8eb" ${sd(p)}/><polygon points="${A(380, 150)} ${A(470, 205)} ${A(470, 232)} ${A(380, 176)}" fill="#c9ccd0" ${sd(p)}/><polygon points="${A(470, 205)} ${A(640, 128)} ${A(640, 154)} ${A(470, 232)}" fill="#b5b9be" ${sd(p)}/>`;
      o += `<ellipse cx="480" cy="110" rx="60" ry="20" fill="#d2d5d9" ${sd(p)}/><polygon points="${A(490, 182)} ${A(530, 166)} ${A(530, 176)} ${A(490, 192)}" fill="#dfe9d4" ${th}/><polygon points="${A(545, 160)} ${A(580, 146)} ${A(580, 156)} ${A(545, 170)}" fill="#dfe9d4" ${th}/>`;
      o += T(ctx, p.reading, 510, 179, { size: 8, italic: false, color: '#111' });
      // 绝缘管 P 与 R0
      o += `<rect x="460" y="94" width="34" height="10" rx="5" fill="#ffffff" transform="rotate(-18 477 99)" ${sd(p)}/>` + L.arrow(p, 477, 92, 477, 30, { color: '#d62828', sw: 1.6 }) + T(ctx, 'R_0', 486, 24, { size: ls, anchor: 'start', color: p.stroke });
      // 金属支架 + 棒
      o += `<polygon points="${A(230, 112)} ${A(288, 92)} ${A(288, 150)} ${A(230, 172)}" fill="#8a8f96" ${sd(p)}/><polygon points="${A(392, 196)} ${A(450, 176)} ${A(450, 232)} ${A(392, 254)}" fill="#8a8f96" ${sd(p)}/>`;
      o += `<line x1="256" y1="132" x2="420" y2="212" stroke="#a7acb2" stroke-width="7" stroke-linecap="round"/><line x1="256" y1="132" x2="420" y2="212" stroke="#d9dce0" stroke-width="2" stroke-linecap="round"/>`;
      // U 形磁铁（在 W-X 边上）
      o += `<path d="M130,190 L130,280 Q130,300 150,300 L230,300 Q250,300 250,280 L250,230 L232,230 L232,276 Q232,282 226,282 L154,282 Q148,282 148,276 L148,190 Z" fill="#9ccc65" ${sd(p)}/><polygon points="${A(148, 190)} ${A(166, 180)} ${A(166, 270)} ${A(148, 276)}" fill="#7cb342" ${th}/>`;
      o += `<rect x="184" y="182" width="14" height="40" fill="#5c6bc0" ${th}/><rect x="216" y="210" width="14" height="40" fill="#e53935" ${th}/>`;
      // 导线框 W X Y Z
      o += `<polygon points="${A(...W)} ${A(...X)} ${A(...Y)} ${A(...Z)}" fill="none" stroke="${ylw}" stroke-width="3" stroke-linejoin="round"/>`;
      [[Z, W], [W, X], [X, Y], [Y, Z]].forEach(([a, b]) => { const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; o += PD.arrowHead(m[0], m[1], Math.atan2(b[1] - a[1], b[0] - a[0]), 9, 'tri', pur, 1); });
      o += `<path d="M228,96 C180,70 140,60 100,80" fill="none" stroke="#222" stroke-width="1.6"/><path d="M440,214 C460,250 470,270 466,290" fill="none" stroke="#222" stroke-width="1.6"/>`;
      if (p.labels) {
        const t = (s, x, y, a) => T(ctx, s, x, y, { size: ls + 1, anchor: a, color: p.stroke, halo: true }), z = (s, x, y, a) => T(ctx, s, x, y, { size: ls, anchor: a, italic: false, color: p.stroke, halo: true });
        o += t('W', 76, 140, 'end') + t('X', 272, 280) + t('Y', 612, 162, 'start') + t('Z', 380, 48) + t('C', 222, 86) + t('D', 448, 242, 'start');
        o += z('金属支架', 300, 46) + `<path d="M300,54L262,104M300,54L420,186" fill="none" ${S(p, { dash: 'solid', sw: 0.6 })}/>` + z('电子秤', 560, 222, 'start') + z('绝缘胶管 P', 520, 60, 'start') + z('南极', 262, 212, 'start') + z('北极', 196, 318) + z('磁铁', 120, 236, 'end');
      }
      return o;
    },
  });

  /* ================= 预设 ================= */
  PD.preset(C1, '正电荷(电场线)', 'efield', { charges: '0,0,1', W: 240, H: 240, per: 12 });
  PD.preset(C1, '负电荷(电场线)', 'efield', { charges: '0,0,-1', W: 240, H: 240, per: 12 });
  PD.preset(C1, '等量异号电荷', 'efield', { charges: '-70,0,1\n70,0,-1', W: 340, H: 240, per: 12 });
  PD.preset(C1, '等量同号电荷', 'efield', { charges: '-70,0,1\n70,0,1', W: 340, H: 240, per: 12 });
  PD.preset(C1, '不等量电荷(+2q, −q)', 'efield', { charges: '-60,0,2\n70,0,-1', W: 360, H: 260, per: 8 });
  PD.preset(C1, '点电荷(无场线)', 'efield', { charges: '0,0,1', W: 40, H: 40, per: 0 });
  PD.preset(C1, '匀强电场', 'ufield', { kind: 'lines', dir: -90, label: 'E', frame: 'none', W: 200, H: 140 });
  PD.preset(C1, '平行金属板(抽象)', 'plates', {});
  PD.preset(C1, '平行金属板(电场线 + 板面电荷)', 'plates', { field: true, charges: true, pts: '', terms: false, dim: '' });
  PD.preset(C1, '平行金属板(实物)', 'platesreal', {});
  PD.preset(C1, '金属球(中性)', 'msphere', { mode: 'none' });
  PD.preset(C1, '金属球(感应: 近负远正)', 'msphere', {});
  PD.preset(C1, '金属球(接地后只剩近端电荷)', 'msphere', { mode: 'near' });
  PD.preset(C1, '金属球(带负电, 均匀)', 'msphere', { mode: 'uni', ns: -1, n: 3 });
  PD.preset(C1, '带电棒(正)', 'crod', { rot: -40 });
  PD.preset(C1, '带电棒(负)', 'crod', { rot: -40, sign: -1, fill: '#9ec5e8' });
  PD.preset(C1, '手(触碰接地)', 'hand', {});
  PD.preset(C1, '范德格拉夫起电机', 'vdg', {});
  const kid = (id, type, x, y, props) => Object.assign({ id: 'e-' + id, type, x, y, rot: 0, scale: 1, flip: false, snap: 'auto' }, PD.STYLE_DEF, PD.clone(PD.shapes[type].defaults), props || {});
  PD.preset(C1, '感应起电(两个金属球)', 'group', { bw: 330, bh: 170, children: [
    kid('r', 'crod', 0, 120, { rot: -40, L: 100, n: 3 }), kid('a', 'msphere', 130, 60, { mode: 'near', near: 'left', ns: -1, n: 3, label: 'A' }), kid('b', 'msphere', 226, 60, { mode: 'near', near: 'right', ns: 1, n: 3, label: 'B' }),
    kid('t', 'text', 178, 182, { text: '绝缘支架', size: 13, italic: false }),
  ] });
  PD.preset(C1, '感应与接地起电', 'group', { bw: 300, bh: 220, children: [
    kid('r', 'crod', 0, 160, { rot: -40, L: 100, n: 3 }), kid('a', 'msphere', 140, 100, { mode: 'polar', n: 3, label: '', sideL: 'A', sideR: 'B' }),
    kid('w', 'bezier', 170, 60, { c1x: 40, c1y: -70, c2x: 100, c2y: -40, x2: 130, y2: 110, a0: 'tri' }), kid('g', 'node', 300, 170, { kind: 'earth' }),
  ] });
  PD.preset(C2, '条形磁铁(磁场线)', 'magsys', {});
  PD.preset(C2, '条形磁铁(无场线)', 'magsys', { lines: false, W: 140, H: 40 });
  PD.preset(C2, '两磁铁 N-S 相对(相吸)', 'magsys', { mags: '-95,0,0,110\n95,0,0,110', W: 420, H: 260, per: 10 });
  PD.preset(C2, '两磁铁 N-N 相对(相斥)', 'magsys', { mags: '-95,0,0,110\n95,0,180,110', W: 420, H: 260, per: 10 });
  PD.preset(C2, '马蹄形磁铁', 'horseshoe', {});
  PD.preset(C2, '一对磁极(匀强场)', 'magpair', {});
  PD.preset(C2, '一对磁极(弧面, 径向场)', 'magpair', { face: 'curved', gap: 180 });
  PD.preset(C2, '指南针', 'compass', {});
  PD.preset(C2, '匀强磁场(× 入纸面)', 'ufield', { kind: 'in' });
  PD.preset(C2, '匀强磁场(• 出纸面)', 'ufield', { kind: 'out' });
  PD.preset(C2, '匀强磁场(箭头)', 'ufield', { kind: 'lines', dir: 0, frame: 'none' });
  PD.preset(C2, '长直导线磁场(⊙ 出纸面)', 'wirefield', {});
  PD.preset(C2, '长直导线磁场(⊗ 入纸面)', 'wirefield', { wires: '0,0,in' });
  PD.preset(C2, '两根导线(同向电流)', 'wirefield', { wires: '-45,0,out\n45,0,out', W: 320, H: 240, n: 4, sp: 18 });
  PD.preset(C2, '两根导线(反向电流)', 'wirefield', { wires: '-45,0,out\n45,0,in', W: 320, H: 240, n: 4, sp: 18 });
  PD.preset(C2, '长直导线(侧视, 卡纸)', 'wireside', {});
  PD.preset(C2, '长直导线(侧视, 指南针)', 'wireside', { compass: 4, n: 2 });
  PD.preset(C2, '螺线管(管内匀强场)', 'solenoid', {});
  PD.preset(C2, '螺线管(管内外磁场线)', 'solenoid', { field: 'full', n: 9 });
  PD.preset(C2, '电磁铁(软铁心)', 'solenoid', { core: true, field: 'none', n: 12 });
  PD.preset(C2, '电磁铁电路', 'group', { loose: true, bw: 260, bh: 190, children: [
    kid('s', 'solenoid', 130, 40, { core: true, field: 'none', n: 10, L: 180, d: 54, lead: 34 }), kid('b', 'comp', 90, 160, { kind: 'cell', L: 70 }), kid('k', 'comp', 190, 160, { kind: 'switch', L: 70 }),
    kid('w1', 'wire', 0, 0, { a0: 'e-s', ap: 0, b0: 'e-b', bp: 0 }), kid('w2', 'wire', 0, 0, { a0: 'e-b', ap: 1, b0: 'e-k', bp: 0 }), kid('w3', 'wire', 0, 0, { a0: 'e-k', ap: 1, b0: 'e-s', bp: 1 }),
  ] });
  PD.preset(C3, '弓形磁场(导线 + 匀强场)', 'wirefield', { wires: '0,0,out', bgB: 1, bgDir: 0, force: true, W: 320, H: 240, nb: 9, n: 3, sp: 22, arrows: 1 });
  PD.preset(C3, '弓形磁场(电流入纸面)', 'wirefield', { wires: '0,0,in', bgB: 1, bgDir: 0, force: true, W: 320, H: 240, nb: 9, n: 3, sp: 22, arrows: 1 });
  PD.preset(C3, '平行导线之间的力', 'wirefield', { wires: '-50,0,out\n50,0,out', W: 320, H: 240, n: 3, sp: 18, arrows: 1 });
  PD.preset(C3, '弗林明左手定则(F B I)', 'axes3d', { proj: 'ortho', az: 35, el: 20, xl: '\\bf{B}', yl: '\\bf{F}', zl: '\\bf{I}', ol: '', len: 110 });
  PD.preset(C3, '带电粒子在磁场中(正电荷)', 'lorentz', {});
  PD.preset(C3, '带电粒子在磁场中(负电荷)', 'lorentz', { q: '-', y0: 50 });
  PD.preset(C3, '速度选择器', 'vselect', {});
  PD.preset(C3, '电流天平(电子秤)', 'curbalance', {});
})();
