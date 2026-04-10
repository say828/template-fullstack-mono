import React, { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { useAuth } from "../app/AuthContext";
import { roleHomePath } from "../app/roleHome";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { Input } from "../components/ui/input";
import type { UserRole } from "../lib/types";
import { cn } from "../lib/utils";

type LoginRole = "SELLER" | "DEALER";

const LOGIN_ROLES: LoginRole[] = ["SELLER", "DEALER"];

const ROLE_LABEL = {
  SELLER: "판매자 로그인",
  DEALER: "딜러 로그인",
} satisfies Record<LoginRole, string>;

const DEALER_APPROVAL_MESSAGE = "딜러 계정은 관리자 승인 후 로그인할 수 있습니다.";

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

export function LoginPage() {
  const [params, setParams] = useSearchParams();
  const initialRole = ((params.get("role")?.toUpperCase() as UserRole) || "SELLER");
  const [role, setRole] = useState<UserRole>(initialRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socialMessage, setSocialMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { loginWithPassword } = useAuth();
  const navigate = useNavigate();

  const showRoles: LoginRole[] = LOGIN_ROLES;
  const showDealerApproval = role === "DEALER";
  const showSocialButtons = role === "SELLER";
  const canSubmit = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && password.trim().length >= 8;

  useEffect(() => {
    const roleParam = params.get("role");
    if (!roleParam) return;

    const normalizedRole = roleParam.toUpperCase() as LoginRole;
    if (!showRoles.includes(normalizedRole)) {
      setParams({ role: toRoleParam("SELLER") }, { replace: true });
      return;
    }

    if (normalizedRole !== role) {
      setRole(normalizedRole);
    }
  }, [params, role, setParams]);

  const selectRole = (nextRole: LoginRole) => {
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
      navigate(roleHomePath(role), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eef0f6]">
      <header className="border-b border-[#dde1ea] bg-white shadow-[0_1px_4px_rgba(15,23,42,0.08)]">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-5 py-[18px]">
          <Link to="/" className="text-[26px] font-black leading-none tracking-[-0.05em] text-[#2f67e8]">
            Template
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <Link className="px-2 py-1 text-[14px] font-medium text-[#5c6270]" to={`/login?role=${toRoleParam(role)}`}>
              로그인
            </Link>
            <Link className="rounded-full bg-[#2f67e8] px-4 py-2 text-[13px] font-semibold text-white" to="/signup">
              회원가입
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1440px] px-5 py-[42px]">
        <div className="mx-auto max-w-[338px] text-center">
          <p className="text-[42px] font-black leading-none tracking-[-0.06em] text-[#2f67e8]">Template</p>
          <p className="mt-3 text-[13px] font-medium text-[#7a8190]">글로벌 중고차 경매 플랫폼</p>

          <form
            className="mt-6 rounded-[28px] border border-[#edf0f5] bg-white px-5 py-7 shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
            onSubmit={submit}
          >
            <div className={cn("grid gap-2 rounded-[10px] bg-[#eceef3] p-1", "grid-cols-2")}>
              {showRoles.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => selectRole(item)}
                  className={cn(
                    "h-8 rounded-[8px] text-[12px] font-bold transition-colors",
                    item === role
                      ? "border border-[#dfe4ed] bg-white text-[#2f67e8] shadow-[0_1px_2px_rgba(15,23,42,0.08)]"
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
                className="h-10 rounded-[10px] border-[#e1e4ea] bg-white px-4 text-[13px] placeholder:text-[#a3a9b5] focus-visible:ring-1 focus-visible:ring-[#b9c6f3]"
                required
              />
              <Input
                id="login-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="비밀번호를 입력하세요"
                type="password"
                autoComplete="current-password"
                className="h-10 rounded-[10px] border-[#e1e4ea] bg-white px-4 text-[13px] placeholder:text-[#a3a9b5] focus-visible:ring-1 focus-visible:ring-[#b9c6f3]"
                required
                minLength={8}
              />
            </div>

            {showDealerApproval && (
              <div className="mt-2.5 rounded-[4px] bg-[#e8efff] px-3 py-[5px] text-left text-[11px] font-medium text-[#4f74d8]">
                {DEALER_APPROVAL_MESSAGE}
              </div>
            )}

            <div className="mt-4 flex items-center gap-2">
              <Checkbox
                id="login-remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
                className="h-4 w-4 border-[#ccd2e0] data-[state=checked]:border-[#2f67e8] data-[state=checked]:bg-[#2f67e8]"
              />
              <label htmlFor="login-remember" className="text-[12px] font-medium text-[#6f7684]">
                자동 로그인
              </label>
            </div>

            {error && <p className="mt-3 rounded-md bg-[#fff1f1] px-3 py-2 text-left text-[12px] font-medium text-[#c93b3b]">{error}</p>}

            <Button
              className="mt-5 h-10 w-full rounded-[10px] bg-[#2f67e8] text-[15px] font-semibold text-white hover:bg-[#2556c8]"
              disabled={loading || !canSubmit}
              type="submit"
            >
              {loading ? "로그인 중..." : "로그인 하기"}
            </Button>

            <div className="mt-4 flex items-center justify-center gap-2 text-[12px] font-medium text-[#747b89]">
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

            {showSocialButtons && (
              <>
                <div className="relative mt-5 py-1">
                  <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[#e3e6ef]" />
                  <span className="relative bg-white px-3 text-[11px] font-medium text-[#9aa0ad]">다른 방법으로 로그인하기</span>
                </div>

                <div className="mt-4">
                  <SocialButtons
                    onClick={(provider) => {
                      setSocialMessage(provider === "google" ? "구글 로그인은 DEV에서 준비 중입니다." : "네이버 로그인은 DEV에서 준비 중입니다.");
                    }}
                  />
                </div>

                {socialMessage && <p className="mt-3 text-left text-xs font-medium text-[#5f6a80]">{socialMessage}</p>}
              </>
            )}
          </form>

          <p className="mt-9 text-[12px] text-[#808694]">회사소개 · 이용약관 · 개인정보처리방침 · 고객센터</p>
        </div>
      </main>
    </div>
  );
}
