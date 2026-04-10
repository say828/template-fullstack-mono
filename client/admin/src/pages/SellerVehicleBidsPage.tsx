import { Bell, CarFront, CheckCircle2, ChevronDown, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import { useAuth } from "../app/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { getSellerVehicleDetail, listSellerVehicleBids } from "../lib/api";
import type { SellerVehicleBid, SellerVehicleDetail } from "../lib/types";
import { cn } from "../lib/utils";

function bidStatusBadge(status: SellerVehicleBid["status"]) {
  if (status === "WON") return <Badge variant="secondary">낙찰</Badge>;
  if (status === "LOST") return <Badge variant="outline">패찰</Badge>;
  if (status === "CANCELLED") return <Badge variant="destructive">취소</Badge>;
  return <Badge>입찰중</Badge>;
}

function formatTimeLeft(seconds: number) {
  const safe = Math.max(0, seconds);
  const days = Math.floor(safe / 86400);
  const hours = Math.floor((safe % 86400) / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((safe % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const remain = Math.floor(safe % 60)
    .toString()
    .padStart(2, "0");
  return `${days}일 ${hours}:${minutes}:${remain}`;
}

function secondsUntil(endAt: string, nowMs: number) {
  const targetMs = new Date(endAt).getTime();
  if (!Number.isFinite(targetMs)) return 0;
  return Math.max(0, Math.floor((targetMs - nowMs) / 1000));
}

function formatDeadline(endAt: string) {
  const target = new Date(endAt);
  if (Number.isNaN(target.getTime())) return "-";
  return target.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function countryLabel(email: string) {
  if (email.includes("hk")) return "홍콩";
  if (email.includes("jp")) return "일본";
  if (email.includes("us")) return "미국";
  return "대한민국";
}

export function SellerVehicleBidsPage() {
  const { token } = useAuth();
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const [searchParams] = useSearchParams();

  const [detail, setDetail] = useState<SellerVehicleDetail | null>(null);
  const [rows, setRows] = useState<SellerVehicleBid[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(6);
  const [keyword, setKeyword] = useState("");
  const [bidAlertOn, setBidAlertOn] = useState(true);
  const [highestAlertOn, setHighestAlertOn] = useState(true);
  const [selectedDealerId, setSelectedDealerId] = useState<string | null>(null);
  const [selectDone, setSelectDone] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const mode = searchParams.get("mode") === "select" ? "select" : "list";

  const load = async () => {
    if (!token || !vehicleId) return;
    setLoading(true);
    setError(null);
    try {
      const [vehicle, bids] = await Promise.all([getSellerVehicleDetail(token, vehicleId), listSellerVehicleBids(token, vehicleId)]);
      setDetail(vehicle);
      setRows(bids);
    } catch (err) {
      setError(err instanceof Error ? err.message : "입찰현황 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [token, vehicleId]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

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
  const selectedBid = sortedRows.find((row) => row.dealer_id === selectedDealerId);
  const timeLeftSeconds = detail ? secondsUntil(detail.bidding_ends_at, nowMs) : 0;
  const deadlineLabel = detail ? formatDeadline(detail.bidding_ends_at) : "-";

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

  return (
    <section className="mx-auto max-w-5xl space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <p className="mb-2 text-xs font-semibold text-slate-500">화면 코드: {mode === "select" ? "FRT_018" : "FRT_016"}</p>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant={mode === "list" ? "default" : "outline"}>
            <Link to={`/seller/vehicles/${detail.id}/bids`}>입찰현황(FRT_016)</Link>
          </Button>
          <Button asChild size="sm" variant={mode === "select" ? "default" : "outline"}>
            <Link to={`/seller/vehicles/${detail.id}/bids?mode=select`}>입찰자선택(FRT_018)</Link>
          </Button>
        </div>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-3xl font-extrabold">{mode === "select" ? "입찰자 선택" : "입찰 현황"}</CardTitle>
          <CardDescription>
            {mode === "select"
              ? "입찰에 참여한 딜러의 정보를 확인하고 낙찰할 딜러를 선택해 주세요."
              : "현재 딜러들의 입찰 정보를 확인할 수 있습니다."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-20 w-32 items-center justify-center rounded-md border border-slate-200 bg-gradient-to-br from-slate-100 to-slate-200">
                  <CarFront className="h-10 w-10 text-slate-500" />
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2 text-xs">
                    <Badge>입찰중</Badge>
                    <Badge variant="outline">{detail.transaction_type === "DOMESTIC" ? "국내 거래" : "해외(수출)"}</Badge>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{detail.title}</p>
                  <p className="text-sm text-slate-500">
                    {detail.year}년식 · {detail.mileage_km.toLocaleString()} km · {detail.fuel_type}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                    <span className="text-slate-500">
                      현재 최고 입찰가 <span className="ml-1 font-bold text-[#2f6ff5]">{(highestBid ?? 0).toLocaleString()}원</span>
                    </span>
                    <span className="text-slate-500">
                      입찰 수 <span className="ml-1 font-semibold text-slate-700">{rows.length}건</span>
                    </span>
                    <span className="text-slate-500">
                      마감 기한 <span className="ml-1 font-semibold text-rose-500">{deadlineLabel}</span>
                    </span>
                  </div>
                </div>
                <Button asChild className="bg-[#2f6ff5] hover:bg-[#2459cd]">
                  <Link to={`/seller/vehicles/${detail.id}`}>차량 상세 보기</Link>
                </Button>
              </div>
            </div>

            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-base">남은 시간</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="rounded-md bg-slate-50 px-3 py-4 text-center text-2xl font-bold text-slate-800">
                  {formatTimeLeft(timeLeftSeconds)}
                </p>
                <label className="flex items-center justify-between text-sm">
                  <span>새 입찰 알림 받기</span>
                  <input checked={bidAlertOn} onChange={(e) => setBidAlertOn(e.target.checked)} type="checkbox" />
                </label>
                <label className="flex items-center justify-between text-sm">
                  <span>최고가 갱신 알림</span>
                  <input checked={highestAlertOn} onChange={(e) => setHighestAlertOn(e.target.checked)} type="checkbox" />
                </label>
                <div className="rounded-md border border-[#8fb3ff] bg-[#edf3ff] p-3 text-xs text-[#3156a5]">
                  입찰 마감 전까지 업데이트된 최고 입찰가를 갱신할 수 있습니다.
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <Card className="border-slate-200">
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-lg">입찰 목록</CardTitle>
                  <Badge variant="outline">{sortedRows.length}건</Badge>
                </div>
                <div className="grid gap-2 md:grid-cols-[180px_1fr]">
                  <button className="inline-flex h-9 items-center gap-1 rounded-md border border-slate-200 px-3 text-sm text-slate-600" type="button">
                    최고 입찰가순 <ChevronDown className="h-4 w-4" />
                  </button>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input className="pl-9" onChange={(e) => setKeyword(e.target.value)} placeholder="딜러명 검색" value={keyword} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-slate-500">
                        <th className="py-2">딜러명</th>
                        <th className="py-2 text-right">입찰가</th>
                        <th className="py-2">입찰 시간</th>
                        <th className="py-2">국가</th>
                        <th className="py-2">비고</th>
                        {mode === "select" && <th className="py-2 text-right">선택</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRows.map((row, index) => {
                        const isHighest = index === 0;
                        const isSelected = selectedDealerId === row.dealer_id;
                        return (
                          <tr
                            key={row.id}
                            className={cn(
                              "border-b border-slate-100",
                              isSelected && "bg-[#edf3ff]",
                            )}
                          >
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{row.dealer_name}</span>
                                {isHighest && <Badge variant="secondary">Highest</Badge>}
                              </div>
                            </td>
                            <td className="py-3 text-right font-semibold text-[#2f6ff5]">{row.amount.toLocaleString()}원</td>
                            <td className="py-3 text-slate-500">{new Date(row.updated_at).toLocaleString()}</td>
                            <td className="py-3 text-slate-500">{countryLabel(row.dealer_email)}</td>
                            <td className="py-3">
                              <div className="flex items-center gap-1">
                                {bidStatusBadge(row.status)}
                                {row.dealer_email.includes("dealer") && <Badge variant="outline">국내</Badge>}
                              </div>
                            </td>
                            {mode === "select" && (
                              <td className="py-3 text-right">
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
                    </tbody>
                  </table>
                </div>

                {sortedRows.length > visibleCount && (
                  <div className="pt-3">
                    <button
                      className="text-sm font-semibold text-[#2f6ff5]"
                      onClick={() => setVisibleCount((prev) => prev + 5)}
                      type="button"
                    >
                      더 보기 +
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>

            {mode === "select" ? (
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-base">선택 정보 요약</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="space-y-2 rounded-md bg-slate-50 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">현재 최고 입찰가</span>
                      <span className="font-semibold">{(highestBid ?? 0).toLocaleString()}원</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">선택된 딜러</span>
                      <span className="font-semibold text-[#2f6ff5]">{selectedBid?.dealer_name ?? "-"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">최종 낙찰가</span>
                      <span className="font-semibold text-[#2f6ff5]">{selectedBid ? `${selectedBid.amount.toLocaleString()}원` : "-"}</span>
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

                  <div className="rounded-md border border-[#8fb3ff] bg-[#edf3ff] p-3 text-xs text-[#3156a5]">
                    딜러를 선택하면 낙찰 단계로 전환되며, 감가 협의 단계로 진행됩니다.
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-base">입찰 안내</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-slate-600">
                  <p>최고 입찰가 기준으로 목록이 정렬됩니다.</p>
                  <p>입찰 건수가 많은 경우 더 보기를 눌러 추가 내역을 확인하세요.</p>
                  <p>마감 전 입찰은 실시간으로 업데이트됩니다.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      {selectDone && mode === "select" && (
        <Alert className="border-emerald-200 bg-emerald-50">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <AlertTitle>낙찰 확정 완료</AlertTitle>
          <AlertDescription>
            선택한 딜러에게 낙찰이 확정되었습니다. 이후 단계는 차량 상세 화면에서 확인할 수 있습니다.
          </AlertDescription>
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
