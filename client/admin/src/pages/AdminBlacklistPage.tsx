import { FormEvent, useEffect, useMemo, useState } from "react";

import { useAuth } from "../app/AuthContext";
import { PageIntro } from "../components/common/PageIntro";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { createAdminBlacklistEntry, listAdminBlacklistEntries, releaseAdminBlacklistEntry } from "../lib/api";
import type { AdminBlacklistEntry } from "../lib/types";

export function AdminBlacklistPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<AdminBlacklistEntry[]>([]);
  const [keyword, setKeyword] = useState("");
  const [userId, setUserId] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!token) return;
    try {
      setRows(await listAdminBlacklistEntries(token, { active_only: false, limit: 100 }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "블랙리스트 조회 실패");
    }
  };

  useEffect(() => {
    void load();
  }, [token]);

  const visibleRows = useMemo(() => {
    const needle = keyword.trim().toLowerCase();
    return rows.filter((row) => !needle || [row.full_name ?? "", row.email ?? "", row.reason, row.user_id].join(" ").toLowerCase().includes(needle));
  }, [keyword, rows]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    try {
      await createAdminBlacklistEntry(token, { user_id: userId, reason });
      setUserId("");
      setReason("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "블랙리스트 등록 실패");
    }
  };

  const release = async (entry: AdminBlacklistEntry) => {
    if (!token) return;
    try {
      await releaseAdminBlacklistEntry(token, entry.user_id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "블랙리스트 해제 실패");
    }
  };

  return (
    <section className="space-y-4">
      <PageIntro title="블랙리스트" description="ADM_041 사용자 차단 등록과 해제를 운영합니다." />
      {error && <Alert variant="destructive"><AlertTitle>처리 실패</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader><CardTitle className="text-base">차단 목록</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="이름/이메일/사유 검색" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
            <div className="grid gap-3">
              {visibleRows.map((row) => (
                <Card key={row.entry_id}>
                  <CardContent className="space-y-2 pt-4 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">{row.full_name || row.user_id}</p>
                      <div className="flex gap-2">
                        <Badge variant="outline">{row.role || "UNKNOWN"}</Badge>
                        <Badge variant={row.released_at ? "secondary" : "destructive"}>{row.released_at ? "해제" : "차단 중"}</Badge>
                      </div>
                    </div>
                    <p>{row.email || "-"}</p>
                    <p>{row.reason}</p>
                    <p className="text-xs text-muted-foreground">등록 {new Date(row.created_at).toLocaleString()}</p>
                    {!row.released_at && <Button size="sm" variant="outline" onClick={() => void release(row)}>해제</Button>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">신규 차단 등록</CardTitle></CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={submit}>
              <Input placeholder="사용자 ID" value={userId} onChange={(event) => setUserId(event.target.value)} />
              <Textarea placeholder="차단 사유" value={reason} onChange={(event) => setReason(event.target.value)} />
              <Button type="submit" disabled={!userId.trim() || !reason.trim()}>차단 등록</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
