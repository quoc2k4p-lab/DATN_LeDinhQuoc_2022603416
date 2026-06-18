export const dynamic = "force-dynamic";

import { getCars, getCarImages, getUsers, getCustomers } from "@/lib/db";
import { AdminShell } from "@/components/admin/AdminShell";
import { CarForm } from "@/components/admin/CarForm";
import { notFound } from "next/navigation";

interface EditCarPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCarPage({ params }: EditCarPageProps) {
  const { id } = await params;
  
  const cars = await getCars();
  const car = cars.find((c) => c.id === id);
  
  if (!car) {
    notFound();
  }
  
  const images = await getCarImages(id);
  const users = await getUsers();
  const customers = await getCustomers();
  const staff = users.filter((u) => u.role === "admin" || u.role === "staff");

  return (
    <AdminShell
      title="Chỉnh sửa thông tin xe"
      subtitle={`Chỉnh sửa các thông số kỹ thuật, mô tả, ảnh đại diện và bộ sưu tập cho xe ${car.title}.`}
    >
      <CarForm 
        initialCar={car} 
        initialImages={images} 
        staffList={staff} 
        customerList={customers} 
      />
    </AdminShell>
  );
}
