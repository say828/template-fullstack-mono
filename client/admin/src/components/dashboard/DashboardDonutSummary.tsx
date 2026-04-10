import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

type DonutSlice = {
  key: string;
  label: string;
  value: number;
  color: string;
};

type DashboardDonutSummaryProps = {
  totalLabel: string;
  totalValue: string | number;
  slices: DonutSlice[];
  size?: number;
  innerRadius?: number;
  outerRadius?: number;
  labelSize?: number;
  valueSize?: number;
  className?: string;
};

export function DashboardDonutSummary({
  totalLabel,
  totalValue,
  slices,
  size = 122,
  innerRadius = 40,
  outerRadius = 58,
  labelSize = 10,
  valueSize = 20,
  className,
}: DashboardDonutSummaryProps) {
  const config = Object.fromEntries(
    slices.map((slice) => [
      slice.key,
      {
        label: slice.label,
        color: slice.color,
      },
    ]),
  );

  return (
    <div className={className} style={{ height: size, width: size }}>
      <div className="relative h-full w-full">
        <ChartContainer config={config} className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<ChartTooltipContent formatter={(value) => `${value}건`} />} />
              <Pie
                data={slices}
                dataKey="value"
                nameKey="label"
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                strokeWidth={0}
                isAnimationActive={false}
              >
                {slices.map((slice) => (
                  <Cell key={slice.key} fill={slice.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-semibold text-[#8d929a]" style={{ fontSize: labelSize }}>
            {totalLabel}
          </span>
          <span className="mt-[2px] font-extrabold text-[#232833]" style={{ fontSize: valueSize }}>
            {totalValue}
          </span>
        </div>
      </div>
    </div>
  );
}
