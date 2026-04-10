import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { listSupportNotices } from "../../lib/api";
import type { NoticeCategory, SupportNotice } from "../../lib/types";
import { DealerSupportNav } from "./DealerSupportNav";

export function DealerNoticesPage() {
  const [rows, setRows] = useState<SupportNotice[]>([]);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState<"ALL" | NoticeCategory>("ALL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listSupportNotices({ keyword: keyword.trim() || undefined, category: category === "ALL" ? undefined : category, limit: 100 });
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "공지사항 조회 실패");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-3xl font-black text-slate-900">공지사항</h1>
        <p className="text-sm text-slate-500">DL_036 공지 목록</p>
      </header>

      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        <DealerSupportNav active="notices" />

        <div className="space-y-4">
          <Card>
            <CardContent className="grid gap-3 pt-6 md:grid-cols-[1fr_180px_auto]">
              <div className="space-y-1">
                <Label htmlFor="dealer-notice-keyword">검색</Label>
                <Input
                  id="dealer-notice-keyword"
                  placeholder="제목/내용 검색"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="dealer-notice-category">분류</Label>
                <select
                  id="dealer-notice-category"
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  value={category}
                  onChange={(event) => setCategory(event.target.value as "ALL" | NoticeCategory)}
                >
                  <option value="ALL">전체 공지사항</option>
                  <option value="EVENT">이벤트</option>
                  <option value="SERVICE">업데이트</option>
                  <option value="POLICY">약관</option>
                  <option value="GENERAL">일반</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  className="h-10 rounded-md bg-[#2f6ff5] px-4 text-sm font-semibold text-white hover:bg-[#2459cd]"
                  onClick={() => void load()}
                >
                  검색
                </button>
              </div>
            </CardContent>
          </Card>

          {loading && <p className="text-sm text-slate-500">공지사항을 불러오는 중...</p>}
          {error && <p className="text-sm text-rose-500">{error}</p>}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">공지 리스트</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {rows.map((row) => (
                <Link key={row.id} to={`/dealer/support/notices/${row.id}`} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
                  <span>{row.title}</span>
                  <span className="text-xs text-slate-400">{new Date(row.published_at).toLocaleDateString()}</span>
                </Link>
              ))}
              {!loading && rows.length === 0 && <p className="text-sm text-slate-500">등록된 공지사항이 없습니다.</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
