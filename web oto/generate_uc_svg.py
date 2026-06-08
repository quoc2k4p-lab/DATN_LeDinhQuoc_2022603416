import os

def create_usecase_svg(filepath):
    total_width = 1000
    total_height = 880
    
    svg_content = []
    svg_content.append(f'<?xml version="1.0" encoding="UTF-8" standalone="no"?>')
    svg_content.append(f'<svg width="{total_width}" height="{total_height}" viewBox="0 0 {total_width} {total_height}" xmlns="http://www.w3.org/2000/svg">')
    
    # Background
    svg_content.append(f'  <rect width="{total_width}" height="{total_height}" fill="#ffffff" />')
    
    # Title
    svg_content.append(f'  <text x="{total_width // 2}" y="35" text-anchor="middle" font-family="Times New Roman, Arial, sans-serif" font-size="22" font-weight="bold" fill="#000000">SƠ ĐỒ USE CASE TỔNG THỂ - WEBSITE TQ AUTO SHOWROOM</text>')
    
    # System Boundary
    boundary_x = 260
    boundary_y = 70
    boundary_w = 480
    boundary_h = 760
    svg_content.append(f'  <!-- System Boundary -->')
    svg_content.append(f'  <rect x="{boundary_x}" y="{boundary_y}" width="{boundary_w}" height="{boundary_h}" fill="none" stroke="#000000" stroke-width="2.5" />')
    svg_content.append(f'  <text x="{boundary_x + 15}" y="{boundary_y + 25}" font-family="Times New Roman, Arial, sans-serif" font-size="14" font-weight="bold" font-style="italic" fill="#000000">System Boundary: TQ Auto Showroom</text>')
    
    # Define Actors coordinates
    # Actor 1: Khách hàng / Khách vãng lai (Left top)
    # Actor 2: Nhân viên (Left bottom)
    # Actor 3: Quản trị viên (Right middle)
    # Actor 4: Hệ thống Email (Right top)
    actors = {
        "cust": {"name": "Khách hàng /\nKhách vãng lai", "x": 100, "y": 260, "side": "left"},
        "staff": {"name": "Nhân viên\nkinh doanh", "x": 100, "y": 580, "side": "left"},
        "admin": {"name": "Quản trị viên\n(Admin)", "x": 900, "y": 480, "side": "right"},
        "email": {"name": "Hệ thống Email\n(System Actor)", "x": 900, "y": 180, "side": "right"}
    }
    
    # Draw Actors
    for key, act in actors.items():
        x = act["x"]
        y = act["y"]
        name = act["name"]
        
        # Stick figure representation
        svg_content.append(f'  <!-- Actor: {key} -->')
        svg_content.append(f'  <circle cx="{x}" cy="{y - 40}" r="14" fill="#ffffff" stroke="#000000" stroke-width="2" />') # Head
        svg_content.append(f'  <line x1="{x}" y1="{y - 26}" x2="{x}" y2="{y + 10}" stroke="#000000" stroke-width="2" />') # Body
        svg_content.append(f'  <line x1="{x - 20}" y1="{y - 15}" x2="{x + 20}" y2="{y - 15}" stroke="#000000" stroke-width="2" />') # Arms
        svg_content.append(f'  <line x1="{x}" y1="{y + 10}" x2="{x - 14}" y2="{y + 35}" stroke="#000000" stroke-width="2" />') # Left Leg
        svg_content.append(f'  <line x1="{x}" y1="{y + 10}" x2="{x + 14}" y2="{y + 35}" stroke="#000000" stroke-width="2" />') # Right Leg
        
        # Text label
        lines = name.split('\n')
        for i, line in enumerate(lines):
            svg_content.append(f'  <text x="{x}" y="{y + 55 + i * 16}" text-anchor="middle" font-family="Times New Roman, Arial, sans-serif" font-size="12" font-weight="bold" fill="#000000">{line}</text>')
            
    # Define Use Cases coordinates (inside the boundary)
    # Centre x = 500
    usecases = [
        {"id": 1, "name": "Đăng ký & Đăng nhập", "cx": 500, "cy": 120, "rx": 90, "ry": 24},
        {"id": 2, "name": "Tra cứu, Tìm kiếm\n& Lọc xe", "cx": 500, "cy": 180, "rx": 95, "ry": 24},
        {"id": 3, "name": "Xem chi tiết xe\n& Đánh giá", "cx": 500, "cy": 240, "rx": 95, "ry": 24},
        {"id": 4, "name": "Đặt lịch xem xe\ntrực tuyến", "cx": 500, "cy": 300, "rx": 95, "ry": 24},
        {"id": 5, "name": "Gửi yêu cầu tư vấn", "cx": 500, "cy": 360, "rx": 90, "ry": 24},
        {"id": 6, "name": "Chat realtime\ntương tác", "cx": 500, "cy": 420, "rx": 90, "ry": 24},
        {"id": 7, "name": "Quản lý kho xe ô tô", "cx": 500, "cy": 480, "rx": 95, "ry": 24},
        {"id": 8, "name": "Quản lý danh mục xe", "cx": 500, "cy": 540, "rx": 95, "ry": 24},
        {"id": 9, "name": "Quản lý lịch hẹn\n& Duyệt lịch", "cx": 500, "cy": 600, "rx": 95, "ry": 24},
        {"id": 10, "name": "Chăm sóc khách hàng\nCRM & Ghi chú", "cx": 500, "cy": 660, "rx": 100, "ry": 24},
        {"id": 11, "name": "Quản lý bài viết\n(Tin tức)", "cx": 500, "cy": 720, "rx": 95, "ry": 24},
        {"id": 12, "name": "Thống kê báo cáo\n& Phân quyền", "cx": 500, "cy": 780, "rx": 95, "ry": 24}
    ]
    
    # Draw Use Cases
    for uc in usecases:
        cx = uc["cx"]
        cy = uc["cy"]
        rx = uc["rx"]
        ry = uc["ry"]
        name = uc["name"]
        
        clean_name = name.replace("\n", " ")
        svg_content.append(f'  <!-- Use Case {uc["id"]}: {clean_name} -->')
        svg_content.append(f'  <ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="#ffffff" stroke="#000000" stroke-width="1.5" />')
        
        # Draw multi-line text labels
        lines = name.split('\n')
        if len(lines) == 1:
            svg_content.append(f'    <text x="{cx}" y="{cy + 4}" text-anchor="middle" font-family="Times New Roman, Arial, sans-serif" font-size="12" fill="#000000">{lines[0]}</text>')
        else:
            svg_content.append(f'    <text x="{cx}" y="{cy - 4}" text-anchor="middle" font-family="Times New Roman, Arial, sans-serif" font-size="11" fill="#000000">{lines[0]}</text>')
            svg_content.append(f'    <text x="{cx}" y="{cy + 10}" text-anchor="middle" font-family="Times New Roman, Arial, sans-serif" font-size="11" fill="#000000">{lines[1]}</text>')

    # Connections definitions: (Actor, UC_id)
    # Left Side Actor Associations
    # Customer connections (UC 1, 2, 3, 4, 5, 6)
    cust_x = 120
    cust_y = 260
    for uc_id in [1, 2, 3, 4, 5, 6]:
        uc = usecases[uc_id - 1]
        svg_content.append(f'  <line x1="{cust_x}" y1="{cust_y}" x2="{uc["cx"] - uc["rx"]}" y2="{uc["cy"]}" stroke="#000000" stroke-width="1" />')
        
    # Staff connections (UC 1, 5, 6, 9, 10)
    staff_x = 120
    staff_y = 580
    for uc_id in [1, 5, 6, 9, 10]:
        uc = usecases[uc_id - 1]
        svg_content.append(f'  <line x1="{staff_x}" y1="{staff_y}" x2="{uc["cx"] - uc["rx"]}" y2="{uc["cy"]}" stroke="#000000" stroke-width="1" />')
        
    # Right Side Actor Associations
    # Admin connections (UC 1, 6, 7, 8, 9, 10, 11, 12)
    admin_x = 880
    admin_y = 480
    for uc_id in [1, 6, 7, 8, 9, 10, 11, 12]:
        uc = usecases[uc_id - 1]
        svg_content.append(f'  <line x1="{admin_x}" y1="{admin_y}" x2="{uc["cx"] + uc["rx"]}" y2="{uc["cy"]}" stroke="#000000" stroke-width="1" />')
        
    # Email System connections (UC 1, 4, 9)
    email_x = 880
    email_y = 180
    for uc_id in [1, 4, 9]:
        uc = usecases[uc_id - 1]
        svg_content.append(f'  <line x1="{email_x}" y1="{email_y}" x2="{uc["cx"] + uc["rx"]}" y2="{uc["cy"]}" stroke="#000000" stroke-width="1" stroke-dasharray="4,4" />')
        
    svg_content.append('</svg>')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write("\n".join(svg_content))

if __name__ == "__main__":
    filepath = "./diagrams_tq_auto/usecase_general.svg"
    create_usecase_svg(filepath)
    print(f"Generated general usecase diagram at {filepath}")
