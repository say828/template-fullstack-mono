import type { CSSProperties } from "react";

type DashboardMetricCardProps = {
  label: string;
  value: string;
  unit: string;
  labelSize?: number;
  valueSize?: number;
  unitSize?: number;
  valueGap?: number;
  className?: string;
  style?: CSSProperties;
};

export function DashboardMetricCard({
  label,
  value,
  unit,
  labelSize = 11,
  valueSize = 18,
  unitSize = 10,
  valueGap = 8,
  className,
  style,
}: DashboardMetricCardProps) {
  return (
    <div className={className} style={style}>
      <p className="font-bold text-[#7e8490]" style={{ fontSize: labelSize }}>
        {label}
      </p>
      <div className="mt-[8px] flex items-end" style={{ gap: valueGap }}>
        <span className="font-extrabold text-[#171b22]" style={{ fontSize: valueSize }}>
          {value}
        </span>
        <span className="pb-[1px] font-semibold text-[#8f949d]" style={{ fontSize: unitSize }}>
          {unit}
        </span>
      </div>
    </div>
  );
}
