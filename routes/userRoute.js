import express from "express";
import User from "../model/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "info@puramentejewel.com",
    pass: process.env.EMAIL_PASS, // app password, not your email password
  },
});

router.get("/all", async (req, res) => {
  try {
    const users = await User.find().select("-password"); // Exclude passwords
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      contactNumber,
      country,
      companyName,
      companyWebsite,
    } = req.body;

    if (!contactNumber || !country) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      contactNumber,
      country,
      companyName,
      companyWebsite,
    });
    await user.save();

    // Send confirmation email to user
    await transporter.sendMail({
      from: "info@puramentejewel.com",
      to: email,
      subject: "Registration Successful",
      html: `<p>Hi ${name},</p><p>Thank you for registering with us!</p>`,
    });

    // Send user details to admin
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: "info@puramentejewel.com", // replace with your admin email
      subject: "New User Registration",
      html: `
        <h3>New User Details</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Contact Number:</strong> ${contactNumber}</p>
        <p><strong>Country:</strong> ${country}</p>
        <p><strong>Company Name:</strong> ${companyName}</p>
        <p><strong>Company Website:</strong> ${companyWebsite}</p>
      `,
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
      expiresIn: "12h", // Token expires in 12 hours
    });

    res.status(200).json({ message: "Login successful", token, user });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
