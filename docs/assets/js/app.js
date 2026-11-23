/* ============================================================
   app.js — router, rendering, nav, highlighter
   ============================================================ */
(function () {
  const $ = sel => document.querySelector(sel);
  const $$ = sel => [...document.querySelectorAll(sel)];

  /* ---------------- syntax highlighter ---------------- */
  const KW = new Set(('var let const function return if else for while class new this super extends import export from default ' +
    'public private protected readonly static abstract interface void int float double decimal string bool using namespace get set out ' +
    'override virtual sealed foreach in of do switch case break continue try catch finally throw lock null true false undefined NaN ' +
    'typeof instanceof yield async await delegate enum struct event params ref base is as object var').split(' '));

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function tokenize(src) {
    const re = /(\/\/[^\n]*)|(\/\*[\s\S]*?\*\/)|('(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`)|(\b\d[\d_]*(?:\.\d+)?[fFmM]?\b)|([A-Za-z_$][\w$]*)|(\s+)|(.)/g;
    const out = [];
    let m;
    while ((m = re.exec(src))) {
      const [full, com, , str, num, ident, ws] = m;
      if (com) out.push(['com', com]);
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

  function highlightHTML(src) {
    return tokenize(src).map(([cls, text]) =>
      cls === 'plain' ? esc(text) : `<span class="tok-${cls}">${esc(text)}</span>`).join('');
  }

  function highlightLines(src) {
    const html = highlightHTML(src);
    return html.split('\n').map((l, i) => `<span class="cl">${l || ' '}</span>`).join('');
  }

  /* ---------------- helpers ---------------- */
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

  /* ---------------- nav ---------------- */
  function buildNav() {
    const nav = $('#nav-patterns');
    clear(nav);
    CAT_ORDER.forEach(cat => {
      const meta = CATEGORIES[cat];
      const sec = h('div', 'nav-section');
      sec.style.setProperty('--nav-color', meta.color);
      sec.appendChild(h('div', 'nav-section-title', `<span class="dot ${cat}"></span>${meta.label}`));
      PATTERNS.filter(p => p.cat === cat).forEach(p => {
        const a = h('a', 'nav-link', `<span class="num">${p.num}</span><span>${p.name}</span>`);
        a.href = '#/pattern/' + p.id;
        a.dataset.pid = p.id;
        sec.appendChild(a);
      });
      nav.appendChild(sec);
    });
    // utility links
    const sec = h('div', 'nav-section');
    sec.appendChild(h('div', 'nav-section-title', '<span class="dot" style="background:#6b7690"></span>Dossier'));
    [['#/category/all', 'All patterns'], ['#/about', 'About & method']].forEach(([href, label]) => {
      const a = h('a', 'nav-link', `<span>${label}</span>`);
      a.href = href; a.dataset.route = href.slice(2);
      sec.appendChild(a);
    });
    nav.appendChild(sec);
  }

  function markActive(id) {
    $$('.nav-link').forEach(a => a.classList.toggle('active', a.dataset.pid === id));
  }

  function searchFilter(q) {
    q = q.trim().toLowerCase();
    $$('#nav-patterns .nav-link[data-pid]').forEach(a => {
      const p = byId(a.dataset.pid);
      const hit = !q || (p.name + ' ' + p.tagline + ' ' + p.intent).toLowerCase().includes(q);
      a.classList.toggle('hidden-by-search', !hit);
    });
    $$('#nav-patterns .nav-section').forEach(sec => {
      const any = [...sec.querySelectorAll('.nav-link[data-pid]')].some(a => !a.classList.contains('hidden-by-search'));
      const isDossier = !sec.querySelector('[data-pid]');
      sec.style.display = any || (isDossier && !q) ? '' : 'none';
    });
    const grid = $('#home-grid');
    if (grid) {
      [...grid.children].forEach(card => {
        const p = byId(card.dataset.pid);
        card.style.display = !q || (p.name + ' ' + p.tagline).toLowerCase().includes(q) ? '' : 'none';
      });
    }
  }
  $('#nav-search').addEventListener('input', e => searchFilter(e.target.value));

  /* ---------------- breadcrumb ---------------- */
  function crumb(parts) {
    const b = $('#breadcrumb');
    clear(b);
    b.appendChild(h('a', '', '⌂ dossier'));
    b.firstChild.href = '#/';
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
    crumb([{ label: 'overview' }]);

    const counts = {};
    CAT_ORDER.forEach(c => counts[c] = PATTERNS.filter(p => p.cat === c).length);
    const demos = PATTERNS.filter(p => p.demo).length;

    const hero = h('section', 'hero');
    hero.innerHTML = `
      <canvas id="hero-canvas"></canvas>
      <div class="hero-inner">
        <div class="hero-kicker">interactive research dossier</div>
        <h1>Design patterns for <span class="grad">games</span>, dissected live.</h1>
        <p class="lede">The GoF classics reimagined for engines and gameplay — every pattern with an animated structure,
        a step-through choreography, runnable code, and a playable micro-demo. Built from the C# research in this repository,
        plus the patterns real studios actually reach for first.</p>
        <div class="row">
          <a class="btn primary" href="#/pattern/observer" style="text-decoration:none">▶ Start with Observer</a>
          <a class="btn" href="#/category/bonus" style="text-decoration:none">Game-engine extras ↗</a>
        </div>
        <div class="hero-stats">
          <div class="stat-chip"><div class="v">${PATTERNS.length}</div><div class="k">patterns</div></div>
          <div class="stat-chip"><div class="v">${demos}</div><div class="k">live demos</div></div>
          <div class="stat-chip"><div class="v">${PATTERNS.reduce((a, p) => a + p.steps.length, 0)}</div><div class="k">choreography steps</div></div>
          <div class="stat-chip"><div class="v">${PATTERNS.reduce((a, p) => a + p.code.length, 0)}</div><div class="k">code samples</div></div>
        </div>
      </div>`;
    content.appendChild(hero);

    const catGrid = h('div', 'cat-grid');
    CAT_ORDER.forEach(cat => {
      const meta = CATEGORIES[cat];
      const a = h('a', 'cat-card', `
        <h3><span class="cat-swatch" style="--cat-color:${meta.color}"></span>${meta.label}</h3>
        <p>${meta.blurb}</p>
        <span class="count">${counts[cat]} patterns →</span>`);
      a.href = '#/category/' + cat;
      a.style.setProperty('--cat-color', meta.color);
      catGrid.appendChild(a);
    });
    content.appendChild(h('div', 'section', ''));
    content.lastChild.appendChild(h('div', 'sec-head', `<span class="sec-num">01</span><h2>The three families + engine extras</h2><div class="sec-rule"></div>`));
    content.lastChild.appendChild(catGrid);

    content.appendChild(h('div', 'section', ''));
    content.lastChild.appendChild(h('div', 'sec-head', `<span class="sec-num">02</span><h2>Full catalogue</h2><div class="sec-rule"></div>`));
    const grid = h('div', 'pattern-grid'); grid.id = 'home-grid';
    PATTERNS.forEach(p => grid.appendChild(patternCard(p)));
    content.lastChild.appendChild(grid);

    const notes = h('div', 'section');
    notes.innerHTML = `<div class="sec-head"><span class="sec-num">03</span><h2>How to read this dossier</h2><div class="sec-rule"></div></div>
      <div class="two-col">
        <div class="panel"><h3>🎬 Choreography, not just UML</h3>
          <p class="muted">Each pattern ships with an animated runtime walkthrough. Press <b>Play</b> to watch calls flow
          through the participants instead of squinting at static boxes.</p></div>
        <div class="panel"><h3>🕹 Every claim is runnable</h3>
          <p class="muted">Interactive demos are real simulations of the pattern's mechanics — swap strategies mid-flight,
          fire 5 000 pooled bullets, watch the event queue drain. Nothing is a screenshot.</p></div>
        <div class="panel"><h3>📦 Rooted in the repo</h3>
          <p class="muted">Every structural/behavioral/creational entry links its original C# file in this repository and
          pairs it with a JavaScript port for the browser.</p></div>
        <div class="panel"><h3>⚠️ Honest caveats</h3>
          <p class="muted">Patterns include “when it hurts” notes: where they become anti-patterns and what modern engines
          do instead.</p></div>
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
      <div class="pc-top"><h3>${p.name}</h3><span class="mini-tag cat">${meta.label}</span></div>
      <div class="tag">${p.tagline}</div>
      <div class="pc-foot">
        ${p.demo ? '<span class="mini-tag" style="color:var(--good);border-color:rgba(128,237,153,.4)">● live demo</span>' : ''}
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
    // stop when leaving home
    const obs = new MutationObserver(() => { if (!cv.isConnected) { alive = false; obs.disconnect(); } });
    obs.observe(content, { childList: true });
  }

  /* ---------------- category view ---------------- */
  function renderCategory(cat) {
    destroyRoute();
    markActive(null);
    const list = cat === 'all' ? PATTERNS : PATTERNS.filter(p => p.cat === cat);
    crumb([{ label: cat === 'all' ? 'all patterns' : CATEGORIES[cat].label }]);
    const sec = h('div', 'section');
    sec.appendChild(h('div', 'sec-head',
      `<span class="sec-num">▣</span><h2>${cat === 'all' ? 'All patterns' : CATEGORIES[cat].label + ' patterns'} · ${list.length}</h2><div class="sec-rule"></div>`));
    const grid = h('div', 'pattern-grid'); grid.id = 'home-grid';
    list.forEach(p => grid.appendChild(patternCard(p)));
    sec.appendChild(grid);
    content.appendChild(sec);
    startHeroCanvasStopHack();
  }
  function startHeroCanvasStopHack() { /* canvas loop stops itself via MutationObserver */ }

  /* ---------------- about ---------------- */
  function renderAbout() {
    destroyRoute();
    markActive(null);
    crumb([{ label: 'about & method' }]);
    const sec = h('div', 'section');
    sec.innerHTML = `
      <div class="sec-head"><span class="sec-num">✦</span><h2>About this dossier</h2><div class="sec-rule"></div></div>
      <div class="panel">
        <p>This site is an interactive reinterpretation of the design-patterns research contained in the repository —
        originally a C# console walkthrough of the Gang of Four patterns (see <a href="${REPO}README.md">README.md</a>).
        The dossier keeps every pattern's intent and example, adds game-development framing, animated choreography and
        runnable JavaScript ports, and appends six patterns that engines reach for daily but the GoF book never covered.</p>
        <h3 class="mt16">Sources</h3>
        <ul class="note-list">
          <li><b>Repository code</b> — each pattern page links its original <span class="mono">.cs</span> file.</li>
          <li><b>E. Gamma, R. Helm, R. Johnson, J. Vlissides</b> — “Design Patterns: Elements of Reusable Object-Oriented Software” (GoF, 1994).</li>
          <li><b>R. Nystrom</b> — “Game Programming Patterns” (2014): Command, Object Pool, Game Loop, Event Queue, Spatial Partition, Component.</li>
        </ul>
        <h3 class="mt16">How the demos work</h3>
        <p class="muted">Everything runs locally in your browser: no build step, no dependencies, no tracking.
        Open any page source and the whole dossier is plain HTML/CSS/JS served statically.</p>
        <div class="row mt16">
          <a class="btn" href="${REPO}" target="_blank" rel="noopener">View source on GitHub ↗</a>
          <a class="btn primary" href="#/">← back to the dossier</a>
        </div>
      </div>`;
    content.appendChild(sec);
  }

  /* ---------------- pattern detail ---------------- */
  function renderPattern(id) {
    const p = byId(id);
    if (!p) { renderHome(); return; }
    destroyRoute();
    markActive(id);
    crumb([
      { label: CATEGORIES[p.cat].label, href: '#/category/' + p.cat },
      { label: p.name },
    ]);
    const color = CATEGORIES[p.cat].color;
    content.style.setProperty('--cat-color', color);

    /* head */
    const head = h('div', 'pattern-head');
    head.style.setProperty('--cat-color', color);
    head.innerHTML = `
      <div class="tagrow" style="margin-top:0">
        <span class="chip cat">${p.num} · ${CATEGORIES[p.cat].label}</span>
        ${p.demo ? '<span class="chip demo-chip">● has live demo</span>' : ''}
        ${FILE_MAP[p.id] ? `<a class="chip" href="${REPO}${FILE_MAP[p.id]}" target="_blank" rel="noopener">view .cs in repo ↗</a>` : '<span class="chip">engine-native pattern</span>'}
      </div>
      <h1>${p.name}</h1>
      ${p.aka ? `<div class="aka">a.k.a. <b>${Array.isArray(p.aka) ? p.aka.join(', ') : p.aka}</b></div>` : ''}
      <p class="tagline">${p.tagline}</p>`;
    content.appendChild(head);

    /* intent */
    content.appendChild(sectionHead('A', 'Intent'));
    content.appendChild(h('div', 'intent-quote', `<span class="lbl">official intent</span>${p.intent}`));

    /* game framing */
    content.appendChild(sectionHead('B', 'Why games care'));
    const gp = h('div', 'panel');
    gp.innerHTML = `<h3 style="color:var(--cat-color);font-size:15px;margin-bottom:8px">${p.gameTitle}</h3>
      <p class="muted" style="margin:0 0 10px">${p.gameBody}</p>
      <ul class="note-list">${p.gameBullets.map(b => `<li>${b}</li>`).join('')}</ul>`;
    content.appendChild(gp);

    /* diagram + choreography */
    content.appendChild(sectionHead('C', 'Structure & choreography'));
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
      state.player = DiagramKit.createPlayer(playerRoot, p.steps, refs, { interval: 2200 });
    }

    /* code */
    if (p.code.length) {
      content.appendChild(sectionHead('D', 'Code — repository & port'));
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
        const t = h('button', 'code-tab' + (i === 0 ? ' active' : ''), `${c.lang === 'csharp' ? 'C#' : 'JS'} · ${c.title}`);
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
        pre.innerHTML = highlightLines(c.src);
      }
      paint(0);
      cw.append(tabs, win);
      content.appendChild(cw);
    }

    /* demo */
    if (p.demo && DEMOS[p.demo]) {
      content.appendChild(sectionHead('E', 'Live playground'));
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
    content.appendChild(sectionHead('F', 'Field notes'));
    const two = h('div', 'two-col');
    const useP = h('div', 'panel');
    useP.innerHTML = `<h3 style="font-size:14px;color:var(--good);margin-bottom:10px">✓ reach for it when…</h3>
      <ul class="note-list">${p.use.map(u => `<li>${u}</li>`).join('')}</ul>`;
    const badP = h('div', 'panel');
    badP.innerHTML = `<h3 style="font-size:14px;color:var(--bad);margin-bottom:10px">⚠ it hurts when…</h3>
      <ul class="note-list">${p.pitfalls.map(u => `<li>${u}</li>`).join('')}</ul>`;
    two.append(useP, badP);
    content.appendChild(two);

    /* related */
    if (p.related.length) {
      content.appendChild(sectionHead('G', 'See also'));
      const strip = h('div', 'related-strip');
      p.related.map(byId).filter(Boolean).forEach(r => {
        const a = h('a', 'related-card', `<span class="rn">${r.num}</span> ${r.name} <span class="rl">· ${r.tagline}</span>`);
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
    if (parts[0] === 'category' && parts[1]) return renderCategory(parts[1]);
    if (parts[0] === 'about') return renderAbout();
    return renderHome();
  }
  addEventListener('hashchange', route);

  /* ---------------- boot ---------------- */
  buildNav();
  route();
})();
