import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../app/AuthContext";
import { PageIntro } from "../components/common/PageIntro";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { listAdminSupportInquiries } from "../lib/api";
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

export function AdminSupportInquiriesPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<AdminSupportInquiry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InquiryStatus | "ALL">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<InquiryCategory | "ALL">("ALL");

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listAdminSupportInquiries(token, { limit: 100 });
      setRows(data);
    } catch (err) {
      setRows([]);
      setError(err instanceof Error ? err.message : "문의 목록 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [token]);

  const filteredRows = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter !== "ALL" && row.status !== statusFilter) return false;
      if (categoryFilter !== "ALL" && row.category !== categoryFilter) return false;
      if (!normalized) return true;
      const haystack = [
        row.title,
        row.content,
        row.user_email,
        row.user_full_name,
        row.user_role,
        row.admin_reply,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [categoryFilter, rows, search, statusFilter]);

  const summary = useMemo(
    () => ({
      total: rows.length,
      open: rows.filter((row) => row.status === "OPEN").length,
      answered: rows.filter((row) => row.status === "ANSWERED").length,
      closed: rows.filter((row) => row.status === "CLOSED").length,
    }),
    [rows],
  );

  return (
    <section className="space-y-4">
      <PageIntro
        title="문의 관리"
        description="ADM_056 운영자 문의 목록을 상태/카테고리별로 확인하고 상세 응대로 연결합니다."
        actions={
          <Button type="button" variant="outline" onClick={() => void load()}>
            새로고침
          </Button>
        }
      />

      {error && (
        <Alert variant="destructive">
          <AlertTitle>조회 실패</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">전체 문의</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black">{summary.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">접수 대기</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black">{summary.open}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">답변 완료</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black">{summary.answered}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">종결</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black">{summary.closed}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-[1.2fr_180px_180px_auto]">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="제목, 내용, 작성자, 이메일 검색"
          />
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as InquiryStatus | "ALL")}
          >
            <option value="ALL">전체 상태</option>
            <option value="OPEN">접수</option>
            <option value="ANSWERED">답변 완료</option>
            <option value="CLOSED">종결</option>
          </select>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value as InquiryCategory | "ALL")}
          >
            <option value="ALL">전체 카테고리</option>
            {Object.entries(categoryLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <div className="flex items-center text-sm text-muted-foreground">
            {filteredRows.length}건 표시
          </div>
        </CardContent>
      </Card>

      {loading && <p className="text-sm text-muted-foreground">문의 목록을 불러오는 중...</p>}

      <div className="space-y-3">
        {filteredRows.map((row) => (
          <Card key={row.id}>
            <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={statusBadgeVariant(row.status)}>{statusLabels[row.status]}</Badge>
                  <Badge variant="secondary">{categoryLabels[row.category]}</Badge>
                  <span className="text-xs text-muted-foreground">{formatSupportDate(row.created_at)}</span>
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-semibold">{row.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {row.user_full_name || "작성자 미상"} · {row.user_email || "-"} · {row.user_role || "-"}
                  </p>
                </div>
                <p className="line-clamp-2 max-w-3xl text-sm text-slate-700">{row.content}</p>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>첨부 {row.attachments.length}건</span>
                  <span>업데이트 {formatSupportDate(row.updated_at)}</span>
                </div>
                {row.admin_reply ? (
                  <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                    최근 답변: {row.admin_reply}
                  </div>
                ) : (
                  <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    아직 등록된 답변이 없습니다.
                  </div>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button asChild variant="outline">
                  <Link to={`/admin/support/inquiries/${row.id}`}>상세 보기</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {!loading && filteredRows.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              조건에 맞는 문의가 없습니다.
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
