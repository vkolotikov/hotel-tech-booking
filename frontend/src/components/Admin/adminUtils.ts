export function formatMoney(value: number): string {
  return `EUR ${value.toFixed(2)}`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value || value === "0000-00-00" || value === "0000-00-00 00:00:00") {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateRange(from: string, to: string): string {
  if (
    !from ||
    !to ||
    from === "0000-00-00" ||
    to === "0000-00-00" ||
    from === "0000-00-00 00:00:00" ||
    to === "0000-00-00 00:00:00"
  ) {
    return "Stay dates unavailable";
  }

  return `${formatDate(from)} to ${formatDate(to)}`;
}

export function paymentStateLabel(value: string): string {
  if (value === "invoice_waiting") {
    return "Invoice waiting";
  }

  if (value === "channel_managed") {
    return "Channel managed";
  }

  return value.replace(/_/g, " ");
}
