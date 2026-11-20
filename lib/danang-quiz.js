'use strict';

const DANANG_PROGRESS = 'practice:da-nang';
const danangNormalize = text => text.trim().normalize('NFC').toLowerCase().replace(/\s+/g, ' ');
let danangMemory;

function danangSolution(q) {
  switch (q.type) {
    case 'mcq':
    case 'listening_mcq': return [String(q.answerIndex)];
    case 'true_false': return [String(q.answer)];
    case 'fill_blank': return q.answers;
    case 'matching': return q.pairs.map(pair => pair[1]);
    case 'ordering': return q.itemsInCorrectOrder;
  }
}

function validDanangResponse(q, values) {
  if (!danangTexts(values) || values.some(text => text.length > 500)) return false;
  switch (q.type) {
    case 'mcq':
    case 'listening_mcq': return values.length === 1 && q.options.some((_, i) => values[0] === String(i));
    case 'true_false': return values.length === 1 && ['true', 'false'].includes(values[0]);
    case 'fill_blank': return values.length === 1;
    case 'matching':
    case 'ordering': {
      const pool = danangSolution(q);
      return values.length === pool.length && danangDistinct(values) && values.every(value => pool.includes(value));
    }
  }
}

function gradeDanangResponse(q, values) {
  const answer = danangSolution(q);
  return q.type === 'fill_blank'
    ? answer.some(text => danangNormalize(text) === danangNormalize(values[0]))
    : answer.every((value, i) => value === values[i]);
}

function shuffledDanangOptions(items, seed) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const j = Math.floor((seed / 2 ** 32) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  if (result.every((item, i) => item === items[i])) result.push(result.shift());
  return result;
}

function danangRun(node) {
  return { ids: node.questions.map(q => q.id), index: 0, answers: [], draft: [], seed: Math.floor(Math.random() * 2 ** 32) };
}

function restoreDanangProgress(bank) {
  const saved = store.get(DANANG_PROGRESS, danangMemory);
  const progress = { version: bank.version, active: null, runs: {} };
  if (saved?.version !== bank.version || !saved?.runs) return progress;
  if (bank.nodes.has(saved.active)) progress.active = saved.active;
  for (const [id, node] of bank.nodes) {
    const run = saved.runs[id], size = node.questions.length;
    if (!Array.isArray(run?.ids) || run.ids.length !== size || !node.questions.every((q, i) => run.ids[i] === q.id)
        || !Number.isInteger(run.index) || run.index < 0 || run.index > size
        || !Number.isInteger(run.seed) || run.seed < 0 || run.seed >= 2 ** 32
        || !Array.isArray(run.answers) || ![run.index, run.index + 1].includes(run.answers.length)
        || run.answers.length > size || !run.answers.every((response, i) => validDanangResponse(node.questions[i], response))) continue;
    const draft = Array.isArray(run.draft) && run.draft.length <= 30
      && run.draft.every(value => typeof value === 'string' && value.length <= 500) ? run.draft : [];
    progress.runs[id] = { ...run, draft };
  }
  return progress;
}

function saveDanangProgress(progress) {
  danangMemory = progress;
  store.set(DANANG_PROGRESS, progress);
}

function submitDanangResponse(node, run, values) {
  const q = node.questions[run.index];
  if (!q || run.answers.length !== run.index || !validDanangResponse(q, values)) return false;
  run.answers.push(values);
  run.draft = [];
  return true;
}
