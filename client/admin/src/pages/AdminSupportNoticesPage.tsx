import { FormEvent, useEffect, useMemo, useState } from "react";

import { useAuth } from "../app/AuthContext";
import { PageIntro } from "../components/common/PageIntro";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { listSupportNotices } from "../lib/api";
import type { NoticeCategory, SupportNotice } from "../lib/types";
import {
  createAdminSupportNotice,
  deleteAdminSupportNotice,
  noticeCategoryLabels,
  noticeCategoryOptions,
  updateAdminSupportNotice,
} from "./AdminSupportShared";

const categoryOptions: NoticeCategory[] = ["GENERAL", "SERVICE", "POLICY", "EVENT"];

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("ko-KR").replace(/\. /g, ".").replace(/\.$/, "");
}

export function AdminSupportNoticesPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<SupportNotice[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [category, setCategory] = useState<NoticeCategory>("GENERAL");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState<NoticeCategory>("GENERAL");
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editPinned, setEditPinned] = useState(false);

  const load = async (preferredId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await listSupportNotices({ limit: 100 });
      setRows(data);
      setSelectedId((current) => preferredId ?? current ?? data[0]?.id ?? null);
    } catch (err) {
      setRows([]);
      setError(err instanceof Error ? err.message : "공지사항 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const visibleRows = useMemo(() => {
    const needle = keyword.trim().toLowerCase();
    return rows.filter((row) => (!needle ? true : [row.title, row.content, row.category].join(" ").toLowerCase().includes(needle)));
  }, [keyword, rows]);

  const selectedNotice = useMemo(
    () => visibleRows.find((row) => row.id === selectedId) ?? visibleRows[0] ?? null,
    [selectedId, visibleRows],
  );

  useEffect(() => {
    if (!selectedNotice) {
      setEditCategory("GENERAL");
      setEditTitle("");
      setEditContent("");
      setEditPinned(false);
      return;
    }
    setEditCategory(selectedNotice.category);
    setEditTitle(selectedNotice.title);
    setEditContent(selectedNotice.content);
    setEditPinned(selectedNotice.is_pinned);
  }, [selectedNotice]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const created = await createAdminSupportNotice(token, { category, title, content, is_pinned: isPinned });
      setTitle("");
      setContent("");
      setIsPinned(false);
      setSuccess("공지사항이 등록되었습니다.");
      await load(created.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "공지사항 등록 실패");
    } finally {
      setSubmitting(false);
    }
  };

  const updateSelected = async () => {
    if (!token || !selectedNotice) {
      setError("선택된 공지사항이 없습니다.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await updateAdminSupportNotice(token, selectedNotice.id, {
        category: editCategory,
        title: editTitle.trim(),
        content: editContent.trim(),
        is_pinned: editPinned,
      });
      setSuccess("공지사항이 수정되었습니다.");
      await load(updated.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "공지사항 수정 실패");
    } finally {
      setSubmitting(false);
    }
  };

  const removeSelected = async () => {
    if (!token || !selectedNotice) {
      setError("선택된 공지사항이 없습니다.");
      return;
    }
    if (!window.confirm("선택한 공지사항을 삭제하시겠습니까?")) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await deleteAdminSupportNotice(token, selectedNotice.id);
      setSuccess("공지사항이 삭제되었습니다.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "공지사항 삭제 실패");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-4">
      <PageIntro
        title="공지사항 관리"
        description="ADM_050 공지사항을 실제 백엔드 API 데이터로 조회하고 등록합니다."
        actions={
          <Button type="button" variant="outline" onClick={() => void load(selectedId ?? undefined)}>
            새로고침
          </Button>
        }
      />

      {error && (
        <Alert variant="destructive">
          <AlertTitle>처리 실패</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertTitle>등록 완료</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="pt-6">
          <Input placeholder="제목/본문 검색" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">공지 목록</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading && <p className="text-sm text-muted-foreground">공지사항을 불러오는 중...</p>}
            {visibleRows.map((row) => (
              <button
                key={row.id}
                type="button"
                className={`w-full rounded-lg border p-3 text-left ${selectedNotice?.id === row.id ? "border-slate-900" : "border-border"}`}
                onClick={() => setSelectedId(row.id)}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{row.title}</p>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{noticeCategoryLabels[row.category]}</Badge>
                    {row.is_pinned && <Badge>고정</Badge>}
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{row.content}</p>
                <p className="mt-2 text-xs text-muted-foreground">게시 {formatDate(row.published_at)}</p>
              </button>
            ))}
            {!loading && visibleRows.length === 0 && <p className="text-sm text-muted-foreground">표시할 공지사항이 없습니다.</p>}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">선택 공지 운영</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedNotice ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{noticeCategoryLabels[selectedNotice.category]}</Badge>
                    {selectedNotice.is_pinned && <Badge>고정</Badge>}
                  </div>
                  <div>
                    <Label htmlFor="notice-edit-category">카테고리</Label>
                    <select
                      id="notice-edit-category"
                      className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={editCategory}
                      onChange={(event) => setEditCategory(event.target.value as NoticeCategory)}
                    >
                      {noticeCategoryOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="notice-edit-title">제목</Label>
                    <Input id="notice-edit-title" className="mt-2" value={editTitle} onChange={(event) => setEditTitle(event.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="notice-edit-content">내용</Label>
                    <Textarea
                      id="notice-edit-content"
                      className="mt-2 min-h-[220px]"
                      value={editContent}
                      onChange={(event) => setEditContent(event.target.value)}
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={editPinned} onChange={(event) => setEditPinned(event.target.checked)} />
                    상단 고정 공지 유지
                  </label>
                  <p className="text-xs text-muted-foreground">
                    게시 {formatDate(selectedNotice.published_at)} · 수정 {formatDate(selectedNotice.updated_at)}
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditCategory(selectedNotice.category);
                        setEditTitle(selectedNotice.title);
                        setEditContent(selectedNotice.content);
                        setEditPinned(selectedNotice.is_pinned);
                      }}
                    >
                      변경 취소
                    </Button>
                    <Button type="button" variant="outline" disabled={submitting} onClick={() => void removeSelected()}>
                      삭제
                    </Button>
                    <Button type="button" disabled={submitting} onClick={() => void updateSelected()}>
                      {submitting ? "저장 중..." : "수정 저장"}
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">선택된 공지사항이 없습니다.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">공지 등록</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={(event) => void submit(event)}>
                <div>
                  <p className="mb-2 text-sm font-medium">카테고리</p>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={category}
                    onChange={(event) => setCategory(event.target.value as NoticeCategory)}
                  >
                    {categoryOptions.map((option) => (
                      <option key={option} value={option}>
                        {noticeCategoryLabels[option]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium">제목</p>
                  <Input placeholder="공지 제목을 입력하세요" value={title} onChange={(event) => setTitle(event.target.value)} />
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium">내용</p>
                  <Textarea className="min-h-[220px]" placeholder="공지 내용을 입력하세요" value={content} onChange={(event) => setContent(event.target.value)} />
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={isPinned} onChange={(event) => setIsPinned(event.target.checked)} />
                  상단 고정 공지로 등록
                </label>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => { setTitle(""); setContent(""); setIsPinned(false); }}>
                    입력 초기화
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "저장 중..." : "공지 저장"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
