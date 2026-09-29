const express = require("express");

const {
  registerUser,
  loginUser
} = require("../controllers/authController");

const {
  registerValidation,
  loginValidation
} = require("../validators/authValidator");

const validate = require("../middleware/validationMiddleware");

const router = express.Router();

router.post(
  "/register",
  registerValidation,
  validate,
  registerUser
);

router.post(
  "/login",
  loginValidation,
  validate,
  loginUser
);

module.exports = router;