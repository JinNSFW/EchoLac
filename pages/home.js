'use strict';
// home screen. Shared pieces live in components/.
VIEWS.home = {
    render() {
      const w = weakest(), s = nextScen(), goal = clamp(Math.round((S.today.min / 15) * 100), 0, 100);
      const rec = w.k === 'pron'
        ? { href: '#tutor', text: V(`Âm cuối đang là điểm yếu nhất. Luyện ${S.errors.filter(e => e.status === 'open').length} từ trong Gia sư để giữ chuỗi ngày học nhé!`, `Final sounds are your weakest point. Practise ${S.errors.filter(e => e.status === 'open').length} words in Tutor to keep your streak!`) }
        : { href: '#scenario/' + s.id, text: V(`${L(w.name)} là điểm yếu nhất. Hãy trò chuyện ở "${L(s.name)}" hôm nay.`, `${L(w.name)} is your weakest area. Try "${L(s.name)}" today.`) };
      const initials = S.user.name.trim().split(/\s+/).filter(Boolean).slice(-2).map(w => w[0]).join('').toUpperCase();
      const quick = [['#roleplay', 'chat', V('Nhập vai', 'Roleplay')], ['#tutor', 'cap', V('Gia sư AI', 'AI Tutor')], ['#explore', 'camera', 'Camera'], ['#radar', 'radar', V('Bản đồ lỗi', 'Error map')]];
      // Layout follows Figma "Home" (390×844): floating cards over the place scene (PRD C.6)
      return `
      <header class="home-top reveal">
        <a class="avatar-chip" href="#profile" aria-label="${V('Hồ sơ của', 'Profile of')} ${esc(S.user.name)}">${esc(initials)}</a>
        <button class="round-btn" onclick="toast(V('Chưa có thông báo mới','No new notifications'))" aria-label="${V('Thông báo', 'Notifications')}">${icon('bell')}</button>
      </header>
      <a class="float-card streak-card reveal" href="#profile">
        <span class="lbl">${V('Chuỗi học', 'Streak')}</span>
        <b>${streakNow()} ${V('ngày', 'days')} · ${fmt(S.xp)} XP</b>
        <span class="lv">Lv. ${level()}</span>
      </a>
      <div class="home-place reveal ${theme(S.place).scenes?.length ? '' : 'no-scene'}">${icon('pin', 'sm')}<b id="home-place">${esc(sceneName())}</b></div>
      <nav class="float-card quick reveal" aria-label="${V('Lối tắt', 'Shortcuts')}">
        ${quick.map(([h, ic, t]) => `<a href="${h}"><span class="q-ic">${icon(ic)}</span>${t}</a>`).join('')}
      </nav>
      <a class="float-card resume reveal" href="#scenario/${s.id}">
        <span class="grow"><span class="lbl">${V('Tiếp tục bài học', 'Continue lesson')}</span><b>${L(s.name)}</b>
          <span class="bar" role="img" aria-label="${S.today.min}/15 ${V('phút hôm nay', 'min today')}"><i data-w="${goal}%"></i></span></span>
        <span class="play-btn">${icon('play')}</span>
      </a>
      <a class="float-card mission reveal" href="${rec.href}">
        <span class="lbl">${V('Nhiệm vụ hôm nay', 'Today’s mission')}</span>
        <b>${rec.text}</b>
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
      `;
    },
  };
