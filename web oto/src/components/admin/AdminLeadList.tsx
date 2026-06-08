"use client";

import { useState, useEffect } from "react";
import { 
  Search, 
  User, 
  Phone, 
  Mail, 
  MessageSquare, 
  Calendar, 
  Clock, 
  UserCheck, 
  Tag, 
  PlusCircle, 
  X, 
  Save, 
  Loader2,
  FileText,
  HelpCircle,
  TrendingUp,
  Inbox
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { 
  assignLeadSalesAction, 
  updateLeadStageAction, 
  addLeadNoteAction, 
  getLeadNotesAction,
} from "@/lib/actions/leadActions";
import {
  ContactRequest,
  LEAD_STAGE_LABELS,
  LEAD_STAGE_COLORS,
  REVERSE_TYPE_LABELS,
  ConsultationType,
} from "@/lib/leadConstants";

interface AdminLeadListProps {
  initialLeads: ContactRequest[];
  staff: { id: string; full_name: string; email: string }[];
  currentUser: { id: string; name: string; email: string; role: string };
  basePath: string;
}

export function AdminLeadList({
  initialLeads,
  staff,
  currentUser,
  basePath,
}: AdminLeadListProps) {
  const [leads, setLeads] = useState<ContactRequest[]>(initialLeads);
  const [selectedLead, setSelectedLead] = useState<ContactRequest | null>(null);
  
  // Filters state
  const [search, setSearch] = useState("");
  const [selectedStage, setSelectedStage] = useState("Tất cả");
  const [selectedStaff, setSelectedStaff] = useState("Tất cả");

  // Drawer details state
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  
  const [isNotePending, setIsNotePending] = useState(false);
  const [isAssignPending, setIsAssignPending] = useState(false);
  const [isStagePending, setIsStagePending] = useState(false);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);

  // Stats
  const totalLeads = leads.length;
  const newLeads = leads.filter(l => l.stage === "new_lead").length;
  const assignedLeads = leads.filter(l => l.stage === "assigned").length;
  const closedLeads = leads.filter(l => l.stage === "closed" || l.stage === "purchased").length;

  useEffect(() => {
    setLeads(initialLeads);
  }, [initialLeads]);

  // Load notes and chat session when a lead is selected
  useEffect(() => {
    if (selectedLead) {
      loadLeadDetails(selectedLead.id);
    } else {
      setNotes([]);
      setChatSessionId(null);
    }
  }, [selectedLead]);

  const loadLeadDetails = async (id: string) => {
    setIsLoadingNotes(true);
    try {
      // 1. Fetch notes
      const notesRes = await getLeadNotesAction(id);
      if (notesRes.success && notesRes.notes) {
        setNotes(notesRes.notes);
      }

      // 2. Fetch lead detail (to see if they have a chat session ID)
      const res = await fetch(`/api/leads/${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setChatSessionId(data.chatSessionId);
        }
      }
    } catch (err) {
      console.error("Failed to load details for lead:", err);
    } finally {
      setIsLoadingNotes(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  // Perform search / filtering in-memory
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch = 
      lead.full_name.toLowerCase().includes(search.toLowerCase()) ||
      lead.phone.includes(search) ||
      lead.email.toLowerCase().includes(search.toLowerCase()) ||
      (REVERSE_TYPE_LABELS[lead.consultation_type as ConsultationType] || lead.consultation_type)
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesStage = 
      selectedStage === "Tất cả" || 
      LEAD_STAGE_LABELS[lead.stage] === selectedStage ||
      lead.stage === selectedStage;

    const matchesStaff = 
      selectedStaff === "Tất cả" ||
      (selectedStaff === "Chưa phân công" && lead.assigned_staff_id === null) ||
      lead.assigned_staff_id === selectedStaff ||
      lead.staff_name === selectedStaff;

    return matchesSearch && matchesStage && matchesStaff;
  });

  const handleAssignStaff = async (staffId: string) => {
    if (!selectedLead) return;
    setIsAssignPending(true);
    try {
      const targetId = staffId === "none" ? null : staffId;
      const res = await assignLeadSalesAction(selectedLead.id, targetId);
      if (res.success) {
        const updatedStaff = staff.find((s) => s.id === targetId);
        const updatedLeads = leads.map((l) =>
          l.id === selectedLead.id
            ? { 
                ...l, 
                assigned_staff_id: targetId, 
                staff_name: updatedStaff ? updatedStaff.full_name : null,
                stage: targetId ? ("assigned" as const) : ("new_lead" as const)
              }
            : l
        );
        setLeads(updatedLeads);
        setSelectedLead((prev) =>
          prev
            ? { 
                ...prev, 
                assigned_staff_id: targetId, 
                staff_name: updatedStaff ? updatedStaff.full_name : null,
                stage: targetId ? ("assigned" as const) : ("new_lead" as const)
              }
            : null
        );
        // Reload details (to pull notes log)
        loadLeadDetails(selectedLead.id);
      } else {
        alert(res.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAssignPending(false);
    }
  };

  const handleUpdateStage = async (stage: string) => {
    if (!selectedLead) return;
    setIsStagePending(true);
    try {
      const res = await updateLeadStageAction(selectedLead.id, stage);
      if (res.success) {
        const updatedLeads = leads.map((l) =>
          l.id === selectedLead.id ? { ...l, stage: stage as any } : l
        );
        setLeads(updatedLeads);
        setSelectedLead((prev) => (prev ? { ...prev, stage: stage as any } : null));
        // Reload details (to pull notes log)
        loadLeadDetails(selectedLead.id);
      } else {
        alert(res.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsStagePending(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedLead || isNotePending) return;

    setIsNotePending(true);
    try {
      const res = await addLeadNoteAction(selectedLead.id, newNote);
      if (res.success) {
        setNewNote("");
        // Reload notes list
        const notesRes = await getLeadNotesAction(selectedLead.id);
        if (notesRes.success && notesRes.notes) {
          setNotes(notesRes.notes);
        }
      } else {
        alert(res.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsNotePending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-md border border-white/10 bg-[#11151c] p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
              <Inbox size={20} />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Tổng Leads</p>
              <h4 className="font-display text-2xl font-extrabold text-white mt-0.5">{totalLeads}</h4>
            </div>
          </div>
        </div>

        <div className="rounded-md border border-white/10 bg-[#11151c] p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-400">
              <Clock size={20} />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Lead mới</p>
              <h4 className="font-display text-2xl font-extrabold text-white mt-0.5">{newLeads}</h4>
            </div>
          </div>
        </div>

        <div className="rounded-md border border-white/10 bg-[#11151c] p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10 text-purple-400">
              <UserCheck size={20} />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Đã phân công</p>
              <h4 className="font-display text-2xl font-extrabold text-white mt-0.5">{assignedLeads}</h4>
            </div>
          </div>
        </div>

        <div className="rounded-md border border-white/10 bg-[#11151c] p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
              <TrendingUp size={20} />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Đã hoàn thành</p>
              <h4 className="font-display text-2xl font-extrabold text-white mt-0.5">{closedLeads}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 rounded-md border border-white/10 bg-[#11151c] p-5 md:flex-row md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute top-3.5 left-4 text-zinc-500" size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm theo họ tên, sđt, email, nhu cầu..."
            value={search}
            onChange={handleSearchChange}
            className="h-11 w-full rounded-md border border-white/10 bg-[#080c11] pl-11 pr-4 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-[#e31837]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Stage Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Trạng thái:</span>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="h-10 rounded-md border border-white/10 bg-[#080c11] px-3 text-xs text-white outline-none cursor-pointer focus:border-[#e31837]"
            >
              <option value="Tất cả">Tất cả</option>
              {Object.entries(LEAD_STAGE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {/* Assigned Staff Filter (Admins Only) */}
          {currentUser.role === "admin" && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Nhân sự:</span>
              <select
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className="h-10 rounded-md border border-white/10 bg-[#080c11] px-3 text-xs text-white outline-none cursor-pointer focus:border-[#e31837]"
              >
                <option value="Tất cả">Tất cả</option>
                <option value="Chưa phân công">Chưa phân công</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>{s.full_name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Leads Table */}
      <div className="overflow-hidden rounded-md border border-white/10 bg-[#11151c]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-[#0c0f14] text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                <th className="px-6 py-4">Khách hàng</th>
                <th className="px-6 py-4">Nhu cầu tư vấn</th>
                <th className="px-6 py-4">Nhân sự phụ trách</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Ngày gửi</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm text-zinc-300">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    Không tìm thấy yêu cầu tư vấn nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr 
                    key={lead.id} 
                    className="hover:bg-white/5 cursor-pointer transition duration-150"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <td className="px-6 py-4 font-semibold text-white">
                      <div className="flex flex-col">
                        <span>{lead.full_name}</span>
                        <span className="text-xs text-zinc-500 mt-0.5">{lead.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded text-xs text-zinc-300 border border-white/10">
                        <Tag size={12} className="text-red-500" />
                        {REVERSE_TYPE_LABELS[lead.consultation_type as ConsultationType] || lead.consultation_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {lead.staff_name ? (
                        <span className="flex items-center gap-1.5 text-xs text-white">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/10 text-[9px] font-bold text-blue-400">
                            {lead.staff_name.charAt(0).toUpperCase()}
                          </span>
                          {lead.staff_name}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-500 font-mono italic">Chưa phân công</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${LEAD_STAGE_COLORS[lead.stage]}`}>
                        {LEAD_STAGE_LABELS[lead.stage]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-zinc-400">
                      {new Date(lead.created_at).toLocaleDateString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedLead(lead)}
                        className="text-xs font-bold text-blue-400 hover:text-blue-300 hover:underline cursor-pointer"
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Slide-out Drawer */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
          {/* Backdrop click closer */}
          <div className="flex-1" onClick={() => setSelectedLead(null)} />
          
          {/* Drawer Body */}
          <div className="w-full max-w-lg border-l border-white/10 bg-[#11151c] h-full flex flex-col shadow-2xl animate-slideInRight overflow-hidden">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-white/10 bg-[#0c0f14] p-5">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#e31837]">Chi tiết Lead</span>
                <h3 className="font-display text-lg font-bold text-white mt-1">Yêu cầu của {selectedLead.full_name}</h3>
              </div>
              <button 
                onClick={() => setSelectedLead(null)}
                className="text-zinc-400 hover:text-white transition p-1.5 hover:bg-white/5 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Customer Contact details info card */}
              <div className="rounded-md border border-white/5 bg-[#0c0f14]/50 p-4 space-y-3">
                <div className="flex items-center gap-3 text-sm text-zinc-300">
                  <User size={16} className="text-zinc-500" />
                  <span className="font-semibold text-white">{selectedLead.full_name}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-zinc-300">
                  <Phone size={16} className="text-zinc-500" />
                  <a href={`tel:${selectedLead.phone}`} className="hover:underline">{selectedLead.phone}</a>
                </div>
                <div className="flex items-center gap-3 text-sm text-zinc-300">
                  <Mail size={16} className="text-zinc-500" />
                  <a href={`mailto:${selectedLead.email}`} className="hover:underline">{selectedLead.email}</a>
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-500 border-t border-white/5 pt-2 mt-2">
                  <Clock size={14} />
                  <span>Gửi lúc: {new Date(selectedLead.created_at).toLocaleString("vi-VN")}</span>
                </div>
              </div>

              {/* Consultation request body */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Yêu cầu tư vấn</h4>
                <div className="rounded-md border border-white/10 bg-[#080c11] p-4">
                  <span className="inline-flex items-center gap-1.5 bg-[#e31837]/10 border border-[#e31837]/20 px-2 py-0.5 rounded text-xs font-bold text-[#e31837] mb-3">
                    {REVERSE_TYPE_LABELS[selectedLead.consultation_type as ConsultationType] || selectedLead.consultation_type}
                  </span>
                  <p className="text-sm text-zinc-200 leading-relaxed font-serif italic">
                    "{selectedLead.message}"
                  </p>
                </div>
              </div>

              {/* CRM Lifecycle Management Actions */}
              <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-5">
                {/* 1. Stage Updater */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">Tiến độ tư vấn</label>
                  <div className="relative">
                    <select
                      value={selectedLead.stage}
                      disabled={isStagePending}
                      onChange={(e) => handleUpdateStage(e.target.value)}
                      className="h-11 w-full rounded-md border border-white/10 bg-[#080c11] px-4 text-xs text-white outline-none cursor-pointer focus:border-[#e31837] disabled:opacity-50"
                    >
                      {Object.entries(LEAD_STAGE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                    {isStagePending && (
                      <Loader2 size={12} className="absolute right-3 top-3.5 animate-spin text-[#e31837]" />
                    )}
                  </div>
                </div>

                {/* 2. Staff Assignment (Admin Only) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">Nhân sự phụ trách</label>
                  {currentUser.role === "admin" ? (
                    <div className="relative">
                      <select
                        value={selectedLead.assigned_staff_id || "none"}
                        disabled={isAssignPending}
                        onChange={(e) => handleAssignStaff(e.target.value)}
                        className="h-11 w-full rounded-md border border-white/10 bg-[#080c11] px-4 text-xs text-white outline-none cursor-pointer focus:border-[#e31837] disabled:opacity-50"
                      >
                        <option value="none">Chưa phân công</option>
                        {staff.map((s) => (
                          <option key={s.id} value={s.id}>{s.full_name}</option>
                        ))}
                      </select>
                      {isAssignPending && (
                        <Loader2 size={12} className="absolute right-3 top-3.5 animate-spin text-[#e31837]" />
                      )}
                    </div>
                  ) : (
                    <div className="h-11 flex items-center rounded-md border border-white/10 bg-[#080c11] px-4 text-xs text-zinc-400 font-semibold select-none">
                      {selectedLead.staff_name || "Chưa phân công"}
                    </div>
                  )}
                </div>
              </div>

              {/* Integrations Toolbar */}
              <div className="border-t border-white/5 pt-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Kết nối hệ thống</h4>
                <div className="grid grid-cols-2 gap-3">
                  {/* Chat Integration */}
                  {chatSessionId ? (
                    <Button
                      href={`${basePath}/chat?sessionId=${chatSessionId}`}
                      variant="primary"
                      className="h-11 font-bold text-xs flex items-center justify-center gap-2"
                    >
                      <MessageSquare size={14} />
                      Mở Chat Trực Tuyến
                    </Button>
                  ) : (
                    <div className="w-full" title="Khách hàng chưa bắt đầu trò chuyện trực tuyến">
                      <Button
                        disabled
                        className="h-11 w-full font-bold text-xs flex items-center justify-center gap-2 opacity-40 cursor-not-allowed"
                      >
                        <MessageSquare size={14} />
                        Không có phiên Chat
                      </Button>
                    </div>
                  )}

                  {/* Appointments link */}
                  <Button
                    href={`${basePath}/appointments`}
                    variant="secondary"
                    className="h-11 font-bold text-xs flex items-center justify-center gap-2 border border-white/10"
                  >
                    <Calendar size={14} />
                    Đặt lịch xem xe
                  </Button>
                </div>
              </div>

              {/* Timeline Consultation Notes */}
              <div className="border-t border-white/5 pt-5 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Nhật ký & Ghi chú tư vấn</h4>
                
                {/* Add note inline form */}
                <form onSubmit={handleAddNote} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Thêm ghi chú cuộc gọi, gặp mặt..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    disabled={isNotePending}
                    className="h-10 flex-1 rounded-md border border-white/10 bg-[#080c11] px-3 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#e31837]"
                  />
                  <Button
                    type="submit"
                    disabled={!newNote.trim() || isNotePending}
                    className="h-10 px-4 flex items-center justify-center gap-1 font-bold text-xs shrink-0"
                  >
                    {isNotePending ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <>
                        <Save size={12} />
                        Lưu
                      </>
                    )}
                  </Button>
                </form>

                {/* Notes List */}
                <div className="space-y-3 mt-4">
                  {isLoadingNotes ? (
                    <div className="text-center py-4 text-xs text-zinc-500 flex items-center justify-center gap-1.5">
                      <Loader2 size={12} className="animate-spin text-[#e31837]" />
                      Đang tải nhật ký...
                    </div>
                  ) : notes.length === 0 ? (
                    <div className="text-center py-4 text-xs text-zinc-600 italic">
                      Chưa có ghi chú chăm sóc nào cho khách hàng này.
                    </div>
                  ) : (
                    <div className="relative border-l border-white/5 pl-4 ml-2 space-y-4">
                      {notes.map((note) => (
                        <div key={note.id} className="relative text-xs">
                          {/* Dot marker */}
                          <span className="absolute -left-[21px] top-1 flex h-2.5 w-2.5 rounded-full bg-red-500/20 border border-red-500 ring-2 ring-[#11151c]"></span>
                          
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{note.staff_name || "Nhân viên"}</span>
                            <span className="text-[10px] text-zinc-500">
                              {new Date(note.created_at).toLocaleString("vi-VN")}
                            </span>
                          </div>
                          
                          <p className="text-zinc-400 mt-1 leading-relaxed bg-[#0c0f14]/30 rounded p-2.5 border border-white/5">
                            {note.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
