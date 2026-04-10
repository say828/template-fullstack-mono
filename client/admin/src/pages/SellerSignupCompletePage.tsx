import { CheckCircle2, Mail } from "lucide-react";
import { Link } from "react-router-dom";

import { AuthScaffold } from "../components/auth/AuthScaffold";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

export function SellerSignupCompletePage() {
  return (
    <AuthScaffold activeAction="signup">
      <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
        <CardContent className="space-y-6 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#e8f0ff]">
            <CheckCircle2 className="h-7 w-7 text-[#2f6ff5]" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-slate-900">판매자 회원가입이 완료되었습니다.</h1>
            <p className="text-sm text-slate-500">
              판매자 계정이 정상적으로 생성되었습니다.
              <br />
              로그인 후 내 차량을 등록하고 딜러의 입찰을 받아보세요.
            </p>
          </div>

          <Button asChild className="h-11 w-full rounded-md bg-[#2f6ff5] text-base hover:bg-[#2459cd]">
            <Link to="/login?role=seller">로그인 하기</Link>
          </Button>

          <Button asChild variant="ghost" className="w-full text-slate-600">
            <Link to="/">메인 페이지로 이동</Link>
          </Button>

          <p className="text-sm text-slate-400">로그인 후 판매자 전용 메인 화면으로 이동합니다.</p>

          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-left text-xs text-slate-500">
            <p className="inline-flex items-center gap-1 font-semibold text-slate-600">
              <Mail className="h-3.5 w-3.5" />
              입력하신 이메일 주소로 환영 메일을 발송했습니다.
            </p>
            <p className="mt-1">거래 관련 중요 안내는 이메일과 사이트 내 알림으로 전달됩니다.</p>
          </div>
        </CardContent>
      </Card>
    </AuthScaffold>
  );
}
