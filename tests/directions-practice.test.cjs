const { test } = require('node:test');
const assert = require('node:assert/strict');
const { runtime } = require('./helpers/runtime.cjs');

test('directions uses a new map after practice and another after seven days', () => {
  const app = runtime();
  app.run(`
    const recordingRun = { ...newDirectionsRun(), first: 'a' };
    const startDate = Date.now();
    recordDirectionsResponse(recordingRun, 'baseline', directionsMaps.a.answer, startDate);
  `);
  assert.equal(app.run('directionsPhase(recordingRun)'), 'listenSound');
  assert.equal(app.run('directionsResult(recordingRun, "baseline")'), 3);
  assert.equal(app.run("recordDirectionsResponse(recordingRun, 'baseline', null)"), false);
  app.run("recordingRun.sound = 'missing'; recordingRun.followup = true");
  assert.equal(app.run('directionsPhase(recordingRun)'), 'transfer');
  assert.equal(app.run("directionsMapFor(recordingRun, 'transfer')"), app.run('directionsMaps.c'));
  assert.equal(app.run("recordDirectionsResponse(recordingRun, 'transfer', { ...directionsMaps.c.answer, turn: 'unclear' }, startDate)"), true);
  assert.equal(app.run("directionsResult(recordingRun, 'transfer')"), 2);
  assert.equal(app.run("directionsPhase(recordingRun, startDate + directionsDelay - 1)"), 'wait');
  assert.equal(app.run("recordDirectionsResponse(recordingRun, 'delayed', null, startDate + directionsDelay - 1)"), false);
  assert.equal(app.run("directionsPhase(recordingRun, startDate + directionsDelay)"), 'delayed');
  assert.equal(app.run("directionsMapFor(recordingRun, 'delayed')"), app.run('directionsMaps.b'));
  assert.equal(app.run("recordDirectionsResponse(recordingRun, 'delayed', directionsMaps.b.answer, startDate + directionsDelay)"), true);
  assert.equal(app.run('directionsPhase(restoreDirectionsRun(recordingRun))'), 'finished');
});

test('unreviewed directions attempts carry no score and restore only whitelisted local fields', () => {
  const app = runtime();
  app.run(`
    const soloRun = { ...newDirectionsRun(), first: 'b' };
    recordDirectionsResponse(soloRun, 'baseline', null);
    soloRun.followup = true;
    recordDirectionsResponse(soloRun, 'transfer', { ...directionsMaps.c.answer, clip: 'blob:extra' });
    const restoredRun = restoreDirectionsRun({ ...soloRun, transcript: 'extra field' });
  `);
  assert.equal(app.run('restoredRun.sound'), 'uncertain');
  assert.equal(app.run('directionsResult(restoredRun, "baseline")'), null);
  assert.equal(app.run('directionsResult(restoredRun, "transfer")'), 3);
  assert.equal(app.run('restoredRun.transfer.clip'), undefined);
  assert.equal(app.run('restoredRun.transcript'), undefined);
  assert.equal(app.run('directionsPhase(restoreDirectionsRun({ ...soloRun, readyAt: "wrong" }))'), 'transfer');
  assert.equal(app.run('directionsProgressKey()'), 'directions-practice');
});

test('the listener sees choices without the map and the drill depends on observed evidence', () => {
  const app = runtime();
  assert.match(app.run('PLAY_MODES.map(m => m[0]).join()'), /#practice\/directions/);
  const scenario = app.run("VIEWS.scenario.render('directions')");
  assert.match(scenario, /#practice\/directions/);
  assert.doesNotMatch(scenario, /AI tự ghi lại/);
  for (const lang of ['vi', 'en']) {
    const learner = app.run(`S.lang = '${lang}'; directionsLearnerHtml(directionsMaps.a, 'baseline')`);
    const listener = app.run('directionsListenerHtml()');
    assert.match(learner, /class="directions-map"/);
    assert.match(learner, /lang="en".*Excuse me/);
    assert.doesNotMatch(listener, /directions-map|Excuse me|selected/);
    assert.equal((listener.match(/value="unclear"/g) || []).length, 3);
    assert.match(app.run("directionsFollowupHtml({first:'a', sound:'missing'})"), /lang="en">market</);
    assert.match(app.run("directionsFollowupHtml({first:'a', sound:'uncertain'})"), /Go this way\./);
  }
});

test('recorder events produce only a temporary clip and late permission is cleaned up', async () => {
  const app = runtime();
  await app.run(`(async () => {
    globalThis.audioEvents = [];
    globalThis.released = 0;
    const stream = { getTracks: () => [{ stop() { released++; } }] };
    navigator.mediaDevices = { getUserMedia: async () => stream };
    globalThis.Blob = class {};
    globalThis.URL = {
      createObjectURL: () => 'blob:temporary',
      revokeObjectURL: url => audioEvents.push('revoked:' + url),
    };
    globalThis.MediaRecorder = class {
      handlers = {};
      addEventListener(event, handler) { this.handlers[event] = handler; }
      start() { this.state = 'recording'; }
      stop() {
        this.state = 'inactive';
        this.handlers.dataavailable({ data: { size: 1 } });
        this.handlers.stop();
      }
    };
    const recorder = createDirectionsRecorder((state, url) => audioEvents.push(url || state));
    await recorder.start();
    recorder.stop();
    recorder.reset();
    let grant;
    navigator.mediaDevices.getUserMedia = () => new Promise(resolve => { grant = resolve; });
    const pending = recorder.start();
    recorder.reset();
    grant(stream);
    await pending;
  })()`);
  assert.equal(app.run('audioEvents.join(",")'), 'requesting,recording,finishing,blob:temporary,revoked:blob:temporary,idle,requesting,idle');
  assert.equal(app.run('released'), 2);
  assert.equal(app.storage.size, 0);
});
