// auth-back/utils/sendEmail.js
const nodemailer = require("nodemailer");

async function sendTicketEmail(toEmail, subject, text, attachmentBuffer, attachmentName = "ticket.pdf") {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    let info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: toEmail,
      subject: subject,
      text: text,
      attachments: [
        {
          filename: attachmentName,
          content: attachmentBuffer,
        },
      ],
    });

    console.log("Correo enviado:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error enviando correo:", error);
    throw error;
  }
}

module.exports = sendTicketEmail;
