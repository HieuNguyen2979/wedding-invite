/**
 * Google Apps Script – nhận xác nhận tham dự (RSVP) từ thiệp cưới online
 * và ghi vào Google Sheet đang gắn script này.
 *
 * Cách dùng: Mở Google Sheet > Tiện ích mở rộng > Apps Script > dán toàn bộ file này > Lưu
 * Sau đó: Triển khai > Tùy chọn triển khai mới > Ứng dụng web
 *   - Thực thi dưới tên: Tôi
 *   - Người có quyền truy cập: Bất kỳ ai
 */

const SHEET_NAME = 'RSVP';
const HEADERS = ['Thời gian', 'Họ tên', 'Số điện thoại', 'Tham dự', 'Số người', 'Khách của', 'Lời chúc'];

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000); // tránh ghi đè khi nhiều khách gửi cùng lúc
  try {
    const p = e.parameter || {};
    const clean = v => String(v || '').trim().slice(0, 500);

    if (!clean(p.name)) return json_({ ok: false, error: 'Thiếu họ tên' });
    if (clean(p.website)) return json_({ ok: true }); // bẫy chống spam bot (honeypot)

    getSheet_().appendRow([
      new Date(),
      clean(p.name),
      "'" + clean(p.phone),          // dấu ' giữ số 0 đầu SĐT
      clean(p.attend),
      Number(p.guests) || 0,
      clean(p.side),
      clean(p.message)
    ]);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: err.message });
  } finally {
    lock.releaseLock();
  }
}

// Mở URL ứng dụng web trên trình duyệt để kiểm tra script đã chạy
function doGet() {
  return json_({ ok: true, message: 'RSVP endpoint đang hoạt động' });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
