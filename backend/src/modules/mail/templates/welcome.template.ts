export interface WelcomeTemplateData {
  fullName: string;
  email: string;
  employeeCode: string;
  position: string;
  department: string;
  defaultPassword: string;
  loginUrl: string;
}

export function welcomeTemplate(data: WelcomeTemplateData): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Chào mừng đến với RMS Platform</title>
</head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:48px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header gradient -->
          <tr>
            <td style="background:linear-gradient(135deg,#4c1d95 0%,#2563eb 100%);padding:0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:40px 48px 32px;">
                    <!-- Logo -->
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:rgba(255,255,255,0.15);border-radius:10px;padding:8px 14px;">
                          <span style="font-size:15px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">⬡ RMS Platform</span>
                        </td>
                      </tr>
                    </table>
                    <!-- Hero text -->
                    <p style="margin:28px 0 4px;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;line-height:1.2;">
                      Chào mừng bạn! 🎉
                    </p>
                    <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.75);line-height:1.5;">
                      Tài khoản của bạn đã sẵn sàng trên hệ thống quản lý nhân sự
                    </p>
                  </td>
                </tr>
                <!-- Wave divider -->
                <tr>
                  <td style="line-height:0;font-size:0;">
                    <svg viewBox="0 0 600 40" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;">
                      <path d="M0,20 C150,40 450,0 600,20 L600,40 L0,40 Z" fill="#ffffff"/>
                    </svg>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:8px 48px 40px;">

              <!-- Greeting -->
              <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:#111827;">
                Xin chào, ${data.fullName}!
              </p>
              <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.7;">
                Chúng tôi rất vui được chào đón bạn gia nhập đội ngũ. Tài khoản đăng nhập hệ thống
                <strong style="color:#4c1d95;">RMS Platform</strong> của bạn đã được tạo thành công.
                Dưới đây là thông tin bạn cần để bắt đầu.
              </p>

              <!-- Account info card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border:1.5px solid #e5e7eb;border-radius:12px;margin-bottom:28px;overflow:hidden;">
                <tr>
                  <td style="background:#f5f3ff;padding:14px 24px;border-bottom:1.5px solid #e5e7eb;">
                    <span style="font-size:12px;font-weight:700;color:#4c1d95;text-transform:uppercase;letter-spacing:0.8px;">Thông tin tài khoản</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${[
                        ['👤', 'Họ và tên', data.fullName],
                        ['🪪', 'Mã nhân viên', data.employeeCode],
                        ['🏢', 'Phòng ban', data.department],
                        ['💼', 'Vị trí', data.position],
                      ]
                        .map(
                          ([icon, label, value]) => `
                      <tr>
                        <td style="padding:7px 0;width:16px;vertical-align:middle;">
                          <span style="font-size:14px;">${icon}</span>
                        </td>
                        <td style="padding:7px 12px 7px 8px;font-size:13px;color:#9ca3af;width:120px;vertical-align:middle;">${label}</td>
                        <td style="padding:7px 0;font-size:13px;color:#111827;font-weight:600;vertical-align:middle;">${value}</td>
                      </tr>`,
                        )
                        .join('')}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Login credentials card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1.5px solid #fde68a;border-radius:12px;margin-bottom:28px;overflow:hidden;">
                <tr>
                  <td style="background:#fef3c7;padding:14px 24px;border-bottom:1.5px solid #fde68a;">
                    <span style="font-size:12px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.8px;">🔐 Thông tin đăng nhập</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:7px 0;font-size:13px;color:#92400e;width:140px;">Email</td>
                        <td style="padding:7px 0;font-size:13px;color:#111827;font-weight:600;">${data.email}</td>
                      </tr>
                      <tr>
                        <td style="padding:7px 0;font-size:13px;color:#92400e;">Mật khẩu tạm thời</td>
                        <td style="padding:7px 0;">
                          <span style="background:#111827;color:#fbbf24;font-family:monospace;font-size:15px;font-weight:700;padding:3px 10px;border-radius:6px;letter-spacing:2px;">${data.defaultPassword}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Warning -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border-left:4px solid #ef4444;border-radius:0 8px 8px 0;margin-bottom:32px;">
                <tr>
                  <td style="padding:14px 18px;">
                    <p style="margin:0;font-size:13px;color:#b91c1c;line-height:1.6;">
                      <strong>⚠️ Lưu ý bảo mật:</strong> Vui lòng đổi mật khẩu ngay sau lần đăng nhập đầu tiên.
                      Không chia sẻ thông tin đăng nhập với bất kỳ ai.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#4c1d95,#2563eb);border-radius:10px;box-shadow:0 4px 12px rgba(76,29,149,0.3);">
                    <a href="${data.loginUrl}"
                       style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:-0.2px;">
                      Đăng nhập ngay →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:36px 0 0;">
                <tr>
                  <td style="border-top:1px solid #f3f4f6;padding-top:24px;">
                    <p style="margin:0 0 4px;font-size:13px;color:#374151;font-weight:600;">Cần hỗ trợ?</p>
                    <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">
                      Liên hệ bộ phận IT hoặc HR nếu bạn gặp bất kỳ vấn đề nào khi đăng nhập.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 48px;border-top:1px solid #f3f4f6;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0;font-size:12px;color:#9ca3af;">
                      © 2026 RMS Platform · Email này được gửi tự động, vui lòng không reply.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
