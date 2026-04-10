import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../../app/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { listMySupportNotifications, markAllSupportNotificationsRead, markSupportNotificationRead } from "../../lib/api";
import type { SupportNotification } from "../../lib/types";

export function DealerNotificationsPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<SupportNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const unreadCount = useMemo(() => rows.filter((row) => !row.read_at).length, [rows]);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listMySupportNotifications(token, { limit: 100 });
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알림 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [token]);

  const markRead = async (notificationId: string) => {
    if (!token) return;
    setActing(notificationId);
    setError(null);
    try {
      await markSupportNotificationRead(token, notificationId);
      setRows((prev) =>
        prev.map((row) =>
          row.id === notificationId
            ? {
                ...row,
                read_at: row.read_at ?? new Date().toISOString(),
              }
            : row,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "읽음 처리 실패");
    } finally {
      setActing(null);
    }
  };

  const markAll = async () => {
    if (!token) return;
    setActing("all");
    setError(null);
    try {
      await markAllSupportNotificationsRead(token);
      const now = new Date().toISOString();
      setRows((prev) => prev.map((row) => ({ ...row, read_at: row.read_at ?? now })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "일괄 읽음 처리 실패");
    } finally {
      setActing(null);
    }
  };

  return (
    <section className="mx-auto max-w-5xl space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-slate-900">알림</h1>
          <p className="text-sm text-slate-500">DL_001 딜러 이벤트 알림 리스트</p>
        </div>
        <Button
          className="bg-[#2f6ff5] hover:bg-[#2459cd]"
          disabled={unreadCount === 0 || acting === "all"}
          onClick={() => void markAll()}
          type="button"
        >
          모두 읽음
        </Button>
      </header>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>요청 실패</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && <p className="text-sm text-slate-500">알림을 불러오는 중...</p>}

      <div className="grid gap-3">
        {rows.map((row) => (
          <Card key={row.id} className={row.read_at ? "border-slate-200" : "border-rose-200 bg-rose-50/30"}>
            <CardHeader className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-base text-slate-900">{row.title}</CardTitle>
                {!row.read_at && <span className="mt-1 h-2.5 w-2.5 rounded-full bg-rose-500" />}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm leading-relaxed text-slate-700">{row.message}</p>
              <p className="text-xs text-slate-400">{new Date(row.created_at).toLocaleString()}</p>
              <div className="flex flex-wrap gap-2">
                {!row.read_at && (
                  <Button
                    disabled={acting === row.id}
                    onClick={() => void markRead(row.id)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    읽음 처리
                  </Button>
                )}
                <Button asChild size="sm" type="button" variant="secondary">
                  <Link to="/dealer/transactions">관련 화면 이동</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!loading && rows.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-sm text-slate-500">수신된 알림이 없습니다.</CardContent>
        </Card>
      )}
    </section>
  );
}
