import { CarFront, Clock3, Image as ImageIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useAuth } from "../app/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { closeSellerBidding, getSellerTradeWorkflow, getSellerVehicleDetail } from "../lib/api";
import type { SellerVehicleDetail, TradeWorkflow } from "../lib/types";

function statusBadge(status: SellerVehicleDetail["status"]) {
  if (status === "ACTIVE") return <Badge>입찰중</Badge>;
  if (status === "SOLD") return <Badge variant="secondary">낙찰 완료</Badge>;
  return <Badge variant="outline">경매 종료</Badge>;
}

function tradeStageBadge(workflow: TradeWorkflow | null) {
  if (!workflow) return <Badge variant="outline">거래 시작 전</Badge>;
  if (workflow.current_stage === "INSPECTION") return <Badge variant="outline">검차 일정</Badge>;
  if (workflow.current_stage === "DEPRECIATION") return <Badge>감가 협의</Badge>;
  if (workflow.current_stage === "DELIVERY") return <Badge>인도 진행</Badge>;
  if (workflow.current_stage === "REMITTANCE") return <Badge>송금 확인</Badge>;
  if (workflow.current_stage === "SETTLEMENT") return <Badge>정산 대기</Badge>;
  if (workflow.current_stage === "COMPLETED") return <Badge variant="secondary">거래 완료</Badge>;
  return <Badge variant="destructive">강제 종료</Badge>;
}

function formatCurrency(value: number, currency: string) {
  return currency === "KRW" ? `${value.toLocaleString()}원` : `${value.toLocaleString()} ${currency}`;
}

function formatTimeLeft(seconds: number) {
  const safe = Math.max(0, seconds);
  const days = Math.floor(safe / 86400);
  const hours = Math.floor((safe % 86400) / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  if (safe === 0) return "마감";
  return `${days}일 ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);

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

  const closeBidding = async (forceClose = false) => {
    if (!token || !vehicleId) return;
    setClosing(true);
    setError(null);
    try {
      await closeSellerBidding(token, vehicleId, forceClose);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "입찰 마감 실패");
    } finally {
      setClosing(false);
    }
  };

  const primaryAction = useMemo(() => {
    if (!detail) return null;
    if (detail.status === "ACTIVE") {
      return (
        <div className="grid gap-2">
          <Button asChild className="w-full bg-[#2f6ff5] hover:bg-[#2459cd]">
            <Link to={`/seller/vehicles/${detail.id}/bids`}>입찰 현황 보기</Link>
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button disabled={closing} onClick={() => void closeBidding(false)} type="button" variant="outline">
              마감 처리
            </Button>
            <Button disabled={closing} onClick={() => void closeBidding(true)} type="button" variant="secondary">
              강제 마감
            </Button>
          </div>
        </div>
      );
    }

    if (detail.status === "CANCELLED") {
      return (
        <Button asChild className="w-full" type="button" variant="outline">
          <Link to="/seller/vehicles">내 차량 목록으로 이동</Link>
        </Button>
      );
    }

    if (!workflow) {
      return (
        <Button asChild className="w-full bg-[#2f6ff5] hover:bg-[#2459cd]">
          <Link to={`/seller/vehicles/${detail.id}/winner`}>낙찰 딜러 선택</Link>
        </Button>
      );
    }

    if (workflow.current_stage === "INSPECTION") {
      return (
        <Button asChild className="w-full bg-[#2f6ff5] hover:bg-[#2459cd]">
          <Link to={`/seller/vehicles/${detail.id}/inspection`}>검차 일정 확인</Link>
        </Button>
      );
    }

    if (workflow.current_stage === "DEPRECIATION") {
      return (
        <Button asChild className="w-full bg-[#2f6ff5] hover:bg-[#2459cd]">
          <Link to={`/seller/vehicles/${detail.id}/depreciation`}>감가 협의 진행</Link>
        </Button>
      );
    }

    if (workflow.current_stage === "DELIVERY" || workflow.current_stage === "REMITTANCE" || workflow.current_stage === "SETTLEMENT") {
      return (
        <Button asChild className="w-full bg-[#2f6ff5] hover:bg-[#2459cd]">
          <Link to={`/seller/vehicles/${detail.id}/delivery-settlement-progress`}>인도 / 정산 진행</Link>
        </Button>
      );
    }

    return (
      <div className="grid gap-2">
        <Button asChild className="w-full bg-[#2f6ff5] hover:bg-[#2459cd]">
          <Link to="/seller/settlement">거래 정산 내역</Link>
        </Button>
        <Button asChild className="w-full" type="button" variant="outline">
          <Link to={`/seller/vehicles/${detail.id}/delivery-settlement-progress`}>거래 상세 보기</Link>
        </Button>
      </div>
    );
  }, [closing, detail, workflow]);

  const priceSummary = useMemo(() => {
    const basePrice = workflow?.agreed_price ?? detail?.winning_price ?? detail?.highest_bid ?? detail?.reserve_price ?? 0;
    const depreciationTotal = workflow?.depreciation_total ?? 0;
    return {
      basePrice,
      depreciationTotal,
      settlementAmount: workflow?.settlement_amount ?? Math.max(0, basePrice - depreciationTotal),
    };
  }, [detail, workflow]);

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

  const events = timelineRows(detail, workflow);

  return (
    <section className="mx-auto max-w-5xl space-y-4">
      <header className="space-y-1">
        <h1 className="text-3xl font-black text-slate-900">차량 상세 정보</h1>
        <p className="text-sm text-slate-500">판매자 경매 진행 상태와 후속 거래 단계를 실제 API 기준으로 확인합니다.</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_360px]">
        <Card className="border-slate-200">
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {statusBadge(detail.status)}
              {tradeStageBadge(workflow)}
              <Badge variant="outline">{detail.transaction_type === "DOMESTIC" ? "국내 거래" : "수출 가능"}</Badge>
            </div>
            <CardTitle className="text-2xl">{detail.title}</CardTitle>
            <CardDescription>
              {detail.year}년식 · {detail.mileage_km.toLocaleString()} km · {detail.fuel_type} · 차량번호 {detail.license_plate || "-"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex h-56 items-center justify-center rounded-xl border border-slate-200 bg-gradient-to-br from-slate-100 to-slate-200">
              <CarFront className="h-20 w-20 text-slate-500" />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-slate-200 p-3 text-sm">
                <p className="text-slate-500">현재 최고 입찰가</p>
                <p className="mt-1 text-lg font-semibold text-[#2f6ff5]">{formatCurrency(detail.highest_bid ?? 0, detail.currency)}</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 text-sm">
                <p className="text-slate-500">입찰 마감까지</p>
                <p className="mt-1 inline-flex items-center gap-1 text-lg font-semibold text-slate-900">
                  <Clock3 className="h-4 w-4" />
                  {formatTimeLeft(detail.time_left_seconds)}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 text-sm">
                <p className="text-slate-500">입찰 건수</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{detail.bid_count}건</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3 text-sm">
                <p className="text-slate-500">희망가</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(detail.reserve_price, detail.currency)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">경매 / 거래 액션</CardTitle>
            <CardDescription>현재 상태에서 진행 가능한 다음 단계를 바로 실행합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {primaryAction}
            <div className="space-y-2 rounded-lg border border-slate-200 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">기준 금액</span>
                <span className="font-semibold text-slate-900">{formatCurrency(priceSummary.basePrice, detail.currency)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">감가 총액</span>
                <span className="font-semibold text-rose-500">-{formatCurrency(priceSummary.depreciationTotal, detail.currency)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">정산 기준 금액</span>
                <span className="font-semibold text-slate-900">{formatCurrency(priceSummary.settlementAmount, detail.currency)}</span>
              </div>
            </div>
            <div className="grid gap-2">
              <Button asChild type="button" variant="outline">
                <Link to={`/seller/vehicles/${detail.id}/bids`}>입찰 현황</Link>
              </Button>
              <Button asChild type="button" variant="outline">
                <Link to="/seller/vehicles">목록으로 이동</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">차량 사진</CardTitle>
          <CardDescription>seller 이미지 보기 프로덕션 라우트로 연결됩니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Link
                key={index}
                to={`/seller/vehicles/${detail.id}/images?index=${index}`}
                className="overflow-hidden rounded-lg border border-slate-200"
              >
                <div className="flex aspect-[4/3] items-center justify-center bg-slate-100 text-slate-500">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <p className="px-3 py-2 text-xs text-slate-600">이미지 슬롯 {index + 1}</p>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">거래 상태</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-2">
            <p className="text-slate-500">
              제조사 <span className="ml-2 font-semibold text-slate-900">{detail.make}</span>
            </p>
            <p className="text-slate-500">
              모델 <span className="ml-2 font-semibold text-slate-900">{detail.model}</span>
            </p>
            <p className="text-slate-500">
              낙찰 딜러 <span className="ml-2 font-semibold text-slate-900">{detail.winning_dealer_id ?? "-"}</span>
            </p>
            <p className="text-slate-500">
              낙찰가 <span className="ml-2 font-semibold text-slate-900">{detail.winning_price ? formatCurrency(detail.winning_price, detail.currency) : "-"}</span>
            </p>
            <p className="text-slate-500">
              검차 상태 <span className="ml-2 font-semibold text-slate-900">{workflow?.inspection_status ?? "-"}</span>
            </p>
            <p className="text-slate-500">
              감가 상태 <span className="ml-2 font-semibold text-slate-900">{workflow?.depreciation_status ?? "-"}</span>
            </p>
            <p className="text-slate-500">
              인도 상태 <span className="ml-2 font-semibold text-slate-900">{workflow?.delivery_status ?? "-"}</span>
            </p>
            <p className="text-slate-500">
              정산 상태 <span className="ml-2 font-semibold text-slate-900">{workflow?.settlement_status ?? "-"}</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg">최근 활동</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {events.map((event) => (
              <div key={event.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                <p className="font-medium text-slate-900">{event.label}</p>
                <p className="text-xs text-slate-500">{new Date(event.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>요청 실패</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </section>
  );
}
