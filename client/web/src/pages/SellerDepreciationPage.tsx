import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useAuth } from "../app/AuthContext";
import tradeVehicleImage from "../assets/frt010-empty-vehicle.png";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  getSellerTradeWorkflow,
  getSellerVehicleDetail,
  sellerApproveDepreciation,
  sellerRequestRenegotiation,
} from "../lib/api";
import type { SellerVehicleDetail, TradeWorkflow } from "../lib/types";

interface UploadFileMeta {
  name: string;
  size: number;
}

function depreciationStatusBadge(status: TradeWorkflow["depreciation_status"]) {
  if (status === "PROPOSAL_REQUIRED") return <Badge variant="outline">딜러 제안 대기</Badge>;
  if (status === "SELLER_REVIEW") return <Badge>감가 협의중</Badge>;
  if (status === "RENEGOTIATION_REQUESTED") return <Badge variant="outline">재협의 요청됨</Badge>;
  return <Badge variant="secondary">감가 협의 완료</Badge>;
}

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function validateAttachment(file: File): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (!["pdf", "png", "jpg", "jpeg"].includes(ext)) return "첨부 파일 형식은 PDF/JPG/JPEG/PNG만 가능합니다.";
  if (file.size > 10 * 1024 * 1024) return "첨부 파일은 10MB 이하만 가능합니다.";
  return null;
}

export function SellerDepreciationPage() {
  const { token } = useAuth();
  const { vehicleId } = useParams<{ vehicleId: string }>();

  const [detail, setDetail] = useState<SellerVehicleDetail | null>(null);
  const [workflow, setWorkflow] = useState<TradeWorkflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [showRenegotiateForm, setShowRenegotiateForm] = useState(false);
  const [renegotiateReason, setRenegotiateReason] = useState("");
  const [renegotiateTargetPrice, setRenegotiateTargetPrice] = useState("");
  const [renegotiateAttachment, setRenegotiateAttachment] = useState<UploadFileMeta | null>(null);

  const load = async () => {
    if (!token || !vehicleId) return;
    setLoading(true);
    setError(null);
    try {
      const [vehicle, flow] = await Promise.all([getSellerVehicleDetail(token, vehicleId), getSellerTradeWorkflow(token, vehicleId)]);
      setDetail(vehicle);
      setWorkflow(flow);
    } catch (err) {
      setError(err instanceof Error ? err.message : "감가 협의 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [token, vehicleId]);

  const totalDepreciation = useMemo(
    () => workflow?.depreciation_items.reduce((sum, item) => sum + item.amount, 0) ?? 0,
    [workflow?.depreciation_items],
  );
  const basePrice = workflow?.base_price ?? detail?.winning_price ?? detail?.reserve_price ?? 0;
  const finalPrice = Math.max(0, basePrice - totalDepreciation);

  const approveDepreciation = async () => {
    if (!token || !vehicleId) return;
    setError(null);
    try {
      const flow = await sellerApproveDepreciation(token, vehicleId);
      setWorkflow(flow);
      setMessage("감가 금액이 최종 승인되어 인도/정산 단계로 전환되었습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "감가 승인 실패");
    }
  };

  const submitRenegotiation = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token || !vehicleId) return;

    const price = Number(renegotiateTargetPrice.replace(/,/g, ""));
    if (!renegotiateReason.trim() || !Number.isFinite(price) || price <= 0) {
      setError("재협의 사유와 희망 금액을 올바르게 입력해 주세요.");
      return;
    }

    setError(null);
    try {
      const flow = await sellerRequestRenegotiation(token, vehicleId, {
        reason: renegotiateReason.trim(),
        target_price: Math.round(price),
      });
      setWorkflow(flow);
      setShowRenegotiateForm(false);
      setMessage("재협의 요청이 접수되었습니다. 딜러 수정 응답 전까지 거래 금액은 임시 상태로 유지됩니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "재협의 요청 실패");
    }
  };

  const exportReport = () => {
    if (!detail || !vehicleId || !workflow) return;
    const lines = [
      `차량ID: ${vehicleId}`,
      `차량명: ${detail.title}`,
      `기준금액: ${basePrice}`,
      `감가총액: ${totalDepreciation}`,
      `최종예정금액: ${finalPrice}`,
      `검차 리포트: ${workflow.inspection_report_url || "-"}`,
      "감가 항목",
      ...workflow.depreciation_items.map((item) => `- ${item.label}: ${item.amount} (${item.note || "-"})`),
    ];
    downloadTextFile(`${vehicleId}_inspection_report.txt`, lines.join("\n"));
  };

  if (loading) {
    return (
      <section className="mx-auto max-w-4xl">
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">감가 협의 데이터를 불러오는 중...</CardContent>
        </Card>
      </section>
    );
  }

  if (!detail || !workflow) {
    return (
      <section className="mx-auto max-w-4xl space-y-3">
        <Card>
          <CardContent className="pt-6 text-sm">차량 정보를 찾을 수 없습니다.</CardContent>
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

  const canApproveOrRenegotiate = workflow.depreciation_status === "SELLER_REVIEW";
  const isAgreed = workflow.depreciation_status === "AGREED";
  const statusLabel =
    workflow.depreciation_status === "PROPOSAL_REQUIRED"
      ? "딜러 감가 제안 대기"
      : workflow.depreciation_status === "SELLER_REVIEW"
        ? "감가 협의중"
        : workflow.depreciation_status === "RENEGOTIATION_REQUESTED"
          ? "재협의 요청됨"
          : "감가 협의 완료";

  return (
    <section className="mx-auto max-w-4xl space-y-4">
      <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
        <CardContent className="grid gap-0 p-0 lg:grid-cols-[1.55fr_0.95fr]">
          <div className="space-y-4 p-5 lg:p-6">
            <div className="flex flex-wrap items-center gap-2">
              {depreciationStatusBadge(workflow.depreciation_status)}
              <Badge variant="outline">감가 / 협의</Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-[1.1fr_1fr]">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                <img alt={detail.title} className="h-full w-full object-contain p-3" src={tradeVehicleImage} />
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-[#2f6ff5]">감가 협의</p>
                  <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950">{detail.title}</p>
                  <p className="mt-2 text-sm text-slate-500">
                    {detail.year}년식 · {detail.mileage_km.toLocaleString()} km · {detail.fuel_type} · 차량번호 {detail.license_plate || "-"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">기준 금액(낙찰가)</p>
                    <p className="mt-1 font-semibold text-slate-900">{basePrice.toLocaleString()}원</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">감가 총액</p>
                    <p className="mt-1 font-semibold text-rose-500">-{totalDepreciation.toLocaleString()}원</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 md:col-span-2">
                    <p className="text-xs text-slate-500">최종 거래 예정 금액</p>
                    <p className="mt-1 text-2xl font-black tracking-tight text-[#2f6ff5]">{finalPrice.toLocaleString()}원</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-200 bg-slate-50/80 p-5 lg:border-l lg:border-t-0 lg:p-6">
            <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <p className="text-sm font-semibold text-slate-700">진행 요약</p>
              <div className="space-y-2 text-sm text-slate-600">
                <p>{statusLabel}</p>
                <p>{detail.title}의 감가 내역을 확인하고 승인 또는 재협의를 진행합니다.</p>
              </div>
              <div className="grid gap-2 pt-2">
                <Button asChild className="bg-[#2f6ff5] hover:bg-[#2459cd]">
                  <Link to={`/seller/vehicles/${detail.id}`}>차량 상세 보기</Link>
                </Button>
                <Button type="button" variant="outline" onClick={exportReport}>
                  검차 리포트 다운로드
                </Button>
                {canApproveOrRenegotiate && (
                  <Button type="button" variant="secondary" onClick={() => setShowRenegotiateForm((v) => !v)}>
                    재협의 요청
                  </Button>
                )}
                {canApproveOrRenegotiate ? (
                  <Button type="button" onClick={() => void approveDepreciation()}>
                    감가 금액 승인
                  </Button>
                ) : (
                  <Button type="button" disabled>
                    감가 단계 잠금됨
                  </Button>
                )}
                {isAgreed && (
                  <Button asChild>
                    <Link to={`/seller/vehicles/${detail.id}/delivery-settlement-progress`}>인도/정산 진행</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">감가 항목</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {workflow.depreciation_items.map((item) => (
            <div key={item.id} className="rounded-md border border-border/80 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-sm font-semibold">-{item.amount.toLocaleString()}</p>
              </div>
              <p className="text-xs text-muted-foreground">{item.note || "-"}</p>
            </div>
          ))}
          {workflow.depreciation_items.length === 0 && (
            <p className="text-sm text-muted-foreground">딜러 감가 제안이 아직 등록되지 않았습니다.</p>
          )}
        </CardContent>
      </Card>

      {showRenegotiateForm && canApproveOrRenegotiate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">감가 재협의 요청</CardTitle>
            <CardDescription>사유/희망금액/첨부파일 유효성 검증 후 요청됩니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={submitRenegotiation}>
              <div className="space-y-2">
                <Label htmlFor="depreciation-reason">재협의 사유</Label>
                <Textarea
                  id="depreciation-reason"
                  value={renegotiateReason}
                  onChange={(e) => setRenegotiateReason(e.target.value)}
                  rows={3}
                  placeholder="딜러 제안 감가 내역 중 조정이 필요한 사유를 입력"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="depreciation-target-price">희망 금액</Label>
                <Input
                  id="depreciation-target-price"
                  value={renegotiateTargetPrice}
                  onChange={(e) => setRenegotiateTargetPrice(e.target.value.replace(/[^0-9]/g, ""))}
                  inputMode="numeric"
                  placeholder="숫자만 입력"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="depreciation-attach">첨부 파일(선택)</Label>
                <Input
                  id="depreciation-attach"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const validationError = validateAttachment(file);
                    if (validationError) {
                      setError(validationError);
                      e.currentTarget.value = "";
                      return;
                    }
                    setError(null);
                    setRenegotiateAttachment({ name: file.name, size: file.size });
                  }}
                />
                {renegotiateAttachment && (
                  <p className="text-xs text-muted-foreground">
                    첨부됨: {renegotiateAttachment.name} ({Math.ceil(renegotiateAttachment.size / 1024)}KB)
                  </p>
                )}
              </div>
              <Button type="submit">재협의 요청 제출</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {workflow.renegotiation_requested_at && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">최근 재협의 요청</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>요청 시각: {new Date(workflow.renegotiation_requested_at).toLocaleString()}</p>
            <p>사유: {workflow.renegotiation_reason || "-"}</p>
            <p>희망 금액: {(workflow.renegotiation_target_price ?? 0).toLocaleString()}</p>
          </CardContent>
        </Card>
      )}

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
