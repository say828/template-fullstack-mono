import { FormEvent, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { isAdminConsoleHost } from "../app/runtime";
import { AuthScaffold } from "../components/auth/AuthScaffold";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { requestPasswordReset } from "../lib/api";
import type { UserRole } from "../lib/types";
import { cn } from "../lib/utils";

function AdminForgotPasswordShell({
  email,
  loading,
  error,
  result,
  isValidEmail,
  onEmailChange,
  onSubmit,
}: {
  email: string;
  loading: boolean;
  error: string | null;
  result: { message: string; debugResetToken?: string } | null;
  isValidEmail: boolean;
  onEmailChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[rgba(54,56,60,0.96)] px-4 py-8">
      <div className="w-full max-w-[392px] rounded-[16px] bg-[#f6f6f7] px-[32px] py-[30px] shadow-[0_14px_30px_rgba(0,0,0,0.14)]">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-5">
            <h1 className="text-[21px] font-black tracking-[-0.03em] text-[#18181b]">비밀번호 찾기</h1>
            <p className="text-[14px] font-medium leading-[1.6] text-[#a0a4ab]">
              가입 시 입력한 이메일 주소를 입력해주세요.
              <br />
              비밀번호 재설정 안내를 진행합니다.
            </p>
          </div>
          <Link className="text-[28px] leading-none text-[#b1b5bc] hover:text-[#7d838f]" to="/login">
            ×
          </Link>
        </div>

        <form className="mt-9 space-y-6" onSubmit={onSubmit}>
          <div className="space-y-3">
            <label htmlFor="reset-email" className="block text-[13px] font-bold text-[#8b9099]">
              아이디
            </label>
            <Input
              id="reset-email"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              placeholder="abcde123@gmail.com"
              type="email"
              required
              className="h-[48px] rounded-[8px] border-[#e5e7eb] bg-white px-4 text-[14px] placeholder:text-[#b9bec8] focus-visible:ring-1 focus-visible:ring-[#21418d]"
            />
          </div>

          {error ? (
            <Alert variant="destructive">
              <AlertTitle>요청 실패</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {result ? (
            <Alert>
              <AlertTitle>요청 완료</AlertTitle>
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          ) : null}

          <Button
            className="h-[46px] w-full rounded-[8px] bg-[#21418d] text-[15px] font-bold text-white hover:bg-[#1a3779] disabled:bg-[#21418d] disabled:text-white disabled:opacity-100"
            disabled={loading || !isValidEmail}
            type="submit"
          >
            {loading ? "요청 중..." : "비밀번호 찾기"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export function ForgotPasswordPage() {
  const [params] = useSearchParams();
  const adminHost = isAdminConsoleHost();
  const initialRole = adminHost ? "ADMIN" : ((params.get("role")?.toUpperCase() as UserRole) || "SELLER");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>(adminHost ? "ADMIN" : initialRole === "DEALER" ? "DEALER" : "SELLER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ message: string; debugResetToken?: string } | null>(null);

  const isValidEmail = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), [email]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isValidEmail) {
      setError("이메일 형식을 확인해 주세요.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await requestPasswordReset({ email: email.trim(), role });
      setResult({
        message: response.message,
        debugResetToken: response.debug_reset_token,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "비밀번호 재설정 요청에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (adminHost) {
    return (
      <AdminForgotPasswordShell
        email={email}
        loading={loading}
        error={error}
        result={result}
        isValidEmail={isValidEmail}
        onEmailChange={setEmail}
        onSubmit={submit}
      />
    );
  }

  return (
    <AuthScaffold activeAction="signup">
      <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
        <CardContent className="space-y-5 p-7">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-black text-slate-900">비밀번호 찾기</h1>
            <p className="text-sm text-slate-500">
              Template에 가입하신 이메일 주소를 입력해 주세요.
              <br />
              비밀번호 재설정 링크를 발송합니다.
            </p>
          </div>

          <form className="space-y-4" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="reset-email">이메일 주소</Label>
              <Input
                id="reset-email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="가입하신 이메일을 입력하세요"
                type="email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>계정 유형</Label>
              <div className={cn("grid gap-2", adminHost ? "grid-cols-1" : "grid-cols-2")}>
                {(
                  adminHost
                    ? ([{ role: "ADMIN", label: "관리자 계정" }] as const)
                    : ([
                        { role: "SELLER", label: "판매자 계정" },
                        { role: "DEALER", label: "딜러 계정" },
                      ] as const)
                ).map((item) => (
                  <button
                    key={item.role}
                    className={cn(
                      "rounded-md border px-3 py-2 text-sm font-semibold transition-colors",
                      role === item.role
                        ? "border-[#2f6ff5] bg-[#e8f0ff] text-[#2f6ff5]"
                        : "border-slate-300 bg-white text-slate-600 hover:border-slate-400",
                    )}
                    onClick={() => setRole(item.role)}
                    type="button"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTitle>요청 실패</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button className="h-11 w-full rounded-md bg-[#2f6ff5] text-base hover:bg-[#2459cd]" disabled={loading} type="submit">
              {loading ? "요청 중..." : "비밀번호 찾기"}
            </Button>
          </form>

          <div className="flex items-center justify-between text-sm">
            <Link className="text-slate-500 hover:text-slate-700" to="/login">
              로그인 화면으로
            </Link>
            {!adminHost && (
              <Link className="font-semibold text-[#2f6ff5] hover:text-[#2459cd]" to="/signup">
                회원가입 하기
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {result && (
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <Card className="rounded-xl border-slate-200 bg-white">
            <CardContent className="space-y-2 p-5">
              <p className="text-sm font-semibold text-slate-900">요청 결과</p>
              <p className="text-sm text-slate-600">{result.message}</p>
              <div className="grid gap-2">
                <Button className="mt-2 w-full" asChild>
                  <Link to="/login">확인</Link>
                </Button>
                {result.debugResetToken ? (
                  <Button className="w-full" variant="outline" asChild>
                    <Link to={`/reset-password?token=${encodeURIComponent(result.debugResetToken)}`}>DEV 재설정 화면 열기</Link>
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-slate-200 bg-white">
            <CardContent className="space-y-2 p-5">
              <p className="text-sm font-semibold text-slate-900">가입 정보 확인</p>
              <p className="text-sm text-slate-600">입력하신 이메일과 계정 유형을 확인해 주세요.</p>
              {result.debugResetToken ? (
                <p className="text-xs text-slate-500">DEV에서는 재설정 화면으로 직접 이어서 검증할 수 있습니다.</p>
              ) : (
                <p className="text-xs text-slate-500">보안 정책상 상세 토큰은 노출되지 않습니다.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </AuthScaffold>
  );
}
