import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { useAuth } from "../../app/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { getDealerTradeWorkflow } from "../../lib/api";
import type { TradeWorkflow } from "../../lib/types";
import { currencyText, finalTradeAmount, formatDateTime } from "./shared";

export function DealerReceiptProofPage() {
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
        setWorkflow(await getDealerTradeWorkflow(token, vehicleId));
      } catch (err) {
        setWorkflow(null);
        setError(err instanceof Error ? err.message : "증빙 정보 조회 실패");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [token, vehicleId]);

  return (
    <section className="mx-auto max-w-3xl space-y-4">
      <header>
        <h1 className="text-3xl font-black text-slate-900">영수증 증빙</h1>
        <p className="text-sm text-slate-500">DL_019 거래 명세 및 증빙 정보</p>
      </header>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>조회 실패</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && <p className="text-sm text-slate-500">증빙 정보를 불러오는 중...</p>}

      {!loading && !workflow && (
        <Card>
          <CardContent className="pt-6 text-sm text-slate-500">거래 증빙 정보를 찾을 수 없습니다.</CardContent>
        </Card>
      )}

      {workflow && (
        <>
          <Alert>
            <AlertTitle>증빙 발급 안내</AlertTitle>
            <AlertDescription>
              현재 API는 문서 파일 다운로드 URL을 제공하지 않습니다. 대신 거래 완료 기준의 증빙 메타 정보를 노출합니다.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">거래 명세서 발급 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-700">
              <p>워크플로우 ID: {workflow.id}</p>
              <p>차량명: {workflow.vehicle_title}</p>
              <p>낙찰가: {currencyText(workflow.base_price, workflow.currency)}</p>
              <p>감가 합계: -{currencyText(workflow.depreciation_total ?? 0, workflow.currency)}</p>
              <p>최종 거래가: {currencyText(finalTradeAmount(workflow), workflow.currency)}</p>
              <p>인도 완료: {formatDateTime(workflow.delivery_completed_at)}</p>
              <p>송금 등록: {formatDateTime(workflow.remittance_submitted_at)}</p>
              <p>송금 확인: {formatDateTime(workflow.remittance_confirmed_at)}</p>
              <p>정산 완료: {formatDateTime(workflow.settlement_completed_at)}</p>
            </CardContent>
          </Card>
        </>
      )}
    </section>
  );
}
