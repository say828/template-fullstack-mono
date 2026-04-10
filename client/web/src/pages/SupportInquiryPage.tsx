import { CheckCircle2, ChevronDown, Paperclip, X } from "lucide-react";
import { FormEvent, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../app/AuthContext";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { createSupportInquiry } from "../lib/api";
import type { InquiryCategory } from "../lib/types";
import { cn } from "../lib/utils";

const supportMenus = [
  { key: "faqs", label: "자주 묻는 질문", to: "/support/faqs" },
  { key: "notices", label: "공지사항", to: "/support/notices" },
  { key: "inquiry", label: "1:1 문의", to: "/support/inquiries" },
] as const;

const categoryOptions: Array<{ value: InquiryCategory; label: string }> = [
  { value: "GENERAL", label: "일반 문의" },
  { value: "ACCOUNT", label: "계정 / 인증" },
  { value: "BIDDING", label: "입찰 / 낙찰" },
  { value: "INSPECTION", label: "검차 / 감가 협의" },
  { value: "SETTLEMENT", label: "인도 / 정산" },
  { value: "DELIVER", label: "기타" },
];

export function SupportInquiryPage() {
  const { token, user } = useAuth();

  const hiddenFileInput = useRef<HTMLInputElement | null>(null);

  const [category, setCategory] = useState<InquiryCategory>("GENERAL");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneOpen, setDoneOpen] = useState(false);

  const onPickFiles = () => {
    hiddenFileInput.current?.click();
  };

  const onFilesChange = (selected: FileList | null) => {
    if (!selected) return;
    const next = [...files, ...Array.from(selected)].slice(0, 3);
    setFiles(next);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !user) return;

    if (!title.trim() || !content.trim()) {
      setError("문의 유형, 제목, 내용을 모두 입력해 주세요.");
      return;
    }

    if (!agreed) {
      setError("개인정보 수집 및 처리방침 동의가 필요합니다.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("category", category);
      formData.set("title", title.trim());
      formData.set("content", content.trim());
      formData.set("agreed_to_policy", "true");
      files.forEach((file) => formData.append("attachments", file));

      await createSupportInquiry(token, formData);

      setCategory("GENERAL");
      setTitle("");
      setContent("");
      setFiles([]);
      setAgreed(false);
      setDoneOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "문의 접수 실패");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-5xl">
      <div className="grid gap-4 md:grid-cols-[146px_1fr]">
        <Card className="h-fit border-slate-200 shadow-none">
          <CardContent className="p-0">
            <div className="border-b border-slate-100 px-4 py-2 text-xs text-slate-400">고객센터</div>
            {supportMenus.map((menu) => (
              <Link
                className={cn(
                  "flex items-center border-l-2 px-4 py-2.5 text-sm",
                  menu.key === "inquiry"
                    ? "border-l-[#2f6ff5] bg-[#edf3ff] font-semibold text-[#2f6ff5]"
                    : "border-l-transparent text-slate-600 hover:bg-slate-50",
                )}
                key={menu.key}
                to={menu.to}
              >
                {menu.label}
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-none">
          <CardContent className="space-y-4 p-5">
            <div className="text-center">
              <h1 className="text-4xl font-extrabold text-slate-900">1:1 문의</h1>
              <p className="mt-2 text-sm text-slate-500">궁금한 점이나 불편한 점이 있으신가요?</p>
              <p className="text-sm text-slate-500">아래 내용을 작성해주시면, 입력하신 이메일로 답변 드릴게요!</p>
            </div>

            <form className="mx-auto max-w-[430px] space-y-3" onSubmit={submit}>
              <div className="space-y-1">
                <label className="text-xs text-slate-500">이메일</label>
                <Input disabled value={user?.email || ""} />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500">문의 유형 선택</label>
                <div className="relative">
                  <select
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
                <label className="text-xs text-slate-500">문의 제목</label>
                <Input onChange={(event) => setTitle(event.target.value)} placeholder="제목을 입력해주세요" value={title} />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500">문의 내용</label>
                <textarea
                  className="min-h-[220px] w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2f6ff5]"
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="궁금한 점이나 문제 상황을 구체적으로 작성해 주세요."
                  value={content}
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

              <label className="flex items-center gap-2 text-xs text-slate-500">
                <input checked={agreed} onChange={(event) => setAgreed(event.target.checked)} type="checkbox" />
                <span>
                  이용약관 및 개인정보처리방침 동의{" "}
                  <Link className="text-[#2f6ff5] underline" to="/support/privacy-policy" target="_blank">(내용 확인)</Link>
                  <br />
                  문의 처리 및 회신을 위한 이메일 수신에 동의합니다.
                </span>
              </label>

              {error && <p className="text-xs text-rose-500">{error}</p>}

              <Button className="w-full bg-[#2f6ff5] hover:bg-[#2459cd]" disabled={submitting || !agreed} type="submit">
                {submitting ? "문의 접수 중..." : "문의하기"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {doneOpen && (
        <div className="fixed bottom-6 right-6 z-30 w-[320px] rounded-xl border border-slate-200 bg-white p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-center">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </span>
          </div>
          <p className="text-center text-lg font-bold text-slate-900">문의가 정상적으로 접수되었습니다.</p>
          <p className="mt-2 text-center text-xs text-slate-500">운영팀이 확인 후 등록하신 이메일로 답변을 드릴 예정입니다.</p>
          <Button className="mt-4 w-full bg-[#2f6ff5] hover:bg-[#2459cd]" onClick={() => setDoneOpen(false)} type="button">
            확인
          </Button>
        </div>
      )}
    </section>
  );
}
