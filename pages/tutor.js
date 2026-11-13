'use strict';
// tutor screen. Shared pieces live in components/.
VIEWS.tutor = {
    render() {
      const open = S.errors.filter(e => e.status === 'open'), mastered = S.errors.filter(e => e.status === 'mastered');
      const cats = [...new Set(S.errors.map(e => e.cat))];
      const first = open[0];
      return `
      <div class="topbar reveal">
        <div class="grow"><h1>${V('Gia sư phát âm', 'Pronunciation Tutor')}</h1><p class="small muted">${V('Lỗi tự động lưu từ các cuộc trò chuyện', 'Errors saved automatically from your conversations')}</p></div>
        <div class="stats-mini"><span style="color:var(--lantern-b)">${img('fire')} ${streakNow()}</span></div>
      </div>
      ${tutorSay(first ? V(`Bạn có <b>${open.length}</b> mục cần luyện. Bắt đầu với “<b>${esc(first.word)}</b>” nhé — chỉ mất 1 phút thôi!`, `You have <b>${open.length}</b> items to practise. Let’s start with “<b>${esc(first.word)}</b>” — it takes one minute!`) : V('Không còn lỗi nào! Đi trò chuyện để tìm thử thách mới nhé.', 'Nothing to fix! Go have a conversation to find new challenges.'), 60)}
      <div class="stat3 mt-24">
        <div class="card reveal"><b style="color:var(--lantern-b)">${open.length}</b><span>${V('Cần luyện', 'To practise')}</span></div>
        <div class="card reveal" style="--d:60ms"><b>${mastered.filter(e => e.days.at(-1) <= day(3)).length}</b><span>${V('Ôn hôm nay', 'Review today')}</span></div>
        <div class="card reveal" style="--d:120ms"><b style="color:var(--success)">${mastered.length}</b><span>${V('Thành thạo', 'Mastered')}</span></div>
      </div>
      <div class="chips mt-24 reveal">
        <button class="chip ${S.tutorCat === 'all' ? 'active' : ''}" onclick="setTutorCat('all')">${V('Tất cả', 'All')}</button>
        ${cats.map(c => `<button class="chip ${S.tutorCat === c ? 'active' : ''}" onclick="setTutorCat('${c}')">${L(ERR_CAT[c])}</button>`).join('')}
      </div>
      <div class="mt-8" id="tq">${tutorList()}</div>
      ${open.length ? '' : `<a class="btn mt-24 reveal" href="#roleplay">${icon('chat')} ${V('Đi trò chuyện', 'Start a conversation')}</a>`}`;
    },
  };
