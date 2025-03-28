import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  image: {
    data: Buffer, // Store image as binary data
    contentType: String, // Store image type (JPEG, PNG, etc.)
  },
  imageurl: {
    type: String,
  },
  category: { type: String, required: true },
  code: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Product = mongoose.model("Product", ProductSchema);

export default Product;
