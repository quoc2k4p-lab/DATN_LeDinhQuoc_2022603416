import os
import zlib
import base64
import string
import urllib.request
import time

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
        
        with urllib.request.urlopen(req) as response:
            svg_data = response.read()
            with open(output_path, 'wb') as f:
                f.write(svg_data)
        return True
    except Exception as e:
        print(f"Error downloading {output_path}: {e}")
        return False

# ========================================================
# DIAGRAMS DATA DEFINITIONS (UPDATED FOR BCE 4-COLUMN STYLE)
# ========================================================
diagrams = {}

# Use Case Diagrams
diagrams["usecase_overall.puml"] = """@startuml Overall Use Case Diagram
left to right direction
skinparam packageStyle rectangle

actor "Người dùng" as user
actor "Người quản trị" as admin
actor "Hệ thống Email" as email

usecase uc_booking as "DatLichXemXe"
usecase uc_contact as "GuiYeuCauTuVan"
usecase uc_view_car as "XemThongTinXe"
usecase uc_update_profile as "CapNhatThongTin"
usecase uc_review as "DanhGiaXe"
usecase uc_view_history as "XemLichSuDatLich"
usecase uc_favorites as "QuanLyXeYeuThich"
usecase uc_register as "DangKy"
usecase uc_login as "DangNhap"
usecase uc_news as "XemTinTuc"

usecase uc_manage_booking as "QuanLyLichHen"
usecase uc_manage_cars as "QuanLyXe"
usecase uc_manage_cats as "QuanLyDanhMuc"
usecase uc_manage_users as "QuanLyNguoiDung"
usecase uc_manage_crm as "QuanLyCRM"
usecase uc_manage_posts as "QuanLyBaiViet"
usecase uc_stats as "XemBaoCao"

user --> uc_booking
user --> uc_contact
user --> uc_view_car
user --> uc_update_profile
user --> uc_review
user --> uc_view_history
user --> uc_favorites
user --> uc_register
user --> uc_login
user --> uc_news

admin --> uc_view_car
admin --> uc_update_profile
admin --> uc_view_history
admin --> uc_login
admin --> uc_manage_booking
admin --> uc_manage_cars
admin --> uc_manage_cats
admin --> uc_manage_users
admin --> uc_manage_crm
admin --> uc_manage_posts
admin --> uc_stats

uc_booking --> email
uc_manage_booking --> email
@enduml"""

diagrams["usecase_customer.puml"] = """@startuml Customer Use Case Diagram
left to right direction
skinparam packageStyle rectangle

actor "Customer" as c
actor "Mail System" as mail
actor "Chat System" as chat

rectangle "Customer Module: TQ Auto" {
    usecase "Đăng nhập" as login
    usecase "Xem thông tin cá nhân" as view_profile
    usecase "Cập nhật thông tin cá nhân" as update_profile
    usecase "Đổi mật khẩu" as change_pass
    usecase "Xem chi tiết xe" as view_car
    usecase "Đánh giá & Bình luận xe" as review_car
    usecase "Thêm xe yêu thích" as add_fav
    usecase "Xóa xe yêu thích" as del_fav
    usecase "Đặt lịch xem xe trực tuyến" as create_booking
    usecase "Xem lịch sử đặt lịch" as view_bookings
    usecase "Hủy lịch hẹn" as cancel_booking
    usecase "Chat realtime tư vấn" as chat_uc
    
    update_profile .> view_profile : <<extend>>
    change_pass .> view_profile : <<extend>>
    create_booking ..> login : <<include>>
    create_booking ..> view_car : <<include>>
    review_car ..> login : <<include>>
    add_fav ..> login : <<include>>
    chat_uc ..> login : <<include>>
    
    create_booking ..> mail : <<extend>>
    chat_uc ..> chat : <<include>>
}
c --> view_profile
c --> view_car
c --> review_car
c --> add_fav
c --> del_fav
c --> create_booking
c --> view_bookings
c --> cancel_booking
c --> chat_uc
@enduml"""

diagrams["usecase_staff.puml"] = """@startuml Staff Use Case Diagram
left to right direction
skinparam packageStyle rectangle

actor "Staff" as s
actor "Mail System" as mail

rectangle "Staff Module: TQ Auto" {
    usecase "Đăng nhập hệ thống" as login
    usecase "Xem Dashboard nhân viên" as db
    usecase "Quản lý lịch hẹn được giao" as manage_booking
    usecase "Duyệt lịch hẹn" as approve_booking
    usecase "Hủy lịch hẹn" as cancel_booking
    usecase "Quản lý khách hàng CRM" as manage_crm
    usecase "Thêm ghi chú CSKH" as add_note
    usecase "Xem danh sách lead" as view_leads
    usecase "Chat tư vấn khách hàng" as chat_cust
    
    approve_booking .> manage_booking : <<extend>>
    cancel_booking .> manage_booking : <<extend>>
    add_note .> manage_crm : <<extend>>
    
    approve_booking ..> mail : <<extend>>
    cancel_booking ..> mail : <<extend>>
    
    manage_booking ..> login : <<include>>
    manage_crm ..> login : <<include>>
    chat_cust ..> login : <<include>>
}
s --> db
s --> manage_booking
s --> manage_crm
s --> view_leads
s --> chat_cust
@enduml"""

diagrams["usecase_admin.puml"] = """@startuml Admin Use Case Diagram
left to right direction
skinparam packageStyle rectangle

actor "Admin" as a

rectangle "Admin Module: TQ Auto" {
    usecase "Đăng nhập Admin" as login
    usecase "Quản lý xe ô tô" as manage_cars
    usecase "Thêm xe mới" as add_car
    usecase "Cập nhật xe" as update_car
    usecase "Xóa/Ẩn xe" as delete_car
    usecase "Quản lý danh mục hãng xe" as manage_cats
    usecase "Quản lý lịch hẹn tổng" as manage_appts
    usecase "Giao lịch hẹn cho nhân viên" as assign_appt
    usecase "Quản lý bài viết tin tức" as manage_posts
    usecase "Quản lý tài khoản" as manage_users
    usecase "Khóa tài khoản" as block_user
    usecase "Mở khóa tài khoản" as unblock_user
    usecase "Xem thống kê doanh thu" as view_stats
    
    add_car .> manage_cars : <<extend>>
    update_car .> manage_cars : <<extend>>
    delete_car .> manage_cars : <<extend>>
    block_user .> manage_users : <<extend>>
    unblock_user .> manage_users : <<extend>>
    assign_appt .> manage_appts : <<extend>>
    
    manage_cars ..> login : <<include>>
    manage_cats ..> login : <<include>>
    manage_appts ..> login : <<include>>
    manage_posts ..> login : <<include>>
    manage_users ..> login : <<include>>
    view_stats ..> login : <<include>>
}
a --> manage_cars
a --> manage_cats
a --> manage_appts
a --> manage_posts
a --> manage_users
a --> view_stats
@enduml"""

# 30 Sequence Diagrams (BCE Style matching samples)

# 1. Đăng ký tài khoản
diagrams["seq_register.puml"] = """@startuml Sequence: Dang ky tai khoan
actor KhachHang as ": KhachHang"
boundary DangKyUI as ": DangKyUI"
control DangKyController as ": DangKyController"
entity USERS as ": USERS"

autonumber

KhachHang -> DangKyUI : nhapThongTinDangKy(name, email, phone, password)
activate DangKyUI
KhachHang -> DangKyUI : kichNutDangKy()
DangKyUI -> DangKyController : guiThongTinDangKy()
activate DangKyController
DangKyController -> USERS : kiemTraEmailTonTai(email)
activate USERS
USERS --> DangKyController : returnKetQua()
deactivate USERS
alt Email chưa tồn tại
    DangKyController -> USERS : luuTaiKhoanMoi(data)
    activate USERS
    USERS --> DangKyController : returnKetQua()
    deactivate USERS
    DangKyController -> DangKyController : taoSessionJWT()
    DangKyController --> DangKyUI : returnKetQua()
    DangKyUI --> KhachHang : hienThiThongBaoThanhCong()
else Email đã tồn tại
    DangKyController --> DangKyUI : returnKetQua()
    DangKyUI --> KhachHang : hienThiLoi()
end
deactivate DangKyController
deactivate DangKyUI
@enduml"""

# 2. Đăng nhập
diagrams["seq_login.puml"] = """@startuml Sequence: Dang nhap
actor NguoiDung as ": NguoiDung"
boundary DangNhapUI as ": DangNhapUI"
control DangNhapController as ": DangNhapController"
entity USERS as ": USERS"

autonumber

NguoiDung -> DangNhapUI : chonIconHinhNguoi()
activate DangNhapUI
DangNhapUI -> DangNhapUI : hienThiManHinhDangNhap()
deactivate DangNhapUI

NguoiDung -> DangNhapUI : nhapUsernamePassword()
activate DangNhapUI
NguoiDung -> DangNhapUI : kichNutDangNhap()
DangNhapUI -> DangNhapController : layThongTinTaiKhoan()
activate DangNhapController
DangNhapController -> USERS : layThongTinTaiKhoan()
activate USERS
USERS --> DangNhapController : returnKetQua()
deactivate USERS
DangNhapController --> DangNhapUI : returnKetQua()
deactivate DangNhapController

DangNhapUI -> DangNhapUI : hienThiManHinhTrangChu()
deactivate DangNhapUI
@enduml"""

# 3. Quên mật khẩu
diagrams["seq_forgot_password.puml"] = """@startuml Sequence: Quen mat khau
actor NguoiDung as ": NguoiDung"
boundary QuenMatKhauUI as ": QuenMatKhauUI"
control QuenMatKhauController as ": QuenMatKhauController"
entity USERS as ": USERS"

autonumber

NguoiDung -> QuenMatKhauUI : nhapEmailYeuCau(email)
activate QuenMatKhauUI
NguoiDung -> QuenMatKhauUI : kichNutGuiYeuCau()
QuenMatKhauUI -> QuenMatKhauController : guiYeuCauQuenMatKhau()
activate QuenMatKhauController
QuenMatKhauController -> USERS : kiemTraEmail(email)
activate USERS
USERS --> QuenMatKhauController : returnKetQua()
deactivate USERS
alt Email tồn tại
    QuenMatKhauController -> QuenMatKhauController : taoTokenReset()
    QuenMatKhauController -> USERS : luuTokenReset(email, token)
    activate USERS
    USERS --> QuenMatKhauController : returnKetQua()
    deactivate USERS
    QuenMatKhauController -> QuenMatKhauController : guiEmailLinkReset()
    QuenMatKhauController --> QuenMatKhauUI : returnKetQua()
    QuenMatKhauUI --> NguoiDung : hienThiThongBaoCheckMail()
else Email không tồn tại
    QuenMatKhauController --> QuenMatKhauUI : returnKetQua()
    QuenMatKhauUI --> NguoiDung : hienThiLoi()
end
deactivate QuenMatKhauController
deactivate QuenMatKhauUI
@enduml"""

# 4. Cập nhật hồ sơ cá nhân
diagrams["seq_update_profile.puml"] = """@startuml Sequence: Cap nhat ho so ca nhan
actor KhachHang as ": KhachHang"
boundary HoSoCaNhanUI as ": HoSoCaNhanUI"
control HoSoController as ": HoSoController"
entity USERS as ": USERS"

autonumber

KhachHang -> HoSoCaNhanUI : nhapThongTinMoi(name, phone)
activate HoSoCaNhanUI
KhachHang -> HoSoCaNhanUI : kichNutCapNhat()
HoSoCaNhanUI -> HoSoController : guiYeuCauCapNhatHoSo()
activate HoSoController
HoSoController -> USERS : capNhatThongTin(userId, name, phone)
activate USERS
USERS --> HoSoController : returnKetQua()
deactivate USERS
HoSoController --> HoSoCaNhanUI : returnKetQua()
deactivate HoSoController
HoSoCaNhanUI --> KhachHang : hienThiThongBaoCapNhatThanhCong()
deactivate HoSoCaNhanUI
@enduml"""

# 5. Đặt lịch xem xe
diagrams["seq_create_booking.puml"] = """@startuml Sequence: Dat lich xem xe
actor KhachHang as ": KhachHang"
boundary DatLichXemXeUI as ": DatLichXemXeUI"
control DatLichController as ": DatLichController"
entity appointments as ": appointments"

autonumber

KhachHang -> DatLichXemXeUI : chonNgayGioHen(carId, date, time)
activate DatLichXemXeUI
KhachHang -> DatLichXemXeUI : nhapThongTinLienHe()
KhachHang -> DatLichXemXeUI : kichNutDatLich()
DatLichXemXeUI -> DatLichController : guiYeuCauDatLich()
activate DatLichController
DatLichController -> appointments : taoBookingMoi(data)
activate appointments
appointments --> DatLichController : returnKetQua()
deactivate appointments
DatLichController -> DatLichController : guiEmailXacNhanDatLich()
DatLichController --> DatLichXemXeUI : returnKetQua()
deactivate DatLichController
DatLichXemXeUI --> KhachHang : hienThiThongBaoDatLichThanhCong()
deactivate DatLichXemXeUI
@enduml"""

# 6. Admin xác nhận lịch hẹn
diagrams["seq_confirm_booking.puml"] = """@startuml Sequence: Admin/Staff xac nhan lich hen
actor NhanVien as ": NhanVien"
boundary AdminLichHenUI as ": AdminLichHenUI"
control LichHenController as ": LichHenController"
entity appointments as ": appointments"

autonumber

NhanVien -> AdminLichHenUI : chonLichHenCanDuyet(bookingId)
activate AdminLichHenUI
NhanVien -> AdminLichHenUI : kichNutDuyetLich()
AdminLichHenUI -> LichHenController : guiYeuCauDuyetLich()
activate LichHenController
LichHenController -> appointments : capNhatTrangThaiLich(bookingId, 'CONFIRMED')
activate appointments
appointments --> LichHenController : returnKetQua()
deactivate appointments
LichHenController -> LichHenController : guiEmailThongBaoKhachHang()
LichHenController --> AdminLichHenUI : returnKetQua()
deactivate LichHenController
AdminLichHenUI --> NhanVien : hienThiTrangThaiMoi()
deactivate AdminLichHenUI
@enduml"""

# 7. Gửi email xác nhận
diagrams["seq_send_email_notification.puml"] = """@startuml Sequence: Gui email xac nhan
actor System as ": System"
control EmailController as ": EmailController"
entity appointments as ": appointments"

autonumber

System -> EmailController : triggerGuiEmail(bookingId)
activate EmailController
EmailController -> appointments : layThongTinLichHen(bookingId)
activate appointments
appointments --> EmailController : returnThongTinLich()
deactivate appointments
EmailController -> EmailController : guiMailSMTP(email, template)
EmailController --> System : returnKetQua()
deactivate EmailController
@enduml"""

# 8. Hủy lịch hẹn
diagrams["seq_cancel_booking.puml"] = """@startuml Sequence: Huy lich hen
actor KhachHang as ": KhachHang"
boundary DatLichXemXeUI as ": DatLichXemXeUI"
control DatLichController as ": DatLichController"
entity appointments as ": appointments"

autonumber

KhachHang -> DatLichXemXeUI : clickHuyLichHen(bookingId)
activate DatLichXemXeUI
DatLichXemXeUI -> DatLichController : guiYeuCauHuyLich()
activate DatLichController
DatLichController -> appointments : capNhatTrangThaiLich(bookingId, 'CANCELLED')
activate appointments
appointments --> DatLichController : returnKetQua()
deactivate appointments
DatLichController -> DatLichController : guiEmailThongBaoHuyLich()
DatLichController --> DatLichXemXeUI : returnKetQua()
deactivate DatLichController
DatLichXemXeUI --> KhachHang : hienThiThongBaoHuyThanhCong()
deactivate DatLichXemXeUI
@enduml"""

# 9. Gửi yêu cầu tư vấn
diagrams["seq_submit_consultation.puml"] = """@startuml Sequence: Gui yeu cau tu van
actor KhachHang as ": KhachHang"
boundary LienHeUI as ": LienHeUI"
control LienHeController as ": LienHeController"
entity contact_requests as ": contact_requests"

autonumber

KhachHang -> LienHeUI : nhapFormLienHe(name, phone, message)
activate LienHeUI
KhachHang -> LienHeUI : kichNutGuiYeuCau()
LienHeUI -> LienHeController : guiYeuCauTuVan()
activate LienHeController
LienHeController -> contact_requests : luuYeuCauTuVan(data)
activate contact_requests
contact_requests --> LienHeController : returnKetQua()
deactivate contact_requests
LienHeController -> LienHeController : taoLeadCRM()
LienHeController --> LienHeUI : returnKetQua()
deactivate LienHeController
LienHeUI --> KhachHang : hienThiThongBaoThanhCong()
deactivate LienHeUI
@enduml"""

# 10. Admin phân công nhân viên
diagrams["seq_assign_staff.puml"] = """@startuml Sequence: Admin phan cong nhan vien
actor Admin as ": Admin"
boundary AdminLichHenUI as ": AdminLichHenUI"
control LichHenController as ": LichHenController"
entity appointments as ": appointments"

autonumber

Admin -> AdminLichHenUI : chonLichHen(bookingId)
activate AdminLichHenUI
Admin -> AdminLichHenUI : chonNhanVienPhuTrach(staffId)
Admin -> AdminLichHenUI : kichNutPhanCong()
AdminLichHenUI -> LichHenController : guiYeuCauPhanCong()
activate LichHenController
LichHenController -> appointments : updateNhanVienPhuTrach(bookingId, staffId)
activate appointments
appointments --> LichHenController : returnKetQua()
deactivate appointments
LichHenController -> LichHenController : taoThongBaoNhanVien(staffId)
LichHenController --> AdminLichHenUI : returnKetQua()
deactivate LichHenController
AdminLichHenUI --> Admin : hienThiThongBaoPhanCongThanhCong()
deactivate AdminLichHenUI
@enduml"""

# 11. Chat realtime khách hàng
diagrams["seq_customer_chat.puml"] = """@startuml Sequence: Chat realtime khach hang
actor KhachHang as ": KhachHang"
boundary ChatUI as ": ChatUI"
control ChatController as ": ChatController"
entity chat_messages as ": chat_messages"

autonumber

KhachHang -> ChatUI : nhapNoiDungChat(text)
activate ChatUI
KhachHang -> ChatUI : kichNutGuiTinNhan()
ChatUI -> ChatController : guiTinNhan()
activate ChatController
ChatController -> chat_messages : luuTinNhan(text, sender='cust')
activate chat_messages
chat_messages --> ChatController : returnKetQua()
deactivate chat_messages
ChatController -> ChatController : emitTinNhanSocketIO()
ChatController --> ChatUI : returnKetQua()
deactivate ChatController
ChatUI --> KhachHang : hienThiTinNhanTrenUI()
deactivate ChatUI
@enduml"""

# 12. Gửi tin nhắn nhân viên
diagrams["seq_staff_chat.puml"] = """@startuml Sequence: Gui tin nhan nhan vien
actor NhanVien as ": NhanVien"
boundary StaffChatUI as ": StaffChatUI"
control ChatController as ": ChatController"
entity chat_messages as ": chat_messages"

autonumber

NhanVien -> StaffChatUI : nhapNoiDungChatTuan(text)
activate StaffChatUI
NhanVien -> StaffChatUI : kichNutGuiTinNhan()
StaffChatUI -> ChatController : guiTinNhan()
activate ChatController
ChatController -> chat_messages : luuTinNhan(text, sender='staff')
activate chat_messages
chat_messages --> ChatController : returnKetQua()
deactivate chat_messages
ChatController -> ChatController : emitTinNhanSocketIO()
ChatController --> StaffChatUI : returnKetQua()
deactivate ChatController
StaffChatUI --> NhanVien : hienThiTinNhanTrenUI()
deactivate StaffChatUI
@enduml"""

# 13. Thêm xe
diagrams["seq_add_car.puml"] = """@startuml Sequence: Them xe
actor Admin as ": Admin"
boundary AdminCarsUI as ": AdminCarsUI"
control CarController as ": CarController"
entity cars as ": cars"

autonumber

Admin -> AdminCarsUI : nhapThongTinXeMoi(title, price, brand, images)
activate AdminCarsUI
Admin -> AdminCarsUI : kichNutThemXe()
AdminCarsUI -> CarController : guiYeuCauThemXe()
activate CarController
CarController -> cars : luuXeMoi(data)
activate cars
cars --> CarController : returnCarId()
deactivate cars
CarController -> cars : luuAlbumAnh(carId, images)
activate cars
cars --> CarController : returnKetQua()
deactivate cars
CarController -> CarController : revalidatePage()
CarController --> AdminCarsUI : returnKetQua()
deactivate CarController
AdminCarsUI --> Admin : hienThiThongBaoThemThanhCong()
deactivate AdminCarsUI
@enduml"""

# 14. Cập nhật xe
diagrams["seq_update_car.puml"] = """@startuml Sequence: Cap nhat xe
actor Admin as ": Admin"
boundary AdminCarsUI as ": AdminCarsUI"
control CarController as ": CarController"
entity cars as ": cars"

autonumber

Admin -> AdminCarsUI : chonXeCanSua(carId)
activate AdminCarsUI
Admin -> AdminCarsUI : suaThongTinXe(price, status)
Admin -> AdminCarsUI : kichNutLuuXe()
AdminCarsUI -> CarController : guiYeuCauCapNhatXe()
activate CarController
CarController -> cars : updateXeRecord(carId, data)
activate cars
cars --> CarController : returnKetQua()
deactivate cars
CarController -> CarController : revalidatePage()
CarController --> AdminCarsUI : returnKetQua()
deactivate CarController
AdminCarsUI --> Admin : hienThiThongBaoCapNhatThanhCong()
deactivate AdminCarsUI
@enduml"""

# 15. Xóa xe
diagrams["seq_delete_car.puml"] = """@startuml Sequence: Xoa xe
actor Admin as ": Admin"
boundary AdminCarsUI as ": AdminCarsUI"
control CarController as ": CarController"
entity cars as ": cars"

autonumber

Admin -> AdminCarsUI : chonXeCanXoa(carId)
activate AdminCarsUI
Admin -> AdminCarsUI : kichNutXoaXe()
AdminCarsUI -> CarController : guiYeuCauXoaXe()
activate CarController
CarController -> cars : xoaAnhLienQuan(carId)
activate cars
cars --> CarController : returnKetQua()
deactivate cars
CarController -> cars : xoaXeRecord(carId)
activate cars
cars --> CarController : returnKetQua()
deactivate cars
CarController --> AdminCarsUI : returnKetQua()
deactivate CarController
AdminCarsUI --> Admin : lamMoiGiaoDienBieuDoXe()
deactivate AdminCarsUI
@enduml"""

# 16. Thêm danh mục xe
diagrams["seq_add_category.puml"] = """@startuml Sequence: Them danh muc xe
actor Admin as ": Admin"
boundary AdminCategoriesUI as ": AdminCategoriesUI"
control CategoryController as ": CategoryController"
entity categories as ": categories"

autonumber

Admin -> AdminCategoriesUI : nhapTenDanhMucMoi(brandName)
activate AdminCategoriesUI
Admin -> AdminCategoriesUI : kichNutThemDanhMuc()
AdminCategoriesUI -> CategoryController : guiYeuCauThemDanhMuc()
activate CategoryController
CategoryController -> categories : kiemTraDanhMucTonTai(brandName)
activate categories
categories --> CategoryController : returnKetQua()
deactivate categories
alt Danh mục mới
    CategoryController -> categories : luuDanhMucMoi(brandName)
    activate categories
    categories --> CategoryController : returnKetQua()
    deactivate categories
    CategoryController --> AdminCategoriesUI : returnKetQua()
    AdminCategoriesUI --> Admin : hienThiDanhMucMoi()
else Danh mục tồn tại
    CategoryController --> AdminCategoriesUI : returnKetQua()
    AdminCategoriesUI --> Admin : hienThiLoi()
end
deactivate CategoryController
deactivate AdminCategoriesUI
@enduml"""

# 17. Thêm bài viết
diagrams["seq_add_post.puml"] = """@startuml Sequence: Them bai viet
actor Admin as ": Admin"
boundary AdminPostsUI as ": AdminPostsUI"
control PostController as ": PostController"
entity posts as ": posts"

autonumber

Admin -> AdminPostsUI : nhapNoiDungBaiViet(title, content, image)
activate AdminPostsUI
Admin -> AdminPostsUI : kichNutDangPost()
AdminPostsUI -> PostController : guiYeuCauThemPost()
activate PostController
PostController -> posts : luuPostMoi(data)
activate posts
posts --> PostController : returnKetQua()
deactivate posts
PostController --> AdminPostsUI : returnKetQua()
deactivate PostController
AdminPostsUI --> Admin : hienThiBaiVietThanhCong()
deactivate AdminPostsUI
@enduml"""

# 18. Sửa bài viết
diagrams["seq_update_post.puml"] = """@startuml Sequence: Sua bai viet
actor Admin as ": Admin"
boundary AdminPostsUI as ": AdminPostsUI"
control PostController as ": PostController"
entity posts as ": posts"

autonumber

Admin -> AdminPostsUI : chonPostCanSua(postId)
activate AdminPostsUI
Admin -> AdminPostsUI : suaNoiDungPost(title, content)
Admin -> AdminPostsUI : kichNutLuuPost()
AdminPostsUI -> PostController : guiYeuCauCapNhatPost()
activate PostController
PostController -> posts : updatePostRecord(postId, data)
activate posts
posts --> PostController : returnKetQua()
deactivate posts
PostController --> AdminPostsUI : returnKetQua()
deactivate PostController
AdminPostsUI --> Admin : hienThiThongBaoCapNhatThanhCong()
deactivate AdminPostsUI
@enduml"""

# 19. Xóa bài viết
diagrams["seq_delete_post.puml"] = """@startuml Sequence: Xoa bai viet
actor Admin as ": Admin"
boundary AdminPostsUI as ": AdminPostsUI"
control PostController as ": PostController"
entity posts as ": posts"

autonumber

Admin -> AdminPostsUI : chonPostCanXoa(postId)
activate AdminPostsUI
Admin -> AdminPostsUI : kichNutXoaPost()
AdminPostsUI -> PostController : guiYeuCauXoaPost()
activate PostController
PostController -> posts : deletePostRecord(postId)
activate posts
posts --> PostController : returnKetQua()
deactivate posts
PostController --> AdminPostsUI : returnKetQua()
deactivate PostController
AdminPostsUI --> Admin : lamMoiBieuDoBaiViet()
deactivate AdminPostsUI
@enduml"""

# 20. Đánh giá xe
diagrams["seq_add_review.puml"] = """@startuml Sequence: Danh gia xe
actor KhachHang as ": KhachHang"
boundary ChiTietXeUI as ": ChiTietXeUI"
control ReviewController as ": ReviewController"
entity car_reviews as ": car_reviews"

autonumber

KhachHang -> ChiTietXeUI : chonSoSaoVaPhanHoi(stars, content)
activate ChiTietXeUI
KhachHang -> ChiTietXeUI : kichNutGuiDanhGia()
ChiTietXeUI -> ReviewController : guiYeuCauDanhGia()
activate ReviewController
ReviewController -> car_reviews : luuReviewMoi(userId, carId, stars, content)
activate car_reviews
car_reviews --> ReviewController : returnKetQua()
deactivate car_reviews
ReviewController --> ChiTietXeUI : returnKetQua()
deactivate ReviewController
ChiTietXeUI --> KhachHang : lamMoiPhanDanhGiaUI()
deactivate ChiTietXeUI
@enduml"""

# 21. Bình luận xe
diagrams["seq_add_comment.puml"] = """@startuml Sequence: Binh luan xe
actor KhachHang as ": KhachHang"
boundary ChiTietXeUI as ": ChiTietXeUI"
control ReviewController as ": ReviewController"
entity car_reviews as ": car_reviews"

autonumber

KhachHang -> ChiTietXeUI : nhapNoiDungBinhLuan(text)
activate ChiTietXeUI
KhachHang -> ChiTietXeUI : kichNutGuiBinhLuan()
ChiTietXeUI -> ReviewController : guiYeuCauBinhLuan()
activate ReviewController
ReviewController -> car_reviews : luuBinhLuanMoi(userId, carId, text)
activate car_reviews
car_reviews --> ReviewController : returnKetQua()
deactivate car_reviews
ReviewController --> ChiTietXeUI : returnKetQua()
deactivate ReviewController
ChiTietXeUI --> KhachHang : hienThiBinhLuanMoi()
deactivate ChiTietXeUI
@enduml"""

# 22. Thêm xe yêu thích
diagrams["seq_add_favorite.puml"] = """@startuml Sequence: Them xe yeu thich
actor KhachHang as ": KhachHang"
boundary KhoXeUI as ": KhoXeUI"
control FavoriteController as ": FavoriteController"
entity user_favorites as ": user_favorites"

autonumber

KhachHang -> KhoXeUI : clickHeartIcon(carId)
activate KhoXeUI
KhoXeUI -> FavoriteController : guiYeuCauThemYeuThich(carId)
activate FavoriteController
FavoriteController -> user_favorites : kiemTraXeDaYeuThich(userId, carId)
activate user_favorites
user_favorites --> FavoriteController : returnKetQua()
deactivate user_favorites
alt Chưa yêu thích
    FavoriteController -> user_favorites : luuFavoriteMoi(userId, carId)
    activate user_favorites
    user_favorites --> FavoriteController : returnKetQua()
    deactivate user_favorites
    FavoriteController --> KhoXeUI : returnKetQua()
    KhoXeUI --> KhachHang : highlightHeartIcon()
end
deactivate FavoriteController
deactivate KhoXeUI
@enduml"""

# 23. Xóa xe yêu thích
diagrams["seq_delete_favorite.puml"] = """@startuml Sequence: Xoa xe yeu thich
actor KhachHang as ": KhachHang"
boundary XeYeuThichUI as ": XeYeuThichUI"
control FavoriteController as ": FavoriteController"
entity user_favorites as ": user_favorites"

autonumber

KhachHang -> XeYeuThichUI : clickRemoveFavorite(carId)
activate XeYeuThichUI
XeYeuThichUI -> FavoriteController : guiYeuCauXoaYeuThich(carId)
activate FavoriteController
FavoriteController -> user_favorites : deleteFavoriteRecord(userId, carId)
activate user_favorites
user_favorites --> FavoriteController : returnKetQua()
deactivate user_favorites
FavoriteController --> XeYeuThichUI : returnKetQua()
deactivate FavoriteController
XeYeuThichUI --> KhachHang : xoaXeKhoiGiaoDien()
deactivate XeYeuThichUI
@enduml"""

# 24. Xem lịch sử đặt lịch
diagrams["seq_view_bookings.puml"] = """@startuml Sequence: Xem lich su dat lich
actor KhachHang as ": KhachHang"
boundary LichSuDatLichUI as ": LichSuDatLichUI"
control BookingController as ": BookingController"
entity appointments as ": appointments"

autonumber

KhachHang -> LichSuDatLichUI : truyCapLichSuDatLich()
activate LichSuDatLichUI
LichSuDatLichUI -> BookingController : guiYeuCauLayLichHen()
activate BookingController
BookingController -> appointments : selectLichHenByUserId(userId)
activate appointments
appointments --> BookingController : returnDanhSachLich()
deactivate appointments
BookingController --> LichSuDatLichUI : returnKetQua()
deactivate BookingController
LichSuDatLichUI --> KhachHang : hienThiDanhSachLichHen()
deactivate LichSuDatLichUI
@enduml"""

# 25. Quản lý khách hàng (CRM)
diagrams["seq_manage_customers.puml"] = """@startuml Sequence: Quan ly khach hang CRM
actor NhanVien as ": NhanVien"
boundary CRMUI as ": CRMUI"
control CRMController as ": CRMController"
entity customers as ": customers"

autonumber

NhanVien -> CRMUI : chonKhachHangCRM(customerId)
activate CRMUI
NhanVien -> CRMUI : updateTrangThaiCRM(stage)
NhanVien -> CRMUI : vietGhiChuCSKH(content)
NhanVien -> CRMUI : kichNutLuuCSKH()
CRMUI -> CRMController : guiYeuCauLuuCSKH()
activate CRMController
CRMController -> customers : updateCustomerStage(customerId, stage)
activate customers
customers --> CRMController : returnKetQua()
deactivate customers
CRMController -> customers : insertCustomerNote(customerId, content)
activate customers
customers --> CRMController : returnKetQua()
deactivate customers
CRMController --> CRMUI : returnKetQua()
deactivate CRMController
CRMUI --> NhanVien : hienThiTimelineCRM()
deactivate CRMUI
@enduml"""

# 26. Chặn tài khoản
diagrams["seq_block_user.puml"] = """@startuml Sequence: Chan tai khoan
actor Admin as ": Admin"
boundary AdminUsersUI as ": AdminUsersUI"
control UserController as ": UserController"
entity users as ": users"

autonumber

Admin -> AdminUsersUI : chonNguoiDung(userId)
activate AdminUsersUI
Admin -> AdminUsersUI : clickBlock()
AdminUsersUI -> UserController : guiYeuCauKhoaTK()
activate UserController
UserController -> users : updateUserStatus(userId, 'BLOCKED')
activate users
users --> UserController : returnKetQua()
deactivate users
UserController --> AdminUsersUI : returnKetQua()
deactivate UserController
AdminUsersUI --> Admin : hienThiTrangThaiKhoa()
deactivate AdminUsersUI
@enduml"""

# 27. Mở khóa tài khoản
diagrams["seq_unblock_user.puml"] = """@startuml Sequence: Mo khoa tai khoan
actor Admin as ": Admin"
boundary AdminUsersUI as ": AdminUsersUI"
control UserController as ": UserController"
entity users as ": users"

autonumber

Admin -> AdminUsersUI : chonNguoiDungBiKhoa(userId)
activate AdminUsersUI
Admin -> AdminUsersUI : clickUnblock()
AdminUsersUI -> UserController : guiYeuCauMoKhoaTK()
activate UserController
UserController -> users : updateUserStatus(userId, 'ACTIVE')
activate users
users --> UserController : returnKetQua()
deactivate users
UserController --> AdminUsersUI : returnKetQua()
deactivate UserController
AdminUsersUI --> Admin : hienThiTrangThaiHoatDong()
deactivate AdminUsersUI
@enduml"""

# 28. Thống kê doanh thu
diagrams["seq_view_statistics.puml"] = """@startuml Sequence: Thong ke doanh thu
actor Admin as ": Admin"
boundary AdminStatsUI as ": AdminStatsUI"
control StatsController as ": StatsController"
entity cars as ": cars"

autonumber

Admin -> AdminStatsUI : chonKhoangThoiGian(startDate, endDate)
activate AdminStatsUI
Admin -> AdminStatsUI : clickThongKe()
AdminStatsUI -> StatsController : guiYeuCauThongKeDoanhThu()
activate StatsController
StatsController -> cars : queryRevenueStats(startDate, endDate)
activate cars
cars --> StatsController : returnRawRevenueData()
deactivate cars
StatsController -> StatsController : formatDoanhThuJSON()
StatsController --> AdminStatsUI : returnKetQua()
deactivate StatsController
AdminStatsUI --> Admin : hienThiBieuDoCotRecharts()
deactivate AdminStatsUI
@enduml"""

# 29. Xem chi tiết xe đã bán
diagrams["seq_view_sold_car_details.puml"] = """@startuml Sequence: Xem chi tiet xe da ban
actor Admin as ": Admin"
boundary AdminStatsUI as ": AdminStatsUI"
control CarController as ": CarController"
entity cars as ": cars"

autonumber

Admin -> AdminStatsUI : clickXemXeDaBan(carId)
activate AdminStatsUI
AdminStatsUI -> CarController : guiYeuCauLayChiTiet()
activate CarController
CarController -> cars : selectCarWithImages(carId)
activate cars
cars --> CarController : returnChiTietXe()
deactivate cars
CarController --> AdminStatsUI : returnKetQua()
deactivate CarController
AdminStatsUI --> Admin : hienThiModalChiTietXe()
deactivate AdminStatsUI
@enduml"""

# 30. Dashboard tổng hợp
diagrams["seq_view_admin_dashboard.puml"] = """@startuml Sequence: Dashboard tong hop
actor Admin as ": Admin"
boundary AdminDashboardUI as ": AdminDashboardUI"
control StatsController as ": StatsController"
entity cars as ": cars"

autonumber

Admin -> AdminDashboardUI : truyCapDashboard()
activate AdminDashboardUI
AdminDashboardUI -> StatsController : guiYeuCauLayMetrics()
activate StatsController
StatsController -> cars : selectDashboardSummaryData()
activate cars
cars --> StatsController : returnDashboardSummary()
deactivate cars
StatsController -> StatsController : formatWidgetMetrics()
StatsController --> AdminDashboardUI : returnKetQua()
deactivate StatsController
AdminDashboardUI --> Admin : hienThiWidgetDoanhThuCarsLichHen()
deactivate AdminDashboardUI
@enduml"""

# Activity Diagrams (10 items)
diagrams["activity_register.puml"] = """@startuml Activity: Dang ky
start
:Khách nhập form đăng ký;
:Nhập họ tên, email, sđt, mật khẩu;
if (Dữ liệu đầy đủ và đúng định dạng?) then (yes)
  :Gửi thông tin đăng ký lên hệ thống;
  :Hệ thống kiểm tra email tồn tại;
  if (Email đã tồn tại?) then (yes)
    :Thông báo "Email đã đăng ký";
    stop
  else (no)
    :INSERT thông tin người dùng mới;
    :Tạo Session tự động đăng nhập;
    :Gửi email chào mừng;
    :Hiển thị thông báo đăng ký thành công;
    :Chuyển hướng về trang chủ;
  endif
else (no)
  :Hiển thị lỗi định dạng dữ liệu;
endif
stop
@enduml"""

diagrams["activity_login.puml"] = """@startuml Activity: Dang nhap
start
:Nhập email và mật khẩu;
if (Email và mật khẩu không rỗng?) then (yes)
  :Gửi thông tin xác thực;
  :Hệ thống truy vấn người dùng theo email;
  if (Tìm thấy tài khoản?) then (yes)
    :So khớp mật khẩu băm;
    if (Khớp mật khẩu?) then (yes)
      if (Tài khoản đang bị khóa?) then (yes)
        :Thông báo "Tài khoản bị khóa";
        stop
      else (no)
        :Sinh JWT token;
        :Thiết lập Cookie bảo mật;
        :Chuyển hướng trang (Admin/Staff/Customer);
      endif
    else (no)
      :Thông báo "Mật khẩu sai";
    endif
  else (no)
    :Thông báo "Email chưa đăng ký";
  endif
else (no)
  :Hiển thị yêu cầu điền thông tin;
endif
stop
@enduml"""

diagrams["activity_booking.puml"] = """@startuml Activity: Dat lich xem xe
start
:Khách chọn mẫu xe ô tô;
:Chọn ngày giờ hẹn;
:Điền thông tin liên hệ;
:Bấm nút đặt lịch;
if (Tài khoản đã đăng nhập?) then (yes)
  :Ghi nhận lịch hẹn mới (Trạng thái: PENDING);
  :Gửi email xác nhận đặt lịch hẹn cho khách;
  :Gửi thông báo cho Admin/Nhân viên;
  :Hiển thị thông báo đặt lịch thành công;
else (no)
  :Yêu cầu đăng nhập;
  :Đăng nhập thành công;
  :Trở lại lưu lịch hẹn;
endif
stop
@enduml"""

diagrams["activity_confirm_booking.puml"] = """@startuml Activity: Xac nhan lich hen
start
:Nhân viên xem danh sách lịch hẹn chờ duyệt;
:Chọn một lịch hẹn cụ thể;
if (Khách hàng yêu cầu đổi giờ hoặc có xung đột?) then (yes)
  :Liên hệ thương lượng lại giờ hẹn;
  :Cập nhật lại thời gian hẹn mới;
else (no)
endif
if (Phê duyệt lịch hẹn?) then (yes)
  :Cập nhật trạng thái lịch sang CONFIRMED;
  :Hệ thống tự động kích hoạt gửi mail xác nhận;
  :Gửi email thông báo "Lịch hẹn đã được duyệt";
else (no)
  :Cập nhật trạng thái sang CANCELLED;
  :Nhập lý do hủy lịch hẹn;
  :Gửi email thông báo hủy kèm lý do;
endif
:Làm mới giao diện quản lý lịch hẹn;
stop
@enduml"""

diagrams["activity_crm.puml"] = """@startuml Activity: Tu van khach hang
start
:Nhân viên tiếp nhận Lead mới từ hệ thống;
:Tiến hành gọi điện hoặc chat tư vấn;
if (Liên lạc thành công?) then (yes)
  :Trao đổi thông tin nhu cầu của khách;
  :Cập nhật trạng thái CRM khách hàng (Đang tư vấn);
  :Ghi chép chi tiết nội dung cuộc gọi vào Note;
  if (Khách chốt đặt cọc hoặc mua xe?) then (yes)
    :Cập nhật trạng thái xe (Đã nhận cọc/Đã bán);
    :Chuyển trạng thái CRM khách hàng (Đã mua xe);
  else (no)
    :Giữ trạng thái chăm sóc định kỳ;
  endif
else (no)
  :Ghi nhận ghi chú "Không liên lạc được";
  :Đổi trạng thái CRM sang "Đang theo dõi lại";
endif
stop
@enduml"""

diagrams["activity_manage_car.puml"] = """@startuml Activity: Quan ly xe
start
:Admin mở trang quản lý xe;
if (Hành động?) then (Thêm xe mới)
  :Nhập thông số, hãng, giá, trạng thái;
  :Tải lên các hình ảnh xe;
  :Hệ thống kiểm tra tính hợp lệ;
  :INSERT cơ sở dữ liệu cars & images;
  :Revalidate cache trang tĩnh;
elseif (Cập nhật thông tin) then
  :Sửa đổi thuộc tính của xe;
  :UPDATE cơ sở dữ liệu;
  :Revalidate cache trang tĩnh;
else (Xóa xe)
  :Xóa ảnh trong database;
  :DELETE xe khỏi database;
endif
:Làm mới danh sách xe hiển thị;
stop
@enduml"""

diagrams["activity_manage_post.puml"] = """@startuml Activity: Quan ly bai viet
start
:Admin vào phân hệ bài viết tin tức;
if (Thao tác?) then (Đăng bài mới)
  :Viết tiêu đề, nội dung, chọn ảnh bìa;
  :Bấm nút đăng bài;
  :Lưu bài viết vào DB (posts);
elseif (Chỉnh sửa bài) then
  :Mở nội dung bài viết hiện tại;
  :Chỉnh sửa nội dung;
  :Cập nhật bài viết trong DB;
else (Xóa bài)
  :Xác nhận xóa bài viết;
  :DELETE bài viết khỏi DB;
endif
:Cập nhật danh sách bài viết hiển thị;
stop
@enduml"""

diagrams["activity_chat.puml"] = """@startuml Activity: Chat realtime
start
:Người dùng mở khung chat trực tuyến;
:Nhập tin nhắn và click gửi;
:Hệ thống kiểm tra nội dung;
:INSERT tin nhắn mới vào database chat_messages;
:Kích hoạt sự kiện WebSocket gửi tin nhắn;
fork
  :Hiển thị tin nhắn ngay trên giao diện người gửi;
  :Thông báo âm thanh gửi thành công;
fork again
  :Hệ thống đẩy tin nhắn realtime tới đầu nhận;
  :Giao diện đầu nhận tự động render tin nhắn mới;
  :Hiển thị thông báo đỏ có tin nhắn chưa đọc;
end fork
stop
@enduml"""

diagrams["activity_review.puml"] = """@startuml Activity: Danh gia xe
start
:Khách hàng mở trang chi tiết xe;
:Xem phần đánh giá và bình luận;
:Bấm nút viết đánh giá;
if (Đã đăng nhập?) then (yes)
  :Chọn số sao (1-5 sao);
  :Nhập nội dung phản hồi nhận xét;
  :Bấm gửi đánh giá;
  :Lưu đánh giá vào database (car_reviews);
  :Tính toán lại điểm đánh giá trung bình của xe;
  :Cập nhật hiển thị số sao trung bình trên UI;
else (no)
  :Yêu cầu đăng nhập tài khoản;
  :Sau khi đăng nhập, quay lại form đánh giá;
endif
stop
@enduml"""

diagrams["activity_statistics.puml"] = """@startuml Activity: Thong ke doanh thu
start
:Admin truy cập trang báo cáo thống kê;
:Chọn khoảng thời gian cần tổng hợp;
:Bấm nút thực hiện thống kê;
:Hệ thống thực hiện query SELECT SUM(price) FROM cars WHERE status='sold';
:Hệ thống lấy số lượng xe đã bán, số lead chuyển đổi;
:Xử lý định dạng dữ liệu thô sang mảng JSON;
:Chuyển dữ liệu cho thư viện biểu đồ Recharts;
:Render biểu đồ cột doanh số;
:Render biểu đồ tròn cơ cấu hãng xe bán chạy;
stop
@enduml"""

# Class & ERD diagrams
diagrams["class_diagram.puml"] = """@startuml Class Diagram TQ Auto
skinparam classAttributeIconSize 0

class User {
    + id : String
    + fullName : String
    + email : String
    + phone : String
    + passwordHash : String
    + role : String
    + status : String
    + register() : Boolean
    + login() : String
    + updateProfile() : Boolean
}

class Car {
    + id : String
    + title : String
    + brand : String
    + price : Long
    + status : String
    + year : Integer
    + color : String
    + mileage : Integer
    + transmission : String
    + getDetails() : Car
    + updateStatus() : Boolean
}

class Category {
    + id : String
    + name : String
    + description : String
}

class Booking {
    + id : String
    + carId : String
    + userId : String
    + customerName : String
    + appointmentDate : DateTime
    + status : String
    + assignStaffId : String
    + create() : Boolean
    + updateStatus() : Boolean
}

class ContactRequest {
    + id : String
    + fullName : String
    + phone : String
    + email : String
    + message : String
    + consultationType : String
    + assignStaffId : String
    + save() : Boolean
}

class Review {
    + id : String
    + carId : String
    + userId : String
    + stars : Integer
    + content : String
    + create() : Boolean
}

class Favorite {
    + id : String
    + userId : String
    + carId : String
    + add() : Boolean
    + delete() : Boolean
}

class Post {
    + id : String
    + title : String
    + content : String
    + imageUrl : String
    + authorId : String
    + publish() : Boolean
}

class Message {
    + id : String
    + sessionId : String
    + senderRole : String
    + senderName : String
    + messageText : String
    + send() : Boolean
}

class Notification {
    + id : String
    + userId : String
    + title : String
    + content : String
    + status : String
    + sendNotification() : Boolean
}

User "1" *-- "0..*" Post : writes >
User "1" -- "0..*" Booking : makes >
User "1" -- "0..*" Review : submits >
User "1" -- "0..*" Favorite : saves >
User "1" -- "0..*" Notification : receives >

Car "1" *-- "1..*" Category : belongs_to >
Car "1" -- "0..*" Booking : reserved_in >
Car "1" -- "0..*" Review : receives >
Car "1" -- "0..*" Favorite : added_to >

Booking "0..*" o-- "1" User : assigned_to_staff >
ContactRequest "0..*" o-- "1" User : assigned_to_staff >
@enduml"""

diagrams["erd_diagram.puml"] = """@startuml ERD Diagram TQ Auto
!define Table(name,desc) class name as "desc" << (T,#FFAAAA) >>
!define primary_key(x) <b>PK: x</b>
!define foreign_key(x) <i>FK: x</i>

Table(users, "users") {
    primary_key(id) : VARCHAR(36)
    fullName : VARCHAR(255)
    email : VARCHAR(255)
    phone : VARCHAR(50)
    password : VARCHAR(255)
    role : ENUM('admin','staff','cust')
    status : ENUM('active','blocked')
}

Table(categories, "categories") {
    primary_key(id) : VARCHAR(36)
    name : VARCHAR(100)
    description : TEXT
}

Table(cars, "cars") {
    primary_key(id) : VARCHAR(36)
    foreign_key(user_id) : VARCHAR(36)
    title : VARCHAR(255)
    brand : VARCHAR(100)
    price : BIGINT
    year : INT
    color : VARCHAR(50)
    transmission : VARCHAR(50)
    status : ENUM('available','reserved','sold','hidden')
    car_condition : ENUM('new','used')
}

Table(appointments, "appointments") {
    primary_key(id) : VARCHAR(36)
    foreign_key(car_id) : VARCHAR(36)
    foreign_key(user_id) : VARCHAR(36)
    customer_name : VARCHAR(255)
    customer_phone : VARCHAR(50)
    customer_email : VARCHAR(255)
    appointment_date : TIMESTAMP
    status : ENUM('pending','confirmed','cancelled','completed')
    foreign_key(assigned_staff_id) : VARCHAR(36)
}

Table(reviews, "car_reviews") {
    primary_key(id) : VARCHAR(36)
    foreign_key(car_id) : VARCHAR(36)
    foreign_key(user_id) : VARCHAR(36)
    stars : INT
    content : TEXT
}

Table(favorites, "user_favorites") {
    primary_key(id) : VARCHAR(36)
    foreign_key(user_id) : VARCHAR(36)
    foreign_key(car_id) : VARCHAR(36)
}

Table(posts, "posts") {
    primary_key(id) : VARCHAR(36)
    foreign_key(author_id) : VARCHAR(36)
    title : VARCHAR(255)
    content : TEXT
    image_url : TEXT
}

Table(messages, "chat_messages") {
    primary_key(id) : VARCHAR(36)
    session_id : VARCHAR(50)
    sender_role : ENUM('cust','staff')
    sender_name : VARCHAR(255)
    message_text : TEXT
}

Table(notifications, "notifications") {
    primary_key(id) : VARCHAR(36)
    foreign_key(user_id) : VARCHAR(36)
    title : VARCHAR(255)
    content : TEXT
}

users "1" -- "0..*" cars : lists >
users "1" -- "0..*" appointments : makes >
users "1" -- "0..*" appointments : "is staff on" >
users "1" -- "0..*" reviews : writes >
users "1" -- "0..*" favorites : saves >
users "1" -- "0..*" posts : publishes >
users "1" -- "0..*" notifications : receives >

cars "1" -- "0..*" appointments : has >
cars "1" -- "0..*" reviews : receives >
cars "1" -- "0..*" favorites : marked_as >

categories "1" -- "0..*" cars : classifies >
@enduml"""


def main():
    out_dir = "./diagrams_tq_auto"
    os.makedirs(out_dir, exist_ok=True)
    
    print("Compiling all UML Diagrams with updated BCE styling...")
    total = len(diagrams)
    success_count = 0
    
    for idx, (filename, puml_content) in enumerate(diagrams.items(), start=1):
        # 1. Write the .puml file
        puml_path = os.path.join(out_dir, filename)
        with open(puml_path, 'w', encoding='utf-8') as f:
            f.write(puml_content)
        
        # 2. Download and write the .svg file
        svg_filename = filename.replace(".puml", ".svg")
        svg_path = os.path.join(out_dir, svg_filename)
        
        print(f"[{idx}/{total}] Compiling {filename} -> {svg_filename}...", end=" ", flush=True)
        time.sleep(0.5)
        
        ok = download_svg(puml_content, svg_path)
        if ok:
            print("SUCCESS")
            success_count += 1
        else:
            print("FAILED")
            
    print(f"\nUML compilation finished! {success_count}/{total} diagrams rendered successfully.")

if __name__ == "__main__":
    main()
