import dotenv from "dotenv";
import app from "./src/app.js";
import connectDB from "./src/Config/db.js";

// Load local environment profile files
dotenv.config();

const startServer = async () => {
  try {
    // 1. Connect database first before launching port listener
    await connectDB();

    const PORT = process.env.PORT || 5000;
    
    app.listen(PORT, () => {
      console.log(` Server running on port : ${PORT}`);
    });
  } catch (error) {
    console.error(" RUNTIME ERROR: Server startup aborting:", error.message);
    process.exit(1);
  }
};

startServer();
