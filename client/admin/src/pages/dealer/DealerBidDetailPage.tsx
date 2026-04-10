import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useAuth } from "../../app/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { cancelMyBid, listMyDealerBids } from "../../lib/api";
import type { DealerBid } from "../../lib/types";
import { currencyText, formatDateTime, toDealerBidDetailState, type DealerBidDetailState } from "./shared";

function normalizeState(value: string | undefined, row: DealerBid): DealerBidDetailState {
  if (value === "open" || value === "closed" || value === "lost" || value === "won" || value === "cancelled") {
    return value;
  }
  return toDealerBidDetailState(row);
}

function titleByState(state: DealerBidDetailState) {
  if (state === "open") return "입찰상세(입찰중)";
  if (state === "closed") return "입찰상세(마감)";
  if (state === "lost") return "입찰상세(미낙찰)";
  if (state === "won") return "입찰상세(낙찰)";
  return "입찰상세(취소됨)";
}

function specCodeByState(state: DealerBidDetailState) {
  if (state === "open") return "DL_012";
  if (state === "closed") return "DL_013";
  if (state === "lost") return "DL_014";
  if (state === "won") return "DL_015";
  return "DL_016";
}

function stateBadge(state: DealerBidDetailState) {
  if (state === "open") return <Badge className="bg-[#2f6ff5]">입찰중</Badge>;
  if (state === "closed") return <Badge variant="secondary">마감</Badge>;
  if (state === "won") return <Badge className="bg-emerald-600">낙찰</Badge>;
  if (state === "lost") return <Badge variant="outline">미낙찰</Badge>;
  return <Badge variant="destructive">취소됨</Badge>;
}

export function DealerBidDetailPage() {
  const { token } = useAuth();
  const { vehicleId, state: stateParam } = useParams<{ vehicleId: string; state: string }>();

  const [row, setRow] = useState<DealerBid | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [acting, setActing] = useState(false);

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
        const matched = data.find((item) => item.vehicle_id === vehicleId) ?? null;
        setRow(matched);
        if (!matched) setError("입찰 상세 정보를 찾을 수 없습니다.");
      } catch (err) {
        setRow(null);
        setError(err instanceof Error ? err.message : "입찰 상세 조회 실패");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [token, vehicleId]);

  const state = useMemo(() => {
    if (!row) return "open" as DealerBidDetailState;
    return normalizeState(stateParam, row);
  }, [row, stateParam]);

  const cancelBid = async () => {
    if (!token || !vehicleId || !row) return;

    setActing(true);
    setError(null);
    setMessage(null);
    try {
      await cancelMyBid(token, vehicleId);
      setRow({ ...row, status: "CANCELLED" });
      setMessage("입찰이 취소되었습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "입찰 취소 실패");
    } finally {
      setActing(false);
    }
  };

  if (!row) {
    return (
      <section className="mx-auto max-w-4xl">
        <Card>
          <CardContent className="pt-6 text-sm text-slate-500">입찰 상세 정보를 찾을 수 없습니다.</CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl space-y-4">
      <header>
        <h1 className="text-3xl font-black text-slate-900">{titleByState(state)}</h1>
        <p className="text-sm text-slate-500">{specCodeByState(state)} 상태별 입찰 상세</p>
      </header>

      {loading && <p className="text-sm text-slate-500">입찰 상세를 불러오는 중...</p>}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>조회 실패</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {message && (
        <Alert className="border-emerald-200 bg-emerald-50">
          <AlertTitle className="text-emerald-700">처리 완료</AlertTitle>
          <AlertDescription className="text-emerald-700">{message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-lg">{row.title}</CardTitle>
            {stateBadge(state)}
          </div>
          <p className="text-sm text-slate-500">
            현재 최고 입찰가 {currencyText(row.highest_bid ?? 0, row.currency)} / 입찰 건수 미러링 기준 데이터
          </p>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>내 입찰가: <span className="font-semibold text-slate-900">{currencyText(row.amount, row.currency)}</span></p>
          <p>입찰 마감: {formatDateTime(row.bidding_ends_at)}</p>

          {state === "open" && (
            <div className="rounded-lg bg-blue-50 px-3 py-2 text-blue-700">마감 전까지 입찰가 수정/취소가 가능합니다.</div>
          )}
          {state === "closed" && (
            <div className="rounded-lg bg-amber-50 px-3 py-2 text-amber-700">입찰이 마감되었습니다. 결과 확정 여부를 다시 조회할 수 있습니다.</div>
          )}
          {state === "lost" && (
            <div className="rounded-lg bg-slate-100 px-3 py-2 text-slate-700">이번 입찰에서 낙찰되지 않았습니다.</div>
          )}
          {state === "won" && (
            <div className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700">축하합니다. 해당 매물에 낙찰되었습니다.</div>
          )}
          {state === "cancelled" && (
            <div className="rounded-lg bg-rose-50 px-3 py-2 text-rose-700">입찰이 취소된 상태입니다. 필요 시 다시 입찰할 수 있습니다.</div>
          )}

          <div className="flex flex-wrap gap-2 pt-3">
            {state === "open" && (
              <>
                <Button asChild type="button" variant="outline">
                  <Link to={`/dealer/bids/${row.vehicle_id}/edit`}>입찰가 수정</Link>
                </Button>
                <Button disabled={acting} onClick={() => void cancelBid()} type="button" variant="secondary">
                  입찰 취소
                </Button>
              </>
            )}

            {state === "closed" && (
              <Button onClick={() => void (async () => {
                if (!token || !vehicleId) return;
                setLoading(true);
                setError(null);
                try {
                  const data = await listMyDealerBids(token);
                  const matched = data.find((item) => item.vehicle_id === vehicleId) ?? null;
                  setRow(matched);
                  if (!matched) setError("최신 입찰 결과를 찾을 수 없습니다.");
                } catch (err) {
                  setError(err instanceof Error ? err.message : "입찰 결과 새로고침 실패");
                } finally {
                  setLoading(false);
                }
              })()} type="button" variant="outline">
                결과 다시 조회
              </Button>
            )}

            {state === "lost" && (
              <Button asChild className="bg-[#2f6ff5] hover:bg-[#2459cd]" type="button">
                <Link to="/dealer/market">유사 매물 보기</Link>
              </Button>
            )}

            {state === "won" && (
              <Button asChild className="bg-[#2f6ff5] hover:bg-[#2459cd]" type="button">
                <Link to={`/dealer/transactions/${row.vehicle_id}/detail/inspection`}>거래·결제 진행</Link>
              </Button>
            )}

            {state === "cancelled" && (
              <Button asChild className="bg-[#2f6ff5] hover:bg-[#2459cd]" type="button">
                <Link to={`/dealer/market/${row.vehicle_id}/bid`}>다시 입찰하기</Link>
              </Button>
            )}

            <Button asChild type="button" variant="outline">
              <Link to={`/dealer/market/${row.vehicle_id}`}>매물 상세 보기</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
