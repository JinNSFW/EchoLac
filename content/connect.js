'use strict';
// Local Guide Connect labels (docs/connect-plan.md §3): interests, place tags, district centres, time slots. No people.

const CONNECT_INTERESTS = ['history', 'food', 'architecture', 'crafts', 'nature', 'festivals'];
const CONNECT_INTEREST_NAMES = {
  history: { vi: 'Lịch sử', en: 'History' },
  food: { vi: 'Ẩm thực', en: 'Food' },
  architecture: { vi: 'Kiến trúc', en: 'Architecture' },
  crafts: { vi: 'Làng nghề', en: 'Crafts' },
  nature: { vi: 'Thiên nhiên', en: 'Nature' },
  festivals: { vi: 'Lễ hội', en: 'Festivals' },
};

// One entry per LOCS id (tests check coverage).
const LOCATION_TAGS = {
  'dragon-bridge': ['architecture', 'festivals'],
  'covered-bridge': ['history', 'architecture'],
  'hoi-an-ancient-town': ['history', 'architecture', 'crafts', 'food', 'festivals'],
  'marble-mountains': ['nature', 'crafts', 'history'],
  'han-market': ['food', 'crafts'],
  'han-river-bridge': ['architecture', 'festivals'],
  'apec-park': ['architecture', 'nature'],
  'linh-ung-lady-buddha': ['history', 'nature'],
  'dragon-carp': ['architecture', 'history'],
};

const CONNECT_SLOTS = ['sat-am', 'sat-pm', 'sun-am', 'sun-pm', 'weekday-pm'];
const CONNECT_SLOT_NAMES = {
  'sat-am': { vi: 'Sáng thứ Bảy', en: 'Saturday morning' },
  'sat-pm': { vi: 'Chiều thứ Bảy', en: 'Saturday afternoon' },
  'sun-am': { vi: 'Sáng Chủ nhật', en: 'Sunday morning' },
  'sun-pm': { vi: 'Chiều Chủ nhật', en: 'Sunday afternoon' },
  'weekday-pm': { vi: 'Chiều ngày thường', en: 'Weekday afternoon' },
};

// Server reason codes (connect-policy.ts, connect-request / connect-respond) in plain language.
const REASON_TEXT = {
  'location-not-approved': ['Địa điểm này không nằm trong danh sách được duyệt.', 'This place is not on the approved list.'],
  'tourist-not-eligible': ['Tài khoản du khách cần từ 18 tuổi và đã xác minh.', 'Tourist accounts must be 18+ and verified.'],
  'student-not-eligible': ['Tài khoản học sinh chưa đủ điều kiện kết nối.', 'The student account is not eligible to connect.'],
  'student-awaiting-approval': ['Học sinh đang chờ nhà trường và phụ huynh phê duyệt.', 'The student is waiting for school and guardian approval.'],
  'one-to-one-disabled': ['Gặp 1-1 chưa mở trong đợt thí điểm: chỉ có buổi nhóm do trường tổ chức.', 'One-to-one meetings are not open in the pilot: only school-run group sessions.'],
  'minor-one-to-one-blocked': ['Học sinh dưới 18 tuổi chỉ tham gia buổi nhóm có giám sát.', 'Students under 18 can only join supervised group sessions.'],
  'session-invalid': ['Buổi nhóm này không hợp lệ ở địa điểm đã chọn.', 'This group session is not valid at the chosen place.'],
  'not-available': ['Học sinh chưa có lịch rảnh tại địa điểm này.', 'The student has no free time at this place.'],
  blocked: ['Một trong hai bên đã chặn người kia.', 'One of you has blocked the other.'],
  'level-below-minimum': ['Cần trình độ tiếng Anh tối thiểu A2.', 'An English level of at least A2 is required.'],
  'session-full': ['Buổi nhóm đã đủ chỗ.', 'This group session is full.'],
  'duplicate-request': ['Đã có yêu cầu này rồi.', 'This request already exists.'],
  'not-pending': ['Yêu cầu không còn ở trạng thái chờ hoặc đã kết thúc.', 'This request is no longer open.'],
  'wrong-party': ['Bạn không phải một bên của yêu cầu này.', 'You are not a party to this request.'],
  'rate-limited': ['Bạn thao tác quá nhanh. Thử lại sau ít phút.', 'Too many actions. Try again in a few minutes.'],
  unverifiable: ['Máy chủ không xác nhận được điều kiện, nên chưa thực hiện.', 'The server could not confirm eligibility, so nothing was done.'],
};
