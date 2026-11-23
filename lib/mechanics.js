/* 第二册 · 力与运动  +  天体与航天（依赖 lab.js）
   火柴人 · 滑轮 · 小车 · 汽车 · 降落伞 · 橡皮泥 · 抛体轨迹(可绑定) · 弹簧 · 斜面 · 杠杆 · 砝码 · 受力图 · 纸带 · 光闸 · 单摆
   星球 · 航天器(可绑定星球显示轨道) */
(function () {
  'use strict';
  const f = PD.f, S = PD.strokeAttr, T = PD.tex, L = PD.lab, pt = L.pt, clamp = L.clamp;
  const CAT = 'DSE-物理/力与运动', CAT2 = 'DSE-物理/力与运动/天体与航天';
  const D2R = Math.PI / 180, R2D = 180 / Math.PI;
  const sd = (p) => S(p, { dash: 'solid' });
  const normA = (a) => { a = ((a % 360) + 540) % 360 - 180; return Math.round(a * 10) / 10; };
  const up = (ctx) => Object.assign({}, ctx); // 文字保持水平（PD.tex 已处理）

  /* ================= 共享辅助（挂到 PD.lab 供后续章节用） ================= */
  // 带阴影线的直线；side=1 阴影在行进方向右手侧（水平从左到右时为下方）
  L.hatchLine = (p, x1, y1, x2, y2, side = 1, gap = 8, len = 8) => {
    const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l, nx = -uy * side, ny = ux * side;
    let d = '';
    for (let s = gap / 2; s <= l; s += gap) d += `M${pt(x1 + ux * s, y1 + uy * s)}l${pt(nx * len - ux * len * 0.75, ny * len - uy * len * 0.75)}`;
    return `<path d="${d}" fill="none" ${S(p, { dash: 'solid', sw: Math.max(0.7, (+p.sw || 1.5) * 0.55) })}/><line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" ${sd(p)}/>`;
  };
  // 弹簧路径：从 (x0,0) 沿 +x，总长 len
  L.springPath = (x0, len, n, amp, style, lead) => {
    n = Math.max(1, Math.round(+n || 8)); lead = lead ?? Math.min(12, len * 0.12);
    const body = Math.max(2, len - 2 * lead), xa = x0 + lead;
    let d = `M${pt(x0, 0)}H${f(xa)}`;
    if (style === 'coil') {
      const N = n * 24, k = (1.5 * body) / (2 * Math.PI * n);
      for (let i = 0; i <= N; i++) { const s = i / N, th = 2 * Math.PI * n * s; d += `L${pt(xa + body * s - k * Math.sin(th), -amp * Math.cos(th))}`; }
    } else {
      for (let i = 0; i < 2 * n; i++) d += `L${pt(xa + (body * (i + 0.5)) / (2 * n), i % 2 ? amp : -amp)}`;
      d += `L${pt(xa + body, 0)}`;
    }
    return d + `L${pt(x0 + len, 0)}`;
  };
  // 槽码挂钩：顶部挂点 (x,y)
  L.hanger = (p, ctx, x, y, n, label, w, lsize) => {
    n = Math.max(1, Math.round(+n || 3)); w = +w || 26;
    const dh = 6, top = y + 7, rodL = 8 + n * dh + 3, th = L.thin(p, 0.7);
    let o = `<circle cx="${f(x)}" cy="${f(y + 3.5)}" r="3.5" fill="none" ${th}/><line x1="${f(x)}" y1="${f(top)}" x2="${f(x)}" y2="${f(top + rodL)}" ${sd(p)}/>`;
    for (let i = 0; i < n; i++) o += `<rect x="${f(x - w / 2)}" y="${f(top + rodL - (i + 1) * dh)}" width="${f(w)}" height="${f(dh - 0.8)}" rx="1.5" fill="#a3a3a3" ${th}/>`;
    o += `<rect x="${f(x - w / 2 - 2)}" y="${f(top + rodL)}" width="${f(w + 4)}" height="3" fill="#555555" ${th}/>`;
    if (label) o += T(ctx, label, x + w / 2 + 7, top + rodL - (n * dh) / 2, { size: lsize || 15, anchor: 'start', italic: false, color: p.stroke });
    return o;
  };
  // 方块（可旋转，文字保持水平）
  L.block = (p, ctx, cx, cy, w, h, rot, label, fill, lsize) =>
    `<g transform="translate(${pt(cx, cy)}) rotate(${f(rot || 0)})"><rect x="${f(-w / 2)}" y="${f(-h / 2)}" width="${f(w)}" height="${f(h)}" fill="${fill || '#e6e6e6'}" ${sd(p)}/></g>` +
    (label ? T(ctx, label, cx, cy, { size: lsize || 16, color: p.stroke }) : '');
  // 宇航员头盔（窗口里的人）
  L.astroHead = (p, cx, cy, r) =>
    `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="#ffffff" ${L.thin(p, 0.8)}/><path d="M${pt(cx - r * 0.62, cy - r * 0.05)}Q${pt(cx, cy - r * 0.55)} ${pt(cx + r * 0.62, cy - r * 0.05)}Q${pt(cx + r * 0.6, cy + r * 0.45)} ${pt(cx, cy + r * 0.45)}Q${pt(cx - r * 0.6, cy + r * 0.45)} ${pt(cx - r * 0.62, cy - r * 0.05)}Z" fill="#3d4f66"/><path d="M${pt(cx - r * 0.3, cy + r * 0.05)}q${f(r * 0.12)},${f(-r * 0.15)} ${f(r * 0.3)},${f(-r * 0.12)}" fill="none" stroke="#ffffff" stroke-width="${f(Math.max(0.8, r * 0.1))}" stroke-linecap="round"/>`;
  const arrow = (p, x0, y0, x1, y1, o = {}) => {
    const l = Math.hypot(x1 - x0, y1 - y0); if (l < 1) return '';
    const ux = (x1 - x0) / l, uy = (y1 - y0) / l, ah = o.ah || PD.ahSize(p), sw = o.sw || +p.sw || 1.5, col = o.color || p.stroke;
    return `<line x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1 - ux * ah * 0.7)}" y2="${f(y1 - uy * ah * 0.7)}" ${S(p, { color: col, sw, dash: o.dash || 'solid' })}/>` + PD.arrowHead(x1, y1, Math.atan2(uy, ux), ah, 'tri', col, sw);
  };
  L.arrow = arrow;

  /* ================= 火柴人（可摆姿势） =================
     角度单位：度；0 = 竖直（躯干向上/四肢向下），正 = 顺时针。手臂随躯干转，前臂/小腿相对上一节。 */
  const V = (A) => { const r = A * D2R; return [-Math.sin(r), Math.cos(r)]; };
  const angOf = (v) => Math.atan2(-v[0], v[1]) * R2D;
  const add = (a, v, k) => [a[0] + v[0] * k, a[1] + v[1] * k];
  function stickGeo(p) {
    const s = +p.size || 120, t = +p.t || 0, tv = [Math.sin(t * D2R), -Math.cos(t * D2R)];
    const Tl = 0.32 * s, hr = 0.085 * s, ua = 0.165 * s, fa = 0.155 * s, th = 0.225 * s, sh = 0.225 * s;
    const hip = [0, 0], neck = add(hip, tv, Tl), sho = add(hip, tv, Tl * 0.9), head = add(hip, tv, Tl + 0.03 * s + hr);
    const e1 = add(sho, V(t + +p.ua1), ua), h1 = add(e1, V(t + +p.ua1 + +p.fa1), fa);
    const e2 = add(sho, V(t + +p.ua2), ua), h2 = add(e2, V(t + +p.ua2 + +p.fa2), fa);
    const k1 = add(hip, V(+p.th1), th), f1 = add(k1, V(+p.th1 + +p.sh1), sh);
    const k2 = add(hip, V(+p.th2), th), f2 = add(k2, V(+p.th2 + +p.sh2), sh);
    return { s, t, hip, neck, sho, head, hr, e1, h1, e2, h2, k1, f1, k2, f2 };
  }
  function drawStick(p, g, dx = 0, dy = 0) {
    const bold = p.style === 'bold', w = bold ? g.s * 0.07 : +p.sw || 2.5, col = p.stroke || '#000';
    const P = (q) => pt(q[0] + dx, q[1] + dy), back = p.backGray ? '#8a8a8a' : col;
    const chain = (a, c) => `<polyline points="${a.map(P).join(' ')}" fill="none" stroke="${c}" stroke-width="${f(w)}" stroke-linecap="round" stroke-linejoin="round"/>`;
    let o = '';
    if (p.helmet) { const bv = [g.neck[0] - g.hip[0], g.neck[1] - g.hip[1]], ang = Math.atan2(bv[1], bv[0]) * R2D + 90, c = [(g.hip[0] + g.neck[0]) / 2, (g.hip[1] + g.neck[1]) / 2];
      o += `<g transform="translate(${P(c)}) rotate(${f(ang)})"><rect x="${f(-g.s * 0.13)}" y="${f(-g.s * 0.12)}" width="${f(g.s * 0.1)}" height="${f(g.s * 0.22)}" rx="3" fill="#cfd5dc" ${L.thin(p, 0.7)}/></g>`; }
    o += chain([g.h2, g.e2, g.sho], back) + chain([g.f2, g.k2, g.hip], back) + chain([g.hip, g.neck], col) + chain([g.f1, g.k1, g.hip], col) + chain([g.h1, g.e1, g.sho], col);
    if (p.feet) { const fl = g.s * 0.07, sg = 1; [[g.f2, back], [g.f1, col]].forEach(([q, c]) => (o += `<line x1="${f(q[0] + dx)}" y1="${f(q[1] + dy)}" x2="${f(q[0] + dx + fl * sg)}" y2="${f(q[1] + dy)}" stroke="${c}" stroke-width="${f(w)}" stroke-linecap="round"/>`)); }
    const hr = bold ? g.hr * 1.1 : g.hr, solid = bold || p.head === 'solid';
    o += `<circle cx="${f(g.head[0] + dx)}" cy="${f(g.head[1] + dy)}" r="${f(hr)}" fill="${solid ? col : '#ffffff'}" stroke="${col}" stroke-width="${f(bold ? 1 : w)}"/>`;
    if (p.helmet) o += `<circle cx="${f(g.head[0] + dx)}" cy="${f(g.head[1] + dy)}" r="${f(hr * 1.6)}" fill="#dbe9f6" fill-opacity="0.35" stroke="${col}" stroke-width="${f(Math.max(1, w * 0.55))}"/>`;
    if (p.joints) [g.e1, g.h1, g.e2, g.h2, g.k1, g.f1, g.k2, g.f2, g.sho, g.hip].forEach((q) => (o += `<circle cx="${f(q[0] + dx)}" cy="${f(q[1] + dy)}" r="${f(w * 0.75)}" fill="#ffffff" stroke="${col}" stroke-width="1"/>`));
    return o;
  }
  const POSE = (t, ua1, fa1, ua2, fa2, th1, sh1, th2, sh2) => ({ t, ua1, fa1, ua2, fa2, th1, sh1, th2, sh2 });
  PD.register({
    type: 'stick', name: '火柴人(拖关节摆姿势)',
    defaults: Object.assign({ size: 130, style: 'line', head: 'hollow', joints: false, feet: true, backGray: false, helmet: false, sw: 2.6 }, POSE(0, 15, 5, -15, -5, 8, 0, -8, 0)),
    getHandles: (p) => { const g = stickGeo(p); return [g.head, g.e1, g.h1, g.e2, g.h2, g.k1, g.f1, g.k2, g.f2]; },
    setHandle(p, i, x, y) {
      const g = stickGeo(p), q = [x, y], d = (a, b) => [b[0] - a[0], b[1] - a[1]];
      switch (i) {
        case 0: { const v = d(g.hip, q); p.t = normA(Math.atan2(v[0], -v[1]) * R2D); break; }
        case 1: p.ua1 = normA(angOf(d(g.sho, q)) - g.t); break;
        case 2: p.fa1 = normA(angOf(d(g.e1, q)) - g.t - +p.ua1); break;
        case 3: p.ua2 = normA(angOf(d(g.sho, q)) - g.t); break;
        case 4: p.fa2 = normA(angOf(d(g.e2, q)) - g.t - +p.ua2); break;
        case 5: p.th1 = normA(angOf(d(g.hip, q))); break;
        case 6: p.sh1 = normA(angOf(d(g.k1, q)) - +p.th1); break;
        case 7: p.th2 = normA(angOf(d(g.hip, q))); break;
        case 8: p.sh2 = normA(angOf(d(g.k2, q)) - +p.th2); break;
      }
    },
    fields: [
      { k: 'size', t: 'num', l: '身高' }, { k: 'style', t: 'sel', l: '样式', o: [['line', '细线'], ['bold', '粗体剪影']] },
      { k: 'head', t: 'sel', l: '头部', o: [['hollow', '空心'], ['solid', '实心']], when: (p) => p.style !== 'bold' },
      { k: 'feet', t: 'bool', l: '画脚(朝右，用翻转改朝向)' }, { k: 'backGray', t: 'bool', l: '后侧四肢变灰(分清前后)' }, { k: 'joints', t: 'bool', l: '显示关节点' }, { k: 'helmet', t: 'bool', l: '宇航员头盔+背包' },
      { k: 't', t: 'num', l: '身体倾斜°', step: 5 },
      { k: 'ua1', t: 'num', l: '前手 上臂°', step: 5 }, { k: 'fa1', t: 'num', l: '前手 前臂°(相对)', step: 5 },
      { k: 'ua2', t: 'num', l: '后手 上臂°', step: 5 }, { k: 'fa2', t: 'num', l: '后手 前臂°(相对)', step: 5 },
      { k: 'th1', t: 'num', l: '前腿 大腿°', step: 5 }, { k: 'sh1', t: 'num', l: '前腿 小腿°(相对)', step: 5 },
      { k: 'th2', t: 'num', l: '后腿 大腿°', step: 5 }, { k: 'sh2', t: 'num', l: '后腿 小腿°(相对)', step: 5 },
    ],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p) { return drawStick(p, stickGeo(p)); },
  });

  /* ================= 滑轮 ================= */
  const LOADS = [['none', '无'], ['block', '方块'], ['mass', '槽码']];
  PD.register({
    type: 'pulley', name: '滑轮(定/动)',
    defaults: { r: 22, mount: 'table', gap: 30, wrap: 'top', angA: 180, LA: 140, loadA: 'block', labA: 'A', angB: -90, LB: 120, loadB: 'block', labB: 'B', loadC: 'none', labC: '',
      bs: 36, tableL: 260, legH: 90, fill: '#dcdcdc', shading: true, lsize: 16 },
    fields: [
      { k: 'r', t: 'num', l: '滑轮半径' },
      { k: 'mount', t: 'sel', l: '固定方式', o: [['table', '桌边'], ['ceiling', '天花板'], ['wallR', '右侧墙'], ['wallL', '左侧墙'], ['hook', '动滑轮(下挂重物)'], ['none', '无']], rebuild: true },
      { k: 'gap', t: 'num', l: '支架长度', when: (p) => p.mount !== 'table' && p.mount !== 'none' },
      { k: 'tableL', t: 'num', l: '桌面长度', when: (p) => p.mount === 'table' }, { k: 'legH', t: 'num', l: '桌脚长度', when: (p) => p.mount === 'table' },
      { k: 'wrap', t: 'sel', l: '绳子绕过', o: [['top', '上方(定滑轮)'], ['bottom', '下方(动滑轮)']] },
      { k: 'angA', t: 'num', l: '绳 A 方向°(0右 90上 180左 -90下)', step: 15 }, { k: 'LA', t: 'num', l: '绳 A 长度' },
      { k: 'loadA', t: 'sel', l: '绳 A 末端', o: LOADS }, { k: 'labA', t: 'text', l: 'A 标签' },
      { k: 'angB', t: 'num', l: '绳 B 方向°', step: 15 }, { k: 'LB', t: 'num', l: '绳 B 长度' },
      { k: 'loadB', t: 'sel', l: '绳 B 末端', o: LOADS }, { k: 'labB', t: 'text', l: 'B 标签' },
      { k: 'loadC', t: 'sel', l: '轮轴下挂', o: LOADS, when: (p) => p.mount === 'hook' }, { k: 'labC', t: 'text', l: '下挂标签', when: (p) => p.mount === 'hook' },
      { k: 'bs', t: 'num', l: '方块大小' }, { k: 'lsize', t: 'num', l: '标签字号' }, { k: 'fill', t: 'color', l: '滑轮颜色' }, { k: 'shading', t: 'bool', l: '金属质感' },
    ],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const r = +p.r, bs = +p.bs, top = p.wrap !== 'bottom', U = (a) => [Math.cos(a * D2R), -Math.sin(a * D2R)];
      const uA = U(+p.angA), uB = U(+p.angB);
      const nA = top ? [-uA[1], uA[0]] : [uA[1], -uA[0]], nB = top ? [uB[1], -uB[0]] : [-uB[1], uB[0]];
      const tA = [nA[0] * r, nA[1] * r], tB = [nB[0] * r, nB[1] * r], eA = add(tA, uA, +p.LA), eB = add(tB, uB, +p.LB);
      const fA = Math.atan2(nA[1], nA[0]), fB = Math.atan2(nB[1], nB[0]), TAU = 2 * Math.PI;
      const span = top ? (((fB - fA) % TAU) + TAU) % TAU : (((fA - fB) % TAU) + TAU) % TAU;
      let o = '';
      // 支架 / 安装
      const g = +p.gap;
      if (p.mount === 'ceiling') { o += `<rect x="-3" y="${f(-(r + g))}" width="6" height="${f(r + g)}" fill="#9a9a9a" ${L.thin(p, 0.7)}/>` + L.hatchLine(p, -2.2 * r, -(r + g), 2.2 * r, -(r + g), -1); }
      else if (p.mount === 'wallR' || p.mount === 'wallL') {
        const sg = p.mount === 'wallR' ? 1 : -1, wx = sg * (r + g), wy = -r * 1.3;
        o += `<path d="M0,0L${pt(wx, wy)}" stroke="#8a8a8a" stroke-width="6" stroke-linecap="round"/><path d="M0,0L${pt(wx, wy)}" stroke="${p.stroke}" stroke-width="0.8" fill="none"/>`;
        o += sg > 0 ? L.hatchLine(p, wx, -r * 3, wx, r * 1.5, -1) : L.hatchLine(p, wx, r * 1.5, wx, -r * 3, -1);
      } else if (p.mount === 'table') {
        const ty = -r + (p.loadA === 'block' ? bs / 2 : 0), cx = -(r + 6), th = 12;
        o += `<rect x="${f(cx - +p.tableL)}" y="${f(ty)}" width="${f(+p.tableL)}" height="${th}" ${PD.fillAttr({ fillMode: 'solid', fill: '#efe6d5' }, ctx)} ${sd(p)}/>`;
        o += `<rect x="${f(cx - 22)}" y="${f(ty + th)}" width="12" height="${f(+p.legH)}" fill="#efe6d5" ${sd(p)}/>`;
        o += `<path d="M${pt(cx + 2, ty + 2)}L0,0" stroke="#8a8a8a" stroke-width="6" stroke-linecap="round"/><rect x="${f(cx - 8)}" y="${f(ty - 4)}" width="12" height="${f(th + 10)}" rx="2" fill="#7a7a7a" ${L.thin(p, 0.7)}/>`;
      } else if (p.mount === 'hook') {
        o += `<path d="M${pt(-r * 0.35, 0)}L0,${f(r + 12)}L${pt(r * 0.35, 0)}" fill="none" stroke="#8a8a8a" stroke-width="3"/>`;
      }
      // 轮
      const wf = p.shading ? PD.fillAttr({ fillMode: 'radial', fill: p.fill, fill2: '#ffffff' }, ctx) : `fill="${p.fill}"`;
      o += `<circle r="${f(r)}" ${wf} ${sd(p)}/><circle r="${f(r * 0.72)}" fill="none" ${L.thin(p, 0.45)}/>`;
      // 绳
      o += `<path d="M${pt(eA[0], eA[1])}L${pt(tA[0], tA[1])}A${f(r)},${f(r)} 0 ${span > Math.PI ? 1 : 0} ${top ? 1 : 0} ${pt(tB[0], tB[1])}L${pt(eB[0], eB[1])}" fill="none" ${S(p, { dash: 'solid', sw: Math.max(1.2, +p.sw || 1.5) })}/>`;
      o += `<circle r="${f(Math.max(2.5, r * 0.16))}" fill="#555555" ${L.thin(p, 0.5)}/>`;
      // 末端负载
      const load = (kind, e, u, lab) => {
        if (kind === 'block') {
          const hang = Math.abs(u[1]) >= Math.abs(u[0]), ad = Math.atan2(u[1], u[0]) * R2D, rot = hang ? ad - 90 : ad - (u[0] < 0 ? 180 : 0);
          return L.block(p, ctx, e[0] + (u[0] * bs) / 2, e[1] + (u[1] * bs) / 2, bs, bs, rot, lab, '#e6e6e6', p.lsize);
        }
        if (kind === 'mass') return L.hanger(p, ctx, e[0], e[1], 3, lab, bs * 0.75, p.lsize);
        return lab ? T(ctx, lab, e[0] + u[0] * 12, e[1] + u[1] * 12, { size: p.lsize, color: p.stroke }) : '';
      };
      o += load(p.loadA, eA, uA, p.labA) + load(p.loadB, eB, uB, p.labB);
      if (p.mount === 'hook' && p.loadC !== 'none') o += load(p.loadC, [0, r + 12], [0, 1], p.labC);
      return o;
    },
  });

  /* ================= 小车 ================= */
  PD.register({
    type: 'cart', name: '小车(挡板/弹簧)',
    defaults: { w: 150, h: 26, wr: 12, walls: 'none', wallH: 30, wallT: 6, plunger: 'none', label: '', lsize: 16, fillMode: 'solid', fill: '#d9d9d9', wc: '#555555' },
    handles: [['w', 'zero', 0.5]],
    fields: [
      { k: 'w', t: 'num', l: '长' }, { k: 'h', t: 'num', l: '车身厚' }, { k: 'wr', t: 'num', l: '轮半径' },
      { k: 'walls', t: 'sel', l: '挡板', o: [['none', '无'], ['both', '两端'], ['left', '左端'], ['right', '右端']] }, { k: 'wallH', t: 'num', l: '挡板高' }, { k: 'wallT', t: 'num', l: '挡板厚' },
      { k: 'plunger', t: 'sel', l: '弹簧缓冲', o: [['none', '无'], ['left', '左端'], ['right', '右端'], ['both', '两端']] },
      { k: 'label', t: 'text', l: '标签' }, { k: 'lsize', t: 'num', l: '标签字号' }, { k: 'wc', t: 'color', l: '车轮颜色' },
    ],
    render(p, ctx) {
      const w = +p.w, h = +p.h, wr = +p.wr, yb = -wr * 1.15, yt = yb - h, wx = w / 2 - wr * 1.6;
      let o = `<rect x="${f(-w / 2)}" y="${f(yt)}" width="${f(w)}" height="${f(h)}" rx="2" ${PD.fillAttr(p, ctx)} ${S(p)}/>`;
      const wall = (x) => `<rect x="${f(x)}" y="${f(yt - +p.wallH)}" width="${f(+p.wallT)}" height="${f(+p.wallH)}" ${PD.fillAttr(p, ctx)} ${S(p)}/>`;
      if (p.walls === 'both' || p.walls === 'left') o += wall(-w / 2);
      if (p.walls === 'both' || p.walls === 'right') o += wall(w / 2 - +p.wallT);
      const plg = (sg) => { const x0 = sg * w / 2, len = 30, y = yt + h / 2; return `<g transform="translate(${pt(x0, y)}) scale(${sg},1)"><path d="${L.springPath(0, len, 4, 5, 'zig', 4)}" fill="none" ${sd(p)}/><rect x="${f(len)}" y="-9" width="4" height="18" fill="#888888" ${L.thin(p, 0.7)}/></g>`; };
      if (p.plunger === 'right' || p.plunger === 'both') o += plg(1);
      if (p.plunger === 'left' || p.plunger === 'both') o += plg(-1);
      [-wx, wx].forEach((x) => (o += `<circle cx="${f(x)}" cy="${f(-wr)}" r="${f(wr)}" fill="${p.wc}" ${sd(p)}/><circle cx="${f(x)}" cy="${f(-wr)}" r="${f(wr * 0.3)}" fill="#ffffff" ${L.thin(p, 0.6)}/>`));
      if (p.label) o += T(ctx, p.label, 0, yt + h / 2, { size: p.lsize, color: p.stroke });
      return o;
    },
  });

  /* ================= 汽车(侧视) ================= */
  PD.register({
    type: 'car', name: '汽车(侧视)',
    defaults: { w: 180, h: 66, fillMode: 'solid', fill: '#b8c7da', wc: '#444444', label: '', lsize: 16 },
    handles: [['w', 'h', 0.5, -1]],
    fields: [{ k: 'w', t: 'num', l: '长' }, { k: 'h', t: 'num', l: '高' }, { k: 'wc', t: 'color', l: '车轮颜色' }, { k: 'label', t: 'text', l: '标签' }, { k: 'lsize', t: 'num', l: '标签字号' }],
    render(p, ctx) {
      const w = +p.w, h = +p.h, Q = (a, b) => pt(a * w, -b * h);
      const body = [[-0.5, 0.2], [-0.5, 0.5], [-0.44, 0.58], [-0.2, 0.62], [-0.1, 1], [0.2, 1], [0.32, 0.64], [0.47, 0.57], [0.5, 0.46], [0.5, 0.2]];
      let o = `<path d="M${body.map((q) => Q(q[0], q[1])).join('L')}Z" ${PD.fillAttr(p, ctx)} ${S(p)}/>`;
      o += `<path d="M${Q(-0.14, 0.64)}L${Q(-0.07, 0.93)}L${Q(0.03, 0.93)}L${Q(0.03, 0.64)}ZM${Q(0.07, 0.64)}L${Q(0.07, 0.93)}L${Q(0.18, 0.93)}L${Q(0.27, 0.64)}Z" fill="#ffffff" ${L.thin(p, 0.7)}/>`;
      const wr = 0.2 * h;
      [-0.3, 0.3].forEach((x) => (o += `<circle cx="${f(x * w)}" cy="${f(-wr)}" r="${f(wr)}" fill="${p.wc}" ${sd(p)}/><circle cx="${f(x * w)}" cy="${f(-wr)}" r="${f(wr * 0.4)}" fill="#cccccc" ${L.thin(p, 0.6)}/>`));
      if (p.label) o += T(ctx, p.label, 0, -0.38 * h, { size: p.lsize, color: p.stroke, halo: true });
      return o;
    },
  });

  /* ================= 降落伞 ================= */
  PD.register({
    type: 'parachute', name: '降落伞',
    defaults: { w: 150, ch: 55, Lh: 95, n: 6, payload: 'person', ps: 80, stripes: true, fill: '#e8892b', fill2: '#ffffff', label: '', lsize: 16 },
    handles: [['zero', 'Lh', 1, -1]],
    fields: [
      { k: 'w', t: 'num', l: '伞宽' }, { k: 'ch', t: 'num', l: '伞高' }, { k: 'Lh', t: 'num', l: '伞绳长' }, { k: 'n', t: 'num', l: '伞片数', min: 2 },
      { k: 'payload', t: 'sel', l: '下挂', o: [['person', '人'], ['box', '箱子'], ['none', '无']] }, { k: 'ps', t: 'num', l: '人/箱大小' },
      { k: 'stripes', t: 'bool', l: '相间条纹' }, { k: 'fill', t: 'color', l: '伞颜色' }, { k: 'fill2', t: 'color', l: '条纹颜色' },
      { k: 'label', t: 'text', l: '标签' }, { k: 'lsize', t: 'num', l: '标签字号' },
    ],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const w = +p.w, ch = +p.ch, Lh = +p.Lh, n = Math.max(2, Math.round(+p.n)), yb = -Lh;
      let payload = '', hands = [[-3, 0], [3, 0]];
      if (p.payload === 'person') {
        const sp = Object.assign({}, p, POSE(0, 148, 12, -148, -12, 6, 0, -6, 0), { size: +p.ps, style: 'line', head: 'hollow', feet: false, joints: false, helmet: false, backGray: false, sw: Math.max(1.6, +p.sw || 1.5) });
        const g = stickGeo(sp), dy = -(g.h1[1] + g.h2[1]) / 2 + 2;
        hands = [[g.h2[0], g.h2[1] + dy], [g.h1[0], g.h1[1] + dy]].sort((a, b) => a[0] - b[0]);
        payload = drawStick(sp, g, 0, dy);
      } else if (p.payload === 'box') {
        const b = +p.ps * 0.45; payload = `<rect x="${f(-b / 2)}" y="8" width="${f(b)}" height="${f(b * 0.8)}" fill="#c8a878" ${sd(p)}/><path d="M${pt(-b / 2, 8)}L0,0L${pt(b / 2, 8)}" fill="none" ${L.thin(p, 0.7)}/>`;
        hands = [[0, 0], [0, 0]];
      }
      let o = '';
      const ax = []; for (let i = 0; i <= n; i++) ax.push(-w / 2 + (w * i) / n);
      ax.forEach((x) => { const hnd = x < 0 ? hands[0] : hands[1]; o += `<line x1="${f(x)}" y1="${f(yb)}" x2="${f(hnd[0])}" y2="${f(hnd[1])}" ${L.thin(p, 0.5)}/>`; });
      const dome = `M${pt(-w / 2, yb)}C${pt(-w / 2, yb - ch * 1.25)} ${pt(w / 2, yb - ch * 1.25)} ${pt(w / 2, yb)}`;
      let sc = ''; for (let i = n; i > 0; i--) sc += `Q${pt((ax[i] + ax[i - 1]) / 2, yb - ch * 0.22)} ${pt(ax[i - 1], yb)}`;
      const canopy = dome + sc + 'Z';
      o += `<path d="${canopy}" fill="${p.fill}" ${sd(p)}/>`;
      if (p.stripes) {
        const cid = ctx.id + '-cn'; ctx.defs.push(`<clipPath id="${cid}"><path d="${canopy}"/></clipPath>`);
        let st = ''; for (let i = 0; i < n; i += 2) st += `<path d="M${pt(ax[i], yb + 2)}L${pt(ax[i] * 0.25, yb - ch * 1.2)}L${pt(ax[i + 1] * 0.25, yb - ch * 1.2)}L${pt(ax[i + 1], yb + 2)}Z" fill="${p.fill2}"/>`;
        o += `<g clip-path="url(#${cid})">${st}</g><path d="${canopy}" fill="none" ${sd(p)}/>`;
      }
      o += payload;
      if (p.label) o += T(ctx, p.label, 0, yb - ch * 0.45, { size: p.lsize, color: p.stroke, halo: true });
      return o;
    },
  });

  /* ================= 橡皮泥（可揉捏） ================= */
  PD.register({
    type: 'blob', name: '橡皮泥/不规则物体',
    defaults: { pts: '-38,-4 -30,-26 -6,-34 22,-30 40,-12 36,12 12,28 -18,26 -36,14', label: '', lsize: 16, fillMode: 'radial', fill: '#c98f5a', fill2: '#f2d3b3', sw: 1.2 },
    getHandles: (p) => PD.parsePts(p.pts),
    setHandle(p, i, x, y) { const P = PD.parsePts(p.pts); if (P[i]) { P[i] = [x, y]; p.pts = PD.ptsStr(P); } },
    fields: [{ k: 'pts', t: 'area', l: '轮廓点(拖蓝点揉捏；可在此加点)' }, { k: 'label', t: 'text', l: '标签' }, { k: 'lsize', t: 'num', l: '标签字号' }],
    render(p, ctx) {
      const P = PD.parsePts(p.pts); if (P.length < 3) return '';
      let o = `<path d="${PD.smoothPath(P, true)}" ${PD.fillAttr(p, ctx)} ${S(p)}/>`;
      if (p.label) { const cx = P.reduce((s, q) => s + q[0], 0) / P.length, cy = P.reduce((s, q) => s + q[1], 0) / P.length; o += T(ctx, p.label, cx, cy, { size: p.lsize, color: p.stroke }); }
      return o;
    },
  });

  /* ================= 抛体轨迹（可绑定物体） ================= */
  PD.register({
    type: 'traj', name: '抛体轨迹(可绑定物体)',
    defaults: { bind: '', bx: 0, by: 0, ux: 70, uy: -70, xe: 280, ye: 0, dash: 'dash', a1: 'none', ah: 0, dots: 0, dstyle: 'dot', dr: 4,
      uArrow: true, uLabel: 'u', amark: false, alabel: '\\theta', apex: false, apexLabel: 'H', base: false, varrows: 'none', vs: 0.5, lsize: 16 },
    handles: [['ux', 'uy'], ['xe', 'ye']], handleLines: [['o', 0]],
    sync(o, m) { if (o.bind === '' || o.bind == null) return; const t = m.get(String(o.bind)); if (!t || t === o) return; o.x = f(t.x + (+o.bx || 0)); o.y = f(t.y + (+o.by || 0)); },
    fields: [
      { k: 'bind', t: 'obj', l: '绑定物体(起点跟随)', of: (x) => x.type !== 'traj' },
      { k: 'ux', t: 'num', l: '初速度 x(拖第1个蓝点)' }, { k: 'uy', t: 'num', l: '初速度 y' },
      { k: 'xe', t: 'num', l: '终点 x(拖第2个蓝点)' }, { k: 'ye', t: 'num', l: '终点 y(正=低于起点)' },
      { k: 'a1', t: 'sel', l: '终点箭头', o: PD.ARROWS },
      { k: 'uArrow', t: 'bool', l: '画初速度箭头' }, { k: 'uLabel', t: 'text', l: '初速度标签', when: (p) => p.uArrow },
      { k: 'amark', t: 'bool', l: '标抛射角' }, { k: 'alabel', t: 'text', l: '角度标签', when: (p) => p.amark },
      { k: 'apex', t: 'bool', l: '标最高点' }, { k: 'apexLabel', t: 'text', l: '高度标签', when: (p) => p.apex },
      { k: 'base', t: 'bool', l: '起点水平虚线' },
      { k: 'dots', t: 'num', l: '等时间隔点数(频闪)', min: 0 }, { k: 'dstyle', t: 'sel', l: '点样式', o: [['dot', '实心点'], ['ring', '空心圈'], ['ball', '小球']], when: (p) => p.dots > 0 }, { k: 'dr', t: 'num', l: '点大小', when: (p) => p.dots > 0 },
      { k: 'varrows', t: 'sel', l: '各点速度', o: [['none', '不画'], ['v', '速度矢量'], ['comp', '水平+竖直分量']], when: (p) => p.dots > 0 }, { k: 'vs', t: 'num', l: '速度箭头比例', step: 0.1, when: (p) => p.dots > 0 && p.varrows !== 'none' },
      { k: 'lsize', t: 'num', l: '标签字号' },
    ],
    style: ['stroke', 'sw', 'dash', 'opacity'],
    render(p, ctx) {
      let ux = +p.ux, uy = +p.uy; const xe = +p.xe, ye = +p.ye;
      if (Math.abs(ux) < 0.5) ux = (ux < 0 ? -1 : 1) * 0.5;
      let tE = xe / ux; if (!(tE > 0)) tE = Math.abs(xe / ux) || 1;
      const g = Math.max(0, (2 * (ye - uy * tE)) / (tE * tE)), P = (t) => [ux * t, uy * t + 0.5 * g * t * t], Vt = (t) => [ux, uy + g * t];
      let d = 'M0,0'; const N = 90, ah = PD.ahSize(p);
      for (let i = 1; i <= N; i++) { const q = P((tE * i) / N); d += `L${pt(q[0], q[1])}`; }
      let o = '';
      if (p.base) o += `<line x1="0" y1="0" x2="${f(P(tE)[0])}" y2="0" ${S(p, { dash: 'dash', sw: 0.8 })}/>`;
      o += `<path d="${d}" fill="none" ${S(p)}/>`;
      if (p.a1 && p.a1 !== 'none') { const v = Vt(tE), e = P(tE); o += PD.arrowHead(e[0], e[1], Math.atan2(v[1], v[0]), ah, p.a1, p.stroke, p.sw); }
      if (p.apex && uy < 0 && g > 0) {
        const ta = -uy / g;
        if (ta < tE) { const A = P(ta); o += `<line x1="${f(A[0])}" y1="${f(A[1])}" x2="${f(A[0])}" y2="0" ${S(p, { dash: 'dash', sw: 0.8 })}/><circle cx="${f(A[0])}" cy="${f(A[1])}" r="2.5" fill="${p.stroke}"/>`;
          if (p.apexLabel) o += T(ctx, p.apexLabel, A[0] + 10, A[1] / 2, { size: p.lsize, anchor: 'start', color: p.stroke, halo: true }); }
      }
      const n = Math.max(0, Math.round(+p.dots || 0)), sol = { dash: 'solid' };
      for (let k = 0; k <= n && n > 0; k++) {
        const t = (tE * k) / n, q = P(t), v = Vt(t), r = +p.dr || 4;
        if (p.varrows === 'v') o += arrow(p, q[0], q[1], q[0] + v[0] * p.vs, q[1] + v[1] * p.vs, { sw: 1.2 });
        else if (p.varrows === 'comp') o += arrow(p, q[0], q[1], q[0] + v[0] * p.vs, q[1], { sw: 1.2 }) + arrow(p, q[0], q[1], q[0], q[1] + v[1] * p.vs, { sw: 1.2 });
        if (p.dstyle === 'ring') o += `<circle cx="${f(q[0])}" cy="${f(q[1])}" r="${f(r)}" fill="#ffffff" ${S(p, Object.assign({ sw: 1.1 }, sol))}/>`;
        else if (p.dstyle === 'ball') o += `<circle cx="${f(q[0])}" cy="${f(q[1])}" r="${f(r * 1.6)}" ${PD.fillAttr({ fillMode: 'radial', fill: '#7a8fa8', fill2: '#ffffff' }, ctx)} ${S(p, Object.assign({ sw: 0.8 }, sol))}/>`;
        else o += `<circle cx="${f(q[0])}" cy="${f(q[1])}" r="${f(r * 0.8)}" fill="${p.stroke}"/>`;
      }
      if (p.uArrow) { o += arrow(p, 0, 0, ux, uy, { sw: Math.max(1.5, +p.sw * 1.1) }); const l = Math.hypot(ux, uy) || 1; if (p.uLabel) o += T(ctx, p.uLabel, ux + (ux / l) * 12, uy + (uy / l) * 12, { size: p.lsize, color: p.stroke, halo: true }); }
      if (p.amark && Math.abs(uy) > 0.5) {
        const am = Math.atan2(-uy, ux) * R2D, a0 = ux >= 0 ? 0 : 180, rr = 26, A = (a) => [rr * Math.cos(a * D2R), -rr * Math.sin(a * D2R)];
        const [x1, y1] = A(a0), [x2, y2] = A(am), cw = am < a0 ? 1 : 0;
        o += `<line x1="0" y1="0" x2="${f(a0 ? -rr * 1.6 : rr * 1.6)}" y2="0" ${S(p, { dash: 'dash', sw: 0.8 })}/><path d="M${pt(x1, y1)}A${rr},${rr} 0 0 ${cw} ${pt(x2, y2)}" fill="none" ${L.thin(p, 0.7)}/>`;
        const [lx, ly] = [(rr + 12) * Math.cos(((a0 + am) / 2) * D2R), -(rr + 12) * Math.sin(((a0 + am) / 2) * D2R)];
        if (p.alabel) o += T(ctx, p.alabel, lx, ly, { size: p.lsize, color: p.stroke });
      }
      return o;
    },
  });

  /* ================= 弹簧 ================= */
  PD.register({
    type: 'spring', name: '弹簧',
    defaults: { L: 150, n: 9, amp: 10, style: 'zig', lead: 12, label: '', lsize: 16 },
    handles: [['L', 'zero']],
    fields: [{ k: 'L', t: 'num', l: '长度' }, { k: 'n', t: 'num', l: '圈数', min: 1 }, { k: 'amp', t: 'num', l: '半宽' }, { k: 'style', t: 'sel', l: '样式', o: [['zig', '锯齿'], ['coil', '螺旋']] }, { k: 'lead', t: 'num', l: '两端直线长' }, { k: 'label', t: 'text', l: '标签' }, { k: 'lsize', t: 'num', l: '标签字号' }],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      let o = `<path d="${L.springPath(0, +p.L, +p.n, +p.amp, p.style, +p.lead)}" fill="none" ${sd(p)}/>`;
      if (p.label) o += T(ctx, p.label, p.L / 2, -p.amp - 14, { size: p.lsize, color: p.stroke, halo: true });
      return o;
    },
  });

  /* ================= 斜面 ================= */
  PD.register({
    type: 'incline', name: '斜面(可放木块)',
    defaults: { b: 240, ang: 30, dir: 'right', fillMode: 'solid', fill: '#f0f0f0', ground: true, amark: true, alabel: '\\theta', lsize: 18, block: false, bpos: 0.55, bw: 48, bh: 32, blabel: 'm' },
    handles: [['b', 'zero']],
    fields: [
      { k: 'b', t: 'num', l: '底边长' }, { k: 'ang', t: 'num', l: '倾角°', step: 5 }, { k: 'dir', t: 'sel', l: '高的一端', o: [['right', '右'], ['left', '左']] },
      { k: 'ground', t: 'bool', l: '地面阴影线' }, { k: 'amark', t: 'bool', l: '标角度' }, { k: 'alabel', t: 'text', l: '角度标签', when: (p) => p.amark },
      { k: 'block', t: 'bool', l: '放木块', rebuild: true }, { k: 'bpos', t: 'range', l: '木块位置', min: 0, max: 1, step: 0.02, when: (p) => p.block },
      { k: 'bw', t: 'num', l: '木块长', when: (p) => p.block }, { k: 'bh', t: 'num', l: '木块高', when: (p) => p.block }, { k: 'blabel', t: 'text', l: '木块标签', when: (p) => p.block },
      { k: 'lsize', t: 'num', l: '标签字号' },
    ],
    render(p, ctx) {
      const b = +p.b, a = clamp(+p.ang, 1, 85) * D2R, s = p.dir === 'left' ? -1 : 1, H = b * Math.tan(a);
      let o = '';
      if (p.ground) o += L.hatchLine(p, s > 0 ? -20 : 20, 0, s * (b + 20), 0, s);
      o += `<path d="M0,0L${pt(s * b, 0)}L${pt(s * b, -H)}Z" ${PD.fillAttr(p, ctx)} ${S(p)}/>`;
      if (p.amark) {
        const rr = 34, a0 = s > 0 ? 0 : 180, a1 = s > 0 ? +p.ang : 180 - +p.ang, A = (q) => [rr * Math.cos(q * D2R), -rr * Math.sin(q * D2R)];
        const [x1, y1] = A(a0), [x2, y2] = A(a1);
        o += `<path d="M${pt(x1, y1)}A${rr},${rr} 0 0 ${s > 0 ? 0 : 1} ${pt(x2, y2)}" fill="none" ${L.thin(p, 0.7)}/>`;
        if (p.alabel) { const am = ((a0 + a1) / 2) * D2R; o += T(ctx, p.alabel, (rr + 14) * Math.cos(am), -(rr + 14) * Math.sin(am), { size: p.lsize, color: p.stroke }); }
      }
      if (p.block) {
        const u = [s * Math.cos(a), -Math.sin(a)], n = [-s * Math.sin(a), -Math.cos(a)], dist = (clamp(+p.bpos, 0, 1) * b) / Math.cos(a);
        const c = [u[0] * dist + (n[0] * p.bh) / 2, u[1] * dist + (n[1] * p.bh) / 2];
        o += L.block(p, ctx, c[0], c[1], +p.bw, +p.bh, -s * +p.ang, p.blabel, '#e0e0e0', p.lsize);
      }
      return o;
    },
  });

  /* ================= 杠杆 / 米尺 / 跷跷板 ================= */
  PD.register({
    type: 'beam', name: '杠杆/米尺/跷跷板',
    defaults: { L: 320, t: 12, piv: 0.5, pivot: 'tri', tilt: 0, ruler: false, rdiv: 10, rmax: 100, loads: '0.15, 2 N, hang, 3\n0.8, W, down, 50', fillMode: 'solid', fill: '#ead9b4', lsize: 15 },
    handles: [['L', 'zero', 0.5]],
    fields: [
      { k: 'L', t: 'num', l: '长度' }, { k: 't', t: 'num', l: '厚度' }, { k: 'piv', t: 'range', l: '支点位置', min: 0, max: 1, step: 0.01 },
      { k: 'pivot', t: 'sel', l: '支点', o: [['tri', '三角支点'], ['pin', '转轴(销钉)'], ['hinge', '墙上铰链'], ['none', '无']] },
      { k: 'tilt', t: 'num', l: '倾斜°(支点不动)', step: 5 },
      { k: 'ruler', t: 'bool', l: '刻度(米尺)' }, { k: 'rdiv', t: 'num', l: '刻度格数', when: (p) => p.ruler }, { k: 'rmax', t: 'num', l: '最大读数', when: (p) => p.ruler },
      { k: 'loads', t: 'area', l: '负载(每行一个)', ph: '位置(0-1), 标签, 类型, 大小\n类型: hang(挂槽码) block(放木块) down(向下力) up(向上力)\n例: 0.15, 2 N, hang, 3\n例: 0.8, W, down, 50' },
      { k: 'lsize', t: 'num', l: '标签字号' },
    ],
    render(p, ctx) {
      const Lb = +p.L, t = +p.t, x0 = -clamp(+p.piv, 0, 1) * Lb, yc = p.pivot === 'tri' ? -t / 2 : 0, y0 = yc - t / 2;
      const th = -(+p.tilt || 0) * D2R, cs = Math.cos(th), sn = Math.sin(th), Rt = (x, y) => [x * cs - y * sn, x * sn + y * cs];
      let o = '';
      if (p.pivot === 'tri') o += `<path d="M0,0L-14,26L14,26Z" fill="#bdbdbd" ${sd(p)}/>` + L.hatchLine(p, -26, 26, 26, 26, 1, 7, 6);
      let inner = `<rect x="${f(x0)}" y="${f(y0)}" width="${f(Lb)}" height="${f(t)}" ${PD.fillAttr(p, ctx)} ${S(p)}/>`;
      if (p.ruler) {
        const n = Math.max(1, Math.round(+p.rdiv)); let d = '';
        for (let k = 0; k <= n * 2; k++) { const x = x0 + (Lb * k) / (2 * n); d += `M${pt(x, y0)}v${k % 2 ? 3.5 : 6}`; if (k % 2 === 0) inner += T(ctx, PD.fmt((+p.rmax * k) / (2 * n)), x, y0 + t * 0.62 + 2, { size: Math.min(9, t * 0.55), italic: false, color: p.stroke }); }
        inner += `<path d="${d}" fill="none" ${L.thin(p, 0.5)}/>`;
      }
      let after = '';
      PD.lines(p.loads).forEach((line) => {
        const a = line.split(',').map((x) => x.trim()), pos = parseFloat(a[0]); if (!isFinite(pos)) return;
        const lab = a[1] || '', kind = (a[2] || 'hang').toLowerCase(), size = parseFloat(a[3]), xb = x0 + clamp(pos, 0, 1) * Lb;
        if (kind === 'block') { const bs = isFinite(size) ? size : 34; inner += `<rect x="${f(xb - bs / 2)}" y="${f(y0 - bs * 0.75)}" width="${f(bs)}" height="${f(bs * 0.75)}" fill="#e0e0e0" ${sd(p)}/>`; const c = Rt(xb, y0 - bs * 0.375); after += T(ctx, lab, c[0], c[1], { size: p.lsize, color: p.stroke }); }
        else if (kind === 'down' || kind === 'up') {
          const c = Rt(xb, kind === 'down' ? y0 + t : y0), len = isFinite(size) ? size : 50, sg = kind === 'down' ? 1 : -1;
          after += arrow(p, c[0], c[1], c[0], c[1] + sg * len) + (lab ? T(ctx, lab, c[0], c[1] + sg * (len + 12), { size: p.lsize, color: p.stroke, halo: true }) : '');
        } else {
          const c = Rt(xb, y0 + t), sl = 24;
          after += `<line x1="${f(c[0])}" y1="${f(c[1])}" x2="${f(c[0])}" y2="${f(c[1] + sl)}" ${L.thin(p, 0.7)}/>` + L.hanger(p, ctx, c[0], c[1] + sl, isFinite(size) ? size : 3, lab, 24, p.lsize);
        }
      });
      o += `<g transform="rotate(${f(-(+p.tilt || 0))})">${inner}</g>` + after;
      if (p.pivot === 'pin') o += `<circle r="5" fill="#ffffff" ${sd(p)}/><circle r="1.6" fill="${p.stroke}"/>`;
      if (p.pivot === 'hinge') o += L.hatchLine(p, -7, 40, -7, -40, 1) + `<circle r="5" fill="#ffffff" ${sd(p)}/><circle r="1.6" fill="${p.stroke}"/>`;
      return o;
    },
  });

  /* ================= 槽码 ================= */
  PD.register({
    type: 'masshanger', name: '槽码/挂钩砝码',
    defaults: { n: 3, w: 28, label: '100 g', lsize: 15, string: 30 },
    fields: [{ k: 'n', t: 'num', l: '槽码片数', min: 1 }, { k: 'w', t: 'num', l: '宽' }, { k: 'string', t: 'num', l: '上方挂绳长' }, { k: 'label', t: 'text', l: '标签' }, { k: 'lsize', t: 'num', l: '标签字号' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) { const sl = +p.string || 0; return (sl ? `<line x1="0" y1="0" x2="0" y2="${f(sl)}" ${L.thin(p, 0.7)}/>` : '') + L.hanger(p, ctx, 0, sl, +p.n, p.label, +p.w, p.lsize); },
  });

  /* ================= 受力图 ================= */
  PD.register({
    type: 'fbd', name: '受力图(自由体图)',
    defaults: { body: 'box', bw: 60, bh: 40, blabel: '', forces: '90, 60, R\n-90, 60, W\n0, 55, F\n180, 40, f', fromEdge: false, lsize: 18, fillMode: 'solid', fill: '#e6e6e6' },
    fields: [
      { k: 'body', t: 'sel', l: '物体', o: [['box', '方块'], ['ball', '球'], ['dot', '质点'], ['none', '无']] }, { k: 'bw', t: 'num', l: '宽/直径' }, { k: 'bh', t: 'num', l: '高', when: (p) => p.body === 'box' }, { k: 'blabel', t: 'text', l: '物体标签' },
      { k: 'forces', t: 'area', l: '力(每行一个)', ph: '方向°, 长度, 标签, 线型(可省)\n方向: 0右 90上 180左 -90下\n例: 30, 60, T\n例: -90, 50, mg, dash' },
      { k: 'fromEdge', t: 'bool', l: '箭头从边缘出发(否则从中心)' }, { k: 'lsize', t: 'num', l: '标签字号' },
    ],
    render(p, ctx) {
      const bw = +p.bw, bh = +p.bh; let o = '';
      if (p.body === 'box') o += `<rect x="${f(-bw / 2)}" y="${f(-bh / 2)}" width="${f(bw)}" height="${f(bh)}" ${PD.fillAttr(p, ctx)} ${S(p, { dash: 'solid' })}/>`;
      else if (p.body === 'ball') o += `<circle r="${f(bw / 2)}" ${PD.fillAttr(Object.assign({}, p, { fillMode: p.fillMode === 'solid' ? 'radial' : p.fillMode }), ctx)} ${S(p, { dash: 'solid' })}/>`;
      else if (p.body === 'dot') o += `<circle r="3.5" fill="${p.stroke}"/>`;
      if (p.blabel) o += T(ctx, p.blabel, 0, 0, { size: p.lsize, color: p.stroke });
      PD.lines(p.forces).forEach((line) => {
        const a = line.split(',').map((x) => x.trim()), ang = parseFloat(a[0]), len = parseFloat(a[1]); if (!isFinite(ang) || !isFinite(len)) return;
        const u = [Math.cos(ang * D2R), -Math.sin(ang * D2R)];
        let s0 = 0;
        if (p.fromEdge) { if (p.body === 'box') s0 = Math.min(Math.abs(u[0]) > 1e-6 ? bw / 2 / Math.abs(u[0]) : 1e9, Math.abs(u[1]) > 1e-6 ? bh / 2 / Math.abs(u[1]) : 1e9); else if (p.body === 'ball') s0 = bw / 2; }
        o += arrow(p, u[0] * s0, u[1] * s0, u[0] * (s0 + len), u[1] * (s0 + len), { dash: a[3] || 'solid', sw: Math.max(1.6, +p.sw * 1.15) });
        if (a[2]) o += T(ctx, a[2], u[0] * (s0 + len + 13), u[1] * (s0 + len + 13), { size: p.lsize, color: p.stroke, halo: true });
      });
      return o;
    },
  });

  /* ================= 打点纸带 ================= */
  PD.register({
    type: 'tape', name: '打点计时器纸带',
    defaults: { mode: 'accel', n: 8, d0: 12, da: 6, list: '10, 14, 18, 22', th: 28, dr: 2.2, nums: false, numStart: 0, tear: true, fill: '#fbf6e6' },
    fields: [
      { k: 'mode', t: 'sel', l: '点距', o: [['uniform', '均匀(匀速)'], ['accel', '等差(匀变速)'], ['list', '自定义']], rebuild: true },
      { k: 'n', t: 'num', l: '点数', min: 2, when: (p) => p.mode !== 'list' }, { k: 'd0', t: 'num', l: '首段间距', when: (p) => p.mode !== 'list' },
      { k: 'da', t: 'num', l: '每段增量(负=减速)', when: (p) => p.mode === 'accel' }, { k: 'list', t: 'text', l: '各段间距', when: (p) => p.mode === 'list' },
      { k: 'th', t: 'num', l: '纸带宽' }, { k: 'dr', t: 'num', l: '点大小', step: 0.2 }, { k: 'nums', t: 'bool', l: '点下编号' }, { k: 'numStart', t: 'num', l: '起始编号', when: (p) => p.nums }, { k: 'tear', t: 'bool', l: '撕边' },
      { k: 'fill', t: 'color', l: '纸色' },
    ],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      let gaps = [];
      if (p.mode === 'list') gaps = String(p.list).split(/[,\s]+/).map(Number).filter((x) => isFinite(x) && x > 0);
      else for (let k = 0; k < Math.max(1, Math.round(+p.n) - 1); k++) gaps.push(Math.max(1, +p.d0 + (p.mode === 'accel' ? k * +p.da : 0)));
      const xs = [22]; gaps.forEach((g) => xs.push(xs[xs.length - 1] + g));
      const W = xs[xs.length - 1] + 22, h = +p.th / 2;
      const edge = (x, sg) => { if (!p.tear) return `L${pt(x, sg * h)}`; let d = ''; const N = 6; for (let i = 0; i <= N; i++) d += `L${pt(x + (i % 2 ? 3 : -3), -sg * h + (sg * 2 * h * i) / N)}`; return d; };
      let o = `<path d="M${pt(0, -h)}L${pt(W, -h)}${edge(W, 1)}L${pt(0, h)}${edge(0, -1)}Z" fill="${p.fill}" ${sd(p)}/>`;
      xs.forEach((x, i) => { o += `<circle cx="${f(x)}" cy="0" r="${f(p.dr)}" fill="${p.stroke}"/>`; if (p.nums) o += T(ctx, String(+p.numStart + i), x, h + 11, { size: 11, italic: false, color: p.stroke }); });
      return o;
    },
  });

  /* ================= 光闸 ================= */
  PD.register({
    type: 'lightgate', name: '光闸',
    defaults: { gap: 40, h: 60, label: '光闸', lsize: 14, fill: '#5a6b80' },
    fields: [{ k: 'gap', t: 'num', l: '开口宽' }, { k: 'h', t: 'num', l: '高' }, { k: 'label', t: 'text', l: '标签' }, { k: 'lsize', t: 'num', l: '标签字号' }, { k: 'fill', t: 'color', l: '颜色' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const g = +p.gap / 2, h = +p.h, a = 12;
      let o = `<path d="M${pt(-g - a, h * 0.3)}V${f(-h * 0.7)}H${f(g + a)}V${f(h * 0.3)}H${f(g)}V${f(-h * 0.7 + a)}H${f(-g)}V${f(h * 0.3)}Z" fill="${p.fill}" ${sd(p)}/>`;
      o += `<line x1="${f(-g)}" y1="0" x2="${f(g)}" y2="0" stroke="#d62828" stroke-width="1.2" stroke-dasharray="3 2"/>`;
      if (p.label) o += T(ctx, p.label, 0, -h * 0.7 - 12, { size: p.lsize, italic: false, color: p.stroke });
      return o;
    },
  });

  /* ================= 单摆 ================= */
  PD.register({
    type: 'pendulum', name: '单摆',
    defaults: { L: 170, ang: 30, r: 12, ceil: true, rest: true, ghost: true, arc: true, label: '', lsize: 16, fillMode: 'radial', fill: '#8a9bb0', fill2: '#ffffff' },
    getHandles: (p) => [[+p.L * Math.sin(p.ang * D2R), +p.L * Math.cos(p.ang * D2R)]],
    setHandle(p, i, x, y) { p.L = f(Math.max(10, Math.hypot(x, y))); p.ang = normA(Math.atan2(x, y) * R2D); },
    fields: [
      { k: 'L', t: 'num', l: '摆长' }, { k: 'ang', t: 'num', l: '偏角°(拖蓝点)', step: 5 }, { k: 'r', t: 'num', l: '摆球半径' },
      { k: 'ceil', t: 'bool', l: '悬挂点阴影线' }, { k: 'rest', t: 'bool', l: '平衡位置虚线' }, { k: 'ghost', t: 'bool', l: '另一侧虚影' }, { k: 'arc', t: 'bool', l: '摆动弧线' },
      { k: 'label', t: 'text', l: '摆球标签' }, { k: 'lsize', t: 'num', l: '标签字号' },
    ],
    render(p, ctx) {
      const Lp = +p.L, a = p.ang * D2R, r = +p.r, bx = Lp * Math.sin(a), by = Lp * Math.cos(a), dsh = S(p, { dash: 'dash', sw: 0.9 });
      let o = '';
      if (p.ceil) o += L.hatchLine(p, -40, 0, 40, 0, -1);
      if (p.rest) o += `<line x1="0" y1="0" x2="0" y2="${f(Lp + r)}" ${S(p, { dash: 'dashdot', sw: 0.8 })}/>`;
      if (p.arc) o += `<path d="M${pt(-bx, by)}A${f(Lp)},${f(Lp)} 0 0 0 ${pt(bx, by)}" fill="none" ${dsh}/>`;
      if (p.ghost) o += `<line x1="0" y1="0" x2="${f(-bx * (1 - r / Lp))}" y2="${f(by * (1 - r / Lp))}" ${dsh}/><circle cx="${f(-bx)}" cy="${f(by)}" r="${f(r)}" fill="#ffffff" ${dsh}/>`;
      o += `<line x1="0" y1="0" x2="${f(bx)}" y2="${f(by)}" ${sd(p)}/><circle cx="${f(bx)}" cy="${f(by)}" r="${f(r)}" ${PD.fillAttr(p, ctx)} ${sd(p)}/><circle r="2.5" fill="${p.stroke}"/>`;
      if (p.label) o += T(ctx, p.label, bx + r + 10, by, { size: p.lsize, anchor: 'start', color: p.stroke });
      return o;
    },
  });

  /* ================= 星球 ================= */
  PD.register({
    type: 'planet', name: '星球(地球/月球/太阳…)',
    defaults: { kind: 'earth', r: 60, shading: true, fill: '#4f86c6', label: '', lsize: 18, field: 0, flen: 50, seed: 4 },
    handles: [['r', 'zero']],
    fields: [
      { k: 'kind', t: 'sel', l: '类型', o: [['plain', '纯色球'], ['earth', '地球'], ['moon', '月球(陨石坑)'], ['sun', '太阳(光芒)'], ['gas', '气态行星(条纹)'], ['ringed', '带环行星']] },
      { k: 'r', t: 'num', l: '半径' }, { k: 'fill', t: 'color', l: '颜色' }, { k: 'shading', t: 'bool', l: '光影着色' },
      { k: 'field', t: 'num', l: '引力场线数(0=无)', min: 0 }, { k: 'flen', t: 'num', l: '场线长度', when: (p) => p.field > 0 },
      { k: 'label', t: 'text', l: '标签' }, { k: 'lsize', t: 'num', l: '标签字号' }, { k: 'seed', t: 'num', l: '随机花纹' },
    ],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const r = +p.r, R = PD.rng(p.seed), cid = ctx.id + '-pl';
      ctx.defs.push(`<clipPath id="${cid}"><circle r="${f(r)}"/></clipPath>`);
      let o = '', deco = '';
      const ringE = (half) => { const rx = r * 1.9, ry = r * 0.42; return half === 'back' ? `M${pt(-rx, 0)}A${f(rx)},${f(ry)} 0 0 1 ${pt(rx, 0)}` : `M${pt(-rx, 0)}A${f(rx)},${f(ry)} 0 0 0 ${pt(rx, 0)}`; };
      if (p.kind === 'ringed') o += `<g transform="rotate(-16)"><path d="${ringE('back')}" fill="none" stroke="#c9b48a" stroke-width="${f(r * 0.18)}"/></g>`;
      if (p.kind === 'sun') { let d = ''; for (let i = 0; i < 16; i++) { const a = (i * Math.PI) / 8; d += `M${pt((r + 5) * Math.cos(a), (r + 5) * Math.sin(a))}L${pt((r + r * 0.28) * Math.cos(a), (r + r * 0.28) * Math.sin(a))}`; } o += `<path d="${d}" stroke="#f0a020" stroke-width="${f(Math.max(2, r * 0.05))}" stroke-linecap="round"/>`; }
      const fl = p.shading ? PD.fillAttr({ fillMode: 'radial', fill: p.fill, fill2: PD.shade(p.fill, 0.7) }, ctx) : `fill="${p.fill}"`;
      o += `<circle r="${f(r)}" ${fl}/>`;
      if (p.kind === 'earth') { for (let i = 0; i < 4; i++) { const cx = (R() * 1.4 - 0.7) * r, cy = (R() * 1.4 - 0.7) * r, s = r * (0.25 + 0.25 * R()), P = []; for (let k = 0; k < 7; k++) { const a = (k / 7) * 6.283, rr = s * (0.6 + 0.6 * R()); P.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a) * 0.8]); } deco += `<path d="${PD.smoothPath(P, true)}" fill="#6aa84f" fill-opacity="0.85"/>`; } }
      if (p.kind === 'moon') { for (let i = 0; i < 7; i++) { const a = R() * 6.283, d = R() * r * 0.75, cr = r * (0.07 + 0.12 * R()); deco += `<circle cx="${f(d * Math.cos(a))}" cy="${f(d * Math.sin(a))}" r="${f(cr)}" fill="${PD.shade(p.fill, -0.25)}" stroke="${PD.shade(p.fill, -0.4)}" stroke-width="0.6"/>`; } }
      if (p.kind === 'gas') { for (let k = -4; k <= 4; k++) if (k % 2) deco += `<rect x="${f(-r)}" y="${f((k * r) / 5 - r * 0.07)}" width="${f(2 * r)}" height="${f(r * (0.1 + 0.08 * R()))}" fill="${PD.shade(p.fill, -0.25)}" fill-opacity="0.7"/>`; }
      if (deco) o += `<g clip-path="url(#${cid})">${deco}${p.shading ? `<circle r="${f(r)}" ${PD.fillAttr({ fillMode: 'radial', fill: '#000000', fill2: '#ffffff' }, ctx)} fill-opacity="0.18"/>` : ''}</g>`;
      o += `<circle r="${f(r)}" fill="none" ${sd(p)}/>`;
      if (p.kind === 'ringed') o += `<g transform="rotate(-16)"><path d="${ringE('front')}" fill="none" stroke="#c9b48a" stroke-width="${f(r * 0.18)}"/></g>`;
      const nF = Math.round(+p.field || 0);
      for (let i = 0; i < nF; i++) { const a = (2 * Math.PI * i) / nF, c = Math.cos(a), s = Math.sin(a), r0 = r + 4 + (p.kind === 'ringed' ? r : 0), r1 = r0 + +p.flen; o += arrow(p, r1 * c, r1 * s, r0 * c, r0 * s, { sw: 1.1 }); }
      if (p.label) o += T(ctx, p.label, 0, 0, { size: p.lsize, color: p.stroke, halo: true });
      return o;
    },
  });

  /* ================= 航天器（可绑定星球画轨道） ================= */
  function orbitGeom(p, P) {
    const r = Math.hypot(P[0], P[1]); if (r < 1) return null;
    const e = p.orbit === 'ellipse' ? clamp(+p.ecc || 0, 0, 0.95) : 0, w = (+p.omega || 0) * D2R, wv = [Math.cos(w), -Math.sin(w)], psiW = Math.atan2(wv[1], wv[0]);
    const psi = Math.atan2(-P[1], -P[0]);
    const a = (r * (1 + e * Math.cos(psi - psiW))) / (1 - e * e), b = a * Math.sqrt(1 - e * e);
    const pos = (ps) => { const rr = (a * (1 - e * e)) / (1 + e * Math.cos(ps - psiW)); return [P[0] + rr * Math.cos(ps), P[1] + rr * Math.sin(ps)]; };
    const tan = (ps) => { const q1 = pos(ps + 1e-3), q0 = pos(ps - 1e-3); let t = [q1[0] - q0[0], q1[1] - q0[1]]; const l = Math.hypot(t[0], t[1]) || 1; t = [t[0] / l, t[1] / l]; return p.dir === 'cw' ? t : [-t[0], -t[1]]; };
    return { r, e, a, b, c: [P[0] - a * e * wv[0], P[1] - a * e * wv[1]], rot: -(+p.omega || 0), psi, pos, tan, toP: [P[0] / r, P[1] / r] };
  }
  const relPlanet = (o, t) => [t.x - o.x, t.y - o.y];
  PD.register({
    type: 'craft', name: '航天器(可绑定星球显示轨道)',
    defaults: { kind: 'rocket', size: 70, crew: true, flame: false, fill: '#eef1f5', accent: '#d9534f', shading: true,
      orbitOf: '', orbit: 'circle', ecc: 0.4, omega: 0, dir: 'ccw', oDash: 'dash', oc: '#000000', oArrows: 2, autoRot: true,
      vArrow: false, vLen: 60, vLabel: 'v', fArrow: false, fLen: 50, fLabel: 'F', lsize: 16 },
    sync(o, m) {
      if (!o.autoRot || o.orbitOf === '' || o.orbitOf == null) return;
      const t = m.get(String(o.orbitOf)); if (!t || t === o) return;
      const g = orbitGeom(o, relPlanet(o, t)); if (!g) return;
      const tv = g.tan(g.psi); o.rot = normA(Math.atan2(tv[0], -tv[1]) * R2D + (o.kind === 'satellite' ? 90 : 0));
    },
    fields: [
      { k: 'kind', t: 'sel', l: '类型', o: [['rocket', '火箭'], ['capsule', '太空舱'], ['satellite', '人造卫星']], rebuild: true }, { k: 'size', t: 'num', l: '大小' },
      { k: 'crew', t: 'bool', l: '舱内有人', when: (p) => p.kind !== 'satellite' }, { k: 'flame', t: 'bool', l: '喷火', when: (p) => p.kind === 'rocket' },
      { k: 'fill', t: 'color', l: '主体颜色' }, { k: 'accent', t: 'color', l: '点缀颜色' }, { k: 'shading', t: 'bool', l: '金属质感' },
      { k: 'orbitOf', t: 'obj', l: '绕行天体(显示轨道)', rebuild: true },
      { k: 'orbit', t: 'sel', l: '轨道形状', o: [['circle', '圆形'], ['ellipse', '椭圆(天体在焦点)']], when: (p) => p.orbitOf !== '', rebuild: true },
      { k: 'ecc', t: 'range', l: '偏心率', min: 0, max: 0.9, step: 0.05, when: (p) => p.orbitOf !== '' && p.orbit === 'ellipse' },
      { k: 'omega', t: 'num', l: '长轴方向°', step: 15, when: (p) => p.orbitOf !== '' && p.orbit === 'ellipse' },
      { k: 'dir', t: 'sel', l: '运行方向', o: [['ccw', '逆时针'], ['cw', '顺时针']], when: (p) => p.orbitOf !== '' },
      { k: 'oDash', t: 'sel', l: '轨道线型', o: PD.DASH, when: (p) => p.orbitOf !== '' }, { k: 'oc', t: 'color', l: '轨道颜色', when: (p) => p.orbitOf !== '' },
      { k: 'oArrows', t: 'num', l: '轨道方向箭头数', min: 0, when: (p) => p.orbitOf !== '' }, { k: 'autoRot', t: 'bool', l: '机头自动沿轨道', when: (p) => p.orbitOf !== '' },
      { k: 'vArrow', t: 'bool', l: '速度箭头 v', when: (p) => p.orbitOf !== '' }, { k: 'vLen', t: 'num', l: 'v 长度', when: (p) => p.orbitOf !== '' && p.vArrow }, { k: 'vLabel', t: 'text', l: 'v 标签', when: (p) => p.orbitOf !== '' && p.vArrow },
      { k: 'fArrow', t: 'bool', l: '引力箭头 F', when: (p) => p.orbitOf !== '' }, { k: 'fLen', t: 'num', l: 'F 长度', when: (p) => p.orbitOf !== '' && p.fArrow }, { k: 'fLabel', t: 'text', l: 'F 标签', when: (p) => p.orbitOf !== '' && p.fArrow },
      { k: 'lsize', t: 'num', l: '标签字号' },
    ],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const s = +p.size, th = L.thin(p, 0.8), body = (x0, x1) => L.paint(p, ctx, p.fill, x0, x1);
      let pre = '', o = '', post = '';
      const tgt = PD.findObj(ctx.doc, p.orbitOf);
      if (tgt && tgt !== p) {
        const g = orbitGeom(p, relPlanet(p, tgt));
        if (g) {
          const sc = +p.scale || 1, inv = `scale(${f(1 / sc)})${p.flip ? ' scale(-1,1)' : ''} rotate(${f(-(+p.rot || 0))})`, c0 = Object.assign({}, ctx, { rot: 0, flip: false });
          let q = `<ellipse cx="${f(g.c[0])}" cy="${f(g.c[1])}" rx="${f(g.a)}" ry="${f(g.b)}" transform="rotate(${f(g.rot)} ${f(g.c[0])} ${f(g.c[1])})" fill="none" ${S(p, { color: p.oc, dash: p.oDash, sw: Math.max(1, (+p.sw || 1.5) * 0.8) })}/>`;
          const n = Math.round(+p.oArrows || 0);
          for (let k = 0; k < n; k++) { const ps = g.psi + Math.PI * ((2 * k + 1) / n), pp = g.pos(ps), tv = g.tan(ps), ah = 9; q += PD.arrowHead(pp[0] + (tv[0] * ah) / 2, pp[1] + (tv[1] * ah) / 2, Math.atan2(tv[1], tv[0]), ah, 'tri', p.oc, 1); }
          pre = `<g transform="${inv}">${q}</g>`;
          let a = '';
          if (p.vArrow) { const tv = g.tan(g.psi), l = +p.vLen; a += arrow(p, 0, 0, tv[0] * l, tv[1] * l, { sw: 1.8 }) + (p.vLabel ? T(c0, p.vLabel, tv[0] * (l + 13), tv[1] * (l + 13), { size: p.lsize, color: p.stroke, halo: true }) : ''); }
          if (p.fArrow) { const l = +p.fLen; a += arrow(p, 0, 0, g.toP[0] * l, g.toP[1] * l, { sw: 1.8 }) + (p.fLabel ? T(c0, p.fLabel, g.toP[0] * (l + 13) - g.toP[1] * 10, g.toP[1] * (l + 13) + g.toP[0] * 10, { size: p.lsize, color: p.stroke, halo: true }) : ''); }
          if (a) post = `<g transform="${inv}">${a}</g>`;
        }
      }
      if (p.kind === 'satellite') {
        const b = s * 0.32, pw = s * 0.5, ph = s * 0.24;
        [-1, 1].forEach((sg) => {
          const x0 = sg > 0 ? b / 2 + 6 : -b / 2 - 6 - pw;
          o += `<line x1="${f(sg * b / 2)}" y1="0" x2="${f(sg * (b / 2 + 6))}" y2="0" ${sd(p)}/><rect x="${f(x0)}" y="${f(-ph / 2)}" width="${f(pw)}" height="${f(ph)}" fill="#3e5f8a" ${th}/>`;
          let d = ''; for (let k = 1; k < 4; k++) d += `M${pt(x0 + (pw * k) / 4, -ph / 2)}v${f(ph)}`; d += `M${pt(x0, 0)}h${f(pw)}`; o += `<path d="${d}" stroke="#a9c1e0" stroke-width="0.7"/>`;
        });
        o += `<rect x="${f(-b / 2)}" y="${f(-b / 2)}" width="${f(b)}" height="${f(b)}" fill="${body(-b / 2, b / 2)}" ${sd(p)}/><line x1="0" y1="${f(-b / 2)}" x2="0" y2="${f(-b / 2 - s * 0.12)}" ${sd(p)}/><path d="M${pt(-s * 0.1, -b / 2 - s * 0.12)}Q0,${f(-b / 2 - s * 0.04)} ${pt(s * 0.1, -b / 2 - s * 0.12)}Z" fill="#ffffff" ${th}/>`;
      } else if (p.kind === 'capsule') {
        const wt = s * 0.32, wb = s * 0.82, h = s * 0.6;
        o += `<path d="M${pt(-wt / 2, -h / 2)}L${pt(wt / 2, -h / 2)}L${pt(wb / 2, h / 2)}Q0,${f(h / 2 + s * 0.16)} ${pt(-wb / 2, h / 2)}Z" fill="${body(-wb / 2, wb / 2)}" ${sd(p)}/>`;
        o += `<path d="M${pt(-wb / 2, h / 2)}Q0,${f(h / 2 + s * 0.16)} ${pt(wb / 2, h / 2)}" fill="none" stroke="${p.accent}" stroke-width="${f(s * 0.05)}"/><rect x="${f(-wt * 0.3)}" y="${f(-h / 2 - s * 0.08)}" width="${f(wt * 0.6)}" height="${f(s * 0.08)}" fill="#999999" ${th}/>`;
        const wr = s * 0.14; o += `<circle cx="0" cy="${f(h * 0.08)}" r="${f(wr)}" fill="#bcd5ee" ${sd(p)}/>`;
        if (p.crew) o += L.astroHead(p, 0, h * 0.1, wr * 0.75);
      } else {
        const bw = s * 0.3, yN = -s / 2, yB = -s * 0.2, yE = s * 0.33;
        if (p.flame) o += `<g transform="translate(0,${f(yE + s * 0.07)}) scale(1,-1)">${L.flame({ stroke: p.stroke, sw: p.sw }, ctx, 0, 0, bw * 0.55, s * 0.4, 'normal')}</g>`;
        o += `<path d="M${pt(-bw / 2, s * 0.12)}L${pt(-bw, yE + s * 0.06)}L${pt(-bw / 2, yE)}ZM${pt(bw / 2, s * 0.12)}L${pt(bw, yE + s * 0.06)}L${pt(bw / 2, yE)}Z" fill="${p.accent}" ${sd(p)}/>`;
        o += `<path d="M${pt(-bw * 0.32, yE)}L${pt(bw * 0.32, yE)}L${pt(bw * 0.42, yE + s * 0.07)}L${pt(-bw * 0.42, yE + s * 0.07)}Z" fill="#777777" ${sd(p)}/>`;
        o += `<path d="M${pt(-bw / 2, yE)}L${pt(-bw / 2, yB)}Q${pt(-bw / 2, yN + s * 0.08)} 0,${f(yN)}Q${pt(bw / 2, yN + s * 0.08)} ${pt(bw / 2, yB)}L${pt(bw / 2, yE)}Z" fill="${body(-bw / 2, bw / 2)}" ${sd(p)}/>`;
        o += `<path d="M${pt(-bw * 0.36, yN + s * 0.12)}Q0,${f(yN + s * 0.16)} ${pt(bw * 0.36, yN + s * 0.12)}" fill="none" stroke="${p.accent}" stroke-width="${f(s * 0.03)}"/>`;
        const wr = bw * 0.3; o += `<circle cx="0" cy="${f(-s * 0.06)}" r="${f(wr)}" fill="#bcd5ee" ${sd(p)}/>`;
        if (p.crew) o += L.astroHead(p, 0, -s * 0.05, wr * 0.75);
      }
      return pre + o + post;
    },
  });

  /* ================= 预设 ================= */
  const stick = (name, pose, extra) => PD.preset(CAT, name, 'stick', Object.assign(pose, extra || {}));
  stick('火柴人·站立', POSE(0, 15, 5, -15, -5, 8, 0, -8, 0));
  stick('火柴人·走/跑', POSE(12, -55, -75, 45, -55, -45, 55, 30, 50));
  stick('火柴人·推', POSE(25, -115, 10, -105, 5, -20, 15, 35, 0));
  stick('火柴人·拉', POSE(-25, -65, 0, -60, -5, -30, 0, 10, 0));
  stick('火柴人·跳起', POSE(0, 140, 25, -140, -25, -40, 70, -30, 60));
  stick('火柴人·坐', POSE(0, -20, -45, -10, -50, -90, 90, -85, 85));
  stick('火柴人·粗体', POSE(5, 20, 10, -25, -10, 10, 0, -12, 5), { style: 'bold', backGray: true });
  PD.preset(CAT, '定滑轮(桌边)', 'pulley', {});
  PD.preset(CAT, '定滑轮(天花板)', 'pulley', { mount: 'ceiling', angA: -90, LA: 110, angB: -90, LB: 150, labA: 'm_1', labB: 'm_2' });
  PD.preset(CAT, '定滑轮(墙上)', 'pulley', { mount: 'wallR', angA: 180, LA: 140, loadA: 'none', labA: 'F', angB: -90, LB: 110, loadB: 'mass', labB: '' });
  PD.preset(CAT, '动滑轮', 'pulley', { mount: 'hook', wrap: 'bottom', angA: 90, LA: 120, loadA: 'none', labA: '', angB: 90, LB: 120, loadB: 'none', labB: 'F', loadC: 'block', labC: 'W' });
  PD.preset(CAT, '小车', 'cart', {});
  PD.preset(CAT, '小车(两端挡板)', 'cart', { walls: 'both' });
  PD.preset(CAT, '小车(弹簧缓冲)', 'cart', { plunger: 'right', label: 'A' });
  PD.preset(CAT, '汽车', 'car', {});
  PD.preset(CAT, '降落伞(人)', 'parachute', {});
  PD.preset(CAT, '降落伞(箱子)', 'parachute', { payload: 'box', fill: '#6c8ebf' });
  PD.preset(CAT, '橡皮泥', 'blob', {});
  PD.preset(CAT, '不规则物体(灰)', 'blob', { fillMode: 'solid', fill: '#d0d0d0', pts: '-50,20 -44,-20 -10,-36 30,-28 48,0 40,24 0,30', label: 'G' });
  PD.preset(CAT, '抛体轨迹(斜抛)', 'traj', { amark: true, apex: true, base: true });
  PD.preset(CAT, '平抛(悬崖)', 'traj', { ux: 70, uy: 0, xe: 220, ye: 180, a1: 'tri' });
  PD.preset(CAT, '频闪轨迹(速度分量)', 'traj', { dots: 6, dstyle: 'ball', varrows: 'comp', uArrow: false, dash: 'dot', ux: 80, uy: -80, xe: 300, ye: 0 });
  PD.preset(CAT, '弹簧', 'spring', {});
  PD.preset(CAT, '弹簧(螺旋)', 'spring', { style: 'coil', n: 10, amp: 12 });
  PD.preset(CAT, '斜面', 'incline', {});
  PD.preset(CAT, '斜面+木块', 'incline', { block: true });
  PD.preset(CAT, '杠杆(支点+负载)', 'beam', {});
  PD.preset(CAT, '米尺(刻度)', 'beam', { ruler: true, t: 18, loads: '', pivot: 'tri' });
  PD.preset(CAT, '跷跷板(倾斜)', 'beam', { tilt: 12, loads: '0.1, A, block, 34\n0.9, B, block, 34' });
  PD.preset(CAT, '铰链杆(墙)', 'beam', { piv: 0, pivot: 'hinge', loads: '0.5, W, down, 50\n1, 5 N, hang, 2' });
  PD.preset(CAT, '槽码', 'masshanger', {});
  PD.preset(CAT, '受力图(方块)', 'fbd', {});
  PD.preset(CAT, '受力图(质点)', 'fbd', { body: 'dot', forces: '90, 55, R\n-90, 55, mg\n150, 50, T' });
  PD.preset(CAT, '打点纸带', 'tape', {});
  PD.preset(CAT, '光闸', 'lightgate', {});
  PD.preset(CAT, '单摆', 'pendulum', {});
  PD.preset(CAT, 's-t 图', 'graph', { W: 300, H: 200, xmax: 10, ymax: 10, ticks: false, tlabels: false, xl: 't', yl: 's', funcs: '0.1*x^2' });
  PD.preset(CAT, 'a-t 图', 'graph', { W: 300, H: 180, xmax: 10, ymin: -5, ymax: 5, ticks: false, tlabels: false, xl: 't', yl: 'a', poly: '0,3 4,3 4,0 7,0 7,-2 10,-2' });

  PD.preset(CAT2, '地球', 'planet', {});
  PD.preset(CAT2, '地球(引力场线)', 'planet', { field: 12, r: 45 });
  PD.preset(CAT2, '月球', 'planet', { kind: 'moon', r: 35, fill: '#b9b9b9' });
  PD.preset(CAT2, '太阳', 'planet', { kind: 'sun', r: 55, fill: '#f6b93b' });
  PD.preset(CAT2, '气态行星', 'planet', { kind: 'gas', r: 55, fill: '#d9a066' });
  PD.preset(CAT2, '带环行星', 'planet', { kind: 'ringed', r: 40, fill: '#e3c88f' });
  PD.preset(CAT2, '火箭(有人)', 'craft', {});
  PD.preset(CAT2, '火箭(喷火)', 'craft', { crew: false, flame: true });
  PD.preset(CAT2, '太空舱(宇航员)', 'craft', { kind: 'capsule' });
  PD.preset(CAT2, '人造卫星', 'craft', { kind: 'satellite' });
  PD.preset(CAT2, '宇航员', 'stick', Object.assign(POSE(0, 35, -20, -35, 20, 12, -5, -12, 5), { helmet: true, feet: false }));
})();
