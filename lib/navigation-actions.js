'use strict';
// Shared screen controls and practice recommendations.

function setLang(l) { S.lang = l; document.documentElement.lang = l; save(); route(); }

function setRpMode(m) { S.rpMode = m; const b = $('#rp-body'); b.innerHTML = m === 'journey' ? journeyHtml() : libraryHtml(); document.querySelectorAll('.seg button').forEach((x, i) => x.classList.toggle('on', (i === 0) === (m === 'journey'))); observe(b); }
function renderLib() { const box = $('#lib'); box.innerHTML = libCards($('#q').value); observe(box); }
function guardLocked(id) { if (!isLocked(id)) return true; toast(V('Hoàn thành chặng trước để mở khoá 🔒', 'Finish the previous stop to unlock 🔒')); return false; }
function shiftWeek(d) { S.weekOff += d; $('#cal').innerHTML = calendarHtml(); }
function setTutorCat(c) { S.tutorCat = c; document.querySelectorAll('.chips .chip').forEach(x => x.classList.toggle('active', x.getAttribute('onclick').includes(`'${c}'`))); const box = $('#tq'); box.innerHTML = tutorList(); observe(box); }
function setSetting(k, v) { S.settings[k] = v; save(); if (location.hash.startsWith('#profile')) { const y = scrollY; route(); scrollTo(0, y); document.querySelectorAll('.reveal').forEach(show); } else talkSettings(); }

function hear(btn, sid, i) {
  const s = scen(sid); speak(s.vocab[i][0]); btn.style.background = 'var(--success)';
  S.heard.add(sid + i); const n = s.vocab.filter((_, j) => S.heard.has(sid + j)).length;
  $('#vc').textContent = `${n}/${s.vocab.length}`; $('#vbar').style.width = (n / s.vocab.length) * 100 + '%';
}
function practiseThis(k) {
  const s = nextScen();
  if (k === 'pron') { S.tutorCat = 'all'; location.hash = '#tutor'; }
  else if (k === 'grammar') { S.tutorCat = S.errors.some(e => e.cat === 'grammar') ? 'grammar' : 'all'; location.hash = S.tutorCat === 'grammar' ? '#tutor' : '#talk/' + s.id; }
  else if (k === 'vocab') location.hash = '#scenario/' + s.id;
  else location.hash = '#talk/' + s.id;
}
function critSheet(k) {
  const c = CRIT.find(x => x.k === k), low = c.subs.reduce((a, b) => (b[1] < a[1] ? b : a));
  openSheet(`
    <div class="row"><span class="tile-3d" style="width:56px;height:56px;border-radius:16px">${img(c.icon)}</span><div class="grow"><h2>${L(c.name)}</h2><p class="small muted">${L(c.d)}</p></div><b style="font-size:28px">${S.scores[k]}%</b></div>
    <div class="card mt-24">${c.subs.map(([n, v]) => `<div class="mt-16" style="margin-top:${n === c.subs[0][0] ? 0 : 16}px"><div class="row between small"><span>${L(n)}${n === low[0] ? ' <span class="tag amber">' + V('Yếu nhất', 'Weakest') + '</span>' : ''}</span><b>${v}%</b></div><div class="track light mt-8"><i data-w="${v}%" style="width:0;background:${scoreColor(v)}"></i></div></div>`).join('')}</div>
    <button class="btn mt-24" onclick="closeSheet();practiseThis('${k}')">${V('Luyện ngay', 'Practise this')} ${icon('right')}</button>`);
}
