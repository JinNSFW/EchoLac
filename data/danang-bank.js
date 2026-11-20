'use strict';

const danangText = value => typeof value === 'string' && value.trim().length > 0;
const danangTexts = (value, min = 1) => Array.isArray(value) && value.length >= min && value.every(danangText);
const danangDistinct = items => new Set(items).size === items.length;
const danangLevels = ['A1', 'A2', 'B1', 'B2', 'C1'];

function validDanangQuestion(q) {
  if (!danangText(q?.id) || !danangText(q.prompt)
      || !danangLevels.includes(q.difficulty) || (q.explanation != null && typeof q.explanation !== 'string')) return false;
  switch (q.type) {
    case 'listening_mcq':
      if (!danangText(q.ttsText)) return false;
      // Same options and answer index as a regular multiple-choice question.
    case 'mcq':
      return danangTexts(q.options, 2) && danangDistinct(q.options)
        && Number.isInteger(q.answerIndex) && q.answerIndex >= 0 && q.answerIndex < q.options.length;
    case 'true_false':
      return typeof q.answer === 'boolean';
    case 'fill_blank':
      return q.prompt.includes('___') && danangTexts(q.answers)
        && (q.wordBank == null || danangTexts(q.wordBank, 0));
    case 'matching':
      return Array.isArray(q.pairs) && q.pairs.length >= 2
        && q.pairs.every(pair => danangTexts(pair, 2) && pair.length === 2)
        && danangDistinct(q.pairs.map(pair => pair[0])) && danangDistinct(q.pairs.map(pair => pair[1]));
    case 'ordering':
      return danangTexts(q.itemsInCorrectOrder, 2) && danangDistinct(q.itemsInCorrectOrder);
    default:
      return false;
  }
}

function readDanangBank(raw) {
  if (raw?.schemaVersion !== 1 || raw.pack?.id !== 'da-nang'
      || raw.pack.language !== 'en' || !danangText(raw.pack.version) || !Array.isArray(raw.nodes)) {
    throw new Error('Unsupported Da Nang question bank');
  }
  const counts = new Map();
  for (const node of raw.nodes) {
    if (!Array.isArray(node?.questions)) continue;
    for (const q of node.questions) counts.set(q?.id, (counts.get(q?.id) || 0) + 1);
  }
  const nodes = new Map();
  for (const node of raw.nodes) {
    if (node?.contentStatus !== 'ready' || !danangText(node.title) || !danangLevels.includes(node.level)
        || !['lesson', 'levelCheck'].includes(node.type) || !danangText(node.id) || !/^[A-Z0-9-]+$/.test(node.id)
        || nodes.has(node.id) || !Array.isArray(node.questions)) continue;
    const questions = node.questions.filter(q => validDanangQuestion(q)
      && !q.needsVerification && counts.get(q.id) === 1);
    if (questions.length) nodes.set(node.id, { ...node, questions });
  }
  return { version: raw.pack.version, asOf: raw.pack.asOf, nodes };
}

let danangBankRequest;
function loadDanangBank() {
  danangBankRequest ??= fetch('./da-nang-question-bank.json', { cache: 'no-cache' })
    .then(response => {
      if (!response.ok) throw new Error('Question bank unavailable');
      return response.json();
    })
    .then(readDanangBank)
    .catch(error => {
      danangBankRequest = undefined;
      throw error;
    });
  return danangBankRequest;
}
