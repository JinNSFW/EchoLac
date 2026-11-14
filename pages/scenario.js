'use strict';
// scenario screen. Shared pieces live in components/.
VIEWS.scenario = {
    render(id) {
      const s = scen(id);
      return `
      <div class="topbar centered reveal">
        <a class="icon-btn" href="#roleplay" aria-label="${V('Quay lại', 'Back')}">${icon('left')}</a>
        <h1 style="font-size:19px">${V('Chi tiết tình huống', 'Scenario details')}</h1>
        <button class="icon-btn sq" onclick="toast(V('Đã lưu tình huống','Scenario saved'))" aria-label="${V('Lưu', 'Save')}">${icon('bookmark')}</button>
      </div>
      <section class="card reveal">
        <div class="detail-head">
          <div class="tile-3d" style="background:linear-gradient(145deg,${s.bg[0]},${s.bg[1]})">${img(s.icon)}</div>
          <div class="grow"><h2>${s.en}</h2><div class="sub">${s.name.vi} · ${L(CATS[s.cat])}</div>
            <div class="meta-row"><span>${icon('clock')} ${s.min} ${V('phút', 'min')}</span><span>${icon('star')} ${s.level}</span><span>${icon('bolt')} ${s.xp} XP</span></div></div>
        </div>
        <div class="row between mt-24 small"><b>${V('Chuẩn bị từ vựng', 'Vocabulary ready')}</b><b id="vc">0/${s.vocab.length}</b></div>
        <div class="track blue light mt-8"><i id="vbar" style="width:0"></i></div>
        <div class="row between tiny muted mt-8"><span>${V('Nghe từng từ trước khi nói', 'Listen to each word before you speak')}</span><span>${s.vocab.length} ${V('từ', 'words')}</span></div>
      </section>
      <section class="mt-24 reveal">
        <div class="small muted row" style="gap:6px">${icon('person', 'sm')} ${V('Bạn sẽ nói chuyện với', 'You will talk with')}</div>
        <div class="persona mt-8"><span class="face">${s.persona.name[0]}</span><div><b>${s.persona.name}</b><div class="small muted">${L(s.persona)}</div></div></div>
      </section>
      <section class="card soft reveal mt-24">
        <div class="row" style="gap:10px">${icon('book')}<b>${V('Về địa điểm này', 'About this place')}</b></div>
        ${s.cando ? `<p class="small mt-8"><b>${V('Mục tiêu', 'Goal')}:</b> ${L(s.cando)}</p>` : ''}
        <p class="muted mt-8">${L(s.facts)}</p>
        ${s.asOf ? `<p class="tiny muted mt-8">${L(s.asOf)}</p>` : ''}
        ${s.sources ? `<p class="tiny muted mt-8"><span class="tag amber">${V('Chưa được giáo viên xác minh', 'Not yet teacher-verified')}</span> ${V('Nguồn', 'Sources')}: ${s.sources.map(x => x.url ? `<a href="${x.url}" target="_blank" rel="noopener">${esc(x.label)}</a>` : esc(x.label)).join(' · ')}</p>` : ''}
        <div class="row mt-16" style="flex-wrap:wrap;gap:8px">${s.vocab.slice(0, 4).map(v => `<span class="tag">${v[0]}</span>`).join('')}</div>
      </section>
      <section class="card reveal mt-24">
        <div class="unit-head"><span class="unit-num">1</span><div class="grow"><div class="small muted">${V('Bước 1', 'Step 1')}</div><b>${V('Học từ vựng', 'Learn the words')}</b></div><span class="tag green">${s.vocab.length} ${V('từ', 'words')}</span></div>
        <div class="mt-16">${s.vocab.map((v, i) => `
          <div class="vocab reveal" style="--d:${i * 50}ms">
            <span class="n">${i + 1}</span>
            <div class="grow"><div class="w">${v[0]} <span class="ipa">${v[1]}</span></div><div class="m">${v[2]}</div><div class="ex">“${v[3]}”</div></div>
            <button class="play" onclick="hear(this,'${s.id}',${i})" aria-label="${V('Nghe', 'Listen')} ${v[0]}">${icon('volume')}</button>
          </div>`).join('')}</div>
      </section>
      <section class="card reveal">
        <div class="unit-head"><span class="unit-num">2</span><div class="grow"><div class="small muted">${V('Bước 2', 'Step 2')}</div><b>${V(`Trò chuyện với ${s.persona.name}`, `Talk with ${s.persona.name}`)}</b></div>${icon('chat')}</div>
        <p class="small muted mt-8">${V('Khoảng 4–8 lượt nói. AI tự ghi lại lỗi phát âm và ngữ pháp.', 'About 4–8 turns. The AI notes your pronunciation and grammar slips automatically.')}</p>
      </section>
      <section class="card reveal">
        <div class="unit-head"><span class="unit-num">3</span><div class="grow"><div class="small muted">${V('Bước 3', 'Step 3')}</div><b>${V('Sửa lỗi trong Gia sư', 'Fix them in Tutor')}</b></div>${icon('micAi')}</div>
      </section>
      <div class="sticky-cta reveal"><a class="btn" href="#talk/${s.id}">${icon('mic')} ${V('Bắt đầu nói', 'Start talking')}</a></div>`;
    },
  };
