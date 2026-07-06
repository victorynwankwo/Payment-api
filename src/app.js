import express from "express";
import cors from "cors";
import paymentRoutes from "./Routes/paymentRoute.js";
import corsOptions from "./Config/corsOption.js";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
const app = express();

// 1. Enable cross-origin resource sharing for frontend apps
app.use(cors(corsOptions));

const swaggerOptions = {
  definition: {
    openapi: "3.0.0", // Universal OpenAPI version standard
    info: {
      title: "Paystack Payment API Backend",
      version: "1.0.0",
      description:
        "A beginner-friendly guide to our payment integration endpoints",
    },
    servers: [
      {
        url: "http://localhost:5000", // The exact local port your server runs on
      },
    ],
  },
  // 2. Tell Swagger WHERE to look for documentation comments
  apis: ["./src/Routes/*.js"],
};

// 2. Parse incoming JSON requests, reserving a raw string buffer for webhook validation
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  }),
);

const swaggerDocs = swaggerJsdoc(swaggerOptions);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// 3. Mount payment endpoints
app.use("/api/payments", paymentRoutes);

// 4. Basic fallback health-check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", timestamp: new Date() });
});

export default app;
