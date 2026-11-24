/* 选修 · 原子世界（依赖 lab / mechanics / optics / nuclear / circuit 的 PD.lab 辅助）
   光的粒子本质：金箔验电器 · 光电管 · 微安计 · 光电效应电路 · I-V / V_s-f 图
   迈向现代原子模型：葡萄干布丁模型 · 盖革-马斯登实验 · 卢瑟福原子模型 · 玻尔原子模型 · 发射/吸收光谱 · 能级图
   纳米世界：瑞利判据(强度曲线/艾里斑/几何) · 透射电子显微镜 · 电子枪 · 扫描隧穿显微镜
   大部分素材都有「外观」：上色 / 黑白 / 抽象(线稿)；仪器部件名称可留空出题 */
(function () {
  'use strict';
  const f = PD.f, S = PD.strokeAttr, T = PD.tex, L = PD.lab, pt = L.pt, clamp = L.clamp;
  const D2R = Math.PI / 180, TAU = Math.PI * 2;
  const C1 = 'DSE-物理/选修·原子世界/光的粒子本质', C2 = 'DSE-物理/选修·原子世界/迈向现代原子模型', C3 = 'DSE-物理/选修·原子世界/纳米世界';
  const sd = (p) => S(p, { dash: 'solid' });
  const ELEC = '#4f8fdc', PROT = '#e8755f', VIO = '#7b1fa2', GOLD = '#e2b33c';
  const nums = (s) => String(s ?? '').split(/[,，\s]+/).filter((x) => x !== '').map(Number).filter((x) => isFinite(x));

  /* ================= 共享辅助 ================= */
  const LOOKS = [['color', '上色'], ['bw', '黑白'], ['abstract', '抽象(线稿)']];
  const lookF = { k: 'look', t: 'sel', l: '外观', o: LOOKS };
  const blankF = { k: 'blank', t: 'sel', l: '部件名称', o: [['text', '显示名称'], ['empty', '全部留空(横线)'], ['letter', '改为字母 A B C…']] };
  const K = (p) => ({ col: p.look !== 'bw' && p.look !== 'abstract', bw: p.look === 'bw', ab: p.look === 'abstract' });
  const lab = (ctx, p, t, x, y, o) => (t ? T(ctx, t, x, y, Object.assign({ size: +p.lsize || 14, color: p.stroke, italic: false, halo: true }, o || {})) : '');
  const leader = (p, x1, y1, x2, y2) => `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" ${S(p, { dash: 'solid', sw: 0.7 })}/>`;
  // 部件名称：可显示 / 留空横线 / 字母（出题用）；某一项名称留空时也画横线
  L.partLabel = (ctx, p, txt, idx, x, y, anchor) => {
    const mode = p.blank || 'text', ls = +p.lsize || 14;
    if (mode === 'letter') return T(ctx, String.fromCharCode(65 + idx), x, y, { size: ls + 1, anchor, italic: false, bold: true, color: p.stroke, halo: true });
    if (mode === 'empty' || !String(txt || '').trim()) { const w = 64, x0 = anchor === 'end' ? x - w : anchor === 'middle' ? x - w / 2 : x; return `<line x1="${f(x0)}" y1="${f(y + 7)}" x2="${f(x0 + w)}" y2="${f(y + 7)}" ${S(p, { dash: 'solid', sw: 0.9 })}/>`; }
    return T(ctx, txt, x, y, { size: ls, anchor, italic: false, color: p.stroke, halo: true });
  };
  const part = L.partLabel;
  const sign = (x, y, s, r, col, sw) => `<path d="M${pt(x - r, y)}H${f(x + r)}${s > 0 ? `M${pt(x, y - r)}V${f(y + r)}` : ''}" stroke="${col}" stroke-width="${f(sw || 1.6)}" stroke-linecap="round"/>`;
  const wavyArrow = (x0, y0, x1, y1, col, sw, amp, wl) => {
    const ah = 6 + 2.2 * sw, ang = Math.atan2(y1 - y0, x1 - x0);
    return `<path d="${L.wavy(x0, y0, x1 - Math.cos(ang) * ah * 0.6, y1 - Math.sin(ang) * ah * 0.6, amp ?? 4, wl ?? 12, ah)}" fill="none" stroke="${col}" stroke-width="${f(sw)}" stroke-linejoin="round"/>` + PD.arrowHead(x1, y1, ang, ah, 'tri', col, sw);
  };
  L.wavyArrow = wavyArrow;
  // 小球：上色 / 黑白用立体球，抽象用线圈
  const dotB = (p, ctx, x, y, r, col, sgn, k) => (k.ab ? `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#ffffff" ${L.thin(p, 0.7)}/>` + (sgn && r >= 3.5 ? sign(x, y, sgn, r * 0.5, p.stroke, 1) : '') : L.ball(p, ctx, x, y, r, k.bw ? PD.shade('#9e9e9e', sgn > 0 ? -0.1 : 0.2) : col, sgn && r >= 4 ? sgn : 0));
  // 可见光波长 → 颜色
  const wl2rgb = (PD.wl2rgb = (nm) => {
    let r = 0, g = 0, b = 0;
    if (nm >= 380 && nm < 440) { r = -(nm - 440) / 60; b = 1; } else if (nm >= 440 && nm < 490) { g = (nm - 440) / 50; b = 1; } else if (nm >= 490 && nm < 510) { g = 1; b = -(nm - 510) / 20; }
    else if (nm >= 510 && nm < 580) { r = (nm - 510) / 70; g = 1; } else if (nm >= 580 && nm < 645) { r = 1; g = -(nm - 645) / 65; } else if (nm >= 645 && nm <= 780) r = 1;
    const k = nm < 380 || nm > 780 ? 0 : nm < 420 ? 0.3 + (0.7 * (nm - 380)) / 40 : nm > 700 ? 0.3 + (0.7 * (780 - nm)) / 80 : 1, c = (v) => Math.round(255 * Math.pow(v * k, 0.8));
    return PD.rgb2hex(c(r), c(g), c(b));
  });

  /* ================= 金箔验电器 ================= */
  PD.register({
    type: 'electroscope', name: '金箔验电器(锌板 / 紫外光)',
    defaults: { look: 'color', charge: '-1', n: 5, spread: 32, plate: 'zinc', uv: true, glass: false, labels: true, tPlate: '锌板', tLeaf: '金箔', tUV: '紫外光灯', tGlass: '玻璃片', tCase: '', lsize: 14 },
    fields: [
      lookF, { k: 'charge', t: 'sel', l: '所带电荷', o: [['-1', '负电 −'], ['1', '正电 +'], ['0', '不带电']] }, { k: 'n', t: 'num', l: '板上电荷符号数', min: 0 },
      { k: 'spread', t: 'range', l: '金箔张开角°', min: 0, max: 50, step: 1 }, { k: 'plate', t: 'sel', l: '顶部', o: [['zinc', '锌板'], ['disc', '金属圆盘']] },
      { k: 'uv', t: 'bool', l: '紫外光灯照射' }, { k: 'glass', t: 'bool', l: '中间放玻璃片(挡住紫外光)', when: (p) => p.uv },
      { k: 'labels', t: 'bool', l: '文字标注' }, { k: 'tPlate', t: 'text', l: '顶板文字', when: (p) => p.labels }, { k: 'tLeaf', t: 'text', l: '金箔文字', when: (p) => p.labels },
      { k: 'tUV', t: 'text', l: '光源文字', when: (p) => p.labels && p.uv }, { k: 'tGlass', t: 'text', l: '玻璃片文字', when: (p) => p.labels && p.uv && p.glass }, { k: 'tCase', t: 'text', l: '外壳文字', when: (p) => p.labels }, { k: 'lsize', t: 'num', l: '字号' },
    ],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const k = K(p), s = +p.charge, a = clamp(+p.spread, 0, 60) * D2R, sc = k.col ? (s > 0 ? '#d62828' : '#1e5fbf') : p.stroke;
      const rodC = k.col ? '#9aa0a6' : k.bw ? '#777777' : p.stroke, leafC = k.col ? GOLD : k.bw ? '#b0b0b0' : p.stroke;
      let o = '';
      o += `<rect x="-80" y="-170" width="160" height="170" rx="10" fill="${k.col ? '#e9eef3' : k.bw ? '#f2f2f2' : 'none'}" ${sd(p)}/>`;
      if (!k.ab) o += `<rect x="-62" y="-150" width="124" height="130" rx="6" fill="${k.col ? '#d7ecf8' : '#ffffff'}" fill-opacity="${k.col ? 0.7 : 1}" ${L.thin(p, 0.6)}/>`;
      o += `<rect x="-11" y="-182" width="22" height="20" rx="2" fill="${k.col ? '#6d4c41' : k.bw ? '#8a8a8a' : '#ffffff'}" ${sd(p)}/>`;
      o += k.ab ? `<line x1="0" y1="-206" x2="0" y2="-40" ${sd(p)}/>` : `<line x1="0" y1="-206" x2="0" y2="-96" stroke="${rodC}" stroke-width="4"/><rect x="-3" y="-100" width="6" height="60" fill="${rodC}" ${L.thin(p, 0.5)}/>`;
      const hx = 3, hy = -94, Ll = 52, ex = hx + Ll * Math.sin(a), ey = hy + Ll * Math.cos(a);
      o += k.ab ? `<line x1="${hx}" y1="${hy}" x2="${f(ex)}" y2="${f(ey)}" ${sd(p)}/>` : `<line x1="${hx}" y1="${hy}" x2="${f(ex)}" y2="${f(ey)}" stroke="${leafC}" stroke-width="5" stroke-linecap="round"/><line x1="${hx}" y1="${hy}" x2="${f(ex)}" y2="${f(ey)}" ${S(p, { dash: 'solid', sw: 0.5 })}/>`;
      if (p.plate === 'disc') o += `<ellipse cx="0" cy="-210" rx="26" ry="7" fill="${k.ab ? '#ffffff' : L.metal(ctx, '#c4c8cc', -217, -203, true)}" ${sd(p)}/>`;
      else o += `<rect x="-56" y="-214" width="112" height="8" fill="${k.ab ? '#ffffff' : k.bw ? '#d0d0d0' : L.metal(ctx, '#b8bec4', -214, -206, true)}" ${sd(p)}/>`;
      if (s) {
        const n = Math.max(0, Math.round(+p.n)), half = p.plate === 'disc' ? 20 : 46;
        for (let i = 0; i < n; i++) o += sign(n > 1 ? -half + (2 * half * i) / (n - 1) : 0, -222, s, 3.4, sc, 1.5);
        o += sign(hx + (Ll * 0.55) * Math.sin(a) + 8, hy + Ll * 0.55 * Math.cos(a), s, 3, sc, 1.4) + sign(-10, -70, s, 3, sc, 1.4) + sign(-10, -52, s, 3, sc, 1.4);
      }
      if (p.uv) {
        const Lc = [-205, -300], tgt = [-6, -218], dx = tgt[0] - Lc[0], dy = tgt[1] - Lc[1], l = Math.hypot(dx, dy), u = [dx / l, dy / l], v = [-u[1], u[0]], ang = Math.atan2(dy, dx) / D2R;
        o += `<g transform="translate(${pt(...Lc)}) rotate(${f(ang)})"><rect x="-40" y="-15" width="70" height="30" rx="6" fill="${k.col ? '#5e35b1' : k.bw ? '#9e9e9e' : '#ffffff'}" ${sd(p)}/><rect x="30" y="-11" width="8" height="22" rx="2" fill="${k.col ? '#ede7f6' : '#ffffff'}" ${L.thin(p, 0.7)}/></g>`;
        const G = [Lc[0] + dx * 0.58, Lc[1] + dy * 0.58], rc = k.col ? VIO : p.stroke;
        for (let j = -1; j <= 1; j++) {
          const s0 = [Lc[0] + u[0] * 44 + v[0] * j * 9, Lc[1] + u[1] * 44 + v[1] * j * 9];
          const e = p.glass ? [G[0] - u[0] * 6 + v[0] * j * 9, G[1] - u[1] * 6 + v[1] * j * 9] : [tgt[0] + v[0] * j * 22, tgt[1] + v[1] * j * 22];
          o += wavyArrow(s0[0], s0[1], e[0], e[1], rc, 1.3, 3, 10);
        }
        if (p.glass) { o += `<line x1="${f(G[0] - v[0] * 38)}" y1="${f(G[1] - v[1] * 38)}" x2="${f(G[0] + v[0] * 38)}" y2="${f(G[1] + v[1] * 38)}" stroke="${k.col ? '#a9d6ea' : '#d0d0d0'}" stroke-width="6"/><line x1="${f(G[0] - v[0] * 38)}" y1="${f(G[1] - v[1] * 38)}" x2="${f(G[0] + v[0] * 38)}" y2="${f(G[1] + v[1] * 38)}" ${L.thin(p, 0.6)}/>`; if (p.labels) o += lab(ctx, p, p.tGlass, G[0] + v[0] * 40 + 4, G[1] + v[1] * 40 + 8, { anchor: 'start' }); }
        if (p.labels) o += lab(ctx, p, p.tUV, Lc[0], Lc[1] - 30);
      }
      if (p.labels) { o += lab(ctx, p, p.tPlate, 64, -210, { anchor: 'start' }) + lab(ctx, p, p.tLeaf, ex + 10, ey, { anchor: 'start' }); if (p.tCase) o += lab(ctx, p, p.tCase, 0, 16); }
      return o;
    },
  });

  /* ================= 光电管 / 自定义电表 ================= */
  PD.register({
    type: 'photocell', name: '光电管(真空管)',
    defaults: { look: 'color', R: 38, light: 3, lc: VIO, labels: true, tC: 'C', tA: 'A', tL: '光', vac: false, lsize: 14 },
    ports: (p) => { const R = +p.R; return [[-R - 14, 0, -1, 0], [R + 14, 0, 1, 0]]; },
    fields: [lookF, { k: 'R', t: 'num', l: '管的半径' }, { k: 'light', t: 'num', l: '入射光(波浪箭头数)', min: 0 }, { k: 'lc', t: 'color', l: '光的颜色' }, { k: 'labels', t: 'bool', l: '标注' },
      { k: 'tC', t: 'text', l: '阴极标签', when: (p) => p.labels }, { k: 'tA', t: 'text', l: '阳极标签', when: (p) => p.labels }, { k: 'tL', t: 'text', l: '光的标签', when: (p) => p.labels }, { k: 'vac', t: 'bool', l: '标「真空」' }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const R = +p.R, k = K(p), mc = k.col ? '#7d848a' : k.bw ? '#777777' : p.stroke, cx = 0.3 * R, rr = 0.8 * R, A = (d) => [cx + rr * Math.cos(d * D2R), rr * Math.sin(d * D2R)];
      let o = `<path d="M${f(-R - 14)},0H${f(-0.5 * R)}M${f(0.38 * R)},0H${f(R + 14)}" fill="none" ${sd(p)}/>`;
      o += `<circle r="${f(R)}" fill="${k.col ? '#e3f2fd' : k.bw ? '#f5f5f5' : '#ffffff'}" fill-opacity="${k.col ? 0.75 : 1}" ${sd(p)}/>`;
      o += `<path d="M${pt(...A(145))}A${f(rr)},${f(rr)} 0 0 1 ${pt(...A(215))}" fill="none" stroke="${mc}" stroke-width="${f(k.ab ? (+p.sw || 1.5) * 1.6 : 3.4)}" stroke-linecap="round"/>`;
      o += `<line x1="${f(0.38 * R)}" y1="${f(-0.36 * R)}" x2="${f(0.38 * R)}" y2="${f(0.36 * R)}" stroke="${mc}" stroke-width="${f(k.ab ? (+p.sw || 1.5) * 1.4 : 2.6)}" stroke-linecap="round"/>`;
      const n = Math.max(0, Math.round(+p.light)), lc = k.col ? p.lc : p.stroke;
      for (let j = 0; j < n; j++) { const off = j - (n - 1) / 2, a = (125 + off * 13) * D2R, s0 = [(R + 46) * Math.cos(a), -(R + 46) * Math.sin(a)], e = [-0.38 * R, off * 0.22 * R]; o += wavyArrow(s0[0], s0[1], e[0], e[1], lc, 1.3, 3, 10); }
      if (p.labels) { o += lab(ctx, p, p.tC, -0.62 * R, 0.66 * R, { italic: true }) + lab(ctx, p, p.tA, 0.64 * R, 0.6 * R, { italic: true }); if (n) o += lab(ctx, p, p.tL, (R + 56) * Math.cos(125 * D2R), -(R + 56) * Math.sin(125 * D2R) - 4); }
      if (p.vac) o += lab(ctx, p, '真空', 0.02 * R, -0.58 * R, { size: (+p.lsize || 14) - 2 });
      return o;
    },
  });
  PD.register({
    type: 'meter2', name: '电表(自定义符号, 如 μA)', defaults: { L: 60, r: 14, text: '\\mu\\rm{A}', label: '', lsize: 14 },
    ports: (p) => [[-(+p.L) / 2, 0, -1, 0], [+p.L / 2, 0, 1, 0]],
    fields: [{ k: 'L', t: 'num', l: '两端距离' }, { k: 'r', t: 'num', l: '圈半径' }, { k: 'text', t: 'text', l: '圈内文字' }, { k: 'label', t: 'text', l: '旁边标签' }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) { const h = +p.L / 2, r = +p.r; return `<path d="M${f(-h)},0H${f(-r)}M${f(r)},0H${f(h)}" fill="none" ${sd(p)}/><circle r="${f(r)}" fill="#ffffff" ${sd(p)}/>` + T(ctx, p.text, 0, 0, { size: r * 0.82, italic: false, color: p.stroke }) + (p.label ? lab(ctx, p, p.label, 0, -r - 12) : ''); },
  });

  /* ================= 葡萄干布丁模型 ================= */
  const scatter = (R, n, rMin, rng, avoid) => {
    const P = []; let tries = 0;
    while (P.length < n && tries++ < n * 400) { const a = rng() * TAU, d = Math.sqrt(rng()) * R, q = [d * Math.cos(a), d * Math.sin(a)]; if (P.concat(avoid || []).some((s) => Math.hypot(s[0] - q[0], s[1] - q[1]) < rMin)) continue; P.push(q); }
    return P;
  };
  PD.register({
    type: 'plum', name: '葡萄干布丁模型(汤姆孙)',
    defaults: { look: 'color', R: 80, ne: 12, np: 16, er: 7, seed: 3, labels: true, tP: '带正电的球体', tE: '电子', lsize: 14 },
    fields: [lookF, { k: 'R', t: 'num', l: '半径' }, { k: 'ne', t: 'num', l: '电子数', min: 0 }, { k: 'np', t: 'num', l: '“+” 号数', min: 0 }, { k: 'er', t: 'num', l: '电子大小' }, { k: 'seed', t: 'num', l: '随机排布' },
      { k: 'labels', t: 'bool', l: '文字标注' }, { k: 'tP', t: 'text', l: '球体文字', when: (p) => p.labels }, { k: 'tE', t: 'text', l: '电子文字', when: (p) => p.labels }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const R = +p.R, k = K(p), rng = PD.rng(p.seed), er = +p.er;
      let o = `<circle r="${f(R)}" ${k.col ? PD.fillAttr({ fillMode: 'radial', fill: '#f4a29a', fill2: '#fff1ef' }, ctx) : `fill="${k.bw ? '#e8e8e8' : '#ffffff'}"`} ${sd(p)}/>`;
      const E = scatter(R * 0.8, Math.round(+p.ne), er * 3, rng), Pp = scatter(R * 0.84, Math.round(+p.np), er * 2.2, rng, E);
      Pp.forEach((q) => (o += sign(q[0], q[1], 1, 4, k.col ? '#c62828' : p.stroke, 1.5)));
      E.forEach((q) => (o += dotB(p, ctx, q[0], q[1], er, ELEC, -1, k)));
      if (p.labels) {
        const e0 = E.reduce((b, q) => (q[0] - q[1] > b[0] - b[1] ? q : b), E[0] || [0, 0]);
        o += leader(p, R * 0.72, -R * 0.62, R + 18, -R - 10) + lab(ctx, p, p.tP, R + 22, -R - 12, { anchor: 'start' });
        if (E.length) o += leader(p, e0[0] + er * 0.7, e0[1] + er * 0.7, R + 18, R * 0.6) + lab(ctx, p, p.tE, R + 22, R * 0.6, { anchor: 'start' });
      }
      return o;
    },
  });

  /* ================= 盖革-马斯登实验（俯视图） ================= */
  PD.register({
    type: 'gmexp', name: '盖革-马斯登实验(α 粒子散射装置)',
    defaults: { look: 'color', Rc: 160, Rd: 112, th: 40, paths: true, rotate: true, blank: 'text', tSrc: '放射源', tLead: '铅块', tFoil: '金箔', tScr: '硫化锌屏幕', tMic: '显微镜', tVac: '真空', lsize: 14 },
    fields: [lookF, { k: 'th', t: 'range', l: '显微镜所在角度 θ', min: -170, max: 170, step: 5 }, { k: 'Rc', t: 'num', l: '真空室半径' }, { k: 'Rd', t: 'num', l: '屏幕离金箔距离' },
      { k: 'paths', t: 'bool', l: '画几条散射路径' }, { k: 'rotate', t: 'bool', l: '显微镜可转动(弧形箭头)' }, blankF,
      { k: 'tSrc', t: 'text', l: '放射源' }, { k: 'tLead', t: 'text', l: '铅块' }, { k: 'tFoil', t: 'text', l: '金箔' }, { k: 'tScr', t: 'text', l: '屏幕' }, { k: 'tMic', t: 'text', l: '显微镜' }, { k: 'tVac', t: 'text', l: '真空' }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const k = K(p), Rc = +p.Rc, Rd = +p.Rd, th = (+p.th || 0) * D2R, ls = +p.lsize || 14, bc = k.col ? '#c62828' : p.stroke;
      let o = `<circle r="${f(Rc)}" fill="${k.col ? '#eef2f5' : k.bw ? '#f5f5f5' : '#ffffff'}" ${sd(p)}/>`;
      const bx = -Rc * 0.84, leadF = k.col ? '#6d7378' : k.bw ? '#9e9e9e' : null;
      [[-28, -4], [4, 28]].forEach(([y0, y1]) => (o += `<rect x="${f(bx)}" y="${y0}" width="42" height="${y1 - y0}" ${leadF ? `fill="${leadF}"` : PD.fillAttr({ fillMode: 'hatch', fill: p.stroke }, ctx)} ${sd(p)}/>`));
      o += `<rect x="${f(bx - 8)}" y="-28" width="8" height="56" ${leadF ? `fill="${leadF}"` : PD.fillAttr({ fillMode: 'hatch', fill: p.stroke }, ctx)} ${sd(p)}/><circle cx="${f(bx + 6)}" cy="0" r="3.5" fill="${bc}"/>`;
      o += `<line x1="${f(bx + 10)}" y1="0" x2="-3" y2="0" stroke="${bc}" stroke-width="1.8"/>` + PD.arrowHead(bx * 0.42, 0, 0, 9, 'tri', bc, 1.5);
      if (p.paths) [[0, 1], [7, 0.8], [-12, 0.75], [32, 0.7], [-62, 0.6], [150, 0.55]].forEach(([d, r]) => { const a = d * D2R, e = [Rc * r * Math.cos(a), -Rc * r * Math.sin(a)]; o += L.arrow(p, 4 * Math.cos(a), -4 * Math.sin(a), e[0], e[1], { sw: 1, color: bc, dash: 'dash', ah: 7 }); });
      o += `<rect x="-2.5" y="-34" width="5" height="68" fill="${k.col ? GOLD : k.bw ? '#bdbdbd' : '#ffffff'}" ${sd(p)}/>`;
      const D = [Rd * Math.cos(th), -Rd * Math.sin(th)];
      o += L.arrow(p, 0, 0, D[0] * 0.97, D[1] * 0.97, { sw: 1.6, color: bc, ah: 9 });
      o += `<g transform="translate(${pt(...D)}) rotate(${f(-th / D2R)})"><rect x="0" y="-16" width="5" height="32" fill="${k.col ? '#9ccc65' : k.bw ? '#d0d0d0' : '#ffffff'}" ${sd(p)}/><rect x="5" y="-7" width="44" height="14" fill="${k.ab ? '#ffffff' : L.metal(ctx, '#b0b6bc', -7, 7, true)}" ${sd(p)}/><rect x="49" y="-10" width="12" height="20" rx="2" fill="${k.ab ? '#ffffff' : '#555555'}" ${sd(p)}/></g>`;
      o += `<line x1="0" y1="0" x2="${f(Rd * 0.7)}" y2="0" ${S(p, { dash: 'dash', sw: 0.8 })}/>` + L.angArc(p, ctx, [0, 0], 0, Math.atan2(D[1], D[0]), 30, '\\theta', ls);
      if (p.rotate) { const r = Rd + 74, a0 = th - 18 * D2R, a1 = th + 18 * D2R; o += `<path d="M${pt(r * Math.cos(a0), -r * Math.sin(a0))}A${f(r)},${f(r)} 0 0 0 ${pt(r * Math.cos(a1), -r * Math.sin(a1))}" fill="none" ${S(p, { dash: 'solid', sw: 1.1 })}/>` + PD.arrowHead(r * Math.cos(a1), -r * Math.sin(a1), -a1 - Math.PI / 2, 8, 'full', p.stroke, 1) + PD.arrowHead(r * Math.cos(a0), -r * Math.sin(a0), -a0 + Math.PI / 2, 8, 'full', p.stroke, 1); }
      const u = [Math.cos(th), -Math.sin(th)], nv = [-u[1], u[0]], side = nv[1] > 0 ? 1 : -1;
      o += part(ctx, p, p.tSrc, 0, bx + 6, 46, 'middle') + part(ctx, p, p.tLead, 1, bx + 21, -42, 'middle') + part(ctx, p, p.tFoil, 2, 0, -48, 'middle');
      o += part(ctx, p, p.tScr, 3, D[0] + nv[0] * side * 30, D[1] + nv[1] * side * 30, 'middle') + part(ctx, p, p.tMic, 4, D[0] + u[0] * 40 - nv[0] * side * 26, D[1] + u[1] * 40 - nv[1] * side * 26, 'middle');
      o += part(ctx, p, p.tVac, 5, -Rc * 0.25, Rc * 0.72, 'middle');
      return o;
    },
  });

  /* ================= 卢瑟福原子模型 ================= */
  PD.register({
    type: 'ratom', name: '卢瑟福原子模型(行星模型)',
    defaults: { look: 'color', R: 100, orbits: 3, tilt: 0, nr: 6, bound: false, labels: true, tN: '原子核(带正电)', tE: '电子', lsize: 14 },
    fields: [lookF, { k: 'R', t: 'num', l: '轨道大小' }, { k: 'orbits', t: 'num', l: '轨道数', min: 1 }, { k: 'tilt', t: 'num', l: '整体倾斜°', step: 15 }, { k: 'nr', t: 'num', l: '原子核大小' }, { k: 'bound', t: 'bool', l: '虚线画出原子边界' },
      { k: 'labels', t: 'bool', l: '文字标注' }, { k: 'tN', t: 'text', l: '原子核文字', when: (p) => p.labels }, { k: 'tE', t: 'text', l: '电子文字', when: (p) => p.labels }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const R = +p.R, n = Math.max(1, Math.round(+p.orbits)), k = K(p), oc = k.col ? '#78909c' : p.stroke;
      let o = p.bound ? `<circle r="${f(R * 1.08)}" fill="none" ${S(p, { dash: 'dash', sw: 0.8 })}/>` : '', els = [];
      for (let i = 0; i < n; i++) {
        const rot = +p.tilt + (180 * i) / n, ry = R * 0.32, a = (30 + i * 75) * D2R, x = R * Math.cos(a), y = ry * Math.sin(a), c = Math.cos(rot * D2R), s = Math.sin(rot * D2R);
        o += `<ellipse rx="${f(R)}" ry="${f(ry)}" transform="rotate(${f(rot)})" fill="none" stroke="${oc}" stroke-width="${f(Math.max(0.8, (+p.sw || 1.5) * 0.75))}"/>`;
        els.push([x * c - y * s, x * s + y * c]);
      }
      els.forEach((q) => (o += dotB(p, ctx, q[0], q[1], 6, ELEC, -1, k)));
      o += dotB(p, ctx, 0, 0, +p.nr, PROT, 1, k);
      if (p.labels) { const e = els[0]; o += leader(p, 4, 4, -R * 0.55, R * 0.75) + lab(ctx, p, p.tN, -R * 0.55, R * 0.75 + 14) + leader(p, e[0] + 4, e[1] - 4, R * 0.95, -R * 0.75) + lab(ctx, p, p.tE, R * 0.95 + 4, -R * 0.75 - 6, { anchor: 'start' }); }
      return o;
    },
  });

  /* ================= 玻尔原子模型 ================= */
  PD.register({
    type: 'bohr', name: '玻尔原子模型(电子跃迁)',
    defaults: { look: 'color', N: 4, spacing: 'even', r0: 30, dr: 30, trans: '3 2 hf', ang: 40, nlab: true, eOn: '', photon: true, lsize: 14 },
    fields: [lookF, { k: 'N', t: 'num', l: '轨道数', min: 1 }, { k: 'spacing', t: 'sel', l: '轨道半径', o: [['even', '等距(示意)'], ['square', '∝ n²(按比例)']] },
      { k: 'r0', t: 'num', l: '第一轨道半径' }, { k: 'dr', t: 'num', l: '轨道间距', when: (p) => p.spacing === 'even' },
      { k: 'trans', t: 'area', l: '跃迁(每行: 从 n 到 n [标签])', ph: '例: 3 2 hf   (放出光子)\n例: 1 3   (吸收光子)\n空 = 不画跃迁' },
      { k: 'ang', t: 'num', l: '第一个跃迁的方向°', step: 5 }, { k: 'photon', t: 'bool', l: '画光子(波浪箭头)' }, { k: 'eOn', t: 'text', l: '另外放电子的轨道(如 1)' }, { k: 'nlab', t: 'bool', l: '标 n = 1, 2…' }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const k = K(p), N = Math.max(1, Math.round(+p.N)), rn = (n) => (p.spacing === 'square' ? +p.r0 * n * n : +p.r0 + (n - 1) * +p.dr), ls = +p.lsize || 14, oc = k.col ? '#90a4ae' : p.stroke, pc = k.col ? VIO : p.stroke;
      let o = '', top = '';
      for (let n = 1; n <= N; n++) { o += `<circle r="${f(rn(n))}" fill="none" stroke="${oc}" stroke-width="${f(Math.max(0.8, (+p.sw || 1.5) * 0.75))}"/>`; if (p.nlab) { const a = 26 * D2R; top += lab(ctx, p, `n = ${n}`, (rn(n) + 6) * Math.cos(a), (rn(n) + 6) * Math.sin(a), { anchor: 'start', size: ls - 2 }); } }
      o += dotB(p, ctx, 0, 0, Math.min(9, +p.r0 * 0.32), PROT, 1, k);
      PD.lines(p.trans).forEach((line, i) => {
        const t = line.replace(/->|→/g, ' ').trim().split(/\s+/), a = +t[0], b = +t[1]; if (!(a >= 1 && b >= 1) || a === b) return;
        const ang = (+p.ang + i * 38) * D2R, U = [Math.cos(ang), -Math.sin(ang)], A = [U[0] * rn(a), U[1] * rn(a)], B = [U[0] * rn(b), U[1] * rn(b)], txt = t.slice(2).join(' ');
        o += L.arrow(p, A[0], A[1], B[0], B[1], { sw: 1.6 }) + dotB(p, ctx, A[0], A[1], 5.5, ELEC, -1, k);
        if (p.photon) {
          const em = a > b, P0 = em ? B : A, out = [U[0] * Math.cos(-0.9) - U[1] * Math.sin(-0.9), U[0] * Math.sin(-0.9) + U[1] * Math.cos(-0.9)], far = [P0[0] + out[0] * 70, P0[1] + out[1] * 70];
          o += em ? wavyArrow(P0[0] + out[0] * 8, P0[1] + out[1] * 8, far[0], far[1], pc, 1.4, 3.5, 11) : wavyArrow(far[0], far[1], P0[0] + out[0] * 8, P0[1] + out[1] * 8, pc, 1.4, 3.5, 11);
          if (txt) top += lab(ctx, p, txt, far[0] + out[0] * 12, far[1] + out[1] * 12, { italic: true });
        } else if (txt) top += lab(ctx, p, txt, (A[0] + B[0]) / 2 - U[1] * 14, (A[1] + B[1]) / 2 + U[0] * 14, { italic: true });
      });
      nums(p.eOn).forEach((n) => { if (n >= 1 && n <= N) o += dotB(p, ctx, -rn(n) * 0.7, rn(n) * 0.714, 5.5, ELEC, -1, k); });
      return o + top;
    },
  });

  /* ================= 光谱 ================= */
  PD.register({
    type: 'spectrum', name: '光谱(发射 / 吸收 / 连续)',
    defaults: { look: 'color', kind: 'emission', lines: '410, 434, 486, 656', lmin: 380, lmax: 720, W: 420, H: 44, lw: 3, ticks: true, step: 50, nmLab: false, name: '', lsize: 13 },
    fields: [lookF, { k: 'kind', t: 'sel', l: '光谱', o: [['emission', '发射光谱(亮线)'], ['absorption', '吸收光谱(暗线)'], ['continuous', '连续光谱']] },
      { k: 'lines', t: 'text', l: '谱线波长 nm(逗号分隔)', when: (p) => p.kind !== 'continuous' }, { k: 'lmin', t: 'num', l: '最短波长 nm' }, { k: 'lmax', t: 'num', l: '最长波长 nm' },
      { k: 'W', t: 'num', l: '长' }, { k: 'H', t: 'num', l: '高' }, { k: 'lw', t: 'num', l: '谱线粗细', step: 0.5 }, { k: 'ticks', t: 'bool', l: '波长刻度' }, { k: 'step', t: 'num', l: '刻度间隔 nm', when: (p) => p.ticks },
      { k: 'nmLab', t: 'bool', l: '谱线上方标波长' }, { k: 'name', t: 'text', l: '左边名称(如 氢)' }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const k = K(p), W = +p.W, H = +p.H, a = +p.lmin, b = +p.lmax, X = (nm) => ((nm - a) / (b - a || 1)) * W, ls = +p.lsize || 13, lw = +p.lw || 3;
      const L0 = p.kind === 'continuous' ? [] : nums(p.lines).filter((v) => v >= a && v <= b);
      let o = '';
      const grad = (gray) => { const id = ctx.id + '-sp' + (gray ? 'g' : 'c'); let st = ''; for (let nm = a; nm <= b + 1e-9; nm += Math.max(2, (b - a) / 40)) st += `<stop offset="${f((nm - a) / (b - a))}" stop-color="${gray ? PD.mix('#f5f5f5', '#8a8a8a', (nm - a) / (b - a)) : wl2rgb(nm)}"/>`; ctx.defs.push(`<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0">${st}</linearGradient>`); return `url(#${id})`; };
      if (k.ab) {
        if (p.kind === 'emission') { o += `<line x1="0" y1="${f(H)}" x2="${f(W)}" y2="${f(H)}" ${sd(p)}/>`; L0.forEach((v) => (o += `<line x1="${f(X(v))}" y1="0" x2="${f(X(v))}" y2="${f(H)}" ${S(p, { dash: 'solid', sw: Math.max(1, lw * 0.6) })}/>`)); }
        else { o += `<rect width="${f(W)}" height="${f(H)}" fill="none" ${sd(p)}/>`; L0.forEach((v) => (o += `<line x1="${f(X(v))}" y1="0" x2="${f(X(v))}" y2="${f(H)}" ${S(p, { dash: 'solid', sw: Math.max(1, lw * 0.6) })}/>`)); if (p.kind === 'continuous') o += `<text x="${f(W / 2)}" y="${f(H / 2 + 4)}" font-size="11" fill="${p.stroke}" text-anchor="middle" font-family="sans-serif">连续</text>`; }
      } else if (k.col) {
        o += `<rect width="${f(W)}" height="${f(H)}" fill="${p.kind === 'emission' ? '#000000' : grad(false)}" ${sd(p)}/>`;
        L0.forEach((v) => (o += `<rect x="${f(X(v) - lw / 2)}" y="0" width="${f(lw)}" height="${f(H)}" fill="${p.kind === 'emission' ? wl2rgb(v) : '#000000'}"/>`));
      } else {
        o += `<rect width="${f(W)}" height="${f(H)}" fill="${p.kind === 'emission' ? '#ffffff' : grad(true)}" ${sd(p)}/>`;
        L0.forEach((v) => (o += `<rect x="${f(X(v) - lw / 2)}" y="0" width="${f(lw)}" height="${f(H)}" fill="#000000"/>`));
      }
      if (p.ticks) { let d = ''; for (let v = Math.ceil(a / +p.step) * +p.step; v <= b + 1e-9; v += +p.step) { d += `M${f(X(v))},${f(H)}v6`; o += T(ctx, PD.fmt(v), X(v), H + 17, { size: ls - 1, italic: false, color: p.stroke }); } o += `<path d="${d}" fill="none" ${sd(p)}/>` + T(ctx, '\\lambda / \\rm{nm}', W + 10, H + 17, { size: ls, anchor: 'start', color: p.stroke }); }
      if (p.nmLab) L0.forEach((v) => (o += T(ctx, PD.fmt(v), X(v), -10, { size: ls - 2, italic: false, color: p.stroke })));
      if (p.name) o += T(ctx, p.name, -10, H / 2, { size: ls + 1, anchor: 'end', italic: false, color: p.stroke });
      return o;
    },
  });

  /* ================= 能级图 ================= */
  const H_LEVELS = 'n = ∞, 0\nn = 6, -0.38\nn = 5, -0.54\nn = 4, -0.85\nn = 3, -1.51\nn = 2, -3.40\nn = 1, -13.6';
  PD.register({
    type: 'elevels', name: '能级图(可改成其他原子, 可画跃迁)',
    defaults: { title: '', levels: H_LEVELS, vscale: 'true', W: 260, H: 320, unit: 'eV', ionDash: true, trans: '3 2 656 nm\n4 2 486 nm', tc: '#000000', photon: false, ground: '', axis: false, lsize: 14 },
    fields: [
      { k: 'levels', t: 'area', l: '能级(每行: 名称, 能量)', ph: '例:\nn = ∞, 0\nn = 3, -1.51\nn = 2, -3.40\nn = 1, -13.6\n(名称可以写 E_1、基态 等)' },
      { k: 'vscale', t: 'sel', l: '纵向比例', o: [['true', '按能量比例'], ['even', '等距(示意)']] }, { k: 'W', t: 'num', l: '能级线长' }, { k: 'H', t: 'num', l: '高' }, { k: 'unit', t: 'text', l: '单位(空 = 不写)' },
      { k: 'ionDash', t: 'bool', l: '能量为 0 的能级画虚线(电离)' },
      { k: 'trans', t: 'area', l: '跃迁(每行: 从 到 [标签])', ph: '用能级名称里的数字或名称\n例: 3 2 656 nm   (向下 = 放出光子)\n例: 1 3   (向上 = 吸收)\n例: 1 ∞ 电离\n可在最后加 @0.3 指定横向位置(0-1)' },
      { k: 'tc', t: 'color', l: '跃迁箭头颜色' }, { k: 'photon', t: 'bool', l: '向下跃迁旁画光子(波浪)' }, { k: 'title', t: 'text', l: '标题(如 氢原子能级)' }, { k: 'ground', t: 'text', l: '最低能级右侧注明(如 基态)' }, { k: 'axis', t: 'bool', l: '左侧画能量轴' }, { k: 'lsize', t: 'num', l: '字号' },
    ],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const Lv = PD.lines(p.levels).map((l) => { const m = /^(.*?)[,，|]\s*(-?[\d.]+(?:e-?\d+)?)\s*$/i.exec(l); return m ? { name: m[1].trim(), E: +m[2] } : null; }).filter(Boolean);
      if (!Lv.length) return '';
      const W = +p.W, H = +p.H, ls = +p.lsize || 14, sorted = Lv.slice().sort((a, b) => a.E - b.E), Emin = sorted[0].E, Emax = sorted[sorted.length - 1].E, err = [];
      sorted.forEach((q, i) => (q.y = p.vscale === 'even' ? H - (H * i) / Math.max(1, sorted.length - 1) : H - (H * (q.E - Emin)) / (Emax - Emin || 1)));
      let o = '';
      if (p.title) o += T(ctx, p.title, W / 2, -36, { size: ls + 1, italic: false, color: p.stroke });
      if (p.axis) o += L.arrow(p, -70, H + 6, -70, -18, { sw: 1.2 }) + T(ctx, '能量', -70, -30, { size: ls - 1, italic: false, color: p.stroke });
      sorted.forEach((q) => (o += `<line x1="0" y1="${f(q.y)}" x2="${f(W)}" y2="${f(q.y)}" ${S(p, { dash: p.ionDash && q.E === 0 ? 'dash' : 'solid', sw: (+p.sw || 1.5) * 1.2 })}/>`));
      // 标签防重叠（自下而上推开）
      const gap = ls + 1, ys = sorted.map((q) => q.y), ly = ys.slice();
      for (let i = 1; i < ly.length; i++) if (ly[i] > ly[i - 1] - gap) ly[i] = ly[i - 1] - gap;
      sorted.forEach((q, i) => {
        o += T(ctx, q.name, -8, ly[i], { size: ls - 1, anchor: 'end', color: p.stroke, halo: true });
        const et = (q.E > 0 ? '' : '') + PD.fmt(q.E) + (p.unit ? ' \\rm{' + p.unit + '}' : '');
        o += T(ctx, et, W + 8, ly[i], { size: ls - 1, anchor: 'start', italic: false, color: p.stroke, halo: true });
        if (Math.abs(ly[i] - ys[i]) > 2) o += `<path d="M${pt(-6, ly[i])}L0,${f(ys[i])}M${pt(W, ys[i])}L${pt(W + 6, ly[i])}" fill="none" ${S(p, { dash: 'solid', sw: 0.5 })}/>`;
      });
      if (p.ground) o += T(ctx, p.ground, W + 8, sorted[0].y + ls + 2, { size: ls - 2, anchor: 'start', italic: false, color: p.stroke });
      const find = (tok) => {
        tok = String(tok).trim(); if (/^(∞|inf|infinity)$/i.test(tok)) return Lv.find((q) => /∞|inf/i.test(q.name)) || sorted[sorted.length - 1];
        return Lv.find((q) => q.name.replace(/\s/g, '') === tok) || Lv.find((q) => { const m = /(\d+)\s*$/.exec(q.name); return m && m[1] === tok; }) || Lv.find((q) => q.name.includes(tok)) || null;
      };
      const TR = PD.lines(p.trans);
      TR.forEach((line, i) => {
        let pos = null; const m = /@\s*([\d.]+)\s*$/.exec(line); if (m) { pos = +m[1]; line = line.slice(0, m.index); }
        const t = line.replace(/->|→/g, ' ').trim().split(/\s+/), A = find(t[0]), B = find(t[1]);
        if (!A || !B) { err.push('找不到能级：' + (!A ? t[0] : t[1])); return; }
        if (A === B) return;
        const x = W * (pos != null ? clamp(pos, 0, 1) : 0.14 + (0.72 * (i + 0.5)) / TR.length), txt = t.slice(2).join(' ');
        o += L.arrow(p, x, A.y, x, B.y, { sw: 1.6, color: p.tc });
        if (p.photon && A.E > B.E) o += wavyArrow(x + 4, (A.y + B.y) / 2 + 10, x + 34, (A.y + B.y) / 2 - 14, VIO, 1.2, 2.5, 9);
        if (txt) o += T(ctx, txt, x + 5, (A.y + B.y) / 2 + (p.photon && A.E > B.E ? 14 : 0), { size: ls - 2, anchor: 'start', italic: false, color: p.tc, halo: true });
      });
      if (err.length && ctx.mode === 'edit') o += err.map((t, i) => `<text x="0" y="${-52 - i * 15}" font-size="12" fill="#d32f2f" font-family="sans-serif">${PD.esc(t)}</text>`).join('');
      return o;
    },
  });

  /* ================= 瑞利判据 ================= */
  const J1 = (x) => { let s = 0, term = x / 2; for (let k = 0; k < 60; k++) { if (k > 0) term *= -(x * x) / 4 / (k * (k + 1)); s += term; if (Math.abs(term) < 1e-14) break; } return s; };
  const airy = (x) => (Math.abs(x) < 1e-6 ? 1 : (2 * J1(x) / x) ** 2);
  PD.register({
    type: 'rayleigh', name: '瑞利判据(强度曲线 / 艾里斑)',
    defaults: { state: 'just', sep: 1, mode: 'both', W: 320, H: 120, d0: 58, single: true, caption: true, cc: '#000000', lsize: 14 },
    fields: [
      { k: 'state', t: 'sel', l: '两个光源', o: [['resolved', '可分辨'], ['just', '刚好可分辨(瑞利判据)'], ['unresolved', '不可分辨'], ['custom', '自定义间距']], rebuild: true },
      { k: 'sep', t: 'num', l: '两峰间距(以第一暗环半径为单位)', step: 0.1, when: (p) => p.state === 'custom' },
      { k: 'mode', t: 'sel', l: '显示', o: [['curves', '强度曲线'], ['disks', '艾里斑(屏上图样)'], ['both', '两者(斑在曲线下方)']] },
      { k: 'W', t: 'num', l: '宽' }, { k: 'H', t: 'num', l: '曲线高' }, { k: 'd0', t: 'num', l: '第一暗环半径 px' }, { k: 'single', t: 'bool', l: '虚线画出各自的曲线' }, { k: 'caption', t: 'bool', l: '下方文字说明' },
      { k: 'cc', t: 'color', l: '曲线颜色' }, { k: 'lsize', t: 'num', l: '字号' },
    ],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const s = { resolved: 1.7, just: 1, unresolved: 0.5 }[p.state] ?? +p.sep, W = +p.W, H = +p.H, d0 = +p.d0, z1 = 3.8317, c1 = (-s * d0) / 2, c2 = (s * d0) / 2, ls = +p.lsize || 14;
      let o = '', y0 = 0;
      if (p.mode !== 'disks') {
        const N = 300, I1 = [], I2 = [], Is = []; let mx = 0;
        for (let i = 0; i <= N; i++) { const x = -W / 2 + (W * i) / N, a = airy(((x - c1) / d0) * z1), b = airy(((x - c2) / d0) * z1); I1.push([x, a]); I2.push([x, b]); Is.push([x, a + b]); mx = Math.max(mx, a + b); }
        const k = H / mx, P = (arr) => arr.map((q) => pt(q[0], H - q[1] * k)).join(' ');
        o += `<line x1="${f(-W / 2 - 6)}" y1="${f(H)}" x2="${f(W / 2 + 10)}" y2="${f(H)}" ${sd(p)}/>` + PD.arrowHead(W / 2 + 16, H, 0, 8, 'full', p.stroke, 1) + T(ctx, '\\theta', W / 2 + 22, H, { size: ls, anchor: 'start', color: p.stroke });
        o += L.arrow(p, -W / 2 - 6, H, -W / 2 - 6, -12, { sw: 1.1 }) + T(ctx, '强度', -W / 2 - 6, -24, { size: ls - 1, italic: false, color: p.stroke });
        if (p.single) o += `<polyline points="${P(I1)}" fill="none" ${S(p, { color: p.cc, sw: 1, dash: 'dash' })}/><polyline points="${P(I2)}" fill="none" ${S(p, { color: p.cc, sw: 1, dash: 'dash' })}/>`;
        o += `<polyline points="${P(Is)}" fill="none" ${S(p, { color: p.cc, sw: (+p.sw || 1.5) * 1.2, dash: 'solid' })}/>`;
        if (Math.abs(s - 1) < 0.05) o += L.dim(p, ctx, c1, H + 14, c2, H + 14, '\\theta_{min}', { off: -12, size: ls - 1 });
        y0 = H + 42;
      }
      if (p.mode !== 'curves') {
        const r = d0 * 1.45, id = ctx.id + '-ai'; let st = '';
        for (let i = 0; i <= 16; i++) { const t = i / 16, v = Math.min(1, Math.pow(airy(t * (r / d0) * z1), 0.45)); st += `<stop offset="${f(t)}" stop-color="#ffffff" stop-opacity="${f(v)}"/>`; }
        ctx.defs.push(`<radialGradient id="${id}">${st}</radialGradient>`);
        const hh = r * 2 + 10, yc = y0 + hh / 2;
        o += `<rect x="${f(-W / 2)}" y="${f(y0)}" width="${f(W)}" height="${f(hh)}" fill="#111111" ${sd(p)}/><circle cx="${f(c1)}" cy="${f(yc)}" r="${f(r)}" fill="url(#${id})"/><circle cx="${f(c2)}" cy="${f(yc)}" r="${f(r)}" fill="url(#${id})"/>`;
        y0 += hh + 8;
      }
      if (p.caption) o += T(ctx, { resolved: '可分辨', just: '刚好可分辨', unresolved: '不可分辨' }[p.state] || '', 0, y0 + 10, { size: ls, italic: false, color: p.stroke });
      return o;
    },
  });
  PD.register({
    type: 'resgeo', name: '分辨两个点光源(孔径与角间距)',
    defaults: { h: 40, D1: 200, d: 40, D2: 160, labels: true, lsize: 15 },
    fields: [{ k: 'h', t: 'num', l: '两光源相距(半)' }, { k: 'D1', t: 'num', l: '光源到孔径距离' }, { k: 'd', t: 'num', l: '孔径 d' }, { k: 'D2', t: 'num', l: '孔径到屏幕距离' }, { k: 'labels', t: 'bool', l: '标注' }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const h = +p.h, D1 = +p.D1, d = +p.d / 2, D2 = +p.D2, Hs = Math.max(h * 2.4, d * 3, 90), ls = +p.lsize || 15, xa = D1, xs = D1 + D2;
      let o = `<rect x="${f(xa - 4)}" y="${f(-Hs / 2)}" width="8" height="${f(Hs / 2 - d)}" fill="#8a8f96" ${sd(p)}/><rect x="${f(xa - 4)}" y="${f(d)}" width="8" height="${f(Hs / 2 - d)}" fill="#8a8f96" ${sd(p)}/>`;
      o += `<line x1="${f(xs)}" y1="${f(-Hs / 2)}" x2="${f(xs)}" y2="${f(Hs / 2)}" ${S(p, { dash: 'solid', sw: 2.5 })}/>`;
      [-h, h].forEach((y) => { const k = (xs - 0) / (xa - 0); o += `<line x1="0" y1="${f(y)}" x2="${f(xs)}" y2="${f(y - y * k)}" ${sd(p)}/>`; o += `<circle cx="0" cy="${f(y)}" r="3.5" fill="${p.stroke}"/>`; });
      o += L.angArc(p, ctx, [xa, 0], Math.atan2(h, -xa), Math.atan2(-h, -xa), 34, '\\theta', ls);
      if (p.labels) o += L.dim(p, ctx, xa + 16, -d, xa + 16, d, 'd', { off: -10, size: ls }) + T(ctx, 'S_1', -12, -h, { size: ls, anchor: 'end', color: p.stroke }) + T(ctx, 'S_2', -12, h, { size: ls, anchor: 'end', color: p.stroke }) + T(ctx, '孔径', xa, -Hs / 2 - 12, { size: ls - 1, italic: false, color: p.stroke }) + T(ctx, '屏幕', xs, -Hs / 2 - 12, { size: ls - 1, italic: false, color: p.stroke });
      return o;
    },
  });

  /* ================= 透射电子显微镜（抽象图，部件名可留空） ================= */
  const TEMW = [[56, 1], [100, 11], [190, 1.5], [250, 17], [302, 0.6], [355, 25], [386, 0.6], [422, 34]];
  const temW = (y) => { for (let i = 0; i < TEMW.length - 1; i++) { const [y0, w0] = TEMW[i], [y1, w1] = TEMW[i + 1]; if (y <= y1) return w0 + ((w1 - w0) * (y - y0)) / (y1 - y0); } return TEMW[TEMW.length - 1][1]; };
  PD.register({
    type: 'tem', name: '透射电子显微镜(部件名可留空)',
    defaults: { blank: 'text', beam: '#f2e46b', edge: '#7cb342', bw: false, bracket: true, tGun: '电子枪', tBeam: '电子束', tSample: '样本', tScreen: '显示屏', tCond: '聚束镜', tObj: '接物镜', tProj: '投影镜', tLens: '电磁透镜', lsize: 14 },
    fields: [blankF, { k: 'bracket', t: 'bool', l: '右侧括号归类(电磁透镜)' },
      { k: 'tGun', t: 'text', l: '电子枪' }, { k: 'tBeam', t: 'text', l: '电子束' }, { k: 'tSample', t: 'text', l: '样本' }, { k: 'tScreen', t: 'text', l: '显示屏' },
      { k: 'tCond', t: 'text', l: '聚束镜' }, { k: 'tObj', t: 'text', l: '接物镜' }, { k: 'tProj', t: 'text', l: '投影镜' }, { k: 'tLens', t: 'text', l: '括号文字', when: (p) => p.bracket },
      { k: 'bw', t: 'bool', l: '黑白(电子束画灰色)' }, { k: 'beam', t: 'color', l: '电子束颜色', when: (p) => !p.bw }, { k: 'edge', t: 'color', l: '电子束边线颜色', when: (p) => !p.bw }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const beam = p.bw ? '#d9d9d9' : p.beam, edge = p.bw ? '#555555' : p.edge;
      let o = `<path d="M-45,40V235L-58,255V400H58V255L45,235V40Z" fill="#f4f6f8" stroke="none"/>`;
      o += `<path d="M-45,40V235L-58,255V400M45,40V235L58,255V400M-39,40V236L-52,256V400M39,40V236L52,256V400" fill="none" ${S(p, { dash: 'solid', sw: 1.1 })}/>`;
      const ys = []; for (let y = 56; y <= 422; y += 2) ys.push(y);
      o += `<polygon points="${ys.map((y) => pt(-temW(y), y)).concat(ys.slice().reverse().map((y) => pt(temW(y), y))).join(' ')}" fill="${beam}" fill-opacity="0.75" stroke="none"/>`;
      // 交叉的边线（像光线一样在焦点交叉）
      let eL = '', eR = '', sgn = 1, prevW = 1;
      ys.forEach((y, i) => { const w = temW(y); if (w < 0.8 && prevW >= 0.8 && i) sgn = -sgn; prevW = w; eL += (i ? 'L' : 'M') + pt(-sgn * w, y); eR += (i ? 'L' : 'M') + pt(sgn * w, y); });
      o += `<path d="${eL}" fill="none" stroke="${edge}" stroke-width="1.2"/><path d="${eR}" fill="none" stroke="${edge}" stroke-width="1.2"/>`;
      [[78, 1], [150, 1], [276, 1], [330, 1], [404, 1]].forEach(([y]) => { const w = temW(y); [-1, 1].forEach((s) => (o += PD.arrowHead(s * w * 0.98, y, Math.PI / 2 + s * Math.atan2(temW(y + 1) - w, 1) * 0, 6, 'full', edge, 1))); });
      o += `<rect x="-18" y="0" width="36" height="40" fill="${L.metal(ctx, '#c8cdd2', -18, 18)}" ${sd(p)}/><path d="M-10,40L0,56L10,40Z" fill="#ffffff" ${sd(p)}/>`;
      [[100, 32], [250, 42], [355, 42]].forEach(([y, rx]) => (o += `<ellipse cx="0" cy="${y}" rx="${rx}" ry="8" fill="none" stroke="#666666" stroke-width="4.5"/><ellipse cx="0" cy="${y}" rx="${rx}" ry="8" fill="none" stroke="#999999" stroke-width="1.5"/>`));
      o += `<ellipse cx="0" cy="190" rx="22" ry="5.5" ${PD.fillAttr({ fillMode: 'cross', fill: '#3f7fd0' }, ctx)} stroke="#3f7fd0" stroke-width="0.8"/><ellipse cx="0" cy="190" rx="5" ry="2" fill="#d32f2f"/>`;
      o += `<polygon points="-62,400 62,400 92,446 -92,446" fill="#f7f7f7" ${sd(p)}/><polygon points="-92,446 92,446 92,453 -92,453" fill="#e0e0e0" ${sd(p)}/><ellipse cx="0" cy="424" rx="54" ry="11" fill="none" ${sd(p)}/><ellipse cx="0" cy="425" rx="17" ry="5" fill="#111111"/><rect x="68" y="418" width="4" height="12" fill="#bdbdbd" ${L.thin(p, 0.5)}/>`;
      const Lx = -150, Rx = 150;
      [[p.tGun, 0, 22, -18], [p.tBeam, 1, 140, -9], [p.tSample, 2, 190, -22], [p.tScreen, 3, 432, -78]].forEach(([t, i, y, x0]) => (o += leader(p, Lx + 6, y, x0, y) + part(ctx, p, t, i, Lx, y, 'end')));
      [[p.tCond, 4, 100, 34], [p.tObj, 5, 250, 44], [p.tProj, 6, 355, 44]].forEach(([t, i, y, x0]) => (o += leader(p, x0, y, Rx - 6, y) + part(ctx, p, t, i, Rx, y, 'start')));
      if (p.bracket) { const bx = Rx + 78; o += `<path d="M${bx - 8},100H${bx}V355H${bx - 8}M${bx},228H${bx + 12}" fill="none" ${S(p, { dash: 'solid', sw: 0.9 })}/>` + part(ctx, p, p.tLens, 7, bx + 16, 228, 'start'); }
      return o;
    },
  });

  /* ================= 电子枪 ================= */
  PD.register({
    type: 'egun', name: '电子枪(热离子发射)',
    defaults: { look: 'color', blank: 'text', tCath: '阴极', tAn: '阳极', tE: '电子', tV: '加速电压 V', lsize: 14 },
    fields: [lookF, blankF, { k: 'tCath', t: 'text', l: '阴极' }, { k: 'tAn', t: 'text', l: '阳极' }, { k: 'tE', t: 'text', l: '电子' }, { k: 'tV', t: 'text', l: '加速电压' }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const k = K(p), neg = k.col ? '#1e88e5' : p.stroke, posc = k.col ? '#d32f2f' : p.stroke, bc = k.col ? '#43a047' : p.stroke, ls = +p.lsize || 14;
      let o = `<path d="M-70,0V-74H-28M70,0V-74H28" fill="none" ${sd(p)}/><circle cx="-24" cy="-74" r="3.5" fill="#ffffff" ${sd(p)}/><circle cx="24" cy="-74" r="3.5" fill="#ffffff" ${sd(p)}/><path d="M-11,-74c4,-7 7,-7 11,0s7,7 11,0" fill="none" ${sd(p)}/>`;
      o += `<path d="${L.springPath(-70, 140, 9, 12, 'coil', 6)}" fill="none" ${S(p, { dash: 'solid', sw: (+p.sw || 1.5) * 1.1 })}/>`;
      o += `<path d="M-130,112V22H-82" fill="none" ${sd(p)}/>` + PD.arrowHead(-74, 22, 0, 9, 'full', p.stroke, 1) + `<circle cx="-130" cy="116" r="3.5" fill="#ffffff" ${sd(p)}/>`;
      o += `<circle cx="-130" cy="150" r="3.5" fill="#ffffff" ${sd(p)}/><path d="M-130,154V262H-42" fill="none" ${sd(p)}/>` + PD.arrowHead(-34, 262, 0, 9, 'full', p.stroke, 1);
      o += sign(-114, 116, -1, 5, neg, 2) + sign(-114, 150, 1, 5, posc, 2) + sign(-114, 8, -1, 5, neg, 2) + sign(-50, 278, 1, 5, posc, 2);
      const cf = k.col ? '#eceff1' : k.bw ? '#f5f5f5' : '#ffffff';
      o += `<path d="M-32,214V302A32,9 0 0 0 32,302V214" fill="${cf}" ${sd(p)}/><ellipse cx="0" cy="214" rx="32" ry="9" fill="${k.ab ? '#ffffff' : PD.shade(cf, -0.06)}" ${sd(p)}/>`;
      o += `<line x1="0" y1="14" x2="0" y2="214" stroke="${bc}" stroke-width="1.6"/><line x1="0" y1="214" x2="0" y2="302" stroke="${bc}" stroke-width="1.6" stroke-dasharray="6 4"/><line x1="0" y1="302" x2="0" y2="336" stroke="${bc}" stroke-width="1.6"/>` + PD.arrowHead(0, 346, Math.PI / 2, 9, 'full', bc, 1.4);
      o += part(ctx, p, p.tCath, 0, 84, 2, 'start') + part(ctx, p, p.tAn, 1, 46, 258, 'start') + part(ctx, p, p.tE, 2, 14, 120, 'start') + part(ctx, p, p.tV, 3, -146, 134, 'end');
      void ls;
      return o;
    },
  });

  /* ================= 扫描隧穿显微镜 ================= */
  PD.register({
    type: 'stm', name: '扫描隧穿显微镜(含放大图)',
    defaults: { look: 'color', mode: 'both', blank: 'text', tProbe: '探针', tSample: '样本', tTip: '探针末端', tTun: '电子隧穿', tSurf: '样本表面', tAtom: '原子', lsize: 14 },
    fields: [lookF, { k: 'mode', t: 'sel', l: '显示', o: [['both', '装置 + 放大图'], ['main', '只有装置'], ['inset', '只有放大图']] }, blankF,
      { k: 'tProbe', t: 'text', l: '探针' }, { k: 'tSample', t: 'text', l: '样本' }, { k: 'tTip', t: 'text', l: '探针末端' }, { k: 'tTun', t: 'text', l: '电子隧穿' }, { k: 'tSurf', t: 'text', l: '样本表面' }, { k: 'tAtom', t: 'text', l: '原子' }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const k = K(p), ls = +p.lsize || 14, OR = k.col ? '#ef8a2b' : p.stroke, cur = k.col ? '#9c6bd1' : p.stroke;
      const blue = k.col ? '#5aa6e0' : k.bw ? '#cfcfcf' : '#ffffff', red = k.col ? '#d9534f' : k.bw ? '#9e9e9e' : '#ffffff';
      let main = '', inset = '', conn = '';
      // 装置
      main += `<polygon points="30,240 290,210 350,240 90,270" fill="${blue}" ${sd(p)}/><polygon points="90,270 350,240 350,262 90,292" fill="${k.ab ? '#ffffff' : PD.shade(blue, -0.18)}" ${sd(p)}/><polygon points="30,240 90,270 90,292 30,262" fill="${k.ab ? '#ffffff' : PD.shade(blue, 0.15)}" ${sd(p)}/>`;
      main += `<path d="M190,48V22H30V146M30,178V252" fill="none" ${sd(p)}/><circle cx="30" cy="150" r="3.5" fill="#ffffff" ${sd(p)}/><circle cx="30" cy="174" r="3.5" fill="#ffffff" ${sd(p)}/>` + T(ctx, '+', 18, 148, { size: ls, italic: false, color: p.stroke }) + T(ctx, 'V', 18, 162, { size: ls, color: p.stroke }) + T(ctx, '−', 18, 176, { size: ls, italic: false, color: p.stroke });
      main += `<rect x="186" y="48" width="8" height="12" fill="${red}" ${sd(p)}/>`;
      if (!k.ab) main += `<rect x="160" y="74" width="14" height="66" fill="${L.metal(ctx, '#9ea3a8', 160, 174)}" ${sd(p)}/><rect x="206" y="74" width="14" height="66" fill="${L.metal(ctx, '#9ea3a8', 206, 220)}" ${sd(p)}/>`;
      main += `<rect x="172" y="60" width="36" height="112" fill="${k.ab ? '#ffffff' : L.metal(ctx, red, 172, 208)}" ${sd(p)}/><ellipse cx="190" cy="60" rx="18" ry="5" fill="${k.ab ? '#ffffff' : PD.shade(red, 0.25)}" ${sd(p)}/>`;
      if (k.ab) main += `<rect x="160" y="74" width="12" height="66" fill="#ffffff" ${sd(p)}/><rect x="208" y="74" width="12" height="66" fill="#ffffff" ${sd(p)}/>`;
      main += `<rect x="184" y="172" width="12" height="34" fill="${k.ab ? '#ffffff' : L.metal(ctx, red, 184, 196)}" ${sd(p)}/><path d="M184,206L190,224L196,206Z" fill="${k.ab ? '#ffffff' : red}" ${sd(p)}/>`;
      main += `<rect x="181" y="214" width="18" height="16" fill="none" stroke="${OR}" stroke-width="1.6"/>`;
      main += part(ctx, p, p.tProbe, 0, 232, 108, 'start') + part(ctx, p, p.tSample, 1, 74, 214, 'middle') + leader(p, 182, 228, 150, 246) + part(ctx, p, p.tTip, 2, 146, 250, 'end');
      // 放大图
      const X0 = 450, Y0 = 30, W = 410, Hh = 270;
      inset += `<rect x="${X0}" y="${Y0}" width="${W}" height="${Hh}" fill="#ffffff" stroke="${OR}" stroke-width="2"/>`;
      inset += `<rect x="${X0 + 10}" y="226" width="${W - 20}" height="${Y0 + Hh - 236}" fill="${k.col ? '#cfe8f8' : k.bw ? '#efefef' : '#ffffff'}"/>`;
      if (k.col) inset += `<path d="M612,190Q640,200 668,190L700,226H580Z" fill="#cfe8f8"/>`;
      let row2 = '', row1 = '';
      for (let x = X0 + 22; x < X0 + W - 14; x += 16) { row2 += dotB(p, ctx, x + 8, 230, 8, blue === '#ffffff' ? '#ffffff' : PD.shade(blue, -0.05), 0, k); row1 += dotB(p, ctx, x, 216, 8, blue, 0, k); }
      inset += row2 + row1;
      for (let r = 0; r < 6; r++) for (let j = 0; j < 6 - r; j++) inset += dotB(p, ctx, 640 + (j - (5 - r) / 2) * 17, 100 + r * 15, 9, red, 0, k);
      inset += `<path d="M512,98V70H640V86" fill="none" ${sd(p)}/>` + PD.arrowHead(640, 92, Math.PI / 2, 8, 'full', cur, 1) + T(ctx, 'I', 652, 80, { size: ls + 1, anchor: 'start', color: p.stroke });
      inset += `<circle cx="512" cy="102" r="3.5" fill="#ffffff" ${sd(p)}/><circle cx="512" cy="132" r="3.5" fill="#ffffff" ${sd(p)}/><path d="M512,136V210" fill="none" ${sd(p)}/><circle cx="512" cy="208" r="2.6" fill="${p.stroke}"/>` + T(ctx, '+', 500, 100, { size: ls, italic: false, color: p.stroke }) + T(ctx, 'V', 500, 117, { size: ls, color: p.stroke }) + T(ctx, '−', 500, 134, { size: ls, italic: false, color: p.stroke });
      inset += `<path d="M662,208Q676,196 664,184" fill="none" ${sd(p)}/>` + PD.arrowHead(662, 182, -Math.PI / 2 - 0.4, 7, 'full', p.stroke, 1);
      inset += part(ctx, p, p.tTun, 3, 676, 186, 'start') + part(ctx, p, p.tTip, 4, 612, 176, 'end') + part(ctx, p, p.tSurf, 5, X0 + W - 6, 196, 'end') + leader(p, 818, 236, 806, 266) + part(ctx, p, p.tAtom, 6, 806, 280, 'middle');
      conn = `<path d="M199,214L${X0},${Y0}M199,230L${X0},${Y0 + Hh}" fill="none" stroke="${OR}" stroke-width="1.4"/>`;
      if (p.mode === 'main') return main;
      if (p.mode === 'inset') return `<g transform="translate(${-X0},${-Y0})">${inset}</g>`;
      return main + conn + inset;
    },
  });

  /* ================= 预设 ================= */
  PD.preset(C1, '金箔验电器(紫外光照射锌板)', 'electroscope', {});
  PD.preset(C1, '金箔验电器(玻璃片挡住紫外光)', 'electroscope', { glass: true });
  PD.preset(C1, '金箔验电器(不带电)', 'electroscope', { charge: '0', spread: 0, uv: false });
  PD.preset(C1, '金箔验电器(抽象)', 'electroscope', { look: 'abstract' });
  PD.preset(C1, '光电管', 'photocell', {});
  PD.preset(C1, '微安计(μA)', 'meter2', {});
  const kid = (id, type, x, y, props) => Object.assign({ id: 'pe-' + id, type, x, y, rot: 0, scale: 1, flip: false, snap: 'auto' }, PD.STYLE_DEF, PD.clone(PD.shapes[type].defaults), props || {});
  const W = (id, a, ap, b, bp, extra) => kid(id, 'wire', 0, 0, Object.assign({ a0: 'pe-' + a, ap, b0: 'pe-' + b, bp }, extra || {}));
  PD.preset(C1, '光电效应电路(分压器 + 微安计 + 伏特计)', 'group', { loose: true, bw: 360, bh: 260, children: [
    kid('P', 'photocell', 180, 60), kid('M', 'meter2', 305, 60), kid('N1', 'node', 110, 60), kid('N2', 'node', 250, 60),
    kid('V', 'comp', 180, 0, { kind: 'voltmeter', L: 80 }), kid('R', 'comp', 180, 170, { kind: 'rheostat', L: 170 }), kid('B', 'comp', 180, 235, { kind: 'cell', n: 2, L: 80 }),
    W('w1', 'B', 0, 'R', 0), W('w2', 'B', 1, 'R', 1), W('w3', 'R', 0, 'N1', 0, { route: 'vh' }), W('w4', 'N1', 0, 'P', 0), W('w5', 'P', 1, 'N2', 0), W('w6', 'N2', 0, 'M', 0),
    W('w7', 'M', 1, 'R', 2, { route: 'vh' }), W('w8', 'V', 0, 'N1', 0, { route: 'hv' }), W('w9', 'V', 1, 'N2', 0, { route: 'hv' }),
  ] });
  const gp = (name, props) => PD.preset(C1, name, 'graph', Object.assign({ ticks: false, tlabels: false, ol: 'O', fs: 12 }, props));
  gp('光电流-电势差图(不同光强)', { W: 340, H: 210, xmin: -3, xmax: 5, ymin: 0, ymax: 4, xl: 'V', yl: 'I', funcs: 'x<-2 ? 0 : 3.2(1-exp(-(x+2)/0.9)) ; -3 ; 5 ; solid ;; 强光 ; 3.6\nx<-2 ? 0 : 1.6(1-exp(-(x+2)/0.9)) ; -3 ; 5 ; dash ;; 弱光 ; 3.6', pts: '-2, 0, -V_s, s' });
  gp('光电流-电势差图(不同频率)', { W: 340, H: 210, xmin: -3, xmax: 5, ymin: 0, ymax: 4, xl: 'V', yl: 'I', funcs: 'x<-2.2 ? 0 : 2.6(1-exp(-(x+2.2)/0.9)) ; -3 ; 5 ; solid ;; f_1 ; 3.6\nx<-1 ? 0 : 2.6(1-exp(-(x+1)/0.7)) ; -3 ; 5 ; dash ;; f_2 ; 2.2', pts: '-2.2, 0, -V_{s1}, s\n-1, 0, -V_{s2}, s' });
  gp('遏止电压-光频率图', { W: 340, H: 220, xmin: 0, xmax: 12, ymin: -2.6, ymax: 3, xl: 'f', yl: 'V_s', funcs: '0.414x-2.3 ; 5.56 ; 12 ; solid ;; 斜率 = \\frac{h}{e} ; 8.2\n0.414x-2.3 ; 0 ; 5.56 ; dash', pts: '5.56, 0, f_0, se\n0, -2.3, -\\frac{\\phi}{e}, w' });
  gp('最大动能-光频率图', { W: 340, H: 220, xmin: 0, xmax: 12, ymin: -2.6, ymax: 3, xl: 'f', yl: 'E_k', funcs: '0.414x-2.3 ; 5.56 ; 12 ; solid ;; 斜率 = h ; 8.2\n0.414x-2.3 ; 0 ; 5.56 ; dash', pts: '5.56, 0, f_0, se\n0, -2.3, -\\phi, w' });
  const fx = (cat, name, text) => PD.preset(cat, name, 'text', { text, size: 20 });
  fx(C1, '光子能量', 'E = hf = \\frac{hc}{\\lambda}');
  fx(C1, '爱因斯坦光电方程', '\\frac{1}{2}m v_{max}^2 = hf - \\phi');
  fx(C1, '遏止电压', 'eV_s = hf - \\phi');
  PD.preset(C2, '葡萄干布丁模型', 'plum', {});
  PD.preset(C2, '葡萄干布丁模型(抽象)', 'plum', { look: 'abstract' });
  PD.preset(C2, '盖革-马斯登实验', 'gmexp', {});
  PD.preset(C2, '盖革-马斯登实验(黑白, 部件留空)', 'gmexp', { look: 'bw', blank: 'empty' });
  PD.preset(C2, '卢瑟福原子模型', 'ratom', {});
  PD.preset(C2, '玻尔原子模型(放出光子)', 'bohr', {});
  PD.preset(C2, '玻尔原子模型(吸收光子)', 'bohr', { trans: '1 3 hf', ang: 30 });
  PD.preset(C2, '玻尔原子模型(抽象)', 'bohr', { look: 'abstract', trans: '' , eOn: '1' });
  PD.preset(C2, '氢原子发射光谱', 'spectrum', { name: '氢', nmLab: true });
  PD.preset(C2, '氢原子吸收光谱', 'spectrum', { kind: 'absorption', name: '氢' });
  PD.preset(C2, '连续光谱', 'spectrum', { kind: 'continuous' });
  PD.preset(C2, '光谱(黑白)', 'spectrum', { look: 'bw', name: '氢' });
  PD.preset(C2, '光谱(抽象, 只有谱线位置)', 'spectrum', { look: 'abstract', nmLab: true });
  PD.preset(C2, '氢原子能级图(跃迁)', 'elevels', { title: '氢原子能级' });
  PD.preset(C2, '能级图(巴耳末系)', 'elevels', { trans: '3 2 @0.2\n4 2 @0.35\n5 2 @0.5\n6 2 @0.65', title: '巴耳末系', photon: false });
  PD.preset(C2, '能级图(自定义原子, 等距)', 'elevels', { levels: 'E_4, -1.6\nE_3, -3.7\nE_2, -5.5\nE_1, -10.4', vscale: 'even', trans: '4 1\n3 1\n2 1\n4 2', ionDash: false, ground: '基态', H: 240 });
  PD.preset(C2, '能级图(吸收与电离)', 'elevels', { trans: '1 2 吸收\n1 ∞ 电离', title: '氢原子能级', ground: '基态' });
  fx(C2, '氢原子能级公式', 'E_n = -\\frac{13.6}{n^2} \\rm{eV}');
  fx(C2, '跃迁放出光子', 'hf = E_i - E_f');
  PD.preset(C3, '瑞利判据(刚好可分辨)', 'rayleigh', {});
  PD.preset(C3, '瑞利判据(可分辨)', 'rayleigh', { state: 'resolved' });
  PD.preset(C3, '瑞利判据(不可分辨)', 'rayleigh', { state: 'unresolved' });
  PD.preset(C3, '分辨两个点光源', 'resgeo', {});
  fx(C3, '瑞利判据公式', '\\theta \\approx \\frac{1.22 \\lambda}{d}');
  fx(C3, '德布罗意波长', '\\lambda = \\frac{h}{p} = \\frac{h}{mv}');
  PD.preset(C3, '透射电子显微镜', 'tem', {});
  PD.preset(C3, '透射电子显微镜(部件留空, 考题)', 'tem', { blank: 'empty' });
  PD.preset(C3, '透射电子显微镜(字母标示)', 'tem', { blank: 'letter' });
  PD.preset(C3, '电子枪', 'egun', {});
  PD.preset(C3, '扫描隧穿显微镜', 'stm', {});
  PD.preset(C3, '扫描隧穿显微镜(只有放大图)', 'stm', { mode: 'inset' });
})();
