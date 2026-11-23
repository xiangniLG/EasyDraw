/* 通用素材库 · 图表（坐标轴、网格、函数、折线、数据点、投影标记） */
(function () {
  'use strict';
  const f = PD.f, S = PD.strokeAttr, T = PD.tex;
  const CAT = '通用/图表';

  function steps(a, b, st) {
    const r = []; st = +st; if (!(st > 0)) return r;
    const i0 = Math.ceil(a / st - 1e-9), i1 = Math.floor(b / st + 1e-9);
    if (i1 - i0 > 1500) return r;
    for (let i = i0; i <= i1; i++) r.push(+(i * st).toFixed(10));
    return r;
  }

  PD.register({
    type: 'graph', name: '坐标图表',
    style: ['stroke', 'sw', 'opacity'],
    defaults: {
      W: 360, H: 240, xmin: 0, xmax: 10, ymin: 0, ymax: 10, xstep: 1, ystep: 1,
      xl: 'x', yl: 'y', ol: 'O', grid: 'none', minor: 5, gc: '#8fb3d9',
      ticks: true, tlabels: true, arrows: true, box: false, fs: 13, ls: 17, ext: 22,
      funcs: '', poly: '', shade: 'none', dots: '', dstyle: 'cross', marks: '', cc: '#000000', cw: 2,
    },
    handles: [['W', 'H']],
    fields: [
      { k: 'W', t: 'num', l: '绘图区宽' }, { k: 'H', t: 'num', l: '绘图区高' },
      { k: 'xmin', t: 'num', l: 'x 最小', step: 0.5 }, { k: 'xmax', t: 'num', l: 'x 最大', step: 0.5 }, { k: 'xstep', t: 'num', l: 'x 刻度间隔', step: 0.1 },
      { k: 'ymin', t: 'num', l: 'y 最小', step: 0.5 }, { k: 'ymax', t: 'num', l: 'y 最大', step: 0.5 }, { k: 'ystep', t: 'num', l: 'y 刻度间隔', step: 0.1 },
      { k: 'xl', t: 'text', l: 'x 轴标签' }, { k: 'yl', t: 'text', l: 'y 轴标签' }, { k: 'ol', t: 'text', l: '原点标签' },
      { k: 'grid', t: 'sel', l: '网格', o: [['none', '无'], ['major', '主网格'], ['fine', '方格纸(含细分)']], rebuild: true },
      { k: 'minor', t: 'num', l: '每格细分', when: (p) => p.grid === 'fine' }, { k: 'gc', t: 'color', l: '网格颜色', when: (p) => p.grid !== 'none' },
      { k: 'ticks', t: 'bool', l: '刻度线' }, { k: 'tlabels', t: 'bool', l: '刻度数字' }, { k: 'arrows', t: 'bool', l: '轴箭头' }, { k: 'box', t: 'bool', l: '外框' },
      { k: 'fs', t: 'num', l: '刻度字号' }, { k: 'ls', t: 'num', l: '轴标签字号' }, { k: 'ext', t: 'num', l: '轴伸出长度' },
      { k: 'funcs', t: 'area', l: '函数 y = f(x)', ph: '每行: 表达式 ; 起点 ; 终点 ; 线型 ; 颜色\n例: 2*x+1\n例: sin(x) ; 0 ; 6.28 ; dash\n例: 5*exp(-x/2) ;;; solid ; #c00' },
      { k: 'poly', t: 'area', l: '折线(数据坐标)', ph: '如 v-t 图: 0,0 2,4 6,4 8,0' },
      { k: 'shade', t: 'sel', l: '折线与x轴间面积', o: [['none', '不填'], ['gray', '灰色'], ['hatch', '斜线']] },
      { k: 'dots', t: 'area', l: '实验数据点', ph: '1,2.1  2,3.9  3,6.2' },
      { k: 'dstyle', t: 'sel', l: '数据点样式', o: [['cross', '×'], ['plus', '+'], ['dot', '●'], ['circle', '○']] },
      { k: 'marks', t: 'area', l: '标记点(虚线投影到轴)', ph: '每行: x,y,x轴标签,y轴标签,点标签\n例: 4,6,t_1,v_0,P' },
      { k: 'cc', t: 'color', l: '曲线颜色' }, { k: 'cw', t: 'num', l: '曲线线宽', step: 0.5 },
    ],
    render(p, ctx) {
      const W = +p.W, H = +p.H, dx = p.xmax - p.xmin || 1, dy = p.ymax - p.ymin || 1;
      const X = (x) => ((x - p.xmin) / dx) * W, Y = (y) => H - ((y - p.ymin) / dy) * H;
      const ay = p.ymin <= 0 && p.ymax >= 0 ? Y(0) : H; // x 轴所在像素 y
      const ax = p.xmin <= 0 && p.xmax >= 0 ? X(0) : 0; // y 轴所在像素 x
      const xs = steps(p.xmin, p.xmax, p.xstep), ys = steps(p.ymin, p.ymax, p.ystep);
      let o = '';
      // 网格
      if (p.grid !== 'none') {
        if (p.grid === 'fine' && p.minor > 1) {
          let d = '';
          steps(p.xmin, p.xmax, p.xstep / p.minor).forEach((v) => (d += `M${f(X(v))},0V${f(H)}`));
          steps(p.ymin, p.ymax, p.ystep / p.minor).forEach((v) => (d += `M0,${f(Y(v))}H${f(W)}`));
          o += `<path d="${d}" stroke="${p.gc}" stroke-width="0.35" fill="none"/>`;
        }
        let d = '';
        xs.forEach((v) => (d += `M${f(X(v))},0V${f(H)}`));
        ys.forEach((v) => (d += `M0,${f(Y(v))}H${f(W)}`));
        o += `<path d="${d}" stroke="${p.gc}" stroke-width="${p.grid === 'fine' ? 0.9 : 0.6}" fill="none"/>`;
      }
      if (p.box) o += `<rect width="${f(W)}" height="${f(H)}" fill="none" ${S(p, { dash: 'solid', sw: p.sw * 0.7 })}/>`;
      // 曲线（裁剪在绘图区内）
      const cid = ctx.id + '-clip';
      ctx.defs.push(`<clipPath id="${cid}"><rect x="-2" y="-2" width="${f(W + 4)}" height="${f(H + 4)}"/></clipPath>`);
      let cv = '';
      const P = PD.parsePts(p.poly);
      if (P.length) {
        const path = P.map((q, i) => (i ? 'L' : 'M') + f(X(q[0])) + ',' + f(Y(q[1]))).join('');
        if (p.shade !== 'none' && P.length > 1) {
          const area = path + `L${f(X(P[P.length - 1][0]))},${f(ay)}L${f(X(P[0][0]))},${f(ay)}Z`;
          const fa = p.shade === 'gray' ? 'fill="#000" fill-opacity="0.15"' : PD.fillAttr({ fillMode: 'hatch', fill: p.cc }, ctx);
          cv += `<path d="${area}" ${fa} stroke="none"/>`;
        }
        cv += `<path d="${path}" fill="none" ${S(p, { color: p.cc, sw: p.cw, dash: 'solid' })}/>`;
      }
      const ferr = [];
      PD.lines(p.funcs).forEach((line) => {
        const [ex, a, b, st, col] = line.split(';').map((s) => s.trim());
        const fn = PD.compile(ex); if (!fn) { ferr.push(ex + '：' + PD.exprError(ex)); return; }
        const x0 = a !== undefined && a !== '' ? +a : p.xmin, x1 = b !== undefined && b !== '' ? +b : p.xmax, N = 400;
        let d = '', pen = false, prev = 0;
        for (let i = 0; i <= N; i++) {
          const x = x0 + ((x1 - x0) * i) / N; let y;
          try { y = fn(x); } catch (e) { y = NaN; }
          if (!isFinite(y)) { pen = false; continue; }
          const py = Math.max(-5 * H, Math.min(6 * H, Y(y)));
          if (pen && Math.abs(py - prev) > H * 1.5) pen = false;
          d += (pen ? 'L' : 'M') + f(X(x)) + ',' + f(py); pen = true; prev = py;
        }
        if (d) cv += `<path d="${d}" fill="none" ${S(p, { color: col || p.cc, sw: p.cw, dash: st || 'solid' })}/>`;
      });
      o += `<g clip-path="url(#${cid})">${cv}</g>`;
      // 坐标轴
      const ah = PD.ahSize(p), ext = p.arrows ? +p.ext : 0, sa = S(p, { dash: 'solid' });
      o += `<line x1="0" y1="${f(ay)}" x2="${f(W + ext - (p.arrows ? ah * 0.85 : 0))}" y2="${f(ay)}" ${sa}/>`;
      o += `<line x1="${f(ax)}" y1="${f(H)}" x2="${f(ax)}" y2="${f(-ext + (p.arrows ? ah * 0.85 : 0))}" ${sa}/>`;
      if (p.arrows) o += PD.arrowHead(W + ext, ay, 0, ah, 'full', p.stroke, p.sw) + PD.arrowHead(ax, -ext, -Math.PI / 2, ah, 'full', p.stroke, p.sw);
      // 刻度
      let td = '';
      const tl = 5, skipO = !!p.ol;
      xs.forEach((v) => {
        const px = X(v); if (Math.abs(px - ax) < 0.5 && skipO) return;
        if (p.ticks) td += `M${f(px)},${f(ay)}v${-tl}`;
        if (p.tlabels) o += T(ctx, PD.fmt(v), px, ay + p.fs * 0.85 + 4, { size: p.fs, italic: false, color: p.stroke });
      });
      ys.forEach((v) => {
        const py = Y(v); if (Math.abs(py - ay) < 0.5 && skipO) return;
        if (p.ticks) td += `M${f(ax)},${f(py)}h${tl}`;
        if (p.tlabels) o += T(ctx, PD.fmt(v), ax - 6, py, { size: p.fs, italic: false, anchor: 'end', color: p.stroke });
      });
      if (td) o += `<path d="${td}" fill="none" ${S(p, { dash: 'solid', sw: Math.max(0.8, p.sw * 0.7) })}/>`;
      if (p.ol) o += T(ctx, p.ol, ax - p.fs * 0.7, ay + p.fs * 0.85 + 2, { size: p.fs + 2, color: p.stroke });
      o += T(ctx, p.xl, W + ext + 6, ay, { size: p.ls, anchor: 'start', color: p.stroke });
      o += T(ctx, p.yl, ax, -ext - p.ls * 0.75, { size: p.ls, color: p.stroke });
      // 实验数据点
      const ds = 3.5, dw = S(p, { color: p.cc, sw: 1.3, dash: 'solid' });
      PD.parsePts(p.dots).forEach(([x, y]) => {
        const px = f(X(x)), py = f(Y(y));
        if (p.dstyle === 'cross') o += `<path d="M${px - ds},${py - ds}l${2 * ds},${2 * ds}M${px - ds},${py + ds}l${2 * ds},${-2 * ds}" ${dw}/>`;
        else if (p.dstyle === 'plus') o += `<path d="M${px - ds - 1},${py}h${2 * ds + 2}M${px},${py - ds - 1}v${2 * ds + 2}" ${dw}/>`;
        else if (p.dstyle === 'circle') o += `<circle cx="${px}" cy="${py}" r="${ds}" fill="#fff" ${dw}/>`;
        else o += `<circle cx="${px}" cy="${py}" r="${ds - 0.5}" fill="${p.cc}"/>`;
      });
      // 标记点
      PD.lines(p.marks).forEach((line) => {
        const a = line.split(',').map((s) => s.trim());
        if (a.length < 2 || a[0] === '' || isNaN(+a[0]) || isNaN(+a[1])) return;
        const px = X(+a[0]), py = Y(+a[1]);
        o += `<path d="M${f(px)},${f(py)}V${f(ay)}M${f(px)},${f(py)}H${f(ax)}" fill="none" ${S(p, { dash: 'dash', sw: 0.9 })}/>`;
        o += `<circle cx="${f(px)}" cy="${f(py)}" r="2.5" fill="${p.stroke}"/>`;
        if (a[2]) o += T(ctx, a[2], px, ay + p.ls * 0.9 + 3, { size: p.ls, color: p.stroke });
        if (a[3]) o += T(ctx, a[3], ax - 7, py, { size: p.ls, anchor: 'end', color: p.stroke });
        if (a[4]) o += T(ctx, a[4], px + 7, py - 11, { size: p.ls, anchor: 'start', color: p.stroke });
      });
      if (ferr.length && ctx.mode === 'edit') o += ferr.map((t, i) => `<text x="4" y="${14 + i * 15}" font-size="12" fill="#d32f2f" font-family="sans-serif">函数有误 · ${PD.esc(t)}</text>`).join('');
      return o;
    },
  });

  /* ---------- 预设 ---------- */
  PD.preset(CAT, '坐标轴(草图)', 'graph', { W: 280, H: 180, ticks: false, tlabels: false, xl: 't', yl: 's' });
  PD.preset(CAT, 'v-t 图(面积)', 'graph', { W: 320, H: 200, xmax: 10, ymax: 8, ticks: false, tlabels: false, xl: 't', yl: 'v', poly: '0,2 4,6 8,6 10,0', shade: 'hatch', marks: '4,6,4,v_1\n8,6,8,' });
  PD.preset(CAT, '方格纸实验图', 'graph', { W: 400, H: 300, xmax: 5, xstep: 1, ymax: 10, ystep: 2, grid: 'fine', xl: 'I / \\rm{A}', yl: 'V / \\rm{V}', dots: '0.5,1.1 1,1.9 1.5,3.2 2,3.9 2.5,5.1 3,6.0 3.5,6.9 4,8.1', funcs: '2*x ; 0 ; 4.6', cw: 1.2 });
  PD.preset(CAT, '正弦曲线', 'graph', { W: 360, H: 180, xmin: 0, xmax: 6.6, ymin: -1.3, ymax: 1.3, xstep: 1, ystep: 1, ticks: false, tlabels: false, xl: 't', yl: 'y', funcs: 'sin(x) ; 0 ; 6.28' });
  PD.preset(CAT, '四象限坐标系', 'graph', { W: 300, H: 300, xmin: -5, xmax: 5, ymin: -5, ymax: 5, grid: 'major', gc: '#c9d6e6', funcs: '0.25*x^2-3' });
  PD.preset(CAT, '指数衰减', 'graph', { W: 320, H: 200, xmax: 6, ymax: 5.5, ticks: false, tlabels: false, xl: 't', yl: 'N', funcs: '5*exp(-0.6*x)', marks: '1.155,2.5,t_{1/2},N_0/2' });
})();
