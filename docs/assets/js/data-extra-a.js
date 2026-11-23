/* ============================================================
   data-extra-a.js — GDScript ports + genre tags
   (creational + structural patterns)
   ============================================================ */
window.PATTERN_EXTRA = window.PATTERN_EXTRA || {};

Object.assign(window.PATTERN_EXTRA, {

  /* ---------------- CREATIONAL ---------------- */
  'abstract-factory': {
    genres: [
      'Cross-platform action · themed control prompts (console icons per platform)',
      'RTS · faction asset families (units/buildings/VFX per race)',
      'Live-service · seasonal event UI kits',
      'Fighting · character-skin widget sets per season',
    ],
    gd: { title: 'Godot 4 · Abstract Factory', src: [
      'class_name ControlFactory',
      'func create_button() -> Button:',
      '    return Button.new()                       # default family',
      '',
      'class_name FantasyFactory extends ControlFactory:',
      '    func create_button() -> Button:',
      '        var b := Button.new()',
      '        b.modulate = Color.GOLD               # matching set…',
      '        return b',
      '    func create_label() -> Label:',
      '        return Label.new()                    # …always fantasy',
      '',
      'func build_ui(factory: ControlFactory) -> void:',
      '    add_child(factory.create_button())        # client: interface only',
    ].join('\n') },
  },

  builder: {
    genres: [
      'MMO/FPS · character creators (appearance → gear → skills)',
      'Roguelike · procedural dungeon assembly from biome recipes',
      'Strategy · base/ship loadout configurators',
      'Narrative · branching dialogue construction',
    ],
    gd: { title: 'Godot 4 · Builder', src: [
      'class_name HeroBuilder:',
      '    var hero := {}',
      '    func build_base(cls: String) -> void: hero["class"] = cls',
      '    func build_gear(tier: String) -> void: hero["gear"] = tier',
      '    func build_talents(points: int) -> void: hero["talents"] = points',
      '    func result() -> Dictionary: return hero',
      '',
      'func construct(b: HeroBuilder, cfg: Dictionary) -> Dictionary:',
      '    b.build_base(cfg.cls)                     # fixed recipe (Director)',
      '    b.build_gear(cfg.tier)',
      '    b.build_talents(cfg.points)',
      '    return b.result()',
    ].join('\n') },
  },

  factory: {
    genres: [
      'Wave shooter · data-driven spawn tables (prefab keys)',
      'MMO · mob/item catalogs behind ids from the server',
      'Card game · card instances keyed by database id',
      'Loot-driven · enemy/elite variants from config',
    ],
    gd: { title: 'Godot 4 · Factory', src: [
      'class_name CarFactory:',
      '    const CATALOG := {"santro": Santro, "verna": Verna}',
      '    var _cache := {}',
      '    func get_car(key: String) -> Car:',
      '        if not _cache.has(key):',
      '            _cache[key] = CATALOG[key].new()   # decide here, once',
      '        return _cache[key]',
      '',
      '# client never touches Santro/Verna directly:',
      '# var ride: Car = factory.get_car(selected_key)',
    ].join('\n') },
  },

  prototype: {
    genres: [
      'Prefab shooters · archetype clones with per-instance overrides',
      'Base builder · cloned structures (duplicate & retint)',
      'Tower defense · tower variants from a master spec',
      'Creature collector · breeding tints/stats onto copies',
    ],
    gd: { title: 'Godot 4 · Prototype', src: [
      'const skeleton_archer := {',
      '    "hp": 60, "weapon": "shortbow",',
      '    "pos": Vector2.ZERO,                     # nested — watch out!',
      '}',
      '',
      'func spawn_archer(x: float, y: float) -> Dictionary:',
      '    var copy := skeleton_archer.duplicate(true)  # DEEP clone',
      '    copy["pos"] = Vector2(x, y)',
      '    copy["ai_state"] = "kite"                 # mutate freely',
      '    return copy                                # archetype intact',
    ].join('\n') },
  },

  singleton: {
    genres: [
      'Every genre · audio buses (one mixer, many emitters)',
      'Platformer · persistent save/profile service',
      'Mobile · IAP/analytics gateway',
      'MMO · server session & settings registry',
    ],
    gd: { title: 'Godot 4 · Singleton (autoload)', src: [
      '# ProjectSettings → Autoload: register this script as `Game`',
      '# Godot hands you the one instance globally — no boilerplate:',
      'extends Node',
      'var save_slot := 0',
      'var master_volume := 0.8',
      '',
      'func save_game(path: String) -> void:',
      '    ResourceSaver.save(build_snapshot(), path)',
      '',
      '# anywhere:  Game.master_volume = 0.5',
    ].join('\n') },
  },

  /* ---------------- STRUCTURAL ---------------- */
  adapter: {
    genres: [
      'FPS · third-party anti-cheat / voice-chat SDK wrappers',
      'RPG · importing legacy save files into new engines',
      'Mobile · store SDK adapters (iOS/Android billing)',
      'Simulation · steering-wheel/peripheral driver shims',
    ],
    gd: { title: 'Godot 4 · Adapter', src: [
      '# GDScript has no interfaces — a named contract class + docs/tests',
      'class_name IRemoteDesktop',
      '    func connect(_host: String) -> void: pass',
      '    func send_input(_key: Key) -> void: pass',
      '',
      'class RealVncSdk:                              # legacy vendor API',
      '    func open(host: String, port: int) -> void: pass',
      '    func inject_event(scancode: int) -> void: pass',
      '',
      'class VncRemoteDesktopAdapter:                 # speaks YOUR dialect',
      '    var _vnc := RealVncSdk.new()',
      '    func connect(host: String) -> void: _vnc.open(host, 5900)',
      '    func send_input(key: Key) -> void: _vnc.inject_event(key)',
    ].join('\n') },
  },

  bridge: {
    genres: [
      'Cross-platform engines · one input abstraction over KB/pad/touch',
      'VR · device-agnostic hand/controller implementations',
      'Racing · swappable physics backends (arcade/sim)',
      'Console ports · platform services (achievements/trophies)',
    ],
    gd: { title: 'Godot 4 · Bridge', src: [
      'class_name Television:',
      '    func on_off() -> void: pass',
      '    func set_channel(ch: int) -> void: pass',
      '',
      'class_name RemoteControl:',
      '    var _tv: Television',
      '    func set_television(tv: Television) -> void: _tv = tv  # the seam',
      '    func toggle_power() -> void: _tv.on_off()             # delegates',
      '',
      'class_name SonyTv extends Television:',
      '    func on_off() -> void: print("bravia standby")',
    ].join('\n') },
  },

  composite: {
    genres: [
      'Open world · scene graphs (transform/cull/draw recurse)',
      'RPG · skill trees & guild org charts',
      'Deck-builder · UI panels treating widgets like containers',
      'Strategy · army → squad → unit hierarchies',
    ],
    gd: { title: 'Godot 4 · Composite', src: [
      'class_name Employee:',
      '    func get_cost() -> float: return 0.0',
      '',
      'class_name Leaf extends Employee:',
      '    var rate := 0.0',
      '    func get_cost() -> float: return rate      # base case',
      '',
      'class_name Branch extends Employee:',
      '    var children: Array[Employee] = []',
      '    func add(child: Employee) -> void: children.append(child)',
      '    func get_cost() -> float:',
      '        var total := 0.0',
      '        for c in children: total += c.get_cost() # recursion',
      '        return total',
    ].join('\n') },
  },

  decorator: {
    genres: [
      'ARPG · item affix stacks (Diablo-like legendary rolls)',
      'Battle Royale · buffs stacking on weapons/armor',
      'Shooter · attachment stacks: sight + grip + mag mods',
      'Idle/incremental · multiplicative bonus layers',
    ],
    gd: { title: 'Godot 4 · Decorator', src: [
      'class_name Pizza:',
      '    func description() -> String: return "Margherita"',
      '    func cost() -> float: return 8.0',
      '',
      'class_name ToppingDecorator extends Pizza:',
      '    var _inner: Pizza',
      '    func _init(inner: Pizza) -> void: _inner = inner',
      '',
      'class_name ExtraCheese extends ToppingDecorator:',
      '    func description() -> String: return _inner.description() + " + cheese"',
      '    func cost() -> float: return _inner.cost() + 2.5',
      '',
      '# var order := ExtraCheese.new(with_soya(Margherita.new()))',
    ].join('\n') },
  },

  facade: {
    genres: [
      'Live-ops · “start match”: lobby → loadout → server → spawn',
      'MMO · zone bootstrap (terrain + NPCs + quests)',
      'Mobile F2P · checkout: catalog → receipt validation → grant',
      'Roguelike · run init: seed → modifiers → party',
    ],
    gd: { title: 'Godot 4 · Facade', src: [
      'class_name OrderFacade:',
      '    var _catalog := Catalog.new()',
      '    var _payments := PaymentGateway.new()',
      '    var _inventory := InventoryService.new()',
      '',
      '    func buy_lootbox(account: Account, box: Item) -> Array[Item]:',
      '        _catalog.reserve(box)                  # step 1',
      '        var receipt := _payments.charge(account, box.price)  # 2',
      '        var drops := _roll(box)',
      '        return _inventory.grant_all(account, drops)          # 3',
      '',
      '# client: var drops = facade.buy_lootbox(me, lootbox)',
    ].join('\n') },
  },

  flyweight: {
    genres: [
      'Open world · forests/rocks share meshes; transforms differ',
      'RTS · thousands of units, one model + material',
      'MMO · nameplates/chat bubbles over instanced avatars',
      'Sandbox · voxel terrain chunks sharing textures',
    ],
    gd: { title: 'Godot 4 · Flyweight', src: [
      'class_name TreeFactory:',
      '    static var _mesh_cache := {}                # intrinsic: shared',
      '',
      '    static func tree(species: String, pos: Vector3, scale: float) -> Node3D:',
      '        if not _mesh_cache.has(species):',
      '            _mesh_cache[species] = load("res://trees/%s.tscn" % species)',
      '        var instance := _mesh_cache[species].instantiate()',
      '        instance.position = pos                 # extrinsic: per-tree',
      '        instance.scale = Vector3.ONE * scale',
      '        return instance',
    ].join('\n') },
  },

  proxy: {
    genres: [
      'Open world · textures/LODs stream in near the camera',
      'Horror · deferred jumpscare assets load on trigger',
      'F2P · entitlement-gated cosmetics (permission check)',
      'Online · local stubs for remote inventories',
    ],
    gd: { title: 'Godot 4 · Proxy', src: [
      'class_name TextureProxy:',
      '    var _tex: Texture2D = null',
      '    var _url := "res://textures/forest_4k.dds"',
      '',
      '    func get_texture() -> Texture2D:',
      '        if _tex == null:                        # lazy, exactly once',
      '            _tex = load(_url)',
      '        return _tex',
      '',
      '    func can_use() -> bool: return Entitlements.owns("forest_pack")',
    ].join('\n') },
  },
});
