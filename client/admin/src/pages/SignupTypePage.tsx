import { CarFront, Check, UserCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

import { AuthScaffold } from "../components/auth/AuthScaffold";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { cn } from "../lib/utils";

const signupTypes = [
  {
    title: "판매자로 가입하기",
    description: "내 차량을 등록하고 국내·해외 딜러의 입찰을 받을 수 있습니다.",
    points: ["차량번호 자동 조회", "입찰가 비교 / 감가 협의 / 정산 지원", "검차+수출 연동 서비스 제공"],
    to: "/signup/seller",
    cta: "판매자로 가입하기",
    icon: CarFront,
    dark: false,
  },
  {
    title: "딜러로 가입하기",
    description: "전 세계 매물에 실시간으로 입찰하고 거래할 수 있습니다.",
    points: ["국내·국제 매물 입찰 가능", "감가 입력 / 수출 프로세스 관리", "해외송금 / 서류 지원"],
    to: "/signup/dealer",
    cta: "딜러로 가입하기",
    icon: UserCircle2,
    dark: true,
    note: "딜러 계정은 관리자 승인 후 활성화됩니다.",
  },
];

export function SignupTypePage() {
  return (
    <AuthScaffold activeAction="signup" maxWidthClass="max-w-4xl">
      <div className="space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-black text-slate-900">회원가입 유형 선택</h1>
          <p className="text-sm text-slate-500 md:text-base">Template를 어떤 역할로 이용하실 건가요?</p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {signupTypes.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.title}
                className={cn("rounded-2xl border-slate-200 bg-white shadow-sm", item.dark && "border-[#0e1c3c] bg-[#0e1c3c] text-white")}
              >
                <CardContent className="space-y-5 p-6">
                  <div className={cn("inline-flex h-10 w-10 items-center justify-center rounded-full", item.dark ? "bg-[#1c315d]" : "bg-[#e8f0ff]")}>
                    <Icon className={cn("h-5 w-5", item.dark ? "text-[#8cb0ff]" : "text-[#2f6ff5]")} />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black">{item.title}</h2>
                    <p className={cn("text-sm", item.dark ? "text-slate-200" : "text-slate-600")}>{item.description}</p>
                  </div>
                  <ul className="space-y-2">
                    {item.points.map((point) => (
                      <li key={point} className={cn("flex items-start gap-2 text-sm", item.dark ? "text-slate-100" : "text-slate-700")}>
                        <Check className={cn("mt-0.5 h-4 w-4", item.dark ? "text-[#7ba0ff]" : "text-[#2f6ff5]")} />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                  {item.note && <p className="rounded bg-white/10 px-3 py-2 text-xs text-slate-200">{item.note}</p>}
                  <Button
                    asChild
                    className={cn("h-11 w-full rounded-md", item.dark ? "bg-[#223a73] text-white hover:bg-[#2a4688]" : "bg-[#2f6ff5] hover:bg-[#2459cd]")}
                  >
                    <Link to={item.to}>{item.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center text-sm">
          <span className="text-slate-500">이미 계정이 있으신가요? </span>
          <Link className="font-semibold text-[#2f6ff5] hover:text-[#2459cd]" to="/login">
            로그인하기
          </Link>
        </div>
      </div>
    </AuthScaffold>
  );
}
