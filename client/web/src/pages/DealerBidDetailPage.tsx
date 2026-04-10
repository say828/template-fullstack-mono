import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../app/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { cancelMyBid, listMarketVehicles, listMyDealerBids, updateMyBid } from "../lib/api";
import type { DealerBid, MarketListing } from "../lib/types";

const DEALER_BID_EDIT_SPEC_CODES = [
  "BD-43",
  "BD-44",
  "BD-45",
  "BD-46",
  "BD-47",
  "BD-48",
  "BD-49",
  "BD-50",
  "BD-51",
  "BD-52",
  "BD-53",
  "BD-54",
] as const;
const DEALER_BID_LIVE_SPEC_CODES = ["BD-55", "BD-56", "BD-57", "BD-58", "BD-59", "BD-60", "BD-62", "BD-63", "BD-64"] as const;
const DEALER_BID_RESULT_SPEC_CODES = [
  "BD-66",
  "BD-67",
  "BD-68",
  "BD-69",
  "BD-70",
  "BD-71",
  "BD-72",
  "BD-73",
  "BD-74",
  "BD-75",
  "BD-76",
  "BD-77",
  "BD-78",
  "BD-79",
  "BD-80",
  "BD-81",
  "BD-82",
  "BD-83",
  "BD-84",
  "BD-85",
  "BD-86",
  "BD-87",
] as const;

function formatTimeLeft(seconds: number): string {
  const safe = Math.max(0, seconds);
  const days = Math.floor(safe / 86_400);
  const hours = Math.floor((safe % 86_400) / 3_600);
  const minutes = Math.floor((safe % 3_600) / 60);
  if (days > 0) return `${days}일 ${hours}시간`;
  if (hours > 0) return `${hours}시간 ${minutes}분`;
  return `${minutes}분`;
}

function bidStatusBadge(bid: DealerBid) {
  if (bid.status === "WON") return <Badge variant="secondary">낙찰</Badge>;
  if (bid.status === "LOST") return <Badge variant="outline">미낙찰</Badge>;
  if (bid.status === "CANCELLED") return <Badge variant="destructive">취소됨</Badge>;
  if (bid.bidding_state === "CLOSED") return <Badge variant="outline">마감</Badge>;
  return <Badge>입찰중</Badge>;
}

function formatAmount(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "-";
  return amount.toLocaleString();
}

export function DealerBidDetailPage() {
  const { token } = useAuth();
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const navigate = useNavigate();

  const [bid, setBid] = useState<DealerBid | null>(null);
  const [listing, setListing] = useState<MarketListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editAmount, setEditAmount] = useState("");
  const [editAgreed, setEditAgreed] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const load = async (silent = false) => {
    if (!token || !vehicleId) return;
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const allBids = await listMyDealerBids(token);
      const target = allBids.find((row) => row.vehicle_id === vehicleId) ?? null;
      setBid(target);

      if (target && target.status === "ACTIVE" && target.bidding_state !== "CLOSED") {
        const listings = await listMarketVehicles(token, {
          keyword: target.title,
          sort: "NEWEST",
          limit: 50,
        });
        const currentListing = listings.find((row) => row.id === vehicleId) ?? null;
        setListing(currentListing);
      } else {
        setListing(null);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "입찰 상세를 불러오지 못했습니다.");
    } finally {
      if (silent) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, vehicleId]);

  useEffect(() => {
    if (!token || !vehicleId) return undefined;
    const timer = window.setInterval(() => {
      void load(true);
    }, 15_000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, vehicleId]);

  const canEdit = bid?.status === "ACTIVE" && bid.bidding_state !== "CLOSED";
  const canCancel = canEdit;
  const isClosedAwaitingResult = bid?.status === "ACTIVE" && bid.bidding_state === "CLOSED";
  const isWon = bid?.status === "WON";
  const isLost = bid?.status === "LOST";
  const isCancelled = bid?.status === "CANCELLED";

  const editValidationError = useMemo(() => {
    if (!bid) return "입찰 정보를 찾을 수 없습니다.";
    const amount = Number(editAmount || 0);
    if (!Number.isFinite(amount) || amount <= 0) return "입찰 금액을 입력해 주세요.";
    if (bid.status !== "ACTIVE" || bid.bidding_state === "CLOSED") return "마감된 건은 수정할 수 없습니다.";
    if (amount < bid.reserve_price) return `입찰 시작가(${bid.reserve_price.toLocaleString()}) 이상이어야 합니다.`;

    const minIncrement = listing?.min_bid_increment;
    if (minIncrement && amount % minIncrement !== 0) {
      return `최소 호가 단위(${minIncrement.toLocaleString()}) 배수로 입력해 주세요.`;
    }

    const highestBid = listing?.highest_bid ?? bid.highest_bid ?? 0;
    if (highestBid > 0 && amount <= highestBid) {
      return `현재 최고입찰(${highestBid.toLocaleString()})보다 높은 금액만 입력할 수 있습니다.`;
    }

    return null;
  }, [bid, editAmount, listing]);

  const openEditDialog = () => {
    if (!bid) return;
    setEditAmount(String(Math.round(bid.amount)));
    setEditAgreed(false);
    setEditError(null);
    setEditOpen(true);
  };

  const submitEditBid = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !bid || !canEdit) return;
    if (editValidationError) {
      setEditError(editValidationError);
      return;
    }
    if (!editAgreed) {
      setEditError("수정 내용 확인 동의가 필요합니다.");
      return;
    }

    setActing(true);
    setEditError(null);
    setError(null);
    setMessage(null);
    try {
      await updateMyBid(token, bid.vehicle_id, Number(editAmount));
      await load(true);
      setEditOpen(false);
      setMessage("입찰가가 수정되었습니다.");
      navigate(`/dealer/bids?updated=${bid.vehicle_id}`);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "입찰가 수정에 실패했습니다.");
    } finally {
      setActing(false);
    }
  };

  const cancelBid = async () => {
    if (!token || !bid || !canCancel) return;
    const confirmed = window.confirm("입찰을 취소하시겠습니까? 취소 후에는 동일 건을 다시 확인해야 합니다.");
    if (!confirmed) return;

    setActing(true);
    setError(null);
    setMessage(null);
    try {
      await cancelMyBid(token, bid.vehicle_id);
      setMessage("입찰이 취소되었습니다.");
      await load(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "입찰 취소에 실패했습니다.");
    } finally {
      setActing(false);
    }
  };

  const checkAndMoveRebid = async () => {
    if (!token || !bid) return;
    setActing(true);
    setError(null);
    setMessage(null);
    try {
      const listings = await listMarketVehicles(token, {
        keyword: bid.title,
        sort: "NEWEST",
        limit: 50,
      });
      const currentListing = listings.find((row) => row.id === bid.vehicle_id) ?? null;
      if (!currentListing || currentListing.bidding_state === "CLOSED") {
        setError("해당 매물은 이미 마감/종료되어 재입찰할 수 없습니다.");
        return;
      }
      setMessage("재입찰 가능한 매물입니다. 매물 화면으로 이동합니다.");
      navigate(`/dealer/market?vehicleId=${currentListing.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "재입찰 가능 여부 확인에 실패했습니다.");
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <section className="space-y-4">
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">입찰 상세를 불러오는 중...</CardContent>
        </Card>
      </section>
    );
  }

  if (!bid) {
    return (
      <section className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>입찰 정보를 찾을 수 없습니다.</CardTitle>
            <CardDescription>목록에서 다시 선택해 주세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="sm" variant="outline">
              <Link to="/dealer/bids">나의 입찰로 돌아가기</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  const highestBid = listing?.highest_bid ?? bid.highest_bid ?? null;
  const bidCount = listing?.bid_count ?? null;
  const myBidGap = highestBid !== null ? Math.max(0, highestBid - bid.amount) : 0;

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">입찰 상세</h1>
        <p className="text-sm text-muted-foreground">입찰 상태와 후속 액션을 확인합니다.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-lg">{bid.title}</CardTitle>
            {bidStatusBadge(bid)}
          </div>
          <CardDescription>
            {bid.make} {bid.model}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm md:grid-cols-2" data-spec-codes={DEALER_BID_LIVE_SPEC_CODES.join(",")}>
          <p>
            내 입찰가: <span className="font-medium">{formatAmount(bid.amount)} {bid.currency}</span>
          </p>
          <p>
            현재 최고 입찰가: <span className="font-medium">{formatAmount(highestBid)} {bid.currency}</span>
          </p>
          <p>
            입찰 건수: <span className="font-medium">{bidCount === null ? "-" : bidCount.toLocaleString()}</span>
          </p>
          <p>
            남은 시간: <span className="font-medium">{formatTimeLeft(bid.time_left_seconds)}</span>
          </p>
          <p>
            마감 시각: <span className="font-medium">{new Date(bid.bidding_ends_at).toLocaleString()}</span>
          </p>
          <p>
            최근 변경: <span className="font-medium">{new Date(bid.updated_at).toLocaleString()}</span>
          </p>
        </CardContent>
      </Card>

      {canEdit && highestBid !== null && (
        <Alert variant={myBidGap > 0 ? "destructive" : "default"}>
          <AlertTitle>{myBidGap > 0 ? "최고가보다 낮습니다." : "현재 최고가 입니다."}</AlertTitle>
          <AlertDescription>
            {myBidGap > 0 ? `최고가 대비 ${myBidGap.toLocaleString()} ${bid.currency} 낮습니다.` : "현재 상태를 유지하려면 주기적으로 결과를 확인해 주세요."}
          </AlertDescription>
        </Alert>
      )}

      {isClosedAwaitingResult && (
        <Alert>
          <AlertTitle>입찰이 마감되었습니다.</AlertTitle>
          <AlertDescription>현재 낙찰 결과를 확인 중입니다. 결과 새로고침으로 확정 상태를 다시 조회할 수 있습니다.</AlertDescription>
        </Alert>
      )}

      {isLost && (
        <Alert>
          <AlertTitle>미낙찰 결과</AlertTitle>
          <AlertDescription>이번 입찰에서 낙찰되지 않았습니다. 유사 매물 보기로 다음 입찰을 진행할 수 있습니다.</AlertDescription>
        </Alert>
      )}

      {isWon && (
        <Alert>
          <AlertTitle>낙찰 확정</AlertTitle>
          <AlertDescription>축하합니다. 해당 매물에 낙찰되었습니다. 거래·결제 진행으로 후속 절차를 시작해 주세요.</AlertDescription>
        </Alert>
      )}

      {isCancelled && (
        <Alert>
          <AlertTitle>입찰 취소됨</AlertTitle>
          <AlertDescription>입찰이 취소되었습니다. 다시 입찰하기에서 매물 상태를 재검증한 후 재진입할 수 있습니다.</AlertDescription>
        </Alert>
      )}

      {isClosedAwaitingResult && (
        <Card data-spec-codes={DEALER_BID_RESULT_SPEC_CODES.join(",")}>
          <CardHeader>
            <CardTitle className="text-base">마감 결과 확인중</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm md:grid-cols-2">
            <p>상태: <span className="font-medium">마감</span></p>
            <p>내 입찰가: <span className="font-medium">{formatAmount(bid.amount)} {bid.currency}</span></p>
            <p>최고 입찰가: <span className="font-medium">{formatAmount(highestBid)} {bid.currency}</span></p>
            <p>마감 시각: <span className="font-medium">{new Date(bid.bidding_ends_at).toLocaleString()}</span></p>
          </CardContent>
        </Card>
      )}

      {isLost && (
        <Card data-spec-codes={DEALER_BID_RESULT_SPEC_CODES.join(",")}>
          <CardHeader>
            <CardTitle className="text-base">미낙찰 결과</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm md:grid-cols-2">
            <p>상태: <span className="font-medium">마감</span></p>
            <p>내 입찰가: <span className="font-medium">{formatAmount(bid.amount)} {bid.currency}</span></p>
            <p>최종 낙찰가: <span className="font-medium">{formatAmount(highestBid)} {bid.currency}</span></p>
            <p>마감 시각: <span className="font-medium">{new Date(bid.bidding_ends_at).toLocaleString()}</span></p>
          </CardContent>
        </Card>
      )}

      {isWon && (
        <Card data-spec-codes={DEALER_BID_RESULT_SPEC_CODES.join(",")}>
          <CardHeader>
            <CardTitle className="text-base">낙찰 확정 정보</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm md:grid-cols-2">
            <p>상태: <span className="font-medium">마감</span></p>
            <p>낙찰가: <span className="font-medium">{formatAmount(bid.amount)} {bid.currency}</span></p>
            <p>낙찰 시각: <span className="font-medium">{new Date(bid.updated_at).toLocaleString()}</span></p>
            <p>거래 유형: <span className="font-medium">거래·결제 진행</span></p>
            <p className="md:col-span-2 text-muted-foreground">후속 단계: 거래·결제 → 검차 일정 → 감가 제안</p>
          </CardContent>
        </Card>
      )}

      {isCancelled && (
        <Card data-spec-codes={DEALER_BID_RESULT_SPEC_CODES.join(",")}>
          <CardHeader>
            <CardTitle className="text-base">취소 이력</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm md:grid-cols-2">
            <p>취소된 입찰가: <span className="font-medium">{formatAmount(bid.amount)} {bid.currency}</span></p>
            <p>취소 시각: <span className="font-medium">{new Date(bid.updated_at).toLocaleString()}</span></p>
            <p className="md:col-span-2 text-muted-foreground">
              취소된 입찰은 거래/정산/검차 프로세스에서 분리되며, 나의 입찰의 취소됨 상태 이력으로 유지됩니다.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">액션</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2" data-spec-codes={DEALER_BID_LIVE_SPEC_CODES.join(",")}>
          <Button asChild type="button" variant="outline" size="sm">
            <Link to="/dealer/bids">나의 입찰로 돌아가기</Link>
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => void load(true)} disabled={refreshing || acting}>
            {refreshing ? "새로고침 중..." : "새로고침"}
          </Button>

          {canEdit && (
            <Button type="button" size="sm" onClick={openEditDialog} disabled={acting}>
              입찰가 수정
            </Button>
          )}

          {canCancel && (
            <Button type="button" size="sm" variant="secondary" onClick={() => void cancelBid()} disabled={acting}>
              입찰 취소
            </Button>
          )}

          {isClosedAwaitingResult && (
            <Button type="button" size="sm" variant="outline" onClick={() => void load(true)} disabled={refreshing || acting}>
              결과 새로고침
            </Button>
          )}

          {isLost && (
            <Button asChild type="button" size="sm" variant="outline">
              <Link to={`/dealer/market?similar=${bid.vehicle_id}`}>유사 매물 보기</Link>
            </Button>
          )}

          {isWon && (
            <Button asChild type="button" size="sm">
              <Link to={`/dealer/trades/${bid.vehicle_id}`}>거래·결제 진행</Link>
            </Button>
          )}

          {isCancelled && (
            <Button type="button" size="sm" onClick={() => void checkAndMoveRebid()} disabled={acting}>
              다시 입찰하기
            </Button>
          )}
        </CardContent>
      </Card>

      {message && (
        <Alert>
          <AlertTitle>처리 완료</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>요청 실패</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>입찰가 수정</DialogTitle>
            <DialogDescription>입력값 검증과 동의 확인 후 수정이 적용됩니다.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitEditBid}>
            <div className="rounded-md border border-border/80 p-3 text-sm" data-spec-codes={DEALER_BID_EDIT_SPEC_CODES.join(",")}>
              <div className="grid gap-3 md:grid-cols-[120px_1fr]">
                <div className="flex h-20 items-center justify-center rounded-md border border-border bg-muted/30 text-xs text-muted-foreground">
                  썸네일
                </div>
                <div className="space-y-1">
                  <p className="font-medium">{bid.title}</p>
                  <p className="text-muted-foreground">
                    {bid.make} {bid.model} / 연식 {listing?.year ?? "-"} / 주행거리 {listing?.mileage_km?.toLocaleString() ?? "-"}km / 연료{" "}
                    {listing?.fuel_type ?? "-"}
                  </p>
                  <p className="text-muted-foreground">
                    현재 최고 입찰가: {formatAmount(highestBid)} {bid.currency}
                  </p>
                  <p className="text-muted-foreground">
                    현재 내 입찰가: {formatAmount(bid.amount)} {bid.currency}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dealer-bid-edit-amount">수정 입찰가</Label>
              <Input
                id="dealer-bid-edit-amount"
                inputMode="numeric"
                value={editAmount ? Number(editAmount).toLocaleString() : ""}
                onChange={(event) => setEditAmount(event.target.value.replace(/[^0-9]/g, ""))}
                placeholder="입찰 금액 입력"
              />
              <div className="flex flex-wrap gap-2">
                {[100_000, 500_000, 1_000_000, 5_000_000].map((delta) => (
                  <Button
                    key={delta}
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const base = Number(editAmount || Math.round(bid.amount));
                      setEditAmount(String(base + delta));
                    }}
                  >
                    +{delta.toLocaleString()}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Checkbox id="dealer-bid-edit-agree" checked={editAgreed} onCheckedChange={(checked) => setEditAgreed(checked === true)} />
              <Label htmlFor="dealer-bid-edit-agree" className="cursor-pointer text-sm font-normal">
                입찰가 수정으로 경쟁 금액이 변경될 수 있음을 확인했습니다.
              </Label>
            </div>

            {(editError || editValidationError) && (
              <p className="text-sm text-destructive">{editError || editValidationError}</p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={acting}>
                취소
              </Button>
              <Button type="submit" disabled={!editAgreed || !!editValidationError || acting}>
                수정 완료
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
