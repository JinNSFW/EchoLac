'use strict';
// roleplay screen. Shared pieces live in components/.
VIEWS.roleplay = {
    render: () => `
      <div class="topbar reveal">
        <h1>${V('Nhập vai', 'Roleplay')}</h1>
        <div class="stats-mini"><span>${img('star')} ${fmt(S.xp)} XP</span><span style="color:var(--lantern-b)">${img('fire')} ${streakNow()}</span></div>
        <a class="icon-btn" href="#camera" aria-label="${V('Quét địa danh bằng camera', 'Scan a landmark with the camera')}">${icon('scan')}</a>
      </div>
      <div class="seg reveal" role="tablist">
        <button class="${S.rpMode === 'journey' ? 'on' : ''}" onclick="setRpMode('journey')">${V('Hành trình', 'Journey')}</button>
        <button class="${S.rpMode === 'library' ? 'on' : ''}" onclick="setRpMode('library')">${V('Tất cả tình huống', 'All scenarios')}</button>
      </div>
      <div id="rp-body">${S.rpMode === 'journey' ? journeyHtml() : libraryHtml()}</div>`,
  };
