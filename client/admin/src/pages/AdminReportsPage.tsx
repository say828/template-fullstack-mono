import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../app/AuthContext";
import { PageIntro } from "../components/common/PageIntro";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  listAdminBlacklistEntries,
  listAdminSettlementRecords,
  listAdminTradeWorkflows,
  listSupportNotices,
} from "../lib/api";
import type { AdminBlacklistEntry, AdminSettlementRecord, SupportNotice, TradeWorkflow } from "../lib/types";

function formatAmount(value?: number | null, currency = "KRW") {
  if (!Number.isFinite(value ?? NaN)) return "-";
  return `${Math.round(value ?? 0).toLocaleString()} ${currency}`;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("ko-KR").replace(/\. /g, ".").replace(/\.$/, "");
}

function stageBarWidth(count: number, total: number) {
  if (!total) return "0%";
  return `${Math.max(12, Math.round((count / total) * 100))}%`;
}

export function AdminReportsPage() {
  const { token } = useAuth();
  const [tradeRows, setTradeRows] = useState<TradeWorkflow[]>([]);
  const [settlementRows, setSettlementRows] = useState<AdminSettlementRecord[]>([]);
  const [blacklistRows, setBlacklistRows] = useState<AdminBlacklistEntry[]>([]);
  const [noticeRows, setNoticeRows] = useState<SupportNotice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [tradeData, settlementData, blacklistData, noticeData] = await Promise.all([
        listAdminTradeWorkflows(token, { limit: 100 }),
        listAdminSettlementRecords(token),
        listAdminBlacklistEntries(token, { limit: 100 }),
        listSupportNotices({ limit: 20 }),
      ]);
      setTradeRows(tradeData);
      setSettlementRows(settlementData);
      setBlacklistRows(blacklistData);
      setNoticeRows(noticeData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "리포트 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [token]);

  const tradeSummary = useMemo(() => {
    const total = tradeRows.length;
    const active = tradeRows.filter((row) => !["COMPLETED", "CANCELLED"].includes(row.current_stage)).length;
    const completed = tradeRows.filter((row) => row.current_stage === "COMPLETED").length;
    const inspection = tradeRows.filter((row) => row.current_stage === "INSPECTION").length;
    const depreciation = tradeRows.filter((row) => row.current_stage === "DEPRECIATION").length;
    const delivery = tradeRows.filter((row) => row.current_stage === "DELIVERY").length;
    return { total, active, completed, inspection, depreciation, delivery };
  }, [tradeRows]);

  const recentTrades = useMemo(
    () => [...tradeRows].sort((left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime()).slice(0, 5),
    [tradeRows],
  );

  const dealerRanking = useMemo(() => {
    const ranking = new Map<string, { name: string; trades: number; amount: number }>();
    tradeRows.forEach((row) => {
      const key = row.dealer_id;
      const current = ranking.get(key) ?? { name: row.dealer_name || "-", trades: 0, amount: 0 };
      current.trades += 1;
      current.amount += row.agreed_price ?? row.base_price;
      ranking.set(key, current);
    });
    return [...ranking.values()].sort((left, right) => right.amount - left.amount).slice(0, 5);
  }, [tradeRows]);

  const urgentSettlements = useMemo(
    () => settlementRows.filter((row) => row.status === "PENDING").sort((left, right) => new Date(left.settlement_due_at).getTime() - new Date(right.settlement_due_at).getTime()).slice(0, 5),
    [settlementRows],
  );

  const activeBlacklist = useMemo(
    () => blacklistRows.filter((row) => !row.released_at).sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime()).slice(0, 5),
    [blacklistRows],
  );

  const latestNotices = useMemo(
    () => [...noticeRows].sort((left, right) => new Date(right.published_at).getTime() - new Date(left.published_at).getTime()).slice(0, 5),
    [noticeRows],
  );

  return (
    <section className="space-y-4">
      <PageIntro
        title="리포트"
        description="운영 데이터를 기준으로 거래, 정산, 블랙리스트, 공지 현황을 요약합니다."
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

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card><CardContent className="space-y-2 p-5"><p className="text-sm text-muted-foreground">총 거래 수</p><p className="text-[28px] font-black">{tradeSummary.total}건</p></CardContent></Card>
        <Card><CardContent className="space-y-2 p-5"><p className="text-sm text-muted-foreground">평균 감가율</p><p className="text-[28px] font-black">{tradeRows.length ? `${Math.round((tradeRows.reduce((sum, row) => sum + ((row.depreciation_total ?? 0) / Math.max(1, row.base_price)), 0) / tradeRows.length) * 1000) / 10}%` : "0%"}</p></CardContent></Card>
        <Card><CardContent className="space-y-2 p-5"><p className="text-sm text-muted-foreground">평균 거래 소요시간</p><p className="text-[28px] font-black">{tradeRows.length ? `${(tradeRows.reduce((sum, row) => sum + Math.max(0, (new Date(row.updated_at).getTime() - new Date(row.created_at).getTime()) / 86400000), 0) / tradeRows.length).toFixed(1)}일` : "0일"}</p></CardContent></Card>
        <Card><CardContent className="space-y-2 p-5"><p className="text-sm text-muted-foreground">총 거래액 (GMV)</p><p className="text-[28px] font-black">{formatAmount(tradeRows.reduce((sum, row) => sum + (row.agreed_price ?? row.base_price), 0))}</p></CardContent></Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader><CardTitle className="text-base">감가율 분포</CardTitle></CardHeader>
          <CardContent>
            <div className="grid h-[190px] grid-cols-6 items-end gap-3 pt-1">
              {[
                { label: "0%", count: tradeRows.filter((row) => (row.depreciation_total ?? 0) === 0).length },
                { label: "1~3%", count: tradeRows.filter((row) => ((row.depreciation_total ?? 0) / Math.max(1, row.base_price)) > 0 && ((row.depreciation_total ?? 0) / Math.max(1, row.base_price)) <= 0.03).length },
                { label: "3~5%", count: tradeRows.filter((row) => ((row.depreciation_total ?? 0) / Math.max(1, row.base_price)) > 0.03 && ((row.depreciation_total ?? 0) / Math.max(1, row.base_price)) <= 0.05).length },
                { label: "5~8%", count: tradeRows.filter((row) => ((row.depreciation_total ?? 0) / Math.max(1, row.base_price)) > 0.05 && ((row.depreciation_total ?? 0) / Math.max(1, row.base_price)) <= 0.08).length },
                { label: "8~10%", count: tradeRows.filter((row) => ((row.depreciation_total ?? 0) / Math.max(1, row.base_price)) > 0.08 && ((row.depreciation_total ?? 0) / Math.max(1, row.base_price)) <= 0.1).length },
                { label: "10% 이상", count: tradeRows.filter((row) => ((row.depreciation_total ?? 0) / Math.max(1, row.base_price)) > 0.1).length },
              ].map((bucket, index) => (
                <div key={bucket.label} className="flex h-full flex-col justify-end">
                  <div className="rounded-t-[6px] bg-[#3c6de0]" style={{ height: `${Math.max(28, bucket.count * 16 + index * 8)}px` }} />
                  <p className="pt-3 text-center text-[11px] text-[#687385]">{bucket.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">거래 단계별 전환 및 이탈</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "입찰중", count: tradeSummary.active },
              { label: "검차/감가", count: tradeSummary.inspection + tradeSummary.depreciation },
              { label: "인도", count: tradeSummary.delivery },
              { label: "정산/완료", count: tradeSummary.completed + settlementRows.length },
            ].map((item, index) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className={`h-10 rounded-r-[10px] ${["bg-[#7d72e7]", "bg-[#7fa7ef]", "bg-[#85c39d]", "bg-[#c4d94b]"][index]}`} style={{ width: stageBarWidth(item.count, Math.max(1, tradeSummary.total)) }} />
                <span className="rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-[#5f6a7b] shadow-sm">
                  {item.label}: {item.count}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">단계별 평균 소요 시간</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          {[
            { label: "입찰기간", value: 2.5 },
            { label: "검차대기", value: 2.0 },
            { label: "감가협의", value: 1.2 },
            { label: "인도/정산", value: 0.8 },
          ].map((item, index) => (
            <div key={item.label} className="grid grid-cols-[88px_1fr_56px] items-center gap-4 text-[12px]">
              <span className="text-[#5e6778]">{item.label}</span>
              <div className="h-4 rounded-full bg-[#eef2f8]">
                <div className="h-4 rounded-full bg-[#7d72e7]" style={{ width: `${Math.max(18, item.value * 38 + index * 14)}%` }} />
              </div>
              <span className="text-[#70798a]">{item.value}일</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">우수/관리 딜러 랭킹</CardTitle></CardHeader>
        <CardContent className="overflow-hidden rounded-[12px] border border-[#ebeff5] p-0">
          <table className="min-w-full border-collapse text-[12px]">
            <thead>
              <tr className="bg-[#fafbfd] text-[#4b5362]">
                <th className="border-b border-[#edf0f5] px-4 py-4 text-center font-bold">순위</th>
                <th className="border-b border-[#edf0f5] px-4 py-4 text-left font-bold">딜러</th>
                <th className="border-b border-[#edf0f5] px-4 py-4 text-right font-bold">낙찰 성공</th>
                <th className="border-b border-[#edf0f5] px-4 py-4 text-right font-bold">거래 완료율</th>
                <th className="border-b border-[#edf0f5] px-4 py-4 text-right font-bold">총 매입액</th>
              </tr>
            </thead>
            <tbody>
              {dealerRanking.map((dealer, index) => (
                <tr key={`${dealer.name}-${index}`} className="bg-white text-[#4b5362]">
                  <td className="border-b border-[#edf0f5] px-4 py-3 text-center">{index + 1}</td>
                  <td className="border-b border-[#edf0f5] px-4 py-3 font-semibold text-[#333b4a]">{dealer.name}</td>
                  <td className="border-b border-[#edf0f5] px-4 py-3 text-right">{dealer.trades}건</td>
                  <td className="border-b border-[#edf0f5] px-4 py-3 text-right">
                    <div className="ml-auto flex w-[120px] items-center gap-2">
                      <div className="h-2 flex-1 rounded-full bg-[#edf1f6]">
                        <div className="h-2 rounded-full bg-[#23a25d]" style={{ width: `${Math.min(100, dealer.trades * 20)}%` }} />
                      </div>
                      <span>{Math.min(100, dealer.trades * 20)}%</span>
                    </div>
                  </td>
                  <td className="border-b border-[#edf0f5] px-4 py-3 text-right font-semibold">{formatAmount(dealer.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">최근 거래 운영</CardTitle>
            <Button asChild variant="outline" className="h-8 border-[#dfe4ec] bg-white text-[#667085]"><Link to="/admin/trades">거래 운영으로</Link></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTrades.map((row) => (
              <div key={row.id} className="rounded-[12px] border border-[#e7ebf1] px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#293140]">{row.vehicle_title}</p>
                    <p className="mt-1 text-[12px] text-[#6e788a]">판매자 {row.seller_name || "-"} · 딜러 {row.dealer_name || "-"}</p>
                    <p className="mt-1 text-[12px] text-[#8a93a3]">기준가 {formatAmount(row.base_price, row.currency)} · 합의가 {formatAmount(row.agreed_price ?? row.base_price, row.currency)}</p>
                  </div>
                  <Badge variant={row.current_stage === "COMPLETED" ? "secondary" : "default"}>{row.current_stage === "COMPLETED" ? "완료" : "진행중"}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">긴급 정산 대기</CardTitle>
            <Button asChild variant="outline" className="h-8 border-[#dfe4ec] bg-white text-[#667085]"><Link to="/admin/settlements">정산 관리로</Link></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {urgentSettlements.map((row) => (
              <div key={row.vehicle_id} className="rounded-[12px] border border-[#e7ebf1] px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#293140]">{row.vehicle_title}</p>
                    <p className="mt-1 text-[12px] text-[#6e788a]">{row.seller_name || "-"}</p>
                    <p className="mt-1 text-[12px] text-[#8a93a3]">예정일 {formatDate(row.settlement_due_at)} · 거래일 {formatDate(row.sold_at)}</p>
                  </div>
                  <Badge>정산 대기</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">활성 블랙리스트</CardTitle>
            <Button asChild variant="outline" className="h-8 border-[#dfe4ec] bg-white text-[#667085]"><Link to="/admin/blacklist">블랙리스트로</Link></Button>
          </CardHeader>
          <CardContent className="overflow-hidden rounded-[12px] border border-[#ebeff5] p-0">
            <table className="min-w-full border-collapse text-[12px]">
              <thead>
                <tr className="bg-[#fafbfd] text-[#4b5362]">
                  <th className="border-b border-[#edf0f5] px-4 py-4 text-left font-bold">대상</th>
                  <th className="border-b border-[#edf0f5] px-4 py-4 text-center font-bold">역할</th>
                  <th className="border-b border-[#edf0f5] px-4 py-4 text-left font-bold">사유</th>
                  <th className="border-b border-[#edf0f5] px-4 py-4 text-center font-bold">등록일</th>
                </tr>
              </thead>
              <tbody>
                {activeBlacklist.map((row) => (
                  <tr key={row.entry_id} className="bg-white text-[#4b5362]">
                    <td className="border-b border-[#edf0f5] px-4 py-3 font-semibold text-[#333b4a]">{row.full_name || row.email || "-"}</td>
                    <td className="border-b border-[#edf0f5] px-4 py-3 text-center">{row.role || "-"}</td>
                    <td className="border-b border-[#edf0f5] px-4 py-3">{row.reason}</td>
                    <td className="border-b border-[#edf0f5] px-4 py-3 text-center">{formatDate(row.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Support 공지 현황</CardTitle>
            <Button asChild variant="outline" className="h-8 border-[#dfe4ec] bg-white text-[#667085]"><Link to="/admin/support/notices">공지 목록으로</Link></Button>
          </CardHeader>
          <CardContent className="overflow-hidden rounded-[12px] border border-[#ebeff5] p-0">
            <table className="min-w-full border-collapse text-[12px]">
              <thead>
                <tr className="bg-[#fafbfd] text-[#4b5362]">
                  <th className="border-b border-[#edf0f5] px-4 py-4 text-left font-bold">제목</th>
                  <th className="border-b border-[#edf0f5] px-4 py-4 text-center font-bold">고정</th>
                  <th className="border-b border-[#edf0f5] px-4 py-4 text-center font-bold">게시일</th>
                </tr>
              </thead>
              <tbody>
                {latestNotices.map((row) => (
                  <tr key={row.id} className="bg-white text-[#4b5362]">
                    <td className="border-b border-[#edf0f5] px-4 py-3 font-semibold text-[#333b4a]">{row.title}</td>
                    <td className="border-b border-[#edf0f5] px-4 py-3 text-center">{row.is_pinned ? <Badge>고정</Badge> : "-"}</td>
                    <td className="border-b border-[#edf0f5] px-4 py-3 text-center">{formatDate(row.published_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {loading ? <p className="text-[12px] text-[#8a93a3]">리포트 데이터를 새로 불러오는 중입니다.</p> : null}
    </section>
  );
}
