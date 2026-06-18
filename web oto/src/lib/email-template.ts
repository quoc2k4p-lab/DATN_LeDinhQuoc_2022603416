/**
 * Email templates for TQ Auto Showroom
 */

/**
 * Template for when a customer first books an appointment (Booking Receipt)
 */
export function getAppointmentBookingHtml(
  customerName: string,
  dateStr: string,
  timeStr: string,
  phone: string,
  note: string
): string {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ffffff; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #e31837 0%, #b81230 100%); padding: 32px 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px; color: #ffffff;">TQ AUTO</h1>
        <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.9;">Xác nhận đặt lịch xem xe</p>
      </div>
      <div style="padding: 32px 24px; background-color: #0d0d0d;">
        <p style="margin: 0 0 16px; font-size: 16px; color: #ffffff;">Xin chào <strong>${customerName}</strong>,</p>
        <p style="margin: 0 0 24px; font-size: 14px; color: #999;">Chúng tôi đã nhận được yêu cầu đặt lịch xem xe của bạn. Dưới đây là thông tin chi tiết:</p>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #222; color: #888; font-size: 13px; width: 30%;">Ngày hẹn</td>
            <td style="padding: 12px; border-bottom: 1px solid #222; font-size: 14px; font-weight: 600; color: #ffffff;">${dateStr}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #222; color: #888; font-size: 13px;">Giờ hẹn</td>
            <td style="padding: 12px; border-bottom: 1px solid #222; font-size: 14px; font-weight: 600; color: #ffffff;">${timeStr}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #222; color: #888; font-size: 13px;">Điện thoại</td>
            <td style="padding: 12px; border-bottom: 1px solid #222; font-size: 14px; color: #ffffff;">${phone}</td>
          </tr>
          ${note ? `<tr>
            <td style="padding: 12px; border-bottom: 1px solid #222; color: #888; font-size: 13px;">Ghi chú</td>
            <td style="padding: 12px; border-bottom: 1px solid #222; font-size: 14px; color: #ffffff;">${note}</td>
          </tr>` : ""}
        </table>
        <p style="margin: 0 0 8px; font-size: 14px; color: #999;">Nhân viên tư vấn sẽ liên hệ xác nhận lịch hẹn sớm nhất.</p>
        <p style="margin: 0; font-size: 13px; color: #666;">Hotline: <a href="tel:0909888668" style="color: #e31837; text-decoration: none;">0909 888 668</a></p>
      </div>
      <div style="background: #111; padding: 16px 24px; text-align: center; font-size: 11px; color: #555;">
        © ${new Date().getFullYear()} TQ Auto Showroom. All rights reserved.
      </div>
    </div>
  `;
}

/**
 * Template for when an admin confirms an appointment
 */
export function getAppointmentConfirmationHtml(
  customerName: string,
  carName: string,
  formattedDate: string,
  showroomAddress: string,
  customerPhone: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #f4f6f9;
          margin: 0;
          padding: 0;
          color: #1a202c;
        }
        .container {
          max-width: 600px;
          margin: 30px auto;
          background: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border: 1px solid #e2e8f0;
        }
        .header {
          background-color: #11161d;
          padding: 40px 30px;
          text-align: center;
          border-bottom: 3px solid #e31837;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: 2px;
        }
        .header h1 span {
          color: #e31837;
        }
        .content {
          padding: 40px 30px;
          line-height: 1.8;
        }
        .greeting {
          font-size: 18px;
          font-weight: 700;
          color: #11161d;
          margin-bottom: 20px;
        }
        .thank-you {
          font-size: 15px;
          color: #4a5568;
          margin-bottom: 30px;
        }
        .details-box {
          background-color: #f7fafc;
          border-left: 4px solid #e31837;
          padding: 24px;
          margin-bottom: 30px;
          border-radius: 0 8px 8px 0;
        }
        .details-title {
          font-weight: 800;
          margin-bottom: 16px;
          color: #11161d;
          text-transform: uppercase;
          font-size: 13px;
          letter-spacing: 1px;
        }
        .details-table {
          width: 100%;
          border-collapse: collapse;
        }
        .details-row {
          border-bottom: 1px solid #edf2f7;
        }
        .details-row:last-child {
          border-bottom: none;
        }
        .details-label {
          font-weight: 600;
          padding: 10px 0;
          color: #718096;
          font-size: 14px;
          width: 140px;
          vertical-align: top;
        }
        .details-value {
          padding: 10px 0;
          color: #1a202c;
          font-size: 14px;
        }
        .note {
          font-size: 13px;
          color: #718096;
          margin-top: 30px;
          border-top: 1px dashed #e2e8f0;
          padding-top: 20px;
          font-style: italic;
        }
        .footer {
          background-color: #11161d;
          color: #a0aec0;
          text-align: center;
          padding: 25px;
          font-size: 12px;
          border-top: 1px solid #2d3748;
        }
        .footer p {
          margin: 5px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>TQ <span>AUTO</span></h1>
        </div>
        <div class="content">
          <div class="greeting">Kính gửi Anh/Chị ${customerName},</div>
          <div class="thank-you">
            Cảm ơn Anh/Chị đã đăng ký lịch xem xe tại showroom của chúng tôi. Lịch hẹn của Anh/Chị đã được <strong>xác nhận thành công</strong> với các thông tin chi tiết dưới đây:
          </div>
          
          <div class="details-box">
            <div class="details-title">Thông tin chi tiết lịch hẹn</div>
            <table class="details-table">
              <tr class="details-row">
                <td class="details-label">Xe quan tâm:</td>
                <td class="details-value"><strong>${carName}</strong></td>
              </tr>
              <tr class="details-row">
                <td class="details-label">Thời gian hẹn:</td>
                <td class="details-value">${formattedDate}</td>
              </tr>
              <tr class="details-row">
                <td class="details-label">Địa điểm xem xe:</td>
                <td class="details-value">${showroomAddress}</td>
              </tr>
              <tr class="details-row">
                <td class="details-label">Số điện thoại:</td>
                <td class="details-value">${customerPhone}</td>
              </tr>
            </table>
          </div>
          
          <p>Nếu Anh/Chị cần thay đổi lịch hẹn hoặc có bất kỳ câu hỏi nào, vui lòng liên hệ trực tiếp với chúng tôi qua hotline: 0348 115 938.</p>
          <p>Rất hân hạnh được đón tiếp Anh/Chị tại showroom của TQ Auto!</p>
          <p>Trân trọng,<br/><strong>Đội ngũ TQ Auto</strong></p>
          
          <div class="note">
            * Đây là email tự động từ hệ thống quản lý lịch hẹn của TQ Auto. Vui lòng không trả lời trực tiếp vào địa chỉ này.
          </div>
        </div>
        <div class="footer">
          <p><strong>Hệ thống Showroom Ô tô TQ Auto</strong></p>
          <p>Địa chỉ: Showroom TQ Auto, TP. Hồ Chí Minh & Hà Nội</p>
          <p>&copy; 2026 TQ Auto Showroom. Bảo lưu mọi quyền.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Template for when an admin cancels an appointment
 */
export function getAppointmentCancelledHtml(
  customerName: string,
  carName: string,
  formattedDate: string,
  showroomAddress: string,
  customerPhone: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #f4f6f9;
          margin: 0;
          padding: 0;
          color: #1a202c;
        }
        .container {
          max-width: 600px;
          margin: 30px auto;
          background: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border: 1px solid #e2e8f0;
        }
        .header {
          background-color: #11161d;
          padding: 40px 30px;
          text-align: center;
          border-bottom: 3px solid #e31837;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: 2px;
        }
        .header h1 span {
          color: #e31837;
        }
        .content {
          padding: 40px 30px;
          line-height: 1.8;
        }
        .greeting {
          font-size: 18px;
          font-weight: 700;
          color: #11161d;
          margin-bottom: 20px;
        }
        .status-box {
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
          padding: 16px 20px;
          border-radius: 8px;
          margin-bottom: 30px;
          font-weight: 600;
          font-size: 15px;
        }
        .details-box {
          background-color: #f7fafc;
          border-left: 4px solid #718096;
          padding: 24px;
          margin-bottom: 30px;
          border-radius: 0 8px 8px 0;
        }
        .details-title {
          font-weight: 800;
          margin-bottom: 16px;
          color: #11161d;
          text-transform: uppercase;
          font-size: 13px;
          letter-spacing: 1px;
        }
        .details-table {
          width: 100%;
          border-collapse: collapse;
        }
        .details-row {
          border-bottom: 1px solid #edf2f7;
        }
        .details-row:last-child {
          border-bottom: none;
        }
        .details-label {
          font-weight: 600;
          padding: 10px 0;
          color: #718096;
          font-size: 14px;
          width: 140px;
          vertical-align: top;
        }
        .details-value {
          padding: 10px 0;
          color: #1a202c;
          font-size: 14px;
        }
        .note {
          font-size: 13px;
          color: #718096;
          margin-top: 30px;
          border-top: 1px dashed #e2e8f0;
          padding-top: 20px;
          font-style: italic;
        }
        .footer {
          background-color: #11161d;
          color: #a0aec0;
          text-align: center;
          padding: 25px;
          font-size: 12px;
          border-top: 1px solid #2d3748;
        }
        .footer p {
          margin: 5px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>TQ <span>AUTO</span></h1>
        </div>
        <div class="content">
          <div class="greeting">Kính gửi Anh/Chị ${customerName},</div>
          
          <div class="status-box">
            Lịch hẹn xem xe của Anh/Chị đã được HỦY thành công.
          </div>
          
          <div class="thank-you">
            Chúng tôi xin thông báo lịch hẹn xem xe của Anh/Chị tại showroom đã được hủy. Dưới đây là thông tin chi tiết lịch hẹn đã hủy:
          </div>
          
          <div class="details-box">
            <div class="details-title">Thông tin chi tiết lịch hẹn</div>
            <table class="details-table">
              <tr class="details-row">
                <td class="details-label">Xe quan tâm:</td>
                <td class="details-value"><strong>${carName}</strong></td>
              </tr>
              <tr class="details-row">
                <td class="details-label">Thời gian hẹn:</td>
                <td class="details-value">${formattedDate}</td>
              </tr>
              <tr class="details-row">
                <td class="details-label">Địa điểm xem xe:</td>
                <td class="details-value">${showroomAddress}</td>
              </tr>
              <tr class="details-row">
                <td class="details-label">Số điện thoại:</td>
                <td class="details-value">${customerPhone}</td>
              </tr>
            </table>
          </div>
          
          <p>Nếu việc hủy này là một sự nhầm lẫn hoặc Anh/Chị muốn đặt lại lịch hẹn khác, vui lòng liên hệ trực tiếp với chúng tôi qua hotline hỗ trợ chăm sóc khách hàng để được trợ giúp ngay lập tức.</p>
          <p>Trân trọng,<br/><strong>Đội ngũ TQ Auto</strong></p>
          
          <div class="note">
            * Đây là email tự động từ hệ thống quản lý lịch hẹn của TQ Auto. Vui lòng không trả lời trực tiếp vào địa chỉ này.
          </div>
        </div>
        <div class="footer">
          <p><strong>Hệ thống Showroom Ô tô TQ Auto</strong></p>
          <p>Địa chỉ: Showroom TQ Auto, TP. Hồ Chí Minh & Hà Nội</p>
          <p>&copy; 2026 TQ Auto Showroom. Bảo lưu mọi quyền.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Template for when a customer submits a contact/consultation request
 */
export function getContactConfirmationHtml(
  fullName: string,
  consultationType: string,
  phone: string,
  message: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: sans-serif; background-color: #f4f6f9; color: #1a202c; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
        .header { background-color: #11161d; padding: 30px; text-align: center; border-bottom: 3px solid #e31837; }
        .header h1 { margin: 0; font-size: 24px; color: #ffffff; letter-spacing: 1px; }
        .header h1 span { color: #e31837; }
        .content { padding: 30px; line-height: 1.6; }
        .greeting { font-size: 16px; font-weight: bold; color: #11161d; margin-bottom: 15px; }
        .details { background-color: #f7fafc; border-left: 4px solid #e31837; padding: 15px; margin: 20px 0; border-radius: 0 6px 6px 0; }
        .footer { background-color: #11161d; color: #a0aec0; text-align: center; padding: 20px; font-size: 11px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>TQ <span>AUTO</span></h1>
        </div>
        <div class="content">
          <div class="greeting">Kính gửi Anh/Chị ${fullName},</div>
          <p>Cảm ơn Anh/Chị đã gửi yêu cầu tư vấn tới hệ thống showroom TQ Auto. Chúng tôi đã ghi nhận yêu cầu của Anh/Chị với các thông tin như sau:</p>
          
          <div class="details">
            <p><strong>Nhu cầu tư vấn:</strong> ${consultationType}</p>
            <p><strong>Số điện thoại:</strong> ${phone}</p>
            <p><strong>Nội dung yêu cầu:</strong> ${message}</p>
          </div>
          
          <p>Đội ngũ chuyên viên tư vấn của TQ Auto đang xử lý yêu cầu này và sẽ liên hệ trực tiếp với Anh/Chị qua số điện thoại trong thời gian sớm nhất.</p>
          <p>Trân trọng cảm ơn,<br/><strong>Đội ngũ showroom TQ Auto</strong></p>
        </div>
        <div class="footer">
          <p>&copy; 2026 TQ Auto Showroom. Bảo lưu mọi quyền.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Template for when a customer requests a password reset link
 */
export function getPasswordResetHtml(
  email: string,
  resetLink: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #f4f6f9;
          margin: 0;
          padding: 0;
          color: #1a202c;
        }
        .container {
          max-width: 600px;
          margin: 30px auto;
          background: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border: 1px solid #e2e8f0;
        }
        .header {
          background-color: #11161d;
          padding: 40px 30px;
          text-align: center;
          border-bottom: 3px solid #e31837;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: 2px;
        }
        .header h1 span {
          color: #e31837;
        }
        .content {
          padding: 40px 30px;
          line-height: 1.8;
        }
        .greeting {
          font-size: 18px;
          font-weight: 700;
          color: #11161d;
          margin-bottom: 20px;
        }
        .instruction {
          font-size: 15px;
          color: #4a5568;
          margin-bottom: 30px;
        }
        .btn-container {
          text-align: center;
          margin: 35px 0;
        }
        .btn {
          background-color: #e31837;
          color: #ffffff !important;
          padding: 14px 28px;
          font-size: 14px;
          font-weight: bold;
          text-decoration: none;
          border-radius: 6px;
          display: inline-block;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .note {
          font-size: 13px;
          color: #718096;
          margin-top: 30px;
          border-top: 1px dashed #e2e8f0;
          padding-top: 20px;
          font-style: italic;
        }
        .footer {
          background-color: #11161d;
          color: #a0aec0;
          text-align: center;
          padding: 25px;
          font-size: 12px;
          border-top: 1px solid #2d3748;
        }
        .footer p {
          margin: 5px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>TQ <span>AUTO</span></h1>
        </div>
        <div class="content">
          <div class="greeting">Kính gửi Anh/Chị,</div>
          <div class="instruction">
            Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản liên kết với email <strong>${email}</strong> trên hệ thống TQ Auto Showroom. 
            Vui lòng nhấn vào nút dưới đây để tiến hành đặt lại mật khẩu mới:
          </div>
          
          <div class="btn-container">
            <a href="${resetLink}" class="btn" target="_blank">Đặt lại mật khẩu</a>
          </div>
          
          <p>Nếu Anh/Chị không gửi yêu cầu này, vui lòng bỏ qua email này hoặc liên hệ ngay với chúng tôi để bảo vệ tài khoản.</p>
          <p>Liên kết đặt lại mật khẩu này chỉ có hiệu lực trong vòng <strong>15 phút</strong> kể từ khi email được gửi đi.</p>
          <p>Trân trọng,<br/><strong>Đội ngũ TQ Auto</strong></p>
          
          <div class="note">
            * Đây là email tự động từ hệ thống TQ Auto. Vui lòng không trả lời trực tiếp vào địa chỉ này. Nếu nút không hoạt động, Anh/Chị có thể sao chép liên kết sau vào trình duyệt: <br/>
            <a href="${resetLink}" style="color: #e31837; word-break: break-all;">${resetLink}</a>
          </div>
        </div>
        <div class="footer">
          <p><strong>Hệ thống Showroom Ô tô TQ Auto</strong></p>
          <p>Địa chỉ: Showroom TQ Auto, TP. Hồ Chí Minh & Hà Nội</p>
          <p>&copy; 2026 TQ Auto Showroom. Bảo lưu mọi quyền.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
