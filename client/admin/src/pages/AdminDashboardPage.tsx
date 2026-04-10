import type { ColumnDef } from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../app/AuthContext";
import { DashboardDataTable } from "../components/dashboard/DashboardDataTable";
import { DashboardDonutSummary } from "../components/dashboard/DashboardDonutSummary";
import { DashboardFinanceSummaryCard } from "../components/dashboard/DashboardFinanceSummaryCard";
import { DashboardMetricCard } from "../components/dashboard/DashboardMetricCard";
import { DashboardPanelCard } from "../components/dashboard/DashboardPanelCard";
import { DashboardTimelineList } from "../components/dashboard/DashboardTimelineList";
import { PageIntro } from "../components/common/PageIntro";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { listAdminBlacklistEntries, listAdminSettlementRecords, listAdminTradeWorkflows } from "../lib/api";
import type { AdminBlacklistEntry, AdminSettlementRecord, TradeWorkflow } from "../lib/types";


type DashboardDelayRow = {
  stage: string;
  elapsed: string;
  count: string;
  tone: string;
};

type DashboardPayoutRow = {
  tradeId: string;
  dealer: string;
  seller: string;
  amount: string;
  fee: string;
  eta: string;
  manager: string;
  dealerTone?: string;
  sellerTone?: string;
};

type DashboardInspectionRow = {
  time: string;
  tradeId: string;
  region: string;
  inspector: string;
  status: string;
  statusTone: string;
  note: string;
};

type DashboardEvaluatorRow = {
  name: string;
  assigned: string;
  progress: string;
  state: string;
  minutes: string;
};

const KRW_FORMATTER = new Intl.NumberFormat("ko-KR");
const STAGE_LABELS: Record<TradeWorkflow["current_stage"], string> = {
  INSPECTION: "검차",
  DEPRECIATION: "감가",
  DELIVERY: "인도",
  REMITTANCE: "송금",
  SETTLEMENT: "정산",
  COMPLETED: "완료",
  CANCELLED: "취소",
};

const INSPECTION_BADGES = {
  PROPOSED: { label: "예정", tone: "bg-[#f2efff] text-[#7264d8]" },
  RESCHEDULE_REQUESTED: { label: "조정", tone: "bg-[#fff2e7] text-[#d6864f]" },
  CONFIRMED: { label: "진행", tone: "bg-[#ece9ff] text-[#7b72e6]" },
  COMPLETED: { label: "완료", tone: "bg-[#edf7ea] text-[#67a65d]" },
} as const;

const REMITTANCE_LABELS = {
  WAITING: "대기",
  SUBMITTED: "등록",
  CONFIRMED: "확인",
} as const;

const SETTLEMENT_BADGES = {
  PENDING: { label: "대기", tone: "bg-[#f8e4e4] text-[#d87070]" },
  COMPLETED: { label: "완료", tone: "bg-[#edf7ea] text-[#67a65d]" },
} as const;

function parseDashboardDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDashboardDate(value?: string | null) {
  const date = parseDashboardDate(value);
  if (!date) return "-";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

function formatDashboardTime(value?: string | null) {
  const date = parseDashboardDate(value);
  if (!date) return "--:--";
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${hour}:${minute}`;
}

function formatDashboardDateTime(value?: string | null) {
  const date = parseDashboardDate(value);
  if (!date) return "실시간 기준";
  return `${formatDashboardDate(value)} ${formatDashboardTime(value)} 기준`;
}

function formatDashboardAmount(value?: number | null, currency = "KRW") {
  if (value === undefined || value === null || Number.isNaN(value)) return "-";
  const prefix = currency === "KRW" ? "₩" : currency;
  return `${prefix} ${KRW_FORMATTER.format(Math.round(value))}`;
}

function relativeDays(value?: string | null) {
  const date = parseDashboardDate(value);
  if (!date) return 0;
  return Math.max(0, (Date.now() - date.getTime()) / 86_400_000);
}

function formatAverageDays(values: Array<string | null | undefined>) {
  const normalized = values.map((value) => relativeDays(value)).filter((value) => Number.isFinite(value));
  if (!normalized.length) return "0.0일";
  const average = normalized.reduce((sum, value) => sum + value, 0) / normalized.length;
  return `${average.toFixed(1)}일`;
}

function formatProcessingWindow(hours: number) {
  if (!Number.isFinite(hours) || hours <= 0) return "-";
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m`;
  return `${hours.toFixed(1)}h`;
}

export function AdminDashboardPage() {
  const { token } = useAuth();
  const [workflows, setWorkflows] = useState<TradeWorkflow[]>([]);
  const [settlements, setSettlements] = useState<AdminSettlementRecord[]>([]);
  const [blacklist, setBlacklist] = useState<AdminBlacklistEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      setError(null);
      try {
        const [workflowRows, settlementRows, blacklistRows] = await Promise.all([
          listAdminTradeWorkflows(token, { limit: 100 }),
          listAdminSettlementRecords(token),
          listAdminBlacklistEntries(token, { active_only: true, limit: 100 }),
        ]);
        setWorkflows(workflowRows);
        setSettlements(settlementRows);
        setBlacklist(blacklistRows);
      } catch (err) {
        setError(err instanceof Error ? err.message : "대시보드 조회 실패");
      }
    };
    void load();
  }, [token]);

  const summary = useMemo(
    () => ({
      totalTrades: workflows.length,
      activeTrades: workflows.filter((row) => row.current_stage !== "COMPLETED" && row.current_stage !== "CANCELLED").length,
      pendingSettlements: settlements.filter((row) => row.status === "PENDING").length,
      activeBlacklist: blacklist.filter((row) => !row.released_at).length,
    }),
    [blacklist, settlements, workflows],
  );

  const dashboardMetaLabel = useMemo(() => {
    const timestamps = [
      ...workflows.flatMap((row) => [
        row.updated_at,
        row.created_at,
        row.inspection_scheduled_at,
        row.delivery_scheduled_at,
        row.remittance_confirmed_at,
        row.settlement_completed_at,
      ]),
      ...settlements.flatMap((row) => [row.settlement_due_at, row.sold_at]),
      ...blacklist.flatMap((row) => [row.updated_at, row.created_at]),
    ];
    let latest: string | null = null;
    let latestValue = 0;
    for (const timestamp of timestamps) {
      const date = parseDashboardDate(timestamp);
      if (!date) continue;
      if (date.getTime() > latestValue) {
        latestValue = date.getTime();
        latest = timestamp ?? null;
      }
    }
    return formatDashboardDateTime(latest);
  }, [blacklist, settlements, workflows]);

  const liveMetrics = useMemo(
    () => [
      {
        label: "검차 일정 미배정",
        value: String(workflows.filter((row) => row.current_stage === "INSPECTION" && !row.inspection_assignee).length),
        unit: "건",
      },
      {
        label: "감가 승인 대기(판매자)",
        value: String(
          workflows.filter(
            (row) => row.depreciation_status === "SELLER_REVIEW" || row.depreciation_status === "RENEGOTIATION_REQUESTED",
          ).length,
        ),
        unit: "건",
      },
      {
        label: "인도 완료 확인 대기",
        value: String(
          workflows.filter((row) => row.current_stage === "DELIVERY" && row.delivery_status !== "COMPLETED").length,
        ),
        unit: "건",
      },
      {
        label: "딜러 송금 확인 필요",
        value: String(
          workflows.filter(
            (row) =>
              (row.current_stage === "REMITTANCE" || row.current_stage === "SETTLEMENT") &&
              row.remittance_status !== "CONFIRMED",
          ).length,
        ),
        unit: "건",
      },
      {
        label: "판매자 정산 지급 대기",
        value: String(settlements.filter((row) => row.status === "PENDING").length),
        unit: "건",
      },
    ],
    [settlements, workflows],
  );

  const liveDelays = useMemo(() => {
    const groups = [
      {
        stage: "검차 -> 감가협의",
        rows: workflows.filter(
          (row) =>
            row.current_stage === "INSPECTION" ||
            row.current_stage === "DEPRECIATION" ||
            row.depreciation_status === "SELLER_REVIEW",
        ),
      },
      {
        stage: "감가협의 -> 인도",
        rows: workflows.filter((row) => row.current_stage === "DEPRECIATION" || row.current_stage === "DELIVERY"),
      },
      {
        stage: "딜러송금 -> 판매자정산",
        rows: workflows.filter((row) => row.current_stage === "REMITTANCE" || row.current_stage === "SETTLEMENT"),
      },
    ];
    return groups.map(({ stage, rows }) => {
      const count = rows.length;
      return {
        stage,
        elapsed: formatAverageDays(rows.map((row) => row.updated_at ?? row.created_at)),
        count: `${count}건`,
        tone: count > 0 ? "bg-[#f6d8d8] text-[#d65555]" : "bg-[#eef1f5] text-[#78808d]",
      };
    });
  }, [workflows]);

  const liveAlerts = useMemo(() => {
    const candidates = [
      ...workflows.map((row) => ({
        timestamp: row.updated_at ?? row.created_at,
        time: formatDashboardTime(row.updated_at ?? row.created_at),
        title: `${row.vehicle_title} 거래가 ${STAGE_LABELS[row.current_stage]} 단계로 업데이트되었습니다.`,
        tradeId: row.vehicle_id,
        action: row.current_stage === "SETTLEMENT" ? "정산" : row.current_stage === "INSPECTION" ? "검차" : "확인",
        actionTone: row.current_stage === "SETTLEMENT" ? "text-[#ef8d8d]" : "text-[#7d818b]",
      })),
      ...settlements.map((row) => ({
        timestamp: row.sold_at ?? row.settlement_due_at,
        time: formatDashboardTime(row.sold_at ?? row.settlement_due_at),
        title: `${row.vehicle_title} 판매자 정산이 ${row.status === "COMPLETED" ? "완료" : "대기"} 상태입니다.`,
        tradeId: row.vehicle_id,
        action: row.status === "COMPLETED" ? "완료" : "정산",
        actionTone: row.status === "COMPLETED" ? "text-[#7d818b]" : "text-[#ef8d8d]",
      })),
      ...blacklist.map((row) => ({
        timestamp: row.updated_at ?? row.created_at,
        time: formatDashboardTime(row.updated_at ?? row.created_at),
        title: `${row.full_name || row.email || row.user_id} 계정이 블랙리스트 상태로 변경되었습니다.`,
        tradeId: row.user_id,
        action: "관리",
        actionTone: "text-[#c3c5ca]",
      })),
    ]
      .filter((row) => parseDashboardDate(row.timestamp))
      .sort((a, b) => (parseDashboardDate(b.timestamp)?.getTime() ?? 0) - (parseDashboardDate(a.timestamp)?.getTime() ?? 0))
      .slice(0, 3);

    if (candidates.length > 0) return candidates;
    return [
      {
        time: "--:--",
        title: "표시할 운영 알림이 없습니다.",
        tradeId: "-",
        action: "대기",
        actionTone: "text-[#7d818b]",
      },
    ];
  }, [blacklist, settlements, workflows]);

  const liveInspections = useMemo(() => {
    const rows = workflows
      .filter((row) => row.current_stage === "INSPECTION" || row.inspection_scheduled_at)
      .sort(
        (a, b) =>
          (parseDashboardDate(a.inspection_scheduled_at ?? a.updated_at)?.getTime() ?? 0) -
          (parseDashboardDate(b.inspection_scheduled_at ?? b.updated_at)?.getTime() ?? 0),
      )
      .slice(0, 3)
      .map((row) => {
        const badge = INSPECTION_BADGES[row.inspection_status];
        return {
          time: formatDashboardTime(row.inspection_scheduled_at ?? row.updated_at),
          tradeId: row.vehicle_id,
          region: row.inspection_location || "지역 미등록",
          inspector: row.inspection_assignee || "미배정",
          status: badge.label,
          statusTone: badge.tone,
          note: row.inspection_summary || row.vehicle_title,
        };
      });

    if (rows.length > 0) return rows;
    return [
      {
        time: "--:--",
        tradeId: "-",
        region: "예정된 검차가 없습니다.",
        inspector: "-",
        status: "대기",
        statusTone: "bg-[#eef1f5] text-[#78808d]",
        note: "새 검차 일정이 생기면 이곳에 표시됩니다.",
      },
    ];
  }, [workflows]);

  const liveEvaluators = useMemo(() => {
    const grouped = new Map<
      string,
      {
        assigned: number;
        progress: number;
        hoursTotal: number;
        count: number;
      }
    >();

    for (const row of workflows.filter((workflow) => workflow.inspection_assignee)) {
      const name = row.inspection_assignee || "미배정";
      const current = grouped.get(name) ?? { assigned: 0, progress: 0, hoursTotal: 0, count: 0 };
      current.assigned += 1;
      current.progress += row.inspection_status === "COMPLETED" ? 1 : 0;
      current.hoursTotal += relativeDays(row.inspection_scheduled_at ?? row.updated_at) * 24;
      current.count += 1;
      grouped.set(name, current);
    }

    const rows = [...grouped.entries()]
      .sort((a, b) => b[1].assigned - a[1].assigned)
      .slice(0, 3)
      .map(([name, value]) => ({
        name,
        assigned: `${value.assigned}건`,
        progress: `${value.progress}건`,
        state: value.assigned - value.progress > 2 ? "집중" : "가능",
        minutes: formatProcessingWindow(value.hoursTotal / Math.max(value.count, 1)),
      }));

    if (rows.length > 0) return rows;
    return [{ name: "미배정", assigned: "0건", progress: "0건", state: "대기", minutes: "-" }];
  }, [workflows]);

  const financeOverview = useMemo(() => {
    const dealerConfirmed = workflows.reduce((sum, row) => {
      if (row.remittance_status !== "CONFIRMED") return sum;
      return sum + (row.remittance_amount ?? row.agreed_price ?? row.base_price);
    }, 0);
    const sellerCompleted = settlements.reduce((sum, row) => {
      if (row.status !== "COMPLETED") return sum;
      return sum + row.winning_price;
    }, 0);
    const holdCount = settlements.filter((row) => row.status === "PENDING").length;
    return { dealerConfirmed, sellerCompleted, holdCount };
  }, [settlements, workflows]);

  const livePayouts = useMemo(() => {
    const workflowsByVehicle = new Map(workflows.map((row) => [row.vehicle_id, row]));
    const rows = [...settlements]
      .sort(
        (a, b) =>
          (parseDashboardDate(b.sold_at ?? b.settlement_due_at)?.getTime() ?? 0) -
          (parseDashboardDate(a.sold_at ?? a.settlement_due_at)?.getTime() ?? 0),
      )
      .slice(0, 3)
      .map((row) => {
        const workflow = workflowsByVehicle.get(row.vehicle_id);
        const settlementBadge = SETTLEMENT_BADGES[row.status];
        const dealerLabel = workflow ? REMITTANCE_LABELS[workflow.remittance_status] : "대기";
        return {
          tradeId: row.vehicle_id,
          dealer: dealerLabel,
          dealerTone:
            dealerLabel === "확인" ? "bg-[#ece9ff] text-[#766ee8]" : dealerLabel === "등록" ? "bg-[#edf3ff] text-[#6c84e6]" : "bg-[#f3f4f7] text-[#7e8590]",
          seller: settlementBadge.label,
          sellerTone: settlementBadge.tone,
          amount: formatDashboardAmount(row.winning_price, row.currency),
          fee: formatDashboardAmount(row.winning_price * 0.001, row.currency),
          eta: formatDashboardDate(row.settlement_due_at),
          manager: workflow?.dealer_name || row.seller_name || "운영팀",
        };
      });

    if (rows.length > 0) return rows;
    return [
      {
        tradeId: "-",
        dealer: "대기",
        dealerTone: "bg-[#f3f4f7] text-[#7e8590]",
        seller: "대기",
        sellerTone: "bg-[#f8e4e4] text-[#d87070]",
        amount: "-",
        fee: "-",
        eta: "-",
        manager: "운영팀",
      },
    ];
  }, [settlements, workflows]);

  const liveDonutSlices = useMemo(
    () => [
      {
        key: "inspection",
        label: "검차/감가",
        value: workflows.filter((row) => row.current_stage === "INSPECTION" || row.current_stage === "DEPRECIATION").length || 1,
        color: "#8b59cc",
      },
      {
        key: "operations",
        label: "운영 처리",
        value: workflows.filter((row) => row.current_stage === "DELIVERY" || row.current_stage === "REMITTANCE").length || 1,
        color: "#f064a4",
      },
      {
        key: "settlement",
        label: "정산",
        value: workflows.filter((row) => row.current_stage === "SETTLEMENT" || row.current_stage === "COMPLETED").length || 1,
        color: "#6e7af3",
      },
    ],
    [workflows],
  );

  const liveDelayColumns: ColumnDef<DashboardDelayRow>[] = [
    { accessorKey: "stage", header: "병목 구간" },
    { accessorKey: "elapsed", header: "평균 소요" },
    { accessorKey: "count", header: "지체" },
    {
      accessorKey: "count",
      header: "기준 초과",
      cell: ({ row }) => <span className={`inline-flex rounded-full px-[8px] py-[3px] text-[8.5px] font-bold ${row.original.tone}`}>{row.original.count}</span>,
    },
  ];

  const livePayoutColumns: ColumnDef<DashboardPayoutRow>[] = [
    { accessorKey: "tradeId", header: "거래ID", cell: ({ row }) => <span className="text-[#688af0]">{row.original.tradeId}</span> },
    {
      accessorKey: "dealer",
      header: "딜러 송금상태",
      cell: ({ row }) => <span className={`inline-flex rounded-full px-[7px] py-[2px] text-[8px] ${row.original.dealerTone}`}>{row.original.dealer}</span>,
    },
    {
      accessorKey: "seller",
      header: "판매자 지급상태",
      cell: ({ row }) => <span className={`inline-flex rounded-full px-[7px] py-[2px] text-[8px] ${row.original.sellerTone}`}>{row.original.seller}</span>,
    },
    { accessorKey: "amount", header: "정산 금액" },
    { accessorKey: "fee", header: "수수료(VAT포함)" },
    { accessorKey: "eta", header: "지급 예정일" },
    { accessorKey: "manager", header: "매칭자" },
  ];
  const liveInspectionColumns: ColumnDef<DashboardInspectionRow>[] = [
    { accessorKey: "time", header: "시간" },
    { accessorKey: "tradeId", header: "거래ID", cell: ({ row }) => <span className="text-[#688af0]">{row.original.tradeId}</span> },
    { accessorKey: "region", header: "지역" },
    { accessorKey: "inspector", header: "평가사" },
    {
      accessorKey: "status",
      header: "상태",
      cell: ({ row }) => <span className={`inline-flex rounded-full px-[8px] py-[3px] text-[8.5px] ${row.original.statusTone}`}>{row.original.status}</span>,
    },
    { accessorKey: "note", header: "메모", cell: ({ row }) => <span className="text-[#98a0ad]">{row.original.note}</span> },
  ];
  const liveEvaluatorColumns: ColumnDef<DashboardEvaluatorRow>[] = [
    { accessorKey: "name", header: "평가사" },
    { accessorKey: "assigned", header: "오늘 배정" },
    { accessorKey: "progress", header: "진행중", cell: ({ row }) => <span className="text-[#688af0]">{row.original.progress}</span> },
    {
      accessorKey: "state",
      header: "상태",
      cell: ({ row }) => <span className="inline-flex rounded-full bg-[#edf7ea] px-[8px] py-[3px] text-[8.5px] text-[#67a65d]">{row.original.state}</span>,
    },
    { accessorKey: "minutes", header: "평균 처리" },
  ];
  const dashboardSurfaceShadow = "inset 0 0 0 1px rgba(229,233,240,0.9)";
  const dashboardAlertColumns = "20px 1fr 40px";
  const dashboardAlertStackGap = 10;
  const dashboardAlertDotSize = 8;
  const dashboardAlertStemHeight = 42;
  const dashboardAlertMessageGap = 2;
  const dashboardFinancePadX = 18;
  const dashboardFinancePadY = 12;

  return (
    <section className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>조회 실패</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <section
        className="min-h-[936px] rounded-[20px] p-[18px] text-[#2b313d]"
        style={{
          backgroundColor: "#f5f6fa",
          boxShadow: "inset 0 0 0 1px rgba(229,233,240,0.7)",
        }}
      >
        <div className="flex items-end gap-[16px]">
          <h1 className="text-[28px] font-extrabold tracking-[-0.03em] text-[#1f232b]">대시보드</h1>
          <p className="pb-[2px] text-[13px] font-semibold text-[#8b9098]">{dashboardMetaLabel}</p>
        </div>

        <div className="mt-[12px] grid gap-[10px] xl:grid-cols-5">
          {liveMetrics.map((metric) => (
            <DashboardMetricCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              unit={metric.unit}
              labelSize={11}
              valueSize={18}
              unitSize={10}
              valueGap={8}
              style={{ boxShadow: dashboardSurfaceShadow }}
              className="rounded-[12px] bg-white p-[14px_16px]"
            />
          ))}
        </div>

        <div className="mt-[12px] grid gap-[10px] xl:grid-cols-[1.97fr_1.08fr]">
          <DashboardPanelCard
            title="상태별 거래 현황 (최근 7일)"
            bodyClassName="mt-[16px] flex items-center gap-[22px]"
            style={{ boxShadow: dashboardSurfaceShadow }}
          >
              <DashboardDonutSummary
                className="shrink-0"
                totalLabel="전체 거래"
                totalValue={summary.totalTrades}
                size={122}
                innerRadius={40}
                outerRadius={58}
                labelSize={10}
                valueSize={20}
                slices={liveDonutSlices}
              />

              <div className="min-w-[290px] flex-1">
                <div className="mb-[10px] flex items-center justify-between">
                  <p className="text-[11px] font-bold text-[#646a75]">상태 전이 병목 Top3</p>
                </div>
                <DashboardDataTable
                  className="overflow-hidden rounded-[10px] border border-[#edf0f4]"
                  data={liveDelays}
                  columns={liveDelayColumns}
                  tableClassName="table-fixed"
                  headerRowClassName="border-b-0 bg-[#f8f9fb]"
                  bodyRowClassName="border-[#edf0f4] text-[9px] font-semibold text-[#6d7480]"
                  headerCellClassName="bg-[#f8f9fb] px-[12px] py-[8px] text-[9px] font-bold text-[#7e8590]"
                  bodyCellClassName="px-[12px] py-[7px] text-[9px] font-semibold text-[#6d7480]"
                />
              </div>
          </DashboardPanelCard>

          <DashboardPanelCard
            title="운영 알림"
            style={{ boxShadow: dashboardSurfaceShadow }}
          >
            <DashboardTimelineList
              items={liveAlerts}
              columns={dashboardAlertColumns}
              stackGap={dashboardAlertStackGap}
              dotSize={dashboardAlertDotSize}
              stemHeight={dashboardAlertStemHeight}
              messageGap={dashboardAlertMessageGap}
              actionFontSize={8}
            />
            <button type="button" className="mt-[10px] text-[10px] font-bold text-[#688af0]">
              알림 센터 이동
            </button>
          </DashboardPanelCard>
        </div>

        <div className="mt-[12px] grid gap-[10px] xl:grid-cols-[1.66fr_1fr]">
          <DashboardPanelCard
            title="오늘 검차 일정"
            style={{ boxShadow: dashboardSurfaceShadow }}
          >
            <DashboardDataTable
              className="overflow-hidden rounded-[10px] border border-[#eef1f5]"
              data={liveInspections}
              columns={liveInspectionColumns}
              tableClassName="table-fixed"
              headerRowClassName="border-b-0 bg-[#f8f9fb]"
              bodyRowClassName="border-[#eef1f5] text-[9px] font-semibold text-[#6d7480]"
              headerCellClassName="bg-[#f8f9fb] px-[11px] py-[6px] text-[9px] font-bold text-[#7e8590]"
              bodyCellClassName="px-[11px] py-[6px] text-[9px] font-semibold text-[#6d7480]"
            />
          </DashboardPanelCard>

          <DashboardPanelCard
            title="평가사 가용/배정 현황"
            style={{ boxShadow: dashboardSurfaceShadow }}
          >
            <DashboardDataTable
              className="overflow-hidden rounded-[10px] border border-[#eef1f5]"
              data={liveEvaluators}
              columns={liveEvaluatorColumns}
              tableClassName="table-fixed"
              headerRowClassName="border-b-0 bg-[#f8f9fb]"
              bodyRowClassName="border-[#eef1f5] text-[9px] font-semibold text-[#6d7480]"
              headerCellClassName="bg-[#f8f9fb] px-[11px] py-[6px] text-[9px] font-bold text-[#7e8590]"
              bodyCellClassName="px-[11px] py-[6px] text-[9px] font-semibold text-[#6d7480]"
            />
          </DashboardPanelCard>
        </div>

        <DashboardPanelCard
          title="정산/재무 관제"
          style={{ boxShadow: dashboardSurfaceShadow }}
        >
          <div className="grid gap-[8px] xl:grid-cols-[1fr_1fr_0.88fr]">
            <DashboardFinanceSummaryCard
              label="오늘 확인된 딜러 입금"
              value={formatDashboardAmount(financeOverview.dealerConfirmed)}
              padX={dashboardFinancePadX}
              padY={dashboardFinancePadY}
            />
            <DashboardFinanceSummaryCard
              label="오늘 판매자 지급 완료"
              value={formatDashboardAmount(financeOverview.sellerCompleted)}
              padX={dashboardFinancePadX}
              padY={dashboardFinancePadY}
            />
            <DashboardFinanceSummaryCard
              label="정산 보류 (분쟁/서류)"
              value={`${financeOverview.holdCount} 건`}
              tone="alert"
              padX={dashboardFinancePadX}
              padY={dashboardFinancePadY}
            />
          </div>

          <DashboardDataTable
            className="mt-[12px] overflow-hidden rounded-[10px] border border-[#eef1f5]"
            data={livePayouts}
            columns={livePayoutColumns}
            tableClassName="table-fixed"
            headerRowClassName="border-b-0 bg-[#f8f9fb]"
            bodyRowClassName="border-[#eef1f5] text-[7.5px] font-semibold text-[#6d7480]"
            headerCellClassName="bg-[#f8f9fb] px-[13px] py-[7px] text-[7.5px] font-bold text-[#7e8590]"
            bodyCellClassName="px-[13px] py-[7px] text-[7.5px] font-semibold text-[#6d7480]"
          />
        </DashboardPanelCard>
      </section>
    </section>
  );
}
