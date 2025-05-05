import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

router.post("/send", async (req, res) => {
  const { name, email, message, contactNumber, companyName, country, companyWebsite } = req.body;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "gurdeepsainig2001@gmail.com",
      pass: "vlhodeapikacbmly", // Gmail App Password
    },
  });

  // Email to Admin
  const mailOptionsToAdmin = {
    from: "gurdeepsainig2001@gmail.com", // ✅ use your own verified email
    to: "gurdeepsainig2001@gmail.com",
    subject: `New Contact from ${name}`,
    html: `
      <h3>Contact Form Submission</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Contact Number:</strong> ${contactNumber}</p>
      <p><strong>Company Name:</strong> ${companyName}</p>
      <p><strong>Country:</strong> ${country}</p>
      <p><strong>Company Website:</strong> ${companyWebsite}</p>
      <p><strong>Message:</strong> ${message}</p>
    `,
  };

  // Auto-reply to User
  const mailOptionsToUser = {
    from: "gurdeepsainig2001@gmail.com", // ✅ again, must be your Gmail
    to: email,
    subject: "Thanks for contacting us",
    html: `
      <p>Dear ${name},</p>
      <p>Thank you for reaching out to us. We have received your message and will get back to you as soon as possible.</p>
      <p>Best regards,<br/>Puramente International Team</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptionsToAdmin);
    await transporter.sendMail(mailOptionsToUser);

    res.status(200).json({ message: "Emails sent successfully" });
  } catch (error) {
    console.error("Email Error:", error);
    res.status(500).json({ error: "Failed to send emails", details: error });
  }
});

export default router;
