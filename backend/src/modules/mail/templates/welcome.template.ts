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
  const {
    fullName,
    email,
    employeeCode,
    position,
    department,
    defaultPassword,
    loginUrl,
  } = data;

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
        <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.07);">

          <!-- Header -->
          <tr>
            <td style="background:#4c1d95;padding:40px 48px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:rgba(255,255,255,0.12);border-radius:6px;padding:6px 12px;">
                    <span style="font-size:13px;color:#ffffff;letter-spacing:0.02em;">RMS Platform</span>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 6px;font-size:24px;font-weight:600;color:#ffffff;letter-spacing:-0.3px;line-height:1.3;">Chào mừng onboard!</p>
              <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.6);line-height:1.5;">Tài khoản RMS của bạn đã sẵn sàng</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 48px 40px;">

              <p style="margin:0 0 6px;font-size:17px;color:#111111;">Hi ${fullName},</p>
              <p style="margin:0 0 32px;font-size:14px;color:#888888;line-height:1.7;">
                IT đã tạo xong tài khoản <span style="color:#4c1d95;font-weight:600;">RMS Platform</span> cho bạn.
                Thông tin đăng nhập ở bên dưới — nhớ đổi mật khẩu ngay lần đầu vào nhé.
              </p>

              <!-- Thông tin nhân viên -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="border:1px solid #e5e7eb;border-radius:8px;border-collapse:separate;border-spacing:0;margin-bottom:24px;">
                <tr>
                  <td colspan="2"
                    style="padding:10px 20px;background:#f9fafb;border-bottom:1px solid #e5e7eb;border-radius:8px 8px 0 0;">
                    <span style="font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;">
                      Thông tin nhân viên
                    </span>
                  </td>
                </tr>
                <tr style="background:#ffffff;">
                  <td valign="top" width="150"
                    style="padding:12px 20px;font-size:13px;color:#9ca3af;border-bottom:1px solid #f3f4f6;">
                    Họ và tên
                  </td>
                  <td valign="top"
                    style="padding:12px 20px;font-size:13px;font-weight:500;color:#111827;border-bottom:1px solid #f3f4f6;">
                    ${fullName}
                  </td>
                </tr>
                <tr style="background:#fafafa;">
                  <td valign="top" width="150"
                    style="padding:12px 20px;font-size:13px;color:#9ca3af;border-bottom:1px solid #f3f4f6;">
                    Mã nhân viên
                  </td>
                  <td valign="top"
                    style="padding:12px 20px;font-size:13px;font-weight:500;color:#111827;border-bottom:1px solid #f3f4f6;">
                    ${employeeCode}
                  </td>
                </tr>
                <tr style="background:#ffffff;">
                  <td valign="top" width="150"
                    style="padding:12px 20px;font-size:13px;color:#9ca3af;border-bottom:1px solid #f3f4f6;">
                    Phòng ban
                  </td>
                  <td valign="top"
                    style="padding:12px 20px;font-size:13px;font-weight:500;color:#111827;border-bottom:1px solid #f3f4f6;">
                    ${department}
                  </td>
                </tr>
                <tr style="background:#fafafa;">
                  <td valign="top" width="150"
                    style="padding:12px 20px;font-size:13px;color:#9ca3af;">
                    Vị trí
                  </td>
                  <td valign="top"
                    style="padding:12px 20px;font-size:13px;font-weight:500;color:#111827;">
                    ${position}
                  </td>
                </tr>
              </table>

              <!-- Thông tin đăng nhập -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="border:1px solid #e5e7eb;border-radius:8px;border-collapse:separate;border-spacing:0;margin-bottom:24px;">
                <tr>
                  <td colspan="2"
                    style="padding:10px 20px;background:#f9fafb;border-bottom:1px solid #e5e7eb;border-radius:8px 8px 0 0;">
                    <span style="font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;">
                      Thông tin đăng nhập
                    </span>
                  </td>
                </tr>
                <tr style="background:#ffffff;">
                  <td valign="top" width="150"
                    style="padding:12px 20px;font-size:13px;color:#9ca3af;border-bottom:1px solid #f3f4f6;">
                    Email
                  </td>
                  <td valign="top"
                    style="padding:12px 20px;font-size:13px;font-weight:500;color:#111827;border-bottom:1px solid #f3f4f6;">
                    ${email}
                  </td>
                </tr>
                <tr style="background:#fafafa;">
                  <td valign="top" width="150"
                    style="padding:12px 20px;font-size:13px;color:#9ca3af;">
                    Mật khẩu tạm
                  </td>
                  <td valign="top"
                    style="padding:12px 20px;font-size:13px;font-weight:500;color:#111827;">
                    ${defaultPassword}
                  </td>
                </tr>
              </table>

              <!-- Cảnh báo -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#fff5f5;border:1px solid #fed7d7;border-radius:6px;padding:12px 16px;">
                    <p style="margin:0;font-size:12px;color:#c53030;line-height:1.6;">
                      ⚠ Vui lòng đổi mật khẩu ngay sau lần đăng nhập đầu tiên. Không chia sẻ thông tin này với bất kỳ ai.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#4c1d95;border-radius:6px;">
                    <a href="${loginUrl}"
                      style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.01em;">
                      Đăng nhập ngay →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Hỗ trợ -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:36px;">
                <tr>
                  <td style="border-top:1px solid #f3f4f6;padding-top:24px;">
                    <p style="margin:0 0 3px;font-size:13px;color:#555555;">Gặp vấn đề khi đăng nhập?</p>
                    <p style="margin:0;font-size:13px;color:#aaaaaa;">Liên hệ IT support hoặc HR để được hỗ trợ.</p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:18px 48px;border-top:1px solid #f0f0f0;">
              <p style="margin:0;font-size:12px;color:#bbbbbb;">
                © 2026 RMS Platform · Email tự động, vui lòng không reply vào đây.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
