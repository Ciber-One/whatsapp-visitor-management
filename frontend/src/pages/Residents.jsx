import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Search, Users, Eye, Pencil, Ban, CheckCircle2,
  Phone, Building2, ChevronLeft, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { fetchResidents, createResident, toggleResident, fetchResident } from "@/lib/api";
import { fmtDate, fmtTime } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { TableSkeleton } from "@/components/Skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const PAGE_SIZE = 8;

export default function Residents() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [detailId, setDetailId] = useState(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["residents", search, status, page],
    queryFn: () => fetchResidents({ search, status, page, page_size: PAGE_SIZE }),
  });

  const toggleMut = useMutation({
    mutationFn: toggleResident,
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["residents"] });
      toast.success(`${r.name} ${r.status === "active" ? "enabled" : "disabled"}`);
    },
  });

  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const items = data?.items || [];

  return (
    <div className="animate-fade-in-up">
      <PageHeader title="Residents" subtitle={`${total} registered ${total === 1 ? "resident" : "residents"} across the society.`}>
        <Button data-testid="add-resident-button" onClick={() => setAddOpen(true)} className="bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-[10px]">
          <Plus className="w-4 h-4 mr-1.5" /> Add Resident
        </Button>
      </PageHeader>

      <div className="bg-white rounded-[12px] border border-[#E2E8F0] shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-[#E2E8F0]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <Input
              data-testid="residents-search"
              placeholder="Search by name, apartment, or phone..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 rounded-[10px] border-[#E2E8F0] bg-[#F8FAFC] focus-visible:ring-[#0F172A]/20"
            />
          </div>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger data-testid="residents-status-filter" className="w-full sm:w-44 rounded-[10px] border-[#E2E8F0]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : isError ? (
          <div className="p-10 text-center">
            <p className="text-[#DC2626] font-semibold">Failed to Load Residents</p>
            <Button data-testid="residents-retry" onClick={refetch} className="mt-4 bg-[#0F172A] text-white rounded-[10px]">Retry</Button>
          </div>
        ) : items.length === 0 ? (
          <EmptyState testId="residents-empty" icon={Users} title="No Residents Found" description="No residents match your filters. Add a new resident to get started." actionLabel="Add Resident" onAction={() => setAddOpen(true)} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[#64748B] border-b border-[#E2E8F0]">
                  <th className="font-medium px-5 py-3">Apartment</th>
                  <th className="font-medium px-5 py-3">Resident Name</th>
                  <th className="font-medium px-5 py-3">Phone Number</th>
                  <th className="font-medium px-5 py-3">Status</th>
                  <th className="font-medium px-5 py-3">Created</th>
                  <th className="font-medium px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id} data-testid={`resident-row-${r.apartment}`} className="border-b border-[#E2E8F0] last:border-0 hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-2 font-semibold text-[#111827]">
                        <span className="w-7 h-7 rounded-[8px] bg-[#F1F5F9] flex items-center justify-center text-[11px] font-bold text-[#475569]">{r.apartment.split("-")[0]}</span>
                        {r.apartment}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-[#111827]">{r.name}</td>
                    <td className="px-5 py-3.5 text-[#475569] whitespace-nowrap">{r.phone}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={r.status} /></td>
                    <td className="px-5 py-3.5 text-[#64748B] whitespace-nowrap">{fmtDate(r.created_at)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button data-testid={`view-resident-${r.apartment}`} onClick={() => setDetailId(r.id)} title="View" className="p-2 rounded-[8px] hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A]">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button data-testid={`edit-resident-${r.apartment}`} onClick={() => setDetailId(r.id)} title="Edit" className="p-2 rounded-[8px] hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A]">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          data-testid={`toggle-resident-${r.apartment}`}
                          onClick={() => toggleMut.mutate(r.id)}
                          title={r.status === "active" ? "Disable" : "Enable"}
                          className={`p-2 rounded-[8px] hover:bg-[#F1F5F9] ${r.status === "active" ? "text-[#DC2626]" : "text-[#16A34A]"}`}
                        >
                          {r.status === "active" ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {items.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#E2E8F0]">
            <span className="text-xs text-[#64748B]">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
            </span>
            <div className="flex items-center gap-1.5">
              <button data-testid="residents-prev-page" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="p-2 rounded-[8px] border border-[#E2E8F0] disabled:opacity-40 hover:bg-[#F8FAFC] text-[#475569]">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-[#111827] px-2">{page} / {totalPages}</span>
              <button data-testid="residents-next-page" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="p-2 rounded-[8px] border border-[#E2E8F0] disabled:opacity-40 hover:bg-[#F8FAFC] text-[#475569]">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <AddResidentModal open={addOpen} onOpenChange={setAddOpen} onCreated={() => qc.invalidateQueries({ queryKey: ["residents"] })} />
      <ResidentDrawer id={detailId} onClose={() => setDetailId(null)} onToggle={(id) => toggleMut.mutate(id)} />
    </div>
  );
}

function AddResidentModal({ open, onOpenChange, onCreated }) {
  const [form, setForm] = useState({ apartment: "", name: "", phone: "", status: "active" });
  const [errors, setErrors] = useState({});

  const mut = useMutation({
    mutationFn: createResident,
    onSuccess: () => {
      toast.success("Resident added successfully");
      onCreated();
      onOpenChange(false);
      setForm({ apartment: "", name: "", phone: "", status: "active" });
      setErrors({});
    },
    onError: (e) => toast.error(e?.response?.data?.detail || "Failed to add resident"),
  });

  const validate = () => {
    const er = {};
    if (!form.apartment.trim()) er.apartment = "Apartment number is required";
    if (!form.name.trim()) er.name = "Resident name is required";
    if (!form.phone.trim()) er.phone = "Phone number is required";
    else if (form.phone.replace(/\D/g, "").length < 10) er.phone = "Enter a valid phone number";
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const submit = () => { if (validate()) mut.mutate(form); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-[16px]">
        <DialogHeader>
          <DialogTitle className="text-[20px] font-semibold">Add Resident</DialogTitle>
          <DialogDescription className="text-[#64748B]">Register a new resident to the society directory.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <Field label="Apartment Number" error={errors.apartment}>
            <Input data-testid="resident-apartment-input" placeholder="e.g. A-204" value={form.apartment} onChange={(e) => setForm({ ...form, apartment: e.target.value })} className="rounded-[10px]" />
          </Field>
          <Field label="Resident Name" error={errors.name}>
            <Input data-testid="resident-name-input" placeholder="e.g. Priya Sharma" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-[10px]" />
          </Field>
          <Field label="Phone Number" error={errors.phone}>
            <Input data-testid="resident-phone-input" placeholder="e.g. +91 98765 43210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-[10px]" />
          </Field>
          <Field label="Status">
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger data-testid="resident-status-input" className="rounded-[10px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <DialogFooter>
          <Button data-testid="cancel-resident-button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-[10px]">Cancel</Button>
          <Button data-testid="save-resident-button" onClick={submit} disabled={mut.isPending} className="bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-[10px]">
            {mut.isPending ? "Saving..." : "Save Resident"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, error, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-[#111827]">{label}</Label>
      {children}
      {error && <p className="text-xs text-[#DC2626]">{error}</p>}
    </div>
  );
}

function ResidentDrawer({ id, onClose, onToggle }) {
  const { data, isLoading } = useQuery({
    queryKey: ["resident", id],
    queryFn: () => fetchResident(id),
    enabled: !!id,
  });

  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0">
        {isLoading || !data ? (
          <div className="p-6"><TableSkeleton rows={6} cols={1} /></div>
        ) : (
          <>
            <SheetHeader className="p-6 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-[12px] bg-gradient-to-br from-[#334155] to-[#0F172A] flex items-center justify-center text-white font-semibold">
                  {data.resident.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>
                <div>
                  <SheetTitle className="text-[18px]">{data.resident.name}</SheetTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={data.resident.status} />
                  </div>
                </div>
              </div>
            </SheetHeader>
            <div className="p-6 space-y-5">
              <InfoRow icon={Building2} label="Apartment" value={data.resident.apartment} />
              <InfoRow icon={Phone} label="Phone" value={data.resident.phone} />

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-3">Visitor Statistics</h4>
                <div className="grid grid-cols-3 gap-3">
                  <StatBox label="Total" value={data.stats.total_passes} />
                  <StatBox label="Used" value={data.stats.used} />
                  <StatBox label="Active" value={data.stats.active} />
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-2">Last Generated Pass</h4>
                {data.last_pass ? (
                  <div className="rounded-[12px] border border-[#E2E8F0] p-4 bg-[#F8FAFC]">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[#111827] tracking-widest text-lg">{data.last_pass.pin}</span>
                      <StatusBadge status={data.last_pass.status} />
                    </div>
                    <div className="text-xs text-[#64748B] mt-2">Generated {fmtTime(data.last_pass.created_at)}</div>
                  </div>
                ) : (
                  <p className="text-sm text-[#94A3B8]">No passes generated yet.</p>
                )}
              </div>

              <Button
                data-testid="drawer-toggle-resident"
                onClick={() => { onToggle(data.resident.id); onClose(); }}
                variant="outline"
                className={`w-full rounded-[10px] ${data.resident.status === "active" ? "text-[#DC2626] border-[#DC2626]/30 hover:bg-[#DC2626]/5" : "text-[#16A34A] border-[#16A34A]/30 hover:bg-[#16A34A]/5"}`}
              >
                {data.resident.status === "active" ? "Disable Resident" : "Enable Resident"}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3">
    <div className="w-9 h-9 rounded-[10px] bg-[#F1F5F9] flex items-center justify-center">
      <Icon className="w-4 h-4 text-[#64748B]" />
    </div>
    <div>
      <div className="text-xs text-[#94A3B8]">{label}</div>
      <div className="text-sm font-semibold text-[#111827]">{value}</div>
    </div>
  </div>
);

const StatBox = ({ label, value }) => (
  <div className="rounded-[12px] border border-[#E2E8F0] p-3 text-center bg-[#F8FAFC]">
    <div className="text-[22px] font-bold text-[#111827]">{value}</div>
    <div className="text-xs text-[#64748B]">{label}</div>
  </div>
);
