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
import { getSellerTradeWorkflow, getSellerVehicleDetail, sellerApproveInspection, sellerRequestInspectionReschedule } from "../lib/api";
import type { SellerVehicleDetail, TradeEvent, TradeWorkflow } from "../lib/types";

function inspectionStatusLabel(status: TradeWorkflow["inspection_status"]) {
  if (status === "PROPOSED") return <Badge>일정 제안됨</Badge>;
  if (status === "RESCHEDULE_REQUESTED") return <Badge variant="outline">재협의 요청됨</Badge>;
  if (status === "CONFIRMED") return <Badge variant="secondary">일정 확정</Badge>;
  return <Badge variant="secondary">검차 완료</Badge>;
}

function toDateTimeParts(iso?: string | null) {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${mi}` };
}

function parseRescheduleEvents(events: TradeEvent[]) {
  return events
    .filter((event) => event.event_type === "INSPECTION_RESCHEDULE_REQUESTED")
    .map((event) => {
      const payload = event.payload_json ?? {};
      const preferredAt = typeof payload.preferred_at === "string" ? payload.preferred_at : null;
      const reason = typeof payload.reason === "string" ? payload.reason : event.message;
      const parts = toDateTimeParts(preferredAt);
      return {
        requested_at: event.created_at,
        preferred_at: preferredAt,
        preferred_date: parts.date,
        preferred_time: parts.time,
        reason,
      };
    })
    .sort((a, b) => (a.requested_at < b.requested_at ? 1 : -1));
}

export function SellerInspectionSchedulePage() {
  const { token } = useAuth();
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const [detail, setDetail] = useState<SellerVehicleDetail | null>(null);
  const [workflow, setWorkflow] = useState<TradeWorkflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [showRescheduleForm, setShowRescheduleForm] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("10:30");
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
      setError(err instanceof Error ? err.message : "검차 일정 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [token, vehicleId]);

  const approveSchedule = async () => {
    if (!token || !vehicleId) return;
    setError(null);
    try {
      const flow = await sellerApproveInspection(token, vehicleId);
      setWorkflow(flow);
      setMessage("검차 일정이 확정되었습니다. 운영팀이 검차 완료를 등록하면 감가 협의로 이동할 수 있습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "검차 일정 승인 실패");
    }
  };

  const submitReschedule = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token || !vehicleId) return;
    if (!newDate || !newTime || !newReason.trim()) {
      setError("새 일정 날짜/시간/사유를 모두 입력해 주세요.");
      return;
    }
    setError(null);
    const preferred = new Date(`${newDate}T${newTime}:00`);
    try {
      const flow = await sellerRequestInspectionReschedule(token, vehicleId, {
        preferred_at: preferred.toISOString(),
        reason: newReason.trim(),
      });
      setWorkflow(flow);
      setShowRescheduleForm(false);
      setMessage("다른 일정 요청이 접수되었습니다. 검차 완료 전까지 감가 협의 단계 진입은 차단됩니다.");
      setNewReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "일정 재요청 실패");
    }
  };

  const scheduleParts = useMemo(
    () => toDateTimeParts(workflow?.inspection_scheduled_at),
    [workflow?.inspection_scheduled_at],
  );
  const history = useMemo(() => parseRescheduleEvents(workflow?.events ?? []), [workflow?.events]);
  const canMoveToDepreciation = workflow?.inspection_status === "COMPLETED";

  if (loading) {
    return (
      <section className="mx-auto max-w-3xl">
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">검차 일정을 불러오는 중...</CardContent>
        </Card>
      </section>
    );
  }

  if (!detail || !workflow) {
    return (
      <section className="mx-auto max-w-3xl space-y-3">
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
    <section className="mx-auto max-w-3xl space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>검차 일정 확인</CardTitle>
            {inspectionStatusLabel(workflow.inspection_status)}
          </div>
          <CardDescription>
            {detail.title} / 운영팀이 검차 완료를 등록하기 전에는 감가 협의 단계로 이동할 수 없습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">제안 일정: {scheduleParts.date || "-"} {scheduleParts.time || ""}</p>
          <p className="text-sm">검차 장소: {workflow.inspection_location || "-"}</p>
          <p className="text-sm">담당 평가사: {workflow.inspection_assignee || "-"}</p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button asChild variant="outline" size="sm">
              <Link to={`/seller/vehicles/${detail.id}`}>상세로 돌아가기</Link>
            </Button>
            {(workflow.inspection_status === "PROPOSED" || workflow.inspection_status === "RESCHEDULE_REQUESTED") && (
              <Button type="button" size="sm" onClick={() => void approveSchedule()}>
                일정 승인하기
              </Button>
            )}
            {workflow.inspection_status !== "COMPLETED" && (
              <Button type="button" size="sm" variant="secondary" onClick={() => setShowRescheduleForm((v) => !v)}>
                다른 일정 요청
              </Button>
            )}
            {canMoveToDepreciation ? (
              <Button asChild size="sm">
                <Link to={`/seller/vehicles/${detail.id}/depreciation`}>감가 협의로 이동</Link>
              </Button>
            ) : (
              <Button type="button" size="sm" disabled>
                감가 협의로 이동(차단)
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {showRescheduleForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">다른 일정 요청</CardTitle>
            <CardDescription>새 일정 입력 후 요청을 보내면 검차 상태가 확정 대기로 유지됩니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={submitReschedule}>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="inspection-new-date">희망 날짜</Label>
                  <Input id="inspection-new-date" type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inspection-new-time">희망 시간</Label>
                  <Input id="inspection-new-time" type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="inspection-new-reason">요청 사유</Label>
                <Textarea
                  id="inspection-new-reason"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  rows={3}
                  placeholder="일정 변경 사유를 입력해 주세요"
                />
              </div>
              <Button type="submit">요청 보내기</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">일정 재요청 이력</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {history.map((row, idx) => (
            <div key={`${row.requested_at}-${idx}`} className="rounded-md border border-border/80 p-3">
              <p className="text-sm font-medium">
                {row.preferred_date || "-"} {row.preferred_time || ""}
              </p>
              <p className="text-xs text-muted-foreground">요청시각: {new Date(row.requested_at).toLocaleString()}</p>
              <p className="mt-1 text-sm">{row.reason}</p>
            </div>
          ))}
          {history.length === 0 && <p className="text-sm text-muted-foreground">요청 이력이 없습니다.</p>}
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
