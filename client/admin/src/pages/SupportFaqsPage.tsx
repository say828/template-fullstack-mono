import { ChevronDown, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { listSupportFaqs } from "../lib/api";
import type { FaqCategory, SupportFaq } from "../lib/types";
import { cn } from "../lib/utils";

type FaqFilter = "ALL" | FaqCategory;

const supportMenus = [
  { key: "faqs", label: "자주 묻는 질문", to: "/support/faqs" },
  { key: "notices", label: "공지사항", to: "/support/notices" },
  { key: "inquiry", label: "1:1 문의", to: "/support/inquiries" },
] as const;

const faqTabs: Array<{ key: FaqFilter; label: string }> = [
  { key: "ALL", label: "전체" },
  { key: "BIDDING", label: "입찰/낙찰" },
  { key: "GENERAL", label: "검차/감가 협의" },
  { key: "SETTLEMENT", label: "인도/정산" },
  { key: "ACCOUNT", label: "계정/보안" },
  { key: "DEALER", label: "기타문의" },
];

export function SupportFaqsPage() {
  const [rows, setRows] = useState<SupportFaq[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState<FaqFilter>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listSupportFaqs({ limit: 100 });
        setRows(data);
        setExpandedId(data[0]?.id ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "FAQ 조회 실패");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const filteredRows = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    return rows
      .filter((row) => (category === "ALL" ? true : row.category === category))
      .filter((row) => {
        if (!normalized) return true;
        return row.question.toLowerCase().includes(normalized) || row.answer.toLowerCase().includes(normalized);
      })
      .sort((left, right) => left.sort_order - right.sort_order);
  }, [category, keyword, rows]);

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
                  menu.key === "faqs"
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
              <h1 className="text-4xl font-extrabold text-slate-900">고객센터</h1>
              <p className="mt-2 text-sm text-slate-500">Template 이용 중 궁금한 점이 있으신가요?</p>
              <p className="text-sm text-slate-500">자주 묻는 질문을 검색하거나, 1:1 문의를 통해 도움을 요청하실 수 있습니다.</p>
            </div>

            <div className="mx-auto max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  className="rounded-full border-slate-200 pl-9"
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="검색어를 입력해주세요"
                  value={keyword}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-5 border-b border-slate-200 pb-2">
              {faqTabs.map((tab) => (
                <button
                  className={cn(
                    "border-b-2 pb-1 text-base font-semibold",
                    category === tab.key ? "border-b-slate-700 text-slate-900" : "border-b-transparent text-slate-400",
                  )}
                  key={tab.key}
                  onClick={() => setCategory(tab.key)}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="space-y-0">
              {loading && <p className="py-10 text-center text-sm text-slate-500">FAQ를 불러오는 중...</p>}
              {!loading && error && <p className="py-10 text-center text-sm text-rose-500">{error}</p>}
              {!loading && !error && filteredRows.length === 0 && <p className="py-10 text-center text-sm text-slate-500">검색 결과가 없습니다.</p>}

              {!loading &&
                !error &&
                filteredRows.map((row) => {
                  const expanded = expandedId === row.id;
                  return (
                    <div className="border-b border-slate-100" key={row.id}>
                      <button
                        className="flex w-full items-center justify-between gap-2 py-4 text-left"
                        onClick={() => setExpandedId(expanded ? null : row.id)}
                        type="button"
                      >
                        <span className="text-base font-semibold text-slate-800">{row.question}</span>
                        <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", expanded && "rotate-180")} />
                      </button>
                      {expanded && <p className="pb-4 text-sm leading-relaxed text-slate-600">{row.answer}</p>}
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
