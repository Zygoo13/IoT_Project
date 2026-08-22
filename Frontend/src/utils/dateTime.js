export const DATE_TIME_FORMAT = "dd/MM/yyyy HH:mm:ss";

export function formatDateTime(value) {
  const date = new Date(value);
  const pad = (part) => String(part).padStart(2, "0");

  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function parseDateTime(value) {
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})$/);

  if (!match) {
    return null;
  }

  const [, day, month, year, hour, minute, second] = match.map(Number);
  const date = new Date(year, month - 1, day, hour, minute, second);

  const isValid = date.getFullYear() === year
    && date.getMonth() === month - 1
    && date.getDate() === day
    && date.getHours() === hour
    && date.getMinutes() === minute
    && date.getSeconds() === second;

  return isValid ? date : null;
}
