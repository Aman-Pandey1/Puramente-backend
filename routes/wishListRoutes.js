import express from "express";
import WishList from "../model/WishList.js";
import mongoose from "mongoose";

const router = express.Router();

router.get("/:userId", async (req, res) => {
  try {
    const wishlist = await WishList.findOne({ userId: req.params.userId });
    if (!wishlist)
      return res.status(404).json({ message: "Wishlist not found" });
    res.json(wishlist);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/add", async (req, res) => {
  try {
    const { userId, productId, name, price, imageUrl } = req.body;
    let wishlist = await WishList.findOne({ userId });

    if (!wishlist) {
      wishlist = new WishList({ userId, items: [] });
    }

    const existingItem = wishlist.items.find(
      (item) => item.productId.toString() === productId
    );
    if (existingItem) {
      return res.status(400).json({ message: "Item already in wishlist" });
    }

    wishlist.items.push({ productId, name, price, imageUrl });
    await wishlist.save();

    res.status(200).json({ message: "Item added to wishlist", wishlist });
  } catch (err) {
    res.status(500).json({ error: "Failed to add item to wishlist" });
  }
});

router.delete("/remove/:userId/:productId", async (req, res) => {
  try {
    const { userId, productId } = req.params;

    const wishlist = await WishList.findOne({ userId });

    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found" });
    }

    const objectIdProductId = new mongoose.Types.ObjectId(productId);

    wishlist.items = wishlist.items.filter(
      (item) => !item.productId.equals(objectIdProductId)
    );

    await wishlist.save();

    res.status(200).json({ message: "Item removed from wishlist", wishlist });
  } catch (err) {
    res.status(500).json({ error: "Failed to remove item from wishlist" });
  }
});

router.delete("/clear/:userId", async (req, res) => {
  try {
    await WishList.findOneAndDelete({ userId: req.params.userId });
    res.status(200).json({ message: "Wishlist cleared" });
  } catch (err) {
    res.status(500).json({ error: "Failed to clear wishlist" });
  }
});

export default router;
