'use strict';
// home screen. Shared pieces live in components/.
VIEWS.home = {
    render() {
      const initials = S.user.name.trim().split(/\s+/).filter(Boolean).slice(-2).map(w => w[0]).join('').toUpperCase();
      const quick = [['#roleplay', 'chat', V('Nhập vai', 'Roleplay')], ['#tutor', 'cap', V('Gia sư AI', 'AI Tutor')], ['#explore', 'camera', 'Camera'], ['#radar', 'radar', V('Bản đồ lỗi', 'Error map')]];
      // Layout follows Figma "Home" (390×844): floating cards over the place scene (PRD C.6)
      return `
      <header class="home-top reveal">
        <a class="avatar-chip" href="#profile" aria-label="${V('Hồ sơ của', 'Profile of')} ${esc(S.user.name)}">${esc(initials)}</a>
        <button class="round-btn has-dot" onclick="openNotices()" aria-label="${V('Thông báo: 1 nhiệm vụ hôm nay', 'Notifications: 1 mission today')}">${icon('bell')}</button>
      </header>
      <a class="float-card streak-card reveal" href="#profile">
        <span class="lbl">${V('Chuỗi học', 'Streak')}</span>
        <b>${streakNow()} ${V('ngày', 'days')} · ${fmt(S.xp)} XP</b>
        <span class="lv">Lv. ${level()}</span>
      </a>
      <div class="home-place reveal ${theme(S.place).scenes?.length || theme(S.place).hero ? '' : 'no-scene'}">${icon('pin', 'sm')}<b id="home-place">${esc(sceneName())}</b></div>
      <nav class="float-card quick reveal" aria-label="${V('Lối tắt', 'Shortcuts')}">
        ${quick.map(([h, ic, t]) => `<a href="${h}"${h === '#roleplay' ? ' aria-haspopup="dialog" onclick="return openPlayMenu()"' : ''}><span class="q-ic">${icon(ic)}</span>${t}</a>`).join('')}
      </nav>
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
            <div class="ring">${ringSvg(S.scores[c.k] ?? 0)}<b>${skillScoreText(c.k)}</b></div>
            <h3>${L(c.name)}</h3><p>${L(c.d)}</p>
          </a>`).join('')}
      </div>
      `;
    },
  };
