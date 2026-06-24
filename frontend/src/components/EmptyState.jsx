import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

export const EmptyState = ({ icon: Icon = Inbox, title, description, actionLabel, onAction, testId }) => {
  return (
    <div
      data-testid={testId || "empty-state"}
      className="flex flex-col items-center justify-center py-20 px-6 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-[#F1F5F9] flex items-center justify-center mb-5">
        <Icon className="w-7 h-7 text-[#94A3B8]" strokeWidth={1.5} />
      </div>
      <h3 className="text-[18px] font-semibold text-[#111827]">{title}</h3>
      {description && (
        <p className="text-sm text-[#64748B] mt-1.5 max-w-sm">{description}</p>
      )}
      {actionLabel && (
        <Button
          data-testid="empty-state-action"
          onClick={onAction}
          className="mt-6 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-[10px]"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
