'use client';

import React from 'react';

export interface DataColumn<T> {
  key: string;
  header: string;
  render: (row: T) => unknown;
  mobileHidden?: boolean;
}

interface DataTableProps<T> {
  columns: DataColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  actions?: (row: T) => React.ReactNode;
}

export function DataTable<T>({ columns, rows, rowKey, actions }: DataTableProps<T>) {
  const mobileColumns = columns.filter((column) => !column.mobileHidden);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80">
      <div className="space-y-3 p-3 md:hidden">
        {rows.map((row) => (
          <article key={rowKey(row)} className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
            <div className="space-y-2">
              {mobileColumns.map((column) => (
                <div key={column.key} className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{column.header}</p>
                  <div className="text-sm text-slate-200">{column.render(row) as React.ReactNode}</div>
                </div>
              ))}
              {actions ? (
                <div className="border-t border-slate-800 pt-2">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Actions</p>
                  <div>{actions(row)}</div>
                </div>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-left text-sm text-slate-200">
          <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 font-semibold">
                  {column.header}
                </th>
              ))}
              {actions ? <th className="px-4 py-3 font-semibold">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)} className="border-t border-slate-800/90">
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 align-top">
                    {column.render(row) as React.ReactNode}
                  </td>
                ))}
                {actions ? <td className="px-4 py-3 align-top">{actions(row)}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
