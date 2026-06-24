import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Users, Ticket, ShieldCheck, ScrollText,
  BarChart3, Settings, ShieldHalf, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/residents", label: "Residents", icon: Users },
  { to: "/passes", label: "Visitor Passes", icon: Ticket },
  { to: "/verify", label: "Guard Verification", icon: ShieldCheck },
  { to: "/logs", label: "Logs", icon: ScrollText },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

export const SidebarContent = ({ onNavigate }) => (
  <div className="flex flex-col h-full bg-white">
    <div className="h-[72px] flex items-center gap-2.5 px-6 border-b border-[#E2E8F0]">
      <div className="w-9 h-9 rounded-[10px] bg-[#0F172A] flex items-center justify-center">
        <ShieldHalf className="w-5 h-5 text-white" strokeWidth={2} />
      </div>
      <div>
        <div className="text-[15px] font-bold text-[#111827] leading-tight tracking-tight">VisitorGuard</div>
        <div className="text-[11px] text-[#94A3B8] font-medium">Admin Portal</div>
      </div>
    </div>

    <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
      <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
        Menu
      </div>
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
          className={({ isActive }) =>
            cn(
              "group flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium transition-colors relative",
              isActive
                ? "bg-[#0F172A] text-white"
                : "text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
            )
          }
        >
          {({ isActive }) => (
            <>
              <item.icon className="w-[18px] h-[18px]" strokeWidth={2} />
              {item.label}
            </>
          )}
        </NavLink>
      ))}
    </nav>

    <div className="p-3 border-t border-[#E2E8F0]">
      <div className="flex items-center gap-3 px-2 py-2 rounded-[10px] hover:bg-[#F1F5F9] transition-colors">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#334155] to-[#0F172A] flex items-center justify-center text-white text-xs font-semibold">
          AK
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-[#111827] truncate">Anil Kapoor</div>
          <div className="text-xs text-[#94A3B8] truncate">President</div>
        </div>
        <button
          data-testid="logout-button"
          className="text-[#94A3B8] hover:text-[#DC2626] transition-colors p-1.5"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
);
