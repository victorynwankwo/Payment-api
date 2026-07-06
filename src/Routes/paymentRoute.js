import express from "express";
import { initializePayment, getPaymentStatus, webhook, verifyPayment} from "../controller/PaymentController.js";

const router = express.Router();

// Mount the initialize payment endpoint
router.post("/initialize", initializePayment);

// Mount the get payment status endpoint
router.get("/status/:reference", getPaymentStatus);

// Mount the webhook endpoint
router.post("/webhook", webhook);

router.get("/verify/:reference", verifyPayment);
export default router;
