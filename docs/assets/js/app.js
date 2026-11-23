/* ============================================================
   app.js — router, rendering, nav, highlighter, i18n (EN/RU)
   ============================================================ */
(function () {
  const $ = sel => document.querySelector(sel);
  const $$ = sel => [...document.querySelectorAll(sel)];

  /* ---------------- syntax highlighter ---------------- */
  const KW = new Set(('var let const function return if else for while class new this super extends import export from default ' +
    'public private protected readonly static abstract interface void int float double decimal string bool using namespace get set out ' +
    'override virtual sealed foreach in of do switch case break continue try catch finally throw lock null true false undefined NaN ' +
    'typeof instanceof yield async await delegate enum struct event params ref base is as object signal func class_name ' +
    'await preload load self pass const match breakpoint and or not').split(' '));

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function tokenize(src, lang) {
    const hashCom = lang === 'gd';
    const re = /(\/\/[^\n]*)|(#[^\n]*)|(\/\*[\s\S]*?\*\/)|('(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`)|(\b\d[\d_]*(?:\.\d+)?[fFmM]?\b)|([A-Za-z_$][\w$]*)|(\s+)|(.)/g;
    const out = [];
    let m;
    while ((m = re.exec(src))) {
      const [full, com, hash, , str, num, ident, ws] = m;
      if (com || (hashCom && hash)) out.push(['com', com || hash]);
      else if (str) out.push(['str', str]);
      else if (num) out.push(['num', num]);
      else if (ident) {
        if (KW.has(ident)) out.push(['kw', ident]);
        else if (/^[A-Z]/.test(ident)) out.push(['type', ident]);
        else out.push(['plain', ident]);
      }
      else if (ws) out.push(['plain', ws]);
      else out.push(['plain', full]);
    }
    return out;
  }

  function highlightHTML(src, lang) {
    return tokenize(src, lang).map(([cls, text]) =>
      cls === 'plain' ? esc(text) : `<span class="tok-${cls}">${esc(text)}</span>`).join('');
  }

  function highlightLines(src, lang) {
    const html = highlightHTML(src, lang);
    return html.split('\n').map(l => `<span class="cl">${l || ' '}</span>`).join('');
  }

  /* ---------------- i18n helpers ---------------- */
  const L = () => I18N.lang;
  const tt = (k, vars) => I18N.t(k, vars);
  const catLabel = cat => I18N.catLabel(cat);
  const pick = obj => (obj && obj[L()]) || (obj && obj.en) || '';
  function locP(p) { return (L() === 'ru' && window.PATTERN_RU && PATTERN_RU[p.id]) || null; }
  function pField(p, f) { const r = locP(p); return (r && r[f]) || p[f]; }
  function pSteps(p) {
    const r = locP(p);
    return p.steps.map((s, i) => ({ hi: s.hi, text: (r && r.steps && r.steps[i]) || s.text }));
  }

  /* ---------------- dom helpers ---------------- */
  function h(tag, cls, htmlStr) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (htmlStr != null) e.innerHTML = htmlStr;
    return e;
  }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }

  const REPO = 'https://github.com/Sergutsu/designpatterns/blob/master/';
  const FILE_MAP = {
    adapter: 'DesignPattern/Structural/Adapter.cs',
    bridge: 'DesignPattern/Structural/Bridge.cs',
    composite: 'DesignPattern/Structural/Composite.cs',
    decorator: 'DesignPattern/Structural/Decorator.cs',
    facade: 'DesignPattern/Structural/Facade.cs',
    flyweight: 'DesignPattern/Structural/Flyweight.cs',
    proxy: 'DesignPattern/Structural/Proxy.cs',
    'chain-of-responsibility': 'DesignPattern/Behaviourial/ChainOfResposibility.cs',
    iterator: 'DesignPattern/Behaviourial/Iterator.cs',
    mediator: 'DesignPattern/Behaviourial/Mediator.cs',
    memento: 'DesignPattern/Behaviourial/Memento.cs',
    observer: 'DesignPattern/Behaviourial/Observer.cs',
    state: 'DesignPattern/Behaviourial/State.cs',
    strategy: 'DesignPattern/Behaviourial/Strategy.cs',
    'template-method': 'DesignPattern/Behaviourial/TemplateMethod.cs',
    visitor: 'DesignPattern/Behaviourial/Visitor.cs',
    'abstract-factory': 'DesignPattern/Creational/AbstractFactory.cs',
    builder: 'DesignPattern/Creational/Builder.cs',
    factory: 'DesignPattern/Creational/Factory.cs',
    prototype: 'DesignPattern/Creational/Prototype.cs',
    singleton: 'DesignPattern/Creational/Singleton.cs',
  };

  const state = { route: null, cleanupDemo: null, player: null };
  const content = $('#content');

  /* ---------------- chrome: progress, top, menu ---------------- */
  const progress = $('#progress');
  addEventListener('scroll', () => {
    const d = document.documentElement;
    progress.style.width = (d.scrollTop / Math.max(1, d.scrollHeight - innerHeight) * 100) + '%';
    $('#to-top').classList.toggle('show', d.scrollTop > 600);
  }, { passive: true });
  $('#to-top').addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

  const sidebar = $('#sidebar'), scrim = $('#scrim'), menuBtn = $('#menu-btn');
  menuBtn.addEventListener('click', () => { sidebar.classList.toggle('open'); scrim.classList.toggle('show'); });
  scrim.addEventListener('click', () => { sidebar.classList.remove('open'); scrim.classList.remove('show'); });

  /* language toggle */
  function wireLangToggle() {
    const seg = $('#lang-seg');
    if (!seg) return;
    seg.querySelectorAll('button').forEach(b => {
      b.classList.toggle('on', b.dataset.lang === L());
      b.addEventListener('click', () => {
        I18N.setLang(b.dataset.lang);
        localizeStatic();
        buildNav();        // nav labels are language-dependent too
        route();           // re-render current view in the new language
        wireLangToggle();
      });
    });
  }

  /* static nodes marked with data-i18n */
  function localizeStatic() {
    $$('[data-i18n]').forEach(el => { el.innerHTML = tt(el.dataset.i18n); });
    const s = $('#nav-search');
    if (s) s.placeholder = tt('search.ph');
    const bs = $('#brand-sub');
    if (bs) bs.textContent = tt('brand.sub');
  }

  /* ---------------- nav ---------------- */
  function buildNav() {
    const nav = $('#nav-patterns');
    clear(nav);
    CAT_ORDER.forEach(cat => {
      const meta = CATEGORIES[cat];
      const sec = h('div', 'nav-section');
      sec.style.setProperty('--nav-color', meta.color);
      sec.appendChild(h('div', 'nav-section-title', `<span class="dot ${cat}"></span>${catLabel(cat)}`));
      PATTERNS.filter(p => p.cat === cat).forEach(p => {
        const a = h('a', 'nav-link', `<span class="num">${p.num}</span><span>${p.name}</span>`);
        a.href = '#/pattern/' + p.id;
        a.dataset.pid = p.id;
        sec.appendChild(a);
      });
      nav.appendChild(sec);
    });
    // genres
    if (window.GENRES) {
      const gs = h('div', 'nav-section');
      gs.style.setProperty('--nav-color', '#c792ea');
      gs.appendChild(h('div', 'nav-section-title', '<span class="dot" style="background:#c792ea"></span>' + tt('nav.genres')));
      window.GENRES.forEach(g => {
        const a = h('a', 'nav-link', `<span>${g.icon} ${pick(g.name)}</span>`);
        a.href = '#/genre/' + g.id; a.dataset.genre = g.id;
        gs.appendChild(a);
      });
      nav.appendChild(gs);
    }
    // minigames
    if (window.GAMES) {
      const gs = h('div', 'nav-section');
      gs.style.setProperty('--nav-color', '#80ed99');
      gs.appendChild(h('div', 'nav-section-title', '<span class="dot bonus"></span>' + tt('nav.minigames')));
      Object.values(GAMES).forEach(g => {
        const a = h('a', 'nav-link', `<span>🕹 ${gameTitle(g)}</span>`);
        a.href = '#/game/' + g.id; a.dataset.game = g.id;
        gs.appendChild(a);
      });
      nav.appendChild(gs);
    }
    // utility links
    const sec = h('div', 'nav-section');
    sec.appendChild(h('div', 'nav-section-title', '<span class="dot" style="background:#6b7690"></span>' + tt('nav.dossier')));
    [['#/category/all', tt('nav.all')], ['#/about', tt('nav.about')]].forEach(([href, label]) => {
      const a = h('a', 'nav-link', `<span>${label}</span>`);
      a.href = href; a.dataset.route = href.slice(2);
      sec.appendChild(a);
    });
    nav.appendChild(sec);
  }

  function markActive(id) {
    $$('.nav-link[data-pid]').forEach(a => a.classList.toggle('active', a.dataset.pid === id));
  }
  function markActiveGame(id) {
    $$('.nav-link[data-game]').forEach(a => a.classList.toggle('active', a.dataset.game === id));
  }
  function markActiveGenre(id) {
    $$('.nav-link[data-genre]').forEach(a => a.classList.toggle('active', a.dataset.genre === id));
  }

  function gameTitle(g) {
    const r = L() === 'ru' && window.GAMES_RU && window.GAMES_RU[g.id];
    return (r && r.title) || g.title;
  }
  function gameTagline(g) {
    const r = L() === 'ru' && window.GAMES_RU && window.GAMES_RU[g.id];
    return (r && r.tagline) || g.tagline;
  }
  function gameControls(g) {
    const r = L() === 'ru' && window.GAMES_RU && window.GAMES_RU[g.id];
    return (r && r.controls) || g.controls;
  }

  function searchHay(p) {
    const r = locP(p);
    return [
      p.name, p.tagline, p.intent,
      (p.genres || []).join(' '), (p.use || []).join(' '),
      r ? [r.tagline, r.intent, (r.genres || []).join(' '), (r.use || []).join(' ')].join(' ') : '',
    ].join(' ').toLowerCase();
  }

  function searchFilter(q) {
    q = q.trim().toLowerCase();
    $$('#nav-patterns .nav-link[data-pid]').forEach(a => {
      const p = byId(a.dataset.pid);
      a.classList.toggle('hidden-by-search', !(q === '' || searchHay(p).includes(q)));
    });
    $$('#nav-patterns .nav-section').forEach(sec => {
      const any = [...sec.querySelectorAll('.nav-link[data-pid]')].some(a => !a.classList.contains('hidden-by-search'));
      const isOther = ![...sec.querySelectorAll('.nav-link[data-pid]')].length;
      sec.style.display = any || (isOther && !q) ? '' : 'none';
    });
    const grid = $('#home-grid');
    if (grid) {
      [...grid.children].forEach(card => {
        const p = byId(card.dataset.pid);
        card.style.display = (!q || searchHay(p).includes(q)) ? '' : 'none';
      });
    }
  }
  $('#nav-search').addEventListener('input', e => searchFilter(e.target.value));

  /* ---------------- breadcrumb ---------------- */
  function crumb(parts) {
    const b = $('#breadcrumb');
    clear(b);
    const home = h('a', '', tt('crumb.home'));
    home.href = '#/';
    b.appendChild(home);
    parts.forEach(p => {
      b.appendChild(h('span', '', ' / '));
      if (p.href) { const a = h('a', '', p.label); a.href = p.href; b.appendChild(a); }
      else b.appendChild(h('b', '', p.label));
    });
  }

  /* ---------------- home ---------------- */
  function renderHome() {
    destroyRoute();
    markActive(null);
    crumb([{ label: tt('crumb.overview') }]);

    const counts = {};
    CAT_ORDER.forEach(c => counts[c] = PATTERNS.filter(p => p.cat === c).length);
    const demos = PATTERNS.filter(p => p.demo).length;

    const hero = h('section', 'hero');
    hero.innerHTML = `
      <canvas id="hero-canvas"></canvas>
      <div class="hero-inner">
        <div class="hero-kicker">${tt('hero.kicker')}</div>
        <h1>${tt('hero.title')}</h1>
        <p class="lede">${tt('hero.lede')}</p>
        <div class="row">
          <a class="btn primary" href="#/pattern/observer" style="text-decoration:none">${tt('hero.cta')}</a>
          <a class="btn" href="#/category/bonus" style="text-decoration:none">${tt('hero.cta2')}</a>
        </div>
        <div class="hero-stats">
          <div class="stat-chip"><div class="v">${PATTERNS.length}</div><div class="k">${tt('stat.patterns')}</div></div>
          <div class="stat-chip"><div class="v">${demos}</div><div class="k">${tt('stat.demos')}</div></div>
          <div class="stat-chip"><div class="v">${window.GAMES ? Object.keys(GAMES).length : 0}</div><div class="k">${tt('stat.games')}</div></div>
          <div class="stat-chip"><div class="v">${PATTERNS.reduce((a, p) => a + p.steps.length, 0)}</div><div class="k">${tt('stat.steps')}</div></div>
          <div class="stat-chip"><div class="v">${PATTERNS.reduce((a, p) => a + p.code.length, 0)}</div><div class="k">${tt('stat.code')}</div></div>
        </div>
      </div>`;
    content.appendChild(hero);

    const catGrid = h('div', 'cat-grid');
    CAT_ORDER.forEach(cat => {
      const meta = CATEGORIES[cat];
      const blurb = L() === 'ru' ? tt('cat.blurb.' + cat) : meta.blurb;
      const a = h('a', 'cat-card', `
        <h3><span class="cat-swatch" style="--cat-color:${meta.color}"></span>${catLabel(cat)}</h3>
        <p>${blurb}</p>
        <span class="count">${counts[cat]} ${tt('stat.patterns')} →</span>`);
      a.href = '#/category/' + cat;
      a.style.setProperty('--cat-color', meta.color);
      catGrid.appendChild(a);
    });
    content.appendChild(h('div', 'section', ''));
    content.lastChild.appendChild(h('div', 'sec-head', `<span class="sec-num">01</span><h2>${tt('sec.families')}</h2><div class="sec-rule"></div>`));
    content.lastChild.appendChild(catGrid);

    // genres
    if (window.GENRES) {
      content.appendChild(h('div', 'section', ''));
      content.lastChild.style.setProperty('--cat-color', '#c792ea');
      content.lastChild.appendChild(h('div', 'sec-head', `<span class="sec-num" style="color:#c792ea">02</span><h2>${tt('sec.genres')}</h2><div class="sec-rule"></div>`));
      content.lastChild.appendChild(h('p', 'muted small', tt('genres.note')));
      const gr = h('div', 'pattern-grid');
      window.GENRES.forEach(g => {
        const a = h('a', 'pattern-card');
        a.href = '#/genre/' + g.id;
        a.style.setProperty('--cat-color', '#c792ea');
        a.innerHTML = `
          <div class="pc-top"><h3>${g.icon} ${pick(g.name)}</h3><span class="mini-tag" style="color:#c792ea;border-color:rgba(199,146,234,.4)">${g.items.length} ${tt('stat.patterns')}</span></div>
          <div class="tag">${pick(g.desc)}</div>`;
        gr.appendChild(a);
      });
      content.lastChild.appendChild(gr);
    }

    // minigames
    if (window.GAMES) {
      content.appendChild(h('div', 'section', ''));
      content.lastChild.style.setProperty('--cat-color', '#80ed99');
      content.lastChild.appendChild(h('div', 'sec-head', `<span class="sec-num" style="color:#80ed99">03</span><h2>${tt('sec.games')}</h2><div class="sec-rule"></div>`));
      content.lastChild.appendChild(h('p', 'muted small', tt('games.note')));
      const ggrid = h('div', 'pattern-grid');
      Object.values(GAMES).forEach(g => {
        const a = h('a', 'pattern-card');
        a.href = '#/game/' + g.id;
        a.style.setProperty('--cat-color', '#80ed99');
        a.innerHTML = `
          <div class="pc-top"><h3>🕹 ${gameTitle(g)}</h3><span class="mini-tag" style="color:#80ed99;border-color:rgba(128,237,153,.4)">minigame</span></div>
          <div class="tag">${gameTagline(g)}</div>
          <div class="pc-foot"><span class="mini-tag">${tt('card.inside', { n: g.patterns.length })}</span><span class="mini-tag">${gameControls(g)}</span></div>`;
        ggrid.appendChild(a);
      });
      content.lastChild.appendChild(ggrid);
    }

    content.appendChild(h('div', 'section', ''));
    content.lastChild.appendChild(h('div', 'sec-head', `<span class="sec-num">04</span><h2>${tt('sec.catalogue')}</h2><div class="sec-rule"></div>`));
    const grid = h('div', 'pattern-grid'); grid.id = 'home-grid';
    PATTERNS.forEach(p => grid.appendChild(patternCard(p)));
    content.lastChild.appendChild(grid);

    const notes = h('div', 'section');
    notes.innerHTML = `<div class="sec-head"><span class="sec-num">05</span><h2>${tt('sec.howto')}</h2><div class="sec-rule"></div></div>
      <div class="two-col">
        <div class="panel"><h3>${tt('howto.t1')}</h3><p class="muted">${tt('howto.b1')}</p></div>
        <div class="panel"><h3>${tt('howto.t2')}</h3><p class="muted">${tt('howto.b2')}</p></div>
        <div class="panel"><h3>${tt('howto.t3')}</h3><p class="muted">${tt('howto.b3')}</p></div>
        <div class="panel"><h3>${tt('howto.t4')}</h3><p class="muted">${tt('howto.b4')}</p></div>
      </div>`;
    content.appendChild(notes);

    startHeroCanvas();
  }

  function patternCard(p) {
    const meta = CATEGORIES[p.cat];
    const a = h('a', 'pattern-card');
    a.href = '#/pattern/' + p.id;
    a.dataset.pid = p.id;
    a.style.setProperty('--cat-color', meta.color);
    a.innerHTML = `
      <div class="pc-top"><h3>${p.name}</h3><span class="mini-tag cat">${catLabel(p.cat)}</span></div>
      <div class="tag">${pField(p, 'tagline')}</div>
      <div class="pc-foot">
        ${p.demo ? `<span class="mini-tag" style="color:var(--good);border-color:rgba(128,237,153,.4)">${tt('card.demo')}</span>` : ''}
        <span class="mini-tag">${p.num}</span>
      </div>`;
    return a;
  }

  function startHeroCanvas() {
    const cv = $('#hero-canvas');
    if (!cv) return;
    const hero = cv.parentElement;
    const ctx = cv.getContext('2d');
    let W, H, pts = [];
    function size() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      W = hero.clientWidth; H = hero.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      pts = Array.from({ length: Math.min(70, W / 14) }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35,
        r: 1 + Math.random() * 1.8,
      }));
    }
    size();
    addEventListener('resize', size);
    let alive = true;
    (function tick() {
      if (!alive) return;
      if (cv.isConnected) {
        ctx.clearRect(0, 0, W, H);
        for (const p of pts) {
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > W) p.vx *= -1;
          if (p.y < 0 || p.y > H) p.vy *= -1;
        }
        ctx.lineWidth = 1;
        for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i], b = pts[j], dx = a.x - b.x, dy = a.y - b.y, d = dx * dx + dy * dy;
          if (d < 130 * 130) {
            ctx.strokeStyle = `rgba(76,201,240,${(1 - d / 16900) * .22})`;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        for (const p of pts) {
          ctx.fillStyle = 'rgba(140,190,235,.6)';
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
        }
      }
      requestAnimationFrame(tick);
    })();
    const obs = new MutationObserver(() => { if (!cv.isConnected) { alive = false; obs.disconnect(); } });
    obs.observe(content, { childList: true });
  }

  /* ---------------- category view ---------------- */
  function renderCategory(cat) {
    destroyRoute();
    markActive(null);
    const list = cat === 'all' ? PATTERNS : PATTERNS.filter(p => p.cat === cat);
    const label = cat === 'all' ? tt('catview.all') : catLabel(cat);
    crumb([{ label }]);
    const sec = h('div', 'section');
    sec.appendChild(h('div', 'sec-head',
      `<span class="sec-num">▣</span><h2>${cat === 'all' ? tt('catview.all') : tt('catview.heading', { label, n: list.length })}</h2><div class="sec-rule"></div>`));
    const grid = h('div', 'pattern-grid'); grid.id = 'home-grid';
    list.forEach(p => grid.appendChild(patternCard(p)));
    sec.appendChild(grid);
    content.appendChild(sec);
  }

  /* ---------------- genre view ---------------- */
  function renderGenre(id) {
    const g = window.GENRES && GENRES.find(x => x.id === id);
    if (!g) return renderHome();
    destroyRoute();
    markActive(null); markActiveGenre(id);
    crumb([{ label: tt('nav.genres'), href: '#/' }, { label: pick(g.name) }]);

    const head = h('div', 'pattern-head');
    head.style.setProperty('--cat-color', '#c792ea');
    head.innerHTML = `
      <div class="tagrow" style="margin-top:0">
        <span class="chip cat" style="color:#c792ea;border-color:rgba(199,146,234,.5);background:rgba(199,146,234,.09)">${g.icon} genre</span>
        <span class="chip">${g.items.length} ${tt('stat.patterns')}</span>
      </div>
      <h1>${g.icon} ${pick(g.name)}</h1>
      <p class="tagline">${pick(g.desc)}</p>`;
    content.appendChild(head);

    const wrap = h('div', 'section');
    g.items.forEach(it => {
      const p = byId(it.id);
      if (!p) return;
      const card = h('a', 'related-card');
      card.style.cssText = 'display:flex;align-items:center;gap:12px;padding:14px 16px';
      card.href = '#/pattern/' + p.id;
      card.innerHTML = `
        <span class="rn mono" style="color:var(--cat-color,${CATEGORIES[p.cat].color});font-weight:700">${p.num}</span>
        <span style="display:grid;gap:2px">
          <span style="color:var(--ink);font-weight:600">${p.name}</span>
          <span class="rl">${pick(it.sc)}</span>
        </span>`;
      wrap.appendChild(card);
    });
    content.appendChild(wrap);

    content.appendChild(h('p', 'muted small mt8', tt('genres.note')));
    content.scrollTop = 0;
    scrollTo({ top: 0 });
  }

  /* ---------------- about ---------------- */
  function renderAbout() {
    destroyRoute();
    markActive(null);
    crumb([{ label: tt('nav.about') }]);
    const sec = h('div', 'section');
    sec.innerHTML = `
      <div class="sec-head"><span class="sec-num">✦</span><h2>${tt('about.title')}</h2><div class="sec-rule"></div></div>
      <div class="panel">
        <p>${tt('about.p1')}</p>
        <h3 class="mt16">${tt('about.src')}</h3>
        <ul class="note-list">
          <li>${tt('about.s1')}</li>
          <li>${tt('about.s2')}</li>
          <li>${tt('about.s3')}</li>
        </ul>
        <h3 class="mt16">${tt('about.how')}</h3>
        <p class="muted">${tt('about.demos')}</p>
        <div class="row mt16">
          <a class="btn" href="${REPO}" target="_blank" rel="noopener">${tt('about.repo')}</a>
          <a class="btn primary" href="#/">${tt('about.back')}</a>
        </div>
      </div>`;
    content.appendChild(sec);
  }

  /* ---------------- minigame page ---------------- */
  function renderGame(id) {
    const g = window.GAMES && GAMES[id];
    if (!g) return renderHome();
    destroyRoute();
    markActive(null); markActiveGame(id);
    content.style.setProperty('--cat-color', '#80ed99');
    crumb([{ label: tt('nav.minigames'), href: '#/' }, { label: gameTitle(g) }]);

    const head = h('div', 'pattern-head');
    head.innerHTML = `
      <div class="tagrow" style="margin-top:0">
        <span class="chip cat" style="color:#80ed99;border-color:rgba(128,237,153,.5);background:rgba(128,237,153,.09)">${tt('game.chip')}</span>
        <span class="chip">${tt('game.composed', { n: g.patterns.length })}</span>
        <span class="chip">${tt('game.controls')}${gameControls(g)}</span>
      </div>
      <h1>${gameTitle(g)}</h1>
      <p class="tagline">${gameTagline(g)}</p>`;
    content.appendChild(head);

    const mountRoot = h('div', '');
    content.appendChild(mountRoot);
    try {
      state.cleanupDemo = g.mount(mountRoot, '#80ed99') || null;
    } catch (err) {
      mountRoot.innerHTML = `<div class="panel"><span class="muted">demo failed to load: ${esc(err.message)}</span></div>`;
      console.error(err);
    }

    const sec = h('div', 'section');
    sec.innerHTML = `<div class="sec-head"><span class="sec-num" style="color:#80ed99">▣</span><h2>${tt('game.underhood')}</h2><div class="sec-rule"></div></div>`;
    const strip = h('div', 'related-strip');
    g.patterns.map(byId).filter(Boolean).forEach(r => {
      const a = h('a', 'related-card', `<span class="rn">${r.num}</span> ${r.name} <span class="rl">· ${pField(r, 'tagline')}</span>`);
      a.href = '#/pattern/' + r.id;
      strip.appendChild(a);
    });
    sec.appendChild(strip);
    sec.appendChild(h('p', 'muted small mt16', tt('game.note')));
    content.appendChild(sec);

    content.scrollTop = 0;
    scrollTo({ top: 0 });
  }

  /* ---------------- pattern detail ---------------- */
  function renderPattern(id) {
    const p = byId(id);
    if (!p) { renderHome(); return; }
    destroyRoute();
    markActive(id);
    crumb([
      { label: catLabel(p.cat), href: '#/category/' + p.cat },
      { label: p.name },
    ]);
    const color = CATEGORIES[p.cat].color;
    content.style.setProperty('--cat-color', color);

    /* head */
    const head = h('div', 'pattern-head');
    head.style.setProperty('--cat-color', color);
    head.innerHTML = `
      <div class="tagrow" style="margin-top:0">
        <span class="chip cat">${p.num} · ${catLabel(p.cat)}</span>
        ${p.demo ? `<span class="chip demo-chip">${tt('chip.demo')}</span>` : ''}
        ${FILE_MAP[p.id]
        ? `<a class="chip" href="${REPO}${FILE_MAP[p.id]}" target="_blank" rel="noopener">${tt('chip.repo')}</a>`
        : `<span class="chip">${tt('chip.native')}</span>`}
      </div>
      <h1>${p.name}</h1>
      ${p.aka ? `<div class="aka">a.k.a. <b>${Array.isArray(p.aka) ? p.aka.join(', ') : p.aka}</b></div>` : ''}
      <p class="tagline">${pField(p, 'tagline')}</p>`;
    content.appendChild(head);

    /* intent */
    content.appendChild(sectionHead('A', tt('sec.intent')));
    content.appendChild(h('div', 'intent-quote', `<span class="lbl">${tt('intent.label')}</span>${pField(p, 'intent')}`));

    /* game framing */
    content.appendChild(sectionHead('B', tt('sec.why')));
    const gp = h('div', 'panel');
    gp.innerHTML = `<h3 style="color:var(--cat-color);font-size:15px;margin-bottom:8px">${pField(p, 'gameTitle')}</h3>
      <p class="muted" style="margin:0 0 10px">${pField(p, 'gameBody')}</p>
      <ul class="note-list">${(pField(p, 'gameBullets') || []).map(b => `<li>${b}</li>`).join('')}</ul>`;
    const genres = pField(p, 'genres') || [];
    if (genres.length) {
      gp.appendChild(h('div', 'field-label mt16', tt('genres.label')));
      const grow = h('div', 'tagrow');
      genres.forEach(g => grow.appendChild(h('span', 'chip', g)));
      gp.appendChild(grow);
    }
    content.appendChild(gp);

    /* diagram + choreography */
    content.appendChild(sectionHead('C', tt('sec.struct')));
    const wrap = h('div', 'panel');
    wrap.style.padding = '10px';
    const scrollBox = h('div', 'diagram-scroll');
    const refs = DiagramKit.renderDiagram(p.diagram);
    scrollBox.appendChild(refs.svg);
    wrap.appendChild(scrollBox);
    content.appendChild(wrap);
    if (p.steps.length) {
      const playerRoot = h('div');
      content.appendChild(playerRoot);
      state.player = DiagramKit.createPlayer(playerRoot, pSteps(p), refs, {
        interval: 2200,
        ready1: tt('player.ready1'),
        ready2: tt('player.ready2'),
        prev: tt('player.prev'),
        next: tt('player.next'),
        play: tt('player.play'),
        pause: tt('player.pause'),
      });
    }

    /* code */
    if (p.code.length) {
      content.appendChild(sectionHead('D', tt('sec.codeh')));
      const cw = h('div', '');
      const tabs = h('div', 'code-tabs');
      const win = h('div', 'code-window');
      const head2 = h('div', 'code-head');
      const dots = h('span', 'dots', '<i></i><i></i><i></i>');
      const fname = h('span', '', '');
      const copyBtn = h('button', 'copy-btn', '⧉ copy');
      copyBtn.type = 'button';
      copyBtn.addEventListener('click', () => {
        const txt = p.code[curTab].src;
        (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject())
          .then(() => { copyBtn.textContent = '✓ copied'; })
          .catch(() => { copyBtn.textContent = 'select & copy'; });
        setTimeout(() => copyBtn.textContent = '⧉ copy', 1400);
      });
      head2.append(dots, fname, copyBtn);
      const pre = h('pre', 'code');
      win.append(head2, pre);
      let curTab = 0;
      p.code.forEach((c, i) => {
        const langLabel = c.lang === 'csharp' ? 'C#' : c.lang === 'gd' ? 'GDScript' : 'JS';
        const t = h('button', 'code-tab' + (i === 0 ? ' active' : ''), `${langLabel} · ${c.title}`);
        t.type = 'button';
        t.addEventListener('click', () => {
          curTab = i;
          tabs.querySelectorAll('.code-tab').forEach(x => x.classList.remove('active'));
          t.classList.add('active');
          paint(i);
        });
        tabs.appendChild(t);
      });
      function paint(i) {
        const c = p.code[i];
        fname.textContent = c.title;
        pre.innerHTML = highlightLines(c.src, c.lang === 'csharp' ? 'cs' : c.lang === 'gd' ? 'gd' : 'js');
      }
      paint(0);
      cw.append(tabs, win);
      content.appendChild(cw);
    }

    /* demo */
    if (p.demo && DEMOS[p.demo]) {
      content.appendChild(sectionHead('E', tt('sec.demoh')));
      const root = h('div', '');
      content.appendChild(root);
      try {
        DEMOS[p.demo](root, color);
      } catch (err) {
        root.innerHTML = `<div class="panel"><span class="muted">demo failed to load: ${esc(err.message)}</span></div>`;
        console.error(err);
      }
    }

    /* applicability & pitfalls */
    content.appendChild(sectionHead('F', tt('sec.notes')));
    const two = h('div', 'two-col');
    const useP = h('div', 'panel');
    useP.innerHTML = `<h3 style="font-size:14px;color:var(--good);margin-bottom:10px">${tt('notes.use')}</h3>
      <ul class="note-list">${(pField(p, 'use') || []).map(u => `<li>${u}</li>`).join('')}</ul>`;
    const badP = h('div', 'panel');
    badP.innerHTML = `<h3 style="font-size:14px;color:var(--bad);margin-bottom:10px">${tt('notes.pitfalls')}</h3>
      <ul class="note-list">${(pField(p, 'pitfalls') || []).map(u => `<li>${u}</li>`).join('')}</ul>`;
    two.append(useP, badP);
    content.appendChild(two);

    /* related */
    if (p.related.length) {
      content.appendChild(sectionHead('G', tt('sec.related')));
      const strip = h('div', 'related-strip');
      p.related.map(byId).filter(Boolean).forEach(r => {
        const a = h('a', 'related-card', `<span class="rn">${r.num}</span> ${r.name} <span class="rl">· ${pField(r, 'tagline')}</span>`);
        a.href = '#/pattern/' + r.id;
        strip.appendChild(a);
      });
      content.appendChild(strip);
    }

    content.scrollTop = 0;
    scrollTo({ top: 0 });
  }

  function sectionHead(num, title) {
    const s = h('div', 'section');
    s.style.marginBottom = '14px';
    s.innerHTML = `<div class="sec-head"><span class="sec-num">${num}</span><h2 style="font-size:19px">${title}</h2><div class="sec-rule"></div></div>`;
    return s;
  }

  function destroyRoute() {
    if (state.cleanupDemo) { try { state.cleanupDemo(); } catch (_) { } state.cleanupDemo = null; }
    if (state.player) { try { state.player.destroy(); } catch (_) { } state.player = null; }
    DemoKit.stopAllLoops();
    DemoKit.stopAllTimers();
    clear(content);
    content.style.removeProperty('--cat-color');
  }

  /* ---------------- router ---------------- */
  function route() {
    const hash = location.hash.replace(/^#/, '') || '/';
    const parts = hash.split('/').filter(Boolean);
    if (parts.length === 0) return renderHome();
    if (parts[0] === 'pattern' && parts[1]) return renderPattern(parts[1]);
    if (parts[0] === 'game' && parts[1]) return renderGame(parts[1]);
    if (parts[0] === 'genre' && parts[1]) return renderGenre(parts[1]);
    if (parts[0] === 'category' && parts[1]) return renderCategory(parts[1]);
    if (parts[0] === 'about') return renderAbout();
    return renderHome();
  }
  addEventListener('hashchange', route);

  /* ---------------- boot ---------------- */
  // merge GDScript ports + genre tags + Russian content into the catalogue
  (function mergeExtras() {
    if (window.PATTERN_EXTRA) {
      PATTERNS.forEach(p => {
        const x = window.PATTERN_EXTRA[p.id];
        if (!x) return;
        if (x.genres && x.genres.length) p.genres = x.genres;
        if (x.gd) p.code = p.code.concat([{ lang: 'gd', title: x.gd.title, src: x.gd.src }]);
      });
    }
  })();

  document.documentElement.lang = L();
  buildNav();
  wireLangToggle();
  localizeStatic();
  route();
})();
