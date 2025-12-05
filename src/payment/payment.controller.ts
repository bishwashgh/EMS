import {
  Controller,
  Post,
  Get,
  Query,
  Param,
  Body,
  UseGuards,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { InitiatePaymentDto } from './dto/initiatePayment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // Initiate a new payment
  @Post('initiate')
  @UseGuards(JwtAuthGuard)
  initiatePayment(@Body() dto: InitiatePaymentDto, @Request() req) {
    return this.paymentService.initiatePayment(dto, req.user.userId);
  }

  // Payment success callback (redirected from gateway)
  @Get('success')
  async paymentSuccess(
    @Query('gateway') gateway: string,
    @Query('data') data: string, // eSewa returns base64 encoded data
    @Query('pidx') pidx: string, // Khalti returns pidx
  ) {
    if (gateway === 'esewa' && data) {
      return this.paymentService.verifyEsewaPayment(data);
    } else if (gateway === 'khalti' && pidx) {
      return this.paymentService.verifyKhaltiPayment(pidx);
    }

    return {
      success: false,
      message: 'Invalid payment callback',
    };
  }

  // Payment failure callback
  @Get('failure')
  paymentFailure(@Query('gateway') gateway: string) {
    return {
      success: false,
      message: 'Payment was cancelled or failed',
      gateway,
    };
  }

  // Verify payment manually (if callback didn't work)
  @Post('verify/esewa')
  @UseGuards(JwtAuthGuard)
  verifyEsewa(@Body('data') data: string) {
    return this.paymentService.verifyEsewaPayment(data);
  }

  @Post('verify/khalti')
  @UseGuards(JwtAuthGuard)
  verifyKhalti(@Body('pidx') pidx: string) {
    return this.paymentService.verifyKhaltiPayment(pidx);
  }

  // Get payment details
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getPayment(@Param('id') id: string) {
    return this.paymentService.getPaymentById(id);
  }

  // Get payments for a booking
  @Get('booking/:bookingId')
  @UseGuards(JwtAuthGuard)
  getBookingPayments(@Param('bookingId') bookingId: string) {
    return this.paymentService.getPaymentsByBooking(bookingId);
  }

  // Get user's payment history
  @Get('user/history')
  @UseGuards(JwtAuthGuard)
  getUserPayments(@Request() req) {
    return this.paymentService.getUserPayments(req.user.userId);
  }

  // Request refund
  @Post(':id/refund')
  @UseGuards(JwtAuthGuard)
  requestRefund(
    @Param('id') paymentId: string,
    @Body('reason') reason: string,
    @Request() req,
  ) {
    return this.paymentService.initiateRefund(paymentId, reason, req.user.userId);
  }

  // ==================== Owner Earnings Endpoints ====================

  // Owner: Get earnings summary
  @Get('owner/earnings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  getOwnerEarnings(@Request() req) {
    return this.paymentService.getOwnerEarnings(req.user.userId);
  }

  // Owner: Get detailed transaction history
  @Get('owner/transactions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  getOwnerTransactions(
    @Request() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('venueId') venueId?: string,
  ) {
    return this.paymentService.getOwnerTransactions(
      req.user.userId,
      page,
      limit,
      venueId,
    );
  }
}
