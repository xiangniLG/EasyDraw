/* 第四册 · 电与磁（三）：电磁感应、电动机与发电机、变压器与输电（依赖 circuit.js、electro.js）
   电动机/发电机(立体图 + 端视图, 换向器/集电环, 随角度自动定电流和受力) · 金属棒在导轨上运动 · 磁棒穿过线圈 · 涡电流(磁铁在铝箔卷中下坠)
   磁通量 Φ = BA cosθ · 变压器(符号/方形铁心/铁棒) */
(function () {
  'use strict';
  const f = PD.f, S = PD.strokeAttr, T = PD.tex, L = PD.lab, pt = L.pt, clamp = L.clamp;
  const D2R = Math.PI / 180, R2D = 180 / Math.PI, TAU = Math.PI * 2;
  const C1 = 'DSE-物理/电与磁/电磁感应', C0 = 'DSE-物理/电与磁/磁场中受到的力', C2 = 'DSE-物理/电与磁/变压器';
  const sd = (p) => S(p, { dash: 'solid' });
  const RED = '#d9453b', BLU = '#4a67c9', GRN = '#3c9a4a', PUR = '#8e5cc9', GOLD = '#d4b04c';
  const comp = (ctx, props) => PD.shapes.comp.render(Object.assign({}, PD.STYLE_DEF, PD.shapes.comp.defaults, props), ctx);
  const dotX = (p, x, y, s, r) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#ffffff" ${S(p, { dash: 'solid', sw: 1.1 })}/>` + (s > 0 ? `<path d="M${pt(x - r * 0.6, y - r * 0.6)}l${f(r * 1.2)},${f(r * 1.2)}M${pt(x - r * 0.6, y + r * 0.6)}l${f(r * 1.2)},${f(-r * 1.2)}" ${S(p, { dash: 'solid', sw: 1.2 })}/>` : s < 0 ? `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 0.28)}" fill="${p.stroke}"/>` : '');

  /* ================= 电动机 / 发电机 ================= */
  // 约定：N 在左，S 在右（B 向右）；从正面看线圈顺时针转（θ 减小）。
  // θ：线圈平面与磁场的夹角，0° = 水平。边 A(W) 在角 θ，边 B(Z) 在 θ+180°。
  // 线圈电流（+1 = 流向里面 ⊗）：
  //   电动机：左边那条边的电流总是 ⊗（换向器保证）→ 左边受力向上
  //   发电机：感生电动势 ∝ cos(边的角度)，交流发电机直接输出；直流发电机经换向器整流
  const MODES = [['dcmotor', '直流电动机'], ['dcgen', '直流发电机'], ['acgen', '交流发电机']];
  PD.register({
    type: 'dynamo', name: '电动机/发电机(立体图/端视图)',
    defaults: { mode: 'dcmotor', view: '3d', th: 0, a: 60, b: 120, g: 130, mag: true, circuit: true, labels: true, curArrows: true, forces: true, rot: true, turns: 3, lsize: 15, shading: true },
    fields: [
      { k: 'mode', t: 'sel', l: '类型', o: MODES, rebuild: true }, { k: 'view', t: 'sel', l: '视图', o: [['3d', '立体图'], ['end', '端视图(从正面看)']], rebuild: true },
      { k: 'th', t: 'range', l: '线圈角度 θ(0 = 水平)', min: -180, max: 180, step: 5 }, { k: 'a', t: 'num', l: '线圈半宽' }, { k: 'b', t: 'num', l: '线圈长(纵深)', when: (p) => p.view === '3d' },
      { k: 'g', t: 'num', l: '两磁极距离(半)' }, { k: 'turns', t: 'num', l: '线圈匝数(画几圈)', min: 1, when: (p) => p.view === '3d' },
      { k: 'mag', t: 'bool', l: '磁极' }, { k: 'circuit', t: 'bool', l: '外电路(电池/灯泡)' }, { k: 'labels', t: 'bool', l: '标 W X Y Z' },
      { k: 'curArrows', t: 'bool', l: '电流方向' }, { k: 'forces', t: 'bool', l: '受力 F(电动机) / 运动方向(发电机)' }, { k: 'rot', t: 'bool', l: '转动方向箭头' },
      { k: 'shading', t: 'bool', l: '光影' }, { k: 'lsize', t: 'num', l: '字号' },
    ],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const th = (+p.th || 0) * D2R, a = +p.a, g = +p.g, gen = p.mode !== 'dcmotor', ac = p.mode === 'acgen', ls = p.lsize;
      const angA = th, angB = th + Math.PI;
      // 线圈两边的电流（+1 = 入纸 ⊗，即流向里面）
      const curOf = (ang) => {
        const c = Math.cos(ang);
        // 电动机：左边电流 ⊙(出纸) → F = IL×B 向上 → 顺时针转（换向器保证）
        if (!gen) return Math.abs(c) < 1e-6 ? 0 : c < 0 ? -1 : 1;
        // 发电机：顺时针转时左边向上运动，v×B 指向入纸 → ⊗
        return Math.abs(c) < 0.03 ? 0 : c < 0 ? 1 : -1;
      };
      const iA = curOf(angA), iB = curOf(angB);
      let o = '';
      if (p.view === 'end') {
        const H = 2.6 * a, rc = a * 0.32, cy = 0;
        if (p.mag) o += `<rect x="${f(-g - 30)}" y="${f(-H / 2)}" width="30" height="${f(H)}" fill="${RED}" ${sd(p)}/><rect x="${f(g)}" y="${f(-H / 2)}" width="30" height="${f(H)}" fill="${BLU}" ${sd(p)}/>` + T(ctx, 'N', -g - 15, 0, { size: ls + 2, italic: false, color: '#fff' }) + T(ctx, 'S', g + 15, 0, { size: ls + 2, italic: false, color: '#fff' });
        const A = [a * Math.cos(angA), -a * Math.sin(angA)], Bp = [-A[0], -A[1]];
        o += `<line x1="${f(A[0])}" y1="${f(A[1])}" x2="${f(Bp[0])}" y2="${f(Bp[1])}" stroke="#7fbf7f" stroke-width="${f(a * 0.22)}"/><line x1="${f(A[0])}" y1="${f(A[1])}" x2="${f(Bp[0])}" y2="${f(Bp[1])}" ${S(p, { dash: 'solid', sw: 0.8 })}/>`;
        // 换向器 / 集电环
        if (ac) o += `<circle r="${f(rc)}" fill="none" stroke="${GOLD}" stroke-width="${f(rc * 0.35)}"/>`;
        else { const arc = (a0, a1, col) => `<path d="M${pt(rc * Math.cos(a0), -rc * Math.sin(a0))}A${f(rc)},${f(rc)} 0 0 0 ${pt(rc * Math.cos(a1), -rc * Math.sin(a1))}" fill="none" stroke="${col}" stroke-width="${f(rc * 0.42)}"/>`; o += arc(th - Math.PI / 2 + 0.12, th + Math.PI / 2 - 0.12, RED) + arc(th + Math.PI / 2 + 0.12, th + 1.5 * Math.PI - 0.12, '#5aa9e6'); }
        o += `<rect x="${f(-rc - rc * 0.9)}" y="${f(-rc * 0.22)}" width="${f(rc * 0.7)}" height="${f(rc * 0.44)}" fill="#999" ${sd(p)}/><rect x="${f(rc + rc * 0.2)}" y="${f(-rc * 0.22)}" width="${f(rc * 0.7)}" height="${f(rc * 0.44)}" fill="#999" ${sd(p)}/>`;
        o += dotX(p, A[0], A[1], iA, a * 0.13) + dotX(p, Bp[0], Bp[1], iB, a * 0.13);
        if (p.labels) { const off = (q, s2) => [q[0] * (1 + 0.32), q[1] * (1 + 0.32)]; const qa = off(A), qb = off(Bp); o += T(ctx, 'W', qa[0], qa[1], { size: ls, color: p.stroke, halo: true }) + T(ctx, 'Z', qb[0], qb[1], { size: ls, color: p.stroke, halo: true }); }
        if (p.forces) [[A, iA, angA], [Bp, iB, angB]].forEach(([q, i, an]) => {
          if (!gen && i) o += L.arrow(p, q[0], q[1] + (i < 0 ? -a * 0.15 : a * 0.15), q[0], q[1] + (i < 0 ? -a * 0.75 : a * 0.75), { sw: 1.8, color: '#d62828' });
          if (gen) { const v = [Math.sin(an), Math.cos(an)]; o += L.arrow(p, q[0], q[1], q[0] + v[0] * a * 0.6, q[1] + v[1] * a * 0.6, { sw: 1.5 }); }
        });
        if (p.rot) o += `<path d="M${pt(-a * 0.55, -a * 0.12)}A${f(a * 0.56)},${f(a * 0.56)} 0 1 1 ${pt(-a * 0.2, a * 0.52)}" fill="none" ${S(p, { dash: 'solid', sw: 1.4 })}/>` + PD.arrowHead(-a * 0.2 - 6, a * 0.52 + 1, Math.PI * 0.9, 8, 'tri', p.stroke, 1.4);
        if (p.circuit) {
          const yb = H / 2 + 40, xl = -rc - rc * 0.9, xr = rc + rc * 0.9;
          o += `<path d="M${pt(xl, 0)}H${f(-g + 20)}V${f(yb)}H${f(-30)}M30,${f(yb)}H${f(g - 20)}V0H${f(xr)}" fill="none" ${sd(p)}/>`;
          o += `<g transform="translate(0,${f(yb)})">${comp(ctx, gen ? { kind: 'bulb', L: 60, lit: Math.abs(iA) > 0, stroke: p.stroke } : { kind: 'cell', L: 60, stroke: p.stroke, pm: false })}</g>`;
          if (p.curArrows) { const cw = gen ? (ac ? iA : -1) : 1; if (cw) o += PD.arrowHead(-g + 20, yb / 2, cw > 0 ? Math.PI / 2 : -Math.PI / 2, 8, 'tri', '#8e5cc9', 1) + PD.arrowHead(g - 20, yb / 2, cw > 0 ? -Math.PI / 2 : Math.PI / 2, 8, 'tri', '#8e5cc9', 1); }
        }
        return o;
      }
      // ---------- 立体图（斜二测：z 轴指向右上） ----------
      const b = +p.b, k = 0.5, P = (x, y, z) => [x + z * k * 0.72, -y - z * k * 0.7], Q = (x, y, z) => pt(...P(x, y, z));
      const box = (x0, x1, y0, y1, z0, z1, col) => `<polygon points="${Q(x0, y1, z0)} ${Q(x1, y1, z0)} ${Q(x1, y1, z1)} ${Q(x0, y1, z1)}" fill="${PD.shade(col, 0.25)}" ${sd(p)}/><polygon points="${Q(x1, y0, z0)} ${Q(x1, y0, z1)} ${Q(x1, y1, z1)} ${Q(x1, y1, z0)}" fill="${PD.shade(col, -0.15)}" ${sd(p)}/><polygon points="${Q(x0, y0, z0)} ${Q(x1, y0, z0)} ${Q(x1, y1, z0)} ${Q(x0, y1, z0)}" fill="${col}" ${sd(p)}/>`;
      const Hm = a * 1.3, zc = -26, rc = a * 0.3;
      if (p.mag) { o += box(g, g + 26, -Hm, Hm, -10, b + 20, BLU) + box(-g - 26, -g, -Hm, Hm, -10, b + 20, RED); const nN = P(-g - 13, 0, -10), nS = P(g + 13, 0, -10); o += T(ctx, 'N', nN[0], nN[1], { size: ls + 2, italic: false, color: '#fff' }) + T(ctx, 'S', nS[0], nS[1], { size: ls + 2, italic: false, color: '#fff' }); }
      const sA = [a * Math.cos(angA), a * Math.sin(angA)], sB = [-sA[0], -sA[1]], n = Math.max(1, Math.round(+p.turns));
      let coil = '';
      for (let j = 0; j < n; j++) { const e = 1 + (j - (n - 1) / 2) * 0.035; coil += `M${Q(sA[0] * e, sA[1] * e, 0)}L${Q(sA[0] * e, sA[1] * e, b)}L${Q(sB[0] * e, sB[1] * e, b)}L${Q(sB[0] * e, sB[1] * e, 0)}`; }
      o += `<path d="${coil}" fill="none" stroke="#3c9a4a" stroke-width="${f(Math.max(1, (+p.sw || 1.5) * 0.9))}" stroke-linejoin="round"/>`;
      // 线圈接到换向器 / 集电环
      o += `<path d="M${Q(sA[0], sA[1], 0)}L${Q(rc * Math.cos(angA), rc * Math.sin(angA), zc + 6)}M${Q(sB[0], sB[1], 0)}L${Q(rc * Math.cos(angB), rc * Math.sin(angB), ac ? zc - 14 : zc + 6)}" fill="none" stroke="#3c9a4a" stroke-width="1.2"/>`;
      const c0 = P(0, 0, zc), ringAt = (z, col, w) => { const c = P(0, 0, z); return `<circle cx="${f(c[0])}" cy="${f(c[1])}" r="${f(rc)}" fill="none" stroke="${col}" stroke-width="${f(w)}"/>`; };
      let brushY = 0;
      if (ac) { o += ringAt(zc, GOLD, rc * 0.45) + ringAt(zc - 20, GOLD, rc * 0.45); brushY = -rc; }
      else { const arc = (a0, a1, col) => `<path d="M${pt(c0[0] + rc * Math.cos(a0), c0[1] - rc * Math.sin(a0))}A${f(rc)},${f(rc)} 0 0 0 ${pt(c0[0] + rc * Math.cos(a1), c0[1] - rc * Math.sin(a1))}" fill="none" stroke="${col}" stroke-width="${f(rc * 0.5)}"/>`; o += arc(th - Math.PI / 2 + 0.15, th + Math.PI / 2 - 0.15, RED) + arc(th + Math.PI / 2 + 0.15, th + 1.5 * Math.PI - 0.15, '#5aa9e6'); }
      const br = (x, y, z) => { const q = P(x, y, z); return `<rect x="${f(q[0] - 12)}" y="${f(q[1] - 6)}" width="24" height="12" rx="2" fill="#a0a4a8" ${sd(p)}/>`; };
      const bl = ac ? P(0, -rc - 6, zc) : P(-rc - 12, 0, zc), brr = ac ? P(0, -rc - 6, zc - 20) : P(rc + 12, 0, zc);
      o += ac ? br(0, -rc - 6, zc) + br(0, -rc - 6, zc - 20) : br(-rc - 12, 0, zc) + br(rc + 12, 0, zc);
      void brushY;
      if (p.labels) {
        const lb = (t, x, y, z, dx, dy) => { const q = P(x, y, z); return T(ctx, t, q[0] + dx, q[1] + dy, { size: ls, color: p.stroke, halo: true }); };
        o += lb('W', sA[0], sA[1], 0, -12, 4) + lb('X', sA[0], sA[1], b, -4, -12) + lb('Y', sB[0], sB[1], b, 10, -8) + lb('Z', sB[0], sB[1], 0, 10, 10);
      }
      if (p.curArrows) [[sA, iA], [sB, iB]].forEach(([s2, i]) => { if (!i) return; const m = P(s2[0], s2[1], b / 2), d = P(s2[0], s2[1], b / 2 + i * 10); o += PD.arrowHead(d[0], d[1], Math.atan2(d[1] - m[1], d[0] - m[0]), 9, 'tri', '#8e5cc9', 1); });
      if (p.forces) [[sA, iA, angA], [sB, iB, angB]].forEach(([s2, i, an]) => {
        const m = P(s2[0], s2[1], b * 0.5);
        if (!gen && i) o += L.arrow(p, m[0] + 8, m[1] + (i < 0 ? -8 : 8), m[0] + 8, m[1] + (i < 0 ? -44 : 44), { sw: 1.8, color: '#d62828' });
        if (gen) { const v = [Math.sin(an), -Math.cos(an)], e = P(s2[0] + v[0] * 36, s2[1] + v[1] * 36, b * 0.5); o += L.arrow(p, m[0], m[1], e[0], e[1], { sw: 1.5 }); }
      });
      if (p.rot) { const c = P(0, a * 1.15, b); o += `<path d="M${pt(c[0] - 30, c[1] + 6)}Q${pt(c[0], c[1] - 18)} ${pt(c[0] + 30, c[1] + 6)}" fill="none" stroke="#222" stroke-width="3"/>` + PD.arrowHead(c[0] + 34, c[1] + 12, 1, 10, 'full', '#222', 2); }
      if (p.circuit) {
        const yb = Math.max(bl[1], brr[1]) + 60, xl = bl[0] - 8, xr = brr[0] + (ac ? 30 : 8), mx = (xl + xr) / 2;
        o += `<path d="M${pt(bl[0] - (ac ? 0 : 12), bl[1])}${ac ? `V${f(yb)}` : `H${f(xl - 40)}V${f(yb)}`}H${f(mx - 32)}M${pt(mx + 32, yb)}H${f(xr + 40)}V${f(brr[1])}H${f(brr[0] + (ac ? 0 : 12))}" fill="none" ${sd(p)}/>`;
        o += `<g transform="translate(${pt(mx, yb)})">${comp(ctx, gen ? { kind: 'bulb', L: 64, lit: Math.abs(iA) > 0, stroke: p.stroke } : { kind: 'cell', L: 64, n: 1, stroke: p.stroke, pm: false })}</g>`;
        if (p.curArrows) { const cw = gen ? (ac ? iA : -1) : 1; if (cw) o += PD.arrowHead(xr + 40, (brr[1] + yb) / 2, cw > 0 ? -Math.PI / 2 : Math.PI / 2, 8, 'tri', '#8e5cc9', 1) + PD.arrowHead(xl - (ac ? 0 : 40), (bl[1] + yb) / 2, cw > 0 ? Math.PI / 2 : -Math.PI / 2, 8, 'tri', '#8e5cc9', 1); }
        if (gen && p.labels) o += T(ctx, 'P', mx - 12, yb + 22, { size: ls, color: p.stroke }) + T(ctx, 'Q', mx + 12, yb + 22, { size: ls, color: p.stroke });
      }
      return o;
    },
  });

  /* ================= 金属棒在导轨上运动 ================= */
  PD.register({
    type: 'rails', name: '金属棒在导轨上运动(感生电流)',
    defaults: { L: 320, gap: 120, xr: 220, B: 'in', vdir: 'right', end: 'resistor', cur: true, force: true, labels: true, lsize: 16 },
    fields: [
      { k: 'L', t: 'num', l: '导轨长' }, { k: 'gap', t: 'num', l: '导轨间距 l' }, { k: 'xr', t: 'num', l: '金属棒位置' }, { k: 'B', t: 'sel', l: '磁场', o: [['in', '× 入纸面'], ['out', '• 出纸面']] },
      { k: 'vdir', t: 'sel', l: '棒的运动方向', o: [['right', '向右'], ['left', '向左']] }, { k: 'end', t: 'sel', l: '左端接', o: [['resistor', '电阻'], ['galv', '电流计'], ['bulb', '灯泡'], ['none', '不接(开路)']] },
      { k: 'cur', t: 'bool', l: '感生电流方向' }, { k: 'force', t: 'bool', l: '棒受到的磁力 F(楞次定律)' }, { k: 'labels', t: 'bool', l: '标 v、l、B' }, { k: 'lsize', t: 'num', l: '字号' },
    ],
    style: ['stroke', 'sw', 'opacity'],
    render(p, ctx) {
      const Lr = +p.L, g = +p.gap / 2, xr = clamp(+p.xr, 20, Lr - 10), vs = p.vdir === 'left' ? -1 : 1, Bz = p.B === 'out' ? 1 : -1, ls = p.lsize;
      let o = `<g transform="translate(${f(Lr / 2)},0)">${PD.shapes.ufield.render(Object.assign({}, PD.shapes.ufield.defaults, { kind: p.B, W: Lr + 20, H: 2 * g + 40, gap: 30, frame: 'none', label: '', stroke: p.stroke, sw: p.sw }), ctx)}</g>`;
      o += `<line x1="0" y1="${f(-g)}" x2="${f(Lr)}" y2="${f(-g)}" ${S(p, { dash: 'solid', sw: 3 })}/><line x1="0" y1="${f(g)}" x2="${f(Lr)}" y2="${f(g)}" ${S(p, { dash: 'solid', sw: 3 })}/>`;
      if (p.end !== 'none') o += `<g transform="translate(0,0) rotate(90)">${comp(ctx, { kind: p.end, L: 2 * g, stroke: p.stroke })}</g>`;
      o += `<rect x="${f(xr - 5)}" y="${f(-g - 14)}" width="10" height="${f(2 * g + 28)}" rx="3" fill="#b0b5bb" ${sd(p)}/>`;
      // 感生电流方向：v × B（数学坐标 y 向上）：v=(vs,0,0)，B=(0,0,Bz) → (0, -vs*Bz, 0)
      const iy = -vs * Bz; // +1 = 数学向上 = SVG 向上
      if (p.cur && p.end !== 'none') {
        o += L.arrow(p, xr + 18, iy > 0 ? 14 : -14, xr + 18, iy > 0 ? -16 : 16, { sw: 1.6, color: '#d62828' }) + T(ctx, 'I', xr + 30, 0, { size: ls, anchor: 'start', color: '#d62828' });
        o += PD.arrowHead(Lr * 0.12, -g, iy > 0 ? Math.PI : 0, 9, 'tri', '#d62828', 1) + PD.arrowHead(Lr * 0.12, g, iy > 0 ? 0 : Math.PI, 9, 'tri', '#d62828', 1);
      }
      o += L.arrow(p, xr, -g - 26, xr + vs * 50, -g - 26, { sw: 1.8 }) + (p.labels ? T(ctx, 'v', xr + vs * 25, -g - 40, { size: ls, color: p.stroke }) : '');
      if (p.force && p.end !== 'none') o += L.arrow(p, xr, g + 26, xr - vs * 46, g + 26, { sw: 1.8, color: '#1e5fbf' }) + T(ctx, 'F', xr - vs * 23, g + 40, { size: ls, color: '#1e5fbf' });
      if (p.labels) o += L.dim(p, ctx, Lr + 24, -g, Lr + 24, g, 'l', { off: -12, size: ls }) + T(ctx, 'B', Lr + 10, -g - 30, { size: ls, color: p.stroke });
      return o;
    },
  });

  /* ================= 磁棒下坠穿过线圈 ================= */
  PD.register({
    type: 'fallcoil', name: '磁棒下坠穿过线圈(胶管)',
    defaults: { H: 300, d: 56, my: 40, coilY: 150, turns: 8, sensor: true, labels: true, lsize: 14, arrow: true },
    fields: [{ k: 'H', t: 'num', l: '胶管高' }, { k: 'd', t: 'num', l: '胶管直径' }, { k: 'my', t: 'num', l: '磁棒位置(离管顶)' }, { k: 'coilY', t: 'num', l: '线圈位置(离管顶)' }, { k: 'turns', t: 'num', l: '线圈匝数' },
      { k: 'arrow', t: 'bool', l: '下坠箭头' }, { k: 'sensor', t: 'bool', l: '电压感应器' }, { k: 'labels', t: 'bool', l: '文字标注' }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const H = +p.H, r = +p.d / 2, ry = r * 0.28, cy = +p.coilY, ls = p.lsize, my = +p.my, mw = r * 0.55, mh = r * 1.4;
      let o = `<path d="M${pt(-r, 0)}V${f(H)}A${f(r)},${f(ry)} 0 0 0 ${pt(r, H)}V0" fill="#e6f0f8" fill-opacity="0.6" ${sd(p)}/><ellipse cx="0" cy="0" rx="${f(r)}" ry="${f(ry)}" fill="#f4f8fb" ${sd(p)}/>`;
      o += `<rect x="${f(-mw / 2)}" y="${f(my)}" width="${f(mw)}" height="${f(mh / 2)}" fill="${BLU}" ${sd(p)}/><rect x="${f(-mw / 2)}" y="${f(my + mh / 2)}" width="${f(mw)}" height="${f(mh / 2)}" fill="${RED}" ${sd(p)}/>` + T(ctx, 'S', 0, my + mh / 4, { size: mw * 0.6, italic: false, color: '#fff' }) + T(ctx, 'N', 0, my + (3 * mh) / 4, { size: mw * 0.6, italic: false, color: '#fff' });
      let coil = ''; const n = Math.max(1, Math.round(+p.turns));
      for (let i = 0; i < n; i++) { const y = cy - n * 2 + i * 4; coil += `<ellipse cx="0" cy="${f(y)}" rx="${f(r + 4)}" ry="${f(ry + 2)}" fill="none" stroke="#2e9e3e" stroke-width="2"/>`; }
      o += coil + `<path d="M${pt(r + 4, cy + 2)}C${pt(r + 60, cy + 10)} ${pt(r + 50, cy + 60)} ${pt(r + 100, cy + 80)}M${pt(r + 4, cy - 4)}C${pt(r + 80, cy - 4)} ${pt(r + 80, cy + 50)} ${pt(r + 120, cy + 70)}" fill="none" stroke="#c62828" stroke-width="1.8"/>`;
      if (p.sensor) o += `<g transform="translate(${pt(r + 150, cy + 86)})">${PD.shapes.siggen.render(Object.assign({}, PD.shapes.siggen.defaults, { w: 90, h: 50, disp: 'V', title: p.labels ? '电压感应器' : '', stroke: p.stroke, sw: p.sw, lsize: ls }), ctx)}</g>`;
      if (p.arrow) o += L.arrow(p, -r - 22, my, -r - 22, my + mh + 30, { sw: 2, color: GRN });
      if (p.labels) { const t = (s, x, y) => T(ctx, s, x, y, { size: ls, anchor: 'start', italic: false, color: p.stroke, halo: true }); o += t('磁棒', r + 16, my + mh / 2) + t('胶管', r + 16, (my + mh + cy) / 2) + t('线圈', r + 16, cy - n * 2 - 10); }
      return o;
    },
  });

  /* ================= 涡电流：磁铁在铝箔卷中下坠 ================= */
  PD.register({
    type: 'eddytube', name: '涡电流(磁铁在铝箔卷中下坠)',
    defaults: { H: 260, d: 76, my: 110, loops: true, arrow: true, labels: true, lsize: 13, fill: '#c7ccd2' },
    fields: [{ k: 'H', t: 'num', l: '铝箔卷高' }, { k: 'd', t: 'num', l: '直径' }, { k: 'my', t: 'num', l: '磁铁位置' }, { k: 'loops', t: 'bool', l: '感生电流环' }, { k: 'arrow', t: 'bool', l: '下坠箭头' }, { k: 'labels', t: 'bool', l: '文字标注' }, { k: 'fill', t: 'color', l: '铝箔颜色' }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const H = +p.H, r = +p.d / 2, ry = r * 0.25, my = +p.my, ls = p.lsize, mh = r * 0.9, mw = r * 1.3;
      let o = `<path d="M${pt(-r, 0)}V${f(H)}A${f(r)},${f(ry)} 0 0 0 ${pt(r, H)}V0" fill="${p.fill}" fill-opacity="0.35" ${sd(p)}/><ellipse cx="0" cy="${f(H)}" rx="${f(r)}" ry="${f(ry)}" fill="none" ${S(p, { dash: 'dash', sw: 0.9 })}/><ellipse cx="0" cy="0" rx="${f(r)}" ry="${f(ry)}" fill="none" ${sd(p)}/>`;
      o += `<rect x="${f(-mw / 2)}" y="${f(my - mh / 2)}" width="${f(mw)}" height="${f(mh / 2)}" fill="${BLU}" ${sd(p)}/><rect x="${f(-mw / 2)}" y="${f(my)}" width="${f(mw)}" height="${f(mh / 2)}" fill="${RED}" ${sd(p)}/><ellipse cx="0" cy="${f(my - mh / 2)}" rx="${f(mw / 2)}" ry="${f(ry * 0.7)}" fill="${PD.shade(BLU, 0.2)}" ${sd(p)}/>`;
      o += T(ctx, 'S', 0, my - mh / 4, { size: mh * 0.38, italic: false, color: '#fff' }) + T(ctx, 'N', 0, my + mh / 4, { size: mh * 0.38, italic: false, color: '#fff' });
      if (p.loops) [[my - mh - 18, -1], [my - mh - 32, -1], [my + mh + 18, 1], [my + mh + 32, 1]].forEach(([y, s]) => { o += `<ellipse cx="0" cy="${f(y)}" rx="${f(r - 2)}" ry="${f(ry)}" fill="none" stroke="${PUR}" stroke-width="1.3"/>` + PD.arrowHead(s * 4, y + ry, s > 0 ? 0 : Math.PI, 7, 'tri', PUR, 1) + PD.arrowHead(-s * 4, y - ry, s > 0 ? Math.PI : 0, 7, 'tri', PUR, 1); });
      if (p.arrow) o += L.arrow(p, -mw / 2 + 4, my - mh / 2 + 4, -mw / 2 + 4, my + mh / 2 - 4, { sw: 2, color: GRN });
      if (p.labels) { const t = (s, y) => T(ctx, s, r + 14, y, { size: ls, anchor: 'start', italic: false, color: PUR }); o += t('感生电流以', my - mh - 32) + t('吸引磁铁南极', my - mh - 16) + t('感生电流以', my + mh + 18) + t('排斥磁铁北极', my + mh + 34); }
      return o;
    },
  });

  /* ================= 磁通量 Φ = BA cosθ ================= */
  PD.register({
    type: 'fluxloop', name: '磁通量 Φ = BA cosθ(倾斜线圈)',
    defaults: { R: 70, th: 35, nB: 1, Blen: 300, normal: true, labels: true, fill: '#f5e04a', lsize: 16 },
    fields: [{ k: 'R', t: 'num', l: '线圈半径' }, { k: 'th', t: 'num', l: 'θ(B 与法线夹角)°', step: 5 }, { k: 'nB', t: 'num', l: '磁场线数', min: 0 }, { k: 'Blen', t: 'num', l: '磁场线长' },
      { k: 'normal', t: 'bool', l: '法线 + θ' }, { k: 'labels', t: 'bool', l: '标 A、B' }, { k: 'fill', t: 'color', l: '线圈颜色' }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const R = +p.R, th = clamp(+p.th, 0, 89) * D2R, rx = R * Math.max(0.12, Math.sin(th) * 0.55 + 0.12), tilt = 18, ls = p.lsize, Bl = +p.Blen, n = Math.round(+p.nB);
      const back = (y) => `<line x1="${f(-Bl / 2)}" y1="${f(y)}" x2="0" y2="${f(y)}" stroke="#e8892b" stroke-width="1.4"/>`, front = (y) => `<line x1="0" y1="${f(y)}" x2="${f(Bl / 2)}" y2="${f(y)}" stroke="#e8892b" stroke-width="1.4"/>` + PD.arrowHead(Bl / 2, y, 0, 9, 'tri', '#e8892b', 1.4);
      const ys = []; for (let k = 0; k < n; k++) ys.push(n > 1 ? -R * 0.5 + (R * k) / (n - 1) : 0);
      let o = ys.map(back).join('');
      o += `<g transform="rotate(${tilt})"><ellipse rx="${f(rx)}" ry="${f(R)}" fill="${p.fill}" stroke="#666" stroke-width="5"/><ellipse rx="${f(rx)}" ry="${f(R)}" fill="none" stroke="#bbb" stroke-width="2"/></g>`;
      if (p.normal) {
        const nl = R * 1.1, na = Math.PI + th;
        o += `<line x1="0" y1="0" x2="${f(nl * Math.cos(na))}" y2="${f(-nl * Math.sin(na))}" ${S(p, { dash: 'dash', sw: 1 })}/>` + L.angArc(p, ctx, [0, 0], Math.PI, Math.atan2(-Math.sin(na), Math.cos(na)), 34, '\\theta', ls);
        if (p.labels) o += T(ctx, '法线', nl * Math.cos(na) - 6, -nl * Math.sin(na) - 10, { size: ls - 2, anchor: 'end', italic: false, color: p.stroke });
      }
      o += ys.map(front).join('');
      if (p.labels) o += T(ctx, 'A', rx + 24, -R * 0.8, { size: ls, color: p.stroke }) + `<line x1="${f(rx * 0.4)}" y1="${f(-R * 0.4)}" x2="${f(rx + 18)}" y2="${f(-R * 0.75)}" ${S(p, { dash: 'solid', sw: 0.8 })}/>` + T(ctx, 'B', -Bl / 2 + 8, (ys[0] || 0) + 14, { size: ls, color: p.stroke });
      return o;
    },
  });

  /* ================= 变压器 ================= */
  PD.register({
    type: 'xformer', name: '变压器(符号/方形铁心/铁棒)',
    defaults: { style: 'symbol', Np: 4, Ns: 4, lead: 40, cores: 2, terms: true, vlabels: true, Vp: 'V_p', Vs: 'V_s', NpL: 'N_p', NsL: 'N_s', boxes: true, labels: true, load: true, src: true, lsize: 15 },
    ports: (p) => {
      if (p.style === 'core') return [[-180, -55, -1, 0], [-180, 55, -1, 0], [180, -55, 1, 0], [180, 55, 1, 0]];
      if (p.style === 'rod') return [[-170, -70, 0, -1], [-50, -70, 0, -1], [50, -70, 0, -1], [170, -70, 0, -1]];
      const r = 7, hp = Math.max(+p.Np, +p.Ns) * r, x = 14 + 2 + +p.lead; return [[-x, -hp, -1, 0], [-x, hp, -1, 0], [x, -hp, 1, 0], [x, hp, 1, 0]];
    },
    fields: [
      { k: 'style', t: 'sel', l: '画法', o: [['symbol', '电路符号'], ['core', '方形铁心(原/副线圈)'], ['rod', '铁棒上两个线圈']], rebuild: true },
      { k: 'Np', t: 'num', l: '原线圈匝数(画几圈)', min: 1 }, { k: 'Ns', t: 'num', l: '副线圈匝数(画几圈)', min: 1 },
      { k: 'lead', t: 'num', l: '引线长', when: (p) => p.style === 'symbol' }, { k: 'cores', t: 'num', l: '铁心线数', when: (p) => p.style === 'symbol' },
      { k: 'terms', t: 'bool', l: '端子', when: (p) => p.style === 'core' }, { k: 'vlabels', t: 'bool', l: '标 V_p、V_s', when: (p) => p.style === 'core' }, { k: 'Vp', t: 'text', l: 'V_p 标签', when: (p) => p.style === 'core' }, { k: 'Vs', t: 'text', l: 'V_s 标签', when: (p) => p.style === 'core' },
      { k: 'NpL', t: 'text', l: 'N_p 标签', when: (p) => p.style === 'core' }, { k: 'NsL', t: 'text', l: 'N_s 标签', when: (p) => p.style === 'core' }, { k: 'boxes', t: 'bool', l: '虚线框 原线圈/副线圈', when: (p) => p.style === 'core' },
      { k: 'src', t: 'bool', l: '交流电源', when: (p) => p.style === 'rod' }, { k: 'load', t: 'bool', l: '负荷', when: (p) => p.style === 'rod' }, { k: 'labels', t: 'bool', l: '文字标注' }, { k: 'lsize', t: 'num', l: '字号' },
    ],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const ls = p.lsize, Np = Math.max(1, Math.round(+p.Np)), Ns = Math.max(1, Math.round(+p.Ns));
      if (p.style === 'symbol') {
        const r = 7, hp = Math.max(Np, Ns) * r, coil = (n, x, sg) => { const h = n * r; let d = `M${pt(x, -h)}`; for (let i = 0; i < n; i++) d += `a${r},${r} 0 0 ${sg > 0 ? 1 : 0} 0,${2 * r}`; return { d, h }; };
        const cp = coil(Np, -14, 1), cs = coil(Ns, 14, -1), x = 16 + +p.lead;
        let o = `<path d="${cp.d}" fill="none" ${sd(p)}/><path d="${cs.d}" fill="none" ${sd(p)}/>`;
        o += `<path d="M${pt(-14, -cp.h)}V${f(-hp)}H${f(-x)}M${pt(-14, cp.h)}V${f(hp)}H${f(-x)}M${pt(14, -cs.h)}V${f(-hp)}H${f(x)}M${pt(14, cs.h)}V${f(hp)}H${f(x)}" fill="none" ${sd(p)}/>`;
        const nc = Math.round(+p.cores); for (let k = 0; k < nc; k++) { const xx = (k - (nc - 1) / 2) * 4; o += `<line x1="${f(xx)}" y1="${f(-hp - 4)}" x2="${f(xx)}" y2="${f(hp + 4)}" ${S(p, { dash: 'solid', sw: 1.2 })}/>`; }
        return o;
      }
      if (p.style === 'core') {
        const W = 160, H = 190, t = 40, iron = L.metal(ctx, '#7d8288', -H / 2, H / 2, true);
        let o = `<path d="M${pt(-W / 2, -H / 2)}H${f(W / 2)}V${f(H / 2)}H${f(-W / 2)}ZM${pt(-W / 2 + t, -H / 2 + t)}V${f(H / 2 - t)}H${f(W / 2 - t)}V${f(-H / 2 + t)}Z" fill="${iron}" fill-rule="evenodd" ${sd(p)}/>`;
        const wind = (x0, n, side) => { let d = ''; for (let i = 0; i < n; i++) { const y = -55 + (110 * (i + 0.5)) / n; d += `M${pt(x0 - 4, y + 3)}L${pt(x0 + t + 4, y - 3)}`; } return `<path d="${d}" stroke="${PUR}" stroke-width="1.4"/>` + `<path d="M${pt(side < 0 ? x0 - 4 : x0 + t + 4, -55)}H${f(side * 172)}M${pt(side < 0 ? x0 - 4 : x0 + t + 4, 55)}H${f(side * 172)}" fill="none" stroke="${PUR}" stroke-width="1.2"/>`; };
        o += wind(-W / 2, Np, -1) + wind(W / 2 - t, Ns, 1);
        if (p.terms) [-1, 1].forEach((sg) => [-55, 55].forEach((y) => (o += `<circle cx="${f(sg * 180)}" cy="${f(y)}" r="5" fill="#fff" ${sd(p)}/>`)));
        if (p.vlabels) [[-1, p.Vp], [1, p.Vs]].forEach(([sg, lab]) => { const x = sg * 212; o += `<path d="M${pt(sg * 186, -55)}H${f(x)}V${f(55)}H${f(sg * 186)}" fill="none" stroke="${GRN}" stroke-width="1.2"/>` + PD.arrowHead(sg * 187, -55, sg > 0 ? Math.PI : 0, 7, 'tri', GRN, 1) + PD.arrowHead(sg * 187, 55, sg > 0 ? Math.PI : 0, 7, 'tri', GRN, 1) + T(ctx, lab, x + sg * 14, 0, { size: ls + 1, color: p.stroke, halo: true }); });
        if (p.NpL) o += T(ctx, p.NpL, -W / 2 - 30, 0, { size: ls, color: p.stroke, halo: true }); if (p.NsL) o += T(ctx, p.NsL, W / 2 + 30, 0, { size: ls, color: p.stroke, halo: true });
        if (p.boxes) { o += `<rect x="${f(-W / 2 - 18)}" y="${f(-H / 2 - 12)}" width="${f(t + 36)}" height="${f(H + 24)}" fill="none" ${S(p, { dash: 'dash', sw: 1 })}/><rect x="${f(W / 2 - t - 18)}" y="${f(-H / 2 - 12)}" width="${f(t + 36)}" height="${f(H + 24)}" fill="none" ${S(p, { dash: 'dash', sw: 1 })}/>`; if (p.labels) o += T(ctx, '原线圈', -W / 2 + t / 2, H / 2 + 28, { size: ls, italic: false, color: p.stroke }) + T(ctx, '副线圈', W / 2 - t / 2, H / 2 + 28, { size: ls, italic: false, color: p.stroke }); }
        return o;
      }
      // rod
      const Rl = 400, rh = 22;
      let o = `<rect x="${f(-Rl / 2)}" y="${f(-rh / 2)}" width="${f(Rl)}" height="${f(rh)}" rx="${f(rh / 2)}" fill="${L.metal(ctx, '#a5aab0', -rh / 2, rh / 2, true)}" ${sd(p)}/>`;
      const coil = (x0, x1, n) => { let s2 = ''; for (let i = 0; i < n; i++) { const x = x0 + ((x1 - x0) * (i + 0.5)) / n; s2 += `<path d="M${pt(x - 3, rh / 2 + 6)}C${pt(x - 8, 0)} ${pt(x + 2, -rh / 2 - 6)} ${pt(x + 4, -rh / 2 - 6)}" fill="none" ${S(p, { dash: 'solid', sw: 1.3 })}/>`; } return s2; };
      o += coil(-170, -50, Math.max(4, Np * 2)) + coil(50, 170, Math.max(4, Ns * 2));
      o += `<path d="M${pt(-167, -rh / 2 - 6)}V-70M${pt(-53, -rh / 2 - 6)}V-70M${pt(53, -rh / 2 - 6)}V-70M${pt(167, -rh / 2 - 6)}V-70" fill="none" ${sd(p)}/>`;
      if (p.src) o += `<path d="M-167,-70V-100H-130M-90,-100H-53V-70" fill="none" ${sd(p)}/><g transform="translate(-110,-100)">${comp(ctx, { kind: 'acterm', L: 40, stroke: p.stroke })}</g>`;
      if (p.load) o += `<path d="M53,-70V-100H75M145,-100H167V-70" fill="none" ${sd(p)}/><rect x="75" y="-112" width="70" height="24" fill="#fff" ${sd(p)}/>` + T(ctx, '负荷', 110, -128, { size: ls, italic: false, color: p.stroke });
      if (p.labels) o += T(ctx, '线圈 X', -110, 40, { size: ls, italic: false, color: p.stroke }) + T(ctx, '原线圈', -110, 60, { size: ls - 1, italic: false, color: '#1e88e5' }) + T(ctx, '线圈 Y', 110, 40, { size: ls, italic: false, color: p.stroke }) + T(ctx, '副线圈', 110, 60, { size: ls - 1, italic: false, color: '#1e88e5' }) + T(ctx, '软铁心', Rl / 2 + 10, -26, { size: ls, anchor: 'start', italic: false, color: p.stroke });
      return o;
    },
  });

  /* ================= 预设 ================= */
  PD.preset(C0, '直流电动机(立体图)', 'dynamo', {});
  PD.preset(C0, '直流电动机(端视图)', 'dynamo', { view: 'end' });
  PD.preset(C0, '直流电动机(线圈竖直)', 'dynamo', { th: 70 });
  PD.preset(C1, '直流发电机(立体图)', 'dynamo', { mode: 'dcgen' });
  PD.preset(C1, '直流发电机(端视图)', 'dynamo', { mode: 'dcgen', view: 'end' });
  PD.preset(C1, '交流发电机(立体图)', 'dynamo', { mode: 'acgen' });
  PD.preset(C1, '交流发电机(端视图)', 'dynamo', { mode: 'acgen', view: 'end' });
  PD.preset(C1, '线圈端视小图(放在 I-t 图下)', 'dynamo', { view: 'end', mag: false, circuit: false, forces: false, a: 36, curArrows: false, rot: true, lsize: 13 });
  PD.preset(C1, '直流发电机 I-t 图', 'graph', { W: 340, H: 170, xmin: 0, xmax: 1.1, ymin: 0, ymax: 1.2, xstep: 0.5, ticks: true, tlabels: true, xl: '转动周数', yl: '电流', ol: '0', funcs: 'abs(cos(2*PI*x)) ; 0 ; 1', cc: '#e8892b', marks: '0.25,0,,,\n0.75,0,,,', grid: 'none' });
  PD.preset(C1, '交流发电机 I-t 图', 'graph', { W: 340, H: 200, xmin: 0, xmax: 1.1, ymin: -1.2, ymax: 1.2, xstep: 0.5, ticks: true, tlabels: true, xl: '转动周数', yl: '电流', ol: '0', funcs: 'cos(2*PI*x) ; 0 ; 1', cc: '#e8892b' });
  PD.preset(C1, '金属棒在导轨上运动', 'rails', {});
  PD.preset(C1, '金属棒(电流计, 出纸面磁场)', 'rails', { B: 'out', end: 'galv' });
  PD.preset(C1, '磁棒下坠穿过线圈', 'fallcoil', {});
  PD.preset(C1, '磁棒穿过线圈 ε-t 图', 'graph', { W: 360, H: 200, xmin: 0, xmax: 8, ymin: -1.4, ymax: 1.1, ticks: false, tlabels: false, xl: '时间 / \\rm{s}', yl: '电动势 / \\rm{V}', ol: '', funcs: '2.3*(x<4 ? 1 : 1.3)*(4-x)*exp(-((x-4)*(x<4 ? 1 : 1.35))^2) ; 0 ; 8' });
  PD.preset(C1, '涡电流(磁铁在铝箔卷中)', 'eddytube', {});
  PD.preset(C1, '磁通量 Φ = BA cosθ', 'fluxloop', {});
  PD.preset(C1, '磁通量(多条磁场线)', 'fluxloop', { nB: 3, normal: false });
  const kid = (id, type, x, y, props) => Object.assign({ id: 'i-' + id, type, x, y, rot: 0, scale: 1, flip: false, snap: 'auto' }, PD.STYLE_DEF, PD.clone(PD.shapes[type].defaults), props || {});
  PD.preset(C1, '感生电流实验(磁铁移向线圈)', 'group', { loose: true, bw: 520, bh: 220, children: [
    kid('m', 'magsys', 340, 90, { mags: '0,0,180,90', w: 24, W: 340, H: 180, per: 10, fc: '#e8892b' }),
    kid('s', 'solenoid', 90, 90, { L: 150, d: 60, n: 9, field: 'none', cur: false, poles: false, lead: 50 }),
    kid('g', 'comp', 90, 200, { kind: 'galv', L: 70 }), kid('w1', 'wire', 0, 0, { a0: 'i-s', ap: 0, b0: 'i-g', bp: 0 }), kid('w2', 'wire', 0, 0, { a0: 'i-s', ap: 1, b0: 'i-g', bp: 1 }),
    kid('v', 'line', 330, 40, { x2: -40, y2: 0, a1: 'tri', stroke: GRN, sw: 3 }), kid('t', 'text', 320, 18, { text: '移向线圈', size: 14, italic: false }),
  ] });
  PD.preset(C2, '变压器(电路符号)', 'xformer', {});
  PD.preset(C2, '升压变压器(符号)', 'xformer', { Np: 3, Ns: 6 });
  PD.preset(C2, '变压器(方形铁心)', 'xformer', { style: 'core', Np: 6, Ns: 10 });
  PD.preset(C2, '简单变压器(铁棒)', 'xformer', { style: 'rod' });
  PD.preset(C2, '输电电路(发电站→变压器→电缆→变压器)', 'group', { loose: true, bw: 560, bh: 160, children: [
    kid('g1', 'node', 0, 20, { kind: 'open', r: 3.5 }), kid('g2', 'node', 0, 90, { kind: 'open', r: 3.5 }), kid('gt', 'text', -10, 55, { text: '发电站', size: 14, italic: false, anchor: 'end' }),
    kid('x', 'xformer', 100, 55, { Np: 3, Ns: 5, lead: 24 }), kid('y', 'xformer', 440, 55, { Np: 5, Ns: 3, lead: 24 }),
    kid('na', 'node', 180, 20, { label: 'A', ldx: -2, ldy: -12 }), kid('nb', 'node', 180, 90, { label: 'B', ldx: -2, ldy: 14 }), kid('nc', 'node', 360, 20, { label: 'C', ldx: 2, ldy: -12 }), kid('nd', 'node', 360, 90, { label: 'D', ldx: 2, ldy: 14 }),
    kid('o1', 'node', 540, 20, { kind: 'open', r: 3.5 }), kid('o2', 'node', 540, 90, { kind: 'open', r: 3.5 }), kid('ot', 'text', 552, 55, { text: '132 kV', size: 14, italic: false, anchor: 'start' }),
    kid('w1', 'wire', 0, 0, { a0: 'i-g1', b0: 'i-x', bp: 0 }), kid('w2', 'wire', 0, 0, { a0: 'i-g2', b0: 'i-x', bp: 1 }), kid('w3', 'wire', 0, 0, { a0: 'i-x', ap: 2, b0: 'i-na' }), kid('w4', 'wire', 0, 0, { a0: 'i-x', ap: 3, b0: 'i-nb' }),
    kid('w5', 'wire', 0, 0, { a0: 'i-na', b0: 'i-nc', dash: 'dash' }), kid('w6', 'wire', 0, 0, { a0: 'i-nb', b0: 'i-nd', dash: 'dash' }),
    kid('w7', 'wire', 0, 0, { a0: 'i-nc', b0: 'i-y', bp: 0 }), kid('w8', 'wire', 0, 0, { a0: 'i-nd', b0: 'i-y', bp: 1 }), kid('w9', 'wire', 0, 0, { a0: 'i-y', ap: 2, b0: 'i-o1' }), kid('w10', 'wire', 0, 0, { a0: 'i-y', ap: 3, b0: 'i-o2' }),
    kid('bx', 'rect', 30, -10, { w: 160, h: 130, dash: 'dash', sw: 1 }), kid('by', 'rect', 350, -10, { w: 160, h: 130, dash: 'dash', sw: 1 }),
    kid('lx', 'text', 110, 140, { text: '变压器 X', size: 14, italic: false }), kid('ly', 'text', 430, 140, { text: '变压器 Y', size: 14, italic: false }), kid('lc', 'text', 270, 0, { text: '电缆', size: 14, italic: false }),
  ] });
  PD.preset(C2, '输电电路(电缆电阻 + 负荷)', 'group', { loose: true, bw: 600, bh: 170, children: [
    kid('x', 'xformer', 60, 60, { Np: 3, Ns: 5, lead: 24 }), kid('y', 'xformer', 440, 60, { Np: 5, Ns: 3, lead: 24 }),
    kid('s', 'comp', -40, 60, { kind: 'ac', L: 60, rot: 90 }), kid('r1', 'comp', 250, 25, { kind: 'resistor', L: 120, label: 'r', value: '电缆电阻' }), kid('r2', 'comp', 250, 95, { kind: 'resistor', L: 120, label: 'r' }),
    kid('ld', 'comp', 560, 60, { kind: 'resistor', L: 70, rot: 90, label: '负荷' }),
    kid('w1', 'wire', 0, 0, { a0: 'i-s', ap: 0, b0: 'i-x', bp: 0 }), kid('w2', 'wire', 0, 0, { a0: 'i-s', ap: 1, b0: 'i-x', bp: 1 }),
    kid('w3', 'wire', 0, 0, { a0: 'i-x', ap: 2, b0: 'i-r1', bp: 0 }), kid('w4', 'wire', 0, 0, { a0: 'i-x', ap: 3, b0: 'i-r2', bp: 0 }), kid('w5', 'wire', 0, 0, { a0: 'i-r1', ap: 1, b0: 'i-y', bp: 0 }), kid('w6', 'wire', 0, 0, { a0: 'i-r2', ap: 1, b0: 'i-y', bp: 1 }),
    kid('w7', 'wire', 0, 0, { a0: 'i-y', ap: 2, b0: 'i-ld', bp: 0 }), kid('w8', 'wire', 0, 0, { a0: 'i-y', ap: 3, b0: 'i-ld', bp: 1 }),
  ] });
})();
