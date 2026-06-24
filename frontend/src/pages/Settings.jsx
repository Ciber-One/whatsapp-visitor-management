import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2, ShieldCheck, Bell, MessageCircle, Save, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { fetchSettings, updateSettings } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export default function Settings() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  const [form, setForm] = useState(null);

  useEffect(() => { if (data) setForm(data); }, [data]);

  const mut = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["settings"] }); toast.success("Settings saved successfully"); },
    onError: () => toast.error("Failed to save settings"),
  });

  if (isLoading || !form) {
    return (
      <div className="animate-fade-in-up">
        <PageHeader title="Settings" subtitle="Configure your society and security preferences." />
        <div className="space-y-5 max-w-3xl">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-44 rounded-[12px] bg-white border border-[#E2E8F0]" />)}
        </div>
      </div>
    );
  }

  const set = (k, v) => setForm({ ...form, [k]: v });

  return (
    <div className="animate-fade-in-up">
      <PageHeader title="Settings" subtitle="Configure your society and security preferences.">
        <Button data-testid="save-settings-button" onClick={() => mut.mutate(form)} disabled={mut.isPending} className="bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-[10px]">
          <Save className="w-4 h-4 mr-1.5" /> {mut.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </PageHeader>

      <div className="space-y-5 max-w-3xl">
        <Section icon={Building2} title="Society Information" subtitle="Basic details about your residential society.">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Society Name</Label>
            <Input data-testid="society-name-input" value={form.society_name} onChange={(e) => set("society_name", e.target.value)} className="rounded-[10px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Address</Label>
            <Input data-testid="society-address-input" value={form.address} onChange={(e) => set("address", e.target.value)} className="rounded-[10px]" />
          </div>
        </Section>

        <Section icon={ShieldCheck} title="Security Settings" subtitle="Control how visitor passes behave.">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">PIN Expiry Duration</Label>
            <Select value={String(form.pin_expiry_minutes)} onValueChange={(v) => set("pin_expiry_minutes", Number(v))}>
              <SelectTrigger data-testid="pin-expiry-select" className="rounded-[10px] sm:w-64"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
                <SelectItem value="360">6 hours</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-[#94A3B8]">Passes automatically expire after this duration once generated.</p>
          </div>
        </Section>

        <Section icon={Bell} title="Notification Settings" subtitle="Manage resident notifications.">
          <ToggleRow testId="notify-entry-switch" label="Notify resident on visitor entry" description="Send a WhatsApp confirmation when a visitor is approved." checked={form.notify_on_entry} onChange={(v) => set("notify_on_entry", v)} />
          <ToggleRow testId="notify-expiry-switch" label="Notify resident on pass expiry" description="Alert residents when their generated pass expires unused." checked={form.notify_on_expiry} onChange={(v) => set("notify_on_expiry", v)} />
        </Section>

        <Section icon={MessageCircle} title="WhatsApp Integration" subtitle="Status of the resident-facing WhatsApp bot.">
          <div className="flex items-center justify-between rounded-[12px] border border-[#E2E8F0] p-4 bg-[#F8FAFC]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[10px] bg-[#16A34A]/10 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-[#16A34A]" />
              </div>
              <div>
                <div className="text-sm font-semibold text-[#111827]">WhatsApp Business API</div>
                <div className="text-xs text-[#64748B]">Residents generate passes via the connected bot</div>
              </div>
            </div>
            {form.whatsapp_enabled ? (
              <span data-testid="whatsapp-status" className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#16A34A]/10 text-[#16A34A] text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Connected
              </span>
            ) : (
              <span data-testid="whatsapp-status" className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DC2626]/10 text-[#DC2626] text-xs font-semibold">Disconnected</span>
            )}
          </div>
          <ToggleRow testId="whatsapp-enabled-switch" label="Enable WhatsApp pass generation" description="Allow residents to generate visitor passes through WhatsApp." checked={form.whatsapp_enabled} onChange={(v) => set("whatsapp_enabled", v)} />
        </Section>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="bg-white rounded-[12px] border border-[#E2E8F0] shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E2E8F0]">
        <div className="w-9 h-9 rounded-[10px] bg-[#F1F5F9] flex items-center justify-center">
          <Icon className="w-[18px] h-[18px] text-[#475569]" />
        </div>
        <div>
          <h2 className="text-[16px] font-semibold text-[#111827]">{title}</h2>
          <p className="text-xs text-[#94A3B8]">{subtitle}</p>
        </div>
      </div>
      <div className="p-5 space-y-5">{children}</div>
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange, testId }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-sm font-medium text-[#111827]">{label}</div>
        <div className="text-xs text-[#64748B] mt-0.5">{description}</div>
      </div>
      <Switch data-testid={testId} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
