import {
  Bell,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  ExternalLink,
  FileImage,
  Globe2,
  Landmark,
  Mail,
  Trash2,
  UserCircle2,
  Wallet,
  XCircle,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { useAuth } from "../app/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import {
  changeMyPassword,
  createSettlementAccount,
  getMySettings,
  listSettlementAccounts,
  requestWithdrawal,
  updateMyPreferences,
  updateMyProfile,
  updateSettlementAccount,
} from "../lib/api";
import type { SettlementAccount, UserSettings } from "../lib/types";
import { cn } from "../lib/utils";

type SettingsTab = "account" | "settlement" | "notifications" | "security" | "locale" | "terms";

type WithdrawalModal = "none" | "confirm" | "done" | "blocked";

const settingsMenus: Array<{ key: SettingsTab; label: string }> = [
  { key: "account", label: "계정 정보" },
  { key: "settlement", label: "정산 계좌" },
  { key: "notifications", label: "알림 설정" },
  { key: "security", label: "보안 / 비밀번호" },
  { key: "locale", label: "언어 및 지역" },
  { key: "terms", label: "약관 및 회원탈퇴" },
];

const bankOptions = ["국민은행", "신한은행", "하나은행", "우리은행", "기업은행", "농협은행"];
const localeCountryCodes = new Set(["KR", "JP", "US", "HK"]);

function isSettingsTab(value: string | null): value is SettingsTab {
  return settingsMenus.some((menu) => menu.key === value);
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (next: boolean) => void }) {
  return (
    <button
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
        checked ? "bg-[#2f6ff5]" : "bg-slate-300",
      )}
      onClick={() => onChange(!checked)}
      type="button"
    >
      <span
        className={cn(
          "inline-block h-5 w-5 rounded-full bg-white transition-transform",
          checked ? "translate-x-[22px]" : "translate-x-[2px]",
        )}
      />
    </button>
  );
}

export function SettingsPage() {
  const { token, refreshUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [accounts, setAccounts] = useState<SettlementAccount[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("대한민국");
  const [regionPrimary, setRegionPrimary] = useState("");
  const [regionSecondary, setRegionSecondary] = useState("");

  const [prefLanguage, setPrefLanguage] = useState("ko");
  const [prefTradeCountry, setPrefTradeCountry] = useState("KR");
  const [prefTimezone, setPrefTimezone] = useState("Asia/Seoul (GMT+09:00)");

  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySms, setNotifySms] = useState(true);
  const [notifyWeb, setNotifyWeb] = useState(true);
  const [prefNotifyBidding, setPrefNotifyBidding] = useState(true);
  const [prefNotifyInspection, setPrefNotifyInspection] = useState(true);
  const [prefNotifySettlement, setPrefNotifySettlement] = useState(true);
  const [prefNotifyMarketing, setPrefNotifyMarketing] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newDeviceAlert, setNewDeviceAlert] = useState(true);
  const [autoLogout, setAutoLogout] = useState("1시간");
  const [passwordDoneOpen, setPasswordDoneOpen] = useState(false);

  const [accountHolder, setAccountHolder] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankbookFileName, setBankbookFileName] = useState("");
  const [idCardFileName, setIdCardFileName] = useState("");

  const [withdrawalModal, setWithdrawalModal] = useState<WithdrawalModal>("none");

  const tabParam = searchParams.get("tab");
  const activeTab: SettingsTab = isSettingsTab(tabParam) ? tabParam : "account";
  const settlementMode = searchParams.get("mode") === "edit" ? "edit" : "view";

  const primaryAccount = useMemo(() => {
    return accounts.find((account) => account.is_primary) ?? accounts[0] ?? null;
  }, [accounts]);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const profile = await getMySettings(token);
      setSettings(profile);
      try {
        const rows = await listSettlementAccounts(token);
        setAccounts(rows);
      } catch {
        setAccounts([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "설정 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [token]);

  useEffect(() => {
    if (!settings) return;

    setPhone(settings.phone || "");
    setCountry(settings.country || "대한민국");

    const accountRegionStorageKey = `template.accountRegion.${settings.id}`;
    const cachedRegion = typeof window !== "undefined" ? window.localStorage.getItem(accountRegionStorageKey) : null;
    if (cachedRegion) {
      const parts = cachedRegion.split(" ").filter(Boolean);
      setRegionPrimary(parts[0] || "서울특별시");
      setRegionSecondary(parts[1] || "강남구");
    } else {
      setRegionPrimary("서울특별시");
      setRegionSecondary("강남구");
    }

    setPrefLanguage(settings.language || "ko");
    setPrefTradeCountry(localeCountryCodes.has(settings.region) ? settings.region : "KR");

    setPrefNotifyBidding(settings.notify_bidding);
    setPrefNotifyInspection(settings.notify_support);
    setPrefNotifySettlement(settings.notify_settlement);
    setPrefNotifyMarketing(settings.notify_marketing);
  }, [settings]);

  useEffect(() => {
    if (settlementMode !== "edit") return;

    if (primaryAccount) {
      setAccountHolder(primaryAccount.account_holder);
      setBankName(primaryAccount.bank_name);
      setAccountNumber(primaryAccount.account_number.replace(/\D/g, ""));
      setBankbookFileName("기존 통장사본.pdf");
      setIdCardFileName("기존 신분증사본.pdf");
      return;
    }

    setAccountHolder("");
    setBankName("");
    setAccountNumber("");
    setBankbookFileName("");
    setIdCardFileName("");
  }, [primaryAccount?.id, settlementMode]);

  const setTab = (tab: SettingsTab) => {
    setError(null);
    setMessage(null);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", tab);
      next.delete("mode");
      return next;
    });
  };

  const goSettlementEdit = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", "settlement");
      next.set("mode", "edit");
      return next;
    });
  };

  const goSettlementView = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", "settlement");
      next.delete("mode");
      return next;
    });
  };

  const saveAccountInfo = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !settings) return;

    if (!phone.trim() || !country.trim() || !regionPrimary.trim() || !regionSecondary.trim()) {
      setError("휴대폰 번호, 국가, 거주 지역을 모두 입력해 주세요.");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await updateMyProfile(token, {
        full_name: settings.full_name,
        phone: phone.trim(),
        country: country.trim(),
      });

      if (typeof window !== "undefined") {
        window.localStorage.setItem(`template.accountRegion.${settings.id}`, `${regionPrimary.trim()} ${regionSecondary.trim()}`);
      }

      await load();
      await refreshUser();
      setMessage("계정 정보가 저장되었습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "계정 정보 저장 실패");
    } finally {
      setSaving(false);
    }
  };

  const saveSettlementAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    const sanitizedNumber = accountNumber.replace(/\D/g, "");

    if (!accountHolder.trim() || !bankName.trim() || !sanitizedNumber) {
      setError("예금주명, 은행, 계좌번호를 모두 입력해 주세요.");
      return;
    }

    if (!bankbookFileName || !idCardFileName) {
      setError("통장 사본과 신분증 사본 파일을 모두 첨부해 주세요.");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      if (primaryAccount) {
        await updateSettlementAccount(token, primaryAccount.id, {
          bank_name: bankName,
          account_number: sanitizedNumber,
          account_holder: accountHolder,
          is_primary: true,
        });
      } else {
        await createSettlementAccount(token, {
          bank_name: bankName,
          account_number: sanitizedNumber,
          account_holder: accountHolder,
          is_primary: true,
        });
      }

      const rows = await listSettlementAccounts(token);
      setAccounts(rows);
      goSettlementView();
      setMessage("정산 계좌 정보가 저장되었습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "정산 계좌 저장 실패");
    } finally {
      setSaving(false);
    }
  };

  const saveNotificationSettings = async () => {
    if (!token) return;

    if (!notifyEmail && !notifySms && !notifyWeb) {
      setError("최소 1개 이상의 알림 채널을 선택해야 합니다.");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const data = await updateMyPreferences(token, {
        language: prefLanguage,
        region: prefTradeCountry,
        notify_bidding: prefNotifyBidding,
        notify_settlement: prefNotifySettlement,
        notify_marketing: prefNotifyMarketing,
        notify_support: prefNotifyInspection,
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

    const complexity = [/[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((rule) => rule.test(newPassword)).length;

    if (newPassword.length < 10 || newPassword.length > 16 || complexity < 2) {
      setError("새 비밀번호는 10~16자, 영문/숫자/특수문자 중 2가지 이상을 포함해야 합니다.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("새 비밀번호와 확인 비밀번호가 일치하지 않습니다.");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await changeMyPassword(token, {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordDoneOpen(true);
      setMessage("비밀번호가 변경되었습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "비밀번호 변경 실패");
    } finally {
      setSaving(false);
    }
  };

  const saveLocale = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const data = await updateMyPreferences(token, {
        language: prefLanguage,
        region: prefTradeCountry,
        notify_bidding: prefNotifyBidding,
        notify_settlement: prefNotifySettlement,
        notify_marketing: prefNotifyMarketing,
        notify_support: prefNotifyInspection,
      });

      setSettings(data);
      setMessage("언어 및 지역 설정이 저장되었습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "언어 및 지역 저장 실패");
    } finally {
      setSaving(false);
    }
  };

  const runWithdrawal = async () => {
    if (!token || !settings) return;

    if (settings.account_status !== "ACTIVE") {
      setWithdrawalModal("blocked");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await requestWithdrawal(token, { reason: "회원탈퇴 요청" });
      setWithdrawalModal("done");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "회원탈퇴 요청 실패");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !settings) {
    return (
      <section className="mx-auto max-w-5xl">
        <Card>
          <CardContent className="pt-6 text-sm text-slate-500">설정 정보를 불러오는 중...</CardContent>
        </Card>
      </section>
    );
  }

  if (!settings) {
    return (
      <section className="mx-auto max-w-5xl space-y-3">
        <Card>
          <CardContent className="pt-6 text-sm">설정 정보를 찾을 수 없습니다.</CardContent>
        </Card>
        {error && (
          <Alert variant="destructive">
            <AlertTitle>조회 실패</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl space-y-4">
      {message && (
        <Alert className="border-emerald-200 bg-emerald-50">
          <AlertTitle className="text-emerald-700">처리 완료</AlertTitle>
          <AlertDescription className="text-emerald-700">{message}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertTitle>요청 실패</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-[148px_1fr]">
        <Card className="h-fit border-slate-200 shadow-none">
          <CardContent className="p-0">
            <div className="border-b border-slate-100 px-4 py-2 text-xs text-slate-400">설정</div>
            {settingsMenus.map((menu) => (
              <button
                key={menu.key}
                className={cn(
                  "flex w-full items-center border-l-2 px-4 py-2.5 text-left text-sm",
                  activeTab === menu.key
                    ? "border-l-[#2f6ff5] bg-[#edf3ff] font-semibold text-[#2f6ff5]"
                    : "border-l-transparent text-slate-600 hover:bg-slate-50",
                )}
                onClick={() => setTab(menu.key)}
                type="button"
              >
                {menu.label}
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {activeTab === "account" && (
            <>
              <header>
                <h1 className="text-4xl font-extrabold text-slate-900">계정 정보</h1>
                <p className="mt-1 text-sm text-slate-500">판매자 계정의 기본 정보를 확인하고 수정할 수 있습니다.</p>
              </header>

              <Card className="border-slate-200 shadow-none">
                <CardContent className="space-y-4 p-4">
                  <div className="flex items-center gap-4 rounded-lg bg-slate-50 px-4 py-3">
                    <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-slate-500">
                      <UserCircle2 className="h-8 w-8" />
                    </span>
                    <div>
                      <p className="text-lg font-bold text-slate-900">{settings.full_name}</p>
                      <p className="text-sm text-slate-500">{settings.email}</p>
                      <p className="mt-1 text-xs text-slate-400">이메일과 이름은 가입 시 설정된 정보이며 변경할 수 없습니다.</p>
                    </div>
                  </div>

                  <form className="space-y-4" onSubmit={saveAccountInfo}>
                    <p className="text-sm font-semibold text-slate-900">연락처 정보</p>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs text-slate-500">휴대폰 번호</label>
                        <Input onChange={(event) => setPhone(event.target.value)} placeholder="010-2345-6789" value={phone} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-slate-500">국가</label>
                        <select
                          className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                          onChange={(event) => setCountry(event.target.value)}
                          value={country}
                        >
                          <option value="대한민국">대한민국</option>
                          <option value="일본">일본</option>
                          <option value="미국">미국</option>
                          <option value="홍콩">홍콩</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs text-slate-500">거주 지역</label>
                        <select
                          className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                          onChange={(event) => setRegionPrimary(event.target.value)}
                          value={regionPrimary}
                        >
                          <option value="서울특별시">서울특별시</option>
                          <option value="부산광역시">부산광역시</option>
                          <option value="인천광역시">인천광역시</option>
                          <option value="경기도">경기도</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-slate-500">&nbsp;</label>
                        <select
                          className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                          onChange={(event) => setRegionSecondary(event.target.value)}
                          value={regionSecondary}
                        >
                          <option value="강남구">강남구</option>
                          <option value="서초구">서초구</option>
                          <option value="송파구">송파구</option>
                          <option value="마포구">마포구</option>
                        </select>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400">계정 정보는 Template 서비스 이용 및 정산, 서류 발행에 사용됩니다.</p>

                    <div className="flex justify-end">
                      <Button className="bg-[#2f6ff5] px-8 hover:bg-[#2459cd]" disabled={saving} type="submit">
                        저장
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === "settlement" && settlementMode === "view" && primaryAccount && (
            <>
              <header>
                <h1 className="text-4xl font-extrabold text-slate-900">정산 계좌 설정</h1>
                <p className="mt-1 text-sm text-slate-500">거래 정산 시 판매자님께 입금될 계좌 정보를 등록·관리합니다.</p>
              </header>

              <Card className="border-slate-200 shadow-none">
                <CardContent className="space-y-4 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-slate-900">등록된 정산 계좌</p>
                    <button className="text-sm font-semibold text-[#2f6ff5]" onClick={goSettlementEdit} type="button">
                      계좌 변경하기
                    </button>
                  </div>

                  <div className="grid gap-3 rounded-lg bg-slate-50 p-4 md:grid-cols-[72px_1fr_1fr]">
                    <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-slate-500">
                      <Landmark className="h-7 w-7" />
                    </span>
                    <div className="space-y-2 text-sm">
                      <p className="text-slate-400">은행명</p>
                      <p className="font-bold text-slate-900">{primaryAccount.bank_name}</p>
                      <p className="text-slate-400">계좌번호</p>
                      <p className="font-bold text-slate-900">{primaryAccount.account_number}</p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p className="text-slate-400">예금주</p>
                      <p className="font-bold text-slate-900">{primaryAccount.account_holder}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === "settlement" && settlementMode === "view" && !primaryAccount && (
            <>
              <header>
                <h1 className="text-4xl font-extrabold text-slate-900">정산 계좌 설정</h1>
                <p className="mt-1 text-sm text-slate-500">거래 정산 시 판매자님께 입금될 계좌 정보를 등록·관리합니다.</p>
              </header>

              <Card className="border-slate-200 shadow-none">
                <CardContent className="space-y-6 p-6 text-center">
                  <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#deebff] text-[#2f6ff5]">
                    <Wallet className="h-7 w-7" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-3xl font-extrabold text-slate-900">아직 정산 계좌가 등록되지 않았습니다.</p>
                    <p className="text-sm text-slate-500">
                      거래가 완료되어도 정산 계좌가 등록되지 않으면
                      <br />
                      정산 금액을 입금할 수 없습니다.
                    </p>
                  </div>
                  <Button className="bg-[#2f6ff5] hover:bg-[#2459cd]" onClick={goSettlementEdit} type="button">
                    정산 계좌 등록하러 가기
                  </Button>
                  <p className="text-xs text-slate-400">정산 계좌 등록 후, 거래가 완료되면 정산 내역을 확인할 수 있습니다.</p>
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === "settlement" && settlementMode === "edit" && (
            <>
              <header>
                <h1 className="text-4xl font-extrabold text-slate-900">정산 계좌 설정</h1>
                <p className="mt-1 text-sm text-slate-500">거래 정산 시 판매자님께 입금될 계좌 정보를 등록·관리합니다.</p>
              </header>

              <Card className="border-slate-200 shadow-none">
                <CardContent className="space-y-4 p-4">
                  <p className="text-lg font-bold text-slate-900">정산 계좌 정보</p>
                  <form className="space-y-4" onSubmit={saveSettlementAccount}>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs text-slate-500">예금주명 (통장 사본과 일치)</label>
                        <Input onChange={(event) => setAccountHolder(event.target.value)} placeholder="이름을 입력해주세요" value={accountHolder} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-slate-500">은행</label>
                        <div className="relative">
                          <select
                            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                            onChange={(event) => setBankName(event.target.value)}
                            value={bankName}
                          >
                            <option value="">은행 선택</option>
                            {bankOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-slate-500">계좌번호</label>
                      <Input
                        onChange={(event) => setAccountNumber(event.target.value.replace(/[^0-9]/g, ""))}
                        placeholder="- 제외하고 입력해주세요"
                        value={accountNumber}
                      />
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <p className="text-xs text-slate-500">통장 사본</p>
                        <label className="flex h-40 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
                          <FileImage className="mb-2 h-6 w-6 text-slate-400" />
                          <span className="font-semibold text-[#2f6ff5]">파일 업로드</span>
                          <span className="text-xs text-slate-400">PNG, JPG, PDF up to 5MB</span>
                          <input
                            className="hidden"
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (!file) return;
                              setBankbookFileName(file.name);
                            }}
                            type="file"
                          />
                        </label>
                        {bankbookFileName && <p className="text-xs font-medium text-slate-600">첨부됨: {bankbookFileName}</p>}
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs text-slate-500">신분증 사본</p>
                        <label className="flex h-40 cursor-pointer flex-col justify-center rounded-lg border border-slate-200 bg-white px-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#2f6ff5] text-[#2f6ff5]">+</span>
                              <div>
                                <p className="text-sm font-semibold text-slate-800">{idCardFileName || "파일 선택"}</p>
                                <p className="text-xs text-slate-400">업로드 완료</p>
                              </div>
                            </div>
                            {idCardFileName && (
                              <button
                                className="text-slate-400"
                                onClick={(event) => {
                                  event.preventDefault();
                                  setIdCardFileName("");
                                }}
                                type="button"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          <div className="mt-3 h-1 rounded bg-[#2f6ff5]" />
                          <input
                            className="hidden"
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (!file) return;
                              setIdCardFileName(file.name);
                            }}
                            type="file"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button disabled={saving} onClick={goSettlementView} type="button" variant="outline">
                        취소
                      </Button>
                      <Button className="bg-[#2f6ff5] px-8 hover:bg-[#2459cd]" disabled={saving} type="submit">
                        저장
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === "notifications" && (
            <>
              <header>
                <h1 className="text-4xl font-extrabold text-slate-900">알림 설정</h1>
                <p className="mt-1 text-sm text-slate-500">입찰, 검차, 감가 협의, 인도/정산 등 주요 이벤트에 대한 알림 수신 방식을 설정합니다.</p>
              </header>

              <Card className="border-slate-200 shadow-none">
                <CardContent className="space-y-4 p-4">
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-slate-900">알림 채널</p>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input checked={notifyEmail} onChange={(event) => setNotifyEmail(event.target.checked)} type="checkbox" />
                      <Mail className="h-4 w-4 text-slate-400" /> 이메일로 알림 받기
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input checked={notifySms} onChange={(event) => setNotifySms(event.target.checked)} type="checkbox" />
                      <Bell className="h-4 w-4 text-slate-400" /> 문자(SMS)로 알림 받기
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input checked={notifyWeb} onChange={(event) => setNotifyWeb(event.target.checked)} type="checkbox" />
                      <Globe2 className="h-4 w-4 text-slate-400" /> 웹 알림(브라우저) 받기
                    </label>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-none">
                <CardContent className="space-y-4 p-4">
                  <p className="text-sm font-semibold text-slate-900">알림 유형</p>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">입찰 관련 알림</p>
                        <p className="text-xs text-slate-400">새 입찰, 입찰 마감, 낙찰 등</p>
                      </div>
                      <Toggle checked={prefNotifyBidding} onChange={setPrefNotifyBidding} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">검차 및 감가 협의 알림</p>
                        <p className="text-xs text-slate-400">차량 검사 결과 업데이트 및 협가 요청</p>
                      </div>
                      <Toggle checked={prefNotifyInspection} onChange={setPrefNotifyInspection} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">인도/정산 진행 및 완료</p>
                        <p className="text-xs text-slate-400">탁송 일정, 서류 접수, 정산금 입금 확인</p>
                      </div>
                      <Toggle checked={prefNotifySettlement} onChange={setPrefNotifySettlement} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">프로모션 및 서비스 공지</p>
                        <p className="text-xs text-slate-400">새로운 이벤트, 정책 변경, 업데이트 안내</p>
                      </div>
                      <Toggle checked={prefNotifyMarketing} onChange={setPrefNotifyMarketing} />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button className="bg-[#2f6ff5] px-8 hover:bg-[#2459cd]" disabled={saving} onClick={saveNotificationSettings} type="button">
                      저장
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === "security" && (
            <>
              <header>
                <h1 className="text-4xl font-extrabold text-slate-900">보안 / 비밀번호</h1>
                <p className="mt-1 text-sm text-slate-500">계정 보안을 위해 비밀번호를 변경하거나 로그인 보안 설정을 관리할 수 있습니다.</p>
              </header>

              <Card className="border-slate-200 shadow-none">
                <CardContent className="space-y-4 p-4">
                  <p className="text-sm font-semibold text-slate-900">비밀번호 변경</p>
                  <form className="space-y-3" onSubmit={savePassword}>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500">기존 비밀번호</label>
                      <Input onChange={(event) => setCurrentPassword(event.target.value)} type="password" value={currentPassword} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500">새 비밀번호</label>
                      <Input onChange={(event) => setNewPassword(event.target.value)} type="password" value={newPassword} />
                      <p className="text-xs text-slate-400">영문 대소문자, 숫자, 특수문자 중 2가지 이상 조합 (10~16자)</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500">새 비밀번호 확인</label>
                      <Input onChange={(event) => setConfirmPassword(event.target.value)} type="password" value={confirmPassword} />
                      {confirmPassword && newPassword !== confirmPassword && <p className="text-xs text-rose-500">비밀번호가 일치하지 않습니다.</p>}
                    </div>
                    <div className="flex justify-end">
                      <Button className="bg-[#2f6ff5] px-8 hover:bg-[#2459cd]" disabled={saving} type="submit">
                        비밀번호 변경
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-none">
                <CardContent className="space-y-4 p-4">
                  <p className="text-sm font-semibold text-slate-900">로그인 보안</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">새 기기 로그인 알림</p>
                      <p className="text-xs text-slate-400">새로운 기기에서 로그인 시도가 있을 때 이메일로 알립니다.</p>
                    </div>
                    <Toggle checked={newDeviceAlert} onChange={setNewDeviceAlert} />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-500">장기 미접속 시 자동 로그아웃</label>
                    <select
                      className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm md:w-[260px]"
                      onChange={(event) => setAutoLogout(event.target.value)}
                      value={autoLogout}
                    >
                      <option value="30분">30분</option>
                      <option value="1시간">1시간</option>
                      <option value="6시간">6시간</option>
                      <option value="24시간">24시간</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === "locale" && (
            <>
              <header>
                <h1 className="text-4xl font-extrabold text-slate-900">언어 및 지역</h1>
                <p className="mt-1 text-sm text-slate-500">화면 표시 언어와 기본 거래 국가/시간대를 설정합니다.</p>
              </header>

              <Card className="border-slate-200 shadow-none">
                <CardContent className="p-4">
                  <form className="space-y-4" onSubmit={saveLocale}>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs text-slate-500">표시 언어</label>
                        <select
                          className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                          onChange={(event) => setPrefLanguage(event.target.value)}
                          value={prefLanguage}
                        >
                          <option value="ko">한국어 (Korean)</option>
                          <option value="en">영어 (English)</option>
                          <option value="ja">일본어 (Japanese)</option>
                        </select>
                        <p className="text-xs text-slate-400">플랫폼 내 모든 메뉴 및 시스템 메시지가 선택한 언어로 표시됩니다.</p>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-slate-500">기본 거래 국가</label>
                        <select
                          className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                          onChange={(event) => setPrefTradeCountry(event.target.value)}
                          value={prefTradeCountry}
                        >
                          <option value="KR">대한민국 (South Korea)</option>
                          <option value="JP">일본 (Japan)</option>
                          <option value="US">미국 (United States)</option>
                          <option value="HK">홍콩 (Hong Kong)</option>
                        </select>
                        <p className="text-xs text-slate-400">주로 거래하는 국가를 설정하면 해당 국가의 규제 정보와 통화가 우선 표시됩니다.</p>
                      </div>
                    </div>

                    <div className="space-y-1 md:w-[340px]">
                      <label className="text-xs text-slate-500">표시 시간대</label>
                      <select
                        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                        onChange={(event) => setPrefTimezone(event.target.value)}
                        value={prefTimezone}
                      >
                        <option value="Asia/Seoul (GMT+09:00)">Asia / Seoul (GMT+9:00)</option>
                        <option value="Asia/Tokyo (GMT+09:00)">Asia / Tokyo (GMT+9:00)</option>
                        <option value="America/Los_Angeles (GMT-08:00)">America / Los Angeles (GMT-8:00)</option>
                      </select>
                    </div>

                    <div className="flex justify-end">
                      <Button className="bg-[#2f6ff5] px-8 hover:bg-[#2459cd]" disabled={saving} type="submit">
                        저장
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === "terms" && (
            <>
              <header>
                <h1 className="text-4xl font-extrabold text-slate-900">약관 및 회원탈퇴</h1>
                <p className="mt-1 text-sm text-slate-500">Template 서비스 이용약관, 개인정보 처리방침을 확인하고 필요 시 회원 탈퇴를 진행할 수 있습니다.</p>
              </header>

              <Card className="border-slate-200 shadow-none">
                <CardContent className="space-y-4 p-4">
                  <p className="text-sm font-semibold text-slate-900">약관 보기</p>
                  {["Template 서비스 이용약관 보기", "개인정보 처리방침 보기", "정산 및 수수료 정책 문서", "위치기반 서비스 이용약관"].map((item) => (
                    <div className="flex items-center justify-between border-b border-slate-100 py-2" key={item}>
                      <span className="text-sm text-slate-700">{item}</span>
                      <button className="inline-flex items-center gap-1 text-xs font-semibold text-[#2f6ff5]" type="button">
                        열기 <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-rose-200 bg-rose-50 shadow-none">
                <CardContent className="space-y-3 p-4">
                  <p className="inline-flex items-center gap-1 text-sm font-semibold text-rose-600">
                    <CircleAlert className="h-4 w-4" /> 회원 탈퇴
                  </p>
                  <p className="text-xs text-rose-500">회원 탈퇴 시 모든 계정 정보가 비활성화되며, 일부 거래 정보는 관련 법령에 따라 보관될 수 있습니다.</p>
                  <p className="text-xs text-rose-500">진행 중 또는 정산 대기 중인 거래가 있는 경우 탈퇴가 제한될 수 있습니다.</p>
                  <Button
                    className="border-rose-300 bg-white text-rose-600 hover:bg-rose-100"
                    onClick={() => setWithdrawalModal("confirm")}
                    type="button"
                    variant="outline"
                  >
                    회원 탈퇴
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {passwordDoneOpen && (
        <div className="fixed bottom-6 right-6 z-30 w-[320px] rounded-xl border border-slate-200 bg-white p-4 shadow-2xl">
          <div className="mb-3 flex items-center justify-center">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </span>
          </div>
          <p className="text-center text-lg font-bold text-slate-900">비밀번호가 성공적으로 변경되었습니다.</p>
          <p className="mt-2 text-center text-xs text-slate-500">새 비밀번호로 다시 로그인해 주세요.</p>
          <Button className="mt-4 w-full bg-[#2f6ff5] hover:bg-[#2459cd]" onClick={() => setPasswordDoneOpen(false)} type="button">
            확인
          </Button>
        </div>
      )}

      {withdrawalModal !== "none" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5">
            {withdrawalModal === "confirm" && (
              <>
                <div className="mb-3 flex items-center justify-center">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#edf3ff] text-[#2f6ff5]">
                    <CircleAlert className="h-5 w-5" />
                  </span>
                </div>
                <p className="text-center text-lg font-bold text-slate-900">회원 탈퇴를 진행하시겠습니까?</p>
                <p className="mt-2 text-center text-xs text-slate-500">탈퇴 시, 판매자님 계정은 즉시 삭제되며 복구가 불가능합니다.</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button onClick={() => setWithdrawalModal("none")} type="button" variant="outline">
                    취소
                  </Button>
                  <Button className="bg-[#2f6ff5] hover:bg-[#2459cd]" disabled={saving} onClick={() => void runWithdrawal()} type="button">
                    회원 탈퇴하기
                  </Button>
                </div>
              </>
            )}

            {withdrawalModal === "done" && (
              <>
                <div className="mb-3 flex items-center justify-center">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="h-5 w-5" />
                  </span>
                </div>
                <p className="text-center text-lg font-bold text-slate-900">회원 탈퇴가 완료되었습니다.</p>
                <p className="mt-2 text-center text-xs text-slate-500">판매자님의 Template 계정이 정상적으로 탈퇴 처리되었습니다.</p>
                <Button className="mt-4 w-full bg-[#2f6ff5] hover:bg-[#2459cd]" onClick={() => setWithdrawalModal("none")} type="button">
                  확인
                </Button>
              </>
            )}

            {withdrawalModal === "blocked" && (
              <>
                <div className="mb-3 flex items-center justify-center">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                    <XCircle className="h-5 w-5" />
                  </span>
                </div>
                <p className="text-center text-lg font-bold text-slate-900">회원 탈퇴를 진행할 수 없습니다.</p>
                <p className="mt-2 text-center text-xs text-slate-500">현재 판매자 계정에는 진행 중인 거래 또는 정산 대기 건이 존재하여 탈퇴가 제한됩니다.</p>
                <Button className="mt-4 w-full bg-[#2f6ff5] hover:bg-[#2459cd]" onClick={() => setWithdrawalModal("none")} type="button">
                  확인
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
