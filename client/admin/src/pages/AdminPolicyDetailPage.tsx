import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { PageIntro } from "../components/common/PageIntro";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { getSupportNotice } from "../lib/api";
import type { SupportNotice } from "../lib/types";

export function AdminPolicyDetailPage() {
  const { policyId } = useParams<{ policyId: string }>();
  const [row, setRow] = useState<SupportNotice | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!policyId) return;
      try {
        setRow(await getSupportNotice(policyId));
      } catch (err) {
        setError(err instanceof Error ? err.message : "정책 문서 상세 조회 실패");
      }
    };
    void load();
  }, [policyId]);

  return (
    <section className="space-y-4">
      <PageIntro title="정책등록상세" description="ADM_054 정책 문서 상세와 편집 준비 화면입니다." />
      {error && <Alert variant="destructive"><AlertTitle>조회 실패</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      {row && (
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>{row.title}</CardTitle>
                <Badge variant="outline">{row.category}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="whitespace-pre-wrap">{row.content}</p>
              <p className="text-xs text-muted-foreground">게시 {new Date(row.published_at).toLocaleString()}</p>
              <Link className="text-[#2459cd]" to="/admin/policies">목록으로</Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">운영 메타</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>문서 ID: {row.id}</p>
              <p>상태: 게시됨</p>
              <p>카테고리: {row.category}</p>
              <p>향후 정책 편집 API 연결 대상 화면</p>
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  );
}
