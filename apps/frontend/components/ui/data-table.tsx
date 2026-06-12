"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  FilterFn,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp, ChevronsUpDown, CalendarIcon } from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";

// Date range filter: row[dateKey] must fall within [from, to]
const dateRangeFilter: FilterFn<unknown> = (row, columnId, filterValue: [string, string]) => {
  const [from, to] = filterValue ?? [];
  const raw = row.getValue<string>(columnId);
  if (!raw) return true;
  const date = new Date(raw).toISOString().slice(0, 10);
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
};

type QuickRange = "today" | "week" | "month" | "year" | "all";

function getQuickRange(range: QuickRange): [string, string] {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = fmt(now);

  if (range === "today") return [today, today];
  if (range === "week") {
    const from = new Date(now);
    from.setDate(now.getDate() - 6);
    return [fmt(from), today];
  }
  if (range === "month") {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return [fmt(from), today];
  }
  if (range === "year") {
    const from = new Date(now.getFullYear(), 0, 1);
    return [fmt(from), today];
  }
  return ["", ""];
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  pageSize?: number;
  dateKey?: string; // column id that holds a date string (ISO)
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search…",
  pageSize = 10,
  dateKey,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activeQuick, setActiveQuick] = useState<QuickRange | null>(null);

  const applyQuick = (range: QuickRange) => {
    setActiveQuick(range);
    if (range === "all") {
      setDateFrom("");
      setDateTo("");
    } else {
      const [f, t] = getQuickRange(range);
      setDateFrom(f);
      setDateTo(t);
    }
  };

  const augmentedFilters = useMemo<ColumnFiltersState>(() => {
    if (!dateKey) return columnFilters;
    const base = columnFilters.filter((f) => f.id !== dateKey);
    if (dateFrom || dateTo) {
      base.push({ id: dateKey, value: [dateFrom, dateTo] });
    }
    return base;
  }, [columnFilters, dateKey, dateFrom, dateTo]);

  const augmentedColumns = useMemo<ColumnDef<TData, TValue>[]>(() => {
    if (!dateKey) return columns;
    return columns.map((col) => {
      const id = (col as { accessorKey?: string }).accessorKey ?? (col as { id?: string }).id;
      if (id !== dateKey) return col;
      return { ...col, filterFn: dateRangeFilter as FilterFn<TData> };
    });
  }, [columns, dateKey]);

  const table = useReactTable({
    data,
    columns: augmentedColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: { sorting, columnFilters: augmentedFilters },
    initialState: { pagination: { pageSize } },
  });

  const hasDateFilter = !!(dateFrom || dateTo);

  return (
    <div className="space-y-3">
      {/* Search + Date filter toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {searchKey && (
          <Input
            placeholder={searchPlaceholder}
            value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
            onChange={(e) => table.getColumn(searchKey)?.setFilterValue(e.target.value)}
            className="w-full sm:max-w-sm bg-white"
          />
        )}

        {dateKey && (
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            {/* Quick picks */}
            {(["today", "week", "month", "year", "all"] as QuickRange[]).map((r) => (
              <button
                key={r}
                onClick={() => applyQuick(r)}
                className={`px-3 py-2 sm:px-2.5 sm:py-1.5 rounded text-xs font-medium border transition-colors capitalize ${
                  activeQuick === r
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-white text-muted-foreground border-gray-200 hover:border-primary hover:text-primary"
                }`}
              >
                {r === "week" ? "7d" : r === "month" ? "This month" : r === "year" ? "This year" : r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}

            {/* Custom range */}
            <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded px-2 py-1">
              <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setActiveQuick(null); }}
                className="text-xs bg-transparent outline-none text-gray-700 w-[110px]"
              />
              <span className="text-muted-foreground text-xs">–</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setActiveQuick(null); }}
                className="text-xs bg-transparent outline-none text-gray-700 w-[110px]"
              />
            </div>

            {hasDateFilter && (
              <button
                onClick={() => { setDateFrom(""); setDateTo(""); setActiveQuick("all"); }}
                className="text-xs text-muted-foreground hover:text-gray-700 underline"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-gray-50 hover:bg-gray-50">
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className="font-semibold text-gray-700">
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button
                        className="flex items-center gap-1 hover:text-primary transition-colors"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === "asc" ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : header.column.getIsSorted() === "desc" ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronsUpDown className="h-3 w-3 opacity-40" />
                        )}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-gray-50/50">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-muted-foreground py-12">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div className="flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {table.getState().pagination.pageIndex * pageSize + 1}–
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * pageSize,
              table.getFilteredRowModel().rows.length
            )}{" "}
            of {table.getFilteredRowModel().rows.length}
          </p>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="min-h-[40px] flex-1 sm:min-h-0 sm:flex-none"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="min-h-[40px] flex-1 sm:min-h-0 sm:flex-none"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
