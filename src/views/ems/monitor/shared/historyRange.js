export const HISTORY_RETENTION_DAYS = 7;
export const HISTORY_RETENTION_MESSAGE = "实时明细数据仅保留7天，请到小时/日/月/年报表查询更早数据";

function pad(value) {
  return String(value).padStart(2, "0");
}

export function formatHistoryTime(value) {
  const date = value instanceof Date ? value : new Date(value);
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join("-") + " " + [
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds())
  ].join(":");
}

export function defaultHistoryRange() {
  const end = new Date();
  const start = new Date(end);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 0);
  return [formatHistoryTime(start), formatHistoryTime(end)];
}

export function normalizeHistoryRange(range) {
  if (!range || range.length !== 2) {
    return range;
  }
  const normalized = range.slice();
  const start = new Date(String(normalized[0]).replace(/-/g, "/"));
  const end = new Date(String(normalized[1]).replace(/-/g, "/"));
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
    return normalized;
  }
  const sameValue = start.getTime() === end.getTime();
  const isMidnight = end.getHours() === 0 && end.getMinutes() === 0 && end.getSeconds() === 0;
  if (sameValue || isMidnight) {
    end.setHours(23, 59, 59, 0);
  }
  const now = new Date();
  if (end.getTime() > now.getTime()) {
    end.setTime(now.getTime());
  }
  normalized[1] = formatHistoryTime(end);
  return normalized;
}

export function disabledHistoryDate(time) {
  const now = new Date();
  const earliest = new Date(now.getTime() - HISTORY_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  earliest.setHours(0, 0, 0, 0);
  const latest = new Date(now);
  latest.setHours(23, 59, 59, 999);
  return time.getTime() < earliest.getTime() || time.getTime() > latest.getTime();
}

export function validateHistoryRange(range) {
  if (!range || range.length !== 2) {
    return null;
  }
  const start = new Date(String(range[0]).replace(/-/g, "/")).getTime();
  const end = new Date(String(range[1]).replace(/-/g, "/")).getTime();
  const now = Date.now();
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end) {
    return "请选择正确的开始和结束时间";
  }
  if (end > now + 60 * 1000) {
    return "结束时间不能晚于当前时间";
  }
  const retention = HISTORY_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  if (start < now - retention || end - start > retention) {
    return HISTORY_RETENTION_MESSAGE;
  }
  return null;
}
