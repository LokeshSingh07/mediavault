import { MAIL_SUBJECTS } from "../emails/constants.js";

import { welcomeTemplate } from "../emails/templates/user/welcome.template.js";
import { otpTemplate } from "../emails/templates/auth/otp.template.js";
import { sendMail } from "../utils/sendMail.utils.js";



class MailService{
    async sendWelcomeEmail({name, email}){
        const subject = MAIL_SUBJECTS.WELCOME;  

        return await sendMail({
            to: email, 
            subject: subject, 
            html: welcomeTemplate({name})
        });
    }

    async sendOtpEmail({ name, email, otp }) {
        const subject = MAIL_SUBJECTS.OTP;

        return sendMail({
            to: email,
            subject: subject,
            html: otpTemplate({ name, otp }),
        });
    }
}

export default new MailService();