import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { useAuth } from "../app/AuthContext";
import { PageIntro } from "../components/common/PageIntro";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { getAdminPermissionGroup } from "../lib/api";
import type { AdminPermissionGroupDetail } from "../lib/types";

export function AdminPermissionGroupPage() {
  const { token } = useAuth();
  const { groupCode } = useParams<{ groupCode: string }>();
  const [row, setRow] = useState<AdminPermissionGroupDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!token || !groupCode) return;
      try {
        setRow(await getAdminPermissionGroup(token, groupCode));
      } catch (err) {
        setError(err instanceof Error ? err.message : "권한 그룹 상세 조회 실패");
      }
    };
    void load();
  }, [groupCode, token]);

  return (
    <section className="space-y-4">
      <PageIntro title="권한그룹 수정등록" description="ADM_061 권한 그룹 상세와 소속 관리자입니다." />
      {error && <Alert variant="destructive"><AlertTitle>조회 실패</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      {row && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>{row.name}</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>{row.description}</p>
              <div className="flex flex-wrap gap-2">{row.permission_codes.map((code) => <Badge key={code}>{code}</Badge>)}</div>
              <div className="flex flex-wrap gap-2">{row.screen_codes.map((code) => <Badge key={code} variant="secondary">{code}</Badge>)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">소속 관리자</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {row.members.map((member) => (
                <div key={member.id} className="rounded-md border p-3">
                  <p className="font-medium">{member.full_name}</p>
                  <p>{member.email}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  );
}
