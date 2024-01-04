const generateWelcomeMail = ({ phoneNumber, name, email, gstInNumber }) => {
  return `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
    <div style="margin:50px auto;width:70%;padding:20px 0">
        <div style="border-bottom:1px solid #eee">
            <a href="" style="font-size:1.4em;color: #910B11;text-decoration:none;font-weight:600">
                Nextview Kavach
            </a>
        </div>
        <p style="font-size:1.1em">Hi, ${name}</p>
        <p>
            Welcome to Nextview Kavach! We are thrilled to have you on board.
            Thank you for choosing us as your security solution.
        </p>
        <p>
            Here are your account details:
        </p>
        <div style="font-weight:700; display:grid;">
            <p style="margin: 10px 0;">Phone Number: ${phoneNumber}</p>
            <p style="margin: 10px 0;">GSTIN Number: ${gstInNumber}</p>
           ${email && `<p style="margin: 10px 0;">Email: ${email}</p>`}
        </div>
        <p>
            Feel free to explore our features and services. If you have any questions or need assistance,
            don't hesitate to reach out to our support team.
        </p>
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
</div>`;
};

module.exports = generateWelcomeMail;
