const MailGen = require("mailgen");

module.exports = async ({ name, otp }) => {
  const mailGenerator = new MailGen({
    theme: "default",
    product: {
      name: "NextView",
      link: "https://www.nextviewkavach.com/",
      logo: "https://www.nextviewkavach.com/images/logo.svg",
    },
  });

  const email = {
    body: {
      name,
      intro: `Your OTP for NextView: ${otp}`,
      outro:
        "Need help or have questions? Just reply to this email; we'd love to help.",
    },
  };
  return {
    text: mailGenerator.generatePlaintext(email),
    body: mailGenerator.generate(email),
  };
};
