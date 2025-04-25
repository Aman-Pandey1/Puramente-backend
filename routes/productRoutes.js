import express from "express";
import multer from "multer";
import xlsx from "xlsx";
import Product from "../model/Product.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/admin/uploadexcel", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const jsonData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const products = jsonData.map((row) => ({
      name: row.name,
      code: row.code,
      description: row.description,
      category: row.category,
      imageurl: row.image,
    }));

    await Product.insertMany(products);

    res.status(200).json({
      message: "Products uploaded successfully",
      count: products.length,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const products = await Product.find();

    const formattedProducts = products.map((product) => {
      if (!product.image || !product.image.data) {
        return { ...product._doc, image: null };
      }
      return {
        ...product._doc,
        image: `data:${
          product.image.contentType
        };base64,${product.image.data.toString("base64")}`,
      };
    });

    res.status(200).json(formattedProducts);
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

router.get("/product", async (req, res) => {
  try {
    const query = req.query.search;
    if (!query) return res.json([]);

    const products = await Product.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { code: { $regex: query, $options: "i" } },
      ],
    });

    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/category/:category", async (req, res) => {
  try {
    const category = req.params.category;
    const products = await Product.find({ category });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/single/:id", async (req, resp) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    resp.json(product);
  } catch (err) {
    resp.status(500).json({ message: err.message });
  }
});

router.post("/admin/add", upload.single("image"), async (req, res) => {
  try {
    const { name, category, description, code } = req.body;

    const image = req.file
      ? {
          data: req.file.buffer,
          contentType: req.file.mimetype,
        }
      : null;

    const newProduct = new Product({
      name,
      category,
      description,
      code,
      image,
    });

    await newProduct.save();
    res
      .status(201)
      .json({ product: newProduct, message: "Product added successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to create product" });
  }
});

router.put("/admin/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(200).json(updatedProduct);
  } catch (err) {
    res.status(500).json({ error: "Failed to update product" });
  }
});

router.delete("/admin/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    await product.deleteOne();
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete product" });
  }
});

export default router;
