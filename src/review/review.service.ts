import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument, ReportReason } from './schemas/review.schema';
import { CreateReviewDto } from './dto/createReview.dto';
import { UpdateReviewDto } from './dto/updateReview.dto';
import { VenueService } from '../venue/venue.service';

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    private venueService: VenueService,
  ) {}

  async create(createReviewDto: CreateReviewDto, userId: string): Promise<ReviewDocument> {
    // Check if venue exists
    await this.venueService.findById(createReviewDto.venueId);

    // Check if user already reviewed this venue
    const existingReview = await this.reviewModel.findOne({
      userId: new Types.ObjectId(userId),
      venueId: new Types.ObjectId(createReviewDto.venueId),
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this venue');
    }

    const review = new this.reviewModel({
      ...createReviewDto,
      userId: new Types.ObjectId(userId),
      venueId: new Types.ObjectId(createReviewDto.venueId),
      bookingId: createReviewDto.bookingId
        ? new Types.ObjectId(createReviewDto.bookingId)
        : undefined,
    });

    const savedReview = await review.save();

    // Update venue rating
    await this.updateVenueRating(createReviewDto.venueId);

    return savedReview;
  }

  async findByVenue(venueId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.reviewModel
        .find({ venueId: new Types.ObjectId(venueId) })
        .populate('userId', 'name avatar')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      this.reviewModel.countDocuments({ venueId: new Types.ObjectId(venueId) }),
    ]);

    return {
      data: reviews,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findUserReviews(userId: string) {
    return this.reviewModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('venueId', 'name images')
      .sort({ createdAt: -1 });
  }

  async update(
    id: string,
    updateReviewDto: UpdateReviewDto,
    userId: string,
  ): Promise<ReviewDocument> {
    const review = await this.reviewModel.findById(id);

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Only the review owner can update
    if (review.userId.toString() !== userId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    // Update review fields
    if (updateReviewDto.rating !== undefined) {
      review.rating = updateReviewDto.rating;
    }
    if (updateReviewDto.comment !== undefined) {
      review.comment = updateReviewDto.comment;
    }
    if (updateReviewDto.images !== undefined) {
      review.images = updateReviewDto.images;
    }

    const updatedReview = await review.save();

    // Update venue rating if rating changed
    if (updateReviewDto.rating !== undefined) {
      await this.updateVenueRating(review.venueId.toString());
    }

    return updatedReview;
  }

  async delete(id: string, userId: string, userRole: string): Promise<void> {
    const review = await this.reviewModel.findById(id);

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Check if user is the review owner or admin
    if (review.userId.toString() !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    const venueId = review.venueId.toString();
    await this.reviewModel.findByIdAndDelete(id);

    // Update venue rating after deletion
    await this.updateVenueRating(venueId);
  }

  private async updateVenueRating(venueId: string): Promise<void> {
    const reviews = await this.reviewModel.find({
      venueId: new Types.ObjectId(venueId),
    });

    const reviewCount = reviews.length;
    const avgRating =
      reviewCount > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
        : 0;

    await this.venueService.updateRating(
      venueId,
      Math.round(avgRating * 10) / 10,
      reviewCount,
    );
  }

  // ==================== New Methods ====================

  async findById(id: string): Promise<ReviewDocument> {
    const review = await this.reviewModel
      .findById(id)
      .populate('userId', 'name avatar')
      .populate('venueId', 'name images');

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }

  async markHelpful(reviewId: string, userId: string): Promise<ReviewDocument> {
    const review = await this.reviewModel.findById(reviewId);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Check if user is trying to mark own review
    if (review.userId.toString() === userId) {
      throw new BadRequestException('You cannot mark your own review as helpful');
    }

    const userObjectId = new Types.ObjectId(userId);
    const alreadyMarked = review.helpfulBy.some(
      (id) => id.toString() === userId,
    );

    if (alreadyMarked) {
      // Remove the helpful mark (toggle off)
      review.helpfulBy = review.helpfulBy.filter(
        (id) => id.toString() !== userId,
      );
      review.helpfulCount = Math.max(0, review.helpfulCount - 1);
    } else {
      // Add helpful mark
      review.helpfulBy.push(userObjectId);
      review.helpfulCount += 1;
    }

    return review.save();
  }

  async reportReview(
    reviewId: string,
    userId: string,
    reason: ReportReason,
    description?: string,
  ): Promise<ReviewDocument> {
    const review = await this.reviewModel.findById(reviewId);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Check if user is trying to report own review
    if (review.userId.toString() === userId) {
      throw new BadRequestException('You cannot report your own review');
    }

    // Check if user already reported this review
    const alreadyReported = review.reports.some(
      (report) => report.userId.toString() === userId,
    );

    if (alreadyReported) {
      throw new BadRequestException('You have already reported this review');
    }

    review.reports.push({
      userId: new Types.ObjectId(userId),
      reason,
      description,
      reportedAt: new Date(),
    });

    // Auto-hide if too many reports (e.g., 5+)
    if (review.reports.length >= 5) {
      review.isHidden = true;
    }

    return review.save();
  }

  async addOwnerResponse(
    reviewId: string,
    ownerId: string,
    response: string,
  ): Promise<ReviewDocument> {
    const review = await this.reviewModel.findById(reviewId).populate('venueId');
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Verify that the user owns the venue
    const venue = review.venueId as any;
    if (venue.ownerId.toString() !== ownerId) {
      throw new ForbiddenException('You can only respond to reviews for your own venues');
    }

    review.ownerResponse = response;
    review.ownerResponseAt = new Date();

    return review.save();
  }

  async getReportedReviews(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.reviewModel
        .find({ 'reports.0': { $exists: true } })
        .populate('userId', 'name email')
        .populate('venueId', 'name')
        .skip(skip)
        .limit(limit)
        .sort({ 'reports.length': -1 }),
      this.reviewModel.countDocuments({ 'reports.0': { $exists: true } }),
    ]);

    return {
      data: reviews,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async hideReview(reviewId: string): Promise<ReviewDocument> {
    const review = await this.reviewModel.findById(reviewId);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    review.isHidden = true;
    return review.save();
  }

  async unhideReview(reviewId: string): Promise<ReviewDocument> {
    const review = await this.reviewModel.findById(reviewId);
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    review.isHidden = false;
    review.reports = []; // Clear reports when unhiding
    return review.save();
  }
}
