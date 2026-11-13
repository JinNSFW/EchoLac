'use strict';
// locate screen. Shared pieces live in components/.
VIEWS.locate = {
    render: () => `
      <div class="topbar reveal">
        <a class="icon-btn" href="#explore" aria-label="${V('Quay lại', 'Back')}">${icon('left')}</a>
        <h1>${V('Xác định vị trí', 'Location check')}</h1>
        <span class="tag ${isDemo() ? 'amber' : 'green'}">${isDemo() ? V('Demo', 'Demo') : V('Thật', 'Live')}</span>
      </div>
      <div id="loc-body" aria-live="polite"><section class="card reveal"><div class="row" style="gap:12px"><span class="gps-dot" data-s="locating">${icon('pin')}</span><b>${V('Đang tìm vị trí…', 'Finding your location…')}</b></div></section></div>`,
    mount: () => locate().then(() => { const b = $('#loc-body'); if (b) { b.innerHTML = locateHtml(); observe(b); } }),
  };
