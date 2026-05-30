export type CarStatus = "available" | "reserved" | "sold";

export type Car = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  year: number;
  price: string;
  mileage: string;
  fuel: string;
  transmission: string;
  power: string;
  color: string;
  status: CarStatus;
  condition?: "new" | "used";
  condition_type?: "new" | "used";
  origin?: "imported" | "domestic";
  interior_color?: string;
  doors?: number;
  drivetrain?: "FWD" | "RWD" | "AWD" | "4WD";
  image: string;
  gallery: string[];
  description: string;
  specs: Record<string, string>;
};

export const categories = [
  { id: "CAT-01", name: "Sedan", count: 18, status: "Đang hiển thị" },
  { id: "CAT-02", name: "SUV", count: 14, status: "Đang hiển thị" },
  { id: "CAT-03", name: "Hatchback", count: 5, status: "Đang hiển thị" },
  { id: "CAT-04", name: "Pickup", count: 5, status: "Tạm ẩn" },
];

export const cars: Car[] = [
  {
    id: "CAR-1024",
    slug: "toyota-camry-25q",
    name: "Toyota Camry 2.5Q",
    brand: "Toyota",
    category: "Sedan",
    year: 2022,
    price: "1.250.000.000đ",
    mileage: "12.000 km",
    fuel: "Xăng",
    transmission: "Tự động 8 cấp",
    power: "207 HP",
    color: "Đen",
    status: "available",
    condition: "used",
    condition_type: "used",
    origin: "imported",
    interior_color: "Đen",
    doors: 4,
    drivetrain: "FWD",
    image: "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=1400&q=85",
    gallery: [
      "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=1400&q=85",
      "https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1200&q=85",
    ],
    description: "Sedan hạng D nhập khẩu nguyên chiếc từ Thái Lan. Xe đi cực giữ gìn, bảo dưỡng đầy đủ tại hãng, chất xe còn cực mới.",
    specs: {
      "Động cơ": "2.5L Dynamic Force",
      "Dẫn động": "Cầu trước FWD",
      "Ghế": "Da chỉnh điện",
      "An toàn": "Toyota Safety Sense",
    },
  },
  {
    id: "CAR-1188",
    slug: "mercedes-gls-450",
    name: "Mercedes-Benz GLS 450 4MATIC",
    brand: "Mercedes",
    category: "SUV",
    year: 2021,
    price: "3.590.000.000đ",
    mileage: "40.000 km",
    fuel: "Xăng",
    transmission: "Số tự động",
    power: "367 HP",
    color: "Đen",
    status: "available",
    condition: "used",
    condition_type: "used",
    origin: "imported",
    interior_color: "Kem",
    doors: 5,
    drivetrain: "AWD",
    image: "https://images.unsplash.com/photo-1617654112368-307921291f42?auto=format&fit=crop&w=1400&q=85",
    gallery: [],
    description: "SUV hạng sang cỡ lớn Mercedes GLS 450 nhập khẩu. Nội thất kem sang trọng, đầy đủ tiện nghi cao cấp nhất.",
    specs: {
      "Động cơ": "Xăng 3.0 L",
      "Dẫn động": "AWD - 4 bánh toàn thời gian",
      "Hộp số": "Số tự động",
      "Màu nội thất": "Kem",
      "Ghế": "7 chỗ",
    },
  },
  {
    id: "CAR-1302",
    slug: "bmw-x5-m-sport",
    name: "BMW X5 xDrive40i M Sport",
    brand: "BMW",
    category: "SUV",
    year: 2021,
    price: "3.450.000.000đ",
    mileage: "28.000 km",
    fuel: "Xăng",
    transmission: "Tự động 8 cấp",
    power: "340 HP",
    color: "Trắng",
    status: "available",
    condition: "used",
    condition_type: "used",
    origin: "domestic",
    interior_color: "Nâu",
    doors: 5,
    drivetrain: "AWD",
    image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1400&q=85",
    gallery: [],
    description: "BMW X5 lắp ráp trong nước, gói trang bị thể thao M Sport cá tính, cảm giác lái năng động vượt trội.",
    specs: {
      "Động cơ": "I6 3.0L TwinPower Turbo",
      "Dẫn động": "AWD - 4 bánh toàn thời gian",
      "Mâm": "M Sport 20 inch",
    },
  },
  {
    id: "CAR-1410",
    slug: "mazda-cx5-premium",
    name: "Mazda CX-5 2.0 Premium",
    brand: "Mazda",
    category: "SUV",
    year: 2022,
    price: "819.000.000đ",
    mileage: "15.000 km",
    fuel: "Xăng",
    transmission: "Tự động 6 cấp",
    power: "154 HP",
    color: "Đỏ",
    status: "available",
    condition: "used",
    condition_type: "used",
    origin: "domestic",
    interior_color: "Đen",
    doors: 5,
    drivetrain: "FWD",
    image: "https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=1400&q=85",
    gallery: [],
    description: "Mẫu SUV đô thị ăn khách Mazda CX-5 phiên bản Premium cao cấp lắp ráp trong nước, màu đỏ pha lê cực đẹp.",
    specs: {
      "Động cơ": "SkyActiv-G 2.0L",
      "Dẫn động": "Cầu trước FWD",
      "Công nghệ": "G-Vectoring Control Plus",
    },
  },
  {
    id: "CAR-1565",
    slug: "honda-civic-rs",
    name: "Honda Civic RS 1.5 Turbo",
    brand: "Honda",
    category: "Sedan",
    year: 2023,
    price: "870.000.000đ",
    mileage: "0 km",
    fuel: "Xăng",
    transmission: "Vô cấp CVT",
    power: "178 HP",
    color: "Trắng",
    status: "available",
    condition: "new",
    condition_type: "new",
    origin: "imported",
    interior_color: "Đen viền chỉ đỏ",
    doors: 4,
    drivetrain: "FWD",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=85",
    gallery: [],
    description: "Sedan thể thao Honda Civic RS mới 100% nhập khẩu từ Thái Lan. Kiểu dáng trẻ trung, lái hay bậc nhất phân khúc.",
    specs: {
      "Động cơ": "1.5L VTEC Turbo",
      "Dẫn động": "Cầu trước FWD",
      "Gói an toàn": "Honda SENSING",
    },
  },
];

export const stats = [
  { label: "Xe đang bán", value: "42", trend: "+8%" },
  { label: "Lịch hẹn tuần này", value: "28", trend: "+12%" },
  { label: "Khách tiềm năng", value: "186", trend: "+21%" },
  { label: "Doanh thu dự kiến", value: "18.4 tỷ", trend: "+5%" },
];

export const appointments = [
  { id: "APT-1001", date: "2026-05-22", time: "09:30", customer: "Nguyễn Minh Anh", phone: "0902 118 882", email: "minhanh@example.com", car: "Toyota Camry 2.5Q", note: "Muốn xem xe và tư vấn trả góp.", status: "Đã xác nhận" },
  { id: "APT-1002", date: "2026-05-22", time: "11:00", customer: "Trần Quốc Huy", phone: "0938 440 128", email: "huy.tran@example.com", car: "BMW X5 xDrive40i M Sport", note: "Cần lái thử cuối tuần.", status: "Chờ xác nhận" },
  { id: "APT-1003", date: "2026-05-23", time: "14:15", customer: "Lê Hoàng Nam", phone: "0917 725 600", email: "nam.le@example.com", car: "Mercedes-Benz GLS 450 4MATIC", note: "Quan tâm xe giữ chỗ.", status: "Đã xác nhận" },
  { id: "APT-1004", date: "2026-05-24", time: "16:00", customer: "Phạm Bảo Ngọc", phone: "0986 330 220", email: "ngoc.pham@example.com", car: "Honda Civic RS 1.5 Turbo", note: "Cần tư vấn phí lăn bánh.", status: "Mới" },
];

export const customers = [
  { name: "Nguyễn Minh Anh", phone: "0902 118 882", interest: "Toyota Camry", stage: "Đặt lịch xem xe", budget: "1.2 tỷ" },
  { name: "Trần Quốc Huy", phone: "0938 440 128", interest: "BMW 5 Series", stage: "Đang tư vấn", budget: "1.8 tỷ" },
  { name: "Lê Hoàng Nam", phone: "0917 725 600", interest: "Mercedes C-Class", stage: "Báo giá", budget: "1.6 tỷ" },
  { name: "Phạm Bảo Ngọc", phone: "0986 330 220", interest: "Audi A6", stage: "Lead mới", budget: "2.1 tỷ" },
  { name: "Đỗ Gia Khánh", phone: "0909 225 710", interest: "Lexus RX", stage: "Chăm sóc lại", budget: "2.4 tỷ" },
];

export const users = [
  { name: "Lê Đình Quốc", email: "admin@tqauto.vn", phone: "0909 888 668", role: "Quản trị viên", status: "Đang hoạt động" },
  { name: "Nguyễn Minh Anh", email: "sales01@tqauto.vn", phone: "0902 118 882", role: "Nhân viên", status: "Đang hoạt động" },
  { name: "Trần Quốc Huy", email: "sales02@tqauto.vn", phone: "0938 440 128", role: "Nhân viên", status: "Tạm khóa" },
  { name: "Phạm Hải Đăng", email: "sales03@tqauto.vn", phone: "0917 725 600", role: "Nhân viên", status: "Đang hoạt động" },
  { name: "Phạm Bảo Ngọc", email: "customer@example.com", phone: "0986 330 220", role: "Khách hàng", status: "Đang hoạt động" },
];

export const contactRequests = [
  {
    id: "req00000-0000-0000-0000-000000000001",
    full_name: "Đỗ Gia Khánh",
    phone: "0909225710",
    email: "khanh.do@example.com",
    consultation_type: "Trả góp ngân hàng",
    message: "Tôi cần tư vấn xe Lexus RX và phương án trả góp hàng tháng qua ngân hàng VIB.",
    assigned_staff_id: null,
    stage: "new_lead",
    status: "active"
  },
  {
    id: "req00000-0000-0000-0000-000000000002",
    full_name: "Hoàng Bảo Trâm",
    phone: "0918333901",
    email: "tram.hoang@example.com",
    consultation_type: "Đặt lịch xem xe",
    message: "Nhờ showroom báo giá và đặt lịch xem xe Mazda CX-5 trực tiếp vào sáng chủ nhật.",
    assigned_staff_id: "a0000000-0000-0000-0000-000000000002", // Nguyễn Minh Anh (sales01)
    stage: "assigned",
    status: "active"
  }
];
