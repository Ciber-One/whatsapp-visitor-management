import { format, formatDistanceToNow, parseISO } from "date-fns";

export const fmtTime = (iso) => {
  if (!iso) return "-";
  try {
    return format(parseISO(iso), "MMM d, h:mm a");
  } catch {
    return "-";
  }
};

export const fmtTimeShort = (iso) => {
  if (!iso) return "-";
  try {
    return format(parseISO(iso), "h:mm a");
  } catch {
    return "-";
  }
};

export const fmtDate = (iso) => {
  if (!iso) return "-";
  try {
    return format(parseISO(iso), "MMM d, yyyy");
  } catch {
    return "-";
  }
};

export const fmtRelative = (iso) => {
  if (!iso) return "-";
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true });
  } catch {
    return "-";
  }
};
