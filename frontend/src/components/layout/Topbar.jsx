import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Menu, Search, Bell, ChevronRight } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SidebarContent } from "./Sidebar";

const TITLES = {
  "/": "Dashboard",
  "/residents": "Residents",
  "/passes": "Visitor Passes",
  "/verify": "Guard Verification",
  "/logs": "Logs",
  "/reports": "Reports",
  "/settings": "Settings",
};

export const Topbar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const title = TITLES[location.pathname] || "Dashboard";

  return (
    <header className="h-[72px] bg-white border-b border-[#E2E8F0] sticky top-0 z-30 flex items-center justify-between px-5 lg:px-8">
      <div className="flex items-center gap-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              data-testid="mobile-menu-button"
              className="lg:hidden p-2 -ml-2 rounded-[10px] hover:bg-[#F1F5F9] text-[#475569]"
            >
              <Menu className="w-5 h-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[280px] border-r border-[#E2E8F0]">
            <SidebarContent onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="hidden sm:flex items-center gap-1.5 text-sm">
          <span className="text-[#94A3B8] font-medium">VisitorGuard</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#CBD5E1]" />
          <span className="text-[#111827] font-semibold">{title}</span>
        </div>
        <div className="sm:hidden text-[15px] font-bold text-[#111827]">{title}</div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center gap-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] px-3 py-2 w-64">
          <Search className="w-4 h-4 text-[#94A3B8]" />
          <input
            data-testid="topbar-search"
            placeholder="Search residents, passes..."
            className="bg-transparent text-sm outline-none w-full placeholder:text-[#94A3B8] text-[#111827]"
          />
        </div>
        <button
          data-testid="notifications-button"
          className="relative p-2.5 rounded-[10px] hover:bg-[#F1F5F9] text-[#475569] transition-colors"
        >
          <Bell className="w-[18px] h-[18px]" />
          <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-[#DC2626] ring-2 ring-white" />
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#334155] to-[#0F172A] flex items-center justify-center text-white text-xs font-semibold lg:hidden">
          AK
        </div>
      </div>
    </header>
  );
};
