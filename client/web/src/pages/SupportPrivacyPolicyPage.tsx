import React from "react";
import { Link } from "react-router-dom";

import { Card, CardContent } from "../components/ui/card";
import { cn } from "../lib/utils";

const supportMenus = [
  { key: "faqs", label: "자주 묻는 질문", to: "/support/faqs" },
  { key: "notices", label: "공지사항", to: "/support/notices" },
  { key: "inquiry", label: "1:1 문의", to: "/support/inquiries" },
  { key: "privacy", label: "이용약관 및 개인정보처리방침", to: "/support/privacy-policy" },
] as const;

export function SupportPrivacyPolicyPage() {
  return (
    <section className="mx-auto max-w-5xl">
      <div className="grid gap-4 md:grid-cols-[146px_1fr]">
        <Card className="h-fit border-slate-200 shadow-none">
          <CardContent className="p-0">
            <div className="border-b border-slate-100 px-4 py-2 text-xs text-slate-400">고객센터</div>
            {supportMenus.map((menu) => (
              <Link
                className={cn(
                  "flex items-center border-l-2 px-4 py-2.5 text-sm",
                  menu.key === "privacy"
                    ? "border-l-[#2f6ff5] bg-[#edf3ff] font-semibold text-[#2f6ff5]"
                    : "border-l-transparent text-slate-600 hover:bg-slate-50",
                )}
                key={menu.key}
                to={menu.to}
              >
                {menu.label}
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-none">
          <CardContent className="space-y-8 p-5">
            <div className="text-center">
              <h1 className="text-4xl font-extrabold text-slate-900">이용약관 및 개인정보처리방침</h1>
              <p className="mt-2 text-sm text-slate-500">팔카 서비스 이용약관 및 개인정보처리방침 안내</p>
            </div>

            <div className="mx-auto max-w-[680px] space-y-10">
              <article className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900">이용약관</h2>

                <div className="space-y-3 text-sm leading-6 text-slate-700">
                  <h3 className="font-semibold text-slate-800">제1조 (목적)</h3>
                  <p>
                    본 약관은 팔카(이하 "회사")가 제공하는 중고차 거래 플랫폼 서비스(이하 "서비스")의 이용과 관련하여, 회사와 이용자 간의 권리·의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
                  </p>

                  <h3 className="font-semibold text-slate-800">제2조 (용어의 정의)</h3>
                  <ol className="list-decimal space-y-1 pl-5">
                    <li>"서비스"란 회사가 제공하는 중고차 입찰, 거래, 정산 등 일체의 온라인 서비스를 의미합니다.</li>
                    <li>"이용자"란 본 약관에 따라 서비스를 이용하는 판매자 및 딜러를 의미합니다.</li>
                    <li>"판매자"란 서비스를 통해 차량을 등록하고 판매하는 회원을 의미합니다.</li>
                    <li>"딜러"란 서비스를 통해 차량에 입찰하고 매입하는 회원을 의미합니다.</li>
                  </ol>

                  <h3 className="font-semibold text-slate-800">제3조 (약관의 효력 및 변경)</h3>
                  <ol className="list-decimal space-y-1 pl-5">
                    <li>본 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.</li>
                    <li>회사는 관련 법령에 위배되지 않는 범위에서 본 약관을 변경할 수 있으며, 변경된 약관은 공지 후 효력이 발생합니다.</li>
                  </ol>

                  <h3 className="font-semibold text-slate-800">제4조 (서비스의 제공 및 변경)</h3>
                  <ol className="list-decimal space-y-1 pl-5">
                    <li>회사는 이용자에게 중고차 거래 관련 서비스를 제공합니다.</li>
                    <li>회사는 서비스의 내용을 변경할 경우, 변경 사유 및 내용을 사전에 공지합니다.</li>
                  </ol>

                  <h3 className="font-semibold text-slate-800">제5조 (서비스 이용 제한)</h3>
                  <p>
                    회사는 이용자가 본 약관의 의무를 위반하거나 서비스의 정상적인 운영을 방해한 경우, 서비스 이용을 제한하거나 정지할 수 있습니다.
                  </p>

                  <h3 className="font-semibold text-slate-800">제6조 (면책 조항)</h3>
                  <ol className="list-decimal space-y-1 pl-5">
                    <li>회사는 천재지변 또는 이에 준하는 불가항력으로 서비스를 제공할 수 없는 경우, 이에 대한 책임이 면제됩니다.</li>
                    <li>회사는 이용자의 귀책사유로 인한 서비스 이용 장애에 대하여 책임을 지지 않습니다.</li>
                  </ol>
                </div>
              </article>

              <hr className="border-slate-200" />

              <article className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900">개인정보처리방침</h2>

                <div className="space-y-3 text-sm leading-6 text-slate-700">
                  <h3 className="font-semibold text-slate-800">제1조 (개인정보의 수집 항목 및 수집 방법)</h3>
                  <p>회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다.</p>
                  <ul className="list-disc space-y-1 pl-5">
                    <li>필수 항목: 이름, 이메일 주소, 연락처, 사업자등록번호(딜러)</li>
                    <li>선택 항목: 프로필 사진, 차량 관련 첨부 자료</li>
                    <li>자동 수집 항목: 접속 IP, 접속 일시, 브라우저 정보</li>
                  </ul>

                  <h3 className="font-semibold text-slate-800">제2조 (개인정보의 수집 및 이용 목적)</h3>
                  <p>수집된 개인정보는 다음 목적으로 이용됩니다.</p>
                  <ul className="list-disc space-y-1 pl-5">
                    <li>회원 가입 및 본인 확인</li>
                    <li>서비스 제공 및 거래 처리</li>
                    <li>고객 문의 응대 및 민원 처리</li>
                    <li>서비스 개선 및 통계 분석</li>
                  </ul>

                  <h3 className="font-semibold text-slate-800">제3조 (개인정보의 보유 및 이용 기간)</h3>
                  <p>
                    회사는 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 관련 법령에 의해 보존이 필요한 경우 해당 기간 동안 보관합니다.
                  </p>
                  <ul className="list-disc space-y-1 pl-5">
                    <li>계약 또는 청약철회 등에 관한 기록: 5년</li>
                    <li>대금결제 및 재화 등의 공급에 관한 기록: 5년</li>
                    <li>소비자의 불만 또는 분쟁 처리에 관한 기록: 3년</li>
                    <li>접속에 관한 기록: 3개월</li>
                  </ul>

                  <h3 className="font-semibold text-slate-800">제4조 (개인정보의 제3자 제공)</h3>
                  <p>
                    회사는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 다만, 법령에 의해 요구되는 경우는 예외로 합니다.
                  </p>

                  <h3 className="font-semibold text-slate-800">제5조 (개인정보의 파기 절차 및 방법)</h3>
                  <p>
                    회사는 개인정보의 수집 및 이용 목적이 달성된 후, 해당 개인정보를 재생이 불가능한 방법으로 파기합니다.
                  </p>

                  <h3 className="font-semibold text-slate-800">제6조 (이용자의 권리와 행사 방법)</h3>
                  <p>이용자는 언제든지 다음의 권리를 행사할 수 있습니다.</p>
                  <ul className="list-disc space-y-1 pl-5">
                    <li>개인정보 열람 요구</li>
                    <li>개인정보 정정·삭제 요구</li>
                    <li>개인정보 처리 정지 요구</li>
                  </ul>

                  <h3 className="font-semibold text-slate-800">제7조 (개인정보 보호책임자)</h3>
                  <p>
                    회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 이용자의 개인정보 관련 불만 처리 및 피해 구제를 위해 개인정보 보호책임자를 지정하고 있습니다.
                  </p>
                </div>
              </article>

              <div className="rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-500">
                <p>본 약관 및 개인정보처리방침은 2024년 1월 1일부터 시행됩니다.</p>
                <p className="mt-1">문의사항은 고객센터(1:1 문의)를 통해 접수해 주시기 바랍니다.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
