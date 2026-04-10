import { useEffect, useState } from "react";

import { useAuth } from "../app/AuthContext";
import { AsyncState } from "../components/common/AsyncState";
import { PageIntro } from "../components/common/PageIntro";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { listMySupportNotifications, markAllSupportNotificationsRead, markSupportNotificationRead } from "../lib/api";
import type { SupportNotification } from "../lib/types";

export function SupportNotificationsPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<SupportNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listMySupportNotifications(token, { unread_only: unreadOnly, limit: 100 });
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알림 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [token, unreadOnly]);

  const markRead = async (id: string) => {
    if (!token) return;
    setProcessingId(id);
    setError(null);
    try {
      await markSupportNotificationRead(token, id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "읽음 처리 실패");
    } finally {
      setProcessingId(null);
    }
  };

  const markAll = async () => {
    if (!token) return;
    setProcessingId("all");
    setError(null);
    try {
      await markAllSupportNotificationsRead(token);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "전체 읽음 처리 실패");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <section className="space-y-4">
      <PageIntro
        title="알림"
        description="입찰/정산/고객지원 알림을 확인합니다."
        actions={
          <>
            <Button type="button" variant={unreadOnly ? "default" : "outline"} size="sm" onClick={() => setUnreadOnly((v) => !v)}>
              {unreadOnly ? "미읽음만" : "전체"}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => void markAll()} disabled={processingId === "all"}>
              전체 읽음
            </Button>
          </>
        }
      />

      <AsyncState loading={loading} error={error} empty={!loading && !error && rows.length === 0} emptyText="알림이 없습니다." />

      <div className="grid gap-3">
        {rows.map((row) => (
          <Card key={row.id} className={!row.read_at ? "border-primary/50" : undefined}>
            <CardHeader className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">{row.title}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{row.notification_type}</Badge>
                  {row.read_at ? <Badge variant="secondary">읽음</Badge> : <Badge>미읽음</Badge>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">{row.message}</p>
              <p className="text-xs text-muted-foreground">수신: {new Date(row.created_at).toLocaleString()}</p>
              {!row.read_at && (
                <Button type="button" size="sm" variant="outline" onClick={() => void markRead(row.id)} disabled={processingId === row.id}>
                  읽음 처리
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
