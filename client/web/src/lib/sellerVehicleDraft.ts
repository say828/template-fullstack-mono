export type DraftFuelType = "GASOLINE" | "DIESEL" | "HYBRID" | "EV";
export type DraftTransactionType = "DOMESTIC" | "EXPORT";
export type DraftAccidentHistory = "" | "NONE" | "MINOR" | "MAJOR";

export interface SellerVehicleImageMeta {
  id: string;
  name: string;
  size: number;
  type: string;
}

export interface SellerVehicleDraft {
  title: string;
  make: string;
  model: string;
  year: string;
  mileage_km: string;
  license_plate: string;
  fuel_type: DraftFuelType;
  transmission: "" | "AUTO" | "MANUAL" | "DCT";
  transaction_type: DraftTransactionType;
  reserve_price: string;
  min_bid_increment: string;
  currency: string;
  bidding_start_at: string;
  bidding_end_at: string;
  accident_history: DraftAccidentHistory;
  options: string[];
  photo_names: string[];
  notes: string;
  export_countries: string[];
  agreed_terms: boolean;
  images: SellerVehicleImageMeta[];
}

export interface SellerVehicleDraftSource {
  title: string;
  make: string;
  model: string;
  year: number;
  mileage_km: number;
  license_plate?: string | null;
  fuel_type: DraftFuelType;
  transmission?: "AUTO" | "MANUAL" | "DCT" | null;
  transaction_type: DraftTransactionType;
  reserve_price: number;
  min_bid_increment: number;
  options?: string[];
  photo_names?: string[];
  currency: string;
  bidding_ends_at: string;
}

export const SELLER_VEHICLE_DRAFT_KEY = "template_vehicle_register_draft_v1";

export const defaultSellerVehicleDraft: SellerVehicleDraft = {
  title: "",
  make: "",
  model: "",
  year: "",
  mileage_km: "",
  license_plate: "",
  fuel_type: "GASOLINE",
  transmission: "",
  transaction_type: "DOMESTIC",
  reserve_price: "",
  min_bid_increment: "100000",
  currency: "KRW",
  bidding_start_at: "",
  bidding_end_at: "",
  accident_history: "",
  options: [],
  photo_names: [],
  notes: "",
  export_countries: [],
  agreed_terms: false,
  images: [],
};

function sanitizeDraft(raw: unknown): SellerVehicleDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as Partial<SellerVehicleDraft>;
  return {
    ...defaultSellerVehicleDraft,
    ...candidate,
    options: Array.isArray(candidate.options) ? candidate.options.filter((v): v is string => typeof v === "string") : [],
    photo_names: Array.isArray(candidate.photo_names)
      ? candidate.photo_names.filter((v): v is string => typeof v === "string")
      : [],
    export_countries: Array.isArray(candidate.export_countries)
      ? candidate.export_countries.filter((v): v is string => typeof v === "string")
      : [],
    images: Array.isArray(candidate.images)
      ? candidate.images
          .filter((v): v is SellerVehicleImageMeta => Boolean(v && typeof v === "object"))
          .map((item) => ({
            id: String(item.id ?? ""),
            name: String(item.name ?? ""),
            size: Number(item.size ?? 0),
            type: String(item.type ?? ""),
          }))
          .filter((item) => item.id && item.name)
      : [],
  };
}

export function loadSellerVehicleDraft(): SellerVehicleDraft | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SELLER_VEHICLE_DRAFT_KEY);
  if (!raw) return null;
  try {
    return sanitizeDraft(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveSellerVehicleDraft(draft: SellerVehicleDraft): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SELLER_VEHICLE_DRAFT_KEY, JSON.stringify(draft));
}

export function clearSellerVehicleDraft(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SELLER_VEHICLE_DRAFT_KEY);
}

export function buildDraftFromVehicle(source: SellerVehicleDraftSource): SellerVehicleDraft {
  const endAt = new Date(source.bidding_ends_at);
  const startAt = new Date(Math.max(Date.now() + 10 * 60 * 1000, endAt.getTime() - 72 * 60 * 60 * 1000));
  const toLocal = (date: Date) => {
    if (!Number.isFinite(date.getTime())) return "";
    return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  };

  return {
    ...defaultSellerVehicleDraft,
    title: source.title,
    make: source.make,
    model: source.model,
    year: String(source.year),
    mileage_km: String(source.mileage_km),
    license_plate: source.license_plate ?? "",
    fuel_type: source.fuel_type,
    transmission: source.transmission ?? "",
    transaction_type: source.transaction_type,
    reserve_price: String(source.reserve_price),
    min_bid_increment: String(source.min_bid_increment),
    options: Array.isArray(source.options) ? source.options.filter((v) => v.trim()) : [],
    photo_names: Array.isArray(source.photo_names) ? source.photo_names.filter((v) => v.trim()) : [],
    currency: source.currency || "KRW",
    bidding_start_at: toLocal(startAt),
    bidding_end_at: toLocal(endAt),
  };
}
