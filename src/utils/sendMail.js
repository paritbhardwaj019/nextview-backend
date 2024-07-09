const { resendConfig } = require("../config");
const { Resend } = require("resend");

// const mailJet = new Mailjet({
//   apiKey: mailJetConfig.apiKey,
//   apiSecret: mailJetConfig.apiSecret,
// });

// function sendMail({ toEmail, toName, subject, textPart, htmlPart }) {
//   return new Promise((resolve, reject) => {
//     mailJet
//       .post("send", { version: "v3.1" })
//       .request({
//         Messages: [
//           {
//             From: {
//               Email: mailJetConfig.fromEmail,
//               Name: mailJetConfig.fromName,
//             },
//             To: [
//               {
//                 Email: toEmail,
//                 Name: toName,
//               },
//             ],
//             Subject: subject,
//             TextPart: textPart,
//             HTMLPart: htmlPart,
//           },
//         ],
//       })
//       .then((result) => {
//         resolve(result.body);
//       })
//       .catch((err) => {
//         console.log(err);
//         reject(err.statusCode);
//       });
//   });
// }

// module.exports = sendMail;

const resend = new Resend(resendConfig.apiKey);

async function sendMail({ toEmail, toName, subject, textPart, htmlPart }) {
  return new Promise((resolve, reject) => {
    resend.emails
      .send({
        from: `${resendConfig.fromName} <${resendConfig.fromEmail}>`,
        to: toEmail,
        subject,
        html: htmlPart,
        text: textPart,
        headers: {
          Importance: "high",
          Priority: "urgent",
          "X-Priority": "1",
        },
      })
      .then((result) => resolve(result.data))
      .catch((error) => {
        console.log(error);
        return reject(error);
      });
  });
}

module.exports = sendMail;
