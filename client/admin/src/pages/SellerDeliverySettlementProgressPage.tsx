import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useAuth } from "../app/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { getSellerTradeWorkflow, getSellerVehicleDetail, sellerConfirmDelivery } from "../lib/api";
import type { SellerVehicleDetail, TradeWorkflow } from "../lib/types";

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function SellerDeliverySettlementProgressPage() {
  const { token } = useAuth();
  const { vehicleId } = useParams<{ vehicleId: string }>();

  const [detail, setDetail] = useState<SellerVehicleDetail | null>(null);
  const [workflow, setWorkflow] = useState<TradeWorkflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const load = async () => {
    if (!token || !vehicleId) return;
    setLoading(true);
    setError(null);

    try {
      const [vehicle, flow] = await Promise.all([getSellerVehicleDetail(token, vehicleId), getSellerTradeWorkflow(token, vehicleId)]);
      setDetail(vehicle);
      setWorkflow(flow);
    } catch (err) {
      setError(err instanceof Error ? err.message : "인도/정산 진행 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [token, vehicleId]);

  const basePrice = workflow?.base_price ?? detail?.winning_price ?? detail?.reserve_price ?? 0;
  const depreciationTotal = useMemo(
    () => workflow?.depreciation_items.reduce((sum, item) => sum + item.amount, 0) ?? 0,
    [workflow?.depreciation_items],
  );
  const finalPrice = workflow?.agreed_price ?? Math.max(0, basePrice - depreciationTotal);

  const canConfirmDelivery = Boolean(
    workflow &&
      workflow.current_stage !== "CANCELLED" &&
      workflow.current_stage !== "COMPLETED" &&
      (workflow.delivery_status === "SCHEDULED" || workflow.delivery_status === "IN_PROGRESS") &&
      !workflow.delivery_confirmed_by_seller_at,
  );

  const confirmDelivery = async () => {
    if (!token || !vehicleId || !canConfirmDelivery) return;
    setConfirming(true);
    setError(null);
    try {
      const flow = await sellerConfirmDelivery(token, vehicleId);
      setWorkflow(flow);
      setMessage("판매자 인도 확인이 등록되었습니다. 양측 확인 완료 시 송금 단계로 전환됩니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "인도 확인 처리 실패");
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <section className="mx-auto max-w-4xl">
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">인도/정산 진행 정보를 불러오는 중...</CardContent>
        </Card>
      </section>
    );
  }

  if (!detail || !workflow) {
    return (
      <section className="mx-auto max-w-4xl space-y-3">
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

  const completed = workflow.current_stage === "COMPLETED";
  const cancelled = workflow.current_stage === "CANCELLED";

  return (
    <section className="mx-auto max-w-4xl space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>인도 / 정산 진행</CardTitle>
            {completed ? <Badge variant="secondary">거래 완료</Badge> : cancelled ? <Badge variant="destructive">강제 종료</Badge> : <Badge>진행 중</Badge>}
          </div>
          <CardDescription>
            {detail.title} / 감가 협의 완료 이후 인도 확인, 딜러 송금, 운영 정산 완료 순서로 상태가 전이됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">기준 금액</p>
                <p className="text-lg font-semibold">{basePrice.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">감가 소계</p>
                <p className="text-lg font-semibold text-destructive">-{depreciationTotal.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">정산 기준 금액</p>
                <p className="text-lg font-semibold">{finalPrice.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to={`/seller/vehicles/${detail.id}`}>차량 상세 보기</Link>
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowDetailDialog(true)}>
              인도/정산 상세
            </Button>
            {completed && (
              <Button asChild size="sm">
                <Link to="/seller/settlement">정산 내역으로 이동</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {workflow.depreciation_status !== "AGREED" && (
        <Alert>
          <AlertTitle>감가 협의 완료 전입니다.</AlertTitle>
          <AlertDescription>감가 승인 완료 후 인도/정산 단계가 활성화됩니다.</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">진행 체크리스트</CardTitle>
          <CardDescription>거래는 인도 확인, 송금 확인, 정산 완료 순서로 자동 전이됩니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 rounded-md border border-border/80 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm">1. 인도 일정 등록</p>
              <Badge variant={workflow.delivery_status === "WAITING_SCHEDULE" ? "outline" : "secondary"}>
                {workflow.delivery_status === "WAITING_SCHEDULE" ? "대기" : "완료"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {workflow.delivery_scheduled_at
                ? `${new Date(workflow.delivery_scheduled_at).toLocaleString()} / ${workflow.delivery_location || "-"}`
                : "딜러 인도 일정 등록 대기"}
            </p>
          </div>

          <div className="space-y-2 rounded-md border border-border/80 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm">2. 판매자 인도 확인</p>
              <Badge variant={workflow.delivery_confirmed_by_seller_at ? "secondary" : "outline"}>
                {workflow.delivery_confirmed_by_seller_at ? "완료" : "대기"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {workflow.delivery_confirmed_by_seller_at
                ? `확인 시각: ${new Date(workflow.delivery_confirmed_by_seller_at).toLocaleString()}`
                : "인도 일정 등록 후 확인 가능합니다."}
            </p>
            <Button type="button" size="sm" variant="outline" disabled={!canConfirmDelivery || confirming} onClick={() => void confirmDelivery()}>
              {workflow.delivery_confirmed_by_seller_at ? "인도 확인 완료" : "인도 확인"}
            </Button>
          </div>

          <div className="space-y-2 rounded-md border border-border/80 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm">3. 딜러 인도 확인</p>
              <Badge variant={workflow.delivery_confirmed_by_dealer_at ? "secondary" : "outline"}>
                {workflow.delivery_confirmed_by_dealer_at ? "완료" : "대기"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {workflow.delivery_confirmed_by_dealer_at
                ? `확인 시각: ${new Date(workflow.delivery_confirmed_by_dealer_at).toLocaleString()}`
                : "딜러 확인 대기"}
            </p>
          </div>

          <div className="space-y-2 rounded-md border border-border/80 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm">4. 딜러 송금 등록</p>
              <Badge variant={workflow.remittance_status === "SUBMITTED" || workflow.remittance_status === "CONFIRMED" ? "secondary" : "outline"}>
                {workflow.remittance_status === "WAITING" ? "대기" : "완료"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {workflow.remittance_submitted_at
                ? `${new Date(workflow.remittance_submitted_at).toLocaleString()} / ${workflow.remittance_amount?.toLocaleString() || 0} ${
                    workflow.currency
                  }`
                : "송금 등록 대기"}
            </p>
          </div>

          <div className="space-y-2 rounded-md border border-border/80 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm">5. 운영 정산 완료</p>
              <Badge variant={workflow.settlement_status === "COMPLETED" ? "secondary" : "outline"}>
                {workflow.settlement_status === "COMPLETED" ? "완료" : "대기"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {workflow.settlement_completed_at
                ? `${new Date(workflow.settlement_completed_at).toLocaleString()} / ${workflow.settlement_amount?.toLocaleString() || 0} ${
                    workflow.currency
                  }`
                : "정산 완료 대기"}
            </p>
          </div>
        </CardContent>
      </Card>

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

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>인도/정산 상세</DialogTitle>
            <DialogDescription>거래 완료 시 인도/정산 증빙 정보를 다운로드할 수 있습니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p>인도 일자: {workflow.delivery_scheduled_at ? new Date(workflow.delivery_scheduled_at).toLocaleString() : "-"}</p>
            <p>인도 방식: {workflow.delivery_method || "-"}</p>
            <p>인도 장소: {workflow.delivery_location || "-"}</p>
            <p>송금 식별자: {workflow.remittance_reference || "-"}</p>
            <p>정산 금액: {(workflow.settlement_amount ?? finalPrice).toLocaleString()} {workflow.currency}</p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!completed}
                onClick={() =>
                  downloadTextFile(
                    `${detail.id}_delivery_confirmation.txt`,
                    `인도 확인서\n차량ID: ${detail.id}\n차량명: ${detail.title}\n인도일시: ${
                      workflow.delivery_completed_at || "-"
                    }\n인도장소: ${workflow.delivery_location || "-"}`,
                  )
                }
              >
                인도 확인서 다운로드
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!completed}
                onClick={() =>
                  downloadTextFile(
                    `${detail.id}_settlement_proof.txt`,
                    `정산 증빙서\n차량ID: ${detail.id}\n정산금액: ${workflow.settlement_amount ?? finalPrice}\n정산완료시각: ${
                      workflow.settlement_completed_at || "-"
                    }`,
                  )
                }
              >
                정산 증빙 다운로드
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
