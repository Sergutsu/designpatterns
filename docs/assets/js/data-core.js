/* ============================================================
   data-core.js — categories, meta, helpers
   ============================================================ */
window.PATTERNS = window.PATTERNS || [];

window.CATEGORIES = {
  creational: {
    label: 'Creational', color: '#ffd166',
    blurb: 'How game objects come into being — without `new`-ing your way into spaghetti.',
  },
  structural: {
    label: 'Structural', color: '#4cc9f0',
    blurb: 'How entities are composed into larger, saner structures.',
  },
  behavioral: {
    label: 'Behavioral', color: '#f72585',
    blurb: 'How entities talk, change, and stay out of each other’s way.',
  },
  bonus: {
    label: 'Game-Specific', color: '#80ed99',
    blurb: 'Patterns born on the battlefield of real game engines (not in the classic GoF book).',
  },
};

window.CAT_ORDER = ['creational', 'structural', 'behavioral', 'bonus'];

/** small helper to push a pattern consistently */
window.addPattern = function (p) {
  if (!p.id || !p.name || !p.cat) throw new Error('pattern missing id/name/cat: ' + JSON.stringify(p).slice(0, 120));
  p.use = p.use || [];
  p.pitfalls = p.pitfalls || [];
  p.related = p.related || [];
  p.steps = p.steps || [];
  p.code = p.code || [];
  window.PATTERNS.push(p);
  return p;
};

window.byId = id => window.PATTERNS.find(p => p.id === id);
