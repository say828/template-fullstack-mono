import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useAuth } from "../../app/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { cancelMyBid, listMarketVehicles, placeBid, updateMyBid } from "../../lib/api";
import type { MarketListing } from "../../lib/types";
import { currencyText, transactionTypeText } from "./shared";

const quickMultipliers = [1, 5, 10, 50];

function nextAllowedBidAmount(baseAmount: number, minIncrement: number) {
  if (minIncrement <= 0) return Math.max(baseAmount, 0);
  if (baseAmount <= 0) return minIncrement;
  const remainder = baseAmount % minIncrement;
  if (remainder === 0) return baseAmount + minIncrement;
  return baseAmount + (minIncrement - remainder);
}

export function DealerBidParticipatePage() {
  const { token } = useAuth();
  const { vehicleId } = useParams<{ vehicleId: string }>();

  const [vehicle, setVehicle] = useState<MarketListing | null>(null);
  const [bidAmount, setBidAmount] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!vehicleId || !token) {
        setVehicle(null);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const rows = await listMarketVehicles(token, { limit: 100 });
        const matched = rows.find((row) => row.id === vehicleId) ?? null;
        setVehicle(matched);
        if (!matched) {
          setError("입찰 가능한 매물을 찾을 수 없습니다.");
          return;
        }
        setBidAmount(
          matched.my_bid ?? nextAllowedBidAmount(Math.max(matched.highest_bid ?? 0, matched.reserve_price), matched.min_bid_increment),
        );
      } catch (err) {
        setVehicle(null);
        setError(err instanceof Error ? err.message : "매물 조회 실패");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [token, vehicleId]);

  const applyQuickAdd = (amount: number) => {
    if (!vehicle) return;
    setBidAmount((prev) => nextAllowedBidAmount(Math.max(prev, vehicle.reserve_price), vehicle.min_bid_increment) + amount - vehicle.min_bid_increment);
  };

  const submit = async () => {
    if (!token || !vehicleId || !vehicle) return;

    if (!agreed) {
      setError("약관 동의 후 입찰할 수 있습니다.");
      return;
    }

    if (bidAmount <= 0) {
      setError("입찰 금액을 입력해 주세요.");
      return;
    }

    const minAllowed = Math.max(vehicle.highest_bid ?? vehicle.reserve_price, vehicle.reserve_price);
    if (bidAmount < minAllowed) {
      setError(`입찰 금액은 ${currencyText(minAllowed, vehicle.currency)} 이상이어야 합니다.`);
      return;
    }
    if (vehicle.min_bid_increment > 0 && bidAmount % vehicle.min_bid_increment !== 0) {
      setError(`입찰 금액은 최소 호가 단위(${currencyText(vehicle.min_bid_increment, vehicle.currency)}) 배수여야 합니다.`);
      return;
    }
    if (vehicle.highest_bid !== null && vehicle.highest_bid !== undefined && bidAmount <= vehicle.highest_bid) {
      setError(`현재 최고 입찰가(${currencyText(vehicle.highest_bid, vehicle.currency)})보다 높은 금액만 입력할 수 있습니다.`);
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      if (vehicle.my_bid) {
        await updateMyBid(token, vehicleId, bidAmount);
      } else {
        await placeBid(token, vehicleId, bidAmount);
      }
      setMessage("입찰이 정상적으로 반영되었습니다.");
      setVehicle((prev) =>
        prev
          ? {
              ...prev,
              my_bid: bidAmount,
              highest_bid: Math.max(prev.highest_bid ?? 0, bidAmount),
              bid_count: prev.bid_count + (prev.my_bid ? 0 : 1),
            }
          : prev,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "입찰 처리 실패");
    } finally {
      setSubmitting(false);
    }
  };

  const cancelBid = async () => {
    if (!token || !vehicleId || !vehicle) return;

    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      await cancelMyBid(token, vehicleId);
      setVehicle((prev) => (prev ? { ...prev, my_bid: null } : prev));
      setMessage("입찰이 취소되었습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "입찰 취소 실패");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-4xl space-y-4">
      <header>
        <h1 className="text-3xl font-black text-slate-900">입찰 참여</h1>
        <p className="text-sm text-slate-500">DL_009 매물 요약·입찰 입력·약관 동의</p>
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

      {loading && <p className="text-sm text-slate-500">매물 정보를 불러오는 중...</p>}

      {!vehicle && !loading && (
        <Card>
          <CardContent className="pt-6 text-sm text-slate-500">입찰 가능한 매물 정보가 없습니다.</CardContent>
        </Card>
      )}

      {vehicle && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">매물 요약</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{vehicle.bidding_state === "CLOSED" ? "입찰 마감" : "입찰 중"}</Badge>
                <Badge variant="outline">{transactionTypeText(vehicle.transaction_type)}</Badge>
              </div>
              <p className="text-base font-semibold text-slate-900">{vehicle.title}</p>
              <p className="text-slate-500">현재 최고 입찰가: {currencyText(vehicle.highest_bid ?? vehicle.reserve_price, vehicle.currency)}</p>
              <p className="text-slate-500">최소 호가 단위: {currencyText(vehicle.min_bid_increment, vehicle.currency)}</p>
              <p className="text-slate-500">입찰 건수: {vehicle.bid_count}건</p>
              <div>
                <Button asChild size="sm" type="button" variant="outline">
                  <Link to={`/dealer/market/${vehicle.id}`}>상세보기</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">입찰가 입력</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dealer-bid-amount">내 입찰가</Label>
                <Input
                  id="dealer-bid-amount"
                  type="number"
                  value={bidAmount}
                  onChange={(event) => setBidAmount(Number(event.target.value) || 0)}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {quickMultipliers.map((multiplier) => {
                  const unit = vehicle.min_bid_increment * multiplier;
                  return (
                    <Button key={unit} onClick={() => applyQuickAdd(unit)} size="sm" type="button" variant="outline">
                      +{multiplier}호가
                    </Button>
                  );
                })}
              </div>

              <label className="flex items-start gap-2 text-sm text-slate-600">
                <input checked={agreed} onChange={(event) => setAgreed(event.target.checked)} type="checkbox" className="mt-1" />
                입찰 조건 및 취소 정책을 확인했으며, 입력 금액으로 입찰 진행에 동의합니다.
              </label>

              <div className="flex flex-wrap gap-2">
                <Button className="bg-[#2f6ff5] hover:bg-[#2459cd]" disabled={!agreed || submitting} onClick={() => void submit()} type="button">
                  {vehicle.my_bid ? "입찰가 수정" : "입찰하기"}
                </Button>
                <Button asChild type="button" variant="outline">
                  <Link to={`/dealer/market/${vehicle.id}`}>취소</Link>
                </Button>
                {vehicle.my_bid && (
                  <Button disabled={submitting} onClick={() => void cancelBid()} type="button" variant="secondary">
                    입찰 취소
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </section>
  );
}
