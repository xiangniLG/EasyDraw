/* 通用素材库 · 3D / 投影（坐标系、长方体、棱柱、圆柱、圆锥、球、平面） */
(function () {
  'use strict';
  const f = PD.f, S = PD.strokeAttr, T = PD.tex;
  const CAT = '通用/3D 投影';
  const solidFields = [
    ...PD.projFields,
    { k: 'hidden', t: 'sel', l: '被遮挡的棱', o: PD.HIDDEN },
    { k: 'shading', t: 'bool', l: '光影着色(用填充色)' },
  ];
  const D3 = Object.assign({}, PD.projDef, { hidden: 'dash', shading: false });
  const dashed = (p) => S(p, { dash: 'dash', sw: (+p.sw || 1.5) * 0.8 });

  /* ===== 三维坐标系 ===== */
  PD.register({
    type: 'axes3d', name: '三维坐标系',
    style: ['stroke', 'sw', 'opacity'],
    defaults: Object.assign({}, PD.projDef, { len: 150, neg: false, xl: 'x', yl: 'y', zl: 'z', ol: 'O', unit: 30, pts: '', vecs: '', ls: 17 }),
    fields: [
      ...PD.projFields, { k: 'len', t: 'num', l: '轴长' }, { k: 'neg', t: 'bool', l: '负半轴(虚线)' },
      { k: 'xl', t: 'text', l: 'X 轴(向右)标签' }, { k: 'yl', t: 'text', l: 'Y 轴(向上)标签' }, { k: 'zl', t: 'text', l: 'Z 轴(向外)标签' }, { k: 'ol', t: 'text', l: '原点标签' },
      { k: 'unit', t: 'num', l: '1 单位 = px' },
      { k: 'pts', t: 'area', l: '点 + 投影线', ph: '每行: x,y,z,标签\n例: 3,2,2,P' },
      { k: 'vecs', t: 'area', l: '矢量(从原点)', ph: '每行: x,y,z,标签\n例: 3,2,2,\\bf{r}' },
      { k: 'ls', t: 'num', l: '标签字号' },
    ],
    render(p, ctx) {
      const P = PD.projector(p), L = +p.len, ah = PD.ahSize(p), u = +p.unit;
      let o = '';
      const axis = (v, lab) => {
        const a = P(v[0] * L, v[1] * L, v[2] * L), len = Math.hypot(a.x, a.y); if (len < 1) return;
        const ux = a.x / len, uy = a.y / len;
        if (p.neg) { const b = P(-v[0] * L * 0.6, -v[1] * L * 0.6, -v[2] * L * 0.6); o += `<line x1="0" y1="0" x2="${f(b.x)}" y2="${f(b.y)}" ${dashed(p)}/>`; }
        o += `<line x1="0" y1="0" x2="${f(a.x - ux * ah * 0.85)}" y2="${f(a.y - uy * ah * 0.85)}" ${S(p, { dash: 'solid' })}/>`;
        o += PD.arrowHead(a.x, a.y, Math.atan2(uy, ux), ah, 'full', p.stroke, p.sw);
        o += T(ctx, lab, a.x + ux * 13, a.y + uy * 13, { size: p.ls, color: p.stroke });
      };
      axis([1, 0, 0], p.xl); axis([0, 1, 0], p.yl); axis([0, 0, 1], p.zl);
      if (p.ol) o += T(ctx, p.ol, -11, -9, { size: p.ls - 1, color: p.stroke });
      const rows = (s) => PD.lines(s).map((l) => l.split(',').map((x) => x.trim())).filter((a) => a.length >= 3 && a.slice(0, 3).every((x) => x !== '' && !isNaN(+x)));
      rows(p.pts).forEach((a) => {
        const [x, y, z] = a.map(Number), A = P(x * u, y * u, z * u), F = P(x * u, 0, z * u), Fx = P(x * u, 0, 0), Fz = P(0, 0, z * u);
        o += `<path d="M${f(A.x)},${f(A.y)}L${f(F.x)},${f(F.y)}M${f(Fx.x)},${f(Fx.y)}L${f(F.x)},${f(F.y)}L${f(Fz.x)},${f(Fz.y)}" fill="none" ${S(p, { dash: 'dash', sw: 0.9 })}/>`;
        o += `<circle cx="${f(A.x)}" cy="${f(A.y)}" r="2.6" fill="${p.stroke}"/>`;
        if (a[3]) o += T(ctx, a[3], A.x + 8, A.y - 10, { size: p.ls, anchor: 'start', color: p.stroke });
      });
      rows(p.vecs).forEach((a) => {
        const [x, y, z] = a.map(Number), A = P(x * u, y * u, z * u), len = Math.hypot(A.x, A.y); if (len < 1) return;
        const ux = A.x / len, uy = A.y / len, vh = ah * 1.1;
        o += `<line x1="0" y1="0" x2="${f(A.x - ux * vh * 0.7)}" y2="${f(A.y - uy * vh * 0.7)}" ${S(p, { dash: 'solid', sw: p.sw * 1.4 })}/>`;
        o += PD.arrowHead(A.x, A.y, Math.atan2(uy, ux), vh, 'tri', p.stroke, p.sw);
        if (a[3]) o += T(ctx, a[3], A.x + ux * 12, A.y + uy * 12 - 4, { size: p.ls, color: p.stroke });
      });
      return o;
    },
  });

  /* ===== 长方体 ===== */
  PD.register({
    type: 'cuboid', name: '长方体',
    defaults: Object.assign({}, D3, { w: 120, h: 70, d: 80 }),
    fields: [{ k: 'w', t: 'num', l: '长 (X)' }, { k: 'h', t: 'num', l: '高 (Y)' }, { k: 'd', t: 'num', l: '深 (Z)' }, ...solidFields],
    render(p, ctx) {
      const a = p.w / 2, b = p.h / 2, c = p.d / 2;
      const V = [[-a, -b, -c], [a, -b, -c], [a, b, -c], [-a, b, -c], [-a, -b, c], [a, -b, c], [a, b, c], [-a, b, c]];
      const F = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [3, 2, 6, 7], [0, 3, 7, 4], [1, 2, 6, 5]];
      return PD.polyhedron(p, ctx, V, F).out;
    },
  });

  /* ===== 正棱柱 / 棱锥 ===== */
  function ngon(n, r, y, rot) {
    const R = []; for (let i = 0; i < n; i++) { const t = ((rot + (360 * i) / n) * Math.PI) / 180; R.push([r * Math.cos(t), y, r * Math.sin(t)]); }
    return R;
  }
  PD.register({
    type: 'prism', name: '正棱柱/棱锥',
    defaults: Object.assign({}, D3, { n: 3, r: 55, h: 110, top: 1, spin: 90, vert: false }),
    fields: [
      { k: 'n', t: 'num', l: '底面边数', min: 3 }, { k: 'r', t: 'num', l: '底面外接圆半径' }, { k: 'h', t: 'num', l: '高' },
      { k: 'top', t: 'range', l: '顶面比例(0=棱锥)', min: 0, max: 1, step: 0.05 }, { k: 'spin', t: 'num', l: '底面旋转°', step: 15 },
      { k: 'vert', t: 'bool', l: '横放(轴沿 Z, 如光学棱镜)' }, ...solidFields,
    ],
    render(p, ctx) {
      const n = Math.max(3, Math.round(p.n)), h = +p.h, k = Math.max(0, Math.min(1, +p.top));
      let V = ngon(n, +p.r, -h / 2, +p.spin), F = [];
      if (k > 0.001) {
        V = V.concat(ngon(n, p.r * k, h / 2, +p.spin));
        F.push([...Array(n).keys()], [...Array(n).keys()].map((i) => i + n));
        for (let i = 0; i < n; i++) F.push([i, (i + 1) % n, ((i + 1) % n) + n, i + n]);
      } else {
        V.push([0, h / 2, 0]); F.push([...Array(n).keys()]);
        for (let i = 0; i < n; i++) F.push([i, (i + 1) % n, n]);
      }
      if (p.vert) V = V.map(([x, y, z]) => [x, -z, y]); // 绕 X 轴转 90°，使轴沿 Z
      return PD.polyhedron(p, ctx, V, F).out;
    },
  });

  /* ===== 圆柱 / 圆锥（共用） ===== */
  function capRings(p, P, r1, r2, h) {
    const N = 120, bot = [], top = [];
    for (let i = 0; i < N; i++) { const t = (2 * Math.PI * i) / N; bot.push(P(r1 * Math.cos(t), -h / 2, r1 * Math.sin(t))); top.push(P(r2 * Math.cos(t), h / 2, r2 * Math.sin(t))); }
    return { N, bot, top };
  }
  const ringPath = (R, idx, close) => idx.map((i, j) => (j ? 'L' : 'M') + f(R[i].x) + ',' + f(R[i].y)).join('') + (close ? 'Z' : '');
  function arcsOf(R, N) {
    let iL = 0, iR = 0;
    R.forEach((q, i) => { if (q.x < R[iL].x) iL = i; if (q.x > R[iR].x) iR = i; });
    const run = (a, b) => { const r = []; for (let i = a; ; i = (i + 1) % N) { r.push(i); if (i === b) break; } return r; };
    const A = run(iL, iR), B = run(iR, iL);
    const dm = (X) => R[X[Math.floor(X.length / 2)]].d;
    return dm(A) >= dm(B) ? { front: A, back: B, iL, iR } : { front: B, back: A, iL, iR };
  }
  function bodyGrad(p, ctx, x0, x1) {
    const id = ctx.id + '-body', c = p.fill;
    ctx.defs.push(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${f(x0)}" y1="0" x2="${f(x1)}" y2="0"><stop offset="0" stop-color="${PD.shade(c, -0.45)}"/><stop offset="0.32" stop-color="${PD.shade(c, 0.55)}"/><stop offset="0.6" stop-color="${c}"/><stop offset="1" stop-color="${PD.shade(c, -0.5)}"/></linearGradient>`);
    return `fill="url(#${id})"`;
  }
  PD.register({
    type: 'cylinder', name: '圆柱/圆锥/圆台',
    defaults: Object.assign({}, D3, { r: 45, h: 120, top: 1, axisLine: false }),
    fields: [
      { k: 'r', t: 'num', l: '底面半径' }, { k: 'h', t: 'num', l: '高' },
      { k: 'top', t: 'range', l: '顶面比例(0=圆锥)', min: 0, max: 1.5, step: 0.05 },
      { k: 'axisLine', t: 'bool', l: '画中心轴(点划线)' }, ...solidFields,
    ],
    render(p, ctx) {
      const P = PD.projector(p), r1 = +p.r, r2 = r1 * Math.max(0, +p.top), h = +p.h;
      const { N, bot, top } = capRings(p, P, r1, Math.max(r2, 0.001), h);
      const cB = P(0, -h / 2, 0), cT = P(0, h / 2, 0);
      // 判断从上看还是从下看
      let iN = 0, iF = 0; bot.forEach((q, i) => { if (q.d > bot[iN].d) iN = i; if (q.d < bot[iF].d) iF = i; });
      const fromTop = bot[iN].y >= bot[iF].y;
      const near = fromTop ? top : bot, far = fromTop ? bot : top; // near: 完整可见的端面
      const A = arcsOf(far, N), B = arcsOf(near, N);
      const iso = r2 < 0.01;
      let fillB, fillCap;
      if (p.shading) { fillB = bodyGrad(p, ctx, Math.min(far[A.iL].x, near[B.iL].x), Math.max(far[A.iR].x, near[B.iR].x)); fillCap = `fill="${PD.shade(p.fill, fromTop ? 0.3 : -0.25)}"`; }
      else { fillB = PD.fillAttr(p, ctx); fillCap = fillB; }
      const L1 = [far[A.iL], near[B.iL]], R1 = [far[A.iR], near[B.iR]];
      let o = '';
      // 侧面（远端面前半弧 + 两条轮廓线 + 近端面）
      if (fillB !== 'fill="none"') {
        const front = A.front[0] === A.iL ? A.front : A.front.slice().reverse(); // 从左到右
        const nearArc = B.back[0] === B.iR ? B.back : B.back.slice().reverse(); // 从右到左（近端面后半弧）
        o += `<path d="${ringPath(far, front)}${iso ? `L${f((fromTop ? cT : cB).x)},${f((fromTop ? cT : cB).y)}` : nearArc.map((i) => 'L' + f(near[i].x) + ',' + f(near[i].y)).join('')}Z" ${fillB} stroke="none"/>`;
      }
      // 隐藏的后半弧
      const hid = p.hidden || 'dash';
      if (hid !== 'none') o += `<path d="${ringPath(far, A.back)}" fill="none" ${hid === 'dash' ? dashed(p) : S(p)}/>`;
      o += `<path d="${ringPath(far, A.front)}" fill="none" ${S(p)}/>`;
      if (iso) {
        const apex = fromTop ? cT : cB;
        o += `<path d="M${f(far[A.iL].x)},${f(far[A.iL].y)}L${f(apex.x)},${f(apex.y)}L${f(far[A.iR].x)},${f(far[A.iR].y)}" fill="none" ${S(p)}/>`;
      } else {
        o += `<path d="M${f(L1[0].x)},${f(L1[0].y)}L${f(L1[1].x)},${f(L1[1].y)}M${f(R1[0].x)},${f(R1[0].y)}L${f(R1[1].x)},${f(R1[1].y)}" fill="none" ${S(p)}/>`;
        const all = [...Array(N).keys()];
        o += `<path d="${ringPath(near, all, true)}" ${fillCap} ${S(p)}/>`;
      }
      if (p.axisLine) o += `<line x1="${f(cB.x)}" y1="${f(cB.y + (cB.y > cT.y ? 15 : -15))}" x2="${f(cT.x)}" y2="${f(cT.y + (cT.y > cB.y ? 15 : -15))}" ${S(p, { dash: 'dashdot', sw: 0.8 })}/>`;
      return o;
    },
  });

  /* ===== 球 ===== */
  PD.register({
    type: 'sphere', name: '球体',
    defaults: { r: 55, eq: true, tilt: 18, shading: true, fill: '#9fb4cc', center: false },
    fields: [
      { k: 'r', t: 'num', l: '半径' }, { k: 'eq', t: 'bool', l: '赤道线(后半虚线)' }, { k: 'tilt', t: 'range', l: '赤道倾斜', min: 0, max: 60, step: 1 },
      { k: 'center', t: 'bool', l: '球心' }, { k: 'shading', t: 'bool', l: '光影着色' },
    ],
    render(p, ctx) {
      const r = +p.r, ry = r * Math.sin((p.tilt * Math.PI) / 180);
      const fa = p.shading ? PD.fillAttr(Object.assign({}, p, { fillMode: 'radial', fill2: PD.shade(p.fill, 0.85) }), ctx) : PD.fillAttr(p, ctx);
      let o = `<circle r="${f(r)}" ${fa} ${S(p, { dash: 'solid' })}/>`;
      if (p.eq) {
        o += `<path d="M${f(-r)},0A${f(r)},${f(ry)} 0 0 1 ${f(r)},0" fill="none" ${dashed(p)}/>`;
        o += `<path d="M${f(-r)},0A${f(r)},${f(ry)} 0 0 0 ${f(r)},0" fill="none" ${S(p, { dash: 'solid' })}/>`;
      }
      if (p.center) o += `<circle r="2.2" fill="${p.stroke}"/>`;
      return o;
    },
  });

  /* ===== 平面（平行四边形） ===== */
  PD.register({
    type: 'plane3d', name: '平面(3D)',
    defaults: Object.assign({}, PD.projDef, { w: 200, d: 140, n: 0, label: '', lsize: 17, fillMode: 'solid', fill: '#e3ecf6', vertical: false }),
    fields: [
      ...PD.projFields, { k: 'w', t: 'num', l: '宽 (X)' }, { k: 'd', t: 'num', l: '深 (Z)' }, { k: 'vertical', t: 'bool', l: '竖直平面(XY)' },
      { k: 'n', t: 'num', l: '网格线数' }, { k: 'label', t: 'text', l: '标签' }, { k: 'lsize', t: 'num', l: '标签字号' },
    ],
    render(p, ctx) {
      const P = PD.projector(p), a = p.w / 2, c = p.d / 2;
      const Q = (x, z) => (p.vertical ? P(x, z, 0) : P(x, 0, z));
      const C = [Q(-a, -c), Q(a, -c), Q(a, c), Q(-a, c)];
      let o = `<polygon points="${C.map((q) => f(q.x) + ',' + f(q.y)).join(' ')}" ${PD.fillAttr(p, ctx)} ${S(p)}/>`;
      const n = Math.max(0, Math.round(p.n));
      if (n) {
        let d = '';
        for (let i = 1; i <= n; i++) {
          const t = -1 + (2 * i) / (n + 1);
          const A = Q(t * a, -c), B = Q(t * a, c), E = Q(-a, t * c), G = Q(a, t * c);
          d += `M${f(A.x)},${f(A.y)}L${f(B.x)},${f(B.y)}M${f(E.x)},${f(E.y)}L${f(G.x)},${f(G.y)}`;
        }
        o += `<path d="${d}" fill="none" ${S(p, { sw: 0.6, dash: 'solid' })}/>`;
      }
      if (p.label) o += T(ctx, p.label, C[1].x - 14, C[1].y + 16, { size: p.lsize, color: p.stroke });
      return o;
    },
  });

  /* ---------- 预设 ---------- */
  PD.preset(CAT, '三维坐标系', 'axes3d', {});
  PD.preset(CAT, '坐标系+点投影', 'axes3d', { pts: '3,2,2,P', neg: true });
  PD.preset(CAT, '坐标系+矢量', 'axes3d', { proj: 'ortho', az: 35, el: 20, vecs: '3,2,2,\\bf{r}', pts: '3,2,2,' });
  PD.preset(CAT, '长方体(线框)', 'cuboid', {});
  PD.preset(CAT, '长方体(光影)', 'cuboid', { proj: 'ortho', az: 30, el: 22, shading: true, fill: '#b8c7da', hidden: 'none' });
  PD.preset(CAT, '透视长方体', 'cuboid', { proj: 'persp', az: 30, el: 22, fd: 400, shading: true, fill: '#d6c7a8', hidden: 'none' });
  PD.preset(CAT, '三棱镜', 'prism', { vert: true, spin: 270, h: 110, r: 50, proj: 'ortho', az: 40, el: 18, shading: true, fill: '#cfe3f0', hidden: 'none' });
  PD.preset(CAT, '正六棱柱', 'prism', { n: 6, r: 45, h: 90 });
  PD.preset(CAT, '四棱锥', 'prism', { n: 4, top: 0, spin: 45 });
  PD.preset(CAT, '圆柱(线框)', 'cylinder', {});
  PD.preset(CAT, '圆柱(光影)', 'cylinder', { shading: true, fill: '#a9b8c9', proj: 'ortho', az: 0, el: 22, hidden: 'none' });
  PD.preset(CAT, '圆锥', 'cylinder', { top: 0, axisLine: true });
  PD.preset(CAT, '球体(光影)', 'sphere', {});
  PD.preset(CAT, '球体(线框)', 'sphere', { shading: false, fillMode: 'none', center: true });
  PD.preset(CAT, '水平面', 'plane3d', {});
  PD.preset(CAT, '竖直平面(网格)', 'plane3d', { vertical: true, n: 4, fillMode: 'none' });
})();
