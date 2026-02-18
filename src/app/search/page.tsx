import { SearchResults } from "@/components/search/search-results";
import Link from "next/link";
import type { DomainCheckResult } from "@/types";

async function fetchResults(names: string): Promise<DomainCheckResult[]> {
  const baseUrl = "http://localhost:3000";
  const res = await fetch(
    `${baseUrl}/api/domains/check?names=${encodeURIComponent(names)}`,
    { cache: "no-store" },
  );
  if (!res.ok) return [];
  return res.json();
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ names?: string; domains?: string }>;
}) {
  const params = await searchParams;
  const namesParam = params.names || params.domains || "";

  if (!namesParam) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-bg-surface border border-border-subtle flex items-center justify-center mx-auto mb-6">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-tertiary">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <p className="text-text-secondary font-medium">No names to search</p>
        <Link href="/" className="inline-flex items-center gap-2 text-accent text-sm mt-4 hover:underline underline-offset-4">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to search
        </Link>
      </div>
    );
  }

  const results = await fetchResults(namesParam);
  const baseLabel = namesParam.split(",")[0]?.split(".")[0] || "";
  const availableCount = results.filter((r) => r.available).length;

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10 sm:py-16">
      <div className="mb-8 animate-fade-in">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs text-text-tertiary hover:text-accent transition-colors mb-6 group"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back
        </Link>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
          Results for{" "}
          <span className="font-mono text-accent">&quot;{baseLabel}&quot;</span>
        </h1>
        <div className="flex items-center gap-3 mt-3">
          <span className="inline-flex items-center gap-1.5 text-xs text-text-tertiary font-mono tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            {availableCount} available
          </span>
          <span className="w-1 h-1 rounded-full bg-border-default" />
          <span className="text-xs text-text-tertiary font-mono tracking-wide">
            {results.length} checked
          </span>
        </div>
      </div>

      {results.length > 0 ? (
        <SearchResults results={results} />
      ) : (
        <div className="text-center py-16 rounded-2xl border border-border-subtle bg-bg-surface">
          <p className="text-text-secondary">No results found</p>
          <p className="text-xs text-text-tertiary mt-1">Try a different name</p>
        </div>
      )}
    </div>
  );
}
