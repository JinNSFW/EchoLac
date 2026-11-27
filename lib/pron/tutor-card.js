'use strict';
// Tutor lesson exercises use the same on-device scorer as the Practice error queue.
let pronCard = { items: [], n: 0, request: 0 };
const pronCardHtml = () => `<section class="card mt-24 reveal" id="pron-card">
  <b>${V('Chấm phát âm trên máy', 'On-device pronunciation check')}</b>
  <div class="row mt-8" style="gap:8px;flex-wrap:wrap">
    <select id="pron-unit" onchange="pronCardUnit(this)" aria-label="${V('Chọn bài', 'Choose a unit')}"></select>
    <button class="btn soft sm" id="pron-next" onclick="pronCardNext()" disabled>${V('Mục khác', 'Next exercise')}</button>
  </div>
  <div class="big mt-16" id="pron-word"></div>
  <div class="row mt-8" style="gap:10px;align-items:center;flex-wrap:wrap">
    <button class="btn soft sm" id="pron-sample" onclick="pronCardListen()" disabled>${icon('volume', 'sm')} ${V('Nghe mẫu', 'Listen')}</button>
    <button class="mic-btn" id="pron-mic" onclick="pronCardRec()" aria-label="${V('Ghi âm', 'Record')}" disabled>${icon('mic')}</button>
    <span class="hint" id="pron-hint">${V('Nhấn để ghi âm', 'Tap to record')}</span>
  </div>
  <p class="small muted mt-8" id="pron-sample-status" role="status"></p>
  <div class="mt-8" id="pron-result" aria-live="polite"></div>
</section>`;

async function pronCardMount() {
  const sel = $('#pron-unit');
  if (!sel) return;
  try {
    const { index } = await pronContent();
    if (!sel.isConnected) return;
    const units = index.units.filter(u => !PRON_PROSODY.includes(u.category));
    sel.innerHTML = units.map(u => `<option value="${esc(u.id)}">${esc(u.id)} · ${esc(L(ERR_CAT[u.category]))}</option>`).join('');
    await pronCardUnit(sel);
  } catch {
    if (sel.isConnected) $('#pron-result').innerHTML = pronSelfCheck(V('Chưa tải được danh sách bài luyện.', 'Could not load the pronunciation lessons.'));
  }
}

async function pronCardUnit(sel) {
  pronStop();
  const request = pronCard.request + 1, id = sel.value;
  pronCard = { items: [], n: 0, request };
  pronCardShow();
  try {
    const { index } = await pronContent();
    const entry = index.units.find(u => u.id === id && !PRON_PROSODY.includes(u.category));
    if (!entry) return;
    const unit = await pronJson(entry.file);
    if (sel.isConnected && request === pronCard.request) {
      pronCard.items = [...unit.words, ...unit.sentences].map(x => pronItemFromUnit(unit, x));
      pronCardShow();
    }
  } catch {
    if (sel.isConnected && request === pronCard.request) $('#pron-result').textContent = V('Chưa tải được bài luyện. Hãy thử chọn lại.', 'Could not load the exercise. Try selecting the unit again.');
  }
}

function pronCardShow() {
  const item = pronCard.items[pronCard.n];
  $('#pron-word').textContent = item?.text || '';
  $('#pron-result').innerHTML = '';
  $('#pron-sample-status').textContent = '';
  $('#pron-mic').disabled = $('#pron-sample').disabled = !item;
  $('#pron-next').disabled = pronCard.items.length < 2;
}

function pronCardNext() {
  if (pronCard.items.length < 2) return;
  pronStop();
  pronCard.n = (pronCard.n + 1) % pronCard.items.length;
  pronCardShow();
}

function pronCardListen() {
  const item = pronCard.items[pronCard.n], status = $('#pron-sample-status');
  if (!item) return;
  return playPronSample(item, state => { status.textContent = pronSampleStatus(state); });
}

const pronCardRec = () => pronStart(pronCard.items[pronCard.n], {
  box: '#pron-result', mic: '#pron-mic', hint: '#pron-hint', onScore: savePronCardResult,
});
