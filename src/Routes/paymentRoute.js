import express from "express";
import { initializePayment } from "../controller/PaymentController.js";

const router = express.Router();

// Mount the initialize payment endpoint
router.post("/initialize", initializePayment);

export default router;
