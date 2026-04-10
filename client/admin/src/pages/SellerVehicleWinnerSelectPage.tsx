import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useAuth } from "../app/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { closeSellerBidding, getSellerVehicleDetail, listSellerVehicleBids } from "../lib/api";
import type { SellerVehicleBid, SellerVehicleDetail } from "../lib/types";

export function SellerVehicleWinnerSelectPage() {
  const { token } = useAuth();
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const [detail, setDetail] = useState<SellerVehicleDetail | null>(null);
  const [rows, setRows] = useState<SellerVehicleBid[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!token || !vehicleId) return;
    setLoading(true);
    setError(null);
    try {
      const [vehicle, bids] = await Promise.all([
        getSellerVehicleDetail(token, vehicleId),
        listSellerVehicleBids(token, vehicleId),
      ]);
      setDetail(vehicle);
      setRows(bids);
    } catch (err) {
      setError(err instanceof Error ? err.message : "입찰자 선택 데이터 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [token, vehicleId]);

  const confirmWinner = async (forceClose = false) => {
    if (!token || !vehicleId) return;
    setSubmitting(true);
    setError(null);
    try {
      await closeSellerBidding(token, vehicleId, forceClose);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "낙찰 확정 실패");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className="mx-auto max-w-4xl">
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">입찰자 선택 데이터를 불러오는 중...</CardContent>
        </Card>
      </section>
    );
  }

  if (!detail) {
    return (
      <section className="mx-auto max-w-4xl">
        <Card>
          <CardContent className="space-y-3 pt-6">
            <p className="text-sm">차량 정보를 찾을 수 없습니다.</p>
            <Button asChild variant="outline" size="sm">
              <Link to="/seller/vehicles">내 차량으로 이동</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>입찰자 선택</CardTitle>
          <CardDescription>
            {detail.title} / 현재 상태 {detail.status} / 입찰수 {detail.bid_count}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to={`/seller/vehicles/${detail.id}`}>차량 상세</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to={`/seller/vehicles/${detail.id}/bids`}>입찰현황</Link>
          </Button>
          {detail.status === "ACTIVE" && (
            <>
              <Button type="button" size="sm" onClick={() => void confirmWinner(false)} disabled={submitting || rows.length === 0}>
                최고가 낙찰 확정
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => void confirmWinner(true)} disabled={submitting}>
                유찰(강제마감)
              </Button>
            </>
          )}
          {detail.status !== "ACTIVE" && <Badge variant="secondary">마감 처리 완료</Badge>}
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>요청 실패</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-3">
        {rows.map((row, idx) => (
          <Card key={row.id} className={idx === 0 && row.status === "ACTIVE" ? "border-primary/50 ring-1 ring-primary/30" : undefined}>
            <CardContent className="space-y-2 pt-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">
                  {row.dealer_name} ({row.dealer_email})
                </p>
                <div className="flex items-center gap-2">
                  {idx === 0 && row.status === "ACTIVE" && <Badge>낙찰 후보</Badge>}
                  <Badge variant={row.status === "ACTIVE" ? "outline" : "secondary"}>{row.status}</Badge>
                </div>
              </div>
              <p className="text-sm">
                입찰가: {row.amount.toLocaleString()} / 순위 {idx + 1}
              </p>
              <p className="text-xs text-muted-foreground">수정시각: {new Date(row.updated_at).toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
        {rows.length === 0 && <p className="text-sm text-muted-foreground">입찰 내역이 없습니다.</p>}
      </div>
    </section>
  );
}
