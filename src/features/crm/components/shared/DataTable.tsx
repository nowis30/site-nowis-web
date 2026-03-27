'use client';

import React from 'react';

export interface DataColumn<T> {
  key: string;
  header: string;
  render: (row: T) => unknown;
}

interface DataTableProps<T> {
  columns: DataColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  actions?: (row: T) => React.ReactNode;
}

export function DataTable<T>({ columns, rows, rowKey, actions }: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80">
      <div className="overflow-x-auto">
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
