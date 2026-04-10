import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../app/AuthContext";
import tradeVehicleImage from "../assets/frt010-empty-vehicle.png";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { createVehicle } from "../lib/api";
import { Vehicle } from "../lib/types";
import {
  clearSellerVehicleDraft,
  computeBiddingHours,
  loadSellerVehicleDraft,
  SellerVehicleDraft,
  validateSellerVehicleDraft,
} from "./seller/sellerVehicleDraft";

function fuelLabel(fuel: SellerVehicleDraft["fuel_type"]) {
  if (fuel === "GASOLINE") return "가솔린";
  if (fuel === "DIESEL") return "디젤";
  if (fuel === "HYBRID") return "하이브리드";
  if (fuel === "EV") return "전기";
  return "-";
}

function transmissionLabel(value: SellerVehicleDraft["transmission"]) {
  if (value === "AUTO") return "자동";
  if (value === "MANUAL") return "수동";
  if (value === "DCT") return "DCT";
  return "-";
}

function accidentLabel(value: SellerVehicleDraft["accident_history"]) {
  if (value === "NONE") return "무사고";
  if (value === "REPLACED") return "단순교환 있음";
  if (value === "ACCIDENT") return "사고 이력 있음";
  return "-";
}

function toPayload(draft: SellerVehicleDraft) {
  const hours = computeBiddingHours(draft.bid_start_date, draft.bid_end_date);

  return {
    title: `${draft.make} ${draft.model}`.trim(),
    make: draft.make,
    model: draft.model,
    year: Number(draft.year),
    mileage_km: Number(draft.mileage_km),
    license_plate: draft.license_plate.replace(/\s+/g, ""),
    fuel_type: draft.fuel_type as Vehicle["fuel_type"],
    transmission: draft.transmission as Exclude<Vehicle["transmission"], null | undefined>,
    transaction_type: draft.transaction_type as Vehicle["transaction_type"],
    reserve_price: Number(draft.bid_start_price),
    min_bid_increment: Number(draft.min_bid_increment),
    options: draft.options,
    photo_names: draft.photo_names,
    bidding_hours: hours,
    currency: "KRW",
  };
}

function previewTone(index: number) {
  const tones = [
    "from-slate-100 via-slate-200 to-slate-100",
    "from-slate-800 via-slate-900 to-slate-700",
    "from-slate-700 via-slate-800 to-slate-900",
  ];
  return tones[index % tones.length];
}

export function SellerVehicleRegisterConfirmPage() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [draft, setDraft] = useState<SellerVehicleDraft | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loaded = loadSellerVehicleDraft();
    const errors = validateSellerVehicleDraft(loaded);

    if (Object.keys(errors).length > 0) {
      navigate("/seller/vehicles/register", { replace: true });
      return;
    }

    setDraft(loaded);
  }, [navigate]);

  const payload = useMemo(() => {
    if (!draft) return null;
    return toPayload(draft);
  }, [draft]);

  const submit = async () => {
    if (!token || !payload) return;

    setSubmitting(true);
    setError(null);
    try {
      await createVehicle(token, payload);
      clearSellerVehicleDraft();
      navigate("/seller/vehicles?registered=1", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "경매 등록 요청 실패");
      setSubmitting(false);
    }
  };

  if (!draft || !payload) {
    return (
      <section className="space-y-4">
        <Card>
          <CardContent className="pt-6 text-sm text-slate-500">등록 진행 중인 차량 정보를 찾을 수 없습니다.</CardContent>
        </Card>
        <Button asChild type="button" variant="outline">
          <Link to="/seller/vehicles/register">차량등록으로 이동</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
        <CardContent className="grid gap-0 p-0 lg:grid-cols-[1.55fr_0.95fr]">
          <div className="space-y-4 p-5 lg:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full bg-[#edf3ff] px-3 py-1 text-xs font-semibold text-[#2f6ff5]">등록내용확인</span>
              <span className="inline-flex rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">FRT_034</span>
            </div>
            <div className="grid gap-4 md:grid-cols-[1.1fr_1fr]">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                <img alt="차량 등록 내용" className="h-full w-full object-contain p-3" src={tradeVehicleImage} />
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-[#2f6ff5]">등록 내용 확인</p>
                  <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950">{draft.make} {draft.model}</p>
                  <p className="mt-2 text-sm text-slate-500">
                    입력하신 차량 정보와 입찰 조건을 한 번 더 확인해 주세요.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">대표 사진</p>
                    <p className="mt-1 font-semibold text-slate-900">{draft.photo_names.length}장</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">옵션</p>
                    <p className="mt-1 font-semibold text-slate-900">{draft.options.length}개</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 md:col-span-2">
                    <p className="text-xs text-slate-500">입찰 시작가</p>
                    <p className="mt-1 text-2xl font-black tracking-tight text-[#2f6ff5]">{Number(draft.bid_start_price).toLocaleString()}원</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-200 bg-slate-50/80 p-5 lg:border-l lg:border-t-0 lg:p-6">
            <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <p className="text-sm font-semibold text-slate-700">진행 요약</p>
              <div className="space-y-2 text-sm text-slate-600">
                <p>등록 전 차량 정보, 사진, 입찰 조건을 최종 확인합니다.</p>
                <p>문제가 없으면 경매 등록을 진행하세요.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <header className="space-y-1">
        <h1 className="text-3xl font-black text-slate-900">등록 내용 확인</h1>
        <p className="text-sm text-slate-500">입력하신 차량 정보와 입찰 조건을 한 번 더 확인해 주세요. (FRT_034)</p>
      </header>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>등록 실패</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">1 차량 기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <img alt="대표 이미지" className="h-40 w-full object-contain p-3" src={tradeVehicleImage} />
            </div>

            <div className="grid gap-2 text-sm md:grid-cols-2 lg:grid-cols-3">
              <p>제조사: <span className="font-semibold text-slate-900">{draft.make}</span></p>
              <p>모델: <span className="font-semibold text-slate-900">{draft.model}</span></p>
              <p>연식: <span className="font-semibold text-slate-900">{draft.year}년식</span></p>
              <p>주행 거리: <span className="font-semibold text-slate-900">{Number(draft.mileage_km).toLocaleString()} km</span></p>
              <p>연료/변속기: <span className="font-semibold text-slate-900">{fuelLabel(draft.fuel_type)} · {transmissionLabel(draft.transmission)}</span></p>
              <p>색상: <span className="font-semibold text-slate-900">{draft.color}</span></p>
              <p>배기량: <span className="font-semibold text-slate-900">{Number(draft.displacement_cc).toLocaleString()} cc</span></p>
              <p>차량 번호: <span className="font-semibold text-slate-900">{draft.license_plate}</span></p>
              <p>1인 신조: <span className="font-semibold text-slate-900">{draft.is_single_owner ? "예" : "아니오"}</span></p>
              <p>사고/수리 이력: <span className="font-semibold text-slate-900">{accidentLabel(draft.accident_history)}</span></p>
            </div>
          </div>

          <Alert>
            <AlertTitle>안내</AlertTitle>
            <AlertDescription>실제 차량 정보와 상이할 경우, 경매 진행이 제한되거나 거래가 취소될 수 있습니다.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">옵션 및 추가 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {draft.options.length === 0 && <Badge variant="outline">없음</Badge>}
            {draft.options.map((option) => (
              <Badge key={option} variant="secondary">
                {option}
              </Badge>
            ))}
          </div>
          <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">{draft.selling_point.trim() || "없음"}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">차량 사진</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-700">
          {draft.photo_names.length === 0 && <p>없음</p>}
          {draft.photo_names.length > 0 && (
            <>
              <p>대표 이미지: {draft.photo_names[0]}</p>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-5">
                {draft.photo_names.slice(0, 6).map((name, index) => (
                  <div key={`${name}-${index}`} className="overflow-hidden rounded-md border border-slate-200 bg-white">
                    <div className={`flex h-20 items-center justify-center bg-gradient-to-br ${previewTone(index)}`}>
                      <span className={`text-[11px] font-semibold ${index === 0 ? "text-slate-700" : "text-white/80"}`}>썸네일</span>
                    </div>
                    <div className="px-3 py-2 text-xs">{name}</div>
                  </div>
                ))}
              </div>
              {draft.photo_names.length > 6 && <p className="text-xs text-slate-500">+{draft.photo_names.length - 6}장 더보기</p>}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">입찰 조건</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm md:grid-cols-2">
          <p>거래 유형: <span className="font-semibold text-slate-900">{draft.transaction_type === "DOMESTIC" ? "국내 거래" : "수출 가능"}</span></p>
          <p>입찰 기간: <span className="font-semibold text-slate-900">{draft.bid_start_date} ~ {draft.bid_end_date}</span></p>
          <p>입찰 시작가: <span className="font-semibold text-slate-900">{Number(draft.bid_start_price).toLocaleString()} 원</span></p>
          <p>희망 낙찰가(참고용): <span className="font-semibold text-slate-900">{draft.desired_price ? `${Number(draft.desired_price).toLocaleString()} 원` : "없음"}</span></p>
          <p>최소 호가 단위: <span className="font-semibold text-slate-900">{Number(draft.min_bid_increment).toLocaleString()} 원</span></p>
          <p>딜러 노출 국가: <span className="font-semibold text-slate-900">{draft.visible_countries.length > 0 ? draft.visible_countries.join(", ") : "없음"}</span></p>
          <p className="md:col-span-2 text-xs text-slate-500">입찰 시작 이후 입찰 시작가/입찰 기간 변경 불가</p>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button asChild type="button" variant="outline" disabled={submitting}>
          <Link to="/seller/vehicles/register" state={{ restoreDraft: true }}>이전</Link>
        </Button>
        <Button className="bg-[#2f6ff5] hover:bg-[#2459cd]" disabled={submitting} onClick={() => void submit()} type="button">
          {submitting ? "등록 중..." : "경매 등록하기"}
        </Button>
      </div>
    </section>
  );
}
