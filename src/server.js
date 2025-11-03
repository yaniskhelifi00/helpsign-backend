import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helpRoutes from "./routes/appRoutes.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/", helpRoutes);

app.get("/", (_, res) => res.send("🚀 Helpsign backend with Auth working!"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
