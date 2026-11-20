'use strict';

function danangPracticeHtml() {
  return `
    <div class="topbar centered">
      <a class="icon-btn" href="#home" aria-label="${V('Trang chủ', 'Home')}">${icon('left')}</a>
      <h1>${V('Luyện tập Đà Nẵng', 'Da Nang practice')}</h1><span></span>
    </div>
    <section id="danang-quiz" class="card danang-quiz" aria-label="${V('Câu hỏi Đà Nẵng', 'Da Nang questions')}">
      <p role="status">${V('Đang tải câu hỏi…', 'Loading questions…')}</p>
    </section>`;
}

function danangGroupTitle(node) {
  return node.type === 'levelCheck' ? V('Ôn tập', 'Review') + ' ' + node.level : node.title;
}

function danangGroups(bank, progress) {
  return `<h2 tabindex="-1">${V('Chọn bài luyện tập', 'Choose a practice set')}</h2>
    <p class="small muted">${V('Bộ câu hỏi mẫu, nội dung đang chờ giáo viên rà soát.', 'Sample question bank awaiting teacher review.')}</p>
    ${danangLevels.map(level => {
      const nodes = [...bank.nodes.values()].filter(node => node.level === level);
      return nodes.length ? `<h3 class="mt-16">${level}</h3>
        <ul class="dq-groups">${nodes.map(node => {
          const run = progress.runs[node.id];
          return `<li><button type="button" class="dq-choice" data-dq-group="${node.id}">
            <b ${node.type === 'lesson' ? 'lang="en"' : ''}>${esc(danangGroupTitle(node))}</b>
            <span class="small muted">${run ? `${run.answers.length}/${node.questions.length}` : node.questions.length}
              ${V('câu', 'questions')}</span>
          </button></li>`;
        }).join('')}</ul>` : '';
    }).join('')}`;
}

const danangBoolean = value => value === 'true' ? V('Đúng', 'True') : V('Sai', 'False');

function danangSelects(labels, options, values, lang) {
  return labels.map((label, i) => `<label class="dq-field"><span ${lang}>${esc(label)}</span>
    <select name="answer" required lang="en">
      <option value="">${V('Chọn…', 'Choose…')}</option>
      ${options.map(option => `<option value="${esc(option)}" ${values[i] === option ? 'selected' : ''}>${esc(option)}</option>`).join('')}
    </select></label>`).join('');
}

function danangInputs(q, values, seed, reviewed) {
  switch (q.type) {
    case 'fill_blank':
      return `<label class="dq-field">${V('Câu trả lời của bạn', 'Your answer')}
        <input name="answer" lang="en" maxlength="500" autocomplete="off" value="${esc(values[0] ?? '')}" required></label>
        ${!reviewed && q.wordBank?.length ? `<div class="dq-chips" lang="en">
          ${q.wordBank.map((word, i) => `<button type="button" class="chip" data-dq-word="${i}">${esc(word)}</button>`).join('')}
        </div>` : ''}`;
    case 'matching':
      return danangSelects(q.pairs.map(pair => pair[0]), shuffledDanangOptions(danangSolution(q), seed), values, 'lang="en"');
    case 'ordering': {
      const items = q.itemsInCorrectOrder;
      return danangSelects(items.map((_, i) => V('Vị trí ', 'Position ') + (i + 1)), shuffledDanangOptions(items, seed), values, '');
    }
    default: {
      const boolean = q.type === 'true_false';
      const choices = boolean ? ['true', 'false'] : q.options.map((_, i) => String(i));
      return choices.map(value => `<label class="dq-choice" ${boolean ? '' : 'lang="en"'}>
        <input type="radio" name="answer" value="${value}" ${values[0] === value ? 'checked' : ''} required>
        <span>${esc(boolean ? danangBoolean(value) : q.options[Number(value)])}</span></label>`).join('');
    }
  }
}

function danangFeedback(q, response) {
  const answer = danangSolution(q);
  let key = esc(answer.join(' / '));
  if (q.options) key = esc(q.options[q.answerIndex]);
  if (q.type === 'true_false') key = danangBoolean(answer[0]);
  if (q.type === 'matching') key = `<ul>${q.pairs.map(([left, right]) => `<li>${esc(left)} → ${esc(right)}</li>`).join('')}</ul>`;
  if (q.type === 'ordering') key = `<ol>${answer.map(part => `<li>${esc(part)}</li>`).join('')}</ol>`;
  const correct = gradeDanangResponse(q, response);
  return `<div class="dq-feedback" tabindex="-1" aria-labelledby="dq-result">
    <strong id="dq-result">${correct ? V('Trả lời đúng', 'Correct') : V('Trả lời chưa đúng', 'Incorrect')}</strong>
    <p>${V('Đáp án đúng', 'Correct answer')}</p>
    <div ${q.type === 'true_false' ? '' : 'lang="en"'}>${key}</div>
    ${q.explanation ? `<p lang="en">${esc(q.explanation)}</p>` : ''}
  </div>`;
}

function danangQuestionHtml(bank, node, run) {
  const q = node.questions[run.index], response = run.answers[run.index], reviewed = Boolean(response);
  const heading = `<div class="dq-heading">
    <h2 tabindex="-1" ${node.type === 'lesson' ? 'lang="en"' : ''}>${esc(danangGroupTitle(node))}</h2>
    <button class="btn soft sm" type="button" data-dq-action="groups">${V('Chọn bài', 'Choose a set')}</button>
  </div>`;
  if (!q) {
    const correct = run.answers.filter((values, i) => gradeDanangResponse(node.questions[i], values)).length;
    return `${heading}<p class="mt-16">${V('Số câu đúng', 'Correct answers')} <b>${correct}/${node.questions.length}</b></p>
      <button class="btn mt-16" type="button" data-dq-action="restart">${V('Luyện lại', 'Practise again')}</button>`;
  }
  const asOf = node.asOf || bank.asOf;
  return `${heading}
    <p class="small muted mt-8">${V('Câu', 'Question')} ${run.index + 1}/${node.questions.length} · ${esc(q.difficulty)}</p>
    ${q.timeSensitive ? `<p class="small muted mt-8">${V('Mốc dữ liệu', 'Data as of')} ${esc(asOf || '—')}. ${V('Thông tin có thể thay đổi.', 'Details may change.')}</p>` : ''}
    <form class="dq-form">
      ${q.type === 'listening_mcq' ? `<button class="btn soft sm" type="button" data-dq-action="listen">${icon('volume', 'sm')} ${V('Nghe đoạn tiếng Anh', 'Listen to the English audio')}</button>` : ''}
      <fieldset ${reviewed ? 'disabled' : ''}>
        <legend tabindex="-1" lang="en">${esc(q.prompt)}</legend>
        ${danangInputs(q, response || run.draft, run.seed + run.index, reviewed)}
      </fieldset>
      ${reviewed ? `${danangFeedback(q, response)}
        <button class="btn" type="button" data-dq-action="next">${run.index + 1 === node.questions.length ? V('Xem kết quả', 'See results') : V('Câu tiếp theo', 'Next question')}</button>`
        : `<p class="small" data-dq-error role="status" hidden></p><button class="btn" type="submit">${V('Kiểm tra đáp án', 'Check answer')}</button>`}
    </form>`;
}

function mountDanangQuiz() {
  const root = $('#danang-quiz');
  let bank, progress, current;
  const activeRun = () => progress?.runs[current];
  const activeNode = () => bank?.nodes.get(current);
  const draw = (focus) => {
    const node = activeNode();
    root.innerHTML = node ? danangQuestionHtml(bank, node, activeRun()) : danangGroups(bank, progress);
    if (focus) (root.querySelector(focus) || root.querySelector('h2'))?.focus();
  };
  async function load() {
    root.innerHTML = `<p role="status">${V('Đang tải câu hỏi…', 'Loading questions…')}</p>`;
    try {
      bank = await loadDanangBank();
    } catch {
      if (root.isConnected) root.innerHTML = `<p role="alert">${V('Không tải được câu hỏi Đà Nẵng.', 'Could not load the Da Nang questions.')}</p>
        <button class="btn soft sm mt-16" type="button" data-dq-action="retry">${V('Thử lại', 'Try again')}</button>`;
      return;
    }
    if (!root.isConnected) return;
    if (!bank.nodes.size) {
      root.innerHTML = `<p role="status">${V('Chưa có câu hỏi có thể luyện tập.', 'No questions are available for practice yet.')}</p>`;
      return;
    }
    progress = restoreDanangProgress(bank);
    current = progress.runs[progress.active] ? progress.active : null;
    draw();
  }
  const valuesIn = form => Array.from(new FormData(form).getAll('answer'));
  const saveDraft = form => {
    const run = activeRun();
    if (!run || run.answers.length !== run.index) return;
    run.draft = valuesIn(form);
    saveDanangProgress(progress);
  };
  root.addEventListener('input', event => {
    const form = event.target.closest('.dq-form');
    if (form) saveDraft(form);
  });
  root.addEventListener('submit', event => {
    event.preventDefault();
    if (!submitDanangResponse(activeNode(), activeRun(), valuesIn(event.target))) {
      const message = root.querySelector('[data-dq-error]');
      if (message) {
        message.hidden = false;
        message.textContent = V('Hãy điền đáp án vào mọi ô. Với bài ghép hoặc xếp, mỗi lựa chọn chỉ dùng một lần.',
          'Complete every field. In matching or ordering, use each option only once.');
      }
      return;
    }
    saveDanangProgress(progress);
    draw('.dq-feedback');
  });
  root.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    const group = button.dataset.dqGroup, action = button.dataset.dqAction;
    if (action === 'retry') return load();
    if (bank?.nodes.has(group)) {
      current = progress.active = group;
      progress.runs[group] ??= danangRun(activeNode());
      saveDanangProgress(progress);
      draw('legend');
      return;
    }
    const run = activeRun(), q = activeNode()?.questions[run?.index];
    if (button.dataset.dqWord != null && q?.wordBank) {
      const form = button.closest('form'), input = form.querySelector('input');
      input.value = q.wordBank[Number(button.dataset.dqWord)];
      saveDraft(form);
      input.focus();
    }
    if (action === 'listen' && q?.ttsText) {
      if ('speechSynthesis' in window) speak(q.ttsText);
      else toast(V('Trình duyệt này chưa hỗ trợ đọc tiếng Anh.', 'This browser does not support English playback.'));
    }
    if (action === 'groups') {
      stopAudio();
      current = null;
      draw('h2');
    }
    if (run && (action === 'restart' || (action === 'next' && run.answers.length === run.index + 1))) {
      stopAudio();
      if (action === 'restart') progress.runs[current] = danangRun(activeNode());
      else run.index++;
      saveDanangProgress(progress);
      draw('legend');
    }
  });
  load();
}
