import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useAuth } from "../app/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  dealerConfirmDelivery,
  dealerScheduleDelivery,
  dealerSubmitDepreciation,
  dealerSubmitRemittance,
  getDealerTradeWorkflow,
} from "../lib/api";
import type { TradeWorkflow } from "../lib/types";

const DEALER_TRADE_TS_SPEC_CODES = [
  "TS-28",
  "TS-29",
  "TS-31",
  "TS-32",
  "TS-33",
  "TS-34",
  "TS-35",
  "TS-36",
  "TS-37",
  "TS-38",
  "TS-39",
  "TS-40",
  "TS-41",
  "TS-42",
  "TS-43",
  "TS-44",
  "TS-45",
  "TS-46",
  "TS-47",
  "TS-48",
  "TS-49",
  "TS-50",
  "TS-51",
  "TS-52",
  "TS-54",
  "TS-55",
  "TS-56",
  "TS-57",
] as const;

interface DraftDepreciationItem {
  id: string;
  code: string;
  label: string;
  amount: string;
  note: string;
}

function stageBadge(stage: TradeWorkflow["current_stage"]) {
  if (stage === "INSPECTION") return <Badge variant="outline">검차</Badge>;
  if (stage === "DEPRECIATION") return <Badge>감가협의</Badge>;
  if (stage === "DELIVERY") return <Badge>인도</Badge>;
  if (stage === "REMITTANCE") return <Badge>송금</Badge>;
  if (stage === "SETTLEMENT") return <Badge>정산</Badge>;
  if (stage === "COMPLETED") return <Badge variant="secondary">거래완료</Badge>;
  return <Badge variant="destructive">강제종료</Badge>;
}

const STAGE_SEQUENCE: TradeWorkflow["current_stage"][] = [
  "INSPECTION",
  "DEPRECIATION",
  "DELIVERY",
  "REMITTANCE",
  "SETTLEMENT",
  "COMPLETED",
];

const STAGE_LABEL: Record<TradeWorkflow["current_stage"], string> = {
  INSPECTION: "검차",
  DEPRECIATION: "감가협의",
  DELIVERY: "인도",
  REMITTANCE: "송금",
  SETTLEMENT: "정산",
  COMPLETED: "거래완료",
  CANCELLED: "강제종료",
};

const DELIVERY_CHECK_ITEMS = ["차량 상태 확인", "서류 인수 확인", "인도 장소 확인"] as const;
const ALLOWED_FILE_EXTENSIONS = ["pdf", "png", "jpg", "jpeg"];
const MAX_DELIVERY_FILE_BYTES = 5 * 1024 * 1024;
const MAX_REMITTANCE_FILE_BYTES = 10 * 1024 * 1024;

interface EvidenceMeta {
  name: string;
  size_bytes: number;
  content_type?: string | null;
}

function fileExt(name: string): string {
  return name.split(".").pop()?.toLowerCase() || "";
}

function ensureFiles(files: File[], maxBytes: number): string | null {
  for (const file of files) {
    const ext = fileExt(file.name);
    if (!ALLOWED_FILE_EXTENSIONS.includes(ext)) {
      return "첨부 파일 형식은 PDF/JPG/JPEG/PNG만 가능합니다.";
    }
    if (file.size > maxBytes) {
      return `첨부 파일은 ${Math.round(maxBytes / 1024 / 1024)}MB 이하만 업로드할 수 있습니다.`;
    }
  }
  return null;
}

function toEvidenceMeta(files: File[]): EvidenceMeta[] {
  return files.map((file) => ({
    name: file.name,
    size_bytes: file.size,
    content_type: file.type || null,
  }));
}

function eventPayloadObject(event: TradeWorkflow["events"][number] | null | undefined): Record<string, unknown> {
  if (!event?.payload_json || typeof event.payload_json !== "object") return {};
  return event.payload_json as Record<string, unknown>;
}

function downloadText(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function stageSystemNotice(stage: TradeWorkflow["current_stage"]): string {
  if (stage === "INSPECTION") return "검차 일정 확정/완료 이벤트 시 다음 단계로 자동 전환됩니다.";
  if (stage === "DEPRECIATION") return "감가 협의 확정 이벤트 시 인도 단계로 자동 전환됩니다.";
  if (stage === "DELIVERY") return "판매자/딜러 인도 확인 이벤트 시 송금 단계로 자동 전환됩니다.";
  if (stage === "REMITTANCE") return "관리자 송금 확인 이벤트 시 정산 단계로 자동 전환됩니다.";
  if (stage === "SETTLEMENT") return "관리자 정산 확정 이벤트 시 거래완료로 자동 전환됩니다.";
  if (stage === "COMPLETED") return "거래가 최종 완료되었습니다. 완료 시각 정보는 고정됩니다.";
  return "강제 종료된 거래입니다. 단계 복구는 관리자 처리 대상입니다.";
}

function newDraftItem(seed = 0): DraftDepreciationItem {
  return {
    id: `draft-${Date.now()}-${seed}`,
    code: "",
    label: "",
    amount: "",
    note: "",
  };
}

export function DealerTradeOperationPage() {
  const { token } = useAuth();
  const { vehicleId } = useParams<{ vehicleId: string }>();

  const [workflow, setWorkflow] = useState<TradeWorkflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [depreciationItems, setDepreciationItems] = useState<DraftDepreciationItem[]>([newDraftItem(1)]);
  const [depreciationComment, setDepreciationComment] = useState("");

  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("10:00");
  const [deliveryMethod, setDeliveryMethod] = useState("직접 인도");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [deliveryChecks, setDeliveryChecks] = useState<Record<string, boolean>>(
    Object.fromEntries(DELIVERY_CHECK_ITEMS.map((item) => [item, false])),
  );
  const [vehicleEvidenceFiles, setVehicleEvidenceFiles] = useState<File[]>([]);
  const [documentEvidenceFiles, setDocumentEvidenceFiles] = useState<File[]>([]);

  const [remittanceAmount, setRemittanceAmount] = useState("");
  const [remittanceDate, setRemittanceDate] = useState("");
  const [remittanceMethod, setRemittanceMethod] = useState("ACCOUNT_TRANSFER");
  const [remittanceBankAccount, setRemittanceBankAccount] = useState("");
  const [remittanceReference, setRemittanceReference] = useState("");
  const [remittanceNote, setRemittanceNote] = useState("");
  const [remittanceEvidenceFiles, setRemittanceEvidenceFiles] = useState<File[]>([]);
  const [evidenceOpen, setEvidenceOpen] = useState(false);

  const load = async () => {
    if (!token || !vehicleId) return;
    setLoading(true);
    setError(null);
    try {
      const flow = await getDealerTradeWorkflow(token, vehicleId);
      setWorkflow(flow);
      if (!remittanceAmount) {
        const amount = flow.agreed_price ?? flow.base_price;
        setRemittanceAmount(String(Math.round(amount)));
      }
      if (!remittanceDate) {
        const localDate = new Date().toISOString().slice(0, 10);
        setRemittanceDate(localDate);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "거래 운영 데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, vehicleId]);

  const canSubmitDepreciation =
    workflow?.current_stage === "DEPRECIATION" &&
    (workflow.depreciation_status === "PROPOSAL_REQUIRED" || workflow.depreciation_status === "RENEGOTIATION_REQUESTED");
  const canScheduleDelivery = workflow?.current_stage === "DELIVERY" && workflow.delivery_status === "WAITING_SCHEDULE";
  const canConfirmDelivery =
    workflow?.current_stage === "DELIVERY" &&
    (workflow.delivery_status === "SCHEDULED" || workflow.delivery_status === "IN_PROGRESS") &&
    !workflow.delivery_confirmed_by_dealer_at;
  const canSubmitRemittance = workflow?.current_stage === "REMITTANCE" && workflow.remittance_status === "WAITING";
  const isCompleted = workflow?.current_stage === "COMPLETED";
  const stageIndex = workflow ? STAGE_SEQUENCE.indexOf(workflow.current_stage) : -1;
  const deliveryChecklistReady = DELIVERY_CHECK_ITEMS.every((item) => deliveryChecks[item]);

  const remittanceRequiredReady =
    !!remittanceDate &&
    Number(remittanceAmount.replace(/[^0-9]/g, "")) > 0 &&
    !!remittanceMethod &&
    remittanceBankAccount.trim().length >= 4 &&
    remittanceReference.trim().length >= 2 &&
    remittanceEvidenceFiles.length > 0;

  const settlementEvent = useMemo(() => {
    if (!workflow) return null;
    return [...workflow.events].reverse().find((event) => event.event_type === "SETTLEMENT_COMPLETED") ?? null;
  }, [workflow]);

  const deliveryEvidenceEvent = useMemo(() => {
    if (!workflow) return null;
    return [...workflow.events].reverse().find((event) => event.event_type === "DELIVERY_CONFIRMED_BY_DEALER") ?? null;
  }, [workflow]);

  const remittanceSubmittedEvent = useMemo(() => {
    if (!workflow) return null;
    return [...workflow.events].reverse().find((event) => event.event_type === "REMITTANCE_SUBMITTED") ?? null;
  }, [workflow]);

  const deliveryEvidencePayload = eventPayloadObject(deliveryEvidenceEvent);
  const remittancePayload = eventPayloadObject(remittanceSubmittedEvent);

  const completedDeliveryVehicleFiles = (deliveryEvidencePayload.vehicle_evidence_files as EvidenceMeta[] | undefined) ?? [];
  const completedDeliveryDocFiles = (deliveryEvidencePayload.document_evidence_files as EvidenceMeta[] | undefined) ?? [];
  const completedRemittanceFiles = (remittancePayload.evidence_files as EvidenceMeta[] | undefined) ?? [];
  const completedRemittanceMethod = (remittancePayload.method as string | undefined) ?? "ACCOUNT_TRANSFER";
  const completedRemittedAt = (remittancePayload.remitted_at as string | undefined) ?? workflow?.remittance_submitted_at ?? null;
  const completedRemittanceNote = (remittancePayload.note as string | undefined) ?? "";

  const parsedDepreciationItems = useMemo(() => {
    const payload: Array<{ code: string; label: string; amount: number; note?: string }> = [];
    for (const row of depreciationItems) {
      const amount = Number(row.amount.replace(/[^0-9]/g, ""));
      if (!row.code.trim() || !row.label.trim() || !Number.isFinite(amount) || amount <= 0) {
        return null;
      }
      payload.push({
        code: row.code.trim(),
        label: row.label.trim(),
        amount: Math.round(amount),
        note: row.note.trim() || undefined,
      });
    }
    if (payload.length === 0) return null;
    return payload;
  }, [depreciationItems]);

  const submitDepreciation = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token || !vehicleId || !canSubmitDepreciation) return;
    if (!parsedDepreciationItems) {
      setError("감가 항목 코드/사유/금액을 모두 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const flow = await dealerSubmitDepreciation(token, vehicleId, {
        items: parsedDepreciationItems,
        comment: depreciationComment.trim() || undefined,
      });
      setWorkflow(flow);
      setDepreciationItems([newDraftItem(1)]);
      setDepreciationComment("");
      setMessage("감가 제안이 제출되었습니다. 판매자 검토가 완료되면 다음 단계로 진행됩니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "감가 제안 제출에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitDeliverySchedule = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token || !vehicleId || !canScheduleDelivery) return;

    if (!deliveryDate || !deliveryTime || !deliveryMethod.trim() || !deliveryLocation.trim()) {
      setError("인도 일정/방식/장소를 모두 입력해 주세요.");
      return;
    }

    const scheduledAt = new Date(`${deliveryDate}T${deliveryTime}:00`);
    if (Number.isNaN(scheduledAt.getTime())) {
      setError("유효한 인도 일정이 아닙니다.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const flow = await dealerScheduleDelivery(token, vehicleId, {
        scheduled_at: scheduledAt.toISOString(),
        method: deliveryMethod.trim(),
        location: deliveryLocation.trim(),
      });
      setWorkflow(flow);
      setMessage("인도 일정이 등록되었습니다. 판매자/딜러 확인이 완료되면 송금 단계가 열립니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "인도 일정 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelivery = async () => {
    if (!token || !vehicleId || !canConfirmDelivery) return;
    if (!deliveryChecklistReady) {
      setError("인도 체크리스트를 모두 확인해 주세요.");
      return;
    }
    const deliveryVehicleError = ensureFiles(vehicleEvidenceFiles, MAX_DELIVERY_FILE_BYTES);
    if (deliveryVehicleError) {
      setError(deliveryVehicleError);
      return;
    }
    const deliveryDocumentError = ensureFiles(documentEvidenceFiles, MAX_DELIVERY_FILE_BYTES);
    if (deliveryDocumentError) {
      setError(deliveryDocumentError);
      return;
    }
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const flow = await dealerConfirmDelivery(token, vehicleId, {
        checklist_items: DELIVERY_CHECK_ITEMS.filter((item) => deliveryChecks[item]),
        vehicle_evidence_files: toEvidenceMeta(vehicleEvidenceFiles),
        document_evidence_files: toEvidenceMeta(documentEvidenceFiles),
      });
      setWorkflow(flow);
      setVehicleEvidenceFiles([]);
      setDocumentEvidenceFiles([]);
      setMessage("딜러 인도 확인이 완료되었습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "인도 확인 처리에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitRemittance = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token || !vehicleId || !canSubmitRemittance) return;

    const amount = Number(remittanceAmount.replace(/[^0-9]/g, ""));
    if (!Number.isFinite(amount) || amount <= 0 || !remittanceBankAccount.trim() || !remittanceReference.trim() || !remittanceDate || !remittanceMethod) {
      setError("송금 일자/금액/방법/계좌/참조값을 모두 입력해 주세요.");
      return;
    }
    const remittanceFileError = ensureFiles(remittanceEvidenceFiles, MAX_REMITTANCE_FILE_BYTES);
    if (remittanceFileError) {
      setError(remittanceFileError);
      return;
    }
    if (remittanceEvidenceFiles.length === 0) {
      setError("송금 증빙 파일을 1개 이상 첨부해 주세요.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const flow = await dealerSubmitRemittance(token, vehicleId, {
        amount: Math.round(amount),
        bank_account: remittanceBankAccount.trim(),
        reference: remittanceReference.trim(),
        remitted_at: new Date(`${remittanceDate}T00:00:00`).toISOString(),
        method: remittanceMethod,
        note: remittanceNote.trim() || undefined,
        evidence_files: toEvidenceMeta(remittanceEvidenceFiles),
      });
      setWorkflow(flow);
      setRemittanceEvidenceFiles([]);
      setMessage("딜러 송금 등록이 완료되었습니다. 어드민 확인 후 정산 단계로 이동합니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "송금 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className="mx-auto max-w-5xl space-y-4">
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">거래 운영 데이터를 불러오는 중...</CardContent>
        </Card>
      </section>
    );
  }

  if (!workflow) {
    return (
      <section className="mx-auto max-w-5xl space-y-4">
        <Card>
          <CardContent className="pt-6 text-sm">거래 워크플로우를 찾을 수 없습니다.</CardContent>
        </Card>
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
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>딜러 거래 운영</CardTitle>
            {stageBadge(workflow.current_stage)}
          </div>
          <CardDescription>
            차량: {workflow.vehicle_title} / 단계 전환은 시스템 이벤트로 자동 처리됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm" data-spec-codes={DEALER_TRADE_TS_SPEC_CODES.join(",")}>
          <p>판매자: {workflow.seller_name || "-"} ({workflow.seller_email || "-"}) / 연락처 {workflow.seller_phone || "-"}</p>
          <p>딜러: {workflow.dealer_name || "-"} ({workflow.dealer_email || "-"})</p>
          <p>낙찰 기준 금액(고정): {Math.round(workflow.base_price).toLocaleString()} {workflow.currency}</p>
          <p>최종 거래 금액(합의): {Math.round(workflow.agreed_price ?? workflow.base_price).toLocaleString()} {workflow.currency}</p>
          <p>단계 안내: {stageSystemNotice(workflow.current_stage)}</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button asChild variant="outline" size="sm">
              <Link to="/dealer/bids">나의입찰로 돌아가기</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/support/inquiries">1:1 문의</Link>
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
              새로고침
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">거래 단계 진행 바</CardTitle>
          <CardDescription>현재 단계는 자동 전환되며 수동으로 단계를 변경할 수 없습니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 md:grid-cols-6">
            {STAGE_SEQUENCE.map((stage, index) => {
              const reached = stageIndex >= 0 && index <= stageIndex;
              const current = workflow.current_stage === stage;
              return (
                <div
                  key={stage}
                  className={`rounded-md border px-3 py-2 text-center text-xs ${
                    current ? "border-primary bg-primary/10 font-semibold text-primary" : reached ? "border-border bg-muted/30" : "border-border/60"
                  }`}
                >
                  {STAGE_LABEL[stage]}
                </div>
              );
            })}
          </div>
          <Alert>
            <AlertTitle>자동 단계 전환 안내</AlertTitle>
            <AlertDescription>{stageSystemNotice(workflow.current_stage)}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">진행 체크리스트</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm md:grid-cols-2">
          <p>검차 상태: <span className="font-medium">{workflow.inspection_status}</span></p>
          <p>감가 상태: <span className="font-medium">{workflow.depreciation_status}</span></p>
          <p>인도 상태: <span className="font-medium">{workflow.delivery_status}</span></p>
          <p>송금 상태: <span className="font-medium">{workflow.remittance_status}</span></p>
          <p>정산 상태: <span className="font-medium">{workflow.settlement_status}</span></p>
          <p>최종 합의 금액: <span className="font-medium">{Math.round(workflow.agreed_price ?? workflow.base_price).toLocaleString()}</span></p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">감가 제안 제출</CardTitle>
          <CardDescription>감가 단계에서만 제출할 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={submitDepreciation}>
            {depreciationItems.map((row, idx) => (
              <div key={row.id} className="rounded-md border border-border/80 p-3">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor={`${row.id}-code`}>코드</Label>
                    <Input
                      id={`${row.id}-code`}
                      value={row.code}
                      onChange={(event) =>
                        setDepreciationItems((prev) =>
                          prev.map((item) => (item.id === row.id ? { ...item, code: event.target.value } : item)),
                        )
                      }
                      placeholder="BODY-SCRATCH"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${row.id}-label`}>항목명</Label>
                    <Input
                      id={`${row.id}-label`}
                      value={row.label}
                      onChange={(event) =>
                        setDepreciationItems((prev) =>
                          prev.map((item) => (item.id === row.id ? { ...item, label: event.target.value } : item)),
                        )
                      }
                      placeholder="외판 손상"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${row.id}-amount`}>감가 금액</Label>
                    <Input
                      id={`${row.id}-amount`}
                      value={row.amount}
                      onChange={(event) =>
                        setDepreciationItems((prev) =>
                          prev.map((item) =>
                            item.id === row.id ? { ...item, amount: event.target.value.replace(/[^0-9]/g, "") } : item,
                          ),
                        )
                      }
                      inputMode="numeric"
                      placeholder="100000"
                    />
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <Label htmlFor={`${row.id}-note`}>메모(선택)</Label>
                  <Textarea
                    id={`${row.id}-note`}
                    rows={2}
                    value={row.note}
                    onChange={(event) =>
                      setDepreciationItems((prev) =>
                        prev.map((item) => (item.id === row.id ? { ...item, note: event.target.value } : item)),
                      )
                    }
                    placeholder="상세 설명"
                  />
                </div>
                <div className="mt-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={depreciationItems.length === 1}
                    onClick={() => setDepreciationItems((prev) => prev.filter((item) => item.id !== row.id))}
                  >
                    항목 삭제
                  </Button>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">항목 {idx + 1}</p>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDepreciationItems((prev) => [...prev, newDraftItem(prev.length + 1)])}
            >
              감가 항목 추가
            </Button>

            <div className="space-y-2">
              <Label htmlFor="dealer-depreciation-comment">종합 코멘트(선택)</Label>
              <Textarea
                id="dealer-depreciation-comment"
                rows={3}
                value={depreciationComment}
                onChange={(event) => setDepreciationComment(event.target.value)}
                placeholder="판매자에게 전달할 설명을 입력해 주세요."
              />
            </div>

            <Button type="submit" disabled={!canSubmitDepreciation || submitting}>
              감가 제안 제출
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">인도 일정 등록/확인</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3" data-spec-codes={DEALER_TRADE_TS_SPEC_CODES.join(",")}>
          <form className="space-y-3" onSubmit={submitDeliverySchedule}>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dealer-delivery-date">인도 날짜</Label>
                <Input
                  id="dealer-delivery-date"
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  disabled={!canScheduleDelivery}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dealer-delivery-time">인도 시간</Label>
                <Input
                  id="dealer-delivery-time"
                  type="time"
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                  disabled={!canScheduleDelivery}
                />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dealer-delivery-method">인도 방식</Label>
                <Input
                  id="dealer-delivery-method"
                  value={deliveryMethod}
                  onChange={(e) => setDeliveryMethod(e.target.value)}
                  placeholder="직접 인도 / 탁송"
                  disabled={!canScheduleDelivery}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dealer-delivery-location">인도 장소</Label>
                <Input
                  id="dealer-delivery-location"
                  value={deliveryLocation}
                  onChange={(e) => setDeliveryLocation(e.target.value)}
                  placeholder="서울 강남구 ..."
                  disabled={!canScheduleDelivery}
                />
              </div>
            </div>

            <div className="space-y-2 rounded-md border border-border/70 p-3">
              <p className="text-sm font-medium">인도 체크리스트(필수)</p>
              {DELIVERY_CHECK_ITEMS.map((item) => (
                <label key={item} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={deliveryChecks[item]}
                    onCheckedChange={(checked) => setDeliveryChecks((prev) => ({ ...prev, [item]: checked === true }))}
                    disabled={!workflow.delivery_scheduled_at}
                  />
                  {item}
                </label>
              ))}
              {!workflow.delivery_scheduled_at && (
                <p className="text-xs text-muted-foreground">인도 일정 등록 전에는 체크리스트/인도확인이 비활성화됩니다.</p>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dealer-delivery-vehicle-files">차량 인도 사진 첨부(각 5MB)</Label>
                <Input
                  id="dealer-delivery-vehicle-files"
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg"
                  disabled={!workflow.delivery_scheduled_at}
                  onChange={(event) => {
                    const files = Array.from(event.currentTarget.files ?? []);
                    setVehicleEvidenceFiles(files);
                  }}
                />
                {vehicleEvidenceFiles.length > 0 && (
                  <p className="text-xs text-muted-foreground">선택 파일 {vehicleEvidenceFiles.length}건</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="dealer-delivery-doc-files">서류 인수 사진 첨부(각 5MB)</Label>
                <Input
                  id="dealer-delivery-doc-files"
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg"
                  disabled={!workflow.delivery_scheduled_at}
                  onChange={(event) => {
                    const files = Array.from(event.currentTarget.files ?? []);
                    setDocumentEvidenceFiles(files);
                  }}
                />
                {documentEvidenceFiles.length > 0 && (
                  <p className="text-xs text-muted-foreground">선택 파일 {documentEvidenceFiles.length}건</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={!canScheduleDelivery || submitting}>
                인도 일정 등록
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!canConfirmDelivery || submitting || !deliveryChecklistReady}
                onClick={() => void confirmDelivery()}
              >
                딜러 인도 확인
              </Button>
            </div>
          </form>
          <p className="text-xs text-muted-foreground">
            현재: {workflow.delivery_scheduled_at ? new Date(workflow.delivery_scheduled_at).toLocaleString() : "등록 전"} /{" "}
            {workflow.delivery_location || "-"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">딜러 송금 등록</CardTitle>
        </CardHeader>
        <CardContent data-spec-codes={DEALER_TRADE_TS_SPEC_CODES.join(",")}>
          <p className="mb-3 text-xs text-muted-foreground">딜러는 인도 완료 후 송금 등록 의무가 있으며 필수 항목 충족 시에만 제출됩니다.</p>
          <form className="space-y-3" onSubmit={submitRemittance}>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="dealer-remit-date">실제 송금일</Label>
                <Input id="dealer-remit-date" type="date" value={remittanceDate} onChange={(e) => setRemittanceDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dealer-remit-amount">송금 금액</Label>
                <Input
                  id="dealer-remit-amount"
                  value={remittanceAmount}
                  onChange={(e) => setRemittanceAmount(e.target.value.replace(/[^0-9]/g, ""))}
                  inputMode="numeric"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dealer-remit-method">송금 방법</Label>
                <select
                  id="dealer-remit-method"
                  value={remittanceMethod}
                  onChange={(e) => setRemittanceMethod(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="ACCOUNT_TRANSFER">계좌 이체</option>
                  <option value="OTHER">기타</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dealer-remit-bank">송금 계좌</Label>
                <Input
                  id="dealer-remit-bank"
                  value={remittanceBankAccount}
                  onChange={(e) => setRemittanceBankAccount(e.target.value)}
                  placeholder="은행명/계좌번호"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dealer-remit-ref">참조값</Label>
                <Input
                  id="dealer-remit-ref"
                  value={remittanceReference}
                  onChange={(e) => setRemittanceReference(e.target.value)}
                  placeholder="TXN-20260304-001"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dealer-remit-files">송금 증빙 첨부(필수, 각 10MB)</Label>
              <Input
                id="dealer-remit-files"
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(event) => {
                  const files = Array.from(event.currentTarget.files ?? []);
                  setRemittanceEvidenceFiles(files);
                }}
              />
              {remittanceEvidenceFiles.length > 0 && (
                <p className="text-xs text-muted-foreground">선택 파일 {remittanceEvidenceFiles.length}건</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dealer-remit-note">송금 특이사항(선택)</Label>
              <Textarea
                id="dealer-remit-note"
                rows={3}
                value={remittanceNote}
                onChange={(e) => setRemittanceNote(e.target.value)}
                placeholder="특이사항이 있으면 입력해 주세요."
              />
            </div>
            <Button type="submit" disabled={!canSubmitRemittance || submitting || !remittanceRequiredReady}>
              송금 등록
            </Button>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">
            송금 상태: {workflow.remittance_status} / 등록시각:{" "}
            {workflow.remittance_submitted_at ? new Date(workflow.remittance_submitted_at).toLocaleString() : "-"}
          </p>
        </CardContent>
      </Card>

      {(isCompleted || workflow.settlement_status === "COMPLETED") && (
        <Card data-spec-codes={DEALER_TRADE_TS_SPEC_CODES.join(",")}>
          <CardHeader>
            <CardTitle className="text-base">거래 완료 요약</CardTitle>
            <CardDescription>완료 단계 시각 정보는 고정되며 이후 변경할 수 없습니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Alert>
              <AlertTitle>거래가 완료되었습니다.</AlertTitle>
              <AlertDescription>정산 상태는 완료로 고정되며, 모든 완료 시각은 종결 시점 기준으로 유지됩니다.</AlertDescription>
            </Alert>
            <p>차량 인도 확정 시각: {workflow.delivery_completed_at ? new Date(workflow.delivery_completed_at).toLocaleString() : "-"}</p>
            <p>딜러 송금 정산 확정 시각: {workflow.remittance_confirmed_at ? new Date(workflow.remittance_confirmed_at).toLocaleString() : "-"}</p>
            <p>
              시스템 최종 확정 시각:{" "}
              {workflow.settlement_completed_at
                ? new Date(workflow.settlement_completed_at).toLocaleString()
                : settlementEvent
                  ? new Date(settlementEvent.created_at).toLocaleString()
                  : "-"}
            </p>
            <p>실제 송금일: {completedRemittedAt ? new Date(completedRemittedAt).toLocaleString() : "-"}</p>
            <p>최종 거래 금액: {Math.round(workflow.settlement_amount ?? workflow.agreed_price ?? workflow.base_price).toLocaleString()} {workflow.currency}</p>
            <p>송금 방식: {completedRemittanceMethod === "OTHER" ? "기타" : "계좌 이체"}</p>
            <p>정산 상태: <span className="font-medium">정산 완료</span></p>
            {completedRemittanceNote && <p>송금 특이사항: {completedRemittanceNote}</p>}
            <div className="space-y-2 rounded-md border border-border/70 p-3">
              <p className="font-medium">명의 이전/말소 파일 이력</p>
              {completedRemittanceFiles.length === 0 && <p className="text-xs text-muted-foreground">등록된 파일이 없습니다.</p>}
              {completedRemittanceFiles.map((file, idx) => (
                <div key={`${file.name}-${idx}`} className="flex items-center justify-between gap-2 text-xs">
                  <span>{file.name}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      downloadText(
                        `transfer-file-${idx + 1}.txt`,
                        `name=${file.name}\nsize=${file.size_bytes}\ncontent_type=${file.content_type ?? ""}\npermanent=true`,
                      )
                    }
                  >
                    다운로드
                  </Button>
                </div>
              ))}
            </div>
            <div className="pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEvidenceOpen(true)}
                disabled={!workflow.remittance_reference && !workflow.remittance_bank_account && !workflow.remittance_submitted_at}
              >
                증빙 보기
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="ml-2"
                onClick={() =>
                  downloadText(
                    `settlement-${workflow.vehicle_id}.txt`,
                    `vehicle=${workflow.vehicle_title}\namount=${Math.round(workflow.settlement_amount ?? workflow.agreed_price ?? workflow.base_price)}\nstatus=COMPLETED`,
                  )
                }
              >
                정산 결과 다운로드
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">이벤트 이력</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[...workflow.events].reverse().slice(0, 20).map((event) => (
            <div key={event.id} className="rounded-md border border-border/80 p-3 text-sm">
              <p className="font-medium">{event.event_type}</p>
              <p>{event.message}</p>
              <p className="text-xs text-muted-foreground">{new Date(event.created_at).toLocaleString()}</p>
            </div>
          ))}
          {workflow.events.length === 0 && <p className="text-sm text-muted-foreground">기록된 이벤트가 없습니다.</p>}
        </CardContent>
      </Card>

      <Dialog open={evidenceOpen} onOpenChange={setEvidenceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>송금 증빙 보기</DialogTitle>
            <DialogDescription>거래에 등록된 송금 증빙 정보를 확인합니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p>송금 등록 시각: {workflow.remittance_submitted_at ? new Date(workflow.remittance_submitted_at).toLocaleString() : "-"}</p>
            <p>송금 확인 시각: {workflow.remittance_confirmed_at ? new Date(workflow.remittance_confirmed_at).toLocaleString() : "-"}</p>
            <p>송금 방법: {completedRemittanceMethod === "OTHER" ? "기타" : "계좌 이체"}</p>
            <p>송금 계좌: {workflow.remittance_bank_account || "-"}</p>
            <p>참조값: {workflow.remittance_reference || "-"}</p>
            <p>송금 특이사항: {completedRemittanceNote || "-"}</p>
            <div className="space-y-1 rounded-md border border-border/80 p-3">
              <p className="font-medium">인도 증빙 파일</p>
              {[...completedDeliveryVehicleFiles, ...completedDeliveryDocFiles].length === 0 && (
                <p className="text-xs text-muted-foreground">등록된 인도 증빙 파일이 없습니다.</p>
              )}
              {[...completedDeliveryVehicleFiles, ...completedDeliveryDocFiles].map((file, idx) => (
                <div key={`${file.name}-${idx}`} className="flex items-center justify-between gap-2 text-xs">
                  <span>{file.name}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      downloadText(
                        `delivery-evidence-${idx + 1}.txt`,
                        `name=${file.name}\nsize=${file.size_bytes}\ncontent_type=${file.content_type ?? ""}`,
                      )
                    }
                  >
                    다운로드
                  </Button>
                </div>
              ))}
            </div>
            <div className="space-y-1 rounded-md border border-border/80 p-3">
              <p className="font-medium">송금 증빙 파일</p>
              {completedRemittanceFiles.length === 0 && <p className="text-xs text-muted-foreground">등록된 송금 증빙 파일이 없습니다.</p>}
              {completedRemittanceFiles.map((file, idx) => (
                <div key={`${file.name}-${idx}`} className="flex items-center justify-between gap-2 text-xs">
                  <span>{file.name}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      downloadText(
                        `remittance-evidence-${idx + 1}.txt`,
                        `name=${file.name}\nsize=${file.size_bytes}\ncontent_type=${file.content_type ?? ""}`,
                      )
                    }
                  >
                    다운로드
                  </Button>
                </div>
              ))}
            </div>
            <div className="space-y-1 rounded-md border border-border/80 p-3">
              <p className="font-medium">증빙 이벤트 로그</p>
              {[...workflow.events]
                .reverse()
                .filter((event) => event.event_type === "REMITTANCE_SUBMITTED")
                .slice(0, 5)
                .map((event) => (
                  <div key={event.id} className="rounded border border-border/60 p-2 text-xs">
                    <p>{event.message}</p>
                    <p className="text-muted-foreground">{new Date(event.created_at).toLocaleString()}</p>
                  </div>
                ))}
              {!workflow.events.some((event) => event.event_type === "REMITTANCE_SUBMITTED") && (
                <p className="text-xs text-muted-foreground">등록된 증빙 이벤트가 없습니다.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setEvidenceOpen(false)}>
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {message && (
        <Alert>
          <AlertTitle>처리 완료</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>요청 실패</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </section>
  );
}
