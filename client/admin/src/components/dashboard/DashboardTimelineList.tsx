type TimelineItem = {
  time: string;
  title: string;
  tradeId: string;
  action: string;
  actionTone: string;
};

type DashboardTimelineListProps = {
  items: TimelineItem[];
  columns?: string;
  stackGap?: number;
  dotSize?: number;
  dotTop?: number;
  stemHeight?: number;
  stemMarginTop?: number;
  messageGap?: number;
  timeClassName?: string;
  titleClassName?: string;
  tradeIdClassName?: string;
  actionClassName?: string;
  actionFontSize?: number;
  actionPadX?: number;
  actionPadY?: number;
  actionRadius?: number;
};

export function DashboardTimelineList({
  items,
  columns = "20px 1fr 40px",
  stackGap = 10,
  dotSize = 8,
  dotTop = 3,
  stemHeight = 42,
  stemMarginTop = 4,
  messageGap = 2,
  timeClassName = "text-[11px] font-bold text-[#6d7480]",
  titleClassName = "text-[11px] font-semibold text-[#303641]",
  tradeIdClassName = "text-[10px] font-semibold text-[#98a0ad]",
  actionClassName = "justify-self-end font-bold",
  actionFontSize,
  actionPadX = 0,
  actionPadY = 0,
  actionRadius = 0,
}: DashboardTimelineListProps) {
  return (
    <div className="grid" style={{ gap: stackGap }}>
      {items.map((row, index) => (
        <div key={`${row.tradeId}-${row.title}`} className="grid items-start gap-2" style={{ gridTemplateColumns: columns }}>
          <div className="flex flex-col items-center">
            <span
              className={`rounded-full ${index === 0 ? "bg-[#5f8dff]" : index === 1 ? "bg-[#ff8c6f]" : "bg-[#dadce2]"}`}
              style={{ height: dotSize, marginTop: dotTop, width: dotSize }}
            />
            {index < items.length - 1 ? (
              <span className="w-px bg-[#dfe3eb]" style={{ height: stemHeight, marginTop: stemMarginTop }} />
            ) : null}
          </div>
          <div className="grid" style={{ gap: messageGap }}>
            <p className={timeClassName}>{row.time}</p>
            <p className={titleClassName}>{row.title}</p>
            <p className={tradeIdClassName}>{row.tradeId}</p>
          </div>
          <div
            className={`${actionClassName} ${row.actionTone}`.trim()}
            style={{
              borderRadius: actionRadius,
              fontSize: actionFontSize,
              padding: `${actionPadY}px ${actionPadX}px`,
            }}
          >
            {row.action}
          </div>
        </div>
      ))}
    </div>
  );
}
