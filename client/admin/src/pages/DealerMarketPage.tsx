import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../app/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { listMarketVehicles } from "../lib/api";
import type { ListingSort, MarketListing } from "../lib/types";
import {
  biddingStateText,
  currencyText,
  daysLeftLabel,
  fallbackMarketListings,
  fuelTypeText,
  transactionTypeText,
} from "./dealer/shared";

function statusBadge(state: MarketListing["bidding_state"]) {
  if (state === "OPEN") return <Badge className="bg-[#2f6ff5]">입찰 중</Badge>;
  if (state === "CLOSING_SOON") return <Badge variant="secondary">마감 임박</Badge>;
  return <Badge variant="outline">입찰 마감</Badge>;
}

export function DealerMarketPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<MarketListing[]>([]);
  const [transactionType, setTransactionType] = useState<"" | "DOMESTIC" | "EXPORT">("");
  const [bidState, setBidState] = useState<"ALL" | "OPEN" | "CLOSING_SOON">("ALL");
  const [sort, setSort] = useState<ListingSort>("NEWEST");
  const [keyword, setKeyword] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!token) {
      setRows(fallbackMarketListings);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await listMarketVehicles(token, {
        transaction_type: transactionType || undefined,
        keyword: searchKeyword || undefined,
        sort,
        limit: 50,
      });
      setRows(data.length > 0 ? data : fallbackMarketListings);
    } catch (err) {
      setRows(fallbackMarketListings);
      setError(err instanceof Error ? err.message : "매물 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [token, transactionType, sort, searchKeyword]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (bidState !== "ALL" && row.bidding_state !== bidState) return false;

      if (!keyword.trim()) return true;
      const normalized = keyword.trim().toLowerCase();
      const target = `${row.title} ${row.license_plate || ""} ${row.make} ${row.model}`.toLowerCase();
      return target.includes(normalized);
    });
  }, [bidState, keyword, rows]);

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-3xl font-black text-slate-900">매물보기</h1>
        <p className="text-sm text-slate-500">DL_003 실시간 매물 탐색 및 입찰 진입</p>
      </header>

      <Card className="border-slate-200">
        <CardContent className="grid gap-3 pt-6 md:grid-cols-6">
          <div className="space-y-1 md:col-span-1">
            <Label htmlFor="dealer-market-type">거래유형</Label>
            <select
              id="dealer-market-type"
              value={transactionType}
              onChange={(event) => setTransactionType(event.target.value as "" | "DOMESTIC" | "EXPORT")}
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="">전체</option>
              <option value="DOMESTIC">국내 거래</option>
              <option value="EXPORT">수출 가능</option>
            </select>
          </div>
          <div className="space-y-1 md:col-span-1">
            <Label htmlFor="dealer-market-state">상태</Label>
            <select
              id="dealer-market-state"
              value={bidState}
              onChange={(event) => setBidState(event.target.value as "ALL" | "OPEN" | "CLOSING_SOON")}
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="ALL">상태 전체</option>
              <option value="OPEN">입찰 중</option>
              <option value="CLOSING_SOON">입찰 마감 임박</option>
            </select>
          </div>
          <div className="space-y-1 md:col-span-1">
            <Label htmlFor="dealer-market-sort">정렬</Label>
            <select
              id="dealer-market-sort"
              value={sort}
              onChange={(event) => setSort(event.target.value as ListingSort)}
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="NEWEST">최신 등록순</option>
              <option value="MOST_BIDS">인기순</option>
              <option value="HIGHEST_BID">최고 입찰순</option>
              <option value="LOWEST_BID">최저 입찰순</option>
            </select>
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label htmlFor="dealer-market-search">차량명 또는 차량번호</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="dealer-market-search"
                className="pl-9"
                placeholder="차량명 또는 차량번호 검색"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
            </div>
          </div>
          <div className="flex items-end md:col-span-1">
            <Button className="w-full bg-[#2f6ff5] hover:bg-[#2459cd]" onClick={() => setSearchKeyword(keyword.trim())} type="button">
              검색
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>요청 실패</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && <p className="text-sm text-slate-500">매물 목록을 불러오는 중...</p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredRows.map((row) => {
          const canBid = row.bidding_state !== "CLOSED";
          return (
            <Card key={row.id} className="border-slate-200">
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {statusBadge(row.bidding_state)}
                  <Badge variant="outline">{transactionTypeText(row.transaction_type)}</Badge>
                </div>
                <CardTitle className="text-lg text-slate-900">{row.title}</CardTitle>
                <p className="text-sm text-slate-500">
                  {row.year}년식 · {(row.mileage_km / 10000).toFixed(1)}만 km · {fuelTypeText(row.fuel_type)}
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-y-1 text-sm">
                  <span className="text-slate-500">현재 최고 입찰가</span>
                  <span className="text-right font-semibold text-slate-900">{currencyText(row.highest_bid ?? row.reserve_price, row.currency)}</span>
                  <span className="text-slate-500">입찰 건수</span>
                  <span className="text-right font-semibold text-slate-900">{row.bid_count}건</span>
                  <span className="text-slate-500">마감까지</span>
                  <span className="text-right font-semibold text-slate-900">{daysLeftLabel(row.time_left_seconds)}</span>
                </div>
                <div className="pt-2 text-xs text-slate-500">{biddingStateText(row.bidding_state)} · 차량번호 {row.license_plate || "미입력"}</div>
                <div className="grid grid-cols-2 gap-2 pt-3">
                  <Button asChild type="button" variant="outline">
                    <Link to={`/dealer/market/${row.id}`}>상세보기</Link>
                  </Button>
                  <Button asChild className="bg-[#2f6ff5] hover:bg-[#2459cd]" disabled={!canBid} type="button">
                    <Link to={`/dealer/market/${row.id}/bid`}>{row.my_bid ? "입찰 완료" : "입찰 참여"}</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!loading && filteredRows.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-sm text-slate-500">조건에 맞는 매물이 없습니다.</CardContent>
        </Card>
      )}
    </section>
  );
}
