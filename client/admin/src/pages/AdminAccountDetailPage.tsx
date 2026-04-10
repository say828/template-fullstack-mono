import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useAuth } from "../app/AuthContext";
import { PageIntro } from "../components/common/PageIntro";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { getAdminAccount, updateAdminAccount } from "../lib/api";
import type { AdminAccountDetail } from "../lib/types";

const GROUP_OPTIONS = [
  { value: "SUPER_ADMIN", label: "슈퍼 관리자" },
  { value: "OPS_ADMIN", label: "운영 관리자" },
] as const;

const ACCOUNT_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "ACTIVE" },
  { value: "SUSPENDED", label: "SUSPENDED" },
] as const;

export function AdminAccountDetailPage() {
  const { token } = useAuth();
  const { accountId } = useParams<{ accountId: string }>();
  const [row, setRow] = useState<AdminAccountDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [accountStatus, setAccountStatus] = useState("ACTIVE");
  const [permissionGroupCode, setPermissionGroupCode] = useState("OPS_ADMIN");

  useEffect(() => {
    const load = async () => {
      if (!token || !accountId) return;
      try {
        const response = await getAdminAccount(token, accountId);
        setRow(response);
        setFullName(response.full_name);
        setPhone(response.phone || "");
        setCountry(response.country || "");
        setAccountStatus(response.account_status);
        setPermissionGroupCode(response.permission_group_code);
      } catch (err) {
        setError(err instanceof Error ? err.message : "계정 상세 조회 실패");
      }
    };
    void load();
  }, [accountId, token]);

  const save = async () => {
    if (!token || !accountId) return;
    setSaving(true);
    setSaveMessage(null);
    setError(null);
    try {
      const response = await updateAdminAccount(token, accountId, {
        full_name: fullName,
        phone,
        country,
        account_status: accountStatus,
        permission_group_code: permissionGroupCode,
      });
      setRow(response);
      setFullName(response.full_name);
      setPhone(response.phone || "");
      setCountry(response.country || "");
      setAccountStatus(response.account_status);
      setPermissionGroupCode(response.permission_group_code);
      setSaveMessage("관리자 계정 정보를 저장했습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "계정 수정 실패");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-4">
      <PageIntro title="계정등록상세" description="ADM_059 관리자 계정 상세와 권한 범위를 확인합니다." />
      {error && <Alert variant="destructive"><AlertTitle>조회 실패</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      {saveMessage && <Alert><AlertTitle>저장 완료</AlertTitle><AlertDescription>{saveMessage}</AlertDescription></Alert>}
      {row && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>{row.full_name}</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-2">
                <Label htmlFor="admin-detail-email">이메일</Label>
                <Input id="admin-detail-email" value={row.email} readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-detail-name">이름</Label>
                <Input id="admin-detail-name" value={fullName} onChange={(event) => setFullName(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-detail-phone">연락처</Label>
                <Input id="admin-detail-phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-detail-country">국가</Label>
                <Input id="admin-detail-country" value={country} onChange={(event) => setCountry(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-detail-status">계정 상태</Label>
                <select
                  id="admin-detail-status"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={accountStatus}
                  onChange={(event) => setAccountStatus(event.target.value)}
                >
                  {ACCOUNT_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-detail-group">권한 그룹</Label>
                <select
                  id="admin-detail-group"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={permissionGroupCode}
                  onChange={(event) => setPermissionGroupCode(event.target.value)}
                >
                  {GROUP_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between gap-3">
                <Badge variant="outline">{row.permission_group_name}</Badge>
                <Button type="button" onClick={() => void save()} disabled={saving || !fullName.trim()}>
                  {saving ? "저장 중..." : "수정 저장"}
                </Button>
              </div>
              <p><Link className="text-[#2459cd]" to={`/admin/permissions/${permissionGroupCode}`}>권한 그룹 보기</Link></p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">권한 상세</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>{row.permission_group_description}</p>
              <div className="flex flex-wrap gap-2">{row.permission_codes.map((code) => <Badge key={code}>{code}</Badge>)}</div>
              <div className="flex flex-wrap gap-2">{row.screen_codes.map((code) => <Badge key={code} variant="secondary">{code}</Badge>)}</div>
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  );
}
