import { useEffect, useState } from "react";
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
import { deriveSellerVehicleLifecycleState, isSellerWinnerSelectionState } from "../lib/sellerVehicleLifecycle";
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

function timelineRows(detail: SellerVehicleDetail, workflow: TradeWorkflow | null) {
  const rows = workflow?.events?.map((event) => ({
    id: event.id,
    label: event.message,
    createdAt: event.created_at,
  }));
  if (rows && rows.length > 0) return rows.slice().reverse().slice(0, 8);

  return [
    { id: "created", label: "차량 등록 완료", createdAt: detail.created_at },
    { id: "closed", label: "입찰 마감 처리", createdAt: detail.bidding_ends_at },
  ];
}

export function SellerVehicleClosedDetailPage() {
  const { token } = useAuth();
  const { vehicleId } = useParams<{ vehicleId: string }>();

  const [detail, setDetail] = useState<SellerVehicleDetail | null>(null);
  const [workflow, setWorkflow] = useState<TradeWorkflow | null>(null);
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

  const photoUrls = detail?.photo_urls ?? [];
  const photoNames = detail?.photo_names ?? [];
  const remainingPhotoCount = Math.max(0, photoUrls.length - 5);
  const lifecycleState = detail ? deriveSellerVehicleLifecycleState(detail, workflow) : "STATUS_UNSET";
  const isClosed = lifecycleState !== "BIDDING";
  const closedAtLabel = detail ? formatDateTime(detail.bidding_ends_at) : "-";
  const highestBid = detail?.highest_bid ?? detail?.winning_price ?? 0;
  const events = detail
    ? timelineRows(detail, workflow).map((event) => ({
        id: event.id,
        label: event.label,
        timeLabel: formatDateTime(event.createdAt),
      }))
    : [];
  const canSelectWinner = isSellerWinnerSelectionState(lifecycleState);

  const progressSteps = [
    { id: "bidding", label: "입찰 진행 중", state: "done" as const },
    { id: "closed", label: "입찰 마감", state: "active" as const },
    { id: "depreciation", label: "감가 협의 / 검차", state: "pending" as const },
    { id: "delivery", label: "인도 / 정산", state: "pending" as const },
    { id: "completed", label: "거래 완료", state: "pending" as const },
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

  return (
    <>
      <section className="mx-auto max-w-5xl space-y-5">
        <header className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900">차량 상세 정보</h1>
          <p className="text-sm text-slate-500">입찰이 종료된 차량의 정보를 확인하고 낙찰할 딜러를 선택합니다.</p>
        </header>

        <SellerVehicleHeroSection
          imageSrc={photoUrls[0] ?? vehicleHeroImage}
          imageAlt={detail.title}
          badges={
            <>
              <Badge className="border-transparent bg-[#d94bd2] text-white">입찰 마감</Badge>
              <Badge variant="outline" className="border-white/70 bg-white/90 text-slate-700 backdrop-blur">
                입찰 이력
              </Badge>
            </>
          }
          panelTitle="입찰 진행 현황"
          panelDescription="입찰이 종료되면 현재 최고 입찰가와 선택 대상 정보를 확인할 수 있습니다."
          panelContent={
            <>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">현재 최고 입찰가</span>
                  <span className="font-semibold text-[#2f6ff5]">{formatCurrency(highestBid, detail.currency)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">입찰 건수</span>
                  <span className="font-semibold text-slate-900">{detail.bid_count}건</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">입찰 마감</span>
                  <span className="text-right font-semibold text-slate-900">
                    <span className="block">{closedAtLabel}</span>
                    <span className="mt-0.5 block text-xs font-semibold text-rose-500">{isClosed ? "마감 완료" : "마감 예정"}</span>
                  </span>
                </div>
              </div>

              <div className="rounded-2xl bg-rose-50 p-4 text-center text-sm leading-6 text-rose-600">
                <p className="font-semibold">{canSelectWinner ? "입찰이 마감되었습니다." : "마감 결과가 확정되었습니다."}</p>
                <p>{canSelectWinner ? "낙찰할 딜러를 선택해 주세요." : "현재 상태에 맞는 다음 화면으로 이동해 주세요."}</p>
              </div>

              <Button asChild className="w-full bg-[#2f6ff5] hover:bg-[#2459cd]" disabled={!canSelectWinner}>
                <Link to={`/seller/vehicles/${detail.id}/winner`}>입찰자 선택하기</Link>
              </Button>
            </>
          }
        />

        <SellerVehicleSpecsCard
          title="차량 기본 정보"
          description="차량 정보는 판매자가 등록한 기준 정보입니다."
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
          steps={progressSteps}
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
