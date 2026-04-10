import { useEffect, useState } from "react";

import { useAuth } from "../app/AuthContext";
import { PageIntro } from "../components/common/PageIntro";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { getAdminRuntimeVersion } from "../lib/api";
import type { AdminRuntimeVersion } from "../lib/types";

export function AdminVersionPage() {
  const { token } = useAuth();
  const [row, setRow] = useState<AdminRuntimeVersion | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      try {
        setRow(await getAdminRuntimeVersion(token));
      } catch (err) {
        setError(err instanceof Error ? err.message : "버전 조회 실패");
      }
    };

    void load();
  }, [token]);

  return (
    <section className="space-y-4">
      <PageIntro title="버전보기" description="ADM_055 운영 배포 버전과 변경 요약입니다." />

      {error && (
        <Alert variant="destructive">
          <AlertTitle>조회 실패</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {row && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card><CardHeader><CardTitle className="text-base">앱</CardTitle></CardHeader><CardContent className="text-lg font-semibold">{row.app_name}</CardContent></Card>
            <Card><CardHeader><CardTitle className="text-base">환경</CardTitle></CardHeader><CardContent className="text-lg font-semibold">{row.environment}</CardContent></Card>
            <Card><CardHeader><CardTitle className="text-base">API 버전</CardTitle></CardHeader><CardContent className="text-lg font-semibold">{row.api_version}</CardContent></Card>
            <Card><CardHeader><CardTitle className="text-base">Git</CardTitle></CardHeader><CardContent className="text-lg font-semibold">{row.git_commit || "-"}</CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">배포 메타</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>브랜치: {row.git_branch || "-"}</p>
              <div className="flex flex-wrap gap-2">
                {row.modules.map((item) => (
                  <Badge key={item}>{item}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">최근 변경</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {row.release_notes.map((note) => (
                <div key={note} className="rounded-lg border px-3 py-3">
                  {note}
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </section>
  );
}
