'use strict';
// Shared onboarding state and place-picker markup (X-01, X-06).

/* ================= Place themes ================= */
const F = { ready: false, gender: '', placeType: 'hometown', placeId: '' }; // onboarding choices that are not plain inputs
const ageOf = d => (d ? (Date.now() - new Date(d)) / 31557600000 : -1);
const placeSub = t => (t === 'destination'
  ? V('Nơi bạn sắp đến: luyện trước những câu sẽ dùng ở đó.', 'Where you are heading: practise the phrases you will need there.')
  : V('Nơi bạn lớn lên: kể chuyện quê nhà bằng tiếng Anh.', 'Where you grew up: tell its story in English.'));
// Subtitle lists the supported landmarks (the place's scenes); "other" keeps its one-line description
const placeSights = (id, t) => (id === 'other' || !t.scenes?.length ? L(t.scene)
  : `<span class="pc-count">${t.scenes.length} ${V('địa danh', t.scenes.length > 1 ? 'landmarks' : 'landmark')}</span> · ${t.scenes.map(s => V(s[1], s[2])).join(', ')}`);
const placeCards = (sel, fn) => Object.entries(THEMES).map(([id, t]) => `
  <button type="button" class="place ${sel === id ? 'on' : ''}" data-place="${id}" aria-pressed="${sel === id}" style="--pc:${t.c.navy};--pc-soft:${t.c['card-blue'] || t.c.bg1}" onclick="${fn}('${id}',event)">
    <span class="pc-art">${placeArt(id)}</span>
    <span class="pc-text"><b>${L(t.name)}</b><small>${placeSights(id, t)}</small></span></button>`).join('');
const themeNote = id => (id
  ? `${placeArt(id)}<span>${V('Giao diện', 'Theme')}: <b>${sceneName(id, SCENE.key === id ? SCENE.i : 0)}</b></span>`
  : `✨ ${V('Chọn một nơi, giao diện sẽ đổi theo cảnh sắc nơi đó.', 'Pick a place and the whole app takes on its scenery.')}`);
