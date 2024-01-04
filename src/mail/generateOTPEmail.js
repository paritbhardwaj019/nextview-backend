// const MailGen = require("mailgen");

// module.exports = async ({ name, otp }) => {
//   const mailGenerator = new MailGen({
//     theme: "default",
//     product: {
//       name: "NextView",
//       link: "https://www.nextviewkavach.com/",
//       logo: "https://www.nextviewkavach.com/images/logo.svg",
//     },
//   });

//   const email = {
//     body: {
//       name,
//       intro: `Your OTP for NextView: ${otp}`,
//       outro:
//         "Need help or have questions? Just reply to this email; we'd love to help.",
//     },
//   };
//   return {
//     text: mailGenerator.generatePlaintext(email),
//     body: mailGenerator.generate(email),
//   };
// };

const generateOTPEmail = ({ otp, name }) => {
  return `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
    <div style="margin:50px auto;width:70%;padding:20px 0">
      <div style="border-bottom:1px solid #eee">
        <a
          href=""
          style="font-size:1.4em;color: #910B11;text-decoration:none;font-weight:600"
        >
          Nextview Kavach
        </a>
      </div>
      <p style="font-size:1.1em">Hi, ${name}</p>
      <p>
        Thank you for choosing Nextview kavach. Use the following OTP to
        complete your Sign In process. OTP is valid for 5 minutes
      </p>
      <h2 style="background: #910B11;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">
        ${otp}
      </h2>
      <p style="font-size:0.9em;">
        Regards,
        <br />
        Nextview Kavach
      </p>
      <hr style="border:none;border-top:1px solid #eee" />
      <div style="float:right;padding:8px 0;color:#910B11;font-size:0.8em;line-height:1;font-weight:300">
        <p>NextView Technologies India Pvt. Ltd</p>
        <p>409 - 410 Maurya Atria, Nr.Atithi restaurant cross Road</p>
        <p>Ahmedabad, Gujarat, India</p>
      </div>
    </div>
  </div> `;
};

module.exports = generateOTPEmail;
