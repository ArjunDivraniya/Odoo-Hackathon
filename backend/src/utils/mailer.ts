import nodemailer from "nodemailer";

export class Mailer {
  private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true", // false for TLS/STARTTLS (587), true for SSL (465)
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  /**
   * Dispatches a password reset link to the user email using SMTP
   */
  public static async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const appUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password?token=${token}`;
    const mailOptions = {
      from: `"AssetFlow Support" <${process.env.EMAIL_USER}>`,
      to,
      subject: "AssetFlow Password Reset Request",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
          <h2 style="color: #1e293b; text-align: center; margin-bottom: 20px;">AssetFlow Reset Password</h2>
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">Hello,</p>
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">We received a request to reset the password for your AssetFlow Enterprise account. Click the button below to secure your account:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #3b82f6; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.1), 0 2px 4px -1px rgba(59, 130, 246, 0.06);">
              Reset Password
            </a>
          </div>
          
          <p style="color: #475569; font-size: 14px; line-height: 1.6;">If you have trouble with the button above, copy and paste this link into your web browser:</p>
          <p style="word-break: break-all; color: #2563eb; font-size: 14px; background-color: #f8fafc; padding: 10px; border-radius: 4px; border: 1px solid #e2e8f0;">
            ${resetUrl}
          </p>
          
          <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin-top: 20px;">
            Note: This link will automatically expire in 2 hours for security reasons. If you did not make this request, you can safely ignore this email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">
            AssetFlow Enterprise Asset & Resource Management System &bull; Confidential
          </p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  /**
   * Sends an email verification link to the user email using SMTP
   */
  public static async sendEmailVerificationEmail(to: string, token: string): Promise<void> {
    const appUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const verifyUrl = `${appUrl}/auth/verify-email?token=${token}`;
    const mailOptions = {
      from: `"AssetFlow Support" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Verify your AssetFlow account",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
          <h2 style="color: #1e293b; text-align: center; margin-bottom: 20px;">Verify Your AssetFlow Email</h2>
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">Hello,</p>
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">Your account has been created. Click the button below to verify your email address and activate your account:</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" style="background-color: #3b82f6; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.1), 0 2px 4px -1px rgba(59, 130, 246, 0.06);">
              Verify Email
            </a>
          </div>

          <p style="color: #475569; font-size: 14px; line-height: 1.6;">If the button does not work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #2563eb; font-size: 14px; background-color: #f8fafc; padding: 10px; border-radius: 4px; border: 1px solid #e2e8f0;">
            ${verifyUrl}
          </p>

          <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin-top: 20px;">
            This link will expire in 24 hours for security reasons.
          </p>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">
            AssetFlow Enterprise Asset & Resource Management System &bull; Confidential
          </p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }
}
