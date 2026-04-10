import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { getSupportNotice } from "../../lib/api";
import type { SupportNotice } from "../../lib/types";
import { DealerSupportNav } from "./DealerSupportNav";

export function DealerNoticeDetailPage() {
  const { noticeId } = useParams<{ noticeId: string }>();
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
        setError(err instanceof Error ? err.message : "공지 상세 조회 실패");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [noticeId]);

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-3xl font-black text-slate-900">공지사항 상세</h1>
        <p className="text-sm text-slate-500">DL_037 공지 본문</p>
      </header>

      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        <DealerSupportNav active="notices" />

        <div className="space-y-4">
          <Link to="/dealer/support/notices" className="inline-flex items-center rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
            목록으로
          </Link>

          {loading && <p className="text-sm text-slate-500">공지사항을 불러오는 중...</p>}
          {error && <p className="text-sm text-rose-500">{error}</p>}

          {row && (
            <Card>
              <CardHeader>
                <CardTitle>{row.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-700">
                <p className="text-xs text-slate-400">{new Date(row.published_at).toLocaleString()}</p>
                <p className="whitespace-pre-wrap leading-relaxed">{row.content}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}
