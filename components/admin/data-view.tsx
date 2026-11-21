"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RefreshCw, Search, SearchX, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/utils/twMerge";
import { TimeAgo } from "./time-ago";

/**
 * A list that works at any size: a table on wide screens, cards on phones.
 * Search, filters, pagination, row numbers, item count and refresh are
 * built in. Everything runs in the browser over the rows it's given.
 */

export type DataColumn<T> = {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
};

export type DataFilter<T> = {
  id: string;
  /** Shown as "All <label>" when nothing is picked, e.g. "statuses". */
  label: string;
  options: { value: string; label: string }[];
  match: (row: T, value: string) => boolean;
};

const ALL = "__all";
const PAGE_SIZES = [10, 25, 50, 100];

export function DataView<T>({
  rows,
  rowKey,
  columns,
  card,
  actions,
  searchText,
  searchPlaceholder = "Search…",
  filters = [],
  noun,
  toolbar,
  empty,
  loadedAt,
  rowClassName,
  onRowClick,
}: {
  rows: T[];
  rowKey: (row: T) => string;
  columns: DataColumn<T>[];
  /** How one row looks on a phone. `number` is its position in the list. */
  card: (row: T, number: number) => ReactNode;
  /** Buttons/menu for a row (last table column; top-right of a card). */
  actions?: (row: T) => ReactNode;
  /** Text to search in, e.g. name + email. */
  searchText?: (row: T) => string;
  searchPlaceholder?: string;
  filters?: DataFilter<T>[];
  /** Singular and plural, e.g. ["user", "users"]. */
  noun: [string, string];
  /** Extra buttons on the right of the toolbar (e.g. "Add user"). */
  toolbar?: ReactNode;
  /** Shown when there are no rows at all. */
  empty?: ReactNode;
  /** When the server produced these rows (for "Updated 2 mins ago"). */
  loadedAt?: string;
  rowClassName?: (row: T) => string | undefined;
  onRowClick?: (row: T) => void;
}) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);

  const filtered = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return rows.filter((row) => {
      for (const f of filters) {
        const value = picked[f.id];
        if (value && value !== ALL && !f.match(row, value)) return false;
      }
      if (words.length && searchText) {
        const haystack = searchText(row).toLowerCase();
        if (!words.every((w) => haystack.includes(w))) return false;
      }
      return true;
    });
  }, [rows, filters, picked, query, searchText]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const start = (current - 1) * pageSize;
  const visible = filtered.slice(start, start + pageSize);
  const narrowed = Boolean(query.trim()) || Object.values(picked).some((v) => v && v !== ALL);
  const word = (n: number) => (n === 1 ? noun[0] : noun[1]);

  const resetFilters = () => {
    setQuery("");
    setPicked({});
    setPage(1);
  };

  if (rows.length === 0 && empty) {
    return (
      <div className="grid gap-3">
        <Toolbar>
          <span className="text-sm text-muted-foreground">0 {noun[1]}</span>
          <div className="ml-auto flex items-center gap-2">
            <RefreshButton refreshing={refreshing} onClick={() => startRefresh(() => router.refresh())} />
            {toolbar}
          </div>
        </Toolbar>
        {empty}
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {/* Search, filters and actions */}
      <Toolbar>
        {searchText && (
          <div className="relative min-w-0 flex-1 basis-56">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="pl-8 pr-8 [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 grid size-5 -translate-y-1/2 cursor-pointer place-items-center rounded text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        )}
        {filters.map((f) => (
          <Select
            key={f.id}
            value={picked[f.id] ?? ALL}
            onValueChange={(value) => {
              setPicked((p) => ({ ...p, [f.id]: value }));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-auto min-w-36" aria-label={`Filter by ${f.label}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All {f.label}</SelectItem>
              {f.options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <RefreshButton refreshing={refreshing} onClick={() => startRefresh(() => router.refresh())} />
          {toolbar}
        </div>
      </Toolbar>

      {/* Count */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-sm text-muted-foreground" aria-live="polite">
        <span>
          {filtered.length === 0 ? (
            <>No {noun[1]} match</>
          ) : (
            <>
              Showing <strong className="font-semibold text-foreground">{start + 1}</strong>–
              <strong className="font-semibold text-foreground">{start + visible.length}</strong> of{" "}
              <strong className="font-semibold text-foreground">{filtered.length}</strong> {word(filtered.length)}
            </>
          )}
          {narrowed && (
            <>
              {" "}
              (filtered from {rows.length}){" "}
              <button type="button" onClick={resetFilters} className="cursor-pointer font-medium text-foreground underline-offset-4 hover:underline">
                Clear filters
              </button>
            </>
          )}
        </span>
        {loadedAt && (
          <span className="flex items-center gap-1.5 text-xs">
            {refreshing ? <Spinner className="size-3" /> : null}
            Updated <TimeAgo date={loadedAt} />
          </span>
        )}
      </div>

      {filtered.length === 0 ? (
        <Card className="grid justify-items-center gap-2 px-6 py-12 text-center">
          <SearchX className="size-8 text-muted-foreground" aria-hidden />
          <p className="font-medium">Nothing matches</p>
          <p className="text-sm text-muted-foreground">Try other words or clear the filters.</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={resetFilters}>
            Clear filters
          </Button>
        </Card>
      ) : (
        <div className={cn("grid gap-3 transition-opacity", refreshing && "opacity-60")}>
          {/* Wide screens: table */}
          <Card className="hidden overflow-hidden p-0 md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-12 text-right">#</TableHead>
                  {columns.map((c) => (
                    <TableHead key={c.id} className={c.className}>
                      {c.header}
                    </TableHead>
                  ))}
                  {actions && (
                    <TableHead className="w-12">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((row, i) => (
                  <TableRow
                    key={rowKey(row)}
                    className={cn(onRowClick && "cursor-pointer", rowClassName?.(row))}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                  >
                    <TableCell className="text-right tabular-nums text-muted-foreground">{start + i + 1}</TableCell>
                    {columns.map((c) => (
                      <TableCell key={c.id} className={c.className}>
                        {c.cell(row)}
                      </TableCell>
                    ))}
                    {actions && (
                      <TableCell onClick={(e) => e.stopPropagation()} className="text-right">
                        {actions(row)}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Phones: cards */}
          <ul className="grid gap-3 md:hidden">
            {visible.map((row, i) => (
              <li key={rowKey(row)}>
                <Card
                  className={cn("relative p-4", onRowClick && "cursor-pointer active:bg-muted/40", rowClassName?.(row))}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 min-w-6 rounded-md bg-muted px-1.5 py-0.5 text-center text-xs font-semibold tabular-nums text-muted-foreground">
                      {start + i + 1}
                    </span>
                    <div className="min-w-0 flex-1">{card(row, start + i + 1)}</div>
                    {actions && (
                      <div className="-mr-2 -mt-1.5" onClick={(e) => e.stopPropagation()}>
                        {actions(row)}
                      </div>
                    )}
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pagination */}
      {filtered.length > PAGE_SIZES[0] && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="hidden sm:inline">Rows per page</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(Number(v));
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-20" aria-label="Rows per page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <span className="mr-2 text-muted-foreground">
              Page <strong className="text-foreground">{current}</strong> of {pages}
            </span>
            <PageButton label="First page" disabled={current === 1} onClick={() => setPage(1)} icon={ChevronsLeft} className="hidden sm:inline-flex" />
            <PageButton label="Previous page" disabled={current === 1} onClick={() => setPage(current - 1)} icon={ChevronLeft} />
            <PageButton label="Next page" disabled={current === pages} onClick={() => setPage(current + 1)} icon={ChevronRight} />
            <PageButton label="Last page" disabled={current === pages} onClick={() => setPage(pages)} icon={ChevronsRight} className="hidden sm:inline-flex" />
          </div>
        </div>
      )}
    </div>
  );
}

function Toolbar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

function RefreshButton({ refreshing, onClick }: { refreshing: boolean; onClick: () => void }) {
  return (
    <Button type="button" variant="outline" size="icon" onClick={onClick} loading={refreshing} aria-label="Refresh" title="Refresh">
      <RefreshCw />
    </Button>
  );
}

function PageButton({
  label,
  icon: Icon,
  disabled,
  onClick,
  className,
}: {
  label: string;
  icon: typeof ChevronLeft;
  disabled: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button type="button" variant="outline" size="icon" className={cn("size-8", className)} disabled={disabled} onClick={onClick} aria-label={label} title={label}>
      <Icon />
    </Button>
  );
}
