export type UserRole = "SELLER" | "DEALER" | "ADMIN";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  dealer_status?: "PENDING" | "APPROVED" | "REJECTED" | null;
}

export interface Vehicle {
  id: string;
  seller_id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  mileage_km: number;
  license_plate?: string | null;
  fuel_type: "GASOLINE" | "DIESEL" | "HYBRID" | "EV";
  transmission?: "AUTO" | "MANUAL" | "DCT" | null;
  transaction_type: "DOMESTIC" | "EXPORT";
  reserve_price: number;
  min_bid_increment: number;
  options?: string[];
  photo_names?: string[];
  photo_urls?: string[];
  currency: string;
  status: "ACTIVE" | "SOLD" | "CANCELLED";
  lifecycle_state?: "BIDDING" | "BIDDING_CLOSED" | "FAILED" | "INSPECTION" | "DEPRECIATION" | "DELIVERY_SETTLEMENT" | "COMPLETED" | "TRADE_CANCELLED" | "STATUS_UNSET";
  bidding_ends_at: string;
  winning_dealer_id?: string | null;
  winning_price?: number | null;
  created_at: string;
}

export type BiddingState = "OPEN" | "CLOSING_SOON" | "CLOSED";
export type ListingSort = "NEWEST" | "HIGHEST_BID" | "LOWEST_BID" | "MOST_BIDS";

export interface MarketListing extends Vehicle {
  bidding_state: BiddingState;
  time_left_seconds: number;
  highest_bid?: number | null;
  bid_count: number;
  my_bid?: number | null;
}

export interface Bid {
  id: string;
  vehicle_id: string;
  dealer_id: string;
  amount: number;
  status: "ACTIVE" | "CANCELLED" | "WON" | "LOST";
  created_at: string;
  updated_at: string;
}

export interface DealerBid {
  bid_id: string;
  vehicle_id: string;
  title: string;
  make: string;
  model: string;
  amount: number;
  status: "ACTIVE" | "CANCELLED" | "WON" | "LOST";
  reserve_price: number;
  min_bid_increment: number;
  currency: string;
  photo_urls?: string[];
  highest_bid?: number | null;
  bidding_ends_at: string;
  bidding_state: BiddingState;
  time_left_seconds: number;
  is_winning: boolean;
  created_at: string;
  updated_at: string;
}

export interface SellerVehicleDetail extends Vehicle {
  lifecycle_state?: "BIDDING" | "BIDDING_CLOSED" | "FAILED" | "INSPECTION" | "DEPRECIATION" | "DELIVERY_SETTLEMENT" | "COMPLETED" | "TRADE_CANCELLED" | "STATUS_UNSET";
  bidding_state: BiddingState;
  bidding_started_at: string;
  time_left_seconds: number;
  highest_bid?: number | null;
  bid_count: number;
  winning_dealer_id?: string | null;
  winning_price?: number | null;
  photo_urls?: string[];
}

export type TradeStage = "INSPECTION" | "DEPRECIATION" | "DELIVERY" | "REMITTANCE" | "SETTLEMENT" | "COMPLETED" | "CANCELLED";
export type InspectionStatus = "PROPOSED" | "RESCHEDULE_REQUESTED" | "CONFIRMED" | "COMPLETED";
export type DepreciationStatus = "PROPOSAL_REQUIRED" | "SELLER_REVIEW" | "RENEGOTIATION_REQUESTED" | "AGREED";
export type DeliveryStatus = "WAITING_SCHEDULE" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED";
export type RemittanceStatus = "WAITING" | "SUBMITTED" | "CONFIRMED";
export type SettlementStatus = "WAITING" | "COMPLETED";

export interface TradeDepreciationItem {
  id: string;
  code: string;
  label: string;
  amount: number;
  note?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TradeEvent {
  id: string;
  actor_id?: string | null;
  actor_role?: UserRole | null;
  event_type: string;
  message: string;
  payload_json?: Record<string, unknown> | null;
  created_at: string;
}

export interface TradeWorkflow {
  id: string;
  vehicle_id: string;
  vehicle_title: string;
  currency: string;
  seller_id: string;
  seller_name?: string | null;
  seller_email?: string | null;
  seller_phone?: string | null;
  dealer_id: string;
  dealer_name?: string | null;
  dealer_email?: string | null;
  dealer_phone?: string | null;
  current_stage: TradeStage;
  lifecycle_state?: "BIDDING" | "BIDDING_CLOSED" | "FAILED" | "INSPECTION" | "DEPRECIATION" | "DELIVERY_SETTLEMENT" | "COMPLETED" | "TRADE_CANCELLED" | "STATUS_UNSET";
  inspection_status: InspectionStatus;
  depreciation_status: DepreciationStatus;
  delivery_status: DeliveryStatus;
  remittance_status: RemittanceStatus;
  settlement_status: SettlementStatus;
  base_price: number;
  agreed_price?: number | null;
  depreciation_total?: number | null;
  inspection_scheduled_at?: string | null;
  inspection_location?: string | null;
  inspection_assignee?: string | null;
  inspection_contact?: string | null;
  inspection_confirmed_at?: string | null;
  inspection_completed_at?: string | null;
  inspection_report_url?: string | null;
  inspection_summary?: string | null;
  depreciation_submitted_at?: string | null;
  depreciation_comment?: string | null;
  renegotiation_requested_at?: string | null;
  renegotiation_reason?: string | null;
  renegotiation_target_price?: number | null;
  depreciation_agreed_at?: string | null;
  delivery_scheduled_at?: string | null;
  delivery_method?: string | null;
  delivery_location?: string | null;
  delivery_confirmed_by_seller_at?: string | null;
  delivery_confirmed_by_dealer_at?: string | null;
  delivery_completed_at?: string | null;
  remittance_amount?: number | null;
  remittance_bank_account?: string | null;
  remittance_reference?: string | null;
  remittance_submitted_at?: string | null;
  remittance_confirmed_at?: string | null;
  settlement_amount?: number | null;
  settlement_completed_at?: string | null;
  forced_cancel_reason?: string | null;
  forced_cancelled_at?: string | null;
  created_at: string;
  updated_at: string;
  depreciation_items: TradeDepreciationItem[];
  events: TradeEvent[];
}

export interface SellerVehicleBid {
  id: string;
  vehicle_id: string;
  dealer_id: string;
  dealer_name: string;
  dealer_email: string;
  dealer_country?: string | null;
  dealer_business_number?: string | null;
  dealer_status?: string | null;
  dealer_completed_trade_count?: number;
  amount: number;
  status: "ACTIVE" | "CANCELLED" | "WON" | "LOST";
  created_at: string;
  updated_at: string;
}

export interface DealerDocumentMeta {
  id: string;
  doc_type: "BUSINESS_LICENSE" | "DEALER_LICENSE" | "ID_CARD";
  original_name: string;
  content_type?: string | null;
  size_bytes: number;
  created_at: string;
}

export interface AdminDealerDetail extends User {
  phone?: string | null;
  country?: string | null;
  business_number?: string | null;
  account_status: "ACTIVE" | "PENDING_APPROVAL" | "REJECTED";
  dealer_rejection_reason?: string | null;
  created_at: string;
  documents: DealerDocumentMeta[];
}

export interface AdminDealerBidHistory {
  bid_id: string;
  vehicle_id: string;
  vehicle_title: string;
  amount: number;
  status: "ACTIVE" | "CANCELLED" | "WON" | "LOST";
  highest_bid?: number | null;
  bidding_ends_at: string;
  bidding_state: BiddingState;
  time_left_seconds: number;
  updated_at: string;
}

export interface AdminVehicleBidEntry {
  bid_id: string;
  dealer_id: string;
  dealer_name: string;
  dealer_email: string;
  dealer_phone?: string | null;
  dealer_status?: string | null;
  amount: number;
  status: "ACTIVE" | "CANCELLED" | "WON" | "LOST";
  is_highest_active: boolean;
  is_winning_bid: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminVehicleBidDetail {
  vehicle_id: string;
  vehicle_title: string;
  seller_id: string;
  seller_name?: string | null;
  seller_email?: string | null;
  status: "ACTIVE" | "SOLD" | "CANCELLED";
  transaction_type: "DOMESTIC" | "EXPORT";
  reserve_price: number;
  min_bid_increment: number;
  currency: string;
  bidding_ends_at: string;
  sold_at?: string | null;
  winning_dealer_id?: string | null;
  winning_price?: number | null;
  highest_bid?: number | null;
  bid_count: number;
  bids: AdminVehicleBidEntry[];
}

export type NoticeCategory = "GENERAL" | "SERVICE" | "POLICY" | "EVENT";
export type FaqCategory = "GENERAL" | "ACCOUNT" | "BIDDING" | "SETTLEMENT" | "DEALER";
export type InquiryCategory = "GENERAL" | "ACCOUNT" | "BIDDING" | "SETTLEMENT" | "INSPECTION" | "DELIVER";
export type InquiryStatus = "OPEN" | "ANSWERED" | "CLOSED";
export type NotificationType = "SYSTEM" | "BID" | "SETTLEMENT" | "INSPECTION" | "SUPPORT";

export interface SupportNotice {
  id: string;
  category: NoticeCategory;
  title: string;
  content: string;
  is_pinned: boolean;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export interface SupportFaq {
  id: string;
  category: FaqCategory;
  question: string;
  answer: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SupportInquiryAttachment {
  id: string;
  original_name: string;
  content_type?: string | null;
  size_bytes: number;
  created_at: string;
}

export interface SupportInquiry {
  id: string;
  category: InquiryCategory;
  status: InquiryStatus;
  title: string;
  content: string;
  admin_reply?: string | null;
  agreed_to_policy: boolean;
  created_at: string;
  updated_at: string;
  attachments: SupportInquiryAttachment[];
}

export interface AdminSupportInquiry extends SupportInquiry {
  user_id: string;
  user_email?: string | null;
  user_full_name?: string | null;
  user_role?: string | null;
}

export interface SupportNotification {
  id: string;
  notification_type: NotificationType;
  title: string;
  message: string;
  meta_json?: Record<string, unknown> | null;
  read_at?: string | null;
  created_at: string;
}

export interface UserSettings {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  account_status: "ACTIVE" | "PENDING_APPROVAL" | "REJECTED" | "SUSPENDED";
  phone?: string | null;
  country?: string | null;
  language: string;
  region: string;
  notify_bidding: boolean;
  notify_settlement: boolean;
  notify_marketing: boolean;
  notify_support: boolean;
  created_at: string;
  updated_at: string;
}

export interface WithdrawalRequest {
  id: string;
  status: "REQUESTED" | "APPROVED" | "REJECTED";
  reason: string;
  created_at: string;
  updated_at: string;
}

export interface SettlementAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface SellerSettlementRecord {
  vehicle_id: string;
  vehicle_title: string;
  winning_price: number;
  currency: string;
  sold_at?: string | null;
  status: "PENDING" | "COMPLETED";
  settlement_due_at: string;
}

export interface AdminSettlementRecord {
  vehicle_id: string;
  vehicle_title: string;
  seller_id?: string | null;
  seller_name?: string | null;
  seller_email?: string | null;
  winning_price: number;
  currency: string;
  sold_at?: string | null;
  status: "PENDING" | "COMPLETED";
  settlement_due_at: string;
}

export interface AdminAccountSummary {
  id: string;
  email: string;
  full_name: string;
  role: string;
  account_status: string;
  dealer_status?: string | null;
  permission_group_code: string;
  permission_group_name: string;
  created_at: string;
  updated_at: string;
}

export interface AdminAccountDetail extends AdminAccountSummary {
  phone?: string | null;
  country?: string | null;
  business_number?: string | null;
  permission_group_description: string;
  permission_codes: string[];
  screen_codes: string[];
}

export interface AdminPermissionGroup {
  code: string;
  name: string;
  description: string;
  is_system: boolean;
  permission_codes: string[];
  screen_codes: string[];
  member_count: number;
}

export interface AdminPermissionGroupDetail extends AdminPermissionGroup {
  members: AdminAccountSummary[];
}

export interface AdminAuditLogEntry {
  id: string;
  source: string;
  event_type: string;
  occurred_at: string;
  title: string;
  message: string;
  actor_user_id?: string | null;
  actor_name?: string | null;
  actor_role?: string | null;
  target_user_id?: string | null;
  target_name?: string | null;
  target_role?: string | null;
  workflow_id?: string | null;
  vehicle_id?: string | null;
  payload_json?: Record<string, unknown> | null;
}

export interface AdminRuntimeVersion {
  app_name: string;
  environment: string;
  api_version: string;
  git_commit?: string | null;
  git_branch?: string | null;
  release_notes: string[];
  modules: string[];
}

export interface AdminBlacklistEntry {
  entry_id: string;
  user_id: string;
  email?: string | null;
  full_name?: string | null;
  role?: UserRole | null;
  account_status?: string | null;
  previous_account_status: string;
  reason: string;
  created_by_admin_id: string;
  released_by_admin_id?: string | null;
  released_at?: string | null;
  created_at: string;
  updated_at: string;
}
