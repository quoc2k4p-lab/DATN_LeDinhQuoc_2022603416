"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  Search, Plus, Phone, Mail, Edit3, Trash2, Calendar, MessageSquare, 
  UserPlus, CheckCircle, XCircle, Clock, ChevronRight, Send, HelpCircle, FileDown, FolderOpen
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { 
  getCustomersAction, getCustomerDetailAction, createCustomerAction, 
  updateCustomerAction, updateCustomerStageAction, assignStaffAction, 
  addCustomerNoteAction, deleteCustomerAction, exportCustomersAction,
  UiCustomer
} from "@/lib/actions/customerActions";
import { CustomerStage, STAGE_LABELS, STAGE_COLORS } from "@/lib/crmConstants";
import { sendChatMessageAction } from "@/lib/actions/chatActions";
import { UiUser } from "@/lib/actions/auth";

interface AdminCustomerListProps {
  initialCustomers: UiCustomer[];
  cars: { id: string; title: string }[];
  staff: { id: string; full_name: string; email: string }[];
  currentUser: UiUser;
  basePath: string; // "/admin" or "/staff"
}

export function AdminCustomerList({
  initialCustomers,
  cars,
  staff,
  currentUser,
  basePath
}: AdminCustomerListProps) {
  const [customers, setCustomers] = useState<UiCustomer[]>(initialCustomers);
  const [filters, setFilters] = useState({
    search: "",
    stage: "Tất cả",
    assignedStaffId: "Tất cả",
    budgetRange: "Tất cả",
    status: "Tất cả"
  });

  const [activeTab, setActiveTab] = useState<"info" | "timeline" | "notes" | "appointments" | "chat">("info");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<any | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Forms state
  const [newCustomer, setNewCustomer] = useState({
    user_id: null as string | null,
    full_name: "",
    phone: "",
    email: "",
    interested_car_id: "",
    budget: "",
    stage: "lead" as CustomerStage,
    note: "",
    assigned_staff_id: currentUser.role === "staff" ? currentUser.id : "",
    source: "showroom",
    status: "active" as "active" | "inactive"
  });

  const [editCustomer, setEditCustomer] = useState<any>(null);
  const [newNote, setNewNote] = useState("");
  const [chatReply, setChatReply] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);

  // Refresh customer list
  const refreshList = async () => {
    const res = await getCustomersAction(filters);
    if (res.success && res.customers) {
      setCustomers(res.customers);
    }
  };

  // Poll for detail updates if chat tab is open
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (selectedCustomerId && activeTab === "chat") {
      pollingRef.current = setInterval(() => {
        loadCustomerDetail(selectedCustomerId, false);
      }, 3000);
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [selectedCustomerId, activeTab]);

  // Load details
  const loadCustomerDetail = async (id: string, showLoader = true) => {
    if (showLoader) setIsDetailLoading(true);
    const res = await getCustomerDetailAction(id);
    if (res.success && res.customerDetail) {
      setDetailData(res.customerDetail);
      if (showLoader) setSelectedCustomerId(id);
    }
    if (showLoader) setIsDetailLoading(false);
  };

  // Sync list when filters change
  useEffect(() => {
    refreshList();
  }, [filters]);

  // Handle Export
  const handleExport = async () => {
    const res = await exportCustomersAction();
    if (res.success && res.data) {
      const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `danh_sach_khach_hang_${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert(res.message || "Không thể xuất dữ liệu.");
    }
  };

  // Handle Add Customer
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createCustomerAction({
      ...newCustomer,
      user_id: null,
      assigned_staff_id: newCustomer.assigned_staff_id || null,
      interested_car_id: newCustomer.interested_car_id || null,
    });
    if (res.success) {
      setIsAddModalOpen(false);
      setNewCustomer({
        user_id: null,
        full_name: "",
        phone: "",
        email: "",
        interested_car_id: "",
        budget: "",
        stage: "lead",
        note: "",
        assigned_staff_id: currentUser.role === "staff" ? currentUser.id : "",
        source: "showroom",
        status: "active"
      });
      refreshList();
    } else {
      alert(res.message);
    }
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCustomer) return;
    const res = await updateCustomerAction(editCustomer.id, {
      full_name: editCustomer.full_name,
      phone: editCustomer.phone,
      email: editCustomer.email,
      interested_car_id: editCustomer.interested_car_id || null,
      budget: editCustomer.budget,
      source: editCustomer.source,
      status: editCustomer.status
    });
    if (res.success) {
      setIsEditModalOpen(false);
      refreshList();
      if (selectedCustomerId === editCustomer.id) {
        loadCustomerDetail(editCustomer.id);
      }
    } else {
      alert(res.message);
    }
  };

  // Handle Delete Customer
  const handleDeleteConfirm = async () => {
    if (!selectedCustomerId) return;
    const res = await deleteCustomerAction(selectedCustomerId);
    if (res.success) {
      setIsDeleteConfirmOpen(false);
      setSelectedCustomerId(null);
      setDetailData(null);
      refreshList();
    } else {
      alert(res.message);
    }
  };

  // Handle Stage inline change
  const handleStageChange = async (id: string, stage: CustomerStage) => {
    const res = await updateCustomerStageAction(id, stage);
    if (res.success) {
      refreshList();
      if (selectedCustomerId === id) {
        loadCustomerDetail(id);
      }
    } else {
      alert(res.message);
    }
  };

  // Handle Staff inline assignment
  const handleStaffChange = async (id: string, staffId: string) => {
    const res = await assignStaffAction(id, staffId === "" ? null : staffId);
    if (res.success) {
      refreshList();
      if (selectedCustomerId === id) {
        loadCustomerDetail(id);
      }
    } else {
      alert(res.message);
    }
  };

  // Handle Add Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedCustomerId) return;
    const res = await addCustomerNoteAction(selectedCustomerId, newNote);
    if (res.success) {
      setNewNote("");
      loadCustomerDetail(selectedCustomerId);
    } else {
      alert(res.message);
    }
  };

  // Handle Send Chat Reply inline
  const handleSendChatReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatReply.trim() || !selectedCustomerId || !detailData?.customer?.session_id || isSendingChat) return;

    const sessionId = detailData.customer.session_id;
    const textToSend = chatReply.trim();
    setChatReply("");
    setIsSendingChat(true);

    const res = await sendChatMessageAction(sessionId, "staff", "Hỗ trợ viên", textToSend);
    if (res.success) {
      loadCustomerDetail(selectedCustomerId, false);
    } else {
      alert(res.message);
      setChatReply(textToSend);
    }
    setIsSendingChat(false);
  };

  return (
    <div className="space-y-8">
      {/* Top Filter and Search Controls */}
      <div className="flex flex-col gap-4 rounded-md border border-white/10 bg-[#0c0f14] p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Tìm theo tên, điện thoại, xe..."
            className="h-11 w-full rounded-md border border-white/10 bg-[#080c11] pl-10 pr-4 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-[#e31837]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Stage Filter */}
          <select
            value={filters.stage}
            onChange={(e) => setFilters(prev => ({ ...prev, stage: e.target.value }))}
            className="h-11 rounded-md border border-white/10 bg-[#080c11] px-4 text-xs font-semibold text-zinc-300 outline-none focus:border-[#e31837]"
          >
            <option value="Tất cả">Tiến trình (Tất cả)</option>
            {Object.entries(STAGE_LABELS).map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>

          {/* Staff Filter (Admin only) */}
          {currentUser.role === "admin" && (
            <select
              value={filters.assignedStaffId}
              onChange={(e) => setFilters(prev => ({ ...prev, assignedStaffId: e.target.value }))}
              className="h-11 rounded-md border border-white/10 bg-[#080c11] px-4 text-xs font-semibold text-zinc-300 outline-none focus:border-[#e31837]"
            >
              <option value="Tất cả">Nhân viên (Tất cả)</option>
              <option value="">Chưa phân công</option>
              {staff.map(s => (
                <option key={s.id} value={s.id}>{s.full_name}</option>
              ))}
            </select>
          )}

          {/* Budget Filter */}
          <select
            value={filters.budgetRange}
            onChange={(e) => setFilters(prev => ({ ...prev, budgetRange: e.target.value }))}
            className="h-11 rounded-md border border-white/10 bg-[#080c11] px-4 text-xs font-semibold text-zinc-300 outline-none focus:border-[#e31837]"
          >
            <option value="Tất cả">Ngân sách (Tất cả)</option>
            <option value="Dưới 1 tỷ">Dưới 1 tỷ</option>
            <option value="1 - 2 tỷ">1 - 2 tỷ</option>
            <option value="Trên 2 tỷ">Trên 2 tỷ</option>
          </select>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="h-11 rounded-md border border-white/10 bg-[#080c11] px-4 text-xs font-semibold text-zinc-300 outline-none focus:border-[#e31837]"
          >
            <option value="Tất cả">Trạng thái (Tất cả)</option>
            <option value="Hoạt động">Đang hoạt động</option>
            <option value="Ngừng chăm sóc">Ngừng chăm sóc</option>
          </select>

          {currentUser.role === "admin" && (
            <button
              onClick={handleExport}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/5 px-4 text-xs font-bold text-white transition hover:bg-white/10"
            >
              <FileDown size={15} />
              Xuất Excel
            </button>
          )}

          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus size={16} />
            Thêm khách
          </Button>
        </div>
      </div>

      {/* Main Grid: CRM Table / Detail Drawer */}
      <div className={`grid gap-8 ${selectedCustomerId ? "lg:grid-cols-[1.1fr_0.9fr]" : "grid-cols-1"}`}>
        
        {/* Customer Listing Section */}
        <div className="overflow-hidden rounded-md border border-white/10 bg-[#11151c]">
          <div className="border-b border-white/10 p-5">
            <h2 className="font-display text-lg font-bold text-white">Danh sách Lead và Khách hàng</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-[#0c0f14]/50 text-xs font-bold uppercase tracking-wider text-zinc-500">
                  <th className="p-4">Khách hàng</th>
                  <th className="p-4">Điện thoại / Email</th>
                  <th className="p-4">Xe quan tâm</th>
                  <th className="p-4">Tiến trình</th>
                  <th className="p-4">Ngân sách</th>
                  <th className="p-4">Người phụ trách</th>
                  <th className="p-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-zinc-500">
                      Không tìm thấy khách hàng nào khớp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => {
                    const isSelected = selectedCustomerId === c.id;
                    return (
                      <tr 
                        key={c.id}
                        className={`transition hover:bg-white/5 cursor-pointer ${
                          isSelected ? "bg-[#e31837]/10" : ""
                        }`}
                        onClick={() => loadCustomerDetail(c.id)}
                      >
                        <td className="p-4 font-semibold text-white">
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-300">
                              {c.full_name.charAt(0).toUpperCase()}
                            </span>
                            <div>
                              <span>{c.full_name}</span>
                              {c.status === "inactive" && (
                                <span className="ml-2 inline-flex items-center rounded-full bg-zinc-500/10 border border-zinc-500/20 px-1.5 py-0.2 text-[9px] font-medium text-zinc-400">
                                  Ngừng chăm sóc
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-zinc-400 font-mono text-xs">
                          <div>{c.phone}</div>
                          <div className="text-[10px] text-zinc-500">{c.email}</div>
                        </td>
                        <td className="p-4 font-semibold text-zinc-300">
                          {c.car_title || <span className="text-zinc-500 text-xs italic">Không rõ</span>}
                        </td>
                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={c.stage}
                            onChange={(e) => handleStageChange(c.id, e.target.value as CustomerStage)}
                            className={`rounded border px-2.5 py-1 text-xs font-bold uppercase outline-none ${
                              STAGE_COLORS[c.stage]
                            }`}
                          >
                            {Object.entries(STAGE_LABELS).map(([k, label]) => (
                              <option key={k} value={k} className="bg-[#11151c] text-white">{label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-4 text-zinc-400 font-semibold">{c.budget || "—"}</td>
                        <td className="p-4 text-zinc-400 font-semibold" onClick={(e) => e.stopPropagation()}>
                          {currentUser.role === "admin" ? (
                            <select
                              value={c.assigned_staff_id || ""}
                              onChange={(e) => handleStaffChange(c.id, e.target.value)}
                              className="w-full rounded border border-white/10 bg-[#080c11] px-2 py-1 text-xs text-white outline-none"
                            >
                              <option value="">Chưa phân công</option>
                              {staff.map(s => (
                                <option key={s.id} value={s.id}>{s.full_name}</option>
                              ))}
                            </select>
                          ) : (
                            <span>{c.staff_name || "Chưa phân công"}</span>
                          )}
                        </td>
                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditCustomer(c);
                                setIsEditModalOpen(true);
                              }}
                              className="rounded p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white transition"
                              title="Sửa thông tin"
                            >
                              <Edit3 size={15} />
                            </button>
                            {currentUser.role === "admin" && (
                              <button
                                onClick={() => {
                                  setSelectedCustomerId(c.id);
                                  setIsDeleteConfirmOpen(true);
                                }}
                                className="rounded p-1.5 text-zinc-400 hover:bg-white/5 hover:text-red-400 transition"
                                title="Xóa"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer Detail Drawer Section */}
        {selectedCustomerId && detailData && (
          <div className="rounded-md border border-white/10 bg-[#11151c] flex flex-col h-[calc(100vh-270px)] min-h-[500px]">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-white/10 p-5 bg-[#0c0f14]/50">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e31837]/10 border border-[#e31837]/20 text-sm font-bold text-[#e31837]">
                  {detailData.customer.full_name.charAt(0).toUpperCase()}
                </span>
                <div>
                  <h3 className="font-display font-bold text-white text-base">{detailData.customer.full_name}</h3>
                  <p className="text-xs text-zinc-400">{detailData.customer.phone} • {detailData.customer.email}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedCustomerId(null);
                  setDetailData(null);
                }}
                className="text-zinc-500 hover:text-white transition"
              >
                Đóng
              </button>
            </div>

            {/* Tabs Row */}
            <div className="flex border-b border-white/10 bg-[#0c0f14]/30 px-2">
              {[
                { id: "info", label: "Thông tin", icon: FolderOpen },
                { id: "timeline", label: "Nhật ký", icon: Clock },
                { id: "notes", label: "Ghi chú", icon: Edit3 },
                { id: "appointments", label: "Lịch hẹn", icon: Calendar },
                { id: "chat", label: "Trò chuyện", icon: MessageSquare }
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold uppercase tracking-wider transition ${
                      isActive 
                        ? "border-[#e31837] text-white bg-white/5" 
                        : "border-transparent text-zinc-400 hover:text-white"
                    }`}
                  >
                    <tab.icon size={13} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto p-5">
              
              {/* Tab 1: Info */}
              {activeTab === "info" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="rounded-md border border-white/5 bg-white/1 p-4">
                      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tiến trình</p>
                      <p className="mt-2 text-sm font-bold uppercase">
                        <span className={`rounded border px-2 py-0.5 text-[10px] ${STAGE_COLORS[detailData.customer.stage as CustomerStage]}`}>
                          {STAGE_LABELS[detailData.customer.stage as CustomerStage]}
                        </span>
                      </p>
                    </div>

                    <div className="rounded-md border border-white/5 bg-white/1 p-4">
                      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Ngân sách</p>
                      <p className="mt-2 text-sm font-bold text-white">{detailData.customer.budget || "Không rõ"}</p>
                    </div>

                    <div className="rounded-md border border-white/5 bg-white/1 p-4">
                      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Xe quan tâm</p>
                      <p className="mt-2 text-sm font-bold text-white">{detailData.customer.car_title || "Không rõ"}</p>
                    </div>

                    <div className="rounded-md border border-white/5 bg-white/1 p-4">
                      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Người phụ trách</p>
                      <p className="mt-2 text-sm font-bold text-white">{detailData.customer.staff_name || "Chưa phân công"}</p>
                    </div>

                    <div className="rounded-md border border-white/5 bg-white/1 p-4">
                      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Nguồn khách</p>
                      <p className="mt-2 text-sm font-bold text-white capitalize">{detailData.customer.source}</p>
                    </div>

                    <div className="rounded-md border border-white/5 bg-white/1 p-4">
                      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Trạng thái chăm sóc</p>
                      <p className="mt-2 text-sm font-bold">
                        {detailData.customer.status === "active" ? (
                          <span className="text-emerald-400 flex items-center gap-1.5"><CheckCircle size={14} /> Hoạt động</span>
                        ) : (
                          <span className="text-zinc-500 flex items-center gap-1.5"><XCircle size={14} /> Tạm dừng</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-4 flex gap-3">
                    <Button 
                      variant="secondary" 
                      onClick={() => {
                        setEditCustomer(detailData.customer);
                        setIsEditModalOpen(true);
                      }}
                      className="flex-1"
                    >
                      <Edit3 size={15} /> Chỉnh sửa thông tin
                    </Button>
                    
                    {detailData.customer.session_id && (
                      <Button
                        href={`${basePath}/chat?sessionId=${detailData.customer.session_id}`}
                        className="flex-1 bg-blue-600 hover:bg-blue-500"
                      >
                        <MessageSquare size={15} /> Đi tới Live Chat
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Timeline */}
              {activeTab === "timeline" && (
                <div className="relative border-l-2 border-white/10 pl-6 ml-3 space-y-6">
                  {detailData.timeline.map((evt: any, idx: number) => {
                    let iconColor = "bg-zinc-800 text-zinc-400 border-zinc-700";
                    if (evt.type === "creation") iconColor = "bg-red-500/10 text-red-500 border-red-500/30";
                    else if (evt.type === "appointment") iconColor = "bg-yellow-500/10 text-yellow-500 border-yellow-500/30";
                    else if (evt.type === "note") iconColor = "bg-blue-500/10 text-blue-500 border-blue-500/30";

                    return (
                      <div key={evt.id || idx} className="relative">
                        {/* Circle bullet */}
                        <span className={`absolute -left-[33px] top-0 flex h-6.5 w-6.5 items-center justify-center rounded-full border text-[10px] font-bold ${iconColor}`}>
                          {idx + 1}
                        </span>
                        
                        <div className="bg-[#151a22] rounded-md border border-white/5 p-4 shadow-sm">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-sm font-bold text-white">{evt.title}</h4>
                            <span className="text-[10px] font-mono text-zinc-500">
                              {new Date(evt.date).toLocaleString("vi-VN", { 
                                dateStyle: "short", 
                                timeStyle: "short" 
                              })}
                            </span>
                          </div>
                          <p className="mt-2 text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap">{evt.description}</p>
                          {evt.staff_name && (
                            <p className="mt-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Nhân viên: {evt.staff_name}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tab 3: Notes */}
              {activeTab === "notes" && (
                <div className="space-y-6">
                  <form onSubmit={handleAddNote} className="space-y-3">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Thêm thông tin trao đổi mới (Ví dụ: khách thích màu đen, muốn trả góp...)"
                      className="w-full min-h-[80px] rounded-md border border-white/10 bg-[#080c11] p-3 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-[#e31837]"
                    />
                    <div className="flex justify-end">
                      <Button type="submit" disabled={!newNote.trim()}>Lưu ghi chú</Button>
                    </div>
                  </form>

                  <div className="border-t border-white/10 pt-4 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Lịch sử ghi chú</h4>
                    
                    {detailData.notes.length === 0 ? (
                      <p className="text-xs text-zinc-600 italic">Chưa có ghi chú nào.</p>
                    ) : (
                      detailData.notes.map((note: any) => (
                        <div key={note.id} className="rounded-md bg-[#151a22] border border-white/5 p-4 text-sm">
                          <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                          <div className="mt-3 flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-wide">
                            <span>Người viết: {note.staff_name || "Showroom"}</span>
                            <span>{new Date(note.created_at).toLocaleString("vi-VN")}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Tab 4: Appointments */}
              {activeTab === "appointments" && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Lịch xem xe đã đặt</h4>
                  
                  {detailData.appointments.length === 0 ? (
                    <p className="text-xs text-zinc-600 italic">Chưa có lịch đặt hẹn xem xe nào.</p>
                  ) : (
                    detailData.appointments.map((apt: any) => {
                      let statusText = "Chờ xác nhận";
                      let statusColor = "bg-yellow-500/10 text-yellow-500 border-yellow-500/30";
                      if (apt.status === "confirmed") {
                        statusText = "Đã xác nhận";
                        statusColor = "bg-blue-500/10 text-blue-500 border-blue-500/30";
                      } else if (apt.status === "completed") {
                        statusText = "Hoàn thành";
                        statusColor = "bg-emerald-500/10 text-emerald-500 border-emerald-500/30";
                      } else if (apt.status === "cancelled") {
                        statusText = "Đã hủy";
                        statusColor = "bg-red-500/10 text-red-500 border-red-500/30";
                      }

                      return (
                        <div key={apt.id} className="rounded-md bg-[#151a22] border border-white/5 p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-white">{apt.car_title}</span>
                            <span className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${statusColor}`}>
                              {statusText}
                            </span>
                          </div>
                          
                          <div className="text-xs text-zinc-400 space-y-1">
                            <p>Lịch hẹn: <strong className="text-zinc-200">{new Date(apt.appointment_date).toLocaleString("vi-VN")}</strong></p>
                            <p>Yêu cầu: <span className="italic">"{apt.note || "Không có ghi chú thêm"}"</span></p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Tab 5: Chat */}
              {activeTab === "chat" && (
                <div className="flex flex-col h-[calc(100vh-420px)] min-h-[300px]">
                  {!detailData.customer.session_id ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                      <HelpCircle size={32} className="text-zinc-600 mb-2" />
                      <p className="text-sm font-semibold text-zinc-400">Khách chưa trò chuyện trực tuyến</p>
                      <p className="text-xs text-zinc-600 max-w-[240px] mt-1">
                        Chưa có phiên chat nào được ghi nhận cho ID của khách hàng này.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Chat Messages */}
                      <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4">
                        {detailData.chatHistory.length === 0 ? (
                          <p className="text-xs text-zinc-600 italic text-center p-6">Chưa có tin nhắn nào được gửi.</p>
                        ) : (
                          detailData.chatHistory.map((msg: any) => {
                            const isStaff = msg.sender_role === "staff";
                            return (
                              <div key={msg.id} className={`flex flex-col ${isStaff ? "items-end" : "items-start"}`}>
                                <div className={`rounded px-3 py-1.5 text-xs max-w-[80%] ${
                                  isStaff ? "bg-blue-600 text-white" : "bg-[#1f2631] text-zinc-300"
                                }`}>
                                  {msg.message_text}
                                </div>
                                <span className="text-[9px] text-zinc-600 mt-0.5">
                                  {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Reply Input */}
                      <form onSubmit={handleSendChatReply} className="flex gap-2 border-t border-white/5 pt-3">
                        <input
                          type="text"
                          value={chatReply}
                          onChange={(e) => setChatReply(e.target.value)}
                          placeholder="Trả lời nhanh..."
                          disabled={isSendingChat}
                          className="h-10 flex-1 rounded border border-white/10 bg-[#080c11] px-3 text-xs text-white placeholder-zinc-600 outline-none focus:border-[#e31837]"
                        />
                        <button
                          type="submit"
                          disabled={!chatReply.trim() || isSendingChat}
                          className="flex h-10 w-10 items-center justify-center rounded bg-[#e31837] text-white hover:bg-[#c1142e] transition disabled:opacity-40"
                        >
                          <Send size={14} />
                        </button>
                      </form>
                    </>
                  )}
                </div>
              )}

            </div>
          </div>
        )}

      </div>

      {/* Bottom overview cards section */}
      <div className="mt-8">
        <h3 className="font-display text-sm font-bold uppercase tracking-wider text-zinc-500 mb-4">Tổng quan nhanh (3 Khách gần nhất)</h3>
        
        <div className="grid gap-5 md:grid-cols-3">
          {customers.slice(0, 3).map((c) => (
            <div 
              key={c.id} 
              className="rounded-md border border-white/10 bg-[#151a22] p-5 flex flex-col justify-between hover:border-zinc-700 transition cursor-pointer"
              onClick={() => loadCustomerDetail(c.id)}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-300">
                    {c.full_name.charAt(0).toUpperCase()}
                  </span>
                  <span className={`rounded border px-2 py-0.5 text-[9px] font-bold uppercase ${STAGE_COLORS[c.stage]}`}>
                    {STAGE_LABELS[c.stage]}
                  </span>
                </div>
                
                <h4 className="mt-4 font-display text-base font-bold text-white">{c.full_name}</h4>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400 font-mono"><Phone size={13} /> {c.phone}</p>
                
                <div className="mt-4 border-t border-white/5 pt-3">
                  <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-wide">Dòng xe quan tâm</p>
                  <p className="text-xs font-bold text-zinc-300 mt-1">{c.car_title || "Chưa rõ"}</p>
                </div>
              </div>

              <div className="mt-4 flex justify-end text-xs font-bold text-[#e31837] items-center gap-1">
                Chi tiết <ChevronRight size={14} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL 1: ADD CUSTOMER */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-md border border-white/10 bg-[#11151c] p-6 text-white shadow-2xl">
            <h3 className="font-display text-xl font-bold border-b border-white/10 pb-3 mb-5">Thêm thông tin khách hàng</h3>
            
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-500">Họ và tên *</span>
                  <input
                    type="text"
                    required
                    value={newCustomer.full_name}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, full_name: e.target.value }))}
                    className="h-10 w-full rounded border border-white/10 bg-[#080c11] px-3 text-xs outline-none focus:border-[#e31837]"
                    placeholder="Nguyễn Văn A"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-500">Số điện thoại *</span>
                  <input
                    type="tel"
                    required
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                    className="h-10 w-full rounded border border-white/10 bg-[#080c11] px-3 text-xs outline-none focus:border-[#e31837]"
                    placeholder="0909888668"
                  />
                </label>

                <label className="block col-span-2">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-500">Email *</span>
                  <input
                    type="email"
                    required
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                    className="h-10 w-full rounded border border-white/10 bg-[#080c11] px-3 text-xs outline-none focus:border-[#e31837]"
                    placeholder="email@example.com"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-500">Xe quan tâm</span>
                  <select
                    value={newCustomer.interested_car_id}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, interested_car_id: e.target.value }))}
                    className="h-10 w-full rounded border border-white/10 bg-[#080c11] px-3 text-xs outline-none focus:border-[#e31837]"
                  >
                    <option value="">Chọn xe</option>
                    {cars.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-500">Ngân sách</span>
                  <input
                    type="text"
                    value={newCustomer.budget}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, budget: e.target.value }))}
                    className="h-10 w-full rounded border border-white/10 bg-[#080c11] px-3 text-xs outline-none focus:border-[#e31837]"
                    placeholder="Ví dụ: 1.5 tỷ"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-500">Giai đoạn tư vấn</span>
                  <select
                    value={newCustomer.stage}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, stage: e.target.value as CustomerStage }))}
                    className="h-10 w-full rounded border border-white/10 bg-[#080c11] px-3 text-xs outline-none focus:border-[#e31837]"
                  >
                    {Object.entries(STAGE_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>{label}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-500">Nguồn khách</span>
                  <select
                    value={newCustomer.source}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, source: e.target.value }))}
                    className="h-10 w-full rounded border border-white/10 bg-[#080c11] px-3 text-xs outline-none focus:border-[#e31837]"
                  >
                    <option value="showroom">Showroom / Trực tiếp</option>
                    <option value="website">Website</option>
                    <option value="chat">Realtime Chat</option>
                    <option value="other">Khác</option>
                  </select>
                </label>

                {currentUser.role === "admin" && (
                  <label className="block col-span-2">
                    <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-500">Người phụ trách</span>
                    <select
                      value={newCustomer.assigned_staff_id}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, assigned_staff_id: e.target.value }))}
                      className="h-10 w-full rounded border border-white/10 bg-[#080c11] px-3 text-xs outline-none focus:border-[#e31837]"
                    >
                      <option value="">Chọn nhân viên</option>
                      {staff.map(s => (
                        <option key={s.id} value={s.id}>{s.full_name}</option>
                      ))}
                    </select>
                  </label>
                )}

                <label className="block col-span-2">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-500">Ghi chú ban đầu</span>
                  <textarea
                    value={newCustomer.note}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, note: e.target.value }))}
                    className="w-full h-20 rounded border border-white/10 bg-[#080c11] p-3 text-xs outline-none focus:border-[#e31837]"
                    placeholder="Nhập ghi chú chi tiết về nhu cầu..."
                  />
                </label>
              </div>

              <div className="flex justify-end gap-3 border-t border-white/10 pt-4 mt-5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="h-10 rounded-md border border-white/10 px-4 text-xs font-bold text-zinc-400 hover:text-white transition"
                >
                  Hủy
                </button>
                <Button type="submit">Lưu thông tin</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT CUSTOMER */}
      {isEditModalOpen && editCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-md border border-white/10 bg-[#11151c] p-6 text-white shadow-2xl">
            <h3 className="font-display text-xl font-bold border-b border-white/10 pb-3 mb-5">Cập nhật thông tin khách hàng</h3>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-500">Họ và tên *</span>
                  <input
                    type="text"
                    required
                    value={editCustomer.full_name}
                    onChange={(e) => setEditCustomer((prev: any) => ({ ...prev, full_name: e.target.value }))}
                    className="h-10 w-full rounded border border-white/10 bg-[#080c11] px-3 text-xs outline-none focus:border-[#e31837]"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-500">Số điện thoại *</span>
                  <input
                    type="tel"
                    required
                    value={editCustomer.phone}
                    onChange={(e) => setEditCustomer((prev: any) => ({ ...prev, phone: e.target.value }))}
                    className="h-10 w-full rounded border border-white/10 bg-[#080c11] px-3 text-xs outline-none focus:border-[#e31837]"
                  />
                </label>

                <label className="block col-span-2">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-500">Email *</span>
                  <input
                    type="email"
                    required
                    value={editCustomer.email}
                    onChange={(e) => setEditCustomer((prev: any) => ({ ...prev, email: e.target.value }))}
                    className="h-10 w-full rounded border border-white/10 bg-[#080c11] px-3 text-xs outline-none focus:border-[#e31837]"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-500">Xe quan tâm</span>
                  <select
                    value={editCustomer.interested_car_id || ""}
                    onChange={(e) => setEditCustomer((prev: any) => ({ ...prev, interested_car_id: e.target.value }))}
                    className="h-10 w-full rounded border border-white/10 bg-[#080c11] px-3 text-xs outline-none focus:border-[#e31837]"
                  >
                    <option value="">Chọn xe</option>
                    {cars.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-500">Ngân sách</span>
                  <input
                    type="text"
                    value={editCustomer.budget || ""}
                    onChange={(e) => setEditCustomer((prev: any) => ({ ...prev, budget: e.target.value }))}
                    className="h-10 w-full rounded border border-white/10 bg-[#080c11] px-3 text-xs outline-none focus:border-[#e31837]"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-500">Nguồn khách</span>
                  <select
                    value={editCustomer.source || "showroom"}
                    onChange={(e) => setEditCustomer((prev: any) => ({ ...prev, source: e.target.value }))}
                    className="h-10 w-full rounded border border-white/10 bg-[#080c11] px-3 text-xs outline-none focus:border-[#e31837]"
                  >
                    <option value="showroom">Showroom / Trực tiếp</option>
                    <option value="website">Website</option>
                    <option value="chat">Realtime Chat</option>
                    <option value="other">Khác</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-500">Trạng thái chăm sóc</span>
                  <select
                    value={editCustomer.status || "active"}
                    onChange={(e) => setEditCustomer((prev: any) => ({ ...prev, status: e.target.value }))}
                    className="h-10 w-full rounded border border-white/10 bg-[#080c11] px-3 text-xs outline-none focus:border-[#e31837]"
                  >
                    <option value="active">Đang hoạt động</option>
                    <option value="inactive">Tạm ngưng chăm sóc</option>
                  </select>
                </label>
              </div>

              <div className="flex justify-end gap-3 border-t border-white/10 pt-4 mt-5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="h-10 rounded-md border border-white/10 px-4 text-xs font-bold text-zinc-400 hover:text-white transition"
                >
                  Hủy
                </button>
                <Button type="submit">Cập nhật</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE CONFIRMATION */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-md border border-white/10 bg-[#11151c] p-6 text-white shadow-2xl">
            <h3 className="font-display text-lg font-bold text-white mb-2">Xác nhận xóa khách hàng?</h3>
            <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
              Bạn có chắc chắn muốn xóa vĩnh viễn thông tin khách hàng này khỏi cơ sở dữ liệu? Dữ liệu ghi chú và tiến trình liên quan cũng sẽ bị xóa và không thể khôi phục.
            </p>
            <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="h-9 rounded border border-white/10 px-4 text-xs font-semibold text-zinc-400 hover:text-white transition"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="h-9 rounded bg-[#e31837] px-4 text-xs font-semibold text-white hover:bg-[#c1142e] transition"
              >
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
