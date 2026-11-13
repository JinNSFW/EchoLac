'use strict';
// Weekly calendar markup.

/* ================= View parts ================= */
function weekDays(off) {
  const now = new Date(), mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7) + off * 7);
  const names = S.lang === 'vi' ? ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return names.map((lbl, i) => {
    const d = new Date(mon); d.setDate(mon.getDate() + i);
    const k = iso(d), today = k === iso(), back = Math.round((new Date(iso()) - new Date(k)) / 864e5);
    return { lbl, date: d, today, on: (back >= 1 && back <= S.streak) || (today && S.today.min > 0) };
  });
}
function calendarHtml() {
  const days = weekDays(S.weekOff), m = new Intl.DateTimeFormat(S.lang === 'vi' ? 'vi-VN' : 'en-US', { month: 'long', year: 'numeric' }).format(days[3].date);
  return `<div class="row between"><h2 style="font-size:17px;font-weight:600">${m.charAt(0).toUpperCase() + m.slice(1)}</h2>
    <div class="row" style="gap:4px"><button class="icon-btn" style="width:36px;height:36px;box-shadow:none;background:none" onclick="shiftWeek(-1)" aria-label="${V('Tuần trước', 'Previous week')}">${icon('chevL', 'sm')}</button><button class="icon-btn" style="width:36px;height:36px;box-shadow:none;background:none" onclick="shiftWeek(1)" aria-label="${V('Tuần sau', 'Next week')}">${icon('chevR', 'sm')}</button></div></div>
    <div class="week mt-24">${days.map(d => `<div><div class="lbl">${S.lang === 'vi' ? d.lbl : d.lbl.charAt(0)}</div><div class="cal-day ${d.today ? 'today' : ''} ${d.on ? 'done' : ''}">${d.date.getDate()}</div></div>`).join('')}</div>`;
}
