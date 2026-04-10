import React, { useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, LogOut, Settings, UserCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "../../app/AuthContext";
import { listMySupportNotifications, markAllSupportNotificationsRead } from "../../lib/api";
import type { SupportNotification } from "../../lib/types";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

type SellerMenu = "vehicles" | "settlement" | "settings" | "support";

function toSellerMenuPath(menu: SellerMenu) {
  if (menu === "vehicles") return "/seller/vehicles";
  if (menu === "settlement") return "/seller/settlement";
  if (menu === "settings") return "/settings";
  return "/support/faqs";
}

export function SellerWorkspaceShell({
  activeMenu,
  title,
  description,
  action,
  children,
}: {
  activeMenu: SellerMenu;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { token, user, logout } = useAuth();
  const [openPanel, setOpenPanel] = useState<"none" | "notifications" | "profile">("none");
  const [notifications, setNotifications] = useState<SupportNotification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const unreadCount = useMemo(() => notifications.filter((item) => !item.read_at).length, [notifications]);

  useEffect(() => {
    if (openPanel !== "notifications" || !token) return;
    let mounted = true;
    setLoadingNotifications(true);
    void listMySupportNotifications(token, { offset: 0, limit: 3 })
      .then((rows) => {
        if (!mounted) return;
        setNotifications(rows);
      })
      .catch(() => {
        if (!mounted) return;
        setNotifications([]);
      })
      .finally(() => {
        if (mounted) setLoadingNotifications(false);
      });
    return () => {
      mounted = false;
    };
  }, [openPanel, token]);

  return (
    <div className="min-h-screen bg-[#eef1f8]">
      <header className="border-b border-slate-200 bg-white">
        <div className="surface-shell surface-grid py-4">
          <div className="surface-span-12 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link to="/" className="text-2xl font-black tracking-tight text-[#2f6ff5]">
                Template
              </Link>
              <nav className="hidden items-center gap-4 text-sm md:flex">
                {([
                  { key: "vehicles", label: "내 차량" },
                  { key: "settlement", label: "거래 / 정산" },
                  { key: "settings", label: "설정" },
                  { key: "support", label: "고객센터" },
                ] as const).map((menu) => (
                  <Link
                    key={menu.key}
                    className={cn(
                      "rounded px-2 py-1 font-semibold transition-colors",
                      activeMenu === menu.key ? "text-[#2f6ff5]" : "text-slate-500 hover:text-slate-700",
                    )}
                    to={toSellerMenuPath(menu.key)}
                  >
                    {menu.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="relative flex items-center gap-2">
              <button
                className="relative inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#edf3ff] text-[#2f6ff5]"
                onClick={() => setOpenPanel((prev) => (prev === "notifications" ? "none" : "notifications"))}
                type="button"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500" />}
              </button>
              <button
                className="inline-flex items-center gap-1 rounded-full bg-[#f1f5ff] px-2 py-1 text-sm text-slate-700"
                onClick={() => setOpenPanel((prev) => (prev === "profile" ? "none" : "profile"))}
                type="button"
              >
                <UserCircle2 className="h-4 w-4 text-[#2f6ff5]" />
                <span className="max-w-[88px] truncate">{user?.full_name ?? "사용자"}</span>
              </button>

              {openPanel === "notifications" && (
                <Card className="absolute right-0 top-12 z-20 w-[320px] rounded-xl border-slate-200 bg-white shadow-lg">
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                      <p className="font-semibold text-slate-900">알림</p>
                      <button
                        className="text-sm text-slate-500 hover:text-slate-700"
                        onClick={() => setOpenPanel("none")}
                        type="button"
                      >
                        닫기
                      </button>
                    </div>
                    <div className="space-y-2 px-3 py-3">
                      {loadingNotifications && <p className="px-1 py-2 text-xs text-slate-500">알림을 불러오는 중...</p>}
                      {!loadingNotifications &&
                        notifications.map((item) => (
                          <div key={item.id} className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-semibold text-slate-800">{item.title}</p>
                              {!item.read_at && <span className="mt-1 h-2 w-2 rounded-full bg-rose-500" />}
                            </div>
                            <p className="mt-1 text-xs text-slate-500">{item.message}</p>
                          </div>
                        ))}
                      {!loadingNotifications && notifications.length === 0 && (
                        <p className="px-1 py-2 text-xs text-slate-500">새 알림이 없습니다.</p>
                      )}
                    </div>
                    <div className="border-t border-slate-100 p-3">
                      <Button
                        className="h-9 w-full rounded-md bg-[#2f6ff5] hover:bg-[#2459cd]"
                        disabled={!token || notifications.length === 0}
                        onClick={() => {
                          if (!token) return;
                          void markAllSupportNotificationsRead(token).then(() => {
                            setNotifications((prev) => prev.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() })));
                          });
                        }}
                        type="button"
                      >
                        <CheckCheck className="mr-1 h-4 w-4" />
                        모두 읽음
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {openPanel === "profile" && (
                <Card className="absolute right-0 top-12 z-20 w-[240px] rounded-xl border-slate-200 bg-white shadow-lg">
                  <CardContent className="space-y-2 p-3">
                    <div className="rounded-md bg-slate-50 px-3 py-2">
                      <p className="text-xs text-slate-500">이름</p>
                      <p className="text-sm font-semibold text-slate-900">{user?.full_name ?? "-"}</p>
                      <p className="text-xs text-slate-500">{user?.email ?? ""}</p>
                    </div>
                    <Button asChild className="h-9 w-full justify-start rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200">
                      <Link to="/settings">
                        <Settings className="mr-1 h-4 w-4" />
                        프로필/설정
                      </Link>
                    </Button>
                    <Button
                      className="h-9 w-full justify-start rounded-md bg-rose-50 text-rose-600 hover:bg-rose-100"
                      onClick={logout}
                      type="button"
                    >
                      <LogOut className="mr-1 h-4 w-4" />
                      로그아웃
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="surface-shell py-8">
        <div className="surface-grid">
          <div className="surface-span-12">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h1 className="text-3xl font-black text-slate-900">{title}</h1>
                {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
              </div>
              {action}
            </div>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
