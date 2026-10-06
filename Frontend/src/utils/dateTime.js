export const DATE_TIME_FORMAT = "dd/MM/yyyy HH:mm:ss";
const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric",
  hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
});

// Hiển thị thời gian theo giờ Việt Nam.
export function formatDateTime(value) {
  if (!value) return "Chưa có";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Không hợp lệ" : dateTimeFormatter.format(date).replace(",", "");
}

// Đọc thời gian nhập trên form và chuyển sang UTC để gửi API.
export function parseDateTime(value) {
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  // Việt Nam dùng UTC+07:00 và không đổi giờ mùa hè.
  const date = new Date(Date.UTC(year, month - 1, day, hour - 7, minute, second));
  return formatDateTime(date) === value ? date : null;
}

// Kiểm tra định dạng ngày và thứ tự hai đầu khoảng thời gian.
export function getDateRangeError(fromTime, toTime) {
  const fromDate = fromTime ? parseDateTime(fromTime) : null;
  const toDate = toTime ? parseDateTime(toTime) : null;
  if ((fromTime && !fromDate) || (toTime && !toDate)) {
    return `Nhập thời gian theo định dạng ${DATE_TIME_FORMAT}.`;
  }
  if (fromDate && toDate && fromDate > toDate) {
    return "Thời gian bắt đầu phải trước hoặc bằng thời gian kết thúc.";
  }
  return "";
}
