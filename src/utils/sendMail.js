// const Mailjet = require("node-mailjet");
// const { mailJetConfig } = require("../config");

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
//               Email: mailJetConfig.fromMail,
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
//         reject(err.statusCode);
//       });
//   });
// }

// module.exports = sendMail;

const nodemailer = require("nodemailer");
const { gmailId, gmailPassword } = require("../config");

const sendMail = async ({ toEmail, toName, subject, textPart, htmlPart }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const transport = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: gmailId,
          pass: gmailPassword,
        },
      });

      const mailOptions = {
        from: `Netview <${gmailId}>`,
        to: toEmail,
        subject,
        text: textPart,
        html: htmlPart,
      };

      await transport.sendMail(mailOptions);
      resolve("OK");
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = sendMail;
