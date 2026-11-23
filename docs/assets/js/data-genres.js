/* ============================================================
   data-genres.js — игровые жанры и их signature-наборы
   паттернов (сценарии usage по каждому жанру),
   а также русские подписи мини-игр
   ============================================================ */
window.GAMES_RU = {
  shooter: {
    title: 'Neon Pool Arena',
    tagline: 'Микро-шутер с пулами: пули и враги перерабатываются, поведение врагов меняется «на лету» стратегиями.',
    controls: '← → / A D движение · SPACE огонь',
  },
  sokoban: {
    title: 'Micro Sokoban',
    tagline: 'Карманный склад: каждый ход сохраняет мементо для отката, уровни идут через итератор.',
    controls: 'стрелки / WASD толкать · Z отмена · R заново',
  },
  snake: {
    title: 'Grid Snake',
    tagline: 'Змейка из движковых внутренностей: ввод буферизуется в очереди событий, еда ищется по пространственной сетке.',
    controls: 'стрелки / WASD (ввод в очереди!)',
  },
  td: {
    title: 'Tower Defense Micro',
    tagline: 'Стройте башни на сетке и держите три типа волн: цели берутся из ячеек-корзин, снаряды — из пула.',
    controls: 'клик по клеткам · волны идут сами',
  },
  breakout: {
    title: 'Brick Breaker',
    tagline: 'Точный арканоид: запуск и управление — команды, а мементо позволяет отмотать подачу.',
    controls: '← → / A D / мышь · SPACE запуск · Z отмотать подачу',
  },
  memory: {
    title: 'Memory Match',
    tagline: 'Классические пары, собранные как движок: итератор тасует колоду, наблюдатели переворачивают карты, фазы доски — состояния.',
    controls: 'клик по картам',
  },
};
window.GENRES = [
  {
    id: 'fps', icon: '🔫',
    name: { en: 'FPS / Shooters', ru: 'Шутеры / FPS' },
    desc: {
      en: 'Fast target acquisition rewards hot-swappable behavior and cheap, recycled effects.',
      ru: 'Быстрый фокус на цели любит горячую смену поведений и дешёвые переиспользуемые эффекты.',
    },
    items: [
      { id: 'strategy', sc: { en: 'Bot personalities: camper / rusher / flanker as plug-in movement logic.', ru: 'Характеры ботов: кемпер / рашер / фланкёр — подключаемая логика движения.' } },
      { id: 'observer', sc: { en: 'Killfeed, score streak banners and challenge progress react to events.', ru: 'Килфид, баннеры стриков и прогресс испытаний реагируют на события.' } },
      { id: 'command', sc: { en: 'Input buffering: store fire/lean actions as objects a frame ahead.', ru: 'Буферизация ввода: храним действия огня/наклона объектами на кадр вперёд.' } },
      { id: 'flyweight', sc: { en: 'Tracers, shells and impact sparks share meshes across thousands of shots.', ru: 'Трассеры, гильзы и искры попаданий делят меши на тысячи выстрелов.' } },
    ],
  },
  {
    id: 'rpg', icon: '🗡',
    name: { en: 'RPG / Action-RPG', ru: 'RPG / Экшен-RPG' },
    desc: {
      en: 'Character growth is composition: tiers, affixes and quest machinery do the heavy lifting.',
      ru: 'Рост персонажа — это композиция: тиры, аффиксы и квестовая механика делают основную работу.',
    },
    items: [
      { id: 'decorator', sc: { en: 'Legendary affixes wrap an item: damage, elemental, lifesteal layers.', ru: 'Легендарные аффиксы оборачивают предмет: слои урона, стихий, вампиризма.' } },
      { id: 'state', sc: { en: 'Companion AI switches patrol/alert/chase without giant switch blocks.', ru: 'ИИ компаньона переключает patrol/alert/chase без гигантских switch-блоков.' } },
      { id: 'memento', sc: { en: 'Branching dialogue saves snapshot the whole party state at decisions.', ru: 'Ветвящиеся диалоги снимают снимок состояния отряда на решениях.' } },
      { id: 'visitor', sc: { en: 'Exporters serialize the character tree to binary, JSON or cloud formats.', ru: 'Экспортёры сериализуют дерево персонажа в бинарь, JSON или облачные форматы.' } },
    ],
  },
  {
    id: 'rts', icon: '♜',
    name: { en: 'RTS / Strategy', ru: 'RTS / Стратегии' },
    desc: {
      en: 'Scale is the enemy: thousands of units demand shared resources and batched orders.',
      ru: 'Масштаб — враг: тысячи юнитов требуют общих ресурсов и пакетных приказов.',
    },
    items: [
      { id: 'flyweight', sc: { en: 'One soldier mesh, thousands of transforms — memory stays flat.', ru: 'Один меш солдата, тысячи трансформов — память остаётся плоской.' } },
      { id: 'spatial-partition', sc: { en: 'Target selection and broad-phase collision query only nearby cells.', ru: 'Выбор цели и broad-phase коллизий опрашивают только ближние ячейки.' } },
      { id: 'command', sc: { en: 'Order streams recorded into replays; undo for the last misclick.', ru: 'Потоки приказов записываются в реплеи; undo для последнего промаха клика.' } },
      { id: 'abstract-factory', sc: { en: 'Each faction ships a matching family of units, buildings and VFX.', ru: 'Каждая фракция поставляет согласованное семейство юнитов, зданий и VFX.' } },
    ],
  },
  {
    id: 'moba', icon: '🛡',
    name: { en: 'MOBA', ru: 'MOBA' },
    desc: {
      en: 'Ten heroes, one map, a hundred small systems that must react without tangling.',
      ru: 'Десять героев, одна карта и сотни маленьких систем, которые должны реагировать, не запутываясь.',
    },
    items: [
      { id: 'observer', sc: { en: 'Tower kills, buffs and objective spawns announce themselves once.', ru: 'Убийства башен, баффы и спавны объектов анонсируют себя один раз.' } },
      { id: 'state', sc: { en: 'Champion ability combos are states with clean enter/exit transitions.', ru: 'Комбо умений чемпиона — состояния с чистыми переходами входа/выхода.' } },
      { id: 'event-queue', sc: { en: 'Damage, healing and CC fan out through one per-tick dispatcher.', ru: 'Урон, хиля и контроль расходятся через один диспетчер на тик.' } },
      { id: 'strategy', sc: { en: 'Lane AI picks farming, poking or diving behavior per matchup.', ru: 'ИИ линии выбирает фарм, покей или дайв по матчапу.' } },
    ],
  },
  {
    id: 'battle-royale', icon: '🏝',
    name: { en: 'Battle Royale', ru: 'Королевская битва' },
    desc: {
      en: 'A shrinking map of 100 players turns proximity queries into a survival mechanic.',
      ru: 'Сжимающаяся карта со 100 игроками превращает запросы близости в механику выживания.',
    },
    items: [
      { id: 'spatial-partition', sc: { en: 'Radar pings, collision and loot magnetism query grid cells only.', ru: 'Радар, коллизии и магнетизм лута опрашивают только ячейки сетки.' } },
      { id: 'observer', sc: { en: 'Ring timers, killfeed and squad wipes push to every UI surface.', ru: 'Таймеры кольца, килфид и вайпы отрядов пушат во все поверхности UI.' } },
      { id: 'object-pool', sc: { en: 'Bullets, loot beams and zone particles recycle heavily all match long.', ru: 'Пули, лучи лута и частицы зоны перерабатываются всю длину матча.' } },
      { id: 'proxy', sc: { en: 'Cosmetics stream in lazily as players rotate around you.', ru: 'Косметика лениво подгружается по мере поворота игроков вокруг.' } },
    ],
  },
  {
    id: 'fighting', icon: '🥊',
    name: { en: 'Fighting', ru: 'Файтинги' },
    desc: {
      en: 'Frame-perfect inputs and deterministic sims make state and commands first-class.',
      ru: 'Ввод с точностью до кадра и детерминированный сим делают состояния и команды first-class.',
    },
    items: [
      { id: 'state', sc: { en: 'Idle/walk/attack/hit/block each own startup, active and recovery frames.', ru: 'Idle/walk/attack/hit/block владеют своими startup/active/recovery кадрами.' } },
      { id: 'command', sc: { en: 'Combo macros and input buffers are literally recorded command objects.', ru: 'Макро-комбо и буферы ввода — буквально записанные объекты команд.' } },
      { id: 'game-loop', sc: { en: 'Rollback netcode replays the same fixed-step simulation exactly.', ru: 'Rollback-неткод воспроизводит ту же симуляцию с фиксированным шагом точно.' } },
      { id: 'memento', sc: { en: 'Training mode rewinds the last N seconds after a dropped combo.', ru: 'Тренировочный режим отматывает последние N секунд после сорванного комбо.' } },
    ],
  },
  {
    id: 'rhythm', icon: '🎵',
    name: { en: 'Rhythm / Music', ru: 'Ритм / Музыкальные' },
    desc: {
      en: 'Timing windows need exact clocks; charts and DSP chains need fixed recipes.',
      ru: 'Окна тайминга требуют точных часов; чарты и DSP-цепочки — фиксированных рецептов.',
    },
    items: [
      { id: 'game-loop', sc: { en: 'Judgement uses simulation time, not wall time — lag never bends windows.', ru: 'Судейство идёт по времени сима, не по wall time — лаг не гнёт окна.' } },
      { id: 'template-method', sc: { en: 'Judgement pipeline: capture → quantize → grade → feedback, per note type.', ru: 'Конвейер судейства: захват → квантование → оценка → фидбек, по типу ноты.' } },
      { id: 'iterator', sc: { en: 'Charts iterate notes lazily so long songs never fully load.', ru: 'Чарты обходят ноты лениво — длинные песни не грузятся целиком.' } },
      { id: 'observer', sc: { en: 'Combo counters and full-combo badges subscribe to hit judgements.', ru: 'Счётчики комбо и бейджи FC подписаны на оценки попаданий.' } },
    ],
  },
  {
    id: 'roguelike', icon: '🎲',
    name: { en: 'Roguelike / Roguelite', ru: 'Рогалик / Рогалит' },
    desc: {
      en: 'Randomness plus irreversible runs: assembly recipes, clones and damage pipelines.',
      ru: 'Рандом плюс необратимые забеги: рецепты сборки, клоны и конвейеры урона.',
    },
    items: [
      { id: 'builder', sc: { en: 'Dungeons assemble from biome recipes: border → scatter → connect → populate.', ru: 'Подземелья собираются из рецептов биомов: границы → scatter → связи → наполнение.' } },
      { id: 'prototype', sc: { en: 'Enemy variants clone archetypes then tweak tint, stats and AI flags.', ru: 'Варианты врагов клонируют архетипы, затем крутят тинт, статы и флаги ИИ.' } },
      { id: 'chain-of-responsibility', sc: { en: 'Damage flows armor → resist → shield → HP before health updates.', ru: 'Урон течёт броня → резист → щит → HP, прежде чем обновится здоровье.' } },
      { id: 'facade', sc: { en: 'Run start hides seed, modifiers and party setup behind one call.', ru: 'Старт забега прячет seed, модификаторы и настройку отряда за одним вызовом.' } },
    ],
  },
  {
    id: 'mmo', icon: '🌐',
    name: { en: 'MMO / Online', ru: 'MMO / Онлайн' },
    desc: {
      en: 'Many systems, many players: route communication, cache aggressively, spawn by id.',
      ru: 'Много систем, много игроков: маршрутизируйте общение, кэшируйте агрессивно, спавните по id.',
    },
    items: [
      { id: 'mediator', sc: { en: 'Zone chat hubs route between speakers who never know each other.', ru: 'Хабы зонального чата маршрутизируют между говорящими, которые друг друга не знают.' } },
      { id: 'factory', sc: { en: 'Mobs, items and quests instantiate from server-driven catalogs.', ru: 'Мобы, предметы и квесты инстанцируются из каталогов, приходящих с сервера.' } },
      { id: 'flyweight', sc: { en: 'Nameplates, chat bubbles and portraits share textures city-wide.', ru: 'Неймтеги, чат-бабблы и портреты делят текстуры на весь город.' } },
      { id: 'singleton', sc: { en: 'Session, settings and entitlement services are exactly-once globals.', ru: 'Сессия, настройки и сервисы entitlement — глобалы «ровно один раз».' } },
    ],
  },
  {
    id: 'idle', icon: '⏳',
    name: { en: 'Idle / Incremental', ru: 'Idle / Инкрементальные' },
    desc: {
      en: 'Everything is a tick reaction: bonuses stack, counters push, numbers go up.',
      ru: 'Всё — реакция на тик: бонусы стакаются, счётчики пушат, числа растут.',
    },
    items: [
      { id: 'observer', sc: { en: 'Every resource counter subscribes to the global tick.', ru: 'Каждый счётчик ресурса подписан на глобальный тик.' } },
      { id: 'decorator', sc: { en: 'Multipliers wrap each other in layers with clean order semantics.', ru: 'Множители оборачивают друг друга слоями с понятной семантикой порядка.' } },
      { id: 'state', sc: { en: 'Prestige tiers flip the whole run into a new behavior set.', ru: 'Тиры престижа переключают весь забег в новый набор поведений.' } },
      { id: 'strategy', sc: { en: 'Auto-upgrade policies swap between balanced, greedy and burst.', ru: 'Политики автоапгрейда меняются между балансом, жадностью и бурстом.' } },
    ],
  },
  {
    id: 'puzzle', icon: '🧩',
    name: { en: 'Puzzle', ru: 'Головоломки' },
    desc: {
      en: 'Boards reward exact undo, explicit phases and clear iteration over levels.',
      ru: 'Доски любят точный undo, явные фазы и прозрачный обход уровней.',
    },
    items: [
      { id: 'memento', sc: { en: 'Every move pushes a snapshot; unlimited undo is the selling point.', ru: 'Каждый ход пушит снимок; безлимитный undo — фишка жанра.' } },
      { id: 'state', sc: { en: 'Menu → playing → paused → cleared as explicit phase objects.', ru: 'Меню → игра → пауза → пройдено как явные объекты фаз.' } },
      { id: 'iterator', sc: { en: 'Level packs step forward/back without loading everything at once.', ru: 'Наборы уровней листаются туда-сюда без загрузки всего сразу.' } },
    ],
  },
  {
    id: 'simulation', icon: '🏎',
    name: { en: 'Simulation / Sports', ru: 'Симуляторы / Спорт' },
    desc: {
      en: 'Physics at a fixed heartbeat and AI with a playbook keep the world believable.',
      ru: 'Физика на фиксированном пульсе и ИИ с плейбуком сохраняют правдоподобие мира.',
    },
    items: [
      { id: 'game-loop', sc: { en: 'Physics runs at a fixed 50–60 Hz regardless of render rate.', ru: 'Физика идёт фиксированные 50–60 Гц независимо от рендера.' } },
      { id: 'strategy', sc: { en: 'Team AI picks formations and play calls as swappable plans.', ru: 'Командный ИИ выбирает схемы и розыгрыши как сменные планы.' } },
      { id: 'bridge', sc: { en: 'One driving model bridges arcade handling and sim physics backends.', ru: 'Одна модель вождения мостит аркадный и симуляционный физические бэкенды.' } },
      { id: 'component', sc: { en: 'Cars and athletes compose stats, stamina and parts as data.', ru: 'Машины и атлеты собирают статы, выносливость и части как данные.' } },
    ],
  },
];
