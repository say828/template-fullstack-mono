import { LogOut, UserCircle2 } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../app/AuthContext";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";

const sellerMenus = [
  { label: "내 차량", to: "/seller/vehicles" },
  { label: "거래 / 정산", to: "/seller/settlement" },
  { label: "설정", to: "/settings" },
  { label: "고객센터", to: "/support/faqs" },
] as const;

const dealerMenus = [
  { label: "매물보기", to: "/dealer/market" },
  { label: "나의 입찰", to: "/dealer/bids" },
  { label: "거래·결제", to: "/dealer/transactions" },
  { label: "설정", to: "/dealer/settings/account" },
  { label: "고객센터", to: "/dealer/support/faqs" },
] as const;

function isSellerMenuActive(pathname: string, to: string) {
  if (to === "/seller/vehicles") return pathname.startsWith("/seller/vehicles");
  if (to === "/seller/settlement") return pathname.startsWith("/seller/settlement");
  if (to === "/settings") return pathname.startsWith("/settings");
  if (to === "/support/faqs") return pathname.startsWith("/support");
  return pathname === to;
}

function isDealerMenuActive(pathname: string, to: string) {
  if (to === "/dealer/market") return pathname.startsWith("/dealer/market");
  if (to === "/dealer/bids") return pathname.startsWith("/dealer/bids");
  if (to === "/dealer/transactions") return pathname.startsWith("/dealer/transactions");
  if (to === "/dealer/settings/account") return pathname.startsWith("/dealer/settings");
  if (to === "/dealer/support/faqs") return pathname.startsWith("/dealer/support");
  return pathname === to;
}

export function Layout() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const sellerMode = user?.role === "SELLER";
  const dealerMode = user?.role === "DEALER";
  const roleMode = sellerMode || dealerMode;
  const profilePath = sellerMode ? "/settings?tab=account" : dealerMode ? "/dealer/profile" : "/dashboard";

  const isPublicAuthRoute =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/signup" ||
    pathname === "/signup/seller" ||
    pathname === "/signup/seller/complete" ||
    pathname === "/signup/dealer" ||
    pathname === "/signup/dealer/complete";

  if (isPublicAuthRoute) {
    return <Outlet />;
  }

  return (
    <div className={cn("min-h-screen", roleMode ? "bg-[#eff1f6]" : "bg-[radial-gradient(ellipse_at_top,_#f8fbff_10%,_#e8edf5_70%)]")}>
      <header className={cn("border-b", roleMode ? "border-slate-200 bg-white" : "border-border bg-white/95 backdrop-blur")}>
        <div className="surface-shell surface-grid py-3">
          <div className="surface-span-12 relative flex items-center justify-between gap-6">
            <Link to="/" className={cn("font-black tracking-wide", roleMode ? "text-3xl leading-none text-[#2f6ff5]" : "text-lg text-primary")}>
              Template
            </Link>

            <nav className={cn("hidden items-center md:flex", roleMode ? "absolute left-1/2 -translate-x-1/2 gap-8" : "gap-2")}>
              {sellerMode && (
                <>
                  {sellerMenus.map((menu) => (
                    <Link
                      key={menu.to}
                      className={cn(
                        "text-sm font-medium transition-colors",
                        isSellerMenuActive(pathname, menu.to) ? "text-[#2f6ff5]" : "text-slate-500 hover:text-slate-700",
                      )}
                      to={menu.to}
                    >
                      {menu.label}
                    </Link>
                  ))}
                </>
              )}

              {dealerMode && (
                <>
                  {dealerMenus.map((menu) => (
                    <Link
                      key={menu.to}
                      className={cn(
                        "text-sm font-medium transition-colors",
                        isDealerMenuActive(pathname, menu.to) ? "text-[#2f6ff5]" : "text-slate-500 hover:text-slate-700",
                      )}
                      to={menu.to}
                    >
                      {menu.label}
                    </Link>
                  ))}
                </>
              )}

              {!roleMode && (
                <>
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/">랜딩</Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm">
                  </Button>
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/support/notices">공지사항</Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/support/faqs">FAQ</Link>
                  </Button>
                  {!user && (
                    <Button asChild variant="ghost" size="sm">
                      <Link to="/signup">회원가입</Link>
                    </Button>
                  )}
                  {user?.role === "ADMIN" && (
                    <Button asChild variant="ghost" size="sm">
                      <Link to="/admin/dealers">딜러 승인</Link>
                    </Button>
                  )}
                  {user?.role === "ADMIN" && (
                    <Button asChild variant="ghost" size="sm">
                      <Link to="/admin/settlements">정산관리</Link>
                    </Button>
                  )}
                  {user && (
                    <Button asChild variant="ghost" size="sm">
                      <Link to="/dashboard">대시보드</Link>
                    </Button>
                  )}
                </>
              )}
            </nav>

            <div className={cn("flex items-center gap-2", roleMode && "min-w-[140px] justify-end")}>
              {user ? (
                <>
                  <span className="hidden text-sm text-muted-foreground md:inline">{user.full_name}</span>
                  <Button asChild size="sm" variant="ghost">
                    <Link to={profilePath}>
                      <UserCircle2 className="mr-1 h-4 w-4" />
                      프로필
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" onClick={logout}>
                    로그아웃
                  </Button>
                </>
              ) : (
                <Button asChild size="sm">
                  <Link to="/login">로그인</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="surface-shell py-8 pb-20 md:pb-8">
        <div className="surface-grid">
          <div className="surface-span-12">
            <Outlet />
          </div>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-white px-2 py-2 md:hidden">
        <div className="flex items-center justify-around">
          {sellerMode ? (
            <>
              <Link className="text-xs font-medium text-muted-foreground" to="/seller/vehicles">
                내 차량
              </Link>
              <Link className="text-xs font-medium text-muted-foreground" to="/seller/settlement">
                거래/정산
              </Link>
              <Link className="text-xs font-medium text-muted-foreground" to="/settings">
                설정
              </Link>
              <Link className="text-xs font-medium text-muted-foreground" to="/support/faqs">
                고객센터
              </Link>
            </>
          ) : dealerMode ? (
            <>
              <Link className="text-xs font-medium text-muted-foreground" to="/dealer/market">
                매물보기
              </Link>
              <Link className="text-xs font-medium text-muted-foreground" to="/dealer/bids">
                나의입찰
              </Link>
              <Link className="text-xs font-medium text-muted-foreground" to="/dealer/transactions">
                거래결제
              </Link>
              <Link className="text-xs font-medium text-muted-foreground" to="/dealer/settings/account">
                설정
              </Link>
              <Link className="text-xs font-medium text-muted-foreground" to="/dealer/support/faqs">
                고객센터
              </Link>
            </>
          ) : (
            <>
              <Link className="text-xs font-medium text-muted-foreground" to="/">
                랜딩
              </Link>
              <Link className="text-xs font-medium text-muted-foreground" to="/support/notices">
                공지
              </Link>
              {!user && (
                <Link className="text-xs font-medium text-muted-foreground" to="/signup">
                  회원가입
                </Link>
              )}
              {user && (
                <Link className="text-xs font-medium text-muted-foreground" to="/dashboard">
                  대시보드
                </Link>
              )}
              {user?.role === "SELLER" && (
                <Link className="text-xs font-medium text-muted-foreground" to="/seller/vehicles">
                  내 차량
                </Link>
              )}
              {user?.role === "DEALER" && (
                <Link className="text-xs font-medium text-muted-foreground" to="/dealer/market">
                  매물보기
                </Link>
              )}
            </>
          )}
        </div>
      </nav>
    </div>
  );
}
