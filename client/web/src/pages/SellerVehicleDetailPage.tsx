import { PencilLine } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useAuth } from "../app/AuthContext";
import vehicleHeroImage from "../assets/seller/vehicle-hero.png";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import {
  SellerVehicleHeroSection,
  SellerVehicleImageViewerDialog,
  SellerVehiclePhotoOptionsCard,
  SellerVehicleSpecsCard,
  SellerVehicleStageProgressCard,
  SellerVehicleTimelineCard,
} from "../components/seller/SellerVehicleDetailSections";
import { getSellerTradeWorkflow, getSellerVehicleDetail } from "../lib/api";
import { deriveSellerVehicleLifecycleState } from "../lib/sellerVehicleLifecycle";
import type { SellerVehicleDetail, TradeWorkflow } from "../lib/types";

function formatCurrency(value: number, currency: string) {
  return currency === "KRW" ? `${value.toLocaleString()}원` : `${value.toLocaleString()} ${currency}`;
}

function formatMileageLabel(mileageKm: number) {
  if (mileageKm < 10000) return `${mileageKm.toLocaleString()} km`;
  return `${(mileageKm / 10000).toFixed(1)}만 km`;
}

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

function formatDateTime(value: string) {
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return "-";
  return target.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTimeLeft(seconds: number) {
  const safe = Math.max(0, seconds);
  const days = Math.floor(safe / 86400);
  const hours = Math.floor((safe % 86400) / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((safe % 3600) / 60)
    .toString()
    .padStart(2, "0");
  if (safe === 0) return "마감";
  if (safe >= 86400) return `${days}일`;
  return `${hours}:${minutes}`;
}

function biddingProgressPercent(timeLeftSeconds: number) {
  const totalWindowSeconds = 7 * 24 * 60 * 60;
  if (timeLeftSeconds <= 0) return 100;
  return Math.max(0, Math.min(100, Math.round((1 - timeLeftSeconds / totalWindowSeconds) * 100)));
}

function timelineRows(detail: SellerVehicleDetail, workflow: TradeWorkflow | null) {
  const rows = workflow?.events?.map((event) => ({
    id: event.id,
    label: event.message,
    createdAt: event.created_at,
  }));
  if (rows && rows.length > 0) return rows.slice().reverse().slice(0, 8);

  return [
    { id: "created", label: "차량 등록 완료", createdAt: detail.created_at },
    { id: "closed", label: detail.status === "ACTIVE" ? "경매 진행 중" : "입찰 마감 처리", createdAt: detail.bidding_ends_at },
  ];
}

export function SellerVehicleDetailPage() {
  const { token } = useAuth();
  const { vehicleId } = useParams<{ vehicleId: string }>();

  const [detail, setDetail] = useState<SellerVehicleDetail | null>(null);
  const [workflow, setWorkflow] = useState<TradeWorkflow | null>(null);
  const [liveTimeLeftSeconds, setLiveTimeLeftSeconds] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!token || !vehicleId) return;
    setLoading(true);
    setError(null);
    try {
      const vehicle = await getSellerVehicleDetail(token, vehicleId);
      setDetail(vehicle);
      setLiveTimeLeftSeconds(Math.max(0, vehicle.time_left_seconds));
      try {
        const flow = await getSellerTradeWorkflow(token, vehicleId);
        setWorkflow(flow);
      } catch {
        setWorkflow(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "차량 상세 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [token, vehicleId]);

  useEffect(() => {
    if (!detail) return;
    const timer = window.setInterval(() => {
      setLiveTimeLeftSeconds((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [detail?.id]);

  const photoUrls = detail?.photo_urls ?? [];
  const photoNames = detail?.photo_names ?? [];
  const remainingPhotoCount = Math.max(0, photoUrls.length - 5);
  const progressPercent = biddingProgressPercent(liveTimeLeftSeconds);
  const daysLeft = Math.max(0, Math.ceil(liveTimeLeftSeconds / 86400));
  const lifecycleState = detail ? deriveSellerVehicleLifecycleState(detail, workflow) : "STATUS_UNSET";
  const canEdit = useMemo(() => {
    if (!detail || lifecycleState !== "BIDDING") return false;
    if (!detail.bidding_started_at) return true;
    const startAt = new Date(detail.bidding_started_at).getTime();
    if (Number.isNaN(startAt)) return true;
    return Date.now() < startAt;
  }, [detail?.id, detail?.bidding_started_at, lifecycleState]);

  const progressSteps = [
    { id: "bidding", label: "입찰 진행 중", active: true },
    { id: "closed", label: "입찰 마감", active: false },
    { id: "depreciation", label: "감가 협의/검차", active: false },
    { id: "delivery", label: "인도 / 정산", active: false },
    { id: "completed", label: "거래 완료", active: false },
  ];

  if (loading) {
    return (
      <section className="mx-auto max-w-5xl">
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">차량 정보를 불러오는 중...</CardContent>
        </Card>
      </section>
    );
  }

  if (!detail) {
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
      </section>
    );
  }

  if (lifecycleState !== "BIDDING") {
    return (
      <section className="mx-auto max-w-5xl space-y-4">
        <header className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900">차량 상세 정보</h1>
          <p className="text-sm text-slate-500">현재 차량은 입찰중 상태가 아닙니다.</p>
        </header>
        <Card>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-700">입찰중 화면은 입찰 진행중 상태에서만 표시됩니다.</p>
            <div className="grid gap-2 sm:inline-flex">
              <Button asChild className="w-full bg-[#2f6ff5] hover:bg-[#2459cd] sm:w-auto">
                <Link to="/seller/vehicles">차량 목록으로 이동</Link>
              </Button>
              <Button asChild className="w-full sm:w-auto" variant="outline" type="button">
                <Link to={`/seller/vehicles/${detail.id}/bids`}>입찰 현황 보기</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  const events = timelineRows(detail, workflow).map((event) => ({
    id: event.id,
    label: event.label,
    timeLabel: formatDateTime(event.createdAt),
  }));

  return (
    <>
      <section className="mx-auto max-w-5xl space-y-5">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-slate-900">차량 상세 정보</h1>
            <p className="text-sm text-slate-500">입찰 중인 차량 정보를 확인할 수 있습니다.</p>
          </div>
          {canEdit && (
            <Button asChild className="gap-2 bg-[#2f6ff5] hover:bg-[#2459cd]" type="button">
              <Link to={`/seller/vehicles/${detail.id}/edit`}>
                <PencilLine className="h-4 w-4" />
                차량 정보 수정
              </Link>
            </Button>
          )}
        </header>

        <SellerVehicleHeroSection
          imageSrc={photoUrls[0] ?? vehicleHeroImage}
          imageAlt={detail.title}
          badges={
            <>
              <Badge className="border-transparent bg-[#2f6ff5] text-white">입찰중</Badge>
              <Badge variant="outline" className="border-white/70 bg-white/90 text-slate-700 backdrop-blur">
                {detail.transaction_type === "DOMESTIC" ? "국내 거래" : "수출 가능"}
              </Badge>
            </>
          }
          panelTitle="입찰 진행 현황"
          panelDescription="현재 등록된 입찰과 남은 시간을 확인하고 상세 목록으로 이동합니다."
          panelContent={
            <>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">현재 최고 입찰가</span>
                  <span className="font-semibold text-[#2f6ff5]">{formatCurrency(detail.highest_bid ?? 0, detail.currency)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">입찰 건수</span>
                  <span className="font-semibold text-slate-900">{detail.bid_count}건</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">입찰 마감</span>
                  <span className="text-right font-semibold text-slate-900">
                    <span className="block">{formatDateTime(detail.bidding_ends_at)}</span>
                    <span className="mt-0.5 block text-xs font-semibold text-rose-500">D-{daysLeft}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">남은 기간</span>
                  <span className="font-semibold text-slate-900">{formatTimeLeft(liveTimeLeftSeconds)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-2 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                  <div className="h-full rounded-full bg-[#2f6ff5]" style={{ width: `${progressPercent}%` }} />
                </div>
                <p className="text-xs text-slate-500">입찰 마감 전까지</p>
              </div>
              <Button asChild className="w-full bg-[#2f6ff5] hover:bg-[#2459cd]">
                <Link to={`/seller/vehicles/${detail.id}/bids`}>입찰 현황 보기</Link>
              </Button>
            </>
          }
        />

        <SellerVehicleSpecsCard
          title="차량 기본 정보"
          description="차량의 기본 제원과 사양을 확인합니다."
          items={[
            { label: "제조사", value: detail.make },
            { label: "모델", value: detail.model },
            { label: "연식", value: `${detail.year}년식` },
            { label: "주행 거리", value: formatMileageLabel(detail.mileage_km) },
            { label: "연료", value: fuelLabel(detail.fuel_type) },
            { label: "변속기", value: transmissionLabel(detail.transmission) },
            { label: "거래 형태", value: detail.transaction_type === "DOMESTIC" ? "국내 거래" : "수출 가능" },
            { label: "차량 번호", value: detail.license_plate || "-" },
          ]}
        />

        <SellerVehiclePhotoOptionsCard
          title="차량 사진 및 옵션"
          photoUrls={photoUrls}
          photoNames={photoNames}
          remainingPhotoCount={remainingPhotoCount}
          moreHref={`/seller/vehicles/${detail.id}/images`}
          onOpenMore={() => {
            setActiveImageIndex(Math.min(5, Math.max(photoUrls.length - 1, 0)));
            setImageViewerOpen(true);
          }}
          onOpenPhoto={(index) => {
            setActiveImageIndex(index);
            setImageViewerOpen(true);
          }}
          options={detail.options}
        />

        <SellerVehicleStageProgressCard
          title="거래 진행 단계"
          steps={progressSteps.map((step) => ({ id: step.id, label: step.label, state: step.active ? "active" : "pending" }))}
        />

        <SellerVehicleTimelineCard title="최근 활동" rows={events} />

        {error && (
          <Alert variant="destructive">
            <AlertTitle>요청 실패</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </section>
      <SellerVehicleImageViewerDialog
        open={imageViewerOpen}
        onOpenChange={setImageViewerOpen}
        photoUrls={photoUrls}
        photoNames={photoNames}
        activeIndex={activeImageIndex}
        onActiveIndexChange={setActiveImageIndex}
      />
    </>
  );
}
