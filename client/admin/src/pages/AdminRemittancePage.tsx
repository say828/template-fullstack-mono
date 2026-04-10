import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../app/AuthContext";
import { PageIntro } from "../components/common/PageIntro";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { listAdminTradeWorkflows } from "../lib/api";
import type { TradeWorkflow } from "../lib/types";

function remittanceStatusBadge(row: TradeWorkflow) {
  if (row.remittance_status === "SUBMITTED") return <Badge>확인 대기</Badge>;
  if (row.remittance_status === "CONFIRMED") return <Badge variant="secondary">확인 완료</Badge>;
  return <Badge variant="outline">송금 대기</Badge>;
}

export function AdminRemittancePage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<TradeWorkflow[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listAdminTradeWorkflows(token, { stage: "REMITTANCE", limit: 100 });
      setRows(data);
    } catch (err) {
      setRows([]);
      setError(err instanceof Error ? err.message : "딜러 송금 관리 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [token]);

  const visibleRows = useMemo(() => {
    const needle = keyword.trim().toLowerCase();
    return rows.filter((row) => {
      if (!needle) return true;
      return [row.vehicle_title, row.dealer_name ?? "", row.dealer_email ?? "", row.remittance_reference ?? ""].join(" ").toLowerCase().includes(needle);
    });
  }, [keyword, rows]);

  return (
    <section className="space-y-4">
      <PageIntro
        title="딜러 송금 관리"
        description="ADM_033 딜러 송금 등록 상태를 확인하고 상세로 진입합니다."
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">검색</CardTitle>
        </CardHeader>
        <CardContent>
          <Input placeholder="차량명 / 딜러 / 송금 식별값 검색" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
        </CardContent>
      </Card>

      {loading && <p className="text-sm text-muted-foreground">송금 목록을 불러오는 중...</p>}

      <div className="grid gap-3">
        {visibleRows.map((row) => (
          <Card key={row.id}>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">{row.vehicle_title}</CardTitle>
                <div className="flex flex-wrap gap-2">
                  {remittanceStatusBadge(row)}
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/admin/remittances/${row.vehicle_id}`}>상세 보기</Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>딜러: {row.dealer_name || "-"} ({row.dealer_email || "-"})</p>
              <p>송금 금액: {Math.round(row.remittance_amount ?? row.agreed_price ?? row.base_price).toLocaleString()} {row.currency}</p>
              <p>송금 식별값: {row.remittance_reference || "-"}</p>
              <p className="text-xs text-muted-foreground">
                송금 등록 {row.remittance_submitted_at ? new Date(row.remittance_submitted_at).toLocaleString() : "-"} / 확인 {row.remittance_confirmed_at ? new Date(row.remittance_confirmed_at).toLocaleString() : "-"}
              </p>
            </CardContent>
          </Card>
        ))}

        {!loading && visibleRows.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">송금 운영 대상이 없습니다.</CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
