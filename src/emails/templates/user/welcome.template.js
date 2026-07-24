export const welcomeTemplate = ({name}) => {
     const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Welcome</title>
      </head>
      <body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;padding:40px;">
                <tr>
                  <td align="center">
                    <h1 style="color:#2563eb;margin-bottom:10px;">
                      Welcome to CodeWithLokesh 🚀
                    </h1>

                    <p style="font-size:16px;color:#555;">
                      Hi <strong>${name}</strong>,
                    </p>

                    <p style="font-size:16px;color:#555;line-height:1.6;">
                      Thank you for joining <strong>CodeWithLokesh</strong>.
                      We're excited to have you on board.
                    </p>

                    <p style="font-size:16px;color:#555;line-height:1.6;">
                      You can now explore our platform and start your journey.
                    </p>

                    <div style="margin:35px 0;">
                      <a
                        href="https://codewithlokesh.com"
                        style="
                          background:#2563eb;
                          color:#fff;
                          text-decoration:none;
                          padding:12px 24px;
                          border-radius:6px;
                          display:inline-block;
                          font-weight:bold;
                        "
                      >
                        Visit Website
                      </a>
                    </div>

                    <hr style="border:none;border-top:1px solid #eee;">

                    <p style="font-size:13px;color:#888;">
                      If you didn't create this account, you can safely ignore this email.
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

    return html
}