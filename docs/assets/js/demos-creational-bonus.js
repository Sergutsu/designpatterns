/* ============================================================
   demos-creational-bonus.js — creational + game-specific demos
   ============================================================ */

/* ------------------------------------------------------------
   ABSTRACT FACTORY — themed UI family switcher
------------------------------------------------------------ */
DEMOS.abstractfactory = function (root, cat) {
  const D = DemoKit;
  const s = D.shell('Abstract Factory · themed widget families', cat);
  root.appendChild(s.root);

  const themes = {
    fantasy: { btn: '#6b4f2a', btnInk: '#ffe9c4', txt: '#3b2f1c', panel: '#241c10', border: '#8a6a35', font: 'Georgia, serif' },
    scifi: { btn: '#123a4d', btnInk: '#bdf3ff', txt: '#cfeef7', panel: '#0d1b24', border: '#2ea8c9', font: 'ui-monospace, monospace' },
  };
  let theme = 'fantasy';

  s.bar.appendChild(D.seg([
    { label: 'FantasyFactory', value: 'fantasy' },
    { label: 'SciFiFactory', value: 'scifi' },
  ], 'fantasy', v => { theme = v; paint(); }));

  const preview = D.h('div', 'demo-stage');
  preview.innerHTML = '<div style="padding:22px;display:grid;gap:12px;justify-items:start" class="preview-inner"></div>';
  const inner = preview.querySelector('.preview-inner');
  s.body.appendChild(preview);

  const log = D.makeLog(D.h('div'));
  s.body.appendChild(log.el);

  function makeButton(t, th) {
    const b = document.createElement('button');
    b.className = 'btn';
    b.textContent = t;
    b.style.background = th.btn; b.style.color = th.btnInk; b.style.borderColor = th.border;
    b.style.fontFamily = th.font;
    return b;
  }
  function makeText(t, th) {
    const d = document.createElement('div');
    d.textContent = t;
    d.style.cssText = `color:${th.txt};font-family:${th.font};border:1px solid ${th.border};padding:8px 12px;border-radius:8px;background:${th.panel}`;
    return d;
  }

  function paint() {
    const th = themes[theme];
    inner.innerHTML = '';
    // factory produces a MATCHED SET from one family:
    inner.append(makeText(theme === 'fantasy' ? '📜 Quest accepted: “Slay the forest troll”' : '▣ MISSION: neutralize target', th));
    inner.append(makeButton(theme === 'fantasy' ? 'Embark' : 'ENGAGE', th));
    inner.append(makeButton(theme === 'fantasy' ? 'Inventory' : 'CARGO', th));
    preview.style.setProperty('--cat-color', theme === 'fantasy' ? '#ffd166' : '#4cc9f0');
    log.line(`<b>${theme === 'fantasy' ? 'Fantasy' : 'SciFi'}Factory</b> installed → every widget comes from one family`, 'sys');
  }
  paint();
};

/* ------------------------------------------------------------
   BUILDER — director recipe, per-representation builders
------------------------------------------------------------ */
DEMOS.builder = function (root, cat) {
  const D = DemoKit;
  const s = D.shell('Builder · same steps, different products', cat);
  root.appendChild(s.root);

  const conf = { cls: 'warrior', gear: 'plate', pts: 10 };
  const row = D.h('div', 'row');
  const selCls = buildSel(['warrior', 'mage', 'ranger'], 'warrior', v => conf.cls = v, 'class');
  const selGear = buildSel(['plate', 'robe', 'leather'], 'plate', v => conf.gear = v, 'gear');
  const selPts = buildSel([5, 10, 20], 10, v => conf.pts = v, 'talent points');
  row.append(selCls.w, selGear.w, selPts.w);
  s.body.appendChild(row);

  function buildSel(opts, init, cb, label) {
    const wrap = D.h('div', '');
    wrap.appendChild(D.h('div', 'field-label', label));
    const segW = D.seg(opts.map(o => ({ label: String(o), value: o })), init, cb);
    wrap.appendChild(segW);
    return { w: wrap };
  }

  const result = D.h('div', 'panel tight', '');
  const log = D.makeLog(D.h('div'));
  s.body.append(result, log.el);

  s.bar.appendChild(D.btn('⚒ Director.Construct(heroBuilder)', 'primary', run));

  function run() {
    log.clear();
    result.innerHTML = '<span class="muted small">building…</span>';
    const steps = [
      `BuildBase(${conf.cls})`,
      `BuildGear(${conf.gear})`,
      `BuildTalents(${conf.pts} pts)`,
      `GetResult()`,
    ];
    let i = 0;
    const timer = setInterval(() => {
      if (i >= steps.length) {
        clearInterval(timer);
        result.innerHTML = `<div class="kv"><span class="k">hero</span><span class="v" style="color:var(--cat-color)">${conf.cls} · ${conf.gear} · ${conf.pts} pts</span></div>
          <div class="small muted mono">produced by HeroBuilder through Director’s fixed step order</div>`;
        log.line('<b>product ready</b> — ceremony identical for any builder', 'sys');
        return;
      }
      log.line(`director → <b>${steps[i]}</b>`, 'out');
      result.innerHTML = '<span class="muted small">' + steps.slice(0, i + 1).map((x, j) => `${j < i ? '✅' : '⏳'} ${x}`).join('<br>') + '</span>';
      i++;
    }, 450);
  }
};

/* ------------------------------------------------------------
   FACTORY — enum-keyed creation with cache
------------------------------------------------------------ */
DEMOS.factory = function (root, cat) {
  const D = DemoKit;
  const s = D.shell('Factory · enum key → concrete model', cat);
  root.appendChild(s.root);

  const catalog = {
    santro: { auto: false, cc: 1000, sedan: false },
    i10: { auto: true, cc: 1197, sedan: false },
    i20: { auto: true, cc: 1350, sedan: false },
    verna: { auto: true, cc: 1500, sedan: true },
    sonata: { auto: true, cc: 2000, sedan: true },
  };
  const cache = new Map();

  const row = D.h('div', 'row');
  const selW = D.h('div', '');
  selW.appendChild(D.h('div', 'field-label', 'HyundaiCars enum'));
  selW.appendChild(D.seg(Object.keys(catalog).map(k => ({ label: k, value: k })), 'santro', () => {}));
  row.appendChild(selW);
  s.body.appendChild(row);

  const table = D.h('div', 'output-block', '// GetCar(key) calls appear here');
  s.body.appendChild(table);

  const log = D.makeLog(D.h('div'));
  s.body.appendChild(log.el);
  s.bar.appendChild(D.btn('🏭 GetCar(selected enum)', 'primary', run));

  function run() {
    const key = selW.querySelector('.seg .on').textContent;
    log.line(`client: <b>GetCar(HyundaiCars.${key})</b>`, 'in');
    if (!cache.has(key)) {
      cache.set(key, catalog[key]);
      log.line(`factory: no cached instance → Activator.CreateInstance(<b>${key}</b>)`, 'warn');
    } else {
      log.line('factory: cache hit → returns SAME instance', 'out');
    }
    const c = cache.get(key);
    const tag = c.auto ? 'automatic' : 'manual';
    table.textContent += `\n#${cache.size}  ${key.padEnd(7)} → ${tag}, ${c.cc} cc, ${c.sedan ? 'sedan' : 'hatch'}\n`;
    table.scrollTop = table.scrollHeight;
  }
};

/* ------------------------------------------------------------
   PROTOTYPE — DNA clone safety
------------------------------------------------------------ */
DEMOS.prototype = function (root, cat) {
  const D = DemoKit;
  const s = D.shell('Prototype · clone before mutate', cat);
  root.appendChild(s.root);

  const BASESEQ = 'ATCGTTGCAAGGTCCCTA';
  const state = {
    evidence: { name: 'EVIDENCE (sealed)', seq: BASESEQ, mutated: false },
    cloneA: null,
    cloneB: null,
  };

  const box = D.h('div', 'panel');
  s.body.appendChild(box);

  const log = D.makeLog(D.h('div'));
  s.body.appendChild(log.el);

  s.bar.appendChild(D.btn('🧬 Clone A', '', () => cloneTo('cloneA')));
  s.bar.appendChild(D.btn('🧬 Clone B', '', () => cloneTo('cloneB')));
  s.bar.appendChild(D.btn('⚗ Mutate clone A (paternity test)', '', () => mutate('cloneA'), 'danger'));
  s.bar.appendChild(D.btn('⚗ Mutate clone B (mtDNA test)', '', () => mutate('cloneB'), 'danger'));

  function strand(seq, tone) {
    return [...seq].map(ch =>
      `<span style="display:inline-block;width:16px;text-align:center;font-family:var(--mono);border-bottom:2px solid ${tone};margin-right:2px">${ch}</span>`).join('');
  }

  function paint() {
    const rows = [];
    ['evidence', 'cloneA', 'cloneB'].forEach(k => {
      const o = state[k];
      if (!o) { rows.push(`<div class="kv"><span class="k">${k}</span><span class="v muted">not cloned yet</span></div>`); return; }
      rows.push(`<div style="margin:8px 0">
        <div class="kv"><span class="k">${o.name}</span>${o.mutated ? '<span class="mini-tag" style="color:var(--bad);border-color:var(--bad)">mutated</span>' : ''}</div>
        <div class="mt8">${strand(o.seq, k === 'evidence' ? 'var(--warn)' : 'var(--good)')}</div>
      </div>`);
    });
    box.innerHTML = rows.join('');
  }

  function cloneTo(slot) {
    state[slot] = { name: slot.toUpperCase(), seq: state.evidence.seq.slice(), mutated: false };
    log.line(`evidence.<b>Clone()</b> → deep copy into ${slot} — original reference untouched`, 'out');
    paint();
  }
  function mutate(slot) {
    const o = state[slot];
    if (!o) { log.line(`${slot}: nothing to mutate — clone first!`, 'err'); return; }
    o.seq = o.seq.slice(0, -3) + ['G', 'G', 'A'];
    o.mutated = true;
    log.line(`${slot} mutated at positions 15–17 (test artefact)`, 'warn');
    log.line(`evidence sample check: <b>${state.evidence.seq === BASESEQ ? 'PRISTINE ✓' : 'CORRUPTED ✗'}</b>`, 'sys');
    paint();
  }
  paint();
};

/* ------------------------------------------------------------
   SINGLETON — attempts vs instances
------------------------------------------------------------ */
DEMOS.singleton = function (root, cat) {
  const D = DemoKit;
  const s = D.shell('Singleton · one instance, endless attempts', cat);
  root.appendChild(s.root);

  let attempts = 0, instId = null;

  const kvA = D.h('div', 'kv', '');
  const kvI = D.h('div', 'kv', '');
  const kvSame = D.h('div', 'kv', '');
  const out = D.h('div', 'output-block', '// access log');
  s.body.append(D.h('div', 'row').append(kvA, kvI, kvSame), out);

  s.bar.appendChild(D.btn('new Configuration() ×1', '', () => attempt(1)));
  s.bar.appendChild(D.btn('×10', '', () => attempt(10)));

  const log = D.makeLog(D.h('div'));
  s.body.appendChild(log.el);

  function attempt(n) {
    for (let i = 0; i < n; i++) {
      attempts++;
      const ref = getConfig();
      if (instId === null) instId = ref.id;
    }
    kvA.innerHTML = D.kvRow('Default accesses', attempts);
    kvI.innerHTML = D.kvRow('distinct instances', 1, 'good');
    kvSame.innerHTML = D.kvRow('all refs identical?', 'true', 'good');
    out.textContent += `\naccess #${attempts} → Configuration #${instId} (shared)`;
    out.scrollTop = out.scrollHeight;
    log.line(`Configuration.Default accessed ${n}× — still instance <b>#${instId}</b>`, 'sys');
  }
  paint0();
  function paint0() {
    kvA.innerHTML = D.kvRow('Default accesses', 0);
    kvI.innerHTML = D.kvRow('distinct instances', 0);
    kvSame.innerHTML = D.kvRow('all refs identical?', '—');
  }

  const registry = {};
  function getConfig() {
    if (!registry.cfg) { registry.cfg = { id: Math.floor(Math.random() * 9000 + 1000) }; }
    return registry.cfg;
  }
};

/* ------------------------------------------------------------
   COMMAND — move macro recorder / undo / replay
------------------------------------------------------------ */
DEMOS.command = function (root, cat) {
  const D = DemoKit;
  const s = D.shell('Command · input as objects: record, undo, replay', cat);
  root.appendChild(s.root);

  const GRID = 16, CELL = 34, W = GRID * CELL, H = 12 * CELL;
  const { stage, ctx } = D.canvasStage(W, H);
  s.body.appendChild(stage);

  const log = D.makeLog(D.h('div'));
  s.body.appendChild(log.el);

  const history = [];
  let player = { x: 7, y: 5 }, recording = [];

  const hudRow = D.h('div', 'row mt8');
  const histEl = D.h('div', 'kv', '');
  hudRow.appendChild(histEl);
  s.body.appendChild(hudRow);

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = '#1b2336';
    for (let x = 0; x <= GRID; x++) { ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, H); ctx.stroke(); }
    for (let y = 0; y <= 12; y++) { ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(W, y * CELL); ctx.stroke(); }
    ctx.save();
    ctx.translate(player.x * CELL + CELL / 2, player.y * CELL + CELL / 2);
    ctx.shadowColor = 'var(--accent)'; ctx.shadowBlur = 14;
    ctx.fillStyle = '#4cc9f0';
    ctx.beginPath(); ctx.roundRect(-11, -11, 22, 22, 6); ctx.fill();
    ctx.restore();
  }

  function exec(cmd, silent) {
    cmd.execute();
    history.push(cmd);
    if (!silent) log.line(`Execute → <b>${cmd.label}</b>`, 'in');
    histEl.innerHTML = D.kvRow('history', history.length + ' commands');
    draw();
  }
  function undo() {
    const cmd = history.pop();
    if (!cmd) { log.line('undo stack empty', 'warn'); return; }
    cmd.undo();
    log.line(`Undo → <b>${cmd.label}</b> inverted`, 'out');
    histEl.innerHTML = D.kvRow('history', history.length + ' commands');
    draw();
  }

  const moves = [
    { d: '←', dx: -1, dy: 0 }, { d: '→', dx: 1, dy: 0 }, { d: '↑', dx: 0, dy: -1 }, { d: '↓', dx: 0, dy: 1 },
  ];
  const rowMove = D.h('div', 'row mt8');
  moves.forEach(m => {
    rowMove.appendChild(D.btn(m.d, 'primary', () => exec({
      label: `MoveCommand(${m.d})`,
      execute() { player.x = clamp(player.x + m.dx); player.y = clamp(player.y + m.dy); },
      undo() { player.x = clamp(player.x - m.dx); player.y = clamp(player.y - m.dy); },
    })));
  });
  const rowAct = D.h('div', 'row mt8');
  rowAct.append(
    D.btn('↩ Undo', '', undo),
    D.btn('⏺ Record macro: random walk', '', recordMacro),
    D.btn('▶ Replay recorded', '', replayMacro),
  );
  s.body.append(rowMove, rowAct);

  function clamp(v) { return Math.max(0, Math.min(GRID - 1, v)); }

  let macro = [], recTimer = null;
  function recordMacro() {
    if (recTimer) { clearInterval(recTimer); recTimer = null; }
    macro = [];
    log.line('<b>recording…</b> spawning 8 move commands', 'warn');
    let i = 0;
    recTimer = setInterval(() => {
      if (i++ >= 8) { clearInterval(recTimer); recTimer = null; return; }
      const m = moves[Math.floor(Math.random() * moves.length)];
      macro.push({
        label: `MoveCommand(${m.d})`,
        execute() { player.x = clamp(player.x + m.dx); player.y = clamp(player.y + m.dy); },
        undo() { player.x = clamp(player.x - m.dx); player.y = clamp(player.y - m.dy); },
      });
      exec(macro[macro.length - 1], true);
    }, 260);
  }
  function replayMacro() {
    if (!macro.length) { log.line('no macro recorded yet', 'err'); return; }
    log.line('<b>replaying</b> recorded command stream (same objects!)', 'sys');
    const snapshot = { ...player };
    macro.forEach((c, i) => setTimeout(() => { c.execute(); draw(); if (i === macro.length - 1) { player = snapshot; /* back to start */ draw(); log.line('replay done — stream is just data', 'sys'); } }, 240 * (i + 1)));
  }

  draw();
  log.line('press arrows — each press executes a <b>command object</b>, pushed on history', 'sys');
};

/* ------------------------------------------------------------
   OBJECT POOL — bullets & simulated GC pressure
------------------------------------------------------------ */
DEMOS.objectpool = function (root, cat) {
  const D = DemoKit;
  const s = D.shell('Object Pool · pooled vs allocate-every-shot', cat);
  root.appendChild(s.root);

  const { stage, ctx, W, H } = D.canvasStage(560, 300);
  s.body.appendChild(stage);

  const toggle = D.btn('Pooling: ON', 'toggle on', flip);
  s.bar.appendChild(toggle);
  s.bar.appendChild(D.btn('🔫 Fire ×12', 'primary', () => fire(12)));
  s.bar.appendChild(D.btn('💥 Fire ×120', '', () => fire(120)));

  const hud = D.h('div', 'stage-hud');
  const chips = { alloc: D.h('span', 'hud-chip', ''), live: D.h('span', 'hud-chip', ''), freed: D.h('span', 'hud-chip good', '') };
  Object.values(chips).forEach(c => hud.appendChild(c));
  stage.appendChild(hud);

  const meterAlloc = D.meter('bad');
  const log = D.makeLog(D.h('div'));
  s.body.append(meterAlloc.el, log.el);

  let pooling = true, freeList = [], made = 0, active = [], gcEvents = 0, peak = 0;

  function spawn() {
    let b;
    if (pooling && freeList.length) {
      b = freeList.pop();
    } else {
      made++;
      b = { x: 60, y: H - 40, vy: -(420 + Math.random() * 160), trail: [] };
      if (!pooling && made % 90 === 0) { gcEvents++; flashGc(); }
    }
    b.x = 60; b.y = H - 40; b.trail = [];
    active.push(b);
    peak = Math.max(peak, active.length);
  }
  function release(b) {
    b.vy = 0;
    if (pooling) freeList.push(b);
  }
  function flashGc() {
    log.line('<span class="hl">⚠ GC pause!</span> 90 dead bullets collected mid-frame (+2 ms hitch)', 'err');
    meterAlloc.el.animate?.([{ transform: 'scale(1.02)' }, { transform: 'scale(1)' }], 200);
  }
  function flip() {
    pooling = !pooling;
    toggle.textContent = 'Pooling: ' + (pooling ? 'ON' : 'OFF');
    toggle.classList.toggle('on', pooling);
    log.line(pooling ? 'pool engaged — reuse inactive bullets' : 'pool OFF — every shot news a bullet, GC incoming', 'sys');
  }

  function fire(n) {
    for (let i = 0; i < n; i++) spawn();
    log.line(`fired ×${n}`, 'in');
  }

  D.rafLoop(dt => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0e15'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#1b2336';
    ctx.beginPath(); ctx.moveTo(0, H - 30); ctx.lineTo(W, H - 30); ctx.stroke();
    // gun
    ctx.fillStyle = '#2b3652'; ctx.fillRect(52, H - 48, 16, 22);
    for (let i = active.length - 1; i >= 0; i--) {
      const b = active[i];
      b.y += b.vy * dt;
      b.trail.push({ x: b.x, y: b.y }); if (b.trail.length > 6) b.trail.shift();
      ctx.strokeStyle = pooling ? 'rgba(128,237,153,.35)' : 'rgba(255,93,115,.3)';
      ctx.beginPath();
      b.trail.forEach((p, j) => j ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
      ctx.stroke();
      ctx.fillStyle = pooling ? '#80ed99' : '#ff5d73';
      ctx.fillRect(b.x - 2, b.y - 6, 4, 12);
      if (b.y < -20) { active.splice(i, 1); release(b); }
    }
    chips.alloc.innerHTML = `allocations: <b>${made}</b>`;
    chips.live.innerHTML = `live: <b>${active.length}</b>`;
    chips.freed.innerHTML = `pooled free: <b>${freeList.length}</b>`;
    meterAlloc.set(pooling ? freeList.length / 200 * 100 : Math.min(100, gcEvents * 18));
    meterAlloc.el.className = 'meter ' + (pooling ? 'good' : 'bad');
  });

  log.line('pool starts empty — early bursts allocate, afterwards bullets are recycled', 'sys');
};

/* ------------------------------------------------------------
   GAME LOOP — fixed timestep visualizer
------------------------------------------------------------ */
DEMOS.gameloop = function (root, cat) {
  const D = DemoKit;
  const s = D.shell('Game Loop · fixed-step accumulator', cat);
  root.appendChild(s.root);

  const track = D.h('div', 'loop-track');
  const cursor = D.h('div', 'loop-cursor');
  track.appendChild(cursor);
  s.body.appendChild(track);

  const stats = D.h('div', 'row mt8');
  const fEl = D.h('div', 'kv', ''), uEl = D.h('div', 'kv', ''), accEl = D.h('div', 'kv', '');
  stats.append(fEl, uEl, accEl);
  const accBar = D.meter('good');
  s.body.append(stats, accBar.el);

  s.bar.appendChild(D.btn('⏸ pause', '', toggle));
  const tgl = s.bar.querySelector('.btn');
  let running = true;
  function toggle() { running = !running; tgl.textContent = running ? '⏸ pause' : '▶ resume'; }

  const STEP = 100; // px per sim-second across track
  const STEP_MS = 1000 / 60;
  let acc = 0, frames = 0, updates = 0, last = performance.now();
  const ticks = [];

  D.rafLoop(() => {
    if (!running) { last = performance.now(); return; }
    const now = performance.now();
    acc += Math.min(now - last, 100); last = now;
    frames++;

    while (acc >= STEP_MS) {
      acc -= STEP_MS; updates++;
      const tk = D.h('div', 'loop-tick');
      const pos = 8 + ((updates * 7.7) % 92);
      tk.style.left = pos + '%';
      track.appendChild(tk);
      ticks.push(tk);
      if (ticks.length > 40) { const old = ticks.shift(); old.remove(); }
    }
    const T = track.clientWidth || 600;
    const phase = (performance.now() / 1000 * 40) % T;
    cursor.style.left = phase + 'px';
    fEl.innerHTML = D.kvRow('render frames', frames);
    uEl.innerHTML = D.kvRow('sim updates (60 Hz)', updates, 'good');
    accEl.innerHTML = D.kvRow('accumulator', acc.toFixed(1) + ' ms');
    accBar.set(acc / STEP_MS * 100);
  });

  const note = D.h('div', 'small muted mt8',
    'Even when the display refreshes unevenly, sim advances in exact 16.66 ms slices — deterministic physics, smooth render.');
  s.body.appendChild(note);
};

/* ------------------------------------------------------------
   COMPONENT / ECS — systems over plain data maps
------------------------------------------------------------ */
DEMOS.component = function (root, cat) {
  const D = DemoKit;
  const s = D.shell('Component/ECS · systems iterate matching data', cat);
  root.appendChild(s.root);

  const { stage, ctx, W, H } = D.canvasStage(560, 260);
  s.body.appendChild(stage);

  const world = { nextId: 1, pos: new Map(), vel: new Map(), wind: new Set() };

  s.bar.appendChild(D.btn('＋ spawn entity', 'primary', () => { spawn(); }));
  s.bar.appendChild(D.btn('💨 add Wind to all', '', () => { world.pos.forEach((_, id) => world.wind.add(id)); log.line('<b>Wind marker</b> attached to all entities — no new classes', 'sys'); }));
  s.bar.appendChild(D.btn('🌀 reset', '', () => { world.pos.clear(); world.vel.clear(); world.wind.clear(); log.clear(); }));

  const hud = D.h('div', 'stage-hud');
  const cE = D.h('span', 'hud-chip', ''), cM = D.h('span', 'hud-chip good', '');
  hud.append(cE, cM); stage.appendChild(hud);

  const log = D.makeLog(D.h('div'));
  s.body.appendChild(log.el);

  function spawn() {
    const id = world.nextId++;
    world.pos.set(id, { x: 30 + Math.random() * 120, y: 30 + Math.random() * (H - 60) });
    world.vel.set(id, { vx: 30 + Math.random() * 40, vy: (Math.random() - .5) * 16 });
    log.line(`entity #${id} = id + [Position, Velocity] components`, 'out');
  }

  D.rafLoop(dt => {
    // MovementSystem: entities with Pos+Vel
    for (const [id, p] of world.pos) {
      if (!world.vel.has(id)) continue;
      const v = world.vel.get(id);
      p.x += v.vx * dt; p.y += v.vy * dt;
      if (p.x > W - 20) { p.x = 20; }
      if (p.y < 10 || p.y > H - 10) v.vy *= -1;
      // WindSystem: entities with extra marker
      if (world.wind.has(id)) p.y -= 26 * dt;
    }
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0e15'; ctx.fillRect(0, 0, W, H);
    for (const [id, p] of world.pos) {
      const hasV = world.vel.has(id), hasW = world.wind.has(id);
      ctx.fillStyle = hasW ? '#80ed99' : hasV ? '#4cc9f0' : '#6b7690';
      ctx.beginPath(); ctx.arc(p.x, p.y, hasW ? 7 : 5, 0, 7); ctx.fill();
      ctx.fillStyle = '#9aa5bd'; ctx.font = '9px ui-monospace';
      ctx.fillText('#' + id, p.x + 9, p.y + 3);
    }
    cE.innerHTML = `entities: <b>${world.pos.size}</b>`;
    cM.innerHTML = `systems ran: <b>movement + wind</b>`;
  });

  for (let i = 0; i < 6; i++) spawn();
  log.line('no Enemy/Hero classes — just ids and component data', 'sys');
};

/* ------------------------------------------------------------
   SPATIAL PARTITION — grid broad-phase on canvas
------------------------------------------------------------ */
DEMOS.spatial = function (root, cat) {
  const D = DemoKit;
  const s = D.shell('Spatial Partition · broad-phase candidate selection', cat);
  root.appendChild(s.root);

  const { stage, ctx, W, H } = D.canvasStage(560, 300);
  s.body.appendChild(stage);
  stage.style.cursor = 'crosshair';

  const CELL = 40;
  let useGrid = true, query = { x: W / 2, y: H / 2, r: 90 };
  const ents = [];
  for (let i = 0; i < 140; i++) {
    ents.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * 26, vy: (Math.random() - .5) * 26 });
  }

  s.bar.appendChild(D.btn('grid: ON', 'toggle on', flip));
  const flipBtn = s.bar.querySelector('.btn');
  function flip() {
    useGrid = !useGrid;
    flipBtn.textContent = 'grid: ' + (useGrid ? 'ON' : 'OFF');
    flipBtn.classList.toggle('on', useGrid);
  }

  const hud = D.h('div', 'stage-hud');
  const cA = D.h('span', 'hud-chip', ''), cB = D.h('span', 'hud-chip good', '');
  hud.append(cA, cB); stage.appendChild(hud);

  stage.addEventListener('pointermove', e => {
    const rc = stage.getBoundingClientRect();
    query.x = (e.clientX - rc.left) * (W / rc.width);
    query.y = (e.clientY - rc.top) * (H / rc.height);
  });

  const log = D.makeLog(D.h('div'));
  s.body.appendChild(log.el);

  D.rafLoop(dt => {
    ents.forEach(e => {
      e.x = (e.x + e.vx * dt + W) % W;
      e.y = (e.y + e.vy * dt + H) % H;
    });

    // candidates
    let tests = 0;
    const cx0 = Math.floor((query.x - query.r) / CELL), cx1 = Math.floor((query.x + query.r) / CELL);
    const cy0 = Math.floor((query.y - query.r) / CELL), cy1 = Math.floor((query.y + query.r) / CELL);
    const hitCells = useGrid
      ? new Set(ents.filter(e => {
          const cx = Math.floor(e.x / CELL), cy = Math.floor(e.y / CELL);
          return cx >= cx0 && cx <= cx1 && cy >= cy0 && cy <= cy1;
        }))
      : ents;
    tests = useGrid ? hitCells.size : ents.length;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0e15'; ctx.fillRect(0, 0, W, H);

    // grid cells
    ctx.strokeStyle = useGrid ? '#22304a' : '#161c2b';
    for (let x = 0; x <= W; x += CELL) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += CELL) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    if (useGrid) {
      ctx.fillStyle = 'rgba(76,201,240,.08)';
      for (let cx = cx0; cx <= cx1; cx++) for (let cy = cy0; cy <= cy1; cy++) {
        if (cx < 0 || cy < 0 || cx * CELL > W || cy * CELL > H) continue;
        ctx.fillRect(cx * CELL, cy * CELL, CELL, CELL);
      }
    }

    ents.forEach(e => {
      const near = hitCells.has(e);
      ctx.fillStyle = near ? '#ffd166' : '#3a4a6b';
      ctx.beginPath(); ctx.arc(e.x, e.y, near ? 4 : 2.4, 0, 7); ctx.fill();
    });

    // query circle
    ctx.strokeStyle = '#f72585'; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.arc(query.x, query.y, query.r, 0, 7); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#f72585'; ctx.beginPath(); ctx.arc(query.x, query.y, 3, 0, 7); ctx.fill();

    cA.innerHTML = `pairwise tests (no grid): <b>${(ents.length * (ents.length - 1) / 2).toLocaleString()}</b>`;
    cB.innerHTML = `broad-phase candidates: <b>${tests}</b>`;
  });
  log.line('move the mouse — only cells overlapped by the circle are tested', 'sys');
};

/* ------------------------------------------------------------
   EVENT QUEUE — ring buffer dispatcher
------------------------------------------------------------ */
DEMOS.eventqueue = function (root, cat) {
  const D = DemoKit;
  const s = D.shell('Event Queue · post now, dispatch next tick', cat);
  root.appendChild(s.root);

  const SLOTS = 16;
  const buf = new Array(SLOTS).fill(null);
  let head = 0, count = 0, tickCount = 0;

  const slotsBox = D.h('div', 'row');
  const slotEls = [];
  for (let i = 0; i < SLOTS; i++) {
    const el = D.h('span', 'sub-card', `${i}`);
    el.style.cssText = 'width:34px;height:30px;justify-content:center;padding:0;font-family:var(--mono);font-size:11px';
    slotsBox.appendChild(el); slotEls.push(el);
  }
  s.body.appendChild(slotsBox);

  const kindRow = D.h('div', 'row mt8');
  ['HitSound', 'MuzzleFlash', 'Footstep', 'UI ping'].forEach(k => {
    kindRow.appendChild(D.btn('post ' + k, '', () => post(k)));
  });
  kindRow.appendChild(D.btn('🎲 post random ×5', 'primary', () => {
    const ks = ['HitSound', 'MuzzleFlash', 'Footstep', 'UI ping'];
    for (let i = 0; i < 5; i++) post(ks[Math.floor(Math.random() * ks.length)]);
  }));
  s.body.appendChild(kindRow);

  const log = D.makeLog(D.h('div'));
  s.body.appendChild(log.el);

  const tickRow = D.h('div', 'row mt8');
  const tickEl = D.h('div', 'kv', '');
  tickRow.appendChild(tickEl);
  s.body.appendChild(tickRow);

  function post(type) {
    if (count >= SLOTS) { log.line('ring buffer FULL — event dropped (fixed memory!)', 'err'); return; }
    buf[(head + count) % SLOTS] = type; count++;
    paint();
    log.line(`posted <b>${type}</b> @ slot ${(head + count - 1) % SLOTS}`, 'in');
  }

  function paint() {
    slotEls.forEach((el, i) => {
      const occ = buf[i] !== null;
      el.classList.toggle('on', occ);
      el.textContent = occ ? buf[i].slice(0, 2) : i;
    });
  }

  setInterval(() => {
    tickCount++;
    if (count === 0) { tickEl.innerHTML = D.kvRow('tick', tickCount + ' · queue empty'); return; }
    const batch = [];
    while (count > 0) { batch.push(buf[head]); buf[head] = null; head = (head + 1) % SLOTS; count--; }
    paint();
    log.line(`tick ${tickCount}: <b>dispatcher drains ${batch.length} event(s)</b> → audio/ui subsystems`, 'out');
    tickEl.innerHTML = D.kvRow('tick', tickCount + ' · drained ' + batch.length);
  }, 1400);

  log.line('producers post freely; the dispatcher owns ALL re-entrant mutation points', 'sys');
};
