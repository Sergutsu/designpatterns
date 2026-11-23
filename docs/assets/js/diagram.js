/* ============================================================
   diagram.js — SVG UML-lite renderer + step-through player
   ============================================================ */
(function () {
  const NS = 'http://www.w3.org/2000/svg';

  function svgEl(tag, attrs, parent) {
    const el = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) {
      if (attrs[k] == null) continue;
      el.setAttribute(k, attrs[k]);
    }
    if (parent) parent.appendChild(el);
    return el;
  }

  const NODE_W = 158, NODE_H = 46, NODE_H_TALL = 62;
  const LANE_GAP = 210, PAD_X = 34, PAD_Y = 42;

  const KIND_STYLE = {
    interface: { stroke: '#3d6a97', fill: '#12233a', stereo: '«interface»' },
    abstract:  { stroke: '#5b4d95', fill: '#1d1a30', stereo: '«abstract»' },
    concrete:  { stroke: '#3d7a97', fill: '#152330', stereo: '' },
    client:    { stroke: '#8a4772', fill: '#241a26', stereo: '«client»' },
    subsystem: { stroke: '#4d7a45', fill: '#1c2418', stereo: '' },
    instance:  { stroke: '#97773d', fill: '#2a2114', stereo: '' },
    context:   { stroke: '#97773d', fill: '#2a2114', stereo: '' },
    data:      { stroke: '#6b7690', fill: '#161b28', stereo: '' },
  };

  /**
   * Render a class diagram.
   * spec = { nodes:[{id,name,kind,stereo?,sub?,lane}], edges:[{from,to,label?,kind?}] }
   * Returns { svg, nodeEls:Map(id->g), edgeEls:[{g,path,labelEl}], size:{w,h} }
   */
  function renderDiagram(spec) {
    // --- layout ---
    const lanes = new Map();
    spec.nodes.forEach(n => {
      if (!lanes.has(n.lane)) lanes.set(n.lane, []);
      lanes.get(n.lane).push(n);
    });
    const pos = new Map();
    let maxRows = 0;
    [...lanes.keys()].sort((a, b) => a - b).forEach(lane => {
      const arr = lanes.get(lane);
      maxRows = Math.max(maxRows, arr.length);
      arr.forEach((n, i) => {
        pos.set(n.id, { x: PAD_X + lane * LANE_GAP, y: PAD_Y + i * 108 });
      });
    });

    const laneMax = lanes.size ? Math.max(...lanes.keys()) : 0;
    const W = PAD_X * 2 + laneMax * LANE_GAP + NODE_W;
    const H = PAD_Y * 2 + Math.max(0, maxRows - 1) * 108 + NODE_H_TALL;

    const svg = svgEl('svg', {
      class: 'diagram', viewBox: `0 0 ${W} ${H}`,
      width: W, height: H, role: 'img',
    });

    // defs / markers
    const defs = svgEl('defs', {}, svg);
    function marker(id, kind) {
      const m = svgEl('marker', {
        id, viewBox: '0 0 10 10', refX: '9', refY: '5',
        markerWidth: '7.5', markerHeight: '7.5', orient: 'auto-start-reverse',
      }, defs);
      if (kind === 'triangle') {
        svgEl('path', { d: 'M 0 1 L 9 5 L 0 9 z', fill: '#0d1119', stroke: '#8fa3c8', 'stroke-width': '1' }, m);
      } else if (kind === 'diamond') {
        svgEl('path', { d: 'M 0 5 L 5 1 L 10 5 L 5 9 z', fill: '#0d1119', stroke: '#8fa3c8', 'stroke-width': '1' }, m);
      } else if (kind === 'diamond-fill') {
        svgEl('path', { d: 'M 0 5 L 5 1 L 10 5 L 5 9 z', fill: '#8fa3c8' }, m);
      } else {
        svgEl('path', { d: 'M 0 1 L 9 5 L 0 9', fill: 'none', stroke: '#8fa3c8', 'stroke-width': '1.2' }, m);
      }
    }
    const uid = 'm' + Math.random().toString(36).slice(2, 8);
    marker(uid + '-arr', 'arrow');
    marker(uid + '-tri', 'triangle');
    marker(uid + '-dia', 'diamond');
    marker(uid + '-diaf', 'diamond-fill');

    const gEdges = svgEl('g', {}, svg);
    const gNodes = svgEl('g', {}, svg);

    // --- edges first (under nodes) ---
    const edgeEls = [];
    (spec.edges || []).forEach(e => {
      const a = pos.get(e.from), b = pos.get(e.to);
      if (!a || !b) return;
      const ha = a.y + NODE_H / 2, hb = b.y + NODE_H / 2;
      const aRight = a.x + NODE_W, bRight = b.x + NODE_W;

      // choose sides
      let x1, y1, x2, y2;
      if (b.x > a.x) {           // forward: right -> left
        x1 = aRight; y1 = ha; x2 = b.x; y2 = hb;
      } else if (b.x < a.x) {    // backward: left -> right
        x1 = a.x; y1 = ha; x2 = bRight; y2 = hb;
      } else {                   // same lane: bottom -> top with jog
        x1 = a.x + NODE_W / 2; y1 = a.y + NODE_H;
        x2 = b.x + NODE_W / 2; y2 = b.y - 2;
      }

      const kind = e.kind || 'assoc';
      const dashed = (kind === 'dep' || kind === 'impl') || !!e.dashed;
      const mx = (x1 + x2) / 2;
      let d, labelX = mx, labelY = (y1 + y2) / 2 - 6;
      if (e.from === e.to) {
        // self-loop arcing above the node
        const cx = a.x + NODE_W + 52;
        d = `M ${a.x + NODE_W} ${a.y + 6} C ${cx} ${a.y - 34}, ${cx} ${a.y - 34}, ${a.x + NODE_W} ${a.y + NODE_H - 6}`;
        labelX = cx; labelY = a.y - 30;
      } else if (Math.abs(y2 - y1) < 0.5 && b.x !== a.x) {
        d = `M ${x1} ${y1} L ${x2} ${y2}`;
      } else if (b.x === a.x) {
        d = `M ${x1} ${y1} C ${x1 + 60} ${y1 + 30}, ${x2 + 60} ${y2 - 30}, ${x2} ${y2}`;
      } else {
        d = `M ${x1} ${y1} L ${mx} ${y1} L ${mx} ${y2} L ${x2} ${y2}`;
      }

      const mk = kind === 'inherit' || kind === 'impl' ? uid + '-tri'
        : kind === 'comp' ? uid + '-diaf'
        : kind === 'aggr' ? uid + '-dia'
        : uid + '-arr';
      const path = svgEl('path', {
        d, class: 'dg-edge' + (dashed ? ' dashed' : ''),
        'marker-end': `url(#${mk})`, 'marker-start': (kind === 'aggr' || kind === 'comp') ? `url(#${mk})` : null,
      }, gEdges);
      // diamond at source end: use marker-start on a reversed short trick — simpler: skip start marker

      let labelEl = null;
      if (e.label) {
        labelEl = svgEl('text', {
          class: 'dg-edge-label', 'text-anchor': 'middle',
          x: labelX, y: labelY,
        }, gEdges);
        labelEl.textContent = e.label;
      }
      edgeEls.push({ g: gEdges, path, labelEl, edge: e, x1, y1, x2, y2 });
    });

    // --- nodes ---
    const nodeEls = new Map();
    spec.nodes.forEach(n => {
      const p = pos.get(n.id);
      const st = KIND_STYLE[n.kind] || KIND_STYLE.concrete;
      const tall = !!n.sub;
      const h = tall ? NODE_H_TALL : NODE_H;
      const g = svgEl('g', { class: `dg-node kind-${n.kind}`, 'data-id': n.id }, gNodes);
      svgEl('rect', {
        class: 'body', x: p.x, y: p.y, width: NODE_W, height: h, rx: 10,
        stroke: st.stroke, fill: st.fill, 'stroke-width': '1.2',
      }, g);

      const stereo = n.stereo != null ? n.stereo : st.stereo;
      let ty = p.y + 16;
      if (stereo) {
        const s = svgEl('text', { x: p.x + NODE_W / 2, y: ty, 'text-anchor': 'middle', class: 'stereo', 'font-size': '9.5' }, g);
        s.textContent = stereo; ty += 15;
      }
      const t = svgEl('text', { x: p.x + NODE_W / 2, y: ty + 2, 'text-anchor': 'middle', 'font-size': '12.5', 'font-weight': '700' }, g);
      t.textContent = n.name;
      if (n.sub) {
        const s2 = svgEl('text', { x: p.x + NODE_W / 2, y: ty + 19, 'text-anchor': 'middle', class: 'sublabel', 'font-size': '9.5' }, g);
        s2.textContent = n.sub;
      }
      nodeEls.set(n.id, g);
    });

    return { svg, nodeEls, edgeEls, size: { w: W, h: H } };
  }

  /* ---------- step-through player ---------- */
  function createPlayer(root, steps, refs, opts) {
    opts = opts || {};
    const STR = {
      ready1: opts.ready1 || 'ready',
      ready2: opts.ready2 || 'Press <b>Play</b> or <b>Next</b> to walk through the pattern’s runtime choreography.',
      prev: opts.prev || '◀ Prev',
      next: opts.next || 'Next ▶',
      play: opts.play || '▶ Play',
      pause: opts.pause || '⏸ Pause',
    };
    let idx = -1, timer = null;
    root.classList.add('seq-player');

    const caption = document.createElement('div');
    caption.className = 'seq-caption';
    const controls = document.createElement('div');
    controls.className = 'seq-controls';

    const btnPrev = document.createElement('button'); btnPrev.className = 'seq-btn'; btnPrev.textContent = STR.prev;
    const btnNext = document.createElement('button'); btnNext.className = 'seq-btn'; btnNext.textContent = STR.next;
    const btnPlay = document.createElement('button'); btnPlay.className = 'seq-btn primary'; btnPlay.textContent = STR.play;
    const dots = document.createElement('div'); dots.className = 'seq-dots';

    controls.append(btnPrev, btnNext, btnPlay, dots);
    root.append(caption, controls);

    const dotEls = steps.map((_, i) => {
      const d = document.createElement('button');
      d.className = 'seq-dot'; d.title = `Step ${i + 1}`;
      d.addEventListener('click', () => { stop(); go(i); });
      dots.appendChild(d);
      return d;
    });

    function paint() {
      refs.nodeEls.forEach(g => { g.classList.remove('glow', 'dimmed'); });
      refs.edgeEls.forEach(e2 => {
        e2.path.classList.remove('glow', 'dimmed');
        if (e2.labelEl) e2.labelEl.classList.remove('glow');
      });
      if (idx < 0) {
        caption.innerHTML = `<span class="step-badge">${STR.ready1}</span><span>${STR.ready2}</span>`;
        dotEls.forEach(d => d.classList.remove('on'));
        btnPrev.disabled = true; btnNext.disabled = steps.length === 0;
        return;
      }
      const st = steps[idx];
      const hi = new Set(st.hi || []);
      refs.nodeEls.forEach((g, id) => {
        if (hi.size === 0) return;
        if (hi.has(id)) g.classList.add('glow');
        else g.classList.add('dimmed');
      });
      refs.edgeEls.forEach(e2 => {
        const on = hi.has(e2.edge.from) && hi.has(e2.edge.to);
        if (hi.size && on) { e2.path.classList.add('glow'); if (e2.labelEl) e2.labelEl.classList.add('glow'); }
        else if (hi.size) e2.path.classList.add('dimmed');
      });
      caption.innerHTML = `<span class="step-badge">${idx + 1} / ${steps.length}</span><span>${st.text}</span>`;
      dotEls.forEach((d, i) => d.classList.toggle('on', i === idx));
      btnPrev.disabled = idx <= 0;
      btnNext.disabled = idx >= steps.length - 1;
    }

    function go(i) { idx = Math.max(-1, Math.min(steps.length - 1, i)); paint(); }
    function stop() { if (timer) { clearInterval(timer); timer = null; btnPlay.textContent = STR.play; } }

    btnNext.addEventListener('click', () => { stop(); go(idx + 1); });
    btnPrev.addEventListener('click', () => { stop(); go(idx - 1); });
    btnPlay.addEventListener('click', () => {
      if (timer) { stop(); return; }
      if (idx >= steps.length - 1) go(-1);
      btnPlay.textContent = STR.pause;
      timer = setInterval(() => {
        if (idx >= steps.length - 1) { stop(); return; }
        go(idx + 1);
      }, opts && opts.interval ? opts.interval : 2100);
    });

    paint();

    return {
      destroy() { stop(); root.innerHTML = ''; },
      setStep(i) { stop(); go(i); },
    };
  }

  window.DiagramKit = { renderDiagram, createPlayer };
})();
