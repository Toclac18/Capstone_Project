import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";

export function safeFormatDistance(dateString: string | null | undefined) {
  const d = new Date(dateString ?? "");

  if (isNaN(d.getTime())) {
    return "Unknown time";
  }

  return formatDistanceToNow(d, { addSuffix: true, locale: enUS });
}
