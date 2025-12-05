import { Injectable, BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';
import {
  Payment,
  PaymentDocument,
  PaymentGateway,
  PaymentType,
  TransactionStatus,
} from './schemas/payment.schema';
import { InitiatePaymentDto } from './dto/initiatePayment.dto';
import { Booking, BookingDocument, PaymentStatus } from '../booking/schemas/booking.schema';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  // eSewa URLs
  private readonly esewaPaymentUrl: string;
  private readonly esewaVerifyUrl: string;
  private readonly esewaMerchantCode: string;
  private readonly esewaSecretKey: string;

  // Khalti URLs
  private readonly khaltiPaymentUrl: string;
  private readonly khaltiVerifyUrl: string;
  private readonly khaltiSecretKey: string;

  // App URLs
  private readonly successUrl: string;
  private readonly failureUrl: string;

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    private configService: ConfigService,
  ) {
    // eSewa Config (sandbox vs production)
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    
    this.esewaPaymentUrl = isProduction
      ? 'https://esewa.com.np/epay/main'
      : 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';
    
    this.esewaVerifyUrl = isProduction
      ? 'https://esewa.com.np/epay/transrec'
      : 'https://rc-epay.esewa.com.np/api/epay/transaction/status/';

    this.esewaMerchantCode = this.configService.get<string>('ESEWA_MERCHANT_CODE') || 'EPAYTEST';
    this.esewaSecretKey = this.configService.get<string>('ESEWA_SECRET_KEY') || '8gBm/:&EnhH.1/q';

    // Khalti Config
    this.khaltiPaymentUrl = isProduction
      ? 'https://khalti.com/api/v2/epayment/initiate/'
      : 'https://a.khalti.com/api/v2/epayment/initiate/';
    
    this.khaltiVerifyUrl = isProduction
      ? 'https://khalti.com/api/v2/epayment/lookup/'
      : 'https://a.khalti.com/api/v2/epayment/lookup/';

    this.khaltiSecretKey = this.configService.get<string>('KHALTI_SECRET_KEY') || '';

    // App URLs for callbacks
    const appUrl = this.configService.get<string>('APP_URL') || 'http://localhost:3000';
    this.successUrl = `${appUrl}/api/payments/success`;
    this.failureUrl = `${appUrl}/api/payments/failure`;
  }

  // Generate unique reference ID
  private generateReferenceId(): string {
    return `PAY-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  }

  // Generate eSewa signature
  private generateEsewaSignature(message: string): string {
    const hash = crypto
      .createHmac('sha256', this.esewaSecretKey)
      .update(message)
      .digest('base64');
    return hash;
  }

  // Initiate payment
  async initiatePayment(dto: InitiatePaymentDto, userId: string) {
    // Find the booking
    const booking = await this.bookingModel.findById(dto.bookingId);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Check if user owns the booking
    if (booking.userId.toString() !== userId) {
      throw new BadRequestException('You can only pay for your own bookings');
    }

    // Determine payment type
    const paymentType = dto.paymentType || PaymentType.FULL;
    
    // Validate amount based on payment type
    if (paymentType === PaymentType.ADVANCE && dto.amount < booking.totalAmount * 0.2) {
      throw new BadRequestException('Advance payment must be at least 20% of total amount');
    }

    if (paymentType === PaymentType.FULL && dto.amount !== booking.totalAmount) {
      throw new BadRequestException('Full payment amount must match booking total');
    }

    if (paymentType === PaymentType.BALANCE) {
      const expectedBalance = booking.totalAmount - booking.advancePaid;
      if (dto.amount !== expectedBalance) {
        throw new BadRequestException(`Balance payment must be Rs. ${expectedBalance}`);
      }
    }

    // Generate reference ID
    const referenceId = this.generateReferenceId();

    // Create payment record
    const payment = await this.paymentModel.create({
      bookingId: booking._id,
      userId,
      venueId: booking.venueId,
      amount: dto.amount,
      gateway: dto.gateway,
      paymentType,
      status: TransactionStatus.INITIATED,
      referenceId,
    });

    // Generate gateway-specific payment data
    if (dto.gateway === PaymentGateway.ESEWA) {
      return this.generateEsewaPaymentData(payment, booking);
    } else if (dto.gateway === PaymentGateway.KHALTI) {
      return this.generateKhaltiPaymentData(payment, booking);
    }

    throw new BadRequestException('Invalid payment gateway');
  }

  // Generate eSewa payment form data
  private generateEsewaPaymentData(payment: PaymentDocument, booking: BookingDocument) {
    const amount = payment.amount;
    const taxAmount = 0;
    const serviceCharge = 0;
    const deliveryCharge = 0;
    const totalAmount = amount + taxAmount + serviceCharge + deliveryCharge;

    // Generate signature for eSewa
    const signatureMessage = `total_amount=${totalAmount},transaction_uuid=${payment.referenceId},product_code=${this.esewaMerchantCode}`;
    const signature = this.generateEsewaSignature(signatureMessage);

    return {
      paymentId: payment._id,
      referenceId: payment.referenceId,
      gateway: PaymentGateway.ESEWA,
      paymentUrl: this.esewaPaymentUrl,
      formData: {
        amount: amount.toString(),
        tax_amount: taxAmount.toString(),
        total_amount: totalAmount.toString(),
        transaction_uuid: payment.referenceId,
        product_code: this.esewaMerchantCode,
        product_service_charge: serviceCharge.toString(),
        product_delivery_charge: deliveryCharge.toString(),
        success_url: `${this.successUrl}?gateway=esewa`,
        failure_url: `${this.failureUrl}?gateway=esewa`,
        signed_field_names: 'total_amount,transaction_uuid,product_code',
        signature,
      },
    };
  }

  // Generate Khalti payment initiation
  private async generateKhaltiPaymentData(payment: PaymentDocument, booking: BookingDocument) {
    if (!this.khaltiSecretKey) {
      this.logger.warn('[DEV MODE] Khalti not configured. Returning mock payment data.');
      return {
        paymentId: payment._id,
        referenceId: payment.referenceId,
        gateway: PaymentGateway.KHALTI,
        message: 'Khalti not configured. Set KHALTI_SECRET_KEY in .env',
        mockPaymentUrl: `${this.successUrl}?gateway=khalti&pidx=mock_${payment.referenceId}`,
      };
    }

    try {
      const response = await axios.post(
        this.khaltiPaymentUrl,
        {
          return_url: `${this.successUrl}?gateway=khalti`,
          website_url: this.configService.get<string>('APP_URL') || 'http://localhost:3000',
          amount: payment.amount * 100, // Khalti uses paisa
          purchase_order_id: payment.referenceId,
          purchase_order_name: `Booking for venue`,
          customer_info: {
            name: 'Customer',
            email: '',
            phone: '',
          },
        },
        {
          headers: {
            Authorization: `Key ${this.khaltiSecretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      // Update payment with Khalti's pidx
      await this.paymentModel.findByIdAndUpdate(payment._id, {
        transactionId: response.data.pidx,
        gatewayResponse: response.data,
      });

      return {
        paymentId: payment._id,
        referenceId: payment.referenceId,
        gateway: PaymentGateway.KHALTI,
        paymentUrl: response.data.payment_url,
        pidx: response.data.pidx,
      };
    } catch (error) {
      this.logger.error('Khalti initiation failed:', error.response?.data || error.message);
      throw new BadRequestException('Failed to initiate Khalti payment');
    }
  }

  // Verify eSewa payment
  async verifyEsewaPayment(data: string) {
    try {
      // Decode base64 response from eSewa
      const decodedData = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
      
      const { transaction_uuid, total_amount, transaction_code, status } = decodedData;

      // Find payment by reference ID
      const payment = await this.paymentModel.findOne({ referenceId: transaction_uuid });
      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      if (status === 'COMPLETE') {
        // Update payment status
        payment.status = TransactionStatus.COMPLETED;
        payment.transactionId = transaction_code;
        payment.gatewayResponse = decodedData;
        await payment.save();

        // Update booking payment status
        await this.updateBookingPayment(payment);

        return {
          success: true,
          message: 'Payment verified successfully',
          payment,
        };
      } else {
        payment.status = TransactionStatus.FAILED;
        payment.gatewayResponse = decodedData;
        await payment.save();

        return {
          success: false,
          message: 'Payment failed',
          payment,
        };
      }
    } catch (error) {
      this.logger.error('eSewa verification failed:', error);
      throw new BadRequestException('Payment verification failed');
    }
  }

  // Verify Khalti payment
  async verifyKhaltiPayment(pidx: string) {
    // Find payment by pidx (stored in transactionId)
    let payment = await this.paymentModel.findOne({ transactionId: pidx });
    
    // If not found by transactionId, try reference ID (for mock payments)
    if (!payment && pidx.startsWith('mock_')) {
      const referenceId = pidx.replace('mock_', '');
      payment = await this.paymentModel.findOne({ referenceId });
    }

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // If Khalti is not configured (dev mode), auto-complete
    if (!this.khaltiSecretKey) {
      payment.status = TransactionStatus.COMPLETED;
      payment.transactionId = pidx;
      payment.gatewayResponse = { mock: true, pidx };
      await payment.save();
      await this.updateBookingPayment(payment);

      return {
        success: true,
        message: '[DEV MODE] Payment marked as completed',
        payment,
      };
    }

    try {
      const response = await axios.post(
        this.khaltiVerifyUrl,
        { pidx },
        {
          headers: {
            Authorization: `Key ${this.khaltiSecretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const { status, transaction_id } = response.data;

      if (status === 'Completed') {
        payment.status = TransactionStatus.COMPLETED;
        payment.transactionId = transaction_id;
        payment.gatewayResponse = response.data;
        await payment.save();

        await this.updateBookingPayment(payment);

        return {
          success: true,
          message: 'Payment verified successfully',
          payment,
        };
      } else {
        payment.status = TransactionStatus.FAILED;
        payment.gatewayResponse = response.data;
        await payment.save();

        return {
          success: false,
          message: `Payment status: ${status}`,
          payment,
        };
      }
    } catch (error) {
      this.logger.error('Khalti verification failed:', error.response?.data || error.message);
      throw new BadRequestException('Payment verification failed');
    }
  }

  // Update booking after successful payment
  private async updateBookingPayment(payment: PaymentDocument) {
    const booking = await this.bookingModel.findById(payment.bookingId);
    if (!booking) return;

    if (payment.paymentType === PaymentType.ADVANCE) {
      booking.advancePaid = payment.amount;
      booking.balanceAmount = booking.totalAmount - payment.amount;
      booking.paymentStatus = PaymentStatus.PARTIAL;
    } else if (payment.paymentType === PaymentType.FULL) {
      booking.advancePaid = payment.amount;
      booking.balanceAmount = 0;
      booking.paymentStatus = PaymentStatus.PAID;
    } else if (payment.paymentType === PaymentType.BALANCE) {
      booking.advancePaid += payment.amount;
      booking.balanceAmount = 0;
      booking.paymentStatus = PaymentStatus.PAID;
    }

    await booking.save();
  }

  // Get payment by ID
  async getPaymentById(paymentId: string) {
    const payment = await this.paymentModel
      .findById(paymentId)
      .populate('bookingId')
      .populate('venueId', 'name');
    
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  // Get payments for a booking
  async getPaymentsByBooking(bookingId: string) {
    return this.paymentModel
      .find({ bookingId })
      .sort({ createdAt: -1 });
  }

  // Get user's payment history
  async getUserPayments(userId: string) {
    return this.paymentModel
      .find({ userId })
      .populate('bookingId')
      .populate('venueId', 'name')
      .sort({ createdAt: -1 });
  }

  // Process refund
  async initiateRefund(paymentId: string, reason: string, userId: string) {
    const originalPayment = await this.paymentModel.findById(paymentId);
    if (!originalPayment) {
      throw new NotFoundException('Payment not found');
    }

    if (originalPayment.status !== TransactionStatus.COMPLETED) {
      throw new BadRequestException('Can only refund completed payments');
    }

    // Create refund record
    const refund = await this.paymentModel.create({
      bookingId: originalPayment.bookingId,
      userId,
      venueId: originalPayment.venueId,
      amount: -originalPayment.amount, // Negative amount for refund
      gateway: originalPayment.gateway,
      paymentType: PaymentType.REFUND,
      status: TransactionStatus.PENDING,
      referenceId: this.generateReferenceId(),
      refundReason: reason,
      originalPaymentId: originalPayment._id,
    });

    // Note: Actual refund processing would require gateway-specific API calls
    // For now, we mark it as pending for manual processing
    this.logger.log(`Refund initiated: ${refund.referenceId} for payment ${paymentId}`);

    return {
      message: 'Refund request submitted. It will be processed within 3-5 business days.',
      refund,
    };
  }

  // ==================== Owner Earnings ====================

  // Get owner's earnings summary
  async getOwnerEarnings(ownerId: string) {
    // Get all venues owned by the owner
    const earnings = await this.paymentModel.aggregate([
      {
        $lookup: {
          from: 'venues',
          localField: 'venueId',
          foreignField: '_id',
          as: 'venue',
        },
      },
      { $unwind: '$venue' },
      {
        $match: {
          'venue.ownerId': new (require('mongoose').Types.ObjectId)(ownerId),
          status: TransactionStatus.COMPLETED,
          paymentType: { $ne: PaymentType.REFUND },
        },
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$amount' },
          totalTransactions: { $sum: 1 },
          averageTransaction: { $avg: '$amount' },
        },
      },
    ]);

    // Get monthly earnings breakdown
    const monthlyEarnings = await this.paymentModel.aggregate([
      {
        $lookup: {
          from: 'venues',
          localField: 'venueId',
          foreignField: '_id',
          as: 'venue',
        },
      },
      { $unwind: '$venue' },
      {
        $match: {
          'venue.ownerId': new (require('mongoose').Types.ObjectId)(ownerId),
          status: TransactionStatus.COMPLETED,
          paymentType: { $ne: PaymentType.REFUND },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          earnings: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 },
    ]);

    // Get earnings by venue
    const earningsByVenue = await this.paymentModel.aggregate([
      {
        $lookup: {
          from: 'venues',
          localField: 'venueId',
          foreignField: '_id',
          as: 'venue',
        },
      },
      { $unwind: '$venue' },
      {
        $match: {
          'venue.ownerId': new (require('mongoose').Types.ObjectId)(ownerId),
          status: TransactionStatus.COMPLETED,
          paymentType: { $ne: PaymentType.REFUND },
        },
      },
      {
        $group: {
          _id: '$venueId',
          venueName: { $first: '$venue.name' },
          totalEarnings: { $sum: '$amount' },
          transactionCount: { $sum: 1 },
        },
      },
      { $sort: { totalEarnings: -1 } },
    ]);

    // Calculate pending payouts (completed payments minus refunds)
    const refunds = await this.paymentModel.aggregate([
      {
        $lookup: {
          from: 'venues',
          localField: 'venueId',
          foreignField: '_id',
          as: 'venue',
        },
      },
      { $unwind: '$venue' },
      {
        $match: {
          'venue.ownerId': new (require('mongoose').Types.ObjectId)(ownerId),
          paymentType: PaymentType.REFUND,
        },
      },
      {
        $group: {
          _id: null,
          totalRefunds: { $sum: { $abs: '$amount' } },
        },
      },
    ]);

    const summary = earnings[0] || {
      totalEarnings: 0,
      totalTransactions: 0,
      averageTransaction: 0,
    };

    const totalRefunds = refunds[0]?.totalRefunds || 0;
    const platformFeePercentage = 10; // 10% platform fee
    const platformFee = summary.totalEarnings * (platformFeePercentage / 100);
    const netEarnings = summary.totalEarnings - totalRefunds - platformFee;

    return {
      summary: {
        totalEarnings: summary.totalEarnings,
        totalRefunds,
        platformFee,
        platformFeePercentage,
        netEarnings,
        totalTransactions: summary.totalTransactions,
        averageTransaction: Math.round(summary.averageTransaction * 100) / 100,
      },
      monthlyEarnings: monthlyEarnings.map((item) => ({
        year: item._id.year,
        month: item._id.month,
        earnings: item.earnings,
        transactions: item.count,
      })),
      earningsByVenue,
    };
  }

  // Get detailed transaction history for owner
  async getOwnerTransactions(
    ownerId: string,
    page = 1,
    limit = 20,
    venueId?: string,
  ) {
    const skip = (page - 1) * limit;

    // Build match conditions
    const matchConditions: any = {
      'venue.ownerId': new (require('mongoose').Types.ObjectId)(ownerId),
    };

    if (venueId) {
      matchConditions.venueId = new (require('mongoose').Types.ObjectId)(venueId);
    }

    const [transactions, countResult] = await Promise.all([
      this.paymentModel.aggregate([
        {
          $lookup: {
            from: 'venues',
            localField: 'venueId',
            foreignField: '_id',
            as: 'venue',
          },
        },
        { $unwind: '$venue' },
        { $match: matchConditions },
        {
          $lookup: {
            from: 'bookings',
            localField: 'bookingId',
            foreignField: '_id',
            as: 'booking',
          },
        },
        { $unwind: { path: '$booking', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            referenceId: 1,
            amount: 1,
            gateway: 1,
            paymentType: 1,
            status: 1,
            createdAt: 1,
            'venue.name': 1,
            'booking.eventDate': 1,
            'booking.eventType': 1,
            'user.name': 1,
            'user.email': 1,
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
      ]),
      this.paymentModel.aggregate([
        {
          $lookup: {
            from: 'venues',
            localField: 'venueId',
            foreignField: '_id',
            as: 'venue',
          },
        },
        { $unwind: '$venue' },
        { $match: matchConditions },
        { $count: 'total' },
      ]),
    ]);

    const total = countResult[0]?.total || 0;

    return {
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
