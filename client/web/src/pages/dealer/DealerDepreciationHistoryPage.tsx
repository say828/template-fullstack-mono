import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useAuth } from "../../app/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { getDealerTradeWorkflow } from "../../lib/api";
import type { TradeWorkflow } from "../../lib/types";
import { currencyText, finalTradeAmount, formatDateTime } from "./shared";

export function DealerDepreciationHistoryPage() {
  const { token } = useAuth();
  const { vehicleId } = useParams<{ vehicleId: string }>();

  const [workflow, setWorkflow] = useState<TradeWorkflow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!token || !vehicleId) {
        setWorkflow(null);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await getDealerTradeWorkflow(token, vehicleId);
        setWorkflow(data);
      } catch (err) {
        setWorkflow(null);
        setError(err instanceof Error ? err.message : "감가 이력 조회 실패");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [token, vehicleId]);

  const total = useMemo(
    () => workflow?.depreciation_total ?? workflow?.depreciation_items.reduce((sum, item) => sum + item.amount, 0) ?? 0,
    [workflow],
  );

  return (
    <section className="mx-auto max-w-4xl space-y-4">
      <header>
        <h1 className="text-3xl font-black text-slate-900">감가 협의 이력</h1>
        <p className="text-sm text-slate-500">DL_027 합의된 감가 항목과 이벤트 이력을 확인합니다.</p>
      </header>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>조회 실패</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && <p className="text-sm text-slate-500">감가 이력을 불러오는 중...</p>}

      {!loading && !workflow && (
        <Card>
          <CardContent className="pt-6 text-sm text-slate-500">감가 이력을 찾을 수 없습니다.</CardContent>
        </Card>
      )}

      {workflow && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">감가 합의 요약</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>차량명: {workflow.vehicle_title}</p>
              <p>감가 제출 시각: {formatDateTime(workflow.depreciation_submitted_at)}</p>
              <p>재협의 요청 시각: {formatDateTime(workflow.renegotiation_requested_at)}</p>
              <p>감가 합의 시각: {formatDateTime(workflow.depreciation_agreed_at)}</p>
              <p>감가 총액: -{currencyText(total, workflow.currency)}</p>
              <p>최종 거래 금액: {currencyText(finalTradeAmount(workflow), workflow.currency)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">감가 항목</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {workflow.depreciation_items.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-slate-900">{item.label}</p>
                    <p className="font-semibold text-rose-500">-{currencyText(item.amount, workflow.currency)}</p>
                  </div>
                  <p className="text-xs text-slate-500">{item.note || "-"}</p>
                </div>
              ))}
              {workflow.depreciation_items.length === 0 && <p className="text-sm text-slate-500">등록된 감가 항목이 없습니다.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">관련 이벤트</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {workflow.events
                .filter((event) => event.event_type.includes("DEPRECIATION") || event.event_type.includes("RENEGOTIATION"))
                .slice()
                .reverse()
                .map((event) => (
                  <div key={event.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                    <p className="font-medium text-slate-900">{event.message}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(event.created_at)}</p>
                  </div>
                ))}
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2">
            <Button asChild type="button" variant="outline">
              <Link to={`/dealer/transactions/${workflow.vehicle_id}/detail/depreciation-submitted`}>거래 상세로 돌아가기</Link>
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
