import { Bell, X } from "lucide-react";

import { cn } from "../lib/utils";

type AdminNotificationsDrawerRow = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  unread?: boolean;
};

type AdminNotificationsDrawerProps = {
  rows: AdminNotificationsDrawerRow[];
  loading?: boolean;
  error?: string | null;
  onClose?: () => void;
  onMarkAll?: () => void;
  onRowClick?: (id: string) => void;
  className?: string;
};

export function AdminNotificationsDrawer({
  rows,
  loading = false,
  error = null,
  onClose,
  onMarkAll,
  onRowClick,
  className,
}: AdminNotificationsDrawerProps) {
  return (
    <div
      className={cn(
        "flex h-[648px] w-[388px] flex-col overflow-hidden rounded-[22px] border border-[#e4e7ec] bg-[#fafafd] shadow-[0_16px_36px_rgba(22,27,45,0.1)]",
        className,
      )}
    >
      <div className="relative flex items-center justify-center border-b border-[#eef0f3] px-5 py-[8px]">
        <h2 className="text-[16px] font-bold tracking-[-0.03em] text-[#282b33]">알림</h2>
        {onClose ? (
          <button
            type="button"
            aria-label="알림 닫기"
            className="absolute right-[14px] top-[8px] text-[#6e747d]"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-[8px] py-[8px]">
        {loading ? (
          <div className="flex h-full items-center justify-center text-[13px] font-medium text-[#7e8590]">알림을 불러오는 중입니다.</div>
        ) : error ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-[13px] font-medium text-[#c25763]">{error}</div>
        ) : rows.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[13px] font-medium text-[#7e8590]">새 알림이 없습니다.</div>
        ) : (
          <div className="space-y-[10px]">
            {rows.map((row) => {
              const content = (
                <div className="relative rounded-[18px] bg-white px-[16px] py-[15px] shadow-[inset_0_0_0_1px_rgba(233,236,240,0.85)]">
                  <div className="flex items-start gap-[10px]">
                    <span className="mt-[4px] inline-flex h-[14px] w-[14px] items-center justify-center rounded-full bg-[#173f8d] text-white">
                      <Bell className="h-[8px] w-[8px]" />
                    </span>
                    <div className="space-y-[4px]">
                      <p className="text-left text-[15px] font-bold tracking-[-0.02em] text-[#20242b]">{row.title}</p>
                      <p className="text-left text-[10px] font-medium text-[#808691]">{row.message}</p>
                      <p className="pt-[3px] text-left text-[9px] font-semibold text-[#a0a6b2]">{row.createdAt}</p>
                    </div>
                  </div>
                  {row.unread ? <span className="absolute right-[14px] top-[14px] h-[8px] w-[8px] rounded-full bg-[#ef6d73]" /> : null}
                </div>
              );

              if (!onRowClick) {
                return <div key={row.id}>{content}</div>;
              }

              return (
                <button key={row.id} type="button" className="block w-full text-left" onClick={() => onRowClick(row.id)}>
                  {content}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center border-t border-[#eef0f3] bg-[#fafafd] py-[8px]">
        <button
          type="button"
          className="flex items-center gap-1 text-[12px] font-semibold text-[#5c89de] disabled:cursor-not-allowed disabled:opacity-40"
          onClick={onMarkAll}
          disabled={!onMarkAll || loading || rows.length === 0}
        >
          <span className="text-[12px] leading-none">✓</span>
          <span>모두 읽음</span>
        </button>
      </div>
    </div>
  );
}
