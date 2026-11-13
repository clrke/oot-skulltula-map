/* Gold Skulltula map. Vanilla JS, no dependencies. */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var H = window.HYRULE;
  var STORE = 'oot-gs:v1';
  var GAP = 32;

  var REWARDS = [
    { at: 10, name: "Adult's Wallet" },
    { at: 20, name: 'Echo Gem' },
    { at: 30, name: "Giant's Wallet" },
    { at: 40, name: 'Bombchu' },
    { at: 50, name: 'Heart Piece' },
    { at: 100, name: 'Unlimited money', desc: '200 Rupees per visit' }
  ];

  var ITEMS = ['Slingshot', 'Boomerang', 'Deku Stick', 'Bottle Bug', 'Magic Beans', 'Bombs', 'Bombchu',
    'Hookshot', 'Longshot', 'Megaton Hammer', 'Iron Boots', 'Gauntlets', 'Lens of Truth',
    'Song of Storms', 'Song of Time', "Scarecrow's Song"];
  var ITEM_LABEL = { 'Bottle Bug': 'Bottle (bugs)' };

  var $ = function (id) { return document.getElementById(id); };
  var el = function (tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  // ---------- state ----------
  var S = { owned: new Set(), age: 'all', night: false, canget: false, q: '' };
  var data = [], byN = {}, pins = {}, regionById = {}, dungeonById = {}, current = null;

  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(STORE) || '{}');
      (s.owned || []).forEach(function (i) { if (ITEMS.indexOf(i) >= 0) S.owned.add(i); });
      ['age', 'night', 'canget'].forEach(function (k) { if (k in s) S[k] = s[k]; });
    } catch (e) { /* ignore corrupt storage */ }
  }
  function save() {
    try {
      localStorage.setItem(STORE, JSON.stringify({
        owned: Array.from(S.owned), age: S.age, night: S.night, canget: S.canget
      }));
    } catch (e) { /* storage full or disabled */ }
  }

  // ---------- logic ----------
  function has(item) { return S.owned.has(item) || (item === 'Hookshot' && S.owned.has('Longshot')); }
  function canGet(s) {
    if (!s.items.length || s.itemsMode === 'optional') return true;
    return s.itemsMode === 'any' ? s.items.some(has) : s.items.every(has);
  }
  function haystack(s) {
    var r = regionById[s.regionId];
    return ['#' + s.n, String(s.n), s.place, s.region, s.dungeonName || '', s.items.join(' '), s.hint, (r.aka || []).join(' '), s.age, s.night ? 'night' : '']
      .join(' ').toLowerCase();
  }
  function matches(s) {
    if (S.age === 'child' && s.age === 'adult') return false;
    if (S.age === 'adult' && s.age === 'child') return false;
    if (S.night && !s.night) return false;
    if (S.q) {
      var q = S.q.toLowerCase().trim();
      if (/^#?\d+$/.test(q)) return String(s.n) === q.replace('#', '');
      return q.split(/\s+/).every(function (w) { return s._hay.indexOf(w) >= 0; });
    }
    return true;
  }
  function ageText(s) {
    return { child: 'Child', adult: 'Adult', either: 'Child or adult' }[s.age] + (s.ageInferred ? ' (inferred)' : '');
  }
  function itemsText(s) {
    if (!s.items.length) return 'No special items';
    var list = s.items.map(function (i) { return ITEM_LABEL[i] || i; });
    if (s.itemsMode === 'any') return 'Either: ' + list.join(' or ');
    if (s.itemsMode === 'optional') return 'Optional: ' + list.join(', ');
    return list.join(' + ');
  }

  // ---------- map drawing ----------
  var svg = $('map'), vp = $('viewport');

  function smooth(pts) {
    // closed Catmull-Rom -> cubic Bezier
    var n = pts.length, d = 'M' + pts[0][0] + ' ' + pts[0][1];
    for (var i = 0; i < n; i++) {
      var p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      var c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      var c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += 'C' + c1[0].toFixed(1) + ' ' + c1[1].toFixed(1) + ' ' + c2[0].toFixed(1) + ' ' + c2[1].toFixed(1) + ' ' + p2[0] + ' ' + p2[1];
    }
    return d + 'Z';
  }

  var ICONS = {
    tree: '<rect x="-3" y="2" width="6" height="10" class="i-wood"/><circle cy="-4" r="10" class="i-leaf"/><circle cx="-3.5" cy="-4" r="1.6" class="i-ink"/><circle cx="3.5" cy="-4" r="1.6" class="i-ink"/><path d="M-3 1 q3 2 6 0" class="i-line"/>',
    cave: '<path d="M-12 10 V0 a12 12 0 0 1 24 0 V10 Z" class="i-rock"/><path d="M-7 10 V2 a7 7 0 0 1 14 0 V10 Z" class="i-dark"/><path d="M-6 3 l2 4 l2 -4 l2 4 l2 -4 l2 4" class="i-teeth"/>',
    fish: '<path d="M-12 0 C-6 -10 8 -10 12 0 C8 10 -6 10 -12 0 Z" class="i-water"/><path d="M12 0 l6 -6 v12 Z" class="i-water"/><circle cx="-5" cy="-2" r="1.8" class="i-ink"/>',
    ice: '<g class="i-ice"><path d="M0 -12 V12 M-10.4 -6 L10.4 6 M-10.4 6 L10.4 -6"/><path d="M-3 -9 L0 -12 L3 -9 M-3 9 L0 12 L3 9"/></g>',
    leaf: '<path d="M0 -12 C10 -6 10 6 0 12 C-10 6 -10 -6 0 -12 Z" class="i-leaf"/><path d="M0 -10 V11" class="i-line"/>',
    flame: '<path d="M0 -13 C6 -5 10 0 8 6 C6 12 -6 12 -8 6 C-10 0 -4 -3 -2 -8 C0 -4 2 -2 0 -13 Z" class="i-fire"/><path d="M0 -2 C3 2 4 5 2 8 C0 10 -3 9 -3 6 C-3 3 -1 2 0 -2 Z" class="i-fire2"/>',
    drop: '<path d="M0 -13 C6 -4 10 1 10 5 a10 10 0 0 1 -20 0 C-10 1 -6 -4 0 -13 Z" class="i-water"/><path d="M-5 5 a5 5 0 0 0 5 5" class="i-line light"/>',
    eye: '<path d="M-13 0 C-6 -9 6 -9 13 0 C6 9 -6 9 -13 0 Z" class="i-shadow"/><circle r="4.2" class="i-pupil"/><path d="M-6 8 l-2 5 M0 9 v5 M6 8 l2 5" class="i-line light"/>',
    sun: '<circle r="7" class="i-sun"/><g class="i-rays"><path d="M0 -13 V-9 M0 9 V13 M-13 0 H-9 M9 0 H13 M-9 -9 l3 3 M9 9 l-3 -3 M-9 9 l3 -3 M9 -9 l-3 3"/></g>',
    well: '<ellipse cy="-4" rx="11" ry="4" class="i-dark"/><path d="M-11 -4 V7 a11 4 0 0 0 22 0 V-4" class="i-rock"/><path d="M-11 1 h22 M-5 -1 v11 M5 -1 v11" class="i-line"/>',
    tower: '<path d="M-12 12 V-4 h4 v-6 h3 v6 h3 v-12 h4 v12 h3 v-6 h3 v6 h4 V12 Z" class="i-ganon"/><path d="M-2 12 v-6 h4 v6" class="i-fire2"/>'
  };

  function drawRegions() {
    var tg = el('g', { 'class': 'terrain', 'aria-hidden': 'true' }, vp);
    tg.innerHTML = H.terrain.join('');
    var rg = el('g', { 'class': 'regions' }, vp);
    H.regions.forEach(function (r) {
      regionById[r.id] = r;
      var p = el('path', { d: smooth(r.pts), 'class': 'region k-' + r.kind, 'data-region': r.id }, rg);
      el('title', {}, p).textContent = r.name + ' — click to zoom';
      var xs = r.pts.map(function (q) { return q[0]; }), ys = r.pts.map(function (q) { return q[1]; });
      r.bbox = { x: Math.min.apply(0, xs), y: Math.min.apply(0, ys), w: Math.max.apply(0, xs) - Math.min.apply(0, xs), h: Math.max.apply(0, ys) - Math.min.apply(0, ys) };
    });
    var lm = el('g', { 'class': 'landmarks', 'aria-hidden': 'true' }, vp);
    lm.innerHTML = H.landmarks.join('');
    var lg = el('g', { 'class': 'labels', 'aria-hidden': 'true' }, vp);
    H.regions.forEach(function (r) {
      var t = el('text', { x: r.label[0], y: r.label[1], 'class': 'region-label' }, lg);
      t.textContent = r.name;
    });
  }

  function gridPos(cx, cy, count, cols) {
    var out = [], rowsN = Math.ceil(count / cols);
    for (var i = 0; i < count; i++) {
      var r = Math.floor(i / cols), c = i % cols;
      var inRow = r === rowsN - 1 ? count - r * cols : cols;
      out.push([cx + (c - (inRow - 1) / 2) * GAP, cy + r * GAP]);
    }
    return out;
  }

  function pinShape(s, g) {
    if (s.age === 'child') el('circle', { r: 13, 'class': 'pin-shape child' }, g);
    else if (s.age === 'adult') el('rect', { x: -12, y: -12, width: 24, height: 24, rx: 4, 'class': 'pin-shape adult' }, g);
    else el('path', { d: 'M-14 0 L-7 -12.1 H7 L14 0 L7 12.1 H-7 Z', 'class': 'pin-shape either' }, g);
  }

  function drawPins() {
    var dg = el('g', { 'class': 'dungeons' }, vp);
    var pg = el('g', { 'class': 'pins' }, vp);
    var place = function (list, positions) {
      list.forEach(function (s, i) {
        var p = positions[i];
        var g = el('g', { 'class': 'pin a-' + s.age + (s.night ? ' night' : ''), transform: 'translate(' + p[0] + ' ' + p[1] + ')', tabindex: '0', role: 'button', 'data-n': s.n }, pg);
        s._xy = p;
        pinShape(s, g);
        var t = el('text', { 'class': 'pin-num' + (s.n >= 100 ? ' small' : ''), y: 4.5 }, g);
        t.textContent = s.n;
        if (s.night) {
          var m = el('g', { 'class': 'badge-moon', transform: 'translate(11 -11)' }, g);
          el('circle', { r: 6.5, 'class': 'moon-bg' }, m);
          el('path', { d: 'M1.8 -4 A4.4 4.4 0 1 0 1.8 4 A3.4 3.4 0 1 1 1.8 -4 Z', 'class': 'moon' }, m);
        }
        el('title', {}, g).textContent = '#' + s.n + ' ' + s.place;
        pins[s.n] = g;
      });
    };

    H.dungeons.forEach(function (d) {
      dungeonById[d.id] = d;
      var list = data.filter(function (s) { return s.dungeonId === d.id; });
      var ix = d.at[0], iy = d.at[1];
      var pos = gridPos(ix, iy + 40, list.length, d.cols);
      var xs = pos.map(function (p) { return p[0]; }).concat([ix - 24, ix + 24]);
      var ys = pos.map(function (p) { return p[1]; }).concat([iy]);
      var x0 = Math.min.apply(0, xs) - 18, x1 = Math.max.apply(0, xs) + 18;
      var y0 = iy - 36, y1 = Math.max.apply(0, ys) + 22;
      var g = el('g', { 'class': 'dungeon', 'data-dungeon': d.id }, dg);
      el('rect', { x: x0, y: y0, width: x1 - x0, height: y1 - y0, rx: 10, 'class': 'plate' }, g);
      var ic = el('g', { transform: 'translate(' + ix + ' ' + iy + ')', 'class': 'd-icon' }, g);
      el('circle', { r: 18, 'class': 'd-badge' }, ic);
      var inner = el('g', {}, ic); inner.innerHTML = ICONS[d.icon];
      var t = el('text', { x: ix, y: iy - 22, 'class': 'd-label' }, g);
      t.textContent = d.short;
      el('title', {}, g).textContent = d.name + (list.length ? '' : ' (no Gold Skulltulas inside)');
      d.bbox = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
      place(list, pos);
    });

    Object.keys(H.overworld).forEach(function (rid) {
      var o = H.overworld[rid];
      var list = data.filter(function (s) { return s.regionId === rid && !s.dungeon; });
      place(list, gridPos(o.at[0], o.at[1], list.length, o.cols));
    });
  }

  // ---------- pan / zoom ----------
  var vb = { x: 0, y: 0, w: H.width, h: H.height }, anim = null;
  function size() { var r = svg.getBoundingClientRect(); return { w: r.width || 1, h: r.height || 1 }; }
  function fitView(b, pad) {
    pad = pad || 0;
    var c = size(), ar = c.w / c.h;
    var w = b.w + pad * 2, h = b.h + pad * 2;
    if (w / h < ar) w = h * ar; else h = w / ar;
    return { x: b.x + b.w / 2 - w / 2, y: b.y + b.h / 2 - h / 2, w: w, h: h };
  }
  function fullView() { return fitView({ x: 0, y: 0, w: H.width, h: H.height }, 10); }
  // Portrait screens: start with the map filling the height (pan sideways) instead of a thin strip.
  function startView() {
    var c = size();
    if (c.w >= c.h) return fullView();
    var h = H.height + 20, w = h * c.w / c.h;
    return { x: H.width / 2 - w / 2, y: -10, w: w, h: h };
  }
  function clamp(v) {
    var f = fullView(), c = size();
    var minW = Math.max(140, 140 * c.w / c.h);
    var w = Math.min(Math.max(v.w, minW), f.w * 1.05), h = w * c.h / c.w;
    var cx = v.x + v.w / 2, cy = v.y + v.h / 2;
    cx = Math.min(Math.max(cx, 0), H.width); cy = Math.min(Math.max(cy, 0), H.height);
    return { x: cx - w / 2, y: cy - h / 2, w: w, h: h };
  }
  function apply(v) {
    vb = clamp(v);
    svg.setAttribute('viewBox', vb.x.toFixed(2) + ' ' + vb.y.toFixed(2) + ' ' + vb.w.toFixed(2) + ' ' + vb.h.toFixed(2));
    svg.classList.toggle('zoomed', vb.w < fullView().w * 0.6);
  }
  function animateTo(target) {
    target = clamp(target);
    if (anim) cancelAnimationFrame(anim);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return apply(target);
    var from = Object.assign({}, vb), t0 = performance.now(), dur = 420;
    (function step(now) {
      var t = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - t, 3);
      apply({ x: from.x + (target.x - from.x) * e, y: from.y + (target.y - from.y) * e, w: from.w + (target.w - from.w) * e, h: from.h + (target.h - from.h) * e });
      if (t < 1) anim = requestAnimationFrame(step); else anim = null;
    })(t0);
  }
  function toMap(cx, cy) {
    var r = svg.getBoundingClientRect();
    return { x: vb.x + (cx - r.left) / r.width * vb.w, y: vb.y + (cy - r.top) / r.height * vb.h };
  }
  function zoomAt(f, p) {
    apply({ x: p.x - (p.x - vb.x) / f, y: p.y - (p.y - vb.y) / f, w: vb.w / f, h: vb.h / f });
  }
  function zoomCenter(f) {
    var c = { x: vb.x + vb.w / 2, y: vb.y + vb.h / 2 }, w = vb.w / f, h = vb.h / f;
    animateTo({ x: c.x - w / 2, y: c.y - h / 2, w: w, h: h });
  }

  function initPanZoom() {
    var ptrs = new Map(), moved = 0, last = null, captured = false;
    svg.addEventListener('wheel', function (e) {
      e.preventDefault();
      if (anim) { cancelAnimationFrame(anim); anim = null; }
      var dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      zoomAt(Math.exp(-dy * 0.0015), toMap(e.clientX, e.clientY));
    }, { passive: false });
    svg.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 1) moved = 0;
      last = null;
      if (anim) { cancelAnimationFrame(anim); anim = null; }
    });
    svg.addEventListener('pointermove', function (e) {
      if (!ptrs.has(e.pointerId)) return;
      var prev = ptrs.get(e.pointerId);
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      var r = svg.getBoundingClientRect();
      if (ptrs.size === 1) {
        var dx = e.clientX - prev.x, dy = e.clientY - prev.y;
        moved += Math.abs(dx) + Math.abs(dy);
        if (moved > 6) {
          if (!captured) { try { svg.setPointerCapture(e.pointerId); } catch (x) {} captured = true; svg.classList.add('dragging'); }
          apply({ x: vb.x - dx / r.width * vb.w, y: vb.y - dy / r.height * vb.h, w: vb.w, h: vb.h });
        }
      } else if (ptrs.size === 2) {
        var a = Array.from(ptrs.values());
        var mid = { x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2 };
        var dist = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
        if (last) {
          var pm = toMap(last.mid.x, last.mid.y);
          zoomAt(dist / last.dist, pm);
          apply({ x: vb.x - (mid.x - last.mid.x) / r.width * vb.w, y: vb.y - (mid.y - last.mid.y) / r.height * vb.h, w: vb.w, h: vb.h });
        }
        last = { mid: mid, dist: dist };
        moved = 99;
      }
    });
    var end = function (e) {
      ptrs.delete(e.pointerId);
      last = null;
      if (!ptrs.size) {
        if (captured) { try { svg.releasePointerCapture(e.pointerId); } catch (x) {} }
        captured = false; svg.classList.remove('dragging');
      }
    };
    svg.addEventListener('pointerup', end);
    svg.addEventListener('pointercancel', end);
    // swallow the click that ends a drag
    svg.addEventListener('click', function (e) { if (moved > 6) { e.stopPropagation(); e.preventDefault(); } }, true);

    svg.addEventListener('click', function (e) {
      var pin = e.target.closest('.pin');
      if (pin) return openCard(+pin.getAttribute('data-n'), { fromMap: true });
      var dun = e.target.closest('.dungeon');
      if (dun) return zoomToDungeon(dun.getAttribute('data-dungeon'), true);
      var reg = e.target.closest('.region');
      if (reg) zoomToRegion(reg.getAttribute('data-region'), true);
    });
    svg.addEventListener('keydown', function (e) {
      var pin = e.target.closest && e.target.closest('.pin');
      if (pin && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openCard(+pin.getAttribute('data-n'), { fromMap: true }); }
    });
    $('zoom-in').onclick = function () { zoomCenter(1.6); };
    $('zoom-out').onclick = function () { zoomCenter(1 / 1.6); };
    $('zoom-reset').onclick = function () { animateTo(fullView()); };
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { apply(vb); }, 60); });
  }

  function regionBox(id) {
    var r = regionById[id], b = r.bbox;
    var x0 = b.x, y0 = b.y, x1 = b.x + b.w, y1 = b.y + b.h;
    data.forEach(function (s) {
      if (s.regionId !== id || !s._xy) return;
      x0 = Math.min(x0, s._xy[0] - 20); x1 = Math.max(x1, s._xy[0] + 20);
      y0 = Math.min(y0, s._xy[1] - 20); y1 = Math.max(y1, s._xy[1] + 20);
    });
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }
  function zoomToRegion(id, setHash) {
    if (!regionById[id]) return;
    animateTo(fitView(regionBox(id), 30));
    if (setHash) setHashQuiet(id);
  }
  function zoomToDungeon(id, setHash) {
    var d = dungeonById[id];
    if (!d) return;
    animateTo(fitView(d.bbox, 40));
    if (setHash) setHashQuiet(id);
  }
  function zoomToPin(n) {
    var s = byN[n]; if (!s) return;
    var c = size(), mobile = window.matchMedia('(max-width: 899px)').matches;
    var w = Math.min(vb.w, 420);
    var h = w * c.h / c.w;
    // keep the pin clear of the detail card (bottom sheet on mobile, top-left card on desktop)
    var cy = mobile ? s._xy[1] + h * 0.22 : s._xy[1];
    var cx = mobile ? s._xy[0] : s._xy[0] - w * 0.16;
    animateTo({ x: cx - w / 2, y: cy - h / 2, w: w, h: h });
  }

  // ---------- hash ----------
  function setHashQuiet(h) {
    var url = location.pathname + location.search + (h ? '#' + h : '');
    try { history.replaceState(null, '', url); } catch (e) { /* file:// */ }
  }
  function routeHash() {
    var h = decodeURIComponent(location.hash.replace(/^#/, '')).trim();
    if (!h) return;
    var n = /^(?:gs-?)?(\d{1,3})$/i.exec(h);
    if (n && byN[+n[1]]) { showView('map'); openCard(+n[1], { zoom: true }); return; }
    var id = h.replace(/^region[-/]/, '');
    if (regionById[id]) { showView('map'); zoomToRegion(id); return; }
    if (dungeonById[id]) { showView('map'); zoomToDungeon(id); }
  }

  // ---------- detail card ----------
  var card = $('card');
  function openCard(n, opts) {
    var s = byN[n]; if (!s) return;
    opts = opts || {};
    if (current && pins[current]) pins[current].classList.remove('selected');
    current = n;
    pins[n].classList.add('selected');
    $('card-num').textContent = '#' + n;
    $('card-title').textContent = s.place;
    $('card-region').textContent = s.region + (s.dungeonName ? ' · ' + s.dungeonName : '');
    var b = '<span class="badge b-' + s.age + '"' + (s.ageInferred ? ' title="Not stated by the guide; inferred from its directions and items"' : '') + '>' + esc(ageText(s)) + '</span>';
    if (s.night) b += '<span class="badge b-night">Night only</span>';
    if (s.dungeon) b += '<span class="badge b-dungeon">Dungeon</span>';
    if (S.canget && !canGet(s)) b += '<span class="badge b-locked">Missing items</span>';
    $('card-badges').innerHTML = b;
    $('card-items').innerHTML = '<span class="lbl">Items</span> ' + esc(itemsText(s));
    $('card-hint').textContent = s.hint;
    var note = $('card-note');
    note.hidden = !s.note;
    note.textContent = s.note ? 'Note: ' + s.note : '';
    $('card-src').href = s.source;
    card.hidden = false;
    setHashQuiet(String(n));
    if (opts.zoom) zoomToPin(n);
    if (!opts.fromMap || opts.focus) $('card-close').focus({ preventScroll: true });
  }
  function closeCard() {
    card.hidden = true;
    if (current && pins[current]) { pins[current].classList.remove('selected'); pins[current].focus({ preventScroll: true }); }
    current = null;
    setHashQuiet('');
  }
  function step(dir) {
    if (!current) return;
    var n = current;
    for (var i = 0; i < 100; i++) {
      n = ((n - 1 + dir + 100) % 100) + 1;
      if (matches(byN[n])) break;
    }
    openCard(n, { zoom: true });
  }

  // ---------- rewards ----------
  function renderRewards() {
    $('rewards').innerHTML = REWARDS.map(function (r) {
      return '<li><span class="rw-at">' + r.at + '</span><span class="rw-name">' + esc(r.name) +
        (r.desc ? ' <small>(' + esc(r.desc) + ')</small>' : '') + '</span></li>';
    }).join('');
  }

  function refresh() {
    var shown = 0;
    data.forEach(function (s) {
      var vis = matches(s), locked = S.canget && !canGet(s);
      var p = pins[s.n];
      p.classList.toggle('hidden', !vis);
      p.classList.toggle('locked', locked);
      p.setAttribute('aria-label', 'Gold Skulltula ' + s.n + ', ' + s.place + ', ' + ageText(s) + (s.night ? ', night' : '') + (locked ? ', missing items' : ''));
      p.setAttribute('tabindex', vis ? '0' : '-1');
      if (vis) shown++;
    });
    $('shown').textContent = shown === 100 ? 'Showing all 100' : shown ? 'Showing ' + shown + ' of 100' : 'No Gold Skulltulas match these filters.';
    var active = (S.age !== 'all') + S.night + S.canget + !!S.q;
    $('filter-status').textContent = active ? '(' + active + ' on)' : '';
  }

  // ---------- filters ----------
  function initFilters() {
    var chips = $('owned-chips');
    chips.innerHTML = ITEMS.map(function (i, k) {
      return '<label class="chip"><input type="checkbox" value="' + esc(i) + '" id="own' + k + '"><span>' + esc(ITEM_LABEL[i] || i) + '</span></label>';
    }).join('');
    var sync = function () {
      document.querySelectorAll('input[name=age]').forEach(function (r) { r.checked = r.value === S.age; });
      $('f-night').checked = S.night; $('f-canget').checked = S.canget;
      chips.querySelectorAll('input').forEach(function (c) { c.checked = S.owned.has(c.value); });
      $('owned').classList.toggle('dim', !S.canget);
    };
    sync();
    document.querySelectorAll('input[name=age]').forEach(function (r) {
      r.addEventListener('change', function () { S.age = r.value; save(); refresh(); });
    });
    [['f-night', 'night'], ['f-canget', 'canget']].forEach(function (p) {
      $(p[0]).addEventListener('change', function (e) { S[p[1]] = e.target.checked; save(); sync(); refresh(); });
    });
    chips.addEventListener('change', function (e) {
      if (e.target.checked) S.owned.add(e.target.value); else S.owned.delete(e.target.value);
      if (!S.canget) { S.canget = true; }
      save(); sync(); refresh();
    });
    $('owned-all').onclick = function () { ITEMS.forEach(function (i) { S.owned.add(i); }); save(); sync(); refresh(); };
    $('owned-none').onclick = function () { S.owned.clear(); save(); sync(); refresh(); };
    var qt;
    $('q').addEventListener('input', function (e) {
      clearTimeout(qt);
      qt = setTimeout(function () { S.q = e.target.value; refresh(); }, 80);
    });
  }

  // ---------- views (mobile tabs) ----------
  function showView(v) {
    document.body.setAttribute('data-view', v);
    $('tab-map').setAttribute('aria-pressed', String(v === 'map'));
    $('tab-list').setAttribute('aria-pressed', String(v === 'list'));
    if (v === 'map') apply(vb);
  }

  // ---------- boot ----------
  function boot(json) {
    data = json;
    data.forEach(function (s) { byN[s.n] = s; });
    drawRegions();
    data.forEach(function (s) { s._hay = haystack(s); });
    drawPins();
    renderRewards();
    initFilters();
    initPanZoom();
    apply(startView());
    refresh();

    $('card-close').onclick = closeCard;
    $('card-prev').onclick = function () { step(-1); };
    $('card-next').onclick = function () { step(1); };
    $('card-region').onclick = function () {
      var s = byN[current];
      if (s.dungeonId) zoomToDungeon(s.dungeonId, false); else zoomToRegion(s.regionId, false);
    };
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !card.hidden) closeCard();
    });
    $('tab-map').onclick = function () { showView('map'); };
    $('tab-list').onclick = function () { showView('list'); };
    showView('map');
    apply(startView());
    window.addEventListener('hashchange', routeHash);
    routeHash();
    document.body.classList.add('ready');
  }

  load();
  fetch('data/skulltulas.json')
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(boot)
    .catch(function (e) {
      document.body.insertAdjacentHTML('beforeend', '<p class="load-error" role="alert">Could not load data/skulltulas.json (' + esc(e.message) + '). If you opened the file directly, run a local web server instead — see the README.</p>');
    });

  if ('serviceWorker' in navigator && /^https:|^http:\/\/(localhost|127\.0\.0\.1)/.test(location.href)) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
})();
