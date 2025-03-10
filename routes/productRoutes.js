import express from "express";
const router = express.Router();
import Product from "../model/Product.js";  

// Get all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get a single product by ID
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json(product);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Add a new product
router.post("/admin/add", async (req, res) => {
  try {
    const { name, category, description, imageUrl } = req.body;
    const newProduct = new Product({name, category, description, imageUrl});

    await newProduct.save();
    res.status(201).json({ product: newProduct, message: "Product added successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to create product" });
  }
});

// Update an existing product
router.put("/admin/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updatedProduct);
  } catch (err) {
    res.status(500).json({ error: "Failed to update product" });
  }
});

// Delete a product
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
