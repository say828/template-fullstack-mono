import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../app/AuthContext";
import { PageIntro } from "../components/common/PageIntro";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { createAdminAccount, listAdminAccounts } from "../lib/api";
import type { AdminAccountSummary } from "../lib/types";

const GROUP_OPTIONS = [
  { value: "SUPER_ADMIN", label: "슈퍼 관리자" },
  { value: "OPS_ADMIN", label: "운영 관리자" },
] as const;

const ACCOUNT_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "ACTIVE" },
  { value: "SUSPENDED", label: "SUSPENDED" },
] as const;

export function AdminAccountsPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<AdminAccountSummary[]>([]);
  const [keyword, setKeyword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("KR");
  const [accountStatus, setAccountStatus] = useState<string>("ACTIVE");
  const [permissionGroupCode, setPermissionGroupCode] = useState<string>("OPS_ADMIN");

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      try {
        setRows(await listAdminAccounts(token));
      } catch (err) {
        setError(err instanceof Error ? err.message : "관리자 계정 조회 실패");
      }
    };
    void load();
  }, [token]);

  const reload = async () => {
    if (!token) return;
    setRows(await listAdminAccounts(token));
  };

  const visibleRows = useMemo(() => {
    const needle = keyword.trim().toLowerCase();
    return rows.filter((row) => !needle || [row.full_name, row.email, row.permission_group_name].join(" ").toLowerCase().includes(needle));
  }, [keyword, rows]);

  const createAccount = async () => {
    if (!token) return;
    setCreating(true);
    setCreateError(null);
    setCreateSuccess(null);
    try {
      const created = await createAdminAccount(token, {
        email,
        full_name: fullName,
        password,
        phone: phone || undefined,
        country: country || undefined,
        account_status: accountStatus,
        permission_group_code: permissionGroupCode,
      });
      setCreateSuccess(`${created.full_name} 계정을 등록했습니다.`);
      setEmail("");
      setFullName("");
      setPassword("");
      setPhone("");
      setCountry("KR");
      setAccountStatus("ACTIVE");
      setPermissionGroupCode("OPS_ADMIN");
      await reload();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "관리자 계정 등록 실패");
    } finally {
      setCreating(false);
    }
  };

  return (
    <section className="space-y-4">
      <PageIntro title="관리자 계정관리" description="ADM_058 관리자 계정 목록과 권한 그룹 매핑을 확인합니다." />
      {error && <Alert variant="destructive"><AlertTitle>조회 실패</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">관리자 신규 등록</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="admin-account-name">이름</Label>
            <Input id="admin-account-name" value={fullName} onChange={(event) => setFullName(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-account-email">이메일</Label>
            <Input id="admin-account-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-account-password">초기 비밀번호</Label>
            <Input id="admin-account-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-account-phone">연락처</Label>
            <Input id="admin-account-phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-account-country">국가</Label>
            <Input id="admin-account-country" value={country} onChange={(event) => setCountry(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-account-status">계정 상태</Label>
            <select
              id="admin-account-status"
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
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="admin-account-group">권한 그룹</Label>
            <select
              id="admin-account-group"
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
          {createError ? (
            <Alert variant="destructive" className="md:col-span-2">
              <AlertTitle>등록 실패</AlertTitle>
              <AlertDescription>{createError}</AlertDescription>
            </Alert>
          ) : null}
          {createSuccess ? (
            <Alert className="md:col-span-2">
              <AlertTitle>등록 완료</AlertTitle>
              <AlertDescription>{createSuccess}</AlertDescription>
            </Alert>
          ) : null}
          <div className="md:col-span-2">
            <Button type="button" onClick={() => void createAccount()} disabled={creating || !email || !fullName || !password}>
              {creating ? "등록 중..." : "관리자 계정 등록"}
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <Input placeholder="이름/이메일/권한그룹 검색" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
        </CardContent>
      </Card>
      <div className="grid gap-3">
        {visibleRows.map((row) => (
          <Card key={row.id}>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">{row.full_name}</CardTitle>
                <Badge variant="outline">{row.permission_group_name}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>{row.email}</p>
              <p>계정 상태: {row.account_status}</p>
              <Link className="text-[#2459cd]" to={`/admin/accounts/${row.id}`}>상세 보기</Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
