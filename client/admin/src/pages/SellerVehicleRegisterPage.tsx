import { X } from "lucide-react";
import { FormEvent, KeyboardEvent, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  clearSellerVehicleDraft,
  defaultSellerVehicleDraft,
  DraftErrors,
  loadSellerVehicleDraft,
  saveSellerVehicleDraft,
  SellerVehicleDraft,
  validateSellerVehicleDraft,
} from "./seller/sellerVehicleDraft";

const makerOptions = ["현대", "기아", "제네시스", "BMW", "벤츠", "아우디", "볼보", "렉서스", "기타"];

const yearOptions = Array.from({ length: 31 }, (_, index) => String(2026 - index));

const minBidOptions = [
  { value: "100000", label: "10만 원" },
  { value: "300000", label: "30만 원" },
  { value: "500000", label: "50만 원" },
  { value: "1000000", label: "100만 원" },
];

const optionChips = [
  "선루프",
  "파노라마 선루프",
  "내비게이션",
  "열선시트(앞좌석)",
  "열선시트(뒷좌석)",
  "통풍시트(앞좌석)",
  "통풍시트(뒷좌석)",
  "전동시트",
  "메모리시트",
  "가죽시트",
  "어댑티브 크루즈",
  "HUD(헤드업)",
  "후방카메라",
  "어라운드 뷰",
  "전동 트렁크",
  "블랙박스",
  "하이패스",
  "차선이탈경보",
  "후측방경보",
];

const defaultCountries = ["대한민국", "일본", "홍콩", "싱가포르", "태국", "UAE"];
const errorLabels: Partial<Record<keyof DraftErrors, string>> = {
  fuel_type: "연료",
  transmission: "변속기",
  make: "제조사",
  model: "모델",
  year: "연식",
  color: "색상",
  displacement_cc: "배기량",
  license_plate: "차량 번호",
  mileage_km: "주행 거리",
  accident_history: "사고 / 수리 이력",
  bid_start_price: "입찰 시작가",
  bid_period: "입찰 기간",
  min_bid_increment: "최소 호가 단위",
  visible_countries: "딜러 노출 국가",
  agreed_terms: "등록 약관 동의",
};

function numberOnly(value: string): string {
  return value.replace(/[^0-9]/g, "");
}

function toManKmLabel(kmText: string): string {
  const km = Number(kmText || 0);
  if (!km) return "";
  return `${(km / 10000).toFixed(1)}만`;
}

function photoCardTone(index: number) {
  const tones = [
    "from-slate-100 via-slate-200 to-slate-100",
    "from-slate-800 via-slate-900 to-slate-700",
    "from-slate-700 via-slate-800 to-slate-900",
  ];
  return tones[index % tones.length];
}

export function SellerVehicleRegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const restoreDraft = Boolean((location.state as { restoreDraft?: boolean } | null)?.restoreDraft);

  const [draft, setDraft] = useState<SellerVehicleDraft>(() =>
    restoreDraft ? loadSellerVehicleDraft() : defaultSellerVehicleDraft(),
  );
  const [errors, setErrors] = useState<DraftErrors>({});
  const [countryInput, setCountryInput] = useState("");

  useEffect(() => {
    if (restoreDraft) return;
    clearSellerVehicleDraft();
    setDraft(defaultSellerVehicleDraft());
  }, [restoreDraft]);

  useEffect(() => {
    saveSellerVehicleDraft(draft);
  }, [draft]);

  const errorSummary = useMemo(
    () =>
      Object.entries(errors)
        .filter(([, message]) => typeof message === "string" && message.trim().length > 0)
        .map(([key, message]) => {
          const label = errorLabels[key as keyof DraftErrors];
          return label ? `${label}: ${message as string}` : (message as string);
        }),
    [errors],
  );

  const setField = <K extends keyof SellerVehicleDraft>(key: K, value: SellerVehicleDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined, bid_period: undefined }));
  };

  const toggleOption = (option: string) => {
    setDraft((prev) => {
      const exists = prev.options.includes(option);
      const nextOptions = exists ? prev.options.filter((item) => item !== option) : [...prev.options, option];
      return { ...prev, options: nextOptions };
    });
  };

  const addCountry = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    setDraft((prev) => {
      if (prev.visible_countries.includes(trimmed)) return prev;
      return { ...prev, visible_countries: [...prev.visible_countries, trimmed] };
    });
    setCountryInput("");
    setErrors((prev) => ({ ...prev, visible_countries: undefined }));
  };

  const onCountryKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    addCountry(countryInput);
  };

  const onPhotoChange = (event: FormEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files ?? []);
    if (files.length === 0) return;

    setDraft((prev) => {
      const merged = [...prev.photo_names, ...files.map((file) => file.name)].slice(0, 20);
      return { ...prev, photo_names: merged };
    });
  };

  const onNext = () => {
    const nextErrors = validateSellerVehicleDraft(draft);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    saveSellerVehicleDraft(draft);
    navigate("/seller/vehicles/register/confirm");
  };

  const onCancel = () => {
    clearSellerVehicleDraft();
    setDraft(defaultSellerVehicleDraft());
    navigate("/seller/vehicles");
  };

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-black text-slate-900">새 차량 등록하기</h1>
        <p className="text-sm text-slate-500">입찰에 등록할 차량 정보를 입력하고, 입찰 조건을 설정해 주세요. (FRT_033)</p>
      </header>

      {errorSummary.length > 0 && (
        <Alert variant="destructive">
          <AlertTitle>입력값을 확인해 주세요</AlertTitle>
          <AlertDescription>
            <ul className="list-disc space-y-1 pl-5">
              {errorSummary.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">1 차량 기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>거래 유형</Label>
            <div className="flex gap-2">
              <button
                className={`h-10 rounded-md border px-4 text-sm ${draft.transaction_type === "DOMESTIC" ? "border-[#2f6ff5] bg-[#edf3ff] text-[#2f6ff5]" : "border-slate-200 text-slate-600"}`}
                onClick={() => setField("transaction_type", "DOMESTIC")}
                type="button"
              >
                국내 거래
              </button>
              <button
                className={`h-10 rounded-md border px-4 text-sm ${draft.transaction_type === "EXPORT" ? "border-[#2f6ff5] bg-[#edf3ff] text-[#2f6ff5]" : "border-slate-200 text-slate-600"}`}
                onClick={() => setField("transaction_type", "EXPORT")}
                type="button"
              >
                수출 가능
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-fuel">연료</Label>
            <select
              id="register-fuel"
              value={draft.fuel_type}
              onChange={(event) => setField("fuel_type", event.target.value as SellerVehicleDraft["fuel_type"])}
              className={`h-10 w-full rounded-md border bg-white px-3 text-sm ${errors.fuel_type ? "border-rose-500" : "border-slate-200"}`}
            >
              <option value="">선택해주세요</option>
              <option value="GASOLINE">가솔린</option>
              <option value="DIESEL">디젤</option>
              <option value="HYBRID">하이브리드</option>
              <option value="EV">전기</option>
            </select>
            {errors.fuel_type && <p className="text-xs text-rose-500">{errors.fuel_type}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-transmission">변속기</Label>
            <select
              id="register-transmission"
              value={draft.transmission}
              onChange={(event) => setField("transmission", event.target.value as SellerVehicleDraft["transmission"])}
              className={`h-10 w-full rounded-md border bg-white px-3 text-sm ${errors.transmission ? "border-rose-500" : "border-slate-200"}`}
            >
              <option value="">선택해주세요</option>
              <option value="AUTO">자동</option>
              <option value="MANUAL">수동</option>
              <option value="DCT">DCT</option>
            </select>
            {errors.transmission && <p className="text-xs text-rose-500">{errors.transmission}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-make">제조사</Label>
            <select
              id="register-make"
              value={draft.make}
              onChange={(event) => setField("make", event.target.value)}
              className={`h-10 w-full rounded-md border bg-white px-3 text-sm ${errors.make ? "border-rose-500" : "border-slate-200"}`}
            >
              <option value="">선택해주세요</option>
              {makerOptions.map((maker) => (
                <option key={maker} value={maker}>
                  {maker}
                </option>
              ))}
            </select>
            {errors.make && <p className="text-xs text-rose-500">{errors.make}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-color">색상</Label>
            <Input
              id="register-color"
              placeholder="예: 화이트"
              value={draft.color}
              onChange={(event) => setField("color", event.target.value)}
              className={errors.color ? "border-rose-500" : undefined}
            />
            {errors.color && <p className="text-xs text-rose-500">{errors.color}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-model">모델</Label>
            <Input
              id="register-model"
              placeholder="예: 쏘나타 DN8 2.0 모던"
              value={draft.model}
              onChange={(event) => setField("model", event.target.value)}
              className={errors.model ? "border-rose-500" : undefined}
            />
            {errors.model && <p className="text-xs text-rose-500">{errors.model}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-displacement">배기량</Label>
            <div className="flex items-center gap-2">
              <Input
                id="register-displacement"
                placeholder="예: 2000"
                value={draft.displacement_cc}
                onChange={(event) => setField("displacement_cc", numberOnly(event.target.value))}
                className={errors.displacement_cc ? "border-rose-500" : undefined}
              />
              <span className="text-sm text-slate-500">cc</span>
            </div>
            {errors.displacement_cc && <p className="text-xs text-rose-500">{errors.displacement_cc}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-year">연식</Label>
            <select
              id="register-year"
              value={draft.year}
              onChange={(event) => setField("year", event.target.value)}
              className={`h-10 w-full rounded-md border bg-white px-3 text-sm ${errors.year ? "border-rose-500" : "border-slate-200"}`}
            >
              <option value="">선택해주세요</option>
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}년식
                </option>
              ))}
            </select>
            {errors.year && <p className="text-xs text-rose-500">{errors.year}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-license">차량 번호</Label>
            <Input
              id="register-license"
              placeholder="예: 12가3456"
              value={draft.license_plate}
              onChange={(event) => setField("license_plate", event.target.value)}
              className={errors.license_plate ? "border-rose-500" : undefined}
            />
            {errors.license_plate && <p className="text-xs text-rose-500">{errors.license_plate}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-mileage">주행 거리</Label>
            <div className="flex items-center gap-2">
              <Input
                id="register-mileage"
                placeholder="예: 43000"
                value={draft.mileage_km}
                onChange={(event) => setField("mileage_km", numberOnly(event.target.value))}
                className={errors.mileage_km ? "border-rose-500" : undefined}
              />
              <span className="text-sm text-slate-500">km</span>
            </div>
            {draft.mileage_km && <p className="text-xs text-slate-500">입력값: {toManKmLabel(draft.mileage_km)} km</p>}
            {errors.mileage_km && <p className="text-xs text-rose-500">{errors.mileage_km}</p>}
          </div>

          <div className="space-y-2">
            <Label>1인 신조 여부</Label>
            <button
              className={`h-10 rounded-md border px-4 text-sm ${draft.is_single_owner ? "border-[#2f6ff5] bg-[#edf3ff] text-[#2f6ff5]" : "border-slate-200 text-slate-600"}`}
              onClick={() => setField("is_single_owner", !draft.is_single_owner)}
              type="button"
            >
              {draft.is_single_owner ? "1인 신조입니다" : "선택 안함"}
            </button>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>사고 / 수리 이력</Label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "NONE", label: "무사고" },
                { value: "REPLACED", label: "단순교환 있음" },
                { value: "ACCIDENT", label: "사고 이력 있음" },
              ].map((item) => (
                <button
                  key={item.value}
                  className={`h-10 rounded-md border px-4 text-sm ${
                    draft.accident_history === item.value ? "border-[#2f6ff5] bg-[#edf3ff] text-[#2f6ff5]" : "border-slate-200 text-slate-600"
                  }`}
                  onClick={() => setField("accident_history", item.value as SellerVehicleDraft["accident_history"])}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500">공식 이력과 상이할 경우 거래가 제한될 수 있습니다.</p>
            {errors.accident_history && <p className="text-xs text-rose-500">{errors.accident_history}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">2 옵션 및 추가 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>차량 옵션 선택</Label>
            <div className="flex flex-wrap gap-2">
              {optionChips.map((option) => {
                const selected = draft.options.includes(option);
                return (
                  <button
                    key={option}
                    className={`h-9 rounded-full border px-3 text-sm ${selected ? "border-[#2f6ff5] bg-[#edf3ff] text-[#2f6ff5]" : "border-slate-200 text-slate-600"}`}
                    onClick={() => toggleOption(option)}
                    type="button"
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-selling-point">특이사항 / 셀링 포인트</Label>
            <Textarea
              id="register-selling-point"
              rows={4}
              placeholder="예: 1인 신조, 실내/외 관리 상태 우수, 튜닝 없음"
              value={draft.selling_point}
              onChange={(event) => setField("selling_point", event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">3 차량 사진 업로드</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
            <span className="text-2xl">+</span>
            <span>사진 추가하기</span>
            <input type="file" multiple accept="image/jpeg,image/jpg,image/png" className="hidden" onChange={onPhotoChange} />
          </label>

          <p className="text-xs text-slate-500">권장: 1200px 이상 / 최대 20장 / JPG, JPEG, PNG</p>

          {draft.photo_names.length > 0 && (
            <div className="grid gap-2 md:grid-cols-3">
              {draft.photo_names.map((name, index) => (
                <div key={`${name}-${index}`} className="overflow-hidden rounded-md border border-slate-200 bg-white">
                  <div className={`flex h-20 items-center justify-center bg-gradient-to-br ${photoCardTone(index)}`}>
                    <span className={`text-xs font-semibold ${index === 0 ? "text-slate-700" : "text-white/80"}`}>미리보기</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="truncate">{name}</span>
                    <button
                      className="text-slate-400 hover:text-slate-600"
                      onClick={() => setField("photo_names", draft.photo_names.filter((_, itemIndex) => itemIndex !== index))}
                      type="button"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">4 입찰 조건 설정</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="register-desired-price">희망 낙찰가 (참고용)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="register-desired-price"
                placeholder="예: 22000000"
                value={draft.desired_price}
                onChange={(event) => setField("desired_price", numberOnly(event.target.value))}
              />
              <span className="text-sm text-slate-500">원</span>
            </div>
            <p className="text-xs text-slate-500">딜러에게 공개되지 않으며 내부 기준으로만 사용됩니다.</p>
          </div>

          <div className="space-y-2">
            <Label>입찰 기간</Label>
            <div className="flex items-center gap-2">
              <Input type="date" value={draft.bid_start_date} onChange={(event) => setField("bid_start_date", event.target.value)} />
              <span>~</span>
              <Input type="date" value={draft.bid_end_date} onChange={(event) => setField("bid_end_date", event.target.value)} />
            </div>
            {errors.bid_period && <p className="text-xs text-rose-500">{errors.bid_period}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-start-price">입찰 시작가</Label>
            <div className="flex items-center gap-2">
              <Input
                id="register-start-price"
                placeholder="예: 18000000"
                value={draft.bid_start_price}
                onChange={(event) => setField("bid_start_price", numberOnly(event.target.value))}
                className={errors.bid_start_price ? "border-rose-500" : undefined}
              />
              <span className="text-sm text-slate-500">원</span>
            </div>
            {errors.bid_start_price && <p className="text-xs text-rose-500">{errors.bid_start_price}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-min-bid">최소 호가 단위</Label>
            <select
              id="register-min-bid"
              value={draft.min_bid_increment}
              onChange={(event) => setField("min_bid_increment", event.target.value)}
              className={`h-10 w-full rounded-md border bg-white px-3 text-sm ${errors.min_bid_increment ? "border-rose-500" : "border-slate-200"}`}
            >
              {minBidOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            {errors.min_bid_increment && <p className="text-xs text-rose-500">{errors.min_bid_increment}</p>}
          </div>

          {draft.transaction_type === "EXPORT" && (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="register-country">딜러 노출 국가 (수출 가능 시)</Label>
              <Input
                id="register-country"
                value={countryInput}
                placeholder="국가 입력 후 엔터"
                onChange={(event) => setCountryInput(event.target.value)}
                onKeyDown={onCountryKeyDown}
              />
              <div className="flex flex-wrap gap-2">
                {defaultCountries.map((country) => (
                  <button
                    key={country}
                    type="button"
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600"
                    onClick={() => addCountry(country)}
                  >
                    {country}
                  </button>
                ))}
              </div>
              {draft.visible_countries.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {draft.visible_countries.map((country) => (
                    <span key={country} className="inline-flex items-center gap-1 rounded-full bg-[#edf3ff] px-3 py-1 text-xs text-[#2f6ff5]">
                      {country}
                      <button
                        type="button"
                        className="text-[#2f6ff5]/70"
                        onClick={() => setField("visible_countries", draft.visible_countries.filter((item) => item !== country))}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {errors.visible_countries && <p className="text-xs text-rose-500">{errors.visible_countries}</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">5 등록 약관 동의</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input checked={draft.agreed_terms} onChange={(event) => setField("agreed_terms", event.target.checked)} type="checkbox" className="mt-1" />
            Template의 중고차 거래 이용약관 및 개인정보 처리방침에 동의합니다.
          </label>
          {errors.agreed_terms && <p className="text-xs text-rose-500">{errors.agreed_terms}</p>}
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button className="bg-[#2f6ff5] hover:bg-[#2459cd]" onClick={onNext} type="button">
          다음
        </Button>
      </div>
    </section>
  );
}
