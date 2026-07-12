import { Response, NextFunction } from "express";
import { BookingService } from "../service/booking.service";
import { AuthenticatedRequest } from "../../../types";

export class BookingController {
  private service = new BookingService();

  public create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const result = await this.service.createBooking(req.body, currentUserId, companyId);
      res.status(201).json({
        success: true,
        message: "Booking created successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const result = await this.service.getBookings(companyId, req.query);
      res.status(200).json({
        success: true,
        message: "Bookings fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const result = await this.service.getBookingById(id);
      res.status(200).json({
        success: true,
        message: "Booking fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const { BookingRepository } = await import("../repository/booking.repository");
      const repository = new BookingRepository();
      const existing = await repository.findById(id);
      if (!existing) {
        return next(new (await import("../../../errors/app-error")).NotFoundError("Booking not found"));
      }
      const updated = await repository.update(id, req.body, currentUserId);
      res.status(200).json({
        success: true,
        message: "Booking updated successfully",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  public confirm = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const result = await this.service.confirmBooking(id, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Booking confirmed successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public cancel = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const { cancellationReason } = req.body;
      const result = await this.service.cancelBooking(id, cancellationReason, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Booking cancelled successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public complete = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const result = await this.service.completeBooking(id, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Booking completed successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  public checkIn = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const currentUserId = req.user!.id;
      const companyId = req.user!.companyId;
      const result = await this.service.checkInBooking(id, currentUserId, companyId);
      res.status(200).json({
        success: true,
        message: "Booking checked in successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
