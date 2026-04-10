import { FormEvent, useEffect, useRef, useState } from "react";
import { ChevronDown, Paperclip, X } from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "../../app/AuthContext";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { createSupportInquiry, listMySupportInquiries } from "../../lib/api";
import type { InquiryCategory, SupportInquiry } from "../../lib/types";
import { DealerSupportNav } from "./DealerSupportNav";

const categoryOptions: Array<{ value: InquiryCategory; label: string }> = [
  { value: "GENERAL", label: "일반" },
  { value: "ACCOUNT", label: "계정" },
  { value: "BIDDING", label: "입찰" },
  { value: "INSPECTION", label: "검차/감가" },
  { value: "DELIVER", label: "인도" },
  { value: "SETTLEMENT", label: "송금/정산" },
];

export function DealerInquiryPage() {
  const { token, user } = useAuth();
  const [rows, setRows] = useState<SupportInquiry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [category, setCategory] = useState<InquiryCategory>("GENERAL");
  const [files, setFiles] = useState<File[]>([]);
  const hiddenFileInput = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listMySupportInquiries(token, { limit: 100 });
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "문의 내역 조회 실패");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [token]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    const formElement = formRef.current ?? event.currentTarget;
    const form = new FormData(formElement);
    form.set("agreed_to_policy", String(agreed));

    setSubmitting(true);
    setError(null);
    try {
      files.forEach((file) => form.append("attachments", file));
      await createSupportInquiry(token, form);
      formRef.current?.reset();
      setAgreed(false);
      setCategory("GENERAL");
      setFiles([]);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "문의 등록 실패");
    } finally {
      setSubmitting(false);
    }
  };

  const onPickFiles = () => {
    hiddenFileInput.current?.click();
  };

  const onFilesChange = (selected: FileList | null) => {
    if (!selected) return;
    setFiles((prev) => [...prev, ...Array.from(selected)].slice(0, 3));
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  return (
    <section className="mx-auto max-w-5xl">
      <div className="grid gap-4 md:grid-cols-[146px_1fr]">
        <DealerSupportNav active="inquiries" />

        <Card className="border-slate-200 shadow-none">
          <CardContent className="space-y-4 p-5">
            <div className="text-center">
              <h1 className="text-4xl font-extrabold text-slate-900">1:1 문의</h1>
              <p className="mt-2 text-sm text-slate-500">궁금한 점이나 불편한 점이 있으신가요?</p>
              <p className="text-sm text-slate-500">아래 내용을 작성해주시면, 입력하신 이메일로 답변 드릴게요!</p>
            </div>

            <form className="mx-auto max-w-[430px] space-y-3" onSubmit={submit} ref={formRef}>
              <div className="space-y-1">
                <label className="text-xs text-slate-500">이메일</label>
                <Input disabled value={user?.email || ""} />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500">문의 유형 선택</label>
                <div className="relative">
                  <select
                    id="dealer-inquiry-category"
                    name="category"
                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                    onChange={(event) => setCategory(event.target.value as InquiryCategory)}
                    value={category}
                  >
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500" htmlFor="dealer-inquiry-title">문의 제목</label>
                <Input id="dealer-inquiry-title" name="title" placeholder="제목을 입력해주세요" required minLength={2} />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500" htmlFor="dealer-inquiry-content">문의 내용</label>
                <textarea
                  id="dealer-inquiry-content"
                  name="content"
                  rows={7}
                  required
                  minLength={5}
                  className="min-h-[220px] w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2f6ff5]"
                  placeholder="궁금한 점이나 문제 상황을 구체적으로 작성해 주세요."
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500">파일 첨부 (선택)</label>
                <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2">
                  <p className="flex-1 truncate text-sm text-slate-400">파일을 선택해주세요</p>
                  <button className="rounded bg-[#2f6ff5] px-4 py-1 text-xs font-semibold text-white" onClick={onPickFiles} type="button">
                    업로드
                  </button>
                </div>
                <input className="hidden" multiple onChange={(event) => onFilesChange(event.target.files)} ref={hiddenFileInput} type="file" />
                <p className="text-xs text-slate-400">최대 10MB / JPG, PNG, PDF 가능</p>

                <div className="space-y-1">
                  {files.map((file, index) => (
                    <div className="flex items-center justify-between text-xs" key={`${file.name}-${index}`}>
                      <p className="inline-flex items-center gap-1 font-semibold text-[#2f6ff5]">
                        <Paperclip className="h-3 w-3" /> {file.name}
                      </p>
                      <button className="text-slate-400" onClick={() => removeFile(index)} type="button">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <ul className="list-disc pl-4 text-xs text-slate-400">
                <li>등록된 이메일 주소로 답변을 보내드립니다.</li>
                <li>문의 접수 후, 최대 1영업일 이내에 답변드릴 예정입니다.</li>
              </ul>

              <label className="flex items-start gap-2 text-xs text-slate-500">
                <input checked={agreed} className="mt-0.5" onChange={(event) => setAgreed(event.target.checked)} type="checkbox" />
                <span>
                  이용약관 및 개인정보처리방침 동의{" "}
                  <Link className="text-[#2f6ff5] underline" to="/support/privacy-policy" target="_blank">(내용 확인)</Link>
                  <br />
                  문의 처리 및 회신을 위한 이메일 수신에 동의합니다.
                </span>
              </label>

              {error && <p className="text-xs text-rose-500">{error}</p>}
              {loading && <p className="text-xs text-slate-400">문의 내역을 불러오는 중...</p>}
              {!loading && rows.length > 0 && (
                <p className="text-xs text-slate-400">이전 문의 {rows.length}건이 등록되어 있습니다.</p>
              )}

              <Button className="w-full bg-[#2f6ff5] hover:bg-[#2459cd]" disabled={!agreed || submitting} type="submit">
                {submitting ? "문의 접수 중..." : "문의하기"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
