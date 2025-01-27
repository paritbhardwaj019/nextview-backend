const nodemailer = require("nodemailer");

const emailConfig = {
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
  auth: {
    user: "no_reply@nextviewkavach.in",
    pass: "b14ck-cyph3R",
  },
};

const transporter = nodemailer.createTransport(emailConfig);

async function sendMail({ toEmail, toName, subject, textPart, htmlPart }) {
  return new Promise((resolve, reject) => {
    const mailOptions = {
      from: '"Nextview Kavach" <no_reply@nextviewkavach.in>',
      to: `${toName} <${toEmail}>`,
      subject: subject,
      text: textPart,
      html: htmlPart,
      headers: {
        Importance: "high",
        Priority: "urgent",
        "X-Priority": "1",
      },
    };

    transporter
      .sendMail(mailOptions)
      .then((info) => {
        console.log("Email sent successfully");
        console.log("Message ID:", info.messageId);
        resolve(info);
      })
      .catch((error) => {
        console.error("Error sending email:", error);
        reject(error);
      });
  });
}

module.exports = sendMail;
