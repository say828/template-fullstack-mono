type DashboardFinanceSummaryCardProps = {
  label: string;
  value: string;
  tone?: "neutral" | "alert";
  radius?: number;
  padX?: number;
  padY?: number;
  labelSize?: number;
  valueSize?: number;
  valueGap?: number;
  minHeight?: number;
};

export function DashboardFinanceSummaryCard({
  label,
  value,
  tone = "neutral",
  radius = 8,
  padX = 17,
  padY = 11,
  labelSize = 10,
  valueSize = 17.5,
  valueGap = 8,
  minHeight = 0,
}: DashboardFinanceSummaryCardProps) {
  const isAlert = tone === "alert";

  return (
    <div
      className={isAlert ? "bg-[#f7e2df]" : "bg-[#f1f4f8]"}
      style={{ borderRadius: radius, minHeight, padding: `${padY}px ${padX}px` }}
    >
      <p className={`font-bold ${isAlert ? "text-[#e17867]" : "text-[#8b9098]"}`} style={{ fontSize: labelSize }}>{label}</p>
      <p
        className={`font-extrabold ${isAlert ? "text-[#ff735d]" : "text-[#212631]"}`}
        style={{ fontSize: valueSize, marginTop: valueGap }}
      >
        {value}
      </p>
    </div>
  );
}
