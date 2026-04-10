import * as React from "react";

import { cn } from "@/lib/utils";

export type ChartConfig = Record<
  string,
  {
    label?: string;
    color?: string;
  }
>;

const ChartContext = React.createContext<ChartConfig | null>(null);

export function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }

  return context;
}

function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const colorEntries = Object.entries(config).filter(([, item]) => item.color);

  if (!colorEntries.length) return null;

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
[data-chart="${id}"] {
${colorEntries.map(([key, item]) => `  --color-${key}: ${item.color};`).join("\n")}
}
        `,
      }}
    />
  );
}

export function ChartContainer({
  id,
  className,
  config,
  children,
}: React.HTMLAttributes<HTMLDivElement> & {
  id?: string;
  config: ChartConfig;
}) {
  const chartId = React.useId().replace(/:/g, "");
  const resolvedId = id ?? `chart-${chartId}`;

  return (
    <ChartContext.Provider value={config}>
      <div data-chart={resolvedId} className={cn("flex aspect-video justify-center text-xs", className)}>
        <ChartStyle id={resolvedId} config={config} />
        {children}
      </div>
    </ChartContext.Provider>
  );
}

type ChartTooltipRow = {
  dataKey?: string | number;
  name?: string | number;
  value?: number | string;
};

export function ChartTooltipContent({
  active,
  payload,
  className,
  formatter,
}: {
  active?: boolean;
  payload?: ChartTooltipRow[];
  className?: string;
  formatter?: (value: number, name: string) => React.ReactNode;
}) {
  const chart = useChart();

  if (!active || !payload?.length) return null;

  return (
    <div className={cn("rounded-lg border bg-white px-3 py-2 shadow-md", className)}>
      <div className="grid gap-1.5">
        {payload.map((item) => {
          const key = item.dataKey?.toString() ?? item.name?.toString() ?? "value";
          const config = chart[key];
          const label = String(config?.label ?? item.name ?? key);
          const value = Number(item.value ?? 0);

          return (
            <div key={key} className="flex items-center justify-between gap-3">
              <span className="text-[#6d7480]">{label}</span>
              <span className="font-semibold text-[#1f232b]">{formatter ? formatter(value, label) : value.toLocaleString("ko-KR")}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
