const MailGen = require("mailgen");

module.exports = async ({ name, link }) => {
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
      intro: "Welcome to NextView! We're very excited to have you on board.",
      action: {
        instructions: "To get started with NextView, Please click here:",
        button: {
          color: "#d90a12",
          text: "Confirm your account",
          link,
        },
      },
      outro:
        "Need help, or have questions? Just reply to this email, we'd love to help.",
    },
  };

  return {
    body: mailGenerator.generate(email),
    text: mailGenerator.generatePlaintext(email),
  };
};
