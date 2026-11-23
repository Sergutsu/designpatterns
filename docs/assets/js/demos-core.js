/* ============================================================
   demos-core.js — DemoKit helpers + structural pattern demos
   ============================================================ */
window.DEMOS = window.DEMOS || {};

window.DemoKit = (function () {
  function h(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  let logSeq = 0;
  function makeLog(parent, max = 90) {
    parent.classList.add('log-panel');
    const api = {
      el: parent,
      line(msg, cls) {
        const d = h('div', 'log-line' + (cls ? ' ' + cls : ''));
        const t = h('span', 'lt', 't+' + (logSeq++));
        const m = h('span', '');
        m.innerHTML = msg;
        d.append(t, m);
        parent.appendChild(d);
        while (parent.children.length > max) parent.removeChild(parent.firstChild);
        parent.scrollTop = parent.scrollHeight;
      },
      clear() { parent.innerHTML = ''; },
    };
    return api;
  }

  function seg(items, initial, onPick) {
    const wrap = h('div', 'seg');
    const btns = items.map(it => {
      const b = h('button', it.value === initial ? 'on' : '', it.label);
      b.type = 'button';
      b.addEventListener('click', () => {
        btns.forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        onPick && onPick(it.value);
      });
      wrap.appendChild(b);
      return b;
    });
    return wrap;
  }

  function btn(label, cls, onClick) {
    const b = h('button', 'btn' + (cls ? ' ' + cls : ''), label);
    b.type = 'button';
    b.addEventListener('click', onClick);
    return b;
  }

  function canvasStage(width, height) {
    const stage = h('div', 'demo-stage');
    const cv = h('canvas', 'stage-canvas');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = width * dpr; cv.height = height * dpr;
    cv.style.aspectRatio = width + ' / ' + height;
    const ctx = cv.getContext('2d');
    ctx.scale(dpr, dpr);
    stage.appendChild(cv);
    return { stage, cv, ctx, W: width, H: height };
  }

  function hud(stage, chips) {
    // chips: [{key,label}] -> returns update fn
    const box = h('div', 'stage-hud');
    const map = {};
    chips.forEach(c => {
      const chip = h('span', 'hud-chip' + (c.tone ? ' ' + c.tone : ''), c.label);
      map[c.key] = chip;
      box.appendChild(chip);
    });
    stage.appendChild(box);
    return function (key, val) {
      if (!map[key]) return;
      map[key].innerHTML = keyLabel(map[key]) + val;
      function keyLabel() { return map[key].dataset.k || (map[key].dataset.k = map[key].textContent.replace(/<b>.*<\/b>/, '').trim()); }
      map[key].innerHTML = map[key].dataset.k.replace(/:.*$/, '') + ': <b>' + val + '</b>';
    };
  }

  const activeLoops = new Set();
  function rafLoop(fn) {
    let alive = true, last = performance.now();
    function tick(now) {
      if (!alive) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      fn(dt, now / 1000);
      if (alive) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    const stop = function () { alive = false; activeLoops.delete(stop); };
    activeLoops.add(stop);
    return stop;
  }
  function stopAllLoops() { activeLoops.forEach(stop => stop()); activeLoops.clear(); }

  /* ---- track demos' timers so navigation kills stray intervals/timeouts ---- */
  const timerIds = new Set();
  const _si = window.setInterval.bind(window);
  const _st = window.setTimeout.bind(window);
  const _ci = window.clearInterval.bind(window);
  const _ct = window.clearTimeout.bind(window);
  window.setInterval = function (cb, ms, ...rest) { const id = _si(cb, ms, ...rest); timerIds.add(id); return id; };
  window.setTimeout = function (cb, ms, ...rest) { const id = _st(cb, ms, ...rest); timerIds.add(id); return id; };
  window.clearInterval = function (id) { timerIds.delete(id); return _ci(id); };
  window.clearTimeout = function (id) { timerIds.delete(id); return _ct(id); };
  function stopAllTimers() { timerIds.forEach(id => { _ci(id); _ct(id); }); timerIds.clear(); }

  function meter(colorClass) {
    const m = h('div', 'meter' + (colorClass ? ' ' + colorClass : ''));
    const i = h('i');
    m.appendChild(i);
    return { el: m, set(v) { i.style.width = Math.max(0, Math.min(100, v)) + '%'; } };
  }

  function shell(title, catColor) {
    const root = h('div', 'demo-shell');
    root.style.setProperty('--cat-color', catColor || 'var(--accent)');
    const bar = h('div', 'demo-toolbar');
    const t = h('span', 'demo-title', title);
    bar.appendChild(t);
    const body = h('div', 'demo-body');
    root.append(bar, body);
    return { root, bar, body };
  }

  function kvRow(k, v, tone) {
    return `<div class="kv"><span class="k">${k}</span><span class="v ${tone || ''}" data-kv="${k}">${v}</span></div>`;
  }

  return { h, makeLog, seg, btn, canvasStage, hud, rafLoop, stopAllLoops, stopAllTimers, meter, shell, kvRow };
})();

/* ------------------------------------------------------------
   ADAPTER — modern interface vs legacy SDK behind one face
------------------------------------------------------------ */
DEMOS.adapter = function (root, cat) {
  const D = DemoKit;
  const s = D.shell('Adapter · remote desktop connect', cat);
  root.appendChild(s.root);

  const segW = D.seg([
    { label: 'Your API', value: 'modern' },
    { label: 'Legacy VNC', value: 'legacy' },
  ], 'modern', refresh);

  s.bar.appendChild(segW);
  const runBtn = D.btn('Connect', 'primary', doConnect);
  const demo = D.btn('Send keystroke', '', doKey);
  s.bar.append(runBtn, demo);

  const log = D.makeLog(D.h('div'));

  function refresh(mode) {
    log.line(`mode → <b>${mode === 'legacy' ? 'RealVNCRemoteDesktopAdapter' : 'NativeRemoteDesktop'}</b> (client code unchanged)`, 'sys');
  }

  function doConnect() {
    const mode = segW.querySelector('.on').textContent === 'Legacy VNC' ? 'legacy' : 'modern';
    log.line('client calls <b>IMyRemoteDesktop.Connect("level-editor-01")</b>', 'in');
    if (mode === 'legacy') {
      log.line('adapter translates → RealVncSdk.open(host, 5900)', 'out');
      log.line('adapter translates → handshake(Protocol.V3)', 'out');
      log.line('<span class="hl">✓ connected</span> — vendor quirks absorbed', 'sys');
    } else {
      log.line('native implementation → direct OS call', 'out');
      log.line('<span class="hl">✓ connected</span>', 'sys');
    }
  }

  function doKey() {
    log.line('client calls <b>SendInput(Key.W)</b>', 'in');
    log.line('→ adaptee receives scancode 0x11', 'out');
  }

  s.body.appendChild(log.el);
  refresh('modern');
};

/* ------------------------------------------------------------
   BRIDGE — remote abstraction × TV brand implementations
------------------------------------------------------------ */
DEMOS.bridge = function (root, cat) {
  const D = DemoKit;
  const s = D.shell('Bridge · RemoteControl × ITelevision', cat);
  root.appendChild(s.root);

  let brand = 'Sony';
  s.bar.appendChild(D.seg([
    { label: 'SonyTv', value: 'Sony' },
    { label: 'SamsungTv', value: 'Samsung' },
  ], 'Sony', v => { brand = v; log.line(`SetTelevision(<b>${v}Tv</b>) — implementation axis swapped`, 'sys'); }));

  const row = D.h('div', 'row mt8');
  row.append(
    D.btn('⏻ Power', 'primary', () => fire('TogglePower')),
    D.btn('CH +', '', () => fire('SetChannel(+1)')),
    D.btn('CH −', '', () => fire('SetChannel(−1)')),
  );
  s.body.appendChild(row);

  const log = D.makeLog(D.h('div'));
  s.body.appendChild(log.el);

  let ch = 1;
  function fire(op) {
    log.line(`abstraction: <b>RemoteControl.${op}()</b>`, 'in');
    if (op.includes('Power')) log.line(`→ ${brand}Tv.onOff()  <span class="muted">(vendor specifics hidden)</span>`, 'out');
    else { ch += op.includes('+') ? 1 : -1; log.line(`→ ${brand}Tv.setChannel(${ch})`, 'out'); }
  }
};

/* ------------------------------------------------------------
   COMPOSITE — scene-graph traversal with live totals
------------------------------------------------------------ */
DEMOS.composite = function (root, cat) {
  const D = DemoKit;
  const s = D.shell('Composite · scene graph render pass', cat);
  root.appendChild(s.root);

  const tree = {
    name: 'Root', kind: '◆', meta: 'group', cost: 1,
    kids: [
      { name: 'Terrain', kind: '▣', meta: 'leaf · 12 tris', cost: 12, kids: [] },
      {
        name: 'Props', kind: '◆', meta: 'group', cost: 1, kids: [
          { name: 'Crate ×3', kind: '▣', meta: 'instanced leaf', cost: 90, kids: [] },
          { name: 'Barrel', kind: '▣', meta: 'leaf · 48 tris', cost: 48, kids: [] },
        ],
      },
      {
        name: 'Characters', kind: '◆', meta: 'group', cost: 1, kids: [
          { name: 'Hero', kind: '▣', meta: 'skinned leaf', cost: 8200, kids: [] },
          { name: 'Goblin ×2', kind: '▣', meta: 'instanced leaf', cost: 1200, kids: [] },
        ],
      },
    ],
  };

  const treeBox = D.h('div', 'tree');
  const statRow = D.h('div', 'row');
  const statDraw = D.h('div', 'kv', '');
  const statTris = D.h('div', 'kv', '');
  statRow.append(statDraw, statTris);
  s.body.append(treeBox, statRow);

  const badges = [];
  function buildTree(node) {
    const li = D.h('li');
    const badge = D.h('span', 'tnode',
      `<span class="ico">${node.kind}</span> ${node.name} <span class="meta">${node.meta}</span>`);
    li.appendChild(badge);
    badges.push({ node, badge });
    if (node.kids.length) {
      const k = D.h('ul');
      node.kids.forEach(c => k.appendChild(buildTree(c)));
      li.appendChild(k);
    }
    return li;
  }
  treeBox.appendChild(D.h('ul'));
  treeBox.firstChild.appendChild(buildTree(tree));

  s.bar.appendChild(D.btn('▶ Render frame', 'primary', run));

  let busy = false, timer = null;
  function run() {
    if (busy) return;
    busy = true;
    let drawCalls = 0, tris = 0, i = 0;
    statDraw.innerHTML = D.kvRow('draw calls', '0');
    statTris.innerHTML = D.kvRow('triangles', '0');
    timer && clearInterval(timer);
    timer = setInterval(() => {
      if (i > 0) badges[i - 1].badge.classList.remove('hi');
      if (i >= badges.length) {
        clearInterval(timer);
        busy = false;
        statDraw.innerHTML = D.kvRow('draw calls', drawCalls, 'good');
        statTris.innerHTML = D.kvRow('triangles submitted', tris.toLocaleString(), 'good');
        return;
      }
      const { node, badge } = badges[i++];
      badge.classList.add('hi');
      drawCalls++; tris += node.cost;
      statDraw.innerHTML = D.kvRow('draw calls', drawCalls);
      statTris.innerHTML = D.kvRow('triangles', tris.toLocaleString());
    }, 300);
  }
};

/* ------------------------------------------------------------
   DECORATOR — pizza topping stack, live price
------------------------------------------------------------ */
DEMOS.decorator = function (root, cat) {
  const D = DemoKit;
  const s = D.shell('Decorator · runtime modifier stack', cat);
  root.appendChild(s.root);

  const toppings = [
    { id: 'cheese', name: 'Extra Cheese', price: 2.5 },
    { id: 'soya', name: 'Soya Crumble', price: 1.75 },
    { id: 'pepperoni', name: 'Pepperoni', price: 3.0 },
    { id: 'chili', name: 'Chili Oil Drizzle', price: 0.9 },
  ];

  const BASE = { name: 'Margherita', price: 8 };
  const stackBox = D.h('div');
  const descEl = D.h('div', 'kv');
  const priceEl = D.h('div', 'kv');
  const ctrl = D.h('div', 'row');

  const boxes = toppings.map(t => {
    const cb = D.h('label', 'state-badge', `<input type="checkbox" style="display:none"> ${t.name} <span class="muted">+$${t.price.toFixed(2)}</span>`);
    cb.querySelector('input').addEventListener('change', e => { e.target.closest('label').classList.toggle('on', e.target.checked); update(); });
    ctrl.appendChild(cb);
    return { t, cb };
  });

  s.body.append(ctrl, stackBox, D.h('div', 'row mt8').append(descEl, priceEl));

  function update() {
    const chosen = boxes.filter(b => b.cb.querySelector('input').checked).map(b => b.t);
    stackBox.innerHTML = '';
    const layers = [{ name: BASE.name, price: BASE.price }].concat(chosen);
    layers.forEach((l, i) => {
      const chip = D.h('div', 'sub-card' + (i ? ' on' : ''), `${i}. ${l.name}`);
      stackBox.appendChild(chip);
      if (i < layers.length - 1) stackBox.appendChild(D.h('span', 'muted', ' → '));
    });
    const total = layers.reduce((a, l) => a + l.price, 0);
    descEl.innerHTML = D.kvRow('Description', layers.map(l => l.name.split(' ')[0]).join(' + '));
    priceEl.innerHTML = D.kvRow('Cost()', '$' + total.toFixed(2), 'good');
  }
  update();
};

/* ------------------------------------------------------------
   FACADE — order pipeline choreography
------------------------------------------------------------ */
DEMOS.facade = function (root, cat) {
  const D = DemoKit;
  const s = D.shell('Facade · PlaceOrder() orchestration', cat);
  root.appendChild(s.root);

  const steps = ['Catalog.Reserve(item)', 'PaymentGateway.Charge(account, $129)', 'InvoiceService.Issue(receipt)'];
  const checklist = D.h('div', 'note-list');
  const items = steps.map(st => D.h('li', '', '⏳ ' + st));
  items.forEach(i => checklist.appendChild(i));
  s.body.appendChild(checklist);
  const log = D.makeLog(D.h('div'));
  s.body.appendChild(log.el);

  const placeBtn = D.btn('🛒 Place order', 'primary', run);
  s.bar.appendChild(placeBtn);
  let running = false;

  function run() {
    if (running) return;
    running = true;
    let i = 0;
    items.forEach(x => x.innerHTML = x.textContent.replace('✅', '').replace('⏳', '⏳').trim());
    log.line('client: <b>orderFacade.PlaceOrder(sword, account)</b>', 'in');
    const timer = setInterval(() => {
      if (i > 0) items[i - 1].innerHTML = '✅ ' + steps[i - 1];
      if (i >= steps.length) {
        clearInterval(timer);
        items.forEach((x, j) => x.innerHTML = '✅ ' + steps[j]);
        log.line('<span class="hl">✓ Receipt issued</span> — client never touched the 3 subsystems', 'sys');
        running = false;
        return;
      }
      items[i].innerHTML = '⏳ ' + steps[i] + ' …';
      log.line('facade → ' + steps[i], 'out');
      i++;
    }, 650);
  }
};

/* ------------------------------------------------------------
   FLYWEIGHT — forest scale vs memory share
------------------------------------------------------------ */
DEMOS.flyweight = function (root, cat) {
  const D = DemoKit;
  const s = D.shell('Flyweight · 50 000 trees, one mesh', cat);
  root.appendChild(s.root);

  const sliderRow = D.h('div', 'field-label', 'tree count');
  const slider = D.h('input', 'slider');
  slider.type = 'range'; slider.min = 100; slider.max = 50000; slider.step = 100; slider.value = 5000;
  s.body.append(sliderRow, slider);

  const cmp = D.h('div');
  s.body.appendChild(cmp);

  const { stage, ctx, W, H } = D.canvasStage(560, 210);
  s.body.appendChild(stage);

  function drawForest(n) {
    ctx.clearRect(0, 0, W, H);
    // sky ground
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0d1524'); g.addColorStop(1, '#0f1a14');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#233049';
    for (let i = 0; i < n; i++) {
      const x = (Math.sin(i * 12.9898) * 43758.5453 % 1) * W;
      const px = Math.abs(x), py = 40 + ((i * 7) % (H - 70));
      const sc = 0.5 + ((i * 13) % 10) / 14;
      ctx.fillStyle = i % 7 === 0 ? '#2e5d43' : '#24503a';
      ctx.beginPath();
      ctx.moveTo(px, py - 14 * sc);
      ctx.lineTo(px - 8 * sc, py);
      ctx.lineTo(px + 8 * sc, py);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#3a2f22';
      ctx.fillRect(px - 1, py, 2, 5 * sc);
    }
  }

  function update() {
    const n = +slider.value;
    drawForest(n);
    const PER_OBJ = 240;         // bytes: transform+state naive
    const SHARED = 64;           // bytes: only extrinsic per instance
    const naiveMB = (n * PER_OBJ) / 1e6;
    const sharedMB = (n * SHARED + 400_000) / 1e6; // + one shared mesh/texture
    cmp.innerHTML = `
      <div class="cmp-row"><span>naïve (each tree owns mesh)</span><div class="bar"><i style="width:${Math.min(100, naiveMB * 2)}%;background:linear-gradient(90deg,#ff5d73,#ff9a5d)"></i></div><span class="val bad">${naiveMB.toFixed(1)} MB</span></div>
      <div class="cmp-row"><span>flyweight (shared mesh+texture)</span><div class="bar"><i style="width:${Math.min(100, sharedMB * 2)}%;background:linear-gradient(90deg,#80ed99,#2fbf71)"></i></div><span class="val good">${sharedMB.toFixed(2)} MB</span></div>
      <div class="small muted mt8">Shared objects: <b class="mono" style="color:var(--good)">1</b> · instances: <b class="mono" style="color:var(--ink)">${n.toLocaleString()}</b> · saving <b class="mono" style="color:var(--good)">${(100 - sharedMB / naiveMB * 100).toFixed(1)}%</b> memory</div>`;
  }
  slider.addEventListener('input', update);
  update();
};

/* ------------------------------------------------------------
   PROXY — lazy asset loading
------------------------------------------------------------ */
DEMOS.proxy = function (root, cat) {
  const D = DemoKit;
  const s = D.shell('Proxy · lazy texture loading', cat);
  root.appendChild(s.root);

  const stageBox = D.h('div', 'demo-stage');
  const inner = D.h('div', 'row', '<span class="muted small">viewport preview</span>');
  stageBox.appendChild(inner);
  s.body.appendChild(stageBox);

  const log = D.makeLog(D.h('div'));
  s.body.appendChild(log.el);

  const guard = D.h('label', 'state-badge', '<input type="checkbox" checked> protection proxy (permission check)');
  s.bar.appendChild(guard);
  s.bar.appendChild(D.btn('Render full-res texture', 'primary', use));
  const g = guard.querySelector('input');

  let tex = null, loading = false;

  function use() {
    if (!tex) {
      if (!g.checked) {
        log.line('<b>proxy</b>: permission denied — no upload attempted', 'err');
        return;
      }
      if (loading) return;
      loading = true;
      log.line('proxy.render() → real texture not loaded yet…', 'in');
      inner.innerHTML = '<span class="muted">⏳ uploading 42 MB…</span>';
      setTimeout(() => {
        tex = { url: 'forest_4k.dds', sizeMB: 42, uploaded: true };
        loading = false;
        log.line('BankTexture loaded (once): 42 MB GPU upload', 'warn');
        paint();
      }, 900);
    } else {
      log.line('proxy.render() → texture already resident, <b>instant</b>', 'out');
      paint();
    }
  }

  function paint() {
    inner.innerHTML = '';
    const d = D.h('div', 'row');
    d.innerHTML = `<div style="width:150px;height:96px;border-radius:10px;border:1px solid var(--line);background:radial-gradient(circle at 30% 30%, #2e5d43, #0f1a14);display:grid;place-items:center;font-family:var(--mono);font-size:11px;color:#80ed99">🌲 4K texture</div>
      <div class="small muted">url: ${tex.url}<br>size: ${tex.sizeMB} MB<br>uploads performed: <b style="color:var(--good)">1</b></div>`;
    inner.appendChild(d);
  }
};
