export interface ReminderTemplateData {
  recipientName: string;
  body: string;
  ctaUrl: string;
  ctaLabel: string;
}

export function reminderTemplate(data: ReminderTemplateData): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Nhắc nhở đánh giá nhân sự</title>
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
              <p style="margin:24px 0 6px;font-size:24px;font-weight:600;color:#ffffff;letter-spacing:-0.3px;line-height:1.3;">Nhắc nhở đánh giá nhân sự</p>
              <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.6);line-height:1.5;">Bạn có một nhắc nhở cần xử lý</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 48px 40px;">
              <p style="margin:0 0 16px;font-size:15px;color:#111111;">Xin chào <strong>${data.recipientName}</strong>,</p>
              <p style="margin:0 0 28px;font-size:14px;color:#888888;line-height:1.7;">${data.body}</p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#4c1d95;border-radius:6px;">
                    <a href="${data.ctaUrl}"
                       style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.01em;">
                      ${data.ctaLabel} →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:18px 48px;border-top:1px solid #f0f0f0;">
              <p style="margin:0;font-size:12px;color:#bbbbbb;">© 2026 RMS Platform · Email tự động, vui lòng không reply vào đây.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
