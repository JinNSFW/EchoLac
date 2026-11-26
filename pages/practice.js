'use strict';
// practice screen. Shared pieces live in components/.
VIEWS.practice = {
    render(id) {
      if (id === 'danang') return danangPracticeHtml();
      if (id === 'directions') return directionsPracticeHtml();
      const list = sortedErrors(), e = S.errors.find(x => x.id === id) || list[0];
      if (!e) { location.hash = '#tutor'; return ''; }
      const idx = list.indexOf(e), next = list[(idx + 1) % list.length], s = scen(e.scen), sentence = e.word.includes(' ');
      return `
      <div class="topbar centered reveal">
        <a class="icon-btn" href="#tutor" aria-label="${V('Quay lại', 'Back')}">${icon('left')}</a>
        <h1 style="font-size:19px">${V('Luyện phát âm', 'Practice')}</h1>
        <span class="pill white">${idx + 1}/${list.length}</span>
      </div>
      <section class="card word-card reveal zoom">
        <span class="tag amber">${L(ERR_CAT[e.cat])}</span>
        ${e.wrong ? `<div class="compare bad mt-16" style="text-align:left"><small>${V('Bạn đã nói', 'You said')}</small>${esc(e.wrong)}</div>` : ''}
        <div class="big ${sentence ? 'sentence' : ''}">${esc(e.word)}</div>
        ${e.ipa ? `<div class="ipa-big">${ipaHl(e)}</div>` : ''}
        <div class="small muted mt-8">${e.mean ? esc(e.mean) + ' · ' : ''}${V('từ', 'from')} <a href="#scenario/${s.id}">${L(s.name)}</a></div>
        <div class="row mt-24" style="justify-content:center;gap:10px;flex-wrap:wrap">
          <button class="btn soft sm" onclick="practiceSample(${esc(JSON.stringify(e.word))})">${icon('volume', 'sm')} ${V('Nghe mẫu', 'Listen')}</button>
          <button class="btn white sm" onclick="practiceSample(${esc(JSON.stringify(e.word))}, .6)">🐢 ${V('Chậm', 'Slow')}</button>
        </div>
        <p class="small muted mt-8" id="practice-sample-status" role="status"></p>
      </section>
      ${tutorSay(`<b>${V('Cách sửa', 'How to fix it')}</b><br>${esc(L(e.tip))}<br><span class="small muted">${V('Bạn nên nói:', 'You should say:')} “${esc(e.word)}”</span>`, 0, 'mt-24')}
      ${aiReady() ? `<div class="center mt-8"><button class="btn soft sm" id="ai-tutor-btn" onclick="aiTutor('${e.id}')">${icon('micAi', 'sm')} ${V('Hỏi Gia sư AI', 'Ask the AI tutor')} · ${aiModeLabel(true)}</button></div>
      <p class="card flat mt-8" id="ai-tutor" aria-live="polite" hidden></p>` : ''}
      <section class="card reveal mt-24 center">
        <div class="score-ring" id="sr">${ringSvg(e.best, 62, 12, scoreColor(e.best), 'var(--line)')}<div class="val"><div><b id="sv">${e.best}</b><span>${V('điểm cao nhất', 'best score')}</span></div></div></div>
        <p class="mt-16" id="fbt">${V('Nhấn micro và đọc to từ trên.', 'Tap the mic and say the word out loud.')}</p>
        <div class="mt-8" id="pron-box" aria-live="polite"></div>
        <div class="attempts mt-16" id="att">${attemptsHtml(e)}</div>
      </section>
      <section class="card reveal">
        <div class="row between small"><b>${V('Tiến độ thành thạo', 'Mastery')}</b><span class="muted tiny">${V('≥80 điểm trong 2 ngày khác nhau', '≥80 on 2 different days')}</span></div>
        <div class="mastery-steps mt-8" id="ms">${masteryHtml(e)}</div>
      </section>
      <div class="dock mt-16">
        <div class="dock-row" style="justify-content:center;gap:32px">
          <button class="side" onclick="practiceSample(${esc(JSON.stringify(e.word))})"><span class="icon-btn">${icon('volume')}</span>${V('Nghe', 'Listen')}</button>
          <button class="mic-btn" id="pmic" onclick="practiceRec('${e.id}')" aria-label="${V('Ghi âm', 'Record')}">${icon('mic')}</button>
          <a class="side" href="#practice/${next.id}"><span class="icon-btn">${icon('right')}</span>${V('Tiếp', 'Next')}</a>
        </div>
        <div class="hint" id="pm-hint">${V('Nhấn để ghi âm', 'Tap to record')}</div>
      </div>`;
    },
    mount(id) {
      if (id === 'danang') mountDanangQuiz();
      if (id === 'directions') mountDirectionsPractice();
    },
  };

function practiceSample(text, rate) {
  const status = $('#practice-sample-status');
  return playPronSample({ text }, state => { status.textContent = pronSampleStatus(state); }, rate);
}
