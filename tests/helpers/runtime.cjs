const vm = require('node:vm');
const { root, read, scripts } = require('../../scripts/project.cjs');

// A small DOM stand-in for template and state tests; browser layout is not simulated.
function runtime(files = scripts(), seed = {}) {
  const elements = new Map();
  const element = () => ({
    innerHTML: '', textContent: '', value: '', dataset: {}, style: {}, hidden: false,
    classList: { add() {}, remove() {}, toggle() {} },
    querySelector() { return null; }, querySelectorAll() { return []; },
    insertAdjacentHTML() {}, addEventListener() {}, setAttribute() {},
    append() {}, remove() {}, focus() {},
  });
  const storage = new Map(Object.entries(seed).map(([k, v]) => ['lt:' + k, JSON.stringify(v)]));
  const document = {
    querySelector(selector) {
      if (!elements.has(selector)) elements.set(selector, element());
      return elements.get(selector);
    },
    querySelectorAll: () => [], createElement: element,
    head: element(), body: element(), documentElement: element(),
    addEventListener() {}, fonts: { ready: Promise.resolve() },
  };
  const sandbox = {
    document, console: { ...console, table() {}, warn() {}, assert(ok, ...args) {
      if (!ok) throw new Error(args.join(' '));
    } },
    location: { search: '?demo', hash: '', reload() {} },
    localStorage: { getItem: k => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, v) },
    navigator: { onLine: true }, URLSearchParams, URL,
    Date: class extends Date {
      constructor(...args) { super(...(args.length ? args : ['2026-11-12T05:00:00Z'])); }
      static now() { return Date.parse('2026-11-12T05:00:00Z'); }
    },
    setTimeout: () => 1, clearTimeout() {}, requestAnimationFrame: () => 1, cancelAnimationFrame() {},
    matchMedia: () => ({ matches: true }), addEventListener() {}, scrollTo() {}, scrollY: 0,
  };
  sandbox.window = sandbox;
  const context = vm.createContext(sandbox);
  for (const file of files) new vm.Script(read(file), { filename: file }).runInContext(context);
  return { run: source => vm.runInContext(source, context), document, storage };
}

function templates(app) {
  return app.run(`(() => {
    const output = {};
    S.user = { name: 'Nguyễn Thị Lan', email: 'lan@gmail.com' };
    G.gps = gpsMatch({ lat: loc('dragon-bridge').lat, lng: loc('dragon-bridge').lng, acc: 20 });
    for (const lang of ['vi', 'en']) {
      S.lang = lang;
      for (const [name, view] of Object.entries(VIEWS)) {
        const arg = name === 'learn' ? 'dragon-bridge' : name === 'practice' ? 'w-nice' : 'hoian';
        output[lang + '/' + name] = view.render(arg);
      }
      S.rpMode = 'library'; output[lang + '/library'] = VIEWS.roleplay.render(); S.rpMode = 'journey';
      for (const tab of ['discover', 'words', 'practice']) {
        S.learnTab = tab; output[lang + '/learn/' + tab] = VIEWS.learn.render('dragon-bridge');
      }
      S.learnTab = 'discover';
    }
    return output;
  })()`);
}

module.exports = { root, read, scripts, runtime, templates };
