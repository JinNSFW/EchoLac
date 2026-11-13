'use strict';
// talk screen. Shared pieces live in components/.
VIEWS.talk = {
    render(id) {
      const s = scen(id);
      return `
      <div class="talk">
        <div class="talk-top">
          <div class="topbar">
            <a class="icon-btn" href="#scenario/${s.id}" aria-label="${V('Thoát', 'Leave')}">${icon('left')}</a>
            <div class="grow"><h1>${L(s.name)}</h1><div class="who">${V('Đang nói chuyện với', 'Talking with')} ${s.persona.name} · ${L(s.persona)}</div></div>
            <button class="icon-btn" onclick="talkSettings()" aria-label="${V('Cài đặt giọng nói', 'Voice settings')}">${icon('sliders')}</button>
          </div>
          <div class="turns"><span id="turn-lbl"></span><div class="track light"><i id="turn-bar" style="width:0;background:var(--primary)"></i></div></div>
        </div>
        <div class="msgs" id="msgs" aria-live="polite"></div>
        <div class="dock">
          <div class="dock-row">
            <button class="side" onclick="helpMe()"><span class="icon-btn">${icon('bulb')}</span>${V('Gợi ý', 'Help me')}</button>
            <button class="mic-btn" id="mic" onclick="micTap()" disabled aria-label="${V('Nhấn để nói', 'Tap to speak')}">${icon('mic')}</button>
            <button class="side" onclick="toggleSubs()"><span class="icon-btn" id="cc-btn" style="${S.settings.subs ? 'background:var(--navy);color:#fff' : ''}">${icon('cc')}</span>${V('Phụ đề', 'Subtitles')}</button>
          </div>
          <div class="hint" id="mic-hint">${V('Đợi nhân vật nói xong…', 'Wait for your partner…')}</div>
          <div class="disclaimer">${V('Thông tin địa danh lấy từ fact sheet do giáo viên kiểm duyệt.', 'Landmark facts come from a teacher-verified fact sheet.')}</div>
        </div>
      </div>`;
    },
    mount: id => startTalk(id),
  };
