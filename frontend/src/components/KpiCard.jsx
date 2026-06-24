import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const KpiCard = ({ label, value, trend, icon: Icon, testId, accent = "#0F172A" }) => {
  const up = trend >= 0;
  return (
    <div
      data-testid={testId}
      className="bg-white rounded-[12px] border border-[#E2E8F0] p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_4px_16px_rgba(15,23,42,0.06)] transition-shadow"
    >
      <div className="flex items-start justify-between">
        <span className="text-[13px] font-medium text-[#64748B]">{label}</span>
        {Icon && (
          <div
            className="w-9 h-9 rounded-[10px] flex items-center justify-center"
            style={{ backgroundColor: `${accent}0F` }}
          >
            <Icon className="w-[18px] h-[18px]" style={{ color: accent }} strokeWidth={2} />
          </div>
        )}
      </div>
      <div className="mt-3 text-[28px] font-bold tracking-tight text-[#111827] leading-none">
        {value}
      </div>
      {trend !== undefined && trend !== null && (
        <div className="mt-3 flex items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded-md",
              up ? "text-[#16A34A] bg-[#16A34A]/10" : "text-[#DC2626] bg-[#DC2626]/10"
            )}
          >
            {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
          <span className="text-xs text-[#94A3B8]">vs last week</span>
        </div>
      )}
    </div>
  );
};
