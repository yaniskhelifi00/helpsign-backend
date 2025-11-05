import express from "express";
import { updateLocation, sendHelp } from "../controllers/appController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/send-help", authMiddleware, sendHelp);

export default router;
