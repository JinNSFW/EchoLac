'use strict';
// Entry point: place-theme configuration, then application startup.

'use strict';
// EchoLạc clickable prototype. Mock data only: no real ASR, scoring or LLM yet (see AGENTS.md for the target stack).

/* ---------- Place themes: the ONE source for every theme (X-06) ----------
   c       colour tokens → written as :root[data-theme="<id>"] { --<token>: … } by installThemes()
   scenes  [file, vi, en] painted 2.5D landmark scenes, shown in turn at the top of every screen.
           Image: assets/scenes/<id>/<file>.webp (780×1387, bottom ~45% kept plain for floating cards).
   To add a place: add an entry here plus its images; selfTest() (open with ?test) checks its text contrast. */
const THEMES = {
  danang: {
    icon: 'dragon', name: { vi: 'Đà Nẵng', en: 'Da Nang' }, scene: { vi: 'Cầu Rồng & sông Hàn', en: 'Dragon Bridge & Han River' },
    c: { navy: '#1F4E79', 'navy-2': '#2E6A99', primary: '#2E8BC7', accent: '#E2B23A', 'primary-soft': '#D5EAF7', 'card-blue': '#E4F2FB', tint: '#EEF5FA', 'tint-2': '#DDE9F1', line: '#E2EDF4', muted: '#4A6072', faint: '#50667A', 'accent-line': '#A9CBE0', bg1: '#C9E5F6', bg2: '#DDF0FA', bg3: '#F1F8FC', bg4: '#FFF6E3', page: '#E3EEF5' },
    scenes: [['cau-rong', 'Cầu Rồng', 'Dragon Bridge'], ['ca-chep-hoa-rong', 'Tượng Cá chép hóa Rồng', 'Carp-into-Dragon Statue'], ['cong-vien-apec', 'Công viên APEC', 'APEC Park'], ['phat-ba-linh-ung', 'Tượng Phật Bà Quan Âm, chùa Linh Ứng', 'Lady Buddha, Linh Ung Pagoda'], ['cau-song-han', 'Cầu Sông Hàn', 'Han River Bridge']],
  },
  hoian: {
    icon: 'lantern', name: { vi: 'Hội An', en: 'Hoi An' }, scene: { vi: 'Chùa Cầu & phố đèn lồng', en: 'Covered Bridge & lantern town' },
    c: { navy: '#6E3410', 'navy-2': '#9A4A16', primary: '#D99A16', accent: '#C8372D', 'primary-soft': '#FCE8BE', 'card-blue': '#FFF1CF', tint: '#FFF7E6', 'tint-2': '#F5E5C8', line: '#F3E5CE', muted: '#714F2E', faint: '#7E6044', 'accent-line': '#EBC48A', bg1: '#FFE6A6', bg2: '#FFF0CC', bg3: '#FFF8E8', bg4: '#FFFBF3', page: '#F6E9D2' },
    scenes: [['chua-cau', 'Chùa Cầu', 'Japanese Covered Bridge']],
  },
  hue: {
    icon: 'crown', name: { vi: 'Huế', en: 'Hue' }, scene: { vi: 'Cầu Trường Tiền & Phu Văn Lâu', en: 'Truong Tien Bridge & Phu Van Lau' },
    c: { navy: '#4B2A6B', 'navy-2': '#67418C', primary: '#8C5CC0', accent: '#C9A227', 'primary-soft': '#E9DDF6', 'card-blue': '#F2EAFA', tint: '#F7F2FB', 'tint-2': '#E8DEF1', line: '#ECE4F3', muted: '#5A4670', faint: '#625077', 'accent-line': '#C9B3E0', bg1: '#E2D3F2', bg2: '#EFE6F8', bg3: '#F9F5FC', bg4: '#FFF8EA', page: '#ECE4F2' },
    scenes: [['cau-truong-tien', 'Cầu Trường Tiền', 'Truong Tien Bridge'], ['phu-van-lau', 'Phu Văn Lâu', 'Phu Van Lau Pavilion']],
  },
  hanoi: {
    icon: 'turtle', name: { vi: 'Hà Nội', en: 'Hanoi' }, scene: { vi: 'Hồ Gươm & phố cổ', en: 'Hoan Kiem Lake & Old Quarter' },
    c: { navy: '#2F4F2A', 'navy-2': '#46683A', primary: '#6B8E45', accent: '#C0392B', 'primary-soft': '#E2EDD3', 'card-blue': '#EEF5E6', tint: '#F4F8EF', 'tint-2': '#E2EBD8', line: '#E6EEDD', muted: '#485C40', faint: '#52664A', 'accent-line': '#B7CC9C', bg1: '#D5E5C5', bg2: '#E6F0DC', bg3: '#F5F9F0', bg4: '#FBFCF8', page: '#E3EBDA' },
    scenes: [['thap-rua', 'Tháp Rùa, Hồ Hoàn Kiếm', 'Turtle Tower, Hoan Kiem Lake'], ['cau-the-huc', 'Cầu Thê Húc', 'The Huc Bridge'], ['chua-mot-cot', 'Chùa Một Cột', 'One Pillar Pagoda'], ['lang-chu-tich-ho-chi-minh', 'Lăng Chủ tịch Hồ Chí Minh', 'Ho Chi Minh Mausoleum'], ['nha-tho-lon', 'Nhà thờ Lớn Hà Nội', "St. Joseph's Cathedral"], ['o-quan-chuong', 'Ô Quan Chưởng', 'O Quan Chuong Gate'], ['hoang-thanh-thang-long', 'Hoàng thành Thăng Long', 'Imperial Citadel of Thang Long']],
  },
  halong: {
    icon: 'sailboat', name: { vi: 'Hạ Long', en: 'Ha Long' }, scene: { vi: 'Bảo tàng Quảng Ninh & cầu Bãi Cháy', en: 'Quang Ninh Museum & Bai Chay Bridge' },
    c: { navy: '#0F5B57', 'navy-2': '#1A7670', primary: '#17A08F', accent: '#C8553D', 'primary-soft': '#D0EFEA', 'card-blue': '#E0F5F1', tint: '#EFF8F6', 'tint-2': '#D9ECE8', line: '#E0EFEC', muted: '#3B5D5B', faint: '#456764', 'accent-line': '#9FD3CB', bg1: '#BFE7E1', bg2: '#DAF1EE', bg3: '#F0FAF8', bg4: '#F8FCFB', page: '#DCEDEA' },
    scenes: [['bao-tang-quang-ninh', 'Bảo tàng Quảng Ninh', 'Quang Ninh Museum'], ['cau-bai-chay', 'Cầu Bãi Cháy', 'Bai Chay Bridge']],
  },
  sapa: {
    icon: 'rice', name: { vi: 'Sa Pa', en: 'Sa Pa' }, scene: { vi: 'Nhà thờ đá & ruộng bậc thang', en: 'Stone Church & rice terraces' },
    c: { navy: '#3B5320', 'navy-2': '#52722C', primary: '#7FA637', accent: '#FFFFFF', 'primary-soft': '#E3EFCD', 'card-blue': '#EEF6DF', tint: '#F5F9EC', 'tint-2': '#E4EDD3', line: '#E8F0DA', muted: '#4F5C3A', faint: '#586545', 'accent-line': '#C2D89A', bg1: '#D6EAB8', bg2: '#E9F4D8', bg3: '#F7FBEF', bg4: '#FCFDF8', page: '#E6EDDA' },
    scenes: [['nha-tho-da', 'Nhà thờ đá Sa Pa', 'Sa Pa Stone Church']],
  },
  dalat: {
    icon: 'pine', name: { vi: 'Đà Lạt', en: 'Da Lat' }, scene: { vi: 'Hồ Xuân Hương & Nhà thờ Con Gà', en: 'Xuan Huong Lake & Chicken Church' },
    c: { navy: '#2F4A40', 'navy-2': '#46665A', primary: '#D46A93', accent: '#2F6B4F', 'primary-soft': '#F8DCE7', 'card-blue': '#FCEAF1', tint: '#FBF3F6', 'tint-2': '#F0DFE6', line: '#F2E6EB', muted: '#574F5A', faint: '#615966', 'accent-line': '#E9B3C8', bg1: '#F5D6E3', bg2: '#FAE8EF', bg3: '#FDF6F9', bg4: '#F3F8F5', page: '#EFE3E8' },
    scenes: [['nha-hang-thuy-ta', 'Nhà hàng Thủy Tạ, hồ Xuân Hương', 'Thuy Ta, Xuan Huong Lake'], ['quang-truong-lam-vien', 'Quảng trường Lâm Viên', 'Lam Vien Square'], ['nha-tho-con-ga', 'Nhà thờ Chính tòa Đà Lạt (Nhà thờ Con Gà)', 'Da Lat Cathedral']],
  },
  hcm: {
    icon: 'city', name: { vi: 'TP. Hồ Chí Minh', en: 'Ho Chi Minh City' }, scene: { vi: 'Nguyễn Huệ & Nhà thờ Đức Bà', en: 'Nguyen Hue & Notre-Dame' },
    c: { navy: '#5B2C1F', 'navy-2': '#7A3B28', primary: '#C8553D', accent: '#2F6B4F', 'primary-soft': '#F8DDD3', 'card-blue': '#FCEDE6', tint: '#FBF4F0', 'tint-2': '#EFE1D9', line: '#F2E7E1', muted: '#6A4D43', faint: '#735A50', 'accent-line': '#E8B9A8', bg1: '#F6E3D6', bg2: '#FAEEE6', bg3: '#FDF8F4', bg4: '#FFF8EC', page: '#F1E6DE' },
    scenes: [['tuong-dai-bac-ho', 'Tượng đài Chủ tịch Hồ Chí Minh, phố đi bộ Nguyễn Huệ', 'President Ho Chi Minh Monument, Nguyen Hue'], ['buu-dien-trung-tam', 'Bưu điện Trung tâm Sài Gòn', 'Saigon Central Post Office'], ['nha-tho-duc-ba', 'Nhà thờ Đức Bà Sài Gòn', 'Notre-Dame Cathedral of Saigon']],
  },
  nhatrang: {
    icon: 'beach', name: { vi: 'Nha Trang', en: 'Nha Trang' }, scene: { vi: 'Tháp Trầm Hương & Nhà thờ Núi', en: 'Tram Huong Tower & Mountain Cathedral' },
    c: { navy: '#14506B', 'navy-2': '#1D6A8A', primary: '#2A9BC0', accent: '#8E6BB8', 'primary-soft': '#D3EDF6', 'card-blue': '#E3F3F9', tint: '#EEF7FA', 'tint-2': '#DAEAF0', line: '#E1EEF3', muted: '#41606E', faint: '#4A6876', 'accent-line': '#A8D3E3', bg1: '#CDEBF5', bg2: '#E2F3F9', bg3: '#F3FAFC', bg4: '#FFF7EA', page: '#E2EEF2' },
    scenes: [['thap-tram-huong', 'Tháp Trầm Hương, Quảng trường 2/4', 'Tram Huong Tower, 2/4 Square'], ['nha-tho-nui', 'Nhà thờ Núi Nha Trang', 'Nha Trang Mountain Cathedral']],
  },
  other: {
    icon: 'pin', name: { vi: 'Nơi khác', en: 'Somewhere else' }, scene: { vi: 'Giao diện EchoLạc', en: 'Classic EchoLạc' },
    c: { navy: '#726958', 'navy-2': '#776D5B', primary: '#9C8466', accent: '#C98A1B', 'primary-soft': '#F3E6D0', 'card-blue': '#FFF4E1', tint: '#F7F1E7', 'tint-2': '#ECE6DB', line: '#EFE8DC', muted: '#6E6453', faint: '#776C5B', 'accent-line': '#D2C4AC', bg1: '#FFF4E2', bg2: '#FEF6E8', bg3: '#FCF9F3', bg4: '#F1EFEB', page: '#EEE9E1' },
    scenes: [], // no painted scene yet: the soft theme gradient shows instead
  },
};
const theme = id => THEMES[id] || THEMES.other;

installThemes();
applyTheme(S.place);
if (new URLSearchParams(location.search).has('test')) selfTest();
splash();
