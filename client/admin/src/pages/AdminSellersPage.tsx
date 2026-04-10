import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../app/AuthContext";
import { AsyncState } from "../components/common/AsyncState";
import { PageIntro } from "../components/common/PageIntro";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { listAdminSettlementRecords, listAdminTradeWorkflows } from "../lib/api";
import type { AdminSettlementRecord, TradeWorkflow } from "../lib/types";
import { adminStageLabel } from "./adminTradeShared";

interface SellerSummary {
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  sellerPhone: string;
  vehicleCount: number;
  activeTradeCount: number;
  completedTradeCount: number;
  pendingSettlementCount: number;
  latestVehicleTitle: string;
  latestStage: string;
}

function buildSellerSummaries(workflows: TradeWorkflow[], settlements: AdminSettlementRecord[]): SellerSummary[] {
  const map = new Map<string, SellerSummary>();

  for (const workflow of workflows) {
    const sellerId = workflow.seller_id;
    const current = map.get(sellerId) ?? {
      sellerId,
      sellerName: workflow.seller_name || "이름 미상",
      sellerEmail: workflow.seller_email || "-",
      sellerPhone: workflow.seller_phone || "-",
      vehicleCount: 0,
      activeTradeCount: 0,
      completedTradeCount: 0,
      pendingSettlementCount: 0,
      latestVehicleTitle: workflow.vehicle_title,
      latestStage: adminStageLabel(workflow.current_stage),
    };

    current.sellerName = workflow.seller_name || current.sellerName;
    current.sellerEmail = workflow.seller_email || current.sellerEmail;
    current.sellerPhone = workflow.seller_phone || current.sellerPhone;
    current.vehicleCount += 1;
    if (workflow.current_stage === "COMPLETED") {
      current.completedTradeCount += 1;
    } else if (workflow.current_stage !== "CANCELLED") {
      current.activeTradeCount += 1;
    }
    current.latestVehicleTitle = workflow.vehicle_title;
    current.latestStage = adminStageLabel(workflow.current_stage);
    map.set(sellerId, current);
  }

  for (const settlement of settlements) {
    if (!settlement.seller_id) continue;
    const current = map.get(settlement.seller_id) ?? {
      sellerId: settlement.seller_id,
      sellerName: settlement.seller_name || "이름 미상",
      sellerEmail: settlement.seller_email || "-",
      sellerPhone: "-",
      vehicleCount: 0,
      activeTradeCount: 0,
      completedTradeCount: 0,
      pendingSettlementCount: 0,
      latestVehicleTitle: settlement.vehicle_title,
      latestStage: settlement.status === "COMPLETED" ? "정산완료" : "정산대기",
    };
    current.sellerName = settlement.seller_name || current.sellerName;
    current.sellerEmail = settlement.seller_email || current.sellerEmail;
    if (settlement.status === "PENDING") {
      current.pendingSettlementCount += 1;
    }
    map.set(settlement.seller_id, current);
  }

  return [...map.values()].sort((left, right) => {
    if (right.pendingSettlementCount !== left.pendingSettlementCount) {
      return right.pendingSettlementCount - left.pendingSettlementCount;
    }
    if (right.activeTradeCount !== left.activeTradeCount) {
      return right.activeTradeCount - left.activeTradeCount;
    }
    return left.sellerName.localeCompare(right.sellerName, "ko");
  });
}

export function AdminSellersPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<SellerSummary[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [workflows, settlements] = await Promise.all([
        listAdminTradeWorkflows(token, { limit: 100 }),
        listAdminSettlementRecords(token),
      ]);
      setRows(buildSellerSummaries(workflows, settlements));
    } catch (err) {
      setRows([]);
      setError(err instanceof Error ? err.message : "판매자 관리 조회 실패");
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
      return [row.sellerName, row.sellerEmail, row.latestVehicleTitle].join(" ").toLowerCase().includes(needle);
    });
  }, [keyword, rows]);

  const summary = useMemo(
    () => ({
      total: rows.length,
      active: rows.filter((row) => row.activeTradeCount > 0).length,
      settlementPending: rows.filter((row) => row.pendingSettlementCount > 0).length,
    }),
    [rows],
  );

  return (
    <section className="space-y-4">
      <PageIntro
        title="판매자 관리"
        description="판매자 운영 현황과 거래/정산 연계 상태를 조회합니다."
        actions={
          <Button type="button" variant="outline" onClick={() => void load()}>
            새로고침
          </Button>
        }
      />

      <AsyncState loading={loading} error={error} empty={!loading && !error && rows.length === 0} emptyText="운영 데이터가 연결된 판매자가 없습니다." />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">요약</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant="outline">전체 판매자 {summary.total}</Badge>
          <Badge>진행중 판매자 {summary.active}</Badge>
          <Badge variant="secondary">정산 대기 판매자 {summary.settlementPending}</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">검색</CardTitle>
        </CardHeader>
        <CardContent>
          <Input placeholder="판매자명 / 이메일 / 차량명 검색" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {visibleRows.map((row) => (
          <Card key={row.sellerId}>
            <CardHeader className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">{row.sellerName}</CardTitle>
                <div className="flex flex-wrap gap-2">
                  {row.pendingSettlementCount > 0 && <Badge>정산 대기 {row.pendingSettlementCount}</Badge>}
                  {row.pendingSettlementCount === 0 && row.activeTradeCount > 0 && <Badge variant="outline">운영중</Badge>}
                  {row.pendingSettlementCount === 0 && row.activeTradeCount === 0 && <Badge variant="secondary">안정</Badge>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>이메일: {row.sellerEmail}</p>
              <p>연락처: {row.sellerPhone}</p>
              <p>차량 {row.vehicleCount}건 / 진행중 {row.activeTradeCount}건 / 완료 {row.completedTradeCount}건</p>
              <p className="text-xs text-muted-foreground">최근 차량 {row.latestVehicleTitle} / 최근 단계 {row.latestStage}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button asChild size="sm" variant="outline">
                  <Link to={`/admin/sellers/${row.sellerId}`}>기본 상세</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link to={`/admin/sellers/${row.sellerId}/history`}>차량 이력</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
