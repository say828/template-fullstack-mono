import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../app/AuthContext";
import vehicleHeroImage from "../assets/seller/vehicle-hero.png";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { getSellerVehicleDetail, updateVehicle } from "../lib/api";
import type { SellerVehicleDetail, Vehicle } from "../lib/types";

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

type EditForm = {
  title: string;
  make: string;
  model: string;
  year: string;
  mileage_km: string;
  license_plate: string;
  fuel_type: Vehicle["fuel_type"] | "";
  transmission: NonNullable<Vehicle["transmission"]> | "";
  transaction_type: Vehicle["transaction_type"];
  reserve_price: string;
  min_bid_increment: string;
  options: string[];
};

function fuelLabel(fuelType: SellerVehicleDetail["fuel_type"]) {
  if (fuelType === "GASOLINE") return "가솔린";
  if (fuelType === "DIESEL") return "디젤";
  if (fuelType === "HYBRID") return "하이브리드";
  if (fuelType === "EV") return "전기";
  return "-";
}

function transmissionLabel(transmission?: SellerVehicleDetail["transmission"]) {
  if (transmission === "AUTO") return "자동변속기";
  if (transmission === "MANUAL") return "수동변속기";
  if (transmission === "DCT") return "DCT";
  return "미등록";
}

function formatCurrency(value: number, currency: string) {
  return currency === "KRW" ? `${value.toLocaleString()}원` : `${value.toLocaleString()} ${currency}`;
}

function normalizeLicensePlate(value: string) {
  return value.replace(/\s+/g, "");
}

function buildInitialForm(detail: SellerVehicleDetail): EditForm {
  return {
    title: detail.title,
    make: detail.make,
    model: detail.model,
    year: String(detail.year),
    mileage_km: String(detail.mileage_km),
    license_plate: detail.license_plate ?? "",
    fuel_type: detail.fuel_type,
    transmission: detail.transmission ?? "",
    transaction_type: detail.transaction_type,
    reserve_price: String(detail.reserve_price),
    min_bid_increment: String(detail.min_bid_increment),
    options: detail.options ?? [],
  };
}

export function SellerVehicleEditPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { vehicleId } = useParams<{ vehicleId: string }>();

  const [detail, setDetail] = useState<SellerVehicleDetail | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!token || !vehicleId) return;
      setLoading(true);
      setError(null);
      try {
        const vehicle = await getSellerVehicleDetail(token, vehicleId);
        if (!mounted) return;
        setDetail(vehicle);
        setForm(buildInitialForm(vehicle));
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "차량 정보를 불러오지 못했습니다.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [token, vehicleId]);

  const selectedOptions = useMemo(() => new Set(form?.options ?? []), [form?.options]);

  const toggleOption = (option: string) => {
    setForm((current) => {
      if (!current) return current;
      const exists = current.options.includes(option);
      return {
        ...current,
        options: exists ? current.options.filter((item) => item !== option) : [...current.options, option],
      };
    });
  };

  const setField = <K extends keyof EditForm>(key: K, value: EditForm[K]) => {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  };

  const submit = async () => {
    if (!token || !vehicleId || !detail || !form) return;
    if (!form.title.trim() || !form.make.trim() || !form.model.trim() || !form.year || !form.fuel_type || !form.transmission) {
      setError("필수 항목을 모두 입력해 주세요.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await updateVehicle(token, vehicleId, {
        title: form.title.trim(),
        make: form.make.trim(),
        model: form.model.trim(),
        year: Number(form.year),
        mileage_km: Number(form.mileage_km),
        license_plate: normalizeLicensePlate(form.license_plate) || null,
        fuel_type: form.fuel_type,
        transmission: form.transmission,
        transaction_type: form.transaction_type,
        reserve_price: Number(form.reserve_price),
        min_bid_increment: Number(form.min_bid_increment),
        options: form.options,
        currency: detail.currency,
      });
      navigate(`/seller/vehicles/${vehicleId}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "차량 정보 수정 실패");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="mx-auto max-w-5xl">
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">차량 정보를 불러오는 중...</CardContent>
        </Card>
      </section>
    );
  }

  if (!detail || !form) {
    return (
      <section className="mx-auto max-w-5xl space-y-3">
        <Card>
          <CardContent className="pt-6 text-sm">차량 정보를 찾을 수 없습니다.</CardContent>
        </Card>
        {error && (
          <Alert variant="destructive">
            <AlertTitle>조회 실패</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button type="button" variant="outline" onClick={() => navigate("/seller/vehicles")}>
          내 차량 목록으로 이동
        </Button>
      </section>
    );
  }

  const photoNames = detail.photo_names ?? [];

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
        <CardContent className="grid gap-0 p-0 lg:grid-cols-[1.55fr_0.95fr]">
          <div className="space-y-4 p-5 lg:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full bg-[#edf3ff] px-3 py-1 text-xs font-semibold text-[#2f6ff5]">차량수정</span>
              <span className="inline-flex rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">FRT_014</span>
            </div>
            <div className="grid gap-4 md:grid-cols-[1.1fr_1fr]">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                <img alt={detail.title} className="h-full w-full object-cover object-center" src={detail.photo_urls?.[0] ?? vehicleHeroImage} />
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-[#2f6ff5]">차량 정보 수정</p>
                  <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950">
                    {form.make && form.model ? `${form.make} ${form.model}` : "차량 기본 정보를 입력해 주세요"}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">실제 저장된 차량 정보와 입찰 조건을 수정합니다.</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">현재 사진</p>
                    <p className="mt-1 font-semibold text-slate-900">{detail.photo_urls?.length ?? 0}장</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">옵션</p>
                    <p className="mt-1 font-semibold text-slate-900">{form.options.length}개</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 md:col-span-2">
                    <p className="text-xs text-slate-500">입찰 시작가</p>
                    <p className="mt-1 text-2xl font-black tracking-tight text-[#2f6ff5]">{formatCurrency(Number(form.reserve_price || 0), detail.currency)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-200 bg-slate-50/80 p-5 lg:border-l lg:border-t-0 lg:p-6">
            <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <p className="text-sm font-semibold text-slate-700">수정 안내</p>
              <div className="space-y-2 text-sm text-slate-600">
                <p>차량 기본 정보, 입찰 조건, 옵션을 수정할 수 있습니다.</p>
                <p>사진 변경은 별도 업로드 플로우가 준비되면 확장합니다.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <header className="space-y-1">
        <h1 className="text-3xl font-black text-slate-900">차량 정보 수정</h1>
        <p className="text-sm text-slate-500">실제 저장된 차량 정보를 수정합니다.</p>
      </header>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>저장 실패</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="title">차량명</Label>
            <Input id="title" value={form.title} onChange={(event) => setField("title", event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="make">제조사</Label>
            <select
              id="make"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.make}
              onChange={(event) => setField("make", event.target.value)}
            >
              <option value="">선택</option>
              {makerOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">모델</Label>
            <Input id="model" value={form.model} onChange={(event) => setField("model", event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="year">연식</Label>
            <select
              id="year"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.year}
              onChange={(event) => setField("year", event.target.value)}
            >
              <option value="">선택</option>
              {yearOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="mileage_km">주행거리(km)</Label>
            <Input id="mileage_km" inputMode="numeric" value={form.mileage_km} onChange={(event) => setField("mileage_km", event.target.value.replace(/[^0-9]/g, ""))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="license_plate">차량 번호</Label>
            <Input id="license_plate" value={form.license_plate} onChange={(event) => setField("license_plate", event.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">사양 및 조건</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fuel_type">연료</Label>
            <select
              id="fuel_type"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.fuel_type}
              onChange={(event) => setField("fuel_type", event.target.value as EditForm["fuel_type"])}
            >
              <option value="">선택</option>
              <option value="GASOLINE">가솔린</option>
              <option value="DIESEL">디젤</option>
              <option value="HYBRID">하이브리드</option>
              <option value="EV">전기</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="transmission">변속기</Label>
            <select
              id="transmission"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.transmission}
              onChange={(event) => setField("transmission", event.target.value as EditForm["transmission"])}
            >
              <option value="">선택</option>
              <option value="AUTO">자동변속기</option>
              <option value="MANUAL">수동변속기</option>
              <option value="DCT">DCT</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="transaction_type">거래 유형</Label>
            <select
              id="transaction_type"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.transaction_type}
              onChange={(event) => setField("transaction_type", event.target.value as EditForm["transaction_type"])}
            >
              <option value="DOMESTIC">국내 거래</option>
              <option value="EXPORT">수출 가능</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="min_bid_increment">최소 호가 단위</Label>
            <select
              id="min_bid_increment"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.min_bid_increment}
              onChange={(event) => setField("min_bid_increment", event.target.value)}
            >
              {minBidOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="reserve_price">입찰 시작가</Label>
            <Input
              id="reserve_price"
              inputMode="numeric"
              value={form.reserve_price}
              onChange={(event) => setField("reserve_price", event.target.value.replace(/[^0-9]/g, ""))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">옵션</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {optionChips.map((option) => {
              const selected = selectedOptions.has(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleOption(option)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${
                    selected
                      ? "border-[#2f6ff5] bg-[#edf3ff] font-semibold text-[#2f6ff5]"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
          {form.options.length === 0 && <p className="text-sm text-slate-500">선택된 옵션이 없습니다.</p>}
          {form.options.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.options.map((option) => (
                <Badge key={option} variant="secondary">
                  {option}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">현재 사진</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            {(detail.photo_urls ?? []).slice(0, 3).map((src, index) => (
              <div key={src} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                <img alt={photoNames[index] ?? `차량 이미지 ${index + 1}`} className="h-40 w-full object-cover object-center" src={src} />
              </div>
            ))}
          </div>
          <p className="text-sm text-slate-500">사진 변경은 별도 업로드 플로우에서 처리합니다.</p>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" disabled={saving} onClick={() => navigate(`/seller/vehicles/${detail.id}`)}>
          취소
        </Button>
        <Button className="bg-[#2f6ff5] hover:bg-[#2459cd]" disabled={saving} onClick={() => void submit()} type="button">
          {saving ? "저장 중..." : "수정 내용 저장"}
        </Button>
      </div>
    </section>
  );
}
