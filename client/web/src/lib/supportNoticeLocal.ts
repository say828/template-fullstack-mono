const NOTICE_VIEW_COUNT_KEY = "template_notice_view_count_v1";
const NOTICE_VIEWED_KEY_PREFIX = "template_notice_viewed_v1";

function loadCountMap(): Record<string, number> {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(NOTICE_VIEW_COUNT_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, number>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveCountMap(map: Record<string, number>): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(NOTICE_VIEW_COUNT_KEY, JSON.stringify(map));
}

function loadViewedSet(userKey: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  const raw = window.localStorage.getItem(`${NOTICE_VIEWED_KEY_PREFIX}:${userKey}`);
  if (!raw) return new Set();
  try {
    const parsed = JSON.parse(raw) as string[];
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed);
  } catch {
    return new Set();
  }
}

function saveViewedSet(userKey: string, ids: Set<string>): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`${NOTICE_VIEWED_KEY_PREFIX}:${userKey}`, JSON.stringify(Array.from(ids)));
}

export function getNoticeViewCount(noticeId: string): number {
  const map = loadCountMap();
  return map[noticeId] ?? 0;
}

export function incrementNoticeView(noticeId: string): number {
  const map = loadCountMap();
  const next = (map[noticeId] ?? 0) + 1;
  map[noticeId] = next;
  saveCountMap(map);
  return next;
}

export function markNoticeViewed(noticeId: string, userKey: string): void {
  const set = loadViewedSet(userKey);
  set.add(noticeId);
  saveViewedSet(userKey, set);
}

export function hasViewedNotice(noticeId: string, userKey: string): boolean {
  const set = loadViewedSet(userKey);
  return set.has(noticeId);
}
