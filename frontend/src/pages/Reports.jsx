import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Users, TrendingUp, CheckCircle2, Clock } from "lucide-react";
import { fetchReports } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { CardsSkeleton } from "@/components/Skeletons";
import { KpiCard } from "@/components/KpiCard";

const PIE_COLORS = ["#2563EB", "#16A34A", "#F59E0B", "#DC2626"];

export default function Reports() {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["reports"], queryFn: fetchReports });

  return (
    <div className="animate-fade-in-up">
      <PageHeader title="Reports" subtitle="Administrative insights into visitor activity and pass usage." />

      {isLoading ? (
        <><CardsSkeleton /><div className="h-80 mt-5 bg-white rounded-[12px] border border-[#E2E8F0] animate-pulse" /></>
      ) : isError ? (
        <div className="bg-white rounded-[12px] border border-[#E2E8F0] p-10 text-center">
          <p className="text-[#DC2626] font-semibold">Failed to Load Reports</p>
          <button data-testid="reports-retry" onClick={refetch} className="mt-4 px-4 py-2 bg-[#0F172A] text-white rounded-[10px] text-sm">Retry</button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <KpiCard testId="metric-total-visitors" label="Total Visitors" value={data.metrics.total_visitors} icon={Users} accent="#2563EB" trend={null} />
            <KpiCard testId="metric-avg-daily" label="Avg. Daily Visitors" value={data.metrics.avg_daily_visitors} icon={TrendingUp} accent="#16A34A" trend={null} />
            <KpiCard testId="metric-approval-rate" label="Approval Rate" value={`${data.metrics.approval_rate}%`} icon={CheckCircle2} accent="#0F172A" trend={null} />
            <KpiCard testId="metric-expired-rate" label="Expired Pass Rate" value={`${data.metrics.expired_pass_rate}%`} icon={Clock} accent="#F59E0B" trend={null} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
            <ChartCard title="Visitors per Day" subtitle="Entries recorded over the last 14 days" className="lg:col-span-2" testId="chart-visitors-per-day">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.visitors_per_day} margin={{ left: -20, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="vg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0F172A" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="#0F172A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} interval={1} />
                  <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 13 }} />
                  <Area type="monotone" dataKey="visitors" stroke="#0F172A" strokeWidth={2.5} fill="url(#vg)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Pass Usage Rate" subtitle="Distribution by status" testId="chart-pass-usage">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={data.usage} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={55} outerRadius={85} paddingAngle={3}>
                    {data.usage.map((e, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 13 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 -mt-4">
                {data.usage.map((u, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-[#64748B]">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                    {u.name} ({u.value})
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
            <ChartCard title="Visitor Trend" subtitle="Passes generated vs visitors entered" testId="chart-visitor-trend">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={data.visitors_per_day} margin={{ left: -20, right: 8, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} interval={2} />
                  <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 13 }} />
                  <Area type="monotone" dataKey="passes" stroke="#2563EB" strokeWidth={2} fillOpacity={0.08} fill="#2563EB" />
                  <Area type="monotone" dataKey="visitors" stroke="#16A34A" strokeWidth={2} fillOpacity={0.08} fill="#16A34A" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Most Active Apartments" subtitle="By total visitor entries" testId="chart-most-active">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.most_active} layout="vertical" margin={{ left: 12, right: 16, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="apartment" tick={{ fontSize: 12, fill: "#475569" }} axisLine={false} tickLine={false} width={56} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 13 }} cursor={{ fill: "#F8FAFC" }} />
                  <Bar dataKey="visitors" fill="#0F172A" radius={[0, 6, 6, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}

function ChartCard({ title, subtitle, children, className = "", testId }) {
  return (
    <div data-testid={testId} className={`bg-white rounded-[12px] border border-[#E2E8F0] p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}>
      <h3 className="text-[16px] font-semibold text-[#111827]">{title}</h3>
      {subtitle && <p className="text-xs text-[#94A3B8] mt-0.5 mb-4">{subtitle}</p>}
      {children}
    </div>
  );
}
