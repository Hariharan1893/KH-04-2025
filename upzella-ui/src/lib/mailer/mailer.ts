import nodemailer from "nodemailer";

interface TransporterOptions {
  service?: string;
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user?: string;
    pass?: string;
  };
}

interface MailOptions {
  from?: string;
  to: string | string[];
  subject: string;
  html: string;
}

interface Transporter {
  sendMail(mailOptions: MailOptions): Promise<{ response: string }>;
}

const createTransporter = (provider: "zoho" | "gmail"): Transporter => {
  if (provider === "zoho") {
    const options: TransporterOptions = {
      host: "smtppro.zoho.in",
      port: 465,
      secure: true,
      auth: {
        user: process.env.ZOHO_USER,
        pass: process.env.ZOHO_PASS,
      },
    };
    return nodemailer.createTransport(options);
  } else if (provider === "gmail") {
    const options: TransporterOptions = {
      service: "Gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    };
    return nodemailer.createTransport(options);
  }
  throw new Error("Unsupported email provider");
};

const sendEmail = async (
  candidateEmails: string | string[],
  subject: string,
  provider: "zoho" | "gmail",
  message: string,
): Promise<void> => {
  const transporter: Transporter = createTransporter(provider);

  const mailOptions: MailOptions = {
    from: process.env.GMAIL_USER,
    to: candidateEmails,
    subject,
    html: message,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: ", info.response);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

export { sendEmail };
