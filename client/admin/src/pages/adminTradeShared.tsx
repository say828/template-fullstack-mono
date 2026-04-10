import { Badge } from "../components/ui/badge";
import type { TradeStage, TradeWorkflow } from "../lib/types";

export function adminStageLabel(stage: TradeStage) {
  if (stage === "INSPECTION") return "검차";
  if (stage === "DEPRECIATION") return "감가협의";
  if (stage === "DELIVERY") return "인도";
  if (stage === "REMITTANCE") return "송금확인";
  if (stage === "SETTLEMENT") return "정산";
  if (stage === "COMPLETED") return "거래완료";
  return "취소";
}

export function adminStageBadge(stage: TradeStage) {
  if (stage === "COMPLETED") return <Badge variant="secondary">{adminStageLabel(stage)}</Badge>;
  if (stage === "CANCELLED") return <Badge variant="destructive">{adminStageLabel(stage)}</Badge>;
  if (stage === "DEPRECIATION" || stage === "REMITTANCE" || stage === "SETTLEMENT") return <Badge>{adminStageLabel(stage)}</Badge>;
  return <Badge variant="outline">{adminStageLabel(stage)}</Badge>;
}

export function workflowPriceText(workflow: TradeWorkflow) {
  return `${Math.round(workflow.agreed_price ?? workflow.base_price).toLocaleString()} ${workflow.currency}`;
}

export function workflowQueueStatus(workflow: TradeWorkflow) {
  if (workflow.current_stage === "INSPECTION") {
    if (workflow.inspection_status === "PROPOSED") return "제안 필요";
    if (workflow.inspection_status === "RESCHEDULE_REQUESTED") return "조율 요청";
    if (workflow.inspection_status === "CONFIRMED") return "응답 대기";
    return "리포트 제출";
  }
  if (workflow.current_stage === "DEPRECIATION") {
    if (workflow.depreciation_status === "PROPOSAL_REQUIRED") return "제안 필요";
    if (workflow.depreciation_status === "SELLER_REVIEW") return "승인 대기";
    if (workflow.depreciation_status === "RENEGOTIATION_REQUESTED") return "재협의";
    return "합의 완료";
  }
  if (workflow.current_stage === "DELIVERY") {
    if (workflow.delivery_status === "WAITING_SCHEDULE") return "일정 대기";
    if (workflow.delivery_status === "SCHEDULED") return "승인 대기";
    if (workflow.delivery_status === "IN_PROGRESS") return "인도 완료 대기";
    return "인도 완료";
  }
  if (workflow.current_stage === "REMITTANCE") {
    if (workflow.remittance_status === "WAITING") return "송금 대기";
    if (workflow.remittance_status === "SUBMITTED") return "확인 대기";
    return "송금 확인";
  }
  if (workflow.current_stage === "SETTLEMENT") {
    return workflow.settlement_status === "WAITING" ? "정산 대기" : "정산 완료";
  }
  if (workflow.current_stage === "COMPLETED") return "완료";
  if (workflow.current_stage === "CANCELLED") return "취소";
  return "입찰 진행";
}
