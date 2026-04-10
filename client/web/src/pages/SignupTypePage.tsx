import React from "react";
import { CarFront, Check, UserCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "../components/ui/button";
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
    <div className="min-h-screen bg-[#eef0f6]">
      <header className="border-b border-[#dde1ea] bg-white shadow-[0_1px_4px_rgba(15,23,42,0.08)]">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-5 py-[18px]">
          <Link to="/" className="text-[26px] font-black leading-none tracking-[-0.05em] text-[#2f67e8]">
            Template
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <Link className="px-2 py-1 text-[14px] font-medium text-[#5c6270]" to="/login?role=seller">
              로그인
            </Link>
            <Link className="rounded-full bg-[#2f67e8] px-4 py-2 text-[13px] font-semibold text-white" to="/signup">
              회원가입
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1440px] px-5 py-[42px]">
        <div className="mx-auto max-w-[760px] text-center">
          <p className="text-[42px] font-black leading-none tracking-[-0.06em] text-[#2f67e8]">Template</p>
          <p className="mt-3 text-[13px] font-medium text-[#7a8190]">글로벌 중고차 경매 플랫폼</p>

          <div className="mt-9">
            <h1 className="text-[26px] font-black tracking-[-0.03em] text-[#111827]">회원가입 유형 선택</h1>
            <p className="mt-3 text-[13px] font-medium text-[#7a8190]">Template를 어떤 역할로 이용하실 건가요?</p>
          </div>

          <div className="mt-9 grid gap-5 md:grid-cols-2 md:gap-6">
            {signupTypes.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  data-signup-type={item.dark ? "dealer" : "seller"}
                  className="rounded-[30px] border border-[#edf0f5] bg-white px-6 py-6 text-left shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
                >
                  <div className={cn("inline-flex h-12 w-12 items-center justify-center rounded-[16px]", item.dark ? "bg-[#1f2b45]" : "bg-[#d9e8ff]")}>
                    <Icon className={cn("h-6 w-6", item.dark ? "text-[#8cb0ff]" : "text-[#2f67e8]")} />
                  </div>

                  <div className="mt-5">
                    <h2 className="text-[20px] font-black tracking-[-0.03em] text-[#111827]">{item.title}</h2>
                    <p className="mt-5 text-[15px] leading-7 text-[#6f7684]">{item.description}</p>
                  </div>

                  <ul className="mt-5 space-y-3.5">
                    {item.points.map((point) => (
                      <li key={point} className="flex items-start gap-3 text-[15px] font-medium leading-7 text-[#5f6674]">
                        <Check className="mt-[1px] h-4 w-4 shrink-0 text-[#2f67e8]" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 min-h-[40px]">
                    {item.note ? (
                      <p className="rounded-[6px] bg-[#eef0f4] px-3 py-2 text-[11px] font-medium text-[#69707d]">{item.note}</p>
                    ) : null}
                  </div>

                  <Button
                    asChild
                    className={cn(
                      "mt-5 h-[66px] w-full rounded-[12px] text-[16px] font-semibold",
                      item.dark ? "bg-[#202b42] text-white hover:bg-[#162034]" : "bg-[#2f67e8] text-white hover:bg-[#2556c8]",
                    )}
                  >
                    <Link to={item.to}>{item.cta}</Link>
                  </Button>
                </article>
              );
            })}
          </div>

          <div className="mt-11 text-[14px] font-medium text-[#7a8190]">
            이미 계정이 있으신가요?{" "}
            <Link className="font-semibold text-[#2f67e8] underline-offset-2 hover:text-[#2556c8] hover:underline" to="/login?role=seller">
              로그인하기
            </Link>
          </div>

          <p className="mt-12 text-[12px] text-[#808694]">회사소개 · 이용약관 · 개인정보처리방침 · 고객센터</p>
        </div>
      </main>
    </div>
  );
}
