export type DraftTransactionType = "DOMESTIC" | "EXPORT";
export type DraftFuelType = "" | "GASOLINE" | "DIESEL" | "HYBRID" | "EV";
export type DraftTransmission = "" | "AUTO" | "MANUAL" | "DCT";
export type DraftAccidentHistory = "" | "NONE" | "REPLACED" | "ACCIDENT";

export interface SellerVehicleDraft {
  transaction_type: DraftTransactionType;
  fuel_type: DraftFuelType;
  transmission: DraftTransmission;
  make: string;
  model: string;
  year: string;
  color: string;
  displacement_cc: string;
  license_plate: string;
  mileage_km: string;
  is_single_owner: boolean;
  accident_history: DraftAccidentHistory;
  options: string[];
  selling_point: string;
  photo_names: string[];
  desired_price: string;
  bid_start_price: string;
  bid_start_date: string;
  bid_end_date: string;
  min_bid_increment: string;
  visible_countries: string[];
  agreed_terms: boolean;
}

export type DraftErrors = Partial<Record<keyof SellerVehicleDraft | "bid_period" | "photos", string>>;

export const SELLER_VEHICLE_DRAFT_KEY = "palka_seller_vehicle_draft_v1";
const MAX_MILEAGE_KM = 2_147_483_647;
const MAX_PRICE = 9_999_999_999;

function buildDefaultBidWindow() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3);
  const formatDate = (value: Date) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return {
    bid_start_date: formatDate(start),
    bid_end_date: formatDate(end),
  };
}

export function defaultSellerVehicleDraft(): SellerVehicleDraft {
  const { bid_start_date, bid_end_date } = buildDefaultBidWindow();
  return {
    transaction_type: "DOMESTIC",
    fuel_type: "",
    transmission: "",
    make: "",
    model: "",
    year: "",
    color: "",
    displacement_cc: "",
    license_plate: "",
    mileage_km: "",
    is_single_owner: false,
    accident_history: "",
    options: [],
    selling_point: "",
    photo_names: [],
    desired_price: "",
    bid_start_price: "",
    bid_start_date,
    bid_end_date,
    min_bid_increment: "100000",
    visible_countries: [],
    agreed_terms: false,
  };
}

export function loadSellerVehicleDraft(): SellerVehicleDraft {
  if (typeof window === "undefined") return defaultSellerVehicleDraft();

  const raw = window.sessionStorage.getItem(SELLER_VEHICLE_DRAFT_KEY);
  if (!raw) return defaultSellerVehicleDraft();

  try {
    const parsed = JSON.parse(raw) as Partial<SellerVehicleDraft>;
    const fallbackBidWindow = buildDefaultBidWindow();
    const loadedBidWindow =
      parsed.bid_start_date &&
      parsed.bid_end_date &&
      !isPastDate(parsed.bid_start_date) &&
      parsed.bid_end_date >= parsed.bid_start_date
        ? {
            bid_start_date: parsed.bid_start_date,
            bid_end_date: parsed.bid_end_date,
          }
        : fallbackBidWindow;

    return {
      ...defaultSellerVehicleDraft(),
      ...parsed,
      ...loadedBidWindow,
      options: Array.isArray(parsed.options) ? parsed.options : [],
      photo_names: Array.isArray(parsed.photo_names) ? parsed.photo_names : [],
      visible_countries: Array.isArray(parsed.visible_countries) ? parsed.visible_countries : [],
    };
  } catch {
    return defaultSellerVehicleDraft();
  }
}

export function saveSellerVehicleDraft(draft: SellerVehicleDraft) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(SELLER_VEHICLE_DRAFT_KEY, JSON.stringify(draft));
}

export function clearSellerVehicleDraft() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(SELLER_VEHICLE_DRAFT_KEY);
}

function isPastDate(dateText: string): boolean {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(`${dateText}T00:00:00`);
  return target < today;
}

function isValidLicensePlate(value: string): boolean {
  const normalized = value.replace(/\s+/g, "");
  return /^\d{2,3}[가-힣]\d{4}$/.test(normalized);
}

export function computeBiddingHours(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00`);
  const endExclusive = new Date(`${endDate}T00:00:00`);
  endExclusive.setDate(endExclusive.getDate() + 1);

  const diffMs = endExclusive.getTime() - start.getTime();
  return Math.round(diffMs / (1000 * 60 * 60));
}

export function validateSellerVehicleDraft(draft: SellerVehicleDraft): DraftErrors {
  const errors: DraftErrors = {};

  if (!draft.fuel_type) errors.fuel_type = "연료를 선택해 주세요.";
  if (!draft.transmission) errors.transmission = "변속기를 선택해 주세요.";
  if (!draft.make) errors.make = "제조사를 선택해 주세요.";
  if (!draft.model.trim()) errors.model = "모델을 입력해 주세요.";
  if (!draft.year) errors.year = "연식을 선택해 주세요.";
  if (!draft.color.trim()) errors.color = "색상을 입력해 주세요.";

  const displacement = Number(draft.displacement_cc || 0);
  if (!displacement || displacement <= 0) errors.displacement_cc = "배기량(cc)을 올바르게 입력해 주세요.";

  const mileage = Number(draft.mileage_km || 0);
  if (!mileage || mileage <= 0) errors.mileage_km = "주행 거리(km)를 올바르게 입력해 주세요.";
  else if (mileage > MAX_MILEAGE_KM) errors.mileage_km = "주행 거리가 허용 범위를 초과했습니다.";

  if (!draft.license_plate.trim()) {
    errors.license_plate = "차량 번호를 입력해 주세요.";
  } else if (!isValidLicensePlate(draft.license_plate)) {
    errors.license_plate = "차량 번호 형식이 올바르지 않습니다. 예: 12가3456";
  }

  if (!draft.accident_history) errors.accident_history = "사고/수리 이력을 선택해 주세요.";

  const bidStartPrice = Number(draft.bid_start_price || 0);
  if (!bidStartPrice || bidStartPrice <= 0) {
    errors.bid_start_price = "입찰 시작가를 입력해 주세요.";
  } else if (bidStartPrice > MAX_PRICE) {
    errors.bid_start_price = "입찰 시작가는 99억 9999만 9999원 이하로 입력해 주세요.";
  }

  if (!draft.bid_start_date || !draft.bid_end_date) {
    errors.bid_period = "입찰 시작일과 종료일을 모두 선택해 주세요.";
  } else {
    if (isPastDate(draft.bid_start_date)) {
      errors.bid_period = "입찰 시작일은 오늘 이후로 설정해 주세요.";
    } else if (draft.bid_end_date < draft.bid_start_date) {
      errors.bid_period = "입찰 종료일은 시작일보다 빠를 수 없습니다.";
    } else {
      const hours = computeBiddingHours(draft.bid_start_date, draft.bid_end_date);
      if (hours < 1) {
        errors.bid_period = "입찰 기간이 유효하지 않습니다.";
      } else if (hours > 720) {
        errors.bid_period = "입찰 기간은 최대 30일(720시간)까지 설정할 수 있습니다.";
      }
    }
  }

  const minIncrement = Number(draft.min_bid_increment || 0);
  if (!minIncrement || minIncrement <= 0) errors.min_bid_increment = "최소 호가 단위를 선택해 주세요.";
  else if (minIncrement > MAX_PRICE) errors.min_bid_increment = "최소 호가 단위가 허용 범위를 초과했습니다.";

  if (draft.transaction_type === "EXPORT" && draft.visible_countries.length === 0) {
    errors.visible_countries = "수출 가능 거래는 딜러 노출 국가를 1개 이상 선택해 주세요.";
  }

  if (!draft.agreed_terms) errors.agreed_terms = "등록 약관 동의가 필요합니다.";

  return errors;
}
