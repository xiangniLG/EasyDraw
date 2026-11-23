/* 第三册 · 光与波（下）：波的性质、干涉与衍射、光的波动性、声音（依赖 lab.js、mechanics.js、optics.js 的 PD.lab 辅助）
   横波 · 纵波 · 水波(直线/圆形/反射/折射/衍射) · 水波槽 · 双源干涉(腹线/节线) · 驻波(弦/管)
   杨氏双缝 · 衍射光栅 · 条纹图样 · 狭缝板 · 音叉 · 扬声器 · 咪高峰 · 示波器(乐器波形) · 信号发生器 · 计时器 · 锤子 */
(function () {
  'use strict';
  const f = PD.f, S = PD.strokeAttr, T = PD.tex, L = PD.lab, pt = L.pt, clamp = L.clamp;
  const D2R = Math.PI / 180, R2D = 180 / Math.PI, TAU = Math.PI * 2;
  const C3 = 'DSE-物理/光与波/波的性质', C4 = 'DSE-物理/光与波/波的干涉与衍射', C5 = 'DSE-物理/光与波/光的波动性', C6 = 'DSE-物理/光与波/声音';
  const sd = (p) => S(p, { dash: 'solid' });
  const nrm = (v) => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };
  const dirOf = (deg) => [Math.cos(deg * D2R), -Math.sin(deg * D2R)];
  const WATER = PD.WATER || '#dcecf8';
  const lab = (i, l0) => { const c = String(l0 || 'a'); return c.length === 1 && /[a-zA-Z]/.test(c) ? String.fromCharCode(c.charCodeAt(0) + i) : (+c || 0) + i + ''; };
  const circ = (cx, cy, r) => `M${pt(cx - r, cy)}a${f(r)},${f(r)} 0 1,0 ${f(2 * r)},0a${f(r)},${f(r)} 0 1,0 ${f(-2 * r)},0`;
  const fmtN = (v) => String(parseFloat((+v).toFixed(3)));

  /* ================= 横波 ================= */
  PD.register({
    type: 'wave', name: '横波(波形/粒子/速度)',
    defaults: { L: 360, lam: 120, A: 40, ph: 0, shape: 'sine', pp: 60, eq: true, eqLabel: '', n: 0, l0: 'a', dr: 3.5, pv: 0, dir: 'right', vArrow: false, vlabel: 'v',
      dimL: false, dimA: false, cl: false, crest: '波峰', trough: '波谷', ghost: 0, gdash: 'dash', lsize: 15, sw: 1.8 },
    getHandles: (p) => { const lam = Math.max(4, +p.lam), xc = p.shape === 'pulse' ? +p.pp + lam / 4 : ((((Math.PI / 2 - (+p.ph || 0) * D2R) / TAU) * lam) % lam + lam) % lam; return [[lam, 0], [xc, -(+p.A)]]; },
    setHandle(p, i, x, y) { if (i === 0) p.lam = f(Math.max(8, x)); else p.A = f(-y); },
    fields: [
      { k: 'L', t: 'num', l: '长度' }, { k: 'lam', t: 'num', l: '波长 λ(拖轴上蓝点)' }, { k: 'A', t: 'num', l: '振幅 A(拖波峰蓝点)' }, { k: 'ph', t: 'num', l: '相位°', step: 15 },
      { k: 'shape', t: 'sel', l: '波形', o: [['sine', '连续正弦波'], ['pulse', '单个脉冲(半波)']], rebuild: true }, { k: 'pp', t: 'num', l: '脉冲位置', when: (p) => p.shape === 'pulse' },
      { k: 'eq', t: 'bool', l: '平衡位置虚线' }, { k: 'eqLabel', t: 'text', l: '平衡位置标签', when: (p) => p.eq },
      { k: 'n', t: 'num', l: '粒子数(0=不画)', min: 0 }, { k: 'l0', t: 'text', l: '粒子起始字母(空=不标)', when: (p) => p.n > 0 }, { k: 'dr', t: 'num', l: '粒子大小', when: (p) => p.n > 0 },
      { k: 'pv', t: 'num', l: '粒子速度箭头长(0=无)', when: (p) => p.n > 0 },
      { k: 'dir', t: 'sel', l: '传播方向', o: [['right', '向右'], ['left', '向左']] }, { k: 'vArrow', t: 'bool', l: '传播方向箭头' }, { k: 'vlabel', t: 'text', l: '传播箭头标签', when: (p) => p.vArrow },
      { k: 'dimL', t: 'bool', l: '标波长 λ' }, { k: 'dimA', t: 'bool', l: '标振幅 A' }, { k: 'cl', t: 'bool', l: '标波峰/波谷' }, { k: 'crest', t: 'text', l: '波峰文字', when: (p) => p.cl }, { k: 'trough', t: 'text', l: '波谷文字', when: (p) => p.cl },
      { k: 'ghost', t: 'num', l: '稍后的波形(位移几个 λ, 0=无)', step: 0.05 }, { k: 'gdash', t: 'sel', l: '稍后波形线型', o: PD.DASH, when: (p) => +p.ghost },
      { k: 'lsize', t: 'num', l: '标签字号' },
    ],
    style: ['stroke', 'sw', 'dash', 'opacity'],
    render(p, ctx) {
      const Lw = +p.L, lam = Math.max(4, +p.lam), A = +p.A, ph = (+p.ph || 0) * D2R, k = TAU / lam, dsg = p.dir === 'left' ? -1 : 1;
      const s = (x) => (p.shape === 'pulse' ? (x >= +p.pp && x <= +p.pp + lam / 2 ? A * Math.sin(k * (x - +p.pp)) : 0) : A * Math.sin(k * x + ph));
      const path = (fn) => { let d = ''; const N = Math.max(80, Math.ceil(Lw / 2)); for (let i = 0; i <= N; i++) { const x = (Lw * i) / N; d += (i ? 'L' : 'M') + pt(x, -fn(x)); } return d; };
      let o = '';
      if (p.eq) o += `<line x1="0" y1="0" x2="${f(Lw)}" y2="0" ${S(p, { dash: 'dash', sw: 0.8 })}/>` + (p.eqLabel ? T(ctx, p.eqLabel, Lw + 6, 0, { size: p.lsize, anchor: 'start', italic: false, color: p.stroke }) : '');
      if (+p.ghost) { const sh = +p.ghost * lam * dsg; o += `<path d="${path((x) => s(x - sh))}" fill="none" ${S(p, { dash: p.gdash || 'dash', sw: Math.max(0.8, (+p.sw || 1.5) * 0.75) })}/>`; }
      o += `<path d="${path(s)}" fill="none" ${S(p)}/>`;
      const n = Math.round(+p.n || 0);
      for (let i = 0; i < n; i++) {
        const x = n > 1 ? (Lw * i) / (n - 1) : 0, y = -s(x);
        if (+p.pv > 0) { const dy = (dsg * (s(x + 0.5) - s(x - 0.5))) / (Math.abs(A * k) || 1) * +p.pv; if (Math.abs(dy) > 4) o += L.arrow(p, x, y, x, y + dy, { sw: 1.1, ah: 6 }); }
        o += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(p.dr)}" fill="${p.stroke}"/>`;
        if (p.l0) o += T(ctx, lab(i, p.l0), x + 7, y - 11, { size: p.lsize * 0.9, color: p.stroke, halo: true });
      }
      const xc = p.shape === 'pulse' ? +p.pp + lam / 4 : (((((Math.PI / 2 - ph) / TAU) * lam) % lam) + lam) % lam;
      let top = -Math.abs(A) - 10;
      if (p.dimL && xc + lam <= Lw + 0.5 && p.shape !== 'pulse') { o += L.dim(p, ctx, xc, top - 4, xc + lam, top - 4, '\\lambda', { off: 10, size: p.lsize }); top -= 26; }
      if (p.dimA) o += L.dim(p, ctx, xc, 0, xc, -A, 'A', { off: -10, size: p.lsize });
      if (p.cl) {
        o += T(ctx, p.crest, xc, top - 4, { size: p.lsize, italic: false, color: p.stroke });
        const xt = p.shape === 'pulse' ? -1 : (xc + lam / 2 <= Lw ? xc + lam / 2 : xc - lam / 2);
        if (xt >= 0) o += T(ctx, p.trough, xt, Math.abs(A) + 16, { size: p.lsize, italic: false, color: p.stroke });
      }
      if (p.vArrow) { const y = top - (p.cl ? 26 : 8), x0 = Lw * 0.42, x1 = Lw * 0.58; o += L.arrow(p, dsg > 0 ? x0 : x1, y, dsg > 0 ? x1 : x0, y, { sw: 1.6 }) + (p.vlabel ? T(ctx, p.vlabel, Lw / 2, y - 13, { size: p.lsize, color: p.stroke }) : ''); }
      return o;
    },
  });

  /* ================= 纵波 ================= */
  PD.register({
    type: 'longwave', name: '纵波(粒子位置/疏密)',
    defaults: { n: 14, sp: 30, A: 13, lam: 240, ph: 0, rows: 'both', rowGap: 64, grid: true, gs: 10, l0: 'a', style: 'dots', dr: 3.2, la: '图 a', lb: '图 b', sl: '', cr: false, cT: '密部', rT: '疏部', lsize: 13 },
    fields: [
      { k: 'n', t: 'num', l: '粒子数', min: 2 }, { k: 'sp', t: 'num', l: '平衡间距' }, { k: 'A', t: 'num', l: '振幅(位移)' }, { k: 'lam', t: 'num', l: '波长' }, { k: 'ph', t: 'num', l: '相位°(时间推移)', step: 15 },
      { k: 'rows', t: 'sel', l: '显示', o: [['both', '平衡位置 + 某时刻位置'], ['eq', '只有平衡位置'], ['disp', '只有某时刻位置']] }, { k: 'rowGap', t: 'num', l: '两行间距', when: (p) => p.rows === 'both' },
      { k: 'style', t: 'sel', l: '样式', o: [['dots', '粒子(点)'], ['lines', '空气层(竖线)'], ['coil', '弹簧圈(机械波演示弹簧)']] }, { k: 'dr', t: 'num', l: '点大小', when: (p) => p.style === 'dots' },
      { k: 'grid', t: 'bool', l: '方格背景' }, { k: 'gs', t: 'num', l: '方格大小', when: (p) => p.grid },
      { k: 'l0', t: 'text', l: '起始字母(空=不标)' }, { k: 'la', t: 'text', l: '第一行标题' }, { k: 'lb', t: 'text', l: '第二行标题' }, { k: 'sl', t: 'text', l: '比例尺(如 5 cm)' },
      { k: 'cr', t: 'bool', l: '标密部/疏部' }, { k: 'cT', t: 'text', l: '密部文字', when: (p) => p.cr }, { k: 'rT', t: 'text', l: '疏部文字', when: (p) => p.cr }, { k: 'lsize', t: 'num', l: '标签字号' },
    ],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const n = Math.max(2, Math.round(+p.n)), sp = +p.sp, A = +p.A, lam = Math.max(4, +p.lam), ph = (+p.ph || 0) * D2R, k = TAU / lam, W = (n - 1) * sp, gs = Math.max(3, +p.gs);
      const rows = p.rows === 'both' ? [['eq', 0, p.la], ['disp', +p.rowGap, p.lb]] : [[p.rows, 0, p.rows === 'eq' ? p.la : p.lb]];
      let o = '';
      rows.forEach(([kind, y, title]) => {
        const xs = []; for (let i = 0; i < n; i++) xs.push(i * sp + (kind === 'disp' ? A * Math.sin(k * i * sp + ph) : 0));
        if (p.grid) {
          const x0 = Math.floor(-sp / 2 / gs) * gs, x1 = Math.ceil((W + sp / 2) / gs) * gs; let d = '';
          for (let x = x0; x <= x1 + 0.01; x += gs) d += `M${pt(x, y - gs)}V${f(y + gs)}`;
          for (let yy = -1; yy <= 1; yy++) d += `M${pt(x0, y + yy * gs)}H${f(x1)}`;
          o += `<path d="${d}" fill="none" stroke="#9aa5b1" stroke-width="0.6"/>`;
        }
        if (title) o += T(ctx, title, -sp / 2 - 12, y, { size: p.lsize, anchor: 'end', italic: false, color: p.stroke });
        xs.forEach((x, i) => {
          if (p.style === 'lines') o += `<line x1="${f(x)}" y1="${f(y - 16)}" x2="${f(x)}" y2="${f(y + 16)}" ${S(p, { dash: 'solid', sw: 1.3 })}/>`;
          else if (p.style === 'coil') o += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="4" ry="16" fill="none" ${S(p, { dash: 'solid', sw: 1.2 })}/>`;
          else o += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(p.dr)}" fill="${p.stroke}"/>`;
          if (p.l0) o += T(ctx, lab(i, p.l0), x, y - (p.grid ? gs : 16) - 9, { size: p.lsize, color: p.stroke });
        });
        if (p.cr && kind === 'disp') {
          for (let m = -1; m < W / lam + 2; m++) {
            const xc = (Math.PI - ph) / k + m * lam, xr = -ph / k + m * lam, yl = y + (p.grid ? gs : 16) + 14;
            if (xc >= -sp / 2 && xc <= W + sp / 2) o += T(ctx, p.cT, xc, yl, { size: p.lsize, italic: false, color: p.stroke });
            if (xr >= -sp / 2 && xr <= W + sp / 2) o += T(ctx, p.rT, xr, yl, { size: p.lsize, italic: false, color: p.stroke });
          }
        }
      });
      if (p.sl) { const y = (p.grid ? gs : 16) + 12; o += L.dim(p, ctx, -sp / 2, y, sp / 2, y, '', { ah: 5 }) + T(ctx, p.sl, sp / 2 + 6, y, { size: p.lsize, anchor: 'start', italic: false, color: p.stroke }); }
      return o;
    },
  });

  /* ================= 水波（波阵面） ================= */
  const MODES = [['plane', '直线波(平面波)'], ['point', '圆形波(点波源)'], ['reflect', '反射(直障碍物)'], ['refract', '折射(水深改变)'], ['gap', '衍射(经过狭缝)']];
  PD.register({
    type: 'ripple', name: '水波波阵面(反射/折射/衍射)',
    defaults: { mode: 'plane', W: 320, H: 220, lam: 28, dir: 90, off: 0, trough: false, tint: true, tc: WATER, tc2: '#b9d6ee', wc: '#000000', ww: 1.4, frame: true, arrows: true,
      sx: 0, sy: 0, half: false, src: 'S', img: false, wsrc: 'plane', by: 60, ratio: 0.6, gap: 40, l1: '深水', l2: '浅水', lsize: 14 },
    fields: [
      { k: 'mode', t: 'sel', l: '类型', o: MODES, rebuild: true }, { k: 'W', t: 'num', l: '宽' }, { k: 'H', t: 'num', l: '高' }, { k: 'lam', t: 'num', l: '波长' },
      { k: 'dir', t: 'num', l: '传播方向°(0右 90上)', step: 5, when: (p) => p.mode === 'plane' || p.mode === 'refract' || (p.mode === 'reflect' && p.wsrc !== 'point') },
      { k: 'off', t: 'num', l: '相位(推移波阵面)', step: 2 },
      { k: 'wsrc', t: 'sel', l: '入射波', o: [['plane', '直线波'], ['point', '圆形波']], when: (p) => p.mode === 'reflect', rebuild: true },
      { k: 'sx', t: 'num', l: '波源 x', when: (p) => p.mode === 'point' || (p.mode === 'reflect' && p.wsrc === 'point') },
      { k: 'sy', t: 'num', l: '波源 y', when: (p) => p.mode === 'point' || (p.mode === 'reflect' && p.wsrc === 'point') },
      { k: 'half', t: 'bool', l: '只画上半', when: (p) => p.mode === 'point' }, { k: 'src', t: 'text', l: '波源标签', when: (p) => p.mode === 'point' || (p.mode === 'reflect' && p.wsrc === 'point') },
      { k: 'img', t: 'bool', l: '标出像波源 S′', when: (p) => p.mode === 'reflect' && p.wsrc === 'point' },
      { k: 'by', t: 'num', l: '障碍物/界线 y', when: (p) => p.mode === 'reflect' || p.mode === 'refract' || p.mode === 'gap' },
      { k: 'ratio', t: 'num', l: '浅水/深水 波长比', step: 0.05, when: (p) => p.mode === 'refract' },
      { k: 'l1', t: 'text', l: '深水标签', when: (p) => p.mode === 'refract' }, { k: 'l2', t: 'text', l: '浅水标签', when: (p) => p.mode === 'refract' }, { k: 'tc2', t: 'color', l: '浅水颜色', when: (p) => p.mode === 'refract' },
      { k: 'gap', t: 'num', l: '缝宽', when: (p) => p.mode === 'gap' },
      { k: 'trough', t: 'bool', l: '波谷(虚线)' }, { k: 'arrows', t: 'bool', l: '传播方向箭头' }, { k: 'frame', t: 'bool', l: '边框' },
      { k: 'tint', t: 'bool', l: '水的颜色' }, { k: 'tc', t: 'color', l: '水颜色', when: (p) => p.tint }, { k: 'wc', t: 'color', l: '波阵面颜色' }, { k: 'ww', t: 'num', l: '波阵面线宽', step: 0.2 }, { k: 'lsize', t: 'num', l: '标签字号' },
    ],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const W = +p.W, H = +p.H, lam = Math.max(3, +p.lam), Dg = Math.hypot(W, H) + 4 * lam, id = ctx.id, by = +p.by;
      const clip = (nm, x, y, w, h) => { ctx.defs.push(`<clipPath id="${id}-${nm}"><rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}"/></clipPath>`); return `url(#${id}-${nm})`; };
      const sC = S(p, { color: p.wc, sw: +p.ww || 1.4, dash: 'solid' }), sT = S(p, { color: p.wc, sw: Math.max(0.8, (+p.ww || 1.4) * 0.8), dash: 'dash' });
      const seg = (u, c) => { const v = [-u[1], u[0]]; return `M${pt(u[0] * c - v[0] * Dg, u[1] * c - v[1] * Dg)}L${pt(u[0] * c + v[0] * Dg, u[1] * c + v[1] * Dg)}`; };
      const lines = (u, c0, step) => { let d = ''; for (let m = Math.ceil((-Dg - c0) / step); m <= Math.floor((Dg - c0) / step); m++) d += seg(u, c0 + m * step); return d; };
      const pair = (cr, tr) => `<path d="${cr}" fill="none" ${sC}/>` + (p.trough && tr ? `<path d="${tr}" fill="none" ${sT}/>` : '');
      const plane = (u, c0, l) => pair(lines(u, c0, l), p.trough ? lines(u, c0 + l / 2, l) : '');
      const rings = (cx, cy) => { let cr = '', tr = ''; const o0 = ((+p.off % lam) + lam) % lam || lam; for (let r = o0; r < Dg; r += lam) { cr += circ(cx, cy, r); if (r > lam / 2) tr += circ(cx, cy, r - lam / 2); } return pair(cr, tr); };
      const ar = (x0, y0, x1, y1) => L.arrow(p, x0, y0, x1, y1, { sw: 1.4 });
      let body = '', after = '', bg = p.tint ? `<rect x="${f(-W / 2)}" y="${f(-H / 2)}" width="${f(W)}" height="${f(H)}" fill="${p.tc}"/>` : '';
      const u = dirOf(+p.dir);
      if (p.mode === 'plane') {
        body = plane(u, +p.off, lam);
        if (p.arrows) { const v = [-u[1], u[0]], a = Math.min(W, H) * 0.22; [-1, 0, 1].forEach((k) => (after += ar(v[0] * k * a - u[0] * a, v[1] * k * a - u[1] * a, v[0] * k * a + u[0] * a, v[1] * k * a + u[1] * a))); }
      } else if (p.mode === 'point') {
        body = rings(+p.sx, +p.sy);
        if (p.half) body = `<g clip-path="${clip('hf', -Dg, -Dg, 2 * Dg, Dg + +p.sy)}">${body}</g>`;
        after += `<circle cx="${f(p.sx)}" cy="${f(p.sy)}" r="3" fill="${p.stroke}"/>` + (p.src ? T(ctx, p.src, +p.sx, +p.sy + 14, { size: p.lsize, color: p.stroke, halo: true }) : '');
      } else if (p.mode === 'reflect') {
        const pt2 = p.wsrc === 'point', fr = pt2 ? rings(+p.sx, +p.sy) : plane(u, +p.off, lam);
        body = `<g clip-path="${clip('ab', -Dg, -Dg, 2 * Dg, Dg + by)}">${fr}<g transform="translate(0,${f(2 * by)}) scale(1,-1)"><g clip-path="${clip('bl', -Dg, by, 2 * Dg, Dg)}">${fr}</g></g></g>`;
        after += L.hatchLine(Object.assign({}, p, { sw: 2.2 }), -W / 2, by, W / 2, by, 1, 7, 7);
        if (pt2) {
          after += `<circle cx="${f(p.sx)}" cy="${f(p.sy)}" r="3" fill="${p.stroke}"/>` + (p.src ? T(ctx, p.src, +p.sx - 10, +p.sy - 10, { size: p.lsize, color: p.stroke, halo: true }) : '');
          if (p.img) { const iy = 2 * by - +p.sy; after += `<circle cx="${f(p.sx)}" cy="${f(iy)}" r="3.5" fill="#ffffff" ${S(p, { dash: 'solid', sw: 1 })}/><line x1="${f(p.sx)}" y1="${f(p.sy)}" x2="${f(p.sx)}" y2="${f(iy)}" ${S(p, { dash: 'dash', sw: 0.7 })}/>` + T(ctx, (p.src || 'S') + '′', +p.sx + 12, iy, { size: p.lsize, color: p.stroke, halo: true }); }
        } else if (p.arrows && u[1] > 0.05) {
          const R = Math.min(by + H / 2, W / 2) * 0.85, Pp = [0, by];
          after += `<line x1="0" y1="${f(by)}" x2="0" y2="${f(by - R)}" ${S(p, { dash: 'dash', sw: 0.8 })}/>` + ar(Pp[0] - u[0] * R, Pp[1] - u[1] * R, 0, by) + ar(0, by, u[0] * R, by - u[1] * R);
        }
      } else if (p.mode === 'refract') {
        const u1 = u[1] < -0.02 ? u : [u[0], -Math.abs(u[1]) || -1], r = +p.ratio || 0.6, lam2 = lam * r, sx2 = u1[0] * r;
        bg += p.tint ? `<rect x="${f(-W / 2)}" y="${f(-H / 2)}" width="${f(W)}" height="${f(by + H / 2)}" fill="${p.tc2}"/>` : '';
        body = `<g clip-path="${clip('dp', -Dg, by, 2 * Dg, Dg)}">${plane(u1, +p.off, lam)}</g>`;
        if (Math.abs(sx2) < 1) {
          const u2 = [sx2, -Math.sqrt(1 - sx2 * sx2)], B = [0, by], phiB = (B[0] * u1[0] + B[1] * u1[1] - +p.off) / lam, c0 = B[0] * u2[0] + B[1] * u2[1] - lam2 * phiB;
          body += `<g clip-path="${clip('sh', -Dg, -Dg, 2 * Dg, Dg + by)}">${plane(u2, c0, lam2)}</g>`;
          if (p.arrows) { const R1 = Math.min(H / 2 - by, W / 2) * 0.8, R2 = Math.min(H / 2 + by, W / 2) * 0.8; after += `<line x1="0" y1="${f(by - R2)}" x2="0" y2="${f(by + R1)}" ${S(p, { dash: 'dash', sw: 0.8 })}/>` + ar(-u1[0] * R1, by - u1[1] * R1, 0, by) + ar(0, by, u2[0] * R2, by + u2[1] * R2); }
        }
        after += `<line x1="${f(-W / 2)}" y1="${f(by)}" x2="${f(W / 2)}" y2="${f(by)}" ${S(p, { dash: 'solid', sw: 1.2 })}/>`;
        if (p.l1) after += T(ctx, p.l1, -W / 2 + 8, H / 2 - 12, { size: p.lsize, anchor: 'start', italic: false, color: p.stroke, halo: true });
        if (p.l2) after += T(ctx, p.l2, -W / 2 + 8, -H / 2 + 12, { size: p.lsize, anchor: 'start', italic: false, color: p.stroke, halo: true });
      } else if (p.mode === 'gap') {
        const a = Math.max(2, +p.gap), th = Math.asin(Math.min(1, lam / a)), d0 = ((+p.off % lam) + lam) % lam;
        let below = '', bt = '';
        for (let y = by + (d0 || lam); y < H / 2 + lam; y += lam) { below += `M${pt(-Dg, y)}H${f(Dg)}`; bt += `M${pt(-Dg, y - lam / 2)}H${f(Dg)}`; }
        const front = (r) => { if (r <= 0) return ''; const xl = -a / 2 - r * Math.sin(th), yl = by - r * Math.cos(th), xr = a / 2 + r * Math.sin(th);
          return `M${pt(xl, yl)}A${f(r)},${f(r)} 0 0 1 ${pt(-a / 2, by - r)}L${pt(a / 2, by - r)}A${f(r)},${f(r)} 0 0 1 ${pt(xr, yl)}`; };
        let ab = '', at = '';
        for (let r = lam - d0; r < Dg; r += lam) { ab += front(r); at += front(r - lam / 2); }
        body = `<g clip-path="${clip('gb', -Dg, by, 2 * Dg, Dg)}">${pair(below, bt)}</g><g clip-path="${clip('ga', -Dg, -Dg, 2 * Dg, Dg + by)}">${pair(ab, at)}</g>`;
        after += `<rect x="${f(-W / 2)}" y="${f(by - 3)}" width="${f(W / 2 - a / 2)}" height="6" fill="${p.stroke}"/><rect x="${f(a / 2)}" y="${f(by - 3)}" width="${f(W / 2 - a / 2)}" height="6" fill="${p.stroke}"/>`;
        if (p.arrows) { const R = Math.min(H / 2 + by, W / 2) * 0.7, ta = Math.min(th, 62 * D2R); after += ar(0, by - 6, 0, by - R); if (ta > 0.05) after += ar(-a / 2, by - 6, -a / 2 - R * Math.sin(ta) * 0.9, by - 6 - R * Math.cos(ta) * 0.9) + ar(a / 2, by - 6, a / 2 + R * Math.sin(ta) * 0.9, by - 6 - R * Math.cos(ta) * 0.9); after += ar(0, H / 2 - 4, 0, by + lam * 0.7); }
      }
      const fr = p.frame ? `<rect x="${f(-W / 2)}" y="${f(-H / 2)}" width="${f(W)}" height="${f(H)}" fill="none" ${S(p, { dash: 'solid', sw: 1 })}/>` : '';
      return `<g clip-path="${clip('rg', -W / 2, -H / 2, W, H)}">${bg}${body}</g>${fr}<g clip-path="${clip('rg2', -W / 2 - 1, -H / 2 - 1, W + 2, H + 2)}">${after}</g>`;
    },
  });

  /* ================= 水波槽（立体示意） ================= */
  PD.register({
    type: 'rippletank', name: '水波槽(起波器)',
    defaults: { W: 300, Dp: 200, kind: 'bar', waves: 6, lam: 22, labels: true, motor: true, rods: true, tint: true, tc: '#cfe3f2', wc: '#2e7d32', bc: '#d08c4a', lsize: 14, tRod: '橡筋', tMotor: '电动机', tBar: '棒子', tBall: '小球' },
    fields: [
      { k: 'kind', t: 'sel', l: '起波器', o: [['bar', '直棒(直线波)'], ['ball', '小球(圆形波)']] }, { k: 'W', t: 'num', l: '水槽宽' }, { k: 'Dp', t: 'num', l: '水槽深(纵深)' },
      { k: 'waves', t: 'num', l: '波阵面数' }, { k: 'lam', t: 'num', l: '波长' }, { k: 'motor', t: 'bool', l: '电动机' }, { k: 'rods', t: 'bool', l: '支柱+橡筋' },
      { k: 'labels', t: 'bool', l: '文字标注' }, { k: 'tRod', t: 'text', l: '橡筋文字', when: (p) => p.labels }, { k: 'tMotor', t: 'text', l: '电动机文字', when: (p) => p.labels },
      { k: 'tBar', t: 'text', l: '棒子文字', when: (p) => p.labels }, { k: 'tBall', t: 'text', l: '小球文字', when: (p) => p.labels },
      { k: 'tint', t: 'bool', l: '水的颜色' }, { k: 'tc', t: 'color', l: '水颜色' }, { k: 'wc', t: 'color', l: '波阵面颜色' }, { k: 'bc', t: 'color', l: '棒子颜色' }, { k: 'lsize', t: 'num', l: '标签字号' },
    ],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const W = +p.W, Dp = +p.Dp, P = (x, z) => [x + z * 0.55, -z * 0.38], poly = (a) => a.map((q) => pt(q[0], q[1])).join(' ');
      const tray = [P(0, 0), P(W, 0), P(W, Dp), P(0, Dp)], cid = ctx.id + '-tray';
      ctx.defs.push(`<clipPath id="${cid}"><polygon points="${poly(tray)}"/></clipPath>`);
      let o = `<polygon points="${poly(tray)}" fill="${p.tint ? p.tc : '#ffffff'}" ${sd(p)}/><polygon points="${poly([P(0, 0), P(W, 0), [W, 10], [0, 10]])}" fill="${PD.shade(p.tint ? p.tc : '#dddddd', -0.15)}" ${sd(p)}/>`;
      const x0 = W * 0.14, x1 = W * 0.72, zb = Dp * 0.72, xm = (x0 + x1) / 2, ws = S(p, { color: p.wc, sw: 1.5, dash: 'solid' });
      let wv = '';
      if (p.kind === 'ball') {
        const c = [xm, zb - 14];
        for (let j = 1; j <= Math.round(+p.waves); j++) { const r = j * +p.lam; let d = ''; for (let i = 0; i <= 64; i++) { const t = (TAU * i) / 64, q = P(c[0] + r * Math.cos(t), c[1] + r * Math.sin(t)); d += (i ? 'L' : 'M') + pt(q[0], q[1]); } wv += `<path d="${d}Z" fill="none" ${ws}/>`; }
      } else for (let j = 1; j <= Math.round(+p.waves); j++) { const z = zb - j * +p.lam; if (z < 3) break; const a = P(x0 - 6, z), b = P(x1 + 6, z); wv += `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" ${ws}/>`; }
      o += `<g clip-path="url(#${cid})">${wv}</g>`;
      const up = (q, h) => [q[0], q[1] - h], b0 = P(x0, zb), b1 = P(x1, zb), bh = 13;
      if (p.rods) { [[x0 - 8, b0], [x1 + 8, b1]].forEach(([xx, bq]) => { const base = P(xx, zb + 8), top = up(base, 120); o += `<line x1="${f(base[0])}" y1="${f(base[1])}" x2="${f(top[0])}" y2="${f(top[1])}" stroke="#b58a4c" stroke-width="5" stroke-linecap="round"/><line x1="${f(top[0])}" y1="${f(top[1])}" x2="${f(bq[0])}" y2="${f(bq[1] - bh)}" ${S(p, { dash: 'solid', sw: 1 })}/>`; }); }
      if (p.kind === 'ball') { const bq = P(xm, zb - 14), m = P(xm, zb); o += `<line x1="${f(m[0])}" y1="${f(m[1] - 2)}" x2="${f(bq[0])}" y2="${f(bq[1] - 4)}" ${S(p, { dash: 'solid', sw: 1.3 })}/><circle cx="${f(bq[0])}" cy="${f(bq[1] - 4)}" r="5" fill="#ffffff" ${S(p, { dash: 'solid', sw: 1.2 })}/>`; }
      o += `<polygon points="${poly([up(b0, bh), up(b1, bh), up(P(x1, zb + 9), bh), up(P(x0, zb + 9), bh)])}" fill="${PD.shade(p.bc, 0.25)}" ${sd(p)}/><polygon points="${poly([up(b0, bh), up(b1, bh), b1, b0])}" fill="${p.bc}" ${sd(p)}/>`;
      const mt = up(P(xm, zb + 4), bh);
      if (p.motor) o += `<path d="M${pt(mt[0] - 26, mt[1] - 2)}Q${pt(mt[0] - 30, mt[1] - 34)} ${pt(mt[0] - 4, mt[1] - 22)}" fill="none" stroke="#d62828" stroke-width="2"/><rect x="${f(mt[0] - 8)}" y="${f(mt[1] - 20)}" width="28" height="18" rx="7" fill="${L.metal(ctx, '#c9c9c9', mt[1] - 20, mt[1] - 2, true)}" ${sd(p)}/><ellipse cx="${f(mt[0] + 20)}" cy="${f(mt[1] - 11)}" rx="4" ry="9" fill="#9a9a9a" ${sd(p)}/>`;
      if (p.labels) {
        const tl = (txt, ax, ay, tx, ty, anc) => (txt ? `<line x1="${f(ax)}" y1="${f(ay)}" x2="${f(tx)}" y2="${f(ty)}" ${S(p, { dash: 'solid', sw: 0.7 })}/>` + T(ctx, txt, tx + (anc === 'end' ? -4 : anc === 'start' ? 4 : 0), ty + (anc ? 0 : -9), { size: p.lsize, anchor: anc, italic: false, color: p.stroke, halo: true }) : '');
        if (p.rods) { const t0 = up(P(x0 - 8, zb + 8), 80), t1 = up(P(x1 + 8, zb + 8), 80); o += tl(p.tRod, t0[0] + 8, t0[1] + 10, (t0[0] + t1[0]) / 2, t0[1] - 50) + `<line x1="${f(t1[0] - 6)}" y1="${f(t1[1] + 6)}" x2="${f((t0[0] + t1[0]) / 2)}" y2="${f(t0[1] - 50)}" ${S(p, { dash: 'solid', sw: 0.7 })}/>`; }
        if (p.motor) o += tl(p.tMotor, mt[0], mt[1] - 22, mt[0] - 10, mt[1] - 56);
        o += tl(p.tBar, b0[0] + 4, b0[1] - 6, b0[0] - 30, b0[1] + 4, 'end');
        if (p.kind === 'ball') { const bq = P(xm, zb - 14); o += tl(p.tBall, bq[0], bq[1], bq[0] - 20, bq[1] + 44); }
      }
      return o;
    },
  });

  /* ================= 双源干涉（腹线/节线） ================= */
  PD.register({
    type: 'interfere', name: '双波源干涉(腹线/节线/程差)',
    defaults: { d: 84, lam: 24, n: 8, ph: 'in', half: true, trough: false, mono: false, c1: '#3949ab', c2: '#2e7d32', ww: 1.2, lines: 'both', kmax: 0, labs: 'both', lca: '#d81b60', lcn: '#000000', lw: 1.4, lr: 1.05,
      s1: 'S_1', s2: 'S_2', base: false, tint: false, tc: WATER, lsize: 13 },
    getHandles: (p) => [[+p.d / 2, 0], [+p.d / 2 + +p.lam, 0]],
    setHandle(p, i, x) { if (i === 0) p.d = f(Math.max(4, 2 * x)); else p.lam = f(Math.max(4, x - +p.d / 2)); },
    fields: [
      { k: 'd', t: 'num', l: '波源间距(拖第1个蓝点)' }, { k: 'lam', t: 'num', l: '波长(拖第2个蓝点)' }, { k: 'n', t: 'num', l: '波峰圈数' },
      { k: 'ph', t: 'sel', l: '两波源', o: [['in', '同相'], ['anti', '反相']] }, { k: 'half', t: 'bool', l: '只画上半' }, { k: 'trough', t: 'bool', l: '波谷(虚线)' },
      { k: 'mono', t: 'bool', l: '两组圆同色' }, { k: 'c1', t: 'color', l: 'S₁ 波阵面颜色', when: (p) => !p.mono }, { k: 'c2', t: 'color', l: 'S₂ 波阵面颜色', when: (p) => !p.mono }, { k: 'ww', t: 'num', l: '波阵面线宽', step: 0.2 },
      { k: 'lines', t: 'sel', l: '画线', o: [['both', '腹线 + 节线'], ['A', '只有腹线'], ['N', '只有节线'], ['none', '不画']] },
      { k: 'kmax', t: 'num', l: '最大程差(λ, 0=全部)', step: 0.5 }, { k: 'labs', t: 'sel', l: '线的标注', o: [['both', 'A₁ + 程差'], ['name', '只有 A₁/N₁'], ['delta', '只有程差'], ['none', '不标']] },
      { k: 'lca', t: 'color', l: '腹线颜色' }, { k: 'lcn', t: 'color', l: '节线颜色' }, { k: 'lw', t: 'num', l: '线宽', step: 0.2 }, { k: 'lr', t: 'num', l: '线长(倍数)', step: 0.05 },
      { k: 's1', t: 'text', l: '波源1标签' }, { k: 's2', t: 'text', l: '波源2标签' }, { k: 'base', t: 'bool', l: '底线' }, { k: 'tint', t: 'bool', l: '水的颜色' }, { k: 'lsize', t: 'num', l: '标签字号' },
    ],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const d = +p.d, lam = Math.max(3, +p.lam), n = Math.max(1, Math.round(+p.n)), R = n * lam + d / 2, S1 = [-d / 2, 0], S2 = [d / 2, 0], anti = p.ph === 'anti';
      let o = '';
      if (p.tint) o += `<rect x="${f(-R - 12)}" y="${f(-R - 12)}" width="${f(2 * R + 24)}" height="${f(p.half ? R + 12 : 2 * R + 24)}" fill="${p.tc}"/>`;
      const ring = (c, col) => { let cr = '', tr = ''; for (let m = 1; m <= n; m++) { cr += circ(c[0], c[1], m * lam); if (p.trough) tr += circ(c[0], c[1], (m - 0.5) * lam); } return `<path d="${cr}" fill="none" ${S(p, { color: col, sw: +p.ww, dash: 'solid' })}/>` + (tr ? `<path d="${tr}" fill="none" ${S(p, { color: col, sw: Math.max(0.7, +p.ww * 0.8), dash: 'dash' })}/>` : ''); };
      let rs = ring(S1, p.mono ? p.stroke : p.c1) + ring(S2, p.mono ? p.stroke : p.c2);
      if (p.half) { const cid = ctx.id + '-up'; ctx.defs.push(`<clipPath id="${cid}"><rect x="${f(-R * 3)}" y="${f(-R * 3)}" width="${f(R * 6)}" height="${f(R * 3)}"/></clipPath>`); rs = `<g clip-path="url(#${cid})">${rs}</g>`; }
      o += rs;
      if (p.base) o += `<line x1="${f(-R)}" y1="0" x2="${f(R)}" y2="0" ${S(p, { dash: 'solid', sw: 1 })}/>`;
      const K = Math.floor((d - 1e-6) / (lam / 2)), Rl = R * (+p.lr || 1);
      for (let k = -K; k <= K; k++) {
        if (+p.kmax > 0 && Math.abs(k) / 2 > +p.kmax + 1e-9) continue;
        const isA = (Math.abs(k) % 2 === 0) !== anti;
        if (p.lines === 'none' || (p.lines === 'A' && !isA) || (p.lines === 'N' && isA)) continue;
        let P = [];
        if (k === 0) P = [[0, 0], [0, -Rl]];
        else {
          const a = (Math.abs(k) * lam) / 4, c = d / 2, b = Math.sqrt(Math.max(1e-9, c * c - a * a)), sg = k > 0 ? 1 : -1;
          for (let s = 0; s < 10; s += 0.01) { const x = sg * a * Math.cosh(s), y = -b * Math.sinh(s); P.push([x, y]); if (Math.hypot(x, y) > Rl) break; }
        }
        if (!p.half) P = P.slice(1).reverse().map((q) => [q[0], -q[1]]).concat(P);
        o += `<polyline points="${PD.ptsStr(P)}" fill="none" ${S(p, { color: isA ? p.lca : p.lcn, sw: +p.lw, dash: 'solid' })}/>`;
        if (p.labs !== 'none') {
          const e = P[P.length - 1], u = nrm(e), idx = isA ? (anti ? (Math.abs(k) + 1) / 2 : Math.abs(k) / 2) : anti ? Math.abs(k) / 2 : (Math.abs(k) + 1) / 2;
          const nm = (isA ? 'A' : 'N') + '_' + idx, dl = k === 0 ? '(\\Delta = 0)' : `(\\Delta = ${fmtN(Math.abs(k) / 2)}\\lambda)`, col = isA ? p.lca : p.lcn;
          const lx = e[0] + u[0] * 10, ly = e[1] + u[1] * 10 - (p.labs === 'both' ? 16 : 6);
          if (p.labs === 'both' || p.labs === 'name') o += T(ctx, nm, lx, ly, { size: p.lsize + 1, color: col, halo: true });
          if (p.labs === 'both' || p.labs === 'delta') o += T(ctx, dl, lx, ly + (p.labs === 'both' ? 16 : 0), { size: p.lsize, color: col, halo: true });
        }
      }
      [[S1, p.s1], [S2, p.s2]].forEach(([q, t]) => (o += `<circle cx="${f(q[0])}" cy="${f(q[1])}" r="3" fill="${p.stroke}"/>` + (t ? T(ctx, t, q[0], q[1] + 15, { size: p.lsize + 1, color: p.stroke, halo: true }) : '')));
      return o;
    },
  });

  /* ================= 驻波（弦 / 空气柱） ================= */
  PD.register({
    type: 'standing', name: '驻波(弦/空气柱)',
    defaults: { mode: 'string', L: 320, nloop: 3, A: 28, snaps: 1, ends: 'walls', labels: true, nl: 'N', al: 'A', dimLam: false, dl: '\\frac{\\lambda}{2}', lsize: 14, sw: 1.6 },
    handles: [['L', 'zero']],
    fields: [
      { k: 'mode', t: 'sel', l: '类型', o: [['string', '弦(两端固定)'], ['closed', '一端封闭的管'], ['open', '两端开口的管']], rebuild: true },
      { k: 'L', t: 'num', l: '长度' }, { k: 'nloop', t: 'num', l: '第几谐音(圈数)', min: 1 }, { k: 'A', t: 'num', l: '振幅' },
      { k: 'snaps', t: 'num', l: '画几个时刻(1=最大位移)', min: 1 },
      { k: 'ends', t: 'sel', l: '两端', o: [['walls', '固定墙'], ['vibrator', '振动器 + 滑轮砝码'], ['none', '无']], when: (p) => p.mode === 'string' },
      { k: 'labels', t: 'bool', l: '标波节 N / 波腹 A' }, { k: 'nl', t: 'text', l: '波节文字', when: (p) => p.labels }, { k: 'al', t: 'text', l: '波腹文字', when: (p) => p.labels },
      { k: 'dimLam', t: 'bool', l: '标相邻波节距离' }, { k: 'dl', t: 'text', l: '距离标签', when: (p) => p.dimLam }, { k: 'lsize', t: 'num', l: '标签字号' },
    ],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const Ls = +p.L, n = Math.max(1, Math.round(+p.nloop)), A = +p.A, tube = p.mode !== 'string';
      const kx = p.mode === 'closed' ? ((2 * n - 1) * Math.PI) / (2 * Ls) : (n * Math.PI) / Ls, env = (x) => (p.mode === 'open' ? Math.cos(kx * x) : Math.sin(kx * x));
      const nodes = [], anti = [];
      for (let m = 0; m <= 4 * n; m++) { const xn = (p.mode === 'open' ? (m + 0.5) * Math.PI : m * Math.PI) / kx, xa = (p.mode === 'open' ? m * Math.PI : (m + 0.5) * Math.PI) / kx; if (xn <= Ls + 0.5) nodes.push(xn); if (xa <= Ls + 0.5) anti.push(xa); }
      const curve = (a) => { let d = ''; for (let i = 0; i <= 200; i++) { const x = (Ls * i) / 200; d += (i ? 'L' : 'M') + pt(x, -A * a * env(x)); } return d; };
      let o = '';
      if (tube) {
        const h = A + 12;
        o += `<line x1="0" y1="${f(-h)}" x2="${f(Ls)}" y2="${f(-h)}" ${S(p, { dash: 'solid', sw: 2.2 })}/><line x1="0" y1="${f(h)}" x2="${f(Ls)}" y2="${f(h)}" ${S(p, { dash: 'solid', sw: 2.2 })}/>`;
        if (p.mode === 'closed') o += `<rect x="-8" y="${f(-h - 1)}" width="8" height="${f(2 * h + 2)}" ${PD.fillAttr({ fillMode: 'hatch', fill: p.stroke }, ctx)} ${S(p, { dash: 'solid', sw: 1.5 })}/>`;
        o += `<line x1="0" y1="0" x2="${f(Ls)}" y2="0" ${S(p, { dash: 'dashdot', sw: 0.7 })}/>`;
      } else if (p.ends === 'walls') o += L.hatchLine(p, 0, A + 14, 0, -A - 14, 1, 7, 7) + L.hatchLine(p, Ls, -A - 14, Ls, A + 14, 1, 7, 7);
      else if (p.ends === 'vibrator') {
        o += `<rect x="-40" y="-16" width="36" height="32" rx="3" fill="#888888" ${sd(p)}/><line x1="-4" y1="0" x2="0" y2="0" ${S(p, { dash: 'solid', sw: 2 })}/>`;
        o += `<circle cx="${f(Ls)}" cy="10" r="10" fill="#d0d0d0" ${sd(p)}/><circle cx="${f(Ls)}" cy="10" r="2" fill="${p.stroke}"/><line x1="${f(Ls + 10)}" y1="10" x2="${f(Ls + 10)}" y2="60" ${S(p, { dash: 'solid', sw: 1.2 })}/>` + L.hanger(p, ctx, Ls + 10, 60, 3, '', 22);
      }
      const sn = Math.max(1, Math.round(+p.snaps));
      for (let j = 0; j <= sn; j++) {
        const a = Math.cos((Math.PI * j) / sn), ext = j === 0 || j === sn;
        if (sn === 1) o += `<path d="${curve(a)}" fill="none" ${j === 0 ? S(p) : S(p, { dash: 'dash', sw: Math.max(0.8, (+p.sw || 1.5) * 0.8) })}/>`;
        else o += `<path d="${curve(a)}" fill="none" ${ext ? S(p, { dash: j ? 'dash' : 'solid' }) : S(p, { color: '#9a9a9a', sw: 0.9, dash: 'solid' })}/>`;
      }
      if (p.labels) {
        nodes.forEach((x) => (o += T(ctx, p.nl, x, (tube ? A + 12 : A * 0.2) + 14, { size: p.lsize, color: p.stroke, halo: true })));
        anti.forEach((x) => (o += T(ctx, p.al, x, -A - (tube ? 26 : 14), { size: p.lsize, color: p.stroke, halo: true })));
      }
      if (p.dimLam && nodes.length >= 2) { const y = A + (tube ? 40 : 30); o += L.dim(p, ctx, nodes[0], y, nodes[1], y, p.dl, { off: -14, size: p.lsize }); }
      return o;
    },
  });

  /* ================= 狭缝板 ================= */
  PD.register({
    type: 'slits', name: '狭缝板(单缝/双缝/光栅)',
    defaults: { H: 200, t: 10, kind: 'double', g: 7, a: 40, n: 9, gs: 9, fill: '#a8743f' },
    fields: [{ k: 'kind', t: 'sel', l: '类型', o: [['single', '单缝'], ['double', '双缝'], ['grating', '光栅(多缝)']], rebuild: true }, { k: 'H', t: 'num', l: '高' }, { k: 't', t: 'num', l: '厚度' },
      { k: 'g', t: 'num', l: '缝宽' }, { k: 'a', t: 'num', l: '双缝间距', when: (p) => p.kind === 'double' }, { k: 'n', t: 'num', l: '缝数', when: (p) => p.kind === 'grating' }, { k: 'gs', t: 'num', l: '缝间距', when: (p) => p.kind === 'grating' }, { k: 'fill', t: 'color', l: '颜色' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p) {
      const H = +p.H, t = +p.t, g = +p.g;
      let cs = p.kind === 'single' ? [0] : p.kind === 'double' ? [-p.a / 2, p.a / 2] : [];
      if (p.kind === 'grating') { const n = Math.max(2, Math.round(+p.n)); for (let i = 0; i < n; i++) cs.push((i - (n - 1) / 2) * +p.gs); }
      const ys = [-H / 2]; cs.forEach((c) => ys.push(c - g / 2, c + g / 2)); ys.push(H / 2);
      let o = '';
      for (let i = 0; i < ys.length; i += 2) if (ys[i + 1] - ys[i] > 0.3) o += `<rect x="${f(-t / 2)}" y="${f(ys[i])}" width="${f(t)}" height="${f(ys[i + 1] - ys[i])}" fill="${p.fill}" ${L.thin(p, 0.8)}/>`;
      return o;
    },
  });

  /* ================= 杨氏双缝实验 ================= */
  const ordLab = (m, style, M) => (style === 'num' ? String(Math.abs(m)) : style === 'zh' ? (m === 0 ? '第0级(中央)' : Math.abs(m) === 1 ? '第1级' : Math.abs(m) === M && m > 0 ? '第n级' : '') : '');
  PD.register({
    type: 'youngs', name: '杨氏双缝实验(俯视图)',
    defaults: { a: 46, D: 340, H: 220, Hs: 250, dy: 24, M: 5, zn: 3, g: 8, laser: true, ll: '激光(波长 \\lambda)', rays: true, centre: true, construct: true, dims: true, pts: true, fringes: true, fx: 34,
      ord: 'zh', fc: '#2e7d32', rc: '#2e7d32', rw: 1.4, slitc: '#a8743f', lsize: 14, sl: '双缝', scl: '屏幕' },
    getHandles: (p) => [[+p.D, -(+p.zn) * +p.dy], [0, -(+p.a) / 2]],
    setHandle(p, i, x, y) { if (i === 0) { p.D = f(Math.max(60, x)); p.zn = clamp(Math.round(-y / (+p.dy || 1)), 1, +p.M || 5); } else p.a = f(Math.max(6, -2 * y)); },
    fields: [
      { k: 'a', t: 'num', l: '缝距 a(拖缝 A)' }, { k: 'D', t: 'num', l: '缝屏距离 D(拖 Z)' }, { k: 'H', t: 'num', l: '双缝板高' }, { k: 'Hs', t: 'num', l: '屏幕高' }, { k: 'g', t: 'num', l: '缝宽' },
      { k: 'dy', t: 'num', l: '条纹间距 Δy' }, { k: 'M', t: 'num', l: '每侧条纹数' }, { k: 'zn', t: 'num', l: 'Z 点在第几级' },
      { k: 'laser', t: 'bool', l: '入射激光' }, { k: 'll', t: 'text', l: '激光文字', when: (p) => p.laser }, { k: 'rays', t: 'bool', l: '到 Z 的光线' }, { k: 'centre', t: 'bool', l: '中线 + 角 θ' },
      { k: 'construct', t: 'bool', l: '程差作图(AW ⊥ BZ)' }, { k: 'pts', t: 'bool', l: '标 A B X W Y Z' }, { k: 'dims', t: 'bool', l: '标 a、D、yₙ、Δy' },
      { k: 'fringes', t: 'bool', l: '右侧亮纹' }, { k: 'fx', t: 'num', l: '亮纹离屏距离', when: (p) => p.fringes }, { k: 'ord', t: 'sel', l: '级数标注', o: [['zh', '第0级(中央)…'], ['num', '数字'], ['none', '不标']], when: (p) => p.fringes },
      { k: 'sl', t: 'text', l: '双缝标签' }, { k: 'scl', t: 'text', l: '屏幕标签' },
      { k: 'fc', t: 'color', l: '亮纹颜色' }, { k: 'rc', t: 'color', l: '光线颜色' }, { k: 'rw', t: 'num', l: '光线线宽', step: 0.2 }, { k: 'slitc', t: 'color', l: '双缝板颜色' }, { k: 'lsize', t: 'num', l: '标签字号' },
    ],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const a = +p.a, D = +p.D, H = +p.H, Hs = +p.Hs, dy = +p.dy, M = Math.max(1, Math.round(+p.M)), zn = Math.round(+p.zn), g = +p.g;
      const A = [0, -a / 2], B = [0, a / 2], Z = [D, -zn * dy], Y = [D, 0], ls = p.lsize, thin = S(p, { dash: 'dash', sw: 0.9 });
      let o = '';
      o += PD.shapes.slits.render({ H, t: 10, kind: 'double', g, a, fill: p.slitc, stroke: p.stroke, sw: p.sw }, ctx);
      o += `<rect x="${f(D)}" y="${f(-Hs / 2)}" width="8" height="${f(Hs)}" fill="#bfc4ca" ${sd(p)}/>`;
      if (p.laser) { for (let k = 0; k < 5; k++) { const y = -H * 0.36 + (H * 0.72 * k) / 4; o += L.ray(p, [[-95, y], [-14, y]], { color: p.rc, sw: 1.2 }); } if (p.ll) o += T(ctx, p.ll, -55, -H * 0.36 - 22, { size: ls, italic: false, color: p.stroke }); }
      if (p.centre) { o += `<line x1="0" y1="0" x2="${f(D)}" y2="0" ${thin}/><line x1="0" y1="0" x2="${f(Z[0])}" y2="${f(Z[1])}" ${thin}/>` + L.angArc(p, ctx, [0, 0], 0, Math.atan2(Z[1], Z[0]), 44, '\\theta_n', ls); }
      if (p.rays) o += L.ray(p, [A, Z], { color: p.rc, sw: +p.rw }) + L.ray(p, [B, Z], { color: p.rc, sw: +p.rw });
      let Wp = null;
      if (p.construct) { const u = nrm([Z[0] - B[0], Z[1] - B[1]]), t = (A[0] - B[0]) * u[0] + (A[1] - B[1]) * u[1]; Wp = [B[0] + u[0] * t, B[1] + u[1] * t]; o += `<line x1="${f(A[0])}" y1="${f(A[1])}" x2="${f(Wp[0])}" y2="${f(Wp[1])}" ${thin}/>`; }
      if (p.pts) {
        const lb = (t, q, dx, dyy) => T(ctx, t, q[0] + dx, q[1] + dyy, { size: ls + 1, color: p.stroke, halo: true });
        o += lb('A', A, -10, -12) + lb('B', B, -10, 12) + lb('X', [0, 0], -12, 8) + lb('Y', Y, 12, 10) + lb('Z', Z, -4, -14) + (Wp ? lb('W', Wp, 4, 12) : '');
      }
      if (p.dims) {
        o += L.dim(p, ctx, -30, -a / 2, -30, a / 2, 'a', { off: 10, size: ls });
        o += L.dim(p, ctx, 0, H / 2 + 18, D, H / 2 + 18, 'D', { off: -12, size: ls });
        o += L.dim(p, ctx, D + 18, 0, D + 18, Z[1], 'y_n', { off: -12, size: ls });
      }
      if (p.fringes) {
        const X = D + +p.fx;
        for (let m = -M; m <= M; m++) {
          const y = -m * dy; o += `<rect x="${f(X)}" y="${f(y - dy * 0.2)}" width="16" height="${f(dy * 0.4)}" fill="${p.fc}"/>`;
          const t = ordLab(m, p.ord, M); if (t) o += T(ctx, t, X + 22, y, { size: ls - 1, anchor: 'start', italic: false, color: p.stroke });
        }
        if (p.dims && M >= 2) o += L.dim(p, ctx, X + 8, -(M - 1) * dy, X + 8, -M * dy, '', { ah: 5 }) + T(ctx, '\\Delta y', X - 4, -(M - 0.5) * dy, { size: ls, anchor: 'end', color: p.stroke, halo: true });
      }
      if (p.sl) o += T(ctx, p.sl, 0, H / 2 + 40, { size: ls, italic: false, color: p.stroke });
      if (p.scl) o += T(ctx, p.scl, D + 4, Hs / 2 + 16, { size: ls, italic: false, color: p.stroke });
      return o;
    },
  });

  /* ================= 衍射光栅实验 ================= */
  PD.register({
    type: 'grating', name: '衍射光栅实验(俯视图)',
    defaults: { D: 340, Hs: 260, th1: 13, N: 3, zn: 2, light: true, ll: '光(波长 \\lambda)', inset: false, dl: 'd', gl: '光栅(栅线间距 d)', lines: true, dims: true, ord: 'zh', dotc: '#2e7d32', rc: '#2e7d32', gc: '#a8743f', lsize: 14, scl: '屏幕' },
    fields: [
      { k: 'D', t: 'num', l: '光栅屏距离 D' }, { k: 'Hs', t: 'num', l: '屏幕高' }, { k: 'th1', t: 'num', l: '第1级衍射角°(sinθₙ = n sinθ₁)', step: 1 }, { k: 'N', t: 'num', l: '最多画到第几级' }, { k: 'zn', t: 'num', l: '标注第几级的 θₙ、yₙ' },
      { k: 'light', t: 'bool', l: '入射光' }, { k: 'll', t: 'text', l: '入射光文字', when: (p) => p.light }, { k: 'gl', t: 'text', l: '光栅文字' },
      { k: 'inset', t: 'bool', l: '放大图(栅线 + d)' }, { k: 'dl', t: 'text', l: '栅距标签', when: (p) => p.inset }, { k: 'lines', t: 'bool', l: '到各级的虚线' }, { k: 'dims', t: 'bool', l: '标 D、yₙ、θₙ' },
      { k: 'ord', t: 'sel', l: '级数标注', o: [['zh', '第0级(中央)…'], ['num', '数字'], ['none', '不标']] }, { k: 'scl', t: 'text', l: '屏幕标签' },
      { k: 'dotc', t: 'color', l: '亮点颜色' }, { k: 'rc', t: 'color', l: '入射光颜色' }, { k: 'gc', t: 'color', l: '光栅颜色' }, { k: 'lsize', t: 'num', l: '标签字号' },
    ],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const D = +p.D, Hs = +p.Hs, s1 = Math.sin(clamp(+p.th1, 0.5, 89) * D2R), N = Math.max(0, Math.round(+p.N)), ls = p.lsize, thin = S(p, { dash: 'dash', sw: 0.9 });
      let o = `<rect x="-3" y="-16" width="6" height="32" fill="${p.gc}" ${sd(p)}/><rect x="${f(D)}" y="${f(-Hs / 2)}" width="8" height="${f(Hs)}" fill="#bfc4ca" ${sd(p)}/>`;
      if (p.inset) {
        const bx = -250, byy = -150, bw = 96, bh = 86;
        o += `<polygon points="${pt(bx + bw, byy)} ${pt(bx + bw, byy + bh)} 0,16 0,-16" fill="#f39c3c" fill-opacity="0.55"/><rect x="${f(bx)}" y="${f(byy)}" width="${f(bw)}" height="${f(bh)}" fill="#f2efe8" ${sd(p)}/>`;
        let d = ''; for (let x = bx + 8; x < bx + bw - 2; x += 11) d += `M${pt(x, byy + 2)}Q${pt(x + 2, byy + bh / 2)} ${pt(x, byy + bh - 2)}`;
        o += `<path d="${d}" fill="none" stroke="#8a8a8a" stroke-width="1.6"/>` + L.dim(p, ctx, bx + 8, byy - 10, bx + 19, byy - 10, '', { ah: 4 }) + T(ctx, p.dl, bx + 13, byy - 24, { size: ls, color: p.stroke });
      }
      if (p.gl) o += T(ctx, p.gl, 0, -32, { size: ls, italic: false, color: p.stroke });
      if (p.light) o += L.ray(p, [[-130, 0], [-6, 0]], { color: p.rc, sw: 2 }) + (p.ll ? T(ctx, p.ll, -70, 16, { size: ls, italic: false, color: p.stroke }) : '');
      let yz = null;
      for (let m = -N; m <= N; m++) {
        const sn = m * s1; if (Math.abs(sn) >= 1) continue;
        const th = Math.asin(sn), y = -D * Math.tan(th); if (Math.abs(y) > Hs / 2 + 40) continue;
        if (p.lines) o += `<line x1="0" y1="0" x2="${f(D)}" y2="${f(y)}" ${thin}/>`;
        o += `<circle cx="${f(D + 16)}" cy="${f(y)}" r="3.5" fill="${p.dotc}"/>`;
        const t = ordLab(m, p.ord, N); if (t) o += T(ctx, t, D + 26, y, { size: ls - 1, anchor: 'start', italic: false, color: p.stroke });
        if (m === Math.round(+p.zn)) yz = y;
      }
      if (p.dims) {
        o += L.dim(p, ctx, 0, Hs / 2 * 0.55, D, Hs / 2 * 0.55, 'D', { off: -12, size: ls });
        if (yz != null) o += L.angArc(p, ctx, [0, 0], 0, Math.atan2(yz, D), 60, '\\theta_n', ls) + L.dim(p, ctx, D - 14, 0, D - 14, yz, 'y_n', { off: 12, size: ls });
      }
      if (p.scl) o += T(ctx, p.scl, D + 4, Hs / 2 + 16, { size: ls, italic: false, color: p.stroke });
      return o;
    },
  });

  /* ================= 条纹图样 ================= */
  PD.register({
    type: 'fringes', name: '干涉/衍射条纹图样',
    defaults: { kind: 'double', W: 320, H: 44, period: 28, env: 160, N: 6, bg: 'dark', fc: '#e53935', frame: true },
    fields: [{ k: 'kind', t: 'sel', l: '图样', o: [['double', '双缝(等距条纹)'], ['single', '单缝(中央宽亮纹)'], ['grating', '光栅(细锐亮线)'], ['bars', '示意亮纹(色块)']], rebuild: true },
      { k: 'W', t: 'num', l: '长' }, { k: 'H', t: 'num', l: '宽' }, { k: 'period', t: 'num', l: '条纹间距', when: (p) => p.kind !== 'single' },
      { k: 'env', t: 'num', l: '单缝包络半宽(0=无)', when: (p) => p.kind !== 'bars' && p.kind !== 'grating' }, { k: 'N', t: 'num', l: '缝数', when: (p) => p.kind === 'grating' },
      { k: 'bg', t: 'sel', l: '背景', o: [['dark', '黑底(照片效果)'], ['light', '白底(打印)']] }, { k: 'fc', t: 'color', l: '光的颜色' }, { k: 'frame', t: 'bool', l: '边框' }],
    style: ['stroke', 'opacity'],
    render(p) {
      const W = +p.W, H = +p.H, per = Math.max(2, +p.period), env = +p.env, N = Math.max(2, Math.round(+p.N));
      const sinc = (x) => (Math.abs(x) < 1e-6 ? 1 : Math.sin(x) / x);
      const I = (x) => {
        if (p.kind === 'single') return sinc((Math.PI * x) / Math.max(2, env)) ** 2;
        if (p.kind === 'grating') { const a = (Math.PI * x) / per, s = Math.sin(a); return Math.abs(s) < 1e-6 ? 1 : (Math.sin(N * a) / (N * s)) ** 2; }
        return Math.cos((Math.PI * x) / per) ** 2 * (env > 0 ? sinc((Math.PI * x) / env) ** 2 : 1);
      };
      let o = `<rect x="${f(-W / 2)}" y="${f(-H / 2)}" width="${f(W)}" height="${f(H)}" fill="${p.bg === 'dark' ? '#0b0b0b' : '#ffffff'}"/>`;
      if (p.kind === 'bars') { for (let m = -Math.floor(W / 2 / per); m <= Math.floor(W / 2 / per); m++) o += `<rect x="${f(m * per - per * 0.2)}" y="${f(-H / 2 + 2)}" width="${f(per * 0.4)}" height="${f(H - 4)}" fill="${p.fc}"/>`; }
      else { const n = Math.min(900, Math.max(200, Math.round(W))), w = W / n; for (let i = 0; i < n; i++) { const x = -W / 2 + (i + 0.5) * w, v = I(x); if (v > 0.015) o += `<rect x="${f(x - w / 2 - 0.05)}" y="${f(-H / 2)}" width="${f(w + 0.1)}" height="${f(H)}" fill="${p.fc}" fill-opacity="${f(Math.min(1, v))}"/>`; } }
      if (p.frame) o += `<rect x="${f(-W / 2)}" y="${f(-H / 2)}" width="${f(W)}" height="${f(H)}" fill="none" ${S(p, { dash: 'solid', sw: 1 })}/>`;
      return o;
    },
  });

  /* ================= 音叉 ================= */
  PD.register({
    type: 'fork', name: '音叉',
    defaults: { P: 90, g: 16, w: 8, stem: 50, vib: true, waves: 0, wsp: 16, label: '', lsize: 14, fill: '#b9bec4', mallet: false },
    fields: [{ k: 'P', t: 'num', l: '叉臂长' }, { k: 'g', t: 'num', l: '叉臂间隙' }, { k: 'w', t: 'num', l: '叉臂粗' }, { k: 'stem', t: 'num', l: '手柄长' },
      { k: 'vib', t: 'bool', l: '振动记号' }, { k: 'waves', t: 'num', l: '向右的声波(弧线数)', min: 0 }, { k: 'wsp', t: 'num', l: '声波间距', when: (p) => p.waves > 0 },
      { k: 'mallet', t: 'bool', l: '橡胶锤' }, { k: 'label', t: 'text', l: '标签(如 512 Hz)' }, { k: 'lsize', t: 'num', l: '标签字号' }, { k: 'fill', t: 'color', l: '颜色' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const P = +p.P, g = +p.g, w = +p.w, xa = g / 2 + w / 2, yb = g / 2 + w, sw = +p.sw || 1.5;
      const U = `M${pt(-xa, -P)}V0Q${pt(-xa, yb)} 0,${f(yb)}Q${pt(xa, yb)} ${pt(xa, 0)}V${f(-P)}`;
      let o = `<path d="${U}" fill="none" stroke="${p.stroke}" stroke-width="${f(w + 2 * sw)}" stroke-linecap="butt"/><path d="${U}" fill="none" stroke="${p.fill}" stroke-width="${f(w)}" stroke-linecap="butt"/>`;
      o += `<rect x="${f(-w * 0.45)}" y="${f(yb + w / 2 - 1)}" width="${f(w * 0.9)}" height="${f(+p.stem)}" fill="${p.fill}" ${sd(p)}/><circle cx="0" cy="${f(yb + w / 2 + +p.stem)}" r="${f(w * 0.7)}" fill="${p.fill}" ${sd(p)}/>`;
      if (p.vib) [-1, 1].forEach((s) => [8, 14].forEach((dx) => (o += `<path d="M${pt(s * (xa + w / 2 + dx), -P * 0.95)}Q${pt(s * (xa + w / 2 + dx + 4), -P * 0.78)} ${pt(s * (xa + w / 2 + dx), -P * 0.6)}" fill="none" ${S(p, { dash: 'solid', sw: 1 })}/>`)));
      for (let k = 1; k <= Math.round(+p.waves || 0); k++) { const r = xa + w + 18 + k * +p.wsp, c = [0, -P * 0.7], a = 0.6; o += `<path d="M${pt(c[0] + r * Math.cos(-a), c[1] + r * Math.sin(-a))}A${f(r)},${f(r)} 0 0 1 ${pt(c[0] + r * Math.cos(a), c[1] + r * Math.sin(a))}" fill="none" ${S(p, { dash: 'solid', sw: 1.2 })}/>`; }
      if (p.mallet) o += `<line x1="${f(-xa - 30)}" y1="${f(-P * 0.75)}" x2="${f(-xa - 90)}" y2="${f(-P * 0.2)}" stroke="#a87b45" stroke-width="4" stroke-linecap="round"/><ellipse cx="${f(-xa - 24)}" cy="${f(-P * 0.8)}" rx="11" ry="8" transform="rotate(-42 ${f(-xa - 24)} ${f(-P * 0.8)})" fill="#7a3b2e" ${sd(p)}/>`;
      if (p.label) o += T(ctx, p.label, w + 6, yb + +p.stem * 0.6, { size: p.lsize, anchor: 'start', italic: false, color: p.stroke });
      return o;
    },
  });

  /* ================= 扬声器 / 咪高峰 / 锤子 ================= */
  PD.register({
    type: 'speaker', name: '扬声器', defaults: { s: 60, waves: 3, fill: '#555555' },
    fields: [{ k: 's', t: 'num', l: '大小' }, { k: 'waves', t: 'num', l: '声波弧线数', min: 0 }, { k: 'fill', t: 'color', l: '颜色' }], style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p) {
      const s = +p.s;
      let o = `<rect x="${f(-s * 0.5)}" y="${f(-s * 0.2)}" width="${f(s * 0.3)}" height="${f(s * 0.4)}" fill="${p.fill}" ${sd(p)}/><polygon points="${pt(-s * 0.2, -s * 0.2)} ${pt(s * 0.15, -s * 0.48)} ${pt(s * 0.15, s * 0.48)} ${pt(-s * 0.2, s * 0.2)}" fill="${PD.shade(p.fill, 0.35)}" ${sd(p)}/>`;
      for (let k = 1; k <= Math.round(+p.waves || 0); k++) { const r = s * 0.2 + k * s * 0.18; o += `<path d="M${pt(r * Math.cos(-0.6), r * Math.sin(-0.6))}A${f(r)},${f(r)} 0 0 1 ${pt(r * Math.cos(0.6), r * Math.sin(0.6))}" fill="none" ${S(p, { dash: 'solid', sw: 1.3 })}/>`; }
      return o;
    },
  });
  PD.register({
    type: 'mic', name: '咪高峰(麦克风)', defaults: { s: 56, cable: true, label: '', lsize: 14, fill: '#3d3d3d' },
    fields: [{ k: 's', t: 'num', l: '大小' }, { k: 'cable', t: 'bool', l: '电线' }, { k: 'label', t: 'text', l: '标签' }, { k: 'lsize', t: 'num', l: '标签字号' }, { k: 'fill', t: 'color', l: '颜色' }], style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const s = +p.s, r = s * 0.2;
      let o = p.cable ? `<path d="M${pt(-s * 0.85, 0)}C${pt(-s * 1.1, 0)} ${pt(-s * 1.05, s * 0.3)} ${pt(-s * 1.35, s * 0.32)}" fill="none" stroke="${p.stroke}" stroke-width="2"/>` : '';
      o += `<path d="M${pt(-r * 0.7, -s * 0.07)}L${pt(-s * 0.85, -s * 0.05)}L${pt(-s * 0.85, s * 0.05)}L${pt(-r * 0.7, s * 0.07)}Z" fill="${p.fill}" ${sd(p)}/>`;
      o += `<circle cx="0" cy="0" r="${f(r)}" ${PD.fillAttr({ fillMode: 'cross', fill: '#666' }, ctx)} ${sd(p)}/><circle cx="0" cy="0" r="${f(r)}" fill="#cfd3d8" fill-opacity="0.5"/>`;
      if (p.label) o += T(ctx, p.label, 0, r + 14, { size: p.lsize, italic: false, color: p.stroke });
      return o;
    },
  });
  PD.register({
    type: 'hammer', name: '锤子', defaults: { L: 90, fill: '#7a7a7a' },
    fields: [{ k: 'L', t: 'num', l: '长度' }, { k: 'fill', t: 'color', l: '锤头颜色' }], style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p) { const Lh = +p.L; return `<rect x="-3.5" y="0" width="7" height="${f(Lh)}" rx="2" fill="#b58a4c" ${sd(p)}/><rect x="-18" y="-12" width="36" height="16" rx="2" fill="${p.fill}" ${sd(p)}/>`; },
  });

  /* ================= 示波器（含乐器波形） ================= */
  const HARM = {
    sine: [1], fork: [1], flute: [1, 0.35, 0.12, 0.05], clarinet: [1, 0, 0.5, 0, 0.32, 0, 0.18, 0, 0.1], violin: [1, 0.55, 0.38, 0.28, 0.2, 0.15, 0.1], trumpet: [1, 0.9, 0.75, 0.55, 0.38, 0.22, 0.12],
    piano: [1, 0.5, 0.3, 0.15, 0.08], guitar: [1, 0.7, 0.45, 0.35, 0.2, 0.12],
  };
  const WAVES = [['sine', '正弦波'], ['square', '方波'], ['triangle', '三角波'], ['saw', '锯齿波'], ['echo', '两个脉冲(回声/两个咪高峰)'], ['fork', '音叉(纯音)'], ['flute', '长笛'], ['clarinet', '单簧管'], ['violin', '小提琴'], ['trumpet', '小号'], ['piano', '钢琴(逐渐衰减)'], ['guitar', '结他'], ['custom', '自定义谐音']];
  PD.register({
    type: 'cro', name: '示波器(乐器波形/脉冲)',
    defaults: { W: 240, H: 180, frame: 'cro', nx: 10, ny: 8, wave: 'sine', cyc: 2, amp: 3, ph: 0, harm: '1, 0.5, 0.3', decay: 0, gapDiv: 4, dual: false, amp2: 3, cyc2: 2, ph2: 90, screen: 'light', tc: '#000000', tc2: '#d62828', tw: 1.6, label: '', lsize: 14 },
    fields: [
      { k: 'frame', t: 'sel', l: '外观', o: [['cro', '示波器(含旋钮)'], ['plain', '只有屏幕方格'], ['none', '只有波形']] }, { k: 'W', t: 'num', l: '屏宽' }, { k: 'H', t: 'num', l: '屏高' },
      { k: 'nx', t: 'num', l: '横向格数' }, { k: 'ny', t: 'num', l: '纵向格数' },
      { k: 'wave', t: 'sel', l: '波形', o: WAVES, rebuild: true }, { k: 'harm', t: 'text', l: '各谐音振幅(逗号分隔)', when: (p) => p.wave === 'custom' },
      { k: 'cyc', t: 'num', l: '屏上周期数', step: 0.5, when: (p) => p.wave !== 'echo' }, { k: 'amp', t: 'num', l: '振幅(格)', step: 0.5 }, { k: 'ph', t: 'num', l: '相位°', step: 15, when: (p) => p.wave !== 'echo' },
      { k: 'decay', t: 'num', l: '衰减(0=无)', step: 0.5, when: (p) => p.wave !== 'echo' }, { k: 'gapDiv', t: 'num', l: '两脉冲相隔(格)', step: 0.5, when: (p) => p.wave === 'echo' },
      { k: 'dual', t: 'bool', l: '第二条波形(双踪)', rebuild: true }, { k: 'amp2', t: 'num', l: '波形2 振幅(格)', step: 0.5, when: (p) => p.dual }, { k: 'cyc2', t: 'num', l: '波形2 周期数', step: 0.5, when: (p) => p.dual }, { k: 'ph2', t: 'num', l: '波形2 相位°', step: 15, when: (p) => p.dual },
      { k: 'screen', t: 'sel', l: '屏幕', o: [['light', '浅色(打印)'], ['dark', '深色(示波器效果)']] }, { k: 'tc', t: 'color', l: '波形颜色' }, { k: 'tc2', t: 'color', l: '波形2 颜色', when: (p) => p.dual }, { k: 'tw', t: 'num', l: '波形线宽', step: 0.2 },
      { k: 'label', t: 'text', l: '下方标签' }, { k: 'lsize', t: 'num', l: '标签字号' },
    ],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const W = +p.W, H = +p.H, nx = Math.max(1, Math.round(+p.nx)), ny = Math.max(2, Math.round(+p.ny)), gx = W / nx, gy = H / ny, dark = p.screen === 'dark';
      const fn = (wave, cyc, ph, harmS) => (t) => {
        const th = TAU * cyc * t + ph * D2R, dk = +p.decay > 0 ? Math.exp(-(+p.decay) * t) : 1;
        if (wave === 'square') return Math.sign(Math.sin(th)) * dk;
        if (wave === 'triangle') return (2 / Math.PI) * Math.asin(Math.sin(th)) * dk;
        if (wave === 'saw') { const x = th / TAU; return 2 * (x - Math.floor(x + 0.5)) * dk; }
        if (wave === 'echo') { const t0 = 0.12, t1 = t0 + (+p.gapDiv || 4) / nx, burst = (c, a) => Math.exp(-(((t - c) / 0.012) ** 2)) * Math.sin(TAU * 40 * (t - c)) * a; return burst(t0, 1) + burst(t1, 0.6); }
        const h = wave === 'custom' ? String(harmS || '1').split(/[,\s]+/).map(Number).filter((x) => isFinite(x)) : HARM[wave] || [1];
        const phs = [0, 0.6, 1.3, 2.1, 0.4, 1.7, 2.8, 0.9, 2.2];
        let v = 0; h.forEach((a, k) => (v += a * Math.sin((k + 1) * th + (wave === 'sine' || wave === 'fork' ? 0 : phs[k % phs.length]))));
        const env = wave === 'piano' ? Math.exp(-2.2 * t) : wave === 'guitar' ? Math.exp(-1.2 * t) : 1;
        return v * env * dk;
      };
      const trace = (g, amp, col) => {
        const N = 600, vals = []; let mx = 0; for (let i = 0; i <= N; i++) { const v = g(i / N); vals.push(v); mx = Math.max(mx, Math.abs(v)); }
        const k = (amp * gy) / (mx || 1); let d = '';
        vals.forEach((v, i) => (d += (i ? 'L' : 'M') + pt((W * i) / N, H / 2 - v * k)));
        return `<path d="${d}" fill="none" stroke="${col}" stroke-width="${f(+p.tw)}" stroke-linejoin="round"/>`;
      };
      let o = '';
      if (p.frame === 'cro') {
        o += `<rect x="-16" y="-16" width="${f(W + 110)}" height="${f(H + 32)}" rx="8" fill="#d6d9dd" ${sd(p)}/>`;
        [0.22, 0.5, 0.78].forEach((t, i) => { const cx = W + 52, cy = H * t; o += `<circle cx="${f(cx)}" cy="${f(cy)}" r="13" fill="#555" ${sd(p)}/><line x1="${f(cx)}" y1="${f(cy)}" x2="${f(cx + 9 * Math.cos(-0.8 - i))}" y2="${f(cy + 9 * Math.sin(-0.8 - i))}" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`; });
      }
      if (p.frame !== 'none') {
        o += `<rect x="0" y="0" width="${f(W)}" height="${f(H)}" fill="${dark ? '#0f2416' : '#f7faf5'}" ${sd(p)}/>`;
        let d = ''; for (let i = 1; i < nx; i++) d += `M${pt(i * gx, 0)}V${f(H)}`; for (let j = 1; j < ny; j++) d += `M${pt(0, j * gy)}H${f(W)}`;
        o += `<path d="${d}" fill="none" stroke="${dark ? '#2f5a3b' : '#b9c4cf'}" stroke-width="0.7"/>`;
        let tk = ''; for (let i = 1; i < nx * 5; i++) tk += `M${pt((i * gx) / 5, H / 2 - 2)}v4`; for (let j = 1; j < ny * 5; j++) tk += `M${pt(W / 2 - 2, (j * gy) / 5)}h4`;
        o += `<path d="${tk}" fill="none" stroke="${dark ? '#3f7a50' : '#8a96a3'}" stroke-width="0.6"/>`;
      } else o += `<line x1="0" y1="${f(H / 2)}" x2="${f(W)}" y2="${f(H / 2)}" ${S(p, { dash: 'dash', sw: 0.7 })}/>`;
      const c1 = dark && p.tc === '#000000' ? '#7dff9a' : p.tc;
      o += trace(fn(p.wave, +p.cyc, +p.ph, p.harm), +p.amp, c1);
      if (p.dual) o += trace(fn(p.wave === 'echo' ? 'sine' : p.wave, +p.cyc2, +p.ph2, p.harm), +p.amp2, p.tc2);
      if (p.label) o += T(ctx, p.label, W / 2, H + (p.frame === 'cro' ? 32 : 16), { size: p.lsize, italic: false, color: p.stroke });
      return o;
    },
  });

  /* ================= 信号发生器 / 电子计时器 ================= */
  const box = (p, ctx, w, h, disp, title, terms) => {
    let o = `<rect x="${f(-w / 2)}" y="${f(-h / 2)}" width="${f(w)}" height="${f(h)}" rx="5" fill="#e4e6e9" ${sd(p)}/><rect x="${f(-w / 2 + 10)}" y="${f(-h / 2 + 10)}" width="${f(w * 0.62)}" height="${f(h * 0.4)}" rx="2" fill="#dfe9d4" ${S(p, { dash: 'solid', sw: 1 })}/>`;
    o += T(ctx, disp, -w / 2 + 10 + w * 0.31, -h / 2 + 10 + h * 0.2, { size: h * 0.22, italic: false, color: '#111' });
    o += `<circle cx="${f(w / 2 - 22)}" cy="${f(-h / 2 + 10 + h * 0.2)}" r="${f(h * 0.15)}" fill="#666" ${sd(p)}/>`;
    terms.forEach(([lb, col], i) => { const x = -w / 2 + 22 + i * 34, y = h / 2 - 16; o += `<circle cx="${f(x)}" cy="${f(y)}" r="6" fill="${col}" ${sd(p)}/>` + (lb ? T(ctx, lb, x, y - 14, { size: 10, italic: false, color: p.stroke }) : ''); });
    if (title) o += T(ctx, title, 0, h / 2 + 15, { size: p.lsize || 14, italic: false, color: p.stroke });
    return o;
  };
  PD.register({
    type: 'siggen', name: '信号发生器', defaults: { w: 150, h: 80, disp: '500 Hz', title: '信号发生器', lsize: 14 },
    fields: [{ k: 'w', t: 'num', l: '宽' }, { k: 'h', t: 'num', l: '高' }, { k: 'disp', t: 'text', l: '显示' }, { k: 'title', t: 'text', l: '标签' }, { k: 'lsize', t: 'num', l: '标签字号' }], style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) { return box(p, ctx, +p.w, +p.h, p.disp, p.title, [['', '#d62828'], ['', '#222']]); },
  });
  PD.register({
    type: 'etimer', name: '电子计时器', defaults: { w: 150, h: 80, disp: '0.0042 s', title: '电子计时器', t1: 'start', t2: 'stop', lsize: 14 },
    fields: [{ k: 'w', t: 'num', l: '宽' }, { k: 'h', t: 'num', l: '高' }, { k: 'disp', t: 'text', l: '显示' }, { k: 't1', t: 'text', l: '接口1' }, { k: 't2', t: 'text', l: '接口2' }, { k: 'title', t: 'text', l: '标签' }, { k: 'lsize', t: 'num', l: '标签字号' }], style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) { return box(p, ctx, +p.w, +p.h, p.disp, p.title, [[p.t1, '#d62828'], [p.t2, '#1e5fbf']]); },
  });

  /* ================= 预设 ================= */
  PD.preset(C3, '横波', 'wave', {});
  PD.preset(C3, '横波(λ、A、波峰波谷)', 'wave', { dimL: true, dimA: true, cl: true, eqLabel: '平衡位置' });
  PD.preset(C3, '绳上的波(粒子速度)', 'wave', { n: 13, l0: 'a', pv: 26, vArrow: true });
  PD.preset(C3, '波的传播(稍后波形虚线)', 'wave', { ghost: 0.25, vArrow: true });
  PD.preset(C3, '脉冲', 'wave', { shape: 'pulse', pp: 80, vArrow: true });
  PD.preset(C3, '纵波(粒子位置图)', 'longwave', { sl: '5 cm' });
  PD.preset(C3, '纵波(疏部/密部)', 'longwave', { rows: 'disp', grid: false, n: 30, sp: 14, A: 9, lam: 168, cr: true, l0: '', lb: '' });
  PD.preset(C3, '纵波(弹簧圈)', 'longwave', { rows: 'disp', grid: false, style: 'coil', n: 34, sp: 11, A: 6, lam: 130, l0: '', lb: '', cr: true });
  PD.preset(C3, 's-t 图(振动)', 'graph', { W: 320, H: 160, xmin: 0, xmax: 12.6, ymin: -1.4, ymax: 1.4, ticks: false, tlabels: false, xl: 't', yl: 's', ol: '', funcs: 'sin(x) ; 0 ; 12.57' });
  PD.preset(C3, 's-x 图(波形)', 'graph', { W: 320, H: 160, xmin: 0, xmax: 12.6, ymin: -1.4, ymax: 1.4, ticks: false, tlabels: false, xl: 'x', yl: 's', ol: '', funcs: 'sin(x) ; 0 ; 12.57' });
  PD.preset(C3, '同相 / 反相(s-t)', 'graph', { W: 320, H: 160, xmin: 0, xmax: 12.6, ymin: -1.4, ymax: 1.4, ticks: false, tlabels: false, xl: 't', yl: 's', ol: '', funcs: 'sin(x) ; 0 ; 12.57\nsin(x+PI) ; 0 ; 12.57 ; dash' });
  PD.preset(C3, '相位差 90°(s-t)', 'graph', { W: 320, H: 160, xmin: 0, xmax: 12.6, ymin: -1.4, ymax: 1.4, ticks: false, tlabels: false, xl: 't', yl: 's', ol: '', funcs: 'sin(x) ; 0 ; 12.57\nsin(x-PI/2) ; 0 ; 12.57 ; dash' });
  PD.preset(C3, '纵波 s-x 图(向右为正)', 'graph', { W: 340, H: 150, xmin: 0, xmax: 14, ymin: -1.4, ymax: 1.4, ticks: false, tlabels: false, xl: 'x', yl: 's', ol: '', funcs: 'sin(2*PI*x/8) ; 0 ; 14', dots: '0,0 1,0.71 2,1 3,0.71 4,0 5,-0.71 6,-1 7,-0.71 8,0 9,0.71 10,1 11,0.71 12,0 13,-0.71', dstyle: 'dot' });
  PD.preset(C4, '直线波', 'ripple', {});
  PD.preset(C4, '圆形波', 'ripple', { mode: 'point', sy: 70, W: 300, H: 200 });
  PD.preset(C4, '直线波的反射', 'ripple', { mode: 'reflect', dir: -55, by: 70 });
  PD.preset(C4, '圆形波的反射(像波源)', 'ripple', { mode: 'reflect', wsrc: 'point', sx: 0, sy: 10, by: 70, img: true, arrows: false });
  PD.preset(C4, '水波的折射(深→浅)', 'ripple', { mode: 'refract', dir: 60, by: 0 });
  PD.preset(C4, '衍射(缝宽≈波长)', 'ripple', { mode: 'gap', gap: 26, by: 50 });
  PD.preset(C4, '衍射(缝宽≫波长)', 'ripple', { mode: 'gap', gap: 160, lam: 22, by: 50 });
  PD.preset(C4, '水波槽(直线波)', 'rippletank', {});
  PD.preset(C4, '水波槽(圆形波)', 'rippletank', { kind: 'ball', waves: 5 });
  PD.preset(C4, '双源干涉(腹线/节线)', 'interfere', {});
  PD.preset(C4, '双源干涉(实线波峰/虚线波谷)', 'interfere', { mono: true, trough: true, lines: 'none', base: true, tint: true, n: 7, c1: '#2e7d32' });
  PD.preset(C4, '干涉图样(全平面)', 'interfere', { half: false, labs: 'name', n: 7 });
  PD.preset(C4, '驻波(弦)', 'standing', {});
  PD.preset(C4, '驻波(振动器+砝码)', 'standing', { ends: 'vibrator', nloop: 4, snaps: 3 });
  PD.preset(C4, '驻波(一端封闭的管)', 'standing', { mode: 'closed', nloop: 2, L: 280 });
  PD.preset(C4, '驻波(两端开口的管)', 'standing', { mode: 'open', nloop: 2, L: 280 });
  PD.preset(C5, '杨氏双缝实验', 'youngs', {});
  PD.preset(C5, '杨氏双缝(简图)', 'youngs', { construct: false, pts: false, ord: 'num', laser: false, M: 4 });
  PD.preset(C5, '衍射光栅实验', 'grating', {});
  PD.preset(C5, '双缝', 'slits', {});
  PD.preset(C5, '单缝', 'slits', { kind: 'single', g: 12 });
  PD.preset(C5, '光栅(多缝)', 'slits', { kind: 'grating' });
  PD.preset(C5, '双缝条纹', 'fringes', {});
  PD.preset(C5, '单缝衍射图样', 'fringes', { kind: 'single', env: 40 });
  PD.preset(C5, '光栅亮线', 'fringes', { kind: 'grating', period: 60, fc: '#43a047' });
  PD.preset(C5, '亮纹示意(打印)', 'fringes', { kind: 'bars', bg: 'light', fc: '#2e7d32', period: 24 });
  PD.preset(C6, '音叉', 'fork', { label: '512 Hz' });
  PD.preset(C6, '音叉(发声)', 'fork', { waves: 4, mallet: true });
  PD.preset(C6, '扬声器', 'speaker', {});
  PD.preset(C6, '咪高峰', 'mic', {});
  PD.preset(C6, '锤子', 'hammer', {});
  PD.preset(C6, '示波器', 'cro', {});
  PD.preset(C6, '示波器(两个脉冲)', 'cro', { wave: 'echo', amp: 3 });
  PD.preset(C6, '信号发生器', 'siggen', {});
  PD.preset(C6, '电子计时器', 'etimer', {});
  ['fork', 'flute', 'clarinet', 'violin', 'trumpet', 'piano', 'guitar'].forEach((w) => PD.preset(C6, '波形·' + WAVES.find((x) => x[0] === w)[1], 'cro', { frame: 'plain', wave: w, W: 220, H: 120, nx: 10, ny: 6, amp: 2.5, cyc: w === 'piano' || w === 'guitar' ? 5 : 2.5, label: WAVES.find((x) => x[0] === w)[1] }));
})();
