import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { PageIntro } from "../components/common/PageIntro";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { listSupportNotices } from "../lib/api";
import type { SupportNotice } from "../lib/types";

export function AdminPolicyDocumentsPage() {
  const [rows, setRows] = useState<SupportNotice[]>([]);
  const [keyword, setKeyword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setRows(await listSupportNotices({ category: "POLICY", limit: 100 }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "정책 문서 조회 실패");
      }
    };
    void load();
  }, []);

  const visibleRows = useMemo(() => {
    const needle = keyword.trim().toLowerCase();
    return rows.filter((row) => !needle || [row.title, row.content].join(" ").toLowerCase().includes(needle));
  }, [keyword, rows]);

  return (
    <section className="space-y-4">
      <PageIntro title="정책 문서 관리" description="ADM_053 정책 문서 목록 운영 화면입니다." />
      {error && <Alert variant="destructive"><AlertTitle>조회 실패</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      <Card><CardContent className="pt-6"><Input placeholder="정책 문서 검색" value={keyword} onChange={(event) => setKeyword(event.target.value)} /></CardContent></Card>
      <div className="grid gap-3">
        {visibleRows.map((row) => (
          <Card key={row.id}>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">{row.title}</CardTitle>
                <Badge variant="outline">POLICY</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="line-clamp-3 text-muted-foreground">{row.content}</p>
              <p className="text-xs text-muted-foreground">{new Date(row.published_at).toLocaleString()}</p>
              <Link className="text-[#2459cd]" to={`/admin/policies/${row.id}`}>상세 보기</Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
