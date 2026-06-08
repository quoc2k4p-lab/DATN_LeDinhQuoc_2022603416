import os
import zlib
import base64
import string
import urllib.request
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT_DIR = ROOT / ".screenshots"
os.makedirs(OUT_DIR, exist_ok=True)

def plantuml_encode(plantuml_text):
    plantuml_alphabet = string.digits + string.ascii_uppercase + string.ascii_lowercase + '-_'
    base64_alphabet = string.ascii_uppercase + string.ascii_lowercase + string.digits + '+/'
    b64_to_plantuml = bytes.maketrans(base64_alphabet.encode('utf-8'), plantuml_alphabet.encode('utf-8'))
    
    # Compress using raw deflate
    zlibbed_str = zlib.compress(plantuml_text.encode('utf-8'))
    compressed_string = zlibbed_str[2:-4]
    
    return base64.b64encode(compressed_string).translate(b64_to_plantuml).decode('utf-8')

def download_png(puml_text, output_path):
    try:
        encoded = plantuml_encode(puml_text)
        url = f"http://www.plantuml.com/plantuml/png/{encoded}"
        
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        
        with urllib.request.urlopen(req, timeout=20) as response:
            png_data = response.read()
            with open(output_path, 'wb') as f:
                f.write(png_data)
        return True
    except Exception as e:
        print(f"Error downloading {output_path}: {e}")
        return False

# ========================================================
# PLANTUML CODES FOR ALL GRADUATION REPORT DIAGRAMS
# ========================================================
puml_diagrams = {}

# 1. Overall Use Case Diagram
puml_diagrams["uc_general.png"] = """@startuml
skinparam style strictuml
skinparam monochrome true
skinparam shadowing false
left to right direction
skinparam actorStyle awesome

actor "Khách hàng" as cust
actor "Nhân viên" as staff
actor "Quản trị viên" as admin

rectangle "Hệ thống Showroom TQ Auto" {
  usecase "Đăng ký & Đăng nhập" as uc_auth
  usecase "Xem xe & Lọc tìm kiếm" as uc_view
  usecase "Xem chi tiết xe" as uc_detail
  usecase "Đặt lịch xem xe" as uc_book
  usecase "Gửi thông tin tư vấn" as uc_contact
  usecase "Quản lý xe ô tô" as uc_manage_car
  usecase "Quản lý khách hàng CRM" as uc_crm
  usecase "Quản lý lịch hẹn" as uc_manage_appts
  usecase "Xem báo cáo thống kê" as uc_stats
}

cust --> uc_auth
cust --> uc_view
cust --> uc_detail
cust --> uc_book
cust --> uc_contact

staff --> uc_auth
staff --> uc_contact
staff --> uc_crm
staff --> uc_manage_appts

admin --> uc_auth
admin --> uc_manage_car
admin --> uc_crm
admin --> uc_manage_appts
admin --> uc_stats
@enduml"""

# 2. Use Case Sub-diagrams
puml_diagrams["uc_login.png"] = r"""@startuml
skinparam style strictuml
skinparam monochrome true
skinparam shadowing false
left to right direction
skinparam actorStyle awesome
actor "Người dùng" as user
rectangle "Phân hệ Đăng nhập" {
  usecase "Đăng nhập\n(F04)" as uc_login
  usecase "Quên mật khẩu" as uc_forgot
  usecase "Đổi mật khẩu" as uc_change
  uc_forgot ..> uc_login : <<extend>>
  uc_change ..> uc_login : <<extend>>
}
user --> uc_login
@enduml"""

puml_diagrams["uc_view_car.png"] = r"""@startuml
skinparam style strictuml
skinparam monochrome true
skinparam shadowing false
left to right direction
skinparam actorStyle awesome
actor "Khách hàng" as cust
rectangle "Phân hệ Tra cứu & Lọc xe" {
  usecase "Xem danh sách xe\n(F01)" as uc_browse
  usecase "Tìm kiếm & Lọc xe\n(F02)" as uc_filter
  usecase "Xem chi tiết xe\n(F03)" as uc_detail
  uc_filter ..> uc_browse : <<extend>>
  uc_browse ..> uc_detail : <<include>>
}
cust --> uc_browse
@enduml"""

puml_diagrams["uc_appointment.png"] = r"""@startuml
skinparam style strictuml
skinparam monochrome true
skinparam shadowing false
left to right direction
skinparam actorStyle awesome
actor "Khách hàng" as cust
rectangle "Phân hệ Đặt lịch xem xe" {
  usecase "Đặt lịch xem xe\n(F05)" as uc_book
  usecase "Hủy lịch hẹn" as uc_cancel
  uc_cancel ..> uc_book : <<extend>>
}
cust --> uc_book
@enduml"""

puml_diagrams["uc_manage_car.png"] = r"""@startuml
skinparam style strictuml
skinparam monochrome true
skinparam shadowing false
left to right direction
skinparam actorStyle awesome
actor "Quản trị viên" as admin
rectangle "Phân hệ Quản lý xe" {
  usecase "Quản lý xe\n(F06)" as uc_manage
  usecase "Thêm xe mới" as uc_add
  usecase "Sửa đổi xe" as uc_edit
  usecase "Xóa xe" as uc_delete
  uc_manage ..> uc_add : <<include>>
  uc_manage ..> uc_edit : <<include>>
  uc_manage ..> uc_delete : <<include>>
}
admin --> uc_manage
@enduml"""

puml_diagrams["uc_crm.png"] = r"""@startuml
skinparam style strictuml
skinparam monochrome true
skinparam shadowing false
left to right direction
skinparam actorStyle awesome
actor "Nhân viên" as staff
rectangle "Phân hệ Quản lý CRM" {
  usecase "Quản lý CRM\n(F07)" as uc_crm
  usecase "Cập nhật tiến trình" as uc_update
  usecase "Thêm ghi chú CSKH" as uc_note
  uc_crm ..> uc_update : <<include>>
  uc_crm ..> uc_note : <<include>>
}
staff --> uc_crm
@enduml"""

puml_diagrams["uc_lead.png"] = r"""@startuml
skinparam style strictuml
skinparam monochrome true
skinparam shadowing false
left to right direction
skinparam actorStyle awesome
actor "Nhân viên" as staff
rectangle "Phân hệ Quản lý Lead" {
  usecase "Quản lý Lead\n(F08)" as uc_lead
  usecase "Tiếp nhận yêu cầu" as uc_receive
  usecase "Phân phối nhân viên" as uc_assign
  uc_lead ..> uc_receive : <<include>>
  uc_lead ..> uc_assign : <<include>>
}
staff --> uc_lead
@enduml"""

puml_diagrams["uc_chat.png"] = r"""@startuml
skinparam style strictuml
skinparam monochrome true
skinparam shadowing false
left to right direction
skinparam actorStyle awesome
actor "Người dùng" as user
rectangle "Phân hệ Chat trực tuyến" {
  usecase "Chat trực tuyến\n(F10)" as uc_chat
  usecase "Gửi tin nhắn" as uc_send
  usecase "Nhận tin nhắn" as uc_receive
  uc_chat ..> uc_send : <<include>>
  uc_chat ..> uc_receive : <<include>>
}
user --> uc_chat
@enduml"""

puml_diagrams["uc_analytics.png"] = r"""@startuml
skinparam style strictuml
skinparam monochrome true
skinparam shadowing false
left to right direction
skinparam actorStyle awesome
actor "Quản trị viên" as admin
rectangle "Phân hệ Thống kê báo cáo" {
  usecase "Xem báo cáo\n(F11)" as uc_stats
  usecase "Thống kê doanh thu" as uc_rev
  usecase "Thống kê tồn kho" as uc_inv
  uc_stats ..> uc_rev : <<include>>
  uc_stats ..> uc_inv : <<include>>
}
admin --> uc_stats
@enduml"""

puml_diagrams["uc_news.png"] = r"""@startuml
skinparam style strictuml
skinparam monochrome true
skinparam shadowing false
left to right direction
skinparam actorStyle awesome
actor "Quản trị viên" as admin
rectangle "Phân hệ Quản lý tin tức" {
  usecase "Quản lý bài viết\n(F12)" as uc_posts
  usecase "Thêm bài viết" as uc_add_post
  usecase "Chỉnh sửa nháp" as uc_edit_post
  uc_posts ..> uc_add_post : <<include>>
  uc_posts ..> uc_edit_post : <<include>>
}
admin --> uc_posts
@enduml"""

puml_diagrams["uc_profile.png"] = """@startuml
skinparam style strictuml
skinparam monochrome true
skinparam shadowing false
left to right direction
skinparam actorStyle awesome
actor "Người dùng" as user
rectangle "Phân hệ Hồ sơ cá nhân" {
  usecase "Hồ sơ cá nhân" as uc_profile
  usecase "Xem thông tin" as uc_view
  usecase "Cập nhật hồ sơ" as uc_update
  uc_profile ..> uc_view : <<include>>
  uc_profile ..> uc_update : <<include>>
}
user --> uc_profile
@enduml"""


# 3. Sequence Diagrams (BCE in Vietnamese)
puml_diagrams["seq_register.png"] = """@startuml
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

puml_diagrams["seq_login.png"] = """@startuml
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

puml_diagrams["seq_search_cars.png"] = """@startuml
skinparam style strictuml
skinparam monochrome true
skinparam shadowing false
skinparam sequenceMessageAlign center
skinparam responseMessageBelowArrow true

actor KhachHang as ": KhachHang"
boundary CarsPage as ": CarsPage"
control CarActions as ": CarActions"
entity DbCar as ": DbCar"

autonumber

KhachHang -> CarsPage : nhapTuKhoaVaBoLoc(brand, priceRange)
activate CarsPage
CarsPage -> CarActions : layDanhSachXe(filters)
activate CarActions
CarActions -> DbCar : truyVanDanhSachXe(filters)
activate DbCar
DbCar --> CarActions : returnDanhSachXe()
deactivate DbCar
CarActions --> CarsPage : returnKetQua()
deactivate CarActions
CarsPage -> CarsPage : hienThiDanhSachXe()
deactivate CarsPage
@enduml"""

puml_diagrams["seq_view_car.png"] = """@startuml
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

puml_diagrams["seq_view_posts.png"] = """@startuml
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

puml_diagrams["seq_appointment.png"] = """@startuml
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

puml_diagrams["seq_update_profile.png"] = """@startuml
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

puml_diagrams["seq_submit_consultation.png"] = """@startuml
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

puml_diagrams["seq_view_bookings.png"] = """@startuml
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

puml_diagrams["seq_customer_chat.png"] = """@startuml
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

puml_diagrams["seq_submit_lead.png"] = """@startuml
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

puml_diagrams["seq_crm.png"] = """@startuml
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

puml_diagrams["seq_manage_appts.png"] = """@startuml
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

puml_diagrams["seq_manage_posts.png"] = """@startuml
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

puml_diagrams["seq_analytics.png"] = """@startuml
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

puml_diagrams["seq_block_user.png"] = """@startuml
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

puml_diagrams["seq_manage_car.png"] = """@startuml
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


puml_diagrams["seq_compare_cars.png"] = """@startuml
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

puml_diagrams["seq_loan_simulation.png"] = """@startuml
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

puml_diagrams["seq_ai_chatbot.png"] = """@startuml
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


# 4. Class Diagrams
puml_diagrams["class_register.png"] = """@startuml
skinparam monochrome true
skinparam shadowing false
class RegisterForm <<Boundary>> {
  - nameField: String
  - emailField: String
  - phoneField: String
  + onRegister()
  + validateForm()
}
class RegisterActions <<Control>> {
  + registerUser(formData)
  - checkEmail(email)
  - hashPassword(password)
}
class DbUser <<Entity>> {
  - id: UUID
  - email: String
  - phone: String
  + create()
  + checkExist()
}
RegisterForm ..> RegisterActions
RegisterActions ..> DbUser
@enduml"""

puml_diagrams["class_login.png"] = """@startuml
skinparam monochrome true
skinparam shadowing false
class LoginForm <<Boundary>> {
  - emailField: String
  - passwordField: String
  + onSubmit()
  + displayError()
}
class AuthActions <<Control>> {
  + handleLogin(email, password)
  - checkToken()
}
class DbUser <<Entity>> {
  - id: UUID
  - passwordHash: String
  + findByEmail()
}
LoginForm ..> AuthActions
AuthActions ..> DbUser
@enduml"""

puml_diagrams["class_view_car.png"] = """@startuml
skinparam monochrome true
skinparam shadowing false
class CarDetailPage <<Boundary>> {
  - carId: UUID
  + renderDetail()
}
class CarActions <<Control>> {
  + getCarById(carId)
  + incrementViews(carId)
}
class DbCar <<Entity>> {
  - id: UUID
  - title: String
  - views: Int
  + findById()
  + updateViews()
}
class DbCarImage <<Entity>> {
  - id: UUID
  - carId: UUID
  - url: String
  + findByCarId()
}
CarDetailPage ..> CarActions
CarActions ..> DbCar
CarActions ..> DbCarImage
@enduml"""

puml_diagrams["class_view_posts.png"] = """@startuml
skinparam monochrome true
skinparam shadowing false
class NewsPage <<Boundary>> {
  + renderList()
}
class PostActions <<Control>> {
  + getPublishedPosts()
  + getPostBySlug(slug)
}
class DbPost <<Entity>> {
  - id: UUID
  - slug: String
  + queryPublished()
  + findBySlug()
}
NewsPage ..> PostActions
PostActions ..> DbPost
@enduml"""

puml_diagrams["class_appointment.png"] = """@startuml
skinparam monochrome true
skinparam shadowing false
class AppointmentForm <<Boundary>> {
  - dateField: Date
  - timeField: Time
  + submitAppointment()
}
class AppointmentActions <<Control>> {
  + createAppointment(formData)
}
class DbAppointment <<Entity>> {
  - id: UUID
  - carId: UUID
  - appointmentDate: Timestamp
  + insert()
  + checkAvailability()
}
AppointmentForm ..> AppointmentActions
AppointmentActions ..> DbAppointment
@enduml"""

puml_diagrams["class_update_profile.png"] = """@startuml
skinparam monochrome true
skinparam shadowing false
class ProfileForm <<Boundary>> {
  - nameField: String
  - phoneField: String
  + onSubmit()
}
class ProfileActions <<Control>> {
  + updateProfile(formData)
}
class DbUser <<Entity>> {
  - id: UUID
  - fullName: String
  - phone: String
  + update()
}
ProfileForm ..> ProfileActions
ProfileActions ..> DbUser
@enduml"""

puml_diagrams["class_submit_consultation.png"] = """@startuml
skinparam monochrome true
skinparam shadowing false
class ContactPage <<Boundary>> {
  - nameField: String
  - messageField: String
  + onSubmit()
}
class ContactActions <<Control>> {
  + createContact(formData)
}
class DbContact <<Entity>> {
  - id: UUID
  - message: String
  + insert()
}
ContactPage ..> ContactActions
ContactActions ..> DbContact
@enduml"""

puml_diagrams["class_view_bookings.png"] = """@startuml
skinparam monochrome true
skinparam shadowing false
class MyAppointments <<Boundary>> {
  + renderList()
}
class AppointmentActions <<Control>> {
  + getAppointmentsByUserId()
}
class DbAppointment <<Entity>> {
  - userId: UUID
  + findByUserId()
}
MyAppointments ..> AppointmentActions
AppointmentActions ..> DbAppointment
@enduml"""

puml_diagrams["class_customer_chat.png"] = """@startuml
skinparam monochrome true
skinparam shadowing false
class ChatWidget <<Boundary>> {
  - messageInput: String
  + sendMessage()
}
class ChatActions <<Control>> {
  + sendChatMessage(sessionId, text)
}
class DbChatMessage <<Entity>> {
  - sessionId: String
  - messageText: String
  + insert()
}
ChatWidget ..> ChatActions
ChatActions ..> DbChatMessage
@enduml"""

puml_diagrams["class_submit_lead.png"] = """@startuml
skinparam monochrome true
skinparam shadowing false
class ContactForm <<Boundary>> {
  - nameInput: String
  + submitContact()
}
class ContactActions <<Control>> {
  + createContactRequest(formData)
}
class DbContactRequest <<Entity>> {
  - id: UUID
  - carId: UUID
  + insert()
}
ContactForm ..> ContactActions
ContactActions ..> DbContactRequest
@enduml"""

puml_diagrams["class_crm.png"] = """@startuml
skinparam monochrome true
skinparam shadowing false
class CustomerCRMDetails <<Boundary>> {
  - noteTextArea: String
  + onStageChange()
}
class CRMActions <<Control>> {
  + updateCustomerStageAndNote()
}
class DbCustomer <<Entity>> {
  - id: UUID
  - stage: Enum
  + updateStage()
}
class DbCustomerNote <<Entity>> {
  - id: UUID
  - content: String
  + insertNote()
}
CustomerCRMDetails ..> CRMActions
CRMActions ..> DbCustomer
CRMActions ..> DbCustomerNote
@enduml"""

puml_diagrams["class_manage_appts.png"] = """@startuml
skinparam monochrome true
skinparam shadowing false
class AdminApptsPage <<Boundary>> {
  + onStatusChange()
}
class ApptActions <<Control>> {
  + updateApptStatus(apptId, status)
}
class DbAppointment <<Entity>> {
  - id: UUID
  - status: Enum
  + updateStatus()
}
AdminApptsPage ..> ApptActions
ApptActions ..> DbAppointment
@enduml"""

puml_diagrams["class_manage_posts.png"] = """@startuml
skinparam monochrome true
skinparam shadowing false
class AdminPostsPage <<Boundary>> {
  + savePost()
}
class AdminPostActions <<Control>> {
  + createPost(formData)
}
class DbPost <<Entity>> {
  - id: UUID
  - title: String
  + insert()
}
AdminPostsPage ..> AdminPostActions
AdminPostActions ..> DbPost
@enduml"""

puml_diagrams["class_analytics.png"] = """@startuml
skinparam monochrome true
skinparam shadowing false
class AnalyticsDashboard <<Boundary>> {
  + renderCharts()
}
class AnalyticsActions <<Control>> {
  + getSummaryMetrics()
}
class DbAnalyticsQuery <<Entity>> {
  + executeSummaryRawStats()
}
AnalyticsDashboard ..> AnalyticsActions
AnalyticsActions ..> DbAnalyticsQuery
@enduml"""

puml_diagrams["class_block_user.png"] = """@startuml
skinparam monochrome true
skinparam shadowing false
class AdminUsersPage <<Boundary>> {
  + onStatusToggle()
}
class AdminUserActions <<Control>> {
  + updateAccountStatus()
}
class DbUser <<Entity>> {
  - id: UUID
  - status: Enum
  + updateStatus()
}
AdminUsersPage ..> AdminUserActions
AdminUserActions ..> DbUser
@enduml"""

puml_diagrams["class_manage_car.png"] = """@startuml
skinparam monochrome true
skinparam shadowing false
class AdminCarsPage <<Boundary>> {
  + openModal()
}
class AdminCarActions <<Control>> {
  + addCar(formData)
}
class DbCar <<Entity>> {
  - id: UUID
  + insert()
}
AdminCarsPage ..> AdminCarActions
AdminCarActions ..> DbCar
@enduml"""

puml_diagrams["class_search_cars.png"] = """@startuml
skinparam monochrome true
skinparam shadowing false
class CarsPage <<Boundary>> {
  - filterBrand: String
  - priceRange: String
  + onFilterChange()
  + renderList()
}
class CarActions <<Control>> {
  + getFilteredCars(filters)
}
class DbCar <<Entity>> {
  - brand: String
  - price: BigInt
  + queryFiltered()
}
CarsPage ..> CarActions
CarActions ..> DbCar
@enduml"""


puml_diagrams["class_compare_cars.png"] = """@startuml
skinparam monochrome true
skinparam shadowing false
skinparam classAttributeIconSize 0

class SoSanhXeUI <<Boundary>> {
  +chonXeCanSoSanh()
  +soSanhVaRenderBang()
  +hienThiBangSoSanh()
}

class XeController <<Control>> {
  +layThongTinSoSanh(carId1, carId2)
  +layThongTinXe(carId)
}

class CARS <<Entity>> {
  -id : VARCHAR(36)
  -title : VARCHAR(255)
  -price : BIGINT
  -brand : VARCHAR(100)
}

SoSanhXeUI ..> XeController
XeController ..> CARS
@enduml"""

puml_diagrams["class_loan_simulation.png"] = """@startuml
skinparam monochrome true
skinparam shadowing false
skinparam classAttributeIconSize 0

class TinhTraGopUI <<Boundary>> {
  +chonXeCanTinhGop()
  +nhapThongSo()
  +clickTinhToan()
  +hienThiBangTinhLaiSuat()
}

class LoanController <<Control>> {
  +layGiaXe(carId)
  +tinhTraGop(giaXe, traTruoc, laiSuat, kyHan)
  -tinhLaiSuatVaLichTraNo()
}

class CARS <<Entity>> {
  -id : VARCHAR(36)
  -price : BIGINT
}

TinhTraGopUI ..> LoanController
LoanController ..> CARS
@enduml"""

puml_diagrams["class_ai_chatbot.png"] = """@startuml
skinparam monochrome true
skinparam shadowing false
skinparam classAttributeIconSize 0

class ChatWindowUI <<Boundary>> {
  +moChatAI()
  +nhapCauHoi()
  +renderTinNhan()
}

class AIChatController <<Control>> {
  +aiChatAction(message, sessionId)
}

class GeminiAI <<Control>> {
  +generateContent(prompt)
}

class CARS <<Entity>> {
  -id : VARCHAR(36)
  -title : VARCHAR(255)
  -price : BIGINT
  -status : ENUM
}

class CHAT_MESSAGES <<Entity>> {
  -id : VARCHAR(36)
  -session_id : VARCHAR(50)
  -sender_role : ENUM
  -message_text : TEXT
}

ChatWindowUI ..> AIChatController
AIChatController ..> GeminiAI
AIChatController ..> CARS
AIChatController ..> CHAT_MESSAGES
@enduml"""


# 5. Database ERD (Excludes Favorites)
puml_diagrams["erd.png"] = """@startuml
skinparam monochrome true
skinparam shadowing false
left to right direction

entity users {
  * id : VARCHAR(36) [PK]
  --
  * full_name : VARCHAR(255)
  * email : VARCHAR(255)
  * phone : VARCHAR(50)
  * password : VARCHAR(255)
  * role : ENUM('admin','staff','customer')
  * status : ENUM('active','blocked')
}

entity cars {
  * id : VARCHAR(36) [PK]
  --
  * user_id : VARCHAR(36) [FK]
  * title : VARCHAR(255)
  * brand : VARCHAR(100)
  * price : BIGINT
  * year : INT
  * fuel_type : VARCHAR(50)
  * transmission : VARCHAR(50)
  * status : ENUM('avail','res','sold','hid')
}

entity car_images {
  * id : VARCHAR(36) [PK]
  --
  * car_id : VARCHAR(36) [FK]
  * image_url : TEXT
  * sort_order : INT
}

entity appointments {
  * id : VARCHAR(36) [PK]
  --
  * car_id : VARCHAR(36) [FK]
  * user_id : VARCHAR(36) [FK]
  * customer_name : VARCHAR(255)
  * customer_phone : VARCHAR(50)
  * appointment_date : TIMESTAMP
  * status : ENUM('pend','conf','canc','comp')
}

entity customers {
  * id : VARCHAR(36) [PK]
  --
  * full_name : VARCHAR(255)
  * phone : VARCHAR(50)
  * email : VARCHAR(255)
  * interested_car_id : VARCHAR(36) [FK]
  * stage : ENUM('new_lead','consulting',...)
  * assigned_staff_id : VARCHAR(36) [FK]
}

entity customer_notes {
  * id : VARCHAR(36) [PK]
  --
  * customer_id : VARCHAR(36) [FK]
  * staff_id : VARCHAR(36) [FK]
  * content : TEXT
}

entity contact_requests {
  * id : VARCHAR(36) [PK]
  --
  * full_name : VARCHAR(255)
  * phone : VARCHAR(50)
  * consultation_type : VARCHAR(100)
  * assigned_staff_id : VARCHAR(36) [FK]
  * stage : ENUM('new_lead','assigned',...)
}

entity chat_messages {
  * id : VARCHAR(36) [PK]
  --
  * session_id : VARCHAR(50)
  * sender_role : ENUM('customer','staff')
  * sender_name : VARCHAR(255)
  * message_text : TEXT
}

entity notifications {
  * id : VARCHAR(36) [PK]
  --
  * user_id : VARCHAR(36) [FK]
  * title : VARCHAR(255)
  * content : TEXT
}

users ||--o{ cars : lists
users ||--o{ appointments : assigns
users ||--o{ customers : manages
cars ||--|{ car_images : has
cars ||--o{ appointments : booking
customers ||--|{ customer_notes : note
@enduml"""


# 6. Screen Navigation Chart
puml_diagrams["navigation_chart.png"] = """@startuml
skinparam monochrome true
skinparam shadowing false
left to right direction

detail --> appt : Đặt lịch
home --> auth : Đăng nhập
home --> contact : Liên hệ
auth --> admin : Quyền Admin
auth --> staff : Quyền Staff
@enduml"""


def main():
    print("Compiling all UML diagrams from PlantUML web compiler to PNGs...")
    total = len(puml_diagrams)
    success = 0
    
    for idx, (filename, puml_content) in enumerate(puml_diagrams.items(), start=1):
        out_path = OUT_DIR / filename
        print(f"[{idx}/{total}] Compiling {filename}...", end=" ", flush=True)
        
        ok = download_png(puml_content, out_path)
        if ok:
            print("SUCCESS")
            success += 1
        else:
            print("FAILED")
        
        # Add a tiny delay to be gentle with the public PlantUML server
        time.sleep(0.3)
        
    print(f"\nAll UML Diagrams updated successfully! {success}/{total} compiled.")

if __name__ == "__main__":
    main()
