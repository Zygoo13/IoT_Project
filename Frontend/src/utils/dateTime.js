export const DATE_TIME_FORMAT = "dd/MM/yyyy HH:mm:ss";

const dinhDangThoiGian = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Ho_Chi_Minh",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

// Hiển thị thời gian theo giờ Việt Nam
export function formatDateTime(value) {
  if (!value) {
    return "Chưa có";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Không hợp lệ";
  }

  return dinhDangThoiGian.format(date).replace(",", "");
}

// Chuyển thời gian nhập từ form sang UTC
export function parseDateTime(value) {
  const match = value
    .trim()
    .match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})$/);

  if (!match) {
    return null;
  }

  const ngay = Number(match[1]);
  const thang = Number(match[2]);
  const nam = Number(match[3]);
  const gio = Number(match[4]);
  const phut = Number(match[5]);
  const giay = Number(match[6]);

  const date = new Date(
    Date.UTC(nam, thang - 1, ngay, gio - 7, phut, giay),
  );

  return formatDateTime(date) === value ? date : null;
}

// Kiểm tra khoảng thời gian
export function getDateRangeError(fromTime, toTime) {
  const tuNgay = fromTime ? parseDateTime(fromTime) : null;
  const denNgay = toTime ? parseDateTime(toTime) : null;

  if ((fromTime && !tuNgay) || (toTime && !denNgay)) {
    return `Nhập thời gian theo định dạng ${DATE_TIME_FORMAT}.`;
  }

  if (tuNgay && denNgay && tuNgay > denNgay) {
    return "Thời gian bắt đầu phải trước hoặc bằng thời gian kết thúc.";
  }

  return "";
}