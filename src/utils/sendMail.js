const { Resend } = require("resend");

const resend = new Resend("re_69cTxgCz_3U22g1vSodKSveoZpxRwe79s");

async function sendMail({ toEmail, toName, subject, textPart, htmlPart }) {
  return new Promise((resolve, reject) => {
    resend.emails
      .send({
        from: "Nextview Kavach <notifications@nextviewkavach.in>",
        to: [`${toName} <${toEmail}>`],
        subject: subject,
        text: textPart,
        html: htmlPart,
        headers: {
          Importance: "high",
          Priority: "urgent",
          "X-Priority": "1",
        },
      })
      .then((response) => {
        console.log(response);
        console.log("Email sent successfully");
        console.log("Message ID:", response.data.id);
        resolve(response);
      })
      .catch((error) => {
        console.error("Error sending email:", error);
        reject(error);
      });
  });
}

module.exports = sendMail;
