import express from "express";
import { 
  initializePayment, 
  getPaymentStatus, 
  webhook, 
  verifyPayment 
} from "../controller/PaymentController.js";

const router = express.Router();

/**
 * @openapi
 * /api/payments/initialize:
 *   post:
 *     summary: Initialize a new transaction
 *     description: Generates a unique tracking reference, registers the transaction with Paystack, and creates an initialized record in MongoDB.
 *     tags:
 *       - Payments
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - amount
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: customer@example.com
 *               amount:
 *                 type: number
 *                 description: The absolute currency amount (e.g., 5000 for ₦5,000)
 *                 example: 5000
 *               userId:
 *                 type: string
 *                 example: "65d83f3e1c4b2a001fb34211"
 *               callbackUrl:
 *                 type: string
 *                 format: uri
 *                 example: "http://localhost:3000/payment-success"
 *               metadata:
 *                 type: object
 *                 example: { "customField": "value" }
 *     responses:
 *       200:
 *         description: Payment initialized successfully. Redirect the user to the authorizationUrl.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 authorizationUrl:
 *                   type: string
 *                   example: "https://paystack.com..."
 *                 reference:
 *                   type: string
 *                   example: "TXN-8F3D2A1C"
 *                 message:
 *                   type: string
 *                   example: "Payment initialized successfully. Redirect the user to the authorization URL."
 *       400:
 *         description: Missing required fields or Paystack gateway error.
 *       500:
 *         description: Internal Server Error.
 */
router.post("/initialize", initializePayment);

/**
 * @openapi
 * /api/payments/status/{reference}:
 *   get:
 *     summary: Get local payment status
 *     description: Checks the existing document inside MongoDB matching the reference string without calling external APIs.
 *     tags:
 *       - Payments
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique transaction reference (e.g., TXN-8F3D2A1C).
 *         example: "TXN-8F3D2A1C"
 *     responses:
 *       200:
 *         description: Local status fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: string
 *                   enum: [initialized, completed, failed]
 *                   example: "initialized"
 *       404:
 *         description: Transaction record not found in database.
 *       500:
 *         description: Internal Server Error.
 */
router.get("/status/:reference", getPaymentStatus);

/**
 * @openapi
 * /api/payments/verify/{reference}:
 *   get:
 *     summary: Verify payment status live
 *     description: Queries Paystack's official servers to check the live transaction status, updates MongoDB instantly, and handles order fulfillment.
 *     tags:
 *       - Payments
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique transaction reference to verify.
 *         example: "TXN-8F3D2A1C"
 *     responses:
 *       200:
 *         description: Transaction checked and verified successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: string
 *                   example: "completed"
 *                 message:
 *                   type: string
 *                   example: "Payment verified successfully via Paystack API."
 *       404:
 *         description: Transaction reference not found in MongoDB.
 *       500:
 *         description: Internal Server Error or Paystack verification service failure.
 */
router.get("/verify/:reference", verifyPayment);

/**
 * @openapi
 * /api/payments/webhook:
 *   post:
 *     summary: Paystack Webhook Receiver
 *     description: Asynchronous entry point for Paystack event triggers. Validates cryptographic signatures to update transaction states securely.
 *     tags:
 *       - Webhooks
 *     parameters:
 *       - in: header
 *         name: x-paystack-signature
 *         required: true
 *         schema:
 *           type: string
 *         description: HMAC SHA512 signature generated by Paystack using your private secret key.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event:
 *                 type: string
 *                 example: "charge.success"
 *               data:
 *                 type: object
 *                 properties:
 *                   reference:
 *                     type: string
 *                     example: "TXN-8F3D2A1C"
 *                   status:
 *                     type: string
 *                     example: "success"
 *                   id:
 *                     type: integer
 *                     example: 412293021
 *     responses:
 *       200:
 *         description: Event acknowledged successfully.
 *       401:
 *         description: Missing or invalid signature header.
 */
router.post("/webhook", webhook);

export default router;
