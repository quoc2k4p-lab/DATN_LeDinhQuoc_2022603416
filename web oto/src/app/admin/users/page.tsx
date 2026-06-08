"use client";

import { useEffect, useState, useTransition } from "react";
import { UserPlus, Search, ShieldCheck, UserCog, Ban, CheckCircle, Trash2, ShieldAlert, Loader2 } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/public/FormField";
import { adminGetUsersAction, adminManageUsersAction, adminCreateStaffAction } from "@/lib/actions/auth";
import { DbUser } from "@/lib/db";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<DbUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Create staff form
  const [createForm, setCreateForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });

  // Edit user form
  const [editUser, setEditUser] = useState<DbUser | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    role: "customer" as "admin" | "staff" | "customer",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminGetUsersAction();
      if (res.success && res.users) {
        setUsers(res.users);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUnblock = async (userId: string, currentStatus: "active" | "blocked") => {
    const action = currentStatus === "active" ? "block" : "unblock";
    const confirmText = currentStatus === "active" 
      ? "Bạn có chắc chắn muốn khóa tài khoản này không?" 
      : "Bạn có chắc chắn muốn mở khóa tài khoản này không?";
      
    if (!confirm(confirmText)) return;

    setErrorMsg("");
    setSuccessMsg("");
    
    try {
      const res = await adminManageUsersAction(userId, action);
      if (res.success) {
        setSuccessMsg(res.message || "Thao tác thành công.");
        fetchUsers();
      } else {
        setErrorMsg(res.message || "Thao tác thất bại.");
      }
    } catch (err) {
      setErrorMsg("Có lỗi xảy ra khi thực hiện thao tác.");
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản này không? Hành động này không thể hoàn tác.")) return;

    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await adminManageUsersAction(userId, "delete");
      if (res.success) {
        setSuccessMsg(res.message || "Xóa thành công.");
        fetchUsers();
      } else {
        setErrorMsg(res.message || "Thao tác thất bại.");
      }
    } catch (err) {
      setErrorMsg("Có lỗi xảy ra khi xóa tài khoản.");
    }
  };

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    startTransition(async () => {
      const formData = new FormData();
      formData.append("fullName", createForm.fullName);
      formData.append("email", createForm.email);
      formData.append("phone", createForm.phone);
      formData.append("password", createForm.password);

      const res = await adminCreateStaffAction(formData);
      if (res.success) {
        setSuccessMsg(res.message || "Tạo tài khoản nhân viên thành công.");
        setShowCreateModal(false);
        setCreateForm({ fullName: "", email: "", phone: "", password: "" });
        fetchUsers();
      } else {
        setErrorMsg(res.message || "Thao tác thất bại.");
      }
    });
  };

  const handleOpenEdit = (user: DbUser) => {
    setEditUser(user);
    setEditForm({
      fullName: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    });
    setShowEditModal(true);
  };

  const handleEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setErrorMsg("");
    setSuccessMsg("");

    startTransition(async () => {
      const res = await adminManageUsersAction(editUser.id, "update", editForm);
      if (res.success) {
        setSuccessMsg(res.message || "Cập nhật tài khoản thành công.");
        setShowEditModal(false);
        setEditUser(null);
        fetchUsers();
      } else {
        setErrorMsg(res.message || "Thao tác thất bại.");
      }
    });
  };

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchSearch = 
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search);
      
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchStatus = statusFilter === "all" || u.status === statusFilter;

    return matchSearch && matchRole && matchStatus;
  });

  return (
    <AdminShell
      title="Quản lý người dùng"
      subtitle="Quản lý toàn bộ danh sách khách hàng, nhân viên, thực hiện phân quyền và khóa/mở khóa tài khoản."
    >
      {/* Alert Notices */}
      {successMsg && (
        <div className="mb-5 rounded-md border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mb-5 rounded-md border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {errorMsg}
        </div>
      )}

      {/* Action Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex h-10 w-60 items-center rounded-md border border-white/10 bg-white/5 px-3 text-sm">
            <Search className="mr-2 text-zinc-500" size={16} />
            <input
              type="text"
              placeholder="Tìm tên, email hoặc SĐT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-white placeholder-zinc-500 outline-none"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-10 rounded-md border border-white/10 bg-[#151a22] px-3 text-sm text-zinc-300 outline-none"
          >
            <option value="all">Tất cả vai trò</option>
            <option value="admin">Quản trị viên (Admin)</option>
            <option value="staff">Nhân viên (Staff)</option>
            <option value="customer">Khách hàng (Customer)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-md border border-white/10 bg-[#151a22] px-3 text-sm text-zinc-300 outline-none"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động (Active)</option>
            <option value="blocked">Đang khóa (Blocked)</option>
          </select>
        </div>

        <Button onClick={() => setShowCreateModal(true)}>
          <UserPlus size={18} /> Thêm nhân viên
        </Button>
      </div>

      {/* User Table */}
      <div className="overflow-x-auto rounded-md border border-white/10 bg-[#151a22]">
        <table className="w-full text-left text-sm text-zinc-300">
          <thead className="bg-white/5 text-xs font-bold uppercase tracking-wider text-zinc-400 border-b border-white/10">
            <tr>
              <th className="px-6 py-4">Họ và tên</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Số điện thoại</th>
              <th className="px-6 py-4">Vai trò</th>
              <th className="px-6 py-4">Trạng thái</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin mb-2" />
                  Đang tải danh sách người dùng...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                  Không tìm thấy người dùng nào phù hợp.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-white/2px transition duration-150">
                  <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-[10px] text-zinc-300">
                      {user.full_name.charAt(0).toUpperCase()}
                    </span>
                    {user.full_name}
                  </td>
                  <td className="px-6 py-4 font-mono text-zinc-400">{user.email}</td>
                  <td className="px-6 py-4">{user.phone || "-"}</td>
                  <td className="px-6 py-4">
                    {user.role === "admin" && (
                      <span className="inline-flex items-center rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-bold text-red-500 border border-red-500/20">
                        ADMIN
                      </span>
                    )}
                    {user.role === "staff" && (
                      <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-bold text-blue-500 border border-blue-500/20">
                        STAFF
                      </span>
                    )}
                    {user.role === "customer" && (
                      <span className="inline-flex items-center rounded-full bg-zinc-500/10 px-2.5 py-0.5 text-xs font-bold text-zinc-400 border border-white/5">
                        CUSTOMER
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {user.status === "active" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/25">
                        <CheckCircle size={10} /> Hoạt động
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-bold text-red-400 border border-red-500/25">
                        <Ban size={10} /> Đang khóa
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(user)}
                        className="rounded-md border border-white/10 bg-white/5 p-1.5 hover:bg-[#e31837] hover:text-white transition duration-150"
                        title="Chỉnh sửa thông tin"
                      >
                        <UserCog size={15} />
                      </button>

                      <button
                        onClick={() => handleBlockUnblock(user.id, user.status)}
                        className={`rounded-md border border-white/10 bg-white/5 p-1.5 transition duration-150 ${
                          user.status === "active"
                            ? "hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/10"
                            : "hover:border-emerald-500/40 hover:text-emerald-400 hover:bg-emerald-500/10"
                        }`}
                        title={user.status === "active" ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                      >
                        {user.status === "active" ? <Ban size={15} /> : <CheckCircle size={15} />}
                      </button>

                      <button
                        onClick={() => handleDelete(user.id)}
                        className="rounded-md border border-white/10 bg-white/5 p-1.5 hover:border-red-500/50 hover:bg-red-500/20 hover:text-red-500 transition duration-150"
                        title="Xóa tài khoản"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Staff Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form
            onSubmit={handleCreateStaff}
            className="w-full max-w-md rounded-md border border-white/10 bg-[#151a22] p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-center gap-3 border-b border-white/10 pb-4">
              <UserPlus className="text-blue-500" size={24} />
              <div>
                <h3 className="font-display text-xl font-bold text-white">Thêm tài khoản nhân viên</h3>
                <p className="text-xs text-zinc-400">Tạo tài khoản quản lý vận hành showroom</p>
              </div>
            </div>

            <div className="space-y-4">
              <FormField
                label="Họ và tên nhân viên"
                name="fullName"
                required
                value={createForm.fullName}
                onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                placeholder="Nguyễn Văn A"
              />
              <FormField
                label="Email"
                name="email"
                type="email"
                required
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="sales@tqauto.vn"
              />
              <FormField
                label="Số điện thoại"
                name="phone"
                required
                value={createForm.phone}
                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                placeholder="0909888668"
              />
              <FormField
                label="Mật khẩu ban đầu"
                name="password"
                type="password"
                required
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                placeholder="Nhập mật khẩu"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-white/10 pt-4">
              <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>
                Hủy bỏ
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tạo tài khoản"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form
            onSubmit={handleEditUser}
            className="w-full max-w-md rounded-md border border-white/10 bg-[#151a22] p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-center gap-3 border-b border-white/10 pb-4">
              <UserCog className="text-[#e31837]" size={24} />
              <div>
                <h3 className="font-display text-xl font-bold text-white">Chỉnh sửa tài khoản</h3>
                <p className="text-xs text-zinc-400">Cập nhật thông tin chi tiết và phân quyền</p>
              </div>
            </div>

            <div className="space-y-4">
              <FormField
                label="Họ và tên"
                name="fullName"
                required
                value={editForm.fullName}
                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
              />
              <FormField
                label="Email"
                name="email"
                type="email"
                required
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
              <FormField
                label="Số điện thoại"
                name="phone"
                required
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
              
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">
                  Vai trò / Phân quyền
                </span>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}
                  className="h-11 w-full rounded-md border border-white/10 bg-[#080c11] px-4 text-sm text-white outline-none transition focus:border-[#e31837]"
                >
                  <option value="customer">Khách hàng (Customer)</option>
                  <option value="staff">Nhân viên (Staff)</option>
                  <option value="admin">Quản trị viên (Admin)</option>
                </select>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-white/10 pt-4">
              <Button type="button" variant="secondary" onClick={() => { setShowEditModal(false); setEditUser(null); }}>
                Hủy bỏ
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lưu thay đổi"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </AdminShell>
  );
}
