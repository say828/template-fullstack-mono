import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { listSupportNotices } from "../lib/api";
import type { NoticeCategory, SupportNotice } from "../lib/types";
import { cn } from "../lib/utils";

type NoticeFilter = "ALL" | NoticeCategory;

const supportMenus = [
  { key: "faqs", label: "자주 묻는 질문", to: "/support/faqs" },
  { key: "notices", label: "공지사항", to: "/support/notices" },
  { key: "inquiry", label: "1:1 문의", to: "/support/inquiries" },
] as const;

const noticeTabs: Array<{ key: NoticeFilter; label: string }> = [
  { key: "ALL", label: "전체" },
  { key: "GENERAL", label: "공지사항" },
  { key: "EVENT", label: "이벤트" },
  { key: "SERVICE", label: "업데이트" },
  { key: "POLICY", label: "약관" },
];

const categoryLabel: Record<NoticeCategory, string> = {
  GENERAL: "공지사항",
  SERVICE: "업데이트",
  POLICY: "약관",
  EVENT: "이벤트",
};

function parseCategory(value: string | null): NoticeFilter {
  if (value === "GENERAL" || value === "SERVICE" || value === "POLICY" || value === "EVENT") return value;
  return "ALL";
}

function formatDateOnly(value: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

export function SupportNoticesPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [rows, setRows] = useState<SupportNotice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const keyword = searchParams.get("q") || "";
  const category = parseCategory(searchParams.get("category"));

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listSupportNotices({ limit: 100 });
        setRows(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "공지사항 조회 실패");
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
        return row.title.toLowerCase().includes(normalized) || row.content.toLowerCase().includes(normalized);
      })
      .sort((left, right) => new Date(right.published_at).getTime() - new Date(left.published_at).getTime());
  }, [category, keyword, rows]);

  const setKeyword = (value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value.trim()) next.set("q", value);
      else next.delete("q");
      return next;
    });
  };

  const setCategory = (nextCategory: NoticeFilter) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (nextCategory === "ALL") next.delete("category");
      else next.set("category", nextCategory);
      return next;
    });
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
                  menu.key === "notices"
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
              <h1 className="text-4xl font-extrabold text-slate-900">공지사항</h1>
              <p className="mt-2 text-sm text-slate-500">Template 서비스 이용과 관련된 주요 공지 및 업데이트 소식을 확인할 수 있습니다.</p>
            </div>

            <div className="mx-auto max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input className="rounded-full border-slate-200 pl-9" onChange={(event) => setKeyword(event.target.value)} placeholder="검색어를 입력해주세요" value={keyword} />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-5 border-b border-slate-200 pb-2">
              {noticeTabs.map((tab) => (
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

            {loading && <p className="py-10 text-center text-sm text-slate-500">공지사항을 불러오는 중...</p>}
            {!loading && error && <p className="py-10 text-center text-sm text-rose-500">{error}</p>}
            {!loading && !error && filteredRows.length === 0 && <p className="py-10 text-center text-sm text-slate-500">검색 결과가 없습니다.</p>}

            {!loading && !error && filteredRows.length > 0 && (
              <div className="space-y-1">
                {filteredRows.map((row) => (
                  <Link
                    className="grid grid-cols-[110px_1fr_110px] items-center gap-3 border-b border-slate-100 py-3 text-sm hover:bg-slate-50"
                    key={row.id}
                    to={{ pathname: `/support/notices/${row.id}`, search: searchParams.toString() ? `?${searchParams.toString()}` : "" }}
                  >
                    <span className="font-semibold text-slate-700">{categoryLabel[row.category]}</span>
                    <span className="text-slate-800">{row.title}</span>
                    <span className="text-right text-slate-400">{formatDateOnly(row.published_at)}</span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
