import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type DashboardDataTableProps<TData> = {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  className?: string;
  tableClassName?: string;
  headerRowClassName?: string;
  bodyRowClassName?: string;
  headerCellClassName?: string;
  bodyCellClassName?: string;
};

export function DashboardDataTable<TData>({
  data,
  columns,
  className,
  tableClassName,
  headerRowClassName,
  bodyRowClassName,
  headerCellClassName,
  bodyCellClassName,
}: DashboardDataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className={className}>
      <Table className={tableClassName}>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className={headerRowClassName}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className={headerCellClassName}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} className={bodyRowClassName}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className={cn("align-middle", bodyCellClassName)}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
