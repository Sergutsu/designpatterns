/* ============================================================
   data-extra-b.js — GDScript ports + genre tags
   (behavioral + game-engine patterns)
   ============================================================ */

Object.assign(window.PATTERN_EXTRA, {

  /* ---------------- BEHAVIORAL ---------------- */
  'chain-of-responsibility': {
    genres: [
      'RPG · dialogue privilege checks (charisma gates per line)',
      'Roguelike · damage pipeline: armor → resist → shield → HP',
      'Fighting · hit-confirm chain: light → heavy → special',
      'Strategy · tech unlock escalation per era',
    ],
    gd: { title: 'Godot 4 · Chain of Responsibility', src: [
      'class_name ApprovalHandler:',
      '    var _next: ApprovalHandler = null',
      '    var limit := 0.0',
      '    func set_next(h: ApprovalHandler) -> void: _next = h',
      '',
      '    func approve(amount: float) -> bool:',
      '        if amount <= limit:',
      '            print("%s approved" % name); return true',
      '        return _next != null and _next.approve(amount) # escalate',
      '',
      '# var chain := Manager.new(); chain.set_next(Director.new())',
    ].join('\n') },
  },

  iterator: {
    genres: [
      'Rhythm · playlist/chart traversal modes',
      'Card battler · deck draw order, discard reshuffle',
      'Survival · crafting queue pagination',
      'MMO · inventory “show only” filtered views',
    ],
    gd: { title: 'Godot 4 · Iterator', src: [
      'class_name Playlist:',
      '    var _tracks: Array[String] = []',
      '    var _cursor := -1',
      '',
      '    func move_next() -> bool:',
      '        _cursor += 1',
      '        return _cursor < _tracks.size()',
      '    func current() -> String:',
      '        return _tracks[_cursor] if _cursor < _tracks.size() else ""',
      '',
      '# for track in PlaylistIterator.new(playlist): play(track)',
    ].join('\n') },
  },

  mediator: {
    genres: [
      'MMO · zone chat channels route through the hub',
      'Social sim · Sims-style interaction routing between agents',
      'Party games · lobby matches players to rooms',
      'Async multiplayer · turn broker between remote clients',
    ],
    gd: { title: 'Godot 4 · Mediator', src: [
      'class_name ChatHub:',
      '    var _room: Array[ChatPerson] = []',
      '',
      '    func send(from: ChatPerson, msg: String) -> void:',
      '        for p in _room:                          # hub knows everyone…',
      '            if p != from: p.receive("%s: %s" % [from.name, msg])',
      '',
      'class_name ChatPerson:',
      '    var name := ""',
      '    func say(hub: ChatHub, msg: String) -> void:',
      '        hub.send(self, msg)                     # …peers know nobody',
    ].join('\n') },
  },

  memento: {
    genres: [
      'Platformer · checkpoint quick-saves',
      'Puzzle · unlimited undo (Sokoban-likes)',
      'Strategy · tactical undo of a move',
      'RPG · reload-from-decision branching saves',
    ],
    gd: { title: 'Godot 4 · Memento', src: [
      'class_name ResultsCache:',
      '    var value := 0.0                           # dumb snapshot',
      '',
      'class_name SimpleCalculator:',
      '    var _memory := 0.0',
      '    func save() -> ResultsCache:',
      '        var m := ResultsCache.new(); m.value = _memory; return m',
      '    func restore(m: ResultsCache) -> void: _memory = m.value',
      '',
      '# var history: Array[ResultsCache] = []       # caretaker stack',
    ].join('\n') },
  },

  observer: {
    genres: [
      'Battle Royale · ring-timer & kill-feed push',
      'MOBA · objective towers announce themselves',
      'Sports · score tickers & stat overlays',
      'Idle/incremental · resource counters auto-refresh',
    ],
    gd: { title: 'Godot 4 · Observer', src: [
      'class_name Stock extends RefCounted:',
      '    signal price_changed(new_price: float)',
      '',
      '    var price := 0.0:',
      '        set(value):',
      '            price = value                      # Godot signals = built-in!',
      '            price_changed.emit(value)',
      '',
      'class_name Investor:',
      '    func on_price(p: float) -> void: print("alert @", p)',
      '',
      '# stock.price_changed.connect(investor.on_price)',
      '# stock.price_changed.disconnect(investor.on_price)',
    ].join('\n') },
  },

  state: {
    genres: [
      'Fighting · character states: idle/walk/attack/hit/block',
      'Stealth · guard AI: patrol → suspicious → chase → search',
      'Racing · handling modes: grip / drift / wet',
      'Onboarding · tutorial steps as discrete states',
    ],
    gd: { title: 'Godot 4 · State', src: [
      'class_name BronzeState:',
      '    func deposit(account: Account, _amount: float) -> void:',
      '        if account.balance > 50_000: account.state = SilverState.new()',
      '',
      'class_name Account:',
      '    var balance := 0.0',
      '    var state: Object = BronzeState.new()       # hot-swappable',
      '    func deposit(amount: float) -> void:',
      '        balance += amount',
      '        state.deposit(self, amount)             # delegate!',
    ].join('\n') },
  },

  strategy: {
    genres: [
      'Racing · AI driving styles: cautious / balanced / aggressive',
      'FPS · bot behaviors: camper / rusher / flanker',
      'RPG · combat stances swap mid-fight',
      'Puzzle · solver backends (BFS vs A* vs greedy)',
    ],
    gd: { title: 'Godot 4 · Strategy', src: [
      'class_name Vehicle:',
      '    var engine_logic: EngineLogic              # has-a, swappable',
      '    func start() -> void: engine_logic.run()',
      '',
      'class_name RunningLogic:',
      '    func run() -> void: print("vroom on asphalt")',
      'class_name FlyingLogic:',
      '    func run() -> void: print("cleared for takeoff")',
      '',
      '# vehicle.engine_logic = FlyingLogic.new()     # cartridge swap',
    ].join('\n') },
  },

  'template-method': {
    genres: [
      'Roguelike · map-gen recipe: border → scatter → connect → populate',
      'Strategy · battle resolution: roll → crit → mitigate → apply',
      'JRPG · turn-order ceremony with per-job tiebreakers',
      'Audio · DSP chains: capture → filter → encode',
    ],
    gd: { title: 'Godot 4 · Template Method', src: [
      'class_name EncryptionAlgorithm:',
      '    func encrypt_text(plain: String) -> String:  # sealed recipe',
      '        var validated := validate(plain)',
      '        return Marshalls.raw_to_base64(_encrypt(validated))',
      '    func validate(s: String) -> String: return s',
      '    func _encrypt(s: String) -> PackedByteArray: return PackedByteArray()',
      '',
      'class_name RsaEncryption extends EncryptionAlgorithm:',
      '    func _encrypt(s: String) -> PackedByteArray:',
      '        return s.to_utf8_buffer()               # deferred step only',
    ].join('\n') },
  },

  visitor: {
    genres: [
      'MMO · cloud save/export passes over the character tree',
      'Sandbox · debug inspector walks every entity type',
      'Simulation · report generators (CSV / JSON / charts)',
      'Narrative · dialogue compilers to multiple runtimes',
    ],
    gd: { title: 'Godot 4 · Visitor', src: [
      'class_name XmlVisitor:',
      '    func visit_employee(e: Employee) -> String:',
      '        return "<employee name=\\"%s\\"/>" % e.name',
      '    func visit_address(a: Address) -> String:',
      '        return "<address city=\\"%s\\"/>" % a.city',
      '',
      '# new operation? write another visitor; element classes untouched.',
      '# var xml: String = node.accept(XmlVisitor.new())',
    ].join('\n') },
  },

  /* ---------------- GAME-ENGINE PATTERNS ---------------- */
  command: {
    genres: [
      'Fighting · input buffers store commands for frames ahead',
      'RTS · unit orders recorded into replays',
      'Rhythm · note streams are timed command queues',
      'Action · combo macros = sequences of command objects',
    ],
    gd: { title: 'Godot 4 · Command', src: [
      'class_name MoveCommand:',
      '    var actor: Node2D',
      '    var dir := Vector2.ZERO',
      '    func execute() -> void: actor.position += dir',
      '    func undo() -> void: actor.position -= dir',
      '',
      'var history: Array[MoveCommand] = []            # undo = pop + undo()',
      'func _unhandled_input(event: InputEvent) -> void:',
      '    if event.is_action_pressed("move_right"):',
      '        var cmd := MoveCommand.new()             # rebindable object!',
      '        cmd.actor = player; cmd.dir = Vector2.RIGHT',
      '        cmd.execute(); history.append(cmd)',
    ].join('\n') },
  },

  'object-pool': {
    genres: [
      'Shooters · bullet tracers recycled by the hundreds',
      'Horde survival · zombies activate/deactivate offscreen',
      'Action RPG · damage-number sprites',
      'Mobile · pooled audio voices; steal oldest when full',
    ],
    gd: { title: 'Godot 4 · Object Pool', src: [
      'class_name BulletPool:',
      '    var _free: Array[Bullet] = []',
      '    var _made := 0',
      '',
      '    func get_bullet() -> Bullet:',
      '        if not _free.is_empty(): return _free.pop_back()  # recycle',
      '        _made += 1                                # count allocations!',
      '        return Bullet.new()',
      '',
      '    func release(b: Bullet) -> void:',
      '        b.hide(); b.position = Vector2.ZERO',
      '        _free.append(b)                           # reset & restock',
    ].join('\n') },
  },

  'game-loop': {
    genres: [
      'Racing · fixed physics Hz decoupled from render Hz',
      'Fighting · deterministic rollback netcode',
      'Rhythm · judgement windows need exact sim time',
      'Simulation · pause/slow-mo without breaking integration',
    ],
    gd: { title: 'Godot 4 · Game Loop (fixed step)', src: [
      'const STEP := 1.0 / 60.0                          # one sim slice',
      'var acc := 0.0                                    # accumulator',
      '',
      '# Godot already separates render (_process) from fixed-rate',
      '# physics (_physics_process); this is the explicit pattern:',
      'func _process(delta: float) -> void:',
      '    acc += delta',
      '    while acc >= STEP:',
      '        update_world(STEP)                        # deterministic sim',
      '        acc -= STEP',
      '    render(acc / STEP)                            # interpolated draw',
      '',
      '# built-in knob: Engine.physics_ticks_per_second = 60',
    ].join('\n') },
  },

  component: {
    genres: [
      'ARPG · designers mix components on entities in the editor',
      'Sandbox survival · crafting + health + inventory tags',
      'Physics playgrounds · rigid-body + explode on demand',
      'MMO · ten-thousand-entity worlds need data-oriented layout',
    ],
    gd: { title: 'Godot 4 · Component (composition)', src: [
      '# Godot IS composition: an Actor is a Node with component Nodes.',
      '# No FlyingEnemy vs ShootingEnemy inheritance rot:',
      'func spawn_enemy(kind: String) -> Node2D:',
      '    var actor := Node2D.new()',
      '    actor.add_child(SpriteComponent.new(kind))',
      '    actor.add_child(HealthComponent.new(60))',
      '    if kind == "flyer": actor.add_child(FlyingComponent.new())',
      '    return actor                                # behavior = parts',
      '',
      '# systems iterate groups: get_tree().get_nodes_in_group("movers")',
    ].join('\n') },
  },

  'spatial-partition': {
    genres: [
      'Battle Royale · collision broad-phase & radar queries',
      'RTS · thousands of units picking nearby targets',
      'Open world · loot magnetism & chunk culling',
      'Brawler · crowd-wide attack hit detection',
    ],
    gd: { title: 'Godot 4 · Spatial Partition', src: [
      'var grid := {}                                   # Vector2i -> Array',
      '',
      'func key_for(pos: Vector2, cell := 64.0) -> Vector2i:',
      '    return Vector2i(floori(pos.x / cell), floori(pos.y / cell))',
      '',
      'func insert(e: Node2D) -> void:',
      '    grid.get_or_add(key_for(e.position), []).append(e)  # Godot 4.3+',
      '',
      'func nearby(pos: Vector2, radius_cells := 1) -> Array:',
      '    var out := []; var c := key_for(pos)',
      '    for d in [Vector2i(0,0), Vector2i(1,0), Vector2i(-1,0),',
      '              Vector2i(0,1), Vector2i(0,-1)]:',
      '        out.append_array(grid.get(c + d, []))     # test 5 cells, not N²',
      '    return out',
    ].join('\n') },
  },

  'event-queue': {
    genres: [
      'Battle Royale · zone events deferred to end of frame',
      'Fighting · hitstop/hitspark chains dispatched safely',
      'Strategy · post-battle result fan-out to UI/log/stats',
      'Party games · multi-system reactions without recursion',
    ],
    gd: { title: 'Godot 4 · Event Queue', src: [
      'var _queue: Array[Dictionary] = []               # ring/array buffer',
      '',
      'func post(type: String, data: Variant) -> void:',
      '    _queue.append({"type": type, "data": data})  # post from ANYWHERE',
      '',
      'func _process(_delta: float) -> void:',
      '    if _queue.is_empty(): return',
      '    var batch := _queue.duplicate()               # atomic-ish swap',
      '    _queue.clear()',
      '    for ev in batch: dispatch(ev.type, ev.data)   # safe drain point',
      '',
      '# physics.post(HitSound) ─▶ queue ─▶ dispatcher ─▶ audio',
    ].join('\n') },
  },
});
