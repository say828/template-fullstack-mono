import { useEffect, useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { listSupportFaqs } from "../../lib/api";
import type { FaqCategory, SupportFaq } from "../../lib/types";
import { DealerSupportNav } from "./DealerSupportNav";

const categories: Array<{ value: "ALL" | FaqCategory; label: string }> = [
  { value: "ALL", label: "전체" },
  { value: "BIDDING", label: "입찰/낙찰" },
  { value: "SETTLEMENT", label: "결제/정산" },
  { value: "DEALER", label: "딜러" },
  { value: "ACCOUNT", label: "계정/보안" },
  { value: "GENERAL", label: "기타" },
];

export function DealerFaqPage() {
  const [rows, setRows] = useState<SupportFaq[]>([]);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState<"ALL" | FaqCategory>("ALL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listSupportFaqs({ keyword: keyword.trim() || undefined, category: category === "ALL" ? undefined : category, limit: 100 });
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "FAQ 조회 실패");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filteredRows = useMemo(() => rows, [rows]);

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-3xl font-black text-slate-900">자주 묻는 질문</h1>
        <p className="text-sm text-slate-500">DL_035 고객센터 FAQ</p>
      </header>

      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        <DealerSupportNav active="faqs" />

        <div className="space-y-4">
          <Card>
            <CardContent className="grid gap-3 pt-6 md:grid-cols-[1fr_180px_auto]">
              <div className="space-y-1">
                <Label htmlFor="dealer-faq-keyword">검색</Label>
                <Input
                  id="dealer-faq-keyword"
                  placeholder="질문/답변 검색"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="dealer-faq-category">카테고리</Label>
                <select
                  id="dealer-faq-category"
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                  value={category}
                  onChange={(event) => setCategory(event.target.value as "ALL" | FaqCategory)}
                >
                  {categories.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
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

          {loading && <p className="text-sm text-slate-500">FAQ를 불러오는 중...</p>}
          {error && <p className="text-sm text-rose-500">{error}</p>}

          <div className="space-y-3">
            {filteredRows.map((row) => {
              const open = openId === row.id;
              return (
                <Card key={row.id}>
                  <CardHeader>
                    <button type="button" className="text-left" onClick={() => setOpenId((prev) => (prev === row.id ? null : row.id))}>
                      <CardTitle className="text-base">Q. {row.question}</CardTitle>
                    </button>
                  </CardHeader>
                  {open && (
                    <CardContent>
                      <p className="text-sm text-slate-700">A. {row.answer}</p>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>

          {!loading && filteredRows.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-sm text-slate-500">조건에 맞는 FAQ가 없습니다.</CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}
