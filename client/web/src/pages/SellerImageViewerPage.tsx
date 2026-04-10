import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import { useAuth } from "../app/AuthContext";
import vehicleHeroImage from "../assets/seller/vehicle-hero.png";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { getSellerVehicleDetail } from "../lib/api";
import type { SellerVehicleDetail } from "../lib/types";

function safeIndex(index: number, length: number) {
  if (length === 0) return 0;
  return ((index % length) + length) % length;
}

export function SellerImageViewerPage() {
  const { token } = useAuth();
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const [searchParams] = useSearchParams();
  const initialIndex = Number(searchParams.get("index") ?? "0");
  const [currentIndex, setCurrentIndex] = useState(Number.isFinite(initialIndex) ? initialIndex : 0);
  const [detail, setDetail] = useState<SellerVehicleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !vehicleId) return;
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const vehicle = await getSellerVehicleDetail(token, vehicleId);
        if (mounted) setDetail(vehicle);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "차량 이미지를 불러오지 못했습니다.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [token, vehicleId]);

  const photoNames = detail?.photo_names ?? [];
  const photoUrls = detail?.photo_urls ?? [];
  const activeIndex = useMemo(() => safeIndex(currentIndex, photoUrls.length), [currentIndex, photoUrls.length]);
  const activeName = photoNames[activeIndex] ?? "등록된 이미지 없음";
  const activeSrc = photoUrls.length > 0 ? photoUrls[activeIndex] ?? vehicleHeroImage : vehicleHeroImage;

  if (loading) {
    return (
      <section className="mx-auto max-w-5xl">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-6 text-sm text-slate-500">차량 이미지를 불러오는 중...</div>
      </section>
    );
  }

  if (!detail) {
    return (
      <section className="mx-auto max-w-5xl space-y-3">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-6 text-sm text-slate-500">차량 이미지 정보를 찾을 수 없습니다.</div>
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
    <section className="mx-auto max-w-5xl">
      <div className="relative flex min-h-[calc(100vh-220px)] items-center justify-center rounded-2xl bg-black/80 px-6 py-10">
        <Button
          asChild
          className="absolute right-6 top-6 h-10 w-10 rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20"
          type="button"
          variant="ghost"
          size="icon"
        >
          <Link to={`/seller/vehicles/${vehicleId}`} aria-label="닫기">
            <X className="h-5 w-5" />
          </Link>
        </Button>

        <Button
          aria-label="이전 이미지"
          className="absolute left-8 top-1/2 h-12 w-12 -translate-y-1/2 rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20"
          onClick={() => setCurrentIndex((prev) => prev - 1)}
          type="button"
          variant="ghost"
          size="icon"
          disabled={photoUrls.length === 0}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>

        <div className="w-full max-w-[560px]">
          <div className="overflow-hidden rounded-[4px] bg-[#1f1f1f] shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
            <div className="aspect-[3/2]">
              <img alt={activeName} className="h-full w-full object-cover object-center" src={activeSrc} />
            </div>
          </div>
        </div>

        <Button
          aria-label="다음 이미지"
          className="absolute right-8 top-1/2 h-12 w-12 -translate-y-1/2 rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20"
          onClick={() => setCurrentIndex((prev) => prev + 1)}
          type="button"
          variant="ghost"
          size="icon"
          disabled={photoUrls.length === 0}
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>
    </section>
  );
}
