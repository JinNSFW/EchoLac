'use strict';
// profile screen. Shared pieces live in components/.
VIEWS.profile = {
    render() {
      const lv = level(), toNext = lv * 250 - S.xp, pct = Math.round(((S.xp % 250) / 250) * 100), mastered = S.errors.filter(e => e.status === 'mastered').length;
      const ach = [
        ['speech', V('Cuộc trò chuyện đầu tiên', 'First conversation'), V('Hoàn thành tình huống đầu tiên', 'Finished your first scenario'), S.sessions > 0],
        ['lantern', V('Hướng dẫn viên Hội An', 'Hoi An guide'), V('Hoàn thành Phố cổ Hội An', 'Completed Hoi An Ancient Town'), S.done.includes('hoian')],
        ['calendar', V('Chiến binh 7 ngày', 'Week warrior'), V('Chuỗi 7 ngày luyện tập', '7-day practice streak'), streakNow() >= 7],
        ['target', V('Thợ săn âm cuối', 'Final-sound hunter'), V('Thành thạo 3 từ âm cuối', 'Master 3 final-sound words'), S.errors.filter(e => e.cat === 'final_consonant' && e.status === 'mastered').length >= 3],
        ['bolt', V('Nhà vô địch XP', 'XP champion'), V('Đạt 5.000 XP', 'Earn 5,000 XP'), S.xp >= 5000],
      ];
      return `
      <div class="profile-head reveal">
        <div class="row between"><a class="icon-btn" href="#home" aria-label="${V('Quay lại', 'Back')}">${icon('left')}</a><a class="icon-btn sq" href="#settings" onclick="event.preventDefault();$('#settings').scrollIntoView({behavior:'smooth'})" aria-label="${V('Cài đặt', 'Settings')}">${icon('sliders')}</a></div>
        <div class="big-avatar">${img('student')}<span class="pill navy lv">Lv.${lv}</span></div>
        <h2 class="center mt-16" style="font-size:24px;font-weight:700">${esc(S.user.name)}</h2>
        <p class="center muted">${S.place !== 'other'
          ? `${S.user.placeType === 'destination' ? V('Điểm đến', 'Destination') : V('Quê hương', 'Hometown')}: ${L(theme(S.place).name)}`
          : V('Học sinh · THPT Phan Châu Trinh', 'Student · Phan Chau Trinh High School')}</p>
        <div class="row between small muted mt-24"><span>Level ${lv}</span><span>${toNext} ${V('XP để lên cấp', 'XP to next level')}</span></div>
        <div class="track mt-8"><i data-w="${pct}%"></i></div>
      </div>
      <div class="section-title reveal"><span>${V('Thống kê', 'Your Stats')}</span></div>
      <div class="grid2">
        ${[['g-gold', 'bolt', fmt(S.xp), V('Tổng XP', 'Total XP')], ['g-orange', 'cal', `${streakNow()} ${V('ngày', 'days')}`, V('Chuỗi hiện tại', 'Current streak')], ['g-blue', 'book', S.sessions, V('Phiên đã luyện', 'Sessions done')], ['g-green', 'trend', mastered, V('Từ thành thạo', 'Words mastered')]]
          .map(([g, ic, v, l], i) => `<div class="stat-tile reveal" style="--d:${i * 60}ms"><span class="ic ${g}">${icon(ic)}</span><b>${v}</b><span>${l}</span></div>`).join('')}
      </div>
      <div class="section-title reveal"><span>${V('Thành tích', 'Achievements')}</span></div>
      ${ach.map(([ic, t, d, on], i) => `<div class="ach reveal ${on ? 'on' : ''}" style="--d:${i * 50}ms"><span class="ic">${img(ic)}</span><div class="grow"><div class="t">${t} ${on ? '🏅' : ''}</div><div class="d">${d}</div></div></div>`).join('')}
      <div class="section-title reveal" id="settings"><span>${V('Cài đặt', 'Settings')}</span></div>
      <section class="card reveal">
        <div class="set-row" style="display:block"><div class="row"><span class="ic">${img(theme(S.place).icon).replace('class=""', 'style="width:24px;height:24px"')}</span><span>${V('Địa điểm & giao diện', 'Place & theme')}</span></div>
          <div class="place-grid mt-16">${placeCards(S.place, 'pickPlace')}</div></div>
        <div class="set-row"><span class="ic">${icon('globe')}</span><span class="grow">${V('Ngôn ngữ giao diện', 'Interface language')}</span>${langToggle()}</div>
        <div class="set-row" style="display:block"><div class="row"><span class="ic">${icon('volume')}</span><span>${V('Giọng AI', 'AI accent')}</span></div><div class="seg four mt-16">${ACCENTS.map(([k, vi, en]) => `<button class="${S.settings.accent === k ? 'on' : ''}" onclick="setSetting('accent','${k}')">${V(vi, en)}</button>`).join('')}</div></div>
        <div class="set-row" style="display:block"><div class="row"><span class="ic">${icon('gauge')}</span><span>${V('Tốc độ nói của AI', 'AI speech rate')}</span></div><div class="seg three mt-16">${[['slow', 'Chậm', 'Slow'], ['medium', 'Vừa', 'Medium'], ['fast', 'Nhanh', 'Fast']].map(([k, vi, en]) => `<button class="${S.settings.rate === k ? 'on' : ''}" onclick="setSetting('rate','${k}')">${V(vi, en)}</button>`).join('')}</div></div>
        <div class="set-row"><span class="ic">${icon('cc')}</span><span class="grow">${V('Phụ đề', 'Subtitles')}</span><button class="toggle ${S.settings.subs ? 'on' : ''}" onclick="setSetting('subs',${!S.settings.subs})" aria-label="${V('Phụ đề', 'Subtitles')}" aria-pressed="${S.settings.subs}"></button></div>
        <div class="set-row"><span class="ic">${icon('refresh')}</span><span class="grow">${V('Đặt lại dữ liệu demo', 'Reset demo data')}</span><button class="btn white sm" onclick="resetDemo()">${V('Đặt lại', 'Reset')}</button></div>
        <div class="set-row"><span class="ic" style="color:var(--danger)">${icon('logout')}</span><button class="grow" style="text-align:left;color:var(--danger);font-weight:600" onclick="signOut()">${V('Đăng xuất', 'Sign out')}</button></div>
      </section>`;
    },
  };
