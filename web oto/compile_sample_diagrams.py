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
# DIAGRAMS DATA DEFINITIONS
# ========================================================
diagrams = {}

# Sơ đồ 1: DangNhap include wheel
diagrams["1_dangnhap_wheel.puml"] = """@startuml DangNhap Include Wheel
left to right direction
skinparam packageStyle rectangle
skinparam linetype ortho

usecase login as "DangNhap"

rectangle "Các chức năng yêu cầu đăng nhập" {
    usecase uc1 as "QuanLyLichHen"
    usecase uc2 as "CapNhatNguoiDung"
    usecase uc3 as "CapNhatXe"
    usecase uc4 as "QuanLyLead"
    usecase uc5 as "CapNhatDanhMuc"
    usecase uc6 as "QuanLyBaoCao"
    usecase uc7 as "DanhGiaXe"
    usecase uc8 as "DatLichXemXe"
    usecase uc9 as "ChatRealtime"
    usecase uc10 as "XemLichSuDatLich"
    usecase uc11 as "CapNhatThongTin"
    usecase uc12 as "XemXeYeuThich"
}

uc1 ..> login : <<include>>
uc2 ..> login : <<include>>
uc3 ..> login : <<include>>
uc4 ..> login : <<include>>
uc5 ..> login : <<include>>
uc6 ..> login : <<include>>
uc7 ..> login : <<include>>
uc8 ..> login : <<include>>
uc9 ..> login : <<include>>
uc10 ..> login : <<include>>
uc11 ..> login : <<include>>
uc12 ..> login : <<include>>
@enduml"""

# Sơ đồ 2: QuanLyLichHen sub-usecase
diagrams["2_quanlylichhen_sub.puml"] = """@startuml QuanLyLichHen Sub Use Case
left to right direction

usecase login as "DangNhap"

usecase qllh as "QuanLyLichHen
--
**extension points**
DuyetLichHen
HuyLichHen"

usecase uc_approve as "DuyetLichHen"
usecase uc_cancel as "HuyLichHen"

qllh ..> login : <<include>>
uc_approve ..> qllh : <<extend>>
uc_cancel ..> qllh : <<extend>>
@enduml"""

# Sơ đồ 3: DangNhap sequence diagram (matching sample image_1.png exactly)
diagrams["3_dangnhap_sequence.puml"] = """@startuml DangNhap Sequence Diagram
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

# Sơ đồ 4: Overall Use Case Diagram (matching style of image_3.png)
diagrams["4_overall_usecase.puml"] = """@startuml Overall Use Case Diagram
left to right direction

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

' Connect Customer
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

' Connect Admin
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

' Connect Email System
uc_booking --> email
uc_manage_booking --> email
@enduml"""

def main():
    out_dir = "./diagrams_matching_samples"
    os.makedirs(out_dir, exist_ok=True)
    
    print("Compiling sample-matching UML Diagrams...")
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
