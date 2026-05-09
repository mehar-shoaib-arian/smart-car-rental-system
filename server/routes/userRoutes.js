import express from "express";
import {
  getCars,
  getUserData,
  loginUser,
  requestPasswordResetOtp,
  registerUser,
  resetPasswordWithOtp,
} from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/forgot-password", requestPasswordResetOtp);
userRouter.post("/reset-password", resetPasswordWithOtp);
userRouter.get("/data", protect, getUserData);
userRouter.get("/cars", getCars);

export default userRouter;
