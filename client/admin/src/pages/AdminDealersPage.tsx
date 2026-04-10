import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../app/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { approveDealer, listAdminTradeWorkflows, listPendingDealersPage } from "../lib/api";
import type { TradeWorkflow, User } from "../lib/types";

type DealerStatusFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "BLACKLIST" | "WITHDRAWN";
type DealerPeriodFilter = "TODAY" | "WEEK" | "MONTH" | "ALL";

interface PendingDealer extends User {
  business_number?: string;
  business_name?: string;
  country?: string | null;
  phone?: string | null;
  created_at?: string;
}

interface DealerListRow extends PendingDealer {
  business_name: string;
  activity_count: number;
  total_bids: number;
  win_count: number;
  joined_at: string;
  latest_vehicle_title?: string;
}

const TABLE_COLUMNS = "1.06fr .92fr 1.18fr .78fr 1.26fr 1fr .7fr .72fr .82fr .82fr";

/*
  ADM_042 딜러목록 — 검색/필터/페이지네이션 및 상태별 집계 제공
  ADM_046 딜러 활동 요약 — 목록 컬럼으로 입찰·활약·가입일 등 요약 수치 제공
  Notes: These ADM code tags are for traceable scans and do not affect runtime.
*/

function dealerStatusBadge(status: PendingDealer["dealer_status"]) {
  if (status === "APPROVED") {
    return <span className="inline-flex rounded-full bg-[#eaf6e8] px-2 py-1 text-[11px] font-semibold text-[#4f8f3a]">정상</span>;
  }
  if (status === "REJECTED") {
    return <span className="inline-flex rounded-full bg-[#fde9ea] px-2 py-1 text-[11px] font-semibold text-[#c64d55]">블랙리스트</span>;
  }
  return <span className="inline-flex rounded-full bg-[#fff0cf] px-2 py-1 text-[11px] font-semibold text-[#c99926]">승인대기</span>;
}


function formatSnapshotLabel(now: Date) {
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd} ${hh}:${mi} 기준`;
}

function formatJoinedDate(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd}`;
}



function toDateStr(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}


function computePeriodRange(filter: DealerPeriodFilter, now: Date): { created_from?: string; created_to?: string } {
  if (filter === "ALL") return {};
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(end);
  if (filter === "WEEK") start.setDate(start.getDate() - 7);
  else if (filter === "MONTH") start.setDate(start.getDate() - 30);
  return { created_from: toDateStr(start), created_to: toDateStr(end) };
}

function buildDealerRows(pendingDealers: PendingDealer[], workflows: TradeWorkflow[], restrictToPending = true): DealerListRow[] {
  const map = new Map<string, DealerListRow>();

  for (const dealer of pendingDealers) {
    map.set(dealer.id, {
      ...dealer,
      business_name: dealer.business_name || `${dealer.full_name} 오토`,
      country: dealer.country || "대한민국",
      phone: dealer.phone || "-",
      activity_count: 0,
      total_bids: 0,
      win_count: 0,
      joined_at: dealer.created_at || "",
      latest_vehicle_title: undefined,
    });
  }

  for (const workflow of workflows) {
    const current = map.get(workflow.dealer_id);
    if (!current && restrictToPending) {
      // Skip creating non-pending entries when restricting output to pending-only
      continue;
    }
    const existing =
      current || {
        id: workflow.dealer_id,
        email: workflow.dealer_email || "-",
        full_name: workflow.dealer_name || "이름 미상",
        role: "DEALER" as const,
        dealer_status: "APPROVED" as const,
        business_number: undefined,
        business_name: `${workflow.dealer_name || "운영"} 오토`,
        country: "대한민국",
        phone: workflow.dealer_phone || "-",
        activity_count: 0,
        total_bids: 0,
        win_count: 0,
        joined_at: workflow.created_at,
        latest_vehicle_title: workflow.vehicle_title,
      };

    existing.email = workflow.dealer_email || existing.email;
    existing.full_name = workflow.dealer_name || existing.full_name;
    existing.phone = workflow.dealer_phone || existing.phone;
    existing.joined_at = existing.joined_at || workflow.created_at;
    existing.latest_vehicle_title = workflow.vehicle_title;
    existing.activity_count += workflow.current_stage === "CANCELLED" ? 0 : 1;
    existing.total_bids += 1;
    if (workflow.current_stage === "COMPLETED" || workflow.settlement_status === "COMPLETED") {
      existing.win_count += 1;
    }
    map.set(workflow.dealer_id, existing);
  }

  return [...map.values()].sort((left, right) => {
    const leftPending = left.dealer_status === "PENDING" ? 1 : 0;
    const rightPending = right.dealer_status === "PENDING" ? 1 : 0;
    if (leftPending !== rightPending) return rightPending - leftPending;
    if (right.total_bids !== left.total_bids) return right.total_bids - left.total_bids;
    return left.full_name.localeCompare(right.full_name, "ko");
  });
}

export function AdminDealersPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<DealerListRow[]>([]);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<DealerStatusFilter>("ALL");
  const [periodFilter, setPeriodFilter] = useState<DealerPeriodFilter>("ALL");
  const [offset, setOffset] = useState(0);
  const [limit] = useState(20);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const now = useMemo(() => new Date(), []);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [pendingPage, workflows] = await Promise.all([
        (() => { const q = keyword.trim(); const range = computePeriodRange(periodFilter, now); return listPendingDealersPage(token, { offset, limit, q: q || undefined, created_from: range.created_from, created_to: range.created_to }); })(),
        listAdminTradeWorkflows(token, { limit: 100 }),
      ]);
      setRows(buildDealerRows((pendingPage.items as PendingDealer[]), workflows as TradeWorkflow[], true));
      setTotalCount(pendingPage.totalCount);
      setNextOffset(pendingPage.nextOffset);
    } catch (err) {
      setRows([]);
      setError(err instanceof Error ? err.message : "딜러 목록 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [token, offset, limit, keyword, periodFilter]);

  useEffect(() => {
    setOffset(0);
  }, [keyword, periodFilter]);

    const counts = useMemo(
    () => ({
      ALL: rows.length,
      PENDING: rows.filter((row) => row.dealer_status === "PENDING").length,
      APPROVED: rows.filter((row) => row.dealer_status === "APPROVED").length,
      REJECTED: rows.filter((row) => row.dealer_status === "REJECTED").length,
      BLACKLIST: rows.filter((row) => row.dealer_status === "REJECTED").length,
      WITHDRAWN: 0,
    }),
    [rows],
  );

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = totalCount != null ? Math.max(1, Math.ceil(totalCount / limit)) : currentPage;

  const quickApprove = async (dealerId: string) => {
    if (!token) return;
    setSubmittingId(dealerId);
    setError(null);
    try {
      await approveDealer(token, dealerId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "딜러 승인 실패");
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <section className="space-y-4">
      <div className="space-y-1 border-b border-[#e8ebf2] pb-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[28px] font-bold tracking-[-0.03em] text-[#1b2333]">딜러 관리</h1>
          <p className="text-xs font-medium text-[#7d8596]">{formatSnapshotLabel(now)}</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>조회 실패</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="border-[#e5e8f0] bg-white shadow-none">
        <CardContent className="space-y-5 px-6 py-5">
          <div className="flex flex-wrap items-center gap-2">
            {[
              ["ALL", "전체"],
              ["PENDING", "승인대기"],
              ["APPROVED", "승인"],
              ["REJECTED", "반려"],
              ["BLACKLIST", "블랙리스트"],
              ["WITHDRAWN", "탈퇴"],
            ].map(([value, label]) => {
              const active = statusFilter === value;
              return (
                <button
                  key={value}
                  type="button"
                  className={`rounded-full border px-3 py-[7px] text-xs font-semibold transition ${
                    active ? "border-[#1d3260] bg-[#1d3260] text-white" : "border-[#dde2eb] bg-white text-[#5f697e]"
                  }`}
                  onClick={() => setStatusFilter(value as DealerStatusFilter)}
                >
                  {label} {counts[value as keyof typeof counts] > 0 ? counts[value as keyof typeof counts] : ""}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-[#667085]">기간</span>
            <div className="flex flex-wrap gap-2">
              {[
                ["TODAY", "오늘"],
                ["WEEK", "최근 7일"],
                ["MONTH", "최근 30일"],
                ["ALL", "전체"],
              ].map(([value, label]) => {
                const active = periodFilter === value;
                return (
                  <button
                    key={value}
                    type="button"
                    className={`rounded-[10px] border px-4 py-[9px] text-xs font-semibold transition ${
                      active ? "border-[#cfd6e6] bg-[#f5f7fb] text-[#1f2937]" : "border-[#e4e8f0] bg-white text-[#8a93a5]"
                    }`}
                    onClick={() => setPeriodFilter(value as DealerPeriodFilter)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="ml-auto flex flex-1 flex-wrap items-center justify-end gap-2">
              <span className="text-xs font-semibold text-[#667085]">검색</span>
              <Input
                className="h-10 min-w-[260px] max-w-[360px] border-[#dfe4ed] bg-white text-sm shadow-none"
                placeholder="딜러ID / 딜러명 / 이메일 / 연락처 검색"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                className="h-10 border-[#dfe4ed] text-[#4f5b72]"
                onClick={() => {
                  setKeyword("");
                  setPeriodFilter("ALL");
                }}
              >
                초기화
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#e5e8f0] bg-white shadow-none">
        <CardContent className="px-6 py-5">
          <p className="text-xs font-semibold text-[#6e7788]">총 {totalCount ?? 0}건</p>

          {loading && <p className="mt-4 text-sm text-muted-foreground">딜러 목록을 불러오는 중...</p>}

          <div className="mt-4 overflow-hidden rounded-[18px] border border-[#eceff5]">
            <div
              className="grid items-center gap-4 border-b border-[#eceff5] bg-[#f8fafc] px-5 py-4 text-[12px] font-semibold text-[#7a8598]"
              style={{ gridTemplateColumns: TABLE_COLUMNS }}
            >
              <span>딜러ID</span>
              <span>딜러명</span>
              <span>업체명</span>
              <span>활동국가</span>
              <span>이메일</span>
              <span>연락처</span>
              <span>입찰 횟수</span>
              <span>누적 활약</span>
              <span>상태</span>
              <span>가입일</span>
            </div>

            {rows.map((row) => (
              <div
                key={row.id}
                className="grid items-center gap-4 border-b border-[#f1f4f8] px-5 py-4 text-[13px] text-[#384152] last:border-b-0"
                style={{ gridTemplateColumns: TABLE_COLUMNS }}
              >
                <div className="space-y-2">
                  <Link className="font-semibold text-[#4b6de6]" to={`/admin/dealers/${row.id}`}>
                    {row.id}
                  </Link>
                  {row.dealer_status === "PENDING" && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 border-[#d7deea] px-2 text-[11px] text-[#50607a]"
                      disabled={submittingId === row.id}
                      onClick={() => void quickApprove(row.id)}
                    >
                      {submittingId === row.id ? "승인 중..." : "즉시 승인"}
                    </Button>
                  )}
                </div>
                <span className="font-medium">{row.full_name}</span>
                <span className="text-[#596377]">{row.business_name}</span>
                <span className="text-[#596377]">{row.country || "대한민국"}</span>
                <span className="truncate text-[#596377]">{row.email}</span>
                <span className="text-[#596377]">{row.phone || "-"}</span>
                <span className="text-[#596377]">{row.total_bids > 0 ? `${row.total_bids}건` : "-"}</span>
                <span className="text-[#596377]">{row.win_count > 0 ? `${row.win_count}건` : "-"}</span>
                <div className="flex items-center">{dealerStatusBadge(row.dealer_status)}</div>
                <span className="text-[#596377]">{formatJoinedDate(row.joined_at)}</span>
              </div>
            ))}

            {!loading && rows.length === 0 && (
              <div className="px-5 py-14 text-center text-sm text-[#8a93a5]">조건에 맞는 딜러가 없습니다.</div>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex h-10 items-center gap-2 rounded-[10px] border border-[#e0e5ef] px-3 text-sm text-[#606a80]">
              <span>{limit}</span>
              <span className="text-xs">▼</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={offset <= 0}
                onClick={() => setOffset((prev) => Math.max(0, prev - limit))}
              >
                이전
              </Button>
              <Badge variant="outline">
                {currentPage} / {totalPages}
              </Badge>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={nextOffset == null}
                onClick={() => nextOffset != null && setOffset(nextOffset)}
              >
                다음
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
