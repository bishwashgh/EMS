import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    
    if (smtpHost) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: this.configService.get<number>('SMTP_PORT') || 587,
        secure: false,
        auth: {
          user: this.configService.get<string>('SMTP_USER'),
          pass: this.configService.get<string>('SMTP_PASS'),
        },
      });
    } else {
      this.logger.warn('SMTP not configured. Emails will be logged to console instead.');
    }
  }

  async sendOtpEmail(to: string, otp: string, name: string): Promise<void> {
    const mailOptions = {
      from: this.configService.get<string>('SMTP_FROM') || 'noreply@example.com',
      to,
      subject: 'Verify Your Email - OTP Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Email Verification</h2>
          <p>Hello ${name},</p>
          <p>Thank you for registering! Please use the following OTP to verify your email address:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; letter-spacing: 5px; margin: 0;">${otp}</h1>
          </div>
          <p>This OTP will expire in <strong>10 minutes</strong>.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
        </div>
      `,
    };

    if (this.transporter) {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`OTP email sent to ${to}`);
    } else {
      // Development mode: log OTP to console
      this.logger.warn(`[DEV MODE] OTP for ${to}: ${otp}`);
    }
  }

  async sendPasswordResetEmail(to: string, otp: string, name: string): Promise<void> {
    const mailOptions = {
      from: this.configService.get<string>('SMTP_FROM') || 'noreply@example.com',
      to,
      subject: 'Password Reset - OTP Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello ${name},</p>
          <p>We received a request to reset your password. Use the following OTP to reset your password:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #dc3545; letter-spacing: 5px; margin: 0;">${otp}</h1>
          </div>
          <p>This OTP will expire in <strong>10 minutes</strong>.</p>
          <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
        </div>
      `,
    };

    if (this.transporter) {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset email sent to ${to}`);
    } else {
      // Development mode: log OTP to console
      this.logger.warn(`[DEV MODE] Password Reset OTP for ${to}: ${otp}`);
    }
  }

  // Booking confirmation email to user
  async sendBookingConfirmationEmail(
    to: string,
    name: string,
    bookingDetails: {
      venueName: string;
      venueAddress: string;
      eventDate: string;
      startTime: string;
      endTime: string;
      eventType: string;
      guestCount: number;
      totalAmount: number;
      bookingId: string;
    },
  ): Promise<void> {
    const mailOptions = {
      from: this.configService.get<string>('SMTP_FROM') || 'noreply@example.com',
      to,
      subject: `Booking Confirmation - ${bookingDetails.venueName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">🎉 Booking Confirmed!</h2>
          <p>Hello ${name},</p>
          <p>Your booking has been successfully created. Here are the details:</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">${bookingDetails.venueName}</h3>
            <p style="margin: 5px 0;"><strong>📍 Address:</strong> ${bookingDetails.venueAddress}</p>
            <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${bookingDetails.eventDate}</p>
            <p style="margin: 5px 0;"><strong>⏰ Time:</strong> ${bookingDetails.startTime} - ${bookingDetails.endTime}</p>
            <p style="margin: 5px 0;"><strong>🎊 Event Type:</strong> ${bookingDetails.eventType}</p>
            <p style="margin: 5px 0;"><strong>👥 Guests:</strong> ${bookingDetails.guestCount}</p>
            <p style="margin: 5px 0;"><strong>💰 Total Amount:</strong> Rs. ${bookingDetails.totalAmount}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Booking ID:</strong> ${bookingDetails.bookingId}</p>
          </div>
          
          <p style="color: #666;">Please contact the venue for any special arrangements.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
        </div>
      `,
    };

    if (this.transporter) {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Booking confirmation email sent to ${to}`);
    } else {
      this.logger.warn(`[DEV MODE] Booking confirmation for ${to}: ${bookingDetails.bookingId}`);
    }
  }

  // Notify venue owner of new booking
  async sendNewBookingNotificationToOwner(
    to: string,
    ownerName: string,
    bookingDetails: {
      venueName: string;
      customerName: string;
      customerEmail: string;
      customerPhone: string;
      eventDate: string;
      startTime: string;
      endTime: string;
      eventType: string;
      guestCount: number;
      totalAmount: number;
      bookingId: string;
      specialRequests?: string;
    },
  ): Promise<void> {
    const mailOptions = {
      from: this.configService.get<string>('SMTP_FROM') || 'noreply@example.com',
      to,
      subject: `🔔 New Booking - ${bookingDetails.venueName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #007bff;">New Booking Received!</h2>
          <p>Hello ${ownerName},</p>
          <p>You have received a new booking for <strong>${bookingDetails.venueName}</strong>.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Booking Details</h3>
            <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${bookingDetails.eventDate}</p>
            <p style="margin: 5px 0;"><strong>⏰ Time:</strong> ${bookingDetails.startTime} - ${bookingDetails.endTime}</p>
            <p style="margin: 5px 0;"><strong>🎊 Event Type:</strong> ${bookingDetails.eventType}</p>
            <p style="margin: 5px 0;"><strong>👥 Guests:</strong> ${bookingDetails.guestCount}</p>
            <p style="margin: 5px 0;"><strong>💰 Total Amount:</strong> Rs. ${bookingDetails.totalAmount}</p>
            ${bookingDetails.specialRequests ? `<p style="margin: 5px 0;"><strong>📝 Special Requests:</strong> ${bookingDetails.specialRequests}</p>` : ''}
          </div>
          
          <div style="background-color: #e7f3ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #333;">Customer Information</h4>
            <p style="margin: 5px 0;"><strong>Name:</strong> ${bookingDetails.customerName}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${bookingDetails.customerEmail}</p>
            <p style="margin: 5px 0;"><strong>Phone:</strong> ${bookingDetails.customerPhone}</p>
          </div>
          
          <p>Please confirm or manage this booking from your dashboard.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">Booking ID: ${bookingDetails.bookingId}</p>
        </div>
      `,
    };

    if (this.transporter) {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`New booking notification sent to owner ${to}`);
    } else {
      this.logger.warn(`[DEV MODE] New booking notification for owner ${to}: ${bookingDetails.bookingId}`);
    }
  }

  // Booking status update email
  async sendBookingStatusUpdateEmail(
    to: string,
    name: string,
    status: string,
    bookingDetails: {
      venueName: string;
      eventDate: string;
      bookingId: string;
      cancellationReason?: string;
    },
  ): Promise<void> {
    const statusColors: Record<string, string> = {
      CONFIRMED: '#28a745',
      CANCELLED: '#dc3545',
      COMPLETED: '#17a2b8',
    };

    const statusEmoji: Record<string, string> = {
      CONFIRMED: '✅',
      CANCELLED: '❌',
      COMPLETED: '🎉',
    };

    const mailOptions = {
      from: this.configService.get<string>('SMTP_FROM') || 'noreply@example.com',
      to,
      subject: `Booking ${status} - ${bookingDetails.venueName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${statusColors[status] || '#333'};">${statusEmoji[status] || ''} Booking ${status}</h2>
          <p>Hello ${name},</p>
          <p>Your booking status has been updated to <strong>${status}</strong>.</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Venue:</strong> ${bookingDetails.venueName}</p>
            <p style="margin: 5px 0;"><strong>Event Date:</strong> ${bookingDetails.eventDate}</p>
            <p style="margin: 5px 0;"><strong>Booking ID:</strong> ${bookingDetails.bookingId}</p>
            ${bookingDetails.cancellationReason ? `<p style="margin: 5px 0; color: #dc3545;"><strong>Reason:</strong> ${bookingDetails.cancellationReason}</p>` : ''}
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
        </div>
      `,
    };

    if (this.transporter) {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Booking status update email sent to ${to}`);
    } else {
      this.logger.warn(`[DEV MODE] Booking status update for ${to}: ${status}`);
    }
  }
}
