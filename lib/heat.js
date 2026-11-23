/* 第一册 · 热与气体
   温度计 · 电热棒 · 水壶 · 保温瓶 · 气体 · 气缸活塞 · 连通容器 · 冰块 · 蒸汽 · 热传导棒 · 对流 · 辐射 · 热流箭头 · 常用图像 */
(function () {
  'use strict';
  const f = PD.f, S = PD.strokeAttr, T = PD.tex, L = PD.lab, pt = L.pt, clamp = L.clamp;
  const CAT = 'DSE-物理/热与气体';

  /* ================= 液体玻璃温度计 ================= */
  PD.register({
    type: 'thermo', name: '液体玻璃温度计',
    defaults: { L: 220, tw: 10, br: 8, bore: 3, tmin: -10, tmax: 110, temp: 25, liq: '#d62828', glass: '#ffffff',
      ticks: true, tstep: 10, tminor: 5, tlabels: false, tside: 'right', marks: '', mside: 'right', mlen: 26, lsize: 15 },
    handles: [['zero', 'L', 1, -1]],
    fields: [
      { k: 'L', t: 'num', l: '总长' }, { k: 'tw', t: 'num', l: '玻璃管粗' }, { k: 'br', t: 'num', l: '玻璃泡半径' }, { k: 'bore', t: 'num', l: '液柱粗', step: 0.5 },
      { k: 'tmin', t: 'num', l: '刻度下限' }, { k: 'tmax', t: 'num', l: '刻度上限' }, { k: 'temp', t: 'num', l: '液柱读数' },
      { k: 'liq', t: 'color', l: '液体颜色' },
      { k: 'ticks', t: 'bool', l: '刻度' }, { k: 'tstep', t: 'num', l: '主刻度间隔', when: (p) => p.ticks }, { k: 'tminor', t: 'num', l: '每格细分', when: (p) => p.ticks },
      { k: 'tlabels', t: 'bool', l: '刻度数字', when: (p) => p.ticks }, { k: 'tside', t: 'sel', l: '刻度数字在', o: [['right', '右'], ['left', '左']], when: (p) => p.ticks && p.tlabels },
      { k: 'marks', t: 'area', l: '标记点(折线引出)', ph: '每行: 读数, 标签, 上下偏移(可省)\n例: 100, 汽点 100 °C\n例: 0, 冰点 0 °C, 15\n例: 37, \\it{l}_{37}, -12' },
      { k: 'mside', t: 'sel', l: '标记在', o: [['right', '右侧'], ['left', '左侧']] }, { k: 'mlen', t: 'num', l: '引线长度' }, { k: 'lsize', t: 'num', l: '标签字号' },
    ],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const Lh = +p.L, a = +p.tw / 2, br = Math.max(+p.br, a + 1), bj = Math.sqrt(br * br - a * a);
      const y0 = -bj - 8, y1 = -Lh + a + 8, span = y0 - y1, Y = (t) => y0 - (span * (t - p.tmin)) / (p.tmax - p.tmin || 1);
      const glass = `M${pt(-a, -bj)}L${pt(-a, -Lh + a)}A${f(a)},${f(a)} 0 0 1 ${pt(a, -Lh + a)}L${pt(a, -bj)}A${f(br)},${f(br)} 0 1 1 ${pt(-a, -bj)}Z`;
      let o = `<path d="${glass}" fill="${p.glass || '#ffffff'}" ${S(p, { dash: 'solid' })}/>`;
      const bw = Math.min(+p.bore, 2 * a - 3), yt = clamp(Y(+p.temp), -Lh + a + 2, -bj + 2);
      o += `<circle r="${f(br - 2.2)}" fill="${p.liq}"/><rect x="${f(-bw / 2)}" y="${f(yt)}" width="${f(bw)}" height="${f(-yt)}" fill="${p.liq}"/>`;
      if (p.ticks) {
        const st = +p.tstep, mn = Math.max(1, Math.round(+p.tminor || 1)), sg = p.tside === 'left' ? -1 : 1; let d = '';
        L.steps(+p.tmin, +p.tmax, st / mn).forEach((t) => {
          const y = Y(t), maj = Math.abs(t / st - Math.round(t / st)) < 1e-6;
          d += `M${pt(sg * a, y)}h${f(-sg * (maj ? a * 0.9 : a * 0.45))}`;
          if (maj && p.tlabels) o += T(ctx, PD.fmt(t), sg * (a + 4), y, { size: p.lsize * 0.7, anchor: sg > 0 ? 'start' : 'end', italic: false, color: p.stroke });
        });
        o += `<path d="${d}" fill="none" ${L.thin(p, 0.45)}/>`;
      }
      PD.lines(p.marks).forEach((line) => {
        const parts = line.split(','), v = parseFloat(parts[0]); if (!isFinite(v)) return;
        let dy = 0;
        if (parts.length >= 3) { const last = parts[parts.length - 1].trim(); if (last !== '' && isFinite(+last)) { dy = +last; parts.pop(); } }
        const lab = parts.slice(1).join(',').trim(), sg = p.mside === 'left' ? -1 : 1, y = Y(v);
        const x0 = sg * a, x1 = x0 + sg * 8, x2 = x1 + sg * (Math.abs(dy) * 0.8 + 6), x3 = x2 + sg * +p.mlen;
        o += `<path d="M${pt(-a, y)}H${f(a)}" ${L.thin(p, 0.8)}/>`;
        o += `<path d="M${pt(x0, y)}H${f(x1)}L${pt(x2, y + dy)}H${f(x3)}" fill="none" ${L.thin(p, 0.6)}/><circle cx="${f(x0)}" cy="${f(y)}" r="1.8" fill="${p.stroke}"/>`;
        if (lab) o += T(ctx, lab, x3 + sg * 4, y + dy, { size: p.lsize, anchor: sg > 0 ? 'start' : 'end', italic: false, color: p.stroke });
      });
      return o;
    },
  });

  /* ================= 电热棒 ================= */
  PD.register({
    type: 'heater', name: '电热棒(浸入式)',
    defaults: { style: 'rod', L: 140, w: 12, hw: 24, hh: 22, wires: true, wl: 40, hot: false, hc: '#555555', shading: true },
    fields: [
      { k: 'style', t: 'sel', l: '样式', o: [['rod', '棒状'], ['coil', '螺旋电热丝']] },
      { k: 'L', t: 'num', l: '发热部分长' }, { k: 'w', t: 'num', l: '粗细' }, { k: 'hw', t: 'num', l: '头部宽' }, { k: 'hh', t: 'num', l: '头部高' },
      { k: 'wires', t: 'bool', l: '残留线头' }, { k: 'wl', t: 'num', l: '线头长度', when: (p) => p.wires },
      { k: 'hot', t: 'bool', l: '发热(红热)' }, { k: 'hc', t: 'color', l: '头部颜色' }, { k: 'shading', t: 'bool', l: '金属质感' },
    ],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const Lr = +p.L, w = +p.w, hw = +p.hw, hh = +p.hh, sd = S(p, { dash: 'solid' });
      let o = '';
      if (p.wires) {
        const wl = +p.wl, sx = hw * 0.22;
        const ends = [[-sx, `M${pt(-sx, 0)}C${pt(-sx, -wl * 0.5)} ${pt(-sx - wl * 0.2, -wl * 0.75)} ${pt(-sx - wl * 0.55, -wl)}`, [-sx - wl * 0.55, -wl], [-wl * 0.35, -wl * 0.25]],
          [sx, `M${pt(sx, 0)}C${pt(sx, -wl * 0.45)} ${pt(sx + wl * 0.25, -wl * 0.7)} ${pt(sx + wl * 0.6, -wl * 0.9)}`, [sx + wl * 0.6, -wl * 0.9], [wl * 0.35, -wl * 0.2]]];
        ends.forEach(([, d, e, dir]) => {
          o += `<path d="${d}" fill="none" stroke="${p.stroke}" stroke-width="${f(Math.max(2.6, p.sw * 2))}"/>`;
          const ang = Math.atan2(dir[1], dir[0]);
          [-0.3, 0, 0.3].forEach((da) => (o += `<line x1="${f(e[0])}" y1="${f(e[1])}" x2="${f(e[0] + 6 * Math.cos(ang + da))}" y2="${f(e[1] + 6 * Math.sin(ang + da))}" stroke="#c87533" stroke-width="1.1" stroke-linecap="round"/>`));
        });
      }
      if (p.style === 'coil') {
        const top = hh, l0 = Lr * 0.15;
        o += `<rect x="${f(-w * 0.3)}" y="${f(top)}" width="${f(w * 0.6)}" height="${f(l0)}" fill="#bdbdbd" ${L.thin(p, 0.8)}/>`;
        for (let y = top + l0 + 3; y < top + Lr; y += 6) o += `<ellipse cx="0" cy="${f(y)}" rx="${f(w * 0.85)}" ry="3" fill="none" stroke="${p.hot ? '#d9480f' : p.stroke}" stroke-width="${f(Math.max(1, p.sw * 0.9))}"/>`;
      } else {
        o += `<rect x="${f(-w / 2)}" y="${f(hh - w)}" width="${f(w)}" height="${f(Lr + w)}" rx="${f(w / 2)}" fill="${L.paint(p, ctx, '#c8ccd1', -w / 2, w / 2)}" ${sd}/>`;
        if (p.hot) {
          const id = ctx.id + '-hot';
          ctx.defs.push(`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff6a1f" stop-opacity="0"/><stop offset="0.4" stop-color="#ff5a1f" stop-opacity="0.65"/><stop offset="1" stop-color="#e03100" stop-opacity="0.85"/></linearGradient>`);
          o += `<rect x="${f(-w / 2)}" y="${f(hh + Lr * 0.2)}" width="${f(w)}" height="${f(Lr * 0.8)}" rx="${f(w / 2)}" fill="url(#${id})"/>`;
        }
      }
      o += `<rect x="${f(-hw / 2)}" y="0" width="${f(hw)}" height="${f(hh)}" rx="3" fill="${L.paint(p, ctx, p.hc, -hw / 2, hw / 2)}" ${sd}/>`;
      return o;
    },
  });

  /* ================= 水壶 ================= */
  PD.register({
    type: 'kettle', name: '水壶/电水壶',
    defaults: { w: 130, h: 110, base: false, steam: false, fill: '#d3d8de', shading: false },
    fields: [{ k: 'w', t: 'num', l: '宽' }, { k: 'h', t: 'num', l: '高' }, { k: 'base', t: 'bool', l: '电热底座' }, { k: 'steam', t: 'bool', l: '壶嘴蒸汽' }, { k: 'fill', t: 'color', l: '颜色' }, { k: 'shading', t: 'bool', l: '金属质感' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const w = +p.w, h = +p.h, bx = p.base ? 10 : 0, sd = S(p, { dash: 'solid' }), fill = L.paint(p, ctx, p.fill, -w / 2, w / 2), Y = (y) => y - bx;
      let o = L.tube(`M${pt(w * 0.38, Y(-h * 0.92))}C${pt(w * 0.82, Y(-h * 0.98))} ${pt(w * 0.82, Y(-h * 0.3))} ${pt(w * 0.48, Y(-h * 0.25))}`, 11, p.stroke, p.fill, Math.max(1, p.sw));
      o += `<path d="M${pt(-w * 0.46, Y(-h * 0.25))}L${pt(-w * 0.8, Y(-h * 0.82))}L${pt(-w * 0.72, Y(-h * 0.88))}L${pt(-w * 0.42, Y(-h * 0.62))}Z" fill="${fill}" ${sd}/>`;
      o += `<path d="M${pt(-w * 0.4, Y(-h))}L${pt(-w / 2, Y(-12))}Q${pt(-w / 2, Y(0))} ${pt(-w / 2 + 12, Y(0))}L${pt(w / 2 - 12, Y(0))}Q${pt(w / 2, Y(0))} ${pt(w / 2, Y(-12))}L${pt(w * 0.4, Y(-h))}Z" fill="${fill}" ${sd}/>`;
      o += `<path d="M${pt(-w * 0.32, Y(-h))}Q${pt(0, Y(-h - 18))} ${pt(w * 0.32, Y(-h))}Z" fill="${fill}" ${sd}/><circle cx="0" cy="${f(Y(-h - 12))}" r="5" fill="#555555" ${sd}/>`;
      if (p.base) o += `<rect x="${f(-w * 0.53)}" y="${f(-bx)}" width="${f(w * 1.06)}" height="${f(bx)}" rx="3" fill="#555555" ${sd}/>`;
      if (p.steam) o += L.steam(p, -w * 0.86, -w * 0.62, Y(-h * 0.88), Math.max(40, h * 0.45), 2);
      return o;
    },
  });

  /* ================= 保温瓶(剖面) ================= */
  PD.register({
    type: 'thermos', name: '保温瓶(真空瓶剖面)',
    defaults: { w: 100, h: 220, gap: 8, level: 0.7, liq: '#8fc3ea', lop: 0.55, stopper: true, cap: true, fill: '#f2f2f2', silver: '#808080' },
    fields: [
      { k: 'w', t: 'num', l: '宽' }, { k: 'h', t: 'num', l: '高' }, { k: 'gap', t: 'num', l: '真空层厚度' },
      { k: 'level', t: 'range', l: '液面高度', min: 0, max: 1, step: 0.02 }, { k: 'liq', t: 'color', l: '液体颜色' }, { k: 'lop', t: 'range', l: '液体浓淡', min: 0, max: 1, step: 0.05 },
      { k: 'stopper', t: 'bool', l: '瓶塞' }, { k: 'cap', t: 'bool', l: '外盖' }, { k: 'fill', t: 'color', l: '外壳颜色' }, { k: 'silver', t: 'color', l: '镀银层颜色' },
    ],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const w = +p.w, h = +p.h, gap = +p.gap, r1 = (w - 20) / 2, r2 = r1 - gap, yf = -h + 34, b1 = -12, b2 = -12 - gap, sd = S(p, { dash: 'solid' });
      const U = (r, b) => `M${pt(-r, yf)}L${pt(-r, b - r)}A${f(r)},${f(r)} 0 0 0 ${pt(r, b - r)}L${pt(r, yf)}`;
      let o = `<rect x="${f(-w / 2)}" y="${f(-h + 14)}" width="${f(w)}" height="${f(h - 14)}" rx="12" fill="${p.fill}" ${sd}/>`;
      o += `<path d="M${pt(-r1, yf)}L${pt(-r1, b1 - r1)}A${f(r1)},${f(r1)} 0 0 0 ${pt(r1, b1 - r1)}L${pt(r1, yf)}L${pt(r2, yf)}L${pt(r2, b2 - r2)}A${f(r2)},${f(r2)} 0 0 1 ${pt(-r2, b2 - r2)}L${pt(-r2, yf)}Z" fill="#ffffff"/>`;
      o += L.contents(p, ctx, { clip: U(r2, b2) + 'Z', x0: -r2, x1: r2, ybot: b2, ytop: yf }).inner;
      const sv = `stroke="${p.silver}" stroke-width="${f(Math.max(2.2, p.sw * 1.6))}" fill="none"`;
      o += `<path d="${U(r1, b1)}" ${sv}/><path d="${U(r2, b2)}" ${sv}/><path d="M${pt(-r1, yf)}H${f(-r2)}M${pt(r1, yf)}H${f(r2)}" ${sv}/>`;
      o += `<path d="M0,-1l-5,-2l10,-2l-10,-2l10,-2l-5,-2" fill="none" ${L.thin(p, 0.6)}/>`;
      if (p.stopper) o += `<path d="M${pt(-r2 - 4, yf - 16)}L${pt(r2 + 4, yf - 16)}L${pt(r2 - 1, yf + 16)}L${pt(-r2 + 1, yf + 16)}Z" fill="#caa66e" ${sd}/>`;
      if (p.cap) o += `<rect x="${f(-w * 0.45)}" y="${f(-h)}" width="${f(w * 0.9)}" height="16" rx="5" fill="${p.fill}" ${sd}/>`;
      return o;
    },
  });

  /* ================= 气体 ================= */
  PD.register({
    type: 'gas', name: '气体(分子/云团)',
    defaults: { shape: 'cloud', w: 140, h: 90, n: 30, r: 3.2, seed: 5, arrows: false, alen: 12, pc: '#3b3b3b', tint: true, tc: '#cfe3f5' },
    handles: [['w', 'h', 0.5, 0.5]],
    fields: [
      { k: 'shape', t: 'sel', l: '外形', o: [['cloud', '云团'], ['ellipse', '椭圆'], ['rect', '矩形'], ['none', '无边界(放进容器)']] },
      { k: 'w', t: 'num', l: '宽' }, { k: 'h', t: 'num', l: '高' }, { k: 'n', t: 'num', l: '分子数', min: 0 }, { k: 'r', t: 'num', l: '分子半径', step: 0.2 },
      { k: 'arrows', t: 'bool', l: '速度箭头' }, { k: 'alen', t: 'num', l: '箭头长度', when: (p) => p.arrows },
      { k: 'pc', t: 'color', l: '分子颜色' }, { k: 'tint', t: 'bool', l: '底色' }, { k: 'tc', t: 'color', l: '底色颜色' }, { k: 'seed', t: 'num', l: '随机排布' },
    ],
    style: ['stroke', 'sw', 'dash', 'opacity'],
    render(p, ctx) {
      const w = +p.w, h = +p.h, R = PD.rng(p.seed);
      let path = '', inside = () => true;
      if (p.shape === 'rect') path = `M${pt(-w / 2, -h / 2)}h${f(w)}v${f(h)}h${f(-w)}Z`;
      else if (p.shape === 'ellipse') { path = `M${pt(-w / 2, 0)}A${f(w / 2)},${f(h / 2)} 0 1 0 ${pt(w / 2, 0)}A${f(w / 2)},${f(h / 2)} 0 1 0 ${pt(-w / 2, 0)}Z`; inside = (x, y) => (x / (w / 2)) ** 2 + (y / (h / 2)) ** 2 <= 0.92; }
      else if (p.shape === 'cloud') {
        const R2 = PD.rng(+p.seed + 99), N = 12, ax = (w / 2) * 0.86, ay = (h / 2) * 0.8, Q = [];
        for (let i = 0; i < N; i++) { const t = (2 * Math.PI * i) / N + (R2() - 0.5) * 0.15; Q.push([ax * Math.cos(t), ay * Math.sin(t)]); }
        path = `M${pt(Q[0][0], Q[0][1])}`;
        for (let i = 0; i < N; i++) { const a = Q[i], b = Q[(i + 1) % N], c = Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.6; path += `A${f(c)},${f(c)} 0 0 1 ${pt(b[0], b[1])}`; }
        path += 'Z'; inside = (x, y) => (x / ax) ** 2 + (y / ay) ** 2 <= 0.85;
      }
      let o = '';
      if (path) { if (p.tint) o += `<path d="${path}" fill="${p.tc}" fill-opacity="0.6"/>`; o += `<path d="${path}" fill="none" ${S(p)}/>`; }
      o += L.particles(p, R, Math.round(+p.n || 0), +p.r, [-w / 2, -h / 2, w / 2, h / 2], inside, p.pc, p.arrows, +p.alen);
      return o;
    },
  });

  /* ================= 气缸活塞 ================= */
  PD.register({
    type: 'pcyl', name: '气缸+活塞',
    defaults: { w: 110, h: 170, t: 8, py: 100, pt: 14, rod: false, load: 1, n: 24, r: 3, seed: 4, arrows: false, pc: '#3b3b3b', tint: true, tc: '#dbe9f6' },
    handles: [['zero', 'py', 1, -1]],
    fields: [
      { k: 'w', t: 'num', l: '内径' }, { k: 'h', t: 'num', l: '高' }, { k: 't', t: 'num', l: '壁厚' }, { k: 'py', t: 'num', l: '活塞高度' }, { k: 'pt', t: 'num', l: '活塞厚' },
      { k: 'rod', t: 'bool', l: '活塞杆' }, { k: 'load', t: 'num', l: '砝码数', min: 0 },
      { k: 'n', t: 'num', l: '气体分子数', min: 0 }, { k: 'r', t: 'num', l: '分子半径', step: 0.2 }, { k: 'arrows', t: 'bool', l: '速度箭头' },
      { k: 'tint', t: 'bool', l: '气体底色' }, { k: 'tc', t: 'color', l: '底色颜色' }, { k: 'pc', t: 'color', l: '分子颜色' }, { k: 'seed', t: 'num', l: '随机排布' },
    ],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const w = +p.w, h = +p.h, t = +p.t, th = +p.pt, py = clamp(+p.py, t + 6, h - th), sd = S(p, { dash: 'solid' }), R = PD.rng(p.seed);
      let o = '';
      if (p.tint) o += `<rect x="${f(-w / 2)}" y="${f(-py)}" width="${f(w)}" height="${f(py - t)}" fill="${p.tc}" fill-opacity="0.7"/>`;
      o += L.particles(p, R, Math.round(+p.n || 0), +p.r, [-w / 2, -py, w / 2, -t], () => true, p.pc, p.arrows, w * 0.12);
      const hatch = PD.fillAttr({ fillMode: 'hatch', fill: p.stroke }, ctx);
      [[-w / 2 - t, -h, t, h], [w / 2, -h, t, h], [-w / 2, -t, w, t]].forEach(([x, y, ww, hh]) => (o += `<rect x="${f(x)}" y="${f(y)}" width="${f(ww)}" height="${f(hh)}" fill="#ffffff"/><rect x="${f(x)}" y="${f(y)}" width="${f(ww)}" height="${f(hh)}" ${hatch} ${sd}/>`));
      let top = -py - th;
      o += `<rect x="${f(-w / 2 + 0.5)}" y="${f(top)}" width="${f(w - 1)}" height="${f(th)}" fill="#a8a8a8" ${sd}/>`;
      if (p.rod) { o += `<rect x="-5" y="${f(top - 50)}" width="10" height="50" fill="#d0d0d0" ${sd}/><rect x="${f(-w * 0.3)}" y="${f(top - 54)}" width="${f(w * 0.6)}" height="4" fill="#888888" ${sd}/>`; top -= 54; }
      for (let i = 0; i < Math.round(+p.load || 0); i++) o += `<rect x="${f(-w * 0.2)}" y="${f(top - 16 * (i + 1))}" width="${f(w * 0.4)}" height="16" rx="1.5" fill="#6d6d6d" ${sd}/>`;
      return o;
    },
  });

  /* ================= 连通容器 + 开关 ================= */
  const VSH = [['sphere', '球形'], ['box', '方形'], ['cyl', '圆柱']];
  PD.register({
    type: 'connected', name: '连通容器(开关)',
    defaults: { s1: 'sphere', r1: 60, s2: 'sphere', r2: 36, gap: 60, tw: 14, valve: 'closed', vlabel: '開關', c1: '#c8c8c8', c2: '#e8892b', shading: true,
      l1: '', l2: '', n1: 0, n2: 0, pr: 2.6, seed: 6, lsize: 16 },
    fields: [
      { k: 's1', t: 'sel', l: '容器 A 形状', o: VSH }, { k: 'r1', t: 'num', l: '容器 A 大小' }, { k: 'c1', t: 'color', l: '容器 A 颜色' }, { k: 'l1', t: 'text', l: '容器 A 标签' }, { k: 'n1', t: 'num', l: 'A 内分子数', min: 0 },
      { k: 's2', t: 'sel', l: '容器 B 形状', o: VSH }, { k: 'r2', t: 'num', l: '容器 B 大小' }, { k: 'c2', t: 'color', l: '容器 B 颜色' }, { k: 'l2', t: 'text', l: '容器 B 标签' }, { k: 'n2', t: 'num', l: 'B 内分子数', min: 0 },
      { k: 'gap', t: 'num', l: '连接管长度' }, { k: 'tw', t: 'num', l: '连接管粗' },
      { k: 'valve', t: 'sel', l: '开关', o: [['closed', '关闭'], ['open', '打开'], ['none', '无开关']] }, { k: 'vlabel', t: 'text', l: '开关标签' },
      { k: 'shading', t: 'bool', l: '光影着色' }, { k: 'lsize', t: 'num', l: '标签字号' }, { k: 'pr', t: 'num', l: '分子半径', step: 0.2 }, { k: 'seed', t: 'num', l: '随机排布' },
    ],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const r1 = +p.r1, r2 = +p.r2, gap = +p.gap, tw = +p.tw, cx2 = r1 + gap + r2, sd = S(p, { dash: 'solid' }), R = PD.rng(p.seed);
      let o = `<rect x="${f(r1 * 0.5)}" y="${f(-tw / 2)}" width="${f(cx2 - r2 * 0.5 - r1 * 0.5)}" height="${f(tw)}" fill="#f3f4f6"/><path d="M${pt(r1 * 0.5, -tw / 2)}H${f(cx2 - r2 * 0.5)}M${pt(r1 * 0.5, tw / 2)}H${f(cx2 - r2 * 0.5)}" ${sd}/>`;
      const vessel = (kind, cx, r, col, lab, n) => {
        const sh = p.shading;
        let s = '', inside;
        if (kind === 'box') {
          s += `<rect x="${f(cx - r)}" y="${f(-r)}" width="${f(2 * r)}" height="${f(2 * r)}" ${sh ? PD.fillAttr({ fillMode: 'linear', fill: col, fill2: '#ffffff' }, ctx) : `fill="${col}"`} ${sd}/>`;
          inside = () => true;
        } else if (kind === 'cyl') {
          const hh = r * 0.8, ry = r * 0.28;
          s += `<path d="M${pt(cx - r, -hh)}V${f(hh)}A${f(r)},${f(ry)} 0 0 0 ${pt(cx + r, hh)}V${f(-hh)}Z" fill="${sh ? L.metal(ctx, col, cx - r, cx + r) : col}" ${sd}/><ellipse cx="${f(cx)}" cy="${f(-hh)}" rx="${f(r)}" ry="${f(ry)}" fill="${PD.shade(col, 0.3)}" ${sd}/>`;
          inside = (x, y) => Math.abs(y) < hh - 2;
        } else {
          s += `<circle cx="${f(cx)}" cy="0" r="${f(r)}" ${sh ? PD.fillAttr({ fillMode: 'radial', fill: col, fill2: '#ffffff' }, ctx) : `fill="${col}"`} ${sd}/>`;
          inside = (x, y) => (x - cx) ** 2 + y * y < (r - 3) ** 2;
        }
        if (n > 0) s += L.particles(p, R, n, +p.pr, [cx - r, -r, cx + r, r], inside, '#3b3b3b', false, 0);
        if (lab) s += T(ctx, lab, cx, 0, { size: p.lsize, color: p.stroke, halo: true });
        return s;
      };
      o += vessel(p.s1, 0, r1, p.c1, p.l1, +p.n1) + vessel(p.s2, cx2, r2, p.c2, p.l2, +p.n2);
      if (p.valve !== 'none') {
        const xm = (r1 + cx2 - r2) / 2;
        o += `<path d="M${pt(xm, -tw / 2)}V${f(-tw / 2 - 11)}M${pt(xm - 8, -tw / 2 - 11)}H${f(xm + 8)}" fill="none" ${S(p, { dash: 'solid', sw: p.sw * 1.2 })}/>`;
        if (p.valve === 'closed') o += `<line x1="${f(xm)}" y1="${f(-tw / 2 + 1.5)}" x2="${f(xm)}" y2="${f(tw / 2 - 1.5)}" stroke="${p.stroke}" stroke-width="4"/>`;
        if (p.vlabel) o += T(ctx, p.vlabel, xm, -tw / 2 - 25, { size: p.lsize * 0.9, italic: false, color: p.stroke });
      }
      return o;
    },
  });

  /* ================= 冰块 / 碎冰堆 / 蒸汽 ================= */
  PD.register({
    type: 'ice', name: '冰块/碎冰堆',
    defaults: { mode: 'cubes', n: 4, size: 20, w: 90, h: 40, seed: 8 },
    fields: [
      { k: 'mode', t: 'sel', l: '类型', o: [['cubes', '冰块'], ['crushed', '碎冰堆']] }, { k: 'n', t: 'num', l: '冰块数', when: (p) => p.mode === 'cubes' },
      { k: 'size', t: 'num', l: '大小' }, { k: 'w', t: 'num', l: '堆宽' }, { k: 'h', t: 'num', l: '堆高', when: (p) => p.mode === 'crushed' }, { k: 'seed', t: 'num', l: '随机排布' },
    ],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const R = PD.rng(p.seed), sz = +p.size, w = +p.w;
      if (p.mode === 'crushed') {
        const h = +p.h, cid = ctx.id + '-mound', d = `M${pt(-w / 2, 0)}C${pt(-w * 0.3, -h * 1.3)} ${pt(w * 0.3, -h * 1.3)} ${pt(w / 2, 0)}Z`;
        ctx.defs.push(`<clipPath id="${cid}"><path d="${d}"/></clipPath>`);
        return `<g clip-path="url(#${cid})">${L.crushed(p, R, -w / 2, w / 2, -h * 1.05, 0, sz)}</g>`;
      }
      const n = Math.round(+p.n || 0), per = Math.max(1, Math.floor(w / (sz * 1.05))); let o = '';
      for (let i = 0; i < n; i++) {
        const row = Math.floor(i / per), col = i % per, inRow = Math.min(per, n - row * per);
        o += L.cube(p, -(inRow * sz * 1.05) / 2 + (col + 0.5) * sz * 1.05 + (R() - 0.5) * 3, -sz * 0.55 - row * sz * 0.9, sz, (R() - 0.5) * 30);
      }
      return o;
    },
  });
  PD.register({
    type: 'steam', name: '蒸汽',
    defaults: { steamStyle: 'wisp', n: 3, w: 60, H: 50, steamC: '#5f6b78', seed: 3 },
    fields: [{ k: 'steamStyle', t: 'sel', l: '样式', o: [['wisp', '波浪缕'], ['cloud', '水雾团']] }, { k: 'n', t: 'num', l: '缕数(0=自动)', when: (p) => p.steamStyle !== 'cloud' },
      { k: 'w', t: 'num', l: '宽度' }, { k: 'H', t: 'num', l: '高度' }, { k: 'steamC', t: 'color', l: '颜色' }, { k: 'seed', t: 'num', l: '随机排布', when: (p) => p.steamStyle === 'cloud' }],
    style: ['sw', 'opacity'],
    render(p) { return L.steam(p, -p.w / 2, p.w / 2, 0, +p.H, +p.n); },
  });

  /* ================= 热传导棒（蜡粘图钉） ================= */
  PD.register({
    type: 'condrod', name: '热传导棒(蜡粘图钉)',
    defaults: { L: 280, th: 14, n: 5, pin: 22, fallen: 2, fill: '#b9bec4', shading: true, label: '', lsize: 16 },
    handles: [['L', 'zero']],
    fields: [
      { k: 'L', t: 'num', l: '长度' }, { k: 'th', t: 'num', l: '粗细' }, { k: 'n', t: 'num', l: '图钉数', min: 0 }, { k: 'pin', t: 'num', l: '图钉长' },
      { k: 'fallen', t: 'num', l: '已掉落(从左数)', min: 0 }, { k: 'fill', t: 'color', l: '棒颜色' }, { k: 'shading', t: 'bool', l: '金属质感' },
      { k: 'label', t: 'text', l: '材料标签(如 铜)' }, { k: 'lsize', t: 'num', l: '标签字号' },
    ],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const Lr = +p.L, th = +p.th, n = Math.round(+p.n || 0), pl = +p.pin, sd = S(p, { dash: 'solid' });
      let o = `<rect x="0" y="${f(-th / 2)}" width="${f(Lr)}" height="${f(th)}" rx="2" fill="${L.paint(p, ctx, p.fill, -th / 2, th / 2, true)}" ${sd}/>`;
      const pin = (x, y) => `<line x1="${f(x)}" y1="${f(y)}" x2="${f(x)}" y2="${f(y + pl)}" ${S(p, { dash: 'solid', sw: 1.2 })}/><line x1="${f(x - 4)}" y1="${f(y + pl)}" x2="${f(x + 4)}" y2="${f(y + pl)}" ${S(p, { dash: 'solid', sw: 2 })}/>`;
      for (let i = 0; i < n; i++) {
        const x = Lr * 0.3 + Lr * 0.65 * (n > 1 ? i / (n - 1) : 0);
        if (i < Math.round(+p.fallen || 0)) o += `<g transform="translate(${pt(x + 6, th / 2 + pl + 22)}) rotate(80)">${pin(0, -pl / 2)}</g>`;
        else o += pin(x, th / 2 + 4) + `<ellipse cx="${f(x)}" cy="${f(th / 2 + 3)}" rx="5.5" ry="4" fill="#f2e8c9" ${L.thin(p, 0.5)}/>`;
      }
      if (p.label) o += T(ctx, p.label, Lr + 10, 0, { size: p.lsize, anchor: 'start', italic: false, color: p.stroke });
      return o;
    },
  });

  /* ================= 对流环流 ================= */
  PD.register({
    type: 'convection', name: '对流环流箭头',
    defaults: { rx: 32, ry: 50, n: 2, dir: 'ccw', pair: true, gap: 0, ah: 0 },
    fields: [
      { k: 'rx', t: 'num', l: '环宽(半)' }, { k: 'ry', t: 'num', l: '环高(半)' }, { k: 'n', t: 'num', l: '每环箭头数', min: 1 },
      { k: 'dir', t: 'sel', l: '方向', o: [['ccw', '逆时针(成对时中间向上)'], ['cw', '顺时针(成对时中间向下)']] },
      { k: 'pair', t: 'bool', l: '左右成对' }, { k: 'gap', t: 'num', l: '两环间距', when: (p) => p.pair }, { k: 'ah', t: 'num', l: '箭头大小(0=自动)' },
    ],
    style: ['stroke', 'sw', 'dash', 'opacity'],
    render(p) {
      const rx = +p.rx, ry = +p.ry, ah = PD.ahSize(p), n = Math.max(1, Math.round(+p.n));
      const loop = (cx, cw) => {
        let o = `<ellipse cx="${f(cx)}" cy="0" rx="${f(rx)}" ry="${f(ry)}" fill="none" ${S(p)}/>`;
        for (let k = 0; k < n; k++) {
          const t = (2 * Math.PI * k) / n, x = cx + rx * Math.cos(t), y = ry * Math.sin(t), sg = cw ? 1 : -1;
          const ang = Math.atan2(sg * ry * Math.cos(t), -sg * rx * Math.sin(t));
          o += PD.arrowHead(x + (Math.cos(ang) * ah) / 2, y + (Math.sin(ang) * ah) / 2, ang, ah, 'tri', p.stroke, p.sw);
        }
        return o;
      };
      const cw = p.dir === 'cw';
      if (!p.pair) return loop(0, cw);
      const off = rx + (+p.gap || 0) / 2;
      return loop(-off, cw) + loop(off, !cw);
    },
  });

  /* ================= 波浪箭头（辐射） ================= */
  PD.register({
    type: 'wavy', name: '波浪箭头(辐射)',
    defaults: { L: 150, amp: 6, wl: 18, a1: 'tri', ah: 0, label: '', lsize: 16 },
    handles: [['L', 'zero']],
    fields: [
      { k: 'L', t: 'num', l: '长度' }, { k: 'amp', t: 'num', l: '振幅' }, { k: 'wl', t: 'num', l: '波长' },
      { k: 'a1', t: 'sel', l: '端头', o: PD.ARROWS }, { k: 'ah', t: 'num', l: '箭头大小(0=自动)' }, { k: 'label', t: 'text', l: '标签' }, { k: 'lsize', t: 'num', l: '标签字号' },
    ],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const Lw = +p.L, ah = PD.ahSize(p), wl = Math.max(4, +p.wl), xe = Math.max(1, Math.floor((Lw - ah * 1.4) / wl)) * wl;
      let d = 'M0,0';
      for (let x = 1; x <= xe; x += 1) d += `L${pt(x, -p.amp * Math.sin((2 * Math.PI * x) / wl))}`;
      d += `L${f(Lw - PD.inset(p.a1) * ah)},0`;
      let o = `<path d="${d}" fill="none" ${S(p, { dash: 'solid' })}/>` + PD.arrowHead(Lw, 0, 0, ah, p.a1, p.stroke, p.sw);
      if (p.label) o += T(ctx, p.label, Lw / 2, -p.amp - 14, { size: p.lsize, italic: false, color: p.stroke, halo: true });
      return o;
    },
  });

  /* ================= 粗箭头（热流） ================= */
  PD.register({
    type: 'blockarrow', name: '粗箭头(热流)',
    defaults: { L: 120, bw: 26, hw: 50, hl: 34, label: 'Q', lsize: 20, fillMode: 'solid', fill: '#e6e6e6' },
    handles: [['L', 'zero']],
    fields: [{ k: 'L', t: 'num', l: '长度' }, { k: 'bw', t: 'num', l: '箭身宽' }, { k: 'hw', t: 'num', l: '箭头宽' }, { k: 'hl', t: 'num', l: '箭头长' }, { k: 'label', t: 'text', l: '标签' }, { k: 'lsize', t: 'num', l: '标签字号' }],
    render(p, ctx) {
      const Lw = +p.L, bw = +p.bw / 2, hw = +p.hw / 2, hl = Math.min(+p.hl, Lw);
      let o = `<polygon points="0,${f(-bw)} ${pt(Lw - hl, -bw)} ${pt(Lw - hl, -hw)} ${pt(Lw, 0)} ${pt(Lw - hl, hw)} ${pt(Lw - hl, bw)} 0,${f(bw)}" ${PD.fillAttr(p, ctx)} ${S(p)}/>`;
      if (p.label) o += T(ctx, p.label, (Lw - hl) / 2 + hl * 0.15, 0, { size: p.lsize, color: p.stroke });
      return o;
    },
  });

  /* ================= 预设 ================= */
  PD.preset(CAT, '温度计', 'thermo', {});
  PD.preset(CAT, '温度计(标记点)', 'thermo', { temp: 60, marks: '100, 汽点 100 °C\n0, 冰点 0 °C' });
  PD.preset(CAT, '未刻度温度计(校准题)', 'thermo', { ticks: false, temp: 40, marks: '0, 冰点\n100, 汽点' });
  PD.preset(CAT, '水银温度计(刻度数字)', 'thermo', { liq: '#8c8c8c', temp: 60, tlabels: true, L: 240 });
  PD.preset(CAT, '电热棒', 'heater', {});
  PD.preset(CAT, '电热棒(发热)', 'heater', { hot: true });
  PD.preset(CAT, '电热丝圈', 'heater', { style: 'coil', L: 100 });
  PD.preset(CAT, '发泡胶杯(盖)', 'vessel', { shape: 'foamcup', w: 80, h: 95, level: 0.7, lid: true });
  PD.preset(CAT, '马克杯(热饮)', 'vessel', { shape: 'mug', w: 70, h: 80, level: 0.8, liq: '#8b5a2b', lop: 0.75, steam: true });
  PD.preset(CAT, '烧杯(沸水+水雾)', 'vessel', { level: 0.65, boil: true, steam: true, steamStyle: 'cloud' });
  PD.preset(CAT, '玻璃杯(冰水)', 'vessel', { shape: 'tumbler', w: 70, h: 100, level: 0.7, ice: 3, iceSize: 16 });
  PD.preset(CAT, '锅(盖)', 'vessel', { shape: 'pot', w: 160, h: 70, level: 0.6, lid: true });
  PD.preset(CAT, '长柄锅', 'vessel', { shape: 'pot', handle: 'long', w: 120, h: 55, level: 0.5, steam: true });
  PD.preset(CAT, '水壶', 'kettle', {});
  PD.preset(CAT, '电水壶', 'kettle', { base: true, steam: true, w: 110, h: 120 });
  PD.preset(CAT, '保温瓶(剖面)', 'thermos', {});
  PD.preset(CAT, '气体(云团)', 'gas', {});
  PD.preset(CAT, '气体分子(运动)', 'gas', { shape: 'rect', n: 18, arrows: true, tint: false, w: 160, h: 110 });
  PD.preset(CAT, '气体(放进容器)', 'gas', { shape: 'none', w: 80, h: 70, n: 16, tint: false });
  PD.preset(CAT, '气缸+活塞+砝码', 'pcyl', {});
  PD.preset(CAT, '连通容器(开关)', 'connected', {});
  PD.preset(CAT, '连通容器(方+球)', 'connected', { s1: 'box', r1: 50, s2: 'sphere', r2: 40, c1: '#d9dde2', c2: '#d9dde2', valve: 'open', l1: 'A', l2: 'B', n1: 22, n2: 0 });
  PD.preset(CAT, '冰块', 'ice', {});
  PD.preset(CAT, '碎冰堆', 'ice', { mode: 'crushed', size: 16 });
  PD.preset(CAT, '蒸汽', 'steam', {});
  PD.preset(CAT, '水雾团', 'steam', { steamStyle: 'cloud', w: 90, H: 50 });
  PD.preset(CAT, '热传导棒(图钉)', 'condrod', {});
  PD.preset(CAT, '对流环流', 'convection', {});
  PD.preset(CAT, '辐射(波浪箭头)', 'wavy', {});
  PD.preset(CAT, '热流粗箭头', 'blockarrow', {});
  PD.preset(CAT, '加热曲线(θ-t)', 'graph', { W: 340, H: 220, xmin: 0, xmax: 20, ymin: -30, ymax: 130, ticks: false, tlabels: false, xl: 't', yl: '\\theta', ol: '', poly: '0,-20 3,0 8,0 13,100 18,100 20,120', marks: '13,100,,100,' });
  PD.preset(CAT, 'p-V 图(波义耳)', 'graph', { W: 300, H: 220, xmin: 0, xmax: 10, ymin: 0, ymax: 10, ticks: false, tlabels: false, xl: 'V', yl: 'p', funcs: '10/x ; 1.05 ; 10' });
  PD.preset(CAT, 'p-θ 图(外推)', 'graph', { W: 360, H: 200, xmin: -300, xmax: 150, ymin: 0, ymax: 160, xstep: 100, ystep: 50, ticks: false, tlabels: false, xl: '\\theta / °\\rm{C}', yl: 'p', ol: '0', funcs: '100+x*100/273 ; 0 ; 150\n100+x*100/273 ; -273 ; 0 ; dash', marks: '-273,0,−273,,' });
})();
