import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useAuth } from "../app/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  adminCompleteInspection,
  adminCompleteSettlement,
  adminConfirmRemittance,
  adminForceCancelTrade,
  adminProposeInspection,
  getAdminVehicleBids,
  getAdminTradeWorkflow,
} from "../lib/api";
import type { AdminVehicleBidDetail, TradeWorkflow } from "../lib/types";

function stageBadge(stage: TradeWorkflow["current_stage"]) {
  if (stage === "INSPECTION") return <Badge variant="outline">검차</Badge>;
  if (stage === "DEPRECIATION") return <Badge>감가협의</Badge>;
  if (stage === "DELIVERY") return <Badge>인도</Badge>;
  if (stage === "REMITTANCE") return <Badge>송금</Badge>;
  if (stage === "SETTLEMENT") return <Badge>정산</Badge>;
  if (stage === "COMPLETED") return <Badge variant="secondary">거래완료</Badge>;
  return <Badge variant="destructive">강제종료</Badge>;
}

export function AdminTradeOperationPage() {
  const { token } = useAuth();
  const { vehicleId } = useParams<{ vehicleId: string }>();

  const [workflow, setWorkflow] = useState<TradeWorkflow | null>(null);
  const [bidDetail, setBidDetail] = useState<AdminVehicleBidDetail | null>(null);
  const [bidLoading, setBidLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [inspectionDate, setInspectionDate] = useState("");
  const [inspectionTime, setInspectionTime] = useState("10:00");
  const [inspectionLocation, setInspectionLocation] = useState("");
  const [inspectionAssignee, setInspectionAssignee] = useState("");
  const [inspectionContact, setInspectionContact] = useState("");

  const [inspectionReportUrl, setInspectionReportUrl] = useState("");
  const [inspectionSummary, setInspectionSummary] = useState("");

  const [settlementAmount, setSettlementAmount] = useState("");
  const [forceCancelReason, setForceCancelReason] = useState("");

  const load = async () => {
    if (!token || !vehicleId) return;
    setLoading(true);
    setBidLoading(true);
    setError(null);
    try {
      const [flow, bidData] = await Promise.all([getAdminTradeWorkflow(token, vehicleId), getAdminVehicleBids(token, vehicleId)]);
      setWorkflow(flow);
      setBidDetail(bidData);
      if (!settlementAmount) {
        const fallback = flow.agreed_price ?? flow.base_price;
        setSettlementAmount(String(Math.round(fallback)));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "거래 운영 데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
      setBidLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, vehicleId]);

  const canProposeInspection =
    workflow?.current_stage === "INSPECTION" &&
    (workflow.inspection_status === "PROPOSED" || workflow.inspection_status === "RESCHEDULE_REQUESTED");
  const canCompleteInspection = workflow?.current_stage === "INSPECTION" && workflow.inspection_status === "CONFIRMED";
  const canConfirmRemittance = workflow?.current_stage === "REMITTANCE" && workflow.remittance_status === "SUBMITTED";
  const canCompleteSettlement = workflow?.current_stage === "SETTLEMENT" && workflow.settlement_status === "WAITING";
  const canForceCancel = workflow?.current_stage !== "COMPLETED" && workflow?.current_stage !== "CANCELLED";

  const eventSummary = useMemo(() => [...(workflow?.events ?? [])].reverse().slice(0, 20), [workflow?.events]);

  const submitInspectionProposal = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token || !vehicleId || !canProposeInspection) return;

    if (!inspectionDate || !inspectionTime || !inspectionLocation.trim() || !inspectionAssignee.trim() || !inspectionContact.trim()) {
      setError("검차 일정/장소/담당자/연락처를 모두 입력해 주세요.");
      return;
    }

    const scheduledAt = new Date(`${inspectionDate}T${inspectionTime}:00`);
    if (Number.isNaN(scheduledAt.getTime())) {
      setError("유효한 검차 일정이 아닙니다.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const flow = await adminProposeInspection(token, vehicleId, {
        scheduled_at: scheduledAt.toISOString(),
        location: inspectionLocation.trim(),
        assignee: inspectionAssignee.trim(),
        contact: inspectionContact.trim(),
      });
      setWorkflow(flow);
      setMessage("검차 일정 제안이 등록되었습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "검차 일정 제안에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitInspectionCompletion = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token || !vehicleId || !canCompleteInspection) return;
    if (!inspectionReportUrl.trim()) {
      setError("검차 리포트 URL을 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const flow = await adminCompleteInspection(token, vehicleId, {
        report_url: inspectionReportUrl.trim(),
        summary: inspectionSummary.trim() || undefined,
      });
      setWorkflow(flow);
      setMessage("검차 완료가 확정되었습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "검차 완료 처리에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmRemittance = async () => {
    if (!token || !vehicleId || !canConfirmRemittance) return;
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const flow = await adminConfirmRemittance(token, vehicleId);
      setWorkflow(flow);
      setMessage("딜러 송금 확인이 완료되었습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "송금 확인에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitSettlement = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token || !vehicleId || !canCompleteSettlement) return;
    const amount = Number(settlementAmount.replace(/[^0-9]/g, ""));
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("정산 금액을 올바르게 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const flow = await adminCompleteSettlement(token, vehicleId, { settlement_amount: Math.round(amount) });
      setWorkflow(flow);
      setMessage("정산 완료가 확정되었습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "정산 완료 처리에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitForceCancel = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token || !vehicleId || !canForceCancel) return;
    if (forceCancelReason.trim().length < 3) {
      setError("강제종료 사유를 3자 이상 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const flow = await adminForceCancelTrade(token, vehicleId, { reason: forceCancelReason.trim() });
      setWorkflow(flow);
      setMessage("거래가 강제종료 처리되었습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "강제종료 처리에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className="mx-auto max-w-5xl space-y-4">
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">거래 운영 데이터를 불러오는 중...</CardContent>
        </Card>
      </section>
    );
  }

  if (!workflow) {
    return (
      <section className="mx-auto max-w-5xl space-y-4">
        <Card>
          <CardContent className="pt-6 text-sm">거래 워크플로우를 찾을 수 없습니다.</CardContent>
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
    <section className="mx-auto max-w-5xl space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>어드민 거래 운영</CardTitle>
            {stageBadge(workflow.current_stage)}
          </div>
          <CardDescription>
            차량: {workflow.vehicle_title} / 상태 전이 운영(검차, 송금확인, 정산, 강제종료)을 처리합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>판매자: {workflow.seller_name || "-"} ({workflow.seller_email || "-"})</p>
          <p>딜러: {workflow.dealer_name || "-"} ({workflow.dealer_email || "-"})</p>
          <p>현재 단계: {workflow.current_stage}</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/trades">운영 목록으로 돌아가기</Link>
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
              새로고침
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">입찰 현황</CardTitle>
          <CardDescription>차량 단위 입찰 상세와 최고 입찰 상태를 확인합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {bidLoading && <p className="text-sm text-muted-foreground">입찰 현황을 불러오는 중...</p>}
          {!bidLoading && bidDetail && (
            <>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">입찰 수 {bidDetail.bid_count}</Badge>
                <Badge variant="outline">
                  최고가 {Math.round(bidDetail.highest_bid ?? 0).toLocaleString()} {bidDetail.currency}
                </Badge>
                <Badge variant="outline">희망가 {Math.round(bidDetail.reserve_price).toLocaleString()}</Badge>
              </div>
              <div className="grid gap-2">
                {bidDetail.bids.map((bid) => (
                  <div key={bid.bid_id} className="rounded-md border border-border/80 p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{bid.dealer_name}</p>
                      <div className="flex flex-wrap gap-2">
                        {bid.is_highest_active && <Badge>최고 활성 입찰</Badge>}
                        {bid.is_winning_bid && <Badge variant="secondary">낙찰</Badge>}
                        <Badge variant={bid.status === "CANCELLED" ? "destructive" : "outline"}>{bid.status}</Badge>
                      </div>
                    </div>
                    <p>{Math.round(bid.amount).toLocaleString()} {bidDetail.currency}</p>
                    <p className="text-xs text-muted-foreground">
                      {bid.dealer_email} {bid.dealer_phone ? `/ ${bid.dealer_phone}` : ""} / 딜러상태 {bid.dealer_status ?? "-"}
                    </p>
                    <p className="text-xs text-muted-foreground">업데이트 {new Date(bid.updated_at).toLocaleString()}</p>
                  </div>
                ))}
                {bidDetail.bids.length === 0 && <p className="text-sm text-muted-foreground">등록된 입찰이 없습니다.</p>}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">검차 일정 제안</CardTitle>
          <CardDescription>검차 단계(제안 필요/재조율 요청)에서만 실행됩니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={submitInspectionProposal}>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="admin-inspection-date">검차 날짜</Label>
                <Input
                  id="admin-inspection-date"
                  type="date"
                  value={inspectionDate}
                  onChange={(event) => setInspectionDate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-inspection-time">검차 시간</Label>
                <Input
                  id="admin-inspection-time"
                  type="time"
                  value={inspectionTime}
                  onChange={(event) => setInspectionTime(event.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="admin-inspection-location">장소</Label>
                <Input
                  id="admin-inspection-location"
                  value={inspectionLocation}
                  onChange={(event) => setInspectionLocation(event.target.value)}
                  placeholder="서울 강남구 ..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-inspection-assignee">담당자</Label>
                <Input
                  id="admin-inspection-assignee"
                  value={inspectionAssignee}
                  onChange={(event) => setInspectionAssignee(event.target.value)}
                  placeholder="평가사 이름"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-inspection-contact">연락처</Label>
                <Input
                  id="admin-inspection-contact"
                  value={inspectionContact}
                  onChange={(event) => setInspectionContact(event.target.value)}
                  placeholder="010-0000-0000"
                />
              </div>
            </div>
            <Button type="submit" disabled={!canProposeInspection || submitting}>
              검차 일정 제안
            </Button>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">
            검차 상태: {workflow.inspection_status} / 일정:{" "}
            {workflow.inspection_scheduled_at ? new Date(workflow.inspection_scheduled_at).toLocaleString() : "-"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">검차 완료 확정</CardTitle>
          <CardDescription>판매자가 일정을 승인한 뒤 완료 등록을 진행합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={submitInspectionCompletion}>
            <div className="space-y-2">
              <Label htmlFor="admin-inspection-report-url">검차 리포트 URL</Label>
              <Input
                id="admin-inspection-report-url"
                value={inspectionReportUrl}
                onChange={(event) => setInspectionReportUrl(event.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-inspection-summary">요약</Label>
              <Textarea
                id="admin-inspection-summary"
                rows={3}
                value={inspectionSummary}
                onChange={(event) => setInspectionSummary(event.target.value)}
                placeholder="검차 결과 요약"
              />
            </div>
            <Button type="submit" disabled={!canCompleteInspection || submitting}>
              검차 완료 등록
            </Button>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">
            완료 시각: {workflow.inspection_completed_at ? new Date(workflow.inspection_completed_at).toLocaleString() : "-"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">송금 확인 / 정산 완료</CardTitle>
          <CardDescription>송금 확인 이후 정산 금액을 확정합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-md border border-border/80 p-3">
            <p className="text-sm">
              송금 상태: <span className="font-medium">{workflow.remittance_status}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              등록 시각: {workflow.remittance_submitted_at ? new Date(workflow.remittance_submitted_at).toLocaleString() : "-"} /{" "}
              금액: {Math.round(workflow.remittance_amount ?? 0).toLocaleString()}
            </p>
            <Button className="mt-2" type="button" size="sm" disabled={!canConfirmRemittance || submitting} onClick={() => void confirmRemittance()}>
              딜러 송금 확인
            </Button>
          </div>

          <form className="space-y-2 rounded-md border border-border/80 p-3" onSubmit={submitSettlement}>
            <Label htmlFor="admin-settlement-amount">정산 금액</Label>
            <Input
              id="admin-settlement-amount"
              value={settlementAmount}
              onChange={(event) => setSettlementAmount(event.target.value.replace(/[^0-9]/g, ""))}
              inputMode="numeric"
            />
            <Button type="submit" size="sm" disabled={!canCompleteSettlement || submitting}>
              정산 완료 확정
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">관리자 강제종료</CardTitle>
          <CardDescription>운영 이슈 발생 시 사유를 기록하고 거래를 종료합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-2" onSubmit={submitForceCancel}>
            <Label htmlFor="admin-force-cancel-reason">강제종료 사유</Label>
            <Textarea
              id="admin-force-cancel-reason"
              rows={3}
              value={forceCancelReason}
              onChange={(event) => setForceCancelReason(event.target.value)}
              placeholder="최소 3자 이상 입력"
            />
            <Button type="submit" size="sm" variant="destructive" disabled={!canForceCancel || submitting}>
              거래 강제종료
            </Button>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">
            기존 강제종료 사유: {workflow.forced_cancel_reason || "-"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">이벤트 이력</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {eventSummary.map((event) => (
            <div key={event.id} className="rounded-md border border-border/80 p-3 text-sm">
              <p className="font-medium">{event.event_type}</p>
              <p>{event.message}</p>
              <p className="text-xs text-muted-foreground">{new Date(event.created_at).toLocaleString()}</p>
            </div>
          ))}
          {eventSummary.length === 0 && <p className="text-sm text-muted-foreground">기록된 이벤트가 없습니다.</p>}
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
    </section>
  );
}
