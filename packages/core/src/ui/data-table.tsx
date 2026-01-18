"use client";

import React, { ReactNode, useState, useMemo } from "react";

/**
 * DataTable - データテーブル
 *
 * 機能:
 * - ソート
 * - ページネーション
 * - 検索フィルター
 * - 行アクション
 */

export interface Column<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  sortable?: boolean;
  render?: (row: T, index: number) => ReactNode;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField: keyof T;
  pageSize?: number;
  searchable?: boolean;
  searchPlaceholder?: string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  actions?: (row: T) => ReactNode;
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  keyField,
  pageSize = 10,
  searchable = false,
  searchPlaceholder = "検索...",
  onRowClick,
  emptyMessage = "データがありません",
  actions,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);

  // フィルター
  const filteredData = useMemo(() => {
    if (!search) return data;
    const lowerSearch = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const value = row[col.key as keyof T];
        return String(value).toLowerCase().includes(lowerSearch);
      })
    );
  }, [data, search, columns]);

  // ソート
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey as keyof T];
      const bVal = b[sortKey as keyof T];
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortKey, sortDir]);

  // ページネーション
  const pageCount = Math.ceil(sortedData.length / pageSize);
  const pagedData = sortedData.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div className="rounded-xl border bg-white shadow-sm">
      {/* 検索 */}
      {searchable && (
        <div className="border-b p-4">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder={searchPlaceholder}
            className="w-full max-w-sm rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      )}

      {/* テーブル */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={`
                    px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500
                    ${col.sortable ? "cursor-pointer hover:bg-gray-100" : ""}
                  `}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && handleSort(String(col.key))}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortKey === String(col.key) && (
                      <span>{sortDir === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </th>
              ))}
              {actions && <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">操作</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pagedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-4 py-8 text-center text-sm text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              pagedData.map((row, index) => (
                <tr
                  key={String(row[keyField])}
                  className={`
                    ${onRowClick ? "cursor-pointer hover:bg-gray-50" : ""}
                  `}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className="whitespace-nowrap px-4 py-3 text-sm text-gray-900"
                    >
                      {col.render
                        ? col.render(row, index)
                        : String(row[col.key as keyof T] ?? "")}
                    </td>
                  ))}
                  {actions && (
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                      <div onClick={(e) => e.stopPropagation()}>{actions(row)}</div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ページネーション */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between border-t px-4 py-3">
          <p className="text-sm text-gray-500">
            {sortedData.length} 件中 {page * pageSize + 1} - {Math.min((page + 1) * pageSize, sortedData.length)} 件
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="rounded-lg border px-3 py-1 text-sm disabled:opacity-50 hover:bg-gray-50"
            >
              前へ
            </button>
            {Array.from({ length: pageCount }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`
                  rounded-lg px-3 py-1 text-sm
                  ${page === i ? "bg-blue-600 text-white" : "border hover:bg-gray-50"}
                `}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(pageCount - 1, page + 1))}
              disabled={page === pageCount - 1}
              className="rounded-lg border px-3 py-1 text-sm disabled:opacity-50 hover:bg-gray-50"
            >
              次へ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
