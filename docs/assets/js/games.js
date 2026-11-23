/* ============================================================
   games.js — tiny playable minigames that combine several
   patterns from the dossier. Each mount() returns a cleanup fn.
   ============================================================ */
(function () {
  const D = window.DemoKit;
  const h = D.h;

  function gameFrame(title, sub) {
    const root = h('div', 'demo-shell');
    root.style.setProperty('--cat-color', '#80ed99');
    const bar = h('div', 'demo-toolbar');
    bar.appendChild(h('span', 'demo-title', title));
    const body = h('div', 'demo-body');
    root.append(bar, body);
    return { root, bar, body };
  }

  function overlay(stage, html, btnLabel, cb) {
    const ov = h('div', '');
    ov.style.cssText = 'position:absolute;inset:0;display:grid;place-items:center;background:rgba(6,9,14,.82);backdrop-filter:blur(3px);z-index:5';
    ov.innerHTML = `<div style="text-align:center;display:grid;gap:12px;justify-items:center">
      <div style="font-family:var(--mono);font-size:20px;font-weight:700">${html}</div>
      <button class="btn primary" type="button">${btnLabel}</button></div>`;
    ov.querySelector('button').addEventListener('click', () => { ov.remove(); cb(); });
    stage.appendChild(ov);
    return ov;
  }

  /* ============================================================
     GAME 1 — NEON POOL ARENA
     Object Pool (bullets+enemies) · Strategy (enemy behaviors)
     Command (input) · Observer (score/kill feed)
  ============================================================ */
  function shooter(root, cat) {
    const F = gameFrame('🕹 minigame · neon pool arena', '#80ed99');
    root.appendChild(F.root);

    const W = 640, H = 400;
    const { stage, ctx } = D.canvasStage(W, H);
    F.body.appendChild(stage);

    // strategy selector
    let strat = 'drift';
    const strats = {
      drift: v => ({ dx: Math.sin(v.t * 3) * 90, dy: 90 }),
      straight: v => ({ dx: 0, dy: 130 }),
      zigzag: v => ({ dx: Math.sign(Math.sin(v.t * 2)) * 120, dy: 100 }),
    };
    F.bar.appendChild(D.seg([
      { label: 'Strategy: sine drift', value: 'drift' },
      { label: 'straight rush', value: 'straight' },
      { label: 'zigzag', value: 'zigzag' },
    ], 'drift', v => { strat = v; }));

    const hud = h('div', 'stage-hud');
    const cScore = h('span', 'hud-chip', ''), cWave = h('span', 'hud-chip', ''),
      cLives = h('span', 'hud-chip', ''), cAlloc = h('span', 'hud-chip good', '');
    hud.append(cScore, cWave, cLives, cAlloc);
    stage.appendChild(hud);

    const feed = D.makeLog(h('div'), 26);
    F.body.appendChild(feed.el);

    const S = {
      player: { x: W / 2 }, bullets: [], freeBullets: [], enemies: [], freeEnemies: [],
      allocB: 0, allocE: 0, score: 0, lives: 3, wave: 1, spawnIn: 0, t: 0, over: false,
    };
    const keys = {};
    const onKey = e => {
      if (['ArrowLeft', 'ArrowRight', 'a', 'd', ' '].includes(e.key)) e.preventDefault();
      keys[e.key.length === 1 ? e.key.toLowerCase() : e.key] = true;
      if (e.key === ' ') tryFire();
    };
    addEventListener('keydown', onKey);

    function tryFire() {
      if (S.over || S.player.cool > 0) return;
      S.player.cool = 0.18;
      const b = S.freeBullets.pop() || (S.allocB++, { trail: [] });
      b.x = S.player.x; b.y = H - 34; b.vy = -520; b.dead = false;
      S.bullets.push(b);
    }
    function spawnEnemy() {
      const e = S.freeEnemies.pop() || (S.allocE++, { t: 0, x: 0, y: 0 });
      e.x = 40 + Math.random() * (W - 80); e.y = -20; e.t = Math.random() * 6; e.hp = S.wave > 2 && Math.random() < .3 ? 2 : 1;
      S.enemies.push(e);
    }

    function reset() {
      S.player = { x: W / 2, cool: 0 };
      S.bullets.forEach(b => S.freeBullets.push(b)); S.bullets.length = 0;
      S.enemies.forEach(e => S.freeEnemies.push(e)); S.enemies.length = 0;
      S.score = 0; S.lives = 3; S.wave = 1; S.spawnIn = 0.6; S.over = false;
      feed.clear(); feed.line('new run — bullets & enemies come from pools', 'sys');
    }

    const stop = D.rafLoop(dt => {
      if (S.over) { paint(); return; }
      S.t += dt;
      if (keys.ArrowLeft || keys.a) S.player.x -= 260 * dt;
      if (keys.ArrowRight || keys.d) S.player.x += 260 * dt;
      S.player.x = Math.max(18, Math.min(W - 18, S.player.x));
      S.player.cool = Math.max(0, S.player.cool - dt);

      S.spawnIn -= dt;
      if (S.spawnIn <= 0) {
        spawnEnemy();
        S.spawnIn = Math.max(0.35, 1.1 - S.wave * 0.06);
      }
      const mv = strats[strat];
      for (const e of S.enemies) {
        e.t += dt;
        const d = mv(e);
        e.x += d.dx * dt; e.y += d.dy * dt;
        if (e.x < 16 || e.x > W - 16) { e.x = Math.max(16, Math.min(W - 16, e.x)); e.t += 1; }
        if (e.y > H - 20) { e.dead = true; S.freeEnemies.push(e); hurt(); }
      }
      for (const b of S.bullets) {
        b.y += b.vy * dt;
        b.trail.push({ x: b.x, y: b.y }); if (b.trail.length > 5) b.trail.shift();
        for (const e of S.enemies) {
          if (e.dead || b.dead) continue;
          if (Math.abs(e.x - b.x) < 16 && Math.abs(e.y - b.y) < 14) {
            e.hp--; b.dead = true;
            if (e.hp <= 0) {
              e.dead = true; S.score += 10 * S.wave;
              feed.line(`<b>kill</b> +${10 * S.wave} (bullet recycled)`, 'out');
              if (S.score >= S.wave * 100) { S.wave++; feed.line(`<span class="hl">wave ${S.wave}</span> — faster spawns`, 'warn'); }
            }
          }
        }
        if (b.y < -10) b.dead = true;
      }
      // recycle
      for (let i = S.bullets.length - 1; i >= 0; i--) if (S.bullets[i].dead) { S.freeBullets.push(S.bullets[i]); S.bullets.splice(i, 1); }
      for (let i = S.enemies.length - 1; i >= 0; i--) if (S.enemies[i].dead) { S.freeEnemies.push(S.enemies[i]); S.enemies.splice(i, 1); }
      paint();

      cScore.innerHTML = `score: <b>${S.score}</b>`;
      cWave.innerHTML = `wave: <b>${S.wave}</b>`;
      cLives.innerHTML = `lives: <b>${S.lives}</b>`;
      cAlloc.innerHTML = `allocations: <b>${S.allocB + S.allocE}</b> · free pool: <b>${S.freeBullets.length + S.freeEnemies.length}</b>`;
    });

    function hurt() {
      S.lives--;
      feed.line('<span class="hl">breach!</span> enemy hit the base', 'err');
      if (S.lives <= 0) {
        S.over = true;
        overlay(stage, `GAME OVER · ${S.score} pts`, '↻ restart', reset);
      }
    }

    function paint() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#090c12'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#16203200';
      // base line
      ctx.strokeStyle = '#233049'; ctx.beginPath(); ctx.moveTo(0, H - 20); ctx.lineTo(W, H - 20); ctx.stroke();
      // player
      ctx.save(); ctx.translate(S.player.x, H - 30);
      ctx.shadowColor = '#4cc9f0'; ctx.shadowBlur = 14; ctx.fillStyle = '#4cc9f0';
      ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(11, 8); ctx.lineTo(-11, 8); ctx.closePath(); ctx.fill();
      ctx.restore();
      // bullets
      ctx.fillStyle = '#80ed99';
      for (const b of S.bullets) ctx.fillRect(b.x - 2, b.y - 8, 4, 12);
      // enemies
      for (const e of S.enemies) {
        ctx.fillStyle = e.hp > 1 ? '#ff9a5d' : '#f72585';
        ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(Math.sin(e.t * 4) * .2);
        ctx.fillRect(-10, -10, 20, 20); ctx.restore();
      }
    }

    feed.line('object pool: bullets/enemies recycle — watch allocations stay flat', 'sys');
    feed.line('strategy: enemy motion swaps live; command: input is fire-on-press', 'sys');
    reset();
    return () => { stop(); removeEventListener('keydown', onKey); };
  }

  /* ============================================================
     GAME 2 — MICRO SOKOBAN
     Memento (undo snapshots) · State (level lifecycle)
     Observer (clear-feed) · Iterator (level sequence)
  ============================================================ */
  const LEVELS = [
    [
      '##########',
      '#        #',
      '#  @ $ . #',
      '#        #',
      '##########',
    ],
    [
      '##########',
      '#   #    #',
      '# $ # $  #',
      '# .   . @#',
      '#   #    #',
      '##########',
    ],
    [
      '##########',
      '#  .  #  #',
      '# $ $ $  #',
      '# . @ .  #',
      '#    #   #',
      '##########',
    ],
  ];

  function sokoban(root, cat) {
    const F = gameFrame('🕹 minigame · micro sokoban', '#80ed99');
    root.appendChild(F.root);

    const TILE = 52, COLS = 10, ROWS = 6;
    const W = COLS * TILE, H = ROWS * TILE;
    const { stage, ctx } = D.canvasStage(W, H);
    F.body.appendChild(stage);

    const hud = h('div', 'stage-hud');
    const cLevel = h('span', 'hud-chip', ''), cMoves = h('span', 'hud-chip', ''), cSnap = h('span', 'hud-chip good', '');
    hud.append(cLevel, cMoves, cSnap);
    stage.appendChild(hud);

    const badges = h('div', 'state-badges');
    const playing = h('span', 'state-badge on', 'playing');
    const won = h('span', 'state-badge', 'cleared');
    badges.append(playing, won);
    F.body.appendChild(badges);

    const feed = D.makeLog(h('div'), 26);
    F.body.appendChild(feed.el);

    const help = h('div', 'small muted');
    help.innerHTML = '← ↑ → ↓ move &amp; push · <b style="color:var(--ink-dim)">Z</b> undo (memento) · <b style="color:var(--ink-dim)">R</b> restart level';
    F.body.appendChild(help);

    let lvl, player, boxes, goals, walls, history, moves, finished;

    function load(i) {
      lvl = i;
      player = { x: 0, y: 0 }; boxes = []; goals = new Set(); walls = new Set();
      history = []; moves = 0; finished = false;
      LEVELS[i].forEach((row, y) => {
        [...row].forEach((ch, x) => {
          const k = x + ',' + y;
          if (ch === '#') walls.add(k);
          else if (ch === '.') goals.add(k);
          else if (ch === '$') boxes.push({ x, y });
          else if (ch === '@') { player = { x, y }; }
        });
      });
      paintHud();
      paint();
    }
    function paintHud() {
      cLevel.innerHTML = `level: <b>${lvl + 1}/${LEVELS.length}</b>`;
      cMoves.innerHTML = `moves: <b>${moves}</b>`;
      cSnap.innerHTML = `undo stack: <b>${history.length}</b>`;
    }
    function snapshot() {
      return JSON.stringify([player.x, player.y, boxes.map(b => [b.x, b.y])]);
    }
    function restore(snap) {
      const [px, py, bx] = JSON.parse(snap);
      player = { x: px, y: py };
      boxes = bx.map(([x, y]) => ({ x, y }));
    }
    function tryMove(dx, dy) {
      if (finished) return;
      const nx = player.x + dx, ny = player.y + dy;
      if (walls.has(nx + ',' + ny)) return;
      const bi = boxes.findIndex(b => b.x === nx && b.y === ny);
      if (bi >= 0) {
        const bx = nx + dx, by = ny + dy;
        if (walls.has(bx + ',' + by) || boxes.some(b => b.x === bx && b.y === by)) return;
        history.push(snapshot()); if (history.length > 200) history.shift();
        boxes[bi] = { x: bx, y: by };
      } else {
        history.push(snapshot());
      }
      player = { x: nx, y: ny };
      moves++;
      if (goals.size && [...goals].every(g => boxes.some(b => b.x + ',' + b.y === g))) clearLevel();
      paintHud(); paint();
    }
    function undo() {
      if (!history.length || finished) return;
      restore(history.pop());
      moves++;
      feed.line('<b>restore()</b> memento — board exactly as before', 'out');
      paintHud(); paint();
    }
    function clearLevel() {
      finished = true;
      playing.classList.remove('on'); won.classList.add('on');
      feed.line(`<span class="hl">level ${lvl + 1} cleared</span> in ${moves} moves`, 'sys');
      setTimeout(() => {
        if (lvl + 1 < LEVELS.length) {
          feed.line('iterator advances to the next level node…', 'in');
          load(lvl + 1);
          playing.classList.add('on'); won.classList.remove('on');
        } else {
          overlay(stage, `ALL ${LEVELS.length} LEVELS CLEARED 🎉`, '↻ play again', () => load(0));
          playing.classList.add('on'); won.classList.remove('on');
        }
      }, 900);
    }

    function paint() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#0b0f16'; ctx.fillRect(0, 0, W, H);
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
        const k = x + ',' + y;
        if (walls.has(k)) {
          ctx.fillStyle = '#1b2336'; ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
          ctx.strokeStyle = '#2b3652'; ctx.strokeRect(x * TILE + 1, y * TILE + 1, TILE - 2, TILE - 2);
        } else {
          ctx.fillStyle = (x + y) % 2 ? '#0e1420' : '#101724';
          ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
        }
        if (goals.has(k)) {
          ctx.fillStyle = 'rgba(247,37,133,.28)';
          ctx.beginPath(); ctx.arc(x * TILE + TILE / 2, y * TILE + TILE / 2, 9, 0, 7); ctx.fill();
          ctx.strokeStyle = '#f72585'; ctx.setLineDash([3, 3]); ctx.stroke(); ctx.setLineDash([]);
        }
      }
      for (const b of boxes) {
        const onGoal = goals.has(b.x + ',' + b.y);
        ctx.fillStyle = onGoal ? '#80ed99' : '#ffd166';
        ctx.beginPath(); ctx.roundRect(b.x * TILE + 8, b.y * TILE + 8, TILE - 16, TILE - 16, 8); ctx.fill();
        ctx.fillStyle = 'rgba(11,14,20,.55)';
        ctx.font = 'bold 11px ui-monospace'; ctx.textAlign = 'center';
        ctx.fillText(onGoal ? '✓' : '▣', b.x * TILE + TILE / 2, b.y * TILE + TILE / 2 + 4);
      }
      ctx.fillStyle = '#4cc9f0';
      ctx.shadowColor = '#4cc9f0'; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.roundRect(player.x * TILE + 10, player.y * TILE + 10, TILE - 20, TILE - 20, 9); ctx.fill();
      ctx.shadowBlur = 0;
    }

    const keymap = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0] };
    const onKey = e => {
      if (keymap[e.key]) { e.preventDefault(); tryMove(...keymap[e.key]); }
      else if (e.key === 'z') undo();
      else if (e.key === 'r') { load(lvl); feed.line('level reset', 'sys'); }
    };
    addEventListener('keydown', onKey);

    load(0);
    feed.line('each move pushes a memento snapshot — undo never loses history', 'sys');
    return () => removeEventListener('keydown', onKey);
  }

  /* ============================================================
     GAME 3 — GRID SNAKE
     Event Queue (input buffering) · Spatial Partition (grid
     occupancy) · Iterator (body traversal)
  ============================================================ */
  function snake(root, cat) {
    const F = gameFrame('🕹 minigame · grid snake', '#80ed99');
    root.appendChild(F.root);

    const CELL = 20, COLS = 24, ROWS = 24, W = COLS * CELL, H = ROWS * CELL;
    const { stage, ctx } = D.canvasStage(W, H);
    F.body.appendChild(stage);

    const hud = h('div', 'stage-hud');
    const cScore = h('span', 'hud-chip', ''), cSpeed = h('span', 'hud-chip', ''),
      cQueue = h('span', 'hud-chip', ''), cBest = h('span', 'hud-chip good', '');
    hud.append(cScore, cSpeed, cQueue, cBest);
    stage.appendChild(hud);

    let wrap = false;
    const wrapBtn = D.btn('walls: lethal', 'toggle on', () => {
      wrap = !wrap;
      wrapBtn.textContent = wrap ? 'walls: wrap' : 'walls: lethal';
      wrapBtn.classList.toggle('on', wrap);
    });
    F.bar.appendChild(wrapBtn);

    const feed = D.makeLog(h('div'), 26);
    F.body.appendChild(feed.el);

    const S = {
      body: [], dir: { x: 1, y: 0 }, pending: [], occ: new Map(),
      food: { x: 5, y: 5 }, score: 0, best: 0, speed: 7, acc: 0, over: false, tick: 0,
    };

    function placeFood() {
      // spatial partition: occupancy is a hash grid; pick an empty cell in O(1)
      for (;;) {
        const x = Math.floor(Math.random() * COLS), y = Math.floor(Math.random() * ROWS);
        if (!S.occ.has(x + ',' + y)) { S.food = { x, y }; return; }
      }
    }
    function rebuildOcc() {
      S.occ.clear();
      S.body.forEach(s => S.occ.set(s.x + ',' + s.y, true));
    }
    function reset() {
      S.body = [{ x: 8, y: 12 }, { x: 7, y: 12 }, { x: 6, y: 12 }];
      S.dir = { x: 1, y: 0 }; S.pending = [];
      S.score = 0; S.speed = 7; S.acc = 0; S.over = false;
      rebuildOcc(); placeFood();
      feed.clear();
      feed.line('inputs enqueue — the snake consumes one direction per tick', 'sys');
      feed.line('food uses grid occupancy: collision checks are O(1)', 'sys');
    }
    function die() {
      S.over = true;
      S.best = Math.max(S.best, S.score);
      overlay(stage, `SNAKE DOWN · ${S.score} pts`, '↻ restart', reset);
    }
    function step() {
      // consume ONE queued input per tick — no missed swipes, no 180° turns
      if (S.pending.length) {
        const nd = S.pending.shift();
        if (!(nd.x === -S.dir.x && nd.y === -S.dir.y)) S.dir = nd;
      }
      const head = S.body[0];
      let nx = head.x + S.dir.x, ny = head.y + S.dir.y;
      if (wrap) { nx = (nx + COLS) % COLS; ny = (ny + ROWS) % ROWS; }
      else if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) return die();
      const ate = nx === S.food.x && ny === S.food.y;
      // self-collision: tail cell frees up unless we grow
      if (!ate && S.occ.has(nx + ',' + ny)) return die();
      S.body.unshift({ x: nx, y: ny });
      S.occ.set(nx + ',' + ny, true);
      if (ate) {
        S.score += 10; S.speed = Math.min(16, S.speed + 0.35);
        feed.line(`<b>nom</b> +10 — speed ${S.speed.toFixed(1)}/s`, 'out');
        placeFood();
      } else {
        const tail = S.body.pop();
        S.occ.delete(tail.x + ',' + tail.y);
      }
      S.tick++;
      cQueue.innerHTML = `queued inputs: <b>${S.pending.length}</b>`;
    }
    function paintHud() {
      cScore.innerHTML = `score: <b>${S.score}</b>`;
      cSpeed.innerHTML = `speed: <b>${S.speed.toFixed(1)}/s</b>`;
      cBest.innerHTML = `best: <b>${S.best}</b>`;
    }
    const onKey = e => {
      const map = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0] };
      if (!map[e.key]) return;
      e.preventDefault();
      if (S.over) return;
      if (S.pending.length < 2) S.pending.push({ x: map[e.key][0], y: map[e.key][1] });
    };
    addEventListener('keydown', onKey);

    const stop = D.rafLoop(dt => {
      if (S.over) { paint(); return; }
      S.acc += dt;
      const interval = 1 / S.speed;
      while (S.acc >= interval) { S.acc -= interval; step(); if (S.over) break; }
      paint(); paintHud();
    });

    function paint() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#0a0e15'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#141b2a';
      for (let x = 0; x <= COLS; x++) { ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, H); ctx.stroke(); }
      for (let y = 0; y <= ROWS; y++) { ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(W, y * CELL); ctx.stroke(); }
      const pulse = 3 + Math.sin(performance.now() / 200) * 1.5;
      ctx.fillStyle = '#f72585'; ctx.shadowColor = '#f72585'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(S.food.x * CELL + CELL / 2, S.food.y * CELL + CELL / 2, pulse, 0, 7); ctx.fill();
      ctx.shadowBlur = 0;
      S.body.forEach((s, i) => {
        const t = 1 - i / Math.max(1, S.body.length);
        ctx.fillStyle = `rgba(${Math.round(76 + 159 * (1 - t))},${Math.round(201 - 100 * (1 - t))},${Math.round(240 - 80 * (1 - t))},1)`;
        const pad = i === 0 ? 2 : 3;
        ctx.beginPath(); ctx.roundRect(s.x * CELL + pad, s.y * CELL + pad, CELL - pad * 2, CELL - pad * 2, 5); ctx.fill();
      });
    }

    reset();
    return () => { stop(); removeEventListener('keydown', onKey); };
  }

  window.GAMES = {
    shooter: {
      title: 'Neon Pool Arena', id: 'shooter',
      tagline: 'A bullet-hell micro-shooter. Bullets and enemies recycle through object pools while enemy motion hot-swaps strategies.',
      patterns: ['object-pool', 'strategy', 'command', 'observer'],
      controls: '← → / A D move · SPACE fire',
      mount: shooter,
    },
    sokoban: {
      title: 'Micro Sokoban', id: 'sokoban',
      tagline: 'A pocket warehouse puzzle. Every move snapshots a memento you can rewind, and levels flow through an iterator.',
      patterns: ['memento', 'state', 'observer', 'iterator'],
      controls: 'arrows / WASD push · Z undo · R restart',
      mount: sokoban,
    },
    snake: {
      title: 'Grid Snake', id: 'snake',
      tagline: 'Classic snake rebuilt as engine internals: inputs buffer in an event queue, food uses a spatial hash grid.',
      patterns: ['event-queue', 'spatial-partition', 'iterator'],
      controls: 'arrows / WASD steer (queued!)',
      mount: snake,
    },
  };
})();
