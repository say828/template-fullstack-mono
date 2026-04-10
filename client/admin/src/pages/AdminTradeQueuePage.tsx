import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../app/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { listAdminTradeWorkflows } from "../lib/api";
import type { TradeStage, TradeWorkflow } from "../lib/types";
import { adminStageLabel, workflowQueueStatus } from "./adminTradeShared";

type QueueKind = "trades" | "inspections" | "depreciations" | "deliveries";
type FilterStage = "ALL" | TradeStage;

interface AdminTradeQueuePageProps {
  kind: QueueKind;
}

const stageMap: Record<QueueKind, TradeStage | null> = {
  trades: null,
  inspections: "INSPECTION",
  depreciations: "DEPRECIATION",
  deliveries: "DELIVERY",
};

const copyMap: Record<QueueKind, { title: string; code: string }> = {
  trades: { title: "거래 관리", code: "ADM_007" },
  inspections: { title: "검차 · 감가 관리", code: "ADM_019" },
  depreciations: { title: "감가 협의 관리", code: "ADM_025" },
  deliveries: { title: "인도 관리", code: "ADM_029" },
};

const filterTabs: Array<{ label: string; value: FilterStage }> = [
  { label: "전체", value: "ALL" },
  { label: "입찰중", value: "INSPECTION" },
  { label: "검차", value: "DEPRECIATION" },
  { label: "감가 협의", value: "DELIVERY" },
  { label: "인도/정산", value: "SETTLEMENT" },
  { label: "거래완료", value: "COMPLETED" },
  { label: "취소", value: "CANCELLED" },
];

function buildDetailPath(kind: QueueKind, workflow: TradeWorkflow) {
  if (kind === "inspections") return `/admin/inspections/${workflow.vehicle_id}`;
  if (kind === "depreciations") return `/admin/depreciations/${workflow.vehicle_id}`;
  if (kind === "deliveries") return `/admin/deliveries/${workflow.vehicle_id}`;
  return `/admin/trades/${workflow.vehicle_id}`;
}

function formatStagePill(stage: TradeStage) {
  if (stage === "COMPLETED") return "bg-[#edf8f0] text-[#3d8b53]";
  if (stage === "CANCELLED") return "bg-[#fff1f1] text-[#d36f6f]";
  if (stage === "SETTLEMENT") return "bg-[#f1edff] text-[#7567d8]";
  if (stage === "DELIVERY") return "bg-[#fdf2ff] text-[#c34dd6]";
  if (stage === "DEPRECIATION") return "bg-[#fff8e8] text-[#d5a842]";
  return "bg-[#eef3ff] text-[#4770d3]";
}

function StepCircle({ active }: { active: boolean }) {
  return <span className={`inline-block h-3 w-3 rounded-full border ${active ? "border-[#2fab66] bg-[#2fab66]" : "border-[#cfd7e4] bg-white"}`} />;
}

function formatSlaTone(row: TradeWorkflow) {
  if (row.current_stage === "SETTLEMENT") return "#df5c49";
  if (row.current_stage === "COMPLETED" || row.current_stage === "CANCELLED") return "#1f232b";
  return "#7c8493";
}

function isStepComplete(row: TradeWorkflow, step: "inspection" | "depreciation" | "delivery" | "remittance" | "settlement") {
  if (step === "inspection") return row.inspection_status === "COMPLETED";
  if (step === "depreciation") return row.depreciation_status === "AGREED";
  if (step === "delivery") return row.delivery_status === "COMPLETED";
  if (step === "remittance") return row.remittance_status === "CONFIRMED";
  return row.settlement_status === "COMPLETED";
}

export function AdminTradeQueuePage({ kind }: AdminTradeQueuePageProps) {
  const { token } = useAuth();
  const [rows, setRows] = useState<TradeWorkflow[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState<FilterStage>("ALL");

  const stage = stageMap[kind];
  const copy = copyMap[kind];

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listAdminTradeWorkflows(token, { stage: stage ?? undefined, limit: 100 });
      setRows(data);
    } catch (err) {
      setRows([]);
      setError(err instanceof Error ? err.message : `${copy.title} 조회 실패`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [token, kind]);

  const visibleRows = useMemo(() => {
    const needle = keyword.trim().toLowerCase();
    return rows.filter((row) => {
      if (stageFilter !== "ALL" && row.current_stage !== stageFilter) return false;
      if (!needle) return true;
      return [
        row.vehicle_id,
        row.vehicle_title,
        row.seller_name ?? "",
        row.dealer_name ?? "",
        row.seller_email ?? "",
        row.dealer_email ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [keyword, rows, stageFilter]);

  const summary = useMemo(() => {
    const completed = rows.filter((row) => row.current_stage === "COMPLETED").length;
    const risk = rows.filter((row) => row.current_stage === "SETTLEMENT" || row.current_stage === "CANCELLED").length;
    return { total: rows.length, completed, risk };
  }, [rows]);

  return (
    <section className="space-y-3">
      <div className="border-b border-[#d8dce5] bg-white px-5 py-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-[16px] font-bold tracking-[-0.03em] text-[#262d3d]">{copy.title}</h1>
            <div className="mt-2 flex items-center gap-3 text-[13px] text-[#6c7484]">
              <span>{copy.code}</span>
            </div>
          </div>
          <Button type="button" variant="outline" className="h-9 border-[#d9deea] bg-white text-[#61697a]" onClick={() => void load()}>
            새로고침
          </Button>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>조회 실패</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="rounded-xl border border-[#e5e8ef] bg-white px-5 py-4">
        <div className="flex flex-wrap items-center gap-3 text-[13px]">
          <span className="font-semibold text-[#2f3441]">상태</span>
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStageFilter(tab.value)}
              className={`rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors ${
                stageFilter === tab.value ? "border-[#173f8f] bg-[#173f8f] text-white" : "border-[#e2e5eb] bg-white text-[#757d8d]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-[#343b49]">
            <span>기간</span>
            <div className="flex overflow-hidden rounded-md border border-[#e2e5eb] bg-white">
              {["오늘", "최근 7일", "최근 30일", "전체"].map((range) => (
                <span key={range} className="border-r border-[#e2e5eb] px-5 py-2 text-[#727b89] last:border-r-0">
                  {range}
                </span>
              ))}
            </div>
          </div>

          <div className="flex min-w-[360px] flex-1 items-center gap-3">
            <span className="whitespace-nowrap text-[13px] font-semibold text-[#343b49]">검색어</span>
            <div className="relative flex-1">
              <Input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="거래 ID / 차량번호 / 판매자 / 딜러 검색"
                className="h-11 border-[#e2e5eb] bg-[#fbfcfe] text-[13px]"
              />
            </div>
            <Button type="button" variant="outline" className="h-11 border-[#e2e5eb] text-[#5c6476]" onClick={() => setKeyword("")}>
              초기화
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[#e5e8ef] bg-white px-5 py-4">
        <p className="text-[13px] text-[#5f6778]">
          총 <span className="font-bold text-[#2b3342]">{summary.total}건</span>의 거래
          <span className="mx-2">·</span>
          위험 <span className="font-bold text-[#d85454]">{summary.risk}건</span>
          <span className="mx-2">·</span>
          완료 <span className="font-bold text-[#5277d4]">{summary.completed}건</span>
        </p>

        <div className="mt-4 overflow-hidden rounded-lg border border-[#edf0f5]">
          <table className="min-w-full border-collapse text-[12px]">
            <thead>
              <tr className="bg-[#fafbfd] text-[#474f5e]">
                <th className="border-b border-r border-[#edf0f5] px-4 py-4 text-left font-bold">거래ID</th>
                <th className="border-b border-r border-[#edf0f5] px-4 py-4 text-left font-bold">차량 정보</th>
                <th className="border-b border-r border-[#edf0f5] px-4 py-4 text-left font-bold">판매자</th>
                <th className="border-b border-r border-[#edf0f5] px-4 py-4 text-left font-bold">딜러</th>
                <th className="border-b border-r border-[#edf0f5] px-4 py-4 text-center font-bold">상태</th>
                <th className="border-b border-r border-[#edf0f5] px-4 py-4 text-center font-bold">검차</th>
                <th className="border-b border-r border-[#edf0f5] px-4 py-4 text-center font-bold">감가</th>
                <th className="border-b border-r border-[#edf0f5] px-4 py-4 text-center font-bold">인도</th>
                <th className="border-b border-r border-[#edf0f5] px-4 py-4 text-center font-bold">송금</th>
                <th className="border-b border-r border-[#edf0f5] px-4 py-4 text-center font-bold">정산</th>
                <th className="border-b border-r border-[#edf0f5] px-4 py-4 text-center font-bold">SLA</th>
                <th className="border-b border-[#edf0f5] px-4 py-4 text-center font-bold">최종 업데이트</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.id} className="bg-white text-[#4b5362]">
                  <td className="border-b border-r border-[#edf0f5] px-4 py-3 align-middle font-semibold text-[#5a7fe5]">
                    <Link to={buildDetailPath(kind, row)}>{row.vehicle_id}</Link>
                  </td>
                  <td className="border-b border-r border-[#edf0f5] px-4 py-3 align-middle">
                    <p className="font-semibold text-[#383f4d]">{row.vehicle_title}</p>
                    <p className="mt-1 text-[11px] text-[#8a92a2]">{adminStageLabel(row.current_stage)}</p>
                  </td>
                  <td className="border-b border-r border-[#edf0f5] px-4 py-3 align-middle">{row.seller_name || "-"}</td>
                  <td className="border-b border-r border-[#edf0f5] px-4 py-3 align-middle">{row.dealer_name || "-"}</td>
                  <td className="border-b border-r border-[#edf0f5] px-4 py-3 text-center align-middle">
                    <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-bold ${formatStagePill(row.current_stage)}`}>
                      {workflowQueueStatus(row)}
                    </span>
                  </td>
                  <td className="border-b border-r border-[#edf0f5] px-4 py-3 text-center align-middle"><StepCircle active={isStepComplete(row, "inspection")} /></td>
                  <td className="border-b border-r border-[#edf0f5] px-4 py-3 text-center align-middle"><StepCircle active={isStepComplete(row, "depreciation")} /></td>
                  <td className="border-b border-r border-[#edf0f5] px-4 py-3 text-center align-middle"><StepCircle active={isStepComplete(row, "delivery")} /></td>
                  <td className="border-b border-r border-[#edf0f5] px-4 py-3 text-center align-middle"><StepCircle active={isStepComplete(row, "remittance")} /></td>
                  <td className="border-b border-r border-[#edf0f5] px-4 py-3 text-center align-middle"><StepCircle active={isStepComplete(row, "settlement")} /></td>
                  <td className="border-b border-r border-[#edf0f5] px-4 py-3 text-center align-middle font-semibold" style={{ color: formatSlaTone(row) }}>
                    {row.current_stage === "COMPLETED" ? "D+0" : row.current_stage === "SETTLEMENT" ? "D+1" : "D-1"}
                  </td>
                  <td className="border-b border-[#edf0f5] px-4 py-3 text-center align-middle">{new Date(row.updated_at).toLocaleDateString("ko-KR")}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && visibleRows.length === 0 ? (
            <div className="px-5 py-10 text-center text-[13px] text-[#7d8697]">조회된 운영 건이 없습니다.</div>
          ) : null}
        </div>
      </div>

      {loading ? <p className="text-[12px] text-[#7c8493]">목록을 불러오는 중입니다.</p> : null}
      <p className="text-[12px] text-[#8c93a3]">현재 단계: {rows[0] ? adminStageLabel(rows[0].current_stage) : "-"}</p>
    </section>
  );
}
