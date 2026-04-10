import { CarFront, Lightbulb, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { useAuth } from "../app/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { closeSellerBidding, listMyVehicles } from "../lib/api";
import type { Vehicle } from "../lib/types";

function vehicleStatusBadge(status: Vehicle["status"]) {
  if (status === "ACTIVE") return <Badge>입찰중</Badge>;
  if (status === "SOLD") return <Badge variant="secondary">거래완료</Badge>;
  return <Badge variant="outline">유찰</Badge>;
}

type VehicleTabKey = "ALL" | "BIDDING" | "BIDDING_CLOSED" | "INSPECTION" | "NEGOTIATION" | "SETTLEMENT" | "COMPLETED";

const vehicleTabs: Array<{ key: VehicleTabKey; label: string }> = [
  { key: "ALL", label: "전체" },
  { key: "BIDDING", label: "입찰 중" },
  { key: "BIDDING_CLOSED", label: "입찰 마감" },
  { key: "INSPECTION", label: "검차" },
  { key: "NEGOTIATION", label: "감가 협의" },
  { key: "SETTLEMENT", label: "인도/정산" },
  { key: "COMPLETED", label: "거래 완료" },
];

function matchesVehicleTab(vehicle: Vehicle, tab: VehicleTabKey) {
  if (tab === "ALL") return true;
  if (tab === "BIDDING") return vehicle.status === "ACTIVE";
  if (tab === "BIDDING_CLOSED") return vehicle.status === "CANCELLED";
  if (tab === "COMPLETED") return vehicle.status === "SOLD";
  return false;
}

function vehicleCardStatus(vehicle: Vehicle) {
  if (vehicle.status === "ACTIVE") return "입찰 중";
  if (vehicle.status === "SOLD") return "거래 완료";
  return "입찰 마감";
}

function vehiclePrimaryAction(vehicle: Vehicle) {
  if (vehicle.status === "ACTIVE") return { label: "입찰현황", href: `/seller/vehicles/${vehicle.id}/bids` };
  if (vehicle.status === "CANCELLED") return { label: "입찰자 선택하기", href: `/seller/vehicles/${vehicle.id}` };
  return { label: "정산 확인", href: "/seller/settlement" };
}

export function SellerVehiclesPage() {
  const { token, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<VehicleTabKey>("ALL");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showRegisteredNotice, setShowRegisteredNotice] = useState(searchParams.get("registered") === "1");

  const load = async () => {
    if (!token) return;
    try {
      const rows = await listMyVehicles(token);
      setVehicles(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "목록 조회 실패");
    }
  };

  useEffect(() => {
    void load();
  }, [token]);

  const closeBidding = async (vehicleId: string, forceClose = false) => {
    if (!token) return;
    setClosingId(vehicleId);
    setError(null);
    try {
      await closeSellerBidding(token, vehicleId, forceClose);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "마감 처리 실패");
    } finally {
      setClosingId(null);
    }
  };

  const hasVehicles = vehicles.length > 0;
  const showInitialEmpty = !hasVehicles;

  const filteredVehicles = useMemo(() => {
    const normalizedKeyword = searchKeyword.trim().toLowerCase();
    return vehicles
      .filter((vehicle) => matchesVehicleTab(vehicle, selectedTab))
      .filter((vehicle) => {
        if (!normalizedKeyword) return true;
        return vehicle.title.toLowerCase().includes(normalizedKeyword) || (vehicle.license_plate ?? "").toLowerCase().includes(normalizedKeyword);
      })
      .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime());
  }, [searchKeyword, selectedTab, vehicles]);

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{user?.full_name || "판매자"} 님, 환영합니다!</h1>
        <p className="text-sm text-muted-foreground">진행 중인 차량과 입찰 상황을 한눈에 확인하세요.</p>
      </div>

      {showRegisteredNotice && (
        <Alert className="border-emerald-200 bg-emerald-50">
          <AlertTitle className="text-emerald-700">차량 등록 완료</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-2 text-emerald-700">
            차량 등록이 완료되었습니다.
            <button
              className="text-emerald-700/70 hover:text-emerald-700"
              onClick={() => {
                setShowRegisteredNotice(false);
                setSearchParams((prev) => {
                  const next = new URLSearchParams(prev);
                  next.delete("registered");
                  return next;
                });
              }}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>요청 실패</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {showInitialEmpty && (
        <div className="px-4 py-16">
          <div className="mx-auto max-w-xl space-y-8 text-center">
            <div className="space-y-4">
              <div className="mx-auto inline-flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-sm">
                <CarFront className="h-12 w-12 text-slate-700" />
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">등록된 차량이 없습니다.</h2>
              <p className="text-lg text-slate-600">
                차량 정보를 입력하면
                <br />
                Template 딜러들의 입찰을 받을 수 있습니다.
              </p>
              <div className="pt-1">
                <Button asChild size="lg" className="h-10 rounded-md bg-[#2f6ff5] px-5 text-sm font-semibold hover:bg-[#2459cd]">
                  <Link to="/seller/vehicles/register">
                    <Plus className="mr-1 h-4 w-4" />새 차량 등록하기
                  </Link>
                </Button>
              </div>
            </div>
            <Card className="mx-auto max-w-md border-slate-200 bg-white/70 text-left shadow-none">
              <CardContent className="space-y-2 py-5 text-sm text-slate-600">
                <p className="inline-flex items-center gap-1 font-semibold text-slate-800">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  판매자 가이드
                </p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>차량 정보는 최대한 정확하게 입력할수록 높은 입찰가를 받을 수 있어요.</li>
                  <li>국내·해외 딜러의 입찰을 모두 받을 수 있습니다.</li>
                  <li>차량 등록 후 입찰이 자동으로 시작됩니다.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {!showInitialEmpty && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {vehicleTabs.map((tab) => (
                <button
                  key={tab.key}
                  className={`h-9 rounded-full px-4 text-sm font-medium transition-colors ${
                    selectedTab === tab.key ? "bg-[#2f6ff5] text-white" : "bg-white text-slate-500 hover:text-slate-700"
                  }`}
                  onClick={() => setSelectedTab(tab.key)}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <Button asChild className="bg-[#2f6ff5] hover:bg-[#2459cd]">
              <Link to="/seller/vehicles/register">
                <Plus className="mr-1 h-4 w-4" />새 차량 등록하기
              </Link>
            </Button>
          </div>

          <Card className="border-slate-200">
            <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4">
              <p className="text-sm text-slate-500">최신 등록순</p>
              <Input
                className="h-9 w-full max-w-xs border-slate-200 bg-white"
                onChange={(event) => setSearchKeyword(event.target.value)}
                placeholder="차량명 또는 차량번호 검색"
                value={searchKeyword}
              />
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredVehicles.map((vehicle) => {
              const primaryAction = vehiclePrimaryAction(vehicle);
              return (
                <Card key={vehicle.id} className="overflow-hidden border-slate-200 shadow-sm">
                  <CardContent className="p-0">
                    <div className="flex h-36 items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                      <CarFront className="h-12 w-12 text-slate-500" />
                    </div>
                    <div className="space-y-3 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-base">{vehicle.title}</CardTitle>
                        {vehicleStatusBadge(vehicle.status)}
                      </div>
                      <CardDescription className="line-clamp-1 text-xs">
                        {vehicle.make} {vehicle.model} / {vehicle.year}년 / {vehicle.mileage_km.toLocaleString()}km
                      </CardDescription>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <Badge variant="outline">{vehicle.transaction_type === "DOMESTIC" ? "국내 거래" : "수출 가능"}</Badge>
                        <span>{vehicleCardStatus(vehicle)}</span>
                      </div>
                      <p className="text-xs text-slate-500">차량번호 {vehicle.license_plate || "-"}</p>
                      <p className="text-sm font-semibold text-slate-800">희망가 {vehicle.reserve_price.toLocaleString()} {vehicle.currency}</p>
                      <p className="text-xs text-slate-500">입찰 마감 {new Date(vehicle.bidding_ends_at).toLocaleString()}</p>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/seller/vehicles/${vehicle.id}`}>상세보기</Link>
                        </Button>
                        <Button asChild size="sm">
                          <Link to={primaryAction.href}>{primaryAction.label}</Link>
                        </Button>
                      </div>
                      {vehicle.status === "ACTIVE" && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          <Button type="button" size="sm" variant="outline" onClick={() => void closeBidding(vehicle.id)} disabled={closingId === vehicle.id}>
                            마감 처리
                          </Button>
                          <Button type="button" size="sm" variant="secondary" onClick={() => void closeBidding(vehicle.id, true)} disabled={closingId === vehicle.id}>
                            강제 마감
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredVehicles.length === 0 && (
            <Card className="border-slate-200">
              <CardContent className="py-10 text-center text-sm text-slate-500">조건에 맞는 차량이 없습니다.</CardContent>
            </Card>
          )}
        </>
      )}
    </section>
  );
}
