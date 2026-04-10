import { Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useAuth } from "../../app/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { dealerSubmitDepreciation, getDealerTradeWorkflow } from "../../lib/api";
import type { TradeDepreciationItem, TradeWorkflow } from "../../lib/types";
import { currencyText, finalTradeAmount } from "./shared";

interface DepreciationItemDraft {
  id: string;
  code: string;
  item: string;
  reason: string;
  amount: number;
}

function createItem(index: number): DepreciationItemDraft {
  return {
    id: `item-${index}`,
    code: `dealer-item-${index}`,
    item: "",
    reason: "",
    amount: 0,
  };
}

function toDraftItems(items: TradeDepreciationItem[]): DepreciationItemDraft[] {
  if (items.length === 0) return [createItem(1)];
  return items.map((item, index) => ({
    id: item.id,
    code: item.code || `dealer-item-${index + 1}`,
    item: item.label,
    reason: item.note || "",
    amount: item.amount,
  }));
}

export function DealerDepreciationInputPage() {
  const { token } = useAuth();
  const { vehicleId } = useParams<{ vehicleId: string }>();

  const [workflow, setWorkflow] = useState<TradeWorkflow | null>(null);
  const [items, setItems] = useState<DepreciationItemDraft[]>([createItem(1)]);
  const [memo, setMemo] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!token || !vehicleId) {
        setWorkflow(null);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await getDealerTradeWorkflow(token, vehicleId);
        setWorkflow(data);
        setItems(toDraftItems(data.depreciation_items));
        setMemo(data.depreciation_comment || "");
      } catch (err) {
        setWorkflow(null);
        setError(err instanceof Error ? err.message : "감가 워크플로우 조회 실패");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [token, vehicleId]);

  const total = useMemo(() => items.reduce((sum, row) => sum + Math.abs(row.amount || 0), 0), [items]);

  const updateItem = (id: string, patch: Partial<DepreciationItemDraft>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const submit = async () => {
    if (!token || !vehicleId) return;
    if (items.some((item) => !item.item.trim() || !item.reason.trim() || item.amount <= 0)) {
      setError("감가 항목/사유/금액을 모두 입력해 주세요.");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await dealerSubmitDepreciation(token, vehicleId, {
        items: items.map((item, index) => ({
          code: item.code || `dealer-item-${index + 1}`,
          label: item.item.trim(),
          amount: item.amount,
          note: item.reason.trim(),
        })),
        comment: memo.trim() || undefined,
      });
      setWorkflow(updated);
      setItems(toDraftItems(updated.depreciation_items));
      setMemo(updated.depreciation_comment || memo);
      setMessage("감가 제안이 등록되었습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "감가 제안 등록 실패");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mx-auto max-w-4xl space-y-4">
      <header>
        <h1 className="text-3xl font-black text-slate-900">감가 금액 입력</h1>
        <p className="text-sm text-slate-500">DL_023 감가 항목 입력 및 제안 제출</p>
      </header>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>처리 실패</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {message && (
        <Alert className="border-emerald-200 bg-emerald-50">
          <AlertTitle className="text-emerald-700">처리 완료</AlertTitle>
          <AlertDescription className="text-emerald-700">{message}</AlertDescription>
        </Alert>
      )}

      {loading && <p className="text-sm text-slate-500">감가 정보를 불러오는 중...</p>}

      {!loading && !workflow && (
        <Card>
          <CardContent className="pt-6 text-sm text-slate-500">감가 입력 대상 거래가 없습니다.</CardContent>
        </Card>
      )}

      {workflow && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">감가 항목 입력</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, index) => (
              <div key={item.id} className="space-y-2 rounded-lg border border-slate-200 p-3">
                <div className="grid gap-2 md:grid-cols-[1fr_1fr_180px_auto]">
                  <Input placeholder="감가 항목" value={item.item} onChange={(event) => updateItem(item.id, { item: event.target.value })} />
                  <Input placeholder="상세 사유" value={item.reason} onChange={(event) => updateItem(item.id, { reason: event.target.value })} />
                  <Input
                    placeholder="감가 금액"
                    type="number"
                    value={item.amount || ""}
                    onChange={(event) => updateItem(item.id, { amount: Number(event.target.value) || 0 })}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setItems((prev) => (prev.length === 1 ? prev : prev.filter((row) => row.id !== item.id)))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-slate-500">항목 {index + 1}은 개별 감가 항목으로 제출됩니다.</p>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={() => setItems((prev) => [...prev, createItem(prev.length + 1)])}>
              <Plus className="mr-1 h-4 w-4" /> 항목 추가
            </Button>

            <div className="space-y-2">
              <Label htmlFor="dealer-depreciation-memo">감가 사유</Label>
              <Textarea
                id="dealer-depreciation-memo"
                rows={4}
                value={memo}
                onChange={(event) => setMemo(event.target.value)}
                placeholder="검차 결과 기준으로 감가 협의 사유를 입력해 주세요"
              />
            </div>

            <div className="rounded-lg bg-slate-50 p-3 text-sm">
              <p>낙찰가: {currencyText(workflow.base_price, workflow.currency)}</p>
              <p>총 감가 금액: -{currencyText(total, workflow.currency)}</p>
              <p className="font-semibold text-slate-900">제안 금액: {currencyText(workflow.base_price - total, workflow.currency)}</p>
              <p className="text-slate-500">현재 최종 거래 금액: {currencyText(finalTradeAmount(workflow), workflow.currency)}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild type="button" variant="outline">
                <Link to={`/dealer/transactions/${vehicleId}/detail/depreciation-waiting`}>취소</Link>
              </Button>
              <Button className="bg-[#2f6ff5] hover:bg-[#2459cd]" disabled={saving} onClick={() => void submit()} type="button">
                제안하기
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
