import { FormEvent, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { AuthScaffold } from "../components/auth/AuthScaffold";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { confirmPasswordReset } from "../lib/api";

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const [token, setToken] = useState(params.get("token") ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const passwordsMatch = useMemo(
    () => newPassword.length >= 8 && newPassword === confirmPassword,
    [confirmPassword, newPassword],
  );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token.trim()) {
      setError("재설정 토큰을 입력해 주세요.");
      return;
    }
    if (!passwordsMatch) {
      setError("새 비밀번호와 확인 값이 일치하도록 입력해 주세요.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await confirmPasswordReset({ token: token.trim(), new_password: newPassword });
      setSuccess(response.message);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "비밀번호 재설정 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScaffold activeAction="signup">
      <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
        <CardContent className="space-y-5 p-7">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-black text-slate-900">비밀번호 재설정</h1>
            <p className="text-sm text-slate-500">재설정 토큰과 새 비밀번호를 입력해 계정 접근을 복구합니다.</p>
          </div>

          <form className="space-y-4" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="reset-token">재설정 토큰</Label>
              <Input id="reset-token" value={token} onChange={(event) => setToken(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">새 비밀번호</Label>
              <Input id="new-password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">새 비밀번호 확인</Label>
              <Input id="confirm-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
            </div>
            {error ? (
              <Alert variant="destructive">
                <AlertTitle>재설정 실패</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            {success ? (
              <Alert>
                <AlertTitle>재설정 완료</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            ) : null}
            <Button className="h-11 w-full rounded-md bg-[#2f6ff5] text-base hover:bg-[#2459cd]" disabled={loading} type="submit">
              {loading ? "처리 중..." : "비밀번호 재설정"}
            </Button>
          </form>

          <div className="flex items-center justify-between text-sm">
            <Link className="text-slate-500 hover:text-slate-700" to="/forgot-password">
              이전 단계로
            </Link>
            <Link className="font-semibold text-[#2f6ff5] hover:text-[#2459cd]" to="/login">
              로그인 화면으로
            </Link>
          </div>
        </CardContent>
      </Card>
    </AuthScaffold>
  );
}
