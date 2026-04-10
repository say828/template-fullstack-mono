import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../app/AuthContext";
import vehicleHeroImage from "../assets/seller/vehicle-hero.png";
import {
  SellerInspectionConfirmedModalContent,
  SellerInspectionInfoModalContent,
  SellerInspectionRescheduleModalContent,
  SellerInspectionRescheduleSubmittedModalContent,
} from "../components/seller/SellerInspectionModalContent";
import {
  SellerVehicleHeroSection,
  SellerVehicleImageViewerDialog,
  SellerVehiclePhotoOptionsCard,
  SellerVehicleSpecsCard,
  SellerVehicleStageProgressCard,
  SellerVehicleTimelineCard,
} from "../components/seller/SellerVehicleDetailSections";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import {
  getSellerTradeWorkflow,
  getSellerVehicleDetail,
  sellerApproveInspection,
  sellerRequestInspectionReschedule,
} from "../lib/api";
import { deriveSellerVehicleLifecycleState } from "../lib/sellerVehicleLifecycle";
import type { SellerVehicleDetail, TradeWorkflow } from "../lib/types";

type InspectionDetailRouteMode = "pending" | "completed";
type InspectionModalMode = "info" | "reschedule" | "rescheduleSubmitted" | "confirmed";
type InspectionLocationState = {
  flashMessage?: string;
  inspectionModal?: InspectionModalMode;
};

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

function formatDateTime(value?: string | null) {
  if (!value) return "-";
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
  const rows: Array<{ id: string; label: string; createdAt: string }> = (workflow?.events ?? []).map((event) => ({
    id: event.id,
    label: event.message,
    createdAt: event.created_at,
  }));
  const fallbackRows: Array<{ id: string; label: string; createdAt: string }> = [
    workflow?.inspection_confirmed_at
      ? { id: "inspection-confirmed", label: "검차 일정 확정", createdAt: workflow.inspection_confirmed_at }
      : undefined,
    workflow?.inspection_scheduled_at
      ? { id: "inspection-scheduled", label: "검차 일정 확인", createdAt: workflow.inspection_scheduled_at }
      : undefined,
    {
      id: "winner",
      label: workflow?.dealer_name ? `${workflow.dealer_name} 딜러가 낙찰자로 선정되었습니다.` : "낙찰 딜러가 확정되었습니다.",
      createdAt: workflow?.created_at ?? detail.bidding_ends_at,
    },
    { id: "created", label: "차량 등록 완료", createdAt: detail.created_at },
  ].filter((row): row is { id: string; label: string; createdAt: string } => Boolean(row));

  const merged = [...rows, ...fallbackRows].sort((left, right) => (String(left.createdAt) < String(right.createdAt) ? 1 : -1));

  const uniqueRows: Array<{ id: string; label: string; createdAt: string }> = [];
  for (const row of merged) {
    if (uniqueRows.some((existing) => existing.label === row.label && existing.createdAt === row.createdAt)) continue;
    uniqueRows.push(row);
    if (uniqueRows.length === 3) break;
  }
  return uniqueRows;
}

function nextModalOnClose(routeMode: InspectionDetailRouteMode): InspectionModalMode {
  return routeMode === "completed" ? "confirmed" : "info";
}

function inspectionDetailHref(vehicleId: string, routeMode: InspectionDetailRouteMode) {
  return `/seller/vehicles/${vehicleId}/detail/${routeMode === "completed" ? "inspection-completed" : "inspection-pending"}`;
}

function SellerInspectionDetailPage({ routeMode }: { routeMode: InspectionDetailRouteMode }) {
  const { token } = useAuth();
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = (location.state as InspectionLocationState | null) ?? null;

  const [detail, setDetail] = useState<SellerVehicleDetail | null>(null);
  const [workflow, setWorkflow] = useState<TradeWorkflow | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [inspectionDialogOpen, setInspectionDialogOpen] = useState(false);
  const [inspectionDialogMode, setInspectionDialogMode] = useState<InspectionModalMode>(nextModalOnClose(routeMode));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(locationState?.flashMessage ?? null);
  const [approvingInspection, setApprovingInspection] = useState(false);
  const [reschedulingInspection, setReschedulingInspection] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [preferredRegion, setPreferredRegion] = useState("");
  const [newReason, setNewReason] = useState("");

  const load = async () => {
    if (!token || !vehicleId) return;
    setLoading(true);
    setError(null);
    try {
      const [vehicle, flow] = await Promise.all([getSellerVehicleDetail(token, vehicleId), getSellerTradeWorkflow(token, vehicleId)]);
      setDetail(vehicle);
      setWorkflow(flow);
    } catch (err) {
      setError(err instanceof Error ? err.message : "검차 진행 현황 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [token, vehicleId]);

  useEffect(() => {
    if (!locationState?.flashMessage) return;
    setMessage(locationState.flashMessage);
  }, [locationState?.flashMessage]);

  const lifecycleState = detail ? deriveSellerVehicleLifecycleState(detail, workflow) : "STATUS_UNSET";
  const isConfirmedInspection = workflow?.inspection_status === "CONFIRMED";
  const photoUrls = detail?.photo_urls ?? [];
  const photoNames = detail?.photo_names ?? [];
  const remainingPhotoCount = Math.max(0, photoUrls.length - 5);
  const hasInspectionProposal = Boolean(
    workflow?.inspection_scheduled_at || workflow?.inspection_location || workflow?.inspection_assignee || workflow?.inspection_contact,
  );
  const highestBid = detail?.highest_bid ?? detail?.winning_price ?? 0;
  const events = detail
    ? timelineRows(detail, workflow).map((event) => ({
        id: event.id,
        label: event.label,
        timeLabel: formatDateTime(event.createdAt),
      }))
    : [];
  const progressSteps = useMemo(
    () => [
      { id: "bidding", label: "입찰 진행 중", state: "done" as const },
      { id: "closed", label: "입찰 마감", state: "done" as const },
      { id: "inspection", label: "검차 / 감가 협의", state: "active" as const },
      { id: "delivery", label: "인도 / 정산", state: "pending" as const },
      { id: "completed", label: "거래 완료", state: "pending" as const },
    ],
    [],
  );

  useEffect(() => {
    if (!hasInspectionProposal) return;
    const requestedModal = locationState?.inspectionModal;
    if (!requestedModal) return;
    if (routeMode === "completed") {
      setInspectionDialogMode("confirmed");
      setInspectionDialogOpen(true);
      return;
    }
    if (requestedModal === "reschedule") {
      setInspectionDialogMode("reschedule");
      setInspectionDialogOpen(true);
      return;
    }
    setInspectionDialogMode("info");
    setInspectionDialogOpen(true);
  }, [hasInspectionProposal, locationState?.inspectionModal, routeMode]);

  const openInspectionDialog = (mode: InspectionModalMode) => {
    if (!hasInspectionProposal) return;
    setInspectionDialogMode(mode);
    setInspectionDialogOpen(true);
  };

  const resetRescheduleForm = () => {
    setNewDate("");
    setNewTime("");
    setPreferredRegion("");
    setNewReason("");
  };

  const closeInspectionDialog = (open: boolean) => {
    setInspectionDialogOpen(open);
    if (open) return;
    setInspectionDialogMode(nextModalOnClose(routeMode));
  };

  const approveInspection = async () => {
    if (!token || !vehicleId) return;
    setApprovingInspection(true);
    setError(null);
    setMessage(null);
    try {
      await sellerApproveInspection(token, vehicleId);
      navigate(inspectionDetailHref(vehicleId, "completed"), {
        state: { flashMessage: "검차 일정이 확정되었습니다." } satisfies InspectionLocationState,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "검차 일정 승인 실패");
    } finally {
      setApprovingInspection(false);
    }
  };

  const submitInspectionReschedule = async () => {
    if (!token || !vehicleId) return;
    if (!newDate || !newTime || !preferredRegion.trim() || !newReason.trim()) {
      setError("희망 날짜, 시간대, 선호 검차 지역, 요청사항을 모두 입력해 주세요.");
      return;
    }

    const preferredAt = new Date(`${newDate}T${newTime}:00`);
    if (Number.isNaN(preferredAt.getTime())) {
      setError("희망 일정 형식이 올바르지 않습니다.");
      return;
    }

    setReschedulingInspection(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await sellerRequestInspectionReschedule(token, vehicleId, {
        preferred_at: preferredAt.toISOString(),
        reason: `[${preferredRegion.trim()}] ${newReason.trim()}`,
      });
      setWorkflow(updated);
      setInspectionDialogMode("rescheduleSubmitted");
      resetRescheduleForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "일정 재요청 실패");
    } finally {
      setReschedulingInspection(false);
    }
  };

  if (loading) {
    return (
      <section className="mx-auto max-w-5xl">
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">검차 진행 현황을 불러오는 중...</CardContent>
        </Card>
      </section>
    );
  }

  if (!detail || !workflow) {
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

  if (routeMode === "pending" && isConfirmedInspection) {
    return <Navigate replace state={location.state} to={inspectionDetailHref(detail.id, "completed")} />;
  }

  if (routeMode === "completed" && !isConfirmedInspection) {
    return <Navigate replace state={location.state} to={inspectionDetailHref(detail.id, "pending")} />;
  }

  if (lifecycleState !== "INSPECTION") {
    return (
      <section className="mx-auto max-w-5xl space-y-4">
        <header className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900">차량 상세 정보</h1>
          <p className="text-sm text-slate-500">현재 차량은 검차 진행 상태가 아닙니다.</p>
        </header>
        <Card>
          <CardContent className="space-y-3 pt-6">
            <p className="text-sm text-slate-700">검차 진행 현황 화면은 검차 단계 차량에서만 표시됩니다.</p>
            <Button asChild className="w-full bg-[#2f6ff5] hover:bg-[#2459cd] sm:w-auto">
              <Link to="/seller/vehicles">차량 목록으로 이동</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  const pageTitle = routeMode === "completed" ? "차량 상세 정보" : "차량 상세 정보";
  const pageSubtitle =
    routeMode === "completed"
      ? "확정된 검차 일정을 다시 확인하고 다음 검차 진행을 준비할 수 있습니다."
      : "딜러가 제안한 검차 일정을 확인하고 승인 또는 재요청할 수 있습니다.";
  const panelTitle = routeMode === "completed" ? "검차 일정 확정" : "검차 진행 현황";
  const dialogTitle =
    inspectionDialogMode === "reschedule" || inspectionDialogMode === "rescheduleSubmitted"
      ? "다른 검차 일정 요청"
      : routeMode === "completed"
        ? "검차 일정 확인"
        : "검차 일정 정보";

  return (
    <>
      <section className="mx-auto max-w-5xl space-y-5">
        <header className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900">{pageTitle}</h1>
          <p className="text-sm text-slate-500">{pageSubtitle}</p>
        </header>

        <SellerVehicleHeroSection
          imageSrc={photoUrls[0] ?? vehicleHeroImage}
          imageAlt={detail.title}
          sectionClassName="grid gap-4 lg:grid-cols-[minmax(0,1fr)_316px]"
          imageClassName="h-[248px] w-full object-cover object-center md:h-[248px]"
          badges={
            <>
              <Badge className="h-6 border-transparent bg-emerald-600 px-2.5 text-[11px] font-semibold text-white">검차</Badge>
              <Badge variant="outline" className="h-6 border-white/70 bg-white/90 px-2.5 text-[11px] font-semibold text-slate-700 backdrop-blur">
                {detail.transaction_type === "DOMESTIC" ? "국내 거래" : "수출 가능"}
              </Badge>
            </>
          }
          panelTitle={panelTitle}
          panelContent={
            <>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">현재 최고 입찰가</span>
                  <span className="font-semibold text-[#2f6ff5]">{formatCurrency(highestBid, detail.currency)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">선택된 딜러</span>
                  <span className="text-right font-semibold text-slate-900">{workflow.dealer_name || "-"}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">{routeMode === "completed" ? "확정된 검차 일정" : "검차 일정"}</span>
                  <span className="text-right font-semibold text-slate-900">{formatDateTime(workflow.inspection_scheduled_at)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">검차 장소</span>
                  <span className="text-right font-semibold text-slate-900">{workflow.inspection_location || "-"}</span>
                </div>
              </div>

              {hasInspectionProposal ? (
                <Button
                  className="w-full bg-[#2f6ff5] hover:bg-[#2459cd]"
                  onClick={() => openInspectionDialog(routeMode === "completed" ? "confirmed" : "info")}
                  type="button"
                >
                  검차 일정 확인
                </Button>
              ) : (
                <Button className="w-full" disabled type="button">
                  검차 일정 확인
                </Button>
              )}
            </>
          }
        />

        <div className="space-y-1 px-1">
          <p className="text-[28px] font-black tracking-[-0.03em] text-slate-950">{detail.title}</p>
          <p className="text-sm text-slate-500">
            {detail.year}년식 · {formatMileageLabel(detail.mileage_km)} · {fuelLabel(detail.fuel_type)} · {transmissionLabel(detail.transmission)}
          </p>
        </div>

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
          showMoreTile
          moreLabel="+더 보기"
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

        <SellerVehicleStageProgressCard title="거래 진행 단계" steps={progressSteps} />

        <SellerVehicleTimelineCard title="최근 활동" rows={events} />

        {message && (
          <Alert>
            <AlertTitle>처리 완료</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

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
      <Dialog open={inspectionDialogOpen} onOpenChange={closeInspectionDialog}>
        <DialogContent className="w-[calc(100vw-32px)] max-w-none overflow-y-auto rounded-[20px] border-0 bg-white p-0 shadow-[0_18px_60px_rgba(15,23,42,0.24)] max-h-[calc(100svh-56px)] sm:w-[480px] sm:max-h-[calc(100svh-72px)]">
          <DialogHeader className="border-b border-slate-100 px-7 pb-4 pt-6">
            <DialogTitle
              className={`font-black tracking-[-0.03em] text-slate-950 ${
                inspectionDialogMode === "reschedule" ? "text-[24px]" : "text-[30px]"
              }`}
            >
              {dialogTitle}
            </DialogTitle>
          </DialogHeader>
          {inspectionDialogMode === "reschedule" ? (
            <SellerInspectionRescheduleModalContent
              workflow={workflow}
              newDate={newDate}
              newTime={newTime}
              preferredRegion={preferredRegion}
              newReason={newReason}
              submitting={reschedulingInspection}
              onDateChange={setNewDate}
              onTimeChange={setNewTime}
              onRegionChange={setPreferredRegion}
              onReasonChange={setNewReason}
              onCancel={() => setInspectionDialogMode("info")}
              onSubmit={() => void submitInspectionReschedule()}
            />
          ) : inspectionDialogMode === "rescheduleSubmitted" ? (
            <SellerInspectionRescheduleSubmittedModalContent
              onConfirm={() => {
                setInspectionDialogOpen(false);
                setMessage("다른 검차 일정을 요청했습니다.");
              }}
            />
          ) : inspectionDialogMode === "confirmed" ? (
            <SellerInspectionConfirmedModalContent workflow={workflow} onConfirm={() => setInspectionDialogOpen(false)} />
          ) : (
            <SellerInspectionInfoModalContent
              workflow={workflow}
              onRequestReschedule={() => setInspectionDialogMode("reschedule")}
              approvePending={approvingInspection}
              onApprove={() => void approveInspection()}
            />
          )}
          {error ? (
            <div className="px-6 pb-6">
              <Alert variant="destructive">
                <AlertTitle>요청 실패</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function SellerInspectionPendingDetailPage() {
  return <SellerInspectionDetailPage routeMode="pending" />;
}

export function SellerInspectionCompletedDetailPage() {
  return <SellerInspectionDetailPage routeMode="completed" />;
}
