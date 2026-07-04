import Payment from "../Model/Payment.js";
import crypto from "crypto";
import axios from "axios";

export const initializePayment = async (req, res) => {
  try {
    const { email, amount, userId, metadata, callbackUrl } = req.body;

    // 1. Validate required fields
    if (!email || !amount) {
      return res.status(400).json({ error: "Email and amount are required" });
    }

    // 2. Generate a unique tracking reference for your database
    const trackingReference = `TXN-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;

    // 3. Paystack accepts amounts in Kobo (multiply standard amount by 100)
    const amountInKobo = amount * 100;

    // 4. Send request to Paystack API using clean Axios syntax
    const paystackResponse = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: amountInKobo,
        reference: trackingReference,
        callback_url: callbackUrl,
        metadata: { ...metadata, userId },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
   
    // Axios unpacks HTTP JSON responses directly inside the 'data' property
    const paystackData = paystackResponse.data;

    // 5. Handle Paystack API initialization failures
    if (!paystackData.status) {
      return res.status(400).json({ success: false, error: paystackData.message });
    }

    // 6. Save the initialized payment record to your MongoDB using your schema
    await Payment.create({
        email: email,
      reference: trackingReference,
      amount: amount,
      user: userId || null, 
      status: "initialized",
      metadata: metadata || {},
      callbackUrl: callbackUrl,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), 
    });

    // 7. Send the authorization URL and reference back to the client frontend
    return res.status(200).json({
      success: true,
      authorizationUrl: paystackData.data.authorization_url,
      reference: trackingReference,
      message: "Payment initialized successfully. Redirect the user to the authorization URL.",
    });

  } catch (error) {
    // Gracefully catch and display Paystack's exact API error if it fails
    const errorMessage = error.response?.data?.message || error.message;
    return res.status(500).json({ error: errorMessage });
  }
};
