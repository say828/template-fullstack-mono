import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useAuth } from "../app/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { listAdminSettlementRecords, listAdminTradeWorkflows } from "../lib/api";
import type { AdminSettlementRecord, TradeWorkflow } from "../lib/types";
import { adminStageBadge, adminStageLabel, workflowPriceText, workflowQueueStatus } from "./adminTradeShared";

interface AdminSellerDetailPageProps {
  tab: "basic" | "history";
}

export function AdminSellerDetailPage({ tab }: AdminSellerDetailPageProps) {
  const { token } = useAuth();
  const { sellerId } = useParams<{ sellerId: string }>();
  const [workflows, setWorkflows] = useState<TradeWorkflow[]>([]);
  const [settlements, setSettlements] = useState<AdminSettlementRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!token || !sellerId) return;
      setLoading(true);
      setError(null);
      try {
        const [workflowRows, settlementRows] = await Promise.all([
          listAdminTradeWorkflows(token, { limit: 100 }),
          listAdminSettlementRecords(token),
        ]);
        setWorkflows(workflowRows.filter((row) => row.seller_id === sellerId));
        setSettlements(settlementRows.filter((row) => row.seller_id === sellerId));
      } catch (err) {
        setWorkflows([]);
        setSettlements([]);
        setError(err instanceof Error ? err.message : "판매자 상세 조회 실패");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [sellerId, token]);

  const seller = useMemo(() => {
    const firstWorkflow = workflows[0];
    const firstSettlement = settlements[0];
    if (!firstWorkflow && !firstSettlement) return null;
    return {
      id: sellerId ?? "",
      name: firstWorkflow?.seller_name || firstSettlement?.seller_name || "이름 미상",
      email: firstWorkflow?.seller_email || firstSettlement?.seller_email || "-",
      phone: firstWorkflow?.seller_phone || "-",
    };
  }, [sellerId, settlements, workflows]);

  const pendingSettlementAmount = useMemo(
    () => settlements.filter((row) => row.status === "PENDING").reduce((sum, row) => sum + Math.round(row.winning_price ?? 0), 0),
    [settlements],
  );

  if (!loading && !seller) {
    return (
      <section className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>조회 실패</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Card>
          <CardContent className="pt-6 text-sm">판매자 상세 정보를 찾을 수 없습니다.</CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>조회 실패</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && <p className="text-sm text-muted-foreground">판매자 상세를 불러오는 중...</p>}

      {seller && (
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle>{seller.name}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">{seller.email}</p>
                </div>
                <Badge variant="outline">{tab === "history" ? "차량 이력" : "기본 정보"}</Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">차량 수</p>
                <p className="mt-1 text-2xl font-semibold">{workflows.length}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">진행 중 거래</p>
                <p className="mt-1 text-2xl font-semibold">{workflows.filter((row) => row.current_stage !== "COMPLETED" && row.current_stage !== "CANCELLED").length}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">거래 완료</p>
                <p className="mt-1 text-2xl font-semibold">{workflows.filter((row) => row.current_stage === "COMPLETED").length}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">정산 대기 금액</p>
                <p className="mt-1 text-2xl font-semibold">{pendingSettlementAmount.toLocaleString()}원</p>
              </div>
            </CardContent>
          </Card>

          {tab === "basic" ? (
            <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
              <Card>
                <CardHeader><CardTitle className="text-base">기본 정보</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>판매자 ID: {seller.id}</p>
                  <p>이메일: {seller.email}</p>
                  <p>연락처: {seller.phone}</p>
                  <p>정산 대기 건수: {settlements.filter((row) => row.status === "PENDING").length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">최근 정산</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {settlements.slice(0, 5).map((row) => (
                    <div key={`${row.vehicle_id}-${row.settlement_due_at}`} className="rounded-lg border p-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">{row.vehicle_title}</p>
                        <Badge variant={row.status === "COMPLETED" ? "secondary" : "default"}>{row.status === "COMPLETED" ? "정산 완료" : "정산 대기"}</Badge>
                      </div>
                      <p className="mt-1 text-muted-foreground">{Math.round(row.winning_price).toLocaleString()} {row.currency}</p>
                      <Link className="mt-1 inline-block text-[#2459cd]" to={`/admin/settlements/${row.vehicle_id}`}>차량 상세</Link>
                    </div>
                  ))}
                  {settlements.length === 0 && <p className="text-sm text-muted-foreground">정산 이력이 없습니다.</p>}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardHeader><CardTitle className="text-base">차량 판매 이력</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {workflows.map((row) => (
                  <div key={row.id} className="rounded-lg border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">{row.vehicle_title}</p>
                        <p className="text-sm text-muted-foreground">{workflowPriceText(row)}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {adminStageBadge(row.current_stage)}
                        <Badge variant="outline">{workflowQueueStatus(row)}</Badge>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>단계 {adminStageLabel(row.current_stage)}</span>
                      <span>등록 {new Date(row.created_at).toLocaleString()}</span>
                      <Link className="text-[#2459cd]" to={`/admin/trades/${row.vehicle_id}`}>거래 상세</Link>
                    </div>
                  </div>
                ))}
                {workflows.length === 0 && <p className="text-sm text-muted-foreground">거래 이력이 없습니다.</p>}
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2">
            <Button asChild variant={tab === "basic" ? "default" : "outline"} size="sm">
              <Link to={`/admin/sellers/${seller.id}`}>기본 정보</Link>
            </Button>
            <Button asChild variant={tab === "history" ? "default" : "outline"} size="sm">
              <Link to={`/admin/sellers/${seller.id}/history`}>차량 이력</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/sellers">목록</Link>
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
