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

// CORS

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);

// BODY PARSER

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

// COOKIE

app.use(cookieParser());

// LOGGER

app.use(morgan("dev"));

// HEALTH CHECK

app.get(
  "/api/health",

  (req, res) => {
    res.json({
      success: true,

      message: "School API Running",
    });
  },
);

// ALL API ROUTES

app.use("/api/v1", apiRoutes);

// 404

app.use(notFound);

// ERROR

app.use(errorHandler);

module.exports = app;
