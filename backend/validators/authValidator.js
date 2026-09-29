const { body } = require("express-validator");

const registerValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required"),

  body("email")
    .trim()
    .isEmail()
    .withMessage("Enter a valid email"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must contain at least 6 characters"),

  body("role")
    .optional()
    .isIn(["customer", "provider"])
    .withMessage("Role must be customer or provider")
];

const loginValidation = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Enter a valid email"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
];

module.exports = {
  registerValidation,
  loginValidation
};