import type { FaqCategory, NoticeCategory, SupportFaq, SupportNotice } from "../lib/types";
import { resolveApiBaseUrl } from "../app/runtime";

const API_BASE = resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL);
const JSON_CONTENT_TYPE = /[/+]json\b/i;

export const noticeCategoryLabels: Record<NoticeCategory, string> = {
  GENERAL: "일반 공지",
  SERVICE: "서비스 업데이트",
  POLICY: "정책/약관",
  EVENT: "이벤트",
};

export const faqCategoryLabels: Record<FaqCategory, string> = {
  GENERAL: "일반",
  ACCOUNT: "계정/인증",
  BIDDING: "입찰/낙찰",
  SETTLEMENT: "정산",
  DEALER: "딜러",
};

export const noticeCategoryOptions: Array<{ value: NoticeCategory; label: string }> = [
  { value: "GENERAL", label: noticeCategoryLabels.GENERAL },
  { value: "SERVICE", label: noticeCategoryLabels.SERVICE },
  { value: "POLICY", label: noticeCategoryLabels.POLICY },
  { value: "EVENT", label: noticeCategoryLabels.EVENT },
];

export const faqCategoryOptions: Array<{ value: FaqCategory; label: string }> = [
  { value: "GENERAL", label: faqCategoryLabels.GENERAL },
  { value: "ACCOUNT", label: faqCategoryLabels.ACCOUNT },
  { value: "BIDDING", label: faqCategoryLabels.BIDDING },
  { value: "SETTLEMENT", label: faqCategoryLabels.SETTLEMENT },
  { value: "DEALER", label: faqCategoryLabels.DEALER },
];

export function formatSupportDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}.${month}.${day} ${hours}:${minutes}`;
}

async function readBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  const contentType = res.headers.get("content-type") ?? "";
  if (JSON_CONTENT_TYPE.test(contentType)) {
    return JSON.parse(text) as unknown;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function adminRequest<T>(path: string, token: string, payload?: object, method = "POST"): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });

  const body = await readBody(res);
  if (!res.ok) {
    if (body && typeof body === "object" && !Array.isArray(body)) {
      const detail = String(
        (body as { message?: string; detail?: string }).message
          ?? (body as { message?: string; detail?: string }).detail
          ?? "",
      ).trim();
      throw new Error(detail || "운영 요청 처리에 실패했습니다.");
    }
    if (typeof body === "string" && body.trim()) {
      throw new Error(body);
    }
    throw new Error("운영 요청 처리에 실패했습니다.");
  }

  return body as T;
}

export async function createAdminSupportNotice(
  token: string,
  payload: {
    category: NoticeCategory;
    title: string;
    content: string;
    is_pinned: boolean;
  },
) {
  return adminRequest<SupportNotice>("/admin/support/notices", token, payload);
}

export async function updateAdminSupportNotice(
  token: string,
  noticeId: string,
  payload: {
    category: NoticeCategory;
    title: string;
    content: string;
    is_pinned: boolean;
  },
) {
  return adminRequest<SupportNotice>(`/admin/support/notices/${noticeId}`, token, payload, "PATCH");
}

export async function deleteAdminSupportNotice(token: string, noticeId: string) {
  return adminRequest<{ deleted_id: string }>(`/admin/support/notices/${noticeId}`, token, undefined, "DELETE");
}

export async function createAdminSupportFaq(
  token: string,
  payload: {
    category: FaqCategory;
    question: string;
    answer: string;
    sort_order: number;
    is_active: boolean;
  },
) {
  return adminRequest<SupportFaq>("/admin/support/faqs", token, payload);
}

export async function updateAdminSupportFaq(
  token: string,
  faqId: string,
  payload: {
    category: FaqCategory;
    question: string;
    answer: string;
    sort_order: number;
    is_active: boolean;
  },
) {
  return adminRequest<SupportFaq>(`/admin/support/faqs/${faqId}`, token, payload, "PATCH");
}

export async function deleteAdminSupportFaq(token: string, faqId: string) {
  return adminRequest<{ deleted_id: string }>(`/admin/support/faqs/${faqId}`, token, undefined, "DELETE");
}
