export const DATE_TIME_FORMAT = "dd/MM/yyyy HH:mm:ss";
const formatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric",
  hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
});

export function formatDateTime(value) {
  if (!value) return "Chưa có";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Không hợp lệ" : formatter.format(date).replace(",", "");
}

export function parseDateTime(value) {
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})$/);
  if (!match) return null;
  const [, day, month, year, hour, minute, second] = match.map(Number);
  // Việt Nam dùng UTC+07:00 và không đổi giờ mùa hè.
  const date = new Date(Date.UTC(year, month - 1, day, hour - 7, minute, second));
  return formatDateTime(date) === value ? date : null;
}
