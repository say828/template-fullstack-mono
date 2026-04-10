import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../app/AuthContext";
import { PageIntro } from "../components/common/PageIntro";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { listAdminSupportFaqs } from "../lib/api";
import type { FaqCategory, SupportFaq } from "../lib/types";
import {
  createAdminSupportFaq,
  deleteAdminSupportFaq,
  faqCategoryLabels,
  faqCategoryOptions,
  formatSupportDate,
  updateAdminSupportFaq,
} from "./AdminSupportShared";

type FaqFilter = "ALL" | FaqCategory;

function emptyForm() {
  return {
    category: "GENERAL" as FaqCategory,
    question: "",
    answer: "",
    sort_order: 100,
    is_active: true,
  };
}

export function AdminSupportFaqsPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<SupportFaq[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState<FaqFilter>("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);

  const load = async (preferredId?: string) => {
    setLoading(true);
    setError(null);
    try {
      if (!token) {
        setRows([]);
        setSelectedId(null);
        return;
      }
      const data = await listAdminSupportFaqs(token, { limit: 100 });
      setRows(data);
      setSelectedId((current) => preferredId ?? current ?? data[0]?.id ?? null);
    } catch (err) {
      setRows([]);
      setError(err instanceof Error ? err.message : "FAQ 운영 목록 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [token]);

  const filteredRows = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return rows
      .filter((row) => (category === "ALL" ? true : row.category === category))
      .filter((row) => (!normalizedKeyword ? true : `${row.question} ${row.answer}`.toLowerCase().includes(normalizedKeyword)))
      .sort((left, right) => left.sort_order - right.sort_order);
  }, [category, keyword, rows]);

  const selectedFaq = useMemo(
    () => filteredRows.find((row) => row.id === selectedId) ?? filteredRows[0] ?? null,
    [filteredRows, selectedId],
  );

  useEffect(() => {
    if (!selectedFaq) {
      setEditForm(emptyForm());
      return;
    }
    setEditForm({
      category: selectedFaq.category,
      question: selectedFaq.question,
      answer: selectedFaq.answer,
      sort_order: selectedFaq.sort_order,
      is_active: selectedFaq.is_active,
    });
  }, [selectedFaq]);

  const submit = async () => {
    if (!token) {
      setError("관리자 인증 후 FAQ를 등록할 수 있습니다.");
      return;
    }
    if (form.question.trim().length < 2 || form.answer.trim().length < 2) {
      setError("질문과 답변을 모두 입력해 주세요.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const created = await createAdminSupportFaq(token, {
        category: form.category,
        question: form.question.trim(),
        answer: form.answer.trim(),
        sort_order: Math.max(1, Math.min(9999, Number(form.sort_order) || 100)),
        is_active: form.is_active,
      });
      setForm(emptyForm());
      setSuccessMessage("FAQ가 등록되었습니다.");
      await load(created.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "FAQ 등록 실패");
    } finally {
      setSaving(false);
    }
  };

  const updateSelected = async () => {
    if (!token || !selectedFaq) {
      setError("선택된 FAQ가 없습니다.");
      return;
    }
    if (editForm.question.trim().length < 2 || editForm.answer.trim().length < 2) {
      setError("질문과 답변을 모두 입력해 주세요.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const updated = await updateAdminSupportFaq(token, selectedFaq.id, {
        category: editForm.category,
        question: editForm.question.trim(),
        answer: editForm.answer.trim(),
        sort_order: Math.max(1, Math.min(9999, Number(editForm.sort_order) || 100)),
        is_active: editForm.is_active,
      });
      setSuccessMessage("FAQ가 수정되었습니다.");
      await load(updated.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "FAQ 수정 실패");
    } finally {
      setSaving(false);
    }
  };

  const removeSelected = async () => {
    if (!token || !selectedFaq) {
      setError("선택된 FAQ가 없습니다.");
      return;
    }
    if (!window.confirm("선택한 FAQ를 삭제하시겠습니까?")) return;
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await deleteAdminSupportFaq(token, selectedFaq.id);
      setSuccessMessage("FAQ가 삭제되었습니다.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "FAQ 삭제 실패");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-4">
      <PageIntro
        title="FAQ 관리"
        description="실제 백엔드 API 데이터로 FAQ를 조회하고 등록합니다."
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
      {successMessage && (
        <Alert>
          <AlertTitle>등록 완료</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-[1.2fr_220px_auto]">
          <Input placeholder="질문/답변 검색" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={category}
            onChange={(event) => setCategory(event.target.value as FaqFilter)}
          >
            <option value="ALL">전체 카테고리</option>
            {faqCategoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="flex items-center text-sm text-muted-foreground">{filteredRows.length}건</div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">FAQ 목록</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading && <p className="text-sm text-muted-foreground">FAQ를 불러오는 중...</p>}
            {filteredRows.map((row) => (
              <button
                key={row.id}
                type="button"
                className={`w-full rounded-lg border p-3 text-left ${selectedFaq?.id === row.id ? "border-slate-900" : "border-border"}`}
                onClick={() => setSelectedId(row.id)}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{row.question}</p>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{faqCategoryLabels[row.category]}</Badge>
                    <Badge variant="outline">정렬 {row.sort_order}</Badge>
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{row.answer}</p>
                <p className="mt-2 text-xs text-muted-foreground">수정 {formatSupportDate(row.updated_at)}</p>
              </button>
            ))}
            {!loading && filteredRows.length === 0 && <p className="text-sm text-muted-foreground">조건에 맞는 FAQ가 없습니다.</p>}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">선택 FAQ 운영</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedFaq ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{faqCategoryLabels[selectedFaq.category]}</Badge>
                    <Badge variant="outline">정렬 {selectedFaq.sort_order}</Badge>
                    {!selectedFaq.is_active && <Badge variant="outline">비활성</Badge>}
                  </div>
                  <div className="grid gap-4 md:grid-cols-[1fr_160px]">
                    <div>
                      <Label htmlFor="faq-edit-category">분류</Label>
                      <select
                        id="faq-edit-category"
                        className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        value={editForm.category}
                        onChange={(event) => setEditForm((current) => ({ ...current, category: event.target.value as FaqCategory }))}
                      >
                        {faqCategoryOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="faq-edit-sort-order">정렬 순서</Label>
                      <Input
                        id="faq-edit-sort-order"
                        className="mt-2"
                        value={String(editForm.sort_order)}
                        onChange={(event) => setEditForm((current) => ({ ...current, sort_order: Number(event.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="faq-edit-question">질문</Label>
                    <Input
                      id="faq-edit-question"
                      className="mt-2"
                      value={editForm.question}
                      onChange={(event) => setEditForm((current) => ({ ...current, question: event.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="faq-edit-answer">답변</Label>
                    <Textarea
                      id="faq-edit-answer"
                      className="mt-2 min-h-[220px]"
                      value={editForm.answer}
                      onChange={(event) => setEditForm((current) => ({ ...current, answer: event.target.value }))}
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={editForm.is_active}
                      onChange={(event) => setEditForm((current) => ({ ...current, is_active: event.target.checked }))}
                    />
                    활성 FAQ 유지
                  </label>
                  <p className="text-xs text-muted-foreground">등록 {formatSupportDate(selectedFaq.created_at)} · 수정 {formatSupportDate(selectedFaq.updated_at)}</p>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setEditForm({
                      category: selectedFaq.category,
                      question: selectedFaq.question,
                      answer: selectedFaq.answer,
                      sort_order: selectedFaq.sort_order,
                      is_active: selectedFaq.is_active,
                    })}>
                      변경 취소
                    </Button>
                    <Button type="button" variant="outline" disabled={saving} onClick={() => void removeSelected()}>
                      삭제
                    </Button>
                    <Button type="button" disabled={saving} onClick={() => void updateSelected()}>
                      {saving ? "저장 중..." : "수정 저장"}
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">선택된 FAQ가 없습니다.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">FAQ 등록</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-[1fr_160px]">
                <div>
                  <Label htmlFor="faq-category">분류</Label>
                  <select
                    id="faq-category"
                    className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={form.category}
                    onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as FaqCategory }))}
                  >
                    {faqCategoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="faq-sort-order">정렬 순서</Label>
                  <Input
                    id="faq-sort-order"
                    className="mt-2"
                    value={String(form.sort_order)}
                    onChange={(event) => setForm((current) => ({ ...current, sort_order: Number(event.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="faq-question">질문</Label>
                <Input
                  id="faq-question"
                  className="mt-2"
                  placeholder="운영 FAQ 질문을 입력하세요"
                  value={form.question}
                  onChange={(event) => setForm((current) => ({ ...current, question: event.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="faq-answer">답변</Label>
                <Textarea
                  id="faq-answer"
                  className="mt-2 min-h-[220px]"
                  placeholder="고객에게 노출할 답변을 입력하세요"
                  value={form.answer}
                  onChange={(event) => setForm((current) => ({ ...current, answer: event.target.value }))}
                />
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
                />
                활성 FAQ로 등록
              </label>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setForm(emptyForm())}>
                  입력 초기화
                </Button>
                <Button type="button" disabled={saving} onClick={() => void submit()}>
                  {saving ? "등록 중..." : "FAQ 등록"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
