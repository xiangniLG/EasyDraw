/* PhyDraw editor — 画布交互、多选/框选/组合、图层、属性面板、撤销、导入导出 */
(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const f = PD.f;
  const LS = 'phydraw.doc.v1', LSC = 'phydraw.cats';
  const IS_MAC = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent || '');
  const K = { mod: IS_MAC ? '⌘' : 'Ctrl', alt: IS_MAC ? '⌥Option' : 'Alt' };
  const S = { doc: null, sel: [], zoom: 1, hist: [], hi: -1, drag: null, clip: null, pp: 0 };

  const newDoc = () => ({ w: 900, h: 600, bg: '#ffffff', grid: 10, showGrid: true, snap: true, snapStep: 10, frac: 'stack', font: 'Times New Roman', crop: true, png: 4, objs: [], nid: 1 });
  const getObj = (id) => S.doc.objs.find((o) => o.id === id);
  const selObjs = () => S.doc.objs.filter((o) => S.sel.includes(o.id));
  const one = () => (S.sel.length === 1 ? getObj(S.sel[0]) || null : null);
  const snapOn = (o) => (o && o.snap === 'on') || (!(o && o.snap === 'off') && !!S.doc.snap);
  const snapTo = (v) => { const g = +S.doc.snapStep || +S.doc.grid || 10; return Math.round(v / g) * g; };
  const snapv = (v, o, invert) => ((snapOn(o) !== !!invert) ? snapTo(v) : Math.round(v * 10) / 10);
  const walk = (o, fn) => { fn(o); (o.children || []).forEach((c) => walk(c, fn)); };

  /* ---------- 历史 ---------- */
  function commit() {
    const js = JSON.stringify(S.doc);
    if (S.hist[S.hi] === js) return;
    S.hist = S.hist.slice(0, S.hi + 1); S.hist.push(js);
    if (S.hist.length > 200) S.hist.shift();
    S.hi = S.hist.length - 1;
    try { localStorage.setItem(LS, js); } catch (e) { if (!S.warned) { S.warned = 1; toast('浏览器存储已满（图片太多？），请用「保存」导出 .json 备份'); } }
    updateUndo();
  }
  function restore(js) { S.doc = JSON.parse(js); S.sel = S.sel.filter((id) => getObj(id)); layout(); renderAll(); buildPanel(); try { localStorage.setItem(LS, js); } catch (e) {} updateUndo(); }
  const undo = () => { if (S.hi > 0) restore(S.hist[--S.hi]); };
  const redo = () => { if (S.hi < S.hist.length - 1) restore(S.hist[++S.hi]); };
  const updateUndo = () => { $('#bUndo').disabled = S.hi <= 0; $('#bRedo').disabled = S.hi >= S.hist.length - 1; };
  function loadDoc(d) { S.doc = Object.assign(newDoc(), d); S.sel = []; S.hist = []; S.hi = -1; layout(); renderAll(); buildPanel(); commit(); }

  /* ---------- 画布 ---------- */
  function layout() {
    const d = S.doc, svg = $('#cv');
    svg.setAttribute('viewBox', `0 0 ${d.w} ${d.h}`);
    svg.setAttribute('width', d.w * S.zoom); svg.setAttribute('height', d.h * S.zoom);
    const bg = $('#bgRect'); bg.setAttribute('width', d.w); bg.setAttribute('height', d.h);
    bg.setAttribute('fill', d.bg === 'none' ? 'url(#checker)' : d.bg);
    const g = +d.grid || 10;
    $('#gMinor').setAttribute('width', g); $('#gMinor').setAttribute('height', g);
    $('#gMinor path').setAttribute('d', `M${g},0H0V${g}`);
    $('#gMajor').setAttribute('width', g * 5); $('#gMajor').setAttribute('height', g * 5);
    $('#gMajor path').setAttribute('d', `M${g * 5},0H0V${g * 5}`);
    const gr = $('#gridRect'); gr.setAttribute('width', d.w); gr.setAttribute('height', d.h); gr.style.display = d.showGrid ? '' : 'none';
    $('#zoomLbl').textContent = Math.round(S.zoom * 100) + '%';
    if (document.activeElement !== $('#cvW')) $('#cvW').value = d.w;
    if (document.activeElement !== $('#cvH')) $('#cvH').value = d.h;
    $('#bGrid').classList.toggle('on', !!d.showGrid); $('#bSnap').classList.toggle('on', !!d.snap);
  }
  function renderAll() { PD.syncBinds(S.doc); $('#scene').innerHTML = S.doc.objs.map((o) => PD.renderObj(o, S.doc, 'edit')).join(''); renderOverlay(); }

  const rad = (o) => ((+o.rot || 0) * Math.PI) / 180;
  function toDoc(o, lx, ly) { if (o.flip) lx = -lx; const s = +o.scale || 1, a = rad(o), c = Math.cos(a), si = Math.sin(a); return [o.x + s * (lx * c - ly * si), o.y + s * (lx * si + ly * c)]; }
  function toLocalVec(o, dx, dy) { const s = +o.scale || 1, a = rad(o), c = Math.cos(a), si = Math.sin(a); const x = (dx * c + dy * si) / s, y = (-dx * si + dy * c) / s; return [o.flip ? -x : x, y]; }
  function clientToDoc(cx, cy) { const svg = $('#cv'), pt = svg.createSVGPoint(); pt.x = cx; pt.y = cy; const q = pt.matrixTransform(svg.getScreenCTM().inverse()); return [q.x, q.y]; }
  const hv = (o, k) => (k === 'zero' ? 0 : +o[k] || 0);
  function handleList(o) {
    const def = PD.shapes[o.type]; if (!def) return [];
    if (def.getHandles) { try { return def.getHandles(o) || []; } catch (e) { return []; } }
    return (def.handles || []).map((k) => [hv(o, k[0]) * (k[2] ?? 1) + (k[4] || 0), hv(o, k[1]) * (k[3] ?? 1) + (k[5] || 0)]);
  }
  // 绑定跟随：被移动后更新相对目标的偏移
  function afterMove(o) {
    if (o && o.bind !== undefined && o.bind !== '') { const t = getObj(+o.bind); if (t && t !== o) { o.bx = f(o.x - t.x); o.by = f(o.y - t.y); } }
  }
  // 包围盒（文档坐标）
  function clientBox(o) {
    const g = $(`#scene [data-id="${o.id}"]`); if (!g) return null;
    const r = g.getBoundingClientRect(), a = clientToDoc(r.left, r.top), b = clientToDoc(r.right, r.bottom);
    return { x0: a[0], y0: a[1], x1: b[0], y1: b[1] };
  }
  function unionBox(bs) {
    bs = bs.filter(Boolean); if (!bs.length) return null;
    return { x0: Math.min(...bs.map((b) => b.x0)), y0: Math.min(...bs.map((b) => b.y0)), x1: Math.max(...bs.map((b) => b.x1)), y1: Math.max(...bs.map((b) => b.y1)) };
  }
  const boxCenter = (b) => [(b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2];
  function objCenter(o) { const b = clientBox(o); return b ? boxCenter(b) : [o.x, o.y]; }
  function selCenter(list) { const U = unionBox(list.map(clientBox)); return U ? boxCenter(U) : [0, 0]; }
  const normDeg = (a) => { a = ((a % 360) + 540) % 360 - 180; return a === -180 ? 180 : Math.round(a * 10) / 10; };
  // 绕点 c 旋转到 newRot（同时平移原点，使视觉中心不动）
  function rotateAbout(o, c, newRot, base) {
    base = base || { x: o.x, y: o.y, r: +o.rot || 0 };
    const dl = ((newRot - base.r) * Math.PI) / 180, cs = Math.cos(dl), sn = Math.sin(dl), vx = base.x - c[0], vy = base.y - c[1];
    o.x = f(c[0] + vx * cs - vy * sn); o.y = f(c[1] + vx * sn + vy * cs); o.rot = normDeg(newRot);
  }

  /* ---------- 选择框 / 控制点 ---------- */
  function rectSvg(b, cls, pad, z) {
    return `<rect x="${f(b.x0 - pad)}" y="${f(b.y0 - pad)}" width="${f(b.x1 - b.x0 + 2 * pad)}" height="${f(b.y1 - b.y0 + 2 * pad)}" class="${cls}" stroke-width="${z}" stroke-dasharray="${4 * z} ${3 * z}"/>`;
  }
  function renderOverlay() {
    const z = 1 / S.zoom, list = selObjs(); let h = '';
    if (list.length) {
      const boxes = list.map(clientBox);
      if (list.length > 1) boxes.forEach((b) => b && (h += rectSvg(b, 'selbox2', 2 * z, z)));
      const U = unionBox(boxes);
      if (U) {
        h += rectSvg(U, 'selbox', 4 * z, z);
        // 旋转手柄（PPT 式）
        const cx = (U.x0 + U.x1) / 2, top = U.y0 - 4 * z, hy = top - 28 * z;
        h += `<line x1="${f(cx)}" y1="${f(top)}" x2="${f(cx)}" y2="${f(hy + 10 * z)}" class="rotstem" stroke-width="${z}"/>`;
        const A = (-46 * Math.PI) / 180, ax = 5 * Math.cos(A), ay = 5 * Math.sin(A), tg = Math.atan2(Math.cos(A), -Math.sin(A));
        const B = (44 * Math.PI) / 180, bx = 5 * Math.cos(B), by = 5 * Math.sin(B);
        h += `<g class="rothdl" data-rot="1" transform="translate(${f(cx)},${f(hy)}) scale(${z})"><title>拖动旋转 · Shift 每 15° · 双击归零</title>` +
          `<circle r="10" class="rotbg"/><path d="M${f(bx)},${f(by)}A5,5 0 1 1 ${f(ax)},${f(ay)}" class="rotarc"/>` +
          PD.arrowHead(ax + Math.cos(tg) * 2.6, ay + Math.sin(tg) * 2.6, tg, 4.4, 'full', '#2f6fde', 1) + `</g>`;
        if (S.drag && S.drag.mode === 'rot') h += `<text x="${f(cx + 16 * z)}" y="${f(hy + 4 * z)}" class="rotlbl" font-size="${f(12 * z)}">${PD.fmt(S.drag.cur || 0)}°</text>`;
      }
    }
    const o = one();
    if (o && PD.shapes[o.type]) {
      const def = PD.shapes[o.type], H = handleList(o).map((q) => toDoc(o, q[0], q[1]));
      (def.handleLines || []).forEach(([a, b]) => {
        const A = a === 'o' ? [o.x, o.y] : H[a], B = b === 'o' ? [o.x, o.y] : H[b];
        if (A && B) h += `<line x1="${f(A[0])}" y1="${f(A[1])}" x2="${f(B[0])}" y2="${f(B[1])}" class="hline" stroke-width="${z}"/>`;
      });
      const dot = (X, Y, i, cls) => `<circle cx="${f(X)}" cy="${f(Y)}" r="${5 * z}" class="hdl ${cls || ''}" data-h="${i}" stroke-width="${1.5 * z}"/>`;
      if (def.originHandle && !def.getHandles) h += dot(o.x, o.y, 'o', 'org');
      H.forEach((q, i) => (h += dot(q[0], q[1], i)));
    }
    if (o && o.type === 'wire') {
      S.doc.objs.forEach((t) => { if (t === o || t.type === 'wire') return; PD.portList(t).forEach((_, i) => { const P = PD.portDoc(t, i); if (P) h += `<circle cx="${f(P.x)}" cy="${f(P.y)}" r="${4 * z}" class="port" stroke-width="${z}"/>`; }); });
      if (S.hot) h += `<circle cx="${f(S.hot.x)}" cy="${f(S.hot.y)}" r="${8 * z}" class="port hot" stroke-width="${2 * z}"/>`;
    }
    if (S.drag && S.drag.mode === 'marq' && S.drag.moved) {
      const d = S.drag, x0 = Math.min(d.sx, d.x), y0 = Math.min(d.sy, d.y);
      h += `<rect x="${f(x0)}" y="${f(y0)}" width="${f(Math.abs(d.x - d.sx))}" height="${f(Math.abs(d.y - d.sy))}" class="marq" stroke-width="${z}"/>`;
    }
    const cs = 12 * z;
    h += `<path d="M${f(S.doc.w)},${f(S.doc.h - cs)}L${f(S.doc.w)},${f(S.doc.h)}L${f(S.doc.w - cs)},${f(S.doc.h)}Z" class="cvr" data-cvr="1"><title>拖动调整画布大小</title></path>`;
    $('#overlay').innerHTML = h;
  }

  function hitTest(cx, cy) {
    let best = null, area = Infinity;
    $$('#scene [data-id]').forEach((g) => {
      const r = g.getBoundingClientRect(), pad = 5;
      if (cx >= r.left - pad && cx <= r.right + pad && cy >= r.top - pad && cy <= r.bottom + pad) {
        const a = r.width * r.height; if (a < area) { area = a; best = +g.dataset.id; }
      }
    });
    return best;
  }

  function setSel(ids) {
    ids = ids.filter((id) => getObj(id));
    const same = ids.length === S.sel.length && ids.every((x, i) => x === S.sel[i]);
    S.sel = ids; if (!same) buildPanel(); renderOverlay();
  }

  /* ---------- 指针交互 ---------- */
  function initCanvas() {
    const svg = $('#cv');
    svg.addEventListener('contextmenu', (e) => e.preventDefault()); // Mac 上 Ctrl+点击 = 右键
    svg.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      const [X, Y] = clientToDoc(e.clientX, e.clientY), tog = e.shiftKey || e.ctrlKey || e.metaKey;
      const cap = () => { try { svg.setPointerCapture(e.pointerId); } catch (er) {} e.preventDefault(); };
      if (e.target.closest('[data-rot]') && S.sel.length) {
        const list = selObjs(), c = list.length === 1 ? objCenter(list[0]) : selCenter(list);
        S.drag = { mode: 'rot', list, c, a0: Math.atan2(Y - c[1], X - c[0]), base: list.map((o) => ({ x: o.x, y: o.y, r: +o.rot || 0 })), moved: false, cur: list.length === 1 ? +list[0].rot || 0 : 0 };
        return cap();
      }
      if (e.target.closest('[data-cvr]')) { S.drag = { mode: 'cv', moved: false }; return cap(); }
      const h = e.target.closest('[data-h]');
      if (h && one()) { S.drag = { mode: 'h', h: h.dataset.h, o: one(), moved: false }; return cap(); }
      const t = e.target.closest('#scene [data-id]');
      const id = t ? +t.dataset.id : hitTest(e.clientX, e.clientY);
      if (id != null) {
        let wasSel = false;
        if (tog) {
          if (S.sel.includes(id)) { setSel(S.sel.filter((x) => x !== id)); e.preventDefault(); return; }
          setSel(S.sel.concat(id));
        } else if (!S.sel.includes(id)) setSel([id]);
        else wasSel = S.sel.length > 1;
        const list = selObjs(), prim = getObj(id);
        S.drag = { mode: 'm', id, wasSel, list, prim, sx: X, sy: Y, base: list.map((o) => [o.x, o.y]), pbase: [prim.x, prim.y], moved: false };
        return cap();
      }
      if (!tog) setSel([]);
      S.drag = { mode: 'marq', sx: X, sy: Y, x: X, y: Y, cx0: e.clientX, cy0: e.clientY, add: tog ? S.sel.slice() : [], moved: false };
      cap();
    });
    svg.addEventListener('pointermove', (e) => {
      const d = S.drag; if (!d) return;
      const [X, Y] = clientToDoc(e.clientX, e.clientY);
      if (d.mode === 'cv') {
        const nw = Math.max(100, Math.round(X / 10) * 10), nh = Math.max(80, Math.round(Y / 10) * 10);
        if (nw !== S.doc.w || nh !== S.doc.h) { S.doc.w = nw; S.doc.h = nh; d.moved = true; layout(); renderOverlay(); if (!S.sel.length) syncDocPanel(); }
        return;
      }
      if (d.mode === 'marq') {
        if (!d.moved && Math.hypot(e.clientX - d.cx0, e.clientY - d.cy0) < 3) return;
        d.moved = true; d.x = X; d.y = Y;
        const l = Math.min(d.cx0, e.clientX), r = Math.max(d.cx0, e.clientX), tp = Math.min(d.cy0, e.clientY), bt = Math.max(d.cy0, e.clientY);
        const inside = $$('#scene [data-id]').filter((g) => { const b = g.getBoundingClientRect(); return b.left >= l && b.right <= r && b.top >= tp && b.bottom <= bt; }).map((g) => +g.dataset.id);
        S.sel = S.doc.objs.map((o) => o.id).filter((id) => d.add.includes(id) || inside.includes(id));
        renderOverlay(); return;
      }
      if (d.mode === 'rot') {
        let dl = ((Math.atan2(Y - d.c[1], X - d.c[0]) - d.a0) * 180) / Math.PI;
        const r0 = d.list.length === 1 ? d.base[0].r : 0;
        let ang = r0 + dl;
        if (e.shiftKey) ang = Math.round(ang / 15) * 15;
        else { ang = Math.round(ang); const m = Math.round(ang / 90) * 90; if (Math.abs(ang - m) <= 3) ang = m; }
        dl = ang - r0;
        if (normDeg(ang) === d.cur) return;
        d.cur = normDeg(ang);
        d.list.forEach((o, i) => { rotateAbout(o, d.c, d.base[i].r + dl, d.base[i]); afterMove(o); });
        d.moved = true; renderAll(); syncPanel(); return;
      }
      if (d.mode === 'm') {
        const p = d.prim, sn = (v) => snapv(v, p, e.altKey);
        const dx = sn(d.pbase[0] + X - d.sx) - d.pbase[0], dy = sn(d.pbase[1] + Y - d.sy) - d.pbase[1];
        if (dx === (d.ldx || 0) && dy === (d.ldy || 0)) return;
        d.ldx = dx; d.ldy = dy;
        d.list.forEach((o, i) => { o.x = f(d.base[i][0] + dx); o.y = f(d.base[i][1] + dy); afterMove(o); });
        d.moved = true; renderAll(); syncPanel(); return;
      }
      const o = d.o, def = PD.shapes[o.type], sn = (v) => snapv(v, o, e.altKey);
      if (d.h === 'o') {
        const nx = sn(X), ny = sn(Y), [lx, ly] = toLocalVec(o, o.x - nx, o.y - ny);
        (def.handles || []).forEach(([kx, ky, sx = 1, sy = 1]) => { if (kx !== 'zero') o[kx] = f(o[kx] + lx / sx); if (ky !== 'zero') o[ky] = f(o[ky] + ly / sy); });
        o.x = nx; o.y = ny; afterMove(o);
      } else if (def.getHandles) {
        const ps = def.portSnap && def.portSnap[+d.h];
        const hit = ps && !e.altKey ? nearestPort(X, Y, o) : null;
        if (ps) { S.hot = hit; o[ps[0]] = hit ? String(hit.o.id) : ''; o[ps[1]] = hit ? hit.i : 0; }
        if (hit) { const l = PD.docToLocal(o, hit.x, hit.y); o[ps[2]] = f(l[0]); o[ps[3]] = f(l[1]); }
        else {
          const [lx, ly] = toLocalVec(o, X - o.x, Y - o.y), s = (+o.rot || 0) === 0 && (+o.scale || 1) === 1 && !o.flip;
          def.setHandle(o, +d.h, f(s ? sn(o.x + lx) - o.x : lx), f(s ? sn(o.y + ly) - o.y : ly));
        }
      } else {
        const [kx, ky, sx = 1, sy = 1, ox = 0, oy = 0] = def.handles[+d.h], [lx, ly] = toLocalVec(o, X - o.x, Y - o.y);
        const s = (+o.rot || 0) === 0 && (+o.scale || 1) === 1 && !o.flip;
        if (kx !== 'zero') o[kx] = f(((s ? sn(o.x + lx) - o.x : lx) - ox) / sx);
        if (ky !== 'zero') o[ky] = f(((s ? sn(o.y + ly) - o.y : ly) - oy) / sy);
      }
      d.moved = true; renderAll(); syncPanel();
    });
    const end = () => {
      const d = S.drag; if (!d) return;
      S.drag = null; S.hot = null;
      if (d.mode === 'marq') { buildPanel(); renderOverlay(); return; }
      if (d.mode === 'm' && !d.moved && d.wasSel) { setSel([d.id]); return; } // 点击多选中的一个 → 只选它
      if (d.mode === 'rot') renderOverlay();
      if (d.mode === 'm' && d.moved && d.list.length === 1 && tryInsert(d.list[0])) return;
      if (d.moved) commit();
    };
    svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
    svg.addEventListener('dblclick', (e) => {
      if (e.target.closest('[data-rot]') && S.sel.length) {
        const list = selObjs();
        if (list.length === 1 && +list[0].rot) { rotateAbout(list[0], objCenter(list[0]), 0); afterMove(list[0]); renderAll(); syncPanel(); commit(); }
        return;
      }
      const i = $('#props textarea, #props input[type=text]'); if (i) i.focus();
    });
    const wrap = $('#wrap');
    wrap.addEventListener('wheel', (e) => { if (e.ctrlKey || e.metaKey) { e.preventDefault(); setZoom(S.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1)); } }, { passive: false });
    // Safari 触控板双指缩放
    wrap.addEventListener('gesturestart', (e) => { e.preventDefault(); S.gz = S.zoom; });
    wrap.addEventListener('gesturechange', (e) => { e.preventDefault(); setZoom((S.gz || 1) * e.scale); });
    wrap.addEventListener('dragover', (e) => e.preventDefault());
    wrap.addEventListener('drop', (e) => {
      e.preventDefault();
      const fl = e.dataTransfer.files;
      if (fl && fl.length) { const [X, Y] = clientToDoc(e.clientX, e.clientY); [...fl].forEach((fi, k) => addImageFile(fi, X + k * 20, Y + k * 20)); return; }
      const i = e.dataTransfer.getData('text/plain'); if (i === '' || isNaN(+i)) return;
      const [X, Y] = clientToDoc(e.clientX, e.clientY); addPreset(+i, X, Y, true);
    });
  }
  // 最近的元件端口（文档坐标；不包括导线自己）
  function nearestPort(X, Y, self) {
    let best = null, bd = 14 / S.zoom;
    S.doc.objs.forEach((t) => {
      if (t === self || t.type === 'wire') return;
      PD.portList(t).forEach((_, i) => { const P = PD.portDoc(t, i); if (!P) return; const dd = Math.hypot(P.x - X, P.y - Y); if (dd < bd) { bd = dd; best = { o: t, i, x: P.x, y: P.y }; } });
    });
    return best;
  }
  function setZoom(z) { S.zoom = Math.max(0.25, Math.min(4, z)); layout(); renderOverlay(); }

  /* ---------- 素材面板（多级分类：cat 用 / 分隔） ---------- */
  function loadClosed() { try { return JSON.parse(localStorage.getItem(LSC) || '{}') || {}; } catch (e) { return {}; } }
  function fitIcons(scope) {
    scope.querySelectorAll('svg.ic:not([viewBox])').forEach((svg) => {
      try { const bb = svg.firstElementChild.getBBox(); if (!bb.width && !bb.height) return; const pad = Math.max(bb.width, bb.height) * 0.08 + 3; svg.setAttribute('viewBox', `${bb.x - pad} ${bb.y - pad} ${bb.width + 2 * pad} ${bb.height + 2 * pad}`); } catch (e) {}
    });
  }
  function buildPalette() {
    const el = $('#palette'); el.innerHTML = '';
    const q = ($('#search').value || '').trim().toLowerCase(), closed = loadClosed();
    const root = { kids: new Map(), items: [] };
    PD.palette.forEach((p, i) => {
      if (q && !(p.name.toLowerCase().includes(q) || p.cat.toLowerCase().includes(q))) return;
      let n = root, path = '';
      p.cat.split('/').map((s) => s.trim()).filter(Boolean).forEach((seg) => {
        path = path ? path + '/' + seg : seg;
        if (!n.kids.has(seg)) n.kids.set(seg, { name: seg, path, kids: new Map(), items: [] });
        n = n.kids.get(seg);
      });
      n.items.push([p, i]);
    });
    const count = (n) => n.items.length + [...n.kids.values()].reduce((s, k) => s + count(k), 0);
    const mk = (n, depth) => {
      const det = document.createElement('details'); det.className = 'cat d' + depth; det.open = q ? true : !closed[n.path];
      det.innerHTML = `<summary>${PD.esc(n.name)} <span>${count(n)}</span></summary>`;
      if (n.items.length) {
        const grid = document.createElement('div'); grid.className = 'grid';
        n.items.forEach(([p, i]) => {
          const b = document.createElement('button'); b.className = 'item'; b.draggable = true; b.title = p.name + '（点击添加，或拖到画布）';
          const o = PD.makeObj(p, 'ic' + i); o.x = 0; o.y = 0; PD.syncBinds({ objs: [o] });
          b.innerHTML = `<svg class="ic" xmlns="http://www.w3.org/2000/svg"><g>${PD.renderObj(o, { font: S.doc.font }, 'icon', 'ic' + i)}</g></svg><span>${PD.esc(p.name)}</span>`;
          b.onclick = () => { const r = $('#wrap').getBoundingClientRect(); const [X, Y] = clientToDoc(r.left + r.width / 2, r.top + r.height / 2); addPreset(i, X, Y); };
          b.ondragstart = (e) => e.dataTransfer.setData('text/plain', String(i));
          grid.appendChild(b);
        });
        det.appendChild(grid);
      }
      n.kids.forEach((k) => det.appendChild(mk(k, depth + 1)));
      det.addEventListener('toggle', (ev) => {
        if (ev.target !== det) return;
        if (!q) { const c = loadClosed(); if (det.open) delete c[n.path]; else c[n.path] = 1; try { localStorage.setItem(LSC, JSON.stringify(c)); } catch (e) {} }
        if (det.open) fitIcons(det);
      });
      return det;
    };
    root.kids.forEach((k) => el.appendChild(mk(k, 0)));
    fitIcons(el);
  }
  function addPreset(i, X, Y, drop) {
    const pr = PD.palette[i], o = PD.makeObj(pr, S.doc.nid++);
    if (o.children) renumber(o.children); // 组合预设：成员重新编号，并修正内部连线引用
    o.x = snapv(X, o); o.y = snapv(Y, o);
    if (o.type === 'group' && pr.props && pr.props.loose) { // 电路类预设：插入为独立对象（导线、元件都能单独改）
      const kids = o.children.map((c) => { c.x = f(c.x + o.x - (+o.bw || 0) / 2); c.y = f(c.y + o.y - (+o.bh || 0) / 2); return c; });
      kids.forEach((c) => S.doc.objs.push(c)); renderAll(); setSel(kids.map((c) => c.id)); commit();
      toast(`已插入 ${kids.length} 个对象（已全选，可整体拖动；需要时 ${K.mod}+G 组合）`); return;
    }
    S.doc.objs.push(o); renderAll(); setSel([o.id]);
    if (!(drop && tryInsert(o))) commit();
  }
  // 把两端元件拖到导线上 → 自动串联进去（原导线一分为二）
  function tryInsert(o) {
    if (!o || o.type !== 'comp' || !PD.wirePts) return false;
    if (PD.portList(o).length < 2) return false;
    const sid = String(o.id);
    if (S.doc.objs.some((w) => w.type === 'wire' && (String(w.a0) === sid || String(w.b0) === sid))) return false;
    let best = null, bd = 12 / S.zoom;
    S.doc.objs.forEach((w) => {
      if (w.type !== 'wire') return;
      const P = PD.wirePts(w, S.doc);
      for (let i = 0; i < P.length - 1; i++) {
        const a = P[i], b = P[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy; if (l2 < 1) continue;
        const t = Math.max(0, Math.min(1, ((o.x - a[0]) * dx + (o.y - a[1]) * dy) / l2)), q = [a[0] + dx * t, a[1] + dy * t], dd = Math.hypot(o.x - q[0], o.y - q[1]);
        if (dd < bd) { bd = dd; best = { w, a, q, hz: Math.abs(dx) >= Math.abs(dy) }; }
      }
    });
    if (!best) return false;
    const w = best.w;
    if ((+o.rot || 0) % 90 === 0) o.rot = best.hz ? 0 : 90;
    o.x = f(best.q[0]); o.y = f(best.q[1]);
    const p0 = PD.portDoc(o, 0), p1 = PD.portDoc(o, 1), A = best.a;
    const near = Math.hypot(p0.x - A[0], p0.y - A[1]) <= Math.hypot(p1.x - A[0], p1.y - A[1]) ? 0 : 1;
    const nw = PD.clone(w); nw.id = S.doc.nid++;
    w.b0 = sid; w.bp = near; w.dotB = false;
    nw.a0 = sid; nw.ap = 1 - near; nw.dotA = false; nw.cur = 'none';
    S.doc.objs.splice(S.doc.objs.indexOf(w) + 1, 0, nw);
    renderAll(); buildPanel(); commit(); toast('已把元件串联进导线');
    return true;
  }

  /* ---------- 导入图片 ---------- */
  function addImageURL(url, X, Y) {
    const img = new Image();
    img.onload = () => {
      let w = img.naturalWidth, h = img.naturalHeight, data = url;
      const MAX = 1600;
      if (Math.max(w, h) > MAX || url.length > 1.2e6) {
        const k = Math.min(1, MAX / Math.max(w, h)), c = document.createElement('canvas');
        c.width = Math.round(w * k); c.height = Math.round(h * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        data = /^data:image\/jpe?g/.test(url) ? c.toDataURL('image/jpeg', 0.9) : c.toDataURL('image/png');
      }
      const disp = Math.min(1, 320 / Math.max(w, h)), o = PD.makeObj({ type: 'image', props: { href: data, w: Math.round(w * disp), h: Math.round(h * disp), ar: w / h } }, S.doc.nid++);
      if (X == null) { const r = $('#wrap').getBoundingClientRect(); [X, Y] = clientToDoc(r.left + r.width / 2, r.top + r.height / 2); }
      o.x = snapv(X - o.w / 2, o); o.y = snapv(Y - o.h / 2, o);
      S.doc.objs.push(o); renderAll(); setSel([o.id]); commit(); toast('已导入图片');
    };
    img.onerror = () => toast('无法读取这张图片');
    img.src = url;
  }
  function addImageFile(file, X, Y) { if (!file || !/^image\//.test(file.type)) return false; const fr = new FileReader(); fr.onload = () => addImageURL(fr.result, X, Y); fr.readAsDataURL(file); return true; }

  /* ---------- 属性面板 ---------- */
  function fieldHtml(fd, v) {
    const k = `data-k="${fd.k}"`, l = `<span class="lb">${PD.esc(fd.l || fd.k)}</span>`;
    switch (fd.t) {
      case 'bool': return `<label class="row chk"><input type="checkbox" ${k} ${v ? 'checked' : ''}>${l}</label>`;
      case 'color': return `<label class="row">${l}<input type="color" ${k} value="${PD.esc(v || '#000000')}"></label>`;
      case 'sel': return `<label class="row">${l}<select ${k}>${fd.o.map(([a, b]) => `<option value="${PD.esc(a)}" ${String(v) === String(a) ? 'selected' : ''}>${PD.esc(b)}</option>`).join('')}</select></label>`;
      case 'area': return `<label class="col">${l}<textarea ${k} rows="3" spellcheck="false" placeholder="${PD.esc(fd.ph || '')}">${PD.esc(v ?? '')}</textarea></label>`;
      case 'range': return `<label class="row">${l}<input type="range" ${k} min="${fd.min}" max="${fd.max}" step="${fd.step || 1}" value="${v}"><em>${v}</em></label>`;
      case 'text': return `<label class="row">${l}<input type="text" ${k} value="${PD.esc(v ?? '')}" spellcheck="false"></label>`;
      default: return `<label class="row">${l}<input type="number" ${k} step="${fd.step || 1}" ${fd.min != null ? `min="${fd.min}"` : ''} value="${v ?? 0}"></label>`;
    }
  }
  function readVal(inp, fd, old) {
    if (fd.t === 'bool') return inp.checked;
    if (fd.t === 'num' || fd.t === 'range') { const n = parseFloat(inp.value); return isNaN(n) ? old : n; }
    return inp.value;
  }
  function bindFields(el, target, fields, onInput, onChange) {
    const map = {}; fields.forEach((fd) => (map[fd.k] = fd));
    el.querySelectorAll('[data-k]').forEach((inp) => {
      const fd = map[inp.dataset.k]; if (!fd) return;
      inp.addEventListener('input', () => {
        target[fd.k] = readVal(inp, fd, target[fd.k]);
        if (fd.t === 'range') inp.nextElementSibling.textContent = target[fd.k];
        onInput(fd);
      });
      inp.addEventListener('change', () => { target[fd.k] = readVal(inp, fd, target[fd.k]); onChange(fd); });
    });
  }
  // 批量写入（遇到组合递归进成员；shallow 只写顶层）
  function applyDeep(list, key, v, shallow) { list.forEach((x) => { if (x.type === 'group' && !shallow) applyDeep(x.children || [], key, v); else x[key] = v; }); }

  const DOC_FIELDS = [
    { k: 'w', t: 'num', l: '画布宽', step: 10 }, { k: 'h', t: 'num', l: '画布高', step: 10 },
    { k: 'bg', t: 'sel', l: '背景', o: [['#ffffff', '白色'], ['none', '透明']] },
    { k: 'grid', t: 'num', l: '网格间距', min: 1 }, { k: 'showGrid', t: 'bool', l: '显示网格' },
    { k: 'snap', t: 'bool', l: `全局吸附（拖动时按 ${K.alt} 临时反转）` }, { k: 'snapStep', t: 'num', l: '吸附间距', min: 0.5, step: 0.5 },
    { k: 'frac', t: 'sel', l: '分式样式(全局)', o: [['stack', '竖式'], ['inline', '横式 a/b']] },
    { k: 'font', t: 'sel', l: '字体', o: [['Times New Roman', 'Times New Roman'], ['Cambria', 'Cambria'], ['Arial', 'Arial'], ['Calibri', 'Calibri'], ['SimSun', '宋体'], ['Microsoft YaHei', '微软雅黑'], ['PMingLiU', '新细明体'], ['PingFang SC', '苹方 (Mac)']] },
    { k: 'crop', t: 'bool', l: '导出时裁剪到内容' }, { k: 'png', t: 'num', l: 'PNG 导出倍率', min: 1, step: 1 },
  ];
  const BTN = (a, t, tip, cls) => `<button data-a="${a}"${tip ? ` title="${PD.esc(tip)}"` : ''}${cls ? ` class="${cls}"` : ''}>${t}</button>`;
  const layerRow = () => `<div class="prow"><span>图层</span>${BTN('front', '置顶', K.mod + '+Shift+]')}${BTN('up', '上移一层', K.mod + '+]')}${BTN('down', '下移一层', K.mod + '+[')}${BTN('back', '置底', K.mod + '+Shift+[')}</div>`;
  const alignRow = (lab) => `<div class="prow"><span>${lab}</span>${BTN('al', '左', '左对齐')}${BTN('ac', '水平居中', '水平居中')}${BTN('ar', '右', '右对齐')}${BTN('at', '上', '顶端对齐')}${BTN('am', '垂直居中', '垂直居中')}${BTN('ab', '下', '底端对齐')}</div>`;

  function buildPanel() {
    const el = $('#props'), list = selObjs();
    if (!list.length) {
      el.innerHTML = `<div class="ptitle">画布设置</div><fieldset>${DOC_FIELDS.map((fd) => fieldHtml(fd, S.doc[fd.k])).join('')}</fieldset>${helpHtml()}`;
      bindFields(el, S.doc, DOC_FIELDS, () => { layout(); }, (fd) => { layout(); if (fd.k === 'font' || fd.k === 'frac') { renderAll(); buildPalette(); } commit(); });
      return;
    }
    if (list.length > 1) return buildMultiPanel(el, list);
    const o = list[0], def = PD.shapes[o.type];
    if (!def) { el.innerHTML = `<div class="ptitle">未知素材 ${PD.esc(o.type)}</div><div class="pbtns">${BTN('del', '删除', '', 'danger')}</div>`; el.querySelectorAll('[data-a]').forEach((b) => (b.onclick = () => action(b.dataset.a))); return; }
    const groups = [['位置', PD.COMMON], [o.type === 'group' ? `组合（${(o.children || []).length} 个成员）` : '参数', def.fields || []]];
    if (def.style !== false) { const ks = Array.isArray(def.style) ? def.style : null; groups.push(['样式', PD.STYLE.filter((s) => !ks || ks.includes(s.k))]); }
    groups.forEach((g) => (g[1] = g[1].map((fd) => (fd.t === 'obj' ? Object.assign({}, fd, { t: 'sel', obj: true, o: [['', '（不绑定）']].concat(S.doc.objs.filter((x) => x !== o && (!fd.of || fd.of(x))).map((x) => [String(x.id), '#' + x.id + ' ' + (PD.shapes[x.type] ? PD.shapes[x.type].name : x.type)])) }) : fd))));
    const all = groups.flatMap((g) => g[1]);
    el.innerHTML = `<div class="ptitle">${PD.esc(def.name)} <small>#${o.id}</small></div>` +
      (o.type === 'group' ? `<div class="pbtns">${BTN('ungroup', '取消组合', K.mod + '+Shift+G', 'pri')}</div>` : '') +
      groups.map(([t, fs]) => `<fieldset><legend>${t}</legend>${fs.filter((fd) => !fd.when || fd.when(o)).map((fd) => fieldHtml(fd, o[fd.k])).join('')}</fieldset>`).join('') +
      `<div class="pbtns">${BTN('dup', '复制', K.mod + '+D')}${BTN('del', '删除', 'Delete', 'danger')}</div>` + layerRow() + alignRow('对齐到画布');
    bindFields(el, o, all, (fd) => {
      if (fd.apply && o.children) applyDeep(o.children, fd.apply, o[fd.k]);
      if (fd.k === 'x' || fd.k === 'y') afterMove(o);
      renderAll();
    }, (fd) => {
      if (fd.apply && o.children) applyDeep(o.children, fd.apply, o[fd.k]);
      if (fd.k === 'bind' && o.bind !== '') { const t = getObj(+o.bind); if (t) { const c = objCenter(t); o.bx = f(c[0] - t.x); o.by = f(c[1] - t.y); } }
      renderAll(); commit(); if (fd.rebuild || fd.obj || all.some((x) => x.when)) buildPanel();
    });
    el.querySelectorAll('[data-a]').forEach((b) => (b.onclick = () => action(b.dataset.a)));
  }
  function buildMultiPanel(el, list) {
    const f0 = list.find((x) => x.type !== 'group') || list[0];
    const tmp = { gStroke: f0.stroke || '#000000', gSw: +f0.sw || 1.5, gFill: f0.fill || '#cfd8e3', gOp: 1 };
    const F = [
      { k: 'gStroke', t: 'color', l: '线条/文字色', apply: 'stroke' }, { k: 'gSw', t: 'num', l: '线宽', step: 0.25, min: 0, apply: 'sw' },
      { k: 'gFill', t: 'color', l: '填充色', apply: 'fill' }, { k: 'gOp', t: 'range', l: '不透明度', min: 0, max: 1, step: 0.05, apply: 'opacity', shallow: true },
    ];
    el.innerHTML = `<div class="ptitle">已选择 ${list.length} 个对象</div>` +
      `<div class="pbtns">${BTN('group', '组合', K.mod + '+G', 'pri')}${BTN('dup', '复制', K.mod + '+D')}${BTN('del', '删除', 'Delete', 'danger')}</div>` +
      layerRow() + alignRow('对齐（以选区为准）') +
      (list.length >= 3 ? `<div class="prow"><span>分布</span>${BTN('dh', '横向等距')}${BTN('dv', '纵向等距')}</div>` : '') +
      `<fieldset><legend>统一样式（写入全部所选）</legend>${F.map((fd) => fieldHtml(fd, tmp[fd.k])).join('')}</fieldset>` +
      `<p class="hint">提示：按住 ${K.mod} 或 Shift 点击可加选/减选；在空白处拖动可框选。</p>`;
    const ap = (fd) => applyDeep(list, fd.apply, tmp[fd.k], fd.shallow);
    bindFields(el, tmp, F, (fd) => { ap(fd); renderAll(); }, (fd) => { ap(fd); renderAll(); commit(); });
    el.querySelectorAll('[data-a]').forEach((b) => (b.onclick = () => action(b.dataset.a)));
  }
  function syncDocPanel() { ['w', 'h'].forEach((k) => { const i = $(`#props [data-k="${k}"]`); if (i) i.value = S.doc[k]; }); }
  function syncPanel() {
    const o = one(); if (!o) return;
    $$('#props [data-k]').forEach((inp) => {
      if (document.activeElement === inp) return; const v = o[inp.dataset.k];
      if (inp.type === 'checkbox') inp.checked = !!v; else if (inp.type !== 'color') inp.value = v ?? '';
    });
  }
  function fitCanvas() {
    if (!S.doc.objs.length) return;
    const b = $('#scene').getBBox(), pad = 20, dx = Math.round(pad - b.x), dy = Math.round(pad - b.y);
    S.doc.objs.forEach((o) => { o.x += dx; o.y += dy; });
    S.doc.w = Math.ceil(b.width + 2 * pad); S.doc.h = Math.ceil(b.height + 2 * pad);
    layout(); renderAll(); buildPanel(); commit(); toast('画布已适应内容');
  }
  function initSplitter() {
    const sp = $('#splitter'), root = document.documentElement;
    const saved = +localStorage.getItem('phydraw.pw'); if (saved) root.style.setProperty('--pw', saved + 'px');
    sp.addEventListener('pointerdown', (e) => {
      sp.setPointerCapture(e.pointerId); sp.classList.add('on');
      const mv = (ev) => { const w = Math.max(240, Math.min(640, window.innerWidth - ev.clientX)); root.style.setProperty('--pw', w + 'px'); localStorage.setItem('phydraw.pw', w); };
      const up = () => { sp.classList.remove('on'); sp.removeEventListener('pointermove', mv); sp.removeEventListener('pointerup', up); };
      sp.addEventListener('pointermove', mv); sp.addEventListener('pointerup', up);
    });
  }

  /* ---------- 组合 / 取消组合 ---------- */
  function renumber(cp) {
    const map = {};
    cp.forEach((o) => walk(o, (x) => { const n = S.doc.nid++; map[String(x.id)] = n; x.id = n; }));
    cp.forEach((o) => walk(o, (x) => {
      const d = PD.shapes[x.type];
      ((d && d.fields) || []).forEach((fd) => { if (fd.t === 'obj' && x[fd.k] !== '' && x[fd.k] != null && map[String(x[fd.k])] != null) x[fd.k] = String(map[String(x[fd.k])]); });
    }));
    return cp;
  }
  function cloneSet(list) { return renumber(list.map((o) => PD.clone(o))); }
  function doGroup(list) {
    const U = unionBox(list.map(clientBox)); if (!U) return false;
    const arr = S.doc.objs, x0 = Math.floor(U.x0), y0 = Math.floor(U.y0);
    const top = Math.max(...list.map((o) => arr.indexOf(o)));
    const g = PD.makeObj({ type: 'group', props: {} }, S.doc.nid++);
    g.x = x0; g.y = y0; g.bw = Math.ceil(U.x1 - x0); g.bh = Math.ceil(U.y1 - y0);
    const f0 = list.find((x) => x.type !== 'group'); if (f0) { g.gStroke = f0.stroke || '#000000'; g.gSw = +f0.sw || 1.5; g.gFill = f0.fill || g.gFill; }
    g.children = list.map((c) => { c.x = f(c.x - x0); c.y = f(c.y - y0); return c; });
    const before = arr.slice(0, top + 1).filter((x) => !list.includes(x)).length;
    const rest = arr.filter((x) => !list.includes(x)); rest.splice(before, 0, g);
    S.doc.objs = rest; S.sel = [g.id];
    return true;
  }
  function bake(g, c) {
    const a = ((+g.rot || 0) * Math.PI) / 180, s = +g.scale || 1, cs = Math.cos(a), sn = Math.sin(a), lx = (g.flip ? -1 : 1) * c.x, ly = c.y;
    c.x = f(g.x + s * (lx * cs - ly * sn)); c.y = f(g.y + s * (lx * sn + ly * cs));
    c.rot = normDeg(g.flip ? (+g.rot || 0) - (+c.rot || 0) : (+g.rot || 0) + (+c.rot || 0));
    c.flip = !!g.flip !== !!c.flip;
    c.scale = Math.round((+c.scale || 1) * s * 1000) / 1000;
    if ((g.opacity ?? 1) < 1) c.opacity = Math.round((c.opacity ?? 1) * g.opacity * 100) / 100;
    if (g.shadow) c.shadow = true;
    return c;
  }
  function doUngroup(gs) {
    if (!gs.length) return false;
    const ids = [];
    gs.forEach((g) => {
      const arr = S.doc.objs, i = arr.indexOf(g); if (i < 0) return;
      const kids = (g.children || []).map((c) => bake(g, c));
      arr.splice(i, 1, ...kids); kids.forEach((k) => ids.push(k.id));
    });
    ids.forEach((id) => afterMove(getObj(id)));
    S.sel = ids; return true;
  }

  /* ---------- 图层 / 对齐 / 分布 ---------- */
  function reorder(a) {
    const isS = (x) => S.sel.includes(x.id); let arr = S.doc.objs;
    if (a === 'front') arr = arr.filter((x) => !isS(x)).concat(arr.filter(isS));
    else if (a === 'back') arr = arr.filter(isS).concat(arr.filter((x) => !isS(x)));
    else if (a === 'up') { for (let i = arr.length - 2; i >= 0; i--) if (isS(arr[i]) && !isS(arr[i + 1])) [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]; }
    else if (a === 'down') { for (let i = 1; i < arr.length; i++) if (isS(arr[i]) && !isS(arr[i - 1])) [arr[i], arr[i - 1]] = [arr[i - 1], arr[i]]; }
    S.doc.objs = arr;
  }
  function align(a, list) {
    const boxes = list.map(clientBox), R = list.length === 1 ? { x0: 0, y0: 0, x1: S.doc.w, y1: S.doc.h } : unionBox(boxes);
    if (!R) return;
    list.forEach((o, i) => {
      const b = boxes[i]; if (!b) return; let dx = 0, dy = 0;
      if (a === 'al') dx = R.x0 - b.x0; else if (a === 'ar') dx = R.x1 - b.x1; else if (a === 'ac') dx = (R.x0 + R.x1 - b.x0 - b.x1) / 2;
      else if (a === 'at') dy = R.y0 - b.y0; else if (a === 'ab') dy = R.y1 - b.y1; else if (a === 'am') dy = (R.y0 + R.y1 - b.y0 - b.y1) / 2;
      o.x = f(o.x + dx); o.y = f(o.y + dy); afterMove(o);
    });
  }
  function distribute(a, list) {
    const it = list.map((o) => ({ o, b: clientBox(o) })).filter((q) => q.b); if (it.length < 3) return;
    const h = a === 'dh', lo = (b) => (h ? b.x0 : b.y0), hi = (b) => (h ? b.x1 : b.y1);
    it.sort((p, q) => lo(p.b) + hi(p.b) - lo(q.b) - hi(q.b));
    const total = it.reduce((s, q) => s + hi(q.b) - lo(q.b), 0), span = hi(it[it.length - 1].b) - lo(it[0].b), gap = (span - total) / (it.length - 1);
    let cur = hi(it[0].b) + gap;
    for (let i = 1; i < it.length - 1; i++) { const q = it[i], d = cur - lo(q.b); if (h) q.o.x = f(q.o.x + d); else q.o.y = f(q.o.y + d); afterMove(q.o); cur += hi(q.b) - lo(q.b) + gap; }
  }

  /* ---------- 操作 ---------- */
  function action(a) {
    const list = selObjs();
    switch (a) {
      case 'del': if (!list.length) return; S.doc.objs = S.doc.objs.filter((x) => !S.sel.includes(x.id)); S.sel = []; break;
      case 'dup': { if (!list.length) return; const cp = cloneSet(list); cp.forEach((c) => { c.x += 20; c.y += 20; S.doc.objs.push(c); }); S.sel = cp.map((c) => c.id); break; }
      case 'copy': if (!list.length) return; S.clip = JSON.stringify(list); toast(`已复制 ${list.length} 个对象`); return;
      case 'paste': { if (!S.clip) return; const cp = cloneSet(JSON.parse(S.clip)); cp.forEach((c) => { c.x += 20; c.y += 20; S.doc.objs.push(c); }); S.clip = JSON.stringify(cp); S.sel = cp.map((c) => c.id); break; }
      case 'all': S.sel = S.doc.objs.map((x) => x.id); break;
      case 'group': if (list.length < 2 || !doGroup(list)) return; toast(`已组合 ${list.length} 个对象`); break;
      case 'ungroup': if (!doUngroup(list.filter((x) => x.type === 'group'))) return; break;
      case 'front': case 'back': case 'up': case 'down': if (!list.length) return; reorder(a); break;
      case 'al': case 'ac': case 'ar': case 'at': case 'am': case 'ab': if (!list.length) return; align(a, list); break;
      case 'dh': case 'dv': distribute(a, list); break;
      default: return;
    }
    renderAll(); buildPanel(); commit();
  }

  /* ---------- 导出 ---------- */
  function exportSVG() {
    PD.syncBinds(S.doc);
    const d = S.doc; let x = 0, y = 0, w = d.w, h = d.h;
    if (d.crop && d.objs.length) {
      const b = $('#scene').getBBox(), pad = 12;
      x = Math.floor(b.x - pad); y = Math.floor(b.y - pad); w = Math.ceil(b.width + 2 * pad); h = Math.ceil(b.height + 2 * pad);
    }
    const body = d.objs.map((o) => PD.renderObj(o, d, 'export')).join('');
    const bg = d.bg === 'none' ? '' : `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${d.bg}"/>`;
    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="${x} ${y} ${w} ${h}">${bg}${body}</svg>`, w, h };
  }
  function toPNG() {
    return new Promise((res, rej) => {
      const { svg, w, h } = exportSVG(), k = Math.max(1, +S.doc.png || 4), img = new Image();
      img.onload = () => {
        try { const c = document.createElement('canvas'); c.width = w * k; c.height = h * k; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); c.toBlob((b) => (b ? res(b) : rej(new Error('toBlob'))), 'image/png'); }
        catch (e) { rej(e); }
      };
      img.onerror = rej;
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    });
  }
  async function copyPNG() {
    try {
      if (!navigator.clipboard || !window.ClipboardItem) throw new Error('no clipboard');
      try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': toPNG() })]); } // Safari 需要在点击当下传入 Promise
      catch (e1) { const b = await toPNG(); await navigator.clipboard.write([new ClipboardItem({ 'image/png': b })]); } // Chrome 旧版
      toast('已复制 PNG，可直接粘贴到 Word');
    } catch (e) { toast('浏览器不允许复制，请用「导出 PNG」'); }
  }
  function download(name, blob) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
  const stamp = () => new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2200); }
  const macify = (s) => (IS_MAC ? String(s).replace(/Ctrl\+/g, '⌘').replace(/\bCtrl\b/g, '⌘').replace(/\bAlt\b/g, '⌥Option') : s);
  const helpHtml = () => macify($('#helpTpl').innerHTML);

  /* ---------- 工具栏 / 快捷键 ---------- */
  function initToolbar() {
    const on = (id, fn) => ($(id).onclick = fn);
    on('#bNew', () => { if (confirm('新建空白画布？（当前内容可先保存）')) loadDoc(newDoc()); });
    on('#bDemo', () => loadDoc(demoDoc()));
    on('#bOpen', () => $('#fileIn').click());
    $('#fileIn').onchange = (e) => {
      const file = e.target.files[0]; if (!file) return;
      file.text().then((t) => { try { loadDoc(JSON.parse(t)); toast('已打开 ' + file.name); } catch (err) { alert('文件格式错误'); } });
      e.target.value = '';
    };
    on('#bSave', () => download(`phydraw-${stamp()}.json`, new Blob([JSON.stringify(S.doc, null, 1)], { type: 'application/json' })));
    on('#bSVG', () => download(`figure-${stamp()}.svg`, new Blob([exportSVG().svg], { type: 'image/svg+xml' })));
    on('#bPNG', () => toPNG().then((b) => download(`figure-${stamp()}.png`, b), () => toast('导出失败')));
    on('#bCopy', copyPNG);
    on('#bUndo', undo); on('#bRedo', redo);
    const setSize = () => { S.doc.w = Math.max(50, +$('#cvW').value || S.doc.w); S.doc.h = Math.max(50, +$('#cvH').value || S.doc.h); layout(); renderOverlay(); if (!S.sel.length) syncDocPanel(); commit(); };
    $('#cvW').onchange = setSize; $('#cvH').onchange = setSize;
    on('#bFit', fitCanvas);
    on('#bDoc', () => setSel([]));
    on('#bGrid', () => { S.doc.showGrid = !S.doc.showGrid; layout(); commit(); buildPanel(); });
    on('#bSnap', () => { S.doc.snap = !S.doc.snap; layout(); commit(); buildPanel(); });
    on('#bBW', () => { document.body.classList.toggle('bw'); $('#bBW').classList.toggle('on'); });
    on('#bZin', () => setZoom(S.zoom * 1.25)); on('#bZout', () => setZoom(S.zoom / 1.25)); on('#zoomLbl', () => setZoom(1));
    $('#search').oninput = buildPalette;
    on('#bImg', () => $('#imgIn').click());
    $('#imgIn').onchange = (e) => { [...e.target.files].forEach((fi) => addImageFile(fi)); e.target.value = ''; };
    // 粘贴：剪贴板里有图片 → 导入图片；否则粘贴复制的对象
    document.addEventListener('paste', (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      const it = [...(e.clipboardData ? e.clipboardData.items : [])].find((x) => x.type && x.type.startsWith('image/'));
      if (it) { e.preventDefault(); clearTimeout(S.pp); S.pp = 0; addImageFile(it.getAsFile()); }
    });
    document.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      const k = (e.key || '').toLowerCase(), c = e.ctrlKey || e.metaKey, code = e.code;
      if (c && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      else if (c && k === 'y') { e.preventDefault(); redo(); }
      else if (c && k === 'a') { e.preventDefault(); action('all'); }
      else if (c && k === 'g') { e.preventDefault(); action(e.shiftKey ? 'ungroup' : 'group'); }
      else if (c && code === 'BracketRight') { e.preventDefault(); action(e.shiftKey ? 'front' : 'up'); }
      else if (c && code === 'BracketLeft') { e.preventDefault(); action(e.shiftKey ? 'back' : 'down'); }
      else if (c && k === 'd') { e.preventDefault(); action('dup'); }
      else if (c && k === 'c') action('copy');
      else if (c && k === 'v') { clearTimeout(S.pp); S.pp = setTimeout(() => { S.pp = 0; action('paste'); }, 80); }
      else if (c && k === 's') { e.preventDefault(); $('#bSave').click(); }
      else if (k === 'delete' || k === 'backspace') { e.preventDefault(); action('del'); }
      else if (k === 'escape') setSel([]);
      else if (e.altKey && (k === 'arrowleft' || k === 'arrowright') && S.sel.length) {
        e.preventDefault(); const list = selObjs(), st = (e.shiftKey ? 1 : 15) * (k === 'arrowright' ? 1 : -1), cc = list.length === 1 ? objCenter(list[0]) : selCenter(list);
        list.forEach((o) => { rotateAbout(o, cc, (+o.rot || 0) + st); afterMove(o); }); renderAll(); syncPanel(); commit();
      }
      else if (k.startsWith('arrow') && S.sel.length) {
        e.preventDefault(); const st = e.shiftKey ? 10 : 1;
        selObjs().forEach((o) => {
          if (k === 'arrowleft') o.x -= st; if (k === 'arrowright') o.x += st; if (k === 'arrowup') o.y -= st; if (k === 'arrowdown') o.y += st;
          afterMove(o);
        });
        renderAll(); syncPanel(); commit();
      }
    });
  }

  /* ---------- 示例 ---------- */
  function demoDoc() {
    const d = newDoc(); const add = (name, x, y, extra) => {
      const i = PD.palette.findIndex((p) => p.name === name); if (i < 0) return;
      const o = PD.makeObj(PD.palette[i], d.nid++); Object.assign(o, { x, y }, extra || {}); d.objs.push(o);
    };
    add('v-t 图(面积)', 60, 70);
    add('长方体(光影)', 620, 150);
    add('坐标系+点投影', 560, 470);
    add('地面', 80, 470, { L: 300 });
    add('木块(填充)', 160, 420);
    add('矢量箭头', 240, 445, { label: 'F', x2: 110 });
    add('矢量箭头', 160, 445, { label: 'f', x2: -80, a1: 'tri' });
    add('文字/公式', 450, 560, { text: 'v^2 = u^2 + 2as', size: 22 });
    add('圆柱(光影)', 800, 400);
    return d;
  }

  /* ---------- 启动 ---------- */
  function boot() {
    if (IS_MAC) { document.body.classList.add('mac'); $$('[title]').forEach((x) => x.setAttribute('title', macify(x.getAttribute('title')))); }
    let d = null; try { d = JSON.parse(localStorage.getItem(LS)); } catch (e) {}
    S.doc = Object.assign(newDoc(), d || demoDoc());
    initToolbar(); initCanvas(); initSplitter(); layout(); buildPalette(); renderAll(); buildPanel(); commit();
    $('#ver').textContent = 'v' + PD.version + ' · ' + PD.palette.length + ' 个素材';
  }
  window.addEventListener('load', boot);
})();
