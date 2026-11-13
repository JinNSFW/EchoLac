'use strict';
// camera screen. Shared pieces live in components/.
VIEWS.camera = {
    render: () => `
      <div class="tm" id="tm" data-state="intro">
        <video id="tm-v" playsinline muted autoplay aria-hidden="true"></video>
        <div class="tm-frame" aria-hidden="true"></div>
        <div class="tm-top">
          <a class="tm-btn" href="#roleplay" onclick="history.length>1&&(event.preventDefault(),history.back())" aria-label="${V('Quay lại / Back', 'Back / Quay lại')}">${icon('left')}</a>
          <p class="tm-label" id="tm-label" role="status" aria-live="polite"></p>
        </div>
        <section class="tm-panel" id="tm-panel"></section>
      </div>`,
    mount: () => (SC.ok ? startScan() : scanState('intro')),
  };
