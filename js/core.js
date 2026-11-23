/* PhyDraw core — 渲染辅助、素材注册、文本(迷你TeX)、投影、多面体 */
(function () {
  'use strict';
  const PD = (window.PD = {});
  PD.version = '0.8';
  PD.shapes = {};
  PD.palette = [];
  PD.cats = [];

  /* ---------- 注册 API（每章素材库都用它） ---------- */
  PD.register = (def) => { PD.shapes[def.type] = def; };
  PD.preset = (cat, name, type, props) => {
    if (!PD.cats.includes(cat)) PD.cats.push(cat);
    PD.palette.push({ cat, name, type, props: props || {} });
  };

  /* ---------- 小工具 ---------- */
  PD.clone = (o) => JSON.parse(JSON.stringify(o || {}));
  const f = (PD.f = (n) => { n = +n; return isFinite(n) ? Math.round(n * 100) / 100 : 0; });
  PD.esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  PD.fmt = (v) => String(parseFloat((+v).toFixed(6))).replace('-', '−');
  PD.parsePts = (s) => {
    const r = [], re = /(-?[\d.]+(?:e-?\d+)?)\s*,\s*(-?[\d.]+(?:e-?\d+)?)/gi;
    let m; while ((m = re.exec(String(s || '')))) r.push([+m[1], +m[2]]);
    return r;
  };
  PD.lines = (s) => String(s || '').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  /* ---------- 函数表达式解析器（不依赖 eval，可报错） ----------
     支持：+ - * / ^(右结合，-x^2 = -(x^2))  隐式乘法 2x、3(x+1)  比较 < > <= >= == !=  三元 a ? b : c
     函数：sin cos tan asin acos atan sinh cosh tanh exp ln(自然对数) log(=log10) log2 sqrt cbrt abs floor ceil round sign min max pow hypot
     常量：PI(π) E(e)；变量 x（或 t） */
  PD.parseExpr = (src) => {
    const s = String(src).replace(/π/g, 'PI').replace(/×/g, '*').replace(/[−–]/g, '-').replace(/÷/g, '/');
    const toks = []; let i = 0;
    while (i < s.length) {
      const c = s[i]; if (/\s/.test(c)) { i++; continue; }
      const rest = s.slice(i), m = /^(\d+\.?\d*(?:e[+-]?\d+)?|\.\d+(?:e[+-]?\d+)?)/i.exec(rest);
      if (m && !/^\d+\.?\d*e[a-z]/i.test(rest.slice(0, m[1].length + 1)) ) { toks.push({ t: 'n', v: parseFloat(m[1]) }); i += m[1].length; continue; }
      const nm = /^\d+\.?\d*/.exec(rest); if (nm) { toks.push({ t: 'n', v: parseFloat(nm[0]) }); i += nm[0].length; continue; }
      const id = /^[A-Za-z_]\w*/.exec(rest); if (id) { toks.push({ t: 'id', v: id[0] }); i += id[0].length; continue; }
      const op = /^(\*\*|<=|>=|==|!=|[-+*/^%(),<>?:])/.exec(rest);
      if (op) { toks.push({ t: 'op', v: op[1] === '**' ? '^' : op[1] }); i += op[1].length; continue; }
      throw new Error('无法识别的字符「' + c + '」');
    }
    const FN = { sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan, atan2: Math.atan2, sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
      exp: Math.exp, ln: Math.log, log: Math.log10, log10: Math.log10, log2: Math.log2, sqrt: Math.sqrt, cbrt: Math.cbrt, abs: Math.abs, floor: Math.floor, ceil: Math.ceil, round: Math.round,
      sign: Math.sign, min: Math.min, max: Math.max, pow: Math.pow, hypot: Math.hypot };
    const CONST = { PI: Math.PI, pi: Math.PI, E: Math.E, e: Math.E };
    const BP = { '?': 1, '==': 4, '!=': 4, '<': 5, '>': 5, '<=': 5, '>=': 5, '+': 6, '-': 6, '*': 7, '/': 7, '%': 7, '^': 9 };
    let k = 0;
    const peek = () => toks[k], isOp = (v) => toks[k] && toks[k].t === 'op' && toks[k].v === v;
    const expect = (v) => { if (!isOp(v)) throw new Error('缺少「' + v + '」'); k++; };
    const expr = (rbp) => {
      const t = toks[k++]; if (!t) throw new Error('表达式不完整');
      let left;
      if (t.t === 'n') { const v = t.v; left = () => v; }
      else if (t.t === 'id') {
        const nm = t.v;
        if (isOp('(')) {
          const fn = FN[nm]; if (!fn) throw new Error('未知的函数「' + nm + '」');
          k++; const args = []; if (!isOp(')')) { args.push(expr(0)); while (isOp(',')) { k++; args.push(expr(0)); } } expect(')');
          left = (e) => fn(...args.map((a) => a(e)));
        } else if (nm === 'x' || nm === 't') left = (e) => e.x;
        else if (CONST[nm] != null) { const v = CONST[nm]; left = () => v; }
        else if (FN[nm]) throw new Error('函数「' + nm + '」后面要加括号，如 ' + nm + '(x)');
        else throw new Error('未知的名称「' + nm + '」');
      } else if (t.v === '(') { left = expr(0); expect(')'); }
      else if (t.v === '-') { const a = expr(8); left = (e) => -a(e); }
      else if (t.v === '+') left = expr(8);
      else throw new Error('这里不应出现「' + t.v + '」');
      for (;;) {
        const q = peek(); if (!q) break;
        if (q.t !== 'op' || q.v === '(') { if (7 <= rbp) break; const a = left, b = expr(7); left = (e) => a(e) * b(e); continue; } // 隐式乘法
        const op = q.v, bp = BP[op]; if (bp == null || bp <= rbp) break;
        k++;
        if (op === '?') { const c = left, a = expr(0); expect(':'); const b = expr(0.5); left = (e) => (c(e) ? a(e) : b(e)); continue; }
        const a = left, b = expr(op === '^' ? bp - 0.5 : bp);
        left = { '+': (e) => a(e) + b(e), '-': (e) => a(e) - b(e), '*': (e) => a(e) * b(e), '/': (e) => a(e) / b(e), '%': (e) => a(e) % b(e), '^': (e) => Math.pow(a(e), b(e)),
          '<': (e) => +(a(e) < b(e)), '>': (e) => +(a(e) > b(e)), '<=': (e) => +(a(e) <= b(e)), '>=': (e) => +(a(e) >= b(e)), '==': (e) => +(a(e) === b(e)), '!=': (e) => +(a(e) !== b(e)) }[op];
      }
      return left;
    };
    if (!toks.length) throw new Error('表达式为空');
    const root = expr(0); if (k < toks.length) throw new Error('多余的「' + toks[k].v + '」');
    return root;
  };
  PD.compile = (ex) => { if (ex == null || String(ex).trim() === '') return null; try { const r = PD.parseExpr(ex); return (x) => r({ x }); } catch (e) { return null; } };
  PD.exprError = (ex) => { try { PD.parseExpr(ex); return ''; } catch (e) { return e.message; } };


  /* ---------- 字体（含 Mac / Linux 回退） ---------- */
  PD.FONTS = {
    'Times New Roman': "'Times New Roman', Times, 'Liberation Serif', serif",
    Cambria: "Cambria, 'Times New Roman', Times, serif",
    Arial: 'Arial, Helvetica, sans-serif',
    Calibri: "Calibri, Carlito, 'Helvetica Neue', Arial, sans-serif",
    SimSun: "SimSun, 'Songti SC', STSong, serif",
    'Microsoft YaHei': "'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', sans-serif",
    PMingLiU: "PMingLiU, 'PingFang TC', 'Songti TC', serif",
    'PingFang SC': "'PingFang SC', 'Microsoft YaHei', 'Hiragino Sans GB', sans-serif",
  };
  PD.fontStack = (n) => PD.FONTS[n] || (/,/.test(String(n)) ? String(n) : `'${n || 'Times New Roman'}', serif`);

  /* ---------- 颜色 ---------- */
  PD.hex2rgb = (h) => {
    h = String(h || '#000').replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16) || 0;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  PD.rgb2hex = (r, g, b) => '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  PD.mix = (a, b, t) => { const A = PD.hex2rgb(a), B = PD.hex2rgb(b); return PD.rgb2hex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); };
  PD.shade = (c, k) => (k >= 0 ? PD.mix(c, '#ffffff', Math.min(1, k)) : PD.mix(c, '#000000', Math.min(1, -k)));

  /* ---------- 通用字段 ---------- */
  PD.COMMON = [
    { k: 'x', t: 'num', l: 'X' }, { k: 'y', t: 'num', l: 'Y' },
    { k: 'rot', t: 'num', l: '旋转°', step: 5 }, { k: 'scale', t: 'num', l: '缩放', step: 0.1 },
    { k: 'flip', t: 'bool', l: '水平翻转(镜像)' },
    { k: 'snap', t: 'sel', l: '吸附', o: [['auto', '跟随全局'], ['on', '总是吸附'], ['off', '不吸附']] },
  ];
  PD.DASH = [['solid', '实线'], ['dash', '虚线'], ['dot', '点线'], ['dashdot', '点划线']];
  PD.FILLS = [['none', '无'], ['solid', '纯色'], ['linear', '线性渐变'], ['radial', '径向渐变(高光)'], ['hatch', '斜线阴影'], ['cross', '网格阴影'], ['dots', '点阵']];
  PD.STYLE = [
    { k: 'stroke', t: 'color', l: '线条/文字色' }, { k: 'sw', t: 'num', l: '线宽', step: 0.25, min: 0 },
    { k: 'dash', t: 'sel', l: '线型', o: PD.DASH },
    { k: 'fillMode', t: 'sel', l: '填充', o: PD.FILLS },
    { k: 'fill', t: 'color', l: '填充色' }, { k: 'fill2', t: 'color', l: '渐变/高光色' },
    { k: 'opacity', t: 'range', l: '不透明度', min: 0, max: 1, step: 0.05 },
    { k: 'shadow', t: 'bool', l: '投影阴影' },
  ];
  PD.STYLE_DEF = { stroke: '#000000', sw: 1.5, dash: 'solid', fillMode: 'none', fill: '#cfd8e3', fill2: '#ffffff', opacity: 1, shadow: false };
  PD.ARROWS = [['none', '无'], ['tri', '箭头'], ['full', '三角'], ['open', '开口'], ['dot', '圆点'], ['bar', '短竖线']];

  PD.makeObj = (pr, id) => {
    const def = PD.shapes[pr.type];
    return Object.assign({ id, type: pr.type, x: 0, y: 0, rot: 0, scale: 1, flip: false, snap: 'auto' }, PD.STYLE_DEF, PD.clone(def.defaults), PD.clone(pr.props));
  };

  /* ---------- 线条 / 填充 ---------- */
  PD.dashArr = (dash, w) => {
    w = Math.max(+w || 1, 0.5);
    switch (dash) {
      case 'dash': return `${f(3 * w + 3)} ${f(2 * w + 2.5)}`;
      case 'dot': return `0.01 ${f(2 * w + 2)}`;
      case 'dashdot': return `${f(4 * w + 6)} ${f(1.5 * w + 2)} 0.01 ${f(1.5 * w + 2)}`;
      default: return '';
    }
  };
  PD.strokeAttr = (p, o = {}) => {
    const c = o.color || p.stroke || '#000', w = o.sw ?? p.sw ?? 1.5, d = PD.dashArr(o.dash ?? p.dash, w);
    return `stroke="${c}" stroke-width="${f(w)}" stroke-linecap="round" stroke-linejoin="round"${d ? ` stroke-dasharray="${d}"` : ''}`;
  };
  PD.fillAttr = (p, ctx, o = {}) => {
    const m = o.mode ?? p.fillMode, c = o.fill ?? p.fill, c2 = o.fill2 ?? p.fill2 ?? '#ffffff';
    const id = ctx.id + '-f' + (ctx.n = (ctx.n || 0) + 1);
    switch (m) {
      case 'solid': return `fill="${c}"`;
      case 'linear':
        ctx.defs.push(`<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c2}"/><stop offset="1" stop-color="${c}"/></linearGradient>`);
        return `fill="url(#${id})"`;
      case 'radial':
        ctx.defs.push(`<radialGradient id="${id}" cx="0.4" cy="0.36" r="0.7" fx="0.32" fy="0.28"><stop offset="0" stop-color="${c2}"/><stop offset="0.5" stop-color="${c}"/><stop offset="1" stop-color="${PD.shade(c, -0.5)}"/></radialGradient>`);
        return `fill="url(#${id})"`;
      case 'hatch':
        ctx.defs.push(`<pattern id="${id}" patternUnits="userSpaceOnUse" width="7" height="7" patternTransform="rotate(45)"><line x1="3.5" y1="0" x2="3.5" y2="7" stroke="${c}" stroke-width="1.1"/></pattern>`);
        return `fill="url(#${id})"`;
      case 'cross':
        ctx.defs.push(`<pattern id="${id}" patternUnits="userSpaceOnUse" width="7" height="7" patternTransform="rotate(45)"><path d="M3.5,0V7M0,3.5H7" stroke="${c}" stroke-width="0.9"/></pattern>`);
        return `fill="url(#${id})"`;
      case 'dots':
        ctx.defs.push(`<pattern id="${id}" patternUnits="userSpaceOnUse" width="6" height="6"><circle cx="3" cy="3" r="1" fill="${c}"/></pattern>`);
        return `fill="url(#${id})"`;
      default: return 'fill="none"';
    }
  };

  /* ---------- 箭头 ---------- */
  PD.ahSize = (p) => (+p.ah > 0 ? +p.ah : 6 + 2.6 * (+p.sw || 1.5));
  PD.inset = (st) => ({ tri: 0.7, full: 0.85 }[st] || 0);
  // tip 在 (x,y)，ang 为前进方向（SVG 坐标，弧度）
  PD.arrowHead = (x, y, ang, L, st, col, sw) => {
    if (!st || st === 'none') return '';
    col = col || '#000';
    const c = Math.cos(ang), s = Math.sin(ang), W = L * 0.36;
    const bx = x - c * L, by = y - s * L;
    const p1 = `${f(bx - s * W)},${f(by + c * W)}`, p2 = `${f(bx + s * W)},${f(by - c * W)}`, tip = `${f(x)},${f(y)}`;
    switch (st) {
      case 'tri': return `<path d="M${tip}L${p1}L${f(x - c * L * 0.72)},${f(y - s * L * 0.72)}L${p2}Z" fill="${col}" stroke="${col}" stroke-width="0.5" stroke-linejoin="round"/>`;
      case 'full': return `<path d="M${tip}L${p1}L${p2}Z" fill="${col}" stroke="${col}" stroke-width="0.5" stroke-linejoin="round"/>`;
      case 'open': return `<path d="M${p1}L${tip}L${p2}" fill="none" stroke="${col}" stroke-width="${f(sw || 1.5)}" stroke-linecap="round" stroke-linejoin="round"/>`;
      case 'dot': return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(L * 0.28)}" fill="${col}"/>`;
      case 'bar': return `<line x1="${f(x - s * W * 1.3)}" y1="${f(y + c * W * 1.3)}" x2="${f(x + s * W * 1.3)}" y2="${f(y - c * W * 1.3)}" stroke="${col}" stroke-width="${f(sw || 1.5)}" stroke-linecap="round"/>`;
    }
    return '';
  };

  /* ---------- 迷你 TeX 排版引擎 ----------
     x_1  v^2  x_1^2  F_{net}  \theta  \rm{m s^{-1}}  \bf{F}  \vec{F}  \sqrt{2gh}
     \frac{a}{b}  或  {a}/{b}   （竖式 / 横式 可切换；\dfrac 总是竖式，\tfrac 总是横式）
     \nuc{235}{92}{U}  或  {}^{235}_{92}\rm{U}   （左上质量数，左下原子序数，右对齐） */
  PD.SYM = {
    alpha: 'α', beta: 'β', gamma: 'γ', Gamma: 'Γ', delta: 'δ', Delta: 'Δ', epsilon: 'ε', varepsilon: 'ε', zeta: 'ζ', eta: 'η',
    theta: 'θ', Theta: 'Θ', kappa: 'κ', lambda: 'λ', Lambda: 'Λ', mu: 'μ', nu: 'ν', xi: 'ξ', pi: 'π', rho: 'ρ', sigma: 'σ', Sigma: 'Σ',
    tau: 'τ', phi: 'φ', varphi: 'φ', Phi: 'Φ', chi: 'χ', psi: 'ψ', omega: 'ω', Omega: 'Ω',
    deg: '°', degree: '°', circ: '°', times: '×', cdot: '·', pm: '±', to: '→', rightarrow: '→', leftarrow: '←', uparrow: '↑', downarrow: '↓',
    infty: '∞', approx: '≈', neq: '≠', le: '≤', ge: '≥', propto: '∝', parallel: '∥', perp: '⊥', odot: '⊙', otimes: '⊗',
    partial: '∂', nabla: '∇', hbar: 'ħ', prime: '′', minus: '−', angle: '∠', sim: '~', quad: '\u2003', qquad: '\u2003\u2003',
    rightleftharpoons: '⇌', Rightarrow: '⇒', therefore: '∴', because: '∵', ohm: 'Ω', micro: 'μ', AA: 'Å',
  };
  const RM = { rm: 1, text: 1, mathrm: 1, textrm: 1 }, BF = { bf: 1, mathbf: 1, textbf: 1 }, IT = { it: 1, mathit: 1, textit: 1 };
  function parse(src, st, scr) {
    const out = []; let i = 0;
    const add = (t, y) => { if (!t) return; const L = out[out.length - 1]; if (L && L.k === 's' && L.it === y.it && L.bf === y.bf) L.s += t; else out.push({ k: 's', s: t, it: y.it, bf: y.bf }); };
    const arg = () => {
      while (src[i] === ' ') i++;
      if (src[i] === '{') { let d = 1, j = i + 1; while (j < src.length && d) { if (src[j] === '\\') { j += 2; continue; } if (src[j] === '{') d++; else if (src[j] === '}') d--; j++; } const g = src.slice(i + 1, d ? j : j - 1); i = j; return g; }
      if (src[i] === '\\') { const m = /^\\([a-zA-Z]+)/.exec(src.slice(i)); if (m) { i += m[0].length; return '\\' + m[1]; } const g = src.slice(i, i + 2); i += 2; return g; }
      const c = src[i] || ''; i++; return c;
    };
    while (i < src.length) {
      const c = src[i];
      if (c === '{') {
        const g = arg(), node = { k: 'g', c: parse(g, st, scr), empty: g.trim() === '' };
        let j = i; while (src[j] === ' ') j++;
        if (src[j] === '/') { let k = j + 1; while (src[k] === ' ') k++; if (src[k] === '{') { i = k; const g2 = arg(); out.push({ k: 'frac', n: node.c, d: parse(g2, st, scr) }); continue; } }
        out.push(node); continue;
      }
      if (c === '}') { i++; continue; }
      if (c === '^' || c === '_') {
        i++; const key = c === '^' ? 'sup' : 'sub', sub = parse(arg(), st, true), L = out[out.length - 1];
        if (L && L.k === 'sc' && !L[key]) { L[key] = sub; continue; }
        const pre = !L || (L.k === 'g' && L.empty);
        if (L && L.k === 'g' && L.empty) out.pop();
        const n = { k: 'sc', pre, sub: null, sup: null }; n[key] = sub; out.push(n); continue;
      }
      if (c === '\\') {
        const m = /^\\([a-zA-Z]+)/.exec(src.slice(i));
        if (!m) { const nx = src[i + 1] || ''; i += 2; add(nx === ' ' ? ' ' : ',;:'.includes(nx) ? '\u2009' : nx, st); continue; }
        i += m[0].length; const n = m[1];
        if (RM[n]) { out.push({ k: 'g', c: parse(arg(), { it: false, bf: st.bf }, scr) }); continue; }
        if (BF[n]) { out.push({ k: 'g', c: parse(arg(), { it: false, bf: true }, scr) }); continue; }
        if (IT[n]) { out.push({ k: 'g', c: parse(arg(), { it: true, bf: st.bf }, scr) }); continue; }
        if (n === 'frac' || n === 'dfrac' || n === 'tfrac') { const A = arg(), B = arg(); out.push({ k: 'frac', n: parse(A, st, scr), d: parse(B, st, scr), force: n === 'dfrac' ? 'stack' : n === 'tfrac' ? 'inline' : null }); continue; }
        if (n === 'Roman' || n === 'roman') { const r = PD.roman(parseInt(arg(), 10)); add(n === 'roman' ? r.toLowerCase() : r, { it: false, bf: st.bf }); continue; }
        if (n === 'nuc') { const A = arg(), Z = arg(), X = arg(); out.push({ k: 'sc', pre: true, sup: parse(A, { it: false, bf: st.bf }, true), sub: parse(Z, { it: false, bf: st.bf }, true) }); out.push({ k: 'g', c: parse(X, { it: false, bf: st.bf }, scr) }); continue; }
        if (n === 'vec' || n === 'bar' || n === 'overline' || n === 'sqrt') { out.push({ k: 'acc', a: n, c: parse(arg(), st, scr) }); continue; }
        add(PD.SYM[n] ?? n, st); continue;
      }
      add(c === '-' && (scr || !(/[A-Za-z]/.test(src[i - 1] || '') && /[A-Za-z]/.test(src[i + 1] || ''))) ? '−' : c, st); i++;
    }
    return out;
  }
  PD.roman = (v) => {
    if (!(v > 0 && v < 4000)) return String(isNaN(v) ? '' : v);
    const T = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
    let r = ''; T.forEach(([n, c]) => { while (v >= n) { r += c; v -= n; } }); return r;
  };
  PD.parseTex = (s, st) => parse(String(s ?? ''), st || { it: true, bf: false }, false);

  PD._mc = new Map();
  PD.measure = (s, z, it, bf, font) => {
    const key = s + '|' + z + '|' + (it ? 1 : 0) + (bf ? 1 : 0) + '|' + font;
    let w = PD._mc.get(key); if (w != null) return w;
    if (typeof document !== 'undefined' && document.createElement) {
      const c = PD._mctx || (PD._mctx = document.createElement('canvas').getContext('2d'));
      c.font = `${it ? 'italic ' : ''}${bf ? 'bold ' : ''}${z}px ${PD.fontStack(font)}`; w = c.measureText(s.replace(/ /g, '\u00a0')).width;
    } else {
      w = 0; for (const ch of s) w += z * (/[\u3000-\u9fff\uff00-\uffef]/.test(ch) ? 1 : /[A-Z]/.test(ch) ? 0.68 : /[il.,:;'!| \u2009]/.test(ch) ? 0.28 : /[mwMW]/.test(ch) ? 0.75 : 0.5);
    }
    if (PD._mc.size > 8000) PD._mc.clear();
    PD._mc.set(key, w); return w;
  };
  const flat = (ns) => ns.map((n) => (n.k === 's' ? n.s : n.c ? flat(n.c) : n.k === 'frac' ? flat(n.n) + '/' + flat(n.d) : '##')).join('');
  const mv = (q, dx, dy) => (q.k === 't' ? Object.assign({}, q, { x: q.x + dx, y: q.y + dy }) : Object.assign({}, q, { pts: q.pts.map(([a, b]) => [a + dx, b + dy]) }));

  function lay(nodes, z, ctx, mode) {
    let x = 0, A = z * 0.72, D = z * 0.22, lastIt = false;
    const e = [], put = (b, dx, dy) => { b.e.forEach((q) => e.push(mv(q, dx, dy))); A = Math.max(A, b.a - dy); D = Math.max(D, b.d + dy); };
    const th = Math.max(0.7, z * 0.055);
    for (const n of nodes) {
      if (n.k === 's') {
        e.push({ k: 't', x, y: 0, s: n.s, z, it: n.it, bf: n.bf }); x += PD.measure(n.s, z, n.it, n.bf, ctx.font);
        lastIt = n.it && /[A-Za-zα-ω]$/.test(n.s);
      } else if (n.k === 'g') {
        const b = lay(n.c, z, ctx, mode); put(b, x, 0); x += b.w; lastIt = false;
      } else if (n.k === 'sc') {
        const zs = z * 0.7, bs = n.sup && lay(n.sup, zs, ctx, mode), bb = n.sub && lay(n.sub, zs, ctx, mode);
        let up = z * (bs && bb ? 0.46 : 0.42), dn = z * (bs && bb ? 0.3 : 0.22);
        if (bs && bb) { const gap = dn - bb.a - (-up + bs.d); if (gap < z * 0.1) { const k = (z * 0.1 - gap) / 2; up += k; dn += k; } }
        const ws = bs ? bs.w : 0, wb = bb ? bb.w : 0, kern = !n.pre && lastIt ? z * 0.07 : 0, W = Math.max(ws + kern, wb);
        if (n.pre) { if (bs) put(bs, x + W - ws, -up); if (bb) put(bb, x + W - wb, dn); x += W + z * 0.03; }
        else { if (bs) put(bs, x + kern, -up); if (bb) put(bb, x, dn); x += W + z * 0.02; }
        lastIt = false;
      } else if (n.k === 'frac') {
        const fm = n.force || mode;
        if (fm === 'inline') {
          const wrap = (ns) => (/[\s+−\-=×·]/.test(flat(ns)) || ns.some((q) => q.k === 'frac') ? [{ k: 's', s: '(', it: false, bf: false }, ...ns, { k: 's', s: ')', it: false, bf: false }] : ns);
          const b = lay([...wrap(n.n), { k: 's', s: '/', it: false, bf: false }, ...wrap(n.d)], z, ctx, mode); put(b, x, 0); x += b.w;
        } else {
          const zf = z * 0.92, nb = lay(n.n, zf, ctx, mode), db = lay(n.d, zf, ctx, mode);
          const pad = z * 0.1, W = Math.max(nb.w, db.w) + 2 * pad, ax = -z * 0.27, gp = z * 0.14;
          x += z * 0.06;
          const yn = ax - th / 2 - gp - nb.d, yd = ax + th / 2 + gp + db.a;
          put(nb, x + (W - nb.w) / 2, yn); put(db, x + (W - db.w) / 2, yd);
          e.push({ k: 'l', pts: [[x + z * 0.03, ax], [x + W - z * 0.03, ax]], sw: th });
          x += W + z * 0.06;
        }
        lastIt = false;
      } else if (n.k === 'acc') {
        const b = lay(n.c, z, ctx, mode);
        if (n.a === 'sqrt') {
          const x0 = x, ox = z * 0.55, top = -(b.a + z * 0.1);
          put(b, x + ox, 0);
          e.push({ k: 'l', pts: [[x0 + z * 0.02, -z * 0.28], [x0 + z * 0.14, -z * 0.36], [x0 + z * 0.28, b.d * 0.6], [x0 + z * 0.48, top], [x0 + ox + b.w + z * 0.06, top]], sw: th });
          A = Math.max(A, -top + th); x += ox + b.w + z * 0.1;
        } else {
          const sk = lastIt || (n.c[0] && n.c[0].it) ? z * 0.08 : 0, w = Math.max(b.w, z * 0.45), cx = x + b.w / 2 + sk;
          put(b, x, 0);
          const y = -(b.a + z * (n.a === 'vec' ? 0.14 : 0.08)), x1 = cx - w / 2, x2 = cx + w / 2;
          if (n.a === 'vec') {
            const h = z * 0.16;
            e.push({ k: 'l', pts: [[x1, y], [x2 - h * 0.6, y]], sw: th });
            e.push({ k: 'p', pts: [[x2, y], [x2 - h * 1.3, y - h * 0.55], [x2 - h * 1.3, y + h * 0.55]] });
          } else e.push({ k: 'l', pts: [[x1, y], [x2, y]], sw: th });
          A = Math.max(A, -y + z * 0.15); x += b.w;
        }
        lastIt = false;
      }
    }
    return { w: x, a: A, d: D, e };
  }
  PD.layoutTex = (s, z, ctx, o = {}) => lay(PD.parseTex(s, { it: o.italic !== false, bf: !!o.bold }), z, ctx, o.frac || 'stack');

  PD.tex = (ctx, s, x, y, o = {}) => {
    s = String(s ?? ''); if (!s) return '';
    const z = +o.size || 16, col = o.color || '#000';
    const mode = o.frac && o.frac !== 'auto' ? o.frac : (ctx.doc && ctx.doc.frac) || 'stack';
    const b = PD.layoutTex(s, z, ctx, { italic: o.italic, bold: o.bold, frac: mode });
    const dx = o.anchor === 'end' ? -b.w : o.anchor === 'start' ? 0 : -b.w / 2, dy = z * 0.35;
    let inner = '';
    for (const q of b.e) {
      if (q.k === 't') inner += `<text x="${f(q.x)}" y="${f(q.y)}" font-size="${f(q.z)}"${q.it ? ' font-style="italic"' : ''}${q.bf ? ' font-weight="bold"' : ''}>${PD.esc(q.s).replace(/ /g, '\u00a0')}</text>`;
      else if (q.k === 'l') inner += `<polyline points="${q.pts.map((p) => f(p[0]) + ',' + f(p[1])).join(' ')}" fill="none" stroke="${col}" stroke-width="${f(q.sw)}" stroke-linecap="round" stroke-linejoin="round"/>`;
      else inner += `<polygon points="${q.pts.map((p) => f(p[0]) + ',' + f(p[1])).join(' ')}" fill="${col}" stroke="none"/>`;
    }
    const halo = o.halo ? ` stroke="${o.haloColor || '#ffffff'}" stroke-width="3.5" stroke-linejoin="round" paint-order="stroke"` : '';
    const rot = (ctx.flip ? ' scale(-1,1)' : '') + (ctx.rot ? ` rotate(${f(-ctx.rot)})` : '');
    return `<g transform="translate(${f(x)},${f(y)})${rot} translate(${f(dx)},${f(dy)})" font-family="${PD.esc(PD.fontStack(ctx.font))}" fill="${col}"${halo} xml:space="preserve" style="white-space:pre">${inner}</g>`;
  };

  /* ---------- 3D 投影 ---------- */
  PD.PROJ = [['oblique', '斜二测(课本常用)'], ['iso', '等轴测'], ['ortho', '自定义正投影'], ['persp', '透视']];
  PD.projDef = { proj: 'oblique', az: 30, el: 20, ok: 0.5, oa: 45, fd: 700 };
  const isOrtho = (p) => p.proj === 'ortho' || p.proj === 'persp';
  PD.projFields = [
    { k: 'proj', t: 'sel', l: '投影方式', o: PD.PROJ, rebuild: true },
    { k: 'az', t: 'range', l: '方位角', min: -90, max: 90, step: 1, when: isOrtho },
    { k: 'el', t: 'range', l: '仰角', min: -60, max: 90, step: 1, when: isOrtho },
    { k: 'ok', t: 'range', l: '纵深缩比', min: 0.2, max: 1, step: 0.05, when: (p) => p.proj === 'oblique' },
    { k: 'oa', t: 'range', l: '纵深角度°', min: 0, max: 90, step: 5, when: (p) => p.proj === 'oblique' },
    { k: 'fd', t: 'num', l: '透视视距', step: 50, when: (p) => p.proj === 'persp' },
  ];
  // 世界坐标: X 向右, Y 向上, Z 指向观察者。返回 {x,y(SVG,向下),d(深度,越大越近)}
  PD.projector = (p) => {
    const mode = p.proj || 'oblique', R = Math.PI / 180;
    if (mode === 'oblique') {
      const k = p.ok ?? 0.5, a = (p.oa ?? 45) * R, ca = Math.cos(a), sa = Math.sin(a);
      return (X, Y, Z) => ({ x: X - k * Z * ca, y: -(Y - k * Z * sa), d: Z });
    }
    let az = p.az ?? 30, el = p.el ?? 20;
    if (mode === 'iso') { az = 45; el = 35.264; }
    const cA = Math.cos(az * R), sA = Math.sin(az * R), cE = Math.cos(el * R), sE = Math.sin(el * R), D = +p.fd || 700;
    return (X, Y, Z) => {
      const x1 = X * cA - Z * sA, z1 = X * sA + Z * cA, up = Y * cE - z1 * sE, d = Y * sE + z1 * cE;
      if (mode === 'persp') { const s = D / Math.max(1, D - d); return { x: x1 * s, y: -up * s, d }; }
      return { x: x1, y: -up, d };
    };
  };

  const V3 = (PD.V3 = {
    sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
  });
  PD.LIGHT = V3.norm([-0.45, 0.8, 0.55]);
  PD.HIDDEN = [['dash', '虚线'], ['none', '不画'], ['solid', '实线(透明体)']];

  // 凸多面体：自动背面剔除、隐藏边虚线、按光照着色
  PD.polyhedron = (p, ctx, V, F) => {
    const P = PD.projector(p), pv = V.map((v) => P(v[0], v[1], v[2]));
    const C = [0, 1, 2].map((k) => V.reduce((s, v) => s + v[k], 0) / V.length);
    const faces = F.map((f0) => {
      const fa = f0.slice();
      let n = V3.cross(V3.sub(V[fa[1]], V[fa[0]]), V3.sub(V[fa[2]], V[fa[0]]));
      const fc = [0, 1, 2].map((k) => fa.reduce((s, i) => s + V[i][k], 0) / fa.length);
      if (V3.dot(n, V3.sub(fc, C)) < 0) { fa.reverse(); n = n.map((x) => -x); }
      let A = 0;
      for (let i = 0; i < fa.length; i++) { const a = pv[fa[i]], b = pv[fa[(i + 1) % fa.length]]; A += a.x * -b.y - b.x * -a.y; }
      return { f: fa, n: V3.norm(n), vis: A > 1e-6 };
    });
    const E = new Map();
    faces.forEach((fc) => fc.f.forEach((v, i) => {
      const w = fc.f[(i + 1) % fc.f.length], key = Math.min(v, w) + '_' + Math.max(v, w);
      let e = E.get(key); if (!e) { e = { a: v, b: w, vis: false }; E.set(key, e); }
      if (fc.vis) e.vis = true;
    }));
    const pt = (i) => `${f(pv[i].x)},${f(pv[i].y)}`;
    const ln = (e, attr) => `<line x1="${f(pv[e.a].x)}" y1="${f(pv[e.a].y)}" x2="${f(pv[e.b].x)}" y2="${f(pv[e.b].y)}" ${attr}/>`;
    let out = '';
    faces.filter((x) => x.vis).forEach((fc) => {
      let fa;
      if (p.shading) { const lam = Math.max(0, V3.dot(fc.n, PD.LIGHT)); fa = `fill="${PD.shade(p.fill, -0.45 + 0.75 * lam)}"`; }
      else fa = PD.fillAttr(p, ctx);
      if (fa !== 'fill="none"') out += `<polygon points="${fc.f.map(pt).join(' ')}" ${fa} stroke="none"/>`;
    });
    const hid = p.hidden || 'dash';
    if (hid !== 'none') E.forEach((e) => { if (!e.vis) out += ln(e, PD.strokeAttr(p, hid === 'dash' ? { dash: 'dash', sw: (+p.sw || 1.5) * 0.8 } : {})); });
    E.forEach((e) => { if (e.vis) out += ln(e, PD.strokeAttr(p)); });
    return { out, pv, P };
  };

  /* ---------- 平滑曲线（Catmull-Rom → 贝塞尔） ---------- */
  PD.smoothPath = (P, closed) => {
    const n = P.length; if (n < 2) return '';
    const g = (i) => (closed ? P[(i + n) % n] : P[Math.max(0, Math.min(n - 1, i))]);
    let d = `M${f(P[0][0])},${f(P[0][1])}`;
    for (let i = 0; i < (closed ? n : n - 1); i++) {
      const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
      d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`;
    }
    return d + (closed ? 'Z' : '');
  };
  PD.ptsStr = (P) => P.map((q) => f(q[0]) + ',' + f(q[1])).join(' ');

  /* ---------- 坐标变换 / 端口（电路连线用） ---------- */
  PD.xform = (o, lx, ly) => {
    if (o.flip) lx = -lx;
    const s = +o.scale || 1, a = ((+o.rot || 0) * Math.PI) / 180, c = Math.cos(a), si = Math.sin(a);
    return [o.x + s * (lx * c - ly * si), o.y + s * (lx * si + ly * c)];
  };
  PD.docToLocal = (o, X, Y) => {
    const s = +o.scale || 1, a = ((+o.rot || 0) * Math.PI) / 180, c = Math.cos(a), si = Math.sin(a), dx = X - o.x, dy = Y - o.y;
    const x = (dx * c + dy * si) / s, y = (-dx * si + dy * c) / s;
    return [o.flip ? -x : x, y];
  };
  // def.ports(o) → [[x, y, nx, ny], ...]（局部坐标；n 为导线离开端口的方向，0,0 = 任意）
  PD.portList = (o) => { const d = o && PD.shapes[o.type]; if (!d || !d.ports) return []; try { return d.ports(o) || []; } catch (e) { return []; } };
  PD.portDoc = (o, i) => {
    const P = PD.portList(o)[+i || 0]; if (!P) return null;
    const a = PD.xform(o, P[0], P[1]), b = PD.xform(o, P[0] + (P[2] || 0), P[1] + (P[3] || 0));
    return { x: a[0], y: a[1], nx: b[0] - a[0], ny: b[1] - a[1] };
  };
  PD._wc = typeof WeakMap !== 'undefined' ? new WeakMap() : new Map(); // 导线端点缓存（给控制点用）

  /* ---------- 对象绑定：渲染前同步（def.sync(o, idMap, doc)） ---------- */
  PD.findObj = (doc, id) => (id === '' || id == null || !doc || !doc.objs ? null : doc.objs.find((x) => String(x.id) === String(id)) || null);
  PD.syncBinds = (doc) => {
    if (!doc || !doc.objs) return;
    const m = new Map(doc.objs.map((o) => [String(o.id), o]));
    doc.objs.forEach((o) => {
      if (o.type === 'group') PD.syncBinds({ objs: o.children || [] });
      const d = PD.shapes[o.type]; if (d && d.sync) try { d.sync(o, m, doc); } catch (e) {}
    });
  };

  /* ---------- 渲染单个对象 ---------- */
  PD.renderObj = (o, doc, mode, idOverride) => {
    const def = PD.shapes[o.type]; if (!def) return '';
    const pr = (doc && doc.__pr) || 0, pf = !!(doc && doc.__pf);
    const ctx = { id: idOverride || 'o' + o.id, defs: [], font: (doc && doc.font) || 'Times New Roman', rot: pr + (pf ? -1 : 1) * (+o.rot || 0), flip: pf !== !!o.flip, doc, mode };
    let inner;
    try { inner = def.render(o, ctx); } catch (e) { inner = `<text x="0" y="0" fill="red" font-size="12">⚠ ${PD.esc(e.message)}</text>`; }
    let filt = '';
    if (o.shadow) {
      const fid = ctx.id + '-sh';
      ctx.defs.push(`<filter id="${fid}" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="3" dy="3" stdDeviation="2.2" flood-color="#000" flood-opacity="0.32"/></filter>`);
      filt = ` filter="url(#${fid})"`;
    }
    const tr = `translate(${f(o.x)},${f(o.y)})` + (+o.rot ? ` rotate(${f(o.rot)})` : '') + ((o.scale ?? 1) !== 1 ? ` scale(${+o.scale})` : '') + (o.flip ? ' scale(-1,1)' : '');
    const op = (o.opacity ?? 1) < 1 ? ` opacity="${o.opacity}"` : '';
    const attr = mode === 'edit' ? ` data-id="${o.id}" class="obj"` : '';
    return `<g${attr} transform="${tr}"${op}${filt}>${ctx.defs.length ? '<defs>' + ctx.defs.join('') + '</defs>' : ''}${inner}</g>`;
  };

  /* ---------- 组合 ----------
     children 存在组内（组的局部坐标，原点 = 组合时的包围盒左上角）；组自身有 x/y/rot/scale/flip/opacity/shadow。
     fields 带 apply 的项会被编辑器递归写入所有成员。 */
  PD.register({
    type: 'group', name: '组合',
    defaults: { children: [], bw: 0, bh: 0, gStroke: '#000000', gSw: 1.5, gFill: '#cfd8e3' },
    getHandles: (p) => (+p.bw > 0 && +p.bh > 0 ? [[+p.bw, +p.bh]] : []),
    setHandle(p, i, x, y) {
      const r = (x / (+p.bw || 1) + y / (+p.bh || 1)) / 2;
      if (r > 0.02) p.scale = Math.round(Math.max(0.05, (+p.scale || 1) * r) * 1000) / 1000;
    },
    fields: [
      { k: 'gStroke', t: 'color', l: '统一线条/文字色', apply: 'stroke' },
      { k: 'gSw', t: 'num', l: '统一线宽', step: 0.25, min: 0, apply: 'sw' },
      { k: 'gFill', t: 'color', l: '统一填充色', apply: 'fill' },
    ],
    style: ['opacity', 'shadow'],
    render(p, ctx) {
      const kids = p.children || [];
      const sub = Object.assign({}, ctx.doc || {}, { objs: kids, font: ctx.font, __pr: ctx.rot, __pf: ctx.flip });
      return kids.map((c) => PD.renderObj(c, sub, 'child')).join('');
    },
  });
})();
