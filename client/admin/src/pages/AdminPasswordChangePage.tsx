import { FormEvent, useState } from "react";

import { useAuth } from "../app/AuthContext";
import { PageIntro } from "../components/common/PageIntro";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { changeMyPassword } from "../lib/api";

export function AdminPasswordChangePage() {
  const { token } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    if (nextPassword !== confirmPassword) {
      setError("새 비밀번호와 확인 값이 일치하지 않습니다.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await changeMyPassword(token, { current_password: currentPassword, new_password: nextPassword });
      setCurrentPassword("");
      setNextPassword("");
      setConfirmPassword("");
      setSuccess("비밀번호가 변경되었습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "비밀번호 변경 실패");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-4">
      <PageIntro title="비밀번호변경" description="관리자 계정 비밀번호를 변경합니다." />
      {error && <Alert variant="destructive"><AlertTitle>변경 실패</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      {success && <Alert><AlertTitle>변경 완료</AlertTitle><AlertDescription>{success}</AlertDescription></Alert>}
      <Card className="max-w-xl">
        <CardHeader><CardTitle className="text-base">비밀번호 변경</CardTitle></CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={submit}>
            <Input type="password" placeholder="현재 비밀번호" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
            <Input type="password" placeholder="새 비밀번호" value={nextPassword} onChange={(event) => setNextPassword(event.target.value)} />
            <Input type="password" placeholder="새 비밀번호 확인" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
            <Button type="submit" disabled={submitting || !currentPassword || !nextPassword || !confirmPassword}>
              {submitting ? "변경 중..." : "비밀번호 변경"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
