// Narrow filters for the verified-adult pilot. Privacy for other accounts is enforced by the
// server age gate; pattern matching cannot identify every personal detail or unsafe statement.
const contact = /[@<>]|\b(?:https?:\/\/|www\.)|\d(?:[\s()+.-]*\d){7}/i;
const identifying = /\b(?:my (?:full )?name is|i (?:live|study) at|your (?:full )?name|(?:my|your) (?:school|address|phone|email|password)|where (?:do|did) you (?:live|study|go to school)|(?:call|contact|message|text) me|ten (?:day du cua )?toi la|(?:toi|em) hoc (?:o|tai)|truong (?:thpt|thcs|tieu hoc)|so dien thoai|dia chi nha)\b/;
const unsafe = /\b(?:system prompt|ignore (?:all |the |your )?(?:previous |prior )?(?:instructions|rules)|jailbreak|reveal (?:the |your )?(?:secret|credentials)|(?:build|make) (?:a |an )?(?:bomb|weapon)|(?:kill|hurt) (?:yourself|myself)|(?:kill|hurt) (?:someone|people)|sex(?:ual)? content|porn(?:ography)?|bo qua (?:chi dan|quy tac)|che tao bom|tu tu|khieu dam)\b/;

export function safeConversationText(text: string): boolean {
  const normalized = text.normalize('NFKD').replace(/\p{M}/gu, '').replace(/đ/gi, 'd').toLowerCase();
  return !contact.test(normalized) && !identifying.test(normalized) && !unsafe.test(normalized)
    && !/[\p{Cf}\p{Cc}]/u.test(normalized.replace(/[\t\n\r]/g, ''));
}
