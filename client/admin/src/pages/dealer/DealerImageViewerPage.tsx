import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";

const imageLabels = ["외관 전면", "외관 후면", "측면", "운전석", "실내", "계기판", "타이어", "하부"];

function safeIndex(index: number, length: number) {
  if (length === 0) return 0;
  return ((index % length) + length) % length;
}

export function DealerImageViewerPage() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const [searchParams] = useSearchParams();
  const initialIndex = Number(searchParams.get("index") ?? "0");
  const [currentIndex, setCurrentIndex] = useState(Number.isFinite(initialIndex) ? initialIndex : 0);

  const activeIndex = useMemo(() => safeIndex(currentIndex, imageLabels.length), [currentIndex]);

  return (
    <section className="mx-auto max-w-5xl space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900">이미지 보기</h1>
          <p className="text-sm text-slate-500">DL_006 원본 확대 뷰어</p>
        </div>
        <Button asChild type="button" variant="outline">
          <Link to={`/dealer/market/${vehicleId}/photos`}>
            <X className="mr-1 h-4 w-4" /> 닫기
          </Link>
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{imageLabels[activeIndex]}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-black">
            <div className="aspect-[16/9] bg-gradient-to-br from-slate-300 via-slate-100 to-slate-200" />
          </div>

          <div className="flex items-center justify-between">
            <Button onClick={() => setCurrentIndex((prev) => prev - 1)} type="button" variant="outline">
              <ChevronLeft className="mr-1 h-4 w-4" /> 이전
            </Button>
            <p className="text-sm text-slate-500">
              {activeIndex + 1} / {imageLabels.length}
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
