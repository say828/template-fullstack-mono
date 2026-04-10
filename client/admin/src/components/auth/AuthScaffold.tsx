import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { isAdminConsoleHost } from "../../app/runtime";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

type AuthAction = "login" | "signup";

export function AuthScaffold({
  activeAction,
  children,
  maxWidthClass = "max-w-md",
}: {
  activeAction?: AuthAction;
  children: ReactNode;
  maxWidthClass?: string;
}) {
  const adminHost = isAdminConsoleHost();

  return (
    <div className="min-h-screen bg-[#eef1f8]">
      <header className="border-b border-slate-200 bg-white">
        <div className="surface-shell surface-grid py-4">
          <div className="surface-span-12 flex items-center justify-between">
            <Link to={adminHost ? "/login" : "/"} className="text-2xl font-black tracking-tight text-[#2f6ff5]">
              {adminHost ? "Template Admin" : "Template"}
            </Link>
            <div className="flex items-center gap-2">
              <Button
                asChild
                variant="ghost"
                className={cn(
                  "px-4 text-sm",
                  activeAction === "login" ? "bg-[#eef4ff] text-[#2f6ff5] hover:bg-[#e1ebff]" : "text-slate-600 hover:text-slate-900",
                )}
              >
                <Link to={adminHost ? "/login" : "/login"}>로그인</Link>
              </Button>
              {!adminHost && (
                <Button
                  asChild
                  size="sm"
                  className={cn(
                    "rounded-full px-4",
                    activeAction === "signup" ? "bg-[#2f6ff5] hover:bg-[#2459cd]" : "bg-slate-200 text-slate-700 hover:bg-slate-300",
                  )}
                >
                  <Link to="/signup">회원가입</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="surface-shell py-10 md:py-14">
        <div className="surface-grid">
          <div className="surface-span-12 flex flex-col items-center">
            <div className="text-center">
              <p className="text-4xl font-black tracking-tight text-[#2f6ff5]">{adminHost ? "Template Admin" : "Template"}</p>
              <p className="mt-2 text-sm text-slate-500">{adminHost ? "운영 콘솔" : "글로벌 중고차 경매 플랫폼"}</p>
            </div>
            <div className={cn("mt-8 w-full", maxWidthClass)}>{children}</div>
            <p className="mt-10 text-xs text-slate-500">{adminHost ? "Template Admin Console · DEV" : "회사소개 · 이용약관 · 개인정보처리방침 · 고객센터"}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
