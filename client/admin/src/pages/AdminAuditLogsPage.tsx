import { Download, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../app/AuthContext";
import { PageIntro } from "../components/common/PageIntro";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { listAdminAuditLogs } from "../lib/api";
import type { AdminAuditLogEntry } from "../lib/types";

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.toLocaleDateString("ko-KR").replace(/\. /g, ".").replace(/\.$/, "")} ${date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })}`;
}

function toneForRow(row: AdminAuditLogEntry) {
  return /fail|error|reject/i.test(`${row.event_type} ${row.message}`);
}

export function AdminAuditLogsPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<AdminAuditLogEntry[]>([]);
  const [keyword, setKeyword] = useState("");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [resultFilter, setResultFilter] = useState("ALL");
  const [periodFilter, setPeriodFilter] = useState("ALL");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      try {
        setRows(await listAdminAuditLogs(token, { limit: 100 }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "감사 로그 조회 실패");
      }
    };
    void load();
  }, [token]);

  const visibleRows = useMemo(() => {
    const needle = keyword.trim().toLowerCase();
    const now = Date.now();
    return rows.filter((row) => {
      const matchesKeyword =
        !needle || [row.title, row.message, row.actor_name ?? "", row.event_type, row.source].join(" ").toLowerCase().includes(needle);
      const matchesSource =
        sourceFilter === "ALL" ||
        (sourceFilter === "ADMIN" ? row.source.startsWith("admin") : row.source === sourceFilter.toLowerCase());
      const failed = toneForRow(row);
      const matchesResult =
        resultFilter === "ALL" || (resultFilter === "SUCCESS" ? !failed : failed);
      const timestamp = new Date(row.occurred_at).getTime();
      const age = now - timestamp;
      const matchesPeriod =
        periodFilter === "ALL"
          ? true
          : periodFilter === "TODAY"
            ? age <= 24 * 60 * 60 * 1000
            : periodFilter === "D7"
              ? age <= 7 * 24 * 60 * 60 * 1000
              : age <= 30 * 24 * 60 * 60 * 1000;
      return matchesKeyword && matchesSource && matchesResult && matchesPeriod;
    });
  }, [keyword, periodFilter, resultFilter, rows, sourceFilter]);

  const downloadCsv = () => {
    const header = ["발생 일시", "관리자", "접속 IP/출처", "로그 유형", "수행 내역", "대상", "결과"];
    const lines = visibleRows.map((row) =>
      [
        formatDateTime(row.occurred_at),
        row.actor_name || "-",
        row.source || "-",
        row.event_type,
        row.message,
        row.vehicle_id || row.target_name || "-",
        toneForRow(row) ? "실패" : "성공",
      ]
        .map((cell) => `"${String(cell).replace(/"/g, "\"\"")}"`)
        .join(","),
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `template-admin-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-4">
      <PageIntro
        title="로그/감사"
        description="운영 감사 로그를 조회합니다."
        actions={
          <div className="flex h-10 min-w-[280px] items-center gap-2 rounded-[10px] border border-[#e4e8f0] bg-white px-3">
            <Search className="h-4 w-4 text-[#8b95a7]" />
            <input
              className="w-full border-0 bg-transparent text-[13px] outline-none placeholder:text-[#a1a9b8]"
              placeholder="IP / 관리자명 / 키워드 검색"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </div>
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
          <div className="grid gap-4 md:grid-cols-[1fr_auto_auto]">
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-semibold text-[#353c4a]">로그 유형</span>
              <select
                className="h-10 rounded-md border border-[#e3e8ef] bg-white px-3 text-sm text-[#6f7c91]"
                value={sourceFilter}
                onChange={(event) => setSourceFilter(event.target.value)}
              >
                <option value="ALL">전체</option>
                <option value="ADMIN">관리자 변경</option>
                <option value="TRADE_EVENT">거래 이벤트</option>
                <option value="SUPPORT_NOTIFICATION">고객지원 알림</option>
                <option value="USER">사용자 계정</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-semibold text-[#353c4a]">결과</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "전체", value: "ALL" },
                  { label: "성공", value: "SUCCESS" },
                  { label: "실패", value: "FAILED" },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.value}
                    onClick={() => setResultFilter(item.value)}
                    className={`rounded-full border px-4 py-2 text-[13px] font-semibold ${
                      resultFilter === item.value ? "border-[#173f8f] bg-[#173f8f] text-white" : "border-[#e2e5eb] bg-white text-[#757d8d]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-semibold text-[#353c4a]">기간</span>
              <div className="flex overflow-hidden rounded-[8px] border border-[#e3e8ef] bg-white text-[12px] text-[#6f7c91]">
                {[
                  { label: "오늘", value: "TODAY" },
                  { label: "최근 7일", value: "D7" },
                  { label: "최근 30일", value: "D30" },
                  { label: "전체", value: "ALL" },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.value}
                    onClick={() => setPeriodFilter(item.value)}
                    className={`border-r px-5 py-2 last:border-r-0 ${periodFilter === item.value ? "bg-[#eef4ff] text-[#173f8f]" : "border-[#e3e8ef]"}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-[13px] text-[#5f6778]">총 {visibleRows.length}건</p>
            <Button type="button" variant="outline" className="h-9 border-[#dfe4ec] bg-white text-[#667085]" onClick={downloadCsv}>
              <Download className="mr-2 h-4 w-4" />
              CSV 다운로드
            </Button>
          </div>

          <div className="overflow-hidden rounded-[12px] border border-[#ebeff5]">
            <table className="min-w-full border-collapse text-[12px]">
              <thead>
                <tr className="bg-[#fafbfd] text-[#4b5362]">
                  <th className="border-b border-[#edf0f5] px-4 py-4 text-left font-bold">발생 일시</th>
                  <th className="border-b border-[#edf0f5] px-4 py-4 text-left font-bold">관리자</th>
                  <th className="border-b border-[#edf0f5] px-4 py-4 text-left font-bold">접속 IP</th>
                  <th className="border-b border-[#edf0f5] px-4 py-4 text-left font-bold">로그 유형</th>
                  <th className="border-b border-[#edf0f5] px-4 py-4 text-left font-bold">수행 내역 (상세)</th>
                  <th className="border-b border-[#edf0f5] px-4 py-4 text-center font-bold">대상</th>
                  <th className="border-b border-[#edf0f5] px-4 py-4 text-center font-bold">결과</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row.id} className="bg-white text-[#4b5362]">
                    <td className="border-b border-[#edf0f5] px-4 py-3">{formatDateTime(row.occurred_at)}</td>
                    <td className="border-b border-[#edf0f5] px-4 py-3">{row.actor_name || "-"}</td>
                    <td className="border-b border-[#edf0f5] px-4 py-3">{row.source || "-"}</td>
                    <td className="border-b border-[#edf0f5] px-4 py-3">{row.event_type}</td>
                    <td className="border-b border-[#edf0f5] px-4 py-3">{row.message}</td>
                    <td className="border-b border-[#edf0f5] px-4 py-3 text-center">{row.vehicle_id || row.target_name || "-"}</td>
                    <td className="border-b border-[#edf0f5] px-4 py-3 text-center">
                      <Badge variant={toneForRow(row) ? "destructive" : "secondary"}>{toneForRow(row) ? "실패" : "성공"}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visibleRows.length === 0 ? <div className="px-5 py-10 text-center text-[13px] text-[#7d8697]">검색 조건에 맞는 로그가 없습니다.</div> : null}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
