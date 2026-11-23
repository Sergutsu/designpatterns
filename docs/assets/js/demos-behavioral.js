/* ============================================================
   demos-behavioral.js — behavioral pattern demos
   ============================================================ */

/* ------------------------------------------------------------
   CHAIN OF RESPONSIBILITY — approval ladder
------------------------------------------------------------ */
DEMOS.chain = function (root, cat) {
  const D = DemoKit;
  const s = D.shell('Chain · expense approval ladder', cat);
  root.appendChild(s.root);

  const ladder = [
    { name: 'Manager', limit: 5000 },
    { name: 'Senior Manager', limit: 25000 },
    { name: 'Director', limit: Infinity },
  ];

  // visual chain
  const chainBox = D.h('div', 'row');
  ladder.forEach((hnd, i) => {
    const card = D.h('div', 'sub-card', `<span class="dot"></span> ${hnd.name} <span class="muted">≤ ${hnd.limit === Infinity ? '∞' : '$' + hnd.limit.toLocaleString()}</span>`);
    card.dataset.name = hnd.name;
    chainBox.appendChild(card);
    if (i < ladder.length - 1) chainBox.appendChild(D.h('span', 'muted', '→'));
  });
  s.body.appendChild(chainBox);

  const lbl = D.h('div', 'field-label', 'claim amount');
  const slider = D.h('input', 'slider');
  slider.type = 'range'; slider.min = 100; slider.max = 60000; slider.step = 100; slider.value = 8000;
  const amt = D.h('div', 'kv', '');
  s.body.append(lbl, slider, amt);

  const log = D.makeLog(D.h('div'));
  const result = D.h('div', 'mt8');
  s.body.append(log.el, result);

  function paintAmount() { amt.innerHTML = D.kvRow('amount', '$' + (+slider.value).toLocaleString()); }
  slider.addEventListener('input', paintAmount); paintAmount();

  s.bar.appendChild(D.btn('📨 Submit claim', 'primary', run));
  let busy = false;

  function resetCards() { chainBox.querySelectorAll('.sub-card').forEach(c => c.classList.remove('on')); result.innerHTML = ''; }

  function run() {
    if (busy) return;
    busy = true; resetCards();
    const amount = +slider.value;
    const cards = [...chainBox.querySelectorAll('.sub-card')];
    log.line(`claim enters chain: <b>$${amount.toLocaleString()}</b>`, 'in');
    let i = 0;
    const timer = setInterval(() => {
      if (i > 0) cards[i - 1].classList.remove('on');
      if (i >= ladder.length) {
        clearInterval(timer); busy = false;
        result.innerHTML = `<div class="state-badge on" style="--cat-color:var(--bad)">✕ DENIED — exceeds all limits</div>`;
        return;
      }
      const hnd = ladder[i], card = cards[i];
      card.classList.add('on');
      if (amount <= hnd.limit) {
        clearInterval(timer); busy = false;
        log.line(`<b>${hnd.name}</b> handles it (≤ $${hnd.limit.toLocaleString()})`, 'out');
        result.innerHTML = `<div class="state-badge on">✅ APPROVED by ${hnd.name}</div>`;
      } else {
        log.line(`${hnd.name}: too big → escalate ↑`, 'warn');
        i++;
      }
    }, 700);
  }
};

/* ------------------------------------------------------------
   ITERATOR — playlist traversal
------------------------------------------------------------ */
DEMOS.iterator = function (root, cat) {
  const D = DemoKit;
  const s = D.shell('Iterator · playlist traversal modes', cat);
  root.appendChild(s.root);

  const tracks = [
    { title: 'Neon Rain', len: 4.2 },
    { title: 'Cargo Hold', len: 9.8 },
    { title: 'Ghost Frequency', len: 3.1 },
    { title: 'Orbital Decay', len: 12.4 },
    { title: 'Last Train to Odesa', len: 6.6 },
  ];
  let mode = 'forward';

  s.bar.appendChild(D.seg([
    { label: 'forward', value: 'forward' },
    { label: 'reverse', value: 'reverse' },
    { label: 'long only (>6m)', value: 'filter' },
  ], 'forward', v => { mode = v; idx = -1; paintList(); }));

  const list = D.h('div', 'sub-grid');
  const nowPlaying = D.h('div', 'panel tight');
  s.body.append(list, nowPlaying);

  let idx = -1;
  function visible() {
    const seq = [...tracks.keys()];
    if (mode === 'reverse') seq.reverse();
    if (mode === 'filter') return seq.filter(i => tracks[i].len > 6);
    return seq;
  }
  function paintList() {
    list.innerHTML = '';
    tracks.forEach((t, i) => {
      const inMode = visible().includes(i);
      const chip = D.h('span', 'sub-card' + (i === idx ? ' on' : ''), `${String(i + 1).padStart(2, '0')} · ${t.title} <span class="muted">${t.len}m</span>`);
      if (!inMode) chip.style.opacity = .3;
      list.appendChild(chip);
    });
  }
  function show(i) {
    idx = i; paintList();
    const t = tracks[i];
    nowPlaying.innerHTML = `<div class="kv"><span class="k">now playing</span><span class="v" style="color:var(--cat-color)">▶ ${t.title}</span></div>
      <div class="small muted mono">#${i + 1}/${tracks.length} · MoveNext() returned ${t.len} min</div>`;
  }

  const row = D.h('div', 'row mt8');
  row.append(
    D.btn('◀ Prev', '', () => step(-1)),
    D.btn('Next ▶', 'primary', () => step(1)),
    D.btn('Jump to end', '', () => { const v = visible(); show(v[v.length - 1]); }),
  );
  s.body.appendChild(row);

  function step(d) {
    const v = visible();
    if (!v.length) return;
    let pos = v.indexOf(idx);
    pos = (pos + d + v.length) % v.length;
    show(v[pos]);
  }
  paintList(); show(0);
};

/* ------------------------------------------------------------
   MEDIATOR — chat room hub
------------------------------------------------------------ */
DEMOS.mediator = function (root, cat) {
  const D = DemoKit;
  const s = D.shell('Mediator · chat room routing hub', cat);
  root.appendChild(s.root);

  const people = ['Ada', 'Grace', 'Linus'];
  let speaker = 'Ada';
  const subs = {};

  const subGrid = D.h('div', 'sub-grid');
  people.forEach(p => {
    subs[p] = true;
    const chip = D.h('span', 'sub-card on', `<span class="dot"></span> ${p}`);
    const tog = D.btn('⏏', '', null);
    tog.title = 'leave/join room';
    tog.addEventListener('click', () => {
      subs[p] = !subs[p];
      chip.classList.toggle('on', subs[p]);
      log.line(`${p} ${subs[p] ? '<b>joined</b>' : '<b>left</b>'} the room`, 'sys');
    });
    chip.appendChild(tog);
    subGrid.appendChild(chip);
  });
  s.body.appendChild(subGrid);

  s.bar.appendChild(D.seg(people.map(p => ({ label: 'speak as ' + p, value: p })), 'Ada', v => speaker = v));

  const inputRow = D.h('div', 'row mt8');
  const msgBtn = D.btn('💬 Say “gg, nice shot!”', 'primary', () => send(speaker, 'gg, nice shot!'));
  const msgBtn2 = D.btn('💬 Say “fall back!”', '', () => send(speaker, 'fall back!'));
  inputRow.append(msgBtn, msgBtn2);
  s.body.appendChild(inputRow);

  const log = D.makeLog(D.h('div'));
  s.body.appendChild(log.el);

  function send(from, msg) {
    log.line(`${from} → <b>Messenger.Send()</b> (no peer references!)`, 'in');
    const heard = people.filter(p => p !== from && subs[p]);
    if (!heard.length) log.line('hub: nobody listening…', 'warn');
    heard.forEach(p => log.line(`hub routes → <b>${p}.Receive()</b>: “${msg}”`, 'out'));
  }
};

/* ------------------------------------------------------------
   MEMENTO — calculator snapshots
------------------------------------------------------------ */
DEMOS.memento = function (root, cat) {
  const D = DemoKit;
  const s = D.shell('Memento · save / restore snapshots', cat);
  root.appendChild(s.root);

  const screen = D.h('div', 'panel', `<div style="font-family:var(--mono);font-size:34px;text-align:right;padding:14px 18px" id="calc-screen">0</div>`);
  s.body.appendChild(screen);
  const scr = screen.querySelector('#calc-screen') || screen.firstChild;

  let value = 0, pending = null, slots = [null, null, null, null, null];

  const pad = D.h('div', 'row');
  const mk = (label, fn, cls) => { const b = D.btn(label, cls, fn); pad.appendChild(b); };
  mk('+50', () => apply(v => v + 50));
  mk('−20', () => apply(v => v - 20));
  mk('×3', () => apply(v => v * 3));
  mk('÷2', () => apply(v => Math.round(v / 2)));
  s.body.appendChild(pad);

  const slotRow = D.h('div', 'row mt8');
  const slotBtns = slots.map((_, i) => {
    const b = D.btn(`Slot ${i + 1}: empty`, '', () => clickSlot(i));
    slotRow.appendChild(b);
    return b;
  });
  s.body.appendChild(slotRow);

  const log = D.makeLog(D.h('div'));
  s.body.appendChild(log.el);

  function paint() { scr.textContent = value; }
  function apply(fn) { value = fn(value); paint(); }
  function clickSlot(i) {
    if (!slots[i]) {
      slots[i] = value;
      slotBtns[i].textContent = `Slot ${i + 1}: save (${value})`;
      slotBtns[i].classList.add('on');
      log.line(`<b>Save()</b> → ResultsCache(${value}) pushed to slot ${i + 1}`, 'sys');
    } else {
      value = slots[i]; paint();
      log.line(`<b>Restore()</b> ← slot ${i + 1} → calculator is exactly ${value}`, 'out');
    }
  }
  paint();
};

/* ------------------------------------------------------------
   OBSERVER — stock ticker
------------------------------------------------------------ */
DEMOS.observer = function (root, cat) {
  const D = DemoKit;
  const s = D.shell('Observer · stock pushes to investors', cat);
  root.appendChild(s.root);

  let price = 100, running = true, t = 0;

  const subs = { Ada: true, Grace: true, Linus: true };
  const subGrid = D.h('div', 'sub-grid');
  Object.keys(subs).forEach(name => {
    const chip = D.h('span', 'sub-card on', `<span class="dot"></span> ${name}`);
    const tog = D.btn(subs[name] ? '✓' : '✕', '', () => {
      subs[name] = !subs[name];
      chip.classList.toggle('on', subs[name]);
      tog.textContent = subs[name] ? '✓' : '✕';
      log.line(`${name} ${subs[name] ? '<b>Attach()</b>' : '<b>Detach()</b>'}`, 'sys');
    });
    chip.appendChild(tog);
    subGrid.appendChild(chip);
  });

  const priceBig = D.h('div', 'panel', `<div class="mono" style="font-size:30px;font-weight:700" data-price>$100.00</div>
    <div class="small muted mono" data-delta>+0.00 (0%)</div>`);
  const log = D.makeLog(D.h('div'));

  s.bar.appendChild(D.btn('⏸ pause ticker', '', toggle));
  const tog = s.bar.querySelector('.btn');
  function toggle() { running = !running; tog.textContent = running ? '⏸ pause ticker' : '▶ resume ticker'; }

  s.body.append(subGrid, priceBig, log.el);

  const Dpr = {};
  D.rafLoop(() => {
    if (!running) return;
    t -= 1;
    if (t > 0) return;
    t = 45; // every ~45 frames
    const old = price;
    price = Math.max(5, price * (1 + (Math.random() - 0.48) * 0.06));
    const diff = price - old, pct = diff / old * 100;
    priceBig.querySelector('[data-price]').textContent = '$' + price.toFixed(2);
    priceBig.querySelector('[data-delta]').innerHTML =
      `<span style="color:${diff >= 0 ? 'var(--good)' : 'var(--bad)'}">${diff >= 0 ? '▲' : '▼'} ${Math.abs(diff).toFixed(2)} (${pct.toFixed(2)}%)</span>`;
    log.line(`Stock.SetPrice(<b>$${price.toFixed(2)}</b>) → Notify()`, 'in');
    Object.keys(subs).forEach(n => { if (subs[n]) log.line(`push → <b>${n}.Update(stock)</b>`, 'out'); });
  });
  log.line('stock created; 3 investors Attach()', 'sys');
};

/* ------------------------------------------------------------
   STATE — account tiers
------------------------------------------------------------ */
DEMOS.state = function (root, cat) {
  const D = DemoKit;
  const s = D.shell('State · Bronze → Silver → Gold', cat);
  root.appendChild(s.root);

  const states = [
    { name: 'Bronze', min: 0, fee: 0.02 },
    { name: 'Silver', min: 50000, fee: 0.01 },
    { name: 'Gold', min: 200000, fee: 0 },
  ];
  let balance = 0, stateIdx = 0;

  const badges = D.h('div', 'state-badges');
  const badgeEls = states.map(st => {
    const b = D.h('span', 'state-badge', st.name);
    badges.appendChild(b);
    return b;
  });
  const balEl = D.h('div', 'kv', '');
  const feeEl = D.h('div', 'kv', '');
  s.body.append(badges, D.h('div', 'row mt8').append(balEl, feeEl));

  const amounts = [20000, 40000, 150000];
  const row = D.h('div', 'row mt8');
  amounts.forEach(a => row.appendChild(D.btn(`Deposit $${a.toLocaleString()}`, 'primary', () => deposit(a))));
  row.appendChild(D.btn('Withdraw $30,000', '', () => withdraw(30000)));
  s.body.appendChild(row);

  const log = D.makeLog(D.h('div'));
  s.body.appendChild(log.el);

  function tierFor(b) {
    let idx = 0;
    states.forEach((st, i) => { if (b >= st.min) idx = i; });
    return idx;
  }
  function paint() {
    badgeEls.forEach((b, i) => b.classList.toggle('on', i === stateIdx));
    balEl.innerHTML = D.kvRow('balance', '$' + balance.toLocaleString());
    feeEl.innerHTML = D.kvRow('tier fee', (states[stateIdx].fee * 100).toFixed(0) + '%', 'good');
  }
  function transitionTo(next) {
    if (next === stateIdx) return;
    log.line(`<b>${states[stateIdx].name}</b> hands over → <b>${states[next].name}State</b> installed`, 'sys');
    stateIdx = next;
  }
  function deposit(a) {
    balance += a;
    log.line(`Deposit($${a.toLocaleString()}) → State.Deposit(this)`, 'in');
    transitionTo(tierFor(balance));
    paint();
  }
  function withdraw(a) {
    balance = Math.max(0, balance - a);
    log.line(`Withdraw($${a.toLocaleString()}) → re-tier check`, 'in');
    transitionTo(tierFor(balance));
    paint();
  }
  paint();
  log.line('account created → <b>BronzeState</b>', 'sys');
};

/* ------------------------------------------------------------
   STRATEGY — vehicle physics cartridges on canvas
------------------------------------------------------------ */
DEMOS.strategy = function (root, cat) {
  const D = DemoKit;
  const s = D.shell('Strategy · hot-swap movement logic', cat);
  root.appendChild(s.root);

  const strategies = {
    road: { name: 'RunningLogic', lane: 150, speed: 190, color: '#ffd166', ground: '#2a2114', label: 'asphalt' },
    water: { name: 'FloatingLogic', lane: 230, speed: 95, color: '#4cc9f0', ground: '#12233a', label: 'waves' },
    air: { name: 'FlyingLogic', lane: 70, speed: 300, color: '#f72585', ground: '#0d1524', label: 'sky' },
  };
  let cur = 'road';

  s.bar.appendChild(D.seg(Object.entries(strategies).map(([k, v]) => ({ label: v.name, value: k })), 'road',
    v => { cur = v; log.line(`Vehicle.EngineLogic = new <b>${strategies[v].name}</b>() — swapped live`, 'sys'); }));

  const { stage, ctx, W, H } = D.canvasStage(620, 280);
  s.body.appendChild(stage);

  const chips = D.h('div', 'stage-hud');
  const cSpeed = D.h('span', 'hud-chip', '');
  const cMed = D.h('span', 'hud-chip', '');
  const cPos = D.h('span', 'hud-chip', '');
  chips.append(cSpeed, cMed, cPos);
  stage.appendChild(chips);

  const log = D.makeLog(D.h('div'));
  s.body.appendChild(log.el);

  let x = 60;
  D.rafLoop(dt => {
    const st = strategies[cur];
    x = (x + st.speed * dt) % (W + 60);
    ctx.clearRect(0, 0, W, H);

    // sky/ground split per medium
    ctx.fillStyle = '#0d1119'; ctx.fillRect(0, 0, W, st.lane);
    ctx.fillStyle = st.ground; ctx.fillRect(0, st.lane, W, H - st.lane);
    ctx.strokeStyle = '#2b3652'; ctx.beginPath();
    ctx.moveTo(0, st.lane); ctx.lineTo(W, st.lane); ctx.stroke();

    // ambient details
    ctx.globalAlpha = .5;
    for (let i = 0; i < 12; i++) {
      const px = ((i * 97 - x * (cur === 'air' ? .1 : .3)) % W + W) % W;
      if (cur === 'air') { ctx.fillStyle = '#1b2a44'; ctx.fillRect(px, 20 + (i * 31) % 80, 26, 3); }
      else if (cur === 'water') { ctx.fillStyle = '#1d3f5e'; ctx.fillRect(px, st.lane + 12 + (i * 17) % 50, 34, 2); }
      else { ctx.fillStyle = '#3a3122'; ctx.fillRect(px, st.lane + 14 + (i * 23) % 60, 18, 3); }
    }
    ctx.globalAlpha = 1;

    // vehicle
    const bob = Math.sin(performance.now() / 160) * (cur === 'air' ? 5 : 2);
    ctx.save(); ctx.translate(x, st.lane - 26 + bob);
    ctx.fillStyle = st.color;
    ctx.shadowColor = st.color; ctx.shadowBlur = 16;
    if (cur === 'air') {
      ctx.beginPath(); ctx.moveTo(-22, 8); ctx.lineTo(22, 0); ctx.lineTo(-22, -8); ctx.closePath(); ctx.fill();
    } else {
      ctx.beginPath(); ctx.roundRect(-20, -8, 40, 16, 5); ctx.fill();
    }
    ctx.restore();

    cSpeed.innerHTML = `speed: <b>${st.speed} u/s</b>`;
    cMed.innerHTML = `medium: <b>${st.label}</b>`;
    cPos.innerHTML = `x: <b>${Math.round(x)}</b>`;
  });
  log.line('vehicle starts with <b>RunningLogic</b> — watch it swap cartridges', 'sys');
};

/* ------------------------------------------------------------
   TEMPLATE METHOD — pipeline stages
------------------------------------------------------------ */
DEMOS.template = function (root, cat) {
  const D = DemoKit;
  const s = D.shell('Template Method · fixed recipe, pluggable cipher', cat);
  root.appendChild(s.root);

  let algo = 'TripleDES';
  s.bar.appendChild(D.seg([
    { label: 'TripleDES', value: 'TripleDES' },
    { label: 'RSA', value: 'RSA' },
  ], 'TripleDES', v => algo = v));

  const stages = ['Validate(input)', 'Encrypt(validated)', 'Base64(output)'];
  const badges = stages.map(st => {
    const b = D.h('span', 'state-badge', st);
    return b;
  });
  const badgeRow = D.h('div', 'state-badges');
  badges.forEach(b => badgeRow.appendChild(b));
  const out = D.h('div', 'output-block', '// output appears here');
  s.body.append(badgeRow, out);

  const log = D.makeLog(D.h('div'));
  s.body.appendChild(log.el);
  s.bar.appendChild(D.btn('🔐 EncryptText("attack at dawn")', 'primary', run));
  let busy = false;

  function run() {
    if (busy) return;
    busy = true;
    badges.forEach(b => b.classList.remove('on'));
    log.line(`<b>EncryptText()</b> template invoked on ${algo}Encryption`, 'in');
    let i = 0;
    const timer = setInterval(() => {
      if (i > 0) badges[i - 1].classList.remove('on');
      if (i >= stages.length) {
        clearInterval(timer); busy = false;
        const fake = Array.from({ length: 24 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'[Math.floor(Math.random() * 64)]).join('');
        out.textContent = fake + (algo === 'RSA' ? '==\n// 2048-bit OAEP' : '=\n// CBC + PKCS7');
        log.line('<b>recipe complete</b> — only the middle step was algorithm-specific', 'sys');
        return;
      }
      badges[i].classList.add('on');
      if (i === 1) log.line(`${algo} supplies the <b>deferred step</b>: Encrypt()`, 'warn');
      else log.line('fixed step → ' + stages[i], 'out');
      i++;
    }, 600);
  }
};

/* ------------------------------------------------------------
   VISITOR — double dispatch exporters
------------------------------------------------------------ */
DEMOS.visitor = function (root, cat) {
  const D = DemoKit;
  const s = D.shell('Visitor · Text vs Xml export passes', cat);
  root.appendChild(s.root);

  const nodes = [
    { type: 'employee', name: 'Ada Lovelace', role: 'Engineer' },
    { type: 'address', city: 'London', street: '12 Analytical Ave' },
    { type: 'contact', email: 'ada@engines.dev', phone: '+44 20 7946 0010' },
    { type: 'employee', name: 'Grace Hopper', role: 'Admiral' },
  ];

  const nodeList = D.h('div', 'sub-grid');
  nodes.forEach(n => {
    const label = n.type === 'employee' ? `👤 ${n.name}` : n.type === 'address' ? `📍 ${n.city}` : `✉ ${n.email}`;
    nodeList.appendChild(D.h('span', 'sub-card', label));
  });
  const out = D.h('div', 'output-block', '// pick an exporter');
  s.body.append(nodeList, out);

  const textV = {
    employee: n => `EMPLOYEE|${n.name}|${n.role}`,
    address: n => `ADDRESS|${n.city}|${n.street}`,
    contact: n => `CONTACT|${n.email}|${n.phone}`,
  };
  const xmlV = {
    employee: n => `<employee name="${n.name}" role="${n.role}"/>`,
    address: n => `<address city="${n.city}" street="${n.street}"/>`,
    contact: n => `<contact email="${n.email}" phone="${n.phone}"/>`,
  };

  s.bar.appendChild(D.btn('Export as Text', '', () => run(textV, 'TextVisitor')));
  s.bar.appendChild(D.btn('Export as XML', 'primary', () => run(xmlV, 'XmlVisitor')));

  const log = D.makeLog(D.h('div'));
  s.body.appendChild(log.el);

  function run(visitor, name) {
    out.textContent = '';
    log.line(`client walks structure → each node <b>Accept(${name})</b>`, 'in');
    nodes.forEach(n => {
      const line = visitor[n.type](n);
      out.textContent += line + '\n';
      log.line(`${n.type}.Accept → Visit(this) ⇒ ${line.slice(0, 42)}${line.length > 42 ? '…' : ''}`, 'out');
    });
    log.line(`<b>${name}</b> added a whole operation — zero edits to element classes`, 'sys');
  }
};
