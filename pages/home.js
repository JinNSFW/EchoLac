'use strict';
// home screen. Shared pieces live in components/.
VIEWS.home = {
    render() {
      const w = weakest(), s = nextScen(), goal = clamp(Math.round((S.today.min / 15) * 100), 0, 100);
      const rec = w.k === 'pron'
        ? { href: '#tutor', text: V(`Âm cuối đang là điểm yếu nhất. Luyện ${S.errors.filter(e => e.status === 'open').length} từ trong Gia sư để giữ chuỗi ngày học nhé!`, `Final sounds are your weakest point. Practise ${S.errors.filter(e => e.status === 'open').length} words in Tutor to keep your streak!`) }
        : { href: '#scenario/' + s.id, text: V(`${L(w.name)} là điểm yếu nhất. Hãy trò chuyện ở "${L(s.name)}" hôm nay.`, `${L(w.name)} is your weakest area. Try "${L(s.name)}" today.`) };
      return `
      <header class="row between reveal">
        <div class="row">
          <div class="avatar">${img('student', '', '')}<span class="online"></span></div>
          <div><div class="row" style="gap:8px"><span class="hello">${V('Chào', 'Hi')} ${esc(S.user.name.split(' ').pop())}!</span><span class="pill navy">Lv. ${level()}</span></div>
          <div class="xp-line">${img('bolt')} ${fmt(S.xp)} XP${S.place !== 'other' ? ` · <span class="place-chip">${img(theme(S.place).icon)} ${L(theme(S.place).name)}</span>` : ''}</div></div>
        </div>
        <div class="row" style="gap:10px">
          <a class="icon-btn" href="#camera" aria-label="${V('Quét địa danh bằng camera', 'Scan a landmark with the camera')}">${icon('scan')}</a>
          <button class="icon-btn" onclick="toast(V('Chưa có thông báo mới','No new notifications'))" aria-label="${V('Thông báo', 'Notifications')}">${icon('bell')}<span class="badge-dot"></span></button>
        </div>
      </header>
      <a class="card blue hero reveal" href="${rec.href}" style="--d:80ms;display:block">
        ${img('target', 'peek')}
        <h2>${V('Luyện tập hôm nay!', 'Today’s practice!')}</h2>
        <p>${rec.text}</p>
        <div class="row mt-16">
          <div class="grow"><div class="track"><i data-w="${goal}%"></i><span class="knob" data-left="${goal}%" style="left:0"></span></div>
          <div class="tiny muted mt-8">${S.today.min}/15 ${V('phút hôm nay', 'min today')}</div></div>
          <span class="go-btn">${icon('right')}</span>
        </div>
      </a>
      <a class="card cam-entry reveal" href="#explore" style="--d:120ms">
        <span class="ic">${icon('camera')}</span>
        <span class="grow"><b>${V('Học qua ống kính', 'Learn with your camera')}</b><small>${V('Chụp một địa danh, học tiếng Anh về chính nơi đó', 'Snap a landmark, learn English about it')}</small></span>
        ${icon('chevR')}
      </a>
      <section class="card reveal mt-24">
        <div class="row between">
          <div class="row" style="gap:10px">${img('fire', '', '').replace('class=""', 'style="width:26px;height:26px"')}<h2 style="font-size:17px;font-weight:600">${V('Chuỗi ngày học', 'Daily Streak')}</h2></div>
          <span class="pill beige">${streakNow()} ${V('ngày', 'days')}</span>
        </div>
        <div class="week mt-24">${weekDays(0).map(d => `<div><div class="lbl">${d.lbl}</div><div class="flame ${d.on ? 'on' : ''} ${d.today && !d.on ? 'today' : ''}">${d.on ? img('fire') : '<i></i>'}</div></div>`).join('')}</div>
      </section>
      <section class="card reveal" id="cal">${calendarHtml()}</section>
      <div class="section-title reveal"><span>${V('Kỹ năng của bạn', 'Your skills at a glance')}</span><a href="#radar">${V('Xem tất cả', 'View all')}</a></div>
      <div class="grid2">
        ${CRIT.map((c, i) => `
          <a class="skill-card reveal" style="--d:${i * 70}ms" href="#radar">
            ${img(c.icon, 'peek')}
            <div class="ring">${ringSvg(S.scores[c.k])}<b>${S.scores[c.k]}%</b></div>
            <h3>${L(c.name)}</h3><p>${L(c.d)}</p>
          </a>`).join('')}
      </div>
      <div class="section-title reveal"><span>${V('Tiếp tục hành trình', 'Continue your journey')}</span><a href="#roleplay">${V('Bản đồ', 'Map')}</a></div>
      <a class="card soft reveal continue" href="#scenario/${s.id}">
        <div class="grow">
          <div class="row" style="gap:10px"><span class="play-sm">${icon('play', 'sm')}</span><b>${L(s.name)}</b></div>
          <p class="small muted mt-8">${V('Trò chuyện với', 'Talk with')} ${s.persona.name} · ${s.min} ${V('phút', 'min')} · ${s.level}</p>
        </div>
        <span class="go-btn" style="width:60px;height:60px">${icon('play')}</span>
      </a>`;
    },
  };
