import express from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import Cart from "../model/Cart.js";
import Order from "../model/Order.js";

dotenv.config();

const router = express.Router();

// Setup Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.ADMIN_EMAIL, 
    pass: process.env.ADMIN_EMAIL_PASSWORD, 
  },
});

// Checkout & Place Order
router.post("/checkout", async (req, res) => {
  try {
    const { userId, userEmail } = req.body;
    const cart = await Cart.findOne({ userId });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const newOrder = new Order({
      userId,
      items: cart.items,
      totalAmount: cart.totalAmount,
      status: "Pending",
    });

    await newOrder.save();
    await Cart.findOneAndDelete({ userId });

    const orderDetails = cart.items
      .map(
        (item) =>
          `• ${item.name} (x${item.quantity}) - $${item.price * item.quantity}`
      )
      .join("\n");

    const emailContent = `
      <h3>New Order Received</h3>
      <p><strong>User Email:</strong> ${userEmail}</p>
      <p><strong>Total Amount:</strong> $${cart.totalAmount}</p>
      <p><strong>Order Details:</strong></p>
      <pre>${orderDetails}</pre>
      <p>Please process the order manually.</p>
    `;

    await transporter.sendMail({
      from: process.env.ADMIN_EMAIL,
      to: process.env.ADMIN_EMAIL, 
      subject: "New Order Received",
      html: emailContent,
    });

    res.status(201).json({
      message: "Order placed successfully. Admin has been notified.",
      order: newOrder,
    });
  } catch (err) {
    console.error("Error placing order:", err);
    res.status(500).json({ error: "Failed to place order" });
  }
});


router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params; 
    const orders = await Order.find({ userId });
    res.status(200).json(orders);
  } catch (err) {
    console.error("Error retrieving orders:", err);
    res.status(500).json({ error: "Failed to retrieve orders" });
  }
});

export default router;
