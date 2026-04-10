import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useAuth } from "../app/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { getAdminTradeWorkflow, listAdminSettlementRecords } from "../lib/api";
import type { AdminSettlementRecord, TradeWorkflow } from "../lib/types";

export function AdminSettlementDetailPage() {
  const { token } = useAuth();
  const { vehicleId } = useParams<{ vehicleId: string }>();

  const [record, setRecord] = useState<AdminSettlementRecord | null>(null);
  const [workflow, setWorkflow] = useState<TradeWorkflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!token || !vehicleId) return;
    setLoading(true);
    setError(null);
    try {
      const [records, flow] = await Promise.all([listAdminSettlementRecords(token), getAdminTradeWorkflow(token, vehicleId)]);
      setRecord(records.find((row) => row.vehicle_id === vehicleId) ?? null);
      setWorkflow(flow);
    } catch (err) {
      setError(err instanceof Error ? err.message : "정산 상세 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [token, vehicleId]);

  const completed = record?.status === "COMPLETED";
  const title = completed ? "판매자 정산 관리 상세(완료)" : "판매자 정산 관리상세(대기)";
  const code = completed ? "ADM_037" : "ADM_036";
  const finalAmount = useMemo(() => {
    if (workflow?.settlement_amount != null) return workflow.settlement_amount;
    if (workflow?.agreed_price != null) return workflow.agreed_price;
    return record?.winning_price ?? workflow?.base_price ?? 0;
  }, [record, workflow]);

  if (loading) {
    return <section className="space-y-4"><Card><CardContent className="pt-6 text-sm text-muted-foreground">정산 상세를 불러오는 중...</CardContent></Card></section>;
  }

  if (!record || !workflow) {
    return (
      <section className="space-y-4">
        <Card><CardContent className="pt-6 text-sm">정산 상세 정보를 찾을 수 없습니다.</CardContent></Card>
        {error && <Alert variant="destructive"><AlertTitle>조회 실패</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>{title}</CardTitle>
            <Badge variant={completed ? "secondary" : "outline"}>{code}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>차량명: {record.vehicle_title}</p>
          <p>판매자: {record.seller_name || "-"} ({record.seller_email || "-"})</p>
          <p>정산 상태: {record.status === "COMPLETED" ? "정산완료" : "정산대기"}</p>
          <p>거래일: {record.sold_at ? new Date(record.sold_at).toLocaleString() : "-"}</p>
          <p>정산 예정일: {new Date(record.settlement_due_at).toLocaleString()}</p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button asChild size="sm" variant="outline"><Link to="/admin/settlements">정산 목록으로 돌아가기</Link></Button>
            <Button asChild size="sm" variant="outline"><Link to={`/admin/trades/${record.vehicle_id}`}>거래 운영 보기</Link></Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">정산 금액</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>낙찰가: {Math.round(record.winning_price).toLocaleString()} {record.currency}</p>
            <p>합의가: {Math.round(workflow.agreed_price ?? workflow.base_price).toLocaleString()} {workflow.currency}</p>
            <p>송금 확인 금액: {Math.round(workflow.remittance_amount ?? 0).toLocaleString()} {workflow.currency}</p>
            <p className="font-semibold text-slate-900">최종 정산 금액: {Math.round(finalAmount).toLocaleString()} {workflow.currency}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">처리 이력</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>송금 등록: {workflow.remittance_submitted_at ? new Date(workflow.remittance_submitted_at).toLocaleString() : "-"}</p>
            <p>송금 확인: {workflow.remittance_confirmed_at ? new Date(workflow.remittance_confirmed_at).toLocaleString() : "-"}</p>
            <p>정산 완료: {workflow.settlement_completed_at ? new Date(workflow.settlement_completed_at).toLocaleString() : "-"}</p>
            <p>현재 단계: {workflow.current_stage}</p>
          </CardContent>
        </Card>
      </div>

      <Alert>
        <AlertTitle>{completed ? "정산 완료 상태" : "정산 대기 상태"}</AlertTitle>
        <AlertDescription>{completed ? "외부 지급 확정 이후 저장된 정산 완료 시각과 금액을 표시합니다." : "운영자가 거래 운영 상세에서 정산 완료를 확정하면 완료 상태로 전환됩니다."}</AlertDescription>
      </Alert>

      {error && <Alert variant="destructive"><AlertTitle>조회 실패</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
    </section>
  );
}
