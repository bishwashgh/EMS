import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Booking, BookingDocument, BookingStatus, PaymentStatus } from '../booking/schemas/booking.schema';
import { Venue, VenueDocument } from '../venue/schemas/venue.schema';
import { User, UserDocument } from '../user/schemas/user.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Venue.name) private venueModel: Model<VenueDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  // Owner Dashboard Stats
  async getOwnerDashboard(ownerId: string) {
    const ownerObjectId = new Types.ObjectId(ownerId);

    // Get owner's venues
    const venues = await this.venueModel.find({ ownerId: ownerObjectId });
    const venueIds = venues.map((v) => v._id);

    // Get all bookings for owner's venues
    const bookings = await this.bookingModel.find({
      venueId: { $in: venueIds },
    });

    // Calculate stats
    const totalVenues = venues.length;
    const activeVenues = venues.filter((v) => v.isActive).length;
    const totalBookings = bookings.length;
    const pendingBookings = bookings.filter((b) => b.status === BookingStatus.PENDING).length;
    const confirmedBookings = bookings.filter((b) => b.status === BookingStatus.CONFIRMED).length;
    const completedBookings = bookings.filter((b) => b.status === BookingStatus.COMPLETED).length;
    const cancelledBookings = bookings.filter((b) => b.status === BookingStatus.CANCELLED).length;

    // Revenue stats
    const totalRevenue = bookings
      .filter((b) => b.status === BookingStatus.COMPLETED || b.status === BookingStatus.CONFIRMED)
      .reduce((sum, b) => sum + b.totalAmount, 0);

    const paidAmount = bookings
      .filter((b) => b.paymentStatus === PaymentStatus.PAID)
      .reduce((sum, b) => sum + b.totalAmount, 0);

    const pendingPayments = bookings
      .filter((b) => b.paymentStatus !== PaymentStatus.PAID && b.status !== BookingStatus.CANCELLED)
      .reduce((sum, b) => sum + b.balanceAmount, 0);

    // Upcoming bookings (next 7 days)
    const now = new Date();
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingBookings = await this.bookingModel
      .find({
        venueId: { $in: venueIds },
        eventDate: { $gte: now, $lte: next7Days },
        status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
      })
      .populate('venueId', 'name')
      .populate('userId', 'name email')
      .sort({ eventDate: 1 })
      .limit(10);

    // Monthly revenue (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await this.bookingModel.aggregate([
      {
        $match: {
          venueId: { $in: venueIds },
          createdAt: { $gte: sixMonthsAgo },
          status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          revenue: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Top performing venues
    const venuePerformance = await this.bookingModel.aggregate([
      {
        $match: {
          venueId: { $in: venueIds },
          status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
        },
      },
      {
        $group: {
          _id: '$venueId',
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'venues',
          localField: '_id',
          foreignField: '_id',
          as: 'venue',
        },
      },
      { $unwind: '$venue' },
      {
        $project: {
          venueName: '$venue.name',
          totalBookings: 1,
          totalRevenue: 1,
        },
      },
    ]);

    return {
      venues: {
        total: totalVenues,
        active: activeVenues,
      },
      bookings: {
        total: totalBookings,
        pending: pendingBookings,
        confirmed: confirmedBookings,
        completed: completedBookings,
        cancelled: cancelledBookings,
      },
      revenue: {
        total: totalRevenue,
        paid: paidAmount,
        pending: pendingPayments,
      },
      upcomingBookings,
      monthlyRevenue,
      topVenues: venuePerformance,
    };
  }

  // Admin Dashboard Stats
  async getAdminDashboard() {
    const totalUsers = await this.userModel.countDocuments();
    const totalOwners = await this.userModel.countDocuments({ role: 'OWNER' });
    const totalVenues = await this.venueModel.countDocuments();
    const verifiedVenues = await this.venueModel.countDocuments({ isVerified: true });
    const pendingVerification = await this.venueModel.countDocuments({ isVerified: false });
    const totalBookings = await this.bookingModel.countDocuments();

    // Bookings by status
    const bookingsByStatus = await this.bookingModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Total revenue
    const revenueResult = await this.bookingModel.aggregate([
      {
        $match: {
          status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' },
        },
      },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // Recent bookings
    const recentBookings = await this.bookingModel
      .find()
      .populate('venueId', 'name')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    // Venues pending verification
    const venuesPendingVerification = await this.venueModel
      .find({ isVerified: false })
      .populate('ownerId', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    // Monthly stats (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = await this.bookingModel.aggregate([
      {
        $match: { createdAt: { $gte: sixMonthsAgo } },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          bookings: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [
                { $in: ['$status', [BookingStatus.CONFIRMED, BookingStatus.COMPLETED]] },
                '$totalAmount',
                0,
              ],
            },
          },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Top cities by bookings
    const topCities = await this.venueModel.aggregate([
      {
        $lookup: {
          from: 'bookings',
          localField: '_id',
          foreignField: 'venueId',
          as: 'bookings',
        },
      },
      {
        $group: {
          _id: '$city',
          venueCount: { $sum: 1 },
          bookingCount: { $sum: { $size: '$bookings' } },
        },
      },
      { $sort: { bookingCount: -1 } },
      { $limit: 5 },
    ]);

    return {
      users: {
        total: totalUsers,
        owners: totalOwners,
      },
      venues: {
        total: totalVenues,
        verified: verifiedVenues,
        pendingVerification,
      },
      bookings: {
        total: totalBookings,
        byStatus: bookingsByStatus,
      },
      revenue: {
        total: totalRevenue,
      },
      recentBookings,
      venuesPendingVerification,
      monthlyStats,
      topCities,
    };
  }

  // User Dashboard Stats
  async getUserDashboard(userId: string) {
    const userObjectId = new Types.ObjectId(userId);

    const totalBookings = await this.bookingModel.countDocuments({ userId: userObjectId });
    const upcomingBookings = await this.bookingModel.countDocuments({
      userId: userObjectId,
      eventDate: { $gte: new Date() },
      status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
    });
    const completedBookings = await this.bookingModel.countDocuments({
      userId: userObjectId,
      status: BookingStatus.COMPLETED,
    });

    // Total spent
    const spentResult = await this.bookingModel.aggregate([
      {
        $match: {
          userId: userObjectId,
          status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' },
        },
      },
    ]);
    const totalSpent = spentResult[0]?.total || 0;

    // Upcoming events
    const upcoming = await this.bookingModel
      .find({
        userId: userObjectId,
        eventDate: { $gte: new Date() },
        status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
      })
      .populate('venueId', 'name address city images')
      .sort({ eventDate: 1 })
      .limit(5);

    // Past events
    const pastEvents = await this.bookingModel
      .find({
        userId: userObjectId,
        status: BookingStatus.COMPLETED,
      })
      .populate('venueId', 'name address city images')
      .sort({ eventDate: -1 })
      .limit(5);

    return {
      stats: {
        totalBookings,
        upcomingBookings,
        completedBookings,
        totalSpent,
      },
      upcoming,
      pastEvents,
    };
  }
}
