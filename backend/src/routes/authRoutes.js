const express = require("express");

const router = express.Router();


const {
  createSuperAdmin,
  registerUser,
  loginUser,
  logoutUser,
} = require("../controllers/authController");



// PUBLIC REGISTER

router.post(
  "/register",
  registerUser
);



// FIRST SUPER ADMIN CREATE

router.post(
  "/create-super-admin",
  createSuperAdmin
);



// COMMON LOGIN

router.post(
  "/login",
  loginUser
);



// LOGOUT

router.post(
  "/logout",
  logoutUser
);



module.exports = router;