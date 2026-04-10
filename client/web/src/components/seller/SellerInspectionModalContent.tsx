import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import type { TradeWorkflow } from "../../lib/types";

export function formatInspectionProposalDateTime(value?: string | null) {
  if (!value) return "-";
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return "-";
  return target.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

interface SellerInspectionInfoModalContentProps {
  workflow: TradeWorkflow;
  onRequestReschedule: () => void;
  approvePending?: boolean;
  onApprove: () => void;
}

export function SellerInspectionInfoModalContent({
  workflow,
  onRequestReschedule,
  approvePending = false,
  onApprove,
}: SellerInspectionInfoModalContentProps) {
  return (
    <div className="space-y-5 px-7 py-6">
      <div className="rounded-xl bg-[#edf4ff] px-4 py-3 text-[13px] font-semibold leading-5 text-[#356ae6]">
        평가사가 아래와 같이 검차 일정을 제안했습니다.
        <br />
        일정 확인 후 승인 또는 다른 일정 요청을 선택해주세요.
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-5 text-sm">
        <div className="space-y-1.5">
          <p className="text-[13px] font-medium text-slate-400">제안된 일정</p>
          <p className="font-semibold leading-6 text-slate-950">{formatInspectionProposalDateTime(workflow.inspection_scheduled_at)}</p>
        </div>
        <div className="space-y-1.5">
          <p className="text-[13px] font-medium text-slate-400">검차 담당자</p>
          <p className="font-semibold leading-6 text-slate-950">{workflow.inspection_assignee || "-"}</p>
        </div>
        <div className="space-y-1.5">
          <p className="text-[13px] font-medium text-slate-400">검차 장소</p>
          <p className="font-semibold leading-6 text-slate-950">{workflow.inspection_location || "-"}</p>
        </div>
        <div className="space-y-1.5">
          <p className="text-[13px] font-medium text-slate-400">담당자 연락처</p>
          <p className="font-semibold leading-6 text-slate-950">{workflow.inspection_contact || "-"}</p>
        </div>
        <div className="space-y-1.5">
          <p className="text-[13px] font-medium text-slate-400">검차 유형</p>
          <p className="font-semibold leading-6 text-slate-950">PALKA 협력 검사센터 방문</p>
        </div>
        <div className="space-y-1.5">
          <p className="text-[13px] font-medium text-slate-400">준비 서류</p>
          <p className="font-semibold leading-6 text-slate-950">자동차등록증, 신분증 사본, 차량 키</p>
        </div>
      </div>

      <p className="text-[12px] leading-5 text-slate-400">
        일정이 어려운 경우 `다른 일정 요청` 버튼을 눌러 새로운 날짜와 시간을 제안할 수 있습니다.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-11 rounded-xl border-[#7ca3ff] text-[#356ae6] hover:bg-[#edf4ff]"
          onClick={onRequestReschedule}
        >
          다른 일정 요청
        </Button>
        <Button
          className="h-11 rounded-xl bg-[#356ae6] text-white hover:bg-[#2859cd]"
          disabled={approvePending}
          onClick={onApprove}
          type="button"
        >
          일정 승인하기
        </Button>
      </div>

      <div className="rounded-2xl bg-[#f5f8ff] px-5 py-4">
        <p className="text-[14px] font-bold text-slate-900">검차 진행 안내</p>
        <ul className="mt-3 space-y-1.5 text-[12px] leading-5 text-slate-500">
          <li>- 검차는 차량 상태를 객관적으로 확인하기 위한 절차입니다.</li>
          <li>- 검차 결과는 감가 협의 및 최종 거래금액 산정의 기준으로 사용됩니다.</li>
          <li>- 검차 항목에는 차량의 내외관, 주요 기능, 주행 상태가 포함됩니다.</li>
          <li>- 검차 완료 후 이 차량은 자동으로 감가 협의 단계로 이동합니다.</li>
        </ul>
      </div>
    </div>
  );
}

interface SellerInspectionConfirmedModalContentProps {
  workflow: TradeWorkflow;
  onConfirm: () => void;
}

export function SellerInspectionConfirmedModalContent({
  workflow,
  onConfirm,
}: SellerInspectionConfirmedModalContentProps) {
  return (
    <div className="space-y-5 px-7 py-6">
      <div className="rounded-xl bg-[#edf4ff] px-4 py-3 text-[13px] font-semibold leading-5 text-[#356ae6]">
        확정된 검차 일정을 다시 확인할 수 있습니다.
        <br />
        일정과 장소, 담당자 정보를 확인한 뒤 닫아주세요.
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-5 text-sm">
        <div className="space-y-1.5">
          <p className="text-[13px] font-medium text-slate-400">확정 일정</p>
          <p className="font-semibold leading-6 text-slate-950">{formatInspectionProposalDateTime(workflow.inspection_scheduled_at)}</p>
        </div>
        <div className="space-y-1.5">
          <p className="text-[13px] font-medium text-slate-400">검차 담당자</p>
          <p className="font-semibold leading-6 text-slate-950">{workflow.inspection_assignee || "-"}</p>
        </div>
        <div className="space-y-1.5">
          <p className="text-[13px] font-medium text-slate-400">검차 장소</p>
          <p className="font-semibold leading-6 text-slate-950">{workflow.inspection_location || "-"}</p>
        </div>
        <div className="space-y-1.5">
          <p className="text-[13px] font-medium text-slate-400">담당자 연락처</p>
          <p className="font-semibold leading-6 text-slate-950">{workflow.inspection_contact || "-"}</p>
        </div>
        <div className="space-y-1.5">
          <p className="text-[13px] font-medium text-slate-400">검차 유형</p>
          <p className="font-semibold leading-6 text-slate-950">PALKA 협력 검사센터 방문</p>
        </div>
        <div className="space-y-1.5">
          <p className="text-[13px] font-medium text-slate-400">준비 서류</p>
          <p className="font-semibold leading-6 text-slate-950">자동차등록증, 신분증 사본, 차량 키</p>
        </div>
      </div>

      <div className="rounded-2xl bg-[#f5f8ff] px-5 py-4">
        <p className="text-[14px] font-bold text-slate-900">검차 진행 안내</p>
        <ul className="mt-3 space-y-1.5 text-[12px] leading-5 text-slate-500">
          <li>- 확정된 일정은 딜러와 판매자가 합의한 검차 일정입니다.</li>
          <li>- 일정 확정 이후에는 관리자 검차 완료 시점까지 검차 단계가 유지됩니다.</li>
          <li>- 검차 결과는 이후 감가 협의와 최종 거래 금액 산정의 기준이 됩니다.</li>
        </ul>
      </div>

      <Button type="button" className="h-11 w-full rounded-xl bg-[#356ae6] text-white hover:bg-[#2859cd]" onClick={onConfirm}>
        확인
      </Button>
    </div>
  );
}

interface SellerInspectionRescheduleModalContentProps {
  workflow: TradeWorkflow;
  newDate: string;
  newTime: string;
  preferredRegion: string;
  newReason: string;
  submitting?: boolean;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  onRegionChange: (value: string) => void;
  onReasonChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}

export function SellerInspectionRescheduleModalContent({
  workflow,
  newDate,
  newTime,
  preferredRegion,
  newReason,
  submitting = false,
  onDateChange,
  onTimeChange,
  onRegionChange,
  onReasonChange,
  onCancel,
  onSubmit,
}: SellerInspectionRescheduleModalContentProps) {
  return (
    <div className="space-y-6 px-6 py-7">
      <section className="rounded-2xl border border-slate-200 px-4 py-4">
        <p className="text-[16px] font-bold text-slate-950">현재 제안된 검차 일정</p>
        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
          <div className="space-y-1.5">
            <p className="text-[12px] font-medium text-slate-400">제안된 일정</p>
            <p className="font-semibold text-slate-950">{formatInspectionProposalDateTime(workflow.inspection_scheduled_at)}</p>
          </div>
          <div className="space-y-1.5">
            <p className="text-[12px] font-medium text-slate-400">검차 담당자</p>
            <p className="font-semibold text-slate-950">{workflow.inspection_assignee || "-"}</p>
          </div>
          <div className="space-y-1.5">
            <p className="text-[12px] font-medium text-slate-400">검차 장소</p>
            <p className="font-semibold text-slate-950">{workflow.inspection_location || "-"}</p>
          </div>
          <div className="space-y-1.5">
            <p className="text-[12px] font-medium text-slate-400">담당자 연락처</p>
            <p className="font-semibold text-slate-950">{workflow.inspection_contact || "-"}</p>
          </div>
        </div>
        <p className="mt-4 text-[11px] leading-5 text-slate-400">
          아래에 입력한 새로운 일정이 딜러에게 전달되며, 딜러가 승인하면 최종 검차 일정으로 확정됩니다.
        </p>
      </section>

      <section className="space-y-4">
        <p className="text-[16px] font-bold text-slate-950">새 검차 일정 요청</p>
        <div className="space-y-2">
          <Label htmlFor="inspection-request-date" className="text-[14px] font-semibold text-slate-700">희망 날짜</Label>
          <Input id="inspection-request-date" type="date" value={newDate} onChange={(event) => onDateChange(event.target.value)} className="h-12 rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="inspection-request-time" className="text-[14px] font-semibold text-slate-700">희망 시간대</Label>
          <select
            id="inspection-request-time"
            value={newTime}
            onChange={(event) => onTimeChange(event.target.value)}
            className="flex h-12 w-full rounded-xl border border-input bg-background px-4 text-sm ring-offset-background"
          >
            <option value="">시간대를 선택해주세요</option>
            <option value="09:00">오전 09:00</option>
            <option value="10:00">오전 10:00</option>
            <option value="11:00">오전 11:00</option>
            <option value="13:00">오후 01:00</option>
            <option value="14:00">오후 02:00</option>
            <option value="15:00">오후 03:00</option>
            <option value="16:00">오후 04:00</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="inspection-request-region" className="text-[14px] font-semibold text-slate-700">선호 검차 지역</Label>
          <Input
            id="inspection-request-region"
            value={preferredRegion}
            onChange={(event) => onRegionChange(event.target.value)}
            placeholder="예 : 서울 강서구 / 양천구 인근 검사센터"
            className="h-12 rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="inspection-request-note" className="text-[14px] font-semibold text-slate-700">특이사항 / 요청사항</Label>
          <Textarea
            id="inspection-request-note"
            value={newReason}
            onChange={(event) => onReasonChange(event.target.value)}
            placeholder="예 : 주중에는 오후 6시 이후에만 가능, 주차 공간 협소, 아이 동반 예정 등"
            rows={5}
            className="rounded-xl"
          />
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 pt-1">
        <Button type="button" variant="secondary" className="h-11 rounded-xl bg-slate-200 text-slate-500 hover:bg-slate-200" onClick={onCancel}>
          취소
        </Button>
        <Button type="button" className="h-11 rounded-xl bg-[#356ae6] text-white hover:bg-[#2859cd]" disabled={submitting} onClick={onSubmit}>
          요청 보내기
        </Button>
      </div>
    </div>
  );
}

interface SellerInspectionRescheduleSubmittedModalContentProps {
  onConfirm: () => void;
}

export function SellerInspectionRescheduleSubmittedModalContent({
  onConfirm,
}: SellerInspectionRescheduleSubmittedModalContentProps) {
  return (
    <div className="space-y-6 px-6 py-7">
      <div className="rounded-2xl bg-[#edf4ff] px-5 py-5">
        <p className="text-[17px] font-bold text-slate-950">새로운 검차 일정을 요청했습니다.</p>
        <div className="mt-3 space-y-1.5 text-[13px] leading-6 text-slate-500">
          <p>평가사 일정을 확인한 뒤 승인하거나</p>
          <p>새로운 일정을 다시 제안할 수 있습니다.</p>
          <p>확정된 일정은 알림으로 안내해 드릴게요.</p>
        </div>
      </div>

      <Button type="button" className="h-11 w-full rounded-xl bg-[#356ae6] text-white hover:bg-[#2859cd]" onClick={onConfirm}>
        확인
      </Button>
    </div>
  );
}
