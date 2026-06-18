import express from "express";
import { validateUser } from "../middlewares/validator.js";
import { register, login, logout, verifyOtp } from "../controllers/authController.js";

const router = express.Router();

router.post('/register', validateUser, register)
router.post('/verify-otp', verifyOtp)
router.post('/login', login)
router.post('/logout', logout)


export default router;