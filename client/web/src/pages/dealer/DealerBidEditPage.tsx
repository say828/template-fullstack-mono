import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useAuth } from "../../app/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { listMyDealerBids, updateMyBid } from "../../lib/api";
import type { DealerBid } from "../../lib/types";
import { currencyText } from "./shared";

const quickMultipliers = [1, 5, 10, 50];

export function DealerBidEditPage() {
  const { token } = useAuth();
  const { vehicleId } = useParams<{ vehicleId: string }>();

  const [row, setRow] = useState<DealerBid | null>(null);
  const [amount, setAmount] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!vehicleId || !token) {
        setRow(null);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await listMyDealerBids(token);
        const found = data.find((item) => item.vehicle_id === vehicleId);
        if (found) {
          setRow(found);
          setAmount(found.amount);
          return;
        }
        setRow(null);
        setError("수정할 입찰 정보를 찾을 수 없습니다.");
      } catch (err) {
        setRow(null);
        setError(err instanceof Error ? err.message : "입찰 내역 조회 실패");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [token, vehicleId]);

  const onSubmit = async () => {
    if (!token || !vehicleId || !row) return;

    if (!agreed) {
      setError("수정 내용 확인 동의 후 진행할 수 있습니다.");
      return;
    }

    const minAllowed = Math.max(row.highest_bid ?? row.reserve_price, row.reserve_price);
    if (amount < minAllowed) {
      setError(`수정 입찰가는 ${currencyText(minAllowed, row.currency)} 이상이어야 합니다.`);
      return;
    }
    if (row.min_bid_increment > 0 && amount % row.min_bid_increment !== 0) {
      setError(`수정 입찰가는 최소 호가 단위(${currencyText(row.min_bid_increment, row.currency)}) 배수여야 합니다.`);
      return;
    }
    if (row.highest_bid !== null && row.highest_bid !== undefined && amount <= row.highest_bid) {
      setError(`현재 최고 입찰가(${currencyText(row.highest_bid, row.currency)})보다 높은 금액만 입력할 수 있습니다.`);
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await updateMyBid(token, vehicleId, amount);
      setMessage("입찰가가 수정되었습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "입찰 수정 실패");
    } finally {
      setSaving(false);
    }
  };

  if (!row) {
    return (
      <section className="mx-auto max-w-3xl">
        <Card>
          <CardContent className="pt-6 text-sm text-slate-500">입찰 정보를 찾을 수 없습니다.</CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl space-y-4">
      <header>
        <h1 className="text-3xl font-black text-slate-900">입찰가 수정</h1>
        <p className="text-sm text-slate-500">DL_011 수정 금액 입력 및 확인 동의</p>
      </header>

      {loading && <p className="text-sm text-slate-500">입찰 정보를 불러오는 중...</p>}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>요청 실패</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {message && (
        <Alert className="border-emerald-200 bg-emerald-50">
          <AlertTitle className="text-emerald-700">수정 완료</AlertTitle>
          <AlertDescription className="text-emerald-700">{message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">매물 요약</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="font-semibold text-slate-900">{row.title}</p>
          <p className="text-slate-500">현재 최고가 {currencyText(row.highest_bid ?? 0, row.currency)}</p>
          <p className="text-slate-500">최소 호가 단위 {currencyText(row.min_bid_increment, row.currency)}</p>
          <p className="text-slate-500">내 기존 입찰가 {currencyText(row.amount, row.currency)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">수정 입찰가 입력</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="dealer-bid-edit-amount">수정할 입찰가</Label>
            <Input
              id="dealer-bid-edit-amount"
              type="number"
              value={amount}
              onChange={(event) => setAmount(Number(event.target.value) || 0)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {quickMultipliers.map((multiplier) => {
              const unit = row.min_bid_increment * multiplier;
              return (
              <Button key={unit} onClick={() => setAmount((prev) => prev + unit)} size="sm" type="button" variant="outline">
                +{multiplier}호가
              </Button>
              );
            })}
          </div>

          <label className="flex items-start gap-2 text-sm text-slate-600">
            <input checked={agreed} onChange={(event) => setAgreed(event.target.checked)} type="checkbox" className="mt-1" />
            수정된 입찰가가 경쟁 구조와 최종 결과에 영향을 줄 수 있음을 확인합니다.
          </label>

          <div className="flex flex-wrap gap-2">
            <Button asChild type="button" variant="outline">
              <Link to="/dealer/bids">취소</Link>
            </Button>
            <Button className="bg-[#2f6ff5] hover:bg-[#2459cd]" disabled={!agreed || saving} onClick={() => void onSubmit()} type="button">
              수정 완료
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
