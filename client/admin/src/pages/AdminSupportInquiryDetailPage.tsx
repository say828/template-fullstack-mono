import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useAuth } from "../app/AuthContext";
import { PageIntro } from "../components/common/PageIntro";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { downloadAdminSupportInquiryAttachment, getAdminSupportInquiry, replyAdminSupportInquiry } from "../lib/api";
import type { AdminSupportInquiry, InquiryCategory, InquiryStatus } from "../lib/types";
import { formatSupportDate } from "./AdminSupportShared";

const categoryLabels: Record<InquiryCategory, string> = {
  GENERAL: "일반 문의",
  ACCOUNT: "계정 / 인증",
  BIDDING: "입찰 / 낙찰",
  SETTLEMENT: "인도 / 정산",
  INSPECTION: "검차 / 감가 협의",
  DELIVER: "기타",
};

const statusLabels: Record<InquiryStatus, string> = {
  OPEN: "접수",
  ANSWERED: "답변 완료",
  CLOSED: "종결",
};

function statusBadgeVariant(status: InquiryStatus): "default" | "secondary" | "outline" {
  if (status === "ANSWERED") return "default";
  if (status === "CLOSED") return "secondary";
  return "outline";
}

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "-";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function AdminSupportInquiryDetailPage() {
  const { inquiryId } = useParams<{ inquiryId: string }>();
  const { token } = useAuth();
  const [row, setRow] = useState<AdminSupportInquiry | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [doneMessage, setDoneMessage] = useState<string | null>(null);

  const load = async () => {
    if (!token || !inquiryId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminSupportInquiry(token, inquiryId);
      setRow(data);
      setReplyDraft(data.admin_reply ?? "");
    } catch (err) {
      setRow(null);
      setError(err instanceof Error ? err.message : "문의 상세 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [token, inquiryId]);

  const attachmentSummary = useMemo(
    () => row?.attachments.reduce((sum, item) => sum + item.size_bytes, 0) ?? 0,
    [row],
  );

  const submitReply = async () => {
    if (!token || !inquiryId) return;
    const trimmed = replyDraft.trim();
    if (trimmed.length < 5) {
      setError("답변은 5자 이상 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setDoneMessage(null);
    try {
      const updated = await replyAdminSupportInquiry(token, inquiryId, trimmed);
      setRow(updated);
      setReplyDraft(updated.admin_reply ?? trimmed);
      setDoneMessage(updated.admin_reply ? "답변이 저장되었습니다." : "답변 등록이 완료되었습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "답변 저장 실패");
    } finally {
      setSubmitting(false);
    }
  };

  const downloadAttachment = async (attachmentId: string, filename: string) => {
    if (!token || !inquiryId) return;
    setDownloadingId(attachmentId);
    setError(null);
    try {
      await downloadAdminSupportInquiryAttachment(token, inquiryId, attachmentId, filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : "첨부 파일 다운로드 실패");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <section className="space-y-4">
      <PageIntro
        title="문의 상세"
        description="ADM_057 문의 본문, 첨부 자료, 운영자 답변을 한 화면에서 처리합니다."
        actions={
          <Button asChild variant="outline">
            <Link to="/admin/support/inquiries">목록으로</Link>
          </Button>
        }
      />

      {error && (
        <Alert variant="destructive">
          <AlertTitle>처리 실패</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {doneMessage && (
        <Alert>
          <AlertTitle>저장 완료</AlertTitle>
          <AlertDescription>{doneMessage}</AlertDescription>
        </Alert>
      )}

      {!inquiryId && (
        <Alert variant="destructive">
          <AlertTitle>잘못된 접근</AlertTitle>
          <AlertDescription>문의 ID가 없어 상세 화면을 열 수 없습니다.</AlertDescription>
        </Alert>
      )}

      {loading && <p className="text-sm text-muted-foreground">문의 상세를 불러오는 중...</p>}

      {row && (
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <Card>
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={statusBadgeVariant(row.status)}>{statusLabels[row.status]}</Badge>
                  <Badge variant="secondary">{categoryLabels[row.category]}</Badge>
                  <span className="text-xs text-muted-foreground">문의 ID {row.id}</span>
                </div>
                <div>
                  <CardTitle className="text-xl">{row.title}</CardTitle>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {row.user_full_name || "작성자 미상"} · {row.user_email || "-"} · {row.user_role || "-"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    접수 {formatSupportDate(row.created_at)} · 최종 수정 {formatSupportDate(row.updated_at)}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border bg-slate-50 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-800">{row.content}</p>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-lg border px-3 py-3">
                    <p className="text-xs text-muted-foreground">첨부 파일</p>
                    <p className="mt-1 text-lg font-semibold">{row.attachments.length}건</p>
                  </div>
                  <div className="rounded-lg border px-3 py-3">
                    <p className="text-xs text-muted-foreground">총 용량</p>
                    <p className="mt-1 text-lg font-semibold">{formatBytes(attachmentSummary)}</p>
                  </div>
                  <div className="rounded-lg border px-3 py-3">
                    <p className="text-xs text-muted-foreground">정책 동의</p>
                    <p className="mt-1 text-lg font-semibold">{row.agreed_to_policy ? "동의" : "미동의"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">첨부 자료</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {row.attachments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">첨부된 파일이 없습니다.</p>
                ) : (
                  row.attachments.map((item) => (
                    <div key={item.id} className="rounded-lg border px-3 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">{item.original_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.content_type || "content-type 미확인"} · {formatBytes(item.size_bytes)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={downloadingId === item.id}
                          onClick={() => void downloadAttachment(item.id, item.original_name)}
                        >
                          {downloadingId === item.id ? "다운로드 중..." : "다운로드"}
                        </Button>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">업로드 시각 {formatSupportDate(item.created_at)}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">운영자 답변</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-reply">답변 내용</Label>
                  <Textarea
                    id="admin-reply"
                    className="min-h-[240px]"
                    value={replyDraft}
                    onChange={(event) => setReplyDraft(event.target.value)}
                    placeholder="문의 처리 결과, 추가 요청 사항, 후속 안내를 입력해 주세요."
                  />
                </div>
                <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span>{replyDraft.trim().length}자</span>
                  <span>{row.admin_reply ? "기존 답변 수정 모드" : "신규 답변 등록 모드"}</span>
                </div>
                <Button type="button" className="w-full" onClick={() => void submitReply()} disabled={submitting}>
                  {submitting ? "답변 저장 중..." : row.admin_reply ? "답변 수정 저장" : "답변 등록"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">현재 응답 상태</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <span>문의 상태</span>
                  <Badge variant={statusBadgeVariant(row.status)}>{statusLabels[row.status]}</Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <span>카테고리</span>
                  <span>{categoryLabels[row.category]}</span>
                </div>
                <div className="rounded-lg border px-3 py-3">
                  <p className="text-xs text-muted-foreground">등록된 답변</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">
                    {row.admin_reply || "아직 등록된 답변이 없습니다."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </section>
  );
}
