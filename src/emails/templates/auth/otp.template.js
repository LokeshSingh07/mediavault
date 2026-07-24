export const otpTemplate = ({ otp }) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Your OTP Code</title>
      </head>

      <body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;padding:40px;">
                <tr>
                  <td align="center">

                    <h1 style="color:#2563eb;margin-bottom:10px;">
                      Verify Your Email
                    </h1>

                    <p style="font-size:16px;color:#555;line-height:1.6;">
                      We received a request to verify your email address.
                    </p>

                    <p style="font-size:16px;color:#555;">
                      Use the following One-Time Password (OTP):
                    </p>

                    <div
                      style="
                        display:inline-block;
                        margin:25px 0;
                        padding:15px 30px;
                        background:#2563eb;
                        color:#ffffff;
                        font-size:30px;
                        font-weight:bold;
                        letter-spacing:6px;
                        border-radius:8px;
                      "
                    >
                      ${otp}
                    </div>

                    <p style="font-size:15px;color:#555;line-height:1.6;">
                      This OTP is valid for <strong>10 minutes</strong>.
                      Please do not share it with anyone.
                    </p>

                    <hr style="border:none;border-top:1px solid #eee;margin:30px 0;" />

                    <p style="font-size:13px;color:#888;">
                      If you didn't request this OTP, you can safely ignore this email.
                    </p>

                    <p style="font-size:13px;color:#888;">
                      © ${new Date().getFullYear()} CodeWithLokesh. All rights reserved.
                    </p>

                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};