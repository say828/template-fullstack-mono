import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import vehicleHeroImage from "../../assets/seller/vehicle-hero.png";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Dialog, DialogContent } from "../ui/dialog";

export interface SellerVehicleImageItem {
  src: string;
  alt: string;
}

export interface SellerVehicleViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photoUrls: string[];
  photoNames: string[];
  activeIndex: number;
  onActiveIndexChange: (next: number | ((prev: number) => number)) => void;
}

export function SellerVehicleImageViewerDialog({
  open,
  onOpenChange,
  photoUrls,
  photoNames,
  activeIndex,
  onActiveIndexChange,
}: SellerVehicleViewerProps) {
  const safeIndex = photoUrls.length === 0 ? 0 : ((activeIndex % photoUrls.length) + photoUrls.length) % photoUrls.length;
  const activeSrc = photoUrls[safeIndex] ?? vehicleHeroImage;
  const activeAlt = photoNames[safeIndex] ?? "등록된 이미지";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="left-0 top-0 h-[100svh] w-[100vw] max-w-none translate-x-0 translate-y-0 rounded-none border-0 bg-transparent p-0 shadow-none"
      >
        <div className="relative flex h-full w-full items-center justify-center bg-black/80 px-6 py-10">
          <Button
            aria-label="닫기"
            className="absolute right-6 top-6 h-10 w-10 rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20"
            onClick={() => onOpenChange(false)}
            type="button"
            variant="ghost"
            size="icon"
          >
            <X className="h-5 w-5" />
          </Button>

          <Button
            aria-label="이전 이미지"
            className="absolute left-8 top-1/2 h-12 w-12 -translate-y-1/2 rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20"
            onClick={() => onActiveIndexChange((prev) => prev - 1)}
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
                <img alt={activeAlt} className="h-full w-full object-cover object-center" src={activeSrc} />
              </div>
            </div>
          </div>

          <Button
            aria-label="다음 이미지"
            className="absolute right-8 top-1/2 h-12 w-12 -translate-y-1/2 rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20"
            onClick={() => onActiveIndexChange((prev) => prev + 1)}
            type="button"
            variant="ghost"
            size="icon"
            disabled={photoUrls.length === 0}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface SellerVehicleHeroSectionProps {
  imageSrc: string;
  imageAlt: string;
  badges?: ReactNode;
  panelTitle: string;
  panelDescription?: ReactNode;
  panelContent: ReactNode;
  captionTitle?: string;
  captionDescription?: ReactNode;
  sectionClassName?: string;
  imageClassName?: string;
  panelClassName?: string;
}

export function SellerVehicleHeroSection({
  imageSrc,
  imageAlt,
  badges,
  panelTitle,
  panelDescription,
  panelContent,
  captionTitle,
  captionDescription,
  sectionClassName,
  imageClassName,
  panelClassName,
}: SellerVehicleHeroSectionProps) {
  return (
    <section className={sectionClassName ?? "grid gap-4 lg:grid-cols-[minmax(0,1fr)_348px]"}>
      <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
        <img
          alt={imageAlt}
          className={imageClassName ?? "h-[280px] w-full object-cover object-center md:h-[340px]"}
          src={imageSrc}
        />
        {badges ? <div className="absolute left-4 top-4 flex flex-wrap gap-2">{badges}</div> : null}
        {captionTitle || captionDescription ? (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent p-4 text-white">
            {captionTitle ? <p className="text-sm opacity-80">{captionTitle}</p> : null}
            {captionDescription ? <div className="mt-1 text-sm opacity-90">{captionDescription}</div> : null}
          </div>
        ) : null}
      </div>

      <Card className={`rounded-2xl border-slate-200 shadow-sm ${panelClassName ?? ""}`.trim()}>
        <CardHeader className="space-y-2 pb-3">
          <CardTitle className="text-lg">{panelTitle}</CardTitle>
          {panelDescription ? <div className="text-sm text-slate-500">{panelDescription}</div> : null}
        </CardHeader>
        <CardContent className="space-y-4">{panelContent}</CardContent>
      </Card>
    </section>
  );
}

interface SellerVehicleSpecsCardProps {
  title: string;
  description?: ReactNode;
  items: Array<{ label: string; value: ReactNode }>;
}

export function SellerVehicleSpecsCard({ title, description, items }: SellerVehicleSpecsCardProps) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="space-y-1 pb-3">
        <div className="flex flex-wrap items-center gap-3">
          <CardTitle className="text-lg">{title}</CardTitle>
          {description ? <p className="whitespace-nowrap text-sm text-slate-500">{description}</p> : null}
        </div>
      </CardHeader>
      <div className="h-px bg-slate-200" />
      <CardContent className="grid gap-x-12 gap-y-4 pt-4 text-sm md:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="grid grid-cols-[136px_minmax(0,1fr)] items-center gap-6">
            <span className="text-slate-500">{item.label}</span>
            <span className="font-semibold text-slate-900">{item.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

interface SellerVehiclePhotoOptionsCardProps {
  title: string;
  photoUrls: string[];
  photoNames: string[];
  remainingPhotoCount: number;
  moreHref?: string;
  onOpenPhoto: (index: number) => void;
  onOpenMore?: () => void;
  options?: string[];
  showMoreTile?: boolean;
  moreLabel?: string;
  maxVisiblePhotos?: number;
}

export function SellerVehiclePhotoOptionsCard({
  title,
  photoUrls,
  photoNames,
  remainingPhotoCount,
  moreHref,
  onOpenPhoto,
  onOpenMore,
  options,
  showMoreTile = false,
  moreLabel = "+더 보기",
  maxVisiblePhotos = 5,
}: SellerVehiclePhotoOptionsCardProps) {
  const visiblePhotos = photoUrls.slice(0, maxVisiblePhotos);

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{title}</CardTitle>
          {!showMoreTile && remainingPhotoCount > 0 && (onOpenMore || moreHref) ? (
            onOpenMore ? (
              <Button variant="ghost" className="h-8 px-0 text-[#2f6ff5]" onClick={onOpenMore} type="button">
                +{remainingPhotoCount}장 더보기
              </Button>
            ) : (
              <Button asChild variant="ghost" className="h-8 px-0 text-[#2f6ff5]">
                <Link to={moreHref!}>+{remainingPhotoCount}장 더보기</Link>
              </Button>
            )
          ) : null}
        </div>
      </CardHeader>
      <div className="mx-6 h-px bg-slate-200" />
      <CardContent className="space-y-3 pt-5">
        {photoUrls.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">등록된 이미지가 없습니다.</div>
        ) : (
          <div className="-mx-1 overflow-x-auto px-1">
            <div className="flex min-h-[84px] gap-2">
              {visiblePhotos.map((src, index) => (
                <button
                  key={`${photoNames[index] ?? title}-${index}`}
                  onClick={() => onOpenPhoto(index)}
                  type="button"
                  className="h-20 min-w-[112px] flex-1 overflow-hidden rounded-lg border border-slate-200 transition"
                >
                  <img alt={photoNames[index] ?? title} className="h-full w-full object-cover object-center" src={src} />
                </button>
              ))}
              {showMoreTile && remainingPhotoCount > 0 && (onOpenMore || moreHref) ? (
                onOpenMore ? (
                  <button
                    type="button"
                    onClick={onOpenMore}
                    className="flex h-20 min-w-[112px] flex-1 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-500 transition hover:bg-slate-100"
                  >
                    {moreLabel}
                  </button>
                ) : (
                  <Link
                    to={moreHref!}
                    className="flex h-20 min-w-[112px] flex-1 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-500 transition hover:bg-slate-100"
                  >
                    {moreLabel}
                  </Link>
                )
              ) : null}
            </div>
          </div>
        )}
        <div className="space-y-2">
          <p className="text-[12px] font-semibold text-slate-500">
            주요 옵션 :{" "}
            <span className="font-medium text-slate-700">
              {(options?.length ?? 0) === 0 ? "등록된 옵션 없음" : options?.join(", ")}
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface SellerVehicleStageProgressCardProps {
  title: string;
  steps: Array<{ id: string; label: string; state: "active" | "done" | "pending" }>;
}

export function SellerVehicleStageProgressCard({ title, steps }: SellerVehicleStageProgressCardProps) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <div className="absolute left-6 right-6 top-4 h-px bg-slate-200" />
          <div className="grid gap-2 md:grid-cols-5">
            {steps.map((step, index) => (
              <div key={step.id} className="relative flex flex-col items-center text-center">
                <div
                  className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    step.state === "active"
                      ? "bg-[#2f6ff5] text-white ring-4 ring-blue-100"
                      : step.state === "done"
                        ? "bg-emerald-500 text-white ring-4 ring-emerald-100"
                        : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {step.state === "done" ? "✓" : index + 1}
                </div>
                <p
                  className={`mt-3 text-xs font-semibold ${
                    step.state === "active" ? "text-[#2f6ff5]" : step.state === "done" ? "text-emerald-600" : "text-slate-400"
                  }`}
                >
                  {step.label}
                </p>
                {step.state === "active" ? (
                  <span className="mt-2 inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-[#2f6ff5]">
                    현재 단계
                  </span>
                ) : step.state === "done" ? (
                  <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
                    완료
                  </span>
                ) : (
                  <span className="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-400">
                    대기
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface SellerVehicleTimelineCardProps {
  title: string;
  rows: Array<{ id: string; label: string; timeLabel: string }>;
}

export function SellerVehicleTimelineCard({ title, rows }: SellerVehicleTimelineCardProps) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.map((row, index) => (
          <div key={row.id} className="flex gap-3">
            <div className="flex w-4 flex-col items-center">
              <span className={`mt-1 h-2.5 w-2.5 rounded-full ${index === 0 ? "bg-[#2f6ff5]" : "bg-slate-200"}`} />
              {index < rows.length - 1 && <span className="mt-1 h-full w-px bg-slate-200" />}
            </div>
            <div className="pb-2">
              <p className="text-sm font-medium text-slate-900">{row.label}</p>
              <p className="text-xs text-slate-500">{row.timeLabel}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
