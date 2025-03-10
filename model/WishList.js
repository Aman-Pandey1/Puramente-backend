import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      imageUrl: { type: String, required: true },
    },
  ],
}, { timestamps: true });

const WishList =  mongoose.model("Wishlist", wishlistSchema);

export default WishList
