'use strict';
// Local listener outcomes only. Recordings and transcripts never enter this state.
const directionsProgressVersion = 1;
const directionsDelay = 7 * 24 * 60 * 60 * 1000;
const directionsAssessmentPhases = ['baseline', 'transfer', 'delayed'];
const directionsSoundOptions = ['acceptable', 'missing', 'uncertain'];
const directionsProgressKey = () => 'directions-practice';

function newDirectionsRun() {
  return { version: directionsProgressVersion, first: Math.random() < .5 ? 'a' : 'b' };
}

function isDirectionsResponse(response) {
  return response === null || (response && Object.entries(directionsFields).every(([field, spec]) =>
    response[field] === 'unclear' || spec.options.includes(response[field])));
}

function restoreDirectionsRun(saved) {
  if (saved?.version !== directionsProgressVersion || !['a', 'b'].includes(saved.first)) return newDirectionsRun();
  const run = { version: saved.version, first: saved.first };
  if (isDirectionsResponse(saved.baseline)) run.baseline = copyDirectionsResponse(saved.baseline);
  if (!Object.hasOwn(run, 'baseline') || !directionsSoundOptions.includes(saved.sound)) return run;
  run.sound = run.baseline === null ? 'uncertain' : saved.sound;
  if (saved.followup !== true) return run;
  run.followup = true;
  if (!isDirectionsResponse(saved.transfer) || !Number.isSafeInteger(saved.readyAt) ||
      saved.readyAt <= directionsDelay || saved.readyAt > 8.64e15) return run;
  run.transfer = copyDirectionsResponse(saved.transfer);
  run.readyAt = saved.readyAt;
  if (isDirectionsResponse(saved.delayed)) run.delayed = copyDirectionsResponse(saved.delayed);
  return run;
}

function copyDirectionsResponse(response) {
  return response === null ? null : Object.fromEntries(Object.keys(directionsFields).map(field => [field, response[field]]));
}

function directionsPhase(run, now = Date.now()) {
  if (!Object.hasOwn(run, 'baseline')) return 'baseline';
  if (!run.sound) return 'listenSound';
  if (!run.followup) return 'followup';
  if (!Object.hasOwn(run, 'transfer')) return 'transfer';
  if (Object.hasOwn(run, 'delayed')) return 'finished';
  return now < run.readyAt ? 'wait' : 'delayed';
}

function directionsMapFor(run, phase) {
  if (phase === 'transfer') return directionsMaps.c;
  if (phase === 'delayed') return directionsMaps[run.first === 'a' ? 'b' : 'a'];
  return directionsMaps[run.first];
}

function recordDirectionsResponse(run, phase, response, now = Date.now()) {
  if (!directionsAssessmentPhases.includes(phase) || directionsPhase(run, now) !== phase ||
      !isDirectionsResponse(response)) return false;
  run[phase] = copyDirectionsResponse(response);
  if (phase === 'baseline' && response === null) run.sound = 'uncertain';
  if (phase === 'transfer') run.readyAt = now + directionsDelay;
  return true;
}

function directionsResult(run, phase) {
  const response = run[phase];
  if (!response) return null;
  const { answer } = directionsMapFor(run, phase);
  return Object.keys(directionsFields).reduce((total, field) => total + Number(response[field] === answer[field]), 0);
}
