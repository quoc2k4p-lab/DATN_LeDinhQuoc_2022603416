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
    slug: "camry-2022",
    name: "Toyota Camry 2.5Q",
    brand: "Toyota",
    category: "Sedan",
    year: 2022,
    price: "1.089.000.000đ",
    mileage: "22.000 km",
    fuel: "Xăng",
    transmission: "Tự động",
    power: "207 HP",
    color: "Đen",
    status: "available",
    image:
      "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=1400&q=85",
    gallery: [
      "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=1400&q=85",
      "https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=85",
    ],
    description:
      "Sedan hạng D giữ form đẹp, nội thất sáng, bảo dưỡng hãng đầy đủ và phù hợp khách hàng cần xe sang trọng cho công việc hằng ngày.",
    specs: {
      "Động cơ": "2.5L Dynamic Force",
      "Dẫn động": "Cầu trước",
      "Ghế": "Da chỉnh điện",
      "An toàn": "Toyota Safety Sense",
      "Xuất xứ": "Nhập khẩu Thái Lan",
      "Biển số": "TP. Hồ Chí Minh",
    },
  },
  {
    id: "CAR-1188",
    slug: "mercedes-c300-amg",
    name: "Mercedes-Benz C300 AMG",
    brand: "Mercedes",
    category: "Sedan",
    year: 2021,
    price: "1.625.000.000đ",
    mileage: "18.500 km",
    fuel: "Xăng",
    transmission: "9G-Tronic",
    power: "258 HP",
    color: "Trắng",
    status: "reserved",
    image:
      "https://images.unsplash.com/photo-1617654112368-307921291f42?auto=format&fit=crop&w=1400&q=85",
    gallery: [],
    description: "Cấu hình AMG, nội thất thể thao, lịch sử sử dụng rõ ràng.",
    specs: {
      "Động cơ": "2.0L Turbo",
      "Dẫn động": "Cầu sau",
      "Gói trang bị": "AMG Line",
      "Nội thất": "Da thể thao",
    },
  },
  {
    id: "CAR-1302",
    slug: "bmw-530i-m-sport",
    name: "BMW 530i M Sport",
    brand: "BMW",
    category: "Sedan",
    year: 2020,
    price: "1.790.000.000đ",
    mileage: "31.000 km",
    fuel: "Xăng",
    transmission: "Steptronic",
    power: "252 HP",
    color: "Xanh",
    status: "available",
    image:
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1400&q=85",
    gallery: [],
    description: "Sedan Đức hướng lái, gói M Sport, trang bị cao.",
    specs: {
      "Động cơ": "2.0L TwinPower Turbo",
      "Dẫn động": "Cầu sau",
      "Mâm": "M Sport 19 inch",
      "Nội thất": "Da Dakota",
    },
  },
  {
    id: "CAR-1410",
    slug: "lexus-rx350",
    name: "Lexus RX 350",
    brand: "Lexus",
    category: "SUV",
    year: 2019,
    price: "2.210.000.000đ",
    mileage: "42.000 km",
    fuel: "Xăng",
    transmission: "Tự động",
    power: "295 HP",
    color: "Bạc",
    status: "available",
    image:
      "https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=1400&q=85",
    gallery: [],
    description: "SUV gia đình cao cấp, vận hành êm và giữ giá tốt.",
    specs: {
      "Động cơ": "V6 3.5L",
      "Dẫn động": "AWD",
      "Ghế": "Da chỉnh điện nhớ vị trí",
      "An toàn": "Lexus Safety System+",
    },
  },
  {
    id: "CAR-1565",
    slug: "porsche-macan",
    name: "Porsche Macan",
    brand: "Porsche",
    category: "SUV",
    year: 2021,
    price: "3.180.000.000đ",
    mileage: "16.000 km",
    fuel: "Xăng",
    transmission: "PDK",
    power: "265 HP",
    color: "Xám",
    status: "sold",
    image:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=85",
    gallery: [],
    description: "SUV thể thao nhỏ gọn, cảm giác lái nổi bật.",
    specs: {
      "Động cơ": "2.0L Turbo",
      "Dẫn động": "AWD",
      "Gói trang bị": "Sport Chrono",
      "Mâm": "20 inch",
    },
  },
  {
    id: "CAR-1677",
    slug: "audi-a6",
    name: "Audi A6 45 TFSI",
    brand: "Audi",
    category: "Sedan",
    year: 2022,
    price: "2.095.000.000đ",
    mileage: "12.800 km",
    fuel: "Xăng",
    transmission: "S tronic",
    power: "245 HP",
    color: "Đen",
    status: "available",
    image:
      "https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?auto=format&fit=crop&w=1400&q=85",
    gallery: [],
    description: "Khoang lái số hóa, thiết kế lịch lãm, xe còn rất mới.",
    specs: {
      "Động cơ": "2.0L TFSI",
      "Dẫn động": "Cầu trước",
      "Màn hình": "Virtual Cockpit",
      "Đèn": "Matrix LED",
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
  { id: "APT-1002", date: "2026-05-22", time: "11:00", customer: "Trần Quốc Huy", phone: "0938 440 128", email: "huy.tran@example.com", car: "BMW 530i M Sport", note: "Cần lái thử cuối tuần.", status: "Chờ xác nhận" },
  { id: "APT-1003", date: "2026-05-23", time: "14:15", customer: "Lê Hoàng Nam", phone: "0917 725 600", email: "nam.le@example.com", car: "Mercedes C300 AMG", note: "Quan tâm xe giữ chỗ.", status: "Đã xác nhận" },
  { id: "APT-1004", date: "2026-05-24", time: "16:00", customer: "Phạm Bảo Ngọc", phone: "0986 330 220", email: "ngoc.pham@example.com", car: "Audi A6 45 TFSI", note: "Cần tư vấn phí lăn bánh.", status: "Mới" },
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
  { name: "Phạm Bảo Ngọc", email: "customer@example.com", phone: "0986 330 220", role: "Khách hàng", status: "Đang hoạt động" },
];

export const contactRequests = [
  { customerName: "Đỗ Gia Khánh", phone: "0909 225 710", email: "khanh.do@example.com", message: "Tôi cần tư vấn xe Lexus RX và phương án trả góp.", status: "Mới" },
  { customerName: "Hoàng Bảo Trâm", phone: "0918 333 901", email: "tram.hoang@example.com", message: "Nhờ showroom báo giá Audi A6 và lịch xem xe.", status: "Đang xử lý" },
];
