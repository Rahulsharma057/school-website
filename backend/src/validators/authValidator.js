const { body } = require("express-validator");

const loginValidator = [
  body("email").isEmail().withMessage("Valid email required"),

  body("password").notEmpty().withMessage("Password required"),
];

module.exports = {
  loginValidator,
};
