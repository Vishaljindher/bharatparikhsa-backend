// testMail.js
const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // true only for 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.sendMail({
  from: process.env.SMTP_FROM || "eboys938@gmail.com",
  to: "eboys938@gmail.com",   // 👈 YE LINE MISSING THI
  subject: "Test Mail",
  text: "SMTP is working 🎉",
})

  .then(() => {
    console.log("✅ Test mail sent successfully");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Mail error:", err);
    process.exit(1);
  });
