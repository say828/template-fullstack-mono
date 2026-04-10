import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../app/AuthContext";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";

export function DealerProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <section className="mx-auto max-w-3xl space-y-4">
      <header>
        <h1 className="text-3xl font-black text-slate-900">프로필</h1>
        <p className="text-sm text-slate-500">DL_002 계정 식별 정보 및 로그아웃</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">계정 정보</CardTitle>
          <CardDescription>현재 로그인된 딜러 계정 정보를 확인합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-slate-700">이름: <span className="font-semibold text-slate-900">{user?.full_name ?? "-"}</span></p>
          <p className="text-sm text-slate-700">이메일: <span className="font-semibold text-slate-900">{user?.email ?? "-"}</span></p>
          <p className="text-sm text-slate-500">권한 주체 확인용 정보이며 이 화면에서 수정할 수 없습니다.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">로그아웃</CardTitle>
          <CardDescription>클릭 즉시 현재 딜러 세션을 종료합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => {
              logout();
              navigate("/", { replace: true });
            }}
            type="button"
            variant="outline"
          >
            <LogOut className="mr-1 h-4 w-4" />
            로그아웃
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
