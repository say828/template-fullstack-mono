import { Bell, CheckCircle2, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";

import { useAuth } from "../app/AuthContext";
import vehicleHeroImage from "../assets/seller/vehicle-hero.png";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { getMySettings, getSellerVehicleDetail, listSellerVehicleBids, updateMyPreferences } from "../lib/api";
import type { SellerVehicleBid, SellerVehicleDetail, UserSettings } from "../lib/types";
import { cn } from "../lib/utils";

function formatTimeLeft(seconds: number) {
  const safe = Math.max(0, seconds);
  const days = Math.floor(safe / 86400);
  const hours = Math.floor((safe % 86400) / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((safe % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const remaining = Math.floor(safe % 60)
    .toString()
    .padStart(2, "0");
  if (safe === 0) return "마감";
  if (days > 0) return `${days}일 ${hours}:${minutes}:${remaining}`;
  if (safe >= 3600) return `${hours}:${minutes}:${remaining}`;
  return `${hours}:${minutes}:${remaining}`;
}

function formatDateTime(value: string) {
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return "-";
  return target.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatBidAmount(value: number) {
  return `${value.toLocaleString()}원`;
}

function formatMileage(value: number) {
  if (value < 10000) return `${value.toLocaleString()} km`;
  return `${(value / 10000).toFixed(1)}만 km`;
}

function fuelLabel(fuelType: SellerVehicleDetail["fuel_type"]) {
  if (fuelType === "GASOLINE") return "가솔린";
  if (fuelType === "DIESEL") return "디젤";
  if (fuelType === "HYBRID") return "하이브리드";
  if (fuelType === "EV") return "전기";
  return "-";
}

function countryLabel(email: string) {
  if (email.includes("hk")) return "홍콩";
  if (email.includes("jp")) return "일본";
  if (email.includes("us")) return "미국";
  return "대한민국";
}

function biddingStateLabel(state?: SellerVehicleDetail["bidding_state"]) {
  if (state === "OPEN") return "입찰중";
  if (state === "CLOSING_SOON") return "입찰 마감 임박";
  return "입찰 마감";
}

function mapProfileToToggles(settings: UserSettings) {
  return {
    bidAlertOn: settings.notify_bidding ?? true,
    highestAlertOn: settings.notify_settlement ?? true,
  };
}

export function SellerVehicleBidsPage() {
  const { token, user } = useAuth();
  const location = useLocation();
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const [searchParams] = useSearchParams();

  const [detail, setDetail] = useState<SellerVehicleDetail | null>(null);
  const [rows, setRows] = useState<SellerVehicleBid[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [prefLoading, setPrefLoading] = useState(true);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [visibleCount, setVisibleCount] = useState(6);
  const [keyword, setKeyword] = useState("");
  const [bidAlertOn, setBidAlertOn] = useState(true);
  const [highestAlertOn, setHighestAlertOn] = useState(true);
  const [updatingPrefs, setUpdatingPrefs] = useState(false);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const [selectedDealerId, setSelectedDealerId] = useState<string | null>(null);
  const [selectDone, setSelectDone] = useState(false);
  const [listAnchorRow, setListAnchorRow] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const mode = searchParams.get("mode") === "select" ? "select" : "list";

  const loadData = async (showLoading = true) => {
    if (!token || !vehicleId) return;
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const [vehicle, bids] = await Promise.all([getSellerVehicleDetail(token, vehicleId), listSellerVehicleBids(token, vehicleId)]);
      setDetail(vehicle);
      setRows(bids);
      setTimeLeftSeconds(vehicle.time_left_seconds);
    } catch (err) {
      setError(err instanceof Error ? err.message : "입찰현황 조회 실패");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const loadSettings = async (showLoading = false) => {
    if (!token) return;
    if (showLoading) setPrefLoading(true);
    try {
      const profile = await getMySettings(token);
      setSettings(profile);
      const presets = mapProfileToToggles(profile);
      setBidAlertOn(presets.bidAlertOn);
      setHighestAlertOn(presets.highestAlertOn);
    } catch {
      setBidAlertOn(true);
      setHighestAlertOn(true);
    } finally {
      if (showLoading) setPrefLoading(false);
    }
  };

  useEffect(() => {
    void loadData(true);
    void loadSettings(true);
    setVisibleCount(6);
    setKeyword("");
    setListAnchorRow(null);
  }, [token, vehicleId]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void loadData(false);
    }, 15000);
    return () => window.clearInterval(timer);
  }, [token, vehicleId]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeLeftSeconds((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [detail?.id]);

  const sortedRows = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return [...rows]
      .filter((row) => {
        if (!normalizedKeyword) return true;
        return row.dealer_name.toLowerCase().includes(normalizedKeyword) || row.dealer_email.toLowerCase().includes(normalizedKeyword);
      })
      .sort((left, right) => right.amount - left.amount);
  }, [keyword, rows]);

  const visibleRows = sortedRows.slice(0, visibleCount);
  const highestBid = sortedRows[0]?.amount ?? detail?.highest_bid ?? null;
  const topBid = sortedRows[0] ?? null;
  const selectedBid = sortedRows.find((row) => row.dealer_id === selectedDealerId);
  const deadlineLabel = detail ? formatDateTime(detail.bidding_ends_at) : "-";

  const vehicleImage = detail?.photo_urls?.[0] ?? vehicleHeroImage;
  const photoStatusLabel = biddingStateLabel(detail?.bidding_state);
  const transactionLabel = detail?.transaction_type === "DOMESTIC" ? "국내 거래" : "해외(수출)";

  const showMore = () => {
    const scrollTop = listRef.current?.scrollTop ?? null;
    setListAnchorRow(scrollTop);
    setVisibleCount((prev) => prev + 5);
  };

  useEffect(() => {
    if (!listRef.current || listAnchorRow === null) return;
    listRef.current.scrollTop = listAnchorRow;
    setListAnchorRow(null);
  }, [visibleRows.length, listAnchorRow]);

  const switchToggle = async (kind: "bid" | "highest", nextValue: boolean) => {
    if (!settings || !user || !token) return;
    const nextSettings = {
      ...settings,
      notify_bidding: kind === "bid" ? nextValue : settings.notify_bidding,
      notify_settlement: kind === "highest" ? nextValue : settings.notify_settlement,
    };
    setBidAlertOn(kind === "bid" ? nextValue : bidAlertOn);
    setHighestAlertOn(kind === "highest" ? nextValue : highestAlertOn);
    setUpdatingPrefs(true);
    try {
      const updated = await updateMyPreferences(token, {
        language: nextSettings.language,
        region: nextSettings.region,
        notify_bidding: nextSettings.notify_bidding,
        notify_settlement: nextSettings.notify_settlement,
        notify_marketing: nextSettings.notify_marketing,
        notify_support: nextSettings.notify_support,
      });
      setSettings(updated);
      const presets = mapProfileToToggles(updated);
      setBidAlertOn(presets.bidAlertOn);
      setHighestAlertOn(presets.highestAlertOn);
    } catch {
      setBidAlertOn(settings.notify_bidding);
      setHighestAlertOn(settings.notify_settlement);
      setError("입찰 알림 설정 저장에 실패했습니다.");
    } finally {
      setUpdatingPrefs(false);
    }
  };

  if (loading) {
    return (
      <section className="mx-auto max-w-5xl">
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">입찰현황을 불러오는 중...</CardContent>
        </Card>
      </section>
    );
  }

  if (!detail) {
    return (
      <section className="mx-auto max-w-5xl space-y-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm">차량 정보를 찾을 수 없습니다.</p>
          </CardContent>
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

  const isSelectableMode = mode === "select";

  return (
    <section className="relative mx-auto max-w-5xl space-y-4">
      <header className="space-y-1">
        <h1 className="text-3xl font-black text-slate-900">{isSelectableMode ? "입찰자 선택" : "입찰 현황"}</h1>
        <p className="text-sm text-slate-500">
          {isSelectableMode
            ? "입찰 후보를 확인하고 낙찰할 딜러를 선택합니다."
            : "현재 딜러들의 입찰 정보를 확인할 수 있습니다."}
        </p>
      </header>

      <div className="space-y-5">
        <Card className="overflow-hidden rounded-3xl border-white/80 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
          <CardContent className="flex flex-col gap-4 p-4 pt-4 md:flex-row md:items-center md:gap-5 md:p-5 md:pt-5">
            <div className="overflow-hidden rounded-2xl bg-slate-100 md:h-28 md:w-44 md:shrink-0">
              <img alt={detail.title} className="h-44 w-full object-cover object-center md:h-28" src={vehicleImage} />
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge className="border-transparent bg-[#4b67ff] text-white hover:bg-[#4b67ff]">{photoStatusLabel}</Badge>
                <Badge variant="outline" className="border-slate-200 bg-white text-slate-500">
                  {transactionLabel}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-[30px] font-black leading-none tracking-[-0.03em] text-slate-950">{detail.title}</p>
                <p className="text-sm text-slate-500">
                  {detail.year}년식 · {formatMileage(detail.mileage_km)} · {fuelLabel(detail.fuel_type)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                <div className="flex items-baseline gap-2">
                  <span className="text-slate-400">현재 최고 입찰가</span>
                  <span className="font-extrabold text-[#4b67ff]">{formatBidAmount(highestBid ?? 0)}</span>
                </div>
                <div className="h-4 w-px bg-slate-200" />
                <div className="flex items-baseline gap-2">
                  <span className="text-slate-400">입찰 수</span>
                  <span className="font-bold text-slate-900">{rows.length}건</span>
                </div>
                <div className="h-4 w-px bg-slate-200" />
                <div className="flex items-baseline gap-2">
                  <span className="text-slate-400">마감 기한</span>
                  <span className="font-bold text-rose-500">{timeLeftSeconds > 0 ? formatTimeLeft(timeLeftSeconds) : deadlineLabel}</span>
                </div>
              </div>
            </div>
            <div className="flex md:w-40 md:justify-end">
              <Button asChild className="h-11 w-full rounded-xl bg-[#2f6ff5] px-6 text-sm font-semibold hover:bg-[#2459cd]" type="button">
                <Link
                  to={`/seller/vehicles/${detail.id}`}
                  state={{
                    from: "seller-vehicle-bids",
                    vehicleId: detail.id,
                    returnTo: location.pathname + location.search,
                  }}
                >
                  차량 상세 보기
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1 space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-[28px] font-black tracking-[-0.03em] text-slate-950">{isSelectableMode ? "입찰 후보 목록" : "입찰 목록"}</h2>
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-slate-100 px-2 text-xs font-semibold text-slate-500">
                  {sortedRows.length}
                </span>
              </div>
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-end">
                <button
                  className="inline-flex h-11 shrink-0 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600"
                  type="button"
                >
                  최고 입찰가순
                </button>
                <div className="relative w-full md:w-[280px]">
                  <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <Input
                    className="h-11 rounded-xl border-slate-200 bg-white pl-10"
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="딜러명 검색"
                    value={keyword}
                  />
                </div>
              </div>
            </div>

            <Card className="overflow-hidden rounded-[20px] border-white/80 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
              <CardContent className="p-0">
                <div ref={listRef} className="overflow-x-auto">
                  <table className="min-w-[640px] w-full border-collapse text-sm">
                    <thead>
                      <tr className="text-left text-slate-500">
                        <th className="w-[28%] border-b border-slate-200 px-8 py-4">딜러명</th>
                        <th className="w-[20%] border-b border-slate-200 px-6 py-4">입찰가</th>
                        <th className="w-[22%] border-b border-slate-200 px-6 py-4">입찰 시간</th>
                        <th className="w-[12%] border-b border-slate-200 px-6 py-4">국가</th>
                        <th className="w-[18%] border-b border-slate-200 px-6 py-4">비고</th>
                        {isSelectableMode && <th className="w-[12%] border-b border-slate-200 px-6 py-4">작업</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRows.map((row, index) => {
                        const isHighest = index === 0;
                        const isSelected = selectedDealerId === row.dealer_id;
                        return (
                          <tr
                            key={row.id}
                            className={cn("border-b border-slate-100", isSelected && "bg-[#edf3ff]", isHighest && "bg-[#fcfdff]")}
                          >
                            <td className="px-8 py-5 align-middle">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-slate-900">{row.dealer_name}</p>
                                {isHighest && (
                                  <Badge className="border-transparent bg-[#ffe5ea] text-[#ff6b84] hover:bg-[#ffe5ea]">Highest</Badge>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-5 align-middle font-semibold text-[#4b67ff]">{formatBidAmount(row.amount)}</td>
                            <td className="px-6 py-5 align-middle text-slate-600">{formatDateTime(row.updated_at)}</td>
                            <td className="px-6 py-5 align-middle text-slate-600">{countryLabel(row.dealer_email)}</td>
                            <td className="px-6 py-5 align-middle">
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                                  isHighest ? "bg-[#eef9ee] text-[#54a35f]" : "text-slate-400",
                                )}
                              >
                                {isHighest ? "국내" : "-"}
                              </span>
                            </td>
                            {isSelectableMode && (
                              <td className="px-6 py-5 text-right align-middle">
                                <Button
                                  className={cn("h-8", isSelected ? "bg-black text-white hover:bg-black" : "")}
                                  onClick={() => setSelectedDealerId(row.dealer_id)}
                                  size="sm"
                                  type="button"
                                  variant={isSelected ? "default" : "outline"}
                                >
                                  {isSelected ? "선택됨" : "이 딜러 선택"}
                                </Button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                      {visibleRows.length === 0 && (
                        <tr>
                          <td colSpan={isSelectableMode ? 6 : 5} className="px-4 py-8 text-center text-sm text-slate-500">
                            조건에 맞는 입찰 내역이 없습니다.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {sortedRows.length > visibleCount && (
              <div className="flex justify-center pt-1">
                <button className="text-sm font-semibold text-[#4b67ff]" onClick={showMore} type="button">
                  더 보기 +
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4 lg:sticky lg:top-24 lg:w-84 lg:shrink-0">
            <Card className="rounded-[20px] border-white/80 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
              <CardContent className="space-y-5 p-5">
                <div className="space-y-4">
                  <CardTitle className="text-lg font-black text-slate-950">남은 시간</CardTitle>
                  <div className="rounded-[18px] bg-slate-50 px-4 py-7 text-center">
                    <p className="text-[34px] font-black tracking-[-0.03em] text-slate-900">{timeLeftSeconds > 0 ? formatTimeLeft(timeLeftSeconds) : "마감"}</p>
                  </div>
                </div>

                <label className="flex items-center justify-between text-sm text-slate-600">
                  <span>새 입찰 알림 받기</span>
                  <button
                    aria-label="새 입찰 알림 토글"
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                      bidAlertOn ? "bg-[#2f6ff5]" : "bg-slate-300",
                      updatingPrefs ? "pointer-events-none opacity-60" : "",
                    )}
                    disabled={updatingPrefs || prefLoading || !token || !user}
                    onClick={() => void switchToggle("bid", !bidAlertOn)}
                    type="button"
                  >
                    <span
                      className={cn(
                        "inline-block h-5 w-5 rounded-full bg-white transition-transform",
                        bidAlertOn ? "translate-x-[22px]" : "translate-x-[2px]",
                      )}
                    />
                  </button>
                </label>

                <label className="flex items-center justify-between text-sm text-slate-600">
                  <span>최고가 자동 갱신 알림</span>
                  <button
                    aria-label="최고가 자동 갱신 알림 토글"
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                      highestAlertOn ? "bg-[#2f6ff5]" : "bg-slate-300",
                      updatingPrefs ? "pointer-events-none opacity-60" : "",
                    )}
                    disabled={updatingPrefs || prefLoading || !token || !user}
                    onClick={() => void switchToggle("highest", !highestAlertOn)}
                    type="button"
                  >
                    <span
                      className={cn(
                        "inline-block h-5 w-5 rounded-full bg-white transition-transform",
                        highestAlertOn ? "translate-x-[22px]" : "translate-x-[2px]",
                      )}
                    />
                  </button>
                </label>
              </CardContent>
            </Card>

            <div className="rounded-[16px] border border-[#7ea2ff] bg-[#eef4ff] px-4 py-4 text-xs leading-6 text-[#3c62cf]">
              <p className="font-bold">도움말</p>
              <p>입찰 마감 전까지 언제든지 최고 입찰가를 갱신할 수 있습니다.</p>
              <p>수출 가능 차량의 경우 해외 딜러의 입찰이 활발할 수 있습니다.</p>
            </div>

            {isSelectableMode ? (
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-base">선택 정보 요약</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="space-y-2 rounded-md bg-slate-50 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">현재 최고 입찰가</span>
                      <span className="font-semibold">{formatBidAmount(highestBid ?? 0)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">선택된 딜러</span>
                      <span className="font-semibold text-[#2f6ff5]">{selectedBid?.dealer_name ?? "-"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">최종 낙찰가</span>
                      <span className="font-semibold text-[#2f6ff5]">
                        {selectedBid ? `${formatBidAmount(selectedBid.amount)}` : "-"}
                      </span>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-[#2f6ff5] hover:bg-[#2459cd]"
                    disabled={!selectedDealerId}
                    onClick={() => {
                      setSelectDone(true);
                    }}
                  >
                    선택 완료하기
                  </Button>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </div>

      {selectDone && isSelectableMode && (
        <Alert className="border-emerald-200 bg-emerald-50">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <AlertTitle>낙찰 확정 완료</AlertTitle>
          <AlertDescription>선택한 딜러에게 낙찰이 확정되었습니다.</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <Bell className="h-4 w-4" />
          <AlertTitle>조회 실패</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </section>
  );
}
