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
      intro: " Welcome to NextView! We're thrilled to have you on board.",
      action: {
        instructions:
          "To get started with your account, please confirm your account by following the link below:",
        button: {
          color: "#d90a12",
          text: "Confirm your account",
          link,
        },
      },
      outro:
        "If you need any help or have questions, just reply to this email. We're here to assist you.",
    },
  };

  return {
    body: mailGenerator.generate(email),
    text: mailGenerator.generatePlaintext(email),
  };
};
