import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import ExcelJS from "exceljs";
import nodemailer from "nodemailer";
import Order from "../model/Order.js";
import { getNextOrderId } from "../config/getNextOrderId.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const router = express.Router();

const ensureUploadsDirectory = () => {
  const uploadPath = path.join(__dirname, "../uploads");
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }
  return uploadPath;
};

const generateExcelFile = async (orderData, filePath) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Price Quotation");

  const logoPath = path.join(__dirname, "../assets/logo.png");
  if (fs.existsSync(logoPath)) {
    const logoImage = workbook.addImage({ filename: logoPath, extension: "png" });
    sheet.addImage(logoImage, { tl: { col: 0, row: 0 }, ext: { width: 160, height: 80 } });
  }

  sheet.mergeCells("C1:F1");
  sheet.getCell("C1").value = "Puramente International";
  sheet.getCell("C1").font = { size: 18, bold: true };
  sheet.getCell("C1").alignment = { horizontal: "center" };

  sheet.mergeCells("C2:F2");
  sheet.getCell("C2").value = "113/101, Sector-11, Pratap Nagar, Jaipur";
  sheet.getCell("C2").alignment = { horizontal: "center" };

  sheet.mergeCells("C3:F3");
  sheet.getCell("C3").value = "Mob: +91 9799168300 / 9314346148";
  sheet.getCell("C3").alignment = { horizontal: "center" };

  sheet.mergeCells("C4:F4");
  sheet.getCell("C4").value = "www.puramenteinternational.com";
  sheet.getCell("C4").font = { color: { argb: "FF0000FF" }, underline: true };
  sheet.getCell("C4").alignment = { horizontal: "center" };

  sheet.addRow([]);
  sheet.mergeCells("A6:F6");
  sheet.getCell("A6").value = "PRICE QUOTATION";
  sheet.getCell("A6").font = { size: 16, bold: true };
  sheet.getCell("A6").alignment = { vertical: "middle", horizontal: "center" };

  sheet.addRow([]);

  const customerInfo = [
    ["Name:", orderData.firstName || ""],
    ["Email:", orderData.email || ""],
    ["Mob.:", orderData.contactNumber || ""],
    ["Company:", orderData.companyName || ""],
    ["Country:", orderData.country || ""],
  ];
  customerInfo.forEach(([field, value]) => {
    const row = sheet.addRow([field, value]);
    row.getCell(1).font = { bold: true };
    row.height = 20;
  });

  sheet.addRow([]);

  const headerRow = sheet.addRow(["Model No.", "Image", "Item", "Metal", "Price", "Qty", "Amount"]);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F81BD" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  const products = orderData.orderDetails || [];
  for (const item of products) {
    const row = sheet.addRow([
      item.sku || "",
      item.imageurl || "",
      item.name || "",
      item.metal || "925 SILVER",
      item.price ? `$${item.price}` : "$-",
      item.quantity || "",
      item.amount || "",
    ]);

    row.eachCell((cell) => {
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  }

  sheet.columns.forEach((col, idx) => {
    col.width = [15, 15, 20, 15, 10, 8, 10][idx] || 15;
  });

  await workbook.xlsx.writeFile(filePath);
};

router.post("/submit-order", async (req, res) => {
  try {
    const {
      firstName,
      email,
      contactNumber,
      companyName,
      country,
      orderDetails,
    } = req.body;

    if (!firstName || !email || !contactNumber || !country) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const orderId = await getNextOrderId();
    const uploadPath = ensureUploadsDirectory();
    const filePath = path.join(uploadPath, `Order_${orderId}.xlsx`);

    await generateExcelFile({ ...req.body, orderId }, filePath);

    const newOrder = new Order({
      orderId,
      firstName,
      email,
      contactNumber,
      companyName,
      country,
      orderDetails,
      excelFilePath: `/uploads/${path.basename(filePath)}`,
    });
    await newOrder.save();

    const downloadLink = `${process.env.BASE_URL || "http://localhost:8000"}/api/orders/download/${path.basename(filePath)}`;

    // Send emails using nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "gurdeepsainig2001@gmail.com",
        pass: "vlhodeapikacbmly",
      },
    });

    const adminMail = {
      from: email,
      to: "gurdeepsainig2001@gmail.com",
      subject: `New Order Request from ${firstName}`,
      html: `
        <h3>New Order Submitted</h3>
        <p><strong>Name:</strong> ${firstName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Contact:</strong> ${contactNumber}</p>
        <p><strong>Country:</strong> ${country}</p>
        <p><strong>Company:</strong> ${companyName}</p>
        <p><a href="${downloadLink}">Download Order Excel file</a></p>
      `,
    };

    const userMail = {
      from: "gurdeepsainig2001@gmail.com",
      to: email,
      subject: "Thanks for your quotation request",
      html: `
        <p>Dear ${firstName},</p>
        <p>Thank you for reaching out to Puramente International. We’ve received your request and will contact you shortly.</p>
        <p>Meanwhile, you can <a href="${downloadLink}">download your quotation</a>.</p>
        <p>Best regards,<br/>Puramente International Team</p>
      `,
    };

    await transporter.sendMail(adminMail);
    await transporter.sendMail(userMail);

    res.status(200).json({ message: "Order submitted and emails sent.", downloadLink });
  } catch (error) {
    console.error("Submit Order Error:", error);
    res.status(500).json({ error: "Internal server error.", details: error.message });
  }
});

router.get("/download/:filename", (req, res) => {
  const filePath = path.join(__dirname, "../uploads", req.params.filename);
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).json({ error: "File not found" });
  }
});

export default router;