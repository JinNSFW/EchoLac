'use strict';
// learn screen. Shared pieces live in components/.
VIEWS.learn = {
    render(id) {
      const l = loc(id);
      if (!l) { location.hash = '#explore'; return ''; }
      const photo = CL.photoFor === l.id && CL.photo, tabs = [['discover', 'Khám phá', 'Discover'], ['words', 'Học tiếng Anh', 'Learn English'], ['practice', 'Luyện nói', 'Practice']];
      return `
      <div class="topbar centered reveal">
        <a class="icon-btn" href="#explore" aria-label="${V('Quay lại', 'Back')}">${icon('left')}</a>
        <h1 style="font-size:19px">${V('Bài học tại chỗ', 'On-the-spot lesson')}</h1>
        <button class="icon-btn" onclick="camIntro()" aria-label="${V('Chụp địa danh khác', 'Snap another landmark')}">${icon('camera')}</button>
      </div>
      <figure class="learn-photo reveal zoom">
        ${photo ? `<img class="ph" src="${photo}" alt="${V('Ảnh bạn chụp', 'Your photo of')} ${esc(l.name.en)}">` : `<div class="illus" style="--g1:${esc(l.bg[0])};--g2:${esc(l.bg[1])}">${img(l.icon)}</div>`}
        <figcaption>${photo ? V('Ảnh của bạn · chỉ trên máy này', 'Your photo · on this device only') : V('Hình minh hoạ', 'Illustration')}</figcaption>
      </figure>
      <h2 class="learn-title reveal">${esc(l.name.en)}</h2>
      <p class="muted reveal">${esc(l.name.vi)}</p>
      <div class="row mt-8 reveal" style="gap:8px;flex-wrap:wrap">${verifyTag(l.id)}${l.demo ? `<span class="tag amber">${V('Dữ liệu mẫu', 'Demo data')}</span>` : ''}${l.verified ? `<span class="tag green">${V('Giáo viên đã kiểm duyệt', 'Teacher-verified')}</span>` : `<span class="tag">${V('Thông tin chờ kiểm duyệt', 'Facts pending review')}</span>`}</div>
      <div class="lprog reveal" id="lprog">${progHtml(l)}</div>
      <div class="seg three reveal" role="tablist" aria-label="${V('Phần bài học', 'Lesson part')}">${tabs.map(([k, vi, en]) => `<button role="tab" id="tab-${k}" aria-selected="${S.learnTab === k}" class="${S.learnTab === k ? 'on' : ''}" onclick="setLearnTab('${k}')">${V(vi, en)}</button>`).join('')}</div>
      <div class="lt-body" id="lt" role="tabpanel" aria-labelledby="tab-${S.learnTab}" data-id="${l.id}">${tabHtml(l)}</div>`;
    },
    mount: id => S.learnTab === 'practice' && loc(id) && startPractice(loc(id)),
  };
