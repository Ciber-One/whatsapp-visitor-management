import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Ticket, Search, RefreshCw, Download, Plus, Eye, Ban, Copy,
  CheckCircle2, Clock, XCircle, ShieldAlert, AlertTriangle, Activity,
  KeyRound, Send, DoorOpen, ShieldCheck, Building2, User, Phone, Calendar,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchPasses, fetchExpiring, fetchPass, revokePass, createPass, fetchResidentsMin,
} from "@/lib/api";
import { fmtTime, fmtTimeShort } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { TableSkeleton } from "@/components/Skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const SUMMARY_CARDS = [
  { key: "active", label: "Active Passes", icon: CheckCircle2, color: "#16A34A" },
  { key: "used", label: "Used Passes", icon: ShieldCheck, color: "#2563EB" },
  { key: "expired", label: "Expired Passes", icon: Clock, color: "#F59E0B" },
  { key: "today", label: "Today's Passes", icon: Ticket, color: "#0F172A" },
];

const TIMELINE_ICON = {
  "Pass Generated": KeyRound,
  "Sent To Resident": Send,
  "Shown At Gate": DoorOpen,
  "Verified By Guard": ShieldCheck,
  "Entry Approved": CheckCircle2,
  "Pass Expired": Clock,
  "Revoked By Admin": Ban,
};

export default function Passes() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [range, setRange] = useState("all");
  const [detailId, setDetailId] = useState(null);
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["passes", search, status, range],
    queryFn: () => fetchPasses({ search, status, range }),
  });
  const { data: expiring } = useQuery({ queryKey: ["expiring"], queryFn: fetchExpiring });

  const revokeMut = useMutation({
    mutationFn: revokePass,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["passes"] });
      qc.invalidateQueries({ queryKey: ["expiring"] });
      toast.success("Pass revoked successfully");
      setRevokeTarget(null);
    },
    onError: (e) => toast.error(e?.response?.data?.detail || "Failed to revoke pass"),
  });

  const items = data?.items || [];
  const summary = data?.summary || {};

  const copyPin = (pin) => { navigator.clipboard.writeText(pin); toast.success(`PIN ${pin} copied`); };

  const exportData = () => {
    const rows = [["PIN", "Apartment", "Resident", "Created", "Expiry", "Status", "Entry"]];
    items.forEach((p) => rows.push([p.pin, p.apartment, p.resident_name, p.created_at, p.expiry_at, p.status, p.entry_at || ""]));
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "visitor_passes.csv";
    a.click();
    toast.success("Pass data exported");
  };

  return (
    <div className="animate-fade-in-up">
      <PageHeader title="Visitor Passes" subtitle="Monitor, audit and revoke all visitor passes generated through WhatsApp.">
        <Button data-testid="refresh-passes" variant="outline" onClick={() => { refetch(); qc.invalidateQueries({ queryKey: ["expiring"] }); }} className="rounded-[10px] border-[#E2E8F0]">
          <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
        </Button>
        <Button data-testid="export-passes" variant="outline" onClick={exportData} className="rounded-[10px] border-[#E2E8F0]">
          <Download className="w-4 h-4 mr-1.5" /> Export
        </Button>
        <Button data-testid="create-pass-button" onClick={() => setCreateOpen(true)} className="bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-[10px]">
          <Plus className="w-4 h-4 mr-1.5" /> Create Pass
        </Button>
      </PageHeader>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {SUMMARY_CARDS.map((c) => (
          <div key={c.key} data-testid={`pass-summary-${c.key}`} className="bg-white rounded-[12px] border border-[#E2E8F0] p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ backgroundColor: `${c.color}14` }}>
                <c.icon className="w-[18px] h-[18px]" style={{ color: c.color }} />
              </div>
              <span className="text-[13px] font-medium text-[#64748B]">{c.label}</span>
            </div>
            <div className="text-[26px] font-bold text-[#111827] mt-3">{summary[c.key] ?? "—"}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 mt-5">
        {/* Main table */}
        <div className="lg:col-span-3 bg-white rounded-[12px] border border-[#E2E8F0] shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-[#E2E8F0]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
              <Input data-testid="passes-search" placeholder="Search by PIN, apartment or resident..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-[10px] border-[#E2E8F0] bg-[#F8FAFC]" />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger data-testid="passes-status-filter" className="w-full sm:w-36 rounded-[10px] border-[#E2E8F0]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="used">Used</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="revoked">Revoked</SelectItem>
              </SelectContent>
            </Select>
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger data-testid="passes-range-filter" className="w-full sm:w-36 rounded-[10px] border-[#E2E8F0]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7">Last 7 Days</SelectItem>
                <SelectItem value="30">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <TableSkeleton rows={8} cols={6} />
          ) : isError ? (
            <div className="p-10 text-center">
              <p className="text-[#DC2626] font-semibold">Failed to Load Passes</p>
              <Button data-testid="passes-retry" onClick={refetch} className="mt-4 bg-[#0F172A] text-white rounded-[10px]">Retry</Button>
            </div>
          ) : items.length === 0 ? (
            <EmptyState testId="passes-empty" icon={Ticket} title="No Visitor Passes Found" description="No passes match the current filters. Visitor passes are generated by residents via WhatsApp." actionLabel="Generate First Pass" onAction={() => setCreateOpen(true)} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[#64748B] border-b border-[#E2E8F0]">
                    <th className="font-medium px-5 py-3">PIN</th>
                    <th className="font-medium px-5 py-3">Apartment</th>
                    <th className="font-medium px-5 py-3">Resident</th>
                    <th className="font-medium px-5 py-3">Created</th>
                    <th className="font-medium px-5 py-3">Expiry</th>
                    <th className="font-medium px-5 py-3">Status</th>
                    <th className="font-medium px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((p) => (
                    <tr key={p.id} data-testid={`pass-row-${p.pin}`} className="border-b border-[#E2E8F0] last:border-0 hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-5 py-3.5"><span className="font-mono font-bold text-[#111827] tracking-widest">{p.pin}</span></td>
                      <td className="px-5 py-3.5 font-medium text-[#111827]">{p.apartment}</td>
                      <td className="px-5 py-3.5 text-[#475569] max-w-[140px] truncate">{p.resident_name}</td>
                      <td className="px-5 py-3.5 text-[#64748B] whitespace-nowrap">{fmtTime(p.created_at)}</td>
                      <td className="px-5 py-3.5 text-[#64748B] whitespace-nowrap">{fmtTimeShort(p.expiry_at)}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={p.status} /></td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button data-testid={`view-pass-${p.pin}`} onClick={() => setDetailId(p.id)} title="View Details" className="p-2 rounded-[8px] hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A]"><Eye className="w-4 h-4" /></button>
                          <button data-testid={`copy-pin-${p.pin}`} onClick={() => copyPin(p.pin)} title="Copy PIN" className="p-2 rounded-[8px] hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A]"><Copy className="w-4 h-4" /></button>
                          <button data-testid={`revoke-pass-${p.pin}`} onClick={() => setRevokeTarget(p)} disabled={p.status !== "active"} title="Revoke" className="p-2 rounded-[8px] hover:bg-[#F1F5F9] text-[#DC2626] disabled:opacity-30 disabled:cursor-not-allowed"><Ban className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Expiring Soon widget */}
        <div className="bg-white rounded-[12px] border border-[#E2E8F0] shadow-[0_1px_2px_rgba(15,23,42,0.04)] h-fit">
          <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
            <h2 className="text-[15px] font-semibold text-[#111827]">Expiring Soon</h2>
          </div>
          <div className="p-4 space-y-3">
            <ExpiryBucket label="Expires in 1 Hour" color="#DC2626" count={expiring?.counts?.one_hour ?? 0} items={expiring?.one_hour} />
            <ExpiryBucket label="Expires in 6 Hours" color="#F59E0B" count={expiring?.counts?.six_hours ?? 0} items={expiring?.six_hours} />
            <ExpiryBucket label="Expires Today" color="#2563EB" count={expiring?.counts?.today ?? 0} items={expiring?.today} />
          </div>
        </div>
      </div>

      <PassDrawer id={detailId} onClose={() => setDetailId(null)} onRevoke={(p) => setRevokeTarget(p)} onCopy={copyPin} />

      {/* Revoke confirmation */}
      <AlertDialog open={!!revokeTarget} onOpenChange={(o) => !o && setRevokeTarget(null)}>
        <AlertDialogContent className="rounded-[16px]">
          <AlertDialogHeader>
            <div className="w-11 h-11 rounded-full bg-[#DC2626]/10 flex items-center justify-center mb-2">
              <ShieldAlert className="w-5 h-5 text-[#DC2626]" />
            </div>
            <AlertDialogTitle className="text-[20px]">Revoke Visitor Pass</AlertDialogTitle>
            <AlertDialogDescription className="text-[#64748B]">
              This visitor pass will immediately become invalid and can no longer be used at the gate.
              {revokeTarget && <span className="block mt-2 font-mono font-semibold text-[#111827]">PIN {revokeTarget.pin} · {revokeTarget.apartment}</span>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-revoke" className="rounded-[10px]">Cancel</AlertDialogCancel>
            <AlertDialogAction data-testid="confirm-revoke" onClick={() => revokeMut.mutate(revokeTarget.id)} className="bg-[#DC2626] hover:bg-[#B91C1C] rounded-[10px]">Confirm Revoke</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CreatePassModal open={createOpen} onOpenChange={setCreateOpen} onCreated={() => { qc.invalidateQueries({ queryKey: ["passes"] }); qc.invalidateQueries({ queryKey: ["expiring"] }); }} />
    </div>
  );
}

function ExpiryBucket({ label, color, count, items = [] }) {
  return (
    <div className="rounded-[12px] border border-[#E2E8F0] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5" style={{ backgroundColor: `${color}0A` }}>
        <span className="text-sm font-medium text-[#111827]">{label}</span>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${color}1A`, color }}>{count}</span>
      </div>
      {items.length > 0 && (
        <div className="divide-y divide-[#F1F5F9]">
          {items.slice(0, 3).map((it, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2 text-xs">
              <span className="font-mono font-semibold text-[#111827]">{it.pin}</span>
              <span className="text-[#64748B]">{it.apartment}</span>
              <span className="text-[#94A3B8]">{fmtTimeShort(it.expiry_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PassDrawer({ id, onClose, onRevoke, onCopy }) {
  const { data: p, isLoading } = useQuery({
    queryKey: ["pass", id],
    queryFn: () => fetchPass(id),
    enabled: !!id,
  });

  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-0">
        {isLoading || !p ? (
          <div className="p-6"><TableSkeleton rows={6} cols={1} /></div>
        ) : (
          <>
            <SheetHeader className="p-6 border-b border-[#E2E8F0]">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-[18px]">Pass Details</SheetTitle>
                <StatusBadge status={p.status} />
              </div>
              <div className="flex items-center gap-3 mt-3">
                <div className="font-mono text-[32px] font-bold tracking-[0.2em] text-[#0F172A]">{p.pin}</div>
                <button data-testid="drawer-copy-pin" onClick={() => onCopy(p.pin)} className="p-2 rounded-[8px] border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#64748B]"><Copy className="w-4 h-4" /></button>
              </div>
            </SheetHeader>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <DetailItem icon={Building2} label="Apartment" value={p.apartment} />
                <DetailItem icon={User} label="Resident" value={p.resident_name} />
                <DetailItem icon={Phone} label="Phone" value={p.resident_phone} />
                <DetailItem icon={User} label="Visitor" value={p.visitor_name} />
                <DetailItem icon={Calendar} label="Created" value={fmtTime(p.created_at)} />
                <DetailItem icon={Clock} label="Expiry" value={fmtTime(p.expiry_at)} />
                <DetailItem icon={ShieldCheck} label="Verified" value={p.verified ? "Yes" : "No"} />
                <DetailItem icon={DoorOpen} label="Entry Time" value={p.entry_at ? fmtTime(p.entry_at) : "—"} />
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-4 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" /> Pass Activity Timeline
                </h4>
                <div className="relative pl-1">
                  {p.timeline?.map((t, i) => {
                    const Icon = TIMELINE_ICON[t.label] || Activity;
                    const last = i === p.timeline.length - 1;
                    return (
                      <div key={i} className="flex gap-3 pb-5 last:pb-0 relative">
                        {!last && <span className="absolute left-[15px] top-8 bottom-0 w-px bg-[#E2E8F0]" />}
                        <div className="w-8 h-8 rounded-full bg-[#0F172A] flex items-center justify-center shrink-0 z-10">
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="pt-1">
                          <div className="text-sm font-semibold text-[#111827]">{t.label}</div>
                          <div className="text-xs text-[#64748B]">{t.actor} · {fmtTime(t.timestamp)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {p.status === "active" && (
                <Button data-testid="drawer-revoke-pass" onClick={() => { onRevoke(p); onClose(); }} variant="outline" className="w-full rounded-[10px] text-[#DC2626] border-[#DC2626]/30 hover:bg-[#DC2626]/5">
                  <Ban className="w-4 h-4 mr-1.5" /> Revoke Pass
                </Button>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

const DetailItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2.5">
    <Icon className="w-4 h-4 text-[#94A3B8] mt-0.5 shrink-0" />
    <div className="min-w-0">
      <div className="text-xs text-[#94A3B8]">{label}</div>
      <div className="text-sm font-semibold text-[#111827] truncate">{value}</div>
    </div>
  </div>
);

function CreatePassModal({ open, onOpenChange, onCreated }) {
  const [residentId, setResidentId] = useState("");
  const [visitor, setVisitor] = useState("");
  const [purpose, setPurpose] = useState("Personal Guest");
  const { data: residents } = useQuery({ queryKey: ["residents-min"], queryFn: fetchResidentsMin, enabled: open });

  const mut = useMutation({
    mutationFn: createPass,
    onSuccess: (p) => {
      toast.success(`Pass created · PIN ${p.pin}`);
      onCreated();
      onOpenChange(false);
      setResidentId(""); setVisitor("");
    },
    onError: (e) => toast.error(e?.response?.data?.detail || "Failed to create pass"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-[16px]">
        <DialogHeader>
          <DialogTitle className="text-[20px] font-semibold">Create Visitor Pass</DialogTitle>
          <DialogDescription className="text-[#64748B]">Simulates a resident generating a pass via WhatsApp. A 4-digit PIN is issued.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Resident</Label>
            <Select value={residentId} onValueChange={setResidentId}>
              <SelectTrigger data-testid="pass-resident-select" className="rounded-[10px]"><SelectValue placeholder="Select resident" /></SelectTrigger>
              <SelectContent className="max-h-64">
                {residents?.map((r) => <SelectItem key={r.id} value={r.id}>{r.apartment} · {r.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Visitor Name</Label>
            <Input data-testid="pass-visitor-input" placeholder="e.g. Amazon Delivery" value={visitor} onChange={(e) => setVisitor(e.target.value)} className="rounded-[10px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Purpose</Label>
            <Select value={purpose} onValueChange={setPurpose}>
              <SelectTrigger data-testid="pass-purpose-select" className="rounded-[10px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Personal Guest", "Food Delivery", "Package Delivery", "Home Service", "Family Visit", "Cab Pickup"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button data-testid="cancel-create-pass" variant="outline" onClick={() => onOpenChange(false)} className="rounded-[10px]">Cancel</Button>
          <Button data-testid="submit-create-pass" disabled={!residentId || mut.isPending} onClick={() => mut.mutate({ resident_id: residentId, visitor_name: visitor || "Visitor", purpose })} className="bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-[10px]">
            {mut.isPending ? "Generating..." : "Generate Pass"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
