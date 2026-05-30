import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
OUT_DIR = ROOT / ".screenshots"
os.makedirs(OUT_DIR, exist_ok=True)

# Load font
try:
    font_path = "C:\\Windows\\Fonts\\times.ttf"
    font_bold_path = "C:\\Windows\\Fonts\\timesbd.ttf"
    if not os.path.exists(font_path):
        font_path = "C:\\Windows\\Fonts\\arial.ttf"
        font_bold_path = "C:\\Windows\\Fonts\\arialbd.ttf"
    
    font_title = ImageFont.truetype(font_bold_path, 20)
    font_header = ImageFont.truetype(font_bold_path, 15)
    font_normal = ImageFont.truetype(font_path, 13)
    font_italic = ImageFont.truetype(font_path, 12)
    font_small = ImageFont.truetype(font_path, 11)
except Exception:
    font_title = ImageFont.load_default()
    font_header = ImageFont.load_default()
    font_normal = ImageFont.load_default()
    font_italic = ImageFont.load_default()
    font_small = ImageFont.load_default()

# Grayscale Colors (matching template exactly)
COLOR_BG = (255, 255, 255)
COLOR_TEXT = (0, 0, 0)
COLOR_BORDER = (0, 0, 0)
COLOR_FILL = (255, 255, 255) # Pure white background for boxes
COLOR_FILL_GREY = (245, 245, 245) # Light gray for activation boxes / headers
COLOR_LINE = (0, 0, 0)

def draw_stick_figure(draw, x, y, name, font=font_normal):
    # Head
    draw.ellipse((x - 12, y - 40, x + 12, y - 16), outline=COLOR_LINE, fill=COLOR_BG, width=1)
    # Body
    draw.line((x, y - 16, x, y + 10), fill=COLOR_LINE, width=1)
    # Arms
    draw.line((x - 18, y - 8, x + 18, y - 8), fill=COLOR_LINE, width=1)
    # Legs
    draw.line((x, y + 10, x - 13, y + 30), fill=COLOR_LINE, width=1)
    draw.line((x, y + 10, x + 13, y + 30), fill=COLOR_LINE, width=1)
    # Name
    w = draw.textlength(name, font=font)
    draw.text((x - w / 2, y + 35), name, fill=COLOR_TEXT, font=font)

def draw_usecase(draw, x, y, text, font=font_normal):
    # Draw oval usecase (transparent/white background, black border)
    draw.ellipse((x - 90, y - 22, x + 90, y + 22), outline=COLOR_LINE, fill=COLOR_FILL, width=1)
    # Word wrapping text
    lines = text.split("\n")
    y_offset = y - (len(lines) * 8)
    for line in lines:
        w = draw.textlength(line, font=font)
        draw.text((x - w / 2, y_offset), line, fill=COLOR_TEXT, font=font)
        y_offset += 16

def draw_dashed_line(draw, x1, y1, x2, y2, fill=COLOR_LINE, width=1):
    dx = x2 - x1
    dy = y2 - y1
    dist = (dx**2 + dy**2)**0.5
    if dist == 0:
        return
    step = 6
    dashes = int(dist / step)
    for i in range(0, dashes, 2):
        px1 = x1 + (dx * i / dashes)
        py1 = y1 + (dy * i / dashes)
        px2 = x1 + (dx * (i + 1) / dashes)
        py2 = y1 + (dy * (i + 1) / dashes)
        draw.line((px1, py1, px2, py2), fill=fill, width=width)

def draw_arrow(draw, x1, y1, x2, y2, fill=COLOR_LINE, width=1, style="solid", is_return=False, relation_text=""):
    # Line
    if style == "solid":
        draw.line((x1, y1, x2, y2), fill=fill, width=width)
    else:
        draw_dashed_line(draw, x1, y1, x2, y2, fill=fill, width=width)
    
    # Arrow head
    import math
    angle = math.atan2(y2 - y1, x2 - x1)
    arrow_len = 8
    px1 = x2 - arrow_len * math.cos(angle - math.pi / 6)
    py1 = y2 - arrow_len * math.sin(angle - math.pi / 6)
    px2 = x2 - arrow_len * math.cos(angle + math.pi / 6)
    py2 = y2 - arrow_len * math.sin(angle + math.pi / 6)
    
    if is_return or style == "dashed":
        # Open arrow head (used for return messages or relations in usecases)
        draw.line((px1, py1, x2, y2), fill=fill, width=width)
        draw.line((px2, py2, x2, y2), fill=fill, width=width)
    else:
        # Closed arrow head (used for synchronous calls)
        draw.polygon([(x2, y2), (px1, py1), (px2, py2)], fill=fill, outline=fill)
        
    if relation_text:
        # Draw relation label like <<include>> or <<extend>>
        w = draw.textlength(relation_text, font=font_italic)
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2
        draw.text((mx - w / 2, my - 16), relation_text, fill=COLOR_TEXT, font=font_italic)

def draw_class(draw, x, y, name, attrs, methods, width=180, font_h=font_header, font_n=font_normal):
    h_header = 26
    h_attrs = len(attrs) * 16 + 6 if attrs else 6
    h_methods = len(methods) * 16 + 6 if methods else 6
    total_height = h_header + h_attrs + h_methods
    
    draw.rectangle((x, y, x + width, y + total_height), outline=COLOR_BORDER, fill=COLOR_FILL, width=1)
    draw.line((x, y + h_header, x + width, y + h_header), fill=COLOR_BORDER, width=1)
    draw.line((x, y + h_header + h_attrs, x + width, y + h_header + h_attrs), fill=COLOR_BORDER, width=1)
    
    w = draw.textlength(name, font=font_h)
    draw.text((x + (width - w) / 2, y + 4), name, fill=COLOR_TEXT, font=font_h)
    
    curr_y = y + h_header + 4
    for attr in attrs:
        draw.text((x + 6, curr_y), attr, fill=COLOR_TEXT, font=font_n)
        curr_y += 16
        
    curr_y = y + h_header + h_attrs + 4
    for method in methods:
        draw.text((x + 6, curr_y), method, fill=COLOR_TEXT, font=font_n)
        curr_y += 16

def draw_table_box(draw, x, y, name, cols, width=210, font_h=font_header, font_n=font_normal):
    h_header = 26
    h_cols = len(cols) * 16 + 6
    total_height = h_header + h_cols
    
    draw.rectangle((x, y, x + width, y + total_height), outline=COLOR_BORDER, fill=COLOR_FILL, width=1)
    draw.rectangle((x, y, x + width, y + h_header), outline=COLOR_BORDER, fill=COLOR_FILL_GREY, width=1)
    
    w = draw.textlength(name, font=font_h)
    draw.text((x + (width - w) / 2, y + 4), name, fill=COLOR_TEXT, font=font_h)
    
    curr_y = y + h_header + 4
    for col in cols:
        draw.text((x + 6, curr_y), col, fill=COLOR_TEXT, font=font_n)
        curr_y += 16

# 1. uc_general.png
def make_uc_general():
    img = Image.new("RGB", (900, 600), COLOR_BG)
    draw = ImageDraw.Draw(img)
    draw.rectangle((200, 30, 680, 570), outline=COLOR_BORDER, width=2)
    w = draw.textlength("Showroom TQ Auto System", font=font_title)
    draw.text((440 - w / 2, 8), "Showroom TQ Auto System", fill=COLOR_TEXT, font=font_title)
    
    draw_stick_figure(draw, 100, 150, "Khách hàng")
    draw_stick_figure(draw, 100, 420, "Nhân viên")
    draw_stick_figure(draw, 780, 280, "Quản trị viên")
    
    usecases = [
        (440, 70, "Đăng ký & Đăng nhập"),
        (440, 130, "Xem xe & Lọc tìm kiếm"),
        (440, 190, "Xem chi tiết xe"),
        (440, 250, "Đặt lịch xem xe"),
        (440, 310, "Gửi thông tin tư vấn"),
        (440, 370, "Quản lý xe ô tô"),
        (440, 430, "Quản lý khách hàng CRM"),
        (440, 490, "Quản lý lịch hẹn"),
        (440, 540, "Xem báo cáo thống kê")
    ]
    
    for x, y, label in usecases:
        draw_usecase(draw, x, y, label)
        
    # Customer connections
    for y in [70, 130, 190, 250, 310]:
        draw.line((120, 150, 350, y), fill=COLOR_LINE, width=1)
    # Staff connections
    for y in [70, 310, 430, 490]:
        draw.line((120, 420, 350, y), fill=COLOR_LINE, width=1)
    # Admin connections
    for y in [70, 370, 430, 490, 540]:
        draw.line((760, 280, 530, y), fill=COLOR_LINE, width=1)
        
    img.save(OUT_DIR / "uc_general.png")

# Sub usecases
def make_uc_sub(filename, actor_name, title, uc_center_label, sub_relations):
    img = Image.new("RGB", (700, 500), COLOR_BG)
    draw = ImageDraw.Draw(img)
    
    w = draw.textlength(title, font=font_title)
    draw.text((350 - w / 2, 15), title, fill=COLOR_TEXT, font=font_title)
    
    draw_stick_figure(draw, 100, 250, actor_name)
    
    # Center Usecase
    cx, cy = 350, 250
    draw_usecase(draw, cx, cy, uc_center_label)
    draw.line((120, 250, cx - 90, cy), fill=COLOR_LINE, width=1)
    
    # Sub usecases
    for idx, (sub_label, rel_type, sx, sy) in enumerate(sub_relations):
        draw_usecase(draw, sx, sy, sub_label)
        if rel_type == "include":
            draw_arrow(draw, cx + 50 if sx > cx else cx - 50, cy + 15 if sy > cy else cy - 15, sx - 90 if sx > cx else sx + 90, sy, style="dashed", relation_text="<<include>>")
        elif rel_type == "extend":
            draw_arrow(draw, sx - 50 if sx > cx else sx + 50, sy + 15 if sy > cy else sy - 15, cx + 90 if sx > cx else cx - 90, cy, style="dashed", relation_text="<<extend>>")
        elif rel_type == "associate":
            draw.line((120, 250, sx - 90 if sx > cx else sx + 90, sy), fill=COLOR_LINE, width=1)
            
    img.save(OUT_DIR / filename)

# Template function to generate sequence diagrams
def make_seq_diagram(filename, actor_name, uc_title, steps):
    img = Image.new("RGB", (800, 500), COLOR_BG)
    draw = ImageDraw.Draw(img)
    
    w = draw.textlength(uc_title, font=font_title)
    draw.text((400 - w / 2, 15), uc_title, fill=COLOR_TEXT, font=font_title)
    
    cols = ["Actor: " + actor_name, "Boundary: Giao diện", "Control: Controller", "Entity: Database"]
    x_positions = [100, 300, 500, 700]
    
    # Draw lifelines heads
    for label, x in zip(cols, x_positions):
        w = draw.textlength(label, font=font_header)
        draw.rectangle((x - w / 2 - 8, 55, x + w / 2 + 8, 85), outline=COLOR_BORDER, fill=COLOR_FILL_GREY, width=1)
        draw.text((x - w / 2, 62), label, fill=COLOR_TEXT, font=font_header)
        draw_dashed_line(draw, x, 85, x, 450, fill=COLOR_LINE, width=1)
        
    # Draw activation boxes
    for x in x_positions:
        draw.rectangle((x - 5, 110, x + 5, 420), outline=COLOR_BORDER, fill=COLOR_FILL_GREY)
        
    # Draw messages
    curr_y = 120
    for idx, (from_col, to_col, msg, is_dashed, is_ret) in enumerate(steps):
        x1 = x_positions[from_col]
        x2 = x_positions[to_col]
        style = "dashed" if is_dashed else "solid"
        draw_arrow(draw, x1, curr_y, x2, curr_y, fill=COLOR_LINE, width=1, style=style, is_return=is_ret)
        w = draw.textlength(msg, font=font_normal)
        draw.text(((x1 + x2) / 2 - w / 2, curr_y - 16), msg, fill=COLOR_TEXT, font=font_normal)
        curr_y += 50
        
    img.save(OUT_DIR / filename)

# Template function to generate class diagrams
def make_class_diagram(filename, classes):
    img = Image.new("RGB", (800, 400), COLOR_BG)
    draw = ImageDraw.Draw(img)
    
    for c_info in classes:
        name = c_info["name"]
        x = c_info["x"]
        y = c_info["y"]
        w = c_info.get("w", 180)
        attrs = c_info["attrs"]
        methods = c_info["methods"]
        draw_class(draw, x, y, name, attrs, methods, width=w)
        
    # Draw associations
    if len(classes) == 3:
        cx1 = classes[0]["x"] + classes[0].get("w", 180)
        cy1 = classes[0]["y"] + 35
        cx2 = classes[1]["x"]
        cy2 = classes[1]["y"] + 35
        draw_arrow(draw, cx1, cy1, cx2, cy2, fill=COLOR_LINE, width=1, is_return=False)
        
        cx3 = classes[1]["x"] + classes[1].get("w", 180)
        cy3 = classes[1]["y"] + 35
        cx4 = classes[2]["x"]
        cy4 = classes[2]["y"] + 35
        draw_arrow(draw, cx3, cy3, cx4, cy4, fill=COLOR_LINE, width=1, is_return=False)
        
    img.save(OUT_DIR / filename)

def generate_all_uml():
    print("Generating Usecase Diagrams...")
    make_uc_general()
    
    # uc_login.png
    make_uc_sub("uc_login.png", "Người dùng", "Biểu đồ Use Case: Đăng nhập", "Đăng nhập\n(F04)", [
        ("Quên mật khẩu", "extend", 540, 160),
        ("Đổi mật khẩu", "extend", 540, 320)
    ])
    
    # uc_view_car.png
    make_uc_sub("uc_view_car.png", "Khách hàng", "Biểu đồ Use Case: Tra cứu & Lọc xe", "Xem danh sách xe\n(F01)", [
        ("Tìm kiếm & Lọc xe\n(F02)", "extend", 540, 150),
        ("Xem chi tiết xe\n(F03)", "include", 540, 330)
    ])
    
    # uc_appointment.png
    make_uc_sub("uc_appointment.png", "Khách hàng", "Biểu đồ Use Case: Đặt lịch xem xe", "Đặt lịch xem xe\n(F05)", [
        ("Hủy lịch hẹn", "extend", 540, 250)
    ])
    
    # uc_manage_car.png
    make_uc_sub("uc_manage_car.png", "Quản trị viên", "Biểu đồ Use Case: Quản lý xe", "Quản lý xe\n(F06)", [
        ("Thêm xe mới", "include", 540, 120),
        ("Sửa đổi xe", "include", 540, 250),
        ("Xóa xe", "include", 540, 380)
    ])
    
    # uc_crm.png
    make_uc_sub("uc_crm.png", "Nhân viên", "Biểu đồ Use Case: Quản lý khách hàng CRM", "Quản lý CRM\n(F07)", [
        ("Cập nhật tiến trình", "include", 540, 180),
        ("Thêm ghi chú CSKH", "include", 540, 320)
    ])
    
    # uc_lead.png
    make_uc_sub("uc_lead.png", "Nhân viên", "Biểu đồ Use Case: Quản lý Lead", "Quản lý Lead\n(F08)", [
        ("Tiếp nhận yêu cầu", "include", 540, 180),
        ("Phân phối nhân viên", "include", 540, 320)
    ])
    
    # uc_chat.png
    make_uc_sub("uc_chat.png", "Người dùng", "Biểu đồ Use Case: Chat trực tuyến", "Chat trực tuyến\n(F10)", [
        ("Gửi tin nhắn", "include", 540, 180),
        ("Nhận tin nhắn", "include", 540, 320)
    ])
    
    # uc_analytics.png
    make_uc_sub("uc_analytics.png", "Quản trị viên", "Biểu đồ Use Case: Thống kê báo cáo", "Xem báo cáo\n(F11)", [
        ("Thống kê doanh thu", "include", 540, 180),
        ("Thống kê tồn kho", "include", 540, 320)
    ])
    
    # uc_news.png
    make_uc_sub("uc_news.png", "Quản trị viên", "Biểu đồ Use Case: Quản lý tin tức", "Quản lý bài viết\n(F12)", [
        ("Thêm bài viết", "include", 540, 180),
        ("Chỉnh sửa nháp", "include", 540, 320)
    ])
    
    # uc_profile.png
    make_uc_sub("uc_profile.png", "Người dùng", "Biểu đồ Use Case: Hồ sơ cá nhân", "Hồ sơ cá nhân", [
        ("Xem thông tin", "include", 540, 180),
        ("Cập nhật hồ sơ", "include", 540, 320)
    ])

    print("Generating Sequence & Class Diagrams...")
    # 1. Đăng ký
    make_seq_diagram("seq_register.png", "Khách hàng", "Biểu đồ tuần tự: Đăng ký", [
        (0, 1, "1. Nhập thông tin tài khoản, bấm Đăng ký", False, False),
        (1, 2, "2. Gửi request POST /api/register", False, False),
        (2, 3, "3. Kiểm tra trùng lặp email (users)", False, False),
        (3, 2, "4. Trả về kết quả xác minh", True, True),
        (2, 1, "5. INSERT INTO users & Tạo session", True, True),
        (1, 0, "6. Thông báo thành công & Chuyển hướng", True, True)
    ])
    make_class_diagram("class_register.png", [
        {"name": "RegisterForm (Boundary)", "x": 50, "y": 100, "attrs": ["- nameField", "- emailField", "- phoneField"], "methods": ["+ onRegister()", "+ showDuplicateErr()"]},
        {"name": "RegisterActions (Control)", "x": 300, "y": 80, "attrs": [], "methods": ["+ checkEmail()", "+ registerUser()"]},
        {"name": "DbUser (Entity)", "x": 560, "y": 100, "attrs": ["- id: uuid", "- email: varchar", "- phone: varchar"], "methods": ["+ create()", "+ checkExist()"]}
    ])

    # 2. Đăng nhập
    make_seq_diagram("seq_login.png", "Người dùng", "Biểu đồ tuần tự: Đăng nhập", [
        (0, 1, "1. Nhập email/mật khẩu, bấm Đăng nhập", False, False),
        (1, 2, "2. Gửi request POST /api/login", False, False),
        (2, 3, "3. SELECT FROM users WHERE email", False, False),
        (3, 2, "4. Trả về mật khẩu băm", True, True),
        (2, 1, "5. Đối sánh hash & sinh JWT cookie", True, True),
        (1, 0, "6. Đăng nhập thành công, chuyển trang", True, True)
    ])
    make_class_diagram("class_login.png", [
        {"name": "LoginForm (Boundary)", "x": 50, "y": 100, "attrs": ["- emailField", "- passwordField"], "methods": ["+ onSubmit()", "+ displayError()"]},
        {"name": "AuthActions (Control)", "x": 300, "y": 80, "attrs": [], "methods": ["+ handleLogin()", "+ checkToken()"]},
        {"name": "DbUser (Entity)", "x": 560, "y": 100, "attrs": ["- id: uuid", "- passwordHash: varchar"], "methods": ["+ findByEmail()", "+ updateLoginTime()"]}
    ])

    # 3. Tra cứu lọc xe
    make_seq_diagram("seq_search_cars.png", "Khách hàng", "Biểu đồ tuần tự: Tra cứu & Lọc xe", [
        (0, 1, "1. Nhập từ khóa, chọn bộ lọc hãng/giá", False, False),
        (1, 2, "2. Gửi params bộ lọc lên server", False, False),
        (2, 3, "3. Query xe theo các điều kiện lọc (cars)", False, False),
        (3, 2, "4. Trả về mảng dữ liệu xe", True, True),
        (2, 1, "5. Render danh sách xe tĩnh", True, True),
        (1, 0, "6. Cập nhật giao diện lưới xe", True, True)
    ])
    make_class_diagram("class_search_cars.png", [
        {"name": "CarsPage (Boundary)", "x": 50, "y": 100, "attrs": ["- filterBrand", "- priceRange"], "methods": ["+ onFilterChange()", "+ renderList()"]},
        {"name": "CarActions (Control)", "x": 300, "y": 80, "attrs": [], "methods": ["+ getFilteredCars()"]},
        {"name": "DbCar (Entity)", "x": 560, "y": 100, "attrs": ["- brand: varchar", "- price: bigint", "- status: enum"], "methods": ["+ queryFiltered()"]}
    ])

    # 4. Xem chi tiết xe
    make_seq_diagram("seq_view_car.png", "Khách hàng", "Biểu đồ tuần tự: Xem chi tiết xe", [
        (0, 1, "1. Click vào hình ảnh / thẻ xe", False, False),
        (1, 2, "2. Gửi request GET /cars/[id]", False, False),
        (2, 3, "3. SELECT FROM cars JOIN car_images", False, False),
        (3, 2, "4. Trả về thông tin xe & ảnh gallery", True, True),
        (2, 1, "5. Tăng lượt xem & render layout", True, True),
        (1, 0, "6. Hiển thị thông số & ảnh chi tiết", True, True)
    ])
    make_class_diagram("class_view_car.png", [
        {"name": "CarDetailPage (Boundary)", "x": 50, "y": 100, "attrs": ["- carId", "- activeImageIdx"], "methods": ["+ renderDetail()", "+ selectImage()"]},
        {"name": "CarActions (Control)", "x": 300, "y": 80, "attrs": [], "methods": ["+ getCarById()", "+ incrementViews()"]},
        {"name": "DbCar & DbCarImage (Entity)", "x": 560, "y": 100, "attrs": ["- title: string", "- description: text", "- image_url: text"], "methods": ["+ findWithImages()"]}
    ])

    # 5. Đặt lịch xem xe
    make_seq_diagram("seq_appointment.png", "Khách hàng", "Biểu đồ tuần tự: Đặt lịch xem xe", [
        (0, 1, "1. Chọn ngày giờ, điền thông tin liên hệ", False, False),
        (1, 2, "2. Gọi Server Action (createAppointment)", False, False),
        (2, 3, "3. INSERT INTO appointments", False, False),
        (3, 2, "4. Trả về kết quả thành công", True, True),
        (2, 1, "5. Tạo notification & Gửi email xác nhận", True, True),
        (1, 0, "6. Hiển thị modal đặt lịch thành công", True, True)
    ])
    make_class_diagram("class_appointment.png", [
        {"name": "AppointmentForm (Boundary)", "x": 50, "y": 100, "attrs": ["- dateField", "- phoneField", "- noteField"], "methods": ["+ submitAppointment()", "+ validate()"]},
        {"name": "AppointmentActions (Control)", "x": 300, "y": 80, "attrs": [], "methods": ["+ createAppointment()", "+ sendNotification()"]},
        {"name": "DbAppointment (Entity)", "x": 560, "y": 100, "attrs": ["- id: uuid", "- customer_name: varchar", "- appointment_date: timestamp"], "methods": ["+ insert()"]}
    ])

    # 6. Gửi yêu cầu tư vấn
    make_seq_diagram("seq_submit_lead.png", "Khách hàng", "Biểu đồ tuần tự: Gửi yêu cầu tư vấn", [
        (0, 1, "1. Điền form liên hệ nhận tư vấn", False, False),
        (1, 2, "2. Gọi action createContactRequest", False, False),
        (2, 3, "3. INSERT INTO contact_requests & customers", False, False),
        (3, 2, "4. Trả về kết quả thành công", True, True),
        (2, 1, "5. Tạo Lead chăm sóc trong CRM", True, True),
        (1, 0, "6. Báo gửi yêu cầu tư vấn thành công", True, True)
    ])
    make_class_diagram("class_submit_lead.png", [
        {"name": "ContactForm (Boundary)", "x": 50, "y": 100, "attrs": ["- nameInput", "- phoneInput", "- messageInput"], "methods": ["+ submitContact()", "+ validateForm()"]},
        {"name": "ContactActions (Control)", "x": 300, "y": 80, "attrs": [], "methods": ["+ createContact()", "+ linkToCustomer()"]},
        {"name": "DbContactRequest (Entity)", "x": 560, "y": 100, "attrs": ["- id: uuid", "- full_name: varchar", "- consultation_type: varchar"], "methods": ["+ insert()"]}
    ])

    # 7. Quản lý xe (Admin)
    make_seq_diagram("seq_manage_car.png", "Quản trị viên", "Biểu đồ tuần tự: Quản lý xe", [
        (0, 1, "1. Điền thông tin xe mới & tải ảnh", False, False),
        (1, 2, "2. Gửi form data (addCar action)", False, False),
        (2, 3, "3. INSERT INTO cars & car_images", False, False),
        (3, 2, "4. Trả về kết quả thành công", True, True),
        (2, 1, "5. Gọi revalidatePath() cập nhật cache", True, True),
        (1, 0, "6. Cập nhật bảng xe & báo thành công", True, True)
    ])
    make_class_diagram("class_manage_car.png", [
        {"name": "AdminCarsPage (Boundary)", "x": 50, "y": 100, "attrs": ["- carListTable", "- addCarModal"], "methods": ["+ openModal()", "+ confirmDelete()"]},
        {"name": "AdminCarActions (Control)", "x": 300, "y": 80, "attrs": [], "methods": ["+ addCar()", "+ updateCar()", "+ deleteCar()"]},
        {"name": "DbCar (Entity)", "x": 560, "y": 100, "attrs": ["- id: uuid", "- title: varchar", "- status: enum"], "methods": ["+ insert()", "+ update()", "+ delete()"]}
    ])

    # 8. Quản lý lịch hẹn
    make_seq_diagram("seq_manage_appts.png", "Nhân viên", "Biểu đồ tuần tự: Quản lý lịch hẹn", [
        (0, 1, "1. Click chọn phê duyệt lịch hẹn", False, False),
        (1, 2, "2. Gọi action updateAppointmentStatus", False, False),
        (2, 3, "3. UPDATE appointments SET status", False, False),
        (3, 2, "4. Trả về xác nhận thành công", True, True),
        (2, 1, "5. Tạo thông báo & gửi mail thông báo khách", True, True),
        (1, 0, "6. Cập nhật trạng thái lịch biểu trên bảng", True, True)
    ])
    make_class_diagram("class_manage_appts.png", [
        {"name": "AdminApptsPage (Boundary)", "x": 50, "y": 100, "attrs": ["- apptsTable", "- filterStatus"], "methods": ["+ onStatusChange()", "+ openApptDetail()"]},
        {"name": "ApptActions (Control)", "x": 300, "y": 80, "attrs": [], "methods": ["+ updateApptStatus()", "+ sendApptEmail()"]},
        {"name": "DbAppointment (Entity)", "x": 560, "y": 100, "attrs": ["- id: uuid", "- status: enum"], "methods": ["+ updateStatus()"]}
    ])

    # 9. Quản lý khách hàng CRM
    make_seq_diagram("seq_crm.png", "Nhân viên", "Biểu đồ tuần tự: Quản lý khách hàng CRM", [
        (0, 1, "1. Chọn khách hàng, ghi chú CSKH", False, False),
        (1, 2, "2. Gọi action updateCustomerStage", False, False),
        (2, 3, "3. UPDATE customers & INSERT customer_notes", False, False),
        (3, 2, "4. Xác nhận lưu ghi chú thành công", True, True),
        (2, 1, "5. Cập nhật trạng thái CRM", True, True),
        (1, 0, "6. Hiển thị timeline chăm sóc mới", True, True)
    ])
    make_class_diagram("class_crm.png", [
        {"name": "CustomerCRMDetails (Boundary)", "x": 50, "y": 100, "attrs": ["- crmStages", "- noteTextArea"], "methods": ["+ onStageChange()", "+ addNote()"]},
        {"name": "CRMActions (Control)", "x": 300, "y": 80, "attrs": [], "methods": ["+ updateStage()", "+ addCustomerNote()"]},
        {"name": "DbCustomer & Note (Entity)", "x": 560, "y": 100, "attrs": ["- budget: string", "- stage: enum", "- noteContent: text"], "methods": ["+ update()", "+ insertNote()"]}
    ])

    # 10. Xem thống kê báo cáo
    make_seq_diagram("seq_analytics.png", "Quản trị viên", "Biểu đồ tuần tự: Xem báo cáo thống kê", [
        (0, 1, "1. Mở trang Báo cáo thống kê", False, False),
        (1, 2, "2. Gửi request getAnalyticsData", False, False),
        (2, 3, "3. Query thống kê (cars, customers, appts)", False, False),
        (3, 2, "4. Trả về số liệu tổng hợp", True, True),
        (2, 1, "5. Xử lý định dạng dữ liệu cho biểu đồ", True, True),
        (1, 0, "6. Vẽ biểu đồ Recharts (Doanh số, hãng xe)", True, True)
    ])
    make_class_diagram("class_analytics.png", [
        {"name": "AnalyticsDashboard (Boundary)", "x": 50, "y": 100, "attrs": ["- datePicker", "- chartsGrid"], "methods": ["+ renderCharts()", "+ setRange()"]},
        {"name": "AnalyticsActions (Control)", "x": 300, "y": 80, "attrs": [], "methods": ["+ getSummaryMetrics()", "+ getRevenueByMonth()"]},
        {"name": "DbAnalyticsQuery (Entity)", "x": 560, "y": 100, "attrs": ["- totalRevenue", "- soldCarsCount"], "methods": ["+ executeRawStats()"]}
    ])

# 17. erd.png
def make_erd():
    img = Image.new("RGB", (1000, 850), COLOR_BG)
    draw = ImageDraw.Draw(img)
    
    w = draw.textlength("Sơ đồ quan hệ thực thể (ERD) - TQ Auto Database", font=font_title)
    draw.text((500 - w / 2, 15), "Sơ đồ quan hệ thực thể (ERD) - TQ Auto Database", fill=COLOR_TEXT, font=font_title)
    
    # Bảng 1: users
    draw_table_box(draw, 50, 80, "users", [
        "PK id: varchar(36)",
        "   full_name: varchar(255)",
        "   email: varchar(255)",
        "   phone: varchar(50)",
        "   password: varchar(255)",
        "   role: enum('admin','staff','cust')",
        "   status: enum('active','blocked')"
    ])
    
    # Bảng 2: cars
    draw_table_box(draw, 380, 80, "cars", [
        "PK id: varchar(36)",
        "FK user_id: varchar(36)",
        "   title: varchar(255)",
        "   brand: varchar(100)",
        "   price: bigint",
        "   year: int",
        "   mileage: int",
        "   transmission: varchar(50)",
        "   status: enum('avail','res','sold','hid')",
        "   car_condition: enum('new','used')"
    ])
    
    # Bảng 3: car_images
    draw_table_box(draw, 720, 80, "car_images", [
        "PK id: varchar(36)",
        "FK car_id: varchar(36)",
        "   image_url: text",
        "   sort_order: int"
    ])
    
    # Bảng 4: appointments
    draw_table_box(draw, 720, 240, "appointments", [
        "PK id: varchar(36)",
        "FK car_id: varchar(36)",
        "FK user_id: varchar(36)",
        "   customer_name: varchar(255)",
        "   customer_phone: varchar(50)",
        "   customer_email: varchar(255)",
        "   appointment_date: timestamp",
        "   status: enum('pend','conf','canc','comp')"
    ])
    
    # Bảng 5: customers
    draw_table_box(draw, 380, 360, "customers", [
        "PK id: varchar(36)",
        "   full_name: varchar(255)",
        "   phone: varchar(50)",
        "   email: varchar(255)",
        "FK interested_car_id: varchar(36)",
        "   budget: varchar(100)",
        "   stage: enum('new_lead','consult',...)",
        "FK assigned_staff_id: varchar(36)",
        "   status: enum('active','inactive')"
    ], width=250)
    
    # Bảng 6: customer_notes
    draw_table_box(draw, 50, 420, "customer_notes", [
        "PK id: varchar(36)",
        "FK customer_id: varchar(36)",
        "FK staff_id: varchar(36)",
        "   content: text"
    ])
    
    # Bảng 7: contact_requests (Leads)
    draw_table_box(draw, 720, 480, "contact_requests", [
        "PK id: varchar(36)",
        "   full_name: varchar(255)",
        "   phone: varchar(50)",
        "   email: varchar(255)",
        "   consultation_type: varchar(100)",
        "   message: text",
        "FK assigned_staff_id: varchar(36)",
        "   stage: enum('new_lead','assigned',...)"
    ])
    
    # Bảng 8: chat_messages
    draw_table_box(draw, 50, 280, "chat_messages", [
        "PK id: varchar(36)",
        "   session_id: varchar(50)",
        "   sender_role: enum('cust','staff')",
        "   sender_name: varchar(255)",
        "   message_text: text"
    ])
    
    # Bảng 9: notifications
    draw_table_box(draw, 50, 600, "notifications", [
        "PK id: varchar(36)",
        "FK user_id: varchar(36)",
        "   title: varchar(255)",
        "   content: text"
    ])
    
    # Draw relationships
    draw.line((260, 150, 380, 150), fill=COLOR_LINE, width=1)
    draw.line((590, 120, 720, 120), fill=COLOR_LINE, width=1)
    draw.line((590, 180, 700, 180), fill=COLOR_LINE, width=1)
    draw.line((700, 180, 700, 280), fill=COLOR_LINE, width=1)
    draw.line((700, 280, 720, 280), fill=COLOR_LINE, width=1)
    draw.line((490, 290, 490, 360), fill=COLOR_LINE, width=1)
    draw.line((160, 250, 160, 380), fill=COLOR_LINE, width=1)
    draw.line((160, 380, 380, 380), fill=COLOR_LINE, width=1)
    draw.line((380, 450, 260, 450), fill=COLOR_LINE, width=1)
    draw.line((120, 250, 120, 420), fill=COLOR_LINE, width=1)
    draw.line((200, 250, 200, 520), fill=COLOR_LINE, width=1)
    draw.line((200, 520, 720, 520), fill=COLOR_LINE, width=1)
    draw.line((100, 250, 100, 600), fill=COLOR_LINE, width=1)
    
    img.save(OUT_DIR / "erd.png")

# 18. navigation_chart.png
def make_navigation_chart():
    img = Image.new("RGB", (900, 500), COLOR_BG)
    draw = ImageDraw.Draw(img)
    
    w = draw.textlength("Sơ đồ điều hướng màn hình - TQ Auto", font=font_title)
    draw.text((450 - w / 2, 15), "Sơ đồ điều hướng màn hình - TQ Auto", fill=COLOR_TEXT, font=font_title)
    
    pages = {
        "home": (360, 80, 180, 50, "Trang chủ\n(Home Page)"),
        "cars": (100, 180, 180, 50, "Danh sách xe\n(Cars Listing)"),
        "detail": (100, 280, 180, 50, "Chi tiết xe\n(Car Details)"),
        "appointment": (100, 380, 180, 50, "Đặt lịch xem xe\n(Booking Form)"),
        "login": (360, 180, 180, 50, "Đăng ký / Đăng nhập\n(Auth Gate)"),
        "contact": (620, 180, 180, 50, "Liên hệ tư vấn\n(Contact Page)"),
        "admin": (360, 280, 180, 50, "Dashboard Admin\n(analytics, cars, cust)"),
        "staff": (620, 280, 180, 50, "Dashboard Nhân viên\n(leads, chat, CRM)")
    }
    
    for key, (x, y, w, h, label) in pages.items():
        draw.rectangle((x, y, x + w, y + h), outline=COLOR_BORDER, fill=COLOR_FILL, width=1)
        lines = label.split("\n")
        y_offset = y + 10
        for line in lines:
            w_text = draw.textlength(line, font=font_normal)
            draw.text((x + (w - w_text) / 2, y_offset), line, fill=COLOR_TEXT, font=font_normal)
            y_offset += 16
            
    draw_arrow(draw, 360, 105, 280, 180, fill=COLOR_LINE, width=2)
    draw_arrow(draw, 450, 130, 450, 180, fill=COLOR_LINE, width=2)
    draw_arrow(draw, 540, 105, 620, 180, fill=COLOR_LINE, width=2)
    draw_arrow(draw, 190, 230, 190, 280, fill=COLOR_LINE, width=2)
    draw_arrow(draw, 190, 330, 190, 380, fill=COLOR_LINE, width=2)
    draw_arrow(draw, 450, 230, 450, 280, fill=COLOR_LINE, width=2)
    draw_arrow(draw, 540, 230, 620, 280, fill=COLOR_LINE, width=2)
    
    img.save(OUT_DIR / "navigation_chart.png")

if __name__ == "__main__":
    generate_all_uml()
    make_erd()
    make_navigation_chart()
    print("All 33 grayscale diagrams generated successfully!")
