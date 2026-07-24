import { transporter } from "../config/nodemailer.js";



export async function sendMail({to, subject, html}) {
    try{
        console.log("DEBUGGING...")
        const info = await transporter.sendMail({
            from: `"CodeWithLokesh: " <${process.env.ZOHO_SMTP_USER}>`,
            to,
            subject,
            html,
        });

        console.log("Email sent:", info.messageId);
        return info;
    }   
    catch(err){
        console.error("Error sending email:", err);
        throw err;
    }
}