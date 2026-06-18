export const dynamic = "force-dynamic";

import { AdminShell } from "@/components/admin/AdminShell";
import { AdminLeadList } from "@/components/admin/AdminLeadList";
import { getLeadsAction } from "@/lib/actions/leadActions";
import { getMeAction } from "@/lib/actions/auth";
import { getPool, ensureDbExists } from "@/lib/db";

export default async function AdminLeadsPage() {
  await ensureDbExists();
  const pool = getPool();

  // 1. Get logged-in user session
  const meRes = await getMeAction();
  if (!meRes.success || !meRes.user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b1016] text-white">
        <p className="text-sm font-semibold text-zinc-400">Bạn cần đăng nhập để truy cập trang này.</p>
      </div>
    );
  }

  const currentUser = meRes.user;
  const basePath = currentUser.role === "staff" ? "/staff" : "/admin";

  // 2. Fetch initial leads (scoped in action)
  const leadsRes = await getLeadsAction({});
  const initialLeads = leadsRes.success && leadsRes.leads ? leadsRes.leads : [];

  // 3. Fetch staff members for assignment dropdowns
  const [staffRows] = await pool.query(
    "SELECT id, full_name, email FROM users WHERE role IN ('admin', 'staff') AND status = 'active' ORDER BY full_name ASC;"
  );
  const staff = (staffRows as any[]).map((s) => ({
    id: s.id,
    full_name: s.full_name,
    email: s.email,
  }));

  return (
    <AdminShell
      title="Yêu cầu tư vấn"
      subtitle="Theo dõi, quản lý, phân công và xử lý các yêu cầu liên hệ, tư vấn mua xe từ website showroom."
    >
      <AdminLeadList
        initialLeads={initialLeads}
        staff={staff}
        currentUser={currentUser}
        basePath={basePath}
      />
    </AdminShell>
  );
}
