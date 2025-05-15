import express from "express";
import multer from "multer";
import path from "path";
import Blog from "../model/Blog.js"; // <-- import model

const router = express.Router();

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// POST - Create blog
router.post("/create", upload.single("image"), async (req, res) => {
  try {
    const { title, content } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }

    const blog = new Blog({ title, content, image });
    await blog.save();

    res.status(201).json({ message: "Blog uploaded successfully", blog });
  } catch (error) {
    console.error("❌ Upload error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// GET - Fetch all blogs
router.get("/", async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.status(200).json({ blogs });
  } catch (error) {
    console.error("❌ Fetch error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// PUT - Update blog
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { title, content } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : undefined;

    const updateData = {
      ...(title && { title }),
      ...(content && { content }),
      ...(image && { image }),
    };

    const blog = await Blog.findByIdAndUpdate(req.params.id, updateData, { new: true });

    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    res.status(200).json({ message: "Blog updated successfully", blog });
  } catch (error) {
    console.error("❌ Update error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// DELETE - Remove blog
router.delete("/:id", async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);

    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    res.status(200).json({ message: "Blog deleted successfully" });
  } catch (error) {
    console.error("❌ Delete error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;
