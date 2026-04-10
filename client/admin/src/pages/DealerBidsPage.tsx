import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../app/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { listMyDealerBids } from "../lib/api";
import type { DealerBid } from "../lib/types";
import {
  currencyText,
  dealerStatusTabs,
  toDealerBidDetailState,
  type DealerBidDetailState,
} from "./dealer/shared";

type BidStatusFilter = "ALL" | "ACTIVE" | "CLOSED" | "WON" | "LOST" | "CANCELLED";

function statusBadge(state: DealerBidDetailState) {
  if (state === "open") return <Badge className="bg-[#2f6ff5]">입찰중</Badge>;
  if (state === "closed") return <Badge variant="secondary">마감</Badge>;
  if (state === "won") return <Badge className="bg-emerald-600">낙찰</Badge>;
  if (state === "lost") return <Badge variant="outline">미낙찰</Badge>;
  return <Badge variant="destructive">취소됨</Badge>;
}

function matchesFilter(row: DealerBid, filter: BidStatusFilter) {
  if (filter === "ALL") return true;
  if (filter === "CLOSED") return row.bidding_state === "CLOSED" && row.status === "ACTIVE";
  return row.status === filter;
}

export function DealerBidsPage() {
  const { token } = useAuth();

  const [rows, setRows] = useState<DealerBid[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<BidStatusFilter>("ALL");
  const [keyword, setKeyword] = useState("");

  const load = async () => {
    if (!token) {
      setRows([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await listMyDealerBids(token);
      setRows(data);
    } catch (err) {
      setRows([]);
      setError(err instanceof Error ? err.message : "입찰 내역 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [token]);

  const filteredRows = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();

    return rows.filter((row) => {
      if (!matchesFilter(row, filter)) return false;
      if (!normalized) return true;
      const target = `${row.title} ${row.make} ${row.model}`.toLowerCase();
      return target.includes(normalized);
    });
  }, [filter, keyword, rows]);

  const counts = useMemo(() => {
    return {
      active: rows.filter((row) => row.status === "ACTIVE" && row.bidding_state !== "CLOSED").length,
      won: rows.filter((row) => row.status === "WON").length,
      lost: rows.filter((row) => row.status === "LOST").length,
      cancelled: rows.filter((row) => row.status === "CANCELLED").length,
      closed: rows.filter((row) => row.status === "ACTIVE" && row.bidding_state === "CLOSED").length,
    };
  }, [rows]);

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-3xl font-black text-slate-900">나의 입찰</h1>
        <p className="text-sm text-slate-500">DL_010 입찰 상태별 조회 및 상세 분기</p>
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
            {dealerStatusTabs.map((tab) => (
              <Button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                size="sm"
                type="button"
                variant={filter === tab.key ? "default" : "outline"}
                className={filter === tab.key ? "bg-[#2f6ff5] hover:bg-[#2459cd]" : undefined}
              >
                {tab.label}
              </Button>
            ))}
          </div>
          <div className="grid gap-2 text-sm text-slate-500 md:grid-cols-5">
            <p>입찰중 {counts.active}건</p>
            <p>마감 {counts.closed}건</p>
            <p>낙찰 {counts.won}건</p>
            <p>미낙찰 {counts.lost}건</p>
            <p>취소 {counts.cancelled}건</p>
          </div>
          <Input placeholder="차량명 검색" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
        </CardContent>
      </Card>

      {loading && <p className="text-sm text-slate-500">입찰 내역을 불러오는 중...</p>}

      <div className="grid gap-3">
        {filteredRows.map((row) => {
          const detailState = toDealerBidDetailState(row);
          const detailPath = `/dealer/bids/${row.vehicle_id}/detail/${detailState}`;

          return (
            <Card key={row.bid_id}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">{row.title}</CardTitle>
                  {statusBadge(detailState)}
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-slate-500">
                  내 입찰가 {currencyText(row.amount, row.currency)} / 최고가 {currencyText(row.highest_bid ?? 0, row.currency)}
                </p>
                <p className="text-slate-500">마감 {new Date(row.bidding_ends_at).toLocaleString()}</p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" type="button" variant="outline">
                    <Link to={detailPath}>상세보기</Link>
                  </Button>

                  {detailState === "open" && (
                    <Button asChild size="sm" type="button">
                      <Link to={`/dealer/bids/${row.vehicle_id}/edit`}>입찰가 수정</Link>
                    </Button>
                  )}

                  {detailState === "lost" && (
                    <Button asChild size="sm" type="button" variant="secondary">
                      <Link to="/dealer/market">유사 매물 보기</Link>
                    </Button>
                  )}

                  {detailState === "won" && (
                    <Button asChild size="sm" type="button" className="bg-[#2f6ff5] hover:bg-[#2459cd]">
                      <Link to={`/dealer/transactions/${row.vehicle_id}/detail/inspection`}>거래·결제 진행</Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!loading && filteredRows.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-sm text-slate-500">조건에 맞는 입찰 내역이 없습니다.</CardContent>
        </Card>
      )}
    </section>
  );
}
