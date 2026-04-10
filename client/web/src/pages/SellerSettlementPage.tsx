import { CheckCircle2, ChevronLeft, ChevronRight, Clock3, Download, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { useAuth } from "../app/AuthContext";
import tradeVehicleImage from "../assets/frt010-empty-vehicle.png";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { listSellerSettlementRecords } from "../lib/api";
import type { SellerSettlementRecord } from "../lib/types";
import { cn } from "../lib/utils";

type SettlementStatusFilter = "ALL" | "PENDING" | "COMPLETED";
type TransactionTypeFilter = "ALL" | "DOMESTIC" | "EXPORT";
type SettlementView = "list" | "completed" | "pending";

type DerivedSettlementRow = SellerSettlementRecord & {
  transactionType: "DOMESTIC" | "EXPORT";
  fee: number;
  settlementAmount: number;
  tradeNumber: string;
};

const perPage = 6;

function formatDateOnly(value: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildThisMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from: formatDateOnly(start.toISOString()), to: formatDateOnly(end.toISOString()) };
}

function presetRange(preset: "THIS_MONTH" | "LAST_MONTH" | "LAST_3_MONTHS") {
  const base = new Date();
  if (preset === "THIS_MONTH") {
    const start = new Date(base.getFullYear(), base.getMonth(), 1);
    const end = new Date(base.getFullYear(), base.getMonth() + 1, 0);
    return { from: formatDateOnly(start.toISOString()), to: formatDateOnly(end.toISOString()) };
  }

  if (preset === "LAST_MONTH") {
    const start = new Date(base.getFullYear(), base.getMonth() - 1, 1);
    const end = new Date(base.getFullYear(), base.getMonth(), 0);
    return { from: formatDateOnly(start.toISOString()), to: formatDateOnly(end.toISOString()) };
  }

  const start = new Date(base.getFullYear(), base.getMonth() - 2, 1);
  const end = new Date(base.getFullYear(), base.getMonth() + 1, 0);
  return { from: formatDateOnly(start.toISOString()), to: formatDateOnly(end.toISOString()) };
}

function statusBadge(status: SellerSettlementRecord["status"]) {
  if (status === "COMPLETED") {
    return <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-600">정산완료</span>;
  }

  return <span className="inline-flex rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-600">정산대기</span>;
}

function DetailCardTitle({ children }: { children: string }) {
  return <p className="text-lg font-bold text-slate-900">{children}</p>;
}

export function SellerSettlementPage() {
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [records, setRecords] = useState<SellerSettlementRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const thisMonth = buildThisMonthRange();
  const [fromDate, setFromDate] = useState(thisMonth.from);
  const [toDate, setToDate] = useState(thisMonth.to);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<SettlementStatusFilter>("ALL");
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<TransactionTypeFilter>("ALL");

  const viewParam = searchParams.get("view");
  const view: SettlementView = viewParam === "completed" || viewParam === "pending" ? viewParam : "list";
  const selectedId = searchParams.get("id");
  const currentPage = Math.max(1, Number(searchParams.get("page") || "1") || 1);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const rows = await listSellerSettlementRecords(token);
      setRecords(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "정산 데이터 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [token]);

  const rowsWithDerived = useMemo<DerivedSettlementRow[]>(() => {
    return records.map((row) => {
      const transactionType = row.currency === "KRW" ? "DOMESTIC" : "EXPORT";
      const fee = Math.round(row.winning_price * 0.021);
      const settlementAmount = Math.max(0, row.winning_price - fee);
      const dateSeed = formatDateOnly(row.sold_at ?? row.settlement_due_at).replace(/-/g, "");
      return {
        ...row,
        transactionType,
        fee,
        settlementAmount,
        tradeNumber: `PK-${dateSeed}-${row.vehicle_id.slice(0, 5).toUpperCase()}`,
      };
    });
  }, [records]);

  const filteredRows = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    return rowsWithDerived.filter((row) => {
      const soldDate = formatDateOnly(row.sold_at ?? row.settlement_due_at);
      const inDateRange = soldDate >= fromDate && soldDate <= toDate;
      const statusOk = statusFilter === "ALL" ? true : row.status === statusFilter;
      const typeOk = transactionTypeFilter === "ALL" ? true : row.transactionType === transactionTypeFilter;
      const keywordOk = normalized
        ? row.vehicle_title.toLowerCase().includes(normalized) || row.tradeNumber.toLowerCase().includes(normalized)
        : true;
      return inDateRange && statusOk && typeOk && keywordOk;
    });
  }, [fromDate, keyword, rowsWithDerived, statusFilter, toDate, transactionTypeFilter]);

  const summary = useMemo(() => {
    const completedRows = filteredRows.filter((row) => row.status === "COMPLETED");
    const pendingRows = filteredRows.filter((row) => row.status === "PENDING");
    return {
      completedCount: completedRows.length,
      completedSettlementTotal: completedRows.reduce((sum, row) => sum + row.settlementAmount, 0),
      feeTotal: filteredRows.reduce((sum, row) => sum + row.fee, 0),
      pendingCount: pendingRows.length,
    };
  }, [filteredRows]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / perPage));
  const page = Math.min(currentPage, totalPages);
  const pagedRows = filteredRows.slice((page - 1) * perPage, page * perPage);

  const detailRow = useMemo(() => {
    if (!selectedId) return filteredRows[0] ?? rowsWithDerived[0] ?? null;
    return rowsWithDerived.find((row) => row.vehicle_id === selectedId) ?? null;
  }, [filteredRows, rowsWithDerived, selectedId]);

  const openDetail = (row: DerivedSettlementRow) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("view", row.status === "COMPLETED" ? "completed" : "pending");
      next.set("id", row.vehicle_id);
      return next;
    });
  };

  const moveToList = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("view", "list");
      next.delete("id");
      return next;
    });
  };

  const changePage = (nextPage: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", String(nextPage));
      return next;
    });
  };

  const applyPreset = (preset: "THIS_MONTH" | "LAST_MONTH" | "LAST_3_MONTHS") => {
    const next = presetRange(preset);
    setFromDate(next.from);
    setToDate(next.to);
  };

  if (loading && records.length === 0) {
    return (
      <section className="mx-auto max-w-5xl">
        <Card>
          <CardContent className="pt-6 text-sm text-slate-500">정산 내역을 불러오는 중...</CardContent>
        </Card>
      </section>
    );
  }

  if (view !== "list" && detailRow) {
    const pending = view === "pending";

    return (
      <section className="mx-auto max-w-5xl space-y-4">
        <div className="flex items-center justify-between">
          <Button className="border-slate-300" onClick={moveToList} type="button" variant="outline">
            <ChevronLeft className="mr-1 h-4 w-4" /> 거래 · 정산 내역으로
          </Button>
          <Badge variant="outline">{pending ? "FRT_037" : "FRT_036"}</Badge>
        </div>

        <Alert className={cn("border", pending ? "border-amber-300 bg-amber-50" : "border-emerald-300 bg-emerald-50")}>
          {pending ? <Clock3 className="h-4 w-4 text-amber-600" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
          <AlertTitle className={pending ? "text-amber-700" : "text-emerald-700"}>
            {pending ? "정산 대기 상태입니다." : "정산이 완료되었습니다."}
          </AlertTitle>
          <AlertDescription className={pending ? "text-amber-700" : "text-emerald-700"}>
            {pending
              ? "딜러 또는 운영팀의 입금 처리 확인 후 정산이 완료됩니다."
              : "정산 금액이 판매자 계좌로 정상 입금되었습니다."}
          </AlertDescription>
        </Alert>

        <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
          <CardContent className="grid gap-0 p-0 lg:grid-cols-[1.45fr_0.95fr]">
            <div className="space-y-4 p-5 lg:p-6">
              <div className="flex flex-wrap items-center gap-2">
                {statusBadge(detailRow.status)}
                <Badge variant="outline">{pending ? "정산 대기" : "정산 완료"}</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-[1.1fr_1fr]">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  <img alt={detailRow.vehicle_title} className="h-full w-full object-contain p-3" src={tradeVehicleImage} />
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-[#2f6ff5]">거래 정산 상세</p>
                    <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950">{detailRow.vehicle_title}</p>
                    <p className="mt-2 text-sm text-slate-500">
                      거래번호 {detailRow.tradeNumber} · 완료일 {formatDateOnly(detailRow.sold_at ?? detailRow.settlement_due_at)}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">최종 거래 금액</p>
                      <p className="mt-1 font-semibold text-slate-900">{detailRow.winning_price.toLocaleString()}원</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">총 수수료 및 공제액</p>
                      <p className="mt-1 font-semibold text-rose-500">-{detailRow.fee.toLocaleString()}원</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 md:col-span-2">
                      <p className="text-xs text-slate-500">정산 금액 (수령액)</p>
                      <p className="mt-1 text-2xl font-black tracking-tight text-[#2f6ff5]">{detailRow.settlementAmount.toLocaleString()}원</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-slate-200 bg-slate-50/80 p-5 lg:border-l lg:border-t-0 lg:p-6">
              <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <p className="text-sm font-semibold text-slate-700">진행 요약</p>
                <div className="space-y-2 text-sm text-slate-600">
                  <p>{pending ? "입금 확인 대기 중입니다." : "입금 확인이 완료된 거래입니다."}</p>
                  <p>정산 상태와 관련 서류를 한 화면에서 확인할 수 있습니다.</p>
                </div>
                <div className="grid gap-2 pt-2">
                  <Button className="bg-[#2f6ff5] hover:bg-[#2459cd]" onClick={moveToList} type="button">
                    거래 · 정산 내역으로
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/seller/settlement">정산 목록으로 이동</Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3 md:grid-cols-[1.45fr_1fr]">
          <Card className="border-slate-200 shadow-none">
            <CardContent className="space-y-4 p-4">
              <DetailCardTitle>거래 기본 정보</DetailCardTitle>
              <div className="grid gap-4 md:grid-cols-[140px_1fr]">
                <div className="flex h-[92px] items-center justify-center rounded-lg border border-slate-200 bg-gradient-to-br from-slate-100 to-slate-200">
                  <span className="text-xs text-slate-500">차량 이미지</span>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-slate-900">{detailRow.vehicle_title}</p>
                  <p className="text-sm text-slate-500">2021년식 · 4.3만 km · 가솔린</p>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline">{detailRow.transactionType === "DOMESTIC" ? "국내 거래" : "해외 거래"}</Badge>
                    <Badge variant="outline">대한민국</Badge>
                  </div>
                </div>
              </div>
              <div className="grid gap-2 text-sm md:grid-cols-2">
                <p className="text-slate-500">
                  거래번호 <span className="ml-2 font-semibold text-slate-800">{detailRow.tradeNumber}</span>
                </p>
                <p className="text-slate-500">
                  거래 완료일 <span className="ml-2 font-semibold text-slate-800">{formatDateOnly(detailRow.sold_at ?? detailRow.settlement_due_at)}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-none">
            <CardContent className="space-y-3 p-4">
              <DetailCardTitle>정산 요약</DetailCardTitle>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">최종 거래 금액</span>
                  <span className="font-semibold text-slate-800">{detailRow.winning_price.toLocaleString()}원</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">총 수수료 및 공제액</span>
                  <span className="font-semibold text-rose-500">-{detailRow.fee.toLocaleString()}원</span>
                </div>
                <div className="border-t border-slate-200 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">정산 금액 (입금 완료)</span>
                    <span className="text-3xl font-black text-[#2f6ff5]">{detailRow.settlementAmount.toLocaleString()}원</span>
                  </div>
                  {!pending && <p className="mt-1 text-right text-xs text-slate-500">2025-12-08 10:15 입금 확인</p>}
                  {pending && <p className="mt-1 text-right text-xs text-slate-500">입금 처리 완료 시 정산 완료로 변경됩니다.</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-none">
            <CardContent className="space-y-3 p-4">
              <DetailCardTitle>정산 내역 상세</DetailCardTitle>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">최종 거래 금액</span>
                  <span className="font-semibold text-slate-800">{detailRow.winning_price.toLocaleString()}원</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">성능 검사비 및 탁송료</span>
                  <span className="font-semibold text-rose-500">-150,000원</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">중개 수수료 (VAT 포함)</span>
                  <span className="font-semibold text-rose-500">-{Math.max(0, detailRow.fee - 150000).toLocaleString()}원</span>
                </div>
                <div className="border-t border-slate-200 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">정산 금액 (수령액)</span>
                    <span className="text-3xl font-black text-[#2f6ff5]">{detailRow.settlementAmount.toLocaleString()}원</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-none">
            <CardContent className="space-y-3 p-4">
              <DetailCardTitle>입금/계좌 정보</DetailCardTitle>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">정산 상태</span>
                  <span className={cn("font-semibold", pending ? "text-amber-600" : "text-emerald-600")}>{pending ? "입금 확인 대기 중" : "입금 완료"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">정산 방식</span>
                  <span className="font-semibold text-slate-800">국내 계좌이체</span>
                </div>
                <div className="space-y-1 rounded-md bg-slate-50 p-2">
                  <p className="text-xs text-slate-400">정산 계좌</p>
                  <p className="font-semibold text-slate-800">국민은행 123-456-789012 (홍길동)</p>
                </div>
                {pending && <p className="text-xs text-slate-400">입금 확인 후 자동으로 정산 완료 상태로 전환됩니다.</p>}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-none">
            <CardContent className="space-y-3 p-4">
              <DetailCardTitle>명의 이전 / 말소 서류</DetailCardTitle>
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-800">자동차 말소 사실 증명서</p>
                    <p className="text-xs text-slate-500">2025-12-08 업로드됨</p>
                  </div>
                  <button className="text-xs font-semibold text-[#2f6ff5]" type="button">
                    다운로드
                  </button>
                </div>
              </div>
              <p className="text-xs font-semibold text-emerald-600">모든 서류가 정상 등록되었습니다.</p>
            </CardContent>
          </Card>
        </div>

        {!pending && (
          <div className="flex justify-end">
            <Button className="bg-[#2f6ff5] hover:bg-[#2459cd]" type="button">
              <Download className="mr-1 h-4 w-4" /> 정산 명세서 다운로드(PDF)
            </Button>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTitle>조회 실패</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h1 className="text-4xl font-extrabold text-slate-900">거래 · 정산 내역</h1>
        <p className="mt-1 text-sm text-slate-500">완료된 거래의 정산 금액과 수수료, 정산 상태를 한눈에 조회할 수 있습니다.</p>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <Card className="border-slate-200 bg-slate-50 shadow-none">
            <CardContent className="space-y-1 p-4">
              <p className="text-xs text-slate-500">이번 달 정산 완료 건수</p>
              <p className="text-4xl font-black text-slate-900">{summary.completedCount}건</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-slate-50 shadow-none">
            <CardContent className="space-y-1 p-4">
              <p className="text-xs text-slate-500">이번 달 정산 완료 금액</p>
              <p className="text-4xl font-black text-[#2f6ff5]">{summary.completedSettlementTotal.toLocaleString()}원</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-slate-50 shadow-none">
            <CardContent className="space-y-1 p-4">
              <p className="text-xs text-slate-500">이번 달 총 수수료 합계</p>
              <p className="text-4xl font-black text-slate-900">{summary.feeTotal.toLocaleString()}원</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-slate-50 shadow-none">
            <CardContent className="space-y-1 p-4">
              <p className="text-xs text-slate-500">정산 대기 건수</p>
              <p className="text-4xl font-black text-slate-900">{summary.pendingCount}건</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-4 border-slate-200 shadow-none">
          <CardContent className="space-y-3 p-4">
            <div className="grid gap-2 md:grid-cols-[1fr_auto_auto]">
              <div className="flex items-center gap-2">
                <Input onChange={(event) => setFromDate(event.target.value)} type="date" value={fromDate} />
                <span className="text-slate-400">~</span>
                <Input onChange={(event) => setToDate(event.target.value)} type="date" value={toDate} />
              </div>
              <div className="flex flex-wrap gap-1">
                <Button onClick={() => applyPreset("THIS_MONTH")} size="sm" type="button" variant="outline">
                  이번 달
                </Button>
                <Button onClick={() => applyPreset("LAST_MONTH")} size="sm" type="button" variant="outline">
                  지난 달
                </Button>
                <Button onClick={() => applyPreset("LAST_3_MONTHS")} size="sm" type="button" variant="outline">
                  최근 3개월
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
                  onChange={(event) => setTransactionTypeFilter(event.target.value as TransactionTypeFilter)}
                  value={transactionTypeFilter}
                >
                  <option value="ALL">거래 유형</option>
                  <option value="DOMESTIC">국내 거래</option>
                  <option value="EXPORT">해외(수출) 거래</option>
                </select>
                <select
                  className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
                  onChange={(event) => setStatusFilter(event.target.value as SettlementStatusFilter)}
                  value={statusFilter}
                >
                  <option value="ALL">정산 상태</option>
                  <option value="PENDING">정산대기</option>
                  <option value="COMPLETED">정산완료</option>
                </select>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                className="pl-9"
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="차량명, 차량 번호 또는 거래번호 검색"
                value={keyword}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-4 border-slate-200 shadow-none">
          <CardHeader className="pb-0">
            <CardTitle className="text-lg">정산 내역 리스트</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-2 text-right text-xs text-slate-400">총 {filteredRows.length}건의 정산 내역이 조회되었습니다.</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="py-2">거래 완료일</th>
                    <th className="py-2">차량 정보</th>
                    <th className="py-2">거래 유형</th>
                    <th className="py-2 text-right">최종 거래 금액</th>
                    <th className="py-2 text-right">수수료</th>
                    <th className="py-2 text-right">정산 금액 (수령액)</th>
                    <th className="py-2">정산일</th>
                    <th className="py-2">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedRows.map((row) => (
                    <tr key={row.vehicle_id} className="border-b border-slate-100">
                      <td className="py-3">{formatDateOnly(row.sold_at ?? row.settlement_due_at)}</td>
                      <td className="py-3">{row.vehicle_title}</td>
                      <td className="py-3">{row.transactionType === "DOMESTIC" ? "국내 거래" : "해외(수출) 거래"}</td>
                      <td className="py-3 text-right">{row.winning_price.toLocaleString()}원</td>
                      <td className="py-3 text-right">{row.fee.toLocaleString()}원</td>
                      <td className="py-3 text-right">
                        <button className="font-semibold text-[#2f6ff5] hover:underline" onClick={() => openDetail(row)} type="button">
                          {row.settlementAmount.toLocaleString()}원
                        </button>
                      </td>
                      <td className="py-3">{row.status === "COMPLETED" ? formatDateOnly(row.settlement_due_at) : "-"}</td>
                      <td className="py-3">{statusBadge(row.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!loading && !error && filteredRows.length === 0 && (
              <p className="py-10 text-center text-sm text-slate-500">조회 조건에 맞는 정산 내역이 없습니다.</p>
            )}

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 disabled:opacity-40"
                  disabled={page === 1}
                  onClick={() => changePage(page - 1)}
                  type="button"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }).map((_, index) => {
                  const number = index + 1;
                  return (
                    <button
                      key={number}
                      className={cn(
                        "inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-xs font-semibold",
                        page === number ? "border-[#2f6ff5] bg-[#edf3ff] text-[#2f6ff5]" : "border-slate-200 text-slate-500",
                      )}
                      onClick={() => changePage(number)}
                      type="button"
                    >
                      {number}
                    </button>
                  );
                })}
                <button
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 disabled:opacity-40"
                  disabled={page >= totalPages}
                  onClick={() => changePage(page + 1)}
                  type="button"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 bg-white shadow-none">
        <CardContent className="space-y-2 p-4 text-xs text-slate-500">
          <p className="font-semibold text-slate-700">정산 안내</p>
          <p>정산 금액은 최종 거래 금액에서 수수료 및 관련 비용을 차감한 금액입니다.</p>
          <p>환율/수수료 기준 및 정산 일정은 거래 유형(국내/수출)별 정책에 따라 달라질 수 있습니다.</p>
          <p>정산 내역에 이견이 있을 경우, 고객센터 1:1 문의로 접수해 주세요.</p>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>요청 실패</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </section>
  );
}
