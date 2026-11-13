'use strict';
// place screen. Shared pieces live in components/.
VIEWS.place = {
    init() { // first visit: start from what the account already holds; later visits keep the unsaved choice
      if (F.ready) return;
      F.ready = true; F.placeType = S.user.placeType || 'hometown'; F.placeId = S.user.placeId || '';
    },
    render: () => `
      ${steps(2)}
      <div class="topbar between reveal" style="margin-bottom:8px">
        <a class="icon-btn" href="#signup" aria-label="${V('Quay lại bước 1', 'Back to step 1')}">${icon('left')}</a>
        <button type="button" class="skip" onclick="skipPlace()">${V('Bỏ qua', 'Skip')}</button>
      </div>
      <h1 class="center grad-title reveal" style="font-size:26px">${V('Nơi gắn bó với bạn', 'Your place')}</h1>
      <p class="center muted mt-8 reveal" id="place-sub">${placeSub(F.placeType)}</p>
      <div class="seg mt-24 reveal" role="radiogroup" aria-label="${V('Loại địa điểm', 'Kind of place')}" onkeydown="radioKeys(event)">
        ${[['hometown', 'Quê hương', 'Hometown'], ['destination', 'Điểm đến', 'Destination']].map(([k, vi, en]) => `<button type="button" role="radio" data-v="${k}" class="${F.placeType === k ? 'on' : ''}" aria-checked="${F.placeType === k}" tabindex="${F.placeType === k ? 0 : -1}" onclick="pickType('${k}')">${V(vi, en)}</button>`).join('')}
      </div>
      <div class="place-grid mt-24 reveal">${placeCards(F.placeId, 'previewPlace')}</div>
      <p class="theme-note reveal" id="theme-note" aria-live="polite">${themeNote(F.placeId)}</p>
      <div class="sticky-cta"><button class="btn" id="start" onclick="startJourney()" ${F.placeId ? '' : 'disabled'}>${V('Bắt đầu hành trình', 'Start my journey')} ${icon('right')}</button></div>`,
  };
