
import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

export async function sendEmail({ to, subject, text, attachments }) {
    if (!SMTP_HOST || !SMTP_USER) {
        console.log("---------------------------------------------------");
        console.log(`[MOCK EMAIL] To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Body: ${text}`);
        if (attachments) console.log(`Attachments: ${attachments.length} file(s)`);
        console.log("---------------------------------------------------");
        return { success: true, message: "Email logged (Mock Mode)" };
    }

    const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: false, // true for 465, false for other ports
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
    });

    try {
        const info = await transporter.sendMail({
            from: `"Bharat Biz" <${SMTP_USER}>`,
            to,
            subject,
            text,
            attachments
        });

        console.log("Message sent: %s", info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("Email Error:", error);
        return { success: false, error: error.message };
    }
}
