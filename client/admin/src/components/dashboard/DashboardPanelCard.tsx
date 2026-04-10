import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

type DashboardPanelCardProps = {
  title: string;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  titleClassName?: string;
  style?: CSSProperties;
  titleStyle?: CSSProperties;
};

export function DashboardPanelCard({
  title,
  children,
  className,
  bodyClassName,
  titleClassName,
  style,
  titleStyle,
}: DashboardPanelCardProps) {
  return (
    <section className={cn("rounded-[12px] bg-white p-[12px_17px]", className)} style={style}>
      <h2 className={cn("text-[13px] font-bold text-[#313643]", titleClassName)} style={titleStyle}>
        {title}
      </h2>
      <div className={cn("mt-[10px]", bodyClassName)}>{children}</div>
    </section>
  );
}
