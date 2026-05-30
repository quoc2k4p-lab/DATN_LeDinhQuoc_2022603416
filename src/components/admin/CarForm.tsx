"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ImagePlus, Save, Loader2, AlertCircle, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createCarAction, updateCarAction } from "@/lib/actions/carActions";
import { DbCar, DbCarImage } from "@/lib/db";

interface CarFormProps {
  initialCar?: DbCar;
  initialImages?: DbCarImage[];
}

function toDateTimeLocalString(dateVal: any): string {
  if (!dateVal) return "";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "";
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

export function CarForm({ initialCar, initialImages }: CarFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const basePath = pathname?.startsWith("/staff") ? "/staff" : "/admin";
  const [isPending, startTransition] = useTransition();
  const isEdit = !!initialCar;

  const [formData, setFormData] = useState({
    title_vi: initialCar?.title_vi || initialCar?.title || "",
    title_en: initialCar?.title_en || "",
    brand: initialCar?.brand || "",
    model: initialCar?.model || "",
    year: initialCar?.year?.toString() || "2022",
    price: initialCar?.price?.toString() || "",
    mileage: initialCar?.mileage?.toString() || "",
    fuelType: initialCar?.fuel_type || "Xăng",
    transmission: initialCar?.transmission || "Tự động",
    bodyType: initialCar?.body_type || "Sedan",
    color: initialCar?.color || "",
    seats: initialCar?.seats?.toString() || "5",
    engine: initialCar?.engine || "",
    description_vi: initialCar?.description_vi || initialCar?.description || "",
    description_en: initialCar?.description_en || "",
    city: initialCar?.city || "TP. Hồ Chí Minh",
    address: initialCar?.address || "",
    status: initialCar?.status || "available",
    carCondition: initialCar?.car_condition || "used",
    reservedUntil: toDateTimeLocalString(initialCar?.reserved_until),
    
    // NEW SPECIFICATIONS
    conditionType: initialCar?.condition_type || "used",
    origin: initialCar?.origin || "domestic",
    interiorColor: initialCar?.interior_color || "",
    doors: initialCar?.doors?.toString() || "4",
    drivetrain: initialCar?.drivetrain || "FWD",
  });

  // Images state
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>(initialCar?.thumbnail || "");
  
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>(
    initialImages?.filter((img) => img.sort_order > 0).map((img) => img.image_url) || []
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "carCondition") {
      setFormData((prev) => ({ ...prev, carCondition: value as "new" | "used", conditionType: value as "new" | "used" }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setGalleryFiles((prev) => [...prev, ...files]);
      
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setGalleryPreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeGalleryImage = (index: number, isExisting: boolean) => {
    if (isExisting) {
      setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
    } else {
      // Find the index in files array
      const existingCount = initialImages?.filter((img) => img.sort_order > 0).length || 0;
      const fileIndex = index - existingCount;
      setGalleryFiles((prev) => prev.filter((_, i) => i !== fileIndex));
      setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus({ type: null, message: "" });
    setErrors({});

    // Client side validation
    const clientErrors: Record<string, string> = {};
    if (!formData.title_vi.trim()) clientErrors.title_vi = "Tên xe (Tiếng Việt) là bắt buộc";
    if (!formData.title_en.trim()) clientErrors.title_en = "Tên xe (Tiếng Anh) là bắt buộc";
    if (!formData.brand.trim()) clientErrors.brand = "Hãng xe là bắt buộc";
    if (!formData.model.trim()) clientErrors.model = "Mẫu xe là bắt buộc";
    if (!formData.price.trim() || parseInt(formData.price) <= 0) clientErrors.price = "Giá bán phải lớn hơn 0";
    if (!formData.mileage.trim() || parseInt(formData.mileage) < 0) clientErrors.mileage = "Số km không hợp lệ";
    if (!formData.color.trim()) clientErrors.color = "Màu ngoại thất là bắt buộc";
    if (!formData.interiorColor.trim()) clientErrors.interiorColor = "Màu nội thất là bắt buộc";
    if (!formData.doors.trim() || parseInt(formData.doors) <= 0) clientErrors.doors = "Số cửa không hợp lệ";
    if (!formData.engine.trim()) clientErrors.engine = "Động cơ là bắt buộc";
    if (!formData.address.trim()) clientErrors.address = "Địa chỉ là bắt buộc";
    if (!formData.description_vi.trim()) clientErrors.description_vi = "Mô tả xe (Tiếng Việt) là bắt buộc";
    if (!formData.description_en.trim()) clientErrors.description_en = "Mô tả xe (Tiếng Anh) là bắt buộc";
    if (!isEdit && !thumbnailFile) clientErrors.thumbnail = "Ảnh đại diện là bắt buộc";

    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      setStatus({
        type: "error",
        message: "Vui lòng nhập đầy đủ các trường thông tin bắt buộc.",
      });
      return;
    }

    startTransition(async () => {
      const submissionData = new FormData();
      submissionData.append("title", formData.title_vi);
      submissionData.append("title_vi", formData.title_vi);
      submissionData.append("title_en", formData.title_en);
      submissionData.append("brand", formData.brand);
      submissionData.append("model", formData.model);
      submissionData.append("year", formData.year);
      submissionData.append("price", formData.price);
      submissionData.append("mileage", formData.mileage);
      submissionData.append("fuelType", formData.fuelType);
      submissionData.append("transmission", formData.transmission);
      submissionData.append("bodyType", formData.bodyType);
      submissionData.append("color", formData.color);
      submissionData.append("seats", formData.seats);
      submissionData.append("engine", formData.engine);
      submissionData.append("description", formData.description_vi);
      submissionData.append("description_vi", formData.description_vi);
      submissionData.append("description_en", formData.description_en);
      submissionData.append("city", formData.city);
      submissionData.append("address", formData.address);
      submissionData.append("status", formData.status);
      submissionData.append("carCondition", formData.carCondition);
      
      // NEW SPECIFICATIONS
      submissionData.append("conditionType", formData.conditionType);
      submissionData.append("origin", formData.origin);
      submissionData.append("interiorColor", formData.interiorColor);
      submissionData.append("doors", formData.doors);
      submissionData.append("drivetrain", formData.drivetrain);
      if (formData.status === "reserved" && formData.reservedUntil) {
        submissionData.append("reservedUntil", formData.reservedUntil);
      } else {
        submissionData.append("reservedUntil", "");
      }

      if (thumbnailFile) {
        submissionData.append("thumbnail", thumbnailFile);
      }

      galleryFiles.forEach((file) => {
        submissionData.append("gallery", file);
      });

      const result = isEdit 
        ? await updateCarAction(initialCar.id, submissionData)
        : await createCarAction(submissionData);

      if (result.success) {
        setStatus({
          type: "success",
          message: result.message || "Lưu thông tin xe thành công!",
        });
        setTimeout(() => {
          router.push(`${basePath}/cars`);
        }, 1500);
      } else {
        setStatus({
          type: "error",
          message: result.message || "Lưu thông tin xe thất bại.",
        });
        if (result.errors) {
          setErrors(result.errors);
        }
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 xl:grid-cols-[1fr_360px]">
      <div className="rounded-md border border-white/10 bg-[#151a22] p-6 space-y-6">
        {status.type === "success" && (
          <div className="flex items-start gap-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 p-4 text-emerald-500">
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">Thành công</p>
              <p className="text-sm mt-1 text-emerald-500/90">{status.message}</p>
            </div>
          </div>
        )}

        {status.type === "error" && (
          <div className="flex items-start gap-3 rounded-md bg-red-500/10 border border-red-500/20 p-4 text-red-500">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">Thất bại</p>
              <p className="text-sm mt-1 text-red-500/90">{status.message}</p>
            </div>
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          {/* Tên xe VI */}
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">Tên xe (Tiếng Việt) *</span>
            <input
              name="title_vi"
              value={formData.title_vi}
              onChange={handleChange}
              placeholder="Ví dụ: Toyota Camry 2.5Q"
              className={`h-12 w-full rounded-md border bg-[#080c11] px-4 text-zinc-100 outline-none transition focus:border-[#e31837] ${
                errors.title_vi ? "border-red-500 bg-red-500/5" : "border-white/10"
              }`}
            />
            {errors.title_vi && <span className="mt-1 text-xs text-red-500">{errors.title_vi}</span>}
          </label>

          {/* Tên xe EN */}
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">Tên xe (Tiếng Anh) *</span>
            <input
              name="title_en"
              value={formData.title_en}
              onChange={handleChange}
              placeholder="Ví dụ: Toyota Camry 2.5Q (EN)"
              className={`h-12 w-full rounded-md border bg-[#080c11] px-4 text-zinc-100 outline-none transition focus:border-[#e31837] ${
                errors.title_en ? "border-red-500 bg-red-500/5" : "border-white/10"
              }`}
            />
            {errors.title_en && <span className="mt-1 text-xs text-red-500">{errors.title_en}</span>}
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-2">

          {/* Hãng xe */}
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">Hãng xe *</span>
            <input
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              placeholder="Ví dụ: Toyota, Mercedes, BMW"
              className={`h-12 w-full rounded-md border bg-[#080c11] px-4 text-zinc-100 outline-none transition focus:border-[#e31837] ${
                errors.brand ? "border-red-500 bg-red-500/5" : "border-white/10"
              }`}
            />
            {errors.brand && <span className="mt-1 text-xs text-red-500">{errors.brand}</span>}
          </label>

          {/* Model */}
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">Model *</span>
            <input
              name="model"
              value={formData.model}
              onChange={handleChange}
              placeholder="Ví dụ: Camry, C300, 530i"
              className={`h-12 w-full rounded-md border bg-[#080c11] px-4 text-zinc-100 outline-none transition focus:border-[#e31837] ${
                errors.model ? "border-red-500 bg-red-500/5" : "border-white/10"
              }`}
            />
            {errors.model && <span className="mt-1 text-xs text-red-500">{errors.model}</span>}
          </label>

          {/* Năm sản xuất */}
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">Năm sản xuất *</span>
            <select
              name="year"
              value={formData.year}
              onChange={handleChange}
              className="h-12 w-full rounded-md border border-white/10 bg-[#080c11] px-4 text-zinc-100 outline-none transition focus:border-[#e31837]"
            >
              {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() + 1 - i).map((yr) => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </label>

          {/* Giá bán */}
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">Giá bán (VNĐ) *</span>
            <input
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              placeholder="Ví dụ: 1089000000"
              className={`h-12 w-full rounded-md border bg-[#080c11] px-4 text-zinc-100 outline-none transition focus:border-[#e31837] ${
                errors.price ? "border-red-500 bg-red-500/5" : "border-white/10"
              }`}
            />
            {errors.price && <span className="mt-1 text-xs text-red-500">{errors.price}</span>}
          </label>

          {/* Số km đã chạy */}
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">Số Odo (km) *</span>
            <input
              name="mileage"
              type="number"
              value={formData.mileage}
              onChange={handleChange}
              placeholder="Ví dụ: 22000"
              className={`h-12 w-full rounded-md border bg-[#080c11] px-4 text-zinc-100 outline-none transition focus:border-[#e31837] ${
                errors.mileage ? "border-red-500 bg-red-500/5" : "border-white/10"
              }`}
            />
            {errors.mileage && <span className="mt-1 text-xs text-red-500">{errors.mileage}</span>}
          </label>

          {/* Nhiên liệu */}
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">Nhiên liệu *</span>
            <select
              name="fuelType"
              value={formData.fuelType}
              onChange={handleChange}
              className="h-12 w-full rounded-md border border-white/10 bg-[#080c11] px-4 text-zinc-100 outline-none transition focus:border-[#e31837]"
            >
              {["Xăng", "Dầu", "Điện", "Hybrid"].map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </label>

          {/* Hộp số */}
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">Hộp số *</span>
            <select
              name="transmission"
              value={formData.transmission}
              onChange={handleChange}
              className="h-12 w-full rounded-md border border-white/10 bg-[#080c11] px-4 text-zinc-100 outline-none transition focus:border-[#e31837]"
            >
              {["Tự động", "Số sàn", "Ly hợp kép", "Vô cấp CVT"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>

          {/* Kiểu dáng */}
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">Kiểu dáng *</span>
            <select
              name="bodyType"
              value={formData.bodyType}
              onChange={handleChange}
              className="h-12 w-full rounded-md border border-white/10 bg-[#080c11] px-4 text-zinc-100 outline-none transition focus:border-[#e31837]"
            >
              {["Sedan", "SUV", "Hatchback", "Pickup", "Coupe"].map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </label>

          {/* Màu sắc */}
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">Màu ngoại thất *</span>
            <input
              name="color"
              value={formData.color}
              onChange={handleChange}
              placeholder="Ví dụ: Đen, Trắng, Đỏ"
              className={`h-12 w-full rounded-md border bg-[#080c11] px-4 text-zinc-100 outline-none transition focus:border-[#e31837] ${
                errors.color ? "border-red-500 bg-red-500/5" : "border-white/10"
              }`}
            />
            {errors.color && <span className="mt-1 text-xs text-red-500">{errors.color}</span>}
          </label>

          {/* Màu nội thất */}
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">Màu nội thất *</span>
            <input
              name="interiorColor"
              value={formData.interiorColor}
              onChange={handleChange}
              placeholder="Ví dụ: Kem, Nâu, Đen"
              className={`h-12 w-full rounded-md border bg-[#080c11] px-4 text-zinc-100 outline-none transition focus:border-[#e31837] ${
                errors.interiorColor ? "border-red-500 bg-red-500/5" : "border-white/10"
              }`}
            />
            {errors.interiorColor && <span className="mt-1 text-xs text-red-500">{errors.interiorColor}</span>}
          </label>

          {/* Số ghế */}
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">Số chỗ ngồi *</span>
            <select
              name="seats"
              value={formData.seats}
              onChange={handleChange}
              className="h-12 w-full rounded-md border border-white/10 bg-[#080c11] px-4 text-zinc-100 outline-none transition focus:border-[#e31837]"
            >
              {[2, 4, 5, 7, 8, 9].map((s) => (
                <option key={s} value={s}>{s} chỗ</option>
              ))}
            </select>
          </label>

          {/* Số cửa */}
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">Số cửa *</span>
            <select
              name="doors"
              value={formData.doors}
              onChange={handleChange}
              className="h-12 w-full rounded-md border border-white/10 bg-[#080c11] px-4 text-zinc-100 outline-none transition focus:border-[#e31837]"
            >
              {[2, 3, 4, 5, 6].map((d) => (
                <option key={d} value={d}>{d} cửa</option>
              ))}
            </select>
          </label>

          {/* Hệ dẫn động */}
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">Hệ dẫn động *</span>
            <select
              name="drivetrain"
              value={formData.drivetrain}
              onChange={handleChange}
              className="h-12 w-full rounded-md border border-white/10 bg-[#080c11] px-4 text-zinc-100 outline-none transition focus:border-[#e31837]"
            >
              <option value="FWD">Cầu trước (FWD)</option>
              <option value="RWD">Cầu sau (RWD)</option>
              <option value="AWD">4 bánh toàn thời gian (AWD)</option>
              <option value="4WD">2 cầu / 4 bánh bán thời gian (4WD)</option>
            </select>
          </label>

          {/* Xuất xứ */}
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">Xuất xứ *</span>
            <select
              name="origin"
              value={formData.origin}
              onChange={handleChange}
              className="h-12 w-full rounded-md border border-white/10 bg-[#080c11] px-4 text-zinc-100 outline-none transition focus:border-[#e31837]"
            >
              <option value="imported">Nhập khẩu (Imported)</option>
              <option value="domestic">Trong nước (Domestic)</option>
            </select>
          </label>

          {/* Động cơ */}
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">Động cơ/Dung tích *</span>
            <input
              name="engine"
              value={formData.engine}
              onChange={handleChange}
              placeholder="Ví dụ: Xăng 3.0L, 2.0L Turbo"
              className={`h-12 w-full rounded-md border bg-[#080c11] px-4 text-zinc-100 outline-none transition focus:border-[#e31837] ${
                errors.engine ? "border-red-500 bg-red-500/5" : "border-white/10"
              }`}
            />
            {errors.engine && <span className="mt-1 text-xs text-red-500">{errors.engine}</span>}
          </label>

          {/* Thành phố */}
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">Khu vực trưng bày *</span>
            <select
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="h-12 w-full rounded-md border border-white/10 bg-[#080c11] px-4 text-zinc-100 outline-none transition focus:border-[#e31837]"
            >
              {["TP. Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Bình Dương"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          {/* Địa chỉ cụ thể */}
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">Địa chỉ cụ thể *</span>
            <input
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Ví dụ: Showroom TQ Auto, Quận 7, TP. HCM"
              className={`h-12 w-full rounded-md border bg-[#080c11] px-4 text-zinc-100 outline-none transition focus:border-[#e31837] ${
                errors.address ? "border-red-500 bg-red-500/5" : "border-white/10"
              }`}
            />
            {errors.address && <span className="mt-1 text-xs text-red-500">{errors.address}</span>}
          </label>
        </div>

        {/* Mô tả VI */}
        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">Mô tả chi tiết (Tiếng Việt) *</span>
          <textarea
            name="description_vi"
            value={formData.description_vi}
            onChange={handleChange}
            placeholder="Mô tả về ngoại thất, nội thất, tình trạng giấy tờ pháp lý, bảo dưỡng..."
            className={`min-h-36 w-full rounded-md border bg-[#080c11] p-4 text-zinc-100 outline-none transition focus:border-[#e31837] ${
              errors.description_vi ? "border-red-500 bg-red-500/5" : "border-white/10"
            }`}
          />
          {errors.description_vi && <span className="mt-1 text-xs text-red-500">{errors.description_vi}</span>}
        </label>

        {/* Mô tả EN */}
        <label className="block mt-4">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">Mô tả chi tiết (Tiếng Anh) *</span>
          <textarea
            name="description_en"
            value={formData.description_en}
            onChange={handleChange}
            placeholder="Detailed description in English..."
            className={`min-h-36 w-full rounded-md border bg-[#080c11] p-4 text-zinc-100 outline-none transition focus:border-[#e31837] ${
              errors.description_en ? "border-red-500 bg-red-500/5" : "border-white/10"
            }`}
          />
          {errors.description_en && <span className="mt-1 text-xs text-red-500">{errors.description_en}</span>}
        </label>

        {/* Gallery Upload Section */}
        <div className="border-t border-white/5 pt-6">
          <span className="mb-4 block text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">Bộ sưu tập ảnh xe (Gallery)</span>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {galleryPreviews.map((preview, index) => (
              <div key={index} className="relative aspect-[4/3] rounded-md border border-white/10 overflow-hidden bg-black group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Gallery Preview" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeGalleryImage(index, index < (initialImages?.filter((img) => img.sort_order > 0).length || 0))}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-zinc-400 hover:bg-[#e31837] hover:text-white transition opacity-0 group-hover:opacity-100"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-white/10 bg-[#080c11] hover:bg-[#151a22] transition text-zinc-500 hover:text-zinc-300">
              <ImagePlus size={24} />
              <span className="text-xs font-semibold mt-1">Thêm ảnh phụ</span>
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleGalleryChange} />
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Đang xử lý...
              </>
            ) : (
              <>
                <Save size={18} /> Lưu xe
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Right Column: Status & Thumbnail */}
      <aside className="space-y-6">
        {/* Tình trạng xe */}
        <div className="rounded-md border border-white/10 bg-[#151a22] p-6">
          <span className="mb-3 block text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">Tình trạng xe</span>
          <select
            name="carCondition"
            value={formData.carCondition}
            onChange={handleChange}
            className="h-12 w-full rounded-md border border-white/10 bg-[#080c11] px-4 text-zinc-100 outline-none transition focus:border-[#e31837]"
          >
            <option value="used">Xe đã qua sử dụng (Used)</option>
            <option value="new">Xe mới (New)</option>
          </select>
        </div>

        {/* Trạng thái hiển thị */}
        <div className="rounded-md border border-white/10 bg-[#151a22] p-6">
          <span className="mb-3 block text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">Trạng thái bán</span>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="h-12 w-full rounded-md border border-white/10 bg-[#080c11] px-4 text-zinc-100 outline-none transition focus:border-[#e31837]"
          >
            <option value="available">Đang bán (Available)</option>
            <option value="reserved">Giữ chỗ (Reserved)</option>
            <option value="sold">Đã bán (Sold)</option>
            <option value="hidden">Tạm ẩn (Hidden)</option>
          </select>

          {formData.status === "reserved" && (
            <div className="mt-4 border-t border-white/5 pt-4">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">Giữ chỗ đến ngày</span>
              <input
                type="datetime-local"
                name="reservedUntil"
                value={formData.reservedUntil}
                onChange={handleChange}
                className="h-12 w-full rounded-md border border-white/10 bg-[#080c11] px-4 text-zinc-100 outline-none transition focus:border-[#e31837]"
              />
              <p className="mt-1.5 text-xs text-zinc-500">Giữ chỗ sẽ tự động hết hạn và xe trở lại trạng thái khả dụng sau mốc thời gian này.</p>
            </div>
          )}
        </div>

        {/* Thumbnail Upload */}
        <div className="rounded-md border border-white/10 bg-[#151a22] p-6 text-center">
          <span className="mb-4 block text-left text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">Ảnh đại diện xe *</span>
          <div className="relative aspect-[4/3] rounded-md border border-white/10 overflow-hidden bg-[#080c11] flex items-center justify-center">
            {thumbnailPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumbnailPreview} alt="Thumbnail Preview" className="h-full w-full object-cover" />
            ) : (
              <div className="text-zinc-600">
                <ImagePlus size={32} className="mx-auto" />
                <span className="text-xs font-semibold block mt-2">Chưa chọn ảnh</span>
              </div>
            )}
          </div>
          
          <label className="mt-4 flex h-10 cursor-pointer items-center justify-center rounded-md border border-white/10 bg-[#080c11] hover:bg-[#1f2631] transition text-sm font-semibold text-zinc-300">
            Chọn ảnh đại diện
            <input type="file" accept="image/*" className="hidden" onChange={handleThumbnailChange} />
          </label>
          {errors.thumbnail && <span className="mt-1 text-xs text-red-500 block">{errors.thumbnail}</span>}

          <p className="mt-5 text-left text-xs leading-5 text-zinc-500">
            Đây là ảnh bìa chính hiển thị trên card kho xe và trang chủ. Dung lượng khuyên dùng dưới 2MB.
          </p>
        </div>
      </aside>
    </form>
  );
}
