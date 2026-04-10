import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { useAuth } from "../app/AuthContext";
import { roleHomePath } from "../app/roleHome";
import { isAdminConsoleHost } from "../app/runtime";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { Input } from "../components/ui/input";
import type { UserRole } from "../lib/types";
import { cn } from "../lib/utils";

const ROLE_LABEL: Record<UserRole, string> = {
  SELLER: "판매자 로그인",
  DEALER: "딜러 로그인",
  ADMIN: "관리자 로그인",
};

function toRoleParam(role: UserRole) {
  if (role === "DEALER") return "dealer";
  if (role === "ADMIN") return "admin";
  return "seller";
}

function SocialButtons({ onClick }: { onClick: (provider: "google" | "naver") => void }) {
  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="relative h-11 w-full justify-center rounded-lg border-[#d8dbe4] bg-white px-4 text-sm font-semibold text-[#4c5564] hover:bg-[#f7f8fc]"
        onClick={() => onClick("google")}
      >
        <span className="absolute left-4 inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#d8dbe4] bg-white text-xs font-bold text-[#4285f4]">
          G
        </span>
        구글로 로그인하기
      </Button>
      <Button
        type="button"
        className="relative h-11 w-full justify-center rounded-lg bg-[#03c75a] px-4 text-sm font-semibold text-white hover:bg-[#02b34f]"
        onClick={() => onClick("naver")}
      >
        <span className="absolute left-4 inline-flex h-5 w-5 items-center justify-center rounded bg-white text-xs font-black text-[#03c75a]">N</span>
        네이버로 시작하기
      </Button>
    </div>
  );
}

function AdminLoginShell({
  email,
  password,
  rememberMe,
  error,
  loading,
  canSubmit,
  onEmailChange,
  onPasswordChange,
  onRememberMeChange,
  onSubmit,
}: {
  email: string;
  password: string;
  rememberMe: boolean;
  error: string | null;
  loading: boolean;
  canSubmit: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onRememberMeChange: (checked: boolean) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  return (
    <div className="min-h-screen bg-[#eceef4]">
      <header className="border-b border-[#d5d8df] bg-[#fbfbfc] shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
        <div className="mx-auto flex h-[68px] w-full max-w-[1440px] items-center px-5">
          <Link to="/login" className="text-[26px] font-black tracking-[-0.05em] text-[#21418d]">
            Template
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1440px] justify-center px-5 py-10 md:py-12">
        <div className="w-full">
          <div className="mx-auto w-full max-w-[478px] rounded-[26px] border border-[#e1e3e8] bg-[#fcfcfd] px-[52px] py-[56px] shadow-[0_1px_0_rgba(15,23,42,0.04)]">
            <div className="text-center">
              <p className="text-[40px] font-black leading-none tracking-[-0.06em] text-[#21418d]">Template</p>
              <h1 className="mt-10 text-[30px] font-black tracking-[-0.03em] text-[#252830]">로그인</h1>
            </div>

            <form className="mt-11" onSubmit={onSubmit}>
              <div className="space-y-[14px]">
                <div className="space-y-2">
                  <label htmlFor="login-email" className="block text-[13px] font-semibold text-[#727784]">
                    아이디
                  </label>
                  <Input
                    id="login-email"
                    value={email}
                    onChange={(event) => onEmailChange(event.target.value)}
                    placeholder="abcde123@gmail.com"
                    type="email"
                    autoComplete="username"
                    className="h-[42px] rounded-[8px] border-[#e1e4ea] bg-white px-4 text-[14px] placeholder:text-[#b9bfca] focus-visible:ring-1 focus-visible:ring-[#21418d]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="login-password" className="block text-[13px] font-semibold text-[#727784]">
                    비밀번호
                  </label>
                  <Input
                    id="login-password"
                    value={password}
                    onChange={(event) => onPasswordChange(event.target.value)}
                    placeholder="••••••••"
                    type="password"
                    autoComplete="current-password"
                    className="h-[42px] rounded-[8px] border-[#e1e4ea] bg-white px-4 text-[14px] placeholder:text-[#b9bfca] focus-visible:ring-1 focus-visible:ring-[#21418d]"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-4">
                <label className="flex items-center gap-2 text-[13px] font-bold text-[#373c46]">
                  <Checkbox
                    id="login-remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => onRememberMeChange(checked === true)}
                    className="h-[18px] w-[18px] rounded-[4px] border-[#bcc4d5] data-[state=checked]:border-[#21418d] data-[state=checked]:bg-[#21418d]"
                  />
                  아이디 저장
                </label>
                <Link className="text-[13px] font-semibold text-[#9a9fab] hover:text-[#646a75]" to="/forgot-password">
                  비밀번호를 잊어버리셨나요?
                </Link>
              </div>

              {error ? (
                <p className="mt-4 rounded-[10px] bg-[#fff1f1] px-4 py-3 text-left text-sm font-medium text-[#c93b3b]">
                  {error}
                </p>
              ) : null}

              <Button
                className="mt-12 h-[42px] w-full rounded-[8px] bg-[#21418d] text-[15px] font-bold text-white hover:bg-[#1a3779] disabled:bg-[#21418d] disabled:text-white disabled:opacity-100"
                disabled={loading || !canSubmit}
                type="submit"
              >
                {loading ? "로그인 중..." : "로그인"}
              </Button>
            </form>
          </div>

          <div className="mt-5 text-center text-[14px] leading-8 text-[#6c7380]">
            <p>• 관리자 계정 생성을 위해서는 시스템 관리자에게 연락바랍니다.</p>
            <p>홍길동 과장 | 02-1234-1234 | admin@000.com</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export function LoginPage() {
  const [params, setParams] = useSearchParams();
  const adminHost = isAdminConsoleHost();
  const initialRole = adminHost ? "ADMIN" : ((params.get("role")?.toUpperCase() as UserRole) || "SELLER");
  const [role, setRole] = useState<UserRole>(initialRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(adminHost);
  const [error, setError] = useState<string | null>(null);
  const [socialMessage, setSocialMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { loginWithPassword } = useAuth();
  const navigate = useNavigate();

  const adminMode = adminHost || initialRole === "ADMIN";
  const showRoles = adminHost ? (["ADMIN"] as UserRole[]) : adminMode ? (["SELLER", "DEALER", "ADMIN"] as UserRole[]) : (["SELLER", "DEALER"] as UserRole[]);
  const canSubmit = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && password.trim().length >= 8;

  useEffect(() => {
    if (!adminHost || !params.has("role")) return;
    const next = new URLSearchParams(params);
    next.delete("role");
    setParams(next, { replace: true });
  }, [adminHost, params, setParams]);

  const selectRole = (nextRole: UserRole) => {
    if (adminHost && nextRole !== "ADMIN") return;
    setRole(nextRole);
    setError(null);
    setSocialMessage(null);
    setParams({ role: toRoleParam(nextRole) }, { replace: true });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSocialMessage(null);

    try {
      await loginWithPassword({ email: email.trim(), password, role, rememberMe });
      navigate(roleHomePath(role, { adminHost }), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (adminHost) {
    return (
      <AdminLoginShell
        email={email}
        password={password}
        rememberMe={rememberMe}
        error={error}
        loading={loading}
        canSubmit={canSubmit}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onRememberMeChange={setRememberMe}
        onSubmit={submit}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#eceef4]">
      <header className="border-b border-[#d8dbe4] bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <Link to="/" className="text-3xl font-black leading-none tracking-tight text-[#2f67e8]">
            Template
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <Link className="px-2 py-1 text-[#5c6270]" to={`/login?role=${toRoleParam(role)}`}>
              로그인
            </Link>
            <Link className="rounded-full bg-[#2f67e8] px-3 py-1.5 font-semibold text-white" to="/signup">
              회원가입
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-9 md:px-6 md:py-12">
        <div className="mx-auto max-w-[390px] text-center">
          <p className="text-5xl font-black tracking-tight text-[#2f67e8]">Template</p>
          <p className="mt-2 text-sm font-medium text-[#727987]">글로벌 중고차 경매 플랫폼</p>

          <form className="mt-6 rounded-[24px] bg-[#f8f9fc] p-6" onSubmit={submit}>
            <div className={cn("grid gap-2 rounded-lg bg-[#ecedf2] p-1", showRoles.length === 2 ? "grid-cols-2" : "grid-cols-3")}>
              {showRoles.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => selectRole(item)}
                  className={cn(
                    "h-8 rounded-md text-xs font-bold transition-colors",
                    item === role
                      ? "border border-[#d7dbea] bg-white text-[#2f67e8]"
                      : "text-[#838896] hover:text-[#5e6572]",
                  )}
                >
                  {ROLE_LABEL[item]}
                </button>
              ))}
            </div>

            <div className="mt-5 space-y-2.5">
              <Input
                id="login-email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="이메일을 입력하세요"
                type="email"
                autoComplete="email"
                className="h-11 rounded-lg border-[#d9dce4] bg-white text-sm placeholder:text-[#9aa0ad] focus-visible:ring-1 focus-visible:ring-[#b9c6f3]"
                required
              />
              <Input
                id="login-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="비밀번호를 입력하세요"
                type="password"
                autoComplete="current-password"
                className="h-11 rounded-lg border-[#d9dce4] bg-white text-sm placeholder:text-[#9aa0ad] focus-visible:ring-1 focus-visible:ring-[#b9c6f3]"
                required
                minLength={8}
              />
            </div>

            {role === "DEALER" && !adminHost && (
              <p className="mt-3 rounded-md bg-[#edf3ff] px-3 py-2 text-xs font-medium text-[#2f6ff5]">
                딜러 계정은 관리자 승인 후 로그인할 수 있습니다.
              </p>
            )}

            <div className="mt-3 flex items-center gap-2">
              <Checkbox
                id="login-remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
                className="h-4 w-4 border-[#ccd2e0] data-[state=checked]:border-[#2f67e8] data-[state=checked]:bg-[#2f67e8]"
              />
              <label htmlFor="login-remember" className="text-xs font-medium text-[#6f7684]">
                자동 로그인
              </label>
            </div>

            {error && <p className="mt-3 rounded-md bg-[#fff1f1] px-3 py-2 text-left text-xs font-medium text-[#c93b3b]">{error}</p>}

            <Button
              className="mt-4 h-11 w-full rounded-lg bg-[#2f67e8] text-base font-semibold text-white hover:bg-[#2556c8]"
              disabled={loading || !canSubmit}
              type="submit"
            >
              {loading ? "로그인 중..." : "로그인 하기"}
            </Button>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs font-medium text-[#747b89]">
              <Link className="hover:text-[#5d6471]" to={`/forgot-password?role=${role === "DEALER" ? "dealer" : "seller"}`}>
                비밀번호 찾기
              </Link>
              <>
                <span className="text-[#c8ccd7]">|</span>
                <Link className="hover:text-[#5d6471]" to="/signup">
                  회원가입
                </Link>
              </>
            </div>

            <div className="relative mt-5 py-1">
              <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[#e3e6ef]" />
              <span className="relative bg-[#f8f9fc] px-3 text-[11px] font-medium text-[#9aa0ad]">다른 방법으로 로그인하기</span>
            </div>

            <div className="mt-4">
              <SocialButtons
                onClick={(provider) => {
                  setSocialMessage(provider === "google" ? "구글 로그인은 DEV에서 준비 중입니다." : "네이버 로그인은 DEV에서 준비 중입니다.");
                }}
              />
            </div>

            {socialMessage && <p className="mt-3 text-left text-xs font-medium text-[#5f6a80]">{socialMessage}</p>}
          </form>

          <p className="mt-8 text-xs text-[#808694]">회사소개 · 이용약관 · 개인정보처리방침 · 고객센터</p>
        </div>
      </main>
    </div>
  );
}
