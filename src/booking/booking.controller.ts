import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/createBooking.dto';
import { UpdateBookingStatusDto } from './dto/updateBookingStatus.dto';
import { QueryBookingDto } from './dto/queryBooking.dto';
import { RescheduleBookingDto } from './dto/rescheduleBooking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  // User: Create a new booking
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createBookingDto: CreateBookingDto, @Request() req) {
    return this.bookingService.create(createBookingDto, req.user.userId);
  }

  // User: Get my bookings
  @Get('my-bookings')
  @UseGuards(JwtAuthGuard)
  findMyBookings(@Query() queryDto: QueryBookingDto, @Request() req) {
    return this.bookingService.findUserBookings(req.user.userId, queryDto);
  }

  // Owner: Get bookings for a venue
  @Get('venue/:venueId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  findVenueBookings(
    @Param('venueId') venueId: string,
    @Query() queryDto: QueryBookingDto,
    @Request() req,
  ) {
    return this.bookingService.findVenueBookings(venueId, req.user.userId, queryDto);
  }

  // Public: Check availability for a venue on a date
  @Get('availability/:venueId')
  checkAvailability(
    @Param('venueId') venueId: string,
    @Query('date') date: string,
  ) {
    return this.bookingService.getAvailableSlots(venueId, date);
  }

  // Get booking by ID
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findById(@Param('id') id: string) {
    return this.bookingService.findById(id);
  }

  // Update booking status (confirm, cancel, complete)
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateBookingStatusDto,
    @Request() req,
  ) {
    return this.bookingService.updateStatus(id, updateDto, req.user.userId, req.user.role);
  }

  // User: Reschedule booking
  @Patch(':id/reschedule')
  @UseGuards(JwtAuthGuard)
  reschedule(
    @Param('id') id: string,
    @Body() rescheduleDto: RescheduleBookingDto,
    @Request() req,
  ) {
    return this.bookingService.reschedule(id, rescheduleDto, req.user.userId);
  }

  // User: Get refund estimate before cancelling
  @Get(':id/refund-estimate')
  @UseGuards(JwtAuthGuard)
  getRefundEstimate(@Param('id') id: string, @Request() req) {
    return this.bookingService.getRefundEstimate(id, req.user.userId);
  }

  // User: Delete/Cancel booking
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteBooking(@Param('id') id: string, @Request() req) {
    return this.bookingService.deleteBooking(id, req.user.userId, req.user.role);
  }
}
