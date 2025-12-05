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
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/createReview.dto';
import { UpdateReviewDto } from './dto/updateReview.dto';
import { ReportReviewDto } from './dto/reportReview.dto';
import { OwnerResponseDto } from './dto/ownerResponse.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  // ==================== Public Endpoints ====================

  // Public: Get reviews for a venue
  @Get('venue/:venueId')
  findByVenue(
    @Param('venueId') venueId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.reviewService.findByVenue(venueId, page, limit);
  }

  // Public: Get single review by ID
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.reviewService.findById(id);
  }

  // ==================== User Endpoints ====================

  // User: Create a review
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createReviewDto: CreateReviewDto, @Request() req) {
    return this.reviewService.create(createReviewDto, req.user.userId);
  }

  // User: Get my reviews
  @Get('user/my-reviews')
  @UseGuards(JwtAuthGuard)
  findMyReviews(@Request() req) {
    return this.reviewService.findUserReviews(req.user.userId);
  }

  // User: Update own review
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateReviewDto: UpdateReviewDto,
    @Request() req,
  ) {
    return this.reviewService.update(id, updateReviewDto, req.user.userId);
  }

  // User/Admin: Delete a review
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  delete(@Param('id') id: string, @Request() req) {
    return this.reviewService.delete(id, req.user.userId, req.user.role);
  }

  // User: Mark review as helpful (toggle)
  @Post(':id/helpful')
  @UseGuards(JwtAuthGuard)
  markHelpful(@Param('id') id: string, @Request() req) {
    return this.reviewService.markHelpful(id, req.user.userId);
  }

  // User: Report inappropriate review
  @Post(':id/report')
  @UseGuards(JwtAuthGuard)
  reportReview(
    @Param('id') id: string,
    @Body() reportDto: ReportReviewDto,
    @Request() req,
  ) {
    return this.reviewService.reportReview(
      id,
      req.user.userId,
      reportDto.reason,
      reportDto.description,
    );
  }

  // ==================== Owner Endpoints ====================

  // Owner: Respond to a review
  @Post(':id/owner-response')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  addOwnerResponse(
    @Param('id') id: string,
    @Body() responseDto: OwnerResponseDto,
    @Request() req,
  ) {
    return this.reviewService.addOwnerResponse(id, req.user.userId, responseDto.response);
  }

  // ==================== Admin Endpoints ====================

  // Admin: Get all reported reviews
  @Get('admin/reported')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  getReportedReviews(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.reviewService.getReportedReviews(page, limit);
  }

  // Admin: Hide a review
  @Patch(':id/hide')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  hideReview(@Param('id') id: string) {
    return this.reviewService.hideReview(id);
  }

  // Admin: Unhide a review
  @Patch(':id/unhide')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  unhideReview(@Param('id') id: string) {
    return this.reviewService.unhideReview(id);
  }
}
