import allowedOrigins from "./allowedOrigins.js";

const isAllowedOrigin = (origin) => {
  if (!origin) return true;

  if (allowedOrigins.includes(origin)) return true;

  return /^(https?:\/\/)(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Blocked by CORS security policy!"));
    }
  },
  optionsSuccessStatus: 200,
  credentials: true,
};

export default corsOptions;
