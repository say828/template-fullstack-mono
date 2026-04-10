import React from "react";
import { Clock3, FileCheck2 } from "lucide-react";
import { Link } from "react-router-dom";

import { AuthScaffold } from "../components/auth/AuthScaffold";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

export function DealerSignupCompletePage() {
  return (
    <AuthScaffold activeAction="signup">
      <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
        <CardContent className="space-y-6 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#e8f0ff]">
            <FileCheck2 className="h-7 w-7 text-[#2f6ff5]" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-slate-900">승인 요청이 완료되었습니다.</h1>
            <p className="text-sm text-slate-500">
              딜러 회원가입 정보가 정상적으로 제출되었습니다.
              <br />
              관리자가 서류를 검토한 후 승인 여부를 이메일로 안내드립니다.
            </p>
          </div>

          <p className="text-sm font-semibold text-slate-400">승인 완료 전까지는 로그인 및 서비스 이용이 제한됩니다.</p>

          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-left text-xs text-slate-500">
            <p className="inline-flex items-center gap-1 font-semibold text-slate-600">
              <Clock3 className="h-3.5 w-3.5" />
              승인에는 영업일 기준 1~3일이 소요될 수 있습니다.
            </p>
            <p className="mt-1">서류가 불충분한 경우 이메일로 추가 확인 요청을 드릴 수 있습니다.</p>
          </div>

          <Button asChild className="h-11 w-full rounded-md bg-[#2f6ff5] text-base hover:bg-[#2459cd]">
            <Link to="/">메인 페이지로</Link>
          </Button>
          <Button asChild variant="ghost" className="w-full text-slate-600">
            <Link to="/login?role=dealer">로그인 화면으로 이동</Link>
          </Button>
        </CardContent>
      </Card>
    </AuthScaffold>
  );
}
