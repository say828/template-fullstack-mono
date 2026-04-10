import { ChevronDown, Lightbulb, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";

import { useAuth } from "../app/AuthContext";
import emptyVehicleImage from "../assets/frt010-empty-vehicle.png";
import vehicleHeroImage from "../assets/seller/vehicle-hero.png";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { listMyVehicles, listSellerTradeWorkflows } from "../lib/api";
import {
  deriveSellerVehicleLifecycleState,
  sellerVehicleLifecycleLabel,
  type SellerVehicleLifecycleState,
} from "../lib/sellerVehicleLifecycle";
import type { TradeWorkflow, Vehicle } from "../lib/types";

type VehicleTabKey = "ALL" | "BIDDING" | "BIDDING_CLOSED" | "INSPECTION" | "DEPRECIATION" | "DELIVERY_SETTLEMENT" | "COMPLETED";

const vehicleTabs: Array<{ key: VehicleTabKey; label: string }> = [
  { key: "ALL", label: "전체" },
  { key: "BIDDING", label: "입찰 중" },
  { key: "BIDDING_CLOSED", label: "입찰 마감" },
  { key: "INSPECTION", label: "검차" },
  { key: "DEPRECIATION", label: "감가 협의" },
  { key: "DELIVERY_SETTLEMENT", label: "인도/정산" },
  { key: "COMPLETED", label: "거래 완료" },
];

function matchesVehicleTab(state: SellerVehicleLifecycleState, tab: VehicleTabKey) {
  if (tab === "ALL") return true;
  if (tab === "BIDDING") return state === "BIDDING";
  if (tab === "BIDDING_CLOSED") return state === "BIDDING_CLOSED" || state === "FAILED";
  if (tab === "INSPECTION") return state === "INSPECTION";
  if (tab === "DEPRECIATION") return state === "DEPRECIATION";
  if (tab === "DELIVERY_SETTLEMENT") return state === "DELIVERY_SETTLEMENT";
  if (tab === "COMPLETED") return state === "COMPLETED";
  return false;
}

function vehicleStatusBadge(state: SellerVehicleLifecycleState) {
  const label = sellerVehicleLifecycleLabel(state);
  if (label === "검차") return <Badge className="border-emerald-300 bg-emerald-600/95 text-white shadow-sm hover:bg-emerald-600">{label}</Badge>;
  if (label === "감가 협의") return <Badge className="border-amber-300 bg-amber-500/95 text-white shadow-sm hover:bg-amber-500">{label}</Badge>;
  if (label === "인도/정산") return <Badge className="border-orange-300 bg-gradient-to-r from-amber-700 to-orange-500 text-white shadow-sm hover:from-amber-700 hover:to-orange-500">{label}</Badge>;
  if (label === "거래 완료") return <Badge className="border-slate-500 bg-gradient-to-r from-slate-900 to-slate-500 text-white shadow-sm hover:from-slate-900 hover:to-slate-500">{label}</Badge>;
  if (label === "입찰 마감") return <Badge className="border-fuchsia-300 bg-gradient-to-r from-pink-500 to-violet-600 text-white shadow-sm hover:from-pink-500 hover:to-violet-600">{label}</Badge>;
  if (label === "유찰") return <Badge variant="outline">유찰</Badge>;
  if (label === "거래 취소") return <Badge variant="outline">거래 취소</Badge>;
  if (label === "상태 없음") return <Badge variant="outline">상태 없음</Badge>;
  return <Badge className="shadow-sm">입찰중</Badge>;
}

function inspectionDetailHref(vehicleId: string, workflow?: TradeWorkflow) {
  return workflow?.inspection_status === "CONFIRMED"
    ? `/seller/vehicles/${vehicleId}/detail/inspection-completed`
    : `/seller/vehicles/${vehicleId}/detail/inspection-pending`;
}

function vehiclePrimaryAction(vehicle: Vehicle, state: SellerVehicleLifecycleState, workflow?: TradeWorkflow) {
  if (state === "INSPECTION") return { label: "검차 일정 확인", href: inspectionDetailHref(vehicle.id, workflow) };
  if (state === "DEPRECIATION") return { label: "감가 내용 확인", href: `/seller/vehicles/${vehicle.id}/depreciation` };
  if (state === "DELIVERY_SETTLEMENT") return { label: "정산 확인", href: `/seller/settlement/pending/${vehicle.id}` };
  if (state === "BIDDING_CLOSED") return { label: "입찰자 선택하기", href: `/seller/vehicles/${vehicle.id}/detail/closed` };
  if (state === "BIDDING") return { label: "입찰현황", href: `/seller/vehicles/${vehicle.id}/bids` };
  return { label: "상세 보기", href: `/seller/vehicles/${vehicle.id}/detail/closed` };
}

function vehicleDetailHref(vehicle: Vehicle, state: SellerVehicleLifecycleState, workflow?: TradeWorkflow) {
  if (state === "BIDDING") return `/seller/vehicles/${vehicle.id}`;
  if (state === "INSPECTION") return inspectionDetailHref(vehicle.id, workflow);
  return `/seller/vehicles/${vehicle.id}/detail/closed`;
}

export function SellerVehiclesPage() {
  const { token, user } = useAuth();
  const { pathname } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [workflows, setWorkflows] = useState<TradeWorkflow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<VehicleTabKey>("ALL");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showRegisteredNotice, setShowRegisteredNotice] = useState(searchParams.get("registered") === "1");

  const filterButtonClass = (tab: VehicleTabKey) =>
    `inline-flex h-8 items-center justify-center rounded-full px-3 text-sm font-medium transition-colors whitespace-nowrap ${
      selectedTab === tab ? "bg-black text-white shadow-sm hover:bg-black" : "text-slate-500 hover:text-slate-900"
    }`;

  const load = async () => {
    if (!token) return;
    try {
      const rows = await listMyVehicles(token);
      setVehicles(rows);
      try {
        const workflowRows = await listSellerTradeWorkflows(token, { limit: 100 });
        setWorkflows(workflowRows);
      } catch {
        setWorkflows([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "목록 조회 실패");
    }
  };

  useEffect(() => {
    void load();
  }, [token]);

  const hasVehicles = vehicles.length > 0;
  const showInitialEmpty = !hasVehicles;
  const displayName = user?.full_name?.trim() || "판매자";
  const isInitialRoute = pathname === "/seller/vehicles/initial";
  const workflowByVehicleId = useMemo(() => new Map(workflows.map((workflow) => [workflow.vehicle_id, workflow] as const)), [workflows]);

  const filteredVehicles = useMemo(() => {
    const normalizedKeyword = searchKeyword.trim().toLowerCase();
    return vehicles
      .filter((vehicle) => {
        const state = deriveSellerVehicleLifecycleState(vehicle, workflowByVehicleId.get(vehicle.id));
        return matchesVehicleTab(state, selectedTab);
      })
      .filter((vehicle) => {
        if (!normalizedKeyword) return true;
        return vehicle.title.toLowerCase().includes(normalizedKeyword) || (vehicle.license_plate ?? "").toLowerCase().includes(normalizedKeyword);
      })
      .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime());
  }, [searchKeyword, selectedTab, vehicles, workflowByVehicleId]);

  return (
    <section className="space-y-6">
      {!showInitialEmpty && !isInitialRoute && (
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{displayName} 님, 환영합니다!</h1>
          <p className="text-sm text-muted-foreground">진행 중인 차량과 입찰 상황을 한눈에 확인하세요.</p>
        </div>
      )}

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
        <div className="min-h-[calc(100vh-220px)] px-4 pb-10 pt-3">
          <div className="space-y-16">
            <div className="space-y-3">
              <h1 className="text-[2rem] font-extrabold tracking-[-0.03em] text-slate-950">{displayName} 님, 환영합니다!</h1>
              <p className="text-[1.05rem] font-medium text-slate-500">중고차 판매를 시작하려면 먼저 차량을 등록해주세요.</p>
            </div>

            <div className="mx-auto flex max-w-[420px] flex-col items-center text-center">
              <img
                alt="등록 차량 없음"
                className="h-[155px] w-auto object-contain"
                src={emptyVehicleImage}
              />
              <h2 className="mt-3 text-[2rem] font-extrabold tracking-[-0.04em] text-slate-950">등록된 차량이 없습니다.</h2>
              <p className="mt-4 text-[1.02rem] font-semibold leading-8 text-slate-400">
                차량 정보를 입력하면
                <br />
                Template 딜러들의 입찰을 받을 수 있습니다.
              </p>
              <Button
                asChild
                size="lg"
                className="mt-5 h-11 rounded-md bg-[#2f6ff5] px-5 text-[15px] font-semibold shadow-sm hover:bg-[#2459cd]"
              >
                <Link to="/seller/vehicles/register">
                  <Plus className="mr-1 h-4 w-4" />
                  새 차량 등록하기
                </Link>
              </Button>

              <Card className="mt-8 w-full border-0 bg-white/70 text-left shadow-none ring-1 ring-white/70">
                <CardContent className="space-y-3 px-5 py-5 text-[13px] leading-7 text-slate-400">
                  <p className="inline-flex items-center gap-1 text-sm font-bold text-slate-700">
                    <Lightbulb className="h-4 w-4 text-amber-400" />
                    판매자 가이드
                  </p>
                  <ul className="list-disc space-y-1 pl-4">
                    <li>차량 정보는 최대한 정확하게 입력할수록 높은 입찰가를 받을 수 있어요.</li>
                    <li>국내 · 해외 딜러의 입찰을 모두 받을 수 있습니다.</li>
                    <li>차량 등록 후 입찰이 자동으로 시작됩니다.</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {!showInitialEmpty && (
        <>
          {isInitialRoute && (
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">{displayName} 님, 환영합니다!</h1>
              <p className="text-sm text-muted-foreground">진행 중인 차량과 입찰 상황을 한눈에 확인하세요.</p>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button asChild className="bg-[#2f6ff5] hover:bg-[#2459cd]">
              <Link to="/seller/vehicles/register">
                <Plus className="mr-1 h-4 w-4" />새 차량 등록하기
              </Link>
            </Button>
          </div>

          <Card className="border-slate-200">
            <CardContent className="space-y-4 p-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  {vehicleTabs.map((tab) => (
                    <button key={tab.key} className={filterButtonClass(tab.key)} onClick={() => setSelectedTab(tab.key)} type="button">
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="flex w-full items-center gap-2 xl:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 shrink-0 rounded-full border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 shadow-none hover:bg-slate-50"
                  >
                    최신 등록순
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                  <Input
                    className="h-9 min-w-0 flex-1 border-slate-200 bg-white xl:w-[260px]"
                    onChange={(event) => setSearchKeyword(event.target.value)}
                    placeholder="차량명 또는 차량번호 검색"
                    value={searchKeyword}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredVehicles.map((vehicle, index) => {
              const workflow = workflowByVehicleId.get(vehicle.id);
              const lifecycleState = deriveSellerVehicleLifecycleState(vehicle, workflow);
              const primaryAction = vehiclePrimaryAction(vehicle, lifecycleState, workflow);
              const detailHref = vehicleDetailHref(vehicle, lifecycleState, workflow);
              const vehicleImagePosition = ["center 20%", "center 38%", "center 52%", "center 28%", "center 44%", "center 60%"][index % 6];
              const hasSingleAction = primaryAction.label === "상세 보기";
              return (
                <Card key={vehicle.id} className="overflow-hidden border-slate-200 shadow-sm">
                  <CardContent className="p-0">
                    <div className="relative h-44 overflow-hidden bg-slate-100">
                      <img
                        alt={vehicle.title}
                        className="h-full w-full object-cover"
                        src={vehicleHeroImage}
                        style={{ objectPosition: vehicleImagePosition }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-black/0 to-black/0" />
                      <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                        {vehicleStatusBadge(lifecycleState)}
                        <Badge variant="outline" className="bg-white/90 text-slate-700">
                          {vehicle.transaction_type === "DOMESTIC" ? "국내 거래" : "수출 가능"}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-3 p-4">
                      <CardTitle className="text-base">{vehicle.title}</CardTitle>
                      <CardDescription className="line-clamp-1 text-xs">
                        {vehicle.make} {vehicle.model} / {vehicle.year}년 / {vehicle.mileage_km.toLocaleString()}km
                      </CardDescription>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>{sellerVehicleLifecycleLabel(lifecycleState)}</span>
                        <span>차량번호 {vehicle.license_plate || "-"}</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-800">희망가 {vehicle.reserve_price.toLocaleString()} {vehicle.currency}</p>
                      <p className="text-xs text-slate-500">입찰 마감 {new Date(vehicle.bidding_ends_at).toLocaleString()}</p>
                      {hasSingleAction ? (
                        <Button asChild size="sm" className="w-full">
                          <Link to={primaryAction.href}>{primaryAction.label}</Link>
                        </Button>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <Button asChild size="sm" variant="outline">
                            <Link to={detailHref}>상세 보기</Link>
                          </Button>
                          <Button asChild size="sm">
                            <Link to={primaryAction.href}>{primaryAction.label}</Link>
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
