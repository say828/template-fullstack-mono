import React, { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { requestPasswordReset } from "../lib/api";
import type { UserRole } from "../lib/types";
import { cn } from "../lib/utils";

type ResetRole = "SELLER" | "DEALER";

const RESET_ROLES: ResetRole[] = ["SELLER", "DEALER"];

const ROLE_LABEL = {
  SELLER: "판매자 계정",
  DEALER: "딜러 계정",
} satisfies Record<ResetRole, string>;

function toRoleParam(role: UserRole) {
  if (role === "DEALER") return "dealer";
  if (role === "ADMIN") return "admin";
  return "seller";
}

function normalizeRoleParam(value: string | null): ResetRole {
  return value?.toUpperCase() === "DEALER" ? "DEALER" : "SELLER";
}

export function ForgotPasswordPage() {
  const [params, setParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ResetRole>(normalizeRoleParam(params.get("role")));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ title: string; description: string; kind: "success" | "error" } | null>(null);

  const isValidEmail = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), [email]);
  const canSubmit = isValidEmail && !loading;

  useEffect(() => {
    const normalizedRole = normalizeRoleParam(params.get("role"));
    if (normalizedRole !== role) {
      setRole(normalizedRole);
    }
  }, [params, role]);

  const selectRole = (nextRole: ResetRole) => {
    setRole(nextRole);
    setError(null);
    setResult(null);
    setParams({ role: toRoleParam(nextRole) }, { replace: true });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isValidEmail) {
      setError("이메일 형식을 확인해 주세요.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      await requestPasswordReset({ email: email.trim(), role });
      setResult({
        kind: "success",
        title: "임시 비밀번호가 전송되었습니다",
        description: "입력하신 이메일 주소로 임시 비밀번호를 발송했습니다. 메일함을 확인한 후, 임시 비밀번호로 로그인해 주세요.",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "비밀번호 재설정 요청에 실패했습니다.";
      const isMissingAccount = message.includes("계정 정보를 찾을 수 없습니다");
      setResult({
        kind: isMissingAccount ? "error" : "error",
        title: isMissingAccount ? "계정 정보를 찾을 수 없습니다" : "요청을 처리할 수 없습니다",
        description: isMissingAccount
          ? "입력하신 이메일 주소 또는 선택하신 계정 유형에 해당하는 계정이 없습니다. 이메일 주소와 판매자/딜러 선택을 다시 한 번 확인해 주세요."
          : message,
      });
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
            className="mt-6 rounded-[28px] border border-[#edf0f5] bg-white px-5 py-7 text-left shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
            onSubmit={submit}
          >
            <div className="text-center">
              <h1 className="text-[26px] font-black tracking-[-0.03em] text-[#111827]">비밀번호 찾기</h1>
              <p className="mt-3 text-[12px] leading-5 text-[#7a8190]">
                Template에 가입하신 이메일 주소를 입력해 주세요.
                <br />
                임시 비밀번호를 이메일로 보내드립니다.
              </p>
            </div>

            <div className="mt-7 space-y-2">
              <p className="text-[12px] font-bold text-[#5f6572]">이메일 주소</p>
              <Input
                id="reset-email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="가입하신 이메일을 입력하세요"
                type="email"
                autoComplete="email"
                className="h-10 rounded-[10px] border-[#e1e4ea] bg-white px-4 text-[13px] placeholder:text-[#a3a9b5] focus-visible:ring-1 focus-visible:ring-[#b9c6f3]"
                required
              />
            </div>

            <div className="mt-5 space-y-2">
              <p className="text-[12px] font-bold text-[#5f6572]">계정 유형</p>
              <div className="grid grid-cols-2 gap-2">
                {RESET_ROLES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => selectRole(item)}
                    className={cn(
                      "flex h-10 items-center justify-center gap-2 rounded-[10px] border text-[12px] font-semibold transition-colors",
                      role === item
                        ? "border-[#d8e4ff] bg-[#eaf1ff] text-[#2f67e8]"
                        : "border-[#e1e4ea] bg-white text-[#6f7684] hover:border-[#cad0dc]",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex h-4 w-4 items-center justify-center rounded-full border",
                        role === item ? "border-[#7ca0ff] text-[#2f67e8]" : "border-[#d2d7e2] text-transparent",
                      )}
                    >
                      <span className="h-2 w-2 rounded-full bg-current" />
                    </span>
                    {ROLE_LABEL[item]}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="mt-3 rounded-md bg-[#fff1f1] px-3 py-2 text-[12px] font-medium text-[#c93b3b]">{error}</p>}

            <Button
              className="mt-7 h-10 w-full rounded-[10px] bg-[#2f67e8] text-[15px] font-semibold text-white hover:bg-[#2556c8]"
              disabled={!canSubmit}
              type="submit"
            >
              {loading ? "요청 중..." : "비밀번호 찾기"}
            </Button>

            <div className="mt-7 border-t border-[#eef1f5] pt-5">
              <div className="flex items-center justify-between text-[12px] font-semibold">
                <Link className="text-[#6f7684] hover:text-[#545b69]" to={`/login?role=${toRoleParam(role)}`}>
                  로그인 화면으로
                </Link>
                <Link className="text-[#2f67e8] hover:text-[#2556c8]" to="/signup">
                  회원가입 하기
                </Link>
              </div>
            </div>
          </form>

          <p className="mt-9 text-[12px] text-[#808694]">회사소개 · 이용약관 · 개인정보처리방침 · 고객센터</p>
        </div>
      </main>

      {result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.16)] px-5">
          <div className="w-full max-w-[360px] rounded-[24px] border border-[#edf0f5] bg-white px-6 py-7 text-center shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
            <p className="text-[20px] font-black tracking-[-0.03em] text-[#111827]">{result.title}</p>
            <p className="mt-4 whitespace-pre-line text-[13px] leading-6 text-[#6b7280]">{result.description}</p>
            <Button className="mt-6 h-10 w-full rounded-[10px] bg-[#2f67e8] text-[14px] font-semibold text-white hover:bg-[#2556c8]" asChild>
              <Link to={`/login?role=${toRoleParam(role)}`}>확인</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
