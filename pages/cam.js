'use strict';
// cam screen. Shared pieces live in components/.
VIEWS.cam = {
    render() {
      if (!G.gps) { location.hash = '#locate'; return ''; }
      return `
      <div class="cam ${G.gps.candidates.length ? 'near' : ''}" id="cam">
        <video id="cam-v" playsinline muted autoplay aria-label="${V('Khung xem camera', 'Camera preview')}"></video>
        <img class="shot" id="cam-shot" alt="${V('Ảnh bạn vừa chụp', 'The photo you just took')}" hidden>
        <div class="scan" aria-hidden="true"></div>
        <div class="cam-top">
          <a class="cam-btn" href="#explore" aria-label="${V('Đóng camera', 'Close camera')}">${icon('x')}</a>
          <div class="gps-chip" role="status" data-s="${gpsTone(G.gps)}">${icon('pin', 'sm')}<span>${gpsShort(G.gps)}</span></div>
          <button class="cam-btn" id="torch" hidden aria-pressed="false" onclick="toggleTorch(this)" aria-label="${V('Đèn flash', 'Flash')}">${icon('bolt')}</button>
        </div>
        ${isDemo() ? `<span class="cam-demo">${V('Demo', 'Demo')} · ${L(SCENARIOS[CL.scen])}</span>` : ''}
        <div class="cam-guide" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
        <p class="cam-hint" id="cam-hint">${V('Hướng camera vào một địa danh được hỗ trợ để bắt đầu học.', 'Point your camera at a supported landmark to start learning.')}</p>
        <div class="cam-bottom">
          <label class="cam-side"><input type="file" accept="image/*" class="sr" onchange="usePhoto(this.files[0])"><span class="cam-btn">${icon('image')}</span>${V('Chọn ảnh', 'Photo')}</label>
          <button class="shutter" id="shutter" onclick="shoot()" disabled aria-label="${V('Chụp ảnh', 'Take photo')}"></button>
          <button class="cam-side" onclick="choosePlace('manual')"><span class="cam-btn">${icon('pin')}</span>${V('Chọn nơi', 'Choose')}</button>
        </div>
        <section class="rec" id="rec" hidden aria-live="polite"></section>
      </div>`;
    },
    mount: () => G.gps && startCam(),
  };
