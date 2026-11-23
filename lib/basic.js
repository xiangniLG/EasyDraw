/* 通用素材库 · 基础几何 */
(function () {
  'use strict';
  const f = PD.f, S = PD.strokeAttr, T = PD.tex;
  const CAT = '通用/基础几何';
  const labelFields = [
    { k: 'label', t: 'text', l: '标签' },
    { k: 'lsize', t: 'num', l: '标签字号' },
  ];
  const arrowFields = [
    { k: 'a0', t: 'sel', l: '起点端头', o: PD.ARROWS },
    { k: 'a1', t: 'sel', l: '终点端头', o: PD.ARROWS },
    { k: 'ah', t: 'num', l: '箭头大小(0=自动)', step: 1 },
  ];
  // 画一条带端头的路径（直线段，用于收缩端点）
  function ends(p, x0, y0, ang0, x1, y1, ang1) {
    const ah = PD.ahSize(p);
    return PD.arrowHead(x0, y0, ang0, ah, p.a0, p.stroke, p.sw) + PD.arrowHead(x1, y1, ang1, ah, p.a1, p.stroke, p.sw);
  }

  /* ===== 直线 / 箭头 ===== */
  PD.register({
    type: 'line', name: '线段/矢量',
    defaults: { x2: 150, y2: 0, a0: 'none', a1: 'none', ah: 0, mid: false, label: '', lpos: 0.5, loff: -14, lsize: 18 },
    handles: [['x2', 'y2']], originHandle: true,
    fields: [
      { k: 'x2', t: 'num', l: '终点 Δx' }, { k: 'y2', t: 'num', l: '终点 Δy' },
      ...arrowFields, { k: 'mid', t: 'bool', l: '中点箭头(光线/电流)' },
      ...labelFields, { k: 'lpos', t: 'range', l: '标签位置', min: 0, max: 1, step: 0.05 }, { k: 'loff', t: 'num', l: '标签偏移' },
    ],
    render(p, ctx) {
      const L = Math.hypot(p.x2, p.y2) || 1e-6, ux = p.x2 / L, uy = p.y2 / L, ang = Math.atan2(p.y2, p.x2), ah = PD.ahSize(p);
      const s0 = PD.inset(p.a0) * ah, s1 = PD.inset(p.a1) * ah;
      let o = `<line x1="${f(ux * s0)}" y1="${f(uy * s0)}" x2="${f(p.x2 - ux * s1)}" y2="${f(p.y2 - uy * s1)}" ${S(p)}/>`;
      o += ends(p, 0, 0, ang + Math.PI, p.x2, p.y2, ang);
      if (p.mid) o += PD.arrowHead(p.x2 / 2 + (ux * ah) / 2, p.y2 / 2 + (uy * ah) / 2, ang, ah, 'tri', p.stroke, p.sw);
      if (p.label) o += T(ctx, p.label, p.x2 * p.lpos - uy * p.loff, p.y2 * p.lpos + ux * p.loff, { size: p.lsize, color: p.stroke, halo: true });
      return o;
    },
  });

  /* ===== 贝塞尔曲线 ===== */
  PD.register({
    type: 'bezier', name: '曲线(贝塞尔)',
    defaults: { c1x: 50, c1y: -70, c2x: 120, c2y: -70, x2: 170, y2: 0, a0: 'none', a1: 'none', ah: 0, mid: false, label: '', lsize: 18 },
    handles: [['c1x', 'c1y'], ['c2x', 'c2y'], ['x2', 'y2']], originHandle: true, handleLines: [['o', 0], [1, 2]],
    fields: [
      { k: 'c1x', t: 'num', l: '控制点1 x' }, { k: 'c1y', t: 'num', l: '控制点1 y' },
      { k: 'c2x', t: 'num', l: '控制点2 x' }, { k: 'c2y', t: 'num', l: '控制点2 y' },
      { k: 'x2', t: 'num', l: '终点 x' }, { k: 'y2', t: 'num', l: '终点 y' },
      ...arrowFields, { k: 'mid', t: 'bool', l: '中点箭头' }, ...labelFields,
    ],
    render(p, ctx) {
      const ah = PD.ahSize(p);
      const a0 = Math.atan2(-p.c1y, -p.c1x), a1 = Math.atan2(p.y2 - p.c2y, p.x2 - p.c2x);
      let o = `<path d="M0,0C${f(p.c1x)},${f(p.c1y)} ${f(p.c2x)},${f(p.c2y)} ${f(p.x2)},${f(p.y2)}" fill="none" ${S(p)}/>`;
      o += ends(p, 0, 0, a0, p.x2, p.y2, a1);
      const B = (t, a, b, c, d) => (1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t * t * c + t ** 3 * d;
      const mx = B(0.5, 0, p.c1x, p.c2x, p.x2), my = B(0.5, 0, p.c1y, p.c2y, p.y2);
      const tx = B(0.52, 0, p.c1x, p.c2x, p.x2) - B(0.48, 0, p.c1x, p.c2x, p.x2), ty = B(0.52, 0, p.c1y, p.c2y, p.y2) - B(0.48, 0, p.c1y, p.c2y, p.y2);
      const ang = Math.atan2(ty, tx);
      if (p.mid) o += PD.arrowHead(mx + (Math.cos(ang) * ah) / 2, my + (Math.sin(ang) * ah) / 2, ang, ah, 'tri', p.stroke, p.sw);
      if (p.label) o += T(ctx, p.label, mx - Math.sin(ang) * 16, my + Math.cos(ang) * -16, { size: p.lsize, color: p.stroke, halo: true });
      return o;
    },
  });

  /* ===== 折线 / 多边形 ===== */
  PD.register({
    type: 'poly', name: '折线/多边形',
    defaults: { pts: '0,0 60,-50 120,0 180,-50', closed: false, smooth: false, a0: 'none', a1: 'none', ah: 0 },
    getHandles: (p) => PD.parsePts(p.pts),
    setHandle(p, i, x, y) { const P = PD.parsePts(p.pts); if (P[i]) { P[i] = [x, y]; p.pts = PD.ptsStr(P); } },
    fields: [
      { k: 'pts', t: 'area', l: '顶点 (x,y 空格分隔)', ph: '0,0 60,-50 120,0' },
      { k: 'closed', t: 'bool', l: '闭合' }, { k: 'smooth', t: 'bool', l: '平滑' }, ...arrowFields,
    ],
    render(p, ctx) {
      const P = PD.parsePts(p.pts); if (P.length < 2) return '';
      const n = P.length, ah = PD.ahSize(p);
      let d;
      if (p.smooth) {
        const g = (i) => (p.closed ? P[(i + n) % n] : P[Math.max(0, Math.min(n - 1, i))]);
        d = `M${f(P[0][0])},${f(P[0][1])}`;
        const segs = p.closed ? n : n - 1;
        for (let i = 0; i < segs; i++) {
          const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
          d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`;
        }
        if (p.closed) d += 'Z';
      } else {
        const Q = P.map((q) => q.slice());
        if (!p.closed) {
          const sh = (a, b, s) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; a[0] += ((b[0] - a[0]) / L) * s; a[1] += ((b[1] - a[1]) / L) * s; };
          sh(Q[0], P[1], PD.inset(p.a0) * ah); sh(Q[n - 1], P[n - 2], PD.inset(p.a1) * ah);
        }
        d = Q.map((q, i) => (i ? 'L' : 'M') + f(q[0]) + ',' + f(q[1])).join('') + (p.closed ? 'Z' : '');
      }
      let o = `<path d="${d}" ${PD.fillAttr(p, ctx)} ${S(p)}/>`;
      if (!p.closed) o += ends(p, P[0][0], P[0][1], Math.atan2(P[0][1] - P[1][1], P[0][0] - P[1][0]), P[n - 1][0], P[n - 1][1], Math.atan2(P[n - 1][1] - P[n - 2][1], P[n - 1][0] - P[n - 2][0]));
      return o;
    },
  });

  /* ===== 图片（导入） ===== */
  PD.register({
    type: 'image', name: '图片',
    defaults: { href: '', w: 240, h: 180, ar: 4 / 3, keep: true, gray: false, border: false },
    getHandles: (p) => [[+p.w, p.keep ? p.w / (p.ar || 1) : +p.h]],
    setHandle(p, i, x, y) { p.w = f(Math.max(5, x)); p.h = p.keep ? f(p.w / (p.ar || 1)) : f(Math.max(5, y)); },
    fields: [
      { k: 'w', t: 'num', l: '宽' }, { k: 'h', t: 'num', l: '高', when: (p) => !p.keep }, { k: 'keep', t: 'bool', l: '锁定长宽比', rebuild: true },
      { k: 'gray', t: 'bool', l: '转为黑白(灰度)' }, { k: 'border', t: 'bool', l: '边框' },
    ],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const w = +p.w, h = p.keep ? w / (p.ar || 1) : +p.h;
      let filt = '';
      if (p.gray) { const id = ctx.id + '-gray'; ctx.defs.push(`<filter id="${id}"><feColorMatrix type="saturate" values="0"/></filter>`); filt = ` filter="url(#${id})"`; }
      let o = p.href
        ? `<image href="${p.href}" xlink:href="${p.href}" x="0" y="0" width="${f(w)}" height="${f(h)}" preserveAspectRatio="none"${filt}/>`
        : `<rect width="${f(w)}" height="${f(h)}" fill="#eeeeee"/>` + T(ctx, '（无图片）', w / 2, h / 2, { size: 14, italic: false, color: '#888' });
      if (p.border) o += `<rect width="${f(w)}" height="${f(h)}" fill="none" ${S(p, { dash: 'solid' })}/>`;
      return o;
    },
  });

  /* ===== 矩形 ===== */
  PD.register({
    type: 'rect', name: '矩形/方块',
    defaults: { w: 120, h: 70, rx: 0, label: '', lsize: 18 },
    handles: [['w', 'h']],
    fields: [{ k: 'w', t: 'num', l: '宽' }, { k: 'h', t: 'num', l: '高' }, { k: 'rx', t: 'num', l: '圆角' }, ...labelFields],
    render(p, ctx) {
      let o = `<rect x="0" y="0" width="${f(p.w)}" height="${f(p.h)}" rx="${f(p.rx)}" ${PD.fillAttr(p, ctx)} ${S(p)}/>`;
      if (p.label) o += T(ctx, p.label, p.w / 2, p.h / 2, { size: p.lsize, color: p.stroke });
      return o;
    },
  });

  /* ===== 圆 / 椭圆 ===== */
  PD.register({
    type: 'ellipse', name: '圆/椭圆',
    defaults: { rx: 50, ry: 50, center: false, label: '', lsize: 18 },
    handles: [['rx', 'ry']],
    fields: [{ k: 'rx', t: 'num', l: '半径 rx' }, { k: 'ry', t: 'num', l: '半径 ry' }, { k: 'center', t: 'bool', l: '显示圆心' }, ...labelFields],
    render(p, ctx) {
      let o = `<ellipse cx="0" cy="0" rx="${f(Math.abs(p.rx))}" ry="${f(Math.abs(p.ry))}" ${PD.fillAttr(p, ctx)} ${S(p)}/>`;
      if (p.center) o += `<circle r="2.2" fill="${p.stroke}"/>`;
      if (p.label) o += T(ctx, p.label, 0, 0, { size: p.lsize, color: p.stroke });
      return o;
    },
  });

  /* ===== 正多边形 ===== */
  PD.register({
    type: 'ngon', name: '正多边形',
    defaults: { n: 3, r: 50, start: 90 },
    handles: [['r', 'zero']],
    fields: [{ k: 'n', t: 'num', l: '边数', min: 3 }, { k: 'r', t: 'num', l: '外接圆半径' }, { k: 'start', t: 'num', l: '起始角°', step: 15 }],
    render(p, ctx) {
      const n = Math.max(3, Math.round(p.n)), pts = [];
      for (let i = 0; i < n; i++) { const a = ((p.start + (360 * i) / n) * Math.PI) / 180; pts.push(`${f(p.r * Math.cos(a))},${f(-p.r * Math.sin(a))}`); }
      return `<polygon points="${pts.join(' ')}" ${PD.fillAttr(p, ctx)} ${S(p)}/>`;
    },
  });

  /* ===== 圆弧 ===== */
  PD.register({
    type: 'arc', name: '圆弧/旋转箭头',
    defaults: { r: 50, a1: 20, a2: 160, a0: 'none', a1h: 'none', ah: 0, label: '', lsize: 18, sector: false },
    fields: [
      { k: 'r', t: 'num', l: '半径' }, { k: 'a1', t: 'num', l: '起始角°', step: 5 }, { k: 'a2', t: 'num', l: '终止角°', step: 5 },
      { k: 'a0', t: 'sel', l: '起点端头', o: PD.ARROWS }, { k: 'a1h', t: 'sel', l: '终点端头', o: PD.ARROWS }, { k: 'ah', t: 'num', l: '箭头大小' },
      { k: 'sector', t: 'bool', l: '扇形(连到圆心)' }, ...labelFields,
    ],
    render(p, ctx) {
      const R = Math.PI / 180, r = +p.r, A1 = p.a1 * R, A2 = p.a2 * R, ccw = p.a2 >= p.a1;
      const P = (a) => [r * Math.cos(a), -r * Math.sin(a)];
      const [x1, y1] = P(A1), [x2, y2] = P(A2);
      const large = Math.abs(p.a2 - p.a1) > 180 ? 1 : 0, sweep = ccw ? 0 : 1;
      let d = `M${f(x1)},${f(y1)}A${f(r)},${f(r)} 0 ${large} ${sweep} ${f(x2)},${f(y2)}`;
      if (p.sector) d = `M0,0L${f(x1)},${f(y1)}` + d.slice(d.indexOf('A')) + 'Z';
      let o = `<path d="${d}" ${p.sector ? PD.fillAttr(p, ctx) : 'fill="none"'} ${S(p)}/>`;
      const dir = ccw ? 1 : -1; // 切线方向
      const t2 = Math.atan2(-Math.cos(A2) * dir, -Math.sin(A2) * dir), t1 = Math.atan2(Math.cos(A1) * dir, Math.sin(A1) * dir);
      const ah = PD.ahSize(p);
      o += PD.arrowHead(x2, y2, t2, ah, p.a1h, p.stroke, p.sw) + PD.arrowHead(x1, y1, t1, ah, p.a0, p.stroke, p.sw);
      if (p.label) { const am = (A1 + A2) / 2; o += T(ctx, p.label, (r + 14) * Math.cos(am), -(r + 14) * Math.sin(am), { size: p.lsize, color: p.stroke }); }
      return o;
    },
  });

  /* ===== 角度标注 ===== */
  PD.register({
    type: 'angle', name: '角度标注',
    defaults: { r: 26, a1: 0, a2: 40, label: '\\theta', lsize: 18, right: false, rays: true, L: 110, double: false },
    fields: [
      { k: 'a1', t: 'num', l: '边1角度°', step: 5 }, { k: 'a2', t: 'num', l: '边2角度°', step: 5 }, { k: 'r', t: 'num', l: '弧半径' },
      { k: 'right', t: 'bool', l: '直角符号' }, { k: 'double', t: 'bool', l: '双弧' },
      { k: 'rays', t: 'bool', l: '画出两边' }, { k: 'L', t: 'num', l: '边长' }, ...labelFields,
    ],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const R = Math.PI / 180, A1 = p.a1 * R, A2 = p.a2 * R, r = +p.r, u = (a, l) => [l * Math.cos(a), -l * Math.sin(a)];
      let o = '';
      if (p.rays) { const [a, b] = u(A1, p.L), [c, d] = u(A2, p.L); o += `<path d="M${f(a)},${f(b)}L0,0L${f(c)},${f(d)}" fill="none" ${S(p)}/>`; }
      const thin = S(p, { sw: Math.max(0.8, p.sw * 0.75), dash: 'solid' });
      if (p.right) {
        const s = r * 0.6, [a, b] = u(A1, s), [c, d] = u(A2, s);
        o += `<path d="M${f(a)},${f(b)}L${f(a + c)},${f(b + d)}L${f(c)},${f(d)}" fill="none" ${thin}/>`;
      } else {
        const arc = (rr) => { const [a, b] = u(A1, rr), [c, d] = u(A2, rr); const lg = Math.abs(p.a2 - p.a1) > 180 ? 1 : 0; return `<path d="M${f(a)},${f(b)}A${f(rr)},${f(rr)} 0 ${lg} ${p.a2 >= p.a1 ? 0 : 1} ${f(c)},${f(d)}" fill="none" ${thin}/>`; };
        o += arc(r); if (p.double) o += arc(r + 4);
      }
      if (p.label) { const am = (A1 + A2) / 2, [x, y] = u(am, r + 13); o += T(ctx, p.label, x, y, { size: p.lsize, color: p.stroke }); }
      return o;
    },
  });

  /* ===== 尺寸标注 ===== */
  PD.register({
    type: 'dim', name: '尺寸标注',
    defaults: { L: 160, label: 'd', lsize: 18, ext: 10, tip: 'full', gap: true },
    handles: [['L', 'zero']],
    fields: [
      { k: 'L', t: 'num', l: '长度' }, ...labelFields, { k: 'ext', t: 'num', l: '界线长度' },
      { k: 'tip', t: 'sel', l: '端头', o: PD.ARROWS }, { k: 'gap', t: 'bool', l: '标签处断开' },
    ],
    style: ['stroke', 'sw', 'dash', 'opacity'],
    render(p, ctx) {
      const L = +p.L, ah = PD.ahSize(p), e = +p.ext, th = S(p, { sw: Math.max(0.8, p.sw * 0.7) });
      let o = `<path d="M0,${-e}V${e}M${f(L)},${-e}V${e}" ${S(p, { sw: Math.max(0.8, p.sw * 0.7), dash: 'solid' })} fill="none"/>`;
      const s = PD.inset(p.tip) * ah, gw = p.gap && p.label ? Math.max(14, String(p.label).length * p.lsize * 0.35) : 0;
      if (gw) o += `<path d="M${f(s)},0H${f(L / 2 - gw)}M${f(L / 2 + gw)},0H${f(L - s)}" fill="none" ${th}/>`;
      else o += `<line x1="${f(s)}" y1="0" x2="${f(L - s)}" y2="0" ${th}/>`;
      o += PD.arrowHead(0, 0, Math.PI, ah, p.tip, p.stroke, p.sw) + PD.arrowHead(L, 0, 0, ah, p.tip, p.stroke, p.sw);
      if (p.label) o += T(ctx, p.label, L / 2, gw ? 0 : -12, { size: p.lsize, color: p.stroke, halo: !gw });
      return o;
    },
  });

  /* ===== 点 ===== */
  PD.register({
    type: 'point', name: '点',
    defaults: { r: 3, hollow: false, label: 'P', lsize: 18, ldx: 10, ldy: -10 },
    fields: [{ k: 'r', t: 'num', l: '半径', step: 0.5 }, { k: 'hollow', t: 'bool', l: '空心' }, ...labelFields, { k: 'ldx', t: 'num', l: '标签 dx' }, { k: 'ldy', t: 'num', l: '标签 dy' }],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      let o = `<circle r="${f(p.r)}" fill="${p.hollow ? '#ffffff' : p.stroke}" ${S(p, { sw: p.hollow ? p.sw : 0.5, dash: 'solid' })}/>`;
      if (p.label) o += T(ctx, p.label, p.ldx, p.ldy, { size: p.lsize, color: p.stroke });
      return o;
    },
  });

  /* ===== 文字 ===== */
  PD.register({
    type: 'text', name: '文字(支持 x_1, v^2, \\theta)',
    defaults: { text: 'F_{net} = ma', size: 20, italic: true, bold: false, anchor: 'middle', frac: 'auto', box: false, pad: 6 },
    fields: [
      { k: 'text', t: 'text', l: '内容' }, { k: 'size', t: 'num', l: '字号' }, { k: 'italic', t: 'bool', l: '斜体' }, { k: 'bold', t: 'bool', l: '粗体' },
      { k: 'anchor', t: 'sel', l: '对齐', o: [['start', '左'], ['middle', '中'], ['end', '右']] },
      { k: 'frac', t: 'sel', l: '分式', o: [['auto', '跟随全局'], ['stack', '竖式'], ['inline', '横式 a/b']] },
      { k: 'box', t: 'bool', l: '加边框(如「俯视图」标注)' }, { k: 'pad', t: 'num', l: '边框内距', when: (p) => p.box },
    ],
    style: ['stroke', 'opacity', 'shadow'],
    render(p, ctx) {
      const c0 = Object.assign({}, ctx, { rot: 0, flip: false }), z = +p.size || 20;
      const o = { size: z, color: p.stroke, italic: p.italic, bold: p.bold, anchor: p.anchor, frac: p.frac };
      let s = T(c0, p.text, 0, 0, o);
      if (p.box && String(p.text || '') !== '') {
        const mode = p.frac && p.frac !== 'auto' ? p.frac : (ctx.doc && ctx.doc.frac) || 'stack';
        const b = PD.layoutTex(p.text, z, c0, { italic: p.italic, bold: p.bold, frac: mode }), pd = +p.pad || 6, dy = z * 0.35;
        const x0 = p.anchor === 'end' ? -b.w : p.anchor === 'start' ? 0 : -b.w / 2;
        s = `<rect x="${f(x0 - pd)}" y="${f(dy - b.a - pd)}" width="${f(b.w + 2 * pd)}" height="${f(b.a + b.d + 2 * pd)}" fill="#ffffff" ${S(p, { dash: 'solid', sw: 1 })}/>` + s;
      }
      return s;
    },
  });

  /* ===== 地面/墙面阴影线 ===== */
  PD.register({
    type: 'ground', name: '地面/墙面',
    defaults: { L: 220, gap: 9, depth: 9, angle: 45, side: 'below', sw: 1.8 },
    handles: [['L', 'zero']],
    fields: [
      { k: 'L', t: 'num', l: '长度' }, { k: 'gap', t: 'num', l: '阴影间距' }, { k: 'depth', t: 'num', l: '阴影深度' },
      { k: 'angle', t: 'num', l: '阴影角度°', step: 5 }, { k: 'side', t: 'sel', l: '阴影在', o: [['below', '下方'], ['above', '上方']] },
    ],
    style: ['stroke', 'sw', 'opacity'],
    render(p) {
      const L = +p.L, g = Math.max(3, +p.gap), dep = +p.depth * (p.side === 'above' ? -1 : 1), k = 1 / Math.tan((Math.max(5, +p.angle) * Math.PI) / 180);
      let d = '';
      for (let x = g / 2; x <= L; x += g) d += `M${f(x)},0l${f(-Math.abs(dep) * k)},${f(dep)}`;
      return `<path d="${d}" fill="none" ${S(p, { sw: Math.max(0.7, p.sw * 0.55), dash: 'solid' })}/><line x1="0" y1="0" x2="${f(L)}" y2="0" ${S(p)}/>`;
    },
  });

  /* ---------- 预设（左侧素材面板） ---------- */
  PD.preset(CAT, '线段', 'line', {});
  PD.preset(CAT, '矢量箭头', 'line', { a1: 'tri', label: 'F', sw: 2 });
  PD.preset(CAT, '双向箭头', 'line', { a0: 'tri', a1: 'tri' });
  PD.preset(CAT, '虚线', 'line', { dash: 'dash', sw: 1.2 });
  PD.preset(CAT, '光线(中点箭头)', 'line', { mid: true, x2: 160, y2: -60 });
  PD.preset(CAT, '曲线', 'bezier', {});
  PD.preset(CAT, '曲线箭头', 'bezier', { a1: 'tri' });
  PD.preset(CAT, '折线', 'poly', {});
  PD.preset(CAT, '平滑曲线', 'poly', { smooth: true, pts: '0,0 40,-40 80,0 120,40 160,0' });
  PD.preset(CAT, '三角形', 'ngon', { n: 3 });
  PD.preset(CAT, '多边形(任意)', 'poly', { pts: '0,0 120,0 90,-60 20,-70', closed: true, fillMode: 'solid', fill: '#e6edf5' });
  PD.preset(CAT, '矩形', 'rect', {});
  PD.preset(CAT, '木块(填充)', 'rect', { w: 80, h: 50, fillMode: 'solid', fill: '#d9d9d9', label: 'm' });
  PD.preset(CAT, '阴影块', 'rect', { w: 80, h: 50, fillMode: 'hatch', fill: '#000000' });
  PD.preset(CAT, '圆', 'ellipse', { center: true });
  PD.preset(CAT, '椭圆', 'ellipse', { rx: 70, ry: 35 });
  PD.preset(CAT, '小球(高光)', 'ellipse', { rx: 22, ry: 22, fillMode: 'radial', fill: '#7a8fa8', sw: 1 });
  PD.preset(CAT, '圆弧', 'arc', {});
  PD.preset(CAT, '旋转箭头', 'arc', { r: 30, a1: 30, a2: 300, a1h: 'tri' });
  PD.preset(CAT, '扇形', 'arc', { sector: true, a1: 0, a2: 60, fillMode: 'solid', fill: '#e6edf5' });
  PD.preset(CAT, '角度 θ', 'angle', {});
  PD.preset(CAT, '直角标记', 'angle', { a2: 90, right: true, label: '', L: 60 });
  PD.preset(CAT, '尺寸标注', 'dim', {});
  PD.preset(CAT, '点', 'point', {});
  PD.preset(CAT, '空心点', 'point', { hollow: true, label: '' });
  PD.preset(CAT, '文字/公式', 'text', {});
  PD.preset(CAT, '分式公式', 'text', { text: 'E_k = \\frac{1}{2}mv^2' });
  PD.preset(CAT, '带框标注', 'text', { text: '俯视图(不依比例绘制)', size: 15, italic: false, box: true });
  PD.preset(CAT, '罗马数字(i)(ii)', 'text', { text: '(\\roman{1})  (\\roman{2})  (\\Roman{3})', size: 18, italic: false });
  PD.preset(CAT, '核反应方程', 'text', { text: '\\nuc{235}{92}{U} + \\nuc{1}{0}{n} \\to \\nuc{141}{56}{Ba} + \\nuc{92}{36}{Kr} + 3\\nuc{1}{0}{n}', size: 20 });
  PD.preset(CAT, '地面', 'ground', {});
  PD.preset(CAT, '墙面(竖直)', 'ground', { rot: -90, L: 160 });
})();
