import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Notification,
  NotificationDocument,
  NotificationType,
} from './schemas/notification.schema';
import { NotificationGateway } from './notification.gateway';

export interface CreateNotificationDto {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  refId?: string;
  refModel?: 'Booking' | 'Venue' | 'Payment' | 'Review';
  metadata?: Record<string, any>;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    private notificationGateway: NotificationGateway,
  ) {}

  // Create and send notification
  async create(dto: CreateNotificationDto): Promise<NotificationDocument> {
    const notification = await this.notificationModel.create(dto);

    // Send real-time notification via WebSocket
    this.notificationGateway.sendToUser(dto.userId, {
      id: notification._id,
      title: dto.title,
      message: dto.message,
      type: dto.type,
      metadata: dto.metadata,
      createdAt: (notification as any).createdAt,
    });

    this.logger.log(`Notification sent to user ${dto.userId}: ${dto.title}`);
    return notification;
  }

  // Get user notifications with pagination
  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false,
  ) {
    const query: any = { userId };
    if (unreadOnly) {
      query.isRead = false;
    }

    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      this.notificationModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.notificationModel.countDocuments(query),
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Get unread count
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel.countDocuments({ userId, isRead: false });
  }

  // Mark single notification as read
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.notificationModel.updateOne(
      { _id: notificationId, userId },
      { isRead: true },
    );
  }

  // Mark all notifications as read
  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationModel.updateMany(
      { userId, isRead: false },
      { isRead: true },
    );
  }

  // Delete notification
  async delete(notificationId: string, userId: string): Promise<void> {
    await this.notificationModel.deleteOne({ _id: notificationId, userId });
  }

  // Delete all read notifications (cleanup)
  async deleteReadNotifications(userId: string): Promise<number> {
    const result = await this.notificationModel.deleteMany({
      userId,
      isRead: true,
    });
    return result.deletedCount;
  }

  // ============ Helper methods for common notifications ============

  // Booking created notification (to owner)
  async notifyBookingCreated(
    ownerId: string,
    bookingId: string,
    customerName: string,
    venueName: string,
    eventDate: string,
  ) {
    return this.create({
      userId: ownerId,
      title: '🎉 New Booking Received!',
      message: `${customerName} has booked ${venueName} for ${eventDate}`,
      type: NotificationType.BOOKING_CREATED,
      refId: bookingId,
      refModel: 'Booking',
      metadata: { customerName, venueName, eventDate },
    });
  }

  // Booking confirmed notification (to customer)
  async notifyBookingConfirmed(
    customerId: string,
    bookingId: string,
    venueName: string,
    eventDate: string,
  ) {
    return this.create({
      userId: customerId,
      title: '✅ Booking Confirmed!',
      message: `Your booking at ${venueName} for ${eventDate} has been confirmed`,
      type: NotificationType.BOOKING_CONFIRMED,
      refId: bookingId,
      refModel: 'Booking',
      metadata: { venueName, eventDate },
    });
  }

  // Booking cancelled notification
  async notifyBookingCancelled(
    userId: string,
    bookingId: string,
    venueName: string,
    eventDate: string,
    reason?: string,
  ) {
    return this.create({
      userId,
      title: '❌ Booking Cancelled',
      message: `Booking at ${venueName} for ${eventDate} has been cancelled${reason ? `: ${reason}` : ''}`,
      type: NotificationType.BOOKING_CANCELLED,
      refId: bookingId,
      refModel: 'Booking',
      metadata: { venueName, eventDate, reason },
    });
  }

  // Payment received notification (to owner)
  async notifyPaymentReceived(
    ownerId: string,
    paymentId: string,
    amount: number,
    venueName: string,
    customerName: string,
  ) {
    return this.create({
      userId: ownerId,
      title: '💰 Payment Received!',
      message: `Rs. ${amount} received from ${customerName} for ${venueName}`,
      type: NotificationType.PAYMENT_RECEIVED,
      refId: paymentId,
      refModel: 'Payment',
      metadata: { amount, venueName, customerName },
    });
  }

  // Review received notification (to owner)
  async notifyReviewReceived(
    ownerId: string,
    reviewId: string,
    venueName: string,
    rating: number,
    customerName: string,
  ) {
    return this.create({
      userId: ownerId,
      title: `⭐ New ${rating}-Star Review!`,
      message: `${customerName} left a ${rating}-star review on ${venueName}`,
      type: NotificationType.REVIEW_RECEIVED,
      refId: reviewId,
      refModel: 'Review',
      metadata: { venueName, rating, customerName },
    });
  }

  // Venue verified notification (to owner)
  async notifyVenueVerified(ownerId: string, venueId: string, venueName: string) {
    return this.create({
      userId: ownerId,
      title: '🎊 Venue Verified!',
      message: `Congratulations! ${venueName} has been verified and is now live`,
      type: NotificationType.VENUE_VERIFIED,
      refId: venueId,
      refModel: 'Venue',
      metadata: { venueName },
    });
  }

  // Venue rejected notification (to owner)
  async notifyVenueRejected(
    ownerId: string,
    venueId: string,
    venueName: string,
    reason: string,
  ) {
    return this.create({
      userId: ownerId,
      title: '⚠️ Venue Verification Failed',
      message: `${venueName} verification was rejected: ${reason}`,
      type: NotificationType.VENUE_REJECTED,
      refId: venueId,
      refModel: 'Venue',
      metadata: { venueName, reason },
    });
  }
}
