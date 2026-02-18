export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPrice(amount: number): string {
  if (amount < 1) {
    return `$${amount}`;
  }
  return formatUsd(amount);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

export function extractTld(domain: string): string {
  if (domain.endsWith(".base.eth")) return "base.eth";
  const parts = domain.split(".");
  return parts[parts.length - 1];
}

export function extractSld(domain: string): string {
  if (domain.endsWith(".base.eth")) return domain.replace(".base.eth", "");
  const parts = domain.split(".");
  return parts.slice(0, -1).join(".");
}
