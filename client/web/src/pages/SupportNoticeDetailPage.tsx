import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { getSupportNotice } from "../lib/api";
import type { SupportNotice } from "../lib/types";
import { cn } from "../lib/utils";

const supportMenus = [
  { key: "faqs", label: "자주 묻는 질문", to: "/support/faqs" },
  { key: "notices", label: "공지사항", to: "/support/notices" },
  { key: "inquiry", label: "1:1 문의", to: "/support/inquiries" },
] as const;

function pseudoViewCount(id: string) {
  const seed = id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return 1000 + (seed % 1200);
}

function formatDateOnly(value: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function SupportNoticeDetailPage() {
  const { noticeId } = useParams<{ noticeId: string }>();
  const location = useLocation();

  const [row, setRow] = useState<SupportNotice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!noticeId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getSupportNotice(noticeId);
        setRow(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "공지사항 상세 조회 실패");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [noticeId]);

  const backTo = useMemo(() => {
    return `/support/notices${location.search}`;
  }, [location.search]);

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
            {loading && <p className="py-10 text-center text-sm text-slate-500">공지사항을 불러오는 중...</p>}
            {!loading && error && <p className="py-10 text-center text-sm text-rose-500">{error}</p>}

            {!loading && !error && row && (
              <>
                <div>
                  <h1 className="text-4xl font-extrabold text-slate-900">{row.title}</h1>
                  <p className="mt-2 text-sm font-semibold text-slate-400">
                    게시일: {formatDateOnly(row.published_at)}&nbsp;&nbsp; 작성자: Template 운영팀&nbsp;&nbsp; 조회: {pseudoViewCount(row.id).toLocaleString()}
                  </p>
                </div>

                <div className="h-px bg-slate-200" />

                <div className="min-h-[420px] whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{row.content}</div>

                <Button className="border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200" asChild type="button" variant="outline">
                  <Link to={backTo}>목록으로</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
