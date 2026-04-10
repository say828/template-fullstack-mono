import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../app/AuthContext";
import { PageIntro } from "../components/common/PageIntro";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { listAdminSettlementRecords } from "../lib/api";
import type { AdminSettlementRecord } from "../lib/types";

function formatAmount(value: number, currency: string) {
  return `${Math.round(value).toLocaleString()} ${currency}`;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("ko-KR").replace(/\. /g, ".").replace(/\.$/, "");
}

export function AdminSettlementPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<AdminSettlementRecord[]>([]);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | AdminSettlementRecord["status"]>("ALL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      setRows(await listAdminSettlementRecords(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : "정산 관리 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [token]);

  const visibleRows = useMemo(() => {
    const lower = keyword.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter !== "ALL" && row.status !== statusFilter) return false;
      if (!lower) return true;
      return [row.vehicle_id, row.vehicle_title, row.seller_name ?? "", row.seller_email ?? ""].join(" ").toLowerCase().includes(lower);
    });
  }, [keyword, rows, statusFilter]);

  const summary = useMemo(() => {
    const pendingRows = rows.filter((row) => row.status === "PENDING");
    const completedRows = rows.filter((row) => row.status === "COMPLETED");
    const pendingAmount = pendingRows.reduce((sum, row) => sum + row.winning_price, 0);
    const feeAmount = rows.reduce((sum, row) => sum + row.winning_price * 0.1, 0);
    return {
      pending: pendingRows.length,
      completed: completedRows.length,
      pendingAmount,
      feeAmount,
    };
  }, [rows]);

  return (
    <section className="space-y-4">
      <PageIntro
        title="판매자 정산 관리"
        description="실제 정산 데이터를 기준으로 대기/완료 현황을 확인합니다."
        actions={
          <Button type="button" variant="outline" className="h-9 border-[#dfe4ec] bg-white text-[#667085]" onClick={() => void load()}>
            새로고침
          </Button>
        }
      />

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>조회 실패</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-2">
            {[
              ["ALL", "전체"],
              ["PENDING", "정산 대기"],
              ["COMPLETED", "정산 완료"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatusFilter(value as "ALL" | AdminSettlementRecord["status"])}
                className={`rounded-full border px-4 py-2 text-[13px] font-semibold ${statusFilter === value ? "border-[#173f8f] bg-[#173f8f] text-white" : "border-[#e2e5eb] bg-white text-[#757d8d]"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-[#353c4a]">
              <span>기간</span>
              <div className="flex overflow-hidden rounded-[8px] border border-[#e3e8ef] bg-white text-[12px] text-[#6f7c91]">
                {["오늘", "최근 7일", "최근 30일", "전체"].map((item) => (
                  <span key={item} className="border-r border-[#e3e8ef] px-5 py-2 last:border-r-0">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex min-w-[360px] flex-1 items-center gap-3">
              <span className="text-[13px] font-semibold text-[#353c4a]">검색</span>
              <Input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="거래 ID / 차량번호 / 판매자 검색" />
              <Button type="button" variant="outline" className="h-10 border-[#e3e8ef] bg-white text-[#667085]" onClick={() => setKeyword("")}>
                초기화
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-4">
        <Card><CardContent className="space-y-2 p-5"><p className="text-sm text-muted-foreground">정산 대기</p><p className="text-[32px] font-black text-[#1f2937]">{summary.pending}건</p></CardContent></Card>
        <Card><CardContent className="space-y-2 p-5"><p className="text-sm text-muted-foreground">대기 총액</p><p className="text-[32px] font-black text-[#1f2937]">{Math.round(summary.pendingAmount).toLocaleString()}원</p></CardContent></Card>
        <Card><CardContent className="space-y-2 p-5"><p className="text-sm text-muted-foreground">정산 완료</p><p className="text-[32px] font-black text-[#1f2937]">{summary.completed}건</p></CardContent></Card>
        <Card><CardContent className="space-y-2 p-5"><p className="text-sm text-muted-foreground">수수료 수익</p><p className="text-[32px] font-black text-[#1f2937]">{Math.round(summary.feeAmount).toLocaleString()}원</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">정산 목록</CardTitle></CardHeader>
        <CardContent>
          <p className="text-[13px] text-[#5f6778]">총 {visibleRows.length}건</p>
          <div className="mt-4 overflow-hidden rounded-[12px] border border-[#ebeff5]">
            <table className="min-w-full border-collapse text-[12px]">
              <thead>
                <tr className="bg-[#fafbfd] text-[#4b5362]">
                  <th className="border-b border-[#edf0f5] px-4 py-4 text-left font-bold">거래ID</th>
                  <th className="border-b border-[#edf0f5] px-4 py-4 text-left font-bold">차량 정보</th>
                  <th className="border-b border-[#edf0f5] px-4 py-4 text-left font-bold">판매자</th>
                  <th className="border-b border-[#edf0f5] px-4 py-4 text-right font-bold">송금액 (A)</th>
                  <th className="border-b border-[#edf0f5] px-4 py-4 text-right font-bold">수수료 (B:10%)</th>
                  <th className="border-b border-[#edf0f5] px-4 py-4 text-right font-bold">정산액 (A-B)</th>
                  <th className="border-b border-[#edf0f5] px-4 py-4 text-center font-bold">상태</th>
                  <th className="border-b border-[#edf0f5] px-4 py-4 text-center font-bold">최종 업데이트</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => {
                  const fee = row.winning_price * 0.1;
                  const payout = row.winning_price - fee;
                  return (
                    <tr key={row.vehicle_id} className="bg-white text-[#4b5362]">
                      <td className="border-b border-[#edf0f5] px-4 py-3 font-semibold text-[#5a7fe5]">
                        <Link to={`/admin/settlements/${row.vehicle_id}`}>{row.vehicle_id}</Link>
                      </td>
                      <td className="border-b border-[#edf0f5] px-4 py-3">
                        <p className="font-semibold text-[#333b4a]">{row.vehicle_title}</p>
                        <p className="mt-1 text-[11px] text-[#8a93a3]">{row.sold_at ? `${formatDate(row.sold_at)} | ` : ""}{formatAmount(row.winning_price, row.currency)}</p>
                      </td>
                      <td className="border-b border-[#edf0f5] px-4 py-3">{row.seller_name || "-"}</td>
                      <td className="border-b border-[#edf0f5] px-4 py-3 text-right font-semibold">{formatAmount(row.winning_price, row.currency)}</td>
                      <td className="border-b border-[#edf0f5] px-4 py-3 text-right font-semibold">-{formatAmount(fee, row.currency)}</td>
                      <td className="border-b border-[#edf0f5] px-4 py-3 text-right font-semibold">{formatAmount(payout, row.currency)}</td>
                      <td className="border-b border-[#edf0f5] px-4 py-3 text-center">
                        <Badge variant={row.status === "COMPLETED" ? "secondary" : "default"}>{row.status === "COMPLETED" ? "정산 완료" : "정산 대기"}</Badge>
                      </td>
                      <td className="border-b border-[#edf0f5] px-4 py-3 text-center">{formatDate(row.settlement_due_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {!loading && visibleRows.length === 0 ? (
              <div className="px-5 py-10 text-center text-[13px] text-[#7d8697]">필터 조건에 맞는 정산 건이 없습니다.</div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
