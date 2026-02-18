import type { DomainCheckResult } from "@/types";
import { DomainCard } from "./domain-card";

export function SearchResults({ results }: { results: DomainCheckResult[] }) {
  const available = results.filter((r) => r.available);
  const taken = results.filter((r) => !r.available);

  return (
    <div className="space-y-3">
      {available.map((result, i) => (
        <div key={result.domain} className={`stagger-${Math.min(i + 1, 6)}`}>
          <DomainCard result={result} />
        </div>
      ))}
      {taken.map((result, i) => (
        <div key={result.domain} className={`stagger-${Math.min(available.length + i + 1, 6)}`}>
          <DomainCard result={result} />
        </div>
      ))}
    </div>
  );
}
