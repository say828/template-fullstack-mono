import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useAuth } from "../../app/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  dealerConfirmDelivery,
  dealerScheduleDelivery,
  dealerSubmitRemittance,
  getDealerTradeWorkflow,
} from "../../lib/api";
import type { TradeWorkflow } from "../../lib/types";
import {
  currencyText,
  finalTradeAmount,
  formatDateTime,
  workflowToDealerTransactionStage,
  type DealerTransactionStage,
} from "./shared";

const stageMeta: Record<DealerTransactionStage, { label: string; code: string; step: number }> = {
  inspection: { label: "거래결제상세(검차일정)", code: "DL_020", step: 2 },
  "inspection-confirmed": { label: "거래결제상세(검차일정확정)", code: "DL_021", step: 2 },
  "depreciation-waiting": { label: "거래결제상세(감가입력전)", code: "DL_022", step: 4 },
  "depreciation-submitted": { label: "거래결제상세(감가입력후)", code: "DL_024", step: 4 },
  "depreciation-renegotiation": { label: "거래결제상세(감가재협의)", code: "DL_025", step: 4 },
  delivery: { label: "거래결제상세(인도진행)", code: "DL_026", step: 5 },
  remittance: { label: "거래결제상세(송금정산)", code: "DL_028", step: 6 },
  completed: { label: "거래결제상세(거래완료)", code: "DL_029", step: 7 },
};

const pipeline = ["낙찰 완료", "검차 일정", "검차 완료", "감가 협의", "인도 진행", "송금/정산", "거래 완료"];

function isStage(value: string | undefined): value is DealerTransactionStage {
  return Boolean(value && value in stageMeta);
}

function stagePathFromWorkflow(workflow: TradeWorkflow) {
  return workflowToDealerTransactionStage(workflow);
}

export function DealerTransactionDetailPage() {
  const { token } = useAuth();
  const { vehicleId, stage: stageParam } = useParams<{ vehicleId: string; stage: string }>();

  const [workflow, setWorkflow] = useState<TradeWorkflow | null>(null);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [deliveryAt, setDeliveryAt] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("직접 인도");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [remittanceAmount, setRemittanceAmount] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [reference, setReference] = useState("");

  const load = async () => {
    if (!token || !vehicleId) {
      setWorkflow(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getDealerTradeWorkflow(token, vehicleId);
      setWorkflow(data);
      setDeliveryAt(data.delivery_scheduled_at ? data.delivery_scheduled_at.slice(0, 16) : "");
      setDeliveryMethod(data.delivery_method || "직접 인도");
      setDeliveryLocation(data.delivery_location || "");
      setRemittanceAmount(data.remittance_amount ? String(data.remittance_amount) : String(finalTradeAmount(data)));
      setBankAccount(data.remittance_bank_account || "");
      setReference(data.remittance_reference || "");
    } catch (err) {
      setWorkflow(null);
      setError(err instanceof Error ? err.message : "거래 상세 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [token, vehicleId]);

  const requestedStage = isStage(stageParam) ? stageParam : "inspection";
  const actualStage = workflow ? stagePathFromWorkflow(workflow) : requestedStage;
  const stage = workflow ? actualStage : requestedStage;

  const nextStage = useMemo(() => {
    if (stage === "inspection" || stage === "inspection-confirmed") return "depreciation-waiting";
    if (stage === "depreciation-waiting") return "depreciation-submitted";
    if (stage === "depreciation-submitted" || stage === "depreciation-renegotiation") return "delivery";
    if (stage === "delivery") return "remittance";
    if (stage === "remittance") return "completed";
    return null;
  }, [stage]);

  const submitDeliverySchedule = async () => {
    if (!token || !vehicleId) return;
    if (!deliveryAt || !deliveryLocation.trim()) {
      setError("인도 일시와 장소를 입력해 주세요.");
      return;
    }

    setActing(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await dealerScheduleDelivery(token, vehicleId, {
        scheduled_at: new Date(deliveryAt).toISOString(),
        method: deliveryMethod,
        location: deliveryLocation,
      });
      setWorkflow(updated);
      setMessage("인도 일정이 등록되었습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "인도 일정 등록 실패");
    } finally {
      setActing(false);
    }
  };

  const confirmDelivery = async () => {
    if (!token || !vehicleId) return;

    setActing(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await dealerConfirmDelivery(token, vehicleId, {
        checklist_items: ["차량 인도 확인", "서류 인수 확인"],
      });
      setWorkflow(updated);
      setMessage("인도 완료를 등록했습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "인도 완료 등록 실패");
    } finally {
      setActing(false);
    }
  };

  const submitRemittance = async () => {
    if (!token || !vehicleId || !workflow) return;
    const amount = Number(remittanceAmount);
    if (!amount || !bankAccount.trim() || !reference.trim()) {
      setError("송금 금액, 계좌 정보, 송금 식별값을 입력해 주세요.");
      return;
    }

    setActing(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await dealerSubmitRemittance(token, vehicleId, {
        amount,
        bank_account: bankAccount,
        reference,
        method: "BANK_TRANSFER",
      });
      setWorkflow(updated);
      setMessage("송금 정보를 등록했습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "송금 정보 등록 실패");
    } finally {
      setActing(false);
    }
  };

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-3xl font-black text-slate-900">{stageMeta[stage].label}</h1>
        <p className="text-sm text-slate-500">{stageMeta[stage].code} 거래·결제 상태 상세</p>
      </header>

      {actualStage !== requestedStage && workflow && (
        <Alert>
          <AlertTitle>현재 상태 기준으로 보정됨</AlertTitle>
          <AlertDescription>요청한 경로와 실제 워크플로우 단계가 달라 현재 단계인 `{stageMeta[actualStage].label}` 기준으로 표시합니다.</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>처리 실패</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {message && (
        <Alert className="border-emerald-200 bg-emerald-50">
          <AlertTitle className="text-emerald-700">처리 완료</AlertTitle>
          <AlertDescription className="text-emerald-700">{message}</AlertDescription>
        </Alert>
      )}

      {loading && <p className="text-sm text-slate-500">거래 상세를 불러오는 중...</p>}

      {!loading && !workflow && (
        <Card>
          <CardContent className="pt-6 text-sm text-slate-500">거래 워크플로우 정보를 찾을 수 없습니다.</CardContent>
        </Card>
      )}

      {workflow && (
        <>
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-3 md:grid-cols-7">
                {pipeline.map((item, index) => {
                  const active = index + 1 <= stageMeta[stage].step;
                  return (
                    <div key={item} className="space-y-1 text-center">
                      <div className={`mx-auto h-2 w-full rounded-full ${active ? "bg-[#2f6ff5]" : "bg-slate-200"}`} />
                      <p className={`text-xs ${active ? "font-semibold text-[#2f6ff5]" : "text-slate-400"}`}>{item}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">거래 상태 상세</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-700">
                {(stage === "inspection" || stage === "inspection-confirmed") && (
                  <>
                    <p>검차 일정: {formatDateTime(workflow.inspection_scheduled_at)}</p>
                    <p>검차 장소: {workflow.inspection_location || "-"}</p>
                    <p>검차 담당자: {workflow.inspection_assignee || "-"}</p>
                    <p>연락처: {workflow.inspection_contact || "-"}</p>
                    <p>검차 확정 시각: {formatDateTime(workflow.inspection_confirmed_at)}</p>
                    <p>검차 완료 시각: {formatDateTime(workflow.inspection_completed_at)}</p>
                  </>
                )}

                {stage === "depreciation-waiting" && (
                  <>
                    <p>검차가 완료되면 딜러가 감가 항목을 등록할 수 있습니다.</p>
                    <p>검차 요약: {workflow.inspection_summary || "-"}</p>
                    <div className="flex flex-wrap gap-2">
                      {workflow.inspection_report_url && (
                        <Button asChild type="button" variant="outline">
                          <a href={workflow.inspection_report_url} rel="noreferrer" target="_blank">검차 리포트 열기</a>
                        </Button>
                      )}
                      <Button asChild className="bg-[#2f6ff5] hover:bg-[#2459cd]" type="button">
                        <Link to={`/dealer/transactions/${workflow.vehicle_id}/depreciation`}>감가 금액 입력하기</Link>
                      </Button>
                    </div>
                  </>
                )}

                {(stage === "depreciation-submitted" || stage === "depreciation-renegotiation") && (
                  <>
                    <p>감가 제출 시각: {formatDateTime(workflow.depreciation_submitted_at)}</p>
                    <p>감가 합계: -{currencyText(workflow.depreciation_total ?? 0, workflow.currency)}</p>
                    <p>딜러 메모: {workflow.depreciation_comment || "-"}</p>
                    {workflow.renegotiation_reason && <p>재협의 사유: {workflow.renegotiation_reason}</p>}
                    {workflow.renegotiation_target_price != null && (
                      <p>판매자 요청 금액: {currencyText(workflow.renegotiation_target_price, workflow.currency)}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Button asChild type="button" variant="outline">
                        <Link to={`/dealer/transactions/${workflow.vehicle_id}/depreciation`}>제안 수정하기</Link>
                      </Button>
                      <Button asChild type="button" variant="secondary">
                        <Link to={`/dealer/transactions/${workflow.vehicle_id}/depreciation/history`}>감가 합의 내역 보기</Link>
                      </Button>
                    </div>
                  </>
                )}

                {stage === "delivery" && (
                  <>
                    <p>감가 합의 시각: {formatDateTime(workflow.depreciation_agreed_at)}</p>
                    <p>판매자 연락처: {workflow.seller_phone || "-"}</p>

                    <div className="grid gap-3 rounded-lg border border-slate-200 p-4 md:grid-cols-2">
                      <div className="space-y-1">
                        <Label htmlFor="dealer-delivery-at">인도 일시</Label>
                        <Input id="dealer-delivery-at" type="datetime-local" value={deliveryAt} onChange={(event) => setDeliveryAt(event.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="dealer-delivery-method">인도 방식</Label>
                        <Input id="dealer-delivery-method" value={deliveryMethod} onChange={(event) => setDeliveryMethod(event.target.value)} />
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <Label htmlFor="dealer-delivery-location">인도 장소</Label>
                        <Input id="dealer-delivery-location" value={deliveryLocation} onChange={(event) => setDeliveryLocation(event.target.value)} />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button className="bg-[#2f6ff5] hover:bg-[#2459cd]" disabled={acting} onClick={() => void submitDeliverySchedule()} type="button">
                        인도 일정 저장
                      </Button>
                      <Button disabled={acting || !workflow.delivery_scheduled_at} onClick={() => void confirmDelivery()} type="button" variant="secondary">
                        인도 완료 등록
                      </Button>
                    </div>
                  </>
                )}

                {stage === "remittance" && (
                  <>
                    <p>인도 예정/완료: {formatDateTime(workflow.delivery_scheduled_at)} / {formatDateTime(workflow.delivery_completed_at)}</p>
                    <div className="grid gap-3 rounded-lg border border-slate-200 p-4 md:grid-cols-2">
                      <div className="space-y-1">
                        <Label htmlFor="dealer-remittance-amount">송금 금액</Label>
                        <Input id="dealer-remittance-amount" type="number" value={remittanceAmount} onChange={(event) => setRemittanceAmount(event.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="dealer-remittance-reference">송금 식별값</Label>
                        <Input id="dealer-remittance-reference" value={reference} onChange={(event) => setReference(event.target.value)} />
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <Label htmlFor="dealer-remittance-bank">입금 계좌 정보</Label>
                        <Input id="dealer-remittance-bank" value={bankAccount} onChange={(event) => setBankAccount(event.target.value)} />
                      </div>
                    </div>
                    <Button className="bg-[#2f6ff5] hover:bg-[#2459cd]" disabled={acting} onClick={() => void submitRemittance()} type="button">
                      송금 정보 등록
                    </Button>
                  </>
                )}

                {stage === "completed" && (
                  <>
                    <p>인도 완료: {formatDateTime(workflow.delivery_completed_at)}</p>
                    <p>송금 등록: {formatDateTime(workflow.remittance_submitted_at)}</p>
                    <p>송금 확인: {formatDateTime(workflow.remittance_confirmed_at)}</p>
                    <p>정산 완료: {formatDateTime(workflow.settlement_completed_at)}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button asChild type="button" variant="outline">
                        <Link to={`/dealer/transactions/${workflow.vehicle_id}/receipt`}>증빙 보기</Link>
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">거래 요약</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-semibold text-slate-900">{workflow.vehicle_title}</p>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">낙찰가</span>
                  <span className="font-semibold text-slate-900">{currencyText(workflow.base_price, workflow.currency)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">감가 확정</span>
                  <span className="font-semibold text-slate-900">-{currencyText(workflow.depreciation_total ?? 0, workflow.currency)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">최종 거래가</span>
                  <span className="font-semibold text-slate-900">{currencyText(finalTradeAmount(workflow), workflow.currency)}</span>
                </div>
                <div className="pt-2">
                  <Badge variant="outline">현재 단계 {stageMeta[stage].step}/7</Badge>
                </div>

                <div className="space-y-2 pt-2">
                  {nextStage && (
                    <Button asChild className="w-full bg-[#2f6ff5] hover:bg-[#2459cd]" type="button">
                      <Link to={`/dealer/transactions/${workflow.vehicle_id}/detail/${nextStage}`}>다음 단계 보기</Link>
                    </Button>
                  )}
                  <Button asChild type="button" variant="outline" className="w-full">
                    <Link to="/dealer/support/inquiries">문의사항이 있으신가요? 고객센터</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </section>
  );
}
