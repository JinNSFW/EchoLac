'use strict';
// Discover and vocabulary tabs for location lessons.

const tabHtml = l => ({ discover: discoverHtml, words: wordsHtml, practice: practiceHtml }[S.learnTab] || discoverHtml)(l);
function setLearnTab(t) {
  const box = $('#lt'), l = loc(box.dataset.id);
  clearPractice(); stopAudio();
  S.learnTab = t; box.innerHTML = tabHtml(l); box.setAttribute('aria-labelledby', 'tab-' + t);
  document.querySelectorAll('[role="tab"]').forEach(b => { const on = b.id === 'tab-' + t; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
  observe(box);
  $('[role="tablist"]').scrollIntoView({ behavior: 'smooth', block: 'start' });
  if (t === 'practice') startPractice(l);
}

// A. Discover: verified-only facts; anything missing is said out loud, never filled in
const bi = o => `<p class="en">${esc(o.en)}</p><details class="vi"><summary>${V('Xem tiếng Việt', 'Show Vietnamese')}</summary><p>${esc(o.vi)}</p></details>`;
const DQ = [['built', 'Được xây khi nào?', 'When was it built?'], ['historicalSignificance', 'Bối cảnh lịch sử', 'Historical background'], ['culturalBackground', 'Vì sao quan trọng với người dân địa phương?', 'Why is it important to local people?'], ['architecture', 'Điều gì làm nơi này độc đáo?', 'What makes it unique?']];
function discoverHtml(l) {
  const miss = DQ.filter(([k]) => !l[k]).map(([, vi, en]) => V(vi, en)), facts = l.interestingFacts;
  if (facts.length < 3) miss.push(V('thêm điều thú vị', 'more interesting facts'));
  return `
    <section class="card reveal"><h3 class="q">${V('Đây là nơi nào?', 'What is this place?')}</h3>${bi(l.description)}</section>
    ${DQ.filter(([k]) => l[k]).map(([k, vi, en]) => `<section class="card reveal"><h3 class="q">${V(vi, en)}</h3>${bi(l[k])}</section>`).join('')}
    ${facts.length ? `<section class="card reveal"><h3 class="q">${V('Điều thú vị', 'Interesting facts')}</h3><ol class="facts">${facts.map(f => `<li>${bi(f)}</li>`).join('')}</ol></section>` : ''}
    ${miss.length ? `<div class="missing reveal">${icon('book')}<div><b>${V('Chưa có thông tin đã kiểm chứng', 'Not verified yet')}</b><p>${miss.join(' · ')}</p><p class="tiny mt-8">${V('EchoLạc không tự đoán thông tin lịch sử. Giáo viên sẽ bổ sung sau khi kiểm chứng.', 'EchoLạc never guesses history. A teacher adds these once they are checked.')}</p></div></div>` : ''}
    ${l.sources.length ? `<p class="sources reveal">${V('Nguồn', 'Sources')}: ${l.sources.map(s => (s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>` : esc(s.label))).join('; ')}</p>` : ''}
    <button class="btn mt-24" onclick="markDiscover('${l.id}')">${V('Tiếp: Học tiếng Anh', 'Next: Learn English')} ${icon('right')}</button>`;
}
function markDiscover(id) { const l = loc(id); progW(id).d = 1; save(); refreshProg(l); checkComplete(l); setLearnTab('words'); }

// B. Learn English: generated learning content, labelled as such
function wordsHtml(l) {
  const heard = prog(l.id).w;
  return `
    <div class="row between small reveal"><b>${V('Từ vựng tại chỗ', 'Words for this place')}</b><b id="wcount">${heard.length}/${l.vocab.length}</b></div>
    <p class="tiny muted mt-8 reveal">${V('Nghe từng từ để hoàn thành phần này. Định nghĩa và câu ví dụ do AI soạn, chờ giáo viên duyệt, không phải thông tin đã kiểm chứng.', 'Listen to each word to finish this part. Definitions and examples are AI-drafted learning content awaiting teacher review, not verified facts.')}</p>
    <div class="mt-16">${l.vocab.map((v, i) => `
      <article class="wcard reveal ${heard.includes(i) ? 'heard' : ''}" id="wc${i}" style="--d:${i * 50}ms">
        <div class="row between" style="align-items:flex-start">
          <div class="grow"><div class="w">${esc(v.word)}<span class="tag green ok">${icon('check', 'sm')} ${V('Đã nghe', 'Heard')}</span></div><div class="ipa">${esc(v.ipa)}</div></div>
          <button class="play" onclick="hearWord('${l.id}',${i})" aria-label="${V('Nghe', 'Listen to')} ${esc(v.word)}">${icon('volume')}</button>
          <button class="btn white sm slow" onclick="hearWord('${l.id}',${i},.6)" aria-label="${V('Nghe chậm', 'Listen slowly to')} ${esc(v.word)}">${V('Chậm', 'Slow')}</button>
        </div>
        <p class="def">${esc(v.en)}</p><p class="vi-m">${esc(v.vi)}</p>
        <button class="ex" onclick="hearEx('${l.id}',${i})">${icon('volume', 'sm')}<span>“${esc(v.example)}”</span></button>
        ${v.tip ? `<p class="tip">${icon('bulb', 'sm')}<span>${esc(L(v.tip))}</span></p>` : ''}
      </article>`).join('')}</div>
    <button class="btn mt-24" onclick="setLearnTab('practice')">${icon('chat')} ${V('Tiếp: Luyện nói', 'Next: Practice')}</button>`;
}
function hearWord(id, i, rate) {
  const l = loc(id), p = progW(id);
  speak(l.vocab[i].word, rate ? { rate } : {});
  if (p.w.includes(i)) return;
  p.w.push(i); save();
  $('#wc' + i)?.classList.add('heard'); $('#wcount').textContent = `${p.w.length}/${l.vocab.length}`;
  refreshProg(l); checkComplete(l);
}
const hearEx = (id, i) => speak(loc(id).vocab[i].example);
