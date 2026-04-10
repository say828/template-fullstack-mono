import { BadgeCheck, Bell, CheckCircle2, FileCheck2, Info, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useAuth } from "../app/AuthContext";
import vehicleHeroImage from "../assets/seller/vehicle-hero.png";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { closeSellerBidding, getSellerTradeWorkflow, getSellerVehicleDetail, listSellerVehicleBids } from "../lib/api";
import { deriveSellerVehicleLifecycleState, isSellerWinnerSelectionState } from "../lib/sellerVehicleLifecycle";
import type { SellerVehicleBid, SellerVehicleDetail, TradeWorkflow } from "../lib/types";
import { cn } from "../lib/utils";

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

function countryLabel(row: SellerVehicleBid) {
  const raw = row.dealer_country?.trim();
  if (!raw || raw === "KR") return "대한민국";
  if (raw === "US") return "미국";
  if (raw === "JP") return "일본";
  if (raw === "HK") return "홍콩";
  return raw;
}

function dealerVerificationLabels(row: SellerVehicleBid) {
  const business = row.dealer_business_number ? "사업자 등록" : "사업자 미등록";
  const document = row.dealer_status === "APPROVED" ? "서류 인증" : "서류 확인 필요";
  return { business, document, hasBusiness: Boolean(row.dealer_business_number), isDocumentVerified: row.dealer_status === "APPROVED" };
}

interface TagBadgeProps {
  label: string;
  tone: "neutral" | "success" | "warning";
  icon: React.ReactNode;
}

function TagBadge({ label, tone, icon }: TagBadgeProps) {
  const styles =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <Badge variant="outline" className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 ${styles}`}>
      <span className="flex items-center">{icon}</span>
      <span>{label}</span>
    </Badge>
  );
}

interface SellerVehicleBidCardProps {
  row: SellerVehicleBid;
  isHighest: boolean;
  isSelected: boolean;
  currency: string;
  disabled?: boolean;
  onSelect: (dealerId: string) => void;
}

function SellerVehicleBidCard({ row, isHighest, isSelected, currency, disabled, onSelect }: SellerVehicleBidCardProps) {
  const { business, document, hasBusiness, isDocumentVerified } = dealerVerificationLabels(row);

  return (
    <Card
      className={cn(
        "overflow-hidden border-slate-200 shadow-sm transition",
        isSelected && "border-[#2f6ff5] bg-[#f3f7ff]",
        isHighest && !isSelected && "border-[#4b67ff] bg-white",
      )}
    >
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex items-center gap-2">
              {isHighest ? (
                <Badge className="h-6 rounded-full border-transparent bg-[#4b67ff] px-3 py-0 text-[11px] font-bold tracking-[0.02em] text-white">
                  HIGHEST
                </Badge>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-semibold text-slate-900">{row.dealer_name}</span>
              <Badge variant="outline" className="border-[#d7dcff] bg-[#edf2ff] text-[#4b67ff]">
                {countryLabel(row)}
              </Badge>
            </div>

            <p className="text-sm text-slate-500">누적 거래 {row.dealer_completed_trade_count ?? 0}건</p>

            <div className="flex flex-wrap gap-2">
              <TagBadge
                label={business}
                tone={hasBusiness ? "neutral" : "warning"}
                icon={hasBusiness ? <BadgeCheck className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
              />
              <TagBadge
                label={document}
                tone={isDocumentVerified ? "success" : "warning"}
                icon={isDocumentVerified ? <FileCheck2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
              />
            </div>
          </div>

          <div className="flex flex-col items-stretch gap-3 lg:w-[188px] lg:items-end">
            <div className="text-right">
              <p className="text-xs text-slate-500">입찰가</p>
              <p className="text-2xl font-extrabold text-[#2f6ff5]">{formatCurrency(row.amount, currency)}</p>
              <p className="mt-1 text-xs text-slate-400">입찰 {formatDateTime(row.updated_at)}</p>
            </div>

            <Button
              className={cn(
                "h-10 w-full rounded-lg border text-sm font-semibold lg:w-[120px]",
                isSelected
                  ? "border-transparent bg-black text-white hover:bg-black"
                  : "border-[#7ea5ff] bg-white text-[#2f6ff5] hover:bg-[#eef4ff]",
              )}
              disabled={disabled}
              onClick={() => onSelect(row.dealer_id)}
              type="button"
              variant={isSelected ? "default" : "outline"}
            >
              {isSelected ? "선택됨" : "이 딜러 선택"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatTimeLeft(seconds: number) {
  const safe = Math.max(0, seconds);
  const hours = Math.floor(safe / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((safe % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const remain = Math.floor(safe % 60)
    .toString()
    .padStart(2, "0");
  return `${hours}:${minutes}:${remain}`;
}

export function SellerVehicleWinnerSelectPage() {
  const { token } = useAuth();
  const { vehicleId } = useParams<{ vehicleId: string }>();

  const [detail, setDetail] = useState<SellerVehicleDetail | null>(null);
  const [rows, setRows] = useState<SellerVehicleBid[]>([]);
  const [workflow, setWorkflow] = useState<TradeWorkflow | null>(null);
  const [selectedDealerId, setSelectedDealerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const load = async (options?: { preserveSuccessMessage?: boolean }) => {
    if (!token || !vehicleId) return;
    setLoading(true);
    setError(null);
    if (!options?.preserveSuccessMessage) setSuccessMessage(null);
    try {
      const [vehicle, bids, flow] = await Promise.all([
        getSellerVehicleDetail(token, vehicleId),
        listSellerVehicleBids(token, vehicleId),
        getSellerTradeWorkflow(token, vehicleId).catch(() => null),
      ]);
      setDetail(vehicle);
      setRows(bids);
      setWorkflow(flow);
      setSelectedDealerId((current) => {
        if (current && bids.some((bid) => bid.dealer_id === current)) return current;
        if (flow?.dealer_id) return flow.dealer_id;
        return vehicle.winning_dealer_id ?? null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "입찰자 선택 데이터 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [token, vehicleId]);

  const sortedRows = useMemo(() => [...rows].sort((left, right) => right.amount - left.amount), [rows]);
  const topBid = sortedRows[0] ?? null;
  const selectedBid = useMemo(
    () => sortedRows.find((row) => row.dealer_id === selectedDealerId) ?? null,
    [selectedDealerId, sortedRows],
  );
  const highestBidAmount = topBid?.amount ?? detail?.highest_bid ?? 0;
  const lifecycleState = detail ? deriveSellerVehicleLifecycleState(detail, workflow) : "STATUS_UNSET";
  const selectionOpen = isSellerWinnerSelectionState(lifecycleState);
  const isFinalized = !selectionOpen && lifecycleState !== "STATUS_UNSET";
  const canConfirm = Boolean(selectedBid && detail && !submitting && selectionOpen && !isFinalized);

  const confirmWinner = async () => {
    if (!token || !vehicleId || !selectedBid) return;
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const result = await closeSellerBidding(token, vehicleId, false, selectedBid.id);
      setSuccessMessage(result.message);
      await load({ preserveSuccessMessage: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "낙찰 확정 실패");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className="mx-auto max-w-5xl">
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">입찰자 선택 데이터를 불러오는 중...</CardContent>
        </Card>
      </section>
    );
  }

  if (!detail) {
    return (
      <section className="mx-auto max-w-5xl space-y-3">
        <Card>
          <CardContent className="space-y-3 pt-6">
            <p className="text-sm">차량 정보를 찾을 수 없습니다.</p>
            <Button asChild variant="outline" size="sm">
              <Link to="/seller/vehicles">내 차량으로 이동</Link>
            </Button>
          </CardContent>
        </Card>
        {error && (
          <Alert variant="destructive">
            <Bell className="h-4 w-4" />
            <AlertTitle>조회 실패</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl space-y-5">
      <header className="space-y-1">
        <h1 className="text-3xl font-black text-slate-900">입찰자 선택</h1>
        <p className="text-sm text-slate-500">입찰에 참여한 딜러의 정보를 확인하고 낙찰할 딜러를 선택해 주세요.</p>
      </header>

      {!selectionOpen && !isFinalized ? (
        <Alert>
          <AlertTitle>입찰 마감 대기</AlertTitle>
          <AlertDescription>
            이 차량은 아직 입찰이 마감되지 않아 낙찰자를 선택할 수 없습니다. 입찰 현황 화면에서 마감 시점을 먼저 확인해 주세요.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="overflow-hidden rounded-3xl border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
        <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:p-5">
          <div className="relative aspect-[14/9] w-full overflow-hidden rounded-2xl bg-slate-100 lg:w-[140px] lg:shrink-0">
            <img alt={detail.title} className="h-full w-full object-cover object-center" src={detail.photo_urls?.[0] ?? vehicleHeroImage} />
            <Badge className="absolute left-3 top-3 border-transparent bg-[#d92d8a] text-white">입찰 마감</Badge>
          </div>

          <div className="min-w-0 space-y-3">
            <div className="space-y-1">
              <p className="text-[28px] font-black leading-none tracking-[-0.03em] text-slate-950">{detail.title}</p>
              <p className="text-sm text-slate-500">
                {detail.year}년식 · {formatMileageLabel(detail.mileage_km)} · {fuelLabel(detail.fuel_type)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              <div className="flex items-baseline gap-2">
                <span className="text-slate-400">현재 최고 입찰가</span>
                <span className="font-extrabold text-[#4b67ff]">{formatCurrency(highestBidAmount, detail.currency)}</span>
              </div>
              <div className="h-4 w-px bg-slate-200" />
              <div className="flex items-baseline gap-2">
                <span className="text-slate-400">입찰 수</span>
                <span className="font-bold text-slate-900">{sortedRows.length}건</span>
              </div>
            </div>
          </div>

          <div className="flex lg:ml-auto lg:justify-end">
            <Button asChild className="h-11 w-full rounded-xl bg-[#2f6ff5] px-6 text-sm font-semibold hover:bg-[#2459cd]" type="button">
              <Link to={`/seller/vehicles/${detail.id}/detail/closed`}>차량 상세 보기</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_330px]">
        <div className="space-y-3">
          <div className="flex items-end gap-4">
            <h2 className="shrink-0 text-[28px] font-black tracking-[-0.03em] text-slate-950">입찰자 목록</h2>
            <p className="text-sm text-slate-500">
              낙찰할 딜러를 선택하면 우측 요약 패널에 반영됩니다.
            </p>
          </div>

          <div className="space-y-3">
            {sortedRows.map((row, index) => (
              <SellerVehicleBidCard
                key={row.id}
                row={row}
                isHighest={index === 0}
                isSelected={row.dealer_id === selectedDealerId}
                currency={detail.currency}
                disabled={!selectionOpen || isFinalized}
                onSelect={(dealerId) => {
                  if (selectionOpen && !isFinalized) setSelectedDealerId(dealerId);
                }}
              />
            ))}

            {sortedRows.length === 0 ? (
              <Card className="border-dashed border-slate-200">
                <CardContent className="py-10 text-center text-sm text-slate-500">입찰 내역이 없습니다.</CardContent>
              </Card>
            ) : null}
          </div>
        </div>

        <div className="space-y-3">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="space-y-4 p-5">
              <h3 className="text-lg font-black text-slate-950">선택 정보 요약</h3>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">현재 최고 입찰가</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(highestBidAmount, detail.currency)}</span>
                </div>
                <div className="border-b border-slate-200 pb-3" />
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">선택된 딜러</span>
                  <span className="font-semibold text-[#2f6ff5]">{selectedBid?.dealer_name ?? "-"}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">최종 낙찰가</span>
                  <span className="font-semibold text-[#2f6ff5]">{selectedBid ? formatCurrency(selectedBid.amount, detail.currency) : "-"}</span>
                </div>
              </div>

              <Button
                className="h-12 w-full rounded-xl bg-[#2f6ff5] text-sm font-semibold hover:bg-[#2459cd]"
                disabled={!canConfirm}
                onClick={() => void confirmWinner()}
                type="button"
              >
                선택 완료하기
              </Button>

              <p className="text-center text-xs text-slate-400">선택 완료 후에는 변경할 수 없습니다.</p>
            </CardContent>
          </Card>

          <div className="flex items-start gap-3 rounded-2xl border border-[#9dc0ff] bg-[#f7fbff] p-4 text-left text-[13px] leading-6 text-slate-500">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#8aa8e8]" />
            <div className="space-y-1">
              <p>딜러를 선택하면 해당 딜러에게 낙찰 알림이 전달되며, 낙찰 후 다음 거래 단계가 이어집니다.</p>
              <p>선택 완료 이후에는 검차, 감가 협의, 인도, 정산 단계로 이어집니다.</p>
            </div>
          </div>
        </div>
      </div>

      {successMessage && (
        <Alert className="border-emerald-200 bg-emerald-50">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <AlertTitle>완료</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <Bell className="h-4 w-4" />
          <AlertTitle>조회 실패</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </section>
  );
}
