import express from "express";
import cors from "cors";
import paymentRoutes from "./Routes/paymentRoute.js";

const app = express();

// 1. Enable cross-origin resource sharing for frontend apps
app.use(cors());

// 2. Parse incoming JSON requests, reserving a raw string buffer for webhook validation
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);

// 3. Mount payment endpoints
app.use("/api/v1/payments", paymentRoutes);


// 4. Basic fallback health-check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", timestamp: new Date() });
});

export default app;
