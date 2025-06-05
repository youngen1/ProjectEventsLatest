require("dotenv").config();
const nodemailer = require("nodemailer");

async function sendTestEmail() {
  console.log("Starting email send test...");

  console.log("SMTP config:");
  console.log({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS ? "loaded" : "missing",
  });

  if (
    !process.env.EMAIL_HOST ||
    !process.env.EMAIL_PORT ||
    !process.env.EMAIL_USER ||
    !process.env.EMAIL_PASS
  ) {
    console.error("ERROR: Missing one or more required environment variables.");
    process.exit(1);
  }

  let transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_PORT == "465", // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Verify connection configuration
  transporter.verify(function (error, success) {
    if (error) {
      console.error("Error verifying transporter:", error);
    } else {
      console.log("Server is ready to take our messages");
    }
  });

  // Email options
  let mailOptions = {
    from: `"Test Mail" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER, // send to yourself for testing
    subject: "Test Email from Node.js",
    text: "Hello! This is a test email sent using Nodemailer via Hostinger SMTP.",
    html: "<p>Hello! This is a <strong>test email</strong> sent using Nodemailer via Hostinger SMTP.</p>",
  };

  try {
    let info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully!");
    console.log("Message ID:", info.messageId);
  } catch (err) {
    console.error("Error sending email:", err);
  }
}

sendTestEmail();
