import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import userRegister from "./routes/userRoute.js";
import productRoutes from "./routes/productRoutes.js"
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderroutes.js"

dotenv.config();
connectDB();

const FRONTEND_URL = process.env.FRONTEND_URL

const app = express();
app.use(cors({
    origin: `${FRONTEND_URL}`, 
    methods: ["GET", "POST", "PUT", "DELETE"], 
    credentials: true
  }));

app.use(express.json());

// Routes
app.use("/api/users", userRegister);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


