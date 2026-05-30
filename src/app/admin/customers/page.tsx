export const dynamic = "force-dynamic";

import { AdminShell } from "@/components/admin/AdminShell";
import { AdminCustomerList } from "@/components/admin/AdminCustomerList";
import { getCustomersAction } from "@/lib/actions/customerActions";
import { getMeAction } from "@/lib/actions/auth";
import { getPool, ensureDbExists } from "@/lib/db";

export default async function CustomersPage() {
  await ensureDbExists();
  const pool = getPool();

  // 1. Get logged-in user and role
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

  // 2. Fetch initial customers list (roles-scoped in action)
  const customersRes = await getCustomersAction({});
  const initialCustomers = customersRes.success && customersRes.customers ? customersRes.customers : [];

  // 3. Fetch cars for select inputs
  const [carRows] = await pool.query("SELECT id, title FROM cars ORDER BY title ASC;");
  const cars = (carRows as any[]).map((c) => ({
    id: c.id,
    title: c.title,
  }));

  // 4. Fetch staff members for assignments
  const [staffRows] = await pool.query("SELECT id, full_name, email FROM users WHERE role IN ('admin', 'staff') AND status = 'active';");
  const staff = (staffRows as any[]).map((s) => ({
    id: s.id,
    full_name: s.full_name,
    email: s.email,
  }));

  return (
    <AdminShell
      title="Quản lý khách hàng"
      subtitle="Theo dõi lead, nhu cầu mua xe, ngân sách, người quản lý và tiến độ tư vấn CRM (F08)."
    >
      <AdminCustomerList
        initialCustomers={initialCustomers}
        cars={cars}
        staff={staff}
        currentUser={currentUser}
        basePath={basePath}
      />
    </AdminShell>
  );
}
