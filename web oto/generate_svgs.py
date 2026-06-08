import os

def create_sequence_svg(filepath, title, lifelines, steps):
    # Dynamic height calculation based on number of steps
    num_steps = len(steps)
    step_height = 48
    header_height = 145
    lifeline_start_y = 135
    lifeline_end_y = header_height + (num_steps + 1) * step_height
    total_height = lifeline_end_y + 35
    
    # Width and horizontal position calculation
    total_width = 900
    margin = 120
    num_lifelines = len(lifelines)
    if num_lifelines > 1:
        x_step = (total_width - 2 * margin) / (num_lifelines - 1)
    else:
        x_step = 0
        
    x_positions = [int(margin + i * x_step) for i in range(num_lifelines)]
    
    # Calculate activation boxes for each lifeline (except Actor/index 0, usually)
    # We find the first and last step where the lifeline is targeted or initiates a call
    activation_boxes = {}
    for l_idx in range(1, num_lifelines):
        first_step = None
        last_step = None
        for s_idx, step in enumerate(steps):
            from_col = step["from_col"]
            to_col = step["to_col"]
            is_ret = step.get("is_ret", False)
            
            # Lifeline receives a call or returns a call
            if to_col == l_idx or from_col == l_idx:
                if first_step is None:
                    first_step = s_idx
                last_step = s_idx
                
        if first_step is not None:
            y_start = header_height + first_step * step_height + 15
            y_end = header_height + last_step * step_height + 25
            if steps[last_step].get("is_self", False):
                y_end += 20
            activation_boxes[l_idx] = (y_start, y_end - y_start)

    svg_content = []
    # SVG Header
    svg_content.append(f'<?xml version="1.0" encoding="UTF-8" standalone="no"?>')
    svg_content.append(f'<svg width="{total_width}" height="{total_height}" viewBox="0 0 {total_width} {total_height}" xmlns="http://www.w3.org/2000/svg">')
    
    # Definitions (marker arrows)
    svg_content.append('  <defs>')
    svg_content.append('    <marker id="sync-arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">')
    svg_content.append('      <path d="M 0 0 L 10 5 L 0 10 z" fill="#000000" />')
    svg_content.append('    </marker>')
    svg_content.append('    <marker id="return-arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">')
    svg_content.append('      <path d="M 0 1.5 L 8.5 5 L 0 8.5" fill="none" stroke="#000000" stroke-width="1.5" />')
    svg_content.append('    </marker>')
    svg_content.append('  </defs>')
    
    # Background
    svg_content.append(f'  <rect width="{total_width}" height="{total_height}" fill="#ffffff" />')
    
    # Title
    svg_content.append(f'  <text x="{total_width // 2}" y="35" text-anchor="middle" font-family="Times New Roman, Arial, sans-serif" font-size="20" font-weight="bold" fill="#000000">{title}</text>')
    
    # Draw Lifelines (Dashed lines & BCE Icons)
    for idx, (label, bce_type) in enumerate(lifelines):
        x = x_positions[idx]
        
        # Split label by newline for multi-line support
        label_lines = label.split('\n')
        l_start_y = 145 if len(label_lines) > 1 else 135
        
        # Dashed line
        svg_content.append(f'  <line x1="{x}" y1="{l_start_y}" x2="{x}" y2="{lifeline_end_y}" stroke="#000000" stroke-width="1" stroke-dasharray="6,6" />')
        
        # BCE Icon Drawing (y-center of icons is around 80)
        if bce_type == 'actor':
            # Stick figure
            svg_content.append(f'  <!-- Actor Icon: {label_lines[0]} -->')
            svg_content.append(f'  <circle cx="{x}" cy="65" r="10" fill="#ffffff" stroke="#000000" stroke-width="1.5" />') # Head
            svg_content.append(f'  <line x1="{x}" y1="75" x2="{x}" y2="98" stroke="#000000" stroke-width="1.5" />') # Body
            svg_content.append(f'  <line x1="{x-15}" y1="82" x2="{x+15}" y2="82" stroke="#000000" stroke-width="1.5" />') # Arms
            svg_content.append(f'  <line x1="{x}" y1="98" x2="{x-10}" y2="118" stroke="#000000" stroke-width="1.5" />') # Left Leg
            svg_content.append(f'  <line x1="{x}" y1="98" x2="{x+10}" y2="118" stroke="#000000" stroke-width="1.5" />') # Right Leg
        elif bce_type == 'boundary':
            # Circle with horizontal connector and vertical line on left ( |o )
            svg_content.append(f'  <!-- Boundary Icon: {label_lines[0]} -->')
            svg_content.append(f'  <circle cx="{x}" cy="80" r="15" fill="#ffffff" stroke="#000000" stroke-width="1.5" />')
            svg_content.append(f'  <line x1="{x-22}" y1="65" x2="{x-22}" y2="95" stroke="#000000" stroke-width="1.5" />')
            svg_content.append(f'  <line x1="{x-22}" y1="80" x2="{x-15}" y2="80" stroke="#000000" stroke-width="1.5" />')
        elif bce_type == 'control':
            # Circle with a circular arrow on top right
            svg_content.append(f'  <!-- Control Icon: {label_lines[0]} -->')
            svg_content.append(f'  <circle cx="{x}" cy="80" r="15" fill="#ffffff" stroke="#000000" stroke-width="1.5" />')
            svg_content.append(f'  <path d="M {x} 65 A 15 15 0 0 1 {x+13} 73" fill="none" stroke="#000000" stroke-width="1.5" />')
            svg_content.append(f'  <path d="M {x+9} 74 L {x+14} 72 L {x+13} 67 Z" fill="#000000" stroke="#000000" stroke-width="1" />')
        elif bce_type == 'entity':
            # Circle sitting on a horizontal line ( o_ )
            svg_content.append(f'  <!-- Entity Icon: {label_lines[0]} -->')
            svg_content.append(f'  <circle cx="{x}" cy="75" r="15" fill="#ffffff" stroke="#000000" stroke-width="1.5" />')
            svg_content.append(f'  <line x1="{x-18}" y1="98" x2="{x+18}" y2="98" stroke="#000000" stroke-width="1.5" />')
            svg_content.append(f'  <line x1="{x}" y1="90" x2="{x}" y2="98" stroke="#000000" stroke-width="1.5" />')
            
        # Label below the icon
        for line_idx, line in enumerate(label_lines):
            y_offset = 125 + line_idx * 14 if len(label_lines) > 1 else 132
            svg_content.append(f'  <text x="{x}" y="{y_offset}" text-anchor="middle" font-family="Times New Roman, Arial, sans-serif" font-size="11" font-weight="bold" fill="#000000">{line}</text>')
        
    # Draw Activation Boxes
    svg_content.append('  <!-- Activation Boxes -->')
    for l_idx, (y_start, height) in activation_boxes.items():
        x = x_positions[l_idx]
        svg_content.append(f'  <rect x="{x-5}" y="{y_start}" width="10" height="{height}" fill="#f5f5f5" stroke="#000000" stroke-width="1" />')
        
    # Draw Steps (Messages)
    svg_content.append('  <!-- Messages -->')
    for s_idx, step in enumerate(steps):
        from_col = step["from_col"]
        to_col = step["to_col"]
        label = step["label"]
        is_dashed = step.get("is_dashed", False)
        is_ret = step.get("is_ret", False)
        is_self = step.get("is_self", False)
        
        y = header_height + s_idx * step_height + 20
        
        x1 = x_positions[from_col]
        x2 = x_positions[to_col]
        
        dashed_attr = 'stroke-dasharray="5,5"' if is_dashed else ''
        marker_type = 'return-arrow' if is_ret else 'sync-arrow'
        
        if is_self:
            # Self call loop (drawn on the right side of the lifeline)
            # Starts at x1+5, loops out to x1+35, comes back to x1+5
            svg_content.append(f'  <!-- Self call message {s_idx + 1} -->')
            svg_content.append(f'  <path d="M {x1+5} {y} L {x1+35} {y} L {x1+35} {y+18} L {x1+5} {y+18}" fill="none" stroke="#000000" stroke-width="1.2" {dashed_attr} marker-end="url(#{marker_type})" />')
            svg_content.append(f'  <text x="{x1+40}" y="{y+12}" text-anchor="start" font-family="Arial, sans-serif" font-size="11" fill="#000000">{label}</text>')
        else:
            # Message from lifeline to lifeline
            # Adjust start/end points to touch the edge of activation boxes
            x_start = x1 + 5 if x2 > x1 else x1 - 5
            x_end = x2 - 5 if x2 > x1 else x2 + 5
            
            # If from Actor (index 0), start directly from centerline
            if from_col == 0:
                x_start = x1
                
            # If to Actor (index 0), end directly at centerline
            if to_col == 0:
                x_end = x2
                
            svg_content.append(f'  <!-- Message {s_idx + 1} -->')
            svg_content.append(f'  <line x1="{x_start}" y1="{y}" x2="{x_end}" y2="{y}" stroke="#000000" stroke-width="1.2" {dashed_attr} marker-end="url(#{marker_type})" />')
            
            # Label placement above line
            text_x = (x_start + x_end) // 2
            svg_content.append(f'  <text x="{text_x}" y="{y-5}" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#000000">{label}</text>')
            
    svg_content.append('</svg>')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write("\n".join(svg_content))

def main():
    # 1. Create Output Directories
    tq_dir = "./diagrams_tq_auto"
    phone_dir = "./diagrams_phone_shop"
    os.makedirs(tq_dir, exist_ok=True)
    os.makedirs(phone_dir, exist_ok=True)
    
    # ----------------------------------------------------
    # DATA SET A: TQ Auto Showroom (Project in Workspace)
    # ----------------------------------------------------
    tq_diagrams = {
        "seq_register.svg": {
            "title": "Biểu đồ tuần tự: Đăng ký (Showroom TQ Auto)",
            "lifelines": [
                ("Khách hàng", "actor"),
                ("RegisterForm\n(Boundary)", "boundary"),
                ("RegisterActions\n(Control)", "control"),
                ("DbUser\n(Entity)", "entity")
            ],
            "steps": [
                {"from_col": 0, "to_col": 1, "label": "1. Nhập họ tên, email, sđt, mật khẩu"},
                {"from_col": 0, "to_col": 1, "label": "2. Click nút đăng ký"},
                {"from_col": 1, "to_col": 2, "label": "3. Gọi Server Action (registerUser)"},
                {"from_col": 2, "to_col": 3, "label": "4. Query kiểm tra email tồn tại"},
                {"from_col": 3, "to_col": 2, "label": "5. Trả về kết quả kiểm tra (không trùng)", "is_dashed": True, "is_ret": True},
                {"from_col": 2, "to_col": 3, "label": "6. Tạo tài khoản mới & lưu (INSERT INTO users)"},
                {"from_col": 3, "to_col": 2, "label": "7. Trả về thông tin user đã lưu", "is_dashed": True, "is_ret": True},
                {"from_col": 2, "to_col": 1, "label": "8. Thiết lập JWT Session Cookie", "is_dashed": True, "is_ret": True},
                {"from_col": 1, "to_col": 0, "label": "9. Hiển thị thông báo thành công & Chuyển hướng", "is_dashed": True, "is_ret": True}
            ]
        },
        "seq_login.svg": {
            "title": "Biểu đồ tuần tự: Đăng nhập (Showroom TQ Auto)",
            "lifelines": [
                ("Người dùng", "actor"),
                ("LoginForm\n(Boundary)", "boundary"),
                ("AuthActions\n(Control)", "control"),
                ("DbUser\n(Entity)", "entity")
            ],
            "steps": [
                {"from_col": 0, "to_col": 1, "label": "1. Nhập email và mật khẩu"},
                {"from_col": 0, "to_col": 1, "label": "2. Click nút đăng nhập"},
                {"from_col": 1, "to_col": 2, "label": "3. Gọi Server Action (handleLogin)"},
                {"from_col": 2, "to_col": 3, "label": "4. SELECT FROM users WHERE email"},
                {"from_col": 3, "to_col": 2, "label": "5. Trả về mật khẩu đã băm (hash)", "is_dashed": True, "is_ret": True},
                {"from_col": 2, "to_col": 2, "label": "6. So khớp mật khẩu & Sinh JWT token", "is_self": True},
                {"from_col": 2, "to_col": 1, "label": "7. Trả về kết quả xác thực thành công", "is_dashed": True, "is_ret": True},
                {"from_col": 1, "to_col": 0, "label": "8. Đăng nhập thành công, chuyển hướng trang chủ", "is_dashed": True, "is_ret": True}
            ]
        },
        "seq_search_cars.svg": {
            "title": "Biểu đồ tuần tự: Tra cứu & Lọc xe (Showroom TQ Auto)",
            "lifelines": [
                ("Khách hàng", "actor"),
                ("CarsPage\n(Boundary)", "boundary"),
                ("CarActions\n(Control)", "control"),
                ("DbCar\n(Entity)", "entity")
            ],
            "steps": [
                {"from_col": 0, "to_col": 1, "label": "1. Nhập từ khóa, chọn hãng xe, khoảng giá"},
                {"from_col": 1, "to_col": 2, "label": "2. Gửi request lọc xe với các params"},
                {"from_col": 2, "to_col": 3, "label": "3. Query xe theo các điều kiện lọc (cars)"},
                {"from_col": 3, "to_col": 2, "label": "4. Trả về danh sách xe phù hợp", "is_dashed": True, "is_ret": True},
                {"from_col": 2, "to_col": 1, "label": "5. Định dạng dữ liệu & sinh HTML/JSON", "is_dashed": True, "is_ret": True},
                {"from_col": 1, "to_col": 0, "label": "6. Hiển thị danh sách xe đã lọc trên giao diện", "is_dashed": True, "is_ret": True}
            ]
        },
        "seq_view_car.svg": {
            "title": "Biểu đồ tuần tự: Xem chi tiết xe (Showroom TQ Auto)",
            "lifelines": [
                ("Khách hàng", "actor"),
                ("CarDetailPage\n(Boundary)", "boundary"),
                ("CarActions\n(Control)", "control"),
                ("DbCar & DbCarImage\n(Entity)", "entity")
            ],
            "steps": [
                {"from_col": 0, "to_col": 1, "label": "1. Click vào hình ảnh hoặc tiêu đề xe"},
                {"from_col": 1, "to_col": 2, "label": "2. Gửi request GET /cars/[id]"},
                {"from_col": 2, "to_col": 3, "label": "3. Query thông tin xe & ảnh liên quan (cars, car_images)"},
                {"from_col": 3, "to_col": 2, "label": "4. Trả về thông tin chi tiết xe & album ảnh", "is_dashed": True, "is_ret": True},
                {"from_col": 2, "to_col": 2, "label": "5. Tăng số lượt xem của xe thêm 1", "is_self": True},
                {"from_col": 2, "to_col": 1, "label": "6. Render layout chi tiết xe trên Server Component", "is_dashed": True, "is_ret": True},
                {"from_col": 1, "to_col": 0, "label": "7. Hiển thị thông số kỹ thuật, giá và mô tả xe", "is_dashed": True, "is_ret": True}
            ]
        },
        "seq_appointment.svg": {
            "title": "Biểu đồ tuần tự: Đặt lịch xem xe (Showroom TQ Auto)",
            "lifelines": [
                ("Khách hàng", "actor"),
                ("AppointmentForm\n(Boundary)", "boundary"),
                ("AppointmentActions\n(Control)", "control"),
                ("DbAppointment\n(Entity)", "entity")
            ],
            "steps": [
                {"from_col": 0, "to_col": 1, "label": "1. Chọn ngày, giờ và xe cần xem"},
                {"from_col": 0, "to_col": 1, "label": "2. Điền thông tin cá nhân & click đặt lịch"},
                {"from_col": 1, "to_col": 2, "label": "3. Gọi Server Action (createAppointment)"},
                {"from_col": 2, "to_col": 3, "label": "4. Thêm lịch hẹn mới (INSERT INTO appointments)"},
                {"from_col": 3, "to_col": 2, "label": "5. Xác nhận lưu lịch hẹn thành công", "is_dashed": True, "is_ret": True},
                {"from_col": 2, "to_col": 2, "label": "6. Gửi email thông báo cho Khách hàng & Admin", "is_self": True},
                {"from_col": 2, "to_col": 1, "label": "7. Trả về trạng thái lưu thành công", "is_dashed": True, "is_ret": True},
                {"from_col": 1, "to_col": 0, "label": "8. Hiển thị thông báo đặt lịch thành công", "is_dashed": True, "is_ret": True}
            ]
        },
        "seq_submit_lead.svg": {
            "title": "Biểu đồ tuần tự: Gửi yêu cầu tư vấn (Showroom TQ Auto)",
            "lifelines": [
                ("Khách hàng", "actor"),
                ("ContactForm\n(Boundary)", "boundary"),
                ("ContactActions\n(Control)", "control"),
                ("DbContactRequest\n(Entity)", "entity")
            ],
            "steps": [
                {"from_col": 0, "to_col": 1, "label": "1. Điền họ tên, số điện thoại, lời nhắn tư vấn"},
                {"from_col": 0, "to_col": 1, "label": "2. Click nút gửi yêu cầu"},
                {"from_col": 1, "to_col": 2, "label": "3. Gọi Server Action (createContactRequest)"},
                {"from_col": 2, "to_col": 3, "label": "4. Lưu thông tin (INSERT INTO contact_requests)"},
                {"from_col": 3, "to_col": 2, "label": "5. Xác nhận lưu thành công", "is_dashed": True, "is_ret": True},
                {"from_col": 2, "to_col": 2, "label": "6. Tạo Lead mới trong hệ thống CRM khách hàng", "is_self": True},
                {"from_col": 2, "to_col": 1, "label": "7. Trả về kết quả xử lý thành công", "is_dashed": True, "is_ret": True},
                {"from_col": 1, "to_col": 0, "label": "8. Hiển thị thông báo đã gửi yêu cầu tư vấn thành công", "is_dashed": True, "is_ret": True}
            ]
        },
        "seq_manage_car.svg": {
            "title": "Biểu đồ tuần tự: Quản lý xe (Showroom TQ Auto)",
            "lifelines": [
                ("Quản trị viên", "actor"),
                ("AdminCarsPage\n(Boundary)", "boundary"),
                ("AdminCarActions\n(Control)", "control"),
                ("DbCar\n(Entity)", "entity")
            ],
            "steps": [
                {"from_col": 0, "to_col": 1, "label": "1. Nhập thông tin xe mới (tên xe, giá, hãng, thông số, ảnh)"},
                {"from_col": 0, "to_col": 1, "label": "2. Bấm nút Thêm xe mới"},
                {"from_col": 1, "to_col": 2, "label": "3. Gọi Server Action (addCar)"},
                {"from_col": 2, "to_col": 3, "label": "4. Thực hiện INSERT INTO cars & car_images"},
                {"from_col": 3, "to_col": 2, "label": "5. Trả về kết quả ghi nhận thành công", "is_dashed": True, "is_ret": True},
                {"from_col": 2, "to_col": 2, "label": "6. Gọi revalidatePath() làm mới cache trang xe", "is_self": True},
                {"from_col": 2, "to_col": 1, "label": "7. Trả về trạng thái cập nhật thành công", "is_dashed": True, "is_ret": True},
                {"from_col": 1, "to_col": 0, "label": "8. Cập nhật bảng dữ liệu & thông báo thêm xe thành công", "is_dashed": True, "is_ret": True}
            ]
        },
        "seq_manage_appts.svg": {
            "title": "Biểu đồ tuần tự: Quản lý lịch hẹn (Showroom TQ Auto)",
            "lifelines": [
                ("Nhân viên", "actor"),
                ("AdminApptsPage\n(Boundary)", "boundary"),
                ("ApptActions\n(Control)", "control"),
                ("DbAppointment\n(Entity)", "entity")
            ],
            "steps": [
                {"from_col": 0, "to_col": 1, "label": "1. Chọn lịch hẹn cần xử lý, chọn Trạng thái mới"},
                {"from_col": 0, "to_col": 1, "label": "2. Click nút Xác nhận thay đổi"},
                {"from_col": 1, "to_col": 2, "label": "3. Gọi Server Action (updateAppointmentStatus)"},
                {"from_col": 2, "to_col": 3, "label": "4. UPDATE appointments SET status = ? WHERE id = ?"},
                {"from_col": 3, "to_col": 2, "label": "5. Trả về xác nhận thành công", "is_dashed": True, "is_ret": True},
                {"from_col": 2, "to_col": 2, "label": "6. Gửi email cập nhật lịch hẹn cho khách hàng", "is_self": True},
                {"from_col": 2, "to_col": 1, "label": "7. Trả về trạng thái xử lý thành công", "is_dashed": True, "is_ret": True},
                {"from_col": 1, "to_col": 0, "label": "8. Cập nhật trạng thái lịch trên bảng UI", "is_dashed": True, "is_ret": True}
            ]
        },
        "seq_crm.svg": {
            "title": "Biểu đồ tuần tự: Quản lý khách hàng CRM (Showroom TQ Auto)",
            "lifelines": [
                ("Nhân viên", "actor"),
                ("CustomerCRMDetails\n(Boundary)", "boundary"),
                ("CRMActions\n(Control)", "control"),
                ("DbCustomer & Note\n(Entity)", "entity")
            ],
            "steps": [
                {"from_col": 0, "to_col": 1, "label": "1. Chọn khách hàng chăm sóc, viết ghi chú CSKH"},
                {"from_col": 0, "to_col": 1, "label": "2. Click lưu ghi chú & cập nhật tiến trình"},
                {"from_col": 1, "to_col": 2, "label": "3. Gọi Server Action (updateCustomerStage & addCustomerNote)"},
                {"from_col": 2, "to_col": 3, "label": "4. UPDATE customers SET stage = ?; INSERT INTO customer_notes"},
                {"from_col": 3, "to_col": 2, "label": "5. Xác nhận lưu thành công", "is_dashed": True, "is_ret": True},
                {"from_col": 2, "to_col": 1, "label": "6. Trả về thông tin khách hàng & ghi chú mới", "is_dashed": True, "is_ret": True},
                {"from_col": 1, "to_col": 0, "label": "7. Hiển thị timeline chăm sóc khách hàng cập nhật", "is_dashed": True, "is_ret": True}
            ]
        },
        "seq_analytics.svg": {
            "title": "Biểu đồ tuần tự: Xem báo cáo thống kê (Showroom TQ Auto)",
            "lifelines": [
                ("Quản trị viên", "actor"),
                ("AnalyticsDashboard\n(Boundary)", "boundary"),
                ("AnalyticsActions\n(Control)", "control"),
                ("DbAnalyticsQuery\n(Entity)", "entity")
            ],
            "steps": [
                {"from_col": 0, "to_col": 1, "label": "1. Chọn khoảng thời gian thống kê"},
                {"from_col": 0, "to_col": 1, "label": "2. Mở tab biểu đồ tương ứng (Doanh thu/Tồn kho)"},
                {"from_col": 1, "to_col": 2, "label": "3. Gọi action (getSummaryMetrics / getRevenueByMonth)"},
                {"from_col": 2, "to_col": 3, "label": "4. Query DB lấy tổng doanh thu, xe đã bán, số lịch hẹn"},
                {"from_col": 3, "to_col": 2, "label": "5. Trả về kết quả query thống kê", "is_dashed": True, "is_ret": True},
                {"from_col": 2, "to_col": 2, "label": "6. Định dạng dữ liệu thành mảng JSON cho chart", "is_self": True},
                {"from_col": 2, "to_col": 1, "label": "7. Trả về dữ liệu thống kê hoàn chỉnh", "is_dashed": True, "is_ret": True},
                {"from_col": 1, "to_col": 0, "label": "8. Vẽ biểu đồ Recharts trực quan hóa dữ liệu", "is_dashed": True, "is_ret": True}
            ]
        }
    }
    
    for filename, config in tq_diagrams.items():
        filepath = os.path.join(tq_dir, filename)
        create_sequence_svg(filepath, config["title"], config["lifelines"], config["steps"])
        print(f"Generated {filepath}")
        
    # ----------------------------------------------------
    # DATA SET B: Phone Shop System (From User's Images)
    # ----------------------------------------------------
    phone_diagrams = {
        "seq_register.svg": {
            "title": "Biểu đồ tuần tự: Đăng ký (Web bán điện thoại)",
            "lifelines": [
                ("Khách hàng", "actor"),
                ("DangKyUI\n(Boundary)", "boundary"),
                ("DangKyController\n(Control)", "control"),
                ("USERS\n(Entity)", "entity")
            ],
            "steps": [
                {"from_col": 0, "to_col": 1, "label": "nhapThongTinDangKy()"},
                {"from_col": 0, "to_col": 1, "label": "clickDangKy()"},
                {"from_col": 1, "to_col": 2, "label": "guiThongTinDangKy()"},
                {"from_col": 2, "to_col": 3, "label": "kiemTraTaiKhoanTonTai()"},
                {"from_col": 3, "to_col": 2, "label": "ketQuaKiemTra()", "is_dashed": True, "is_ret": True},
                {"from_col": 2, "to_col": 3, "label": "luuTaiKhoanMoi()"},
                {"from_col": 3, "to_col": 2, "label": "xacNhanLuu()", "is_dashed": True, "is_ret": True},
                {"from_col": 2, "to_col": 1, "label": "hienThiThongBaoThanhCong()", "is_dashed": True, "is_ret": True},
                {"from_col": 1, "to_col": 0, "label": "chuyenHuongDangNhap()", "is_dashed": True, "is_ret": True}
            ]
        },
        "seq_login.svg": {
            "title": "Biểu đồ tuần tự: Đăng nhập (Web bán điện thoại - Giao diện chính xác)",
            "lifelines": [
                ("NguoiDung", "actor"),
                ("DangNhapUI\n(Boundary)", "boundary"),
                ("DangNhapController\n(Control)", "control"),
                ("USERS\n(Entity)", "entity")
            ],
            "steps": [
                {"from_col": 0, "to_col": 1, "label": "1: chonIconHinhNguoi()"},
                {"from_col": 1, "to_col": 1, "label": "2: hienThiManHinhDangNhap()", "is_self": True},
                {"from_col": 0, "to_col": 1, "label": "3: nhapUsernamePassword()"},
                {"from_col": 0, "to_col": 1, "label": "4: kichNutDangNhap()"},
                {"from_col": 1, "to_col": 2, "label": "5: layThongTinTaiKhoan()"},
                {"from_col": 2, "to_col": 3, "label": "6: layThongTinTaiKhoan()"},
                {"from_col": 3, "to_col": 2, "label": "7: returnKetQua()", "is_dashed": True, "is_ret": True},
                {"from_col": 2, "to_col": 1, "label": "8: returnKetQua()", "is_dashed": True, "is_ret": True},
                {"from_col": 1, "to_col": 1, "label": "9: hienThiManHinhTrangChu()", "is_self": True}
            ]
        },
        "seq_view_product.svg": {
            "title": "Biểu đồ tuần tự: Xem thông tin sản phẩm (Web bán điện thoại)",
            "lifelines": [
                ("Khách hàng", "actor"),
                ("ChiTietSanPhamUI\n(Boundary)", "boundary"),
                ("SanPhamController\n(Control)", "control"),
                ("SANPHAM\n(Entity)", "entity")
            ],
            "steps": [
                {"from_col": 0, "to_col": 1, "label": "chonSanPham()"},
                {"from_col": 1, "to_col": 2, "label": "layChiTietSanPham()"},
                {"from_col": 2, "to_col": 3, "label": "queryChiTietSP()"},
                {"from_col": 3, "to_col": 2, "label": "traVeChiTietSP()", "is_dashed": True, "is_ret": True},
                {"from_col": 2, "to_col": 3, "label": "tangLuotXemSP()"},
                {"from_col": 2, "to_col": 1, "label": "hienThiChiTietSP()", "is_dashed": True, "is_ret": True}
            ]
        },
        "seq_update_profile.svg": {
            "title": "Biểu đồ tuần tự: Cập nhật thông tin cá nhân (Web bán điện thoại)",
            "lifelines": [
                ("Thành viên", "actor"),
                ("ThongTinCaNhanUI\n(Boundary)", "boundary"),
                ("NguoiDungController\n(Control)", "control"),
                ("USERS\n(Entity)", "entity")
            ],
            "steps": [
                {"from_col": 0, "to_col": 1, "label": "nhapThongTinMoi()"},
                {"from_col": 0, "to_col": 1, "label": "clickCapNhat()"},
                {"from_col": 1, "to_col": 2, "label": "guiYeuCauCapNhat()"},
                {"from_col": 2, "to_col": 2, "label": "validateThongTin()", "is_self": True},
                {"from_col": 2, "to_col": 3, "label": "updateDatabase()"},
                {"from_col": 3, "to_col": 2, "label": "xacNhanCapNhat()", "is_dashed": True, "is_ret": True},
                {"from_col": 2, "to_col": 1, "label": "thongBaoThanhCong()", "is_dashed": True, "is_ret": True}
            ]
        },
        "seq_manage_cart.svg": {
            "title": "Biểu đồ tuần tự: Quản lý giỏ hàng (Web bán điện thoại)",
            "lifelines": [
                ("Khách hàng", "actor"),
                ("GioHangUI\n(Boundary)", "boundary"),
                ("GioHangController\n(Control)", "control"),
                ("GIOHANG\n(Entity)", "entity")
            ],
            "steps": [
                {"from_col": 0, "to_col": 1, "label": "clickThemVaoGioHang()"},
                {"from_col": 1, "to_col": 2, "label": "themVaoGioHang()"},
                {"from_col": 2, "to_col": 3, "label": "luuVaoGioHang()"},
                {"from_col": 3, "to_col": 2, "label": "traVeSoLuongMoi()", "is_dashed": True, "is_ret": True},
                {"from_col": 2, "to_col": 1, "label": "capNhatBadgeGioHang()", "is_dashed": True, "is_ret": True}
            ]
        },
        "seq_place_order.svg": {
            "title": "Biểu đồ tuần tự: Đặt hàng (Web bán điện thoại)",
            "lifelines": [
                ("Khách hàng", "actor"),
                ("ThanhToanUI\n(Boundary)", "boundary"),
                ("DatHangController\n(Control)", "control"),
                ("DONHANG\n(Entity)", "entity")
            ],
            "steps": [
                {"from_col": 0, "to_col": 1, "label": "clickDatHang()"},
                {"from_col": 1, "to_col": 2, "label": "guiYeuCauDatHang()"},
                {"from_col": 2, "to_col": 3, "label": "taoDonHangMoi()"},
                {"from_col": 3, "to_col": 2, "label": "xacNhanTaoDonHang()", "is_dashed": True, "is_ret": True},
                {"from_col": 2, "to_col": 1, "label": "thongBaoDatHangThanhCong()", "is_dashed": True, "is_ret": True}
            ]
        },
        "seq_payment_vnpay.svg": {
            "title": "Biểu đồ tuần tự: Thanh toán qua VN Pay (Web bán điện thoại)",
            "lifelines": [
                ("Khách hàng", "actor"),
                ("ThanhToanUI\n(Boundary)", "boundary"),
                ("ThanhToanController\n(Control)", "control"),
                ("DONHANG\n(Entity)", "entity"),
                ("VN Pay\n(ThirdParty)", "actor")
            ],
            "steps": [
                {"from_col": 0, "to_col": 1, "label": "chonThanhToanVNPay()"},
                {"from_col": 1, "to_col": 2, "label": "taoLinkThanhToan()"},
                {"from_col": 2, "to_col": 3, "label": "tinhTongTien()"},
                {"from_col": 3, "to_col": 2, "label": "traVeTongTien()", "is_dashed": True, "is_ret": True},
                {"from_col": 2, "to_col": 4, "label": "guiYeuCauThanhToan()"},
                {"from_col": 4, "to_col": 2, "label": "traVeLinkThanhToan()", "is_dashed": True, "is_ret": True},
                {"from_col": 2, "to_col": 1, "label": "chuyenHuongDenVNPay()", "is_dashed": True, "is_ret": True},
                {"from_col": 0, "to_col": 4, "label": "nhapThongTinThanhToan()"},
                {"from_col": 4, "to_col": 2, "label": "xacNhanThanhToanThanhCong()"},
                {"from_col": 2, "to_col": 3, "label": "capNhatTrangThaiDonHang()"},
                {"from_col": 3, "to_col": 2, "label": "xacNhanCapNhat()", "is_dashed": True, "is_ret": True},
                {"from_col": 2, "to_col": 1, "label": "hienThiKetQuaThanhToan()", "is_dashed": True, "is_ret": True}
            ]
        },
        "seq_view_order.svg": {
            "title": "Biểu đồ tuần tự: Xem đơn hàng (Web bán điện thoại)",
            "lifelines": [
                ("Khách hàng", "actor"),
                ("LichSuDonHangUI\n(Boundary)", "boundary"),
                ("DonHangController\n(Control)", "control"),
                ("DONHANG\n(Entity)", "entity")
            ],
            "steps": [
                {"from_col": 0, "to_col": 1, "label": "clickXemLichSuMuaHang()"},
                {"from_col": 1, "to_col": 2, "label": "layDanhSachDonHang()"},
                {"from_col": 2, "to_col": 3, "label": "queryDonHangByUserId()"},
                {"from_col": 3, "to_col": 2, "label": "traVeListDonHang()", "is_dashed": True, "is_ret": True},
                {"from_col": 2, "to_col": 1, "label": "hienThiDanhSachDonHang()", "is_dashed": True, "is_ret": True}
            ]
        },
        "seq_review_product.svg": {
            "title": "Biểu đồ tuần tự: Đánh giá sản phẩm (Web bán điện thoại)",
            "lifelines": [
                ("Khách hàng", "actor"),
                ("DanhGiaUI\n(Boundary)", "boundary"),
                ("DanhGiaController\n(Control)", "control"),
                ("DANHGIA\n(Entity)", "entity")
            ],
            "steps": [
                {"from_col": 0, "to_col": 1, "label": "nhapNoiDungDanhGiaSao()"},
                {"from_col": 0, "to_col": 1, "label": "clickGuiDanhGia()"},
                {"from_col": 1, "to_col": 2, "label": "guiYeuCauDanhGia()"},
                {"from_col": 2, "to_col": 3, "label": "luuDanhGiaMoi()"},
                {"from_col": 3, "to_col": 2, "label": "traVeKetQua()", "is_dashed": True, "is_ret": True},
                {"from_col": 2, "to_col": 1, "label": "hienThiDanhGiaTrenUI()", "is_dashed": True, "is_ret": True}
            ]
        },
        "seq_manage_product.svg": {
            "title": "Biểu đồ tuần tự: Quản lý sản phẩm (Web bán điện thoại - Admin)",
            "lifelines": [
                ("NguoiQuanTri", "actor"),
                ("AdminSanPhamUI\n(Boundary)", "boundary"),
                ("AdminSanPhamController\n(Control)", "control"),
                ("SANPHAM\n(Entity)", "entity")
            ],
            "steps": [
                {"from_col": 0, "to_col": 1, "label": "nhapThongTinSanPhamMoi()"},
                {"from_col": 0, "to_col": 1, "label": "clickThemSanPham()"},
                {"from_col": 1, "to_col": 2, "label": "guiYeuCauThemSP()"},
                {"from_col": 2, "to_col": 3, "label": "luuSanPhamMoi()"},
                {"from_col": 3, "to_col": 2, "label": "traVeXacNhan()", "is_dashed": True, "is_ret": True},
                {"from_col": 2, "to_col": 1, "label": "lamMoiDanhSachSP()", "is_dashed": True, "is_ret": True}
            ]
        },
        "seq_manage_category.svg": {
            "title": "Biểu đồ tuần tự: Quản lý danh mục (Web bán điện thoại - Admin)",
            "lifelines": [
                ("NguoiQuanTri", "actor"),
                ("AdminDanhMucUI\n(Boundary)", "boundary"),
                ("AdminDanhMucController\n(Control)", "control"),
                ("DANHMUC\n(Entity)", "entity")
            ],
            "steps": [
                {"from_col": 0, "to_col": 1, "label": "nhapTenDanhMucMoi()"},
                {"from_col": 0, "to_col": 1, "label": "clickThemDanhMuc()"},
                {"from_col": 1, "to_col": 2, "label": "guiYeuCauThemDM()"},
                {"from_col": 2, "to_col": 3, "label": "luuDanhMucMoi()"},
                {"from_col": 3, "to_col": 2, "label": "traVeXacNhan()", "is_dashed": True, "is_ret": True},
                {"from_col": 2, "to_col": 1, "label": "lamMoiDanhSachDM()", "is_dashed": True, "is_ret": True}
            ]
        },
        "seq_manage_user.svg": {
            "title": "Biểu đồ tuần tự: Quản lý người dùng (Web bán điện thoại - Admin)",
            "lifelines": [
                ("NguoiQuanTri", "actor"),
                ("AdminNguoiDungUI\n(Boundary)", "boundary"),
                ("AdminNguoiDungController\n(Control)", "control"),
                ("USERS\n(Entity)", "entity")
            ],
            "steps": [
                {"from_col": 0, "to_col": 1, "label": "chonNguoiDungCanKhoa()"},
                {"from_col": 0, "to_col": 1, "label": "clickKhoaTaiKhoan()"},
                {"from_col": 1, "to_col": 2, "label": "guiYeuCauKhoaTK()"},
                {"from_col": 2, "to_col": 3, "label": "capNhatTrangThaiKhoa()"},
                {"from_col": 3, "to_col": 2, "label": "traVeXacNhan()", "is_dashed": True, "is_ret": True},
                {"from_col": 2, "to_col": 1, "label": "hienThiTrangThaiMoi()", "is_dashed": True, "is_ret": True}
            ]
        },
        "seq_manage_order.svg": {
            "title": "Biểu đồ tuần tự: Quản lý đơn hàng (Web bán điện thoại - Admin)",
            "lifelines": [
                ("NguoiQuanTri", "actor"),
                ("AdminDonHangUI\n(Boundary)", "boundary"),
                ("AdminDonHangController\n(Control)", "control"),
                ("DONHANG\n(Entity)", "entity")
            ],
            "steps": [
                {"from_col": 0, "to_col": 1, "label": "chonDonHangCanDuyet()"},
                {"from_col": 0, "to_col": 1, "label": "clickDuyetDonHang()"},
                {"from_col": 1, "to_col": 2, "label": "guiYeuCauDuyetDonHang()"},
                {"from_col": 2, "to_col": 3, "label": "capNhatTrangThaiDuyet()"},
                {"from_col": 3, "to_col": 2, "label": "traVeXacNhan()", "is_dashed": True, "is_ret": True},
                {"from_col": 2, "to_col": 1, "label": "hienThiDonHangDaDuyet()", "is_dashed": True, "is_ret": True}
            ]
        },
        "seq_manage_warehouse.svg": {
            "title": "Biểu đồ tuần tự: Quản lý kho (Web bán điện thoại - Admin)",
            "lifelines": [
                ("NguoiQuanTri", "actor"),
                ("AdminKhoUI\n(Boundary)", "boundary"),
                ("AdminKhoController\n(Control)", "control"),
                ("KHO\n(Entity)", "entity")
            ],
            "steps": [
                {"from_col": 0, "to_col": 1, "label": "nhapSoLuongNhapKho()"},
                {"from_col": 0, "to_col": 1, "label": "clickCapNhatKho()"},
                {"from_col": 1, "to_col": 2, "label": "guiYeuCauCapNhatKho()"},
                {"from_col": 2, "to_col": 3, "label": "capNhatSoLuongTon()"},
                {"from_col": 3, "to_col": 2, "label": "traVeXacNhan()", "is_dashed": True, "is_ret": True},
                {"from_col": 2, "to_col": 1, "label": "hienThiTonKhoMoi()", "is_dashed": True, "is_ret": True}
            ]
        },
        "seq_view_reports.svg": {
            "title": "Biểu đồ tuần tự: Xem báo cáo thống kê (Web bán điện thoại - Admin)",
            "lifelines": [
                ("NguoiQuanTri", "actor"),
                ("AdminBaoCaoUI\n(Boundary)", "boundary"),
                ("AdminBaoCaoController\n(Control)", "control"),
                ("BaoCaoDB\n(Entity)", "entity")
            ],
            "steps": [
                {"from_col": 0, "to_col": 1, "label": "chonKhoangThoiGian()"},
                {"from_col": 0, "to_col": 1, "label": "clickXemBaoCao()"},
                {"from_col": 1, "to_col": 2, "label": "guiYeuCauThongKe()"},
                {"from_col": 2, "to_col": 3, "label": "tinhToanDoanhThuTonKho()"},
                {"from_col": 3, "to_col": 2, "label": "traVeDataThongKe()", "is_dashed": True, "is_ret": True},
                {"from_col": 2, "to_col": 1, "label": "veBieuDoThongKe()", "is_dashed": True, "is_ret": True}
            ]
        },
        "seq_update_memory.svg": {
            "title": "Biểu đồ tuần tự: Cập nhật bộ nhớ (Web bán điện thoại - Admin)",
            "lifelines": [
                ("NguoiQuanTri", "actor"),
                ("AdminBoNhoUI\n(Boundary)", "boundary"),
                ("AdminBoNhoController\n(Control)", "control"),
                ("BONHO\n(Entity)", "entity")
            ],
            "steps": [
                {"from_col": 0, "to_col": 1, "label": "nhapThongTinDungLuong()"},
                {"from_col": 0, "to_col": 1, "label": "clickThemBoNho()"},
                {"from_col": 1, "to_col": 2, "label": "guiYeuCauThemBoNho()"},
                {"from_col": 2, "to_col": 3, "label": "luuBoNhoMoi()"},
                {"from_col": 3, "to_col": 2, "label": "traVeXacNhan()", "is_dashed": True, "is_ret": True},
                {"from_col": 2, "to_col": 1, "label": "hienThiBoNhoMoi()", "is_dashed": True, "is_ret": True}
            ]
        },
        "seq_update_color.svg": {
            "title": "Biểu đồ tuần tự: Cập nhật màu sắc (Web bán điện thoại - Admin)",
            "lifelines": [
                ("NguoiQuanTri", "actor"),
                ("AdminMauSacUI\n(Boundary)", "boundary"),
                ("AdminMauSacController\n(Control)", "control"),
                ("MAUSAC\n(Entity)", "entity")
            ],
            "steps": [
                {"from_col": 0, "to_col": 1, "label": "nhapTenMauVaMaHex()"},
                {"from_col": 0, "to_col": 1, "label": "clickThemMauSac()"},
                {"from_col": 1, "to_col": 2, "label": "guiYeuCauThemMauSac()"},
                {"from_col": 2, "to_col": 3, "label": "luuMauSacMoi()"},
                {"from_col": 3, "to_col": 2, "label": "traVeXacNhan()", "is_dashed": True, "is_ret": True},
                {"from_col": 2, "to_col": 1, "label": "hienThiMauSacMoi()", "is_dashed": True, "is_ret": True}
            ]
        }
    }
    
    for filename, config in phone_diagrams.items():
        filepath = os.path.join(phone_dir, filename)
        create_sequence_svg(filepath, config["title"], config["lifelines"], config["steps"])
        print(f"Generated {filepath}")

    print("\nSUCCESS: All sequence diagrams generated in SVG format!")

if __name__ == "__main__":
    main()
