import { Bell, ChevronDown, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../app/AuthContext";
import { listMySupportNotifications, markAllSupportNotificationsRead, markSupportNotificationRead } from "../lib/api";
import type { SupportNotification } from "../lib/types";
import { cn } from "../lib/utils";
import { AdminNotificationsDrawer } from "./AdminNotificationsDrawer";
import { Button } from "./ui/button";

type AdminMenuItem = {
  label: string;
  to: string;
  children?: { label: string; to: string }[];
};

const adminMenuTree: AdminMenuItem[] = [
  { label: "대시보드", to: "/admin/dashboard" },
  { label: "거래관리", to: "/admin/trades" },
  {
    label: "검차 · 감가",
    to: "/admin/inspections",
    children: [
      { label: "검차 운영", to: "/admin/inspections" },
      { label: "감가 협의", to: "/admin/depreciations" },
    ],
  },
  { label: "인도 관리", to: "/admin/deliveries" },
  {
    label: "정산 관리",
    to: "/admin/settlements",
    children: [
      { label: "딜러 송금 관리", to: "/admin/remittances" },
      { label: "판매자 정산 관리", to: "/admin/settlements" },
    ],
  },
  {
    label: "사용자 관리",
    to: "/admin/sellers",
    children: [
      { label: "판매자 관리", to: "/admin/sellers" },
      { label: "딜러 관리", to: "/admin/dealers" },
      { label: "블랙리스트", to: "/admin/blacklist" },
    ],
  },
  { label: "리포트", to: "/admin/reports" },
  {
    label: "콘텐츠 관리",
    to: "/admin/support/faqs",
    children: [
      { label: "FAQ 관리", to: "/admin/support/faqs" },
      { label: "공지사항 관리", to: "/admin/support/notices" },
      { label: "정책 문서 관리", to: "/admin/policies" },
      { label: "문의 관리", to: "/admin/support/inquiries" },
    ],
  },
  {
    label: "시스템 설정",
    to: "/admin/accounts",
    children: [
      { label: "계정 관리", to: "/admin/accounts" },
      { label: "권한 관리", to: "/admin/permissions" },
      { label: "감사 로그", to: "/admin/audit/logs" },
      { label: "버전", to: "/admin/version" },
    ],
  },
];

function isMenuActive(pathname: string, to: string) {
  if (to === "/admin/dashboard") return pathname.startsWith("/admin/dashboard");
  if (to === "/admin/trades") return pathname.startsWith("/admin/trades");
  if (to === "/admin/trades/summary") return pathname.startsWith("/admin/trades/summary");
  if (to === "/admin/inspections") return pathname.startsWith("/admin/inspections");
  if (to === "/admin/depreciations") return pathname.startsWith("/admin/depreciations");
  if (to === "/admin/deliveries") return pathname.startsWith("/admin/deliveries");
  if (to === "/admin/remittances") return pathname.startsWith("/admin/remittances");
  if (to === "/admin/settlements") return pathname.startsWith("/admin/settlements");
  if (to === "/admin/sellers") return pathname.startsWith("/admin/sellers");
  if (to === "/admin/dealers") return pathname.startsWith("/admin/dealers");
  if (to === "/admin/support/faqs") return pathname.startsWith("/admin/support/faqs");
  if (to === "/admin/support/notices") return pathname.startsWith("/admin/support/notices");
  if (to === "/admin/support/inquiries") return pathname.startsWith("/admin/support/inquiries");
  if (to === "/admin/reports") return pathname.startsWith("/admin/reports");
  if (to === "/admin/policies") return pathname.startsWith("/admin/policies");
  if (to === "/admin/version") return pathname.startsWith("/admin/version");
  if (to === "/admin/blacklist") return pathname.startsWith("/admin/blacklist");
  if (to === "/admin/accounts") return pathname.startsWith("/admin/accounts");
  if (to === "/admin/permissions") return pathname.startsWith("/admin/permissions");
  if (to === "/admin/audit/logs") return pathname.startsWith("/admin/audit/logs");
  return pathname === to;
}

export function AdminLayout() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  const [notificationsDrawerOpen, setNotificationsDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState<SupportNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const searchParams = new URLSearchParams(search);
  const activePanel = searchParams.get("panel");
  const shouldOpenNotificationsPanel = activePanel === "notifications";

  const isPublicAuthRoute = pathname === "/login" || pathname === "/forgot-password" || pathname === "/reset-password";
  const unreadCount = notifications.reduce((count, row) => count + (row.read_at ? 0 : 1), 0);

  useEffect(() => {
    if (isPublicAuthRoute) {
      return;
    }

    let cancelled = false;

    const loadNotifications = async () => {
      if (!token) return;
      setNotificationsLoading(true);
      setNotificationsError(null);
      try {
        const rows = await listMySupportNotifications(token, { limit: 100 });
        if (!cancelled) {
          setNotifications(rows);
        }
      } catch (error) {
        if (!cancelled) {
          setNotificationsError(error instanceof Error ? error.message : "알림 조회 실패");
        }
      } finally {
        if (!cancelled) {
          setNotificationsLoading(false);
        }
      }
    };

    void loadNotifications();
    return () => {
      cancelled = true;
    };
  }, [isPublicAuthRoute, token]);

  useEffect(() => {
    setNotificationsDrawerOpen(shouldOpenNotificationsPanel);
  }, [pathname, shouldOpenNotificationsPanel]);

  useEffect(() => {
    if (!notificationsDrawerOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setNotificationsDrawerOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [notificationsDrawerOpen]);

  const refreshNotifications = async () => {
    if (!token) return;
    setNotificationsLoading(true);
    setNotificationsError(null);
    try {
      const rows = await listMySupportNotifications(token, { limit: 100 });
      setNotifications(rows);
    } catch (error) {
      setNotificationsError(error instanceof Error ? error.message : "알림 조회 실패");
    } finally {
      setNotificationsLoading(false);
    }
  };

  const closeNotificationsDrawer = () => {
    setNotificationsDrawerOpen(false);
    if (shouldOpenNotificationsPanel) {
      const next = new URLSearchParams(searchParams);
      next.delete("panel");
      navigate(
        {
          pathname,
          search: next.toString() ? `?${next.toString()}` : "",
        },
        { replace: true },
      );
    }
  };

  const toggleNotificationsDrawer = async () => {
    if (notificationsDrawerOpen) {
      closeNotificationsDrawer();
      return;
    }
    const nextOpen = true;
    setNotificationsDrawerOpen(nextOpen);
    if (nextOpen && token) {
      await refreshNotifications();
    }
  };

  const markNotificationRead = async (notificationId: string) => {
    if (!token) return;
    await markSupportNotificationRead(token, notificationId);
    await refreshNotifications();
  };

  const markAllNotificationsRead = async () => {
    if (!token) return;
    await markAllSupportNotificationsRead(token);
    await refreshNotifications();
  };

  if (isPublicAuthRoute) {
    return <Outlet />;
  }

  const userInitial = (user?.full_name || "홍").slice(0, 1);
  const showProfileMenu = false;
  const expandAllGroups = false;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#eef1f7] text-slate-900">
      <div className="mx-auto flex min-h-screen w-full min-w-[1280px] max-w-[1440px]">
        <aside className="hidden shrink-0 border-r border-[#d8dce5] bg-[#f8f8f9] lg:flex lg:w-[196px] lg:flex-col">
          <div className="border-b border-[#d8dce5] px-5 py-7">
            <Link
              to="/admin/trades"
              className="text-[18px] font-black tracking-[-0.05em] text-[#1f4ea1]"
            >
              Template
            </Link>
          </div>

          <nav className="flex-1 px-0 py-3">
            {adminMenuTree.map((item) => {
              const hasChildren = Boolean(item.children?.length);
              const hasActive =
                (notificationsDrawerOpen && item.to === "/admin/dashboard") ||
                isMenuActive(pathname, item.to) ||
                Boolean(item.children?.some((child) => isMenuActive(pathname, child.to)));
              const showChildren = hasChildren && (expandAllGroups || hasActive);
              return (
                <div key={item.to} className="border-b border-[#d8dce5] py-1 last:border-b-0">
                  <Link
                    to={item.to}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 text-[15px] font-semibold transition-colors",
                      hasActive ? "text-[#1f4ea1]" : "text-[#444d5e] hover:text-[#1f2937]",
                    )}
                  >
                    <span>{item.label}</span>
                    {hasChildren ? <ChevronDown className="h-4 w-4 text-[#9aa2af]" /> : null}
                  </Link>
                  {showChildren ? (
                    <div className="space-y-0.5 px-3 pb-2">
                      {(item.children ?? []).map((child) => (
                        <Link
                          key={child.to}
                          to={child.to}
                          className={cn(
                            "block rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
                            isMenuActive(pathname, child.to)
                              ? "bg-[#eef3ff] text-[#2459cd]"
                              : "text-[#5b6474] hover:bg-white hover:text-[#1f2937]",
                          )}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <header
            className="border-b border-[#d8dce5] bg-white"
          >
            <div className="flex items-center justify-between gap-4 px-5 py-4 lg:px-6">
              <div className="flex items-center gap-3 lg:hidden">
                <Link to="/admin/trades" className="text-[18px] font-black tracking-[-0.04em] text-[#1f4ea1]">
                  Template
                </Link>
              </div>

              <div className="hidden lg:block" />

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="알림 열기"
                  className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#dde1ea] bg-white text-[#2150a3]"
                  onClick={() => void toggleNotificationsDrawer()}
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 ? <span className="absolute right-[1px] top-[1px] h-[4px] w-[4px] rounded-full bg-[#ff7a3d]" /> : null}
                </button>
                <div className="relative">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#dde1ea] bg-white px-2 py-1">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#4d494a] text-[11px] font-bold text-white">
                      {userInitial}
                    </span>
                    <span className="pr-2 text-xs font-semibold text-[#4b5565]">{user?.full_name || "홍길동 님"}</span>
                  </div>
                  {showProfileMenu ? (
                    <div className="absolute right-0 top-[41px] w-[214px] rounded-[18px] border border-[#e4e6eb] bg-white p-3 shadow-[0_14px_32px_rgba(0,0,0,0.12)]">
                      <button type="button" className="absolute right-4 top-3 text-[20px] leading-none text-[#72767e]">
                        ×
                      </button>
                      <div className="rounded-[10px] bg-[#eceef2] px-4 py-3 text-left">
                        <p className="text-[12px] font-bold text-[#343842]">홍길동</p>
                        <p className="mt-1 text-[10px] text-[#969ca8]">qwer12@gmail.com</p>
                      </div>
                      <div className="mt-3 space-y-1 text-[12px] font-semibold text-[#454a53]">
                        <div className="rounded-[10px] px-4 py-2.5">비밀번호 변경</div>
                        <div className="rounded-[10px] px-4 py-2.5">로그아웃</div>
                      </div>
                    </div>
                  ) : null}
                </div>
                <Button
                  size="icon"
                  type="button"
                  variant="outline"
                  className="h-8 w-8 rounded-full border-[#dde1ea] bg-white text-[#4b5565]"
                  onClick={logout}
                >
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </header>

          <main className="px-6 py-5">
            <Outlet />
          </main>

          {notificationsDrawerOpen ? (
            <>
              <button
                type="button"
                aria-label="알림 닫기"
                className="fixed inset-0 z-40 bg-transparent"
                onClick={closeNotificationsDrawer}
              />
              <div className="pointer-events-none fixed inset-0 z-50 flex items-start justify-end px-[18px] pt-[24px]">
                <AdminNotificationsDrawer
                  className="pointer-events-auto"
                  rows={notifications.map((row) => ({
                    id: row.id,
                    title: row.title,
                    message: row.message,
                    createdAt: new Date(row.created_at).toLocaleString("ko-KR"),
                    unread: !row.read_at,
                  }))}
                  loading={notificationsLoading}
                  error={notificationsError}
                  onClose={closeNotificationsDrawer}
                  onMarkAll={() => void markAllNotificationsRead()}
                  onRowClick={(id) => void markNotificationRead(id)}
                />
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
