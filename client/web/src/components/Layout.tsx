import { Bell, LogOut, UserCircle2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../app/AuthContext";
import { listMySupportNotifications, markAllSupportNotificationsRead } from "../lib/api";
import type { SupportNotification } from "../lib/types";
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
  const { user, token, logout } = useAuth();
  const { pathname } = useLocation();
  const sellerMode = user?.role === "SELLER";
  const dealerMode = user?.role === "DEALER";
  const roleMode = sellerMode || dealerMode;
  const displayName = user?.full_name?.trim() || "사용자";
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<SupportNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [markingAllNotifications, setMarkingAllNotifications] = useState(false);

  const refreshNotifications = async () => {
    if (!roleMode || !token) {
      setNotifications([]);
      setNotificationsLoading(false);
      setNotificationsError(null);
      return;
    }

    setNotificationsLoading(true);
    setNotificationsError(null);
    try {
      const rows = await listMySupportNotifications(token, { unread_only: true, limit: 20 });
      setNotifications(rows);
    } catch (error) {
      setNotifications([]);
      setNotificationsError(error instanceof Error ? error.message : "알림 조회 실패");
    } finally {
      setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    if (!roleMode || !token) {
      setNotifications([]);
      setNotificationsLoading(false);
      setNotificationsError(null);
      setNotificationsModalOpen(false);
      return;
    }

    let active = true;
    setNotificationsLoading(true);
    setNotificationsError(null);
    void listMySupportNotifications(token, { unread_only: true, limit: 20 })
      .then((rows) => {
        if (active) {
          setNotifications(rows);
        }
      })
      .catch((error) => {
        if (active) {
          setNotifications([]);
          setNotificationsError(error instanceof Error ? error.message : "알림 조회 실패");
        }
      })
      .finally(() => {
        if (active) {
          setNotificationsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [roleMode, token, pathname]);

  const unreadCount = useMemo(() => notifications.filter((item) => !item.read_at).length, [notifications]);
  const sellerPanelNotifications = useMemo(() => notifications.slice(0, 3), [notifications]);

  const openNotificationsModal = () => {
    setNotificationsModalOpen(true);
    void refreshNotifications();
  };

  const openProfileModal = () => {
    setProfileModalOpen(true);
  };

  const closeNotificationsModal = () => {
    setNotificationsModalOpen(false);
  };

  const closeProfileModal = () => {
    setProfileModalOpen(false);
  };

  const toggleNotificationsModal = () => {
    if (notificationsModalOpen) {
      closeNotificationsModal();
      return;
    }
    openNotificationsModal();
  };

  useEffect(() => {
    if (!notificationsModalOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeNotificationsModal();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [notificationsModalOpen]);

  useEffect(() => {
    if (!profileModalOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeProfileModal();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [profileModalOpen]);

  const isPublicAuthRoute =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/forgot-password" ||
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

            <div className={cn("flex items-center gap-2", roleMode && "min-w-[180px] justify-end")}>
              {user ? (
                <>
                  {sellerMode ? (
                    <>
                      <button
                        aria-label="알림"
                        className="relative inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#edf3ff] text-[#2f6ff5] transition-colors hover:bg-[#dfe9ff]"
                        onClick={toggleNotificationsModal}
                        type="button"
                      >
                        <Bell className="h-4 w-4" />
                        {unreadCount > 0 && (
                          <>
                            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500" />
                            <span className="sr-only">미읽음 알림 {unreadCount}건</span>
                          </>
                        )}
                      </button>
                      <button
                        aria-label="프로필"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#f1f5ff] text-[#6c95ef] transition-colors hover:bg-[#e4edff]"
                        onClick={openProfileModal}
                        type="button"
                      >
                        <UserCircle2 className="h-4 w-4" />
                      </button>
                      <button
                        className="hidden max-w-[120px] truncate text-sm font-medium text-slate-600 md:inline"
                        onClick={openProfileModal}
                        type="button"
                      >
                        {displayName} 님
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="hidden text-sm text-muted-foreground md:inline">{displayName}</span>
                      <Button
                        aria-label="알림"
                        className="relative h-9 w-9 rounded-full"
                        onClick={toggleNotificationsModal}
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        <Bell className="h-4 w-4" />
                        {unreadCount > 0 && (
                          <>
                            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-500" />
                            <span className="sr-only">미읽음 알림 {unreadCount}건</span>
                          </>
                        )}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={openProfileModal}>
                        <UserCircle2 className="mr-1 h-4 w-4" />
                        프로필
                      </Button>
                      <Button size="sm" variant="outline" onClick={logout}>
                        로그아웃
                      </Button>
                    </>
                  )}
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

      <main className={cn("surface-shell py-8 pb-20 md:pb-8", notificationsModalOpen && "pointer-events-none select-none")}>
        <div className="surface-grid">
          <div className="surface-span-12">
            <Outlet />
          </div>
        </div>
      </main>

      {notificationsModalOpen ? (
        <>
          <button
            type="button"
            aria-label="알림 닫기"
            className="fixed inset-0 z-40 bg-black/10"
            onClick={closeNotificationsModal}
          />
          <div className="pointer-events-none fixed inset-0 z-50">
            <div className="pointer-events-auto absolute right-4 top-[44px] flex h-[min(720px,calc(100vh-60px))] w-[calc(100vw-32px)] max-w-[378px] flex-col overflow-hidden rounded-[26px] bg-white shadow-[0_22px_48px_rgba(15,23,42,0.18)] ring-1 ring-slate-100 md:right-[272px] md:top-[44px]">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-2.5">
                <div className="w-5" />
                <h2 className="text-xl font-bold tracking-[-0.02em] text-slate-900">알림</h2>
                <button
                  aria-label="알림 닫기"
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                  onClick={closeNotificationsModal}
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
                {notificationsLoading && <p className="text-sm text-slate-500">알림을 불러오는 중...</p>}
                {!notificationsLoading && notificationsError && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{notificationsError}</p>}
                {!notificationsLoading &&
                  !notificationsError &&
                  sellerPanelNotifications.map((item) => (
                    <div key={item.id} className="rounded-[20px] bg-[#fbf8f2] px-5 py-4 shadow-[0_4px_16px_rgba(15,23,42,0.04)]">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#eef4ff] text-[#2f6ff5]">
                          <Bell className="h-3.5 w-3.5 fill-current" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[15px] font-bold leading-6 text-slate-800">{item.title}</p>
                            {!item.read_at && <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#ff6b6b]" />}
                          </div>
                          <p className="mt-1 text-[12px] leading-5 text-slate-400">{item.message}</p>
                          <p className="mt-2 text-[12px] font-medium text-slate-400">{new Date(item.created_at).toLocaleString("ko-KR")}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                {!notificationsLoading && !notificationsError && sellerPanelNotifications.length === 0 && (
                  <div className="rounded-[20px] bg-[#fbf8f2] px-5 py-10 text-center text-sm text-slate-400">새 알림이 없습니다.</div>
                )}
              </div>
              <div className="border-t border-slate-100 px-6 py-2.5">
                <button
                  className="inline-flex w-full items-center justify-center gap-2 text-sm font-semibold text-[#5f8ff7] disabled:opacity-50"
                  disabled={markingAllNotifications || sellerPanelNotifications.length === 0 || notificationsLoading}
                  onClick={() => {
                    if (!token) return;
                    setMarkingAllNotifications(true);
                    void markAllSupportNotificationsRead(token)
                      .then(() => {
                        setNotifications((prev) => prev.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() })));
                      })
                      .finally(() => setMarkingAllNotifications(false));
                  }}
                  type="button"
                >
                  모두 읽음
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {profileModalOpen ? (
        <>
          <button
            type="button"
            aria-label="프로필 닫기"
            className="fixed inset-0 z-40 bg-black/10"
            onClick={closeProfileModal}
          />
          <div className="pointer-events-none fixed inset-0 z-50">
            <div className="pointer-events-auto absolute right-4 top-[44px] w-[calc(100vw-32px)] max-w-[210px] overflow-hidden rounded-[26px] bg-white shadow-[0_22px_48px_rgba(15,23,42,0.18)] ring-1 ring-slate-100 md:right-[272px] md:top-[44px]">
              <div className="px-2 py-[6px]">
                <div className="flex items-center justify-end px-2 pt-1">
                  <button
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                    onClick={closeProfileModal}
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="rounded-2xl px-4 py-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-slate-800">{displayName}</p>
                    <p className="min-w-0 truncate text-[11px] text-slate-400">{user?.email}</p>
                  </div>
                </div>
                <button
                  className="flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
                  onClick={logout}
                  type="button"
                >
                  <LogOut className="h-4 w-4" />
                  로그아웃
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}

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
