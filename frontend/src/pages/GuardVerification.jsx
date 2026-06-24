import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  ShieldCheck, CheckCircle2, XCircle, Delete, DoorOpen, Building2, User, Clock, RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { verifyPin, approveEntry } from "@/lib/api";
import { fmtTime } from "@/lib/format";
import { Button } from "@/components/ui/button";

export default function GuardVerification() {
  const [pin, setPin] = useState("");
  const [result, setResult] = useState(null);
  const [approved, setApproved] = useState(false);

  const verifyMut = useMutation({
    mutationFn: verifyPin,
    onSuccess: (res) => setResult(res),
    onError: () => toast.error("Verification failed. Please try again."),
  });

  const approveMut = useMutation({
    mutationFn: ({ passId, guard }) => approveEntry(passId, guard),
    onSuccess: () => { setApproved(true); toast.success("Entry approved & recorded"); },
    onError: (e) => toast.error(e?.response?.data?.detail || "Could not approve entry"),
  });

  const press = (d) => { if (pin.length < 4) setPin(pin + d); };
  const back = () => setPin(pin.slice(0, -1));
  const reset = () => { setPin(""); setResult(null); setApproved(false); };
  const submit = () => { if (pin.length === 4) verifyMut.mutate(pin); };

  const showKeypad = !result;

  return (
    <div className="animate-fade-in-up min-h-[calc(100vh-180px)] flex flex-col items-center justify-center">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-[16px] bg-[#0F172A] flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-[28px] font-bold tracking-tight text-[#111827]">Guard Verification</h1>
        <p className="text-[15px] text-[#64748B] mt-1.5">Enter the visitor's 4-digit PIN to verify entry.</p>
      </div>

      {showKeypad && (
        <div className="w-full max-w-sm">
          {/* PIN display */}
          <div className="flex justify-center gap-3 mb-8">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                data-testid={`pin-digit-${i}`}
                className={`w-16 h-20 rounded-[16px] border-2 flex items-center justify-center text-4xl font-bold transition-all ${
                  pin[i] ? "border-[#0F172A] bg-white text-[#111827]" : "border-[#E2E8F0] bg-white text-[#CBD5E1]"
                } ${pin.length === i ? "ring-4 ring-[#0F172A]/10 border-[#0F172A]" : ""}`}
              >
                {pin[i] || "•"}
              </div>
            ))}
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button
                key={n}
                data-testid={`keypad-${n}`}
                onClick={() => press(String(n))}
                className="h-16 rounded-[14px] bg-white border border-[#E2E8F0] text-2xl font-semibold text-[#111827] hover:bg-[#F1F5F9] active:scale-95 transition-all shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
              >
                {n}
              </button>
            ))}
            <button data-testid="keypad-clear" onClick={reset} className="h-16 rounded-[14px] bg-white border border-[#E2E8F0] text-sm font-semibold text-[#64748B] hover:bg-[#F1F5F9] active:scale-95 transition-all">
              <RotateCcw className="w-5 h-5 mx-auto" />
            </button>
            <button data-testid="keypad-0" onClick={() => press("0")} className="h-16 rounded-[14px] bg-white border border-[#E2E8F0] text-2xl font-semibold text-[#111827] hover:bg-[#F1F5F9] active:scale-95 transition-all shadow-[0_1px_2px_rgba(15,23,42,0.04)]">0</button>
            <button data-testid="keypad-back" onClick={back} className="h-16 rounded-[14px] bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9] active:scale-95 transition-all">
              <Delete className="w-5 h-5 mx-auto" />
            </button>
          </div>

          <Button
            data-testid="verify-pin-button"
            onClick={submit}
            disabled={pin.length !== 4 || verifyMut.isPending}
            className="w-full mt-6 h-14 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-[14px] text-base font-semibold"
          >
            {verifyMut.isPending ? "Verifying..." : "Verify PIN"}
          </Button>
        </div>
      )}

      {/* Valid */}
      {result?.valid && (
        <div data-testid="verify-success-panel" className="w-full max-w-md animate-fade-in-up">
          <div className="bg-white rounded-[20px] border-2 border-[#16A34A]/30 overflow-hidden shadow-[0_8px_30px_rgba(22,163,74,0.12)]">
            <div className="bg-[#16A34A] px-6 py-7 text-center">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-9 h-9 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Access Granted</h2>
              <p className="text-white/80 text-sm mt-0.5 font-mono tracking-widest">PIN {result.pin}</p>
            </div>
            <div className="p-6 space-y-4">
              <ResultRow icon={Building2} label="Apartment" value={result.apartment} />
              <ResultRow icon={User} label="Resident" value={result.resident_name} />
              <ResultRow icon={User} label="Visitor" value={result.visitor_name} />
              <ResultRow icon={Clock} label="Valid Until" value={fmtTime(result.expiry_at)} />

              {approved ? (
                <div data-testid="entry-approved-banner" className="flex items-center gap-2 justify-center py-3 rounded-[12px] bg-[#16A34A]/10 text-[#16A34A] font-semibold">
                  <CheckCircle2 className="w-5 h-5" /> Entry Approved & Recorded
                </div>
              ) : (
                <Button
                  data-testid="approve-entry-button"
                  onClick={() => approveMut.mutate({ passId: result.pass_id, guard: "Ramesh Yadav" })}
                  disabled={approveMut.isPending}
                  className="w-full h-13 py-3.5 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-[14px] text-base font-semibold"
                >
                  <DoorOpen className="w-5 h-5 mr-2" /> {approveMut.isPending ? "Approving..." : "Approve Entry"}
                </Button>
              )}
              <button data-testid="verify-another-button" onClick={reset} className="w-full text-sm text-[#64748B] hover:text-[#0F172A] font-medium py-2">Verify Another PIN</button>
            </div>
          </div>
        </div>
      )}

      {/* Invalid */}
      {result && !result.valid && (
        <div data-testid="verify-error-panel" className="w-full max-w-md animate-fade-in-up">
          <div className="bg-white rounded-[20px] border-2 border-[#DC2626]/30 overflow-hidden shadow-[0_8px_30px_rgba(220,38,38,0.12)]">
            <div className="bg-[#DC2626] px-6 py-7 text-center">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
                <XCircle className="w-9 h-9 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Access Denied</h2>
              <p className="text-white/80 text-sm mt-0.5">Reason: {result.reason}</p>
            </div>
            <div className="p-6">
              <p className="text-center text-[#475569] mb-5">{result.message}</p>
              <Button data-testid="verify-retry-button" onClick={reset} className="w-full h-13 py-3.5 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-[14px] text-base font-semibold">Try Another PIN</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const ResultRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 py-2 border-b border-[#F1F5F9] last:border-0">
    <div className="w-9 h-9 rounded-[10px] bg-[#F1F5F9] flex items-center justify-center">
      <Icon className="w-4 h-4 text-[#64748B]" />
    </div>
    <span className="text-sm text-[#64748B]">{label}</span>
    <span className="text-sm font-semibold text-[#111827] ml-auto">{value}</span>
  </div>
);
