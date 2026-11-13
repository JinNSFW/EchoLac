'use strict';
// Shared onboarding state and place-picker markup (X-01, X-06).

/* ================= Place themes ================= */
const F = { ready: false, gender: '', placeType: 'hometown', placeId: '' }; // onboarding choices that are not plain inputs
const ageOf = d => (d ? (Date.now() - new Date(d)) / 31557600000 : -1);
const placeSub = t => (t === 'destination'
  ? V('Nơi bạn sắp đến: luyện trước những câu sẽ dùng ở đó.', 'Where you are heading: practise the phrases you will need there.')
  : V('Nơi bạn lớn lên: kể chuyện quê nhà bằng tiếng Anh.', 'Where you grew up: tell its story in English.'));
const placeCards = (sel, fn) => Object.entries(THEMES).map(([id, t]) => `
  <button type="button" class="place ${sel === id ? 'on' : ''}" data-place="${id}" aria-pressed="${sel === id}" style="--sw:linear-gradient(180deg,${t.c.bg1},${t.c.primary})" onclick="${fn}('${id}',event)">
    ${img(t.icon)}<span><b>${L(t.name)}</b><small>${L(t.scene)}</small></span></button>`).join('');
const themeNote = id => (id
  ? `${img(theme(id).icon)}<span>${V('Giao diện', 'Theme')}: <b>${L(theme(id).scene)}</b></span>`
  : `✨ ${V('Chọn một nơi, giao diện sẽ đổi theo cảnh sắc nơi đó.', 'Pick a place and the whole app takes on its scenery.')}`);
