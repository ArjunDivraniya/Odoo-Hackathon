import { Router } from "express";
import { AuthController } from "../controller/auth.controller";
import { authenticate } from "../../../middleware/auth.middleware";
import { validate } from "../../../middleware/validation.middleware";
import { uploadAvatar } from "../../../middleware/upload.middleware";
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  sendOtpSchema,
  verifyOtpSchema,
  changePasswordSchema,
  updateProfileSchema,
} from "../validator/auth.validator";

const router = Router();
const controller = new AuthController();

// Public Auth Routes
router.post("/signup", validate(signupSchema), controller.signup);
router.post("/login", validate(loginSchema), controller.login);
router.post("/refresh", controller.refresh); // refresh is validated in service
router.post("/forgot-password", validate(forgotPasswordSchema), controller.forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), controller.resetPassword);
router.get("/verify-email", controller.verifyEmail);
router.post("/verify-email", controller.verifyEmail);
router.post("/send-otp", validate(sendOtpSchema), controller.sendOtp);
router.post("/verify-otp", validate(verifyOtpSchema), controller.verifyOtp);

// Authenticated Auth Routes
router.use(authenticate as any);

router.post("/logout", controller.logout);
router.get("/me", controller.me);
router.post("/change-password", validate(changePasswordSchema), controller.changePassword);
router.patch("/profile", validate(updateProfileSchema), controller.updateProfile);
router.post("/avatar", uploadAvatar.single("avatar"), controller.uploadAvatar);
router.get("/sessions", controller.getSessions);
router.delete("/sessions/:id", controller.revokeSession);
router.get("/login-history", controller.getLoginHistory);
router.get("/device-history", controller.getDeviceHistory);

export default router;
