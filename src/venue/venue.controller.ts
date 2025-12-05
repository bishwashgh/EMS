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
  ParseIntPipe,
  DefaultValuePipe,
  ParseFloatPipe,
} from '@nestjs/common';
import { VenueService } from './venue.service';
import { CreateVenueDto } from './dto/createVenue.dto';
import { UpdateVenueDto } from './dto/updateVenue.dto';
import { QueryVenueDto } from './dto/queryVenue.dto';
import { CreateInquiryDto } from './dto/createInquiry.dto';
import { RespondInquiryDto } from './dto/respondInquiry.dto';
import { SetFeaturedDto } from './dto/setFeatured.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@Controller('venues')
export class VenueController {
  constructor(private readonly venueService: VenueService) {}

  // ==================== Public Endpoints ====================

  // Public: List all venues with filters
  @Get()
  findAll(@Query() queryDto: QueryVenueDto) {
    return this.venueService.findAll(queryDto);
  }

  // Public: Get featured venues
  @Get('featured')
  findFeatured(@Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number) {
    return this.venueService.findFeatured(limit);
  }

  // Public: Get popular venues
  @Get('popular')
  findPopular(@Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number) {
    return this.venueService.findPopular(limit);
  }

  // Public: Get nearby venues by coordinates
  @Get('nearby')
  findNearby(
    @Query('latitude', ParseFloatPipe) latitude: number,
    @Query('longitude', ParseFloatPipe) longitude: number,
    @Query('radius', new DefaultValuePipe(10), ParseIntPipe) radiusKm: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.venueService.findNearby(latitude, longitude, radiusKm, limit);
  }

  // Public: Get single venue by ID
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.venueService.findById(id);
  }

  // ==================== Owner Endpoints ====================

  // Owner/Admin: Create a new venue
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  create(@Body() createVenueDto: CreateVenueDto, @Request() req) {
    return this.venueService.create(createVenueDto, req.user.userId);
  }

  // Owner: Get my venues
  @Get('owner/my-venues')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  findMyVenues(@Request() req) {
    return this.venueService.findByOwner(req.user.userId);
  }

  // Owner/Admin: Update venue
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  update(
    @Param('id') id: string,
    @Body() updateVenueDto: UpdateVenueDto,
    @Request() req,
  ) {
    return this.venueService.update(id, updateVenueDto, req.user.userId, req.user.role);
  }

  // Owner/Admin: Delete venue
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  delete(@Param('id') id: string, @Request() req) {
    return this.venueService.delete(id, req.user.userId, req.user.role);
  }

  // Owner: Block dates for venue
  @Post(':id/block-dates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  blockDates(
    @Param('id') id: string,
    @Body('dates') dates: Date[],
    @Request() req,
  ) {
    return this.venueService.blockDates(id, dates, req.user.userId);
  }

  // Owner: Unblock dates for venue
  @Post(':id/unblock-dates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  unblockDates(
    @Param('id') id: string,
    @Body('dates') dates: Date[],
    @Request() req,
  ) {
    return this.venueService.unblockDates(id, dates, req.user.userId);
  }

  // ==================== Inquiry Endpoints ====================

  // Public/User: Send inquiry to venue (optionally authenticated)
  @Post(':id/inquiries')
  @UseGuards(OptionalJwtAuthGuard)
  createInquiry(
    @Param('id') venueId: string,
    @Body() createInquiryDto: CreateInquiryDto,
    @Request() req,
  ) {
    const userId = req.user?.userId;
    return this.venueService.createInquiry(venueId, createInquiryDto, userId);
  }

  // Owner: Get inquiries for a venue
  @Get(':id/inquiries')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  findVenueInquiries(@Param('id') venueId: string, @Request() req) {
    return this.venueService.findInquiriesByVenue(venueId, req.user.userId, req.user.role);
  }

  // User: Get my inquiries
  @Get('inquiries/my')
  @UseGuards(JwtAuthGuard)
  findMyInquiries(@Request() req) {
    return this.venueService.findInquiriesByUser(req.user.userId);
  }

  // Owner: Respond to an inquiry
  @Patch('inquiries/:inquiryId/respond')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  respondToInquiry(
    @Param('inquiryId') inquiryId: string,
    @Body() respondDto: RespondInquiryDto,
    @Request() req,
  ) {
    return this.venueService.respondToInquiry(
      inquiryId,
      respondDto.response,
      req.user.userId,
      req.user.role,
    );
  }

  // Owner/User/Admin: Close an inquiry
  @Patch('inquiries/:inquiryId/close')
  @UseGuards(JwtAuthGuard)
  closeInquiry(@Param('inquiryId') inquiryId: string, @Request() req) {
    return this.venueService.closeInquiry(inquiryId, req.user.userId, req.user.role);
  }

  // Get single inquiry
  @Get('inquiries/:inquiryId')
  @UseGuards(JwtAuthGuard)
  getInquiry(@Param('inquiryId') inquiryId: string, @Request() req) {
    return this.venueService.getInquiryById(inquiryId, req.user.userId, req.user.role);
  }

  // ==================== Admin Endpoints ====================

  // Admin: Verify venue
  @Patch(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  verifyVenue(@Param('id') id: string) {
    return this.venueService.verifyVenue(id);
  }

  // Admin: Set venue as featured
  @Patch(':id/featured')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  setFeatured(@Param('id') id: string, @Body() setFeaturedDto: SetFeaturedDto) {
    const featuredUntil = setFeaturedDto.featuredUntil
      ? new Date(setFeaturedDto.featuredUntil)
      : undefined;
    return this.venueService.setFeatured(id, setFeaturedDto.isFeatured, featuredUntil);
  }
}
