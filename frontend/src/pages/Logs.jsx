import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Download, ScrollText, Filter } from "lucide-react";
import { toast } from "sonner";
import { fetchLogs, api } from "@/lib/api";
import { fmtTime } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { TableSkeleton } from "@/components/Skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export default function Logs() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [range, setRange] = useState("all");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["logs", search, status, range],
    queryFn: () => fetchLogs({ search, status, range }),
  });

  const items = data?.items || [];

  const exportCsv = async () => {
    try {
      const res = await api.get("/logs/export", { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = "visitor_logs.csv";
      a.click();
      toast.success("Logs exported to CSV");
    } catch {
      toast.error("Export failed");
    }
  };

  return (
    <div className="animate-fade-in-up">
      <PageHeader title="Logs" subtitle="Complete audit history of every action across the visitor system.">
        <Button data-testid="export-logs-button" onClick={exportCsv} variant="outline" className="rounded-[10px] border-[#E2E8F0]">
          <Download className="w-4 h-4 mr-1.5" /> Export CSV
        </Button>
      </PageHeader>

      <div className="bg-white rounded-[12px] border border-[#E2E8F0] shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-[#E2E8F0]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <Input data-testid="logs-search" placeholder="Search by PIN, apartment, action or user..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-[10px] border-[#E2E8F0] bg-[#F8FAFC]" />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger data-testid="logs-status-filter" className="w-full sm:w-40 rounded-[10px] border-[#E2E8F0]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="used">Used</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="revoked">Revoked</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
              <SelectItem value="not_found">Not Found</SelectItem>
            </SelectContent>
          </Select>
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger data-testid="logs-range-filter" className="w-full sm:w-40 rounded-[10px] border-[#E2E8F0]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <TableSkeleton rows={10} cols={6} />
        ) : isError ? (
          <div className="p-10 text-center">
            <p className="text-[#DC2626] font-semibold">Failed to Load Logs</p>
            <Button data-testid="logs-retry" onClick={refetch} className="mt-4 bg-[#0F172A] text-white rounded-[10px]">Retry</Button>
          </div>
        ) : items.length === 0 ? (
          <EmptyState testId="logs-empty" icon={ScrollText} title="No Logs Available" description="No audit entries match the current filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[#64748B] border-b border-[#E2E8F0]">
                  <th className="font-medium px-5 py-3">Timestamp</th>
                  <th className="font-medium px-5 py-3">PIN</th>
                  <th className="font-medium px-5 py-3">Apartment</th>
                  <th className="font-medium px-5 py-3">Action</th>
                  <th className="font-medium px-5 py-3">Status</th>
                  <th className="font-medium px-5 py-3">User / Guard</th>
                  <th className="font-medium px-5 py-3">Notes</th>
                </tr>
              </thead>
              <tbody>
                {items.map((l) => (
                  <tr key={l.id} data-testid={`log-row-${l.id}`} className="border-b border-[#E2E8F0] last:border-0 hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-5 py-3 text-[#64748B] whitespace-nowrap">{fmtTime(l.timestamp)}</td>
                    <td className="px-5 py-3"><span className="font-mono font-semibold text-[#111827]">{l.pin}</span></td>
                    <td className="px-5 py-3 font-medium text-[#111827]">{l.apartment}</td>
                    <td className="px-5 py-3 text-[#475569] whitespace-nowrap">{l.action}</td>
                    <td className="px-5 py-3"><StatusBadge status={l.status} /></td>
                    <td className="px-5 py-3 text-[#475569] whitespace-nowrap">{l.user}</td>
                    <td className="px-5 py-3 text-[#94A3B8] max-w-[220px] truncate">{l.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {items.length > 0 && (
          <div className="px-5 py-3 border-t border-[#E2E8F0] text-xs text-[#64748B]">{items.length} entries</div>
        )}
      </div>
    </div>
  );
}
