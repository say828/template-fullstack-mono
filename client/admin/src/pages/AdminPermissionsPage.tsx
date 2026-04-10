import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../app/AuthContext";
import { PageIntro } from "../components/common/PageIntro";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { listAdminPermissionGroups } from "../lib/api";
import type { AdminPermissionGroup } from "../lib/types";

export function AdminPermissionsPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<AdminPermissionGroup[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      try {
        setRows(await listAdminPermissionGroups(token));
      } catch (err) {
        setError(err instanceof Error ? err.message : "권한 그룹 조회 실패");
      }
    };
    void load();
  }, [token]);

  return (
    <section className="space-y-4">
      <PageIntro title="관리자 권한관리" description="ADM_060 권한 그룹과 화면 매핑 현황입니다." />
      {error && <Alert variant="destructive"><AlertTitle>조회 실패</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      <div className="grid gap-3">
        {rows.map((row) => (
          <Card key={row.code}>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">{row.name}</CardTitle>
                <Badge variant="outline">{row.member_count}명</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>{row.description}</p>
              <div className="flex flex-wrap gap-2">{row.permission_codes.map((code) => <Badge key={code}>{code}</Badge>)}</div>
              <Link className="text-[#2459cd]" to={`/admin/permissions/${row.code}`}>상세 보기</Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
