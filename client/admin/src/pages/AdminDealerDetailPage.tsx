import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PageIntro } from "../components/common/PageIntro";

import { useAuth } from "../app/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import { approveDealer, getAdminDealerBids, getAdminDealerDetail, rejectDealer } from "../lib/api";
import type { AdminDealerBidHistory, AdminDealerDetail } from "../lib/types";

interface AdminDealerDetailPageProps {
  tab: "basic" | "history";
}

function dealerStatusBadge(status: AdminDealerDetail["dealer_status"]) {
  if (status === "APPROVED") return <Badge variant="secondary">승인</Badge>;
  if (status === "REJECTED") return <Badge variant="destructive">반려</Badge>;
  return <Badge>승인대기</Badge>;
}

function docTypeLabel(docType: string) {
  if (docType === "BUSINESS_LICENSE") return "사업자등록증";
  if (docType === "DEALER_LICENSE") return "매매사원증";
  return "신분증";
}

export function AdminDealerDetailPage({ tab }: AdminDealerDetailPageProps) {
  const { token } = useAuth();
  const { dealerId } = useParams<{ dealerId: string }>();
  const [detail, setDetail] = useState<AdminDealerDetail | null>(null);
  const [historyRows, setHistoryRows] = useState<AdminDealerBidHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("운영 검토 반려");

  const load = async () => {
    if (!token || !dealerId) return;
    setLoading(true);
    setError(null);
    try {
      const [detailData, historyData] = await Promise.all([
        getAdminDealerDetail(token, dealerId),
        tab === "history" ? getAdminDealerBids(token, dealerId) : Promise.resolve([]),
      ]);
      setDetail(detailData);
      setHistoryRows(historyData);
    } catch (err) {
      setDetail(null);
      setHistoryRows([]);
      setError(err instanceof Error ? err.message : "딜러 상세 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [dealerId, tab, token]);

  const onApprove = async () => {
    if (!token || !dealerId) return;
    setActionLoading(true);
    setError(null);
    try {
      await approveDealer(token, dealerId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "승인 처리 실패");
    } finally {
      setActionLoading(false);
    }
  };

  const onReject = async () => {
    if (!token || !dealerId) return;
    setActionLoading(true);
    setError(null);
    try {
      await rejectDealer(token, dealerId, rejectReason.trim() || "운영 검토 반려");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "반려 처리 실패");
    } finally {
      setActionLoading(false);
    }
  };

  if (!loading && !detail) {
    return (
      <section className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>조회 실패</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Card>
          <CardContent className="pt-6 text-sm">딜러 상세 정보를 찾을 수 없습니다.</CardContent>
        </Card>
      </section>
    );
  }

  const wonCount = historyRows.filter((row) => row.status === "WON").length;
  const isPending = detail?.dealer_status === "PENDING";

  return (
    <section className="space-y-4">
      {/* ADM_043 딜러상세(승인대기): 승인/반려 중심의 운영 상세 화면 */}
      {detail && isPending && (
        <PageIntro
          title="딜러상세(승인대기)"
          description="ADM_043 딜러 가입 자료를 검토하고 승인/반려를 처리합니다."
          actions={
            <>
              <Button asChild variant="outline" size="sm">
                <Link to="/admin/dealers">목록</Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!!actionLoading}
                onClick={() => window.alert("임시 저장: 운영 메모/반려 사유는 승인/반려 시 반영됩니다.")}
              >
                저장
              </Button>
              <Button type="button" variant="outline" size="sm" disabled onClick={() => window.alert("삭제는 백엔드 지원 대기입니다.")}>삭제</Button>
            </>
          }
        />
      )}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>처리 실패</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && <p className="text-sm text-muted-foreground">딜러 상세를 불러오는 중...</p>}

      {detail && (
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle>{detail.full_name}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">{detail.email}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {dealerStatusBadge(detail.dealer_status)}
                  <Badge variant="outline">{tab === "history" ? "이력 보기" : "기본 상세"}</Badge>
                </div>
              </div>
            </CardHeader>
            {/* ADM_046 딜러 활동 요약: 기본/서류/낙찰 등 요약 지표 */}
            <CardContent className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">사업자 번호</p>
                <p className="mt-1 text-lg font-semibold">{detail.business_number || "-"}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">국가</p>
                <p className="mt-1 text-lg font-semibold">{detail.country || "-"}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">서류 수</p>
                <p className="mt-1 text-lg font-semibold">{detail.documents.length}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">낙찰 건수</p>
                <p className="mt-1 text-lg font-semibold">{wonCount}</p>
              </div>
            </CardContent>
          </Card>

          {tab === "basic" ? (
            <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">기본 및 서류 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p>딜러 ID: {detail.id}</p>
                  <p>연락처: {detail.phone || "-"}</p>
                  <p>계정 상태: {detail.account_status}</p>
                  <p>반려 사유: {detail.dealer_rejection_reason || "-"}</p>
                  <div className="space-y-2">
                    {detail.documents.map((doc) => (
                      <div key={doc.id} className="rounded-lg border p-3">
                        <p className="font-medium">{doc.original_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {docTypeLabel(doc.doc_type)} · {(doc.size_bytes / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    ))}
                    {detail.documents.length === 0 && <p className="text-sm text-muted-foreground">제출된 서류가 없습니다.</p>}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">운영 액션</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} placeholder="반려 사유를 입력하세요." />
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" className="flex-1" disabled={actionLoading || detail.dealer_status !== "PENDING"} onClick={() => void onReject()}>
                      {actionLoading ? "처리 중..." : "반려"}
                    </Button>
                    <Button type="button" className="flex-1" disabled={actionLoading || detail.dealer_status !== "PENDING"} onClick={() => void onApprove()}>
                      {actionLoading ? "처리 중..." : "승인"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardHeader>
                {/* ADM_045 딜러 이력(입찰 참여 이력): history 탭 */}
                <CardTitle className="text-base">입찰 참여 이력</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {historyRows.map((row) => (
                  <div key={row.bid_id} className="rounded-lg border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">{row.vehicle_title}</p>
                        <p className="text-sm text-muted-foreground">{Math.round(row.amount).toLocaleString()}원</p>
                      </div>
                      <Badge variant={row.status === "WON" ? "secondary" : row.status === "LOST" ? "destructive" : "outline"}>{row.status}</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>마감 {new Date(row.bidding_ends_at).toLocaleString()}</span>
                      <Link className="text-[#2459cd]" to={`/admin/trades/${row.vehicle_id}`}>
                        거래 상세
                      </Link>
                    </div>
                  </div>
                ))}
                {historyRows.length === 0 && <p className="text-sm text-muted-foreground">입찰 이력이 없습니다.</p>}
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2">
            <Button asChild variant={tab === "basic" ? "default" : "outline"} size="sm">
              <Link to={`/admin/dealers/${detail.id}`}>기본 상세</Link>
            </Button>
            <Button asChild variant={tab === "history" ? "default" : "outline"} size="sm">
              <Link to={`/admin/dealers/${detail.id}/history`}>이력 보기</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/dealers">목록</Link>
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
