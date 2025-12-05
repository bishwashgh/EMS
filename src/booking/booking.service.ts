import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Booking, BookingDocument, BookingStatus, PaymentStatus } from './schemas/booking.schema';
import { CreateBookingDto } from './dto/createBooking.dto';
import { UpdateBookingStatusDto } from './dto/updateBookingStatus.dto';
import { QueryBookingDto } from './dto/queryBooking.dto';
import { RescheduleBookingDto } from './dto/rescheduleBooking.dto';
import { VenueService } from '../venue/venue.service';
import { VenueDocument } from '../venue/schemas/venue.schema';
import { EmailService } from '../common/email.service';
import { UserService } from '../user/user.service';

@Injectable()
export class BookingService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    private venueService: VenueService,
    private emailService: EmailService,
    private userService: UserService,
  ) {}

  async create(createBookingDto: CreateBookingDto, userId: string): Promise<BookingDocument> {
    const venue = await this.venueService.findById(createBookingDto.venueId);

    // Check if venue is active
    if (!venue.isActive) {
      throw new BadRequestException('This venue is not available for booking');
    }

    // Check guest count against capacity
    if (createBookingDto.guestCount < venue.minCapacity || createBookingDto.guestCount > venue.maxCapacity) {
      throw new BadRequestException(
        `Guest count must be between ${venue.minCapacity} and ${venue.maxCapacity}`,
      );
    }

    // Check availability for the date
    const isAvailable = await this.checkAvailability(
      createBookingDto.venueId,
      new Date(createBookingDto.eventDate),
      createBookingDto.startTime,
      createBookingDto.endTime,
    );

    if (!isAvailable) {
      throw new BadRequestException('Venue is not available for the selected date and time');
    }

    // Calculate total amount (hours * pricePerHour)
    const startHour = parseInt(createBookingDto.startTime.split(':')[0]);
    const endHour = parseInt(createBookingDto.endTime.split(':')[0]);
    const hours = endHour - startHour;
    const totalAmount = hours * venue.pricePerHour;

    const booking = new this.bookingModel({
      ...createBookingDto,
      userId: new Types.ObjectId(userId),
      venueId: new Types.ObjectId(createBookingDto.venueId),
      eventDate: new Date(createBookingDto.eventDate),
      totalAmount,
      balanceAmount: totalAmount,
    });

    const savedBooking = await booking.save();

    // Send email notifications
    try {
      // Get user details
      const user = await this.userService.findById(userId);
      const owner = await this.userService.findById(venue.ownerId.toString());

      // Send confirmation to customer
      if (user) {
        await this.emailService.sendBookingConfirmationEmail(
          createBookingDto.contactEmail,
          createBookingDto.contactName,
          {
            venueName: venue.name,
            venueAddress: `${venue.address}, ${venue.city}`,
            eventDate: new Date(createBookingDto.eventDate).toLocaleDateString(),
            startTime: createBookingDto.startTime,
            endTime: createBookingDto.endTime,
            eventType: createBookingDto.eventType,
            guestCount: createBookingDto.guestCount,
            totalAmount,
            bookingId: savedBooking._id.toString(),
          },
        );
      }

      // Notify venue owner
      if (owner) {
        await this.emailService.sendNewBookingNotificationToOwner(
          owner.email,
          owner.name,
          {
            venueName: venue.name,
            customerName: createBookingDto.contactName,
            customerEmail: createBookingDto.contactEmail,
            customerPhone: createBookingDto.contactPhone,
            eventDate: new Date(createBookingDto.eventDate).toLocaleDateString(),
            startTime: createBookingDto.startTime,
            endTime: createBookingDto.endTime,
            eventType: createBookingDto.eventType,
            guestCount: createBookingDto.guestCount,
            totalAmount,
            bookingId: savedBooking._id.toString(),
            specialRequests: createBookingDto.specialRequests,
          },
        );
      }
    } catch (error) {
      // Log error but don't fail the booking
      console.error('Failed to send booking emails:', error);
    }

    return savedBooking;
  }

  async checkAvailability(
    venueId: string,
    date: Date,
    startTime: string,
    endTime: string,
  ): Promise<boolean> {
    const venue = await this.venueService.findById(venueId);

    // Check if date is blocked
    const dateStr = date.toISOString().split('T')[0];
    const isBlocked = venue.blockedDates.some(
      (d) => new Date(d).toISOString().split('T')[0] === dateStr,
    );

    if (isBlocked) {
      return false;
    }

    // Check for existing bookings on the same date with overlapping time
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingBookings = await this.bookingModel.find({
      venueId: new Types.ObjectId(venueId),
      eventDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
    });

    // Check for time overlap
    for (const booking of existingBookings) {
      const existingStart = parseInt(booking.startTime.split(':')[0]) * 60 + parseInt(booking.startTime.split(':')[1]);
      const existingEnd = parseInt(booking.endTime.split(':')[0]) * 60 + parseInt(booking.endTime.split(':')[1]);
      const newStart = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
      const newEnd = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]);

      // Check overlap
      if (newStart < existingEnd && newEnd > existingStart) {
        return false;
      }
    }

    return true;
  }

  async findUserBookings(userId: string, queryDto: QueryBookingDto) {
    const { status, paymentStatus, startDate, endDate, page = 1, limit = 10 } = queryDto;

    const filter: any = { userId: new Types.ObjectId(userId) };

    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (startDate || endDate) {
      filter.eventDate = {};
      if (startDate) filter.eventDate.$gte = new Date(startDate);
      if (endDate) filter.eventDate.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      this.bookingModel
        .find(filter)
        .populate('venueId', 'name address city images')
        .skip(skip)
        .limit(limit)
        .sort({ eventDate: -1 }),
      this.bookingModel.countDocuments(filter),
    ]);

    return {
      data: bookings,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findVenueBookings(venueId: string, ownerId: string, queryDto: QueryBookingDto) {
    // Verify venue ownership
    const venue = await this.venueService.findById(venueId);
    if (venue.ownerId.toString() !== ownerId) {
      throw new ForbiddenException('You can only view bookings for your own venues');
    }

    const { status, paymentStatus, startDate, endDate, page = 1, limit = 10 } = queryDto;

    const filter: any = { venueId: new Types.ObjectId(venueId) };

    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (startDate || endDate) {
      filter.eventDate = {};
      if (startDate) filter.eventDate.$gte = new Date(startDate);
      if (endDate) filter.eventDate.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      this.bookingModel
        .find(filter)
        .populate('userId', 'name email phoneNumber')
        .skip(skip)
        .limit(limit)
        .sort({ eventDate: -1 }),
      this.bookingModel.countDocuments(filter),
    ]);

    return {
      data: bookings,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string): Promise<BookingDocument> {
    const booking = await this.bookingModel
      .findById(id)
      .populate('venueId', 'name address city images pricePerHour')
      .populate('userId', 'name email phoneNumber');

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async updateStatus(
    id: string,
    updateDto: UpdateBookingStatusDto,
    userId: string,
    userRole: string,
  ): Promise<BookingDocument> {
    const booking = await this.bookingModel.findById(id);

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Check if user is the booking owner, venue owner, or admin
    const venue = await this.venueService.findById(booking.venueId.toString());
    const isBookingOwner = booking.userId.toString() === userId;
    const isVenueOwner = venue.ownerId.toString() === userId;
    const isAdmin = userRole === 'ADMIN';

    if (!isBookingOwner && !isVenueOwner && !isAdmin) {
      throw new ForbiddenException('You do not have permission to update this booking');
    }

    // Users can only cancel their own bookings
    if (isBookingOwner && !isVenueOwner && !isAdmin) {
      if (updateDto.status && updateDto.status !== BookingStatus.CANCELLED) {
        throw new ForbiddenException('You can only cancel your own bookings');
      }
    }

    if (updateDto.status === BookingStatus.CANCELLED) {
      booking.cancelledAt = new Date();
      booking.cancellationReason = updateDto.cancellationReason;
      
      // Calculate refund based on venue's cancellation policy
      const refundInfo = await this.calculateRefund(booking, venue);
      booking.refundAmount = refundInfo.refundAmount;
      booking.refundPercentage = refundInfo.refundPercentage;
    }

    if (updateDto.status) booking.status = updateDto.status;
    if (updateDto.paymentStatus) booking.paymentStatus = updateDto.paymentStatus;

    const savedBooking = await booking.save();

    // Send status update email
    if (updateDto.status && updateDto.status !== BookingStatus.PENDING) {
      try {
        const user = await this.userService.findById(booking.userId.toString());
        if (user) {
          await this.emailService.sendBookingStatusUpdateEmail(
            user.email,
            user.name,
            updateDto.status,
            {
              venueName: venue.name,
              eventDate: booking.eventDate.toLocaleDateString(),
              bookingId: booking._id.toString(),
              cancellationReason: updateDto.cancellationReason,
            },
          );
        }
      } catch (error) {
        console.error('Failed to send status update email:', error);
      }
    }

    return savedBooking;
  }

  // Calculate refund based on venue's cancellation policy
  private async calculateRefund(
    booking: BookingDocument,
    venue: VenueDocument,
  ): Promise<{ refundAmount: number; refundPercentage: number; message: string }> {
    const policy = venue.cancellationPolicy || {
      fullRefundHours: 72,
      partialRefundHours: 24,
      partialRefundPercentage: 50,
      noRefundHours: 0,
    };

    const now = new Date();
    const eventDate = new Date(booking.eventDate);
    const hoursUntilEvent = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    let refundPercentage = 0;
    let message = '';

    if (hoursUntilEvent >= policy.fullRefundHours) {
      refundPercentage = 100;
      message = 'Full refund - cancelled more than ' + policy.fullRefundHours + ' hours before event';
    } else if (hoursUntilEvent >= policy.partialRefundHours) {
      refundPercentage = policy.partialRefundPercentage;
      message = `Partial refund (${policy.partialRefundPercentage}%) - cancelled within ${policy.fullRefundHours} hours of event`;
    } else {
      refundPercentage = 0;
      message = 'No refund - cancelled within ' + policy.partialRefundHours + ' hours of event';
    }

    const paidAmount = booking.advancePaid || 0;
    const refundAmount = Math.round((paidAmount * refundPercentage) / 100);

    return { refundAmount, refundPercentage, message };
  }

  // Get refund estimate (without cancelling)
  async getRefundEstimate(bookingId: string, userId: string) {
    const booking = await this.bookingModel.findById(bookingId);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.userId.toString() !== userId) {
      throw new ForbiddenException('You can only check refund for your own bookings');
    }

    const venue = await this.venueService.findById(booking.venueId.toString());
    const refundInfo = await this.calculateRefund(booking, venue);

    return {
      bookingId: booking._id,
      paidAmount: booking.advancePaid || 0,
      ...refundInfo,
      cancellationPolicy: venue.cancellationPolicy,
    };
  }

  async getAvailableSlots(venueId: string, date: string) {
    const venue = await this.venueService.findById(venueId);
    const eventDate = new Date(date);

    // Check if date is blocked
    const dateStr = eventDate.toISOString().split('T')[0];
    const isBlocked = venue.blockedDates.some(
      (d) => new Date(d).toISOString().split('T')[0] === dateStr,
    );

    if (isBlocked) {
      return { available: false, message: 'Date is blocked by venue owner', slots: [] };
    }

    // Get existing bookings for the date
    const startOfDay = new Date(eventDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(eventDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingBookings = await this.bookingModel.find({
      venueId: new Types.ObjectId(venueId),
      eventDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
    });

    // Generate available time slots
    const openingHour = parseInt(venue.openingTime.split(':')[0]);
    const closingHour = parseInt(venue.closingTime.split(':')[0]);
    const bookedSlots = existingBookings.map((b) => ({
      start: b.startTime,
      end: b.endTime,
    }));

    return {
      available: true,
      openingTime: venue.openingTime,
      closingTime: venue.closingTime,
      bookedSlots,
    };
  }

  // ============ Reschedule Booking ============

  async reschedule(
    id: string,
    rescheduleDto: RescheduleBookingDto,
    userId: string,
  ): Promise<BookingDocument> {
    const booking = await this.bookingModel.findById(id);

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Only booking owner can reschedule
    if (booking.userId.toString() !== userId) {
      throw new ForbiddenException('You can only reschedule your own bookings');
    }

    // Can only reschedule PENDING or CONFIRMED bookings
    if (![BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(booking.status)) {
      throw new BadRequestException('Cannot reschedule a cancelled or completed booking');
    }

    // Check if new date/time is available
    const isAvailable = await this.checkAvailability(
      booking.venueId.toString(),
      new Date(rescheduleDto.newEventDate),
      rescheduleDto.newStartTime,
      rescheduleDto.newEndTime,
    );

    if (!isAvailable) {
      throw new BadRequestException('The new date/time is not available');
    }

    // Get venue for recalculating price
    const venue = await this.venueService.findById(booking.venueId.toString());

    // Calculate new total amount
    const startHour = parseInt(rescheduleDto.newStartTime.split(':')[0]);
    const endHour = parseInt(rescheduleDto.newEndTime.split(':')[0]);
    const hours = endHour - startHour;
    const newTotalAmount = hours * venue.pricePerHour;

    // Store old date for notification
    const oldEventDate = booking.eventDate.toLocaleDateString();
    const oldStartTime = booking.startTime;
    const oldEndTime = booking.endTime;

    // Update booking
    booking.eventDate = new Date(rescheduleDto.newEventDate);
    booking.startTime = rescheduleDto.newStartTime;
    booking.endTime = rescheduleDto.newEndTime;
    booking.totalAmount = newTotalAmount;
    booking.balanceAmount = newTotalAmount - booking.advancePaid;

    const savedBooking = await booking.save();

    // Send reschedule notification emails
    try {
      const user = await this.userService.findById(userId);
      const owner = await this.userService.findById(venue.ownerId.toString());

      // Notify customer
      if (user) {
        await this.emailService.sendBookingStatusUpdateEmail(
          user.email,
          user.name,
          'RESCHEDULED',
          {
            venueName: venue.name,
            eventDate: `${oldEventDate} → ${new Date(rescheduleDto.newEventDate).toLocaleDateString()}`,
            bookingId: booking._id.toString(),
          },
        );
      }

      // Notify venue owner
      if (owner) {
        await this.emailService.sendBookingStatusUpdateEmail(
          owner.email,
          owner.name,
          'RESCHEDULED',
          {
            venueName: venue.name,
            eventDate: `${oldEventDate} (${oldStartTime}-${oldEndTime}) → ${new Date(rescheduleDto.newEventDate).toLocaleDateString()} (${rescheduleDto.newStartTime}-${rescheduleDto.newEndTime})`,
            bookingId: booking._id.toString(),
          },
        );
      }
    } catch (error) {
      console.error('Failed to send reschedule notification:', error);
    }

    return savedBooking;
  }

  // Delete/Cancel booking
  async deleteBooking(id: string, userId: string, userRole: string) {
    const booking = await this.bookingModel.findById(id);

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const venue = await this.venueService.findById(booking.venueId.toString());
    const isBookingOwner = booking.userId.toString() === userId;
    const isVenueOwner = venue.ownerId.toString() === userId;
    const isAdmin = userRole === 'ADMIN';

    if (!isBookingOwner && !isVenueOwner && !isAdmin) {
      throw new ForbiddenException('You do not have permission to delete this booking');
    }

    // Can only delete PENDING bookings, others should be cancelled via status update
    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException(
        'Only pending bookings can be deleted. Use cancel status for confirmed bookings.',
      );
    }

    await this.bookingModel.findByIdAndDelete(id);

    return { message: 'Booking deleted successfully' };
  }
}
