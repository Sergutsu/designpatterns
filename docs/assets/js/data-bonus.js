/* ============================================================
   data-bonus.js — Game-engine specific patterns (extras)
   ============================================================ */

addPattern({
  id: 'command', name: 'Command', cat: 'bonus', num: '4.1',
  tagline: 'Encapsulate a request as an object — record it, replay it, undo it.',
  intent: 'Encapsulate a request as an object, thereby letting you parameterize clients with different requests, queue or log requests, and support undoable operations. (GoF classic — used in games so hard it earns its own shelf.)',
  gameTitle: 'Input binding, replay systems & undo',
  gameBody: 'Every input becomes an <b>ICommand</b>: <code>MoveCommand(dir)</code>, <code>FireCommand()</code>. The same command objects drive keyboard, gamepad, AI bots, network replication, and demo replays — because pressing a key just <i>executes an object</i>, and objects are recordable. Hold undo? Commands carry their inverse.',
  gameBullets: [
    'Rebind keys by mapping buttons to command objects instead of hard-coded actions.',
    'Replay/demo systems: record the command stream, play it back deterministically.',
    'Undo/redo = pop an executed command, run Undo().',
  ],
  diagram: {
    nodes: [
      { id: 'input', name: 'InputSource', kind: 'client', lane: 0 },
      { id: 'inv', name: 'Invoker', kind: 'context', lane: 1, sub: 'SetCommand / Fire' },
      { id: 'cmd', name: 'ICommand', kind: 'interface', lane: 2, sub: 'Execute() / Undo()' },
      { id: 'c1', name: 'MoveCommand', kind: 'concrete', lane: 3 },
      { id: 'recv', name: 'PlayerEntity', kind: 'subsystem', lane: 3 },
      { id: 'hist', name: 'CommandHistory', kind: 'data', lane: 4 },
    ],
    edges: [
      { from: 'input', to: 'inv', label: 'creates & binds' },
      { from: 'inv', to: 'cmd', label: 'calls Execute()', kind: 'dep' },
      { from: 'c1', to: 'cmd', kind: 'impl' },
      { from: 'c1', to: 'recv', label: 'acts on', kind: 'dep' },
      { from: 'hist', to: 'c1', label: 'stores', kind: 'aggr' },
    ],
  },
  steps: [
    { hi: ['input', 'inv'], text: 'A key press creates a <b>MoveCommand(left)</b> and hands it to the invoker.' },
    { hi: ['inv', 'cmd'], text: 'The invoker only knows <b>ICommand.Execute()</b> — it could be a macro, a network packet, or AI output.' },
    { hi: ['c1', 'recv'], text: 'The command mutates the receiver (player moves left) and pushes itself onto history.' },
    { hi: ['hist', 'c1'], text: 'Undo pops the last command and calls <b>Undo()</b>; replay re-executes the whole recorded stream. Input source is irrelevant downstream.' },
  ],
  demo: 'command',
  code: [
    {
      lang: 'csharp', title: 'Program.cs style (repository)',
      src: [
        'public delegate void RunDesignPatternMethod();   // delegate-as-command!',
        '',
        'RunDesignPatternMethod runner = AdapterProgram.RunAdapter;',
        'runner += BridgeProgram.RunBridge;               // compose',
        'runner += StrategyProgram.RunStrategy;',
        '',
        'foreach (var cmd in runner.GetInvocationList())  // execute all',
        '  cmd.DynamicInvoke(null);',
        '// This repo literally chains commands via delegates —',
        '// the full Command pattern adds receivers, undo and queues.',
      ].join('\n'),
    },
    {
      lang: 'js', title: 'JavaScript port',
      src: [
        'class MoveCommand {',
        '  constructor(actor, dx) { this.actor = actor; this.dx = dx; }',
        '  execute() { this.actor.x += this.dx; history.push(this); }',
        '  undo()   { this.actor.x -= this.dx; }',
        '}',
        '',
        'const keymap = { ArrowLeft: a => new MoveCommand(a, -1) };',
        'addEventListener("keydown", e => {',
        '  const make = keymap[e.key]; if (make) invoker.run(make(player));',
        '});',
      ].join('\n'),
    },
  ],
  related: ['memento', 'chain-of-responsibility', 'event-queue'],
  use: ['Input rebinding, AI-driven actions, network replication.', 'Macro recording and replay demos.', 'Multi-level undo.'],
  pitfalls: ['Commands holding entity refs can outlive them — null-check in Execute.', 'Deep undo of stateful worlds is expensive — combine with Memento.'],
});

addPattern({
  id: 'object-pool', name: 'Object Pool', cat: 'bonus', num: '4.2',
  tagline: 'Recycle bullets instead of spawning garbage 60 times a second.',
  intent: 'Keep a stocked set of initialized objects ready to hand out, rather than repeatedly allocating and destroying expensive ones. (Not one of the 23 GoF patterns — born in game engines.)',
  gameTitle: 'Bullets, particles, enemies & audio voices',
  gameBody: 'Allocating and GC-ing 500 bullets per firefight makes frame times spike. A pool pre-creates N bullets; firing sets one ACTIVE, death returns it to the free list. Zero allocation at runtime, predictable memory — the single most-used “pattern” in realtime games after Component.',
  gameBullets: [
    'Projectiles, damage numbers, particle instances.', 'Zombie hordes: activate/deactivate instead of instantiate/destroy.',
    'Audio voices: fixed pool, steal oldest when exhausted.'],
  diagram: {
    nodes: [
      { id: 'client', name: 'Weapon', kind: 'client', lane: 0 },
      { id: 'pool', name: 'BulletPool', kind: 'instance', lane: 1, sub: 'Get() / Release(b)' },
      { id: 'free', name: 'free list', kind: 'data', lane: 2 },
      { id: 'b1', name: 'Bullet (inactive)', kind: 'concrete', lane: 2 },
      { id: 'b2', name: 'Bullet (active)', kind: 'concrete', lane: 3 },
    ],
    edges: [
      { from: 'client', to: 'pool', label: 'Get() on fire' },
      { from: 'pool', to: 'free', label: 'manages', kind: 'comp' },
      { from: 'b1', to: 'free', label: 'waits in', kind: 'assoc' },
      { from: 'b2', to: 'pool', label: 'Release(b)', kind: 'dep' },
    ],
  },
  steps: [
    { hi: ['pool', 'free'], text: 'At load time the pool builds, say, 128 <b>Bullet</b> objects up front (or grows on demand).' },
    { hi: ['client', 'pool', 'b2'], text: 'Firing calls <b>Get()</b>: one inactive bullet flips ACTIVE — no constructor, no allocation.' },
    { hi: ['b2', 'pool'], text: 'On impact, the bullet isn’t destroyed — it’s <b>Released</b> back into the free list, reset and ready.' },
    { hi: ['client', 'pool'], text: '10 000 shots later: still ~128 objects alive. Frame time stays flat; GC never wakes up.' },
  ],
  demo: 'objectpool',
  code: [
    {
      lang: 'js', title: 'JavaScript port (engine-style)',
      src: [
        'class BulletPool {',
        '  #free = []; #made = 0;',
        '  get() {',
        '    const b = this.#free.pop() ?? this.#spawn();',
        '    b.active = true; return b;',
        '  }',
        '  #spawn() { this.#made++; return { active: false, x: 0, y: 0, vx: 0 }; }',
        '  release(b) { b.active = false; this.#free.push(b); }',
        '}',
        'const pool = new BulletPool(128);          // warm-up at load screen',
      ].join('\n'),
    },
  ],
  related: ['flyweight', 'singleton', 'factory'],
  use: ['Anything spawned in bulk at runtime.', 'When profiler shows GC spikes in combat.', 'Capping concurrency (voices, threads, DB connections).'],
  pitfalls: ['Returned objects must reset ALL state — stale fields are pool-hell bugs.', 'Pool too large = wasted memory; too small = fallback allocation paths.'],
});

addPattern({
  id: 'game-loop', name: 'Game Loop', cat: 'bonus', num: '4.3',
  tagline: 'The heartbeat: process input, update the world, render — forever.',
  intent: 'Decouple the progression of game time from the frame rate of the machine: spin a loop that reads input, advances simulation, and draws, every cycle. (Pascale Capece, “Game Patterns” / Game Engine Architecture.)',
  gameTitle: 'Every realtime game ever made',
  gameBody: 'Naïve loops tie physics to FPS — 144 Hz monitors would run the game 2.4× fast. The fixed-timestep variant accumulates real elapsed time and consumes it in fixed slices (e.g., 60 Hz), rendering once per frame with leftover carried over. Deterministic sim + smooth rendering.',
  gameBullets: [
    'Update Method is the loop’s child: entities tick themselves inside Update().',
    'Fixed timestep keeps replays, netcode, and physics deterministic.',
    'Interpolation between sim states removes visible judder on high-refresh displays.'],
  diagram: {
    nodes: [
      { id: 't', name: 'Time (real dt)', kind: 'data', lane: 0 },
      { id: 'acc', name: 'Accumulator', kind: 'instance', lane: 1, sub: '+= dt' },
      { id: 'inp', name: 'ProcessInput()', kind: 'subsystem', lane: 2 },
      { id: 'upd', name: 'Update(fixedStep)', kind: 'subsystem', lane: 2 },
      { id: 'ren', name: 'Render(alpha)', kind: 'subsystem', lane: 2 },
    ],
    edges: [
      { from: 't', to: 'acc', label: 'feeds', kind: 'dep' },
      { from: 'acc', to: 'inp', label: 'each frame' },
      { from: 'inp', to: 'upd', label: 'while acc >= step' },
      { from: 'upd', to: 'ren', label: 'draw once' },
      { from: 'ren', to: 'acc', label: 'alpha = acc/step', kind: 'dep' },
    ],
  },
  steps: [
    { hi: ['t', 'acc'], text: 'Real elapsed time flows into the <b>accumulator</b> every frame — 16.6 ms, 8.3 ms, whatever the display gives.' },
    { hi: ['inp'], text: '<b>ProcessInput()</b> runs once per frame so controls never feel dropped.' },
    { hi: ['upd'], text: 'While the accumulator covers a fixed step (1/60 s), <b>Update</b> consumes it — physics advances deterministically regardless of FPS.' },
    { hi: ['ren'], text: '<b>Render</b> draws once, using alpha = acc/step to interpolate — motion looks fluid even when sim and refresh rates disagree.' },
  ],
  demo: 'gameloop',
  code: [
    {
      lang: 'js', title: 'JavaScript port',
      src: [
        'const STEP = 1 / 60;                  // fixed simulation slice',
        'let acc = 0, last = performance.now();',
        '',
        'function frame(now) {',
        '  acc += Math.min((now - last) / 1000, 0.25); // clamp spiral of death',
        '  last = now;',
        '',
        '  processInput();                     // once per frame',
        '  while (acc >= STEP) { update(STEP); acc -= STEP; } // fixed slices',
        '  render(acc / STEP);                // interpolated draw',
        '  requestAnimationFrame(frame);',
        '}',
      ].join('\n'),
    },
  ],
  related: ['component', 'command', 'event-queue'],
  use: ['Every realtime game and tool with animation.', 'Deterministic simulations (replays, lockstep netcode).', 'Benchmarking harnesses.'],
  pitfalls: ['Variable timestep → nondeterminism; fix the step.', 'Huge dt after a stall: clamp it or you simulate a week in one frame.', 'Don’t do gameplay logic in Render — it varies with FPS.'],
});

addPattern({
  id: 'component', name: 'Component / ECS', cat: 'bonus', num: '4.4',
  tagline: 'Compose entities from reusable behavior blocks instead of deep inheritance trees.',
  intent: 'Composition over inheritance: an entity is just an ID; data lives in components (Position, Velocity, Sprite…); systems iterate matching entities each tick. (Power of Patterns / Unity’s script model.)',
  gameTitle: 'Modern game architecture (Unity, Unreal, Bevy, Flecs)',
  gameBody: '“Is-a” hierarchies rot: <code>FlyingEnemy</code> vs <code>ShootingEnemy</code> vs <code>FlyingShootingBoss</code> explodes combinatorially. ECS: give the entity [Position, Velocity, Winged, Cannon] — a MovementSystem and WeaponSystem do the rest. Cache-friendly, data-oriented, trivially serializable.',
  gameBullets: [
    'Add behavior by attaching components — no new classes, designers can mix them in editors.',
    'Systems iterate tight arrays of component data: great cache locality.',
    'Serialization/Replays come free: entity = bag of plain data.'],
  diagram: {
    nodes: [
      { id: 'ent', name: 'Entity (id)', kind: 'data', lane: 0 },
      { id: 'c1', name: 'Position', kind: 'concrete', lane: 1 },
      { id: 'c2', name: 'Velocity', kind: 'concrete', lane: 1 },
      { id: 'c3', name: 'Sprite', kind: 'concrete', lane: 1 },
      { id: 'sys', name: 'MovementSystem', kind: 'subsystem', lane: 2, sub: 'iterates (Pos,Vel)' },
      { id: 'sys2', name: 'RenderSystem', kind: 'subsystem', lane: 2 },
    ],
    edges: [
      { from: 'ent', to: 'c1', label: 'has', kind: 'comp' },
      { from: 'ent', to: 'c2', label: 'has', kind: 'comp' },
      { from: 'ent', to: 'c3', label: 'has', kind: 'comp' },
      { from: 'sys', to: 'c1', label: 'reads/writes', kind: 'dep' },
      { from: 'sys', to: 'c2', label: 'reads', kind: 'dep' },
      { from: 'sys2', to: 'c3', label: 'draws', kind: 'dep' },
    ],
  },
  steps: [
    { hi: ['ent', 'c1', 'c2', 'c3'], text: 'An entity is a tiny id with attached data: <b>Position</b>, <b>Velocity</b>, <b>Sprite</b>.' },
    { hi: ['sys', 'c1', 'c2'], text: 'Each tick, <b>MovementSystem</b> scans for entities having both Position+Velocity and integrates them.' },
    { hi: ['sys2', 'c3'], text: '<b>RenderSystem</b> separately walks Sprite components. No system knows the entity “type”.' },
    { hi: ['ent', 'c1'], text: 'Make it fly? Attach a <i>Winged</i> marker component. New behavior = data + maybe one new system; zero hierarchy surgery.' },
  ],
  demo: 'component',
  code: [
    {
      lang: 'js', title: 'JavaScript port',
      src: [
        'const world = { nextId: 1, pos: new Map(), vel: new Map() };',
        '',
        'const spawn = () => {',
        '  const id = world.nextId++;',
        '  world.pos.set(id, { x: rand(800), y: rand(200) });',
        '  world.vel.set(id, { vx: 1 + Math.random(), vy: 0 });',
        '};',
        '',
        'function movementSystem(dt) {                    // no entity types!',
        '  for (const [id, p] of world.pos)',
        '    if (world.vel.has(id)) { p.x += world.vel.get(id).vx * dt; }',
        '}',
      ].join('\n'),
    },
  ],
  related: ['game-loop', 'flyweight', 'observer'],
  use: ['Anything with many heterogeneous interactive objects.', 'Data-oriented performance-critical cores.', 'Designer-driven content (attach behaviors visually).'],
  pitfalls: ['Cross-system communication needs care (events/queues, not random Map writes).', 'Over-fragmenting into micro-components costs indirection; group cohesive data.'],
});

addPattern({
  id: 'spatial-partition', name: 'Spatial Partition', cat: 'bonus', num: '4.5',
  tagline: 'Don’t test everyone against everyone — bin the world into cells.',
  intent: 'Organize spatial data (grid, quadtree, octree, BVH) so queries like “what’s near X?” and collision broad-phases touch only a tiny subset of entities.',
  gameTitle: 'Collision detection, radar queries & AI sensing',
  gameBody: 'N² pairwise collision checks murder frame time at 1 000 entities (≈500 K pairs/frame). A uniform grid buckets entities per cell; tests happen only within a cell and its neighbors. Same trick powers fog-of-war reveals, radars, and “enemies within earshot” events.',
  gameBullets: [
    'Broad-phase collision: uniform grid for uniform densities, quadtree for sparse worlds.',
    'Proximity queries: AI senses, loot magnetism, AoE heals.',
    'Rendering culling: only submit cells in view.'],
  diagram: {
    nodes: [
      { id: 'q', name: 'Query(x, radius)', kind: 'client', lane: 0 },
      { id: 'grid', name: 'UniformGrid', kind: 'instance', lane: 1, sub: 'cell -> entities[]' },
      { id: 'c_a', name: 'cell (2,1)', kind: 'data', lane: 2 },
      { id: 'c_b', name: 'cell (2,2)', kind: 'data', lane: 2 },
      { id: 'e', name: 'entities', kind: 'concrete', lane: 3 },
    ],
    edges: [
      { from: 'q', to: 'grid', label: 'asks nearby' },
      { from: 'grid', to: 'c_a', label: 'selects few cells', kind: 'dep' },
      { from: 'grid', to: 'c_b', kind: 'dep' },
      { from: 'c_a', to: 'e', label: 'tests only these', kind: 'dep' },
    ],
  },
  steps: [
    { hi: ['grid'], text: 'Every moving entity is registered into grid cells by position — rebuilt/cheaply updated each tick.' },
    { hi: ['q', 'grid'], text: '“What’s within radius R of X?” visits only X’s cell and immediate neighbors.' },
    { hi: ['c_a', 'c_b', 'e'], text: 'Candidate set shrinks from 1 000 entities to ~8; precise (expensive) narrow-phase runs only on those.' },
    { hi: ['q'], text: 'Frame cost scales with density, not total count. 100× more entities, ~same per-frame work.' },
  ],
  demo: 'spatial',
  code: [
    {
      lang: 'js', title: 'JavaScript port',
      src: [
        'class Grid {',
        '  constructor(cell = 64) { this.cell = cell; this.map = new Map(); }',
        '  key(x, y) { return ((x / this.cell) | 0) + ":" + ((y / this.cell) | 0); }',
        '  insert(e) { const k = this.key(e.x, e.y); (this.map.get(k) ?? this.map.set(k, []).get(k)).push(e); }',
        '  nearby(x, y, r) {',
        '    const out = [];',
        '    for (let cx = ((x-r)/this.cell|0); cx <= ((x+r)/this.cell|0); cx++)',
        '      for (let cy = ((y-r)/this.cell|0); cy <= ((y+r)/this.cell|0); cy++)',
        '        out.push(...(this.map.get(cx+":"+cy) || []));',
        '    return out;',
        '  }',
        '}',
      ].join('\n'),
    },
  ],
  related: ['flyweight', 'object-pool', 'game-loop'],
  use: ['Collision broad-phase & proximity triggers.', 'AI senses, AoE queries, minimap scans.', 'Streaming/culling of world chunks.'],
  pitfalls: ['Uniform grid wastes space when entities cluster — use quadtree/hierarchical grids.', 'Fast movers skip cells between ticks — sweep or enlarge bounds.'],
});

addPattern({
  id: 'event-queue', name: 'Event Queue', cat: 'bonus', num: '4.6',
  tagline: 'Post events now, dispatch them calmly at the top of the next frame.',
  intent: 'A ring buffer decoupling event producers from consumers: anyone may enqueue at any time; a dispatcher drains the queue once per frame/tick. (Pattern popularized by “Game Programming Patterns”, Nystrom.)',
  gameTitle: 'Deferred reactions without infinite recursion',
  gameBody: '“Play sound” inside the middle of a physics callback re-enters the audio engine mid-update — a classic corruption bug. Instead, post it to the queue; the dispatcher plays all pending sounds at a safe point. Also doubles as a one-frame debouncer and a neat log.',
  gameBullets: [
    'Never mutate shared state inside another system’s update — enqueue instead.',
    'Merge duplicate posts per tick (e.g., 40 “footstep” events → one).',
    'Ring buffer = fixed memory, zero allocation per event.',
  ],
  diagram: {
    nodes: [
      { id: 'p1', name: 'PhysicsSystem', kind: 'subsystem', lane: 0 },
      { id: 'p2', name: 'WeaponSystem', kind: 'subsystem', lane: 0 },
      { id: 'q', name: 'EventQueue', kind: 'instance', lane: 1, sub: 'ring buffer' },
      { id: 'd', name: 'Dispatcher', kind: 'context', lane: 2, sub: 'drain per tick' },
      { id: 'c1', name: 'AudioSystem', kind: 'subsystem', lane: 3 },
      { id: 'c2', name: 'UISystem', kind: 'subsystem', lane: 3 },
    ],
    edges: [
      { from: 'p1', to: 'q', label: 'post', kind: 'dep' },
      { from: 'p2', to: 'q', label: 'post', kind: 'dep' },
      { from: 'd', to: 'q', label: 'drains', kind: 'assoc' },
      { from: 'd', to: 'c1', label: 'routes', kind: 'dep' },
      { from: 'd', to: 'c2', label: 'routes', kind: 'dep' },
    ],
  },
  steps: [
    { hi: ['p1', 'q'], text: 'Mid-physics, a hit lands — instead of touching audio directly, the system <b>posts</b> <i>HitSound</i>.' },
    { hi: ['p2', 'q'], text:'The weapon system also posts <i>MuzzleFlash</i> the same way. Producers stay independent.' },
    { hi: ['d', 'q'], text:'Once per tick the <b>Dispatcher</b> drains everything queued so far — at a known-safe moment.' },
    { hi: ['d', 'c1', 'c2'], text:'Events route to subscribers in order; re-entrancy is gone, duplicates mergeable, ordering explicit.' },
  ],
  demo: 'eventqueue',
  code: [
    {
      lang: 'js', title: 'JavaScript port',
      src: [
        'class EventQueue {',
        '  #buf = []; #head = 0;',
        '  post(type, data) { this.#buf.push({ type, data }); }',
        '  drain(dispatch) {',
        '    const batch = this.#buf.splice(0);   // atomic-ish swap',
        '    for (const ev of batch) dispatch(ev.type, ev.data);',
        '    return batch.length;',
        '  }',
        '}',
        '// physics.post(Hit) ─▶ queue ─▶ dispatcher ─▶ audio.play(hit)',
      ].join('\n'),
    },
  ],
  related: ['observer', 'mediator', 'command'],
  use: ['Cross-system notifications during updates.', 'Debouncing/merging repeated events per frame.', 'Deterministic logging of what happened this tick.'],
  pitfalls: ['One-frame latency: don’t use for input that must react instantly.', 'Cyclical post/dispatch storms: dispatch once per tick, never recursively.'],
});
