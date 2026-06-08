import os
import math

def calculate_intersection(x1, y1, w1, h1, x2, y2, w2, h2):
    """
    Calculates the exact boundary intersection points for a line connecting
    Box 1 (center x1, y1, width w1, height h1) and Box 2 (center x2, y2, width w2, height h2).
    """
    # Box 1 boundary intersection
    dx = x2 - x1
    dy = y2 - y1
    
    if dx == 0 and dy == 0:
        return x1, y1, x2, y2
        
    # Intersection on Box 1
    r_box1 = w1 / h1
    r_line1 = abs(dx / dy) if dy != 0 else float('inf')
    
    sign_x1 = 1 if dx > 0 else -1
    sign_y1 = 1 if dy > 0 else -1
    
    if r_line1 > r_box1:
        # Intersects left or right side of Box 1
        ix1 = x1 + sign_x1 * (w1 / 2)
        iy1 = y1 + sign_y1 * (w1 / 2) * (abs(dy) / abs(dx))
    else:
        # Intersects top or bottom side of Box 1
        ix1 = x1 + sign_x1 * (h1 / 2) * (abs(dx) / abs(dy))
        iy1 = y1 + sign_y1 * (h1 / 2)
        
    # Intersection on Box 2
    dx2 = x1 - x2
    dy2 = y1 - y2
    
    r_box2 = w2 / h2
    r_line2 = abs(dx2 / dy2) if dy2 != 0 else float('inf')
    
    sign_x2 = 1 if dx2 > 0 else -1
    sign_y2 = 1 if dy2 > 0 else -1
    
    if r_line2 > r_box2:
        # Intersects left or right side of Box 2
        ix2 = x2 + sign_x2 * (w2 / 2)
        iy2 = y2 + sign_y2 * (w2 / 2) * (abs(dy2) / abs(dx2))
    else:
        # Intersects top or bottom side of Box 2
        ix2 = x2 + sign_x2 * (h2 / 2) * (abs(dx2) / abs(dy2))
        iy2 = y2 + sign_y2 * (h2 / 2)
        
    return ix1, iy1, ix2, iy2

def main():
    # Define Nodes
    nodes = {
        # Public / Customer Area (around Trang chủ)
        "trang_chu": {"label": "Trang chủ", "cx": 400, "cy": 280, "w": 100, "h": 60, "is_main": True},
        "dang_nhap": {"label": "Đăng nhập", "cx": 220, "cy": 280, "w": 100, "h": 50},
        "dang_ky": {"label": "Đăng ký", "cx": 80, "cy": 280, "w": 100, "h": 50},
        "cap_nhat_tt": {"label": "Cập nhật\nthông tin", "cx": 220, "cy": 120, "w": 100, "h": 50},
        "doi_mat_khau": {"label": "Đổi mật khẩu", "cx": 340, "cy": 120, "w": 100, "h": 50},
        "tim_kiem_xe": {"label": "Tìm kiếm &\nlọc xe", "cx": 460, "cy": 120, "w": 100, "h": 50},
        "chi_tiet_xe": {"label": "Chi tiết xe", "cx": 580, "cy": 120, "w": 100, "h": 50},
        "lich_hen_ca_nhan": {"label": "Lịch hẹn\ncá nhân", "cx": 580, "cy": 210, "w": 100, "h": 50},
        "xe_yeu_thich": {"label": "Xe yêu thích", "cx": 580, "cy": 350, "w": 100, "h": 50},
        "dat_lich_xem_xe": {"label": "Đặt lịch\nxem xe", "cx": 700, "cy": 350, "w": 100, "h": 50},
        "xem_thong_bao": {"label": "Xem thông báo", "cx": 220, "cy": 390, "w": 100, "h": 50},
        
        # Admin / Staff Area (around Quản trị)
        "quan_tri": {"label": "Quản trị", "cx": 400, "cy": 480, "w": 100, "h": 60, "is_main": True},
        "quan_ly_user": {"label": "Quản lý\nngười dùng", "cx": 220, "cy": 480, "w": 100, "h": 50},
        "quan_ly_crm": {"label": "Quản lý\nkhách hàng CRM", "cx": 580, "cy": 480, "w": 100, "h": 50},
        "thong_ke_bc": {"label": "Thống kê\nbáo cáo", "cx": 220, "cy": 610, "w": 100, "h": 50},
        "quan_ly_lead": {"label": "Quản lý\nLead tư vấn", "cx": 340, "cy": 610, "w": 100, "h": 50},
        "quan_ly_lich_hen": {"label": "Quản lý\nlịch hẹn", "cx": 460, "cy": 610, "w": 100, "h": 50},
        "quan_ly_kho_xe": {"label": "Quản lý\nkho xe", "cx": 580, "cy": 610, "w": 100, "h": 50}
    }
    
    # Define Connections: (source_id, target_id, is_bidirectional)
    connections = [
        # Center link
        ("trang_chu", "quan_tri", True),
        
        # Public connections to Trang chủ
        ("trang_chu", "cap_nhat_tt", True),
        ("trang_chu", "doi_mat_khau", True),
        ("trang_chu", "tim_kiem_xe", True),
        ("trang_chu", "chi_tiet_xe", True),
        ("trang_chu", "lich_hen_ca_nhan", True),
        ("trang_chu", "xe_yeu_thich", True),
        ("trang_chu", "xem_thong_bao", True),
        ("trang_chu", "dang_nhap", True),
        
        # Public chains
        ("dang_nhap", "dang_ky", True),
        ("xe_yeu_thich", "dat_lich_xem_xe", False), # Single head pointing to Đặt lịch xem xe
        
        # Admin connections to Quản trị
        ("quan_tri", "quan_ly_user", True),
        ("quan_tri", "quan_ly_crm", True),
        ("quan_tri", "thong_ke_bc", True),
        ("quan_tri", "quan_ly_lead", True),
        ("quan_tri", "quan_ly_lich_hen", True),
        ("quan_tri", "quan_ly_kho_xe", True)
    ]
    
    # Start SVG content
    svg = []
    svg.append('<?xml version="1.0" encoding="UTF-8" standalone="no"?>')
    svg.append('<svg width="800" height="740" viewBox="0 0 800 740" xmlns="http://www.w3.org/2000/svg">')
    
    # CSS Styles for Times New Roman font and grayscale clean look
    svg.append('  <style>')
    svg.append('    .title-main { font-family: "Times New Roman", Times, serif; font-size: 20px; font-weight: bold; fill: #000000; text-anchor: middle; }')
    svg.append('    .title-sub { font-family: "Times New Roman", Times, serif; font-size: 16px; font-weight: bold; fill: #000000; text-anchor: start; }')
    svg.append('    .box-rect { fill: #ffffff; stroke: #000000; stroke-width: 1.2; }')
    svg.append('    .box-rect-main { fill: #fcfcfc; stroke: #000000; stroke-width: 1.8; }')
    svg.append('    .box-text { font-family: "Times New Roman", Times, serif; font-size: 13px; fill: #000000; text-anchor: middle; dominant-baseline: middle; }')
    svg.append('    .conn-line { fill: none; stroke: #000000; stroke-width: 1.2; }')
    svg.append('  </style>')
    
    # Arrow definitions
    svg.append('  <defs>')
    svg.append('    <!-- Arrowhead marker -->')
    svg.append('    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">')
    svg.append('      <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#000000" />')
    svg.append('    </marker>')
    svg.append('  </defs>')
    
    # Background rect
    svg.append('  <rect width="800" height="740" fill="#ffffff" />')
    
    # Title Block
    svg.append('  <text x="400" y="38" class="title-main">CHƯƠNG 3: KẾT QUẢ CÀI ĐẶT VÀ KIỂM THỬ HỆ THỐNG</text>')
    svg.append('  <text x="40" y="72" class="title-sub">3.1. Sơ đồ điều hướng giữa các màn hình</text>')
    
    # Large frame box around the diagram
    svg.append('  <rect x="25" y="90" width="750" height="625" fill="none" stroke="#000000" stroke-width="1.0" />')
    
    # Render connection lines
    svg.append('  <!-- Connection Lines -->')
    for src_id, tgt_id, is_bi in connections:
        src = nodes[src_id]
        tgt = nodes[tgt_id]
        
        # Calculate intersection points on boundary edges
        x1, y1, x2, y2 = calculate_intersection(
            src["cx"], src["cy"], src["w"], src["h"],
            tgt["cx"], tgt["cy"], tgt["w"], tgt["h"]
        )
        
        marker_attrs = 'marker-end="url(#arrow)"'
        if is_bi:
            marker_attrs += ' marker-start="url(#arrow)"'
            
        svg.append(f'  <line x1="{x1:.2f}" y1="{y1:.2f}" x2="{x2:.2f}" y2="{y2:.2f}" class="conn-line" {marker_attrs} />')
        
    # Render node boxes
    svg.append('  <!-- Node Boxes -->')
    for node_id, node in nodes.items():
        w = node["w"]
        h = node["h"]
        x = node["cx"] - w/2
        y = node["cy"] - h/2
        
        rect_class = "box-rect-main" if node.get("is_main", False) else "box-rect"
        
        # Draw box rectangle
        svg.append(f'  <g id="node_{node_id}">')
        svg.append(f'    <rect x="{x}" y="{y}" width="{w}" height="{h}" class="{rect_class}" />')
        
        # Split labels with newlines for multi-line boxes
        label_lines = node["label"].split("\n")
        num_lines = len(label_lines)
        
        # Draw text inside box
        for idx, line in enumerate(label_lines):
            # Vertical centering math based on number of lines
            if num_lines == 1:
                dy = 0
            elif num_lines == 2:
                dy = -7 + idx * 14
            else:
                dy = -14 + idx * 14
                
            text_y = node["cy"] + dy
            svg.append(f'    <text x="{node["cx"]}" y="{text_y}" class="box-text">{line}</text>')
            
        svg.append('  </g>')
        
    svg.append('</svg>')
    
    # Output to files
    out_dir = "./svg_diagrams"
    os.makedirs(out_dir, exist_ok=True)
    
    filepath_svg_dir = os.path.join(out_dir, "navigation_chart.svg")
    filepath_root = "navigation_chart.svg"
    
    svg_content_str = "\n".join(svg)
    
    with open(filepath_svg_dir, "w", encoding="utf-8") as f:
        f.write(svg_content_str)
    print(f"Generated SVG in folder: {filepath_svg_dir}")
        
    with open(filepath_root, "w", encoding="utf-8") as f:
        f.write(svg_content_str)
    print(f"Generated SVG in root: {filepath_root}")

if __name__ == "__main__":
    main()
