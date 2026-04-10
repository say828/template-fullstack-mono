import { FormEvent, useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "../../app/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { changeMyPassword, getMySettings, requestWithdrawal, updateMyPreferences, updateMyProfile } from "../../lib/api";
import type { UserSettings } from "../../lib/types";

type DealerSettingsTab = "account" | "business" | "notifications" | "security" | "terms";

interface DealerSettingsPageProps {
  tab?: DealerSettingsTab;
}

const tabConfig: Record<DealerSettingsTab, { code: string; title: string; description: string }> = {
  account: {
    code: "DL_030",
    title: "계정정보",
    description: "계정 식별 정보와 기본 연락처를 관리합니다.",
  },
  business: {
    code: "DL_031",
    title: "사업자 서류",
    description: "사업자 및 인증 서류 정보를 확인합니다.",
  },
  notifications: {
    code: "DL_032",
    title: "알림 설정",
    description: "수신 채널/유형을 설정합니다.",
  },
  security: {
    code: "DL_033",
    title: "보안비밀번호",
    description: "비밀번호 변경과 로그인 보안 설정을 관리합니다.",
  },
  terms: {
    code: "DL_034",
    title: "약관 및 회원탈퇴",
    description: "약관 문서 열람 및 탈퇴 요청을 진행합니다.",
  },
};

function tabRoute(tab: DealerSettingsTab) {
  if (tab === "account") return "/dealer/settings/account";
  if (tab === "business") return "/dealer/settings/business-docs";
  if (tab === "notifications") return "/dealer/settings/notifications";
  if (tab === "security") return "/dealer/settings/security";
  return "/dealer/settings/terms";
}

export function DealerSettingsPage({ tab = "account" }: DealerSettingsPageProps) {
  const { token, user, refreshUser } = useAuth();

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("대한민국");
  const [language, setLanguage] = useState("ko");
  const [region, setRegion] = useState("KR");

  const [notifyWeb, setNotifyWeb] = useState(true);
  const [notifySms, setNotifySms] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyBidding, setNotifyBidding] = useState(true);
  const [notifySettlement, setNotifySettlement] = useState(true);
  const [notifySupport, setNotifySupport] = useState(true);
  const [notifyMarketing, setNotifyMarketing] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [nextPasswordConfirm, setNextPasswordConfirm] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      setLoading(true);
      setError(null);

      try {
        const data = await getMySettings(token);
        setSettings(data);
        setPhone(data.phone ?? "");
        setCountry(data.country ?? "대한민국");
        setLanguage(data.language ?? "ko");
        setRegion(data.region ?? "KR");
        setNotifyBidding(data.notify_bidding);
        setNotifySettlement(data.notify_settlement);
        setNotifySupport(data.notify_support);
        setNotifyMarketing(data.notify_marketing);
      } catch (err) {
        setError(err instanceof Error ? err.message : "설정 조회 실패");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [token]);

  const saveAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !settings) return;

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await updateMyProfile(token, {
        full_name: settings.full_name,
        phone,
        country,
      });
      const data = await updateMyPreferences(token, {
        language,
        region,
        notify_bidding: notifyBidding,
        notify_settlement: notifySettlement,
        notify_support: notifySupport,
        notify_marketing: notifyMarketing,
      });
      setSettings(data);
      await refreshUser();
      setMessage("계정 정보가 저장되었습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  const saveNotifications = async () => {
    if (!token || !settings) return;

    if (!notifyWeb && !notifySms && !notifyEmail) {
      setError("최소 1개 이상의 알림 채널을 선택해야 합니다.");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const data = await updateMyPreferences(token, {
        language,
        region,
        notify_bidding: notifyBidding,
        notify_settlement: notifySettlement,
        notify_support: notifySupport,
        notify_marketing: notifyMarketing,
      });
      setSettings(data);
      setMessage("알림 설정이 저장되었습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "알림 설정 저장 실패");
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    if (nextPassword !== nextPasswordConfirm) {
      setError("새 비밀번호와 확인 값이 일치하지 않습니다.");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await changeMyPassword(token, {
        current_password: currentPassword,
        new_password: nextPassword,
      });
      setCurrentPassword("");
      setNextPassword("");
      setNextPasswordConfirm("");
      setMessage("비밀번호가 변경되었습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "비밀번호 변경 실패");
    } finally {
      setSaving(false);
    }
  };

  const withdraw = async () => {
    if (!token) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await requestWithdrawal(token, { reason: "딜러 회원 탈퇴 요청" });
      setMessage("회원 탈퇴 요청이 접수되었습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "회원 탈퇴 요청 실패");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-3xl font-black text-slate-900">설정</h1>
        <p className="text-sm text-slate-500">{tabConfig[tab].code} {tabConfig[tab].description}</p>
      </header>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>요청 실패</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {message && (
        <Alert className="border-emerald-200 bg-emerald-50">
          <AlertTitle className="text-emerald-700">처리 완료</AlertTitle>
          <AlertDescription className="text-emerald-700">{message}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-[180px_1fr]">
        <Card className="h-fit">
          <CardContent className="p-0">
            {(Object.keys(tabConfig) as DealerSettingsTab[]).map((item) => (
              <Link
                key={item}
                to={tabRoute(item)}
                className={`block border-l-2 px-4 py-3 text-sm ${
                  item === tab ? "border-l-[#2f6ff5] bg-[#edf3ff] font-semibold text-[#2f6ff5]" : "border-l-transparent text-slate-600 hover:bg-slate-50"
                }`}
              >
                {tabConfig[item].title}
              </Link>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{tabConfig[tab].title}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading && <p className="text-sm text-slate-500">설정 정보를 불러오는 중...</p>}

              {tab === "account" && (
                <form className="space-y-3" onSubmit={saveAccount}>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label>이름</Label>
                      <Input value={settings?.full_name ?? user?.full_name ?? ""} disabled />
                    </div>
                    <div className="space-y-1">
                      <Label>이메일</Label>
                      <Input value={settings?.email ?? user?.email ?? ""} disabled />
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label>휴대폰</Label>
                      <Input value={phone} onChange={(event) => setPhone(event.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label>국가</Label>
                      <Input value={country} onChange={(event) => setCountry(event.target.value)} />
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label>언어</Label>
                      <select className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" value={language} onChange={(event) => setLanguage(event.target.value)}>
                        <option value="ko">한국어</option>
                        <option value="en">영어</option>
                        <option value="ja">일본어</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label>거래 국가</Label>
                      <select className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" value={region} onChange={(event) => setRegion(event.target.value)}>
                        <option value="KR">대한민국</option>
                        <option value="JP">일본</option>
                        <option value="US">미국</option>
                      </select>
                    </div>
                  </div>

                  <Button className="bg-[#2f6ff5] hover:bg-[#2459cd]" disabled={saving} type="submit">
                    저장
                  </Button>
                </form>
              )}

              {tab === "business" && (
                <div className="space-y-2 text-sm text-slate-700">
                  <p>상호명: Template 트레이드 모터스</p>
                  <p>사업자등록번호: 123-45-67890</p>
                  <p>매매사업증 번호: 11-22-33-44</p>
                  <p>사업장 주소: 서울시 강남구 테헤란로 00</p>
                  <p className="text-xs text-slate-500">사업자 정보와 인증 서류는 관리자 승인 데이터 기준으로 조회 전용입니다.</p>
                </div>
              )}

              {tab === "notifications" && (
                <div className="space-y-4 text-sm">
                  <div className="space-y-2">
                    <p className="font-semibold text-slate-900">알림 채널</p>
                    <label className="flex items-center gap-2">
                      <input checked={notifyWeb} onChange={(event) => setNotifyWeb(event.target.checked)} type="checkbox" /> 웹 알림
                    </label>
                    <label className="flex items-center gap-2">
                      <input checked={notifySms} onChange={(event) => setNotifySms(event.target.checked)} type="checkbox" /> 문자 알림
                    </label>
                    <label className="flex items-center gap-2">
                      <input checked={notifyEmail} onChange={(event) => setNotifyEmail(event.target.checked)} type="checkbox" /> 이메일 알림
                    </label>
                  </div>

                  <div className="space-y-2">
                    <p className="font-semibold text-slate-900">알림 유형</p>
                    <label className="flex items-center gap-2">
                      <input checked={notifyBidding} onChange={(event) => setNotifyBidding(event.target.checked)} type="checkbox" /> 입찰 알림
                    </label>
                    <label className="flex items-center gap-2">
                      <input checked={notifySettlement} onChange={(event) => setNotifySettlement(event.target.checked)} type="checkbox" /> 송금/정산 알림
                    </label>
                    <label className="flex items-center gap-2">
                      <input checked={notifySupport} onChange={(event) => setNotifySupport(event.target.checked)} type="checkbox" /> 검차/감가 협의 알림
                    </label>
                    <label className="flex items-center gap-2">
                      <input checked={notifyMarketing} onChange={(event) => setNotifyMarketing(event.target.checked)} type="checkbox" /> 프로모션/공지
                    </label>
                  </div>

                  <Button className="bg-[#2f6ff5] hover:bg-[#2459cd]" disabled={saving} onClick={() => void saveNotifications()} type="button">
                    저장
                  </Button>
                </div>
              )}

              {tab === "security" && (
                <form className="space-y-3" onSubmit={savePassword}>
                  <div className="space-y-1">
                    <Label>기존 비밀번호</Label>
                    <Input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>새 비밀번호</Label>
                    <Input type="password" value={nextPassword} onChange={(event) => setNextPassword(event.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>새 비밀번호 확인</Label>
                    <Input type="password" value={nextPasswordConfirm} onChange={(event) => setNextPasswordConfirm(event.target.value)} />
                  </div>
                  <Button className="bg-[#2f6ff5] hover:bg-[#2459cd]" disabled={saving} type="submit">
                    비밀번호 변경
                  </Button>
                </form>
              )}

              {tab === "terms" && (
                <div className="space-y-4 text-sm">
                  <div className="space-y-2">
                    {["Template 서비스 이용약관", "개인정보 처리방침", "정산 및 수수료 정책", "위치기반 서비스 이용약관"].map((term) => (
                      <div key={term} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                        <span>{term}</span>
                        <button className="inline-flex items-center gap-1 text-xs font-semibold text-[#2f6ff5]" type="button">
                          열기 <ExternalLink className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
                    <p className="font-semibold text-rose-600">딜러 회원 탈퇴</p>
                    <p className="mt-1 text-xs text-rose-500">진행 중/미정산 거래가 있으면 탈퇴가 제한될 수 있습니다.</p>
                    <Button className="mt-3" disabled={saving} onClick={() => void withdraw()} type="button" variant="outline">
                      회원 탈퇴
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
