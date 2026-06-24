import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Users, Ticket, UserCheck, CalendarRange, UserPlus, Plus,
  ShieldCheck, Download, Activity, ArrowRight, KeyRound, CheckCircle2, Clock, Ban,
} from "lucide-react";
import { fetchDashboard } from "@/lib/api";
import { fmtTime, fmtRelative } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { KpiCard } from "@/components/KpiCard";
import { CardsSkeleton, TableSkeleton } from "@/components/Skeletons";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";

const ACTIVITY_ICON = {
  "Pass Generated": { icon: KeyRound, color: "#2563EB" },
  "Entry Approved": { icon: CheckCircle2, color: "#16A34A" },
  "Pass Expired": { icon: Clock, color: "#F59E0B" },
  "Pass Revoked": { icon: Ban, color: "#DC2626" },
  "Resident Disabled": { icon: Ban, color: "#DC2626" },
  "Pass Viewed": { icon: Activity, color: "#64748B" },
  "Verification Failed": { icon: Ban, color: "#DC2626" },
};

const QuickAction = ({ icon: Icon, label, onClick, testId }) => (
  <button
    data-testid={testId}
    onClick={onClick}
    className="flex items-center gap-3 p-4 rounded-[12px] border border-[#E2E8F0] bg-white hover:border-[#0F172A] hover:shadow-[0_4px_16px_rgba(15,23,42,0.06)] transition-all text-left group"
  >
    <div className="w-10 h-10 rounded-[10px] bg-[#F1F5F9] group-hover:bg-[#0F172A] flex items-center justify-center transition-colors">
      <Icon className="w-5 h-5 text-[#475569] group-hover:text-white transition-colors" strokeWidth={2} />
    </div>
    <div>
      <div className="text-sm font-semibold text-[#111827]">{label}</div>
    </div>
    <ArrowRight className="w-4 h-4 text-[#CBD5E1] ml-auto group-hover:text-[#0F172A] group-hover:translate-x-0.5 transition-all" />
  </button>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["dashboard"], queryFn: fetchDashboard });

  return (
    <div className="animate-fade-in-up">
      <PageHeader title="Dashboard" subtitle="Executive overview of visitor activity across Greenwood Residency.">
        <Button data-testid="header-create-pass" onClick={() => navigate("/passes")} className="bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-[10px]">
          <Plus className="w-4 h-4 mr-1.5" /> Create Pass
        </Button>
      </PageHeader>

      {isLoading ? (
        <CardsSkeleton />
      ) : isError ? (
        <ErrorBox onRetry={refetch} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <KpiCard testId="kpi-total-residents" label="Total Residents" value={data.kpis.total_residents} trend={data.kpis.total_residents_trend} icon={Users} accent="#0F172A" />
          <KpiCard testId="kpi-active-passes" label="Active Passes" value={data.kpis.active_passes} trend={data.kpis.active_passes_trend} icon={Ticket} accent="#16A34A" />
          <KpiCard testId="kpi-visitors-today" label="Visitors Today" value={data.kpis.visitors_today} trend={data.kpis.visitors_today_trend} icon={UserCheck} accent="#2563EB" />
          <KpiCard testId="kpi-entries-week" label="Entries This Week" value={data.kpis.entries_week} trend={data.kpis.entries_week_trend} icon={CalendarRange} accent="#F59E0B" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
        {/* Recent Visitors table */}
        <div className="lg:col-span-2 bg-white rounded-[12px] border border-[#E2E8F0] shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
            <h2 className="text-[16px] font-semibold text-[#111827]">Recent Visitors</h2>
            <button data-testid="view-all-visitors" onClick={() => navigate("/passes")} className="text-xs font-semibold text-[#475569] hover:text-[#0F172A] flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {isLoading ? (
            <TableSkeleton rows={6} cols={5} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[#64748B]">
                    <th className="font-medium px-5 py-2.5">Time</th>
                    <th className="font-medium px-5 py-2.5">PIN</th>
                    <th className="font-medium px-5 py-2.5">Apartment</th>
                    <th className="font-medium px-5 py-2.5">Status</th>
                    <th className="font-medium px-5 py-2.5">Guard</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.recent_visitors?.map((v, i) => (
                    <tr key={i} data-testid={`recent-visitor-row-${i}`} className="border-t border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-5 py-3 text-[#64748B] whitespace-nowrap">{fmtTime(v.time)}</td>
                      <td className="px-5 py-3"><span className="font-mono font-semibold text-[#111827] tracking-wider">{v.pin}</span></td>
                      <td className="px-5 py-3 font-medium text-[#111827]">{v.apartment}</td>
                      <td className="px-5 py-3"><StatusBadge status={v.status} /></td>
                      <td className="px-5 py-3 text-[#475569] whitespace-nowrap">{v.guard}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-[12px] border border-[#E2E8F0] shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="px-5 py-4 border-b border-[#E2E8F0]">
            <h2 className="text-[16px] font-semibold text-[#111827]">Recent Activity</h2>
          </div>
          <div className="p-4 space-y-1 max-h-[360px] overflow-y-auto">
            {isLoading ? (
              <TableSkeleton rows={6} cols={1} />
            ) : (
              data?.recent_activity?.map((a, i) => {
                const cfg = ACTIVITY_ICON[a.action] || { icon: Activity, color: "#64748B" };
                const Icon = cfg.icon;
                return (
                  <div key={i} data-testid={`activity-row-${i}`} className="flex items-start gap-3 px-2 py-2.5 rounded-[10px] hover:bg-[#F8FAFC] transition-colors">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${cfg.color}14` }}>
                      <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-[#111827]">{a.action}</div>
                      <div className="text-xs text-[#64748B] truncate">
                        {a.apartment !== "-" ? `${a.apartment} · ` : ""}{a.user}
                      </div>
                    </div>
                    <span className="text-[11px] text-[#94A3B8] whitespace-nowrap shrink-0">{fmtRelative(a.timestamp)}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-5">
        <h2 className="text-[16px] font-semibold text-[#111827] mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickAction testId="qa-add-resident" icon={UserPlus} label="Add Resident" onClick={() => navigate("/residents")} />
          <QuickAction testId="qa-create-pass" icon={Ticket} label="Create Pass" onClick={() => navigate("/passes")} />
          <QuickAction testId="qa-guard-verification" icon={ShieldCheck} label="Guard Verification" onClick={() => navigate("/verify")} />
          <QuickAction testId="qa-export-logs" icon={Download} label="Export Logs" onClick={() => navigate("/logs")} />
        </div>
      </div>
    </div>
  );
}

const ErrorBox = ({ onRetry }) => (
  <div className="bg-white rounded-[12px] border border-[#E2E8F0] p-10 text-center">
    <p className="text-[#DC2626] font-semibold">Failed to load dashboard</p>
    <p className="text-sm text-[#64748B] mt-1">There was a network error. Please try again.</p>
    <Button data-testid="dashboard-retry" onClick={onRetry} className="mt-4 bg-[#0F172A] text-white rounded-[10px]">Retry</Button>
  </div>
);
