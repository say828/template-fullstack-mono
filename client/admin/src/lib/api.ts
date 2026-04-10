import type {
  AdminAccountCreatePayload,
  AdminAccountDetail,
  AdminAccountSummary,
  AdminAccountUpdatePayload,
  AdminAuditLogEntry,
  AdminBlacklistEntry,
  AdminPermissionGroup,
  AdminPermissionGroupDetail,
  AdminRuntimeVersion,
  AdminSettlementRecord,
  AdminSupportInquiry,
  AdminVehicleBidDetail,
  AdminDealerBidHistory,
  AdminDealerDetail,
  Bid,
  DealerBid,
  SettlementAccount,
  ListingSort,
  MarketListing,
  SellerSettlementRecord,
  SellerVehicleBid,
  SellerVehicleDetail,
  SupportFaq,
  SupportInquiry,
  SupportNotice,
  SupportNotification,
  TradeWorkflow,
  User,
  UserSettings,
  UserRole,
  Vehicle,
  WithdrawalRequest,
} from "./types";
import { resolveApiBaseUrl } from "../app/runtime";

const API_BASE = resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL);
const JSON_CONTENT_TYPE = /[/+]json\b/i;
const HTML_RESPONSE = /^\s*<!doctype html\b/i;
const EMPTY_RESPONSE_ERROR = "서버 응답이 비어 있습니다. 잠시 후 다시 시도해 주세요.";
const INVALID_JSON_ERROR = "서버 응답의 JSON 형식이 올바르지 않습니다.";
const HTML_RESPONSE_ERROR = "서버가 JSON 대신 HTML을 반환했습니다. 잠시 후 다시 시도해 주세요.";
const INVALID_RESPONSE_ERROR = "서버 응답 형식이 올바르지 않습니다.";

interface ApiErrorPayload {
  code?: string;
  message?: string;
  detail?: string;
}

async function readResponseBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;

  const contentType = res.headers.get("content-type") ?? "";
  if (JSON_CONTENT_TYPE.test(contentType)) {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      throw new Error(INVALID_JSON_ERROR);
    }
  }

  if (HTML_RESPONSE.test(text)) {
    throw new Error(HTML_RESPONSE_ERROR);
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(init.headers ?? {}),
    },
  });

  const body = await readResponseBody(res);

  if (!res.ok) {
    if (body && typeof body === "object" && !Array.isArray(body)) {
      const payload = body as ApiErrorPayload;
      throw new Error(payload.message ?? payload.detail ?? "요청 처리에 실패했습니다.");
    }
    if (typeof body === "string" && body.trim()) {
      throw new Error(body);
    }
    throw new Error("요청 처리에 실패했습니다.");
  }

  if (body === null) {
    throw new Error(EMPTY_RESPONSE_ERROR);
  }

  if (typeof body === "string") {
    throw new Error(INVALID_RESPONSE_ERROR);
  }

  return body as T;
}

export async function login(payload: { email: string; password: string; role: UserRole }) {
  return request<{ access_token: string; token_type: string; user: User }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function requestPasswordReset(payload: { email: string; role: UserRole }) {
  return request<{ message: string; debug_reset_token?: string }>("/auth/password-reset/request", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function confirmPasswordReset(payload: { token: string; new_password: string }) {
  return request<{ message: string }>("/auth/password-reset/confirm", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getMe(token: string) {
  return request<User>("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function registerSeller(payload: {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
  country?: string;
}) {
  return request<User>("/auth/register/seller", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function registerDealer(formData: FormData) {
  return request<User>("/dealers/register", {
    method: "POST",
    body: formData,
  });
}

export async function listPendingDealers(token: string) {
  return request<Array<User & { business_number?: string }>>("/admin/dealers/pending", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

/**
 * Admin pending dealers with pagination headers.
 * - Consumes `offset`/`limit` query parameters
 * - Reads `X-Total-Count` and `X-Next-Offset` from response headers
 * - Accepts optional filters: `q`, `created_from`, `created_to`
 */
export async function listPendingDealersPage(
  token: string,
  params?: { offset?: number; limit?: number; q?: string; created_from?: string; created_to?: string },
): Promise<{
  items: Array<User & { business_number?: string }>;
  totalCount: number | null;
  nextOffset: number | null;
  offset: number;
  limit: number;
}> {
  const qs = new URLSearchParams();
  const offset = params?.offset ?? 0;
  const limit = params?.limit ?? 20;
  if (offset !== undefined) qs.set("offset", String(offset));
  if (limit !== undefined) qs.set("limit", String(limit));
  if (params?.q) qs.set("q", params.q);
  if (params?.created_from) qs.set("created_from", params.created_from);
  if (params?.created_to) qs.set("created_to", params.created_to);
  const query = qs.size ? `?${qs.toString()}` : "";

  const res = await fetch(`${API_BASE}/admin/dealers/pending${query}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const body = await readResponseBody(res);

  if (!res.ok) {
    if (body && typeof body === "object" && !Array.isArray(body)) {
      const payload = body as ApiErrorPayload;
      throw new Error(payload.message ?? payload.detail ?? "요청 처리에 실패했습니다.");
    }
    if (typeof body === "string" && body.trim()) {
      throw new Error(body);
    }
    throw new Error("요청 처리에 실패했습니다.");
  }

  if (!Array.isArray(body)) {
    throw new Error(INVALID_RESPONSE_ERROR);
  }

  const totalStr = res.headers.get("X-Total-Count");
  const nextStr = res.headers.get("X-Next-Offset");
  const totalCount = totalStr != null ? Number(totalStr) : null;
  const nextOffset = nextStr != null && nextStr !== "" ? Number(nextStr) : null;

  return {
    items: body as Array<User & { business_number?: string }>,
    totalCount: Number.isFinite(totalCount) ? (totalCount as number) : null,
    nextOffset: Number.isFinite(nextOffset as number) ? (nextOffset as number) : null,
    offset,
    limit,
  };
}

/**
 * Helper: returns 0 when filters changed, otherwise keeps the current offset.
 */
export function computeOffsetOnFilterChange(
  prev: { q?: string; created_from?: string; created_to?: string },
  next: { q?: string; created_from?: string; created_to?: string },
  currentOffset: number,
): number {
  const norm = (v?: string) => (v ?? "").trim();
  const changed =
    norm(prev.q) !== norm(next.q) ||
    (prev.created_from ?? "") !== (next.created_from ?? "") ||
    (prev.created_to ?? "") !== (next.created_to ?? "");
  return changed ? 0 : currentOffset;
}
export async function getAdminDealerDetail(token: string, dealerId: string) {
  return request<AdminDealerDetail>(`/admin/dealers/${dealerId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminDealerBids(token: string, dealerId: string) {
  return request<AdminDealerBidHistory[]>(`/admin/dealers/${dealerId}/bids`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminVehicleBids(token: string, vehicleId: string) {
  return request<AdminVehicleBidDetail>(`/admin/vehicles/${vehicleId}/bids`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function approveDealer(token: string, dealerId: string) {
  return request<User>(`/admin/dealers/${dealerId}/approve`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function rejectDealer(token: string, dealerId: string, reason: string) {
  return request<User>(`/admin/dealers/${dealerId}/reject`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ reason }),
  });
}

export async function createVehicle(
  token: string,
  payload: {
    title: string;
    make: string;
    model: string;
    year: number;
    mileage_km: number;
    license_plate?: string;
    fuel_type: "GASOLINE" | "DIESEL" | "HYBRID" | "EV";
    transaction_type: "DOMESTIC" | "EXPORT";
    reserve_price: number;
    min_bid_increment: number;
    bidding_hours: number;
    bidding_start_at?: string;
    bidding_end_at?: string;
    currency: string;
  },
) {
  return request<Vehicle>("/vehicles", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function listMyVehicles(token: string) {
  return request<Vehicle[]>("/vehicles/my", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getSellerVehicleDetail(token: string, vehicleId: string) {
  return request<SellerVehicleDetail>(`/seller/vehicles/${vehicleId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function listSellerVehicleBids(token: string, vehicleId: string) {
  return request<SellerVehicleBid[]>(`/seller/vehicles/${vehicleId}/bids`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function listMarketVehicles(
  token: string,
  params?: {
    transaction_type?: "DOMESTIC" | "EXPORT";
    keyword?: string;
    sort?: ListingSort;
    offset?: number;
    limit?: number;
  },
) {
  const qs = new URLSearchParams();
  if (params?.transaction_type) qs.set("transaction_type", params.transaction_type);
  if (params?.keyword) qs.set("keyword", params.keyword);
  if (params?.sort) qs.set("sort", params.sort);
  if (params?.offset !== undefined) qs.set("offset", String(params.offset));
  if (params?.limit !== undefined) qs.set("limit", String(params.limit));
  const query = qs.size ? `?${qs.toString()}` : "";

  return request<MarketListing[]>(`/market/listings${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function placeBid(token: string, vehicleId: string, amount: number) {
  return request<Bid>(`/market/listings/${vehicleId}/bids`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ amount }),
  });
}

export async function updateMyBid(token: string, vehicleId: string, amount: number) {
  return request<Bid>(`/market/listings/${vehicleId}/bids/me`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ amount }),
  });
}

export async function cancelMyBid(token: string, vehicleId: string) {
  return request<Bid>(`/market/listings/${vehicleId}/bids/me`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function listMyDealerBids(token: string) {
  return request<DealerBid[]>("/dealer/bids/my", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function closeSellerBidding(token: string, vehicleId: string, forceClose = false) {
  return request<{
    vehicle_id: string;
    status: "ACTIVE" | "SOLD" | "CANCELLED";
    message: string;
    winning_bid_id?: string | null;
    winning_dealer_id?: string | null;
    winning_price?: number | null;
    sold_at?: string | null;
  }>(`/seller/vehicles/${vehicleId}/bidding/close`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ force_close: forceClose }),
  });
}

export async function getSellerTradeWorkflow(token: string, vehicleId: string) {
  return request<TradeWorkflow>(`/seller/vehicles/${vehicleId}/trade-workflow`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getDealerTradeWorkflow(token: string, vehicleId: string) {
  return request<TradeWorkflow>(`/dealer/vehicles/${vehicleId}/trade-workflow`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminTradeWorkflow(token: string, vehicleId: string) {
  return request<TradeWorkflow>(`/admin/vehicles/${vehicleId}/trade-workflow`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function listSellerTradeWorkflows(token: string, params?: { offset?: number; limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.offset !== undefined) qs.set("offset", String(params.offset));
  if (params?.limit !== undefined) qs.set("limit", String(params.limit));
  const query = qs.size ? `?${qs.toString()}` : "";
  return request<TradeWorkflow[]>(`/seller/trade-workflows${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function listDealerTradeWorkflows(token: string, params?: { offset?: number; limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.offset !== undefined) qs.set("offset", String(params.offset));
  if (params?.limit !== undefined) qs.set("limit", String(params.limit));
  const query = qs.size ? `?${qs.toString()}` : "";
  return request<TradeWorkflow[]>(`/dealer/trade-workflows${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function listAdminTradeWorkflows(
  token: string,
  params?: {
    stage?: "INSPECTION" | "DEPRECIATION" | "DELIVERY" | "REMITTANCE" | "SETTLEMENT" | "COMPLETED" | "CANCELLED";
    offset?: number;
    limit?: number;
  },
) {
  const qs = new URLSearchParams();
  if (params?.stage) qs.set("stage", params.stage);
  if (params?.offset !== undefined) qs.set("offset", String(params.offset));
  if (params?.limit !== undefined) qs.set("limit", String(params.limit));
  const query = qs.size ? `?${qs.toString()}` : "";
  return request<TradeWorkflow[]>(`/admin/trade-workflows${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function adminProposeInspection(
  token: string,
  vehicleId: string,
  payload: { scheduled_at: string; location: string; assignee: string; contact: string },
) {
  return request<TradeWorkflow>(`/admin/vehicles/${vehicleId}/inspection/propose`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function sellerApproveInspection(token: string, vehicleId: string) {
  return request<TradeWorkflow>(`/seller/vehicles/${vehicleId}/inspection/approve`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function sellerRequestInspectionReschedule(
  token: string,
  vehicleId: string,
  payload: { preferred_at: string; reason: string },
) {
  return request<TradeWorkflow>(`/seller/vehicles/${vehicleId}/inspection/reschedule`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function adminCompleteInspection(
  token: string,
  vehicleId: string,
  payload: { report_url: string; summary?: string },
) {
  return request<TradeWorkflow>(`/admin/vehicles/${vehicleId}/inspection/complete`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function dealerSubmitDepreciation(
  token: string,
  vehicleId: string,
  payload: { items: Array<{ code: string; label: string; amount: number; note?: string }>; comment?: string },
) {
  return request<TradeWorkflow>(`/dealer/vehicles/${vehicleId}/depreciation/propose`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function sellerRequestRenegotiation(
  token: string,
  vehicleId: string,
  payload: { reason: string; target_price: number },
) {
  return request<TradeWorkflow>(`/seller/vehicles/${vehicleId}/depreciation/renegotiate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function sellerApproveDepreciation(token: string, vehicleId: string) {
  return request<TradeWorkflow>(`/seller/vehicles/${vehicleId}/depreciation/approve`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function dealerScheduleDelivery(
  token: string,
  vehicleId: string,
  payload: { scheduled_at: string; method: string; location: string },
) {
  return request<TradeWorkflow>(`/dealer/vehicles/${vehicleId}/delivery/schedule`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function sellerConfirmDelivery(token: string, vehicleId: string) {
  return request<TradeWorkflow>(`/seller/vehicles/${vehicleId}/delivery/confirm`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function dealerConfirmDelivery(
  token: string,
  vehicleId: string,
  payload?: {
    checklist_items?: string[];
    vehicle_evidence_files?: Array<{ name: string; size_bytes: number; content_type?: string | null }>;
    document_evidence_files?: Array<{ name: string; size_bytes: number; content_type?: string | null }>;
  },
) {
  return request<TradeWorkflow>(`/dealer/vehicles/${vehicleId}/delivery/confirm`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload ?? {}),
  });
}

export async function dealerSubmitRemittance(
  token: string,
  vehicleId: string,
  payload: {
    amount: number;
    bank_account: string;
    reference: string;
    remitted_at?: string;
    method?: string;
    note?: string;
    evidence_files?: Array<{ name: string; size_bytes: number; content_type?: string | null }>;
  },
) {
  return request<TradeWorkflow>(`/dealer/vehicles/${vehicleId}/remittance/submit`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function adminConfirmRemittance(token: string, vehicleId: string) {
  return request<TradeWorkflow>(`/admin/vehicles/${vehicleId}/remittance/confirm`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function adminCompleteSettlement(
  token: string,
  vehicleId: string,
  payload?: { settlement_amount?: number },
) {
  return request<TradeWorkflow>(`/admin/vehicles/${vehicleId}/settlement/complete`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload ?? {}),
  });
}

export async function adminForceCancelTrade(token: string, vehicleId: string, payload: { reason: string }) {
  return request<TradeWorkflow>(`/admin/vehicles/${vehicleId}/force-cancel`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function listSupportNotices(
  params?: { keyword?: string; category?: "GENERAL" | "SERVICE" | "POLICY" | "EVENT"; offset?: number; limit?: number },
) {
  const qs = new URLSearchParams();
  if (params?.keyword) qs.set("keyword", params.keyword);
  if (params?.category) qs.set("category", params.category);
  if (params?.offset !== undefined) qs.set("offset", String(params.offset));
  if (params?.limit !== undefined) qs.set("limit", String(params.limit));
  const query = qs.size ? `?${qs.toString()}` : "";
  return request<SupportNotice[]>(`/support/notices${query}`);
}

export async function getSupportNotice(noticeId: string) {
  return request<SupportNotice>(`/support/notices/${noticeId}`);
}

export async function listSupportFaqs(
  params?: {
    keyword?: string;
    category?: "GENERAL" | "ACCOUNT" | "BIDDING" | "SETTLEMENT" | "DEALER";
    offset?: number;
    limit?: number;
  },
) {
  const qs = new URLSearchParams();
  if (params?.keyword) qs.set("keyword", params.keyword);
  if (params?.category) qs.set("category", params.category);
  if (params?.offset !== undefined) qs.set("offset", String(params.offset));
  if (params?.limit !== undefined) qs.set("limit", String(params.limit));
  const query = qs.size ? `?${qs.toString()}` : "";
  return request<SupportFaq[]>(`/support/faqs${query}`);
}

export async function listAdminSupportFaqs(
  token: string,
  params?: {
    keyword?: string;
    category?: "GENERAL" | "ACCOUNT" | "BIDDING" | "SETTLEMENT" | "DEALER";
    offset?: number;
    limit?: number;
  },
) {
  const qs = new URLSearchParams();
  if (params?.keyword) qs.set("keyword", params.keyword);
  if (params?.category) qs.set("category", params.category);
  if (params?.offset !== undefined) qs.set("offset", String(params.offset));
  if (params?.limit !== undefined) qs.set("limit", String(params.limit));
  const query = qs.size ? `?${qs.toString()}` : "";
  return request<SupportFaq[]>(`/admin/support/faqs${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createSupportInquiry(token: string, formData: FormData) {
  return request<SupportInquiry>("/support/inquiries", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
}

export async function listMySupportInquiries(token: string, params?: { offset?: number; limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.offset !== undefined) qs.set("offset", String(params.offset));
  if (params?.limit !== undefined) qs.set("limit", String(params.limit));
  const query = qs.size ? `?${qs.toString()}` : "";
  return request<SupportInquiry[]>(`/support/inquiries/me${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function listMySupportNotifications(
  token: string,
  params?: { unread_only?: boolean; offset?: number; limit?: number },
) {
  const qs = new URLSearchParams();
  if (params?.unread_only !== undefined) qs.set("unread_only", String(params.unread_only));
  if (params?.offset !== undefined) qs.set("offset", String(params.offset));
  if (params?.limit !== undefined) qs.set("limit", String(params.limit));
  const query = qs.size ? `?${qs.toString()}` : "";
  return request<SupportNotification[]>(`/support/notifications/me${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function markSupportNotificationRead(token: string, notificationId: string) {
  return request<SupportNotification>(`/support/notifications/${notificationId}/read`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function markAllSupportNotificationsRead(token: string) {
  return request<{ updated_count: number }>("/support/notifications/read-all", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function listAdminSupportInquiries(token: string, params?: { offset?: number; limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.offset !== undefined) qs.set("offset", String(params.offset));
  if (params?.limit !== undefined) qs.set("limit", String(params.limit));
  const query = qs.size ? `?${qs.toString()}` : "";
  return request<AdminSupportInquiry[]>(`/admin/support/inquiries${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminSupportInquiry(token: string, inquiryId: string) {
  return request<AdminSupportInquiry>(`/admin/support/inquiries/${inquiryId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function replyAdminSupportInquiry(token: string, inquiryId: string, adminReply: string) {
  return request<AdminSupportInquiry>(`/admin/support/inquiries/${inquiryId}/reply`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ admin_reply: adminReply }),
  });
}

export async function downloadAdminSupportInquiryAttachment(
  token: string,
  inquiryId: string,
  attachmentId: string,
  filename: string,
) {
  const res = await fetch(`${API_BASE}/admin/support/inquiries/${inquiryId}/attachments/${attachmentId}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const body = await readResponseBody(res);
    if (body && typeof body === "object" && !Array.isArray(body)) {
      const payload = body as ApiErrorPayload;
      throw new Error(payload.message ?? payload.detail ?? "첨부 파일 다운로드에 실패했습니다.");
    }
    throw new Error("첨부 파일 다운로드에 실패했습니다.");
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function createAdminSupportNotice(
  token: string,
  payload: { category: "GENERAL" | "SERVICE" | "POLICY" | "EVENT"; title: string; content: string; is_pinned: boolean },
) {
  return request<SupportNotice>("/admin/support/notices", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function updateAdminSupportNotice(
  token: string,
  noticeId: string,
  payload: { category: "GENERAL" | "SERVICE" | "POLICY" | "EVENT"; title: string; content: string; is_pinned: boolean },
) {
  return request<SupportNotice>(`/admin/support/notices/${noticeId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminSupportNotice(token: string, noticeId: string) {
  return request<{ deleted_id: string }>(`/admin/support/notices/${noticeId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createAdminSupportFaq(
  token: string,
  payload: {
    category: "GENERAL" | "ACCOUNT" | "BIDDING" | "SETTLEMENT" | "DEALER";
    question: string;
    answer: string;
    sort_order: number;
    is_active: boolean;
  },
) {
  return request<SupportFaq>("/admin/support/faqs", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function updateAdminSupportFaq(
  token: string,
  faqId: string,
  payload: {
    category: "GENERAL" | "ACCOUNT" | "BIDDING" | "SETTLEMENT" | "DEALER";
    question: string;
    answer: string;
    sort_order: number;
    is_active: boolean;
  },
) {
  return request<SupportFaq>(`/admin/support/faqs/${faqId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminSupportFaq(token: string, faqId: string) {
  return request<{ deleted_id: string }>(`/admin/support/faqs/${faqId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function listAdminAccounts(token: string) {
  return request<AdminAccountSummary[]>("/admin/accounts", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminAccount(token: string, accountId: string) {
  return request<AdminAccountDetail>(`/admin/accounts/${accountId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createAdminAccount(token: string, payload: AdminAccountCreatePayload) {
  return request<AdminAccountDetail>("/admin/accounts", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function updateAdminAccount(token: string, accountId: string, payload: AdminAccountUpdatePayload) {
  return request<AdminAccountDetail>(`/admin/accounts/${accountId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function listAdminPermissionGroups(token: string) {
  return request<AdminPermissionGroup[]>("/admin/accounts/permission-groups", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminPermissionGroup(token: string, groupCode: string) {
  return request<AdminPermissionGroupDetail>(`/admin/accounts/permission-groups/${groupCode}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function listAdminAuditLogs(token: string, params?: { offset?: number; limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.offset !== undefined) qs.set("offset", String(params.offset));
  if (params?.limit !== undefined) qs.set("limit", String(params.limit));
  const query = qs.size ? `?${qs.toString()}` : "";
  return request<AdminAuditLogEntry[]>(`/admin/audit/logs${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getAdminRuntimeVersion(token: string) {
  return request<AdminRuntimeVersion>("/admin/version", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function listAdminBlacklistEntries(
  token: string,
  params?: { active_only?: boolean; keyword?: string; offset?: number; limit?: number },
) {
  const qs = new URLSearchParams();
  if (params?.active_only !== undefined) qs.set("active_only", String(params.active_only));
  if (params?.keyword) qs.set("keyword", params.keyword);
  if (params?.offset !== undefined) qs.set("offset", String(params.offset));
  if (params?.limit !== undefined) qs.set("limit", String(params.limit));
  const query = qs.size ? `?${qs.toString()}` : "";
  return request<AdminBlacklistEntry[]>(`/admin/blacklist/users${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createAdminBlacklistEntry(token: string, payload: { user_id: string; reason: string }) {
  return request<AdminBlacklistEntry>("/admin/blacklist/users", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function releaseAdminBlacklistEntry(token: string, userId: string) {
  return request<AdminBlacklistEntry>(`/admin/blacklist/users/${userId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getMySettings(token: string) {
  return request<UserSettings>("/settings/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function updateMyProfile(
  token: string,
  payload: {
    full_name: string;
    phone?: string | null;
    country?: string | null;
  },
) {
  return request<UserSettings>("/settings/me/profile", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function changeMyPassword(token: string, payload: { current_password: string; new_password: string }) {
  return request<{ message: string }>("/settings/me/password", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function updateMyPreferences(
  token: string,
  payload: {
    language: string;
    region: string;
    notify_bidding: boolean;
    notify_settlement: boolean;
    notify_marketing: boolean;
    notify_support: boolean;
  },
) {
  return request<UserSettings>("/settings/me/preferences", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function requestWithdrawal(token: string, payload: { reason: string }) {
  return request<WithdrawalRequest>("/settings/me/withdrawal", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function listSettlementAccounts(token: string) {
  return request<SettlementAccount[]>("/seller/settlement/accounts", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createSettlementAccount(
  token: string,
  payload: { bank_name: string; account_number: string; account_holder: string; is_primary: boolean },
) {
  return request<SettlementAccount>("/seller/settlement/accounts", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function updateSettlementAccount(
  token: string,
  accountId: string,
  payload: { bank_name: string; account_number: string; account_holder: string; is_primary: boolean },
) {
  return request<SettlementAccount>(`/seller/settlement/accounts/${accountId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function listSellerSettlementRecords(token: string) {
  return request<SellerSettlementRecord[]>("/seller/settlement/records", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function listAdminSettlementRecords(token: string) {
  return request<AdminSettlementRecord[]>("/admin/settlement/records", {
    headers: { Authorization: `Bearer ${token}` },
  });
}
