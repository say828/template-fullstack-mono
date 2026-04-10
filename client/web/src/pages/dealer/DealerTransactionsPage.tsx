import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../../app/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { listDealerTradeWorkflows } from "../../lib/api";
import type { TradeWorkflow } from "../../lib/types";
import { currencyText, finalTradeAmount, workflowToDealerTransactionStage, type DealerTransactionStage } from "./shared";

interface DealerTransactionsPageProps {
  mode?: "progress" | "completed";
}

interface TransactionRow {
  workflowId: string;
  vehicleId: string;
  title: string;
  transactionType: "ALL" | "UNKNOWN";
  stage: DealerTransactionStage;
  completed: boolean;
  workflow: TradeWorkflow;
}

function toTransactionRow(workflow: TradeWorkflow): TransactionRow {
  return {
    workflowId: workflow.id,
    vehicleId: workflow.vehicle_id,
    title: workflow.vehicle_title,
    transactionType: "UNKNOWN",
    stage: workflowToDealerTransactionStage(workflow),
    completed: workflow.current_stage === "COMPLETED",
    workflow,
  };
}

function stageLabel(stage: DealerTransactionStage) {
  if (stage === "inspection") return "검차 일정 조율";
  if (stage === "inspection-confirmed") return "검차 일정 확정";
  if (stage === "depreciation-waiting") return "감가 제안 대기";
  if (stage === "depreciation-submitted") return "감가 검토 중";
  if (stage === "depreciation-renegotiation") return "감가 재협의";
  if (stage === "delivery") return "인도 진행";
  if (stage === "remittance") return "송금/정산";
  return "거래 완료";
}

export function DealerTransactionsPage({ mode = "progress" }: DealerTransactionsPageProps) {
  const { token } = useAuth();

  const [rows, setRows] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");

  const load = async () => {
    if (!token) {
      setRows([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await listDealerTradeWorkflows(token, { limit: 100 });
      setRows(data.map(toTransactionRow));
    } catch (err) {
      setRows([]);
      setError(err instanceof Error ? err.message : "거래 목록 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [token]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (mode === "completed" && !row.completed) return false;
      if (mode === "progress" && row.completed) return false;
      if (!keyword.trim()) return true;
      return row.title.toLowerCase().includes(keyword.trim().toLowerCase());
    });
  }, [keyword, mode, rows]);

  const progressCount = rows.filter((row) => !row.completed).length;
  const completedCount = rows.filter((row) => row.completed).length;

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-3xl font-black text-slate-900">거래·결제</h1>
        <p className="text-sm text-slate-500">{mode === "progress" ? "DL_017 거래결제(진행중)" : "DL_018 거래결제(완료)"}</p>
      </header>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>조회 실패</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="flex flex-wrap gap-2">
            <Button asChild type="button" variant={mode === "progress" ? "default" : "outline"} className={mode === "progress" ? "bg-[#2f6ff5] hover:bg-[#2459cd]" : undefined}>
              <Link to="/dealer/transactions">진행중 거래 {progressCount}건</Link>
            </Button>
            <Button asChild type="button" variant={mode === "completed" ? "default" : "outline"} className={mode === "completed" ? "bg-[#2f6ff5] hover:bg-[#2459cd]" : undefined}>
              <Link to="/dealer/transactions/completed">완료된 거래 {completedCount}건</Link>
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <div className="space-y-1">
              <Label htmlFor="dealer-transaction-keyword">차량명</Label>
              <Input id="dealer-transaction-keyword" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
            </div>
            <div className="flex items-end">
              <Button onClick={() => void load()} type="button" variant="outline">
                새로고침
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && <p className="text-sm text-slate-500">거래 목록을 불러오는 중...</p>}

      <div className="grid gap-3">
        {filteredRows.map((row) => (
          <Card key={row.workflowId}>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">{row.title}</CardTitle>
                <Badge variant={row.completed ? "secondary" : "outline"}>{row.completed ? "거래 완료" : "진행 중"}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-slate-500">현재 단계: {stageLabel(row.stage)}</p>
              <p className="text-slate-500">낙찰가: {currencyText(row.workflow.base_price, row.workflow.currency)}</p>
              <p className="text-slate-500">최종 거래가: {currencyText(finalTradeAmount(row.workflow), row.workflow.currency)}</p>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" type="button" variant="outline">
                  <Link to={`/dealer/transactions/${row.vehicleId}/detail/${row.stage}`}>거래·결제 진행</Link>
                </Button>
                {row.completed && (
                  <Button asChild size="sm" type="button" variant="secondary">
                    <Link to={`/dealer/transactions/${row.vehicleId}/receipt`}>증빙 보기</Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!loading && filteredRows.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-sm text-slate-500">조회된 거래·결제 내역이 없습니다.</CardContent>
        </Card>
      )}
    </section>
  );
}
