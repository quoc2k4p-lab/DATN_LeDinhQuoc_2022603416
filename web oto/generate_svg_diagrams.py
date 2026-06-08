import os
import zlib
import base64
import string
import urllib.request
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT_DIR = ROOT / "svg_diagrams"
os.makedirs(OUT_DIR, exist_ok=True)

def plantuml_encode(plantuml_text):
    plantuml_alphabet = string.digits + string.ascii_uppercase + string.ascii_lowercase + '-_'
    base64_alphabet = string.ascii_uppercase + string.ascii_lowercase + string.digits + '+/'
    b64_to_plantuml = bytes.maketrans(base64_alphabet.encode('utf-8'), plantuml_alphabet.encode('utf-8'))
    
    # Compress using raw deflate
    zlibbed_str = zlib.compress(plantuml_text.encode('utf-8'))
    compressed_string = zlibbed_str[2:-4]
    
    return base64.b64encode(compressed_string).translate(b64_to_plantuml).decode('utf-8')

def download_svg(puml_text, output_path):
    try:
        encoded = plantuml_encode(puml_text)
        url = f"http://www.plantuml.com/plantuml/svg/{encoded}"
        
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        
        with urllib.request.urlopen(req, timeout=20) as response:
            svg_data = response.read()
            with open(output_path, 'wb') as f:
                f.write(svg_data)
        return True
    except Exception as e:
        print(f"Error downloading {output_path.name}: {e}")
        return False

# ========================================================
# PLANTUML CODES FOR 16 SEQUENCE DIAGRAMS (TIẾNG VIỆT, BCE)
# ========================================================
puml_diagrams = {}

# 1. Đăng ký tài khoản (DangKy)
puml_diagrams["seq_01_DangKy.svg"] = """@startuml
skinparam style strictuml
skinparam monochrome true
skinparam shadowing false
skinparam sequenceMessageAlign center
skinparam responseMessageBelowArrow true

actor KhachHang as ": KhachHang"
boundary DangKyUI as ": DangKyUI"
control DangKyController as ": DangKyController"
entity USERS as ": USERS"

autonumber

KhachHang -> DangKyUI : chonDangKy()
activate DangKyUI
DangKyUI -> DangKyUI : hienThiManHinhDangKy()
deactivate DangKyUI

KhachHang -> DangKyUI : nhapThongTinDangKy()
KhachHang -> DangKyUI : kichNutDangKy()
activate DangKyUI
DangKyUI -> DangKyController : guiThongTinDangKy()
activate DangKyController
DangKyController -> USERS : kiemTraEmailTonTai()
activate USERS
USERS --> DangKyController : returnKetQuaKiemTra()
deactivate USERS
DangKyController -> USERS : luuTaiKhoanMoi()
activate USERS
USERS --> DangKyController : returnKetQuaLuu()
deactivate USERS
DangKyController --> DangKyUI : returnKetQua()
deactivate DangKyController
DangKyUI -> DangKyUI : hienThiThongBaoThanhCong()
deactivate DangKyUI
@enduml"""

# 2. Đăng nhập (DangNhap)
puml_diagrams["seq_02_DangNhap.svg"] = """@startuml
skinparam style strictuml
skinparam monochrome true
skinparam shadowing false
skinparam sequenceMessageAlign center
skinparam responseMessageBelowArrow true

actor NguoiDung as ": NguoiDung"
boundary DangNhapUI as ": DangNhapUI"
control DangNhapController as ": DangNhapController"
entity USERS as ": USERS"

autonumber

NguoiDung -> DangNhapUI : chonIconNguoiDung()
activate DangNhapUI
DangNhapUI -> DangNhapUI : hienThiManHinhDangNhap()
deactivate DangNhapUI

NguoiDung -> DangNhapUI : nhapEmailMatKhau()
NguoiDung -> DangNhapUI : kichNutDangNhap()
activate DangNhapUI
DangNhapUI -> DangNhapController : layThongTinTaiKhoan(email, password)
activate DangNhapController
DangNhapController -> USERS : layThongTinTaiKhoan(email)
activate USERS
USERS --> DangNhapController : returnKetQua()
deactivate USERS
DangNhapController --> DangNhapUI : returnKetQua()
deactivate DangNhapController
DangNhapUI -> DangNhapUI : hienThiManHinhTheoVaiTro()
deactivate DangNhapUI
@enduml"""

# 3. Xem chi tiết xe (XemChiTiet)
puml_diagrams["seq_03_XemChiTiet.svg"] = """@startuml
skinparam style strictuml
skinparam monochrome true
skinparam shadowing false
skinparam sequenceMessageAlign center
skinparam responseMessageBelowArrow true

actor KhachHang as ": KhachHang"
boundary DanhSachXeUI as ": DanhSachXeUI"
boundary ChiTietXeUI as ": ChiTietXeUI"
control XeController as ": XeController"
entity CARS as ": CARS"
entity CAR_IMAGES as ": CAR_IMAGES"
entity CAR_REVIEWS as ": CAR_REVIEWS"

autonumber

KhachHang -> DanhSachXeUI : chonXeCanXem()
activate DanhSachXeUI
DanhSachXeUI -> XeController : layThongTinChiTietXe(carId)
activate XeController
XeController -> CARS : layThongTinXe(carId)
activate CARS
CARS --> XeController : returnThongTinXe()
deactivate CARS
XeController -> CAR_IMAGES : layDanhSachAnh(carId)
activate CAR_IMAGES
CAR_IMAGES --> XeController : returnDanhSachAnh()
deactivate CAR_IMAGES
XeController -> CAR_REVIEWS : layDanhGiaXe(carId)
activate CAR_REVIEWS
CAR_REVIEWS --> XeController : returnDanhGia()
deactivate CAR_REVIEWS
XeController --> ChiTietXeUI : returnDuLieuChiTiet()
deactivate XeController
ChiTietXeUI -> ChiTietXeUI : hienThiManHinhChiTietXe()
deactivate DanhSachXeUI
@enduml"""

# 4. Xem tin tức (XemTinTuc)
puml_diagrams["seq_04_XemTinTuc.svg"] = """@startuml
skinparam style strictuml
skinparam monochrome true
skinparam shadowing false
skinparam sequenceMessageAlign center
skinparam responseMessageBelowArrow true

actor KhachHang as ": KhachHang"
boundary TinTucUI as ": TinTucUI"
control TinTucController as ": TinTucController"
entity POSTS as ": POSTS"

autonumber

KhachHang -> TinTucUI : chonMenuTinTuc()
activate TinTucUI
TinTucUI -> TinTucController : layDanhSachTinTuc()
activate TinTucController
TinTucController -> POSTS : truyVanBaiVietDaDang()
activate POSTS
POSTS --> TinTucController : returnDanhSachBaiViet()
deactivate POSTS
TinTucController --> TinTucUI : returnKetQua()
deactivate TinTucController
TinTucUI -> TinTucUI : hienThiDanhSachTinTuc()

KhachHang -> TinTucUI : chonBaiViet()
TinTucUI -> TinTucController : layChiTietBaiViet(slug)
activate TinTucController
TinTucController -> POSTS : layBaiVietTheoSlug(slug)
POSTS --> TinTucController : returnChiTietBaiViet()
TinTucController --> TinTucUI : returnKetQua()
deactivate TinTucController
TinTucUI -> TinTucUI : hienThiChiTietTinTuc()
deactivate TinTucUI
@enduml"""

# 5. Đặt lịch xem xe (DatLich)
puml_diagrams["seq_05_DatLich.svg"] = """@startuml
skinparam style strictuml
skinparam monochrome true
skinparam shadowing false
skinparam sequenceMessageAlign center
skinparam responseMessageBelowArrow true

actor KhachHang as ": KhachHang"
boundary DatLichUI as ": DatLichUI"
control LichHenController as ": LichHenController"
entity APPOINTMENTS as ": APPOINTMENTS"
entity CUSTOMERS as ": CUSTOMERS"
entity NOTIFICATIONS as ": NOTIFICATIONS"

autonumber

KhachHang -> DatLichUI : chonXeVaChonDatLich()
activate DatLichUI
DatLichUI -> DatLichUI : hienThiFormDatLich()
KhachHang -> DatLichUI : nhapThongTinVaChonNgayGio()
DatLichUI -> LichHenController : kiemTraKhungGio(date, time)
activate LichHenController
LichHenController -> APPOINTMENTS : demSoLichTheoKhungGio()
activate APPOINTMENTS
APPOINTMENTS --> LichHenController : returnSoLuongLich()
deactivate APPOINTMENTS
LichHenController --> DatLichUI : returnTinhTrangKhungGio()
deactivate LichHenController

KhachHang -> DatLichUI : kichNutGuiDatLich()
DatLichUI -> LichHenController : taoLichHen()
activate LichHenController
LichHenController -> APPOINTMENTS : luuLichHenMoi()
LichHenController -> CUSTOMERS : taoHoacCapNhatKhachHangCRM()
LichHenController -> NOTIFICATIONS : taoThongBaoLichHenMoi()
LichHenController --> DatLichUI : returnKetQua()
deactivate LichHenController
DatLichUI -> DatLichUI : hienThiThongBaoDatLichThanhCong()
deactivate DatLichUI
@enduml"""

# 6. Cập nhật hồ sơ cá nhân (CapNhatHoSoCaNhan)
puml_diagrams["seq_06_CapNhatHoSoCaNhan.svg"] = """@startuml
skinparam style strictuml
skinparam monochrome true
skinparam shadowing false
skinparam sequenceMessageAlign center
skinparam responseMessageBelowArrow true

actor KhachHang as ": KhachHang"
boundary HoSoUI as ": HoSoUI"
control HoSoController as ": HoSoController"
control XacThucController as ": XacThucController"
entity USERS as ": USERS"

autonumber

KhachHang -> HoSoUI : chonHoSoCaNhan()
activate HoSoUI
HoSoUI -> XacThucController : layNguoiDungHienTai()
activate XacThucController
XacThucController -> USERS : layThongTinNguoiDung()
activate USERS
USERS --> XacThucController : returnThongTinNguoiDung()
deactivate USERS
XacThucController --> HoSoUI : returnKetQua()
deactivate XacThucController
HoSoUI -> HoSoUI : hienThiFormHoSo()

KhachHang -> HoSoUI : capNhatThongTin()
KhachHang -> HoSoUI : kichNutLuu()
HoSoUI -> HoSoController : guiThongTinCapNhat()
activate HoSoController
HoSoController -> USERS : capNhatThongTinNguoiDung()
activate USERS
USERS --> HoSoController : returnKetQua()
deactivate USERS
HoSoController --> HoSoUI : returnKetQua()
deactivate HoSoController
HoSoUI -> HoSoUI : hienThiThongBaoThanhCong()
deactivate HoSoUI
@enduml"""

# 7. Liên hệ (LienHe)
puml_diagrams["seq_07_LienHe.svg"] = """@startuml
skinparam style strictuml
skinparam monochrome true
skinparam shadowing false
skinparam sequenceMessageAlign center
skinparam responseMessageBelowArrow true

actor KhachHang as ": KhachHang"
boundary LienHeUI as ": LienHeUI"
control LienHeController as ": LienHeController"
entity CONTACT_REQUESTS as ": CONTACT_REQUESTS"
entity CUSTOMERS as ": CUSTOMERS"
entity NOTIFICATIONS as ": NOTIFICATIONS"
control MAIL as ": MAIL"

autonumber

KhachHang -> LienHeUI : chonMenuLienHe()
activate LienHeUI
LienHeUI -> LienHeUI : hienThiFormLienHe()
KhachHang -> LienHeUI : nhapThongTinLienHe()
KhachHang -> LienHeUI : kichNutGui()
LienHeUI -> LienHeController : guiYeuCauLienHe()
activate LienHeController
LienHeController -> CONTACT_REQUESTS : luuYeuCauLienHe()
activate CONTACT_REQUESTS
CONTACT_REQUESTS --> LienHeController : returnKetQua()
deactivate CONTACT_REQUESTS
LienHeController -> CUSTOMERS : taoHoacCapNhatKhachHang()
LienHeController -> NOTIFICATIONS : taoThongBaoChoAdmin()
LienHeController -> MAIL : guiEmailXacNhan()
activate MAIL
MAIL --> LienHeController : returnKetQuaGuiMail()
deactivate MAIL
LienHeController --> LienHeUI : returnKetQua()
deactivate LienHeController
LienHeUI -> LienHeUI : hienThiThongBaoGuiThanhCong()
deactivate LienHeUI
@enduml"""

# 8. Theo dõi lịch hẹn cá nhân (TheoDoiLichHen)
puml_diagrams["seq_08_TheoDoiLichHen.svg"] = """@startuml
skinparam style strictuml
skinparam monochrome true
skinparam shadowing false
skinparam sequenceMessageAlign center
skinparam responseMessageBelowArrow true

actor KhachHang as ": KhachHang"
boundary LichHenCaNhanUI as ": LichHenCaNhanUI"
control XacThucController as ": XacThucController"
control LichHenController as ": LichHenController"
entity APPOINTMENTS as ": APPOINTMENTS"
entity CARS as ": CARS"

autonumber

KhachHang -> LichHenCaNhanUI : chonTheoDoiLichHen()
activate LichHenCaNhanUI
LichHenCaNhanUI -> XacThucController : layNguoiDungHienTai()
activate XacThucController
XacThucController --> LichHenCaNhanUI : returnThongTinNguoiDung()
deactivate XacThucController

LichHenCaNhanUI -> LichHenController : layDanhSachLichHenTheoNguoiDung(userId)
activate LichHenController
LichHenController -> APPOINTMENTS : truyVanLichHenTheoUserId()
activate APPOINTMENTS
APPOINTMENTS --> LichHenController : returnDanhSachLichHen()
deactivate APPOINTMENTS

LichHenController -> CARS : layThongTinXeLienQuan()
activate CARS
CARS --> LichHenController : returnThongTinXe()
deactivate CARS

LichHenController --> LichHenCaNhanUI : returnKetQua()
deactivate LichHenController
LichHenCaNhanUI -> LichHenCaNhanUI : hienThiDanhSachLichHen()
deactivate LichHenCaNhanUI
@enduml"""

# 9. Chat (Chat)
puml_diagrams["seq_09_Chat.svg"] = """@startuml
skinparam style strictuml
skinparam monochrome true
skinparam shadowing false
skinparam sequenceMessageAlign center
skinparam responseMessageBelowArrow true

actor NguoiDung as ": NguoiDung"
boundary ChatUI as ": ChatUI"
control ChatController as ": ChatController"
entity CHAT_MESSAGES as ": CHAT_MESSAGES"

autonumber

NguoiDung -> ChatUI : moCuaSoChat()
activate ChatUI
ChatUI -> ChatController : layLichSuTinNhan(sessionId)
activate ChatController
ChatController -> CHAT_MESSAGES : truyVanTinNhanTheoSession()
activate CHAT_MESSAGES
CHAT_MESSAGES --> ChatController : returnDanhSachTinNhan()
deactivate CHAT_MESSAGES
ChatController --> ChatUI : returnKetQua()
deactivate ChatController
ChatUI -> ChatUI : hienThiLichSuChat()

NguoiDung -> ChatUI : nhapNoiDungTinNhan()
NguoiDung -> ChatUI : kichNutGuiTinNhan()
ChatUI -> ChatController : guiTinNhan(sessionId, sender, text)
activate ChatController
ChatController -> CHAT_MESSAGES : luuTinNhanMoi()
activate CHAT_MESSAGES
CHAT_MESSAGES --> ChatController : returnTinNhanMoi()
deactivate CHAT_MESSAGES
ChatController --> ChatUI : returnKetQua()
deactivate ChatController
ChatUI -> ChatUI : capNhatManHinhChat()
deactivate ChatUI
@enduml"""

# 10. Yêu cầu tư vấn (YeuCauTuVan)
puml_diagrams["seq_10_YeuCauTuVan.svg"] = """@startuml
skinparam style strictuml
skinparam monochrome true
skinparam shadowing false
skinparam sequenceMessageAlign center
skinparam responseMessageBelowArrow true

actor KhachHang as ": KhachHang"
boundary YeuCauTuVanUI as ": YeuCauTuVanUI"
control YeuCauTuVanController as ": YeuCauTuVanController"
entity CONTACT_REQUESTS as ": CONTACT_REQUESTS"
entity CUSTOMERS as ": CUSTOMERS"
entity CUSTOMER_NOTES as ": CUSTOMER_NOTES"
entity NOTIFICATIONS as ": NOTIFICATIONS"

autonumber

KhachHang -> YeuCauTuVanUI : chonYeuCauTuVan()
activate YeuCauTuVanUI
YeuCauTuVanUI -> YeuCauTuVanUI : hienThiFormTuVan()
KhachHang -> YeuCauTuVanUI : nhapThongTinTuVan()
KhachHang -> YeuCauTuVanUI : kichNutGuiYeuCau()
YeuCauTuVanUI -> YeuCauTuVanController : guiYeuCauTuVan()
activate YeuCauTuVanController
YeuCauTuVanController -> CONTACT_REQUESTS : luuYeuCauTuVan()
activate CONTACT_REQUESTS
CONTACT_REQUESTS --> YeuCauTuVanController : returnKetQua()
deactivate CONTACT_REQUESTS
YeuCauTuVanController -> CUSTOMERS : taoHoacCapNhatKhachHangCRM()
YeuCauTuVanController -> CUSTOMER_NOTES : luuGhiChuHeThong()
YeuCauTuVanController -> NOTIFICATIONS : taoThongBaoLeadMoi()
YeuCauTuVanController --> YeuCauTuVanUI : returnKetQua()
deactivate YeuCauTuVanController
YeuCauTuVanUI -> YeuCauTuVanUI : hienThiThongBaoThanhCong()
deactivate YeuCauTuVanUI
@enduml"""

# 11. Quản lý khách hàng CRM (QuanLyKhachHang)
puml_diagrams["seq_11_QuanLyKhachHang.svg"] = """@startuml
skinparam style strictuml
skinparam monochrome true
skinparam shadowing false
skinparam sequenceMessageAlign center
skinparam responseMessageBelowArrow true

actor NhanVien as ": NhanVien_Admin"
boundary QLKhachHangUI as ": QuanLyKhachHangUI"
control QLKhachHangController as ": QuanLyKhachHangController"
entity CUSTOMERS as ": CUSTOMERS"
entity CUSTOMER_NOTES as ": CUSTOMER_NOTES"
entity APPOINTMENTS as ": APPOINTMENTS"
entity CHAT_MESSAGES as ": CHAT_MESSAGES"

autonumber

NhanVien -> QLKhachHangUI : chonQuanLyKhachHang()
activate QLKhachHangUI
QLKhachHangUI -> QLKhachHangController : layDanhSachKhachHang()
activate QLKhachHangController
QLKhachHangController -> CUSTOMERS : truyVanDanhSachKhachHang()
activate CUSTOMERS
CUSTOMERS --> QLKhachHangController : returnDanhSachKhachHang()
deactivate CUSTOMERS
QLKhachHangController --> QLKhachHangUI : returnKetQua()
deactivate QLKhachHangController
QLKhachHangUI -> QLKhachHangUI : hienThiDanhSachKhachHang()

NhanVien -> QLKhachHangUI : chonKhachHang()
QLKhachHangUI -> QLKhachHangController : layChiTietKhachHang(customerId)
activate QLKhachHangController
QLKhachHangController -> CUSTOMERS : layThongTinKhachHang()
QLKhachHangController -> CUSTOMER_NOTES : layGhiChuKhachHang()
QLKhachHangController -> APPOINTMENTS : layLichHenLienQuan()
QLKhachHangController -> CHAT_MESSAGES : layLichSuChat()
QLKhachHangController --> QLKhachHangUI : returnChiTietKhachHang()
deactivate QLKhachHangController
QLKhachHangUI -> QLKhachHangUI : hienThiChiTietKhachHang()
deactivate QLKhachHangUI
@enduml"""

# 12. Quản lý lịch hẹn (QuanLyLichHen)
puml_diagrams["seq_12_QuanLyLichHen.svg"] = """@startuml
skinparam style strictuml
skinparam monochrome true
skinparam shadowing false
skinparam sequenceMessageAlign center
skinparam responseMessageBelowArrow true

actor NhanVien as ": NhanVien_Admin"
boundary QLLichHenUI as ": QuanLyLichHenUI"
control QLLichHenController as ": QuanLyLichHenController"
entity APPOINTMENTS as ": APPOINTMENTS"
entity CARS as ": CARS"
entity NOTIFICATIONS as ": NOTIFICATIONS"
control MAIL as ": MAIL"

autonumber

NhanVien -> QLLichHenUI : chonQuanLyLichHen()
activate QLLichHenUI
QLLichHenUI -> QLLichHenController : layDanhSachLichHen()
activate QLLichHenController
QLLichHenController -> APPOINTMENTS : truyVanDanhSachLichHen()
activate APPOINTMENTS
APPOINTMENTS --> QLLichHenController : returnDanhSachLichHen()
deactivate APPOINTMENTS
QLLichHenController --> QLLichHenUI : returnKetQua()
deactivate QLLichHenController
QLLichHenUI -> QLLichHenUI : hienThiDanhSachLichHen()

NhanVien -> QLLichHenUI : chonCapNhatTrangThai()
QLLichHenUI -> QLLichHenController : capNhatTrangThaiLichHen(id, status)
activate QLLichHenController
QLLichHenController -> APPOINTMENTS : capNhatTrangThai()
QLLichHenController -> CARS : layThongTinXe()
QLLichHenController -> NOTIFICATIONS : taoThongBaoChoKhach()
QLLichHenController -> MAIL : guiEmailNeuCan()
QLLichHenController --> QLLichHenUI : returnKetQua()
deactivate QLLichHenController
QLLichHenUI -> QLLichHenUI : capNhatManHinh()
deactivate QLLichHenUI
@enduml"""

# 13. Quản lý bài viết (QuanLyBaiViet)
puml_diagrams["seq_13_QuanLyBaiViet.svg"] = """@startuml
skinparam style strictuml
skinparam monochrome true
skinparam shadowing false
skinparam sequenceMessageAlign center
skinparam responseMessageBelowArrow true

actor QuanTri as ": QuanTri_NhanVien"
boundary QLBaiVietUI as ": QuanLyBaiVietUI"
control QLBaiVietController as ": QuanLyBaiVietController"
entity POSTS as ": POSTS"
control UPLOADS as ": UPLOADS"

autonumber

QuanTri -> QLBaiVietUI : chonQuanLyBaiViet()
activate QLBaiVietUI
QLBaiVietUI -> QLBaiVietController : layDanhSachBaiViet()
activate QLBaiVietController
QLBaiVietController -> POSTS : truyVanDanhSachBaiViet()
activate POSTS
POSTS --> QLBaiVietController : returnDanhSachBaiViet()
deactivate POSTS
QLBaiVietController --> QLBaiVietUI : returnKetQua()
deactivate QLBaiVietController
QLBaiVietUI -> QLBaiVietUI : hienThiDanhSachBaiViet()

QuanTri -> QLBaiVietUI : nhapThongTinBaiViet()
QuanTri -> QLBaiVietUI : kichNutLuu()
QLBaiVietUI -> QLBaiVietController : luuBaiViet(formData)
activate QLBaiVietController
QLBaiVietController -> UPLOADS : luuAnhDaiDien()
activate UPLOADS
UPLOADS --> QLBaiVietController : returnDuongDanAnh()
deactivate UPLOADS
QLBaiVietController -> POSTS : themHoacCapNhatBaiViet()
activate POSTS
POSTS --> QLBaiVietController : returnKetQuaLuu()
deactivate POSTS
QLBaiVietController --> QLBaiVietUI : returnKetQua()
deactivate QLBaiVietController
QLBaiVietUI -> QLBaiVietUI : hienThiThongBaoThanhCong()
deactivate QLBaiVietUI
@enduml"""

# 14. Thống kê (ThongKe)
puml_diagrams["seq_14_ThongKe.svg"] = """@startuml
skinparam style strictuml
skinparam monochrome true
skinparam shadowing false
skinparam sequenceMessageAlign center
skinparam responseMessageBelowArrow true

actor QuanTri as ": QuanTri_NhanVien"
boundary ThongKeUI as ": ThongKeUI"
control ThongKeController as ": ThongKeController"
entity CARS as ": CARS"
entity CUSTOMERS as ": CUSTOMERS"
entity APPOINTMENTS as ": APPOINTMENTS"
entity CONTACT_REQUESTS as ": CONTACT_REQUESTS"

autonumber

QuanTri -> ThongKeUI : chonThongKe()
activate ThongKeUI
ThongKeUI -> ThongKeController : layThongKeTongQuan()
activate ThongKeController
ThongKeController -> CARS : tinhDoanhThuVaSoXeDaBan()
activate CARS
CARS --> ThongKeController : returnDuLieuXe()
deactivate CARS
ThongKeController -> CUSTOMERS : thongKeKhachHang()
activate CUSTOMERS
CUSTOMERS --> ThongKeController : returnDuLieuKhachHang()
deactivate CUSTOMERS
ThongKeController -> APPOINTMENTS : thongKeLichHen()
activate APPOINTMENTS
APPOINTMENTS --> ThongKeController : returnDuLieuLichHen()
deactivate APPOINTMENTS
ThongKeController -> CONTACT_REQUESTS : thongKeLeadMoi()
activate CONTACT_REQUESTS
CONTACT_REQUESTS --> ThongKeController : returnDuLieuLead()
deactivate CONTACT_REQUESTS
ThongKeController --> ThongKeUI : returnKetQuaThongKe()
deactivate ThongKeController
ThongKeUI -> ThongKeUI : hienThiBieuDoVaBaoCao()
deactivate ThongKeUI
@enduml"""

# 15. Quản lý tài khoản (QuanLyTaiKhoan)
puml_diagrams["seq_15_QuanLyTaiKhoan.svg"] = """@startuml
skinparam style strictuml
skinparam monochrome true
skinparam shadowing false
skinparam sequenceMessageAlign center
skinparam responseMessageBelowArrow true

actor Admin as ": Admin"
boundary QLTaiKhoanUI as ": QuanLyTaiKhoanUI"
control QLTaiKhoanController as ": QuanLyTaiKhoanController"
entity USERS as ": USERS"

autonumber

Admin -> QLTaiKhoanUI : chonQuanLyTaiKhoan()
activate QLTaiKhoanUI
QLTaiKhoanUI -> QLTaiKhoanController : layDanhSachTaiKhoan()
activate QLTaiKhoanController
QLTaiKhoanController -> USERS : truyVanDanhSachTaiKhoan()
activate USERS
USERS --> QLTaiKhoanController : returnDanhSachTaiKhoan()
deactivate USERS
QLTaiKhoanController --> QLTaiKhoanUI : returnKetQua()
deactivate QLTaiKhoanController
QLTaiKhoanUI -> QLTaiKhoanUI : hienThiDanhSachTaiKhoan()

Admin -> QLTaiKhoanUI : chonTaiKhoanVaHanhDong()
QLTaiKhoanUI -> QLTaiKhoanController : capNhatTaiKhoan(userId, action)
activate QLTaiKhoanController
QLTaiKhoanController -> USERS : capNhatTrangThaiHoacVaiTro()
activate USERS
USERS --> QLTaiKhoanController : returnKetQuaCapNhat()
deactivate USERS
QLTaiKhoanController --> QLTaiKhoanUI : returnKetQua()
deactivate QLTaiKhoanController
QLTaiKhoanUI -> QLTaiKhoanUI : capNhatManHinhDanhSach()
deactivate QLTaiKhoanUI
@enduml"""

# 16. Quản lý xe (QuanLyXe)
puml_diagrams["seq_16_QuanLyXe.svg"] = """@startuml
skinparam style strictuml
skinparam monochrome true
skinparam shadowing false
skinparam sequenceMessageAlign center
skinparam responseMessageBelowArrow true

actor QuanTri as ": QuanTri_NhanVien"
boundary QLXeUI as ": QuanLyXeUI"
control QLXeController as ": QuanLyXeController"
entity CARS as ": CARS"
entity CAR_IMAGES as ": CAR_IMAGES"
entity CUSTOMERS as ": CUSTOMERS"
entity AUDIT_LOGS as ": AUDIT_LOGS"
control UPLOADS as ": UPLOADS"

autonumber

QuanTri -> QLXeUI : chonQuanLyXe()
activate QLXeUI
QLXeUI -> QLXeController : layDanhSachXe()
activate QLXeController
QLXeController -> CARS : truyVanDanhSachXe()
activate CARS
CARS --> QLXeController : returnDanhSachXe()
deactivate CARS
QLXeController --> QLXeUI : returnKetQua()
deactivate QLXeController
QLXeUI -> QLXeUI : hienThiDanhSachXe()

QuanTri -> QLXeUI : nhapThongTinXe()
QuanTri -> QLXeUI : kichNutLuuXe()
QLXeUI -> QLXeController : luuThongTinXe(formData)
activate QLXeController
QLXeController -> UPLOADS : luuAnhXe()
activate UPLOADS
UPLOADS --> QLXeController : returnDuongDanAnh()
deactivate UPLOADS
QLXeController -> CARS : themHoacCapNhatXe()
QLXeController -> CAR_IMAGES : luuDanhSachAnhXe()
QLXeController -> CUSTOMERS : capNhatKhachMuaNeuXeDaBan()
QLXeController -> AUDIT_LOGS : ghiNhatKyThaoTac()
QLXeController --> QLXeUI : returnKetQua()
deactivate QLXeController
QLXeUI -> QLXeUI : hienThiThongBaoThanhCong()
deactivate QLXeUI
@enduml"""

# 17. So sánh xe (SoSanhXe)
puml_diagrams["seq_17_SoSanhXe.svg"] = """@startuml
skinparam style strictuml
skinparam monochrome true
skinparam shadowing false
skinparam sequenceMessageAlign center
skinparam responseMessageBelowArrow true

actor KhachHang as ": KhachHang"
boundary SoSanhXeUI as ": SoSanhXeUI"
control XeController as ": XeController"
entity CARS as ": CARS"

autonumber

KhachHang -> SoSanhXeUI : chonXeCanSoSanh(carId1, carId2)
activate SoSanhXeUI
SoSanhXeUI -> XeController : layThongTinSoSanh(carId1, carId2)
activate XeController
XeController -> CARS : layThongTinXe(carId1)
activate CARS
CARS --> XeController : returnThongTinXe1()
deactivate CARS
XeController -> CARS : layThongTinXe(carId2)
activate CARS
CARS --> XeController : returnThongTinXe2()
deactivate CARS
XeController --> SoSanhXeUI : returnDuLieuSoSanh()
deactivate XeController
SoSanhXeUI -> SoSanhXeUI : soSanhVaRenderBang()
SoSanhXeUI --> KhachHang : hienThiBangSoSanh()
deactivate SoSanhXeUI
@enduml"""

# 18. Tính trả góp (TinhTraGop)
puml_diagrams["seq_18_TinhTraGop.svg"] = """@startuml
skinparam style strictuml
skinparam monochrome true
skinparam shadowing false
skinparam sequenceMessageAlign center
skinparam responseMessageBelowArrow true

actor KhachHang as ": KhachHang"
boundary TinhTraGopUI as ": TinhTraGopUI"
control LoanController as ": LoanController"
entity CARS as ": CARS"

autonumber

KhachHang -> TinhTraGopUI : chonXeCanTinhGop(carId)
activate TinhTraGopUI
TinhTraGopUI -> LoanController : layGiaXe(carId)
activate LoanController
LoanController -> CARS : layGiaXe(carId)
activate CARS
CARS --> LoanController : returnGiaXe()
deactivate CARS
LoanController --> TinhTraGopUI : returnGiaXe()
deactivate LoanController
TinhTraGopUI -> TinhTraGopUI : hienThiFormVaGiaGoc()

KhachHang -> TinhTraGopUI : nhapThongSo(traTruoc, laiSuat, kyHan)
KhachHang -> TinhTraGopUI : clickTinhToan()
TinhTraGopUI -> LoanController : tinhTraGop(giaXe, traTruoc, laiSuat, kyHan)
activate LoanController
LoanController -> LoanController : tinhLaiSuatVaLichTraNo()
LoanController --> TinhTraGopUI : returnKetQuaTraGop()
deactivate LoanController
TinhTraGopUI -> TinhTraGopUI : hienThiBangTinhLaiSuat()
deactivate TinhTraGopUI
@enduml"""

# 19. Chat AI (ChatAI)
puml_diagrams["seq_19_ChatAI.svg"] = """@startuml
skinparam style strictuml
skinparam monochrome true
skinparam shadowing false
skinparam sequenceMessageAlign center
skinparam responseMessageBelowArrow true

actor KhachHang as ": KhachHang"
boundary ChatWindowUI as ": ChatWindowUI"
control AIChatController as ": AIChatController"
control GeminiAI as ": GeminiAI"
entity CARS as ": CARS"
entity CHAT_MESSAGES as ": CHAT_MESSAGES"

autonumber

KhachHang -> ChatWindowUI : moChatAI()
activate ChatWindowUI
KhachHang -> ChatWindowUI : nhapCauHoi(message)
ChatWindowUI -> AIChatController : aiChatAction(message, sessionId)
activate AIChatController
AIChatController -> CARS : layDanhSachXe()
activate CARS
CARS --> AIChatController : returnDanhSachXe()
deactivate CARS
AIChatController -> GeminiAI : generateContent(prompt)
activate GeminiAI
GeminiAI --> AIChatController : returnPhanHoi(aiResponse)
deactivate GeminiAI
AIChatController -> CHAT_MESSAGES : luuTinNhan(message, aiResponse)
activate CHAT_MESSAGES
CHAT_MESSAGES --> AIChatController : returnXacNhan()
deactivate CHAT_MESSAGES
AIChatController --> ChatWindowUI : returnPhanHoiAI()
deactivate AIChatController
ChatWindowUI -> ChatWindowUI : renderTinNhan()
deactivate ChatWindowUI
@enduml"""


# ========================================================
# PLANTUML CODES FOR 16 ANALYSIS CLASS DIAGRAMS (BCE)
# ========================================================

# 1. Đăng ký tài khoản (DangKy)
puml_diagrams["class_01_DangKy.svg"] = """@startuml
skinparam monochrome true
skinparam shadowing false
skinparam classAttributeIconSize 0

class DangKyUI <<boundary>> {
  +chonDangKy()
  +hienThiManHinhDangKy()
  +nhapThongTinDangKy()
  +kichNutDangKy()
  +hienThiThongBaoThanhCong()
}

class DangKyController <<control>> {
  +guiThongTinDangKy()
  +kiemTraEmailTonTai()
  +luuTaiKhoanMoi()
}

class USERS <<entity>> {
  -id : VARCHAR(36)
  -full_name : VARCHAR(255)
  -email : VARCHAR(255)
  -phone : VARCHAR(50)
  -password : VARCHAR(255)
  -role : ENUM
  -status : ENUM
  +getId()
  +setId(id)
  +getFullName()
  +setFullName(name)
  +getEmail()
  +setEmail(email)
  +getPassword()
  +setPassword(pass)
}

DangKyUI "1" - "1" DangKyController : gui yeu cau >
DangKyController "1" - "n" USERS : truy van & luu >
@enduml"""

# 2. Đăng nhập (DangNhap)
puml_diagrams["class_02_DangNhap.svg"] = """@startuml
skinparam monochrome true
skinparam shadowing false
skinparam classAttributeIconSize 0

class DangNhapUI <<boundary>> {
  +chonIconNguoiDung()
  +hienThiManHinhDangNhap()
  +nhapEmailMatKhau()
  +kichNutDangNhap()
  +hienThiManHinhTheoVaiTro()
}

class DangNhapController <<control>> {
  +layThongTinTaiKhoan(email, password)
  +kiemTraMatKhau()
}

class USERS <<entity>> {
  -id : VARCHAR(36)
  -email : VARCHAR(255)
  -password : VARCHAR(255)
  -role : ENUM
  -status : ENUM
  +getEmail()
  +getPassword()
  +getRole()
}

DangNhapUI "1" - "1" DangNhapController
DangNhapController "1" - "n" USERS
@enduml"""

# 3. Xem chi tiết xe (XemChiTiet)
puml_diagrams["class_03_XemChiTiet.svg"] = """@startuml
skinparam monochrome true
skinparam shadowing false
skinparam classAttributeIconSize 0

class DanhSachXeUI <<boundary>> {
  +chonXeCanXem()
}

class ChiTietXeUI <<boundary>> {
  +hienThiManHinhChiTietXe()
}

class XeController <<control>> {
  +layThongTinChiTietXe(carId)
  +layThongTinXe()
  +layDanhSachAnh()
  +layDanhGiaXe()
}

class CARS <<entity>> {
  -id : VARCHAR(36)
  -title : VARCHAR(255)
  -brand : VARCHAR(100)
  -price : BIGINT
  -year : INT
  -views : INT
}

class CAR_IMAGES <<entity>> {
  -id : VARCHAR(36)
  -car_id : VARCHAR(36)
  -image_url : TEXT
}

class CAR_REVIEWS <<entity>> {
  -id : VARCHAR(36)
  -car_id : VARCHAR(36)
  -rating : INT
  -content : TEXT
}

DanhSachXeUI "1" - "1" XeController
ChiTietXeUI "1" - "1" XeController
XeController "1" - "n" CARS
XeController "1" - "n" CAR_IMAGES
XeController "1" - "n" CAR_REVIEWS
@enduml"""

# 4. Xem tin tức (XemTinTuc)
puml_diagrams["class_04_XemTinTuc.svg"] = """@startuml
skinparam monochrome true
skinparam shadowing false
skinparam classAttributeIconSize 0

class TinTucUI <<boundary>> {
  +chonMenuTinTuc()
  +hienThiDanhSachTinTuc()
  +chonBaiViet()
  +hienThiChiTietTinTuc()
}

class TinTucController <<control>> {
  +layDanhSachTinTuc()
  +layChiTietBaiViet(slug)
}

class POSTS <<entity>> {
  -id : VARCHAR(36)
  -title : VARCHAR(255)
  -content : TEXT
  -slug : VARCHAR(255)
  -status : ENUM
  +getTitle()
  +getContent()
  +getSlug()
}

TinTucUI "1" - "1" TinTucController
TinTucController "1" - "n" POSTS
@enduml"""

# 5. Đặt lịch xem xe (DatLich)
puml_diagrams["class_05_DatLich.svg"] = """@startuml
skinparam monochrome true
skinparam shadowing false
skinparam classAttributeIconSize 0

class DatLichUI <<boundary>> {
  +chonXeVaChonDatLich()
  +hienThiFormDatLich()
  +nhapThongTinVaChonNgayGio()
  +kichNutGuiDatLich()
  +hienThiThongBaoDatLichThanhCong()
}

class LichHenController <<control>> {
  +kiemTraKhungGio(date, time)
  +taoLichHen()
  +taoHoacCapNhatKhachHangCRM()
  +taoThongBaoLichHenMoi()
}

class APPOINTMENTS <<entity>> {
  -id : VARCHAR(36)
  -car_id : VARCHAR(36)
  -customer_name : VARCHAR(255)
  -customer_phone : VARCHAR(50)
  -appointment_date : TIMESTAMP
  -status : ENUM
}

class CUSTOMERS <<entity>> {
  -id : VARCHAR(36)
  -full_name : VARCHAR(255)
  -phone : VARCHAR(50)
  -stage : ENUM
}

class NOTIFICATIONS <<entity>> {
  -id : VARCHAR(36)
  -title : VARCHAR(255)
  -content : TEXT
}

DatLichUI "1" - "1" LichHenController
LichHenController "1" - "n" APPOINTMENTS
LichHenController "1" - "n" CUSTOMERS
LichHenController "1" - "n" NOTIFICATIONS
@enduml"""

# 6. Cập nhật hồ sơ cá nhân (CapNhatHoSoCaNhan)
puml_diagrams["class_06_CapNhatHoSoCaNhan.svg"] = """@startuml
skinparam monochrome true
skinparam shadowing false
skinparam classAttributeIconSize 0

class HoSoUI <<boundary>> {
  +chonHoSoCaNhan()
  +hienThiFormHoSo()
  +capNhatThongTin()
  +kichNutLuu()
  +hienThiThongBaoThanhCong()
}

class XacThucController <<control>> {
  +layNguoiDungHienTai()
}

class HoSoController <<control>> {
  +guiThongTinCapNhat()
}

class USERS <<entity>> {
  -id : VARCHAR(36)
  -full_name : VARCHAR(255)
  -phone : VARCHAR(50)
  -password : VARCHAR(255)
}

HoSoUI "1" -- "1" XacThucController
HoSoUI "1" -- "1" HoSoController
XacThucController "1" -- "n" USERS
HoSoController "1" -- "n" USERS
@enduml"""

# 7. Liên hệ (LienHe)
puml_diagrams["class_07_LienHe.svg"] = """@startuml
skinparam monochrome true
skinparam shadowing false
skinparam classAttributeIconSize 0

class LienHeUI <<boundary>> {
  +chonMenuLienHe()
  +hienThiFormLienHe()
  +nhapThongTinLienHe()
  +kichNutGui()
  +hienThiThongBaoGuiThanhCong()
}

class LienHeController <<control>> {
  +guiYeuCauLienHe()
  +luuYeuCauLienHe()
  +taoHoacCapNhatKhachHang()
  +taoThongBaoChoAdmin()
  +guiEmailXacNhan()
}

class CONTACT_REQUESTS <<entity>> {
  -id : VARCHAR(36)
  -full_name : VARCHAR(255)
  -phone : VARCHAR(50)
  -consultation_type : VARCHAR(100)
  -stage : ENUM
}

class CUSTOMERS <<entity>> {
  -id : VARCHAR(36)
  -full_name : VARCHAR(255)
  -phone : VARCHAR(50)
  -email : VARCHAR(255)
}

class NOTIFICATIONS <<entity>> {
  -id : VARCHAR(36)
  -content : TEXT
}

LienHeUI "1" - "1" LienHeController
LienHeController "1" - "n" CONTACT_REQUESTS
LienHeController "1" - "n" CUSTOMERS
LienHeController "1" - "n" NOTIFICATIONS
@enduml"""

# 8. Theo dõi lịch hẹn cá nhân (TheoDoiLichHen)
puml_diagrams["class_08_TheoDoiLichHen.svg"] = """@startuml
skinparam monochrome true
skinparam shadowing false
skinparam classAttributeIconSize 0

class LichHenCaNhanUI <<boundary>> {
  +chonTheoDoiLichHen()
  +hienThiDanhSachLichHen()
}

class XacThucController <<control>> {
  +layNguoiDungHienTai()
}

class LichHenController <<control>> {
  +layDanhSachLichHenTheoNguoiDung(userId)
}

class APPOINTMENTS <<entity>> {
  -id : VARCHAR(36)
  -user_id : VARCHAR(36)
  -appointment_date : TIMESTAMP
  -status : ENUM
}

class CARS <<entity>> {
  -id : VARCHAR(36)
  -title : VARCHAR(255)
  -price : BIGINT
}

LichHenCaNhanUI "1" - "1" XacThucController
LichHenCaNhanUI "1" - "1" LichHenController
XacThucController "1" - "n" APPOINTMENTS
LichHenController "1" - "n" APPOINTMENTS
LichHenController "1" - "n" CARS
@enduml"""

# 9. Chat (Chat)
puml_diagrams["class_09_Chat.svg"] = """@startuml
skinparam monochrome true
skinparam shadowing false
skinparam classAttributeIconSize 0

class ChatUI <<boundary>> {
  +moCuaSoChat()
  +hienThiLichSuChat()
  +nhapNoiDungTinNhan()
  +kichNutGuiTinNhan()
  +capNhatManHinhChat()
}

class ChatController <<control>> {
  +layLichSuTinNhan(sessionId)
  +guiTinNhan(sessionId, sender, text)
}

class CHAT_MESSAGES <<entity>> {
  -id : VARCHAR(36)
  -session_id : VARCHAR(50)
  -sender_role : ENUM
  -sender_name : VARCHAR(255)
  -message_text : TEXT
  +getSessionId()
  +getSenderRole()
  +getMessageText()
}

ChatUI "1" - "1" ChatController
ChatController "1" - "n" CHAT_MESSAGES
@enduml"""

# 10. Yêu cầu tư vấn (YeuCauTuVan)
puml_diagrams["class_10_YeuCauTuVan.svg"] = """@startuml
skinparam monochrome true
skinparam shadowing false
skinparam classAttributeIconSize 0

class YeuCauTuVanUI <<boundary>> {
  +chonYeuCauTuVan()
  +hienThiFormTuVan()
  +nhapThongTinTuVan()
  +kichNutGuiYeuCau()
  +hienThiThongBaoThanhCong()
}

class YeuCauTuVanController <<control>> {
  +guiYeuCauTuVan()
  +luuYeuCauTuVan()
  +taoHoacCapNhatKhachHangCRM()
  +luuGhiChuHeThong()
  +taoThongBaoLeadMoi()
}

class CONTACT_REQUESTS <<entity>> {
  -id : VARCHAR(36)
  -full_name : VARCHAR(255)
  -phone : VARCHAR(50)
  -stage : ENUM
}

class CUSTOMERS <<entity>> {
  -id : VARCHAR(36)
  -full_name : VARCHAR(255)
  -stage : ENUM
}

class CUSTOMER_NOTES <<entity>> {
  -id : VARCHAR(36)
  -content : TEXT
}

class NOTIFICATIONS <<entity>> {
  -id : VARCHAR(36)
  -content : TEXT
}

YeuCauTuVanUI "1" - "1" YeuCauTuVanController
YeuCauTuVanController "1" - "n" CONTACT_REQUESTS
YeuCauTuVanController "1" - "n" CUSTOMERS
YeuCauTuVanController "1" - "n" CUSTOMER_NOTES
YeuCauTuVanController "1" - "n" NOTIFICATIONS
@enduml"""

# 11. Quản lý khách hàng CRM (QuanLyKhachHang)
puml_diagrams["class_11_QuanLyKhachHang.svg"] = """@startuml
skinparam monochrome true
skinparam shadowing false
skinparam classAttributeIconSize 0

class QLKhachHangUI <<boundary>> {
  +chonQuanLyKhachHang()
  +hienThiDanhSachKhachHang()
  +chonKhachHang()
  +hienThiChiTietKhachHang()
}

class QLKhachHangController <<control>> {
  +layDanhSachKhachHang()
  +layChiTietKhachHang(customerId)
}

class CUSTOMERS <<entity>> {
  -id : VARCHAR(36)
  -full_name : VARCHAR(255)
  -phone : VARCHAR(50)
  -stage : ENUM
}

class CUSTOMER_NOTES <<entity>> {
  -id : VARCHAR(36)
  -customer_id : VARCHAR(36)
  -content : TEXT
}

class APPOINTMENTS <<entity>> {
  -id : VARCHAR(36)
  -appointment_date : TIMESTAMP
  -status : ENUM
}

class CHAT_MESSAGES <<entity>> {
  -id : VARCHAR(36)
  -message_text : TEXT
}

QLKhachHangUI "1" - "1" QLKhachHangController
QLKhachHangController "1" - "n" CUSTOMERS
QLKhachHangController "1" - "n" CUSTOMER_NOTES
QLKhachHangController "1" - "n" APPOINTMENTS
QLKhachHangController "1" - "n" CHAT_MESSAGES
@enduml"""

# 12. Quản lý lịch hẹn (QuanLyLichHen)
puml_diagrams["class_12_QuanLyLichHen.svg"] = """@startuml
skinparam monochrome true
skinparam shadowing false
skinparam classAttributeIconSize 0

class QLLichHenUI <<boundary>> {
  +chonQuanLyLichHen()
  +hienThiDanhSachLichHen()
  +chonCapNhatTrangThai()
  +capNhatManHinh()
}

class QLLichHenController <<control>> {
  +layDanhSachLichHen()
  +capNhatTrangThaiLichHen(id, status)
}

class APPOINTMENTS <<entity>> {
  -id : VARCHAR(36)
  -status : ENUM
}

class CARS <<entity>> {
  -id : VARCHAR(36)
  -title : VARCHAR(255)
}

class NOTIFICATIONS <<entity>> {
  -id : VARCHAR(36)
  -content : TEXT
}

QLLichHenUI "1" - "1" QLLichHenController
QLLichHenController "1" - "n" APPOINTMENTS
QLLichHenController "1" - "n" CARS
QLLichHenController "1" - "n" NOTIFICATIONS
@enduml"""

# 13. Quản lý bài viết (QuanLyBaiViet)
puml_diagrams["class_13_QuanLyBaiViet.svg"] = """@startuml
skinparam monochrome true
skinparam shadowing false
skinparam classAttributeIconSize 0

class QLBaiVietUI <<boundary>> {
  +chonQuanLyBaiViet()
  +hienThiDanhSachBaiViet()
  +nhapThongTinBaiViet()
  +kichNutLuu()
  +hienThiThongBaoThanhCong()
}

class QLBaiVietController <<control>> {
  +layDanhSachBaiViet()
  +luuBaiViet(formData)
}

class POSTS <<entity>> {
  -id : VARCHAR(36)
  -title : VARCHAR(255)
  -content : TEXT
  -status : ENUM
}

QLBaiVietUI "1" - "1" QLBaiVietController
QLBaiVietController "1" - "n" POSTS
@enduml"""

# 14. Thống kê (ThongKe)
puml_diagrams["class_14_ThongKe.svg"] = """@startuml
skinparam monochrome true
skinparam shadowing false
skinparam classAttributeIconSize 0

class ThongKeUI <<boundary>> {
  +chonThongKe()
  +hienThiBieuDoVaBaoCao()
}

class ThongKeController <<control>> {
  +layThongKeTongQuan()
}

class CARS <<entity>> {
  -id : VARCHAR(36)
  -price : BIGINT
  -status : ENUM
}

class CUSTOMERS <<entity>> {
  -id : VARCHAR(36)
  -stage : ENUM
}

class APPOINTMENTS <<entity>> {
  -id : VARCHAR(36)
  -status : ENUM
}

class CONTACT_REQUESTS <<entity>> {
  -id : VARCHAR(36)
  -stage : ENUM
}

ThongKeUI "1" - "1" ThongKeController
ThongKeController "1" - "n" CARS
ThongKeController "1" - "n" CUSTOMERS
ThongKeController "1" - "n" APPOINTMENTS
ThongKeController "1" - "n" CONTACT_REQUESTS
@enduml"""

# 15. Quản lý tài khoản (QuanLyTaiKhoan)
puml_diagrams["class_15_QuanLyTaiKhoan.svg"] = """@startuml
skinparam monochrome true
skinparam shadowing false
skinparam classAttributeIconSize 0

class QLTaiKhoanUI <<boundary>> {
  +chonQuanLyTaiKhoan()
  +hienThiDanhSachTaiKhoan()
  +chonTaiKhoanVaHanhDong()
  +capNhatManHinhDanhSach()
}

class QLTaiKhoanController <<control>> {
  +layDanhSachTaiKhoan()
  +capNhatTaiKhoan(userId, action)
}

class USERS <<entity>> {
  -id : VARCHAR(36)
  -email : VARCHAR(255)
  -role : ENUM
  -status : ENUM
}

QLTaiKhoanUI "1" - "1" QLTaiKhoanController
QLTaiKhoanController "1" - "n" USERS
@enduml"""

# 16. Quản lý xe (QuanLyXe)
puml_diagrams["class_16_QuanLyXe.svg"] = """@startuml
skinparam monochrome true
skinparam shadowing false
skinparam classAttributeIconSize 0

class QLXeUI <<boundary>> {
  +chonQuanLyXe()
  +hienThiDanhSachXe()
  +nhapThongTinXe()
  +kichNutLuuXe()
  +hienThiThongBaoThanhCong()
}

class QLXeController <<control>> {
  +layDanhSachXe()
  +luuThongTinXe(formData)
}

class CARS <<entity>> {
  -id : VARCHAR(36)
  -title : VARCHAR(255)
  -brand : VARCHAR(100)
  -price : BIGINT
}

class CAR_IMAGES <<entity>> {
  -id : VARCHAR(36)
  -image_url : TEXT
}

QLXeUI "1" - "1" QLXeController
QLXeController "1" - "n" CARS
QLXeController "1" - "n" CAR_IMAGES
@enduml"""

# 17. So sánh xe (SoSanhXe)
puml_diagrams["class_17_SoSanhXe.svg"] = """@startuml
skinparam monochrome true
skinparam shadowing false
skinparam classAttributeIconSize 0

class SoSanhXeUI <<boundary>> {
  +chonXeCanSoSanh()
  +soSanhVaRenderBang()
  +hienThiBangSoSanh()
}

class XeController <<control>> {
  +layThongTinSoSanh(carId1, carId2)
  +layThongTinXe(carId)
}

class CARS <<entity>> {
  -id : VARCHAR(36)
  -title : VARCHAR(255)
  -price : BIGINT
  -brand : VARCHAR(100)
}

SoSanhXeUI "1" - "1" XeController
XeController "1" - "n" CARS
@enduml"""

# 18. Tính trả góp (TinhTraGop)
puml_diagrams["class_18_TinhTraGop.svg"] = """@startuml
skinparam monochrome true
skinparam shadowing false
skinparam classAttributeIconSize 0

class TinhTraGopUI <<boundary>> {
  +chonXeCanTinhGop()
  +nhapThongSo()
  +clickTinhToan()
  +hienThiBangTinhLaiSuat()
}

class LoanController <<control>> {
  +layGiaXe(carId)
  +tinhTraGop(giaXe, traTruoc, laiSuat, kyHan)
  -tinhLaiSuatVaLichTraNo()
}

class CARS <<entity>> {
  -id : VARCHAR(36)
  -price : BIGINT
}

TinhTraGopUI "1" - "1" LoanController
LoanController "1" - "n" CARS
@enduml"""

# 19. Chat AI (ChatAI)
puml_diagrams["class_19_ChatAI.svg"] = """@startuml
skinparam monochrome true
skinparam shadowing false
skinparam classAttributeIconSize 0

class ChatWindowUI <<boundary>> {
  +moChatAI()
  +nhapCauHoi()
  +renderTinNhan()
}

class AIChatController <<control>> {
  +aiChatAction(message, sessionId)
}

class GeminiAI <<control>> {
  +generateContent(prompt)
}

class CARS <<entity>> {
  -id : VARCHAR(36)
  -title : VARCHAR(255)
  -price : BIGINT
  -status : ENUM
}

class CHAT_MESSAGES <<entity>> {
  -id : VARCHAR(36)
  -session_id : VARCHAR(50)
  -sender_role : ENUM
  -message_text : TEXT
}

ChatWindowUI "1" - "1" AIChatController
AIChatController "1" - "1" GeminiAI
AIChatController "1" - "n" CARS
AIChatController "1" - "n" CHAT_MESSAGES
@enduml"""


# ========================================================
# EXECUTION MAIN FUNCTION
# ========================================================
def main():
    print("Generating SVG diagrams for all 19 use cases (Sequence + Analysis Class)...")
    total = len(puml_diagrams)
    success = 0
    
    for idx, (filename, puml_content) in enumerate(puml_diagrams.items(), start=1):
        out_path = OUT_DIR / filename
        print(f"[{idx}/{total}] Compiling {filename}...", end=" ", flush=True)
        
        ok = download_svg(puml_content, out_path)
        if ok:
            print("SUCCESS")
            success += 1
        else:
            print("FAILED")
        
        # Add a small delay to be gentle with the public PlantUML server
        time.sleep(0.3)
        
    print(f"\nAll SVGs updated successfully! {success}/{total} compiled to {OUT_DIR.absolute()}")

if __name__ == "__main__":
    main()
