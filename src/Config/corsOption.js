import allowedOrigins from './allowedOrigins.js'; // Note the explicit .js extension

const corsOptions = {
  origin: (origin, callback) => {
    // 1. Checks if the incoming origin is inside the whitelist array
    // 2. The "!origin" exception allows local testing tools like Postman to pass through
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS security policy!'));
    }
  },
  optionsSuccessStatus: 200,
  credentials: true // Crucial if you pass session cookies or authorization headers
};

export default corsOptions;
