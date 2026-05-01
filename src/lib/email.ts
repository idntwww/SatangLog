import { Resend } from "resend";

function getResendClient() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendVerificationEmail(
  email: string,
  name: string,
  verifyToken: string
): Promise<void> {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "SatangLog";
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/verify-email?token=${verifyToken}`;

  await getResendClient().emails.send({
    from: `${appName} <noreply@${process.env.RESEND_DOMAIN || "satanglog.app"}>`,
    to: email,
    subject: `ยืนยันอีเมลของคุณ — ${appName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>สวัสดี ${name} 👋</h2>
        <p>ขอบคุณที่สมัครใช้งาน ${appName}!</p>
        <p>กรุณาคลิกปุ่มด้านล่างเพื่อยืนยันอีเมลของคุณ:</p>
        <a href="${verifyUrl}" 
           style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          ยืนยันอีเมล
        </a>
        <p style="color: #6b7280; font-size: 14px;">
          หากคุณไม่ได้สมัครใช้งาน กรุณาเพิกเฉยอีเมลนี้
        </p>
      </div>
    `,
  });
}
