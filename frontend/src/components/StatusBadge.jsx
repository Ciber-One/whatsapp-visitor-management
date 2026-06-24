import { cn } from "@/lib/utils";

const MAP = {
  active: "bg-[#16A34A]/10 text-[#16A34A]",
  used: "bg-[#2563EB]/10 text-[#2563EB]",
  expired: "bg-[#F59E0B]/10 text-[#F59E0B]",
  revoked: "bg-[#DC2626]/10 text-[#DC2626]",
  disabled: "bg-[#64748B]/10 text-[#64748B]",
  not_found: "bg-[#DC2626]/10 text-[#DC2626]",
};

const LABELS = {
  active: "Active",
  used: "Used",
  expired: "Expired",
  revoked: "Revoked",
  disabled: "Disabled",
  not_found: "Not Found",
};

export const StatusBadge = ({ status, className }) => {
  const key = (status || "").toLowerCase();
  return (
    <span
      data-testid={`status-badge-${key}`}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize",
        MAP[key] || "bg-[#64748B]/10 text-[#64748B]",
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", {
        "bg-[#16A34A]": key === "active",
        "bg-[#2563EB]": key === "used",
        "bg-[#F59E0B]": key === "expired",
        "bg-[#DC2626]": key === "revoked" || key === "not_found",
        "bg-[#64748B]": key === "disabled",
      })} />
      {LABELS[key] || status}
    </span>
  );
};
