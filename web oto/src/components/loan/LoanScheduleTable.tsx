"use client";

import { useState } from "react";
import { Download, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { ScheduleRow, exportToCsvString } from "@/lib/loan/loan-schedule";

interface LoanScheduleTableProps {
  schedule: ScheduleRow[];
  carName: string;
}

export function LoanScheduleTable({ schedule, carName }: LoanScheduleTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; // 1 year per page

  // Filter schedule based on search term
  const filteredSchedule = schedule.filter((row) =>
    row.month.toString().includes(searchTerm.trim())
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredSchedule.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSchedule = filteredSchedule.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const fmt = (val: number) => {
    return new Intl.NumberFormat("vi-VN").format(val);
  };

  const handleDownload = () => {
    const csvContent = exportToCsvString(schedule, carName);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Lich_Tra_Gop_${carName.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h4 className="font-display text-lg font-bold text-[var(--foreground)]">
            Bảng lịch thanh toán chi tiết
          </h4>
          <p className="text-xs text-[var(--subtle)] mt-0.5">
            Xem phân tách gốc lãi hàng tháng và xuất bảng tính Excel.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-48">
            <span className="absolute inset-y-0 left-3 flex items-center text-[var(--subtle)]">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Tìm theo tháng..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset page to 1
              }}
              className="w-full rounded-lg border border-[var(--line)] bg-[var(--background)] py-1.5 pl-9 pr-4 text-xs text-[var(--foreground)] placeholder-[var(--subtle)]/50 focus:border-[#e31837] focus:outline-none transition-colors"
            />
          </div>

          <button
            onClick={handleDownload}
            disabled={schedule.length === 0}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--background)] hover:bg-[var(--muted)] text-xs font-semibold text-[var(--foreground)] px-3.5 py-1.5 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Download size={14} className="text-[#e31837]" />
            Xuất Excel
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--line)] text-[var(--subtle)] text-xs uppercase tracking-wider font-bold">
              <th className="pb-3 pr-4 font-semibold">Tháng</th>
              <th className="pb-3 px-4 font-semibold text-right">Gốc trả</th>
              <th className="pb-3 px-4 font-semibold text-right">Lãi trả</th>
              <th className="pb-3 px-4 font-semibold text-right">Tổng thanh toán</th>
              <th className="pb-3 pl-4 font-semibold text-right">Dư nợ còn lại</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)] text-[var(--foreground)]">
            {paginatedSchedule.map((row) => (
              <tr key={row.month} className="hover:bg-[var(--muted)]/50 transition-colors">
                <td className="py-3.5 pr-4 font-bold text-[var(--foreground)]">Tháng {row.month}</td>
                <td className="py-3.5 px-4 text-right font-medium">{fmt(row.principal)} đ</td>
                <td className="py-3.5 px-4 text-right font-medium text-rose-400">{fmt(row.interest)} đ</td>
                <td className="py-3.5 px-4 text-right font-bold text-[var(--foreground)]">{fmt(row.payment)} đ</td>
                <td className="py-3.5 pl-4 text-right font-semibold text-[var(--subtle)]">{fmt(row.remainingBalance)} đ</td>
              </tr>
            ))}
            {paginatedSchedule.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-[var(--subtle)]/75 font-medium">
                  Không tìm thấy tháng nào khớp với từ khóa tìm kiếm.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[var(--line)] pt-4 mt-4">
          <p className="text-xs text-[var(--subtle)]">
            Hiển thị <span className="font-semibold text-[var(--foreground)]">{startIndex + 1}</span> -{" "}
            <span className="font-semibold text-[var(--foreground)]">
              {Math.min(startIndex + itemsPerPage, filteredSchedule.length)}
            </span>{" "}
            trong tổng số <span className="font-semibold text-[var(--foreground)]">{filteredSchedule.length}</span> tháng
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-md border border-[var(--line)] p-1 bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors disabled:opacity-30 disabled:hover:bg-[var(--background)] cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-semibold text-[var(--foreground)] px-2">
              Trang {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-md border border-[var(--line)] p-1 bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors disabled:opacity-30 disabled:hover:bg-[var(--background)] cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
