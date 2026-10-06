export const DATE_TIME_FORMAT = "dd/MM/yyyy HH:mm:ss";

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
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

  return dateTimeFormatter
    .format(date)
    .replace(",", "");
}

// Chuyển thời gian nhập từ form sang UTC
export function parseDateTime(value) {
  const match = value
    .trim()
    .match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})$/);

  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);

  const date = new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      hour - 7,
      minute,
      second,
    ),
  );

  return formatDateTime(date) === value
    ? date
    : null;
}

// Kiểm tra khoảng thời gian nhập vào
export function getDateRangeError(fromTime, toTime) {
  const fromDate = fromTime
    ? parseDateTime(fromTime)
    : null;

  const toDate = toTime
    ? parseDateTime(toTime)
    : null;

  if ((fromTime && !fromDate) || (toTime && !toDate)) {
    return `Nhập thời gian theo định dạng ${DATE_TIME_FORMAT}.`;
  }

  if (fromDate && toDate && fromDate > toDate) {
    return "Thời gian bắt đầu phải trước hoặc bằng thời gian kết thúc.";
  }

  return "";
}