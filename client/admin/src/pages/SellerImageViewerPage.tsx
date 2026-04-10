import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

const imageSlots = [
  "외관 전면",
  "외관 후면",
  "좌측면",
  "우측면",
  "운전석",
  "실내",
  "계기판",
  "타이어/하부",
];

function safeIndex(index: number, length: number) {
  if (length === 0) return 0;
  return ((index % length) + length) % length;
}

export function SellerImageViewerPage() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const [searchParams] = useSearchParams();
  const initialIndex = Number(searchParams.get("index") ?? "0");
  const [currentIndex, setCurrentIndex] = useState(Number.isFinite(initialIndex) ? initialIndex : 0);

  const activeIndex = useMemo(() => safeIndex(currentIndex, imageSlots.length), [currentIndex]);

  return (
    <section className="mx-auto max-w-5xl space-y-4">
      <header className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-3xl font-black text-slate-900">차량 이미지 보기</h1>
          <p className="text-sm text-slate-500">등록 차량의 이미지 슬롯을 순서대로 확인합니다.</p>
        </div>
        <Button asChild type="button" variant="outline">
          <Link to={`/seller/vehicles/${vehicleId}`}>
            <X className="mr-1 h-4 w-4" /> 닫기
          </Link>
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{imageSlots[activeIndex]}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-black">
            <div className="aspect-[16/9] bg-gradient-to-br from-slate-300 via-slate-100 to-slate-200" />
          </div>
          <p className="text-sm text-slate-500">
            현재 DEV 백엔드는 차량 이미지 파일 메타를 별도 제공하지 않아 기본 슬롯 기준으로 뷰를 제공합니다.
          </p>
          <div className="flex items-center justify-between">
            <Button onClick={() => setCurrentIndex((prev) => prev - 1)} type="button" variant="outline">
              <ChevronLeft className="mr-1 h-4 w-4" /> 이전
            </Button>
            <p className="text-sm text-slate-500">
              {activeIndex + 1} / {imageSlots.length}
            </p>
            <Button onClick={() => setCurrentIndex((prev) => prev + 1)} type="button" variant="outline">
              다음 <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
