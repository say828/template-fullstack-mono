import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useAuth } from "../../app/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { listMarketVehicles } from "../../lib/api";
import type { MarketListing } from "../../lib/types";
import {
  biddingStateText,
  currencyText,
  daysLeftLabel,
  fuelTypeText,
  transactionTypeText,
} from "./shared";

export type DealerListingTab = "info" | "photos" | "inspection" | "terms";

interface DealerListingDetailPageProps {
  tab?: DealerListingTab;
}

const detailTabs: Array<{ key: DealerListingTab; label: string }> = [
  { key: "info", label: "차량 정보" },
  { key: "photos", label: "사진/영상" },
  { key: "inspection", label: "검차/감가 안내" },
  { key: "terms", label: "거래 조건" },
];

function statusBadge(state: MarketListing["bidding_state"]) {
  if (state === "OPEN") return <Badge className="bg-[#2f6ff5]">입찰 중</Badge>;
  if (state === "CLOSING_SOON") return <Badge variant="secondary">마감 임박</Badge>;
  return <Badge variant="outline">입찰 마감</Badge>;
}

function tabRoute(vehicleId: string, tab: DealerListingTab) {
  if (tab === "info") return `/dealer/market/${vehicleId}`;
  if (tab === "photos") return `/dealer/market/${vehicleId}/photos`;
  if (tab === "inspection") return `/dealer/market/${vehicleId}/inspection`;
  return `/dealer/market/${vehicleId}/terms`;
}

export function DealerListingDetailPage({ tab = "info" }: DealerListingDetailPageProps) {
  const { token } = useAuth();
  const { vehicleId } = useParams<{ vehicleId: string }>();

  const [vehicle, setVehicle] = useState<MarketListing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        const matched = rows.find((row) => row.id === vehicleId);
        setVehicle(matched ?? null);
        if (!matched) setError("매물 정보를 찾을 수 없습니다.");
      } catch (err) {
        setVehicle(null);
        setError(err instanceof Error ? err.message : "상세 조회 실패");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [token, vehicleId]);

  const photoItems = useMemo(
    () =>
      [
        "외관 전면",
        "외관 후면",
        "운전석 내부",
        "2열 시트",
        "계기판",
        "타이어",
      ].map((label, index) => ({ id: index + 1, label })),
    [],
  );

  if (!vehicle && loading) {
    return <section className="space-y-4"><p className="text-sm text-slate-500">상세 정보를 불러오는 중...</p></section>;
  }

  if (!vehicle) {
    return (
      <section className="space-y-4">
        <header className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900">매물 상세 정보</h1>
          <p className="text-sm text-slate-500">매물 데이터를 불러오지 못했습니다.</p>
        </header>
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
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-3xl font-black text-slate-900">매물 상세 정보</h1>
        <p className="text-sm text-slate-500">
          {tab === "info" && "DL_004 매물상세(정보)"}
          {tab === "photos" && "DL_005 매물상세(사진영상)"}
          {tab === "inspection" && "DL_007 매물상세(검차감가안내)"}
          {tab === "terms" && "DL_008 매물상세(거래조건)"}
        </p>
      </header>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>조회 실패</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && <p className="text-sm text-slate-500">상세 정보를 불러오는 중...</p>}

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {statusBadge(vehicle.bidding_state)}
              <Badge variant="outline">{transactionTypeText(vehicle.transaction_type)}</Badge>
            </div>
            <CardTitle className="text-xl">{vehicle.title}</CardTitle>
            <p className="text-sm text-slate-500">
              {vehicle.year}년식 · {(vehicle.mileage_km / 10000).toFixed(1)}만 km · {fuelTypeText(vehicle.fuel_type)} · 차량번호 {vehicle.license_plate || "미입력"}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3">
              {detailTabs.map((item) => (
                <Button
                  asChild
                  key={item.key}
                  size="sm"
                  type="button"
                  variant={tab === item.key ? "default" : "outline"}
                  className={tab === item.key ? "bg-[#2f6ff5] hover:bg-[#2459cd]" : undefined}
                >
                  <Link to={tabRoute(vehicle.id, item.key)}>{item.label}</Link>
                </Button>
              ))}
            </div>

            {tab === "info" && (
              <div className="space-y-2 text-sm text-slate-700">
                <p>제조사/모델: {vehicle.make} {vehicle.model}</p>
                <p>연식/연료: {vehicle.year}년 / {fuelTypeText(vehicle.fuel_type)}</p>
                <p>주행거리: {vehicle.mileage_km.toLocaleString()} km</p>
                <p>거래유형: {transactionTypeText(vehicle.transaction_type)}</p>
                <p>최소 입찰 단위: {currencyText(vehicle.min_bid_increment, vehicle.currency)}</p>
                <p className="text-xs text-slate-500">일부 정보는 판매자 입력값이며 검차 결과에 따라 달라질 수 있습니다.</p>
              </div>
            )}

            {tab === "photos" && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {photoItems.map((photo, index) => (
                  <Link
                    key={photo.id}
                    to={`/dealer/market/${vehicle.id}/image?index=${index}`}
                    className="overflow-hidden rounded-lg border border-slate-200"
                  >
                    <div className="aspect-[4/3] bg-gradient-to-br from-slate-200 to-slate-100" />
                    <p className="px-3 py-2 text-xs text-slate-600">{photo.label}</p>
                  </Link>
                ))}
              </div>
            )}

            {tab === "inspection" && (
              <div className="space-y-3 text-sm text-slate-700">
                <p>검차는 낙찰 완료 후 일정 조율을 통해 진행되며, 결과 리포트는 PDF로 제공됩니다.</p>
                <p>검차 완료 후 감가 협의 단계에서 딜러가 감가 항목과 금액을 제안할 수 있습니다.</p>
                <p>합의된 감가 금액은 인도 및 송금 정산 단계의 최종 거래금액으로 반영됩니다.</p>
                <p className="text-xs text-slate-500">검차 일정/감가 협의는 거래·결제 상세 화면에서 상태별로 확인할 수 있습니다.</p>
              </div>
            )}

            {tab === "terms" && (
              <div className="space-y-3 text-sm text-slate-700">
                <p>인도 방식: 판매자-딜러 일정 확정 후 직접 인도 또는 탁송 인도</p>
                <p>결제 방식: 계좌이체(송금 완료 등록 후 운영 확인)</p>
                <p>수수료 정책: 거래 확정 후 플랫폼 수수료가 적용됩니다.</p>
                <p>취소/패널티: 마감 이후 임의 취소 시 운영 정책에 따른 제재가 적용될 수 있습니다.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">입찰 현황</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">현재 최고 입찰가</span>
              <span className="font-semibold text-slate-900">{currencyText(vehicle.highest_bid ?? vehicle.reserve_price, vehicle.currency)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">입찰 건수</span>
              <span className="font-semibold text-slate-900">{vehicle.bid_count}건</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">마감까지</span>
              <span className="font-semibold text-slate-900">{daysLeftLabel(vehicle.time_left_seconds)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">상태</span>
              <span className="font-semibold text-slate-900">{biddingStateText(vehicle.bidding_state)}</span>
            </div>
            <div className="pt-2">
              <Button asChild className="w-full bg-[#2f6ff5] hover:bg-[#2459cd]" type="button">
                <Link to={`/dealer/market/${vehicle.id}/bid`}>입찰 참여</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
