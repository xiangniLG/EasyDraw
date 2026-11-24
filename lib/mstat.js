/* 数学素材库（二）：统计 · 概率 · 表格 · 坐标几何 / 函数图像预设 · 常用公式（依赖 mgeo.js 的 PD.mlab）
   bars 棒形图 · histo 直方图/频数多边形 · ogive 累积频数 · boxplot 框线图 · stemleaf 茎叶图 · pie 圆形图 · dotplot 点图
   tree 树形图 · venn 韦恩图 · table 表格 */
(function () {
  'use strict';
  const f = PD.f, S = PD.strokeAttr, T = PD.tex, M = PD.mlab, pt = M.pt, sd = M.sd, thin = M.thin, clamp = M.clamp;
  const D2R = Math.PI / 180;
  const CS = '数学/统计', CP = '数学/概率', CG = '数学/坐标几何', CF = '数学/函数图像', CA = '数学/数与代数', CT = '通用/表格', CX = '数学/常用公式';
  const nums = (s) => String(s ?? '').split(/[,，\s]+/).filter((x) => x !== '').map(Number).filter((x) => isFinite(x));
  const strs = (s) => String(s ?? '').split(/[,，、]/).map((x) => x.trim());
  const niceStep = (max, n) => { if (!(max > 0)) return 1; const raw = max / (n || 6), p10 = Math.pow(10, Math.floor(Math.log10(raw))), r = raw / p10; return (r <= 1 ? 1 : r <= 2 ? 2 : r <= 2.5 ? 2.5 : r <= 5 ? 5 : 10) * p10; };
  const fmtv = (v) => PD.fmt(Math.round(v * 1000) / 1000);
  const PAT = [['solid', '#bfcde0'], ['hatch', '#000000'], ['solid', '#ffffff'], ['dots', '#000000'], ['cross', '#000000'], ['solid', '#8a8a8a'], ['solid', '#e0e0e0']];
  const COLS = ['#7fa6d6', '#f2a65a', '#8cc68c', '#e57373', '#b39ddb', '#ffd54f', '#80cbc4', '#bcaaa4'];
  const fillK = (p, ctx, i) => (p.bw ? PD.fillAttr({ fillMode: PAT[i % PAT.length][0], fill: PAT[i % PAT.length][1] }, ctx) : `fill="${(p.cols && strs(p.cols)[i]) || COLS[i % COLS.length]}"`);
  const lab = (ctx, p, t, x, y, o) => T(ctx, t, x, y, Object.assign({ size: +p.lsize || 14, color: p.stroke, italic: false }, o || {}));
  // 坐标轴（左下角为原点，y 向上为负）
  function axes(p, ctx, W, H, o) {
    let s = '';
    const sa = sd(p), sw = Math.max(0.8, (+p.sw || 1.5) * 0.8);
    if (o.grid && o.ystep) { let d = ''; for (let v = o.ystep; v <= o.ymax + 1e-9; v += o.ystep) d += `M0,${f(-(v / o.ymax) * H)}H${f(W)}`; s += `<path d="${d}" fill="none" stroke="#c9d3dc" stroke-width="0.7"/>`; }
    s += `<line x1="0" y1="0" x2="${f(W + 14)}" y2="0" ${sa}/><line x1="0" y1="0" x2="0" y2="${f(-H - 14)}" ${sa}/>`;
    s += PD.arrowHead(W + 20, 0, 0, 9, 'full', p.stroke, sw) + PD.arrowHead(0, -H - 20, -Math.PI / 2, 9, 'full', p.stroke, sw);
    if (o.ystep) { let d = ''; for (let v = 0; v <= o.ymax + 1e-9; v += o.ystep) { const y = -(v / o.ymax) * H; d += `M0,${f(y)}h-5`; s += lab(ctx, p, fmtv(v), -8, y, { anchor: 'end' }); } s += `<path d="${d}" fill="none" ${sa}/>`; }
    if (o.yl) s += lab(ctx, p, o.yl, 0, -H - 34);
    if (o.xl) s += lab(ctx, p, o.xl, W + 26, 0, { anchor: 'start' });
    return s;
  }
  const yAuto = (p, vmax) => { const st = +p.ystep > 0 ? +p.ystep : niceStep(vmax, 6), ym = +p.ymax > 0 ? +p.ymax : Math.ceil((vmax * 1.08) / st) * st || st; return { st, ym }; };
  const sumArr = (a) => a.reduce((s, v) => s + v, 0);

  /* ================= 棒形图 ================= */
  PD.register({
    type: 'bars', name: '棒形图(可复式)',
    defaults: { cats: '星期一, 星期二, 星期三, 星期四, 星期五', vals: '12, 18, 9, 15, 21', vals2: '', names: '', W: 340, H: 220, bw: true, cols: '', ymax: 0, ystep: 0, grid: true, horiz: false, gapr: 0.35, vlab: false, xl: '', yl: '人数', lsize: 13 },
    fields: [
      { k: 'cats', t: 'text', l: '类别(逗号分隔)' }, { k: 'vals', t: 'text', l: '数值' }, { k: 'vals2', t: 'text', l: '第二组数值(复式, 可空)' }, { k: 'names', t: 'text', l: '图例名称(如 男, 女)' },
      { k: 'horiz', t: 'bool', l: '横向' }, { k: 'W', t: 'num', l: '宽' }, { k: 'H', t: 'num', l: '高' }, { k: 'gapr', t: 'range', l: '棒间空隙', min: 0, max: 0.8, step: 0.05 },
      { k: 'ymax', t: 'num', l: '数值轴最大(0=自动)' }, { k: 'ystep', t: 'num', l: '刻度间隔(0=自动)' }, { k: 'grid', t: 'bool', l: '横网格线' }, { k: 'vlab', t: 'bool', l: '棒顶标数值' },
      { k: 'bw', t: 'bool', l: '黑白图案(打印)' }, { k: 'cols', t: 'text', l: '颜色(逗号分隔, 彩色时)', when: (p) => !p.bw },
      { k: 'xl', t: 'text', l: '类别轴标题' }, { k: 'yl', t: 'text', l: '数值轴标题' }, { k: 'lsize', t: 'num', l: '字号' },
    ],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const cats = strs(p.cats), v1 = nums(p.vals), v2 = nums(p.vals2), n = cats.length, two = v2.length > 0, W = +p.W, H = +p.H;
      const { st, ym } = yAuto(p, Math.max(...v1, ...(two ? v2 : [0]), 1));
      if (p.horiz) {
        // 横向：数值沿 x，类别沿 y
        let o = '', d = '';
        if (p.grid) { for (let v = st; v <= ym + 1e-9; v += st) d += `M${f((v / ym) * W)},0V${f(-H)}`; o += `<path d="${d}" fill="none" stroke="#c9d3dc" stroke-width="0.7"/>`; }
        o += `<line x1="0" y1="0" x2="${f(W + 14)}" y2="0" ${sd(p)}/><line x1="0" y1="0" x2="0" y2="${f(-H - 8)}" ${sd(p)}/>` + PD.arrowHead(W + 20, 0, 0, 9, 'full', p.stroke, 1);
        for (let v = 0; v <= ym + 1e-9; v += st) o += `<line x1="${f((v / ym) * W)}" y1="0" x2="${f((v / ym) * W)}" y2="5" ${sd(p)}/>` + lab(ctx, p, fmtv(v), (v / ym) * W, 18);
        const ch = H / n, bh = ch * (1 - clamp(+p.gapr, 0, 0.9));
        cats.forEach((c, i) => {
          const yc = -H + (i + 0.5) * ch;
          [[v1, 0], [v2, 1]].forEach(([arr, s]) => { if (s && !two) return; const v = arr[i]; if (!isFinite(v)) return; const hh = two ? bh / 2 : bh, y0 = yc - bh / 2 + (s ? hh : 0); o += `<rect x="0" y="${f(y0)}" width="${f((v / ym) * W)}" height="${f(hh)}" ${fillK(p, ctx, s)} ${sd(p)}/>`; if (p.vlab) o += lab(ctx, p, fmtv(v), (v / ym) * W + 6, y0 + hh / 2, { anchor: 'start' }); });
          o += lab(ctx, p, c, -8, yc, { anchor: 'end' });
        });
        if (p.yl) o += lab(ctx, p, p.yl, W + 26, 0, { anchor: 'start' }); if (p.xl) o += lab(ctx, p, p.xl, 0, -H - 22);
        return o + legend(p, ctx, W, H, two);
      }
      let o = axes(p, ctx, W, H, { ymax: ym, ystep: st, grid: p.grid, yl: p.yl, xl: p.xl });
      const cw = W / n, bw = cw * (1 - clamp(+p.gapr, 0, 0.9));
      cats.forEach((c, i) => {
        const xc = (i + 0.5) * cw;
        [[v1, 0], [v2, 1]].forEach(([arr, s]) => { if (s && !two) return; const v = arr[i]; if (!isFinite(v)) return; const w = two ? bw / 2 : bw, x0 = xc - bw / 2 + (s ? w : 0), h = (v / ym) * H; o += `<rect x="${f(x0)}" y="${f(-h)}" width="${f(w)}" height="${f(h)}" ${fillK(p, ctx, s)} ${sd(p)}/>`; if (p.vlab) o += lab(ctx, p, fmtv(v), x0 + w / 2, -h - 10); });
        o += lab(ctx, p, c, xc, 16);
      });
      return o + legend(p, ctx, W, H, two);
    },
  });
  function legend(p, ctx, W, H, two) {
    const nm = strs(p.names).filter(Boolean); if (!nm.length) return '';
    let o = ''; nm.slice(0, two ? 2 : 1).forEach((t, i) => { const y = -H + i * 22; o += `<rect x="${f(W + 20)}" y="${f(y - 7)}" width="18" height="14" ${fillK(p, ctx, i)} ${sd(p)}/>` + lab(ctx, p, t, W + 44, y, { anchor: 'start' }); });
    return o;
  }

  /* ================= 直方图 / 频数多边形 ================= */
  PD.register({
    type: 'histo', name: '直方图 / 频数多边形',
    defaults: { bounds: '0, 10, 20, 30, 40, 50', freqs: '3, 8, 12, 9, 4', bars: true, poly: false, xlab: 'bounds', W: 360, H: 220, ymax: 0, ystep: 0, grid: true, bw: true, xl: '分数', yl: '频数', lsize: 13 },
    fields: [
      { k: 'bounds', t: 'text', l: '组界(n+1 个)' }, { k: 'freqs', t: 'text', l: '频数(n 个)' },
      { k: 'bars', t: 'bool', l: '直方图' }, { k: 'poly', t: 'bool', l: '频数多边形(组中点, 两端接到 0)' }, { k: 'xlab', t: 'sel', l: '横轴标注', o: [['bounds', '组界'], ['mids', '组中点']] },
      { k: 'W', t: 'num', l: '宽' }, { k: 'H', t: 'num', l: '高' }, { k: 'ymax', t: 'num', l: '频数轴最大(0=自动)' }, { k: 'ystep', t: 'num', l: '刻度间隔(0=自动)' }, { k: 'grid', t: 'bool', l: '横网格线' },
      { k: 'bw', t: 'bool', l: '黑白图案' }, { k: 'xl', t: 'text', l: '横轴标题' }, { k: 'yl', t: 'text', l: '纵轴标题' }, { k: 'lsize', t: 'num', l: '字号' },
    ],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const b = nums(p.bounds), fr = nums(p.freqs), n = Math.min(fr.length, b.length - 1); if (n < 1) return '';
      const cw = b[1] - b[0], x0 = p.poly ? b[0] - cw : b[0], x1 = p.poly ? b[n] + cw : b[n], W = +p.W, H = +p.H, X = (v) => ((v - x0) / (x1 - x0)) * W;
      const { st, ym } = yAuto(p, Math.max(...fr, 1));
      let o = axes(p, ctx, W, H, { ymax: ym, ystep: st, grid: p.grid, yl: p.yl, xl: p.xl });
      if (p.bars) for (let i = 0; i < n; i++) { const h = (fr[i] / ym) * H; o += `<rect x="${f(X(b[i]))}" y="${f(-h)}" width="${f(X(b[i + 1]) - X(b[i]))}" height="${f(h)}" ${fillK(p, ctx, 0)} ${sd(p)}/>`; }
      const mids = []; for (let i = 0; i < n; i++) mids.push((b[i] + b[i + 1]) / 2);
      if (p.poly) { const P = [[X(mids[0] - cw), 0]].concat(mids.map((m, i) => [X(m), -(fr[i] / ym) * H])).concat([[X(mids[n - 1] + cw), 0]]); o += `<polyline points="${PD.ptsStr(P)}" fill="none" ${S(p, { dash: 'solid', sw: (+p.sw || 1.5) * 1.2 })}/>` + P.slice(1, -1).map((q) => `<circle cx="${f(q[0])}" cy="${f(q[1])}" r="2.8" fill="${p.stroke}"/>`).join(''); }
      const xs = p.xlab === 'mids' ? (p.poly ? [mids[0] - cw].concat(mids, [mids[n - 1] + cw]) : mids) : b.slice(0, n + 1);
      let d = ''; xs.forEach((v) => { d += `M${f(X(v))},0v5`; o += lab(ctx, p, fmtv(v), X(v), 17); }); o += `<path d="${d}" fill="none" ${sd(p)}/>`;
      return o;
    },
  });

  /* ================= 累积频数多边形 / 曲线 ================= */
  PD.register({
    type: 'ogive', name: '累积频数多边形 / 曲线',
    defaults: { x0: 0, ub: '10, 20, 30, 40, 50', cf: '3, 11, 23, 32, 36', cum: true, smooth: false, reads: 'Q1, M, Q3', W: 380, H: 240, ymax: 0, ystep: 0, xstep: 0, grid: 'major', vlab: true, xl: '分数', yl: '累积频数', lsize: 13, cc: '#000000' },
    fields: [
      { k: 'x0', t: 'num', l: '第一组的下组界' }, { k: 'ub', t: 'text', l: '各组上组界' }, { k: 'cf', t: 'text', l: '累积频数(或频数)' }, { k: 'cum', t: 'bool', l: '上面输入的已经是累积频数(否则自动累加)' },
      { k: 'smooth', t: 'bool', l: '画成平滑曲线(否则为折线)' },
      { k: 'reads', t: 'text', l: '读数(Q1, M, Q3 或百分位数如 P90, 或频数值)' }, { k: 'vlab', t: 'bool', l: '在横轴标出读数' },
      { k: 'W', t: 'num', l: '宽' }, { k: 'H', t: 'num', l: '高' }, { k: 'ymax', t: 'num', l: '纵轴最大(0=自动)' }, { k: 'ystep', t: 'num', l: '纵轴间隔(0=自动)' }, { k: 'xstep', t: 'num', l: '横轴间隔(0=用组界)' },
      { k: 'grid', t: 'sel', l: '网格', o: [['none', '无'], ['major', '主网格'], ['fine', '方格纸']] }, { k: 'xl', t: 'text', l: '横轴标题' }, { k: 'yl', t: 'text', l: '纵轴标题' }, { k: 'cc', t: 'color', l: '曲线颜色' }, { k: 'lsize', t: 'num', l: '字号' },
    ],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const ub = nums(p.ub); let cf = nums(p.cf); const n = Math.min(ub.length, cf.length); if (n < 1) return '';
      if (!p.cum) { let s = 0; cf = cf.map((v) => (s += v)); }
      const xs = [+p.x0].concat(ub.slice(0, n)), ys = [0].concat(cf.slice(0, n)), tot = ys[n], W = +p.W, H = +p.H;
      const { st, ym } = yAuto(p, tot), X = (v) => ((v - xs[0]) / (xs[n] - xs[0] || 1)) * W, Y = (v) => -(v / ym) * H;
      let o = '';
      const xst = +p.xstep > 0 ? +p.xstep : 0, xt = xst ? (() => { const r = []; for (let v = xs[0]; v <= xs[n] + 1e-9; v += xst) r.push(v); return r; })() : xs;
      if (p.grid !== 'none') {
        let d = '', d2 = ''; xt.forEach((v) => (d += `M${f(X(v))},0V${f(-H)}`)); for (let v = st; v <= ym + 1e-9; v += st) d += `M0,${f(Y(v))}H${f(W)}`;
        if (p.grid === 'fine') { const sx = (X(xt[1] ?? xt[0]) - X(xt[0])) / 5, sy = ((st / ym) * H) / 5; for (let x = 0; x <= W + 0.1; x += sx || W) d2 += `M${f(x)},0V${f(-H)}`; for (let y = 0; y <= H + 0.1; y += sy || H) d2 += `M0,${f(-y)}H${f(W)}`; o += `<path d="${d2}" fill="none" stroke="#c9d6e6" stroke-width="0.35"/>`; }
        o += `<path d="${d}" fill="none" stroke="#9fb6cf" stroke-width="0.7"/>`;
      }
      o += axes(p, ctx, W, H, { ymax: ym, ystep: st, yl: p.yl, xl: p.xl });
      let d = ''; xt.forEach((v) => { d += `M${f(X(v))},0v5`; o += lab(ctx, p, fmtv(v), X(v), 17); }); o += `<path d="${d}" fill="none" ${sd(p)}/>`;
      const P = xs.map((v, i) => [X(v), Y(ys[i])]);
      o += p.smooth ? `<path d="${PD.smoothPath(P, false)}" fill="none" ${S(p, { color: p.cc, sw: (+p.sw || 1.5) * 1.2, dash: 'solid' })}/>` : `<polyline points="${PD.ptsStr(P)}" fill="none" ${S(p, { color: p.cc, sw: (+p.sw || 1.5) * 1.2, dash: 'solid' })}/>`;
      o += P.map((q) => `<circle cx="${f(q[0])}" cy="${f(q[1])}" r="2.6" fill="${p.cc}"/>`).join('');
      const inv = (yv) => { for (let i = 0; i < n; i++) if (yv <= ys[i + 1] + 1e-9) { const t = (yv - ys[i]) / (ys[i + 1] - ys[i] || 1); return xs[i] + t * (xs[i + 1] - xs[i]); } return xs[n]; };
      strs(p.reads).filter(Boolean).forEach((r) => {
        const u = r.toUpperCase(); let yv, nm = r;
        if (u === 'Q1') yv = tot / 4; else if (u === 'Q3') yv = (3 * tot) / 4; else if (u === 'M' || u === 'Q2') { yv = tot / 2; nm = 'M'; } else if (/^P\d+/.test(u)) yv = (+u.slice(1) / 100) * tot; else if (isFinite(+r)) { yv = +r; nm = ''; } else return;
        const xv = inv(yv), px = X(xv), py = Y(yv);
        o += `<path d="M0,${f(py)}H${f(px)}V0" fill="none" ${S(p, { dash: 'dash', sw: 0.9 })}/>`;
        if (p.vlab) o += lab(ctx, p, (nm ? nm + ' = ' : '') + fmtv(Math.round(xv * 10) / 10), px, 34, { size: (+p.lsize || 13) - 1 });
      });
      return o;
    },
  });

  /* ================= 框线图 ================= */
  const median = (a) => { const n = a.length, m = Math.floor(n / 2); return n % 2 ? a[m] : (a[m - 1] + a[m]) / 2; };
  const five = (arr) => { const a = arr.slice().sort((x, y) => x - y), n = a.length; if (n === 5 && arr.every((v, i) => !i || v >= arr[i - 1])) return a; const h = Math.floor(n / 2), lo = a.slice(0, h), hi = a.slice(n % 2 ? h + 1 : h); return [a[0], median(lo), median(a), median(hi), a[n - 1]]; };
  PD.register({
    type: 'boxplot', name: '框线图(可多组比较)',
    defaults: { data: 'A班: 32, 45, 56, 68, 90', xmin: 20, xmax: 100, xstep: 10, W: 380, bh: 34, gap: 30, vals: false, xl: '分数', bw: true, lsize: 13 },
    fields: [
      { k: 'data', t: 'area', l: '每行一组：名称: 五个数(最小, Q1, 中位数, Q3, 最大) 或原始数据', ph: '例: A班: 32, 45, 56, 68, 90\n例: B班: 23 45 51 52 60 61 66 70 78\n(超过 5 个数会自动计算四分位数)' },
      { k: 'xmin', t: 'num', l: '数轴最小' }, { k: 'xmax', t: 'num', l: '数轴最大' }, { k: 'xstep', t: 'num', l: '刻度间隔' }, { k: 'W', t: 'num', l: '宽' }, { k: 'bh', t: 'num', l: '箱高' }, { k: 'gap', t: 'num', l: '组间距' },
      { k: 'vals', t: 'bool', l: '标出五个数值' }, { k: 'bw', t: 'bool', l: '黑白' }, { k: 'xl', t: 'text', l: '数轴标题' }, { k: 'lsize', t: 'num', l: '字号' },
    ],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const rows = PD.lines(p.data).map((l) => { const m = /^([^:：]*)[:：](.*)$/.exec(l); return { name: m ? m[1].trim() : '', v: nums(m ? m[2] : l) }; }).filter((r) => r.v.length >= 5);
      const W = +p.W, a = +p.xmin, b = +p.xmax, X = (v) => ((v - a) / (b - a || 1)) * W, bh = +p.bh, gap = +p.gap;
      const H = rows.length * (bh + gap) + gap * 0.3;
      let o = `<line x1="0" y1="0" x2="${f(W)}" y2="0" ${sd(p)}/>`, d = '';
      for (let v = a; v <= b + 1e-9; v += +p.xstep || 10) { d += `M${f(X(v))},0v5`; o += lab(ctx, p, fmtv(v), X(v), 17); }
      o += `<path d="${d}" fill="none" ${sd(p)}/>` + (p.xl ? lab(ctx, p, p.xl, W + 10, 0, { anchor: 'start' }) : '');
      rows.forEach((r, i) => {
        const q = five(r.v), yc = -H + gap * 0.5 + i * (bh + gap) + bh / 2, y0 = yc - bh / 2, y1 = yc + bh / 2;
        o += `<path d="M${pt(X(q[0]), yc)}H${f(X(q[1]))}M${pt(X(q[3]), yc)}H${f(X(q[4]))}M${pt(X(q[0]), y0 + bh * 0.25)}V${f(y1 - bh * 0.25)}M${pt(X(q[4]), y0 + bh * 0.25)}V${f(y1 - bh * 0.25)}" fill="none" ${sd(p)}/>`;
        o += `<rect x="${f(X(q[1]))}" y="${f(y0)}" width="${f(X(q[3]) - X(q[1]))}" height="${f(bh)}" ${p.bw ? 'fill="#ffffff"' : `fill="${COLS[i % COLS.length]}" fill-opacity="0.45"`} ${sd(p)}/><line x1="${f(X(q[2]))}" y1="${f(y0)}" x2="${f(X(q[2]))}" y2="${f(y1)}" ${S(p, { dash: 'solid', sw: (+p.sw || 1.5) * 1.3 })}/>`;
        if (r.name) o += lab(ctx, p, r.name, -10, yc, { anchor: 'end' });
        if (p.vals) q.forEach((v, k) => (o += lab(ctx, p, fmtv(v), X(v), y0 - 9, { size: (+p.lsize || 13) - 2 })));
      });
      return o;
    },
  });

  /* ================= 茎叶图 ================= */
  PD.register({
    type: 'stemleaf', name: '茎叶图(可背对背)',
    defaults: { data: '23, 25, 31, 34, 34, 38, 42, 45, 47, 51, 56', data2: '', unit: 10, key: '2 | 3 代表 23', t1: '', t2: '', cw: 16, rh: 24, lsize: 16 },
    fields: [
      { k: 'data', t: 'area', l: '数据(整数)' }, { k: 'data2', t: 'area', l: '第二组(背对背, 叶在左边)' }, { k: 'unit', t: 'num', l: '茎的单位(10 = 十位)' },
      { k: 't1', t: 'text', l: '右边标题' }, { k: 't2', t: 'text', l: '左边标题', when: (p) => String(p.data2 || '').trim() !== '' }, { k: 'key', t: 'text', l: '图例说明' },
      { k: 'cw', t: 'num', l: '叶的间距' }, { k: 'rh', t: 'num', l: '行高' }, { k: 'lsize', t: 'num', l: '字号' },
    ],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const u = +p.unit || 10, d1 = nums(p.data).map(Math.round), d2 = nums(p.data2).map(Math.round), all = d1.concat(d2); if (!all.length) return '';
      const st = (v) => Math.floor(v / u), lf = (v) => ((v % u) + u) % u, s0 = Math.min(...all.map(st)), s1 = Math.max(...all.map(st)), rh = +p.rh, cw = +p.cw, ls = +p.lsize || 16;
      const grp = (d) => { const m = {}; d.slice().sort((a, b) => a - b).forEach((v) => (m[st(v)] = m[st(v)] || []).push(lf(v))); return m; };
      const g1 = grp(d1), g2 = grp(d2), two = d2.length > 0, sw = 34;
      const L2 = Math.max(0, ...Object.values(g2).map((a) => a.length)) * cw;
      let o = '';
      for (let s = s0; s <= s1; s++) {
        const y = (s - s0) * rh + rh / 2;
        o += lab(ctx, p, String(s), 0, y, { size: ls });
        (g1[s] || []).forEach((l, i) => (o += lab(ctx, p, String(l), sw / 2 + 10 + i * cw + cw / 2, y, { size: ls })));
        if (two) (g2[s] || []).slice().reverse().forEach((l, i) => (o += lab(ctx, p, String(l), -sw / 2 - 10 - i * cw - cw / 2, y, { size: ls })));
      }
      const Hh = (s1 - s0 + 1) * rh;
      o += `<line x1="${f(sw / 2)}" y1="-4" x2="${f(sw / 2)}" y2="${f(Hh + 2)}" ${sd(p)}/>` + (two ? `<line x1="${f(-sw / 2)}" y1="-4" x2="${f(-sw / 2)}" y2="${f(Hh + 2)}" ${sd(p)}/>` : '');
      o += lab(ctx, p, '茎', 0, -16, { size: ls - 2 }) + lab(ctx, p, '叶', sw / 2 + 24, -16, { size: ls - 2, anchor: 'start' }) + (two ? lab(ctx, p, '叶', -sw / 2 - 24, -16, { size: ls - 2, anchor: 'end' }) : '');
      if (p.t1) o += lab(ctx, p, p.t1, sw / 2 + 40, -38, { size: ls - 1, anchor: 'start' }); if (two && p.t2) o += lab(ctx, p, p.t2, -sw / 2 - L2, -38, { size: ls - 1, anchor: 'start' });
      if (p.key) o += lab(ctx, p, p.key, two ? -sw / 2 - L2 : 0, Hh + 22, { size: ls - 3, anchor: 'start' });
      return o;
    },
  });

  /* ================= 圆形图 ================= */
  PD.register({
    type: 'pie', name: '圆形图(扇形图)',
    defaults: { cats: '巴士, 港铁, 步行, 其他', vals: '120, 150, 60, 30', r: 100, start: 90, show: 'angle', inside: false, bw: true, cols: '', lsize: 13 },
    fields: [
      { k: 'cats', t: 'text', l: '类别' }, { k: 'vals', t: 'text', l: '数值' }, { k: 'r', t: 'num', l: '半径' }, { k: 'start', t: 'num', l: '起始角°(90 = 从正上方)', step: 15 },
      { k: 'show', t: 'sel', l: '标注', o: [['angle', '圆心角(如 120°)'], ['pct', '百分率'], ['value', '数值'], ['name', '只有名称'], ['none', '不标']] }, { k: 'inside', t: 'bool', l: '标签写在扇形内' },
      { k: 'bw', t: 'bool', l: '黑白图案' }, { k: 'cols', t: 'text', l: '颜色(逗号分隔)', when: (p) => !p.bw }, { k: 'lsize', t: 'num', l: '字号' },
    ],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const cats = strs(p.cats), v = nums(p.vals), tot = sumArr(v) || 1, r = +p.r;
      let a = +p.start * D2R, o = '', lb = '';
      v.forEach((x, i) => {
        const da = (x / tot) * 2 * Math.PI, a1 = a - da, P0 = [r * Math.cos(a), -r * Math.sin(a)], P1 = [r * Math.cos(a1), -r * Math.sin(a1)];
        o += v.length === 1 ? `<circle r="${f(r)}" ${fillK(p, ctx, i)} ${sd(p)}/>` : `<path d="M0,0L${pt(...P0)}A${f(r)},${f(r)} 0 ${da > Math.PI ? 1 : 0} 1 ${pt(...P1)}Z" ${fillK(p, ctx, i)} ${sd(p)}/>`;
        const am = a - da / 2, deg = Math.round(((x / tot) * 360) * 10) / 10, pc = Math.round((x / tot) * 1000) / 10;
        const val = { angle: deg + '°', pct: pc + '%', value: fmtv(x), name: '', none: '' }[p.show] ?? '', name = cats[i] || '';
        if (p.show !== 'none') {
          if (p.inside) lb += lab(ctx, p, name, r * 0.6 * Math.cos(am), -r * 0.6 * Math.sin(am) - (val ? 8 : 0), { halo: true }) + (val ? lab(ctx, p, val, r * 0.6 * Math.cos(am), -r * 0.6 * Math.sin(am) + 9, { halo: true }) : '');
          else { const c = Math.cos(am), s = -Math.sin(am); lb += `<line x1="${f(r * 0.92 * c)}" y1="${f(r * 0.92 * s)}" x2="${f((r + 14) * c)}" y2="${f((r + 14) * s)}" ${thin(p, 0.6)}/>` + lab(ctx, p, name + (val ? ` (${val})` : ''), (r + 18) * c, (r + 18) * s, { anchor: c > 0.15 ? 'start' : c < -0.15 ? 'end' : 'middle' }); }
        }
        a = a1;
      });
      return o + lb;
    },
  });

  /* ================= 点图 ================= */
  PD.register({
    type: 'dotplot', name: '点图(棒点图)',
    defaults: { data: '2, 3, 3, 4, 4, 4, 5, 5, 6, 8', xmin: 0, xmax: 10, xstep: 1, u: 32, mark: 'dot', xl: '', lsize: 13 },
    fields: [{ k: 'data', t: 'area', l: '数据' }, { k: 'xmin', t: 'num', l: '最小' }, { k: 'xmax', t: 'num', l: '最大' }, { k: 'xstep', t: 'num', l: '间隔' }, { k: 'u', t: 'num', l: '每单位 px' }, { k: 'mark', t: 'sel', l: '记号', o: [['dot', '●'], ['cross', '×']] }, { k: 'xl', t: 'text', l: '数轴标题' }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const a = +p.xmin, b = +p.xmax, st = +p.xstep || 1, u = (+p.u || 32) / st, X = (v) => (v - a) * u, cnt = {};
      let o = `<line x1="-8" y1="0" x2="${f(X(b) + 8)}" y2="0" ${sd(p)}/>`, d = '';
      for (let v = a; v <= b + 1e-9; v += st) { d += `M${f(X(v))},0v5`; o += lab(ctx, p, fmtv(v), X(v), 17); }
      o += `<path d="${d}" fill="none" ${sd(p)}/>` + (p.xl ? lab(ctx, p, p.xl, X(b) + 14, 0, { anchor: 'start' }) : '');
      nums(p.data).forEach((v) => { const k = (cnt[v] = (cnt[v] || 0) + 1), x = X(v), y = -k * 14; o += p.mark === 'cross' ? `<path d="M${pt(x - 4, y - 4)}l8,8M${pt(x - 4, y + 4)}l8,-8" ${sd(p)}/>` : `<circle cx="${f(x)}" cy="${f(y)}" r="4.5" fill="${p.stroke}"/>`; });
      return o;
    },
  });

  /* ================= 树形图 ================= */
  const fracTex = (s) => { const m = /^\s*(\d+)\s*\/\s*(\d+)\s*$/.exec(s); return m ? `\\frac{${m[1]}}{${m[2]}}` : s; };
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  const probVal = (s) => { const m = /^\s*(\d+)\s*\/\s*(\d+)\s*$/.exec(s); if (m) return { n: +m[1], d: +m[2] }; const v = +s; return isFinite(v) && String(s).trim() !== '' ? { x: v } : null; };
  PD.register({
    type: 'tree', name: '树形图(概率)',
    defaults: { tree: '红, 3/5\n  红, 2/4\n  蓝, 2/4\n蓝, 2/5\n  红, 3/4\n  蓝, 1/4', dx: 130, dy: 40, outcome: true, prod: true, heads: '第一次, 第二次', join: '', lsize: 15 },
    fields: [
      { k: 'tree', t: 'area', l: '分支(缩进两格表示下一层)', ph: '每行: 结果, 概率\n红, 3/5\n  红, 2/4\n  蓝, 2/4\n蓝, 2/5\n  红, 3/4\n  蓝, 1/4' },
      { k: 'dx', t: 'num', l: '每层宽度' }, { k: 'dy', t: 'num', l: '末端间距' }, { k: 'heads', t: 'text', l: '各层标题(逗号分隔)' },
      { k: 'outcome', t: 'bool', l: '列出结果' }, { k: 'prod', t: 'bool', l: '计算每个结果的概率', when: (p) => p.outcome }, { k: 'join', t: 'text', l: '结果连接符(空 = 直接相连)', when: (p) => p.outcome }, { k: 'lsize', t: 'num', l: '字号' },
    ],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const root = { kids: [], depth: 0 }, stack = [root], ls = +p.lsize || 15;
      String(p.tree || '').split('\n').forEach((raw) => {
        if (!raw.trim()) return; const ind = raw.replace(/\t/g, '  ').match(/^ */)[0].length, depth = Math.floor(ind / 2) + 1, i = raw.trim().lastIndexOf(',');
        const node = { name: i >= 0 ? raw.trim().slice(0, i).trim() : raw.trim(), prob: i >= 0 ? raw.trim().slice(i + 1).trim() : '', kids: [], depth };
        while (stack.length > depth) stack.pop(); const par = stack[stack.length - 1] || root; par.kids.push(node); node.parent = par; stack.push(node);
      });
      const leaves = [], walk = (n) => (n.kids.length ? n.kids.forEach(walk) : leaves.push(n)); root.kids.forEach(walk);
      if (!leaves.length) return '';
      leaves.forEach((n, i) => (n.y = i * +p.dy));
      const setY = (n) => { if (n.kids.length) { n.kids.forEach(setY); n.y = (n.kids[0].y + n.kids[n.kids.length - 1].y) / 2; } }; setY(root);
      const dx = +p.dx, maxD = Math.max(...leaves.map((n) => n.depth));
      let o = '';
      const hw = (n) => (n === root ? 0 : PD.layoutTex(n.name, ls, ctx, { italic: false }).w / 2 + 5);
      const draw = (n) => n.kids.forEach((c) => {
        const x0 = n === root ? 0 : n.depth * dx + hw(n), x1 = c.depth * dx - hw(c), y0 = n.y, y1 = c.y;
        o += `<line x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y1)}" ${sd(p)}/>`;
        if (c.prob) { const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, up = y1 < y0 - 1, dn = y1 > y0 + 1; o += T(ctx, fracTex(c.prob), mx + (up ? -6 : dn ? -6 : 0), my + (up ? -14 : dn ? 14 : -14), { size: ls - 2, color: p.stroke, italic: false, halo: true }); }
        o += T(ctx, c.name, c.depth * dx, c.y, { size: ls, color: p.stroke, italic: false });
        draw(c);
      });
      draw(root);
      String(p.heads || '').split(/[,，]/).map((s) => s.trim()).forEach((h, i) => { if (h) o += T(ctx, h, (i + 1) * dx, -30, { size: ls - 1, color: p.stroke, italic: false }); });
      if (p.outcome) {
        const xo = maxD * dx + Math.max(50, ...leaves.map((n) => hw(n) + 30));
        if (p.heads) o += T(ctx, '结果', xo, -30, { size: ls - 1, anchor: 'start', color: p.stroke, italic: false }) + (p.prod ? T(ctx, '概率', xo + 110, -30, { size: ls - 1, anchor: 'start', color: p.stroke, italic: false }) : '');
        leaves.forEach((n) => {
          const path = []; let q = n; while (q && q !== root) { path.unshift(q); q = q.parent; }
          o += T(ctx, path.map((x) => x.name).join(p.join || ''), xo, n.y, { size: ls - 1, anchor: 'start', color: p.stroke, italic: false });
          if (p.prod) {
            const pv = path.map((x) => probVal(x.prob)); let txt = '';
            if (pv.every((v) => v && v.n != null)) { let N = 1, Dn = 1; pv.forEach((v) => { N *= v.n; Dn *= v.d; }); const g = gcd(N, Dn) || 1; txt = path.map((x) => fracTex(x.prob)).join(' \\times ') + ` = ${Dn / g === 1 ? N / g : `\\frac{${N / g}}{${Dn / g}}`}`; }
            else if (pv.every((v) => v)) { const x = pv.reduce((s, v) => s * (v.x != null ? v.x : v.n / v.d), 1); txt = path.map((x2) => fracTex(x2.prob)).join(' \\times ') + ' = ' + PD.fmt(Math.round(x * 1e4) / 1e4); }
            if (txt) o += T(ctx, txt, xo + 110, n.y, { size: ls - 2, anchor: 'start', color: p.stroke, italic: false });
          }
        });
      }
      return o;
    },
  });

  /* ================= 韦恩图 ================= */
  PD.register({
    type: 'venn', name: '韦恩图(2 或 3 个集合)',
    defaults: { n: 2, sets: 'A, B', U: 'U', W: 320, H: 210, r: 70, sep: 82, shade: '11', fill: 'hatch', vals: '', lsize: 16 },
    fields: [
      { k: 'n', t: 'sel', l: '集合个数', o: [['2', '2'], ['3', '3']], rebuild: true }, { k: 'sets', t: 'text', l: '集合名称' }, { k: 'U', t: 'text', l: '全集标签' },
      { k: 'shade', t: 'text', l: '要涂的区域(用 1/0 编码，逗号分隔)', ph: '两个集合: 10 = 只在 A，01 = 只在 B，11 = A∩B，00 = 两者之外\n例: A∪B = 10,01,11 ；A′ = 01,00\n三个集合: 100、110、111…' },
      { k: 'fill', t: 'sel', l: '涂色样式', o: [['hatch', '斜线'], ['cross', '网格线'], ['dots', '点'], ['gray', '灰色'], ['#7fa6d6', '蓝色']] },
      { k: 'vals', t: 'area', l: '区域内的文字(每行: 编码: 文字)', ph: '例:\n10: 12\n11: 5\n01: 8\n00: 3' },
      { k: 'W', t: 'num', l: '全集宽' }, { k: 'H', t: 'num', l: '全集高' }, { k: 'r', t: 'num', l: '圆半径' }, { k: 'sep', t: 'num', l: '圆心距' }, { k: 'lsize', t: 'num', l: '字号' },
    ],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const n = +p.n === 3 ? 3 : 2, r = +p.r, s = +p.sep, W = +p.W, H = +p.H, ls = +p.lsize || 16, id = ctx.id;
      const Cs = n === 2 ? [[-s / 2, 0], [s / 2, 0]] : [[-s / 2, -s * 0.29], [s / 2, -s * 0.29], [0, s * 0.58]];
      const names = strs(p.sets), U = `<rect x="${f(-W / 2)}" y="${f(-H / 2)}" width="${f(W)}" height="${f(H)}"`;
      Cs.forEach((c, i) => ctx.defs.push(`<clipPath id="${id}-c${i}"><circle cx="${f(c[0])}" cy="${f(c[1])}" r="${f(r)}"/></clipPath>`));
      let o = '';
      strs(p.shade).filter((c) => new RegExp(`^[01]{${n}}$`).test(c)).forEach((code, k) => {
        let g = `${U} ${M.regionFill(p.fill, ctx, p.stroke)}/>`;
        const out = [...code].map((ch, i) => (ch === '0' ? i : -1)).filter((i) => i >= 0);
        if (out.length) { const mid = `${id}-m${k}`; ctx.defs.push(`<mask id="${mid}">${U} fill="#ffffff"/>${out.map((i) => `<circle cx="${f(Cs[i][0])}" cy="${f(Cs[i][1])}" r="${f(r)}" fill="#000000"/>`).join('')}</mask>`); g = `<g mask="url(#${mid})">${g}</g>`; }
        [...code].forEach((ch, i) => { if (ch === '1') g = `<g clip-path="url(#${id}-c${i})">${g}</g>`; });
        o += g;
      });
      o += `${U} fill="none" ${sd(p)}/>` + Cs.map((c) => `<circle cx="${f(c[0])}" cy="${f(c[1])}" r="${f(r)}" fill="none" ${sd(p)}/>`).join('');
      if (p.U) o += T(ctx, p.U, -W / 2 + 12, -H / 2 + 14, { size: ls, color: p.stroke });
      Cs.forEach((c, i) => { const u = n === 2 ? [i ? 0.7 : -0.7, -0.75] : [[-0.75, -0.7], [0.75, -0.7], [0.85, 0.6]][i]; if (names[i]) o += T(ctx, names[i], c[0] + u[0] * (r + 8), c[1] + u[1] * (r + 8), { size: ls, color: p.stroke, halo: true }); });
      // 区域文字：在区域内取离边界最远的点
      const where = (x, y) => Cs.map((c) => (Math.hypot(x - c[0], y - c[1]) < r ? '1' : '0')).join('');
      PD.lines(p.vals).forEach((l) => {
        const m = /^\s*([01]+)\s*[:：]\s*(.*)$/.exec(l); if (!m || m[1].length !== n) return;
        let best = null, bd = -1;
        for (let x = -W / 2 + 8; x <= W / 2 - 8; x += 4) for (let y = -H / 2 + 8; y <= H / 2 - 8; y += 4) {
          if (where(x, y) !== m[1]) continue;
          let md = Math.min(x + W / 2, W / 2 - x, y + H / 2, H / 2 - y); Cs.forEach((c) => (md = Math.min(md, Math.abs(Math.hypot(x - c[0], y - c[1]) - r))));
          if (md > bd) { bd = md; best = [x, y]; }
        }
        if (best) o += T(ctx, m[2], best[0], best[1], { size: ls - 1, color: p.stroke, italic: false, halo: true });
      });
      return o;
    },
  });

  /* ================= 表格 ================= */
  PD.register({
    type: 'table', name: '表格(频数分布表 / 样本空间)',
    defaults: { rows: '分数 | 频数\n0 - 9 | 3\n10 - 19 | 8\n20 - 29 | 12', head: true, col1: false, shade: true, border: 'all', pad: 10, minw: 46, rh: 30, lsize: 15 },
    fields: [
      { k: 'rows', t: 'area', l: '内容(每行一列，用 | 分隔；可写公式)', ph: '例:\n+ | 1 | 2 | 3\n1 | 2 | 3 | 4\n2 | 3 | 4 | 5' },
      { k: 'head', t: 'bool', l: '第一行是表头' }, { k: 'col1', t: 'bool', l: '第一列是表头' }, { k: 'shade', t: 'bool', l: '表头底色' },
      { k: 'border', t: 'sel', l: '框线', o: [['all', '全部格线'], ['outer', '只有外框 + 表头线'], ['three', '三线表']] },
      { k: 'pad', t: 'num', l: '格内边距' }, { k: 'minw', t: 'num', l: '最小列宽' }, { k: 'rh', t: 'num', l: '行高' }, { k: 'lsize', t: 'num', l: '字号' },
    ],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const R = String(p.rows || '').split('\n').filter((l) => l.trim() !== '').map((l) => (l.includes('|') ? l.split('|') : l.split(/[,，]/)).map((c) => c.trim()));
      if (!R.length) return '';
      const nc = Math.max(...R.map((r) => r.length)), ls = +p.lsize || 15, rh = +p.rh, pad = +p.pad, cw = [];
      for (let j = 0; j < nc; j++) cw.push(Math.max(+p.minw || 0, ...R.map((r) => (r[j] ? PD.layoutTex(r[j], ls, ctx, { italic: false }).w : 0) + 2 * pad)));
      const W = cw.reduce((a, b) => a + b, 0), H = R.length * rh, xs = [0]; cw.forEach((w) => xs.push(xs[xs.length - 1] + w));
      let o = '';
      if (p.shade) { if (p.head) o += `<rect x="0" y="0" width="${f(W)}" height="${f(rh)}" fill="#e8edf3"/>`; if (p.col1) o += `<rect x="0" y="0" width="${f(cw[0])}" height="${f(H)}" fill="#e8edf3"/>`; }
      R.forEach((r, i) => r.forEach((c, j) => { if (c) o += T(ctx, c, (xs[j] + xs[j + 1]) / 2, i * rh + rh / 2, { size: ls, color: p.stroke, italic: false, bold: (p.head && i === 0) || (p.col1 && j === 0) }); }));
      const ln = (x1, y1, x2, y2, w) => `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" ${S(p, { dash: 'solid', sw: (+p.sw || 1.5) * (w || 0.7) })}/>`;
      if (p.border === 'three') { o += ln(0, 0, W, 0, 1.2) + ln(0, H, W, H, 1.2) + (p.head ? ln(0, rh, W, rh, 0.7) : ''); return o; }
      o += `<rect x="0" y="0" width="${f(W)}" height="${f(H)}" fill="none" ${S(p, { dash: 'solid', sw: +p.sw || 1.5 })}/>`;
      if (p.border === 'all') { for (let i = 1; i < R.length; i++) o += ln(0, i * rh, W, i * rh); for (let j = 1; j < nc; j++) o += ln(xs[j], 0, xs[j], H); }
      else { if (p.head) o += ln(0, rh, W, rh, 1); if (p.col1) o += ln(cw[0], 0, cw[0], H, 1); }
      return o;
    },
  });

  /* ================= 预设 ================= */
  PD.preset(CS, '棒形图', 'bars', {});
  PD.preset(CS, '复式棒形图', 'bars', { vals2: '10, 14, 13, 11, 18', names: '男, 女' });
  PD.preset(CS, '横向棒形图', 'bars', { horiz: true, cats: '篮球, 足球, 羽毛球, 游泳', vals: '18, 25, 12, 9', yl: '人数', W: 300, H: 180 });
  PD.preset(CS, '直方图', 'histo', {});
  PD.preset(CS, '直方图 + 频数多边形', 'histo', { poly: true, xlab: 'mids' });
  PD.preset(CS, '频数多边形', 'histo', { poly: true, bars: false, xlab: 'mids' });
  PD.preset(CS, '累积频数多边形(读四分位数)', 'ogive', {});
  PD.preset(CS, '累积频数曲线(方格纸)', 'ogive', { smooth: true, grid: 'fine', reads: 'M' });
  PD.preset(CS, '框线图', 'boxplot', { vals: true });
  PD.preset(CS, '框线图(两组比较)', 'boxplot', { data: 'A班: 32, 45, 56, 68, 90\nB班: 40, 52, 60, 64, 80' });
  PD.preset(CS, '茎叶图', 'stemleaf', {});
  PD.preset(CS, '背对背茎叶图', 'stemleaf', { data2: '18, 22, 27, 29, 33, 35, 41, 44, 52', t1: 'B 组', t2: 'A 组', key: '7 | 2 | 3 代表 A 组 27、B 组 23' });
  PD.preset(CS, '圆形图', 'pie', {});
  PD.preset(CS, '圆形图(百分率, 彩色)', 'pie', { show: 'pct', bw: false, inside: true });
  PD.preset(CS, '点图', 'dotplot', {});
  PD.preset(CS, '散点图(最佳拟合直线)', 'graph', { W: 340, H: 240, xmin: 0, xmax: 10, ymin: 0, ymax: 10, xstep: 2, ystep: 2, grid: 'major', gc: '#d5dde6', xl: 'x', yl: 'y', dots: '1,2.2 2,2.8 3,4.1 4,4.4 5,5.9 6,6.1 7,7.4 8,7.9 9,9.2', dstyle: 'dot', funcs: '0.85x+1.3 ; 0 ; 10 ; dash' });
  PD.preset(CS, '频数分布表', 'table', {});
  PD.preset(CP, '树形图(不放回抽球)', 'tree', {});
  PD.preset(CP, '树形图(掷硬币三次)', 'tree', { tree: 'H, 1/2\n  H, 1/2\n    H, 1/2\n    T, 1/2\n  T, 1/2\n    H, 1/2\n    T, 1/2\nT, 1/2\n  H, 1/2\n    H, 1/2\n    T, 1/2\n  T, 1/2\n    H, 1/2\n    T, 1/2', dx: 100, dy: 30, heads: '第一次, 第二次, 第三次', prod: false, dx: 115, dy: 34 });
  PD.preset(CP, '树形图(小数概率)', 'tree', { tree: '下雨, 0.3\n  迟到, 0.4\n  准时, 0.6\n不下雨, 0.7\n  迟到, 0.1\n  准时, 0.9', heads: '天气, 上学', join: '、' });
  PD.preset(CP, '韦恩图(A ∩ B)', 'venn', {});
  PD.preset(CP, '韦恩图(A ∪ B)', 'venn', { shade: '10,01,11' });
  PD.preset(CP, '韦恩图(补集 A′)', 'venn', { shade: '01,00' });
  PD.preset(CP, '韦恩图(各区域数目)', 'venn', { shade: '', vals: '10: 12\n11: 5\n01: 8\n00: 3' });
  PD.preset(CP, '韦恩图(三个集合)', 'venn', { n: 3, sets: 'A, B, C', W: 330, H: 290, r: 72, sep: 86, shade: '111' });
  PD.preset(CP, '样本空间(两颗骰子点数和)', 'table', { rows: '+ | 1 | 2 | 3 | 4 | 5 | 6\n1 | 2 | 3 | 4 | 5 | 6 | 7\n2 | 3 | 4 | 5 | 6 | 7 | 8\n3 | 4 | 5 | 6 | 7 | 8 | 9\n4 | 5 | 6 | 7 | 8 | 9 | 10\n5 | 6 | 7 | 8 | 9 | 10 | 11\n6 | 7 | 8 | 9 | 10 | 11 | 12', col1: true, minw: 38, rh: 28 });
  PD.preset(CT, '表格', 'table', { rows: '甲 | 乙 | 丙\n1 | 2 | 3' });

  const gr = (cat, name, props) => PD.preset(cat, name, 'graph', Object.assign({ W: 300, H: 260, xmin: -4, xmax: 6, ymin: -4, ymax: 6, xstep: 1, ystep: 1, tlabels: true, ticks: true, fs: 11 }, props));
  gr(CG, '直线(截距)', { funcs: '-0.5x+3', roots: true, ilab: true, pts: '0, 3, (0, 3), e' });
  gr(CG, '两直线的交点', { funcs: '2x-1\n-x+5', inter: true, ilab: true });
  gr(CG, '两点距离与中点', { segs: '-2,-1, 4,3', pts: '-2, -1, A(-2, -1), sw\n4, 3, B(4, 3), ne\n1, 1, M(1, 1), se' });
  gr(CG, '圆的方程', { circles: '1, 1, 3', pts: '1, 1, C(1, 1), se', segs: '1,1, 3.12,3.12 ; dash' });
  gr(CG, '轨迹(两点的垂直平分线)', { pts: '-1, 0, A, sw\n3, 2, B, ne\n1, 1, M(1, 1), e', segs: '-1,0, 3,2 ; dot', funcs: '-2x+3 ; -1.4 ; 3.4 ; dash ;; 轨迹 y = -2x + 3' });
  gr(CG, '平行线与垂直线', { funcs: 'x+1\nx-2\n-x+2 ;;; dash' });
  gr(CF, '二次函数(顶点、对称轴)', { funcs: 'x^2-2x-3', vlines: 'x = 1 ; dash ; x = 1', roots: true, ilab: true, pts: '1, -4, 顶点 (1, -4), se', ymin: -5, ymax: 6, xmin: -3, xmax: 5 });
  gr(CF, '二次函数(开口向下)', { funcs: '-x^2+2x+3', roots: true, pts: '1, 4, (1, 4), ne', ymin: -3, ymax: 6, xmin: -3, xmax: 5 });
  gr(CF, '二次不等式的图解', { funcs: 'x^2-2x-3', fills: 'x^2-2x-3 ;; -1 ; 3 ; hatch', roots: true, ilab: true, ymin: -5, ymax: 6, xmin: -3, xmax: 5 });
  gr(CF, '函数变换(平移)', { funcs: 'x^2 ;;; solid ;; y = f(x)\n(x-2)^2+1 ;;; dash ;; y = f(x-2)+1', xmin: -3, xmax: 6, ymin: -1, ymax: 8 });
  gr(CF, '函数变换(反射)', { funcs: 'x^2-2x ;;; solid ;; y = f(x)\n-(x^2-2x) ;;; dash ;; y = -f(x)', xmin: -2, xmax: 4, ymin: -4, ymax: 4 });
  gr(CF, '指数与对数函数', { funcs: '2^x ;;; solid ;; y = 2^x ; 2\nlog2(x) ; 0.02 ; 6 ; solid ;; y = \\log_2 x ; 5\nx ;;; dot ;; y = x ; 5.2', xmin: -3, xmax: 6, ymin: -3, ymax: 6, W: 300, H: 300 });
  gr(CF, '正弦与余弦(度)', { deg: true, funcs: 'sin(x) ; 0 ; 360 ; solid ;; y = \\sin x ; 120\ncos(x) ; 0 ; 360 ; dash ;; y = \\cos x ; 300', xmin: 0, xmax: 380, xstep: 90, ymin: -1.4, ymax: 1.4, ystep: 1, xsuf: '°', W: 380, H: 200 });
  gr(CF, '正切函数(渐近线)', { deg: true, funcs: 'tan(x) ; 0 ; 360', vlines: 'x = 90 ; dash\nx = 270 ; dash', xmin: 0, xmax: 380, xstep: 90, ymin: -4, ymax: 4, ystep: 2, xsuf: '°', W: 380, H: 240 });
  gr(CF, '反比例函数', { funcs: '2/x', xmin: -5, xmax: 5, ymin: -5, ymax: 5, ol: 'O' });
  gr(CF, '三次函数', { funcs: '0.5(x+2)(x-1)(x-3)', roots: true, ilab: true, xmin: -3, xmax: 4, ymin: -4, ymax: 6 });
  gr(CA, '联立方程的图解', { funcs: 'x^2-1\nx+1', inter: true, ilab: true, xmin: -3, xmax: 4, ymin: -2, ymax: 6 });
  gr(CA, '线性规划(可行域)', { ineq: 'x >= 0\ny >= 0\ny <= -x+5\ny <= -2x+8', funcs: '-0.5x+2 ;;; dash ;; 目标函数', xmin: -1, xmax: 7, ymin: -1, ymax: 9, W: 300, H: 320, pts: '0, 0, , sw\n3, 2, (3, 2), ne\n0, 5, (0, 5), e\n4, 0, (4, 0), s' });
  gr(CA, '不等式的区域', { ineq: 'y > 2x-1\ny <= -x+4', xmin: -3, xmax: 5, ymin: -3, ymax: 6, ineqFill: 'gray' });

  const fx = (name, text, size) => PD.preset(CX, name, 'text', { text, size: size || 20 });
  fx('二次公式', 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}');
  fx('判别式', '\\Delta = b^2 - 4ac');
  fx('正弦公式', '\\frac{a}{\\sin A} = \\frac{b}{\\sin B} = \\frac{c}{\\sin C}');
  fx('余弦公式', 'a^2 = b^2 + c^2 - 2bc \\cos A');
  fx('三角形面积', '\\rm{面积} = \\frac{1}{2}ab \\sin C');
  fx('两点距离', 'AB = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}');
  fx('斜率', 'm = \\frac{y_2 - y_1}{x_2 - x_1}');
  fx('等差数列', 'T(n) = a + (n - 1)d');
  fx('等比数列', 'T(n) = ar^{n-1}');
  fx('等比数列求和', 'S(n) = \\frac{a(r^n - 1)}{r - 1}');
  fx('对数定律', '\\log_a (MN) = \\log_a M + \\log_a N');
  fx('换底公式', '\\log_a x = \\frac{\\log x}{\\log a}');
  fx('三角恒等式', '\\sin^2 \\theta + \\cos^2 \\theta = 1');
  fx('排列与组合', 'C^n_r = \\frac{n!}{r!(n - r)!}');
  fx('平均值', '\\bar{x} = \\frac{\\sum x}{n}');
  fx('标准差', '\\sigma = \\sqrt{\\frac{\\sum (x - \\bar{x})^2}{n}}');
})();
