import { Outlet } from "react-router-dom";
import { SidebarContent } from "./Sidebar";
import { Topbar } from "./Topbar";

export const AppLayout = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <aside className="hidden lg:flex flex-col w-[280px] fixed left-0 top-0 h-screen border-r border-[#E2E8F0] z-40">
        <SidebarContent />
      </aside>
      <div className="lg:pl-[280px]">
        <Topbar />
        <main className="max-w-[1400px] mx-auto px-5 lg:px-8 py-6 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
