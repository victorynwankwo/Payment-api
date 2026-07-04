import mongoose from "mongoose";

const { Schema } = mongoose;

const paymentSchema = new Schema(
  {
    // Payment Details
    reference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
    },
      
    email:{
      type: String,
      required: true,
    },

    currency: {
      type: String,
      default: "NGN",
    },

    status: {
      type: String,
      enum: [
        "initialized",
        "pending",
        "completed",
        "failed",
        "verified",
      ],
      default: "initialized",
    },

    // User
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    // Payment Provider
    provider: {
      type: String,
      default: "paystack",
    },

    providerReference: {
      type: String,
    },

    providerResponse: {
      type: Schema.Types.Mixed,
    },

    // Additional Data
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },

    callbackUrl: {
      type: String,
    },

    // Verification
    webhookInitialized: {
      type: Boolean,
      default: false,
    },

    verificationAttempts: {
      type: Number,
      default: 0,
    },

    verifiedAt: {
      type: Date,
    },

    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;