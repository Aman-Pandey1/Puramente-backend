import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import ExcelJS from "exceljs";
import Order from "../model/Order.js";
import { getNextOrderId } from "../config/getNextOrderId.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const router = express.Router();

// Ensure uploads directory exists
const ensureUploadsDirectory = () => {
  const uploadPath = path.join(__dirname, "../uploads");
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
    console.log(`Created uploads directory at: ${uploadPath}`);
  }
  return uploadPath;
};

// ✅ Generate Quotation Excel
const generateExcelFile = async (orderData, filePath) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Price Quotation");

  // Load logo
  const logoPath = path.join(__dirname, "../assets/logo.png"); // Change this if your logo is elsewhere
  if (fs.existsSync(logoPath)) {
    const logoImage = workbook.addImage({
      filename: logoPath,
      extension: "png",
    });
    sheet.addImage(logoImage, {
      tl: { col: 0, row: 0 },
      ext: { width: 160, height: 80 },
    });
  }

  // Company Info
  sheet.mergeCells("C1:F1");
  sheet.getCell("C1").value = "Puramente International";
  sheet.getCell("C1").font = { size: 18, bold: true };
  sheet.getCell("C1").alignment = { horizontal: "center" };

  sheet.mergeCells("C2:F2");
  sheet.getCell("C2").value =
    "113/101, Sector-11, Pratap Nagar, Sanganer, Jaipur, 302033";
  sheet.getCell("C2").alignment = { horizontal: "center" };

  sheet.mergeCells("C3:F3");
  sheet.getCell("C3").value = "Mob: +91 9799168300 / 9314346148";
  sheet.getCell("C3").alignment = { horizontal: "center" };

  sheet.mergeCells("C4:F4");
  sheet.getCell("C4").value = "www.puramenteinternational.com";
  sheet.getCell("C4").font = { color: { argb: "FF0000FF" }, underline: true };
  sheet.getCell("C4").alignment = { horizontal: "center" };

  sheet.addRow([]);

  // Title
  sheet.mergeCells("A6:F6");
  const titleRow = sheet.getCell("A6");
  titleRow.value = "PRICE QUOTATION";
  titleRow.font = { size: 16, bold: true };
  titleRow.alignment = { vertical: "middle", horizontal: "center" };

  sheet.addRow([]);

  // Customer Info
  const customerInfo = [
    ["Name:", orderData.firstName || ""],
    ["Email:", orderData.email || ""],
    ["Mob.:", orderData.contactNumber || ""],
    ["Company:", orderData.companyName || ""],
    ["Address:", orderData.address || ""],
    ["Ref. No:", orderData.refNo || ""],
    ["Date:", orderData.date || ""],
    ["Currency:", orderData.currency || "US$"],
  ];

  customerInfo.forEach(([field, value]) => {
    const row = sheet.addRow([field, value]);
    row.getCell(1).font = { bold: true };
    row.height = 20;
  });

  sheet.addRow([]);

  // Table Header
  const headerRow = sheet.addRow([
    "Model No.",
    "Image",
    "Item",
    "Metal",
    "Price",
    "Qty",
    "Amount",
  ]);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4F81BD" },
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  // Products
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

    // // Insert Image
    // if (item.imageurl && fs.existsSync(item.imageurl)) {
    //   const imageId = workbook.addImage({
    //     filename: item.imageurl,
    //     extension: "png",
    //   });

    //   sheet.addImage(imageId, {
    //     tl: { col: 1, row: row.number - 1 },
    //     ext: { width: 50, height: 50 },
    //   });

    //   sheet.getRow(row.number).height = 60; // Increase row height for image
    // }
  }

  // Column Widths
  const widths = [15, 15, 20, 15, 10, 8, 10];
  sheet.columns.forEach((col, idx) => {
    col.width = widths[idx] || 15;
  });

  await workbook.xlsx.writeFile(filePath);
};

// 📤 Submit Order API
router.post("/submit-order", async (req, res) => {
  try {
    const {
      firstName,
      email,
      contactNumber,
      companyName,
      country,
      address,
      refNo,
      date,
      currency,
      orderDetails,
    } = req.body;

    if (!firstName || !email || !contactNumber || !country) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const orderId = await getNextOrderId();
    const uploadPath = ensureUploadsDirectory();
    const filePath = path.join(uploadPath, `Order_${orderId}.xlsx`);

    await generateExcelFile(
      {
        orderId,
        firstName,
        email,
        contactNumber,
        companyName,
        country,
        address,
        refNo,
        date,
        currency,
        orderDetails,
      },
      filePath
    );

    const newOrder = new Order({
      orderId,
      firstName,
      email,
      contactNumber,
      companyName,
      country,
      address,
      refNo,
      date,
      currency,
      orderDetails,
      excelFilePath: `/uploads/${path.basename(filePath)}`,
    });

    await newOrder.save();

    const downloadLink = `${
      process.env.BASE_URL || "http://localhost:8000"
    }/api/orders/download/${path.basename(filePath)}`;

    res.status(200).json({
      message: "Order submitted successfully!",
      order: newOrder,
      downloadLink,
    });
  } catch (error) {
    console.error("Order submission error:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

// 📥 Download Excel API
router.get("/download/:filename", (req, res) => {
  const filePath = path.join(__dirname, "../uploads", req.params.filename);
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).json({ error: "File not found" });
  }
});

export default router;
