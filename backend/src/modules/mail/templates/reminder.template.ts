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
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e40af 0%,#7c3aed 100%);padding:32px 40px 28px;">
              <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:rgba(255,255,255,0.65);text-transform:uppercase;letter-spacing:1px;">⬡ RMS Platform</p>
              <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">🔔 Nhắc nhở đánh giá nhân sự</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 16px;font-size:15px;color:#374151;">Xin chào <strong>${data.recipientName}</strong>,</p>
              <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.7;">${data.body}</p>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#1e40af,#7c3aed);border-radius:8px;">
                    <a href="${data.ctaUrl}"
                       style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;">
                      ${data.ctaLabel} →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:16px 40px;border-top:1px solid #f3f4f6;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">© 2026 RMS Platform · Email này được gửi tự động.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
