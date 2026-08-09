const express = require("express");
const cors = require("cors");

const helmet = require("helmet");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

const notFound = require("./middlewares/notFound");
const errorHandler = require("./middlewares/errorHandler");

const apiRoutes = require("./routes");

const app = express();

app.use(helmet());

app.use(compression());

// =========================
// CORS
// =========================

const allowedOrigins = [process.env.FRONTEND_URL].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Postman / server-to-server requests
      if (!origin) {
        return callback(null, true);
      }

      // Exact production frontend URL
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow Vercel preview/deployment URLs
      if (origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },

    credentials: true,
  }),
);

// =========================
// BODY PARSER
// =========================

app.use(
  express.json({
    limit: "10mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  }),
);

// =========================
// COOKIE
// =========================

app.use(cookieParser());

// =========================
// LOGGER
// =========================

app.use(morgan("dev"));

// =========================
// HEALTH CHECK
// =========================

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "School API Running",
  });
});

// =========================
// ALL API ROUTES
// =========================

app.use("/api/v1", apiRoutes);

// =========================
// 404
// =========================

app.use(notFound);

// =========================
// ERROR
// =========================

app.use(errorHandler);

module.exports = app;
