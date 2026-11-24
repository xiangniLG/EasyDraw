/* 选修 · 能量和能源的使用（依赖 lab / mechanics / optics / nuclear / atomic 的 PD.lab 辅助，包括 L.partLabel）
   家居用电：能源标签模板（两种版式）· 铭牌 · 电水壶 · 电暖炉 · 灯泡/台灯 · 电热平板炉 · 微波炉 · 电磁炉 · 冷气机/热泵(制冷/制热)
   电器默认「抽象(线稿)」外观，也可选上色 / 黑白；部件名称都可以留空或改成字母 */
(function () {
  'use strict';
  const f = PD.f, S = PD.strokeAttr, T = PD.tex, L = PD.lab, pt = L.pt, clamp = L.clamp;
  const D2R = Math.PI / 180, TAU = Math.PI * 2;
  const C1 = 'DSE-物理/选修·能量和能源的使用/家居用电';
  const sd = (p) => S(p, { dash: 'solid' });
  const thin = (p, k) => L.thin(p, k ?? 0.7);
  const part = (ctx, p, t, i, x, y, a) => L.partLabel(ctx, p, t, i, x, y, a);
  const leader = (p, x1, y1, x2, y2) => `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" ${S(p, { dash: 'solid', sw: 0.7 })}/>`;
  const lookF = { k: 'look', t: 'sel', l: '外观', o: [['abstract', '抽象(线稿)'], ['bw', '黑白'], ['color', '上色']] };
  const blankF = { k: 'blank', t: 'sel', l: '部件名称', o: [['text', '显示名称'], ['empty', '全部留空(横线)'], ['letter', '改为字母 A B C…'], ['none', '不标注']] };
  const K = (p) => ({ col: p.look === 'color', bw: p.look === 'bw', ab: p.look !== 'color' && p.look !== 'bw' });
  const gray = (c) => { const [r, g, b] = PD.hex2rgb(c), v = Math.round(0.299 * r + 0.587 * g + 0.114 * b); return PD.rgb2hex(v, v, v); };
  const fc = (k, c, abFill) => (k.col ? c : k.bw ? gray(c) : abFill || '#ffffff');
  const lum = (c) => { const [r, g, b] = PD.hex2rgb(c); return 0.299 * r + 0.587 * g + 0.114 * b; };
  // 部件标注：blank = none 时不画
  const P = (ctx, p, t, i, x, y, a, lx, ly, lx2, ly2) => (p.blank === 'none' ? '' : (lx != null ? leader(p, lx, ly, lx2, ly2) : '') + part(ctx, p, t, i, x, y, a));
  const heatW = (x0, y0, x1, y1, col, sw) => L.wavyArrow(x0, y0, x1, y1, col, sw || 1.2, 3, 10);

  /* ================= 能源标签（香港式样，模板） ================= */
  const FF = "Arial, 'Helvetica Neue', 'PingFang HK', 'Microsoft JhengHei', 'Noto Sans CJK TC', sans-serif";
  const fitW = (s, z, b) => (PD.measure ? PD.measure(String(s), z, false, b, FF) : String(s).length * z * 0.55);
  const tx = (x, y, s, z, o = {}) => (s === '' || s == null ? '' : o.max && fitW(s, z, o.b) > o.max ? tx(x, y, s, z, Object.assign({}, o, { max: 0, len: o.max })) : `<text x="${f(x)}" y="${f(y)}" font-size="${f(z)}" font-family="${FF}" fill="${o.c || '#000'}"${o.a ? ` text-anchor="${o.a}"` : ''}${o.b ? ' font-weight="bold"' : ''}${o.i ? ' font-style="italic"' : ''}${o.len ? ` textLength="${f(o.len)}" lengthAdjust="spacingAndGlyphs"` : ''}>${PD.esc(s)}</text>`);
  const GC = ['#3a9b3f', '#a6c63a', '#f3cf2c', '#ea8a2b', '#cf2f28'];
  const splitRow = (l) => l.split('|').map((s) => s.trim());
  PD.register({
    type: 'elabel', name: '能源标签(香港式样, 可改级别与数据)',
    defaults: {
      lay: 'bars', grade: 1, W: 300, bw: false, title1: 'ENERGY LABEL', title2: '能 源 標 籤',
      rows: 'Annual Energy Consumption (kWh) | 每年耗電量（千瓦小時） | 161 | 以每年使用 260 次計算\nWashing Capacity (kg) | 洗衣量（公斤） | 5\nWater Consumption (litre) | 耗水量（公升） | 72',
      info: 'Washing Machine | 洗衣機 |\nBrand | 品牌 | ABC 某某牌\nModel | 型號 | HK1234',
      gEn: 'Energy Efficiency Grade', gZh: '能源效益級別', gNote: '五個級別中，第一級最為省電。',
      remark: '', footer: '機電工程署 EMSD', big: 20,
    },
    fields: [
      { k: 'lay', t: 'sel', l: '版式', o: [['bars', '五级色条 + 箭头'], ['box', '级别写在方框里']] },
      { k: 'grade', t: 'num', l: '能源效益级别(1-5, 0 = 留空)', min: 0, max: 5 },
      { k: 'rows', t: 'area', l: '数据(每行: 英文 | 中文 | 数值 [| 小字说明])', ph: '数值留空 = 让学生填\n例: Annual Energy Consumption (kWh) | 每年耗電量（千瓦小時） | 161 | 以每年使用 260 次計算\n行首加 ! = 红字(版式二)' },
      { k: 'info', t: 'area', l: '资料(每行: 英文 | 中文 | 内容)', ph: '例:\nBrand | 品牌 | ABC 某某牌\nModel | 型號 | HK1234' },
      { k: 'gEn', t: 'text', l: '级别一栏(英文)', when: (p) => p.lay === 'box' }, { k: 'gZh', t: 'text', l: '级别一栏(中文)', when: (p) => p.lay === 'box' }, { k: 'gNote', t: 'text', l: '级别一栏小字', when: (p) => p.lay === 'box' },
      { k: 'remark', t: 'area', l: '底部附注(每行一句)' }, { k: 'title1', t: 'text', l: '标题(英文)' }, { k: 'title2', t: 'text', l: '标题(中文)' }, { k: 'footer', t: 'text', l: '页脚' },
      { k: 'W', t: 'num', l: '宽' }, { k: 'big', t: 'num', l: '数值字号' }, { k: 'bw', t: 'bool', l: '黑白(打印用)' },
    ],
    style: ['stroke', 'opacity', 'shadow'],
    render(p, ctx) {
      const W = Math.max(220, +p.W), m = 6, iw = W - 2 * m, xs = Math.round(W * 0.6), xc = (xs + W - m) / 2, g = Math.round(+p.grade);
      const C = (c) => (p.bw ? gray(c) : c), RED = C('#d0302a'), NAVY = p.bw ? '#000000' : '#2b2e83', YEL = C('#fdfbe2'), ln = `stroke="${p.stroke}" stroke-width="1"`;
      let o = '', y = m;
      o += `<rect x="${m}" y="${y}" width="${iw}" height="52" fill="${C('#d5eaf7')}"/>` + tx(W / 2, y + 41, p.title1, 34, { c: NAVY, a: 'middle', b: true, i: true, len: iw - 30 });
      y += 52; o += `<rect x="${m}" y="${y}" width="${iw}" height="40" fill="${C('#b6d46c')}"/>` + tx(W / 2, y + 31, p.title2, 27, { c: NAVY, a: 'middle', b: true }); y += 40;
      const sect = (h, split) => `<rect x="${m}" y="${f(y)}" width="${split ? xs - m : iw}" height="${f(h)}" fill="${YEL}"/>` + (split ? `<rect x="${xs}" y="${f(y)}" width="${W - m - xs}" height="${f(h)}" fill="#ffffff"/><line x1="${xs}" y1="${f(y)}" x2="${xs}" y2="${f(y + h)}" ${ln}/>` : '') + `<line x1="${m}" y1="${f(y + h)}" x2="${W - m}" y2="${f(y + h)}" ${ln}/>`;
      const infoBlock = () => {
        const I = PD.lines(p.info).map(splitRow); if (!I.length) return;
        const h = 14 + 16 * I.length; o += sect(h, true);
        I.forEach((r, i) => { const yy = y + 20 + 16 * i; o += tx(12, yy, r[0], 12, { b: i === 0, max: W * 0.37 - 18 }) + tx(W * 0.37, yy, r[1] || '', 12, { b: i === 0, max: xs - W * 0.37 - 6 }) + tx(xc, yy, r[2] || '', 12, { a: 'middle', b: true, max: W - m - xs - 10 }); });
        y += h;
      };
      const row = (r, red) => {
        const isRed = red || r[0].startsWith('!'), en = r[0].replace(/^!/, ''), zh = r[1] || '', val = r[2] || '', note = r[3] || '';
        const nl = (en ? 1 : 0) + (zh ? 1 : 0), h = Math.max(34, 10 + 15 * nl + (note ? 12 : 0)); o += sect(h, true);
        let yy = y + 18; const col = isRed && p.lay === 'box' ? RED : '#000';
        if (en) { o += tx(12, yy, en, 12.5, { c: col, max: xs - 18 }); yy += 15; }
        if (zh) { o += tx(12, yy, zh, 12, { c: col, max: xs - 18 }); yy += 13; }
        if (note) o += tx(12, yy, note, 8.5, { max: xs - 18 });
        return h;
      };
      if (p.lay === 'bars') {
        const h = 200; o += sect(h, true);
        o += tx(12, y + 20, 'more efficient 效益較高', 13, { b: true });
        for (let i = 0; i < 5; i++) {
          const by = y + 30 + i * 28, w = 56 + i * 20, c = C(GC[i]), tc = lum(c) < 150 || !p.bw ? '#ffffff' : '#000000';
          o += `<polygon points="12,${by} ${12 + w},${by} ${22 + w},${by + 11} ${12 + w},${by + 22} 12,${by + 22}" fill="${c}"${p.bw ? ` ${ln}` : ''}/>` + tx(8 + w, by + 18, String(i + 1), 18, { c: tc, a: 'end', b: true });
        }
        o += tx(12, y + 30 + 5 * 28 + 14, 'less efficient 效益較低', 13, { b: true });
        if (g >= 1 && g <= 5) {
          const py = y + 29 + (g - 1) * 28, c = C(GC[g - 1]), tc = lum(c) < 150 || !p.bw ? '#ffffff' : '#000000', x0 = xs + 8, x1 = W - m - 8;
          o += `<polygon points="${x0},${py + 12} ${x0 + 14},${py} ${x1},${py} ${x1},${py + 24} ${x0 + 14},${py + 24}" fill="${c}"${p.bw ? ` ${ln}` : ''}/>` + tx(x0 + 20, py + 18, 'Grade', 11, { c: tc, b: true }) + tx(x1 - 30, py + 21, String(g), 22, { c: tc, a: 'middle', b: true }) + tx(x1 - 16, py + 18, '級', 10, { c: tc });
        }
        y += h;
        PD.lines(p.rows).map(splitRow).forEach((r) => { const h = row(r); o += tx(xc, y + h / 2 + (+p.big) * 0.36, r[2] || '', +p.big, { a: 'middle', b: true, max: W - m - xs - 10 }); y += h; });
        infoBlock();
      } else {
        infoBlock();
        const R = PD.lines(p.rows).map(splitRow);
        R.forEach((r, i) => {
          const h = row(r); o += tx(xc, y + h / 2 + (+p.big) * 0.36, r[2] || '', +p.big, { a: 'middle', b: true, max: W - m - xs - 10 }); y += h;
          if (i === 0) {
            const gh = row([p.gEn, p.gZh, '', p.gNote], true), bs = 38, bx = xc - bs / 2, by = y + gh / 2 - bs / 2;
            o += `<rect x="${f(bx)}" y="${f(by)}" width="${bs}" height="${bs}" fill="none" stroke="${RED}" stroke-width="2"/>` + (g >= 1 && g <= 5 ? tx(xc, by + bs / 2 + 11, String(g), 30, { c: RED, a: 'middle', b: true }) : '');
            y += gh;
          }
        });
      }
      const RM = PD.lines(p.remark);
      if (RM.length) { const h = 10 + 12 * RM.length; o += `<rect x="${m}" y="${f(y)}" width="${iw}" height="${h}" fill="${C('#fbe5df')}"/>`; RM.forEach((t, i) => (o += tx(12, y + 16 + 12 * i, t, 9))); y += h; }
      if (p.footer) { o += `<rect x="${m}" y="${f(y)}" width="${iw}" height="38" fill="${C('#fbe5df')}"/>` + tx(W / 2, y + 26, p.footer, 17, { a: 'middle', b: true }); y += 38; }
      o = `<rect x="0" y="0" width="${W}" height="${f(y + m)}" rx="12" fill="#ffffff" ${ln}/>` + o + `<rect x="${m}" y="${m}" width="${iw}" height="${f(y - m)}" rx="6" fill="none" stroke="${p.stroke}" stroke-width="1.4"/>`;
      return o;
    },
  });

  /* ================= 铭牌 ================= */
  PD.register({
    type: 'rplate', name: '电器铭牌(额定值)',
    defaults: { title: '电水壶', lines: '型号 Model | KT-17\n额定电压 Rated voltage | 220 V ~\n频率 Frequency | 50 Hz\n额定功率 Rated power | 2200 W\n容量 Capacity | 1.7 L', W: 250, lsize: 13 },
    fields: [{ k: 'title', t: 'text', l: '标题' }, { k: 'lines', t: 'area', l: '每行: 项目 | 数值(数值留空 = 让学生填)' }, { k: 'W', t: 'num', l: '宽' }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'opacity', 'shadow'],
    render(p, ctx) {
      const W = +p.W, z = +p.lsize || 13, rh = z + 11, Ls = PD.lines(p.lines).map(splitRow), th = p.title ? z + 16 : 0, H = th + rh * Ls.length + 8;
      let o = `<rect width="${W}" height="${f(H)}" rx="6" fill="#ffffff" stroke="${p.stroke}" stroke-width="1.6"/>`;
      if (p.title) o += tx(W / 2, z + 6, p.title, z + 2, { a: 'middle', b: true }) + `<line x1="6" y1="${th}" x2="${W - 6}" y2="${th}" stroke="${p.stroke}" stroke-width="1"/>`;
      Ls.forEach((r, i) => {
        const y = th + 4 + rh * i + rh * 0.7; o += tx(12, y, r[0], z - 1);
        o += r[1] ? tx(W - 12, y, r[1], z, { a: 'end', b: true }) : `<line x1="${W - 80}" y1="${f(y + 2)}" x2="${W - 12}" y2="${f(y + 2)}" stroke="${p.stroke}" stroke-width="0.9"/>`;
        if (i < Ls.length - 1) o += `<line x1="10" y1="${f(th + 4 + rh * (i + 1))}" x2="${W - 10}" y2="${f(th + 4 + rh * (i + 1))}" stroke="${p.stroke}" stroke-width="0.5" stroke-dasharray="2 2"/>`;
      });
      void ctx; return o;
    },
  });

  /* ================= 电水壶 ================= */
  PD.register({
    type: 'ekettle', name: '电水壶',
    defaults: { look: 'abstract', inside: true, level: 0.7, conv: true, blank: 'text', tEl: '发热元件', tWater: '水', tSw: '开关', tBase: '底座', lsize: 14 },
    fields: [lookF, { k: 'inside', t: 'bool', l: '剖面(看到水和发热元件)' }, { k: 'level', t: 'range', l: '水位', min: 0.1, max: 0.9, step: 0.05, when: (p) => p.inside }, { k: 'conv', t: 'bool', l: '对流箭头', when: (p) => p.inside },
      blankF, { k: 'tEl', t: 'text', l: '发热元件' }, { k: 'tWater', t: 'text', l: '水' }, { k: 'tSw', t: 'text', l: '开关' }, { k: 'tBase', t: 'text', l: '底座' }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const k = K(p), body = fc(k, '#cfd8dc'), hw = (y) => 58 - (12 * (-y - 8)) / 132;
      let o = `<path d="M46,-126C112,-128 112,-28 56,-28" fill="none" stroke="${p.stroke}" stroke-width="15" stroke-linecap="round"/><path d="M46,-126C112,-128 112,-28 56,-28" fill="none" stroke="${fc(k, '#37474f', '#ffffff')}" stroke-width="11" stroke-linecap="round"/>`;
      o += `<rect x="62" y="-46" width="14" height="10" rx="2" fill="${fc(k, '#e53935')}" ${thin(p)}/>`;
      o += `<path d="M-50,-108L-88,-140L-80,-148L-47,-128Z" fill="${body}" ${sd(p)}/>`;
      o += `<path d="M-58,-8L-46,-140Q0,-150 46,-140L58,-8Z" fill="${body}" ${sd(p)}/>`;
      if (p.inside) {
        const ly = -8 - 132 * clamp(+p.level, 0.05, 0.95), wc = k.col ? '#9fd3f5' : k.bw ? '#e0e0e0' : '#ffffff';
        let wv = `M${pt(-hw(ly) + 2, ly)}`; for (let x = -hw(ly) + 2; x < hw(ly) - 2; x += 8) wv += `Q${pt(x + 2, ly - 3)} ${pt(x + 4, ly)}T${pt(Math.min(x + 8, hw(ly) - 2), ly)}`;
        o += `<path d="M${pt(-hw(-12) + 3, -12)}L${pt(-hw(ly) + 2, ly)}${wv.slice(wv.indexOf('Q') - 0 > 0 ? 0 : 0).replace(/^M[^QT]+/, '')}L${pt(hw(ly) - 2, ly)}L${pt(hw(-12) - 3, -12)}Z" fill="${wc}" stroke="none"/>`;
        o += `<path d="${wv}" fill="none" ${thin(p, 0.8)}/>`;
        if (k.ab) o += `<path d="${wv}" transform="translate(0,6)" fill="none" ${S(p, { dash: 'dash', sw: 0.5 })}/>`;
        o += `<path d="M-40,-8V-24H40V-8" fill="none" stroke="${p.stroke}" stroke-width="6" stroke-linejoin="round"/><path d="M-40,-8V-24H40V-8" fill="none" stroke="${fc(k, '#ff7043', '#ffffff')}" stroke-width="3" stroke-linejoin="round"/>`;
        if (p.conv) [-1, 1].forEach((s) => { const d = `M${s * 8},-30C${s * 8},${ly + 22} ${s * 30},${ly + 14} ${s * 36},${f((ly - 30) / 2)}`; o += `<path d="${d}" fill="none" ${S(p, { dash: 'solid', sw: 1 })}/>` + PD.arrowHead(s * 36, (ly - 30) / 2 + 4, Math.PI / 2, 7, 'full', p.stroke, 1); });
      }
      o += `<ellipse cx="0" cy="-142" rx="42" ry="6" fill="${fc(k, '#b0bec5')}" ${sd(p)}/><rect x="-9" y="-156" width="18" height="10" rx="3" fill="${fc(k, '#37474f')}" ${sd(p)}/>`;
      o += `<rect x="-68" y="-8" width="136" height="14" rx="4" fill="${fc(k, '#455a64')}" ${sd(p)}/><path d="M68,0C96,2 106,16 130,14" fill="none" ${sd(p)}/><rect x="130" y="7" width="20" height="14" rx="2" fill="${fc(k, '#eceff1')}" ${thin(p)}/>`;
      const ls = +p.lsize || 14; void ls;
      if (p.inside) o += P(ctx, p, p.tEl, 0, -120, -20, 'end', -116, -20, -38, -22) + P(ctx, p, p.tWater, 1, -120, -64, 'end', -116, -64, -30, -64);
      o += P(ctx, p, p.tSw, 2, 126, -50, 'start', 78, -42, 122, -50) + P(ctx, p, p.tBase, 3, -120, 12, 'end', -116, 10, -66, 2);
      return o;
    },
  });

  /* ================= 电暖炉 ================= */
  PD.register({
    type: 'eheater', name: '电暖炉',
    defaults: { look: 'abstract', kind: 'bar', n: 2, fins: 7, rays: true, blank: 'text', tEl: '发热管', tRef: '反射板', tGrill: '保护网', tFin: '散热片(内有油)', tKnob: '温度控制', lsize: 14 },
    fields: [lookF, { k: 'kind', t: 'sel', l: '种类', o: [['bar', '发热管式(辐射)'], ['oil', '充油式(对流)']], rebuild: true },
      { k: 'n', t: 'num', l: '发热管数', min: 1, max: 4, when: (p) => p.kind === 'bar' }, { k: 'fins', t: 'num', l: '散热片数', min: 3, max: 13, when: (p) => p.kind === 'oil' },
      { k: 'rays', t: 'bool', l: '画出热的传递(波浪 / 对流箭头)' }, blankF,
      { k: 'tEl', t: 'text', l: '发热管', when: (p) => p.kind === 'bar' }, { k: 'tRef', t: 'text', l: '反射板', when: (p) => p.kind === 'bar' }, { k: 'tGrill', t: 'text', l: '保护网', when: (p) => p.kind === 'bar' },
      { k: 'tFin', t: 'text', l: '散热片', when: (p) => p.kind === 'oil' }, { k: 'tKnob', t: 'text', l: '旋钮' }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const k = K(p), hot = k.col ? '#ff5722' : k.bw ? '#555555' : '#ffffff';
      let o = '';
      if (p.kind === 'oil') {
        const n = clamp(Math.round(+p.fins), 3, 13), pitch = 22, w0 = -(n * pitch) / 2;
        o += `<rect x="${f(w0 - 4)}" y="-150" width="${f(n * pitch + 8)}" height="12" rx="4" fill="${fc(k, '#90a4ae')}" ${sd(p)}/><rect x="${f(w0 - 4)}" y="-36" width="${f(n * pitch + 8)}" height="12" rx="4" fill="${fc(k, '#90a4ae')}" ${sd(p)}/>`;
        for (let i = 0; i < n; i++) o += `<rect x="${f(w0 + i * pitch + 2)}" y="-164" width="18" height="148" rx="9" fill="${fc(k, '#eceff1')}" ${sd(p)}/>` + (k.ab ? '' : `<rect x="${f(w0 + i * pitch + 6)}" y="-156" width="4" height="132" rx="2" fill="#ffffff" fill-opacity="0.7"/>`);
        const kx = -w0 + 6;
        o += `<rect x="${f(kx)}" y="-150" width="30" height="50" rx="4" fill="${fc(k, '#cfd8dc')}" ${sd(p)}/><circle cx="${f(kx + 15)}" cy="-125" r="9" fill="${fc(k, '#455a64')}" ${sd(p)}/><line x1="${f(kx + 15)}" y1="-125" x2="${f(kx + 15)}" y2="-133" stroke="${k.ab ? p.stroke : '#ffffff'}" stroke-width="1.5"/>`;
        o += `<path d="M${f(w0 + 10)},-16V-4M${f(-w0 - 10)},-16V-4" fill="none" ${sd(p)}/><circle cx="${f(w0 + 10)}" cy="0" r="5" fill="#ffffff" ${sd(p)}/><circle cx="${f(-w0 - 10)}" cy="0" r="5" fill="#ffffff" ${sd(p)}/>`;
        if (p.rays) [-1, 0, 1].forEach((s) => { const x = s * n * 7; o += `<path d="M${f(x)},-172C${f(x - 10)},-190 ${f(x + 10)},-204 ${f(x)},-222" fill="none" ${S(p, { dash: 'solid', sw: 1.1, color: k.col ? '#e64a19' : p.stroke })}/>` + PD.arrowHead(x, -226, -Math.PI / 2, 8, 'full', k.col ? '#e64a19' : p.stroke, 1); });
        o += P(ctx, p, p.tFin, 0, w0 - 26, -96, 'end', w0 - 22, -96, w0 + 10, -96) + P(ctx, p, p.tKnob, 1, kx + 44, -125, 'start', kx + 24, -125, kx + 40, -125);
        return o;
      }
      const n = clamp(Math.round(+p.n), 1, 4), top = -150, bot = -32, hgt = bot - top;
      o += `<rect x="-124" y="${top - 12}" width="248" height="${hgt + 24}" rx="12" fill="${fc(k, '#78909c')}" ${sd(p)}/>`;
      o += `<rect x="-108" y="${top}" width="216" height="${hgt}" rx="6" fill="${k.col ? L.metal(ctx, '#e0e0e0', top, bot, true) : k.bw ? '#eeeeee' : '#ffffff'}" ${thin(p)}/>`;
      o += `<path d="M-100,${top + 8}Q0,${top + 30} 100,${top + 8}M-100,${bot - 8}Q0,${bot - 30} 100,${bot - 8}" fill="none" ${S(p, { dash: 'dash', sw: 0.6 })}/>`;
      const ys = Array.from({ length: n }, (_, i) => top + (hgt * (i + 1)) / (n + 1));
      ys.forEach((y) => {
        o += `<rect x="-96" y="${f(y - 6)}" width="192" height="12" rx="6" fill="${hot}" ${sd(p)}/>`;
        if (!k.col) { let d = ''; for (let x = -88; x <= 84; x += 8) d += `M${f(x)},${f(y - 4)}l4,8`; o += `<path d="${d}" fill="none" ${S(p, { dash: 'solid', sw: 0.7 })}/>`; }
        o += `<rect x="-102" y="${f(y - 4)}" width="8" height="8" fill="${fc(k, '#bdbdbd')}" ${thin(p)}/><rect x="94" y="${f(y - 4)}" width="8" height="8" fill="${fc(k, '#bdbdbd')}" ${thin(p)}/>`;
      });
      let gd = ''; for (let x = -96; x <= 96; x += 16) gd += `M${x},${top}V${bot}`; o += `<path d="${gd}" fill="none" ${S(p, { dash: 'solid', sw: 0.6, color: k.col ? '#546e7a' : p.stroke })}/>`;
      o += `<path d="M-96,${bot + 12}L-110,0H-70L-80,${bot + 12}M96,${bot + 12}L110,0H70L80,${bot + 12}" fill="${fc(k, '#546e7a')}" ${sd(p)}/>`;
      o += `<circle cx="140" cy="${bot + 2}" r="9" fill="${fc(k, '#455a64')}" ${sd(p)}/><path d="M124,${bot + 2}H131" fill="none" ${sd(p)}/>`;
      if (p.rays) [-1, 0, 1].forEach((s) => (o += heatW(0 + s * 60, top - 20, s * 90, top - 80, k.col ? '#e64a19' : p.stroke, 1.2)));
      o += P(ctx, p, p.tEl, 0, -150, ys[0], 'end', -146, ys[0], -98, ys[0]) + P(ctx, p, p.tRef, 1, -150, bot - 6, 'end', -146, bot - 6, -104, bot - 12) + P(ctx, p, p.tGrill, 2, 170, top + 10, 'start', 166, top + 10, 104, top + 16) + P(ctx, p, p.tKnob, 3, 170, bot + 2, 'start', 152, bot + 2, 166, bot + 2);
      return o;
    },
  });

  /* ================= 灯泡 / 台灯 ================= */
  const bulbG = (p, ctx, k, rays) => {
    let o = `<path d="M-22,40C-22,28 -46,18 -46,-6A46,46 0 1 1 46,-6C46,18 22,28 22,40Z" fill="${k.col ? '#fff6c4' : k.bw ? '#f2f2f2' : '#ffffff'}" ${sd(p)}/>`;
    o += `<path d="M-8,40L-16,-8M8,40L16,-8M-6,40V22M6,40V22" fill="none" ${thin(p, 0.8)}/><path d="M-10,22H10" fill="none" ${thin(p, 0.8)}/>`;
    o += `<g transform="translate(-16,-8)"><path d="${L.springPath(0, 32, 7, 5, 'coil', 2)}" fill="none" stroke="${k.col ? '#e65100' : p.stroke}" stroke-width="${f(Math.max(1, (+p.sw || 1.5) * 0.9))}"/></g>`;
    o += `<rect x="-22" y="40" width="44" height="34" fill="${k.col ? L.metal(ctx, '#bdbdbd', -22, 22) : k.bw ? '#d0d0d0' : '#ffffff'}" ${sd(p)}/><path d="M-22,48L22,44M-22,57L22,53M-22,66L22,62" fill="none" ${thin(p, 0.7)}/><path d="M-12,74L-6,84H6L12,74" fill="${fc(k, '#424242')}" ${sd(p)}/>`;
    if (rays) for (let i = 0; i < 8; i++) { const a = (-90 + (i - 3.5) * 32) * D2R, r0 = 58, r1 = 76; o += `<line x1="${f(r0 * Math.cos(a))}" y1="${f(-8 + r0 * Math.sin(a))}" x2="${f(r1 * Math.cos(a))}" y2="${f(-8 + r1 * Math.sin(a))}" ${S(p, { dash: 'solid', sw: 1.3, color: k.col ? '#f9a825' : p.stroke })}/>`; }
    return o;
  };
  PD.register({
    type: 'lamp', name: '电灯 / 台灯',
    defaults: { look: 'abstract', kind: 'bulb', rays: true, blank: 'text', tFil: '灯丝(钨)', tGlass: '玻璃泡', tGas: '惰性气体', tCap: '灯头', tShade: '灯罩', tSw: '开关', lsize: 14 },
    fields: [lookF, { k: 'kind', t: 'sel', l: '种类', o: [['bulb', '钨丝灯泡'], ['desk', '台灯']], rebuild: true }, { k: 'rays', t: 'bool', l: '发光(光线 / 光锥)' }, blankF,
      { k: 'tFil', t: 'text', l: '灯丝', when: (p) => p.kind === 'bulb' }, { k: 'tGlass', t: 'text', l: '玻璃泡', when: (p) => p.kind === 'bulb' }, { k: 'tGas', t: 'text', l: '气体', when: (p) => p.kind === 'bulb' }, { k: 'tCap', t: 'text', l: '灯头', when: (p) => p.kind === 'bulb' },
      { k: 'tShade', t: 'text', l: '灯罩', when: (p) => p.kind === 'desk' }, { k: 'tSw', t: 'text', l: '开关', when: (p) => p.kind === 'desk' }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const k = K(p);
      if (p.kind === 'bulb') return bulbG(p, ctx, k, p.rays) + P(ctx, p, p.tFil, 0, 96, -30, 'start', 14, -10, 92, -30) + P(ctx, p, p.tGlass, 1, 96, 10, 'start', 40, 10, 92, 10) + P(ctx, p, p.tGas, 2, -96, -24, 'end', -26, -24, -92, -24) + P(ctx, p, p.tCap, 3, -96, 58, 'end', -22, 58, -92, 58);
      let o = '';
      if (p.rays) o += `<polygon points="72,-148 154,-148 236,0 40,0" fill="${k.col ? '#fff3b0' : k.bw ? '#f0f0f0' : 'none'}" fill-opacity="${k.col ? 0.8 : 1}" ${S(p, { dash: 'dash', sw: 0.8 })}/>`;
      o += `<line x1="-140" y1="0" x2="260" y2="0" ${sd(p)}/>`;
      o += `<rect x="-90" y="-16" width="120" height="16" rx="5" fill="${fc(k, '#455a64')}" ${sd(p)}/><rect x="0" y="-12" width="18" height="6" rx="2" fill="${fc(k, '#e53935')}" ${thin(p)}/>`;
      o += `<path d="M-40,-16L-10,-140L70,-150" fill="none" stroke="${p.stroke}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M-40,-16L-10,-140L70,-150" fill="none" stroke="${fc(k, '#90a4ae')}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`;
      o += `<circle cx="-10" cy="-140" r="6" fill="${fc(k, '#37474f')}" ${sd(p)}/>`;
      o += `<path d="M60,-160L74,-178H152L170,-142Q113,-136 56,-142Z" fill="${fc(k, '#43a047')}" ${sd(p)}/><path d="M92,-144a18,10 0 0 0 36,0" fill="${k.col ? '#fff9c4' : '#ffffff'}" ${sd(p)}/>`;
      o += P(ctx, p, p.tShade, 0, 190, -180, 'start', 156, -170, 186, -180) + P(ctx, p, p.tSw, 1, -110, -40, 'end', 6, -12, -106, -40);
      return o;
    },
  });

  /* ================= 电热平板炉（双螺旋发热线圈，俯视） ================= */
  PD.register({
    type: 'hotplate', name: '电热平板炉(螺旋线圈, 俯视)',
    defaults: { look: 'abstract', turns: 3.5, glow: true, knob: true, blank: 'text', tCoil: '发热线圈', tKnob: '调节功率的旋钮', lsize: 14 },
    fields: [lookF, { k: 'turns', t: 'num', l: '螺旋圈数', step: 0.5, min: 1, max: 6 }, { k: 'glow', t: 'bool', l: '线圈通电发红(上色时)' }, { k: 'knob', t: 'bool', l: '旋钮' }, blankF, { k: 'tCoil', t: 'text', l: '线圈' }, { k: 'tKnob', t: 'text', l: '旋钮' }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const k = K(p), N = clamp(+p.turns, 1, 6), r0 = 9, R = 80, tw = Math.max(2.5, ((R - r0) / N / 2) * 0.5);
      const sp = (s) => { let d = ''; const M = Math.ceil(N * 48); for (let i = 0; i <= M; i++) { const th = (N * TAU * i) / M, r = r0 + ((R - r0) * i) / M, x = s * r * Math.cos(th), y = s * r * Math.sin(th); d += (i ? 'L' : 'M') + pt(x, y); } return d; };
      const A = sp(1), B = sp(-1), endA = [R * Math.cos(N * TAU), R * Math.sin(N * TAU)];
      const coil = `${A}M${r0},0A${r0 / 2},${r0 / 2} 0 0 1 0,0A${r0 / 2},${r0 / 2} 0 0 0 ${-r0},0${B}`;
      const cc = k.col ? (p.glow ? '#ff5722' : '#616161') : k.bw ? '#555555' : p.stroke;
      let o = `<rect x="-112" y="-112" width="224" height="224" rx="16" fill="${fc(k, '#eceff1')}" ${sd(p)}/><circle r="92" fill="${k.col ? '#37474f' : k.bw ? '#e6e6e6' : '#ffffff'}" ${sd(p)}/>`;
      if (k.col && p.glow) o += `<path d="${coil}" fill="none" stroke="#ffab91" stroke-width="${f(tw + 4)}" stroke-opacity="0.6" stroke-linecap="round" stroke-linejoin="round"/>`;
      o += k.ab ? `<path d="${coil}" fill="none" stroke="${p.stroke}" stroke-width="${f(tw + 1.6)}" stroke-linecap="round" stroke-linejoin="round"/><path d="${coil}" fill="none" stroke="#ffffff" stroke-width="${f(Math.max(0.8, tw - 1.6))}" stroke-linecap="round" stroke-linejoin="round"/>` : `<path d="${coil}" fill="none" stroke="${cc}" stroke-width="${f(tw)}" stroke-linecap="round" stroke-linejoin="round"/>`;
      o += `<circle cx="${f(endA[0])}" cy="${f(endA[1])}" r="${f(tw * 0.7 + 1.5)}" fill="${p.stroke}"/><circle cx="${f(-endA[0])}" cy="${f(-endA[1])}" r="${f(tw * 0.7 + 1.5)}" fill="${p.stroke}"/>`;
      if (p.knob) o += `<circle cx="92" cy="92" r="11" fill="${fc(k, '#455a64')}" ${sd(p)}/><line x1="92" y1="92" x2="${f(92 - 7)}" y2="${f(92 - 7)}" stroke="${k.ab ? p.stroke : '#ffffff'}" stroke-width="1.6"/>`;
      const a = (N * 0.5 + 0.12) * TAU, rq = r0 + (R - r0) * 0.75, q = [rq * Math.cos(a), rq * Math.sin(a)];
      o += P(ctx, p, p.tCoil, 0, -150, -120, 'end', q[0], q[1], -146, -118);
      if (p.knob) o += P(ctx, p, p.tKnob, 1, 128, 128, 'start', 100, 100, 124, 124);
      return o;
    },
  });

  /* ================= 微波炉 ================= */
  PD.register({
    type: 'microwave', name: '微波炉',
    defaults: { look: 'abstract', view: 'section', blank: 'text', tMag: '磁控管', tGuide: '波导', tWave: '微波', tWall: '金属腔壁(反射微波)', tFood: '食物', tTurn: '转盘', tDoor: '门上的金属网', lsize: 14 },
    fields: [lookF, { k: 'view', t: 'sel', l: '视图', o: [['section', '剖面(看到微波)'], ['front', '外观(正面)']], rebuild: true }, blankF,
      { k: 'tMag', t: 'text', l: '磁控管', when: (p) => p.view === 'section' }, { k: 'tGuide', t: 'text', l: '波导', when: (p) => p.view === 'section' }, { k: 'tWave', t: 'text', l: '微波', when: (p) => p.view === 'section' },
      { k: 'tWall', t: 'text', l: '腔壁', when: (p) => p.view === 'section' }, { k: 'tFood', t: 'text', l: '食物' }, { k: 'tTurn', t: 'text', l: '转盘' }, { k: 'tDoor', t: 'text', l: '门' }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const k = K(p), wc = k.col ? '#7b1fa2' : p.stroke, food = fc(k, '#ffcc80'), dotPat = () => { const id = ctx.id + '-mesh'; ctx.defs.push(`<pattern id="${id}" width="7" height="7" patternUnits="userSpaceOnUse"><rect width="7" height="7" fill="${k.col ? '#263238' : k.bw ? '#bdbdbd' : '#ffffff'}"/><circle cx="3.5" cy="3.5" r="1.4" fill="${k.col ? '#90a4ae' : p.stroke}"/></pattern>`); return `url(#${id})`; };
      let o = '';
      if (p.view === 'front') {
        o += `<rect x="-160" y="-120" width="320" height="200" rx="10" fill="${fc(k, '#eceff1')}" ${sd(p)}/><rect x="-146" y="-106" width="200" height="172" rx="6" fill="${fc(k, '#b0bec5')}" ${sd(p)}/>`;
        o += `<rect x="-132" y="-92" width="172" height="144" rx="4" fill="${dotPat()}" ${thin(p)}/>`;
        o += `<ellipse cx="-46" cy="38" rx="62" ry="9" fill="${fc(k, '#e0f7fa')}" fill-opacity="0.9" ${thin(p)}/><path d="M-80,34Q-80,4 -46,2Q-12,4 -12,34Z" fill="${food}" ${thin(p)}/>`;
        o += `<rect x="64" y="-106" width="84" height="172" rx="4" fill="${fc(k, '#cfd8dc')}" ${thin(p)}/><rect x="74" y="-94" width="64" height="22" fill="${k.col ? '#1b5e20' : '#ffffff'}" ${thin(p)}/>` + (k.col ? `<text x="106" y="-78" font-size="13" fill="#b9f6ca" text-anchor="middle" font-family="monospace">0:30</text>` : '');
        o += `<circle cx="106" cy="-30" r="16" fill="${fc(k, '#90a4ae')}" ${sd(p)}/><line x1="106" y1="-30" x2="106" y2="-44" ${sd(p)}/>`;
        for (let i = 0; i < 3; i++) o += `<rect x="78" y="${f(0 + i * 18)}" width="56" height="12" rx="3" fill="${fc(k, '#eceff1')}" ${thin(p)}/>`;
        o += `<path d="M-140,80V90H-120V80M120,80V90H140V80" fill="${fc(k, '#455a64')}" ${sd(p)}/>`;
        o += P(ctx, p, p.tDoor, 0, -190, -60, 'end', -186, -60, -130, -60) + P(ctx, p, p.tFood, 1, -190, 10, 'end', -186, 10, -70, 14) + P(ctx, p, p.tTurn, 2, -190, 46, 'end', -186, 46, -106, 40);
        return o;
      }
      // 剖面（侧视）：门在左
      o += `<rect x="-170" y="-130" width="340" height="230" rx="8" fill="${fc(k, '#cfd8dc')}" ${sd(p)}/>`;
      o += `<rect x="-150" y="-98" width="230" height="178" fill="${k.col ? '#fafafa' : '#ffffff'}" stroke="${p.stroke}" stroke-width="${f((+p.sw || 1.5) * 2.2)}"/>`;
      o += `<rect x="-166" y="-104" width="10" height="190" fill="${dotPat()}" ${thin(p)}/>`;
      o += `<rect x="96" y="-118" width="58" height="56" rx="4" fill="${fc(k, '#78909c')}" ${sd(p)}/>` + (k.ab ? '' : `<circle cx="125" cy="-90" r="12" fill="${fc(k, '#b0bec5')}" ${thin(p)}/>`);
      o += `<path d="M96,-108H-30V-98M96,-92H-10V-98" fill="none" ${sd(p)}/><rect x="-29" y="-107" width="125" height="14" fill="${k.col ? '#eceff1' : '#ffffff'}"/><path d="M96,-108H-30V-98M96,-92H-10V-98" fill="none" ${sd(p)}/>`;
      o += heatW(84, -100, -14, -100, wc, 1.3);
      o += heatW(-20, -92, -110, -2, wc, 1.3) + heatW(-110, -2, -24, 32, wc, 1.3) + heatW(-14, -92, 50, -20, wc, 1.3) + heatW(50, -20, 0, 34, wc, 1.3);
      o += `<ellipse cx="-36" cy="64" rx="76" ry="8" fill="${fc(k, '#e0f7fa')}" ${thin(p)}/><path d="M-36,72V80" ${sd(p)}/><path d="M-78,58Q-80,26 -36,24Q8,26 6,58Z" fill="${food}" ${sd(p)}/>`;
      o += P(ctx, p, p.tMag, 0, 196, -96, 'start', 154, -96, 192, -96) + P(ctx, p, p.tGuide, 1, 196, -136, 'start', 60, -108, 192, -136) + P(ctx, p, p.tWave, 2, 196, -40, 'start', 40, -30, 192, -40);
      o += P(ctx, p, p.tWall, 3, 196, 30, 'start', 80, 30, 192, 30) + P(ctx, p, p.tFood, 4, 196, 66, 'start', 2, 42, 192, 66) + P(ctx, p, p.tTurn, 5, -196, 80, 'end', -100, 66, -192, 80) + P(ctx, p, p.tDoor, 6, -196, -60, 'end', -164, -60, -192, -60);
      return o;
    },
  });

  /* ================= 电磁炉 ================= */
  PD.register({
    type: 'induction', name: '电磁炉',
    defaults: { look: 'abstract', view: 'section', field: true, eddy: true, blank: 'text', tPan: '铁锅', tGlass: '陶瓷玻璃板', tCoil: '线圈', tAC: '高频交流电', tB: '变化的磁场', tEddy: '涡电流', lsize: 14 },
    fields: [lookF, { k: 'view', t: 'sel', l: '视图', o: [['section', '剖面(线圈和磁场)'], ['top', '外观(俯视)']], rebuild: true },
      { k: 'field', t: 'bool', l: '磁场线', when: (p) => p.view === 'section' }, { k: 'eddy', t: 'bool', l: '锅底涡电流(⊙⊗)', when: (p) => p.view === 'section' }, blankF,
      { k: 'tPan', t: 'text', l: '锅', when: (p) => p.view === 'section' }, { k: 'tGlass', t: 'text', l: '玻璃板' }, { k: 'tCoil', t: 'text', l: '线圈' }, { k: 'tAC', t: 'text', l: '电源', when: (p) => p.view === 'section' },
      { k: 'tB', t: 'text', l: '磁场', when: (p) => p.view === 'section' }, { k: 'tEddy', t: 'text', l: '涡电流', when: (p) => p.view === 'section' }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const k = K(p), cu = fc(k, '#c77b30');
      const sym = (x, y, r, out) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${cu}" ${thin(p, 0.8)}/>` + (out ? `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 0.28)}" fill="${p.stroke}"/>` : `<path d="M${pt(x - r * 0.6, y - r * 0.6)}L${pt(x + r * 0.6, y + r * 0.6)}M${pt(x + r * 0.6, y - r * 0.6)}L${pt(x - r * 0.6, y + r * 0.6)}" stroke="${p.stroke}" stroke-width="1"/>`);
      let o = '';
      if (p.view === 'top') {
        o += `<rect x="-140" y="-130" width="280" height="250" rx="16" fill="${fc(k, '#263238', '#ffffff')}" ${sd(p)}/><circle cy="-15" r="92" fill="none" stroke="${k.col ? '#90a4ae' : p.stroke}" stroke-width="1.4"/><circle cy="-15" r="60" fill="none" stroke="${k.col ? '#90a4ae' : p.stroke}" stroke-width="0.8" stroke-dasharray="4 3"/>`;
        for (let i = 0; i < 4; i++) o += `<rect x="${-66 + i * 36}" y="94" width="24" height="12" rx="3" fill="${fc(k, '#546e7a')}" ${thin(p)}/>`;
        o += P(ctx, p, p.tGlass, 0, 168, -100, 'start', 120, -100, 164, -100) + P(ctx, p, p.tCoil, 1, 168, -15, 'start', 60, -15, 164, -15);
        return o;
      }
      if (p.field) {
        const fcol = k.col ? '#1565c0' : p.stroke;
        [-1, 1].forEach((s) => [[34, 30], [54, 52], [72, 76]].forEach(([rx, ry]) => {
          o += `<ellipse cx="${s * 70}" cy="26" rx="${rx}" ry="${ry}" fill="none" ${S(p, { color: fcol, sw: 0.9, dash: 'dash' })}/>`;
          o += PD.arrowHead(s * 70, 26 - ry, s < 0 ? 0 : Math.PI, 7, 'full', fcol, 1);
        }));
      }
      o += `<rect x="-170" y="-6" width="340" height="12" fill="${k.col ? '#cfd8dc' : k.bw ? '#e8e8e8' : '#ffffff'}" fill-opacity="${k.col ? 0.85 : 1}" ${sd(p)}/>`;
      o += `<path d="M-110,-6L-126,-110H126L110,-6Z" fill="${k.col ? '#9fd3f5' : '#ffffff'}" fill-opacity="${k.col ? 0.5 : 0}" stroke="none"/>`;
      o += `<path d="M-128,-112L-112,-24H112L128,-112" fill="none" stroke="${p.stroke}" stroke-width="${f((+p.sw || 1.5) * 3)}" stroke-linejoin="round"/><rect x="-112" y="-24" width="224" height="18" fill="${k.col ? '#546e7a' : k.bw ? '#9e9e9e' : '#ffffff'}" ${sd(p)}/>`;
      if (!k.col && !k.bw) o += `<rect x="-112" y="-24" width="224" height="18" ${PD.fillAttr({ fillMode: 'hatch', fill: p.stroke }, ctx)} stroke="none" opacity="0.5"/>`;
      o += `<path d="M128,-100H186" stroke="${p.stroke}" stroke-width="7" stroke-linecap="round"/>`;
      if (k.col) o += `<path d="M-60,-40Q-50,-52 -40,-40M20,-44Q30,-56 40,-44" fill="none" stroke="#90a4ae" stroke-width="1"/>`;
      for (let i = 0; i < 5; i++) { const x = 34 + i * 18; o += sym(-x, 26, 6, false) + sym(x, 26, 6, true); }
      if (p.eddy) [-70, -30, 30, 70].forEach((x) => (o += sym(x, -15, 5, x < 0)));
      o += `<path d="M-112,32V62H-24M112,32V62H24" fill="none" ${sd(p)}/><circle cy="62" r="20" fill="#ffffff" ${sd(p)}/><path d="M-10,62c3,-8 7,-8 10,0s7,8 10,0" fill="none" ${sd(p)}/>`;
      o += P(ctx, p, p.tPan, 0, -200, -96, 'end', -122, -96, -196, -96) + P(ctx, p, p.tGlass, 1, -200, 0, 'end', -168, 0, -196, 0) + P(ctx, p, p.tCoil, 2, 206, 40, 'start', 106, 30, 202, 40);
      o += P(ctx, p, p.tAC, 3, 40, 96, 'start', 14, 78, 36, 96) + P(ctx, p, p.tB, 4, 206, 100, 'start', 128, 70, 202, 100) + P(ctx, p, p.tEddy, 5, 206, -40, 'start', 76, -18, 202, -40);
      return o;
    },
  });

  /* ================= 冷气机 / 热泵（制冷与制热） ================= */
  PD.register({
    type: 'heatpump', name: '冷气机 / 热泵(制冷 / 制热)',
    defaults: { look: 'color', mode: 'cool', states: false, fans: true, blank: 'text', tIn: '室内机', tOut: '室外机', tEvap: '蒸发器(吸热)', tCond: '冷凝器(放热)', tComp: '压缩机', tValve: '膨胀阀', tWall: '墙', tQc: '吸收热量 Q_C', tQh: '释出热量 Q_H', tW: '电能 W', temps: true, lsize: 14 },
    fields: [lookF, { k: 'mode', t: 'sel', l: '运作', o: [['cool', '制冷(夏天)'], ['heat', '制热(冬天, 热泵)']] }, { k: 'states', t: 'bool', l: '标出制冷剂状态(高压气体等)' }, { k: 'fans', t: 'bool', l: '风扇' }, { k: 'temps', t: 'bool', l: '标出室内 / 室外温度' }, blankF,
      { k: 'tIn', t: 'text', l: '室内机' }, { k: 'tOut', t: 'text', l: '室外机' }, { k: 'tEvap', t: 'text', l: '蒸发器' }, { k: 'tCond', t: 'text', l: '冷凝器' }, { k: 'tComp', t: 'text', l: '压缩机' }, { k: 'tValve', t: 'text', l: '膨胀阀' },
      { k: 'tWall', t: 'text', l: '墙' }, { k: 'tQc', t: 'text', l: '吸收的热' }, { k: 'tQh', t: 'text', l: '释出的热' }, { k: 'tW', t: 'text', l: '输入的电能' }, { k: 'lsize', t: 'num', l: '字号' }],
    style: ['stroke', 'sw', 'opacity', 'shadow'],
    render(p, ctx) {
      const k = K(p), cool = p.mode !== 'heat', ls = +p.lsize || 14;
      const PAL = k.col ? { hot: '#d84332', warm: '#f2a28f', cold: '#2f6fc4', cool: '#a9cdf0' } : k.bw ? { hot: '#4a4a4a', warm: '#9a9a9a', cold: '#c8c8c8', cool: '#ededed' } : null;
      const XI = -230, XO = 300, YT = -100, YB = 100, XC = 186, CR = 24;
      // 各段温度：制冷 vs 制热（制热时流向相反、两个换热器的角色互换）
      const st = cool ? { bL: 'cool', bR: 'hot', cO: 'hot', tR: 'warm', tL: 'cold', cI: 'cold' } : { bL: 'hot', cI: 'hot', tL: 'warm', tR: 'cold', cO: 'cold', bR: 'cool' };
      const zig = (x) => { let d = `M${pt(x, -70)}`; for (let i = 1; i <= 10; i++) d += `L${pt(x + (i % 2 ? 22 : -22), -70 + 14 * i - 7)}`; return d + `L${pt(x, 70)}`; };
      const seg = { bL: `M${XI},70V${YB}H${XC - CR}`, bR: `M${XC + CR},${YB}H${XO}V70`, tL: `M${XI},-70V${YT}H${XC - 14}`, tR: `M${XC + 14},${YT}H${XO}V-70`, cI: zig(XI), cO: zig(XO) };
      const pipe = (d, s) => (PAL ? `<path d="${d}" fill="none" stroke="${p.stroke}" stroke-width="11" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${PAL[s]}" stroke-width="7.5" stroke-linejoin="round" stroke-linecap="round"/>` : `<path d="${d}" fill="none" stroke="${p.stroke}" stroke-width="${f((+p.sw || 1.5) * 1.4)}" stroke-linejoin="round"/>`);
      let o = '';
      // 机壳与墙
      o += `<rect x="-330" y="-140" width="170" height="280" rx="14" fill="${k.col ? '#f3f7fb' : '#ffffff'}" ${sd(p)}/><rect x="90" y="-160" width="290" height="320" rx="14" fill="${k.col ? '#f6f4ef' : '#ffffff'}" ${sd(p)}/>`;
      o += `<rect x="-70" y="-190" width="34" height="380" ${k.col ? 'fill="#d7ccc8"' : PD.fillAttr({ fillMode: 'hatch', fill: p.stroke }, ctx)} ${sd(p)}/>`;
      if (k.col) o += `<rect x="-70" y="-190" width="34" height="380" ${PD.fillAttr({ fillMode: 'hatch', fill: '#8d6e63' }, ctx)} stroke="none"/>`;
      Object.keys(seg).forEach((s) => (o += pipe(seg[s], st[s])));
      // 流向箭头
      const fl = (x, y, ang, s) => PD.arrowHead(x, y, ang, 11, 'tri', PAL ? (s === 'cool' || s === 'warm' ? p.stroke : PAL[s]) : p.stroke, 1);
      const R0 = 0, LFT = Math.PI, UP = -Math.PI / 2, DN = Math.PI / 2;
      if (cool) o += fl(-112, YB - 16, R0, 'cool') + fl(250, YB - 16, R0, 'hot') + fl(XO + 40, 0, UP, 'hot') + fl(250, YT - 16, LFT, 'warm') + fl(-112, YT - 16, LFT, 'cold') + fl(XI - 40, 0, DN, 'cold');
      else o += fl(-112, YB - 16, LFT, 'hot') + fl(250, YB - 16, LFT, 'cool') + fl(XO + 40, 0, DN, 'cold') + fl(250, YT - 16, R0, 'cold') + fl(-112, YT - 16, R0, 'warm') + fl(XI - 40, 0, UP, 'hot');
      // 压缩机（圆 + 指向出口的三角）与膨胀阀（蝴蝶结符号）
      const dir = cool ? 1 : -1;
      o += `<circle cx="${XC}" cy="${YB}" r="${CR}" fill="${fc(k, '#b0bec5')}" ${sd(p)}/><path d="M${XC - dir * 15},${YB - 14}L${XC + dir * 17},${YB}L${XC - dir * 15},${YB + 14}" fill="none" ${sd(p)}/>`;
      o += `<path d="M${XC - 14},${YT - 12}L${XC + 14},${YT + 12}V${YT - 12}L${XC - 14},${YT + 12}Z" fill="${fc(k, '#eceff1')}" ${sd(p)}/><path d="M${XC},${YT}V${YT - 22}M${XC - 9},${YT - 22}H${XC + 9}" fill="none" ${sd(p)}/>`;
      o += L.arrow(p, XC, YB + 90, XC, YB + CR + 3, { sw: 2, color: k.col ? '#f9a825' : p.stroke, ah: 10 });
      // 风扇
      const fan = (x, y) => { let s = `<circle cx="${x}" cy="${y}" r="20" fill="none" ${thin(p)}/>`; for (let i = 0; i < 3; i++) s += `<ellipse cx="${x}" cy="${y - 9}" rx="5" ry="9" transform="rotate(${i * 120} ${x} ${y})" fill="${fc(k, '#90a4ae')}" ${thin(p, 0.6)}/>`; return s + `<circle cx="${x}" cy="${y}" r="3" fill="${p.stroke}"/>`; };
      if (p.fans) o += fan(-295, 0) + fan(355, 0);
      // 热量箭头（空心箭头）
      const blk = (x0, x1, y, col) => { const s = Math.sign(x1 - x0), h = 13, hh = 24, xb = x1 - s * 26; return `<path d="M${x0},${y - h}H${xb}V${y - hh}L${x1},${y}L${xb},${y + hh}V${y + h}H${x0}Z" fill="${k.col ? col : '#ffffff'}" fill-opacity="${k.col ? 0.85 : 1}" ${sd(p)}/>`; };
      const cBlue = '#8ec1ee', cRed = '#f0907c';
      if (cool) o += blk(-440, -336, 0, cBlue) + blk(386, 490, 0, cRed);
      else o += blk(-336, -440, 0, cRed) + blk(490, 386, 0, cBlue);
      const QinX = cool ? -400 : 440, QoutX = cool ? 440 : -400;
      if (p.blank !== 'none') o += part(ctx, p, p.tQc, 6, QinX, 44, 'middle') + part(ctx, p, p.tQh, 7, QoutX, 44, 'middle');
      // 名称
      const inLab = cool ? p.tEvap : p.tCond, outLab = cool ? p.tCond : p.tEvap;
      o += P(ctx, p, p.tIn, 0, -245, -152, 'middle') + P(ctx, p, p.tOut, 1, 235, -172, 'middle');
      o += P(ctx, p, inLab, 2, -200, 128, 'start', XI + 6, 60, -196, 122) + P(ctx, p, outLab, 3, 388, -128, 'start', XO + 8, -56, 384, -126);
      o += P(ctx, p, p.tComp, 4, XC + 32, YB + 38, 'start') + P(ctx, p, p.tValve, 5, XC, YT - 34, 'middle') + P(ctx, p, p.tW, 8, XC + 10, YB + 82, 'start');
      if (p.blank !== 'none' && p.tWall) o += part(ctx, p, p.tWall, 9, -53, 206, 'middle');
      if (p.temps) { o += T(ctx, cool ? '室内（较冷，T_C）' : '室内（较暖，T_H）', -330, 172, { size: ls - 1, anchor: 'start', italic: false, color: p.stroke }) + T(ctx, cool ? '室外（较热，T_H）' : '室外（较冷，T_C）', 380, 204, { size: ls - 1, anchor: 'end', italic: false, color: p.stroke }); }
      if (p.states) {
        const z = ls - 3, t = (s, x, y, a) => T(ctx, s, x, y, { size: z, anchor: a || 'middle', italic: false, color: p.stroke, halo: true });
        if (cool) o += t('低压气体', -112, YB + 18) + t('高压热气体', 252, YB + 18) + t('高压液体', 250, YT + 18) + t('低压冷液体', -112, YT + 18);
        else o += t('高压热气体', -112, YB + 18) + t('低压气体', 252, YB + 18) + t('低压冷液体', 250, YT + 18) + t('高压液体', -112, YT + 18);
      }
      return o;
    },
  });

  /* ================= 预设 ================= */
  const cat = C1, ps = (n, t, pr) => PD.preset(cat, n, t, pr || {});
  ps('能源标签 · 洗衣机(五级色条)', 'elabel', {});
  ps('能源标签 · 冷气机(五级色条)', 'elabel', { grade: 2, rows: 'Annual Energy Consumption (kWh) | 每年耗電量（千瓦小時） | 1150 | 以每年使用 1200 小時計算\nCooling Capacity (kW) | 製冷量（千瓦） | 2.6\nCooling Seasonal Performance Factor | 製冷季節性能系數 | 4.8', info: 'Room Air Conditioner | 房間空調機 |\nBrand | 品牌 | ABC 某某牌\nModel | 型號 | AC-2600' });
  ps('能源标签 · 雪柜(五级色条)', 'elabel', { grade: 3, rows: 'Annual Energy Consumption (kWh) | 每年耗電量（千瓦小時） | 380\nStorage Volume (litre) | 儲存容量（公升） | 300', info: 'Refrigerating Appliance | 冷凍器具 |\nBrand | 品牌 | ABC 某某牌\nModel | 型號 | RF-300' });
  ps('能源标签 · 干衣机(方框级别)', 'elabel', { lay: 'box', rows: '!Annual Energy Consumption * kWh/yr | 每年耗電量（每年度小時） | 184 | 現假設每年乾衣 260 次。\nClothes Dryer Category | 乾衣機類別 | 冷凝式\nDrying Capacity (kg) | 乾衣量（公斤） | 7', info: 'Brand | 牌子 | ABC 某某牌\nModel | 型號 | HK1234', remark: '* 資料根據香港能源效益標籤計劃的規定列出。' });
  ps('能源标签(数据留空, 考题)', 'elabel', { grade: 0, rows: 'Annual Energy Consumption (kWh) | 每年耗電量（千瓦小時） | \nRated Power (W) | 額定功率（瓦特） | ', info: 'Brand | 品牌 | ABC 某某牌' });
  ps('能源标签(黑白打印)', 'elabel', { bw: true, grade: 2 });
  ps('电器铭牌 · 电水壶', 'rplate', {});
  ps('电器铭牌(数值留空)', 'rplate', { title: '电器', lines: '额定电压 Rated voltage | 220 V ~\n额定功率 Rated power | \n频率 Frequency | 50 Hz' });
  ps('电水壶(剖面)', 'ekettle', {});
  ps('电水壶(外观)', 'ekettle', { inside: false, blank: 'none' });
  ps('电暖炉 · 发热管式', 'eheater', {});
  ps('电暖炉 · 充油式', 'eheater', { kind: 'oil' });
  ps('钨丝灯泡', 'lamp', {});
  ps('台灯', 'lamp', { kind: 'desk' });
  ps('电热平板炉', 'hotplate', {});
  ps('电热平板炉(上色, 发红)', 'hotplate', { look: 'color' });
  ps('微波炉(剖面)', 'microwave', {});
  ps('微波炉(外观)', 'microwave', { view: 'front' });
  ps('电磁炉(剖面)', 'induction', {});
  ps('电磁炉(外观)', 'induction', { view: 'top' });
  ps('冷气机 · 制冷', 'heatpump', {});
  ps('热泵 · 制热', 'heatpump', { mode: 'heat' });
  ps('冷气机 · 制冷(部件留空, 考题)', 'heatpump', { blank: 'empty', look: 'bw' });
  ps('热泵 · 制热(字母标示, 线稿)', 'heatpump', { mode: 'heat', blank: 'letter', look: 'abstract', states: true });
  const fx = (n, t) => PD.preset(cat, n, 'text', { text: t, size: 20 });
  fx('电能', 'E = Pt');
  fx('千瓦小时', '1 \\rm{kWh} = 3.6 \\times 10^6 \\rm{J}');
  fx('电费', '电费 = 用电量（\\rm{kWh}）\\times 每度电价');
  fx('制冷的性能系数', '\\rm{COP} = \\frac{Q_C}{W}');
  fx('制热的性能系数', '\\rm{COP} = \\frac{Q_H}{W}');
  fx('热泵能量守恒', 'Q_H = Q_C + W');
})();
