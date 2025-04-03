import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import Order from "../model/Order.js";
import { fileURLToPath } from "url";
import { dirname } from "path";
import ExcelJS from "exceljs";

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

// Storage config for Excel file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = ensureUploadsDirectory();
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `Order_${Date.now()}.xlsx`);
  },
});

const upload = multer({ storage });

// Generate structured Excel File
const generateExcelFile = async (orderData, filePath) => {
  const workbook = new ExcelJS.Workbook();
  
  // Main order details sheet
  const orderSheet = workbook.addWorksheet("Order Details");
  orderSheet.columns = [
    { header: "Field", key: "field", width: 30 },
    { header: "Value", key: "value", width: 50 },
  ];

  // Write order details in row format
  Object.entries(orderData).forEach(([key, value]) => {
    if (key !== "orderDetails") { // Exclude orderDetails as it will go in a separate sheet
      orderSheet.addRow({ field: key, value: value });
    }
  });

  // Order items sheet
  const itemsSheet = workbook.addWorksheet("Order Items");
  itemsSheet.columns = [
    { header: "#", key: "index", width: 5 },
    { header: "Product Name", key: "name", width: 30 },
    { header: "SKU", key: "sku", width: 20 },
    { header: "Quantity", key: "quantity", width: 15 },
  ];

  let orderItems = [];
  try {
    orderItems = typeof orderData.orderDetails === "string" 
      ? JSON.parse(orderData.orderDetails) 
      : orderData.orderDetails || [];
  } catch (error) {
    console.error("Invalid JSON format in orderDetails:", error);
    orderItems = [];
  }

  orderItems.forEach((item, index) => {
    itemsSheet.addRow({ index: index + 1, ...item });
  });

  await workbook.xlsx.writeFile(filePath);
};

// Order Submission Route
router.post("/submit-order", async (req, res) => {
  try {
    const {
      firstName,
      email,
      contactNumber,
      companyName,
      country,
      companyWebsite,
      message,
      orderDetails,
    } = req.body;

    if (!firstName || !email || !contactNumber || !country) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const uploadPath = ensureUploadsDirectory();
    const filePath = path.join(uploadPath, `Order_${Date.now()}.xlsx`);

    await generateExcelFile(
      { firstName, email, contactNumber, companyName, country, companyWebsite, message, orderDetails },
      filePath
    );

    const newOrder = new Order({
      firstName,
      email,
      contactNumber,
      companyName,
      country,
      companyWebsite,
      message,
      orderDetails,
      excelFilePath: `/uploads/${path.basename(filePath)}`,
    });

    await newOrder.save();

    const downloadLink = `${process.env.BASE_URL || "http://localhost:8000"}/api/orders/download/${path.basename(filePath)}`;

    res.status(200).json({
      message: "Order submitted successfully!",
      downloadLink,
    });
  } catch (error) {
    console.error("Order submission error:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

// Download Excel File Route
router.get("/download/:filename", (req, res) => {
  const filePath = path.join(__dirname, "../uploads", req.params.filename);
  if (fs.existsSync(filePath)) {
    res.download(filePath, (err) => {
      if (err) {
        res.status(500).json({ error: "Error downloading file" });
      }
    });
  } else {
    res.status(404).json({ error: "File not found" });
  }
});

export default router;
