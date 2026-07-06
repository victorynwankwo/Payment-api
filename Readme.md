# Payment Backend API

A Node.js and Express-based backend for handling Paystack payment flows. The service supports payment initialization, status lookup, verification, webhook handling, and API documentation through Swagger.

## Overview

This project is designed to help you build a simple payment backend for a web or mobile application. It connects to MongoDB to store transaction records and integrates with Paystack for live payment initialization and verification.

## Features

- Initialize payments with Paystack
- Store payment records in MongoDB
- Retrieve payment status by transaction reference
- Verify payment status against Paystack
- Receive and process payment webhooks
- Expose API documentation with Swagger UI
- Health check endpoint for quick service verification

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- Paystack API via Axios
- Swagger JSdoc + Swagger UI Express
- dotenv for environment configuration

## Project Structure

- server.js — application entry point
- src/app.js — Express app setup and middleware
- src/Routes/paymentRoute.js — API routes
- src/controller/PaymentController.js — payment logic
- src/Model/Payment.js — payment schema
- src/Config/ — database and CORS configuration

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

## Run the Application

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

## API Endpoints

### Payments

- POST /api/payments/initialize — initialize a payment with Paystack
- GET /api/payments/status/:reference — get the local stored status for a transaction
- GET /api/payments/verify/:reference — verify a payment with Paystack
- POST /api/payments/webhook — receive webhook events from Paystack

### Health Check

- GET /health — returns a simple service status response

### Swagger Docs

- GET /api-docs — interactive Swagger documentation UI
- Example: http://localhost:5000/api-docs

## Notes

- The app uses ES modules, so import paths should include the .js extension.
- Make sure your MongoDB server is running before starting the app.
- For webhook validation, the app expects the raw request body and signature header from Paystack.
