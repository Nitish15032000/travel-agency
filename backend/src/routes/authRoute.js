import express from "express";
import { register } from "../controllers/authController.js";
import { validateUser } from "../middlewares/validator.js";
// import { register, login, logout } from "../controllers/authController";

const router = express.Router();

router.post('/register', validateUser, register)


export default router;