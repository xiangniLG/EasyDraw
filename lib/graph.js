/* 通用素材库 · 坐标图表
   坐标轴 · 网格 · 函数(可按度计算三角函数) · 折线 · 数据点 · 投影标记 · 标注点 · 线段 · 圆 · 直线 x=a / y=b
   曲线间面积 · 不等式区域(可行域) · 自动标出 x 截距 / 曲线交点 */
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
  const split = (line) => line.split(';').map((s) => s.trim());
  const num = (v, d) => (v !== undefined && v !== '' && isFinite(+v) ? +v : d);
  const fmt2 = (v) => { const r = Math.round(v * 100) / 100; return PD.fmt(Math.abs(r) < 1e-9 ? 0 : r); };
  // 区域填充：hatch 斜线 / cross 网格 / dots 点 / gray 灰 / #颜色(半透明)
  const regionFill = (st, col, ctx) => {
    st = st || 'gray';
    if (st === 'gray') return 'fill="#000000" fill-opacity="0.14"';
    if (st[0] === '#') return `fill="${st}" fill-opacity="0.35"`;
    return PD.fillAttr({ fillMode: { hatch: 'hatch', cross: 'cross', dots: 'dots' }[st] || 'hatch', fill: col || '#000000' }, ctx);
  };
  // 数值求根（扫描变号 + 二分）
  function roots(g, a, b, N) {
    const out = []; N = N || 800; let x0 = a, y0 = g(a);
    for (let i = 1; i <= N; i++) {
      const x1 = a + ((b - a) * i) / N, y1 = g(x1);
      if (isFinite(y0) && isFinite(y1)) {
        if (y0 === 0) out.push(x0);
        else if (y0 * y1 < 0 && Math.abs(y1 - y0) < 1e6) {
          let lo = x0, hi = x1, glo = y0;
          for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2, gm = g(m); if (!isFinite(gm)) break; if (glo * gm <= 0) hi = m; else { lo = m; glo = gm; } }
          out.push((lo + hi) / 2);
        }
      }
      x0 = x1; y0 = y1;
    }
    if (isFinite(y0) && y0 === 0) out.push(b);
    return out.filter((x, i) => !i || Math.abs(x - out[i - 1]) > (b - a) * 1e-4);
  }

  PD.register({
    type: 'graph', name: '坐标图表',
    style: ['stroke', 'sw', 'opacity'],
    defaults: {
      W: 360, H: 240, xmin: 0, xmax: 10, ymin: 0, ymax: 10, xstep: 1, ystep: 1,
      xl: 'x', yl: 'y', ol: 'O', grid: 'none', minor: 5, gc: '#8fb3d9',
      ticks: true, tlabels: true, arrows: true, box: false, fs: 13, ls: 17, ext: 22, xsuf: '', ysuf: '', deg: false,
      funcs: '', fills: '', ineq: '', ineqFill: 'hatch', vlines: '', segs: '', circles: '', pts: '',
      roots: false, inter: false, ilab: false,
      poly: '', shade: 'none', dots: '', dstyle: 'cross', marks: '', cc: '#000000', cw: 2,
    },
    handles: [['W', 'H']],
    fields: [
      { k: 'W', t: 'num', l: '绘图区宽' }, { k: 'H', t: 'num', l: '绘图区高' },
      { k: 'xmin', t: 'num', l: 'x 最小', step: 0.5 }, { k: 'xmax', t: 'num', l: 'x 最大', step: 0.5 }, { k: 'xstep', t: 'num', l: 'x 刻度间隔', step: 0.1 },
      { k: 'ymin', t: 'num', l: 'y 最小', step: 0.5 }, { k: 'ymax', t: 'num', l: 'y 最大', step: 0.5 }, { k: 'ystep', t: 'num', l: 'y 刻度间隔', step: 0.1 },
      { k: 'xl', t: 'text', l: 'x 轴标签' }, { k: 'yl', t: 'text', l: 'y 轴标签' }, { k: 'ol', t: 'text', l: '原点标签' },
      { k: 'grid', t: 'sel', l: '网格', o: [['none', '无'], ['major', '主网格'], ['fine', '方格纸(含细分)']], rebuild: true },
      { k: 'minor', t: 'num', l: '每格细分', when: (p) => p.grid === 'fine' }, { k: 'gc', t: 'color', l: '网格颜色', when: (p) => p.grid !== 'none' },
      { k: 'ticks', t: 'bool', l: '刻度线' }, { k: 'tlabels', t: 'bool', l: '刻度数字' }, { k: 'xsuf', t: 'text', l: 'x 刻度后缀(如 °)', when: (p) => p.tlabels }, { k: 'ysuf', t: 'text', l: 'y 刻度后缀', when: (p) => p.tlabels },
      { k: 'arrows', t: 'bool', l: '轴箭头' }, { k: 'box', t: 'bool', l: '外框' },
      { k: 'fs', t: 'num', l: '刻度字号' }, { k: 'ls', t: 'num', l: '轴标签字号' }, { k: 'ext', t: 'num', l: '轴伸出长度' },
      { k: 'deg', t: 'bool', l: '三角函数按「度」计算(sin 90 = 1)' },
      { k: 'funcs', t: 'area', l: '函数 y = f(x)', ph: '每行: 表达式 ; 起点 ; 终点 ; 线型 ; 颜色 ; 标签 ; 标签的 x 位置\n例: 2x+1\n例: x^2-4x+3 ;;; solid ;; y = f(x)\n例: sin(x) ; 0 ; 360 ; dash   (勾选「按度」)\n线型: solid / dash / dot / dashdot' },
      { k: 'roots', t: 'bool', l: '自动标出 x 截距' }, { k: 'inter', t: 'bool', l: '自动标出曲线交点' }, { k: 'ilab', t: 'bool', l: '交点 / 截距标坐标', when: (p) => p.roots || p.inter },
      { k: 'fills', t: 'area', l: '两曲线间面积', ph: '每行: 上曲线 ; 下曲线(空=x 轴) ; 起点 ; 终点 ; 样式\n样式: hatch / cross / dots / gray / #颜色\n例: x^2 ;; 0 ; 2 ; hatch\n例: 4-x^2 ; x+2 ; -2 ; 1 ; gray' },
      { k: 'ineq', t: 'area', l: '不等式(画出同时满足的区域)', ph: '每行一个，变量 x 或 y 写在左边\n例: y >= 0\n例: x > 1\n例: y <= -x + 6\n例: y < 2x\n严格不等式的边界自动画虚线' },
      { k: 'ineqFill', t: 'sel', l: '可行域填充', o: [['hatch', '斜线'], ['cross', '网格线'], ['dots', '点'], ['gray', '灰色'], ['none', '不填(只画边界)']], when: (p) => String(p.ineq || '').trim() !== '' },
      { k: 'vlines', t: 'area', l: '直线 x = a / y = b', ph: '每行: x = 2 ; 线型 ; 标签\n例: x = 1 ; dash ; x = 1\n例: y = -2 ; dash   (渐近线、对称轴)' },
      { k: 'segs', t: 'area', l: '线段(数据坐标)', ph: '每行: x1, y1, x2, y2 ; 线型 ; 颜色\n例: -2,1, 4,5' },
      { k: 'circles', t: 'area', l: '圆(数据坐标)', ph: '每行: 圆心 h, k, 半径 r ; 线型 ; 颜色\n例: 1, 2, 3   即 (x-1)²+(y-2)²=9' },
      { k: 'pts', t: 'area', l: '标注点(实心点 + 标签)', ph: '每行: x, y, 标签, 位置\n位置: ne nw se sw n s e w (默认 ne)\n例: 2, 3, A(2, 3)\n例: 0, 0, , sw' },
      { k: 'marks', t: 'area', l: '标记点(虚线投影到轴)', ph: '每行: x, y, x轴标签, y轴标签, 点标签\n例: 2, -1, 2, -1, V' },
      { k: 'poly', t: 'area', l: '折线(数据坐标)', ph: '例: 0,0 2,4 6,4 8,0' },
      { k: 'shade', t: 'sel', l: '折线与 x 轴间面积', o: [['none', '不填'], ['gray', '灰色'], ['hatch', '斜线']] },
      { k: 'dots', t: 'area', l: '数据点(散点图)', ph: '1,2.1  2,3.9  3,6.2' },
      { k: 'dstyle', t: 'sel', l: '数据点样式', o: [['cross', '×'], ['plus', '+'], ['dot', '●'], ['circle', '○']] },
      { k: 'cc', t: 'color', l: '曲线颜色' }, { k: 'cw', t: 'num', l: '曲线线宽', step: 0.5 },
    ],
    render(p, ctx) {
      const W = +p.W, H = +p.H, dx = p.xmax - p.xmin || 1, dy = p.ymax - p.ymin || 1, opt = { deg: !!p.deg };
      const X = (x) => ((x - p.xmin) / dx) * W, Y = (y) => H - ((y - p.ymin) / dy) * H;
      const ay = p.ymin <= 0 && p.ymax >= 0 ? Y(0) : H; // x 轴所在像素 y
      const ax = p.xmin <= 0 && p.xmax >= 0 ? X(0) : 0; // y 轴所在像素 x
      const xs = steps(p.xmin, p.xmax, p.xstep), ys = steps(p.ymin, p.ymax, p.ystep);
      const ferr = [], comp = (ex) => { const fn = PD.compile(ex, opt); if (!fn && String(ex || '').trim() !== '') ferr.push(ex + '：' + PD.exprError(ex, opt)); return fn; };
      const safe = (fn) => (x) => { try { const v = fn(x); return typeof v === 'number' ? v : NaN; } catch (e) { return NaN; } };
      const curve = (fn, x0, x1, N) => {
        let d = '', pen = false, prev = 0; N = N || 400;
        for (let i = 0; i <= N; i++) {
          const x = x0 + ((x1 - x0) * i) / N, y = fn(x);
          if (!isFinite(y)) { pen = false; continue; }
          const py = Math.max(-5 * H, Math.min(6 * H, Y(y)));
          if (pen && Math.abs(py - prev) > H * 1.5) pen = false;
          d += (pen ? 'L' : 'M') + f(X(x)) + ',' + f(py); pen = true; prev = py;
        }
        return d;
      };
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
      const cid = ctx.id + '-clip';
      ctx.defs.push(`<clipPath id="${cid}"><rect x="-2" y="-2" width="${f(W + 4)}" height="${f(H + 4)}"/></clipPath>`);
      let cv = '';
      // 不等式区域
      const IQ = PD.lines(p.ineq).map((l) => /^\s*([xy])\s*(<=|>=|<|>|≤|≥)\s*(.+)$/.exec(l)).filter(Boolean);
      if (IQ.length) {
        let shade = `<rect x="-2" y="-2" width="${f(W + 4)}" height="${f(H + 4)}" ${p.ineqFill === 'none' ? 'fill="none"' : regionFill(p.ineqFill, p.cc, ctx)}/>`, bd = '';
        IQ.forEach((m, i) => {
          const v = m[1], op = m[2].replace('≤', '<=').replace('≥', '>='), strict = op.length === 1, gt = op[0] === '>', fn = comp(m[3]); if (!fn) return;
          const g = safe(fn), id = `${ctx.id}-iq${i}`, big = 4 * (W + H);
          let region;
          if (v === 'x') { const c = g(0), px = X(c); region = gt ? `M${f(px)},${-big}H${big}V${big}H${f(px)}Z` : `M${f(px)},${-big}H${-big}V${big}H${f(px)}Z`; bd += `<line x1="${f(px)}" y1="0" x2="${f(px)}" y2="${f(H)}" ${S(p, { color: p.cc, sw: p.cw * 0.8, dash: strict ? 'dash' : 'solid' })}/>`; }
          else {
            const N = 300, pts = [];
            for (let k = 0; k <= N; k++) { const x = p.xmin - dx * 0.02 + (dx * 1.04 * k) / N, y = g(x); pts.push([X(x), isFinite(y) ? Math.max(-big, Math.min(big, Y(y))) : (gt ? -big : big)]); }
            const edge = gt ? -big : big;
            region = `M${f(pts[0][0])},${edge}` + pts.map((q) => `L${f(q[0])},${f(q[1])}`).join('') + `L${f(pts[N][0])},${edge}Z`;
            bd += `<path d="${curve(g, p.xmin, p.xmax)}" fill="none" ${S(p, { color: p.cc, sw: p.cw * 0.8, dash: strict ? 'dash' : 'solid' })}/>`;
          }
          ctx.defs.push(`<clipPath id="${id}"><path d="${region}"/></clipPath>`);
          shade = `<g clip-path="url(#${id})">${shade}</g>`;
        });
        cv += shade + bd;
      }
      // 两曲线间面积
      PD.lines(p.fills).forEach((line) => {
        const [e1, e2, a, b, st] = split(line), f1 = comp(e1); if (!f1) return;
        const f2 = e2 ? comp(e2) : () => 0; if (!f2) return;
        const g1 = safe(f1), g2 = safe(f2), x0 = num(a, p.xmin), x1 = num(b, p.xmax), N = 200, up = [], dn = [];
        for (let k = 0; k <= N; k++) { const x = x0 + ((x1 - x0) * k) / N, y1 = g1(x), y2 = g2(x); if (!isFinite(y1) || !isFinite(y2)) continue; up.push([X(x), Y(y1)]); dn.push([X(x), Y(y2)]); }
        if (up.length < 2) return;
        cv += `<path d="M${up.map((q) => f(q[0]) + ',' + f(q[1])).join('L')}L${dn.reverse().map((q) => f(q[0]) + ',' + f(q[1])).join('L')}Z" ${regionFill(st || 'hatch', p.cc, ctx)} stroke="none"/>`;
      });
      // 折线
      const P = PD.parsePts(p.poly);
      if (P.length) {
        const path = P.map((q, i) => (i ? 'L' : 'M') + f(X(q[0])) + ',' + f(Y(q[1]))).join('');
        if (p.shade !== 'none' && P.length > 1) {
          const area = path + `L${f(X(P[P.length - 1][0]))},${f(ay)}L${f(X(P[0][0]))},${f(ay)}Z`;
          cv += `<path d="${area}" ${regionFill(p.shade, p.cc, ctx)} stroke="none"/>`;
        }
        cv += `<path d="${path}" fill="none" ${S(p, { color: p.cc, sw: p.cw, dash: 'solid' })}/>`;
      }
      // 直线 x=a / y=b
      PD.lines(p.vlines).forEach((line) => {
        const [e, st, lab] = split(line), m = /^\s*([xy])\s*=\s*(.+)$/.exec(e); if (!m) return;
        const fn = comp(m[2]); if (!fn) return; const c = safe(fn)(0); if (!isFinite(c)) return;
        const sa = S(p, { color: p.stroke, sw: Math.max(0.8, p.cw * 0.6), dash: st || 'dash' });
        if (m[1] === 'x') { const px = X(c); cv += `<line x1="${f(px)}" y1="0" x2="${f(px)}" y2="${f(H)}" ${sa}/>`; if (lab) o += T(ctx, lab, px + 5, 10, { size: p.ls - 2, anchor: 'start', color: p.stroke, halo: true }); }
        else { const py = Y(c); cv += `<line x1="0" y1="${f(py)}" x2="${f(W)}" y2="${f(py)}" ${sa}/>`; if (lab) o += T(ctx, lab, W - 4, py - 11, { size: p.ls - 2, anchor: 'end', color: p.stroke, halo: true }); }
      });
      // 圆
      PD.lines(p.circles).forEach((line) => {
        const [c, st, col] = split(line), a = c.split(',').map((s) => +s.trim()); if (a.length < 3 || a.some((v) => !isFinite(v))) return;
        cv += `<ellipse cx="${f(X(a[0]))}" cy="${f(Y(a[1]))}" rx="${f((a[2] / dx) * W)}" ry="${f((a[2] / dy) * H)}" fill="none" ${S(p, { color: col || p.cc, sw: p.cw, dash: st || 'solid' })}/>`;
      });
      // 线段
      PD.lines(p.segs).forEach((line) => {
        const [c, st, col] = split(line), a = c.split(',').map((s) => +s.trim()); if (a.length < 4 || a.some((v) => !isFinite(v))) return;
        cv += `<line x1="${f(X(a[0]))}" y1="${f(Y(a[1]))}" x2="${f(X(a[2]))}" y2="${f(Y(a[3]))}" ${S(p, { color: col || p.cc, sw: Math.max(1, p.cw * 0.8), dash: st || 'solid' })}/>`;
      });
      // 函数
      const FS = [];
      PD.lines(p.funcs).forEach((line) => {
        const [ex, a, b, st, col, lab, lx] = split(line);
        const fn = comp(ex); if (!fn) return;
        const g = safe(fn), x0 = num(a, p.xmin), x1 = num(b, p.xmax);
        FS.push({ g, x0, x1 });
        const d = curve(g, x0, x1);
        if (d) cv += `<path d="${d}" fill="none" ${S(p, { color: col || p.cc, sw: p.cw, dash: st || 'solid' })}/>`;
        if (lab && lx !== undefined && lx !== '' && isFinite(+lx)) { const yl = g(+lx); if (isFinite(yl)) o += T(ctx, lab, X(+lx) + 6, Y(yl) - 12, { size: p.ls - 2, anchor: 'start', color: col || p.cc, halo: true }); }
        else if (lab) {
          let xe = x1, ye = g(xe);
          for (let k = 0; k < 200 && !(isFinite(ye) && Y(ye) > 4 && Y(ye) < H - 4); k++) { xe -= (x1 - x0) / 200; ye = g(xe); }
          if (isFinite(ye)) o += T(ctx, lab, X(xe) + 6, Y(ye) - 10, { size: p.ls - 2, anchor: 'start', color: col || p.cc, halo: true });
        }
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
        if (p.tlabels) o += T(ctx, PD.fmt(v) + (p.xsuf || ''), px, ay + p.fs * 0.85 + 4, { size: p.fs, italic: false, color: p.stroke, halo: true });
      });
      ys.forEach((v) => {
        const py = Y(v); if (Math.abs(py - ay) < 0.5 && skipO) return;
        if (p.ticks) td += `M${f(ax)},${f(py)}h${tl}`;
        if (p.tlabels) o += T(ctx, PD.fmt(v) + (p.ysuf || ''), ax - 6, py, { size: p.fs, italic: false, anchor: 'end', color: p.stroke, halo: true });
      });
      if (td) o += `<path d="${td}" fill="none" ${S(p, { dash: 'solid', sw: Math.max(0.8, p.sw * 0.7) })}/>`;
      if (p.ol) o += T(ctx, p.ol, ax - p.fs * 0.7, ay + p.fs * 0.85 + 2, { size: p.fs + 2, color: p.stroke });
      o += T(ctx, p.xl, W + ext + 6, ay, { size: p.ls, anchor: 'start', color: p.stroke });
      o += T(ctx, p.yl, ax, -ext - p.ls * 0.75, { size: p.ls, color: p.stroke });
      // 数据点
      const ds = 3.5, dw = S(p, { color: p.cc, sw: 1.3, dash: 'solid' });
      PD.parsePts(p.dots).forEach(([x, y]) => {
        const px = f(X(x)), py = f(Y(y));
        if (p.dstyle === 'cross') o += `<path d="M${px - ds},${py - ds}l${2 * ds},${2 * ds}M${px - ds},${py + ds}l${2 * ds},${-2 * ds}" ${dw}/>`;
        else if (p.dstyle === 'plus') o += `<path d="M${px - ds - 1},${py}h${2 * ds + 2}M${px},${py - ds - 1}v${2 * ds + 2}" ${dw}/>`;
        else if (p.dstyle === 'circle') o += `<circle cx="${px}" cy="${py}" r="${ds}" fill="#fff" ${dw}/>`;
        else o += `<circle cx="${px}" cy="${py}" r="${ds - 0.5}" fill="${p.cc}"/>`;
      });
      // 标记点（投影）
      PD.lines(p.marks).forEach((line) => {
        const a = line.split(',').map((s) => s.trim());
        if (a.length < 2 || a[0] === '' || isNaN(+a[0]) || isNaN(+a[1])) return;
        const px = X(+a[0]), py = Y(+a[1]);
        o += `<path d="M${f(px)},${f(py)}V${f(ay)}M${f(px)},${f(py)}H${f(ax)}" fill="none" ${S(p, { dash: 'dash', sw: 0.9 })}/>`;
        o += `<circle cx="${f(px)}" cy="${f(py)}" r="2.5" fill="${p.stroke}"/>`;
        if (a[2]) o += T(ctx, a[2], px, (py > ay ? ay - p.ls * 0.9 + 3 : ay + p.ls * 0.9 + 3), { size: p.ls, color: p.stroke, halo: true });
        if (a[3]) o += T(ctx, a[3], ax - 7, py, { size: p.ls, anchor: 'end', color: p.stroke, halo: true });
        if (a[4]) o += T(ctx, a[4], px + 7, py - 11, { size: p.ls, anchor: 'start', color: p.stroke, halo: true });
      });
      // 标注点 + 自动交点
      const dotLab = (x, y, lab, pos) => {
        const px = X(x), py = Y(y); if (px < -1 || px > W + 1 || py < -1 || py > H + 1) return '';
        const D = { ne: [6, -11, 'start'], nw: [-6, -11, 'end'], se: [6, 12, 'start'], sw: [-6, 12, 'end'], n: [0, -13, 'middle'], s: [0, 15, 'middle'], e: [8, 0, 'start'], w: [-8, 0, 'end'] }[(pos || 'ne').toLowerCase()] || [6, -11, 'start'];
        return `<circle cx="${f(px)}" cy="${f(py)}" r="3" fill="${p.stroke}"/>` + (lab ? T(ctx, lab, px + D[0], py + D[1], { size: p.ls - 2, anchor: D[2], color: p.stroke, halo: true }) : '');
      };
      PD.lines(p.pts).forEach((line) => {
        const a = line.split(',').map((s) => s.trim()); if (a.length < 2 || a[0] === '' || a[1] === '' || !isFinite(+a[0]) || !isFinite(+a[1])) return;
        const hasPos = a.length > 3 && /^(ne|nw|se|sw|n|s|e|w)$/i.test(a[a.length - 1]);
        o += dotLab(+a[0], +a[1], a.slice(2, hasPos ? -1 : undefined).join(', '), hasPos ? a[a.length - 1] : 'ne');
      });
      const coord = (x, y) => `(${fmt2(x)}, ${fmt2(y)})`;
      if (p.roots) FS.forEach((F) => roots(F.g, Math.max(F.x0, p.xmin), Math.min(F.x1, p.xmax)).forEach((x) => (o += dotLab(x, 0, p.ilab ? coord(x, 0) : '', 'se'))));
      if (p.inter) for (let i = 0; i < FS.length; i++) for (let j = i + 1; j < FS.length; j++) {
        const A = FS[i], B = FS[j], a = Math.max(A.x0, B.x0, p.xmin), b = Math.min(A.x1, B.x1, p.xmax); if (!(b > a)) continue;
        roots((x) => A.g(x) - B.g(x), a, b).forEach((x) => (o += dotLab(x, A.g(x), p.ilab ? coord(x, A.g(x)) : '', 'nw')));
      }
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
