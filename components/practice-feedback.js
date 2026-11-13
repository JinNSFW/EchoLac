'use strict';
// Practice feedback and conversation markup.

const srcTag = fact => `<span class="src ${fact ? 'fact' : ''}">${fact ? V('Từ fact sheet (mẫu, chờ kiểm duyệt)', 'From the fact sheet (demo, pending review)') : V('Nhận xét ngôn ngữ · quy tắc demo', 'Language tip · demo rules')}</span>`;
const feedbackHtml = r => `<p class="good">${icon('check', 'sm')}<span>${esc(L(r.good))}</span></p>${r.fix
  ? `<div class="fixbox">${r.fix.better ? `<small>${V('Nên nói', 'Better')}</small><b>${esc(r.fix.better)}</b>` : ''}<p>${esc(L(r.fix.why))}</p></div>`
  : `<p class="small muted mt-8">${V('Không có gì cần sửa!', 'Nothing to fix!')}</p>`}${srcTag(false)}`;

function practiceHtml() {
  return `
    <div class="tutor-note reveal">${icon('bulb', 'sm')}<p>${V('<b>Gia sư demo, chưa kết nối AI.</b> Câu hỏi soạn sẵn về địa danh này và vài quy tắc ngữ pháp đơn giản. Thông tin về địa danh chỉ lấy từ fact sheet.', '<b>Demo tutor, no AI connected.</b> Scripted questions about this place and a few simple grammar rules. Facts about the place come only from the fact sheet.')}</p></div>
    <div class="msgs" id="pmsgs" aria-live="polite"></div>
    <form class="say" onsubmit="event.preventDefault();sendAnswer()">
      <label class="sr" for="ans">${V('Câu trả lời của bạn', 'Your answer')}</label>
      <textarea id="ans" rows="1" disabled placeholder="${V('Trả lời bằng tiếng Anh…', 'Answer in English…')}" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendAnswer()}"></textarea>
      <button class="send" id="send" disabled aria-label="${V('Gửi', 'Send')}">${icon('send', 'sm')}</button>
    </form>
    <div class="chips mt-8"><button class="chip" type="button" onclick="helpStart()">${icon('bulb', 'sm')} ${V('Gợi ý mở đầu', 'Help me start')}</button></div>`;
}
