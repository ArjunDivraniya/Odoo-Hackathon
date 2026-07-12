import { Response, NextFunction } from "express";
import { AuthService } from "../service/auth.service";
import { AuthenticatedRequest } from "../../../types";

export class AuthController {
  private service = new AuthService();

  public signup = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.service.signup(req.body);
      res.status(201).json({
        success: true,
        message: "User registered successfully. Please verify your email.",
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  public login = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ip = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers["user-agent"] || "";
      const result = await this.service.login(req.body, ip, userAgent);
      res.status(200).json({
        success: true,
        message: "Login successful",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public logout = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const sessionId = req.user!.sessionId;
      await this.service.logout(userId, sessionId);
      res.status(200).json({
        success: true,
        message: "Logout successful",
      });
    } catch (error) {
      next(error);
    }
  };

  public refresh = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      const ip = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers["user-agent"] || "";
      const result = await this.service.refresh(refreshToken, ip, userAgent);
      res.status(200).json({
        success: true,
        message: "Tokens refreshed successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public forgotPassword = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ip = req.ip || req.socket.remoteAddress;
      await this.service.forgotPassword(req.body.email, ip);
      res.status(200).json({
        success: true,
        message: "If the email exists, a password reset link has been sent.",
      });
    } catch (error) {
      next(error);
    }
  };

  public resetPassword = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.resetPassword(req.body);
      res.status(200).json({
        success: true,
        message: "Password reset successful.",
      });
    } catch (error) {
      next(error);
    }
  };

  public verifyEmail = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.query.token as string || req.body.token;
      await this.service.verifyEmail(token);
      res.status(200).json({
        success: true,
        message: "Email verified successfully.",
      });
    } catch (error) {
      next(error);
    }
  };

  public sendOtp = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.sendOtp(req.body.email, req.body.type);
      res.status(200).json({
        success: true,
        message: "OTP sent successfully.",
      });
    } catch (error) {
      next(error);
    }
  };

  public verifyOtp = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.verifyOtp(req.body.email, req.body.code, req.body.type);
      res.status(200).json({
        success: true,
        message: "OTP verified successfully.",
      });
    } catch (error) {
      next(error);
    }
  };

  public me = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(200).json({
        success: true,
        message: "Current user profile fetched successfully",
        data: { user: req.user },
      });
    } catch (error) {
      next(error);
    }
  };

  public changePassword = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      await this.service.changePassword(userId, req.body);
      res.status(200).json({
        success: true,
        message: "Password updated successfully.",
      });
    } catch (error) {
      next(error);
    }
  };

  public updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const result = await this.service.updateProfile(userId, req.body);
      res.status(200).json({
        success: true,
        message: "Profile updated successfully.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public uploadAvatar = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const file = req.file as Express.Multer.File;
      const avatarUrl = file ? file.path : req.body.avatarUrl;
      if (!avatarUrl) {
        res.status(400).json({ success: false, message: "Please provide an image file or avatar URL." });
        return;
      }
      const result = await this.service.uploadAvatar(userId, avatarUrl);
      res.status(200).json({
        success: true,
        message: "Avatar uploaded successfully.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public getSessions = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const result = await this.service.getSessions(userId);
      res.status(200).json({
        success: true,
        message: "Active sessions retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public revokeSession = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const id = req.params.id as string;
      await this.service.revokeSession(userId, id);
      res.status(200).json({
        success: true,
        message: "Session revoked successfully.",
      });
    } catch (error) {
      next(error);
    }
  };

  public getLoginHistory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const result = await this.service.getLoginHistory(userId, page, limit);
      res.status(200).json({
        success: true,
        message: "Login history retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public getDeviceHistory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const result = await this.service.getDeviceHistory(userId);
      res.status(200).json({
        success: true,
        message: "Device history retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
