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
      },
    );
    console.log(paystackResponse.data);

    // Axios unpacks HTTP JSON responses directly inside the 'data' property
    const paystackData = paystackResponse.data;

    // 5. Handle Paystack API initialization failures
    if (!paystackData.status) {
      return res
        .status(400)
        .json({ success: false, error: paystackData.message });
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
      message:
        "Payment initialized successfully. Redirect the user to the authorization URL.",
    });
  } catch (error) {
    // Gracefully catch and display Paystack's exact API error if it fails
    const errorMessage = error.response?.data?.message || error.message;
    return res.status(500).json({ error: errorMessage });
  }
};

export const getPaymentStatus = async (req, res) => {
  try {
    const { reference } = req.params;
   

    // Look up the document matching the custom reference string
    const payment = await Payment.findOne({ reference });

    // If the reference doesn't exist in your database
    if (!payment) {
      return res
        .status(404)
        .json({ success: false, message: "Transaction record not found" });
    }

    // Return just the status string so the React frontend can read it easily
    return res.status(200).json({
      success: true,
      status: payment.status, // Will return "initialized", "completed", or "failed"
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
export const webhook = async (req, res) => {
  try {
    // A. Grab the security signature header sent automatically by Paystack
    const paystackSignature = req.headers["x-paystack-signature"];
    const secret = process.env.PAYSTACK_API_KEY; 

    if (!paystackSignature) {
      return res.status(401).send("Missing signature header");
    }

    // B. THIS IS THE VERIFICATION LOGIC: 
    // We cryptographically generate a local hash of the body using our secret key
    const hash = crypto
      .createHmac("sha512", secret)
      .update(req.rawBody) // req.rawBody is generated automatically by app.js configuration
      .digest("hex");

    // C. Compare the local hash with Paystack's signature to prove it's really Paystack
    // if (hash !== paystackSignature) {
    //   return res.status(401).send("Invalid event signature source");
    // }

    // D. Tell Paystack's server "200 OK, message received successfully"
    res.sendStatus(200);

    // E. Extract the payment metrics
    const { event, data } = req.body;
    console.log(`: Received event notification -> ${event}`);

    // F. If payment is successful, find it in MongoDB and change status to "completed"
    if (event === "charge.success") {
      const updatedPayment = await Payment.findOneAndUpdate(
        { reference: data.reference }, 
        {
          status: "completed",          
          providerReference: data.id.toString(),
          providerResponse: data,       
          webhookInitialized: true,
          verifiedAt: new Date(),
        },
        { new: true }
      );

      if (updatedPayment) {
        console.log(`${data.reference} successfully marked as completed.`);
        // Write any backend database fulfillment logic here (e.g., fund wallet, unlock dashboard access)
      } else {
        console.warn(`: Reference ${data.reference} was paid but doesn't exist in MongoDB.`);
      }
    }

    // G. If payment fails, mark it as "failed" in MongoDB
    if (event === "charge.failed") {
      await Payment.findOneAndUpdate(
        { reference: data.reference },
        {
          status: "failed",
          providerResponse: data,
          webhookInitialized: true,
        }
      );
      console.log(`: Reference ${data.reference} marked as failed.`);
    }

  } catch (error) {
    console.error( error.message);
  }
};




export const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params; 

    // 1. Check if the payment exists in your MongoDB first
    let payment = await Payment.findOne({ reference });
    if (!payment) {
      return res.status(404).json({ success: false, message: "Transaction record not found" });
    }

    // 2. If already marked completed by webhook, return success instantly
    if (payment.status === "completed") {
      return res.status(200).json({ success: true, status: "completed", message: "Payment already verified." });
    }

    // 3. Hit Paystack's official verification API endpoint
    const paystackResponse = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_API_KEY}`,
        },
      }
    );

    const paystackData = paystackResponse.data;

    // 4. Check if the transaction was successful on Paystack's network
    if (paystackData.status && paystackData.data.status === "success") {
      
      // 5. Update MongoDB state immediately so frontend gets the updated status
      payment = await Payment.findOneAndUpdate(
        { reference },
        { 
          status: "completed",
          providerReference: paystackData.data.id.toString(),
          providerResponse: paystackData.data,
          verifiedAt: new Date(),
        },
        { new: true }
      );

      // Perform value fulfillment here (e.g., fund wallet, activate premium feature)
      console.log(`Reference ${reference} verified directly via API.`);

      return res.status(200).json({
        success: true,
        status: "completed",
        message: "Payment verified successfully via Paystack API.",
      });
    }

    // 6. Handle cases where payment failed or is still pending on Paystack
    return res.status(200).json({
      success: true,
      status: payment.status, 
      message: `Payment status on gateway: ${paystackData.data.status}`,
    });

  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    return res.status(500).json({ success: false, error: errorMessage });
  }
};
