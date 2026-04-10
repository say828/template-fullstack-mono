import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../app/AuthContext";
import { PageIntro } from "../components/common/PageIntro";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { listAdminTradeWorkflows } from "../lib/api";
import type { TradeWorkflow } from "../lib/types";
import { adminStageLabel } from "./adminTradeShared";

function averageHours(rows: TradeWorkflow[], selector: (row: TradeWorkflow) => string | null | undefined) {
  const durations = rows
    .map((row) => {
      const start = new Date(row.created_at).getTime();
      const endRaw = selector(row);
      if (!endRaw) return null;
      const end = new Date(endRaw).getTime();
      if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
      return (end - start) / 3600000;
    })
    .filter((value): value is number => value !== null);

  if (durations.length === 0) return "-";
  const avg = durations.reduce((sum, value) => sum + value, 0) / durations.length;
  return `${avg.toFixed(1)}시간`;
}

export function AdminTradeSummaryPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<TradeWorkflow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listAdminTradeWorkflows(token, { limit: 100 });
      setRows(data);
    } catch (err) {
      setRows([]);
      setError(err instanceof Error ? err.message : "거래 요약 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [token]);

  const summary = useMemo(() => {
    const inspection = rows.filter((row) => row.current_stage === "INSPECTION").length;
    const depreciation = rows.filter((row) => row.current_stage === "DEPRECIATION").length;
    const delivery = rows.filter((row) => row.current_stage === "DELIVERY").length;
    const remittance = rows.filter((row) => row.current_stage === "REMITTANCE").length;
    const settlement = rows.filter((row) => row.current_stage === "SETTLEMENT").length;
    const completed = rows.filter((row) => row.current_stage === "COMPLETED").length;
    return {
      inspection,
      depreciation,
      delivery,
      remittance,
      settlement,
      completed,
      inspectionLead: averageHours(rows, (row) => row.inspection_completed_at),
      depreciationLead: averageHours(rows, (row) => row.depreciation_agreed_at),
      deliveryLead: averageHours(rows, (row) => row.delivery_completed_at),
      settlementLead: averageHours(rows, (row) => row.settlement_completed_at),
    };
  }, [rows]);

  return (
    <section className="space-y-4">
      <PageIntro
        title="거래관리요약"
        description="ADM_008 운영 단계별 건수와 처리 리드타임을 요약합니다."
        actions={
          <Button type="button" variant="outline" onClick={() => void load()}>
            새로고침
          </Button>
        }
      />

      {error && (
        <Alert variant="destructive">
          <AlertTitle>조회 실패</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && <p className="text-sm text-muted-foreground">요약 데이터를 불러오는 중...</p>}

      <div className="grid gap-3 md:grid-cols-3">
        <Card><CardHeader><CardTitle className="text-base">검차 대기</CardTitle></CardHeader><CardContent><p className="text-3xl font-black">{summary.inspection}</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">감가 협의</CardTitle></CardHeader><CardContent><p className="text-3xl font-black">{summary.depreciation}</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">인도 진행</CardTitle></CardHeader><CardContent><p className="text-3xl font-black">{summary.delivery}</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">송금 확인</CardTitle></CardHeader><CardContent><p className="text-3xl font-black">{summary.remittance}</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">정산 대기</CardTitle></CardHeader><CardContent><p className="text-3xl font-black">{summary.settlement}</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">거래 완료</CardTitle></CardHeader><CardContent><p className="text-3xl font-black">{summary.completed}</p></CardContent></Card>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">리드타임</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>검차 완료 평균: {summary.inspectionLead}</p>
            <p>감가 합의 평균: {summary.depreciationLead}</p>
            <p>인도 완료 평균: {summary.deliveryLead}</p>
            <p>정산 완료 평균: {summary.settlementLead}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">운영 진입</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Button asChild className="w-full justify-between" variant="outline"><Link to="/admin/trades">거래관리 <span>{adminStageLabel("INSPECTION")}~완료</span></Link></Button>
            <Button asChild className="w-full justify-between" variant="outline"><Link to="/admin/inspections">검차 운영 <span>{summary.inspection}건</span></Link></Button>
            <Button asChild className="w-full justify-between" variant="outline"><Link to="/admin/depreciations">감가협의 <span>{summary.depreciation}건</span></Link></Button>
            <Button asChild className="w-full justify-between" variant="outline"><Link to="/admin/deliveries">인도 관리 <span>{summary.delivery}건</span></Link></Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
