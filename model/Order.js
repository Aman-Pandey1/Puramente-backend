import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  orderId: { type: Number, unique: true },
  firstName: { type: String, required: true },
  email: { type: String, required: true },
  contactNumber: { type: String, required: true },
  companyName: { type: String },
  country: { type: String, required: true },
  companyWebsite: { type: String },
  message: { type: String, required: false },
  orderDetails: [
    {
      name: { type: String, required: true },
      sku: { type: String, required: true },
      quantity: { type: Number, required: true, min: 1 },
    },
  ],
  excelFilePath: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Order = mongoose.model("Order", orderSchema);

export default Order;
