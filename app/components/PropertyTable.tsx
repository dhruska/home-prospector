"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  SortingState,
  ColumnDef,
} from "@tanstack/react-table";
import type { Property } from "../types/property";

interface Props {
  data: Property[];
  columns: string[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onSortedRows: (rows: Property[]) => void;
  defaultSortId?: string;
}

export default function PropertyTable({ data, columns, selectedId, onSelect, onSortedRows, defaultSortId }: Props) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());
  const sortInitialized = useRef(false);

  const columnDefs = useMemo<ColumnDef<Property>[]>(
    () =>
      columns.map((col) => ({
        id: col,
        accessorKey: col,
        header: col,
        cell: (info) => {
          const val = info.getValue();
          if (val === null || val === undefined || val === "") return null;
          return String(val);
        },
      })),
    [columns]
  );

  const table = useReactTable({
    data,
    columns: columnDefs,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Apply default sort once when defaultSortId becomes available
  useEffect(() => {
    if (defaultSortId && !sortInitialized.current) {
      setSorting([{ id: defaultSortId, desc: false }]);
      sortInitialized.current = true;
    }
  }, [defaultSortId]);

  // Scroll selected row into view when selectedId changes
  useEffect(() => {
    if (!selectedId) return;
    const el = rowRefs.current.get(selectedId);
    if (el) {
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedId]);

  // Notify parent of current sorted row order
  useEffect(() => {
    onSortedRows(table.getRowModel().rows.map((r) => r.original));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorting, data]);

  return (
    <div className="overflow-x-auto border border-zinc-200 shadow-sm">
      <table className="min-w-full text-sm text-left text-zinc-800">
        <thead className="bg-zinc-100 text-xs uppercase text-zinc-500 sticky top-0">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const sorted = header.column.getIsSorted();
                return (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className="px-3 py-2 whitespace-nowrap cursor-pointer select-none hover:bg-zinc-200 transition-colors"
                  >
                    <span className="flex items-center gap-1">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      <span className="text-zinc-400">
                        {sorted === "asc"
                          ? " ↑"
                          : sorted === "desc"
                            ? " ↓"
                            : " ↕"}
                      </span>
                    </span>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {table.getRowModel().rows.map((row, i) => {
            const id = String(row.original.Id);
            const isSelected = selectedId === id;
            return (
              <tr
                key={row.id}
                ref={(el) => {
                  if (el) rowRefs.current.set(id, el);
                  else rowRefs.current.delete(id);
                }}
                onClick={() => onSelect(id)}
                className={
                  isSelected
                    ? "bg-blue-100 hover:bg-blue-200 cursor-pointer"
                    : `${i % 2 === 0 ? "bg-white" : "bg-zinc-50"} hover:bg-zinc-100 cursor-pointer`
                }
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-3 py-2 whitespace-nowrap max-w-[200px] truncate"
                    title={String(cell.getValue() ?? "")}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
